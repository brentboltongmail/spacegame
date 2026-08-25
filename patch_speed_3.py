import re

with open('index.html', 'r') as f:
    content = f.read()

# Replace maxSpeedCap
content = re.sub(
    r'// Max speed cap fixed at 900 \(which equates to 150,000 km/h in HUD\)\n\s*const maxSpeedCap = 900;',
    '// Max speed cap fixed at 1350 (which equates to 150,000 km/h in HUD)\n        const maxSpeedCap = 1350;',
    content
)

# Replace targetSpeed and currentSpeed from 450 to 675
content = re.sub(
    r'targetSpeed = 450;',
    'targetSpeed = 675;',
    content
)
content = re.sub(
    r'currentSpeed = 450;',
    'currentSpeed = 675;',
    content
)

with open('index.html', 'w') as f:
    f.write(content)
