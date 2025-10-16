// js/main.js
import { gameBoard, mathematicians, questions, chanceCards } from '../data/gamedata.js';
import * as state from './state.js';
import * as ui from './ui.js';
import { endTurn as originalEndTurn, rollDice as originalRollDice, handleTileAction } from './gameLogic.js';
import * as actions from './actions.js';

// --- DOM Elements ---
const splashScreen = document.getElementById('splash-screen');
const setupScreen = document.getElementById('setup-screen');
const gameContainer = document.querySelector('.game-container');
const startGameBtn = document.getElementById('start-game-btn');
const questionModal = document.getElementById('question-modal');
const actionModal = document.getElementById('action-modal');

// --- Main Initializer ---
function main() {
    state.setGameBoard(gameBoard);
    state.setMathematicians(mathematicians);
    state.setQuestions(questions);
    state.setChanceCards(chanceCards);

    initializeUISetupListeners();
    addGameEventListeners();
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

    playerSetups.forEach((setup, index) => {
        const nameInput = setup.querySelector('.player-name-input');
        const name = nameInput.value.trim();
        const type = setup.querySelector('.player-type-select').value;
        
        // เพิ่มผู้เล่นเมื่อมีชื่อ หรือเป็น AI
        if (name || type === 'ai') {
            const difficulty = setup.querySelector('.player-difficulty-select').value;
            
            let playerName = name;
            if (type === 'ai' && !name) {
                playerName = `คอมพิวเตอร์ ${players.filter(p => p.isAI).length + 1}`;
            }

            players.push({
                id: index,
                name: playerName,
                money: startingMoney,
                position: 0,
                properties: [],
                isAI: type === 'ai',
                difficulty: difficulty,
                inJail: false,
                jailTurns: 0,
                status: 'playing',
                correctAnswers: 0,
                totalQuestions: 0,
                getOutOfJailFree: 0,
                tokenColor: state.playerColors[index]
            });
        }
    });

    if (players.length < 1) {
        alert('กรุณาตั้งค่าผู้เล่นอย่างน้อย 1 คน (สามารถเลือกเป็น AI ได้)');
        return;
    }

    state.setPlayers(players);
    setupScreen.style.display = 'none';
    gameContainer.style.display = 'flex';
    startGame();
}

function startGame() {
    state.setGameActive(true);
    state.setCurrentPlayerIndex(0);
    ui.initializeBoard(state.gameBoard);
    ui.initializePlayersOnBoard(state.players);
    ui.updatePlayerInfo();
    checkCurrentPlayerIsAI();
}

// --- Event Listeners ---
function addGameEventListeners() {
    document.getElementById('roll-dice-btn').addEventListener('click', () => {
        if (!state.players[state.currentPlayerIndex].isAI) {
            originalRollDice();
        }
    });
    document.getElementById('end-turn-btn').addEventListener('click', endTurn);
    document.getElementById('end-game-btn').addEventListener('click', ui.showSummary);
    document.getElementById('manage-property-btn').addEventListener('click', () => ui.showManagePropertyModal(false));
    document.getElementById('submit-answer-btn').addEventListener('click', handleSubmitAnswer);
    document.getElementById('close-info-sheet-btn').addEventListener('click', () => ui.showInfoSheetModal(false));
    document.getElementById('restart-game-btn').addEventListener('click', () => window.location.reload());
    document.getElementById('chance-card-ok-btn').addEventListener('click', () => ui.showChanceCardModal(false));

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
    const answer = document.getElementById('question-answer').value.trim();
    ui.showQuestionModal(false);

    const currentPlayer = state.players[state.currentPlayerIndex];
    currentPlayer.totalQuestions++;
    
    // Use '==' for flexible comparison (string vs number)
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
    ui.updatePlayerInfo();
}


// --- Turn Management with AI ---
function endTurn() {
    originalEndTurn(); // เปลี่ยนตาผู้เล่นใน state
    checkCurrentPlayerIsAI();
}

function checkCurrentPlayerIsAI() {
    if (!state.gameActive) return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.isAI) {
        ui.disableControls();
        ui.showActionModal(`ตาของ ${currentPlayer.name}`, "คอมพิวเตอร์กำลังคิด...", [], false, 1500);
        setTimeout(playAITurn, 2000);
    } else {
        ui.enableControls();
    }
}

// --- AI Logic ---
function playAITurn() {
    const aiPlayer = state.players[state.currentPlayerIndex];
    if (aiPlayer.status === 'bankrupt' || !state.gameActive) {
        endTurn();
        return;
    }

    console.log(`--- Executing AI turn for ${aiPlayer.name} ---`);
    
    // ตั้งค่า Observer เพื่อ "ดักฟัง" ว่ามี Modal เปิดขึ้นมาหรือไม่
    const observerCallback = (modalElement, handler) => {
        const observer = new MutationObserver((mutations) => {
            if (modalElement.style.display !== 'none') {
                observer.disconnect(); // หยุด observe ทันทีที่เจอ
                setTimeout(() => handler(modalElement), 1200); // หน่วงเวลาให้เหมือน AI คิด
            }
        });
        observer.observe(modalElement, { attributes: true, attributeFilter: ['style'] });
        return observer;
    };

    const questionObserver = observerCallback(questionModal, aiAnswerQuestion);
    const actionObserver = observerCallback(actionModal, aiHandleAction);

    // AI เริ่มทอยลูกเต๋า ซึ่งจะไปกระตุ้น Logic ของเกม
    originalRollDice();

    // หากไม่มี Modal ใดๆ แสดงขึ้นมาใน 4 วินาที ให้จบตาเลย
    setTimeout(() => {
        questionObserver.disconnect();
        actionObserver.disconnect();
        if (questionModal.style.display === 'none' && actionModal.style.display === 'none') {
            const endTurnBtn = document.getElementById('end-turn-btn');
            if (!endTurnBtn.disabled) {
                console.log("AI sees no action, ending turn.");
                endTurn();
            }
        }
    }, 4000);
}

// AI ตอบคำถาม
function aiAnswerQuestion() {
    console.log("AI is answering question...");
    const answer = state.currentQuestion.answer;
    const isCorrect = Math.random() < 0.75; // AI มีโอกาสตอบถูก 75%

    document.getElementById('question-answer').value = isCorrect ? answer : (typeof answer === 'number' ? answer + 1 : 'wrong_answer');
    document.getElementById('submit-answer-btn').click();
}

// AI ตัดสินใจใน Action Modal (เช่น ซื้อ, จ่ายเงิน, ตกลง)
function aiHandleAction(modalElement) {
    console.log("AI is handling an action...");
    const buttonsContainer = modalElement.querySelector('#action-modal-buttons');
    if (!buttonsContainer) return;

    const primaryButton = buttonsContainer.querySelector('button:not(.danger):not(.secondary)');
    
    // AI จะพยายามกดปุ่มหลัก (เช่น 'ซื้อ', 'ตกลง') ก่อนเสมอ
    if (primaryButton) {
        primaryButton.click();
    } else {
        // หากไม่มีปุ่มหลัก ให้กดปุ่มแรกที่เจอ
        const anyButton = buttonsContainer.querySelector('button');
        if (anyButton) {
            anyButton.click();
        }
    }
}

// Start the entire process
main();
