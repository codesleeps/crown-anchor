class CrownAndAnchorGame {
    constructor() {
        window.game = this;
        this.socket = null;
        this.isLoggedIn = false;
        this.profileName = '';
        this.multiplayerData = { roomCode: '', players: [], isHost: false, playerName: '' };
        this.activeTournamentMatch = null;
        this.tournamentEntryPaid = false;

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

                const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsHost = window.location.host || 'localhost:55555';
                const wsUrl = `${wsProto}//${wsHost}`;
                try {
                    this.socket = new WebSocket(wsUrl);
                    this.setupSocketListeners();
                } catch (error) {
                    console.error('WebSocket connection failed:', error);
                }

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
        
        const mpReadyBtn = document.getElementById('mp-ready-btn');
        if (mpReadyBtn) {
            mpReadyBtn.addEventListener('click', () => {
                if (this.socket) this.socket.send(JSON.stringify({ event: 'mp_toggle_ready' }));
            });
        }

        // Tournament
        document.getElementById('join-tournament').addEventListener('click', () => this.joinTournament());
        document.getElementById('start-tournament').addEventListener('click', () => this.startTournament());
        
        const lockBetBtn = document.getElementById('tournament-lock-bet');
        if (lockBetBtn) {
            lockBetBtn.addEventListener('click', () => {
                this.lockTournamentBet();
            });
        }

        // Profile Panel Toggle & Listeners
        const profileToggle = document.getElementById('profile-toggle');
        const closeProfile = document.getElementById('close-profile');
        const profilePanel = document.getElementById('profile-panel');

        if (profileToggle) {
            profileToggle.addEventListener('click', () => {
                profilePanel.classList.toggle('show');
            });
        }
        if (closeProfile) {
            closeProfile.addEventListener('click', () => {
                profilePanel.classList.remove('show');
            });
        }
        if (profilePanel) {
            profilePanel.addEventListener('click', (e) => {
                if (e.target.id === 'profile-panel') {
                    profilePanel.classList.remove('show');
                }
            });
        }

        const loginBtn = document.getElementById('profile-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                const usernameInput = document.getElementById('profile-username-input');
                if (usernameInput && usernameInput.value.trim()) {
                    this.loginProfile(usernameInput.value.trim());
                }
            });
        }

        const logoutBtn = document.getElementById('profile-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('crownAnchorUsername');
                this.isLoggedIn = false;
                this.profileName = '';
                
                this.balance = 100;
                this.stats = {
                    gamesPlayed: 0,
                    gamesWon: 0,
                    biggestWin: 0,
                    totalWagered: 0,
                    netProfit: 0
                };
                Object.keys(this.achievements).forEach(k => {
                    this.achievements[k].unlocked = false;
                });

                this.updateBalance();
                this.updateStatsDisplay();
                this.updateAchievementsDisplay();

                const loggedOutDiv = document.getElementById('profile-status-logged-out');
                const loggedInDiv = document.getElementById('profile-status-logged-in');
                if (loggedOutDiv) loggedOutDiv.style.display = 'block';
                if (loggedInDiv) loggedInDiv.style.display = 'none';

                if (this.socket) {
                    this.socket.disconnect();
                    this.socket.connect();
                }

                this.showMessage('Logged out successfully.', '');
            });
        }

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

        if (this.gameMode === 'multiplayer') {
            if (this.socket) {
                this.socket.send(JSON.stringify({ event: 'mp_place_bet', data: { symbol, amount: this.selectedChip } }));
                this.bets[symbol] += this.selectedChip;
                this.balance -= this.selectedChip;
                this.updateBalance();
                this.updateBetDisplay(symbol);
                this.updateSquareSelection(symbol);
                this.playSound('chip');
            }
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
        if (this.gameMode === 'multiplayer') {
            if (this.socket) {
                this.socket.send(JSON.stringify({ event: 'mp_clear_bets' }));
                Object.keys(this.bets).forEach(symbol => {
                    this.balance += this.bets[symbol];
                    this.bets[symbol] = 0;
                    this.updateBetDisplay(symbol);
                    this.updateSquareSelection(symbol);
                });
                this.updateBalance();
                this.showMessage('All bets cleared!', '');
            }
            return;
        }

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

        if (this.gameMode === 'multiplayer') {
            if (!this.multiplayerData.isHost) {
                this.showMessage('Only the host can roll the dice!', 'lose');
                return;
            }
            const allReady = this.multiplayerData.players.every(p => p.isHost || p.ready);
            if (!allReady) {
                this.showMessage('Wait for all players to be ready!', 'lose');
                return;
            }
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ event: 'mp_request_roll' }));
            }
            return;
        }

        if (this.gameMode === 'tournament') {
            if (this.tournamentData && this.tournamentData.isActive && this.activeTournamentMatch) {
                this.lockTournamentBet();
            } else {
                this.showMessage('Join a tournament and click Play on your match first!', 'lose');
            }
            return;
        }

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

        if (this.isLoggedIn && this.socket) {
            this.socket.send(JSON.stringify({
                event: 'update_profile',
                data: {
                    balance: this.balance,
                    stats: this.stats,
                    achievements: this.achievements
                }
            }));
        }
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

        // Clear other players' bets displays on switch
        document.querySelectorAll('.other-bets-container').forEach(c => c.innerHTML = '');

        if (mode === 'multiplayer' && multiplayerSection) {
            multiplayerSection.style.display = 'block';
            this.updatePlayersDisplay();
        } else if (mode === 'tournament' && tournamentSection) {
            tournamentSection.style.display = 'block';
            this.updateTournamentDisplay();
        }

        // Update roll button text and state
        this.updateMpRollButton();
    }

    createMultiplayerRoom() {
        if (!this.socket) {
            this.showMessage('Connection unavailable. Real multiplayer not supported.', 'lose');
            return;
        }

        const playerNameInput = document.getElementById('player-name');
        if (!playerNameInput || !playerNameInput.value.trim()) {
            this.showMessage('Please enter your name first!', 'lose');
            return;
        }

        const name = playerNameInput.value.trim();
        this.socket.send(JSON.stringify({ event: 'mp_create_room', data: name }));
    }

    joinMultiplayerRoom() {
        if (!this.socket) {
            this.showMessage('Connection unavailable. Real multiplayer not supported.', 'lose');
            return;
        }

        const playerNameInput = document.getElementById('player-name');
        const roomCodeInput = document.getElementById('room-code');

        if (!playerNameInput?.value.trim() || !roomCodeInput?.value.trim()) {
            this.showMessage('Please enter your name and room code!', 'lose');
            return;
        }

        const name = playerNameInput.value.trim();
        const code = roomCodeInput.value.trim().toUpperCase();

        this.socket.send(JSON.stringify({ event: 'mp_join_room', data: { roomCode: code, playerName: name } }));
    }

    updatePlayersDisplay() {
        const playersContainer = document.getElementById('players-container');
        if (!playersContainer) return;

        if (!this.multiplayerData || !this.multiplayerData.players || this.multiplayerData.players.length === 0) {
            playersContainer.innerHTML = '<div class="player-item">Waiting for players...</div>';
            return;
        }

        playersContainer.innerHTML = this.multiplayerData.players.map(player => {
            const isMe = player.name === this.profileName || player.socketId === this.socket?.id;
            return `
                <div class="player-item ${player.ready ? 'ready' : ''}" style="margin-bottom: 5px; padding: 10px; border-radius: 5px; background: rgba(255,255,255,0.05);">
                    <div style="display:flex; justify-content:space-between; width:100%;">
                        <span>${player.name} ${player.isHost ? '👑' : ''} ${isMe ? '<strong>(You)</strong>' : ''}</span>
                        <span>$${player.balance !== undefined ? player.balance : 100}</span>
                        <span>${player.ready ? '✅ Ready' : '⏳ Not Ready'}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    joinTournament() {
        if (this.balance < 50) {
            this.showMessage('Insufficient balance! Tournament entry fee is $50.', 'lose');
            return;
        }

        if (this.socket) {
            this.socket.send(JSON.stringify({ event: 'join_tournament', data: this.profileName || 'Player' }));
        }
    }

    startTournament() {
        if (this.socket) {
            this.socket.send(JSON.stringify({ event: 'start_tournament' }));
        }
    }

    updateTournamentDisplay() {
        const tournamentRound = document.getElementById('tournament-round');
        const playersLeft = document.getElementById('players-left');
        const prizePool = document.getElementById('prize-pool');

        if (tournamentRound) tournamentRound.textContent = this.tournamentData.round;
        if (playersLeft) playersLeft.textContent = this.tournamentData.playersLeft;
        if (prizePool) prizePool.textContent = '$' + this.tournamentData.prizePool;
    }

    setupSocketListeners() {
        if (!this.socket) return;

        const isWebSocket = this.socket instanceof WebSocket;

        if (isWebSocket) {
            this.socket.addEventListener('open', () => {
                console.log('WebSocket connection opened');
                this.isLocalFallback = false;
                const savedName = localStorage.getItem('crownAnchorUsername');
                if (savedName) {
                    this.loginProfile(savedName);
                }
            });

            this.socket.addEventListener('error', (err) => {
                console.log('WebSocket error, falling back to local mock...');
                if (!this.isLocalFallback) {
                    this.setupLocalFallback();
                }
            });

            this.socket.addEventListener('close', () => {
                console.log('WebSocket closed, falling back to local mock...');
                if (!this.isLocalFallback) {
                    this.setupLocalFallback();
                }
            });
        } else {
            this.socket.addEventListener('open', () => {
                const savedName = localStorage.getItem('crownAnchorUsername');
                if (savedName) {
                    this.loginProfile(savedName);
                }
            });
        }

        this.socket.addEventListener('message', (e) => {
            let msg;
            try {
                msg = JSON.parse(e.data);
            } catch (err) {
                console.error('Failed to parse WebSocket message:', err);
                return;
            }

            const { event, data } = msg;

            switch (event) {
                case 'login_response':
                    this.handleLoginResponse(data);
                    break;
                case 'profile_updated':
                    break;
                case 'mp_create_room_response':
                    this.handleMpCreateRoomResponse(data);
                    break;
                case 'mp_join_room_response':
                    this.handleMpJoinRoomResponse(data);
                    break;
                case 'mp_room_state':
                    this.handleMpRoomState(data);
                    break;
                case 'mp_bets_updated':
                    this.handleMpBetsUpdated(data);
                    break;
                case 'mp_rolling':
                    this.handleMpRolling(data);
                    break;
                case 'mp_roll_results':
                    this.handleMpRollResults(data);
                    break;
                case 'join_tournament_response':
                    this.handleJoinTournamentResponse(data);
                    break;
                case 'tournament_queue_update':
                    this.handleTournamentQueueUpdate(data);
                    break;
                case 'tournament_started':
                    this.handleTournamentStarted(data);
                    break;
                case 'tournament_state':
                    this.handleTournamentState(data);
                    break;
                case 'tournament_match_update':
                    this.handleTournamentMatchUpdate(data);
                    break;
                case 'tournament_match_ready_state':
                    this.handleTournamentMatchReadyState(data);
                    break;
                case 'tournament_roll_results':
                    this.handleTournamentRollResults(data);
                    break;
                case 'tournament_finished':
                    this.handleTournamentFinished(data);
                    break;
            }
        });
    }

    handleLoginResponse(response) {
        if (response.success) {
            this.isLoggedIn = true;
            this.profileName = response.user.username;
            this.balance = response.user.balance;
            this.stats = response.user.stats;
            
            Object.keys(response.user.achievements).forEach(k => {
                if (this.achievements[k]) {
                    this.achievements[k].unlocked = response.user.achievements[k].unlocked;
                }
            });

            localStorage.setItem('crownAnchorUsername', this.profileName);

            this.updateBalance();
            this.updateStatsDisplay();
            this.updateAchievementsDisplay();

            const loggedOutDiv = document.getElementById('profile-status-logged-out');
            const loggedInDiv = document.getElementById('profile-status-logged-in');
            const displayName = document.getElementById('profile-display-name');
            const playerNameInput = document.getElementById('player-name');

            if (loggedOutDiv) loggedOutDiv.style.display = 'none';
            if (loggedInDiv) loggedInDiv.style.display = 'block';
            if (displayName) displayName.textContent = this.profileName;
            if (playerNameInput) playerNameInput.value = this.profileName;

            this.showMessage(`Welcome back, ${this.profileName}! Stats loaded.`, 'win');
        } else {
            this.showMessage(`Login failed: ${response.error}`, 'lose');
        }
    }

    handleMpCreateRoomResponse(response) {
        if (response.success) {
            const roomCodeInput = document.getElementById('room-code');
            if (roomCodeInput) roomCodeInput.value = response.roomCode;

            this.multiplayerData = {
                roomCode: response.roomCode,
                players: response.players,
                isHost: true,
                playerName: this.profileName || 'Player'
            };
            
            this.updatePlayersDisplay();
            this.showMessage(`Room ${response.roomCode} created! Share this code with friends.`, '');

            const codeDisplay = document.getElementById('mp-lobby-code');
            if (codeDisplay) {
                codeDisplay.textContent = `Room Code: ${response.roomCode}`;
                codeDisplay.style.display = 'inline-block';
            }

            const readyBtn = document.getElementById('mp-ready-btn');
            if (readyBtn) readyBtn.style.display = 'inline-block';
            
            this.updateMpRollButton();
        } else {
            this.showMessage(`Failed to create room: ${response.error}`, 'lose');
        }
    }

    handleMpJoinRoomResponse(response) {
        if (response.success) {
            this.multiplayerData = {
                roomCode: response.roomCode,
                players: response.players,
                isHost: response.players.some(p => p.name === this.profileName && p.isHost),
                playerName: this.profileName || 'Player'
            };

            this.updatePlayersDisplay();
            this.showMessage(`Joined room ${response.roomCode}!`, 'win');

            const codeDisplay = document.getElementById('mp-lobby-code');
            if (codeDisplay) {
                codeDisplay.textContent = `Room Code: ${response.roomCode}`;
                codeDisplay.style.display = 'inline-block';
            }

            const readyBtn = document.getElementById('mp-ready-btn');
            if (readyBtn) {
                readyBtn.style.display = 'inline-block';
                readyBtn.textContent = '✅ Ready';
                readyBtn.style.background = '#2ecc71';
            }

            this.updateMpRollButton();
        } else {
            this.showMessage(`Failed to join room: ${response.error}`, 'lose');
        }
    }

    handleMpRoomState(data) {
        this.multiplayerData = {
            roomCode: data.roomCode,
            players: data.players,
            isHost: data.players.find(p => p.name === this.profileName)?.isHost || false,
            playerName: this.profileName || 'Player'
        };
        this.updatePlayersDisplay();

        const codeDisplay = document.getElementById('mp-lobby-code');
        if (codeDisplay) {
            codeDisplay.textContent = `Room Code: ${data.roomCode}`;
            codeDisplay.style.display = 'inline-block';
        }

        const readyBtn = document.getElementById('mp-ready-btn');
        if (readyBtn) {
            readyBtn.style.display = 'inline-block';
            const me = data.players.find(p => p.name === this.profileName);
            if (me) {
                readyBtn.textContent = me.ready ? '❌ Unready' : '✅ Ready';
                readyBtn.style.background = me.ready ? '#e74c3c' : '#2ecc71';
            }
        }

        this.updateMpRollButton();
    }

    handleMpBetsUpdated(data) {
        this.multiplayerData.players = data.players;
        this.updatePlayersDisplay();
        this.updateOtherPlayersBetsOnBoard();
    }

    handleMpRolling(data) {
        this.isLoading = true;
        this.playSound('roll');
        const dice = document.querySelectorAll('.dice');
        dice.forEach(die => die.classList.add('rolling'));
    }

    handleMpRollResults(data) {
        const dice = document.querySelectorAll('.dice');
        dice.forEach(die => die.classList.remove('rolling'));
        
        this.displayDiceResults(data.results);
        
        const me = data.players.find(p => p.name === this.profileName);
        if (me) {
            this.balance = me.balance;
            this.updateBalance();
        }

        document.querySelectorAll('.other-bets-container').forEach(c => c.innerHTML = '');

        Object.keys(this.bets).forEach(symbol => {
            this.bets[symbol] = 0;
            this.updateBetDisplay(symbol);
            this.updateSquareSelection(symbol);
        });

        this.isLoading = false;
        
        const readyBtn = document.getElementById('mp-ready-btn');
        if (readyBtn) {
            readyBtn.textContent = '✅ Ready';
            readyBtn.style.background = '#2ecc71';
        }

        let winText = data.results.map(r => this.symbolEmojis[r]).join(' ');
        this.showMessage(`Multiplayer Roll: ${winText}`, 'win');
    }

    handleJoinTournamentResponse(data) {
        if (data && data.success) {
            if (!this.tournamentEntryPaid) {
                this.balance -= 50;
                this.tournamentEntryPaid = true;
                this.updateBalance();
            }
            const joinButton = document.getElementById('join-tournament');
            if (joinButton) joinButton.style.display = 'none';
            this.showMessage('Joined tournament queue! Waiting for players...', 'win');
        } else {
            this.showMessage(`Failed to join tournament: ${data?.error || 'unknown error'}`, 'lose');
        }
    }

    handleTournamentQueueUpdate(data) {
        const queueStatus = document.getElementById('tournament-queue-status');
        const queueCount = document.getElementById('tournament-queue-count');
        const queuePlayers = document.getElementById('tournament-queue-players');

        if (queueStatus && queueCount && queuePlayers) {
            queueStatus.style.display = 'block';
            queueCount.textContent = data.queueLength;
            queuePlayers.textContent = 'In Lobby: ' + data.players.join(', ');
        }

        const startBtn = document.getElementById('start-tournament');
        if (startBtn) {
            startBtn.style.display = 'block';
        }
    }

    handleTournamentStarted(data) {
        this.showMessage('Tournament started! Check your bracket and matches.', 'win');
        
        const queueStatus = document.getElementById('tournament-queue-status');
        if (queueStatus) queueStatus.style.display = 'none';

        const startBtn = document.getElementById('start-tournament');
        if (startBtn) startBtn.style.display = 'none';

        this.tournamentData = {
            isActive: true,
            id: data.id,
            round: data.currentRound,
            playersLeft: 8,
            prizePool: 1000
        };

        this.renderTournamentBracket(data.bracket);
        this.updateTournamentDisplay();
        this.checkAndStartMyTournamentMatch(data.bracket);
    }

    handleTournamentState(data) {
        this.renderTournamentBracket(data.bracket);
        this.tournamentData.round = data.currentRound;
        
        let playersLeft = 0;
        let currentMatches = [];
        if (data.currentRound === 1) currentMatches = data.bracket.round1;
        else if (data.currentRound === 2) currentMatches = data.bracket.round2;
        else if (data.currentRound === 3) currentMatches = data.bracket.round3;

        currentMatches.forEach(m => {
            if (m.status !== 'completed') {
                playersLeft += 2;
            } else {
                playersLeft += 1;
            }
        });
        this.tournamentData.playersLeft = playersLeft || 1;
        this.updateTournamentDisplay();

        this.checkAndStartMyTournamentMatch(data.bracket);
    }

    handleTournamentMatchUpdate(match) {
        this.activeTournamentMatch = match;
        this.showTournamentMatchArena(match);
    }

    handleTournamentMatchReadyState(match) {
        this.activeTournamentMatch = match;
        const isP1 = match.p1.name === this.profileName;
        const p1Status = document.getElementById('match-p1-status');
        const p2Status = document.getElementById('match-p2-status');

        if (p1Status && p2Status) {
            p1Status.textContent = match.p1Ready ? 'Ready' : 'Not Ready';
            p1Status.style.color = match.p1Ready ? '#2ecc71' : '#bdc3c7';

            p2Status.textContent = match.p2Ready ? 'Ready' : 'Not Ready';
            p2Status.style.color = match.p2Ready ? '#2ecc71' : '#bdc3c7';
        }

        const opponentBets = isP1 ? match.p2.currentBets : match.p1.currentBets;
        const oppName = isP1 ? match.p2.name : match.p1.name;
        const betText = Object.keys(opponentBets).map(s => `${this.symbolEmojis[s]} $${opponentBets[s]}`).join(', ');
        
        const betDisplay = document.getElementById('opponent-bets-display');
        if (betDisplay) {
            betDisplay.textContent = betText ? `${oppName} bet: ${betText}` : `${oppName} has not placed bets.`;
        }
    }

    handleTournamentRollResults(data) {
        this.isLoading = true;
        this.playSound('roll');
        const dice = document.querySelectorAll('.dice');
        dice.forEach(die => die.classList.add('rolling'));

        setTimeout(() => {
            dice.forEach(die => die.classList.remove('rolling'));
            this.displayDiceResults(data.results);
            
            const isP1 = this.activeTournamentMatch.p1.name === this.profileName;
            const p1Score = document.getElementById('match-p1-score');
            const p2Score = document.getElementById('match-p2-score');
            const roundText = document.getElementById('match-round-text');

            if (p1Score && p2Score) {
                p1Score.textContent = `$${data.p1Score}`;
                p2Score.textContent = `$${data.p2Score}`;
            }

            if (roundText) {
                roundText.textContent = `Roll ${data.rollsPlayed} of 3`;
            }

            const myProfit = isP1 ? data.p1Profit : data.p2Profit;
            const oppName = isP1 ? this.activeTournamentMatch.p2.name : this.activeTournamentMatch.p1.name;
            const oppProfit = isP1 ? data.p2Profit : data.p1Profit;

            this.showMessage(`Match Roll: ${data.results.map(r => this.symbolEmojis[r]).join(' ')} (Your net: $${myProfit}, ${oppName} net: $${oppProfit})`, myProfit >= 0 ? 'win' : 'lose');

            if (data.matchWinner) {
                const wonMatch = data.matchWinner === this.profileName;
                if (wonMatch) {
                    this.showMessage(`🏆 You won the match! Waiting for next round.`, 'win');
                } else {
                    this.showMessage(`Eliminated from tournament by ${data.matchWinner}!`, 'lose');
                    this.tournamentData.isActive = false;
                }
                this.activeTournamentMatch = null;
                const arena = document.getElementById('tournament-match-arena');
                if (arena) arena.style.display = 'none';
            } else {
                this.activeTournamentMatch.rollsPlayed = data.rollsPlayed;
                const lockBtn = document.getElementById('tournament-lock-bet');
                if (lockBtn) {
                    lockBtn.disabled = false;
                    lockBtn.textContent = 'Lock Bet & Ready';
                    lockBtn.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';
                }
            }

            Object.keys(this.bets).forEach(s => {
                this.bets[s] = 0;
                this.updateBetDisplay(s);
                this.updateSquareSelection(s);
            });

            this.isLoading = false;
        }, 1000);
    }

    handleTournamentFinished(data) {
        const wonTournament = data.winner === this.profileName;
        if (wonTournament) {
            this.balance += 1000;
            this.updateBalance();
            this.showMessage('🏆 TOURNAMENT CHAMPION! You won $1000!', 'win');
            this.checkAchievement('tournamentWinner');
        } else {
            this.showMessage(`Tournament ended. Winner: ${data.winner}`, '');
        }

        this.tournamentData.isActive = false;
        this.tournamentEntryPaid = false;
        const arena = document.getElementById('tournament-match-arena');
        if (arena) arena.style.display = 'none';

        this.renderTournamentBracket(data.bracket);
        this.updateTournamentDisplay();

        const joinBtn = document.getElementById('join-tournament');
        if (joinBtn) joinBtn.style.display = 'block';
    }

    loginProfile(username) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify({
            event: 'login',
            data: { username }
        }));
    }

    renderTournamentBracket(bracket) {
        const container = document.getElementById('tournament-bracket');
        if (!container) return;

        const round1Matches = bracket.round1;
        const round2Matches = bracket.round2.length > 0 ? bracket.round2 : [
            { id: 'r2_m0', p1: { name: 'TBD' }, p2: { name: 'TBD' }, winner: null },
            { id: 'r2_m1', p1: { name: 'TBD' }, p2: { name: 'TBD' }, winner: null }
        ];
        const round3Matches = bracket.round3.length > 0 ? bracket.round3 : [
            { id: 'r3_m0', p1: { name: 'TBD' }, p2: { name: 'TBD' }, winner: null }
        ];

        const renderPlayer = (p, opponent, matchWinner) => {
            let classAttr = 'bracket-player';
            if (matchWinner) {
                if (matchWinner === p.name) classAttr += ' winner';
                else classAttr += ' loser';
            }
            const nameDisplay = p.name + (p.isBot ? ' 🤖' : (p.name !== 'TBD' ? ' 👤' : ''));
            return `<div class="${classAttr}">
                <span>${nameDisplay}</span>
                <span>${p.score !== undefined && p.name !== 'TBD' ? `$${p.score}` : ''}</span>
            </div>`;
        };

        const renderMatchHtml = (m) => {
            let matchStatusText = '';
            if (m.status === 'completed') matchStatusText = `<div style="font-size:0.75em; text-align:center; color:#2ecc71;">Done</div>`;
            else if (m.status === 'active') matchStatusText = `<div style="font-size:0.75em; text-align:center; color:#e67e22;">Live</div>`;
            else if (m.p1.name !== 'TBD' && m.p2.name !== 'TBD') {
                const isMyMatch = m.p1.name === this.profileName || m.p2.name === this.profileName;
                matchStatusText = isMyMatch ? `<button onclick="window.game.startTournamentMatch('${m.id}')" style="display:block; margin: 3px auto; padding: 4px 10px; font-size:0.75em; background:#9b59b6; border:none; border-radius:3px; color:white; font-weight:bold; cursor:pointer;">Play</button>` : `<div style="font-size:0.75em; text-align:center; color:#bdc3c7;">Waiting</div>`;
            }

            return `
                <div class="bracket-match" id="match-${m.id}" style="position:relative; padding-bottom: ${m.status !== 'completed' && m.status !== 'active' && m.p1.name !== 'TBD' && m.p2.name !== 'TBD' ? '30px' : '10px'};">
                    ${renderPlayer(m.p1, m.p2, m.winner)}
                    <div style="border-top:1px dashed rgba(255,255,255,0.1); margin: 2px 0;"></div>
                    ${renderPlayer(m.p2, m.p1, m.winner)}
                    <div style="position:absolute; bottom: 3px; left:0; right:0;">
                        ${matchStatusText}
                    </div>
                </div>
            `;
        };

        container.innerHTML = `
            <div class="bracket-round">
                <h4>Quarter Finals</h4>
                ${round1Matches.map(m => renderMatchHtml(m)).join('')}
            </div>
            <div class="bracket-round">
                <h4>Semi Finals</h4>
                ${round2Matches.map(m => renderMatchHtml(m)).join('')}
            </div>
            <div class="bracket-round">
                <h4>Final</h4>
                ${round3Matches.map(m => renderMatchHtml(m)).join('')}
            </div>
        `;
    }

    startTournamentMatch(matchId) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify({
            event: 'start_tournament_match',
            data: matchId
        }));
    }

    showTournamentMatchArena(match) {
        const arena = document.getElementById('tournament-match-arena');
        const p1Name = document.getElementById('match-p1-name');
        const p2Name = document.getElementById('match-p2-name');
        const p1Score = document.getElementById('match-p1-score');
        const p2Score = document.getElementById('match-p2-score');
        const p1Status = document.getElementById('match-p1-status');
        const p2Status = document.getElementById('match-p2-status');
        const roundText = document.getElementById('match-round-text');
        const betDisplay = document.getElementById('opponent-bets-display');

        if (arena && p1Name && p2Name && p1Score && p2Score && p1Status && p2Status && roundText) {
            arena.style.display = 'block';
            p1Name.textContent = match.p1.name;
            p2Name.textContent = match.p2.name;
            p1Score.textContent = `$${match.p1.score}`;
            p2Score.textContent = `$${match.p2.score}`;
            p1Status.textContent = match.p1Ready ? 'Ready' : 'Not Ready';
            p2Status.textContent = match.p2Ready ? 'Ready' : 'Not Ready';
            roundText.textContent = `Roll ${match.rollsPlayed + 1} of 3`;
            
            const lockBtn = document.getElementById('tournament-lock-bet');
            if (lockBtn) {
                lockBtn.disabled = false;
                lockBtn.textContent = 'Lock Bet & Ready';
                lockBtn.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';
            }

            if (betDisplay) betDisplay.textContent = 'Place your bets on the board above!';
        }
    }

    lockTournamentBet() {
        if (!this.activeTournamentMatch || !this.socket || this.socket.readyState !== WebSocket.OPEN) return;

        const totalBets = Object.values(this.bets).reduce((sum, b) => sum + b, 0);
        if (totalBets === 0) {
            this.showMessage('Place a bet first!', 'lose');
            return;
        }

        const lockBtn = document.getElementById('tournament-lock-bet');
        if (lockBtn) {
            lockBtn.disabled = true;
            lockBtn.textContent = 'Waiting for Opponent...';
            lockBtn.style.background = '#7f8c8d';
        }

        this.socket.send(JSON.stringify({
            event: 'tournament_place_bet',
            data: {
                matchId: this.activeTournamentMatch.id,
                bets: { ...this.bets }
            }
        }));
    }

    checkAndStartMyTournamentMatch(bracket) {
        if (!this.socket) return;
        
        let myMatch = null;
        const findMyPendingMatchInRound = (matches) => {
            return matches.find(m => 
                m.status === 'pending' && 
                (m.p1.name === this.profileName || m.p2.name === this.profileName)
            );
        };

        if (this.tournamentData.round === 1) myMatch = findMyPendingMatchInRound(bracket.round1);
        else if (this.tournamentData.round === 2) myMatch = findMyPendingMatchInRound(bracket.round2);
        else if (this.tournamentData.round === 3) myMatch = findMyPendingMatchInRound(bracket.round3);
    }

    updateOtherPlayersBetsOnBoard() {
        document.querySelectorAll('.other-bets-container').forEach(c => c.innerHTML = '');

        if (!this.multiplayerData || !this.multiplayerData.players) return;

        this.multiplayerData.players.forEach(p => {
            if (p.name === this.profileName) return;

            Object.keys(p.bets).forEach(symbol => {
                const amount = p.bets[symbol];
                if (amount > 0) {
                    const square = document.querySelector(`[data-symbol="${symbol}"]`);
                    if (square) {
                        let container = square.querySelector('.other-bets-container');
                        if (!container) {
                            container = document.createElement('div');
                            container.className = 'other-bets-container';
                            square.appendChild(container);
                        }
                        const badge = document.createElement('div');
                        badge.className = 'other-bet-badge';
                        badge.textContent = `${p.name.substring(0, 5)}: $${amount}`;
                        container.appendChild(badge);
                    }
                }
            });
        });
    }

    updateMpRollButton() {
        const rollBtn = document.getElementById('roll-dice');
        if (!rollBtn) return;

        if (this.gameMode === 'multiplayer') {
            if (!this.multiplayerData.isHost) {
                rollBtn.disabled = true;
                rollBtn.textContent = 'Host Rolls';
            } else {
                const allReady = this.multiplayerData.players.every(p => p.isHost || p.ready);
                rollBtn.disabled = !allReady;
                rollBtn.textContent = allReady ? 'Roll Dice' : 'Waiting for Players...';
            }
        } else {
            rollBtn.disabled = false;
            rollBtn.textContent = 'Roll Dice';
        }
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
        
        // Insert into the header flow (before the control buttons) so it can
        // never float on top of them; fall back to body if the header is missing
        const headerEl = document.querySelector('.header-section');
        if (headerEl) {
            headerEl.insertBefore(connectionStatus, headerEl.querySelector('.control-buttons'));
        } else if (document.body) {
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

    setupLocalFallback() {
        this.isLocalFallback = true;
        this.socket = new LocalSocketMock(this);
        this.setupSocketListeners();
        
        setTimeout(() => {
            const openListeners = this.socket.listeners['open'] || [];
            openListeners.forEach(cb => cb());
        }, 100);
    }
}

class LocalSocketMock {
    constructor(game) {
        this.game = game;
        this.listeners = {};
        this.id = 'local_' + Math.random().toString(36).substring(2, 7);
        this.roomCode = null;
        this.username = null;

        if (!localStorage.getItem('mock_db_users')) {
            localStorage.setItem('mock_db_users', JSON.stringify({}));
        }

        try {
            this.channel = new BroadcastChannel('crown_anchor_mp_fallback');
            this.channel.onmessage = (e) => {
                const { originId, event, data } = e.data;
                if (originId !== this.id) {
                    this.handleIncomingBroadcast(event, data);
                }
            };
        } catch (err) {
            console.warn('BroadcastChannel not supported.');
        }
    }

    addEventListener(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    send(dataStr) {
        const msg = JSON.parse(dataStr);
        const { event, data } = msg;
        this.processEvent(event, data);
    }

    trigger(event, data) {
        const listeners = this.listeners['message'] || [];
        listeners.forEach(cb => {
            cb({ data: JSON.stringify({ event, data }) });
        });
    }

    broadcast(event, data) {
        if (this.channel) {
            this.channel.postMessage({ originId: this.id, event, data });
        }
    }

    processEvent(event, data) {
        const symbols = ['crown', 'anchor', 'heart', 'diamond', 'club', 'spade'];
        
        if (event === 'login') {
            const name = data.username.trim();
            this.username = name;
            let users = JSON.parse(localStorage.getItem('mock_db_users'));
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
                localStorage.setItem('mock_db_users', JSON.stringify(users));
            }
            this.trigger('login_response', { success: true, user: users[name] });
            return;
        }

        if (event === 'mp_create_room') {
            const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            this.roomCode = roomCode;
            
            const players = [{
                name: data,
                socketId: this.id,
                ready: false,
                isHost: true,
                bets: { crown: 0, anchor: 0, heart: 0, diamond: 0, club: 0, spade: 0 },
                balance: this.game.balance
            }];

            this.saveLocalRoom(roomCode, players, 'lobby');
            
            this.trigger('mp_create_room_response', { success: true, roomCode, players });
            this.broadcast('room_updated', { roomCode, players, status: 'lobby' });
            return;
        }

        if (event === 'mp_join_room') {
            const code = data.roomCode.toUpperCase();
            const room = this.getLocalRoom(code);
            if (!room) {
                this.trigger('mp_join_room_response', { error: 'Room not found' });
                return;
            }

            this.roomCode = code;
            const alreadyIn = room.players.find(p => p.socketId === this.id);
            if (!alreadyIn) {
                room.players.push({
                    name: data.playerName,
                    socketId: this.id,
                    ready: false,
                    isHost: false,
                    bets: { crown: 0, anchor: 0, heart: 0, diamond: 0, club: 0, spade: 0 },
                    balance: this.game.balance
                });
            }

            this.saveLocalRoom(code, room.players, room.status);
            this.trigger('mp_join_room_response', { success: true, roomCode: code, players: room.players });
            this.broadcast('room_updated', { roomCode: code, players: room.players, status: room.status });
            this.trigger('mp_room_state', { roomCode: code, players: room.players, status: room.status });
            return;
        }

        if (event === 'mp_toggle_ready') {
            const room = this.getLocalRoom(this.roomCode);
            if (!room) return;

            const player = room.players.find(p => p.socketId === this.id);
            if (player) {
                player.ready = !player.ready;
            }

            this.saveLocalRoom(this.roomCode, room.players, room.status);
            this.trigger('mp_room_state', { roomCode: this.roomCode, players: room.players, status: room.status });
            this.broadcast('room_updated', { roomCode: this.roomCode, players: room.players, status: room.status });
            return;
        }

        if (event === 'mp_place_bet') {
            const room = this.getLocalRoom(this.roomCode);
            if (!room) return;

            const player = room.players.find(p => p.socketId === this.id);
            if (player) {
                player.bets[data.symbol] = (player.bets[data.symbol] || 0) + data.amount;
                player.balance -= data.amount;
            }

            this.saveLocalRoom(this.roomCode, room.players, room.status);
            this.trigger('mp_bets_updated', { players: room.players });
            this.broadcast('bets_updated', { roomCode: this.roomCode, players: room.players });
            return;
        }

        if (event === 'mp_clear_bets') {
            const room = this.getLocalRoom(this.roomCode);
            if (!room) return;

            const player = room.players.find(p => p.socketId === this.id);
            if (player) {
                Object.keys(player.bets).forEach(s => {
                    player.balance += player.bets[s];
                    player.bets[s] = 0;
                });
            }

            this.saveLocalRoom(this.roomCode, room.players, room.status);
            this.trigger('mp_bets_updated', { players: room.players });
            this.broadcast('bets_updated', { roomCode: this.roomCode, players: room.players });
            return;
        }

        if (event === 'mp_request_roll') {
            const room = this.getLocalRoom(this.roomCode);
            if (!room) return;

            const results = [
                symbols[Math.floor(Math.random() * 6)],
                symbols[Math.floor(Math.random() * 6)],
                symbols[Math.floor(Math.random() * 6)]
            ];

            this.trigger('mp_rolling', { results });
            this.broadcast('rolling', { roomCode: this.roomCode, results });

            setTimeout(() => {
                const symbolCounts = {};
                results.forEach(s => symbolCounts[s] = (symbolCounts[s] || 0) + 1);

                let users = JSON.parse(localStorage.getItem('mock_db_users'));

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

                    const profit = won ? (totalWinnings - totalBets) : -totalBets;
                    p.balance += totalWinnings;

                    if (users[p.name]) {
                        const u = users[p.name];
                        u.balance = p.balance;
                        u.stats.gamesPlayed++;
                        u.stats.totalWagered += totalBets;
                        if (won) {
                            u.stats.gamesWon++;
                            u.stats.netProfit += profit;
                            if (profit > u.stats.biggestWin) u.stats.biggestWin = profit;
                        } else {
                            u.stats.netProfit -= totalBets;
                        }
                        u.stats.winRate = Math.round((u.stats.gamesWon / u.stats.gamesPlayed) * 100) + '%';
                    }

                    p.bets = { crown: 0, anchor: 0, heart: 0, diamond: 0, club: 0, spade: 0 };
                    p.ready = false;
                });

                localStorage.setItem('mock_db_users', JSON.stringify(users));
                this.saveLocalRoom(this.roomCode, room.players, 'lobby');

                this.trigger('mp_roll_results', { results, players: room.players });
                this.broadcast('roll_results', { roomCode: this.roomCode, results, players: room.players });
            }, 1000);
            return;
        }

        if (event === 'join_tournament') {
            this.trigger('join_tournament_response', { success: true, queueLength: 1 });
            this.trigger('tournament_queue_update', { queueLength: 1, players: [this.username] });
            return;
        }

        if (event === 'start_tournament') {
            const botNames = ["Cap'n Hook", "Sailor Jack", "Blackbeard", "Old Barnaby", "Nautical Nancy", "Pegleg Pete", "Anchor Andy", "Oceania"];
            const players = [{ name: this.username, isBot: false, balance: 100, socketId: this.id }];
            
            for (let i = 0; i < 7; i++) {
                players.push({ name: botNames[i], isBot: true, balance: 100, socketId: null });
            }

            players.sort(() => Math.random() - 0.5);

            this.tournament = {
                id: Math.random().toString(36).substring(2, 8).toUpperCase(),
                players,
                bracket: { round1: [], round2: [], round3: [] },
                currentRound: 1,
                matches: {}
            };

            for (let i = 0; i < 4; i++) {
                const matchId = `r1_m${i}`;
                const p1 = players[i * 2];
                const p2 = players[i * 2 + 1];
                const match = {
                    id: matchId,
                    p1: { name: p1.name, isBot: p1.isBot, score: 0, currentBets: {} },
                    p2: { name: p2.name, isBot: p2.isBot, score: 0, currentBets: {} },
                    round: 1,
                    status: 'pending',
                    winner: null,
                    rollsPlayed: 0,
                    p1Ready: false,
                    p2Ready: false
                };
                this.tournament.bracket.round1.push(match);
                this.tournament.matches[matchId] = match;
            }

            this.trigger('tournament_started', {
                id: this.tournament.id,
                bracket: this.tournament.bracket,
                currentRound: 1,
                players: this.tournament.players
            });

            this.simulateLocalBotMatches();
            return;
        }

        if (event === 'start_tournament_match') {
            const match = this.tournament.matches[data];
            if (!match) return;

            match.status = 'active';
            this.trigger('tournament_match_update', match);

            if (match.p2.isBot) {
                this.simulateLocalBotBets(match, 'p2');
                this.trigger('tournament_match_ready_state', match);
            } else if (match.p1.isBot) {
                this.simulateLocalBotBets(match, 'p1');
                this.trigger('tournament_match_ready_state', match);
            }
            return;
        }

        if (event === 'tournament_place_bet') {
            const match = this.tournament.matches[data.matchId];
            if (!match) return;

            const isP1 = match.p1.name === this.username;
            if (isP1) {
                match.p1.currentBets = data.bets;
                match.p1Ready = true;
            } else {
                match.p2.currentBets = data.bets;
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
                results.forEach(s => symbolCounts[s] = (symbolCounts[s] || 0) + 1);

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
                    matchId: data.matchId,
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
                }

                this.trigger('tournament_roll_results', rollData);

                if (match.status === 'completed') {
                    this.trigger('tournament_state', {
                        status: this.tournament.status,
                        bracket: this.tournament.bracket,
                        currentRound: this.tournament.currentRound
                    });
                    this.advanceLocalTournamentRound();
                } else {
                    if (match.p1.isBot) this.simulateLocalBotBets(match, 'p1');
                    if (match.p2.isBot) this.simulateLocalBotBets(match, 'p2');
                    
                    this.trigger('tournament_match_ready_state', match);
                }
            } else {
                this.trigger('tournament_match_ready_state', match);
            }
            return;
        }
    }

    handleIncomingBroadcast(event, data) {
        if (event === 'room_updated' && data.roomCode === this.roomCode) {
            this.trigger('mp_room_state', data);
        } else if (event === 'bets_updated' && data.roomCode === this.roomCode) {
            this.trigger('mp_bets_updated', { players: data.players });
        } else if (event === 'rolling' && data.roomCode === this.roomCode) {
            this.trigger('mp_rolling', data);
        } else if (event === 'roll_results' && data.roomCode === this.roomCode) {
            this.trigger('mp_roll_results', data);
        }
    }

    getLocalRoom(code) {
        const rooms = JSON.parse(localStorage.getItem('mock_rooms') || '{}');
        return rooms[code];
    }

    saveLocalRoom(code, players, status) {
        const rooms = JSON.parse(localStorage.getItem('mock_rooms') || '{}');
        rooms[code] = { roomCode: code, players, status };
        localStorage.setItem('mock_rooms', JSON.stringify(rooms));
    }

    simulateLocalBotBets(match, botKey) {
        const botBets = {};
        const symbols = ['crown', 'anchor', 'heart', 'diamond', 'club', 'spade'];
        const amount = Math.floor(Math.random() * 25) + 5;
        botBets[symbols[Math.floor(Math.random() * 6)]] = amount;

        if (botKey === 'p1') {
            match.p1.currentBets = botBets;
            match.p1Ready = true;
        } else {
            match.p2.currentBets = botBets;
            match.p2Ready = true;
        }
    }

    simulateLocalBotMatches() {
        const t = this.tournament;
        let matches = [];
        if (t.currentRound === 1) matches = t.bracket.round1;
        else if (t.currentRound === 2) matches = t.bracket.round2;
        else if (t.currentRound === 3) matches = t.bracket.round3;

        let updated = false;
        matches.forEach(m => {
            if (m.status === 'pending' && m.p1.isBot && m.p2.isBot) {
                m.winner = Math.random() < 0.5 ? m.p1.name : m.p2.name;
                m.status = 'completed';
                updated = true;
            }
        });

        if (updated) {
            this.trigger('tournament_state', {
                status: t.status,
                bracket: t.bracket,
                currentRound: t.currentRound
            });
            this.advanceLocalTournamentRound();
        }
    }

    advanceLocalTournamentRound() {
        const t = this.tournament;
        const round = t.currentRound;
        let matches = [];
        if (round === 1) matches = t.bracket.round1;
        else if (round === 2) matches = t.bracket.round2;
        else if (round === 3) matches = t.bracket.round3;

        if (!matches.every(m => m.status === 'completed')) return;

        if (round === 3) {
            const finalMatch = t.bracket.round3[0];
            t.status = 'finished';
            
            if (finalMatch.winner === this.username) {
                let users = JSON.parse(localStorage.getItem('mock_db_users'));
                if (users[this.username]) {
                    users[this.username].balance += 1000;
                    users[this.username].stats.gamesPlayed++;
                    users[this.username].achievements.tournamentWinner.unlocked = true;
                    localStorage.setItem('mock_db_users', JSON.stringify(users));
                }
            }

            this.trigger('tournament_finished', {
                winner: finalMatch.winner,
                bracket: t.bracket
            });
            return;
        }

        const winners = matches.map(m => {
            const p = t.players.find(pl => pl.name === m.winner);
            return p || { name: m.winner, isBot: true };
        });

        const nextRound = round + 1;
        t.currentRound = nextRound;

        if (nextRound === 2) {
            t.bracket.round2 = [];
            for (let i = 0; i < 2; i++) {
                const matchId = `r2_m${i}`;
                const p1 = winners[i * 2];
                const p2 = winners[i * 2 + 1];
                t.bracket.round2.push({
                    id: matchId,
                    p1: { name: p1.name, isBot: p1.isBot, score: 0, currentBets: {} },
                    p2: { name: p2.name, isBot: p2.isBot, score: 0, currentBets: {} },
                    round: 2,
                    status: 'pending',
                    winner: null,
                    rollsPlayed: 0,
                    p1Ready: false,
                    p2Ready: false
                });
                t.matches[matchId] = t.bracket.round2[i];
            }
        } else if (nextRound === 3) {
            t.bracket.round3 = [];
            const matchId = `r3_m0`;
            t.bracket.round3.push({
                id: matchId,
                p1: { name: winners[0].name, isBot: winners[0].isBot, score: 0, currentBets: {} },
                p2: { name: winners[1].name, isBot: winners[1].isBot, score: 0, currentBets: {} },
                round: 3,
                status: 'pending',
                winner: null,
                rollsPlayed: 0,
                p1Ready: false,
                p2Ready: false
            });
            t.matches[matchId] = t.bracket.round3[0];
        }

        this.trigger('tournament_state', {
            status: t.status,
            bracket: t.bracket,
            currentRound: t.currentRound
        });

        this.simulateLocalBotMatches();
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


