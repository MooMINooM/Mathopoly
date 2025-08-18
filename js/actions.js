// js/actions.js
import * as state from './state.js';
import * as ui from './ui.js';

// --- Helper & Financial Functions ---
export function changePlayerMoney(player, amount, reason) {
    player.money += amount;
    console.log(`${player.name} ${amount > 0 ? 'ได้รับ' : 'เสีย'}เงิน ฿${Math.abs(amount).toLocaleString()} (${reason})`);

    if (player.money < 0) {
        handleDebt(player);
    }
    ui.updatePlayerInfo();
}

function handleDebt(player) {
    const totalAssetValue = player.properties.reduce((sum, pId) => {
        return sum + (state.boardSpaces[pId].investment * 0.6);
    }, 0);

    if (player.money + totalAssetValue < 0) {
        handleBankruptcy(player);
    } else {
        state.setForcedToSell(true);
        ui.showManagePropertyModal(true);
    }
}

function handleBankruptcy(player) {
    console.log(`!!! ${player.name} ล้มละลาย! !!!`);
    player.bankrupt = true;
    player.money = 0;
    player.properties.forEach(pId => {
        const space = state.boardSpaces[pId];
        space.owner = null;
        space.level = 0;
        space.investment = 0;
    });
    player.properties = [];

    const pawn = document.getElementById(`pawn-${player.id}`);
    if (pawn) pawn.style.display = 'none';

    ui.updateAllUI();

    const activePlayers = state.players.filter(p => !p.bankrupt);
    if (activePlayers.length <= 1) {
        ui.showSummary();
    } else {
         ui.enableEndTurnButton();
    }
}

export function calculateRent(space) {
    return Math.round(space.investment * 0.5);
}
export function calculateBuyoutPrice(space) {
    return Math.round(space.investment * 1.2);
}
export function calculateExpansionCost(space) {
    if (space.level === 1) {
        return Math.round(space.basePrice * 0.5);
    } else if (space.level === 2) {
        return Math.round((space.investment) * 0.5);
    }
    return 0;
}


// --- Player Actions ---
export function buyProperty(player, space) {
    changePlayerMoney(player, -space.price, `ซื้อ ${space.name}`);
    if(player.bankrupt) { ui.hideActionModal(); return; }
    space.owner = player.id;
    space.level = 1;
    space.investment = space.price;
    player.properties.push(space.id);
    console.log(`${player.name} ซื้อ ${space.name} ในราคา ฿${space.price.toLocaleString()}`);
    ui.hideActionModal();
    ui.updateAllUI();
    ui.enableEndTurnButton();
}

export function expandProperty(player, space) {
    const cost = calculateExpansionCost(space);
    changePlayerMoney(player, -cost, `ขยาย ${space.name}`);
    if(player.bankrupt) { ui.hideActionModal(); return; }
    space.investment += cost;
    space.level++;
    console.log(`${player.name} ขยาย ${space.name} ระดับ ${space.level} ในราคา ฿${cost.toLocaleString()}`);
    ui.hideActionModal();
    ui.updateAllUI();
    ui.enableEndTurnButton();
}

export function payRent(player, owner, rent) {
    ui.hideActionModal();
    changePlayerMoney(player, -rent, `จ่ายค่าผ่านทางให้ ${owner.name}`);
    if(player.bankrupt) return;
    changePlayerMoney(owner, rent, `รับค่าผ่านทางจาก ${player.name}`);
    ui.enableEndTurnButton();
}

export function buyOutProperty(player, owner, space) {
    ui.hideActionModal();
    const price = calculateBuyoutPrice(space);

    changePlayerMoney(player, -price, `ซื้อต่อ ${space.name} จาก ${owner.name}`);
    if(player.bankrupt) return;

    changePlayerMoney(owner, price, `ขาย ${space.name} ให้ ${player.name}`);
    owner.properties = owner.properties.filter(pId => pId !== space.id);

    space.owner = player.id;
    player.properties.push(space.id);

    console.log(`${player.name} ซื้อ ${space.name} ต่อจาก ${owner.name} ในราคา ฿${price.toLocaleString()}`);
    ui.updateAllUI();
    ui.enableEndTurnButton();
}

export function sellProperty(player, pId) {
    const space = state.boardSpaces[pId];
    const sellPrice = Math.round(space.investment * 0.6);

    changePlayerMoney(player, sellPrice, `ขาย ${space.name}`);

    space.owner = null;
    space.level = 0;
    space.investment = 0;
    player.properties = player.properties.filter(id => id !== pId);

    console.log(`${player.name} ขาย ${space.name} ได้เงิน ฿${sellPrice.toLocaleString()}`);

    ui.updateAllUI();

    if (state.isForcedToSell && player.money >= 0) {
        state.setForcedToSell(false);
        console.log("ชำระหนี้สำเร็จแล้ว!");
        ui.hideManagePropertyModal();
        ui.enableEndTurnButton();
    } else {
        // อัปเดตหน้าต่างจัดการทรัพย์สินใหม่หลังจากขายไปแล้ว
        ui.showManagePropertyModal(state.isForcedToSell);
    }
}

export function takeLoan(player) {
    const amount = Math.round(state.gameSettings.startingMoney / 3);
    player.loan = {
        amount: amount,
        roundsLeft: 10
    };
    changePlayerMoney(player, amount, "กู้เงิน");
    console.log(`${player.name} กู้เงิน ฿${amount.toLocaleString()}. ต้องคืนใน 10 ตา`);
    // อัปเดตหน้าต่างจัดการทรัพย์สินใหม่หลังจากกู้เงินแล้ว
    ui.showManagePropertyModal();
}
