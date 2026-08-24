# Spacegame Codebase Architecture Index

This document serves as a high-level map of index.html (the primary 6000+ line application file) to help locate logic blocks, physics, UI, and initialization functions quickly. 

**Rule:** Keep this document updated whenever major structural changes or entirely new systems are added to the codebase.

---

## 1. UI & HTML Structure
*   <section id="sim-section"> - The main 3D flight simulator view.
*   <section id="story-section"> - The Narrative & Campaign UI tab.
*   <section id="ships-section"> - The Ships & Fleet UI tab.
*   <section id="titles-section"> - The Main Titles / Hangar UI.
*   <div id="hud-overlay"> - The primary HUD wrapper containing the crosshair and draggable cards (radar, throttle, actions).

## 2. Initialization & Setup
*   init3DSimulator() - Sets up the entire Three.js scene, camera, renderer, and triggers world generation.
*   initDraggableBoxes() / setupDragEvents() - Logic for draggable HUD cards and syncing states to server.py via fetch.
*   switchTab(tabId) - Handles navigation between the main DOM UI tabs.

## 3. World Generation (Three.js)
*   createStarfield() - Spawns background star particles.
*   createSolarSun() - Creates the central star and its procedural texture.
*   createSpacePlanet() - Spawns the colossal photorealistic gas giant Saturn in the background vista overlooking Titan and The Crest (`(72060, 214, -81280)`), with glowing golden atmospheric halo, continuous high-resolution textured ring disc (`RingGeometry` with `docs/images/saturn_rings.png`), and instanced 3D asteroid particle belt with Cassini division gaps.
*   createTitanMoon() - Spawns Saturn's largest moon Titan (`docs/images/titan_surface.jpg`) with photochemical smog haze atmosphere and atmospheric repulsor buffer.
*   createTheCrestStation() - Loads and places the massive binary glTF orbital station model (`fbx/the_crest.glb`) in perimeter orbit around Titan with correct upright orientation (+Y axis command bridge/antennae, X-Z ring plane), 1,600-unit diameter scale, dual-tone lighting, station collision repulsor buffer, and 3D tactical map / radar blips.
*   createWormholeGate() - Generates the massive ancient wormhole structure.
*   initTacticalMap3D() / renderTacticalMap3D() - Populates and renders the real-time 3D interactive holographic tactical system map (tracking Player, Sol, Saturn, Titan, The Crest Station, Ancient Gate, Capital Dreadnought, and Hostile Swarms).

## 4. Ship Models & Construction
*   loadVoidInterceptorModel() / buildDetailedShipMesh() - Loads the ultra-fast binary glTF model (`fbx/void_interceptor.glb`) via `THREE.GLTFLoader`, centering, scaling, and twin engine exhaust glow assemblies (cavities, thruster discs, core discs, halos, point lights).
*   createPlayerShip() - Constructs the player's primary Void Interceptor group spawned in Titan perimeter orbit facing The Crest station, form-fitting aerodynamic hexagonal deflector shield mesh (`createHexagonalShieldMesh()` with procedural honeycomb lattice `createHexagonalShieldTexture()`, 5-second hit persistence timer, and glowing pulse animation), and engine lights.
*   createCapitalShip() - Loads the binary glTF Dominion Capital Ship model (`fbx/dominion_capital_ship.glb`) via `THREE.GLTFLoader`, scaled to 1,200 units length, multi-cluster crimson red engine glow arrays (interior cavity glow, plasma thruster discs, white cores, outer halos, red point lights), red glowing front weapon area (pulsating ruby plasma core, concentric magnetic choke rings, collimated plasma charge beam, dual crimson muzzle point lights), and fiery red exhaust particle plume emitter.
*   loadDominionFighterModel() / createEnemyInterceptorMesh() - Loads the binary glTF Dominion Fighter model (`fbx/dominion_fighter.glb`) via `THREE.GLTFLoader`, centered and scaled to ~12 units, with 4 rear crimson plasma thrusters (interior ruby cavity glows, plasma thruster discs, superheated white cores, outer halos, red point lights) for high-threat hostile AI swarms.

## 5. Main Game Loop & Physics
*   nimate() - The core rendering loop (requestAnimationFrame).
    *   *Ship Movement:* Flight controls, delta calculations, and quaternion rotations for the player ship are inside animate().
    *   *Camera Modes:* cameraMode switch (0=Cockpit, 1=Close, 2=Far, 3=Cinematic) is applied here.
    *   *AI Logic:* Iterates through enemySwarm to handle NPC flight paths and evasion behavior.
    *   *Laser Physics:* Iterates through active laserBolts and checks for intersection distances against enemies.
*   updateEngineParticleTrails() - Renders thruster exhaust trails.

## 6. Combat & Interactions
*   irePlasmaLaser() - Grabs from laser pool, sets positions, and assigns homing targets if closestEnemy is locked.
*   	riggerWormholeJump() - Initiates the jump sequence animation.
*   spawnEnemySwarm() - Spawns AI enemies into the scene dynamically.
*   spawnLaserImpactSparks() / createFieryExplosionFX() - Particle FX generation.

## 7. HUD Rendering & Canvas Updates
*   drawShieldGauge() - Updates the 2D canvas shield status UI.
*   drawThrottleGauge() - Updates the 2D canvas speed and throttle UI.
*   drawTacticalRadar() - Renders the 2D radar blips based on relative 3D object positions mapped to a 2D plane.
