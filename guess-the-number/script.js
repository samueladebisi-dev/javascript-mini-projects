const input = document.querySelector("input");
const submit = document.querySelector(".submit");
const startGame = document.querySelector(".startGame");
const range = document.querySelector(".range");
const result = document.querySelector(".result");

const MIN = 1;
const MAX = 100;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let guesses = [];
let target = getRandomInt(MIN, MAX);

function showResult() {
    const guess = parseInt(input.value, 10);
    if (Number.isNaN(guess) || guess < MIN || guess > MAX) {
        range.textContent = `Please enter a number between ${MIN} and ${MAX}`;
        return;
    }

    guesses.push(guess);
    if (guess > target) {
        range.textContent = "Too High !";
    } else if (guess < target) {
        range.textContent = "Too Low !";
    } else {
        range.textContent = `Congrats! You guessed it after ${guesses.length} attempts`;
        submit.setAttribute("disabled", true);
        startGame.removeAttribute("disabled");
    }
    result.textContent = `Your guesses: ${guesses.join(", ")}`;
}

submit.addEventListener("click", showResult);

startGame.addEventListener("click", function () {
    target = getRandomInt(MIN, MAX);
    guesses = [];
    input.value = "";
    range.textContent = "";
    result.textContent = "";
    submit.removeAttribute("disabled");
    startGame.setAttribute("disabled", true);
});
