import re

with open('index.html', 'r') as f:
    content = f.read()

# Replace maxSpeedCap
content = re.sub(
    r'// Max speed cap fixed at 600 \(which equates to 150,000 km/h in HUD\)\n\s*const maxSpeedCap = 600;',
    '// Max speed cap fixed at 900 (which equates to 150,000 km/h in HUD)\n        const maxSpeedCap = 900;',
    content
)

# Replace postedSpeed hardcoded multiplier
content = re.sub(
    r'const postedSpeed = Math\.round\(currentSpeed \* 250\);',
    'const postedSpeed = Math.round(currentSpeed * (150000 / maxSpeedCap));',
    content
)

# Replace 300 with 450 for the 50% start speed
content = re.sub(
    r'targetSpeed = 300;',
    'targetSpeed = 450;',
    content
)
content = re.sub(
    r'currentSpeed = 300;',
    'currentSpeed = 450;',
    content
)

with open('index.html', 'w') as f:
    f.write(content)
