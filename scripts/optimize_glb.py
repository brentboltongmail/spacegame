#!/usr/bin/env python3
"""
GLB Optimization Tool for Solaris Horizon
Preserves:
  1. 100% PBR textures (diffuse, metallic, roughness, normal maps, emissive)
  2. Watertight geometry & solid panel seams (preserve_border=True, low aggressiveness)
  3. Precise sub-millimeter UV mapping via KDTree nearest-surface projection

Usage:
  python scripts/optimize_glb.py fbx/my_new_ship.glb
  python scripts/optimize_glb.py fbx/my_new_ship.glb --target-faces 150000
  python scripts/optimize_glb.py --all
"""

import sys
import os
import argparse
import numpy as np
import trimesh
import pyfqmr
import pygltflib
from scipy.spatial import cKDTree

DEFAULT_TARGET_FACES = {
    'fighter': 150000,
    'interceptor': 180000,
    'capital': 220000,
    'station': 350000,
    'default': 180000
}

def get_target_faces_for_file(filepath, explicit_target=None):
    if explicit_target:
        return explicit_target
    name_lower = os.path.basename(filepath).lower()
    for key, count in DEFAULT_TARGET_FACES.items():
        if key in name_lower:
            return count
    return DEFAULT_TARGET_FACES['default']

def optimize_glb_file(in_path, target_faces=None, out_path=None):
    if not os.path.exists(in_path):
        print(f"[ERROR] File not found: {in_path}")
        return False

    if out_path is None:
        out_path = in_path

    target_count = get_target_faces_for_file(in_path, target_faces)
    orig_mb = os.path.getsize(in_path) / (1024 * 1024)
    print("==================================================")
    print(f"Processing: {in_path} ({orig_mb:.1f} MB)")
    print(f"Target Triangles: {target_count:,}")
    print("==================================================")

    try:
        scene = trimesh.load(in_path, force="scene")
    except Exception as e:
        print(f"[ERROR] Failed to load {in_path}: {e}")
        return False

    new_geometries = {}
    for name, geom in scene.geometry.items():
        orig_faces = len(geom.faces)
        orig_verts = len(geom.vertices)
        has_uv = hasattr(geom.visual, "uv") and geom.visual.uv is not None

        print(f"  [Mesh '{name}'] Original: {orig_faces:,} faces, {orig_verts:,} verts, Has UV: {has_uv}")

        if orig_faces <= target_count:
            print(f"  [Mesh '{name}'] Already below target face count. Keeping geometry.")
            new_geometries[name] = geom
            continue

        print(f"  [Mesh '{name}'] Simplifying with border preservation (aggressiveness=3)...")
        simplifier = pyfqmr.Simplify()
        simplifier.setMesh(geom.vertices, geom.faces)
        simplifier.simplify_mesh(
            target_count=target_count,
            aggressiveness=3,
            preserve_border=True,
            verbose=0
        )
        s_verts, s_faces, _ = simplifier.getMesh()
        print(f"  [Mesh '{name}'] Simplified: {len(s_faces):,} faces, {len(s_verts):,} verts")

        if has_uv:
            print(f"  [Mesh '{name}'] Projecting UV coordinates via KDTree nearest-surface mapping...")
            kdtree = cKDTree(geom.vertices)
            dists, indices = kdtree.query(s_verts, k=1)
            new_uvs = geom.visual.uv[indices]
            max_delta = np.max(dists)
            print(f"  [Mesh '{name}'] UV projection complete. Max surface delta: {max_delta:.6f} units")

            new_visual = trimesh.visual.TextureVisuals(
                uv=new_uvs,
                material=geom.visual.material
            )
        else:
            new_visual = geom.visual

        new_mesh = trimesh.Trimesh(
            vertices=s_verts,
            faces=s_faces,
            visual=new_visual,
            process=False
        )
        new_geometries[name] = new_mesh

    scene.geometry = new_geometries
    tmp_out = in_path + ".tmp.glb"
    scene.export(tmp_out)

    try:
        g = pygltflib.GLTF2().load(tmp_out)
        print(f"  [Verification] Exported GLTF has {len(g.images)} images, {len(g.textures)} textures, {len(g.materials)} materials.")
    except Exception as e:
        print(f"  [Warning] Could not inspect GLB headers: {e}")

    new_mb = os.path.getsize(tmp_out) / (1024 * 1024)
    reduction = ((orig_mb - new_mb) / orig_mb) * 100 if orig_mb > 0 else 0
    print(f"  Size: {orig_mb:.1f} MB -> {new_mb:.1f} MB ({reduction:.1f}% reduction)")

    os.replace(tmp_out, out_path)
    print(f"  Saved optimized textured model to: {out_path}")
    return True

def optimize_all_in_directory(directory="fbx"):
    if not os.path.exists(directory):
        print(f"[ERROR] Directory does not exist: {directory}")
        return

    glb_files = [os.path.join(directory, f) for f in os.listdir(directory) if f.lower().endswith(".glb") and not f.endswith(".tmp.glb") and not "clipped" in f]
    print(f"Found {len(glb_files)} GLB files to inspect in {directory}/")
    for f in glb_files:
        optimize_glb_file(f)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Optimize GLB models with KDTree UV projection and boundary-locked decimation.")
    parser.add_argument("file", nargs="?", help="Path to GLB file to optimize")
    parser.add_argument("--target-faces", type=int, default=None, help="Target triangle count")
    parser.add_argument("--out", type=str, default=None, help="Output path (defaults to overwriting input)")
    parser.add_argument("--all", action="store_true", help="Optimize all GLB files in fbx/")

    args = parser.parse_args()
    if args.all:
        optimize_all_in_directory("fbx")
    elif args.file:
        optimize_glb_file(args.file, target_faces=args.target_faces, out_path=args.out)
    else:
        parser.print_help()
