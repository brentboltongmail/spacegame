import re

with open('js/engine/models.js', 'r', encoding='utf8') as f:
    content = f.read()

# Refactor door
content = re.sub(
    r"texLoader\.load\('data/textures/hangar_doors\.jpg', function\(doorTex\) \{(.*?)\}\);",
    r"const doorTex = texLoader.load('data/textures/hangar_doors.jpg');\1",
    content,
    flags=re.DOTALL
)

# Refactor wall
content = re.sub(
    r"texLoader\.load\('data/textures/hangar_wall\.jpg', function\(wallTex\) \{(.*?)\}\);",
    r"const wallTex = texLoader.load('data/textures/hangar_wall.jpg');\1",
    content,
    flags=re.DOTALL
)

# Refactor tools
content = re.sub(
    r"texLoader\.load\('data/textures/hangar_tools\.jpg', function\(toolsTex\) \{(.*?)\}\);",
    r"const toolsTex = texLoader.load('data/textures/hangar_tools.jpg');\1",
    content,
    flags=re.DOTALL
)

# Refactor barrels
content = re.sub(
    r"texLoader\.load\('data/textures/hangar_barrels\.jpg', function\(barrelsTex\) \{(.*?)\}\);",
    r"const barrelsTex = texLoader.load('data/textures/hangar_barrels.jpg');\1",
    content,
    flags=re.DOTALL
)

# Refactor floor
content = re.sub(
    r"texLoader\.load\('data/textures/hangar_floor\.jpg', function\(floorTex\) \{(.*?)\}\);",
    r"const floorTex = texLoader.load('data/textures/hangar_floor.jpg');\1",
    content,
    flags=re.DOTALL
)

# Refactor ceiling
content = re.sub(
    r"texLoader\.load\('data/textures/hangar_ceiling\.jpg', function\(ceilingTex\) \{(.*?)\}\);",
    r"const ceilingTex = texLoader.load('data/textures/hangar_ceiling.jpg');\1",
    content,
    flags=re.DOTALL
)

with open('js/engine/models.js', 'w', encoding='utf8') as f:
    f.write(content)
print("Made textures synchronous!")
