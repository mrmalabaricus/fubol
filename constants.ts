
import { PlayerStats, Tactic } from './types';

/**
 * ============================================================================
 * MANIFIESTO DE ACTIVOS PARA DISEÑO (DESIGN SPECS)
 * ============================================================================
 * 
 * Este bloque sirve de guía para el equipo de arte y UI/UX.
 * Dimensiones base del proyecto: 1280x720 (16:9)
 * 
 * 1. CAMPO DE JUEGO (FIELD)
 *    - Pitch: 1280x720px. Textura de césped con franjas verticales.
 *    - Líneas: Blanco puro (opacity 0.6). Grosor: 4px.
 *    - Áreas: 220px ancho x 400px alto.
 *    - Porterías: 240px de ancho. Profundidad: 40px. Redes con transparencia.
 * 
 * 2. JUGADORES (PLAYERS)
 *    - Diámetro: 68px (Radio 34px).
 *    - Local (Team 0): Color base #3f85ff. Bordes dorados para el seleccionado.
 *    - Visitante (Team 1): Color base #ff5757.
 *    - Estados: Stamina bar (6px alto), Aura de poder (glow amarillo).
 * 
 * 3. BALÓN (BALL)
 *    - Diámetro: 36px (Radio 18px).
 *    - Assets: Sprite circular, sombreado dinámico, rotación fluida de 360°.
 * 
 * 4. POWER-UPS
 *    - Tamaño: 50x50px.
 *    - Estética: Iconos neón con pulso dinámico.
 *    - Tipos: ⚡ (Power), ⚽⚽ (Multi), 🥅 (Shrink).
 * 
 * 5. UI / HUD
 *    - Scoreboard: Glassmorphism (blur 12px), bordes redondeados.
 *    - Tipografía: Fuente Sans-Serif Black/Heavy para números y títulos.
 *    - Botones: Naranja (#f97316) con sombreado 3D y efecto de presión.
 * 
 * 6. VFX / OVERLAYS
 *    - Goal Screen: Texto "¡GOOOOL!" masivo (14rem) con contorno amarillo.
 *    - Golden Goal: Overlay de alto contraste, tonos amarillos y negros.
 * ============================================================================
 */

export const DIM = {
  width: 1280,
  height: 720,
  padding: 60,
  goalW: 240,
  goalDepth: 40,
  pRadius: 34, // Tamaño visual del disco de jugador
  bRadius: 18, // Tamaño visual del balón
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
