with open('index.html', 'r') as f:
    content = f.read()

target = """            // Transparently unlock AudioContext on any user interaction (mousemove, keydown, click)
            ['keydown', 'mousedown', 'mousemove', 'touchstart'].forEach(evt => {
                window.addEventListener(evt, () => {
                    if (!isAudioInitialized) initEngineAudio();
                    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                });
            });"""

replacement = """            let isFullscreenRequested = false;
            // Transparently unlock AudioContext and auto-fullscreen on first user interaction
            ['keydown', 'mousedown', 'touchstart'].forEach(evt => {
                window.addEventListener(evt, () => {
                    if (!isAudioInitialized) initEngineAudio();
                    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                    
                    if (!isFullscreenRequested && !document.fullscreenElement) {
                        isFullscreenRequested = true;
                        try {
                            if (document.documentElement.requestFullscreen) {
                                document.documentElement.requestFullscreen();
                            } else if (document.documentElement.webkitRequestFullscreen) { // Safari/Mac support
                                document.documentElement.webkitRequestFullscreen();
                            }
                        } catch (e) {
                            console.log("Auto-fullscreen prevented by browser.");
                        }
                    }
                });
            });
            
            // Mousemove only unlocks audio, doesn't trigger fullscreen
            window.addEventListener('mousemove', () => {
                if (!isAudioInitialized) initEngineAudio();
                if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            });"""

content = content.replace(target, replacement)

with open('index.html', 'w') as f:
    f.write(content)
