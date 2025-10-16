// js/main.js
import * as state from './state.js';
import * as ui from './ui.js';
import { initializeGameSetup } from './setup.js';
import { endTurn, rollDice } from './gameLogic.js';
import * as actions from './actions.js';

// --- Main Initializer ---
async function main() {
    try {
        console.log("Fetching game data...");
        // Fetch all necessary data files individually
        // ===== CORRECT FILENAMES BASED ON GITHUB =====
        const [mathematiciansRes, questionsRes, chanceRes] = await Promise.all([
            fetch('data/mathematicians.json'),
            fetch('data/questions.json'),      // Correct filename
            fetch('data/chanceCards.json')     // Correct filename (camelCase)
        ]);
        // ===============================================

        if (!mathematiciansRes.ok || !questionsRes.ok || !chanceRes.ok) {
            throw new Error('Network response was not ok while fetching game data.');
        }

        const mathematiciansData = await mathematiciansRes.json();
        const questionsData = await questionsRes.json();
        const chanceCardsData = await chanceRes.json();
        console.log("Game data fetched successfully!");
        
        // Set the fetched data into the game state
        state.setMathematicians(mathematiciansData);
        state.setAllQuestions(questionsData);
        state.setChanceCards(chanceCardsData);

        initializeGameSetup();
        addEventListeners();

    } catch (error) {
        console.error('Failed to load game data:', error);
        alert('ไม่สามารถโหลดข้อมูลสำคัญของเกมได้ กรุณาลองรีเฟรชหน้าเว็บ');
    }
}

// --- Event Listeners ---
function addEventListeners() {
    // Game flow buttons
    document.getElementById('roll-dice-btn').addEventListener('click', rollDice);
    document.getElementById('end-turn-btn').addEventListener('click', endTurn);
    document.getElementById('end-game-btn').addEventListener('click', ui.showSummary);
    document.getElementById('manage-property-btn').addEventListener('click', () => ui.showManagePropertyModal(false));

    // Question modal
    document.getElementById('submit-answer-btn').addEventListener('click', () => {
        const answer = document.getElementById('question-answer').value; // Keep as string for flexible comparison
        ui.hideQuestionModal();
        
        const currentPlayer = state.players[state.currentPlayerIndex];
        currentPlayer.totalQuestions++;
        
        // Use == for flexible comparison to handle "2" == 2
        if (answer == state.currentQuestion.answer) {
            console.log("ตอบถูก!");
            currentPlayer.correctAnswers++;
            ui.showActionModal("ถูกต้อง!", "คุณตอบคำถามถูกต้อง", [{ text: 'ตกลง', callback: () => {
                ui.hideActionModal();
                if(state.onQuestionSuccess) state.onQuestionSuccess();
            }}]);
        } else {
            console.log(`ตอบผิด! คำตอบที่ถูกต้องคือ ${state.currentQuestion.answer}`);
            ui.showActionModal("ผิด!", `น่าเสียดาย! คำตอบที่ถูกต้องคือ: ${state.currentQuestion.answer}`, [{ text: 'ตกลง', callback: () => {
                ui.hideActionModal();
                if(state.onQuestionFail) state.onQuestionFail();
            }}], true);
        }
        ui.updateAllUI();
    });

    // Info sheet modal
    document.getElementById('close-info-sheet-btn').addEventListener('click', () => {
        ui.showInfoSheet(null); // Assuming ui function handles hiding
    });

    // Summary modal
    document.getElementById('restart-game-btn').addEventListener('click', () => {
        window.location.reload();
    });
    
    // Chance card modal
    document.getElementById('chance-card-ok-btn').addEventListener('click', () => {
        ui.showChanceCardModal(false);
        const endTurnBtn = document.getElementById('end-turn-btn');
        if (!endTurnBtn.disabled) {
            endTurn();
        }
    });

    // Manage Property Modal
    const manageModal = document.getElementById('manage-property-modal');
    manageModal.addEventListener('click', (e) => {
        const targetElement = e.target;
        const action = targetElement.dataset.action;
        const currentPlayer = state.players[state.currentPlayerIndex];

        if (targetElement.id === 'close-manage-modal-btn') {
            ui.hideManagePropertyModal();
        }
        else if (action === 'sell') {
            const pId = parseInt(targetElement.dataset.pid);
            if (!isNaN(pId)) {
                actions.sellProperty(currentPlayer, pId);
            }
        }
        else if (action === 'loan') {
            actions.takeLoan(currentPlayer);
        }
    });
}

// Start the entire process
main();

