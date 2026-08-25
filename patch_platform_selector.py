import re

with open('index.html', 'r') as f:
    content = f.read()

html_to_inject = """
                    <div class="volume-slider-group" style="border: 1px solid var(--accent-cyan); padding: 10px; border-radius: 8px; margin-bottom: 15px; background: rgba(0,240,255,0.05);">
                        <div style="font-family: Orbitron; color: var(--accent-cyan); margin-bottom: 8px; display: flex; justify-content: space-between;">
                            <span>🖥️ PLATFORM OPTIMIZATION</span>
                        </div>
                        <select id="select-platform" onchange="changePlatform()" style="width: 100%; padding: 8px; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; font-family: 'Inter', sans-serif; cursor: pointer; outline: none;">
                            <option value="windows">Windows / Gaming PC</option>
                            <option value="mac">Mac / Apple Silicon (Optimized)</option>
                        </select>
                        <div id="platform-info" style="font-size: 0.75rem; color: #94a3b8; margin-top: 8px; line-height: 1.4;">
                            <strong>Windows:</strong> High-res MSAA, Alpha Compositing.<br>
                            <strong>Mac:</strong> Retina MSAA disabled, No Compositing, High-Performance Mode forced.
                        </div>
                    </div>
"""

content = content.replace('🕹️ FLIGHT FEEL SETTINGS\n                    </h3>', '🕹️ FLIGHT FEEL SETTINGS\n                    </h3>\n' + html_to_inject)

js_to_inject = """
        function changePlatform() {
            const val = document.getElementById('select-platform').value;
            if (currentProfile) {
                if (!currentProfile.settings) currentProfile.settings = {};
                currentProfile.settings.platform = val;
                saveProfileToServerSilent();
                if (confirm("Changing platform optimizations requires a page reload to rebuild the WebGL context.\\n\\nReload now?")) {
                    location.reload();
                }
            }
        }
"""

content = content.replace('function closeOptionsModal() {', js_to_inject + '\n        function closeOptionsModal() {')

# Find where settings are populated into the modal and add the select syncing
populate_sync = """
                if (gameMechanicsConfig.platform) {
                    const platSel = document.getElementById('select-platform');
                    if (platSel) platSel.value = gameMechanicsConfig.platform;
                }
"""
content = content.replace('if (chk) chk.checked = !!gameMechanicsConfig.flashOnHit;', 'if (chk) chk.checked = !!gameMechanicsConfig.flashOnHit;\n' + populate_sync)

with open('index.html', 'w') as f:
    f.write(content)
