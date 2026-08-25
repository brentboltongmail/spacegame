import re

with open('index.html', 'r') as f:
    content = f.read()

# Add ID to the objective card explicitly so it's easier to find
content = content.replace(
    '<div class="hud-card">\n                        <div class="hud-title">SECTOR / OBJECTIVE</div>\n                        <div class="hud-stat" id="hud-sector"',
    '<div class="hud-card" id="drag-sector-objective">\n                        <div class="hud-title">SECTOR / OBJECTIVE</div>\n                        <div class="hud-stat" id="hud-sector"'
)

# Insert the observer script after the definition of saveProfileToServerSilent or in init3DSimulator
observer_script = """
        // Observer to update minimized title for Objective window
        const sectorEl = document.getElementById('hud-sector');
        if (sectorEl) {
            const observer = new MutationObserver((mutations) => {
                const box = document.getElementById('drag-sector-objective');
                if (box) {
                    const label = box.querySelector('.drag-handle-label');
                    if (label) {
                        label.innerText = sectorEl.innerText;
                    }
                }
            });
            observer.observe(sectorEl, { childList: true, characterData: true, subtree: true });
        }
"""

# Find the end of init3DSimulator() or just put it in DOMContentLoaded
content = content.replace(
    '// Restore saved position & minimize state for current profile',
    observer_script + '\n                // Restore saved position & minimize state for current profile'
)

with open('index.html', 'w') as f:
    f.write(content)
