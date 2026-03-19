const boardElement = document.getElementById("maze-board");
const timeDisplay = document.getElementById("time-display");
const moveDisplay = document.getElementById("move-display");
const sizeDisplay = document.getElementById("size-display");
const messageBox = document.getElementById("message-box");
const newMazeButton = document.getElementById("new-maze-button");
const difficultyButtons = Array.from(document.querySelectorAll(".difficulty-button"));
const initialDifficultyButton = document.querySelector(".difficulty-button.is-active");

let mazeSize = Number(initialDifficultyButton?.dataset.size ?? 12);
let difficultyLabel = initialDifficultyButton?.dataset.label ?? "쉬움";
let visionRadius = Number(initialDifficultyButton?.dataset.vision ?? -1);
let cells = [];
let player = { row: 0, col: 0 };
let goal = { row: 0, col: 0 };
let moveCount = 0;
let timerId = null;
let startTime = 0;
let finished = false;

function createCell(row, col) {
  return {
    row,
    col,
    visited: false,
    walls: {
      top: true,
      right: true,
      bottom: true,
      left: true,
    },
  };
}

function initializeGrid(size) {
  cells = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => createCell(row, col))
  );
}

function getNeighbors(cell) {
  const deltas = [
    { key: "top", opposite: "bottom", row: -1, col: 0 },
    { key: "right", opposite: "left", row: 0, col: 1 },
    { key: "bottom", opposite: "top", row: 1, col: 0 },
    { key: "left", opposite: "right", row: 0, col: -1 },
  ];

  return deltas
    .map((delta) => {
      const nextRow = cell.row + delta.row;
      const nextCol = cell.col + delta.col;
      const neighbor = cells[nextRow]?.[nextCol];
      return neighbor ? { ...delta, neighbor } : null;
    })
    .filter(Boolean);
}

function shuffle(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateMaze(size) {
  initializeGrid(size);
  const stack = [];
  const startCell = cells[0][0];
  startCell.visited = true;
  stack.push(startCell);

  while (stack.length) {
    const current = stack[stack.length - 1];
    const unvisitedNeighbors = shuffle(getNeighbors(current)).filter(
      ({ neighbor }) => !neighbor.visited
    );

    if (!unvisitedNeighbors.length) {
      stack.pop();
      continue;
    }

    const next = unvisitedNeighbors[0];
    current.walls[next.key] = false;
    next.neighbor.walls[next.opposite] = false;
    next.neighbor.visited = true;
    stack.push(next.neighbor);
  }
}

function buildBoard() {
  boardElement.innerHTML = "";
  boardElement.style.gridTemplateColumns = `repeat(${mazeSize}, 1fr)`;

  for (let row = 0; row < mazeSize; row += 1) {
    for (let col = 0; col < mazeSize; col += 1) {
      const cell = cells[row][col];
      const cellElement = document.createElement("div");
      cellElement.className = "maze-cell";
      cellElement.dataset.row = String(row);
      cellElement.dataset.col = String(col);
      cellElement.style.borderTop = cell.walls.top ? "3px solid var(--maze-wall)" : "none";
      cellElement.style.borderRight = cell.walls.right ? "3px solid var(--maze-wall)" : "none";
      cellElement.style.borderBottom = cell.walls.bottom ? "3px solid var(--maze-wall)" : "none";
      cellElement.style.borderLeft = cell.walls.left ? "3px solid var(--maze-wall)" : "none";
      boardElement.appendChild(cellElement);
    }
  }

  refreshBoardState();
}

function refreshBoardState() {
  const allCells = boardElement.querySelectorAll(".maze-cell");
  allCells.forEach((element) => {
    element.classList.remove("start", "goal", "player", "is-hidden");
    const row = Number(element.dataset.row);
    const col = Number(element.dataset.col);
    const distanceFromPlayer = Math.abs(row - player.row) + Math.abs(col - player.col);
    const isHidden = visionRadius >= 0 && distanceFromPlayer > visionRadius;

    if (isHidden) {
      element.classList.add("is-hidden");
    }

    if (row === 0 && col === 0) {
      element.classList.add("start");
    }
    if (row === goal.row && col === goal.col) {
      element.classList.add("goal");
    }
    if (row === player.row && col === player.col) {
      element.classList.add("player");
    }
  });
}

function updateStats() {
  moveDisplay.textContent = String(moveCount);
  sizeDisplay.textContent = `${difficultyLabel} / ${mazeSize} x ${mazeSize}`;
}

function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function startTimer() {
  clearInterval(timerId);
  startTime = Date.now();
  timeDisplay.textContent = "00:00";
  timerId = window.setInterval(() => {
    timeDisplay.textContent = formatTime(Date.now() - startTime);
  }, 250);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function setMessage(text) {
  messageBox.textContent = text;
}

function resetGame() {
  player = { row: 0, col: 0 };
  goal = { row: mazeSize - 1, col: mazeSize - 1 };
  moveCount = 0;
  finished = false;
  refreshBoardState();
  updateStats();
  startTimer();
  if (visionRadius >= 0) {
    setMessage(`출발했습니다. ${difficultyLabel} 난이도에서는 주변 ${visionRadius}칸만 보입니다.`);
    return;
  }

  setMessage(`출발했습니다. ${difficultyLabel} 난이도에서 길을 찾아 도착점까지 이동하세요.`);
}

function createNewMaze() {
  generateMaze(mazeSize);
  buildBoard();
  resetGame();
}

function canMove(direction) {
  const currentCell = cells[player.row][player.col];
  return !currentCell.walls[direction];
}

function movePlayer(direction) {
  if (finished || !canMove(direction)) {
    return;
  }

  if (direction === "top") player.row -= 1;
  if (direction === "right") player.col += 1;
  if (direction === "bottom") player.row += 1;
  if (direction === "left") player.col -= 1;

  moveCount += 1;
  updateStats();
  refreshBoardState();

  if (player.row === goal.row && player.col === goal.col) {
    finished = true;
    stopTimer();
    const elapsed = formatTime(Date.now() - startTime);
    setMessage(`도착했습니다. 기록은 ${elapsed}, 이동 수는 ${moveCount}번입니다. 새 미로에 다시 도전해보세요.`);
  }
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();
  const directionByKey = {
    arrowup: "top",
    w: "top",
    arrowright: "right",
    d: "right",
    arrowdown: "bottom",
    s: "bottom",
    arrowleft: "left",
    a: "left",
  };

  const direction = directionByKey[key];
  if (!direction) {
    return;
  }

  event.preventDefault();
  movePlayer(direction);
}

function handleDifficultyClick(event) {
  const button = event.currentTarget;
  const nextSize = Number(button.dataset.size);
  const nextVisionRadius = Number(button.dataset.vision ?? -1);
  const nextLabel = button.dataset.label ?? "사용자 설정";
  if (nextSize === mazeSize && nextVisionRadius === visionRadius && nextLabel === difficultyLabel) {
    return;
  }

  mazeSize = nextSize;
  visionRadius = nextVisionRadius;
  difficultyLabel = nextLabel;
  difficultyButtons.forEach((item) => item.classList.remove("is-active"));
  button.classList.add("is-active");
  createNewMaze();
}

difficultyButtons.forEach((button) => {
  button.addEventListener("click", handleDifficultyClick);
});

newMazeButton.addEventListener("click", createNewMaze);
window.addEventListener("keydown", handleKeydown);

createNewMaze();
