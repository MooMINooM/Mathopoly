// js/careerHandler.js
import * as state from './state.js';
import * as actions from './actions.js';
import { addLogMessage } from './logger.js';
import * as ui from './ui.js'; // Import ui for showing modals

/**
 * ฟังก์ชันกลางในการใช้ความสามารถของอาชีพ
 * @param {string} abilityType ประเภทของความสามารถที่กำลังตรวจสอบ
 * @param {*} currentValue ค่าดั้งเดิมก่อนใช้ความสามารถ
 * @param {object} context ข้อมูลเพิ่มเติมที่จำเป็น (เช่น player, space, payingPlayer)
 * @returns {*} ค่าใหม่หลังจากใช้ความสามารถ หรือ null ถ้าไม่มีการคืนค่า
 */
export function applyCareerAbility(abilityType, currentValue, context) {
    // หาผู้เล่นที่เกี่ยวข้อง: ถ้า context มี player ให้ใช้คนนั้น, ถ้าไม่ ให้ใช้ผู้เล่นปัจจุบัน
    const player = context.player || (state.currentPlayerIndex !== -1 ? state.players[state.currentPlayerIndex] : null);

    // ถ้าไม่ได้เปิดโหมดอาชีพ, ไม่มีผู้เล่น, หรือผู้เล่นไม่มีอาชีพ ก็คืนค่าเดิมไป
    if (!state.gameSettings.careerMode || !player || player.career === 'none') {
        return currentValue;
    }

    // ตรวจสอบประเภทความสามารถและเรียกใช้ตรรกะของอาชีพ
    switch (abilityType) {
        case 'calculateRent': { // คำนวณค่าเช่า
            const owner = context.owner; // เจ้าของเมือง (ส่งมาจาก utils.js)
            const payingPlayer = context.payingPlayer; // ผู้เล่นที่จ่าย (ส่งมาจาก utils.js)
            let rent = currentValue;

            // ความสามารถนักเจรจา (Diplomat) - ลดค่าเช่าที่ต้องจ่าย
            if (payingPlayer.career === 'diplomat') {
                rent = Math.ceil(rent * 0.75); // ลด 25% (ปัดขึ้น)
                addLogMessage(`<strong>${payingPlayer.name}</strong> (นักเจรจา) ใช้ส่วนลดค่าผ่านทาง!`);
            }

            // ความสามารถเจ้าสัวที่ดิน (Landlord) - เพิ่มค่าเช่าที่ได้รับ (ครั้งแรก)
            if (owner && owner.career === 'landlord' && !state.landlordBonusUsed) {
                rent = Math.round(rent * 1.5);
                addLogMessage(`<strong>${owner.name}</strong> (เจ้าสัว) ใช้โบนัสค่าเช่า x1.5!`);
                state.setLandlordBonusUsed(true); // ตั้งค่าว่าใช้โบนัสไปแล้วในตานี้
            }
            return rent;
        }

        case 'calculateExpansionCost': { // คำนวณค่าขยายเมือง
            let cost = currentValue;
            // ความสามารถนักลงทุน (Investor) - ลดค่าขยาย
            if (player.career === 'investor') {
                cost = Math.round(cost * 0.8); // ลด 20%
            }
            return cost;
        }

        case 'calculateBuyoutPrice': { // คำนวณราคาซื้อต่อ
            let price = currentValue;
            // ความสามารถนายหน้า (Broker) - ลดราคาซื้อต่อ
            if (player.career === 'broker') {
                price = Math.round(price * 0.9); // ลด 10%
            }
            return price;
        }

        case 'afterQuestionCorrect': { // หลังจากตอบคำถามถูก
            // ความสามารถนักวิชาการ (Scholar) - รับโบนัส
            if (player.career === 'scholar') {
                actions.changePlayerMoney(player, 200, "โบนัสนักวิชาการ");
            }
            return null; // ไม่ต้องคืนค่าอะไร
        }

        case 'passGoBonus': { // คำนวณโบนัสผ่านจุดเริ่มต้น
            let bonus = currentValue;
            // ความสามารถนักสำรวจ (Explorer) - เพิ่มโบนัส
            if (player.career === 'explorer') {
                bonus += 1000;
                addLogMessage(`<strong>${player.name}</strong> (นักสำรวจ) ได้รับโบนัสพิเศษ!`);
            }
            return bonus;
        }

        case 'chanceCardCost': { // ค่าใช้จ่ายจากการ์ดดวง
            // ความสามารถนักบัญชี (Accountant) - ไม่ต้องจ่าย
            if (player.career === 'accountant' && currentValue < 0) { // ถ้าเป็นการเสียเงิน
                addLogMessage(`<strong>${player.name}</strong> (นักบัญชี) ใช้ความสามารถ ไม่ต้องเสียเงิน!`);
                return 0; // ไม่ต้องเสียเงิน
            }
            return currentValue; // เสียเงินตามปกติ
        }

        case 'startTurnDividend': { // รับปันผลตอนเริ่มตา
            // ความสามารถนักธุรกิจ (Tycoon)
            if (player.career === 'tycoon') {
                const totalAssets = player.money + player.properties.reduce((sum, pId) => sum + (state.boardSpaces.find(s => s.id === pId)?.investment || 0), 0);
                const dividend = Math.round(totalAssets * 0.01);
                if (dividend > 0) {
                    // ใช้ null เป็น reason เพื่อไม่ให้แสดง log ซ้ำซ้อน
                    actions.changePlayerMoney(player, dividend, null);
                    addLogMessage(`<strong>${player.name}</strong> (นักธุรกิจ) ได้รับปันผล ฿${dividend.toLocaleString()}`);
                }
            }
            return null;
        }

        // ความสามารถอื่นๆ ที่ทำงานตอนเริ่มตา หรือต้องกดใช้เอง (Engineer, Gambler)
        // จะถูกจัดการใน gameLogic.js หรือ ui.js โดยตรง

        default:
            return currentValue; // ถ้าไม่ตรงกับเงื่อนไขใดๆ ให้คืนค่าเดิม
    }
}
