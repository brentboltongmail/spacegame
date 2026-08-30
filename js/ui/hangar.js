        // --- PILOT PROFILE & 3D SHIP UPGRADE HANGAR RENDERER & LOGIC ---
        function initUpgradeHangar3D() {
            const container = document.getElementById('hangar-canvas-container');
            const canvas = document.getElementById('upgrade-ship-canvas');
            if (!container || !canvas) return;

            upgradeHangarScene = new THREE.Scene();
            upgradeHangarScene.background = new THREE.Color(0x060914);

            upgradeHangarCamera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.5, 100);
            upgradeHangarCamera.position.copy(hangarCamTargetPos);
            upgradeHangarCamera.lookAt(hangarCamLookAtPos);

            upgradeHangarRenderer = new THREE.WebGLRenderer(getRendererConfig({ canvas: canvas, alpha: false }));
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
            upgradeHangarBackgroundShips = new THREE.Group(); // New group for background parked ships
            
            if (playerShip) {
                const clonedShip = playerShip.clone(true);
                clonedShip.visible = true;
                clonedShip.position.set(0, 0, 0);
                clonedShip.rotation.set(0, 0, 0);
                upgradeHangarShip.add(clonedShip);
                
                // Add 3 extra Void Interceptors parked in the hangar bay
                const extraShip1 = playerShip.clone(true);
                extraShip1.position.set(-6, 0, -6);
                extraShip1.rotation.set(0, Math.PI / 5, 0);
                upgradeHangarBackgroundShips.add(extraShip1);
                
                const extraShip2 = playerShip.clone(true);
                extraShip2.position.set(6, 0, -6);
                extraShip2.rotation.set(0, -Math.PI / 5, 0);
                upgradeHangarBackgroundShips.add(extraShip2);
                
                const extraShip3 = playerShip.clone(true);
                extraShip3.position.set(0, 0, -10);
                extraShip3.rotation.set(0, Math.PI, 0); 
                upgradeHangarBackgroundShips.add(extraShip3);
            }
            upgradeHangarScene.add(upgradeHangarShip);
            upgradeHangarScene.add(upgradeHangarBackgroundShips);

            // Holographic Form-Fitting Deflector Shield Mesh
            hangarShieldMesh = createHexagonalShieldMesh();
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
                    if (upgradeHangarBackgroundShips) upgradeHangarBackgroundShips.clear();
                    
                    const clonedShip = playerShip.clone(true);
                    clonedShip.visible = true;
                    clonedShip.position.set(0, 0, 0);
                    clonedShip.rotation.set(0, 0, 0);
                    clonedShip.quaternion.set(0, 0, 0, 1);
                    upgradeHangarShip.add(clonedShip);
                    
                    if (upgradeHangarBackgroundShips) {
                        const extraShip1 = playerShip.clone(true);
                        extraShip1.position.set(-6, 0, -6);
                        extraShip1.rotation.set(0, Math.PI / 5, 0);
                        upgradeHangarBackgroundShips.add(extraShip1);
                        
                        const extraShip2 = playerShip.clone(true);
                        extraShip2.position.set(6, 0, -6);
                        extraShip2.rotation.set(0, -Math.PI / 5, 0);
                        upgradeHangarBackgroundShips.add(extraShip2);
                        
                        const extraShip3 = playerShip.clone(true);
                        extraShip3.position.set(0, 0, -10);
                        extraShip3.rotation.set(0, Math.PI, 0);
                        upgradeHangarBackgroundShips.add(extraShip3);
                    }
                    
                    if (hangarShieldMesh) upgradeHangarShip.add(hangarShieldMesh);
                }
                requestAnimationFrame(() => {
                    resizeHangarViewport();
                });
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
                if (hangarShieldMesh.userData.outerMat) hangarShieldMesh.userData.outerMat.opacity = 0.35;
                if (hangarShieldMesh.userData.innerMat) hangarShieldMesh.userData.innerMat.opacity = 0.08;
                if (hangarShieldMesh.userData.wireMat) hangarShieldMesh.userData.wireMat.opacity = 0.15;
                setTimeout(() => {
                    if (hangarShieldMesh.userData.outerMat) hangarShieldMesh.userData.outerMat.opacity = 0.0;
                    if (hangarShieldMesh.userData.innerMat) hangarShieldMesh.userData.innerMat.opacity = 0.0;
                    if (hangarShieldMesh.userData.wireMat) hangarShieldMesh.userData.wireMat.opacity = 0.0;
                }, 1500);
            }

            showToast(`✨ UPGRADED ${mod.name.toUpperCase()} TO LEVEL ${mod.level}!`);
        }

