
        // --- REALTIME SERVER DEBUG LOGGER HELPER ---
        function remoteLog(msg) {
            console.log("[MAP DEBUG]", msg);
            try {
                fetch('/api/log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: msg })
                }).catch(() => {});
            } catch(err) {}
        }

        window.addEventListener('error', (e) => {
            remoteLog(`GLOBAL JS ERROR: ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`);
            const errDiv = document.createElement('div');
            errDiv.style.position = 'fixed';
            errDiv.style.top = '0'; errDiv.style.left = '0';
            errDiv.style.width = '100vw'; errDiv.style.height = '100vh';
            errDiv.style.background = 'red';
            errDiv.style.color = 'white';
            errDiv.style.zIndex = '999999';
            errDiv.style.padding = '20px';
            errDiv.style.fontFamily = 'monospace';
            errDiv.innerHTML = `<strong>JavaScript Error:</strong><br>${e.message}<br>Line: ${e.lineno}<br>Col: ${e.colno}<br><pre>${e.error ? e.error.stack : ''}</pre>`;
            document.body.appendChild(errDiv);
        });

        window.addEventListener('unhandledrejection', (e) => {
            remoteLog(`UNHANDLED PROMISE REJECTION: ${e.reason}`);
            const errDiv = document.createElement('div');
            errDiv.style.position = 'fixed';
            errDiv.style.top = '0'; errDiv.style.left = '0';
            errDiv.style.width = '100vw'; errDiv.style.height = '100vh';
            errDiv.style.background = 'red';
            errDiv.style.color = 'white';
            errDiv.style.zIndex = '999999';
            errDiv.style.padding = '20px';
            errDiv.style.fontFamily = 'monospace';
            errDiv.innerHTML = `<strong>Unhandled Promise Rejection:</strong><br><pre>${e.reason && e.reason.stack ? e.reason.stack : e.reason}</pre>`;
            document.body.appendChild(errDiv);
        });

        // --- Game Titles Data ---
        const gameTitles = [
            {
                title: "Solaris Horizon: Emergence",
                badge: "Top Recommendation",
                badgeClass: "badge-cyan",
                desc: "Focuses directly on your main protagonist's mystery—an Earth-raised pilot awakening to his royal ancient bloodline across wormhole frontiers.",
                likes: 42
            },
            {
                title: "Starbound Scion: Void Vanguard",
                badge: "High Action",
                badgeClass: "badge-gold",
                desc: "Emphasizes big fleet combat, strike fighter dogfights, and reclaiming a lost galactic throne from usurping warlords.",
                likes: 38
            },
            {
                title: "Wormhole Genesis: Royal Blood",
                badge: "Exploration & War",
                badgeClass: "badge-purple",
                desc: "Highlights the central transportation portal mechanic and the ancient mystery connecting Earth space force to alien dynasties.",
                likes: 29
            },
            {
                title: "Chronicles of Aythelgard: The Lost Sovereign",
                badge: "Epic Sci-Fi RPG",
                badgeClass: "badge-gold",
                desc: "Classic space opera title bringing to mind space warfare, mysterious origins, and ancient alien ancient technology.",
                likes: 35
            },
            {
                title: "Solaris Drift: Vanguard Lineage",
                badge: "Space Simulator",
                badgeClass: "badge-cyan",
                desc: "Sleek, modern title highlighting space flight simulation, deep space exploration, and small-ship-to-capital-ship combat.",
                likes: 21
            },
            {
                title: "Event Horizon: Reclaim",
                badge: "Direct Action",
                badgeClass: "badge-red",
                desc: "Short, punchy title focusing on high-stakes space battles, wormhole travel, and tactical fleet operations.",
                likes: 19
            }
        ];

        // --- USER PROFILE & SERVER PERSISTENCE ---
        let currentUsername = 'pilot_1';
        let currentProfile = { username: 'pilot_1', boxPositions: {}, settings: {}, progress: {} };

        async function loadProfileFromServer(username) {
            currentUsername = username || 'pilot_1';
            try {
                const res = await fetch(`/api/profile?user=${encodeURIComponent(currentUsername)}`);
                if (res.ok) {
                    currentProfile = await res.json();
                    if (currentProfile.settings) {
                        const set = currentProfile.settings;
                        if (set.masterVol !== undefined) document.getElementById('slider-vol-master').value = set.masterVol;
                        if (set.engineVol !== undefined) document.getElementById('slider-vol-engine').value = set.engineVol;
                        if (set.firingVol !== undefined) document.getElementById('slider-vol-firing').value = set.firingVol;
                        if (set.musicVol !== undefined) document.getElementById('slider-vol-music').value = set.musicVol;
                        updateAudioVolumes();
                        if (set.rollSpeed !== undefined) document.getElementById('slider-set-roll').value = set.rollSpeed;
                        if (set.cameraLag !== undefined) document.getElementById('slider-set-cam').value = set.cameraLag;
                        if (set.throttleAccel !== undefined) document.getElementById('slider-set-throttle').value = set.throttleAccel;
                        if (set.shieldRegenMult !== undefined) document.getElementById('slider-set-shield-regen').value = set.shieldRegenMult;
                        if (set.hullRegenMult !== undefined) document.getElementById('slider-set-hull-regen').value = set.hullRegenMult;
                        if (set.enemyDamageMult !== undefined) document.getElementById('slider-set-enemy-dmg').value = set.enemyDamageMult;
                        if (set.playerDamageMult !== undefined) document.getElementById('slider-set-player-dmg').value = set.playerDamageMult;
                        updateGameSettings();
                    }
                    if (currentProfile.keyBindings) {
                        keyBindings = currentProfile.keyBindings;
                        for (const action in keyBindings) {
                            const code = keyBindings[action];
                            let display = code.replace(/^Key/, '').toUpperCase();
                            if (code === 'Space') display = 'SPACE';
                            if (code === 'Escape') display = 'ESC';
                            
                            // fallback for defaults if they match
                            if (action === 'Space' && code === 'Space') display = 'Space / Mouse 1';
                            
                            const el = document.getElementById('key-' + action);
                            if (el) el.innerText = display;
                        }
                    } else {
                        keyBindings = { KeyW: 'KeyW', KeyS: 'KeyS', KeyA: 'KeyA', KeyD: 'KeyD', Space: 'Space', KeyM: 'KeyM', KeyL: 'KeyL', KeyC: 'KeyC', Escape: 'Escape' };
                        currentProfile.keyBindings = keyBindings;
                    }
                }
            } catch (e) {
                console.warn("Could not fetch profile from server:", e);
            }
            initDraggableBoxes();
        }

        async function saveProfileToServerSilent() {
            if (!currentProfile) currentProfile = { username: currentUsername, boxPositions: {} };
            currentProfile.username = currentUsername;

            try {
                await fetch('/api/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currentProfile)
                });
            } catch (e) {
                console.error("Silent server save failed:", e);
            }
        }

        async function switchUserProfile(newUsername) {
            await loadProfileFromServer(newUsername);
            showToast(`Loaded User Profile: ${newUsername}`);
        }

        function resetAllBoxPositions() {
            if (currentProfile) currentProfile.boxPositions = {};
            document.querySelectorAll('.draggable-box').forEach(box => {
                box.style.transform = 'none';
                delete box.dataset.dragX;
                delete box.dataset.dragY;
            });
            setTimeout(() => clampAllWindowPositions(), 50);
            saveProfileToServerSilent();
            showToast("✨ Box layout reset & aligned!");
        }

        function toggleMinimizeBox(btn) {
            const box = btn.closest('.draggable-box');
            if (!box) return;
            box.classList.toggle('is-minimized');
            const isMin = box.classList.contains('is-minimized');
            btn.innerHTML = isMin ? '&#43;' : '&ndash;';
            btn.title = isMin ? 'Maximize window' : 'Minimize window';

            // Save minimize state to currentProfile
            const dragId = box.dataset.dragId || box.id;
            if (dragId && currentProfile) {
                if (!currentProfile.minimizedBoxes) currentProfile.minimizedBoxes = {};
                currentProfile.minimizedBoxes[dragId] = isMin;
                saveProfileToServerSilent();
            }
        }

        function getBriefCardLabel(id, text) {
            if (id === 'hud-controls-card') return '🕹️ CONTROLS';
            if (id === 'hud-shield-card') return '🛡️ SHIELD & THROTTLE';
            if (id === 'hud-radar-card') return '📡 RADAR';
            if (id === 'hud-top-target-card') return '🎯 TARGET DAMAGE';
            if (id === 'hud-target-card') return '🎯 TARGET LOCK';
            if (id === 'hud-action-bar-card') return '🚀 ACTIONS';

            if (!text) return 'WINDOW';
            const clean = text.replace(/[\n\r]+/g, ' ').trim();
            const firstWords = clean.split(' ').slice(0, 2).join(' ');
            return firstWords.length > 14 ? firstWords.substring(0, 14) + '..' : firstWords;
        }

        function clampAllWindowPositions() {
            const headerBoundary = 68; // Bottom border of fixed top menu bar
            let didCorrection = false;
            document.querySelectorAll('.draggable-box').forEach(box => {
                const rect = box.getBoundingClientRect();
                let currentY = parseFloat(box.dataset.dragY) || 0;
                const initialTop = rect.top - currentY;
                const minAllowedY = headerBoundary - initialTop;

                if (currentY < minAllowedY) {
                    currentY = minAllowedY;
                    box.dataset.dragY = currentY;
                    const currentX = parseFloat(box.dataset.dragX) || 0;
                    box.style.transform = `translate(${currentX}px, ${currentY}px)`;

                    const dragId = box.dataset.dragId || box.id;
                    if (dragId && currentProfile) {
                        if (!currentProfile.boxPositions) currentProfile.boxPositions = {};
                        currentProfile.boxPositions[dragId] = { x: Math.round(currentX), y: Math.round(currentY) };
                        didCorrection = true;
                    }
                }
            });
            if (didCorrection) {
                saveProfileToServerSilent();
            }
        }

        function initDraggableBoxes() {
            const selector = '.hud-card, .card, .ship-card, .act-node';
            const boxes = document.querySelectorAll(selector);

            boxes.forEach((box, index) => {
                if (!box.dataset.dragId) {
                    const heading = box.querySelector('.hud-title, .title-name, .act-title, h3')?.innerText || '';
                    const cleanTitle = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    box.dataset.dragId = box.id || (cleanTitle ? `drag-${cleanTitle}` : `box-${index}`);
                }
                const dragId = box.dataset.dragId;

                box.classList.add('draggable-box');

                // Insert drag handle bar, title label & minimize button if missing
                if (!box.querySelector('.drag-handle')) {
                    const headingText = box.querySelector('.hud-title, .title-name, .act-title, h1, h2, h3')?.innerText || '';
                    const briefLabel = getBriefCardLabel(box.id || dragId, headingText);

                    const handle = document.createElement('div');
                    handle.className = 'drag-handle';
                    handle.title = 'Drag to reposition window';
                    handle.innerHTML = `
                        <span class="drag-handle-label">${briefLabel}</span>
                        <div class="drag-handle-bar"></div>
                        <button class="btn-minimize" title="Minimize window" onclick="event.stopPropagation(); toggleMinimizeBox(this)">&ndash;</button>
                    `;
                    box.insertBefore(handle, box.firstChild);
                }

                // Restore saved position & minimize state for current profile
                if (currentProfile) {
                    if (currentProfile.boxPositions && currentProfile.boxPositions[dragId]) {
                        const { x, y } = currentProfile.boxPositions[dragId];
                        box.dataset.dragX = x;
                        box.dataset.dragY = y;
                        box.style.transform = `translate(${x}px, ${y}px)`;
                    } else {
                        box.style.transform = 'none';
                        delete box.dataset.dragX;
                        delete box.dataset.dragY;
                    }

                    if (currentProfile.minimizedBoxes && currentProfile.minimizedBoxes[dragId]) {
                        box.classList.add('is-minimized');
                        const minBtn = box.querySelector('.btn-minimize');
                        if (minBtn) {
                            minBtn.innerHTML = '&#43;';
                            minBtn.title = 'Maximize window';
                        }
                    }
                }

                setupDragEvents(box, dragId);
            });

            // Auto-clamp any window that is currently above top menu bar boundary
            setTimeout(() => clampAllWindowPositions(), 60);
        }

        function setupDragEvents(element, dragId) {
            if (element.dataset.dragInitialized) return;
            element.dataset.dragInitialized = "true";

            let isDragging = false;
            let startX = 0, startY = 0;
            let currentX = parseFloat(element.dataset.dragX) || 0;
            let currentY = parseFloat(element.dataset.dragY) || 0;
            let initialTop = 0;
            let initialLeft = 0;
            const headerBoundary = 68; // Bottom border of fixed top menu bar (64px height + 4px margin)

            const dragStart = (e) => {
                if (e.target.closest('button, input, select, a, kbd, .btn-vote, .sim-btn, .btn-minimize')) return;

                isDragging = true;
                element.classList.add('is-dragging');

                currentX = parseFloat(element.dataset.dragX) || 0;
                currentY = parseFloat(element.dataset.dragY) || 0;

                const rect = element.getBoundingClientRect();
                initialTop = rect.top - currentY;
                initialLeft = rect.left - currentX;

                const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
                const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

                startX = clientX - currentX;
                startY = clientY - currentY;

                const onMove = (moveEv) => {
                    if (!isDragging) return;
                    if (moveEv.cancelable) moveEv.preventDefault();

                    const moveX = moveEv.type.startsWith('touch') ? moveEv.touches[0].clientX : moveEv.clientX;
                    const moveY = moveEv.type.startsWith('touch') ? moveEv.touches[0].clientY : moveEv.clientY;

                    currentX = moveX - startX;
                    currentY = moveY - startY;

                    // Enforce top menu bar boundary restriction: top edge stops at header border (68px)
                    const minAllowedY = headerBoundary - initialTop;
                    if (currentY < minAllowedY) {
                        currentY = minAllowedY;
                    }

                    // Enforce left and right screen boundaries
                    const minAllowedX = -initialLeft;
                    const maxAllowedX = window.innerWidth - initialLeft - rect.width;
                    if (currentX < minAllowedX) {
                        currentX = minAllowedX;
                    } else if (currentX > maxAllowedX) {
                        currentX = maxAllowedX;
                    }

                    element.dataset.dragX = currentX;
                    element.dataset.dragY = currentY;
                    element.style.transform = `translate(${currentX}px, ${currentY}px)`;
                };

                const onEnd = () => {
                    if (!isDragging) return;
                    isDragging = false;
                    element.classList.remove('is-dragging');

                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onEnd);
                    window.removeEventListener('touchmove', onMove);
                    window.removeEventListener('touchend', onEnd);

                    if (!currentProfile.boxPositions) currentProfile.boxPositions = {};
                    currentProfile.boxPositions[dragId] = { x: Math.round(currentX), y: Math.round(currentY) };
                    
                    // Silent save to server without notice
                    saveProfileToServerSilent();
                };

                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onEnd);
                window.addEventListener('touchmove', onMove, { passive: false });
                window.addEventListener('touchend', onEnd);
            };

            const handle = element.querySelector('.drag-handle') || element;
            handle.addEventListener('mousedown', dragStart);
            handle.addEventListener('touchstart', dragStart, { passive: true });
        }

        function renderTitles() {
            const container = document.getElementById('titles-container');
            container.innerHTML = gameTitles.map((t, idx) => `
                <div class="card" data-drag-id="title-card-${idx}">
                    <div class="card-header">
                        <div class="title-name">${t.title}</div>
                        <span class="badge ${t.badgeClass}">${t.badge}</span>
                    </div>
                    <p class="card-desc">${t.desc}</p>
                    <div class="vote-row">
                        <div class="like-count">⭐ <span id="likes-${idx}">${t.likes}</span> Votes</div>
                        <button class="btn-vote" onclick="voteTitle(${idx})">Vote Title</button>
                    </div>
                </div>
            `).join('');

            initDraggableBoxes();
        }

        function voteTitle(idx) {
            gameTitles[idx].likes++;
            document.getElementById(`likes-${idx}`).innerText = gameTitles[idx].likes;
            showToast(`Voted for "${gameTitles[idx].title}"!`);
        }

        function switchTab(tabId) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
            
            event.currentTarget.classList.add('active');
            document.getElementById(`${tabId}-section`).classList.add('active');

            if (tabId === 'sim') {
                onWindowResize();
            }
        }

        function showToast(msg) {
            const toast = document.getElementById('toast');
            toast.innerText = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }

        // --- 3D THREE.JS SPACE FLIGHT SIMULATOR (MOUSE TARGETING & SPEED) ---
        let scene, camera, renderer;
        let playerShip;
        let playerShieldBubble, capitalShip, wormholeGate, starfield, spacePlanet, spaceSun, targetBox3D;
        let dreadOrbitAngle = 0.5; // Orbit angle around spacePlanet
        let enemyShips = [];
        let laserProjectiles = [];
        let enemyLaserProjectiles = [];
        let targetSpeed = 0;
        let currentSpeed = 0;
        let isWormholeActive = false;

        let cameraMode = 0; // 0: Cockpit View with Canopy Frame Bars, 1: Close, 2: Far, 3: Cinematic Showcase (Invincible)
        let isShipInvincible = false;
        let cinematicAngle = 0;

        let isGamePaused = false;
        let playerCredits = 125000;
        const maxSpeedCap = 400;
        let upgradeHangarScene, upgradeHangarCamera, upgradeHangarRenderer, upgradeHangarShip, hangarShieldMesh;
        let isHangarDragging = false;
        let previousHangarMousePosition = { x: 0, y: 0 };
        let hangarTargetRotationY = 0;
        let hangarTargetRotationX = 0;
        let hangarCamTargetPos = new THREE.Vector3(0, 1.8, 11);
        let hangarCamLookAtPos = new THREE.Vector3(0, 0, 0);

        const shipUpgrades = {
            blasters: { level: 3, maxLevel: 5, cost: 15000, name: 'Quantum Plasma Blasters' },
            shields:  { level: 4, maxLevel: 5, cost: 22000, name: 'Deflector Shield Generator' },
            thrusters: { level: 3, maxLevel: 5, cost: 18000, name: 'Ion Thruster Nacelles' },
            sensors:  { level: 4, maxLevel: 5, cost: 12000, name: 'Tactical Sensor Array' }
        };

        function toggleCameraMode() {
            cameraMode = (cameraMode + 1) % 4;
            isShipInvincible = (cameraMode === 3);

            const modeLabels = [
                "COCKPIT VIEW (FIRST-PERSON)",
                "THIRD-PERSON CLOSE",
                "THIRD-PERSON FAR",
                "CINEMATIC SHOWCASE [INVINCIBLE]"
            ];

            showToast(`🎥 ${modeLabels[cameraMode]}`);

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
        let activeRebindAction = null;

        let isFlightLocked = false;

        function init3DSimulator() {
            const container = document.getElementById('canvas-container');
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x070913, 0.00003); // 16x lighter fog for crystal clear space visibility!

            camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 2000000);
            camera.position.set(0, 3, 12);

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
            createPlayerShip();
            createCapitalShip();
            createWormholeGate();
            spawnEnemySwarm();
            initLaserPool();
            // Create 3D Wireframe Target Lock Box
            const targetBoxGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(20, 20, 20));
            const targetBoxMat = new THREE.LineBasicMaterial({ color: 0xff3333, linewidth: 2 });
            targetBox3D = new THREE.LineSegments(targetBoxGeo, targetBoxMat);
            targetBox3D.visible = false;
            scene.add(targetBox3D);

            initTacticalMap3D();

            // Event Listeners for Mouse Targeting & Key Controls
            window.addEventListener('resize', onWindowResize);
            
            container.addEventListener('mousemove', (e) => {
                if (!isFlightLocked && !isTacticalMapOpen) {
                    normalizedMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
                    normalizedMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
                }

                const crosshair = document.querySelector('.hud-center-crosshair');
                if (crosshair) {
                    crosshair.style.left = e.clientX + 'px';
                    crosshair.style.top = e.clientY + 'px';
                }
            });

            // Left Click (0) AND Right Click (2) both fire plasma blasters!
            container.addEventListener('mousedown', (e) => {
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
                        showToast("🔒 PILOT FLIGHT LOCK ENGAGED! Ship flying straight — Free mouse to drag windows!");
                    } else {
                        showToast("🔓 PILOT FLIGHT UNLOCKED! Mouse flight steering active");
                    }
                }
            });
            window.addEventListener('keyup', (e) => {
                let action = Object.keys(keyBindings).find(k => keyBindings[k] === e.code) || e.code;
                if (keys.hasOwnProperty(action)) keys[action] = false;
                if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
            });



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

        function createPlanetSurfaceTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 1024; canvas.height = 512;
            const ctx = canvas.getContext('2d');

            // Deep sapphire oceanic background
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(0, 0, 1024, 512);

            // Swirling continent landmasses
            ctx.fillStyle = '#0f172a';
            for (let i = 0; i < 40; i++) {
                const x = Math.random() * 1024;
                const y = Math.random() * 512;
                const rx = 60 + Math.random() * 160;
                const ry = 40 + Math.random() * 100;
                ctx.beginPath();
                ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
                ctx.fill();
            }

            // Cyan atmospheric cloud bands
            ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
            for (let i = 0; i < 30; i++) {
                const y = Math.random() * 512;
                ctx.fillRect(0, y, 1024, 15 + Math.random() * 35);
            }

            // White cyclone cloud swirls
            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            for (let i = 0; i < 25; i++) {
                const x = Math.random() * 1024;
                const y = Math.random() * 512;
                ctx.beginPath();
                ctx.arc(x, y, 20 + Math.random() * 45, 0, Math.PI * 2);
                ctx.fill();
            }

            const texture = new THREE.CanvasTexture(canvas);
            return texture;
        }

        function createSpacePlanet() {
            // High-Resolution Procedural Surface Map (Guaranteed Fallback)
            const fallbackTex = createPlanetSurfaceTexture();

            const planetGeo = new THREE.SphereGeometry(9000, 128, 128); // Doubled radius to 9,000 units (18,000 unit diameter!)
            const planetMat = new THREE.MeshStandardMaterial({ 
                map: fallbackTex,
                roughness: 0.90, 
                metalness: 0.05,
                emissive: 0x0284c7,
                emissiveIntensity: 0.20 // Radiant self-illuminating glow!
            });

            // Async load high-res AI planet texture map with fallback
            new THREE.TextureLoader().load(
                'docs/images/space_planet_surface_blue_gas.jpg',
                (tex) => {
                    tex.wrapS = THREE.RepeatWrapping;
                    tex.wrapT = THREE.RepeatWrapping;
                    tex.repeat.set(3, 3);
                    planetMat.map = tex;
                    planetMat.needsUpdate = true;
                }
            );
            
            spacePlanet = new THREE.Mesh(planetGeo, planetMat);
            // Position colossal 18,000-unit planet far off on horizon (~14,000 units away)
            spacePlanet.position.set(-8500, -3200, -14000);
            scene.add(spacePlanet);

            // Glowing Cyan Atmospheric Horizon Rim Halo (9,160 radius)
            const atmoGeo = new THREE.SphereGeometry(9160, 64, 64);
            const atmoMat = new THREE.MeshBasicMaterial({
                color: 0x00f0ff,
                transparent: true,
                opacity: 0.35,
                side: THREE.BackSide
            });
            const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
            spacePlanet.add(atmosphere);

            // Gigantic Planetary Ring System - Converted to 3D particle asteroids
            const particleCount = 20000;
            // Using a tetrahedron as a low-poly asteroid shape
            const particleGeo = new THREE.TetrahedronGeometry(1, 1);
            const particleMat = new THREE.MeshStandardMaterial({ 
                color: 0xffffff, // Base color white to let instance colors shine
                roughness: 0.8,
                metalness: 0.2
            });
            const ring = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
            
            const dummy = new THREE.Object3D();
            
            // Widen the ring significantly
            const innerRadius = 11675; // Increased to center the narrower ring
            const outerRadius = 16025; // Adjusted to center the 50% narrower ring width
            const ringThickness = 500; // Vertical ring particle thickness set to 500
            
            // Planet-like color palette
            const colors = [
                new THREE.Color(0x0284c7), // dark blue
                new THREE.Color(0x00f0ff), // bright cyan
                new THREE.Color(0x0ea5e9), // sky blue
                new THREE.Color(0x38bdf8), // light blue
                new THREE.Color(0x94a3b8), // greyish
                new THREE.Color(0x072540)  // deep navy
            ];
            
            for (let i = 0; i < particleCount; i++) {
                // Random radius between inner and outer
                const r = innerRadius + Math.random() * (outerRadius - innerRadius);
                const theta = Math.random() * Math.PI * 2;
                
                // Ring particles in XY plane to match the original RingGeometry axis
                // Using Math.random() - 0.5 gives a spread from -thickness/2 to +thickness/2
                const x = r * Math.cos(theta);
                const y = r * Math.sin(theta);
                const z = (Math.random() - 0.5) * (Math.random() * ringThickness);
                
                dummy.position.set(x, y, z);
                
                // Ranging from very tiny (0.5) to medium (18.25)
                const scale = Math.random() * 17.75 + 0.5;
                dummy.scale.set(scale, scale, scale);
                
                // Random rotation
                dummy.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                dummy.updateMatrix();
                ring.setMatrixAt(i, dummy.matrix);
                
                // Apply color variation
                const color = colors[Math.floor(Math.random() * colors.length)];
                ring.setColorAt(i, color);
            }
            
            ring.rotation.x = Math.PI / 2.3;
            ring.rotation.y = -Math.PI / 8;
            spacePlanet.add(ring);
        }

        // --- PROCEDURAL VOID INTERCEPTOR HULL TEXTURE GENERATORS ---
        function createVoidHullTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, 512, 512);

            // Metallic carbon weave pattern
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 512; i += 8) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
            }

            // Alloy armor seams
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 3;
            ctx.strokeRect(16, 16, 480, 480);
            ctx.strokeRect(48, 48, 416, 416);

            // Luminescent Cyan Circuit Trimming
            ctx.strokeStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(48, 256); ctx.lineTo(160, 256); ctx.lineTo(256, 160); ctx.lineTo(256, 48);
            ctx.moveTo(464, 256); ctx.lineTo(352, 256); ctx.lineTo(256, 352); ctx.lineTo(256, 464);
            ctx.stroke();
            ctx.shadowBlur = 0;

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        }

        function createVoidBumpMap() {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#808080';
            ctx.fillRect(0, 0, 512, 512);

            ctx.fillStyle = '#b0b0b0'; // Raised armor plates
            ctx.fillRect(48, 48, 416, 416);

            ctx.strokeStyle = '#000000'; // Recessed armor seams
            ctx.lineWidth = 5;
            ctx.strokeRect(16, 16, 480, 480);
            ctx.strokeRect(48, 48, 416, 416);

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        }

        // --- PROCEDURAL IMPERIAL GOLD TEXTURE & BUMP MAP GENERATORS ---
        function createGoldHullTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d');

            // Rich Metallic Gold Gradient
            const grad = ctx.createLinearGradient(0, 0, 512, 512);
            grad.addColorStop(0, '#f59e0b');
            grad.addColorStop(0.3, '#fbbf24');
            grad.addColorStop(0.7, '#d97706');
            grad.addColorStop(1, '#b45309');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 512, 512);

            // Fine brushed metallic micro-grain
            ctx.strokeStyle = 'rgba(255, 245, 204, 0.18)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 512; i += 4) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i + 128, 512);
                ctx.stroke();
            }

            // Engraved Tech Grid & Gold Trim Seams
            ctx.strokeStyle = 'rgba(180, 83, 9, 0.45)';
            ctx.lineWidth = 3;
            ctx.strokeRect(20, 20, 472, 472);
            ctx.strokeRect(50, 50, 412, 412);

            ctx.beginPath();
            for (let x = 60; x < 460; x += 80) {
                ctx.moveTo(x, 20); ctx.lineTo(x, 492);
                ctx.moveTo(20, x); ctx.lineTo(492, x);
            }
            ctx.stroke();

            // Luminous Gold Energy Circuit Trimming
            ctx.strokeStyle = '#fef08a';
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 8;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(50, 256); ctx.lineTo(150, 150); ctx.lineTo(362, 150); ctx.lineTo(462, 256);
            ctx.moveTo(50, 256); ctx.lineTo(150, 362); ctx.lineTo(362, 362); ctx.lineTo(462, 256);
            ctx.stroke();
            ctx.shadowBlur = 0;

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        }

        function createGoldBumpMap() {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#808080';
            ctx.fillRect(0, 0, 512, 512);

            ctx.fillStyle = '#cfcfcf'; // Raised gold filigree plates
            ctx.fillRect(50, 50, 412, 412);

            ctx.strokeStyle = '#101010'; // Recessed bevel channels
            ctx.lineWidth = 6;
            ctx.strokeRect(20, 20, 472, 472);
            ctx.strokeRect(50, 50, 412, 412);

            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let x = 60; x < 460; x += 80) {
                ctx.moveTo(x, 20); ctx.lineTo(x, 492);
                ctx.moveTo(20, x); ctx.lineTo(492, x);
            }
            ctx.stroke();

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        }

        function createPlayerShip() {
            playerShip = new THREE.Group();

            const hullMap = createVoidHullTexture();
            const bumpMap = createVoidBumpMap();

            const goldMap = createGoldHullTexture();
            const goldBump = createGoldBumpMap();

            // High-Detail Metallic Materials (Brightened for crisp 3D detail visibility)
            const darkArmorMat = new THREE.MeshStandardMaterial({ 
                color: 0x1e293b, 
                metalness: 0.88, 
                roughness: 0.25, 
                map: hullMap, 
                bumpMap: bumpMap, 
                bumpScale: 0.08 
            });
            const silverPlateMat = new THREE.MeshStandardMaterial({ 
                color: 0x64748b, 
                metalness: 0.85, 
                roughness: 0.30, 
                map: hullMap, 
                bumpMap: bumpMap, 
                bumpScale: 0.05 
            });
            const goldTrimMat = new THREE.MeshStandardMaterial({ 
                color: 0xf59e0b, 
                metalness: 0.96, 
                roughness: 0.18,
                map: goldMap,
                bumpMap: goldBump,
                bumpScale: 0.05,
                emissive: 0x3b1a03,
                emissiveIntensity: 0.4
            });
            const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
            const canopyGlassMat = new THREE.MeshPhysicalMaterial({ 
                color: 0x00f0ff, 
                roughness: 0.08, 
                metalness: 0.90, 
                transmission: 0.85, 
                opacity: 0.88, 
                transparent: true,
                clearcoat: 1.0 
            });

            // 1. Extended Sleek Forward Stealth Nose Cone & Sensor Probe
            // Nose extended and made blunter (less pointed) by using a cylinder instead of a cone
            const noseGeo = new THREE.CylinderGeometry(0.15, 0.85, 6.8, 4);
            noseGeo.rotateX(-Math.PI / 2); // Rotates blunt tip FORWARD towards -Z!
            noseGeo.rotateZ(Math.PI / 4);  // Diamond stealth cross section
            const nose = new THREE.Mesh(noseGeo, darkArmorMat);
            nose.position.set(0, -0.05, -2.8);
            playerShip.add(nose);

            // Upper Tapered Armor Cowl (Stealth Chine Nose Plate)
            const upperNoseGeo = new THREE.CylinderGeometry(0.08, 0.6, 4.4, 4);
            upperNoseGeo.rotateX(-Math.PI / 2); // Tip facing forward
            upperNoseGeo.rotateZ(Math.PI / 4);
            const upperNose = new THREE.Mesh(upperNoseGeo, silverPlateMat);
            upperNose.position.set(0, 0.12, -2.8);
            playerShip.add(upperNose);

            // Detailed Tiered Gold Nose Ridge Trim Line
            const noseGoldGeo = new THREE.BoxGeometry(0.10, 0.14, 3.2);
            const noseGold = new THREE.Mesh(noseGoldGeo, goldTrimMat);
            noseGold.position.set(0, 0.28, -2.8);
            playerShip.add(noseGold);

            const noseGoldRidge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 3.0), goldTrimMat);
            noseGoldRidge.position.set(0, 0.30, -2.8);
            playerShip.add(noseGoldRidge);

            // Forward Luminescent Sensor Needle Probe (Shortened)
            const probeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
            probeGeo.rotateX(Math.PI / 2);
            const probe = new THREE.Mesh(probeGeo, cyanGlowMat);
            probe.position.set(0, -0.05, -6.5);
            playerShip.add(probe);

            // Ventral Air Scoop Intake with Gold Accent Bezel
            const scoopGeo = new THREE.BoxGeometry(0.8, 0.3, 1.8);
            const scoop = new THREE.Mesh(scoopGeo, darkArmorMat);
            scoop.position.set(0, -0.4, -0.6);
            playerShip.add(scoop);

            const scoopGold = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.08, 1.84), goldTrimMat);
            scoopGold.position.set(0, -0.4, -0.6);
            playerShip.add(scoopGold);

            // Main Cockpit Body Hull
            const mainHullGeo = new THREE.BoxGeometry(1.4, 0.9, 3.8);
            const mainHull = new THREE.Mesh(mainHullGeo, darkArmorMat);
            mainHull.position.set(0, -0.1, 0.5);
            playerShip.add(mainHull);

            // Armor Spine Ridge with Gold Accent Trim (Shortened & pulled back behind canopy)
            const spineGeo = new THREE.BoxGeometry(0.55, 0.35, 1.8);
            const spine = new THREE.Mesh(spineGeo, silverPlateMat);
            spine.position.set(0, 0.45, 1.3);
            playerShip.add(spine);

            const spineGold = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 1.7), goldTrimMat);
            spineGold.position.set(0, 0.46, 1.35);
            playerShip.add(spineGold);

            // 2. Cockpit Glass Canopy & Internal Pilot Yoke Seat
            const canopyGeo = new THREE.SphereGeometry(0.55, 16, 16);
            canopyGeo.scale(0.85, 0.6, 1.8);
            const canopy = new THREE.Mesh(canopyGeo, canopyGlassMat);
            canopy.position.set(0, 0.4, -0.6);
            playerShip.add(canopy);

            // Interior Flight Seat
            const seatGeo = new THREE.BoxGeometry(0.4, 0.5, 0.4);
            const seatMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.8 });
            const seat = new THREE.Mesh(seatGeo, seatMat);
            seat.position.set(0, 0.2, -0.4);
            playerShip.add(seat);

            // 3. Swept-Forward Main Wings (Left & Right Batteries)
            const createSweptWing = (isLeft) => {
                const wingGroup = new THREE.Group();

                // Main Swept Wing Blade
                const wingShape = new THREE.Shape();
                wingShape.moveTo(0, 0);
                wingShape.lineTo(3.2, -1.4);  // Sweep out
                wingShape.lineTo(2.7, -3.0);  // Forward tip
                wingShape.lineTo(0, -2.0);    // Attach back to body
                wingShape.closePath();

                const extrudeSettings = { depth: 0.12, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
                const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
                wingGeo.rotateX(Math.PI / 2);
                
                const wing = new THREE.Mesh(wingGeo, silverPlateMat);
                wingGroup.add(wing);

                // Wing Armor Plate Panel
                const plateGeo = new THREE.BoxGeometry(2.0, 0.08, 1.4);
                const plate = new THREE.Mesh(plateGeo, darkArmorMat);
                plate.position.set(1.6, 0, -1.2);
                wingGroup.add(plate);

                // Gold Wing Leading Edge Chevron Inlay
                const wingGoldGeo = new THREE.BoxGeometry(2.2, 0.06, 0.22);
                const wingGold = new THREE.Mesh(wingGoldGeo, goldTrimMat);
                wingGold.position.set(1.5, 0.05, -1.7);
                wingGold.rotation.y = -0.38;
                wingGroup.add(wingGold);

                // Gold Winglet Endcap Fin
                const endcapGeo = new THREE.BoxGeometry(0.12, 0.6, 1.2);
                const endcap = new THREE.Mesh(endcapGeo, goldTrimMat);
                endcap.position.set(2.8, 0, -2.2);
                wingGroup.add(endcap);

                // Dual Plasma Cannon Battery Pod Assembly (2 barrels per wing!)
                for (let b = -0.15; b <= 0.15; b += 0.3) {
                    const cannonBaseGeo = new THREE.CylinderGeometry(0.10, 0.12, 1.8, 12);
                    cannonBaseGeo.rotateX(Math.PI / 2);
                    const cannonBase = new THREE.Mesh(cannonBaseGeo, darkArmorMat);
                    cannonBase.position.set(2.7 + b, -0.1, -1.6);
                    wingGroup.add(cannonBase);

                    // Gold Cannon Housing Bezel Ring
                    const cannonGoldGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 12);
                    cannonGoldGeo.rotateX(Math.PI / 2);
                    const cannonGold = new THREE.Mesh(cannonGoldGeo, goldTrimMat);
                    cannonGold.position.set(2.7 + b, -0.1, -1.0);
                    wingGroup.add(cannonGold);

                    const barrelGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.4, 12);
                    barrelGeo.rotateX(Math.PI / 2);
                    const barrel = new THREE.Mesh(barrelGeo, cyanGlowMat);
                    barrel.position.set(2.7 + b, -0.1, -2.6);
                    wingGroup.add(barrel);
                }

                // Underwing Torpedo Missile Hardpoints
                const missileGeo = new THREE.ConeGeometry(0.14, 1.2, 8);
                missileGeo.rotateX(Math.PI / 2);
                const missile = new THREE.Mesh(missileGeo, darkArmorMat);
                missile.position.set(1.6, -0.25, -1.2);
                wingGroup.add(missile);

                if (isLeft) wingGroup.scale.set(-1, 1, 1);
                return wingGroup;
            };

            playerShip.add(createSweptWing(false)); // Right Wing
            playerShip.add(createSweptWing(true));  // Left Wing

            // 4. Forward Canard Stabilizer Winglets with Gold Edge Trim
            const canardGeo = new THREE.BoxGeometry(1.4, 0.06, 0.6);
            const canardR = new THREE.Mesh(canardGeo, silverPlateMat);
            canardR.position.set(1.0, 0.1, -2.0);
            canardR.rotation.y = -0.3;
            playerShip.add(canardR);

            const canardGoldR = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.08, 0.10), goldTrimMat);
            canardGoldR.position.set(1.0, 0.11, -1.8);
            canardGoldR.rotation.y = -0.3;
            playerShip.add(canardGoldR);

            const canardL = new THREE.Mesh(canardGeo, silverPlateMat);
            canardL.position.set(-1.0, 0.1, -2.0);
            canardL.rotation.y = 0.3;
            playerShip.add(canardL);

            const canardGoldL = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.08, 0.10), goldTrimMat);
            canardGoldL.position.set(-1.0, 0.11, -1.8);
            canardGoldL.rotation.y = 0.3;
            playerShip.add(canardGoldL);

            // 5. Dorsal & Ventral Tail Stabilization Fins
            const finGeo = new THREE.BoxGeometry(0.08, 1.2, 1.6);

            const dorsalFin = new THREE.Mesh(finGeo, silverPlateMat);
            dorsalFin.position.set(0, 1.0, 1.2);
            dorsalFin.rotation.x = -0.3;
            playerShip.add(dorsalFin);

            const dorsalGold = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.12, 1.64), goldTrimMat);
            dorsalGold.position.set(0, 1.58, 1.2);
            dorsalGold.rotation.x = -0.3;
            playerShip.add(dorsalGold);

            const ventralFinL = new THREE.Mesh(finGeo, silverPlateMat);
            ventralFinL.position.set(-0.6, -0.6, 1.2);
            ventralFinL.rotation.z = -0.5;
            playerShip.add(ventralFinL);

            const ventralFinR = new THREE.Mesh(finGeo, silverPlateMat);
            ventralFinR.position.set(0.6, -0.6, 1.2);
            ventralFinR.rotation.z = 0.5;
            playerShip.add(ventralFinR);

            // 6. Sleeker Quad Engine Thrusters with Gold Ring Bezels
            playerShip.userData.engineLights = [];
            const enginePositions = [
                { x: -0.50, y: 0.05, z: 1.8, size: 0.32 },
                { x:  0.50, y: 0.05, z: 1.8, size: 0.32 },
                { x: -0.30, y: 0.55, z: 1.6, size: 0.20 },
                { x:  0.30, y: 0.55, z: 1.6, size: 0.20 }
            ];

            enginePositions.forEach(eng => {
                const nacelleGeo = new THREE.CylinderGeometry(eng.size, eng.size * 1.15, 1.0, 16);
                nacelleGeo.rotateX(Math.PI / 2);
                const nacelle = new THREE.Mesh(nacelleGeo, darkArmorMat);
                nacelle.position.set(eng.x, eng.y, eng.z);
                playerShip.add(nacelle);

                const nacelleGoldGeo = new THREE.CylinderGeometry(eng.size * 1.06, eng.size * 1.06, 0.14, 16);
                nacelleGoldGeo.rotateX(Math.PI / 2);
                const nacelleGold = new THREE.Mesh(nacelleGoldGeo, goldTrimMat);
                nacelleGold.position.set(eng.x, eng.y, eng.z - 0.2);
                playerShip.add(nacelleGold);

                const nozzleGeo = new THREE.CylinderGeometry(eng.size * 0.75, eng.size * 0.65, 0.25, 16);
                nozzleGeo.rotateX(Math.PI / 2);
                const nozzle = new THREE.Mesh(nozzleGeo, cyanGlowMat);
                nozzle.position.set(eng.x, eng.y, eng.z + 0.5);
                playerShip.add(nozzle);

                const engineLight = new THREE.PointLight(0x00f0ff, 2.8, 18);
                engineLight.position.set(eng.x, eng.y, eng.z + 0.7);
                playerShip.add(engineLight);
                playerShip.userData.engineLights.push(engineLight);
            });

            // Add visible energy shield bubble
            const shieldGeo = new THREE.SphereGeometry(7, 32, 32);
            const shieldMat = new THREE.MeshBasicMaterial({
                color: 0x00f0ff,
                transparent: true,
                opacity: 0.2,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });
            playerShieldBubble = new THREE.Mesh(shieldGeo, shieldMat);
            playerShieldBubble.visible = false;
            playerShieldBubble.userData.flashTimer = 0;
            playerShip.add(playerShieldBubble);

            playerShip.position.set(0, 0, 0);
            scene.add(playerShip);
        }

        function createCapitalShip() {
            capitalShip = new THREE.Group();
            capitalShip.userData = {
                crystalCore: null,
                crystalRings: [],
                crystalLight: null,
                radarDish: null,
                turrets: [],
                fighters: [],
                beacons: []
            };

            // Load AI-generated and procedural textures
            const textureLoader = new THREE.TextureLoader();

            const dreadHullTex = textureLoader.load('docs/images/dreadnought_hull_texture.jpg');
            dreadHullTex.wrapS = THREE.RepeatWrapping; dreadHullTex.wrapT = THREE.RepeatWrapping;
            dreadHullTex.repeat.set(16, 16);

            const dreadGreebleTex = textureLoader.load('docs/images/dreadnought_greeble_texture.jpg');
            dreadGreebleTex.wrapS = THREE.RepeatWrapping; dreadGreebleTex.wrapT = THREE.RepeatWrapping;
            dreadGreebleTex.repeat.set(8, 8);

            const dreadDarkMetalTex = textureLoader.load('docs/images/dreadnought_dark_metal_texture.jpg');
            dreadDarkMetalTex.wrapS = THREE.RepeatWrapping; dreadDarkMetalTex.wrapT = THREE.RepeatWrapping;
            dreadDarkMetalTex.repeat.set(16, 16);

            const dreadGoldTrimTex = textureLoader.load('docs/images/dreadnought_gold_trim_texture.jpg');
            dreadGoldTrimTex.wrapS = THREE.RepeatWrapping; dreadGoldTrimTex.wrapT = THREE.RepeatWrapping;
            dreadGoldTrimTex.repeat.set(6, 6);

            const dreadHangarFloorTex = textureLoader.load('docs/images/dreadnought_hangar_floor_texture.jpg');
            dreadHangarFloorTex.wrapS = THREE.RepeatWrapping; dreadHangarFloorTex.wrapT = THREE.RepeatWrapping;
            dreadHangarFloorTex.repeat.set(4, 12);

            const dreadCrystalTex = textureLoader.load('docs/images/dreadnought_crystal_texture.jpg');

            // Procedural grid emissive texture for windows
            function createWindowGridTexture(colorHex) {
                const cvs = document.createElement('canvas');
                cvs.width = 512; cvs.height = 128;
                const ctx = cvs.getContext('2d');
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, 512, 128);
                ctx.fillStyle = colorHex;
                for(let x=16; x<512; x+=32) {
                    for(let y=16; y<128; y+=32) {
                        ctx.fillRect(x, y, 16, 16);
                    }
                }
                const tex = new THREE.CanvasTexture(cvs);
                tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
                return tex;
            }
            const goldWindowTex = createWindowGridTexture('#fbbf24');
            const cyanWindowTex = createWindowGridTexture('#00f0ff');

            // Standard Materials
            const hullMat = new THREE.MeshStandardMaterial({
                map: dreadHullTex, color: 0x8090a5, roughness: 0.85, metalness: 0.35
            });

            const armorPlateMat = new THREE.MeshStandardMaterial({
                map: dreadHullTex, color: 0x475569, roughness: 0.80, metalness: 0.40
            });

            const greebleMat = new THREE.MeshStandardMaterial({
                map: dreadGreebleTex, color: 0x334155, roughness: 0.90, metalness: 0.30
            });

            const goldTrimMat = new THREE.MeshStandardMaterial({
                map: dreadGoldTrimTex, color: 0xffffff, roughness: 0.55, metalness: 0.65
            });

            const darkMetalMat = new THREE.MeshStandardMaterial({
                map: dreadDarkMetalTex, color: 0xffffff, roughness: 0.85, metalness: 0.40
            });

            const engineNozzleMat = new THREE.MeshStandardMaterial({
                map: dreadDarkMetalTex, color: 0x888888, roughness: 0.2, metalness: 0.95
            });

            const engineGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

            const windowGlowMat = new THREE.MeshBasicMaterial({
                map: goldWindowTex, color: 0xffffff
            });

            const cyanWindowGlowMat = new THREE.MeshBasicMaterial({
                map: cyanWindowTex, color: 0xffffff
            });

            const runwayMat = new THREE.MeshBasicMaterial({
                map: dreadHangarFloorTex, color: 0xaaaaaa
            });

            // --- ROUND 1: HYPER-DETAILED HULL CORE & SLOPED ARMOR PLATING ---
            // 1. Central Core Spine (Narrower, longer)
            const mainHullGeo = new THREE.BoxGeometry(60, 24, 305);
            const mainHull = new THREE.Mesh(mainHullGeo, hullMat);
            mainHull.position.set(0, 0, 0);
            capitalShip.add(mainHull);

            // 2. Port and Starboard Slanted Armor Cheeks (Stealth Geometry)
            [-1, 1].forEach(side => {
                const cheekGeo = new THREE.CylinderGeometry(18, 28, 220, 4);
                const cheek = new THREE.Mesh(cheekGeo, armorPlateMat);
                cheek.rotation.y = Math.PI / 4;
                cheek.rotation.x = Math.PI / 2;
                cheek.position.set(side * 40, 0, 10);
                cheek.scale.set(1.0, 1.0, 0.5); // Flattened width
                capitalShip.add(cheek);
                
                // Ribbing and Broadside Batteries along the broadside
                for(let i = 0; i < 8; i++) {
                    const zPos = -70 + i * 25;
                    
                    // Structural Rib
                    const ribGeo = new THREE.BoxGeometry(8, 22, 6);
                    const rib = new THREE.Mesh(ribGeo, darkMetalMat);
                    rib.position.set(side * 52, 2, zPos);
                    rib.rotation.z = side * -0.15;
                    capitalShip.add(rib);
                    
                    // Secondary Broadside Turret (Nestled between ribs)
                    if (i < 7) { // Don't place one after the last rib
                        const bTurretGroup = new THREE.Group();
                        bTurretGroup.position.set(side * 48, 4, zPos + 12.5);
                        bTurretGroup.rotation.z = side * -0.15; // Match armor slope
                        
                        // Housing
                        const bHousing = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 8), armorPlateMat);
                        bTurretGroup.add(bHousing);
                        
                        // Dual Barrels
                        [-2, 2].forEach(bx => {
                            const bBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 12, 8), darkMetalMat);
                            bBarrel.rotation.z = Math.PI / 2; // Point outwards
                            bBarrel.position.set(side * 6, 0, bx);
                            bTurretGroup.add(bBarrel);
                            
                            // Muzzle
                            const bMuzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2, 8), goldTrimMat);
                            bMuzzle.rotation.z = Math.PI / 2;
                            bMuzzle.position.set(side * 12, 0, bx);
                            bTurretGroup.add(bMuzzle);
                        });
                        
                        capitalShip.add(bTurretGroup);
                        
                        // Recessed Window Strip (Deck Lights)
                        const winStripGeo = new THREE.BoxGeometry(0.5, 1.5, 12);
                        const winStrip = new THREE.Mesh(winStripGeo, windowGlowMat);
                        winStrip.position.set(side * 50.5, 1, zPos + 12.5);
                        winStrip.rotation.z = side * -0.15;
                        capitalShip.add(winStrip);
                    }
                }
            });

            // 3. Upper Gun Deck (Tiered platforms)
            const upperDeckBaseGeo = new THREE.BoxGeometry(70, 8, 240);
            const upperDeckBase = new THREE.Mesh(upperDeckBaseGeo, darkMetalMat);
            upperDeckBase.position.set(0, 16, -5);
            capitalShip.add(upperDeckBase);

            const upperDeckTopGeo = new THREE.CylinderGeometry(28, 36, 210, 4);
            const upperDeckTop = new THREE.Mesh(upperDeckTopGeo, armorPlateMat);
            upperDeckTop.rotation.y = Math.PI / 4;
            upperDeckTop.rotation.x = Math.PI / 2;
            upperDeckTop.position.set(0, 20, -15);
            upperDeckTop.scale.set(1, 1, 0.2); // Flat wedge on top
            capitalShip.add(upperDeckTop);

            // Detailed Upper Deck Piping & Trenches
            for (let i = 0; i < 4; i++) {
                // Raised Access Hatches
                const hatch = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 8), darkMetalMat);
                hatch.position.set(15, 23, -50 + i * 40);
                capitalShip.add(hatch);
                
                const hatch2 = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 8), darkMetalMat);
                hatch2.position.set(-15, 23, -50 + i * 40);
                capitalShip.add(hatch2);
                
                // Long Coolant Tubes
                const tubeGeo = new THREE.CylinderGeometry(0.8, 0.8, 30, 8);
                const tube = new THREE.Mesh(tubeGeo, goldTrimMat);
                tube.rotation.x = Math.PI / 2;
                tube.position.set(10, 24, -30 + i * 40);
                capitalShip.add(tube);
                
                const tube2 = new THREE.Mesh(tubeGeo, goldTrimMat);
                tube2.rotation.x = Math.PI / 2;
                tube2.position.set(-10, 24, -30 + i * 40);
                capitalShip.add(tube2);
            }
            
            // Central Spine Cooling Trench
            const trenchCoverGeo = new THREE.BoxGeometry(8, 2, 160);
            const trenchCover = new THREE.Mesh(trenchCoverGeo, greebleMat);
            trenchCover.position.set(0, 24, -20);
            capitalShip.add(trenchCover);

            // 4. Ventral Keel (Faceted underbelly)
            const keelGeo = new THREE.CylinderGeometry(15, 30, 260, 4);
            const keel = new THREE.Mesh(keelGeo, darkMetalMat);
            keel.rotation.y = Math.PI / 4;
            keel.rotation.x = Math.PI / 2;
            keel.scale.set(1, 1, 0.4);
            keel.position.set(0, -18, 15);
            capitalShip.add(keel);
            
            const keelTrimGeo = new THREE.BoxGeometry(10, 10, 270);
            const keelTrim = new THREE.Mesh(keelTrimGeo, goldTrimMat);
            keelTrim.position.set(0, -28, 15);
            capitalShip.add(keelTrim);
            
            // Ventral Cargo Bays and Sensor Domes
            for(let i=0; i<5; i++) {
                const zPos = -80 + i * 40;
                
                // Hexagonal Cargo Pods attached to the bottom
                const podGeo = new THREE.CylinderGeometry(6, 6, 12, 6);
                const pod = new THREE.Mesh(podGeo, armorPlateMat);
                pod.rotation.z = Math.PI / 2;
                pod.position.set(0, -32, zPos);
                capitalShip.add(pod);
                
                // Sensor Dome on bottom
                const domeGeo = new THREE.SphereGeometry(3, 16, 16);
                const dome = new THREE.Mesh(domeGeo, cyanWindowGlowMat);
                dome.position.set(0, -35, zPos + 15);
                dome.scale.set(1, 0.5, 1);
                capitalShip.add(dome);
            }
            
            // --- ROUND 6: VENTRAL SPINAL RAILGUN & HEAT SINKS ---
            const ventralRailgun = new THREE.Group();
            ventralRailgun.position.set(0, -36, -50);
            
            // Railgun Main Barrel Housing
            const rgBarrel = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 120), darkMetalMat);
            ventralRailgun.add(rgBarrel);
            
            // Railgun Magnetic Accelerator Rings
            for(let j=0; j<8; j++) {
                const ringGeo = new THREE.BoxGeometry(8, 6, 4);
                const ring = new THREE.Mesh(ringGeo, goldTrimMat);
                ring.position.set(0, 0, -40 + j * 12);
                ventralRailgun.add(ring);
                
                // Inner Plasma Coils
                const coilGeo = new THREE.BoxGeometry(6.5, 4.5, 2);
                const coil = new THREE.Mesh(coilGeo, engineGlowMat);
                coil.position.set(0, 0, -40 + j * 12);
                ventralRailgun.add(coil);
            }
            
            capitalShip.add(ventralRailgun);
            
            // Ventral VTOL Hover Thrusters and Heat Radiators under the Cheeks
            [-1, 1].forEach(side => {
                for(let k=0; k<6; k++) {
                    const zPos = -60 + k * 30;
                    
                    // Downward Thruster Bell
                    const vThruster = new THREE.Mesh(new THREE.CylinderGeometry(4, 3, 6, 12), engineNozzleMat);
                    vThruster.position.set(side * 30, -10, zPos);
                    capitalShip.add(vThruster);
                    
                    const vGlow = new THREE.Mesh(new THREE.CircleGeometry(3.5, 12), engineGlowMat);
                    vGlow.rotation.x = Math.PI / 2; // Pointing down
                    vGlow.position.set(side * 30, -13.1, zPos);
                    capitalShip.add(vGlow);
                    
                    // Underbelly Heat Radiator Fins
                    const radiatorGroup = new THREE.Group();
                    radiatorGroup.position.set(side * 20, -10, zPos + 15);
                    for(let r=0; r<4; r++) {
                        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 8), darkMetalMat);
                        fin.position.set(side * (r * 1.5 - 2.25), 0, 0);
                        radiatorGroup.add(fin);
                    }
                    capitalShip.add(radiatorGroup);
                }
                
                // Ventral Interlocking Armor Plates
                const vArmor = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 200), armorPlateMat);
                vArmor.position.set(side * 18, -12, 10);
                vArmor.rotation.z = side * 0.15;
                capitalShip.add(vArmor);
            });

            // 5. Multi-faceted Ram Bow (Prow)
            const prowGroup = new THREE.Group();
            prowGroup.position.set(0, 4, -180);
            
            const prowCenterGeo = new THREE.CylinderGeometry(0, 48, 85, 4);
            const prowCenter = new THREE.Mesh(prowCenterGeo, armorPlateMat);
            prowCenter.rotation.y = Math.PI / 4;
            prowCenter.rotation.x = -Math.PI / 2;
            prowCenter.scale.set(1, 1, 0.6);
            prowGroup.add(prowCenter);
            
            [-1, 1].forEach(side => {
                // Secondary Side Prow
                const prowSideGeo = new THREE.CylinderGeometry(0, 20, 60, 4);
                const prowSide = new THREE.Mesh(prowSideGeo, darkMetalMat);
                prowSide.rotation.y = Math.PI / 4;
                prowSide.rotation.x = -Math.PI / 2;
                prowSide.position.set(side * 24, 0, 15);
                prowSide.scale.set(1, 1, 0.8);
                prowGroup.add(prowSide);
                
                // Heavy Armor Bracing Plate
                const brace = new THREE.Mesh(new THREE.BoxGeometry(4, 10, 40), goldTrimMat);
                brace.position.set(side * 18, 5, 5);
                brace.rotation.y = side * -0.2;
                prowGroup.add(brace);
                
                // Forward Torpedo Tubes
                const tubeGeo = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
                const torpedoTube = new THREE.Mesh(tubeGeo, darkMetalMat);
                torpedoTube.rotation.x = Math.PI / 2;
                torpedoTube.position.set(side * 10, -5, -20);
                prowGroup.add(torpedoTube);
                
                // Red Warning Light near torpedo tube
                const warningLight = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color: 0xff0000}));
                warningLight.position.set(side * 10, -3.5, -22);
                prowGroup.add(warningLight);
            });
            
            // Nose Cone Sensor Node
            const noseNode = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), cyanWindowGlowMat);
            noseNode.position.set(0, 0, -42);
            noseNode.scale.set(1, 0.5, 1.5);
            prowGroup.add(noseNode);

            const prowCrestGeo = new THREE.BoxGeometry(12, 18, 40);
            const prowCrest = new THREE.Mesh(prowCrestGeo, goldTrimMat);
            prowCrest.position.set(0, 8, 10);
            prowCrest.rotation.x = 0.1;
            prowGroup.add(prowCrest);

            capitalShip.add(prowGroup);

            // --- ROUND 2: MULTI-TIERED COMMAND SUPERSTRUCTURE & BRIDGE TOWER ---
            const bridgeTower = new THREE.Group();
            bridgeTower.position.set(0, 26, -55);

            // Tier 1: Superstructure Base (Stepped, with overhang)
            const bTier1Geo = new THREE.BoxGeometry(52, 18, 70);
            const bTier1 = new THREE.Mesh(bTier1Geo, hullMat);
            bTier1.position.set(0, 9, 0);
            bridgeTower.add(bTier1);
            
            // Tier 1 Overhang Deck Lip
            const bTier1Lip = new THREE.Mesh(new THREE.BoxGeometry(56, 2, 74), armorPlateMat);
            bTier1Lip.position.set(0, 18, 0);
            bridgeTower.add(bTier1Lip);

            // Tier 2: Mid Command Deck (Slanted forward)
            const bTier2Geo = new THREE.CylinderGeometry(20, 26, 50, 4);
            const bTier2 = new THREE.Mesh(bTier2Geo, armorPlateMat);
            bTier2.rotation.y = Math.PI / 4;
            bTier2.rotation.x = Math.PI / 2;
            bTier2.scale.set(1.1, 1.1, 0.4);
            bTier2.position.set(0, 27, -5);
            bridgeTower.add(bTier2);

            // Tier 3: Main Navigation Bridge (Viewport Strip)
            const bTier3Geo = new THREE.BoxGeometry(32, 12, 38);
            const bTier3 = new THREE.Mesh(bTier3Geo, hullMat);
            bTier3.position.set(0, 39, -10);
            bridgeTower.add(bTier3);
            
            // Tier 3 Roof / Overhang shadowing the viewports
            const bTier3Roof = new THREE.Mesh(new THREE.BoxGeometry(36, 2, 42), armorPlateMat);
            bTier3Roof.position.set(0, 45, -8);
            bridgeTower.add(bTier3Roof);

            // Main Bridge Panoramic Viewport Glass Strip (Recessed)
            const windowStripGeo = new THREE.BoxGeometry(30, 4.5, 20);
            const windowStrip = new THREE.Mesh(windowStripGeo, windowGlowMat);
            windowStrip.position.set(0, 41, -15);
            bridgeTower.add(windowStrip);

            // Tier 4: Admiral's Observation Spire (Hexagonal instead of square)
            const bTier4Geo = new THREE.CylinderGeometry(8, 12, 16, 6);
            const bTier4 = new THREE.Mesh(bTier4Geo, darkMetalMat);
            bTier4.position.set(0, 52, -12);
            bridgeTower.add(bTier4);

            // Top Skybridge Viewports
            const skyViewGeo = new THREE.CylinderGeometry(8.5, 12.5, 3, 6);
            const skyView = new THREE.Mesh(skyViewGeo, cyanWindowGlowMat);
            skyView.position.set(0, 50, -12);
            bridgeTower.add(skyView);
            
            // Sensor Arrays & Comm Masts attached to sides of Tier 3
            [-18, 18].forEach(sideX => {
                const arrayGeo = new THREE.BoxGeometry(6, 6, 10);
                const array = new THREE.Mesh(arrayGeo, greebleMat);
                array.position.set(sideX, 39, -5);
                bridgeTower.add(array);
            });

            // Shield Generator Domes (Port & Starboard Superstructure Wings)
            [-28, 28].forEach(sideX => {
                const wingGeo = new THREE.BoxGeometry(14, 4, 18);
                const wing = new THREE.Mesh(wingGeo, armorPlateMat);
                wing.position.set(sideX, 22, -5);
                bridgeTower.add(wing);

                const domeGeo = new THREE.IcosahedronGeometry(6.5, 2);
                const domeMat = new THREE.MeshStandardMaterial({
                    color: 0x00f0ff,
                    roughness: 0.2,
                    metalness: 0.9,
                    wireframe: false
                });
                const dome = new THREE.Mesh(domeGeo, domeMat);
                dome.position.set(sideX, 27, -5);
                bridgeTower.add(dome);

                const ringGeo = new THREE.TorusGeometry(7.2, 0.8, 8, 24);
                const ring = new THREE.Mesh(ringGeo, goldTrimMat);
                ring.rotation.x = Math.PI / 2;
                ring.position.set(sideX, 24, -5);
                bridgeTower.add(ring);
            });

            // Main Communications Mast & Sensor Spire
            const mainMast = new THREE.Group();
            mainMast.position.set(0, 60, -12); // Atop the Admiral's Spire
            
            // Central Spire Shaft
            const mastShaft = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 3, 40, 8), darkMetalMat);
            mastShaft.position.set(0, 20, 0);
            mainMast.add(mastShaft);
            
            // Secondary Sensor Dishes
            [-1, 1].forEach(side => {
                const dishGeo = new THREE.CylinderGeometry(4, 0.5, 2, 16);
                const dish = new THREE.Mesh(dishGeo, goldTrimMat);
                dish.rotation.x = Math.PI / 2;
                dish.rotation.z = side * Math.PI / 4;
                dish.position.set(side * 4, 15, 2);
                mainMast.add(dish);
            });
            
            // Comm Relays & Antennas
            for(let i=0; i<3; i++) {
                const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 15, 4), greebleMat);
                antenna.position.set(0, 35 + i * 5, 0);
                mainMast.add(antenna);
                
                const crossbar = new THREE.Mesh(new THREE.BoxGeometry(12 - i*2, 0.5, 0.5), darkMetalMat);
                crossbar.position.set(0, 25 + i * 5, 0);
                mainMast.add(crossbar);
            }
            bridgeTower.add(mainMast);

            // Point Defense Turrets (CIWS) scattered on bridge wings
            [-22, 22].forEach(sideX => {
                const pdwBase = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 3, 8), darkMetalMat);
                pdwBase.position.set(sideX, 19, 15);
                bridgeTower.add(pdwBase);
                
                const pdwGun = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 6), armorPlateMat);
                pdwGun.position.set(sideX, 22, 15);
                bridgeTower.add(pdwGun);
                
                const pdwBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 4), greebleMat);
                pdwBarrel.rotation.x = Math.PI / 2;
                pdwBarrel.position.set(sideX, 22, 11);
                bridgeTower.add(pdwBarrel);
            });

            capitalShip.add(bridgeTower);

            // --- ROUND 3: EXPOSED HEXAGONAL CRYSTAL REACTOR CORE BAY ---
            const crystalBay = new THREE.Group();
            crystalBay.position.set(48, 8, 15);

            // Recessed Hexagonal Housing Frame (Deeper, layered)
            const hexOuterGeo = new THREE.CylinderGeometry(20, 20, 4, 6);
            const hexOuter = new THREE.Mesh(hexOuterGeo, armorPlateMat);
            hexOuter.rotation.z = Math.PI / 2;
            crystalBay.add(hexOuter);

            const hexFrameGeo = new THREE.CylinderGeometry(18, 18, 10, 6);
            const hexFrame = new THREE.Mesh(hexFrameGeo, darkMetalMat);
            hexFrame.rotation.z = Math.PI / 2;
            crystalBay.add(hexFrame);

            // 4 Massive Diagonal Feed Pipes
            const pipeGeo = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
            [Math.PI/4, 3*Math.PI/4, 5*Math.PI/4, 7*Math.PI/4].forEach(angle => {
                const pipe = new THREE.Mesh(pipeGeo, greebleMat);
                pipe.position.set(0, Math.cos(angle) * 12, Math.sin(angle) * 12);
                pipe.rotation.x = angle;
                crystalBay.add(pipe);
            });

            // Heavy Gear-like Outer Retaining Ring
            const gearRingGeo = new THREE.TorusGeometry(15, 2.5, 16, 32);
            const gearRing = new THREE.Mesh(gearRingGeo, darkMetalMat);
            gearRing.rotation.y = Math.PI / 2;
            crystalBay.add(gearRing);

            // Radiator Fins (Double layered)
            for (let i = 0; i < 6; i++) {
                const finGroup = new THREE.Group();
                const angle = (i / 6) * Math.PI * 2;
                finGroup.position.set(0, Math.cos(angle) * 14, Math.sin(angle) * 14);
                finGroup.rotation.x = -angle;

                const finGeo1 = new THREE.BoxGeometry(2, 4, 12);
                const fin1 = new THREE.Mesh(finGeo1, goldTrimMat);
                finGroup.add(fin1);
                
                const finGeo2 = new THREE.BoxGeometry(1.5, 5, 8);
                const fin2 = new THREE.Mesh(finGeo2, cyanWindowGlowMat);
                fin2.position.set(0.5, 0, 0);
                finGroup.add(fin2);
                
                crystalBay.add(finGroup);
            }

            // 3D Faceted Crystal Core Mesh
            const crystalGeo = new THREE.OctahedronGeometry(9, 1);
            const crystalMat = new THREE.MeshBasicMaterial({
                map: dreadCrystalTex,
                color: 0x00f0ff,
                transparent: true,
                opacity: 0.92
            });
            const crystalCore = new THREE.Mesh(crystalGeo, crystalMat);
            crystalBay.add(crystalCore);
            capitalShip.userData.crystalCore = crystalCore;

            // Spinning Inner Containment Rings
            const ring1Geo = new THREE.TorusGeometry(12, 1.0, 12, 32);
            const ring1 = new THREE.Mesh(ring1Geo, goldTrimMat);
            ring1.rotation.y = Math.PI / 2;
            crystalBay.add(ring1);

            const ring2Geo = new THREE.TorusGeometry(10, 0.5, 8, 32);
            const ring2 = new THREE.Mesh(ring2Geo, cyanWindowGlowMat);
            ring2.rotation.x = Math.PI / 3;
            crystalBay.add(ring2);
            capitalShip.userData.crystalRings = [ring1, ring2];

            // Dynamic Blue Crystal Point Light
            const crystalLight = new THREE.PointLight(0x00f0ff, 5.0, 270);
            crystalLight.position.set(0, 0, 0);
            crystalBay.add(crystalLight);
            capitalShip.userData.crystalLight = crystalLight;

            capitalShip.add(crystalBay);

            // --- ROUND 4: ARMORED SIDE HANGAR BAY & DEPLOYED INTERCEPTORS ---
            const hangarBay = new THREE.Group();
            hangarBay.position.set(-48, -2, 35);

            // Recessed Hangar Opening Cutout
            const hangarCutoutGeo = new THREE.BoxGeometry(8, 18, 55);
            const hangarCutout = new THREE.Mesh(hangarCutoutGeo, darkMetalMat);
            hangarBay.add(hangarCutout);

            // Internal Lit Runway Deck
            const runwayGeo = new THREE.BoxGeometry(14, 1, 52);
            const runway = new THREE.Mesh(runwayGeo, runwayMat);
            runway.position.set(-2, -8, 0);
            hangarBay.add(runway);

            // Deployed Lower Blast Door Ramp
            const rampGeo = new THREE.BoxGeometry(16, 1.5, 48);
            const ramp = new THREE.Mesh(rampGeo, armorPlateMat);
            ramp.rotation.z = 0.25; // Angled outward and downward
            ramp.position.set(-10, -10, 0);
            hangarBay.add(ramp);

            // Runway Guide Lights Strip
            const guideLightsGeo = new THREE.BoxGeometry(0.8, 1.2, 50);
            const guideLights = new THREE.Mesh(guideLightsGeo, cyanWindowGlowMat);
            guideLights.position.set(-7, -7.5, 0);
            hangarBay.add(guideLights);
            
            // Overhead Crane Rails
            [-20, 0, 20].forEach(z => {
                const railGeo = new THREE.BoxGeometry(10, 1.5, 2);
                const rail = new THREE.Mesh(railGeo, greebleMat);
                rail.position.set(0, 8, z);
                hangarBay.add(rail);
            });

            // Yellow Caution Stripe Border Frame around Hangar Aperture
            const topBorder = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 55), goldTrimMat);
            topBorder.position.set(-4, 9, 0);
            hangarBay.add(topBorder);
            const botBorder = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 55), goldTrimMat);
            botBorder.position.set(-4, -9, 0);
            hangarBay.add(botBorder);

            // Support Pillars inside the hangar
            [-24, -12, 0, 12, 24].forEach(z => {
                const pillarGeo = new THREE.CylinderGeometry(0.8, 0.8, 18, 6);
                const pillar = new THREE.Mesh(pillarGeo, darkMetalMat);
                pillar.position.set(1, 0, z);
                hangarBay.add(pillar);
            });

            // 3 Mini Launching Interceptor Fighters
            for (let f = 0; f < 3; f++) {
                const fighterGroup = new THREE.Group();
                const fBodyGeo = new THREE.ConeGeometry(1.2, 4, 3);
                // Use dark metal texture for fighters instead of solid blue
                const fBody = new THREE.Mesh(fBodyGeo, darkMetalMat);
                fBody.rotation.x = Math.PI / 2;
                fighterGroup.add(fBody);

                const fWingGeo = new THREE.BoxGeometry(4.5, 0.3, 1.8);
                const fWing = new THREE.Mesh(fWingGeo, darkMetalMat);
                fighterGroup.add(fWing);

                fighterGroup.position.set(-12 - f * 14, -6 + f * 3, f * 12);
                fighterGroup.rotation.y = -Math.PI / 3;
                hangarBay.add(fighterGroup);
                capitalShip.userData.fighters.push(fighterGroup);
            }

            capitalShip.add(hangarBay);

            // --- ROUND 5: HEAVY TRIPLE-BARREL MAIN TURRETS & BROADSIDE BATTERIES ---
            const turretPositions = [
                { x: 0, y: 27.5, z: 80, scale: 1.0 },
                { x: 0, y: 27.5, z: 30, scale: 1.1 },
                { x: 0, y: 27.5, z: -105, scale: 1.0 },
                { x: 0, y: 27.5, z: -145, scale: 0.9 }
            ];

            turretPositions.forEach(pos => {
                const turret = new THREE.Group();
                turret.position.set(pos.x, pos.y, pos.z);
                turret.scale.set(pos.scale, pos.scale, pos.scale);

                // Detailed Barbette Base (tier 1 and tier 2 rings)
                const barbetteBaseGeo = new THREE.CylinderGeometry(13, 14, 2, 24);
                const barbetteBase = new THREE.Mesh(barbetteBaseGeo, darkMetalMat);
                barbetteBase.position.set(0, 1, 0);
                turret.add(barbetteBase);
                
                const barbetteRingGeo = new THREE.CylinderGeometry(11, 11, 2, 24);
                const barbetteRing = new THREE.Mesh(barbetteRingGeo, goldTrimMat);
                barbetteRing.position.set(0, 3, 0);
                turret.add(barbetteRing);

                // Armored Gun Housing (Faceted stealth block)
                const houseGeo = new THREE.CylinderGeometry(10, 14, 8, 6);
                const house = new THREE.Mesh(houseGeo, armorPlateMat);
                house.position.set(0, 8, 0);
                house.rotation.y = Math.PI / 2; // Orient hexagon point forward
                house.scale.set(1.4, 1.0, 1.2);
                turret.add(house);
                
                // Rear Ammo Bustle
                const bustleGeo = new THREE.BoxGeometry(16, 6, 8);
                const bustle = new THREE.Mesh(bustleGeo, darkMetalMat);
                bustle.position.set(0, 7.5, 6);
                turret.add(bustle);

                // 3 Heavy Cannon Barrels
                [-4.5, 0, 4.5].forEach(bx => {
                    const gunSystem = new THREE.Group();
                    gunSystem.position.set(bx, 8, -6);
                    
                    // Blast Bag / Recoil Sleeve Ring
                    const sleeveGeo = new THREE.CylinderGeometry(1.6, 2.0, 6, 8);
                    const sleeve = new THREE.Mesh(sleeveGeo, darkMetalMat);
                    sleeve.rotation.x = Math.PI / 2;
                    sleeve.position.set(0, 0, -3);
                    gunSystem.add(sleeve);
                    
                    // Main Barrel
                    const barrelGeo = new THREE.CylinderGeometry(1.0, 1.4, 22, 12);
                    const barrel = new THREE.Mesh(barrelGeo, darkMetalMat);
                    barrel.rotation.x = Math.PI / 2;
                    barrel.position.set(0, 0, -16);
                    gunSystem.add(barrel);
                    
                    // Muzzle Flange / Brake
                    const muzzleGeo = new THREE.CylinderGeometry(1.5, 1.1, 4, 12);
                    const muzzle = new THREE.Mesh(muzzleGeo, goldTrimMat);
                    muzzle.rotation.x = Math.PI / 2;
                    muzzle.position.set(0, 0, -28);
                    gunSystem.add(muzzle);
                    
                    turret.add(gunSystem);
                });

                capitalShip.add(turret);
                capitalShip.userData.turrets.push(turret);
            });

            // 8 Broadside Dual-Barrel Batteries (Port & Starboard)
            [-48, 48].forEach(sideX => {
                [-70, -20, 30, 80].forEach(sideZ => {
                    const pds = new THREE.Group();
                    pds.position.set(sideX, 10, sideZ);

                    const pdsBase = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 2, 16), darkMetalMat);
                    pds.add(pdsBase);

                    [-1.5, 1.5].forEach(bx => {
                        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 10, 8), darkMetalMat);
                        b.rotation.x = Math.PI / 2;
                        b.position.set(bx, 1.5, sideX > 0 ? 5 : -5);
                        pds.add(b);
                    });
                    pds.rotation.y = (sideX > 0 ? Math.PI / 2 : -Math.PI / 2);
                    capitalShip.add(pds);
                });
            });

            // Forward Spinal Heavy Plasma Beam Cannon Muzzles
            [-10, 10].forEach(mx => {
                const muzzleGeo = new THREE.CylinderGeometry(2.5, 3.5, 14, 16);
                const muzzle = new THREE.Mesh(muzzleGeo, darkMetalMat);
                muzzle.rotation.x = Math.PI / 2;
                muzzle.position.set(mx, 4, -205);
                capitalShip.add(muzzle);

                const glowCore = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 14.5, 16), cyanWindowGlowMat);
                glowCore.rotation.x = Math.PI / 2;
                glowCore.position.set(mx, 4, -205);
                capitalShip.add(glowCore);
            });

            // --- ROUND 6: COMMUNICATION SPIRE, RADAR ARRAY & SENSOR GREEBLE DETAILING ---
            const mainSpire = new THREE.Group();
            mainSpire.position.set(0, 80, -65);

            // Vertical Communications Spire Pole
            const mastGeo = new THREE.CylinderGeometry(0.8, 1.8, 38, 12);
            const mast = new THREE.Mesh(mastGeo, darkMetalMat);
            mainSpire.add(mast);

            // Cross-arm Sensor Booms
            [8, 18, 28].forEach(heightY => {
                const boomGeo = new THREE.BoxGeometry(16 - heightY * 0.3, 0.8, 0.8);
                const boom = new THREE.Mesh(boomGeo, goldTrimMat);
                boom.position.set(0, heightY - 19, 0);
                mainSpire.add(boom);
            });

            // Rotating Parabolic Radar Dish
            const radarGroup = new THREE.Group();
            radarGroup.position.set(0, 5, -8);
            const dishGeo = new THREE.CylinderGeometry(6, 1.5, 2.5, 16);
            const dish = new THREE.Mesh(dishGeo, armorPlateMat);
            dish.rotation.x = Math.PI / 3;
            radarGroup.add(dish);
            const dishFeed = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 6, 8), goldTrimMat);
            dishFeed.rotation.x = Math.PI / 3;
            dishFeed.position.set(0, 0, -3);
            radarGroup.add(dishFeed);

            mainSpire.add(radarGroup);
            capitalShip.userData.radarDish = radarGroup;

            capitalShip.add(mainSpire);

            // Greeble Pipes & Exhaust Vent Plates on Hull
            for (let p = 0; p < 8; p++) {
                const pipeGeo = new THREE.CylinderGeometry(0.9, 0.9, 80, 8);
                const pipe = new THREE.Mesh(pipeGeo, goldTrimMat);
                pipe.rotation.z = Math.PI / 2;
                pipe.position.set(0, 14, -60 + p * 30);
                capitalShip.add(pipe);
            }

            // --- ROUND 7: REAR ENGINE THRUSTER NACELLE ARRAY & EXHAUST FX ---
            const engineGroup = new THREE.Group();
            engineGroup.position.set(0, 0, 150);

            // 3 Primary Thruster Nacelles
            const mainEngines = [
                { x: 0, y: 6, z: 0, r: 16 },
                { x: -30, y: 6, z: 0, r: 15 },
                { x: 30, y: 6, z: 0, r: 15 }
            ];

            capitalShip.userData.engineEmitters = [];

            mainEngines.forEach(eng => {
                const nacelleGeo = new THREE.CylinderGeometry(eng.r - 2, eng.r, 50, 24);
                const nacelle = new THREE.Mesh(nacelleGeo, engineNozzleMat);
                nacelle.rotation.x = Math.PI / 2;
                nacelle.position.set(eng.x, eng.y, eng.z);
                engineGroup.add(nacelle);

                // Armored Cowling / Shroud over the top
                const shroudGeo = new THREE.CylinderGeometry(eng.r + 2, eng.r + 4, 30, 8, 1, false, 0, Math.PI);
                const shroud = new THREE.Mesh(shroudGeo, armorPlateMat);
                shroud.rotation.x = Math.PI / 2;
                shroud.rotation.z = -Math.PI / 2; // Orient half cylinder upward
                shroud.position.set(eng.x, eng.y, eng.z - 10);
                engineGroup.add(shroud);
                
                // Cowling Support Struts
                [-1, 1].forEach(side => {
                    const strut = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 30), darkMetalMat);
                    strut.position.set(eng.x + side * (eng.r + 2), eng.y, eng.z - 10);
                    engineGroup.add(strut);
                    
                    // Fuel Feed Pipelines
                    const fuelPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 28, 8), goldTrimMat);
                    fuelPipe.rotation.x = Math.PI / 2;
                    fuelPipe.position.set(eng.x + side * (eng.r + 1), eng.y - 3, eng.z - 10);
                    engineGroup.add(fuelPipe);
                    
                    // Micro Maneuvering Thruster Nozzle Block
                    const mcsBlock = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 4), darkMetalMat);
                    mcsBlock.position.set(eng.x + side * (eng.r + 3), eng.y + 4, eng.z - 5);
                    engineGroup.add(mcsBlock);
                    
                    const mcsNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.2, 1, 8), engineNozzleMat);
                    mcsNozzle.rotation.z = side * Math.PI / 2;
                    mcsNozzle.position.set(eng.x + side * (eng.r + 4.5), eng.y + 4, eng.z - 5);
                    engineGroup.add(mcsNozzle);
                });

                // Multi-stage Metallic Nozzle Ring
                const ringGeo = new THREE.TorusGeometry(eng.r + 1, 1.5, 12, 32);
                const ring = new THREE.Mesh(ringGeo, goldTrimMat);
                ring.position.set(eng.x, eng.y, eng.z + 24);
                engineGroup.add(ring);

                // Glowing Cyan Thruster Disk
                const diskGeo = new THREE.CircleGeometry(eng.r - 2, 24);
                const disk = new THREE.Mesh(diskGeo, engineGlowMat);
                disk.position.set(eng.x, eng.y, eng.z + 25.1);
                engineGroup.add(disk);

                // Add to particle emitters instead of using static cones
                // Note: engineGroup is at z=150 in local ship space
                capitalShip.userData.engineEmitters.push({
                    x: eng.x, y: eng.y, z: 150 + eng.z + 25.1, r: eng.r - 2
                });
            });

            // 2 Secondary Thruster Nacelles
            [-18, 18].forEach(sx => {
                const sNacelleGeo = new THREE.CylinderGeometry(8, 10, 36, 16);
                const sNacelle = new THREE.Mesh(sNacelleGeo, engineNozzleMat);
                sNacelle.rotation.x = Math.PI / 2;
                sNacelle.position.set(sx, -12, -5);
                engineGroup.add(sNacelle);
                
                const sShroudGeo = new THREE.CylinderGeometry(10, 11, 20, 6, 1, false, 0, Math.PI);
                const sShroud = new THREE.Mesh(sShroudGeo, armorPlateMat);
                sShroud.rotation.x = Math.PI / 2;
                sShroud.rotation.z = -Math.PI / 2;
                sShroud.position.set(sx, -12, -10);
                engineGroup.add(sShroud);

                const sDisk = new THREE.Mesh(new THREE.CircleGeometry(8, 16), engineGlowMat);
                sDisk.position.set(sx, -12, 13.1);
                engineGroup.add(sDisk);

                capitalShip.userData.engineEmitters.push({
                    x: sx, y: -12, z: 150 + 13.1, r: 8
                });
            });

            // Dynamic Rear Engine Point Light (5% cruising power glow)
            const rearEngineLight = new THREE.PointLight(0x00f0ff, 2.5, 300);
            rearEngineLight.position.set(0, 0, 30);
            engineGroup.add(rearEngineLight);

            capitalShip.add(engineGroup);

            // --- ROUND 9: NAVIGATION BEACONS & LIGHTING ---
            // Red Port Beacon Light
            const portBeacon = new THREE.PointLight(0xff3b5c, 3.5, 120);
            portBeacon.position.set(-56, 14, 130);
            portBeacon.userData = { baseIntensity: 3.5 };
            capitalShip.add(portBeacon);
            capitalShip.userData.beacons.push(portBeacon);

            // Green Starboard Beacon Light
            const stbdBeacon = new THREE.PointLight(0x10b981, 3.5, 120);
            stbdBeacon.position.set(56, 14, 130);
            stbdBeacon.userData = { baseIntensity: 3.5 };
            capitalShip.add(stbdBeacon);
            capitalShip.userData.beacons.push(stbdBeacon);

            // Top Spire Strobe Light (White)
            const spireBeacon = new THREE.PointLight(0xffffff, 4.0, 150);
            spireBeacon.position.set(0, 102, -65);
            spireBeacon.userData = { baseIntensity: 4.0 };
            capitalShip.add(spireBeacon);
            capitalShip.userData.beacons.push(spireBeacon);

            // Triple the physical scale of the Dreadnought Flagship
            capitalShip.scale.set(3, 3, 3);

            // Initial Placement in Orbit around Space Planet
            if (spacePlanet) {
                const orbitRadius = 11200;
                const orbitInclination = 0.26;
                const cosA = Math.cos(dreadOrbitAngle);
                const sinA = Math.sin(dreadOrbitAngle);
                capitalShip.position.set(
                    spacePlanet.position.x + orbitRadius * cosA,
                    spacePlanet.position.y + orbitRadius * sinA * Math.sin(orbitInclination),
                    spacePlanet.position.z + orbitRadius * sinA * Math.cos(orbitInclination)
                );
            } else {
                capitalShip.position.set(250, 40, -400);
            }
            scene.add(capitalShip);
        }

        function createWormholeGate() {
            wormholeGate = new THREE.Group();

            const ringGeo = new THREE.TorusGeometry(35, 3.5, 16, 64);
            const ringMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.2 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            wormholeGate.add(ring);

            const horizonGeo = new THREE.CircleGeometry(32, 64);
            const horizonMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
            const horizon = new THREE.Mesh(horizonGeo, horizonMat);
            wormholeGate.add(horizon);

            for (let i = 0; i < 12; i++) {
                const orbGeo = new THREE.SphereGeometry(1.5, 16, 16);
                const orbMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
                const orb = new THREE.Mesh(orbGeo, orbMat);
                const angle = (i / 12) * Math.PI * 2;
                orb.position.set(Math.cos(angle) * 35, Math.sin(angle) * 35, 0);
                wormholeGate.add(orb);
            }

            wormholeGate.position.set(-150, 20, -350);
            scene.add(wormholeGate);
        }

        // Zero-Allocation Global Helper Vectors (Prevents Garbage Collection Stuttering & Hangs)
        const _v1 = new THREE.Vector3();
        const _v2 = new THREE.Vector3();
        const _v3 = new THREE.Vector3();
        const _fwdDir = new THREE.Vector3();
        const _offsetL = new THREE.Vector3();
        const _offsetR = new THREE.Vector3();
        const _prevPos = new THREE.Vector3();
        const _currentPos = new THREE.Vector3();
        const _toTarget = new THREE.Vector3();
        const _curDir = new THREE.Vector3();

        function pointToSegmentDistance(p, a, b) {
            _v1.subVectors(b, a);
            _v2.subVectors(p, a);
            const l2 = _v1.lengthSq();
            if (l2 === 0) return p.distanceTo(a);
            let t = _v2.dot(_v1) / l2;
            t = Math.max(0, Math.min(1, t));
            _v3.copy(a).addScaledVector(_v1, t);
            return p.distanceTo(_v3);
        }

        // Shared Geometries & Materials for Zero-Allocation Silky Smooth 60 FPS Firing
        const sharedLaserCoreGeo = new THREE.CylinderGeometry(0.18, 0.18, 12, 8);
        sharedLaserCoreGeo.rotateX(Math.PI / 2);
        const sharedLaserCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const sharedLaserAuraGeo = new THREE.CylinderGeometry(0.48, 0.48, 12.5, 8);
        sharedLaserAuraGeo.rotateX(Math.PI / 2);
        const sharedLaserAuraMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.75 });

        const sharedLaserTipGeo = new THREE.SphereGeometry(0.55, 8, 8);
        const sharedLaserTipMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

        const laserPool = [];
        const enemyLaserPool = [];
        const maxPoolSize = 40;

        function initLaserPool() {
            if (laserPool.length > 0) return;
            for (let i = 0; i < maxPoolSize; i++) {
                // Player Laser
                const boltGroup = new THREE.Group();
                const coreMesh = new THREE.Mesh(sharedLaserCoreGeo, sharedLaserCoreMat);
                boltGroup.add(coreMesh);
                const auraMesh = new THREE.Mesh(sharedLaserAuraGeo, sharedLaserAuraMat);
                boltGroup.add(auraMesh);
                const tipMesh = new THREE.Mesh(sharedLaserTipGeo, sharedLaserTipMat);
                tipMesh.position.set(0, 0, -6.2);
                boltGroup.add(tipMesh);
                boltGroup.visible = false;
                boltGroup.userData = { active: false, velocity: new THREE.Vector3(), prevPos: new THREE.Vector3() };
                scene.add(boltGroup);
                laserPool.push(boltGroup);

                // Enemy Laser (Red)
                const eBoltGroup = new THREE.Group();
                const eCoreMesh = new THREE.Mesh(sharedLaserCoreGeo, sharedLaserCoreMat);
                eBoltGroup.add(eCoreMesh);
                const eAuraMat = new THREE.MeshBasicMaterial({ color: 0xff3b5c, transparent: true, opacity: 0.75 });
                const eAuraMesh = new THREE.Mesh(sharedLaserAuraGeo, eAuraMat);
                eBoltGroup.add(eAuraMesh);
                const eTipMat = new THREE.MeshBasicMaterial({ color: 0xff3b5c });
                const eTipMesh = new THREE.Mesh(sharedLaserTipGeo, eTipMat);
                eTipMesh.position.set(0, 0, -6.2);
                eBoltGroup.add(eTipMesh);
                eBoltGroup.visible = false;
                eBoltGroup.userData = { active: false, isEnemy: true, velocity: new THREE.Vector3(), prevPos: new THREE.Vector3() };
                scene.add(eBoltGroup);
                enemyLaserPool.push(eBoltGroup);
            }
        }

        function getPooledLaserBolt() {
            for (let i = 0; i < laserPool.length; i++) {
                if (!laserPool[i].userData.active) {
                    laserPool[i].userData.active = true;
                    return laserPool[i];
                }
            }
            return null;
        }

        function getPooledEnemyLaserBolt() {
            for (let i = 0; i < enemyLaserPool.length; i++) {
                if (!enemyLaserPool[i].userData.active) {
                    enemyLaserPool[i].userData.active = true;
                    return enemyLaserPool[i];
                }
            }
            return null;
        }

        let lastFireTime = 0;

        function firePlasmaLaser() {
            if (isTacticalMapOpen || isGamePaused || isOptionsOpen) return;
            const nowTime = performance.now();
            if (nowTime - lastFireTime < 100) return; // 100ms fire cooldown rate-limit (~10 shots/sec max rate)
            lastFireTime = nowTime;

            if (!playerShip) return;

            // Reuse pre-allocated helper vectors - ZERO GC allocations!
            _fwdDir.set(0, 0, -1).applyQuaternion(playerShip.quaternion);

            _offsetL.set(-2.4, -0.1, -2.4).applyQuaternion(playerShip.quaternion);
            _offsetR.set(2.4, -0.1, -2.4).applyQuaternion(playerShip.quaternion);

            const laserL = getPooledLaserBolt();
            const laserR = getPooledLaserBolt();

            if (laserL) {
                laserL.visible = true;
                laserL.quaternion.copy(playerShip.quaternion);
                laserL.position.copy(playerShip.position).add(_offsetL);
                laserL.userData.prevPos.copy(laserL.position);
                laserL.userData.velocity.copy(_fwdDir).multiplyScalar(12 + currentSpeed * 0.012);
                if (!laserProjectiles.includes(laserL)) laserProjectiles.push(laserL);
            }

            if (laserR) {
                laserR.visible = true;
                laserR.quaternion.copy(playerShip.quaternion);
                laserR.position.copy(playerShip.position).add(_offsetR);
                laserR.userData.prevPos.copy(laserR.position);
                laserR.userData.velocity.copy(_fwdDir).multiplyScalar(12 + currentSpeed * 0.012);
                if (!laserProjectiles.includes(laserR)) laserProjectiles.push(laserR);
            }

            // Play ElevenLabs High-Fidelity Audio Sample (or Fallback Synthesizer)
            if (elevenLabsBuffers.fire && audioCtx && audioCtx.state === 'running' && !isAudioMuted) {
                try {
                    const src = audioCtx.createBufferSource();
                    src.buffer = elevenLabsBuffers.fire;
                    src.playbackRate.value = 1 / 3; // Tripled the length of the MP3 sound
                    const gain = audioCtx.createGain();
                    gain.gain.setValueAtTime(0.45, audioCtx.currentTime);
                    src.connect(gain);
                    gain.connect(audioCtx.destination);
                    src.start(0);
                } catch (e) {}
            } else if (audioCtx && audioCtx.state === 'running' && !isAudioMuted) {
                try {
                    const now = audioCtx.currentTime;
                    const duration = 0.66; // Tripled from 0.22

                    // Main Sci-Fi Energy Beam Zap (High Frequency Sawtooth Sweep - Crisp Beam)
                    const lOsc = audioCtx.createOscillator();
                    const lGain = audioCtx.createGain();
                    lOsc.type = 'sawtooth';
                    lOsc.frequency.setValueAtTime(1450, now);
                    lOsc.frequency.exponentialRampToValueAtTime(280, now + duration);
                    lGain.gain.setValueAtTime(0.14, now);
                    lGain.gain.linearRampToValueAtTime(0.001, now + duration);
                    lOsc.connect(lGain);
                    lGain.connect(audioCtx.destination);
                    lOsc.start(now);
                    lOsc.stop(now + duration);

                    // Layer 3: High-Frequency Energy Beam Resonance Sizzle (Filtered Noise Pop)
                    const nBuf = getExplosionNoiseBuffer();
                    if (nBuf) {
                        const nNode = audioCtx.createBufferSource();
                        nNode.buffer = nBuf;
                        const filter = audioCtx.createBiquadFilter();
                        filter.type = 'bandpass';
                        filter.frequency.setValueAtTime(3200, now);
                        filter.Q.setValueAtTime(3.0, now);
                        const nGain = audioCtx.createGain();
                        nGain.gain.setValueAtTime(0.09, now);
                        nGain.gain.linearRampToValueAtTime(0.001, now + 0.24); // Tripled from 0.08
                        nNode.connect(filter);
                        filter.connect(nGain);
                        nGain.connect(audioCtx.destination);
                        nNode.start(now);
                        nNode.stop(now + 0.24); // Tripled from 0.08
                    }
                } catch (e) {}
            }
        }

        function triggerWormholeJump() {
            isWormholeActive = true;
            const sec = document.getElementById('hud-sector');
            const obj = document.getElementById('hud-objective');
            if (sec) sec.innerText = "WORMHOLE HYPERSPACE TUNNEL";
            if (obj) obj.innerText = "Transitioning to Sovereign Reach...";
            showToast("HYPERSPACE WARP ENGAGED! Warp Drive Active!");

            playerShip.position.set(-150, 20, -310);
        }

        function createEnemyInterceptorMesh() {
            const enemyGroup = new THREE.Group();

            // Fuselage / Hull (Aggressive Dark Metallic Fighter Body)
            const hullGeo = new THREE.BoxGeometry(2.4, 1.2, 7.5);
            const hullMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
            const hull = new THREE.Mesh(hullGeo, hullMat);
            enemyGroup.add(hull);

            // Cockpit Visor (Glowing Crimson Visor Window)
            const visorGeo = new THREE.BoxGeometry(1.6, 0.8, 2.2);
            const visorMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
            const visor = new THREE.Mesh(visorGeo, visorMat);
            visor.position.set(0, 0.4, -1.8);
            enemyGroup.add(visor);

            // Swept Wings (Crimson Edge Trim)
            const wingGeo = new THREE.ConeGeometry(5.5, 6.0, 4);
            wingGeo.rotateX(Math.PI / 2);
            const wingMat = new THREE.MeshBasicMaterial({ color: 0xff3b5c, wireframe: false });
            const wings = new THREE.Mesh(wingGeo, wingMat);
            wings.position.set(0, 0, 0.5);
            enemyGroup.add(wings);

            // Thruster Glow Engine Light (Crimson Point Light)
            const thrusterLight = new THREE.PointLight(0xff0044, 4, 35);
            thrusterLight.position.set(0, 0, 4.0);
            enemyGroup.add(thrusterLight);

            // Metadata for HP & Hit Flash
            enemyGroup.userData = {
                hp: 100,
                maxHp: 100,
                name: "Void Interceptor Mk-II",
                flashTimer: 0
            };

            return enemyGroup;
        }

        let explosionParticles = [];

        function spawnLaserImpactSparks(pos) {
            for (let i = 0; i < 14; i++) {
                const pGeo = new THREE.SphereGeometry(0.25, 8, 8);
                const pMat = new THREE.MeshBasicMaterial({ color: (i % 2 === 0) ? 0x00f0ff : 0xffffff });
                const p = new THREE.Mesh(pGeo, pMat);
                p.position.copy(pos);
                p.userData.vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 8
                );
                p.userData.life = 1.0;
                scene.add(p);
                explosionParticles.push(p);
            }
        }

        // Shared Geometries & Materials for Zero-Allocation Explosion FX
        const sharedExpParticleGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const sharedExpColors = [
            new THREE.MeshBasicMaterial({ color: 0xfbbf24 }),
            new THREE.MeshBasicMaterial({ color: 0xf97316 }),
            new THREE.MeshBasicMaterial({ color: 0xef4444 }),
            new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        ];

        const sharedRingGeo = new THREE.RingGeometry(1, 4, 128);
        sharedRingGeo.rotateX(Math.PI / 2);
        const sharedRingMat = new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide, transparent: true, opacity: 1.0 });

        function createEpicPlayerDeathExplosion(pos) {
            // Massive scale explosion for player death
            for (let i = 0; i < 800; i++) {
                const pMat = sharedExpColors[i % sharedExpColors.length];
                const p = new THREE.Mesh(sharedExpParticleGeo, pMat);
                p.position.copy(pos);
                
                const scale = 2.0 + Math.random() * 4.0;
                p.scale.set(scale, scale, scale);
                
                const velMag = 150 + Math.random() * 100;
                p.userData.vel = new THREE.Vector3(
                    (Math.random() - 0.5) * velMag,
                    (Math.random() - 0.5) * velMag,
                    (Math.random() - 0.5) * velMag
                );
                // Last much longer
                p.userData.life = 3.0;
                p.userData.isDeathParticle = true;
                scene.add(p);
                explosionParticles.push(p);
            }

            // Multiple giant shockwaves
            for (let i = 0; i < 6; i++) {
                setTimeout(() => {
                    const shockwave = new THREE.Mesh(sharedRingGeo, sharedRingMat.clone());
                    const colorChoices = [0xf97316, 0xef4444, 0xfbbf24, 0xffffff];
                    shockwave.material.color.setHex(colorChoices[Math.floor(Math.random() * colorChoices.length)]);
                    shockwave.position.copy(pos);
                    shockwave.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
                    shockwave.userData.isShockwave = true;
                    shockwave.userData.isDeathShockwave = true; // Decays slower
                    scene.add(shockwave);
                    explosionParticles.push(shockwave);
                    playExplosionAudio();
                }, i * 350);
            }
            
            // --- 20 ROUNDS OF AWESOME SHIP FRACTURING ---
            if (playerShip) {
                // Step out to make the view cinematic
                cameraMode = 3; 
                const crosshair = document.querySelector('.hud-center-crosshair');
                if (crosshair) crosshair.style.opacity = '0';
                const lockZone = document.getElementById('target-lock-zone');
                if (lockZone) lockZone.style.opacity = '0';
                
                window.deathTimeDilation = 0.1; // Slow motion matrix effect
                window.deathCameraShake = 5.0; // Massive camera shake
                
                // Massive whiteout screen flash
                const whiteout = document.createElement('div');
                whiteout.style.position = 'fixed'; whiteout.style.top = '0'; whiteout.style.left = '0'; whiteout.style.width = '100%'; whiteout.style.height = '100%'; whiteout.style.backgroundColor = '#ffffff'; whiteout.style.zIndex = '99999'; whiteout.style.pointerEvents = 'none'; whiteout.style.transition = 'opacity 3s ease-out';
                document.body.appendChild(whiteout);
                setTimeout(() => { whiteout.style.opacity = '0'; setTimeout(() => whiteout.remove(), 3000); }, 50);

                const pieces = [];
                playerShip.traverse((child) => {
                    if (child.isMesh && child !== playerShieldBubble) {
                        pieces.push(child);
                    }
                });
                
                pieces.forEach((piece) => {
                    const wp = new THREE.Vector3();
                    const wq = new THREE.Quaternion();
                    const ws = new THREE.Vector3();
                    piece.getWorldPosition(wp);
                    piece.getWorldQuaternion(wq);
                    piece.getWorldScale(ws);
                    
                    scene.add(piece); // Detach into world
                    piece.position.copy(wp);
                    piece.quaternion.copy(wq);
                    piece.scale.copy(ws);
                    
                    // Calculate outward trajectory from center of explosion
                    const outward = wp.clone().sub(pos).normalize();
                    outward.x += (Math.random() - 0.5) * 2;
                    outward.y += (Math.random() - 0.5) * 2;
                    outward.z += (Math.random() - 0.5) * 2;
                    outward.normalize();
                    
                    const speed = 100 + Math.random() * 200; // Violently fast
                    piece.userData.vel = outward.multiplyScalar(speed);
                    
                    piece.userData.rotVel = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.8,
                        (Math.random() - 0.5) * 0.8,
                        (Math.random() - 0.5) * 0.8
                    );
                    
                    // Make the piece glow superheated orange/yellow
                    piece.material = piece.material.clone();
                    piece.material.emissive = new THREE.Color(0xff4400);
                    piece.material.emissiveIntensity = 4.0; // Blinding hot
                    
                    piece.userData.isShipDebris = true;
                    piece.userData.life = 5.0; 
                    explosionParticles.push(piece);
                });
                
                playerShip.visible = false; // Hide the root group
            }
        }

        function createFieryExplosionFX(pos) {
            // Randomize explosion attributes for realism
            const particleCount = 200 + Math.floor(Math.random() * 200); // Massive increase: 200 to 400 particles!
            const overallScale = 0.5 + Math.random() * 1.0;
            const overallVelocity = 0.5 + Math.random() * 1.0;

            // 1. Fiery Plasma Shrapnel Debris Particles
            for (let i = 0; i < particleCount; i++) {
                const pMat = sharedExpColors[i % sharedExpColors.length];
                const p = new THREE.Mesh(sharedExpParticleGeo, pMat);
                p.position.copy(pos);
                
                const scale = (1.2 + Math.random() * 2.0) * overallScale;
                p.scale.set(scale, scale, scale);
                
                const velMag = 55 * overallVelocity;
                p.userData.vel = new THREE.Vector3(
                    (Math.random() - 0.5) * velMag,
                    (Math.random() - 0.5) * velMag,
                    (Math.random() - 0.5) * velMag
                );
                p.userData.life = 1.0;
                scene.add(p);
                explosionParticles.push(p);
            }

            // 2. Giant Expanding Shockwave Ring (Solid Mesh)
            const shockwave = new THREE.Mesh(sharedRingGeo, sharedRingMat.clone());
            // Randomize shockwave color to orange, red, or yellow
            const colorChoices = [0xf97316, 0xef4444, 0xfbbf24, 0xffffff];
            shockwave.material.color.setHex(colorChoices[Math.floor(Math.random() * colorChoices.length)]);
            shockwave.position.copy(pos);
            
            // Randomize shockwave angle
            shockwave.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
            
            shockwave.userData.isShockwave = true;
            shockwave.userData.life = 1.0;
            scene.add(shockwave);
            explosionParticles.push(shockwave);

            // 3. ElevenLabs-Style Cinema-Grade Booming Explosion Sound Effect
            playExplosionAudio();
        }

        function playLaserImpactAudio() {
            // Disabled sound on hit per user request
            return;
        }

        let cachedExplosionNoiseBuffer = null;

        function getExplosionNoiseBuffer() {
            if (!cachedExplosionNoiseBuffer && audioCtx) {
                const bufferSize = Math.floor(audioCtx.sampleRate * 2.2); // 2.2s stereo noise buffer
                cachedExplosionNoiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const out = cachedExplosionNoiseBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    out[i] = (Math.random() * 2 - 1);
                }
            }
            return cachedExplosionNoiseBuffer;
        }

        function playExplosionAudio() {
            if (!audioCtx || audioCtx.state !== 'running' || isAudioMuted) return;
            
            // Randomize audio properties for realism (Volume significantly increased per request)
            const pitchVar = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
            const volVar = (0.8 + Math.random() * 0.4) * 1.75; // Increased volume multiplier
            const durVar = 0.7 + Math.random() * 0.6; // 0.7 to 1.3

            if (elevenLabsBuffers.explosion) {
                try {
                    const src = audioCtx.createBufferSource();
                    src.buffer = elevenLabsBuffers.explosion;
                    src.playbackRate.value = 0.5 * pitchVar;
                    const gain = audioCtx.createGain();
                    gain.gain.setValueAtTime(1.70 * volVar, audioCtx.currentTime);
                    src.connect(gain);
                    gain.connect(audioCtx.destination);
                    src.start(0);
                    return;
                } catch (e) {}
            }
            try {
                const now = audioCtx.currentTime;
                const totalDuration = 4.8 * durVar;

                // Layer 1: Sub-Bass Infra-Drop
                const subOsc = audioCtx.createOscillator();
                const subGain = audioCtx.createGain();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(280 * pitchVar, now);
                subOsc.frequency.exponentialRampToValueAtTime(24, now + totalDuration);
                subGain.gain.setValueAtTime(1.30 * volVar, now);
                subGain.gain.linearRampToValueAtTime(0.001, now + totalDuration);
                subOsc.connect(subGain);
                subGain.connect(audioCtx.destination);
                subOsc.start(now);
                subOsc.stop(now + totalDuration);

                // Layer 2: Filtered Hull Detonation & Shockwave Rumble
                const noiseBuf = getExplosionNoiseBuffer();
                if (noiseBuf) {
                    const noiseNode = audioCtx.createBufferSource();
                    noiseNode.buffer = noiseBuf;
                    
                    const filter = audioCtx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(2200 * pitchVar, now);
                    filter.frequency.exponentialRampToValueAtTime(50, now + 3.6 * durVar);
                    
                    const noiseGain = audioCtx.createGain();
                    noiseGain.gain.setValueAtTime(1.10 * volVar, now);
                    noiseGain.gain.linearRampToValueAtTime(0.001, now + 3.6 * durVar);
                    
                    noiseNode.connect(filter);
                    filter.connect(noiseGain);
                    noiseGain.connect(audioCtx.destination);
                    noiseNode.start(now);
                    noiseNode.stop(now + 3.6 * durVar);
                }

                // Layer 3: Secondary Shrapnel Rupture Crackle
                const tearOsc = audioCtx.createOscillator();
                const tearGain = audioCtx.createGain();
                tearOsc.type = 'sawtooth';
                tearOsc.frequency.setValueAtTime(450 * pitchVar, now + 0.05);
                tearOsc.frequency.exponentialRampToValueAtTime(60, now + 0.90 * durVar);
                tearGain.gain.setValueAtTime(0.50 * volVar, now + 0.05);
                tearGain.gain.linearRampToValueAtTime(0.001, now + 0.90 * durVar);
                tearOsc.connect(tearGain);
                tearGain.connect(audioCtx.destination);
                tearOsc.start(now + 0.05);
                tearOsc.stop(now + 0.90 * durVar);
            } catch (e) {}
        }

        function spawnEnemySwarm() {
            const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(playerShip.quaternion);
            for (let i = 0; i < 6; i++) {
                const enemy = createEnemyInterceptorMesh();
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 600,
                    (Math.random() - 0.5) * 300,
                    -600 - Math.random() * 1600
                );
                enemy.position.copy(playerShip.position).add(fwd.clone().multiplyScalar(800)).add(offset);
                scene.add(enemy);
                enemyShips.push(enemy);
            }
            showToast("⚠️ 6 ENEMY VOID INTERCEPTORS ENGAGED! TARGET LOCK ACTIVE");
        }

        function approachCapitalShip() {
            if (!capitalShip) return;
            const backwardOffset = new THREE.Vector3(0, 120, 600).applyQuaternion(capitalShip.quaternion);
            playerShip.position.copy(capitalShip.position).add(backwardOffset);
            playerShip.quaternion.copy(capitalShip.quaternion);
            targetSpeed = 100;
            currentSpeed = 100;
            const sec = document.getElementById('hud-sector');
            const obj = document.getElementById('hud-objective');
            if (sec) sec.innerText = "AYTHELGARD PLANETARY ORBIT";
            if (obj) obj.innerText = "Escort Sovereign Dreadnought in Planetary Orbit";
            showToast("Approaching Sovereign Royal Flagship in Planetary Orbit!");
        }

        function resetSimView() {
            playerShip.position.set(0, 0, 0);
            playerShip.rotation.set(0, 0, 0);
            playerShip.quaternion.set(0, 0, 0, 1);
            targetSpeed = 0;
            currentSpeed = 0;
            isWormholeActive = false;
            const sec = document.getElementById('hud-sector');
            const obj = document.getElementById('hud-objective');
            if (sec) sec.innerText = "SOL OUTER RIM";
            if (obj) obj.innerText = "Investigate Anomaly or Fly through Wormhole";
            showToast("Flight position reset to Sol Station.");
        }

        let lastTime = performance.now();
        function animate() {
            requestAnimationFrame(animate);
            const now = performance.now();
            const timeDelta = (now - lastTime) / 1000;
            lastTime = now;

            if (isTacticalMapOpen) {
                renderTacticalMap3D();
            }

            if (isGamePaused) {
                if (!isTacticalMapOpen) {
                    renderUpgradeHangar3D();
                }
                return;
            }

            // --- W / S Throttle Speed Controls (W = Accelerate, S = Decelerate) ---
            const throttleMult = (gameMechanicsConfig.throttleAccel || 100) / 100;
            const accelRate = 0.44 * throttleMult; 

            if (keys.KeyW) targetSpeed = Math.min(targetSpeed + accelRate, maxSpeedCap);
            if (keys.KeyS) targetSpeed = Math.max(targetSpeed - accelRate, 0);
            currentSpeed += (targetSpeed - currentSpeed) * (0.0055 * throttleMult);

            // Update Cockpit Engine Sound Pitch, Muffling & Volume dynamically (0% -> 100% Throttle)
            updateEngineAudio(currentSpeed / maxSpeedCap, cameraMode === 0);

            const postedSpeed = Math.round(currentSpeed * 250); // Posted speed scaled to max 100,000 km/h
            const speedElem = document.getElementById('hud-speed');
            if (speedElem) speedElem.innerText = `SPEED: ${postedSpeed.toLocaleString()} km/h ${currentSpeed > 360 ? '[MAX THROTTLE]' : ''}`;

            // --- SINGULARITY-FREE 360° QUATERNION FLIGHT (LOOPS & ROLLS WITHOUT FLIPPING) ---
            const deadzone = 0.03;
            const turnRate = 0.0052; // Reduced by 50% for smooth precision maneuvering

            const normX = Math.abs(normalizedMouse.x) <= deadzone ? 0 : Math.min((Math.abs(normalizedMouse.x) - deadzone) / (1.0 - deadzone), 1.0);
            const normY = Math.abs(normalizedMouse.y) <= deadzone ? 0 : Math.min((Math.abs(normalizedMouse.y) - deadzone) / (1.0 - deadzone), 1.0);

            const mouseXEff = Math.sign(normalizedMouse.x) * normX;
            const mouseYEff = Math.sign(normalizedMouse.y) * normY;

            let arrowPitch = 0;
            let arrowYaw = 0;
            if (keys.PitchUp || keys.ArrowUp) arrowPitch += 1.0;
            if (keys.PitchDown || keys.ArrowDown) arrowPitch -= 1.0;
            if (keys.YawLeft || keys.ArrowLeft) arrowYaw += 1.0;
            if (keys.YawRight || keys.ArrowRight) arrowYaw -= 1.0;

            const totalPitch = Math.max(-1.0, Math.min(1.0, mouseYEff + arrowPitch));
            const totalYaw = Math.max(-1.0, Math.min(1.0, -mouseXEff + arrowYaw));

            // Apply local pitch (X) and yaw (Y) quaternion rotations directly
            // Allows full 360° loop-de-loops over the top without any view snapping or gimbal flips!
            if (!isFlightLocked) {
                playerShip.rotateX(totalPitch * turnRate);
                playerShip.rotateY(totalYaw * turnRate);
            }

            // A/D Keys for rolling the ship (very slowly)
            const rollRate = turnRate * 0.4 * (gameMechanicsConfig.rollSpeed / 100);
            if (keys.KeyA) playerShip.rotateZ(rollRate);
            if (keys.KeyD) playerShip.rotateZ(-rollRate);

            // Move ship forward (Physical 3D world movement doubled per user request)
            const moveDir = new THREE.Vector3(0, 0, -1).applyQuaternion(playerShip.quaternion);
            const frameDisplacement = moveDir.clone().multiplyScalar(currentSpeed * 0.0064);
            const oldPos = playerShip.position.clone();
            playerShip.position.add(frameDisplacement);

            // Prevent clipping into planet (Smooth sliding atmospheric repulsor buffer)
            if (spacePlanet) {
                const planetRadius = 9000;
                const bufferZone = 120; // Maintain 120 unit atmospheric buffer
                const distToCore = playerShip.position.distanceTo(spacePlanet.position);
                
                if (distToCore < planetRadius + bufferZone) {
                    const pushOutDir = playerShip.position.clone().sub(spacePlanet.position).normalize();
                    playerShip.position.copy(spacePlanet.position).add(pushOutDir.multiplyScalar(planetRadius + bufferZone));
                    
                    // Optionally show a warning UI tag if they are hitting the barrier
                    if (currentSpeed > 50) {
                        const statusTag = document.getElementById('throttle-status-tag');
                        if (statusTag && Math.random() < 0.1) {
                            statusTag.innerText = 'ATMOS REPULSE';
                            statusTag.style.color = '#ff3b5c';
                            setTimeout(() => {
                                if (statusTag.innerText === 'ATMOS REPULSE') {
                                    statusTag.innerText = 'STABLE';
                                    statusTag.style.color = '#f59e0b';
                                }
                            }, 500);
                        }
                    }
                }
            }

            // Fix: Add the ship's exact physical displacement to the camera BEFORE lerping.
            // This perfectly separates translational lag from rotational/orbit lag for Cinematic mode.
            // We ONLY do this for Cockpit (0) and Cinematic (3). 
            // Third Person modes (1 & 2) skip this so they naturally trail behind during acceleration!
            const trueDisplacement = playerShip.position.clone().sub(oldPos);
            if (cameraMode === 0 || cameraMode === 3) {
                camera.position.add(trueDisplacement);
            }

            // Keep starfield celestial dome anchored to player position so stars stay far off on horizon
            if (starfield) starfield.position.copy(playerShip.position);

            // --- Multi-Mode Camera System (Cockpit / Close / Far / Cinematic Showcase) ---
            let targetCamPos;
            let targetLookAtPos = playerShip.position.clone().add(new THREE.Vector3(0, 0, -10).applyQuaternion(playerShip.quaternion));

            if (cameraMode === 0) {
                // Mode 0: Cockpit View (First-Person) - Hide exterior ship model & engine lights so they do not block cockpit view
                playerShip.visible = false;
                if (playerShip.userData && playerShip.userData.engineLights) {
                    playerShip.userData.engineLights.forEach(l => l.visible = false);
                }
                targetCamPos = playerShip.position.clone().add(new THREE.Vector3(0, 0.45, -0.1).applyQuaternion(playerShip.quaternion));
                targetLookAtPos = playerShip.position.clone().add(new THREE.Vector3(0, 0.45, -25).applyQuaternion(playerShip.quaternion));
            } else {
                playerShip.visible = true;
                if (playerShip.userData && playerShip.userData.engineLights) {
                    playerShip.userData.engineLights.forEach(l => l.visible = true);
                }
                if (cameraMode === 1) {
                    // Mode 1: Rear Third-Person Close
                    targetCamPos = playerShip.position.clone().add(new THREE.Vector3(0, 2.2, 7.5).applyQuaternion(playerShip.quaternion));
                } else if (cameraMode === 2) {
                    // Mode 2: Rear Third-Person Far
                    targetCamPos = playerShip.position.clone().add(new THREE.Vector3(0, 6.0, 22.0).applyQuaternion(playerShip.quaternion));
                } else if (cameraMode === 3) {
                    // Mode 3: Cinematic Orbiting Showcase (Ship Invincible, 50% Slower Ultra-Majestic Panning)
                    cinematicAngle += 0.0015; // Reduced by 50% for ultra-filmic slow cinematic sweeps
                    const radius = 22;
                    const height = Math.sin(cinematicAngle * 0.7) * 5 + 4;
                    const orbitOffset = new THREE.Vector3(
                        Math.cos(cinematicAngle) * radius,
                        height,
                        Math.sin(cinematicAngle) * radius
                    );
                    targetCamPos = playerShip.position.clone().add(orbitOffset);
                    targetLookAtPos = playerShip.position.clone();
                }
            }

            // Sync camera up vector to ship local up vector to allow smooth 360° loop-de-loops
            const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(playerShip.quaternion);
            camera.up.copy(localUp);

            const dynamicLerp = 0.01 + ((100 - gameMechanicsConfig.cameraLag) / 100) * 0.20;
            camera.position.lerp(targetCamPos, cameraMode === 3 ? 0.01 : dynamicLerp);
            camera.lookAt(targetLookAtPos);
            camera.updateMatrixWorld(); // Force matrix update so 2D UI projections have zero frame lag

            if (capitalShip) {
                const timeSec = Date.now() * 0.001;

                // --- DREADNOUGHT PLANETARY ORBITAL FLIGHT PHYSICS ---
                if (spacePlanet) {
                    dreadOrbitAngle += 0.00007; // Slowed by 50% again for smoother cinematic orbital cruise
                    const orbitRadius = 11200; // Low-to-mid orbit above atmospheric rim (9,160) & within ring system
                    const orbitInclination = 0.26; // ~15° orbital plane inclination

                    const cosA = Math.cos(dreadOrbitAngle);
                    const sinA = Math.sin(dreadOrbitAngle);

                    const relX = orbitRadius * cosA;
                    const relY = orbitRadius * sinA * Math.sin(orbitInclination);
                    const relZ = orbitRadius * sinA * Math.cos(orbitInclination);

                    capitalShip.position.set(
                        spacePlanet.position.x + relX,
                        spacePlanet.position.y + relY,
                        spacePlanet.position.z + relZ
                    );

                    // Direction of forward orbital velocity (tangent vector along the orbit)
                    const tangentDir = new THREE.Vector3(
                        -sinA,
                        cosA * Math.sin(orbitInclination),
                        cosA * Math.cos(orbitInclination)
                    ).normalize();

                    // Point forward prow along direction of orbital travel
                    const lookTarget = capitalShip.position.clone().sub(tangentDir);
                    const upVector = new THREE.Vector3(relX, relY + 2000, relZ).normalize();
                    capitalShip.up.copy(upVector);
                    capitalShip.lookAt(lookTarget);
                }

                if (capitalShip.userData) {
                    // Animate Crystal Core & Rings
                    if (capitalShip.userData.crystalCore) {
                        capitalShip.userData.crystalCore.rotation.y += 0.015;
                        capitalShip.userData.crystalCore.rotation.z += 0.008;
                    }
                    if (capitalShip.userData.crystalRings) {
                        capitalShip.userData.crystalRings.forEach((r, idx) => {
                            r.rotation.z += (idx % 2 === 0 ? 0.02 : -0.02);
                        });
                    }
                    if (capitalShip.userData.crystalLight) {
                        capitalShip.userData.crystalLight.intensity = 4.0 + Math.sin(timeSec * 4) * 1.5;
                    }

                    // Animate Radar Dish Assembly
                    if (capitalShip.userData.radarDish) {
                        capitalShip.userData.radarDish.rotation.y += 0.02;
                    }

                    // Animate Blinking Navigation Beacons
                    if (capitalShip.userData.beacons) {
                        const blink = (Math.sin(timeSec * 5) > 0 ? 1.0 : 0.15);
                        capitalShip.userData.beacons.forEach(b => {
                            b.intensity = b.userData.baseIntensity * blink;
                        });
                    }

                    // Animate Heavy Turrets Target Tracking (Aim toward player or target)
                    if (capitalShip.userData.turrets && playerShip) {
                        capitalShip.userData.turrets.forEach(turret => {
                            const worldPos = new THREE.Vector3();
                            turret.getWorldPosition(worldPos);
                            const dx = playerShip.position.x - worldPos.x;
                            const dz = playerShip.position.z - worldPos.z;
                            const targetAngle = Math.atan2(dx, dz) - capitalShip.rotation.y;
                            turret.rotation.y = THREE.MathUtils.lerp(turret.rotation.y, targetAngle, 0.03);
                        });
                    }

                    // Animate Dreadnought 5% Cruise Engine Exhaust Plumes
                    if (capitalShip.userData.engineEmitters) {
                        if (!capitalShip.userData.particles) capitalShip.userData.particles = [];
                        
                        const shipQuat = capitalShip.quaternion;
                        
                        // Spawn 5% cruise particles
                        if (cameraMode !== 0) {
                            capitalShip.userData.engineEmitters.forEach(em => {
                                const pGeo = new THREE.SphereGeometry(Math.random() * 1.5 + 1.0, 6, 6);
                                const pMat = new THREE.MeshBasicMaterial({
                                    color: 0x38bdf8,
                                    transparent: true,
                                    opacity: 0.38
                                });
                                const p = new THREE.Mesh(pGeo, pMat);
                                
                                // Scale local emitter position by 3x capital ship size
                                const localPos = new THREE.Vector3(
                                    (em.x + (Math.random()-0.5) * em.r * 0.6) * 3,
                                    (em.y + (Math.random()-0.5) * em.r * 0.6) * 3,
                                    em.z * 3
                                );
                                
                                p.position.copy(localPos).applyQuaternion(shipQuat).add(capitalShip.position);
                                p.userData.life = 1.0;
                                
                                // 5% gentle cruise engine drift backwards
                                const backwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(shipQuat);
                                p.userData.vel = backwardDir.multiplyScalar(Math.random() * 1.8 + 0.8);
                                
                                scene.add(p);
                                capitalShip.userData.particles.push(p);
                            });
                        }
                        
                        // Update existing particles
                        for (let i = capitalShip.userData.particles.length - 1; i >= 0; i--) {
                            const p = capitalShip.userData.particles[i];
                            p.userData.life -= 0.022;
                            if (p.userData.life <= 0 || cameraMode === 0) {
                                scene.remove(p);
                                p.geometry.dispose();
                                p.material.dispose();
                                capitalShip.userData.particles.splice(i, 1);
                            } else {
                                p.position.add(p.userData.vel);
                                p.scale.setScalar(p.userData.life * 2.0);
                                p.material.opacity = p.userData.life * 0.38;
                                p.material.color.lerp(new THREE.Color(0x0284c7), 0.04);
                            }
                        }
                    }
                }
            }
            if (spacePlanet) spacePlanet.rotation.y += 0.00015;

            // --- ANIMATE ENEMY INTERCEPTORS & TARGET LOCK SELECTION ---
            let closestEnemy = null;
            let closestDist = 10500; // TRIPLED TARGET RANGE: 10,500 Units / 10.5 KM!
            const fwdDir = new THREE.Vector3(0, 0, -1).applyQuaternion(playerShip.quaternion);

            enemyShips.forEach(e => {
                if (e.userData && e.userData.hp > 0 && playerShip) {
                    const toPlayer = playerShip.position.clone().sub(e.position);
                    const dist = toPlayer.length();
                    
                    if (dist > 0) {
                        const dir = toPlayer.clone().normalize();
                        // Turn towards player smoothly
                        const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
                        e.quaternion.slerp(targetQuat, 0.05);

                        // Move based on distance (75% slower)
                        if (dist > 400) {
                            e.translateZ(-1.5);
                        } else if (dist < 150) {
                            e.translateZ(0.75); // Back away
                        } else {
                            // Strafe
                            e.translateX(Math.sin(Date.now() * 0.001 + e.id) * 0.75);
                            e.translateY(Math.cos(Date.now() * 0.001 + e.id) * 0.375);
                        }

                        // Shoot at player
                        e.userData.lastFireTime = e.userData.lastFireTime || 0;
                        if (dist < 3000 && Date.now() - e.userData.lastFireTime > 800 + Math.random() * 1000) {
                            e.userData.lastFireTime = Date.now();
                            const eLaser = getPooledEnemyLaserBolt();
                            if (eLaser) {
                                eLaser.visible = true;
                                eLaser.quaternion.copy(e.quaternion);
                                // Random left or right wing offset
                                const side = Math.random() > 0.5 ? -2.4 : 2.4;
                                const offset = new THREE.Vector3(side, -0.1, -2.4).applyQuaternion(e.quaternion);
                                eLaser.position.copy(e.position).add(offset);
                                eLaser.userData.prevPos.copy(eLaser.position);
                                eLaser.userData.velocity.copy(dir).multiplyScalar(12); // Speed 12
                                if (!enemyLaserProjectiles.includes(eLaser)) enemyLaserProjectiles.push(eLaser);
                            }
                        }
                    }

                    // Target Lock Candidate Check
                    const toEnemy = e.position.clone().sub(playerShip.position);
                    const distToEnemy = toEnemy.length();
                    if (distToEnemy > 0) {
                        const dot = toEnemy.clone().normalize().dot(fwdDir);
                        if (distToEnemy < closestDist && dot > 0.99) {
                            closestDist = distToEnemy;
                            closestEnemy = e;
                        }
                    }
                }

                // Handle Hit Flash Animation
                if (e.userData && e.userData.flashTimer > 0) {
                    e.userData.flashTimer--;
                    e.scale.set(1.15, 1.15, 1.15);
                } else {
                    e.scale.set(1.0, 1.0, 1.0);
                }
            });

            // --- 3D TARGET LOCK BOX UPDATER ---
            if (targetBox3D) {
                if (closestEnemy && closestEnemy.userData && closestEnemy.userData.hp > 0 && (cameraMode === 0 || cameraMode === 1)) {
                    targetBox3D.visible = true;
                    targetBox3D.position.copy(closestEnemy.position);
                    
                    // Add a cool constant spinning effect to the wireframe box
                    targetBox3D.rotation.y += 0.04;
                    targetBox3D.rotation.x += 0.02;
                    targetBox3D.rotation.z += 0.01;
                    
                    // Scale based on enemy size roughly
                    const s = 1.2;
                    targetBox3D.scale.set(s, s, s);
                } else {
                    targetBox3D.visible = false;
                }
            }
            
            // Hide the old 2D HTML lock box if it exists
            const lockBox = document.getElementById('target-lock-box');
            if (lockBox) lockBox.style.display = 'none';

            // --- LASER PROJECTILE MOVEMENT & ZERO-ALLOCATION CONTINUOUS SEGMENT COLLISION ---
            for (let i = laserProjectiles.length - 1; i >= 0; i--) {
                const laser = laserProjectiles[i];
                if (!laser || !laser.userData || !laser.userData.active) {
                    if (laser) laser.visible = false;
                    laserProjectiles.splice(i, 1);
                    continue;
                }

                _prevPos.copy(laser.position);

                // Zero-Allocation Aim Assist
                if (closestEnemy && closestEnemy.userData && closestEnemy.userData.hp > 0 && laser.userData.velocity) {
                    _toTarget.subVectors(closestEnemy.position, laser.position).normalize();
                    const speed = laser.userData.velocity.length();
                    _curDir.copy(laser.userData.velocity).normalize();
                    if (_curDir.dot(_toTarget) > 0.4) {
                        _curDir.lerp(_toTarget, 0.12).normalize();
                        laser.userData.velocity.copy(_curDir).multiplyScalar(speed);
                        laser.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), _curDir);
                    }
                }

                if (laser.userData.velocity) {
                    laser.position.add(laser.userData.velocity);
                } else {
                    laser.translateZ(-6);
                }

                _currentPos.copy(laser.position);

                // Zero-Allocation Line-Segment Distance Check
                let hitEnemy = false;
                for (let j = enemyShips.length - 1; j >= 0; j--) {
                    const enemy = enemyShips[j];
                    if (!enemy.userData || enemy.userData.hp <= 0) continue;

                    const segDist = pointToSegmentDistance(enemy.position, _prevPos, _currentPos);
                    if (segDist < 42) {
                        hitEnemy = true;
                        spawnLaserImpactSparks(_currentPos);
                        playLaserImpactAudio();

                        enemy.userData.flashTimer = 5;
                        const pDmgMult = (gameMechanicsConfig.playerDamageMult || 100) / 100;
                        enemy.userData.hp -= (25 * pDmgMult);

                        if (enemy.userData.hp <= 0) {
                            createFieryExplosionFX(enemy.position);
                            scene.remove(enemy);
                            enemyShips.splice(j, 1);

                            playerCredits += 500;
                            const credDisp = document.getElementById('hangar-credits-display');
                            if (credDisp) credDisp.innerText = `${playerCredits.toLocaleString()} SC`;
                            showToast("💥 TARGET DESTROYED! +500 SC AWARDED!");

                            setTimeout(() => {
                                if (enemyShips.length < 8 && playerShip) {
                                    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(playerShip.quaternion);
                                    const newEnemy = createEnemyInterceptorMesh();
                                    newEnemy.position.copy(playerShip.position).add(fwd.clone().multiplyScalar(1500)).add(new THREE.Vector3(
                                        (Math.random() - 0.5) * 800,
                                        (Math.random() - 0.5) * 400,
                                        (Math.random() - 0.5) * 600
                                    ));
                                    scene.add(newEnemy);
                                    enemyShips.push(newEnemy);
                                }
                            }, 4000);
                        }
                        break;
                    }
                }

                if (hitEnemy || laser.position.distanceTo(playerShip.position) > 10500) {
                    laser.visible = false;
                    laser.userData.active = false;
                    laserProjectiles.splice(i, 1);
                }
            }

            // --- ENEMY LASER PROJECTILE MOVEMENT & PLAYER COLLISION ---
            for (let i = enemyLaserProjectiles.length - 1; i >= 0; i--) {
                const laser = enemyLaserProjectiles[i];
                if (!laser || !laser.userData || !laser.userData.active) {
                    if (laser) laser.visible = false;
                    enemyLaserProjectiles.splice(i, 1);
                    continue;
                }

                laser.position.add(laser.userData.velocity);

                let hitPlayer = false;
                const distToPlayer = laser.position.distanceTo(playerShip.position);
                
                if (distToPlayer < 12) {
                    hitPlayer = true;
                    // Flash red screen
                    const flash = document.createElement('div');
                    flash.style.position = 'fixed'; flash.style.top = '0'; flash.style.left = '0'; flash.style.width = '100%'; flash.style.height = '100%'; flash.style.backgroundColor = 'rgba(255,59,92,0.2)'; flash.style.zIndex = '9999'; flash.style.pointerEvents = 'none'; flash.style.transition = 'opacity 0.2s';
                    document.body.appendChild(flash);
                    setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 200); }, 20);

                    // Damage Player
                    let hullDamageTaken = false;
                    const enemyDmgMult = (gameMechanicsConfig.enemyDamageMult || 100) / 100;
                    const damageAmt = 2 * enemyDmgMult;
                    
                    if (shieldPercent > 0) {
                        shieldPercent -= damageAmt;
                        if (playerShieldBubble) {
                            playerShieldBubble.visible = true;
                            playerShieldBubble.userData.flashTimer = 15;
                        }
                        if (shieldPercent < 0) {
                            playerHp = Math.max(0, playerHp + shieldPercent); // Spillover
                            shieldPercent = 0;
                            hullDamageTaken = true;
                        }
                    } else {
                        playerHp = Math.max(0, playerHp - damageAmt);
                        hullDamageTaken = true;
                    }

                    if (hullDamageTaken) {
                        const speedElem = document.getElementById('hud-speed');
                        if (speedElem) {
                            speedElem.innerText = `HULL CRITICAL: ${Math.floor(playerHp)}%`;
                            speedElem.style.color = '#ff3b5c';
                            setTimeout(() => { 
                                if (speedElem && playerHp > 0) speedElem.style.color = '#00f0ff'; 
                            }, 500);
                        }
                        if (playerHp <= 0 && !isFlightLocked) {
                            isFlightLocked = true;
                            showToast("CRITICAL HULL FAILURE - SHIP DESTROYED");
                            createEpicPlayerDeathExplosion(playerShip.position);
                        }
                    }
                }

                // Remove laser if hit or went too far
                if (hitPlayer || laser.position.distanceTo(playerShip.position) > 10500) {
                    laser.visible = false;
                    laser.userData.active = false;
                    enemyLaserProjectiles.splice(i, 1);
                }
            }

            // --- ANIMATE & DECAY EXPLOSION & SPARK PARTICLES (DOUBLED DURATION & EXPANSION) ---
            // HARD CAP: Prevent browser hangs by aggressively culling old particles if the simulation gets overloaded
            while (explosionParticles.length > 800) {
                const oldP = explosionParticles.shift();
                if (oldP && !oldP.userData.isShipDebris) { // Never delete the actual debris meshes early!
                    scene.remove(oldP);
                    if (oldP.geometry) oldP.geometry.dispose();
                    if (oldP.material) oldP.material.dispose();
                } else if (oldP) {
                    explosionParticles.push(oldP); // Put debris back at the end
                    break; // Stop culling if we hit debris
                }
            }

            for (let i = explosionParticles.length - 1; i >= 0; i--) {
                const p = explosionParticles[i];
                if (!p) continue;

                if (p.userData.isShockwave) {
                    if (p.userData.isDeathShockwave) {
                        p.scale.addScalar(0.4);
                        if (p.material) p.material.opacity -= 0.003; // Slower fade for epic explosion
                    } else {
                        p.scale.addScalar(0.25); // Reduced from 0.475 for smaller max radius
                        if (p.material) p.material.opacity -= 0.012; // Increased decay rate to fade out earlier
                    }
                } else if (p.userData.isShipDebris) {
                    // Epic Debris Physics
                    p.position.addScaledVector(p.userData.vel, timeDelta * 60 * 0.08);
                    p.userData.vel.multiplyScalar(0.98); // Drag
                    p.rotation.x += p.userData.rotVel.x * timeDelta * 60;
                    p.rotation.y += p.userData.rotVel.y * timeDelta * 60;
                    p.rotation.z += p.userData.rotVel.z * timeDelta * 60;
                    
                    // Cooling down the superheated metal and shrinking
                    if (p.material && p.material.emissive) {
                        p.material.emissiveIntensity = Math.max(0, p.material.emissiveIntensity - 0.01);
                    }
                    if (p.userData.life < 1.5) {
                        p.scale.multiplyScalar(0.95);
                    }
                    
                    // Random micro-explosions and fiery trails
                    if (Math.random() < 0.005 * p.userData.life) {
                        spawnLaserImpactSparks(p.position);
                    }
                    if (Math.random() < 0.0002 * p.userData.life) {
                        createFieryExplosionFX(p.position); // Secondary explosions!
                    }
                } else if (p.userData.vel) {
                    p.position.addScaledVector(p.userData.vel, timeDelta * 60 * 0.08);
                    p.userData.vel.multiplyScalar(0.99);
                    p.scale.multiplyScalar(0.9925);
                }

                if (p.userData.isDeathParticle) {
                    p.userData.life = (p.userData.life || 1.0) - 0.003;
                } else {
                    p.userData.life = (p.userData.life || 1.0) - 0.007;
                }
                if (p.userData.life <= 0 || (p.material && p.material.opacity <= 0)) {
                    scene.remove(p);
                    explosionParticles.splice(i, 1);
                }
            }

            if (spaceSun) spaceSun.rotation.y += 0.0002;

            // --- UPDATE DYNAMIC TARGET LOCK HUD CARDS TELEMETRY (TOP CENTER ONLY) ---
            const topName = document.getElementById('top-target-name');
            const topDist = document.getElementById('top-target-dist');
            const topBar = document.getElementById('top-target-hp-bar');
            const topHpText = document.getElementById('top-target-hp-text');

            if (closestEnemy) {
                const distKm = (closestDist / 100).toFixed(1);
                const hp = closestEnemy.userData.hp || 100;
                const maxHp = closestEnemy.userData.maxHp || 100;
                const hpPct = Math.max(Math.round((hp / maxHp) * 100), 0);
                const enemyName = closestEnemy.userData.name || "Void Interceptor";

                // Update Top Center Red Glowing Progress Bar Panel
                if (topName) topName.innerText = enemyName.toUpperCase();
                if (topDist) topDist.innerText = `Range: ${distKm} KM`;
                if (topBar) topBar.style.width = `${hpPct}%`;
                if (topHpText) topHpText.innerText = `${hp} / ${maxHp} HP (${hpPct}%)`;
            } else {
                if (topName) topName.innerText = "NO TARGET ACQUIRED";
                if (topDist) topDist.innerText = "Range: -- KM";
                if (topBar) topBar.style.width = "0%";
                if (topHpText) topHpText.innerText = "NO TARGET";
            }

            // Engine Exhaust Particle Trails (Short Crisp Bluish Glow)
            updateEngineParticleTrails();

            // Animate Shield Bubble Flash
            if (playerShieldBubble && playerShieldBubble.visible) {
                playerShieldBubble.userData.flashTimer--;
                if (playerShieldBubble.userData.flashTimer <= 0) {
                    playerShieldBubble.visible = false;
                }
            }

            // Regenerate Shields & Hull (Nanotech)
            if (shieldPercent < 100) {
                const shieldMult = (gameMechanicsConfig.shieldRegenMult || 100) / 100;
                const regenRate = (0.015 + (shipUpgrades.shields.level * 0.01)) * shieldMult;
                shieldPercent = Math.min(100, shieldPercent + regenRate);
            }
            if (playerHp < 100 && playerHp > 0) { // Only regen if not dead
                const hullMult = (gameMechanicsConfig.hullRegenMult || 100) / 100;
                playerHp = Math.min(100, playerHp + (0.02 * hullMult));
            }

            drawTacticalRadar();
            drawShieldGauge();
            drawThrottleGauge();
            if (isTacticalMapOpen) {
                renderTacticalMap3D();
            }
            renderer.render(scene, camera);
        }

        let engineParticles = [];
        const particleGeo = new THREE.SphereGeometry(0.14, 8, 8); // Slightly thicker particle spheres
        const particleMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });

        function updateEngineParticleTrails() {
            if (!playerShip) return;

            // Completely hide and clear engine particles in Cockpit View (cameraMode === 0)
            if (cameraMode === 0) {
                for (let i = engineParticles.length - 1; i >= 0; i--) {
                    const p = engineParticles[i];
                    scene.remove(p);
                    p.geometry.dispose();
                    p.material.dispose();
                }
                engineParticles = [];
                return;
            }

            const nozzleOffsets = [
                new THREE.Vector3(-0.50, 0.05, 2.3),
                new THREE.Vector3( 0.50, 0.05, 2.3),
                new THREE.Vector3(-0.30, 0.55, 2.1),
                new THREE.Vector3( 0.30, 0.55, 2.1)
            ];

            const shipQuat = playerShip.quaternion;
            const backwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(shipQuat);

            // Spawn 3x denser exhaust particle stream per thruster nozzle per frame
            if (currentSpeed > 2) {
                const stepLength = currentSpeed * 0.0064; // Distance moved this frame
                nozzleOffsets.forEach(offset => {
                    const numParticles = 10; // High density to prevent circle gaps
                    for (let d = 0; d < numParticles; d++) {
                        const subJitter = new THREE.Vector3(
                            (Math.random() - 0.5) * 0.08,
                            (Math.random() - 0.5) * 0.08,
                            (Math.random() - 0.5) * 0.08
                        );
                        // Interpolate position backward along the movement vector to eliminate gaps
                        const interpOffset = backwardDir.clone().multiplyScalar(stepLength * (d / numParticles));
                        const worldPos = offset.clone().add(subJitter).applyQuaternion(shipQuat).add(playerShip.position).add(interpOffset);
                        const pMesh = new THREE.Mesh(particleGeo, particleMat.clone());
                        pMesh.position.copy(worldPos);

                        const vel = backwardDir.clone().multiplyScalar(0.24 + currentSpeed * 0.0015).add(
                            new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05)
                        );

                        pMesh.userData = {
                            velocity: vel,
                            age: 0,
                            maxAge: 16 + Math.floor(Math.random() * 8)
                        };

                        scene.add(pMesh);
                        engineParticles.push(pMesh);
                    }
                });
            }

            // Update active particles
            for (let i = engineParticles.length - 1; i >= 0; i--) {
                const p = engineParticles[i];
                p.userData.age++;
                p.position.add(p.userData.velocity);

                const lifeRatio = p.userData.age / p.userData.maxAge;
                p.material.opacity = (1.0 - lifeRatio) * 0.85;
                p.scale.setScalar(1.0 + lifeRatio * 1.1);

                // Dynamic RGB color shift: Electric Cyan (0.0) -> Violet -> Fiery Red/Crimson (1.0)
                const r = lifeRatio * 0.95;
                const g = (1.0 - lifeRatio) * 0.90;
                const b = (1.0 - lifeRatio * 0.70);
                p.material.color.setRGB(r, g, b);

                if (p.userData.age >= p.userData.maxAge) {
                    scene.remove(p);
                    p.geometry.dispose();
                    p.material.dispose();
                    engineParticles.splice(i, 1);
                }
            }
        }

        let shieldPercent = 88;
        let playerHp = 100;

        function drawShieldGauge() {
            const canvas = document.getElementById('shield-gauge-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;

            const textElem = document.getElementById('shield-pct-text');
            if (textElem) {
                textElem.innerText = Math.floor(shieldPercent) + '%';
                // If shield is very low, turn it red, otherwise cyan
                if (shieldPercent < 20) {
                    textElem.style.color = '#ff3b5c';
                    textElem.style.textShadow = '0 0 12px rgba(255, 59, 92, 0.7)';
                } else {
                    textElem.style.color = 'var(--accent-cyan)';
                    textElem.style.textShadow = '0 0 12px rgba(0,240,255,0.7)';
                }
            }

            ctx.clearRect(0, 0, w, h);

            const startAngle = -Math.PI * 0.82;
            const endAngle = Math.PI * 0.82;
            const totalAngle = endAngle - startAngle;

            // Track Outer Ring
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
            ctx.lineWidth = 9;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(cx, cy, cx - 14, startAngle, endAngle);
            ctx.stroke();

            // Active Shield Value Arc
            const fillAngle = startAngle + (shieldPercent / 100) * totalAngle;
            ctx.strokeStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 12;
            ctx.lineWidth = 9;
            ctx.beginPath();
            ctx.arc(cx, cy, cx - 14, startAngle, fillAngle);
            ctx.stroke();

            // Inner Track Ring (Hull)
            ctx.strokeStyle = 'rgba(255, 60, 92, 0.2)';
            ctx.shadowBlur = 0;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, cx - 28, startAngle, endAngle);
            ctx.stroke();

            // Inner Hull Value Arc (Red)
            const hullFillAngle = startAngle + (playerHp / 100) * totalAngle;
            ctx.strokeStyle = '#ff3b5c';
            ctx.shadowColor = '#ff3b5c';
            ctx.shadowBlur = 8;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, cx - 28, startAngle, hullFillAngle);
            ctx.stroke();

            ctx.shadowBlur = 0;
        }

        function drawThrottleGauge() {
            const canvas = document.getElementById('throttle-gauge-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;

            ctx.clearRect(0, 0, w, h);

            const throttleRatio = Math.min(Math.max(currentSpeed / 400, 0), 1);
            const throttlePct = Math.round(throttleRatio * 100);

            const pctText = document.getElementById('throttle-pct-text');
            if (pctText) pctText.innerText = `${throttlePct}%`;

            const statusTag = document.getElementById('throttle-status-tag');
            if (statusTag) {
                statusTag.innerText = throttleRatio > 0.85 ? 'MAX THRUST' : (throttleRatio < 0.05 ? 'IDLE' : 'STABLE');
                statusTag.style.color = throttleRatio > 0.85 ? '#ef4444' : '#f59e0b';
            }

            const speedSubtext = document.getElementById('throttle-speed-subtext');
            if (speedSubtext) {
                const postedSpeed = Math.round(currentSpeed * 250);
                speedSubtext.innerText = `${postedSpeed.toLocaleString()} km/h`;
            }

            const startAngle = -Math.PI * 0.82;
            const endAngle = Math.PI * 0.82;
            const totalAngle = endAngle - startAngle;

            // Track Outer Ring (Dark Golden Amber)
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.18)';
            ctx.lineWidth = 9;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(cx, cy, cx - 14, startAngle, endAngle);
            ctx.stroke();

            // Active Throttle Arc (Glowing Amber / Fiery Orange)
            const fillAngle = startAngle + throttleRatio * totalAngle;
            const strokeColor = throttleRatio > 0.85 ? '#ef4444' : '#f59e0b';
            ctx.strokeStyle = strokeColor;
            ctx.shadowColor = strokeColor;
            ctx.shadowBlur = 14;
            ctx.lineWidth = 9;
            ctx.beginPath();
            ctx.arc(cx, cy, cx - 14, startAngle, fillAngle);
            ctx.stroke();

            // Inner Output Efficiency Arc (Bright Gold)
            ctx.strokeStyle = 'rgba(254, 240, 138, 0.2)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, cx - 28, startAngle, endAngle);
            ctx.stroke();

            const innerFill = startAngle + (0.1 + throttleRatio * 0.88) * totalAngle;
            ctx.strokeStyle = '#fef08a';
            ctx.shadowColor = '#fef08a';
            ctx.shadowBlur = 8;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, cx - 28, startAngle, innerFill);
            ctx.stroke();

            ctx.shadowBlur = 0;
        }

        function drawTacticalRadar() {
            const canvas = document.getElementById('radar-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;

            ctx.clearRect(0, 0, w, h);

            // Radar Concentric Grid Rings (30° FOV Inner, 60° FOV Middle, 90° Outer Horizon)
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, cx * 0.33, 0, Math.PI * 2); // 30° cone
            ctx.arc(cx, cy, cx * 0.66, 0, Math.PI * 2); // 60° cone
            ctx.arc(cx, cy, cx * 0.92, 0, Math.PI * 2); // 90° horizon perimeter
            ctx.stroke();

            // Radar Center Crosshair (Boresight) Lines
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy - 4);
            ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 14);
            ctx.moveTo(cx - 14, cy); ctx.lineTo(cx - 4, cy);
            ctx.moveTo(cx + 4, cy); ctx.lineTo(cx + 14, cy);
            ctx.stroke();

            // Center Boresight Dot / Reticle
            ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
            ctx.beginPath();
            ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
            ctx.fill();

            if (!playerShip) return;

            // Full 3D Orientation: Transform any world target directly to cockpit local space
            const invShipQuat = playerShip.quaternion.clone().invert();

            function drawBlip(objPos, color, size, isSquare, label = '') {
                if (!objPos) return;

                // Relative position in player cockpit local space
                // rel.x: +Right / -Left
                // rel.y: +Up / -Down
                // rel.z: -In Front / +Behind
                const rel = objPos.clone().sub(playerShip.position).applyQuaternion(invShipQuat);
                const dist = rel.length();
                if (dist < 1) return;

                const isBehind = rel.z > 0;
                
                // Normalized direction in player's field of view
                const nx = rel.x / dist;
                const ny = rel.y / dist;

                let rx, ry;
                if (!isBehind) {
                    // In Front: Center of radar (cx, cy) is dead ahead
                    // Anything right in front of the nose (nx=0, ny=0) is dead center in the middle!
                    const fovOffset = Math.hypot(nx, ny); // 0 at center, 1 at 90°
                    const radarRadius = fovOffset * (cx * 0.88);
                    const angle = Math.atan2(-ny, nx); // Canvas Y is inverted relative to 3D Y
                    rx = cx + Math.cos(angle) * radarRadius;
                    ry = cy + Math.sin(angle) * radarRadius;
                } else {
                    // Behind: Place on outer compass perimeter in direction to turn
                    const angle = Math.atan2(-ny, nx);
                    rx = cx + Math.cos(angle) * (cx * 0.92);
                    ry = cy + Math.sin(angle) * (cy * 0.92);
                }

                ctx.save();
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = isBehind ? 2 : 8;

                if (isBehind) {
                    // Hollow / Ring indicator for targets behind you
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(rx, ry, size * 0.75, 0, Math.PI * 2);
                    ctx.stroke();
                } else if (isSquare) {
                    ctx.fillRect(rx - size/2, ry - size/2, size, size);
                } else {
                    ctx.beginPath();
                    ctx.arc(rx, ry, size, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            }

            // Draw Radiant Solar Star Blip (Golden)
            if (spaceSun && spaceSun.position) {
                drawBlip(spaceSun.position, '#fbbf24', 6, false, 'SUN');
            }

            // Draw Space Planet Blip (Cyan)
            if (spacePlanet && spacePlanet.position) {
                drawBlip(spacePlanet.position, '#00f0ff', 7, false, 'PLANET');
            }

            // Draw Ancient Wormhole Gate Blip (Purple Ring)
            if (wormholeGate && wormholeGate.position) {
                drawBlip(wormholeGate.position, '#8b5cf6', 5, false, 'GATE');
            }

            // Draw Purple Square Blip for Capital Dreadnought
            if (capitalShip && capitalShip.position) {
                drawBlip(capitalShip.position, '#a855f7', 7, true, 'DREADNOUGHT');
            }

            // Draw Red Blips for Active Living Enemy Ships
            enemyShips.forEach(enemy => {
                if (enemy && enemy.position && enemy.userData && enemy.userData.hp > 0) {
                    drawBlip(enemy.position, '#ff3b5c', 4.5, false, 'ENEMY');
                }
            });
        }

        // --- PILOT PROFILE & 3D SHIP UPGRADE HANGAR RENDERER & LOGIC ---
        function initUpgradeHangar3D() {
            const container = document.getElementById('hangar-canvas-container');
            const canvas = document.getElementById('upgrade-ship-canvas');
            if (!container || !canvas) return;

            upgradeHangarScene = new THREE.Scene();
            upgradeHangarScene.background = new THREE.Color(0x060914);

            upgradeHangarCamera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
            upgradeHangarCamera.position.copy(hangarCamTargetPos);
            upgradeHangarCamera.lookAt(hangarCamLookAtPos);

            upgradeHangarRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
            upgradeHangarRenderer.setSize(container.clientWidth, container.clientHeight);
            upgradeHangarRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            // Warm Industrial Hangar Spotlighting & Rim Light
            const amb = new THREE.AmbientLight(0x94a3b8, 3.5);
            upgradeHangarScene.add(amb);

            const spot = new THREE.SpotLight(0xfffaed, 5);
            spot.position.set(6, 14, 10);
            spot.angle = Math.PI / 4;
            upgradeHangarScene.add(spot);

            const rim = new THREE.DirectionalLight(0x00f0ff, 3);
            rim.position.set(-8, -4, -6);
            upgradeHangarScene.add(rim);

            // 3D Holographic Hangar Floor Grid & Energy Ring
            const grid = new THREE.GridHelper(30, 30, 0x00f0ff, 0x1e293b);
            grid.position.y = -2.2;
            upgradeHangarScene.add(grid);

            const padGeo = new THREE.RingGeometry(7.5, 7.8, 64);
            padGeo.rotateX(Math.PI / 2);
            const padMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
            const padRing = new THREE.Mesh(padGeo, padMat);
            padRing.position.y = -2.18;
            upgradeHangarScene.add(padRing);

            // Build Hangar Ship Group & Clone Void Interceptor
            upgradeHangarShip = new THREE.Group();
            if (playerShip) {
                const clonedShip = playerShip.clone(true);
                clonedShip.visible = true;
                clonedShip.position.set(0, 0, 0);
                clonedShip.rotation.set(0, 0, 0);
                upgradeHangarShip.add(clonedShip);
            }
            upgradeHangarScene.add(upgradeHangarShip);

            // Holographic Deflector Shield Mesh
            const shGeo = new THREE.SphereGeometry(4.2, 32, 32);
            const shMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.0, wireframe: true });
            hangarShieldMesh = new THREE.Mesh(shGeo, shMat);
            upgradeHangarShip.add(hangarShieldMesh);

            // Click & Drag to Orbit/Rotate 3D Ship Listeners
            container.addEventListener('mousedown', (e) => {
                isHangarDragging = true;
                previousHangarMousePosition = { x: e.clientX, y: e.clientY };
            });

            window.addEventListener('mousemove', (e) => {
                if (!isHangarDragging || !upgradeHangarShip) return;
                const deltaX = e.clientX - previousHangarMousePosition.x;
                const deltaY = e.clientY - previousHangarMousePosition.y;

                hangarTargetRotationY += deltaX * 0.008;
                hangarTargetRotationX += deltaY * 0.008;

                previousHangarMousePosition = { x: e.clientX, y: e.clientY };
            });

            window.addEventListener('mouseup', () => { isHangarDragging = false; });
        }

        function renderUpgradeHangar3D() {
            if (!upgradeHangarRenderer || !upgradeHangarShip) return;

            // Smooth rotation lerp
            upgradeHangarShip.rotation.y += (hangarTargetRotationY - upgradeHangarShip.rotation.y) * 0.12;
            upgradeHangarShip.rotation.x += (hangarTargetRotationX - upgradeHangarShip.rotation.x) * 0.12;

            // Slow idle spin when not dragging
            if (!isHangarDragging) {
                hangarTargetRotationY += 0.003;
            }

            upgradeHangarCamera.position.lerp(hangarCamTargetPos, 0.1);
            upgradeHangarCamera.lookAt(hangarCamLookAtPos);

            upgradeHangarRenderer.render(upgradeHangarScene, upgradeHangarCamera);
        }

        function togglePauseUpgradeModal() {
            isGamePaused = !isGamePaused;
            const modal = document.getElementById('ship-upgrade-modal');

            if (isGamePaused) {
                if (modal) modal.style.display = 'flex';
                if (!upgradeHangarRenderer) {
                    initUpgradeHangar3D();
                } else if (playerShip && upgradeHangarShip) {
                    upgradeHangarShip.clear();
                    const clonedShip = playerShip.clone(true);
                    clonedShip.visible = true;
                    upgradeHangarShip.add(clonedShip);
                }
                showToast("⏸️ GAME PAUSED — PILOT PROFILE & SHIP UPGRADE HANGAR");
            } else {
                if (modal) modal.style.display = 'none';
                showToast("▶️ GAME RESUMED — SPACEFLIGHT ACTIVE");
            }
        }

        function buyShipUpgrade(modKey, cost) {
            const mod = shipUpgrades[modKey];
            if (!mod) return;

            if (playerCredits < cost) {
                showToast("❌ INSUFFICIENT CREDITS! Complete missions to earn Star Credits.");
                return;
            }

            if (mod.level >= mod.maxLevel) {
                showToast("⚠️ MODULE ALREADY AT MAXIMUM LEVEL!");
                return;
            }

            playerCredits -= cost;
            mod.level++;
            mod.cost = Math.round(mod.cost * 1.5);

            // Update Credits UI
            const credDisp = document.getElementById('hangar-credits-display');
            if (credDisp) credDisp.innerText = `${playerCredits.toLocaleString()} SC`;

            const lbl = document.getElementById(`lbl-mod-${modKey}`);
            if (lbl) {
                lbl.innerText = mod.level >= mod.maxLevel ? `Level ${mod.level} / 5 [MAXED]` : `Level ${mod.level} / 5`;
                if (mod.level >= mod.maxLevel) lbl.style.color = 'var(--accent-gold)';
            }

            const btn = document.getElementById(`btn-mod-${modKey}`);
            if (btn) {
                if (mod.level >= mod.maxLevel) {
                    btn.innerText = 'MAX LEVEL';
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                } else {
                    btn.innerText = `Upgrade (${mod.cost.toLocaleString()} SC)`;
                }
            }

            // Visual shield pulse if shield upgraded
            if (modKey === 'shields' && hangarShieldMesh) {
                hangarShieldMesh.material.opacity = 0.6;
                setTimeout(() => { hangarShieldMesh.material.opacity = 0.0; }, 1200);
            }

            showToast(`✨ UPGRADED ${mod.name.toUpperCase()} TO LEVEL ${mod.level}!`);
        }

        // --- HIGH-ENERGY PLASMA STATIC & ROCKET JET AUDIO SYNTHESIZER ---
        let audioCtx = null;
        let engineMasterGain = null;
        let engineLowPassFilter = null;
        let hullResonanceFilter = null;
        let engineSubOsc = null;
        let engineDetuneOsc = null;
        let engineMidOsc = null;
        let engineTurbineOsc = null;
        let engineTurbineFilter = null;
        let engineTurbineGain = null;
        let engineWhineOsc = null;
        let engineWhineGain = null;
        let bgMusicGain = null;
        let engineNoiseNode = null;
        let engineNoiseGain = null;
        let engineStaticNode = null;
        let engineStaticGain = null;
        let engineLfoOsc = null;
        let engineLfoGain = null;
        let isAudioInitialized = false;
        let isAudioMuted = false;

        let elevenLabsBuffers = {};

        function loadElevenLabsSFX() {
            if (!audioCtx) return;
            const sounds = {
                fire: 'data/sfx/laser_fire.mp3',
                explosion: 'data/sfx/ship_explosion.mp3',
                hit: 'data/sfx/laser_hit.mp3'
            };

            for (const [key, url] of Object.entries(sounds)) {
                fetch(url)
                    .then(res => res.arrayBuffer())
                    .then(buf => audioCtx.decodeAudioData(buf))
                    .then(decoded => {
                        elevenLabsBuffers[key] = decoded;
                    })
                    .catch(e => console.warn('ElevenLabs SFX fallback:', key, e));
            }
        }

        let isMusicLoaded = false;
        function initBackgroundMusic() {
            if (!audioCtx || isMusicLoaded) return;
            isMusicLoaded = true;
            
            fetch('data/sfx/space_theme_120s.mp3')
                .then(res => res.arrayBuffer())
                .then(buf => audioCtx.decodeAudioData(buf))
                .then(decoded => {
                    bgMusicGain = audioCtx.createGain();
                    bgMusicGain.gain.setValueAtTime(isAudioMuted ? 0 : gameVolumeConfig.master * gameVolumeConfig.music, audioCtx.currentTime);
                    bgMusicGain.connect(audioCtx.destination);
                    
                    const src = audioCtx.createBufferSource();
                    src.buffer = decoded;
                    src.loop = true;
                    src.connect(bgMusicGain);
                    src.start(0);
                })
                .catch(e => {
                    isMusicLoaded = false;
                    console.warn('Could not load space theme music:', e);
                });
        }

        function initEngineAudio() {
            if (!audioCtx) {
                try {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    audioCtx = new AudioContextClass({ sampleRate: 44100 });
                } catch (e) {
                    try {
                        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    } catch (err) {
                        console.error("Web Audio Engine Init Error:", err);
                        return;
                    }
                }
            }

            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            loadElevenLabsSFX();
            initBackgroundMusic();

            if (isAudioInitialized) return;

            try {
                const now = audioCtx.currentTime;

                // 1. Master Output Gain
                engineMasterGain = audioCtx.createGain();
                engineMasterGain.gain.setValueAtTime(isAudioMuted ? 0 : 0.70, now);

                // 2. Cockpit Muffling Filter (180 Hz -> 1,200 Hz)
                engineLowPassFilter = audioCtx.createBiquadFilter();
                engineLowPassFilter.type = 'lowpass';
                engineLowPassFilter.frequency.setValueAtTime(280, now);
                engineLowPassFilter.Q.setValueAtTime(1.2, now);

                // 3. Smooth Hull Vibration Filter
                hullResonanceFilter = audioCtx.createBiquadFilter();
                hullResonanceFilter.type = 'peaking';
                hullResonanceFilter.frequency.setValueAtTime(95, now);
                hullResonanceFilter.Q.setValueAtTime(2.0, now);
                hullResonanceFilter.gain.setValueAtTime(2.0, now);

                // --- LAYER 1: Minimal Background Sub-Bass Weight (Sine @ 40 Hz — Tamed to remove hum) ---
                engineSubOsc = audioCtx.createOscillator();
                engineSubOsc.type = 'sine';
                engineSubOsc.frequency.setValueAtTime(40, now);

                const subGain = audioCtx.createGain();
                subGain.gain.setValueAtTime(0.04, now); // Minimal hum
                engineSubOsc.connect(subGain);
                subGain.connect(hullResonanceFilter);

                // --- LAYER 2: Minimal Detuned Secondary (Sine @ 42 Hz) ---
                engineDetuneOsc = audioCtx.createOscillator();
                engineDetuneOsc.type = 'sine';
                engineDetuneOsc.frequency.setValueAtTime(42, now);

                const detuneGain = audioCtx.createGain();
                detuneGain.gain.setValueAtTime(0.02, now);
                engineDetuneOsc.connect(detuneGain);
                detuneGain.connect(hullResonanceFilter);

                // --- LAYER 3: Tamed Mid Drive Tone (Triangle @ 85 Hz) ---
                engineMidOsc = audioCtx.createOscillator();
                engineMidOsc.type = 'triangle';
                engineMidOsc.frequency.setValueAtTime(85, now);

                const midGain = audioCtx.createGain();
                midGain.gain.setValueAtTime(0.02, now);
                engineMidOsc.connect(midGain);
                midGain.connect(hullResonanceFilter);

                // --- LAYER 4: Turbine Whine (Tamed) ---
                engineTurbineOsc = audioCtx.createOscillator();
                engineTurbineOsc.type = 'sawtooth';
                engineTurbineOsc.frequency.setValueAtTime(180, now);

                engineTurbineFilter = audioCtx.createBiquadFilter();
                engineTurbineFilter.type = 'bandpass';
                engineTurbineFilter.frequency.setValueAtTime(260, now);
                engineTurbineFilter.Q.setValueAtTime(2.0, now);

                engineTurbineGain = audioCtx.createGain();
                engineTurbineGain.gain.setValueAtTime(0.01, now);

                engineTurbineOsc.connect(engineTurbineFilter);
                engineTurbineFilter.connect(engineTurbineGain);
                engineTurbineGain.connect(hullResonanceFilter);

                // --- LAYER 5: Ion Whine (Tamed) ---
                engineWhineOsc = audioCtx.createOscillator();
                engineWhineOsc.type = 'sine';
                engineWhineOsc.frequency.setValueAtTime(280, now);

                engineWhineGain = audioCtx.createGain();
                engineWhineGain.gain.setValueAtTime(0.01, now);

                engineWhineOsc.connect(engineWhineGain);
                engineWhineGain.connect(hullResonanceFilter);

                // --- LAYER 6: Organic Heavy Gas Exhaust Rumble (Boosted for thick jet roar) ---
                const bufferSize = audioCtx.sampleRate * 4;
                const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const output = noiseBuffer.getChannelData(0);
                let lastOut = 0.0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    output[i] = (lastOut + (0.02 * white)) / 1.02;
                    lastOut = output[i];
                    output[i] *= 3.5;
                }

                engineNoiseNode = audioCtx.createBufferSource();
                engineNoiseNode.buffer = noiseBuffer;
                engineNoiseNode.loop = true;

                engineNoiseGain = audioCtx.createGain();
                engineNoiseGain.gain.setValueAtTime(0.20, now); // Reduced noise level
                engineNoiseNode.connect(engineNoiseGain);
                engineNoiseGain.connect(hullResonanceFilter);

                // --- LAYER 7: CRISP PLASMA EXHAUST STATIC & JET CRACKLE ---
                const staticBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const staticOut = staticBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    staticOut[i] = (Math.random() * 2 - 1) * 0.30;
                }

                engineStaticNode = audioCtx.createBufferSource();
                engineStaticNode.buffer = staticBuffer;
                engineStaticNode.loop = true;

                const staticHighPass = audioCtx.createBiquadFilter();
                staticHighPass.type = 'highpass';
                staticHighPass.frequency.setValueAtTime(1400, now);

                engineStaticGain = audioCtx.createGain();
                engineStaticGain.gain.setValueAtTime(0.15, now);

                engineStaticNode.connect(staticHighPass);
                staticHighPass.connect(engineStaticGain);
                engineStaticGain.connect(hullResonanceFilter);

                // --- LAYER 8: Stereo Panner Width ---
                let pannerNode = null;
                if (audioCtx.createStereoPanner) {
                    pannerNode = audioCtx.createStereoPanner();
                    pannerNode.pan.setValueAtTime(0, now);
                }

                // Connect Signal Chain
                hullResonanceFilter.connect(engineLowPassFilter);
                if (pannerNode) {
                    engineLowPassFilter.connect(pannerNode);
                    pannerNode.connect(engineMasterGain);
                } else {
                    engineLowPassFilter.connect(engineMasterGain);
                }
                engineMasterGain.connect(audioCtx.destination);

                // Start All Sound Layer Generators (100% Constant Smooth Rocket Thrust)
                engineSubOsc.start();
                engineDetuneOsc.start();
                engineMidOsc.start();
                engineTurbineOsc.start();
                engineWhineOsc.start();
                engineNoiseNode.start();
                engineStaticNode.start();

                // Power-On Sub Drop Chime
                const chimeOsc = audioCtx.createOscillator();
                const chimeGain = audioCtx.createGain();
                chimeOsc.type = 'sine';
                chimeOsc.frequency.setValueAtTime(450, now);
                chimeOsc.frequency.exponentialRampToValueAtTime(180, now + 0.4);
                chimeGain.gain.setValueAtTime(0.4, now);
                chimeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                chimeOsc.connect(chimeGain);
                chimeGain.connect(audioCtx.destination);
                chimeOsc.start();
                chimeOsc.stop(now + 0.4);

                isAudioInitialized = true;
                const btn = document.getElementById('btn-audio-toggle');
                if (btn) {
                    btn.innerText = '🔊 COCKPIT AUDIO: ACTIVE';
                    btn.style.borderColor = '#00f0ff';
                    btn.style.color = '#00f0ff';
                }
                showToast("🔊 HIGH-ENERGY PLASMA STATIC AUDIO ACTIVE!");
            } catch (e) {
                console.error("Web Audio Engine Setup Error:", e);
            }
        }

        function updateEngineAudio(throttleRatio, isCockpitView) {
            if (!isAudioInitialized || !audioCtx || isAudioMuted) return;
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const t = Math.min(Math.max(throttleRatio, 0), 1);
            const now = audioCtx.currentTime;

            // 1. Tamed Low-Frequency Sub (36 Hz -> 68 Hz)
            const subFreq = 36 + t * 32;
            const detuneFreq = 38 + t * 34;
            const midFreq = 85 + t * 65;

            engineSubOsc.frequency.setTargetAtTime(subFreq, now, 0.08);
            engineDetuneOsc.frequency.setTargetAtTime(detuneFreq, now, 0.08);
            engineMidOsc.frequency.setTargetAtTime(midFreq, now, 0.08);

            // 2. Tamed Turbine & Whine (180 Hz -> 320 Hz & 280 Hz -> 480 Hz)
            if (engineTurbineOsc && engineTurbineFilter && engineTurbineGain) {
                const turbinePitch = 180 + t * 140;
                const turbineCutoff = 260 + t * 200;
                const turbineGainVal = 0.01 + t * 0.02; // Tamed to 0.03 max

                engineTurbineOsc.frequency.setTargetAtTime(turbinePitch, now, 0.08);
                engineTurbineFilter.frequency.setTargetAtTime(turbineCutoff, now, 0.08);
                engineTurbineGain.gain.setTargetAtTime(turbineGainVal, now, 0.08);
            }

            if (engineWhineOsc && engineWhineGain) {
                const whinePitch = 280 + t * 200;
                const whineGainVal = 0.01 + t * 0.02; // Tamed to 0.03 max
                engineWhineOsc.frequency.setTargetAtTime(whinePitch, now, 0.08);
                engineWhineGain.gain.setTargetAtTime(whineGainVal, now, 0.08);
            }

            // 3. Heavy Brownian Exhaust Noise (0.20 Idle -> 0.425 Full Thrust — 50% noise reduction)
            if (engineNoiseGain) {
                const noiseTarget = 0.20 + t * 0.225;
                engineNoiseGain.gain.setTargetAtTime(noiseTarget, now, 0.08);
            }

            // 4. Crisp High-Frequency Plasma Static Crackle (0.15 Idle -> 0.475 Full Thrust — 50% noise reduction)
            if (engineStaticGain) {
                const staticTarget = 0.15 + t * 0.325;
                engineStaticGain.gain.setTargetAtTime(staticTarget, now, 0.08);
            }

            // 5. Cockpit Muffling Filter (320 Hz -> 1,600 Hz for maximum static sizzle pass-through)
            const cutoffBase = isCockpitView ? 320 : 650;
            const cutoffMax = isCockpitView ? 1600 : 3500;
            const targetCutoff = cutoffBase + t * (cutoffMax - cutoffBase);

            engineLowPassFilter.frequency.setTargetAtTime(targetCutoff, now, 0.1);

            // 6. Master Volume Scaling (0.02 = 2% Idle -> 0.40 = 40% Full Throttle)
            const targetGain = 0.02 + t * 0.38;
            engineMasterGain.gain.setTargetAtTime(targetGain, now, 0.1);
        }

        function toggleEngineAudioMute() {
            if (!isAudioInitialized) {
                initEngineAudio();
                return;
            }
            isAudioMuted = !isAudioMuted;
            if (engineMasterGain && audioCtx) {
                engineMasterGain.gain.setValueAtTime(isAudioMuted ? 0 : 0.32, audioCtx.currentTime);
            }
            showToast(isAudioMuted ? "🔇 COCKPIT ENGINE AUDIO MUTED" : "🔊 COCKPIT ENGINE AUDIO ACTIVE");
        }

        // --- 3D TACTICAL SYSTEM STAR MAP RENDERER & INTERACTIVITY ---
        let isTacticalMapOpen = false;
        let mapScene, mapCamera, mapRenderer, mapGroup, mapGridGroup;
        let mapPlayerMesh, mapSunMesh, mapPlanetMesh, mapGateMesh, mapDreadMesh, mapEnemyGroup;
        let mapRaycaster = new THREE.Raycaster();
        let mapMouse = new THREE.Vector2();
        let mapHoveredObject = null;
        let isMapDragging = false;
        let previousMapMousePosition = { x: 0, y: 0 };
        let mapTargetRotationY = 0;
        let mapTargetRotationX = 0.55;
        let mapCamDistance = 120;
        let mapTargetCamDistance = 120;

        function initTacticalMap3D() {
            const container = document.getElementById('map-canvas-container');
            const canvas = document.getElementById('tactical-map-canvas');
            remoteLog(`initTacticalMap3D starting. Container: ${!!container}, Canvas: ${!!canvas}`);
            if (!container || !canvas) return;

            const w = (container.clientWidth && container.clientWidth > 50) ? container.clientWidth : Math.max(window.innerWidth - 120, 600);
            const h = (container.clientHeight && container.clientHeight > 50) ? container.clientHeight : Math.max(window.innerHeight - 180, 450);
            remoteLog(`initTacticalMap3D canvas dims: w=${w}, h=${h}`);
            const aspect = w / h;

            mapScene = new THREE.Scene();
            mapScene.background = new THREE.Color(0x040817);

            mapCamera = new THREE.PerspectiveCamera(50, aspect, 0.1, 15000);
            mapCamera.position.set(0, 0, mapCamDistance);
            mapCamera.lookAt(0, 0, 0);

            mapRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
            mapRenderer.setSize(w, h);
            mapRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            const amb = new THREE.AmbientLight(0xffffff, 2.8);
            mapScene.add(amb);

            mapGroup = new THREE.Group();
            mapGroup.rotation.x = mapTargetRotationX;
            mapGroup.rotation.y = mapTargetRotationY;
            mapScene.add(mapGroup);

            // Holographic System Grid & Range Rings (Single Plane)
            mapGridGroup = new THREE.Group();
            
            function createSinglePlaneGrid(size, divisions, colorHex) {
                const grid = new THREE.GridHelper(size, divisions, colorHex, colorHex);
                grid.material.transparent = true;
                grid.material.opacity = 0.02; // 2% opacity for a very faint HUD look
                grid.material.depthWrite = false;
                grid.material.blending = THREE.AdditiveBlending;
                grid.position.y = -10; // Shifted below objects slightly
                return grid;
            }

            // Outer system grid
            const gridLarge = createSinglePlaneGrid(8000, 40, 0xffffff);
            mapGridGroup.add(gridLarge);

            // Inner detailed grid
            const gridSmall = createSinglePlaneGrid(400, 10, 0xffffff);
            mapGridGroup.add(gridSmall);

            [25, 50, 75, 100].forEach(r => {
                const ringGeo = new THREE.RingGeometry(r - 0.3, r, 64);
                ringGeo.rotateX(Math.PI / 2);
                const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.position.y = -9.8;
                mapGridGroup.add(ring);
            });
            
            mapGroup.add(mapGridGroup);

            // Populate 3D Map Objects (Scaled to fit tactical system map viewport)
            // 1. Player Ship (Cyan Fighter Icon)
            const playerIconGeo = new THREE.ConeGeometry(1.4, 3.5, 8);
            playerIconGeo.rotateX(-Math.PI / 2);
            const playerIconMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
            mapPlayerMesh = new THREE.Mesh(playerIconGeo, playerIconMat);
            mapPlayerMesh.userData = { label: "Void Interceptor (Player)" };
            mapPlayerMesh.position.set(0, 0, 0);
            mapGroup.add(mapPlayerMesh);

            // Pulsing Position Beacon Ring
            const pRingGeo = new THREE.RingGeometry(2.5, 2.9, 32);
            pRingGeo.rotateX(Math.PI / 2);
            const pRingMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
            const pRing = new THREE.Mesh(pRingGeo, pRingMat);
            mapPlayerMesh.add(pRing);

            // 2. Gas Giant Planet & Ice Rings
            const planetIconGeo = new THREE.SphereGeometry(36, 32, 32); // 9000 * 0.004
            const planetIconMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
            mapPlanetMesh = new THREE.Mesh(planetIconGeo, planetIconMat);
            mapPlanetMesh.userData = { label: "Vanguard Gas Giant" };
            mapPlanetMesh.position.set(-34, -12, -56);
            mapGroup.add(mapPlanetMesh);

            const ringIconGeo = new THREE.RingGeometry(38, 96, 32); // matching new 9500 to 24000 radius * 0.004
            ringIconGeo.rotateX(Math.PI / 2.3);
            ringIconGeo.rotateY(-Math.PI / 8);
            const ringIconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
            const mapRing = new THREE.Mesh(ringIconGeo, ringIconMat);
            mapPlanetMesh.add(mapRing);

            // 3. Sol Primary Star
            const sunIconGeo = new THREE.SphereGeometry(120, 32, 32); // 30000 * 0.004
            const sunIconMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
            mapSunMesh = new THREE.Mesh(sunIconGeo, sunIconMat);
            mapSunMesh.userData = { label: "Sol Primary Star" };
            mapSunMesh.position.set(3000, 1600, 2000); // 750000, 400000, 500000 * 0.004
            mapGroup.add(mapSunMesh);

            // 4. Ancient Wormhole Gate
            const gateIconGeo = new THREE.TorusGeometry(3.5, 0.8, 16, 32);
            const gateIconMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });
            mapGateMesh = new THREE.Mesh(gateIconGeo, gateIconMat);
            mapGateMesh.userData = { label: "Ancient Wormhole Gate" };
            mapGateMesh.position.set(-0.6, 0.1, -1.4);
            mapGroup.add(mapGateMesh);

            // 5. Royal Capital Dreadnought Flagship
            const dreadIconGeo = new THREE.BoxGeometry(8.5, 3.8, 18);
            const dreadIconMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
            mapDreadMesh = new THREE.Mesh(dreadIconGeo, dreadIconMat);
            mapDreadMesh.userData = { label: "Royal Dreadnought Flagship" };
            mapDreadMesh.position.set(-34, -12, -56);
            mapGroup.add(mapDreadMesh);

            // 6. Enemy Interceptors Swarm Group
            mapEnemyGroup = new THREE.Group();
            mapGroup.add(mapEnemyGroup);

            // Click & Drag to Orbit/Rotate 3D Star Map (EXACTLY MATCHING PILOT PROFILE)
            container.addEventListener('mousedown', (e) => {
                isMapDragging = true;
                previousMapMousePosition = { x: e.clientX, y: e.clientY };
                remoteLog(`Map mousedown: dragging started at (${e.clientX}, ${e.clientY})`);
            });

            container.addEventListener('touchstart', (e) => {
                if (e.touches[0]) {
                    isMapDragging = true;
                    previousMapMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    remoteLog(`Map touchstart: dragging started at (${e.touches[0].clientX}, ${e.touches[0].clientY})`);
                }
            }, { passive: true });

            window.addEventListener('mousemove', (e) => {
                if (!mapGroup || !isTacticalMapOpen) return;
                
                // Track mouse for raycasting hover tooltip
                const rect = container.getBoundingClientRect();
                mapMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                mapMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                
                if (isMapDragging) {
                    const deltaX = e.clientX - previousMapMousePosition.x;
                    const deltaY = e.clientY - previousMapMousePosition.y;

                    mapTargetRotationY += deltaX * 0.008;
                    mapTargetRotationX += deltaY * 0.008;

                    if (!window._lastDragLog || Date.now() - window._lastDragLog > 400) {
                        window._lastDragLog = Date.now();
                        remoteLog(`Map dragging: dX=${deltaX}, dY=${deltaY}, targetRotY=${mapTargetRotationY.toFixed(3)}, targetRotX=${mapTargetRotationX.toFixed(3)}`);
                    }

                    previousMapMousePosition = { x: e.clientX, y: e.clientY };
                }
            });

            window.addEventListener('touchmove', (e) => {
                if (!isMapDragging || !mapGroup || !isTacticalMapOpen || !e.touches[0]) return;
                const deltaX = e.touches[0].clientX - previousMapMousePosition.x;
                const deltaY = e.touches[0].clientY - previousMapMousePosition.y;

                mapTargetRotationY += deltaX * 0.008;
                mapTargetRotationX += deltaY * 0.008;

                previousMapMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }, { passive: true });

            window.addEventListener('mouseup', () => {
                if (isMapDragging) remoteLog("Map mouseup: dragging stopped");
                isMapDragging = false;
            });
            window.addEventListener('touchend', () => {
                if (isMapDragging) remoteLog("Map touchend: dragging stopped");
                isMapDragging = false;
            });

            window.addEventListener('wheel', (e) => {
                if (isTacticalMapOpen) {
                    mapTargetCamDistance += e.deltaY * 0.15;
                    mapTargetCamDistance = Math.min(Math.max(mapTargetCamDistance, 20), 5000);
                }
            }, { passive: true });
        }

        function resizeTacticalMapCanvas() {
            const container = document.getElementById('map-canvas-container');
            if (container && mapRenderer && mapCamera) {
                const w = container.clientWidth > 50 ? container.clientWidth : Math.max(window.innerWidth - 120, 600);
                const h = container.clientHeight > 50 ? container.clientHeight : Math.max(window.innerHeight - 180, 450);
                mapCamera.aspect = w / h;
                mapCamera.updateProjectionMatrix();
                mapRenderer.setSize(w, h);
                mapRenderer.render(mapScene, mapCamera);
            }
        }

        function renderTacticalMap3D() {
            if (!mapRenderer || !mapScene || !mapCamera || !mapGroup) return;

            // Semi-Realtime Tracking: Continuously sync 3D map icon positions to actual spaceflight world coordinates
            const scaleFactor = 0.004;
            if (playerShip && mapPlayerMesh) {
                // The player is now the center of the tactical map (0, 0, 0)
                mapPlayerMesh.position.set(0, 0, 0);
                mapPlayerMesh.quaternion.copy(playerShip.quaternion);
                
                if (mapGridGroup) {
                    mapGridGroup.position.copy(mapPlayerMesh.position);
                    mapGridGroup.quaternion.copy(playerShip.quaternion);
                }
            }
            
            // Helper function to position map objects relative to the player
            const setRelativeMapPos = (mapObj, worldObj) => {
                if (worldObj && mapObj && playerShip) {
                    mapObj.position.set(
                        (worldObj.position.x - playerShip.position.x) * scaleFactor,
                        (worldObj.position.y - playerShip.position.y) * scaleFactor,
                        (worldObj.position.z - playerShip.position.z) * scaleFactor
                    );
                }
            };

            setRelativeMapPos(mapPlanetMesh, spacePlanet);
            setRelativeMapPos(mapSunMesh, spaceSun);
            setRelativeMapPos(mapGateMesh, wormholeGate);
            
            if (capitalShip && mapDreadMesh) {
                setRelativeMapPos(mapDreadMesh, capitalShip);
                mapDreadMesh.quaternion.copy(capitalShip.quaternion);
            }
            
            if (mapEnemyGroup && playerShip) {
                // Keep tactical map enemy markers in 100% sync with active living enemyShips
                const activeEnemies = enemyShips.filter(e => e && e.userData && e.userData.hp > 0);
                while (mapEnemyGroup.children.length < activeEnemies.length) {
                    const enemyIconGeo = new THREE.TetrahedronGeometry(1.2);
                    const enemyIconMat = new THREE.MeshBasicMaterial({ color: 0xff3b5c });
                    const mapEnemy = new THREE.Mesh(enemyIconGeo, enemyIconMat);
                    mapEnemy.userData = { label: "Enemy Interceptor" };
                    mapEnemyGroup.add(mapEnemy);
                }
                while (mapEnemyGroup.children.length > activeEnemies.length) {
                    const child = mapEnemyGroup.children[mapEnemyGroup.children.length - 1];
                    mapEnemyGroup.remove(child);
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                }
                for (let i = 0; i < activeEnemies.length; i++) {
                    const es = activeEnemies[i];
                    const me = mapEnemyGroup.children[i];
                    if (es && me) {
                        setRelativeMapPos(me, es);
                        me.quaternion.copy(es.quaternion);
                    }
                }
            }

            // Smooth rotation lerp (EXACTLY matching Pilot Profile)
            mapGroup.rotation.y += (mapTargetRotationY - mapGroup.rotation.y) * 0.12;
            mapGroup.rotation.x += (mapTargetRotationX - mapGroup.rotation.x) * 0.12;
            mapCamDistance += (mapTargetCamDistance - mapCamDistance) * 0.12;

            mapCamera.position.set(0, 0, mapCamDistance);
            mapCamera.lookAt(0, 0, 0);

            // Map hover tooltip raycasting
            if (mapRaycaster && mapMouse) {
                mapRaycaster.setFromCamera(mapMouse, mapCamera);
                
                const interactables = [];
                if (mapPlayerMesh) interactables.push(mapPlayerMesh);
                if (mapPlanetMesh) interactables.push(mapPlanetMesh);
                if (mapSunMesh) interactables.push(mapSunMesh);
                if (mapGateMesh) interactables.push(mapGateMesh);
                if (mapDreadMesh) interactables.push(mapDreadMesh);
                if (mapEnemyGroup) interactables.push(...mapEnemyGroup.children);
                
                const intersects = mapRaycaster.intersectObjects(interactables, false);
                const tooltip = document.getElementById('map-tooltip');
                const container = document.getElementById('map-canvas-container');
                
                if (intersects.length > 0 && tooltip && container) {
                    const obj = intersects[0].object;
                    if (obj.userData && obj.userData.label) {
                        tooltip.style.display = 'block';
                        tooltip.innerText = obj.userData.label;
                        
                        const rect = container.getBoundingClientRect();
                        const x = (mapMouse.x + 1) / 2 * rect.width;
                        const y = -(mapMouse.y - 1) / 2 * rect.height;
                        
                        tooltip.style.left = (x + 15) + 'px';
                        tooltip.style.top = (y + 15) + 'px';
                        
                        if (mapHoveredObject !== obj) {
                            container.style.cursor = 'crosshair';
                            mapHoveredObject = obj;
                        }
                    }
                } else {
                    if (tooltip) tooltip.style.display = 'none';
                    if (mapHoveredObject && container) {
                        container.style.cursor = 'default';
                        mapHoveredObject = null;
                    }
                }
            }

            if (!window._lastRenderLog || Date.now() - window._lastRenderLog > 2500) {
                window._lastRenderLog = Date.now();
                remoteLog(`renderTacticalMap3D: camDist=${mapCamDistance.toFixed(1)}, rotY=${mapGroup.rotation.y.toFixed(3)}, rotX=${mapGroup.rotation.x.toFixed(3)}`);
            }

            mapRenderer.render(mapScene, mapCamera);
        }

        // --- GAME & AUDIO OPTIONS SYSTEM ENGINE ---
        let isOptionsOpen = false;
        let activeRebindAction = null;

        let gameVolumeConfig = {
            master: 0.70,
            engine: 0.80,
            firing: 0.85,
            music: 0.60
        };

        let gameMechanicsConfig = {
            rollSpeed: 125,
            cameraLag: 80,
            throttleAccel: 125,
            shieldRegenMult: 100,
            hullRegenMult: 100,
            enemyDamageMult: 100,
            playerDamageMult: 100
        };

        function openOptionsModal() {
            isOptionsOpen = true;
            const modal = document.getElementById('options-modal');
            if (modal) modal.style.display = 'flex';
            showToast("🔧 GAME OPTIONS & AUDIO CONTROLS OPEN");
        }

        function closeOptionsModal() {
            isOptionsOpen = false;
            const modal = document.getElementById('options-modal');
            if (modal) modal.style.display = 'none';
            showToast("✅ OPTIONS CLOSED - RETURNED TO HANGAR");
        }

        function updateGameSettings() {
            const rollVal = parseInt(document.getElementById('slider-set-roll').value);
            const camVal = parseInt(document.getElementById('slider-set-cam').value);
            const throttleVal = parseInt(document.getElementById('slider-set-throttle').value);
            const shieldRegenVal = parseInt(document.getElementById('slider-set-shield-regen').value);
            const hullRegenVal = parseInt(document.getElementById('slider-set-hull-regen').value);
            const enemyDmgVal = parseInt(document.getElementById('slider-set-enemy-dmg').value);
            const playerDmgVal = parseInt(document.getElementById('slider-set-player-dmg').value);

            document.getElementById('lbl-set-roll').innerText = rollVal + '%';
            document.getElementById('lbl-set-cam').innerText = camVal + '%';
            document.getElementById('lbl-set-throttle').innerText = throttleVal + '%';
            document.getElementById('lbl-set-shield-regen').innerText = shieldRegenVal + '%';
            document.getElementById('lbl-set-hull-regen').innerText = hullRegenVal + '%';
            document.getElementById('lbl-set-enemy-dmg').innerText = enemyDmgVal + '%';
            document.getElementById('lbl-set-player-dmg').innerText = playerDmgVal + '%';

            gameMechanicsConfig.rollSpeed = rollVal;
            gameMechanicsConfig.cameraLag = camVal;
            gameMechanicsConfig.throttleAccel = throttleVal;
            gameMechanicsConfig.shieldRegenMult = shieldRegenVal;
            gameMechanicsConfig.hullRegenMult = hullRegenVal;
            gameMechanicsConfig.enemyDamageMult = enemyDmgVal;
            gameMechanicsConfig.playerDamageMult = playerDmgVal;

            if (currentProfile) {
                if (!currentProfile.settings) currentProfile.settings = {};
                currentProfile.settings.rollSpeed = rollVal;
                currentProfile.settings.cameraLag = camVal;
                currentProfile.settings.throttleAccel = throttleVal;
                currentProfile.settings.shieldRegenMult = shieldRegenVal;
                currentProfile.settings.hullRegenMult = hullRegenVal;
                currentProfile.settings.enemyDamageMult = enemyDmgVal;
                currentProfile.settings.playerDamageMult = playerDmgVal;
                saveProfileToServerSilent();
            }
        }

        function updateAudioVolumes() {
            const masterVal = parseInt(document.getElementById('slider-vol-master').value);
            const engineVal = parseInt(document.getElementById('slider-vol-engine').value);
            const firingVal = parseInt(document.getElementById('slider-vol-firing').value);
            const musicVal = parseInt(document.getElementById('slider-vol-music').value || "60");

            document.getElementById('lbl-vol-master').innerText = masterVal + "%";
            document.getElementById('lbl-vol-engine').innerText = engineVal + "%";
            document.getElementById('lbl-vol-firing').innerText = firingVal + "%";
            const lblMusic = document.getElementById('lbl-vol-music');
            if (lblMusic) lblMusic.innerText = musicVal + "%";

            gameVolumeConfig.master = masterVal / 100;
            gameVolumeConfig.engine = engineVal / 100;
            gameVolumeConfig.firing = firingVal / 100;
            gameVolumeConfig.music = musicVal / 100;

            if (engineMasterGain && audioCtx) {
                engineMasterGain.gain.setValueAtTime(isAudioMuted ? 0 : gameVolumeConfig.master * gameVolumeConfig.engine * 0.40, audioCtx.currentTime);
            }
            
            if (bgMusicGain && audioCtx) {
                bgMusicGain.gain.setValueAtTime(isAudioMuted ? 0 : gameVolumeConfig.master * gameVolumeConfig.music, audioCtx.currentTime);
            }

            // Save settings permanently
            if (currentProfile) {
                if (!currentProfile.settings) currentProfile.settings = {};
                currentProfile.settings.masterVol = masterVal;
                currentProfile.settings.engineVol = engineVal;
                currentProfile.settings.firingVol = firingVal;
                currentProfile.settings.musicVol = musicVal;
                saveProfileToServerSilent();
            }
        }

        function startRebindingKey(action) {
            activeRebindAction = action;
            const kbdEl = document.getElementById('key-' + action);
            if (kbdEl) {
                kbdEl.innerText = "Press key...";
                kbdEl.style.background = "rgba(245,158,11,0.4)";
                kbdEl.style.borderColor = "#f59e0b";
                kbdEl.style.color = "#fff";
            }
            showToast(`⌨️ PRESS ANY KEY TO REBIND ${action}...`);

            const captureHandler = (e) => {
                e.preventDefault();
                const newCode = e.code;
                const newChar = e.key.toUpperCase() === " " ? "SPACE" : e.key.toUpperCase();
                
                if (kbdEl) {
                    kbdEl.innerText = newChar;
                    kbdEl.style.background = "rgba(0, 240, 255, 0.15)";
                    kbdEl.style.borderColor = "rgba(0, 240, 255, 0.4)";
                    kbdEl.style.color = "#00f0ff";
                }
                keyBindings[action] = newCode;
                if (currentProfile) {
                    currentProfile.keyBindings = keyBindings;
                    saveProfileToServerSilent();
                }
                showToast(`✅ BOUND ${action} TO [ ${newChar} ]`);
                activeRebindAction = null;
                window.removeEventListener('keydown', captureHandler);
            };

            window.addEventListener('keydown', captureHandler, { once: true });
        }

        function resetDefaultKeymaps() {
            const defaults = {
                KeyW: "W", KeyS: "S", KeyA: "A", KeyD: "D",
                Space: "Space / Mouse 1", KeyM: "M", KeyL: "L", KeyC: "C", Escape: "ESC"
            };
            keyBindings = { KeyW: 'KeyW', KeyS: 'KeyS', KeyA: 'KeyA', KeyD: 'KeyD', Space: 'Space', KeyM: 'KeyM', KeyL: 'KeyL', KeyC: 'KeyC', Escape: 'Escape' };
            for (const [key, label] of Object.entries(defaults)) {
                const el = document.getElementById('key-' + key);
                if (el) el.innerText = label;
            }
            if (currentProfile) {
                currentProfile.keyBindings = keyBindings;
                saveProfileToServerSilent();
            }
            showToast("🔄 KEYBINDINGS RESET TO DEFAULT FLIGHT CONTROLS");
        }

        function toggleTacticalMapModal() {
            isTacticalMapOpen = !isTacticalMapOpen;
            const modal = document.getElementById('tactical-map-modal');
            remoteLog(`toggleTacticalMapModal called. isTacticalMapOpen=${isTacticalMapOpen}`);

            if (isTacticalMapOpen) {
                normalizedMouse.x = 0;
                normalizedMouse.y = 0;
                if (document.pointerLockElement) {
                    try { document.exitPointerLock(); } catch(err) {}
                }
                isFlightLocked = false;
                if (modal) modal.style.display = 'flex';
                if (!mapRenderer) {
                    initTacticalMap3D();
                }
                resizeTacticalMapCanvas();
                requestAnimationFrame(() => {
                    resizeTacticalMapCanvas();
                    renderTacticalMap3D();
                });
                showToast("🌐 3D TACTICAL MAP OPEN — DRAG MOUSE TO ROTATE");
            } else {
                if (modal) modal.style.display = 'none';
                showToast("▶️ RESUMED FULL FLIGHT VIEW");
            }
        }

        function focusMapObject(targetType) {
            if (!mapGroup) return;
            showToast(`📡 MAP TARGETING: ${targetType.toUpperCase()}`);
            if (targetType === 'player') {
                mapTargetCamDistance = 45;
                mapTargetRotationX = 0.55;
                mapTargetRotationY = 0;
            } else if (targetType === 'sun') {
                mapTargetCamDistance = 85;
                mapTargetRotationX = 0.35;
                mapTargetRotationY = -0.95;
            } else if (targetType === 'planet') {
                mapTargetCamDistance = 65;
                mapTargetRotationX = 0.50;
                mapTargetRotationY = 0.75;
            } else if (targetType === 'wormhole') {
                mapTargetCamDistance = 35;
                mapTargetRotationX = 0.55;
                mapTargetRotationY = 0.10;
            } else if (targetType === 'dreadnought') {
                mapTargetCamDistance = 55;
                mapTargetRotationX = 0.50;
                mapTargetRotationY = 0.75;
            } else if (targetType === 'enemies') {
                mapTargetCamDistance = 45;
                mapTargetRotationX = 0.60;
                mapTargetRotationY = 0;
            }
        }

        function resetMapTransform() {
            mapTargetRotationY = 0;
            mapTargetRotationX = 0.55;
            mapTargetCamDistance = 120;
            showToast("🎯 3D MAP RE-CENTERED ON PLAYER SHIP");
        }

        function onWindowResize() {
            const container = document.getElementById('canvas-container');
            if (!container || !renderer) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }

        // Initialize on load & auto-start engine audio at initial 50% thrust speed
        window.addEventListener('load', async () => {
            renderTitles();
            await loadProfileFromServer('pilot_1');
            init3DSimulator();

            // Auto-start engine audio immediately on load at 50% initial thrust
            initEngineAudio();
            if (audioCtx) updateEngineAudio(currentSpeed / maxSpeedCap, cameraMode === 0);

            // Transparently unlock AudioContext on any user interaction (mousemove, keydown, click)
            ['keydown', 'mousedown', 'mousemove', 'touchstart'].forEach(evt => {
                window.addEventListener(evt, () => {
                    if (!isAudioInitialized) initEngineAudio();
                    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                });
            });
        });
    