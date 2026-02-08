import { PlayerStats, Tactic, GameState, GameScreen } from './types';

export const DIM = {
  width: 1280,
  height: 720,
  padding: 60,
  goalW: 240,
  goalDepth: 40,
  pRadius: 34,
  bRadius: 18,
  areaW: 220,
  areaH: 400
};

export const PHYSICS = {
  friction: 0.972, 
  maxPower: 19,    
  wallBounciness: -0.75, 
  collisionElasticity: 0.88 
};

export const PLAYERS_DB: { g: PlayerStats[]; f: PlayerStats[] } = {
  g: [
    { name: "Muro", face: '😠', hp: 95, pwr: 25, spd: 70, stamina: 90 },
    { name: "Reflejo", face: '🧤', hp: 80, pwr: 20, spd: 95, stamina: 75 },
    { name: "Gigante", face: '🧔🏻', hp: 90, pwr: 35, spd: 60, stamina: 95 }
  ],
  f: [
    { name: "Roca", face: '🧔🏾', hp: 95, pwr: 55, spd: 40, stamina: 100 },
    { name: "Lince", face: '🧒🏻', hp: 60, pwr: 40, spd: 85, stamina: 65 },
    { name: "Mago", face: '👩🏽', hp: 75, pwr: 65, spd: 65, stamina: 80 },
    { name: "Torre", face: '👷', hp: 98, pwr: 50, spd: 35, stamina: 98 },
    { name: "Rayo", face: '⚡', hp: 55, pwr: 35, spd: 95, stamina: 50 },
    { name: "Cerebro", face: '🤓', hp: 70, pwr: 60, spd: 68, stamina: 85 },
    { name: "Furia", face: '👺', hp: 85, pwr: 68, spd: 55, stamina: 70 },
    { name: "Sombra", face: '🥷', hp: 65, pwr: 45, spd: 88, stamina: 75 },
    { name: "Capitán", face: '👨🏼‍✈️', hp: 88, pwr: 60, spd: 60, stamina: 90 }
  ]
};

export const TACTICS: Tactic[] = [
  {
    name: "2-2 EQUILIBRADA",
    pos: [{ r: 'g' }, { r: 'f' }, { r: 'f' }, { r: 'f' }, { r: 'f' }],
    coords: [{ x: 100, y: 250 }, { x: 300, y: 130 }, { x: 300, y: 370 }, { x: 550, y: 180 }, { x: 550, y: 320 }]
  },
  {
    name: "1-3 ATAQUE",
    pos: [{ r: 'g' }, { r: 'f' }, { r: 'f' }, { r: 'f' }, { r: 'f' }],
    coords: [{ x: 100, y: 250 }, { x: 350, y: 250 }, { x: 550, y: 100 }, { x: 620, y: 250 }, { x: 550, y: 400 }]
  },
  {
    name: "3-1 CERROJO",
    pos: [{ r: 'g' }, { r: 'f' }, { r: 'f' }, { r: 'f' }, { r: 'f' }],
    coords: [{ x: 100, y: 250 }, { x: 250, y: 100 }, { x: 220, y: 250 }, { x: 250, y: 400 }, { x: 580, y: 250 }]
  }
];

export const INITIAL_GAME_STATE: GameState = {
  scores: [0, 0],
  turn: 0,
  matchTime: 180000,
  turnTimer: 15000,
  screen: GameScreen.START,
  currentTacticIdx: 0,
  selectedPlayers: [0, 0, 1, 2, 3],
  turnInProgress: false,
  goalPause: false,
  isGoldenGoal: false,
  activeEffects: {
    shrinkGoalTeam: null,
    shrinkGoalUntil: 0,
    multiBallUntil: 0
  },
  goalScorers: []
};
