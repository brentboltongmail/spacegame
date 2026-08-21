with open('index.html', 'r') as f:
    content = f.read()

target = """                    // Animate Heavy Turrets Target Tracking (Aim toward player or target)
                    if (capitalShip.userData.turrets && playerShip) {
                        capitalShip.userData.turrets.forEach(turret => {
                            const worldPos = new THREE.Vector3();
                            turret.getWorldPosition(worldPos);
                            const dx = playerShip.position.x - worldPos.x;
                            const dz = playerShip.position.z - worldPos.z;
                            const targetAngle = Math.atan2(dx, dz) - capitalShip.rotation.y;
                            turret.rotation.y = THREE.MathUtils.lerp(turret.rotation.y, targetAngle, 0.03);
                        });
                    }"""

replacement = """                    // Animate Heavy Turrets Target Tracking (Aim toward closest enemy, fallback to player)
                    if (capitalShip.userData.turrets) {
                        let closestEnemy = null;
                        let minDist = 8000;
                        for (const enemy of enemyShips) {
                            if (!enemy || !enemy.userData || enemy.userData.hp <= 0) continue;
                            const d = enemy.position.distanceTo(capitalShip.position);
                            if (d < minDist) {
                                minDist = d;
                                closestEnemy = enemy;
                            }
                        }

                        let targetObj = closestEnemy ? closestEnemy : playerShip;
                        if (targetObj) {
                            capitalShip.userData.turrets.forEach(turret => {
                                const worldPos = new THREE.Vector3();
                                turret.getWorldPosition(worldPos);
                                const dx = targetObj.position.x - worldPos.x;
                                const dz = targetObj.position.z - worldPos.z;
                                const targetAngle = Math.atan2(dx, dz) - capitalShip.rotation.y;
                                turret.rotation.y = THREE.MathUtils.lerp(turret.rotation.y, targetAngle, 0.03);

                                // Fire lasers if tracking an enemy and within range
                                if (closestEnemy && minDist < 4000) {
                                    if (!turret.userData.lastFireTime) turret.userData.lastFireTime = 0;
                                    if (Date.now() - turret.userData.lastFireTime > 400 + Math.random() * 600) {
                                        turret.userData.lastFireTime = Date.now();
                                        
                                        const cLaser = getPooledLaserBolt();
                                        if (cLaser) {
                                            cLaser.visible = true;
                                            
                                            // Get the exact world orientation of the turret barrel
                                            const turretWorldQuat = new THREE.Quaternion();
                                            turret.getWorldQuaternion(turretWorldQuat);
                                            cLaser.quaternion.copy(turretWorldQuat);
                                            
                                            // Position at the barrel tip
                                            const barrelOffset = new THREE.Vector3(0, 0.5, 4.0).applyQuaternion(turretWorldQuat);
                                            cLaser.position.copy(worldPos).add(barrelOffset);
                                            cLaser.userData.prevPos.copy(cLaser.position);
                                            
                                            // Fire slightly ahead / towards the enemy
                                            const dir = new THREE.Vector3();
                                            dir.subVectors(closestEnemy.position, cLaser.position).normalize();
                                            cLaser.userData.velocity.copy(dir).multiplyScalar(15);
                                            
                                            if (!laserProjectiles.includes(cLaser)) laserProjectiles.push(cLaser);
                                            
                                            // Fallback audio
                                            playLaserAudio();
                                        }
                                    }
                                }
                            });
                        }
                    }"""

content = content.replace(target, replacement)

with open('index.html', 'w') as f:
    f.write(content)
