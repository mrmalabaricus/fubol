const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const winEl = document.getElementById("win");

const field = {
  width: canvas.width,
  height: canvas.height,
  goalWidth: 140,
  goalDepth: 20,
  center: { x: canvas.width / 2, y: canvas.height / 2 },
};

const assets = {
  field: "assets/field_bg.png",
  playerBlue: "assets/player_blue_sprite.png",
  playerRed: "assets/player_red_sprite.png",
  goalieBlue: "assets/goalkeeper_blue.png",
  goalieRed: "assets/goalkeeper_red.png",
  ball: "assets/ball.png",
  aimLine: "assets/aim_line.png",
  powerBar: "assets/power_bar.png",
};

const state = {
  turn: 0,
  selected: null,
  dragging: false,
  dragStart: null,
  dragCurrent: null,
  scores: [0, 0],
  winner: null,
  turnInProgress: false,
};

const physics = {
  friction: 0.985,
  minSpeed: 0.12,
  maxPower: 12,
};

const teams = [
  {
    name: "Equipo Azul",
    color: "#4aa3ff",
    goalX: 0,
    direction: 1,
    players: [],
    goalie: null,
  },
  {
    name: "Equipo Rojo",
    color: "#ff5b5b",
    goalX: field.width,
    direction: -1,
    players: [],
    goalie: null,
  },
];

const ball = {
  x: field.center.x,
  y: field.center.y,
  radius: 12,
  vx: 0,
  vy: 0,
};

function createPlayer(teamIndex, x, y, isGoalie = false) {
  return {
    team: teamIndex,
    x,
    y,
    radius: isGoalie ? 20 : 18,
    vx: 0,
    vy: 0,
    isGoalie,
  };
}

function setupPlayers() {
  const spacingY = 90;
  const startY = field.center.y - spacingY * 1.5;
  const offsetX = 180;

  teams[0].players = Array.from({ length: 4 }, (_, i) =>
    createPlayer(0, offsetX, startY + spacingY * i)
  );
  teams[1].players = Array.from({ length: 4 }, (_, i) =>
    createPlayer(1, field.width - offsetX, startY + spacingY * i)
  );

  teams[0].goalie = createPlayer(0, 60, field.center.y, true);
  teams[1].goalie = createPlayer(1, field.width - 60, field.center.y, true);
}

function resetPositions(scoringTeam) {
  ball.x = field.center.x;
  ball.y = field.center.y;
  ball.vx = 0;
  ball.vy = 0;

  const offsetX = 180;
  teams[0].players.forEach((player, i) => {
    player.x = offsetX;
    player.y = field.center.y - 135 + i * 90;
    player.vx = 0;
    player.vy = 0;
  });
  teams[1].players.forEach((player, i) => {
    player.x = field.width - offsetX;
    player.y = field.center.y - 135 + i * 90;
    player.vx = 0;
    player.vy = 0;
  });

  teams[0].goalie.x = 60;
  teams[0].goalie.y = field.center.y;
  teams[0].goalie.vx = 0;
  teams[0].goalie.vy = 0;
  teams[1].goalie.x = field.width - 60;
  teams[1].goalie.y = field.center.y;
  teams[1].goalie.vx = 0;
  teams[1].goalie.vy = 0;

  state.selected = null;
  state.dragging = false;
  state.turnInProgress = false;
  state.turn = scoringTeam === null ? state.turn : scoringTeam === 0 ? 1 : 0;
  updateStatus();
}

function updateStatus() {
  const team = teams[state.turn];
  statusEl.textContent = `Turno: ${team.name}`;
}

function setWinner() {
  const diff = Math.abs(state.scores[0] - state.scores[1]);
  if (diff >= 3) {
    const winnerIndex = state.scores[0] > state.scores[1] ? 0 : 1;
    state.winner = winnerIndex;
    winEl.textContent = `${teams[winnerIndex].name} gana por 3 goles de diferencia.`;
  } else {
    winEl.textContent = "";
  }
}

function drawField() {
  ctx.clearRect(0, 0, field.width, field.height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.strokeRect(30, 30, field.width - 60, field.height - 60);

  ctx.beginPath();
  ctx.arc(field.center.x, field.center.y, 70, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(field.center.x, 30);
  ctx.lineTo(field.center.x, field.height - 30);
  ctx.stroke();

  drawGoal(0);
  drawGoal(1);
}

function drawGoal(teamIndex) {
  const goalY = field.center.y - field.goalWidth / 2;
  const x = teamIndex === 0 ? 30 - field.goalDepth : field.width - 30;
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.fillRect(x, goalY, field.goalDepth, field.goalWidth);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.strokeRect(x, goalY, field.goalDepth, field.goalWidth);
}

function drawPlayer(player) {
  ctx.beginPath();
  ctx.fillStyle = player.isGoalie
    ? "#ffd66b"
    : teams[player.team].color;
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = player === state.selected ? "#ffffff" : "rgba(0,0,0,0.2)";
  ctx.stroke();
}

function drawBall() {
  ctx.beginPath();
  ctx.fillStyle = "#f7f7f7";
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.stroke();
}

function drawAimGuide() {
  if (!state.dragging || !state.selected || !state.dragStart || !state.dragCurrent) {
    return;
  }
  const dx = state.dragCurrent.x - state.dragStart.x;
  const dy = state.dragCurrent.y - state.dragStart.y;
  const distance = Math.min(Math.hypot(dx, dy), 120);
  const angle = Math.atan2(dy, dx) + Math.PI;

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(state.dragStart.x, state.dragStart.y);
  ctx.lineTo(
    state.dragStart.x + Math.cos(angle) * distance,
    state.dragStart.y + Math.sin(angle) * distance
  );
  ctx.stroke();
  ctx.restore();

  const power = Math.min(distance / 120, 1);
  const barWidth = 140;
  const barHeight = 12;
  const barX = state.dragStart.x - barWidth / 2;
  const barY = state.dragStart.y - 36;

  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.fillStyle = `rgba(255, ${Math.round(160 + power * 80)}, 80, 0.9)`;
  ctx.fillRect(barX, barY, barWidth * power, barHeight);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.strokeRect(barX, barY, barWidth, barHeight);
}

function draw() {
  drawField();
  teams.forEach((team) => team.players.forEach(drawPlayer));
  teams.forEach((team) => drawPlayer(team.goalie));
  drawBall();
  drawAimGuide();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateGoalie(goalie) {
  const areaTop = field.center.y - field.goalWidth / 2 + 10;
  const areaBottom = field.center.y + field.goalWidth / 2 - 10;
  const targetY = clamp(ball.y, areaTop, areaBottom);
  goalie.y += (targetY - goalie.y) * 0.05;

  const minX = goalie.team === 0 ? 40 : field.width - 80;
  const maxX = goalie.team === 0 ? 90 : field.width - 40;
  goalie.x = clamp(goalie.x, minX, maxX);
}

function applyPhysics() {
  const entities = [
    ball,
    ...teams[0].players,
    ...teams[1].players,
    teams[0].goalie,
    teams[1].goalie,
  ];

  entities.forEach((entity) => {
    entity.x += entity.vx;
    entity.y += entity.vy;
    entity.vx *= physics.friction;
    entity.vy *= physics.friction;

    if (Math.abs(entity.vx) < physics.minSpeed) entity.vx = 0;
    if (Math.abs(entity.vy) < physics.minSpeed) entity.vy = 0;

    if (entity !== ball) {
      const padding = 30;
      entity.x = clamp(entity.x, padding, field.width - padding);
      entity.y = clamp(entity.y, padding, field.height - padding);
    }
  });

  keepBallInBounds();
  handleCollisions();
  teams.forEach((team) => updateGoalie(team.goalie));
}

function keepBallInBounds() {
  const goalTop = field.center.y - field.goalWidth / 2;
  const goalBottom = field.center.y + field.goalWidth / 2;
  if (ball.y - ball.radius < 30 || ball.y + ball.radius > field.height - 30) {
    ball.vy *= -0.8;
    ball.y = clamp(ball.y, 30 + ball.radius, field.height - 30 - ball.radius);
  }

  if (ball.x - ball.radius < 30) {
    if (ball.y > goalTop && ball.y < goalBottom) {
      score(1);
    } else {
      ball.vx *= -0.8;
      ball.x = 30 + ball.radius;
    }
  }

  if (ball.x + ball.radius > field.width - 30) {
    if (ball.y > goalTop && ball.y < goalBottom) {
      score(0);
    } else {
      ball.vx *= -0.8;
      ball.x = field.width - 30 - ball.radius;
    }
  }
}

function handleCollisions() {
  const entities = [
    ...teams[0].players,
    ...teams[1].players,
    teams[0].goalie,
    teams[1].goalie,
  ];

  handlePlayerCollisions(entities);

  entities.forEach((player) => {
    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const distance = Math.hypot(dx, dy);
    const minDistance = ball.radius + player.radius;
    if (distance > 0 && distance < minDistance) {
      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = minDistance - distance;
      ball.x += nx * overlap;
      ball.y += ny * overlap;
      const kickPower = 0.6 + (player.isGoalie ? 0.4 : 0.2);
      ball.vx += nx * kickPower * 10;
      ball.vy += ny * kickPower * 10;
    }
  });
}

function handlePlayerCollisions(entities) {
  for (let i = 0; i < entities.length; i += 1) {
    for (let j = i + 1; j < entities.length; j += 1) {
      const a = entities[i];
      const b = entities[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy);
      const minDistance = a.radius + b.radius;
      if (distance > 0 && distance < minDistance) {
        const nx = dx / distance;
        const ny = dy / distance;
        const overlap = minDistance - distance;
        const totalMass = a.radius + b.radius;
        const aShare = b.radius / totalMass;
        const bShare = a.radius / totalMass;

        a.x -= nx * overlap * aShare;
        a.y -= ny * overlap * aShare;
        b.x += nx * overlap * bShare;
        b.y += ny * overlap * bShare;

        const relativeVx = a.vx - b.vx;
        const relativeVy = a.vy - b.vy;
        const velocityAlongNormal = relativeVx * nx + relativeVy * ny;
        if (velocityAlongNormal > 0) {
          continue;
        }
        const restitution = 0.85;
        const impulse =
          (-(1 + restitution) * velocityAlongNormal) /
          (1 / a.radius + 1 / b.radius);
        const impulseX = impulse * nx;
        const impulseY = impulse * ny;

        a.vx += impulseX / a.radius;
        a.vy += impulseY / a.radius;
        b.vx -= impulseX / b.radius;
        b.vy -= impulseY / b.radius;
      }
    }
  }
}

function score(teamIndex) {
  state.scores[teamIndex] += 1;
  scoreEl.textContent = `${state.scores[0]} - ${state.scores[1]}`;
  setWinner();
  resetPositions(teamIndex);
}

function allStopped() {
  const entities = [
    ball,
    ...teams[0].players,
    ...teams[1].players,
    teams[0].goalie,
    teams[1].goalie,
  ];
  return entities.every((entity) => entity.vx === 0 && entity.vy === 0);
}

function nextTurn() {
  if (state.winner !== null) {
    return;
  }
  state.turn = state.turn === 0 ? 1 : 0;
  state.selected = null;
  updateStatus();
}

function update() {
  if (!state.winner) {
    applyPhysics();
  }

  if (!state.dragging && allStopped() && state.turnInProgress) {
    nextTurn();
    state.turnInProgress = false;
  }

  draw();
  requestAnimationFrame(update);
}

function getMousePos(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function selectPlayerAt(pos) {
  const candidates = teams[state.turn].players;
  const hit = candidates.find(
    (player) => Math.hypot(player.x - pos.x, player.y - pos.y) <= player.radius
  );
  state.selected = hit || null;
}

canvas.addEventListener("pointerdown", (event) => {
  if (state.winner) return;
  if (!allStopped()) return;
  const pos = getMousePos(event);
  selectPlayerAt(pos);
  if (state.selected) {
    canvas.setPointerCapture(event.pointerId);
    state.dragging = true;
    state.dragStart = { x: state.selected.x, y: state.selected.y };
    state.dragCurrent = pos;
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (!state.dragging) return;
  state.dragCurrent = getMousePos(event);
});

canvas.addEventListener("pointerup", (event) => {
  if (!state.dragging || !state.selected) return;
  const dx = state.dragCurrent.x - state.dragStart.x;
  const dy = state.dragCurrent.y - state.dragStart.y;
  const distance = Math.min(Math.hypot(dx, dy), 120);
  const angle = Math.atan2(dy, dx) + Math.PI;
  const power = (distance / 120) * physics.maxPower;

  state.selected.vx = Math.cos(angle) * power;
  state.selected.vy = Math.sin(angle) * power;
  state.turnInProgress = true;
  state.dragging = false;
  state.dragStart = null;
  state.dragCurrent = null;
  canvas.releasePointerCapture(event.pointerId);
});
canvas.addEventListener("pointercancel", () => {
  if (state.dragging) {
    state.dragging = false;
    state.dragStart = null;
    state.dragCurrent = null;
  }
});

setupPlayers();
updateStatus();
update();

console.info("Assets placeholder:", assets);
