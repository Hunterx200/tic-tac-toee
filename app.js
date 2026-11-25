/**
 * ============================================================
 * TIC TAC TOE — ULTIMATE ARENA
 * Complete Game Engine, Audio Synthesizer, Minimax AI & UI
 * ============================================================
 */

(function () {
    'use strict';

    // --- DOM Elements ---
    let boxes = document.querySelectorAll(".box");
    let resetBtn = document.querySelector("#reset-btn") || document.querySelector(".reset-btn");
    let newBtn = document.querySelector("#New") || document.querySelector(".New");
    let msgContainer = document.querySelector(".msg-container");
    let msg = document.querySelector("#msg");
    let msgSubtitle = document.querySelector("#msg-subtitle");

    // Additional Arena Elements
    const undoBtn = document.querySelector("#undo-btn");
    const soundBtn = document.querySelector("#sound-btn");
    const themeBtn = document.querySelector("#theme-btn");
    const themeNameLabel = document.querySelector("#theme-name");
    const rulesBtn = document.querySelector("#rules-btn");
    const closeRulesBtn = document.querySelector("#close-rules-btn");
    const rulesAckBtn = document.querySelector("#rules-ack-btn");
    const rulesModal = document.querySelector("#rules-modal");
    const resetStatsBtn = document.querySelector("#reset-stats-btn");
    const clearHistoryBtn = document.querySelector("#clear-history-btn");
    const historyFeed = document.querySelector("#history-feed");
    const modalPlayAgainBtn = document.querySelector("#modal-play-again-btn");
    const modalReviewBtn = document.querySelector("#modal-review-btn");

    // Board & Graphic Layers
    const boardFrame = document.querySelector("#board-frame");
    const boardElement = document.querySelector("#board");
    const winStrikeSvg = document.querySelector("#win-strike-svg");
    const winStrikeLine = document.querySelector("#win-strike-line");
    const bgCanvas = document.querySelector("#bg-canvas");
    const confettiCanvas = document.querySelector("#confetti-canvas");

    // Player Cards & Status
    const playerXCard = document.querySelector("#player-x-card");
    const playerOCard = document.querySelector("#player-o-card");
    const playerOName = document.querySelector("#player-o-name");
    const playerOIcon = document.querySelector("#player-o-icon");
    const scoreXEl = document.querySelector("#score-x");
    const scoreOEl = document.querySelector("#score-o");
    const turnAnnouncer = document.querySelector("#turn-announcer");
    const turnText = document.querySelector("#turn-text");

    // Stats Displays
    const statXWinsEl = document.querySelector("#stat-x-wins");
    const statOWinsEl = document.querySelector("#stat-o-wins");
    const statDrawsEl = document.querySelector("#stat-draws");
    const statStreakEl = document.querySelector("#stat-streak");

    // Mode & AI Controls
    const modePills = document.querySelectorAll(".mode-pill");
    const aiDifficultyBar = document.querySelector("#ai-difficulty-bar");
    const diffPills = document.querySelectorAll(".diff-pill");

    // Modal Summary Chips
    const sumTurnsEl = document.querySelector("#sum-turns");
    const sumModeEl = document.querySelector("#sum-mode");
    const sumStreakEl = document.querySelector("#sum-streak");
    const modalTrophyIcon = document.querySelector("#modal-trophy-icon");
    const modalGlow = document.querySelector("#modal-glow");

    // --- Game State Variables ---
    let turn0 = false; // false = X's turn, true = O's turn
    let gameActive = true;
    let isAiThinking = false;
    let aiTimer = null;
    let boardState = ["", "", "", "", "", "", "", "", ""];
    let moveHistory = []; // Stack of { index, player }
    let currentMode = "pvp"; // "pvp" or "ai"
    let aiDifficulty = "medium"; // "easy", "medium", "impossible"
    let currentTheme = "cyber"; // "cyber", "solar", "matrix"
    let activeWinningPattern = null;
    let activeWinner = null;

    const winPatterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    // Persistent Arena Statistics
    let stats = {
        xWins: 0,
        oWins: 0,
        draws: 0,
        currentStreak: 0,
        streakWinner: null
    };

    let matchHistory = [];
    let soundEnabled = true;

    // ============================================================
    // 1. Procedural Web Audio API Sound Engine
    // ============================================================
    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    const SoundEngine = {
        playX() {
            if (!soundEnabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            // Dual oscillator cyan laser chord
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc1.type = 'sine';
            osc2.type = 'triangle';

            osc1.frequency.setValueAtTime(520, now);
            osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

            osc2.frequency.setValueAtTime(1040, now);
            osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.15);

            gainNode.gain.setValueAtTime(0.22, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.17);
            osc2.stop(now + 0.17);
        },

        playO() {
            if (!soundEnabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            // Deep resonant crystalline bell
            const osc = ctx.createOscillator();
            const oscSub = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = 'sine';
            oscSub.type = 'sine';

            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(330, now + 0.28);

            oscSub.frequency.setValueAtTime(220, now);
            oscSub.frequency.exponentialRampToValueAtTime(165, now + 0.28);

            gainNode.gain.setValueAtTime(0.25, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.connect(gainNode);
            oscSub.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start(now);
            oscSub.start(now);
            osc.stop(now + 0.31);
            oscSub.stop(now + 0.31);
        },

        playClick() {
            if (!soundEnabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(160, now + 0.04);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
        },

        playUndo() {
            if (!soundEnabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(580, now);
            osc.frequency.exponentialRampToValueAtTime(240, now + 0.18);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.21);
        },

        playVictory() {
            if (!soundEnabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            // Arpeggio notes: C5, E5, G5, C6
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                const noteTime = now + i * 0.09;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.2, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(noteTime);
                osc.stop(noteTime + 0.36);
            });
        },

        playDraw() {
            if (!soundEnabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            // Descending dual tones
            [370, 311].forEach((freq, i) => {
                const noteTime = now + i * 0.12;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.2, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(noteTime);
                osc.stop(noteTime + 0.32);
            });
        }
    };

    // ============================================================
    // 2. Storage & Statistics Engine
    // ============================================================
    function loadSavedData() {
        try {
            const savedStats = localStorage.getItem("ultimate_ttt_stats");
            if (savedStats) {
                stats = Object.assign(stats, JSON.parse(savedStats));
            }
            const savedHistory = localStorage.getItem("ultimate_ttt_history");
            if (savedHistory) {
                matchHistory = JSON.parse(savedHistory);
            }
            const savedSound = localStorage.getItem("ultimate_ttt_sound");
            if (savedSound !== null) {
                soundEnabled = savedSound === "true";
            }
            const savedMode = localStorage.getItem("ultimate_ttt_mode");
            if (savedMode && (savedMode === "pvp" || savedMode === "ai")) {
                currentMode = savedMode;
            }
            const savedDiff = localStorage.getItem("ultimate_ttt_diff");
            if (savedDiff && ["easy", "medium", "impossible"].includes(savedDiff)) {
                aiDifficulty = savedDiff;
            }
            const savedTheme = localStorage.getItem("ultimate_ttt_theme");
            if (savedTheme && ["cyber", "solar", "matrix"].includes(savedTheme)) {
                currentTheme = savedTheme;
            }
        } catch (e) {
            console.warn("Storage access failed, using in-memory defaults.", e);
        }
    }

    function saveState() {
        try {
            localStorage.setItem("ultimate_ttt_stats", JSON.stringify(stats));
            localStorage.setItem("ultimate_ttt_history", JSON.stringify(matchHistory));
            localStorage.setItem("ultimate_ttt_sound", String(soundEnabled));
            localStorage.setItem("ultimate_ttt_mode", currentMode);
            localStorage.setItem("ultimate_ttt_diff", aiDifficulty);
            localStorage.setItem("ultimate_ttt_theme", currentTheme);
        } catch (e) {
            console.warn("Could not save to localStorage", e);
        }
    }

    function updateStatsUI() {
        if (scoreXEl) scoreXEl.innerText = stats.xWins;
        if (scoreOEl) scoreOEl.innerText = stats.oWins;
        if (statXWinsEl) statXWinsEl.innerText = stats.xWins;
        if (statOWinsEl) statOWinsEl.innerText = stats.oWins;
        if (statDrawsEl) statDrawsEl.innerText = stats.draws;
        if (statStreakEl) statStreakEl.innerText = stats.currentStreak > 0 ? `${stats.currentStreak} 🔥` : "0";

        renderHistoryFeed();
    }

    function renderHistoryFeed() {
        if (!historyFeed) return;
        if (matchHistory.length === 0) {
            historyFeed.innerHTML = `<p class="history-empty">No matches logged yet. Play your first arena showdown!</p>`;
            return;
        }

        historyFeed.innerHTML = matchHistory.slice(0, 10).map(match => {
            let tagClass = "tag-draw";
            let tagText = "DRAW";
            if (match.winner === "X") {
                tagClass = "tag-x";
                tagText = "X WON";
            } else if (match.winner === "O") {
                tagClass = "tag-o";
                tagText = "O WON";
            }

            return `
                <div class="history-row">
                    <div class="history-row-left">
                        <span class="history-winner-tag ${tagClass}">${tagText}</span>
                        <span class="history-desc">${match.mode} (${match.moves} moves)</span>
                    </div>
                    <span class="history-meta">${match.time}</span>
                </div>
            `;
        }).join("");
    }

    function logMatch(winner) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const modeLabel = currentMode === "pvp" ? "PvP" : `AI (${aiDifficulty.toUpperCase()})`;

        if (winner === "X") {
            stats.xWins++;
            if (stats.streakWinner === "X") {
                stats.currentStreak++;
            } else {
                stats.streakWinner = "X";
                stats.currentStreak = 1;
            }
        } else if (winner === "O") {
            stats.oWins++;
            if (stats.streakWinner === "O") {
                stats.currentStreak++;
            } else {
                stats.streakWinner = "O";
                stats.currentStreak = 1;
            }
            
        } else {
            stats.draws++;
            stats.currentStreak = 0;
            stats.streakWinner = null;
        }

        matchHistory.unshift({
            id: Date.now(),
            winner: winner,
            mode: modeLabel,
            moves: moveHistory.length,
            time: timeStr
        });

        if (matchHistory.length > 25) {
            matchHistory.pop();
        }

        saveState();
        updateStatsUI();
    }

    // ============================================================
    // 3. UI Mark Rendering (SVG Animated X and O)
    // ============================================================
    function createXMarkSvg() {
        return `
            <svg class="glyph glyph-x" viewBox="0 0 50 50" aria-label="X">
                <line class="line-1" x1="12" y1="12" x2="38" y2="38" />
                <line class="line-2" x1="38" y1="12" x2="12" y2="38" />
            </svg>
            <span class="sr-only" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;">X</span>
        `;
    }

    function createOMarkSvg() {
        return `
            <svg class="glyph glyph-o" viewBox="0 0 50 50" aria-label="O">
                <circle cx="25" cy="25" r="15" />
            </svg>
            <span class="sr-only" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;">O</span>
        `;
    }

    function updateTurnUI() {
        const isXTurn = !turn0;

        if (playerXCard && playerOCard) {
            if (isXTurn) {
                playerXCard.classList.add("active");
                playerOCard.classList.remove("active");
            } else {
                playerOCard.classList.add("active");
                playerXCard.classList.remove("active");
            }
        }

        if (turnText) {
            if (isAiThinking) {
                turnText.innerText = "AI IS CALCULATING...";
                turnText.style.color = "var(--violet-primary)";
            } else if (isXTurn) {
                turnText.innerText = "PLAYER X'S TURN";
                turnText.style.color = "var(--cyan-primary)";
            } else {
                turnText.innerText = currentMode === "ai" ? "AI'S TURN" : "PLAYER O'S TURN";
                turnText.style.color = "var(--violet-primary)";
            }
        }

        if (undoBtn) {
            undoBtn.disabled = moveHistory.length === 0 || !gameActive || isAiThinking;
        }
    }

    // ============================================================
    // 4. Winning Strike Line Calculation & Rendering
    // ============================================================
    function renderWinningStrike(pattern, winner) {
        if (!winStrikeLine || !winStrikeSvg) return;

        const frame = boardFrame || boardElement;
        if (!frame) return;

        activeWinningPattern = pattern;
        activeWinner = winner;

        const frameRect = frame.getBoundingClientRect();
        const boxFirst = boxes[pattern[0]].getBoundingClientRect();
        const boxLast = boxes[pattern[2]].getBoundingClientRect();

        const x1Center = (boxFirst.left + boxFirst.width / 2) - frameRect.left;
        const y1Center = (boxFirst.top + boxFirst.height / 2) - frameRect.top;
        const x2Center = (boxLast.left + boxLast.width / 2) - frameRect.left;
        const y2Center = (boxLast.top + boxLast.height / 2) - frameRect.top;

        // 22px laser overshoot for razor-sharp aesthetic cut
        const dx = x2Center - x1Center;
        const dy = y2Center - y1Center;
        const dist = Math.hypot(dx, dy);

        let x1 = x1Center;
        let y1 = y1Center;
        let x2 = x2Center;
        let y2 = y2Center;

        if (dist > 0) {
            const overshoot = 22;
            const ux = dx / dist;
            const uy = dy / dist;
            x1 = x1Center - ux * overshoot;
            y1 = y1Center - uy * overshoot;
            x2 = x2Center + ux * overshoot;
            y2 = y2Center + uy * overshoot;
        }

        winStrikeLine.setAttribute("x1", x1);
        winStrikeLine.setAttribute("y1", y1);
        winStrikeLine.setAttribute("x2", x2);
        winStrikeLine.setAttribute("y2", y2);

        winStrikeLine.classList.remove("draw-strike-x", "draw-strike-o");
        // Force reflow for clean restart of stroke animation
        void winStrikeLine.offsetWidth;

        if (winner === "X") {
            winStrikeLine.classList.add("draw-strike-x");
        } else {
            winStrikeLine.classList.add("draw-strike-o");
        }
    }

    function clearWinningStrike() {
        activeWinningPattern = null;
        activeWinner = null;
        if (!winStrikeLine) return;
        winStrikeLine.classList.remove("draw-strike-x", "draw-strike-o");
        winStrikeLine.setAttribute("x1", "0");
        winStrikeLine.setAttribute("y1", "0");
        winStrikeLine.setAttribute("x2", "0");
        winStrikeLine.setAttribute("y2", "0");
    }

    // Window resize handler to reposition winning strike seamlessly
    window.addEventListener("resize", () => {
        if (activeWinningPattern && activeWinner) {
            renderWinningStrike(activeWinningPattern, activeWinner);
        }
    });

    // ============================================================
    // 5. Game Over Displays (Victory & Draw Overlays)
    // ============================================================
    const showWinner = (winner, pattern) => {
        gameActive = false;
        cancelAiMove();
        disabledBoxes();

        // Highlight cells
        if (pattern) {
            pattern.forEach(idx => {
                boxes[idx].classList.add("winner-box", winner === "X" ? "win-x" : "win-o");
            });
            renderWinningStrike(pattern, winner);
        }

        SoundEngine.playVictory();
        logMatch(winner);

        // Update modal elements
        if (msg) {
            msg.className = "modal-title";
            if (winner === "X") {
                msg.classList.add("win-x");
                msg.innerText = currentMode === "ai" ? "VICTORY FOR PLAYER X!" : "PLAYER X WINS!";
            } else {
                msg.classList.add("win-o");
                msg.innerText = currentMode === "ai" ? "CYBERMIND HAS WON!" : "PLAYER O WINS!";
            }
        }

        if (msgSubtitle) {
            msgSubtitle.innerText = winner === "X" 
                ? "Tactical supremacy confirmed. A masterclass in arena strategy." 
                : "A decisive counter-offensive shattered all defenses.";
        }

        if (modalTrophyIcon) modalTrophyIcon.innerText = "🏆";
        if (modalGlow) {
            modalGlow.style.background = winner === "X" 
                ? "radial-gradient(circle, var(--cyan-glow) 0%, transparent 70%)" 
                : "radial-gradient(circle, var(--violet-glow) 0%, transparent 70%)";
        }

        if (sumTurnsEl) sumTurnsEl.innerText = moveHistory.length;
        if (sumModeEl) sumModeEl.innerText = currentMode === "pvp" ? "PvP" : `AI ${aiDifficulty.toUpperCase()}`;
        if (sumStreakEl) sumStreakEl.innerText = `${stats.currentStreak}W 🔥`;

        if (turnText) {
            turnText.innerText = `${winner} HAS WON THE ARENA!`;
            turnText.style.color = winner === "X" ? "var(--cyan-primary)" : "var(--violet-primary)";
        }

        // Trigger confetti celebration
        triggerConfetti(winner === "X" ? "#00f0ff" : "#bd00ff");

        // Reveal Victory Modal after brief dramatic beat
        setTimeout(() => {
            if (msgContainer && !gameActive) msgContainer.classList.remove("hide");
        }, 550);
    };

    const showDraw = () => {
        gameActive = false;
        cancelAiMove();
        disabledBoxes();

        boxes.forEach(box => box.classList.add("draw-box"));

        SoundEngine.playDraw();
        logMatch("Draw");

        if (msg) {
            msg.className = "modal-title win-draw";
            msg.innerText = "TACTICAL STALEMATE";
        }

        if (msgSubtitle) {
            msgSubtitle.innerText = "Both combatants executed flawless maneuvers. The grid remains unconquered.";
        }

        if (modalTrophyIcon) modalTrophyIcon.innerText = "⚖️";
        if (modalGlow) {
            modalGlow.style.background = "radial-gradient(circle, var(--gold-glow) 0%, transparent 70%)";
        }

        if (sumTurnsEl) sumTurnsEl.innerText = 9;
        if (sumModeEl) sumModeEl.innerText = currentMode === "pvp" ? "PvP" : `AI ${aiDifficulty.toUpperCase()}`;
        if (sumStreakEl) sumStreakEl.innerText = "RESET";

        if (turnText) {
            turnText.innerText = "TACTICAL STALEMATE";
            turnText.style.color = "var(--gold-primary)";
        }

        setTimeout(() => {
            if (msgContainer && !gameActive) msgContainer.classList.remove("hide");
        }, 500);
    };

    // ============================================================
    // 6. Winner & Draw Detection
    // ============================================================
    const checkWinner = () => {
        for (let pattern of winPatterns) {
            let pos1 = boardState[pattern[0]];
            let pos2 = boardState[pattern[1]];
            let pos3 = boardState[pattern[2]];

            if (pos1 !== "" && pos2 !== "" && pos3 !== "") {
                if (pos1 === pos2 && pos2 === pos3) {
                    showWinner(pos1, pattern);
                    return true;
                }
            }
        }

        // Check for Draw (no empty spots left)
        const isFull = boardState.every(cell => cell !== "");
        if (isFull) {
            showDraw();
            return true;
        }

        return false;
    };

    // ============================================================
    // 7. Box Enabling & Disabling
    // ============================================================
    const disabledBoxes = () => {
        boxes.forEach(box => {
            box.disabled = true;
        });
    };

    const enableBoxes = () => {
        boxes.forEach(box => {
            box.disabled = false;
            box.innerHTML = "";
            box.innerText = "";
            box.removeAttribute("data-mark");
            box.classList.remove("o-color", "x-color", "winner-box", "win-x", "win-o", "draw-box");
        });
    };

    // ============================================================
    // 8. Core Game Actions (Reset, New Game, Undo)
    // ============================================================
    function cancelAiMove() {
        if (aiTimer) {
            clearTimeout(aiTimer);
            aiTimer = null;
        }
        isAiThinking = false;
    }

    const resetGame = () => {
        SoundEngine.playClick();
        cancelAiMove();

        turn0 = false; // Player X starts
        gameActive = true;
        boardState = ["", "", "", "", "", "", "", "", ""];
        moveHistory = [];

        enableBoxes();
        clearWinningStrike();
        stopConfetti();

        if (msgContainer) {
            msgContainer.classList.add("hide");
        }

        updateTurnUI();
    };

    function handleUndo() {
        if (moveHistory.length === 0 || isAiThinking) return;

        SoundEngine.playUndo();
        cancelAiMove();

        // If game was over, re-open board
        if (!gameActive) {
            gameActive = true;
            clearWinningStrike();
            stopConfetti();
            if (msgContainer) msgContainer.classList.add("hide");
            boxes.forEach((box, idx) => {
                box.classList.remove("winner-box", "win-x", "win-o", "draw-box");
                if (boardState[idx] === "") {
                    box.disabled = false;
                }
            });
        }

        if (currentMode === "pvp") {
            // Undo 1 move
            const lastMove = moveHistory.pop();
            boardState[lastMove.index] = "";
            const box = boxes[lastMove.index];
            box.innerHTML = "";
            box.innerText = "";
            box.removeAttribute("data-mark");
            box.classList.remove("o-color", "x-color");
            box.disabled = false;

            // Switch turn back to previous player
            turn0 = (lastMove.player === "O");
        } else {
            // AI Mode: Undo both AI and Player moves so human player can retry
            if (moveHistory.length >= 2) {
                const aiMove = moveHistory.pop();
                boardState[aiMove.index] = "";
                boxes[aiMove.index].innerHTML = "";
                boxes[aiMove.index].innerText = "";
                boxes[aiMove.index].removeAttribute("data-mark");
                boxes[aiMove.index].classList.remove("o-color", "x-color");
                boxes[aiMove.index].disabled = false;

                const playerMove = moveHistory.pop();
                boardState[playerMove.index] = "";
                boxes[playerMove.index].innerHTML = "";
                boxes[playerMove.index].innerText = "";
                boxes[playerMove.index].removeAttribute("data-mark");
                boxes[playerMove.index].classList.remove("o-color", "x-color");
                boxes[playerMove.index].disabled = false;

                turn0 = false; // Player X's turn again
            } else if (moveHistory.length === 1) {
                const singleMove = moveHistory.pop();
                boardState[singleMove.index] = "";
                boxes[singleMove.index].innerHTML = "";
                boxes[singleMove.index].innerText = "";
                boxes[singleMove.index].removeAttribute("data-mark");
                boxes[singleMove.index].classList.remove("o-color", "x-color");
                boxes[singleMove.index].disabled = false;
                turn0 = false;
            }
        }

        updateTurnUI();
    }

    // ============================================================
    // 9. Move Execution (Human & AI)
    // ============================================================
    function executeMove(boxIndex, player) {
        if (!gameActive || boardState[boxIndex] !== "") return false;

        const box = boxes[boxIndex];
        boardState[boxIndex] = player;
        moveHistory.push({ index: boxIndex, player: player });

        box.setAttribute("data-mark", player);
        box.disabled = true;

        if (player === "X") {
            box.innerHTML = createXMarkSvg();
            box.classList.add("x-color");
            box.classList.remove("o-color");
            SoundEngine.playX();
            turn0 = true; // Next is O
        } else {
            box.innerHTML = createOMarkSvg();
            box.classList.add("o-color");
            box.classList.remove("x-color");
            SoundEngine.playO();
            turn0 = false; // Next is X
        }

        const isOver = checkWinner();
        if (!isOver) {
            updateTurnUI();
            if (currentMode === "ai" && turn0) {
                scheduleAiMove();
            }
        }

        return true;
    }

    // Cell Click Event Listener
    boxes.forEach((box, index) => {
        box.addEventListener("click", () => {
            if (!gameActive || isAiThinking) return;
            if (boardState[index] !== "") return;

            const currentPlayer = turn0 ? "O" : "X";
            executeMove(index, currentPlayer);
        });
    });

    // ============================================================
    // 10. AI Intelligence Engine (Easy, Medium, Minimax)
    // ============================================================
    function getAvailableMoves(board) {
        const moves = [];
        for (let i = 0; i < 9; i++) {
            if (board[i] === "") moves.push(i);
        }
        return moves;
    }

    function checkHypotheticalWin(board, mark) {
        for (let pattern of winPatterns) {
            if (board[pattern[0]] === mark && 
                board[pattern[1]] === mark && 
                board[pattern[2]] === mark) {
                return true;
            }
        }
        return false;
    }

    // Minimax Algorithm for Impossible Difficulty
    function minimax(board, depth, isMaximizing) {
        if (checkHypotheticalWin(board, "O")) return 10 - depth;
        if (checkHypotheticalWin(board, "X")) return depth - 10;
        if (getAvailableMoves(board).length === 0) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === "") {
                    board[i] = "O";
                    let score = minimax(board, depth + 1, false);
                    board[i] = "";
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === "") {
                    board[i] = "X";
                    let score = minimax(board, depth + 1, true);
                    board[i] = "";
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    function computeAiMove() {
        const available = getAvailableMoves(boardState);
        if (available.length === 0) return null;

        // --- EASY DIFFICULTY ---
        if (aiDifficulty === "easy") {
            // 75% purely random, 25% take immediate win if available
            if (Math.random() > 0.25) {
                const randomIdx = Math.floor(Math.random() * available.length);
                return available[randomIdx];
            }
        }

        // --- MEDIUM DIFFICULTY ---
        if (aiDifficulty === "medium" || aiDifficulty === "easy") {
            // 1. Take immediate win if possible
            for (let idx of available) {
                boardState[idx] = "O";
                if (checkHypotheticalWin(boardState, "O")) {
                    boardState[idx] = "";
                    return idx;
                }
                boardState[idx] = "";
            }

            // 2. Block human immediate win
            for (let idx of available) {
                boardState[idx] = "X";
                if (checkHypotheticalWin(boardState, "X")) {
                    boardState[idx] = "";
                    return idx;
                }
                boardState[idx] = "";
            }

            // 3. Take center if open
            if (boardState[4] === "") return 4;

            // 4. Otherwise take corner or random
            const corners = [0, 2, 6, 8].filter(c => boardState[c] === "");
            if (corners.length > 0 && Math.random() > 0.3) {
                return corners[Math.floor(Math.random() * corners.length)];
            }

            return available[Math.floor(Math.random() * available.length)];
        }

        // --- IMPOSSIBLE DIFFICULTY (UNBEATABLE MINIMAX) ---
        let bestScore = -Infinity;
        let bestMove = available[0];

        // Opening move optimization
        if (available.length === 9) {
            const openers = [0, 2, 4, 6, 8];
            return openers[Math.floor(Math.random() * openers.length)];
        }

        for (let i = 0; i < 9; i++) {
            if (boardState[i] === "") {
                boardState[i] = "O";
                let score = minimax(boardState, 0, false);
                boardState[i] = "";
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }

        return bestMove;
    }

    function scheduleAiMove() {
        cancelAiMove();
        isAiThinking = true;
        updateTurnUI();

        // Realistic calculating delay (320ms to 480ms)
        const delay = Math.floor(Math.random() * 160) + 320;
        aiTimer = setTimeout(() => {
            if (!gameActive) {
                isAiThinking = false;
                return;
            }
            const aiChosenIndex = computeAiMove();
            isAiThinking = false;
            aiTimer = null;
            if (aiChosenIndex !== null) {
                executeMove(aiChosenIndex, "O");
            }
        }, delay);
    }

    // ============================================================
    // 11. Mode & Difficulty Switching
    // ============================================================
    function setGameMode(mode) {
        if (currentMode === mode) return;
        currentMode = mode;
        saveState();

        modePills.forEach(pill => {
            const isActive = pill.dataset.mode === mode;
            pill.classList.toggle("active", isActive);
            pill.setAttribute("aria-checked", isActive ? "true" : "false");
        });

        if (aiDifficultyBar) {
            aiDifficultyBar.classList.toggle("hide", mode !== "ai");
        }

        if (playerOName) {
            playerOName.innerText = mode === "ai" ? "CYBERMIND" : "PLAYER O";
        }
        if (playerOIcon) {
            playerOIcon.innerText = mode === "ai" ? "🤖" : "O";
        }

        resetGame();
    }

    function setAiDifficulty(diff) {
        aiDifficulty = diff;
        saveState();

        diffPills.forEach(pill => {
            const isActive = pill.dataset.diff === diff;
            pill.classList.toggle("active", isActive);
            pill.setAttribute("aria-checked", isActive ? "true" : "false");
        });

        resetGame();
    }

    // Theme Switcher
    function cycleTheme() {
        const themes = ["cyber", "solar", "matrix"];
        const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
        currentTheme = themes[nextIndex];
        applyTheme(currentTheme);
        saveState();
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        if (themeNameLabel) {
            themeNameLabel.innerText = theme.toUpperCase();
        }
    }

    modePills.forEach(pill => {
        pill.addEventListener("click", () => {
            SoundEngine.playClick();
            setGameMode(pill.dataset.mode);
        });
    });

    diffPills.forEach(pill => {
        pill.addEventListener("click", () => {
            SoundEngine.playClick();
            setAiDifficulty(pill.dataset.diff);
        });
    });

    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            SoundEngine.playClick();
            cycleTheme();
        });
    }

    // ============================================================
    // 12. Modal & Navigation Controls
    // ============================================================
    if (resetBtn) {
        resetBtn.addEventListener("click", resetGame);
    }
    if (newBtn) {
        newBtn.addEventListener("click", resetGame);
    }
    if (undoBtn) {
        undoBtn.addEventListener("click", handleUndo);
    }

    if (modalPlayAgainBtn) {
        modalPlayAgainBtn.addEventListener("click", resetGame);
    }

    if (modalReviewBtn) {
        modalReviewBtn.addEventListener("click", () => {
            SoundEngine.playClick();
            if (msgContainer) msgContainer.classList.add("hide");
            stopConfetti();
        });
    }

    // Sound Toggle
    if (soundBtn) {
        soundBtn.addEventListener("click", () => {
            soundEnabled = !soundEnabled;
            saveState();

            const onIcon = soundBtn.querySelector(".sound-on-icon");
            const offIcon = soundBtn.querySelector(".sound-off-icon");
            if (onIcon && offIcon) {
                onIcon.classList.toggle("hide", !soundEnabled);
                offIcon.classList.toggle("hide", soundEnabled);
            }
            soundBtn.classList.toggle("active-pill", soundEnabled);

            if (soundEnabled) {
                SoundEngine.playClick();
            }
        });
    }

    // Rules Modal
    if (rulesBtn) {
        rulesBtn.addEventListener("click", () => {
            SoundEngine.playClick();
            if (rulesModal) rulesModal.classList.remove("hide");
        });
    }
    if (closeRulesBtn) {
        closeRulesBtn.addEventListener("click", () => {
            SoundEngine.playClick();
            if (rulesModal) rulesModal.classList.add("hide");
        });
    }
    if (rulesAckBtn) {
        rulesAckBtn.addEventListener("click", () => {
            SoundEngine.playClick();
            if (rulesModal) rulesModal.classList.add("hide");
        });
    }
    if (rulesModal) {
        rulesModal.addEventListener("click", (e) => {
            if (e.target === rulesModal) {
                rulesModal.classList.add("hide");
            }
        });
    }

    // Reset Stats
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener("click", () => {
            SoundEngine.playClick();
            if (confirm("Reset all arena wins, losses, and streak counters?")) {
                stats = { xWins: 0, oWins: 0, draws: 0, currentStreak: 0, streakWinner: null };
                saveState();
                updateStatsUI();
            }
        });
    }

    // Clear History
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener("click", () => {
            SoundEngine.playClick();
            matchHistory = [];
            saveState();
            renderHistoryFeed();
        });
    }

    // Keyboard Shortcuts (R to restart, U to undo)
    window.addEventListener("keydown", (e) => {
        if (e.key === "r" || e.key === "R") {
            if (!rulesModal || rulesModal.classList.contains("hide")) {
                resetGame();
            }
        } else if (e.key === "u" || e.key === "U") {
            handleUndo();
        } else if (e.key === "Escape") {
            if (rulesModal) rulesModal.classList.add("hide");
            if (msgContainer && !msgContainer.classList.contains("hide")) {
                msgContainer.classList.add("hide");
                stopConfetti();
            }
        }
    });

    // ============================================================
    // 13. Confetti Particle System
    // ============================================================
    let confettiParticles = [];
    let confettiAnimId = null;

    function resizeConfetti() {
        if (!confettiCanvas) return;
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeConfetti);
    resizeConfetti();

    function triggerConfetti(primaryColor) {
        if (!confettiCanvas) return;
        const ctx = confettiCanvas.getContext("2d");
        if (!ctx) return;

        resizeConfetti();
        stopConfetti();

        const colors = [primaryColor, "#00f0ff", "#bd00ff", "#ffd166", "#ffffff", "#10b981"];
        confettiParticles = [];

        for (let i = 0; i < 90; i++) {
            confettiParticles.push({
                x: window.innerWidth / 2 + (Math.random() * 120 - 60),
                y: window.innerHeight / 2 + (Math.random() * 80 - 40),
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.8) * 14,
                size: Math.random() * 7 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 12,
                opacity: 1,
                life: 0,
                maxLife: Math.random() * 60 + 80
            });
        }

        function render() {
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            let activeCount = 0;

            confettiParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.28; // Gravity
                p.vx *= 0.985;
                p.rotation += p.rotSpeed;
                p.life++;

                if (p.life > p.maxLife * 0.7) {
                    p.opacity = 1 - (p.life - p.maxLife * 0.7) / (p.maxLife * 0.3);
                }

                if (p.life < p.maxLife && p.opacity > 0) {
                    activeCount++;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 8;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
                    ctx.restore();
                }
            });

            if (activeCount > 0) {
                confettiAnimId = requestAnimationFrame(render);
            } else {
                ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            }
        }

        render();
    }

    function stopConfetti() {
        if (confettiAnimId) {
            cancelAnimationFrame(confettiAnimId);
            confettiAnimId = null;
        }
        if (confettiCanvas) {
            const ctx = confettiCanvas.getContext("2d");
            if (ctx) ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
    }

    // ============================================================
    // 14. Interactive Ambient Background Canvas
    // ============================================================
    function initBackgroundParticles() {
        if (!bgCanvas) return;
        const ctx = bgCanvas.getContext("2d");
        if (!ctx) return;

        function resize() {
            bgCanvas.width = window.innerWidth;
            bgCanvas.height = window.innerHeight;
        }
        window.addEventListener("resize", resize);
        resize();

        const count = 35;
        const particles = [];

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * bgCanvas.width,
                y: Math.random() * bgCanvas.height,
                vx: (Math.random() - 0.5) * 0.45,
                vy: (Math.random() - 0.5) * 0.45,
                radius: Math.random() * 2 + 1,
                color: Math.random() > 0.5 ? "rgba(0, 240, 255, " : "rgba(189, 0, 255, ",
                alpha: Math.random() * 0.4 + 0.1
            });
        }

        function loop() {
            ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

            // Draw drifting nodes
            for (let i = 0; i < count; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = bgCanvas.width;
                if (p.x > bgCanvas.width) p.x = 0;
                if (p.y < 0) p.y = bgCanvas.height;
                if (p.y > bgCanvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color + p.alpha + ")";
                ctx.shadowColor = p.color + "0.6)";
                ctx.shadowBlur = 6;
                ctx.fill();

                // Faint interconnecting filaments
                for (let j = i + 1; j < count; j++) {
                    const p2 = particles[j];
                    const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (dist < 110) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.04 * (1 - dist / 110)})`;
                        ctx.lineWidth = 0.7;
                        ctx.shadowBlur = 0;
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(loop);
        }

        loop();
    }

    // ============================================================
    // 15. Initial Bootstrapping
    // ============================================================
    function init() {
        loadSavedData();
        applyTheme(currentTheme);
        updateStatsUI();

        // Apply sound button visual state
        if (soundBtn) {
            const onIcon = soundBtn.querySelector(".sound-on-icon");
            const offIcon = soundBtn.querySelector(".sound-off-icon");
            if (onIcon && offIcon) {
                onIcon.classList.toggle("hide", !soundEnabled);
                offIcon.classList.toggle("hide", soundEnabled);
            }
            soundBtn.classList.toggle("active-pill", soundEnabled);
        }

        // Apply Mode & Diff state
        modePills.forEach(pill => {
            const isActive = pill.dataset.mode === currentMode;
            pill.classList.toggle("active", isActive);
            pill.setAttribute("aria-checked", isActive ? "true" : "false");
        });
        if (aiDifficultyBar) {
            aiDifficultyBar.classList.toggle("hide", currentMode !== "ai");
        }
        diffPills.forEach(pill => {
            const isActive = pill.dataset.diff === aiDifficulty;
            pill.classList.toggle("active", isActive);
            pill.setAttribute("aria-checked", isActive ? "true" : "false");
        });
        if (playerOName) {
            playerOName.innerText = currentMode === "ai" ? "CYBERMIND" : "PLAYER O";
        }
        if (playerOIcon) {
            playerOIcon.innerText = currentMode === "ai" ? "🤖" : "O";
        }

        initBackgroundParticles();
        resetGame();

        console.log("TIC TAC TOE — ULTIMATE ARENA initialized successfully.");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
