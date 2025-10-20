// js/main.js
import { initializeGameSetup } from './setup.js';
import * as state from './state.js';
import * as ui from './ui.js';
import { rollDice } from './gameLogic.js';
import { endTurn } from './gameFlow.js';
import * as actions from './actions.js';
import * as bot from './bot.js';
import { applyCareerAbility } from './careerHandler.js'; // <-- Import ศูนย์บัญชาการ

// --- Main Initializer ---
async function main() {
    try {
        const response = await fetch('data/mathematicians.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const mathematiciansData = await response.json();
        state.setMathematicians(mathematiciansData);
        
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
    document.getElementById('manage-property-btn').addEventListener('click', () => ui.showManagePropertyModal(false));

    // Question modal
    document.getElementById('submit-answer-btn').addEventListener('click', () => {
        const answerInput = document.getElementById('question-answer');
        const answer = parseFloat(answerInput.value);
        document.getElementById('question-modal').style.display = 'none';
        
        const currentPlayer = state.players[state.currentPlayerIndex];
        
        if (!isNaN(answer) && answer === state.currentQuestion.answer) {
            console.log("ตอบถูก!");
            currentPlayer.correctAnswers++;
            // ความสามารถนักวิชาการ (Scholar) - เรียกใช้ผ่าน careerHandler
            applyCareerAbility('afterQuestionCorrect', null, { player: currentPlayer });

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
        answerInput.value = ''; // เคลียร์ช่องคำตอบ
    });

    // Info sheet modal
    document.getElementById('close-info-sheet-btn').addEventListener('click', () => {
        document.getElementById('info-sheet-modal').style.display = 'none';
    });

    // Summary modal
    document.getElementById('restart-game-btn').addEventListener('click', () => {
        window.location.reload();
    });
    
    // Manage Property Modal listener
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

    // Engineer Button Listener (เพิ่มใหม่)
    const engineerBtn = document.getElementById('engineer-ability-btn');
    if (engineerBtn) {
        engineerBtn.addEventListener('click', () => {
            const player = state.players[state.currentPlayerIndex];
            if (player.career === 'engineer' && !player.engineerAbilityUsedThisTurn) {
                actions.remoteExpandProperty(player);
            }
        });
    }
}

// Start the entire process
main();
