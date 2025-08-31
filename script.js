class CrownAndAnchorGame {
    constructor() {
        // Performance monitoring
        this.performanceMetrics = {
            gameStartTime: performance.now(),
            totalGames: 0,
            averageRollTime: 0,
            errorCount: 0
        };

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

        // Loading state
        this.isLoading = false;

        // Error handling
        this.setupErrorHandling();

        // Initialize advanced features
        this.initAdvancedFeatures();

        this.init();
    }

    init() {
        try {
            this.showLoadingState();

            // Simulate loading time for better UX
            setTimeout(() => {
                this.loadGameStateCompressed();
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

                this.hideLoadingState();
                this.trackPerformance('gameInitialized');


            }, 500);
        } catch (error) {
            this.handleError('Initialization failed', error);
        }
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
        document.getElementById('dark-mode-toggle').addEventListener('click', () => this.toggleDarkMode());
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
            this.saveGameStateCompressed();
        });
        document.getElementById('max-bet').addEventListener('change', (e) => {
            this.limits.maxBet = parseInt(e.target.value);
            this.saveGameStateCompressed();
        });
        document.getElementById('table-limit').addEventListener('change', (e) => {
            this.limits.tableLimit = parseInt(e.target.value);
            this.saveGameStateCompressed();
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

        // Track betting behavior
        this.trackEvent('bet_placed', {
            symbol: symbol,
            amount: this.selectedChip,
            totalBet: newBet,
            balance: this.balance
        });

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
        if (this.isLoading) return;

        const rollStartTime = performance.now();

        const totalBets = Object.values(this.bets).reduce((sum, bet) => sum + bet, 0);
        if (totalBets === 0) {
            this.showMessage('Place a bet first!', 'lose');
            return;
        }

        this.lastBets = { ...this.bets };
        this.stats.gamesPlayed++;
        this.stats.totalWagered += totalBets;
        this.performanceMetrics.totalGames++;

        const rollButton = document.getElementById('roll-dice');
        rollButton.disabled = true;
        rollButton.classList.add('rolling-state');

        this.playSound('roll');

        const dice = document.querySelectorAll('.dice');
        dice.forEach(die => die.classList.add('rolling'));

        // Add haptic feedback for mobile
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }

        setTimeout(() => {
            try {
                const results = this.generateDiceResults();
                this.displayDiceResults(results);
                this.calculateWinnings(results);

                // Track performance
                const rollTime = performance.now() - rollStartTime;
                this.performanceMetrics.averageRollTime =
                    (this.performanceMetrics.averageRollTime * (this.performanceMetrics.totalGames - 1) + rollTime) /
                    this.performanceMetrics.totalGames;

                this.trackPerformance('diceRoll', {
                    rollTime: rollTime,
                    results: results,
                    totalBets: totalBets
                });

                dice.forEach(die => die.classList.remove('rolling'));
                rollButton.disabled = false;
                rollButton.classList.remove('rolling-state');
            } catch (error) {
                this.handleError('Dice roll failed', error);
                dice.forEach(die => die.classList.remove('rolling'));
                rollButton.disabled = false;
                rollButton.classList.remove('rolling-state');
            }
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
        this.saveGameStateCompressed();

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

        // Load dark mode preference
        const savedDarkMode = localStorage.getItem('crownAnchorDarkMode');
        if (savedDarkMode === 'true') {
            this.darkMode = true;
            this.applyDarkMode();
        }
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('crownAnchorDarkMode', this.darkMode.toString());

        const darkModeBtn = document.getElementById('dark-mode-toggle');
        if (darkModeBtn) {
            darkModeBtn.textContent = this.darkMode ? '☀️' : '🌙';
        }

        this.applyDarkMode();

        // Track dark mode usage
        this.trackEvent('dark_mode_toggle', {
            enabled: this.darkMode,
            timestamp: new Date().toISOString()
        });
    }

    applyDarkMode() {
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
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

    // Performance & Error Handling Methods
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            this.handleError('JavaScript Error', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('Unhandled Promise Rejection', event.reason);
        });

        // Network status monitoring
        window.addEventListener('online', () => {
            this.showMessage('Connection restored!', 'win');
            this.isOnline = true;
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.showMessage('Playing offline mode', '');
            this.isOnline = false;
        });

        // Visibility change handling
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseGame();
            } else {
                this.resumeGame();
            }
        });
    }

    handleError(message, error) {
        this.performanceMetrics.errorCount++;
        console.error(`Crown & Anchor Error: ${message}`, error);

        // Show user-friendly error message with recovery options
        this.showMessage('Something went wrong. The game will continue normally.', 'lose');

        // Track error for analytics
        this.trackEvent('error', {
            message: message,
            error: error?.message || 'Unknown error',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });

        // Auto-recovery for common issues
        if (error?.message?.includes('localStorage')) {
            this.showMessage('Storage issue detected. Attempting recovery...', '');
            setTimeout(() => {
                this.recoverFromStorageError();
            }, 2000);
        }

        // Critical error handling
        if (this.performanceMetrics.errorCount > 5) {
            this.showMessage('Multiple errors detected. Consider refreshing the page.', 'lose');
        }
    }

    recoverFromStorageError() {
        try {
            // Clear corrupted data and reinitialize
            localStorage.removeItem('crownAnchorGame');
            this.balance = 100;
            this.bets = { crown: 0, anchor: 0, heart: 0, diamond: 0, club: 0, spade: 0 };
            this.updateBalance();
            this.showMessage('Game recovered successfully!', 'win');
        } catch (e) {
            this.showMessage('Recovery failed. Please refresh the page.', 'lose');
        }
    }

    pauseGame() {
        this.gamePaused = true;
        // Pause any ongoing animations or timers
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    resumeGame() {
        this.gamePaused = false;
        // Resume animations if needed
        this.trackEvent('game_resumed', { timestamp: new Date().toISOString() });
    }

    syncOfflineData() {
        try {
            const offlineData = JSON.parse(localStorage.getItem('crownAnchorAnalytics') || '[]');
            const unsyncedData = offlineData.filter(item => !item.synced);

            if (unsyncedData.length > 0) {
                // In production, sync with server
                console.log('Syncing offline data:', unsyncedData.length, 'events');

                // Mark as synced
                offlineData.forEach(item => item.synced = true);
                localStorage.setItem('crownAnchorAnalytics', JSON.stringify(offlineData));
            }
        } catch (error) {
            console.warn('Failed to sync offline data:', error);
        }
    }

    trackPerformance(eventName, data = {}) {
        const timestamp = performance.now();
        const metrics = {
            event: eventName,
            timestamp: timestamp,
            gameTime: timestamp - this.performanceMetrics.gameStartTime,
            ...data
        };

        // In production, send to analytics service
        console.log('Performance Metric:', metrics);
    }

    trackEvent(eventName, data = {}) {
        // In production, send to analytics service (Google Analytics, etc.)
        console.log('Event Tracked:', eventName, data);

        // Google Analytics 4 tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                game_action: eventName,
                game_value: data.amount || data.winnings || 0,
                game_mode: this.gameMode || 'single',
                balance: this.balance || 0,
                custom_parameter_1: data.symbol || '',
                custom_parameter_2: data.results ? data.results.join(',') : '',
                ...data
            });
        }

        // Store analytics data for offline sync
        this.storeAnalyticsData(eventName, data);
    }

    storeAnalyticsData(eventName, data) {
        try {
            const analyticsData = JSON.parse(localStorage.getItem('crownAnchorAnalytics') || '[]');
            analyticsData.push({
                event: eventName,
                data: data,
                timestamp: new Date().toISOString(),
                synced: false
            });

            // Keep only last 100 events to prevent storage bloat
            if (analyticsData.length > 100) {
                analyticsData.splice(0, analyticsData.length - 100);
            }

            localStorage.setItem('crownAnchorAnalytics', JSON.stringify(analyticsData));
        } catch (error) {
            console.warn('Failed to store analytics data:', error);
        }
    }

    showLoadingState() {
        this.isLoading = true;
        
        // Try to find game container, fallback to body
        const gameContainer = document.querySelector('.game-container') || document.body;

        if (!document.getElementById('loading-overlay')) {
            const loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loading-overlay';
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <div class="loading-text">Loading Crown & Anchor...</div>
                    <div class="loading-progress">
                        <div class="progress-bar" id="progress-bar"></div>
                    </div>
                    <div class="loading-tips" id="loading-tips">
                        <p>💡 Tip: Use keyboard shortcuts for faster gameplay!</p>
                    </div>
                </div>
            `;
            
            // Safely append to container
            if (gameContainer) {
                gameContainer.appendChild(loadingOverlay);
            }

            // Animate progress bar
            this.animateLoadingProgress();

            // Show rotating tips
            this.showLoadingTips();
        }
    }

    animateLoadingProgress() {
        const progressBar = document.getElementById('progress-bar');
        if (!progressBar) return;

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressBar.style.width = progress + '%';

            if (progress >= 90) {
                clearInterval(interval);
                setTimeout(() => {
                    progressBar.style.width = '100%';
                }, 200);
            }
        }, 100);
    }

    showLoadingTips() {
        const tips = [
            "💡 Tip: Use keyboard shortcuts for faster gameplay!",
            "🎯 Tip: Try the 'All Red' quick bet for hearts and diamonds!",
            "🏆 Tip: Unlock achievements to track your progress!",
            "🎮 Tip: Switch themes for a different visual experience!",
            "📊 Tip: Check your statistics to improve your strategy!",
            "🎲 Tip: Triple matches give the biggest payouts!",
            "⚡ Tip: Use 'Repeat Bet' to quickly place the same bets!",
            "🎪 Tip: Tournament mode offers the biggest prizes!"
        ];

        const tipsElement = document.getElementById('loading-tips');
        if (!tipsElement) return;

        let currentTip = 0;
        const tipInterval = setInterval(() => {
            if (!document.getElementById('loading-overlay')) {
                clearInterval(tipInterval);
                return;
            }

            currentTip = (currentTip + 1) % tips.length;
            tipsElement.innerHTML = `<p>${tips[currentTip]}</p>`;
        }, 1500);
    }

    hideLoadingState() {
        this.isLoading = false;
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.remove();
            }, 300);
        }
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

    // Advanced UX Features
    initAdvancedFeatures() {
        this.setupConnectionMonitoring();
        this.setupPerformanceMonitoring();
        this.setupAccessibilityFeatures();
        this.setupAdvancedNotifications();
    }

    setupConnectionMonitoring() {
        // Create connection status indicator
        const connectionStatus = document.createElement('div');
        connectionStatus.id = 'connection-status';
        connectionStatus.className = 'connection-status online';
        connectionStatus.textContent = '🌐 Online';
        
        // Safely append to body
        if (document.body) {
            document.body.appendChild(connectionStatus);
        }

        // Update connection status
        this.updateConnectionStatus();

        // Monitor connection changes
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                this.updateConnectionStatus();
            });
        }
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;

        if (navigator.onLine) {
            statusElement.className = 'connection-status online';
            statusElement.textContent = '🌐 Online';

            if (navigator.connection) {
                const connection = navigator.connection;
                const speed = connection.effectiveType;
                statusElement.textContent = `🌐 Online (${speed})`;
            }
        } else {
            statusElement.className = 'connection-status offline';
            statusElement.textContent = '📴 Offline';
        }

        // Auto-hide after 3 seconds
        setTimeout(() => {
            statusElement.style.opacity = '0.3';
        }, 3000);
    }

    setupPerformanceMonitoring() {
        // Monitor FPS
        this.fpsCounter = { frames: 0, lastTime: performance.now(), currentFPS: 60 };
        this.monitorFPS();

        // Monitor memory usage
        if (performance.memory) {
            setInterval(() => {
                this.checkMemoryUsage();
            }, 30000); // Check every 30 seconds
        }

        // Monitor page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden', { timestamp: new Date().toISOString() });
            } else {
                this.trackEvent('page_visible', { timestamp: new Date().toISOString() });
            }
        });
    }

    monitorFPS() {
        const measureFPS = () => {
            this.fpsCounter.frames++;
            const currentTime = performance.now();
            const deltaTime = currentTime - this.fpsCounter.lastTime;

            if (deltaTime >= 1000) {
                this.fpsCounter.currentFPS = Math.round((this.fpsCounter.frames * 1000) / deltaTime);
                this.fpsCounter.frames = 0;
                this.fpsCounter.lastTime = currentTime;

                // Auto-optimize if FPS is consistently low
                if (this.fpsCounter.currentFPS < 30) {
                    this.enablePerformanceMode();
                }
            }

            if (!this.gamePaused) {
                this.animationFrameId = requestAnimationFrame(measureFPS);
            }
        };

        measureFPS();
    }

    checkMemoryUsage() {
        if (!performance.memory) return;

        const memoryUsage = {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        };

        // Warn if memory usage is high
        if (memoryUsage.used > 100) {
            console.warn('High memory usage detected:', memoryUsage);
            this.trackEvent('high_memory_usage', memoryUsage);
        }

        // Force garbage collection if available (Chrome DevTools)
        if (memoryUsage.used > 150 && window.gc) {
            window.gc();
        }
    }

    enablePerformanceMode() {
        if (document.body.classList.contains('low-performance')) return;

        document.body.classList.add('low-performance');
        this.showAdvancedNotification('Performance mode enabled for smoother gameplay', 'info', 3000);

        this.trackEvent('performance_mode_enabled', {
            fps: this.fpsCounter.currentFPS,
            timestamp: new Date().toISOString()
        });
    }

    setupAccessibilityFeatures() {
        // Add screen reader announcements
        this.createAriaLiveRegion();

        // Enhanced keyboard navigation
        this.setupAdvancedKeyboardNavigation();

        // High contrast mode detection
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }

        // Reduced motion detection
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
        }
    }

    createAriaLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.className = 'sr-only';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        
        // Safely append to body
        if (document.body) {
            document.body.appendChild(liveRegion);
        }
    }

    announceToScreenReader(message) {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;

            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    setupAdvancedKeyboardNavigation() {
        // Add focus trap for panels
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllPanels();
            }

            // Tab navigation improvements
            if (e.key === 'Tab') {
                this.handleTabNavigation(e);
            }
        });
    }

    handleTabNavigation(event) {
        const focusableElements = document.querySelectorAll(
            'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Trap focus within open panels
        const openPanel = document.querySelector('.stats-panel.show, .limits-panel.show, .help-panel.show, .achievements-panel.show, .instructions-panel.show');

        if (openPanel) {
            const panelFocusable = openPanel.querySelectorAll(
                'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (panelFocusable.length > 0) {
                const firstPanelElement = panelFocusable[0];
                const lastPanelElement = panelFocusable[panelFocusable.length - 1];

                if (event.shiftKey && document.activeElement === firstPanelElement) {
                    event.preventDefault();
                    lastPanelElement.focus();
                } else if (!event.shiftKey && document.activeElement === lastPanelElement) {
                    event.preventDefault();
                    firstPanelElement.focus();
                }
            }
        }
    }

    closeAllPanels() {
        const panels = ['stats-panel', 'limits-panel', 'help-panel', 'achievements-panel', 'instructions-panel'];
        panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel && panel.classList.contains('show')) {
                panel.classList.remove('show');
            }
        });
    }

    setupAdvancedNotifications() {
        // Create notification container
        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1003;
            pointer-events: none;
        `;
        
        // Safely append to body
        if (document.body) {
            document.body.appendChild(notificationContainer);
        }
    }

    showAdvancedNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `advanced-notification ${type} notification-enter`;
        notification.style.cssText = `
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            font-size: 0.9em;
            font-weight: bold;
            pointer-events: auto;
            cursor: pointer;
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        notification.textContent = message;

        // Click to dismiss
        notification.addEventListener('click', () => {
            this.dismissNotification(notification);
        });

        container.appendChild(notification);

        // Auto-dismiss
        setTimeout(() => {
            this.dismissNotification(notification);
        }, duration);

        // Announce to screen readers
        this.announceToScreenReader(message);
    }

    getNotificationColor(type) {
        const colors = {
            info: 'linear-gradient(135deg, #3498db, #2980b9)',
            success: 'linear-gradient(135deg, #27ae60, #2ecc71)',
            warning: 'linear-gradient(135deg, #f39c12, #e67e22)',
            error: 'linear-gradient(135deg, #e74c3c, #c0392b)'
        };
        return colors[type] || colors.info;
    }

    dismissNotification(notification) {
        notification.classList.remove('notification-enter');
        notification.classList.add('notification-exit');

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Enhanced save/load with compression
    saveGameStateCompressed() {
        try {
            const gameState = {
                balance: this.balance,
                bets: this.bets,
                limits: this.limits,
                stats: this.stats,
                achievements: this.achievements,
                settings: {
                    soundEnabled: this.soundEnabled,
                    darkMode: this.darkMode,
                    selectedTheme: document.getElementById('theme-select')?.value
                },
                timestamp: new Date().toISOString()
            };

            // Simple compression by removing whitespace
            const compressed = JSON.stringify(gameState);
            localStorage.setItem('crownAnchorGameCompressed', compressed);

            this.trackEvent('game_saved', {
                size: compressed.length,
                timestamp: gameState.timestamp
            });
        } catch (error) {
            this.handleError('Failed to save game state', error);
        }
    }

    loadGameStateCompressed() {
        try {
            const compressed = localStorage.getItem('crownAnchorGameCompressed');
            if (!compressed) return;

            const gameState = JSON.parse(compressed);

            // Restore game state
            this.balance = gameState.balance || 100;
            this.bets = gameState.bets || { crown: 0, anchor: 0, heart: 0, diamond: 0, club: 0, spade: 0 };
            this.limits = gameState.limits || { minBet: 1, maxBet: 100, tableLimit: 500 };
            this.stats = gameState.stats || { gamesPlayed: 0, gamesWon: 0, biggestWin: 0, totalWagered: 0, netProfit: 0 };
            this.achievements = gameState.achievements || this.achievements;

            if (gameState.settings) {
                this.soundEnabled = gameState.settings.soundEnabled !== false;
                this.darkMode = gameState.settings.darkMode || false;

                if (gameState.settings.selectedTheme) {
                    const themeSelect = document.getElementById('theme-select');
                    if (themeSelect) {
                        themeSelect.value = gameState.settings.selectedTheme;
                        this.setTheme(gameState.settings.selectedTheme);
                    }
                }
            }

            this.trackEvent('game_loaded', {
                timestamp: gameState.timestamp
            });
        } catch (error) {
            this.handleError('Failed to load game state', error);
        }
    }
}

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Crown & Anchor: Service Worker registered successfully:', registration.scope);
            })
            .catch((error) => {
                console.log('Crown & Anchor: Service Worker registration failed:', error);
            });
    });
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check for browser compatibility
    if (!window.localStorage) {
        alert('Your browser does not support local storage. Some features may not work properly.');
    }

    // Initialize game with error handling
    try {
        new CrownAndAnchorGame();
    } catch (error) {
        console.error('Failed to initialize Crown & Anchor Game:', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; color: white; background: #1e3c72;">
                <h1>🎲 Crown & Anchor Game</h1>
                <p>Sorry, the game failed to load. Please refresh the page.</p>
                <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px; background: #ffd700; border: none; border-radius: 5px; cursor: pointer;">
                    Refresh Page
                </button>
            </div>
        `;
    }
});

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check for browser compatibility
    if (!window.localStorage) {
        alert('Your browser does not support local storage. Some features may not work properly.');
    }

    // Initialize game with error handling
    try {
        new CrownAndAnchorGame();
    } catch (error) {
        console.error('Failed to initialize Crown & Anchor Game:', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; color: white; background: #1e3c72;">
                <h1>🎲 Crown & Anchor Game</h1>
                <p>Sorry, the game failed to load. Please refresh the page.</p>
                <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px; background: #ffd700; border: none; border-radius: 5px; cursor: pointer;">
                    Refresh Page
                </button>
            </div>
        `;
    }
});


