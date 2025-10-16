// js/gameLogic.js
import * as state from './state.js';
import * as ui from './ui.js';
import * as actions from './actions.js';
import { handleSpaceLanding } from './spaceHandlers.js';

// --- AI Decision Functions ---

/**
 * AI makes a decision when the action modal appears (e.g., buy property).
 */
function aiDecideOnAction() {
    const modal = document.getElementById('action-modal');
    if (modal.style.display === 'none') return;

    console.log("AI is making a decision...");
    const player = state.players[state.currentPlayerIndex];
    const buttons = modal.querySelectorAll('#action-modal-buttons button');
    
    const title = document.getElementById('action-title').textContent;

    // Logic for buying property
    if (title.includes('ซื้อ')) {
        const priceText = document.getElementById('action-text').textContent.match(/ราคา: ([\d,]+)/);
        if (priceText) {
            const price = parseInt(priceText[1].replace(/,/g, ''), 10);
            // AI will only buy if it has enough money left over (e.g., 2.5x the price)
            if (player.money < price * 2.5) {
                console.log(`AI decides not to buy ${title} (not enough money).`);
                const passButton = Array.from(buttons).find(btn => btn.classList.contains('danger') || btn.textContent.includes('ไม่'));
                if (passButton) {
                    passButton.click();
                    return;
                }
            }
        }
    }
    
    // Default action: AI prefers the primary (non-danger) option.
    const primaryButton = Array.from(buttons).find(btn => !btn.classList.contains('danger'));
    if (primaryButton) {
        console.log(`AI chose action: ${primaryButton.textContent}`);
        primaryButton.click();
    } else if (buttons.length > 0) {
        // If no primary button, just click the first one available.
        buttons[0].click();
    }
}

/**
 * AI answers a question when the question modal appears.
 */
function aiAnswerQuestion() {
    const modal = document.getElementById('question-modal');
    if (modal.style.display === 'none') return;

    console.log("AI is answering a question...");
    const answer = state.currentQuestion.answer;
    const isCorrect = Math.random() < 0.8; // 80% chance for AI to be correct

    document.getElementById('question-answer').value = isCorrect ? answer : 'IncorrectAnswer';
    document.getElementById('submit-answer-btn').click();
}

/**
 * Main logic for an AI player's turn.
 */
function playAITurn() {
    const player = state.players[state.currentPlayerIndex];
    console.log(`--- AI Turn: ${player.name} ---`);
    ui.disableGameActions(); // Disable human controls

    // 1. Handle Jail
    if (player.inJailTurns > 0) {
        setTimeout(() => {
            if (player.getOutOfJailFree > 0) {
                player.getOutOfJailFree--;
                player.inJailTurns = 0;
                console.log("AI used a Get Out of Jail Free card.");
                ui.updateAllUI();
                rollDice(); // Now free, AI can roll the dice
            } else {
                console.log("AI is stuck in jail and skips the turn.");
                player.inJailTurns--;
                endTurn();
            }
        }, 1500); // Delay for "thinking"
        return;
    }

    // 2. Setup Observers to watch for modals
    const questionModal = document.getElementById('question-modal');
    const actionModal = document.getElementById('action-modal');
    const observers = [];

    const setupObserver = (modal, handler) => {
        const observer = new MutationObserver(() => {
            if (modal.style.display !== 'none') {
                setTimeout(handler, 1200); // Wait a bit before AI reacts
                observer.disconnect();
            }
        });
        observer.observe(modal, { attributes: true, attributeFilter: ['style'] });
        observers.push(observer);
    };

    setupObserver(questionModal, aiAnswerQuestion);
    setupObserver(actionModal, aiDecideOnAction);

    // 3. Roll the dice
    setTimeout(() => {
        console.log("AI is rolling the dice.");
        rollDice();

        // 4. Failsafe to end turn if no action occurs
        setTimeout(() => {
            observers.forEach(o => o.disconnect()); // Clean up observers
            const endTurnBtn = document.getElementById('end-turn-btn');
            // If it's still AI's turn and the end turn button is available, end the turn.
            if (state.players[state.currentPlayerIndex].isAI && !endTurnBtn.disabled) {
                console.log("AI Failsafe: No action required, ending turn.");
                endTurn();
            }
        }, 4000); // 4 seconds after rolling

    }, 1500); // 1.5 second delay before rolling
}

// --- Modified Core Game Logic ---

export function startTurn() {
    const player = state.players[state.currentPlayerIndex];
    if (player.bankrupt) {
        endTurn();
        return;
    }

    ui.updateAllUI();
    console.log(`--- ตาของ ${player.name} ---`);
    
    // ===== AI CHECK =====
    if (player.isAI) {
        playAITurn();
        return; // Hand over control to AI logic
    }
    // ====================

    // Human player logic continues...
    if (player.inJailTurns > 0) {
        const options = [];
        if (player.getOutOfJailFree > 0) {
            options.push({ text: 'ใช้การ์ดนางฟ้า', callback: () => {
                player.getOutOfJailFree--;
                player.inJailTurns = 0;
                ui.hideActionModal();
                ui.enableTurnActions();
            }});
        }
        options.push({ text: 'ยอมข้ามตา', className: 'danger', callback: () => {
            player.inJailTurns--;
            ui.hideActionModal();
            setTimeout(() => endTurn(), 500);
        }});

        ui.showActionModal('ติดเกาะร้าง!', `คุณต้องอยู่บนเกาะอีก ${player.inJailTurns} ตา`, options);
        return;
    }
    
    ui.enableTurnActions();
}

export function endTurn() {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer && currentPlayer.loan && !currentPlayer.bankrupt) {
        currentPlayer.loan.roundsLeft--;
        if (currentPlayer.loan.roundsLeft <= 0) {
            actions.changePlayerMoney(currentPlayer, -currentPlayer.loan.amount, "ชำระหนี้");
            if(currentPlayer.bankrupt) return; // Stop if paying loan causes bankruptcy
            currentPlayer.loan = null;
        }
    }

    const activePlayers = state.players.filter(p => !p.bankrupt);
    if (activePlayers.length <= 1 && state.isGameStarted) {
        ui.showSummary();
        return;
    }

    let nextPlayerIndex = state.currentPlayerIndex;
    do {
        nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length;
    } while (state.players[nextPlayerIndex].bankrupt)
    
    state.setCurrentPlayerIndex(nextPlayerIndex);
    startTurn();
}

export async function movePlayer(steps) {
    const player = state.players[state.currentPlayerIndex];
    let passedGo = false;

    for (let i = 0; i < steps; i++) {
        player.position = (player.position + 1) % state.gameSettings.totalSpaces;
        if (player.position === 0) {
            passedGo = true;
        }
        // Animate pawn movement
        await new Promise(resolve => {
            ui.updatePawnPosition(player);
            setTimeout(resolve, 150); // Animation speed
        });
    }

    if (passedGo) {
        actions.changePlayerMoney(player, state.gameSettings.passGoBonus, "รับโบนัสผ่านจุดเริ่มต้น");
    }

    handleSpaceLanding();
}

export function rollDice() {
    ui.disableGameActions();
    
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    state.setCurrentDiceRoll([d1, d2]);

    ui.updateDice(d1, d2).then(() => {
        console.log(`${state.players[state.currentPlayerIndex].name} ทอยได้ ${d1} + ${d2} = ${d1 + d2}`);
        movePlayer(d1 + d2);
    });
}
