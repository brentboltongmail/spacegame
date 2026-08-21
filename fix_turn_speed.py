with open('index.html', 'r') as f:
    content = f.read()

# 1. Fix the slider HTML
slider_old = '<input type="range" id="slider-set-turn" min="10" max="1000" value="150" oninput="updateGameSettings()">'
slider_new = '<input type="range" id="slider-set-turn" min="10" max="100" value="50" oninput="updateGameSettings()">'
content = content.replace(slider_old, slider_new)

# 2. Fix the initial default value in gameMechanicsConfig
config_old = 'turnSpeed: 150,'
config_new = 'turnSpeed: 50,'
content = content.replace(config_old, config_new)

# 3. Fix the label default HTML
label_old = '<span id="lbl-set-turn">150%</span>'
label_new = '<span id="lbl-set-turn">50%</span>'
content = content.replace(label_old, label_new)

# 4. Fix the math in animate()
math_old = """            // Base turn rate of 0.0052 modified by the user's turn speed setting
            const turnMult = (gameMechanicsConfig.turnSpeed !== undefined ? gameMechanicsConfig.turnSpeed : 150) / 100;
            const turnRate = 0.0052 * turnMult;"""
math_new = """            // Slider is 10% to 100%. Map 10% to a slow turn, 100% to an insanely fast turn.
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
            
            const turnRate = 0.0052 * turnMult;"""
content = content.replace(math_old, math_new)

with open('index.html', 'w') as f:
    f.write(content)
