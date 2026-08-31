const _targetWorldPos = new THREE.Vector3();
        const _targetBBox = new THREE.Box3();
        const _targetSizeVec = new THREE.Vector3();

        window.inHangerZone = false;

        function animate() {
            requestAnimationFrame(animate);
            const now = performance.now();
            let timeDelta = (now - lastTime) / 1000;
            lastTime = now;
            // Clamp timeDelta to prevent huge jumps if browser tab loses focus (max 0.1s = 10 FPS min)
            if (timeDelta > 0.1) timeDelta = 0.1;
            const dtFactor = timeDelta * 60.0; // Benchmark 1.0 at 60 FPS for 100% consistent physics

            if (isTacticalMapOpen) {
                renderTacticalMap3D();
            }

            if (isGamePaused) {
                if (!isTacticalMapOpen) {
                    renderUpgradeHangar3D();
                }
                return;
            }

            if (isTitanCinematicActive || isLandingSequenceActive) {
                // Automatic cinematic engine throttle management
                currentSpeed += (targetSpeed - currentSpeed) * Math.min(1.0, 0.05 * dtFactor);
            } else {
                // --- W / S Throttle Speed Controls (W = Accelerate, S = Decelerate) ---
                let _throttle = gameMechanicsConfig.throttleAccel !== undefined ? gameMechanicsConfig.throttleAccel : 50;
                if (_throttle > 100) _throttle = 100;
                const throttleMult = (_throttle / 100) * 5.0;
                const accelRate = 2.46 * throttleMult * dtFactor; 

                if (keys.KeyW) targetSpeed = Math.min(targetSpeed + accelRate, maxSpeedCap);
                if (keys.KeyS) targetSpeed = Math.max(targetSpeed - accelRate, 0);
                currentSpeed += (targetSpeed - currentSpeed) * Math.min(1.0, 0.022 * throttleMult * dtFactor);
            }

            // Update Cockpit Engine Sound Pitch, Muffling & Volume dynamically (0% -> 100% Throttle)
            updateEngineAudio(currentSpeed / maxSpeedCap, cameraMode === 0);

            const postedSpeed = Math.round(currentSpeed * (700 / maxSpeedCap)); // Posted speed scaled to max 700 km/s (40% boost)
            const speedElem = document.getElementById('hud-speed');
            if (speedElem) speedElem.innerText = `SPEED: ${postedSpeed.toLocaleString()} km/s ${currentSpeed > (maxSpeedCap * 0.9) ? '[MAX THROTTLE]' : ''}`;

            // --- SINGULARITY-FREE 360° QUATERNION FLIGHT (LOOPS & ROLLS WITHOUT FLIPPING) ---
            const deadzone = 0.03;
            // Slider is 10% to 100%. Map 10% to a slow turn, 100% to an insanely fast turn.
            let rawTurnValue = gameMechanicsConfig.turnSpeed !== undefined ? gameMechanicsConfig.turnSpeed : 50;
            // Clamp to 100 to fix old profiles that might have saved "150" or "1000"
            if (rawTurnValue > 100) rawTurnValue = 100;
            
            // Map 10-100 to a multiplier. 
            // 50% = 1.5x (old default)
            // 100% = 15.0x (insanely fast)
            // 10% = 0.5x (very slow)
            // We can use an exponential curve: 
            const normalized = rawTurnValue / 100.0; // 0.1 to 1.0
            const turnMult = Math.pow(normalized, 2) * 15.0; // At 1.0 -> 15.0x. At 0.5 -> 3.75x. At 0.3 -> 1.35x.
            
            const turnRate = 0.0052 * turnMult;

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

            if (isTitanCinematicActive && ancientGoldenGate) {
                // In cinematic mode, guide ship smoothly toward and through the Ancient Precursor Gate center
                const gateCenter = ancientGoldenGate.position.clone();
                const holdingThresholdZ = -44200; // 400 units in front of gate center (-44600)
                
                // Clamp position so the ship holds in front of the gate and never enters early
                if (!isTitanCinematicEnteringGate) {
                    if (playerShip.position.z < holdingThresholdZ) {
                        playerShip.position.z = holdingThresholdZ;
                    }
                }

                const toGate = gateCenter.clone().sub(playerShip.position);
                const distToGate = toGate.length();
                const dirToGate = toGate.clone().normalize();

                // Aim ship smoothly along forward vector toward the gate
                playerShip.lookAt(playerShip.position.clone().sub(dirToGate));

                const hasCrossedRingPlane = (playerShip.position.z <= gateCenter.z + 30);

                // ONLY trigger gate penetration and singularity jump on final line / overdrive dive
                if ((isTitanCinematicEnteringGate) && (distToGate < 120 || hasCrossedRingPlane)) {
                    if (!isWormholeActive) {
                        isWormholeActive = true;
                        isTitanCinematicEnteringGate = false;
                        targetSpeed = 0;
                        currentSpeed = 0;
                        
                        // Quick blinding relativistic flash pulse
                        const flash = document.getElementById('cinematic-flash-overlay');
                        if (flash) {
                            flash.classList.add('active');
                            setTimeout(() => flash.classList.remove('active'), 600);
                        }
                        
                        // Play space-time tear hyperspace crack sound
                        playHyperspaceCrackAudio(playerShip.position);

                        // Fade to black as Void Interceptor penetrates the deep wormhole singularity
                        setTimeout(() => {
                            const blackout = document.getElementById('cinematic-blackout-overlay');
                            if (blackout) {
                                blackout.classList.add('active');
                            }
                        }, 250);

                        // Reveal Wing Commander 3 Seamless Flight Deck Transition Hub over blacked out screen
                        setTimeout(() => {
                            const blackout = document.getElementById('cinematic-blackout-overlay');
                            if (blackout) blackout.classList.add('active');

                            if (typeof triggerMissionDebriefSequence === 'function') {
                                triggerMissionDebriefSequence({
                                    title: "ACT I COMPLETE — THE SOL GATE SEVERED",
                                    status: "SLIPSPACE TRANSIT / UNKNOWN SECTOR",
                                    kills: 14,
                                    accuracy: "92%",
                                    hull: "100%",
                                    wingman: "ACTIVE (MARS HYPERWAVE)",
                                    speaker: "ELIAS VANCE",
                                    subspeaker: "MARS FLIGHT COMMAND / HYPERWAVE OVERRIDE",
                                    quote: "Kaylen, your signature just stabilized across the rift! The wormhole collapsed behind you—Earth is safe for now. Prepare your interceptor for vanguard reconnaissance in this new sector!",
                                    icon: "📻",
                                    audioSrc: "audio/cinematics/mission_1/mission1_01_elias.mp3"
                                });
                            } else {
                                const endModal = document.getElementById('cinematic-end-modal');
                                if (endModal) {
                                    endModal.style.display = 'flex';
                                    setTimeout(() => endModal.classList.add('active'), 50);
                                }
                            }
                        }, 1400);
                    }
                }
            }
            
            updateBlastDoors(dtFactor);

            if (isLandingSequenceActive && theCrestStation && theCrestStation.userData.hangerModel) {
                updateLandingSequence(dtFactor);
            } else {
                // Apply local pitch (X) and yaw (Y) quaternion rotations directly
                // Allows full 360° loop-de-loops over the top without any view snapping or gimbal flips!
                if (!isFlightLocked) {
                    playerShip.rotateX(totalPitch * turnRate * dtFactor);
                    playerShip.rotateY(totalYaw * turnRate * dtFactor);
                }

                // A/D Keys for rolling the ship (very slowly)
                let _roll = gameMechanicsConfig.rollSpeed !== undefined ? gameMechanicsConfig.rollSpeed : 50;
                if (_roll > 100) _roll = 100;
                const rollRate = turnRate * 0.4 * ((_roll / 100) * 2.5);
                if (keys.KeyA) playerShip.rotateZ(rollRate * dtFactor);
                if (keys.KeyD) playerShip.rotateZ(-rollRate * dtFactor);
            }

            // Move ship forward (In cinematic, moves directly along guided path toward the Ancient Gate; in free flight, uses ship heading)
            let frameDisplacement;
            if (isTitanCinematicActive && ancientGoldenGate) {
                const toGate = ancientGoldenGate.position.clone().sub(playerShip.position);
                const dirToGate = toGate.clone().normalize();
                
                // If approaching before line 10 and reached holding position, maintain position
                if (titanCinematicIndex < 9 && !isTitanCinematicEnteringGate && playerShip.position.z <= -44180) {
                    frameDisplacement = new THREE.Vector3(0, 0, 0);
                } else {
                    const speedMult = (titanCinematicIndex >= 9 || isTitanCinematicEnteringGate) ? 1.0 : 1.35;
                    frameDisplacement = dirToGate.clone().multiplyScalar(currentSpeed * 0.0064 * speedMult * dtFactor);
                }
            } else if (isLandingSequenceActive) {
                frameDisplacement = new THREE.Vector3(0, 0, 0); // Position is fully controlled by updateLandingSequence
            } else {
                const moveDir = new THREE.Vector3(0, 0, -1).applyQuaternion(playerShip.quaternion);
                frameDisplacement = moveDir.clone().multiplyScalar(currentSpeed * 0.0064 * dtFactor);
            }
            const oldPos = playerShip.position.clone();
            const oldQuat = playerShip.quaternion.clone();
            playerShip.position.add(frameDisplacement);

            // Prevent clipping into planet (Smooth sliding atmospheric repulsor buffer)
            if (spacePlanet) {
                const planetRadius = 9000;
                const bufferZone = -1500; // Allow flying 1500 units deep into Saturn's atmosphere
                const distToCore = playerShip.position.distanceTo(spacePlanet.position);
                
                // Dynamic Atmosphere / Fog for Saturn
                const atmosphereStart = planetRadius + 3000; // Start getting foggy 3000 units above surface
                const maxDepth = planetRadius + bufferZone;
                
                if (distToCore < atmosphereStart) {
                    const baseColor = new THREE.Color(0x070913);
                    const saturnColor = new THREE.Color(0xd4a359);
                    
                    if (distToCore > planetRadius) {
                        // Approach phase (outside the planet)
                        let approachFactor = 1.0 - ((distToCore - planetRadius) / 3000);
                        scene.fog.color.copy(baseColor).lerp(saturnColor, approachFactor * 0.5);
                        scene.fog.density = 0.00003 + (0.0005 * approachFactor);
                    } else {
                        // Inside Saturn: every 10 units = 2% more opacity
                        const depthIntoSaturn = planetRadius - distToCore;
                        const opacityPercent = depthIntoSaturn * 0.002; // (depth / 10) * 0.02
                        
                        scene.fog.color.copy(saturnColor);
                        // At 100% opacity (depth = 500), density becomes extremely dense (0.05)
                        scene.fog.density = 0.00053 + (opacityPercent * 0.05); 
                    }
                } else {
                    scene.fog.color.setHex(0x070913);
                    scene.fog.density = 0.00003;
                }

                if (distToCore < planetRadius + bufferZone) {
                    const pushOutDir = playerShip.position.clone().sub(spacePlanet.position).normalize();
                    playerShip.position.copy(spacePlanet.position).add(pushOutDir.multiplyScalar(planetRadius + bufferZone));
                    
                    // Optionally show a warning UI tag if they are hitting the barrier
                    if (currentSpeed > 50) {
                        const statusTag = document.getElementById('throttle-status-tag');
                        if (statusTag && Math.random() < 0.1) {
                            statusTag.innerText = 'CRITICAL PRESSURE';
                            statusTag.style.color = '#ef4444';
                            setTimeout(() => {
                                if (statusTag.innerText === 'CRITICAL PRESSURE') {
                                    statusTag.innerText = 'STABLE';
                                    statusTag.style.color = '#f59e0b';
                                }
                            }, 500);
                        }
                    }
                }
            }

            // Prevent clipping into Titan (Smooth sliding atmospheric repulsor buffer)
            if (spaceTitan) {
                const titanRadius = 1100;
                const titanBuffer = 80;
                const distToTitan = playerShip.position.distanceTo(spaceTitan.position);
                
                if (distToTitan < titanRadius + titanBuffer) {
                    const pushOutDir = playerShip.position.clone().sub(spaceTitan.position).normalize();
                    playerShip.position.copy(spaceTitan.position).add(pushOutDir.multiplyScalar(titanRadius + titanBuffer));
                    
                    if (currentSpeed > 50) {
                        const statusTag = document.getElementById('throttle-status-tag');
                        if (statusTag && Math.random() < 0.1) {
                            statusTag.innerText = 'TITAN REPULSE';
                            statusTag.style.color = '#f59e0b';
                            setTimeout(() => {
                                if (statusTag.innerText === 'TITAN REPULSE') {
                                    statusTag.innerText = 'STABLE';
                                    statusTag.style.color = '#f59e0b';
                                }
                            }, 500);
                        }
                    }
                }
            }

            // Prevent clipping into other Solar System Planets
            if (solarSystemPlanets) {
                solarSystemPlanets.forEach(p => {
                    if (p.group) {
                        let pRadius = 1000;
                        if (p.mesh && p.mesh.geometry && p.mesh.geometry.parameters) {
                            pRadius = p.mesh.geometry.parameters.radius;
                        }
                        const pBuffer = 80;
                        const distToP = playerShip.position.distanceTo(p.group.position);
                        
                        if (distToP < pRadius + pBuffer) {
                            const pushOutDir = playerShip.position.clone().sub(p.group.position).normalize();
                            playerShip.position.copy(p.group.position).add(pushOutDir.multiplyScalar(pRadius + pBuffer));
                            
                            if (currentSpeed > 50) {
                                const statusTag = document.getElementById('throttle-status-tag');
                                if (statusTag && Math.random() < 0.1) {
                                    statusTag.innerText = p.name.toUpperCase() + ' REPULSE';
                                    statusTag.style.color = '#' + new THREE.Color(p.baseColor).getHexString();
                                    setTimeout(() => {
                                        if (statusTag.innerText === p.name.toUpperCase() + ' REPULSE') {
                                            statusTag.innerText = 'STABLE';
                                            statusTag.style.color = '#f59e0b';
                                        }
                                    }, 500);
                                }
                            }
                        }
                    }
                });
            }

            // Prevent clipping into the Solar Sun
            if (spaceSun) {
                const sunRadius = 30000;
                const sunBuffer = 800; // Larger buffer because it's a massive star with corona
                const distToSun = playerShip.position.distanceTo(spaceSun.position);
                
                if (distToSun < sunRadius + sunBuffer) {
                    const pushOutDir = playerShip.position.clone().sub(spaceSun.position).normalize();
                    playerShip.position.copy(spaceSun.position).add(pushOutDir.multiplyScalar(sunRadius + sunBuffer));
                    
                    if (currentSpeed > 50) {
                        const statusTag = document.getElementById('throttle-status-tag');
                        if (statusTag && Math.random() < 0.1) {
                            statusTag.innerText = 'SOLAR REPULSE';
                            statusTag.style.color = '#f59e0b';
                            setTimeout(() => {
                                if (statusTag.innerText === 'SOLAR REPULSE') {
                                    statusTag.innerText = 'STABLE';
                                    statusTag.style.color = '#f59e0b';
                                }
                            }, 500);
                        }
                    }
                }
            }

            // Prevent flying through Enemy Fighters
            if (!isShipInvincible && !isPlayerDead && typeof enemyShips !== 'undefined') {
                const fighterCollisionRadius = 18; 
                for (let i = 0; i < enemyShips.length; i++) {
                    const enemy = enemyShips[i];
                    if (!enemy || enemy.userData.isDead) continue;
                    
                    const distToEnemy = playerShip.position.distanceTo(enemy.position);
                    if (distToEnemy < fighterCollisionRadius * 2) {
                        const pushOutDir = playerShip.position.clone().sub(enemy.position).normalize();
                        playerShip.position.copy(enemy.position).add(pushOutDir.multiplyScalar(fighterCollisionRadius * 2.1));
                        
                        // Collision damage
                        let dmgMult = (typeof gameMechanicsConfig !== 'undefined' && gameMechanicsConfig.enemyDamageMult !== undefined) ? (gameMechanicsConfig.enemyDamageMult / 100) * 5.0 : 1.0;
                        const damageAmt = 8 * dmgMult; 
                        
                        if (typeof shieldPercent !== 'undefined') {
                            if (shieldPercent > 0) {
                                shieldPercent -= damageAmt;
                                triggerPlayerShieldHit();
                                if (shieldPercent < 0) {
                                    playerHp = Math.max(0, playerHp + shieldPercent);
                                    shieldPercent = 0;
                                }
                            } else {
                                playerHp = Math.max(0, playerHp - damageAmt);
                            }
                            
                            if (Math.random() < 0.2) showToast("💥 COLLISION WARNING: VESSEL IMPACT!");
                        }
                    }
                }
            }

            // Prevent flying through Capital Ships
            if (!isShipInvincible && !isPlayerDead && typeof capitalShips !== 'undefined') {
                const capitalCollisionRadius = 450; 
                for (let i = 0; i < capitalShips.length; i++) {
                    const cap = capitalShips[i];
                    if (!cap || cap.userData.isDead) continue;
                    
                    const distToCap = playerShip.position.distanceTo(cap.position);
                    if (distToCap < capitalCollisionRadius) {
                        const pushOutDir = playerShip.position.clone().sub(cap.position).normalize();
                        playerShip.position.copy(cap.position).add(pushOutDir.multiplyScalar(capitalCollisionRadius * 1.05));
                        
                        if (Math.random() < 0.1) showToast("⚠️ PROXIMITY ALERT: DREADNOUGHT HULL!");
                    }
                }
            }


            // Prevent clipping into core station geometry while allowing free flight inside the docking bay
            if (theCrestStation) {
                window.inHangerZone = false;
                
                if (theCrestStation.userData.hangerModel) {
                    const hangerModel = theCrestStation.userData.hangerModel;
                    // Compute player position in Hangar-Local space
                    const inv = hangerModel.matrixWorld.clone().invert();
                    const localP = playerShip.position.clone().applyMatrix4(inv);
                    
                    // The entrance is at Z = 0.94, blast doors are at Z = -0.84
                    // Check if player is near/inside the tunnel bounds
                    if (localP.z > -1.0 && localP.z < 2.0 && Math.abs(localP.x) < 2.0 && Math.abs(localP.y) < 1.0) {
                        window.inHangerZone = true;
                        
                        const shipRadius = 0.05; // Buffer for the ship's physical size
                        
                        // Clamp Z to the blast doors so they can't fly through the back
                        const minZ = -0.84 + shipRadius; 
                        let z_clamped = Math.max(minZ, localP.z);
                        
                        // Clamp Y to the ceiling/floor
                        const maxY = 0.39 - shipRadius;
                        let y_clamped = Math.max(-maxY, Math.min(maxY, localP.y));
                        
                        // Calculate the dynamic hexagon width at this Y level
                        let y_factor = 1.0 - Math.abs(y_clamped) / 0.465;
                        if (y_factor < 0) y_factor = 0;
                        let maxX = 0.87 * (1.0 + y_factor * 0.4) - shipRadius;
                        
                        let x_clamped = Math.max(-maxX, Math.min(maxX, localP.x));
                        
                        // If we clamped any axis, apply it back to world space
                        if (x_clamped !== localP.x || y_clamped !== localP.y || z_clamped !== localP.z) {
                            localP.set(x_clamped, y_clamped, z_clamped);
                            playerShip.position.copy(localP.applyMatrix4(hangerModel.matrixWorld));
                            
                            // Visual feedback for hitting the hangar walls
                            if (currentSpeed > 50) {
                                const statusTag = document.getElementById('throttle-status-tag');
                                if (statusTag && Math.random() < 0.1) {
                                    statusTag.innerText = 'HANGAR IMPACT';
                                    statusTag.style.color = '#facc15';
                                    setTimeout(() => { if (statusTag.innerText === 'HANGAR IMPACT') { statusTag.innerText = 'STABLE'; statusTag.style.color = '#00ffcc'; } }, 1000);
                                }
                                currentSpeed *= 0.9; // bleed speed on scrape
                            }
                        }
                    }
                }

                const distToCrest = playerShip.position.distanceTo(theCrestStation.position);
                const landingBtn = document.getElementById('btn-request-landing');
                const launchBtn = document.getElementById('btn-ready-launch');
                if (landingBtn) {
                    if (distToCrest < 2000 && !isLandingSequenceActive && typeof landingPhase !== 'undefined' && landingPhase === 0 && !window.inHangerZone) {
                        landingBtn.style.display = 'block';
                    } else {
                        landingBtn.style.display = 'none';
                    }
                }
                if (launchBtn) {
                    if (typeof landingPhase !== 'undefined' && landingPhase === 6) {
                        launchBtn.style.display = 'block';
                    } else {
                        launchBtn.style.display = 'none';
                    }
                }
                // Apply raycast collision against the entire station hull
                if (!window.inHangerZone && distToCrest < 1200) {
                    if (!window.stationRaycaster) window.stationRaycaster = new THREE.Raycaster();
                    const moveDist = oldPos.distanceTo(playerShip.position);
                    if (moveDist > 0.1) {
                        const rayDir = playerShip.position.clone().sub(oldPos).normalize();
                        window.stationRaycaster.set(oldPos, rayDir);
                        window.stationRaycaster.far = moveDist + 5.0; // small buffer
                        
                        // Check for collision against the station mesh
                        const intersects = window.stationRaycaster.intersectObject(theCrestStation, true);
                        if (intersects.length > 0) {
                            // Find first hit that isn't the force field
                            const hit = intersects.find(i => !i.object.userData.isForceField);
                            if (hit && hit.face) {
                                // Push the ship back to the collision point and slightly outwards along the normal
                                const pushNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
                                playerShip.position.copy(hit.point).add(pushNormal.multiplyScalar(5));
                                
                                if (currentSpeed > 20) {
                                    currentSpeed *= 0.5; // bleed speed on impact
                                    const statusTag = document.getElementById('throttle-status-tag');
                                    if (statusTag && Math.random() < 0.2) {
                                        statusTag.innerText = 'HULL IMPACT';
                                        statusTag.style.color = '#ef4444';
                                        setTimeout(() => {
                                            if (statusTag.innerText === 'HULL IMPACT') {
                                                statusTag.innerText = 'STABLE';
                                                statusTag.style.color = '#00ffcc';
                                            }
                                        }, 800);
                                    }
                                }
                            }
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
                // Mode 0: Cockpit View (First-Person) - Hide exterior ship model & engine lights so they do not block cockpit view (unless cinematic is active)
                const isCinematic = (typeof isTitanCinematicActive !== 'undefined' && isTitanCinematicActive);
                playerShip.visible = isCinematic;
                if (playerShip.userData && playerShip.userData.engineLights) {
                    playerShip.userData.engineLights.forEach(l => l.visible = isCinematic);
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
                    // Mode 3: Cinematic Orbiting Showcase (Ship Invincible, 2x Faster Panning)
                    cinematicAngle += 0.0030; // Sped up 2x for faster cinematic sweeps
                    const radius = 9;
                    const height = Math.sin(cinematicAngle * 0.7) * 2 + 1.5;
                    const orbitOffset = new THREE.Vector3(
                        Math.cos(cinematicAngle) * radius,
                        height,
                        Math.sin(cinematicAngle) * radius
                    );
                    targetCamPos = playerShip.position.clone().add(orbitOffset);
                    targetLookAtPos = playerShip.position.clone();
                }
            }

            const dynamicLerp = 0.01 + ((100 - gameMechanicsConfig.cameraLag) / 100) * 0.20;

            // Apply camera lag to the roll as well (lerp camera.up smoothly to ship's local up vector)
            const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(playerShip.quaternion);
            if (cameraMode === 0 || (typeof isLandingSequenceActive !== 'undefined' && isLandingSequenceActive)) {
                // In Cockpit View OR during landing, keep orientation locked 1:1 with cockpit frame / perfectly smooth
                camera.up.copy(localUp);
            } else {
                // In Third-Person (Close/Far) & Cinematic modes, apply smooth roll lag
                const rollLerp = cameraMode === 3 ? 0.01 : dynamicLerp;
                camera.up.lerp(localUp, rollLerp).normalize();
            }

            if (typeof isLandingSequenceActive !== 'undefined' && isLandingSequenceActive) {
                camera.position.copy(targetCamPos);
            } else {
                camera.position.lerp(targetCamPos, cameraMode === 3 ? 0.08 : dynamicLerp);
            }
            camera.lookAt(targetLookAtPos);
            camera.updateMatrixWorld(); // Force matrix update so 2D UI projections have zero frame lag

            // --- ANIMATE ACTIVE HYPERSPACE RIFTS ---
            const nowPerf = performance.now();
            let activeFlashPos = null;
            let activeFlashIntensity = 0;

            for (let i = activeHyperspaceRifts.length - 1; i >= 0; i--) {
                const rift = activeHyperspaceRifts[i];
                const age = (nowPerf - rift.startTime) / 1000;

                if (age > 2.6) {
                    scene.remove(rift.group);
                    if (rift.tearMesh.geometry) rift.tearMesh.geometry.dispose();
                    if (rift.tearMesh.material) rift.tearMesh.material.dispose();
                    if (rift.shockwaveMesh.geometry) rift.shockwaveMesh.geometry.dispose();
                    if (rift.shockwaveMesh.material) rift.shockwaveMesh.material.dispose();
                    if (rift.sparkPoints && rift.sparkPoints.geometry) rift.sparkPoints.geometry.dispose();
                    if (rift.sparkPoints && rift.sparkPoints.material) rift.sparkPoints.material.dispose();
                    activeHyperspaceRifts.splice(i, 1);
                    continue;
                }

                // Continuously track and follow the emerging capital ship
                if (rift.ship && rift.ship.userData) {
                    rift.group.position.copy(rift.ship.position);
                    rift.pos.copy(rift.ship.position);
                }

                // Phase 1: Rift Opening (0 -> 0.5s)
                if (age < 0.5) {
                    const progress = age / 0.5;
                    rift.tearMesh.scale.set(progress * 1.2, progress, 1.0);
                    rift.tearMesh.material.opacity = progress * 0.95;
                    activeFlashPos = rift.pos;
                    activeFlashIntensity = Math.max(activeFlashIntensity, progress * 8.0);
                }
                // Phase 2: Maximum Flash & Shockwave Expansion (0.5s -> 1.8s)
                else if (age < 1.8) {
                    const progress = (age - 0.5) / 1.3;
                    rift.tearMesh.scale.set(1.2 + Math.sin(age * 30) * 0.1, 1.0 + Math.cos(age * 25) * 0.08, 1.0);
                    
                    // Flash spike and exponential decay
                    const flashT = Math.max(0, 1.0 - (age - 0.5) / 0.8);
                    activeFlashPos = rift.pos;
                    activeFlashIntensity = Math.max(activeFlashIntensity, flashT * 26.0);

                    // Gravitational Shockwave Expansion
                    const shockScale = 1.0 + Math.pow(progress, 0.7) * 32.0;
                    rift.shockwaveMesh.scale.set(shockScale, shockScale, shockScale);
                    rift.shockwaveMesh.material.opacity = Math.max(0, (1.0 - progress) * 0.90);

                    // Animate Tachyon Spark Points (Direct Buffer Manipulation)
                    if (rift.sparkPoints && rift.sparkVelocities) {
                        const posAttr = rift.sparkPoints.geometry.attributes.position;
                        const arr = posAttr.array;
                        for (let s = 0; s < rift.sparkVelocities.length; s++) {
                            const v = rift.sparkVelocities[s];
                            arr[s * 3] += v.x * 0.016;
                            arr[s * 3 + 1] += v.y * 0.016;
                            arr[s * 3 + 2] += v.z * 0.016;
                        }
                        posAttr.needsUpdate = true;
                        rift.sparkPoints.material.opacity = Math.max(0, 1.0 - progress);
                    }
                }
                // Phase 3: Spatial Collapse (1.8s -> 2.6s)
                else {
                    const progress = (age - 1.8) / 0.8;
                    const collapseScale = Math.max(0.001, 1.0 - progress);
                    rift.tearMesh.scale.set(collapseScale * 1.2, collapseScale, collapseScale);
                    rift.tearMesh.material.opacity = (1.0 - progress) * 0.9;
                    rift.shockwaveMesh.material.opacity = 0;
                }
            }

            if (globalHyperspaceFlashLight) {
                if (activeFlashPos && activeFlashIntensity > 0.01) {
                    globalHyperspaceFlashLight.position.copy(activeFlashPos);
                    globalHyperspaceFlashLight.intensity = activeFlashIntensity;
                } else {
                    globalHyperspaceFlashLight.intensity = 0;
                }
            }

            // --- ANIMATE DOMINION CAPITAL FLEET (HYPERSPACE JUMP & BATTLE CRUISE) ---
            const timeSec = Date.now() * 0.001;
            const elapsedFleetEmergence = fleetEmergenceActive ? (nowPerf - fleetEmergenceStartTime) / 1000 : 999;

            // Display HUD arrival countdown during the 7-second startup phase
            if (fleetEmergenceActive && elapsedFleetEmergence < 7.0) {
                const remaining = Math.max(0, Math.ceil(7.0 - elapsedFleetEmergence));
                const objElem = document.getElementById('hud-objective');
                if (objElem && remaining > 0) {
                    // removed toast line
                }
            } else if (fleetEmergenceActive && elapsedFleetEmergence >= 7.0 && elapsedFleetEmergence < 12.0) {
                const objElem = document.getElementById('hud-objective');
                if (objElem && objElem.innerHTML.includes('WARP IN')) {
                    // removed toast line
                }

                // Line 1: Triggered ONLY when the first ship emerges from hyperspace (7.2s mark)
                if (elapsedFleetEmergence >= 7.2 && !playedArrivalStages.stage1) {
                    playedArrivalStages.stage1 = true;
                    playArrivalCommsLine({
                        speaker: "KAYLEN VANCE",
                        subspeaker: "VOID INTERCEPTOR COCKPIT / TACTICAL COMMS",
                        badge: "ALERT",
                        text: "What is going on?! We are being attacked! By... by... I don't know who!",
                        audioSrc: "audio/cinematics/titan_gate/titan_arrival_01_kaylen.mp3"
                    });
                }
            }

            // Trigger planetary bombardment once ships have emerged at Titan
            if (fleetEmergenceActive && elapsedFleetEmergence >= 9.5 && !isTitanExcavationStarted) {
                isTitanExcavationStarted = true;
                titanExcavationPhase = 'BOMBARDMENT';
                titanExcavationStartTime = performance.now();
                // removed toast line
            }

            capitalShips.forEach(ship => {
                if (!ship || !ship.userData) return;

                // 1. Hyperspace Jump Emergence Sequence
                if (fleetEmergenceActive && ship.userData.jumpPhase !== 'COMPLETED') {
                    const delay = ship.userData.jumpDelay || 0;

                    if (ship.userData.jumpPhase === 'WAITING' && elapsedFleetEmergence >= delay) {
                        ship.userData.jumpPhase = 'RIFT_OPENING';
                        const fwd = ship.userData.fwdDir || new THREE.Vector3(0, 0, -1);
                        createHyperspaceRiftMesh(ship.position, fwd, ship);
                        playHyperspaceCrackAudio(playerShip.position.distanceTo(ship.position));
                    }
                    else if (ship.userData.jumpPhase === 'RIFT_OPENING' && elapsedFleetEmergence >= delay + 0.45) {
                        ship.userData.jumpPhase = 'EMERGING';
                        ship.visible = true;

                        // Launch fighter squadron IMMEDIATELY as the capital ship arrives out of hyperspace
                        if (!ship.userData.hasInitialLaunched) {
                            ship.userData.hasInitialLaunched = true;
                            launchFightersFromCapitalShip(ship, 3);
                            showToast(`🚨 ${ship.userData.name.toUpperCase()} ARRIVED — FIGHTERS SCRAMBLED!`);
                        }
                    }
                    else if (ship.userData.jumpPhase === 'EMERGING') {
                        const progress = Math.min(1.0, (elapsedFleetEmergence - (delay + 0.45)) / 1.4);
                        const ease = 1 - Math.pow(1 - progress, 3); // Smooth cubic ease-out deceleration
                        ship.position.lerpVectors(ship.userData.entryPos, ship.userData.targetPos, ease);

                        if (progress >= 1.0) {
                            ship.userData.jumpPhase = 'COMPLETED';
                            ship.position.copy(ship.userData.targetPos);
                            ship.userData.lastFighterLaunchTime = Date.now();
                        }
                    }
                }

                // 2. Periodic Carrier Fighter Squadron Launches (Continuous Reinforcements)
                if (ship.userData.jumpPhase === 'COMPLETED' && ship.visible) {
                    const nowMs = Date.now();
                    if (nowMs - ship.userData.lastFighterLaunchTime > ship.userData.fighterLaunchInterval) {
                        ship.userData.lastFighterLaunchTime = nowMs;
                        ship.userData.fighterLaunchInterval = 8000 + Math.random() * 5000; // Launch every 8-13s

                        // Maintain active swarm cap of up to 24 living fighters
                        const livingEnemies = enemyShips.filter(e => e && e.userData && e.userData.hp > 0);
                        if (livingEnemies.length < 24) {
                            launchFightersFromCapitalShip(ship, 1 + Math.floor(Math.random() * 2));
                        }
                    }
                }

                // 3. Animate Front Weapon Area Pulsing Ruby Core & Energy Choke Rings
                if (ship.userData.weaponLights) {
                    const pulse = Math.sin(timeSec * 3.5 + (ship.userData.jumpDelay || 0));
                    ship.userData.weaponLights.forEach(wl => {
                        wl.intensity = 4.5 + pulse * 1.5;
                    });
                }
                if (ship.userData.weaponGlows) {
                    const pulseScale = 1.0 + Math.sin(timeSec * 4.0 + (ship.userData.jumpDelay || 0)) * 0.08;
                    ship.userData.weaponGlows.forEach(wg => {
                        wg.scale.set(pulseScale, pulseScale, pulseScale);
                    });
                }

                // 4. Animate Blinking Navigation Beacons (Mesh pulsating scale & opacity)
                if (ship.userData.beacons) {
                    const blink = (Math.sin(timeSec * 5 + (ship.userData.jumpDelay || 0)) > 0 ? 1.0 : 0.2);
                    ship.userData.beacons.forEach(b => {
                        b.scale.setScalar(blink > 0.5 ? 1.2 : 0.8);
                        if (b.children[1] && b.children[1].material) {
                            b.children[1].material.opacity = blink * 0.85;
                        }
                    });
                }

                // 5. Animate Dreadnought Red Engine Exhaust Plumes (Zero-Allocation Pool)
                if (ship.userData.engineEmitters && ship.visible && cameraMode !== 0) {
                    const shipQuat = ship.quaternion;
                    if (Math.random() < 0.65 && capitalParticlePool.length > 0 && ship.userData.engineEmitters.length > 0) {
                        const em = ship.userData.engineEmitters[Math.floor(Math.random() * ship.userData.engineEmitters.length)];
                        const p = capitalParticlePool.pop();
                        const localPos = new THREE.Vector3(
                            (em.x + (Math.random() - 0.5) * em.r * 0.5) * 3,
                            (em.y + (Math.random() - 0.5) * em.r * 0.5) * 3,
                            em.z * 3
                        );
                        p.position.copy(localPos).applyQuaternion(shipQuat).add(ship.position);
                        p.userData.life = 1.0;
                        const backwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(shipQuat);
                        p.userData.vel.copy(backwardDir).multiplyScalar(Math.random() * 1.6 + 0.8);
                        p.visible = true;
                        activeCapitalParticles.push(p);
                    }
                }
            });

            // Update all active capital particles in a single tight loop (zero garbage)
            for (let pIdx = activeCapitalParticles.length - 1; pIdx >= 0; pIdx--) {
                const p = activeCapitalParticles[pIdx];
                p.userData.life -= 0.024;
                if (p.userData.life <= 0 || cameraMode === 0) {
                    p.visible = false;
                    capitalParticlePool.push(p);
                    activeCapitalParticles.splice(pIdx, 1);
                } else {
                    p.position.add(p.userData.vel);
                    p.scale.setScalar(p.userData.life * 1.8);
                }
            }

            // Rotate Saturn cloud bands, textured ring disc, asteroid ring particles, Titan moon, and The Crest station
            if (spacePlanetSphere) spacePlanetSphere.rotation.y += 0.00015;
            if (solarSystemPlanets) {
                solarSystemPlanets.forEach(p => { if (p.mesh) p.mesh.rotation.y += 0.00015; });
            }
            if (spacePlanetRingMesh) spacePlanetRingMesh.rotation.y += 0.00025;
            if (spacePlanetRing) spacePlanetRing.rotation.y += 0.00025;
            if (spaceTitanSphere) spaceTitanSphere.rotation.y += 0.00018;
            if (theCrestStation) {
                theCrestStation.rotation.y += 0.000125;
                if (theCrestStation.userData.updateClippingPlanes) {
                    theCrestStation.userData.updateClippingPlanes();
                }
            }

            // Animate Titan Dark-Energy Excavation, Boiling Methane Geysers, Golden Ring Ascent & Tractor Beams
            updateTitanExcavationAndTractorBeams(timeSec, timeDelta);

            // Maintain continuous 5-pirate patrol fleet inside Saturn's Asteroid Belt
            maintainAsteroidPiratePatrol();

            // Mission 1 high-speed collision checking
            if (typeof checkMission1Progress === 'function') {
                checkMission1Progress();
            }
            if (typeof window.checkMission2Progress === 'function') {
                window.checkMission2Progress();
            }

            // --- 🚀 AUTHENTIC TACTICAL SPACE FIGHTER FLIGHT ENGINE ---
            let closestEnemy = null;
            let closestDist = 1200; // Weapon lock range: 1,200 Units / 1.2 KM
            const fwdDir = new THREE.Vector3(0, 0, -1).applyQuaternion(playerShip.quaternion);
            const playerVel = fwdDir.clone().negate().multiplyScalar(currentSpeed);

            // Calculate dynamic enemy speed multiplier from options menu (Default: 50% = half speed)
            let _eSpeedVal = (typeof gameMechanicsConfig !== 'undefined' && gameMechanicsConfig.enemySpeedMult !== undefined) ? gameMechanicsConfig.enemySpeedMult : 50;
            const eSpeedFactor = (_eSpeedVal / 100) * 0.50;

            enemyShips.forEach(e => {
                if (e.userData && e.userData.hp > 0 && playerShip) {
                    const toPlayer = playerShip.position.clone().sub(e.position);
                    const dist = toPlayer.length();
                    
                    // Only engage in pursuit runs if within 14,000 units (14 km) tactical aggro radius or damaged
                    const isAggroed = (dist < 14000) || (e.userData.hp < (e.userData.maxHp || 100));
                    if (dist > 0 && isAggroed) {
                        e.userData.attackState = e.userData.attackState || 'intercept';
                        e.userData.breakawayTimer = e.userData.breakawayTimer || 0;
                        e.userData.burstCount = e.userData.burstCount || 0;

                        const enemyTurnRate = 0.004 * (_eSpeedVal / 50) * dtFactor;

                        if (e.userData.attackState === 'breakaway') {
                            // 🚀 EXTENSION / BREAKAWAY (ZOOM) PHASE
                            // Fly along a fixed banking arc away from player to gain distance & energy
                            e.userData.breakawayTimer -= timeDelta;

                            if (!e.userData.breakawayTargetQuat) {
                                // Calculate a fixed world breakaway heading (bank 45 degrees up/side away from player)
                                const sideSign = (e.id % 2 === 0) ? 1 : -1;
                                const upSign = (e.id % 3 === 0) ? 0.6 : -0.3;
                                const localBreakDir = new THREE.Vector3(sideSign * 0.8, upSign, 0.6).normalize();
                                const worldBreakDir = localBreakDir.applyQuaternion(e.quaternion).normalize();
                                e.userData.breakawayTargetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), worldBreakDir);
                            }

                            // Smooth capped turn rate into breakaway vector
                            e.quaternion.rotateTowards(e.userData.breakawayTargetQuat, enemyTurnRate);

                            // Slower momentum cruise speed
                            e.translateZ(-2.33 * eSpeedFactor * dtFactor);

                            if (e.userData.breakawayTimer <= 0 || dist > 2600) {
                                e.userData.attackState = 'intercept';
                                e.userData.breakawayTargetQuat = null;
                            }
                        } else {
                            // 🎯 LEAD PURSUIT (BOOM RUN) ATTACK PHASE
                            // Predict target lead position based on player velocity and laser flight time
                            const leadTime = Math.min(dist / 1400, 2.5);
                            const predictedLeadPos = playerShip.position.clone().add(playerVel.clone().multiplyScalar(leadTime));
                            const toLead = predictedLeadPos.sub(e.position);
                            const leadDir = toLead.clone().normalize();

                            // Smooth turn towards predicted lead position
                            const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), leadDir);
                            e.quaternion.rotateTowards(targetQuat, enemyTurnRate);

                            // Slower attack run speed
                            const attackSpeed = Math.min(2.83, 1.83 + (dist / 3000)) * eSpeedFactor * dtFactor;
                            e.translateZ(-attackSpeed);

                            // Initiate breakaway if closing under 350 units to prevent collision or close-range snapping
                            if (dist < 350) {
                                e.userData.attackState = 'breakaway';
                                e.userData.breakawayTimer = 2.5 + Math.random() * 1.5;
                                e.userData.breakawayTargetQuat = null;
                            }

                            // Rhythmic Plasma Cannon Bursts when in lead alignment (< 25 degrees) and in effective range (< 1400 units)
                            const currentFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(e.quaternion);
                            const aimAngle = currentFwd.angleTo(leadDir);
                            if (dist < 1400 && aimAngle < 0.44) {
                                e.userData.lastFireTime = e.userData.lastFireTime || 0;
                                if (Date.now() - e.userData.lastFireTime > 900 + Math.random() * 600) {
                                    e.userData.lastFireTime = Date.now();
                                    const eLaser = getPooledEnemyLaserBolt();
                                    if (eLaser) {
                                        eLaser.visible = true;
                                        eLaser.scale.set(1, 1, 1);
                                        eLaser.quaternion.copy(e.quaternion);
                                        const side = (e.userData.burstCount % 2 === 0) ? -2.4 : 2.4;
                                        e.userData.burstCount++;
                                        const offset = new THREE.Vector3(side, -0.1, -2.4).applyQuaternion(e.quaternion);
                                        eLaser.position.copy(e.position).add(offset);
                                        eLaser.userData.prevPos.copy(eLaser.position);
                                        eLaser.userData.distanceTraveled = 0;
                                        eLaser.userData.velocity.copy(currentFwd).multiplyScalar(16);
                                        if (!enemyLaserProjectiles.includes(eLaser)) enemyLaserProjectiles.push(eLaser);
                                    }
                                }
                            }
                        }
                    } else {
                        // Unaggroed Asteroid Belt Patrol: Smooth cruise around Saturn's ring system
                        e.translateZ(-2.0 * eSpeedFactor * dtFactor);
                        e.rotateY(0.002 * dtFactor * (_eSpeedVal / 50));
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

            
            if (typeof capitalShips !== 'undefined') {
                capitalShips.forEach(cap => {
                    if (!cap || cap.userData.isDead || cap.userData.hp <= 0) return;
                    const toCap = cap.position.clone().sub(playerShip.position);
                    const distToCap = toCap.length();
                    if (distToCap > 0) {
                        const dot = toCap.clone().normalize().dot(fwdDir);
                        // Capitals are huge, lower dot tolerance so you can target them easier
                        if (distToCap < closestDist && dot > 0.95) {
                            closestDist = distToCap;
                            closestEnemy = cap;
                        }
                    }
                });
            }

            // --- 🎯 ALL VISIBLE ENEMIES 3D RED CORNER BRACKET BOX UPDATER ---
            let activeBoxIdx = 0;
            if (typeof enemyTargetBoxPool !== 'undefined' && enemyTargetBoxPool.length > 0) {
                if (!isTitanCinematicActive) {
                    // Gather all active visible hostiles (enemyShips + capitalShips)
                    const allHostiles = [];
                    enemyShips.forEach(e => {
                        if (e && e.userData && e.userData.hp > 0 && e.visible) {
                            allHostiles.push(e);
                        }
                    });
                    if (typeof capitalShips !== 'undefined') {
                        capitalShips.forEach(cap => {
                            if (cap && cap.userData && !cap.userData.isDead && cap.userData.hp > 0 && cap.visible) {
                                allHostiles.push(cap);
                            }
                        });
                    }

                    allHostiles.forEach(hostile => {
                        _targetBBox.setFromObject(hostile);
                        _targetBBox.getCenter(_targetWorldPos);
                        _targetBBox.getSize(_targetSizeVec);

                        const toHostile = _targetWorldPos.clone().sub(playerShip.position);
                        const distToHostile = toHostile.length();

                        // Render corner boxes for hostiles in front of player within 5000 units
                        if (distToHostile > 0 && distToHostile < 5000) {
                            const dot = toHostile.clone().normalize().dot(fwdDir);
                            if (dot > 0.15) { // In front of view cone
                                if (activeBoxIdx < enemyTargetBoxPool.length) {
                                    const box = enemyTargetBoxPool[activeBoxIdx++];
                                    box.visible = true;
                                    box.position.copy(_targetWorldPos);

                                    const isPrimaryLock = (hostile === closestEnemy);
                                    if (isPrimaryLock) {
                                        box.material.color.setHex(0xff0044); // Bright crimson red for primary target
                                        box.material.opacity = 1.0;
                                        // Smooth constant rotation for locked primary target
                                        box.rotation.y += 0.04;
                                        box.rotation.x += 0.02;
                                        box.rotation.z += 0.01;
                                    } else {
                                        box.material.color.setHex(0xef4444); // Tactical red for visible hostiles
                                        box.material.opacity = 0.85;
                                        box.rotation.set(0, 0, 0);
                                    }

                                    const maxDim = Math.max(_targetSizeVec.x, _targetSizeVec.y, _targetSizeVec.z, 8);
                                    const scaleFactor = (maxDim * 1.35) / 20.0;
                                    box.scale.set(scaleFactor, scaleFactor, scaleFactor);
                                }
                            }
                        }
                    });
                }

                // Hide unused pool boxes
                for (let i = activeBoxIdx; i < enemyTargetBoxPool.length; i++) {
                    enemyTargetBoxPool[i].visible = false;
                }
            }
            
            // Hide the old 2D HTML lock box if it exists
            const lockBox = document.getElementById('target-lock-box');
            if (lockBox) lockBox.style.display = 'none';

            // Auto-Pilot HUD indicator under auto target zone (Cockpit view only)
            const autoPilotEl = document.getElementById('autopilot-indicator');
            if (autoPilotEl) {
                autoPilotEl.style.display = (isFlightLocked && cameraMode === 0) ? 'block' : 'none';
            }

            // --- LASER PROJECTILE MOVEMENT & ZERO-ALLOCATION CONTINUOUS SEGMENT COLLISION ---
            for (let i = laserProjectiles.length - 1; i >= 0; i--) {
                const laser = laserProjectiles[i];
                if (!laser || !laser.userData || !laser.userData.active) {
                    if (laser) laser.visible = false;
                    laserProjectiles.splice(i, 1);
                    continue;
                }

                _prevPos.copy(laser.position);

                // Zero-Allocation Aim Assist toward exact world target center
                if (closestEnemy && closestEnemy.userData && closestEnemy.userData.hp > 0 && laser.userData.velocity) {
                    _toTarget.subVectors(_targetWorldPos, laser.position).normalize();
                    const speed = laser.userData.velocity.length();
                    _curDir.copy(laser.userData.velocity).normalize();
                    if (_curDir.dot(_toTarget) > 0.4) {
                        _curDir.lerp(_toTarget, 0.12).normalize();
                        laser.userData.velocity.copy(_curDir).multiplyScalar(speed);
                        laser.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), _curDir);
                    }
                }

                const stepDist = laser.userData.velocity ? laser.userData.velocity.length() : 12;
                laser.userData.distanceTraveled = (laser.userData.distanceTraveled || 0) + stepDist;

                // Smooth laser dissipation over the final third of its range (700 to 1100 units)
                const maxPlayerRange = 1100;
                const playerFadeStart = 700;
                if (laser.userData.distanceTraveled > playerFadeStart) {
                    const pFade = Math.max(0.01, 1.0 - ((laser.userData.distanceTraveled - playerFadeStart) / (maxPlayerRange - playerFadeStart)));
                    laser.scale.set(pFade, pFade, pFade);
                } else {
                    laser.scale.set(1, 1, 1);
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
                        let _pDmg = gameMechanicsConfig.playerDamageMult !== undefined ? gameMechanicsConfig.playerDamageMult : 20;
                        if (_pDmg > 100) _pDmg = 100;
                        const pDmgMult = (_pDmg / 100) * 5.0;
                        enemy.userData.hp -= (25 * pDmgMult);

                        if (enemy.userData.hp <= 0) {
                            createFieryExplosionFX(enemy.position);
                            scene.remove(enemy);
                            enemyShips.splice(j, 1);

                            playerCredits += 500;
                            const credDisp = document.getElementById('hangar-credits-display');
                            if (credDisp) credDisp.innerText = `${playerCredits.toLocaleString()}`;
                            showToast("💥 TARGET DESTROYED! +500 SC AWARDED!");

                            setTimeout(() => {
                                const livingEnemies = enemyShips.filter(e => e && e.userData && e.userData.hp > 0);
                                if (livingEnemies.length < 12 && playerShip && capitalShips && capitalShips.length > 0) {
                                    const activeCapitals = capitalShips.filter(s => s && s.visible);
                                    const chosenCap = activeCapitals.length > 0 ? activeCapitals[Math.floor(Math.random() * activeCapitals.length)] : capitalShips[0];
                                    if (chosenCap) {
                                        launchFightersFromCapitalShip(chosenCap, 1);
                                    }
                                }
                            }, 4000);
                        }
                        break;
                    }
                }

                
                if (!hitEnemy) {
                    for (let j = capitalShips.length - 1; j >= 0; j--) {
                        const cap = capitalShips[j];
                        if (!cap.userData || cap.userData.isDead || cap.userData.hp <= 0) continue;

                        const segDist = pointToSegmentDistance(cap.position, _prevPos, _currentPos);
                        if (segDist < 550) { // Capital ships are huge
                            hitEnemy = true;
                            spawnLaserImpactSparks(_currentPos);
                            playLaserImpactAudio();

                            cap.userData.flashTimer = 5;
                            let _pDmg = (typeof gameMechanicsConfig !== 'undefined' && gameMechanicsConfig.playerDamageMult !== undefined) ? gameMechanicsConfig.playerDamageMult : 20;
                            if (_pDmg > 100) _pDmg = 100;
                            const pDmgMult = (_pDmg / 100) * 5.0;
                            cap.userData.hp -= (25 * pDmgMult);

                            // Minimal flash visual if material supports it
                            if (cap.userData.meshContainer) {
                                cap.userData.meshContainer.traverse(child => {
                                    if (child.isMesh && child.material && child.material.emissive) {
                                        child.material.emissive.setHex(0xff3333);
                                        setTimeout(() => {
                                            if (child && child.material && child.material.emissive) child.material.emissive.setHex(0x000000);
                                        }, 80);
                                    }
                                });
                            }

                            if (cap.userData.hp <= 0) {
                                cap.userData.isDead = true;
                                cap.visible = false;
                                
                                // Huge sequence of explosions!
                                for (let ex=0; ex<18; ex++) {
                                    setTimeout(() => {
                                        createFieryExplosionFX(cap.position.clone().add(new THREE.Vector3((Math.random()-0.5)*1200, (Math.random()-0.5)*800, (Math.random()-0.5)*1200)));
                                    }, Math.random() * 2500);
                                }
                                
                                playerCredits += 25000;
                                const credDisp = document.getElementById('hangar-credits-display');
                                if (credDisp) credDisp.innerText = `${playerCredits.toLocaleString()}`;
                                // removed toast line
                            }
                            break;
                        }
                    }
                }

                if (hitEnemy || laser.userData.distanceTraveled >= maxPlayerRange) {
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

                const eStepDist = laser.userData.velocity ? laser.userData.velocity.length() : 16;
                laser.userData.distanceTraveled = (laser.userData.distanceTraveled || 0) + eStepDist;

                // Smooth enemy laser dissipation over the final third of its range (700 to 1100 units)
                const maxEnemyRange = 1100;
                const enemyFadeStart = 700;
                if (laser.userData.distanceTraveled > enemyFadeStart) {
                    const eFade = Math.max(0.01, 1.0 - ((laser.userData.distanceTraveled - enemyFadeStart) / (maxEnemyRange - enemyFadeStart)));
                    laser.scale.set(eFade, eFade, eFade);
                } else {
                    laser.scale.set(1, 1, 1);
                }

                laser.position.add(laser.userData.velocity);

                let hitPlayer = false;
                const distToPlayer = laser.position.distanceTo(playerShip.position);
                
                if (distToPlayer < 12) {
                    hitPlayer = true;
                    if (isShipInvincible || isTitanCinematicActive) {
                        // 100% Invulnerable during cinematic / showcase mode!
                        triggerPlayerShieldHit();
                        laser.visible = false;
                        laser.userData.active = false;
                        enemyLaserProjectiles.splice(i, 1);
                        continue;
                    }

                    // Flash red screen if enabled
                    if (gameMechanicsConfig.flashOnHit !== false) {
                        const flash = document.createElement('div');
                        flash.style.position = 'fixed'; flash.style.top = '0'; flash.style.left = '0'; flash.style.width = '100%'; flash.style.height = '100%'; flash.style.backgroundColor = 'rgba(255,59,92,0.2)'; flash.style.zIndex = '9999'; flash.style.pointerEvents = 'none'; flash.style.transition = 'opacity 0.2s';
                        document.body.appendChild(flash);
                        setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 200); }, 20);
                    }

                    // Damage Player
                    let hullDamageTaken = false;
                    let _eDmg = gameMechanicsConfig.enemyDamageMult !== undefined ? gameMechanicsConfig.enemyDamageMult : 20;
                    if (_eDmg > 100) _eDmg = 100;
                    const enemyDmgMult = (_eDmg / 100) * 5.0;
                    const damageAmt = 2 * enemyDmgMult;
                    
                    if (shieldPercent > 0) {
                        shieldPercent -= damageAmt;
                        triggerPlayerShieldHit();
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

                // Remove laser if hit or reached max range
                if (hitPlayer || laser.userData.distanceTraveled >= maxEnemyRange) {
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
                    if (oldP.geometry && oldP.geometry !== sharedExpParticleGeo && oldP.geometry !== sharedRingGeo) {
                        oldP.geometry.dispose();
                    }
                    if (oldP.material && !sharedExpColors.includes(oldP.material) && oldP.material !== sharedRingMat) {
                        // Some shockwaves clone the sharedRingMat in createEpicPlayerDeathExplosion!
                        // "const shockwave = new THREE.Mesh(sharedRingGeo, sharedRingMat.clone());"
                        // If it's cloned, it's not in the array and not strictly sharedRingMat, so we CAN dispose it.
                        oldP.material.dispose();
                    }
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
            const topCard = document.getElementById('hud-top-target-card');
            const topCardLabel = topCard ? topCard.querySelector('.drag-handle-label') : null;

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

                if (topCardLabel) {
                    if (topCard.classList.contains('is-minimized')) {
                        const existingBar = topCardLabel.querySelector('.mini-hp-bar');
                        if (!existingBar) {
                            topCardLabel.innerHTML = `<span style="display:inline-block; width:120px; height:8px; background:rgba(0,0,0,0.8); border:1px solid #ff3b5c; border-radius:2px; vertical-align:middle; overflow:hidden;"><div class="mini-hp-bar" style="width:${hpPct}%; height:100%; background:linear-gradient(90deg, #dc2626, #ff3b5c);"></div></span>`;
                        } else {
                            existingBar.style.width = `${hpPct}%`;
                        }
                    } else {
                        if (topCardLabel.innerText !== '🎯 TARGET DAMAGE') {
                            topCardLabel.innerHTML = '🎯 TARGET DAMAGE';
                        }
                    }
                }
            } else {
                if (topName) topName.innerText = "NO TARGET ACQUIRED";
                if (topDist) topDist.innerText = "Range: -- KM";
                if (topBar) topBar.style.width = "0%";
                if (topHpText) topHpText.innerText = "NO TARGET";

                if (topCardLabel && topCardLabel.innerText !== '🎯 TARGET DAMAGE') {
                    topCardLabel.innerHTML = '🎯 TARGET DAMAGE';
                }
            }

            // Engine Exhaust Particle Trails (Continuous Smooth Plasma Stream)
            updateEngineParticleTrails(oldPos, oldQuat);

            // Animate Hexagonal Energy Shield Pulse & Fade
            if (playerShieldBubble && playerShieldBubble.visible) {
                if (playerShieldBubble.userData.shieldActiveTimer > 0) {
                    playerShieldBubble.userData.shieldActiveTimer -= 0.016;
                    const timer = playerShieldBubble.userData.shieldActiveTimer;
                    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.007);
                    const fade = Math.min(1.0, timer / 0.8);
                    
                    if (playerShieldBubble.userData.hexTex) {
                        playerShieldBubble.userData.hexTex.offset.x += 0.0008;
                        playerShieldBubble.userData.hexTex.offset.y += 0.0005;
                    }
                    if (playerShieldBubble.userData.outerMat) {
                        playerShieldBubble.userData.outerMat.opacity = (0.24 + 0.16 * pulse) * fade;
                    }
                    if (playerShieldBubble.userData.innerMat) {
                        playerShieldBubble.userData.innerMat.opacity = (0.06 + 0.04 * pulse) * fade;
                    }
                    if (playerShieldBubble.userData.wireMat) {
                        playerShieldBubble.userData.wireMat.opacity = (0.10 + 0.08 * pulse) * fade;
                    }
                } else {
                    playerShieldBubble.visible = false;
                }
            }

            // Regenerate Shields & Hull (Nanotech)
            if (shieldPercent < 100) {
                let _shield = gameMechanicsConfig.shieldRegenMult !== undefined ? gameMechanicsConfig.shieldRegenMult : 33;
                if (_shield > 100) _shield = 100;
                const shieldMult = (_shield / 100) * 3.0;
                const regenRate = (0.05 + (shipUpgrades.shields.level * 0.03)) * shieldMult;
                shieldPercent = Math.min(100, shieldPercent + regenRate);
            }
            if (playerHp < 100 && playerHp > 0) { // Only regen if not dead
                let _hull = gameMechanicsConfig.hullRegenMult !== undefined ? gameMechanicsConfig.hullRegenMult : 33;
                if (_hull > 100) _hull = 100;
                const hullMult = (_hull / 100) * 3.0;
                playerHp = Math.min(100, playerHp + (0.02 * hullMult));
            }

            try {
                drawTacticalRadar();
                drawShieldGauge();
                drawThrottleGauge();

                const shieldCard = document.getElementById('hud-shield-card');
                if (shieldCard && shieldCard.classList.contains('is-minimized')) {
                    const label = shieldCard.querySelector('.drag-handle-label');
                    if (label) {
                        const throttleRatio = Math.min(Math.max(currentSpeed / maxSpeedCap, 0), 1);
                        const throttlePct = Math.round(throttleRatio * 100);
                        const sPct = Math.floor(shieldPercent);
                        const hpPct = Math.floor(playerHp);
                        label.innerText = `SHIELD: ${sPct}%  |  HULL: ${hpPct}%  |  THRUST: ${throttlePct}%`;
                    }
                } else if (shieldCard) {
                    const label = shieldCard.querySelector('.drag-handle-label');
                    if (label && label.innerText !== '🛡️ SHIELD & THROTTLE') {
                        label.innerText = '🛡️ SHIELD & THROTTLE';
                    }
                }
            } catch (hudErr) {
                console.warn("[HUD RENDER ERROR]", hudErr);
            }
            renderer.render(scene, camera);
        }

        let engineParticles = [];
        const particleGeo = new THREE.SphereGeometry(0.18, 8, 8); // Thicker plasma spheres
        const particleMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });

        let prevShipPos = null;
        let prevShipQuat = null;

        function updateEngineParticleTrails(currentOldPos, currentOldQuat) {
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
                prevShipPos = null;
                prevShipQuat = null;
                return;
            }

            const nozzleOffsets = [
                new THREE.Vector3(-0.788, -0.032, 3.55),
                new THREE.Vector3( 0.788, -0.032, 3.55)
            ];

            const shipQuat = playerShip.quaternion;
            const backwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(shipQuat);

            const startPos = currentOldPos || prevShipPos || playerShip.position;
            const startQuat = currentOldQuat || prevShipQuat || playerShip.quaternion;
            const endPos = playerShip.position;
            const endQuat = playerShip.quaternion;

            // Spawn continuous unbroken plasma ribbon per thruster nozzle
            if (currentSpeed > 2) {
                nozzleOffsets.forEach(offset => {
                    const startNozzle = offset.clone().applyQuaternion(startQuat).add(startPos);
                    const endNozzle = offset.clone().applyQuaternion(endQuat).add(endPos);
                    const distMoved = startNozzle.distanceTo(endNozzle);

                    // Dynamically calculate particle count based on physical distance (0.12 units per particle)
                    const numParticles = Math.max(8, Math.ceil(distMoved / 0.12));
                    const baseVel = backwardDir.clone().multiplyScalar(0.18 + currentSpeed * 0.0008);

                    for (let d = 0; d < numParticles; d++) {
                        const t = d / numParticles;
                        // Continuous linear interpolation between start of frame and end of frame
                        const interpPos = startNozzle.clone().lerp(endNozzle, t);

                        // Subtle plume radial dispersion
                        const angle = Math.random() * Math.PI * 2;
                        const spreadR = Math.random() * 0.06;
                        const subJitter = new THREE.Vector3(Math.cos(angle) * spreadR, Math.sin(angle) * spreadR, (Math.random() - 0.5) * 0.04).applyQuaternion(shipQuat);
                        interpPos.add(subJitter);

                        // Account for backward drift elapsed during the fractional frame (1 - t)
                        const drift = baseVel.clone().multiplyScalar(1.0 - t);
                        interpPos.add(drift);

                        const pMesh = new THREE.Mesh(particleGeo, particleMat.clone());
                        pMesh.position.copy(interpPos);

                        const vel = baseVel.clone().add(
                            new THREE.Vector3((Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.03)
                        );

                        pMesh.userData = {
                            velocity: vel,
                            age: 1.0 - t,
                            maxAge: 6 + Math.floor(Math.random() * 3) // Reduced by 60%
                        };

                        scene.add(pMesh);
                        engineParticles.push(pMesh);
                    }
                });
            }

            prevShipPos = playerShip.position.clone();
            prevShipQuat = playerShip.quaternion.clone();

            // Update active particles
            for (let i = engineParticles.length - 1; i >= 0; i--) {
                const p = engineParticles[i];
                p.userData.age += 1.0;
                p.position.add(p.userData.velocity);

                const lifeRatio = p.userData.age / p.userData.maxAge;
                p.material.opacity = Math.max(0, (1.0 - lifeRatio) * 0.85);
                p.scale.setScalar(1.0 + lifeRatio * 1.3);

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

            const hullElem = document.getElementById('shield-hull-subtext');
            if (hullElem) {
                const roundedHp = Math.max(0, Math.floor(playerHp));
                hullElem.innerText = `HULL ${roundedHp}%`;
                if (playerHp < 25) {
                    hullElem.style.color = '#ff3b5c';
                    hullElem.style.textShadow = '0 0 8px rgba(255, 59, 92, 0.8)';
                } else if (playerHp < 60) {
                    hullElem.style.color = '#f59e0b';
                    hullElem.style.textShadow = 'none';
                } else {
                    hullElem.style.color = '#ff8899';
                    hullElem.style.textShadow = 'none';
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

            const throttleRatio = Math.min(Math.max(currentSpeed / maxSpeedCap, 0), 1);
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
                const postedSpeed = Math.round(currentSpeed * (700 / maxSpeedCap));
                speedSubtext.innerText = `${postedSpeed.toLocaleString()} km/s`;
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

        function maintainAsteroidPiratePatrol() {
            if (!spacePlanet || typeof enemyShips === 'undefined' || typeof createPirateShipMesh !== 'function') return;

            // Only spawn/maintain pirate belt patrols during Mission 3
            if (!window.mission3Active && !window.isMission3Active) return;

            // Filter living pirate vessels assigned to the asteroid field
            const activePirates = enemyShips.filter(e => e && e.userData && e.userData.isAsteroidPirate && e.userData.hp > 0);

            // Maintain at least 5 pirate vessels patrolling the asteroid field at all times
            const needed = 5 - activePirates.length;
            if (needed <= 0) return;

            const fieldCenter = (typeof window.mission2Freighter !== 'undefined' && window.mission2Freighter && window.mission2Freighter.position) 
                ? window.mission2Freighter.position.clone() 
                : new THREE.Vector3(100000, 0, 100000);

            for (let k = 0; k < needed; k++) {
                const pirate = createPirateShipMesh();
                
                // Spawn at a random position inside the 300% expanded pirate asteroid field
                const px = fieldCenter.x + (Math.random() - 0.5) * 38000;
                const pz = fieldCenter.z + (Math.random() - 0.5) * 38000;
                const py = fieldCenter.y + (Math.random() - 0.5) * 8000;

                pirate.position.set(px, py, pz);
                pirate.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI * 2, 0);

                pirate.userData.isAsteroidPirate = true;
                pirate.userData.hp = 100;
                pirate.userData.maxHp = 100;
                pirate.userData.name = 'PIRATE RAIDER';

                // Spawn hyperspace warp arrival sparks
                if (typeof spawnLaserImpactSparks === 'function') {
                    spawnLaserImpactSparks(pirate.position);
                }

                scene.add(pirate);
                enemyShips.push(pirate);
            }
        }
        window.maintainAsteroidPiratePatrol = maintainAsteroidPiratePatrol;

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
            _radarInvQuat.copy(playerShip.quaternion).invert();

            const MAX_RADAR_DIST = 150000; // 150,000 units max tactical detection range

            function drawBlip(objPos, color, isCapital = false) {
                if (!objPos) return;

                // Relative position in player cockpit local space
                _radarRelPos.copy(objPos).sub(playerShip.position).applyQuaternion(_radarInvQuat);
                const dist = _radarRelPos.length();
                if (dist < 1 || dist > MAX_RADAR_DIST) return; // Exclude targets beyond tactical radar range

                const isBehind = _radarRelPos.z > 0;
                
                // Normalized direction in player's field of view
                const nx = _radarRelPos.x / dist;
                const ny = _radarRelPos.y / dist;

                let rx, ry;
                if (!isBehind) {
                    // In Front: Center of radar (cx, cy) is dead ahead
                    const fovOffset = Math.hypot(nx, ny); // 0 at center, 1 at 90°
                    const radarRadius = fovOffset * (cx * 0.88);
                    const angle = Math.atan2(-ny, nx);
                    rx = cx + Math.cos(angle) * radarRadius;
                    ry = cy + Math.sin(angle) * radarRadius;
                } else {
                    // Behind: Place on outer compass perimeter
                    const angle = Math.atan2(-ny, nx);
                    rx = cx + Math.cos(angle) * (cx * 0.92);
                    ry = cy + Math.sin(angle) * (cy * 0.92);
                }

                ctx.save();
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = isBehind ? 2 : 6;
                ctx.globalAlpha = isBehind ? 0.70 : 1.0;

                // Render all blips as clean tactical dots
                const dotRadius = isCapital ? 3.5 : (isBehind ? 2.0 : 2.5);
                ctx.beginPath();
                ctx.arc(rx, ry, dotRadius, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }

            // Draw The Crest Station Blip (Cyan Torus/Station or Red/Orange Burning Debris)
            if (theCrestStation && theCrestStation.position) {
                if (theCrestState === 'DESTROYED') {
                    drawBlip(theCrestStation.position, '#ea580c');
                } else if (theCrestState === 'EXPLODING' || theCrestState === 'STRUCK') {
                    drawBlip(theCrestStation.position, '#ef4444');
                } else {
                    drawBlip(theCrestStation.position, '#38bdf8');
                }
            }

            // Draw Ancient Precursor Golden Gate Blip (Radiant Gold - only when revealed)
            if (ancientGoldenGate && ancientGoldenGate.visible && ancientGoldenGate.position) {
                drawBlip(ancientGoldenGate.position, '#fbbf24');
            }

            // Draw Titan Excavation Site Blip (Violet Crater)
            if (titanExcavationSite && spaceTitan) {
                const craterPos = titanExcavationSite.getWorldPosition(new THREE.Vector3());
                drawBlip(craterPos, '#d946ef');
            }

            // Draw Crimson Dots for Dominion Capital Dreadnought Fleet
            capitalShips.forEach(cs => {
                if (cs && cs.visible && cs.position) {
                    drawBlip(cs.position, '#ff1e38', true);
                }
            });

            // Draw Red Dots for Active Living Enemy Ships
            enemyShips.forEach(enemy => {
                if (enemy && enemy.position && enemy.userData && enemy.userData.hp > 0) {
                    drawBlip(enemy.position, '#ff3b5c');
                }
            });

            // Draw Blue/Green Dots for Mission 1 Rings
            if (typeof mission1Active !== 'undefined' && typeof mission1Rings !== 'undefined' && typeof mission1Stage !== 'undefined') {
                mission1Rings.forEach((ring, idx) => {
                    if (ring && ring.position) {
                        const isCleared = ring.userData && ring.userData.cleared;
                        let currentTargetIdx = -1;
                        for (let i=0; i<mission1Rings.length; i++) {
                            if (!mission1Rings[i].userData || !mission1Rings[i].userData.cleared) {
                                currentTargetIdx = i;
                                break;
                            }
                        }
                        const isCurrent = idx === currentTargetIdx;
                        const color = isCleared ? '#10b981' : (isCurrent ? '#00f0ff' : '#0284c7'); 
                        drawBlip(ring.position, color);
                    }
                });
            }
        }

        function updateBlastDoors(dtFactor) {
            if (!theCrestStation || !theCrestStation.userData.hangerModel) return;
            const hangerModel = theCrestStation.userData.hangerModel;
            
            if (hangerModel.userData.leftFrontDoor && hangerModel.userData.rightFrontDoor) {
                let targetDoorT = 0; // 0 = closed, 1 = open
                let shouldOpen = false;
                const isAutopilotActive = (typeof isLandingSequenceActive !== 'undefined' && isLandingSequenceActive);
                
                if (isAutopilotActive) {
                    if (landingPhase > 2 && landingPhase < 6) shouldOpen = true;
                    if (landingPhase === 7) shouldOpen = true;
                    // Delay blast doors until the ship is further along the landing spline (approx Z=6)
                    if (landingPhase === 2 && hangerModel.userData.landingProgress > 0.45) shouldOpen = true;
                } else if (typeof window.inHangerZone !== 'undefined' && window.inHangerZone) {
                    shouldOpen = true;
                }
                
                if (shouldOpen) {
                    targetDoorT = 1;
                }
                
                if (typeof hangerModel.userData.doorT === 'undefined') {
                    hangerModel.userData.doorT = 0;
                }
                
                if (hangerModel.userData.doorT < targetDoorT) {
                    hangerModel.userData.doorT += 0.00375 * dtFactor;
                    if (hangerModel.userData.doorT > targetDoorT) hangerModel.userData.doorT = targetDoorT;
                } else if (hangerModel.userData.doorT > targetDoorT) {
                    hangerModel.userData.doorT -= 0.00375 * dtFactor;
                    if (hangerModel.userData.doorT < targetDoorT) hangerModel.userData.doorT = targetDoorT;
                }
                
                const closedX = hangerModel.userData.doorClosedX;
                const openX = hangerModel.userData.doorOpenX;
                const currentX = closedX + (openX - closedX) * hangerModel.userData.doorT;
                
                hangerModel.userData.leftFrontDoor.position.x = -currentX;
                hangerModel.userData.rightFrontDoor.position.x = currentX;
                
                if (hangerModel.userData.forceFieldMesh) {
                    hangerModel.userData.forceFieldMesh.visible = (hangerModel.userData.doorT > 0);
                }
            }
        }

        function updateLandingSequence(dtFactor) {
            if (!theCrestStation || !theCrestStation.userData.hangerModel) return;
            const hangerModel = theCrestStation.userData.hangerModel;
            
            const outerWP = new THREE.Vector3(0, -0.18, 12.0).applyMatrix4(hangerModel.matrixWorld);
            const approachWP = new THREE.Vector3(0, -0.18, 3.0).applyMatrix4(hangerModel.matrixWorld);
            const entryWP = new THREE.Vector3(0, -0.18, 0.5).applyMatrix4(hangerModel.matrixWorld);
            const hoverWP = new THREE.Vector3(-0.55, -0.18, 0.75).applyMatrix4(hangerModel.matrixWorld);
            const landWP = new THREE.Vector3(-0.55, -0.38, 0.75).applyMatrix4(hangerModel.matrixWorld);
            
            // In THREE.js, objects look down their local -Z axis.
            // If the hangar door is at local +Z, looking INTO the hangar means looking towards -Z.
            // So inward is hangerModel's native rotation.
            // Parked ships should face outward (+Z), which requires a 180 degree rotation.
            const inwardQuat = hangerModel.getWorldQuaternion(new THREE.Quaternion());
            const outwardQuat = hangerModel.getWorldQuaternion(new THREE.Quaternion()).multiply(
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI)
            );
            
            if (landingPhase === 1) {
                targetSpeed = 0;
                
                const dirToOuter = outerWP.clone().sub(playerShip.position).normalize();
                const toStation = theCrestStation.position.clone().sub(playerShip.position);
                const dot = toStation.dot(dirToOuter);
                const distToOuter = playerShip.position.distanceTo(outerWP);
                
                if (dot > 0 && dot < distToOuter) {
                    const closestPoint = playerShip.position.clone().add(dirToOuter.clone().multiplyScalar(dot));
                    if (closestPoint.distanceTo(theCrestStation.position) < 1000) {
                        const pushOut = closestPoint.clone().sub(theCrestStation.position).normalize();
                        landingApproachWaypoint = theCrestStation.position.clone().add(pushOut.multiplyScalar(1200));
                        landingPhase = 1.5;
                        return;
                    }
                }
                landingPhase = 1.8;
            }
            
            if (landingPhase === 1.5) {
                const toNav = landingApproachWaypoint.clone().sub(playerShip.position);
                if (toNav.length() > 50) {
                    const dir = toNav.normalize();
                    playerShip.position.add(dir.multiplyScalar(125 * 0.0064 * dtFactor));
                    const targetRot = new THREE.Quaternion().setFromRotationMatrix(
                        new THREE.Matrix4().lookAt(playerShip.position, landingApproachWaypoint, new THREE.Vector3(0, 1, 0))
                    );
                    playerShip.quaternion.slerp(targetRot, 0.03 * dtFactor);
                } else {
                    landingPhase = 1.8;
                }
            } else if (landingPhase === 1.8) {
                const toOuter = outerWP.clone().sub(playerShip.position);
                if (toOuter.length() > 50) {
                    const dir = toOuter.normalize();
                    playerShip.position.add(dir.multiplyScalar(125 * 0.0064 * dtFactor));
                    const targetRot = new THREE.Quaternion().setFromRotationMatrix(
                        new THREE.Matrix4().lookAt(playerShip.position, outerWP, new THREE.Vector3(0, 1, 0))
                    );
                    playerShip.quaternion.slerp(targetRot, 0.03 * dtFactor);
                } else {
                    landingPhase = 2;
                }
            } else if (landingPhase === 2) {
                if (!hangerModel.userData.landingCurve) {
                    const pts = [
                        new THREE.Vector3(0, -0.18, 12.0),
                        new THREE.Vector3(0, -0.18, 5.0),
                        new THREE.Vector3(0, -0.18, 1.0),
                        new THREE.Vector3(-0.1, -0.18, -0.5),
                        new THREE.Vector3(-0.55, -0.18, -0.5),
                        new THREE.Vector3(-0.55, -0.18, 0.75),
                        new THREE.Vector3(-0.55, -0.38, 0.75)
                    ];
                    hangerModel.userData.landingCurve = new THREE.CatmullRomCurve3(pts);
                    hangerModel.userData.landingCurve.curveType = 'centripetal';
                    hangerModel.userData.landingProgress = 0;
                    
                    // Capture initial offset to eliminate snapping jitter
                    const startPos = hangerModel.userData.landingCurve.getPointAt(0).applyMatrix4(hangerModel.matrixWorld);
                    hangerModel.userData.landingOffset = playerShip.position.clone().sub(startPos);
                }
                
                // Uniform arc-length speed - eliminates the weird speed up!
                let speed = 0.001; 
                if (hangerModel.userData.landingProgress > 0.8) speed = 0.0005;
                if (hangerModel.userData.landingProgress > 0.95) speed = 0.00025; // smooth landing
                
                hangerModel.userData.landingProgress += speed * dtFactor;
                let prog = hangerModel.userData.landingProgress;
                if (prog >= 1.0) prog = 1.0;
                
                // Use getPointAt for uniform speed along the curve
                const localPos = hangerModel.userData.landingCurve.getPointAt(prog);
                const worldPos = localPos.clone().applyMatrix4(hangerModel.matrixWorld);
                
                // Decay the offset smoothly to 0 over the first second
                hangerModel.userData.landingOffset.lerp(new THREE.Vector3(0,0,0), 0.05 * dtFactor);
                
                // Set absolute position exactly to avoid physics jitter
                playerShip.position.copy(worldPos).add(hangerModel.userData.landingOffset);
                
                // For rotation, look slightly ahead using getTangentAt
                let lookAhead = prog + 0.02;
                if (lookAhead > 1.0) lookAhead = 1.0;
                
                if (prog < 0.9) {
                    const localTangent = hangerModel.userData.landingCurve.getTangentAt(lookAhead);
                    localTangent.y = 0; // Keep ship level during approach
                    
                    if (localTangent.lengthSq() > 0.001) {
                        localTangent.normalize();
                        const worldTangent = localTangent.transformDirection(hangerModel.matrixWorld);
                        const lookTarget = playerShip.position.clone().add(worldTangent);
                        
                        const targetRot = new THREE.Quaternion().setFromRotationMatrix(
                            new THREE.Matrix4().lookAt(playerShip.position, lookTarget, new THREE.Vector3(0, 1, 0))
                        );
                        
                        // Blend smoothly into the spline path during the first 5% of the curve,
                        // then perfectly lock to the tangent to eliminate all wobbling/shaking.
                        if (prog < 0.05) {
                            playerShip.quaternion.slerp(targetRot, 0.2 * dtFactor);
                        } else {
                            playerShip.quaternion.copy(targetRot);
                        }
                    }
                } else {
                    // Final vertical descent: gracefully lock into the final parking orientation
                    playerShip.quaternion.slerp(outwardQuat, 0.1 * dtFactor);
                }
                
                if (prog >= 1.0) {
                    landingPhase = 6;
                    // Ensure perfectly placed
                    playerShip.position.copy(worldPos);
                    playerShip.quaternion.copy(outwardQuat);
                    showToast("🛬 LANDING COMPLETE. WELCOME TO THE CREST.");
                }
            } else if (landingPhase === 6) {
                playerShip.position.copy(landWP);
                playerShip.quaternion.copy(outwardQuat);
            } else if (landingPhase === 7) {
                playerShip.position.copy(landWP);
                playerShip.quaternion.copy(outwardQuat);
                
                if (hangerModel.userData.doorT >= 1) {
                    isLandingSequenceActive = false;
                    landingPhase = 0;
                    showToast("🚀 BLAST DOORS OPEN. YOU HAVE FLIGHT CONTROL.");
                }
            }
        }
