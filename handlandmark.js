const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const ballRadius = 10;

let x = canvas.width / 2;
let y = canvas.height - 30;

// PERBAIKAN 1: Kecepatan bola diturunkan
let dx = 2;
let dy = -2;

const paddleHeight = 15;
const paddleWidth = 100;

let paddleX = (canvas.width - paddleWidth) / 2;

let interval = 0;

const brickRowCount = 5;
const brickColumnCount = 7;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

let score = 0;
let bricks = [];

for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[c][r] = { x: 0, y: 0, status: 1 };
  }
}

function mouseMoveHandler(e) {
  const relativeX = e * canvas.width;
  if (
    relativeX > paddleWidth / 2 &&
    relativeX < canvas.width - paddleWidth / 2
  ) {
    paddleX = relativeX - paddleWidth / 2;
  }
}

function showWinPopup() {
  clearInterval(interval);
  const winPopup = document.getElementById("win-popup");
  winPopup.style.display = "flex";
  document.getElementById("play-again-btn").addEventListener("click", () => {
    document.location.reload();
  });
}

// PERBAIKAN 2: Membuat fungsi popup untuk Game Over
function showGameOverPopup() {
  clearInterval(interval); // Hentikan bola
  const gameOverPopup = document.getElementById("game-over-popup");
  gameOverPopup.style.display = "flex"; // Tampilkan popup
  document.getElementById("try-again-btn").addEventListener("click", () => {
    document.location.reload();
  });
}

function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      let b = bricks[c][r];
      if (b.status == 1) {
        if (
          x > b.x &&
          x < b.x + brickWidth &&
          y > b.y &&
          y < b.y + brickHeight
        ) {
          dy = -dy;
          b.status = 0;
          score++;
          if (score == brickRowCount * brickColumnCount) {
            showWinPopup();
          }
        }
      }
    }
  }
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#3b82f6";
  ctx.fill();
  ctx.closePath();
}
function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#818cf8";
  ctx.fill();
  ctx.closePath();
}
function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status == 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = "#1e3a8a";
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}
function drawScore() {
  ctx.font = "16px Poppins";
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText("Score: " + score, 8, 20);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  collisionDetection();

  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
    dx = -dx;
  }
  if (y + dy < ballRadius) {
    dy = -dy;
  } else if (y + dy > canvas.height - ballRadius) {
    if (x > paddleX && x < paddleX + paddleWidth) {
      dy = -dy;
    } else {
      // Ganti alert dengan popup baru
      showGameOverPopup();
    }
  }

  x += dx;
  y += dy;
}

function startGame() {
  if (interval === 0) {
    interval = setInterval(draw, 10);
  }
}

// ==========================================================================================
// KODE MEDIAPIPE
// ==========================================================================================
const video3 = document.getElementsByClassName("input_video3")[0];
const out3 = document.getElementsByClassName("output3")[0];
const canvasCtx3 = out3.getContext("2d");
let xPosition;
let startAcum = 0;

function onResultsHands(results) {
  if (!document.body.classList.contains("loaded")) {
    document.body.classList.add("loaded");
  }

  canvasCtx3.save();
  canvasCtx3.clearRect(0, 0, out3.width, out3.height);
  canvasCtx3.drawImage(results.image, 0, 0, out3.width, out3.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    const handLm = [];
    const params = [8, 12, 16, 20];

    for (let i = 0; i < params.length; i++) {
      if (landmarks[params[i]].y < landmarks[params[i] - 2].y) {
        handLm.push(1);
      } else {
        handLm.push(0);
      }
    }

    // PERBAIKAN 3: Mengembalikan ke logika original untuk mengatasi kontrol terbalik
    xPosition = landmarks[8].x;

    drawLandmarks(canvasCtx3, landmarks, {});

    let newX = Math.floor(xPosition * 100) * 0.01;

    switch (JSON.stringify(handLm)) {
      case "[1,0,0,0]":
        mouseMoveHandler(newX);
        break;
      case "[1,1,0,0]":
        if (startAcum == 0) {
          startGame();
          startAcum = 1;
        }
        break;
      case "[1,1,1,0]":
        if (startAcum === 1) {
          location.reload();
        }
        break;
    }
  }
  canvasCtx3.restore();
}

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.1/${file}`;
  },
});

hands.setOptions({
  selfieMode: true,
  maxNumHands: 1,
  minDetectionConfidence: 0.8,
  minTrackingConfidence: 0.8,
});
hands.onResults(onResultsHands);

const camera = new Camera(video3, {
  onFrame: async () => {
    await hands.send({ image: video3 });
  },
  width: 720,
  height: 480,
});

camera.start();
