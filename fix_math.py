import re

with open('index.html', 'r') as f:
    content = f.read()

# 1. Roll Speed
roll_old = r"const rollRate = turnRate \* 0\.4 \* \(gameMechanicsConfig\.rollSpeed / 100\);"
roll_new = """let _roll = gameMechanicsConfig.rollSpeed !== undefined ? gameMechanicsConfig.rollSpeed : 50;
            if (_roll > 100) _roll = 100;
            const rollRate = turnRate * 0.4 * ((_roll / 100) * 2.5);"""
content = re.sub(roll_old, roll_new, content)

# 2. Throttle
throttle_old = r"const throttleMult = \(gameMechanicsConfig\.throttleAccel \|\| 100\) / 100;"
throttle_new = """let _throttle = gameMechanicsConfig.throttleAccel !== undefined ? gameMechanicsConfig.throttleAccel : 50;
            if (_throttle > 100) _throttle = 100;
            const throttleMult = (_throttle / 100) * 2.5;"""
content = re.sub(throttle_old, throttle_new, content)

# 3. Shield Regen
shield_old = r"const shieldMult = \(gameMechanicsConfig\.shieldRegenMult \|\| 100\) / 100;"
shield_new = """let _shield = gameMechanicsConfig.shieldRegenMult !== undefined ? gameMechanicsConfig.shieldRegenMult : 33;
                if (_shield > 100) _shield = 100;
                const shieldMult = (_shield / 100) * 3.0;"""
content = re.sub(shield_old, shield_new, content)

# 4. Hull Regen
hull_old = r"const hullMult = \(gameMechanicsConfig\.hullRegenMult \|\| 100\) / 100;"
hull_new = """let _hull = gameMechanicsConfig.hullRegenMult !== undefined ? gameMechanicsConfig.hullRegenMult : 33;
                if (_hull > 100) _hull = 100;
                const hullMult = (_hull / 100) * 3.0;"""
content = re.sub(hull_old, hull_new, content)

# 5. Enemy Damage
edmg_old = r"const enemyDmgMult = \(gameMechanicsConfig\.enemyDamageMult \|\| 100\) / 100;"
edmg_new = """let _eDmg = gameMechanicsConfig.enemyDamageMult !== undefined ? gameMechanicsConfig.enemyDamageMult : 20;
                    if (_eDmg > 100) _eDmg = 100;
                    const enemyDmgMult = (_eDmg / 100) * 5.0;"""
content = re.sub(edmg_old, edmg_new, content)

# 6. Player Damage
pdmg_old = r"const pDmgMult = \(gameMechanicsConfig\.playerDamageMult \|\| 100\) / 100;"
pdmg_new = """let _pDmg = gameMechanicsConfig.playerDamageMult !== undefined ? gameMechanicsConfig.playerDamageMult : 20;
                        if (_pDmg > 100) _pDmg = 100;
                        const pDmgMult = (_pDmg / 100) * 5.0;"""
content = re.sub(pdmg_old, pdmg_new, content)

with open('index.html', 'w') as f:
    f.write(content)
