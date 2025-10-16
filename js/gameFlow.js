// js/gameFlow.js
import * as state from './state.js';
import * as actions from './actions.js';
import * as bot from './bot.js';
import { addLogMessage } from './logger.js';
import * as ui from './ui.js';
import { rollDice } from './gameLogic.js'; // gameLogic จะมีแค่ rollDice และ movePlayer

export function startTurn() {
    const player = state.players[state.currentPlayerIndex];
    if (player.bankrupt) {
        endTurn();
        return;
    }

    ui.updatePlayerInfo();
    addLogMessage(`--- ตาของ <strong>${player.name}</strong> ---`);

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
            ui.showActionModal(
                'ติดเกาะร้าง!',
                `คุณมีการ์ดนางฟ้า ${player.getOutOfJailFree} ใบ ต้องการใช้เพื่อออกจากเกาะหรือไม่?`,
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
            setTimeout(() => {
                endTurn();
            }, 1500);
        }
        return;
    }
    
    ui.enableTurnActions();
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
        setTimeout(() => {
            endTurn();
        }, 1200);
    } else {
        ui.enableEndTurnButton();
    }
}
