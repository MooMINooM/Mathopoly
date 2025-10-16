// js/setup.js
import * as state from './state.js';
import * as ui from './ui.js';
import { startTurn } from './gameLogic.js';

function createBoard() {
    // ... (โค้ดส่วนนี้เหมือนเดิม)
}

function createPlayerPawns() {
    // ... (โค้ดส่วนนี้เหมือนเดิม)
}

function startGame() {
    // อ่านค่ากฎพิเศษ
    const winByBelt = document.getElementById('win-by-belt-check').checked;
    const winByCorners = document.getElementById('win-by-corners-check').checked;
    const adjacencyBonus = document.getElementById('adjacency-bonus-check').checked; // <-- เพิ่มบรรทัดนี้
    
    state.setGameSetting('winByBelt', winByBelt);
    state.setGameSetting('winByCorners', winByCorners);
    state.setGameSetting('adjacencyBonus', adjacencyBonus); // <-- เพิ่มบรรทัดนี้

    // ... (โค้ดส่วนที่เหลือของ startGame เหมือนเดิม)
    const playerInputs = document.querySelectorAll('.player-setup');
    const newPlayers = [];

    playerInputs.forEach((inputEl, index) => {
        const nameInput = inputEl.querySelector('.player-name-input');
        const difficultySelect = inputEl.querySelector('.player-difficulty-select');
        const typeSelect = inputEl.querySelector('.player-type-select');
        const playerName = nameInput.value.trim();

        if (playerName !== '' && (index < 2 || playerName !== nameInput.placeholder)) {
             newPlayers.push({
                id: newPlayers.length,
                name: playerName,
                money: parseInt(document.getElementById('starting-money').value),
                position: 0,
                properties: [],
                difficulty: difficultySelect.value,
                correctAnswers: 0,
                totalQuestions: 0,
                inJailTurns: 0,
                loan: null,
                getOutOfJailFree: 0,
                bankrupt: false,
                isBot: typeSelect.value === 'bot',
                color: `var(--player${newPlayers.length + 1}-color)`
            });
        }
    });

    if (newPlayers.length < 2) {
        ui.showActionModal("ผู้เล่นไม่พอ", "กรุณากรอกชื่อผู้เล่นอย่างน้อย 2 คน", [{ text: 'ตกลง', callback: ui.hideActionModal }], true);
        return;
    }
    
    state.setPlayers(newPlayers);
    state.setGameStarted(true);
    state.setGameSetting('startingMoney', parseInt(document.getElementById('starting-money').value));

    createBoard();

    document.getElementById('setup-screen').style.display = 'none';
    document.querySelector('.game-container').style.display = 'flex';

    setTimeout(() => {
        createPlayerPawns();
        ui.updateAllUI();
        state.setCurrentPlayerIndex(0);
        console.log(`เกมเริ่มต้นแล้ว! ตาของ ${state.players[0].name}`);
        startTurn();
    }, 50);
}

export function initializeGameSetup() {
    // ... (โค้ดส่วนนี้เหมือนเดิม)
}
