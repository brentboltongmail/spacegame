import os

def patch_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)

loop_replacements = [
    ('objElem.innerHTML = `<span style="color: #f43f5e; font-weight: bold; text-shadow: 0 0 8px rgba(244,63,94,0.8);">⚠️ DOMINION FLEET WARP IN: ${remaining}s</span>`;', '// removed toast line'),
    ('objElem.innerHTML = `<span style="color: #f43f5e; font-weight: bold; text-shadow: 0 0 8px rgba(244,63,94,0.8);">⚔️ ENGAGE DOMINION SIEGE FLEET & ESCORT FIGHTERS</span>`;', '// removed toast line'),
    ('showToast("⚡ DOMINION DREADNOUGHTS ENGAGING HEAVY PURPLE BOMBARDMENT BEAMS ON TITAN CRUST!");', '// removed toast line'),
    ('showToast("💥 DOMINION DREADNOUGHT ANNIHILATED! +25,000 SC AWARDED!");', '// removed toast line')
]
patch_file('js/engine/loop.js', loop_replacements)

models_replacements = [
    ('showToast("⚠️ DOMINION SIEGE FLEET WARP SIGNATURES DETECTED — ARRIVAL IN 7 SECONDS!");', '// removed toast line'),
    ('showToast("🧲 DOMINION TRACTOR BEAMS LOCKED — HAULING HUGE GOLDEN RING INTO SPACE!");', '// removed toast line'),
    ('showToast("🧲 DOMINION TRACTOR BEAMS ENGAGED — PULLING GOLDEN GATE OFF TITAN INTO SPACE!");', '// removed toast line'),
    ('showToast("⚠️ WARNING: DOMINION DREADNOUGHTS TARGETING THE CREST!");', '// removed toast line')
]
patch_file('js/engine/models.js', models_replacements)

weapons_replacements = [
    ('showToast("⚠️ 6 DOMINION FIGHTERS ENGAGED! TARGET LOCK ACTIVE");', '// removed toast line'),
    ('showToast("Approaching Dominion Capital Flagship near Titan!");', '// removed toast line')
]
patch_file('js/engine/weapons.js', weapons_replacements)

print("Patch applied successfully.")
