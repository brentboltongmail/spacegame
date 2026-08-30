import trimesh
import numpy as np

print("Loading the_crest.glb...")
station = trimesh.load("fbx/the_crest.glb", force="scene")

eps = 0.05
# Hexagon profile coordinates
# (X, Y)
c = [
    (1.218 + eps, eps),
    (0.926 + eps, 0.39 + eps),
    (-0.926 - eps, 0.39 + eps),
    (-1.218 - eps, eps),
    (-0.926 - eps, -0.39 - eps),
    (0.926 + eps, -0.39 - eps)
]
z_front = 0.94 + eps
z_back = -0.86 - eps

vertices = []
# Front face vertices (z_front)
for pt in c: vertices.append([pt[0], pt[1], z_front])
# Back face vertices (z_back)
for pt in c: vertices.append([pt[0], pt[1], z_back])

faces = [
    # Front cap
    [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5],
    # Back cap (reversed winding)
    [8, 7, 6], [9, 8, 6], [10, 9, 6], [11, 10, 6],
]
# Side faces
for i in range(6):
    next_i = (i + 1) % 6
    faces.append([i, i + 6, next_i + 6])
    faces.append([i, next_i + 6, next_i])

cutter = trimesh.Trimesh(vertices=vertices, faces=faces)
cutter.fix_normals()

S = trimesh.transformations.scale_matrix(1.0)
S[0,0] = 0.035
S[1,1] = 0.025
S[2,2] = 0.10
R = trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0])
T = trimesh.transformations.translation_matrix([0.20, 0.0, 0.0])
matrix = trimesh.transformations.concatenate_matrices(T, R, S)
cutter.apply_transform(matrix)

trimesh.boolean.engine = "manifold"

print("Performing boolean difference...")
new_geometries = {}
for name, geom in station.geometry.items():
    if not isinstance(geom, trimesh.Trimesh):
        new_geometries[name] = geom
        continue
    
    overlap = True
    if geom.bounds[1][0] < cutter.bounds[0][0] or geom.bounds[0][0] > cutter.bounds[1][0]: overlap = False
    if geom.bounds[1][1] < cutter.bounds[0][1] or geom.bounds[0][1] > cutter.bounds[1][1]: overlap = False
    if geom.bounds[1][2] < cutter.bounds[0][2] or geom.bounds[0][2] > cutter.bounds[1][2]: overlap = False
    
    if not overlap:
        new_geometries[name] = geom
        continue

    print(f"  Cutting mesh {name}...")
    try:
        diff = geom.difference(cutter)
        if diff.is_empty:
            continue
        new_geometries[name] = diff
        print(f"    -> Cut successfully.")
    except Exception as e:
        print(f"    -> Failed: {e}")
        new_geometries[name] = geom

station.geometry = new_geometries
print("Exporting carved station...")
station.export("fbx/the_crest_carved.glb")
print("Done!")

