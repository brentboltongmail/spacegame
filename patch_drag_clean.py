import re

with open('index.html', 'r') as f:
    content = f.read()

# Add ID to the objective card explicitly so it's easier to find
content = content.replace(
    '<div class="hud-card">\n                        <div class="hud-title">SECTOR / OBJECTIVE</div>\n                        <div class="hud-stat" id="hud-sector"',
    '<div class="hud-card" id="drag-sector-objective">\n                        <div class="hud-title">SECTOR / OBJECTIVE</div>\n                        <div class="hud-stat" id="hud-sector"'
)

# Observer script to place at the very end before </body>
observer_script = """
<script>
document.addEventListener('DOMContentLoaded', () => {
    const sectorEl = document.getElementById('hud-sector');
    if (sectorEl) {
        const syncObjectiveTitle = () => {
            const box = document.getElementById('drag-sector-objective');
            if (box) {
                const label = box.querySelector('.drag-handle-label');
                if (label) {
                    label.innerText = sectorEl.innerText;
                }
            }
        };
        const observer = new MutationObserver(syncObjectiveTitle);
        observer.observe(sectorEl, { childList: true, characterData: true, subtree: true });
        
        // Sync after a brief delay to ensure drag handle is created
        setTimeout(syncObjectiveTitle, 500);
    }
});
</script>
"""

content = content.replace('</body>', observer_script + '\n</body>')

with open('index.html', 'w') as f:
    f.write(content)
