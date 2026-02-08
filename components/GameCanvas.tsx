
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
  // PLACEHOLDER PARA DISEÑO: Referencias a imágenes de jugadores y fondos de campo
  // const pitchImageRef = useRef<HTMLImageElement | null>(null);
  // const team0PlayerRef = useRef<HTMLImageElement | null>(null);
  // const team1PlayerRef = useRef<HTMLImageElement | null>(null);
  
  const [showGoldenGoalIntro, setShowGoldenGoalIntro] = useState(false);
  
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

  // Asset loading
  useEffect(() => {
    // PLACEHOLDER PARA DISEÑO: Cargar assets finales de ball.png
    const img = new Image();
    img.src = 'ball.png';
    img.onload = () => { ballImageRef.current = img; };
  }, []);

  // Initialize game objects
  const initGame = useCallback(() => {
    const tactic = TACTICS[gameState.currentTacticIdx];
    const newPlayers: Player[] = [];
    
    // Player Team
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

    // AI Team
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

  // Manejo de la transición a Gol de Oro
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
      finalScorer = {
        ...lastTouch,
        isOwnGoal: lastTouch.team !== teamScored
      };
    }

    setGameState(prev => ({
      ...prev,
      scores: teamScored === 0 ? [prev.scores[0] + 1, prev.scores[1]] : [prev.scores[0], prev.scores[1] + 1],
      goalPause: true,
      turnInProgress: false,
      goalScorers: finalScorer ? [...prev.goalScorers, finalScorer] : prev.goalScorers
    }));

    createGoalConfetti();
    setTimeout(() => {
      setGameState(prev => {
        if (prev.isGoldenGoal) {
          return { ...prev, goalPause: false, screen: GameScreen.GAMEOVER };
        }
        return { 
          ...prev, 
          goalPause: false, 
          turn: teamScored === 0 ? 1 : 0, 
          turnTimer: 15000,
          turnInProgress: false
        };
      });
      initGame();
    }, 3000);
  };

  const spawnPowerUp = () => {
    const types = [PowerUpType.POWER, PowerUpType.MULTI_BALL, PowerUpType.SHRINK_GOAL];
    const type = types[Math.floor(Math.random() * types.length)];
    const margin = DIM.padding + 100;
    const puRadius = 25;
    
    let spawnX = 0;
    let spawnY = 0;
    let attempts = 0;
    let foundSpot = false;

    while (!foundSpot && attempts < 20) {
      spawnX = margin + Math.random() * (DIM.width - margin * 2);
      spawnY = margin + Math.random() * (DIM.height - margin * 2);
      
      const collidesWithPlayer = playersRef.current.some(p => Math.hypot(p.x - spawnX, p.y - spawnY) < p.radius + puRadius + 50);
      const collidesWithBall = ballsRef.current.some(b => Math.hypot(b.x - spawnX, b.y - spawnY) < b.radius + puRadius + 50);
      
      if (!collidesWithPlayer && !collidesWithBall) {
        foundSpot = true;
      }
      attempts++;
    }

    if (foundSpot) {
      const pu: PowerUp = {
        x: spawnX,
        y: spawnY,
        type,
        radius: puRadius,
        spawnTime: Date.now()
      };
      powerUpsRef.current.push(pu);
    }
    
    nextPowerUpSpawnRef.current = Date.now() + 8000 + Math.random() * 12000;
  };

  const applyPowerUp = (player: Player, type: PowerUpType) => {
    const now = Date.now();
    switch (type) {
      case PowerUpType.POWER:
        player.powerBoostUntil = now + 10000;
        break;
      case PowerUpType.MULTI_BALL:
        setGameState(prev => ({ ...prev, activeEffects: { ...prev.activeEffects, multiBallUntil: now + 12000 } }));
        if (ballsRef.current.length === 1) {
          ballsRef.current.push({
            x: DIM.width / 2,
            y: DIM.height / 2,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            radius: DIM.bRadius,
            angle: 0,
            isExtra: true
          });
        }
        break;
      case PowerUpType.SHRINK_GOAL:
        setGameState(prev => ({
          ...prev,
          activeEffects: {
            ...prev.activeEffects,
            shrinkGoalTeam: player.team,
            shrinkGoalUntil: now + 15000
          }
        }));
        break;
    }
  };

  const runAI = () => {
    if (gameState.turn !== 1 || gameState.turnInProgress || gameState.goalPause) return;
    const cpuPlayers = playersRef.current.filter(p => p.team === 1 && p.role !== 'g');
    if (cpuPlayers.length === 0) return;

    const ball = ballsRef.current.reduce((prev, curr) => {
      return curr;
    }, ballsRef.current[0]);
    
    const p = cpuPlayers.reduce((prev, curr) => 
      Math.hypot(curr.x - ball.x, curr.y - ball.y) < Math.hypot(prev.x - ball.x, prev.y - ball.y) ? curr : prev
    );

    const targetX = DIM.padding;
    const targetY = DIM.height / 2;
    const angleBallToGoal = Math.atan2(targetY - ball.y, targetX - ball.x);
    const idealHitX = ball.x - Math.cos(angleBallToGoal) * 20;
    const idealHitY = ball.y - Math.sin(angleBallToGoal) * 20;

    const shootAngle = Math.atan2(idealHitY - p.y, idealHitX - p.x);
    const dist = Math.hypot(idealHitX - p.x, idealHitY - p.y);
    
    const staminaFactor = 0.5 + 0.5 * (p.currentStamina / p.stats.stamina);
    const powerMultiplier = (p.powerBoostUntil && p.powerBoostUntil > Date.now()) ? 1.5 : 1.0;
    const force = Math.min(8 + dist / 35, PHYSICS.maxPower - 1) * staminaFactor * powerMultiplier;

    p.vx = Math.cos(shootAngle) * force;
    p.vy = Math.sin(shootAngle) * force;
    p.currentStamina = Math.max(0, p.currentStamina - 5);
    setGameState(prev => ({ ...prev, turnInProgress: true }));
  };

  const update = (dt: number) => {
    const players = playersRef.current;
    const balls = ballsRef.current;
    const confetti = confettiRef.current;
    const now = Date.now();

    if (now > nextPowerUpSpawnRef.current && powerUpsRef.current.length < 2) {
      spawnPowerUp();
    }

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
      if (extraIdx !== -1) {
        const eb = balls[extraIdx];
        if (Math.hypot(eb.vx, eb.vy) < 0.5) {
          balls.splice(extraIdx, 1);
        }
      }
    }
    if (gameState.activeEffects.shrinkGoalUntil < now && gameState.activeEffects.shrinkGoalTeam !== null) {
      setGameState(prev => ({ ...prev, activeEffects: { ...prev.activeEffects, shrinkGoalTeam: null } }));
    }

    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i];
      c.y += c.vy;
      c.x += c.vx + Math.sin(lastTimeRef.current / 500 + c.y / 100);
      c.angle += c.angVel;
      if (c.y > DIM.height + 50) confetti.splice(i, 1);
    }

    if (gameState.goalPause) {
      balls.forEach(b => {
        const speed = Math.hypot(b.vx, b.vy);
        b.x += b.vx; b.y += b.vy;
        b.angle += speed * 0.05;
        b.vx *= 0.95; b.vy *= 0.95;
        checkBounds(b); 
      });
      return;
    }

    setGameState(prev => {
      if (prev.isGoldenGoal) {
        let newTurnTimer = prev.turnTimer;
        let newTurn = prev.turn;
        if (!prev.turnInProgress) {
          newTurnTimer -= dt;
          if (newTurnTimer <= 0) {
            newTurn = prev.turn === 0 ? 1 : 0;
            newTurnTimer = 15000;
          }
        }
        return { ...prev, turnTimer: newTurnTimer, turn: newTurn };
      }

      const newMatchTime = prev.matchTime - dt;
      if (newMatchTime <= 0) {
        if (prev.scores[0] === prev.scores[1]) {
           return { ...prev, matchTime: 0, isGoldenGoal: true, turnTimer: 15000 };
        }
        return { ...prev, matchTime: 0, screen: GameScreen.GAMEOVER };
      }
      
      let newTurnTimer = prev.turnTimer;
      let newTurn = prev.turn;
      
      if (!prev.turnInProgress) {
        newTurnTimer -= dt;
        if (newTurnTimer <= 0) {
          newTurn = prev.turn === 0 ? 1 : 0;
          newTurnTimer = 15000;
        }
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
        const closeness = Math.max(0, 1 - (distToBallX / (DIM.width * 0.4)));
        const targetX = goalLineX + (side * closeness * (DIM.areaW * 0.3));
        const areaRangeY = (DIM.areaH / 2) - p.radius;
        
        let targetY = fieldCenterY + (closestBall.y - fieldCenterY) * 0.45; 
        if (distToBallX > DIM.width * 0.85) targetY = fieldCenterY;
        
        targetY = Math.max(fieldCenterY - areaRangeY, Math.min(fieldCenterY + areaRangeY, targetY));
        const smoothing = 0.03 + (p.stats.spd / 100) * 0.03; 
        p.x += (targetX - p.x) * smoothing;
        p.y += (targetY - p.y) * smoothing;
      } else {
        p.x += p.vx; p.y += p.vy;
        p.vx *= PHYSICS.friction; p.vy *= PHYSICS.friction;
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > 0.2) {
            isAnythingMoving = true;
            p.currentStamina = Math.max(0, p.currentStamina - (speed * 0.02));
        } else {
            p.currentStamina = Math.min(p.stats.stamina, p.currentStamina + 0.015);
        }
      }
    });

    balls.forEach(b => {
      const speed = Math.hypot(b.vx, b.vy);
      b.x += b.vx; b.y += b.vy;
      b.angle += speed * 0.1;
      b.vx *= PHYSICS.friction; b.vy *= PHYSICS.friction;
      if (speed > 0.1) isAnythingMoving = true;
      
      const p = DIM.padding;
      const currentGoalW = (team: number) => (gameState.activeEffects.shrinkGoalTeam === team) ? DIM.goalW * 0.5 : DIM.goalW;

      const gW0 = currentGoalW(0);
      if (b.x < p - 5 && b.y > DIM.height/2 - gW0/2 && b.y < DIM.height/2 + gW0/2) {
          if (!gameState.goalPause) handleGoal(1); 
      }
      const gW1 = currentGoalW(1);
      if (b.x > DIM.width - p + 5 && b.y > DIM.height/2 - gW1/2 && b.y < DIM.height/2 + gW1/2) {
          if (!gameState.goalPause) handleGoal(0); 
      }
    });

    resolveCollisions(players, balls);

    balls.forEach(b => {
      players.forEach(p => {
        const dist = Math.hypot(p.x - b.x, p.y - b.y);
        if (dist < p.radius + b.radius + 5) {
          lastTouchRef.current = { team: p.team, face: p.face, name: p.stats.name };
        }
      });
    });

    players.forEach(p => checkBounds(p));
    balls.forEach(b => checkBounds(b));

    if (gameState.turnInProgress && !isAnythingMoving && !interactionRef.current.dragging) {
      setGameState(prev => ({ ...prev, turnInProgress: false, turn: prev.turn === 0 ? 1 : 0, turnTimer: 15000 }));
    }

    if (gameState.turn === 1 && !gameState.turnInProgress && !isAnythingMoving) {
      runAI();
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, DIM.width, DIM.height);
    const now = Date.now();
    
    // PLACEHOLDER PARA DISEÑO: Sustituir rectángulos de fondo por pitch_texture.png
    ctx.fillStyle = "#458243";
    ctx.fillRect(0, 0, DIM.width, DIM.height);
    ctx.fillStyle = "#4c8c4a";
    for(let i=0; i<10; i++) if(i%2===0) ctx.fillRect(i*(DIM.width/10), 0, DIM.width/10, DIM.height);

    const p = DIM.padding;
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 4;
    ctx.strokeRect(p, p, DIM.width - p*2, DIM.height - p*2);
    ctx.strokeRect(p, DIM.height/2 - DIM.areaH/2, DIM.areaW, DIM.areaH);
    ctx.strokeRect(DIM.width - p - DIM.areaW, DIM.height/2 - DIM.areaH/2, DIM.areaW, DIM.areaH);
    ctx.beginPath(); ctx.moveTo(DIM.width/2, p); ctx.lineTo(DIM.width/2, DIM.height-p); ctx.stroke();
    ctx.beginPath(); ctx.arc(DIM.width/2, DIM.height/2, 100, 0, Math.PI*2); ctx.stroke();

    const currentGoalW = (team: number) => (gameState.activeEffects.shrinkGoalTeam === team) ? DIM.goalW * 0.5 : DIM.goalW;
    
    // PLACEHOLDER PARA DISEÑO: Renderizar assets de portería final
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    const gw0 = currentGoalW(0);
    ctx.strokeRect(p - DIM.goalDepth, DIM.height/2 - gw0/2, DIM.goalDepth, gw0);
    const gw1 = currentGoalW(1);
    ctx.strokeRect(DIM.width - p, DIM.height/2 - gw1/2, DIM.goalDepth, gw1);

    powerUpsRef.current.forEach(pu => {
      // PLACEHOLDER PARA DISEÑO: Sustituir por iconos de assets reales (powerup_multi.png, etc)
      ctx.save();
      const pulse = Math.sin(now / 200) * 5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = "white";
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.beginPath(); ctx.arc(pu.x, pu.y, pu.radius + pulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "white"; ctx.font = "24px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(pu.type, pu.x, pu.y + 8);
      ctx.restore();
    });

    playersRef.current.forEach((pl, idx) => {
      // Sombra dinámica
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath(); ctx.arc(pl.x, pl.y+4, pl.radius, 0, Math.PI*2); ctx.fill();

      // Efecto de PowerUp activo
      if (pl.powerBoostUntil && pl.powerBoostUntil > now) {
        ctx.beginPath();
        ctx.arc(pl.x, pl.y, pl.radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 0, 0.6)";
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Indicador de turno / selección
      if (gameState.turn === 0 && !gameState.turnInProgress && pl.team === 0) {
        ctx.beginPath();
        const pulse = Math.sin(lastTimeRef.current / 200) * 5 + 5;
        ctx.arc(pl.x, pl.y, pl.radius + 6 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 235, 59, 0.5)`;
        ctx.lineWidth = 3; ctx.stroke();
      }

      // PLACEHOLDER PARA DISEÑO: Barra de estamina personalizada
      const barW = pl.radius * 1.6;
      const barH = 6;
      const barY = pl.y - pl.radius - 14; 
      const sPerc = pl.currentStamina / pl.stats.stamina;

      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(pl.x - barW/2, barY, barW, barH);
      ctx.fillStyle = sPerc > 0.5 ? "#4ade80" : sPerc > 0.2 ? "#facc15" : "#f87171";
      ctx.fillRect(pl.x - barW/2, barY, barW * sPerc, barH);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1; ctx.strokeRect(pl.x - barW/2, barY, barW, barH);

      // Indicador de equipo (Triángulo)
      ctx.fillStyle = pl.team === 0 ? "#3f85ff" : "#ff5757";
      ctx.beginPath();
      const arrowBaseY = barY - 14;
      ctx.moveTo(pl.x, arrowBaseY);
      ctx.lineTo(pl.x - 12, arrowBaseY - 16);
      ctx.lineTo(pl.x + 12, arrowBaseY - 16);
      ctx.fill();

      // Cuerpo del disco del jugador
      // PLACEHOLDER PARA DISEÑO: Sustituir círculo por player_team0.png o player_team1.png
      ctx.fillStyle = pl.team === 0 ? "#3f85ff" : "#ff5757";
      ctx.beginPath(); ctx.arc(pl.x, pl.y, pl.radius, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "white"; ctx.font = "bold 28px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(pl.face, pl.x, pl.y + 10);

      const isSelected = interactionRef.current.selectedPlayerIdx === idx;
      ctx.strokeStyle = isSelected ? "#ffeb3b" : "white";
      ctx.lineWidth = isSelected ? 6 : 3;
      ctx.stroke();
    });

    ballsRef.current.forEach(b => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);
      if (ballImageRef.current) {
        ctx.drawImage(ballImageRef.current, -b.radius, -b.radius, b.radius*2, b.radius*2);
      } else {
        // Fallback visual si no carga la imagen
        ctx.fillStyle = "white";
        ctx.beginPath(); ctx.arc(0, 0, b.radius, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.restore();
    });

    // Línea de tiro / Guía táctica
    if (interactionRef.current.dragging && interactionRef.current.selectedPlayerIdx !== -1) {
      const { dragStart, dragCurrent, selectedPlayerIdx } = interactionRef.current;
      const pl = playersRef.current[selectedPlayerIdx];
      const dx = dragStart.x - dragCurrent.x;
      const dy = dragStart.y - dragCurrent.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 10) {
        const angle = Math.atan2(dy, dx);
        const staminaFactor = 0.5 + 0.5 * (pl.currentStamina / pl.stats.stamina);
        const powerMultiplier = (pl.powerBoostUntil && pl.powerBoostUntil > now) ? 1.5 : 1.0;
        const powerScale = Math.min((dist / 9) * (pl.stats.spd / 80) * staminaFactor * powerMultiplier, PHYSICS.maxPower);
        
        // PLACEHOLDER PARA DISEÑO: Sustituir puntos por asset de flecha direccional o dots_style.png
        const dotCount = 12;
        const spacing = (powerScale * 8.5); 
        
        ctx.save();
        for (let i = 1; i <= dotCount; i++) {
          const t = i / dotCount;
          const px = pl.x + Math.cos(angle) * spacing * t * (1 + t * 0.4); 
          const py = pl.y + Math.sin(angle) * spacing * t * (1 + t * 0.4);
          const opacity = 0.8 * (1 - t);
          const size = 6 * (1 - t * 0.5);
          const hue = 180 - (powerScale / PHYSICS.maxPower) * 180; 
          ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${opacity})`;
          ctx.shadowBlur = 15;
          ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.6)`;
          ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    }

    confettiRef.current.forEach(c => {
      ctx.save(); ctx.globalAlpha = c.opacity; ctx.translate(c.x, c.y); ctx.rotate(c.angle);
      ctx.fillStyle = c.color; ctx.fillRect(-c.w/2, -c.h/2, c.w, c.h); ctx.restore();
    });
  };

  const loop = useCallback((time: number) => {
    const dt = Math.min(time - lastTimeRef.current, 32);
    lastTimeRef.current = time;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && (gameState.screen === GameScreen.GAME || gameState.goalPause)) {
      update(dt);
      draw(ctx);
    }
    frameIdRef.current = requestAnimationFrame(loop);
  }, [gameState.screen, gameState.goalPause, gameState.turnInProgress, gameState.isGoldenGoal, gameState.activeEffects]);

  useEffect(() => {
    frameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [loop]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (DIM.width / rect.width),
      y: (clientY - rect.top) * (DIM.height / rect.height)
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState.turn !== 0 || gameState.turnInProgress || gameState.goalPause) return;
    const pos = getPos(e);
    let idx = playersRef.current.findIndex(p => 
      Math.hypot(p.x - pos.x, p.y - pos.y) < p.radius * 2 && p.team === 0
    );
    if (idx === -1) {
      let minDist = Infinity;
      playersRef.current.forEach((p, i) => {
        if (p.team === 0 && p.role !== 'g') {
          const d = Math.hypot(p.x - pos.x, p.y - pos.y);
          if (d < minDist && d < 250) { minDist = d; idx = i; }
        }
      });
    }
    if (idx !== -1) {
      interactionRef.current = { dragging: true, dragStart: pos, dragCurrent: pos, selectedPlayerIdx: idx };
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (interactionRef.current.dragging) interactionRef.current.dragCurrent = getPos(e);
  };

  const handleEnd = () => {
    if (interactionRef.current.dragging) {
      const { dragStart, dragCurrent, selectedPlayerIdx } = interactionRef.current;
      const dx = dragStart.x - dragCurrent.x;
      const dy = dragStart.y - dragCurrent.y;
      const d = Math.hypot(dx, dy);
      if (d > 10) {
        const p = playersRef.current[selectedPlayerIdx];
        const staminaFactor = 0.5 + 0.5 * (p.currentStamina / p.stats.stamina);
        const powerMultiplier = (p.powerBoostUntil && p.powerBoostUntil > Date.now()) ? 1.5 : 1.0;
        const powerScale = Math.min((d / 9) * (p.stats.spd / 80) * staminaFactor * powerMultiplier, PHYSICS.maxPower);
        p.vx = Math.cos(Math.atan2(dy, dx)) * powerScale;
        p.vy = Math.sin(Math.atan2(dy, dx)) * powerScale;
        p.currentStamina = Math.max(0, p.currentStamina - 6);
        setGameState(prev => ({ ...prev, turnInProgress: true }));
      }
      interactionRef.current.dragging = false;
      interactionRef.current.selectedPlayerIdx = -1;
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={DIM.width}
        height={DIM.height}
        className="max-w-full max-h-full object-contain cursor-crosshair shadow-2xl"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
      
      {/* PLACEHOLDER PARA DISEÑO: Animación de gol mejorada overlay_goal.png */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500 transform ${gameState.goalPause ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        <div className="flex flex-col items-center">
          <h2 className="text-[14rem] font-black text-white italic uppercase tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] [text-shadow:_-4px_4px_0_#eab308,_4px_-4px_0_#eab308]">
            ¡GOOOOL!
          </h2>
          {gameState.isGoldenGoal && (
            <p className="text-5xl text-yellow-400 font-black -mt-8 animate-bounce tracking-widest italic [text-shadow:_-2px_2px_0_#000,2px_-2px_0_#000]">¡GOL DE ORO!</p>
          )}
        </div>
      </div>

      {/* PLACEHOLDER PARA DISEÑO: Overlay de Gol de Oro golden_goal_intro.png */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700 transform ${showGoldenGoalIntro ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}`}>
         <div className="flex flex-col items-center">
           <h3 className="text-5xl font-black text-white mb-2 uppercase tracking-[1em] drop-shadow-2xl [text-shadow:_-3px_3px_0_#000]">¡EMPATE!</h3>
           <h2 className="text-[12rem] font-black text-yellow-400 italic uppercase tracking-tighter drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] [text-shadow:_-6px_6px_0_#fff]">
             GOL DE ORO
           </h2>
           <p className="text-2xl text-white font-bold mt-4 tracking-[0.3em] uppercase opacity-90 [text-shadow:_-2px_2px_0_#000]">El próximo gol define el encuentro</p>
         </div>
      </div>
    </div>
  );
};

export default GameCanvas;
