import re

with open('index.html', 'r') as f:
    content = f.read()

# Fix cinematic-blackout-overlay z-index
content = re.sub(
    r'\.cinematic-blackout-overlay\s*\{[^}]*z-index:\s*\d+;',
    lambda m: m.group(0).replace(re.search(r'z-index:\s*\d+;', m.group(0)).group(0), 'z-index: 9998;'),
    content
)

# Fix cinematic-end-modal z-index
content = re.sub(
    r'#cinematic-end-modal\s*\{[^}]*z-index:\s*\d+;',
    lambda m: m.group(0).replace(re.search(r'z-index:\s*\d+;', m.group(0)).group(0), 'z-index: 9999;'),
    content
)

with open('index.html', 'w') as f:
    f.write(content)
