import React from 'react';
import { GameScreen, GameState, Tactic, Scorer } from '../types';
import { TACTICS, PLAYERS_DB, INITIAL_GAME_STATE } from '../constants';

interface ScreenProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export const StartScreen: React.FC<ScreenProps> = ({ setGameState }) => (
  <div className="absolute inset-0 bg-gradient-to-b from-[#1a2a44] to-[#0a0f15] z-50 flex flex-col items-center justify-center p-8">
    <div className="text-center mb-16 animate-pulse">
      <h1 className="text-7xl md:text-9xl font-black text-yellow-400 tracking-tighter shadow-yellow-500/50 drop-shadow-2xl italic">
        FUBOL
      </h1>
      <p className="text-xl md:text-3xl font-light text-white tracking-[0.5em] -mt-2 md:-mt-4 opacity-80 uppercase">PRO SLIDER</p>
    </div>
    <button
      onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.SETUP }))}
      className="bg-orange-500 hover:bg-orange-400 text-white font-black text-2xl md:text-3xl px-10 py-5 md:px-12 md:py-6 rounded-2xl border-b-8 border-orange-700 active:translate-y-1 active:border-b-4 transition-all duration-75 uppercase shadow-xl"
    >
      EMPEZAR PARTIDO
    </button>
  </div>
);

export const SetupScreen: React.FC<ScreenProps> = ({ gameState, setGameState }) => {
  const currentTactic = TACTICS[gameState.currentTacticIdx];

  const changeTactic = (dir: number) => {
    const nextIdx = (gameState.currentTacticIdx + dir + TACTICS.length) % TACTICS.length;
    setGameState(prev => ({ ...prev, currentTacticIdx: nextIdx }));
  };

  const rotatePlayer = (slotIdx: number, dir: number) => {
    const role = currentTactic.pos[slotIdx].r;
    const pool = PLAYERS_DB[role];
    const newSelected = [...gameState.selectedPlayers];
    newSelected[slotIdx] = (newSelected[slotIdx] + dir + pool.length) % pool.length;
    setGameState(prev => ({ ...prev, selectedPlayers: newSelected }));
  };

  return (
    <div className="absolute inset-0 bg-[#080c12]/95 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-[#1a1a1a] w-full max-w-5xl h-[95vh] md:h-[90vh] rounded-[1.5rem] md:rounded-[2.5rem] border-4 border-white/5 flex flex-col gap-4 md:gap-6 p-4 md:p-8 shadow-2xl overflow-hidden">
        <h2 className="text-2xl md:text-3xl font-black text-yellow-400 text-center uppercase tracking-widest">Pizarra Táctica</h2>
        
        <div className="relative flex-1 bg-green-700 rounded-2xl md:rounded-3xl border-4 border-black/20 overflow-hidden shadow-inner">
           <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" viewBox="0 0 800 500">
              <line x1="400" y1="0" x2="400" y2="500" stroke="white" strokeWidth="2" />
              <circle cx="400" cy="250" r="80" stroke="white" strokeWidth="2" fill="none" />
              <rect x="0" y="100" width="120" height="300" stroke="white" strokeWidth="2" fill="none" />
              <rect x="680" y="100" width="120" height="300" stroke="white" strokeWidth="2" fill="none" />
           </svg>

           {currentTactic.coords.map((c, i) => {
             const role = currentTactic.pos[i].r;
             const player = PLAYERS_DB[role][gameState.selectedPlayers[i] % PLAYERS_DB[role].length];
             return (
               <div
                 key={i}
                 className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                 style={{ left: `${(c.x / 800) * 100}%`, top: `${(c.y / 500) * 100}%` }}
               >
                 <div className="flex items-center gap-2 md:gap-4 z-10 mb-1">
                   <button 
                     onClick={() => rotatePlayer(i, -1)} 
                     className="w-10 h-10 md:w-11 md:h-11 bg-white/90 backdrop-blur-sm rounded-full text-black font-bold shadow-lg flex items-center justify-center text-2xl active:scale-90 active:bg-yellow-400 transition-all border border-white/20"
                   >
                     ‹
                   </button>

                   <div className={`w-14 h-14 md:w-18 md:h-18 rounded-full flex items-center justify-center text-3xl md:text-4xl shadow-xl border-4 ${role === 'g' ? 'border-orange-500 bg-orange-900/50' : 'border-blue-500 bg-blue-900/50'}`}>
                     {player.face}
                   </div>

                   <button 
                     onClick={() => rotatePlayer(i, 1)} 
                     className="w-10 h-10 md:w-11 md:h-11 bg-white/90 backdrop-blur-sm rounded-full text-black font-bold shadow-lg flex items-center justify-center text-2xl active:scale-90 active:bg-yellow-400 transition-all border border-white/20"
                   >
                     ›
                   </button>
                 </div>

                 <div className="mt-1 bg-black/85 px-3 py-1 rounded text-[9px] md:text-[10px] text-white font-bold backdrop-blur-sm whitespace-nowrap flex flex-col items-center shadow-lg border border-white/10">
                    <span className="uppercase">{player.name}</span>
                    <div className="flex gap-2 mt-0.5 opacity-90 scale-90">
                      <span className="text-yellow-400">P:{player.pwr}</span>
                      <span className="text-cyan-400">S:{player.spd}</span>
                    </div>
                 </div>
               </div>
             );
           })}
        </div>

        <div className="flex items-center justify-center gap-4 md:gap-8 py-2">
          <button onClick={() => changeTactic(-1)} className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center text-white text-2xl active:bg-white/10">‹</button>
          <span className="text-lg md:text-xl font-black text-white min-w-[160px] md:min-w-[200px] text-center uppercase tracking-tight">{currentTactic.name}</span>
          <button onClick={() => changeTactic(1)} className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center text-white text-2xl active:bg-white/10">›</button>
        </div>

        <button
          onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.GAME }))}
          className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black text-xl md:text-2xl py-5 md:py-6 rounded-2xl border-b-8 border-orange-700 active:translate-y-1 active:border-b-4 transition-all uppercase shadow-xl"
        >
          CONFIRMAR EQUIPO
        </button>
      </div>
    </div>
  );
};

export const GameOverScreen: React.FC<ScreenProps> = ({ gameState, setGameState }) => {
  const groupScorersForTeam = (teamWhoGotPoint: 0 | 1) => {
    const goalsEarnedByThisTeam = gameState.goalScorers.filter(s => {
      const teamWhoBenefited = s.isOwnGoal ? (s.team === 0 ? 1 : 0) : s.team;
      return teamWhoBenefited === teamWhoGotPoint;
    });

    const map = new Map<string, { face: string, name: string, count: number, isOwnGoal: boolean }>();
    goalsEarnedByThisTeam.forEach(s => {
      const key = `${s.name}-${s.face}-${s.isOwnGoal}`;
      if (map.has(key)) {
        map.get(key)!.count++;
      } else {
        map.set(key, { face: s.face, name: s.name, count: 1, isOwnGoal: !!s.isOwnGoal });
      }
    });
    return Array.from(map.values());
  };

  const team0PointsList = groupScorersForTeam(0);
  const team1PointsList = groupScorersForTeam(1);

  const resetGame = () => {
    setGameState(INITIAL_GAME_STATE);
  };

  return (
    <div className="absolute inset-0 bg-[#0a0f15]/98 z-50 flex flex-col items-center justify-center p-8 overflow-y-auto">
      <h2 className="text-3xl md:text-4xl font-black text-yellow-400 mb-4 tracking-widest uppercase">Resultado Final</h2>
      <h1 className="text-[15vmin] font-black text-white tracking-tighter italic mb-8">
        {gameState.scores[0]} — {gameState.scores[1]}
      </h1>

      <div className="w-full max-w-4xl grid grid-cols-2 gap-8 mb-12">
        <div className="flex flex-col items-end text-right">
          <h3 className="text-blue-400 font-bold uppercase tracking-widest mb-4 border-b border-blue-400/30 pb-1 w-full text-right">Goles Local</h3>
          <div className="flex flex-col gap-3">
            {team0PointsList.length > 0 ? team0PointsList.map((s, i) => (
              <div key={i} className="flex items-center gap-3 justify-end group">
                <span className={`text-xs font-bold uppercase group-hover:text-white transition-colors ${s.isOwnGoal ? 'text-red-400' : 'text-white/60'}`}>
                  {s.name} {s.isOwnGoal && <span className="text-[10px] ml-1">(PM)</span>}
                </span>
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl shadow-lg ${s.isOwnGoal ? 'bg-red-900/30 border-red-500/50' : 'bg-blue-900/30 border-blue-500/50'}`}>
                    {s.face}
                  </div>
                  {s.count > 1 && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-black font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
                      x{s.count}
                    </span>
                  )}
                </div>
              </div>
            )) : <span className="text-white/20 italic text-sm">Sin goles</span>}
          </div>
        </div>

        <div className="flex flex-col items-start text-left">
          <h3 className="text-red-400 font-bold uppercase tracking-widest mb-4 border-b border-red-400/30 pb-1 w-full">Goles Visitante</h3>
          <div className="flex flex-col gap-3">
            {team1PointsList.length > 0 ? team1PointsList.map((s, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl shadow-lg ${s.isOwnGoal ? 'bg-blue-900/30 border-blue-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
                    {s.face}
                  </div>
                  {s.count > 1 && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-black font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
                      x{s.count}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-bold uppercase group-hover:text-white transition-colors ${s.isOwnGoal ? 'text-blue-400' : 'text-white/60'}`}>
                  {s.name} {s.isOwnGoal && <span className="text-[10px] ml-1">(PM)</span>}
                </span>
              </div>
            )) : <span className="text-white/20 italic text-sm">Sin goles</span>}
          </div>
        </div>
      </div>

      <button
        onClick={resetGame}
        className="bg-white hover:bg-gray-200 text-black font-black text-xl md:text-2xl px-10 py-5 md:px-12 md:py-6 rounded-2xl transition-all uppercase shadow-2xl active:scale-95"
      >
        VOLVER AL INICIO
      </button>
    </div>
  );
};
