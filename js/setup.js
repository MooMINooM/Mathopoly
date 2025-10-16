// js/setup.js
import * as state from './state.js';
import * as ui from './ui.js';
import { startTurn } from './gameFlow.js';
import { CAREERS } from './careers.js'; // <-- Import อาชีพ

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
    const adjacencyBonus = document.getElementById('adjacency-bonus-check').checked;
    const careerMode = document.getElementById('career-mode-check').checked;
    
    state.setGameSetting('winByBelt', winByBelt);
    state.setGameSetting('winByCorners', winByCorners);
    state.setGameSetting('adjacencyBonus', adjacencyBonus);
    state.setGameSetting('careerMode', careerMode);

    const playerInputs = document.querySelectorAll('.player-setup');
    const newPlayers = [];

    playerInputs.forEach((inputEl, index) => {
        const nameInput = inputEl.querySelector('.player-name-input');
        const difficultySelect = inputEl.querySelector('.player-difficulty-select');
        const typeSelect = inputEl.querySelector('.player-type-select');
        const careerSelect = inputEl.querySelector('.player-career-select');
        const playerName = nameInput.value.trim();

        if (playerName !== '' && (index < 2 || playerName !== nameInput.placeholder)) {
             newPlayers.push({
                id: newPlayers.length,
                name: playerName,
                money: parseInt(document.getElementById('starting-money').value),
                position: 0,
                properties: [],
                difficulty: difficultySelect.value,
                career: careerMode ? careerSelect.value : 'none', // <-- บันทึกอาชีพ
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

// --- START: ฟังก์ชันใหม่สำหรับสร้างการ์ดตั้งค่าผู้เล่น ---
function generatePlayerSetupCards() {
    const container = document.getElementById('player-details-container');
    container.innerHTML = '';
    
    let careerOptions = '';
    for (const key in CAREERS) {
        careerOptions += `<option value="${key}">${CAREERS[key].name}</option>`;
    }

    for (let i = 1; i <= 6; i++) {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-setup';
        
        const defaultValue = (i <= 2) ? `ผู้เล่น ${i}` : '';
        const placeholder = (i <= 2) ? `ชื่อผู้เล่น ${i}` : 'เว้นว่างไว้ถ้าไม่เล่น';
        
        playerCard.innerHTML = `
            <h4>ผู้เล่น ${i}</h4>
            <input type="text" class="player-name-input" placeholder="${placeholder}" value="${defaultValue}" style="margin-bottom: 8px;">
            <select class="player-difficulty-select">
                <option value="p1">ประถม 1</option>
                <option value="p2">ประถม 2</option>
                <option value="p3" ${i === 2 ? 'selected' : ''}>ประถม 3</option>
                <option value="p4">ประถม 4</option>
                <option value="p5">ประถม 5</option>
                <option value="p6">ประถม 6</option>
                <option value="m1">มัธยม 1</option>
                <option value="m2">มัธยม 2</option>
                <option value="m3">มัธยม 3</option>
            </select>
            <select class="player-type-select" style="margin-top: 5px;">
                <option value="human">ผู้เล่น</option>
                <option value="bot" ${i === 2 ? 'selected' : ''}>บอท</option>
            </select>
            <div class="career-selection-wrapper" style="display: none; margin-top: 5px;">
                <select class="player-career-select">${careerOptions}</select>
            </div>
        `;
        container.appendChild(playerCard);
    }
}
// --- END: ฟังก์ชันใหม่ ---

export function initializeGameSetup() {
    generatePlayerSetupCards(); // สร้างการ์ดตอนเริ่มต้น
    document.querySelector('.game-container').style.display = 'none';

    // Main menu buttons
    document.getElementById('classic-mode-btn').addEventListener('click', () => {
        document.getElementById('setup-title').textContent = 'ตั้งค่าเกม - โหมดคลาสสิค';
        document.getElementById('special-rules-section').style.display = 'none';
        document.getElementById('career-mode-check').checked = false;
        document.querySelectorAll('.career-selection-wrapper').forEach(el => el.style.display = 'none');
        document.getElementById('splash-screen').style.display = 'none';
        document.getElementById('setup-screen').style.display = 'flex';
    });
    
    document.getElementById('custom-mode-btn').addEventListener('click', () => {
        document.getElementById('setup-title').textContent = 'ตั้งค่าเกม - โหมดปรับแต่ง';
        document.getElementById('special-rules-section').style.display = 'block';
        document.getElementById('splash-screen').style.display = 'none';
        document.getElementById('setup-screen').style.display = 'flex';
    });

    // Event listener for career mode checkbox
    document.getElementById('career-mode-check').addEventListener('change', (e) => {
        const display = e.target.checked ? 'block' : 'none';
        document.querySelectorAll('.career-selection-wrapper').forEach(el => el.style.display = display);
    });
    
    document.getElementById('show-about-btn').addEventListener('click', () => {
        document.getElementById('about-modal').style.display = 'flex';
    });

    // Setup screen buttons
    document.getElementById('start-game-btn').addEventListener('click', startGame);
    document.getElementById('close-setup-btn').addEventListener('click', () => {
        document.getElementById('setup-screen').style.display = 'none';
        document.getElementById('splash-screen').style.display = 'flex';
    });

    // About modal button
    document.getElementById('close-about-btn').addEventListener('click', () => {
        document.getElementById('about-modal').style.display = 'none';
    });
}
