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
*   loadVoidInterceptorModel() / buildDetailedShipMesh() - Loads the optimized textured binary glTF model (`fbx/void_interceptor.glb`, 180k faces, 5.8MB, KDTree UV-projected PBR textures) with original model orientation (`model.rotation.set(-Math.PI / 2, 0, -Math.PI / 2)`), twin engine exhaust glow assemblies (cavities, thruster discs, core discs, halos).
*   createPlayerShip() - Constructs the player's primary Void Interceptor group positioned in panoramic vantage (`(75200, 350, -34000)`) looking directly forward along -Z towards the incoming Dominion battle line at `(75200, -600, -43500)`, form-fitting aerodynamic hexagonal deflector shield mesh (`createHexagonalShieldMesh()` with procedural honeycomb lattice, 5-second hit persistence timer, and glowing pulse animation), and twin plasma engines.
*   createCapitalShip() / buildSingleCapitalShip() / DOMINION_FLEET_CONFIG - Loads the optimized textured binary glTF Dominion Capital Ship model (`fbx/dominion_capital_ship.glb`, 236k faces, 14.9MB, KDTree UV-projected 3-channel PBR textures) and instantiates the 5-ship Dominion Siege Fleet (*Shadow of Aythelgard*, *Titan's Bane*, *Iron Sovereign*, *Void Reaver*, *Blood Eclipse*) in a locked military battle line facing towards the player and The Crest (`fleetFacing = (0, 0, 1)`) along the original emergence flight corridor (`flightDirection = (0, 0, -1)`), with rear engines in the back (`z: 535`/`z: 525`), and recessed front spinal weapon cavities (`z: -475`).
*   createHyperspaceRiftMesh() / triggerDominionFleetHyperspaceEmergence() / playHyperspaceCrackAudio() - Multi-phase staggered hyperspace emergence sequence with a 15-second startup asset loading delay, procedural 3D jagged spacetime tear geometry, single pooled blinding point light flash, dynamic hyperspace window tracking that travels continuously with the ship along its deceleration corridor, expanding gravitational distortion shockwave ring, single-draw-call `THREE.Points` relativistic tachyon particle bursts, and cubic ease-out deceleration into battle stations.
*   Carrier Fighter Deployment Loop (`launchFightersFromCapitalShip()` in `animate()`) - Enemy fighters scramble and launch immediately (3 fighters per capital dreadnought) the instant each carrier emerges from hyperspace with high-speed intercept velocity (24-26 units/frame) to close across the sector, transitioning smoothly into 6-DOF dynamic dogfighting patterns and continuous 8-13s reinforcement waves from the ventral bays.
*   loadDominionFighterModel() / createEnemyInterceptorMesh() - Loads the optimized textured binary glTF Dominion Fighter model (`fbx/dominion_fighter.glb`, 153k faces, 5.7MB, KDTree UV-projected 3-channel PBR textures) via `THREE.GLTFLoader`, centered and scaled to ~12 units, with 4 rear crimson plasma thrusters.
*   initCapitalParticlePool() - Pre-allocates a fixed pool of 100 exhaust particle meshes in memory for zero garbage collection overhead and rock-solid 60 FPS rendering.

## 5. Main Game Loop & Physics
*   animate() - The core rendering loop (requestAnimationFrame).
    *   *Ship Movement:* Flight controls, delta calculations, and quaternion rotations for the player ship are inside animate().
    *   *Camera Modes:* cameraMode switch (0=Cockpit, 1=Close, 2=Far, 3=Cinematic) is applied here.
    *   *Hyperspace Rifts & Fleet Emergence:* Updates active spacetime cracks, shockwave scaling, flash decay, ship deceleration trajectories, and carrier fighter launch cycles.
    *   *AI Logic:* Iterates through enemySwarm to handle NPC flight paths and evasion behavior.
    *   *Laser Physics:* Iterates through active laserBolts and checks for intersection distances against enemies.
*   updateEngineParticleTrails() - Renders thruster exhaust trails.

## 6. Combat & Interactions
*   firePlasmaLaser() - Grabs from laser pool, sets positions, and assigns homing targets if closestEnemy is locked.
*   triggerWormholeJump() - Initiates the jump sequence animation.
*   triggerDominionFleetHyperspaceEmergence() - Triggers the full 5-ship fleet warp jump arrival sequence near Titan.
*   spawnEnemySwarm() - Spawns AI enemies into the scene dynamically.
*   spawnLaserImpactSparks() / createFieryExplosionFX() - Particle FX generation.

## 7. HUD Rendering & Canvas Updates
*   drawShieldGauge() - Updates the 2D canvas shield status UI.
*   drawThrottleGauge() - Updates the 2D canvas speed and throttle UI.
*   drawTacticalRadar() - Renders 2D radar blips for celestial bodies, The Crest station, Ancient Gate, active Dominion fighters, and all 5 Dominion Capital Dreadnoughts.
*   renderTacticalMap3D() - Synchronizes real-time 3D holographic icons and interactive tooltips for Sol, Saturn, Titan, The Crest, Ancient Gate, all 5 Dominion Capital Dreadnoughts (`mapDreadGroup`), and hostile fighter swarms.
