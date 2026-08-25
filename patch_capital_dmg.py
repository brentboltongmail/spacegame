import re

with open('index.html', 'r') as f:
    content = f.read()

# 1. Add hp to capital ships
content = content.replace(
    "fighterLaunchInterval: 11000 + Math.random() * 6000",
    "fighterLaunchInterval: 11000 + Math.random() * 6000,\n                hp: 4500,\n                maxHp: 4500,\n                isDead: false"
)

# 2. Add capital ship damage check in the laser loop
capital_dmg_logic = """
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
                                if (credDisp) credDisp.innerText = `${playerCredits.toLocaleString()} SC`;
                                showToast("💥 DOMINION DREADNOUGHT ANNIHILATED! +25,000 SC AWARDED!");
                            }
                            break;
                        }
                    }
                }
"""

content = content.replace(
    'if (hitEnemy || laser.position.distanceTo(playerShip.position) > 3000) {',
    capital_dmg_logic + '\n                if (hitEnemy || laser.position.distanceTo(playerShip.position) > 3000) {'
)

with open('index.html', 'w') as f:
    f.write(content)
