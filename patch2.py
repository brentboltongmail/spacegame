import re

with open('js/engine/models.js', 'r', encoding='utf8') as f:
    lines = f.readlines()

start_idx = 0
end_idx = 0
for i, line in enumerate(lines):
    if "ATMOSPHERIC CONTAINMENT FORCE FIELD SHIELD" in line:
        start_idx = i
    if "model.add(hangerModel);" in line:
        end_idx = i
        break

print(f"Hangar block from {start_idx} to {end_idx}")

for i in range(start_idx, end_idx):
    line = lines[i]
    match = re.search(r'new THREE\.PlaneGeometry\(([^,]+),\s*([^,)]+)\)', line)
    if match:
        new_geo = f"new THREE.PlaneGeometry({match.group(1)}, {match.group(2)}, 4, 4)"
        lines[i] = line[:match.start()] + new_geo + line[match.end():]

deform_code = """
                    // Apply hexagon deformation to all programmatically added meshes in the hanger
                    const stretchAmount = 0.4;
                    const mid_y = 0;
                    const half_y = 0.465;
                    
                    hangerModel.updateMatrixWorld(true);
                    
                    hangerModel.children.forEach(child => {
                        // We also need to check borderGroup! It's a Group, so let's traverse
                        child.traverse(obj => {
                            if (obj.isMesh && obj.geometry.type === 'PlaneGeometry') {
                                const pos = obj.geometry.attributes.position;
                                for (let j = 0; j < pos.count; j++) {
                                    // 1. Local to Hanger-local
                                    const v = new THREE.Vector3().fromBufferAttribute(pos, j);
                                    v.applyMatrix4(obj.matrix);
                                    
                                    // If obj is inside a group (like borderGroup), we need its matrix relative to hangerModel
                                    // Wait, obj.matrix is only local to its parent!
                                    // The parent is borderGroup, which is a child of hangerModel.
                                    // So we need obj.matrix relative to hangerModel.
                                }
                            }
                        });
                    });
"""
