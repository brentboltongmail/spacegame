import re

with open('index.html', 'r') as f:
    content = f.read()

content = content.replace(
    '// Max speed cap fixed at 400 (which equates to 150,000 km/h in HUD)\n        const maxSpeedCap = 400;',
    '// Max speed cap fixed at 600 (which equates to 150,000 km/h in HUD)\n        const maxSpeedCap = 600;'
)

content = content.replace(
    'const postedSpeed = Math.round(currentSpeed * 375); // Posted speed scaled to max 150,000 km/h',
    'const postedSpeed = Math.round(currentSpeed * 250); // Posted speed scaled to max 150,000 km/h'
)

content = content.replace(
    "if (speedElem) speedElem.innerText = `SPEED: ${postedSpeed.toLocaleString()} km/h ${currentSpeed > 360 ? '[MAX THROTTLE]' : ''}`;",
    "if (speedElem) speedElem.innerText = `SPEED: ${postedSpeed.toLocaleString()} km/h ${currentSpeed > (maxSpeedCap * 0.9) ? '[MAX THROTTLE]' : ''}`;"
)

content = content.replace(
    'const postedSpeed = Math.round(currentSpeed * 375);',
    'const postedSpeed = Math.round(currentSpeed * 250);'
)

content = content.replace(
    'const throttleRatio = Math.min(Math.max(currentSpeed / 400, 0), 1);',
    'const throttleRatio = Math.min(Math.max(currentSpeed / maxSpeedCap, 0), 1);'
)

with open('index.html', 'w') as f:
    f.write(content)
