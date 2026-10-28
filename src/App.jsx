import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  generateInitialGrid,
  generateInitialEnemies,
  spawnSingleBurrower,
} from './utils/gridHelpers';
import { preloadSprites } from './utils/spriteLoader';
import {
  GRID_SIZE,
  BUILDINGS,
  BUILDING_UPGRADES,
  DEFAULT_BACKPACK_CAPACITY,
  DEFAULT_VEHICLE_CAPACITY,
  TILE_TYPES,
  CAVE_RELICS,
  ORBITAL_WINDOW_SOLS,
  isToggleablePowerBuilding,
} from './types/gameTypes';
import { translations } from './types/translations';
import { useKeyboard } from './hooks/useKeyboard';
import { useGameLoop } from './hooks/useGameLoop';
import { TacticalTabletModal } from './components/TacticalTabletModal';
import { TopBar } from './components/TopBar';
import { CanvasView, getSurfaceCrewStations } from './components/CanvasView';
import { MobileControls } from './components/MobileControls';
import { Minimap } from './components/Minimap';
import { VitalsHUD } from './components/VitalsHUD';
import { CaveExplorerModal } from './components/CaveExplorerModal';
import { CavePropModal } from './components/CavePropModal';
import { CrewDialogueModal } from './components/CrewDialogueModal';
import { CREW_MEMBERS, ASSIGNABLE_ROLES } from './utils/astronautRenderer';
import { generateCaveLevel } from './utils/caveGenerator';
import {
  RotateCcw,
  Trophy,
  Skull,
  Terminal,
  Settings,
  HelpCircle,
  X,
  Sparkles,
} from 'lucide-react';

// Web Audio API Procedural Sound Synthesizer
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBeep(freq = 600, duration = 0.08, type = 'sine') {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playAlarm() {
    if (this.muted) return;
    this.playBeep(880, 0.15, 'sawtooth');
  }

  playBuild() {
    if (this.muted) return;
    this.playBeep(520, 0.1, 'triangle');
    setTimeout(() => this.playBeep(780, 0.12, 'sine'), 80);
  }

  playLaunch() {
    if (this.muted) return;
    this.playBeep(220, 0.2, 'sawtooth');
    setTimeout(() => this.playBeep(440, 0.3, 'sine'), 150);
  }

  playDeposit() {
    if (this.muted) return;
    this.playBeep(400, 0.08, 'sine');
    setTimeout(() => this.playBeep(600, 0.1, 'triangle'), 60);
  }

  playUpgrade() {
    if (this.muted) return;
    this.playBeep(440, 0.1, 'triangle');
    setTimeout(() => this.playBeep(660, 0.12, 'triangle'), 80);
    setTimeout(() => this.playBeep(880, 0.16, 'sine'), 160);
  }

  playEat() {
    if (this.muted) return;
    this.playBeep(320, 0.06, 'sine');
    setTimeout(() => this.playBeep(420, 0.08, 'sine'), 60);
  }

  playDrink() {
    if (this.muted) return;
    this.playBeep(500, 0.06, 'triangle');
    setTimeout(() => this.playBeep(650, 0.08, 'sine'), 50);
  }

  playComms() {
    if (this.muted) return;
    this.playBeep(800, 0.1, 'sine');
    setTimeout(() => this.playBeep(1200, 0.15, 'sine'), 90);
  }

  playBlaster() {
    if (this.muted) return;
    this.playBeep(920, 0.05, 'sawtooth');
    setTimeout(() => this.playBeep(480, 0.06, 'sine'), 25);
  }

  playAlienHit() {
    if (this.muted) return;
    this.playBeep(240, 0.07, 'square');
  }

  playAlienDefeat() {
    if (this.muted) return;
    this.playBeep(160, 0.12, 'sawtooth');
    setTimeout(() => this.playBeep(280, 0.1, 'triangle'), 60);
    setTimeout(() => this.playBeep(720, 0.14, 'sine'), 130);
  }

  playXenoCollect() {
    if (this.muted) return;
    this.playBeep(650, 0.07, 'sine');
    setTimeout(() => this.playBeep(980, 0.1, 'sine'), 50);
    setTimeout(() => this.playBeep(1320, 0.12, 'triangle'), 110);
  }

  playPlayerHurt() {
    if (this.muted) return;
    this.playBeep(180, 0.1, 'sawtooth');
    setTimeout(() => this.playBeep(120, 0.12, 'square'), 70);
  }
}

const sfx = new SoundFX();

export default function App() {
  const [lang, setLang] = useState('ar');
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [gameStage, setGameStage] = useState('PROLOGUE');
  const [soundEnabled, setSoundEnabled] = useState(true);
  // Unified Tactical Tablet Modal State
  const [isTabletOpen, setIsTabletOpen] = useState(true);
  const [tabletView, setTabletView] = useState('PROLOGUE'); // 'PROLOGUE' | 'BUILD' | 'INSPECT' | 'CRAFTING' | 'PDA' | 'THREAT' | 'GAMEOVER' | 'VICTORY'
  const [alwaysShowJoystick, setAlwaysShowJoystick] = useState(false);
  const [activeCaveType, setActiveCaveType] = useState('CAVE_TURBINE');
  const [isCaveModalOpen, setIsCaveModalOpen] = useState(false);
  const [activeCaveLocation, setActiveCaveLocation] = useState(null);
  const [surfaceWorldBackup, setSurfaceWorldBackup] = useState(null);
  const surfaceWorldBackupRef = useRef(null);
  const [inspectedCavePropTile, setInspectedCavePropTile] = useState(null);
  const [activeDialogueCrewId, setActiveDialogueCrewId] = useState(null);

  // Phase 3: Rescued Ares-I Crew & Tactical Assignments (Maya, Omar, Lina, Adam)
  const [rescuedCrew, setRescuedCrew] = useState([]);
  const [crewAssignments, setCrewAssignments] = useState({
    crew_maya: 'BIODOME',
    crew_omar: 'MINES',
    crew_lina: 'CLINIC',
    crew_adam: 'GRID',
  });

  useEffect(() => {
    preloadSprites();
  }, []);

  // Commander Specialization & Custom Callsign (from Prologue)
  const [commanderSpec, setCommanderSpec] = useState(null);
  const [commanderName, setCommanderName] = useState('صلاح');

  // Pre-launch Loadout
  const [selectedLoadout, setSelectedLoadout] = useState(['extra_o2', 'bio_seeds', 'comms_transceiver']);

  // Initial Grid & Positions (Center on 24x24 world; player spawns in open central plaza)
  const [gridData, setGridData] = useState(() => generateInitialGrid());

  // Ensure 2x2 rover footprint consistency and clear any craters under it across active sessions
  useEffect(() => {
    if (!gridData?.grid || !gridData?.vehiclePosition) return;
    const { x: vx, y: vy } = gridData.vehiclePosition;
    let needsSync = false;
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const cell = gridData.grid[vy + dy]?.[vx + dx];
        if (!cell || cell.type !== TILE_TYPES.VEHICLE || cell.crater || cell.resourceAmount > 0) {
          needsSync = true;
        }
      }
    }
    if (needsSync) {
      setGridData((prev) => {
        const nextGrid = prev.grid.map((row) => row.map((c) => ({ ...c })));
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            if (nextGrid[vy + dy]?.[vx + dx]) {
              nextGrid[vy + dy][vx + dx].type = TILE_TYPES.VEHICLE;
              nextGrid[vy + dy][vx + dx].isVehicle = true;
              nextGrid[vy + dy][vx + dx].crater = false;
              nextGrid[vy + dy][vx + dx].resourceAmount = 0;
              nextGrid[vy + dy][vx + dx].maxResourceAmount = 0;
            }
          }
        }
        return { ...prev, grid: nextGrid };
      });
    }
  }, [gridData]);

  const [playerPos, setPlayerPos] = useState(() => gridData.playerSpawn || { x: 81, y: 80 });

  // Camera Viewport tracking
  const [cameraViewport, setCameraViewport] = useState({ x: 75, y: 75, width: 14, height: 14 });

  // Persistent Fog of War explored sectors buffer (160x160 bytes)
  const exploredTilesRef = useRef(null);

  // Initialize or re-sync explored tiles buffer with realistic atmospheric base perimeter around Ares lander
  const initFogBuffer = useCallback(() => {
    const buf = new Uint8Array(GRID_SIZE * GRID_SIZE);
    const vX = gridData?.vehiclePosition?.x ?? Math.floor(GRID_SIZE / 2);
    const vY = gridData?.vehiclePosition?.y ?? Math.floor(GRID_SIZE / 2);
    const hasDrone = selectedLoadout?.includes('mapping_drone');
    // Sanctuary lit base perimeter around Ares lander: 4.2 tiles (5.5 with mapping drone)
    const baseRadius = hasDrone ? 5.5 : 4.2;
    const centerX = vX + 1.0;
    const centerY = vY + 1.0;
    for (let y = Math.max(0, Math.floor(centerY - baseRadius)); y <= Math.min(GRID_SIZE - 1, Math.ceil(centerY + baseRadius)); y++) {
      for (let x = Math.max(0, Math.floor(centerX - baseRadius)); x <= Math.min(GRID_SIZE - 1, Math.ceil(centerX + baseRadius)); x++) {
        if (Math.hypot(x - centerX, y - centerY) <= baseRadius) {
          buf[y * GRID_SIZE + x] = 1;
        }
      }
    }
    return buf;
  }, [gridData?.vehiclePosition?.x, gridData?.vehiclePosition?.y, selectedLoadout]);

  if (!exploredTilesRef.current) {
    exploredTilesRef.current = initFogBuffer();
  }

  // Ensure buffer updates whenever loadout changes without destroying explored terrain
  useEffect(() => {
    if (!exploredTilesRef.current) {
      exploredTilesRef.current = initFogBuffer();
    } else {
      const initialBuf = initFogBuffer();
      for (let i = 0; i < initialBuf.length; i++) {
        if (initialBuf[i] === 1) exploredTilesRef.current[i] = 1;
      }
    }
  }, [initFogBuffer]);

  // Suit Backpack Inventory
  const [backpack, setBackpack] = useState({
    regolith: 0,
    ice: 0,
    bioSamples: 0,
    plasmaCrystals: 0,
    xenoCores: 0,
    xenoCrystals: 0,
  });

  // Rover Storage
  const [vehicleMaterials, setVehicleMaterials] = useState({
    regolith: 25,
    ice: 15,
    bioSamples: 0,
    plasmaCrystals: 0,
    xenoCores: 0,
    xenoCrystals: 0,
  });

  // Phase 4: Martian Burrowers (Hostile Native Entities across 160x160 world)
  const [enemies, setEnemies] = useState(() => generateInitialEnemies(gridData.vehiclePosition, 55));

  // Mobile / External Blaster Fire Trigger
  const [blasterTriggerCount, setBlasterTriggerCount] = useState(0);

  // Crafted Upgrades
  const [craftedUpgrades, setCraftedUpgrades] = useState([]);

  const backpackCapacity =
    DEFAULT_BACKPACK_CAPACITY +
    (craftedUpgrades.includes('pack_expansion') ? 15 : 0);

  const vehicleCapacity =
    DEFAULT_VEHICLE_CAPACITY +
    (craftedUpgrades.includes('vehicle_expansion') ? 150 : 0);

  const [activeBuilding, setActiveBuilding] = useState(null);
  const [isMining, setIsMining] = useState(false);

  // Phase 2: Building Inspection, Upgrades & Relocation States
  const [inspectedBuildingTile, setInspectedBuildingTile] = useState(null);
  const [relocatingBuilding, setRelocatingBuilding] = useState(null);

  // Virtual Mobile Inputs
  const [virtualKeys, setVirtualKeys] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
  });

  // Logs
  const [logs, setLogs] = useState([
    { id: 1, text: 'Ares-VII Touchdown on 24x24 expansive Martian surface.', type: 'info', time: 'SOL 01' },
    { id: 2, text: 'Keep close watch on Health, Sanity, Food, and Hydration.', type: 'success', time: 'SOL 01' },
  ]);

  const addLog = useCallback((text, type = 'info') => {
    setLogs((prev) => [
      { id: Date.now() + Math.random(), text, type, time: 'TELEMETRY' },
      ...prev.slice(0, 24),
    ]);
  }, []);

  const isPlaying = gameStage === 'PLAYING';
  const keys = useKeyboard(isPlaying && !isTabletOpen && !isCaveModalOpen);

  const activeControls = {
    up: keys.up || virtualKeys.up,
    down: keys.down || virtualKeys.down,
    left: keys.left || virtualKeys.left,
    right: keys.right || virtualKeys.right,
    space: keys.space || virtualKeys.space,
    e: keys.e || virtualKeys.e,
    c: keys.c,
  };

  const [playerFacing, setPlayerFacing] = useState('down');
  useEffect(() => {
    if (activeControls.right) setPlayerFacing('right');
    else if (activeControls.left) setPlayerFacing('left');
    else if (activeControls.up) setPlayerFacing('up');
    else if (activeControls.down) setPlayerFacing('down');
  }, [activeControls.right, activeControls.left, activeControls.up, activeControls.down]);

  const isMoving = Boolean(
    activeControls.up ||
    activeControls.down ||
    activeControls.left ||
    activeControls.right
  );

  // Complete Game Loop Hook
  const {
    sol,
    solProgress,
    solTimeRemaining,
    isDay,
    temperature,
    isFreezing,
    bodyTemp,
    isFlashlightOn,
    toggleFlashlight,
    commsInfo,
    commsCooldown,
    commsIntel,
    orbitalPings,
    isResourceRadarUnlocked,
    thermalSpeedMultiplier,
    batteryCharge,
    maxBatteryCapacity,
    powerMetrics,
    health,
    sanity,
    hunger,
    thirst,
    o2,
    maxO2,
    foodRations,
    waterRations,
    cropGrowth,
    isNearHab,
    hasCommsAccess,
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
    modifyVital,
    applyVitalBoost,
    // Phase 2: Weather, Orbital Window, Adaptive Comms & Multipliers
    isDustStormActive,
    orbitalWindowStatus,
    orbitalWindowSols,
    isAntennaRepaired,
    repairAntenna,
    buildingCostMultiplier,
    blasterDamageMultiplier,
    miningSpeedMultiplier,
    miningYieldMultiplier,
  } = useGameLoop({
    loadout: selectedLoadout,
    commanderSpec,
    craftedUpgrades,
    grid: gridData.grid,
    setGrid: (updater) => {
      setGridData((prev) => ({
        ...prev,
        grid: typeof updater === 'function' ? updater(prev.grid) : updater,
      }));
    },
    playerPos,
    habPos: gridData.habPosition,
    vehiclePos: gridData.vehiclePosition,
    isGameActive: isPlaying,
    isMoving,
    isMining,
    materials: vehicleMaterials,
    setMaterials: setVehicleMaterials,
    backpack,
    backpackCapacity,
    onLogMessage: addLog,
    rescuedCrew,
    crewAssignments,
    activeCaveInfo: activeCaveLocation?.info,
  });

  const toggleSound = () => {
    sfx.muted = soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  const handleToggleLoadoutItem = (itemId) => {
    sfx.playBeep(480, 0.05);
    setSelectedLoadout((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleConfirmLaunch = (launchData) => {
    sfx.playLaunch();
    const spec = typeof launchData === 'string' ? launchData : launchData?.spec;
    const name = (typeof launchData === 'object' && launchData?.commanderName) ? launchData.commanderName : commanderName;
    if (spec) setCommanderSpec(spec);
    if (name) setCommanderName(name);

    const isArabic = lang === 'ar';
    const hasTransceiver = selectedLoadout.includes('comms_transceiver');
    const hasDrone = selectedLoadout.includes('mapping_drone');

    const initialLogs = [
      {
        id: 1,
        text: isArabic
          ? `هبوط اضطراري في قطاع مارينيريز: نجا القائد [${name}] (${spec || 'مستكشف'}). البدلة تعمل بنمط الطوارئ.`
          : `Violent touchdown in Valles Marineris: Commander [${name}] (${spec || 'Explorer'}) survived. Suit online.`,
        type: 'warning',
        time: 'SOL 01',
      },
      hasTransceiver
        ? {
            id: 2,
            text: isArabic
              ? `جهاز اتصال البدلة التكتيكي نشط: تم تأمين اتصال مباشر فوري مع القيادة العامة بالأرض.`
              : `Tactical suit transceiver online: immediate direct satellite link secured with Earth Command.`,
            type: 'success',
            time: 'SOL 01',
          }
        : {
            id: 2,
            text: isArabic
              ? `تحطم هوائي مركبة الهبوط! الاتصال بالأرض مقطوع. يلزم صيانة ميدانية (20 ريجوليث).`
              : `Lander antenna destroyed upon impact! Earth link severed. Field repair required (20 Regolith).`,
            type: 'danger',
            time: 'SOL 01',
          },
      {
        id: 3,
        text: isArabic
          ? `رصد نبضات استغاثة لطاقم آريس-1 (مايا، عمر، لينا، آدم) تومض من باطن الكهوف العميقة...`
          : `Subterranean distress pings from Ares-I crew (Maya, Omar, Lina, Adam) detected in deep caves...`,
        type: 'info',
        time: 'SOL 01',
      },
    ];

    if (hasDrone) {
      initialLogs.push({
        id: 4,
        text: isArabic
          ? `درون المسح الجوي انطلق بنجاح: تم توسيع نطاق كشف الرادار التكتيكي عبر القطاع.`
          : `Aerial mapping drone deployed: tactical sonar range expanded across the sector.`,
        type: 'success',
        time: 'SOL 01',
      });
    }

    setLogs(initialLogs);
    setGameStage('PLAYING');
    setIsTabletOpen(false);
  };

  // Symmetric 2x2 bounding box proximity to Rover & Base
  const vx = gridData.vehiclePosition.x;
  const vy = gridData.vehiclePosition.y;
  const clx = Math.max(vx, Math.min(playerPos.x, vx + 1));
  const cly = Math.max(vy, Math.min(playerPos.y, vy + 1));
  const distToRover = Math.hypot(playerPos.x - clx, playerPos.y - cly);

  let nearDepotFound = false;
  if (Array.isArray(gridData?.grid)) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = Math.round(playerPos.x) + dx;
        const ty = Math.round(playerPos.y) + dy;
        const tileType = gridData.grid[ty]?.[tx]?.type;
        if (tileType === TILE_TYPES.HAB || tileType === TILE_TYPES.VEHICLE) {
          nearDepotFound = true;
          break;
        }
      }
      if (nearDepotFound) break;
    }
  }

  const isNearVehicle = distToRover <= 2.2 || nearDepotFound;

  const handleOpenCargoModal = useCallback(() => {
    setTabletView('BACKPACK');
    setIsTabletOpen(true);
    sfx.playBeep(650, 0.06);
  }, [sfx]);

  // Deposit Cargo into Rover
  const handleDepositCargo = useCallback(() => {
    const totalBackpack =
      (backpack.regolith || 0) +
      (backpack.ice || 0) +
      (backpack.bioSamples || 0) +
      (backpack.plasmaCrystals || 0) +
      (backpack.xenoCores || 0) +
      (backpack.xenoCrystals || 0);

    if (totalBackpack === 0) {
      handleOpenCargoModal();
      addLog(
        lang === 'ar'
          ? 'ℹ️ حقيبة البدلة فارغة (0 كجم) - تم فتح مستودع المركبة لإدارة الموارد'
          : 'ℹ️ Suit backpack is empty (0 kg) - Opened rover cargo depot to manage supplies',
        'info'
      );
      return;
    }

    const currentVehicleLoad =
      (vehicleMaterials.regolith || 0) +
      (vehicleMaterials.ice || 0) +
      (vehicleMaterials.bioSamples || 0) +
      (vehicleMaterials.plasmaCrystals || 0) +
      (vehicleMaterials.xenoCores || 0) +
      (vehicleMaterials.xenoCrystals || 0);
    const spaceLeft = vehicleCapacity - currentVehicleLoad;

    if (spaceLeft <= 0) {
      addLog(t.roverFull, 'danger');
      sfx.playPlayerHurt();
      return;
    }

    let remainingSpace = spaceLeft;
    const regToTransfer = Math.min(backpack.regolith || 0, remainingSpace);
    remainingSpace -= regToTransfer;
    const iceToTransfer = Math.min(backpack.ice || 0, remainingSpace);
    remainingSpace -= iceToTransfer;
    const bioToTransfer = Math.min(backpack.bioSamples || 0, remainingSpace);
    remainingSpace -= bioToTransfer;
    const plasmaToTransfer = Math.min(backpack.plasmaCrystals || backpack.xenoCrystals || 0, remainingSpace);
    remainingSpace -= plasmaToTransfer;
    const coresToTransfer = Math.min(backpack.xenoCores || 0, remainingSpace);
    remainingSpace -= coresToTransfer;

    setVehicleMaterials((v) => ({
      ...v,
      regolith: (v.regolith || 0) + regToTransfer,
      ice: (v.ice || 0) + iceToTransfer,
      bioSamples: (v.bioSamples || 0) + bioToTransfer,
      plasmaCrystals: (v.plasmaCrystals || 0) + plasmaToTransfer,
      xenoCrystals: (v.xenoCrystals || 0) + plasmaToTransfer,
      xenoCores: (v.xenoCores || 0) + coresToTransfer,
    }));

    setBackpack((b) => ({
      ...b,
      regolith: (b.regolith || 0) - regToTransfer,
      ice: (b.ice || 0) - iceToTransfer,
      bioSamples: (b.bioSamples || 0) - bioToTransfer,
      plasmaCrystals: (b.plasmaCrystals || 0) - plasmaToTransfer,
      xenoCrystals: (b.xenoCrystals || 0) - plasmaToTransfer,
      xenoCores: (b.xenoCores || 0) - coresToTransfer,
    }));

    sfx.playDeposit();
    const parts = [];
    if (regToTransfer > 0) parts.push(`+${regToTransfer} R`);
    if (iceToTransfer > 0) parts.push(`+${iceToTransfer} I`);
    if (bioToTransfer > 0) parts.push(`+${bioToTransfer} 🧬`);
    if (plasmaToTransfer > 0) parts.push(`+${plasmaToTransfer} ⚡`);
    if (coresToTransfer > 0) parts.push(`+${coresToTransfer} ⚛️`);
    addLog(`${t.depositSuccess} (${parts.join(', ')})`, 'success');
  }, [backpack, vehicleMaterials, vehicleCapacity, addLog, t, lang, sfx, handleOpenCargoModal]);

  const handleWithdrawCargo = useCallback((resourceType, amount = 5) => {
    const currentBackpackLoad =
      (backpack.regolith || 0) +
      (backpack.ice || 0) +
      (backpack.bioSamples || 0) +
      (backpack.plasmaCrystals || 0) +
      (backpack.xenoCores || 0) +
      (backpack.xenoCrystals || 0);
    const spaceLeft = backpackCapacity - currentBackpackLoad;
    if (spaceLeft <= 0) {
      addLog(t.backpackFull, 'danger');
      sfx.playPlayerHurt();
      return;
    }

    const availableInRover = vehicleMaterials[resourceType] || 0;
    if (availableInRover <= 0) {
      addLog(
        lang === 'ar'
          ? `⚠️ لا يتوفر هذا المورد في مستودع المركبة!`
          : `⚠️ No ${resourceType} available in rover storage!`,
        'danger'
      );
      sfx.playBeep(350, 0.05);
      return;
    }

    const transferAmount = Math.min(amount, availableInRover, spaceLeft);
    if (transferAmount <= 0) return;

    setVehicleMaterials((prev) => ({
      ...prev,
      [resourceType]: Math.max(0, (prev[resourceType] || 0) - transferAmount),
    }));

    setBackpack((prev) => ({
      ...prev,
      [resourceType]: (prev[resourceType] || 0) + transferAmount,
    }));

    sfx.playDeposit();
    addLog(
      lang === 'ar'
        ? `📦 تم سحب +${transferAmount} من المستودع إلى الحقيبة بنجاح.`
        : `📦 Withdrew +${transferAmount} from rover hold into backpack.`,
      'success'
    );
  }, [backpack, backpackCapacity, vehicleMaterials, lang, t, addLog, sfx]);

  const handleTransferCargoResource = useCallback((type, direction, amount = 5) => {
    if (direction === 'toBackpack') {
      handleWithdrawCargo(type, amount);
    } else if (direction === 'toRover') {
      const currentVehicleLoad =
        (vehicleMaterials.regolith || 0) +
        (vehicleMaterials.ice || 0) +
        (vehicleMaterials.bioSamples || 0) +
        (vehicleMaterials.plasmaCrystals || 0) +
        (vehicleMaterials.xenoCores || 0) +
        (vehicleMaterials.xenoCrystals || 0);
      const roverSpaceLeft = vehicleCapacity - currentVehicleLoad;
      if (roverSpaceLeft <= 0) {
        addLog(t.roverFull, 'danger');
        sfx.playPlayerHurt();
        return;
      }

      const availableInPack = backpack[type] || 0;
      if (availableInPack <= 0) {
        addLog(
          lang === 'ar'
            ? `⚠️ لا يتوفر هذا المورد في حقيبة البدلة!`
            : `⚠️ No ${type} in suit backpack!`,
          'danger'
        );
        sfx.playBeep(350, 0.05);
        return;
      }

      const transferAmount = Math.min(amount, availableInPack, roverSpaceLeft);
      if (transferAmount <= 0) return;

      setVehicleMaterials((prev) => ({
        ...prev,
        [type]: (prev[type] || 0) + transferAmount,
      }));

      setBackpack((prev) => ({
        ...prev,
        [type]: Math.max(0, (prev[type] || 0) - transferAmount),
      }));

      sfx.playDeposit();
      addLog(
        lang === 'ar'
          ? `📥 تم إيداع +${transferAmount} في مستودع المركبة.`
          : `📥 Deposited +${transferAmount} into rover storage hold.`,
        'success'
      );
    }
  }, [handleWithdrawCargo, backpack, vehicleMaterials, vehicleCapacity, lang, t, addLog, sfx]);

  // Phase 4: Combat & Alien Encounter Handlers
  const handlePlayerDamaged = useCallback((amount) => {
    damagePlayer(amount);
    sfx.playPlayerHurt();
    addLog(t.alienAttackWarning || 'CRITICAL: Martian Burrower strike! Suit damaged!', 'danger');
  }, [damagePlayer, addLog, t]);

  const handleEnemyDefeated = useCallback((enemyId, pos) => {
    setEnemies((prev) => prev.filter((e) => e.id !== enemyId));
    sfx.playAlienDefeat();
    addLog(t.alienEliminated || 'Martian Burrower neutralized!', 'success');

    // Dynamic respawn after 18-28 seconds
    setTimeout(() => {
      setEnemies((current) => {
        if (current.length >= 35) return current;
        const newEnemy = spawnSingleBurrower(gridData.vehiclePosition, playerPos);
        return newEnemy ? [...current, newEnemy] : current;
      });
    }, 18000 + Math.random() * 10000);
  }, [addLog, t, sfx, gridData.vehiclePosition, playerPos]);

  // Periodic enemy population maintenance across 100x100 Martian expanse
  useEffect(() => {
    if (gameStage !== 'PLAYING') return;

    const interval = setInterval(() => {
      setEnemies((current) => {
        if (current.length < 35) {
          const newEnemy = spawnSingleBurrower(gridData.vehiclePosition, playerPos);
          if (newEnemy) {
            return [...current, newEnemy];
          }
        }
        return current;
      });
    }, 12000);

    return () => clearInterval(interval);
  }, [gameStage, gridData.vehiclePosition, playerPos]);

  const handleCollectLoot = useCallback((lootType, amount = 1) => {
    setBackpack((b) => {
      const updated = { ...b };
      if (lootType === 'BIO_SAMPLE') {
        updated.bioSamples = (updated.bioSamples || 0) + amount;
      } else if (lootType === 'PLASMA_CRYSTAL') {
        updated.plasmaCrystals = (updated.plasmaCrystals || 0) + amount;
        updated.xenoCrystals = (updated.xenoCrystals || 0) + amount; // backward compatibility
      } else if (lootType === 'XENO_CORE') {
        updated.xenoCores = (updated.xenoCores || 0) + amount;
      } else {
        updated.xenoCrystals = (updated.xenoCrystals || 0) + amount;
        updated.plasmaCrystals = (updated.plasmaCrystals || 0) + amount;
      }
      return updated;
    });

    sfx.playXenoCollect();

    if (lootType === 'BIO_SAMPLE') {
      addLog(
        t.bioSampleAcquired
          ? t.bioSampleAcquired.replace('{amount}', amount)
          : (lang === 'ar' ? `تم جمع عينات حيوية مريخية (+${amount}) 🧬` : `Acquired Martian Bio-Sample (+${amount}) 🧬`),
        'success'
      );
    } else if (lootType === 'PLASMA_CRYSTAL') {
      addLog(
        t.plasmaCrystalAcquired
          ? t.plasmaCrystalAcquired.replace('{amount}', amount)
          : (lang === 'ar' ? `تم استخراج بلورة بلازما كونية (+${amount}) ⚡` : `Extracted Cosmic Plasma Crystal (+${amount}) ⚡`),
        'success'
      );
    } else if (lootType === 'XENO_CORE') {
      addLog(
        t.xenoCoreAcquired
          ? t.xenoCoreAcquired.replace('{amount}', amount)
          : (lang === 'ar' ? `تم الاستحواذ على نواة زينو نقية فائقة (+${amount}) ⚛️` : `Secured Pure Xeno-Core (+${amount}) ⚛️`),
        'success'
      );
    }
  }, [addLog, t, lang, sfx]);

  const handleFireBlasterMobile = useCallback(() => {
    setBlasterTriggerCount((c) => c + 1);
  }, []);

  // Craft Upgrade
  const handleCraftUpgrade = (recipe) => {
    const regCost = recipe.cost.regolith || 0;
    const iceCost = recipe.cost.ice || 0;
    const bioCost = recipe.cost.bioSamples || 0;
    const plasmaCost = recipe.cost.plasmaCrystals || recipe.cost.xenoCrystals || 0;
    const coreCost = recipe.cost.xenoCores || 0;

    const regAvailable = vehicleMaterials.regolith || 0;
    const iceAvailable = vehicleMaterials.ice || 0;
    const bioAvailable = vehicleMaterials.bioSamples || 0;
    const plasmaAvailable = (vehicleMaterials.plasmaCrystals || 0) + (vehicleMaterials.xenoCrystals || 0);
    const coreAvailable = vehicleMaterials.xenoCores || 0;

    if (
      regAvailable < regCost ||
      iceAvailable < iceCost ||
      bioAvailable < bioCost ||
      plasmaAvailable < plasmaCost ||
      coreAvailable < coreCost
    ) {
      addLog(t.insufficientFunds, 'danger');
      return;
    }

    setVehicleMaterials((prev) => ({
      ...prev,
      regolith: prev.regolith - regCost,
      ice: prev.ice - iceCost,
      bioSamples: Math.max(0, (prev.bioSamples || 0) - bioCost),
      plasmaCrystals: Math.max(0, (prev.plasmaCrystals || 0) - plasmaCost),
      xenoCrystals: Math.max(0, (prev.xenoCrystals || 0) - plasmaCost),
      xenoCores: Math.max(0, (prev.xenoCores || 0) - coreCost),
    }));

    setCraftedUpgrades((prev) => [...new Set([...prev, recipe.id])]);
    sfx.playUpgrade();
    addLog(`${t.craftingTitle}: ${recipe.name[lang] || recipe.name.en} installed!`, 'success');
  };

  const handleEnterCave = useCallback((caveType) => {
    // 1. Back up current surface world state in both state and ref
    const backup = {
      grid: gridData.grid,
      playerPos: { ...playerPos },
      enemies: [...enemies],
      habPosition: { ...gridData.habPosition },
      vehiclePosition: { ...gridData.vehiclePosition },
    };
    surfaceWorldBackupRef.current = backup;
    setSurfaceWorldBackup(backup);

    // 2. Generate 20x20 subterranean cave level
    const caveLevel = generateCaveLevel(caveType);

    // 3. Set active subterranean cave state
    setActiveCaveLocation({
      caveType,
      info: caveLevel.info,
      returnPos: { ...playerPos },
    });

    // 4. Load subterranean grid, player spawn, and cave organisms
    setGridData((prev) => ({
      ...prev,
      grid: caveLevel.grid,
      habPosition: caveLevel.spawnPoint,
      vehiclePosition: { x: -100, y: -100 },
    }));

    setPlayerPos(caveLevel.spawnPoint);
    setEnemies(caveLevel.enemies);

    sfx.playLaunch();
    addLog(
      isRtl
        ? `تم النزول إلى الأعماق: ${caveLevel.info.title.ar} (${caveLevel.info.depth})`
        : `Descended into subterranean depths: ${caveLevel.info.title.en} (${caveLevel.info.depth})`,
      'warning'
    );
  }, [gridData, playerPos, enemies, isRtl, addLog, sfx]);

  const handleExitCave = useCallback(() => {
    const backup = surfaceWorldBackup || surfaceWorldBackupRef.current;
    let surfaceGrid = backup?.grid;
    let surfacePlayerPos = backup?.playerPos || activeCaveLocation?.returnPos;
    let surfaceEnemies = backup?.enemies;
    let surfaceHab = backup?.habPosition;
    let surfaceVeh = backup?.vehiclePosition;

    // Resilient Fallback: If backup was lost during HMR or direct reload inside cave
    if (!surfaceGrid) {
      const initial = generateInitialGrid();
      surfaceGrid = initial.grid;
      surfaceHab = initial.habPosition;
      surfaceVeh = initial.vehiclePosition;
      surfaceEnemies = [];
      if (!surfacePlayerPos) {
        const caveEntranceCoords = {
          CAVE_TURBINE: { x: 36, y: 122 },
          CAVE_MAYA: { x: 125, y: 47 },
          CAVE_OMAR: { x: 130, y: 132 },
          CAVE_LINA: { x: 40, y: 37 },
          CAVE_ARSENAL: { x: 95, y: 142 },
          CAVE_ADAM: { x: 15, y: 17 },
        };
        surfacePlayerPos = (activeCaveLocation?.caveType && caveEntranceCoords[activeCaveLocation.caveType]) || { x: surfaceHab.x + 2, y: surfaceHab.y + 1 };
      }
    }

    // 1. Restore surface world
    setGridData((prev) => ({
      ...prev,
      grid: surfaceGrid,
      habPosition: surfaceHab || prev.habPosition,
      vehiclePosition: surfaceVeh || prev.vehiclePosition,
    }));

    // 2. Restore surface player position (right at cave entrance) and surface organisms
    setPlayerPos(surfacePlayerPos || { x: 50, y: 50 });
    setEnemies(surfaceEnemies || []);

    const exitedCaveTitle = activeCaveLocation?.info?.title?.[lang] || activeCaveLocation?.info?.title?.en || 'Cave';

    setActiveCaveLocation(null);
    setSurfaceWorldBackup(null);
    surfaceWorldBackupRef.current = null;

    sfx.playLaunch();
    addLog(
      isRtl
        ? `تم الصعود بسلام إلى سطح المريخ من ${exitedCaveTitle}.`
        : `Ascended safely to Martian surface from ${exitedCaveTitle}.`,
      'success'
    );
  }, [surfaceWorldBackup, activeCaveLocation, lang, isRtl, addLog, sfx]);

  const handleInspectCaveProp = useCallback((tile) => {
    const recoveryKey = tile?.propData?.recoveryKey || tile?.propData?.crewId;
    if (recoveryKey && (recoveryKey.startsWith('crew_') || tile?.propData?.isCrewNPC)) {
      setActiveDialogueCrewId(recoveryKey);
      sfx.playBeep(560, 0.08);
      return;
    }
    setInspectedCavePropTile(tile);
    sfx.playBeep(480, 0.08);
  }, [sfx]);

  const handleTalkToCrew = useCallback((crewId) => {
    setActiveDialogueCrewId(crewId);
    sfx.playBeep(560, 0.08);
  }, [sfx]);

  const handleSalvageTurbineCore = useCallback(() => {
    if (!craftedUpgrades.includes('turbine_core')) {
      setCraftedUpgrades((prev) => [...prev, 'turbine_core']);
      sfx.playUpgrade();
      addLog(
        isRtl
          ? '🏆 تم استرداد قلب توربين آريس-1 بنجاح! محركات مركبة MAV جاهزة للإطلاق.'
          : '🏆 Ares-I Magnetic Turbine Core successfully recovered! MAV propulsion ready.',
        'success'
      );
    }
  }, [craftedUpgrades, isRtl, addLog, sfx]);

  const handleSalvageRelic = useCallback((relicKey) => {
    if (!relicKey) return;
    if (!craftedUpgrades.includes(relicKey)) {
      setCraftedUpgrades((prev) => [...prev, relicKey]);
      sfx.playUpgrade();
      const relic = CAVE_RELICS[relicKey];
      const relicTitle = relic ? (relic.name[lang] || relic.name.en) : relicKey;

      if (relicKey.startsWith('crew_')) {
        setRescuedCrew((prev) => [...new Set([...prev, relicKey])]);
        sfx.playLaunch();
        const crewNarrative = {
          crew_maya: {
            ar: '🌿 د. مايا ثورن: "شكراً لك أيها القائد! سأتولى إدارة القبة الحيوية فوراً لمضاعفة المحاصيل 200% وتوفير استهلاك المياه."',
            en: '🌿 Dr. Maya Thorne: "Thank you Commander! I will manage the Biodome to supercharge our crops (+200%) and optimize water."',
          },
          crew_omar: {
            ar: '⚡ عمر الفاروق: "الحمد لله على النجاة! سأشرف على مصفاة التعدين لمضاعفة ناتج الريجوليث والبلورات 150%."',
            en: '⚡ Omar Al-Farouq: "Surviving that fault is a miracle! I will oversee mining logistics to amplify yields (+150%)."',
          },
          crew_lina: {
            ar: '💉 د. لينا تشانغ: "أنا ممتنة جداً... فتحت عيادة الطوارئ بالقاعدة لتقديم الرعاية الطبية وحماية اتزانكم النفسي."',
            en: '💉 Dr. Lina Zhang: "Deeply grateful... I have established the medical bay to provide trauma healing and mental stability."',
          },
          crew_adam: {
            ar: '⚙️ كبير المهندسين آدم: "أنا ممتن لحكمتك أيها القائد... سأتولى موازنة شبكة الكهرباء بالكامل لرفع كفاءة الطاقة 50% وتحقيق استقرار دائم للقاعدة."',
            en: '⚙️ Chief Engineer Adam: "Grateful for your wisdom, Commander... I will harmonize our electrical grid, boosting efficiency +50% and permanently stabilizing power."',
          },
        };
        const dialogue = crewNarrative[relicKey]?.[lang] || crewNarrative[relicKey]?.en;
        if (dialogue) {
          addLog(dialogue, 'warning');
        }
      } else if (relicKey === 'ares_energy_emitter') {
        addLog(
          lang === 'ar'
            ? '⚡ تم تجهيز قاذف الطاقة التجريبي! ضربات حفر فائقة بضغطة واحدة وشعاع خارق للدروع الصخرية.'
            : '⚡ Experimental High-Energy Emitter operational! Instant 1-hit mining & armor-piercing particle beam.',
          'warning'
        );
      } else {
        addLog(
          lang === 'ar'
            ? `🏆 تم استرداد وتأمين: ${relicTitle}! تم حفظها في الحقيبة بنجاح.`
            : `🏆 Recovered and secured: ${relicTitle}! Stored in cargo inventory.`,
          'success'
        );
      }
    }
  }, [craftedUpgrades, lang, addLog, sfx]);

  // Phase 2: Building Inspection, Upgrade, Relocation & Dismantle Handlers
  const handleInspectBuilding = useCallback((tile) => {
    if (tile.isCave || (tile.type && String(tile.type).startsWith('CAVE_'))) {
      handleEnterCave(tile.type);
      return;
    }
    setInspectedBuildingTile(tile);
    setTabletView('INSPECT');
    setIsTabletOpen(true);
    sfx.playBeep(520, 0.05);
  }, [handleEnterCave, sfx]);

  const handleDepositToBuilding = useCallback((tileX, tileY, amount = 5) => {
    const success = depositResourceToBuilding(tileX, tileY, amount);
    if (success) {
      sfx.playDeposit();
      setInspectedBuildingTile((prev) => {
        if (!prev || prev.x !== tileX || prev.y !== tileY) return prev;
        const curIn = prev.inputAmount || 0;
        return { ...prev, inputAmount: Math.min(15, curIn + amount), hasFeed: true };
      });
      addLog(
        lang === 'ar'
          ? `🧊 تم تزويد المنشأة بـ +${amount} كجم جليد خام بنجاح!`
          : `🧊 Transferred +${amount}kg raw ice to facility hopper!`,
        'success'
      );
    } else {
      addLog(
        lang === 'ar'
          ? `⚠️ لا يتوفر جليد خام في المركبة للإيداع!`
          : `⚠️ Insufficient raw ice in vehicle cargo to deposit!`,
        'danger'
      );
    }
  }, [depositResourceToBuilding, lang, addLog, sfx]);

  const handleUpgradeBuilding = useCallback((tile) => {
    const nextLevel = (tile.level || 1) + 1;
    const tierData = BUILDING_UPGRADES[tile.type]?.[nextLevel];
    if (!tierData || !tierData.upgradeCost) return;

    const cost = tierData.upgradeCost;
    if (
      vehicleMaterials.regolith < (cost.regolith || 0) ||
      vehicleMaterials.ice < (cost.ice || 0) ||
      (vehicleMaterials.xenoCrystals || 0) < (cost.xenoCrystals || 0) ||
      (vehicleMaterials.bioSamples || 0) < (cost.bioSamples || 0) ||
      (vehicleMaterials.plasmaCrystals || 0) < (cost.plasmaCrystals || 0) ||
      (vehicleMaterials.xenoCores || 0) < (cost.xenoCores || 0)
    ) {
      addLog(t.insufficientFunds, 'danger');
      return;
    }

    if (tierData.requiredItem && !craftedUpgrades.includes(tierData.requiredItem)) {
      const relic = CAVE_RELICS[tierData.requiredItem];
      const relicName = relic ? (relic.name[lang] || relic.name.en) : tierData.requiredItem;
      addLog(
        lang === 'ar'
          ? `❌ الترقية تتطلب استرداد القطعة الأثرية: ${relicName} من الكهوف أولاً!`
          : `❌ Upgrade requires cave relic: ${relicName} first!`,
        'danger'
      );
      return;
    }

    setVehicleMaterials((prev) => ({
      ...prev,
      regolith: prev.regolith - (cost.regolith || 0),
      ice: prev.ice - (cost.ice || 0),
      xenoCrystals: Math.max(0, (prev.xenoCrystals || 0) - (cost.xenoCrystals || 0)),
      bioSamples: Math.max(0, (prev.bioSamples || 0) - (cost.bioSamples || 0)),
      plasmaCrystals: Math.max(0, (prev.plasmaCrystals || 0) - (cost.plasmaCrystals || 0)),
      xenoCores: Math.max(0, (prev.xenoCores || 0) - (cost.xenoCores || 0)),
    }));

    setGridData((prev) => ({
      ...prev,
      grid: prev.grid.map((row, ry) =>
        row.map((cell, rx) => {
          if (rx === tile.x && ry === tile.y) {
            return { ...cell, level: nextLevel };
          }
          return cell;
        })
      ),
    }));

    setInspectedBuildingTile((prev) => (prev ? { ...prev, level: nextLevel } : null));
    sfx.playUpgrade();
    addLog(`${t.upgradeStructure}: ${tierData.name[lang] || tierData.name.en} (Lv.${nextLevel})!`, 'success');
  }, [vehicleMaterials, craftedUpgrades, addLog, t, lang, sfx]);

  const handleCollectBuilding = useCallback((tile) => {
    const result = collectBuildingOutput(tile.x, tile.y);
    if (result) {
      if (result.type === 'FOOD') sfx.playEat();
      else if (result.type === 'WATER') sfx.playDrink();
      else sfx.playDeposit();
      setInspectedBuildingTile((prev) => (prev ? { ...prev, storedAmount: 0 } : null));
    }
  }, [collectBuildingOutput, sfx]);

  const handleStartRelocate = useCallback((tile) => {
    setIsTabletOpen(false);
    setRelocatingBuilding(tile);
    sfx.playBeep(650, 0.06);
    addLog(t.relocatingMode, 'info');
  }, [addLog, t, sfx]);

  const handleDismantleBuilding = useCallback((tile) => {
    const baseBuilding = BUILDINGS[tile.type];
    const baseCost = baseBuilding?.cost || { regolith: 15, ice: 5 };
    let totalReg = baseCost.regolith || 0;
    let totalIce = baseCost.ice || 0;
    let totalXeno = baseCost.xenoCrystals || 0;

    const currentLvl = tile.level || 1;
    for (let lvl = 2; lvl <= currentLvl; lvl++) {
      const upCost = BUILDING_UPGRADES[tile.type]?.[lvl]?.upgradeCost;
      if (upCost) {
        totalReg += upCost.regolith || 0;
        totalIce += upCost.ice || 0;
        totalXeno += upCost.xenoCrystals || 0;
      }
    }

    const regRefund = Math.floor(totalReg * 0.5);
    const iceRefund = Math.floor(totalIce * 0.5);
    const xenoRefund = Math.floor(totalXeno * 0.5);

    setVehicleMaterials((prev) => ({
      regolith: prev.regolith + regRefund,
      ice: prev.ice + iceRefund,
      xenoCrystals: (prev.xenoCrystals || 0) + xenoRefund,
    }));

    setGridData((prev) => ({
      ...prev,
      grid: prev.grid.map((row, ry) =>
        row.map((cell, rx) => {
          if (rx === tile.x && ry === tile.y) {
            return {
              ...cell,
              type: 'EMPTY',
              level: 1,
              storedAmount: 0,
              productionProgress: 0,
              inputAmount: 0,
            };
          }
          return cell;
        })
      ),
    }));

    setIsTabletOpen(false);
    setInspectedBuildingTile(null);
    sfx.playDeposit();
    const xenoBonus = xenoRefund > 0 ? `, +${xenoRefund} 💎` : '';
    addLog(`${t.dismantleSuccess} (+${regRefund} R, +${iceRefund} I${xenoBonus})`, 'warning');
  }, [addLog, t, sfx]);

  // Phase 5: Power Toggle & Smart Automation Handlers for Buildings
  const handleToggleBuildingPower = useCallback((tile, forceMode = null) => {
    if (!tile) return;
    const currentMode = tile.powerMode ?? (tile.disabled ? 'OFF' : 'AUTO');
    let nextMode = forceMode;

    if (!nextMode) {
      if (tile.type === 'THERMAL_HEATER' && (tile.level || 1) >= 2) {
        // Smart Cycle: AUTO -> OFF -> ON -> AUTO
        if (currentMode === 'AUTO') nextMode = 'OFF';
        else if (currentMode === 'OFF') nextMode = 'ON';
        else nextMode = 'AUTO';
      } else {
        // Standard toggle: ON -> OFF -> ON
        nextMode = (currentMode === 'OFF' || tile.disabled) ? 'ON' : 'OFF';
      }
    }

    const isDisabled = nextMode === 'OFF';

    setGridData((prev) => ({
      ...prev,
      grid: prev.grid.map((row, ry) =>
        row.map((cell, rx) => {
          if (rx === tile.x && ry === tile.y) {
            return {
              ...cell,
              disabled: isDisabled,
              powerMode: nextMode,
            };
          }
          return cell;
        })
      ),
    }));

    setInspectedBuildingTile((prev) =>
      prev && prev.x === tile.x && prev.y === tile.y
        ? { ...prev, disabled: isDisabled, powerMode: nextMode }
        : prev
    );

    sfx.playBeep(nextMode === 'OFF' ? 380 : 750, 0.08);
    const modeLabel = nextMode === 'OFF'
      ? (lang === 'ar' ? 'إيقاف مؤقت (0 kW)' : 'Powered Off (0 kW)')
      : (nextMode === 'ON' ? (lang === 'ar' ? 'تشغيل دائم' : 'Always On') : (lang === 'ar' ? 'تلقائي ذكي' : 'Smart Auto'));
    addLog(`${t.powerControl || 'Power'}: ${modeLabel} [${tile.x}, ${tile.y}]`, nextMode === 'OFF' ? 'warning' : 'info');
  }, [addLog, t, lang, sfx]);

  // Smart Context-Aware Action determination for Mobile and Quick Action HUD
  const curTileX = Math.round(playerPos.x);
  const curTileY = Math.round(playerPos.y);
  const currentTile = gridData.grid[curTileY]?.[curTileX];
  const isStandingOnResource =
    currentTile?.type === 'REGOLITH_NODE' || currentTile?.type === 'ICE_NODE';

  // Directional offsets prioritizing the tile directly in front of the player
  const neighborOffsets = (() => {
    switch (playerFacing) {
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

  let bestNeighbor = null;
  // If standing directly on a cave entrance or exit hoist, prioritize it immediately
  if (currentTile && (currentTile.isCave || currentTile.type === 'CAVE_EXIT' || (currentTile.type && String(currentTile.type).startsWith('CAVE_') && currentTile.type !== 'CAVE_WALL' && currentTile.type !== 'CAVE_FLOOR'))) {
    bestNeighbor = { ...currentTile, x: curTileX, y: curTileY };
  } else {
    for (const { dx, dy } of neighborOffsets) {
      const neighbor = gridData.grid[curTileY + dy]?.[curTileX + dx];
      if (
        neighbor &&
        neighbor.type !== 'EMPTY' &&
        neighbor.type !== 'REGOLITH_NODE' &&
        neighbor.type !== 'ICE_NODE' &&
        neighbor.type !== 'CAVE_WALL' &&
        neighbor.type !== 'CAVE_FLOOR'
      ) {
        const isRoverOrHab = neighbor.type === 'VEHICLE' || neighbor.isVehicle || (neighbor.type === 'HAB' && !neighbor.storedAmount);
        const enriched = { ...neighbor, x: curTileX + dx, y: curTileY + dy, isRover: isRoverOrHab };
        if (neighbor.type === 'CAVE_EXIT' || neighbor.type === 'CAVE_PROP' || neighbor.type === 'CAVE_TURBINE_CORE' || neighbor.isCave || (neighbor.type && String(neighbor.type).startsWith('CAVE_'))) {
          bestNeighbor = enriched;
          break;
        }
        const isCollectible = neighbor.type === 'BIODOME' || neighbor.type === 'ICE_PURIFIER';
        if ((isCollectible && neighbor.storedAmount && neighbor.storedAmount > 0) || (neighbor.type === 'BIODOME' && cropGrowth >= 100)) {
          bestNeighbor = enriched;
          break;
        }
        if (!bestNeighbor) {
          bestNeighbor = enriched;
        }
      }
    }
  }

  let primaryAction = null;
  let secondaryAction = null;

  if (activeBuilding || relocatingBuilding) {
    secondaryAction = {
      type: 'DROP_HELD_ITEM',
      label: isRtl ? 'إفلات العنصر' : 'Drop Item',
      sublabel: '[ESC]',
      onClick: () => {
        if (activeBuilding) setActiveBuilding(null);
        if (relocatingBuilding) setRelocatingBuilding(null);
        sfx?.playBeep(420, 0.05);
        addLog(isRtl ? '✋ تم إفلات العنصر وإلغاء العملية' : '✋ Item dropped, action cancelled', 'info');
      },
    };
  }

  // Surface Crew Proximity Check
  let nearCrewStation = null;
  if (!activeCaveLocation?.info && rescuedCrew && rescuedCrew.length > 0) {
    const stations = getSurfaceCrewStations(gridData.grid, rescuedCrew, crewAssignments, habPos, vehiclePos);
    for (const st of stations) {
      const dist = Math.hypot(playerPos.x - st.x, playerPos.y - st.y);
      if (dist < 2.2) {
        nearCrewStation = st;
        break;
      }
    }
  }

  if (nearCrewStation) {
    const crewCfg = CREW_MEMBERS[nearCrewStation.crewId];
    const cName = crewCfg ? (isRtl ? crewCfg.name.ar : crewCfg.name.en) : 'رائد الفضاء';
    const roleKey = nearCrewStation.assignedRole || crewAssignments[nearCrewStation.crewId];
    const isMaster = crewCfg?.signatureRole === roleKey;
    const roleName = ASSIGNABLE_ROLES[roleKey]?.name?.[lang] || ASSIGNABLE_ROLES[roleKey]?.name?.ar || '';
    primaryAction = {
      type: 'TALK_CREW',
      label: isRtl ? `محادثة مع ${cName} [E]` : `Talk to ${cName} [E]`,
      sublabel: `${roleName} ${isMaster ? '⭐' : ''}`,
      onClick: () => handleTalkToCrew(nearCrewStation.crewId),
    };
  } else if (currentTile?.type === 'CAVE_PROP' || currentTile?.type === 'CAVE_TURBINE_CORE') {
    const isCrew = currentTile.propData?.recoveryKey?.startsWith('crew_') || currentTile.propData?.isCrewNPC;
    const crewName = isRtl ? (currentTile.propData?.nameAr || 'رائد الفضاء') : (currentTile.propData?.name || 'Astronaut');
    primaryAction = {
      type: isCrew ? 'TALK_CREW' : 'INSPECT_PROP',
      label: isCrew
        ? (isRtl ? `محادثة مع ${crewName} [E]` : `Talk to ${crewName} [E]`)
        : (isRtl ? 'فحص واسترداد الأثر [E]' : 'Inspect / Salvage Relic [E]'),
      tile: currentTile,
      onClick: () => handleInspectCaveProp(currentTile),
    };
  } else if (isStandingOnResource) {
    primaryAction = {
      type: 'MINE',
      label: currentTile.type === 'ICE_NODE' ? (isRtl ? 'تعدين جليد [E]' : 'Mine Ice [E]') : (isRtl ? 'تعدين خام [E]' : 'Mine Regolith [E]'),
      sublabel: `${currentTile.resourceAmount || 10} kg`,
      isHold: true,
      onPress: () => setVirtualKeys((k) => ({ ...k, e: true })),
      onRelease: () => setVirtualKeys((k) => ({ ...k, e: false })),
    };
    if (isNearVehicle && !activeBuilding && !relocatingBuilding) {
      secondaryAction = {
        type: 'CARGO',
        label: isRtl ? 'المستودع' : 'Cargo',
        sublabel: `${(vehicleMaterials?.regolith || 0) + (vehicleMaterials?.ice || 0)} kg`,
        isHold: false,
        onClick: handleOpenCargoModal,
      };
    }
  } else if (bestNeighbor) {
    if (bestNeighbor.isRover || bestNeighbor.type === 'VEHICLE') {
      primaryAction = {
        type: 'DEPOSIT',
        label: isRtl ? 'تفريغ في المركبة' : 'Deposit in Rover',
        sublabel: `${(backpack?.regolith || 0) + (backpack?.ice || 0) + (backpack?.xenoCrystals || 0)} kg`,
        isHold: false,
        onClick: handleDepositCargo,
      };
      secondaryAction = {
        type: 'CARGO',
        label: isRtl ? 'مستودع المركبة' : 'Rover Cargo',
        sublabel: `${(vehicleMaterials?.regolith || 0) + (vehicleMaterials?.ice || 0)} kg`,
        isHold: false,
        onClick: handleOpenCargoModal,
      };
    } else if (bestNeighbor.type === 'WALL') {
      const wallArmorName = bestNeighbor.level >= 3
        ? (isRtl ? 'درع تيتانيوم' : 'Titanium Bulwark')
        : bestNeighbor.level === 2
        ? (isRtl ? 'درع بازلتي' : 'Basalt Armor')
        : (isRtl ? 'درع ريجوليث' : 'Regolith Shield');
      primaryAction = {
        type: 'INSPECT',
        label: isRtl ? 'ترقية وتطوير الجدار' : 'Upgrade Wall',
        sublabel: `Lv.${bestNeighbor.level || 1} • ${wallArmorName}`,
        tile: bestNeighbor,
        onClick: () => handleInspectBuilding(bestNeighbor),
      };
      secondaryAction = null;
    } else if (bestNeighbor.type === 'GATE') {
      primaryAction = {
        type: 'INSPECT',
        label: isRtl ? 'ترقية وتطوير البوابة' : 'Upgrade Gate',
        sublabel: `Lv.${bestNeighbor.level || 1}`,
        tile: bestNeighbor,
        onClick: () => handleInspectBuilding(bestNeighbor),
      };
      secondaryAction = null;
    } else if (bestNeighbor.type === 'SOLAR_ARRAY') {
      const solarPowerGen = bestNeighbor.level === 3 ? 32 : bestNeighbor.level === 2 ? 20 : 12;
      const statusText = isDay ? `+${solarPowerGen} kW` : (isRtl ? 'ليلي 0 kW' : 'Night 0 kW');
      primaryAction = {
        type: 'INSPECT',
        label: isRtl ? 'فحص وتطوير المصفوفة' : 'Inspect Solar Array',
        sublabel: `Lv.${bestNeighbor.level || 1} • ${statusText}`,
        tile: bestNeighbor,
        onClick: () => handleInspectBuilding(bestNeighbor),
      };
      secondaryAction = null;
    } else if (bestNeighbor.type === 'BIODOME') {
      const bioRations = bestNeighbor.storedAmount > 0 ? bestNeighbor.storedAmount : 3;
      if ((bestNeighbor.storedAmount && bestNeighbor.storedAmount > 0) || cropGrowth >= 100) {
        primaryAction = {
          type: 'HARVEST',
          label: isRtl ? `حصاد طعام (+${bioRations})` : `Harvest Food (+${bioRations})`,
          sublabel: isRtl ? `محصول ناضج (${bioRations})` : `Crops Ready (${bioRations})`,
          tile: bestNeighbor,
          onClick: () => {
            if (bestNeighbor.storedAmount > 0) handleCollectBuilding(bestNeighbor);
            else if (harvestCrops()) sfx.playEat();
          },
        };
        secondaryAction = {
          type: 'FEED_ICE',
          label: isRtl ? 'تزويد جليد للري' : 'Feed Irrigation Ice',
          sublabel: '+5 kg',
          tile: bestNeighbor,
          onClick: () => handleDepositToBuilding(bestNeighbor.x, bestNeighbor.y, 5),
        };
      } else {
        primaryAction = {
          type: 'FEED_ICE',
          label: isRtl ? 'تزويد جليد للري' : 'Feed Irrigation Ice',
          sublabel: '+5 kg',
          tile: bestNeighbor,
          onClick: () => handleDepositToBuilding(bestNeighbor.x, bestNeighbor.y, 5),
        };
        secondaryAction = {
          type: 'INSPECT',
          label: isRtl ? 'ترقية القبة الزراعية' : 'Upgrade Biodome',
          sublabel: `Lv.${bestNeighbor.level || 1}`,
          tile: bestNeighbor,
          onClick: () => handleInspectBuilding(bestNeighbor),
        };
      }
    } else if (bestNeighbor.type === 'ICE_PURIFIER') {
      if (bestNeighbor.storedAmount && bestNeighbor.storedAmount > 0) {
        primaryAction = {
          type: 'PURIFY',
          label: isRtl ? `جمع مياه نقية (${bestNeighbor.storedAmount})` : `Collect Water (${bestNeighbor.storedAmount})`,
          sublabel: isRtl ? 'مياه نقية' : 'Purified',
          tile: bestNeighbor,
          onClick: () => handleCollectBuilding(bestNeighbor),
        };
        secondaryAction = {
          type: 'FEED_ICE',
          label: isRtl ? 'تزويد جليد خام' : 'Load Raw Ice',
          sublabel: '+5 kg',
          tile: bestNeighbor,
          onClick: () => handleDepositToBuilding(bestNeighbor.x, bestNeighbor.y, 5),
        };
      } else {
        primaryAction = {
          type: 'FEED_ICE',
          label: isRtl ? 'تزويد جليد خام' : 'Load Raw Ice',
          sublabel: '+5 kg',
          tile: bestNeighbor,
          onClick: () => handleDepositToBuilding(bestNeighbor.x, bestNeighbor.y, 5),
        };
        secondaryAction = {
          type: 'INSPECT',
          label: isRtl ? 'ترقية محطة التنقية' : 'Upgrade Purifier',
          sublabel: `Lv.${bestNeighbor.level || 1}`,
          tile: bestNeighbor,
          onClick: () => handleInspectBuilding(bestNeighbor),
        };
      }
    } else if (bestNeighbor.type === 'BATTERY_BANK') {
      primaryAction = {
        type: 'RECHARGE',
        label: isRtl ? 'شحن بطارية البدلة' : 'Charge Suit Battery',
        sublabel: '+15 kWh',
        tile: bestNeighbor,
        onClick: () => {
          if (batteryCharge >= maxBatteryCapacity) {
            addLog(isRtl ? '⚡ بطارية البدلة مشحونة بالكامل بالفعل' : '⚡ Suit battery already at 100% capacity', 'info');
            sfx.playBeep(450, 0.05);
          } else {
            rechargeBattery(15);
            sfx.playBeep(880, 0.08);
            addLog(isRtl ? '⚡ تم شحن بطارية البدلة (+15 kWh)' : '⚡ Recharged suit battery (+15 kWh)', 'success');
          }
        },
      };
      secondaryAction = {
        type: 'INSPECT',
        label: isRtl ? 'ترقية مجمع البطاريات' : 'Upgrade Power Bank',
        sublabel: `Lv.${bestNeighbor.level || 1}`,
        tile: bestNeighbor,
        onClick: () => handleInspectBuilding(bestNeighbor),
      };
    } else if (bestNeighbor.type === 'THERMAL_HEATER') {
      const isPaused = bestNeighbor.disabled || bestNeighbor.powerMode === 'OFF';
      primaryAction = {
        type: 'POWER',
        label: isPaused ? (isRtl ? 'تشغيل التدفئة' : 'Turn On Heater') : (isRtl ? 'إيقاف مؤقت' : 'Turn Off Heater'),
        sublabel: isPaused ? 'OFF' : 'ON',
        tile: bestNeighbor,
        onClick: () => handleToggleBuildingPower(bestNeighbor),
      };
      secondaryAction = {
        type: 'INSPECT',
        label: isRtl ? 'فحص شبكة التدفئة' : 'Inspect Thermal Grid',
        sublabel: `Lv.${bestNeighbor.level || 1}`,
        tile: bestNeighbor,
        onClick: () => handleInspectBuilding(bestNeighbor),
      };
    } else if (bestNeighbor.type === 'COMMS_ARRAY') {
      primaryAction = {
        type: 'CALL',
        label: isRtl ? 'اتصال بالأرض' : 'Call Earth',
        sublabel: isRtl ? 'مركز هيوستن (+60 صحة)' : 'Houston (+60 Sanity)',
        tile: bestNeighbor,
        onClick: () => {
          if (callEarth()) sfx.playComms();
        },
      };
      secondaryAction = {
        type: 'INSPECT',
        label: isRtl ? 'ترقية مصفوفة الاتصال' : 'Upgrade Comms Dish',
        sublabel: `Lv.${bestNeighbor.level || 1}`,
        tile: bestNeighbor,
        onClick: () => handleInspectBuilding(bestNeighbor),
      };
    } else if (bestNeighbor.type === 'HAB') {
      primaryAction = {
        type: 'DEPOSIT',
        label: isRtl ? 'تفريغ في المستودع' : 'Deposit in Depot',
        sublabel: `${(backpack?.regolith || 0) + (backpack?.ice || 0) + (backpack?.xenoCrystals || 0)} kg`,
        tile: bestNeighbor,
        onClick: handleDepositCargo,
      };
      secondaryAction = {
        type: 'INSPECT',
        label: isRtl ? 'فحص وترقية المستودع' : 'Inspect & Upgrade Depot',
        sublabel: `Lv.${bestNeighbor.level || 1}`,
        tile: bestNeighbor,
        onClick: () => handleInspectBuilding(bestNeighbor),
      };
    } else if (bestNeighbor.type === 'MAV_PLATFORM') {
      primaryAction = {
        type: 'INSPECT_MAV',
        label: isRtl ? 'فحص منصة الإطلاق MAV' : 'Inspect MAV Launch Vehicle',
        sublabel: isRtl ? 'جاهزية الإقلاع' : 'Ascent Ready',
        tile: bestNeighbor,
        onClick: () => handleInspectBuilding(bestNeighbor),
      };
      secondaryAction = {
        type: 'MAV_STATUS',
        label: isRtl ? 'تزويد قلب التوربين' : 'Insert Power Core',
        sublabel: isRtl ? 'أنظمة الدفع' : 'Propulsion',
        tile: bestNeighbor,
        onClick: () => handleInspectBuilding(bestNeighbor),
      };
    } else if (bestNeighbor.type === 'CAVE_EXIT') {
      primaryAction = {
        type: 'EXIT_CAVE',
        label: isRtl ? 'صعود لسطح المريخ [E]' : 'Ascend to Surface [E]',
        sublabel: isRtl ? 'رافعة الكابل' : 'Cable Hoist',
        tile: bestNeighbor,
        onClick: handleExitCave,
      };
    } else if (bestNeighbor.type === 'CAVE_PROP' || bestNeighbor.type === 'CAVE_TURBINE_CORE') {
      const isCrew = bestNeighbor.propData?.recoveryKey?.startsWith('crew_') || bestNeighbor.propData?.isCrewNPC;
      const crewName = isRtl ? (bestNeighbor.propData?.nameAr || 'رائد الفضاء') : (bestNeighbor.propData?.name || 'Astronaut');
      primaryAction = {
        type: isCrew ? 'TALK_CREW' : 'INSPECT_PROP',
        label: isCrew
          ? (isRtl ? `محادثة مع ${crewName} [E]` : `Talk to ${crewName} [E]`)
          : (isRtl ? 'فحص واسترداد الأثر [E]' : 'Inspect / Salvage Relic [E]'),
        tile: bestNeighbor,
        onClick: () => handleInspectCaveProp(bestNeighbor),
      };
    } else if (bestNeighbor.isCave || (bestNeighbor.type && String(bestNeighbor.type).startsWith('CAVE_') && bestNeighbor.type !== 'CAVE_WALL' && bestNeighbor.type !== 'CAVE_FLOOR')) {
      const cName = bestNeighbor.caveName || (isRtl ? 'بوابة الكهف' : 'Subterranean Cavern');
      primaryAction = {
        type: 'ENTER_CAVE',
        label: isRtl ? 'النزول إلى أعماق الكهف [E]' : 'Descend into Cave [E]',
        sublabel: cName,
        tile: bestNeighbor,
        onClick: () => handleEnterCave(bestNeighbor.type),
      };
    } else if (bestNeighbor.type === 'ANCIENT_ALTAR') {
      const isScanned = bestNeighbor.scanned;
      primaryAction = {
        type: 'SCAN_ALTAR',
        label: isScanned
          ? (isRtl ? 'أرشيف سلفي مؤرشف' : 'Altar Archived')
          : (isRtl ? 'مسح الأثر القديم [E]' : 'Scan Precursor Altar [E]'),
        sublabel: isScanned ? (isRtl ? 'مكتمل' : 'Completed') : '+25 Tech / +3 Crystals',
        tile: bestNeighbor,
        onClick: () => {
          if (bestNeighbor.scanned) {
            addLog(isRtl ? 'ℹ️ تم استخراج السجلات من هذا الأثر مسبقاً.' : 'ℹ️ Geological archives already extracted from this relic.', 'info');
            return;
          }
          bestNeighbor.scanned = true;
          setBackpack((prev) => ({
            ...prev,
            techParts: (prev.techParts || 0) + 1,
            xenoCrystals: (prev.xenoCrystals || 0) + 3,
          }));
          sfx.playBeep(880, 0.15, 'sawtooth');
          setTimeout(() => sfx.playBeep(1320, 0.2, 'sine'), 120);
          addLog(
            isRtl
              ? '🏛️ تم فك شفرة المسلة السلفية القديمة! (+1 قطعة تقنية، +3 بلورات فضائية)'
              : '🏛️ Precursor Monolith deciphered! (+1 Tech Part, +3 Xeno Crystals)',
            'success'
          );
        },
      };
    } else {
      if (bestNeighbor.storedAmount && bestNeighbor.storedAmount > 0) {
        primaryAction = {
          type: 'COLLECT',
          label: isRtl ? `جمع (${bestNeighbor.storedAmount})` : `Collect (${bestNeighbor.storedAmount})`,
          tile: bestNeighbor,
          onClick: () => handleCollectBuilding(bestNeighbor),
        };
        secondaryAction = {
          type: 'INSPECT',
          label: isRtl ? 'فحص المنشأة' : 'Inspect',
          sublabel: `Lv.${bestNeighbor.level || 1}`,
          tile: bestNeighbor,
          onClick: () => handleInspectBuilding(bestNeighbor),
        };
      } else {
        primaryAction = {
          type: 'INSPECT',
          label: isRtl ? 'فحص المنشأة' : 'Inspect',
          sublabel: `Lv.${bestNeighbor.level || 1}`,
          tile: bestNeighbor,
          onClick: () => handleInspectBuilding(bestNeighbor),
        };
        const isToggleable = isToggleablePowerBuilding(bestNeighbor.type);
        if (isToggleable) {
          const isPaused = bestNeighbor.disabled || bestNeighbor.powerMode === 'OFF';
          secondaryAction = {
            type: 'POWER',
            label: isPaused ? (isRtl ? 'تشغيل' : 'Turn On') : (isRtl ? 'إيقاف' : 'Turn Off'),
            sublabel: isPaused ? 'OFF' : 'ON',
            tile: bestNeighbor,
            onClick: () => handleToggleBuildingPower(bestNeighbor),
          };
        }
      }
    }
  } else if (isNearVehicle) {
    primaryAction = {
      type: 'DEPOSIT',
      label: isRtl ? 'تفريغ' : 'Deposit',
      sublabel: `${(backpack?.regolith || 0) + (backpack?.ice || 0) + (backpack?.xenoCrystals || 0)} kg`,
      isHold: false,
      onClick: handleDepositCargo,
    };
    secondaryAction = {
      type: 'CARGO',
      label: isRtl ? 'المستودع' : 'Cargo',
      sublabel: `${(vehicleMaterials?.regolith || 0) + (vehicleMaterials?.ice || 0)} kg`,
      isHold: false,
      onClick: handleOpenCargoModal,
    };
  }

  const nearStructure = primaryAction;
  const mobileContextAction = primaryAction;

  // Keyboard Shortcuts (Stable single registration, reads latest actions from ref)
  const keyboardActionsRef = useRef({});
  keyboardActionsRef.current = {
    isTabletOpen,
    tabletView,
    selectedLoadout,
    eatFood,
    drinkWater,
    callEarth,
    toggleFlashlight,
    addLog,
    t,
    primaryAction,
    secondaryAction,
    isNearVehicle,
    handleOpenCargoModal,
    handleDepositCargo,
    handleToggleBuildingPower,
    bestNeighbor,
    activeBuilding,
    relocatingBuilding,
    setActiveBuilding,
    setRelocatingBuilding,
    setIsTabletOpen,
    setTabletView,
    isRtl,
    sfx,
  };

  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

      const code = e.code || '';
      const keyLow = e.key ? e.key.toLowerCase() : '';
      const actions = keyboardActionsRef.current;

      if (e.key === 'Escape' || code === 'Escape') {
        actions.setActiveBuilding(null);
        actions.setRelocatingBuilding(null);
        if (actions.isTabletOpen && actions.tabletView !== 'LOADOUT' && actions.tabletView !== 'GAMEOVER' && actions.tabletView !== 'VICTORY') {
          actions.setIsTabletOpen(false);
        }
      } else if (code === 'KeyX' || keyLow === 'x' || keyLow === 'ء') {
        if (actions.activeBuilding || actions.relocatingBuilding) {
          actions.setActiveBuilding(null);
          actions.setRelocatingBuilding(null);
          actions.sfx?.playBeep(420, 0.05);
          actions.addLog(actions.isRtl ? '✋ تم إفلات العنصر وإلغاء العملية' : '✋ Item dropped, action cancelled', 'info');
        }
      } else if (code === 'KeyE' || keyLow === 'e' || keyLow === 'ث') {
        e.preventDefault();
        if (actions.primaryAction?.onClick) {
          actions.primaryAction.onClick();
        } else if (actions.isNearVehicle) {
          actions.handleDepositCargo();
        }
      } else if (code === 'KeyR' || keyLow === 'r' || keyLow === 'ق') {
        e.preventDefault();
        if (actions.secondaryAction?.onClick) {
          actions.secondaryAction.onClick();
        } else if (actions.isNearVehicle) {
          actions.handleOpenCargoModal();
        }
      } else if (code === 'KeyF' || keyLow === 'f' || keyLow === 'ب') {
        if (actions.eatFood()) actions.sfx.playEat();
      } else if (code === 'KeyG' || keyLow === 'g' || keyLow === 'ل') {
        if (actions.drinkWater()) actions.sfx.playDrink();
      } else if (code === 'KeyH' || keyLow === 'h' || keyLow === 'ا') {
        if (actions.callEarth()) actions.sfx.playComms();
      } else if (code === 'KeyL' || keyLow === 'l' || keyLow === 'م') {
        actions.toggleFlashlight();
        actions.sfx.playBeep(750, 0.05);
      } else if (code === 'KeyP' || keyLow === 'p' || keyLow === 'ح') {
        if (actions.isTabletOpen && actions.tabletView === 'PDA') {
          actions.setIsTabletOpen(false);
        } else {
          actions.setTabletView('PDA');
          actions.setIsTabletOpen(true);
          actions.sfx.playBeep(650, 0.06);
        }
      } else if (code === 'KeyC' || keyLow === 'c' || keyLow === 'ؤ') {
        if (actions.isTabletOpen && actions.tabletView === 'CRAFTING') {
          actions.setIsTabletOpen(false);
        } else {
          actions.setTabletView('CRAFTING');
          actions.setIsTabletOpen(true);
          actions.sfx.playBeep(520, 0.05);
        }
      } else if (code === 'KeyB' || keyLow === 'b' || keyLow === 'لا') {
        if (actions.isTabletOpen && actions.tabletView === 'BUILD') {
          actions.setIsTabletOpen(false);
        } else {
          actions.setTabletView('BUILD');
          actions.setIsTabletOpen(true);
          actions.sfx.playBeep(520, 0.05);
        }
      } else if (code === 'KeyI' || keyLow === 'i' || keyLow === 'هـ') {
        if (actions.isTabletOpen && actions.tabletView === 'BACKPACK') {
          actions.setIsTabletOpen(false);
        } else {
          actions.setTabletView('BACKPACK');
          actions.setIsTabletOpen(true);
          actions.sfx.playBeep(650, 0.06);
        }
      } else if (code === 'KeyQ' || keyLow === 'q' || keyLow === 'ض') {
        if (actions.bestNeighbor && isToggleablePowerBuilding(actions.bestNeighbor.type)) {
          actions.handleToggleBuildingPower(actions.bestNeighbor);
        }
      } else if (e.key === '1') {
        actions.setActiveBuilding(BUILDINGS.SOLAR_ARRAY);
        actions.sfx.playBeep(450, 0.04);
      } else if (e.key === '2') {
        if (actions.selectedLoadout.includes('bio_seeds')) {
          actions.setActiveBuilding(BUILDINGS.BIODOME);
          actions.sfx.playBeep(450, 0.04);
        } else {
          actions.addLog(actions.t.bioSeedsMissing, 'warning');
        }
      } else if (e.key === '3') {
        actions.setActiveBuilding(BUILDINGS.ICE_PURIFIER);
        actions.sfx.playBeep(450, 0.04);
      } else if (e.key === '4') {
        actions.setActiveBuilding(BUILDINGS.COMMS_ARRAY);
        actions.sfx.playBeep(450, 0.04);
      } else if (e.key === '5') {
        actions.setActiveBuilding(BUILDINGS.THERMAL_HEATER);
        actions.sfx.playBeep(450, 0.04);
      } else if (e.key === '6') {
        actions.setActiveBuilding(BUILDINGS.BATTERY_BANK);
        actions.sfx.playBeep(450, 0.04);
      } else if (e.key === '7') {
        actions.setActiveBuilding(BUILDINGS.WALL);
        actions.sfx.playBeep(450, 0.04);
      } else if (e.key === '8') {
        actions.setActiveBuilding(BUILDINGS.GATE);
        actions.sfx.playBeep(450, 0.04);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Threat Anomaly Event Listener
  useEffect(() => {
    if (isThreatActive) {
      setTabletView('THREAT');
      setIsTabletOpen(true);
    }
  }, [isThreatActive]);

  // Game Over Event Listener
  useEffect(() => {
    if (isGameOver) {
      setTabletView('GAMEOVER');
      setIsTabletOpen(true);
    }
  }, [isGameOver]);

  // Victory Event Listener (30-Sol Martian Campaign Complete)
  const isVictory = sol >= ORBITAL_WINDOW_SOLS && powerMetrics.net >= 0 && health > 0 && !isGameOver;
  useEffect(() => {
    if (isVictory) {
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // fallback
      }
      setTabletView('VICTORY');
      setIsTabletOpen(true);
    }
  }, [isVictory]);

  // Restart
  const handleRestartMission = () => {
    sfx.playBeep(400, 0.1);
    const newGrid = generateInitialGrid();
    setGridData(newGrid);
    setPlayerPos(newGrid.playerSpawn || { x: newGrid.vehiclePosition.x + 2, y: newGrid.vehiclePosition.y + 1 });
    setBackpack({ regolith: 0, ice: 0, xenoCrystals: 0 });
    setVehicleMaterials({ regolith: 25, ice: 15, xenoCrystals: 0 });
    setEnemies(generateInitialEnemies(newGrid.vehiclePosition, 35));
    setCraftedUpgrades([]);
    setActiveBuilding(null);
    setRelocatingBuilding(null);
    setInspectedBuildingTile(null);
    resetGame();
    setCommanderSpec(null);
    setGameStage('PROLOGUE');
    setTabletView('PROLOGUE');
    setIsTabletOpen(true);
    exploredTilesRef.current = initFogBuffer();
    setLogs([
      { id: 1, text: 'Mission reset. Re-configuring Ares-VII payload logistics.', type: 'info', time: 'SOL 01' },
    ]);
  };

  return (
    <div
      dir={t.dir}
      className={`relative w-screen h-screen bg-mars-darkest text-slate-100 flex overflow-hidden crt-overlay ${isRtl ? 'font-cairo' : 'font-sans'}`}
    >

      {/* 2. Unified Colony Command Header: Minimap on Left (شمال), Telemetry Bar on Right (يمين) */}
      {gameStage === 'PLAYING' && (
        <header
          dir="ltr"
          className="fixed top-2 inset-x-2 z-30 pointer-events-none flex items-start justify-between gap-2 select-none"
        >
          {/* Radar / Minimap Module (Always Left / شمال) */}
          <div className="pointer-events-auto shrink-0">
            <Minimap
              grid={gridData.grid}
              playerPos={playerPos}
              habPos={gridData.habPosition}
              vehiclePos={gridData.vehiclePosition}
              cameraViewport={cameraViewport}
              enemies={enemies}
              lang={lang}
              hasMappingDrone={selectedLoadout.includes('mapping_drone')}
              orbitalPings={orbitalPings}
              isResourceRadarUnlocked={isResourceRadarUnlocked}
              exploredTilesRef={exploredTilesRef}
            />
          </div>

          {/* Colony Telemetry & Tool Buttons (End / Right) */}
          <div className="pointer-events-auto min-w-0">
            <TopBar
              lang={lang}
              sol={sol}
              solTimeRemaining={solTimeRemaining}
              isDay={isDay}
              powerMetrics={powerMetrics}
              isFlashlightOn={isFlashlightOn}
              onToggleFlashlight={toggleFlashlight}
              orbitalWindowStatus={orbitalWindowStatus}
              orbitalWindowSols={orbitalWindowSols}
              isDustStormActive={isDustStormActive}
              onOpenPda={() => {
                setTabletView('PDA');
                setIsTabletOpen(true);
                sfx.playBeep(650, 0.06);
              }}
              commsInfo={commsInfo}
              onOpenCrafting={() => {
                setTabletView('CRAFTING');
                setIsTabletOpen(true);
                sfx.playBeep(520, 0.05);
              }}
              onToggleBuildDeck={() => {
                if (isTabletOpen && tabletView === 'BUILD') {
                  setIsTabletOpen(false);
                } else {
                  setTabletView('BUILD');
                  setIsTabletOpen(true);
                  sfx.playBeep(520, 0.05);
                }
              }}
              isBuildDeckOpen={isTabletOpen && tabletView === 'BUILD'}
            />
          </div>
        </header>
      )}

      {/* 4. Main 24x24 Expansive Canvas Surface */}
      {gameStage === 'PLAYING' && (
        <div className="relative flex-1 w-full h-full flex overflow-hidden">
          <main className="relative flex-1 h-full w-full flex items-center justify-center overflow-hidden">
            <CanvasView
              lang={lang}
              grid={gridData.grid}
              setGrid={(updater) => {
                sfx.playBuild();
                setGridData((prev) => ({
                  ...prev,
                  grid: typeof updater === 'function' ? updater(prev.grid) : updater,
                }));
              }}
              playerPos={playerPos}
              setPlayerPos={setPlayerPos}
              habPos={gridData.habPosition}
              vehiclePos={gridData.vehiclePosition}
              exploredTilesRef={exploredTilesRef}
              keys={activeControls}
              activeBuilding={activeBuilding}
              setActiveBuilding={setActiveBuilding}
              materials={vehicleMaterials}
              setMaterials={setVehicleMaterials}
              backpack={backpack}
              setBackpack={setBackpack}
              backpackCapacity={backpackCapacity}
              cropGrowth={cropGrowth}
              sanity={sanity}
              bodyTemp={bodyTemp}
              health={health}
              o2={o2}
              maxO2={maxO2}
              hunger={hunger}
              thirst={thirst}
              onEatFood={() => {
                if (eatFood()) sfx.playEat();
              }}
              onDrinkWater={() => {
                if (drinkWater()) sfx.playDrink();
              }}
              isDay={isDay}
              solProgress={solProgress}
              isFlashlightOn={isFlashlightOn}
              thermalSpeedMultiplier={thermalSpeedMultiplier}
              powerMetrics={powerMetrics}
              batteryCharge={batteryCharge}
              onDepositCargo={handleDepositCargo}
              onHarvestCrops={() => {
                if (harvestCrops()) sfx.playEat();
              }}
              onPurifyWater={() => {
                if (purifyWater()) sfx.playDrink();
              }}
              onCallEarth={() => {
                if (callEarth()) sfx.playComms();
              }}
              loadout={selectedLoadout}
              craftedUpgrades={craftedUpgrades}
              onLogMessage={addLog}
              isPaused={isPaused}
              isGameOver={isGameOver}
              onMiningStateChange={setIsMining}
              onCameraUpdate={setCameraViewport}
              onInspectBuilding={handleInspectBuilding}
              onCollectBuildingOutput={collectBuildingOutput}
              relocatingBuilding={relocatingBuilding}
              setRelocatingBuilding={setRelocatingBuilding}
              enemies={enemies}
              setEnemies={setEnemies}
              onPlayerDamaged={handlePlayerDamaged}
              onEnemyDefeated={handleEnemyDefeated}
              onCollectLoot={handleCollectLoot}
              onDrainBattery={drainBattery}
              blasterTriggerCount={blasterTriggerCount}
              sfx={sfx}
              onToggleBuildingPower={handleToggleBuildingPower}
              activeCaveInfo={activeCaveLocation?.info}
              onExitCave={handleExitCave}
              onInspectCaveProp={handleInspectCaveProp}
              // Phase 2: Weather & Specialization Multipliers
              isDustStormActive={isDustStormActive}
              blasterDamageMultiplier={blasterDamageMultiplier}
              miningSpeedMultiplier={miningSpeedMultiplier}
              miningYieldMultiplier={miningYieldMultiplier}
              buildingCostMultiplier={buildingCostMultiplier}
              primaryAction={primaryAction}
              secondaryAction={secondaryAction}
              onOpenCargoModal={handleOpenCargoModal}
              orbitalPings={orbitalPings}
              rescuedCrew={rescuedCrew}
              crewAssignments={crewAssignments}
              onTalkToCrew={handleTalkToCrew}
            />
          </main>
        </div>
      )}

      {/* 5. Floating Bottom Vitals HUD (Survival Bar) */}
      {gameStage === 'PLAYING' && (
        <VitalsHUD
          lang={lang}
          health={health}
          sanity={sanity}
          hunger={hunger}
          thirst={thirst}
          o2={o2}
          maxO2={maxO2}
          bodyTemp={bodyTemp}
          foodRations={foodRations}
          waterRations={waterRations}
          hasCommsAccess={hasCommsAccess}
          temperature={temperature}
          isFreezing={isFreezing}
          isMining={isMining}
          isNearHab={isNearHab}
          backpack={backpack}
          backpackCapacity={backpackCapacity}
          onEatFood={() => {
            if (eatFood()) sfx.playEat();
          }}
          onDrinkWater={() => {
            if (drinkWater()) sfx.playDrink();
          }}
          onCallEarth={() => {
            if (callEarth()) sfx.playComms();
          }}
          onOpenPda={() => {
            setTabletView('PDA');
            setIsTabletOpen(true);
            sfx.playBeep(650, 0.06);
          }}
          onOpenBackpack={() => {
            setTabletView('BACKPACK');
            setIsTabletOpen(true);
            sfx.playBeep(650, 0.06);
          }}
        />
      )}

      {/* 6. On-Screen Virtual Controls for Mobile Devices */}
      {gameStage === 'PLAYING' && (
        <MobileControls
          lang={lang}
          onDirectionChange={(dir, pressed) => {
            setVirtualKeys((k) => ({ ...k, [dir]: pressed }));
          }}
          primaryAction={primaryAction}
          secondaryAction={secondaryAction}
          contextAction={primaryAction}
          hunger={hunger}
          thirst={thirst}
          foodRations={foodRations}
          waterRations={waterRations}
          onEatFood={() => {
            if (eatFood()) sfx.playEat();
          }}
          onDrinkWater={() => {
            if (drinkWater()) sfx.playDrink();
          }}
          onMineDefault={(pressed) => {
            setVirtualKeys((k) => ({ ...k, space: pressed }));
          }}
          alwaysShowJoystick={alwaysShowJoystick}
          onFireBlaster={handleFireBlasterMobile}
        />
      )}

      {/* Unified Physical Tactical Tablet Frame (Prologue, Dialog, Shop, PDA, Crafting, Events) */}
      <TacticalTabletModal
        isOpen={isTabletOpen}
        onClose={() => setIsTabletOpen(false)}
        activeView={tabletView}
        setActiveView={setTabletView}
        lang={lang}
        setLang={setLang}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        isFlashlightOn={isFlashlightOn}
        onToggleFlashlight={() => {
          toggleFlashlight();
          sfx.playBeep(750, 0.05);
        }}
        commsInfo={commsInfo}
        commsCooldown={commsCooldown}
        commsIntel={commsIntel}
        orbitalPings={orbitalPings}
        onCallEarth={() => {
          if (callEarth()) sfx.playComms();
        }}
        bodyTemp={bodyTemp}
        isDay={isDay}
        batteryCharge={batteryCharge}
        maxBatteryCapacity={maxBatteryCapacity}
        powerMetrics={powerMetrics}
        sol={sol}
        solTimeRemaining={solTimeRemaining}
        onPassSol={() => {
          sfx.playBeep(520, 0.08);
          advanceSol();
        }}
        vehicleMaterials={vehicleMaterials}
        vehicleCapacity={vehicleCapacity}
        backpack={backpack}
        backpackCapacity={backpackCapacity}
        logs={logs}
        isInWarmthZone={powerMetrics ? (powerMetrics.temperature > 0 || isNearHab) : true}
        onRestartMission={handleRestartMission}
        alwaysShowJoystick={alwaysShowJoystick}
        onToggleJoystick={() => setAlwaysShowJoystick((prev) => !prev)}
        // Commander Profile & Logistics
        commanderSpec={commanderSpec}
        commanderName={commanderName}
        // Phase 3: Rescued Crew & Base Assignments
        rescuedCrew={rescuedCrew}
        crewAssignments={crewAssignments}
        onSetCrewAssignment={(crewId, assignment) => {
          sfx.playBeep(640, 0.05);
          setCrewAssignments((prev) => ({ ...prev, [crewId]: assignment }));
        }}
        foodRations={foodRations}
        waterRations={waterRations}
        onEatFood={() => {
          if (eatFood()) sfx.playEat();
        }}
        onDrinkWater={() => {
          if (drinkWater()) sfx.playDrink();
        }}
        // Pre-launch Loadout
        selectedLoadout={selectedLoadout}
        onToggleLoadoutItem={handleToggleLoadoutItem}
        onSetLoadout={setSelectedLoadout}
        onConfirmLaunch={handleConfirmLaunch}
        // Phase 2: Adaptive Comms, Weather, Orbital Window & Discounts
        isAntennaRepaired={isAntennaRepaired}
        onRepairAntenna={repairAntenna}
        isDustStormActive={isDustStormActive}
        orbitalWindowStatus={orbitalWindowStatus}
        orbitalWindowSols={orbitalWindowSols}
        buildingCostMultiplier={buildingCostMultiplier}
        isNearHab={isNearHab}
        // Clash-of-Clans Build Shop
        onSelectBuildingToDeploy={(building) => {
          sfx.playBuild();
          setActiveBuilding(building);
          setIsTabletOpen(false);
          addLog(
            `${t.deployStructure || 'Deploy'}: ${building.name[lang] || building.name.en}`,
            'info'
          );
        }}
        // Building Inspect & Upgrade
        inspectedTile={inspectedBuildingTile}
        onUpgradeBuilding={handleUpgradeBuilding}
        onCollectBuildingOutput={handleCollectBuilding}
        onStartRelocateBuilding={handleStartRelocate}
        onDismantleBuilding={handleDismantleBuilding}
        onToggleBuildingPower={handleToggleBuildingPower}
        onDepositToBuilding={handleDepositToBuilding}
        // Workshop Crafting
        craftedUpgrades={craftedUpgrades}
        onCraftUpgrade={handleCraftUpgrade}
        // Day 5 Threat Anomaly
        onSelectThreatChoice={(choiceId) => {
          sfx.playAlarm();
          resolveThreat(choiceId);
        }}
        // Survival Stats for Victory / Game Over
        health={health}
        sanity={sanity}
        // Unified Backpack & Rover Cargo logistics
        isNearVehicle={isNearVehicle}
        onDepositAll={handleDepositCargo}
        onTransferResource={handleTransferCargoResource}
      />

      {/* Subterranean Cave Exploration & Biome Inspection Modal */}
      <CaveExplorerModal
        isOpen={isCaveModalOpen}
        onClose={() => setIsCaveModalOpen(false)}
        caveType={activeCaveType}
        lang={lang}
        soundEnabled={soundEnabled}
        onRecoverTech={(techId) => {
          if (techId === 'turbine_core') {
            addLog(
              lang === 'ar'
                ? 'تم استرداد وتأمين قلب التوربين المغناطيسي لمركبة MAV بنجاح!'
                : 'Ares-I Turbine Core secured for MAV assembly!',
              'success'
            );
            setCraftedUpgrades((prev) => [...new Set([...prev, 'turbine_core'])]);
            sfx.playUpgrade();
          }
        }}
      />

      {/* Subterranean Lore Clue & Turbine Core Holographic Modal */}
      <CavePropModal
        isOpen={Boolean(inspectedCavePropTile)}
        propTile={inspectedCavePropTile}
        onClose={() => setInspectedCavePropTile(null)}
        lang={lang}
        onSalvageTurbine={handleSalvageTurbineCore}
        hasTurbineCore={craftedUpgrades.includes('turbine_core')}
        craftedUpgrades={craftedUpgrades}
        onSalvageRelic={handleSalvageRelic}
      />

      {/* Interactive Ares-I Astronaut Crew Dialogue & Rescue Modal */}
      <CrewDialogueModal
        isOpen={Boolean(activeDialogueCrewId)}
        onClose={() => setActiveDialogueCrewId(null)}
        crewId={activeDialogueCrewId}
        isRescued={rescuedCrew.includes(activeDialogueCrewId)}
        lang={lang}
        onRescue={(id) => handleSalvageRelic(id)}
        onAssign={(id, assignment) => {
          setCrewAssignments((prev) => ({ ...prev, [id]: assignment }));
        }}
        currentAssignment={crewAssignments[activeDialogueCrewId]}
        sfx={sfx}
      />
    </div>
  );
}
