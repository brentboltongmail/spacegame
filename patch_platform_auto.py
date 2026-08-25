import re

with open('index.html', 'r') as f:
    content = f.read()

auto_detect = """
                    // Auto-detect and set platform optimization if not set
                    if (!currentProfile.settings) currentProfile.settings = {};
                    if (!currentProfile.settings.platform) {
                        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
                        currentProfile.settings.platform = isMac ? 'mac' : 'windows';
                        saveProfileToServerSilent();
                    }
"""

content = content.replace('updateGameSettings();\n                    }', 'updateGameSettings();\n                    }\n' + auto_detect)

with open('index.html', 'w') as f:
    f.write(content)
