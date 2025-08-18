// js/ui.js
import * as state from './state.js';
import { calculateRent } from './actions.js';

// --- DOM Elements ---
const playerInfoContainer = document.getElementById('player-info-container');
const boardElement = document.getElementById('game-board');
const dice1El = document.getElementById('dice1');
const dice2El = document.getElementById('dice2');
const rollDiceBtn = document.getElementById('roll-dice-btn');
const endTurnBtn = document.getElementById('end-turn-btn');
const managePropertyBtn = document.getElementById('manage-property-btn');
const questionModal = document.getElementById('question-modal');
const actionModal = document.getElementById('action-modal');
const managePropertyModal = document.getElementById('manage-property-modal');

// --- UI Update Functions ---
export function updateAllUI() {
    updatePlayerInfo();
    updateBoardUI();
    state.players.forEach(p => { if(!p.bankrupt) updatePawnPosition(p) });
}

export function updatePlayerInfo() {
    // ... โค้ดส่วนนี้เหมือนเดิม ...
}

export function updateBoardUI() {
    // ... โค้ดส่วนนี้เหมือนเดิม ...
}

export function updatePawnPosition(player) {
    // ... โค้ดส่วนนี้เหมือนเดิม ...
}

// --- Action Button Controls ---
export function enableTurnActions() { /* ... */ }
export function disableGameActions() { /* ... */ }
export function enableEndTurnButton() { /* ... */ }

// --- Modal Controls ---
export function showActionModal(title, text, buttons, isError = false) { /* ... */ }
export function hideActionModal() { /* ... */ }
export function showQuestionModalForPurchase(player, title) { /* ... */ }
export function showInfoSheet(spaceData) { /* ... */ }
export function showSummary() { /* ... */ }
export function showInsufficientFundsModal(onCloseCallback) { /* ... */ }

export function hideManagePropertyModal() {
    managePropertyModal.style.display = 'none';
}

export function showManagePropertyModal(isForced = false) {
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
            // เพิ่ม data-action="sell" เพื่อให้ main.js รู้จัก
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
        // เพิ่ม data-action="loan" เพื่อให้ main.js รู้จัก
        loanButton.dataset.action = "loan";
        if(state.isForcedToSell) loanButton.disabled = true;
        financialActions.appendChild(loanButton);
    }
    managePropertyModal.style.display = 'flex';
}
