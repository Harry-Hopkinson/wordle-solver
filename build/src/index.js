"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validSolutions_1 = require("/workspace/wordle-solver/src/validSolutions");
const LETTER_FREQUENCIES = (() => {
    const frequences = {};
    for (const word of validSolutions_1.VALID_SOLUTIONS) {
        for (const char of word.toLowerCase().split("")) {
            if (!frequences[char]) {
                frequences[char] = 0;
            }
            frequences[char]++;
        }
    }
    return frequences;
})();
const VARIANT = window.location.host === 'qntm.org' ? 'absurdle' : 'wordle';
const replaceAt = (str, index, replacement) => {
    return (str.substring(0, index) +
        replacement +
        str.substring(index + replacement.length));
};
const getNextGuess = (gameState) => {
    const bestGuess = { score: 0, word: null };
    const bestGuessWithoutRepeatingLetters = { score: 0, word: null };
    wordLoop: for (let option of validSolutions_1.VALID_SOLUTIONS) {
        option = option.toLowerCase();
        for (const guess of gameState.guesses) {
            let optionWithBlanks = option;
            for (let i = 0; i < guess.letters.length; i++) {
                const letter = guess.letters[i];
                if (letter.evaluation === 'correct' && option[i] !== letter.letter) {
                    continue wordLoop;
                }
                if (letter.evaluation === 'present' && !option.includes(letter.letter)) {
                    continue wordLoop;
                }
                if (letter.evaluation === 'present' && option[i] === letter.letter) {
                    continue wordLoop;
                }
                if (letter.evaluation === 'correct') {
                    optionWithBlanks = replaceAt(optionWithBlanks, i, '_');
                }
                else if (letter.evaluation === 'present') {
                    const indexOfLetter = optionWithBlanks.indexOf(letter.letter);
                    if (indexOfLetter !== -1) {
                        optionWithBlanks = replaceAt(optionWithBlanks, indexOfLetter, '_');
                    }
                }
            }
            for (let i = 0; i < guess.letters.length; i++) {
                const letter = guess.letters[i];
                if (letter.evaluation === 'absent' && optionWithBlanks.includes(letter.letter)) {
                    continue wordLoop;
                }
            }
        }
        let wordScore = 0;
        for (const char of option.split('')) {
            wordScore += LETTER_FREQUENCIES[char];
        }
        if (wordScore > bestGuess.score) {
            bestGuess.score = wordScore;
            bestGuess.word = option;
        }
        const wordHasNoRepeatingLetters = new Set(option).size === option.length;
        if (wordHasNoRepeatingLetters && wordScore > bestGuessWithoutRepeatingLetters.score) {
            bestGuessWithoutRepeatingLetters.score = wordScore;
            bestGuessWithoutRepeatingLetters.word = option;
        }
    }
    return bestGuessWithoutRepeatingLetters.word || bestGuess.word;
};
const getWordleGameState = () => {
    const gameRows = Array.from(document.querySelector('game-app').shadowRoot.querySelectorAll('game-row'));
    const guesses = gameRows.map((row) => {
        const gameTiles = Array.from(row.shadowRoot.querySelectorAll('game-tile'));
        const letters = gameTiles.map((tile) => {
            var _a;
            return {
                letter: (_a = tile.getAttribute('letter')) === null || _a === void 0 ? void 0 : _a.toLowerCase(),
                evaluation: tile.getAttribute('evaluation'),
            };
        });
        return { letters };
    });
    const nonEmptyGuesses = guesses.filter((guess) => guess.letters.every((l) => l.evaluation));
    return { guesses: nonEmptyGuesses };
};
const getAbsurdleGameState = () => {
    const gameRows = Array.from(document.querySelectorAll('table.absurdle__guess-table tr'));
    const guesses = gameRows.map((row) => {
        const gameTiles = Array.from(row.querySelectorAll('td'));
        const letters = gameTiles.map((tile) => {
            let evaluation;
            if (tile.classList.contains('absurdle__guess-box--inexact')) {
                evaluation = 'present';
            }
            else if (tile.classList.contains('absurdle__guess-box--exact')) {
                evaluation = 'correct';
            }
            else if (tile.classList.contains('absurdle__guess-box--wrong')) {
                evaluation = 'absent';
            }
            else {
                evaluation = null;
            }
            return {
                letter: tile.innerText.toLowerCase().trim(),
                evaluation,
            };
        });
        return { letters };
    });
    const nonEmptyGuesses = guesses.filter((guess) => guess.letters.every((l) => l.evaluation));
    return { guesses: nonEmptyGuesses };
};
const getGameState = () => {
    if (VARIANT === 'wordle') {
        return getWordleGameState();
    }
    else {
        return getAbsurdleGameState();
    }
};
const playGame = async () => {
    const asyncTimeout = (timeout) => new Promise((resolve) => setTimeout(() => resolve(), timeout));
    for (let i = 0; i < 7; i++) {
        const gameState = getGameState();
        const lastGuess = gameState.guesses[gameState.guesses.length - 1];
        if (lastGuess && lastGuess.letters.every((l) => l.evaluation === 'correct')) {
            console.log('Solved!');
            return;
        }
        const guess = getNextGuess(gameState);
        console.log(`Guessing "${guess}"...`);
        const objectToDispatch = VARIANT === 'absurdle' ? document : window;
        for (const char of guess.split('')) {
            objectToDispatch.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
            await asyncTimeout(10);
        }
        if (VARIANT === 'absurdle') {
            const enterButton = Array.from(document.querySelectorAll('button.absurdle__button')).find((btn) => btn.innerText.toLowerCase().trim() === 'enter');
            enterButton.click();
        }
        else {
            objectToDispatch.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        }
        await asyncTimeout(VARIANT === 'absurdle' ? 100 : 2200);
    }
    console.log('Failed!');
};
playGame();
