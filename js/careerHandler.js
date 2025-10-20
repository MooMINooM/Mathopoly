// js/careerHandler.js
import * as state from './state.js';
import * as actions from './actions.js';
import { addLogMessage } from './logger.js';
import * as ui from './ui.js';

export function applyCareerAbility(abilityType, currentValue, context) {
    const player = context.player || (state.currentPlayerIndex !== -1 ? state.players[state.currentPlayerIndex] : null);

    if (!state.gameSettings.careerMode || !player || player.career === 'none') {
        return currentValue;
    }

    switch (abilityType) {
        case 'calculateRent': {
            const owner = context.owner;
            const payingPlayer = context.payingPlayer;
            let rent = currentValue;

            if (payingPlayer.career === 'diplomat') {
                rent = Math.ceil(rent * 0.75);
                addLogMessage(`<strong>${payingPlayer.name}</strong> (นักเจรจา) ใช้ส่วนลดค่าผ่านทาง!`);
            }

            if (owner && owner.career === 'landlord' && !state.landlordBonusUsed) {
                rent = Math.round(rent * 1.5);
                addLogMessage(`<strong>${owner.name}</strong> (เจ้าสัว) ใช้โบนัสค่าเช่า x1.5!`);
                state.setLandlordBonusUsed(true);
            }
            return rent;
        }

        case 'calculateExpansionCost': {
            let cost = currentValue;
            if (player.career === 'investor') {
                cost = Math.round(cost * 0.8);
            }
            return cost;
        }

        case 'calculateBuyoutPrice': {
            let price = currentValue;
            if (player.career === 'broker') {
                price = Math.round(price * 0.9);
            }
            return price;
        }

        case 'afterQuestionCorrect': {
            if (player.career === 'scholar') {
                actions.changePlayerMoney(player, 200, "โบนัสนักวิชาการ");
            }
            return null;
        }

        case 'passGoBonus': {
            let bonus = currentValue;
            if (player.career === 'explorer') {
                bonus += 1000;
                addLogMessage(`<strong>${player.name}</strong> (นักสำรวจ) ได้รับโบนัสพิเศษ!`);
            }
            return bonus;
        }

        case 'chanceCardCost': {
            if (player.career === 'accountant' && currentValue < 0) {
                addLogMessage(`<strong>${player.name}</strong> (นักบัญชี) ใช้ความสามารถ ไม่ต้องเสียเงิน!`);
                return 0;
            }
            return currentValue;
        }

        case 'startTurnDividend': {
            if (player.career === 'tycoon') {
                const totalAssets = player.money + player.properties.reduce((sum, pId) => sum + (state.boardSpaces.find(s => s.id === pId)?.investment || 0), 0);
                const dividend = Math.round(totalAssets * 0.01);
                if (dividend > 0) {
                    actions.changePlayerMoney(player, dividend, null);
                    addLogMessage(`<strong>${player.name}</strong> (นักธุรกิจ) ได้รับปันผล ฿${dividend.toLocaleString()}`);
                }
            }
            return null;
        }

        default:
            return currentValue;
    }
}
