const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const winEl = document.getElementById("win");
const matchClockEl = document.getElementById("matchClock");
const turnClockEl = document.getElementById("turnClock");
const startScreen = document.getElementById("startScreen");
const menuScreen = document.getElementById("menuScreen");
const lineupScreen = document.getElementById("lineupScreen");
const lineupBack = document.getElementById("lineupBack");
const lineupStart = document.getElementById("lineupStart");
const gameOverScreen = document.getElementById("gameOverScreen");
const gameOverTitle = document.getElementById("gameOverTitle");
const gameOverScore = document.getElementById("gameOverScore");
const playAgainBtn = document.getElementById("playAgainBtn");
const changeSquadBtn = document.getElementById("changeSquadBtn");
const centerMessageEl = document.getElementById("centerMessage");
const centerMessageImgEl = document.getElementById("centerMessageImg");
const centerMessageTextEl = document.getElementById("centerMessageText");

const SCALE = 90 / 64;
const scaleValue = (value) => value * SCALE;

const BASE_DIMENSIONS = {
  fieldWidth: 960,
  fieldHeight: 540,
  goalWidth: 240,
  goalDepth: 28,
  boxDepth: 150,
  fieldPadding: 30,
  centerCircleRadius: 70,
  spacingY: 90,
  goalieOffset: 60,
  defenderOffset: 160,
  midfielderOffset: 280,
  playerRadius: 18,
  goalieRadius: 20,
  ballRadius: 12,
  itemRadius: 12,
  healthBarWidth: 42,
  healthBarHeight: 6,
  healthBarOffset: 14,
  koStarRadius: 6,
  koStarSpacing: 16,
  koStarOffset: 28,
  paralyzeRayWidth: 24,
  paralyzeRayHeight: 48,
  paralyzeRayOffset: 8,
  aimGuideMax: 120,
  aimGuideDash: 6,
  aimGuideBarWidth: 140,
  aimGuideBarHeight: 12,
  aimGuideBarOffset: 36,
  goalieInset: 16,
  goalWallThickness: 10,
  itemSpawnPadding: 80,
};

const DIMENSIONS = Object.fromEntries(
  Object.entries(BASE_DIMENSIONS).map(([key, value]) => [key, scaleValue(value)])
);

const TIMERS = {
  matchMs: 3 * 60 * 1000,
  turnMs: 15 * 1000,
};

canvas.width = Math.round(DIMENSIONS.fieldWidth);
canvas.height = Math.round(DIMENSIONS.fieldHeight);

const field = {
  width: canvas.width,
  height: canvas.height,
  goalWidth: DIMENSIONS.goalWidth,
  goalDepth: DIMENSIONS.goalDepth,
  boxDepth: DIMENSIONS.boxDepth,
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

const itemAssets = {
  double: "assets/item_double.png",
  wall: "assets/item_wall.png",
  paralyze: "assets/item_paralyze.png",
  extraBall: "assets/extra_ball.png",
  goalWall: "assets/goal_wall.png",
  paralyzeRay: "assets/paralyze_ray.png",
};

const centerMessageAssets = {
  kickoff: "assets/msg_kickoff.png",
  goal: "assets/msg_goal.png",
  golden: "assets/msg_golden_goal.png",
};

const imageCache = new Map();

function getImage(src) {
  if (imageCache.has(src)) {
    return imageCache.get(src);
  }
  const img = new Image();
  const record = { img, loaded: false, failed: false };
  img.onload = () => {
    record.loaded = true;
  };
  img.onerror = () => {
    record.failed = true;
  };
  img.src = src;
  imageCache.set(src, record);
  return record;
}

function drawImageOrPlaceholder(src, x, y, width, height, color = "#888") {
  const record = getImage(src);
  if (record.loaded) {
    ctx.drawImage(record.img, x, y, width, height);
    return;
  }

  const radius = Math.min(width, height) * 0.22;
  ctx.fillStyle = color;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.rect(x, y, width, height);
  }
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = Math.max(1, Math.min(width, height) * 0.06);
  ctx.beginPath();
  ctx.moveTo(x + width * 0.2, y + height * 0.2);
  ctx.lineTo(x + width * 0.8, y + height * 0.8);
  ctx.moveTo(x + width * 0.8, y + height * 0.2);
  ctx.lineTo(x + width * 0.2, y + height * 0.8);
  ctx.stroke();
}

function drawFieldBackground() {
  drawImageOrPlaceholder(
    assets.field,
    0,
    0,
    field.width,
    field.height,
    "#1c6e3a"
  );
}

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

const lineupSlots = ["defender1", "defender2", "midfielder1", "midfielder2"];

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
  mode: null,
  playerCount: 4,
  confetti: [],
  goalPause: false,
  items: [],
  extraBalls: [],
  goalWalls: [],
  lineups: null,
  matchTimeLeft: TIMERS.matchMs,
  turnTimeLeft: TIMERS.turnMs,
  lastFrameTime: 0,
  goldenGoalActive: false,
};

const physics = {
  friction: 0.985,
  minSpeed: 0.12 * SCALE,
  maxPower: 12 * SCALE,
  playerDamageScale: 6,
  goalieDamageScale: 0,
  koTurns: 2,
  playerBounceScale: 0.55,
  collisionDamageMin: 0.6,
  itemRadius: DIMENSIONS.itemRadius,
  itemSpawnChance: 0.35,
  itemBounce: 0.4,
  itemEffectTurns: 2,
  goalWallShrink: 0.6,
};


function initUiAssetFallbacks() {
  const startLogo = document.querySelector(".start-logo");
  const startTitle = document.querySelector(".start-title");
  if (startLogo) {
    startLogo.addEventListener("error", () => {
      startLogo.classList.add("hidden");
      if (startTitle) {
        startTitle.classList.remove("hidden");
      }
    });
  }
}

const teams = [
  {
    name: "Home",
    color: "#4aa3ff",
    goalX: 0,
    direction: 1,
    players: [],
    goalie: null,
  },
  {
    name: "Away",
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
  radius: DIMENSIONS.ballRadius,
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
    radius: isGoalie ? DIMENSIONS.goalieRadius : DIMENSIONS.playerRadius,
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
  const spacingY = DIMENSIONS.spacingY;
  const startY = field.center.y - spacingY * 1.5;
  const lineups = getLineups();
  const getPlayer = (id) => rosterPlayers.find((player) => player.id === id);
  const teamAPlayers = lineups.teamA.map((id) => getPlayer(id));
  const teamBPlayers = lineups.teamB.map((id) => getPlayer(id));
  const formationA = getFormationPositions(0, teamAPlayers.length);
  const formationB = getFormationPositions(1, teamBPlayers.length);

  teams[0].players = Array.from({ length: teamAPlayers.length }, (_, i) =>
    createPlayer(0, formationA[i].x, formationA[i].y, teamAPlayers[i])
  );
  teams[1].players = Array.from({ length: teamBPlayers.length }, (_, i) =>
    createPlayer(1, formationB[i].x, formationB[i].y, teamBPlayers[i])
  );

  const goalieA = rosterGoalkeepers.find((goalie) => goalie.id === lineups.goalieA);
  const goalieB = rosterGoalkeepers.find((goalie) => goalie.id === lineups.goalieB);
  teams[0].goalie = createPlayer(0, formationA.goalie.x, formationA.goalie.y, goalieA, true);
  teams[1].goalie = createPlayer(1, formationB.goalie.x, formationB.goalie.y, goalieB, true);
}

function resetPositions(scoringTeam) {
  ball.x = field.center.x;
  ball.y = field.center.y;
  ball.vx = 0;
  ball.vy = 0;
  state.extraBalls = [];
  state.goalWalls = [];

  const formationA = getFormationPositions(0, teams[0].players.length);
  const formationB = getFormationPositions(1, teams[1].players.length);
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
  if (scoringTeam === null) {
    state.items = [];
    state.extraBalls = [];
    state.goalWalls = [];
  }

  state.selected = null;
  state.dragging = false;
  state.turnInProgress = false;
  state.turn = scoringTeam === null ? state.turn : scoringTeam === 0 ? 1 : 0;
  state.turnTimeLeft = TIMERS.turnMs;
  updateStatus();
  updateTimerHud();
}

function getFormationPositions(teamIndex, count) {
  const spacingY = DIMENSIONS.spacingY;
  const startY = field.center.y - spacingY * 1.5;
  const goalieX =
    teamIndex === 0 ? DIMENSIONS.goalieOffset : field.width - DIMENSIONS.goalieOffset;
  const defenderX =
    teamIndex === 0 ? DIMENSIONS.defenderOffset : field.width - DIMENSIONS.defenderOffset;
  const midfielderX =
    teamIndex === 0
      ? DIMENSIONS.midfielderOffset
      : field.width - DIMENSIONS.midfielderOffset;

  const positions = [];
  if (count === 1) {
    positions.push({ x: midfielderX, y: field.center.y });
  } else if (count === 2) {
    positions.push({ x: defenderX, y: startY + spacingY * 1 });
    positions.push({ x: midfielderX, y: startY + spacingY * 2 });
  } else {
    positions.push({ x: defenderX, y: startY + spacingY * 0 });
    positions.push({ x: defenderX, y: startY + spacingY * 1 });
    positions.push({ x: midfielderX, y: startY + spacingY * 2 });
    positions.push({ x: midfielderX, y: startY + spacingY * 3 });
  }

  return Object.assign(positions, {
    goalie: { x: goalieX, y: field.center.y },
  });
}

function formatClock(ms) {
  const clamped = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(clamped / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (clamped % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateTimerHud() {
  matchClockEl.textContent = formatClock(state.matchTimeLeft);
  turnClockEl.textContent = Math.max(0, Math.ceil(state.turnTimeLeft / 1000))
    .toString()
    .padStart(2, "0");
}

function resetTimers() {
  state.matchTimeLeft = TIMERS.matchMs;
  state.turnTimeLeft = TIMERS.turnMs;
  state.lastFrameTime = performance.now();
  updateTimerHud();
}

function expireTurnByClock() {
  if (state.winner !== null || state.turnInProgress) return;
  state.selected = null;
  state.dragging = false;
  state.dragStart = null;
  state.dragCurrent = null;
  nextTurn();
  state.turnTimeLeft = TIMERS.turnMs;
  updateTimerHud();
}

function setWinnerByTime() {
  if (state.scores[0] === state.scores[1]) {
    startGoldenGoal();
    return;
  }
  const winnerIndex = state.scores[0] > state.scores[1] ? 0 : 1;
  state.winner = winnerIndex;
  winEl.textContent = `${teams[winnerIndex].name} gana por tiempo.`;
  lockMatchControls();
  showGameOverOverlay(getWinnerTitle());
}

function tickClocks(now) {
  const delta = state.lastFrameTime ? now - state.lastFrameTime : 0;
  state.lastFrameTime = now;
  if (!state.started || state.winner !== null || state.goalPause) {
    updateTimerHud();
    return;
  }

  if (!state.goldenGoalActive) {
    state.matchTimeLeft = Math.max(0, state.matchTimeLeft - delta);
  } else {
    state.matchTimeLeft = 0;
  }

  if (!state.turnInProgress) {
    state.turnTimeLeft = Math.max(0, state.turnTimeLeft - delta);
    if (state.turnTimeLeft <= 0) {
      expireTurnByClock();
    }
  }

  if (!state.goldenGoalActive && state.matchTimeLeft <= 0 && state.winner === null) {
    setWinnerByTime();
  }

  updateTimerHud();
}

function showGameOverOverlay(titleText) {
  gameOverTitle.textContent = titleText;
  gameOverScore.textContent = `${state.scores[0]} - ${state.scores[1]}`;
  gameOverScreen.classList.remove("hidden");
}

function hideGameOverOverlay() {
  gameOverScreen.classList.add("hidden");
}

let centerMessageTimer = null;

function showCenterMessage(messageKey, durationMs = 1800, fallbackText = "") {
  if (!centerMessageEl || !centerMessageTextEl || !centerMessageImgEl) return;
  centerMessageEl.dataset.messageKey = messageKey;
  centerMessageEl.classList.remove("hidden");

  const src = centerMessageAssets[messageKey];
  const record = src ? getImage(src) : null;
  const useImage = Boolean(record && record.loaded);

  if (useImage) {
    centerMessageImgEl.src = src;
    centerMessageImgEl.classList.remove("hidden");
    centerMessageTextEl.classList.add("hidden");
  } else {
    centerMessageTextEl.textContent = fallbackText || messageKey.toUpperCase();
    centerMessageTextEl.classList.remove("hidden");
    centerMessageImgEl.classList.add("hidden");
    centerMessageImgEl.removeAttribute("src");
  }

  if (centerMessageTimer) {
    clearTimeout(centerMessageTimer);
    centerMessageTimer = null;
  }
  if (durationMs > 0) {
    centerMessageTimer = setTimeout(() => {
      centerMessageEl.classList.add("hidden");
      centerMessageTimer = null;
    }, durationMs);
  }
}

function hideCenterMessage() {
  if (!centerMessageEl || !centerMessageImgEl || !centerMessageTextEl) return;
  if (centerMessageTimer) {
    clearTimeout(centerMessageTimer);
    centerMessageTimer = null;
  }
  centerMessageEl.classList.add("hidden");
  centerMessageImgEl.classList.add("hidden");
  centerMessageTextEl.classList.add("hidden");
}

function showKickOffMessage() {
  showCenterMessage("kickoff", 1400, "KICK OFF");
}

function startGoldenGoal() {
  state.goldenGoalActive = true;
  state.matchTimeLeft = 0;
  winEl.textContent = "Empate: gol de oro";
  state.turn = state.turn === 0 ? 1 : 0;
  resetPositions(null);
  showCenterMessage("golden", 2200, "GOL DE ORO");
}

function lockMatchControls() {
  const entities = [
    ball,
    ...teams[0].players,
    ...teams[1].players,
    teams[0].goalie,
    teams[1].goalie,
    ...state.extraBalls,
  ].filter(Boolean);
  entities.forEach((entity) => {
    entity.vx = 0;
    entity.vy = 0;
  });
  state.selected = null;
  state.dragging = false;
  state.dragStart = null;
  state.dragCurrent = null;
  state.turnInProgress = false;
}

function getWinnerTitle() {
  if (state.winner === "draw") {
    return "Empate";
  }
  const winnerName = teams[state.winner]?.name ?? "Resultado";
  return `${winnerName} gana`;
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
    lockMatchControls();
    showGameOverOverlay(getWinnerTitle());
  } else {
    winEl.textContent = "";
  }
}

function drawField() {
  ctx.clearRect(0, 0, field.width, field.height);
  drawFieldBackground();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.strokeRect(
    DIMENSIONS.fieldPadding,
    DIMENSIONS.fieldPadding,
    field.width - DIMENSIONS.fieldPadding * 2,
    field.height - DIMENSIONS.fieldPadding * 2
  );

  drawGoalBox(0);
  drawGoalBox(1);

  ctx.beginPath();
  ctx.arc(field.center.x, field.center.y, DIMENSIONS.centerCircleRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(field.center.x, DIMENSIONS.fieldPadding);
  ctx.lineTo(field.center.x, field.height - DIMENSIONS.fieldPadding);
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
  const x =
    teamIndex === 0
      ? DIMENSIONS.fieldPadding - field.goalDepth
      : field.width - DIMENSIONS.fieldPadding;
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.fillRect(x, goalY, field.goalDepth, goalMouth.height);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.strokeRect(x, goalY, field.goalDepth, goalMouth.height);
}

function drawGoalLineOverlay() {
  const leftGoal = getGoalMouth(0);
  const rightGoal = getGoalMouth(1);

  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";

  ctx.beginPath();
  ctx.moveTo(DIMENSIONS.fieldPadding, leftGoal.top);
  ctx.lineTo(DIMENSIONS.fieldPadding, leftGoal.bottom);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(field.width - DIMENSIONS.fieldPadding, rightGoal.top);
  ctx.lineTo(field.width - DIMENSIONS.fieldPadding, rightGoal.bottom);
  ctx.stroke();
  ctx.restore();
}

function isTurnSelectablePlayer(player) {
  if (!player || player.team !== state.turn) return false;
  if (player.koTurns > 0 || player.paralyzedTurns > 0) return false;
  if (!player.isGoalie) return true;
  return canUseGoalie();
}

function drawActiveTurnHighlight(player, pulse) {
  if (!isTurnSelectablePlayer(player)) return;
  const baseRadius = player.radius + 5 * SCALE;
  const pulseRadius = baseRadius + pulse * (4 * SCALE);

  ctx.save();
  ctx.lineWidth = 2 + pulse * 1.6;
  ctx.strokeStyle = `rgba(255,255,255,${0.55 + pulse * 0.35})`;
  ctx.beginPath();
  ctx.arc(player.x, player.y, pulseRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPlayer(player, showTurnHighlights, pulse) {
  if (showTurnHighlights) {
    drawActiveTurnHighlight(player, pulse);
  }

  const size = player.radius * 2.2;
  const color = player.isGoalie ? "#ffd66b" : teams[player.team].color;
  drawImageOrPlaceholder(
    player.image,
    player.x - size / 2,
    player.y - size / 2,
    size,
    size,
    color
  );
  ctx.lineWidth = 2;
  ctx.strokeStyle = player === state.selected ? "#ffffff" : "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.stroke();

  drawHealthBar(player);
  if (player.koTurns > 0) {
    drawKoStars(player);
  }
  if (player.paralyzedTurns > 0) {
    drawParalyzeRay(player);
  }
}

function drawHealthBar(player) {
  const barWidth = DIMENSIONS.healthBarWidth;
  const barHeight = DIMENSIONS.healthBarHeight;
  const x = player.x - barWidth / 2;
  const y = player.y - player.radius - DIMENSIONS.healthBarOffset;
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
  const radius = DIMENSIONS.koStarRadius;
  const spacing = DIMENSIONS.koStarSpacing;
  const startX = player.x - ((starCount - 1) * spacing) / 2;
  const y = player.y - player.radius - DIMENSIONS.koStarOffset;

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

function drawParalyzeRay(player) {
  const rayWidth = DIMENSIONS.paralyzeRayWidth;
  const rayHeight = DIMENSIONS.paralyzeRayHeight;
  const x = player.x - rayWidth / 2;
  const y = player.y - player.radius - rayHeight - DIMENSIONS.paralyzeRayOffset;
  drawImageOrPlaceholder(
    itemAssets.paralyzeRay,
    x,
    y,
    rayWidth,
    rayHeight,
    "rgba(255, 255, 200, 0.9)"
  );
}

function drawBall() {
  const size = ball.radius * 2;
  drawImageOrPlaceholder(
    assets.ball,
    ball.x - size / 2,
    ball.y - size / 2,
    size,
    size,
    "#f7f7f7"
  );
}

function drawExtraBalls() {
  state.extraBalls.forEach((extra) => {
    const size = extra.radius * 2;
    drawImageOrPlaceholder(
      itemAssets.extraBall,
      extra.x - size / 2,
      extra.y - size / 2,
      size,
      size,
      "#ffffff"
    );
  });
}

function drawItems() {
  state.items.forEach((item) => {
    let color = "#ffd66b";
    let src = itemAssets.paralyze;
    if (item.type === "double") {
      color = "#57ff99";
      src = itemAssets.double;
    } else if (item.type === "wall") {
      color = "#4aa3ff";
      src = itemAssets.wall;
    }
    const size = physics.itemRadius * 2;
    drawImageOrPlaceholder(
      src,
      item.x - size / 2,
      item.y - size / 2,
      size,
      size,
      color
    );
  });
}

function drawGoalWalls() {
  state.goalWalls.forEach((wall) => {
    const goalMouth = getGoalMouth(wall.teamIndex, true);
    const goalY = field.center.y - field.goalWidth / 2;
    const upperHeight = goalMouth.top - goalY;
    const lowerStart = goalMouth.bottom;
    const lowerHeight = goalY + field.goalWidth - goalMouth.bottom;
    const x =
      wall.teamIndex === 0
        ? DIMENSIONS.fieldPadding - field.goalDepth
        : field.width - DIMENSIONS.fieldPadding;
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
  const distance = Math.min(Math.hypot(dx, dy), DIMENSIONS.aimGuideMax);
  const angle = Math.atan2(dy, dx) + Math.PI;

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
  ctx.lineWidth = 2;
  ctx.setLineDash([DIMENSIONS.aimGuideDash, DIMENSIONS.aimGuideDash]);
  ctx.beginPath();
  ctx.moveTo(state.dragStart.x, state.dragStart.y);
  ctx.lineTo(
    state.dragStart.x + Math.cos(angle) * distance,
    state.dragStart.y + Math.sin(angle) * distance
  );
  ctx.stroke();
  ctx.restore();

  const power = Math.min(distance / DIMENSIONS.aimGuideMax, 1);
  const barWidth = DIMENSIONS.aimGuideBarWidth;
  const barHeight = DIMENSIONS.aimGuideBarHeight;
  const barX = state.dragStart.x - barWidth / 2;
  const barY = state.dragStart.y - DIMENSIONS.aimGuideBarOffset;

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

  const showTurnHighlights =
    state.started &&
    state.winner === null &&
    !state.goalPause &&
    !state.turnInProgress &&
    allStopped();
  const pulse = (Math.sin(performance.now() / 230) + 1) * 0.5;

  teams.forEach((team) =>
    team.players.forEach((player) => drawPlayer(player, showTurnHighlights, pulse))
  );
  teams.forEach((team) => drawPlayer(team.goalie, showTurnHighlights, pulse));
  drawBall();
  drawExtraBalls();
  drawGoalLineOverlay();
  drawGoal(0);
  drawGoal(1);
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
  const areaTop = field.center.y - field.goalWidth / 2 + DIMENSIONS.goalieInset;
  const areaBottom = field.center.y + field.goalWidth / 2 - DIMENSIONS.goalieInset;
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

    const padding = DIMENSIONS.fieldPadding;
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
    x:
      teamIndex === 0
        ? DIMENSIONS.fieldPadding
        : field.width - DIMENSIONS.fieldPadding - field.boxDepth,
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
  const wallThickness = DIMENSIONS.goalWallThickness;
  if (
    ballObj.y - ballObj.radius < DIMENSIONS.fieldPadding ||
    ballObj.y + ballObj.radius > field.height - DIMENSIONS.fieldPadding
  ) {
    ballObj.vy *= -0.8;
    ballObj.y = clamp(
      ballObj.y,
      DIMENSIONS.fieldPadding + ballObj.radius,
      field.height - DIMENSIONS.fieldPadding - ballObj.radius
    );
  }

  if (ballObj.x - ballObj.radius < DIMENSIONS.fieldPadding) {
    if (ballObj.y > leftGoal.top && ballObj.y < leftGoal.bottom) {
      const hasWall = state.goalWalls.some((wall) => wall.teamIndex === 0);
      if (
        hasWall &&
        ballObj.x - ballObj.radius < DIMENSIONS.fieldPadding + wallThickness
      ) {
        ballObj.vx = Math.abs(ballObj.vx) * 0.8;
        ballObj.x = DIMENSIONS.fieldPadding + wallThickness + ballObj.radius;
      } else {
        score(1, ballObj);
      }
    } else {
      ballObj.vx *= -0.8;
      ballObj.x = DIMENSIONS.fieldPadding + ballObj.radius;
    }
  }

  if (ballObj.x + ballObj.radius > field.width - DIMENSIONS.fieldPadding) {
    if (ballObj.y > rightGoal.top && ballObj.y < rightGoal.bottom) {
      const hasWall = state.goalWalls.some((wall) => wall.teamIndex === 1);
      if (
        hasWall &&
        ballObj.x + ballObj.radius > field.width - DIMENSIONS.fieldPadding - wallThickness
      ) {
        ballObj.vx = -Math.abs(ballObj.vx) * 0.8;
        ballObj.x =
          field.width - DIMENSIONS.fieldPadding - wallThickness - ballObj.radius;
      } else {
        score(0, ballObj);
      }
    } else {
      ballObj.vx *= -0.8;
      ballObj.x = field.width - DIMENSIONS.fieldPadding - ballObj.radius;
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
        const movementBoost = Math.min(
          1,
          Math.hypot(player.vx, player.vy) / (6 * SCALE)
        );
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

function score(teamIndex, scoredBall = null) {
  if (state.goalPause) return;
  showCenterMessage("goal", 1100, "GOOOOOL");
  spawnConfetti(teamIndex);
  state.goalPause = true;
  if (scoredBall) {
    const crossOffset = scoredBall.radius * 0.65;
    if (teamIndex === 1) {
      scoredBall.x = DIMENSIONS.fieldPadding - crossOffset;
    } else {
      scoredBall.x = field.width - DIMENSIONS.fieldPadding + crossOffset;
    }
    scoredBall.vx = 0;
    scoredBall.vy = 0;
  }
  state.scores[teamIndex] += 1;
  scoreEl.textContent = `${state.scores[0]} - ${state.scores[1]}`;
  if (state.goldenGoalActive) {
    state.goldenGoalActive = false;
    state.winner = teamIndex;
    winEl.textContent = `Gol de oro: ${teams[teamIndex].name} gana.`;
    lockMatchControls();
    showGameOverOverlay(getWinnerTitle());
    state.goalPause = false;
    return;
  }
  setWinner();
  if (state.winner !== null) {
    state.goalPause = false;
    return;
  }
  setTimeout(() => {
    resetPositions(teamIndex);
    state.goalPause = false;
  }, 900);
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
  state.turnTimeLeft = TIMERS.turnMs;
  updateStatus();
  updateTimerHud();
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

function update(now = performance.now()) {
  tickClocks(now);
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
  if (shouldRunCpuTurn()) {
    runCpuTurn();
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
  const padding = DIMENSIONS.itemSpawnPadding;
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
      x: ball.x + ball.radius,
      y: ball.y + ball.radius,
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
  if (state.mode === "cpu" && state.turn === 1) {
    state.selected = null;
    return;
  }
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

function getRandomIndices(total, count) {
  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, count);
}

function createRandomLineup() {
  const goalieIndex = Math.floor(Math.random() * rosterGoalkeepers.length);
  const playerIndices = getRandomIndices(rosterPlayers.length, lineupSlots.length);
  return { goalieIndex, playerIndices };
}

function initLineupState(mode) {
  const teamA = createRandomLineup();
  const teamB = createRandomLineup();
  state.lineups = { teamA, teamB };
  lineupScreen.classList.toggle("cpu", mode === "cpu");
  renderLineupUI();
}

function getTeamLineup(teamIndex) {
  if (!state.lineups) return null;
  return teamIndex === 0 ? state.lineups.teamA : state.lineups.teamB;
}

function cycleLineupSelection(teamIndex, slotKey, direction) {
  const lineup = getTeamLineup(teamIndex);
  if (!lineup) return;
  if (slotKey === "goalie") {
    const nextIndex =
      (lineup.goalieIndex + direction + rosterGoalkeepers.length) %
      rosterGoalkeepers.length;
    lineup.goalieIndex = nextIndex;
    return;
  }
  const slotIndex = lineupSlots.indexOf(slotKey);
  if (slotIndex === -1) return;
  const usedIds = new Set(
    lineup.playerIndices
      .map((index) => rosterPlayers[index]?.id)
      .filter(Boolean)
  );
  const currentIndex = lineup.playerIndices[slotIndex];
  if (currentIndex !== undefined) {
    usedIds.delete(rosterPlayers[currentIndex]?.id);
  }
  let nextIndex = currentIndex ?? 0;
  for (let i = 1; i <= rosterPlayers.length; i += 1) {
    const candidate =
      (nextIndex + direction * i + rosterPlayers.length) % rosterPlayers.length;
    if (!usedIds.has(rosterPlayers[candidate].id)) {
      nextIndex = candidate;
      break;
    }
  }
  lineup.playerIndices[slotIndex] = nextIndex;
}

function renderLineupUI() {
  if (!state.lineups) return;
  const slots = lineupScreen.querySelectorAll(".lineup-slot");
  slots.forEach((slot) => {
    const teamIndex = Number(slot.dataset.team);
    const lineup = getTeamLineup(teamIndex);
    if (!lineup) return;
    const statFills = slot.querySelectorAll(".lineup-stat-fill");
    const avatarEl = slot.querySelector(".lineup-avatar");
    if (slot.dataset.slot === "goalie") {
      const goalie = rosterGoalkeepers[lineup.goalieIndex];
      setLineupAvatar(avatarEl, goalie?.image);
      const stats = getLineupStats(goalie);
      statFills.forEach((fill) => {
        const key = fill.dataset.stat;
        fill.style.width = `${stats[key] ?? 0}%`;
      });
      return;
    }
    const slotIndex = lineupSlots.indexOf(slot.dataset.slot);
    if (slotIndex === -1) return;
    const playerIndex = lineup.playerIndices[slotIndex];
    const player = rosterPlayers[playerIndex];
    setLineupAvatar(avatarEl, player?.image);
    const stats = getLineupStats(player);
    statFills.forEach((fill) => {
      const key = fill.dataset.stat;
      fill.style.width = `${stats[key] ?? 0}%`;
    });
  });
}

function setLineupAvatar(avatarEl, imagePath) {
  if (!avatarEl || !imagePath) return;
  const record = getImage(imagePath);
  if (record.loaded) {
    avatarEl.style.backgroundImage = `url("${imagePath}")`;
  } else {
    avatarEl.style.backgroundImage = "";
  }
}

function getLineupStats(player) {
  if (!player) {
    return { hp: 0, pwr: 0, spd: 0 };
  }
  const maxHealth = player.maxHealth ?? 100;
  const strength = player.strength ?? 1;
  const speed = player.speed ?? 1;
  const hp = Math.min((maxHealth / 160) * 100, 100);
  const pwr = Math.min((strength / 1.4) * 100, 100);
  const spd = Math.min((speed / 1.3) * 100, 100);
  return { hp, pwr, spd };
}

function getLineups() {
  const ids = rosterPlayers.map((player) => player.id);
  const pickRandom = (count) =>
    [...ids].sort(() => Math.random() - 0.5).slice(0, count);
  if (state.mode === "1v1" || state.mode === "cpu") {
    if (state.lineups) {
      const teamAPlayers = state.lineups.teamA.playerIndices.map(
        (index) => rosterPlayers[index].id
      );
      const teamBPlayers =
        state.mode === "cpu"
          ? pickRandom(lineupSlots.length)
          : state.lineups.teamB.playerIndices.map(
              (index) => rosterPlayers[index].id
            );
      const goalieA = rosterGoalkeepers[state.lineups.teamA.goalieIndex]?.id;
      const goalieB =
        state.mode === "cpu"
          ? rosterGoalkeepers[Math.floor(Math.random() * rosterGoalkeepers.length)]
              ?.id
          : rosterGoalkeepers[state.lineups.teamB.goalieIndex]?.id;
      return {
        teamA: teamAPlayers,
        teamB: teamBPlayers,
        goalieA,
        goalieB,
      };
    }
  }
  if (state.mode === "quick") {
    const teamA = pickRandom(4);
    const teamB = pickRandom(4);
    return {
      teamA,
      teamB,
      goalieA: rosterGoalkeepers[0]?.id,
      goalieB: rosterGoalkeepers[1]?.id ?? rosterGoalkeepers[0]?.id,
    };
  }
  return {
    teamA: pickRandom(4),
    teamB: pickRandom(4),
    goalieA: rosterGoalkeepers[0]?.id,
    goalieB: rosterGoalkeepers[1]?.id ?? rosterGoalkeepers[0]?.id,
  };
}

function shouldRunCpuTurn() {
  return (
    state.started &&
    state.mode === "cpu" &&
    state.turn === 1 &&
    state.winner === null &&
    !state.dragging &&
    !state.turnInProgress &&
    allStopped() &&
    !state.goalPause
  );
}

function runCpuTurn() {
  const candidates = teams[1].players.filter(
    (player) => player.koTurns === 0 && player.paralyzedTurns === 0
  );
  if (candidates.length === 0) {
    return;
  }
  const targetPlayer = candidates.reduce((closest, player) => {
    const d = Math.hypot(player.x - ball.x, player.y - ball.y);
    if (!closest) return { player, d };
    return d < closest.d ? { player, d } : closest;
  }, null).player;

  const dx = ball.x - targetPlayer.x;
  const dy = ball.y - targetPlayer.y;
  const angle = Math.atan2(dy, dx);
  const power = physics.maxPower * 0.85;
  targetPlayer.vx = Math.cos(angle) * power;
  targetPlayer.vy = Math.sin(angle) * power;
  state.turnInProgress = true;
  state.selected = null;
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
  if (state.winner !== null) {
    state.dragging = false;
    state.dragStart = null;
    state.dragCurrent = null;
    state.selected = null;
    if (canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    return;
  }
  if (!state.dragging || !state.selected) return;
  const dx = state.dragCurrent.x - state.dragStart.x;
  const dy = state.dragCurrent.y - state.dragStart.y;
  const distance = Math.min(Math.hypot(dx, dy), DIMENSIONS.aimGuideMax);
  const angle = Math.atan2(dy, dx) + Math.PI;
  const speedFactor = state.selected.profile?.speed ?? 1;
  const power = (distance / DIMENSIONS.aimGuideMax) * physics.maxPower * speedFactor;

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

initUiAssetFallbacks();
setupPlayers();
resetTimers();
updateStatus();
update();

console.info("Assets placeholder:", assets);

function startGame() {
  state.started = true;
  document.body.classList.add("started");
  menuScreen.classList.add("hidden");
  startScreen.classList.add("hidden");
  lineupScreen.classList.add("hidden");
  hideGameOverOverlay();
  configureMatch(state.mode || "quick");
}

function showMenu() {
  startScreen.classList.add("hidden");
  menuScreen.classList.remove("hidden");
  lineupScreen.classList.add("hidden");
  hideGameOverOverlay();
}

function showLineupScreen(mode) {
  state.mode = mode;
  startScreen.classList.add("hidden");
  menuScreen.classList.add("hidden");
  lineupScreen.classList.remove("hidden");
  initLineupState(mode);
}

function configureMatch(mode) {
  state.mode = mode;
  state.playerCount = 4;
  hideGameOverOverlay();
  state.winner = null;
  state.turn = 0;
  state.goalPause = false;
  state.confetti = [];
  state.goldenGoalActive = false;
  hideCenterMessage();
  state.scores = [0, 0];
  scoreEl.textContent = "0 - 0";
  winEl.textContent = "";
  setupPlayers();
  resetTimers();
  resetPositions(null);
  showKickOffMessage();
}

startScreen.addEventListener("pointerdown", showMenu);
window.addEventListener("keydown", showMenu);
menuScreen.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-mode]");
  if (!button) return;
  state.mode = button.dataset.mode;
  if (state.mode === "quick") {
    startGame();
  } else {
    showLineupScreen(state.mode);
  }
});

lineupScreen.addEventListener("click", (event) => {
  const arrow = event.target.closest(".lineup-arrow");
  if (!arrow) return;
  const slot = event.target.closest(".lineup-slot");
  if (!slot) return;
  const teamIndex = Number(slot.dataset.team);
  if (state.mode === "cpu" && teamIndex === 1) return;
  const direction = Number(arrow.dataset.direction);
  cycleLineupSelection(teamIndex, slot.dataset.slot, direction);
  renderLineupUI();
});

lineupBack.addEventListener("click", () => {
  lineupScreen.classList.add("hidden");
  menuScreen.classList.remove("hidden");
});

lineupStart.addEventListener("click", () => {
  startGame();
});


playAgainBtn.addEventListener("click", () => {
  configureMatch(state.mode || "quick");
});

changeSquadBtn.addEventListener("click", () => {
  hideGameOverOverlay();
  if (state.mode === "1v1" || state.mode === "cpu") {
    showLineupScreen(state.mode);
    return;
  }
  menuScreen.classList.remove("hidden");
});
