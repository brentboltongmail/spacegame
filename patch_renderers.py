import re

with open('index.html', 'r') as f:
    content = f.read()

config_func = """
        function getRendererConfig(extraOpts = {}) {
            let p = "windows";
            if (typeof currentProfile !== 'undefined' && currentProfile && currentProfile.settings && currentProfile.settings.platform) {
                p = currentProfile.settings.platform;
            }
            let conf = { logarithmicDepthBuffer: true };
            if (p === "mac") {
                conf.antialias = (window.devicePixelRatio === 1);
                conf.alpha = false;
                conf.powerPreference = "high-performance";
            } else {
                conf.antialias = true;
                conf.alpha = true;
                conf.powerPreference = "default";
            }
            return Object.assign(conf, extraOpts);
        }
"""
content = content.replace('function init3DSimulator() {', config_func + '\n        function init3DSimulator() {')

# Main Renderer
content = content.replace(
    'renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });',
    'renderer = new THREE.WebGLRenderer(getRendererConfig({ alpha: currentProfile?.settings?.platform !== "mac" }));'
)

# Hangar Renderer
content = content.replace(
    'upgradeHangarRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, logarithmicDepthBuffer: true });',
    'upgradeHangarRenderer = new THREE.WebGLRenderer(getRendererConfig({ canvas: canvas, alpha: false }));'
)

# Map Renderer
content = content.replace(
    'mapRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });',
    'mapRenderer = new THREE.WebGLRenderer(getRendererConfig({ canvas: canvas, alpha: false }));'
)

with open('index.html', 'w') as f:
    f.write(content)
