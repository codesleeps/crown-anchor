const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 55555;

// Database files setup
const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'users.json');

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR);
}
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}));
}

function loadUsers() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

function saveUsers(users) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('Error saving database:', e);
    }
}

// Memory storage for gameplay rooms and tournament state
const rooms = {}; // roomCode -> roomState
let tournament = null; // Global active tournament state
const tournamentQueue = []; // Client objects waiting for tournament to start

const symbols = ['crown', 'anchor', 'heart', 'diamond', 'club', 'spade'];

// Static file server
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
    let urlPath = req.url === '/' ? 'index.html' : req.url.split('?')[0];
    let filePath = path.join(__dirname, urlPath);
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// WebSocket Server Handshake and Framing (RFC 6455)
const clients = new Set();

server.on('upgrade', (req, socket, head) => {
    if (req.headers['upgrade']?.toLowerCase() !== 'websocket') {
        socket.destroy();
        return;
    }

    const key = req.headers['sec-websocket-key'];
    const acceptKey = crypto
        .createHash('sha1')
        .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64');

    const responseHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
        '\r\n'
    ];

    socket.write(responseHeaders.join('\r\n'));

    // Client connection representation
    const client = {
        socket,
        id: Math.random().toString(36).substring(2, 9),
        username: null,
        roomCode: null,
        send(event, data) {
            sendWSMessage(socket, { event, data });
        }
    };

    clients.add(client);
    console.log(`WebSocket client connected: ${client.id}`);

    let buffer = Buffer.alloc(0);

    socket.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        while (buffer.length >= 2) {
            const firstByte = buffer[0];
            const secondByte = buffer[1];
            
            const isFinalFrame = (firstByte & 0x80) !== 0;
            const opCode = firstByte & 0x0F;
            const isMasked = (secondByte & 0x80) !== 0;
            
            let payloadLength = secondByte & 0x7F;
            let headerLength = 2;
            
            if (payloadLength === 126) {
                if (buffer.length < 4) break;
                payloadLength = buffer.readUInt16BE(2);
                headerLength = 4;
            } else if (payloadLength === 127) {
                if (buffer.length < 10) break;
                payloadLength = Number(buffer.readBigUInt64BE(2));
                headerLength = 10;
            }
            
            let maskKeyOffset = headerLength;
            if (isMasked) {
                headerLength += 4;
            }
            
            if (buffer.length < headerLength + payloadLength) break;
            
            const payload = buffer.subarray(headerLength, headerLength + payloadLength);
            
            if (isMasked) {
                const maskKey = buffer.subarray(maskKeyOffset, maskKeyOffset + 4);
                for (let i = 0; i < payload.length; i++) {
                    payload[i] ^= maskKey[i % 4];
                }
            }
            
            if (opCode === 0x08) {
                socket.end();
            } else if (opCode === 0x01 || opCode === 0x02) {
                const text = payload.toString('utf8');
                try {
                    const msg = JSON.parse(text);
                    handleClientMessage(client, msg.event, msg.data);
                } catch (e) {
                    console.error('Error parsing WS message:', e);
                }
            } else if (opCode === 0x09) {
                sendRawWSFrame(socket, 0x0A, payload);
            }
            
            buffer = buffer.subarray(headerLength + payloadLength);
        }
    });

    socket.on('close', () => {
        clients.delete(client);
        handleClientDisconnect(client);
        console.log(`WebSocket client disconnected: ${client.id}`);
    });

    socket.on('error', (err) => {
        console.error(`Socket error: ${err.message}`);
        socket.destroy();
    });
});

function sendWSMessage(socket, obj) {
    const payload = Buffer.from(JSON.stringify(obj), 'utf8');
    sendRawWSFrame(socket, 0x01, payload);
}

function sendRawWSFrame(socket, opCode, payload) {
    if (socket.destroyed) return;
    
    const length = payload.length;
    let header;
    
    if (length < 126) {
        header = Buffer.alloc(2);
        header[0] = 0x80 | opCode;
        header[1] = length;
    } else if (length <= 0xFFFF) {
        header = Buffer.alloc(4);
        header[0] = 0x80 | opCode;
        header[1] = 126;
        header.writeUInt16BE(length, 2);
    } else {
        header = Buffer.alloc(10);
        header[0] = 0x80 | opCode;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(length), 2);
    }
    
    socket.write(Buffer.concat([header, payload]));
}

// Room/Tournament broadcasting helper
function broadcastToRoom(roomCode, event, data) {
    for (const client of clients) {
        if (client.roomCode === roomCode) {
            client.send(event, data);
        }
    }
}

function broadcastAll(event, data) {
    for (const client of clients) {
        client.send(event, data);
    }
}

function findRoomByClient(client) {
    return rooms[client.roomCode];
}

// Logic Router
function handleClientMessage(client, event, data) {
    switch (event) {
        case 'login':
            handleLogin(client, data);
            break;
        case 'update_profile':
            handleUpdateProfile(client, data);
            break;
        case 'mp_create_room':
            handleMpCreateRoom(client, data);
            break;
        case 'mp_join_room':
            handleMpJoinRoom(client, data);
            break;
        case 'mp_toggle_ready':
            handleMpToggleReady(client);
            break;
        case 'mp_place_bet':
            handleMpPlaceBet(client, data);
            break;
        case 'mp_clear_bets':
            handleMpClearBets(client);
            break;
        case 'mp_request_roll':
            handleMpRequestRoll(client);
            break;
        case 'join_tournament':
            handleJoinTournament(client, data);
            break;
        case 'start_tournament':
            handleStartTournament(client);
            break;
        case 'start_tournament_match':
            handleStartTournamentMatch(client, data);
            break;
        case 'tournament_place_bet':
            handleTournamentPlaceBet(client, data);
            break;
    }
}

function handleLogin(client, data) {
    const username = data?.username;
    if (!username || typeof username !== 'string' || !username.trim()) {
        client.send('login_response', { error: 'Invalid username' });
        return;
    }
    const name = username.trim();
    const users = loadUsers();

    if (!users[name]) {
        users[name] = {
            username: name,
            balance: 100,
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                winRate: '0%',
                biggestWin: 0,
                totalWagered: 0,
                netProfit: 0
            },
            achievements: {
                firstWin: { unlocked: false, title: 'First Victory', description: 'Win your first game', icon: '🎉' },
                bigWin: { unlocked: false, title: 'Big Winner', description: 'Win $100+ in a single round', icon: '💰' },
                hotStreak: { unlocked: false, title: 'Hot Streak', description: 'Win 5 games in a row', icon: '🔥' },
                unstoppable: { unlocked: false, title: 'Unstoppable', description: 'Win 10 games in a row', icon: '⚡' },
                veteran: { unlocked: false, title: 'Veteran Player', description: 'Play 100 games', icon: '🎮' },
                royalFlush: { unlocked: false, title: 'Royal Flush', description: 'Get all 3 dice showing same symbol', icon: '👑' },
                bonusHunter: { unlocked: false, title: 'Bonus Hunter', description: 'Trigger 10 bonus rounds', icon: '🎁' },
                highRoller: { unlocked: false, title: 'High Roller', description: 'Bet maximum on all squares', icon: '💎' },
                comebackKid: { unlocked: false, title: 'Comeback Kid', description: 'Win after having less than $10', icon: '🚀' },
                perfectGame: { unlocked: false, title: 'Perfect Game', description: 'Win with all bet symbols matching', icon: '⭐' },
                tournamentWinner: { unlocked: false, title: 'Tournament Champion', description: 'Win a tournament', icon: '🏆' }
            }
        };
        saveUsers(users);
    }

    client.username = name;
    console.log(`User logged in: ${name}`);
    client.send('login_response', { success: true, user: users[name] });
}

function handleUpdateProfile(client, data) {
    if (!client.username) return;
    const users = loadUsers();
    if (!users[client.username]) return;

    if (typeof data.balance === 'number') users[client.username].balance = data.balance;
    if (data.stats) users[client.username].stats = { ...users[client.username].stats, ...data.stats };
    if (data.achievements) {
        Object.keys(data.achievements).forEach(key => {
            if (users[client.username].achievements[key]) {
                users[client.username].achievements[key].unlocked = data.achievements[key].unlocked;
            }
        });
    }

    saveUsers(users);
    client.send('profile_updated', { success: true });
}

// Multiplayer Rooms
function handleMpCreateRoom(client, data) {
    const name = data || client.username || 'Host Player';
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    rooms[roomCode] = {
        roomCode,
        players: [{
            name,
            socketId: client.id,
            ready: false,
            isHost: true,
            bets: { crown: 0, anchor: 0, heart: 0, diamond: 0, club: 0, spade: 0 },
            balance: 100
        }],
        status: 'lobby',
        diceResults: null
    };

    client.roomCode = roomCode;
    console.log(`Room created: ${roomCode} by ${name}`);
    client.send('mp_create_room_response', { success: true, roomCode, players: rooms[roomCode].players });
}

function handleMpJoinRoom(client, data) {
    const code = data?.roomCode?.toUpperCase();
    if (!rooms[code]) {
        client.send('mp_join_room_response', { error: 'Room not found' });
        return;
    }

    const name = data?.playerName || client.username || `Player ${rooms[code].players.length + 1}`;
    const alreadyInRoom = rooms[code].players.find(p => p.socketId === client.id);
    
    if (!alreadyInRoom) {
        rooms[code].players.push({
            name,
            socketId: client.id,
            ready: false,
            isHost: false,
            bets: { crown: 0, anchor: 0, heart: 0, diamond: 0, club: 0, spade: 0 },
            balance: 100
        });
    }

    client.roomCode = code;
    console.log(`Player ${name} joined room ${code}`);

    const roomState = {
        roomCode: code,
        players: rooms[code].players.map(p => ({
            name: p.name,
            ready: p.ready,
            isHost: p.isHost,
            bets: p.bets,
            balance: p.balance,
            socketId: p.socketId
        })),
        status: rooms[code].status
    };

    broadcastToRoom(code, 'mp_room_state', roomState);
    client.send('mp_join_room_response', { success: true, roomCode: code, players: rooms[code].players });
}

function handleMpToggleReady(client) {
    const room = findRoomByClient(client);
    if (!room) return;

    const player = room.players.find(p => p.socketId === client.id);
    if (!player) return;

    player.ready = !player.ready;

    const roomState = {
        roomCode: room.roomCode,
        players: room.players.map(p => ({
            name: p.name,
            ready: p.ready,
            isHost: p.isHost,
            bets: p.bets,
            balance: p.balance,
            socketId: p.socketId
        })),
        status: room.status
    };

    broadcastToRoom(room.roomCode, 'mp_room_state', roomState);
}

function handleMpPlaceBet(client, data) {
    const room = findRoomByClient(client);
    if (!room) return;

    const player = room.players.find(p => p.socketId === client.id);
    if (!player) return;

    const { symbol, amount } = data;
    player.bets[symbol] = (player.bets[symbol] || 0) + amount;
    player.balance -= amount;

    const betsState = {
        players: room.players.map(p => ({
            name: p.name,
            ready: p.ready,
            isHost: p.isHost,
            bets: p.bets,
            balance: p.balance,
            socketId: p.socketId
        }))
    };

    broadcastToRoom(room.roomCode, 'mp_bets_updated', betsState);
}

function handleMpClearBets(client) {
    const room = findRoomByClient(client);
    if (!room) return;

    const player = room.players.find(p => p.socketId === client.id);
    if (!player) return;

    Object.keys(player.bets).forEach(s => {
        player.balance += player.bets[s];
        player.bets[s] = 0;
    });

    const betsState = {
        players: room.players.map(p => ({
            name: p.name,
            ready: p.ready,
            isHost: p.isHost,
            bets: p.bets,
            balance: p.balance,
            socketId: p.socketId
        }))
    };

    broadcastToRoom(room.roomCode, 'mp_bets_updated', betsState);
}

function handleMpRequestRoll(client) {
    const room = findRoomByClient(client);
    if (!room) return;

    const player = room.players.find(p => p.socketId === client.id);
    if (!player || !player.isHost) return;

    const allReady = room.players.every(p => p.isHost || p.ready);
    if (!allReady) return;

    const results = [
        symbols[Math.floor(Math.random() * 6)],
        symbols[Math.floor(Math.random() * 6)],
        symbols[Math.floor(Math.random() * 6)]
    ];

    room.status = 'rolling';
    room.diceResults = results;

    broadcastToRoom(room.roomCode, 'mp_rolling', { results });

    setTimeout(() => {
        room.status = 'lobby';
        const symbolCounts = {};
        results.forEach(s => {
            symbolCounts[s] = (symbolCounts[s] || 0) + 1;
        });

        const users = loadUsers();

        room.players.forEach(p => {
            let totalWinnings = 0;
            let totalBets = 0;
            let won = false;

            Object.keys(p.bets).forEach(s => {
                const bet = p.bets[s];
                if (bet > 0) {
                    totalBets += bet;
                    if (symbolCounts[s]) {
                        totalWinnings += bet + (bet * symbolCounts[s]);
                        won = true;
                    }
                }
            });

            const roundNetProfit = won ? (totalWinnings - totalBets) : -totalBets;
            p.balance += totalWinnings;

            if (p.name && users[p.name]) {
                const u = users[p.name];
                u.balance = p.balance;
                u.stats.gamesPlayed++;
                u.stats.totalWagered += totalBets;
                if (won) {
                    u.stats.gamesWon++;
                    u.stats.netProfit += roundNetProfit;
                    if (roundNetProfit > u.stats.biggestWin) {
                        u.stats.biggestWin = roundNetProfit;
                    }
                } else {
                    u.stats.netProfit -= totalBets;
                }
                u.stats.winRate = Math.round((u.stats.gamesWon / u.stats.gamesPlayed) * 100) + '%';
                saveUsers(users);
            }

            p.bets = { crown: 0, anchor: 0, heart: 0, diamond: 0, club: 0, spade: 0 };
            p.ready = false;
        });

        const rollResults = {
            results,
            players: room.players.map(p => ({
                name: p.name,
                ready: p.ready,
                isHost: p.isHost,
                bets: p.bets,
                balance: p.balance,
                socketId: p.socketId
            }))
        };

        broadcastToRoom(room.roomCode, 'mp_roll_results', rollResults);
    }, 1000);
}

// Tournaments
function handleJoinTournament(client, data) {
    const name = data || client.username || 'Anonymous Gambler';
    
    if (tournamentQueue.some(c => c.id === client.id)) {
        client.send('join_tournament_response', { success: true, queueLength: tournamentQueue.length });
        return;
    }

    client.tournamentName = name;
    tournamentQueue.push(client);

    console.log(`Player ${name} joined tournament queue. Total: ${tournamentQueue.length}`);
    
    broadcastAll('tournament_queue_update', {
        queueLength: tournamentQueue.length,
        players: tournamentQueue.map(c => c.tournamentName)
    });

    client.send('join_tournament_response', { success: true, queueLength: tournamentQueue.length });
}

function handleStartTournament(client) {
    if (tournamentQueue.length === 0) return;

    const botNames = ["Cap'n Hook", "Sailor Jack", "Blackbeard", "Old Barnaby", "Nautical Nancy", "Pegleg Pete", "Anchor Andy", "Oceania"];
    const tournamentPlayers = [];

    tournamentQueue.forEach(c => {
        tournamentPlayers.push({
            name: c.tournamentName,
            socketId: c.id,
            isBot: false,
            balance: 100
        });
    });

    const activeBotNames = botNames.filter(b => !tournamentPlayers.some(p => p.name === b));
    while (tournamentPlayers.length < 8) {
        const index = Math.floor(Math.random() * activeBotNames.length);
        const name = activeBotNames.splice(index, 1)[0] || `Bot ${tournamentPlayers.length + 1}`;
        tournamentPlayers.push({
            name,
            socketId: null,
            isBot: true,
            balance: 100
        });
    }

    tournamentPlayers.sort(() => Math.random() - 0.5);

    tournament = {
        id: Math.random().toString(36).substring(2, 8).toUpperCase(),
        status: 'active',
        players: tournamentPlayers,
        bracket: {
            round1: [],
            round2: [],
            round3: []
        },
        currentRound: 1,
        matches: {}
    };

    for (let i = 0; i < 4; i++) {
        const matchId = `r1_m${i}`;
        const p1 = tournamentPlayers[i * 2];
        const p2 = tournamentPlayers[i * 2 + 1];
        
        const match = {
            id: matchId,
            p1: { name: p1.name, socketId: p1.socketId, isBot: p1.isBot, score: 0, currentBets: {} },
            p2: { name: p2.name, socketId: p2.socketId, isBot: p2.isBot, score: 0, currentBets: {} },
            round: 1,
            status: 'pending',
            winner: null,
            rollsPlayed: 0,
            p1Ready: false,
            p2Ready: false
        };

        tournament.bracket.round1.push(match);
        tournament.matches[matchId] = match;
    }

    tournamentQueue.length = 0;

    console.log(`Tournament ${tournament.id} started!`);
    broadcastAll('tournament_started', {
        id: tournament.id,
        bracket: tournament.bracket,
        currentRound: tournament.currentRound,
        players: tournament.players.map(p => ({ name: p.name, isBot: p.isBot }))
    });

    simulateBotMatches();
}

function handleStartTournamentMatch(client, matchId) {
    if (!tournament || !tournament.matches[matchId]) return;
    const match = tournament.matches[matchId];
    
    const isP1 = match.p1.socketId === client.id;
    const isP2 = match.p2.socketId === client.id;
    if (!isP1 && !isP2) return;

    match.status = 'active';

    // Broadcast update to players in the match
    if (match.p1.socketId) {
        const p1Client = Array.from(clients).find(c => c.id === match.p1.socketId);
        p1Client?.send('tournament_match_update', match);
    }
    if (match.p2.socketId) {
        const p2Client = Array.from(clients).find(c => c.id === match.p2.socketId);
        p2Client?.send('tournament_match_update', match);
    }

    if (isP1 && match.p2.isBot) {
        simulateBotBets(match, 'p2');
        client.send('tournament_match_ready_state', match);
    } else if (isP2 && match.p1.isBot) {
        simulateBotBets(match, 'p1');
        client.send('tournament_match_ready_state', match);
    }
}

function handleTournamentPlaceBet(client, data) {
    const { matchId, bets } = data;
    if (!tournament || !tournament.matches[matchId]) return;
    const match = tournament.matches[matchId];

    const isP1 = match.p1.socketId === client.id;
    const isP2 = match.p2.socketId === client.id;
    if (!isP1 && !isP2) return;

    if (isP1) {
        match.p1.currentBets = bets;
        match.p1Ready = true;
    } else {
        match.p2.currentBets = bets;
        match.p2Ready = true;
    }

    const p1Ready = match.p1.isBot || match.p1Ready;
    const p2Ready = match.p2.isBot || match.p2Ready;

    if (p1Ready && p2Ready) {
        const results = [
            symbols[Math.floor(Math.random() * 6)],
            symbols[Math.floor(Math.random() * 6)],
            symbols[Math.floor(Math.random() * 6)]
        ];

        const symbolCounts = {};
        results.forEach(s => {
            symbolCounts[s] = (symbolCounts[s] || 0) + 1;
        });

        let p1Profit = 0;
        Object.keys(match.p1.currentBets).forEach(s => {
            const bet = match.p1.currentBets[s];
            if (bet > 0) {
                if (symbolCounts[s]) p1Profit += bet * symbolCounts[s];
                else p1Profit -= bet;
            }
        });

        let p2Profit = 0;
        Object.keys(match.p2.currentBets).forEach(s => {
            const bet = match.p2.currentBets[s];
            if (bet > 0) {
                if (symbolCounts[s]) p2Profit += bet * symbolCounts[s];
                else p2Profit -= bet;
            }
        });

        match.p1.score += p1Profit;
        match.p2.score += p2Profit;
        match.rollsPlayed++;

        const rollData = {
            matchId,
            results,
            p1Score: match.p1.score,
            p2Score: match.p2.score,
            rollsPlayed: match.rollsPlayed,
            p1Bets: match.p1.currentBets,
            p2Bets: match.p2.currentBets,
            p1Profit,
            p2Profit
        };

        match.p1Ready = false;
        match.p2Ready = false;
        match.p1.currentBets = {};
        match.p2.currentBets = {};

        if (match.rollsPlayed >= 3) {
            let winner = null;
            if (match.p1.score > match.p2.score) winner = match.p1.name;
            else if (match.p2.score > match.p1.score) winner = match.p2.name;
            else winner = Math.random() < 0.5 ? match.p1.name : match.p2.name;

            match.winner = winner;
            match.status = 'completed';
            rollData.matchWinner = winner;

            console.log(`Tournament match ${matchId} completed. Winner: ${winner}`);
        }

        if (match.p1.socketId) {
            const p1C = Array.from(clients).find(c => c.id === match.p1.socketId);
            p1C?.send('tournament_roll_results', rollData);
        }
        if (match.p2.socketId) {
            const p2C = Array.from(clients).find(c => c.id === match.p2.socketId);
            p2C?.send('tournament_roll_results', rollData);
        }

        if (match.status === 'completed') {
            broadcastAll('tournament_state', {
                status: tournament.status,
                bracket: tournament.bracket,
                currentRound: tournament.currentRound
            });
            advanceTournamentRound();
        } else {
            if (match.p1.isBot) simulateBotBets(match, 'p1');
            if (match.p2.isBot) simulateBotBets(match, 'p2');
            
            const readyStateData = {
                id: match.id,
                p1: match.p1,
                p2: match.p2,
                p1Ready: match.p1Ready,
                p2Ready: match.p2Ready,
                rollsPlayed: match.rollsPlayed
            };
            if (match.p1.socketId) {
                const p1C = Array.from(clients).find(c => c.id === match.p1.socketId);
                p1C?.send('tournament_match_ready_state', readyStateData);
            }
            if (match.p2.socketId) {
                const p2C = Array.from(clients).find(c => c.id === match.p2.socketId);
                p2C?.send('tournament_match_ready_state', readyStateData);
            }
        }
    } else {
        const readyStateData = {
            id: match.id,
            p1: match.p1,
            p2: match.p2,
            p1Ready: match.p1Ready,
            p2Ready: match.p2Ready,
            rollsPlayed: match.rollsPlayed
        };
        if (match.p1.socketId) {
            const p1C = Array.from(clients).find(c => c.id === match.p1.socketId);
            p1C?.send('tournament_match_ready_state', readyStateData);
        }
        if (match.p2.socketId) {
            const p2C = Array.from(clients).find(c => c.id === match.p2.socketId);
            p2C?.send('tournament_match_ready_state', readyStateData);
        }
    }
}

function handleClientDisconnect(client) {
    const qIndex = tournamentQueue.findIndex(c => c.id === client.id);
    if (qIndex !== -1) {
        tournamentQueue.splice(qIndex, 1);
        broadcastAll('tournament_queue_update', {
            queueLength: tournamentQueue.length,
            players: tournamentQueue.map(c => c.tournamentName)
        });
    }

    if (tournament && tournament.status === 'active') {
        Object.keys(tournament.matches).forEach(matchId => {
            const match = tournament.matches[matchId];
            if (match.status !== 'completed') {
                const isP1 = match.p1.socketId === client.id;
                const isP2 = match.p2.socketId === client.id;
                if (isP1 || isP2) {
                    const winner = isP1 ? match.p2.name : match.p1.name;
                    match.winner = winner;
                    match.status = 'completed';
                    console.log(`Match forfeited by disconnect. Winner: ${winner}`);
                    broadcastAll('tournament_state', {
                        status: tournament.status,
                        bracket: tournament.bracket,
                        currentRound: tournament.currentRound
                    });
                    advanceTournamentRound();
                }
            }
        });
    }

    const room = findRoomByClient(client);
    if (room) {
        const pIndex = room.players.findIndex(p => p.socketId === client.id);
        if (pIndex !== -1) {
            const wasHost = room.players[pIndex].isHost;
            room.players.splice(pIndex, 1);

            if (room.players.length === 0) {
                delete rooms[room.roomCode];
                console.log(`Room ${room.roomCode} destroyed (empty)`);
            } else {
                if (wasHost) {
                    room.players[0].isHost = true;
                    console.log(`Host migrated in room ${room.roomCode} to ${room.players[0].name}`);
                }
                broadcastToRoom(room.roomCode, 'mp_room_state', {
                    roomCode: room.roomCode,
                    players: room.players.map(p => ({
                        name: p.name,
                        ready: p.ready,
                        isHost: p.isHost,
                        bets: p.bets,
                        balance: p.balance,
                        socketId: p.socketId
                    })),
                    status: room.status
                });
            }
        }
    }
}

// Bot logic
function simulateBotBets(match, botKey) {
    const botBets = {};
    const botChips = [1, 5, 10, 25];
    const totalBetAmount = botChips[Math.floor(Math.random() * botChips.length)] * (Math.floor(Math.random() * 3) + 1);
    const betSymbols = symbols.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 2) + 1);
    const amountPerSymbol = Math.floor(totalBetAmount / betSymbols.length) || 1;
    
    betSymbols.forEach(sym => {
        botBets[sym] = amountPerSymbol;
    });

    if (botKey === 'p1') {
        match.p1.currentBets = botBets;
        match.p1Ready = true;
    } else {
        match.p2.currentBets = botBets;
        match.p2Ready = true;
    }
}

function simulateBotMatches() {
    if (!tournament) return;

    let matchesInRound = [];
    if (tournament.currentRound === 1) matchesInRound = tournament.bracket.round1;
    else if (tournament.currentRound === 2) matchesInRound = tournament.bracket.round2;
    else if (tournament.currentRound === 3) matchesInRound = tournament.bracket.round3;

    let updated = false;
    matchesInRound.forEach(m => {
        if (m.status === 'pending' && m.p1.isBot && m.p2.isBot) {
            const winner = Math.random() < 0.5 ? m.p1.name : m.p2.name;
            m.winner = winner;
            m.status = 'completed';
            updated = true;
            console.log(`Simulated bot match: ${m.p1.name} vs ${m.p2.name}. Winner: ${winner}`);
        }
    });

    if (updated) {
        broadcastAll('tournament_state', {
            status: tournament.status,
            bracket: tournament.bracket,
            currentRound: tournament.currentRound
        });
        advanceTournamentRound();
    }
}

function advanceTournamentRound() {
    if (!tournament) return;

    const round = tournament.currentRound;
    let matchesInRound = [];
    if (round === 1) matchesInRound = tournament.bracket.round1;
    else if (round === 2) matchesInRound = tournament.bracket.round2;
    else if (round === 3) matchesInRound = tournament.bracket.round3;

    const allCompleted = matchesInRound.every(m => m.status === 'completed');
    if (!allCompleted) return;

    if (round === 3) {
        const finalMatch = tournament.bracket.round3[0];
        tournament.status = 'finished';
        
        console.log(`Tournament ${tournament.id} completed. Winner: ${finalMatch.winner}`);

        const winnerPlayer = tournament.players.find(p => p.name === finalMatch.winner);
        if (winnerPlayer && !winnerPlayer.isBot) {
            const users = loadUsers();
            if (users[winnerPlayer.name]) {
                users[winnerPlayer.name].balance += 1000;
                users[winnerPlayer.name].stats.gamesPlayed++;
                users[winnerPlayer.name].achievements.tournamentWinner.unlocked = true;
                saveUsers(users);
            }
        }

        broadcastAll('tournament_finished', {
            winner: finalMatch.winner,
            bracket: tournament.bracket
        });

        tournament = null;
        return;
    }

    const winners = matchesInRound.map(m => {
        const p = tournament.players.find(pl => pl.name === m.winner);
        return p || { name: m.winner, isBot: true, socketId: null };
    });

    const nextRound = round + 1;
    tournament.currentRound = nextRound;

    if (nextRound === 2) {
        tournament.bracket.round2 = [];
        for (let i = 0; i < 2; i++) {
            const matchId = `r2_m${i}`;
            const p1 = winners[i * 2];
            const p2 = winners[i * 2 + 1];

            const match = {
                id: matchId,
                p1: { name: p1.name, socketId: p1.socketId, isBot: p1.isBot, score: 0, currentBets: {} },
                p2: { name: p2.name, socketId: p2.socketId, isBot: p2.isBot, score: 0, currentBets: {} },
                round: 2,
                status: 'pending',
                winner: null,
                rollsPlayed: 0,
                p1Ready: false,
                p2Ready: false
            };
            tournament.bracket.round2.push(match);
            tournament.matches[matchId] = match;
        }
    } else if (nextRound === 3) {
        tournament.bracket.round3 = [];
        const matchId = `r3_m0`;
        const p1 = winners[0];
        const p2 = winners[1];

        const match = {
            id: matchId,
            p1: { name: p1.name, socketId: p1.socketId, isBot: p1.isBot, score: 0, currentBets: {} },
            p2: { name: p2.name, socketId: p2.socketId, isBot: p2.isBot, score: 0, currentBets: {} },
            round: 3,
            status: 'pending',
            winner: null,
            rollsPlayed: 0,
            p1Ready: false,
            p2Ready: false
        };
        tournament.bracket.round3.push(match);
        tournament.matches[matchId] = match;
    }

    broadcastAll('tournament_state', {
        status: tournament.status,
        bracket: tournament.bracket,
        currentRound: tournament.currentRound
    });

    simulateBotMatches();
}

server.listen(PORT, '127.0.0.1', () => {
    console.log(`Crown & Anchor zero-dependency server running at http://127.0.0.1:${PORT}`);
});
