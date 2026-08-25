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
            turnSpeed: 50,
            cameraLag: 80,
            throttleAccel: 125,
            toastDuration: 5,
            shieldRegenMult: 100,
            hullRegenMult: 100,
            enemyDamageMult: 100,
            playerDamageMult: 100,
            flashOnHit: false
        };

        function openOptionsModal() {
            isOptionsOpen = true;
            const modal = document.getElementById('options-modal');
            if (modal) modal.style.display = 'flex';
            
            // Sync slider inputs to current active config
            try {
                const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
                const setText = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };

                setEl('slider-vol-master', Math.round(gameVolumeConfig.master * 100));
                setText('lbl-vol-master', Math.round(gameVolumeConfig.master * 100) + '%');
                setEl('slider-vol-engine', Math.round(gameVolumeConfig.engine * 100));
                setText('lbl-vol-engine', Math.round(gameVolumeConfig.engine * 100) + '%');
                setEl('slider-vol-firing', Math.round(gameVolumeConfig.firing * 100));
                setText('lbl-vol-firing', Math.round(gameVolumeConfig.firing * 100) + '%');
                setEl('slider-vol-music', Math.round(gameVolumeConfig.music * 100));
                setText('lbl-vol-music', Math.round(gameVolumeConfig.music * 100) + '%');

                setEl('slider-set-roll', gameMechanicsConfig.rollSpeed);
                setText('lbl-set-roll', gameMechanicsConfig.rollSpeed + '%');
                setEl('slider-set-turn', gameMechanicsConfig.turnSpeed);
                setText('lbl-set-turn', gameMechanicsConfig.turnSpeed + '%');
                setEl('slider-set-cam', gameMechanicsConfig.cameraLag);
                setText('lbl-set-cam', gameMechanicsConfig.cameraLag + '%');
                setEl('slider-set-throttle', gameMechanicsConfig.throttleAccel);
                setText('lbl-set-throttle', gameMechanicsConfig.throttleAccel + '%');
                setEl('slider-set-toast', gameMechanicsConfig.toastDuration !== undefined ? gameMechanicsConfig.toastDuration : 5);
                setText('lbl-set-toast', (gameMechanicsConfig.toastDuration !== undefined ? gameMechanicsConfig.toastDuration : 5) + 's');
                setEl('slider-set-shield-regen', gameMechanicsConfig.shieldRegenMult);
                setText('lbl-set-shield-regen', gameMechanicsConfig.shieldRegenMult + '%');
                setEl('slider-set-hull-regen', gameMechanicsConfig.hullRegenMult);
                setText('lbl-set-hull-regen', gameMechanicsConfig.hullRegenMult + '%');
                setEl('slider-set-enemy-dmg', gameMechanicsConfig.enemyDamageMult);
                setText('lbl-set-enemy-dmg', gameMechanicsConfig.enemyDamageMult + '%');
                setEl('slider-set-player-dmg', gameMechanicsConfig.playerDamageMult);
                setText('lbl-set-player-dmg', gameMechanicsConfig.playerDamageMult + '%');
                
                const chk = document.getElementById('chk-flash-on-hit');
                if (chk) chk.checked = !!gameMechanicsConfig.flashOnHit;

                if (gameMechanicsConfig.platform) {
                    const platSel = document.getElementById('select-platform');
                    if (platSel) platSel.value = gameMechanicsConfig.platform;
                }

            } catch(e) {
                console.warn("Error syncing options modal fields:", e);
            }

            showToast("🔧 GAME OPTIONS & AUDIO CONTROLS OPEN");
        }

        
        function changePlatform() {
            const val = document.getElementById('select-platform').value;
            if (currentProfile) {
                if (!currentProfile.settings) currentProfile.settings = {};
                currentProfile.settings.platform = val;
                saveProfileToServerSilent();
                if (confirm("Changing platform optimizations requires a page reload to rebuild the WebGL context.\n\nReload now?")) {
                    location.reload();
                }
            }
        }

        function closeOptionsModal() {
            isOptionsOpen = false;
            const modal = document.getElementById('options-modal');
            if (modal) modal.style.display = 'none';
            showToast("✅ OPTIONS CLOSED - RETURNED TO HANGAR");
        }

        function updateGameSettings() {
            try {
                const getVal = (id, fallback) => {
                    const el = document.getElementById(id);
                    return el ? parseInt(el.value) || fallback : fallback;
                };
                const setLbl = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.innerText = val + '%';
                };

                const rollVal = getVal('slider-set-roll', 125);
                const turnVal = getVal('slider-set-turn', 50);
                const camVal = getVal('slider-set-cam', 80);
                const throttleVal = getVal('slider-set-throttle', 125);
                const toastVal = getVal('slider-set-toast', 5);
                const shieldRegenVal = getVal('slider-set-shield-regen', 100);
                const hullRegenVal = getVal('slider-set-hull-regen', 100);
                const enemyDmgVal = getVal('slider-set-enemy-dmg', 100);
                const playerDmgVal = getVal('slider-set-player-dmg', 100);
                const chk = document.getElementById('chk-flash-on-hit');
                const flashOnHitVal = chk ? chk.checked : false;

                setLbl('lbl-set-roll', rollVal);
                setLbl('lbl-set-turn', turnVal);
                setLbl('lbl-set-cam', camVal);
                setLbl('lbl-set-throttle', throttleVal);
                
                const toastLbl = document.getElementById('lbl-set-toast');
                if (toastLbl) toastLbl.innerText = toastVal + 's';

                setLbl('lbl-set-shield-regen', shieldRegenVal);
                setLbl('lbl-set-hull-regen', hullRegenVal);
                setLbl('lbl-set-enemy-dmg', enemyDmgVal);
                setLbl('lbl-set-player-dmg', playerDmgVal);

                gameMechanicsConfig.rollSpeed = rollVal;
                gameMechanicsConfig.turnSpeed = turnVal;
                gameMechanicsConfig.cameraLag = camVal;
                gameMechanicsConfig.throttleAccel = throttleVal;
                gameMechanicsConfig.toastDuration = toastVal;
                gameMechanicsConfig.shieldRegenMult = shieldRegenVal;
                gameMechanicsConfig.hullRegenMult = hullRegenVal;
                gameMechanicsConfig.enemyDamageMult = enemyDmgVal;
                gameMechanicsConfig.playerDamageMult = playerDmgVal;
                gameMechanicsConfig.flashOnHit = flashOnHitVal;

                if (currentProfile) {
                    if (!currentProfile.settings) currentProfile.settings = {};
                    currentProfile.settings.rollSpeed = rollVal;
                    currentProfile.settings.turnSpeed = turnVal;
                    currentProfile.settings.cameraLag = camVal;
                    currentProfile.settings.throttleAccel = throttleVal;
                    currentProfile.settings.toastDuration = toastVal;
                    currentProfile.settings.shieldRegenMult = shieldRegenVal;
                    currentProfile.settings.hullRegenMult = hullRegenVal;
                    currentProfile.settings.enemyDamageMult = enemyDmgVal;
                    currentProfile.settings.playerDamageMult = playerDmgVal;
                    currentProfile.settings.flashOnHit = flashOnHitVal;
                    saveProfileToServerSilent();
                }
            } catch(err) {
                console.warn("Error updating game settings:", err);
            }
        }

        function updateAudioVolumes() {
            try {
                const masterEl = document.getElementById('slider-vol-master');
                const engineEl = document.getElementById('slider-vol-engine');
                const firingEl = document.getElementById('slider-vol-firing');
                const musicEl = document.getElementById('slider-vol-music');

                const masterVal = masterEl ? parseInt(masterEl.value) : 70;
                const engineVal = engineEl ? parseInt(engineEl.value) : 80;
                const firingVal = firingEl ? parseInt(firingEl.value) : 85;
                const musicVal = musicEl ? parseInt(musicEl.value) : 60;

                const lblMaster = document.getElementById('lbl-vol-master');
                const lblEngine = document.getElementById('lbl-vol-engine');
                const lblFiring = document.getElementById('lbl-vol-firing');
                const lblMusic = document.getElementById('lbl-vol-music');

                if (lblMaster) lblMaster.innerText = masterVal + "%";
                if (lblEngine) lblEngine.innerText = engineVal + "%";
                if (lblFiring) lblFiring.innerText = firingVal + "%";
                if (lblMusic) lblMusic.innerText = musicVal + "%";

                gameVolumeConfig.master = (isNaN(masterVal) ? 70 : masterVal) / 100;
                gameVolumeConfig.engine = (isNaN(engineVal) ? 80 : engineVal) / 100;
                gameVolumeConfig.firing = (isNaN(firingVal) ? 85 : firingVal) / 100;
                gameVolumeConfig.music = (isNaN(musicVal) ? 60 : musicVal) / 100;

                if (engineMasterGain && audioCtx && audioCtx.state === 'running') {
                    if (typeof currentSpeed !== 'undefined' && typeof maxSpeedCap !== 'undefined' && maxSpeedCap > 0 && typeof cameraMode !== 'undefined') {
                        updateEngineAudio(currentSpeed / maxSpeedCap, cameraMode === 0);
                    } else {
                        const volMult = gameVolumeConfig.master * gameVolumeConfig.engine;
                        engineMasterGain.gain.setValueAtTime(isAudioMuted ? 0 : 0.40 * volMult, audioCtx.currentTime);
                    }
                }
                
                if (bgMusicGain && audioCtx && audioCtx.state === 'running') {
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
            } catch(err) {
                console.warn("Error updating audio volumes:", err);
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
                let newChar = e.key.toUpperCase() === " " ? "SPACE" : e.key.toUpperCase();
                if (newCode === 'ArrowUp') newChar = '▲ UP';
                else if (newCode === 'ArrowDown') newChar = '▼ DOWN';
                else if (newCode === 'ArrowLeft') newChar = '◄ LEFT';
                else if (newCode === 'ArrowRight') newChar = '► RIGHT';
                
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
                PitchUp: "▲ UP", PitchDown: "▼ DOWN", YawLeft: "◄ LEFT", YawRight: "► RIGHT",
                Space: "Space / Mouse 1", KeyM: "M", KeyL: "L", KeyC: "C", Escape: "ESC"
            };
            keyBindings = { 
                KeyW: 'KeyW', KeyS: 'KeyS', KeyA: 'KeyA', KeyD: 'KeyD', 
                PitchUp: 'ArrowUp', PitchDown: 'ArrowDown', YawLeft: 'ArrowLeft', YawRight: 'ArrowRight',
                Space: 'Space', KeyM: 'KeyM', KeyL: 'KeyL', KeyC: 'KeyC', Escape: 'Escape' 
            };
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
            } else if (targetType === 'planet' || targetType === 'saturn') {
                mapTargetCamDistance = 65;
                mapTargetRotationX = 0.50;
                mapTargetRotationY = 0.75;
            } else if (targetType === 'titan') {
                mapTargetCamDistance = 160;
                mapTargetRotationX = 0.35;
                mapTargetRotationY = 1.05;
            } else if (targetType === 'crest' || targetType === 'station') {
                mapTargetCamDistance = 45;
                mapTargetRotationX = 0.50;
                mapTargetRotationY = 0.0;
            } else if (targetType === 'wormhole' || targetType === 'gate') {
                mapTargetCamDistance = 45;
                mapTargetRotationX = 0.55;
                mapTargetRotationY = 0.10;
            } else if (targetType === 'excavation' || targetType === 'bombardment') {
                mapTargetCamDistance = 140;
                mapTargetRotationX = 0.35;
                mapTargetRotationY = 1.05;
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

        function resizeHangarViewport() {
            if (upgradeHangarCamera && upgradeHangarRenderer) {
                const container = document.getElementById('hangar-canvas-container');
                if (container && container.clientWidth > 0 && container.clientHeight > 0) {
                    const w = container.clientWidth;
                    const h = container.clientHeight;
                    upgradeHangarCamera.aspect = w / h;
                    upgradeHangarCamera.updateProjectionMatrix();
                    upgradeHangarRenderer.setSize(w, h);
                    if (isGamePaused) {
                        renderUpgradeHangar3D();
                    }
                }
            }
        }

        function onWindowResize() {
            const container = document.getElementById('canvas-container');
            if (container && renderer && camera) {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            }
            resizeHangarViewport();
        }

        // Initialize on load & auto-start engine audio at initial 50% thrust speed
        window.addEventListener('load', async () => {
            renderTitles();
            await loadProfileFromServer('pilot_1');
            init3DSimulator();

            // Auto-start engine audio immediately on load at 50% initial thrust
            initEngineAudio();
            if (audioCtx) updateEngineAudio(currentSpeed / maxSpeedCap, cameraMode === 0);

            // Auto-start Mission 1 instead of Free Roam / Mission 3
            startMission1();

            let hasEnteredFullscreen = false;
            let userExitedFullscreen = false;
            
            document.addEventListener('fullscreenchange', () => {
                if (!document.fullscreenElement && hasEnteredFullscreen) {
                    userExitedFullscreen = true;
                }
            });

            // Transparently unlock AudioContext and auto-fullscreen on first user interaction
            ['click', 'keydown', 'mousedown', 'touchstart', 'touchend'].forEach(evt => {
                window.addEventListener(evt, (e) => {
                    if (e && e.type === 'keydown' && e.code === 'Escape') return;
                    
                    if (!isAudioInitialized) initEngineAudio();
                    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                    
                    if (!hasEnteredFullscreen && !userExitedFullscreen && !document.fullscreenElement) {
                        try {
                            let promise;
                            if (document.documentElement.requestFullscreen) {
                                promise = document.documentElement.requestFullscreen();
                            } else if (document.documentElement.webkitRequestFullscreen) { // Safari/Mac support
                                promise = document.documentElement.webkitRequestFullscreen();
                            }
                            
                            if (promise && promise.catch) {
                                promise.then(() => { hasEnteredFullscreen = true; }).catch(err => console.log("Auto-fullscreen prevented by browser: " + err));
                            } else {
                                hasEnteredFullscreen = true;
                            }
                        } catch (e) {
                            console.log("Auto-fullscreen prevented by browser.");
                        }
                    }
                });
            });
            
            // Mousemove only unlocks audio, doesn't trigger fullscreen
            window.addEventListener('mousemove', () => {
                if (!isAudioInitialized) initEngineAudio();
                if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            });
        });

        // Hangar Modal Resizer Logic
        window.addEventListener('DOMContentLoaded', () => {
            const resizer = document.getElementById('hangar-resizer');
            const grid = document.querySelector('.modal-body-grid');
            let isResizing = false;

            if (resizer && grid) {
                resizer.addEventListener('mousedown', (e) => {
                    isResizing = true;
                    document.body.style.cursor = 'col-resize';
                    document.body.style.userSelect = 'none'; // Prevent text selection
                });

                window.addEventListener('mousemove', (e) => {
                    if (!isResizing) return;
                    
                    const gridRect = grid.getBoundingClientRect();
                    // Calculate percentage width of the left pane
                    let newWidth = ((e.clientX - gridRect.left) / gridRect.width) * 100;
                    
                    // Clamp between 20% and 80%
                    if (newWidth < 20) newWidth = 20;
                    if (newWidth > 80) newWidth = 80;
                    
                    grid.style.gridTemplateColumns = `${newWidth}fr 10px ${100 - newWidth}fr`;
                    
                    // Trigger dynamic resize on the 3D ship view window immediately
                    resizeHangarViewport();
                });

                window.addEventListener('mouseup', () => {
                    if (isResizing) {
                        isResizing = false;
                        document.body.style.cursor = '';
                        document.body.style.userSelect = '';
                        resizeHangarViewport();
                    }
                });
            }
        });
    
        let genericCommsTimeout = null;
        function showCommsTransmission(speaker, text, duration) {
            const overlay = document.getElementById('cinematic-comms-overlay');
            const commsBox = document.getElementById('cinematic-comms-box');
            const commsSpeaker = document.getElementById('comms-speaker');
            const commsSubspeaker = document.getElementById('comms-subspeaker');
            const commsSubtitle = document.getElementById('comms-subtitle');
            const commsBadge = document.getElementById('comms-step-badge');
            const commsIcon = document.getElementById('comms-avatar-icon');

            if (overlay) overlay.style.display = 'block';
            if (commsBox) commsBox.className = 'cinematic-comms-box ' + (speaker.includes("ELIAS") ? "speaker-elias" : "speaker-kaylen");
            if (commsSpeaker) commsSpeaker.innerText = speaker;
            if (commsSubspeaker) commsSubspeaker.innerText = "TACTICAL COMMS";
            if (commsSubtitle) commsSubtitle.innerText = `"${text}"`;
            if (commsBadge) commsBadge.innerText = "TRANSMISSION";
            if (commsIcon) commsIcon.innerText = "📻";

            if (genericCommsTimeout) clearTimeout(genericCommsTimeout);
            genericCommsTimeout = setTimeout(() => {
                if (overlay) overlay.style.display = 'none';
            }, duration || 5000);
        }

        // ==========================================
        // MISSION 1: ROUTINE PATROL
        // ==========================================
        let mission1Rings = [];
        let mission1Enemies = [];
        let mission1EnemiesDestroyed = 0;
        let mission1Active = false;
        let mission1Stage = 0;

        function startMission1() {
            if (mission1Active) return;
            mission1Active = true;
            mission1Stage = 0;
            
            // Cleanup old rings if any
            if (typeof mission1Rings !== 'undefined') {
                mission1Rings.forEach(r => {
                    if (typeof scene !== 'undefined' && scene) scene.remove(r);
                });
            }
            mission1Rings = [];

            // Start at the same spot as Mission 3 / Free Roam
            playerShip.position.set(75200, 350, -25000);
            playerShip.rotation.set(0, 0, 0);
            playerShip.quaternion.set(0, 0, 0, 1);
            playerShip.lookAt(new THREE.Vector3(75200, -600, -43500));
            playerShip.rotateY(Math.PI); // 180-degree rotation
            targetSpeed = 675;
            currentSpeed = 675;
            
            // Snap camera instantly to player
            if (camera) {
                const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(playerShip.quaternion);
                camera.up.copy(localUp);
                const initCamOffset = new THREE.Vector3(0, 6.0, 22.0).applyQuaternion(playerShip.quaternion);
                camera.position.copy(playerShip.position).add(initCamOffset);
                const targetLookAt = playerShip.position.clone().add(new THREE.Vector3(0, 0, -50).applyQuaternion(playerShip.quaternion));
                camera.lookAt(targetLookAt);
                camera.updateMatrixWorld();
            }
            
            // Create 3 holographic rings on the opposite side of Saturn
            // Saturn radius is 9000
            const ringPos = [
                {x: 60000, y: 214, z: -81280}, // Left of Saturn
                {x: 72060, y: 214, z: -95000}, // Behind Saturn
                {x: 84000, y: 214, z: -81280}  // Right of Saturn
            ];
            
            const ringGeo = new THREE.TorusGeometry(800, 20, 16, 100);
            
            mission1Enemies = [];
            ringPos.forEach((pos, i) => {
                const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.position.set(pos.x, pos.y, pos.z);
                // Aim them so they make a path. 
                if (i === 0) ring.lookAt(72060, 214, -81280); 
                else if (i === 1) ring.rotation.y = 0; // facing front/back
                else if (i === 2) ring.lookAt(72060, 214, -81280); 
                
                ring.userData = { cleared: false };
                scene.add(ring);
                mission1Rings.push(ring);
                
                // Spawn 2 enemy ships visibly adjacent to each ring
                const offsets = [
                    { x: -500, y: 150, z: 200 },
                    { x: 500, y: -150, z: 200 }
                ];
                
                for (let e = 0; e < 2; e++) {
                    const enemy = createEnemyInterceptorMesh();
                    enemy.position.set(pos.x + offsets[e].x, pos.y + offsets[e].y, pos.z + offsets[e].z);
                    enemy.lookAt(playerShip.position);
                    enemy.userData.hp = 100;
                    enemy.userData.maxHp = 100;
                    scene.add(enemy);
                    enemyShips.push(enemy);
                    mission1Enemies.push(enemy);
                }
            });
            
            showCommsTransmission("ELIAS VANCE", "Alright, kid. Let's see if those stabilizer tweaks I made hold up. Fly around Saturn, clear those 3 training rings, and shoot down 3 target drones I set up near the rings.", 9000);
            
            const sec = document.getElementById('hud-sector');
            const obj = document.getElementById('hud-objective');
            if (sec) sec.innerText = "MISSION 1: ROUTINE PATROL";
            if (obj) obj.innerText = "Fly around Saturn, clear 3 training rings, and destroy 3 drones (0/3 Rings, 0/3 Enemies).";
            showToast("🎯 NEW OBJECTIVE: Clear Saturn Training Rings");
            
            // (Collision check is now safely handled in the high-framerate animate() loop to prevent skipping)
        }
        
        function checkMission1Progress() {
            if (!mission1Active) return;
            
            // Only skip checking rings/enemies if we're past stage 3
            if (mission1Stage >= 6) return;
            
            let enemiesDestroyed = mission1Enemies.filter(e => e.userData.hp <= 0).length;
            mission1EnemiesDestroyed = enemiesDestroyed;
            
            if (mission1Stage < 3) {
                // Check all rings for collision to allow any order
                for (let i = 0; i < mission1Rings.length; i++) {
                    const targetRing = mission1Rings[i];
                    if (targetRing.userData.cleared) continue;
                    
                    const dist = playerShip.position.distanceTo(targetRing.position);
                    if (dist < 5000) { // Extremely generous collision radius
                        // Passed through
                        targetRing.userData.cleared = true;
                        targetRing.material.color.setHex(0x10b981);
                        targetRing.material.opacity = 0.2;
                        mission1Stage++;
                        showToast(`Ring ${mission1Stage}/3 cleared.`, "var(--accent-cyan)");
                        
                        // Remind the player if they still need to kill drones
                        if (mission1Stage === 3 && enemiesDestroyed < 3) {
                            setTimeout(() => {
                                showToast(`⚠️ RINGS CLEARED! You still need to destroy ${3 - enemiesDestroyed} more drones!`, "var(--accent-gold)");
                            }, 2000);
                        }
                    }
                }
            }
            
            // Update HUD text if not fully complete
            if (mission1Stage < 3 || enemiesDestroyed < 3) {
                const obj = document.getElementById('hud-objective');
                const displayEnemies = Math.min(enemiesDestroyed, 3);
                if (obj) obj.innerText = `Fly around Saturn, clear 3 training rings, and destroy 3 drones (${mission1Stage}/3 Rings, ${displayEnemies}/3 Enemies).`;
            } else if (mission1Stage === 3 && enemiesDestroyed >= 3) {
                // BOTH OBJECTIVES COMPLETE
                mission1Stage = 4; // Prevent re-triggering this block
                
                const obj = document.getElementById('hud-objective');
                if (obj) obj.innerText = `Fly around Saturn, clear 3 training rings, and destroy 3 drones (3/3 Rings, 3/3 Enemies).`;
                
                showCommsTransmission("KAYLEN VANCE", "Copy that, old man. Controls are stiff, but responsive. Rings and drones cleared.", 5000);
                setTimeout(() => {
                    showCommsTransmission("ELIAS VANCE", "Good. Now dock back at The Crest.", 5000);
                    const obj = document.getElementById('hud-objective');
                    if (obj) obj.innerText = "Return and dock back at The Crest.";
                    showToast("🎯 NEW OBJECTIVE: Dock at The Crest");
                    mission1Stage = 5; // Ready to check distance to Crest
                }, 6000);
            } else if (mission1Stage === 5) {
                // Check distance to The Crest to trigger invasion
                const crestDist = playerShip.position.distanceTo(theCrestStation.position);
                if (crestDist < 12000) {
                    mission1Stage = 6;
                    mission1Active = false;
                    clearInterval(window.mission1Interval);
                    window.mission1Interval = null;
                    
                    triggerDominionFleetHyperspaceEmergence();
                    const sec = document.getElementById('hud-sector');
                    if (sec) sec.innerText = "Mission 3";
                    const obj = document.getElementById('hud-objective');
                    if (obj) obj.innerText = "🚨 WARNING: MASSIVE SLIPSPACE RUPTURES DETECTED IN SECTOR";
                }
            }
        }

