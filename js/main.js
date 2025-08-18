// js/main.js
import { initializeGameSetup } from './setup.js';
import * as state from './state.js';
import * as ui from './ui.js';
import { endTurn, rollDice } from './gameLogic.js';
import * as actions from './actions.js';

// --- Main Initializer ---
async function main() {
    try {
        const response = await fetch('data/mathematicians.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const mathematiciansData = await response.json();
        state.setMathematicians(mathematiciansData);
        
        // When data is loaded, initialize the setup and add event listeners
        initializeGameSetup();
        addEventListeners();

    } catch (error) {
        console.error('Failed to load mathematician data:', error);
        alert('ไม่สามารถโหลดข้อมูลสำคัญของเกมได้ กรุณาลองรีเฟรชหน้าเว็บ');
    }
}

// --- Event Listeners ---
function addEventListeners() {
    // Game flow buttons
    document.getElementById('roll-dice-btn').addEventListener('click', rollDice);
    document.getElementById('end-turn-btn').addEventListener('click', endTurn);
    document.getElementById('end-game-btn').addEventListener('click', ui.showSummary);

    // Question modal
    document.getElementById('submit-answer-btn').addEventListener('click', () => {
        const answer = parseFloat(document.getElementById('question-answer').value);
        document.getElementById('question-modal').style.display = 'none';
        
        const currentPlayer = state.players[state.currentPlayerIndex];
        
        if (answer === state.currentQuestion.answer) {
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
        ui.updatePlayerInfo();
    });

    // Info sheet modal
    document.getElementById('close-info-sheet-btn').addEventListener('click', () => {
        document.getElementById('info-sheet-modal').style.display = 'none';
    });

    // Summary modal
    document.getElementById('restart-game-btn').addEventListener('click', () => {
        window.location.reload();
    });
    
    // Manage property modal
    document.getElementById('manage-property-btn').addEventListener('click', () => ui.showManagePropertyModal(false));
    document.getElementById('close-manage-modal-btn').addEventListener('click', ui.hideManagePropertyModal);
    
    document.getElementById('sell-property-list').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const pId = parseInt(e.target.dataset.pid);
            const currentPlayer = state.players[state.currentPlayerIndex];
            actions.sellProperty(currentPlayer, pId);
        }
    });
}

// Start the entire process

main();
