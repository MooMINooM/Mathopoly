// js/actions.js
import * as state from './state.js';
import { finishTurn } from './gameLogic.js';
import * as bot from './bot.js';
import { addLogMessage } from './logger.js';
import { updatePlayerInfo, hideActionModal, updateAllUI, showManagePropertyModal, showSummary } from './ui.js';

// ... (โค้ดส่วนบนเหมือนเดิม)
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
// --- START: แก้ไขฟังก์ชัน calculateRent ---
export function calculateRent(space) {
    let rent = Math.round(space.investment * 0.5);

    // ตรวจสอบโบนัสเมืองติดกัน
    if (state.gameSettings.adjacencyBonus && space.owner !== null) {
        const ownerId = space.owner;
        const p_minus_1 = state.boardSpaces[space.id - 1];
        const p_minus_2 = state.boardSpaces[space.id - 2];
        const p_plus_1 = state.boardSpaces[space.id + 1];
        const p_plus_2 = state.boardSpaces[space.id + 2];

        // ตรวจสอบว่าเป็นส่วนหนึ่งของกลุ่ม 3 เมืองที่ติดกันหรือไม่
        const isMiddle = p_minus_1?.owner === ownerId && p_plus_1?.owner === ownerId && p_minus_1?.type === 'property' && p_plus_1?.type === 'property';
        const isStart = p_plus_1?.owner === ownerId && p_plus_2?.owner === ownerId && p_plus_1?.type === 'property' && p_plus_2?.type === 'property';
        const isEnd = p_minus_1?.owner === ownerId && p_minus_2?.owner === ownerId && p_minus_1?.type === 'property' && p_minus_2?.type === 'property';

        if (isMiddle || isStart || isEnd) {
            rent = Math.round(rent * 1.5);
        }
    }

    return rent;
}
// --- END: แก้ไขฟังก์ชัน calculateRent ---

export function calculateBuyoutPrice(space) {
    // ... (โค้ดส่วนนี้เหมือนเดิม)
}
export function calculateExpansionCost(space) {
    // ... (โค้ดส่วนนี้เหมือนเดิม)
}
export function buyProperty(player, space) {
    // ... (โค้ดส่วนนี้เหมือนเดิม)
}
export function expandProperty(player, space) {
    // ... (โค้ดส่วนนี้เหมือนเดิม)
}
export function payRent(player, owner, rent) {
    // ... (โค้ดส่วนนี้เหมือนเดิม)
}
export function buyOutProperty(player, owner, space) {
    // ... (โค้ดส่วนนี้เหมือนเดิม)
}
export function sellProperty(player, pId) {
    // ... (โค้ดส่วนนี้เหมือนเดิม)
}
export function takeLoan(player) {
    // ... (โค้ดส่วนนี้เหมือนเดิม)
}
export { updatePawnPosition } from './ui.js';
