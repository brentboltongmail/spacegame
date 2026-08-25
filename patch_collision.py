import re

with open('index.html', 'r') as f:
    content = f.read()

collision_code = """
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
                        const damageAmt = 8 * dmgMult; // A bit of damage for ramming
                        
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
"""

content = content.replace(
    '                    }\n                }\n            }',
    '                    }\n                }\n            }\n' + collision_code,
    1 # Replace first occurrence which is Titan Repulse block (maybe? let's be safer)
)

with open('index.html', 'w') as f:
    f.write(content)
