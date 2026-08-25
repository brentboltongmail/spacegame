import re

with open('index.html', 'r') as f:
    content = f.read()

# Remove from makeDraggable
bad_block = r'\s*// Observer to update minimized title.*?(?=\s*const dragStart = \(e\) => \{)'
content = re.sub(bad_block, '\n', content, flags=re.DOTALL)

# Add to the end of the script before </script>
end_block = """
        // Observer to update minimized title for Objective window
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
                
                // Sync periodically or after slight delay to ensure drag handle is created
                setTimeout(syncObjectiveTitle, 500);
            }
        });
"""

content = content.replace('</script>', end_block + '\n</script>')

with open('index.html', 'w') as f:
    f.write(content)
