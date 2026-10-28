import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SOL_DURATION_SECONDS,
  DEFAULT_MAX_O2,
  DEFAULT_MAX_HEALTH,
  DEFAULT_MAX_SANITY,
  DEFAULT_MAX_HUNGER,
  DEFAULT_MAX_THIRST,
  INITIAL_FOOD_RATIONS,
  INITIAL_WATER_RATIONS,
  THREAT_EVENT_SOL,
  TILE_TYPES,
  BUILDING_UPGRADES,
  DEFAULT_BODY_TEMP,
  CHILLY_BODY_TEMP,
  FREEZING_BODY_TEMP,
  COMMS_COOLDOWN_SECONDS,
  COMMS_ENERGY_COST,
  ORBITAL_WINDOW_SOLS,
  DUST_STORM_SOL,
  ANTENNA_REPAIR_COST,
  getSolNightFactor,
  BASE_SAFE_RADIUS,
} from '../types/gameTypes';
import { isTileInThermalZone, getCommsSignalInfo, isBuildingOperational } from '../utils/gridHelpers';

/**
 * useGameLoop manages the complete colony simulation:
 * - Sol Day/Night Cycle and Martian Temperatures (+15°C vs -80°C)
 * - 30-Sol Orbital Return Window & Overtime Escalation
 * - Sol 5 Atmospheric Dust Storm Event (80% solar loss, extreme cold)
 * - Adaptive Comms Antenna (Instant if transceiver brought, field repair if crashed)
 * - Commander Specializations & 100kg Loadout Mechanics
 * - Power Grid, Batteries (Charging/Discharging), and Thermal Heaters
 * - Body Temperature (37°C) & Hypothermia Penalties
 * - Comprehensive Vitals: Health, Sanity, Hunger, Thirst, O2
 */
export const useGameLoop = ({
  loadout = [],
  craftedUpgrades = [],
  grid = [],
  setGrid,
  playerPos = { x: 8, y: 8 },
  habPos = { x: 50, y: 50 },
  vehiclePos = { x: 49, y: 49 },
  isGameActive = false,
  isMoving = false,
  isMining = false,
  isMinimapOpen = false,
  materials = { regolith: 0, ice: 0 },
  setMaterials,
  backpack = { regolith: 0, ice: 0 },
  backpackCapacity = 20,
  onLogMessage,
  commanderSpec = null,
  rescuedCrew = [],
  crewAssignments = {},
  activeCaveInfo = null,
}) => {
  // Equipment perks & Crafted bonuses
  const hasExtraO2 = loadout.includes('extra_o2');
  const hasCommsTransceiver = loadout.includes('comms_transceiver');
  const hasRtg = loadout.includes('rtg_battery');
  const hasHeavyDrill = loadout.includes('heavy_drill') || loadout.includes('nanite_drill');
  const hasO2Scrubber = craftedUpgrades.includes('o2_scrubber');
  const hasThermalInsulation = craftedUpgrades.includes('thermal_insulation');
  const hasFoodPack = loadout.includes('food_pack');
  const hasWaterTank = loadout.includes('water_tank');
  const hasBatteryPack = loadout.includes('battery_pack');
  const hasSolarPanel = loadout.includes('solar_panel');
  const hasMedKit = loadout.includes('med_kit');

  const maxO2 = hasExtraO2 ? 150 : DEFAULT_MAX_O2;

  // Sol & Time states
  const [sol, setSol] = useState(1);
  const [solTime, setSolTime] = useState(0); // 0 to SOL_DURATION_SECONDS
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Vitals State
  const [health, setHealth] = useState(DEFAULT_MAX_HEALTH);
  const [sanity, setSanity] = useState(DEFAULT_MAX_SANITY);
  const [hunger, setHunger] = useState(DEFAULT_MAX_HUNGER);
  const [thirst, setThirst] = useState(DEFAULT_MAX_THIRST);
  const [o2, setO2] = useState(maxO2);

  // Core Body Temperature State (Celsius: optimal 37°C, hypothermia < 32°C)
  const [bodyTemp, setBodyTemp] = useState(DEFAULT_BODY_TEMP);

  // Suit Flashlight State
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);

  // Comms Cooldown timer (seconds remaining)
  const [commsCooldown, setCommsCooldown] = useState(0);
  const [commsIntel, setCommsIntel] = useState(null);
  const [orbitalPings, setOrbitalPings] = useState([]);
  const hasMappingDrone = loadout.includes('mapping_drone');
  const [isResourceRadarUnlocked, setIsResourceRadarUnlocked] = useState(() => Boolean(hasMappingDrone));

  // Adaptive Antenna: Automatically operational if player brought transceiver, else requires field repair!
  const [isAntennaRepaired, setIsAntennaRepaired] = useState(() => Boolean(hasCommsTransceiver));

  // Rations Inventory: Generous initial boost if player spent payload budget on food/water tanks
  const [foodRations, setFoodRations] = useState(() => INITIAL_FOOD_RATIONS + (hasFoodPack ? 15 : 0));
  const [waterRations, setWaterRations] = useState(() => INITIAL_WATER_RATIONS + (hasWaterTank ? 15 : 0));

  // Crop Growth Timer (0 to 100%)
  const [cropGrowth, setCropGrowth] = useState(0);

  // Battery Storage (kWh): Enhanced capacity if battery pack chosen or energy engineer
  const [batteryCharge, setBatteryCharge] = useState(() => 20 + (hasBatteryPack ? 20 : 0) + (commanderSpec === 'ENERGY' ? 10 : 0));

  // Day 5 Threat State
  const [isThreatActive, setIsThreatActive] = useState(false);
  const [threatResolved, setThreatResolved] = useState(false);
  const [blackoutUntilSol, setBlackoutUntilSol] = useState(null);

  // Helper to check if player is at Lander Base (Vehicle) or a constructed Supply Depot
  const isNearHab = useCallback(() => {
    // Proximity to Lander Base (Vehicle Center)
    const baseCenterX = vehiclePos ? vehiclePos.x + 1.0 : (habPos?.x ?? 50);
    const baseCenterY = vehiclePos ? vehiclePos.y + 1.0 : (habPos?.y ?? 50);
    const px = playerPos.x + 0.5;
    const py = playerPos.y + 0.5;
    const dist = Math.hypot(px - baseCenterX, py - baseCenterY);
    if (dist <= BASE_SAFE_RADIUS) return true;

    // Proximity to any constructed Supply Depot
    if (Array.isArray(grid)) {
      for (const row of grid) {
        for (const tile of row) {
          if (tile.type === TILE_TYPES.HAB) {
            const d = Math.hypot(px - (tile.x + 0.5), py - (tile.y + 0.5));
            if (d <= 2.0) return true;
          }
        }
      }
    }
    return false;
  }, [playerPos, habPos, vehiclePos, grid]);

  // Calculate Colony Power & Temperature Metrics with 3-tier building scaling
  const calculatePowerMetrics = useCallback(() => {
    let solarCount = 0;
    let biodomeCount = 0;
    let purifierCount = 0;
    let commsDishCount = 0;
    let heaterCount = 0;
    let batteryCount = 0;

    let totalSolarGen = 0;
    let totalDrain = 0;
    let totalBatteryCapacity = 30 + (hasBatteryPack ? 15 : 0) + (commanderSpec === 'ENERGY' ? 10 : 0); // base hab battery buffer + payload buffs

    const isBlackoutActive = blackoutUntilSol !== null && sol <= blackoutUntilSol;
    const solProgress = solTime / SOL_DURATION_SECONDS;
    const nightFactor = getSolNightFactor(solProgress);
    const isDay = nightFactor < 0.5;

    // Direct Daylight Solar Panel Payload bonus
    if (hasSolarPanel && isDay && !isBlackoutActive) {
      totalSolarGen += 15;
    }

    if (Array.isArray(grid)) {
      for (let gy = 0; gy < grid.length; gy++) {
        for (let gx = 0; gx < grid[gy].length; gx++) {
          const tile = grid[gy][gx];
          if (!tile) continue;

          const lvl = tile.level || 1;
          const upgradeData = BUILDING_UPGRADES[tile.type]?.[lvl];
          const tWithCoords = { ...tile, x: gx, y: gy };
          const isOperational = isBuildingOperational(tWithCoords, { isDay, playerPos, grid });

          if (tile.type === TILE_TYPES.SOLAR_ARRAY) {
            solarCount++;
            if (isOperational) {
              totalSolarGen += (upgradeData?.powerDelta || 12);
            }
          } else if (tile.type === TILE_TYPES.BIODOME) {
            biodomeCount++;
            if (isOperational) {
              totalDrain += Math.abs(upgradeData?.powerDelta ?? -6);
            }
          } else if (tile.type === TILE_TYPES.ICE_PURIFIER) {
            purifierCount++;
            if (isOperational) {
              totalDrain += Math.abs(upgradeData?.powerDelta ?? -3);
            }
          } else if (tile.type === TILE_TYPES.COMMS_ARRAY) {
            commsDishCount++;
            if (isOperational) {
              totalDrain += Math.abs(upgradeData?.powerDelta ?? -4);
            }
          } else if (tile.type === TILE_TYPES.THERMAL_HEATER) {
            heaterCount++;
            if (isOperational) {
              totalDrain += Math.abs(upgradeData?.powerDelta ?? -6);
            }
          } else if (tile.type === TILE_TYPES.BATTERY_BANK) {
            batteryCount++;
            totalBatteryCapacity += (upgradeData?.storageCapacity || 60);
          }
        }
      }
    }

    // Phase 2: Commander Specialization & Dust Storm Solar Modifiers
    const isDustStormActive = sol === DUST_STORM_SOL;
    const energySpecMultiplier = commanderSpec === 'ENERGY' ? 1.25 : 1.0;
    const engineerDrainMultiplier = commanderSpec === 'ENGINEER' ? 0.75 : 1.0;

    // Dynamic Crew Grid Assignment Perks
    let gridSolarBonus = 1.0;
    let gridDrainDiscount = 1.0;
    for (const cId of (rescuedCrew || [])) {
      if (crewAssignments?.[cId] === 'GRID') {
        if (cId === 'crew_adam') {
          gridSolarBonus += 0.35; // Adam ⭐ Specialist (+35% solar)
          gridDrainDiscount *= 0.65; // Adam ⭐ Specialist (-35% drain)
        } else {
          gridSolarBonus += 0.15; // Standard assignment (+15% solar)
          gridDrainDiscount *= 0.85; // Standard assignment (-15% drain)
        }
      }
    }

    totalSolarGen *= (energySpecMultiplier * gridSolarBonus);
    totalDrain *= (engineerDrainMultiplier * gridDrainDiscount);

    // Power Production (scales with solar array upgrades, reduced by 80% during Sol 5 Dust Storm)
    const isInsideCave = Boolean(activeCaveInfo);
    const sunFactor = isInsideCave ? 0 : Math.max(0, 1.0 - nightFactor);
    const stormSolarMultiplier = isDustStormActive ? 0.20 : 1.0; // 80% loss in dust storms!
    const solarGen = isBlackoutActive ? 0 : Math.round(totalSolarGen * sunFactor * stormSolarMultiplier * 10) / 10;
    const rtgPower = hasRtg ? 6 : 0;
    const thermalUpgradePower = hasThermalInsulation ? 4 : 0;
    const totalProduced = Math.round((solarGen + rtgPower + thermalUpgradePower) * 100) / 100;

    // Power Consumption (Flashlight is 0 drain for Energy Engineer)
    const flashlightDrain = (isFlashlightOn && commanderSpec !== 'ENERGY') ? 1.5 : 0;
    const minimapDrain = isMinimapOpen ? 1.0 : 0;

    const totalConsumed = Math.round((totalDrain + flashlightDrain + minimapDrain) * 100) / 100;
    const net = Math.round((totalProduced - totalConsumed) * 100) / 100;

    // Maximum battery capacity (scales with battery bank upgrades)
    const maxBatteryCapacity = Math.max(30, totalBatteryCapacity);

    // Temperature Calculation (smoothly glides between +15°C day and -80°C night, dropping further in storms or overtime)
    const stormTempPenalty = isDustStormActive ? -25 : 0;
    const overtimeTempPenalty = sol > ORBITAL_WINDOW_SOLS ? -15 : 0;
    const ambientTemp = 15 - 95 * nightFactor + stormTempPenalty + overtimeTempPenalty;
    let temperature = Math.round(ambientTemp);
    let isFreezing = false;

    if (isInsideCave) {
      temperature = activeCaveInfo?.ambientTemp ?? -30;
      isFreezing = temperature < 0;
    } else if (nightFactor > 0.5 || isDustStormActive) {
      if (heaterCount > 0 && (net >= 0 || batteryCharge > 0)) {
        temperature = 18; // Heated safely
      } else {
        isFreezing = true; // Freezing Martian cold!
      }
    }

    return {
      produced: totalProduced,
      consumed: totalConsumed,
      net,
      isDay,
      nightFactor,
      temperature,
      isFreezing,
      solarCount,
      biodomeCount,
      purifierCount,
      commsDishCount,
      heaterCount,
      batteryCount,
      maxBatteryCapacity,
      isBlackoutActive,
      isDustStormActive,
    };
  }, [grid, blackoutUntilSol, sol, solTime, hasRtg, hasThermalInsulation, hasSolarPanel, hasBatteryPack, batteryCharge, isFlashlightOn, isMinimapOpen, playerPos, commanderSpec, rescuedCrew, crewAssignments]);

  const powerMetrics = calculatePowerMetrics();

  // Advance Sol manual or automatic
  const advanceSol = useCallback(() => {
    setSol((prev) => {
      const nextSol = prev + 1;
      setSolTime(0);

      // Biodome life-support bonus if not freezing and powered
      const { biodomeCount, net } = calculatePowerMetrics();
      if (biodomeCount > 0 && net >= 0) {
        const o2Bonus = biodomeCount * 10;
        setO2((curr) => Math.min(maxO2, curr + o2Bonus));
      }

      // Sol 5 Major Dust Storm Anomaly
      if (nextSol === DUST_STORM_SOL) {
        onLogMessage?.('🚨 عاصفة ترابية كبرى تضرب قطاع مارينيريس! هبوط توليد الألواح 80%. تفعيل تدفئة الطوارئ.', 'danger');
      } else if (prev === DUST_STORM_SOL) {
        onLogMessage?.('☀️ انقشعت العاصفة الترابية وعادت الألواح الشمسية للعمل بكامل طاقتها.', 'success');
      }

      // Sol 30 Orbital Return Window Expiry
      if (nextSol === ORBITAL_WINDOW_SOLS + 1) {
        onLogMessage?.('⚠️ انقضاء النافذة المدارية القياسية (Sol 30). دخلت المهمة طور التمديد الإجباري (Overtime Escalation).', 'warning');
      }

      if (nextSol === THREAT_EVENT_SOL && !threatResolved) {
        setIsThreatActive(true);
      }

      return nextSol;
    });
  }, [calculatePowerMetrics, maxO2, threatResolved, onLogMessage]);

  // Synchronized State References for Simulation Interval
  // Prevents interval re-creation on every animation frame when moving
  const lastPlayerPosRef = useRef({ x: playerPos.x, y: playerPos.y });
  const vitalsRef = useRef({ o2, hunger, thirst, bodyTemp });
  vitalsRef.current = { o2, hunger, thirst, bodyTemp };

  const loopStateRef = useRef({});
  loopStateRef.current = {
    isGameActive,
    isPaused,
    isGameOver,
    isThreatActive,
    isMining,
    isMoving,
    hasHeavyDrill,
    hasO2Scrubber,
    hasThermalInsulation,
    maxO2,
    grid,
    setGrid,
    playerPos,
    habPos,
    vehiclePos,
    batteryCharge,
    isFlashlightOn,
    backpack,
    backpackCapacity,
    advanceSol,
    calculatePowerMetrics,
    isNearHab,
    onLogMessage,
    rescuedCrew,
    crewAssignments,
    activeCaveInfo,
  };

  // Main simulation tick loop (every 250ms = 4 ticks/sec)
  useEffect(() => {
    if (!isGameActive || isPaused || isGameOver || isThreatActive) return;

    const interval = setInterval(() => {
      const s = loopStateRef.current;
      if (!s.isGameActive || s.isPaused || s.isGameOver || s.isThreatActive) return;

      // Detect movement delta between ticks
      const deltaX = s.playerPos.x - lastPlayerPosRef.current.x;
      const deltaY = s.playerPos.y - lastPlayerPosRef.current.y;
      const distMoved = Math.hypot(deltaX, deltaY);
      lastPlayerPosRef.current = { x: s.playerPos.x, y: s.playerPos.y };

      const isActivelyMoving = Boolean(s.isMoving || distMoved > 0.005);
      const isExerting = isActivelyMoving || s.isMining;

      // 1. Sol Clock
      setSolTime((prevTime) => {
        const nextTime = prevTime + 0.25;
        if (nextTime >= SOL_DURATION_SECONDS) {
          s.advanceSol();
          return 0;
        }
        return nextTime;
      });

      // 2. Battery Charge / Discharge
      const metrics = s.calculatePowerMetrics();
      setBatteryCharge((curr) => {
        if (metrics.isDay && metrics.net > 0) {
          // Charge battery from daytime excess
          const chargeRate = (metrics.net * 0.25) / 10;
          return Math.round(Math.min(metrics.maxBatteryCapacity, curr + chargeRate) * 100) / 100;
        } else if (metrics.net < 0) {
          // Discharge battery to sustain heaters, flashlight, life support
          const dischargeRate = (Math.abs(metrics.net) * 0.25) / 10;
          const nextCharge = Math.max(0, curr - dischargeRate);
          if (nextCharge === 0 && s.isFlashlightOn) {
            setIsFlashlightOn(false);
            if (s.onLogMessage) s.onLogMessage('Suit Flashlight battery depleted!', 'warning');
          }
          return Math.round(nextCharge * 100) / 100;
        }
        return Math.round(curr * 100) / 100;
      });

      // 3. Autonomous Building Production & Storage (Clash of Clans style)
      let hasGridProductionUpdate = false;
      if (Array.isArray(s.grid)) {
        const isColonyPowered = metrics.net >= 0 || s.batteryCharge > 0;
        for (let gy = 0; gy < s.grid.length; gy++) {
          for (let gx = 0; gx < s.grid[gy].length; gx++) {
            const tile = s.grid[gy][gx];
            if (!tile) continue;

            if (tile.type === TILE_TYPES.SOLAR_ARRAY && (tile.storedAmount > 0 || tile.productionProgress > 0)) {
              tile.storedAmount = 0;
              tile.productionProgress = 0;
              hasGridProductionUpdate = true;
            }

            const lvl = tile.level || 1;
            const upgradeData = BUILDING_UPGRADES[tile.type]?.[lvl];
            if (!upgradeData || !upgradeData.maxStorage) continue;

            const currentStored = tile.storedAmount || 0;
            const isOperational = isBuildingOperational({ ...tile, x: gx, y: gy }, { isDay: metrics.isDay, playerPos: s.playerPos, grid: s.grid });
            if (!isOperational) continue;

            let canProduce = false;
            let hasInputMaterial = true;

            if (tile.type === TILE_TYPES.BIODOME) {
              const isWarm = isTileInThermalZone(s.grid, gx, gy, s.habPos, isColonyPowered);
              const availableFeed = (tile.inputAmount || 0) > 0 || (s.materials?.ice || 0) > 0;
              hasInputMaterial = availableFeed;
              tile.hasFeed = availableFeed;
              canProduce = isWarm && isColonyPowered && availableFeed && currentStored < upgradeData.maxStorage;
            } else if (tile.type === TILE_TYPES.ICE_PURIFIER) {
              const availableFeed = (tile.inputAmount || 0) > 0 || (s.materials?.ice || 0) > 0;
              hasInputMaterial = availableFeed;
              tile.hasFeed = availableFeed;
              canProduce = isColonyPowered && availableFeed && currentStored < upgradeData.maxStorage;
            }

            if (canProduce) {
              const currentProgress = (tile.productionProgress || 0) + 0.25;
              if (currentProgress >= upgradeData.productionIntervalSeconds) {
                tile.productionProgress = 0;
                tile.storedAmount = currentStored + 1;
                // Deduct 1 unit from input hopper or colony reserve
                if (tile.type === TILE_TYPES.ICE_PURIFIER || tile.type === TILE_TYPES.BIODOME) {
                  if ((tile.inputAmount || 0) > 0) {
                    tile.inputAmount = Math.max(0, tile.inputAmount - 1);
                  } else if (s.materials?.ice > 0 && s.setMaterials) {
                    s.setMaterials((m) => ({ ...m, ice: Math.max(0, m.ice - 1) }));
                  }
                }
                hasGridProductionUpdate = true;
              } else {
                tile.productionProgress = currentProgress;
              }
            }
          }
        }
      }

      if (hasGridProductionUpdate && s.setGrid) {
        s.setGrid((prevGrid) => prevGrid.map((row) => row.map((cell) => ({ ...cell }))));
      }

      // Dynamic Crop Growth in Biodomes
      if (metrics.biodomeCount > 0 && !metrics.isFreezing && metrics.net >= 0) {
        let cropSpeedMultiplier = 1.0;
        for (const cId of (s.rescuedCrew || [])) {
          if (s.crewAssignments?.[cId] === 'BIODOME') {
            cropSpeedMultiplier += (cId === 'crew_maya' ? 2.0 : 0.6); // Maya ⭐: +200%, Others: +60%
          }
        }
        setCropGrowth((prev) => Math.min(100, prev + 1.0 * cropSpeedMultiplier));
      }

      // 4. Oxygen Dynamics & Backpack Weight Exertion (Entire Safe Perimeter Zone refills O2)
      const baseCenterX = s.vehiclePos ? s.vehiclePos.x + 1.0 : (s.habPos?.x ?? 50);
      const baseCenterY = s.vehiclePos ? s.vehiclePos.y + 1.0 : (s.habPos?.y ?? 50);
      const px = s.playerPos.x + 0.5;
      const py = s.playerPos.y + 0.5;
      const nearHab = s.isNearHab ? s.isNearHab() : (Math.hypot(px - baseCenterX, py - baseCenterY) <= BASE_SAFE_RADIUS);

      setO2((prevO2) => {
        if (nearHab) {
          return Math.min(s.maxO2, prevO2 + 3.0);
        } else {
          let drainRate = 0.35;
          if (s.isMining) {
            drainRate *= 3.5;
            if (s.hasHeavyDrill) drainRate *= 1.25;
          } else if (isActivelyMoving) {
            drainRate *= 1.35; // walking exertion
          }
          if (s.hasO2Scrubber) drainRate *= 0.7;

          // Backpack Weight Exertion: Heavy load accelerates oxygen consumption up to +60%
          const curLoad =
            (s.backpack?.regolith || 0) +
            (s.backpack?.ice || 0) +
            (s.backpack?.bioSamples || 0) +
            (s.backpack?.plasmaCrystals || 0) +
            (s.backpack?.xenoCores || 0) +
            (s.backpack?.xenoCrystals || 0);
          const capacity = s.backpackCapacity || 20;
          const loadRatio = Math.min(1.0, Math.max(0, curLoad / capacity));
          drainRate *= (1 + loadRatio * 0.60);

          return Math.max(0, prevO2 - drainRate);
        }
      });

      // 5. Hunger & Thirst Dynamics
      setHunger((prev) => {
        const exertionFactor = s.isMining ? 0.08 : (isActivelyMoving ? 0.05 : 0.03);
        return Math.max(0, prev - exertionFactor);
      });

      setThirst((prev) => {
        const exertionFactor = s.isMining ? 0.12 : (isActivelyMoving ? 0.08 : 0.04);
        return Math.max(0, prev - exertionFactor);
      });

      // 6. Sanity Dynamics (Mental Health)
      // NOTE: Sanity NEVER recovers merely by being near the base/shelter!
      // True psychological relief on Mars strictly requires human communication via Comms Call ("لازم مكالمة").
      setSanity((prev) => {
        // Isolation strain in the Martian void:
        // Dr. Lina's presence in Clinic dampens mental strain significantly (-60% strain), others -25%
        let sanityProtectionFactor = 1.0;
        for (const cId of (s.rescuedCrew || [])) {
          if (s.crewAssignments?.[cId] === 'CLINIC') {
            sanityProtectionFactor *= (cId === 'crew_lina' ? 0.4 : 0.75); // Lina ⭐: -60% strain, Others: -25%
          }
        }
        const baseStrain = nearHab ? 0.012 : (metrics.isDay ? 0.035 : 0.05);
        const strainRate = baseStrain * sanityProtectionFactor;
        return Math.max(0, prev - strainRate);
      });

      // 6.5. Core Body Temperature Dynamics
      // Freezing night (-80°C) outside warmth grid vs Active Warmth Field:
      // When moving/mining (exertion), muscles produce metabolic body heat, slowing down cooling.
      // When stationary (standing still), heat loss is significantly faster!
      // In both cases outside warmth, the astronaut STILL cools down under -80°C Martian night.
      const inWarmthZone = isTileInThermalZone(
        s.grid,
        px,
        py,
        s.habPos,
        (metrics.net >= 0 || s.batteryCharge > 0),
        { isDay: metrics.isDay, playerPos: s.playerPos }
      );

      setBodyTemp((prevTemp) => {
        if (inWarmthZone || nearHab) {
          // Regains body warmth rapidly up to 37.0°C in Hab or near active thermal heaters (+1.4°C/sec)
          return Math.min(DEFAULT_BODY_TEMP, prevTemp + 0.35);
        } else {
          if (!metrics.isDay) {
            // Freezing night (-80°C) outside warmth grid
            const distFromHab = Math.hypot(px - baseCenterX, py - baseCenterY);
            const convectionFactor = Math.min(0.04, (distFromHab / 14) * 0.04);

            // Stationary cooling rate (tuned for 120s Sol / 36s night) vs Exertion cooling rate (slower, ~50% reduction)
            let baseCoolRate = s.hasThermalInsulation ? 0.04 : 0.09;
            if (isExerting) {
              baseCoolRate *= 0.50; // Physical exertion metabolic heat slows cooling
            }

            const totalCoolRate = baseCoolRate + convectionFactor;
            return Math.max(18.0, prevTemp - totalCoolRate);
          } else {
            // Daytime ambient (+15°C) stabilizes near 36.5°C
            if (prevTemp < 36.5) return Math.min(36.5, prevTemp + 0.06);
            if (prevTemp > 37.0) return Math.max(37.0, prevTemp - 0.04);
            return prevTemp;
          }
        }
      });

      // 6.6. Comms Cooldown countdown
      setCommsCooldown((prev) => Math.max(0, prev - 0.25));

      // 7. Overall Health (HP) Dynamics & Hypothermia Damage
      const curVitals = vitalsRef.current;
      setHealth((prevHp) => {
        let hpDelta = 0;

        // Suffocation
        if (curVitals.o2 <= 0) hpDelta -= 2.5;

        // Dehydration
        if (curVitals.thirst <= 0) hpDelta -= 0.6;

        // Starvation
        if (curVitals.hunger <= 0) hpDelta -= 0.4;

        // Night Freezing / Body Hypothermia Damage
        // When inside warmth zone (Thermal Heater) or near Lander Base Hab, the astronaut is fully protected from cold!
        if (!inWarmthZone && !nearHab) {
          if (curVitals.bodyTemp < FREEZING_BODY_TEMP) {
            hpDelta -= 1.1; // Severe hypothermia damage!
          } else if (curVitals.bodyTemp < CHILLY_BODY_TEMP && !metrics.isDay) {
            hpDelta -= 0.25; // Mild chill damage
          } else if (metrics.isFreezing && !nearHab) {
            hpDelta -= 0.3;
          }
        }

        // Gentle healing in Hab or Warmth Zone if well fed and watered and warm
        let clinicRegen = 0;
        for (const cId of (s.rescuedCrew || [])) {
          if (s.crewAssignments?.[cId] === 'CLINIC') {
            clinicRegen += (cId === 'crew_lina' ? 0.35 : 0.12); // Lina ⭐: +0.35 HP/s, Others: +0.12 HP/s
          }
        }
        if ((nearHab || inWarmthZone) && curVitals.hunger > 60 && curVitals.thirst > 60 && curVitals.o2 > 60 && curVitals.bodyTemp >= 36.0 && hpDelta === 0) {
          hpDelta += (clinicRegen > 0 ? 0.8 : 0.4);
        } else if (clinicRegen > 0 && nearHab && hpDelta >= 0) {
          hpDelta += clinicRegen; // Passive medical clinic treatment
        }

        const nextHp = Math.max(0, Math.min(DEFAULT_MAX_HEALTH, prevHp + hpDelta));
        if (nextHp <= 0) {
          setIsGameOver(true);
        }
        return nextHp;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [isGameActive, isPaused, isGameOver, isThreatActive]);

  // Player Actions: Toggle Flashlight
  const toggleFlashlight = useCallback(() => {
    if (batteryCharge <= 0 && !isFlashlightOn) {
      if (onLogMessage) onLogMessage('Cannot activate flashlight: Battery depleted!', 'warning');
      return false;
    }
    setIsFlashlightOn((prev) => !prev);
    return true;
  }, [batteryCharge, isFlashlightOn, onLogMessage]);

  // ==========================================
  // EXTENSIBLE VITALS & MODIFIER SYSTEM
  // Makes it simple to add future items, modules, or events that modify any vital
  // ==========================================
  const modifyVital = useCallback((vitalKey, amount, options = {}) => {
    const { logMessage = null, logType = amount >= 0 ? 'success' : 'warning', silent = false } = options;
    let actualDelta = 0;

    switch (vitalKey) {
      case 'sanity':
        setSanity((prev) => {
          const next = Math.max(0, Math.min(DEFAULT_MAX_SANITY, prev + amount));
          actualDelta = next - prev;
          return next;
        });
        break;
      case 'health':
        setHealth((prev) => {
          const next = Math.max(0, Math.min(DEFAULT_MAX_HEALTH, prev + amount));
          actualDelta = next - prev;
          return next;
        });
        break;
      case 'hunger':
        setHunger((prev) => {
          const next = Math.max(0, Math.min(DEFAULT_MAX_HUNGER, prev + amount));
          actualDelta = next - prev;
          return next;
        });
        break;
      case 'thirst':
        setThirst((prev) => {
          const next = Math.max(0, Math.min(DEFAULT_MAX_THIRST, prev + amount));
          actualDelta = next - prev;
          return next;
        });
        break;
      case 'o2':
        setO2((prev) => {
          const next = Math.max(0, Math.min(maxO2, prev + amount));
          actualDelta = next - prev;
          return next;
        });
        break;
      case 'bodyTemp':
        setBodyTemp((prev) => {
          const next = Math.max(18.0, Math.min(DEFAULT_BODY_TEMP, prev + amount));
          actualDelta = next - prev;
          return next;
        });
        break;
      default:
        console.warn(`[modifyVital] Unknown vital key: ${vitalKey}`);
        return 0;
    }

    if (!silent && logMessage && onLogMessage) {
      onLogMessage(logMessage, logType);
    }
    return actualDelta;
  }, [maxO2, onLogMessage]);

  // Apply multiple vital boosts at once (e.g. food, medkits, recreational events, modules)
  const applyVitalBoost = useCallback((boosts = {}, options = {}) => {
    const changes = {};
    Object.entries(boosts).forEach(([key, val]) => {
      if (typeof val === 'number') {
        changes[key] = modifyVital(key, val, { silent: true });
      }
    });
    if (options.logMessage && onLogMessage) {
      onLogMessage(options.logMessage, options.logType || 'success');
    }
    return changes;
  }, [modifyVital, onLogMessage]);

  // Player Actions: Eat Food
  const eatFood = useCallback(() => {
    if (foodRations <= 0) {
      if (onLogMessage) onLogMessage('No food rations! Harvest crops from Biodome.', 'warning');
      return false;
    }
    setFoodRations((f) => f - 1);
    applyVitalBoost(
      { hunger: 35, health: 10 },
      { logMessage: 'Ate fresh hydroponic meal (+35 Hunger, +10 HP).', logType: 'success' }
    );
    return true;
  }, [foodRations, applyVitalBoost, onLogMessage]);

  // Player Actions: Drink Water
  const drinkWater = useCallback(() => {
    if (waterRations <= 0) {
      if (onLogMessage) onLogMessage('No purified water! Melt ice at Water Purifier.', 'warning');
      return false;
    }
    setWaterRations((w) => w - 1);
    applyVitalBoost(
      { thirst: 40, health: 5 },
      { logMessage: 'Drank purified water (+40 Thirst, +5 HP).', logType: 'success' }
    );
    return true;
  }, [waterRations, applyVitalBoost, onLogMessage]);

  // Player Actions: Repair Crashed Lander Antenna (Field Salvage)
  const repairAntenna = useCallback(() => {
    if (isAntennaRepaired) {
      if (onLogMessage) onLogMessage('Antenna system is already fully operational.', 'info');
      return { success: false, reason: 'ALREADY_REPAIRED' };
    }
    if (!isNearHab()) {
      if (onLogMessage) onLogMessage('Must be at the Crashed Lander Base to repair the comms antenna!', 'warning');
      return { success: false, reason: 'NOT_NEAR_LANDER' };
    }
    const reqReg = ANTENNA_REPAIR_COST.regolith;
    const currentReg = materials?.regolith || 0;
    if (currentReg < reqReg) {
      if (onLogMessage) {
        onLogMessage(`Insufficient materials: requires ${reqReg} Regolith (have ${currentReg}).`, 'warning');
      }
      return { success: false, reason: 'INSUFFICIENT_MATERIALS' };
    }
    if (setMaterials) {
      setMaterials((prev) => ({
        ...prev,
        regolith: Math.max(0, (prev?.regolith || 0) - reqReg),
      }));
    }
    setIsAntennaRepaired(true);
    if (onLogMessage) {
      onLogMessage('📡 Lander Comms Antenna repaired and calibrated! Direct Earth link restored.', 'success');
    }
    return { success: true };
  }, [isAntennaRepaired, isNearHab, materials, setMaterials, onLogMessage]);

  // Player Actions: Call Earth Control (constrained by signal range & cooldown)
  const callEarth = useCallback(() => {
    const diplomatCooldown = commanderSpec === 'DIPLOMAT' ? Math.round(COMMS_COOLDOWN_SECONDS * 0.5) : COMMS_COOLDOWN_SECONDS;
    if (commsCooldown > 0) {
      if (onLogMessage) {
        onLogMessage(`Transceiver link cycling: please wait ${Math.ceil(commsCooldown)}s cooldown.`, 'warning');
      }
      return false;
    }

    if (batteryCharge < COMMS_ENERGY_COST) {
      if (onLogMessage) {
        onLogMessage(`⚡ Low Battery Power! Comms uplink requires ${COMMS_ENERGY_COST} kWh (Available: ${Math.floor(batteryCharge)} kWh).`, 'danger');
      }
      return false;
    }

    const currentSignal = getCommsSignalInfo(grid, playerPos, hasCommsTransceiver, isAntennaRepaired, habPos);
    if (!currentSignal.hasSignal) {
      if (currentSignal.antennaNeedsRepair) {
        if (onLogMessage) {
          onLogMessage('Lander comms antenna is damaged from the crash! Field repair required (20 Regolith).', 'danger');
        }
      } else if (currentSignal.noDishBuilt) {
        if (onLogMessage) {
          onLogMessage('No Comms Dish built on surface! Construct a Comms Dish or return to the Lander.', 'danger');
        }
      } else {
        if (onLogMessage) {
          onLogMessage(
            `Out of Comms Range! [Distance: ${currentSignal.nearestDist}m - Max: ${currentSignal.maxRange}m]. Move closer to base or dish.`,
            'danger'
          );
        }
      }
      return false;
    }

    setCommsCooldown(diplomatCooldown);
    setBatteryCharge((curr) => Math.max(0, curr - COMMS_ENERGY_COST));
    const sanityGain = commanderSpec === 'DIPLOMAT' ? 75 : 60;

    const CAVE_INTEL_TARGETS = [
      { id: 'turbine_core', type: TILE_TYPES.CAVE_TURBINE, x: 36, y: 120, name: { en: 'Turbine Core Nest', ar: 'وكر قلب التوربين المغناطيسي' }, desc: { en: 'Primary magnetic power core recovered from the Titan Weaver nest.', ar: 'قلب الطاقة المغناطيسي الرئيسي المسترد من وكر تيتان الحفارين.' } },
      { id: 'maya_sample', type: TILE_TYPES.CAVE_MAYA, x: 125, y: 45, name: { en: 'Maya Spore Grotto', ar: 'كهف عينات مايا الفطرية' }, desc: { en: 'Cold-resistant mycelial culture adapted to sub-zero Martian soils.', ar: 'سلالة فطرية معالجة تتكيف مع تربة المريخ في الصقيع القاتل.' } },
      { id: 'omar_geode', type: TILE_TYPES.CAVE_OMAR, x: 130, y: 130, name: { en: 'Omar Crystalline Chasm', ar: 'صدع عمر البلوري الرنيني' }, desc: { en: 'Harmonic superconducting crystal discovered by Geologist Omar.', ar: 'بلورة توافقية فائقة التوصيل اكتشفها الجيولوجي عمر.' } },
      { id: 'lina_crypt', type: TILE_TYPES.CAVE_LINA, x: 40, y: 35, name: { en: 'Lina Sub-Zero Crypt', ar: 'سرداب لينا الجليدي السحيق' }, desc: { en: 'Sub-surface cryo-water cavern with dense ice reservoirs.', ar: 'كهف جليدي سحيق يحتوي على مكامن جليد مائي عالية الكثافة.' } },
      { id: 'arsenal_depot', type: TILE_TYPES.CAVE_ARSENAL, x: 95, y: 140, name: { en: 'Prototype Arsenal Depot', ar: 'مستودع السلاح التجريبي السري' }, desc: { en: 'Crashed DARPA military drop capsule containing high-energy weaponry.', ar: 'حطام كبسولة إنزال عسكرية سرية تضم أسلحة بلازما متطورة.' } },
      { id: 'adam_citadel', type: TILE_TYPES.CAVE_ADAM, x: 15, y: 15, name: { en: 'Adam Research Citadel', ar: 'قلعة آدم للبحوث المتقدمة' }, desc: { en: 'Ancient xeno-structure housing uncatalogued geological specimens.', ar: 'منشأة جيولوجية قديمة تضم عينات نادرة غير مصنفة.' } },
    ];

    let intelReport = null;

    // 1. Critical Weather Alert Priority (Sol 4: storm arrives next Sol; Sol 5: storm raging)
    if (sol === 4) {
      intelReport = {
        id: `intel-weather-${Date.now()}`,
        category: 'WEATHER',
        sol,
        timestamp: Date.now(),
        sender: 'NASA Houston Weather Recon (Gen. Mansoor)',
        title: {
          en: '⚠️ CRITICAL WEATHER ALERT: Extreme Dust Storm Incoming',
          ar: '⚠️ إنذار مناخي استباقي: عاصفة غبار كارثية تقترب',
        },
        message: {
          en: 'MRO Satellite thermal scans confirm an extreme dust wall originating from Hellas Basin impacting your quadrant tomorrow on Sol 5! Solar generation will plunge by 80%. Charge all battery banks, secure water reserves, and harvest crops immediately.',
          ar: 'أكدت مسوحات قمر الاستطلاع المداري MRO وجود جدار غباري هائل قادم من حوض هيلاس سيضرب قطاعكم غداً في Sol 5! سينهار توليد الطاقة الشمسية بنسبة 80%. اشحن بنوك البطاريات بالكامل واحصد محاصيل القبة فوراً.',
        },
        targetCoords: null,
        targetLabel: null,
      };
    } else if (sol === DUST_STORM_SOL) {
      intelReport = {
        id: `intel-weather-${Date.now()}`,
        category: 'WEATHER',
        sol,
        timestamp: Date.now(),
        sender: 'NASA Houston Strategic Command (Gen. Mansoor)',
        title: {
          en: '🌪️ Planetary Dust Storm In Progress (-80% Solar)',
          ar: '🌪️ عاصفة ترابية نشطة: حالة تأهب قصوى (-80% طاقة)',
        },
        message: {
          en: 'Severe dust storm is engulfing Marineris sector right now. Solar irradiance at 20% baseline. Rely on thermal heaters and avoid long-distance nocturnal expeditions until the storm clears.',
          ar: 'عاصفة الغبار المريخية تجتاح قطاع مارينيريز الآن. الإشعاع الشمسي انخفض لـ 20%. اعتمد على التدفئة الحرارية ومخزون البطاريات وتجنب الرحلات الليلية الطويلة حتى عبور الجبهة.',
        },
        targetCoords: null,
        targetLabel: null,
      };
    } else {
      // Assemble candidate intel options for randomized selection
      const candidateTypes = [];

      // A) Spectral Thermal Wavelength Calibration (if proximity radar not yet calibrated)
      if (!isResourceRadarUnlocked) {
        candidateTypes.push('SPECTRAL_CALIBRATION');
      }

      // B) Subterranean Cave Landmark Discovery
      const unrevealedCave = CAVE_INTEL_TARGETS.find((c) => !orbitalPings.some((p) => p.x === c.x && p.y === c.y));
      if (unrevealedCave) {
        candidateTypes.push('CAVE');
      }

      // C) Remote High-Purity Water Ice Vein Survey
      let bestIce = null;
      let maxDist = 0;
      if (Array.isArray(grid)) {
        for (let gy = 0; gy < grid.length; gy += 4) {
          for (let gx = 0; gx < (grid[gy]?.length || 0); gx += 4) {
            if (grid[gy][gx]?.type === TILE_TYPES.ICE) {
              const dist = Math.hypot(gx - playerPos.x, gy - playerPos.y);
              const notAlreadyPinged = !orbitalPings.some((p) => Math.hypot(p.x - gx, p.y - gy) < 10);
              if (dist > 16 && dist > maxDist && notAlreadyPinged) {
                bestIce = { x: gx, y: gy };
                maxDist = dist;
              }
            }
          }
        }
      }
      if (bestIce) {
        candidateTypes.push('RESOURCE_VEIN');
      }

      // D) Strategic Mission Telemetry & Uplink Status
      candidateTypes.push('MISSION');

      // Randomly select one candidate from the available pool
      const chosenType = candidateTypes[Math.floor(Math.random() * candidateTypes.length)];

      if (chosenType === 'SPECTRAL_CALIBRATION') {
        setIsResourceRadarUnlocked(true);
        intelReport = {
          id: `intel-spectral-calibration-${Date.now()}`,
          category: 'RESOURCE',
          sol,
          timestamp: Date.now(),
          sender: 'NASA THEMIS / CRISM Planetary Spectroscopy (Houston)',
          title: {
            en: '📡 Spectral Calibration: Thermal Emissivity Bands (THEMIS / CRISM)',
            ar: '📡 معايرة طيفية: قنوات الانبعاث الحراري (THEMIS / CRISM)',
          },
          message: {
            en: 'Houston Geological Telemetry: "To detect iron-oxide rich basaltic regolith nodes, tune thermal sensors to emissivity band 9.25 μm at thermal inertia 310 J·m⁻²·K⁻¹·s⁻½. For sub-surface water ice, configure dielectric resonance to 15.5 MHz with 3.0 μm hydroxyl absorption spectrum. Spectral algorithm synchronized to your tactical radar array."',
            ar: 'برقية هيوستن الجيولوجية: "لرصد كتل صخور الريجوليث الغنية بأكاسيد الحديد، اضبط مستشعر البدلة على نطاق الانبعاث الحراري 9.25 μm بقصور حراري 310 J·m⁻²·K⁻¹·s⁻½. ولرصد جليد الماء المغمور، قمنا بتوليف الرادار الترددي على رنين عازل 15.5 MHz مع خط امتصاص هيدروكسيلي 3.0 μm. تم ربط خوارزمية المعايرة الطيفية برادارك التكتيكي بنجاح."',
          },
          targetCoords: null,
          targetLabel: null,
        };
      } else if (chosenType === 'CAVE' && unrevealedCave) {
        intelReport = {
          id: `intel-cave-${unrevealedCave.id}-${Date.now()}`,
          category: 'CAVE',
          sol,
          timestamp: Date.now(),
          sender: 'NASA Shallow Radar Recon (SHARAD Orbiter)',
          title: {
            en: '🛰️ Orbital Radar Recon: Subterranean Cave Landmark Located',
            ar: '🛰️ كشف راداري مداري: تم رصد كهف سحيق بالمسح الطيفي',
          },
          message: {
            en: `SHARAD high-frequency radar penetrated the Martian regolith and pinpointed entrance to [${unrevealedCave.name.en}] at Coords [${unrevealedCave.x}, ${unrevealedCave.y}]. ${unrevealedCave.desc.en} Telemetry locked onto your tactical radar!`,
            ar: `اخترق رادار SHARAD عالي التردد طبقات الثرى المريخي وحدد مدخل [${unrevealedCave.name.ar}] عند الإحداثيات [${unrevealedCave.x}, ${unrevealedCave.y}]. ${unrevealedCave.desc.ar} تم تثبيت الإحداثيات على رادارك التكتيكي!`,
          },
          targetCoords: { x: unrevealedCave.x, y: unrevealedCave.y },
          targetLabel: unrevealedCave.name,
        };
      } else if (chosenType === 'RESOURCE_VEIN' && bestIce) {
        intelReport = {
          id: `intel-res-${Date.now()}`,
          category: 'RESOURCE',
          sol,
          timestamp: Date.now(),
          sender: 'NASA THEMIS Multispectral Spectrometer',
          title: {
            en: '❄️ Spectral Survey: Sub-Surface Water Ice Vein Locked',
            ar: '❄️ مسح طيفي للموارد: رصد مكمن جليد ماء نقي',
          },
          message: {
            en: `Thermal infrared imagery detected substantial sub-surface water ice deposit at Sector [${bestIce.x}, ${bestIce.y}]. Beacon placed on your tactical radar to secure drinking water and oxygen generation.`,
            ar: `رصدت الأشعة تحت الحمراء تركيزاً غنياً لجليد الماء تحت السطحي في القطاع [${bestIce.x}, ${bestIce.y}]. تم تثبيت منارة على رادارك التكتيكي لتأمين مياه الشرب وتوليد الأكسجين.`,
          },
          targetCoords: bestIce,
          targetLabel: { en: 'High-Purity Water Ice Vein', ar: 'مكمن جليد ماء فائق النقاوة' },
        };
      } else {
        intelReport = {
          id: `intel-tactical-${Date.now()}`,
          category: 'MISSION',
          sol,
          timestamp: Date.now(),
          sender: 'Earth Strategic Command (Gen. Mansoor)',
          title: {
            en: '🚀 Strategic Telemetry: Houston Mission Status',
            ar: '🚀 برقية استراتيجية: حالة مهمة هيوستن',
          },
          message: {
            en: `Carrier link optimal. Satellite telemetry synchronized over Marineris sector. Base operations stable. 8 billion people on Earth are cheering for your survival and return!`,
            ar: `الاتصال الحامل مثالي. تم مزامنة بيانات الأقمار الصناعية فوق قطاع مارينيريز. عمليات القاعدة مستقرة. ثمانية مليارات إنسان يترقبون عودتك المظفرة!`,
          },
          targetCoords: null,
          targetLabel: null,
        };
      }
    }

    setCommsIntel(intelReport);

    if (intelReport.targetCoords) {
      setOrbitalPings((prev) => {
        const exists = prev.some((p) => p.x === intelReport.targetCoords.x && p.y === intelReport.targetCoords.y);
        if (exists) return prev;
        return [
          ...prev,
          {
            id: intelReport.id,
            x: intelReport.targetCoords.x,
            y: intelReport.targetCoords.y,
            category: intelReport.category,
            label: intelReport.targetLabel,
            sol,
            timestamp: Date.now(),
          },
        ];
      });
    }

    const logPreview = typeof intelReport.message === 'object' ? (intelReport.message.ar || intelReport.message.en) : intelReport.message;
    modifyVital('sanity', +sanityGain, {
      logMessage: `${intelReport.sender}: "${logPreview.slice(0, 75)}..." (+${sanityGain} Sanity, -${COMMS_ENERGY_COST} kWh)`,
      logType: 'success',
    });
    return true;
  }, [commsCooldown, commanderSpec, batteryCharge, grid, playerPos, hasCommsTransceiver, isAntennaRepaired, habPos, sol, orbitalPings, modifyVital]);

  // Player Actions: Harvest Crops from Biodome
  const harvestCrops = useCallback(() => {
    if (cropGrowth < 100) return false;
    setCropGrowth(0);
    let foodMultiplier = 1.0;
    for (const cId of (rescuedCrew || [])) {
      if (crewAssignments?.[cId] === 'BIODOME') {
        foodMultiplier += (cId === 'crew_maya' ? 1.0 : 0.4); // Maya ⭐: doubles yield (+100%), Others: +40%
      }
    }
    const foodYield = Math.max(3, Math.round(3 * foodMultiplier));
    setFoodRations((f) => f + foodYield);
    if (onLogMessage) {
      onLogMessage(`Harvested lush hydroponic spirulina crops (+${foodYield} Food Rations)!`, 'success');
    }
    return true;
  }, [cropGrowth, rescuedCrew, crewAssignments, onLogMessage]);

  // Player Actions: Purify Ice into Water
  const purifyWater = useCallback(() => {
    if (materials.ice <= 0) {
      if (onLogMessage) onLogMessage('No raw ice in storage to purify!', 'warning');
      return false;
    }
    setMaterials((m) => ({ ...m, ice: m.ice - 1 }));
    setWaterRations((w) => w + 2);
    if (onLogMessage) {
      onLogMessage('Melted and purified 1 Ice deposit into +2 Drinking Water rations.', 'success');
    }
    return true;
  }, [materials.ice, setMaterials, onLogMessage]);

  // Player Actions: Collect Stored Output from Autonomous Building (Clash of Clans style)
  const collectBuildingOutput = useCallback((tileX, tileY) => {
    if (!grid || !grid[tileY] || !grid[tileY][tileX]) return null;
    const tile = grid[tileY][tileX];
    const amount = tile.storedAmount || 0;
    if (amount <= 0) return null;

    let resType = null;
    if (tile.type === TILE_TYPES.BIODOME) {
      resType = 'FOOD';
      setFoodRations((f) => f + amount);
      setCropGrowth(0);
      if (onLogMessage) {
        onLogMessage(`Harvested +${amount} Food Rations from Biodome [${tileX}, ${tileY}]!`, 'success');
      }
    } else if (tile.type === TILE_TYPES.ICE_PURIFIER) {
      resType = 'WATER';
      setWaterRations((w) => w + amount);
      if (onLogMessage) {
        onLogMessage(`Collected +${amount} Drinking Water Rations from Melter [${tileX}, ${tileY}]!`, 'success');
      }
    } else if (tile.type === TILE_TYPES.SOLAR_ARRAY) {
      resType = 'ENERGY';
      const kwhGained = amount * 15;
      setBatteryCharge((curr) => Math.round(Math.min(powerMetrics.maxBatteryCapacity, curr + kwhGained) * 100) / 100);
      if (onLogMessage) {
        onLogMessage(`Collected +${amount} Emergency Cells (+${kwhGained} kWh) from Solar Array [${tileX}, ${tileY}]!`, 'success');
      }
    }

    if (setGrid) {
      setGrid((prevGrid) => {
        return prevGrid.map((row, ry) =>
          row.map((cell, rx) => {
            if (rx === tileX && ry === tileY) {
              return { ...cell, storedAmount: 0, productionProgress: 0 };
            }
            return cell;
          })
        );
      });
    }

    return { type: resType, amount };
  }, [grid, setGrid, onLogMessage, powerMetrics.maxBatteryCapacity]);

  // Player Actions: Deposit Raw Ice/Materials into Building Hopper (Melters / Biodomes)
  const depositResourceToBuilding = useCallback(
    (tileX, tileY, amount = 5) => {
      if (!grid || !grid[tileY] || !grid[tileY][tileX]) return false;
      const tile = grid[tileY][tileX];
      const maxCap = 15;
      const curInput = tile.inputAmount || 0;
      const spaceLeft = maxCap - curInput;
      if (spaceLeft <= 0) {
        if (onLogMessage) onLogMessage('خزان مدخلات المنشأة ممتلئ بالكامل (15 كجم)!', 'warning');
        return false;
      }

      const availableIce = materials?.ice || 0;
      if (availableIce <= 0) {
        if (onLogMessage) onLogMessage('لا يتوفر جليد خام في مخزن المستعمرة للتعبئة!', 'warning');
        return false;
      }

      const amountToTransfer = Math.min(amount, spaceLeft, availableIce);
      setMaterials((m) => ({ ...m, ice: m.ice - amountToTransfer }));

      setGrid((prevGrid) =>
        prevGrid.map((row, ry) =>
          row.map((cell, rx) => {
            if (rx === tileX && ry === tileY) {
              return { ...cell, inputAmount: curInput + amountToTransfer };
            }
            return cell;
          })
        )
      );

      if (onLogMessage) {
        onLogMessage(`تم تزويد المنشأة بـ +${amountToTransfer} كجم جليد خام (الخزان: ${curInput + amountToTransfer}/${maxCap} كجم).`, 'success');
      }
      return true;
    },
    [grid, setGrid, materials, setMaterials, onLogMessage]
  );

  // Resolve Threat
  const resolveThreat = (choiceId) => {
    if (choiceId === 'blackout') {
      setBlackoutUntilSol(sol + 1);
      setO2((prev) => Math.max(10, prev - 20));
      setHealth((prev) => Math.max(15, prev - 20));
    } else if (choiceId === 'sonic_decoy') {
      setMaterials((prev) => ({
        regolith: Math.max(0, prev.regolith - 25),
        ice: Math.max(0, prev.ice - 15),
      }));
    }
    setThreatResolved(true);
    setIsThreatActive(false);
  };

  // Reset Game
  const resetGame = () => {
    setSol(1);
    setSolTime(0);
    setHealth(DEFAULT_MAX_HEALTH);
    setSanity(DEFAULT_MAX_SANITY);
    setHunger(DEFAULT_MAX_HUNGER);
    setThirst(DEFAULT_MAX_THIRST);
    setO2(maxO2);
    setBodyTemp(DEFAULT_BODY_TEMP);
    setIsFlashlightOn(false);
    setCommsCooldown(0);
    setIsAntennaRepaired(Boolean(hasCommsTransceiver));
    setFoodRations(INITIAL_FOOD_RATIONS + (hasFoodPack ? 15 : 0));
    setWaterRations(INITIAL_WATER_RATIONS + (hasWaterTank ? 15 : 0));
    setCropGrowth(0);
    setBatteryCharge(20 + (hasBatteryPack ? 20 : 0) + (commanderSpec === 'ENERGY' ? 10 : 0));
    setIsGameOver(false);
    setIsPaused(false);
    setIsThreatActive(false);
    setThreatResolved(false);
    setBlackoutUntilSol(null);
  };

  const damagePlayer = useCallback((amount) => {
    setHealth((curr) => {
      const nextHp = Math.max(0, curr - amount);
      if (nextHp <= 0) {
        setIsGameOver(true);
      }
      return nextHp;
    });
    setSanity((curr) => Math.max(0, curr - 4));
  }, []);

  const drainBattery = useCallback((amount) => {
    setBatteryCharge((curr) => Math.round(Math.max(0, curr - amount) * 100) / 100);
  }, []);

  const rechargeBattery = useCallback((amount = 15) => {
    setBatteryCharge((curr) => Math.round(Math.min(powerMetrics.maxBatteryCapacity, curr + amount) * 100) / 100);
    return true;
  }, [powerMetrics.maxBatteryCapacity]);

  const commsSignalInfo = getCommsSignalInfo(grid, playerPos, hasCommsTransceiver, isAntennaRepaired, habPos);
  const curBackpackLoad =
    (backpack?.regolith || 0) +
    (backpack?.ice || 0) +
    (backpack?.bioSamples || 0) +
    (backpack?.plasmaCrystals || 0) +
    (backpack?.xenoCores || 0) +
    (backpack?.xenoCrystals || 0);
  const backpackLoadRatio = Math.min(1.0, Math.max(0, curBackpackLoad / (backpackCapacity || 20)));
  const isHeavyPack = backpackLoadRatio >= 0.75;
  const loadSpeedMultiplier = isHeavyPack ? (1 - (backpackLoadRatio - 0.75) * 0.4) : 1.0;
  const thermalSpeedMultiplier =
    (bodyTemp < FREEZING_BODY_TEMP ? 0.55 : (bodyTemp < CHILLY_BODY_TEMP ? 0.80 : 1.0)) * loadSpeedMultiplier;

  // Phase 2: Orbital Window Status Calculation
  const orbitalWindowStatus =
    sol <= 15 ? 'OPTIMAL' : sol <= 25 ? 'CAUTION' : sol <= ORBITAL_WINDOW_SOLS ? 'CRITICAL' : 'OVERTIME';

  return {
    sol,
    solProgress: solTime / SOL_DURATION_SECONDS,
    solTimeRemaining: Math.ceil(SOL_DURATION_SECONDS - solTime),
    isDay: powerMetrics.isDay,
    nightFactor: powerMetrics.nightFactor,
    temperature: powerMetrics.temperature,
    isFreezing: powerMetrics.isFreezing,
    bodyTemp,
    isFlashlightOn,
    toggleFlashlight,
    commsInfo: commsSignalInfo,
    commsCooldown,
    commsIntel,
    orbitalPings,
    setOrbitalPings,
    isResourceRadarUnlocked,
    setIsResourceRadarUnlocked,
    thermalSpeedMultiplier,
    backpackLoadRatio,
    isHeavyPack,
    isExerting: Boolean(isMoving || isMining),
    batteryCharge,
    maxBatteryCapacity: powerMetrics.maxBatteryCapacity,
    powerMetrics,
    // Phase 2: Weather & Orbital Window Systems
    isDustStormActive: sol === DUST_STORM_SOL,
    orbitalWindowStatus,
    orbitalWindowSols: ORBITAL_WINDOW_SOLS,
    // Phase 2: Adaptive Comms Antenna
    isAntennaRepaired,
    repairAntenna,
    // Phase 2 & 3: Dynamic Loadout, Specialization, Crew & Experimental Emitter Multipliers
    buildingCostMultiplier: commanderSpec === 'STRATEGIST' ? 0.75 : 1.0,
    blasterDamageMultiplier:
      (commanderSpec === 'WARRIOR' ? 1.35 : 1.0) *
      (loadout.includes('weapon_capacitor') ? 1.35 : 1.0) *
      (craftedUpgrades.includes('ares_energy_emitter') ? 2.5 : 1.0) *
      (() => {
        let mult = 1.0;
        for (const cId of (rescuedCrew || [])) {
          if (crewAssignments?.[cId] === 'DEFENSE') mult += 0.25;
        }
        return mult;
      })(),
    miningSpeedMultiplier:
      (hasHeavyDrill ? 1.5 : 1.0) *
      (craftedUpgrades.includes('ares_energy_emitter') ? 2.0 : 1.0),
    miningYieldMultiplier:
      (commanderSpec === 'SCIENTIST' ? 1.4 : 1.0) *
      (() => {
        let mult = 1.0;
        for (const cId of (rescuedCrew || [])) {
          if (crewAssignments?.[cId] === 'MINES') {
            mult += (cId === 'crew_omar' ? 1.5 : 0.4); // Omar ⭐: +150%, Others: +40%
          }
        }
        return mult;
      })(),
    // Vitals
    health,
    sanity,
    hunger,
    thirst,
    o2,
    maxO2,
    foodRations,
    waterRations,
    cropGrowth,
    isNearHab: isNearHab(),
    hasCommsAccess: commsSignalInfo.hasSignal,
    isThreatActive,
    threatResolved,
    isGameOver,
    isPaused,
    setIsPaused,
    advanceSol,
    eatFood,
    drinkWater,
    callEarth,
    harvestCrops,
    purifyWater,
    collectBuildingOutput,
    depositResourceToBuilding,
    resolveThreat,
    resetGame,
    damagePlayer,
    drainBattery,
    rechargeBattery,
    // Extensible Vitals System
    modifyVital,
    applyVitalBoost,
  };
};
