import { Player, Ball } from '../types';
import { DIM as FIELD_DIM, PHYSICS as GAME_PHYSICS } from '../constants';

export const resolveCollisions = (players: Player[], balls: Ball[]) => {
  const all: (Player | Ball)[] = [...players, ...balls];
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i];
      const b = all[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.hypot(dx, dy);
      const minDist = a.radius + b.radius;

      if (d < minDist) {
        const ang = Math.atan2(dy, dx);
        const overlap = (minDist - d) * 1.1; // Margen extra para asegurar separación completa
        
        const aStatic = ('role' in a && a.role === 'g');
        const bStatic = ('role' in b && b.role === 'g');

        // Si uno es portero (estático ante empujes), el otro se mueve toda la distancia
        if (aStatic && !bStatic) {
          b.x -= Math.cos(ang) * overlap;
          b.y -= Math.sin(ang) * overlap;
        } else if (!aStatic && bStatic) {
          a.x += Math.cos(ang) * overlap;
          a.y += Math.sin(ang) * overlap;
        } else {
          // Ambos se mueven la mitad
          const moveX = Math.cos(ang) * (overlap / 2);
          const moveY = Math.sin(ang) * (overlap / 2);
          a.x += moveX;
          a.y += moveY;
          b.x -= moveX;
          b.y -= moveY;
        }

        const v1n = a.vx * Math.cos(ang) + a.vy * Math.sin(ang);
        const v2n = b.vx * Math.cos(ang) + b.vy * Math.sin(ang);
        
        const pwrA = 'stats' in a ? (a.stats.pwr / 100) : 0.4;
        const pwrB = 'stats' in b ? (b.stats.pwr / 100) : 0.4;
        
        const impulse = (v1n - v2n) * GAME_PHYSICS.collisionElasticity;

        // Si es un portero, rebota el balón con su propia inercia
        if (aStatic) {
          b.vx += impulse * Math.cos(ang) * 1.2;
          b.vy += impulse * Math.sin(ang) * 1.2;
        } else if (bStatic) {
          a.vx -= impulse * Math.cos(ang) * 1.2;
          a.vy -= impulse * Math.sin(ang) * 1.2;
        } else {
          a.vx -= impulse * Math.cos(ang) * (1 + pwrB * 0.5);
          a.vy -= impulse * Math.sin(ang) * (1 + pwrB * 0.5);
          b.vx += impulse * Math.cos(ang) * (1 + pwrA * 0.5);
          b.vy += impulse * Math.sin(ang) * (1 + pwrA * 0.5);
        }
      }
    }
  }
};

export const checkBounds = (obj: Player | Ball) => {
  const p = FIELD_DIM.padding;
  const r = obj.radius;
  const isPlayer = 'role' in obj;
  const isGoaler = isPlayer && obj.role === 'g';
  const isInsideGoalY = obj.y > FIELD_DIM.height / 2 - FIELD_DIM.goalW / 2 && 
                       obj.y < FIELD_DIM.height / 2 + FIELD_DIM.goalW / 2;

  if (isGoaler) {
    const areaYTop = FIELD_DIM.height / 2 - FIELD_DIM.areaH / 2;
    const areaYBottom = FIELD_DIM.height / 2 + FIELD_DIM.areaH / 2;
    if (obj.team === 0) {
      if (obj.x < p + r) obj.x = p + r;
      if (obj.x > p + FIELD_DIM.areaW - r) obj.x = p + FIELD_DIM.areaW - r;
    } else {
      if (obj.x > FIELD_DIM.width - p - r) obj.x = FIELD_DIM.width - p - r;
      if (obj.x < FIELD_DIM.width - p - FIELD_DIM.areaW + r) obj.x = FIELD_DIM.width - p - FIELD_DIM.areaW + r;
    }
    if (obj.y < areaYTop + r) { obj.y = areaYTop + r; obj.vy = 0; }
    if (obj.y > areaYBottom - r) { obj.y = areaYBottom - r; obj.vy = 0; }
    return;
  }

  // Vertical bounds (Paredes laterales)
  if (obj.y < p + r) {
    obj.y = p + r;
    obj.vy *= GAME_PHYSICS.wallBounciness;
    obj.vx *= 0.98;
  } else if (obj.y > FIELD_DIM.height - p - r) {
    obj.y = FIELD_DIM.height - p - r;
    obj.vy *= GAME_PHYSICS.wallBounciness;
    obj.vx *= 0.98;
  }

  // Horizontal bounds (Líneas de fondo y Porterías)
  if (obj.x < p + r) {
    if (!isPlayer && isInsideGoalY) {
      if (obj.y < FIELD_DIM.height / 2 - FIELD_DIM.goalW / 2 + r) {
        obj.y = FIELD_DIM.height / 2 - FIELD_DIM.goalW / 2 + r;
        obj.vy *= GAME_PHYSICS.wallBounciness * 0.6;
      }
      if (obj.y > FIELD_DIM.height / 2 + FIELD_DIM.goalW / 2 - r) {
        obj.y = FIELD_DIM.height / 2 + FIELD_DIM.goalW / 2 - r;
        obj.vy *= GAME_PHYSICS.wallBounciness * 0.6;
      }
      
      const netBackX = p - FIELD_DIM.goalDepth + r;
      if (obj.x < netBackX) {
        obj.x = netBackX;
        obj.vx *= -0.3;
        obj.vy *= 0.5;
      }
    } else {
      obj.x = p + r;
      obj.vx *= GAME_PHYSICS.wallBounciness;
    }
  } else if (obj.x > FIELD_DIM.width - p - r) {
    if (!isPlayer && isInsideGoalY) {
      if (obj.y < FIELD_DIM.height / 2 - FIELD_DIM.goalW / 2 + r) {
        obj.y = FIELD_DIM.height / 2 - FIELD_DIM.goalW / 2 + r;
        obj.vy *= GAME_PHYSICS.wallBounciness * 0.6;
      }
      if (obj.y > FIELD_DIM.height / 2 + FIELD_DIM.goalW / 2 - r) {
        obj.y = FIELD_DIM.height / 2 + FIELD_DIM.goalW / 2 - r;
        obj.vy *= GAME_PHYSICS.wallBounciness * 0.6;
      }

      const netBackX = FIELD_DIM.width - p + FIELD_DIM.goalDepth - r;
      if (obj.x > netBackX) {
        obj.x = netBackX;
        obj.vx *= -0.3;
        obj.vy *= 0.5;
      }
    } else {
      obj.x = FIELD_DIM.width - p - r;
      obj.vx *= GAME_PHYSICS.wallBounciness;
    }
  }
};
