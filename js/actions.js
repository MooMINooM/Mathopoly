// js/actions.js
import * as state from './state.js';
import { finishTurn } from './gameLogic.js';
import * as bot from './bot.js';
import { addLogMessage } from './logger.js';
import { updatePlayerInfo, hideActionModal, updateAllUI, showManagePropertyModal, showSummary, updatePawnPosition } from './ui.js';
import { calculateBuyoutPrice, calculateExpansionCost } from './utils.js'; // <-- แก้ไข Import

// --- START: เพิ่มฟังก์ชันตรวจสอบการชนะ ---
const WIN_CONDITIONS = {
    BELT_A: [1, 2, 3, 4, 5, 37, 38, 39],
    BELT_B: [7, 8, 9, 10, 11, 13, 14, 15],
    BELT_C: [17, 18, 19, 21, 22, 23, 24, 25],
    BELT_D: [27, 28, 29, 30, 31, 33, 34, 35],
    CORNERS: [1, 11, 13, 19, 21, 31, 33, 39]
};

function checkWinConditions(player) {
    if (state.gameSettings.winByBelt) {
        for (const beltKey in WIN_CONDITIONS) {
            if (beltKey.startsWith('BELT_')) {
                const belt = WIN_CONDITIONS[beltKey];
                if (belt.every(spaceId => player.properties.includes(spaceId))) {
                    addLogMessage(`<strong>${player.name}</strong> ชนะเกมด้วย <strong>Monopoly ${beltKey}</strong>!`);
                    setTimeout(() => showSummary(), 500);
                    return true;
                }
            }
        }
    }
    if (state.gameSettings.winByCorners) {
        if (WIN_CONDITIONS.CORNERS.every(spaceId => player.properties.includes(spaceId))) {
            addLogMessage(`<strong>${player.name}</strong> ชนะเกมด้วย <strong>Corner Dominance</strong>!`);
            setTimeout(() => showSummary(), 500);
            return true;
        }
    }
    return false;
}
// --- END: เพิ่มฟังก์ชันตรวจสอบการชนะ ---

export function changePlayerMoney(player, amount, reason) {
    player.money += amount;
    player.money = Math.round(player.money);
    
    const action = amount > 0 ? 'ได้รับ' : 'เสีย';
    const color = amount > 0 ? 'green' : 'red';
    addLogMessage(`<span style="color: ${color};"><strong>${player.name}</strong> ${action}เงิน ฿${Math.abs(amount).toLocaleString()} (${reason})</span>`);

    if (player.money < 0) {
        handleDebt(player);
    }
    updatePlayerInfo();
}

function handleDebt(player) {
    const totalAssetValue = player.properties.reduce((sum, pId) => {
        return sum + (state.boardSpaces[pId].investment * 0.6);
    }, 0);

    if (player.money + totalAssetValue < 0) {
        handleBankruptcy(player);
    } else {
        if (player.isBot) {
            bot.manageBotAssets(player);
        } else {
            state.setForcedToSell(true);
            showManagePropertyModal(true);
        }
    }
}

function handleBankruptcy(player) {
    addLogMessage(`<span style="color: red; font-weight: bold;">!!! ${player.name} ล้มละลาย! !!!</span>`);
    player.bankrupt = true;
    player.money = 0;
    player.properties.forEach(pId => {
        const space = state.boardSpaces[pId];
        space.owner = null;
        space.level = 0;
        space.investment = 0;
    });
    player.properties = [];

    const pawn = document.getElementById(`pawn-${player.id}`);
    if (pawn) pawn.style.display = 'none';

    updateAllUI();

    const activePlayers = state.players.filter(p => !p.bankrupt);
    if (activePlayers.length <= 1) {
        showSummary();
    } else {
        finishTurn();
    }
}


// --- ฟังก์ชันคำนวณถูกย้ายไปที่ utils.js แล้ว ---


export function buyProperty(player, space) {
    changePlayerMoney(player, -space.price, `ซื้อ ${space.name}`);
    if(player.bankrupt) { hideActionModal(); return; }
    space.owner = player.id;
    space.level = 1;
    space.investment = space.price;
    player.properties.push(space.id);
    hideActionModal();
    updateAllUI();

    if (checkWinConditions(player)) return;
    finishTurn();
}

export function expandProperty(player, space) {
    const cost = calculateExpansionCost(space);
    changePlayerMoney(player, -cost, `ขยาย ${space.name}`);
    if(player.bankrupt) { hideActionModal(); return; }
    space.investment += cost;
    space.level++;
    hideActionModal();
    updateAllUI();
    finishTurn();
}

export function payRent(player, owner, rent) {
    hideActionModal();
    changePlayerMoney(player, -rent, `จ่ายค่าผ่านทางให้ ${owner.name}`);
    if(player.bankrupt) return;
    changePlayerMoney(owner, rent, `รับค่าผ่านทางจาก ${player.name}`);
    finishTurn();
}

export function buyOutProperty(player, owner, space) {
    hideActionModal();
    const price = calculateBuyoutPrice(space);
    
    addLogMessage(`<strong>${player.name}</strong> ซื้อ <strong>${space.name}</strong> ต่อจาก <strong>${owner.name}</strong>`);

    changePlayerMoney(player, -price, `ซื้อต่อ ${space.name}`);
    if(player.bankrupt) return;

    changePlayerMoney(owner, price, `ขาย ${space.name}`);
    owner.properties = owner.properties.filter(pId => pId !== space.id);

    space.owner = player.id;
    player.properties.push(space.id);

    updateAllUI();

    if (checkWinConditions(player)) return;
    finishTurn();
}

export function sellProperty(player, pId) {
    const space = state.boardSpaces[pId];
    const sellPrice = Math.round(space.investment * 0.6);

    changePlayerMoney(player, sellPrice, `ขาย ${space.name}`);

    space.owner = null;
    space.level = 0;
    space.investment = 0;
    player.properties = player.properties.filter(id => id !== pId);

    updateAllUI();

    if (state.isForcedToSell && player.money >= 0) {
        state.setForcedToSell(false);
        addLogMessage(`<strong>${player.name}</strong> ชำระหนี้สำเร็จแล้ว!`);
        hideActionModal();
        finishTurn();
    } else {
        showManagePropertyModal(state.isForcedToSell);
    }
}

export function takeLoan(player) {
    const amount = Math.round(state.gameSettings.startingMoney / 3);
    player.loan = {
        amount: amount,
        roundsLeft: 10
    };
    changePlayerMoney(player, amount, "กู้เงิน");
    showManagePropertyModal();
}
