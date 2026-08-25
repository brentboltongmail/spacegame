        // --- 3D TACTICAL SYSTEM STAR MAP RENDERER & INTERACTIVITY ---
        let isTacticalMapOpen = false;
        let mapScene, mapCamera, mapRenderer, mapGroup, mapGridGroup;
        let mapPlayerMesh, mapSunMesh, mapPlanetMesh, mapTitanMesh, mapGateMesh, mapEnemyGroup;
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

            mapRenderer = new THREE.WebGLRenderer(getRendererConfig({ canvas: canvas, alpha: false }));
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

            // 2. Saturn & Grand Ice Ring System
            const planetIconGeo = new THREE.SphereGeometry(36, 32, 32); // 9000 * 0.004
            const planetIconMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
            mapPlanetMesh = new THREE.Mesh(planetIconGeo, planetIconMat);
            mapPlanetMesh.userData = { label: "Saturn (Gas Giant)" };
            mapPlanetMesh.position.set(-34, -12, -56);
            mapGroup.add(mapPlanetMesh);

            const ringIconGeo = new THREE.RingGeometry(42, 90, 32); // matching 10500 to 22500 radius * 0.004
            ringIconGeo.rotateX(Math.PI / 2);
            const ringIconMat = new THREE.MeshBasicMaterial({ color: 0xfde68a, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
            const mapRing = new THREE.Mesh(ringIconGeo, ringIconMat);
            mapPlanetMesh.add(mapRing);
            mapPlanetMesh.rotation.x = 0.466;
            mapPlanetMesh.rotation.z = -0.22;

            // 2b. Titan (Saturn's Moon)
            const titanIconGeo = new THREE.SphereGeometry(4.4, 24, 24); // 1100 * 0.004
            const titanIconMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
            mapTitanMesh = new THREE.Mesh(titanIconGeo, titanIconMat);
            mapTitanMesh.userData = { label: "Titan (Saturn's Moon)" };
            mapTitanMesh.position.set(306.2, -6.3, -197.1); // 76560, -1586, -49280 * 0.004
            mapGroup.add(mapTitanMesh);

            // 2c. The Crest (Orbital Platform)
            const crestIconGeo = new THREE.TorusGeometry(3.6, 0.7, 12, 32);
            crestIconGeo.rotateX(Math.PI / 2);
            const crestIconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
            mapCrestMesh = new THREE.Mesh(crestIconGeo, crestIconMat);
            mapCrestMesh.userData = { label: "The Crest (Orbital Platform)" };
            mapGroup.add(mapCrestMesh);

            // 3. Sol Primary Star
            const sunIconGeo = new THREE.SphereGeometry(120, 32, 32); // 30000 * 0.004
            const sunIconMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
            mapSunMesh = new THREE.Mesh(sunIconGeo, sunIconMat);
            mapSunMesh.userData = { label: "Sol Primary Star" };
            mapSunMesh.position.set(3000, 1600, 2000); // 750000, 400000, 500000 * 0.004
            mapGroup.add(mapSunMesh);

            // 4. Ancient Precursor Golden Gate
            const gateIconGeo = new THREE.TorusGeometry(3.8, 0.9, 16, 32);
            gateIconGeo.rotateX(Math.PI / 2);
            const gateIconMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
            mapGateMesh = new THREE.Mesh(gateIconGeo, gateIconMat);
            mapGateMesh.userData = { label: "Ancient Precursor Golden Gate" };
            mapGroup.add(mapGateMesh);

            // 5. Dominion Capital Fleet Group
            mapDreadGroup = new THREE.Group();
            mapGroup.add(mapDreadGroup);

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
            setRelativeMapPos(mapTitanMesh, spaceTitan);
            setRelativeMapPos(mapCrestMesh, theCrestStation);
            if (theCrestStation && mapCrestMesh) {
                mapCrestMesh.quaternion.copy(theCrestStation.quaternion);
                if (theCrestState === 'DESTROYED') {
                    mapCrestMesh.material.color.setHex(0xea580c);
                    mapCrestMesh.userData.label = "The Crest (Destroyed / Burning Debris)";
                } else if (theCrestState === 'EXPLODING' || theCrestState === 'STRUCK') {
                    mapCrestMesh.material.color.setHex(0xef4444);
                    mapCrestMesh.userData.label = "The Crest (Catastrophic Explosion)";
                } else {
                    mapCrestMesh.material.color.setHex(0x38bdf8);
                    mapCrestMesh.userData.label = "The Crest (Orbital Platform)";
                }
            }
            setRelativeMapPos(mapSunMesh, spaceSun);
            if (mapGateMesh) {
                mapGateMesh.visible = !!(ancientGoldenGate && ancientGoldenGate.visible);
                if (mapGateMesh.visible) setRelativeMapPos(mapGateMesh, ancientGoldenGate);
            }
            
            if (mapDreadGroup && capitalShips.length > 0) {
                while (mapDreadGroup.children.length < capitalShips.length) {
                    const dreadIconGeo = new THREE.BoxGeometry(9.5, 4.2, 22);
                    const dreadIconMat = new THREE.MeshBasicMaterial({ color: 0xff1e38 });
                    const mapDread = new THREE.Mesh(dreadIconGeo, dreadIconMat);
                    mapDread.userData = { label: "Dominion Dreadnought" };
                    mapDreadGroup.add(mapDread);
                }
                while (mapDreadGroup.children.length > capitalShips.length) {
                    const child = mapDreadGroup.children[mapDreadGroup.children.length - 1];
                    mapDreadGroup.remove(child);
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                }
                for (let i = 0; i < capitalShips.length; i++) {
                    const cs = capitalShips[i];
                    const md = mapDreadGroup.children[i];
                    if (cs && md) {
                        md.visible = cs.visible;
                        md.userData.label = cs.userData.name || "Dominion Dreadnought";
                        setRelativeMapPos(md, cs);
                        md.quaternion.copy(cs.quaternion);
                    }
                }
            }
            
            if (mapEnemyGroup && playerShip) {
                // Keep tactical map enemy markers in 100% sync with active living enemyShips
                const activeEnemies = enemyShips.filter(e => e && e.userData && e.userData.hp > 0);
                while (mapEnemyGroup.children.length < activeEnemies.length) {
                    const enemyIconGeo = new THREE.TetrahedronGeometry(1.2);
                    const enemyIconMat = new THREE.MeshBasicMaterial({ color: 0xff3b5c });
                    const mapEnemy = new THREE.Mesh(enemyIconGeo, enemyIconMat);
                    mapEnemy.userData = { label: "Dominion Fighter" };
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
                if (mapTitanMesh) interactables.push(mapTitanMesh);
                if (mapSunMesh) interactables.push(mapSunMesh);
                if (mapGateMesh) interactables.push(mapGateMesh);
                if (mapDreadGroup) interactables.push(...mapDreadGroup.children);
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

