// js/main.js
// NO LONGER IMPORTS from gamedata.js

import * as state from './state.js';
import * as ui from './ui.js';
import { endTurn, rollDice } from './gameLogic.js';
import * as actions from './actions.js';

// --- DOM Elements ---
const splashScreen = document.getElementById('splash-screen');
const setupScreen = document.getElementById('setup-screen');
const gameContainer = document.querySelector('.game-container');
const startGameBtn = document.getElementById('start-game-btn');
const questionModal = document.getElementById('question-modal');
const actionModal = document.getElementById('action-modal');

// --- Main Initializer (FIXED) ---
async function main() {
    try {
        // Fetch all necessary data files individually
        const [mathematiciansRes, questionsRes, chanceRes] = await Promise.all([
            fetch('data/mathematicians.json'),
            fetch('data/questions.json'),
            fetch('data/chanceCards.json')
        ]);

        if (!mathematiciansRes.ok || !questionsRes.ok || !chanceRes.ok) {
            throw new Error('Network response was not ok while fetching game data.');
        }

        const mathematiciansData = await mathematiciansRes.json();
        const questionsData = await questionsRes.json();
        const chanceCardsData = await chanceRes.json();
        
        // Set the fetched data into the game state
        state.setMathematicians(mathematiciansData);
        state.setAllQuestions(questionsData);
        state.setChanceCards(chanceCardsData);

        // This function now correctly initializes the setup process AFTER data is loaded
        initializeGameSetup();
        addGameEventListeners();

    } catch (error) {
        console.error('Failed to load game data:', error);
        alert('ไม่สามารถโหลดข้อมูลสำคัญของเกมได้ กรุณาลองรีเฟรชหน้าเว็บ');
    }
}

// NOTE: This is the original 'initializeGameSetup' function from your code
// It's being kept, but it is now called from within main()
export function initializeGameSetup() {
    document.querySelector('.game-container').style.display = 'none';

    // Main menu buttons
    document.getElementById('show-setup-btn').addEventListener('click', () => {
        document.getElementById('splash-screen').style.display = 'none';
        document.getElementById('setup-screen').style.display = 'flex';
    });
     document.getElementById('show-about-btn').addEventListener('click', () => {
        document.getElementById('about-modal').style.display = 'flex';
    });

    // Setup screen buttons
    document.getElementById('start-game-btn').addEventListener('click', startGame); // This now calls the correct startGame
    document.getElementById('close-setup-btn').addEventListener('click', () => {
        document.getElementById('setup-screen').style.display = 'none';
        document.getElementById('splash-screen').style.display = 'flex';
    });

    // About modal button
    document.getElementById('close-about-btn').addEventListener('click', () => {
        document.getElementById('about-modal').style.display = 'none';
    });
}


// This function is now simplified as it doesn't need to create players
function startGame() {
    const playerInputs = document.querySelectorAll('.player-setup');
    const newPlayers = [];
    let aiCount = 0;

    playerInputs.forEach((inputEl) => {
        const nameInput = inputEl.querySelector('.player-name-input');
        const difficultySelect = inputEl.querySelector('.player-difficulty-select');
        const typeSelect = inputEl.querySelector('.player-type-select');
        const playerName = nameInput.value.trim();
        const playerType = typeSelect.value;

        if (playerName !== '' || playerType === 'ai') {
            let finalName = playerName;
            if (playerType === 'ai' && playerName === '') {
                aiCount++;
                finalName = `คอมพิวเตอร์ ${aiCount}`;
            }

            newPlayers.push({
                id: newPlayers.length,
                name: finalName,
                money: parseInt(document.getElementById('starting-money').value),
                position: 0,
                properties: [],
                difficulty: difficultySelect.value,
                isAI: playerType === 'ai',
                correctAnswers: 0,
                totalQuestions: 0,
                inJailTurns: 0,
                loan: null,
                getOutOfJailFree: 0,
                bankrupt: false,
                color: `var(--player${newPlayers.length + 1}-color)`
            });
        }
    });
    
    if (newPlayers.length < 1) {
        ui.showActionModal("ผู้เล่นไม่พอ", "กรุณาตั้งค่าผู้เล่นอย่างน้อย 1 คน (สามารถเป็นคนหรือ AI ก็ได้)", [{ text: 'ตกลง', callback: ui.hideActionModal }], true);
        return;
    }
    
    state.setPlayers(newPlayers);
    state.setGameStarted(true);
    state.setGameSetting('startingMoney', parseInt(document.getElementById('starting-money').value));

    // We no longer call createBoard here, it should be part of the UI initialization
    ui.createBoard();

    document.getElementById('setup-screen').style.display = 'none';
    document.querySelector('.game-container').style.display = 'flex';

    setTimeout(() => {
        ui.createPlayerPawns();
        ui.updateAllUI();
        state.setCurrentPlayerIndex(0);
        console.log(`เกมเริ่มต้นแล้ว! ตาของ ${state.players[0].name}`);
        // This is now handled by gameLogic
        // startTurn(); 
        const firstPlayer = state.players[0];
        if (firstPlayer.isAI) {
            // A function to specifically start AI turn might be needed in gameLogic
            // for now let's rely on gameLogic.startTurn() to have the AI check
            import('./gameLogic.js').then(gameLogic => gameLogic.startTurn());
        } else {
             import('./gameLogic.js').then(gameLogic => gameLogic.startTurn());
        }

    }, 50);
}


// --- Event Listeners ---
function addGameEventListeners() {
    document.getElementById('roll-dice-btn').addEventListener('click', rollDice);
    document.getElementById('end-turn-btn').addEventListener('click', endTurn);
    document.getElementById('end-game-btn').addEventListener('click', ui.showSummary);
    document.getElementById('manage-property-btn').addEventListener('click', () => ui.showManagePropertyModal(false));

    document.getElementById('submit-answer-btn').addEventListener('click', () => {
        const answer = document.getElementById('question-answer').value;
        ui.hideQuestionModal();
        
        const currentPlayer = state.players[state.currentPlayerIndex];
        currentPlayer.totalQuestions++;
        
        if (answer == state.currentQuestion.answer) {
            currentPlayer.correctAnswers++;
            ui.showActionModal("ถูกต้อง!", "คุณตอบคำถามถูกต้อง", [{ text: 'ตกลง', callback: () => {
                ui.hideActionModal();
                if(state.onQuestionSuccess) state.onQuestionSuccess();
            }}]);
        } else {
            ui.showActionModal("ผิด!", `น่าเสียดาย! คำตอบที่ถูกต้องคือ: ${state.currentQuestion.answer}`, [{ text: 'ตกลง', callback: () => {
                ui.hideActionModal();
                if(state.onQuestionFail) state.onQuestionFail();
            }}], true);
        }
        ui.updateAllUI();
    });

    document.getElementById('close-info-sheet-btn').addEventListener('click', () => ui.showInfoSheet(null));
    document.getElementById('restart-game-btn').addEventListener('click', () => window.location.reload());
    document.getElementById('chance-card-ok-btn').addEventListener('click', () => {
        ui.showChanceCardModal(false);
        const endTurnBtn = document.getElementById('end-turn-btn');
        if (!endTurnBtn.disabled) {
            endTurn();
        }
    });

    const manageModal = document.getElementById('manage-property-modal');
    manageModal.addEventListener('click', (e) => {
        const targetElement = e.target;
        const action = targetElement.dataset.action;
        if (targetElement.id === 'close-manage-modal-btn') {
            ui.hideManagePropertyModal();
        } else if (action === 'sell') {
            actions.sellProperty(state.players[state.currentPlayerIndex], parseInt(targetElement.dataset.pid));
        } else if (action === 'loan') {
            actions.takeLoan(state.players[state.currentPlayerIndex]);
        }
    });
}

// Start the entire process
main();

