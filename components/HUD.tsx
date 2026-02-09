import React from 'react';
import { GameState } from '../types';

interface HUDProps {
  gameState: GameState;
}

const HUD: React.FC<HUDProps> = ({ gameState }) => {
  const totalSec = Math.max(0, Math.ceil(gameState.matchTime / 1000));
  const timeStr = `${Math.floor(totalSec / 60)}:${(totalSec % 60).toString().padStart(2, '0')}`;
  
  const turnSec = Math.max(0, Math.ceil(gameState.turnTimer / 1000));
  const isDanger = turnSec <= 5;

  return (
    <div className="absolute top-4 left-4 pointer-events-none z-20">
      <div className="flex items-center gap-6 bg-[#0a141e]/85 border border-white/10 backdrop-blur-md px-8 py-3 rounded-full shadow-2xl">
        {/* Score Board */}
        <div className="flex items-center gap-4 pr-6 border-r border-white/20">
          <div 
            className={`w-3 h-3 rounded-full transition-transform duration-300 ${gameState.turn === 0 ? 'scale-150' : 'scale-100'} bg-[#3f85ff] shadow-[0_0_10px_#3f85ff]`}
          />
          <div className="text-3xl font-black text-white tracking-tighter tabular-nums">
            {gameState.scores[0]} — {gameState.scores[1]}
          </div>
          <div 
            className={`w-3 h-3 rounded-full transition-transform duration-300 ${gameState.turn === 1 ? 'scale-150' : 'scale-100'} bg-[#ff5757] shadow-[0_0_10px_#ff5757]`}
          />
        </div>

        {/* Clock & Turn */}
        <div className="flex items-center gap-4 text-cyan-200 font-mono text-xl">
          {gameState.isGoldenGoal ? (
            <span className="text-yellow-400 font-black animate-pulse uppercase tracking-widest text-sm">Gol de Oro</span>
          ) : (
            <span className="tabular-nums">{timeStr}</span>
          )}
          <div className={`px-3 py-0.5 rounded text-sm font-bold bg-white/10 transition-all duration-200 ${isDanger ? 'danger-timer' : 'text-yellow-400'}`}>
            {turnSec}s
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;
