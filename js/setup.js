// js/setup.js
import * as state from './state.js';
import * as ui from './ui.js';
import { startTurn } from './gameFlow.js';
import { CAREERS } from './careers.js';

function createBoard() {
    const boardElement = document.getElementById('game-board');
    const controlPanel = document.getElementById('control-panel');
    
    // ป้องกันการสร้างซ้ำซ้อน
    if (document.querySelectorAll('.space').length > 0) {
        // เคลียร์แค่ space เก่า ไม่ใช่ทั้งหมด
        document.querySelectorAll('.space').forEach(el => el.remove());
    } else {
        boardElement.innerHTML = ''; // เคลียร์ทั้งหมดถ้าเป็นการสร้างครั้งแรก
    }
    boardElement.appendChild(controlPanel);


    let newBoardSpaces = [];
    let mathIndex = 0;
    const moneyScale = state.gameSettings.startingMoney / 15000;

    for (let i = 0; i < state.gameSettings.totalSpaces; i++) {
        const spaceEl = document.createElement('div');
        spaceEl.id = `space-${i}`;
        spaceEl.classList.add('space');

        let spaceData = { id: i };

        if (i === 0) {
            spaceData.type = 'start';
            spaceData.name = 'จุดเริ่มต้น';
            spaceEl.classList.add('corner');
            spaceEl.innerHTML = `<div class="corner-text-overlay"><span>จุดเริ่มต้น</span></div>`;
        } else if (i === 12) {
            spaceData.type = 'jail';
            spaceData.name = 'เกาะร้าง';
            spaceEl.classList.add('corner');
            spaceEl.innerHTML = `<div class="corner-text-overlay"><span>เกาะร้าง</span></div>`;
        } else if (i === 20) {
            spaceData.type = 'mathematician_corner';
            spaceData.name = 'มุมนักคณิตศาสตร์';
            spaceEl.classList.add('corner');
            spaceEl.innerHTML = `<div class="corner-text-overlay"><span>มุมนักคณิตศาสตร์</span></div>`;
        } else if (i === 32) {
            spaceData.type = 'train_station';
            spaceData.name = 'สถานีรถไฟ';
            spaceEl.classList.add('corner');
            spaceEl.innerHTML = `<div class="corner-text-overlay"><span>สถานีรถไฟ</span></div>`;
        } else if ([6, 16, 26, 36].includes(i)) {
            spaceData.type = 'chance';
            spaceData.name = 'การ์ดดวง';
            spaceEl.classList.add('chance-space');
            spaceEl.innerHTML = `<span>การ์ดดวง</span>`;
        } else {
            const mathematician = state.mathematicians[mathIndex % state.mathematicians.length];
            spaceData.type = 'property';
            spaceData.name = mathematician.shortName;
            spaceData.mathematician = mathematician;
            spaceData.basePrice = Math.round((500 + (mathIndex * 100)) * moneyScale / 50) * 50;
            spaceData.price = spaceData.basePrice;
            spaceData.owner = null;
            spaceData.level = 0;
            spaceData.investment = 0;

            spaceEl.classList.add('property');
            if ((i >= 13 && i <= 19) || (i >= 33 && i <= 39)) {
                spaceEl.classList.add('vertical-property');
            }
            spaceEl.innerHTML = `
                <img src="${mathematician.img}" class="space-image" alt="${spaceData.name}" onerror="this.onerror=null;this.src='https://placehold.co/100x120/EEE/31343C?text=Img';">
                <div class="space-info">
                    <div class="space-name">${spaceData.name}</div>
                    <div class="space-price">฿${spaceData.price.toLocaleString()}</div>
                </div>
                <div class="level-badge-container"></div>
            `;
            spaceEl.addEventListener('click', () => { if(state.isGameStarted) ui.showInfoSheet(spaceData); });
            mathIndex++;
        }

        newBoardSpaces.push(spaceData);
        boardElement.appendChild(spaceEl);
    }
    state.setBoardSpaces(newBoardSpaces);
}

function createPlayerPawns() {
    const boardElement = document.getElementById('game-board');
    document.querySelectorAll('.pawn').forEach(p => p.remove());
    for (let i = 0; i < state.players.length; i++) {
        const pawn = document.createElement('div');
        pawn.id = `pawn-${i}`;
        pawn.className = 'pawn';
        pawn.style.backgroundColor = state.players[i].color;
        boardElement.appendChild(pawn);
        ui.updatePawnPosition(state.players[i]);
    }
}

function startGame() {
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

    document.getElementById('career-mode-check').addEventListener('change', (e) => {
        const display = e.target.checked ? 'block' : 'none';
        document.querySelectorAll('.career-selection-wrapper').forEach(el => el.style.display = display);
        if (!e.target.checked) {
            document.querySelectorAll('.player-career-select').forEach(select => {
                select.value = 'none';
                const desc = select.closest('.player-setup').querySelector('.career-description');
                desc.textContent = CAREERS['none'].description;
            });
        }
    });
    
    document.getElementById('start-game-btn-confirm').addEventListener('click', startGame);
    document.getElementById('close-setup-btn').addEventListener('click', () => {
        document.getElementById('setup-screen').style.display = 'none';
        document.getElementById('splash-screen').style.display = 'flex';
    });

    document.getElementById('about-modal').addEventListener('click', (e) => {
        if (e.target.id === 'close-about-btn' || e.target.id === 'about-modal') {
            document.getElementById('about-modal').style.display = 'none';
        }
    });
}
