# Workspace Rules

## Browser & Server Rules
- Do NOT open, launch, or reload the browser automatically after code or configuration changes. The user will manually refresh the browser page.
- When executing `restart_server.ps1`, do NOT pass the `-OpenBrowser` switch.

## Automated Code Verification & Syntax Prevention
- After modifying any JavaScript files in `js/`, ALWAYS execute `python scripts/check_syntax.py` to automatically verify that 0 duplicate global variables or syntax collisions were introduced.

