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
        initializeUISetupListeners();
        addGameEventListeners();

    } catch (error) {
        console.error('Failed to load game data:', error);
        alert('ไม่สามารถโหลดข้อมูลสำคัญของเกมได้ กรุณาลองรีเฟรชหน้าเว็บ');
    }
}

// --- Setup & Initialization ---
function initializeUISetupListeners() {
    document.getElementById('show-setup-btn').addEventListener('click', () => {
        splashScreen.style.display = 'none';
        setupScreen.style.display = 'flex';
    });
    
    document.getElementById('show-about-btn').addEventListener('click', () => ui.showAboutModal(true));
    document.getElementById('close-about-btn').addEventListener('click', () => ui.showAboutModal(false));

    document.getElementById('close-setup-btn').addEventListener('click', () => {
        setupScreen.style.display = 'none';
        splashScreen.style.display = 'flex';
    });

    startGameBtn.addEventListener('click', createPlayersAndStartGame);
}

function createPlayersAndStartGame() {
    const playerSetups = document.querySelectorAll('.player-setup');
    const players = [];
    const startingMoney = parseInt(document.getElementById('starting-money').value, 10);
    let aiCount = 0;

    playerSetups.forEach((setup, index) => {
        const nameInput = setup.querySelector('.player-name-input');
        const name = nameInput.value.trim();
        const type = setup.querySelector('.player-type-select').value;
        
        if (name || type === 'ai') {
            const difficulty = setup.querySelector('.player-difficulty-select').value;
            
            let playerName = name;
            if (type === 'ai' && !name) {
                aiCount++;
                playerName = `คอมพิวเตอร์ ${aiCount}`;
            }

            players.push({
                id: index,
                name: playerName,
                money: startingMoney,
                position: 0,
                properties: [],
                isAI: type === 'ai',
                difficulty: difficulty,
                inJailTurns: 0,
                bankrupt: false,
                getOutOfJailFree: 0,
                correctAnswers: 0,
                totalQuestions: 0,
                loan: null,
                color: `var(--player${index + 1}-color)`
            });
        }
    });

    if (players.length < 1) {
        ui.showActionModal("ผู้เล่นไม่พอ", "กรุณาตั้งค่าผู้เล่นอย่างน้อย 1 คน (สามารถเป็นคนหรือ AI ก็ได้)", [{ text: 'ตกลง', callback: ui.hideActionModal }], true);
        return;
    }

    state.setPlayers(players);
    state.setGameStarted(true);
    setupScreen.style.display = 'none';
    gameContainer.style.display = 'flex';
    
    startGameFlow();
}

function startGameFlow() {
    ui.createBoard();
    ui.createPlayerPawns();
    ui.updateAllUI();
    state.setCurrentPlayerIndex(0);
    console.log(`เกมเริ่มต้นแล้ว! ตาของ ${state.players[0].name}`);
    
    // Dynamically import and start the first turn
    import('./gameLogic.js').then(gameLogic => {
        gameLogic.startTurn();
    });
}

// --- Event Listeners ---
function addGameEventListeners() {
    document.getElementById('roll-dice-btn').addEventListener('click', () => {
        // Ensure the current player is not an AI before allowing a manual roll
        if (state.players.length > 0 && !state.players[state.currentPlayerIndex].isAI) {
            rollDice();
        }
    });
    document.getElementById('end-turn-btn').addEventListener('click', endTurn);
    document.getElementById('end-game-btn').addEventListener('click', ui.showSummary);
    document.getElementById('manage-property-btn').addEventListener('click', () => ui.showManagePropertyModal(false));
    document.getElementById('submit-answer-btn').addEventListener('click', handleSubmitAnswer);
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
        const currentPlayer = state.players[state.currentPlayerIndex];

        if (targetElement.id === 'close-manage-modal-btn') {
            ui.hideManagePropertyModal();
        } else if (action === 'sell') {
            const pId = parseInt(targetElement.dataset.pid);
            if (!isNaN(pId)) actions.sellProperty(currentPlayer, pId);
        } else if (action === 'loan') {
            actions.takeLoan(currentPlayer);
        }
    });
}

function handleSubmitAnswer() {
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
}

// Start the entire process
main();

