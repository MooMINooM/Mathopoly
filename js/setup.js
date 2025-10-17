// js/setup.js
import * as state from './state.js';
import * as ui from './ui.js';
import { startTurn } from './gameFlow.js';
import { CAREERS } from './careers.js';

function createBoard() {
    // ... (no changes needed here)
}

function createPlayerPawns() {
    // ... (no changes needed here)
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
                career: careerMode ? careerSelect.value : 'none',
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
        playerCard.id = `player-setup-${i}`;
        
        const defaultValue = (i <= 2) ? `ผู้เล่น ${i}` : '';
        const placeholder = (i <= 2) ? `ชื่อผู้เล่น ${i}` : 'เว้นว่างไว้ถ้าไม่เล่น';
        
        playerCard.innerHTML = `
            <h4>ผู้เล่น ${i}</h4>
            <div class="player-setup-grid">
                <div class="input-group">
                    <label>ชื่อผู้เล่น</label>
                    <input type="text" class="player-name-input" placeholder="${placeholder}" value="${defaultValue}">
                </div>
                <div class="input-group">
                    <label>ประเภท</label>
                    <select class="player-type-select">
                        <option value="human">ผู้เล่น</option>
                        <option value="bot" ${i === 2 ? 'selected' : ''}>บอท</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>ระดับคำถาม</label>
                    <select class="player-difficulty-select">
                        <option value="p1">ประถม 1</option><option value="p2">ประถม 2</option>
                        <option value="p3" ${i === 2 ? 'selected' : ''}>ประถม 3</option>
                        <option value="p4">ประถม 4</option><option value="p5">ประถม 5</option>
                        <option value="p6">ประถม 6</option><option value="m1">มัธยม 1</option>
                        <option value="m2">มัธยม 2</option><option value="m3">มัธยม 3</option>
                    </select>
                </div>
                <div class="input-group career-selection-wrapper" style="display: none;">
                    <label>อาชีพ</label>
                    <select class="player-career-select">${careerOptions}</select>
                </div>
                <p class="career-description career-selection-wrapper" style="display: none;">${CAREERS['none'].description}</p>
            </div>
        `;
        container.appendChild(playerCard);

        // Add event listener for career description
        const careerSelect = playerCard.querySelector('.player-career-select');
        const careerDesc = playerCard.querySelector('.career-description');
        careerSelect.addEventListener('change', () => {
            const selectedCareer = CAREERS[careerSelect.value];
            careerDesc.textContent = selectedCareer.description;
        });
    }
}

export function initializeGameSetup() {
    generatePlayerSetupCards();
    document.querySelector('.game-container').style.display = 'none';

    // Main menu buttons
    document.getElementById('start-game-btn').addEventListener('click', () => {
        document.getElementById('setup-title').textContent = 'ตั้งค่าเกม';
        document.getElementById('special-rules-section').style.display = 'block';
        
        const careerCheckbox = document.getElementById('career-mode-check');
        const display = careerCheckbox.checked ? 'block' : 'none';
        document.querySelectorAll('.career-selection-wrapper').forEach(el => el.style.display = display);

        document.getElementById('splash-screen').style.display = 'none';
        document.getElementById('setup-screen').style.display = 'flex';
    });
    
    document.getElementById('show-about-btn').addEventListener('click', () => {
        document.getElementById('about-modal').style.display = 'flex';
    });

    // Event listener for career mode checkbox
    document.getElementById('career-mode-check').addEventListener('change', (e) => {
        const display = e.target.checked ? 'block' : 'none';
        document.querySelectorAll('.career-selection-wrapper').forEach(el => el.style.display = display);
        // Reset career selection to 'none' and update description when hiding
        if (!e.target.checked) {
            document.querySelectorAll('.player-career-select').forEach(select => {
                select.value = 'none';
                const desc = select.closest('.player-setup').querySelector('.career-description');
                desc.textContent = CAREERS['none'].description;
            });
        }
    });
    
    // Setup screen buttons
    document.getElementById('start-game-btn-confirm').addEventListener('click', startGame);
    document.getElementById('close-setup-btn').addEventListener('click', () => {
        document.getElementById('setup-screen').style.display = 'none';
        document.getElementById('splash-screen').style.display = 'flex';
    });

    // About modal button
    document.getElementById('close-about-btn').addEventListener('click', () => {
        document.getElementById('about-modal').style.display = 'none';
    });
}
