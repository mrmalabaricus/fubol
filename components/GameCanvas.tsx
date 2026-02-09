import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DIM, PHYSICS, TACTICS, PLAYERS_DB } from '../constants';
import { Player, Ball, GameState, Confetti, GameScreen, PowerUp, PowerUpType, Scorer } from '../types';
import { resolveCollisions, checkBounds } from '../services/physics';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playersRef = useRef<Player[]>([]);
  const ballsRef = useRef<Ball[]>([]);
  const confettiRef = useRef<Confetti[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const ballImageRef = useRef<HTMLImageElement | null>(null);
  
  const [showGoldenGoalIntro, setShowGoldenGoalIntro] = useState(false);
  const [screenShake, setScreenShake] = useState(0);
  
  const interactionRef = useRef({
    dragging: false,
    dragStart: { x: 0, y: 0 },
    dragCurrent: { x: 0, y: 0 },
    selectedPlayerIdx: -1
  });
  const frameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const nextPowerUpSpawnRef = useRef<number>(Date.now() + 5000 + Math.random() * 10000);
  const lastTouchRef = useRef<Scorer | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = 'ball.png';
    img.onload = () => { ballImageRef.current = img; };
  }, []);

  const initGame = useCallback(() => {
    const tactic = TACTICS[gameState.currentTacticIdx];
    const newPlayers: Player[] = [];
    
    tactic.coords.forEach((c, i) => {
      const role = tactic.pos[i].r;
      const dbEntry = PLAYERS_DB[role][gameState.selectedPlayers[i] % PLAYERS_DB[role].length];
      newPlayers.push({
        x: (c.x / 800) * DIM.width,
        y: (c.y / 500) * DIM.height,
        vx: 0, vy: 0, team: 0, radius: DIM.pRadius, role: role,
        face: dbEntry.face, stats: dbEntry, currentStamina: dbEntry.stamina, arrowColor: 'blue'
      });
    });

    const aiTactic = TACTICS[Math.floor(Math.random() * TACTICS.length)];
    aiTactic.coords.forEach((c, i) => {
      const role = aiTactic.pos[i].r;
      const dbEntry = PLAYERS_DB[role][Math.floor(Math.random() * PLAYERS_DB[role].length)];
      newPlayers.push({
        x: DIM.width - ((c.x / 800) * DIM.width),
        y: (c.y / 500) * DIM.height,
        vx: 0, vy: 0, team: 1, radius: DIM.pRadius, role: role,
        face: dbEntry.face, stats: dbEntry, currentStamina: dbEntry.stamina, arrowColor: 'red'
      });
    });

    playersRef.current = newPlayers;
    ballsRef.current = [{ x: DIM.width / 2, y: DIM.height / 2, vx: 0, vy: 0, radius: DIM.bRadius, angle: 0 }];
    confettiRef.current = [];
    powerUpsRef.current = [];
    lastTouchRef.current = null;
  }, [gameState.currentTacticIdx, gameState.selectedPlayers]);

  useEffect(() => {
    if (gameState.screen === GameScreen.GAME) {
      initGame();
    }
  }, [gameState.screen, initGame]);

  useEffect(() => {
    if (gameState.isGoldenGoal && !gameState.goalPause) {
      setShowGoldenGoalIntro(true);
      const timer = setTimeout(() => setShowGoldenGoalIntro(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [gameState.isGoldenGoal, gameState.goalPause]);

  const createGoalConfetti = () => {
    const newConfetti: Confetti[] = [];
    for (let i = 0; i < 200; i++) {
      newConfetti.push({
        x: Math.random() * DIM.width,
        y: -Math.random() * 400,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 5,
        w: 8 + Math.random() * 12,
        h: 5 + Math.random() * 8,
        color: Math.random() > 0.3 ? '#ffffff' : '#f1f5f9',
        opacity: 0.8 + Math.random() * 0.2,
        angle: Math.random() * Math.PI * 2,
        angVel: (Math.random() - 0.5) * 0.2
      });
    }
    confettiRef.current = newConfetti;
  };

  const handleGoal = (teamScored: 0 | 1) => {
    const lastTouch = lastTouchRef.current;
    let finalScorer: Scorer | null = null;
    
    if (lastTouch) {
      finalScorer = { ...lastTouch, isOwnGoal: lastTouch.team !== teamScored };
    }

    setGameState(prev => ({
      ...prev,
      scores: teamScored === 0 ? [prev.scores[0] + 1, prev.scores[1]] : [prev.scores[0], prev.scores[1] + 1],
      goalPause: true,
      turnInProgress: false,
      goalScorers: finalScorer ? [...prev.goalScorers, finalScorer] : prev.goalScorers
    }));

    setScreenShake(20);
    createGoalConfetti();
    setTimeout(() => {
      setGameState(prev => {
        if (prev.isGoldenGoal) return { ...prev, goalPause: false, screen: GameScreen.GAMEOVER };
        return { ...prev, goalPause: false, turn: teamScored === 0 ? 1 : 0, turnTimer: 15000, turnInProgress: false };
      });
      initGame();
    }, 3000);
  };

  const update = (dt: number) => {
    const players = playersRef.current;
    const balls = ballsRef.current;
    const confetti = confettiRef.current;
    const now = Date.now();

    if (screenShake > 0) setScreenShake(prev => Math.max(0, prev - dt * 0.05));

    if (now > nextPowerUpSpawnRef.current && powerUpsRef.current.length < 2) spawnPowerUp();

    for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
      const pu = powerUpsRef.current[i];
      const collector = players.find(p => Math.hypot(p.x - pu.x, p.y - pu.y) < p.radius + pu.radius);
      if (collector) {
        applyPowerUp(collector, pu.type);
        powerUpsRef.current.splice(i, 1);
      } else if (now - pu.spawnTime > 12000) {
        powerUpsRef.current.splice(i, 1);
      }
    }

    if (gameState.activeEffects.multiBallUntil < now && balls.length > 1) {
      const extraIdx = balls.findIndex(b => b.isExtra);
      if (extraIdx !== -1 && Math.hypot(balls[extraIdx].vx, balls[extraIdx].vy) < 0.5) balls.splice(extraIdx, 1);
    }
    
    if (gameState.activeEffects.shrinkGoalUntil < now && gameState.activeEffects.shrinkGoalTeam !== null) {
      setGameState(prev => ({ ...prev, activeEffects: { ...prev.activeEffects, shrinkGoalTeam: null } }));
    }

    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i];
      c.y += c.vy; c.x += c.vx + Math.sin(lastTimeRef.current / 500 + c.y / 100);
      c.angle += c.angVel;
      if (c.y > DIM.height + 50) confetti.splice(i, 1);
    }

    if (gameState.goalPause) {
      balls.forEach(b => {
        const speed = Math.hypot(b.vx, b.vy);
        b.x += b.vx; b.y += b.vy; b.angle += speed * 0.05;
        b.vx *= 0.95; b.vy *= 0.95;
        checkBounds(b); 
      });
      return;
    }

    setGameState(prev => {
      let newTurnTimer = prev.turnTimer;
      let newTurn = prev.turn;
      
      if (!prev.turnInProgress) {
        newTurnTimer -= dt;
        if (newTurnTimer <= 0) {
          newTurn = prev.turn === 0 ? 1 : 0;
          newTurnTimer = 15000;
        }
      }

      if (prev.isGoldenGoal) return { ...prev, turnTimer: newTurnTimer, turn: newTurn };

      const newMatchTime = prev.matchTime - dt;
      if (newMatchTime <= 0) {
        if (prev.scores[0] === prev.scores[1]) return { ...prev, matchTime: 0, isGoldenGoal: true, turnTimer: 15000 };
        return { ...prev, matchTime: 0, screen: GameScreen.GAMEOVER };
      }
      
      return { ...prev, matchTime: newMatchTime, turnTimer: newTurnTimer, turn: newTurn };
    });

    let isAnythingMoving = false;
    players.forEach(p => {
      if (p.role === 'g') {
        const side = p.team === 0 ? 1 : -1;
        const goalLineX = p.team === 0 ? DIM.padding + p.radius : DIM.width - DIM.padding - p.radius;
        const fieldCenterY = DIM.height / 2;
        const closestBall = balls.reduce((prev, curr) => 
          Math.abs(goalLineX - curr.x) < Math.abs(goalLineX - prev.x) ? curr : prev
        );
        const distToBallX = Math.abs(goalLineX - closestBall.x);
        const targetX = goalLineX + (side * Math.max(0, 1 - (distToBallX / (DIM.width * 0.4))) * (DIM.areaW * 0.3));
        const areaRangeY = (DIM.areaH / 2) - p.radius;
        let targetY = fieldCenterY + (closestBall.y - fieldCenterY) * 0.45; 
        targetY = Math.max(fieldCenterY - areaRangeY, Math.min(fieldCenterY + areaRangeY, targetY));
        const smoothing = 0.03 + (p.stats.spd / 100) * 0.03; 
        p.x += (targetX - p.x) * smoothing; p.y += (targetY - p.y) * smoothing;
      } else {
        p.x += p.vx; p.y += p.vy; p.vx *= PHYSICS.friction; p.vy *= PHYSICS.friction;
        if (Math.hypot(p.vx, p.vy) > 0.2) { isAnythingMoving = true; p.currentStamina = Math.max(0, p.currentStamina - (Math.hypot(p.vx, p.vy) * 0.02)); }
        else p.currentStamina = Math.min(p.stats.stamina, p.currentStamina + 0.015);
      }
    });

    balls.forEach(b => {
      const speed = Math.hypot(b.vx, b.vy);
      b.x += b.vx; b.y += b.vy; b.angle += speed * 0.1; b.vx *= PHYSICS.friction; b.vy *= PHYSICS.friction;
      if (speed > 0.1) isAnythingMoving = true;
      const currentGoalW = (team: number) => (gameState.activeEffects.shrinkGoalTeam === team) ? DIM.goalW * 0.5 : DIM.goalW;
      if (b.x < DIM.padding - 5 && b.y > DIM.height/2 - currentGoalW(0)/2 && b.y < DIM.height/2 + currentGoalW(0)/2) { if (!gameState.goalPause) handleGoal(1); }
      if (b.x > DIM.width - DIM.padding + 5 && b.y > DIM.height/2 - currentGoalW(1)/2 && b.y < DIM.height/2 + currentGoalW(1)/2) { if (!gameState.goalPause) handleGoal(0); }
    });

    resolveCollisions(players, balls);
    balls.forEach(b => players.forEach(p => { if (Math.hypot(p.x - b.x, p.y - b.y) < p.radius + b.radius + 5) lastTouchRef.current = { team: p.team, face: p.face, name: p.stats.name }; }));
    players.forEach(p => checkBounds(p));
    balls.forEach(b => checkBounds(b));

    if (gameState.turnInProgress && !isAnythingMoving && !interactionRef.current.dragging) setGameState(prev => ({ ...prev, turnInProgress: false, turn: prev.turn === 0 ? 1 : 0, turnTimer: 15000 }));
    if (gameState.turn === 1 && !gameState.turnInProgress && !isAnythingMoving) runAI();
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    if (screenShake > 0) ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    
    ctx.clearRect(0, 0, DIM.width, DIM.height);
    const now = Date.now();
    ctx.fillStyle = "#2d5a27"; ctx.fillRect(0, 0, DIM.width, DIM.height);
    ctx.fillStyle = "#356a2e";
    for(let i=0; i<12; i++) if(i%2===0) ctx.fillRect(i*(DIM.width/12), 0, DIM.width/12, DIM.height);

    const p = DIM.padding;
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 3;
    ctx.strokeRect(p, p, DIM.width - p*2, DIM.height - p*2);
    ctx.strokeRect(p, DIM.height/2 - DIM.areaH/2, DIM.areaW, DIM.areaH);
    ctx.strokeRect(DIM.width - p - DIM.areaW, DIM.height/2 - DIM.areaH/2, DIM.areaW, DIM.areaH);
    ctx.beginPath(); ctx.moveTo(DIM.width/2, p); ctx.lineTo(DIM.width/2, DIM.height-p); ctx.stroke();
    ctx.beginPath(); ctx.arc(DIM.width/2, DIM.height/2, 100, 0, Math.PI*2); ctx.stroke();

    ctx.lineWidth = 8; ctx.strokeStyle = "rgba(255,255,255,0.8)";
    const gw0 = (gameState.activeEffects.shrinkGoalTeam === 0) ? DIM.goalW * 0.5 : DIM.goalW;
    ctx.strokeRect(p - DIM.goalDepth, DIM.height/2 - gw0/2, DIM.goalDepth, gw0);
    const gw1 = (gameState.activeEffects.shrinkGoalTeam === 1) ? DIM.goalW * 0.5 : DIM.goalW;
    ctx.strokeRect(DIM.width - p, DIM.height/2 - gw1/2, DIM.goalDepth, gw1);

    powerUpsRef.current.forEach(pu => {
      ctx.save();
      const pulse = Math.sin(now / 200) * 4;
      ctx.shadowBlur = 15; ctx.shadowColor = "white";
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.beginPath(); ctx.arc(pu.x, pu.y, pu.radius + pulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "white"; ctx.font = "24px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(pu.type, pu.x, pu.y + 8);
      ctx.restore();
    });

    playersRef.current.forEach((pl, idx) => {
      ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.beginPath(); ctx.arc(pl.x, pl.y+4, pl.radius, 0, Math.PI*2); ctx.fill();
      if (pl.powerBoostUntil && pl.powerBoostUntil > now) {
        ctx.beginPath(); ctx.arc(pl.x, pl.y, pl.radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 0, 0.4)"; ctx.lineWidth = 4; ctx.stroke();
      }
      if (gameState.turn === 0 && !gameState.turnInProgress && pl.team === 0) {
        ctx.beginPath(); const pulse = Math.sin(lastTimeRef.current / 200) * 4 + 4;
        ctx.arc(pl.x, pl.y, pl.radius + 6 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 235, 59, 0.4)`; ctx.lineWidth = 3; ctx.stroke();
      }
      const barW = pl.radius * 1.6, barH = 5, barY = pl.y - pl.radius - 12, sPerc = pl.currentStamina / pl.stats.stamina;
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(pl.x - barW/2, barY, barW, barH);
      ctx.fillStyle = sPerc > 0.5 ? "#4ade80" : sPerc > 0.2 ? "#facc15" : "#f87171";
      ctx.fillRect(pl.x - barW/2, barY, barW * sPerc, barH);
      ctx.fillStyle = pl.team === 0 ? "#2563eb" : "#dc2626";
      ctx.beginPath(); ctx.arc(pl.x, pl.y, pl.radius, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "white"; ctx.font = "bold 28px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(pl.face, pl.x, pl.y + 10);
      const isSelected = interactionRef.current.selectedPlayerIdx === idx;
      ctx.strokeStyle = isSelected ? "#facc15" : "white"; ctx.lineWidth = isSelected ? 5 : 2; ctx.stroke();
    });

    ballsRef.current.forEach(b => {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle);
      if (ballImageRef.current) ctx.drawImage(ballImageRef.current, -b.radius, -b.radius, b.radius*2, b.radius*2);
      else { ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(0, 0, b.radius, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.restore();
    });

    if (interactionRef.current.dragging && interactionRef.current.selectedPlayerIdx !== -1) {
      const { dragStart, dragCurrent, selectedPlayerIdx } = interactionRef.current;
      const pl = playersRef.current[selectedPlayerIdx];
      const dx = dragStart.x - dragCurrent.x, dy = dragStart.y - dragCurrent.y, dist = Math.hypot(dx, dy);
      if (dist > 10) {
        const angle = Math.atan2(dy, dx), pMult = (pl.powerBoostUntil && pl.powerBoostUntil > now) ? 1.5 : 1.0;
        const pScale = Math.min((dist / 9) * (pl.stats.spd / 80) * (0.5 + 0.5 * (pl.currentStamina / pl.stats.stamina)) * pMult, PHYSICS.maxPower);
        const dotCount = 14, spacing = (pScale * 9.5); 
        ctx.save();
        for (let i = 1; i <= dotCount; i++) {
          const t = i / dotCount, px = pl.x + Math.cos(angle) * spacing * t * (1 + t * 0.4), py = pl.y + Math.sin(angle) * spacing * t * (1 + t * 0.4);
          const hue = 200 - (pScale / PHYSICS.maxPower) * 200; 
          ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${0.8 * (1 - t)})`;
          ctx.beginPath(); ctx.arc(px, py, 6 * (1 - t * 0.6), 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    }
    confettiRef.current.forEach(c => { ctx.save(); ctx.globalAlpha = c.opacity; ctx.translate(c.x, c.y); ctx.rotate(c.angle); ctx.fillStyle = c.color; ctx.fillRect(-c.w/2, -c.h/2, c.w, c.h); ctx.restore(); });
    ctx.restore();
  };

  const spawnPowerUp = () => {
    const types = [PowerUpType.POWER, PowerUpType.MULTI_BALL, PowerUpType.SHRINK_GOAL], type = types[Math.floor(Math.random() * types.length)];
    const margin = DIM.padding + 100, puRadius = 25;
    let spawnX = 0, spawnY = 0, attempts = 0, foundSpot = false;
    while (!foundSpot && attempts < 20) {
      spawnX = margin + Math.random() * (DIM.width - margin * 2); spawnY = margin + Math.random() * (DIM.height - margin * 2);
      if (!playersRef.current.some(p => Math.hypot(p.x - spawnX, p.y - spawnY) < p.radius + puRadius + 60) && !ballsRef.current.some(b => Math.hypot(b.x - spawnX, b.y - spawnY) < b.radius + puRadius + 60)) foundSpot = true;
      attempts++;
    }
    if (foundSpot) powerUpsRef.current.push({ x: spawnX, y: spawnY, type, radius: puRadius, spawnTime: Date.now() });
    nextPowerUpSpawnRef.current = Date.now() + 8000 + Math.random() * 12000;
  };

  const applyPowerUp = (player: Player, type: PowerUpType) => {
    const now = Date.now();
    if (type === PowerUpType.POWER) player.powerBoostUntil = now + 10000;
    else if (type === PowerUpType.MULTI_BALL) {
      setGameState(prev => ({ ...prev, activeEffects: { ...prev.activeEffects, multiBallUntil: now + 12000 } }));
      if (ballsRef.current.length === 1) ballsRef.current.push({ x: DIM.width / 2, y: DIM.height / 2, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, radius: DIM.bRadius, angle: 0, isExtra: true });
    } else if (type === PowerUpType.SHRINK_GOAL) setGameState(prev => ({ ...prev, activeEffects: { ...prev.activeEffects, shrinkGoalTeam: player.team, shrinkGoalUntil: now + 15000 } }));
  };

  const runAI = () => {
    if (gameState.turn !== 1 || gameState.turnInProgress || gameState.goalPause) return;
    const cpuPlayers = playersRef.current.filter(p => p.team === 1 && p.role !== 'g');
    if (cpuPlayers.length === 0) return;
    const ball = ballsRef.current[0], p = cpuPlayers.reduce((prev, curr) => Math.hypot(curr.x - ball.x, curr.y - ball.y) < Math.hypot(prev.x - ball.x, prev.y - ball.y) ? curr : prev);
    const angleBallToGoal = Math.atan2(DIM.height/2 - ball.y, DIM.padding - ball.x), shootAngle = Math.atan2(ball.y - Math.sin(angleBallToGoal)*20 - p.y, ball.x - Math.cos(angleBallToGoal)*20 - p.x);
    const force = Math.min(8 + Math.hypot(ball.x - p.x, ball.y - p.y) / 35, PHYSICS.maxPower - 1) * (0.5 + 0.5 * (p.currentStamina / p.stats.stamina)) * ((p.powerBoostUntil && p.powerBoostUntil > Date.now()) ? 1.5 : 1.0);
    p.vx = Math.cos(shootAngle) * force; p.vy = Math.sin(shootAngle) * force; p.currentStamina = Math.max(0, p.currentStamina - 5);
    setGameState(prev => ({ ...prev, turnInProgress: true }));
  };

  const loop = useCallback((time: number) => {
    const dt = Math.min(time - lastTimeRef.current, 32);
    lastTimeRef.current = time;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && (gameState.screen === GameScreen.GAME || gameState.goalPause)) { update(dt); draw(ctx); }
    frameIdRef.current = requestAnimationFrame(loop);
  }, [gameState.screen, gameState.goalPause, gameState.turnInProgress, gameState.isGoldenGoal, gameState.activeEffects, screenShake]);

  useEffect(() => { frameIdRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(frameIdRef.current); }, [loop]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cX = 'touches' in e ? e.touches[0].clientX : e.clientX, cY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (cX - rect.left) * (DIM.width / rect.width), y: (cY - rect.top) * (DIM.height / rect.height) };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState.turn !== 0 || gameState.turnInProgress || gameState.goalPause) return;
    const pos = getPos(e);
    let idx = playersRef.current.findIndex(p => Math.hypot(p.x - pos.x, p.y - pos.y) < p.radius * 2 && p.team === 0);
    if (idx === -1) playersRef.current.forEach((p, i) => { if (p.team === 0 && p.role !== 'g' && Math.hypot(p.x - pos.x, p.y - pos.y) < 250) idx = i; });
    if (idx !== -1) interactionRef.current = { dragging: true, dragStart: pos, dragCurrent: pos, selectedPlayerIdx: idx };
  };

  const handleEnd = () => {
    if (interactionRef.current.dragging) {
      const { dragStart, dragCurrent, selectedPlayerIdx } = interactionRef.current;
      const dx = dragStart.x - dragCurrent.x, dy = dragStart.y - dragCurrent.y;
      if (Math.hypot(dx, dy) > 10) {
        const p = playersRef.current[selectedPlayerIdx], pMult = (p.powerBoostUntil && p.powerBoostUntil > Date.now()) ? 1.5 : 1.0;
        const pScale = Math.min((Math.hypot(dx, dy) / 9) * (p.stats.spd / 80) * (0.5 + 0.5 * (p.currentStamina / p.stats.stamina)) * pMult, PHYSICS.maxPower);
        p.vx = Math.cos(Math.atan2(dy, dx)) * pScale; p.vy = Math.sin(Math.atan2(dy, dx)) * pScale; p.currentStamina = Math.max(0, p.currentStamina - 6);
        setGameState(prev => ({ ...prev, turnInProgress: true }));
      }
      interactionRef.current.dragging = false; interactionRef.current.selectedPlayerIdx = -1;
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} width={DIM.width} height={DIM.height} className="max-w-full max-h-full object-contain cursor-crosshair shadow-2xl" onMouseDown={handleStart} onMouseMove={(e) => { if (interactionRef.current.dragging) interactionRef.current.dragCurrent = getPos(e); }} onMouseUp={handleEnd} onMouseLeave={handleEnd} onTouchStart={handleStart} onTouchMove={(e) => { if (interactionRef.current.dragging) interactionRef.current.dragCurrent = getPos(e); }} onTouchEnd={handleEnd} />
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500 transform ${gameState.goalPause ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        <div className="flex flex-col items-center">
          <h2 className="text-[14rem] font-black text-white italic uppercase tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] [text-shadow:_-4px_4px_0_#eab308,_4px_-4px_0_#eab308]">¡GOOOOL!</h2>
          {gameState.isGoldenGoal && <p className="text-5xl text-yellow-400 font-black -mt-8 animate-bounce tracking-widest italic [text-shadow:_-2px_2px_0_#000,2px_-2px_0_#000]">¡GOL DE ORO!</p>}
        </div>
      </div>
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700 transform ${showGoldenGoalIntro ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}`}>
         <div className="flex flex-col items-center">
           <h3 className="text-5xl font-black text-white mb-2 uppercase tracking-[1em] drop-shadow-2xl [text-shadow:_-3px_3px_0_#000]">¡EMPATE!</h3>
           <h2 className="text-[12rem] font-black text-yellow-400 italic uppercase tracking-tighter drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] [text-shadow:_-6px_6px_0_#fff]">GOL DE ORO</h2>
           <p className="text-2xl text-white font-bold mt-4 tracking-[0.3em] uppercase opacity-90 [text-shadow:_-2px_2px_0_#000]">El próximo gol define el encuentro</p>
         </div>
      </div>
    </div>
  );
};

export default GameCanvas;
