import trimesh
import numpy as np

# Load the scene
scene = trimesh.load('fbx/crest_hanger.glb', force='scene')
geom = list(scene.geometry.values())[0]

print(f"Original vertices: {len(geom.vertices)}")
print(f"Original faces: {len(geom.faces)}")
print(f"Bounds: {geom.bounds}")

min_x, min_y, min_z = geom.bounds[0]
max_x, max_y, max_z = geom.bounds[1]

# Print some vertex positions to understand structure
# Let's count vertices on the middle of the Y axis
mid_y = (min_y + max_y) / 2
tolerance = (max_y - min_y) * 0.1

mid_y_verts = [v for v in geom.vertices if abs(v[1] - mid_y) < tolerance]
print(f"Vertices near mid Y: {len(mid_y_verts)}")
