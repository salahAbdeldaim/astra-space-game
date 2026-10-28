import { GRID_SIZE, TILE_TYPES, HEATER_THERMAL_RADIUS, COMMS_SIGNAL_RADIUS, BASE_SAFE_RADIUS } from '../types/gameTypes';
export { HEATER_THERMAL_RADIUS, COMMS_SIGNAL_RADIUS, BASE_SAFE_RADIUS };

/**
 * Checks if grid coordinates are within the boundaries.
 */
export const isWithinBounds = (x, y, gridOrSize = GRID_SIZE) => {
  if (Array.isArray(gridOrSize)) {
    const h = gridOrSize.length;
    const w = gridOrSize[0]?.length || 0;
    return x >= 0 && x < w && y >= 0 && y < h;
  }
  const size = typeof gridOrSize === 'number' ? gridOrSize : GRID_SIZE;
  return x >= 0 && x < size && y >= 0 && y < size;
};

/**
 * Calculates Euclidean distance between two points.
 */
export const getDistance = (p1, p2) => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculates Manhattan distance between two points.
 */
export const getManhattanDistance = (p1, p2) => {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
};

/**
 * Generates initial 100x100 (10,000 blocks) Mars terrain with central Hab, Rover, and distance-scaled resources.
 * Resources near the base are fewer and smaller, while distant frontiers hold massive, rich motherlodes.
 */
export const generateInitialGrid = () => {
  const grid = [];
  // The 4-block Heavy Exploration Rover & Lander is the Primary Expedition Base at map center
  const vehicleX = Math.floor(GRID_SIZE / 2) - 1; // 49 on 100x100 (spans x: 49, 50)
  const vehicleY = Math.floor(GRID_SIZE / 2) - 1; // 49 on 100x100 (spans y: 49, 50)
  const habX = vehicleX + 1; // 50 (Base center)
  const habY = vehicleY + 1; // 50

  // Safe radius around the Lander Base (no hazards or harsh craters spawn within safe perimeter)
  const isNearSafeZone = (x, y) => {
    return Math.abs(x - habX) <= 3.6 && Math.abs(y - habY) <= 3.6;
  };

  // Initialize empty 100x100 grid with rich Martian geological variations
  for (let y = 0; y < GRID_SIZE; y++) {
    const row = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const isSafe = isNearSafeZone(x, y);
      const elevation = (Math.sin(x * 0.18) + Math.cos(y * 0.18)) * 0.5 + 0.5;

      // Deterministic geological noise for pebbles and surface cracks
      const hasCrater = !isSafe && Math.random() < 0.055;
      const hasFissure = !isSafe && !hasCrater && Math.random() < 0.045;
      const hasVein = !isSafe && !hasCrater && !hasFissure && Math.random() < 0.038;
      const pebbleCount = !isSafe && !hasCrater && Math.random() < 0.22 ? Math.floor(1 + Math.random() * 3) : 0;

      const pebbles = [];
      for (let p = 0; p < pebbleCount; p++) {
        pebbles.push({
          ox: 0.15 + Math.random() * 0.7,
          oy: 0.15 + Math.random() * 0.7,
          r: 1.5 + Math.random() * 2.5,
          shade: Math.random() > 0.5 ? '#1f1310' : '#451a14',
          rockId: Math.floor(Math.random() * 16) + 1,
          scale: 0.75 + Math.random() * 0.45,
          flipX: Math.random() > 0.5,
          rot: Math.random() * Math.PI * 2,
        });
      }

      row.push({
        x,
        y,
        type: TILE_TYPES.EMPTY,
        resourceAmount: 0,
        maxResourceAmount: 0,
        elevation,
        crater: hasCrater,
        craterVariant: Math.floor(Math.random() * 4), // 0: meteors_001, 1: 002, 2: 003, 3: 004
        craterAngle: Math.random() * Math.PI * 2,
        craterScale: 0.65 + Math.random() * 0.25,
        fissure: hasFissure,
        fissureAngle: Math.random() * Math.PI,
        fissureLength: 0.4 + Math.random() * 0.35,
        vein: hasVein,
        veinAngle: (Math.random() - 0.5) * 0.8,
        pebbles,
      });
    }
    grid.push(row);
  }

  // Place Heavy Exploration Rover footprint across 4 blocks (2x2 tiles) as the Main Base
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 2; dx++) {
      const tile = grid[vehicleY + dy][vehicleX + dx];
      tile.type = TILE_TYPES.VEHICLE;
      tile.isVehicle = true;
      tile.crater = false;
      tile.fissure = false;
      tile.pebbles = [];
      tile.vein = false;
    }
  }

  // Distance-scaled Resource Distribution across 160x160 Map:
  // Ring 1 (Close, 5..20): Starter buffer nodes (15-25 Regolith, 10-20 Ice)
  // Ring 2 (Mid, 20..45): Moderate nodes, medium yield (35-65 Regolith, 25-50 Ice)
  // Ring 3 (Outer, 45..75): Abundant nodes, high yield (75-130 Regolith, 55-100 Ice)
  // Ring 4 (Deep Frontier, 75..110): Motherlodes, massive yield (150-280 Regolith, 110-210 Ice)
  const resourceTiers = [
    { minR: 5.0,  maxR: 20.0, regCount: 35,  regMin: 15,  regMax: 25,  iceCount: 22,  iceMin: 10,  iceMax: 20 },
    { minR: 20.0, maxR: 45.0, regCount: 180, regMin: 35,  regMax: 65,  iceCount: 110, iceMin: 25,  iceMax: 50 },
    { minR: 45.0, maxR: 75.0, regCount: 260, regMin: 75,  regMax: 130, iceCount: 180, iceMin: 55,  iceMax: 100 },
    { minR: 75.0, maxR: 110.0, regCount: 220, regMin: 150, regMax: 280, iceCount: 160, iceMin: 110, iceMax: 210 },
  ];

  // Guaranteed Starter Resources in immediate perimeter of Lander Base (visible on first screen):
  // 6 starter Regolith nodes and 4 starter Ice nodes placed between 4.8 and 8.0 distance
  const starterRegolithAngles = [0.35, 1.40, 2.45, 3.55, 4.60, 5.75];
  starterRegolithAngles.forEach((ang) => {
    const dist = 5.0 + Math.random() * 2.5;
    const rx = Math.floor(habX + Math.cos(ang) * dist);
    const ry = Math.floor(habY + Math.sin(ang) * dist);
    if (isWithinBounds(rx, ry) && !isNearSafeZone(rx, ry) && grid[ry][rx].type === TILE_TYPES.EMPTY) {
      grid[ry][rx].type = TILE_TYPES.REGOLITH_NODE;
      grid[ry][rx].resourceAmount = 25;
      grid[ry][rx].maxResourceAmount = 25;
      grid[ry][rx].crater = false;
      grid[ry][rx].fissure = false;
      grid[ry][rx].pebbles = [];
    }
  });

  const starterIceAngles = [0.85, 2.0, 3.95, 5.2];
  starterIceAngles.forEach((ang) => {
    const dist = 5.2 + Math.random() * 2.6;
    const ix = Math.floor(habX + Math.cos(ang) * dist);
    const iy = Math.floor(habY + Math.sin(ang) * dist);
    if (isWithinBounds(ix, iy) && !isNearSafeZone(ix, iy) && grid[iy][ix].type === TILE_TYPES.EMPTY) {
      grid[iy][ix].type = TILE_TYPES.ICE_NODE;
      grid[iy][ix].resourceAmount = 20;
      grid[iy][ix].maxResourceAmount = 20;
      grid[iy][ix].crater = false;
      grid[iy][ix].fissure = false;
      grid[iy][ix].pebbles = [];
    }
  });

  resourceTiers.forEach((tier) => {
    // Spawn Regolith Nodes for this tier
    let regSpawned = 0;
    let attempts = 0;
    while (regSpawned < tier.regCount && attempts < tier.regCount * 40) {
      attempts++;
      const angle = Math.random() * Math.PI * 2;
      const dist = tier.minR + Math.random() * (tier.maxR - tier.minR);
      const rx = Math.floor(habX + Math.cos(angle) * dist);
      const ry = Math.floor(habY + Math.sin(angle) * dist);

      if (isWithinBounds(rx, ry) && !isNearSafeZone(rx, ry) && grid[ry][rx].type === TILE_TYPES.EMPTY) {
        const yieldAmount = tier.regMin + Math.floor(Math.random() * (tier.regMax - tier.regMin + 1));
        grid[ry][rx].type = TILE_TYPES.REGOLITH_NODE;
        grid[ry][rx].resourceAmount = yieldAmount;
        grid[ry][rx].maxResourceAmount = yieldAmount;
        grid[ry][rx].crater = false;
        grid[ry][rx].fissure = false;
        grid[ry][rx].pebbles = [];
        regSpawned++;
      }
    }

    // Spawn Subsurface Ice Nodes for this tier
    let iceSpawned = 0;
    attempts = 0;
    while (iceSpawned < tier.iceCount && attempts < tier.iceCount * 40) {
      attempts++;
      const angle = Math.random() * Math.PI * 2;
      const dist = tier.minR + Math.random() * (tier.maxR - tier.minR);
      const ix = Math.floor(habX + Math.cos(angle) * dist);
      const iy = Math.floor(habY + Math.sin(angle) * dist);

      if (isWithinBounds(ix, iy) && !isNearSafeZone(ix, iy) && grid[iy][ix].type === TILE_TYPES.EMPTY) {
        const yieldAmount = tier.iceMin + Math.floor(Math.random() * (tier.iceMax - tier.iceMin + 1));
        grid[iy][ix].type = TILE_TYPES.ICE_NODE;
        grid[iy][ix].resourceAmount = yieldAmount;
        grid[iy][ix].maxResourceAmount = yieldAmount;
        grid[iy][ix].crater = false;
        grid[iy][ix].fissure = false;
        grid[iy][ix].pebbles = [];
        iceSpawned++;
      }
    }
  });

  // Place the 6 Authored Subterranean Cave Landmarks with distinct coordinates across 160x160 map
  const caveLandmarks = [
    { type: TILE_TYPES.CAVE_TURBINE, x: 36, y: 120, name: 'Turbine Core Nest' },
    { type: TILE_TYPES.CAVE_MAYA, x: 125, y: 45, name: 'Maya Spore Grotto' },
    { type: TILE_TYPES.CAVE_OMAR, x: 130, y: 130, name: 'Omar Crystalline Chasm' },
    { type: TILE_TYPES.CAVE_LINA, x: 40, y: 35, name: 'Lina Sub-Zero Crypt' },
    { type: TILE_TYPES.CAVE_ARSENAL, x: 95, y: 140, name: 'Prototype Arsenal Depot' },
    { type: TILE_TYPES.CAVE_ADAM, x: 15, y: 15, name: 'Adam Research Citadel' },
  ];

  caveLandmarks.forEach((cave) => {
    if (isWithinBounds(cave.x, cave.y)) {
      grid[cave.y][cave.x].type = cave.type;
      grid[cave.y][cave.x].crater = false;
      grid[cave.y][cave.x].fissure = false;
      grid[cave.y][cave.x].isCave = true;
      grid[cave.y][cave.x].caveName = cave.name;
    }
  });

  // Place Ancient Precursor Relic Altars across the surface map
  const ancientAltars = [
    { x: 72, y: 28, name: { en: 'Precursor Astral Monolith', ar: 'مسلة النجوم السلفية' } },
    { x: 24, y: 82, name: { en: 'Precursor Chrono Shrine', ar: 'محراب الزمن السلفي' } },
    { x: 136, y: 95, name: { en: 'Precursor Xeno Archive', ar: 'أرشيف الكائنات السلفي' } },
  ];

  ancientAltars.forEach((altar) => {
    if (isWithinBounds(altar.x, altar.y)) {
      grid[altar.y][altar.x].type = TILE_TYPES.ANCIENT_ALTAR;
      grid[altar.y][altar.x].crater = false;
      grid[altar.y][altar.x].fissure = false;
      grid[altar.y][altar.x].isAltar = true;
      grid[altar.y][altar.x].altarName = altar.name;
      grid[altar.y][altar.x].scanned = false;
    }
  });

  return {
    grid,
    habPosition: { x: habX, y: habY },
    vehiclePosition: { x: vehicleX, y: vehicleY },
    playerSpawn: { x: vehicleX + 2, y: vehicleY + 1 }, // (51, 50) safely outside the 2x2 vehicle
  };
};

/**
 * Generates initial diverse native Martian organism population across 100x100 map outside the base safe radius.
 * Hierarchy: Small Burrower, Alpha Burrower, Crystal Walker, Ice Prowler, Titan Boss.
 */
export const generateInitialEnemies = (vehiclePos = { x: 79, y: 79 }, count = 55) => {
  const baseCenterX = (vehiclePos?.x ?? 79) + 1.0;
  const baseCenterY = (vehiclePos?.y ?? 79) + 1.0;
  const enemies = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Disperse outside the base safe zone across 160x160 map: between 18 and 95 sectors
    const dist = 18.0 + Math.random() * 85.0;
    const x = Math.max(3.5, Math.min(GRID_SIZE - 4.5, baseCenterX + Math.cos(angle) * dist));
    const y = Math.max(3.5, Math.min(GRID_SIZE - 4.5, baseCenterY + Math.sin(angle) * dist));

    // Determine Creature Type within the Martian Ecosystem Hierarchy
    let creatureType = 'burrower';
    if (dist >= 68.0 && Math.random() < 0.25) {
      creatureType = 'titan';
    } else if (dist >= 45.0) {
      const roll = Math.random();
      creatureType = roll < 0.4 ? 'alpha' : (roll < 0.7 ? 'crystal' : 'ice');
    } else if (dist >= 20.0) {
      creatureType = Math.random() < 0.5 ? 'burrower' : (Math.random() < 0.5 ? 'crystal' : 'ice');
    }

    const isAlpha = creatureType === 'alpha' || creatureType === 'titan';
    const maxHp = creatureType === 'titan' ? 180 : (creatureType === 'alpha' ? 100 : (creatureType === 'crystal' ? 80 : 60));

    enemies.push({
      id: `burrower-${i + 1}-${Math.floor(Math.random() * 10000)}`,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      homeX: Math.round(x * 10) / 10,
      homeY: Math.round(y * 10) / 10,
      creatureType,
      health: maxHp,
      maxHealth: maxHp,
      angle: Math.random() * Math.PI * 2,
      lastAttackTime: 0,
      isAlpha,
    });
  }

  return enemies;
};

/**
 * Spawns a single respawned Burrower in distant Martian territory away from astronaut and base.
 */
export const spawnSingleBurrower = (vehiclePos = { x: 49, y: 49 }, playerPos = { x: 50, y: 50 }) => {
  const baseCenterX = (vehiclePos?.x ?? 49) + 1.0;
  const baseCenterY = (vehiclePos?.y ?? 49) + 1.0;
  const px = playerPos?.x ?? baseCenterX;
  const py = playerPos?.y ?? baseCenterY;

  for (let attempt = 0; attempt < 35; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 18.0 + Math.random() * 48.0;
    const x = Math.max(3.5, Math.min(GRID_SIZE - 4.5, baseCenterX + Math.cos(angle) * dist));
    const y = Math.max(3.5, Math.min(GRID_SIZE - 4.5, baseCenterY + Math.sin(angle) * dist));

    // Must be at least 15 tiles away from the player's current position so they don't spawn in face
    if (Math.hypot(x - px, y - py) < 15.0) continue;

    let creatureType = 'burrower';
    if (dist >= 45.0 && Math.random() < 0.2) {
      creatureType = 'titan';
    } else if (dist >= 35.0) {
      const roll = Math.random();
      creatureType = roll < 0.4 ? 'alpha' : (roll < 0.7 ? 'crystal' : 'ice');
    } else if (dist >= 20.0) {
      creatureType = Math.random() < 0.5 ? 'burrower' : (Math.random() < 0.5 ? 'crystal' : 'ice');
    }

    const isAlpha = creatureType === 'alpha' || creatureType === 'titan';
    const maxHp = creatureType === 'titan' ? 180 : (creatureType === 'alpha' ? 100 : (creatureType === 'crystal' ? 80 : 60));

    return {
      id: `burrower-respawn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      homeX: Math.round(x * 10) / 10,
      homeY: Math.round(y * 10) / 10,
      creatureType,
      health: maxHp,
      maxHealth: maxHp,
      angle: Math.random() * Math.PI * 2,
      lastAttackTime: 0,
      isAlpha,
    };
  }

  return null;
};

/**
 * Checks if a tile is walkable for the astronaut.
 */
export const isTileWalkable = (grid, x, y) => {
  if (!grid || !isWithinBounds(x, y, grid)) return false;
  const tile = grid[y]?.[x];
  if (!tile) return false;

  // Solid structures that block astronaut walking (cannot walk through/over)
  const solidTypes = [
    TILE_TYPES.HAB,
    TILE_TYPES.VEHICLE,
    TILE_TYPES.BIODOME,
    TILE_TYPES.SOLAR_ARRAY,
    TILE_TYPES.ICE_PURIFIER,
    TILE_TYPES.COMMS_ARRAY,
    TILE_TYPES.THERMAL_HEATER,
    TILE_TYPES.BATTERY,
    TILE_TYPES.BATTERY_BANK,
    TILE_TYPES.WALL,
    TILE_TYPES.CAVE_WALL,
  ];

  if (solidTypes.includes(tile.type)) return false;
  return true;
};

/**
 * Evaluates whether a structure is actively powered and operational.
 * Supports manual toggle [ON/OFF] for all buildings, plus Level 2 & 3 smart automation for Thermal Heaters.
 */
export const isBuildingOperational = (tile, { isDay = true, playerPos = null, grid = null } = {}) => {
  if (!tile || tile.type === TILE_TYPES.EMPTY) return false;

  // 1. Explicitly turned OFF by player (manual shut down to save power)
  if (tile.disabled === true || tile.powerMode === 'OFF') {
    return false;
  }

  // 2. Explicitly forced ON by player
  if (tile.powerMode === 'ON') {
    return true;
  }

  // 3. Thermal Heater Automation (Default is 'AUTO' / level-dependent)
  if (tile.type === TILE_TYPES.THERMAL_HEATER) {
    const level = tile.level || 1;

    // Level 1: Standard manual operation (ON by default unless toggled OFF)
    if (level === 1) {
      return true;
    }

    // Level 2: Smart Night Auto-Mode (Sleeps during daytime, powers ON at night)
    if (level === 2) {
      return !isDay;
    }

    // Level 3: Ultra Eco Sensor (Sleeps during day; at night only powers ON if player or crops are in range!)
    if (level >= 3) {
      if (isDay) return false; // Daytime doesn't require heating

      const radius = 9.0;
      const hpx = (tile.x ?? 0) + 0.5;
      const hpy = (tile.y ?? 0) + 0.5;

      // Check if astronaut is within 9.0 tile perimeter
      if (playerPos) {
        const distPlayer = Math.hypot(playerPos.x - hpx, playerPos.y - hpy);
        if (distPlayer <= radius) {
          return true;
        }
      }

      // Check if any constructed Biodome is within 9.0 tile perimeter
      if (Array.isArray(grid)) {
        const tx = tile.x ?? 0;
        const ty = tile.y ?? 0;
        const minGy = Math.max(0, Math.floor(ty - radius));
        const maxGy = Math.min(grid.length - 1, Math.ceil(ty + radius));
        const minGx = Math.max(0, Math.floor(tx - radius));
        const maxGx = Math.min((grid[0]?.length || 1) - 1, Math.ceil(tx + radius));

        for (let gy = minGy; gy <= maxGy; gy++) {
          for (let gx = minGx; gx <= maxGx; gx++) {
            if (grid[gy][gx]?.type === TILE_TYPES.BIODOME) {
              const distBio = Math.hypot((gx + 0.5) - hpx, (gy + 0.5) - hpy);
              if (distBio <= radius) {
                return true;
              }
            }
          }
        }
      }

      // No one and no crops inside perimeter => conserve 100% power!
      return false;
    }
  }

  return true;
};

/**
 * Checks if a tile is within the thermal warmth radius of an active Thermal Heater or central Hab.
 */
export const isTileInThermalZone = (grid, x, y, habPos = { x: 50, y: 50 }, isPowered = true, options = {}) => {
  // 1. Lander Base & Exploration Rover core warmth is ALWAYS ACTIVE (Independent RTG Reactor)!
  // Even if the colony power grid is 0 kWh, the base shelter is a guaranteed thermal life-support refuge.
  const cx = Number.isInteger(x) ? x + 0.5 : x;
  const cy = Number.isInteger(y) ? y + 0.5 : y;

  if (habPos) {
    const baseX = habPos.x ?? 50;
    const baseY = habPos.y ?? 50;
    const distBase = Math.hypot(cx - baseX, cy - baseY);
    if (distBase <= BASE_SAFE_RADIUS) return true;
  }

  // 2. Secondary grid-powered structures (Heaters, Outposts) strictly require active colony power!
  if (!isPowered) return false;

  const isDay = options?.isDay ?? true;
  const playerPos = options?.playerPos ?? { x, y };

  // Check any constructed Supply Depots / Outposts or Thermal Heaters within local bounding box
  if (Array.isArray(grid)) {
    const minGy = Math.max(0, Math.floor(y - 10));
    const maxGy = Math.min(grid.length - 1, Math.ceil(y + 10));
    const minGx = Math.max(0, Math.floor(x - 10));
    const maxGx = Math.min((grid[0]?.length || 1) - 1, Math.ceil(x + 10));

    for (let gy = minGy; gy <= maxGy; gy++) {
      for (let gx = minGx; gx <= maxGx; gx++) {
        const tile = grid[gy][gx];
        if (!tile) continue;

        if (tile.type === TILE_TYPES.HAB) {
          const sTile = { ...tile, x: gx, y: gy };
          if (isBuildingOperational(sTile, { isDay, playerPos, grid })) {
            const distDepot = Math.hypot(x - (gx + 0.5), y - (gy + 0.5));
            if (distDepot <= 2.4) return true;
          }
        } else if (tile.type === TILE_TYPES.THERMAL_HEATER) {
          const hTile = { ...tile, x: gx, y: gy };
          if (!isBuildingOperational(hTile, { isDay, playerPos, grid })) continue;

          const heaterLevel = tile?.level || 1;
          const radius = heaterLevel === 3 ? 9.0 : heaterLevel === 2 ? 6.5 : HEATER_THERMAL_RADIUS;
          const dist = Math.hypot(x - (gx + 0.5), y - (gy + 0.5));
          if (dist <= radius) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

/**
 * Calculates current Comms signal strength and proximity to nearest Comms Dish.
 * Respects Comms Array upgrade levels (Lv1: 6.5, Lv2: 10.5, Lv3: 16.0).
 */
export const getCommsSignalInfo = (
  grid,
  playerPos = { x: 50, y: 50 },
  hasCommsTransceiver = false,
  isAntennaRepaired = false,
  habPos = { x: 50, y: 50 }
) => {
  // 1. If player brought the Long-Range Comms Module in loadout, they have direct personal suit uplink!
  if (hasCommsTransceiver) {
    return {
      hasSignal: true,
      isGlobal: true,
      signalStrength: 100,
      nearestDist: 0,
      noDishBuilt: false,
      maxRange: 999,
      hasBooster: true,
      source: 'PERSONAL_TRANSCEIVER',
    };
  }

  // 2. If the crashed lander antenna has been repaired, it provides baseline coverage around the Lander
  const distToLander = Math.hypot(playerPos.x - habPos.x, playerPos.y - habPos.y);
  const isNearRepairedLander = isAntennaRepaired && distToLander <= 8.5;

  let minDistance = isNearRepairedLander ? distToLander : Infinity;
  let hasDish = isAntennaRepaired;
  let maxAntennaRange = isAntennaRepaired ? 8.5 : COMMS_SIGNAL_RADIUS;

  if (Array.isArray(grid)) {
    const minGy = Math.max(0, Math.floor(playerPos.y - 20));
    const maxGy = Math.min(grid.length - 1, Math.ceil(playerPos.y + 20));
    const minGx = Math.max(0, Math.floor(playerPos.x - 20));
    const maxGx = Math.min((grid[0]?.length || 1) - 1, Math.ceil(playerPos.x + 20));

    for (let gy = minGy; gy <= maxGy; gy++) {
      for (let gx = minGx; gx <= maxGx; gx++) {
        if (grid[gy][gx]?.type === TILE_TYPES.COMMS_ARRAY) {
          const tile = grid[gy][gx];
          if (tile.disabled === true || tile.powerMode === 'OFF') continue;
          hasDish = true;
          const dishLevel = tile?.level || 1;
          const dishRange = dishLevel === 3 ? 16.0 : dishLevel === 2 ? 10.5 : COMMS_SIGNAL_RADIUS;
          if (dishRange > maxAntennaRange) {
            maxAntennaRange = dishRange;
          }
          const dist = Math.hypot(playerPos.x - (gx + 0.5), playerPos.y - (gy + 0.5));
          if (dist < minDistance) {
            minDistance = dist;
          }
        }
      }
    }
  }

  // If neither repaired antenna nor constructed dish exists, communication is offline
  if (!hasDish) {
    return {
      hasSignal: false,
      isGlobal: false,
      signalStrength: 0,
      nearestDist: Infinity,
      noDishBuilt: true,
      antennaNeedsRepair: !isAntennaRepaired,
      maxRange: COMMS_SIGNAL_RADIUS,
    };
  }

  const hasSignal = minDistance <= maxAntennaRange;
  const signalStrength = hasSignal
    ? Math.max(20, Math.min(100, Math.round(100 - (minDistance / maxAntennaRange) * 45)))
    : 0;

  return {
    hasSignal,
    isGlobal: false,
    signalStrength,
    nearestDist: Math.round(minDistance * 10) / 10,
    noDishBuilt: false,
    antennaNeedsRepair: false,
    maxRange: maxAntennaRange,
    hasBooster: false,
    source: isNearRepairedLander ? 'LANDER_BASE' : 'COMMS_DISH',
  };
};

/**
 * Validates if a building can be constructed on the given tile.
 */
export const canBuildAt = (grid, x, y, playerPos, buildingType = null, habPos = { x: 12, y: 12 }, isPowered = true) => {
  if (!isWithinBounds(x, y)) return { valid: false, reason: 'Out of bounds' };
  
  const tile = grid[y]?.[x];
  if (!tile) return { valid: false, reason: 'Invalid sector' };

  if (tile.type === TILE_TYPES.HAB) {
    return { valid: false, reasonKey: 'cannotBuildHab', reason: 'Cannot construct over Central Hab Capsule' };
  }

  if (tile.type === TILE_TYPES.VEHICLE) {
    return { valid: false, reasonKey: 'cannotBuildRover', reason: 'Cannot construct over Exploration Rover' };
  }

  // Safe landing & maneuvering plaza reserved around Ares Base center (spans base safe perimeter)
  if (habPos) {
    const baseCenterX = habPos.x ?? 50;
    const baseCenterY = habPos.y ?? 50;
    const distToBase = Math.hypot((x + 0.5) - baseCenterX, (y + 0.5) - baseCenterY);
    if (distToBase <= BASE_SAFE_RADIUS) {
      return {
        valid: false,
        reasonKey: 'cannotBuildBasePlaza',
        reason: 'Reserved Ares Base landing plaza! Construct outside safe perimeter.',
      };
    }
  }

  if (playerPos && Math.round(playerPos.x) === x && Math.round(playerPos.y) === y) {
    return { valid: false, reasonKey: 'cannotBuildPlayer', reason: 'Astronaut is occupying this sector' };
  }

  if (tile.type !== TILE_TYPES.EMPTY) {
    if (tile.type === TILE_TYPES.REGOLITH_NODE || tile.type === TILE_TYPES.ICE_NODE) {
      return { valid: false, reasonKey: 'cannotBuildResource', reason: 'Resource node present. Mine tile first!' };
    }
    return { valid: false, reasonKey: 'cannotBuildOccupied', reason: 'Structure already present on this tile' };
  }

  // Realistic thermal condition: Biodomes must be placed within thermal warmth zone!
  if (buildingType === TILE_TYPES.BIODOME) {
    const isWarm = isTileInThermalZone(grid, x, y, habPos, isPowered);
    if (!isWarm) {
      return {
        valid: false,
        reasonKey: 'biodomeNeedsHeater',
        reason: 'Hydroponic Biodome requires warmth! Construct near a powered Thermal Heater or Hab.',
      };
    }
  }

  return { valid: true };
};

/**
 * Converts screen/canvas click coordinate to grid coordinate considering camera offset.
 */
export const screenToGrid = (canvasX, canvasY, tileSize, cameraOffsetX = 0, cameraOffsetY = 0) => {
  const gx = Math.floor((canvasX - cameraOffsetX) / tileSize);
  const gy = Math.floor((canvasY - cameraOffsetY) / tileSize);
  return { x: gx, y: gy };
};

/**
 * Converts grid coordinates to top-left pixel in canvas with camera offset.
 */
export const gridToScreen = (gx, gy, tileSize, cameraOffsetX = 0, cameraOffsetY = 0) => {
  return {
    px: cameraOffsetX + gx * tileSize,
    py: cameraOffsetY + gy * tileSize,
  };
};
