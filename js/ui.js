// js/ui.js
import * as state from './state.js';
import { generateQuestion } from './questions.js';
import { calculateRent } from './utils.js';
import { CAREERS } from './careers.js';

const MAX_LOG_MESSAGES = 40;

export function addLogMessage(message) {
    const gameLogList = document.getElementById('game-log-list');
    if (!gameLogList) {
        console.log("Log UI not ready:", message.replace(/<[^>]*>/g, ''));
        return;
    }

    const logItem = document.createElement('li');
    logItem.innerHTML = message;
    gameLogList.prepend(logItem);

    while (gameLogList.children.length > MAX_LOG_MESSAGES) {
        gameLogList.removeChild(gameLogList.lastChild);
    }
}

// --- UI Update Functions ---
export function updateAllUI() {
    updatePlayerInfo();
    updateBoardUI();
    state.players.forEach(p => { if(!p.bankrupt) updatePawnPosition(p) });
}

export function updatePlayerInfo() {
    const playerContainer = document.getElementById('player-info-container');
    playerContainer.innerHTML = ''; 

    for (let i = 0; i < 6; i++) {
        const player = state.players.find(p => p.id === i && !p.bankrupt);
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-info';

        if (player) {
            if (player.id === state.currentPlayerIndex) {
                playerDiv.classList.add('active');
            }
            playerDiv.style.setProperty('--player-color', player.color);

            let statusHTML = '';
            if (player.inJailTurns > 0) statusHTML += `<span>ติดเกาะร้าง</span>`;
            if (player.loan) statusHTML += `<span>หนี้ (${player.loan.roundsLeft} ตา)</span>`;
            if (player.getOutOfJailFree > 0) statusHTML += `<span>การ์ดฟรี ${player.getOutOfJailFree} ใบ</span>`;
            
            const career = CAREERS[player.career];
            const careerHTML = state.gameSettings.careerMode ? `<div class="player-career" title="${career.description}">${career.name}</div>` : '';

            playerDiv.innerHTML = `
                <div class="player-header">
                    <h3>${player.name}</h3>
                    <span class="player-money">฿${player.money.toLocaleString()}</span>
                </div>
                ${careerHTML} 
                <div class="player-properties">
                    <span>เมือง: ${player.properties.length} แห่ง</span>
                </div>
                <div class="player-status">${statusHTML || ' '}</div>
            `;
        } else {
            playerDiv.classList.add('empty');
        }
        playerContainer.appendChild(playerDiv);
    }
}

export function updateBoardUI() {
    state.boardSpaces.forEach(space => {
        if (space.type === 'property') {
            const spaceEl = document.getElementById(`space-${space.id}`);
            if (!spaceEl) return; 

            const spaceInfo = spaceEl.querySelector('.space-info');
            const priceEl = spaceEl.querySelector('.space-price');
            const levelBadgeContainer = spaceEl.querySelector('.level-badge-container');

            if (space.owner !== null) {
                const owner = state.players.find(p => p.id === space.owner);
                if (owner) { 
                    spaceInfo.style.backgroundColor = owner.color;
                    if (owner.color === 'var(--player2-color)' || owner.color === 'var(--player3-color)') {
                       spaceInfo.style.color = '#333';
                    } else {
                       spaceInfo.style.color = 'white';
                    }
                }
                // ส่ง null เพราะเราไม่รู้ว่าใครจะมาตก แค่ต้องการอัปเดตค่าเช่าพื้นฐาน
                priceEl.textContent = `฿${calculateRent(space, null).toLocaleString()}`;

                levelBadgeContainer.innerHTML = '';
                if(space.level > 1) {
                    const levelBadge = document.createElement('div');
                    levelBadge.classList.add('level-badge', `level-${space.level-1}`);
                    levelBadge.textContent = `+${space.level-1}`;
                    levelBadgeContainer.appendChild(levelBadge);
                }
            } else {
                spaceInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                spaceInfo.style.color = 'white';
                priceEl.textContent = `฿${space.price.toLocaleString()}`;
                levelBadgeContainer.innerHTML = '';
            }
        }
    });
}

export function updatePawnPosition(player) {
    const spaceEl = document.getElementById(`space-${player.position}`);
    if (!spaceEl) return;

    const playersOnSpace = state.players.filter(p => p.position === player.position && !p.bankrupt);
    
    const columns = 2;
    const pawnSize = 20;
    const padding = 2;

    playersOnSpace.forEach((p, index) => {
        const pawn = document.getElementById(`pawn-${p.id}`);
        if (!pawn) return;

        const row = Math.floor(index / columns);
        const col = index % columns;
        
        const spaceWidth = spaceEl.offsetWidth;
        const spaceHeight = spaceEl.offsetHeight;

        const totalWidth = columns * (pawnSize + padding) - padding;
        const totalHeight = Math.ceil(playersOnSpace.length / columns) * (pawnSize + padding) - padding;
        
        const startX = (spaceWidth - totalWidth) / 2;
        const startY = (spaceHeight - totalHeight) / 2;

        const newLeft = spaceEl.offsetLeft + startX + col * (pawnSize + padding);
        const newTop = spaceEl.offsetTop + startY + row * (pawnSize + padding);

        pawn.style.left = `${newLeft}px`;
        pawn.style.top = `${newTop}px`;
    });
}

export function updateDice(d1, d2) {
    document.getElementById('dice1').textContent = d1;
    document.getElementById('dice2').textContent = d2;
}


export function enableTurnActions() {
    document.getElementById('roll-dice-btn').disabled = false;
    document.getElementById('end-turn-btn').disabled = true;
    document.getElementById('manage-property-btn').disabled = false;
    const engineerBtn = document.getElementById('engineer-ability-btn');
    if (engineerBtn) engineerBtn.style.display = 'none';
}

export function disableGameActions() {
    document.getElementById('roll-dice-btn').disabled = true;
    document.getElementById('manage-property-btn').disabled = true;
    document.getElementById('end-turn-btn').disabled = true;
    const engineerBtn = document.getElementById('engineer-ability-btn');
    if (engineerBtn) engineerBtn.style.display = 'none';
}

export function enableEndTurnButton() {
    document.getElementById('roll-dice-btn').disabled = true;
    document.getElementById('manage-property-btn').disabled = false;
    document.getElementById('end-turn-btn').disabled = false;
    const engineerBtn = document.getElementById('engineer-ability-btn');
    if (engineerBtn) engineerBtn.style.display = 'none';
}

export function enableEngineerButton() {
    const engineerBtn = document.getElementById('engineer-ability-btn');
    if (engineerBtn) {
        engineerBtn.disabled = false;
        engineerBtn.style.display = 'block';
    }
}
export function disableEngineerButton() {
    const engineerBtn = document.getElementById('engineer-ability-btn');
    if (engineerBtn) {
        engineerBtn.disabled = true;
        engineerBtn.style.display = 'none';
    }
}


export function showActionModal(title, text, buttons, options = {}) {
    const { isError = false, customHTML = '' } = options;
    const actionModal = document.getElementById('action-modal');
    const titleEl = document.getElementById('action-title');
    const textEl = document.getElementById('action-text');

    titleEl.textContent = title;
    titleEl.className = isError ? 'danger' : '';

    if (customHTML) {
        textEl.innerHTML = customHTML;
    } else {
        textEl.textContent = text;
    }

    const buttonsContainer = document.getElementById('action-modal-buttons');
    buttonsContainer.innerHTML = '';
    buttons.forEach(btnInfo => {
        const button = document.createElement('button');
        button.textContent = btnInfo.text;
        button.onclick = btnInfo.callback;
        if (btnInfo.enabled === false) {
            button.disabled = true;
        }
        if (btnInfo.className) {
            button.classList.add(btnInfo.className);
        }
        buttonsContainer.appendChild(button);
    });
    actionModal.style.display = 'flex';
}

export function hideActionModal() {
    document.getElementById('action-modal').style.display = 'none';
}

export function showQuestionModalForPurchase(player, title) {
    const questionModal = document.getElementById('question-modal');
    const question = generateQuestion(player.difficulty);
    state.setCurrentQuestion(question);
    
    player.totalQuestions++;
    document.getElementById('question-title').textContent = title;
    document.getElementById('question-text').textContent = question.text;
    document.getElementById('question-answer').value = '';
    questionModal.style.display = 'flex';
    document.getElementById('question-answer').focus();
}

export function showInfoSheet(spaceData) {
    if (!spaceData.mathematician) return;
    document.getElementById('info-sheet-name').textContent = spaceData.mathematician.fullName;
    document.getElementById('info-sheet-years').textContent = spaceData.mathematician.years;
    document.getElementById('info-sheet-nationality').textContent = spaceData.mathematician.nationality;
    document.getElementById('info-sheet-contribution').textContent = spaceData.mathematician.contribution;
    document.getElementById('info-sheet-img').src = spaceData.mathematician.img;
    document.getElementById('info-sheet-modal').style.display = 'flex';
}

// ฟังก์ชันสรุปผลฉบับปรับปรุง (v1.1)
export function showSummary(winType = 'manual', winner = null, reason = 'นับคะแนนรวม') {
    const summaryModal = document.getElementById('summary-modal');
    const winnerSection = document.getElementById('winner-spotlight-section');
    const summaryGrid = document.getElementById('summary-grid');
    
    // เคลียร์ข้อมูลเก่า
    summaryGrid.innerHTML = '';

    // 1. เตรียมข้อมูลและคำนวณสถิติ
    const playersStats = state.players.map(p => {
        // คำนวณมูลค่าทรัพย์สิน (Investment ในเมืองทั้งหมด)
        const propertyVal = p.properties.reduce((sum, pId) => {
            const space = state.boardSpaces.find(s => s.id === pId);
            return sum + (space ? space.investment : 0);
        }, 0);
        
        // คำนวณสถิติการตอบคำถาม
        const totalQ = p.totalQuestions || 0;
        const correctQ = p.correctAnswers || 0;
        const accuracy = totalQ > 0 ? (correctQ / totalQ) * 100 : 0;
        
        // ตัดเกรด
        let grade = 'F';
        if (accuracy >= 90) grade = 'A';
        else if (accuracy >= 75) grade = 'B';
        else if (accuracy >= 60) grade = 'C';
        else if (accuracy >= 50) grade = 'D';

        return {
            ...p,
            propertyValue: propertyVal,
            totalAssets: p.money + propertyVal,
            accuracy: accuracy,
            grade: grade,
            awards: []
        };
    });

    // 2. เรียงลำดับตามทรัพย์สินรวม (มากไปน้อย)
    const sortedPlayers = playersStats.sort((a, b) => b.totalAssets - a.totalAssets);
    
    // 3. หาผู้ได้รับรางวัลพิเศษ (Awards)
    // 🧠 Math Genius: แม่นยำสูงสุด (ต้องตอบอย่างน้อย 3 ข้อ)
    const mathGenius = [...sortedPlayers].filter(p => p.totalQuestions >= 3).sort((a,b) => b.accuracy - a.accuracy)[0];
    if (mathGenius && mathGenius.accuracy > 0) {
        mathGenius.awards.push({icon: '🧠', title: 'Math Genius: แม่นยำที่สุด'});
    }
    
    // 🏰 Landlord: เมืองเยอะสุด
    const landlord = [...sortedPlayers].sort((a,b) => b.properties.length - a.properties.length)[0];
    if (landlord && landlord.properties.length > 0) {
        landlord.awards.push({icon: '🏰', title: 'Landlord: เจ้าที่ดิน'});
    }

    // 💸 Cash King: เงินสดเยอะสุด
    const cashKing = [...sortedPlayers].sort((a,b) => b.money - a.money)[0];
    if (cashKing && cashKing.money > 0) {
        cashKing.awards.push({icon: '💸', title: 'Cash King: ราชาเงินสด'});
    }

    // 4. แสดงผลผู้ชนะเลิศ (Spotlight)
    let finalWinner = winner;
    if (winType === 'manual') {
        finalWinner = sortedPlayers[0]; 
        reason = 'มีทรัพย์สินรวมสูงสุด';
    }

    if (finalWinner) {
        // หาข้อมูลที่ update แล้วของ winner เพื่อดึงยอดทรัพย์สินรวมที่คำนวณใหม่
        const winnerStats = sortedPlayers.find(p => p.id === finalWinner.id) || finalWinner; 
        document.getElementById('winner-name').textContent = winnerStats.name;
        document.getElementById('winner-reason').textContent = reason;
        document.getElementById('winner-total-assets').textContent = `฿${(winnerStats.totalAssets || 0).toLocaleString()}`;
        winnerSection.style.display = 'block';
    } else {
        winnerSection.style.display = 'none';
    }

    // 5. สร้าง Card สำหรับผู้เล่นแต่ละคนใน Grid
    sortedPlayers.forEach((p, index) => {
        const card = document.createElement('div');
        const isWinner = finalWinner && p.id === finalWinner.id;
        card.className = `summary-card ${isWinner ? 'is-winner' : ''}`;
        
        // คำนวณความกว้างของกราฟแท่ง (Bar Chart)
        const totalBar = Math.max(p.totalAssets, 1); // ป้องกันการหารด้วย 0
        const cashPercent = p.money > 0 ? (p.money / totalBar) * 100 : 0; 
        const propPercent = p.propertyValue > 0 ? (p.propertyValue / totalBar) * 100 : 0;

        // สร้าง HTML สำหรับ Awards
        const awardsHTML = p.awards.map(a => 
            `<div class="award-badge" title="${a.title}">${a.icon}</div>`
        ).join('');

        // ข้อความสถานะ (ล้มละลาย)
        const statusText = p.bankrupt ? '<span style="color:red; font-weight:bold; font-size:0.8em;"> (ล้มละลาย)</span>' : '';
        const careerName = CAREERS[p.career] ? CAREERS[p.career].name : '-';

        card.innerHTML = `
            <div class="rank-badge">${index + 1}</div>
            
            <div class="card-header">
                <h3>${p.name}${statusText}</h3>
                <div style="font-size:0.9em; color:#666;">อาชีพ: ${careerName}</div>
            </div>

            <div class="asset-breakdown">
                <div class="asset-bar-container">
                    <div class="bar-cash" style="width: ${cashPercent}%" title="เงินสด: ฿${p.money.toLocaleString()}"></div>
                    <div class="bar-property" style="width: ${propPercent}%" title="มูลค่าเมือง: ฿${p.propertyValue.toLocaleString()}"></div>
                </div>
                <div class="asset-legend">
                    <div class="legend-item"><span class="dot" style="background:#4CAF50"></span> เงินสด ฿${p.money.toLocaleString()}</div>
                    <div class="legend-item"><span class="dot" style="background:#FF9800"></span> เมือง ฿${p.propertyValue.toLocaleString()}</div>
                </div>
                <div style="text-align:right; font-weight:bold; margin-top:5px; font-size:1.1em; color: var(--primary-color);">
                    รวม: ฿${p.totalAssets.toLocaleString()}
                </div>
            </div>

            <div class="math-stats-row">
                <div class="grade-circle grade-${p.grade}" title="ความแม่นยำ ${p.accuracy.toFixed(0)}%">${p.grade}</div>
                <div class="stats-text">
                    <div>ตอบถูก: ${p.correctAnswers}/${p.totalQuestions}</div>
                    <div style="font-size:0.8em; color:#888;">ความแม่นยำ ${p.accuracy.toFixed(0)}%</div>
                </div>
            </div>

            <div class="awards-container">
                ${awardsHTML}
            </div>
        `;
        summaryGrid.appendChild(card);
    });

    summaryModal.style.display = 'flex';
}

export function showInsufficientFundsModal(onCloseCallback) {
    showActionModal(
        "เงินไม่พอ!",
        "คุณมีเงินไม่พอที่จะซื้อเมืองนี้ ต้องการจัดการทรัพย์สินหรือไม่?",
        [
            { text: 'กู้เงิน/ขายเมือง', callback: () => {
                hideActionModal();
                showManagePropertyModal(false);
            }},
            { text: 'ปิด', className: 'danger', callback: () => {
                hideActionModal();
                if (onCloseCallback) onCloseCallback();
            }}
        ]
    );
}

export function hideManagePropertyModal() {
    document.getElementById('manage-property-modal').style.display = 'none';
}

export function showManagePropertyModal(isForced = false) {
    const managePropertyModal = document.getElementById('manage-property-modal');
    const player = state.players[state.currentPlayerIndex];

    // Update financial summary
    const summaryMoneyEl = document.getElementById('summary-money');
    const summaryDebtItemEl = document.getElementById('summary-debt-item');
    const summaryDebtEl = document.getElementById('summary-debt');
    
    summaryMoneyEl.textContent = `฿${player.money.toLocaleString()}`;
    summaryMoneyEl.classList.toggle('negative', player.money < 0);

    const modalTitle = document.getElementById('manage-title');
    const closeBtn = document.getElementById('close-manage-modal-btn');

    if (isForced) {
        state.setForcedToSell(true);
        const debt = Math.abs(player.money);
        modalTitle.innerHTML = `คุณเป็นหนี้! ต้องชำระ ฿${debt.toLocaleString()}<br><small>เงินปัจจุบัน: ฿${player.money.toLocaleString()}</small>`;
        modalTitle.classList.add('danger');
        summaryDebtItemEl.style.display = 'flex';
        summaryDebtEl.textContent = `฿${debt.toLocaleString()}`;
        closeBtn.disabled = true;
    } else {
        state.setForcedToSell(false);
        modalTitle.textContent = 'จัดการทรัพย์สิน';
        modalTitle.classList.remove('danger');
        summaryDebtItemEl.style.display = 'none';
        closeBtn.disabled = false;
    }

    // Update property list
    const sellList = document.getElementById('sell-property-list');
    sellList.innerHTML = '';
    if (player.properties.length > 0) {
        player.properties.forEach(pId => {
            const space = state.boardSpaces.find(s => s.id === pId);
            if (!space) return;
            const sellPrice = Math.round(space.investment * 0.6);
            const item = document.createElement('div');
            item.className = 'property-list-item';
            item.innerHTML = `
                <span>${space.name} (ลงทุน ฿${space.investment.toLocaleString()})</span>
                <button class="danger" data-action="sell" data-pid="${pId}">ขาย ฿${sellPrice.toLocaleString()}</button>
            `;
            sellList.appendChild(item);
        });
    } else {
        sellList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 10px 0;">คุณไม่มีเมืองที่จะขาย</p>';
    }

    // Update financial actions
    const financialActions = document.getElementById('financial-actions');
    financialActions.innerHTML = '';
    if (player.loan) {
        financialActions.innerHTML = `<p style="text-align: center;">คุณมีเงินกู้ ฿${player.loan.amount.toLocaleString()} แล้ว (เหลือ ${player.loan.roundsLeft} ตา)</p>`;
    } else {
        const loanAmount = Math.round(state.gameSettings.startingMoney / 3);
        const loanButton = document.createElement('button');
        loanButton.textContent = `กู้เงินฉุกเฉิน ฿${loanAmount.toLocaleString()}`;
        loanButton.dataset.action = "loan";
        if(isForced) loanButton.disabled = true;
        financialActions.appendChild(loanButton);
    }
    
    managePropertyModal.style.display = 'flex';
}
