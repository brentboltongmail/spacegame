import re

with open('index.html', 'r') as f:
    content = f.read()

# Replace HTML sliders
replacements = {
    '<span id="lbl-set-roll">125%</span>': '<span id="lbl-set-roll">50%</span>',
    '<input type="range" id="slider-set-roll" min="10" max="250" value="125" oninput="updateGameSettings()">': 
    '<input type="range" id="slider-set-roll" min="10" max="100" value="50" oninput="updateGameSettings()">',
    
    '<span id="lbl-set-cam">80%</span>': '<span id="lbl-set-cam">80%</span>',
    '<input type="range" id="slider-set-cam" min="1" max="100" value="80" oninput="updateGameSettings()">':
    '<input type="range" id="slider-set-cam" min="10" max="100" value="80" oninput="updateGameSettings()">',

    '<span id="lbl-set-throttle">125%</span>': '<span id="lbl-set-throttle">50%</span>',
    '<input type="range" id="slider-set-throttle" min="50" max="250" value="125" oninput="updateGameSettings()">':
    '<input type="range" id="slider-set-throttle" min="10" max="100" value="50" oninput="updateGameSettings()">',

    '<span id="lbl-set-shield-regen">100%</span>': '<span id="lbl-set-shield-regen">33%</span>',
    '<input type="range" id="slider-set-shield-regen" min="0" max="300" value="100" step="10" oninput="updateGameSettings()">':
    '<input type="range" id="slider-set-shield-regen" min="10" max="100" value="33" step="1" oninput="updateGameSettings()">',

    '<span id="lbl-set-hull-regen">100%</span>': '<span id="lbl-set-hull-regen">33%</span>',
    '<input type="range" id="slider-set-hull-regen" min="0" max="300" value="100" step="10" oninput="updateGameSettings()">':
    '<input type="range" id="slider-set-hull-regen" min="10" max="100" value="33" step="1" oninput="updateGameSettings()">',

    '<span id="lbl-set-enemy-dmg">100%</span>': '<span id="lbl-set-enemy-dmg">20%</span>',
    '<input type="range" id="slider-set-enemy-dmg" min="10" max="500" value="100" step="10" oninput="updateGameSettings()">':
    '<input type="range" id="slider-set-enemy-dmg" min="10" max="100" value="20" step="1" oninput="updateGameSettings()">',

    '<span id="lbl-set-player-dmg">100%</span>': '<span id="lbl-set-player-dmg">20%</span>',
    '<input type="range" id="slider-set-player-dmg" min="10" max="500" value="100" step="10" oninput="updateGameSettings()">':
    '<input type="range" id="slider-set-player-dmg" min="10" max="100" value="20" step="1" oninput="updateGameSettings()">',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Change gameMechanicsConfig defaults
config_old = """        let gameMechanicsConfig = {
            rollSpeed: 125,
            turnSpeed: 50,
            cameraLag: 80,
            throttleAccel: 125,
            shieldRegenMult: 100,
            hullRegenMult: 100,
            enemyDamageMult: 100,
            playerDamageMult: 100,
            flashOnHit: true
        };"""
config_new = """        let gameMechanicsConfig = {
            rollSpeed: 50,
            turnSpeed: 50,
            cameraLag: 80,
            throttleAccel: 50,
            shieldRegenMult: 33,
            hullRegenMult: 33,
            enemyDamageMult: 20,
            playerDamageMult: 20,
            flashOnHit: true
        };"""
content = content.replace(config_old, config_new)

with open('index.html', 'w') as f:
    f.write(content)
