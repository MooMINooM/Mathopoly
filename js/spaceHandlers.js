// js/spaceHandlers.js
import * as state from './state.js';
import * as ui from './ui.js';
import * as actions from './actions.js';
import { movePlayer } from './gameLogic.js';

function handlePropertyLanding(player, space) {
    if (space.owner === null) { // Unowned
        state.setOnQuestionSuccess(() => {
            ui.showActionModal(
                `ซื้อ ${space.name}?`,
                `ราคา: ฿${space.price.toLocaleString()}. เงินคงเหลือ: ฿${player.money.toLocaleString()}`,
                [
                    { text: 'ซื้อ', callback: () => actions.buyProperty(player, space), enabled: player.money >= space.price },
                    { text: 'ไม่ซื้อ', className: 'danger', callback: () => {
                        ui.hideActionModal();
                        ui.enableEndTurnButton();
                    }}
                ]
            );
        });
        state.setOnQuestionFail(() => {
            ui.enableEndTurnButton();
        });
        ui.showQuestionModalForPurchase(player, `ตอบคำถามเพื่อซื้อ "${space.name}"`);

    } else if (space.owner === player.id) { // Own property
        if (space.level < 3) {
            const expansionCost = actions.calculateExpansionCost(space);
            state.setOnQuestionSuccess(() => {
                ui.showActionModal(
                    `ขยายเมือง ${space.name}?`,
                    `ค่าขยาย: ฿${expansionCost.toLocaleString()}. เงินคงเหลือ: ฿${player.money.toLocaleString()}`,
                    [
                        { text: 'ขยาย', callback: () => actions.expandProperty(player, space), enabled: player.money >= expansionCost },
                        { text: 'ไม่ขยาย', className: 'danger', callback: () => {
                            ui.hideActionModal();
                            ui.enableEndTurnButton();
                        }}
                    ]
                );
            });
            state.setOnQuestionFail(() => {
                ui.enableEndTurnButton();
            });
            ui.showQuestionModalForPurchase(player, `ตอบคำถามเพื่อขยายเมือง "${space.name}"`);
        } else {
            console.log(`"${space.name}" ขยายเต็มระดับแล้ว`);
            ui.enableEndTurnButton();
        }

    } else { // Owned by another player
        const owner = state.players[space.owner];
        const rent = actions.calculateRent(space);
        const buyoutPrice = actions.calculateBuyoutPrice(space);

        const showBuyOrPayModal = () => {
            ui.showActionModal(
                `ที่ดินของ ${owner.name}`,
                `จ่ายค่าผ่านทาง ฿${rent.toLocaleString()} หรือซื้อต่อ ฿${buyoutPrice.toLocaleString()} (เงินของคุณ: ฿${player.money.toLocaleString()})`,
                [
                    { text: `จ่าย ฿${rent.toLocaleString()}`, callback: () => actions.payRent(player, owner, rent) },
                    { text: `ซื้อต่อ ฿${buyoutPrice.toLocaleString()}`, callback: () => {
                        if (player.money < buyoutPrice) {
                            ui.showInsufficientFundsModal(() => showBuyOrPayModal());
                        } else {
                            actions.buyOutProperty(player, owner, space);
                        }
                    }}
                ]
            );
        };
        showBuyOrPayModal();
    }
}

function handleTrainStation(player) {
    const cost = Math.round(500 * (state.gameSettings.startingMoney / 15000)); // ปัดเศษ
    ui.showActionModal(
        'สถานีรถไฟ',
        `จ่าย ฿${cost.toLocaleString()} เพื่อเดินทางไปยังเมืองใดก็ได้?`,
        [
            { text: 'เดินทาง', callback: () => travelByTrain(player), enabled: player.money >= cost },
            { text: 'ไม่เดินทาง', className: 'danger', callback: () => {
                ui.hideActionModal();
                ui.enableEndTurnButton();
            }}
        ]
    );
}

async function travelByTrain(player) {
    ui.hideActionModal();
    const cost = Math.round(500 * (state.gameSettings.startingMoney / 15000)); // ปัดเศษ
    actions.changePlayerMoney(player, -cost, "ค่าเดินทางรถไฟ");
    if(player.bankrupt) return;

    const travelModal = document.createElement('div');
    travelModal.className = 'modal';
    travelModal.style.display = 'flex';

    let optionsHTML = state.boardSpaces
        .filter(s => s.type === 'property' && (s.owner === null || (s.owner === player.id && s.level < 3)))
        .map(s => {
            let status = s.owner === null ? ' (ว่าง)' : ' (ของคุณ)';
            return `<option value="${s.id}">${s.name}${status}</option>`;
        })
        .join('');

    travelModal.innerHTML = `
        <div class="modal-content">
            <h2>เลือกเมืองปลายทาง</h2>
            <select id="destination-select">${optionsHTML}</select>
            <button id="confirm-travel-btn">ยืนยัน</button>
        </div>
    `;
    document.body.appendChild(travelModal);

    document.getElementById('confirm-travel-btn').onclick = async () => {
        const destinationId = parseInt(document.getElementById('destination-select').value);
        document.body.removeChild(travelModal);

        let steps = (destinationId - player.position + state.gameSettings.totalSpaces) % state.gameSettings.totalSpaces;

        console.log(`${player.name} เดินทางด้วยรถไฟไปยัง ${state.boardSpaces[destinationId].name}`);
        await movePlayer(steps);
    };
}

function handleMathematicianCorner(player) {
    console.log(`${player.name} ได้รับสิทธิ์ในการซื้อหรือขยายเมืองใดก็ได้ฟรี 1 ครั้ง!`);
    ui.showActionModal('มุมนักคณิตศาสตร์!',
        'คุณได้รับสิทธิ์ในการซื้อ (ถ้ามีเมืองว่าง) หรือขยายเมือง (ถ้ามีเมืองของตัวเอง) ใดก็ได้ 1 แห่งทันที',
        [
            { text: 'ใช้สิทธิ์', callback: () => selectPropertyForBonus(player) },
            { text: 'ไม่ใช้สิทธิ์', className: 'danger', callback: () => { ui.hideActionModal(); ui.enableEndTurnButton(); }}
        ]
    );
}

function selectPropertyForBonus(player) {
    ui.hideActionModal();
    const selectModal = document.createElement('div');
    selectModal.className = 'modal';
    selectModal.style.display = 'flex';

    let optionsHTML = state.boardSpaces
        .filter(s => s.type === 'property' && (s.owner === null || (s.owner === player.id && s.level < 3)))
        .map(s => {
            let status = s.owner === null ? ' (ว่าง)' : ' (ของคนอื่น)';
            return `<option value="${s.id}">${s.name}${status}</option>`;
        })
        .join('');

    selectModal.innerHTML = `
        <div class="modal-content">
            <h2>เลือกเมืองที่จะใช้สิทธิ์</h2>
            <select id="bonus-select">${optionsHTML}</select>
            <button id="confirm-bonus-btn">ยืนยัน</button>
        </div>
    `;
    document.body.appendChild(selectModal);

    document.getElementById('confirm-bonus-btn').onclick = () => {
        const spaceId = parseInt(document.getElementById('bonus-select').value);
        const space = state.boardSpaces[spaceId];
        document.body.removeChild(selectModal);

        if (space.owner === null) {
            state.setOnQuestionSuccess(() => actions.buyProperty(player, space));
            state.setOnQuestionFail(() => { console.log("ตอบผิด! เสียสิทธิ์โบนัส"); ui.enableEndTurnButton(); });
            ui.showQuestionModalForPurchase(player, `ตอบคำถามเพื่อซื้อ "${space.name}" (สิทธิ์โบนัส)`);
        } else if (space.owner === player.id && space.level < 3) {
            state.setOnQuestionSuccess(() => actions.expandProperty(player, space));
            state.setOnQuestionFail(() => { console.log("ตอบผิด! เสียสิทธิ์โบนัส"); ui.enableEndTurnButton(); });
            ui.showQuestionModalForPurchase(player, `ตอบคำถามเพื่อขยาย "${space.name}" (สิทธิ์โบนัส)`);
        } else {
            console.log("ไม่สามารถใช้สิทธิ์กับเมืองนี้ได้");
            ui.enableEndTurnButton();
        }
    };
}


function drawChanceCard(player) {
    const moneyScale = state.gameSettings.startingMoney / 15000;
    
    // ย้ายการคำนวณเงินรางวัลทั้งหมดมาไว้ข้างนอก และปัดเศษให้เรียบร้อย
    const lotteryWin = Math.round(1000 * moneyScale);
    const roadRepairCost = Math.round(player.properties.length * 250 * moneyScale);
    const dividend = Math.round(500 * moneyScale);
    const tuitionFee = Math.round(1500 * moneyScale);

    const cards = [
        { text: `ถูกลอตเตอรี่! รับเงิน ฿${lotteryWin.toLocaleString()}`, action: (p) => actions.changePlayerMoney(p, lotteryWin, "ถูกลอตเตอรี่") },
        { text: "จ่ายค่าซ่อมถนนทุกสายของคุณ เมืองละ ฿250", action: (p) => actions.changePlayerMoney(p, -roadRepairCost, "ค่าซ่อมถนน")},
        { text: `ธนาคารจ่ายเงินปันผลให้คุณ ฿${dividend.toLocaleString()}`, action: (p) => actions.changePlayerMoney(p, dividend, "เงินปันผล") },
        { text: "ไปที่เกาะร้างทันที!", action: (p) => {
            console.log(`${p.name} ถูกส่งไปที่เกาะร้าง!`);
            p.position = 12;
            p.inJailTurns = 1;
            ui.updatePawnPosition(p);
        }},
        { text: "เดินหน้าไป 3 ช่อง", action: async (p) => { await movePlayer(3); return true; }},
        { text: "รับการ์ด 'ออกจากเกาะร้างฟรี'", action: (p) => { p.getOutOfJailFree++; console.log(`${p.name} ได้รับการ์ดออกจากเกาะร้างฟรี`); }},
        { text: `จ่ายค่าเทอม ฿${tuitionFee.toLocaleString()}`, action: (p) => actions.changePlayerMoney(p, -tuitionFee, "ค่าเทอม") },
        { text: "เดินไปที่จุดเริ่มต้นและรับเงินโบนัส", action: async (p) => {
            const steps = (state.gameSettings.totalSpaces - p.position) % state.gameSettings.totalSpaces;
            await movePlayer(steps);
            return true;
        }},
    ];

    const card = cards[Math.floor(Math.random() * cards.length)];
    console.log(`การ์ดดวง: ${card.text}`);

    document.getElementById('chance-card-text').textContent = card.text;
    document.getElementById('chance-card-modal').style.display = 'flex';

    document.getElementById('chance-card-ok-btn').onclick = async () => {
        document.getElementById('chance-card-modal').style.display = 'none';
        const isMoveAction = await card.action(player);
        if (!isMoveAction) {
            ui.enableEndTurnButton();
        }
    };
}


export function handleSpaceLanding() {
    const player = state.players[state.currentPlayerIndex];
    const space = state.boardSpaces[player.position];
    console.log(`${player.name} เดินมาตกที่ช่อง "${space.name}"`);

    switch (space.type) {
        case 'property':
            handlePropertyLanding(player, space);
            break;
        case 'chance':
            drawChanceCard(player);
            break;
        case 'jail':
            console.log(`${player.name} ติดเกาะร้าง! ต้องหยุดเดิน 1 ตา`);
            player.inJailTurns = 1;
            ui.enableEndTurnButton();
            break;
        case 'train_station':
            handleTrainStation(player);
            break;
        case 'mathematician_corner':
            handleMathematicianCorner(player);
            break;
        case 'start':
            console.log("พักผ่อนที่จุดเริ่มต้น");
            ui.enableEndTurnButton();
            break;
        default:
            ui.enableEndTurnButton();
    }
}
