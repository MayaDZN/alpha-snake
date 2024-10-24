const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const wordDisplay = document.getElementById("word-display");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const streakDisplay = document.getElementById("streak");

// Game constants
const GRID_SIZE = 20;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Game variables
let snake = [{ x: 10, y: 10 }];
let direction = { x: 0, y: 0 };
let foods = [];
let score = 0;
let currentWord = "";
let missingLetter = "";
let gameLoopId = null;
let streak = 0;
let gameSpeed = 100; // Initial game speed

// Word database
const wordDatabase = {
  easy: ["CAT", "DOG", "RUN", "JUMP", "PLAY"],
  medium: ["HOUSE", "SNAKE", "APPLE", "BOOK", "GAME"],
  hard: ["COMPLEX", "DIFFICULT", "CHALLENGE", "ADVANCED", "EXPERT"]
};

let currentDifficulty = "medium";

let highScore = localStorage.getItem("highScore") || 0;

// Add new variables for sounds
const backgroundMusic = new Audio("assets/sfx/space-background-music.mp3");
const collectSound = new Audio("assets/sfx/collect-sound.mp3");
const wrongSound = new Audio("assets/sfx/wrong-sound.mp3");
const gameOverSound = new Audio("assets/sfx/game-over-sound.mp3");

// Add new variables for screens
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const finalScore = document.getElementById("final-score");
const finalHighScore = document.getElementById("final-high-score");

function startGame() {
  // Clear any existing game loops
  if (gameLoopId) {
    clearTimeout(gameLoopId);
    gameLoopId = null;
  }

  snake = [
    { x: 200, y: 200 },
    { x: 180, y: 200 },
    { x: 160, y: 200 }
  ];
  direction = { x: 1, y: 0 };
  score = 0;
  streak = 0;
  updateStreak();

  generateNewWord();
  spawnFoods();
  scoreDisplay.textContent = score;
  updateHighScore();

  // Set game speed based on difficulty
  switch (currentDifficulty) {
    case "easy":
      gameSpeed = 120;
      break;
    case "medium":
      gameSpeed = 100;
      break;
    case "hard":
      gameSpeed = 80;
      break;
  }

  // Hide start screen and show game screen
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  gameOverScreen.classList.add("hidden");

  // Start background music
  backgroundMusic.loop = true;
  backgroundMusic.play();

  // Start a new game loop
  gameLoop();

  updateDifficultyButtons(); // Add this line
}

function generateNewWord() {
  const wordList = wordDatabase[currentDifficulty];
  console.log({ currentDifficulty });
  currentWord = wordList[Math.floor(Math.random() * wordList.length)];
  const missingIndex = Math.floor(Math.random() * currentWord.length);
  missingLetter = currentWord[missingIndex];
  const displayWord = currentWord
    .split("")
    .map((letter, index) => (index === missingIndex ? "_" : letter))
    .join("");
  wordDisplay.textContent = displayWord;
}

function spawnFoods() {
  foods = [];
  const letters = [missingLetter];
  while (letters.length < 3) {
    const randomLetter = String.fromCharCode(
      65 + Math.floor(Math.random() * 26)
    );
    if (!letters.includes(randomLetter)) letters.push(randomLetter);
  }

  for (let i = 0; i < 3; i++) {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)) * GRID_SIZE,
        y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)) * GRID_SIZE,
        letter: letters[i]
      };
    } while (
      foods.some((food) => food.x === newFood.x && food.y === newFood.y) ||
      snake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      )
    );
    foods.push(newFood);
  }
}

function gameLoop() {
  update();
  draw();
  gameLoopId = setTimeout(() => {
    requestAnimationFrame(gameLoop);
  }, gameSpeed);
}

function update() {
  const head = {
    x: snake[0].x + direction.x * GRID_SIZE,
    y: snake[0].y + direction.y * GRID_SIZE
  };

  // Wrap the snake around the canvas
  head.x = (head.x + CANVAS_WIDTH) % CANVAS_WIDTH;
  head.y = (head.y + CANVAS_HEIGHT) % CANVAS_HEIGHT;

  snake.unshift(head);

  const eatenFoodIndex = foods.findIndex(
    (food) => food.x === head.x && food.y === head.y
  );
  if (eatenFoodIndex !== -1) {
    const eatenFood = foods[eatenFoodIndex];
    foods.splice(eatenFoodIndex, 1); // Remove the eaten food

    if (eatenFood.letter === missingLetter) {
      stopSounds();
      collectSound.play();
      score += 10;
      streak++;
      updateStreak();
      generateNewWord();
      spawnFoods();
    } else {
      stopSounds();
      wrongSound.play();
      snake.pop(); // Remove the last segment for incorrect letters
      snake.pop(); // Remove one more segment to make the snake smaller
      score = Math.max(0, score - 5); // Decrease score, but not below 0
      streak = 0;
      updateStreak();
      if (snake.length < 3) {
        // Game over if snake length becomes less than 3
        endGame();
        return;
      }
      // Instead of respawning foods, just add the eaten food back
      foods.push(eatenFood);
    }
    scoreDisplay.textContent = score;
  } else {
    snake.pop();
  }

  // Check for self-collision
  if (checkSelfCollision()) {
    endGame();
  }
}

function checkSelfCollision() {
  return snake
    .slice(1)
    .some((segment) => segment.x === snake[0].x && segment.y === snake[0].y);
}

function draw() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw twinkling stars
  ctx.fillStyle = "white";
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * CANVAS_WIDTH;
    const y = Math.random() * CANVAS_HEIGHT;
    const size = Math.random() * 2;
    const opacity = Math.random();
    ctx.globalAlpha = opacity;
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1;

  // Draw snake
  ctx.fillStyle = "#0ff";
  snake.forEach((segment, index) => {
    const size = GRID_SIZE - index * 0.15; // Make the snake taper
    ctx.fillRect(
      segment.x + (GRID_SIZE - size) / 2,
      segment.y + (GRID_SIZE - size) / 2,
      size,
      size
    );
  });

  // Draw food as planets/asteroids
  foods.forEach((food) => {
    const gradient = ctx.createRadialGradient(
      food.x + GRID_SIZE / 2,
      food.y + GRID_SIZE / 2,
      0,
      food.x + GRID_SIZE / 2,
      food.y + GRID_SIZE / 2,
      GRID_SIZE / 2
    );
    gradient.addColorStop(0, "#f00"); // All fruits are now red
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(
      food.x + GRID_SIZE / 2,
      food.y + GRID_SIZE / 2,
      GRID_SIZE / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "12px Orbitron";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(food.letter, food.x + GRID_SIZE / 2, food.y + GRID_SIZE / 2);
  });
}

function endGame() {
  // Clear the current game loop
  if (gameLoopId) {
    clearTimeout(gameLoopId);
    gameLoopId = null;
  }

  // Stop background music and play game over sound
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
  stopSounds();
  gameOverSound.play();

  updateHighScore();

  // Show game over screen
  gameScreen.classList.add("hidden");
  gameOverScreen.classList.remove("hidden");
  finalScore.textContent = score;
  finalHighScore.textContent = highScore;
}

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp":
      if (direction.y === 0) direction = { x: 0, y: -1 };
      break;
    case "ArrowDown":
      if (direction.y === 0) direction = { x: 0, y: 1 };
      break;
    case "ArrowLeft":
      if (direction.x === 0) direction = { x: -1, y: 0 };
      break;
    case "ArrowRight":
      if (direction.x === 0) direction = { x: 1, y: 0 };
      break;
  }
});

// Initial game start
startGame();

// Add a function to change difficulty
function changeDifficulty(difficulty) {
  currentDifficulty = difficulty;
  updateDifficultyButtons(); // Add this line
  startGame();
  console.log(`Difficulty changed to: ${currentDifficulty}`);
}

function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
  highScoreDisplay.textContent = highScore;
}

function updateStreak() {
  streakDisplay.textContent = streak;
}

// Add this function
function updateDifficultyButtons() {
  const buttons = document.querySelectorAll(".difficulty-buttons button");
  buttons.forEach((button) => {
    if (button.textContent.toLowerCase() === currentDifficulty) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

// Call this when the page loads
document.addEventListener("DOMContentLoaded", updateDifficultyButtons);

// Add event listeners for start and restart buttons
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

// Initial setup
updateHighScore();
updateDifficultyButtons();

// Add this function to stop all sounds except background music
function stopSounds() {
  collectSound.pause();
  collectSound.currentTime = 0;
  wrongSound.pause();
  wrongSound.currentTime = 0;
  gameOverSound.pause();
  gameOverSound.currentTime = 0;
}
