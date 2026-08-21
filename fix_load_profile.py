with open('index.html', 'r') as f:
    content = f.read()

target = """                        if (set.playerDamageMult !== undefined) document.getElementById('slider-set-player-dmg').value = set.playerDamageMult;
                        if (set.flashOnHit !== undefined) {
                            const chk = document.getElementById('chk-flash-on-hit');
                            if (chk) chk.checked = set.flashOnHit;
                        }"""

replacement = target + "\n                        updateGameSettings();"

content = content.replace(target, replacement)

with open('index.html', 'w') as f:
    f.write(content)
