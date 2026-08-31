        // --- USER PROFILE & SERVER PERSISTENCE ---
        let currentUsername = 'pilot_1';
        let currentProfile = { username: 'pilot_1', boxPositions: {}, settings: {}, progress: {} };

        async function initProfileScreen() {
            const screen = document.getElementById('profile-selection-screen');
            if (screen) screen.style.display = 'flex';
            await renderProfileList();
        }
        window.initProfileScreen = initProfileScreen;

        async function renderProfileList() {
            const list = document.getElementById('profile-list');
            if (!list) return;
            
            try {
                const res = await fetch('/api/profiles');
                if (res.ok) {
                    const data = await res.json();
                    let html = `
                    <style>
                        .profile-row {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            position: relative;
                            margin-bottom: 12px;
                            width: 100%;
                        }

                        .profile-box {
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            width: 560px;
                            padding: 18px 28px;
                            background: rgba(8, 12, 24, 0.7);
                            border: 1px solid rgba(0, 240, 255, 0.25);
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                            box-shadow: 0 0 10px rgba(0, 240, 255, 0.0);
                            position: relative;
                            overflow: hidden;
                            user-select: none;
                        }

                        .profile-box::after {
                            content: '';
                            position: absolute;
                            top: -50%; left: -50%; right: -50%; bottom: -50%;
                            background: linear-gradient(45deg, transparent 40%, rgba(0, 240, 255, 0.12) 50%, transparent 60%);
                            transform: translateX(-100%);
                            transition: transform 0.6s ease;
                            z-index: 1;
                            pointer-events: none;
                        }

                        @keyframes energyPulse {
                            0% {
                                box-shadow: 0 0 15px rgba(0, 240, 255, 0.25), inset 0 0 10px rgba(0, 240, 255, 0.1);
                                border-color: rgba(0, 240, 255, 0.6);
                            }
                            50% {
                                box-shadow: 0 0 35px rgba(0, 240, 255, 0.65), inset 0 0 20px rgba(0, 240, 255, 0.3);
                                border-color: rgba(0, 240, 255, 1.0);
                            }
                            100% {
                                box-shadow: 0 0 15px rgba(0, 240, 255, 0.25), inset 0 0 10px rgba(0, 240, 255, 0.1);
                                border-color: rgba(0, 240, 255, 0.6);
                            }
                        }

                        @keyframes textPulse {
                            0% { text-shadow: 0 0 10px #00f0ff, 0 0 20px rgba(0, 240, 255, 0.4); }
                            50% { text-shadow: 0 0 20px #00f0ff, 0 0 40px #00f0ff, 0 0 60px rgba(0, 240, 255, 0.8); }
                            100% { text-shadow: 0 0 10px #00f0ff, 0 0 20px rgba(0, 240, 255, 0.4); }
                        }

                        .profile-box:hover {
                            background: rgba(12, 24, 48, 0.85);
                            animation: energyPulse 2s infinite ease-in-out;
                        }

                        .profile-box:hover::after {
                            transform: translateX(100%);
                        }

                        .profile-name {
                            font-size: 22px;
                            font-weight: 400;
                            letter-spacing: 2px;
                            color: rgba(255, 255, 255, 0.85);
                            transition: all 0.3s ease;
                            z-index: 2;
                        }

                        .profile-box:hover .profile-name {
                            color: #fff;
                            font-weight: 500;
                            animation: textPulse 2s infinite ease-in-out;
                        }

                        .profile-mission-badge {
                            display: inline-flex;
                            align-items: center;
                            padding: 5px 14px;
                            background: rgba(0, 240, 255, 0.1);
                            border: 1px solid rgba(0, 240, 255, 0.35);
                            border-radius: 4px;
                            color: #00f0ff;
                            font-size: 12px;
                            font-weight: 700;
                            letter-spacing: 1.5px;
                            transition: all 0.3s ease;
                            z-index: 2;
                            box-shadow: 0 0 8px rgba(0, 240, 255, 0.15);
                            text-transform: uppercase;
                        }

                        .profile-box:hover .profile-mission-badge {
                            background: rgba(0, 240, 255, 0.25);
                            border-color: #00f0ff;
                            box-shadow: 0 0 14px rgba(0, 240, 255, 0.5);
                            color: #fff;
                        }

                        /* Actions floating strictly off to the right outside the profile box */
                        .profile-side-actions {
                            position: absolute;
                            left: calc(50% + 295px);
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            opacity: 0;
                            pointer-events: none;
                            transform: translateX(-6px);
                            transition: opacity 0.25s ease, transform 0.25s ease;
                            white-space: nowrap;
                        }

                        .profile-row:hover .profile-side-actions {
                            opacity: 1;
                            pointer-events: auto;
                            transform: translateX(0);
                        }

                        .ethereal-side-btn {
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            padding: 6px 12px;
                            background: rgba(8, 12, 24, 0.85);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            color: rgba(255, 255, 255, 0.75);
                            cursor: pointer;
                            border-radius: 6px;
                            font-size: 11px;
                            font-weight: 700;
                            letter-spacing: 1px;
                            transition: all 0.2s ease;
                            backdrop-filter: blur(4px);
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                        }

                        .ethereal-side-btn.rename:hover {
                            background: rgba(234, 179, 8, 0.25);
                            border-color: #eab308;
                            color: #facc15;
                            box-shadow: 0 0 12px rgba(234, 179, 8, 0.45);
                        }

                        .ethereal-side-btn.delete:hover {
                            background: rgba(239, 68, 68, 0.25);
                            border-color: #ef4444;
                            color: #f87171;
                            box-shadow: 0 0 12px rgba(239, 68, 68, 0.45);
                        }
                    </style>
                    `;
                    if (data.profiles && data.profiles.length > 0) {
                        data.profiles.forEach(p => {
                            const pName = (typeof p === 'object' && p.name) ? p.name : p;
                            const pMission = (typeof p === 'object' && p.mission) ? p.mission : 'Mission 1';
                            html += `
                            <div class="profile-row">
                                <div class="profile-box" onclick="window.startGameWithProfile('${pName}')">
                                    <span class="profile-name">${pName}</span>
                                    <span class="profile-mission-badge">${pMission}</span>
                                </div>
                                <div class="profile-side-actions">
                                    <button class="ethereal-side-btn rename" title="Rename Pilot" onclick="window.promptRenameProfile('${pName}')">✎ RENAME</button>
                                    <button class="ethereal-side-btn delete" title="Delete Profile" onclick="window.deleteProfile('${pName}')">✕ DELETE</button>
                                </div>
                            </div>`;
                        });
                    } else {
                        html += '<div style="color: #888; font-style: italic; text-align: center; margin-top: 20px;">No pilot profiles found in the databanks...</div>';
                    }
                    list.innerHTML = html;
                }
            } catch (e) {
                console.error("Failed to load profiles:", e);
                list.innerHTML = '<div style="color: #f00;">Error loading profiles. Is server running?</div>';
            }
        }

        window.createNewProfile = async function() {
            const input = document.getElementById('new-profile-name');
            const name = input.value.trim();
            if (!name) return;
            
            // Just saving an empty profile via POST /api/profile
            try {
                await fetch('/api/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: name, boxPositions: {}, settings: {}, progress: {} })
                });
                input.value = '';
                renderProfileList();
            } catch (e) { console.error("Error creating profile", e); }
        };

        function showCustomModal(title, text, inputPlaceholder, inputValue, confirmText, confirmColor, onConfirm) {
            const overlay = document.createElement('div');
            overlay.style.position = 'absolute';
            overlay.style.top = '0'; overlay.style.left = '0';
            overlay.style.width = '100%'; overlay.style.height = '100%';
            overlay.style.background = 'rgba(0,0,0,0.85)';
            overlay.style.zIndex = '10001';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            
            const box = document.createElement('div');
            box.style.background = 'linear-gradient(135deg, rgba(12,24,48,0.95), rgba(8,12,24,0.95))';
            box.style.border = `1px solid ${confirmColor}`;
            box.style.borderRadius = '8px';
            box.style.padding = '30px';
            box.style.minWidth = '350px';
            box.style.boxShadow = `0 0 20px ${confirmColor}40`;
            box.style.textAlign = 'center';
            box.style.fontFamily = 'sans-serif';
            
            let html = `<h2 style="color: ${confirmColor}; margin-top: 0; letter-spacing: 2px;">${title}</h2>`;
            html += `<p style="color: rgba(255,255,255,0.7); margin-bottom: 25px;">${text}</p>`;
            
            if (inputPlaceholder !== null) {
                html += `<input type="text" id="custom-modal-input" placeholder="${inputPlaceholder}" value="${inputValue}" style="width: 100%; padding: 12px; margin-bottom: 25px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 16px; border-radius: 4px; box-sizing: border-box; text-align: center; outline: none;">`;
            }
            
            html += `<div style="display: flex; gap: 15px; justify-content: center;">
                <button id="custom-modal-cancel" style="padding: 10px 20px; background: transparent; border: 1px solid rgba(255,255,255,0.3); color: #fff; border-radius: 4px; cursor: pointer; font-weight: bold; transition: all 0.2s;">CANCEL</button>
                <button id="custom-modal-confirm" style="padding: 10px 20px; background: ${confirmColor}30; border: 1px solid ${confirmColor}; color: ${confirmColor}; border-radius: 4px; cursor: pointer; font-weight: bold; transition: all 0.2s;">${confirmText}</button>
            </div>`;
            
            box.innerHTML = html;
            overlay.appendChild(box);
            document.body.appendChild(overlay);
            
            if (inputPlaceholder !== null) {
                box.querySelector('#custom-modal-input').focus();
            }
            
            const close = () => { if(overlay.parentNode) overlay.parentNode.removeChild(overlay); };
            
            const cancelBtn = box.querySelector('#custom-modal-cancel');
            cancelBtn.onmouseover = () => cancelBtn.style.background = 'rgba(255,255,255,0.1)';
            cancelBtn.onmouseout = () => cancelBtn.style.background = 'transparent';
            cancelBtn.onclick = close;
            
            const confirmBtn = box.querySelector('#custom-modal-confirm');
            confirmBtn.onmouseover = () => { confirmBtn.style.background = `${confirmColor}50`; confirmBtn.style.boxShadow = `0 0 15px ${confirmColor}80`; };
            confirmBtn.onmouseout = () => { confirmBtn.style.background = `${confirmColor}30`; confirmBtn.style.boxShadow = 'none'; };
            confirmBtn.onclick = () => {
                let val = null;
                if (inputPlaceholder !== null) {
                    val = box.querySelector('#custom-modal-input').value;
                }
                close();
                onConfirm(val);
            };
        }

        window.deleteProfile = function(name) {
            showCustomModal(
                'PURGE PROFILE',
                `Are you sure you want to permanently delete '${name}'?`,
                null, null,
                'DELETE', '#ff3b5c',
                async () => {
                    try {
                        await fetch(`/api/profile?user=${encodeURIComponent(name)}`, { method: 'DELETE' });
                        renderProfileList();
                    } catch (e) { console.error("Error deleting profile", e); }
                }
            );
        };

        window.promptRenameProfile = function(oldName) {
            showCustomModal(
                'RENAME PROFILE',
                `Enter new designation for '${oldName}':`,
                'New profile name', oldName,
                'RENAME', '#eab308',
                async (newName) => {
                    if (!newName || newName.trim() === '' || newName === oldName) return;
                    try {
                        await fetch('/api/rename_profile', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ old_username: oldName, new_username: newName.trim() })
                        });
                        renderProfileList();
                    } catch (e) { console.error("Error renaming profile", e); }
                }
            );
        };

        window.startGameWithProfile = async function(name) {
            const screen = document.getElementById('profile-selection-screen');
            if (screen) screen.style.display = 'none';
            
            // Attempt auto-fullscreen as this counts as a user interaction (click event)
            try {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(e => console.log("Fullscreen prevented:", e));
                } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen();
                }
            } catch(e) {}
            
            await loadProfileFromServer(name);
            
            // Resume the init sequence that was paused in main.js/interactions.js
            if (typeof init3DSimulator === 'function') init3DSimulator();
            if (typeof initEngineAudio === 'function') initEngineAudio();
            if (typeof updateEngineAudio === 'function' && typeof audioCtx !== 'undefined' && audioCtx) {
                updateEngineAudio(typeof currentSpeed !== 'undefined' ? currentSpeed / maxSpeedCap : 0, typeof cameraMode !== 'undefined' ? cameraMode === 0 : false);
            }
            
            // Restore exact saved game state from profile
            if (typeof window.restoreGameState === 'function') {
                window.restoreGameState();
            } else if (typeof window.startMission1 === 'function') {
                window.startMission1();
            }
        };

        window.saveCurrentGameState = function() {
            if (!currentProfile) return;
            if (!currentProfile.progress) currentProfile.progress = {};

            let activeMission = "Mission 1";
            if (typeof window.mission3Active !== 'undefined' && (window.mission3Active || window.isMission3Active)) {
                activeMission = "Mission 3";
            } else if (typeof window.mission2Active !== 'undefined' && window.mission2Active) {
                activeMission = "Mission 2";
            } else if (typeof mission1Active !== 'undefined' && mission1Active) {
                activeMission = "Mission 1";
            } else if (currentProfile.progress.currentMission) {
                activeMission = currentProfile.progress.currentMission;
            }

            const clearedRings = (typeof mission1Rings !== 'undefined' && Array.isArray(mission1Rings) && mission1Rings.length > 0)
                ? mission1Rings.map(r => !!(r && r.userData && r.userData.cleared))
                : (currentProfile.progress.mission1?.clearedRings || []);

            const upgradesData = {};
            if (typeof shipUpgrades !== 'undefined') {
                for (const k in shipUpgrades) {
                    upgradesData[k] = { level: shipUpgrades[k].level, cost: shipUpgrades[k].cost };
                }
            }

            currentProfile.progress = {
                currentMission: activeMission,
                playerCredits: (typeof playerCredits !== 'undefined') ? playerCredits : 125000,
                playerHp: (typeof playerHp !== 'undefined') ? playerHp : 100,
                shieldPercent: (typeof shieldPercent !== 'undefined') ? shieldPercent : 100,
                shipPosition: (typeof playerShip !== 'undefined' && playerShip && playerShip.position) ? {
                    x: playerShip.position.x,
                    y: playerShip.position.y,
                    z: playerShip.position.z
                } : (currentProfile.progress?.shipPosition || null),
                shipQuaternion: (typeof playerShip !== 'undefined' && playerShip && playerShip.quaternion) ? {
                    x: playerShip.quaternion.x,
                    y: playerShip.quaternion.y,
                    z: playerShip.quaternion.z,
                    w: playerShip.quaternion.w
                } : (currentProfile.progress?.shipQuaternion || null),
                mission1: {
                    active: typeof mission1Active !== 'undefined' ? mission1Active : false,
                    stage: typeof mission1Stage !== 'undefined' ? mission1Stage : 0,
                    enemiesDestroyed: typeof mission1EnemiesDestroyed !== 'undefined' ? mission1EnemiesDestroyed : 0,
                    clearedRings: clearedRings
                },
                mission2: {
                    active: typeof window.mission2Active !== 'undefined' ? window.mission2Active : false,
                    stage: typeof window.mission2Stage !== 'undefined' ? window.mission2Stage : 0,
                    enemiesDestroyed: typeof window.mission2EnemiesDestroyed !== 'undefined' ? window.mission2EnemiesDestroyed : 0
                },
                mission3: {
                    active: (typeof window.mission3Active !== 'undefined' && window.mission3Active) || (typeof window.isMission3Active !== 'undefined' && window.isMission3Active)
                },
                upgrades: upgradesData
            };

            saveProfileToServerSilent();
        };

        window.restoreGameState = function() {
            if (!currentProfile || !currentProfile.progress) {
                if (typeof window.startMission1 === 'function') window.startMission1();
                return;
            }
            const prog = currentProfile.progress;

            // 1. Restore Player Credits
            if (typeof prog.playerCredits === 'number') {
                playerCredits = prog.playerCredits;
                const credDisp = document.getElementById('hangar-credits-display');
                if (credDisp) credDisp.innerText = `${playerCredits.toLocaleString()}`;
            }

            // 2. Restore Hull & Shield
            if (typeof prog.playerHp === 'number' && prog.playerHp > 0) {
                playerHp = prog.playerHp;
            }
            if (typeof prog.shieldPercent === 'number') {
                shieldPercent = prog.shieldPercent;
            }

            // 3. Restore Hangar Upgrades
            if (prog.upgrades && typeof shipUpgrades !== 'undefined') {
                for (const k in prog.upgrades) {
                    if (shipUpgrades[k]) {
                        shipUpgrades[k].level = prog.upgrades[k].level || shipUpgrades[k].level;
                        shipUpgrades[k].cost = prog.upgrades[k].cost || shipUpgrades[k].cost;
                        const lbl = document.getElementById(`lbl-mod-${k}`);
                        if (lbl) {
                            lbl.innerText = shipUpgrades[k].level >= shipUpgrades[k].maxLevel ? `Level ${shipUpgrades[k].level} / 5 [MAXED]` : `Level ${shipUpgrades[k].level} / 5`;
                            if (shipUpgrades[k].level >= shipUpgrades[k].maxLevel) lbl.style.color = 'var(--accent-gold)';
                        }
                        const btn = document.getElementById(`btn-mod-${k}`);
                        if (btn) {
                            if (shipUpgrades[k].level >= shipUpgrades[k].maxLevel) {
                                btn.innerText = 'MAX LEVEL';
                                btn.disabled = true;
                                btn.style.opacity = '0.5';
                            } else {
                                btn.innerText = `Upgrade (${shipUpgrades[k].cost.toLocaleString()} SC)`;
                            }
                        }
                    }
                }
            }

            // 4. Restore Active Mission & Position
            const targetMission = prog.currentMission || 'Mission 1';

            if (targetMission === 'Mission 3') {
                if (typeof window.startMission3 === 'function') {
                    window.startMission3();
                }
                if (prog.shipPosition && typeof playerShip !== 'undefined' && playerShip) {
                    playerShip.position.set(prog.shipPosition.x, prog.shipPosition.y, prog.shipPosition.z);
                    if (prog.shipQuaternion) {
                        playerShip.quaternion.set(prog.shipQuaternion.x, prog.shipQuaternion.y, prog.shipQuaternion.z, prog.shipQuaternion.w);
                    }
                }
            } else if (targetMission === 'Mission 2') {
                if (typeof startMission2 === 'function') {
                    startMission2();
                    if (prog.mission2) {
                        window.mission2Stage = prog.mission2.stage || 0;
                        window.mission2EnemiesDestroyed = prog.mission2.enemiesDestroyed || 0;
                    }
                    if (prog.shipPosition && typeof playerShip !== 'undefined' && playerShip) {
                        playerShip.position.set(prog.shipPosition.x, prog.shipPosition.y, prog.shipPosition.z);
                        if (prog.shipQuaternion) {
                            playerShip.quaternion.set(prog.shipQuaternion.x, prog.shipQuaternion.y, prog.shipQuaternion.z, prog.shipQuaternion.w);
                        }
                    }
                }
            } else {
                // Mission 1
                if (typeof window.startMission1 === 'function') {
                    window.startMission1({
                        stage: prog.mission1?.stage || 0,
                        enemiesDestroyed: prog.mission1?.enemiesDestroyed || 0,
                        clearedRings: prog.mission1?.clearedRings || [],
                        hasSavedPos: !!prog.shipPosition
                    });
                    if (prog.shipPosition && typeof playerShip !== 'undefined' && playerShip) {
                        playerShip.position.set(prog.shipPosition.x, prog.shipPosition.y, prog.shipPosition.z);
                        if (prog.shipQuaternion) {
                            playerShip.quaternion.set(prog.shipQuaternion.x, prog.shipQuaternion.y, prog.shipQuaternion.z, prog.shipQuaternion.w);
                        }
                    }
                    if (typeof checkMission1Progress === 'function') {
                        checkMission1Progress();
                    }
                }
            }
        };

        // Auto-save game state every 5 seconds while active
        setInterval(() => {
            if (typeof isGamePaused !== 'undefined' && !isGamePaused && currentUsername && typeof window.saveCurrentGameState === 'function') {
                window.saveCurrentGameState();
            }
        }, 5000);

        window.addEventListener('beforeunload', () => {
            if (typeof window.saveCurrentGameState === 'function') {
                window.saveCurrentGameState();
            }
        });

        async function loadProfileFromServer(username) {
            currentUsername = username || 'pilot_1';
            try {
                const res = await fetch(`/api/profile?user=${encodeURIComponent(currentUsername)}`);
                if (res.ok) {
                    currentProfile = await res.json();
                    const nameEl = document.getElementById('active-pilot-name');
                    if (nameEl) nameEl.innerText = currentProfile.username || currentUsername;
                    if (currentProfile.settings) {
                        const set = currentProfile.settings;
                        if (set.masterVol !== undefined) document.getElementById('slider-vol-master').value = set.masterVol;
                        if (set.engineVol !== undefined) document.getElementById('slider-vol-engine').value = set.engineVol;
                        if (set.firingVol !== undefined) document.getElementById('slider-vol-firing').value = set.firingVol;
                        if (set.musicVol !== undefined) document.getElementById('slider-vol-music').value = set.musicVol;
                        updateAudioVolumes();
                        if (set.rollSpeed !== undefined) document.getElementById('slider-set-roll').value = set.rollSpeed;
                        if (set.turnSpeed !== undefined) document.getElementById('slider-set-turn').value = set.turnSpeed;
                        if (set.cameraLag !== undefined) document.getElementById('slider-set-cam').value = set.cameraLag;
                        if (set.throttleAccel !== undefined) document.getElementById('slider-set-throttle').value = set.throttleAccel;
                        if (set.toastDuration !== undefined) document.getElementById('slider-set-toast').value = set.toastDuration;
                        if (set.shieldRegenMult !== undefined) document.getElementById('slider-set-shield-regen').value = set.shieldRegenMult;
                        if (set.hullRegenMult !== undefined) document.getElementById('slider-set-hull-regen').value = set.hullRegenMult;
                        if (set.enemyDamageMult !== undefined) document.getElementById('slider-set-enemy-dmg').value = set.enemyDamageMult;
                        if (set.playerDamageMult !== undefined) document.getElementById('slider-set-player-dmg').value = set.playerDamageMult;
                        if (set.flashOnHit !== undefined) {
                            const chk = document.getElementById('chk-flash-on-hit');
                            if (chk) chk.checked = set.flashOnHit;
                        }
                        updateGameSettings();
                        updateGameSettings();
                    }

                    // Auto-detect and set platform optimization if not set
                    if (!currentProfile.settings) currentProfile.settings = {};
                    if (!currentProfile.settings.platform) {
                        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
                        currentProfile.settings.platform = isMac ? 'mac' : 'windows';
                        saveProfileToServerSilent();
                    }

                    const defaultKeyBindings = { 
                        KeyW: 'KeyW', KeyS: 'KeyS', KeyA: 'KeyA', KeyD: 'KeyD', 
                        PitchUp: 'ArrowUp', PitchDown: 'ArrowDown', YawLeft: 'ArrowLeft', YawRight: 'ArrowRight',
                        Space: 'Space', KeyM: 'KeyM', KeyL: 'KeyL', KeyC: 'KeyC', Escape: 'Escape' 
                    };
                    if (currentProfile.keyBindings) {
                        keyBindings = Object.assign({}, defaultKeyBindings, currentProfile.keyBindings);
                        for (const action in keyBindings) {
                            const code = keyBindings[action];
                            let display = code.replace(/^Key/, '').toUpperCase();
                            if (code === 'Space') display = 'SPACE';
                            if (code === 'Escape') display = 'ESC';
                            if (code === 'ArrowUp') display = '▲ UP';
                            if (code === 'ArrowDown') display = '▼ DOWN';
                            if (code === 'ArrowLeft') display = '◄ LEFT';
                            if (code === 'ArrowRight') display = '► RIGHT';
                            
                            // fallback for defaults if they match
                            if (action === 'Space' && code === 'Space') display = 'Space / Mouse 1';
                            
                            const el = document.getElementById('key-' + action);
                            if (el) el.innerText = display;
                        }
                    } else {
                        keyBindings = { ...defaultKeyBindings };
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
            if (id === 'hud-radar-card') return 'RADAR';
            if (id === 'hud-top-target-card') return '🎯 TARGET DAMAGE';
            if (id === 'hud-target-card') return '🎯 TARGET LOCK';
            if (id === 'hud-camera-card') return '🎥 CAMERA VIEW';
            if (id === 'cinematic-comms-overlay') return '📻 COMMS';

            if (!text) return 'WINDOW';
            const clean = text.replace(/[\n\r]+/g, ' ').trim();
            const firstWords = clean.split(' ').slice(0, 2).join(' ');
            return firstWords.length > 14 ? firstWords.substring(0, 14) + '..' : firstWords;
        }

                function clampAllWindowPositions() {
            const headerBoundary = 0; // Top of screen
            let didCorrection = false;
            document.querySelectorAll('.draggable-box').forEach(box => {
                const rect = box.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) return; // Skip hidden or unrendered boxes

                let currentY = parseFloat(box.dataset.dragY) || 0;
                let currentX = parseFloat(box.dataset.dragX) || 0;
                
                const initialTop = rect.top - currentY;
                const initialLeft = rect.left - currentX;
                
                const minAllowedY = headerBoundary - initialTop;
                const maxAllowedY = Math.max(minAllowedY, window.innerHeight - initialTop - rect.height);
                const minAllowedX = -initialLeft;
                const maxAllowedX = Math.max(minAllowedX, window.innerWidth - initialLeft - rect.width);

                let changed = false;

                if (currentY < minAllowedY) { currentY = minAllowedY; changed = true; }
                if (currentY > maxAllowedY) { currentY = maxAllowedY; changed = true; }
                if (currentX < minAllowedX) { currentX = minAllowedX; changed = true; }
                if (currentX > maxAllowedX) { currentX = maxAllowedX; changed = true; }

                if (changed) {
                    box.dataset.dragY = currentY;
                    box.dataset.dragX = currentX;
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

            // Auto-clamp any window that is currently above top menu bar boundary, wait for fonts to avoid height pop-in
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(() => setTimeout(() => clampAllWindowPositions(), 100));
            } else {
                window.addEventListener('load', () => setTimeout(() => clampAllWindowPositions(), 100));
            }
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
            const headerBoundary = 0; // Top of screen

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

                    // Enforce top and bottom boundaries
                    const minAllowedY = headerBoundary - initialTop;
                    const maxAllowedY = Math.max(minAllowedY, window.innerHeight - initialTop - rect.height);
                    if (currentY < minAllowedY) {
                        currentY = minAllowedY;
                    } else if (currentY > maxAllowedY) {
                        currentY = maxAllowedY;
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
            const duration = (typeof gameMechanicsConfig !== 'undefined' && gameMechanicsConfig.toastDuration !== undefined) ? gameMechanicsConfig.toastDuration * 1000 : 5000;
            setTimeout(() => toast.classList.remove('show'), duration);
        }

