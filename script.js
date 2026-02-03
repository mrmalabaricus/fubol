const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const winEl = document.getElementById("win");
const startScreen = document.getElementById("startScreen");

const field = {
  width: canvas.width,
  height: canvas.height,
  goalWidth: 240,
  goalDepth: 28,
  boxDepth: 150,
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
  started: false,
  confetti: [],
  goalPause: false,
  items: [],
  extraBalls: [],
  goalWalls: [],
};

const physics = {
  friction: 0.985,
  minSpeed: 0.12,
  maxPower: 12,
  playerDamageScale: 6,
  goalieDamageScale: 0,
  koTurns: 2,
  playerBounceScale: 0.55,
  collisionDamageMin: 0.6,
  itemRadius: 12,
  itemSpawnChance: 0.35,
  itemBounce: 0.4,
  itemEffectTurns: 2,
  goalWallShrink: 0.6,
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
    koTurns: 0,
    paralyzedTurns: 0,
  };
}

function setupPlayers() {
  const spacingY = 90;
  const startY = field.center.y - spacingY * 1.5;
  const lineups = {
    teamA: ["jugador01", "jugador02", "jugador03", "jugador04"],
    teamB: ["jugador12", "jugador11", "jugador10", "jugador09"],
  };
  const getPlayer = (id) => rosterPlayers.find((player) => player.id === id);
  const teamAPlayers = lineups.teamA.map((id) => getPlayer(id));
  const teamBPlayers = lineups.teamB.map((id) => getPlayer(id));
  const formationA = getFormationPositions(0);
  const formationB = getFormationPositions(1);

  teams[0].players = Array.from({ length: 4 }, (_, i) =>
    createPlayer(0, formationA[i].x, formationA[i].y, teamAPlayers[i])
  );
  teams[1].players = Array.from({ length: 4 }, (_, i) =>
    createPlayer(1, formationB[i].x, formationB[i].y, teamBPlayers[i])
  );

  const goalieA = rosterGoalkeepers.find((goalie) => goalie.id === "golero1");
  const goalieB = rosterGoalkeepers.find((goalie) => goalie.id === "golero2");
  teams[0].goalie = createPlayer(0, formationA.goalie.x, formationA.goalie.y, goalieA, true);
  teams[1].goalie = createPlayer(1, formationB.goalie.x, formationB.goalie.y, goalieB, true);
}

function resetPositions(scoringTeam) {
  ball.x = field.center.x;
  ball.y = field.center.y;
  ball.vx = 0;
  ball.vy = 0;

  const formationA = getFormationPositions(0);
  const formationB = getFormationPositions(1);
  teams[0].players.forEach((player, i) => {
    player.x = formationA[i].x;
    player.y = formationA[i].y;
    player.vx = 0;
    player.vy = 0;
    player.health = player.maxHealth;
    player.koTurns = 0;
    player.paralyzedTurns = 0;
  });
  teams[1].players.forEach((player, i) => {
    player.x = formationB[i].x;
    player.y = formationB[i].y;
    player.vx = 0;
    player.vy = 0;
    player.health = player.maxHealth;
    player.koTurns = 0;
    player.paralyzedTurns = 0;
  });

  teams[0].goalie.x = formationA.goalie.x;
  teams[0].goalie.y = formationA.goalie.y;
  teams[0].goalie.vx = 0;
  teams[0].goalie.vy = 0;
  teams[0].goalie.health = teams[0].goalie.maxHealth;
  teams[0].goalie.koTurns = 0;
  teams[0].goalie.paralyzedTurns = 0;
  teams[1].goalie.x = formationB.goalie.x;
  teams[1].goalie.y = formationB.goalie.y;
  teams[1].goalie.vx = 0;
  teams[1].goalie.vy = 0;
  teams[1].goalie.health = teams[1].goalie.maxHealth;
  teams[1].goalie.koTurns = 0;
  teams[1].goalie.paralyzedTurns = 0;

  state.items = [];
  state.extraBalls = [];
  state.goalWalls = [];

  state.selected = null;
  state.dragging = false;
  state.turnInProgress = false;
  state.turn = scoringTeam === null ? state.turn : scoringTeam === 0 ? 1 : 0;
  updateStatus();
}

function getFormationPositions(teamIndex) {
  const spacingY = 90;
  const startY = field.center.y - spacingY * 1.5;
  const goalieX = teamIndex === 0 ? 60 : field.width - 60;
  const defenderX = teamIndex === 0 ? 160 : field.width - 160;
  const midfielderX = teamIndex === 0 ? 280 : field.width - 280;

  return Object.assign(
    [
      { x: defenderX, y: startY + spacingY * 0 },
      { x: defenderX, y: startY + spacingY * 1 },
      { x: midfielderX, y: startY + spacingY * 2 },
      { x: midfielderX, y: startY + spacingY * 3 },
    ],
    {
      goalie: { x: goalieX, y: field.center.y },
    }
  );
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

  drawGoalBox(0);
  drawGoalBox(1);

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

function drawGoalBox(teamIndex) {
  const goalBox = getGoalBox(teamIndex);
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(goalBox.x, goalBox.y, goalBox.width, goalBox.height);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.strokeRect(goalBox.x, goalBox.y, goalBox.width, goalBox.height);
}

function drawGoal(teamIndex) {
  const goalMouth = getGoalMouth(teamIndex);
  const goalY = goalMouth.top;
  const x = teamIndex === 0 ? 30 - field.goalDepth : field.width - 30;
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.fillRect(x, goalY, field.goalDepth, goalMouth.height);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.strokeRect(x, goalY, field.goalDepth, goalMouth.height);
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
  if (player.koTurns > 0) {
    drawKoStars(player);
  }
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

function drawKoStars(player) {
  const starCount = 3;
  const radius = 6;
  const spacing = 16;
  const startX = player.x - ((starCount - 1) * spacing) / 2;
  const y = player.y - player.radius - 28;

  for (let i = 0; i < starCount; i += 1) {
    drawStar(startX + i * spacing, y, radius, 5);
  }
}

function drawStar(cx, cy, outerRadius, points) {
  const innerRadius = outerRadius * 0.5;
  const step = Math.PI / points;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fillStyle = "#ffd66b";
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
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

function drawExtraBalls() {
  state.extraBalls.forEach((extra) => {
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.arc(extra.x, extra.y, extra.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.stroke();
  });
}

function drawItems() {
  state.items.forEach((item) => {
    ctx.beginPath();
    if (item.type === "double") {
      ctx.fillStyle = "#57ff99";
    } else if (item.type === "wall") {
      ctx.fillStyle = "#4aa3ff";
    } else {
      ctx.fillStyle = "#ffd66b";
    }
    ctx.arc(item.x, item.y, physics.itemRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.stroke();
  });
}

function drawGoalWalls() {
  state.goalWalls.forEach((wall) => {
    const goalMouth = getGoalMouth(wall.teamIndex, true);
    const goalY = field.center.y - field.goalWidth / 2;
    const upperHeight = goalMouth.top - goalY;
    const lowerStart = goalMouth.bottom;
    const lowerHeight = goalY + field.goalWidth - goalMouth.bottom;
    const x = wall.teamIndex === 0 ? 30 - field.goalDepth : field.width - 30;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    if (upperHeight > 0) {
      ctx.fillRect(x, goalY, field.goalDepth, upperHeight);
    }
    if (lowerHeight > 0) {
      ctx.fillRect(x, lowerStart, field.goalDepth, lowerHeight);
    }
  });
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
  drawItems();
  drawGoalWalls();
  teams.forEach((team) => team.players.forEach(drawPlayer));
  teams.forEach((team) => drawPlayer(team.goalie));
  drawBall();
  drawExtraBalls();
  drawAimGuide();
  drawConfetti();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateGoalie(goalie) {
  const isManual =
    state.selected === goalie ||
    (state.turn === goalie.team && state.turnInProgress);
  if (isManual) {
    return;
  }
  const areaTop = field.center.y - field.goalWidth / 2 + 16;
  const areaBottom = field.center.y + field.goalWidth / 2 - 16;
  const targetY = clamp(ball.y, areaTop, areaBottom);
  goalie.y += (targetY - goalie.y) * 0.05;

  const goalieBox = getGoalBox(goalie.team);
  const minX = goalieBox.x + goalie.radius;
  const maxX = goalieBox.x + goalieBox.width - goalie.radius;
  const minY = goalieBox.y + goalie.radius;
  const maxY = goalieBox.y + goalieBox.height - goalie.radius;
  goalie.x = clamp(goalie.x, minX, maxX);
  goalie.y = clamp(goalie.y, minY, maxY);
  goalie.vx = 0;
  goalie.vy = 0;
}

function applyPhysics() {
  const players = [
    ...teams[0].players,
    ...teams[1].players,
    teams[0].goalie,
    teams[1].goalie,
  ];
  const balls = getAllBalls();

  players.forEach((player) => {
    if (player.koTurns > 0 || player.paralyzedTurns > 0) {
      player.vx = 0;
      player.vy = 0;
    }
    player.x += player.vx;
    player.y += player.vy;
    player.vx *= physics.friction;
    player.vy *= physics.friction;

    if (Math.abs(player.vx) < physics.minSpeed) player.vx = 0;
    if (Math.abs(player.vy) < physics.minSpeed) player.vy = 0;

    const padding = 30;
    const rebound = 0.6;
    if (player.isGoalie) {
      const goalieBox = getGoalBox(player.team);
      player.x = clamp(
        player.x,
        goalieBox.x + player.radius,
        goalieBox.x + goalieBox.width - player.radius
      );
      player.y = clamp(
        player.y,
        goalieBox.y + player.radius,
        goalieBox.y + goalieBox.height - player.radius
      );
    } else {
      if (player.x - player.radius < padding) {
        player.x = padding + player.radius;
        player.vx = Math.abs(player.vx) * rebound;
      }
      if (player.x + player.radius > field.width - padding) {
        player.x = field.width - padding - player.radius;
        player.vx = -Math.abs(player.vx) * rebound;
      }
      if (player.y - player.radius < padding) {
        player.y = padding + player.radius;
        player.vy = Math.abs(player.vy) * rebound;
      }
      if (player.y + player.radius > field.height - padding) {
        player.y = field.height - padding - player.radius;
        player.vy = -Math.abs(player.vy) * rebound;
      }
    }
    resolvePlayerItemCollisions(player);
  });

  balls.forEach((ballObj) => applyBallPhysics(ballObj));
  balls.forEach((ballObj) => keepBallInBounds(ballObj));
  handleCollisions(balls, players);
  handleBallItemCollisions(balls);
  teams.forEach((team) => updateGoalie(team.goalie));
}

function getGoalBox(teamIndex) {
  const goalY = field.center.y - field.goalWidth / 2;
  return {
    x: teamIndex === 0 ? 30 : field.width - 30 - field.boxDepth,
    y: goalY,
    width: field.boxDepth,
    height: field.goalWidth,
  };
}

function getGoalMouth(teamIndex, ignoreWall = false) {
  const hasWall =
    !ignoreWall && state.goalWalls.some((wall) => wall.teamIndex === teamIndex);
  const height = hasWall ? field.goalWidth * physics.goalWallShrink : field.goalWidth;
  const top = field.center.y - height / 2;
  return {
    top,
    bottom: top + height,
    height,
  };
}

function keepBallInBounds(ballObj) {
  if (state.goalPause) {
    return;
  }
  const leftGoal = getGoalMouth(0);
  const rightGoal = getGoalMouth(1);
  const wallThickness = 10;
  if (
    ballObj.y - ballObj.radius < 30 ||
    ballObj.y + ballObj.radius > field.height - 30
  ) {
    ballObj.vy *= -0.8;
    ballObj.y = clamp(
      ballObj.y,
      30 + ballObj.radius,
      field.height - 30 - ballObj.radius
    );
  }

  if (ballObj.x - ballObj.radius < 30) {
    if (ballObj.y > leftGoal.top && ballObj.y < leftGoal.bottom) {
      const hasWall = state.goalWalls.some((wall) => wall.teamIndex === 0);
      if (hasWall && ballObj.x - ballObj.radius < 30 + wallThickness) {
        ballObj.vx = Math.abs(ballObj.vx) * 0.8;
        ballObj.x = 30 + wallThickness + ballObj.radius;
      } else {
        score(1);
      }
    } else {
      ballObj.vx *= -0.8;
      ballObj.x = 30 + ballObj.radius;
    }
  }

  if (ballObj.x + ballObj.radius > field.width - 30) {
    if (ballObj.y > rightGoal.top && ballObj.y < rightGoal.bottom) {
      const hasWall = state.goalWalls.some((wall) => wall.teamIndex === 1);
      if (hasWall && ballObj.x + ballObj.radius > field.width - 30 - wallThickness) {
        ballObj.vx = -Math.abs(ballObj.vx) * 0.8;
        ballObj.x = field.width - 30 - wallThickness - ballObj.radius;
      } else {
        score(0);
      }
    } else {
      ballObj.vx *= -0.8;
      ballObj.x = field.width - 30 - ballObj.radius;
    }
  }
}

function handleCollisions(balls, players) {
  handlePlayerCollisions(players);

  players.forEach((player) => {
    balls.forEach((ballObj) => {
      const dx = ballObj.x - player.x;
      const dy = ballObj.y - player.y;
      const distance = Math.hypot(dx, dy);
      const minDistance = ballObj.radius + player.radius;
      if (distance > 0 && distance < minDistance) {
        const nx = dx / distance;
        const ny = dy / distance;
        const overlap = minDistance - distance;
        ballObj.x += nx * overlap;
        ballObj.y += ny * overlap;
        const kickPower = 0.6 + (player.isGoalie ? 0.4 : 0.2);
        const strengthBoost = player.profile?.strength ?? 1;
        const movementBoost = Math.min(1, Math.hypot(player.vx, player.vy) / 6);
        const bounceScale = 0.35 + physics.playerBounceScale * movementBoost;
        ballObj.vx += nx * kickPower * 10 * strengthBoost * bounceScale;
        ballObj.vy += ny * kickPower * 10 * strengthBoost * bounceScale;
      }
    });
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

        if (a.team !== b.team) {
          const impactSpeed = Math.max(0, -velocityAlongNormal);
          const effectiveImpact = Math.max(physics.collisionDamageMin, impactSpeed);
          const aPower = (a.profile?.strength ?? 1) * (a.profile?.speed ?? 1);
          const bPower = (b.profile?.strength ?? 1) * (b.profile?.speed ?? 1);
          const damageA =
            effectiveImpact *
            physics.playerDamageScale *
            bPower *
            (a.isGoalie ? physics.goalieDamageScale : 1);
          const damageB =
            effectiveImpact *
            physics.playerDamageScale *
            aPower *
            (b.isGoalie ? physics.goalieDamageScale : 1);
          a.health = Math.max(0, a.health - damageA);
          b.health = Math.max(0, b.health - damageB);
          if (a.health === 0 && a.koTurns === 0) {
            a.koTurns = physics.koTurns;
            a.vx = 0;
            a.vy = 0;
          }
          if (b.health === 0 && b.koTurns === 0) {
            b.koTurns = physics.koTurns;
            b.vx = 0;
            b.vy = 0;
          }
        }
      }
    }
  }
}

function score(teamIndex) {
  if (state.goalPause) return;
  spawnConfetti(teamIndex);
  state.goalPause = true;
  state.scores[teamIndex] += 1;
  scoreEl.textContent = `${state.scores[0]} - ${state.scores[1]}`;
  setWinner();
  setTimeout(() => {
    resetPositions(teamIndex);
    state.goalPause = false;
  }, 500);
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
  recoverKnockouts();
  updateItemsForNewTurn();
  updateStatus();
}

function recoverKnockouts() {
  const players = [
    ...teams[0].players,
    ...teams[1].players,
    teams[0].goalie,
    teams[1].goalie,
  ];
  players.forEach((player) => {
    if (player.koTurns > 0) {
      player.koTurns -= 1;
      if (player.koTurns === 0) {
        player.health = Math.max(player.health, player.maxHealth * 0.5);
      }
    }
    if (player.paralyzedTurns > 0) {
      player.paralyzedTurns -= 1;
    }
  });
}

function updateItemsForNewTurn() {
  state.items = state.items
    .map((item) => ({ ...item, turnsLeft: item.turnsLeft - 1 }))
    .filter((item) => item.turnsLeft > 0);
  state.extraBalls = state.extraBalls
    .map((ballObj) => ({ ...ballObj, turnsLeft: ballObj.turnsLeft - 1 }))
    .filter((ballObj) => ballObj.turnsLeft > 0);
  state.goalWalls = state.goalWalls
    .map((wall) => ({ ...wall, turnsLeft: wall.turnsLeft - 1 }))
    .filter((wall) => wall.turnsLeft > 0);

  if (Math.random() < physics.itemSpawnChance) {
    spawnRandomItem();
  }
}

function update() {
  if (!state.started) {
    draw();
    requestAnimationFrame(update);
    return;
  }
  if (!state.winner && !state.goalPause) {
    applyPhysics();
  }
  updateConfetti();

  if (!state.dragging && allStopped() && state.turnInProgress && !state.goalPause) {
    nextTurn();
    state.turnInProgress = false;
  }

  draw();
  requestAnimationFrame(update);
}

function spawnConfetti(teamIndex) {
  const goalX = teamIndex === 0 ? field.width - 40 : 40;
  const goalY = field.center.y;
  const colors = ["#ffffff"];
  const count = 60;
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI / 2) * Math.random() - Math.PI / 4;
    const speed = 3 + Math.random() * 4;
    state.confetti.push({
      x: goalX,
      y: goalY,
      vx: Math.cos(angle) * speed * (teamIndex === 0 ? -1 : 1),
      vy: -Math.sin(angle) * speed - 2,
      size: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 80 + Math.random() * 40,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
    });
  }
}

function updateConfetti() {
  state.confetti.forEach((piece) => {
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.vy += 0.08;
    piece.vx *= 0.99;
    piece.rotation += piece.spin;
    piece.life -= 1;
  });
  state.confetti = state.confetti.filter((piece) => piece.life > 0);
}

function drawConfetti() {
  state.confetti.forEach((piece) => {
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.rotation);
    ctx.fillStyle = piece.color;
    ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
    ctx.restore();
  });
}

function getAllBalls() {
  return [ball, ...state.extraBalls];
}

function applyBallPhysics(ballObj) {
  ballObj.x += ballObj.vx;
  ballObj.y += ballObj.vy;
  ballObj.vx *= physics.friction;
  ballObj.vy *= physics.friction;

  if (Math.abs(ballObj.vx) < physics.minSpeed) ballObj.vx = 0;
  if (Math.abs(ballObj.vy) < physics.minSpeed) ballObj.vy = 0;
}

function resolvePlayerItemCollisions(player) {
  state.items.forEach((item) => {
    const dx = player.x - item.x;
    const dy = player.y - item.y;
    const distance = Math.hypot(dx, dy);
    const minDistance = player.radius + physics.itemRadius;
    if (distance > 0 && distance < minDistance) {
      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = minDistance - distance;
      player.x += nx * overlap;
      player.y += ny * overlap;
      player.vx *= physics.itemBounce;
      player.vy *= physics.itemBounce;
    }
  });
}

function handleBallItemCollisions(balls) {
  balls.forEach((ballObj) => {
    state.items = state.items.filter((item) => {
      const dx = ballObj.x - item.x;
      const dy = ballObj.y - item.y;
      const distance = Math.hypot(dx, dy);
      const minDistance = ballObj.radius + physics.itemRadius;
      if (distance <= minDistance) {
        applyItemEffect(item);
        return false;
      }
      return true;
    });
  });
}

function spawnRandomItem() {
  const types = ["double", "wall", "paralyze"];
  const type = types[Math.floor(Math.random() * types.length)];
  const padding = 80;
  const x = padding + Math.random() * (field.width - padding * 2);
  const y = padding + Math.random() * (field.height - padding * 2);
  state.items.push({
    id: crypto.randomUUID(),
    type,
    x,
    y,
    turnsLeft: physics.itemEffectTurns,
  });
}

function applyItemEffect(item) {
  if (item.type === "double") {
    state.extraBalls.push({
      x: ball.x + 12,
      y: ball.y + 12,
      radius: ball.radius,
      vx: ball.vx,
      vy: ball.vy,
      turnsLeft: physics.itemEffectTurns,
    });
  } else if (item.type === "wall") {
    const existing = state.goalWalls.some((wall) => wall.teamIndex === state.turn);
    if (!existing) {
      state.goalWalls.push({
        teamIndex: state.turn,
        turnsLeft: physics.itemEffectTurns,
      });
    }
  } else if (item.type === "paralyze") {
    const targetTeam = state.turn === 0 ? 1 : 0;
    const candidates = [
      ...teams[targetTeam].players,
      teams[targetTeam].goalie,
    ].filter((player) => player && player.paralyzedTurns === 0 && player.koTurns === 0);
    if (candidates.length > 0) {
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      target.paralyzedTurns = physics.itemEffectTurns;
      target.vx = 0;
      target.vy = 0;
    }
  }
}

function getMousePos(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function selectPlayerAt(pos) {
  const candidates = teams[state.turn].players.filter(
    (player) => player.koTurns === 0 && player.paralyzedTurns === 0
  );
  if (canUseGoalie()) {
    if (
      teams[state.turn].goalie.koTurns === 0 &&
      teams[state.turn].goalie.paralyzedTurns === 0
    ) {
      candidates.push(teams[state.turn].goalie);
    }
  }
  const hit = candidates.find(
    (player) => Math.hypot(player.x - pos.x, player.y - pos.y) <= player.radius
  );
  state.selected = hit || null;
}

function canUseGoalie() {
  if (!teams[state.turn].goalie) return false;
  return isBallInsideGoalBox(state.turn);
}

function isBallInsideGoalBox(teamIndex) {
  const goalBox = getGoalBox(teamIndex);
  return (
    ball.x >= goalBox.x &&
    ball.x <= goalBox.x + goalBox.width &&
    ball.y >= goalBox.y &&
    ball.y <= goalBox.y + goalBox.height
  );
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

function startGame() {
  if (state.started) return;
  state.started = true;
  document.body.classList.add("started");
  startScreen.classList.add("hidden");
}

startScreen.addEventListener("pointerdown", startGame);
window.addEventListener("keydown", startGame);
