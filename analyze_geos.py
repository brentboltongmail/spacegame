import re

with open('js/engine/models.js', 'r', encoding='utf8') as f:
    content = f.read()

# Let's see all PlaneGeometry
planes = re.findall(r'new THREE\.PlaneGeometry\([^)]+\)', content)
for p in set(planes):
    print(p)

# Let's see BoxGeometry
boxes = re.findall(r'new THREE\.BoxGeometry\([^)]+\)', content)
for b in set(boxes):
    print(b)
