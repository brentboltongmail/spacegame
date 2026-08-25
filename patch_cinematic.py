import re

with open('index.html', 'r') as f:
    content = f.read()

# Fix Button Text
content = content.replace(
    '🚀 Return to Flight Simulator</button>',
    '🚀 Continue</button>'
)

# Fix Shader Compilation Freeze
compile_injection = """
            // Force Pre-compile hidden heavy cinematic assets so it doesn't freeze the main thread mid-flight!
            if (typeof ancientGoldenGate !== 'undefined' && ancientGoldenGate) ancientGoldenGate.visible = true;
            if (typeof titanExcavationSite !== 'undefined' && titanExcavationSite) titanExcavationSite.visible = true;
            renderer.compile(scene, camera);
            if (typeof ancientGoldenGate !== 'undefined' && ancientGoldenGate) ancientGoldenGate.visible = false;
            if (typeof titanExcavationSite !== 'undefined' && titanExcavationSite) titanExcavationSite.visible = false;

            animate();"""
content = content.replace('\n            animate();', compile_injection)

with open('index.html', 'w') as f:
    f.write(content)
