// js/logger.js
const MAX_LOG_MESSAGES = 40;

/**
 * เพิ่มข้อความลงในประวัติการเล่น
 * @param {string} message - ข้อความ HTML ที่จะเพิ่ม
 */
export function addLogMessage(message) {
    const gameLogList = document.getElementById('game-log-list');
    if (!gameLogList) {
        // ในกรณีที่ log ยังไม่พร้อมใช้งาน ให้แสดงใน console แทน
        console.log("Log UI not ready:", message.replace(/<[^>]*>/g, ''));
        return;
    }

    const logItem = document.createElement('li');
    logItem.innerHTML = message;

    gameLogList.prepend(logItem); // เพิ่มข้อความใหม่ไว้บนสุด

    // จำกัดจำนวนข้อความในประวัติ
    while (gameLogList.children.length > MAX_LOG_MESSAGES) {
        gameLogList.removeChild(gameLogList.lastChild);
    }
}
