// js/gameLogic.js
import * as state from './state.js';
import * as actions from './actions.js';
import { handleSpaceLanding } from './spaceHandlers.js';
import { addLogMessage } from './logger.js';
import * as ui from './ui.js'; // <-- ตรวจสอบว่า import ui เข้ามา

export async function movePlayer(steps) {
    const player = state.players[state.currentPlayerIndex];
    const oldPosition = player.position;
    let passedGo = false;

    for (let i = 0; i < steps; i++) {
        player.position = (player.position + 1) % state.gameSettings.totalSpaces;
        if (player.position === 0) passedGo = true;
        
        // --- START: ส่วนที่แก้ไข ---
        // เรียกใช้ updatePawnPosition จาก ui.js โดยตรง
        ui.updatePawnPosition(player); 
        
        // จัดระเบียบผู้เล่นที่ช่องเก่า หลังจากที่ตัวหมากเดินออกจากช่องนั้นแล้ว
        if (i === 0) {
            const playersLeftBehind = state.players.filter(p => p.position === oldPosition && p.id !== player.id);
            if (playersLeftBehind.length > 0) {
                // บอกให้ UI อัปเดตตำแหน่งของผู้เล่นคนใดคนหนึ่งที่ยังอยู่ช่องเก่า
                // ฟังก์ชัน updatePawnPosition ที่เราแก้ล่าสุดจะจัดระเบียบที่เหลือให้เอง
                ui.updatePawnPosition(playersLeftBehind[0]);
            }
        }
        // --- END: ส่วนที่แก้ไข ---

        await new Promise(resolve => setTimeout(resolve, player.isBot ? 100 : 200));
    }

    if (passedGo && player.career !== 'explorer') {
        actions.changePlayerMoney(player, state.gameSettings.passGoBonus, "รับโบนัสผ่านจุดเริ่มต้น");
    } else if (passedGo && player.career === 'explorer') {
        const bonus = state.gameSettings.passGoBonus + 1000;
        actions.changePlayerMoney(player, bonus, "โบนัสนักสำรวจ");
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
                addLogMessage(`<strong>${player.name}</strong> ใช้สกิลทอยใหม่! ได้ ${d1} + ${d2}`);
            }
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
            return;
        }
    }
    
    finalizeRoll(d1, d2);
}

function finalizeRoll(d1, d2) {
    state.setCurrentDiceRoll([d1, d2]);
    ui.updateDice(d1, d2);
    addLogMessage(`ผลลัพธ์สุดท้ายคือ <strong>${d1 + d2}</strong>`);
    movePlayer(d1 + d2);
}
