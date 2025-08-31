class CrownAndAnchorGame {
    constructor() {
        this.balance = 100;
        this.selectedChip = 1;
        this.bets = {
            crown: 0,
            anchor: 0,
            heart: 0,
            diamond: 0,
            club: 0,
            spade: 0
        };

        this.symbols = ['crown', 'anchor', 'heart', 'diamond', 'club', 'spade'];
        this.symbolEmojis = {
            crown: '👑',
            anchor: '⚓',
            heart: '♥️',
            diamond: '♦️',
            club: '♣️',
            spade: '♠️'
        };

        this.soundEnabled = true;
        this.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            biggestWin: 0,
            totalWagered: 0,
            netProfit: 0
        };

        this.lastBets = {};
        this.limits = { minBet: 1, maxBet: 100, tableLimit: 500 };
        this.history = [];
        this.currentStreak = 0;
        this.streakType = null;
        this.bonusRoundActive = false;
        this.bonusMultiplier = 1;
        this.gamesUntilBonus = 10;

        this.achievements = {
            firstWin: { title: 'First Victory', description: 'Win your first game', icon: '🎉', unlocked: false },
            bigWin: { title: 'Big Winner', description: 'Win $100 or more in a single round', icon: '💰', unlocked: false },
            streak5: { title: 'Hot Streak', description: 'Win 5 games in a row', icon: '🔥', unlocked: false },
            streak10: { title: 'Unstoppable', description: 'Win 10 games in a row', icon: '⚡', unlocked: false },
            hundredGames: { title: 'Veteran Player', description: 'Play 100 games', icon: '🎮', unlocked: false },
            allSymbols: { title: 'Royal Flush', description: 'Get all three dice showing the same symbol', icon: '👑', unlocked: false },
            bonusHunter: { title: 'Bonus Hunter', description: 'Trigger 10 bonus rounds', icon: '🎁', unlocked: false },
            highRoller: { title: 'High Roller', description: 'Bet the maximum on all squares', icon: '💎', unlocked: false },
            comeback: { title: 'Comeback Kid', description: 'Win after having less than $10', icon: '🚀', unlocked: false },
            perfectGame: { title: 'Perfect Game', description: 'Win with all symbols showing matches', icon: '⭐', unlocked: false },
            tournamentWinner: { title: 'Tournament Champion', description: 'Win a tournament', icon: '🏆', unlocked: false }
        };

        this.init();
    }

    init() {
        this.loadGameState();
        this.loadStats();
        this.loadAchievements();
        this.updateBalance();
        this.setupEventListeners();
        this.selectChip(1);
        this.updateStatsDisplay();
        this.updateHistoryDisplay();
        this.updateStreakDisplay();
        this.updateBonusDisplay();
        this.loadTheme();
    }

    setupEventListeners() {
        // Chip selection
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                this.selectChip(parseInt(e.target.dataset.value));
            });
        });

        // Betting squares
        document.querySelectorAll('.bet-square').forEach(square => {
            square.addEventListener('click', (e) => {
                this.placeBet(e.currentTarget.dataset.symbol);
            });
        });

        // Game controls
        document.getElementById('clear-bets').addEventListener('click', () => this.clearBets());
        document.getElementById('roll-dice').addEventListener('click', () => this.rollDice());
        document.getElementById('repeat-bet').addEventListener('click', () => this.repeatLastBet());
        document.getElementById('bet-max').addEventListener('click', () => this.betMax());

        // Quick bets
        document.getElementById('bet-all-red').addEventListener('click', () => this.betPattern(['heart', 'diamond']));
        document.getElementById('bet-all-black').addEventListener('click', () => this.betPattern(['club', 'spade']));
        document.getElementById('bet-royals').addEventListener('click', () => this.betPattern(['crown', 'anchor']));

        // UI toggles
        document.getElementById('sound-toggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('stats-toggle').addEventListener('click', () => this.toggleStats());
        document.getElementById('limits-toggle').addEventListener('click', () => this.toggleLimits());
        document.getElementById('help-toggle').addEventListener('click', () => this.toggleHelp());
        document.getElementById('achievements-toggle').addEventListener('click', () => this.toggleAchievements());
        document.getElementById('instructions-toggle').addEventListener('click', () => this.toggleInstructions());

        // Close buttons
        document.getElementById('close-stats').addEventListener('click', () => this.toggleStats());
        document.getElementById('close-limits').addEventListener('click', () => this.toggleLimits());
        document.getElementById('close-help').addEventListener('click', () => this.toggleHelp());
        document.getElementById('close-achievements').addEventListener('click', () => this.toggleAchievements());
        document.getElementById('close-instructions').addEventListener('click', () => this.toggleInstructions());

        // Panel outside click handlers
        document.getElementById('stats-panel').addEventListener('click', (e) => {
            if (e.target.id === 'stats-panel') this.toggleStats();
        });
        document.getElementById('limits-panel').addEventListener('click', (e) => {
            if (e.target.id === 'limits-panel') this.toggleLimits();
        });
        document.getElementById('help-panel').addEventListener('click', (e) => {
            if (e.target.id === 'help-panel') this.toggleHelp();
        });
        document.getElementById('achievements-panel').addEventListener('click', (e) => {
            if (e.target.id === 'achievements-panel') this.toggleAchievements();
        });
        document.getElementById('instructions-panel').addEventListener('click', (e) => {
            if (e.target.id === 'instructions-panel') this.toggleInstructions();
        });

        // Reset stats
        document.getElementById('reset-stats').addEventListener('click', () => this.resetStats());

        // Betting limits controls
        document.getElementById('min-bet').addEventListener('change', (e) => {
            this.limits.minBet = parseInt(e.target.value);
            this.saveGameState();
        });
        document.getElementById('max-bet').addEventListener('change', (e) => {
            this.limits.maxBet = parseInt(e.target.value);
            this.saveGameState();
        });
        document.getElementById('table-limit').addEventListener('change', (e) => {
            this.limits.tableLimit = parseInt(e.target.value);
            this.saveGameState();
        });

        // Theme selector
        document.getElementById('theme-select').addEventListener('change', (e) => this.setTheme(e.target.value));

        // Game mode selector
        document.getElementById('game-mode').addEventListener('change', (e) => this.switchGameMode(e.target.value));

        // Multiplayer
        document.getElementById('create-room').addEventListener('click', () => this.createMultiplayerRoom());
        document.getElementById('join-room').addEventListener('click', () => this.joinMultiplayerRoom());

        // Tournament
        document.getElementById('join-tournament').addEventListener('click', () => this.joinTournament());
        document.getElementById('start-tournament').addEventListener('click', () => this.startTournament());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    selectChip(value) {
        this.selectedChip = value;
        document.querySelectorAll('.chip').forEach(chip => chip.classList.remove('selected'));
        const selectedChip = document.querySelector(`[data-value="${value}"]`);
        if (selectedChip) selectedChip.classList.add('selected');
    }

    placeBet(symbol) {
        if (this.balance < this.selectedChip) {
            this.showMessage('Insufficient balance!', 'lose');
            return;
        }

        const currentBet = this.bets[symbol];
        const newBet = currentBet + this.selectedChip;

        if (newBet > this.limits.maxBet) {
            this.showMessage(`Maximum bet per square is $${this.limits.maxBet}!`, 'lose');
            return;
        }

        this.bets[symbol] += this.selectedChip;
        this.balance -= this.selectedChip;

        this.updateBalance();
        this.updateBetDisplay(symbol);
        this.updateSquareSelection(symbol);
        this.playSound('chip');
    }

    updateBetDisplay(symbol) {
        const square = document.querySelector(`[data-symbol="${symbol}"]`);
        if (square) {
            const display = square.querySelector('.bet-display');
            if (display) display.textContent = this.bets[symbol];
        }
    }

    updateSquareSelection(symbol) {
        const square = document.querySelector(`[data-symbol="${symbol}"]`);
        if (square) {
            if (this.bets[symbol] > 0) {
                square.classList.add('selected');
            } else {
                square.classList.remove('selected');
            }
        }
    }

    clearBets() {
        Object.keys(this.bets).forEach(symbol => {
            this.balance += this.bets[symbol];
            this.bets[symbol] = 0;
            this.updateBetDisplay(symbol);
            this.updateSquareSelection(symbol);
        });
        this.updateBalance();
        this.showMessage('All bets cleared!', '');
    }

    rollDice() {
        const totalBets = Object.values(this.bets).reduce((sum, bet) => sum + bet, 0);
        if (totalBets === 0) {
            this.showMessage('Place a bet first!', 'lose');
            return;
        }

        this.lastBets = { ...this.bets };
        this.stats.gamesPlayed++;
        this.stats.totalWagered += totalBets;

        const rollButton = document.getElementById('roll-dice');
        rollButton.disabled = true;

        this.playSound('roll');

        const dice = document.querySelectorAll('.dice');
        dice.forEach(die => die.classList.add('rolling'));

        setTimeout(() => {
            const results = this.generateDiceResults();
            this.displayDiceResults(results);
            this.calculateWinnings(results);

            dice.forEach(die => die.classList.remove('rolling'));
            rollButton.disabled = false;
        }, 1000);
    }

    generateDiceResults() {
        return [
            this.symbols[Math.floor(Math.random() * 6)],
            this.symbols[Math.floor(Math.random() * 6)],
            this.symbols[Math.floor(Math.random() * 6)]
        ];
    }

    displayDiceResults(results) {
        const diceElements = document.querySelectorAll('.dice');
        results.forEach((result, index) => {
            if (diceElements[index]) {
                diceElements[index].textContent = this.symbolEmojis[result];
            }
        });
    }

    calculateWinnings(results) {
        let totalWinnings = 0;
        let winningSymbols = [];

        const symbolCounts = {};
        results.forEach(symbol => {
            symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
        });

        Object.keys(this.bets).forEach(symbol => {
            if (this.bets[symbol] > 0 && symbolCounts[symbol]) {
                const multiplier = symbolCounts[symbol];
                const winAmount = this.bets[symbol] * multiplier;
                totalWinnings += winAmount;
                winningSymbols.push({ symbol, count: multiplier, amount: winAmount });
            }
        });

        this.gamesUntilBonus--;
        if (this.gamesUntilBonus <= 0) {
            this.activateBonusRound();
        }

        if (this.bonusRoundActive && totalWinnings > 0) {
            totalWinnings *= this.bonusMultiplier;
            this.bonusRoundActive = false;
        }

        this.balance += totalWinnings;

        Object.keys(this.bets).forEach(symbol => {
            this.bets[symbol] = 0;
            this.updateBetDisplay(symbol);
            this.updateSquareSelection(symbol);
        });

        this.updateBalance();
        this.showResults(results, winningSymbols, totalWinnings);

        // Handle tournament progression
        if (this.gameMode === 'tournament' && this.tournamentData.isActive) {
            this.handleTournamentResult(totalWinnings > 0);
        }
    }

    showResults(results, winningSymbols, totalWinnings) {
        const resultText = results.map(r => this.symbolEmojis[r]).join(' ');

        if (totalWinnings > 0) {
            this.playSound('win');
            this.stats.gamesWon++;
            this.stats.netProfit += totalWinnings;

            if (totalWinnings > this.stats.biggestWin) {
                this.stats.biggestWin = totalWinnings;
            }

            this.updateStreak('win');

            let message = `${resultText} - You won $${totalWinnings}!`;
            if (winningSymbols.length > 0) {
                const details = winningSymbols.map(w =>
                    `${this.symbolEmojis[w.symbol]} x${w.count} = $${w.amount}`
                ).join(', ');
                message += ` (${details})`;
            }
            this.showMessage(message, 'win');
        } else {
            this.playSound('lose');
            this.stats.netProfit -= Object.values(this.lastBets).reduce((sum, bet) => sum + bet, 0);
            this.updateStreak('lose');
            this.showMessage(`${resultText} - No wins this time!`, 'lose');
        }

        this.updateBonusDisplay();
        this.addToHistory({
            dice: results,
            winnings: totalWinnings,
            timestamp: new Date().toLocaleTimeString(),
            bonus: this.bonusMultiplier > 1
        });

        this.saveStats();
        this.updateStatsDisplay();
        this.checkAchievements(results, totalWinnings);
    }

    showMessage(message, type) {
        const messageElement = document.getElementById('result-message');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `result-message ${type}`;

            setTimeout(() => {
                messageElement.textContent = '';
                messageElement.className = 'result-message';
            }, 5000);
        }
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            const frequencies = { chip: 200, roll: 150, win: 440, lose: 100 };
            oscillator.frequency.value = frequencies[type] || 200;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundBtn = document.getElementById('sound-toggle');
        if (soundBtn) {
            soundBtn.textContent = this.soundEnabled ? '🔊' : '🔇';
            soundBtn.classList.toggle('muted', !this.soundEnabled);
        }
    }

    toggleStats() {
        const statsPanel = document.getElementById('stats-panel');
        if (statsPanel) statsPanel.classList.toggle('show');
    }

    toggleLimits() {
        const limitsPanel = document.getElementById('limits-panel');
        if (limitsPanel) limitsPanel.classList.toggle('show');
    }

    toggleHelp() {
        const helpPanel = document.getElementById('help-panel');
        if (helpPanel) helpPanel.classList.toggle('show');
    }

    toggleAchievements() {
        const achievementsPanel = document.getElementById('achievements-panel');
        if (achievementsPanel) {
            achievementsPanel.classList.toggle('show');
            if (achievementsPanel.classList.contains('show')) {
                this.updateAchievementsDisplay();
            }
        }
    }

    toggleInstructions() {
        const instructionsPanel = document.getElementById('instructions-panel');
        if (instructionsPanel) instructionsPanel.classList.toggle('show');
    }

    updateBalance() {
        const balanceElement = document.getElementById('balance');
        if (balanceElement) balanceElement.textContent = this.balance;
        this.saveGameState();

        if (this.balance <= 0) {
            const totalBets = Object.values(this.bets).reduce((sum, bet) => sum + bet, 0);
            if (totalBets === 0) {
                this.showMessage('Game Over! Refresh to play again.', 'lose');
                const rollButton = document.getElementById('roll-dice');
                if (rollButton) rollButton.disabled = true;
            }
        }
    }

    updateStatsDisplay() {
        const elements = {
            'games-played': this.stats.gamesPlayed,
            'games-won': this.stats.gamesWon,
            'biggest-win': '$' + this.stats.biggestWin,
            'total-wagered': '$' + this.stats.totalWagered,
            'net-profit': '$' + this.stats.netProfit
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = elements[id];
        });

        const winRateElement = document.getElementById('win-rate');
        if (winRateElement) {
            const winRate = this.stats.gamesPlayed > 0 ?
                Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100) : 0;
            winRateElement.textContent = winRate + '%';
        }
    }

    resetStats() {
        this.stats = { gamesPlayed: 0, gamesWon: 0, biggestWin: 0, totalWagered: 0, netProfit: 0 };
        this.saveStats();
        this.updateStatsDisplay();
        this.showMessage('Statistics reset!', '');
    }

    repeatLastBet() {
        if (Object.keys(this.lastBets).length === 0) {
            this.showMessage('No previous bet to repeat!', 'lose');
            return;
        }

        const totalCost = Object.values(this.lastBets).reduce((sum, bet) => sum + bet, 0);
        if (this.balance < totalCost) {
            this.showMessage('Insufficient balance to repeat bet!', 'lose');
            return;
        }

        this.clearBets();
        Object.keys(this.lastBets).forEach(symbol => {
            if (this.lastBets[symbol] > 0) {
                this.bets[symbol] = this.lastBets[symbol];
                this.balance -= this.lastBets[symbol];
                this.updateBetDisplay(symbol);
                this.updateSquareSelection(symbol);
            }
        });

        this.playSound('chip');
        this.updateBalance();
        this.showMessage('Last bet repeated!', '');
    }

    betMax() {
        const maxBetPerSquare = Math.min(this.limits.maxBet, Math.floor(this.balance / 6));
        if (maxBetPerSquare < this.limits.minBet) {
            this.showMessage('Insufficient balance for max bet!', 'lose');
            return;
        }

        this.clearBets();
        this.symbols.forEach(symbol => {
            let betAmount = 0;
            while (betAmount + this.selectedChip <= maxBetPerSquare && this.balance >= this.selectedChip) {
                this.bets[symbol] += this.selectedChip;
                this.balance -= this.selectedChip;
                betAmount += this.selectedChip;
            }
            this.updateBetDisplay(symbol);
            this.updateSquareSelection(symbol);
        });

        this.updateBalance();
        this.showMessage('Maximum bet placed on all squares!', '');
        this.checkAchievement('highRoller');
    }

    betPattern(symbols) {
        symbols.forEach(symbol => this.placeBet(symbol));
    }

    setTheme(theme) {
        document.body.className = `theme-${theme}`;
        localStorage.setItem('crownAnchorTheme', theme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('crownAnchorTheme');
        if (savedTheme) {
            const themeSelect = document.getElementById('theme-select');
            if (themeSelect) {
                themeSelect.value = savedTheme;
                this.setTheme(savedTheme);
            }
        }
    }

    switchGameMode(mode) {
        this.gameMode = mode;

        const multiplayerSection = document.getElementById('multiplayer-section');
        const tournamentSection = document.getElementById('tournament-section');

        if (multiplayerSection) multiplayerSection.style.display = 'none';
        if (tournamentSection) tournamentSection.style.display = 'none';

        if (mode === 'multiplayer' && multiplayerSection) {
            multiplayerSection.style.display = 'block';
            this.updatePlayersDisplay();
        } else if (mode === 'tournament' && tournamentSection) {
            tournamentSection.style.display = 'block';
            this.updateTournamentDisplay();
        }
    }

    createMultiplayerRoom() {
        const playerNameInput = document.getElementById('player-name');
        if (!playerNameInput || !playerNameInput.value.trim()) {
            this.showMessage('Please enter your name first!', 'lose');
            return;
        }

        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const roomCodeInput = document.getElementById('room-code');
        if (roomCodeInput) roomCodeInput.value = roomCode;

        this.multiplayerData = {
            roomCode: roomCode,
            players: [{ name: playerNameInput.value.trim(), ready: false, isHost: true }],
            isHost: true,
            playerName: playerNameInput.value.trim()
        };

        this.updatePlayersDisplay();
        this.showMessage(`Room ${roomCode} created! Share this code with friends.`, '');
    }

    joinMultiplayerRoom() {
        const playerNameInput = document.getElementById('player-name');
        const roomCodeInput = document.getElementById('room-code');

        if (!playerNameInput?.value.trim() || !roomCodeInput?.value.trim()) {
            this.showMessage('Please enter your name and room code!', 'lose');
            return;
        }

        this.multiplayerData = {
            roomCode: roomCodeInput.value.trim(),
            players: [
                { name: 'Host Player', ready: true, isHost: true },
                { name: playerNameInput.value.trim(), ready: false, isHost: false }
            ],
            isHost: false,
            playerName: playerNameInput.value.trim()
        };

        this.updatePlayersDisplay();
        this.showMessage(`Joined room ${roomCodeInput.value}!`, 'win');
    }

    updatePlayersDisplay() {
        const playersContainer = document.getElementById('players-container');
        if (!playersContainer) return;

        if (this.multiplayerData.players.length === 0) {
            playersContainer.innerHTML = '<div class="player-item">Waiting for players...</div>';
            return;
        }

        playersContainer.innerHTML = this.multiplayerData.players.map(player => `
            <div class="player-item ${player.ready ? 'ready' : ''}">
                <span>${player.name} ${player.isHost ? '👑' : ''}</span>
                <span>${player.ready ? '✅ Ready' : '⏳ Not Ready'}</span>
            </div>
        `).join('');
    }

    joinTournament() {
        if (this.balance < 50) {
            this.showMessage('Insufficient balance! Tournament entry fee is $50.', 'lose');
            return;
        }

        this.balance -= 50;
        this.updateBalance();

        this.tournamentData = {
            isActive: true,
            round: 1,
            playersLeft: 8,
            prizePool: 1000,
            playerPosition: Math.floor(Math.random() * 8) + 1
        };

        const joinButton = document.getElementById('join-tournament');
        const startButton = document.getElementById('start-tournament');

        if (joinButton) joinButton.style.display = 'none';
        if (startButton) startButton.style.display = 'block';

        this.generateTournamentBracket();
        this.updateTournamentDisplay();
        this.showMessage('Joined tournament! Click Start Tournament when ready.', 'win');
    }

    startTournament() {
        this.showMessage('Tournament started! Good luck!', 'win');
        const startButton = document.getElementById('start-tournament');
        if (startButton) startButton.style.display = 'none';
    }

    generateTournamentBracket() {
        const bracket = document.getElementById('tournament-bracket');
        if (!bracket) return;

        const players = [
            'You', 'Player 2', 'Player 3', 'Player 4',
            'Player 5', 'Player 6', 'Player 7', 'Player 8'
        ];

        bracket.innerHTML = `
            <div class="bracket-round">
                <h4>Quarter Finals</h4>
                ${this.generateMatches(players, 4)}
            </div>
            <div class="bracket-round">
                <h4>Semi Finals</h4>
                ${this.generateMatches(['TBD', 'TBD'], 2)}
            </div>
            <div class="bracket-round">
                <h4>Final</h4>
                ${this.generateMatches(['TBD'], 1)}
            </div>
        `;
    }

    generateMatches(players, matchCount) {
        let html = '';
        for (let i = 0; i < matchCount; i++) {
            const player1 = players[i * 2] || 'TBD';
            const player2 = players[i * 2 + 1] || 'TBD';
            html += `
                <div class="bracket-match">
                    <div class="bracket-player">${player1}</div>
                    <div class="bracket-player">${player2}</div>
                </div>
            `;
        }
        return html;
    }

    updateTournamentDisplay() {
        const tournamentRound = document.getElementById('tournament-round');
        const playersLeft = document.getElementById('players-left');
        const prizePool = document.getElementById('prize-pool');

        if (tournamentRound) tournamentRound.textContent = this.tournamentData.round;
        if (playersLeft) playersLeft.textContent = this.tournamentData.playersLeft;
        if (prizePool) prizePool.textContent = '$' + this.tournamentData.prizePool;
    }

    handleTournamentResult(won) {
        if (!this.tournamentData.isActive) return;

        if (won) {
            this.tournamentData.round++;
            this.tournamentData.playersLeft = Math.max(1, Math.floor(this.tournamentData.playersLeft / 2));

            if (this.tournamentData.round > 3) {
                // Won tournament
                this.balance += this.tournamentData.prizePool;
                this.updateBalance();
                this.showMessage('🏆 TOURNAMENT CHAMPION! You won $1000!', 'win');
                this.checkAchievement('tournamentWinner');
                this.tournamentData.isActive = false;
            } else {
                this.showMessage(`Advanced to round ${this.tournamentData.round}!`, 'win');
            }
        } else {
            this.showMessage('Eliminated from tournament!', 'lose');
            this.tournamentData.isActive = false;
        }

        this.updateTournamentDisplay();
    }

    updateStreakDisplay() {
        const streakText = document.getElementById('streak-text');
        const streakEmoji = document.getElementById('streak-emoji');

        if (!streakText || !streakEmoji) return;

        if (this.currentStreak === 0) {
            streakText.textContent = 'No streak';
            streakText.className = '';
            streakEmoji.textContent = '🎯';
        } else if (this.streakType === 'win') {
            streakText.textContent = `${this.currentStreak} win streak!`;
            streakText.className = 'win-streak';
            streakEmoji.textContent = this.currentStreak >= 5 ? '🔥' : '✨';
        } else {
            streakText.textContent = `${this.currentStreak} loss streak`;
            streakText.className = 'lose-streak';
            streakEmoji.textContent = this.currentStreak >= 5 ? '💀' : '😕';
        }
    }

    updateStreak(result) {
        if (this.streakType === result) {
            this.currentStreak++;
        } else {
            this.currentStreak = 1;
            this.streakType = result;
        }
        this.updateStreakDisplay();
    }

    activateBonusRound() {
        this.bonusRoundActive = true;
        this.bonusMultiplier = Math.floor(Math.random() * 3) + 2;
        this.gamesUntilBonus = Math.floor(Math.random() * 10) + 5;
        this.showMessage(`🎉 BONUS ROUND! Next win gets ${this.bonusMultiplier}x multiplier!`, 'win');
    }

    updateBonusDisplay() {
        const bonusDisplay = document.getElementById('bonus-display');
        const bonusText = document.getElementById('bonus-text');
        const bonusEmoji = document.getElementById('bonus-emoji');

        if (!bonusDisplay || !bonusText || !bonusEmoji) return;

        if (this.bonusRoundActive) {
            bonusDisplay.classList.add('active');
            bonusText.textContent = `BONUS ACTIVE! ${this.bonusMultiplier}x multiplier`;
            bonusEmoji.textContent = '🎉';
        } else {
            bonusDisplay.classList.remove('active');
            bonusText.innerHTML = `Next bonus in <span>${this.gamesUntilBonus}</span> games`;
            bonusEmoji.textContent = '🎁';
        }
    }

    addToHistory(item) {
        this.history.unshift(item);
        if (this.history.length > 10) this.history.pop();
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        if (this.history.length === 0) {
            historyList.innerHTML = '<div class="history-placeholder">No rolls yet</div>';
            return;
        }

        historyList.innerHTML = this.history.map(item => {
            const diceText = item.dice.map(d => this.symbolEmojis[d]).join(' ');
            const resultClass = item.winnings > 0 ? 'win' : 'lose';
            const resultText = item.winnings > 0 ? `+$${item.winnings}` : '$0';

            return `
                <div class="history-item">
                    <span class="history-dice">${diceText}${item.bonus ? ' 🎉' : ''}</span>
                    <span class="history-result ${resultClass}">${resultText}</span>
                    <span class="history-time">${item.timestamp}</span>
                </div>
            `;
        }).join('');
    }

    updateAchievementsDisplay() {
        const achievementsGrid = document.getElementById('achievements-grid');
        if (!achievementsGrid) return;

        achievementsGrid.innerHTML = Object.values(this.achievements).map(achievement => `
            <div class="achievement-item ${achievement.unlocked ? 'unlocked' : ''}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
            </div>
        `).join('');
    }

    checkAchievements(diceResults, winnings) {
        if (!this.achievements.firstWin.unlocked && this.stats.gamesWon === 1) {
            this.unlockAchievement('firstWin');
        }

        if (!this.achievements.bigWin.unlocked && winnings >= 100) {
            this.unlockAchievement('bigWin');
        }

        // Check for other achievements
        if (this.currentStreak >= 5 && this.streakType === 'win') {
            this.checkAchievement('streak5');
        }

        if (this.stats.gamesPlayed >= 100) {
            this.checkAchievement('hundredGames');
        }

        // All same symbols
        if (diceResults) {
            const firstSymbol = diceResults[0];
            if (diceResults.every(symbol => symbol === firstSymbol)) {
                this.checkAchievement('allSymbols');
            }
        }

        // Comeback achievement
        if (this.balance < 10 && winnings > 0) {
            this.checkAchievement('comeback');
        }
    }

    checkAchievement(achievementId) {
        if (this.achievements[achievementId] && !this.achievements[achievementId].unlocked) {
            this.unlockAchievement(achievementId);
        }
    }

    unlockAchievement(achievementId) {
        if (this.achievements[achievementId] && !this.achievements[achievementId].unlocked) {
            this.achievements[achievementId].unlocked = true;
            this.saveAchievements();

            const achievement = this.achievements[achievementId];
            this.showMessage(`🏆 Achievement Unlocked: ${achievement.title}!`, 'win');

            setTimeout(() => {
                this.showMessage(`${achievement.icon} ${achievement.description}`, '');
            }, 2000);
        }
    }

    handleKeyboardShortcuts(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        switch (e.key.toLowerCase()) {
            case ' ': e.preventDefault(); this.rollDice(); break;
            case '1': this.selectChip(1); break;
            case '2': this.selectChip(5); break;
            case '3': this.selectChip(10); break;
            case '4': this.selectChip(25); break;
            case 'c': this.clearBets(); break;
            case 'r': this.repeatLastBet(); break;
            case 's': this.toggleStats(); break;
            case 'm': this.toggleSound(); break;
            case 'l': this.toggleLimits(); break;
            case 'i': this.toggleInstructions(); break;
            case 'q': this.placeBet('crown'); break;
            case 'w': this.placeBet('anchor'); break;
            case 'e': this.placeBet('heart'); break;
            case 'a': this.placeBet('diamond'); break;
            case 'd': this.placeBet('club'); break;
            case 'f': this.placeBet('spade'); break;
        }
    }

    loadGameState() {
        const savedState = localStorage.getItem('crownAnchorGameState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                this.balance = state.balance || 100;
                this.soundEnabled = state.soundEnabled !== undefined ? state.soundEnabled : true;
                this.limits = state.limits || this.limits;
                this.currentStreak = state.currentStreak || 0;
                this.streakType = state.streakType || null;
            } catch (e) {
                console.log('Error loading game state');
            }
        }
    }

    saveGameState() {
        const gameState = {
            balance: this.balance,
            soundEnabled: this.soundEnabled,
            limits: this.limits,
            currentStreak: this.currentStreak,
            streakType: this.streakType
        };
        localStorage.setItem('crownAnchorGameState', JSON.stringify(gameState));
    }

    loadAchievements() {
        const savedAchievements = localStorage.getItem('crownAnchorAchievements');
        if (savedAchievements) {
            try {
                const saved = JSON.parse(savedAchievements);
                Object.keys(saved).forEach(key => {
                    if (this.achievements[key]) {
                        this.achievements[key].unlocked = saved[key].unlocked;
                    }
                });
            } catch (e) {
                console.log('Error loading achievements');
            }
        }
    }

    saveAchievements() {
        localStorage.setItem('crownAnchorAchievements', JSON.stringify(this.achievements));
    }

    loadStats() {
        const savedStats = localStorage.getItem('crownAnchorStats');
        if (savedStats) {
            try {
                this.stats = JSON.parse(savedStats);
            } catch (e) {
                console.log('Error loading stats');
            }
        }
    }

    saveStats() {
        localStorage.setItem('crownAnchorStats', JSON.stringify(this.stats));
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CrownAndAnchorGame();
});