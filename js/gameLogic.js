// js/gameLogic.js
import * as state from './state.js';
import * as actions from './actions.js';
import { handleSpaceLanding } from './spaceHandlers.js';
import * as bot from './bot.js';
import { addLogMessage } from './logger.js';
import { updatePlayerInfo, disableGameActions, showActionModal, hideActionModal, enableTurnActions, updateDice, enableEndTurnButton, showSummary } from './ui.js';

export function startTurn() {
    const player = state.players[state.currentPlayerIndex];
    if (player.bankrupt) {
        endTurn();
        return;
    }

    updatePlayerInfo();
    addLogMessage(`--- ตาของ <strong>${player.name}</strong> ---`);

    if (player.isBot) {
        if (player.inJailTurns > 0) {
            if (player.getOutOfJailFree > 0 && Math.random() < 0.8) {
                player.getOutOfJailFree--;
                player.inJailTurns = 0;
                addLogMessage(`<strong>${player.name}</strong> ใช้การ์ดออกจากเกาะร้างฟรี!`);
                updatePlayerInfo();
                bot.makeBotDecision(player);
            } else {
                player.inJailTurns--;
                addLogMessage(`<strong>${player.name}</strong> ยังติดอยู่บนเกาะ (เหลือ ${player.inJailTurns} ตา)`);
                finishTurn();
            }
            return;
        }
        disableGameActions();
        bot.makeBotDecision(player);
        return;
    }

    if (player.inJailTurns > 0) {
        if (player.getOutOfJailFree > 0) {
            showActionModal(
                'ติดเกาะร้าง!',
                `คุณมีการ์ดนางฟ้า ${player.getOutOfJailFree} ใบ ต้องการใช้เพื่อออกจากเกาะหรือไม่?`,
                [
                    { text: 'ใช้การ์ด', callback: () => {
                        player.getOutOfJailFree--;
                        player.inJailTurns = 0;
                        addLogMessage(`<strong>${player.name}</strong> ใช้การ์ดออกจากเกาะร้างฟรี!`);
                        hideActionModal();
                        enableTurnActions();
                    }},
                    { text: 'ไม่ใช้ (ข้ามตา)', className: 'danger', callback: () => {
                        player.inJailTurns--;
                        addLogMessage(`<strong>${player.name}</strong> ยังติดอยู่บนเกาะ (เหลือ ${player.inJailTurns} ตา)`);
                        hideActionModal();
                        setTimeout(() => endTurn(), 500);
                    }}
                ]
            );
        } else {
            player.inJailTurns--;
            addLogMessage(`<strong>${player.name}</strong> ติดเกาะ! (เหลือ ${player.inJailTurns} ตา)`);
            disableGameActions();
            setTimeout(() => {
                endTurn();
            }, 1500);
        }
        return;
    }
    
    enableTurnActions();
}

export function endTurn() {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.loan && !currentPlayer.bankrupt) {
        currentPlayer.loan.roundsLeft--;
        if (currentPlayer.loan.roundsLeft <= 0) {
            actions.changePlayerMoney(currentPlayer, -currentPlayer.loan.amount, "ชำระหนี้");
            if(currentPlayer.bankrupt) return;
            currentPlayer.loan = null;
        }
    }

    const activePlayers = state.players.filter(p => !p.bankrupt);
    if (activePlayers.length <= 1) {
        showSummary();
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
        setTimeout(() => {
            endTurn();
        }, 1200);
    } else {
        enableEndTurnButton();
    }
}

export async function movePlayer(steps) {
    const player = state.players[state.currentPlayerIndex];
    let passedGo = false;

    for (let i = 0; i < steps; i++) {
        player.position = (player.position + 1) % state.gameSettings.totalSpaces;
        actions.updatePawnPosition(player);
        if (player.position === 0) {
            passedGo = true;
        }
        await new Promise(resolve => setTimeout(resolve, player.isBot ? 100 : 200));
    }

    if (passedGo) {
        actions.changePlayerMoney(player, state.gameSettings.passGoBonus, "รับโบนัสผ่านจุดเริ่มต้น");
    }

    handleSpaceLanding();
}

export function rollDice() {
    disableGameActions();
    
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    state.setCurrentDiceRoll([d1, d2]);

    updateDice(d1, d2);
    addLogMessage(`<strong>${state.players[state.currentPlayerIndex].name}</strong> ทอยได้ ${d1} + ${d2} = ${d1 + d2}`);
    movePlayer(d1 + d2);
}
