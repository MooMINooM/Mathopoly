// js/ui.js
import * as state from './state.js';
import { calculateRent } from './actions.js';
import { generateQuestion } from './questions.js';

// ... (โค้ด logger เหมือนเดิม) ...
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

// --- START: แก้ไขฟังก์ชัน updatePlayerInfo ---
export function updatePlayerInfo() {
    const topLeftContainer = document.getElementById('player-info-top-left');
    const topRightContainer = document.getElementById('player-info-top-right');
    
    topLeftContainer.innerHTML = '';
    topRightContainer.innerHTML = '';

    const activePlayers = state.players.filter(p => !p.bankrupt);
    const midPoint = Math.ceil(activePlayers.length / 2);

    activePlayers.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-info';
        if (player.id === state.currentPlayerIndex) {
            playerDiv.classList.add('active');
        }
        playerDiv.style.setProperty('--player-color', player.color);

        let statusHTML = '';
        if (player.inJailTurns > 0) {
            statusHTML += `<span>ติดเกาะร้าง</span>`;
        }
        if (player.loan) {
            statusHTML += `<span>หนี้ (${player.loan.roundsLeft} ตา)</span>`;
        }
        if (player.getOutOfJailFree > 0) {
            statusHTML += `<span>การ์ดฟรี ${player.getOutOfJailFree} ใบ</span>`;
        }

        playerDiv.innerHTML = `
            <div class="player-header">
                <h3>${player.name}</h3>
                <span class="player-money">฿${player.money.toLocaleString()}</span>
            </div>
            <div class="player-status">${statusHTML || ''}</div>
            <div class="player-properties">
                <span>เมือง: ${player.properties.length} แห่ง</span>
            </div>
        `;

        // แบ่งผู้เล่นลง 2 ฝั่ง
        if (index < midPoint) {
            topLeftContainer.appendChild(playerDiv);
        } else {
            topRightContainer.appendChild(playerDiv);
        }
    });
}
// --- END: แก้ไขฟังก์ชัน updatePlayerInfo ---


export function updateBoardUI() {
    state.boardSpaces.forEach(space => {
        if (space.type === 'property') {
            const spaceEl = document.getElementById(`space-${space.id}`);
            const spaceInfo = spaceEl.querySelector('.space-info');
            const priceEl = spaceEl.querySelector('.space-price');
            const levelBadgeContainer = spaceEl.querySelector('.level-badge-container');

            if (space.owner !== null) {
                const owner = state.players[space.owner];
                spaceInfo.style.backgroundColor = owner.color;
                if (owner.color === 'var(--player2-color)' || owner.color === 'var(--player3-color)') {
                   spaceInfo.style.color = '#333';
                } else {
                   spaceInfo.style.color = 'white';
                }
                priceEl.textContent = `฿${calculateRent(space).toLocaleString()}`;

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
    const pawn = document.getElementById(`pawn-${player.id}`);
    const spaceEl = document.getElementById(`space-${player.position}`);
    if (!pawn || !spaceEl) return;

    const pawnOffset = player.id * 5;
    pawn.style.left = `${spaceEl.offsetLeft + pawnOffset}px`;
    pawn.style.top = `${spaceEl.offsetTop + pawnOffset}px`;
}

export function updateDice(d1, d2) {
    document.getElementById('dice1').textContent = d1;
    document.getElementById('dice2').textContent = d2;
}


// --- Action Button Controls ---
export function enableTurnActions() {
    document.getElementById('roll-dice-btn').disabled = false;
    document.getElementById('end-turn-btn').disabled = true;
    document.getElementById('manage-property-btn').disabled = false;
}

export function disableGameActions() {
    document.getElementById('roll-dice-btn').disabled = true;
    document.getElementById('manage-property-btn').disabled = true;
    document.getElementById('end-turn-btn').disabled = true;
}

export function enableEndTurnButton() {
    document.getElementById('roll-dice-btn').disabled = true;
    document.getElementById('manage-property-btn').disabled = false;
    document.getElementById('end-turn-btn').disabled = false;
}


// --- Modal Controls ---
export function showActionModal(title, text, buttons, isError = false) {
    const actionModal = document.getElementById('action-modal');
    const titleEl = document.getElementById('action-title');
    titleEl.textContent = title;
    titleEl.className = isError ? 'danger' : '';

    document.getElementById('action-text').textContent = text;
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

export function showSummary() {
    const summaryBody = document.getElementById('summary-body');
    summaryBody.innerHTML = '';

    const sortedPlayers = [...state.players].sort((a, b) => (b.money + b.properties.reduce((s,p) => s + state.boardSpaces[p].investment, 0)) - (a.money + a.properties.reduce((s,p) => s + state.boardSpaces[p].investment, 0)));
    let winnerDeclared = false;

    sortedPlayers.forEach(p => {
        let status = p.bankrupt ? "ล้มละลาย" : "เล่นอยู่";
        const activePlayers = state.players.filter(pl => !pl.bankrupt);
        if (!p.bankrupt && activePlayers.length === 1 && !winnerDeclared) {
            status = "ผู้ชนะ";
            winnerDeclared = true;
        } else if (!p.bankrupt && activePlayers.length > 1 && p.id === sortedPlayers[0].id && !winnerDeclared) {
             status = "ผู้ชนะ (คะแนนสูงสุด)";
        }

        const ownedCities = p.properties.map(id => state.boardSpaces[id].name).join(', ') || '-';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${p.name}</td>
            <td>${status}</td>
            <td>฿${p.money.toLocaleString()}</td>
            <td>${p.correctAnswers} / ${p.totalQuestions}</td>
            <td>${ownedCities}</td>
        `;
        summaryBody.appendChild(row);
    });
    document.getElementById('summary-modal').style.display = 'flex';
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
    const sellList = document.getElementById('sell-property-list');
    const financialActions = document.getElementById('financial-actions');
    const modalTitle = document.getElementById('manage-title');
    const closeBtn = document.getElementById('close-manage-modal-btn');

    sellList.innerHTML = '';
    financialActions.innerHTML = '';

    if (isForced) {
        state.setForcedToSell(true);
        const debt = -player.money;
        modalTitle.textContent = `คุณเป็นหนี้! ต้องขายทรัพย์สินเพื่อชำระ ฿${debt.toLocaleString()}`;
        closeBtn.disabled = true;
    } else {
        state.setForcedToSell(false);
        modalTitle.textContent = 'จัดการทรัพย์สิน';
        closeBtn.disabled = false;
    }

    if (player.properties.length > 0) {
        player.properties.forEach(pId => {
            const space = state.boardSpaces[pId];
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
        sellList.innerHTML = '<p>คุณไม่มีเมืองที่จะขาย</p>';
    }

    if (player.loan) {
        financialActions.innerHTML = `<p>คุณมีเงินกู้ ฿${player.loan.amount.toLocaleString()} แล้ว (เหลือ ${player.loan.roundsLeft} ตา)</p>`;
    } else {
        const loanAmount = Math.round(state.gameSettings.startingMoney / 3);
        const loanButton = document.createElement('button');
        loanButton.textContent = `กู้เงิน ฿${loanAmount.toLocaleString()}`;
        loanButton.dataset.action = "loan";
        if(state.isForcedToSell) loanButton.disabled = true;
        financialActions.appendChild(loanButton);
    }
    managePropertyModal.style.display = 'flex';
}
