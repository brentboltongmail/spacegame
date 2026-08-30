        // --- 3D THREE.JS SPACE FLIGHT SIMULATOR (MOUSE TARGETING & SPEED) ---
        let scene, camera, renderer;
        let playerShip;
        let playerShieldBubble, capitalShip, theCrestStation, wormholeGate, starfield, spacePlanet, spacePlanetSphere, spacePlanetRing, spacePlanetRingMesh, spaceTitan, spaceTitanSphere, spaceTitanAtmosphere, spaceSun, targetBox3D;
        let capitalShips = [];
        let solarSystemPlanets = [];
        let activeHyperspaceRifts = [];
        let fleetEmergenceActive = false;
        let fleetEmergenceStartTime = 0;
        let globalHyperspaceFlashLight = null;
        let capitalParticlePool = [];
        const MAX_CAPITAL_PARTICLES = 100;
        let activeCapitalParticles = [];
        let dreadOrbitAngle = 0.5; // Orbit angle around spacePlanet
        let mapCrestMesh, mapDreadGroup;
        let enemyShips = [];
        let laserProjectiles = [];
        let enemyLaserProjectiles = [];
        let targetSpeed = 0;
        let currentSpeed = 0;
        let isWormholeActive = false;

        // --- TITAN EXCAVATION, HUGE GOLDEN RING & PURPLE TRACTOR EXTRACTION GLOBALS ---
        let titanExcavationSite = null;
        let titanExcavationCraterMesh = null;
        let titanIceCrustMesh = null;
        let titanExcavationLight = null;
        let titanVaporPool = [];
        let titanActiveVapor = [];
        let titanLightningBolts = [];
        let titanShockwaves = [];

        let ancientGoldenGate = null;
        let goldenRingMesh = null;
        let goldenGlyphRingMesh = null;
        let goldenGatePylons = [];
        let goldenGateVortexGroup = null;
        let goldenGateSpiralPoints = null;
        let goldenGateTunnelPoints = null;
        let goldenGateBorderPoints = null;
        let goldenGateLight = null;
        let goldenGateRipples = [];

        let titanExcavationPhase = 'WAITING_FOR_FLEET'; // 'WAITING_FOR_FLEET' -> 'BOMBARDMENT' -> 'GATE_REVEALED' -> 'TRACTOR_EXTRACTION' -> 'GATE_ACTIVE'
        let isTitanExcavationStarted = false;
        let titanExcavationStartTime = 0;
        let goldenRingLiftProgress = 0.0; // 0.0 (in crater) -> 1.0 (in orbit)
        const titanExtractionCraterLocalPos = new THREE.Vector3(-246, 178, 1047).normalize().multiplyScalar(1100);
        const titanExtractionOrbitWorldPos = new THREE.Vector3(75200, 2400, -44600);
        const titanBombardmentWorldFocus = new THREE.Vector3(76314, -1408, -48233);
        let capitalSpinalBeams = [];

        // --- THE CREST DESTRUCTION & BREAKUP GLOBALS ---
        let theCrestModelOriginal = null;
        let theCrestExplosionGroup = null;
        let theCrestDebrisChunks = [];
        let theCrestFireballs = [];
        let theCrestShockwaves = [];
        let theCrestExplosionLight = null;
        let theCrestState = 'INTACT'; // 'INTACT', 'STRUCK', 'EXPLODING', 'DESTROYED'
        let theCrestExplosionStartTime = 0;
        let hasTitanCinematicPlayed = false;

        // --- FLEET ARRIVAL DIALOGUE COMMS GLOBALS ---
        let arrivalCommsAudio = null;
        let arrivalCommsTimeout = null;
        let playedArrivalStages = { stage1: false, stage2: false, stage3: false, stage4: false };

        function playArrivalCommsLine(lineData) {
            if (isTitanCinematicActive) return; // Don't overlap with ending cinematic
            const overlay = document.getElementById('cinematic-comms-overlay');
            const commsBox = document.getElementById('cinematic-comms-box');
            const commsSpeaker = document.getElementById('comms-speaker');
            const commsSubspeaker = document.getElementById('comms-subspeaker');
            const commsSubtitle = document.getElementById('comms-subtitle');
            const commsBadge = document.getElementById('comms-step-badge');
            const commsIcon = document.getElementById('comms-avatar-icon');

            if (overlay) overlay.style.display = 'block';
            if (commsBox) commsBox.className = 'cinematic-comms-box speaker-kaylen';
            if (commsSpeaker) commsSpeaker.innerText = lineData.speaker;
            if (commsSubspeaker) commsSubspeaker.innerText = lineData.subspeaker;
            if (commsSubtitle) commsSubtitle.innerText = `"${lineData.text}"`;
            if (commsBadge) commsBadge.innerText = lineData.badge || "COMMS";
            if (commsIcon) commsIcon.innerText = "🚀";

            if (arrivalCommsAudio) {
                arrivalCommsAudio.pause();
                arrivalCommsAudio = null;
            }
            if (arrivalCommsTimeout) {
                clearTimeout(arrivalCommsTimeout);
                arrivalCommsTimeout = null;
            }

            arrivalCommsAudio = new Audio(lineData.audioSrc);
            arrivalCommsAudio.volume = 1.0;

            const hideComms = () => {
                arrivalCommsTimeout = setTimeout(() => {
                    if (!isTitanCinematicActive && overlay) {
                        overlay.style.display = 'none';
                    }
                }, 1000);
            };

            arrivalCommsAudio.onended = hideComms;
            arrivalCommsAudio.onerror = hideComms;
            arrivalCommsAudio.play().catch(e => {
                console.warn("Arrival comms audio play error:", e);
                hideComms();
            });
        }

        let cameraMode = 0; // 0: Cockpit View (Default), 1: Follow (close), 2: Follow (far), 3: Cinematic Showcase (Invincible)
        let isShipInvincible = false;
        let isPlayerDead = false;
        let cinematicAngle = 0;

        let isGamePaused = false;
        let playerCredits = 125000;
        // Max speed cap increased by 40% (1350 -> 1890 units/frame, 700 km/s in HUD)
        const maxSpeedCap = 1890;
        let upgradeHangarScene, upgradeHangarCamera, upgradeHangarRenderer, upgradeHangarShip, upgradeHangarBackgroundShips, hangarShieldMesh;
        let isHangarDragging = false;
        let previousHangarMousePosition = { x: 0, y: 0 };
        let hangarTargetRotationY = Math.PI * 0.75;
        let hangarTargetRotationX = 0;
        let hangarCamTargetPos = new THREE.Vector3(0, 1.8, 11);
        let hangarCamLookAtPos = new THREE.Vector3(0, 0, 0);

        const shipUpgrades = {
            blasters: { level: 3, maxLevel: 5, cost: 15000, name: 'Quantum Plasma Blasters' },
            shields:  { level: 4, maxLevel: 5, cost: 22000, name: 'Deflector Shield Generator' },
            thrusters: { level: 3, maxLevel: 5, cost: 18000, name: 'Ion Thruster Nacelles' },
            sensors:  { level: 4, maxLevel: 5, cost: 12000, name: 'Tactical Sensor Array' }
        };

        function updateCameraViewUI() {
            const modeLabels = [
                "Cockpit",
                "Follow (close)",
                "Follow (far)",
                "Cinematic"
            ];
            const btnEl = document.getElementById('camera-view-mode-btn');
            if (btnEl) {
                btnEl.innerText = `(C) Camera: ${modeLabels[cameraMode] || "Follow (far)"}`;
            }
            const textEl = document.getElementById('camera-view-mode-text');
            if (textEl) {
                textEl.innerText = modeLabels[cameraMode] || "Follow (far)";
            }
        }

        function setCameraMode(modeIndex) {
            if (typeof modeIndex === 'number' && modeIndex >= 0 && modeIndex < 4) {
                cameraMode = modeIndex;
                applyCameraModeEffects();
            }
        }

        function toggleCameraMode() {
            cameraMode = (cameraMode + 1) % 4;
            applyCameraModeEffects();
        }

        function applyCameraModeEffects() {
            isShipInvincible = (cameraMode === 3);

            const modeLabels = [
                "Cockpit",
                "Follow (close)",
                "Follow (far)",
                "Cinematic"
            ];

            showToast(`🎥 Camera: ${modeLabels[cameraMode]}`);
            updateCameraViewUI();

            const crosshair = document.querySelector('.hud-center-crosshair');
            if (crosshair) {
                crosshair.style.opacity = (cameraMode === 0) ? '1' : '0';
            }
            const lockZone = document.getElementById('target-lock-zone');
            if (lockZone) {
                lockZone.style.opacity = (cameraMode === 0) ? '1' : '0';
            }
        }

        let normalizedMouse = { x: 0, y: 0 };
        let virtualCursorX = window.innerWidth / 2;
        let virtualCursorY = window.innerHeight / 2;
        const keys = { 
            KeyW: false, KeyS: false, KeyA: false, KeyD: false, KeyQ: false, KeyE: false, Space: false,
            ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
            PitchUp: false, PitchDown: false, YawLeft: false, YawRight: false
        };
        let keyBindings = { 
            KeyW: 'KeyW', KeyS: 'KeyS', KeyA: 'KeyA', KeyD: 'KeyD', 
            PitchUp: 'ArrowUp', PitchDown: 'ArrowDown', YawLeft: 'ArrowLeft', YawRight: 'ArrowRight',
            Space: 'Space', KeyM: 'KeyM', KeyL: 'KeyL', KeyC: 'KeyC', Escape: 'Escape' 
        };

        let isFlightLocked = false;

        
        function getRendererConfig(extraOpts = {}) {
            let p = "windows";
            if (typeof currentProfile !== 'undefined' && currentProfile && currentProfile.settings && currentProfile.settings.platform) {
                p = currentProfile.settings.platform;
            }
            let conf = { logarithmicDepthBuffer: true };
            if (p === "mac") {
                conf.logarithmicDepthBuffer = false; // Disable heavy depth buffer math on Mac for huge FPS boost
                conf.antialias = (window.devicePixelRatio === 1);
                conf.alpha = false;
                conf.powerPreference = "high-performance";
            } else {
                conf.antialias = true;
                conf.alpha = true;
                conf.powerPreference = "default";
            }
            return Object.assign(conf, extraOpts);
        }

        function init3DSimulator() {
            const container = document.getElementById('canvas-container');
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x070913, 0.00003); // 16x lighter fog for crystal clear space visibility!

            camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 1.0, 2000000);
            camera.position.set(78600, -1174, -47158);

            renderer = new THREE.WebGLRenderer(getRendererConfig({ alpha: currentProfile?.settings?.platform !== "mac" }));
            renderer.setSize(container.clientWidth, container.clientHeight);
            const maxPixelRatio = (currentProfile?.settings?.platform === "mac") ? 1 : 2;
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
            renderer.shadowMap.enabled = true;
            container.appendChild(renderer.domElement);

            // Lighting (Brightened for Crisp 3D Ship Detail Visibility)
            const ambientLight = new THREE.AmbientLight(0x94a3b8, 3.2); // Bright neutral fill light
            scene.add(ambientLight);

            const sunLight = new THREE.DirectionalLight(0xfffaed, 4.5); // Primary solar star directional light
            sunLight.position.set(750000, 400000, 500000); // Aligned with 1,000,000-unit distant Solar Star position!
            scene.add(sunLight);

            const fillRimLight = new THREE.DirectionalLight(0x38bdf8, 2.5); // Secondary cyan-blue rim light
            fillRimLight.position.set(-400, -300, -300);
            scene.add(fillRimLight);

            const cyanGlow = new THREE.PointLight(0x00f0ff, 4, 300);
            cyanGlow.position.set(0, 20, -100);
            scene.add(cyanGlow);

            createStarfield();
            createSolarSun();
            createSpacePlanet();
            createTitanMoon();
            createSolarSystemPlanets();
            createTheCrestStation();
            loadVoidInterceptorModel();
            loadDominionFighterModel();
            createPlayerShip();
            createCapitalShip();
            createWormholeGate();
            initLaserPool();

            // 🎯 Create 3D Corner Bracket Target Box Pool for All Visible Hostiles
            initEnemyTargetBoxPool(45);

            const crosshair = document.querySelector('.hud-center-crosshair');
            if (crosshair) crosshair.style.opacity = (cameraMode === 0) ? '1' : '0';
            const lockZone = document.getElementById('target-lock-zone');
            if (lockZone) lockZone.style.opacity = (cameraMode === 0) ? '1' : '0';

            updateCameraViewUI();
            initTacticalMap3D();

            // Event Listeners for Mouse Targeting & Key Controls
            window.addEventListener('resize', onWindowResize);
            
            container.addEventListener('mousemove', (e) => {
                if (typeof isTitanCinematicActive !== 'undefined' && isTitanCinematicActive) return; // Controls locked during cinematic
                const isPointerLocked = document.pointerLockElement === container || document.pointerLockElement === document.body;
                
                if (isPointerLocked) {
                    if (!isFlightLocked && !isTacticalMapOpen) {
                        virtualCursorX += e.movementX;
                        virtualCursorY += e.movementY;
                        
                        // Clamp virtual cursor to screen bounds
                        virtualCursorX = Math.max(0, Math.min(window.innerWidth, virtualCursorX));
                        virtualCursorY = Math.max(0, Math.min(window.innerHeight, virtualCursorY));
                        
                        normalizedMouse.x = (virtualCursorX / window.innerWidth) * 2 - 1;
                        normalizedMouse.y = -(virtualCursorY / window.innerHeight) * 2 + 1;
                    }

                    const crosshair = document.querySelector('.hud-center-crosshair');
                    if (crosshair) {
                        crosshair.style.left = virtualCursorX + 'px';
                        crosshair.style.top = virtualCursorY + 'px';
                    }
                } else {
                    if (!isFlightLocked && !isTacticalMapOpen) {
                        normalizedMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
                        normalizedMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
                        virtualCursorX = e.clientX;
                        virtualCursorY = e.clientY;
                    }

                    const crosshair = document.querySelector('.hud-center-crosshair');
                    if (crosshair) {
                        crosshair.style.left = e.clientX + 'px';
                        crosshair.style.top = e.clientY + 'px';
                    }
                }
            });

            // Left Click (0) AND Right Click (2) both fire plasma blasters!
            container.addEventListener('mousedown', (e) => {
                if (typeof isTitanCinematicActive !== 'undefined' && isTitanCinematicActive) return; // Controls locked during cinematic
                if (e.button === 0 || e.button === 2) {
                    if (!e.target.closest('.hud-card') && !e.target.closest('.hud-action-bar') && !e.target.closest('.nav-item')) {
                        firePlasmaLaser();
                    }
                }
            });

            // Disable browser right-click popup menu on canvas
            container.addEventListener('contextmenu', e => e.preventDefault());

            window.addEventListener('keydown', (e) => {
                if (activeRebindAction) return;
                if (typeof isTitanCinematicActive !== 'undefined' && isTitanCinematicActive) {
                    if (e.code === 'Escape') {
                        stopTitanGateCinematic();
                    }
                    return; // Controls 100% locked during cinematic!
                }
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                    if (!e.target.matches('input, textarea, select')) {
                        e.preventDefault();
                    }
                }
                let action = Object.keys(keyBindings).find(k => keyBindings[k] === e.code) || e.code;
                if (keys.hasOwnProperty(action)) keys[action] = true;
                if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
                if (action === 'KeyM') toggleTacticalMapModal();
                if (action === 'Escape') {
                    if (isTacticalMapOpen) {
                        toggleTacticalMapModal();
                    } else {
                        togglePauseUpgradeModal();
                    }
                }
                if (action === 'Space') firePlasmaLaser();
                if (action === 'KeyC') toggleCameraMode();
                if (action === 'KeyL') {
                    isFlightLocked = !isFlightLocked;
                    if (isFlightLocked) {
                        normalizedMouse.x = 0;
                        normalizedMouse.y = 0;
                        showToast("🔒 AUTO-PILOT ENGAGED! Ship maintaining heading — Free mouse to drag windows!");
                    } else {
                        showToast("🔓 AUTO-PILOT DISENGAGED! Flight steering active");
                    }
                }
                if (action === 'Tab') {
                    e.preventDefault();
                    if (document.pointerLockElement === container || document.pointerLockElement === document.body) {
                        document.exitPointerLock();
                        if (document.fullscreenElement) {
                            document.exitFullscreen().catch(() => {});
                        }
                        showToast("🔓 POINTER UNLOCKED: Follow mouse cursor mode active");
                    } else {
                        if (!document.fullscreenElement) {
                            try {
                                if (document.documentElement.requestFullscreen) {
                                    document.documentElement.requestFullscreen().catch(() => {});
                                } else if (document.documentElement.webkitRequestFullscreen) {
                                    document.documentElement.webkitRequestFullscreen().catch(() => {});
                                }
                            } catch(err) {
                                console.log("Tab fullscreen prevented: " + err);
                            }
                        }
                        container.requestPointerLock();
                        showToast("🔒 POINTER LOCKED: FPS steering mode active");
                    }
                }
            });
            window.addEventListener('keyup', (e) => {
                if (typeof isTitanCinematicActive !== 'undefined' && isTitanCinematicActive) return; // Controls locked during cinematic
                let action = Object.keys(keyBindings).find(k => keyBindings[k] === e.code) || e.code;
                if (keys.hasOwnProperty(action)) keys[action] = false;
                if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
            });



            // Force Pre-compile hidden heavy cinematic assets so it doesn't freeze the main thread mid-flight!
            if (typeof ancientGoldenGate !== 'undefined' && ancientGoldenGate) ancientGoldenGate.visible = true;
            if (typeof titanExcavationSite !== 'undefined' && titanExcavationSite) titanExcavationSite.visible = true;
            renderer.compile(scene, camera);
            if (typeof ancientGoldenGate !== 'undefined' && ancientGoldenGate) ancientGoldenGate.visible = false;
            if (typeof titanExcavationSite !== 'undefined' && titanExcavationSite) titanExcavationSite.visible = false;

            animate();
        }

        function createStarfield() {
            const starsGeo = new THREE.BufferGeometry();
            const count = 7500; // Dense vibrant cosmic starfield
            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);

            const palette = [
                new THREE.Color(0x00f0ff), // Cyan glow
                new THREE.Color(0xffffff), // Brilliant White
                new THREE.Color(0xfffaed), // Golden White
                new THREE.Color(0xa855f7), // Nebula Purple
                new THREE.Color(0x38bdf8)  // Sapphire Blue
            ];

            for (let i = 0; i < count; i++) {
                // Distribute on far celestial horizon dome (radius 14,000 to 18,000 units away)
                const radius = 14000 + Math.random() * 4000;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos((Math.random() * 2) - 1);

                positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                positions[i * 3 + 2] = radius * Math.cos(phi);

                const c = palette[Math.floor(Math.random() * palette.length)];
                colors[i * 3]     = c.r;
                colors[i * 3 + 1] = c.g;
                colors[i * 3 + 2] = c.b;
            }

            starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            starsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const starsMat = new THREE.PointsMaterial({ 
                size: 0.8, // Reduced again for micro pin-point celestial stars
                vertexColors: true, 
                transparent: true, 
                opacity: 0.95,
                sizeAttenuation: false // Keeps stars crisp and bright far off on the horizon!
            });

            starfield = new THREE.Points(starsGeo, starsMat);
            scene.add(starfield);
        }

        function createSunSurfaceTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 1024; canvas.height = 512;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(0, 0, 1024, 512);

            ctx.fillStyle = '#fef08a';
            for (let i = 0; i < 60; i++) {
                const x = Math.random() * 1024;
                const y = Math.random() * 512;
                const rx = 30 + Math.random() * 90;
                const ry = 20 + Math.random() * 60;
                ctx.beginPath();
                ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
            for (let i = 0; i < 35; i++) {
                const x = Math.random() * 1024;
                const y = Math.random() * 512;
                ctx.beginPath();
                ctx.arc(x, y, 15 + Math.random() * 40, 0, Math.PI * 2);
                ctx.fill();
            }

            const texture = new THREE.CanvasTexture(canvas);
            return texture;
        }

        function createSolarSun() {
            const fallbackTex = createSunSurfaceTexture();
            const sunGeo = new THREE.SphereGeometry(30000, 128, 128); // 30,000 unit radius (60,000 unit diameter!)
            const sunMat = new THREE.MeshBasicMaterial({ 
                map: fallbackTex,
                color: 0xfffaed,
                fog: false // Unaffected by space fog — shines 100% bright across deep space!
            });

            new THREE.TextureLoader().load(
                'docs/images/space_sun_surface.jpg',
                (tex) => {
                    sunMat.map = tex;
                    sunMat.needsUpdate = true;
                }
            );

            spaceSun = new THREE.Mesh(sunGeo, sunMat);
            // Position primary solar star 1 million units away in upper-right deep space (750,000 X, 400,000 Y, 500,000 Z)
            spaceSun.position.set(750000, 400000, 500000);
            scene.add(spaceSun);

            // Inner Radiant Golden Corona Halo (32,000 radius)
            const coronaGeo = new THREE.SphereGeometry(32000, 64, 64);
            const coronaMat = new THREE.MeshBasicMaterial({
                color: 0xfbbf24,
                transparent: true,
                opacity: 0.55,
                side: THREE.BackSide,
                fog: false // Unaffected by space fog!
            });
            const corona = new THREE.Mesh(coronaGeo, coronaMat);
            spaceSun.add(corona);

            // Outer Fiery Solar Flare Prominence Halo (35,000 radius)
            const flareGeo = new THREE.SphereGeometry(35000, 64, 64);
            const flareMat = new THREE.MeshBasicMaterial({
                color: 0xff8f00,
                transparent: true,
                opacity: 0.35,
                side: THREE.BackSide,
                fog: false // Unaffected by space fog!
            });
            const flareHalo = new THREE.Mesh(flareGeo, flareMat);
            spaceSun.add(flareHalo);
        }

        function createSaturnSurfaceTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 2048; canvas.height = 1024;
            const ctx = canvas.getContext('2d');

            // Rich golden-amber Saturnian atmospheric base
            ctx.fillStyle = '#c28b38';
            ctx.fillRect(0, 0, 2048, 1024);

            // Horizontal atmospheric bands in authentic NASA Cassini/Hubble Saturn hues
            const bandColors = [
                '#d4a359', '#e8c48a', '#b87c2c', '#f3ddb3', 
                '#9c621d', '#dfb16c', '#faeccd', '#a46e28', '#c99347',
                '#ecd09f', '#be8942', '#dfba7e', '#8c5318', '#e5c58b'
            ];
            for (let i = 0; i < 90; i++) {
                const y = Math.random() * 1024;
                const h = 6 + Math.random() * 36;
                ctx.fillStyle = bandColors[Math.floor(Math.random() * bandColors.length)];
                ctx.globalAlpha = 0.50 + Math.random() * 0.45;
                ctx.fillRect(0, y, 2048, h);
            }
            ctx.globalAlpha = 1.0;

            // Northern polar blue hexagon atmospheric feature
            ctx.fillStyle = 'rgba(56, 189, 248, 0.40)';
            ctx.beginPath();
            ctx.ellipse(1024, 90, 480, 70, 0, 0, Math.PI * 2);
            ctx.fill();

            // South polar storm swirl
            ctx.fillStyle = 'rgba(146, 64, 14, 0.45)';
            ctx.beginPath();
            ctx.ellipse(1024, 960, 400, 50, 0, 0, Math.PI * 2);
            ctx.fill();

            // Subtle atmospheric cyclone swirls
            ctx.fillStyle = 'rgba(254, 243, 199, 0.35)';
            for (let i = 0; i < 30; i++) {
                const x = Math.random() * 2048;
                const y = 160 + Math.random() * 680;
                ctx.beginPath();
                ctx.ellipse(x, y, 60 + Math.random() * 120, 14 + Math.random() * 28, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            return texture;
        }

        function createTitanSurfaceTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 1024; canvas.height = 512;
            const ctx = canvas.getContext('2d');

            // Dense golden-orange organic smog background
            ctx.fillStyle = '#b45309';
            ctx.fillRect(0, 0, 1024, 512);

            // Atmospheric photochemical haze gradients
            const hazeColors = ['#d97706', '#f59e0b', '#fbbf24', '#92400e', '#78350f', '#e58e1b'];
            for (let i = 0; i < 40; i++) {
                const y = Math.random() * 512;
                const h = 10 + Math.random() * 45;
                ctx.fillStyle = hazeColors[Math.floor(Math.random() * hazeColors.length)];
                ctx.globalAlpha = 0.40 + Math.random() * 0.35;
                ctx.fillRect(0, y, 1024, h);
            }
            ctx.globalAlpha = 1.0;

            // Dark polar hood
            ctx.fillStyle = 'rgba(69, 26, 3, 0.50)';
            ctx.fillRect(0, 0, 1024, 70);
            ctx.fillRect(0, 442, 1024, 70);

            // Faint hydrocarbon lake outlines beneath the haze
            ctx.fillStyle = 'rgba(28, 25, 23, 0.35)';
            for (let i = 0; i < 15; i++) {
                const x = Math.random() * 1024;
                const y = 40 + Math.random() * 180;
                ctx.beginPath();
                ctx.ellipse(x, y, 25 + Math.random() * 70, 15 + Math.random() * 40, Math.random() * Math.PI, 0, Math.PI * 2);
                ctx.fill();
            }

            // Delicate high-altitude methane cloud wisps
            ctx.fillStyle = 'rgba(254, 243, 199, 0.35)';
            for (let i = 0; i < 25; i++) {
                const x = Math.random() * 1024;
                const y = 100 + Math.random() * 300;
                ctx.beginPath();
                ctx.ellipse(x, y, 40 + Math.random() * 90, 6 + Math.random() * 14, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            return texture;
        }

        function createAsteroidRockTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');

            // Dark silicate rock base gradient
            const grad = ctx.createLinearGradient(0, 0, 512, 512);
            grad.addColorStop(0, '#262422');
            grad.addColorStop(0.5, '#3b3734');
            grad.addColorStop(1.0, '#1c1b1a');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 512, 512);

            // Add rocky noise, mineral specks, and pitting
            const imgData = ctx.getImageData(0, 0, 512, 512);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                const noise = (Math.random() - 0.5) * 35;
                data[i] = Math.min(255, Math.max(0, data[i] + noise));
                data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
                data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
            }
            ctx.putImageData(imgData, 0, 0);

            // Draw craters & impact indentations
            for (let c = 0; c < 45; c++) {
                const cx = Math.random() * 512;
                const cy = Math.random() * 512;
                const r = 8 + Math.random() * 32;

                ctx.strokeStyle = 'rgba(15, 14, 13, 0.6)';
                ctx.fillStyle = 'rgba(25, 23, 21, 0.4)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        }
        window.createAsteroidRockTexture = createAsteroidRockTexture;

        function createIrregularAsteroidGeometry(radius = 1, detail = 2) {
            const geo = new THREE.IcosahedronGeometry(radius, detail);
            const pos = geo.attributes.position;
            const uvs = geo.attributes.uv;
            const v = new THREE.Vector3();

            for (let i = 0; i < pos.count; i++) {
                v.fromBufferAttribute(pos, i);
                
                // Doubled multi-frequency jagged noise layers
                const n1 = Math.sin(v.x * 3.8) * Math.cos(v.y * 4.4) * Math.sin(v.z * 3.2);
                const n2 = Math.sin(v.x * 9.0 + v.y * 9.0 + v.z * 9.0) * 0.35;
                const n3 = Math.cos(v.x * 15.0 - v.z * 15.0) * 0.18;
                
                // Deep jagged crater indentations
                const crater1 = Math.pow(Math.sin(v.x * 5.5 + v.y * 5.5), 2) * 0.38;
                const crater2 = Math.pow(Math.cos(v.y * 7.0 + v.z * 7.0), 2) * 0.28;
                
                // Asymmetric oblong stretching factor per vertex
                const jaggedScale = 1.0 + (n1 * 0.65 + n2 + n3) - (crater1 + crater2);
                v.multiplyScalar(Math.max(0.25, jaggedScale));
                pos.setXYZ(i, v.x, v.y, v.z);

                // Multi-scale randomized texture UV mapping variety
                if (uvs) {
                    const texScale = 1.0 + Math.abs(Math.sin(v.x * 8.0) * 2.5);
                    uvs.setXY(i, uvs.getX(i) * texScale, uvs.getY(i) * texScale);
                }
            }
            geo.computeVertexNormals();
            return geo;
        }
        window.createIrregularAsteroidGeometry = createIrregularAsteroidGeometry;

        function createSpacePlanet() {
            // High-Resolution Procedural Saturn Surface Map (Guaranteed Fallback)
            const fallbackTex = createSaturnSurfaceTexture();

            const planetGeo = new THREE.SphereGeometry(9000, 128, 128); // 18,000 unit diameter colossal gas giant
            // MeshBasicMaterial guarantees authentic texture albedo without overexposure from scene lights
            const planetMat = new THREE.MeshBasicMaterial({ 
                map: fallbackTex,
                fog: false
            });

            // Async load high-res photorealistic Saturn texture map with fallback
            new THREE.TextureLoader().load(
                'docs/images/saturn_surface.jpg',
                (tex) => {
                    tex.wrapS = THREE.RepeatWrapping;
                    tex.wrapT = THREE.ClampToEdgeWrapping;
                    planetMat.map = tex;
                    planetMat.needsUpdate = true;
                }
            );
            
            // Parent planetary group (Saturn overlooking Titan & The Crest in background vista)
            spacePlanet = new THREE.Group();
            spacePlanet.position.set(72060, 214, -81280);
            
            // Planetary axial tilt (26.73° natural celestial tilt, syncing planet cloud bands and ring plane)
            spacePlanet.rotation.x = 0.466;
            spacePlanet.rotation.z = -0.22;
            scene.add(spacePlanet);

            spacePlanetSphere = new THREE.Mesh(planetGeo, planetMat);
            spacePlanet.add(spacePlanetSphere);

            // Subtle Golden-Amber Atmospheric Horizon Rim Halo (9,080 radius)
            const atmoGeo = new THREE.SphereGeometry(9080, 64, 64);
            const atmoMat = new THREE.MeshBasicMaterial({
                color: 0xf59e0b,
                transparent: true,
                opacity: 0.22,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                depthWrite: false
            });
            const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
            spacePlanetSphere.add(atmosphere);

            // High-Resolution Textured Continuous Planetary Ring Disc (Dual Volumetric Layers for 3D depth)
            const ringDiscGeo = new THREE.RingGeometry(10800, 22800, 128);
            ringDiscGeo.rotateX(Math.PI / 2); // Aligns ring disc directly into planetary equatorial plane (parallel to cloud bands)
            
            const ringDiscMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 1.0,
                side: THREE.DoubleSide,
                depthWrite: false,
                fog: false
            });

            new THREE.TextureLoader().load(
                'docs/images/saturn_rings.png',
                (tex) => {
                    ringDiscMat.map = tex;
                    ringDiscMat.needsUpdate = true;
                }
            );

            const ringUpper = new THREE.Mesh(ringDiscGeo, ringDiscMat);
            ringUpper.position.y = 35;
            spacePlanet.add(ringUpper);

            const ringLower = new THREE.Mesh(ringDiscGeo, ringDiscMat);
            ringLower.position.y = -35;
            spacePlanet.add(ringLower);

            // Gigantic Planetary Ring System - 3D particle asteroids in Equatorial XZ plane
            const particleCount = 20000;
            const particleGeo = new THREE.TetrahedronGeometry(1, 0);
            const particleMat = new THREE.MeshBasicMaterial({ 
                color: 0xffffff,
                fog: false
            });
            
            new THREE.TextureLoader().load(
                'docs/images/asteroid_texture.jpg',
                (tex) => {
                    tex.wrapS = THREE.RepeatWrapping;
                    tex.wrapT = THREE.RepeatWrapping;
                    particleMat.map = tex;
                    particleMat.needsUpdate = true;
                }
            );

            spacePlanetRing = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
            
            const dummy = new THREE.Object3D();
            
            const innerRadius = 10800;
            const outerRadius = 22800;
            const ringThickness = 180;
            
            // Saturn ring particle color palette (creams, warm golds, icy silvers, dusty silicates)
            const colors = [
                new THREE.Color(0xfef3c7), // warm cream
                new THREE.Color(0xfde68a), // soft gold
                new THREE.Color(0xfbbf24), // amber tan
                new THREE.Color(0xd4d4d8), // icy silver grey
                new THREE.Color(0xa8a29e), // silicate tan
                new THREE.Color(0xffffff), // pure water ice
                new THREE.Color(0x78716c)  // dark silicate rock
            ];

            for (let i = 0; i < particleCount; i++) {
                // Random radius between inner and outer, respecting Cassini Division gap (16,800 to 18,000)
                let r = innerRadius + Math.random() * (outerRadius - innerRadius);
                if (r >= 16800 && r <= 18000 && Math.random() < 0.88) {
                    r = (Math.random() < 0.5) ? (innerRadius + Math.random() * (16800 - innerRadius)) : (18000 + Math.random() * (outerRadius - 18000));
                }
                const theta = Math.random() * Math.PI * 2;
                
                const x = r * Math.cos(theta);
                const z = r * Math.sin(theta);
                const y = (Math.random() - 0.5) * ringThickness;
                
                dummy.position.set(x, y, z);
                
                const scale = Math.random() * 16.0 + 0.5;
                dummy.scale.set(scale, scale, scale);
                
                dummy.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                dummy.updateMatrix();
                spacePlanetRing.setMatrixAt(i, dummy.matrix);
                
                const color = colors[Math.floor(Math.random() * colors.length)];
                spacePlanetRing.setColorAt(i, color);
            }
            
            spacePlanet.add(spacePlanetRing);
        }

        function createTitanMoon() {
            // High-Resolution Procedural Titan Surface Map (Guaranteed Fallback)
            const fallbackTex = createTitanSurfaceTexture();

            spaceTitan = new THREE.Group();
            // Positioned 300% further out from Saturn with 2.8° natural celestial orbital inclination above ring plane
            // Allows Saturn's majestic rings, cloud bands, and Cassini division to be fully visible from Titan
            spaceTitan.position.set(76560, -1586, -49280);
            scene.add(spaceTitan);

            const titanGeo = new THREE.SphereGeometry(1100, 64, 64); // Scaled down to authentic moon proportions (2,200 unit diameter)
            const titanMat = new THREE.MeshBasicMaterial({
                map: fallbackTex,
                fog: false
            });

            // Async load high-res photorealistic Titan texture map with fallback
            new THREE.TextureLoader().load(
                'docs/images/titan_surface.jpg',
                (tex) => {
                    tex.wrapS = THREE.RepeatWrapping;
                    tex.wrapT = THREE.ClampToEdgeWrapping;
                    titanMat.map = tex;
                    titanMat.needsUpdate = true;
                }
            );

            spaceTitanSphere = new THREE.Mesh(titanGeo, titanMat);
            spaceTitan.add(spaceTitanSphere);

            // Glowing Amber Atmospheric Veil (1,135 radius with depthWrite: false to never occlude background celestial bodies)
            const titanAtmoGeo = new THREE.SphereGeometry(1135, 48, 48);
            const titanAtmoMat = new THREE.MeshBasicMaterial({
                color: 0xf59e0b,
                transparent: true,
                opacity: 0.20,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                depthWrite: false
            });
            spaceTitanAtmosphere = new THREE.Mesh(titanAtmoGeo, titanAtmoMat);
            spaceTitanSphere.add(spaceTitanAtmosphere);
        }

        
        function createSolarSystemPlanets() {
            const saturnPos = new THREE.Vector3(72060, 214, -81280);
            const sunPos = new THREE.Vector3(750000, 400000, 500000);
            
            const getPos = (fractionFromSun) => {
                return new THREE.Vector3().copy(sunPos).lerp(saturnPos, fractionFromSun);
            };

            // The radius ratio is 9000 units : 58232 km (approx 0.15455 units per km)
            const planetData = [
                { name: 'Mercury', radius: 377, pos: getPos(1/6), tex: 'docs/images/mercury_surface.jpg', color: 0x888888 },
                { name: 'Venus', radius: 935, pos: getPos(2/6), tex: 'docs/images/venus_surface.jpg', color: 0xeebb88 },
                { name: 'Earth', radius: 984, pos: getPos(3/6), tex: 'docs/images/earth_surface.jpg', color: 0x4488ff },
                { name: 'Mars', radius: 524, pos: getPos(4/6), tex: 'docs/images/mars_surface.jpg', color: 0xff4422 },
                { name: 'Jupiter', radius: 10804, pos: getPos(5/6), tex: 'docs/images/jupiter_surface.jpg', color: 0xddaa88 },
                // Saturn is already present at getPos(6/6)
                { name: 'Uranus', radius: 3920, pos: getPos(7/6), tex: 'docs/images/uranus_surface.jpg', color: 0x88ccff },
                { name: 'Neptune', radius: 3805, pos: getPos(8/6), tex: 'docs/images/neptune_surface.jpg', color: 0x2244ff }
            ];

            planetData.forEach(data => {
                const group = new THREE.Group();
                group.position.copy(data.pos);
                scene.add(group);

                const geo = new THREE.SphereGeometry(data.radius, 128, 128);
                const mat = new THREE.MeshBasicMaterial({ color: data.color, fog: false });
                const mesh = new THREE.Mesh(geo, mat);
                group.add(mesh);
                
                solarSystemPlanets.push({ mesh: mesh, group: group, name: data.name, baseColor: data.color });

                new THREE.TextureLoader().load(
                    data.tex,
                    (tex) => {
                        tex.wrapS = THREE.RepeatWrapping;
                        tex.wrapT = THREE.ClampToEdgeWrapping;
                        mat.map = tex;
                        mat.color.setHex(0xffffff); // Revert to white after loading texture
                        mat.needsUpdate = true;
                    }
                );
            });
        }

        // =========================================================================
        // 🎯 3D RED CORNER BRACKET TARGET BOX GEOMETRY & POOL ENGINE
        // =========================================================================
        let enemyTargetBoxPool = [];

        function createCornerBoxGeometry(baseSize = 20, cornerRatio = 0.22) {
            const hs = baseSize / 2;
            const cl = baseSize * cornerRatio;
            const vertices = [];

            const xs = [-hs, hs];
            const ys = [-hs, hs];
            const zs = [-hs, hs];

            xs.forEach(x => {
                const dirX = x > 0 ? -1 : 1;
                ys.forEach(y => {
                    const dirY = y > 0 ? -1 : 1;
                    zs.forEach(z => {
                        const dirZ = z > 0 ? -1 : 1;

                        // Segment along X
                        vertices.push(x, y, z);
                        vertices.push(x + dirX * cl, y, z);

                        // Segment along Y
                        vertices.push(x, y, z);
                        vertices.push(x, y + dirY * cl, z);

                        // Segment along Z
                        vertices.push(x, y, z);
                        vertices.push(x, y, z + dirZ * cl);
                    });
                });
            });

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            return geometry;
        }

        function initEnemyTargetBoxPool(poolSize = 45) {
            const cornerBoxGeo = createCornerBoxGeometry(20, 0.22);
            enemyTargetBoxPool = [];

            for (let i = 0; i < poolSize; i++) {
                const mat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2, transparent: true, opacity: 0.85 });
                const lineSegments = new THREE.LineSegments(cornerBoxGeo, mat);
                lineSegments.visible = false;
                scene.add(lineSegments);
                enemyTargetBoxPool.push(lineSegments);
            }
        }
