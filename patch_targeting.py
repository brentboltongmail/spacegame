import re

with open('index.html', 'r') as f:
    content = f.read()

# Add capital ships to target lock candidate check
capital_targeting_logic = """
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
"""

content = content.replace(
    '// --- 3D TARGET LOCK BOX UPDATER ---',
    capital_targeting_logic + '\n            // --- 3D TARGET LOCK BOX UPDATER ---'
)

# Update targetBox3D scaling for capital ships
content = content.replace(
    'const s = 1.2;\n                    targetBox3D.scale.set(s, s, s);',
    'const s = closestEnemy.userData.name ? (closestEnemy.userData.scale / 15 || 50) : 1.2;\n                    targetBox3D.scale.set(s, s, s);'
)


with open('index.html', 'w') as f:
    f.write(content)
