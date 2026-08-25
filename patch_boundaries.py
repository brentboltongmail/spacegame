import re

with open('index.html', 'r') as f:
    content = f.read()

# Fix clampAllWindowPositions
new_clamp = """        function clampAllWindowPositions() {
            const headerBoundary = 0; // Top of screen
            let didCorrection = false;
            document.querySelectorAll('.draggable-box').forEach(box => {
                const rect = box.getBoundingClientRect();
                let currentY = parseFloat(box.dataset.dragY) || 0;
                let currentX = parseFloat(box.dataset.dragX) || 0;
                
                const initialTop = rect.top - currentY;
                const initialLeft = rect.left - currentX;
                
                const minAllowedY = headerBoundary - initialTop;
                const maxAllowedY = window.innerHeight - initialTop - rect.height;
                const minAllowedX = -initialLeft;
                const maxAllowedX = window.innerWidth - initialLeft - rect.width;
                
                let changed = false;

                if (currentY < minAllowedY) { currentY = minAllowedY; changed = true; }
                if (currentY > maxAllowedY) { currentY = maxAllowedY; changed = true; }
                if (currentX < minAllowedX) { currentX = minAllowedX; changed = true; }
                if (currentX > maxAllowedX) { currentX = maxAllowedX; changed = true; }

                if (changed) {
                    box.dataset.dragY = currentY;
                    box.dataset.dragX = currentX;
                    box.style.transform = `translate(${currentX}px, ${currentY}px)`;

                    const dragId = box.dataset.dragId || box.id;
                    if (dragId && currentProfile) {
                        if (!currentProfile.boxPositions) currentProfile.boxPositions = {};
                        currentProfile.boxPositions[dragId] = { x: Math.round(currentX), y: Math.round(currentY) };
                        didCorrection = true;
                    }
                }
            });
            if (didCorrection) {
                saveProfileToServerSilent();
            }
        }"""
content = re.sub(
    r'function clampAllWindowPositions\(\) \{.*?saveProfileToServerSilent\(\);\n\s*\}\n\s*\}',
    new_clamp,
    content,
    flags=re.DOTALL
)

# Fix makeDraggable boundaries
# 1. Update headerBoundary to 0
content = content.replace(
    'const headerBoundary = 68; // Bottom border of fixed top menu bar (64px height + 4px margin)',
    'const headerBoundary = 0; // Top of screen'
)
# 2. Add maxAllowedY check
new_drag_move = """                    // Enforce top and bottom boundaries
                    const minAllowedY = headerBoundary - initialTop;
                    const maxAllowedY = window.innerHeight - initialTop - rect.height;
                    if (currentY < minAllowedY) {
                        currentY = minAllowedY;
                    } else if (currentY > maxAllowedY) {
                        currentY = maxAllowedY;
                    }

                    // Enforce left and right screen boundaries"""
content = re.sub(
    r'// Enforce top menu bar boundary restriction.*?// Enforce left and right screen boundaries',
    new_drag_move,
    content,
    flags=re.DOTALL
)

with open('index.html', 'w') as f:
    f.write(content)
