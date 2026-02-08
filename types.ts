
export interface PlayerStats {
  name: string;
  face: string;
  hp: number;
  pwr: number;
  spd: number;
  stamina: number;
  img?: string;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  team: 0 | 1;
  radius: number;
  role: 'g' | 'f';
  face: string;
  stats: PlayerStats;
  currentStamina: number;
  img?: string;
  arrowColor: 'blue' | 'red';
  powerBoostUntil?: number; // timestamp
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  isExtra?: boolean;
}

export interface Confetti {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  opacity: number;
  angle: number;
  angVel: number;
}

export enum PowerUpType {
  POWER = '⚡',
  MULTI_BALL = '⚽⚽',
  SHRINK_GOAL = '🥅'
}

export interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  radius: number;
  spawnTime: number;
}

export interface Tactic {
  name: string;
  pos: { r: 'g' | 'f' }[];
  coords: { x: number; y: number }[];
}

export enum GameScreen {
  START = 'start',
  SETUP = 'setup',
  GAME = 'game',
  GAMEOVER = 'gameover'
}

export interface Scorer {
  team: 0 | 1;
  face: string;
  name: string;
  isOwnGoal?: boolean;
}

export interface GameState {
  scores: [number, number];
  turn: 0 | 1; // 0: Player, 1: AI
  matchTime: number; // in ms
  turnTimer: number; // in ms
  screen: GameScreen;
  currentTacticIdx: number;
  selectedPlayers: number[];
  turnInProgress: boolean;
  goalPause: boolean;
  isGoldenGoal: boolean;
  activeEffects: {
    shrinkGoalTeam: 0 | 1 | null;
    shrinkGoalUntil: number;
    multiBallUntil: number;
  };
  goalScorers: Scorer[];
}
