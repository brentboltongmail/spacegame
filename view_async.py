import re

with open('js/engine/models.js', 'r', encoding='utf8') as f:
    content = f.read()

# Let's see the texture load lines
matches = re.findall(r'texLoader\.load\([^\)]+\)\s*\{', content)
for m in matches:
    print(m)
