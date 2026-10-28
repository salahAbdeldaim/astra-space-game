import React, { useRef, useEffect, useState, useMemo } from 'react';
import { GRID_SIZE, TILE_TYPES } from '../types/gameTypes';
import { Compass, ChevronUp, ZoomIn, ZoomOut, ShieldAlert, Crosshair, Map, Radio } from 'lucide-react';

const RANGE_PRESETS = [14, 22, 34]; // Local proximity radar scan ranges in tiles/meters

export const Minimap = ({
  grid = [],
  playerPos = { x: 50, y: 50 },
  habPos = { x: 50, y: 50 },
  vehiclePos = { x: 49, y: 49 },
  cameraViewport = { x: 44, y: 44, width: 14, height: 14 },
  enemies = [],
  lang = 'en',
  hasMappingDrone = false,
  orbitalPings = [],
  isResourceRadarUnlocked = false,
  exploredTilesRef = null,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mapMode, setMapMode] = useState('LOCAL'); // 'LOCAL' (Tactical Sonar) or 'GLOBAL' (Planetary Overview)
  const [showResources, setShowResources] = useState(true);
  const [rangeIndex, setRangeIndex] = useState(1); // default index
  const canvasRef = useRef(null);
  const sweepAngleRef = useRef(0);
  const animFrameRef = useRef(null);

  const isRtl = lang === 'ar';
  const presets = hasMappingDrone ? [20, 36, 54] : RANGE_PRESETS;
  const currentRange = presets[rangeIndex] || presets[1];
  const effectiveShowResources = Boolean(isResourceRadarUnlocked && showResources);

  // Base coordinates (Lander vehicle center)
  const baseX = (vehiclePos?.x ?? 49) + 1.0;
  const baseY = (vehiclePos?.y ?? 49) + 1.0;

  // Telemetry relative to Lander Base
  const baseDist = Math.hypot(baseX - playerPos.x, baseY - playerPos.y);
  const angleToBase = Math.atan2(baseY - playerPos.y, baseX - playerPos.x);

  // Direction name relative to base (N, NE, E, SE, S, SW, W, NW)
  const cardinalHeading = useMemo(() => {
    // Note: in screen coords, Y goes downwards
    const deg = ((angleToBase * 180) / Math.PI + 360) % 360;
    if (deg >= 337.5 || deg < 22.5) return isRtl ? 'شرق' : 'E';
    if (deg >= 22.5 && deg < 67.5) return isRtl ? 'جنوب-شرق' : 'SE';
    if (deg >= 67.5 && deg < 112.5) return isRtl ? 'جنوب' : 'S';
    if (deg >= 112.5 && deg < 157.5) return isRtl ? 'جنوب-غرب' : 'SW';
    if (deg >= 157.5 && deg < 202.5) return isRtl ? 'غرب' : 'W';
    if (deg >= 202.5 && deg < 247.5) return isRtl ? 'شمال-غرب' : 'NW';
    if (deg >= 247.5 && deg < 292.5) return isRtl ? 'شمال' : 'N';
    return isRtl ? 'شمال-شرق' : 'NE';
  }, [angleToBase, isRtl]);

  // Nearby threats count in sensor range
  const nearbyThreatsCount = useMemo(() => {
    if (!Array.isArray(enemies)) return 0;
    return enemies.filter((e) => {
      if (!e || e.health <= 0) return false;
      return Math.hypot(e.x - playerPos.x, e.y - playerPos.y) <= currentRange;
    }).length;
  }, [enemies, playerPos, currentRange]);

  // Main Canvas Render Loop (Animates Sonar Sweep Beam)
  useEffect(() => {
    if (isCollapsed) return;

    let isRunning = true;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = canvas.width;
      const cx = size / 2;
      const cy = size / 2;

      // Advance sweep beam
      sweepAngleRef.current = (sweepAngleRef.current + 0.035) % (Math.PI * 2);
      const sweepAngle = sweepAngleRef.current;

      ctx.clearRect(0, 0, size, size);

      if (mapMode === 'LOCAL') {
        // ══════════════════════════════════════════════════════
        // TACTICAL PROXIMITY SONAR RADAR (Player-Centered)
        // ══════════════════════════════════════════════════════
        const radarR = size * 0.47;

        // 1. Circular Aperture Mask
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radarR, 0, Math.PI * 2);
        ctx.clip();

        // 2. Dark Martian Radar Background
        const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radarR);
        bgGrad.addColorStop(0, '#140804');
        bgGrad.addColorStop(0.7, '#0a0402');
        bgGrad.addColorStop(1, '#020101');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, size, size);

        // 3. Subtle Concentric Range Rings & Distance Labels
        const rings = [0.33, 0.66, 1.0];
        ctx.lineWidth = 0.8;
        rings.forEach((ratio, idx) => {
          const r = radarR * ratio;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = idx === 2 ? 'rgba(249, 115, 22, 0.45)' : 'rgba(249, 115, 22, 0.18)';
          ctx.stroke();

          // Range Distance Tag (meters)
          const distLabel = `${Math.round(currentRange * ratio)}m`;
          ctx.font = '7px monospace';
          ctx.fillStyle = 'rgba(251, 146, 60, 0.55)';
          ctx.textAlign = 'center';
          ctx.fillText(distLabel, cx, cy - r + 8);
        });

        // 4. Crosshair Reticle & Cardinal Axes
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.16)';
        ctx.lineWidth = 0.7;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(cx - radarR, cy); ctx.lineTo(cx + radarR, cy);
        ctx.moveTo(cx, cy - radarR); ctx.lineTo(cx, cy + radarR);
        ctx.stroke();
        ctx.setLineDash([]);

        // 5. Rotating Sonar Sweep Beam
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radarR, sweepAngle - 0.6, sweepAngle);
        ctx.closePath();
        const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radarR);
        sweepGrad.addColorStop(0, 'rgba(249, 115, 22, 0.12)');
        sweepGrad.addColorStop(1, 'rgba(249, 115, 22, 0.28)');
        ctx.fillStyle = sweepGrad;
        ctx.fill();

        // Leading Sweep Line
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(sweepAngle) * radarR, cy + Math.sin(sweepAngle) * radarR);
        ctx.stroke();
        ctx.restore();

        // 6. Tactical Local Grid Scanning (Resources & Buildings within sensor radius)
        const minX = Math.max(0, Math.floor(playerPos.x - currentRange));
        const maxX = Math.min(GRID_SIZE - 1, Math.ceil(playerPos.x + currentRange));
        const minY = Math.max(0, Math.floor(playerPos.y - currentRange));
        const maxY = Math.min(GRID_SIZE - 1, Math.ceil(playerPos.y + currentRange));

        const BUILDING_COLORS = {
          [TILE_TYPES.SOLAR_ARRAY]: '#facc15',
          [TILE_TYPES.BIODOME]: '#22c55e',
          [TILE_TYPES.ICE_PURIFIER]: '#0ea5e9',
          [TILE_TYPES.COMMS_ARRAY]: '#c084fc',
          [TILE_TYPES.THERMAL_HEATER]: '#fb923c',
          [TILE_TYPES.BATTERY_BANK]: '#a3e635',
          [TILE_TYPES.WALL]: '#94a3b8',
          [TILE_TYPES.GATE]: '#38bdf8',
          [TILE_TYPES.ANCIENT_ALTAR]: '#f59e0b',
        };

        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            const tile = grid[y]?.[x];
            if (!tile || tile.type === TILE_TYPES.EMPTY || tile.type === TILE_TYPES.VEHICLE) continue;

            const dx = (x + 0.5) - playerPos.x;
            const dy = (y + 0.5) - playerPos.y;
            const dist = Math.hypot(dx, dy);
            if (dist > currentRange) continue;

            const sx = cx + (dx / currentRange) * radarR;
            const sy = cy + (dy / currentRange) * radarR;

            if (tile.type === TILE_TYPES.REGOLITH_NODE) {
              if (!effectiveShowResources) continue;
              // Glowing Amber Diamond Blip
              ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
              ctx.beginPath();
              ctx.arc(sx, sy, 3.8, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#f59e0b';
              ctx.beginPath();
              ctx.moveTo(sx, sy - 2.6);
              ctx.lineTo(sx + 2.6, sy);
              ctx.lineTo(sx, sy + 2.6);
              ctx.lineTo(sx - 2.6, sy);
              ctx.closePath();
              ctx.fill();
            } else if (tile.type === TILE_TYPES.ICE_NODE) {
              if (!effectiveShowResources) continue;
              // Glowing Cyan Crystal Blip
              ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
              ctx.beginPath();
              ctx.arc(sx, sy, 3.8, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#38bdf8';
              ctx.beginPath();
              ctx.moveTo(sx, sy - 2.8);
              ctx.lineTo(sx + 2.4, sy);
              ctx.lineTo(sx, sy + 2.8);
              ctx.lineTo(sx - 2.4, sy);
              ctx.closePath();
              ctx.fill();
            } else if (BUILDING_COLORS[tile.type]) {
              // Constructed Colony Building
              ctx.fillStyle = BUILDING_COLORS[tile.type];
              ctx.fillRect(sx - 2.5, sy - 2.5, 5, 5);
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 0.5;
              ctx.strokeRect(sx - 2.5, sy - 2.5, 5, 5);
            } else if (tile.type && String(tile.type).startsWith('CAVE_')) {
              // Subterranean Cave Entrance Beacon
              const isTurbineNest = tile.type === TILE_TYPES.CAVE_TURBINE;
              ctx.save();
              ctx.fillStyle = isTurbineNest ? '#f97316' : '#c084fc';
              ctx.shadowColor = isTurbineNest ? '#ea580c' : '#c084fc';
              ctx.shadowBlur = 8;
              ctx.beginPath();
              ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.restore();
            }
          }
        }

        // 7. Lander Base Beacon (if inside sensor range)
        if (baseDist <= currentRange) {
          const bScreenX = cx + ((baseX - playerPos.x) / currentRange) * radarR;
          const bScreenY = cy + ((baseY - playerPos.y) / currentRange) * radarR;

          // Glowing Base Square
          ctx.save();
          ctx.fillStyle = 'rgba(234, 88, 12, 0.3)';
          ctx.beginPath();
          ctx.arc(bScreenX, bScreenY, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ea580c';
          ctx.fillRect(bScreenX - 4.5, bScreenY - 4.5, 9, 9);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(bScreenX - 4.5, bScreenY - 4.5, 9, 9);

          // Center Cyan Beacon Core
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(bScreenX, bScreenY, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // 8. Alien Threat Entities (Burrowers within proximity)
        if (Array.isArray(enemies)) {
          const nowMs = Date.now();
          enemies.forEach((enemy) => {
            if (!enemy || enemy.health <= 0) return;
            const edx = (enemy.x + 0.5) - playerPos.x;
            const edy = (enemy.y + 0.5) - playerPos.y;
            const edist = Math.hypot(edx, edy);
            if (edist > currentRange) return;

            const esx = cx + (edx / currentRange) * radarR;
            const esy = cy + (edy / currentRange) * radarR;

            // Threat Pulse Ring
            const pulse = (Math.sin(nowMs * 0.006 + (enemy.id || 0)) + 1) * 0.5;
            const ringR = (enemy.isAlpha ? 5 : 4) + pulse * 2.5;

            ctx.save();
            ctx.strokeStyle = enemy.isAlpha ? 'rgba(192, 132, 252, 0.8)' : 'rgba(239, 68, 68, 0.8)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(esx, esy, ringR, 0, Math.PI * 2);
            ctx.stroke();

            // Threat Core
            ctx.fillStyle = enemy.isAlpha ? '#c084fc' : '#ef4444';
            ctx.beginPath();
            ctx.arc(esx, esy, enemy.isAlpha ? 3.0 : 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
        }

        // 9. Player Location Core (Always at center of local radar)
        ctx.save();
        // Pulsing Player Halo
        ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();

        // Crisp White Core with Orange Border
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();

        // 10. Base Perimeter Waypoint Arrow (If base is outside sensor range)
        if (baseDist > currentRange) {
          const pointerR = radarR - 7;
          const px = cx + Math.cos(angleToBase) * pointerR;
          const py = cy + Math.sin(angleToBase) * pointerR;

          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(angleToBase);

          // Arrowhead Chevron pointing toward Lander Base
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(5, 0);
          ctx.lineTo(-4, -4.5);
          ctx.lineTo(-1.5, 0);
          ctx.lineTo(-4, 4.5);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }

        // 10.5 NASA Orbital Reconnaissance Pings & Off-screen Waypoint Arrows
        if (Array.isArray(orbitalPings)) {
          const nowMs = Date.now();
          orbitalPings.forEach((ping) => {
            if (!ping) return;
            const pdx = (ping.x + 0.5) - playerPos.x;
            const pdy = (ping.y + 0.5) - playerPos.y;
            const pdist = Math.hypot(pdx, pdy);
            const isCave = ping.category === 'CAVE';
            const pingColor = isCave ? '#10b981' : (ping.category === 'RESOURCE' ? '#38bdf8' : '#f59e0b');

            if (pdist <= currentRange) {
              const psx = cx + (pdx / currentRange) * radarR;
              const psy = cy + (pdy / currentRange) * radarR;
              const pulse = (Math.sin(nowMs * 0.007 + (ping.id || 0)) + 1) * 0.5;

              ctx.save();
              // Concentric expanding beacon wave
              ctx.strokeStyle = pingColor;
              ctx.lineWidth = 1.2;
              ctx.globalAlpha = 0.85 - pulse * 0.45;
              ctx.beginPath();
              ctx.arc(psx, psy, 4 + pulse * 6, 0, Math.PI * 2);
              ctx.stroke();

              // Recon Satellite Diamond Icon
              ctx.globalAlpha = 1.0;
              ctx.fillStyle = pingColor;
              ctx.beginPath();
              ctx.moveTo(psx, psy - 4.5);
              ctx.lineTo(psx + 4, psy);
              ctx.lineTo(psx, psy + 4.5);
              ctx.lineTo(psx - 4, psy);
              ctx.closePath();
              ctx.fill();

              // Center white core
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(psx, psy, 1.5, 0, Math.PI * 2);
              ctx.fill();

              // Micro Beacon Label
              ctx.font = 'bold 7px monospace';
              ctx.fillStyle = pingColor;
              ctx.textAlign = 'center';
              ctx.fillText(isCave ? '🛰️ CAVE' : '❄️ ICE', psx, psy - 6.5);
              ctx.restore();
            } else {
              // Off-screen Waypoint Chevron on Radar Rim
              const angleToPing = Math.atan2(pdy, pdx);
              const pointerR = radarR - 7;
              const px = cx + Math.cos(angleToPing) * pointerR;
              const py = cy + Math.sin(angleToPing) * pointerR;

              ctx.save();
              ctx.translate(px, py);
              ctx.rotate(angleToPing);
              ctx.fillStyle = pingColor;
              ctx.beginPath();
              ctx.moveTo(5.5, 0);
              ctx.lineTo(-4, -4);
              ctx.lineTo(-1.5, 0);
              ctx.lineTo(-4, 4);
              ctx.closePath();
              ctx.fill();

              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 0.8;
              ctx.stroke();
              ctx.restore();

              // Distance badge on rim
              ctx.save();
              ctx.font = 'bold 7px monospace';
              ctx.fillStyle = pingColor;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              const lx = cx + Math.cos(angleToPing) * (radarR - 15);
              const ly = cy + Math.sin(angleToPing) * (radarR - 15);
              ctx.fillText(`${Math.round(pdist)}m`, lx, ly);
              ctx.restore();
            }
          });
        }

        // 11. Circular Rim Bezel & Cardinal Ticks (N, E, S, W)
        ctx.restore(); // remove clip

        ctx.strokeStyle = 'rgba(249, 115, 22, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radarR, 0, Math.PI * 2);
        ctx.stroke();

        // Cardinal Direction Markers
        ctx.font = 'bold 8px Cairo, sans-serif';
        ctx.fillStyle = '#fdba74';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isRtl ? 'ش' : 'N', cx, cy - radarR - 6);
        ctx.fillText(isRtl ? 'ج' : 'S', cx, cy + radarR + 6);
        ctx.fillText(isRtl ? 'ق' : 'E', cx + radarR + 6, cy);
        ctx.fillText(isRtl ? 'غ' : 'W', cx - radarR - 6, cy);

      } else {
        // ══════════════════════════════════════════════════════
        // ══════════════════════════════════════════════════════
        // GLOBAL PLANETARY OVERVIEW MAP (Dynamic Grid Map)
        // Clean Strategic Overview with Fog of War Coverage
        // ══════════════════════════════════════════════════════
        const pad = 12;
        const mapW = size - pad * 2;
        const mapH = size - pad * 2;
        const curGW = grid[0]?.length || GRID_SIZE;
        const curGH = grid.length || GRID_SIZE;
        const scale = mapW / curGW;

        // Dark Unexplored Background with Subtle Border
        ctx.fillStyle = '#060202';
        ctx.fillRect(pad, pad, mapW, mapH);
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(pad, pad, mapW, mapH);

        // Explored Sectors Tint Layer
        if (exploredTilesRef?.current) {
          const exploredBuf = exploredTilesRef.current;
          ctx.fillStyle = 'rgba(194, 65, 12, 0.22)';
          const step = 2; // sample in 2x2 blocks for extreme 60fps performance on 160x160
          for (let y = 0; y < curGH; y += step) {
            for (let x = 0; x < curGW; x += step) {
              if (exploredBuf[y * curGW + x] === 1) {
                ctx.fillRect(pad + x * scale, pad + y * scale, Math.max(1, scale * step), Math.max(1, scale * step));
              }
            }
          }
        }

        // Sector Grid Lines (every 20 or 32 tiles)
        const gridStep = curGW >= 140 ? 32 : 20;
        ctx.strokeStyle = 'rgba(140, 59, 35, 0.35)';
        ctx.lineWidth = 0.6;
        for (let i = 0; i <= curGW; i += gridStep) {
          const gx = pad + i * scale;
          const gy = pad + i * scale;
          ctx.beginPath();
          ctx.moveTo(gx, pad); ctx.lineTo(gx, pad + mapH);
          ctx.moveTo(pad, gy); ctx.lineTo(pad + mapW, gy);
          ctx.stroke();
        }

        // Constructed Buildings on Global Map (Only if in explored sectors)
        const BUILDING_COLORS = {
          [TILE_TYPES.SOLAR_ARRAY]: '#facc15',
          [TILE_TYPES.BIODOME]: '#22c55e',
          [TILE_TYPES.ICE_PURIFIER]: '#0ea5e9',
          [TILE_TYPES.COMMS_ARRAY]: '#c084fc',
          [TILE_TYPES.THERMAL_HEATER]: '#fb923c',
          [TILE_TYPES.BATTERY_BANK]: '#a3e635',
        };
        const exploredBuf = exploredTilesRef?.current;
        for (let y = 0; y < curGH; y++) {
          for (let x = 0; x < curGW; x++) {
            const tile = grid[y]?.[x];
            if (tile && BUILDING_COLORS[tile.type]) {
              const isRevealed = !exploredBuf || exploredBuf[y * curGW + x] === 1;
              if (isRevealed) {
                ctx.fillStyle = BUILDING_COLORS[tile.type];
                ctx.fillRect(pad + x * scale - 1, pad + y * scale - 1, 3, 3);
              }
            } else if (tile && String(tile.type).startsWith('CAVE_')) {
              // Cave Entrance Marker on Strategic Map
              const isTurbine = tile.type === TILE_TYPES.CAVE_TURBINE;
              ctx.save();
              ctx.fillStyle = isTurbine ? '#f97316' : '#c084fc';
              ctx.shadowColor = isTurbine ? '#ea580c' : '#a855f7';
              ctx.shadowBlur = 6;
              ctx.beginPath();
              ctx.arc(pad + x * scale, pad + y * scale, 3.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            } else if (tile && tile.type === TILE_TYPES.ANCIENT_ALTAR) {
              ctx.save();
              ctx.fillStyle = '#f59e0b';
              ctx.shadowColor = '#d97706';
              ctx.shadowBlur = 5;
              ctx.beginPath();
              ctx.arc(pad + x * scale, pad + y * scale, 3.2, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        }

        // Player Telemetry Line to Base
        const pScreenX = pad + playerPos.x * scale;
        const pScreenY = pad + playerPos.y * scale;
        const bScreenX = pad + baseX * scale;
        const bScreenY = pad + baseY * scale;

        ctx.strokeStyle = 'rgba(249, 115, 22, 0.35)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(pScreenX, pScreenY);
        ctx.lineTo(bScreenX, bScreenY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Camera Viewport Box
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          pad + cameraViewport.x * scale,
          pad + cameraViewport.y * scale,
          cameraViewport.width * scale,
          cameraViewport.height * scale
        );

        // Lander Base Beacon
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(bScreenX - 3.5, bScreenY - 3.5, 7, 7);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(bScreenX - 3.5, bScreenY - 3.5, 7, 7);

        // Player Beacon Dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pScreenX, pScreenY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // NASA Orbital Recon Pings on Global Map
        if (Array.isArray(orbitalPings)) {
          const nowMs = Date.now();
          orbitalPings.forEach((ping) => {
            if (!ping) return;
            const pingScreenX = pad + (ping.x + 0.5) * scale;
            const pingScreenY = pad + (ping.y + 0.5) * scale;
            const isCave = ping.category === 'CAVE';
            const pingColor = isCave ? '#10b981' : (ping.category === 'RESOURCE' ? '#38bdf8' : '#f59e0b');
            const pulse = (Math.sin(nowMs * 0.006 + (ping.id || 0)) + 1) * 0.5;

            ctx.save();
            // Reticle Target Ring
            ctx.strokeStyle = pingColor;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(pingScreenX, pingScreenY, 5 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();

            // Diamond Center Pin
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = pingColor;
            ctx.beginPath();
            ctx.moveTo(pingScreenX, pingScreenY - 3.5);
            ctx.lineTo(pingScreenX + 3.5, pingScreenY);
            ctx.lineTo(pingScreenX, pingScreenY + 3.5);
            ctx.lineTo(pingScreenX - 3.5, pingScreenY);
            ctx.closePath();
            ctx.fill();

            // Label
            ctx.font = 'bold 7px monospace';
            ctx.fillStyle = pingColor;
            ctx.fillText(isCave ? '🛰️ CAVE' : '❄️ ICE', pingScreenX + 5, pingScreenY + 2);
            ctx.restore();
          });
        }

        // Sector Label (Corner) - aligned to prevent clipping
        ctx.save();
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = 'rgba(251, 146, 60, 0.7)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${curGW}x${curGH} MARS`, pad + 4, pad + mapH - 3);
        ctx.restore();
      }

      if (isRunning) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [grid, playerPos, habPos, vehiclePos, cameraViewport, enemies, isCollapsed, mapMode, currentRange, isRtl, baseX, baseY, baseDist, angleToBase]);

  const pX = Math.round(playerPos.x);
  const pY = Math.round(playerPos.y);

  return (
    <div
      dir="ltr"
      className={`hud-panel rounded-2xl border border-orange-500/35 shadow-2xl select-none backdrop-blur-xl bg-stone-950/95 overflow-hidden transition-all duration-200 ${
        isRtl ? 'font-cairo' : 'font-sans'
      }`}
    >
      {/* ── Top Header Row: RADAR Badge + Live Coords + Collapse ── */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-orange-950/20 transition-colors border-b border-orange-500/20"
      >
        <div className="flex items-center gap-1.5 text-orange-400 font-bold text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <Radio className="w-3.5 h-3.5 text-orange-400 animate-pulse shrink-0" />
          <span className="font-cairo tracking-wide text-[11px]">
            {isRtl ? 'رادار الاستكشاف' : 'TACTICAL RADAR'}
          </span>
          {hasMappingDrone && (
            <span className="text-[9px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 px-1 py-0.2 rounded hidden sm:inline">
              DRONE
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-amber-300 bg-stone-900/90 px-1.5 py-0.5 rounded-md border border-stone-800">
            {pX},{pY}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-0.5 rounded text-stone-400 hover:text-white"
            title={isCollapsed ? (isRtl ? 'فتح' : 'Open') : (isRtl ? 'تصغير' : 'Collapse')}
          >
            <ChevronUp
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* ── Main Radar Body ── */}
      {!isCollapsed && (
        <div className="p-2 flex flex-col items-center gap-1.5">
          {/* Mode Switcher & Zoom Controls Bar */}
          <div className="w-full flex items-center justify-between gap-1 text-[10px] font-mono">
            {/* Mode Toggle: LOCAL vs GLOBAL */}
            <div className="flex items-center bg-stone-900/90 rounded-lg p-0.5 border border-stone-800">
              <button
                type="button"
                onClick={() => setMapMode('LOCAL')}
                className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                  mapMode === 'LOCAL'
                    ? 'bg-orange-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {isRtl ? 'تكتيكي' : 'LOCAL'}
              </button>
              <button
                type="button"
                onClick={() => setMapMode('GLOBAL')}
                className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                  mapMode === 'GLOBAL'
                    ? 'bg-orange-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {isRtl ? 'شاملة' : 'GLOBAL'}
              </button>

              {/* Resource Scanner Toggle (Available when unlocked by NASA Uplink) */}
              {isResourceRadarUnlocked && mapMode === 'LOCAL' && (
                <button
                  type="button"
                  onClick={() => setShowResources((prev) => !prev)}
                  className={`px-1.5 py-0.5 rounded-md font-bold transition-all text-[8px] cursor-pointer ${
                    showResources
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-sm'
                      : 'bg-stone-900 text-stone-500 border border-stone-800'
                  }`}
                  title={isRtl ? 'تبديل إظهار مكامن الموارد' : 'Toggle Resource Nodes'}
                >
                  {showResources ? '💎 ON' : '💎 OFF'}
                </button>
              )}
            </div>

            {/* Range Zoom Buttons (Active only in LOCAL mode) */}
            {mapMode === 'LOCAL' && (
              <div className="flex items-center gap-1 bg-stone-900/90 px-1.5 py-0.5 rounded-lg border border-stone-800 text-amber-300">
                <button
                  type="button"
                  disabled={rangeIndex === 0}
                  onClick={() => setRangeIndex(Math.max(0, rangeIndex - 1))}
                  className="disabled:opacity-30 hover:text-white cursor-pointer px-1 text-xs font-bold"
                  title={isRtl ? 'تقريب' : 'Zoom In'}
                >
                  -
                </button>
                <span className="text-[9px] font-bold min-w-[22px] text-center">
                  {currentRange}m
                </span>
                <button
                  type="button"
                  disabled={rangeIndex === RANGE_PRESETS.length - 1}
                  onClick={() => setRangeIndex(Math.min(RANGE_PRESETS.length - 1, rangeIndex + 1))}
                  className="disabled:opacity-30 hover:text-white cursor-pointer px-1 text-xs font-bold"
                  title={isRtl ? 'تبعيد' : 'Zoom Out'}
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Canvas Display */}
          <div className="relative rounded-xl overflow-hidden border border-orange-500/25 bg-stone-950 shadow-inner flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={190}
              height={190}
              className="block w-[135px] h-[135px] sm:w-[155px] sm:h-[155px]"
            />

            {/* In-Radar Threat Warning Badge (If any enemies nearby) */}
            {mapMode === 'LOCAL' && nearbyThreatsCount > 0 && (
              <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-center pointer-events-none">
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-950/90 border border-red-500/80 text-rose-300 text-[8px] font-bold font-mono shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse">
                  <ShieldAlert className="w-2.5 h-2.5 text-red-400" />
                  {isRtl ? `${nearbyThreatsCount} وحش قريب!` : `${nearbyThreatsCount} THREATS NEAR`}
                </span>
              </div>
            )}
          </div>

          {/* Telemetry / Home Base Waypoint Bar */}
          <div className="w-full flex items-center justify-between text-[9px] font-mono px-1 py-0.5 rounded-md bg-stone-900/80 border border-stone-800/60 text-stone-300">
            <span className="flex items-center gap-1 text-orange-300 font-bold">
              <span>🚀</span>
              <span>{isRtl ? 'القاعدة:' : 'Base:'}</span>
              <span className="text-amber-200">{Math.round(baseDist)}m</span>
            </span>
            <span className="text-stone-400 font-bold bg-stone-800/80 px-1 py-0.5 rounded text-[8px]">
              {cardinalHeading}
            </span>
          </div>

          {/* NASA Orbital Recon Telemetry Chip (If active pings exist) */}
          {orbitalPings.length > 0 && (
            <div className="w-full flex items-center justify-between text-[8px] font-mono px-1 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
              <span className="flex items-center gap-1 font-bold">
                <span className="animate-pulse">🛰️</span>
                <span>{isRtl ? 'إشارات ناسا المدارية:' : 'NASA Recon:'}</span>
              </span>
              <span className="font-bold">{orbitalPings.length} {isRtl ? 'نشطة' : 'Active'}</span>
            </div>
          )}

          {/* Minimalist Legend Chips or Locked State */}
          {isResourceRadarUnlocked ? (
            <div className="w-full flex items-center justify-between text-[8px] font-mono px-0.5 text-stone-400">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="inline-block w-1.5 h-1.5 rounded-sm bg-amber-500 rotate-45" />
                <span>{isRtl ? 'صخور' : 'Regolith'}</span>
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <span className="inline-block w-1.5 h-1.5 rounded-sm bg-sky-400 rotate-45" />
                <span>{isRtl ? 'جليد' : 'Ice'}</span>
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>{isRtl ? 'وحوش' : 'Threat'}</span>
              </span>
              <span className="flex items-center gap-1 text-cyan-300">
                <span className="inline-block w-1.5 h-1.5 rounded-sm bg-orange-500 border border-cyan-400" />
                <span>{isRtl ? 'قاعدة' : 'Base'}</span>
              </span>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between text-[8px] font-mono px-1 py-0.5 rounded bg-stone-900/90 border border-amber-500/30 text-amber-300/90">
              <span className="flex items-center gap-1">
                <span>🔒</span>
                <span>{isRtl ? 'كاشف الموارد: معطل' : 'Resource Radar: Locked'}</span>
              </span>
              <span className="text-amber-400 font-bold">{isRtl ? '[اتصال ناسا H]' : '[Call Earth H]'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
