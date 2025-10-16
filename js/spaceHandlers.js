// js/spaceHandlers.js
import * as state from './state.js';
import * as actions from './actions.js';
import { movePlayer } from './gameLogic.js'; // <-- แก้ไข Import
import { finishTurn } from './gameFlow.js';  // <-- แก้ไข Import
import { addLogMessage } from './logger.js';
import { showActionModal, hideActionModal, showQuestionModalForPurchase, showInsufficientFundsModal } from './ui.js';

//... (โค้ดที่เหลือใน spaceHandlers.js เหมือนเดิมจากคำตอบที่แล้ว แต่ให้แน่ใจว่า import ถูกต้องตามนี้)
function handlePropertyLanding(player, space) {
    if (player.isBot) {
        setTimeout(() => {
            const owner = space.owner !== null ? state.players[space.owner] : null;
            if (owner === null) {
                const buyChance = (player.money / state.gameSettings.startingMoney) * 0.75;
                if (player.money >= space.price && Math.random() < buyChance) {
                    player.totalQuestions++; player.correctAnswers++;
                    actions.buyProperty(player, space);
                } else {
                    finishTurn();
                }
            } else if (owner.id === player.id) {
                if (space.level < 3) {
                    const expansionCost = actions.calculateExpansionCost(space);
                    if (player.money >= expansionCost * 2 && Math.random() < 0.5) {
                        player.totalQuestions++; player.correctAnswers++;
                        actions.expandProperty(player, space);
                    } else {
                        finishTurn();
                    }
                } else {
                    finishTurn();
                }
            } else {
                const rent = actions.calculateRent(space);
                const buyoutPrice = actions.calculateBuyoutPrice(space);
                
                if (player.money >= buyoutPrice && Math.random() < 0.3) {
                    actions.buyOutProperty(player, owner, space);
                } else {
                    actions.payRent(player, owner, rent);
                }
            }
        }, 1500);
        return;
    }

    if (space.owner === null) {
        state.setOnQuestionSuccess(() => {
            showActionModal(
                `ซื้อ ${space.name}?`,
                `ราคา: ฿${space.price.toLocaleString()}. เงินคงเหลือ: ฿${player.money.toLocaleString()}`,
                [
                    { text: 'ซื้อ', callback: () => actions.buyProperty(player, space), enabled: player.money >= space.price },
                    { text: 'ไม่ซื้อ', className: 'danger', callback: () => {
                        hideActionModal();
                        finishTurn();
                    }}
                ]
            );
        });
        state.setOnQuestionFail(() => {
            finishTurn();
        });
        showQuestionModalForPurchase(player, `ตอบคำถามเพื่อซื้อ "${space.name}"`);
    } else if (space.owner === player.id) {
        if (space.level < 3) {
            const expansionCost = actions.calculateExpansionCost(space);
            state.setOnQuestionSuccess(() => {
                showActionModal(
                    `ขยายเมือง ${space.name}?`,
                    `ค่าขยาย: ฿${expansionCost.toLocaleString()}. เงินคงเหลือ: ฿${player.money.toLocaleString()}`,
                    [
                        { text: 'ขยาย', callback: () => actions.expandProperty(player, space), enabled: player.money >= expansionCost },
                        { text: 'ไม่ขยาย', className: 'danger', callback: () => {
                            hideActionModal();
                            finishTurn();
                        }}
                    ]
                );
            });
            state.setOnQuestionFail(() => {
                finishTurn();
            });
            showQuestionModalForPurchase(player, `ตอบคำถามเพื่อขยายเมือง "${space.name}"`);
        } else {
            finishTurn();
        }
    } else {
        const owner = state.players[space.owner];
        const rent = actions.calculateRent(space);
        const buyoutPrice = actions.calculateBuyoutPrice(space);
        const showBuyOrPayModal = () => {
            showActionModal(
                `ที่ดินของ ${owner.name}`,
                `จ่ายค่าผ่านทาง ฿${rent.toLocaleString()} หรือซื้อต่อ ฿${buyoutPrice.toLocaleString()} (เงินของคุณ: ฿${player.money.toLocaleString()})`,
                [
                    { text: `จ่าย ฿${rent.toLocaleString()}`, callback: () => actions.payRent(player, owner, rent) },
                    { text: `ซื้อต่อ ฿${buyoutPrice.toLocaleString()}`, callback: () => {
                        if (player.money < buyoutPrice) {
                            showInsufficientFundsModal(() => showBuyOrPayModal());
                        } else {
                            actions.buyOutProperty(player, owner, space);
                        }
                    }, enabled: player.money >= buyoutPrice}
                ]
            );
        };
        showBuyOrPayModal();
    }
}

async function botTravelByTrain(player) {
    const cost = Math.round(500 * (state.gameSettings.startingMoney / 15000));
    actions.changePlayerMoney(player, -cost, "ค่าเดินทางรถไฟ");
    if(player.bankrupt) return;

    let destinationId = -1;
    const unownedProperties = state.boardSpaces
        .filter(s => s.type === 'property' && s.owner === null)
        .sort((a, b) => b.price - a.price);

    if (unownedProperties.length > 0) {
        destinationId = unownedProperties[0].id;
    } else {
        const upgradableProperties = state.boardSpaces
            .filter(s => s.type === 'property' && s.owner === player.id && s.level < 3);

        if (upgradableProperties.length > 0) {
            destinationId = upgradableProperties[Math.floor(Math.random() * upgradableProperties.length)].id;
        }
    }

    if (destinationId !== -1) {
        addLogMessage(`<strong>${player.name}</strong> เดินทางด้วยรถไฟไปที่ <strong>${state.boardSpaces[destinationId].name}</strong>`);
        const steps = (destinationId - player.position + state.gameSettings.totalSpaces) % state.gameSettings.totalSpaces;
        await movePlayer(steps);
    } else {
        finishTurn();
    }
}

function handleTrainStation(player) {
    const cost = Math.round(500 * (state.gameSettings.startingMoney / 15000));

    if (player.isBot) {
        setTimeout(() => {
            if (player.money >= cost && Math.random() < 0.7) {
                botTravelByTrain(player);
            } else {
                finishTurn();
            }
        }, 1500);
        return;
    }

    showActionModal(
        'สถานีรถไฟ',
        `จ่าย ฿${cost.toLocaleString()} เพื่อเดินทางไปยังเมืองใดก็ได้?`,
        [
            { text: 'เดินทาง', callback: () => travelByTrain(player), enabled: player.money >= cost },
            { text: 'ไม่เดินทาง', className: 'danger', callback: () => {
                hideActionModal();
                finishTurn();
            }}
        ]
    );
}

async function travelByTrain(player) {
    hideActionModal();
    const cost = Math.round(500 * (state.gameSettings.startingMoney / 15000));
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
        addLogMessage(`<strong>${player.name}</strong> เดินทางด้วยรถไฟไปที่ <strong>${state.boardSpaces[destinationId].name}</strong>`);
        let steps = (destinationId - player.position + state.gameSettings.totalSpaces) % state.gameSettings.totalSpaces;
        await movePlayer(steps);
    };
}

function botHandleMathematicianCorner(player) {
    if (Math.random() < 0.9) {
        let targetSpace = null;
        const unowned = state.boardSpaces
            .filter(s => s.type === 'property' && s.owner === null)
            .sort((a, b) => b.price - a.price);

        if (unowned.length > 0) {
            targetSpace = unowned[0];
            addLogMessage(`<strong>${player.name}</strong> ใช้สิทธิ์ซื้อ <strong>${targetSpace.name}</strong> ฟรี!`);
            player.totalQuestions++; player.correctAnswers++;
            actions.buyProperty(player, targetSpace);
        } else {
            const upgradable = state.boardSpaces
                .filter(s => s.type === 'property' && s.owner === player.id && s.level < 3)
                .sort((a, b) => b.investment - a.investment);

            if (upgradable.length > 0) {
                targetSpace = upgradable[0];
                addLogMessage(`<strong>${player.name}</strong> ใช้สิทธิ์ขยาย <strong>${targetSpace.name}</strong> ฟรี!`);
                player.totalQuestions++; player.correctAnswers++;
                actions.expandProperty(player, targetSpace);
            }
        }
        if (!targetSpace) {
            finishTurn();
        }
    } else {
        finishTurn();
    }
}

function handleMathematicianCorner(player) {
    addLogMessage(`<strong>${player.name}</strong> ได้รับสิทธิ์พิเศษจาก <strong>มุมนักคณิตศาสตร์</strong>`);
    if (player.isBot) {
        setTimeout(() => botHandleMathematicianCorner(player), 1500);
        return;
    }
    showActionModal('มุมนักคณิตศาสตร์!',
        'คุณได้รับสิทธิ์ในการซื้อ (ถ้ามีเมืองว่าง) หรือขยายเมือง (ถ้ามีเมืองของตัวเอง) ใดก็ได้ 1 แห่งทันที',
        [
            { text: 'ใช้สิทธิ์', callback: () => selectPropertyForBonus(player) },
            { text: 'ไม่ใช้สิทธิ์', className: 'danger', callback: () => { hideActionModal(); finishTurn(); }}
        ]
    );
}

function selectPropertyForBonus(player) {
    hideActionModal();
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
            addLogMessage(`<strong>${player.name}</strong> ใช้สิทธิ์ซื้อ <strong>${space.name}</strong> ฟรี!`);
            state.setOnQuestionSuccess(() => actions.buyProperty(player, space));
            state.setOnQuestionFail(() => { finishTurn(); });
            showQuestionModalForPurchase(player, `ตอบคำถามเพื่อซื้อ "${space.name}" (สิทธิ์โบนัส)`);
        } else if (space.owner === player.id && space.level < 3) {
            addLogMessage(`<strong>${player.name}</strong> ใช้สิทธิ์ขยาย <strong>${space.name}</strong> ฟรี!`);
            state.setOnQuestionSuccess(() => actions.expandProperty(player, space));
            state.setOnQuestionFail(() => { finishTurn(); });
            showQuestionModalForPurchase(player, `ตอบคำถามเพื่อขยาย "${space.name}" (สิทธิ์โบนัส)`);
        } else {
            finishTurn();
        }
    };
}

function selectPropertyToUpgradeForFree(player) {
    const upgradable = state.boardSpaces.filter(s => s.type === 'property' && s.owner === player.id && s.level < 3);

    if (upgradable.length === 0) {
        addLogMessage(`แต่ <strong>${player.name}</strong> ไม่มีเมืองให้ขยายเลย!`);
        finishTurn();
        return;
    }

    if (player.isBot) {
        const target = upgradable.sort((a,b) => b.investment - a.investment)[0];
        addLogMessage(`<strong>${player.name}</strong> เลือกขยาย <strong>${target.name}</strong> ฟรี!`);
        actions.expandProperty(player, target);
        return;
    }

    const selectModal = document.createElement('div');
    selectModal.className = 'modal';
    selectModal.style.display = 'flex';
    const optionsHTML = upgradable.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    selectModal.innerHTML = `
        <div class="modal-content">
            <h2>เลือกเมืองที่จะขยายฟรี</h2>
            <select id="upgrade-select">${optionsHTML}</select>
            <button id="confirm-upgrade-btn">ยืนยัน</button>
        </div>
    `;
    document.body.appendChild(selectModal);
    document.getElementById('confirm-upgrade-btn').onclick = () => {
        const spaceId = parseInt(document.getElementById('upgrade-select').value);
        const space = state.boardSpaces[spaceId];
        document.body.removeChild(selectModal);
        addLogMessage(`<strong>${player.name}</strong> เลือกขยาย <strong>${space.name}</strong> ฟรี!`);
        actions.expandProperty(player, space);
    };
}

function drawChanceCard(player) {
    const moneyScale = state.gameSettings.startingMoney / 15000;
    const lotteryWin = Math.round(1500 * moneyScale);
    const taxThreshold = Math.round(10000 * moneyScale);
    const tuitionFee = Math.round(1000 * moneyScale);

    const cards = [
        { text: `ถูกลอตเตอรี่! รับเงิน ฿${lotteryWin.toLocaleString()}`, action: (p) => { actions.changePlayerMoney(p, lotteryWin, "ถูกลอตเตอรี่"); }},
        { text: "ทฤษฎีบทใหม่ถูกค้นพบ! เลือกขยายเมืองของคุณ 1 แห่งฟรี", action: (p) => { selectPropertyToUpgradeForFree(p); return true; }},
        { text: "ไปที่เกาะร้างทันที!", action: (p) => { p.position = 12; p.inJailTurns = 1; actions.updatePawnPosition(p); }},
        { text: "รับการ์ด 'ออกจากเกาะร้างฟรี'", action: (p) => { p.getOutOfJailFree++; }},
        { text: `จ่ายค่าเทอม ฿${tuitionFee.toLocaleString()}`, action: (p) => { actions.changePlayerMoney(p, -tuitionFee, "ค่าเทอม"); }},
        { text: "เดินทางข้ามมิติ! สลับตำแหน่งกับผู้เล่นที่รวยที่สุด", action: (p) => {
            const richestPlayer = state.players.filter(pl => !pl.bankrupt && pl.id !== p.id).sort((a,b) => b.money - a.money)[0];
            if (richestPlayer) {
                [p.position, richestPlayer.position] = [richestPlayer.position, p.position];
                actions.updatePawnPosition(p);
                actions.updatePawnPosition(richestPlayer);
                addLogMessage(`<strong>${p.name}</strong> สลับตำแหน่งกับ <strong>${richestPlayer.name}</strong>!`);
            }
            return true;
        }},
        { text: `ตลาดหุ้นผันผวน! ผู้เล่นที่มีเงินเกิน ฿${taxThreshold.toLocaleString()} ต้องจ่ายภาษี 10%`, action: () => {
            state.players.forEach(p => {
                if (!p.bankrupt && p.money > taxThreshold) {
                    const tax = Math.round(p.money * 0.1);
                    actions.changePlayerMoney(p, -tax, "ภาษีตลาดหุ้น");
                }
            });
        }},
        { text: "เดินไปที่จุดเริ่มต้นและรับเงินโบนัส", action: async (p) => {
            const steps = (state.gameSettings.totalSpaces - p.position) % state.gameSettings.totalSpaces;
            await movePlayer(steps);
            return true;
        }},
    ];

    const card = cards[Math.floor(Math.random() * cards.length)];
    addLogMessage(`<strong>${player.name}</strong> เปิดการ์ดดวง: ${card.text}`);

    document.getElementById('chance-card-text').textContent = card.text;
    document.getElementById('chance-card-modal').style.display = 'flex';

    const onCardAcknowledge = async () => {
        document.getElementById('chance-card-modal').style.display = 'none';
        const isMoveAction = await card.action(player);
        if (!isMoveAction) {
            finishTurn();
        }
    };

    if (player.isBot) {
        setTimeout(onCardAcknowledge, 1500);
    } else {
        document.getElementById('chance-card-ok-btn').onclick = onCardAcknowledge;
    }
}

export function handleSpaceLanding() {
    const player = state.players[state.currentPlayerIndex];
    const space = state.boardSpaces[player.position];
    addLogMessage(`<strong>${player.name}</strong> ตกที่ช่อง <strong>${space.name}</strong>`);

    switch (space.type) {
        case 'property':
            handlePropertyLanding(player, space);
            break;
        case 'chance':
            drawChanceCard(player);
            break;
        case 'jail':
            player.inJailTurns = 1;
            finishTurn();
            break;
        case 'train_station':
            handleTrainStation(player);
            break;
        case 'mathematician_corner':
            handleMathematicianCorner(player);
            break;
        case 'start':
            finishTurn();
            break;
        default:
            finishTurn();
    }
}

