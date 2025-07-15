const firebaseConfig = {
  apiKey: "AIzaSyAgfyDjNWeXYDE4dWBJrW530hjxJNMfCLU",
  authDomain: "tictoc-game-26789.firebaseapp.com",
  projectId: "tictoc-game-26789",
  storageBucket: "tictoc-game-26789.firebasestorage.app",
  messagingSenderId: "395508950503",
  appId: "1:395508950503:web:7a926029691cd0247b8942"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let board = Array(9).fill("");
let mySymbol = "X";
let isMyTurn = true;
let gameId = "";
let gameMode = "offline";
let playerNames = { X: "Player X", O: "Player O" };
const cells = document.querySelectorAll(".cell");
const status = document.getElementById("status");

function playSound(id) {
  document.getElementById(id).play();
}

function startGame() {
  board = Array(9).fill("");
  updateBoard();

  gameMode = document.getElementById("mode").value;
  gameId = document.getElementById("gameCode").value.trim();
  const nameX = document.getElementById("playerX").value.trim();
  const nameO = document.getElementById("playerO").value.trim();
  if (nameX) playerNames.X = nameX;
  if (nameO) playerNames.O = nameO;

  document.getElementById("win-line").style.display = "none";

  if (gameMode === "offline") {
    mySymbol = "X";
    isMyTurn = true;
    status.textContent = `${playerNames.X}'s turn (X)`;
  } else {
    if (!gameId) return alert("Enter game code for online mode.");

    db.ref(`games/${gameId}`).once("value").then(snapshot => {
      const data = snapshot.val();
      if (!data) {
        mySymbol = "X";
        isMyTurn = true;
        db.ref(`games/${gameId}`).set({ board, turn: "X", players: { X: nameX, O: "" } });
      } else if (!data.players?.O) {
        mySymbol = "O";
        isMyTurn = false;
        db.ref(`games/${gameId}/players`).update({ O: nameO });
      } else {
        return alert("Game full.");
      }

      listenToGame();
    });
  }
}

function listenToGame() {
  db.ref(`games/${gameId}`).on("value", snapshot => {
    const data = snapshot.val();
    if (!data) return;
    board = data.board;
    updateBoard();
    const turn = data.turn;
    isMyTurn = (turn === mySymbol);

    const winner = checkWinner();
    if (winner) {
      playSound("winSound");
      status.textContent = `${playerNames[winner]} wins!`;
    } else if (!board.includes("")) {
      status.textContent = "Draw!";
    } else {
      const turnName = playerNames[turn] || `Player ${turn}`;
      status.textContent = `${turnName}'s turn (${turn})`;
    }
  });
}

function updateBoard() {
  cells.forEach((cell, i) => {
    cell.textContent = board[i];
  });
}

cells.forEach(cell => {
  cell.addEventListener("click", () => {
    const i = cell.getAttribute("data-id");
    if (board[i] !== "") return;
    if (gameMode === "online" && !isMyTurn) return;

    board[i] = mySymbol;
    playSound("clickSound");

    const nextTurn = mySymbol === "X" ? "O" : "X";

    if (gameMode === "online") {
      db.ref(`games/${gameId}`).update({ board, turn: nextTurn });
    } else {
      updateBoard();
      const winner = checkWinner();
      if (winner) {
        playSound("winSound");
        status.textContent = `${playerNames[winner]} wins!`;
      } else if (!board.includes("")) {
        status.textContent = "Draw!";
      } else {
        mySymbol = nextTurn;
        status.textContent = `${playerNames[mySymbol]}'s turn (${mySymbol})`;
      }
    }
  });
});

function restartGame() {
  board = Array(9).fill("");
  updateBoard();
  document.getElementById("win-line").style.display = "none";
  if (gameMode === "online") {
    db.ref(`games/${gameId}`).update({ board, turn: "X" });
  } else {
    mySymbol = "X";
    isMyTurn = true;
    status.textContent = `${playerNames.X}'s turn (X)`;
  }
}

function checkWinner() {
  const wins = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];
  for (let i = 0; i < wins.length; i++) {
    const [a, b, c] = wins[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      showWinLine(a, c);
      return board[a];
    }
  }
  return null;
}

function showWinLine(a, c) {
  const winLine = document.getElementById("win-line");

  const cellA = document.querySelector(`.cell[data-id="${a}"]`);
  const cellC = document.querySelector(`.cell[data-id="${c}"]`);
  const boardRect = document.getElementById("board").getBoundingClientRect();

  const aRect = cellA.getBoundingClientRect();
  const cRect = cellC.getBoundingClientRect();

  // Center of cell A
  const x1 = aRect.left + aRect.width / 2 - boardRect.left;
  const y1 = aRect.top + aRect.height / 2 - boardRect.top;

  // Center of cell C
  const x2 = cRect.left + cRect.width / 2 - boardRect.left;
  const y2 = cRect.top + cRect.height / 2 - boardRect.top;

  // Distance and angle
  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

  // Apply styles
  winLine.style.width = `${length}px`;
  winLine.style.top = `${y1}px`;
  winLine.style.left = `${x1}px`;
  winLine.style.transform = `rotate(${angle}deg)`;
  winLine.style.display = "block";
}
function changeTheme() {
  const theme = document.getElementById("theme").value;
  document.body.className = theme;
}
