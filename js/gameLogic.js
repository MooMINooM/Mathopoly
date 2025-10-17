// js/gameLogic.js
import * as state from './state.js';
import * as actions from './actions.js';
import { handleSpaceLanding } from './spaceHandlers.js';
import { addLogMessage } from './logger.js';
import * as ui from './ui.js';

export async function movePlayer(steps) {
    const player = state.players[state.currentPlayerIndex];
    let passedGo = false;

    for (let i = 0; i < steps; i++) {
        player.position = (player.position + 1) % state.gameSettings.totalSpaces;
        ui.updatePawnPosition(player);
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
    ui.disableGameActions();
    
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    state.setCurrentDiceRoll([d1, d2]);

    ui.updateDice(d1, d2);
    addLogMessage(`<strong>${state.players[state.currentPlayerIndex].name}</strong> ทอยได้ ${d1} + ${d2} = ${d1 + d2}`);
    movePlayer(d1 + d2);
}
