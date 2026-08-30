# ðŸŒŒ Workspace Rules & Directives for Solaris Horizon: Emergence

## ðŸ“Œ Automatic Git Commit & Push Rule
- **Mandatory Action**: After making any code, HTML, asset, documentation, or configuration changes, ALWAYS execute `git add -A`, `git commit -m "<descriptive message>"`, and `git push` to ensure all changes are committed and pushed to remote `origin/main`.

## ðŸ“Œ Server Process Rules
- Do NOT launch background server daemons inside Antigravity unless explicitly requested by the user. The user launches the server via taskbar shortcut or `restart_server.bat`.

## ðŸ“Œ UI & Layout Rules
- All HUD cards, panels, radar displays, and stats boxes MUST include a thin accent drag handle bar (`.drag-handle-bar`) at the top allowing the user to drag them freely around the screen.
- Box drag positions MUST be silently synced per user to `data/users/<username>.json` without showing popups or toasts.

## 📌 Codebase Index Rule
- **Mandatory Action**: After making structural changes or adding new major systems, ALWAYS update docs/codebase_index.md to reflect the new architecture layout.

## 📌 3D Asset & GLB Optimization Pipeline
- **Mandatory Action for Any Added/Modified GLBs**:
  - Whenever new `.glb` models are added or modified in `fbx/` or anywhere in the project, NEVER leave raw unoptimized multi-million polygon meshes in the active game.
  - ALWAYS run `python scripts/optimize_glb.py <path_to_glb>` (or `python scripts/optimize_glb.py --all`) to optimize them.
  - The pipeline automatically applies:
    1. **Boundary Preservation (`preserve_border=True`, `aggressiveness=3`)**: Prevents detached hull panels, gaps, or holes; maintains 100% solid watertight shapes.
    2. **KDTree Nearest-Surface UV Projection**: Preserves 100% full PBR textures (diffuse, metallic, roughness, normal maps, emissive) with sub-millimeter UV alignment.
    3. **Target Triangle Ceilings**: Fighters (~150k), Interceptors (~180k), Capitals (~220k), Stations (~350k) to ensure rock-solid 60+ FPS rendering across all scenes and swarms.


## 📌 Dialogue & Audio Rule
- **Mandatory Action**: All dialogue in the game should use the ElevenLabs API to generate audio. Keep the voices chosen for characters consistent throughout the codebase (e.g. check docs or existing files for voice mappings).

## 📌 3D Ship Mesh Orientation Rule
- **Mandatory 3D Convention**: The `playerShip` (Void Interceptor) model mesh geometry has its nose oriented opposite to default Three.js `lookAt()`. Whenever setting `playerShip` orientation towards a target via `lookAt(target)`, ALWAYS execute `playerShip.rotateY(Math.PI)` immediately afterwards so the cockpit faces TOWARDS the target instead of 180° away!
