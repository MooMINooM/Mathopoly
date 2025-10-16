// js/bot.js
import * as state from './state.js';
import * as actions from './actions.js';
import * as ui from './ui.js';
import { movePlayer } from './gameLogic.js';

// --- Bot Decision Making ---

// ฟังก์ชันหลักในการตัดสินใจของบอท
export function makeBotDecision(player) {
    console.log(`--- Bot ${player.name} is thinking... ---`);
    // หน่วงเวลาเล็กน้อยเพื่อให้ดูเหมือนบอทกำลังคิด
    setTimeout(() => {
        // การตัดสินใจพื้นฐาน: ทอยลูกเต๋า
        rollDiceForBot(player);
    }, 1000);
}

// ฟังก์ชันทอยลูกเต๋าสำหรับบอท
function rollDiceForBot(player) {
    ui.disableGameActions();
    
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    state.setCurrentDiceRoll([d1, d2]);

    ui.updateDice(d1, d2);
    console.log(`Bot ${player.name} ทอยได้ ${d1} + ${d2} = ${d1 + d2}`);
    
    // หลังจากทอยแล้ว ให้เคลื่อนที่ตัวละคร
    movePlayer(d1 + d2);
}

// --- Bot Actions on Spaces ---

// จัดการการกระทำของบอทเมื่อตกบนพื้นที่ต่างๆ
export function handleBotLanding(player, space) {
     setTimeout(() => {
        switch (space.type) {
            case 'property':
                handleBotPropertyLanding(player, space);
                break;
            case 'chance':
                // การ์ดดวงจะทำงานอัตโนมัติอยู่แล้ว
                console.log(`Bot ${player.name} เปิดการ์ดดวง`);
                break;
            case 'jail':
                 console.log(`Bot ${player.name} ติดเกาะร้าง`);
                 player.inJailTurns = 1;
                 ui.enableEndTurnButton();
                 break;
            default:
                // สำหรับพื้นที่อื่นๆ ที่ไม่ต้องมีการตัดสินใจ
                console.log(`Bot ${player.name} ไม่มีการกระทำใดๆ บนช่อง ${space.name}`);
                ui.enableEndTurnButton();
        }
    }, 1500); // หน่วงเวลาก่อนทำการตัดสินใจ
}


function handleBotPropertyLanding(player, space) {
    const owner = space.owner !== null ? state.players[space.owner] : null;

    // 1. ที่ดินว่าง
    if (owner === null) {
        const buyChance = (player.money / state.gameSettings.startingMoney) * 0.8; // โอกาสซื้อขึ้นอยู่กับเงิน
        if (player.money >= space.price && Math.random() < buyChance) {
            console.log(`Bot ${player.name} ตัดสินใจซื้อ ${space.name}`);
            // บอทตอบคำถามถูกเสมอ
            player.totalQuestions++;
            player.correctAnswers++;
            actions.buyProperty(player, space);
        } else {
            console.log(`Bot ${player.name} ตัดสินใจไม่ซื้อ ${space.name}`);
            ui.enableEndTurnButton();
        }
    }
    // 2. ที่ดินของตัวเอง
    else if (owner.id === player.id) {
        if (space.level < 3) {
            const expansionCost = actions.calculateExpansionCost(space);
            const expandChance = 0.5; // โอกาสขยาย 50%
            if (player.money >= expansionCost && Math.random() < expandChance) {
                console.log(`Bot ${player.name} ตัดสินใจขยาย ${space.name}`);
                // บอทตอบคำถามถูกเสมอ
                player.totalQuestions++;
                player.correctAnswers++;
                actions.expandProperty(player, space);
            } else {
                 console.log(`Bot ${player.name} ตัดสินใจไม่ขยาย ${space.name}`);
                 ui.enableEndTurnButton();
            }
        } else {
            console.log(`Bot ${player.name} มี ${space.name} ที่ขยายเต็มแล้ว`);
            ui.enableEndTurnButton();
        }
    }
    // 3. ที่ดินของคนอื่น
    else {
        const rent = actions.calculateRent(space);
        console.log(`Bot ${player.name} จ่ายค่าผ่านทางให้ ${owner.name} จำนวน ฿${rent.toLocaleString()}`);
        actions.payRent(player, owner, rent);
    }
}

// ตรรกะการจัดการทรัพย์สินของบอท (เมื่อเงินติดลบ)
export function manageBotAssets(player) {
    console.log(`Bot ${player.name} กำลังจัดการทรัพย์สิน...`);
    // ตรรกะง่ายๆ: ขายเมืองที่ถูกที่สุดก่อนจนกว่าเงินจะพอ
    while(player.money < 0 && player.properties.length > 0) {
        let cheapestPropertyId = -1;
        let minInvestment = Infinity;

        player.properties.forEach(pId => {
            const prop = state.boardSpaces[pId];
            if (prop.investment < minInvestment) {
                minInvestment = prop.investment;
                cheapestPropertyId = pId;
            }
        });

        if (cheapestPropertyId !== -1) {
            console.log(`Bot ${player.name} ขาย ${state.boardSpaces[cheapestPropertyId].name} เพื่อชำระหนี้`);
            actions.sellProperty(player, cheapestPropertyId);
        } else {
            // ไม่ควรจะเกิดขึ้นถ้ามี properties
            break;
        }
    }

    // ถ้ายังเงินไม่พออีก อาจจะต้องล้มละลาย (ซึ่ง handleBankruptcy จัดการอยู่แล้ว)
    if (player.money < 0) {
        console.log(`Bot ${player.name} ไม่สามารถชำระหนี้ได้`);
    }
}
