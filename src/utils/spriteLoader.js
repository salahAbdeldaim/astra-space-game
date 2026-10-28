// Sprite Loader & Asset Cache for Kenney Sci-Fi Game Assets

export const SPRITE_MANIFEST = {
  // 1. Terrain & Surface Ground Tiles (Kenney Sci-Fi RTS)
  terrain_regolith_1: '/assets/sprites/terrain/scifiTile_41.png',
  terrain_regolith_2: '/assets/sprites/terrain/scifiTile_42.png',
  terrain_ice: '/assets/sprites/terrain/scifiTile_15.png',
  terrain_ice_deep: '/assets/sprites/terrain/scifiTile_16.png',
  terrain_metal: '/assets/sprites/terrain/scifiTile_27.png',
  terrain_metal_grate: '/assets/sprites/terrain/scifiTile_28.png',

  // Subterranean Cave Tiles & Masonry (Kenney Sokoban Retina & Sci-Fi)
  cave_wall_stone: '/assets/sprites/cave/block_07.png',
  cave_wall_stone_top: '/assets/sprites/cave/block_03.png',
  cave_wall_volcanic: '/assets/sprites/cave/block_08.png',
  cave_wall_volcanic_top: '/assets/sprites/cave/block_04.png',
  cave_wall_metal: '/assets/sprites/structures/scifiStructure_04.png',
  cave_wall_ice: '/assets/sprites/terrain/scifiTile_16.png',
  cave_wall_rock: '/assets/sprites/cave/block_07.png', // backward-compatibility

  cave_floor_stone: '/assets/sprites/cave/ground_04.png',
  cave_floor_spore: '/assets/sprites/cave/ground_04.png', // smooth slate bedrock
  cave_floor_spore_moss: '/assets/sprites/cave/ground_03.png', // bioluminescent organic moss bedrock
  cave_floor_volcanic: '/assets/sprites/cave/ground_05.png', // warm basalt cobblestones
  cave_floor_ice: '/assets/sprites/terrain/scifiTile_15.png',
  cave_floor_metal: '/assets/sprites/cave/ground_01.png',
  cave_floor_tech: '/assets/sprites/cave/ground_01.png',

  cave_crate_tech: '/assets/sprites/cave/crate_01.png',
  cave_crate_supply: '/assets/sprites/cave/crate_02.png',
  cave_exit_hoist: '/assets/sprites/tech/spaceParts_012.png',

  // 2. Resource Nodes & Geological Formations (Kenney Sci-Fi RTS & Space Shooter)
  node_regolith: '/assets/sprites/environment/scifiEnvironment_01.png',
  node_ice: '/assets/sprites/environment/scifiEnvironment_05.png',
  node_crystal: '/assets/sprites/environment/scifiEnvironment_11.png',
  crater_rock: '/assets/sprites/environment/spaceMeteors_001.png',
  crater_rock_1: '/assets/sprites/environment/spaceMeteors_001.png',
  crater_rock_2: '/assets/sprites/environment/spaceMeteors_002.png',
  crater_rock_3: '/assets/sprites/environment/spaceMeteors_003.png',
  crater_rock_4: '/assets/sprites/environment/spaceMeteors_004.png',
  env_rock_small: '/assets/sprites/environment/scifiEnvironment_02.png',
  env_rubble: '/assets/sprites/environment/scifiEnvironment_03.png',
  env_geode: '/assets/sprites/environment/scifiEnvironment_04.png',
  env_fissure_rock: '/assets/sprites/environment/scifiEnvironment_14.png',
  env_crystal_column: '/assets/sprites/environment/scifiEnvironment_09.png',

  // 3. Colony Infrastructure (Kenney Sci-Fi RTS & Space Station)
  structure_hab: '/assets/sprites/structures/scifiStructure_07.png',
  structure_hab_annex: '/assets/sprites/structures/scifiStructure_01.png',
  structure_solar: '/assets/sprites/structures/spaceStation_018.png',
  structure_biodome: '/assets/sprites/structures/scifiStructure_02.png',
  structure_heater: '/assets/sprites/structures/scifiStructure_16.png',
  structure_battery: '/assets/sprites/structures/scifiStructure_08.png',
  structure_battery_bank: '/assets/sprites/structures/spaceBuilding_004.png',
  structure_comms: '/assets/sprites/structures/spaceStation_020.png',
  structure_satellite_dish: '/assets/sprites/space/satellite_B.png',
  structure_wall: '/assets/sprites/structures/scifiStructure_04.png',
  structure_wall_gate: '/assets/sprites/structures/scifiStructure_06.png',
  structure_purifier: '/assets/sprites/structures/scifiStructure_14.png',
  structure_moxie_tank: '/assets/sprites/structures/spaceBuilding_003.png',
  structure_lab_adam: '/assets/sprites/structures/scifiStructure_13.png',

  // Portals & Gateway Architecture (CraftPix 2 Location)
  portal_cosmic_idle: '/assets/sprites/structures/portals/Portal1_Idle.png',
  portal_cosmic_start: '/assets/sprites/structures/portals/Portal1_Start.png',
  portal_fire_idle: '/assets/sprites/structures/portals/Portal2_Idle.png',
  portal_fire_start: '/assets/sprites/structures/portals/Portal2_Start.png',
  portal_arch_1: '/assets/sprites/structures/portals/Portal1.png',
  portal_arch_1_open: '/assets/sprites/structures/portals/Portal1_2.png',
  portal_arch_2: '/assets/sprites/structures/portals/Portal2.png',
  portal_arch_2_open: '/assets/sprites/structures/portals/Portal2_2.png',
  altar_monolith_idle: '/assets/sprites/structures/portals/Altar_Idle.png',
  altar_monolith_start: '/assets/sprites/structures/portals/Altar_Start.png',
  altar_prop_1: '/assets/sprites/structures/portals/Altar1.png',
  altar_prop_2: '/assets/sprites/structures/portals/Altar2.png',

  // Surface Rock & Boulder Props (CraftPix 2 Location)
  rock_prop_1: '/assets/sprites/environment/rocks/1.png',
  rock_prop_2: '/assets/sprites/environment/rocks/2.png',
  rock_prop_3: '/assets/sprites/environment/rocks/3.png',
  rock_prop_4: '/assets/sprites/environment/rocks/4.png',
  rock_prop_5: '/assets/sprites/environment/rocks/5.png',
  rock_prop_6: '/assets/sprites/environment/rocks/6.png',
  rock_prop_7: '/assets/sprites/environment/rocks/7.png',
  rock_prop_8: '/assets/sprites/environment/rocks/8.png',
  rock_prop_9: '/assets/sprites/environment/rocks/9.png',
  rock_prop_10: '/assets/sprites/environment/rocks/10.png',
  rock_prop_11: '/assets/sprites/environment/rocks/11.png',
  rock_prop_12: '/assets/sprites/environment/rocks/12.png',
  rock_prop_13: '/assets/sprites/environment/rocks/13.png',
  rock_prop_14: '/assets/sprites/environment/rocks/14.png',
  rock_prop_15: '/assets/sprites/environment/rocks/15.png',
  rock_prop_16: '/assets/sprites/environment/rocks/16.png',



  // Raw Plasma & Crystal Props (CraftPix 2 Location)
  crystal_prop_1: '/assets/sprites/environment/crystals/1.png',
  crystal_prop_2: '/assets/sprites/environment/crystals/2.png',
  crystal_prop_3: '/assets/sprites/environment/crystals/3.png',
  crystal_prop_4: '/assets/sprites/environment/crystals/4.png',
  crystal_prop_5: '/assets/sprites/environment/crystals/5.png',

  // 4. Human Technology, Industrial Props & Mission Stolen Parts
  tech_turbine_core: '/assets/sprites/tech/spaceParts_019.png',
  tech_turbine_housing: '/assets/sprites/tech/spaceParts_025.png',
  tech_energy_emitter: '/assets/sprites/structures/spaceBuilding_012.png',
  tech_power_coupler: '/assets/sprites/tech/spaceParts_012.png',
  tech_radiator_fin: '/assets/sprites/tech/spaceParts_006.png',
  tech_avionics_box: '/assets/sprites/tech/spaceParts_017.png',
  tech_cryo_capsule: '/assets/sprites/structures/spaceBuilding_018.png',
  tech_cargo_crate: '/assets/sprites/tech/spaceParts_035.png',

  // 5. MAV Launch Platform & Spacecraft (Kenney Rockets & Space Station)
  mav_hull_stage1: '/assets/sprites/mav/spaceRockets_001.png',
  mav_hull_stage2: '/assets/sprites/mav/spaceRockets_002.png',
  mav_thruster_bell: '/assets/sprites/mav/spaceRocketParts_008.png',
  mav_cockpit: '/assets/sprites/mav/spaceRocketParts_015.png',
  mav_launch_cradle: '/assets/sprites/structures/spaceStation_024.png',

  // 6. Martian Organisms & Biology (Kenney RTS Units & Alien UFO Pack)
  creature_burrower: '/assets/sprites/units/scifiUnit_46.png',
  creature_burrower_alpha: '/assets/sprites/units/scifiUnit_47.png',
  creature_crystal_walker: '/assets/sprites/units/scifiUnit_48.png',
  creature_bio_nest: '/assets/sprites/biology/dome.png',
  creature_spore_cluster: '/assets/sprites/biology/laserPink_burst.png',
  creature_thermal_organ: '/assets/sprites/biology/laserYellow_burst.png',
  creature_ice_cyst: '/assets/sprites/biology/laserBlue_burst.png',
  alien_burrower: '/assets/sprites/units/scifiUnit_46.png',

  // 6.5 Boss Units & High-Tier Martian Predators (CraftPix Boss Packs)
  boss_devil_idle: '/assets/sprites/bosses/devil_leader/idle.png',
  boss_devil_walk_front: '/assets/sprites/bosses/devil_leader/walk_front.png',
  boss_devil_walk_back: '/assets/sprites/bosses/devil_leader/walk_back.png',
  boss_devil_walk_left: '/assets/sprites/bosses/devil_leader/walk_left.png',
  boss_devil_walk_right: '/assets/sprites/bosses/devil_leader/walk_right.png',
  boss_devil_attack_front: '/assets/sprites/bosses/devil_leader/attack_front.png',
  boss_devil_attack_back: '/assets/sprites/bosses/devil_leader/attack_back.png',
  boss_devil_attack_left: '/assets/sprites/bosses/devil_leader/attack_left.png',
  boss_devil_attack_right: '/assets/sprites/bosses/devil_leader/attack_right.png',
  boss_devil_hurt: '/assets/sprites/bosses/devil_leader/hurt.png',
  boss_devil_dying: '/assets/sprites/bosses/devil_leader/dying.png',

  // Boss Attack Effects (Fire Slash)
  fx_fire_slash_01: '/assets/sprites/bosses/effects/Fire Slash_Frame_01.png',
  fx_fire_slash_02: '/assets/sprites/bosses/effects/Fire Slash_Frame_02.png',
  fx_fire_slash_03: '/assets/sprites/bosses/effects/Fire Slash_Frame_03.png',
  fx_fire_slash_04: '/assets/sprites/bosses/effects/Fire Slash_Frame_04.png',
  fx_fire_slash_05: '/assets/sprites/bosses/effects/Fire Slash_Frame_05.png',
  fx_fire_slash_06: '/assets/sprites/bosses/effects/Fire Slash_Frame_06.png',
  fx_fire_slash_07: '/assets/sprites/bosses/effects/Fire Slash_Frame_07.png',
  fx_fire_slash_08: '/assets/sprites/bosses/effects/Fire Slash_Frame_08.png',
  fx_fire_slash_09: '/assets/sprites/bosses/effects/Fire Slash_Frame_09.png',
  fx_fire_slash_10: '/assets/sprites/bosses/effects/Fire Slash_Frame_10.png',
  fx_fire_slash_11: '/assets/sprites/bosses/effects/Fire Slash_Frame_11.png',
  fx_fire_slash_12: '/assets/sprites/bosses/effects/Fire Slash_Frame_12.png',

  // 7. Astronaut & Exploration Units (Animated Commander 5-State Pack & Kenney Units)
  commander_idle: '/assets/sprites/units/commander/commander_idle.png',
  commander_walk: '/assets/sprites/units/commander/commander_walk.png',
  commander_attack: '/assets/sprites/units/commander/commander_attack.png',
  commander_hurt: '/assets/sprites/units/commander/commander_hurt.png',
  commander_death: '/assets/sprites/units/commander/commander_death.png',
  commander_weapon: '/assets/sprites/units/commander/commander_weapon.png',
  astronaut_idle: '/assets/sprites/units/spaceAstronauts_001.png',
  astronaut_walk: '/assets/sprites/units/spaceAstronauts_002.png',
  astronaut_blaster: '/assets/sprites/units/spaceAstronauts_003.png',
  unit_rover: '/assets/sprites/units/spaceShips_007.png',
  unit_rover_heavy: '/assets/sprites/units/scifiUnit_07.png',

  // 8. Loot & Collectibles
  loot_crystal: '/assets/sprites/environment/scifiEnvironment_11.png',

  // 9. Projectiles & Visual Effects (Kenney Space Shooter)
  projectile_blaster: '/assets/sprites/missiles/spaceMissiles_038.png',
  projectile_emitter_pulse: '/assets/sprites/missiles/spaceMissiles_035.png',
  effect_impact: '/assets/sprites/effects/spaceEffects_008.png',
  effect_plasma_burst: '/assets/sprites/effects/spaceEffects_011.png',
  effect_thruster_fire: '/assets/sprites/effects/spaceEffects_004.png',
  effect_spore_puff: '/assets/sprites/space/effect_purple.png',

  // 10. Tactical UI (Kenney UI Space Expansion)
  ui_panel_glass: '/assets/sprites/ui/panel_glass.png',
  ui_panel_glass_screws: '/assets/sprites/ui/panel_glass_screws.png',
  ui_panel_glass_notches: '/assets/sprites/ui/panel_glass_notches.png',
  ui_button_blade: '/assets/sprites/ui/blue_button_square_header_blade_rectangle_screws.png',
  ui_crosshair_tactical: '/assets/sprites/ui/crosshair_a.png',
  ui_cursor_target: '/assets/sprites/ui/cursor_f.png',

  // Atmospheric Fog & Particle Textures
  particle_smoke: '/assets/particles/smoke.png',
  particle_smoke_2: '/assets/particles/smoke 2.png',
  particle_dust: '/assets/particles/dust.png',
  particle_dirt: '/assets/particles/dirt 2.png',
  particle_martian_fog: '/assets/sprites/martian_fog.jpg',
};

const spriteCache = new Map();
let isPreloadingStarted = false;

export const preloadSprites = () => {
  if (isPreloadingStarted || typeof window === 'undefined') return;
  isPreloadingStarted = true;

  Object.entries(SPRITE_MANIFEST).forEach(([key, src]) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      spriteCache.set(key, img);
    };
    img.onerror = () => {
      console.warn(`[SpriteLoader] Failed to load sprite for "${key}" at "${src}"`);
    };
  });
};

export const getSprite = (key) => {
  return spriteCache.get(key) || null;
};

export const hasSprite = (key) => {
  return spriteCache.has(key);
};
