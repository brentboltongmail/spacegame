# ðŸŒŒ Workspace Rules & Directives for Solaris Horizon: Emergence

## ðŸ“Œ Automatic Git Commit & Push Rule
- **Mandatory Action**: After making any code, HTML, asset, documentation, or configuration changes, ALWAYS execute `git add -A`, `git commit -m "<descriptive message>"`, and `git push https://brentboltongmail@github.com/brentboltongmail/spacegame.git main` to ensure all changes are committed and pushed to remote `origin/main` using the correct GitHub user.

## ðŸ“Œ Server Process Rules
- Do NOT launch background server daemons inside Antigravity unless explicitly requested by the user. The user launches the server via taskbar shortcut or `restart_server.bat`.

## ðŸ“Œ UI & Layout Rules
- All HUD cards, panels, radar displays, and stats boxes MUST include a thin accent drag handle bar (`.drag-handle-bar`) at the top allowing the user to drag them freely around the screen.
- Box drag positions MUST be silently synced per user to `data/users/<username>.json` without showing popups or toasts.

## 📌 Codebase Index Rule
- **Mandatory Action**: After making structural changes or adding new major systems, ALWAYS update docs/codebase_index.md to reflect the new architecture layout.

