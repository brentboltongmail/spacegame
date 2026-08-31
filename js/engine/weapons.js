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
        const _radarInvQuat = new THREE.Quaternion();
        const _radarRelPos = new THREE.Vector3();

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
        const maxPoolSize = 60;

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
            // Dynamic allocation fallback if rapid zero-cooldown firing exceeds initial pool
            const boltGroup = new THREE.Group();
            const coreMesh = new THREE.Mesh(sharedLaserCoreGeo, sharedLaserCoreMat);
            boltGroup.add(coreMesh);
            const auraMesh = new THREE.Mesh(sharedLaserAuraGeo, sharedLaserAuraMat);
            boltGroup.add(auraMesh);
            const tipMesh = new THREE.Mesh(sharedLaserTipGeo, sharedLaserTipMat);
            tipMesh.position.set(0, 0, -6.2);
            boltGroup.add(tipMesh);
            boltGroup.visible = false;
            boltGroup.userData = { active: true, velocity: new THREE.Vector3(), prevPos: new THREE.Vector3() };
            scene.add(boltGroup);
            laserPool.push(boltGroup);
            return boltGroup;
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

        function firePlasmaLaser() {
            if (isTacticalMapOpen || isGamePaused || isOptionsOpen) return;
            if (!playerShip) return;

            // Reuse pre-allocated helper vectors - ZERO GC allocations!
            _fwdDir.set(0, 0, -1).applyQuaternion(playerShip.quaternion);

            _offsetL.set(-2.8, -0.3, -2.5).applyQuaternion(playerShip.quaternion);
            _offsetR.set(2.8, -0.3, -2.5).applyQuaternion(playerShip.quaternion);

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
            const firingVolMult = (typeof gameVolumeConfig !== 'undefined') ? (gameVolumeConfig.master * gameVolumeConfig.firing) : 0.60;
            if (elevenLabsBuffers.fire && audioCtx && audioCtx.state === 'running' && !isAudioMuted) {
                try {
                    const src = audioCtx.createBufferSource();
                    src.buffer = elevenLabsBuffers.fire;
                    src.playbackRate.value = 1 / 3; // Tripled the length of the MP3 sound
                    const gain = audioCtx.createGain();
                    gain.gain.setValueAtTime(0.45 * firingVolMult, audioCtx.currentTime);
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
                    lGain.gain.setValueAtTime(0.14 * firingVolMult, now);
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
                        nGain.gain.setValueAtTime(0.09 * firingVolMult, now);
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

        function createEnemyInterceptorMesh() {
            const enemyGroup = new THREE.Group();
            const meshContainer = new THREE.Group();
            enemyGroup.add(meshContainer);

            // Procedural Fallback Hull (while GLB is loading)
            const fallbackGeo = new THREE.ConeGeometry(2.0, 5.0, 4);
            fallbackGeo.rotateX(Math.PI / 2);
            const fallbackMat = new THREE.MeshStandardMaterial({
                color: 0x1c1917,
                roughness: 0.4,
                metalness: 0.9
            });
            const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
            fallbackMesh.name = "dominionFallbackHull";
            meshContainer.add(fallbackMesh);

            const engineLights = [];
            enemyGroup.userData = {
                hp: 100,
                maxHp: 100,
                name: "Dominion Strike Fighter",
                flashTimer: 0,
                engineLights: engineLights,
                isEvil: true,
                meshContainer: meshContainer
            };

            const glowColor = 0xff0044;
            const engineGlowMat = new THREE.MeshBasicMaterial({
                color: glowColor,
                transparent: true,
                opacity: 0.95
            });
            const engineCoreMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.98
            });
            const engineHaloMat = new THREE.MeshBasicMaterial({
                color: 0xff0055,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });

            // 4 Rear Crimson Plasma Thrusters (Twin Main Engines + Twin Wingtip Thrusters)
            const enginePositions = [
                { x: -1.05, y: 0.45, z: 5.65, r: 0.55 },
                { x:  1.05, y: 0.45, z: 5.65, r: 0.55 },
                { x: -5.40, y: 0.42, z: 5.35, r: 0.32 },
                { x:  5.40, y: 0.42, z: 5.35, r: 0.32 }
            ];

            enginePositions.forEach(eng => {
                const engGroup = new THREE.Group();
                engGroup.position.set(eng.x, eng.y, eng.z);

                const cavityGeo = new THREE.CylinderGeometry(eng.r * 0.85, eng.r * 0.95, 0.45, 16, 1, true);
                const cavityMat = new THREE.MeshBasicMaterial({
                    color: 0x880018,
                    side: THREE.BackSide,
                    transparent: true,
                    opacity: 0.85
                });
                const cavity = new THREE.Mesh(cavityGeo, cavityMat);
                cavity.rotation.x = Math.PI / 2;
                cavity.position.z = -0.22;
                engGroup.add(cavity);

                const diskGeo = new THREE.CircleGeometry(eng.r * 0.90, 24);
                const disk = new THREE.Mesh(diskGeo, engineGlowMat);
                disk.position.z = 0.02;
                engGroup.add(disk);

                const coreGeo = new THREE.CircleGeometry(eng.r * 0.45, 24);
                const core = new THREE.Mesh(coreGeo, engineCoreMat);
                core.position.z = 0.03;
                engGroup.add(core);

                const haloGeo = new THREE.RingGeometry(eng.r * 0.85, eng.r * 1.25, 24);
                const halo = new THREE.Mesh(haloGeo, engineHaloMat);
                halo.position.z = 0.04;
                engGroup.add(halo);

                enemyGroup.add(engGroup);
            });

            if (dominionFighterTemplate) {
                attachDominionFighterModel(enemyGroup);
            } else {
                pendingDominionFighterShips.push(enemyGroup);
            }

            return enemyGroup;
        }
        
        function createPirateShipMesh() {
            const enemyGroup = new THREE.Group();
            const meshContainer = new THREE.Group();
            enemyGroup.add(meshContainer);

            // Procedural Fallback Hull (while GLB is loading)
            const fallbackGeo = new THREE.ConeGeometry(2.0, 5.0, 4);
            fallbackGeo.rotateX(Math.PI / 2);
            const fallbackMat = new THREE.MeshStandardMaterial({
                color: 0x2e2520, // Dark brownish grey for pirates
                roughness: 0.8,
                metalness: 0.5
            });
            const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
            fallbackMesh.name = "skullRaiderFallbackHull";
            meshContainer.add(fallbackMesh);

            const engineLights = [];
            enemyGroup.userData = {
                hp: 30, // Default pirate HP, overridden in interactions.js
                maxHp: 30,
                name: "Skull Raider",
                flashTimer: 0,
                engineLights: engineLights,
                isEvil: true,
                isPirate: true,
                meshContainer: meshContainer
            };

            const glowColor = 0xffa500; // Orange thrust for pirates
            const engineGlowMat = new THREE.MeshBasicMaterial({
                color: glowColor,
                transparent: true,
                opacity: 0.95
            });
            const engineCoreMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.98
            });
            const engineHaloMat = new THREE.MeshBasicMaterial({
                color: 0xff4500,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });

            // Dual engines for pirate ships
            const enginePositions = [
                { x: -1.5, y: 0.0, z: 4.0, r: 0.6 },
                { x:  1.5, y: 0.0, z: 4.0, r: 0.6 }
            ];

            enginePositions.forEach(eng => {
                const engGroup = new THREE.Group();
                engGroup.position.set(eng.x, eng.y, eng.z);

                const cavityGeo = new THREE.CylinderGeometry(eng.r * 0.85, eng.r * 0.95, 0.45, 16, 1, true);
                const cavityMat = new THREE.MeshBasicMaterial({
                    color: 0x883300,
                    side: THREE.BackSide,
                    transparent: true,
                    opacity: 0.85
                });
                const cavity = new THREE.Mesh(cavityGeo, cavityMat);
                cavity.rotation.x = Math.PI / 2;
                cavity.position.z = -0.22;
                engGroup.add(cavity);

                const diskGeo = new THREE.CircleGeometry(eng.r * 0.90, 24);
                const disk = new THREE.Mesh(diskGeo, engineGlowMat);
                disk.position.z = 0.02;
                engGroup.add(disk);

                const coreGeo = new THREE.CircleGeometry(eng.r * 0.45, 24);
                const core = new THREE.Mesh(coreGeo, engineCoreMat);
                core.position.z = 0.03;
                engGroup.add(core);

                const haloGeo = new THREE.RingGeometry(eng.r * 0.85, eng.r * 1.25, 24);
                const halo = new THREE.Mesh(haloGeo, engineHaloMat);
                halo.position.z = 0.04;
                engGroup.add(halo);

                enemyGroup.add(engGroup);
            });

            if (typeof skullRaiderTemplate !== 'undefined' && skullRaiderTemplate) {
                if (typeof attachSkullRaiderModel === 'function') {
                    attachSkullRaiderModel(enemyGroup);
                }
            } else if (typeof pendingSkullRaiderShips !== 'undefined') {
                pendingSkullRaiderShips.push(enemyGroup);
            }

            return enemyGroup;
        }

        let explosionParticles = [];

        function spawnLaserImpactSparks(pos) {
            for (let i = 0; i < 10; i++) {
                const pMat = sharedExpColors[i % sharedExpColors.length];
                const p = new THREE.Mesh(sharedExpParticleGeo, pMat);
                p.position.copy(pos);
                p.scale.set(0.5, 0.5, 0.5);
                p.userData.vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 8
                );
                p.userData.life = 0.8;
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
                    if (child.isMesh && !child.userData.isShield && child !== playerShieldBubble) {
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
            const firingVolMult = (typeof gameVolumeConfig !== 'undefined') ? (gameVolumeConfig.master * gameVolumeConfig.firing) : 0.60;
            
            // Randomize audio properties for realism (Volume significantly increased per request)
            const pitchVar = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
            const volVar = (0.8 + Math.random() * 0.4) * 1.75 * firingVolMult; // Increased volume multiplier scaled by settings
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
            // removed toast line
        }

        function approachTheCrest() {
            if (!theCrestStation) return;
            const backwardOffset = new THREE.Vector3(240, 56, 500);
            playerShip.position.copy(theCrestStation.position).add(backwardOffset);
            playerShip.lookAt(new THREE.Vector3(79900, -850, -46600));
            targetSpeed = 40;
            currentSpeed = 40;
            const sec = document.getElementById('hud-sector');
            const obj = document.getElementById('hud-objective');
            if (sec) sec.innerText = "TITAN PERIMETER — THE CREST";
            if (obj) obj.innerText = "Escort EDF Interceptor Patrol around The Crest";
            showToast("Approaching The Crest Orbital Platform in Titan Orbit!");
        }

        function approachTitanBombardment() {
            if (!spaceTitan) return;
            // Position player at a high cinematic vantage point overlooking Titan's Kraken Mare crater and the 5 Dreadnoughts firing beams
            const vantagePos = new THREE.Vector3(74600, 200, -42500);
            playerShip.position.copy(vantagePos);
            playerShip.lookAt(titanBombardmentWorldFocus);
            targetSpeed = 45;
            currentSpeed = 45;
            const sec = document.getElementById('hud-sector');
            const obj = document.getElementById('hud-objective');
            if (sec) sec.innerText = "TITAN — KRAKEN MARE EXCAVATION";
            if (obj) obj.innerText = "Observe Dominion dark-energy bombardment melting ice crust to reveal Huge Golden Ring";
            showToast("Approaching Titan Dark-Energy Crater & Methane Lake Excavation!");
        }

        function approachAncientGate() {
            if (!ancientGoldenGate) return;
            const gateWorldPos = ancientGoldenGate.position;
            const offset = new THREE.Vector3(0, 180, 850);
            playerShip.position.copy(gateWorldPos).add(offset);
            playerShip.lookAt(gateWorldPos);
            targetSpeed = 50;
            currentSpeed = 50;
            const sec = document.getElementById('hud-sector');
            const obj = document.getElementById('hud-objective');
            if (sec) sec.innerText = "ANCIENT PRECURSOR GOLDEN RING";
            if (obj) obj.innerText = "Investigate the moon-sized Golden Wormhole Gate pulled into orbit by purple tractor beams";
            showToast("Approaching Ancient Precursor Golden Ring Gate in Titan Orbit!");
        }

        function triggerWormholeJump() {
            isWormholeActive = true;
            const sec = document.getElementById('hud-sector');
            const obj = document.getElementById('hud-objective');
            if (sec) sec.innerText = "SLIPSPACE WORMHOLE HYPERSPACE TUNNEL";
            if (obj) obj.innerText = "Transitioning through Ancient Golden Gate to Sovereign Reach...";
            showToast("🌀 ANCIENT GOLDEN GATE ENGAGED — SLIPSPACE WARP ACTIVE!");

            if (ancientGoldenGate) {
                // Position player right in front of the golden gate's event horizon vortex heading through
                playerShip.position.copy(ancientGoldenGate.position).add(new THREE.Vector3(0, 0, 180));
                playerShip.lookAt(ancientGoldenGate.position.clone().add(new THREE.Vector3(0, 0, -500)));
                targetSpeed = 350;
                currentSpeed = 350;
            }
        }

        function approachCapitalShip() {
            const targetShip = capitalShip || (capitalShips.length > 0 ? capitalShips[0] : null);
            if (!targetShip) return;
            const backwardOffset = new THREE.Vector3(0, 140, 750).applyQuaternion(targetShip.quaternion);
            playerShip.position.copy(targetShip.position).add(backwardOffset);
            playerShip.quaternion.copy(targetShip.quaternion);
            targetSpeed = 80;
            currentSpeed = 80;
            const sec = document.getElementById('hud-sector');
            const obj = document.getElementById('hud-objective');
            if (sec) sec.innerText = "DOMINION SIEGE VECTOR — TITAN / THE CREST";
            if (obj) obj.innerText = "Intercept Dominion Flagship 'Iron Sovereign' in Formation";
            // removed toast line
        }

        // =========================================================================
        // 🎬 TITAN GATE WORMHOLE CINEMATIC SEQUENCE & ELEVENLABS DIALOGUE ENGINE
        // =========================================================================
        let isTitanCinematicActive = false;
        let isTitanCinematicEnteringGate = false;
        let titanCinematicAudio = null;
        let titanCinematicIndex = 0;
        let titanCinematicTimeout = null;

        const titanCinematicScript = [
            // --- PART A: FLEET EMERGENCE & TITAN EXTRACTION ---
            {
                id: "titan_arrival_01_kaylen",
                speaker: "KAYLEN VANCE",
                subspeaker: "VOID INTERCEPTOR COCKPIT / TACTICAL COMMS",
                theme: "speaker-kaylen",
                icon: "🚨",
                camMode: 2, // Far Third Person (Panoramic Vista)
                speed: 0, // Void engines shut off!
                text: "What is going on?! We are being attacked! By... by... I don't know who!",
                audioSrc: "audio/cinematics/titan_gate/titan_arrival_01_kaylen.mp3"
            },
            {
                id: "titan_arrival_02_kaylen",
                speaker: "KAYLEN VANCE",
                subspeaker: "VOID INTERCEPTOR COCKPIT / SENSOR TELEMETRY",
                theme: "speaker-kaylen",
                icon: "📡",
                camMode: 2, // Far Third Person (Panoramic Vista)
                speed: 0, // Void engines shut off!
                text: "They're attacking Titan! Actually... it looks like they're looking for something...",
                audioSrc: "audio/cinematics/titan_gate/titan_arrival_02_kaylen.mp3"
            },
            {
                id: "titan_arrival_03_kaylen",
                speaker: "KAYLEN VANCE",
                subspeaker: "VOID INTERCEPTOR COCKPIT / OPTICAL SCAN",
                theme: "speaker-kaylen",
                icon: "👁️",
                camMode: 2, // Far Third Person (Panoramic Vista)
                speed: 0, // Void engines shut off!
                text: "There is some kind of giant circle down on Titan. They are pulling up out of the ice. I think they may be creating a wormhole.",
                audioSrc: "audio/cinematics/titan_gate/titan_arrival_03_kaylen.mp3"
            },
            {
                id: "titan_arrival_04_kaylen",
                speaker: "KAYLEN VANCE",
                subspeaker: "VOID INTERCEPTOR COCKPIT / MAYDAY CALL",
                theme: "speaker-kaylen",
                icon: "🚨",
                camMode: 2, // Far Third Person (Panoramic Vista)
                speed: 0, // Void engines shut off!
                text: "Oh no... The Crest!! NOOO!!",
                audioSrc: "audio/cinematics/titan_gate/titan_arrival_04_kaylen.mp3"
            },
            // --- PART B: MARS COMMS & PRECURSOR RIFT DIVE ---
            {
                id: "titan_gate_01_elias",
                speaker: "ELIAS VANCE",
                subspeaker: "MARS COMMS / HYPERWAVE OVERRIDE",
                theme: "speaker-elias",
                icon: "📻",
                camMode: 2, // Far Third Person (Panoramic Vista)
                speed: 0, // Void engines shut off!
                text: "Kaylen! Kaylen, do you read me?! The long-range sensors on Mars just went red—The Crest is gone from the grid! Report in, kid!",
                audioSrc: "audio/cinematics/titan_gate/titan_gate_01_elias.mp3"
            },
            {
                id: "titan_gate_02_kaylen",
                speaker: "KAYLEN VANCE",
                subspeaker: "VOID INTERCEPTOR COCKPIT",
                theme: "speaker-kaylen",
                icon: "🚀",
                camMode: 1, // Rear Third-Person Close (Ship clearly visible)
                speed: 0, // Void engines shut off!
                text: "Elias... we're under attack! They wiped out the fleet. The kinetic rounds bounced right off their hulls. They're lining up their dreadnoughts on the rift right now.",
                audioSrc: "audio/cinematics/titan_gate/titan_gate_02_kaylen.mp3"
            },
            {
                id: "titan_gate_03_elias",
                speaker: "ELIAS VANCE",
                subspeaker: "MARS COMMS / HYPERWAVE OVERRIDE",
                theme: "speaker-elias",
                icon: "📻",
                camMode: 2, // Far Third Person
                speed: 120,
                text: "Then break off and burn hard for the outer moons! Divert everything to afterburners! I'm spooling the freighter down in the slums—I will come get you, son!",
                audioSrc: "audio/cinematics/titan_gate/titan_gate_03_elias.mp3"
            },
            {
                id: "titan_gate_04_kaylen",
                speaker: "KAYLEN VANCE",
                subspeaker: "VOID INTERCEPTOR COCKPIT",
                theme: "speaker-kaylen",
                icon: "🚀",
                camMode: 1, // Rear Third-Person Close (Ship clearly visible)
                speed: 140,
                text: "You know my fuel reserves, Elias. I can't outrun them. If those dreadnoughts cross this threshold, Sol doesn't have a defense left. Earth won't last twenty minutes.",
                audioSrc: "audio/cinematics/titan_gate/titan_gate_04_kaylen.mp3"
            },
            {
                id: "titan_gate_05_elias",
                speaker: "ELIAS VANCE",
                subspeaker: "MARS COMMS / HYPERWAVE OVERRIDE",
                theme: "speaker-elias",
                icon: "📻",
                camMode: 2, // Far Third Person
                speed: 160,
                text: "No... No, look at the telemetry! The gravitational shear inside that ring is tearing atoms apart! You take that interceptor in there, you'll be vaporized!",
                audioSrc: "audio/cinematics/titan_gate/titan_gate_05_elias.mp3"
            },
            {
                id: "titan_gate_06_kaylen",
                speaker: "KAYLEN VANCE",
                subspeaker: "VOID INTERCEPTOR COCKPIT / PENDANT RESONANCE",
                theme: "speaker-kaylen",
                icon: "💎",
                camMode: 1, // Rear Third-Person Close (Ship clearly visible)
                speed: 180,
                text: "It's vibrating, Elias. The pendant you found me with... it's singing with the gate. It's the same frequency. It knows what to do.",
                audioSrc: "audio/cinematics/titan_gate/titan_gate_06_kaylen.mp3"
            },
            {
                id: "titan_gate_07_elias",
                speaker: "ELIAS VANCE",
                subspeaker: "MARS COMMS / HYPERWAVE OVERRIDE",
                theme: "speaker-elias",
                icon: "📻",
                camMode: 2, // Far Third Person
                speed: 200,
                text: "Kaylen, listen to me! You don't know what that thing is—what you are! I promised myself I'd keep you safe from all this... Don't you throw your life away for a war that isn't yours!",
                audioSrc: "audio/cinematics/titan_gate/titan_gate_07_elias.mp3"
            },
            {
                id: "titan_gate_08_kaylen",
                speaker: "KAYLEN VANCE",
                subspeaker: "VOID INTERCEPTOR COCKPIT",
                theme: "speaker-kaylen",
                icon: "🚀",
                camMode: 1, // Rear Third-Person Close (Ship clearly visible)
                speed: 220,
                text: "You gave me twenty years, old man. You taught me how to fly, how to fight, and how to fix broken things. Earth is my home because you're on it.",
                audioSrc: "audio/cinematics/titan_gate/titan_gate_08_kaylen.mp3"
            },
            {
                id: "titan_gate_09_elias",
                speaker: "ELIAS VANCE",
                subspeaker: "MARS COMMS / HYPERWAVE OVERRIDE",
                theme: "speaker-elias",
                icon: "📻",
                camMode: 2, // Far Third Person
                speed: 250,
                text: "Kaylen, NO! Turn the ship around! KAYLEN—",
                audioSrc: "audio/cinematics/titan_gate/titan_gate_09_elias.mp3"
            },
            {
                id: "titan_gate_10_kaylen",
                speaker: "KAYLEN VANCE",
                subspeaker: "VOID INTERCEPTOR COCKPIT / OVERDRIVE BURST",
                theme: "speaker-kaylen",
                icon: "✨",
                camMode: 1, // Rear Close diving in
                speed: 250, // Will jump to 1200 later
                text: "Someone has to shut the door, old man. ... See you on the other side, Dad....",
                audioSrc: "audio/cinematics/titan_gate/titan_gate_10_kaylen.mp3"
            }
        ];

        function startTitanGateCinematic() {
            if (!ancientGoldenGate) return;
            window.mission3Active = true;
            window.isMission3Active = true;
            if (typeof hasTitanCinematicPlayed !== 'undefined') hasTitanCinematicPlayed = true;

            isTitanCinematicActive = true;
            isTitanCinematicEnteringGate = false;
            isFlightLocked = true; // USER CONTROL LOCKED: WATCH-ONLY CINEMATIC MODE!
            isShipInvincible = true; // 100% Invulnerable during cinematic!
            isWormholeActive = false;
            titanCinematicIndex = 0;

            const blackout = document.getElementById('cinematic-blackout-overlay');
            if (blackout) blackout.classList.remove('active');

            const endModal = document.getElementById('cinematic-end-modal');
            if (endModal) {
                endModal.style.display = 'none';
                endModal.classList.remove('active');
            }

            // Hide capital ships and reset fleet state so NO Dominion ships exist during initial 7s
            if (capitalShips && capitalShips.length > 0) {
                capitalShips.forEach(ship => ship.visible = false);
            }
            if (typeof fleetEmergenceActive !== 'undefined') fleetEmergenceActive = false;
            if (typeof isTitanExcavationStarted !== 'undefined') isTitanExcavationStarted = false;
            if (typeof playedArrivalStages !== 'undefined') {
                playedArrivalStages = { stage1: false, stage2: false, stage3: false, stage4: false };
            }

            // Ensure Ancient Golden Gate is placed in Titan orbit
            ancientGoldenGate.position.copy(titanExtractionOrbitWorldPos);
            ancientGoldenGate.quaternion.copy(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI * 0.5, 0.15, 0)));
            ancientGoldenGate.scale.set(2.0, 2.0, 2.0);
            ancientGoldenGate.visible = true;

            // Teleport player ship behind the Dominion Dreadnought line (at z = -40000) facing Titan and The Crest (at z = -45500)
            playerShip.position.set(75200, 150, -40000);
            playerShip.rotation.set(0, 0, 0);
            playerShip.quaternion.set(0, 0, 0, 1);
            playerShip.lookAt(new THREE.Vector3(75200, -600, -45500));
            playerShip.rotateY(Math.PI); // Mesh orientation correction so cockpit faces Dreadnoughts, Titan & The Crest!
            
            cameraMode = 2; // Far Third Person (Panoramic Vista)
            playerShip.visible = true;
            targetSpeed = 0; // Void engines shut off to begin cinematic!
            currentSpeed = 0;

            // Instantly snap camera behind player ship looking forward over the Dreadnought line at Titan & The Crest
            if (camera) {
                const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(playerShip.quaternion);
                camera.up.copy(localUp);
                const initCamOffset = new THREE.Vector3(0, 12.0, 35.0).applyQuaternion(playerShip.quaternion);
                camera.position.copy(playerShip.position).add(initCamOffset);
                const targetLookAt = playerShip.position.clone().add(new THREE.Vector3(0, 0, -100).applyQuaternion(playerShip.quaternion));
                camera.lookAt(targetLookAt);
                camera.updateMatrixWorld();
            }

            // Display comms overlay & HUD headers immediately on teleport
            const overlay = document.getElementById('cinematic-comms-overlay');
            if (overlay) overlay.style.display = 'block';

            const sec = document.getElementById('hud-sector');
            const obj = document.getElementById('hud-objective');
            if (sec) sec.innerText = "DOMINION SIEGE VECTOR — TITAN / THE CREST";
            if (obj) obj.innerText = "INTERCEPTED HYPERWAVE OVERRIDE — TITAN SECTOR";

            showToast("🎬 TITAN GATE CINEMATIC: Teleported to Titan Vista (Controls Locked)");

            // Schedule the 5 Dominion Capital Ships to emerge strictly 7.0 SECONDS LATER while dialogue plays
            if (window.titanEmergenceTimer) clearTimeout(window.titanEmergenceTimer);
            window.titanEmergenceTimer = setTimeout(() => {
                if (isTitanCinematicActive) {
                    if (typeof triggerDominionFleetHyperspaceEmergence === 'function') {
                        triggerDominionFleetHyperspaceEmergence();
                    }
                }
            }, 7000);

            // Immediately start dialogue (Elias & Kaylen: "Elias... we're under attack!")
            playNextCinematicLine();
        }

        function playNextCinematicLine() {
            if (!isTitanCinematicActive) return;

            if (titanCinematicIndex >= titanCinematicScript.length) {
                finishTitanGateCinematic();
                return;
            }

            if (titanCinematicTimeout) {
                clearTimeout(titanCinematicTimeout);
                titanCinematicTimeout = null;
            }

            const currentStepIndex = titanCinematicIndex;
            const lineData = titanCinematicScript[currentStepIndex];
            
            // Switch camera mode per cinematic line
            if (lineData.camMode !== undefined) {
                cameraMode = lineData.camMode;
            }
            playerShip.visible = true;
            targetSpeed = lineData.speed;
            currentSpeed = Math.max(currentSpeed, lineData.speed * 0.85);

            // On final line (titan_gate_10_kaylen), hold speed until "Dad" is spoken before hyper-accelerating into gate
            if (currentStepIndex === 13) {
                targetSpeed = 150;
                setTimeout(() => {
                    if (!isTitanCinematicActive) return;
                    isTitanCinematicEnteringGate = true;
                    cameraMode = 1;
                    targetSpeed = 1500;
                    currentSpeed = 1000;
                }, 7500);
            }

            // Update UI elements
            const commsBox = document.getElementById('cinematic-comms-box');
            const commsSpeaker = document.getElementById('comms-speaker');
            const commsSubspeaker = document.getElementById('comms-subspeaker');
            const commsSubtitle = document.getElementById('comms-subtitle');
            const commsBadge = document.getElementById('comms-step-badge');
            const commsIcon = document.getElementById('comms-avatar-icon');

            if (commsBox) {
                commsBox.className = 'cinematic-comms-box ' + lineData.theme;
            }
            if (commsSpeaker) commsSpeaker.innerText = lineData.speaker;
            if (commsSubspeaker) commsSubspeaker.innerText = lineData.subspeaker;
            if (commsSubtitle) commsSubtitle.innerText = `"${lineData.text}"`;
            if (commsBadge) commsBadge.innerText = `${currentStepIndex + 1} / ${titanCinematicScript.length}`;
            if (commsIcon) commsIcon.innerText = lineData.icon;

            // Stop previous voice audio
            if (titanCinematicAudio) {
                titanCinematicAudio.onended = null;
                titanCinematicAudio.onerror = null;
                titanCinematicAudio.pause();
                titanCinematicAudio = null;
            }

            let hasAdvanced = false;
            const advanceLine = () => {
                if (hasAdvanced || !isTitanCinematicActive) return;
                if (titanCinematicIndex !== currentStepIndex) return;
                hasAdvanced = true;
                
                if (titanCinematicAudio) {
                    titanCinematicAudio.onended = null;
                    titanCinematicAudio.onerror = null;
                }
                if (titanCinematicTimeout) {
                    clearTimeout(titanCinematicTimeout);
                    titanCinematicTimeout = null;
                }
                
                titanCinematicIndex++;
                titanCinematicTimeout = setTimeout(() => {
                    playNextCinematicLine();
                }, 400); // slight pause between transmissions
            };

            // Estimate duration based on text length (~12 chars per second) with safety bounds
            const textLen = (lineData.text || '').length;
            const estimatedMs = Math.max(6000, Math.min(15000, Math.ceil(textLen / 12) * 1000 + 3500));

            // Absolute fail-safe timeout so sequence NEVER hangs even if audio fails/stalls
            titanCinematicTimeout = setTimeout(() => {
                console.warn(`[Titan Cinematic] Line ${currentStepIndex + 1} fail-safe timeout reached. Advancing.`);
                advanceLine();
            }, estimatedMs);

            try {
                titanCinematicAudio = new Audio(lineData.audioSrc);
                titanCinematicAudio.volume = 1.0;

                titanCinematicAudio.onloadedmetadata = () => {
                    if (titanCinematicAudio && titanCinematicAudio.duration && isFinite(titanCinematicAudio.duration)) {
                        const audioMs = Math.ceil(titanCinematicAudio.duration * 1000) + 1500;
                        if (titanCinematicTimeout) clearTimeout(titanCinematicTimeout);
                        titanCinematicTimeout = setTimeout(() => {
                            console.warn(`[Titan Cinematic] Line ${currentStepIndex + 1} audio duration timeout. Advancing.`);
                            advanceLine();
                        }, audioMs);
                    }
                };

                titanCinematicAudio.onended = () => {
                    advanceLine();
                };

                titanCinematicAudio.onerror = (e) => {
                    console.warn("[Titan Cinematic] Audio playback error:", e);
                    advanceLine();
                };

                titanCinematicAudio.play().catch(e => {
                    console.warn("[Titan Cinematic] Audio play prevented:", e);
                    advanceLine();
                });
            } catch (err) {
                console.warn("[Titan Cinematic] Audio init exception:", err);
                advanceLine();
            }
        }

        function finishTitanGateCinematic() {
            if (!isTitanCinematicActive) return;

            // Lock camera behind the Void Interceptor in dramatic third-person view so player flies through the ring
            cameraMode = 1;
            playerShip.visible = true;
            isShipInvincible = true;

            // Hide comms overlay to leave the view completely cinematic and clean
            const overlay = document.getElementById('cinematic-comms-overlay');
            if (overlay) overlay.style.display = 'none';

            // Accelerate ship at full overdrive thrust straight through the ring
            isTitanCinematicEnteringGate = true;
            targetSpeed = 2000;
            currentSpeed = 2000;

            const sec = document.getElementById('hud-sector');
            const obj = document.getElementById('hud-objective');
            if (sec) sec.innerText = "OVERDRIVE ENGAGED — SLIPSPACE THRESHOLD";
            if (obj) obj.innerText = "⚡ PENETRATING THE ANCIENT PRECURSOR SINGULARITY...";

            showToast("⚡ OVERDRIVE ENGAGED — ENTERING SLIPSPACE SINGULARITY!");
        }

        function stopTitanGateCinematic() {
            isTitanCinematicActive = false;
            isTitanCinematicEnteringGate = false;
            isFlightLocked = false; // Restore user controls
            isShipInvincible = (cameraMode === 3);
            // document.body.classList.remove('in-cinematic-mode');

            if (titanCinematicAudio) {
                titanCinematicAudio.pause();
                titanCinematicAudio = null;
            }
            if (titanCinematicTimeout) {
                clearTimeout(titanCinematicTimeout);
                titanCinematicTimeout = null;
            }

            const overlay = document.getElementById('cinematic-comms-overlay');
            if (overlay) overlay.style.display = 'none';

            const flash = document.getElementById('cinematic-flash-overlay');
            if (flash) flash.classList.remove('active');

            const blackout = document.getElementById('cinematic-blackout-overlay');
            if (blackout) blackout.classList.remove('active');

            showToast("Cinematic ended. Flight control restored.");
        }

        function closeCinematicEndModal() {
            const endModal = document.getElementById('cinematic-end-modal');
            if (endModal) {
                endModal.classList.remove('active');
                setTimeout(() => endModal.style.display = 'none', 600);
            }
            stopTitanGateCinematic();
        }

        function resetSimView() {
            if (typeof isTitanCinematicActive !== 'undefined' && isTitanCinematicActive) {
                stopTitanGateCinematic();
            }
            playerShip.position.set(theCrestStation.position.x + 800, theCrestStation.position.y, theCrestStation.position.z);
            playerShip.rotation.set(0, 0, 0);
            playerShip.quaternion.set(0, 0, 0, 1);
            playerShip.lookAt(theCrestStation.position);
            playerShip.rotateY(Math.PI); // 180-degree rotation so cockpit faces the hanger!
            if (camera) {
                const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(playerShip.quaternion);
                camera.up.copy(localUp);
                const initCamOffset = new THREE.Vector3(0, 6.0, 22.0).applyQuaternion(playerShip.quaternion);
                camera.position.copy(playerShip.position).add(initCamOffset);
                const targetLookAt = playerShip.position.clone().add(new THREE.Vector3(0, 0, -50).applyQuaternion(playerShip.quaternion));
                camera.lookAt(targetLookAt);
            }
            targetSpeed = 0;
            currentSpeed = 0;
            isWormholeActive = false;
            const sec = document.getElementById('hud-sector');
            const obj = document.getElementById('hud-objective');
            if (sec) sec.innerText = "TITAN VISTA — SATURN / THE CREST SECTOR";
            if (obj) obj.innerText = "Monitor Titan perimeter as Dominion Siege Fleet drops out of hyperspace";
            showToast("Flight position reset to panoramic vista facing The Crest, Titan, and Saturn!");
        }

        let lastTime = performance.now();
