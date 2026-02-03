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

const goalkeeperProfiles = {
  golero1: { name: "Golero 1", strength: 1.05, speed: 0.7, maxHealth: 140 },
  golero2: { name: "Golero 2", strength: 1.2, speed: 0.6, maxHealth: 150 },
  golero3: { name: "Golero 3", strength: 0.95, speed: 0.8, maxHealth: 130 },
};

const playerProfiles = {
  tanque: { name: "Tanque", strength: 1.3, speed: 0.85, maxHealth: 140 },
  rapido: { name: "Rápido", strength: 0.9, speed: 1.2, maxHealth: 90 },
  balanceado: { name: "Balanceado", strength: 1.0, speed: 1.0, maxHealth: 110 },
};

const rosterPlayers = [
  {
    id: "jugador01",
    name: "Santi Vega",
    profileKey: "rapido",
    strength: 0.95,
    speed: 1.25,
    maxHealth: 95,
    image: "assets/jugador_01.png",
  },
  {
    id: "jugador02",
    name: "Tomi Rios",
    profileKey: "balanceado",
    strength: 1.05,
    speed: 1.0,
    maxHealth: 110,
    image: "assets/jugador_02.png",
  },
  {
    id: "jugador03",
    name: "Lauti Maza",
    profileKey: "tanque",
    strength: 1.35,
    speed: 0.8,
    maxHealth: 150,
    image: "assets/jugador_03.png",
  },
  {
    id: "jugador04",
    name: "Nico Paz",
    profileKey: "balanceado",
    strength: 1.0,
    speed: 1.05,
    maxHealth: 105,
    image: "assets/jugador_04.png",
  },
  {
    id: "jugador05",
    name: "Ciro Diaz",
    profileKey: "rapido",
    strength: 0.9,
    speed: 1.3,
    maxHealth: 90,
    image: "assets/jugador_05.png",
  },
  {
    id: "jugador06",
    name: "Ema Solis",
    profileKey: "tanque",
    strength: 1.4,
    speed: 0.75,
    maxHealth: 155,
    image: "assets/jugador_06.png",
  },
  {
    id: "jugador07",
    name: "Ivo Rojas",
    profileKey: "balanceado",
    strength: 1.1,
    speed: 0.95,
    maxHealth: 115,
    image: "assets/jugador_07.png",
  },
  {
    id: "jugador08",
    name: "Pablo Cruz",
    profileKey: "rapido",
    strength: 0.92,
    speed: 1.22,
    maxHealth: 92,
    image: "assets/jugador_08.png",
  },
  {
    id: "jugador09",
    name: "Fede Luna",
    profileKey: "balanceado",
    strength: 1.02,
    speed: 1.08,
    maxHealth: 108,
    image: "assets/jugador_09.png",
  },
  {
    id: "jugador10",
    name: "Rami Silva",
    profileKey: "tanque",
    strength: 1.3,
    speed: 0.82,
    maxHealth: 145,
    image: "assets/jugador_10.png",
  },
  {
    id: "jugador11",
    name: "Facu Leon",
    profileKey: "rapido",
    strength: 0.88,
    speed: 1.28,
    maxHealth: 88,
    image: "assets/jugador_11.png",
  },
  {
    id: "jugador12",
    name: "Tadeo Gil",
    profileKey: "balanceado",
    strength: 1.08,
    speed: 0.98,
    maxHealth: 112,
    image: "assets/jugador_12.png",
  },
  {
    id: "jugador13",
    name: "Bruno Neri",
    profileKey: "tanque",
    strength: 1.32,
    speed: 0.78,
    maxHealth: 148,
    image: "assets/jugador_13.png",
  },
  {
    id: "jugador14",
    name: "Dante Roca",
    profileKey: "rapido",
    strength: 0.93,
    speed: 1.18,
    maxHealth: 94,
    image: "assets/jugador_14.png",
  },
  {
    id: "jugador15",
    name: "Lisandro Rey",
    profileKey: "balanceado",
    strength: 1.0,
    speed: 1.02,
    maxHealth: 109,
    image: "assets/jugador_15.png",
  },
];

const rosterGoalkeepers = [
  {
    id: "golero1",
    profileKey: "golero1",
    name: "Golero 1",
    strength: 1.05,
    speed: 0.7,
    maxHealth: 140,
    image: "assets/golero_01.png",
  },
  {
    id: "golero2",
    profileKey: "golero2",
    name: "Golero 2",
    strength: 1.2,
    speed: 0.6,
    maxHealth: 150,
    image: "assets/golero_02.png",
  },
  {
    id: "golero3",
    profileKey: "golero3",
    name: "Golero 3",
    strength: 0.95,
    speed: 0.8,
    maxHealth: 130,
    image: "assets/golero_03.png",
  },
];

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
  playerDamageScale: 6,
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

function createPlayer(teamIndex, x, y, playerConfig, isGoalie = false) {
  const profileBase = isGoalie
    ? goalkeeperProfiles[playerConfig.profileKey]
    : playerProfiles[playerConfig.profileKey];
  const profile = {
    ...profileBase,
    strength: playerConfig.strength ?? profileBase.strength,
    speed: playerConfig.speed ?? profileBase.speed,
    maxHealth: playerConfig.maxHealth ?? profileBase.maxHealth,
  };
  return {
    team: teamIndex,
    profileKey: playerConfig.profileKey,
    profile,
    image: playerConfig.image,
    x,
    y,
    radius: isGoalie ? 20 : 18,
    vx: 0,
    vy: 0,
    isGoalie,
    maxHealth: profile.maxHealth,
    health: profile.maxHealth,
  };
}

function setupPlayers() {
  const spacingY = 90;
  const startY = field.center.y - spacingY * 1.5;
  const offsetX = 180;
  const lineups = {
    teamA: ["jugador01", "jugador02", "jugador03", "jugador04"],
    teamB: ["jugador12", "jugador11", "jugador10", "jugador09"],
  };
  const getPlayer = (id) => rosterPlayers.find((player) => player.id === id);
  const teamAPlayers = lineups.teamA.map((id) => getPlayer(id));
  const teamBPlayers = lineups.teamB.map((id) => getPlayer(id));

  teams[0].players = Array.from({ length: 4 }, (_, i) =>
    createPlayer(0, offsetX, startY + spacingY * i, teamAPlayers[i])
  );
  teams[1].players = Array.from({ length: 4 }, (_, i) =>
    createPlayer(1, field.width - offsetX, startY + spacingY * i, teamBPlayers[i])
  );

  const goalieA = rosterGoalkeepers.find((goalie) => goalie.id === "golero1");
  const goalieB = rosterGoalkeepers.find((goalie) => goalie.id === "golero2");
  teams[0].goalie = createPlayer(0, 60, field.center.y, goalieA, true);
  teams[1].goalie = createPlayer(1, field.width - 60, field.center.y, goalieB, true);
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
    player.health = player.maxHealth;
  });
  teams[1].players.forEach((player, i) => {
    player.x = field.width - offsetX;
    player.y = field.center.y - 135 + i * 90;
    player.vx = 0;
    player.vy = 0;
    player.health = player.maxHealth;
  });

  teams[0].goalie.x = 60;
  teams[0].goalie.y = field.center.y;
  teams[0].goalie.vx = 0;
  teams[0].goalie.vy = 0;
  teams[0].goalie.health = teams[0].goalie.maxHealth;
  teams[1].goalie.x = field.width - 60;
  teams[1].goalie.y = field.center.y;
  teams[1].goalie.vx = 0;
  teams[1].goalie.vy = 0;
  teams[1].goalie.health = teams[1].goalie.maxHealth;

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

  drawHealthBar(player);
}

function drawHealthBar(player) {
  const barWidth = 42;
  const barHeight = 6;
  const x = player.x - barWidth / 2;
  const y = player.y - player.radius - 14;
  const healthRatio = Math.max(player.health / player.maxHealth, 0);

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(x, y, barWidth, barHeight);
  ctx.fillStyle = `rgba(${Math.round(220 - healthRatio * 120)}, ${Math.round(
    80 + healthRatio * 140
  )}, 80, 0.9)`;
  ctx.fillRect(x, y, barWidth * healthRatio, barHeight);
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.strokeRect(x, y, barWidth, barHeight);
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
      const rebound = 0.6;
      if (entity.x - entity.radius < padding) {
        entity.x = padding + entity.radius;
        entity.vx = Math.abs(entity.vx) * rebound;
      }
      if (entity.x + entity.radius > field.width - padding) {
        entity.x = field.width - padding - entity.radius;
        entity.vx = -Math.abs(entity.vx) * rebound;
      }
      if (entity.y - entity.radius < padding) {
        entity.y = padding + entity.radius;
        entity.vy = Math.abs(entity.vy) * rebound;
      }
      if (entity.y + entity.radius > field.height - padding) {
        entity.y = field.height - padding - entity.radius;
        entity.vy = -Math.abs(entity.vy) * rebound;
      }
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
      const strengthBoost = player.profile?.strength ?? 1;
      ball.vx += nx * kickPower * 10 * strengthBoost;
      ball.vy += ny * kickPower * 10 * strengthBoost;
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

        const impactSpeed = Math.max(0, -velocityAlongNormal);
        const damageA =
          impactSpeed * physics.playerDamageScale * (b.profile?.strength ?? 1);
        const damageB =
          impactSpeed * physics.playerDamageScale * (a.profile?.strength ?? 1);
        a.health = Math.max(0, a.health - damageA);
        b.health = Math.max(0, b.health - damageB);
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
  const speedFactor = state.selected.profile?.speed ?? 1;
  const power = (distance / 120) * physics.maxPower * speedFactor;

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
