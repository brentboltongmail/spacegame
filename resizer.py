with open('index.html', 'r') as f:
    content = f.read()

resizer_logic = """
        // Hangar Modal Resizer Logic
        window.addEventListener('DOMContentLoaded', () => {
            const resizer = document.getElementById('hangar-resizer');
            const grid = document.querySelector('.modal-body-grid');
            let isResizing = false;

            if (resizer && grid) {
                resizer.addEventListener('mousedown', (e) => {
                    isResizing = true;
                    document.body.style.cursor = 'col-resize';
                    document.body.style.userSelect = 'none'; // Prevent text selection
                });

                window.addEventListener('mousemove', (e) => {
                    if (!isResizing) return;
                    
                    const gridRect = grid.getBoundingClientRect();
                    // Calculate percentage width of the left pane
                    let newWidth = ((e.clientX - gridRect.left) / gridRect.width) * 100;
                    
                    // Clamp between 20% and 80%
                    if (newWidth < 20) newWidth = 20;
                    if (newWidth > 80) newWidth = 80;
                    
                    grid.style.gridTemplateColumns = `${newWidth}% 10px 1fr`;
                    
                    // Trigger resize on the canvas so ThreeJS updates its aspect ratio
                    if (window.upgradeHangarCamera && window.upgradeHangarRenderer) {
                        const container = document.getElementById('hangar-canvas-container');
                        if (container) {
                            upgradeHangarCamera.aspect = container.clientWidth / container.clientHeight;
                            upgradeHangarCamera.updateProjectionMatrix();
                            upgradeHangarRenderer.setSize(container.clientWidth, container.clientHeight);
                        }
                    }
                });

                window.addEventListener('mouseup', () => {
                    if (isResizing) {
                        isResizing = false;
                        document.body.style.cursor = '';
                        document.body.style.userSelect = '';
                    }
                });
            }
        });
"""

target = "    </script>"
content = content.replace(target, resizer_logic + target)

with open('index.html', 'w') as f:
    f.write(content)
