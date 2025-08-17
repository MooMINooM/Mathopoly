// js/gameLogic.js
import * as state from './state.js';
import * as ui from './ui.js';
import * as actions from './actions.js';
import { handleSpaceLanding } from './spaceHandlers.js';

export function startTurn() {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.bankrupt) {
        endTurn();
        return;
    }

    ui.updatePlayerInfo();
    console.log(`--- ตาของ ${currentPlayer.name} ---`);

    if (currentPlayer.inJailTurns > 0) {
        console.log(`${currentPlayer.name} ติดอยู่บนเกาะร้าง! ต้องข้ามตานี้`);
        currentPlayer.inJailTurns--;
        
        ui.disableGameActions();

        setTimeout(() => {
            console.log(`${currentPlayer.name} ถูกข้ามตา`);
            endTurn();
        }, 1500);

        return;
    }
    
    ui.enableTurnActions();
}

export function endTurn() {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.loan && !currentPlayer.bankrupt) {
        currentPlayer.loan.roundsLeft--;
        if (currentPlayer.loan.roundsLeft <= 0) {
            console.log(`${currentPlayer.name} ถึงกำหนดชำระหนี้ ฿${currentPlayer.loan.amount.toLocaleString()}`);
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

export async function movePlayer(steps) {
    const player = state.players[state.currentPlayerIndex];
    let passedGo = false;

    for (let i = 0; i < steps; i++) {
        player.position = (player.position + 1) % state.gameSettings.totalSpaces;
        ui.updatePawnPosition(player);
        if (player.position === 0) {
            passedGo = true;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (passedGo) {
        actions.changePlayerMoney(player, state.gameSettings.passGoBonus, "รับโบนัสผ่านจุดเริ่มต้น");
    }

    handleSpaceLanding();
}

export function rollDice() {
    ui.disableGameActions();
    
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    state.setCurrentDiceRoll([d1, d2]);

    ui.updateDice(d1, d2);

    console.log(`${state.players[state.currentPlayerIndex].name} ทอยได้ ${d1} + ${d2} = ${d1 + d2}`);
    movePlayer(d1 + d2);
}