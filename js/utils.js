// js/utils.js
import * as state from './state.js';
import { applyCareerAbility } from './careerHandler.js'; // <-- Import ศูนย์บัญชาการ

/**
 * คำนวณค่าผ่านทางของเมือง (ส่งต่อให้ careerHandler)
 * @param {object} space - ข้อมูลช่องเมือง
 * @param {object} payingPlayer - ผู้เล่นที่กำลังจะจ่ายเงิน
 * @returns {number} ค่าผ่านทางสุดท้าย
 */
export function calculateRent(space, payingPlayer) {
    let baseRent = Math.round(space.investment * 0.5);

    // ตรวจสอบโบนัสเมืองติดกัน
    if (state.gameSettings.adjacencyBonus && space.owner !== null) {
        const ownerId = space.owner;
        const p_minus_1 = state.boardSpaces[space.id - 1];
        const p_minus_2 = state.boardSpaces[space.id - 2];
        const p_plus_1 = state.boardSpaces[space.id + 1];
        const p_plus_2 = state.boardSpaces[space.id + 2];

        const isMiddle = p_minus_1?.owner === ownerId && p_plus_1?.owner === ownerId && p_minus_1?.type === 'property' && p_plus_1?.type === 'property';
        const isStart = p_plus_1?.owner === ownerId && p_plus_2?.owner === ownerId && p_plus_1?.type === 'property' && p_plus_2?.type === 'property';
        const isEnd = p_minus_1?.owner === ownerId && p_minus_2?.owner === ownerId && p_minus_1?.type === 'property' && p_minus_2?.type === 'property';

        if (isMiddle || isStart || isEnd) {
            baseRent = Math.round(baseRent * 1.5);
        }
    }

    // ส่งต่อให้ careerHandler ตัดสินใจขั้นสุดท้าย
    const owner = state.players.find(p => p.id === space.owner);
    return applyCareerAbility('calculateRent', baseRent, { space, owner, payingPlayer });
}

/**
 * คำนวณราคาซื้อต่อเมือง (ส่งต่อให้ careerHandler)
 * @param {object} space - ข้อมูลช่องเมือง
 * @param {object} buyingPlayer - ผู้เล่นที่กำลังจะซื้อ
 * @returns {number} ราคาซื้อต่อสุดท้าย
 */
export function calculateBuyoutPrice(space, buyingPlayer) {
    const basePrice = Math.round(space.investment * 1.2);
    // ส่งต่อให้ careerHandler ตัดสินใจขั้นสุดท้าย
    return applyCareerAbility('calculateBuyoutPrice', basePrice, { space, player: buyingPlayer });
}

/**
 * คำนวณค่าใช้จ่ายในการขยายเมือง (ส่งต่อให้ careerHandler)
 * @param {object} space - ข้อมูลช่องเมือง
 * @param {object} expandingPlayer - ผู้เล่นที่กำลังจะขยาย
 * @returns {number} ค่าขยายเมืองสุดท้าย
 */
export function calculateExpansionCost(space, expandingPlayer) {
    let baseCost = 0;
    if (space.level === 1) {
        baseCost = Math.round(space.basePrice * 0.5);
    } else if (space.level === 2) {
        baseCost = Math.round((space.investment) * 0.5);
    }
    // ส่งต่อให้ careerHandler ตัดสินใจขั้นสุดท้าย
    return applyCareerAbility('calculateExpansionCost', baseCost, { space, player: expandingPlayer });
}
