
import React, { useState } from 'react';
import { GameScreen, GameState } from './types';
import HUD from './components/HUD';
import GameCanvas from './components/GameCanvas';
import { StartScreen, SetupScreen, GameOverScreen } from './components/Screens';

export const INITIAL_GAME_STATE: GameState = {
  scores: [0, 0],
  turn: 0,
  matchTime: 180000, // 3 minutes
  turnTimer: 15000, // 15 seconds
  screen: GameScreen.START,
  currentTacticIdx: 0,
  selectedPlayers: [0, 0, 1, 2, 3], // Default selections
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

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);

  return (
    <div className="w-full h-[100dvh] bg-[#0a0f15] overflow-hidden flex flex-col">
      {/* Game Viewport Container */}
      <div className="relative flex-1 w-full flex items-center justify-center">
        {gameState.screen === GameScreen.START && (
          <StartScreen gameState={gameState} setGameState={setGameState} />
        )}
        
        {gameState.screen === GameScreen.SETUP && (
          <SetupScreen gameState={gameState} setGameState={setGameState} />
        )}
        
        {gameState.screen === GameScreen.GAMEOVER && (
          <GameOverScreen gameState={gameState} setGameState={setGameState} />
        )}

        {(gameState.screen === GameScreen.GAME || gameState.screen === GameScreen.GAMEOVER) && (
          <>
            <HUD gameState={gameState} />
            <GameCanvas gameState={gameState} setGameState={setGameState} />
          </>
        )}
      </div>

      {/* Footer / Info */}
      <div className="h-8 bg-black/50 text-[10px] text-white/30 flex items-center justify-center uppercase tracking-widest pointer-events-none">
        Tejo Fútbol Slider Pro © 2024 · Movimiento Orgánico
      </div>
    </div>
  );
};

export default App;
