// js/gameLogic.js
import * as state from './state.js';
import * as actions from './actions.js';
import * as bot from './bot.js';
import { addLogMessage } from './logger.js';
import * as ui from './ui.js';
import { handleSpaceLanding } from './spaceHandlers.js';
import { applyCareerAbility } from './careerHandler.js';

export function startTurn() {
    state.setLandlordBonusUsed(false);
    const player = state.players[state.currentPlayerIndex];
    if (player.bankrupt) {
        endTurn();
        return;
    }

    ui.updatePlayerInfo();
    addLogMessage(`--- ตาของ <strong>${player.name}</strong> ---`);

    applyCareerAbility('startTurnDividend', null, { player });

    if (player.isBot) {
        if (player.inJailTurns > 0) {
            if (player.getOutOfJailFree > 0 && Math.random() < 0.8) {
                player.getOutOfJailFree--;
                player.inJailTurns = 0;
                addLogMessage(`<strong>${player.name}</strong> ใช้การ์ดออกจากเกาะร้างฟรี!`);
                ui.updatePlayerInfo();
                bot.makeBotDecision(player);
            } else {
                player.inJailTurns--;
                addLogMessage(`<strong>${player.name}</strong> ยังติดอยู่บนเกาะ (เหลือ ${player.inJailTurns} ตา)`);
                finishTurn();
            }
            return;
        }
        ui.disableGameActions();
        bot.makeBotDecision(player);
        return;
    }

    if (player.inJailTurns > 0) {
        if (player.getOutOfJailFree > 0) {
            ui.showActionModal('ติดเกาะร้าง!', `คุณมีการ์ดนางฟ้า ${player.getOutOfJailFree} ใบ ต้องการใช้เพื่อออกจากเกาะหรือไม่?`,
                [
                    { text: 'ใช้การ์ด', callback: () => {
                        player.getOutOfJailFree--;
                        player.inJailTurns = 0;
                        addLogMessage(`<strong>${player.name}</strong> ใช้การ์ดออกจากเกาะร้างฟรี!`);
                        ui.hideActionModal();
                        ui.enableTurnActions();
                    }},
                    { text: 'ไม่ใช้ (ข้ามตา)', className: 'danger', callback: () => {
                        player.inJailTurns--;
                        addLogMessage(`<strong>${player.name}</strong> ยังติดอยู่บนเกาะ (เหลือ ${player.inJailTurns} ตา)`);
                        ui.hideActionModal();
                        setTimeout(() => endTurn(), 500);
                    }}
                ]
            );
        } else {
            player.inJailTurns--;
            addLogMessage(`<strong>${player.name}</strong> ติดเกาะ! (เหลือ ${player.inJailTurns} ตา)`);
            ui.disableGameActions();
            setTimeout(() => endTurn(), 1500);
        }
        return;
    }
    
    ui.enableTurnActions();
    if (state.gameSettings.careerMode && player.career === 'engineer' && !player.engineerAbilityUsedThisTurn) {
        ui.enableEngineerButton();
    }
}

export function endTurn() {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (state.gameSettings.careerMode && currentPlayer.career === 'engineer') {
        currentPlayer.engineerAbilityUsedThisTurn = false;
    }

    if (currentPlayer.loan && !currentPlayer.bankrupt) {
        currentPlayer.loan.roundsLeft--;
        if (currentPlayer.loan.roundsLeft <= 0) {
            actions.changePlayerMoney(currentPlayer, -currentPlayer.loan.amount, "ชำระหนี้");
            if(currentPlayer.bankrupt) return;
            currentPlayer.loan = null;
        }
    }

    const activePlayers = state.players.filter(p => !p.bankrupt);
    if (activePlayers.length <= 1 && state.isGameStarted) {
        ui.showSummary();
        return;
    }

    let nextPlayerIndex = state.currentPlayerIndex;
    do {
        nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length;
    } while (state.players[nextPlayerIndex].bankrupt)
    
    state.setCurrentPlayerIndex(nextPlayerIndex);
    startTurn();
}

export function finishTurn() {
    const player = state.players[state.currentPlayerIndex];
    if (player.isBot) {
        setTimeout(() => endTurn(), 1200);
    } else {
        ui.enableEndTurnButton();
    }
}

export async function movePlayer(steps) {
    const player = state.players[state.currentPlayerIndex];
    const oldPosition = player.position;
    let passedGo = false;

    for (let i = 0; i < steps; i++) {
        player.position = (player.position + 1) % state.gameSettings.totalSpaces;
        if (player.position === 0) passedGo = true;
        
        ui.updatePawnPosition(player); 
        if (i === 0) {
            const playersLeftBehind = state.players.filter(p => p.position === oldPosition && p.id !== player.id);
            if (playersLeftBehind.length > 0) {
                ui.updatePawnPosition(playersLeftBehind[0]);
            }
        }
        await new Promise(resolve => setTimeout(resolve, player.isBot ? 100 : 200));
    }

    if (passedGo) {
        const finalBonus = applyCareerAbility('passGoBonus', state.gameSettings.passGoBonus, { player });
        actions.changePlayerMoney(player, finalBonus, "โบนัสผ่านจุดเริ่มต้น");
    }

    handleSpaceLanding();
}

export function rollDice() {
    ui.disableGameActions();
    
    let d1 = Math.floor(Math.random() * 6) + 1;
    let d2 = Math.floor(Math.random() * 6) + 1;
    
    addLogMessage(`<strong>${state.players[state.currentPlayerIndex].name}</strong> ทอยได้ ${d1} + ${d2}`);

    const player = state.players[state.currentPlayerIndex];
    if (state.gameSettings.careerMode && player.career === 'gambler') {
        if (player.isBot) {
            if (d1 + d2 <= 5) {
                const dieToReroll = Math.random() < 0.5 ? 1 : 2;
                if (dieToReroll === 1) d1 = Math.floor(Math.random() * 6) + 1;
                else d2 = Math.floor(Math.random() * 6) + 1;
                addLogMessage(`<strong>${player.name}</strong> (นักเสี่ยงโชค) ใช้สกิลทอยใหม่! ได้ ${d1} + ${d2}`);
            }
            finalizeRoll(d1, d2);
        } else {
            ui.showActionModal('ความสามารถนักเสี่ยงโชค', 'คุณต้องการทอยลูกเต๋า 1 ลูกใหม่หรือไม่?', [
                { text: `ทอยลูกเต๋า 1 ใหม่ (${d1})`, callback: () => {
                    d1 = Math.floor(Math.random() * 6) + 1;
                    addLogMessage(`<strong>${player.name}</strong> ใช้สกิลทอยใหม่! ได้ ${d1} + ${d2}`);
                    ui.hideActionModal();
                    finalizeRoll(d1, d2);
                }},
                { text: `ทอยลูกเต๋า 2 ใหม่ (${d2})`, callback: () => {
                    d2 = Math.floor(Math.random() * 6) + 1;
                    addLogMessage(`<strong>${player.name}</strong> ใช้สกิลทอยใหม่! ได้ ${d1} + ${d2}`);
                    ui.hideActionModal();
                    finalizeRoll(d1, d2);
                }},
                { text: 'ไม่ทอยใหม่', className: 'danger', callback: () => {
                    ui.hideActionModal();
                    finalizeRoll(d1, d2);
                }}
            ]);
        }
    } else {
        finalizeRoll(d1, d2);
    }
}

function finalizeRoll(d1, d2) {
    state.setCurrentDiceRoll([d1, d2]);
    ui.updateDice(d1, d2);
    addLogMessage(`ผลลัพธ์สุดท้ายคือ <strong>${d1 + d2}</strong>`);
    movePlayer(d1 + d2);
}
