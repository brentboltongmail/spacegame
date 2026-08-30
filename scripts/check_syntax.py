import os
import re
import sys

def check_js_files():
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
    has_error = False

    for filepath in files:
        if not os.path.exists(filepath):
            continue
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find top-level const, let, var declarations (0-8 indentation spaces)
        matches = re.findall(r'^(?:[ \t]{0,8})(?:const|let|var)\s+([a-zA-Z0-9_\$]+)', content, re.MULTILINE)
        for varname in matches:
            if varname in declared_vars:
                print(f"ERROR: '{varname}' is declared globally in BOTH '{declared_vars[varname]}' and '{filepath}'!")
                has_error = True
            else:
                declared_vars[varname] = filepath

    if has_error:
        sys.exit(1)
    else:
        print("CLEAN: 0 global variable collisions found across all JS scripts.")

if __name__ == '__main__':
    check_js_files()
