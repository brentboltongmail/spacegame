import re

files = [
    'js/core/events.js',
    'js/config/data.js',
    'js/config/profile.js',
    'js/engine/scene.js',
    'js/engine/models.js',
    'js/engine/weapons.js',
    'js/engine/loop.js',
    'js/ui/hangar.js',
    'js/core/audio.js',
    'js/ui/starmap.js',
    'js/ui/interactions.js',
    'js/main.js'
]

declared_vars = {}

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to find top level (indentation 0 or 8 spaces max) const/let
    matches = re.findall(r'^(?:[ \t]{0,8})(?:const|let|var)\s+([a-zA-Z0-9_\$]+)', content, re.MULTILINE)
    for varname in matches:
        if varname in declared_vars:
            print(f"DUPLICATE DECLARATION ERROR: '{varname}' declared in {declared_vars[varname]} AND {filepath}")
        else:
            declared_vars[varname] = filepath

print("--- GLOBAL VAR CHECK COMPLETE ---")
