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
*   createSpacePlanet() - Spawns the colossal planetary body and instanced asteroid rings.
*   createWormholeGate() - Generates the massive ancient wormhole structure.
*   createMapEnvironment() - Populates the mini-map / holographic star map models.

## 4. Ship Models & Construction
*   createPlayerShip() - Constructs the player's primary Void Interceptor mesh and groups.
*   createCapitalShip() - Assembles the massive Titan Dreadnought geometry and materials.
*   createEnemyInterceptorMesh() - Returns a cloned mesh for generating hostile AI fighters.

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
