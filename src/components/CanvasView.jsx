import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  GRID_SIZE,
  TILE_TYPES,
  TILE_SIZE,
  BLASTER_CONFIG,
  BURROWER_CONFIG,
  DEVIL_LEADER_CONFIG,
  getSolNightFactor,
  HEATER_THERMAL_RADIUS,
  BUILDINGS,
  isToggleablePowerBuilding,
  BASE_SAFE_RADIUS,
  FOG_VISION_RADIUS_WALK,
  FOG_VISION_RADIUS_LIGHT,
  FOG_VISION_RADIUS_ROVER,
} from '../types/gameTypes';
import {
  isWithinBounds,
  isTileWalkable,
  canBuildAt,
  isTileInThermalZone,
  isBuildingOperational,
} from '../utils/gridHelpers';
import { translations } from '../types/translations';
import { getSprite, preloadSprites } from '../utils/spriteLoader';
import { Pickaxe, Truck, Briefcase, Flower2, Droplets, PhoneCall, Sparkles, Move, Zap, Crosshair, AlertTriangle, Power, X } from 'lucide-react';
import { CREW_MEMBERS, ASSIGNABLE_ROLES, drawAstronautCharacter } from '../utils/astronautRenderer';

export const getSurfaceCrewStations = (
  grid,
  rescuedCrew,
  crewAssignments = {},
  habPos = { x: 50, y: 50 },
  vehiclePos = { x: 49, y: 49 }
) => {
  if (!grid || !rescuedCrew || rescuedCrew.length === 0) return [];
  const stations = [];

  let smelterPos = null;
  let biodomePos = null;
  let commsPos = null;
  let solarPos = null;
  const habX = habPos?.x || 50;
  const habY = habPos?.y || 50;
  const roverX = vehiclePos?.x || 49;
  const roverY = vehiclePos?.y || 49;

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < (grid[r]?.length || 0); c++) {
      const type = grid[r][c]?.type;
      if (type === TILE_TYPES.SMELTER && !smelterPos) smelterPos = { x: c, y: r };
      if (type === TILE_TYPES.BIODOME && !biodomePos) biodomePos = { x: c, y: r };
      if (type === TILE_TYPES.COMMS_TOWER && !commsPos) commsPos = { x: c, y: r };
      if (type === TILE_TYPES.SOLAR_ARRAY && !solarPos) solarPos = { x: c, y: r };
      if (smelterPos && biodomePos && commsPos && solarPos) break;
    }
    if (smelterPos && biodomePos && commsPos && solarPos) break;
  }

  // Dynamically position each crew member next to their assigned work station
  rescuedCrew.forEach((cId, idx) => {
    const cCfg = CREW_MEMBERS[cId];
    if (!cCfg) return;
    const role = crewAssignments[cId] || cCfg.signatureRole || 'REST';

    let targetX = habX;
    let targetY = habY;
    let facing = 'down';

    switch (role) {
      case 'BIODOME': {
        const base = biodomePos || { x: habX - 2, y: habY };
        targetX = base.x;
        targetY = base.y + 1;
        facing = 'up';
        break;
      }
      case 'MINES': {
        const base = smelterPos || { x: habX + 2, y: habY };
        targetX = base.x + 1;
        targetY = base.y;
        facing = 'left';
        break;
      }
      case 'CLINIC': {
        targetX = habX;
        targetY = habY - 2;
        facing = 'down';
        break;
      }
      case 'GRID': {
        const base = commsPos || solarPos || { x: habX + 2, y: habY + 2 };
        targetX = base.x;
        targetY = base.y + 1;
        facing = 'up';
        break;
      }
      case 'DEFENSE': {
        const offsetAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
        const angle = offsetAngles[idx % offsetAngles.length];
        targetX = Math.round(habX + Math.cos(angle) * 3);
        targetY = Math.round(habY + Math.sin(angle) * 3);
        facing = angle === 0 ? 'right' : angle === Math.PI ? 'left' : angle > Math.PI ? 'up' : 'down';
        break;
      }
      case 'REST':
      default: {
        targetX = roverX + (idx % 2 === 0 ? 1 : -1);
        targetY = roverY + (idx > 1 ? 1 : 0);
        facing = 'right';
        break;
      }
    }

    stations.push({
      crewId: cId,
      assignedRole: role,
      x: targetX,
      y: targetY,
      facing,
    });
  });

  return stations;
};

export const CanvasView = ({
  lang = 'en',
  grid,
  setGrid,
  playerPos,
  setPlayerPos,
  habPos,
  vehiclePos = { x: 10, y: 12 },
  keys,
  activeBuilding,
  setActiveBuilding,
  materials,
  setMaterials,
  backpack,
  setBackpack,
  backpackCapacity,
  cropGrowth = 0,
  sanity = 100,
  bodyTemp = 37.0,
  health = 100,
  o2 = 100,
  maxO2 = 100,
  hunger = 100,
  thirst = 100,
  onEatFood,
  onDrinkWater,
  isDay = true,
  solProgress = 0,
  isFlashlightOn = false,
  thermalSpeedMultiplier = 1.0,
  powerMetrics = null,
  batteryCharge = 20,
  onDepositCargo,
  onHarvestCrops,
  onPurifyWater,
  onCallEarth,
  onInspectBuilding,
  onCollectBuildingOutput,
  relocatingBuilding = null,
  setRelocatingBuilding,
  loadout,
  craftedUpgrades = [],
  onLogMessage,
  isPaused,
  isGameOver,
  onMiningStateChange,
  onCameraUpdate,
  enemies = [],
  setEnemies,
  onPlayerDamaged,
  onEnemyDefeated,
  onCollectLoot,
  onDrainBattery,
  blasterTriggerCount = 0,
  sfx,
  onToggleBuildingPower,
  activeCaveInfo = null,
  onExitCave,
  onInspectCaveProp,
  // Phase 2: Storm & Specialization Multipliers
  isDustStormActive = false,
  blasterDamageMultiplier = 1.0,
  miningSpeedMultiplier = 1.0,
  miningYieldMultiplier = 1.0,
  buildingCostMultiplier = 1.0,
  primaryAction = null,
  secondaryAction = null,
  onOpenCargoModal = null,
  orbitalPings = [],
  exploredTilesRef = null,
  rescuedCrew = [],
  crewAssignments = {},
  onTalkToCrew = null,
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const rescuedCrewRef = useRef(rescuedCrew);
  const crewAssignmentsRef = useRef(crewAssignments);
  useEffect(() => {
    rescuedCrewRef.current = rescuedCrew;
  }, [rescuedCrew]);
  useEffect(() => {
    crewAssignmentsRef.current = crewAssignments;
  }, [crewAssignments]);

  // Camera offset position in pixels
  const cameraPosRef = useRef({ x: 0, y: 0 });

  // Equipment perks
  const hasExtraO2 = loadout.includes('extra_o2');
  const hasHeavyDrill = loadout.includes('heavy_drill');
  const hasCarbonExo = loadout.includes('carbon_exo');
  const hasNaniteDrill = craftedUpgrades.includes('nanite_drill');

  const sanitySpeedMultiplier = sanity < 30 ? 0.85 : 1.0;
  const effectiveThermalSpeed = thermalSpeedMultiplier || 1.0;
  const moveSpeed = (hasExtraO2 ? 3.2 : 4.2) * sanitySpeedMultiplier * effectiveThermalSpeed;

  const [hoverTile, setHoverTile] = useState(null);
  const [isMining, setIsMining] = useState(false);
  const miningProgressRef = useRef(0);

  const particlesRef = useRef([]);
  const floatingTextsRef = useRef([]);

  const playerAnimPosRef = useRef({ x: playerPos.x, y: playerPos.y });
  const playerFacingRef = useRef('down');
  const lastTimeRef = useRef(performance.now());

  const playerPosRef = useRef(playerPos);
  playerPosRef.current = playerPos;
  const prevPosRef = useRef(playerPos);
  const isMovingRef = useRef(false);

  // Phase 4: Martian Burrowers, Projectiles, and Loot Drops Refs
  const enemiesRef = useRef(enemies);
  useEffect(() => {
    enemiesRef.current = enemies;
  }, [enemies]);

  const healthRef = useRef(health);
  const o2Ref = useRef(o2);
  const maxO2Ref = useRef(maxO2);
  const hungerRef = useRef(hunger);
  const thirstRef = useRef(thirst);
  useEffect(() => { healthRef.current = health; }, [health]);
  useEffect(() => { o2Ref.current = o2; }, [o2]);
  useEffect(() => { maxO2Ref.current = maxO2; }, [maxO2]);
  useEffect(() => { hungerRef.current = hunger; }, [hunger]);
  useEffect(() => { thirstRef.current = thirst; }, [thirst]);

  const projectilesRef = useRef([]);
  const lootDropsRef = useRef([]);
  const lastFireTimeRef = useRef(0);
  const lastBlasterFireTimeRef = useRef(0);
  const deathTimeRef = useRef(0);
  const aimAngleRef = useRef(Math.PI / 2); // Initial aim angle down
  const mouseWorldPosRef = useRef(null);
  const shakeDurationRef = useRef(0);
  const prevBlasterTriggerCountRef = useRef(blasterTriggerCount);

  // Atmosphere, Wind, and Ground Decals Refs
  const dustMotesRef = useRef(
    Array.from({ length: 42 }, () => ({
      x: Math.random() * GRID_SIZE,
      y: Math.random() * GRID_SIZE,
      size: 1.2 + Math.random() * 2.0,
      alpha: 0.15 + Math.random() * 0.35,
      speed: 0.8 + Math.random() * 0.7,
      wobblePhase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.45 ? '#ea580c' : (Math.random() > 0.5 ? '#fdba74' : '#c2410c'),
    }))
  );
  const footstepsRef = useRef([]);
  const lastFootstepPosRef = useRef({ x: playerPos.x, y: playerPos.y });
  const darknessCanvasRef = useRef(null);
  const nightAlphaRef = useRef(getSolNightFactor(solProgress, isDay));

  // Fog of War / Exploration Shadow Refs
  const fogCanvasRef = useRef(null);
  const fogNeedsRedrawRef = useRef(true);
  const lastExploredPosRef = useRef({ x: -999, y: -999 });
  const caveExploredBufRef = useRef(null);
  const lastActiveCaveIdRef = useRef(null);

  useEffect(() => {
    fogNeedsRedrawRef.current = true;
  }, [grid, activeCaveInfo, isFlashlightOn]);

  useEffect(() => {
    preloadSprites();
  }, []);

  const onPlayerDamagedRef = useRef(onPlayerDamaged);
  onPlayerDamagedRef.current = onPlayerDamaged;
  const onEnemyDefeatedRef = useRef(onEnemyDefeated);
  onEnemyDefeatedRef.current = onEnemyDefeated;
  const onCollectLootRef = useRef(onCollectLoot);
  onCollectLootRef.current = onCollectLoot;
  const onDrainBatteryRef = useRef(onDrainBattery);
  onDrainBatteryRef.current = onDrainBattery;
  const sfxRef = useRef(sfx);
  sfxRef.current = sfx;

  const blasterDamageMultiplierRef = useRef(blasterDamageMultiplier);
  blasterDamageMultiplierRef.current = blasterDamageMultiplier;
  const miningSpeedMultiplierRef = useRef(miningSpeedMultiplier);
  miningSpeedMultiplierRef.current = miningSpeedMultiplier;
  const miningYieldMultiplierRef = useRef(miningYieldMultiplier);
  miningYieldMultiplierRef.current = miningYieldMultiplier;
  const buildingCostMultiplierRef = useRef(buildingCostMultiplier);
  buildingCostMultiplierRef.current = buildingCostMultiplier;
  const isDustStormActiveRef = useRef(isDustStormActive);
  isDustStormActiveRef.current = isDustStormActive;
  const orbitalPingsRef = useRef(orbitalPings);
  useEffect(() => {
    orbitalPingsRef.current = orbitalPings;
  }, [orbitalPings]);

  // Fire Suit Pulse Blaster (360-degree vector shooting)
  const fireBlaster = useCallback((targetWorldX, targetWorldY, customAngle = null) => {
    if (isGameOver || isPaused) return;
    const now = performance.now() / 1000;
    if (now - lastFireTimeRef.current < (BLASTER_CONFIG?.cooldownSeconds || 0.18)) return;
    lastFireTimeRef.current = now;
    lastBlasterFireTimeRef.current = Date.now();

    const px = playerAnimPosRef.current.x + 0.5;
    const py = playerAnimPosRef.current.y + 0.5;

    let shotAngle;
    if (customAngle !== null) {
      shotAngle = customAngle;
    } else {
      const dx = targetWorldX - px;
      const dy = targetWorldY - py;
      shotAngle = Math.atan2(dy, dx);
    }
    aimAngleRef.current = shotAngle;

    // Dynamically aim player facing direction towards shot angle
    if (shotAngle >= -Math.PI * 0.25 && shotAngle <= Math.PI * 0.25) {
      playerFacingRef.current = 'right';
    } else if (shotAngle > Math.PI * 0.25 && shotAngle < Math.PI * 0.75) {
      playerFacingRef.current = 'down';
    } else if (shotAngle < -Math.PI * 0.25 && shotAngle > -Math.PI * 0.75) {
      playerFacingRef.current = 'up';
    } else {
      playerFacingRef.current = 'left';
    }

    const dirX = Math.cos(shotAngle);
    const dirY = Math.sin(shotAngle);
    const speed = BLASTER_CONFIG?.speed || 16;

    projectilesRef.current.push({
      x: px + dirX * 0.45,
      y: py + dirY * 0.45,
      vx: dirX * speed,
      vy: dirY * speed,
      distTraveled: 0,
      maxDist: BLASTER_CONFIG?.range || 14,
      active: true,
    });

    // Weapon tactile screen recoil
    shakeDurationRef.current = Math.max(shakeDurationRef.current, 0.1);

    onDrainBatteryRef.current?.(BLASTER_CONFIG?.energyCost || 0.15);
    sfxRef.current?.playBlaster?.();
    addParticles(px + dirX * 0.5, py + dirY * 0.5, '#38bdf8', 8);
    addParticles(px + dirX * 0.5, py + dirY * 0.5, '#ffffff', 4);
  }, [isGameOver, isPaused]);

  const currentTileX = Math.round(playerPos.x);
  const currentTileY = Math.round(playerPos.y);
  const currentTile =
    isWithinBounds(currentTileX, currentTileY)
      ? grid[currentTileY]?.[currentTileX]
      : null;

  const isStandingOnResource =
    currentTile &&
    (currentTile.type === TILE_TYPES.REGOLITH_NODE ||
      currentTile.type === TILE_TYPES.ICE_NODE);

  // Space key trigger for Blaster (Shoots towards current mouse position or facing direction)
  useEffect(() => {
    const handleBlasterKeyDown = (e) => {
      if (isGameOver || isPaused) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const isSpace = e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar';
      if (isSpace) {
        e.preventDefault();
        if (mouseWorldPosRef.current) {
          fireBlaster(mouseWorldPosRef.current.x, mouseWorldPosRef.current.y);
        } else {
          const facing = playerFacingRef.current;
          let angle = Math.PI / 2;
          if (facing === 'right') angle = 0;
          else if (facing === 'left') angle = Math.PI;
          else if (facing === 'up') angle = -Math.PI / 2;
          fireBlaster(null, null, angle);
        }
      }
    };
    window.addEventListener('keydown', handleBlasterKeyDown);
    return () => window.removeEventListener('keydown', handleBlasterKeyDown);
  }, [fireBlaster, isGameOver, isPaused]);

  // Mobile & HUD Blaster Button trigger (Shoots strictly in player's current facing direction)
  useEffect(() => {
    if (blasterTriggerCount > prevBlasterTriggerCountRef.current) {
      prevBlasterTriggerCountRef.current = blasterTriggerCount;
      const facing = playerFacingRef.current;
      let angle = Math.PI / 2; // down
      if (facing === 'right') angle = 0;
      else if (facing === 'left') angle = Math.PI;
      else if (facing === 'up') angle = -Math.PI / 2;
      fireBlaster(null, null, angle);
    }
  }, [blasterTriggerCount, fireBlaster]);

  const addFloatingText = (x, y, text, color = '#facc15') => {
    floatingTextsRef.current.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      vy: -0.6,
      life: 1.2,
    });
  };

  const addParticles = (x, y, color = '#e07a5f', count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2.0;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3,
        life: 1.0,
      });
    }
  };

  // Vital damage indicators: floating text, micro-shake, and hurt SFX when HP drops from hunger/thirst/suffocation
  const prevHealthRef = useRef(health);
  useEffect(() => {
    if (health < prevHealthRef.current && (prevHealthRef.current - health) >= 0.25) {
      const drop = Math.round((prevHealthRef.current - health) * 10) / 10;
      let reason = '';
      if (o2 <= 0) reason = isRtl ? 'اختناق!' : 'O2!';
      else if (thirst <= 0) reason = isRtl ? 'عطش!' : 'Water!';
      else if (hunger <= 0) reason = isRtl ? 'جوع!' : 'Food!';
      else if (bodyTemp < 32.0) reason = isRtl ? 'صقيع!' : 'Cold!';

      const text = reason ? `-${drop} HP (${reason})` : `-${drop} HP`;
      addFloatingText(playerAnimPosRef.current.x + 0.5, playerAnimPosRef.current.y - 0.25, text, '#ef4444');
      shakeDurationRef.current = Math.min(0.25, (shakeDurationRef.current || 0) + 0.15);
      sfx?.playPlayerHurt?.();
    }
    prevHealthRef.current = health;
  }, [health, o2, thirst, hunger, bodyTemp, isRtl, sfx]);

  // Unstuck Safeguard: Automatically eject player if ever spawned or clipped inside a solid structure (like the Vehicle base)
  useEffect(() => {
    const px = Math.round(playerPos.x);
    const py = Math.round(playerPos.y);
    if (isWithinBounds(px, py) && !isTileWalkable(grid, px, py)) {
      setPlayerPos({ x: vehiclePos.x + 2, y: vehiclePos.y + 1 });
    }
  }, [grid, playerPos.x, playerPos.y, vehiclePos.x, vehiclePos.y, setPlayerPos]);

  // Symmetric 2x2 bounding box proximity to Rover & Base
  const vx = vehiclePos.x;
  const vy = vehiclePos.y;
  const clx = Math.max(vx, Math.min(playerPos.x, vx + 1));
  const cly = Math.max(vy, Math.min(playerPos.y, vy + 1));
  const distToRover = Math.hypot(playerPos.x - clx, playerPos.y - cly);

  let nearDepotFound = false;
  if (Array.isArray(grid)) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = Math.round(playerPos.x) + dx;
        const ty = Math.round(playerPos.y) + dy;
        const t = grid[ty]?.[tx]?.type;
        if (t === TILE_TYPES.HAB || t === TILE_TYPES.VEHICLE) {
          nearDepotFound = true;
          break;
        }
      }
      if (nearDepotFound) break;
    }
  }

  const isNearVehicle = distToRover <= 2.2 || nearDepotFound;
  const isColonyPowered = powerMetrics ? (powerMetrics.net >= 0 || batteryCharge > 0) : true;
  const inWarmthZone = isTileInThermalZone(grid, playerPos.x + 0.5, playerPos.y + 0.5, habPos, isColonyPowered, { isDay, playerPos, grid });

  let nearRipeBiodome = false;
  let nearIcePurifier = false;
  let nearCommsDish = false;
  let nearCollectibleBuilding = null;
  let nearInspectableBuilding = null;
  let nearCaveExit = null;
  let nearCaveProp = null;

  // Directional offsets prioritizing the tile in front of the player's facing direction
  const facingDir = playerFacingRef.current || 'down';
  const neighborOffsets = (() => {
    switch (facingDir) {
      case 'up':
        return [
          { dx: 0, dy: -1 }, // directly in front
          { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, // front diagonals
          { dx: -1, dy: 0 }, { dx: 1, dy: 0 },   // sides
          { dx: 0, dy: 1 },  { dx: -1, dy: 1 }, { dx: 1, dy: 1 } // behind
        ];
      case 'down':
        return [
          { dx: 0, dy: 1 }, // directly in front
          { dx: -1, dy: 1 }, { dx: 1, dy: 1 }, // front diagonals
          { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, // sides
          { dx: 0, dy: -1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 } // behind
        ];
      case 'left':
        return [
          { dx: -1, dy: 0 }, // directly in front
          { dx: -1, dy: -1 }, { dx: -1, dy: 1 }, // front diagonals
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 },   // above / below
          { dx: 1, dy: 0 },  { dx: 1, dy: -1 }, { dx: 1, dy: 1 } // behind
        ];
      case 'right':
        return [
          { dx: 1, dy: 0 }, // directly in front
          { dx: 1, dy: -1 }, { dx: 1, dy: 1 }, // front diagonals
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, // above / below
          { dx: -1, dy: 0 }, { dx: -1, dy: -1 }, { dx: -1, dy: 1 } // behind
        ];
      default:
        return [
          { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
          { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: -1 }
        ];
    }
  })();

  const curTile = grid[currentTileY]?.[currentTileX];
  if (curTile?.type === TILE_TYPES.CAVE_EXIT) {
    nearCaveExit = { tile: curTile, x: currentTileX, y: currentTileY };
  } else if (curTile?.type === TILE_TYPES.CAVE_PROP || curTile?.type === TILE_TYPES.CAVE_TURBINE_CORE) {
    nearCaveProp = { tile: curTile, x: currentTileX, y: currentTileY };
  }

  for (const { dx, dy } of neighborOffsets) {
    const tx = currentTileX + dx;
    const ty = currentTileY + dy;
    if (isWithinBounds(tx, ty, grid)) {
      const neighbor = grid[ty]?.[tx];
      if (neighbor?.type === TILE_TYPES.CAVE_EXIT && !nearCaveExit) {
        nearCaveExit = { tile: neighbor, x: tx, y: ty };
      } else if ((neighbor?.type === TILE_TYPES.CAVE_PROP || neighbor?.type === TILE_TYPES.CAVE_TURBINE_CORE) && !nearCaveProp) {
        nearCaveProp = { tile: neighbor, x: tx, y: ty };
      } else if (
        neighbor &&
        neighbor.type !== TILE_TYPES.EMPTY &&
        neighbor.type !== TILE_TYPES.REGOLITH_NODE &&
        neighbor.type !== TILE_TYPES.ICE_NODE &&
        neighbor.type !== TILE_TYPES.CAVE_WALL &&
        neighbor.type !== TILE_TYPES.CAVE_FLOOR
      ) {
        const isRoverOrHab = neighbor.type === TILE_TYPES.VEHICLE || neighbor.isVehicle || (neighbor.type === TILE_TYPES.HAB && !neighbor.storedAmount);
        const isCollectible = neighbor.type === TILE_TYPES.BIODOME || neighbor.type === TILE_TYPES.ICE_PURIFIER;
        if (isCollectible && neighbor.storedAmount && neighbor.storedAmount > 0 && !nearCollectibleBuilding) {
          nearCollectibleBuilding = { tile: neighbor, x: tx, y: ty, isVehicle: isRoverOrHab };
        } else if (!nearInspectableBuilding && !nearCollectibleBuilding) {
          nearInspectableBuilding = { tile: neighbor, x: tx, y: ty, isVehicle: isRoverOrHab };
        }
      }
      if (neighbor?.type === TILE_TYPES.BIODOME && (cropGrowth >= 100 || (neighbor.storedAmount && neighbor.storedAmount > 0))) {
        nearRipeBiodome = true;
      }
      if (neighbor?.type === TILE_TYPES.ICE_PURIFIER) {
        nearIcePurifier = true;
      }
      if (neighbor?.type === TILE_TYPES.COMMS_ARRAY) {
        nearCommsDish = true;
      }
    }
  }

  const targetedBuilding = nearCollectibleBuilding || nearInspectableBuilding;
  const targetedBuildingRef = useRef(null);
  targetedBuildingRef.current = targetedBuilding;

  const currentBackpackLoad = (backpack?.regolith || 0) + (backpack?.ice || 0) + (backpack?.xenoCrystals || 0);
  const backpackLoadRatio = Math.min(1.0, currentBackpackLoad / (backpackCapacity || 20));
  const isBackpackHeavy = backpackLoadRatio >= 0.75;
  const isBackpackFull = currentBackpackLoad >= (backpackCapacity || 20);

  // Handle Mining Interaction
  useEffect(() => {
    if (isGameOver || isPaused) {
      if (isMining) {
        setIsMining(false);
        onMiningStateChange?.(false);
      }
      return;
    }

    if (keys.e && isStandingOnResource) {
      if (isBackpackFull) {
        setIsMining(false);
        onMiningStateChange?.(false);
        if (Math.random() < 0.05) {
          addFloatingText(currentTileX + 0.5, currentTileY, t.backpackFull, '#ef4444');
        }
        return;
      }

      setIsMining(true);
      onMiningStateChange?.(true);

      const drillMultiplier = (hasHeavyDrill ? 2.2 : 1.0) * (miningSpeedMultiplierRef.current || 1.0);
      miningProgressRef.current += 0.08 * drillMultiplier * effectiveThermalSpeed;

      if (Math.random() < 0.65) {
        const isIce = currentTile.type === TILE_TYPES.ICE_NODE;
        addParticles(
          currentTileX + 0.5 + (Math.random() - 0.5) * 0.2,
          currentTileY + 0.5 + (Math.random() - 0.5) * 0.2,
          isIce ? (Math.random() > 0.5 ? '#38bdf8' : '#ffffff') : (Math.random() > 0.5 ? '#f59e0b' : '#ea580c'),
          3
        );
      }

      if (miningProgressRef.current >= 1.0) {
        miningProgressRef.current = 0;
        shakeDurationRef.current = Math.max(shakeDurationRef.current, 0.08);

        const isIce = currentTile.type === TILE_TYPES.ICE_NODE;
        addParticles(currentTileX + 0.5, currentTileY + 0.5, isIce ? '#38bdf8' : '#f59e0b', 8);
        addParticles(currentTileX + 0.5, currentTileY + 0.5, '#ffffff', 4);

        let totalYield = currentTile.type === TILE_TYPES.ICE_NODE ? 4 : 5;
        if (hasCarbonExo) totalYield += 1;
        if (hasNaniteDrill) totalYield += 2;
        totalYield = Math.round(totalYield * (miningYieldMultiplierRef.current || 1.0));

        const spaceLeft = backpackCapacity - currentBackpackLoad;
        const actualHarvest = Math.min(totalYield, spaceLeft);

        if (actualHarvest > 0) {
          setGrid((prevGrid) => {
            const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));
            const target = newGrid[currentTileY][currentTileX];

            if (target.resourceAmount > 0) {
              const harvested = Math.min(target.resourceAmount, actualHarvest);
              target.resourceAmount -= harvested;

              if (target.type === TILE_TYPES.REGOLITH_NODE) {
                setBackpack((b) => ({ ...b, regolith: b.regolith + harvested }));
                addFloatingText(currentTileX + 0.5, currentTileY + 0.2, `+${harvested} ${t.regolith}`, '#f59e0b');
              } else if (target.type === TILE_TYPES.ICE_NODE) {
                setBackpack((b) => ({ ...b, ice: b.ice + harvested }));
                addFloatingText(currentTileX + 0.5, currentTileY + 0.2, `+${harvested} ${t.ice}`, '#38bdf8');
              }

              if (target.resourceAmount <= 0) {
                target.type = TILE_TYPES.EMPTY;
                target.resourceAmount = 0;
                addParticles(currentTileX + 0.5, currentTileY + 0.5, '#facc15', 14);
              }
            }
            return newGrid;
          });
        }
      }
    } else {
      if (isMining) {
        setIsMining(false);
        onMiningStateChange?.(false);
      }
      miningProgressRef.current = 0;
    }
  }, [
    keys.e,
    isStandingOnResource,
    isBackpackFull,
    currentTileX,
    currentTileY,
    currentTile,
    hasHeavyDrill,
    hasCarbonExo,
    hasNaniteDrill,
    backpackCapacity,
    currentBackpackLoad,
    effectiveThermalSpeed,
    isGameOver,
    isPaused,
    setGrid,
    setBackpack,
    onMiningStateChange,
    t,
  ]);



  // Main Render & Camera Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = (time) => {
      const dt = Math.min(0.1, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      // Update smooth continuous day/night transition factor (buttery fluid at 60fps)
      const targetNightAlpha = getSolNightFactor(solProgress, isDay);
      nightAlphaRef.current += (targetNightAlpha - nightAlphaRef.current) * Math.min(1.0, dt * 3.5);
      const currentNightAlpha = Math.max(0, Math.min(1, nightAlphaRef.current));

      // Handle movement & facing direction
      if (!isPaused && !isGameOver) {
        let dx = 0;
        let dy = 0;

        if (keys.up) {
          dy -= 1;
          playerFacingRef.current = 'up';
        }
        if (keys.down) {
          dy += 1;
          playerFacingRef.current = 'down';
        }
        if (keys.left) {
          dx -= 1;
          playerFacingRef.current = 'left';
        }
        if (keys.right) {
          dx += 1;
          playerFacingRef.current = 'right';
        }

        // Positional delta tracking for mobile virtual controls
        const pDx = playerPosRef.current.x - (prevPosRef.current?.x ?? playerPosRef.current.x);
        const pDy = playerPosRef.current.y - (prevPosRef.current?.y ?? playerPosRef.current.y);
        prevPosRef.current = { x: playerPosRef.current.x, y: playerPosRef.current.y };

        const isActivelyMoving = Boolean(keys.up || keys.down || keys.left || keys.right) || Math.hypot(pDx, pDy) > 0.001;
        isMovingRef.current = isActivelyMoving;

        if (!keys.up && !keys.down && !keys.left && !keys.right && Math.hypot(pDx, pDy) > 0.001) {
          if (Math.abs(pDx) > Math.abs(pDy)) {
            playerFacingRef.current = pDx > 0 ? 'right' : 'left';
          } else {
            playerFacingRef.current = pDy > 0 ? 'down' : 'up';
          }
        }

        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }

        if (dx !== 0 || dy !== 0) {
          const currentX = playerPosRef.current.x;
          const currentY = playerPosRef.current.y;
          const nextX = currentX + dx * moveSpeed * dt;
          const nextY = currentY + dy * moveSpeed * dt;

          let finalX = currentX;
          let finalY = currentY;

          const curGridW = grid[0]?.length || GRID_SIZE;
          const curGridH = grid.length || GRID_SIZE;

          if (
            isWithinBounds(Math.round(nextX), Math.round(currentY), grid) &&
            isTileWalkable(grid, Math.round(nextX), Math.round(currentY))
          ) {
            finalX = Math.max(0.2, Math.min(curGridW - 1.2, nextX));
          }

          if (
            isWithinBounds(Math.round(currentX), Math.round(nextY), grid) &&
            isTileWalkable(grid, Math.round(currentX), Math.round(nextY))
          ) {
            finalY = Math.max(0.2, Math.min(curGridH - 1.2, nextY));
          }

          if (finalX !== currentX || finalY !== currentY) {
            setPlayerPos({ x: finalX, y: finalY });
          }
        }
      } else {
        isMovingRef.current = false;
      }

      playerAnimPosRef.current.x += (playerPosRef.current.x - playerAnimPosRef.current.x) * 0.35;
      playerAnimPosRef.current.y += (playerPosRef.current.y - playerAnimPosRef.current.y) * 0.35;

      // Dynamic Footstep Decal Stamp on Martian Sand
      const distSinceLastStep = Math.hypot(
        playerAnimPosRef.current.x - lastFootstepPosRef.current.x,
        playerAnimPosRef.current.y - lastFootstepPosRef.current.y
      );
      if (distSinceLastStep >= 0.38 && isMovingRef.current) {
        lastFootstepPosRef.current = {
          x: playerAnimPosRef.current.x,
          y: playerAnimPosRef.current.y,
        };
        const curY = Math.round(playerAnimPosRef.current.y);
        const curX = Math.round(playerAnimPosRef.current.x);
        const currentTileCheck = isWithinBounds(curX, curY) ? grid[curY]?.[curX] : null;
        if (
          currentTileCheck &&
          currentTileCheck.type !== TILE_TYPES.HAB &&
          currentTileCheck.type !== TILE_TYPES.VEHICLE
        ) {
          const moveAngle = Math.atan2(
            playerAnimPosRef.current.y - (prevPosRef.current?.y ?? playerAnimPosRef.current.y),
            playerAnimPosRef.current.x - (prevPosRef.current?.x ?? playerAnimPosRef.current.x)
          );
          footstepsRef.current.push({
            x: playerAnimPosRef.current.x + 0.5,
            y: playerAnimPosRef.current.y + 0.5,
            angle: moveAngle,
            alpha: 0.5,
            life: 6.0,
            foot: footstepsRef.current.length % 2 === 0 ? -1 : 1,
          });
          if (footstepsRef.current.length > 55) {
            footstepsRef.current.shift();
          }
        }
      }

      const dpr = window.devicePixelRatio || 1;
      const viewportW = canvas.clientWidth || 800;
      const viewportH = canvas.clientHeight || 600;

      if (canvas.width !== Math.round(viewportW * dpr) || canvas.height !== Math.round(viewportH * dpr)) {
        canvas.width = Math.round(viewportW * dpr);
        canvas.height = Math.round(viewportH * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (activeCaveInfo) {
        ctx.fillStyle = '#050711';
        ctx.fillRect(0, 0, viewportW, viewportH);
      } else {
        ctx.clearRect(0, 0, viewportW, viewportH);
      }

      const tileSize = TILE_SIZE;

      // CAMERA VIEWPORT LOGIC (Follows player smoothly across world)
      const targetCamX = playerAnimPosRef.current.x * tileSize - viewportW / 2 + tileSize / 2;
      const targetCamY = playerAnimPosRef.current.y * tileSize - viewportH / 2 + tileSize / 2;

      const curGridW = grid[0]?.length || GRID_SIZE;
      const curGridH = grid.length || GRID_SIZE;

      let clampedTargetX, clampedTargetY;
      if (curGridW * tileSize <= viewportW) {
        clampedTargetX = (curGridW * tileSize - viewportW) / 2;
      } else {
        const maxCamX = curGridW * tileSize - viewportW;
        clampedTargetX = Math.max(0, Math.min(maxCamX, targetCamX));
      }

      if (curGridH * tileSize <= viewportH) {
        clampedTargetY = (curGridH * tileSize - viewportH) / 2;
      } else {
        const maxCamY = curGridH * tileSize - viewportH;
        clampedTargetY = Math.max(0, Math.min(maxCamY, targetCamY));
      }

      cameraPosRef.current.x += (clampedTargetX - cameraPosRef.current.x) * 0.15;
      cameraPosRef.current.y += (clampedTargetY - cameraPosRef.current.y) * 0.15;

      const camX = cameraPosRef.current.x;
      const camY = cameraPosRef.current.y;

      // Screen Shake Calculation
      let shakeX = 0;
      let shakeY = 0;
      if (shakeDurationRef.current > 0) {
        shakeDurationRef.current = Math.max(0, shakeDurationRef.current - dt);
        const shakeAmp = (shakeDurationRef.current / 0.3) * 7;
        shakeX = (Math.random() - 0.5) * shakeAmp;
        shakeY = (Math.random() - 0.5) * shakeAmp;
      }

      // Notify parent minimap about camera position periodically
      if (Math.random() < 0.1 && onCameraUpdate) {
        onCameraUpdate({
          x: camX / tileSize,
          y: camY / tileSize,
          width: viewportW / tileSize,
          height: viewportH / tileSize,
        });
      }

      // Exploration Shadow (Fog of War) Buffer & Canvas Update
      // Simple black shadow covering unexplored sectors, cleanly lifted as the player moves.
      const isCave = !!activeCaveInfo;
      const currentCaveId = activeCaveInfo?.id || null;
      if (currentCaveId !== lastActiveCaveIdRef.current) {
        lastActiveCaveIdRef.current = currentCaveId;
        fogNeedsRedrawRef.current = true;
        lastExploredPosRef.current = { x: -999, y: -999 };
      }

      const totalTiles = curGridW * curGridH;
      let currentExploredBuf = null;

      if (isCave) {
        if (!caveExploredBufRef.current || caveExploredBufRef.current.length !== totalTiles) {
          caveExploredBufRef.current = new Uint8Array(totalTiles);
          const caveSpawnX = Math.round(playerPosRef.current.x);
          const caveSpawnY = Math.round(playerPosRef.current.y);
          const cRad = 3.2;
          for (let cy = Math.max(0, Math.floor(caveSpawnY - cRad)); cy <= Math.min(curGridH - 1, Math.ceil(caveSpawnY + cRad)); cy++) {
            for (let cx = Math.max(0, Math.floor(caveSpawnX - cRad)); cx <= Math.min(curGridW - 1, Math.ceil(caveSpawnX + cRad)); cx++) {
              if (Math.hypot(cx - caveSpawnX, cy - caveSpawnY) <= cRad) {
                caveExploredBufRef.current[cy * curGridW + cx] = 1;
              }
            }
          }
          fogNeedsRedrawRef.current = true;
        }
        currentExploredBuf = caveExploredBufRef.current;
      } else {
        if (!exploredTilesRef?.current || exploredTilesRef.current.length !== totalTiles) {
          if (exploredTilesRef) {
            exploredTilesRef.current = new Uint8Array(totalTiles);
            if (vehiclePos) {
              const vCenterX = vehiclePos.x + 1.0;
              const vCenterY = vehiclePos.y + 1.0;
              const hasDrone = loadout?.includes('mapping_drone');
              const vRad = hasDrone ? 5.5 : 4.2;
              const vRadSq = vRad * vRad;
              for (let vy = Math.max(0, Math.floor(vCenterY - vRad)); vy <= Math.min(curGridH - 1, Math.ceil(vCenterY + vRad)); vy++) {
                const dySq = (vy - vCenterY) * (vy - vCenterY);
                const rOff = vy * curGridW;
                for (let vx = Math.max(0, Math.floor(vCenterX - vRad)); vx <= Math.min(curGridW - 1, Math.ceil(vCenterX + vRad)); vx++) {
                  if ((vx - vCenterX) * (vx - vCenterX) + dySq <= vRadSq) {
                    exploredTilesRef.current[rOff + vx] = 1;
                  }
                }
              }
            }
            fogNeedsRedrawRef.current = true;
          }
        }
        currentExploredBuf = exploredTilesRef?.current;
      }

      if (currentExploredBuf) {
        const apx = playerAnimPosRef.current.x + 0.5;
        const apy = playerAnimPosRef.current.y + 0.5;
        const distMoved = Math.hypot(apx - lastExploredPosRef.current.x, apy - lastExploredPosRef.current.y);

        if (distMoved >= 0.2 || fogNeedsRedrawRef.current) {
          lastExploredPosRef.current = { x: apx, y: apy };
          const hasDrone = loadout?.includes('mapping_drone');
          const normalWalkRadius = isFlashlightOn ? FOG_VISION_RADIUS_LIGHT : FOG_VISION_RADIUS_WALK;
          const exploreRadius = isCave
            ? (isFlashlightOn ? 2.0 : 1.6)
            : (hasDrone ? 2.8 : normalWalkRadius);
          const rSq = exploreRadius * exploreRadius;

          const minX = Math.max(0, Math.floor(apx - exploreRadius));
          const maxX = Math.min(curGridW - 1, Math.ceil(apx + exploreRadius));
          const minY = Math.max(0, Math.floor(apy - exploreRadius));
          const maxY = Math.min(curGridH - 1, Math.ceil(apy + exploreRadius));

          let newlyRevealed = false;
          for (let gy = minY; gy <= maxY; gy++) {
            const dySq = (gy - apy) * (gy - apy);
            const rowOffset = gy * curGridW;
            for (let gx = minX; gx <= maxX; gx++) {
              if ((gx - apx) * (gx - apx) + dySq <= rSq) {
                const idx = rowOffset + gx;
                if (currentExploredBuf[idx] !== 1) {
                  currentExploredBuf[idx] = 1;
                  newlyRevealed = true;
                }
              }
            }
          }

          // Keep vehicle sanctuary perimeter permanently revealed on surface
          if (!isCave && vehiclePos) {
            const vCenterX = vehiclePos.x + 1.0;
            const vCenterY = vehiclePos.y + 1.0;
            const vRad = hasDrone ? 5.5 : 4.2;
            const vRadSq = vRad * vRad;
            const vMinX = Math.max(0, Math.floor(vCenterX - vRad));
            const vMaxX = Math.min(curGridW - 1, Math.ceil(vCenterX + vRad));
            const vMinY = Math.max(0, Math.floor(vCenterY - vRad));
            const vMaxY = Math.min(curGridH - 1, Math.ceil(vCenterY + vRad));
            for (let vy = vMinY; vy <= vMaxY; vy++) {
              const vDySq = (vy - vCenterY) * (vy - vCenterY);
              const vRow = vy * curGridW;
              for (let vx = vMinX; vx <= vMaxX; vx++) {
                if ((vx - vCenterX) * (vx - vCenterX) + vDySq <= vRadSq) {
                  const vIdx = vRow + vx;
                  if (currentExploredBuf[vIdx] !== 1) {
                    currentExploredBuf[vIdx] = 1;
                    newlyRevealed = true;
                  }
                }
              }
            }
          }

          if (newlyRevealed || fogNeedsRedrawRef.current) {
            if (!fogCanvasRef.current) {
              fogCanvasRef.current = document.createElement('canvas');
            }
            const fc = fogCanvasRef.current;
            if (fc.width !== curGridW || fc.height !== curGridH) {
              fc.width = curGridW;
              fc.height = curGridH;
            }
            const fCtx = fc.getContext('2d');
            const imgData = fCtx.createImageData(curGridW, curGridH);
            const data32 = new Uint32Array(imgData.data.buffer);
            for (let i = 0; i < totalTiles; i++) {
              data32[i] = currentExploredBuf[i] === 1 ? 0x00000000 : 0xFF000000;
            }
            fCtx.putImageData(imgData, 0, 0);
            fogNeedsRedrawRef.current = false;
          }
        }
      }

      // Translate Canvas Context for Camera Panning with screen shake
      ctx.save();
      ctx.translate(-camX + shakeX, -camY + shakeY);

      if (activeCaveInfo) {
        // Deep impenetrable Martian bedrock casing surrounding the subterranean cave interior
        ctx.fillStyle = '#060814';
        ctx.fillRect(-tileSize * 10, -tileSize * 10, (curGridW + 20) * tileSize, (curGridH + 20) * tileSize);
      }


      // 1. Draw Visible Mars Terrain
      const startX = Math.max(0, Math.floor(camX / tileSize));
      const endX = Math.min(curGridW, Math.ceil((camX + viewportW) / tileSize));
      const startY = Math.max(0, Math.floor(camY / tileSize));
      const endY = Math.min(curGridH, Math.ceil((camY + viewportH) / tileSize));

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const px = x * tileSize;
          const py = y * tileSize;
          const tile = grid[y]?.[x];

          const isCaveTile = !!activeCaveInfo || tile?.type === TILE_TYPES.CAVE_FLOOR || tile?.type === TILE_TYPES.CAVE_WALL;
          const elevation = tile ? tile.elevation : 0.5;
          const redVal = Math.floor(38 + elevation * 15);
          const greenVal = Math.floor(18 + elevation * 10);
          const blueVal = Math.floor(14 + elevation * 8);

          let groundSpriteKey = 'terrain_regolith_1';
          if (tile?.type === TILE_TYPES.ICE_NODE) {
            groundSpriteKey = 'terrain_ice';
          } else if (tile?.type === TILE_TYPES.HAB || tile?.type === TILE_TYPES.VEHICLE) {
            groundSpriteKey = 'terrain_metal';
          } else if (tile?.type === TILE_TYPES.CAVE_FLOOR && tile?.floorSprite) {
            groundSpriteKey = tile.floorSprite;
          } else if (tile?.type === TILE_TYPES.CAVE_WALL && tile?.wallSprite) {
            groundSpriteKey = tile.wallSprite;
          } else if ((x * 7 + y * 13) % 2 === 1) {
            groundSpriteKey = 'terrain_regolith_2';
          }

          const groundSprite = getSprite(groundSpriteKey);
          if (groundSprite && groundSprite.complete && groundSprite.naturalWidth > 0) {
            ctx.drawImage(groundSprite, px, py, tileSize, tileSize);
            if (!isCaveTile) {
              ctx.strokeStyle = 'rgba(140, 59, 35, 0.12)';
              ctx.lineWidth = 0.8;
              ctx.strokeRect(px, py, tileSize, tileSize);
            }
          } else {
            ctx.fillStyle = isCaveTile ? '#0b0f19' : `rgb(${redVal}, ${greenVal}, ${blueVal})`;
            ctx.fillRect(px, py, tileSize, tileSize);
            if (!isCaveTile) {
              ctx.strokeStyle = 'rgba(140, 59, 35, 0.22)';
              ctx.lineWidth = 1;
              ctx.strokeRect(px, py, tileSize, tileSize);
            }
          }

          // Subterranean bioluminescent moss glow
          if (activeCaveInfo && tile?.floorSprite === 'cave_floor_spore_moss') {
            const sporePulse = Math.sin(time * 0.004 + x * 1.5 + y * 2.1) * 0.15 + 0.35;
            ctx.save();
            ctx.fillStyle = `rgba(168, 85, 247, ${sporePulse * 0.35})`;
            ctx.beginPath();
            ctx.arc(px + tileSize * 0.5, py + tileSize * 0.5, tileSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Surface-only Terrain Features (Dunes, Fissures, Mineral Veins, Craters)
          if (!activeCaveInfo) {
            // Subtle elevation contour shading (soft rolling dunes)
            if (elevation > 0.65) {
              ctx.fillStyle = 'rgba(254, 215, 170, 0.04)';
              ctx.fillRect(px, py, tileSize, tileSize);
            } else if (elevation < 0.38) {
              ctx.fillStyle = 'rgba(15, 6, 4, 0.07)';
              ctx.fillRect(px, py, tileSize, tileSize);
            }

            // Surface Geological Fissures
            if (tile?.fissure) {
              ctx.save();
              ctx.translate(px + tileSize * 0.5, py + tileSize * 0.5);
              ctx.rotate(tile.fissureAngle || 0);
              const fl = (tile.fissureLength || 0.5) * tileSize;
              ctx.strokeStyle = 'rgba(18, 7, 5, 0.65)';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.moveTo(-fl / 2, 0);
              ctx.lineTo(-fl * 0.12, 3);
              ctx.lineTo(fl * 0.15, -2.5);
              ctx.lineTo(fl / 2, 1);
              ctx.stroke();
              ctx.strokeStyle = 'rgba(127, 29, 29, 0.35)';
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.restore();
            }

            // Subsurface Mineral Veins
            if (tile?.vein) {
              ctx.save();
              ctx.translate(px + tileSize * 0.5, py + tileSize * 0.5);
              ctx.rotate(tile.veinAngle || 0);
              const veinGlint = Math.sin(time * 0.003 + x * 2 + y * 3) * 0.15 + 0.3;
              ctx.strokeStyle = `rgba(245, 158, 11, ${veinGlint})`;
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.moveTo(-tileSize * 0.38, -3);
              ctx.quadraticCurveTo(0, 5, tileSize * 0.38, 2);
              ctx.stroke();
              if (veinGlint > 0.4) {
                ctx.fillStyle = '#fef08a';
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 5;
                ctx.beginPath();
                ctx.arc(0, 3, 1.5, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            }

            // Scattered Basalt Stones & Pixel-Art Martian Rock Props
            if (tile?.pebbles && tile.pebbles.length > 0) {
              tile.pebbles.forEach((peb) => {
                const pbx = px + peb.ox * tileSize;
                const pby = py + peb.oy * tileSize;
                const rockId = peb.rockId || (((x * 13 + y * 7 + (peb.ox * 100 | 0)) % 16) + 1);
                const rockSprite = getSprite(`rock_prop_${rockId}`);

                if (rockSprite && rockSprite.complete && rockSprite.naturalWidth > 0) {
                  const baseW = Math.max(8, peb.r * 3.4 * (peb.scale || 1));
                  const baseH = baseW * (rockSprite.naturalHeight / rockSprite.naturalWidth);
                  ctx.save();
                  ctx.translate(pbx, pby);
                  if (peb.rot) ctx.rotate(peb.rot);
                  if (peb.flipX) ctx.scale(-1, 1);

                  // Ground contact shadow
                  ctx.fillStyle = 'rgba(12, 5, 4, 0.42)';
                  ctx.beginPath();
                  ctx.ellipse(0, baseH * 0.35, baseW * 0.45, baseH * 0.22, 0, 0, Math.PI * 2);
                  ctx.fill();

                  // Rock sprite
                  ctx.drawImage(rockSprite, -baseW / 2, -baseH / 2, baseW, baseH);
                  ctx.restore();
                } else {
                  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
                  ctx.beginPath();
                  ctx.ellipse(pbx + 1, pby + 1.2, peb.r, peb.r * 0.6, 0, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = peb.shade || '#261511';
                  ctx.beginPath();
                  ctx.arc(pbx, pby, peb.r, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#6b2d1d';
                  ctx.beginPath();
                  ctx.arc(pbx - 0.5, pby - 0.5, peb.r * 0.45, 0, Math.PI * 2);
                  ctx.fill();
                }
              });
            }



            // Varied Impact Craters
            if (tile?.crater) {
              const craterKey = `crater_rock_${((tile.craterVariant || 0) % 4) + 1}`;
              const craterSprite = getSprite(craterKey) || getSprite('crater_rock');
              const craterScale = tile.craterScale || 0.76;
              const sSize = tileSize * craterScale;

              ctx.save();
              ctx.translate(px + tileSize / 2, py + tileSize / 2);
              ctx.rotate(tile.craterAngle || 0);

              // Dark impact bowl shadow
              ctx.fillStyle = 'rgba(16, 7, 5, 0.45)';
              ctx.beginPath();
              ctx.arc(0, 0, sSize * 0.4, 0, Math.PI * 2);
              ctx.fill();
              // Rim highlight
              ctx.strokeStyle = 'rgba(194, 94, 54, 0.25)';
              ctx.lineWidth = 1.4;
              ctx.stroke();

              if (craterSprite && craterSprite.complete && craterSprite.naturalWidth > 0) {
                ctx.globalAlpha = 0.82;
                ctx.drawImage(craterSprite, -sSize / 2, -sSize / 2, sSize, sSize);
              }
              ctx.restore();
            }

            // Docking Bay Runway Warning Strobes
            if (vehiclePos && (x === vehiclePos.x || x === vehiclePos.x + 1) && (y === vehiclePos.y || y === vehiclePos.y + 1)) {
              const strobeAlpha = Math.sin(time * 0.006) > 0.15 ? 0.95 : 0.2;
              const lx = x === vehiclePos.x ? px + 6 : px + tileSize - 6;
              const ly = y === vehiclePos.y ? py + 6 : py + tileSize - 6;
              ctx.save();
              ctx.fillStyle = `rgba(245, 158, 11, ${strobeAlpha})`;
              ctx.shadowColor = '#f59e0b';
              ctx.shadowBlur = 8 * strobeAlpha;
              ctx.beginPath();
              ctx.arc(lx, ly, 3.2, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        }
      }

      // 1.5. Render Fading Astronaut Footprint Trails
      for (let i = footstepsRef.current.length - 1; i >= 0; i--) {
        const step = footstepsRef.current[i];
        step.life -= dt;
        if (step.life <= 0) {
          footstepsRef.current.splice(i, 1);
          continue;
        }

        const spx = step.x * tileSize;
        const spy = step.y * tileSize;
        const currentAlpha = Math.max(0, (step.life / 6.0) * step.alpha);

        ctx.save();
        ctx.translate(spx, spy);
        ctx.rotate(step.angle);
        ctx.fillStyle = `rgba(24, 10, 6, ${currentAlpha})`;
        const footOffset = step.foot * 4;
        ctx.beginPath();
        ctx.ellipse(0, footOffset, 4.2, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(12, 4, 2, ${currentAlpha * 0.75})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-1, footOffset - 2);
        ctx.lineTo(-1, footOffset + 2);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Pass 2: Render Colony Structures & Resource Nodes
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const px = x * tileSize;
          const py = y * tileSize;
          const tile = grid[y]?.[x];

          if (tile) {
            switch (tile.type) {
              case TILE_TYPES.HAB: {
                const pulse = Math.sin(time * 0.003) * 0.15 + 0.85;
                const habSprite = getSprite('structure_hab');
                if (habSprite && habSprite.complete && habSprite.naturalWidth > 0) {
                  ctx.save();
                  ctx.shadowColor = 'rgba(56, 189, 248, 0.7)';
                  ctx.shadowBlur = 16 * pulse;
                  ctx.drawImage(habSprite, px + tileSize * 0.05, py + tileSize * 0.03, tileSize * 0.9, tileSize * 0.94);
                  ctx.restore();
                } else {
                  ctx.save();
                  ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
                  ctx.shadowBlur = 15;
                  ctx.fillStyle = '#1e293b';
                  ctx.beginPath();
                  ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.46, 0, Math.PI * 2);
                  ctx.fill();
                  const domeGrad = ctx.createRadialGradient(
                    px + tileSize * 0.4, py + tileSize * 0.4, 2,
                    px + tileSize / 2, py + tileSize / 2, tileSize * 0.4
                  );
                  domeGrad.addColorStop(0, '#f8fafc');
                  domeGrad.addColorStop(0.7, '#64748b');
                  domeGrad.addColorStop(1, '#0f172a');
                  ctx.fillStyle = domeGrad;
                  ctx.beginPath();
                  ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.38, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
                  ctx.fillRect(px + tileSize * 0.42, py + tileSize * 0.25, tileSize * 0.16, tileSize * 0.5);
                  ctx.fillRect(px + tileSize * 0.25, py + tileSize * 0.42, tileSize * 0.5, tileSize * 0.16);
                  ctx.restore();
                }

                // Contextual Proximity Badge for Constructed Storage Depot
                const distToDepot = Math.hypot(playerPos.x - (x + 0.5), playerPos.y - (y + 0.5));
                if (distToDepot <= 1.8) {
                  ctx.save();
                  const badgeW = 142;
                  const badgeH = 24;
                  const badgeX = px + tileSize / 2 - badgeW / 2;
                  const badgeY = py - 18;
                  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
                  ctx.strokeStyle = '#38bdf8';
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
                  ctx.fill();
                  ctx.stroke();
                  ctx.fillStyle = '#bae6fd';
                  ctx.font = 'bold 10px "Cairo", "JetBrains Mono", sans-serif';
                  ctx.textAlign = 'center';
                  ctx.fillText(`📦 ${t.storageDepot || 'مستودع إمدادات'} [E]`, px + tileSize / 2, badgeY + 16);
                  ctx.restore();
                }
                break;
              }

              case TILE_TYPES.VEHICLE: {
                // Handled in dedicated Pass 2.5 to avoid any tile clipping
                break;
              }

              case TILE_TYPES.REGOLITH_NODE: {
                const amountRatio = Math.max(0.3, tile.resourceAmount / (tile.maxResourceAmount || 30));
                const nodePulse = Math.sin(time * 0.0035 + x * 1.5 + y * 2) * 0.15 + 0.85;

                // Ambient ferrous thermal warmth ground glow
                ctx.save();
                const regAura = ctx.createRadialGradient(px + tileSize / 2, py + tileSize / 2, 4, px + tileSize / 2, py + tileSize / 2, tileSize * 0.5);
                regAura.addColorStop(0, `rgba(234, 88, 12, ${0.25 * nodePulse})`);
                regAura.addColorStop(1, 'rgba(234, 88, 12, 0)');
                ctx.fillStyle = regAura;
                ctx.beginPath();
                ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                const regolithSprite = getSprite('node_regolith');
                if (regolithSprite && regolithSprite.complete && regolithSprite.naturalWidth > 0) {
                  const scale = 0.55 + 0.45 * amountRatio;
                  const sSize = tileSize * 0.85 * scale;
                  ctx.save();
                  ctx.shadowColor = 'rgba(234, 88, 12, 0.55)';
                  ctx.shadowBlur = 10 * nodePulse;
                  ctx.drawImage(regolithSprite, px + (tileSize - sSize) / 2, py + (tileSize - sSize) / 2, sSize, sSize);
                  ctx.fillStyle = '#fef08a';
                  ctx.font = 'bold 9px "JetBrains Mono", monospace';
                  ctx.textAlign = 'center';
                  ctx.fillText(`${tile.resourceAmount}`, px + tileSize / 2, py + tileSize * 0.9);
                  ctx.restore();
                } else {
                  ctx.save();
                  ctx.fillStyle = '#8c3b23';
                  ctx.beginPath();
                  ctx.arc(px + tileSize / 2, py + tileSize / 2, (tileSize * 0.38) * amountRatio, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#5c2214';
                  ctx.beginPath();
                  ctx.arc(px + tileSize * 0.4, py + tileSize * 0.45, tileSize * 0.2 * amountRatio, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#fef08a';
                  ctx.font = '10px "JetBrains Mono", monospace';
                  ctx.textAlign = 'center';
                  ctx.fillText(`${tile.resourceAmount}`, px + tileSize / 2, py + tileSize * 0.88);
                  ctx.restore();
                }

                // Tiny rising warm mineral ember
                const emberY = py + tileSize * 0.45 - ((time * 0.015 + x * 12 + y * 17) % (tileSize * 0.38));
                const emberAlpha = Math.sin(((time * 0.015 + x * 12 + y * 17) % (tileSize * 0.38)) / (tileSize * 0.38) * Math.PI);
                if (emberAlpha > 0.1) {
                  ctx.save();
                  ctx.fillStyle = `rgba(254, 240, 138, ${emberAlpha * 0.75})`;
                  ctx.shadowColor = '#facc15';
                  ctx.shadowBlur = 4;
                  ctx.beginPath();
                  ctx.arc(px + tileSize * 0.5 + Math.sin(time * 0.003 + x) * 5, emberY, 1.4, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.restore();
                }
                break;
              }

              case TILE_TYPES.ICE_NODE: {
                const amountRatio = Math.max(0.3, tile.resourceAmount / (tile.maxResourceAmount || 20));
                const icePulse = Math.sin(time * 0.003 + x * 2 + y * 2) * 0.15 + 0.85;

                // Ambient cryogenic frost aura
                ctx.save();
                const iceAura = ctx.createRadialGradient(px + tileSize / 2, py + tileSize / 2, 6, px + tileSize / 2, py + tileSize / 2, tileSize * 0.55);
                iceAura.addColorStop(0, `rgba(56, 189, 248, ${0.3 * icePulse})`);
                iceAura.addColorStop(1, 'rgba(56, 189, 248, 0)');
                ctx.fillStyle = iceAura;
                ctx.beginPath();
                ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.55, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                const iceSprite = getSprite('node_ice');
                if (iceSprite && iceSprite.complete && iceSprite.naturalWidth > 0) {
                  const scale = 0.55 + 0.45 * amountRatio;
                  const sSize = tileSize * 0.85 * scale;
                  ctx.save();
                  ctx.shadowColor = 'rgba(56, 189, 248, 0.9)';
                  ctx.shadowBlur = 14 * icePulse;
                  ctx.drawImage(iceSprite, px + (tileSize - sSize) / 2, py + (tileSize - sSize) / 2, sSize, sSize);
                  ctx.fillStyle = '#bae6fd';
                  ctx.font = 'bold 9px "JetBrains Mono", monospace';
                  ctx.textAlign = 'center';
                  ctx.fillText(`${tile.resourceAmount}`, px + tileSize / 2, py + tileSize * 0.92);
                  ctx.restore();
                } else {
                  ctx.save();
                  ctx.shadowColor = 'rgba(56, 189, 248, 0.7)';
                  ctx.shadowBlur = 8;
                  ctx.fillStyle = '#38bdf8';
                  ctx.beginPath();
                  ctx.moveTo(px + tileSize / 2, py + tileSize * 0.2);
                  ctx.lineTo(px + tileSize * 0.8, py + tileSize * 0.5);
                  ctx.lineTo(px + tileSize * 0.65, py + tileSize * 0.8);
                  ctx.lineTo(px + tileSize * 0.35, py + tileSize * 0.8);
                  ctx.lineTo(px + tileSize * 0.2, py + tileSize * 0.5);
                  ctx.closePath();
                  ctx.fill();
                  ctx.fillStyle = '#bae6fd';
                  ctx.font = '10px "JetBrains Mono", monospace';
                  ctx.textAlign = 'center';
                  ctx.fillText(`${tile.resourceAmount}`, px + tileSize / 2, py + tileSize * 0.95);
                  ctx.restore();
                }

                // Crystalline Specular Sparkle Glint
                const glintFactor = Math.sin(time * 0.004 + x * 2.8 + y * 3.5);
                if (glintFactor > 0.6) {
                  const glintAlpha = (glintFactor - 0.6) / 0.4;
                  const gx = px + tileSize * 0.62;
                  const gy = py + tileSize * 0.34;
                  ctx.save();
                  ctx.translate(gx, gy);
                  ctx.strokeStyle = `rgba(255, 255, 255, ${glintAlpha})`;
                  ctx.lineWidth = 1.6;
                  ctx.shadowColor = '#38bdf8';
                  ctx.shadowBlur = 8;
                  ctx.beginPath();
                  ctx.moveTo(-5, 0); ctx.lineTo(5, 0);
                  ctx.moveTo(0, -5); ctx.lineTo(0, 5);
                  ctx.stroke();
                  ctx.fillStyle = '#ffffff';
                  ctx.beginPath();
                  ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.restore();
                }
                break;
              }

              case TILE_TYPES.SOLAR_ARRAY: {
                const solarSprite = getSprite('structure_solar');
                if (solarSprite && solarSprite.complete && solarSprite.naturalWidth > 0) {
                  ctx.save();
                  const solarIntensity = Math.max(0, 1.0 - currentNightAlpha);
                  if (solarIntensity > 0.05) {
                    ctx.shadowColor = 'rgba(250, 204, 21, 0.7)';
                    ctx.shadowBlur = 12 * solarIntensity;
                  }
                  ctx.drawImage(solarSprite, px + tileSize * 0.05, py + tileSize * 0.06, tileSize * 0.9, tileSize * 0.88);
                  ctx.restore();
                } else {
                  ctx.save();
                  ctx.fillStyle = '#475569';
                  ctx.fillRect(px + tileSize * 0.15, py + tileSize * 0.15, tileSize * 0.7, tileSize * 0.7);
                  ctx.fillStyle = '#0284c7';
                  ctx.fillRect(px + tileSize * 0.2, py + tileSize * 0.2, tileSize * 0.28, tileSize * 0.28);
                  ctx.fillRect(px + tileSize * 0.52, py + tileSize * 0.2, tileSize * 0.28, tileSize * 0.28);
                  ctx.fillRect(px + tileSize * 0.2, py + tileSize * 0.52, tileSize * 0.28, tileSize * 0.28);
                  ctx.fillRect(px + tileSize * 0.52, py + tileSize * 0.52, tileSize * 0.28, tileSize * 0.28);
                  ctx.strokeStyle = '#facc15';
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  ctx.moveTo(px + tileSize * 0.2, py + tileSize * 0.48);
                  ctx.lineTo(px + tileSize * 0.8, py + tileSize * 0.48);
                  ctx.stroke();
                  ctx.restore();
                }
                break;
              }

              case TILE_TYPES.BIODOME: {
                const bioStored = tile.storedAmount || 0;
                const isRipe = bioStored > 0 || cropGrowth >= 100;
                const harvestAmount = bioStored > 0 ? bioStored : 3;
                const bioSprite = getSprite('structure_biodome');
                if (bioSprite && bioSprite.complete && bioSprite.naturalWidth > 0) {
                  ctx.save();
                  ctx.shadowColor = isRipe ? 'rgba(250, 204, 21, 0.95)' : 'rgba(74, 222, 128, 0.5)';
                  ctx.shadowBlur = isRipe ? 20 : 8;
                  ctx.drawImage(bioSprite, px + tileSize * 0.05, py + tileSize * 0.03, tileSize * 0.9, tileSize * 0.94);

                  // Glowing golden bioluminescent crop sprouts inside and above the dome when ripe
                  if (isRipe) {
                    ctx.save();
                    ctx.fillStyle = '#fbbf24';
                    ctx.shadowColor = '#f59e0b';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(px + tileSize * 0.42, py + tileSize * 0.46, tileSize * 0.12, 0, Math.PI * 2);
                    ctx.arc(px + tileSize * 0.58, py + tileSize * 0.48, tileSize * 0.13, 0, Math.PI * 2);
                    ctx.arc(px + tileSize * 0.5, py + tileSize * 0.38, tileSize * 0.14, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                  }

                  const isNearThisBio = Math.hypot(playerPos.x - (x + 0.5), playerPos.y - (y + 0.5)) <= 1.8;
                  if (isRipe || isNearThisBio) {
                    ctx.fillStyle = isRipe ? '#fef08a' : '#93c5fd';
                    ctx.font = 'bold 8.5px "Cairo", "Orbitron", sans-serif';
                    ctx.textAlign = 'center';
                    const bioText = isRtl
                      ? (isRipe ? `🌾 [E] حصاد (+${harvestAmount}) | [R] شحن` : '🌱 [E] شحن | [R] فحص')
                      : (isRipe ? `🌾 [E] Harvest (+${harvestAmount}) | [R] Feed` : '🌱 [E] Feed | [R] Inspect');
                    ctx.fillText(bioText, px + tileSize / 2, py + tileSize * 0.9);
                  }
                  ctx.restore();
                } else {
                  ctx.save();
                  ctx.shadowColor = isRipe ? 'rgba(250, 204, 21, 0.9)' : 'rgba(74, 222, 128, 0.5)';
                  ctx.shadowBlur = isRipe ? 18 : 8;
                  ctx.fillStyle = '#166534';
                  ctx.beginPath();
                  ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.42, 0, Math.PI * 2);
                  ctx.fill();
                  const growthScale = isRipe ? 0.35 : (0.1 + (cropGrowth / 100) * 0.25);
                  ctx.fillStyle = isRipe ? '#eab308' : '#22c55e';
                  ctx.beginPath();
                  ctx.arc(px + tileSize * 0.4, py + tileSize * 0.45, tileSize * growthScale, 0, Math.PI * 2);
                  ctx.arc(px + tileSize * 0.6, py + tileSize * 0.5, tileSize * (growthScale * 1.1), 0, Math.PI * 2);
                  ctx.fill();
                  ctx.strokeStyle = isRipe ? 'rgba(250, 204, 21, 0.9)' : 'rgba(255, 255, 255, 0.6)';
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.38, Math.PI * 1.1, Math.PI * 1.8);
                  ctx.stroke();
                  const isNearThisBioFallback = Math.hypot(playerPos.x - (x + 0.5), playerPos.y - (y + 0.5)) <= 1.8;
                  if (isRipe || isNearThisBioFallback) {
                    ctx.fillStyle = isRipe ? '#fef08a' : '#93c5fd';
                    ctx.font = 'bold 8.5px "Cairo", "Orbitron", sans-serif';
                    ctx.textAlign = 'center';
                    const bioText = isRtl
                      ? (isRipe ? `🌾 [E] حصاد (+${harvestAmount}) | [R] شحن` : '🌱 [E] شحن | [R] فحص')
                      : (isRipe ? `🌾 [E] Harvest (+${harvestAmount}) | [R] Feed` : '🌱 [E] Feed | [R] Inspect');
                    ctx.fillText(bioText, px + tileSize / 2, py + tileSize * 0.85);
                  }
                  ctx.restore();
                }
                break;
              }

              case TILE_TYPES.ICE_PURIFIER: {
                const purifierSprite = getSprite('structure_purifier');
                const isNearThisPurifier = Math.hypot(playerPos.x - (x + 0.5), playerPos.y - (y + 0.5)) <= 1.8;
                const purStored = tile.storedAmount || 0;
                if (purifierSprite && purifierSprite.complete && purifierSprite.naturalWidth > 0) {
                  ctx.save();
                  ctx.shadowColor = 'rgba(56, 189, 248, 0.7)';
                  ctx.shadowBlur = 10;
                  ctx.drawImage(purifierSprite, px + tileSize * 0.1, py + tileSize * 0.05, tileSize * 0.8, tileSize * 0.9);
                  if (purStored > 0 || isNearThisPurifier) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 8.5px "Cairo", "JetBrains Mono", sans-serif';
                    ctx.textAlign = 'center';
                    const purText = isRtl
                      ? (purStored > 0 ? `💧 [E] ماء (${purStored}) | [R] شحن` : '🧊 [E] شحن جليد | [R] فحص')
                      : (purStored > 0 ? `💧 [E] Water (${purStored}) | [R] Load` : '🧊 [E] Load Ice | [R] Inspect');
                    ctx.fillText(purText, px + tileSize / 2, py + tileSize * 0.54);
                  }
                  ctx.restore();
                } else {
                  ctx.save();
                  ctx.shadowColor = 'rgba(56, 189, 248, 0.7)';
                  ctx.shadowBlur = 10;
                  ctx.fillStyle = '#0369a1';
                  ctx.fillRect(px + tileSize * 0.15, py + tileSize * 0.2, tileSize * 0.7, tileSize * 0.6);
                  ctx.fillStyle = '#38bdf8';
                  ctx.beginPath();
                  ctx.arc(px + tileSize / 2, py + tileSize * 0.5, tileSize * 0.22, 0, Math.PI * 2);
                  ctx.fill();
                  if (purStored > 0 || isNearThisPurifier) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 8.5px "Cairo", "JetBrains Mono", sans-serif';
                    ctx.textAlign = 'center';
                    const purText = isRtl
                      ? (purStored > 0 ? `💧 [E] ماء (${purStored}) | [R] شحن` : '🧊 [E] شحن جليد | [R] فحص')
                      : (purStored > 0 ? `💧 [E] Water (${purStored}) | [R] Load` : '🧊 [E] Load Ice | [R] Inspect');
                    ctx.fillText(purText, px + tileSize / 2, py + tileSize * 0.54);
                  }
                  ctx.restore();
                }
                break;
              }

              case TILE_TYPES.COMMS_ARRAY: {
                const commsSprite = getSprite('structure_comms');
                if (commsSprite && commsSprite.complete && commsSprite.naturalWidth > 0) {
                  ctx.save();
                  ctx.shadowColor = 'rgba(192, 132, 252, 0.85)';
                  ctx.shadowBlur = 14;
                  ctx.drawImage(commsSprite, px + tileSize * 0.15, py + tileSize * 0.04, tileSize * 0.7, tileSize * 0.92);
                  ctx.restore();
                } else {
                  ctx.save();
                  ctx.shadowColor = 'rgba(192, 132, 252, 0.8)';
                  ctx.shadowBlur = 12;
                  ctx.fillStyle = '#581c87';
                  ctx.fillRect(px + tileSize * 0.35, py + tileSize * 0.6, tileSize * 0.3, tileSize * 0.25);
                  ctx.strokeStyle = '#c084fc';
                  ctx.lineWidth = 3;
                  ctx.beginPath();
                  ctx.arc(px + tileSize / 2, py + tileSize * 0.4, tileSize * 0.3, Math.PI * 0.8, Math.PI * 2.2);
                  ctx.stroke();
                  ctx.fillStyle = '#f3e8ff';
                  ctx.beginPath();
                  ctx.arc(px + tileSize / 2, py + tileSize * 0.38, 3, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.restore();
                }
                break;
              }

              case TILE_TYPES.THERMAL_HEATER: {
                const heaterTile = { ...tile, x, y };
                const isOp = isBuildingOperational(heaterTile, { isDay, playerPos, grid });
                const isPaused = tile.disabled === true || tile.powerMode === 'OFF';
                const isStandby = !isPaused && !isOp && isColonyPowered;
                const heaterSprite = getSprite('structure_heater');

                const shadowGlow = (isOp && isColonyPowered)
                  ? 'rgba(251, 146, 60, 0.85)'
                  : isStandby
                  ? 'rgba(56, 189, 248, 0.7)'
                  : 'rgba(100, 116, 139, 0.4)';

                if (heaterSprite && heaterSprite.complete && heaterSprite.naturalWidth > 0) {
                  ctx.save();
                  ctx.shadowColor = shadowGlow;
                  ctx.shadowBlur = (isOp && isColonyPowered || isStandby) ? 14 : 4;
                  if (isPaused) ctx.globalAlpha = 0.65;
                  ctx.drawImage(heaterSprite, px + tileSize * 0.1, py + tileSize * 0.05, tileSize * 0.8, tileSize * 0.9);
                  ctx.restore();
                } else {
                  ctx.save();
                  ctx.shadowColor = shadowGlow;
                  ctx.shadowBlur = (isOp && isColonyPowered || isStandby) ? 14 : 4;
                  ctx.fillStyle = (isOp && isColonyPowered) ? '#7c2d12' : isStandby ? '#0c4a6e' : '#334155';
                  ctx.beginPath();
                  ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.36, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.strokeStyle = (isOp && isColonyPowered) ? '#fb923c' : isStandby ? '#38bdf8' : '#94a3b8';
                  ctx.lineWidth = 2.5;
                  ctx.beginPath();
                  ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.22, 0, Math.PI * 1.8);
                  ctx.stroke();
                  ctx.restore();
                }

                // Small status indicator on the heater unit
                if (isPaused) {
                  ctx.save();
                  ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
                  ctx.font = 'bold 9px monospace';
                  ctx.textAlign = 'center';
                  ctx.fillText('⏸', px + tileSize * 0.8, py + tileSize * 0.25);
                  ctx.restore();
                } else if (isStandby) {
                  ctx.save();
                  ctx.fillStyle = 'rgba(56, 189, 248, 0.95)';
                  ctx.font = 'bold 9px monospace';
                  ctx.textAlign = 'center';
                  ctx.fillText('🌙', px + tileSize * 0.8, py + tileSize * 0.25);
                  ctx.restore();
                }
                break;
              }

              case TILE_TYPES.BATTERY_BANK: {
                const batterySprite = getSprite('structure_battery');
                if (batterySprite && batterySprite.complete && batterySprite.naturalWidth > 0) {
                  ctx.save();
                  ctx.shadowColor = 'rgba(163, 230, 53, 0.7)';
                  ctx.shadowBlur = 12;
                  ctx.drawImage(batterySprite, px + tileSize * 0.08, py + tileSize * 0.08, tileSize * 0.84, tileSize * 0.84);
                  ctx.restore();
                } else {
                  ctx.save();
                  ctx.fillStyle = '#3f6212';
                  ctx.fillRect(px + tileSize * 0.15, py + tileSize * 0.15, tileSize * 0.7, tileSize * 0.7);
                  ctx.fillStyle = '#a3e635';
                  ctx.fillRect(px + tileSize * 0.22, py + tileSize * 0.25, tileSize * 0.24, tileSize * 0.5);
                  ctx.fillRect(px + tileSize * 0.54, py + tileSize * 0.25, tileSize * 0.24, tileSize * 0.5);
                  ctx.restore();
                }
                break;
              }

              case TILE_TYPES.WALL: {
                const isWallOrGate = (gx, gy) => {
                  if (!isWithinBounds(gx, gy, grid)) return false;
                  const nType = grid[gy]?.[gx]?.type;
                  return nType === TILE_TYPES.WALL || nType === TILE_TYPES.GATE;
                };

                const hasL = isWallOrGate(x - 1, y);
                const hasR = isWallOrGate(x + 1, y);
                const hasU = isWallOrGate(x, y - 1);
                const hasD = isWallOrGate(x, y + 1);

                const cx = px + tileSize * 0.5;
                const cy = py + tileSize * 0.5;
                const wThick = tileSize * 0.54;
                const hThick = wThick * 0.5;

                const wallLeft = hasL ? px : cx - hThick;
                const wallRight = hasR ? px + tileSize : cx + hThick;
                const wallTop = hasU ? py : cy - hThick;
                const wallBottom = hasD ? py + tileSize : cy + hThick;

                ctx.save();

                // 1. Soft Ambient Ground Shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
                ctx.beginPath();
                if (hasL || hasR || (!hasU && !hasD)) {
                  ctx.roundRect(wallLeft, cy - hThick + 5, wallRight - wallLeft, wThick + 3, 4);
                }
                if (hasU || hasD) {
                  ctx.roundRect(cx - hThick, wallTop + 5, wThick, wallBottom - wallTop + 3, 4);
                }
                ctx.fill();

                // 2. Base Composite Armor Plating (Seamless continuous fortress hull)
                const wallGrad = ctx.createLinearGradient(0, wallTop, 0, wallBottom);
                wallGrad.addColorStop(0.0, '#475569');
                wallGrad.addColorStop(0.25, '#334155');
                wallGrad.addColorStop(0.85, '#1e293b');
                wallGrad.addColorStop(1.0, '#0f172a');
                ctx.fillStyle = wallGrad;
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 1.6;

                ctx.beginPath();
                if (hasL || hasR || (!hasU && !hasD)) {
                  ctx.rect(wallLeft, cy - hThick, wallRight - wallLeft, wThick);
                }
                if (hasU || hasD) {
                  ctx.rect(cx - hThick, wallTop, wThick, wallBottom - wallTop);
                }
                ctx.fill();
                ctx.stroke();

                // 3. Top High-Tech Parapet Bevel Rim (Illuminated 3D upper edge)
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                if (hasL || hasR || (!hasU && !hasD)) {
                  ctx.moveTo(wallLeft, cy - hThick + 1);
                  ctx.lineTo(wallRight, cy - hThick + 1);
                }
                if (hasU || hasD) {
                  ctx.moveTo(cx - hThick + 1, wallTop);
                  ctx.lineTo(cx - hThick + 1, wallBottom);
                }
                ctx.stroke();

                // 4. Industrial Armor Cross-Ribs & Rivets
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 1.8;
                if (hasL || hasR) {
                  const seam1 = px + tileSize * 0.25;
                  const seam2 = px + tileSize * 0.75;
                  ctx.beginPath();
                  ctx.moveTo(seam1, cy - hThick + 2);
                  ctx.lineTo(seam1, cy + hThick - 2);
                  ctx.moveTo(seam2, cy - hThick + 2);
                  ctx.lineTo(seam2, cy + hThick - 2);
                  ctx.stroke();

                  ctx.fillStyle = '#94a3b8';
                  ctx.beginPath();
                  ctx.arc(seam1, cy - hThick + 4, 1.4, 0, Math.PI * 2);
                  ctx.arc(seam1, cy + hThick - 4, 1.4, 0, Math.PI * 2);
                  ctx.arc(seam2, cy - hThick + 4, 1.4, 0, Math.PI * 2);
                  ctx.arc(seam2, cy + hThick - 4, 1.4, 0, Math.PI * 2);
                  ctx.fill();
                }
                if (hasU || hasD) {
                  const seamY1 = py + tileSize * 0.25;
                  const seamY2 = py + tileSize * 0.75;
                  ctx.beginPath();
                  ctx.moveTo(cx - hThick + 2, seamY1);
                  ctx.lineTo(cx + hThick - 2, seamY1);
                  ctx.moveTo(cx - hThick + 2, seamY2);
                  ctx.lineTo(cx + hThick - 2, seamY2);
                  ctx.stroke();

                  ctx.fillStyle = '#94a3b8';
                  ctx.beginPath();
                  ctx.arc(cx - hThick + 4, seamY1, 1.4, 0, Math.PI * 2);
                  ctx.arc(cx + hThick - 4, seamY1, 1.4, 0, Math.PI * 2);
                  ctx.arc(cx - hThick + 4, seamY2, 1.4, 0, Math.PI * 2);
                  ctx.arc(cx + hThick - 4, seamY2, 1.4, 0, Math.PI * 2);
                  ctx.fill();
                }

                // 5. Central High-Tech Sensor / Conduit Line
                const levelColor = (tile.level || 1) >= 3 ? '#38bdf8' : ((tile.level || 1) === 2 ? '#f97316' : '#64748b');
                ctx.strokeStyle = levelColor;
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                if (hasL || hasR) {
                  ctx.moveTo(wallLeft, cy);
                  ctx.lineTo(wallRight, cy);
                }
                if (hasU || hasD) {
                  ctx.moveTo(cx, wallTop);
                  ctx.lineTo(cx, wallBottom);
                }
                ctx.stroke();

                // 6. Corner Bastion Turret Pillar (at bends, T-crossings, dead-ends, or standalone)
                const isJunction = (hasL && hasU) || (hasL && hasD) || (hasR && hasU) || (hasR && hasD) ||
                                   (!hasL && !hasR && !hasU && !hasD) ||
                                   (hasL + hasR + hasU + hasD >= 3) ||
                                   (hasL + hasR + hasU + hasD === 1);
                if (isJunction) {
                  const bRadius = tileSize * 0.20;
                  ctx.fillStyle = '#1e293b';
                  ctx.strokeStyle = '#0f172a';
                  ctx.lineWidth = 1.8;
                  ctx.beginPath();
                  ctx.arc(cx, cy, bRadius, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.stroke();

                  ctx.fillStyle = '#334155';
                  ctx.beginPath();
                  ctx.arc(cx, cy, bRadius * 0.65, 0, Math.PI * 2);
                  ctx.fill();

                  // Telemetry beacon LED in the center
                  ctx.fillStyle = levelColor;
                  ctx.shadowColor = levelColor;
                  ctx.shadowBlur = 6;
                  ctx.beginPath();
                  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.shadowBlur = 0;
                }

                ctx.restore();
                break;
              }

              case TILE_TYPES.GATE: {
                const isWallOrGate = (gx, gy) => {
                  if (!isWithinBounds(gx, gy, grid)) return false;
                  const nType = grid[gy]?.[gx]?.type;
                  return nType === TILE_TYPES.WALL || nType === TILE_TYPES.GATE;
                };

                const hasL = isWallOrGate(x - 1, y);
                const hasR = isWallOrGate(x + 1, y);
                const hasU = isWallOrGate(x, y - 1);
                const hasD = isWallOrGate(x, y + 1);

                const cx = px + tileSize * 0.5;
                const cy = py + tileSize * 0.5;
                const wThick = tileSize * 0.54;
                const hThick = wThick * 0.5;

                // Determine gate orientation (vertical if sandwiched between top/bottom walls, otherwise horizontal)
                const isVertical = (hasU || hasD) && !hasL && !hasR;

                // Distance to player determines whether biometric airlock doors slide open
                const distToPlayer = Math.hypot(playerPosRef.current.x - (x + 0.5), playerPosRef.current.y - (y + 0.5));
                const isPlayerNear = distToPlayer <= 1.45;
                const gatePulse = Math.sin(time * 0.007 + x * 3 + y * 3) * 0.2 + 0.8;

                ctx.save();

                if (!isVertical) {
                  // ============================================
                  // HORIZONTAL FORTRESS AIRLOCK GATEWAY
                  // ============================================
                  const postWidth = tileSize * 0.26;
                  const portalLeft = px + postWidth;
                  const portalRight = px + tileSize - postWidth;
                  const portalWidth = portalRight - portalLeft;
                  const wallTop = cy - hThick;
                  const wallBottom = cy + hThick;

                  // 1. Walkway Entrance Deck & Floor Tread
                  ctx.fillStyle = '#0f172a';
                  ctx.fillRect(portalLeft, wallTop - 2, portalWidth, wThick + 4);

                  // Floor non-slip steel grating with directional chevron arrows (pointing along Y through doorway)
                  ctx.strokeStyle = isPlayerNear ? 'rgba(16, 185, 129, 0.85)' : 'rgba(56, 189, 248, 0.4)';
                  ctx.lineWidth = 2.0;
                  ctx.lineCap = 'round';
                  ctx.lineJoin = 'round';
                  const pointDown = playerPosRef.current.y <= cy;
                  for (let offY = wallTop + 9; offY <= wallBottom - 7; offY += 11) {
                    ctx.beginPath();
                    if (pointDown) {
                      ctx.moveTo(cx - 7, offY - 4);
                      ctx.lineTo(cx, offY + 4);
                      ctx.lineTo(cx + 7, offY - 4);
                    } else {
                      ctx.moveTo(cx - 7, offY + 4);
                      ctx.lineTo(cx, offY - 4);
                      ctx.lineTo(cx + 7, offY + 4);
                    }
                    ctx.stroke();
                  }

                  // 2. Left Fortified Gatepost (Seamlessly joins wall on the left)
                  const postLeftBound = hasL ? px : px + 2;
                  const postLeftGrad = ctx.createLinearGradient(0, wallTop, 0, wallBottom);
                  postLeftGrad.addColorStop(0, '#475569');
                  postLeftGrad.addColorStop(0.3, '#334155');
                  postLeftGrad.addColorStop(1, '#0f172a');
                  ctx.fillStyle = postLeftGrad;
                  ctx.strokeStyle = '#0f172a';
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  ctx.rect(postLeftBound, wallTop, portalLeft - postLeftBound, wThick);
                  ctx.fill();
                  ctx.stroke();

                  // Left Post Hydraulic Piston Chamber
                  ctx.fillStyle = '#1e293b';
                  ctx.fillRect(portalLeft - 4, wallTop + 3, 4, wThick - 6);

                  // 3. Right Fortified Gatepost (Seamlessly joins wall on the right)
                  const postRightBound = hasR ? px + tileSize : px + tileSize - 2;
                  const postRightGrad = ctx.createLinearGradient(0, wallTop, 0, wallBottom);
                  postRightGrad.addColorStop(0, '#475569');
                  postRightGrad.addColorStop(0.3, '#334155');
                  postRightGrad.addColorStop(1, '#0f172a');
                  ctx.fillStyle = postRightGrad;
                  ctx.strokeStyle = '#0f172a';
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  ctx.rect(portalRight, wallTop, postRightBound - portalRight, wThick);
                  ctx.fill();
                  ctx.stroke();

                  // Right Post Hydraulic Piston Chamber
                  ctx.fillStyle = '#1e293b';
                  ctx.fillRect(portalRight, wallTop + 3, 4, wThick - 6);

                  // 4. Heavy Overhead Archway / Transom Lintel
                  const archTop = wallTop - 6;
                  const archHeight = 9;
                  const archGrad = ctx.createLinearGradient(0, archTop, 0, archTop + archHeight);
                  archGrad.addColorStop(0, '#334155');
                  archGrad.addColorStop(1, '#1e293b');
                  ctx.fillStyle = archGrad;
                  ctx.strokeStyle = '#0f172a';
                  ctx.lineWidth = 1.4;
                  ctx.beginPath();
                  ctx.rect(portalLeft - 4, archTop, portalWidth + 8, archHeight);
                  ctx.fill();
                  ctx.stroke();

                  // Industrial Hazard Warning Stripes across archway
                  ctx.strokeStyle = '#facc15';
                  ctx.lineWidth = 2.0;
                  ctx.beginPath();
                  for (let hx = portalLeft - 2; hx < portalRight + 6; hx += 8) {
                    ctx.moveTo(hx, archTop + 1);
                    ctx.lineTo(hx + 4, archTop + archHeight - 1);
                  }
                  ctx.stroke();

                  // 5. Sliding Blast Doors / Biometric Barrier
                  if (!isPlayerNear) {
                    // CLOSED: Interlocking Blast Doors locked in center
                    const doorHalfW = portalWidth * 0.5;
                    ctx.fillStyle = '#334155';
                    ctx.strokeStyle = '#0f172a';
                    ctx.lineWidth = 1.4;
                    ctx.fillRect(portalLeft, wallTop + 2, doorHalfW, wThick - 4);
                    ctx.strokeRect(portalLeft, wallTop + 2, doorHalfW, wThick - 4);

                    ctx.fillRect(portalLeft + doorHalfW, wallTop + 2, doorHalfW, wThick - 4);
                    ctx.strokeRect(portalLeft + doorHalfW, wallTop + 2, doorHalfW, wThick - 4);

                    // Central hydraulic locking seam & clamp
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(cx - 3, wallTop + 4, 6, wThick - 8);

                    // Pulsing Security Laser Barrier
                    ctx.shadowColor = '#38bdf8';
                    ctx.shadowBlur = 10;
                    ctx.strokeStyle = `rgba(56, 189, 248, ${gatePulse * 0.9})`;
                    ctx.lineWidth = 2.2;
                    ctx.beginPath();
                    ctx.moveTo(cx, wallTop + 1);
                    ctx.lineTo(cx, wallBottom - 1);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                  } else {
                    // OPEN: Doors retracted into posts! Green clearance holographic beam
                    ctx.shadowColor = '#10b981';
                    ctx.shadowBlur = 12;
                    ctx.strokeStyle = `rgba(16, 185, 129, ${gatePulse * 0.95})`;
                    ctx.lineWidth = 2.0;

                    ctx.beginPath();
                    ctx.moveTo(portalLeft + 2, wallTop);
                    ctx.lineTo(portalLeft + 2, wallBottom);
                    ctx.moveTo(portalRight - 2, wallTop);
                    ctx.lineTo(portalRight - 2, wallBottom);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                  }

                  // 6. Central Biometric Status Sensor LED on Archway
                  const statusColor = isPlayerNear ? '#10b981' : '#38bdf8';
                  ctx.fillStyle = statusColor;
                  ctx.shadowColor = statusColor;
                  ctx.shadowBlur = 8;
                  ctx.beginPath();
                  ctx.arc(cx, archTop + archHeight * 0.5, 3.2, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.shadowBlur = 0;

                } else {
                  // ============================================
                  // VERTICAL FORTRESS AIRLOCK GATEWAY
                  // ============================================
                  const postHeight = tileSize * 0.26;
                  const portalTop = py + postHeight;
                  const portalBottom = py + tileSize - postHeight;
                  const portalHeight = portalBottom - portalTop;
                  const wallLeft = cx - hThick;
                  const wallRight = cx + hThick;

                  // 1. Walkway Deck
                  ctx.fillStyle = '#0f172a';
                  ctx.fillRect(wallLeft - 2, portalTop, wThick + 4, portalHeight);

                  // Floor chevrons pointing horizontally through doorway along X
                  ctx.strokeStyle = isPlayerNear ? 'rgba(16, 185, 129, 0.85)' : 'rgba(56, 189, 248, 0.4)';
                  ctx.lineWidth = 2.0;
                  ctx.lineCap = 'round';
                  ctx.lineJoin = 'round';
                  const pointRight = playerPosRef.current.x <= cx;
                  for (let offX = wallLeft + 9; offX <= wallRight - 7; offX += 11) {
                    ctx.beginPath();
                    if (pointRight) {
                      ctx.moveTo(offX - 4, cy - 7);
                      ctx.lineTo(offX + 4, cy);
                      ctx.lineTo(offX - 4, cy + 7);
                    } else {
                      ctx.moveTo(offX + 4, cy - 7);
                      ctx.lineTo(offX - 4, cy);
                      ctx.lineTo(offX + 4, cy + 7);
                    }
                    ctx.stroke();
                  }

                  // 2. Top Gatepost (Joins wall above)
                  const postTopBound = hasU ? py : py + 2;
                  const postTopGrad = ctx.createLinearGradient(wallLeft, 0, wallRight, 0);
                  postTopGrad.addColorStop(0, '#475569');
                  postTopGrad.addColorStop(0.3, '#334155');
                  postTopGrad.addColorStop(1, '#0f172a');
                  ctx.fillStyle = postTopGrad;
                  ctx.strokeStyle = '#0f172a';
                  ctx.lineWidth = 1.5;
                  ctx.fillRect(wallLeft, postTopBound, wThick, portalTop - postTopBound);
                  ctx.strokeRect(wallLeft, postTopBound, wThick, portalTop - postTopBound);

                  // Top Post Hydraulic Piston Chamber
                  ctx.fillStyle = '#1e293b';
                  ctx.fillRect(wallLeft + 3, portalTop - 4, wThick - 6, 4);

                  // 3. Bottom Gatepost (Joins wall below)
                  const postBottomBound = hasD ? py + tileSize : py + tileSize - 2;
                  const postBottomGrad = ctx.createLinearGradient(wallLeft, 0, wallRight, 0);
                  postBottomGrad.addColorStop(0, '#475569');
                  postBottomGrad.addColorStop(0.3, '#334155');
                  postBottomGrad.addColorStop(1, '#0f172a');
                  ctx.fillStyle = postBottomGrad;
                  ctx.strokeStyle = '#0f172a';
                  ctx.lineWidth = 1.5;
                  ctx.fillRect(wallLeft, portalBottom, wThick, postBottomBound - portalBottom);
                  ctx.strokeRect(wallLeft, portalBottom, wThick, postBottomBound - portalBottom);

                  // Bottom Post Hydraulic Piston Chamber
                  ctx.fillStyle = '#1e293b';
                  ctx.fillRect(wallLeft + 3, portalBottom, wThick - 6, 4);

                  // 4. Sliding Doors
                  if (!isPlayerNear) {
                    const doorHalfH = portalHeight * 0.5;
                    ctx.fillStyle = '#334155';
                    ctx.strokeStyle = '#0f172a';
                    ctx.lineWidth = 1.4;
                    ctx.fillRect(wallLeft + 2, portalTop, wThick - 4, doorHalfH);
                    ctx.strokeRect(wallLeft + 2, portalTop, wThick - 4, doorHalfH);

                    ctx.fillRect(wallLeft + 2, portalTop + doorHalfH, wThick - 4, doorHalfH);
                    ctx.strokeRect(wallLeft + 2, portalTop + doorHalfH, wThick - 4, doorHalfH);

                    // Central seam
                    ctx.shadowColor = '#38bdf8';
                    ctx.shadowBlur = 10;
                    ctx.strokeStyle = `rgba(56, 189, 248, ${gatePulse * 0.9})`;
                    ctx.lineWidth = 2.2;
                    ctx.beginPath();
                    ctx.moveTo(wallLeft + 1, cy);
                    ctx.lineTo(wallRight - 1, cy);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                  } else {
                    // Open green guidelines
                    ctx.shadowColor = '#10b981';
                    ctx.shadowBlur = 12;
                    ctx.strokeStyle = `rgba(16, 185, 129, ${gatePulse * 0.95})`;
                    ctx.lineWidth = 2.0;
                    ctx.beginPath();
                    ctx.moveTo(wallLeft, portalTop + 2);
                    ctx.lineTo(wallRight, portalTop + 2);
                    ctx.moveTo(wallLeft, portalBottom - 2);
                    ctx.lineTo(wallRight, portalBottom - 2);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                  }

                  // Status LED
                  const statusColor = isPlayerNear ? '#10b981' : '#38bdf8';
                  ctx.fillStyle = statusColor;
                  ctx.shadowColor = statusColor;
                  ctx.shadowBlur = 8;
                  ctx.beginPath();
                  ctx.arc(wallLeft - 4, cy, 3.2, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.shadowBlur = 0;
                }

                ctx.restore();
                break;
              }

              case TILE_TYPES.CAVE_MAYA:
              case TILE_TYPES.CAVE_OMAR:
              case TILE_TYPES.CAVE_LINA:
              case TILE_TYPES.CAVE_TURBINE:
              case TILE_TYPES.CAVE_ARSENAL:
              case TILE_TYPES.CAVE_ADAM: {
                const caveType = tile.type;
                const isMaya = caveType === TILE_TYPES.CAVE_MAYA;
                const isOmar = caveType === TILE_TYPES.CAVE_OMAR;
                const isLina = caveType === TILE_TYPES.CAVE_LINA;
                const isTurbine = caveType === TILE_TYPES.CAVE_TURBINE;
                const isArsenal = caveType === TILE_TYPES.CAVE_ARSENAL;
                const isAdam = caveType === TILE_TYPES.CAVE_ADAM;

                const themeColor = isMaya ? '#c084fc' : (isOmar ? '#fbbf24' : (isLina ? '#38bdf8' : (isTurbine ? '#f97316' : (isArsenal ? '#ef4444' : '#10b981'))));
                const pulse = Math.sin(time * 0.004 + x * 2 + y * 2) * 0.2 + 0.8;

                ctx.save();
                // 1. Subterranean Cavern Radial Ambient Aura
                const caveAura = ctx.createRadialGradient(px + tileSize / 2, py + tileSize / 2, 8, px + tileSize / 2, py + tileSize / 2, tileSize * 0.85);
                caveAura.addColorStop(0, `${themeColor}55`);
                caveAura.addColorStop(0.65, `${themeColor}18`);
                caveAura.addColorStop(1, `${themeColor}00`);
                ctx.fillStyle = caveAura;
                ctx.beginPath();
                ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.85, 0, Math.PI * 2);
                ctx.fill();

                // 2. Basalt Chasm Opening Foundation
                ctx.fillStyle = '#060303';
                ctx.beginPath();
                ctx.ellipse(px + tileSize / 2, py + tileSize / 2, tileSize * 0.44, tileSize * 0.38, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = `${themeColor}90`;
                ctx.lineWidth = 1.8;
                ctx.stroke();

                // 3. Animated Portal Vortex (CraftPix 2 Location)
                const portalSprite = isTurbine ? getSprite('portal_fire_idle') : getSprite('portal_cosmic_idle');
                if (portalSprite && portalSprite.complete && portalSprite.naturalWidth > 0) {
                  const frameIndex = Math.floor((time * 0.006 + x * 0.5) % 4);
                  const fw = 96;
                  const fh = 96;
                  const portalSize = tileSize * 1.15;
                  const pX = px + (tileSize - portalSize) / 2;
                  const pY = py + (tileSize - portalSize) / 2;

                  ctx.save();
                  ctx.shadowColor = themeColor;
                  ctx.shadowBlur = 14 * pulse;
                  ctx.drawImage(portalSprite, frameIndex * fw, 0, fw, fh, pX, pY, portalSize, portalSize);
                  ctx.restore();
                }

                // 4. Natural Basalt Crag Rim Accents
                const rockRim1 = getSprite('rock_prop_10');
                const rockRim2 = getSprite('rock_prop_16');
                if (rockRim1 && rockRim1.complete) {
                  ctx.drawImage(rockRim1, px - 2, py + tileSize * 0.6, tileSize * 0.35, tileSize * 0.28);
                }
                if (rockRim2 && rockRim2.complete) {
                  ctx.drawImage(rockRim2, px + tileSize * 0.72, py + 2, tileSize * 0.3, tileSize * 0.28);
                }

                // 5. Rising Biome Ember / Spore / Energy Motes
                const moteY = py + tileSize * 0.5 - ((time * 0.015 + x * 20 + y * 15) % (tileSize * 0.45));
                const moteAlpha = Math.sin(((time * 0.015 + x * 20 + y * 15) % (tileSize * 0.45)) / (tileSize * 0.45) * Math.PI);
                if (moteAlpha > 0.05) {
                  ctx.fillStyle = themeColor;
                  ctx.shadowColor = themeColor;
                  ctx.shadowBlur = 6;
                  ctx.beginPath();
                  ctx.arc(px + tileSize * 0.5 + Math.sin(time * 0.004 + y) * 8, moteY, 1.8, 0, Math.PI * 2);
                  ctx.fill();
                }

                // 6. Proximity Badge for Astronaut EVA Exploration
                const distToCave = Math.hypot(playerPos.x - (x + 0.5), playerPos.y - (y + 0.5));
                if (distToCave <= 2.2) {
                  const badgeW = 168;
                  const badgeH = 25;
                  const badgeX = px + tileSize / 2 - badgeW / 2;
                  const badgeY = py - 22;

                  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
                  ctx.strokeStyle = themeColor;
                  ctx.lineWidth = 1.6;
                  ctx.beginPath();
                  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
                  ctx.fill();
                  ctx.stroke();

                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 10px "Cairo", "JetBrains Mono", sans-serif';
                  ctx.textAlign = 'center';
                  const caveLabel = isMaya ? (isRtl ? '🌿 كهف مايا [E]' : '🌿 Maya Grotto [E]') :
                                    isOmar ? (isRtl ? '💎 فجوة عمر [E]' : '💎 Omar Chasm [E]') :
                                    isLina ? (isRtl ? '❄️ سرداب لينا [E]' : '❄️ Lina Crypt [E]') :
                                    isTurbine ? (isRtl ? '🔥 وكر التوربين [E]' : '🔥 Turbine Nest [E]') :
                                    isArsenal ? (isRtl ? '⚔️ مستودع الأسلحة [E]' : '⚔️ Arsenal Depot [E]') :
                                    (isRtl ? '🏛️ قلعة آدم [E]' : '🏛️ Adam Citadel [E]');
                  ctx.fillText(caveLabel, px + tileSize / 2, badgeY + 16);
                }
                ctx.restore();
                break;
              }

              case TILE_TYPES.ANCIENT_ALTAR: {
                const altarIdle = getSprite('altar_monolith_idle');
                const pulse = Math.sin(time * 0.004 + x * 2 + y * 2) * 0.2 + 0.8;
                ctx.save();

                // 1. Precursor Ethereal Ground Aura
                const altarAura = ctx.createRadialGradient(px + tileSize / 2, py + tileSize / 2, 4, px + tileSize / 2, py + tileSize / 2, tileSize * 0.7);
                altarAura.addColorStop(0, `rgba(251, 191, 36, ${0.4 * pulse})`);
                altarAura.addColorStop(0.6, `rgba(217, 119, 6, ${0.15 * pulse})`);
                altarAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = altarAura;
                ctx.beginPath();
                ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.7, 0, Math.PI * 2);
                ctx.fill();

                // 2. Precursor Stone Base Foundation
                ctx.fillStyle = '#1e1b18';
                ctx.strokeStyle = '#78350f';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(px + tileSize * 0.15, py + tileSize * 0.15, tileSize * 0.7, tileSize * 0.7, 6);
                ctx.fill();
                ctx.stroke();

                // 3. Animated Monolith Spire (6 frames of 48x48)
                if (altarIdle && altarIdle.complete && altarIdle.naturalWidth > 0) {
                  const frame = Math.floor((time * 0.005) % 6);
                  const aSize = tileSize * 0.82;
                  ctx.drawImage(altarIdle, frame * 48, 0, 48, 48, px + (tileSize - aSize) / 2, py + (tileSize - aSize) / 2, aSize, aSize);
                } else {
                  const staticAltar = getSprite('altar_prop_1');
                  if (staticAltar && staticAltar.complete) {
                    ctx.drawImage(staticAltar, px + tileSize * 0.2, py + tileSize * 0.2, tileSize * 0.6, tileSize * 0.6);
                  }
                }

                // 4. Floating ancient precursor runic glyphs / sparks
                const sparkY = py + tileSize * 0.4 - ((time * 0.012 + x * 15 + y * 19) % (tileSize * 0.35));
                const sparkAlpha = Math.sin(((time * 0.012 + x * 15 + y * 19) % (tileSize * 0.35)) / (tileSize * 0.35) * Math.PI);
                if (sparkAlpha > 0.1) {
                  ctx.fillStyle = `rgba(254, 240, 138, ${sparkAlpha * 0.9})`;
                  ctx.shadowColor = '#facc15';
                  ctx.shadowBlur = 6;
                  ctx.beginPath();
                  ctx.arc(px + tileSize * 0.5 + Math.sin(time * 0.003 + x) * 4, sparkY, 1.6, 0, Math.PI * 2);
                  ctx.fill();
                }

                // 5. Proximity interaction badge
                const distToAltar = Math.hypot(playerPos.x - (x + 0.5), playerPos.y - (y + 0.5));
                if (distToAltar <= 2.2) {
                  const badgeW = 164;
                  const badgeH = 24;
                  const badgeX = px + tileSize / 2 - badgeW / 2;
                  const badgeY = py - 18;

                  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
                  ctx.strokeStyle = '#f59e0b';
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
                  ctx.fill();
                  ctx.stroke();

                  ctx.fillStyle = '#fef08a';
                  ctx.font = 'bold 9.5px "Cairo", "JetBrains Mono", sans-serif';
                  ctx.textAlign = 'center';
                  const altarLabel = tile.scanned
                    ? (isRtl ? '✅ مسلة سلفية (مؤرشفة)' : '✅ Precursor Archive')
                    : (isRtl ? '🏛️ مسلة أثرية قديمة [E]' : '🏛️ Precursor Monolith [E]');
                  ctx.fillText(altarLabel, px + tileSize / 2, badgeY + 16);
                }

                ctx.restore();
                break;
              }

              case TILE_TYPES.CAVE_WALL: {
                const wallSprite = getSprite(tile.wallSprite || 'cave_wall_stone');
                if (wallSprite && wallSprite.complete && wallSprite.naturalWidth > 0) {
                  ctx.drawImage(wallSprite, px, py, tileSize, tileSize);
                } else {
                  ctx.fillStyle = '#0d1322';
                  ctx.fillRect(px, py, tileSize, tileSize);
                }

                // Seamless 2.5D ambient occlusion drop shadow onto adjacent open floor
                const hasFloorBelow = grid[y + 1]?.[x]?.isCaveFloor || grid[y + 1]?.[x]?.type === TILE_TYPES.CAVE_FLOOR;
                if (hasFloorBelow) {
                  const shadowGrad = ctx.createLinearGradient(px, py + tileSize - 4, px, py + tileSize + 16);
                  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
                  shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
                  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                  ctx.fillStyle = shadowGrad;
                  ctx.fillRect(px - 1, py + tileSize - 4, tileSize + 2, 20);
                }

                const hasFloorRight = grid[y]?.[x + 1]?.isCaveFloor || grid[y]?.[x + 1]?.type === TILE_TYPES.CAVE_FLOOR;
                if (hasFloorRight) {
                  const shadowRight = ctx.createLinearGradient(px + tileSize - 4, py, px + tileSize + 12, py);
                  shadowRight.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
                  shadowRight.addColorStop(1, 'rgba(0, 0, 0, 0)');
                  ctx.fillStyle = shadowRight;
                  ctx.fillRect(px + tileSize - 4, py, 16, tileSize);
                }
                break;
              }

              case TILE_TYPES.CAVE_EXIT: {
                const hoistPulse = Math.sin(time * 0.005) * 0.2 + 0.8;
                ctx.save();
                const hoistGlow = ctx.createRadialGradient(px + tileSize / 2, py + tileSize / 2, 4, px + tileSize / 2, py + tileSize / 2, tileSize * 0.75);
                hoistGlow.addColorStop(0, `rgba(245, 158, 11, ${0.45 * hoistPulse})`);
                hoistGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
                // Animated Subterranean Quantum Extraction Portal Rift
                const portalCosmic = getSprite('portal_cosmic_idle');
                if (portalCosmic && portalCosmic.complete && portalCosmic.naturalWidth > 0) {
                  const pFrame = Math.floor((time * 0.005) % 4);
                  ctx.save();
                  ctx.globalAlpha = 0.72;
                  ctx.shadowColor = '#f59e0b';
                  ctx.shadowBlur = 10;
                  ctx.drawImage(portalCosmic, pFrame * 96, 0, 96, 96, px + 2, py + 2, tileSize - 4, tileSize - 4);
                  ctx.restore();
                }

                const hoistSprite = getSprite('cave_exit_hoist');
                if (hoistSprite && hoistSprite.complete && hoistSprite.naturalWidth > 0) {
                  ctx.drawImage(hoistSprite, px + 6, py + 6, tileSize - 12, tileSize - 12);
                } else {
                  ctx.fillStyle = '#b45309';
                  ctx.beginPath();
                  ctx.roundRect(px + 8, py + 8, tileSize - 16, tileSize - 16, 6);
                  ctx.fill();
                }
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(px + tileSize / 2, py + 6);
                ctx.lineTo(px + tileSize / 2, py - 18);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
                break;
              }

              case TILE_TYPES.CAVE_TURBINE_CORE: {
                const tPulse = Math.sin(time * 0.004) * 0.2 + 0.8;
                ctx.save();
                const thermalRadius = tileSize * 2.2;
                const thermGlow = ctx.createRadialGradient(px + tileSize / 2, py + tileSize / 2, 8, px + tileSize / 2, py + tileSize / 2, thermalRadius);
                thermGlow.addColorStop(0, `rgba(249, 115, 22, ${0.55 * tPulse})`);
                thermGlow.addColorStop(0.5, `rgba(234, 88, 12, ${0.25 * tPulse})`);
                thermGlow.addColorStop(1, 'rgba(234, 88, 12, 0)');
                ctx.fillStyle = thermGlow;
                ctx.beginPath();
                ctx.arc(px + tileSize / 2, py + tileSize / 2, thermalRadius, 0, Math.PI * 2);
                ctx.fill();

                const turbSprite = getSprite('tech_turbine_core');
                if (turbSprite && turbSprite.complete && turbSprite.naturalWidth > 0) {
                  ctx.shadowColor = '#ea580c';
                  ctx.shadowBlur = 16 * tPulse;
                  ctx.drawImage(turbSprite, px + 4, py + 4, tileSize - 8, tileSize - 8);
                } else {
                  ctx.fillStyle = '#ea580c';
                  ctx.beginPath();
                  ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.38, 0, Math.PI * 2);
                  ctx.fill();
                }
                ctx.restore();
                break;
              }

              case TILE_TYPES.CAVE_PROP: {
                ctx.save();
                const propData = tile.propData || {};
                const recoveryKey = propData.recoveryKey || '';
                const isCrew = recoveryKey.startsWith('crew_') || propData.isCrewNPC;

                if (isCrew) {
                  const crewKey = recoveryKey || propData.crewId;
                  const crewCfg = CREW_MEMBERS[crewKey];
                  const isRescued = (rescuedCrewRef.current || []).includes(crewKey);

                  if (crewCfg) {
                    const isPlayerNear = Math.hypot(
                      (playerAnimPosRef.current.x - x),
                      (playerAnimPosRef.current.y - y)
                    ) < 2.5;

                    if (!isRescued) {
                      drawAstronautCharacter(ctx, {
                        x: px + tileSize / 2,
                        y: py + tileSize * 0.45,
                        tileSize: tileSize,
                        facing: 'down',
                        accentColor: crewCfg.accentColor,
                        accentSecondary: crewCfg.accentSecondary,
                        backpackColor: crewCfg.backpackColor,
                        visorColors: crewCfg.visorColors,
                        antennaColor: crewCfg.antennaColor,
                        breathingPhase: time * 0.003,
                        inStasis: true,
                        nameBadge: isRtl ? crewCfg.name.ar : crewCfg.name.en,
                        roleBadge: isRtl ? crewCfg.role.ar : crewCfg.role.en,
                        showPrompt: isPlayerNear,
                        promptLabel: isRtl ? `[E] محادثة مع ${crewCfg.name.ar}` : `[E] Talk to ${crewCfg.name.en}`,
                      });
                    } else {
                      // Rescued stasis cradle
                      ctx.fillStyle = '#0f172a';
                      ctx.strokeStyle = '#10b981';
                      ctx.lineWidth = 1.5;
                      ctx.beginPath();
                      ctx.ellipse(px + tileSize / 2, py + tileSize * 0.65, tileSize * 0.35, tileSize * 0.18, 0, 0, Math.PI * 2);
                      ctx.fill();
                      ctx.stroke();

                      ctx.fillStyle = '#10b981';
                      ctx.font = 'bold 9px "Cairo", sans-serif';
                      ctx.textAlign = 'center';
                      ctx.fillText(isRtl ? '✓ تم الإخلاء للقاعدة' : '✓ Evacuated to Base', px + tileSize / 2, py + tileSize * 0.4);
                    }
                  }
                } else {
                  const pSprite = getSprite(propData.sprite);
                  if (pSprite && pSprite.complete && pSprite.naturalWidth > 0) {
                    ctx.drawImage(pSprite, px + 4, py + 4, tileSize - 8, tileSize - 8);
                  } else {
                    ctx.fillStyle = '#a855f7';
                    ctx.beginPath();
                    ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.35, 0, Math.PI * 2);
                    ctx.fill();
                  }
                }
                ctx.restore();
                break;
              }

              default:
                break;
            }

            // Render Structure Upgrade Level Badge (Lv.2 or Lv.3)
            if (tile.level && tile.level > 1 && tile.type !== TILE_TYPES.HAB && tile.type !== TILE_TYPES.VEHICLE) {
              ctx.save();
              ctx.fillStyle = 'rgba(12, 10, 9, 0.88)';
              ctx.strokeStyle = '#f97316';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(px + 3, py + 3, 25, 12, 3);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#fdba74';
              ctx.font = 'bold 8px "JetBrains Mono", monospace';
              ctx.textAlign = 'center';
              ctx.fillText(`Lv.${tile.level}`, px + 15.5, py + 12);
              ctx.restore();
            }

            // Render Clash-of-Clans style Floating Resource Bubble if storedAmount > 0 or ripe biodome (Biodomes and Ice Melters only)
            const isCollectibleType = tile.type === TILE_TYPES.BIODOME || tile.type === TILE_TYPES.ICE_PURIFIER;
            const isRipeBioTile = tile.type === TILE_TYPES.BIODOME && (cropGrowth >= 100 || (tile.storedAmount && tile.storedAmount > 0));
            const bubbleAmount = (tile.storedAmount && tile.storedAmount > 0) ? tile.storedAmount : (isRipeBioTile ? 3 : 0);
            if (isCollectibleType && bubbleAmount > 0) {
              ctx.save();
              const bobOffset = Math.sin(time * 0.005 + x * 1.5 + y * 2.3) * 5;
              const bubbleCx = px + tileSize / 2;
              const bubbleCy = py - 8 + bobOffset;

              let bubbleBorder = '#fbbf24';
              let bubbleIcon = '🌾';
              if (tile.type === TILE_TYPES.ICE_PURIFIER) {
                bubbleBorder = '#38bdf8';
                bubbleIcon = '💧';
              }

              // Glow shadow
              ctx.shadowColor = bubbleBorder;
              ctx.shadowBlur = 10;

              // Background pill
              const pillW = 34;
              const pillH = 19;
              ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
              ctx.strokeStyle = bubbleBorder;
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.roundRect(bubbleCx - pillW / 2, bubbleCy - pillH / 2, pillW, pillH, 9);
              ctx.fill();
              ctx.stroke();

              // Icon
              ctx.font = '10px sans-serif';
              ctx.textAlign = 'left';
              ctx.fillText(bubbleIcon, bubbleCx - pillW / 2 + 3.5, bubbleCy + 4);

              // Stored Count
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 9px "Orbitron", monospace';
              ctx.textAlign = 'right';
              ctx.fillText(`${bubbleAmount}`, bubbleCx + pillW / 2 - 3.5, bubbleCy + 3.5);

              ctx.restore();
            } else if (
              (tile.type === TILE_TYPES.ICE_PURIFIER || tile.type === TILE_TYPES.BIODOME) &&
              (tile.inputAmount || 0) <= 0 &&
              (materials?.ice || 0) <= 0
            ) {
              // Floating "No Raw Ice" warning indicator
              ctx.save();
              const bobOffset = Math.sin(time * 0.005 + x * 1.5 + y * 2.3) * 4;
              const warnCx = px + tileSize / 2;
              const warnCy = py - 6 + bobOffset;

              ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
              ctx.shadowBlur = 8;
              const warnW = 42;
              const warnH = 18;
              ctx.fillStyle = 'rgba(20, 10, 10, 0.95)';
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.roundRect(warnCx - warnW / 2, warnCy - warnH / 2, warnW, warnH, 8);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#fca5a5';
              ctx.font = 'bold 9px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('🧊 0 kg', warnCx, warnCy + 3);
              ctx.restore();
            }
          }
        }
      }

      // 2.5. Render 4-Block Heavy Exploration Lander & Rover (Spans 2x2 blocks at vehiclePos)
      if (
        vehiclePos &&
        vehiclePos.x + 2 >= startX &&
        vehiclePos.x <= endX &&
        vehiclePos.y + 2 >= startY &&
        vehiclePos.y <= endY
      ) {
        const vPx = vehiclePos.x * tileSize;
        const vPy = vehiclePos.y * tileSize;
        const vW = tileSize * 2;
        const vH = tileSize * 2;
        const centerX = vPx + vW / 2;
        const centerY = vPy + vH / 2;

        ctx.save();

        // 1. Soft Ambient Ground Light Halo (Snug around Lander Pad)
        const groundHaloRadius = tileSize * 1.4;
        const groundHaloGrad = ctx.createRadialGradient(
          centerX, centerY, tileSize * 0.6,
          centerX, centerY, groundHaloRadius
        );
        groundHaloGrad.addColorStop(0, 'rgba(251, 146, 60, 0.22)'); // Warm expedition golden amber
        groundHaloGrad.addColorStop(0.70, 'rgba(251, 146, 60, 0.08)');
        groundHaloGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
        ctx.fillStyle = groundHaloGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, groundHaloRadius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Single Unified Base Safety Perimeter Boundary
        const safeRingPulse = Math.sin(time * 0.003) * 0.12 + 0.38;
        ctx.strokeStyle = `rgba(56, 189, 248, ${safeRingPulse})`;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, tileSize * BASE_SAFE_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. Heavy Docking Berth & Landing Pad (Base)
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(vPx + 4, vPy + 4, vW - 8, vH - 8, 14);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 4 Corner Docking Markers with LED guide lights
        const cornerLen = 14;
        const corners = [
          { x: vPx + 8, y: vPy + 8, dx: 1, dy: 1 },
          { x: vPx + vW - 8, y: vPy + 8, dx: -1, dy: 1 },
          { x: vPx + 8, y: vPy + vH - 8, dx: 1, dy: -1 },
          { x: vPx + vW - 8, y: vPy + vH - 8, dx: -1, dy: -1 },
        ];
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2.5;
        corners.forEach((c) => {
          ctx.beginPath();
          ctx.moveTo(c.x, c.y + c.dy * cornerLen);
          ctx.lineTo(c.x, c.y);
          ctx.lineTo(c.x + c.dx * cornerLen, c.y);
          ctx.stroke();

          // Little glowing cyan corner guide LED
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(c.x + c.dx * 3, c.y + c.dy * 3, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // 4. Contact Shadow directly under the chassis and wheels (Snug & Fitted)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.beginPath();
        ctx.roundRect(centerX - tileSize * 0.72, centerY - tileSize * 0.65, tileSize * 1.44, tileSize * 1.3, 16);
        ctx.fill();

        // 5. Heavy 6x6 All-Terrain Suspension Wheels (3 on Left, 3 on Right)
        const wheelW = 14;
        const wheelH = 26;
        const wheelXs = [centerX - tileSize * 0.76, centerX + tileSize * 0.76 - wheelW];
        const wheelYs = [centerY - 38, centerY - 2, centerY + 34];

        wheelXs.forEach((wx, sideIdx) => {
          wheelYs.forEach((wy) => {
            // Suspension strut
            ctx.fillStyle = '#475569';
            ctx.fillRect(sideIdx === 0 ? wx + wheelW : wx - 6, wy + 8, 6, 8);

            // Heavy tire body
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(wx, wy, wheelW, wheelH, 4);
            ctx.fill();
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Tread grooves
            ctx.fillStyle = '#334155';
            ctx.fillRect(wx + 2, wy + 6, wheelW - 4, 2);
            ctx.fillRect(wx + 2, wy + 12, wheelW - 4, 2);
            ctx.fillRect(wx + 2, wy + 18, wheelW - 4, 2);

            // Orange hubcap bolt
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.arc(wx + wheelW / 2, wy + wheelH / 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
          });
        });

        // 6. Central Exploration Craft Module (Ares High-Tech Exploration Rover Module)
        const roverSprite = getSprite('unit_rover');
        const craftSize = tileSize * 1.5;
        const craftX = centerX - craftSize / 2;
        const craftY = centerY - craftSize / 2;

        if (roverSprite && roverSprite.complete && roverSprite.naturalWidth > 0) {
          ctx.drawImage(roverSprite, craftX, craftY, craftSize, craftSize);
        } else {
          // Armored chassis procedural fallback
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.roundRect(centerX - tileSize * 0.5, centerY - tileSize * 0.6, tileSize, tileSize * 1.2, 12);
          ctx.fill();
          ctx.strokeStyle = '#ea580c';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // High-tech panel lines & markings
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(centerX - tileSize * 0.45, centerY);
          ctx.lineTo(centerX + tileSize * 0.45, centerY);
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(centerX, centerY + tileSize * 0.5);
          ctx.stroke();

          // Cockpit pressurized windshield
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(centerX, centerY - tileSize * 0.25, tileSize * 0.32, Math.PI, 0);
          ctx.fill();
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // 7. Cockpit telemetry beacon
        const beaconPulse = Math.sin(time * 0.006) * 0.35 + 0.65;
        ctx.fillStyle = `rgba(56, 189, 248, ${beaconPulse})`;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY - tileSize * 0.15, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 8. Polished Contextual Proximity Badge (suppressed when astronaut faces another colony structure)
        if (isNearVehicle && (!targetedBuilding || targetedBuilding.isVehicle || targetedBuilding.tile?.type === TILE_TYPES.VEHICLE)) {
          const landerText = isRtl
            ? `🚀 قاعدة أريس [E] تفريغ | [R] المستودع`
            : `🚀 Ares Base [E] Deposit | [R] Cargo`;
          ctx.font = 'bold 11px "Cairo", "JetBrains Mono", sans-serif';
          const textMetrics = ctx.measureText(landerText);
          const tagW = Math.max(160, Math.ceil(textMetrics.width + 24));
          const tagH = 26;
          const tagX = centerX - tagW / 2;
          const tagY = Math.max(16, vPy - 26);

          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 12;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.roundRect(tagX, tagY, tagW, tagH, 8);
          ctx.fill();
          ctx.stroke();

          ctx.shadowBlur = 0;
          ctx.fillStyle = '#fef08a';
          ctx.textAlign = 'center';
          ctx.fillText(landerText, centerX, tagY + 17);
        }

        ctx.restore();
      }

      // 3. Colony Power, Interaction Perimeters & Environmental Fields
      // Render dedicated interactive boundaries for structures (Heaters, Comms, Supply Depots)
      if (Array.isArray(grid)) {
        const pStartY = Math.max(0, startY - 18);
        const pEndY = Math.min(GRID_SIZE, endY + 18);
        const pStartX = Math.max(0, startX - 18);
        const pEndX = Math.min(GRID_SIZE, endX + 18);

        for (let gy = pStartY; gy < pEndY; gy++) {
          for (let gx = pStartX; gx < pEndX; gx++) {
            const tile = grid[gy]?.[gx];
            if (!tile) continue;

            // ==========================================
            // A) Thermal Heaters: Persistent Warmth Field & Animated Boundary
            // ==========================================
            if (tile.type === TILE_TYPES.THERMAL_HEATER) {
              const heaterLevel = tile.level || 1;
              const radiusTiles = heaterLevel === 3 ? 9.0 : heaterLevel === 2 ? 6.5 : HEATER_THERMAL_RADIUS;
              const radiusPx = radiusTiles * tileSize;
              const hpx = (gx + 0.5) * tileSize;
              const hpy = (gy + 0.5) * tileSize;
              const hTile = { ...tile, x: gx, y: gy };

              const isOperational = isBuildingOperational(hTile, { isDay, playerPos, grid });
              const isPaused = tile.disabled === true || tile.powerMode === 'OFF';
              const isStandby = !isPaused && !isOperational && isColonyPowered;
              const isActive = isOperational && isColonyPowered;
              const isNoPower = !isColonyPowered && !isPaused;

              ctx.save();

              // 1. Warm Ambient Thermal Radiant Ground Gradient (Active or Eco Standby)
              if (isActive) {
                const heaterGrad = ctx.createRadialGradient(hpx, hpy, tileSize * 0.35, hpx, hpy, radiusPx);
                const auraAlpha = Math.sin(time * 0.003) * 0.03 + 0.18;
                heaterGrad.addColorStop(0, `rgba(251, 146, 60, ${auraAlpha})`);
                heaterGrad.addColorStop(0.6, `rgba(251, 146, 60, ${auraAlpha * 0.45})`);
                heaterGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
                ctx.fillStyle = heaterGrad;
                ctx.beginPath();
                ctx.arc(hpx, hpy, radiusPx, 0, Math.PI * 2);
                ctx.fill();
              } else if (isStandby) {
                const standbyGrad = ctx.createRadialGradient(hpx, hpy, tileSize * 0.35, hpx, hpy, radiusPx);
                const standbyAlpha = Math.sin(time * 0.002) * 0.02 + 0.06;
                standbyGrad.addColorStop(0, `rgba(56, 189, 248, ${standbyAlpha})`);
                standbyGrad.addColorStop(0.65, `rgba(56, 189, 248, ${standbyAlpha * 0.3})`);
                standbyGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
                ctx.fillStyle = standbyGrad;
                ctx.beginPath();
                ctx.arc(hpx, hpy, radiusPx, 0, Math.PI * 2);
                ctx.fill();
              }

              // 2. Rising Thermal Micro-Embers (convective warmth particles) - Only when actively heating!
              if (isActive) {
                for (let e = 0; e < 6; e++) {
                  const seed = (gx * 13 + gy * 29 + e * 47);
                  const angle = ((seed % 100) / 100) * Math.PI * 2;
                  const distRatio = (((seed * 11) % 85) / 100);
                  const floatY = -((time * 0.025 + e * 20) % (tileSize * 1.8));
                  const ex = hpx + Math.cos(angle) * (radiusPx * distRatio);
                  const ey = hpy + Math.sin(angle) * (radiusPx * distRatio) + floatY;
                  const emberAlpha = Math.sin(time * 0.004 + e) * 0.25 + 0.45;

                  ctx.fillStyle = `rgba(253, 186, 116, ${emberAlpha})`;
                  ctx.beginPath();
                  ctx.arc(ex, ey, 1.3, 0, Math.PI * 2);
                  ctx.fill();
                }
              }

              // 3. Glowing Interactive Warmth Perimeter Boundary Ring (Styling depends on operational state)
              let ringColor, ringGlow, nodeColor, badgeBg, badgeBorder, badgeText, badgeLabel;
              if (isActive) {
                const ringPulse = Math.sin(time * 0.004) * 0.15 + 0.65;
                ringColor = `rgba(251, 146, 60, ${ringPulse})`;
                ringGlow = `rgba(251, 146, 60, ${ringPulse * 0.3})`;
                nodeColor = '#ea580c';
                badgeBg = 'rgba(15, 23, 42, 0.9)';
                badgeBorder = '#f97316';
                badgeText = '#fed7aa';
                badgeLabel = isRtl ? `♨ 37°C تدفئة Lv.${heaterLevel}` : `♨ 37°C Lv.${heaterLevel}`;
              } else if (isStandby) {
                const ringPulse = Math.sin(time * 0.003) * 0.12 + 0.55;
                ringColor = `rgba(56, 189, 248, ${ringPulse})`;
                ringGlow = `rgba(56, 189, 248, ${ringPulse * 0.25})`;
                nodeColor = '#38bdf8';
                badgeBg = 'rgba(8, 47, 73, 0.92)';
                badgeBorder = '#38bdf8';
                badgeText = '#bae6fd';
                badgeLabel = heaterLevel >= 3
                  ? (isRtl ? '📡 استشعار ذكي [0W]' : '📡 ECO SLEEP [0W]')
                  : (isRtl ? '🌙 وضع ليلي [0W]' : '🌙 NIGHT AUTO [0W]');
              } else if (isPaused) {
                ringColor = 'rgba(148, 163, 184, 0.4)';
                ringGlow = 'rgba(148, 163, 184, 0.12)';
                nodeColor = '#64748b';
                badgeBg = 'rgba(30, 41, 59, 0.92)';
                badgeBorder = '#64748b';
                badgeText = '#cbd5e1';
                badgeLabel = isRtl ? '⏸ إيقاف يدوي [0W]' : '⏸ PAUSED [0W]';
              } else {
                ringColor = 'rgba(239, 68, 68, 0.45)';
                ringGlow = 'rgba(239, 68, 68, 0.15)';
                nodeColor = '#ef4444';
                badgeBg = 'rgba(69, 10, 10, 0.92)';
                badgeBorder = '#ef4444';
                badgeText = '#fca5a5';
                badgeLabel = isRtl ? '⚡ طاقة 0 [0W]' : '⚡ NO POWER [0W]';
              }

              // Outer soft aura blur
              ctx.strokeStyle = ringGlow;
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.arc(hpx, hpy, radiusPx, 0, Math.PI * 2);
              ctx.stroke();

              // Dynamic animated rotating dashed perimeter
              ctx.strokeStyle = ringColor;
              ctx.lineWidth = 1.8;
              ctx.setLineDash([8, 6]);
              ctx.lineDashOffset = (isActive || isStandby) ? -time * 0.012 : 0;
              ctx.beginPath();
              ctx.arc(hpx, hpy, radiusPx, 0, Math.PI * 2);
              ctx.stroke();
              ctx.setLineDash([]);

              // Cardinal perimeter node markers (Top, Right, Bottom, Left)
              const cardinalNodes = [
                { x: hpx, y: hpy - radiusPx },
                { x: hpx + radiusPx, y: hpy },
                { x: hpx, y: hpy + radiusPx },
                { x: hpx - radiusPx, y: hpy },
              ];
              ctx.fillStyle = nodeColor;
              cardinalNodes.forEach(node => {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 2.8, 0, Math.PI * 2);
                ctx.fill();
              });

              // Sleek HUD telemetry badge on top edge of perimeter
              ctx.font = 'bold 9px "JetBrains Mono", monospace';
              const textMetrics = ctx.measureText(badgeLabel);
              const tagW = Math.max(86, textMetrics.width + 16);
              const tagH = 17;
              const tagX = hpx - tagW / 2;
              const tagY = hpy - radiusPx - tagH - 4;
              ctx.fillStyle = badgeBg;
              ctx.strokeStyle = badgeBorder;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(tagX, tagY, tagW, tagH, 4);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = badgeText;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(badgeLabel, hpx, tagY + tagH / 2);

              ctx.restore();
            }

            // ==========================================
            // B) Comms Arrays: Signal Coverage Perimeter
            // ==========================================
            if (tile.type === TILE_TYPES.COMMS_ARRAY) {
              const dishLevel = tile.level || 1;
              const signalRangeTiles = dishLevel === 3 ? 16.0 : dishLevel === 2 ? 10.5 : 6.5;
              const signalRadiusPx = signalRangeTiles * tileSize;
              const cpx = (gx + 0.5) * tileSize;
              const cpy = (gy + 0.5) * tileSize;

              const distToPlayer = Math.hypot((playerAnimPosRef.current.x + 0.5) * tileSize - cpx, (playerAnimPosRef.current.y + 0.5) * tileSize - cpy);
              const isPlayerInSignal = distToPlayer <= signalRadiusPx;
              const isHovering = hoverTile && Math.hypot((hoverTile.x + 0.5) * tileSize - cpx, (hoverTile.y + 0.5) * tileSize - cpy) <= signalRadiusPx;

              if (isPlayerInSignal || isHovering || activeBuilding?.type === TILE_TYPES.COMMS_ARRAY) {
                ctx.save();
                const commsAlpha = isColonyPowered ? (Math.sin(time * 0.003) * 0.08 + 0.28) : 0.08;
                ctx.strokeStyle = `rgba(168, 85, 247, ${commsAlpha})`;
                ctx.lineWidth = 1.4;
                ctx.setLineDash([6, 6]);
                ctx.lineDashOffset = time * 0.01;
                ctx.beginPath();
                ctx.arc(cpx, cpy, signalRadiusPx, 0, Math.PI * 2);
                ctx.stroke();

                // Expanding radar pulse wave
                const pulseR = (time * 0.035) % signalRadiusPx;
                const pulseFade = 1 - (pulseR / signalRadiusPx);
                ctx.strokeStyle = `rgba(192, 132, 252, ${pulseFade * 0.16})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(cpx, cpy, pulseR, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
              }
            }

            // ==========================================
            // C) Supply Depot Outposts: Shelter & Replenishment Boundary
            // ==========================================
            if (tile.type === TILE_TYPES.HAB) {
              const dpx = (gx + 0.5) * tileSize;
              const dpy = (gy + 0.5) * tileSize;
              const depotRadiusPx = 2.4 * tileSize;
              ctx.save();
              const depotPulse = Math.sin(time * 0.003) * 0.08 + 0.25;
              ctx.strokeStyle = `rgba(56, 189, 248, ${depotPulse})`;
              ctx.lineWidth = 1.4;
              ctx.setLineDash([6, 5]);
              ctx.beginPath();
              ctx.arc(dpx, dpy, depotRadiusPx, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
          }
        }
      }

      // 3.9. Tactical Focus Reticle for Targeted Building or Rover in Front of Player
      const currentTargetedBuilding = targetedBuildingRef.current;
      if (currentTargetedBuilding && !isGameOver && !isPaused) {
        const isRoverTarget = currentTargetedBuilding.isVehicle || currentTargetedBuilding.tile?.type === TILE_TYPES.VEHICLE;
        const tbx = isRoverTarget && vehiclePos ? vehiclePos.x * tileSize : currentTargetedBuilding.x * tileSize;
        const tby = isRoverTarget && vehiclePos ? vehiclePos.y * tileSize : currentTargetedBuilding.y * tileSize;
        const tbW = isRoverTarget ? tileSize * 2 : tileSize;
        const tbH = isRoverTarget ? tileSize * 2 : tileSize;
        const reticleTime = performance.now() * 0.005;
        const pulseAlpha = Math.sin(reticleTime) * 0.25 + 0.75;
        const cornerLen = Math.max(8, tileSize * 0.22);
        const reticleRgb = isRoverTarget ? '249, 115, 22' : '56, 189, 248';
        const shadowCol = isRoverTarget ? '#f97316' : '#38bdf8';

        ctx.save();
        ctx.strokeStyle = `rgba(${reticleRgb}, ${pulseAlpha})`;
        ctx.lineWidth = 2.2;
        ctx.shadowColor = shadowCol;
        ctx.shadowBlur = 10;

        // Draw 4 futuristic tactical corner brackets [ ┌ ┐ └ ┘ ]
        // Top-left
        ctx.beginPath();
        ctx.moveTo(tbx - 3, tby + cornerLen);
        ctx.lineTo(tbx - 3, tby - 3);
        ctx.lineTo(tbx + cornerLen, tby - 3);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(tbx + tbW + 3 - cornerLen, tby - 3);
        ctx.lineTo(tbx + tbW + 3, tby - 3);
        ctx.lineTo(tbx + tbW + 3, tby + cornerLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(tbx - 3, tby + tbH + 3 - cornerLen);
        ctx.lineTo(tbx - 3, tby + tbH + 3);
        ctx.lineTo(tbx + cornerLen, tby + tbH + 3);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(tbx + tbW + 3 - cornerLen, tby + tbH + 3);
        ctx.lineTo(tbx + tbW + 3, tby + tbH + 3);
        ctx.lineTo(tbx + tbW + 3, tby + tbH + 3 - cornerLen);
        ctx.stroke();

        // Target diamond ping on top
        ctx.fillStyle = `rgba(${reticleRgb}, ${pulseAlpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(tbx + tbW / 2, tby - 6, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 4. Placement Preview
      if (activeBuilding && hoverTile && isWithinBounds(hoverTile.x, hoverTile.y)) {
        const hpx = hoverTile.x * tileSize;
        const hpy = hoverTile.y * tileSize;
        const validation = canBuildAt(
          grid,
          hoverTile.x,
          hoverTile.y,
          playerPosRef.current,
          activeBuilding.type,
          habPos,
          isColonyPowered
        );
        const reqReg = Math.round(activeBuilding.cost.regolith * (buildingCostMultiplierRef.current || 1.0));
        const reqIce = Math.round(activeBuilding.cost.ice * (buildingCostMultiplierRef.current || 1.0));
        const reqXeno = activeBuilding.cost.xenoCrystals || 0;
        const hasRequiredItem = !activeBuilding.requiredItem || (craftedUpgrades && craftedUpgrades.includes(activeBuilding.requiredItem));
        const canAfford =
          materials.regolith >= reqReg &&
          materials.ice >= reqIce &&
          (materials.xenoCrystals || 0) >= reqXeno &&
          hasRequiredItem;
        const isValidPlacement = validation.valid && canAfford;

        ctx.save();

        // 4.1. Special Structure Prospective Interaction Coverage Preview
        if (activeBuilding.type === TILE_TYPES.THERMAL_HEATER) {
          const previewCenterPx = hpx + tileSize / 2;
          const previewCenterPy = hpy + tileSize / 2;
          const previewRadiusPx = HEATER_THERMAL_RADIUS * tileSize; // 4.5 tiles

          const prevGrad = ctx.createRadialGradient(previewCenterPx, previewCenterPy, tileSize * 0.3, previewCenterPx, previewCenterPy, previewRadiusPx);
          prevGrad.addColorStop(0, 'rgba(251, 146, 60, 0.22)');
          prevGrad.addColorStop(0.65, 'rgba(251, 146, 60, 0.08)');
          prevGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
          ctx.fillStyle = prevGrad;
          ctx.beginPath();
          ctx.arc(previewCenterPx, previewCenterPy, previewRadiusPx, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = isValidPlacement ? 'rgba(251, 146, 60, 0.85)' : 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([8, 6]);
          ctx.lineDashOffset = -time * 0.012;
          ctx.beginPath();
          ctx.arc(previewCenterPx, previewCenterPy, previewRadiusPx, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (activeBuilding.type === TILE_TYPES.COMMS_ARRAY) {
          const previewCenterPx = hpx + tileSize / 2;
          const previewCenterPy = hpy + tileSize / 2;
          const previewRadiusPx = 6.5 * tileSize;

          ctx.strokeStyle = isValidPlacement ? 'rgba(168, 85, 247, 0.75)' : 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(previewCenterPx, previewCenterPy, previewRadiusPx, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // 4.3. Ares Base Safe Plaza Holographic Perimeter Ring
        if (habPos || vehiclePos) {
          const plazaCenterX = (vehiclePos ? vehiclePos.x + 1.0 : (habPos?.x ?? 50)) * tileSize;
          const plazaCenterY = (vehiclePos ? vehiclePos.y + 1.0 : (habPos?.y ?? 50)) * tileSize;
          const plazaRadiusPx = BASE_SAFE_RADIUS * tileSize;
          ctx.save();
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.45)';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(plazaCenterX, plazaCenterY, plazaRadiusPx, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        if (isValidPlacement) {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;

          // Contextual Reason Tooltip
          const failReasonKey = !canAfford ? 'notEnoughResources' : validation.reasonKey;
          const reasonMsg = (t && t[failReasonKey]) || validation.reason || (!canAfford ? (isRtl ? 'موارد غير كافية' : 'Insufficient Resources') : '');
          if (reasonMsg) {
            ctx.save();
            ctx.font = 'bold 10px "Cairo", "JetBrains Mono", sans-serif';
            const tm = ctx.measureText(reasonMsg);
            const boxW = Math.max(120, tm.width + 16);
            const boxX = hpx + tileSize / 2 - boxW / 2;
            const boxY = hpy - 24;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxW, 20, 5);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fca5a5';
            ctx.textAlign = 'center';
            ctx.fillText(reasonMsg, hpx + tileSize / 2, boxY + 13.5);
            ctx.restore();
          }
        }

        ctx.fillRect(hpx + 2, hpy + 2, tileSize - 4, tileSize - 4);
        ctx.strokeRect(hpx + 2, hpy + 2, tileSize - 4, tileSize - 4);

        ctx.fillStyle = activeBuilding.color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(hpx + tileSize / 2, hpy + tileSize / 2, tileSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4.5. Relocating Structure Holographic Blueprint Preview
      if (relocatingBuilding && hoverTile && isWithinBounds(hoverTile.x, hoverTile.y)) {
        const hpx = hoverTile.x * tileSize;
        const hpy = hoverTile.y * tileSize;
        const validation = canBuildAt(
          grid,
          hoverTile.x,
          hoverTile.y,
          playerPosRef.current,
          relocatingBuilding.type,
          habPos,
          isColonyPowered
        );

        ctx.save();

        if (relocatingBuilding.type === TILE_TYPES.THERMAL_HEATER) {
          const rLvl = relocatingBuilding.level || 1;
          const rTiles = rLvl === 3 ? 9.0 : rLvl === 2 ? 6.5 : HEATER_THERMAL_RADIUS;
          const previewCenterPx = hpx + tileSize / 2;
          const previewCenterPy = hpy + tileSize / 2;
          const previewRadiusPx = rTiles * tileSize;

          ctx.strokeStyle = validation.valid ? 'rgba(251, 146, 60, 0.85)' : 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.arc(previewCenterPx, previewCenterPy, previewRadiusPx, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        if (validation.valid) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
        } else {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
        }

        ctx.fillRect(hpx + 2, hpy + 2, tileSize - 4, tileSize - 4);
        ctx.strokeRect(hpx + 2, hpy + 2, tileSize - 4, tileSize - 4);

        ctx.fillStyle = '#38bdf8';
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.arc(hpx + tileSize / 2, hpy + tileSize / 2, tileSize * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4.6. Update & Render Martian Burrowers (Native Subterranean Aliens)
      const currentEnemies = enemiesRef.current || [];
      const nowSec = time * 0.001;

      for (let i = currentEnemies.length - 1; i >= 0; i--) {
        const enemy = currentEnemies[i];
        if (enemy.health <= 0) continue;

        // AI Logic update
        if (!isPaused && !isGameOver) {
          const roverCenterX = vehiclePos.x + 1.0;
          const roverCenterY = vehiclePos.y + 1.0;
          const px = playerAnimPosRef.current.x + 0.5;
          const py = playerAnimPosRef.current.y + 0.5;
          const ex = enemy.x + 0.5;
          const ey = enemy.y + 0.5;

          // Unified Base Safe Radius:
          const SAFE_RING_RADIUS = BASE_SAFE_RADIUS;
          // Enemy body/leg span extends ~0.40 tiles outward.
          // BASE_BARRIER_RADIUS guarantees no claws penetrate inside the safe ring!
          const BASE_BARRIER_RADIUS = BASE_SAFE_RADIUS + 0.4;

          const distToPlayer = Math.hypot(px - ex, py - ey);
          const distEnemyToBase = Math.hypot(ex - roverCenterX, ey - roverCenterY);
          const distPlayerToBase = Math.hypot(px - roverCenterX, py - roverCenterY);
          const isPlayerInBase = distPlayerToBase <= SAFE_RING_RADIUS;

          // Check if straight line of sight to player is blocked by the circular base barrier
          const segDx = px - ex;
          const segDy = py - ey;
          const segLenSq = segDx * segDx + segDy * segDy;
          let isPathBlockedByBase = false;

          if (segLenSq > 0.0001) {
            const fx = roverCenterX - ex;
            const fy = roverCenterY - ey;
            const t = Math.max(0, Math.min(1, (fx * segDx + fy * segDy) / segLenSq));
            const closestX = ex + t * segDx;
            const closestY = ey + t * segDy;
            if (Math.hypot(closestX - roverCenterX, closestY - roverCenterY) < BASE_BARRIER_RADIUS + 0.05) {
              isPathBlockedByBase = true;
            }
          }

          // Enemy home coordinates for territorial dispersion
          const homeX = enemy.homeX ?? enemy.x;
          const homeY = enemy.homeY ?? enemy.y;

          // AI State evaluation:
          // If close enough to player, aggro into 'hunt'
          const isDevilBoss = enemy.creatureType === 'devil_leader';
          const aggroDist = isDevilBoss ? DEVIL_LEADER_CONFIG.aggroRadius : BURROWER_CONFIG.aggroRadius;
          if (distToPlayer <= aggroDist) {
            if (enemy.aiState !== 'disperse' || !isPlayerInBase) {
              enemy.aiState = 'hunt';
            }
          } else if (enemy.aiState === 'hunt' && distToPlayer > aggroDist + 3.0) {
            // Lost player: return to territory
            enemy.aiState = 'disperse';
          }

          // State 1: HUNTING / STALKING
          if (enemy.aiState === 'hunt') {
            const shouldCircumnavigate = isPathBlockedByBase || isPlayerInBase;

            if (shouldCircumnavigate) {
              // Calculate angular positions around base center
              const currentAngle = Math.atan2(ey - roverCenterY, ex - roverCenterX);
              const targetAngle = Math.atan2(py - roverCenterY, px - roverCenterX);
              let diff = targetAngle - currentAngle;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;

              // If player is sheltered inside base and enemy has reached the closest perimeter point:
              if (isPlayerInBase && Math.abs(diff) < 0.12 && distEnemyToBase <= BASE_BARRIER_RADIUS + 0.25) {
                // Ambush stalking halt: face player directly, LEGS REMAIN COMPLETELY STILL!
                enemy.angle = Math.atan2(py - ey, px - ex);
                enemy.isMoving = false; // legs freeze completely!

                // Patience timer: if player shelters for > 8 seconds, spider gives up and disperses
                enemy.stalkDuration = (enemy.stalkDuration || 0) + dt;
                if (enemy.stalkDuration > 8.0) {
                  enemy.aiState = 'disperse';
                  enemy.stalkDuration = 0;
                }
              } else {
                // Circumnavigate around the outer circular perimeter:
                enemy.isMoving = true;
                enemy.stalkDuration = 0;

                const angSpeed = (BURROWER_CONFIG.speed * 0.95) / Math.max(BASE_BARRIER_RADIUS, distEnemyToBase);
                const stepAng = Math.sign(diff) * Math.min(Math.abs(diff), angSpeed * dt);
                const newAng = currentAngle + stepAng;

                // Approach perimeter smoothly without ever penetrating it
                const targetDist = Math.max(BASE_BARRIER_RADIUS + 0.05, distEnemyToBase - BURROWER_CONFIG.speed * 0.5 * dt);
                const nextEx = roverCenterX + Math.cos(newAng) * targetDist;
                const nextEy = roverCenterY + Math.sin(newAng) * targetDist;

                const moveDx = nextEx - ex;
                const moveDy = nextEy - ey;
                if (Math.hypot(moveDx, moveDy) > 0.0001) {
                  enemy.angle = Math.atan2(moveDy, moveDx);
                  enemy.legPhase = (enemy.legPhase || 0) + dt * 14;
                }
                enemy.x = nextEx - 0.5;
                enemy.y = nextEy - 0.5;
              }
            } else {
              // Direct pursuit outside base across open terrain
              const chaseAngle = Math.atan2(py - ey, px - ex);
              enemy.angle = chaseAngle;
              enemy.stalkDuration = 0;

              const isEnraged = isDevilBoss && enemy.health < (enemy.maxHealth * 0.4);
              const curSpeed = isDevilBoss
                ? (isEnraged ? DEVIL_LEADER_CONFIG.enragedSpeed : DEVIL_LEADER_CONFIG.speed)
                : BURROWER_CONFIG.speed;
              const strikeRange = isDevilBoss ? 1.4 : 0.75;

              if (distToPlayer > strikeRange) {
                const moveStep = curSpeed * dt;
                const nextX = enemy.x + Math.cos(chaseAngle) * moveStep;
                const nextY = enemy.y + Math.sin(chaseAngle) * moveStep;
                const nextTile = grid[Math.floor(nextY + 0.5)]?.[Math.floor(nextX + 0.5)];
                const isSolidObstacle = nextTile && (
                  nextTile.type === TILE_TYPES.WALL ||
                  nextTile.type === TILE_TYPES.GATE ||
                  nextTile.type === TILE_TYPES.CAVE_WALL ||
                  nextTile.type === TILE_TYPES.HAB ||
                  nextTile.type === TILE_TYPES.VEHICLE ||
                  nextTile.type === TILE_TYPES.BIODOME ||
                  nextTile.type === TILE_TYPES.SOLAR_ARRAY ||
                  nextTile.type === TILE_TYPES.ICE_PURIFIER ||
                  nextTile.type === TILE_TYPES.COMMS_ARRAY ||
                  nextTile.type === TILE_TYPES.THERMAL_HEATER ||
                  nextTile.type === TILE_TYPES.BATTERY_BANK
                );

                if (!isSolidObstacle) {
                  enemy.isMoving = true;
                  enemy.x = nextX;
                  enemy.y = nextY;
                  enemy.legPhase = (enemy.legPhase || 0) + dt * (isDevilBoss ? 10 : 16);
                } else {
                  enemy.isMoving = false;
                  enemy.legPhase = (enemy.legPhase || 0) + dt * 3;
                }
              } else {
                // Melee strike range
                enemy.isMoving = false;
                const atkDamage = isDevilBoss ? DEVIL_LEADER_CONFIG.attackDamage : BURROWER_CONFIG.attackDamage;
                const atkCooldown = isDevilBoss ? DEVIL_LEADER_CONFIG.attackCooldown : BURROWER_CONFIG.attackCooldown;

                if (!isPlayerInBase && nowSec - (enemy.lastAttackTime || 0) >= atkCooldown) {
                  enemy.lastAttackTime = nowSec;
                  enemy.isAttacking = true;
                  enemy.attackTimer = 0.8;
                  onPlayerDamagedRef.current?.(atkDamage);
                  shakeDurationRef.current = isDevilBoss ? 0.45 : 0.3;
                  addParticles(playerAnimPosRef.current.x + 0.5, playerAnimPosRef.current.y + 0.5, isDevilBoss ? '#f97316' : '#ef4444', isDevilBoss ? 20 : 12);
                  addFloatingText(playerAnimPosRef.current.x + 0.5, playerAnimPosRef.current.y - 0.2, `-${atkDamage} HP`, '#ef4444');
                  // Knockback
                  enemy.x -= Math.cos(chaseAngle) * (isDevilBoss ? 0.25 : 0.45);
                  enemy.y -= Math.sin(chaseAngle) * (isDevilBoss ? 0.25 : 0.45);
                }
              }

              // Devil Leader Flame Slash Special Ability
              if (isDevilBoss && distToPlayer <= 4.2) {
                if (!enemy.lastSlashTime) enemy.lastSlashTime = nowSec;
                if (nowSec - enemy.lastSlashTime >= DEVIL_LEADER_CONFIG.slashCooldown) {
                  enemy.lastSlashTime = nowSec;
                  enemy.slashTimer = 0.8;
                  enemy.slashAngle = chaseAngle;
                  enemy.isAttacking = true;
                  enemy.attackTimer = 0.8;
                  if (distToPlayer <= 2.8) {
                    onPlayerDamagedRef.current?.(DEVIL_LEADER_CONFIG.slashDamage);
                    shakeDurationRef.current = 0.6;
                    addFloatingText(playerAnimPosRef.current.x + 0.5, playerAnimPosRef.current.y - 0.5, `FLAME SLASH! -${DEVIL_LEADER_CONFIG.slashDamage} HP`, '#f97316');
                    addParticles(playerAnimPosRef.current.x + 0.5, playerAnimPosRef.current.y + 0.5, '#ea580c', 28);
                  }
                }
              }
            }
          }
          // State 2: DISPERSE / RETREAT (Returning back to its territory)
          else if (enemy.aiState === 'disperse') {
            const distToHome = Math.hypot((homeX + 0.5) - ex, (homeY + 0.5) - ey);
            if (distToHome > 1.2) {
              const retAngle = Math.atan2(homeY + 0.5 - ey, homeX + 0.5 - ex);
              enemy.angle = retAngle;
              enemy.isMoving = true;
              enemy.x += Math.cos(retAngle) * (BURROWER_CONFIG.speed * 0.7) * dt;
              enemy.y += Math.sin(retAngle) * (BURROWER_CONFIG.speed * 0.7) * dt;
              enemy.legPhase = (enemy.legPhase || 0) + dt * 11;
            } else {
              enemy.isMoving = false;
              enemy.aiState = 'idle';
              enemy.patrolPause = 1.0;
            }
          }
          // State 3: ACTIVE TERRITORIAL PATROL (Enemies scuttle and explore their sector)
          else {
            if ((enemy.patrolPause || 0) > 0) {
              // Predator senses vibrations: stationary pause with completely still legs
              enemy.patrolPause -= dt;
              enemy.isMoving = false;
            } else {
              // Generate patrol destination within regional territory if none active
              if (enemy.patrolTargetX === undefined || enemy.patrolTargetY === undefined) {
                const pAngle = Math.random() * Math.PI * 2;
                const pDist = 1.5 + Math.random() * 2.8; // Roams 1.5 to 4.3 tiles around home anchor
                let nextTx = homeX + Math.cos(pAngle) * pDist;
                let nextTy = homeY + Math.sin(pAngle) * pDist;

                // Keep safely within Martian terrain boundaries
                const curGW = grid[0]?.length || GRID_SIZE;
                const curGH = grid.length || GRID_SIZE;
                nextTx = Math.max(1.5, Math.min(curGW - 2.5, nextTx));
                nextTy = Math.max(1.5, Math.min(curGH - 2.5, nextTy));

                // Maintain safety distance from base perimeter (only on surface where vehicle is present)
                if (roverCenterX >= 0 && roverCenterY >= 0) {
                  const dBase = Math.hypot(nextTx + 0.5 - roverCenterX, nextTy + 0.5 - roverCenterY);
                  if (dBase < BASE_BARRIER_RADIUS + 1.2) {
                    const awayAng = Math.atan2(nextTy + 0.5 - roverCenterY, nextTx + 0.5 - roverCenterX);
                    nextTx = roverCenterX + Math.cos(awayAng) * (BASE_BARRIER_RADIUS + 1.5) - 0.5;
                    nextTy = roverCenterY + Math.sin(awayAng) * (BASE_BARRIER_RADIUS + 1.5) - 0.5;
                  }
                }

                enemy.patrolTargetX = nextTx;
                enemy.patrolTargetY = nextTy;
              }

              const pdx = enemy.patrolTargetX + 0.5 - ex;
              const pdy = enemy.patrolTargetY + 0.5 - ey;
              const pDist = Math.hypot(pdx, pdy);

              if (pDist > 0.35) {
                const targetAngle = Math.atan2(pdy, pdx);
                enemy.angle = targetAngle;
                enemy.isMoving = true;
                const patrolSpeed = BURROWER_CONFIG.speed * 0.55; // Organic roaming crawl
                enemy.x += Math.cos(targetAngle) * patrolSpeed * dt;
                enemy.y += Math.sin(targetAngle) * patrolSpeed * dt;
                enemy.legPhase = (enemy.legPhase || 0) + dt * 11;
              } else {
                // Reached destination: halt legs and pause for 1.2 to 2.8 seconds before next scuttle
                enemy.isMoving = false;
                enemy.patrolPause = 1.2 + Math.random() * 1.6;
                enemy.patrolTargetX = undefined;
                enemy.patrolTargetY = undefined;
              }
            }
          }

          // Absolute physical barrier guarantee on surface:
          if (roverCenterX >= 0 && roverCenterY >= 0) {
            const curEx = enemy.x + 0.5;
            const curEy = enemy.y + 0.5;
            const curDistToBase = Math.hypot(curEx - roverCenterX, curEy - roverCenterY);
            if (curDistToBase < BASE_BARRIER_RADIUS) {
              const pushAngle = Math.atan2(curEy - roverCenterY, curEx - roverCenterX);
              enemy.x = roverCenterX + Math.cos(pushAngle) * (BASE_BARRIER_RADIUS + 0.05) - 0.5;
              enemy.y = roverCenterY + Math.sin(pushAngle) * (BASE_BARRIER_RADIUS + 0.05) - 0.5;
            }
          }

          // Decrement boss attack and fx timers
          if (enemy.attackTimer > 0) {
            enemy.attackTimer -= dt;
            if (enemy.attackTimer <= 0) enemy.isAttacking = false;
          }
          if (enemy.slashTimer > 0) {
            enemy.slashTimer -= dt;
          }
          if (enemy.hurtFlashTimer > 0) {
            enemy.hurtFlashTimer -= dt;
          }
        }

        // Draw Martian Organism (Burrower / Alpha / Crystal Walker / Ice Prowler / Titan Boss)
        const bx = (enemy.x + 0.5) * tileSize;
        const by = (enemy.y + 0.5) * tileSize;

        // Frustum Culling: Skip drawing organisms outside visible viewport
        if (
          bx < camX - 100 ||
          bx > camX + viewportW + 100 ||
          by < camY - 100 ||
          by > camY + viewportH + 100
        ) {
          continue;
        }


        const bAngle = enemy.angle || 0;
        const legPhase = enemy.legPhase || 0;
        const isEnemyMoving = enemy.isMoving ?? false;

        const cType = enemy.creatureType || (enemy.isAlpha ? 'alpha' : 'burrower');
        const isTitan = cType === 'titan';
        const isCrystal = cType === 'crystal';
        const isIce = cType === 'ice';
        const isAlpha = cType === 'alpha' || enemy.isAlpha;

        const scale = isTitan ? 1.75 : (isAlpha ? 1.25 : (isCrystal ? 1.1 : (isIce ? 0.95 : 1.0)));

        if (cType === 'devil_leader') {
          // 4-Direction determination from angle
          let dir = 'front';
          const normAngle = Math.atan2(Math.sin(enemy.angle || 0), Math.cos(enemy.angle || 0));
          if (normAngle > -Math.PI * 0.25 && normAngle < Math.PI * 0.25) {
            dir = 'right';
          } else if (normAngle >= Math.PI * 0.25 && normAngle <= Math.PI * 0.75) {
            dir = 'front';
          } else if (normAngle <= -Math.PI * 0.25 && normAngle >= -Math.PI * 0.75) {
            dir = 'back';
          } else {
            dir = 'left';
          }

          let action = 'idle';
          let spriteKey = 'boss_devil_idle';
          let cols = 4;
          let frameIndex = 0;

          if (enemy.isDying) {
            action = 'dying';
            spriteKey = 'boss_devil_dying';
            cols = 5;
            frameIndex = Math.min(9, Math.floor(((enemy.deathTimer || 0) / 1.0) * 10));
          } else if (enemy.isAttacking) {
            action = 'attack';
            spriteKey = `boss_devil_attack_${dir}`;
            cols = 5;
            const progress = 1.0 - Math.max(0, Math.min(1, (enemy.attackTimer || 0) / 0.8));
            frameIndex = Math.min(9, Math.floor(progress * 10));
          } else if (enemy.isMoving) {
            action = 'walk';
            spriteKey = `boss_devil_walk_${dir}`;
            cols = 4;
            frameIndex = Math.floor((enemy.legPhase || 0) * 1.6) % 20;
          } else {
            action = 'idle';
            spriteKey = 'boss_devil_idle';
            cols = 4;
            frameIndex = Math.floor((time * 0.008) % 16);
          }

          const img = getSprite(spriteKey);

          // Fiery Boss Ground Aura & Shadow
          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          ctx.beginPath();
          ctx.ellipse(bx, by + tileSize * 0.42, tileSize * 0.85, tileSize * 0.38, 0, 0, Math.PI * 2);
          ctx.fill();

          const auraPulse = Math.sin(time * 0.006) * 0.15 + 0.35;
          const auraGrad = ctx.createRadialGradient(bx, by, tileSize * 0.2, bx, by, tileSize * 1.4);
          auraGrad.addColorStop(0, `rgba(239, 68, 68, ${auraPulse * 0.45})`);
          auraGrad.addColorStop(0.55, `rgba(249, 115, 22, ${auraPulse * 0.22})`);
          auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(bx, by, tileSize * 1.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          const bossScale = 2.4;
          const bossW = tileSize * bossScale;
          const bossH = bossW * (720 / 840);

          if (img && img.complete && img.naturalWidth > 0) {
            const col = frameIndex % cols;
            const row = Math.floor(frameIndex / cols);
            const srcX = col * 840;
            const srcY = row * 720;

            ctx.save();
            if ((enemy.hurtFlashTimer || 0) > 0) {
              ctx.filter = 'brightness(1.9) drop-shadow(0 0 14px #ef4444)';
            }
            ctx.drawImage(
              img,
              srcX, srcY, 840, 720,
              bx - bossW / 2, by - bossH * 0.68, bossW, bossH
            );
            ctx.restore();
          }

          // Render Fire Slash Effect during strike
          if ((enemy.slashTimer || 0) > 0) {
            const slashProgress = 1.0 - Math.max(0, Math.min(1, enemy.slashTimer / 0.8));
            const fxIndex = Math.min(12, Math.max(1, Math.floor(slashProgress * 12) + 1));
            const fxKey = `fx_fire_slash_${String(fxIndex).padStart(2, '0')}`;
            const fxImg = getSprite(fxKey);

            if (fxImg && fxImg.complete && fxImg.naturalWidth > 0) {
              const slashAngle = enemy.slashAngle ?? enemy.angle ?? 0;
              const sfxX = bx + Math.cos(slashAngle) * (tileSize * 1.05);
              const sfxY = by + Math.sin(slashAngle) * (tileSize * 1.05);
              const fxSize = tileSize * 2.8;

              ctx.save();
              ctx.translate(sfxX, sfxY);
              ctx.rotate(slashAngle + Math.PI / 2);
              ctx.globalCompositeOperation = 'lighter';
              ctx.shadowColor = '#f97316';
              ctx.shadowBlur = 18;
              ctx.drawImage(fxImg, -fxSize / 2, -fxSize / 2, fxSize, fxSize);
              ctx.restore();
            }
          }
        } else {
          ctx.save();
          ctx.translate(bx, by);

        // Ground shadow (scaled to organism size)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 8 * scale, (tileSize * 0.3) * scale, (tileSize * 0.15) * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rotate Burrower model
        ctx.rotate(bAngle + Math.PI / 2);
        ctx.scale(scale, scale);

        // Biome Palette Definitions
        let legColor = '#450a0a';
        let bodyBase = '#1c1917';
        let ridgeColor = '#991b1b';
        let eyeColor = '#f59e0b';
        let eyeGlow = '#ef4444';
        let pincerColor = '#f87171';

        if (isTitan) {
          legColor = '#18181b';
          bodyBase = '#09090b';
          ridgeColor = '#ea580c';
          eyeColor = '#f97316';
          eyeGlow = '#f97316';
          pincerColor = '#fb923c';
        } else if (isAlpha) {
          legColor = '#881337';
          bodyBase = '#1e1b4b';
          ridgeColor = '#be123c';
          eyeColor = '#e879f9';
          eyeGlow = '#c084fc';
          pincerColor = '#f43f5e';
        } else if (isCrystal) {
          legColor = '#581c87';
          bodyBase = '#1e1b4b';
          ridgeColor = '#7e22ce';
          eyeColor = '#06b6d4';
          eyeGlow = '#0891b2';
          pincerColor = '#a855f7';
        } else if (isIce) {
          legColor = '#0369a1';
          bodyBase = '#0f172a';
          ridgeColor = '#0284c7';
          eyeColor = '#38bdf8';
          eyeGlow = '#38bdf8';
          pincerColor = '#7dd3fc';
        }

        // 6 Articulated Skittering Legs
        ctx.strokeStyle = legColor;
        ctx.lineWidth = isTitan ? 3.5 : 2.5;
        for (let leg = 0; leg < 3; leg++) {
          const sideOffset = (leg - 1) * 7;
          const legWiggleLeft = isEnemyMoving ? Math.sin(legPhase + leg * 1.8) * 6 : 0;
          const legWiggleRight = isEnemyMoving ? Math.sin(legPhase + leg * 1.8 + Math.PI) * 6 : 0;

          // Left leg
          ctx.beginPath();
          ctx.moveTo(-4, sideOffset);
          ctx.lineTo(-14 - Math.abs(legWiggleLeft) * 0.5, sideOffset - 8 + legWiggleLeft);
          ctx.lineTo(-20, sideOffset - 14 + legWiggleLeft * 1.2);
          ctx.stroke();

          // Right leg
          ctx.beginPath();
          ctx.moveTo(4, sideOffset);
          ctx.lineTo(14 + Math.abs(legWiggleRight) * 0.5, sideOffset - 8 + legWiggleRight);
          ctx.lineTo(20, sideOffset - 14 + legWiggleRight * 1.2);
          ctx.stroke();
        }

        // Chitinous Segmented Body (Carapace)
        ctx.fillStyle = bodyBase;
        ctx.beginPath();
        ctx.ellipse(0, 6, 9, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ridgeColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Carapace segments ridges
        ctx.fillStyle = ridgeColor;
        ctx.beginPath();
        ctx.arc(0, 4, 6, 0, Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 9, 7, 0, Math.PI);
        ctx.fill();

        // Unique Biological Features
        if (isCrystal) {
          // Xeno Crystal Dorsal Spines
          ctx.save();
          ctx.fillStyle = '#c084fc';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.moveTo(0, 2);
          ctx.lineTo(-4, 8);
          ctx.lineTo(0, 14);
          ctx.lineTo(4, 8);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else if (isTitan) {
          // Pulsing Geothermal Bio-Sac
          ctx.save();
          const tPulse = Math.sin(time * 0.005) * 0.2 + 0.8;
          ctx.fillStyle = `rgba(249, 115, 22, ${0.8 * tPulse})`;
          ctx.shadowColor = '#ea580c';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.ellipse(0, 7, 5, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Cephalothorax (Head)
        ctx.fillStyle = isTitan ? '#18181b' : (isAlpha ? '#292524' : '#292524');
        ctx.beginPath();
        ctx.ellipse(0, -6, 7, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ridgeColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Mandibles / Pincers
        ctx.strokeStyle = pincerColor;
        ctx.lineWidth = isTitan ? 2.8 : 2;
        ctx.beginPath();
        ctx.moveTo(-4, -12);
        ctx.lineTo(-7, -18);
        ctx.lineTo(-3, -20);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(4, -12);
        ctx.lineTo(7, -18);
        ctx.lineTo(3, -20);
        ctx.stroke();

        // Glowing Bioluminescent Eyes
        ctx.fillStyle = eyeColor;
        ctx.shadowColor = eyeGlow;
        ctx.shadowBlur = isTitan ? 12 : (isAlpha ? 8 : 6);
        ctx.beginPath();
        ctx.arc(-3, -9, isTitan ? 2.8 : (isAlpha ? 2.3 : 2), 0, Math.PI * 2);
        ctx.arc(3, -9, isTitan ? 2.8 : (isAlpha ? 2.3 : 2), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore(); // end enemy rotation & scale
        }

        // Health Bar (always horizontal above enemy)
        const isBoss = enemy.isBoss || cType === 'devil_leader';
        const hpPct = Math.max(0, Math.min(1, enemy.health / (enemy.maxHealth || (isBoss ? 380 : 60))));
        const barW = isBoss ? (tileSize * 1.8) : ((tileSize * 0.75) * Math.min(1.4, scale));
        const barH = isBoss ? 6 : 4;
        const barX = bx - barW / 2;
        const barY = by - (tileSize * (isBoss ? 0.95 : 0.48)) * (isBoss ? 1 : scale);

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        ctx.strokeStyle = isBoss ? '#ea580c' : (isTitan ? '#ea580c' : (isAlpha ? 'rgba(192, 132, 252, 0.7)' : (isCrystal ? '#06b6d4' : 'rgba(239, 68, 68, 0.6)')));
        ctx.lineWidth = isBoss ? 1.5 : 0.8;
        ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);

        if (isBoss) {
          const bossGrad = ctx.createLinearGradient(barX, 0, barX + barW * hpPct, 0);
          bossGrad.addColorStop(0, '#dc2626');
          bossGrad.addColorStop(1, '#f97316');
          ctx.fillStyle = bossGrad;
          ctx.fillRect(barX, barY, barW * hpPct, barH);

          // Boss Title over health bar
          ctx.fillStyle = '#fed7aa';
          ctx.font = 'bold 10px "Orbitron", sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 4;
          ctx.fillText(isRtl ? (enemy.nameAr || 'سيد الكائنات المريخية') : (enemy.name || 'APEX SOVEREIGN'), bx, barY - 5);
        } else {
          ctx.fillStyle = isTitan
            ? '#ea580c'
            : (isAlpha
                ? (hpPct > 0.5 ? '#a855f7' : (hpPct > 0.25 ? '#eab308' : '#ef4444'))
                : (isCrystal
                    ? '#06b6d4'
                    : (isIce
                        ? '#38bdf8'
                        : (hpPct > 0.5 ? '#22c55e' : (hpPct > 0.25 ? '#eab308' : '#ef4444')))));
          ctx.fillRect(barX, barY, barW * hpPct, barH);

          if (enemy.isAlpha) {
            ctx.font = 'bold 8px "JetBrains Mono", monospace';
            ctx.fillStyle = '#e9d5ff';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ ALPHA', bx, barY - 4);
          }
        }
        ctx.restore();
      }

      // 4.7. Update and Render Sci-Fi Loot Drops (Bio-Samples 🧬, Plasma Crystals ⚡, Pure Xeno-Cores ⚛️)
      for (let i = lootDropsRef.current.length - 1; i >= 0; i--) {
        const drop = lootDropsRef.current[i];
        const distToPlayer = Math.hypot(
          playerAnimPosRef.current.x + 0.5 - drop.x,
          playerAnimPosRef.current.y + 0.5 - drop.y
        );

        const dropType = drop.type || 'PLASMA_CRYSTAL';
        const dropAmount = drop.amount || 1;

        if (distToPlayer <= 0.85) {
          lootDropsRef.current.splice(i, 1);
          onCollectLootRef.current?.(dropType, dropAmount);

          if (dropType === 'BIO_SAMPLE') {
            addParticles(drop.x, drop.y, '#10b981', 14);
            addFloatingText(drop.x, drop.y - 0.3, isRtl ? `+${dropAmount} عينات حيوية 🧬` : `+${dropAmount} Bio-Sample 🧬`, '#10b981');
          } else if (dropType === 'XENO_CORE') {
            addParticles(drop.x, drop.y, '#c084fc', 20);
            addParticles(drop.x, drop.y, '#f59e0b', 12);
            addFloatingText(drop.x, drop.y - 0.3, isRtl ? `+${dropAmount} نواة زينو فائقة ⚛️` : `+${dropAmount} Pure Xeno-Core ⚛️`, '#c084fc');
          } else {
            addParticles(drop.x, drop.y, '#38bdf8', 14);
            addFloatingText(drop.x, drop.y - 0.3, isRtl ? `+${dropAmount} بلورة بلازما ⚡` : `+${dropAmount} Plasma Crystal ⚡`, '#38bdf8');
          }
          continue;
        }

        const lx = drop.x * tileSize;
        const ly = drop.y * tileSize + Math.sin(time * 0.004 + (drop.bobOffset || 0)) * 5;

        // Viewport culling for loot drops
        if (
          lx < camX - 60 ||
          lx > camX + viewportW + 60 ||
          ly < camY - 60 ||
          ly > camY + viewportH + 60
        ) {
          continue;
        }

        ctx.save();
        ctx.translate(lx, ly);

        if (dropType === 'BIO_SAMPLE') {
          // --- 1. Bio-Sample (Glowing emerald organic specimen vial) ---
          const groundGrad = ctx.createRadialGradient(0, 8, 2, 0, 8, 18);
          groundGrad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
          groundGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
          ctx.fillStyle = groundGrad;
          ctx.beginPath();
          ctx.arc(0, 8, 18, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 12;

          // Glass vial body
          ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
          ctx.beginPath();
          ctx.roundRect(-4.5, -9, 9, 18, 4);
          ctx.fill();

          // Metallic chrome endcaps
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.roundRect(-5, -11, 10, 3.5, 1.5);
          ctx.roundRect(-5, 7.5, 10, 3.5, 1.5);
          ctx.fill();

          // Glowing DNA / specimen core line
          ctx.strokeStyle = '#a7f3d0';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(0, 6);
          ctx.stroke();

        } else if (dropType === 'XENO_CORE') {
          // --- 2. Pure Xeno-Core (Pulsing atomic singularity reactor core) ---
          const groundGrad = ctx.createRadialGradient(0, 8, 2, 0, 8, 22);
          groundGrad.addColorStop(0, 'rgba(168, 85, 247, 0.6)');
          groundGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.2)');
          groundGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
          ctx.fillStyle = groundGrad;
          ctx.beginPath();
          ctx.arc(0, 8, 22, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 16;

          // Rotating planetary orbital electron ring
          const ringAngle = time * 0.003 + (drop.bobOffset || 0);
          ctx.save();
          ctx.rotate(ringAngle);
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.ellipse(0, 0, 11, 4.5, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          // Outer magnetic containment brackets
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.arc(0, 0, 8, -Math.PI * 0.35, Math.PI * 0.35);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, 8, Math.PI * 0.65, Math.PI * 1.35);
          ctx.stroke();

          // Core singularity orb
          const coreGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 6);
          coreGrad.addColorStop(0, '#ffffff');
          coreGrad.addColorStop(0.4, '#f59e0b');
          coreGrad.addColorStop(0.85, '#9333ea');
          coreGrad.addColorStop(1, '#581c87');
          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
          ctx.fill();

        } else {
          // --- 3. Cosmic Plasma Crystal (Electric cyan crystalline shard) ---
          const groundGrad = ctx.createRadialGradient(0, 8, 2, 0, 8, 18);
          groundGrad.addColorStop(0, 'rgba(6, 182, 212, 0.5)');
          groundGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
          ctx.fillStyle = groundGrad;
          ctx.beginPath();
          ctx.arc(0, 8, 18, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 14;

          // Prismatic crystal facets
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.moveTo(0, -11);
          ctx.lineTo(7, -1);
          ctx.lineTo(0, 10);
          ctx.lineTo(-7, -1);
          ctx.closePath();
          ctx.fill();

          // Inner high-voltage facet
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(0, -11);
          ctx.lineTo(4, -1);
          ctx.lineTo(0, 7);
          ctx.closePath();
          ctx.fill();

          // Bright electric highlight line
          ctx.strokeStyle = '#e0f2fe';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(0, -11);
          ctx.lineTo(0, 10);
          ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // 4.8. Render NASA Orbital Reconnaissance Beacons & Ground Light Pillars
      const currentOrbitalPings = orbitalPingsRef.current || [];
      if (Array.isArray(currentOrbitalPings) && currentOrbitalPings.length > 0) {
        currentOrbitalPings.forEach((ping) => {
          if (!ping) return;
          const pingWorldX = (ping.x + 0.5) * tileSize;
          const pingWorldY = (ping.y + 0.5) * tileSize;

          // Check if inside viewport
          const isInView = (
            pingWorldX >= camX - 100 &&
            pingWorldX <= camX + viewportW + 100 &&
            pingWorldY >= camY - 100 &&
            pingWorldY <= camY + viewportH + 100
          );

          const isCave = ping.category === 'CAVE';
          const pingColor = isCave ? '#10b981' : (ping.category === 'RESOURCE' ? '#38bdf8' : '#f59e0b');

          if (isInView) {
            ctx.save();
            ctx.translate(pingWorldX, pingWorldY);

            const pulse = (Math.sin(time * 0.005 + (ping.id || 0)) + 1) * 0.5;

            // 1. Holographic Vertical Celestial Light Pillar (reaches into sky)
            const pillarGrad = ctx.createLinearGradient(0, 0, 0, -180);
            pillarGrad.addColorStop(0, isCave ? 'rgba(16, 185, 129, 0.45)' : 'rgba(56, 189, 248, 0.45)');
            pillarGrad.addColorStop(0.4, isCave ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)');
            pillarGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = pillarGrad;
            ctx.beginPath();
            ctx.moveTo(-16, 0);
            ctx.lineTo(16, 0);
            ctx.lineTo(8, -180);
            ctx.lineTo(-8, -180);
            ctx.closePath();
            ctx.fill();

            // 2. Rotating Ground Scanning Calibration Reticle
            const rotAngle = time * 0.002;
            ctx.save();
            ctx.rotate(rotAngle);
            ctx.strokeStyle = pingColor;
            ctx.lineWidth = 1.5;
            ctx.shadowColor = pingColor;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, 22 + pulse * 6, 0, Math.PI * 2);
            ctx.stroke();

            // Targeting Brackets [ ]
            ctx.beginPath();
            ctx.arc(0, 0, 28, -Math.PI * 0.2, Math.PI * 0.2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, 28, Math.PI * 0.8, Math.PI * 1.2);
            ctx.stroke();
            ctx.restore();

            // 3. Center Glowing Beacon Satellite Core
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = pingColor;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // 4. Floating Holographic Waypoint Tag
            const labelText = typeof ping.label === 'object' ? (isRtl ? ping.label.ar : ping.label.en) : (ping.label || 'NASA RECON');
            ctx.font = 'bold 10px monospace';
            const tagW = ctx.measureText(`🛰️ ${labelText}`).width + 16;
            ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
            ctx.strokeStyle = pingColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(-tagW / 2, -42 - pulse * 4, tagW, 20, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`🛰️ ${labelText}`, 0, -32 - pulse * 4);

            ctx.restore();
          } else {
            // Off-screen HUD Direction Pointer
            const ppx = (playerAnimPosRef.current.x + 0.5) * tileSize;
            const ppy = (playerAnimPosRef.current.y + 0.5) * tileSize;
            const dx = pingWorldX - ppx;
            const dy = pingWorldY - ppy;
            const distTiles = Math.hypot(dx, dy) / tileSize;
            const angle = Math.atan2(dy, dx);

            // Clamp to screen edges inside viewport
            const margin = 50;
            const screenCenterX = camX + viewportW / 2;
            const screenCenterY = camY + viewportH / 2;
            const maxRayX = (viewportW / 2) - margin;
            const maxRayY = (viewportH / 2) - margin;

            const scaleX = Math.abs(Math.cos(angle)) > 0.001 ? maxRayX / Math.abs(Math.cos(angle)) : Infinity;
            const scaleY = Math.abs(Math.sin(angle)) > 0.001 ? maxRayY / Math.abs(Math.sin(angle)) : Infinity;
            const rayScale = Math.min(scaleX, scaleY);

            const arrowX = screenCenterX + Math.cos(angle) * rayScale;
            const arrowY = screenCenterY + Math.sin(angle) * rayScale;

            ctx.save();
            ctx.translate(arrowX, arrowY);
            ctx.rotate(angle);

            ctx.fillStyle = pingColor;
            ctx.shadowColor = pingColor;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(-6, -7);
            ctx.lineTo(-2, 0);
            ctx.lineTo(-6, 7);
            ctx.closePath();
            ctx.fill();

            // Badge text with distance
            ctx.restore();
            ctx.save();
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            const badgeOffset = 14;
            ctx.fillText(`🛰️ ${Math.round(distTiles)}m`, arrowX, arrowY + (Math.sin(angle) > 0 ? -badgeOffset : badgeOffset));
            ctx.restore();
          }
        });
      }

      // 5. Render Astronaut Character
      const astronautPx = (playerAnimPosRef.current.x + 0.5) * tileSize;
      const astronautPy = (playerAnimPosRef.current.y + 0.5) * tileSize;

      // Ground Soft Shadow
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(astronautPx, astronautPy + tileSize * 0.35, tileSize * 0.28, tileSize * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const rawFacing = playerFacingRef.current;
      const isFiringRecently = (Date.now() - (lastBlasterFireTimeRef.current || 0)) < 360;
      const isPlayerActivelyMoving = isMovingRef.current || Boolean(keys.up || keys.down || keys.left || keys.right);
      const walkCycle = isPlayerActivelyMoving ? Math.sin(time * 0.016) : 0;
      const walkBob = isPlayerActivelyMoving ? Math.abs(Math.sin(time * 0.016)) * 2.5 : 0;

      // When firing recently, orient character towards mouse aim direction
      let effectiveFacing = rawFacing;
      if (isFiringRecently && aimAngleRef.current !== undefined) {
        const aim = aimAngleRef.current;
        if (aim >= -Math.PI / 4 && aim <= Math.PI / 4) {
          effectiveFacing = 'right';
        } else if (aim > Math.PI / 4 && aim < (3 * Math.PI) / 4) {
          effectiveFacing = 'down';
        } else if (aim < -Math.PI / 4 && aim > -(3 * Math.PI) / 4) {
          effectiveFacing = 'up';
        } else {
          effectiveFacing = 'left';
        }
      }

      // Alias facing to effectiveFacing for procedural astronaut rendering
      const facing = effectiveFacing;

      const defaultAngleForFacing =
        effectiveFacing === 'right' ? 0 :
        effectiveFacing === 'down' ? Math.PI / 2 :
        effectiveFacing === 'left' ? Math.PI : -Math.PI / 2;

      // When firing recently, aim dynamically towards shot angle (360°); otherwise, strictly align with movement facing direction
      const currentAim = isFiringRecently && aimAngleRef.current !== undefined
        ? aimAngleRef.current
        : defaultAngleForFacing;

      // Recoil kickback when firing or drilling
      let recoilX = 0;
      let recoilY = 0;
      if (isFiringRecently) {
        recoilX = -Math.cos(currentAim) * 3.5;
        recoilY = -Math.sin(currentAim) * 3.5;
      }
      if (isMining) {
        // High-frequency tactile vibration while operating heavy mining drill
        recoilX += (Math.random() - 0.5) * 1.5;
        recoilY += (Math.random() - 0.5) * 1.5;
      }

      const pX = astronautPx + recoilX;
      const pY = astronautPy + recoilY;

      ctx.save();
      ctx.translate(pX, pY);

      // Determine Commander animation state
      const rowMap = { down: 0, up: 1, right: 2, left: 3 };
      const row = rowMap[effectiveFacing] ?? 0;
      const cellW = 48;
      const cellH = 72;

      let animKey = 'commander_idle';
      let frameCount = 6;
      let frameIndex = 0;

      if (health <= 0 || isGameOver) {
        animKey = 'commander_death';
        frameCount = 6;
        if (!deathTimeRef.current) deathTimeRef.current = Date.now();
        const elapsedDeath = Date.now() - deathTimeRef.current;
        frameIndex = Math.min(5, Math.floor(elapsedDeath / 140));
      } else {
        deathTimeRef.current = 0; // Reset death timestamp while alive
        if (isFiringRecently) {
          animKey = 'commander_attack';
          frameCount = 6;
          const elapsedShot = Date.now() - (lastBlasterFireTimeRef.current || 0);
          frameIndex = Math.min(5, Math.floor((elapsedShot / 360) * 6));
        } else if (isPlayerActivelyMoving) {
          animKey = 'commander_walk';
          frameCount = 6;
          frameIndex = Math.floor((time * 0.009) % frameCount);
        } else {
          animKey = 'commander_idle';
          frameCount = 6;
          frameIndex = Math.floor((time * 0.004) % frameCount);
        }
      }

      // Check if active Commander animation sprite is loaded (or fallback to walk/idle)
      let activeSprite = getSprite(animKey);
      if (!activeSprite || !activeSprite.complete || activeSprite.naturalWidth === 0) {
        activeSprite = getSprite('commander_idle') || getSprite('commander_walk');
      }

      // Toggle to use high-fidelity Procedural Astronaut vs Spritesheet Pack
      // Set to false to use the procedural astronaut character
      const USE_SPRITESHEET_COMMANDER = false;

      if (USE_SPRITESHEET_COMMANDER && activeSprite && activeSprite.complete && activeSprite.naturalWidth > 0) {
        // High-fidelity 2D Top-Down Animated Commander (Idle, Walk, Attack, Hurt, Death)
        const sx = frameIndex * cellW;
        const sy = row * cellH;

        // Render destination: scaled to fit player tile size naturally
        const destW = tileSize * 0.72; // ~52px
        const destH = destW * (cellH / cellW); // ~78px

        // Bottom of feet inside cell is pinned at Y=66/72: align directly on shadow center
        const footYInCell = 66 / 72;
        const destY = tileSize * 0.35 - (destH * footYInCell);
        const destX = -destW / 2;

        const drawCharacterBody = () => {
          ctx.save();
          ctx.imageSmoothingEnabled = false; // Preserve crisp pixel-art definition
          ctx.drawImage(
            activeSprite,
            sx,
            sy,
            cellW,
            cellH,
            destX,
            destY,
            destW,
            destH
          );
          ctx.restore();
        };

        // Authentic Pixel-Art Weapon & Mining Tool Layer in Astronaut's Hands (Alive state only)
        const drawWeaponLayer = () => {
          if (health <= 0 || isGameOver) return;
          const weaponSprite = getSprite('commander_weapon');
          if (!weaponSprite || !weaponSprite.complete || weaponSprite.naturalWidth === 0) return;

          const weaponRowMap = { down: 0, up: 1, right: 2, left: 3 };
          const wRow = weaponRowMap[effectiveFacing] ?? 0;
          
          // Animate the spinning orange plasma drill / energy coil
          const isActivelyOperating = isFiringRecently || isMining;
          const weaponFrame = isActivelyOperating
            ? Math.floor((time * 0.02) % 6)
            : (isPlayerActivelyMoving ? Math.floor((time * 0.009) % 6) : 0);

          const wCellSize = 32;
          const scale = tileSize / 72;
          const wDrawSize = 24 * scale;

          // Subtle arm bob sync with walk animation
          const walkArmBobY = isPlayerActivelyMoving
            ? ((frameIndex === 1 || frameIndex === 2 || frameIndex === 5) ? -1.2 * scale : 0.8 * scale)
            : 0;

          // Recoil kickback when firing
          let kickX = 0;
          let kickY = 0;
          if (isFiringRecently) {
            const elapsedFire = Date.now() - (lastBlasterFireTimeRef.current || 0);
            const kickMag = Math.max(0, 1 - (elapsedFire / 160)) * 3.5;
            if (effectiveFacing === 'right') kickX = -kickMag;
            else if (effectiveFacing === 'left') kickX = kickMag;
            else if (effectiveFacing === 'down') kickY = -kickMag;
            else if (effectiveFacing === 'up') kickY = kickMag;
          }

          // Calibrated grip anchor points matching astronaut's glove coordinates
          let wX = 0;
          let wY = 0;
          let muzzleX = 0;
          let muzzleY = 0;

          if (effectiveFacing === 'right') {
            wX = 2.5 * scale + kickX;
            wY = -5.0 * scale + kickY + walkArmBobY;
            muzzleX = wX + 18.0 * scale;
            muzzleY = wY + 10.5 * scale;
          } else if (effectiveFacing === 'left') {
            wX = -26.5 * scale + kickX;
            wY = -5.0 * scale + kickY + walkArmBobY;
            muzzleX = wX + 6.0 * scale;
            muzzleY = wY + 10.5 * scale;
          } else if (effectiveFacing === 'down') {
            wX = 0.0 * scale + kickX;
            wY = -7.0 * scale + kickY + walkArmBobY;
            muzzleX = wX + 12.0 * scale;
            muzzleY = wY + 19.5 * scale;
          } else if (effectiveFacing === 'up') {
            wX = 6.5 * scale + kickX;
            wY = -18.0 * scale + kickY + (walkArmBobY * 0.5);
            muzzleX = wX + 12.0 * scale;
            muzzleY = wY + 4.5 * scale;
          }

          const drawWeaponSprite = () => {
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
              weaponSprite,
              weaponFrame * wCellSize,
              wRow * wCellSize,
              wCellSize,
              wCellSize,
              wX,
              wY,
              wDrawSize,
              wDrawSize
            );
            ctx.restore();
          };

          const drawMuzzleFlash = () => {
            // Muzzle Flash Star & Plasma Spark when firing
            if (isFiringRecently && !isMining) {
              ctx.save();
              ctx.translate(muzzleX, muzzleY);
              ctx.fillStyle = '#ffffff';
              ctx.shadowColor = '#ea580c';
              ctx.shadowBlur = 14;
              ctx.beginPath();
              ctx.arc(0, 0, 4, 0, Math.PI * 2);
              ctx.fill();

              ctx.strokeStyle = '#f59e0b';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(-7, 0); ctx.lineTo(7, 0);
              ctx.moveTo(0, -7); ctx.lineTo(0, 7);
              ctx.stroke();
              ctx.restore();
            }
          };

          // Z-Ordering Depth Sorting:
          // When facing UP, RIGHT, or LEFT: The character's body and near arm are in front,
          // so the weapon is held BEHIND (UNDER) the front arm -> natural 2.5D grip.
          // When facing DOWN: Astronaut faces the camera directly -> weapon is drawn in front (OVER).
          const isWeaponUnderBody = effectiveFacing === 'up' || effectiveFacing === 'right' || effectiveFacing === 'left';
          if (isWeaponUnderBody) {
            drawWeaponSprite();
            drawCharacterBody();
          } else {
            drawCharacterBody();
            drawWeaponSprite();
          }
          drawMuzzleFlash();
        };

        drawWeaponLayer();
      } else {
        // 1. Articulated Walking Boots (Procedural Fallback)
      const bootOffsetL = isPlayerActivelyMoving ? walkCycle * 4.5 : 0;
      const bootOffsetR = isPlayerActivelyMoving ? -walkCycle * 4.5 : 0;

      if (facing === 'left') {
        // Walking or facing left - boots rendered in profile pointing left
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-tileSize * 0.1 + bootOffsetR, tileSize * 0.18, tileSize * 0.18, tileSize * 0.13, [3, 2, 2, 4]);
        ctx.fill();
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(-tileSize * 0.1 + bootOffsetR, tileSize * 0.28, tileSize * 0.18, tileSize * 0.035);

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(-tileSize * 0.16 + bootOffsetL, tileSize * 0.21, tileSize * 0.2, tileSize * 0.13, [4, 2, 2, 4]);
        ctx.fill();
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(-tileSize * 0.16 + bootOffsetL, tileSize * 0.31, tileSize * 0.2, tileSize * 0.035);
      } else if (facing === 'right') {
        // Walking or facing right - boots rendered in profile pointing right
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-tileSize * 0.08 + bootOffsetL, tileSize * 0.18, tileSize * 0.18, tileSize * 0.13, [2, 3, 4, 2]);
        ctx.fill();
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(-tileSize * 0.08 + bootOffsetL, tileSize * 0.28, tileSize * 0.18, tileSize * 0.035);

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(-tileSize * 0.04 + bootOffsetR, tileSize * 0.21, tileSize * 0.2, tileSize * 0.13, [2, 4, 4, 2]);
        ctx.fill();
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(-tileSize * 0.04 + bootOffsetR, tileSize * 0.31, tileSize * 0.2, tileSize * 0.035);
      } else {
        // Facing down or up - boots side by side
        // Left Boot
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-tileSize * 0.16, tileSize * 0.18 + bootOffsetL, tileSize * 0.11, tileSize * 0.16, [4, 4, 3, 3]);
        ctx.fill();
        ctx.fillStyle = '#ea580c'; // Martian orange boot tread sole
        ctx.fillRect(-tileSize * 0.16, tileSize * 0.31 + bootOffsetL, tileSize * 0.11, tileSize * 0.035);

        // Right Boot
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(tileSize * 0.05, tileSize * 0.18 + bootOffsetR, tileSize * 0.11, tileSize * 0.16, [4, 4, 3, 3]);
        ctx.fill();
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(tileSize * 0.05, tileSize * 0.31 + bootOffsetR, tileSize * 0.11, tileSize * 0.035);
      }

      // 2. Life-Support Backpack (EVA PLSS unit)
      const backpackColor = isBackpackFull ? '#ef4444' : (isBackpackHeavy ? '#f59e0b' : '#f97316');
      if (facing === 'up' || facing === 'left' || facing === 'right') {
        const bpX = facing === 'left' ? tileSize * 0.05 : (facing === 'right' ? -tileSize * 0.27 : -tileSize * 0.2);
        const bpW = (facing === 'left' || facing === 'right') ? tileSize * 0.22 : tileSize * 0.4;
        const bpH = tileSize * 0.36;
        const bpY = -tileSize * 0.24;

        // Backpack base
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(bpX, bpY, bpW, bpH, 6);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Dual O2 Tanks
        if (facing === 'up') {
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.roundRect(bpX + 4, bpY + 4, 8, bpH - 8, 4);
          ctx.roundRect(bpX + bpW - 12, bpY + 4, 8, bpH - 8, 4);
          ctx.fill();
        }

        // Orange Reactor Power Cell / Cargo glow core
        ctx.fillStyle = backpackColor;
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(bpX + bpW * 0.25, bpY + 8, bpW * 0.5, bpH * 0.45, 3);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 3. Spacesuit Main Torso & Legs
      ctx.fillStyle = '#f8fafc'; // Pristine EVA White
      ctx.beginPath();
      ctx.roundRect(-tileSize * 0.2, -tileSize * 0.08, tileSize * 0.4, tileSize * 0.3, [8, 8, 4, 4]);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Commander Orange Leg Stripes (Dual bands on thighs)
      ctx.fillStyle = '#ea580c';
      if (facing === 'left') {
        ctx.fillRect(-tileSize * 0.12, tileSize * 0.12, tileSize * 0.14, tileSize * 0.025);
      } else if (facing === 'right') {
        ctx.fillRect(-tileSize * 0.02, tileSize * 0.12, tileSize * 0.14, tileSize * 0.025);
      } else {
        ctx.fillRect(-tileSize * 0.16, tileSize * 0.11, tileSize * 0.11, tileSize * 0.025);
        ctx.fillRect(tileSize * 0.05, tileSize * 0.11, tileSize * 0.11, tileSize * 0.025);
      }

      // Martian Orange Safety Shoulder Pads & Chest Stripes
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.roundRect(-tileSize * 0.22, -tileSize * 0.06, tileSize * 0.08, tileSize * 0.16, 3);
      ctx.roundRect(tileSize * 0.14, -tileSize * 0.06, tileSize * 0.08, tileSize * 0.16, 3);
      ctx.fill();

      // Commander Arm Safety Bands
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-tileSize * 0.22, tileSize * 0.02, tileSize * 0.08, tileSize * 0.025);
      ctx.fillRect(tileSize * 0.14, tileSize * 0.02, tileSize * 0.08, tileSize * 0.025);

      // Chest Utility Belt & Life Support Console (when facing down, left, right)
      if (facing !== 'up') {
        const consoleShiftX = facing === 'left' ? -tileSize * 0.03 : (facing === 'right' ? tileSize * 0.03 : 0);
        // Utility Belt
        ctx.fillStyle = '#334155';
        ctx.fillRect(-tileSize * 0.18 + consoleShiftX, tileSize * 0.13, tileSize * 0.36, tileSize * 0.05);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-tileSize * 0.04 + consoleShiftX, tileSize * 0.125, tileSize * 0.08, tileSize * 0.06);

        // Life Support Console
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(-tileSize * 0.1 + consoleShiftX, -tileSize * 0.02, tileSize * 0.2, tileSize * 0.1, 3);
        ctx.fill();

        // Commander Orange Insignia Crest
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(consoleShiftX, -tileSize * 0.045, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(consoleShiftX, -tileSize * 0.045, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // O2 & Vitals LEDs
        ctx.fillStyle = '#38bdf8'; // Blue O2 LED
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(-tileSize * 0.05 + consoleShiftX, tileSize * 0.03, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4ade80'; // Green Heart LED
        ctx.shadowColor = '#4ade80';
        ctx.beginPath();
        ctx.arc(tileSize * 0.05 + consoleShiftX, tileSize * 0.03, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 4. Commander Orange Plasma Blaster / Mining Laser (Dynamic 360-degree aiming)
      const gunBaseColor = '#0f172a';
      const gunEnergyColor = '#f97316';

      // Shoulder pivot center
      const shoulderX = facing === 'left' ? -tileSize * 0.05 : (facing === 'right' ? tileSize * 0.05 : 0);
      const shoulderY = tileSize * 0.05;

      ctx.save();
      ctx.translate(shoulderX, shoulderY);
      ctx.rotate(currentAim);
      if (Math.cos(currentAim) < 0) {
        ctx.scale(1, -1);
      }

      // White EVA suited arm
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(4, -5, 14, 10, 4);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Dark Glove
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(14, -4, 4, 8, 2);
      ctx.fill();

      // Gun chassis
      ctx.fillStyle = gunBaseColor;
      ctx.beginPath();
      ctx.roundRect(18, -5, 16, 10, 2);
      ctx.fill();

      // Orange glowing plasma energy coil
      ctx.fillStyle = gunEnergyColor;
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 8;
      ctx.fillRect(20, -2, 10, 4);
      ctx.shadowBlur = 0;

      // Chrome / Gold nozzle tip
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(34, -2.5, 4, 5);

      // Muzzle Flash star when firing recently
      if (isFiringRecently) {
        ctx.save();
        ctx.translate(38, 0);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-14, 0); ctx.lineTo(14, 0);
        ctx.moveTo(0, -14); ctx.lineTo(0, 14);
        ctx.moveTo(-8, -8); ctx.lineTo(8, 8);
        ctx.moveTo(-8, 8); ctx.lineTo(8, -8);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();

      // 5. Astronaut Helmet Dome
      const helmY = -tileSize * 0.18;
      const helmR = tileSize * 0.21;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, helmY, helmR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Commander Orange Central Crown Stripe on helmet
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, helmY, helmR - 1, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#ea580c';
      if (facing === 'left') {
        ctx.beginPath();
        ctx.arc(0, helmY, helmR - 1, -Math.PI * 0.9, -Math.PI * 0.4);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ea580c';
        ctx.stroke();
      } else if (facing === 'right') {
        ctx.beginPath();
        ctx.arc(0, helmY, helmR - 1, -Math.PI * 0.6, -Math.PI * 0.1);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ea580c';
        ctx.stroke();
      } else {
        // Vertical crown stripe
        ctx.fillRect(-3.5, helmY - helmR, 7, helmR * 2);
      }
      ctx.restore();

      // Helmet communications antenna on side
      const antennaOnRight = facing !== 'left';
      const antX = antennaOnRight ? helmR * 0.85 : -helmR * 0.85;
      const antTipX = antennaOnRight ? helmR * 0.95 : -helmR * 0.95;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(antX, helmY);
      ctx.lineTo(antTipX, helmY - 10);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(antTipX, helmY - 11, 2, 0, Math.PI * 2);
      ctx.fill();

      // Headlamp mount
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4, helmY - helmR - 2, 8, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-2, helmY - helmR - 1, 4, 2);

      // 6. Deep Metallic Golden Reflective Visor
      const isLookingUp = (facing === 'up' && !isFiringRecently) || (isFiringRecently && currentAim < -Math.PI * 0.35 && currentAim > -Math.PI * 0.65);
      if (!isLookingUp) {
        let visorShiftX = 0;
        let visorShiftY = 0;
        let visorW = helmR * 0.72;
        let visorH = helmR * 0.58;

        if (isFiringRecently) {
          visorShiftX = Math.cos(currentAim) * (helmR * 0.32);
          visorShiftY = Math.max(-2, Math.sin(currentAim) * (helmR * 0.22));
          visorW = helmR * (Math.abs(Math.sin(currentAim)) > 0.6 ? 0.76 : 0.64);
        } else {
          if (facing === 'right') {
            visorShiftX = helmR * 0.28;
            visorShiftY = 1;
            visorW = helmR * 0.62;
          } else if (facing === 'left') {
            visorShiftX = -helmR * 0.28;
            visorShiftY = 1;
            visorW = helmR * 0.62;
          } else {
            // facing === 'down'
            visorShiftX = 0;
            visorShiftY = 3;
            visorW = helmR * 0.76;
          }
        }

        const visorX = visorShiftX;
        const visorY = helmY + 3 + visorShiftY;

        const visorGrad = ctx.createLinearGradient(visorX - visorW, visorY - visorH, visorX + visorW, visorY + visorH);
        visorGrad.addColorStop(0, '#fef08a');
        visorGrad.addColorStop(0.3, '#f59e0b');
        visorGrad.addColorStop(0.7, '#d97706');
        visorGrad.addColorStop(1, '#78350f');

        ctx.fillStyle = visorGrad;
        ctx.beginPath();
        ctx.ellipse(visorX, visorY, visorW, visorH, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Curved Glass Specular Highlight (The Apollo Shine)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(visorX, visorY, visorW * 0.75, Math.PI * 1.08, Math.PI * 1.55);
        ctx.stroke();
      } else {
        // Back of Helmet Neck Ring
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, helmY, helmR * 0.7, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
      }
      } // End procedural fallback else

      ctx.restore(); // End astronaut transform

      // 5.1. Astronaut Thermal Warmth Shield (Soft amber ambient rim light when inside warmth perimeter)
      const currentInWarmth = isTileInThermalZone(
        grid,
        playerAnimPosRef.current.x + 0.5,
        playerAnimPosRef.current.y + 0.5,
        habPos,
        isColonyPowered
      );

      if (currentInWarmth) {
        ctx.save();
        const warmAuraPulse = Math.sin(time * 0.005) * 0.06 + 0.24;
        const suitWarmGrad = ctx.createRadialGradient(astronautPx, astronautPy, tileSize * 0.18, astronautPx, astronautPy, tileSize * 0.6);
        suitWarmGrad.addColorStop(0, `rgba(251, 146, 60, ${warmAuraPulse})`);
        suitWarmGrad.addColorStop(0.65, `rgba(251, 146, 60, ${warmAuraPulse * 0.35})`);
        suitWarmGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
        ctx.fillStyle = suitWarmGrad;
        ctx.beginPath();
        ctx.arc(astronautPx, astronautPy, tileSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Suit Flashlight beam projection
      if (isFlashlightOn) {
        ctx.save();
        let beamAngle = Math.PI / 2; // down
        if (facing === 'up') beamAngle = -Math.PI / 2;
        if (facing === 'left') beamAngle = Math.PI;
        if (facing === 'right') beamAngle = 0;

        const beamDist = 180;
        const spread = Math.PI * 0.38; // ~68° cone
        const beamGrad = ctx.createRadialGradient(astronautPx, astronautPy, 12, astronautPx, astronautPy, beamDist);
        beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        beamGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.18)');
        beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(astronautPx, astronautPy);
        ctx.arc(astronautPx, astronautPy, beamDist, beamAngle - spread / 2, beamAngle + spread / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      if (isMining) {
        ctx.save();
        const isIce = currentTile?.type === TILE_TYPES.ICE_NODE;
        const mainLaserColor = isIce ? '#38bdf8' : '#f59e0b';
        const coreLaserColor = '#ffffff';
        const glowColor = isIce ? 'rgba(56, 189, 248, 0.85)' : 'rgba(245, 158, 11, 0.85)';
        const sparkColor = isIce ? '#bae6fd' : '#fef08a';
        const impactRubbleColor = isIce ? '#0284c7' : '#7c2d12';

        // Emitter origin from astronaut hands/chest tool
        let emitterX = astronautPx;
        let emitterY = astronautPy + 6;
        if (facing === 'right') { emitterX = astronautPx + 10; emitterY = astronautPy + 6; }
        else if (facing === 'left') { emitterX = astronautPx - 10; emitterY = astronautPy + 6; }
        else if (facing === 'up') { emitterX = astronautPx + 4; emitterY = astronautPy - 6; }
        else { emitterX = astronautPx + (walkCycle > 0 ? 3 : -3); emitterY = astronautPy + 12; }

        // Impact target point on the ground (in facing direction)
        const reach = tileSize * 0.44;
        let impactX = astronautPx;
        let impactY = astronautPy + reach;
        if (facing === 'right') { impactX = astronautPx + reach; impactY = astronautPy + reach * 0.4; }
        else if (facing === 'left') { impactX = astronautPx - reach; impactY = astronautPy + reach * 0.4; }
        else if (facing === 'up') { impactX = astronautPx; impactY = astronautPy - reach * 0.7; }

        // High-frequency drill beam micro-jitter
        const beamJitterX = (Math.random() - 0.5) * 1.5;
        const beamJitterY = (Math.random() - 0.5) * 1.5;
        impactX += beamJitterX;
        impactY += beamJitterY;

        const beamDist = Math.hypot(impactX - emitterX, impactY - emitterY);
        const beamAngle = Math.atan2(impactY - emitterY, impactX - emitterX);

        // 1. Tool Emitter Flare / Muzzle Glow
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = mainLaserColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(emitterX, emitterY, 3.5 + Math.sin(time * 0.05) * 1, 0, Math.PI * 2);
        ctx.fill();

        // 2. Wide Outer Plasma Heat Envelope
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 7 + Math.sin(time * 0.04) * 2;
        ctx.shadowColor = mainLaserColor;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(emitterX, emitterY);
        ctx.lineTo(impactX, impactY);
        ctx.stroke();

        // 3. Inner White-Hot Thermal Laser Core
        ctx.strokeStyle = coreLaserColor;
        ctx.lineWidth = 2.5 + Math.sin(time * 0.08) * 0.8;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(emitterX, emitterY);
        ctx.lineTo(impactX, impactY);
        ctx.stroke();

        // 4. Helical Electric / Ion Arcs wrapping around the beam
        ctx.save();
        ctx.translate(emitterX, emitterY);
        ctx.rotate(beamAngle);
        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        const segments = 12;
        for (let s = 0; s <= segments; s++) {
          const segX = (beamDist / segments) * s;
          const arcWobble = Math.sin(time * 0.04 + s * 1.6) * (3.5 + Math.sin(time * 0.02) * 1.5);
          if (s === 0) ctx.moveTo(segX, 0);
          else ctx.lineTo(segX, arcWobble);
        }
        ctx.stroke();
        ctx.restore();

        // 5. Ground Contact Bore-Hole, Shockwaves & Fracturing
        ctx.fillStyle = impactRubbleColor;
        ctx.beginPath();
        ctx.ellipse(impactX, impactY + 2, 8, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Expanding concentric shockwave ring on the ground
        const ringPhase = (time * 0.008) % 1;
        const ringR = 4 + ringPhase * 16;
        ctx.strokeStyle = isIce ? `rgba(56, 189, 248, ${1 - ringPhase})` : `rgba(245, 158, 11, ${1 - ringPhase})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(impactX, impactY + 2, ringR, ringR * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Blinding contact focal starburst
        const starSize = 7 + Math.random() * 4;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = mainLaserColor;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(impactX, impactY, starSize * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(impactX - starSize * 1.6, impactY); ctx.lineTo(impactX + starSize * 1.6, impactY);
        ctx.moveTo(impactX, impactY - starSize * 1.2); ctx.lineTo(impactX, impactY + starSize * 1.2);
        ctx.moveTo(impactX - starSize, impactY - starSize * 0.7); ctx.lineTo(impactX + starSize, impactY + starSize * 0.7);
        ctx.moveTo(impactX - starSize, impactY + starSize * 0.7); ctx.lineTo(impactX + starSize, impactY - starSize * 0.7);
        ctx.stroke();

        // 6. Floating Sci-Fi Holographic Mining Progress Radial Indicator
        const prog = miningProgressRef.current || 0;
        if (prog > 0) {
          const reticleY = impactY - 20;
          // Outer dark ring badge
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.arc(impactX, reticleY, 13, 0, Math.PI * 2);
          ctx.fill();

          // Background track ring
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(impactX, reticleY, 10, 0, Math.PI * 2);
          ctx.stroke();

          // Active glowing progress arc
          ctx.strokeStyle = mainLaserColor;
          ctx.lineWidth = 3.2;
          ctx.shadowColor = mainLaserColor;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(impactX, reticleY, 10, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
          ctx.stroke();

          // % Progress number
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${Math.round(prog * 100)}%`, impactX, reticleY + 3);
        }

        ctx.restore();
      }

      // 5.4. Render Rescued Ares-I Crew NPCs at Colony Base Stations
      if (!activeCaveInfo && (rescuedCrewRef.current || []).length > 0) {
        const stations = getSurfaceCrewStations(
          grid,
          rescuedCrewRef.current,
          crewAssignmentsRef.current,
          habPos,
          vehiclePos
        );
        stations.forEach((st) => {
          const cCfg = CREW_MEMBERS[st.crewId];
          if (!cCfg) return;

          const cx = (st.x + 0.5) * tileSize;
          const cy = (st.y + 0.5) * tileSize;

          // Check if within camera viewport
          if (
            cx < cameraPosRef.current.x - tileSize * 2 ||
            cx > cameraPosRef.current.x + canvas.width + tileSize * 2 ||
            cy < cameraPosRef.current.y - tileSize * 2 ||
            cy > cameraPosRef.current.y + canvas.height + tileSize * 2
          ) {
            return;
          }

          const distToPlayer = Math.hypot(
            (playerAnimPosRef.current.x - st.x),
            (playerAnimPosRef.current.y - st.y)
          );
          const isPlayerNear = distToPlayer < 2.5;

          const assignedRole = st.assignedRole || cCfg.signatureRole;
          const roleData = ASSIGNABLE_ROLES[assignedRole];
          const isMaster = cCfg.signatureRole === assignedRole;
          const roleLabel = isRtl
            ? `${roleData?.name?.ar || cCfg.role.ar} ${isMaster ? '⭐' : ''}`
            : `${roleData?.name?.en || cCfg.role.en} ${isMaster ? '⭐' : ''}`;

          drawAstronautCharacter(ctx, {
            x: cx,
            y: cy,
            tileSize: tileSize,
            facing: st.facing || 'down',
            accentColor: cCfg.accentColor,
            accentSecondary: cCfg.accentSecondary,
            backpackColor: cCfg.backpackColor,
            visorColors: cCfg.visorColors,
            antennaColor: cCfg.antennaColor,
            breathingPhase: time * 0.003,
            inStasis: false,
            nameBadge: isRtl
              ? `${cCfg.name.ar} (${roleData?.icon || ''})`
              : `${cCfg.name.en} (${roleData?.icon || ''})`,
            roleBadge: roleLabel,
            showPrompt: isPlayerNear,
            promptLabel: isRtl ? `[E] محادثة مع ${cCfg.name.ar}` : `[E] Talk to ${cCfg.name.en}`,
            drawShadow: true,
          });
        });
      }

      // 5.5. Update and Render Pulse Blaster Projectiles (Plasma Bolts)
      for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const proj = projectilesRef.current[i];
        if (!proj.active) {
          projectilesRef.current.splice(i, 1);
          continue;
        }

        // Sub-stepping to ensure bullets never penetrate buildings or skip enemies at high velocity
        const frameDist = Math.hypot(proj.vx, proj.vy) * dt;
        const numSteps = Math.max(1, Math.ceil(frameDist / 0.25));
        const stepX = (proj.vx * dt) / numSteps;
        const stepY = (proj.vy * dt) / numSteps;
        const stepDist = frameDist / numSteps;

        let shouldRemove = false;

        for (let s = 0; s < numSteps; s++) {
          proj.x += stepX;
          proj.y += stepY;
          proj.distTraveled += stepDist;

          const currentFloorX = Math.floor(proj.x);
          const currentFloorY = Math.floor(proj.y);

          // Range limit or out of bounds
          if (proj.distTraveled >= proj.maxDist || !isWithinBounds(currentFloorX, currentFloorY)) {
            proj.active = false;
            shouldRemove = true;
            break;
          }

          // 1. Enemy collision check
          let hitEnemy = false;
          for (const enemy of currentEnemies) {
            if (enemy.health <= 0) continue;
            const d = Math.hypot(enemy.x + 0.5 - proj.x, enemy.y + 0.5 - proj.y);
            const hitRadius = enemy.creatureType === 'devil_leader' ? 1.25 : 0.65;
            if (d <= hitRadius) {
              hitEnemy = true;
              proj.active = false;
              enemy.hurtFlashTimer = 0.15;
              const finalBlasterDmg = Math.round((BLASTER_CONFIG?.damage || 25) * (blasterDamageMultiplierRef.current || 1.0));
              enemy.health = Math.max(0, enemy.health - finalBlasterDmg);
              sfxRef.current?.playAlienHit?.();
              addParticles(proj.x, proj.y, '#38bdf8', 10);
              addFloatingText(enemy.x + 0.5, enemy.y - 0.2, `-${finalBlasterDmg}`, '#38bdf8');

              if (enemy.health <= 0) {
                sfxRef.current?.playAlienDefeat?.();
                addParticles(enemy.x + 0.5, enemy.y + 0.5, '#ef4444', 16);
                addFloatingText(enemy.x + 0.5, enemy.y - 0.4, t.alienEliminated || 'Neutralized!', '#ef4444');

                // Tiered Sci-Fi Loot Drops according to Creature Hierarchy:
                const cType = enemy.creatureType || (enemy.isAlpha ? 'alpha' : 'burrower');
                if (cType === 'burrower') {
                  // 1. Small Burrower: Martian Bio-Samples (Organic specimen capsule)
                  lootDropsRef.current.push({
                    id: `loot-bio-${Date.now()}-${Math.random()}`,
                    x: enemy.x + 0.5,
                    y: enemy.y + 0.5,
                    type: 'BIO_SAMPLE',
                    amount: 1,
                    bobOffset: Math.random() * Math.PI,
                  });
                } else if (cType === 'crystal' || cType === 'ice') {
                  // 2. Crystal Walker & Ice Prowler: Cosmic Plasma Crystals
                  lootDropsRef.current.push({
                    id: `loot-plasma-${Date.now()}-${Math.random()}`,
                    x: enemy.x + 0.5,
                    y: enemy.y + 0.5,
                    type: 'PLASMA_CRYSTAL',
                    amount: 1,
                    bobOffset: Math.random() * Math.PI,
                  });
                } else if (cType === 'alpha') {
                  // 3. Alpha Burrower: Pure Xeno-Core + Cosmic Plasma Crystal
                  lootDropsRef.current.push({
                    id: `loot-core-${Date.now()}-${Math.random()}`,
                    x: enemy.x + 0.5,
                    y: enemy.y + 0.5,
                    type: 'XENO_CORE',
                    amount: 1,
                    bobOffset: Math.random() * Math.PI,
                  });
                  lootDropsRef.current.push({
                    id: `loot-plasma-${Date.now()}-${Math.random()}`,
                    x: enemy.x + 0.5 + (Math.random() - 0.5) * 0.35,
                    y: enemy.y + 0.5 + (Math.random() - 0.5) * 0.35,
                    type: 'PLASMA_CRYSTAL',
                    amount: 1,
                    bobOffset: Math.random() * Math.PI,
                  });
                } else if (cType === 'devil_leader') {
                  // 4. Apex Xenomorph Sovereign Boss: 4 Pure Xeno-Cores, 4 Plasma Crystals, 4 Bio-Samples!
                  for (let n = 0; n < 3; n++) {
                    lootDropsRef.current.push({
                      id: `loot-core-${Date.now()}-${n}-${Math.random()}`,
                      x: enemy.x + 0.5 + (Math.random() - 0.5) * 0.9,
                      y: enemy.y + 0.5 + (Math.random() - 0.5) * 0.9,
                      type: 'XENO_CORE',
                      amount: 2,
                      bobOffset: Math.random() * Math.PI,
                    });
                    lootDropsRef.current.push({
                      id: `loot-plasma-${Date.now()}-${n}-${Math.random()}`,
                      x: enemy.x + 0.5 + (Math.random() - 0.5) * 0.9,
                      y: enemy.y + 0.5 + (Math.random() - 0.5) * 0.9,
                      type: 'PLASMA_CRYSTAL',
                      amount: 2,
                      bobOffset: Math.random() * Math.PI,
                    });
                    lootDropsRef.current.push({
                      id: `loot-bio-${Date.now()}-${n}-${Math.random()}`,
                      x: enemy.x + 0.5 + (Math.random() - 0.5) * 0.9,
                      y: enemy.y + 0.5 + (Math.random() - 0.5) * 0.9,
                      type: 'BIO_SAMPLE',
                      amount: 2,
                      bobOffset: Math.random() * Math.PI,
                    });
                  }
                  addFloatingText(enemy.x + 0.5, enemy.y - 0.8, t.bossDefeated || 'SOVEREIGN DEFEATED! 🏆', '#fbbf24');
                } else if (cType === 'titan') {
                  // 5. Titan Boss: 2 Pure Xeno-Cores + 2 Cosmic Plasma Crystals
                  lootDropsRef.current.push({
                    id: `loot-core-${Date.now()}-${Math.random()}`,
                    x: enemy.x + 0.5,
                    y: enemy.y + 0.5,
                    type: 'XENO_CORE',
                    amount: 2,
                    bobOffset: Math.random() * Math.PI,
                  });
                  lootDropsRef.current.push({
                    id: `loot-plasma-${Date.now()}-${Math.random()}`,
                    x: enemy.x + 0.5 + 0.3,
                    y: enemy.y + 0.5 - 0.2,
                    type: 'PLASMA_CRYSTAL',
                    amount: 2,
                    bobOffset: Math.random() * Math.PI,
                  });
                } else {
                  // Fallback
                  lootDropsRef.current.push({
                    id: `loot-fallback-${Date.now()}-${Math.random()}`,
                    x: enemy.x + 0.5,
                    y: enemy.y + 0.5,
                    type: 'PLASMA_CRYSTAL',
                    amount: 1,
                    bobOffset: Math.random() * Math.PI,
                  });
                }

                onEnemyDefeatedRef.current?.(enemy.id, { x: enemy.x, y: enemy.y });
              }
              break;
            }
          }

          if (hitEnemy) {
            shouldRemove = true;
            break;
          }

          // 2. Solid Building & Obstacle Collision (Matches player walkability: Hab, Vehicle, Wall, Solar, Purifier, etc.)
          if (!isTileWalkable(grid, currentFloorX, currentFloorY)) {
            proj.active = false;
            shouldRemove = true;

            const solidTile = grid[currentFloorY]?.[currentFloorX];
            let impactColor = '#38bdf8';
            if (solidTile?.type === TILE_TYPES.HAB) impactColor = '#67e8f9';
            else if (solidTile?.type === TILE_TYPES.VEHICLE) impactColor = '#fb923c';
            else if (solidTile?.type === TILE_TYPES.SOLAR_ARRAY) impactColor = '#facc15';
            else if (solidTile?.type === TILE_TYPES.BIODOME) impactColor = '#4ade80';
            else if (solidTile?.type === TILE_TYPES.WALL) impactColor = '#94a3b8';
            else if (solidTile?.type === TILE_TYPES.ICE_PURIFIER) impactColor = '#38bdf8';
            else if (solidTile?.type === TILE_TYPES.THERMAL_HEATER) impactColor = '#f97316';
            else if (solidTile?.type === TILE_TYPES.BATTERY_BANK) impactColor = '#a3e635';

            // High-energy ricochet/impact sparks & tactile sound
            addParticles(proj.x, proj.y, impactColor, 8);
            addParticles(proj.x, proj.y, '#ffffff', 4);
            sfxRef.current?.playAlienHit?.();
            shakeDurationRef.current = Math.max(shakeDurationRef.current, 0.05);
            break;
          }
        }

        if (shouldRemove) {
          projectilesRef.current.splice(i, 1);
          continue;
        }

        // Draw projectile
        const prx = proj.x * tileSize;
        const pry = proj.y * tileSize;
        const angle = Math.atan2(proj.vy, proj.vx);

        ctx.save();
        ctx.translate(prx, pry);
        ctx.rotate(angle);

        // 1. Long high-energy ion trail
        const trailGrad = ctx.createLinearGradient(-32, 0, 8, 0);
        trailGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
        trailGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.45)');
        trailGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.95)');
        trailGrad.addColorStop(1, '#ffffff');

        ctx.fillStyle = trailGrad;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 18;
        ctx.fillRect(-32, -3.5, 40, 7);

        // 2. White-hot plasma core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(4, 0, 8, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Electric corona outer aura
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(3, 0, 11, 5, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // 5.6. Tactical Laser Aiming Reticle (Desktop Mouse Aim)
      if (mouseWorldPosRef.current && !isGameOver && !isPaused && !activeBuilding && !relocatingBuilding) {
        const mx = mouseWorldPosRef.current.x * tileSize;
        const my = mouseWorldPosRef.current.y * tileSize;

        ctx.save();
        // Subtle dotted laser targeting line from gun to cursor
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(astronautPx, astronautPy);
        ctx.lineTo(mx, my);
        ctx.stroke();

        // Holographic Reticle at cursor
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(mx, my, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(mx, my, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 6. Update and Render Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += (p.vx * dt * 25) / tileSize;
        p.y += (p.vy * dt * 25) / tileSize;
        p.life -= dt * 1.8;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        const ppx = p.x * tileSize;
        const ppy = p.y * tileSize;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(ppx, ppy, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 6.5. Update and Render Ambient Martian Dust Motes / Subterranean Spores
      // (isCave is already declared at start of render frame)
      const stormActive = Boolean(isDustStormActiveRef.current && !isCave);
      const windVx = isCave ? 0.35 : (stormActive ? 4.8 : 0.95);
      const windVy = isCave ? (activeCaveInfo.id === 'CAVE_TURBINE' ? -0.45 : 0.15) : (stormActive ? 0.75 : 0.32);
      const caveParticleColor = activeCaveInfo?.themeColor || null;

      dustMotesRef.current.forEach((mote) => {
        mote.wobblePhase += dt * (isCave ? 1.5 : (stormActive ? 3.5 : 2.2));
        mote.x += (windVx * mote.speed + Math.sin(mote.wobblePhase) * 0.15) * dt;
        mote.y += (windVy * mote.speed + Math.cos(mote.wobblePhase) * 0.08) * dt;
        const viewTilesW = (viewportW / tileSize) + 6;
        const viewTilesH = (viewportH / tileSize) + 6;
        const minVx = (camX / tileSize) - 3;
        const minVy = (camY / tileSize) - 3;
        if (mote.x > minVx + viewTilesW) mote.x = minVx;
        if (mote.x < minVx) mote.x = minVx + viewTilesW;
        if (mote.y > minVy + viewTilesH) mote.y = minVy;
        if (mote.y < minVy) mote.y = minVy + viewTilesH;

        const mpx = mote.x * tileSize;
        const mpy = mote.y * tileSize;

        // Viewport culling (only render visible motes)
        if (
          mpx >= camX - 25 &&
          mpx <= camX + viewportW + 25 &&
          mpy >= camY - 25 &&
          mpy <= camY + viewportH + 25
        ) {
          ctx.save();
          ctx.globalAlpha = mote.alpha * (isCave ? 0.85 : (stormActive ? 0.95 : (0.75 - 0.30 * currentNightAlpha)));
          ctx.fillStyle = caveParticleColor || mote.color;
          ctx.shadowColor = caveParticleColor || mote.color;
          ctx.shadowBlur = isCave ? 6 : (stormActive ? 5 : 4);
          ctx.beginPath();
          ctx.ellipse(mpx, mpy, mote.size * (stormActive ? 2.2 : 1.5), mote.size * 0.75, 0.32, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Phase 2: Atmospheric Dust Storm Wind Streaks & Amber Haze
      if (stormActive) {
        ctx.save();
        ctx.fillStyle = 'rgba(217, 119, 6, 0.16)';
        ctx.fillRect(camX, camY, viewportW, viewportH);

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.32)';
        ctx.lineWidth = 2.0;
        const stormTime = performance.now() * 0.003;
        for (let i = 0; i < 24; i++) {
          const streakY = camY + ((i * 36 + stormTime * 160) % viewportH);
          const streakX = camX + ((stormTime * 520 + i * 80) % (viewportW + 350)) - 175;
          ctx.beginPath();
          ctx.moveTo(streakX, streakY);
          ctx.lineTo(streakX + 115, streakY + 16);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 6.6. Map Perimeter Boundary Ridge & Warning Beacon Line (Surface only)
      if (!isCave) {
        ctx.save();
        ctx.strokeStyle = 'rgba(234, 88, 12, 0.35)';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 8]);
        ctx.strokeRect(0, 0, GRID_SIZE * tileSize, GRID_SIZE * tileSize);
        ctx.restore();
      }

      // 6.7. Exploration Shadow (Fog of War) Layer
      if (fogCanvasRef.current && currentExploredBuf) {
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.globalAlpha = 0.94;
        ctx.drawImage(
          fogCanvasRef.current,
          0,
          0,
          curGridW * tileSize,
          curGridH * tileSize
        );
        ctx.restore();
      }

      // 7. Update and Render Floating Texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy * dt;
        ft.life -= dt * 1.0;

        if (ft.life <= 0) {
          floatingTextsRef.current.splice(i, 1);
          continue;
        }

        const ftx = ft.x * tileSize;
        const fty = ft.y * tileSize;

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 12px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ftx, fty);
        ctx.restore();
      }

      ctx.restore(); // Restore camera translation

      // 8. Darkness & Dynamic Multi-Source Lighting Overlay (Screen Space)
      const effectiveDarknessAlpha = isCave ? 0.86 : currentNightAlpha;
      if (effectiveDarknessAlpha > 0.005) {
        if (!darknessCanvasRef.current) {
          darknessCanvasRef.current = document.createElement('canvas');
        }
        const darkCanvas = darknessCanvasRef.current;
        if (darkCanvas.width !== viewportW || darkCanvas.height !== viewportH) {
          darkCanvas.width = viewportW;
          darkCanvas.height = viewportH;
        }
        const darkCtx = darkCanvas.getContext('2d');

        // 8.1. Fill darkness layer with deep Martian night / subterranean tone
        darkCtx.globalCompositeOperation = 'source-over';
        darkCtx.clearRect(0, 0, viewportW, viewportH);
        darkCtx.fillStyle = isCave ? 'rgba(3, 5, 12, 0.95)' : 'rgba(4, 6, 14, 0.91)';
        darkCtx.fillRect(0, 0, viewportW, viewportH);

        // 8.2. Punch out illuminated light pools using 'destination-out'
        darkCtx.globalCompositeOperation = 'destination-out';

        if (isCave) {
          // A) Hoist Cable Extraction Lift at (2, 10)
          const hoistScreenX = (2 + 0.5) * tileSize - camX;
          const hoistScreenY = (10 + 0.5) * tileSize - camY;
          const hRadius = tileSize * 2.8;
          const hoistGrad = darkCtx.createRadialGradient(hoistScreenX, hoistScreenY, 15, hoistScreenX, hoistScreenY, hRadius);
          hoistGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
          hoistGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.7)');
          hoistGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          darkCtx.fillStyle = hoistGrad;
          darkCtx.beginPath();
          darkCtx.arc(hoistScreenX, hoistScreenY, hRadius, 0, Math.PI * 2);
          darkCtx.fill();

          // B) Subterranean Narrative Props & Radiant Nodes
          const caveCutStartY = Math.max(0, startY - 2);
          const caveCutEndY = Math.min(curGridH, endY + 2);
          const caveCutStartX = Math.max(0, startX - 2);
          const caveCutEndX = Math.min(curGridW, endX + 2);

          for (let cy = caveCutStartY; cy < caveCutEndY; cy++) {
            for (let cx = caveCutStartX; cx < caveCutEndX; cx++) {
              const cTile = grid[cy]?.[cx];
              if (!cTile) continue;

              const cScreenX = (cx + 0.5) * tileSize - camX;
              const cScreenY = (cy + 0.5) * tileSize - camY;

              if (cTile.type === TILE_TYPES.CAVE_TURBINE_CORE) {
                // The Stolen Turbine Core radiates massive warmth (4.2 tiles)
                const turbRadius = tileSize * 4.2;
                const turbGrad = darkCtx.createRadialGradient(cScreenX, cScreenY, 20, cScreenX, cScreenY, turbRadius);
                turbGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
                turbGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.85)');
                turbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                darkCtx.fillStyle = turbGrad;
                darkCtx.beginPath();
                darkCtx.arc(cScreenX, cScreenY, turbRadius, 0, Math.PI * 2);
                darkCtx.fill();
              } else if (cTile.type === TILE_TYPES.CAVE_PROP) {
                const propRadius = tileSize * 2.2;
                const propGrad = darkCtx.createRadialGradient(cScreenX, cScreenY, 15, cScreenX, cScreenY, propRadius);
                propGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
                propGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.45)');
                propGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                darkCtx.fillStyle = propGrad;
                darkCtx.beginPath();
                darkCtx.arc(cScreenX, cScreenY, propRadius, 0, Math.PI * 2);
                darkCtx.fill();
              }
            }
          }
        } else {
          // Surface lighting: Lander / Vehicle Base
          if (vehiclePos) {
            const vCenterX = (vehiclePos.x + 1.0) * tileSize;
            const vCenterY = (vehiclePos.y + 1.0) * tileSize;
            const vScreenX = vCenterX - camX;
            const vScreenY = vCenterY - camY;
            const vLightRadius = tileSize * (BASE_SAFE_RADIUS + 0.35);

            if (
              vScreenX >= -vLightRadius &&
              vScreenX <= viewportW + vLightRadius &&
              vScreenY >= -vLightRadius &&
              vScreenY <= viewportH + vLightRadius
            ) {
              const vCutoutGrad = darkCtx.createRadialGradient(
                vScreenX, vScreenY, tileSize * 0.7,
                vScreenX, vScreenY, vLightRadius
              );
              vCutoutGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
              vCutoutGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.92)');
              vCutoutGrad.addColorStop(0.82, 'rgba(0, 0, 0, 0.45)');
              vCutoutGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              darkCtx.fillStyle = vCutoutGrad;
              darkCtx.beginPath();
              darkCtx.arc(vScreenX, vScreenY, vLightRadius, 0, Math.PI * 2);
              darkCtx.fill();
            }
          }

          // Powered Thermal Heaters
          if (Array.isArray(grid)) {
            const hCutStartY = Math.max(0, startY - 12);
            const hCutEndY = Math.min(GRID_SIZE, endY + 12);
            const hCutStartX = Math.max(0, startX - 12);
            const hCutEndX = Math.min(GRID_SIZE, endX + 12);

            for (let gy = hCutStartY; gy < hCutEndY; gy++) {
              for (let gx = hCutStartX; gx < hCutEndX; gx++) {
                if (grid[gy]?.[gx]?.type === TILE_TYPES.THERMAL_HEATER && isColonyPowered) {
                  const hScreenX = (gx + 0.5) * tileSize - camX;
                  const hScreenY = (gy + 0.5) * tileSize - camY;
                  const heaterLevel = grid[gy][gx]?.level || 1;
                  const radiusTiles = heaterLevel === 3 ? 9.0 : heaterLevel === 2 ? 6.5 : HEATER_THERMAL_RADIUS;
                  const hRadius = tileSize * radiusTiles;
                  if (
                    hScreenX >= -hRadius &&
                    hScreenX <= viewportW + hRadius &&
                    hScreenY >= -hRadius &&
                    hScreenY <= viewportH + hRadius
                  ) {
                    const hCutoutGrad = darkCtx.createRadialGradient(
                      hScreenX, hScreenY, tileSize * 0.4,
                      hScreenX, hScreenY, hRadius
                    );
                    hCutoutGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
                    hCutoutGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
                    hCutoutGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    darkCtx.fillStyle = hCutoutGrad;
                    darkCtx.beginPath();
                    darkCtx.arc(hScreenX, hScreenY, hRadius, 0, Math.PI * 2);
                    darkCtx.fill();
                  }
                }
              }
            }
          }
        }

        // Astronaut Suit Flashlight / Visor Glow
        const playerScreenX = astronautPx - camX;
        const playerScreenY = astronautPy - camY;

        if (isFlashlightOn) {
          const lightRadius = isCave ? 300 : 240;
          const pCutoutGrad = darkCtx.createRadialGradient(
            playerScreenX, playerScreenY, 30,
            playerScreenX, playerScreenY, lightRadius
          );
          pCutoutGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
          pCutoutGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.78)');
          pCutoutGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          darkCtx.fillStyle = pCutoutGrad;
          darkCtx.beginPath();
          darkCtx.arc(playerScreenX, playerScreenY, lightRadius, 0, Math.PI * 2);
          darkCtx.fill();
        } else {
          const lightRadius = isCave ? 120 : 65;
          const pCutoutGrad = darkCtx.createRadialGradient(
            playerScreenX, playerScreenY, 12,
            playerScreenX, playerScreenY, lightRadius
          );
          pCutoutGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
          pCutoutGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.40)');
          pCutoutGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          darkCtx.fillStyle = pCutoutGrad;
          darkCtx.beginPath();
          darkCtx.arc(playerScreenX, playerScreenY, lightRadius, 0, Math.PI * 2);
          darkCtx.fill();
        }

        // Composite darkness overlay onto viewport
        ctx.save();
        ctx.globalAlpha = effectiveDarknessAlpha;
        ctx.drawImage(darkCanvas, 0, 0);

        // Biome Ambient Glow Tone (Atmospheric Subterranean Radiance)
        if (isCave && activeCaveInfo?.themeColor) {
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = 0.12;
          ctx.fillStyle = activeCaveInfo.themeColor;
          ctx.fillRect(0, 0, viewportW, viewportH);
          ctx.restore();
        }

        // Surface-only base warm glow
        if (!isCave && vehiclePos) {
          const vCenterX = (vehiclePos.x + 1.0) * tileSize;
          const vCenterY = (vehiclePos.y + 1.0) * tileSize;
          const vScreenX = vCenterX - camX;
          const vScreenY = vCenterY - camY;
          const vLightRadius = tileSize * (BASE_SAFE_RADIUS + 0.35);

          if (
            vScreenX >= -vLightRadius &&
            vScreenX <= viewportW + vLightRadius &&
            vScreenY >= -vLightRadius &&
            vScreenY <= viewportH + vLightRadius
          ) {
            const vWarmGrad = ctx.createRadialGradient(
              vScreenX, vScreenY, tileSize * 0.6,
              vScreenX, vScreenY, vLightRadius
            );
            vWarmGrad.addColorStop(0, `rgba(251, 146, 60, ${0.24 * currentNightAlpha})`);
            vWarmGrad.addColorStop(0.65, `rgba(251, 146, 60, ${0.08 * currentNightAlpha})`);
            vWarmGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
            ctx.fillStyle = vWarmGrad;
            ctx.beginPath();
            ctx.arc(vScreenX, vScreenY, vLightRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      }

      // 8.2. Atmospheric Martian Twilight / Sunset & Sunrise Amber Horizon Glow (Surface only)
      if (!isCave) {
        const twilightFactor = Math.sin(currentNightAlpha * Math.PI);
        if (twilightFactor > 0.02) {
          ctx.save();
          ctx.fillStyle = `rgba(180, 83, 9, ${0.12 * twilightFactor})`;
          ctx.fillRect(0, 0, viewportW, viewportH);
          ctx.restore();
        }
      }


      // 8.5. Hypothermia Frost Vignette (Screen Space)
      // Completely suppressed whenever inside an active warmth zone!
      if (bodyTemp < 35.0 && !currentInWarmth) {
        ctx.save();
        const isFreezing = bodyTemp < 32.0;
        const coldGrad = ctx.createRadialGradient(
          viewportW / 2,
          viewportH / 2,
          viewportW * 0.28,
          viewportW / 2,
          viewportH / 2,
          viewportW * 0.58
        );
        const pulseAlpha = isFreezing
          ? Math.sin(time * 0.007) * 0.18 + 0.42
          : 0.18;
        coldGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        coldGrad.addColorStop(1, `rgba(56, 189, 248, ${pulseAlpha})`);
        ctx.fillStyle = coldGrad;
        ctx.fillRect(0, 0, viewportW, viewportH);

        if (isFreezing) {
          ctx.strokeStyle = `rgba(186, 230, 253, ${pulseAlpha * 0.8})`;
          ctx.lineWidth = 3;
          ctx.strokeRect(6, 6, viewportW - 12, viewportH - 12);
        }
        ctx.restore();
      }

      // 9. Sanity Vignette (rendered in screen space)
      if (sanity < 30) {
        ctx.save();
        const vignetteGrad = ctx.createRadialGradient(
          viewportW / 2,
          viewportH / 2,
          viewportW * 0.25,
          viewportW / 2,
          viewportH / 2,
          viewportW * 0.55
        );
        const pulseAlpha = Math.sin(time * 0.005) * 0.15 + 0.35;
        vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignetteGrad.addColorStop(1, `rgba(88, 28, 135, ${pulseAlpha})`);
        ctx.fillStyle = vignetteGrad;
        ctx.fillRect(0, 0, viewportW, viewportH);
        ctx.restore();
      }

      // 10. Vital Emergencies Screen Space Vignettes & Alerts
      const curO2 = o2Ref.current ?? 100;
      const curThirst = thirstRef.current ?? 100;
      const curHunger = hungerRef.current ?? 100;
      const curHealth = healthRef.current ?? 100;

      const isSuffocating = curO2 <= 0;
      const isDehydrated = curThirst <= 0;
      const isStarving = curHunger <= 0;
      const isFreezingToDeath = bodyTemp < 32.0;
      const isTakingVitalDamage = isSuffocating || isDehydrated || isStarving || isFreezingToDeath;
      const isCriticalHealth = curHealth < 30;

      // 10.1. Suffocation Asphyxiation Tunnel Vision (Dark Constriction + Choking Gasp Pulse)
      if (curO2 < 20) {
        ctx.save();
        const gaspFrequency = isSuffocating ? 0.009 : 0.005;
        const gaspPulse = Math.sin(time * gaspFrequency) * 0.15 + (isSuffocating ? 0.62 : 0.28);
        const innerRadius = isSuffocating ? viewportW * 0.22 : viewportW * 0.32;
        const outerRadius = isSuffocating ? viewportW * 0.52 : viewportW * 0.62;

        const suffocationGrad = ctx.createRadialGradient(
          viewportW / 2, viewportH / 2, innerRadius,
          viewportW / 2, viewportH / 2, outerRadius
        );
        suffocationGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        suffocationGrad.addColorStop(0.65, `rgba(15, 23, 42, ${gaspPulse * 0.65})`);
        suffocationGrad.addColorStop(1, `rgba(2, 6, 23, ${gaspPulse * 0.96})`);
        ctx.fillStyle = suffocationGrad;
        ctx.fillRect(0, 0, viewportW, viewportH);

        if (isSuffocating) {
          const edgePulse = Math.sin(time * 0.012) * 0.3 + 0.5;
          ctx.strokeStyle = `rgba(56, 189, 248, ${edgePulse * 0.75})`;
          ctx.lineWidth = 4;
          ctx.strokeRect(4, 4, viewportW - 8, viewportH - 8);
        }
        ctx.restore();
      }

      // 10.2. Extreme Dehydration (Parched Amber Scorched Heat Vignette)
      if (curThirst < 20) {
        ctx.save();
        const thirstPulse = Math.sin(time * 0.006) * 0.12 + (isDehydrated ? 0.45 : 0.2);
        const thirstGrad = ctx.createRadialGradient(
          viewportW / 2, viewportH / 2, viewportW * 0.28,
          viewportW / 2, viewportH / 2, viewportW * 0.58
        );
        thirstGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        thirstGrad.addColorStop(0.7, `rgba(217, 119, 6, ${thirstPulse * 0.4})`);
        thirstGrad.addColorStop(1, `rgba(180, 83, 9, ${thirstPulse * 0.85})`);
        ctx.fillStyle = thirstGrad;
        ctx.fillRect(0, 0, viewportW, viewportH);

        if (isDehydrated) {
          const amberEdge = Math.sin(time * 0.008) * 0.25 + 0.5;
          ctx.strokeStyle = `rgba(245, 158, 11, ${amberEdge * 0.6})`;
          ctx.lineWidth = 3;
          ctx.strokeRect(5, 5, viewportW - 10, viewportH - 10);
        }
        ctx.restore();
      }

      // 10.3. Extreme Starvation (Dull Crimson Fatigue Spasm Vignette)
      if (curHunger < 20) {
        ctx.save();
        const hungerPulse = Math.sin(time * 0.005) * 0.1 + (isStarving ? 0.42 : 0.18);
        const hungerGrad = ctx.createRadialGradient(
          viewportW / 2, viewportH / 2, viewportW * 0.26,
          viewportW / 2, viewportH / 2, viewportW * 0.56
        );
        hungerGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        hungerGrad.addColorStop(0.7, `rgba(68, 20, 20, ${hungerPulse * 0.35})`);
        hungerGrad.addColorStop(1, `rgba(28, 10, 10, ${hungerPulse * 0.82})`);
        ctx.fillStyle = hungerGrad;
        ctx.fillRect(0, 0, viewportW, viewportH);

        if (isStarving) {
          const brownEdge = Math.sin(time * 0.007) * 0.25 + 0.45;
          ctx.strokeStyle = `rgba(220, 38, 38, ${brownEdge * 0.55})`;
          ctx.lineWidth = 3;
          ctx.strokeRect(5, 5, viewportW - 10, viewportH - 10);
        }
        ctx.restore();
      }

      // 10.4. Critical Health & Active Damage Heartbeat Blood Vignette
      if (isTakingVitalDamage || isCriticalHealth) {
        ctx.save();
        const heartbeatFreq = isCriticalHealth ? 0.012 : 0.008;
        const cycle = (time * heartbeatFreq) % (Math.PI * 2);
        const lubDub = Math.pow(Math.max(0, Math.sin(cycle)), 3); // realistic double-beat thump
        const bloodAlpha = (isCriticalHealth ? 0.32 : 0.18) + lubDub * 0.45;

        const bloodGrad = ctx.createRadialGradient(
          viewportW / 2, viewportH / 2, viewportW * 0.22,
          viewportW / 2, viewportH / 2, viewportW * 0.56
        );
        bloodGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        bloodGrad.addColorStop(0.6, `rgba(185, 28, 28, ${bloodAlpha * 0.45})`);
        bloodGrad.addColorStop(1, `rgba(153, 27, 27, ${bloodAlpha * 0.95})`);
        ctx.fillStyle = bloodGrad;
        ctx.fillRect(0, 0, viewportW, viewportH);

        // Pulsing red emergency frame border
        ctx.strokeStyle = `rgba(239, 68, 68, ${lubDub * 0.8 + 0.25})`;
        ctx.lineWidth = 4 + lubDub * 3;
        ctx.strokeRect(2, 2, viewportW - 4, viewportH - 4);
        ctx.restore();
      }

      // 10.5. Epic Boss Battle HUD Banner (Active when engaged with Apex Boss)
      const activeBoss = currentEnemies.find(e => (e.isBoss || e.creatureType === 'devil_leader') && e.health > 0);
      if (activeBoss) {
        const bossDist = Math.hypot(activeBoss.x - playerAnimPosRef.current.x, activeBoss.y - playerAnimPosRef.current.y);
        if (bossDist < 16.0 || isCave) {
          ctx.save();
          const bannerW = Math.min(520, viewportW - 40);
          const bannerH = 34;
          const bannerX = (viewportW - bannerW) / 2;
          const bannerY = 64; // just below the top telemetry bar

          // Sleek glassmorphism backdrop with deep crimson border
          ctx.fillStyle = 'rgba(15, 7, 7, 0.88)';
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 8);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Boss Title
          ctx.font = 'bold 12px "Orbitron", sans-serif';
          ctx.fillStyle = '#fed7aa';
          ctx.textAlign = 'center';
          const bossTitle = isRtl ? (activeBoss.nameAr || 'سيد الكائنات المريخية القديم') : (activeBoss.name || 'APEX XENOMORPH SOVEREIGN');
          ctx.fillText(`👑 ${bossTitle} 👑`, bannerX + bannerW / 2, bannerY + 14);

          // Health Bar Gauge
          const barPadX = 14;
          const gaugeW = bannerW - barPadX * 2;
          const gaugeH = 7;
          const gaugeX = bannerX + barPadX;
          const gaugeY = bannerY + 20;

          ctx.fillStyle = 'rgba(30, 10, 10, 0.9)';
          ctx.beginPath();
          ctx.roundRect(gaugeX, gaugeY, gaugeW, gaugeH, 3);
          ctx.fill();

          const bossHpPct = Math.max(0, Math.min(1, activeBoss.health / (activeBoss.maxHealth || 380)));
          const fillW = Math.max(0, gaugeW * bossHpPct);
          if (fillW > 0) {
            const hpGrad = ctx.createLinearGradient(gaugeX, 0, gaugeX + fillW, 0);
            hpGrad.addColorStop(0, '#ea580c');
            hpGrad.addColorStop(0.5, '#ef4444');
            hpGrad.addColorStop(1, '#f97316');
            ctx.fillStyle = hpGrad;
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.roundRect(gaugeX, gaugeY, fillW, gaugeH, 3);
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          // HP Numbers
          ctx.font = 'bold 9px "Orbitron", sans-serif';
          ctx.fillStyle = '#fecaca';
          ctx.textAlign = 'right';
          ctx.fillText(`${Math.ceil(activeBoss.health)} / ${activeBoss.maxHealth || 380} HP`, bannerX + bannerW - barPadX, bannerY + 14);

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    grid,
    keys,
    moveSpeed,
    activeBuilding,
    relocatingBuilding,
    hoverTile,
    materials,
    habPos,
    isMining,
    isBackpackFull,
    cropGrowth,
    sanity,
    bodyTemp,
    isDay,
    solProgress,
    isFlashlightOn,
    powerMetrics,
    batteryCharge,
    isPaused,
    isGameOver,
    setPlayerPos,
    onCameraUpdate,
  ]);

  // Handle Canvas Resizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const w = container.clientWidth;
      const h = container.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const tileSize = TILE_SIZE;
    const worldX = clientX + cameraPosRef.current.x;
    const worldY = clientY + cameraPosRef.current.y;

    mouseWorldPosRef.current = { x: worldX / tileSize, y: worldY / tileSize };

    const px = (playerAnimPosRef.current.x + 0.5) * tileSize;
    const py = (playerAnimPosRef.current.y + 0.5) * tileSize;
    aimAngleRef.current = Math.atan2(worldY - py, worldX - px);

    const gx = Math.floor(worldX / tileSize);
    const gy = Math.floor(worldY / tileSize);

    if (isWithinBounds(gx, gy)) {
      setHoverTile({ x: gx, y: gy });
    } else {
      setHoverTile(null);
    }
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const worldPixelX = clientX + cameraPosRef.current.x;
    const worldPixelY = clientY + cameraPosRef.current.y;
    const x = Math.floor(worldPixelX / TILE_SIZE);
    const y = Math.floor(worldPixelY / TILE_SIZE);

    if (!isWithinBounds(x, y)) {
      fireBlaster(worldPixelX / TILE_SIZE, worldPixelY / TILE_SIZE);
      return;
    }

    const clickedTile = grid[y]?.[x];
    const isColonyPowered = powerMetrics ? (powerMetrics.net >= 0 || batteryCharge > 0) : true;

    // Check click on surface crew NPC
    if (!activeCaveInfo && onTalkToCrew && (rescuedCrewRef.current || []).length > 0) {
      const stations = getSurfaceCrewStations(
        grid,
        rescuedCrewRef.current,
        crewAssignmentsRef.current,
        habPos,
        vehiclePos
      );
      const clickedCrew = stations.find((st) => Math.hypot(st.x - (worldPixelX / TILE_SIZE - 0.5), st.y - (worldPixelY / TILE_SIZE - 0.5)) <= 0.85);
      if (clickedCrew) {
        onTalkToCrew(clickedCrew.crewId);
        return;
      }
    }

    // Case 1: Relocating an existing building to a new tile
    if (relocatingBuilding) {
      const validation = canBuildAt(
        grid,
        x,
        y,
        playerPosRef.current,
        relocatingBuilding.type,
        habPos,
        isColonyPowered
      );

      if (!validation.valid) {
        const reasonText = t[validation.reasonKey] || validation.reason;
        if (onLogMessage) onLogMessage(reasonText, 'warning');
        return;
      }

      const oldX = relocatingBuilding.x;
      const oldY = relocatingBuilding.y;
      const bType = relocatingBuilding.type;
      const bLevel = relocatingBuilding.level || 1;
      const bStored = relocatingBuilding.storedAmount || 0;
      const bProgress = relocatingBuilding.productionProgress || 0;

      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));
        newGrid[oldY][oldX] = {
          ...newGrid[oldY][oldX],
          type: TILE_TYPES.EMPTY,
          level: 1,
          storedAmount: 0,
          productionProgress: 0,
        };
        newGrid[y][x] = {
          ...newGrid[y][x],
          type: bType,
          level: bLevel,
          storedAmount: bStored,
          productionProgress: bProgress,
        };
        return newGrid;
      });

      addParticles(x + 0.5, y + 0.5, '#38bdf8', 16);
      addFloatingText(x + 0.5, y + 0.2, t.relocatedSuccess || 'Structure Relocated!', '#38bdf8');
      if (onLogMessage) onLogMessage(t.relocatedSuccess, 'success');
      setRelocatingBuilding?.(null);
      return;
    }

    // Case 2: Constructing a new building from Toolbar
    if (activeBuilding) {
      const validation = canBuildAt(
        grid,
        x,
        y,
        playerPosRef.current,
        activeBuilding.type,
        habPos,
        isColonyPowered
      );

      if (!validation.valid) {
        const reasonText = t[validation.reasonKey] || validation.reason;
        if (onLogMessage) onLogMessage(reasonText, 'warning');
        return;
      }

      const reqReg = Math.round(activeBuilding.cost.regolith * (buildingCostMultiplierRef.current || 1.0));
      const reqIce = Math.round(activeBuilding.cost.ice * (buildingCostMultiplierRef.current || 1.0));
      const reqXeno = activeBuilding.cost.xenoCrystals || 0;

      if (activeBuilding.requiredItem && !(craftedUpgrades && craftedUpgrades.includes(activeBuilding.requiredItem))) {
        if (onLogMessage) {
          onLogMessage(
            lang === 'ar'
              ? '❌ يتطلب بناء هذه المنشأة استرداد القطعة الأثرية من الكهف أولاً!'
              : '❌ Construction requires recovering the cave relic first!',
            'danger'
          );
        }
        return;
      }

      if (
        materials.regolith < reqReg ||
        materials.ice < reqIce ||
        (materials.xenoCrystals || 0) < reqXeno
      ) {
        if (onLogMessage) onLogMessage(t.insufficientFunds, 'danger');
        return;
      }

      setMaterials((prev) => ({
        regolith: prev.regolith - reqReg,
        ice: prev.ice - reqIce,
        xenoCrystals: Math.max(0, (prev.xenoCrystals || 0) - reqXeno),
      }));

      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));
        newGrid[y][x] = {
          ...newGrid[y][x],
          type: activeBuilding.type,
          level: 1,
          storedAmount: 0,
          productionProgress: 0,
        };
        return newGrid;
      });

      addParticles(x + 0.5, y + 0.5, activeBuilding.color, 16);
      addFloatingText(x + 0.5, y + 0.2, `${t.builtSuccess} ${activeBuilding.name[lang] || activeBuilding.name.en}!`, '#4ade80');
      if (onLogMessage) {
        onLogMessage(`${t.builtSuccess} ${activeBuilding.name[lang] || activeBuilding.name.en} [${x}, ${y}].`, 'success');
      }

      setActiveBuilding(null);
      return;
    }

    // Case 3: Clicking on an existing building in the world
    let targetTile = clickedTile;
    let targetX = x;
    let targetY = y;

    // If clicked slightly above into the bobbing bubble of the tile below
    if (
      (!targetTile || targetTile.type === TILE_TYPES.EMPTY) &&
      grid[y + 1]?.[x]?.storedAmount > 0
    ) {
      targetTile = grid[y + 1][x];
      targetX = x;
      targetY = y + 1;
    }

    if (
      targetTile &&
      targetTile.type !== TILE_TYPES.EMPTY &&
      targetTile.type !== TILE_TYPES.HAB &&
      targetTile.type !== TILE_TYPES.VEHICLE &&
      targetTile.type !== TILE_TYPES.REGOLITH_NODE &&
      targetTile.type !== TILE_TYPES.ICE_NODE &&
      targetTile.type !== TILE_TYPES.CAVE_WALL &&
      targetTile.type !== TILE_TYPES.CAVE_FLOOR
    ) {
      if (targetTile.type === TILE_TYPES.CAVE_EXIT) {
        onExitCave?.();
        return;
      }
      if (targetTile.type === TILE_TYPES.CAVE_PROP || targetTile.type === TILE_TYPES.CAVE_TURBINE_CORE) {
        onInspectCaveProp?.(targetTile);
        return;
      }
      // Direct click collection if building has stored resources or ripe biodome! (Biodomes and Ice Melters only)
      const isCollectibleBuilding = targetTile.type === TILE_TYPES.BIODOME || targetTile.type === TILE_TYPES.ICE_PURIFIER;
      const isRipeBioClick = targetTile.type === TILE_TYPES.BIODOME && (cropGrowth >= 100 || (targetTile.storedAmount && targetTile.storedAmount > 0));
      if (isCollectibleBuilding && ((targetTile.storedAmount && targetTile.storedAmount > 0) || isRipeBioClick)) {
        const harvestAmount = targetTile.storedAmount > 0 ? targetTile.storedAmount : 3;
        if (targetTile.storedAmount > 0) {
          onCollectBuildingOutput?.(targetX, targetY);
        } else {
          onHarvestCrops?.();
        }
        let floatColor = '#facc15';
        let floatText = `+${harvestAmount} ${t.food || 'Food'}!`;
        if (targetTile.type === TILE_TYPES.ICE_PURIFIER) {
          floatColor = '#38bdf8';
          floatText = `+${targetTile.storedAmount} ${t.water || 'Water'}!`;
        }
        addParticles(targetX + 0.5, targetY + 0.5, floatColor, 12);
        addFloatingText(targetX + 0.5, targetY - 0.2, floatText, floatColor);
      } else {
        // Inspect & upgrade modal
        onInspectBuilding?.({ ...targetTile, x: targetX, y: targetY });
      }
      return;
    }

    // Case 3.5: Direct click on Rover or Hab Central Hub opens Cargo Depot
    if (targetTile && (targetTile.type === TILE_TYPES.VEHICLE || targetTile.type === TILE_TYPES.HAB)) {
      onOpenCargoModal?.();
      return;
    }

    // Case 4: Fire Suit Pulse Blaster toward clicked location
    fireBlaster(worldPixelX / TILE_SIZE, worldPixelY / TILE_SIZE);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (activeBuilding || relocatingBuilding) {
      if (activeBuilding) setActiveBuilding?.(null);
      if (relocatingBuilding) setRelocatingBuilding?.(null);
      sfx?.playBeep(420, 0.05);
      if (onLogMessage) {
        onLogMessage(t.dropItemSuccess || (isRtl ? '✋ تم إفلات العنصر وإلغاء العملية.' : '✋ Item dropped, action cancelled.'), 'info');
      }
    }
  };

  return (
    <div
      ref={containerRef}
      dir={t.dir}
      className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden ${isRtl ? 'font-cairo' : 'font-sans'}`}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverTile(null)}
        onClick={handleCanvasClick}
        onContextMenu={handleContextMenu}
        className="cursor-crosshair block w-full h-full"
      />

      {/* Desktop Pulse Blaster Weapon HUD Indicator */}
      <div className="hidden lg:flex absolute bottom-4 left-4 z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-950/85 border border-cyan-500/40 text-cyan-300 text-xs font-mono backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.25)]">
          <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse fill-cyan-400" />
          <span>{isRtl ? 'سلاح البدلة النبضي: [مسافة Space / انقر بالماوس]' : 'Pulse Blaster: [Space / Mouse Click]'}</span>
        </div>
      </div>

      {/* Subterranean Depth Visor Banner when exploring inside a Cave */}
      {activeCaveInfo && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-stone-950/95 border border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.35)] backdrop-blur-md text-xs font-mono">
          <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: activeCaveInfo.themeColor || '#c084fc' }} />
          <span className="font-bold text-white tracking-wider">
            {isRtl ? (activeCaveInfo.title?.ar || 'الكهف الباطني') : (activeCaveInfo.title?.en || 'Subterranean Biome')}
          </span>
          <span className="text-stone-500">|</span>
          <span className="text-cyan-300">DEPTH: {activeCaveInfo.depth || '-150m'}</span>
          <span className="text-stone-500">|</span>
          <span className={activeCaveInfo.ambientTemp > 0 ? 'text-amber-400 font-bold' : 'text-sky-300 font-bold'}>
            {activeCaveInfo.ambientTemp > 0 ? `+${activeCaveInfo.ambientTemp}°C` : `${activeCaveInfo.ambientTemp}°C`}
          </span>
          {onExitCave && (
            <button
              onClick={onExitCave}
              className="ml-2 px-3 py-0.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shadow transition active:scale-95 cursor-pointer"
            >
              {isRtl ? 'صعود للسطح ⬆️' : 'Ascend ⬆️'}
            </button>
          )}
        </div>
      )}

      {/* Active Building or Relocate Held Item Banner with Drop/Cancel Action */}
      {(activeBuilding || relocatingBuilding) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto max-w-[94vw]">
          <div className="flex items-center gap-2.5 sm:gap-3.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-stone-950/95 border-2 border-orange-500/80 text-orange-200 text-xs font-mono shadow-[0_0_30px_rgba(249,115,22,0.45)] backdrop-blur-md animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping shrink-0" />
            {activeBuilding ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-white whitespace-nowrap">
                  {isRtl ? 'وضع البناء:' : 'Constructing:'} {activeBuilding.name?.[lang] || activeBuilding.name?.en}
                </span>
                <span className="hidden md:inline text-stone-400 text-[11px]">
                  ({isRtl ? 'انقر على الأرض للتشييد' : 'Click terrain to place'})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Move className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="font-bold text-sky-200 whitespace-nowrap">
                  {isRtl ? 'نقل المنشأة:' : 'Relocating:'} {BUILDINGS[relocatingBuilding.type]?.name?.[lang] || relocatingBuilding.type}
                </span>
                <span className="hidden md:inline text-stone-400 text-[11px]">
                  ({isRtl ? 'انقر على المربع الجديد' : 'Click new tile'})
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (activeBuilding) setActiveBuilding(null);
                if (relocatingBuilding) setRelocatingBuilding(null);
                sfx?.playBeep(420, 0.05);
                if (onLogMessage) {
                  onLogMessage(t.dropItemSuccess || (isRtl ? '✋ تم إفلات العنصر وإلغاء العملية.' : '✋ Item dropped, action cancelled.'), 'info');
                }
              }}
              className="ml-1 sm:ml-2 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 border border-rose-400 text-white font-bold text-xs shadow-md shadow-rose-950/50 cursor-pointer transition active:scale-95 whitespace-nowrap"
              title={isRtl ? 'إفلات العنصر [Esc / كليك يمين]' : 'Drop Item [Esc / Right Click]'}
            >
              <X className="w-3.5 h-3.5" />
              <span>{isRtl ? 'إفلات العنصر [Esc]' : 'Drop Item [Esc]'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Vital Emergency Critical Visor Alert Banner */}
      {(o2 <= 0 || thirst <= 0 || hunger <= 0 || (health < 30 && health > 0)) && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-auto max-w-[94vw] sm:max-w-md w-full px-2">
          <div className="flex flex-col items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-stone-950/95 border-2 border-red-500/80 text-white shadow-[0_0_30px_rgba(239,68,68,0.55)] backdrop-blur-xl animate-pulse">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-xs sm:text-sm font-mono tracking-wide text-center">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
              <span>
                {o2 <= 0
                  ? (t.vitalWarningSuffocation || 'CRITICAL: SUFFOCATION! Suit Oxygen Depleted [-HP]!')
                  : thirst <= 0
                  ? (t.vitalWarningDehydration || 'CRITICAL: DEHYDRATION! Severe Thirst [-HP]!')
                  : hunger <= 0
                  ? (t.vitalWarningStarvation || 'CRITICAL: STARVATION! Caloric Depletion [-HP]!')
                  : (t.vitalWarningCriticalHp || 'WARNING: Vital signs failing! Health rapidly dropping!')}
              </span>
            </div>
            <div className="flex items-center justify-between w-full text-[11px] text-stone-300 font-mono pt-1 border-t border-red-500/30">
              <span className="text-red-400 font-bold animate-pulse">
                {o2 <= 0 ? '[-2.5 HP/s]' : thirst <= 0 ? '[-0.6 HP/s]' : hunger <= 0 ? '[-0.4 HP/s]' : '[-HP]'}
              </span>
              <div className="flex items-center gap-2">
                {o2 <= 0 && (
                  <span className="text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-500/40 text-[10px]">
                    {t.vitalActionReturnBase || 'عُد للمركبة فوراً'}
                  </span>
                )}
                {thirst <= 0 && onDrinkWater && (
                  <button
                    onClick={onDrinkWater}
                    className="cursor-pointer px-2.5 py-0.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold transition-transform active:scale-95 shadow text-[10px]"
                  >
                    💧 {t.vitalActionDrink || 'اشرب ماء [2]'}
                  </button>
                )}
                {hunger <= 0 && onEatFood && (
                  <button
                    onClick={onEatFood}
                    className="cursor-pointer px-2.5 py-0.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-bold transition-transform active:scale-95 shadow text-[10px]"
                  >
                    🍞 {t.vitalActionEat || 'تناول طعام [1]'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Mining Prompt */}
      {isStandingOnResource && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-30">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-hud text-xs font-mono animate-bounce ${
            isBackpackFull
              ? 'bg-red-950/90 border-red-500 text-red-300'
              : 'bg-stone-900/90 border-orange-500/50 text-amber-300'
          }`}>
            {isBackpackFull ? (
              <>
                <Briefcase className="w-3.5 h-3.5 text-red-400" />
                <span>{t.backpackFull}</span>
              </>
            ) : (
              <>
                <Pickaxe className="w-3.5 h-3.5 text-orange-400" />
                <span>
                  {t.holdSpaceToMine} ({currentTile.type === TILE_TYPES.ICE_NODE ? t.ice : t.regolith})
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Desktop Interaction Prompt Tooltip [E] & Quick Power [Q] */}
      <div className="hidden lg:flex absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto items-center gap-2">
        {nearCaveExit ? (
          <button
            onClick={onExitCave}
            className="btn-hud flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 border border-amber-400 text-white text-xs font-mono font-bold shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer animate-pulse active:scale-95"
          >
            <span>{isRtl ? 'الصعود إلى سطح المريخ [E]' : 'Ascend to Surface [E]'}</span>
          </button>
        ) : nearCaveProp ? (
          <button
            onClick={() => onInspectCaveProp?.(nearCaveProp.tile)}
            className="btn-hud flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-700 to-indigo-700 border border-purple-400 text-white text-xs font-mono font-bold shadow-[0_0_20px_rgba(168,85,247,0.5)] cursor-pointer animate-pulse active:scale-95"
          >
            <span>
              {nearCaveProp.tile.type === TILE_TYPES.CAVE_TURBINE_CORE
                ? (isRtl ? '🔥 استرداد قلب التوربين [E]' : '🔥 Salvage Turbine Core [E]')
                : (nearCaveProp.tile.propData?.recoveryKey?.startsWith('crew_') || nearCaveProp.tile.propData?.isCrewNPC)
                ? (isRtl ? `👥 محادثة مع ${nearCaveProp.tile.propData?.nameAr || 'رائد الفضاء'} [E]` : `👥 Talk to ${nearCaveProp.tile.propData?.name || 'Astronaut'} [E]`)
                : nearCaveProp.tile.propData?.recoveryKey === 'ares_energy_emitter'
                ? (isRtl ? '⚡ استرداد قاذف الطاقة التجريبي [E]' : '⚡ Equip Energy Emitter [E]')
                : (isRtl ? 'فحص واسترداد الأثر [E]' : 'Examine / Salvage Relic [E]')}
            </span>
          </button>
        ) : primaryAction ? (
          <button
            onClick={() => primaryAction.onClick?.()}
            className="btn-hud flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 border border-amber-400 text-white text-xs font-mono font-bold shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer animate-pulse active:scale-95"
          >
            <span>[E] {primaryAction.label} {primaryAction.sublabel ? `(${primaryAction.sublabel})` : ''}</span>
          </button>
        ) : nearCollectibleBuilding ? (
          <button
            onClick={() => onCollectBuildingOutput?.(nearCollectibleBuilding.x, nearCollectibleBuilding.y)}
            className="btn-hud flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 border border-amber-400 text-white text-xs font-mono font-bold shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer animate-pulse active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>{isRtl ? `جمع المحصول (${nearCollectibleBuilding.tile.storedAmount}) [E]` : `Collect Output (${nearCollectibleBuilding.tile.storedAmount}) [E]`}</span>
          </button>
        ) : nearInspectableBuilding ? (
          (() => {
            const isCave = nearInspectableBuilding.tile?.isCave || nearInspectableBuilding.tile?.type?.startsWith('CAVE_');
            const caveName = isRtl
              ? (nearInspectableBuilding.tile?.caveData?.nameAr || 'الكهف الباطني')
              : (nearInspectableBuilding.tile?.caveData?.name || 'Subterranean Biome');
            const bType = nearInspectableBuilding.tile?.type;
            const bName = BUILDINGS[bType]?.name?.[isRtl ? 'ar' : 'en'] || (isRtl ? 'المنشأة' : 'Structure');
            return (
              <button
                onClick={() => onInspectBuilding?.({ ...nearInspectableBuilding.tile, x: nearInspectableBuilding.x, y: nearInspectableBuilding.y })}
                className={`btn-hud flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono font-bold shadow-hud cursor-pointer transition-all active:scale-95 ${
                  isCave
                    ? 'bg-purple-950/90 border-purple-400 hover:border-purple-300 text-purple-200 hover:text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-pulse'
                    : 'bg-stone-900/95 border-stone-700 hover:border-orange-500 text-stone-200 hover:text-white'
                }`}
              >
                <span>
                  {isCave
                    ? (isRtl ? `استكشاف ${caveName} [E]` : `Explore ${caveName} [E]`)
                    : (isRtl ? `فحص وتطوير ${bName} (Lv.${nearInspectableBuilding.tile.level || 1}) [E]` : `Inspect & Upgrade ${bName} (Lv.${nearInspectableBuilding.tile.level || 1}) [E]`)}
                </span>
              </button>
            );
          })()
        ) : nearRipeBiodome ? (
          <button
            onClick={onHarvestCrops}
            className="btn-hud flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-200 text-xs font-mono font-bold shadow-hud cursor-pointer animate-pulse"
          >
            <Flower2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.harvestPrompt}</span>
          </button>
        ) : nearIcePurifier ? (
          <button
            onClick={onPurifyWater}
            className="btn-hud flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-950/90 border border-sky-400 text-sky-200 text-xs font-mono font-bold shadow-hud cursor-pointer animate-pulse"
          >
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            <span>{t.purifyPrompt}</span>
          </button>
        ) : nearCommsDish ? (
          <button
            onClick={onCallEarth}
            className="btn-hud flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/90 border border-purple-400 text-purple-200 text-xs font-mono font-bold shadow-hud cursor-pointer animate-pulse"
          >
            <PhoneCall className="w-3.5 h-3.5 text-purple-400" />
            <span>{t.callDishPrompt}</span>
          </button>
        ) : isNearVehicle ? (
          <button
            onClick={onDepositCargo}
            className="btn-hud flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-950/90 border border-orange-400 text-orange-200 text-xs font-mono font-bold shadow-hud cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-orange-400" />
            <span>{t.depositPrompt}</span>
          </button>
        ) : null}

        {/* Drop / Cancel Held Item Button in Bottom HUD */}
        {(activeBuilding || relocatingBuilding) && (
          <button
            type="button"
            onClick={() => {
              if (activeBuilding) setActiveBuilding(null);
              if (relocatingBuilding) setRelocatingBuilding(null);
              sfx?.playBeep(420, 0.05);
              if (onLogMessage) {
                onLogMessage(t.dropItemSuccess || (isRtl ? '✋ تم إفلات العنصر وإلغاء العملية.' : '✋ Item dropped, action cancelled.'), 'info');
              }
            }}
            className="btn-hud flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-800 to-red-700 hover:from-rose-700 hover:to-red-600 border border-rose-400 text-white text-xs font-mono font-bold shadow-[0_0_15px_rgba(244,63,94,0.45)] cursor-pointer transition-all active:scale-95 animate-pulse"
            title={isRtl ? 'إفلات العنصر وإلغاء العملية [Esc / كليك يمين]' : 'Drop Item / Cancel [Esc / Right Click]'}
          >
            <X className="w-3.5 h-3.5 text-rose-200" />
            <span>{isRtl ? 'إفلات العنصر [Esc]' : 'Drop Item [Esc]'}</span>
          </button>
        )}

        {/* Secondary Action [R] Button */}
        {secondaryAction && (
          <button
            type="button"
            onClick={() => {
              if (secondaryAction.onClick) secondaryAction.onClick();
              else if (isNearVehicle) onOpenCargoModal?.();
            }}
            className="btn-hud flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-sky-600/90 to-cyan-600/90 border border-sky-400/80 text-white text-xs font-mono font-bold shadow-[0_0_15px_rgba(56,189,248,0.4)] cursor-pointer hover:border-sky-300 transition-all active:scale-95 animate-pulse"
            title={`${secondaryAction.label} [R]`}
          >
            <span>[R] {secondaryAction.label} {secondaryAction.sublabel ? `(${secondaryAction.sublabel})` : ''}</span>
          </button>
        )}

        {/* Quick Power Toggle [Q] Button - STRICTLY for toggleable electrical consumer buildings */}
        {(() => {
          const bTarget = (nearInspectableBuilding || nearCollectibleBuilding);
          if (!bTarget?.tile) return null;
          if (bTarget.tile.isCave || bTarget.tile.type?.startsWith('CAVE_')) return null;
          if (!isToggleablePowerBuilding(bTarget.tile.type)) return null;

          const isPaused = bTarget.tile.disabled === true || bTarget.tile.powerMode === 'OFF';
          return (
            <button
              type="button"
              onClick={() => onToggleBuildingPower?.({ ...bTarget.tile, x: bTarget.x, y: bTarget.y })}
              className={`btn-hud flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-bold shadow-hud cursor-pointer transition-all active:scale-95 ${
                isPaused
                  ? 'bg-stone-900/95 border-rose-500/70 text-rose-300 hover:border-rose-400'
                  : 'bg-stone-900/95 border-emerald-500/70 text-emerald-300 hover:border-emerald-400'
              }`}
              title={t.quickPowerToggle || 'Toggle Power [Q]'}
            >
              <Power className="w-3.5 h-3.5" />
              <span>
                {isPaused ? '⏸' : '⚡'} [Q] {isRtl ? (isPaused ? 'تشغيل' : 'إيقاف') : (isPaused ? 'Turn On' : 'Turn Off')}
              </span>
            </button>
          );
        })()}
      </div>
    </div>
  );
};
