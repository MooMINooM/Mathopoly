// js/utils.js
import * as state from './state.js';

/**
 * คำนวณค่าผ่านทางของเมือง
 * @param {object} space - ข้อมูลช่องเมือง
 * @returns {number} ค่าผ่านทาง
 */
export function calculateRent(space) {
    let rent = Math.round(space.investment * 0.5);

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
            rent = Math.round(rent * 1.5);
        }
    }

    return rent;
}

/**
 * คำนวณราคาซื้อต่อเมือง
 * @param {object} space - ข้อมูลช่องเมือง
 * @returns {number} ราคาซื้อต่อ
 */
export function calculateBuyoutPrice(space) {
    return Math.round(space.investment * 1.2);
}

/**
 * คำนวณค่าใช้จ่ายในการขยายเมือง
 * @param {object} space - ข้อมูลช่องเมือง
 * @returns {number} ค่าขยายเมือง
 */
export function calculateExpansionCost(space) {
    if (space.level === 1) {
        return Math.round(space.basePrice * 0.5);
    } else if (space.level === 2) {
        return Math.round((space.investment) * 0.5);
    }
    return 0;
}
