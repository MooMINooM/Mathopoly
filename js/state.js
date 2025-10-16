// js/state.js

// --- Game State Variables ---
export let players = [];
export let boardSpaces = [];
export let currentPlayerIndex = 0;
export let gameSettings = {
    startingMoney: 15000,
    passGoBonus: 2000,
    totalSpaces: 40,
};
export let currentDiceRoll = [0, 0];
export let currentQuestion = null;
export let onQuestionSuccess = null;
export let onQuestionFail = null;
export let isForcedToSell = false;
export let isGameStarted = false;
export let mathematicians = [];


// --- Setter Functions ---
export function setPlayers(newPlayers) { players = newPlayers; }
export function setBoardSpaces(newBoardSpaces) { boardSpaces = newBoardSpaces; }
export function setCurrentPlayerIndex(index) { currentPlayerIndex = index; }
export function setGameSetting(key, value) { gameSettings[key] = value; }
export function setCurrentDiceRoll(roll) { currentDiceRoll = roll; }
export function setCurrentQuestion(question) { currentQuestion = question; }
export function setOnQuestionSuccess(callback) { onQuestionSuccess = callback; }
export function setOnQuestionFail(callback) { onQuestionFail = callback; }
export function setForcedToSell(value) { isForcedToSell = value; }
export function setGameStarted(value) { isGameStarted = value; }
export function setMathematicians(data) { mathematicians = data; }