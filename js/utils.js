// js/utils.js
import * as state from './state.js';
import { applyCareerAbility } from './careerHandler.js';

export function calculateRent(space, payingPlayer) {
    let baseRent = Math.round(space.investment * 0.5);

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

    const owner = state.players.find(p => p.id === space.owner);
    // Ensure payingPlayer is passed correctly, even if it might be null initially (e.g., when updating board UI)
    const validPayingPlayer = payingPlayer || state.players[state.currentPlayerIndex];
    return applyCareerAbility('calculateRent', baseRent, { space, owner, payingPlayer: validPayingPlayer });
}

export function calculateBuyoutPrice(space, buyingPlayer) {
    const basePrice = Math.round(space.investment * 1.2);
    return applyCareerAbility('calculateBuyoutPrice', basePrice, { space, player: buyingPlayer });
}

export function calculateExpansionCost(space, expandingPlayer) {
    let baseCost = 0;
    if (space.level === 1) {
        baseCost = Math.round(space.basePrice * 0.5);
    } else if (space.level === 2) {
        baseCost = Math.round((space.investment) * 0.5);
    }
    return applyCareerAbility('calculateExpansionCost', baseCost, { space, player: expandingPlayer });
}
