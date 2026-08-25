        // --- HIGH-ENERGY PLASMA STATIC & ROCKET JET AUDIO SYNTHESIZER ---
        let audioCtx = null;
        let engineMasterGain = null;
        let engineLowPassFilter = null;
        let hullResonanceFilter = null;
        let engineSubOsc = null;
        let engineDetuneOsc = null;
        let engineMidOsc = null;
        let engineTurbineOsc = null;
        let engineTurbineFilter = null;
        let engineTurbineGain = null;
        let engineWhineOsc = null;
        let engineWhineGain = null;
        let bgMusicGain = null;
        let engineNoiseNode = null;
        let engineNoiseGain = null;
        let engineStaticNode = null;
        let engineStaticGain = null;
        let engineLfoOsc = null;
        let engineLfoGain = null;
        let isAudioInitialized = false;
        let isAudioMuted = false;

        let elevenLabsBuffers = {};

        function loadElevenLabsSFX() {
            if (!audioCtx) return;
            const sounds = {
                fire: 'data/sfx/laser_fire.mp3',
                explosion: 'data/sfx/ship_explosion.mp3',
                hit: 'data/sfx/laser_hit.mp3'
            };

            for (const [key, url] of Object.entries(sounds)) {
                fetch(url)
                    .then(res => res.arrayBuffer())
                    .then(buf => audioCtx.decodeAudioData(buf))
                    .then(decoded => {
                        elevenLabsBuffers[key] = decoded;
                    })
                    .catch(e => console.warn('ElevenLabs SFX fallback:', key, e));
            }
        }

        let isMusicLoaded = false;
        function initBackgroundMusic() {
            if (!audioCtx || isMusicLoaded) return;
            isMusicLoaded = true;
            
            fetch('data/sfx/space_theme_120s.mp3')
                .then(res => res.arrayBuffer())
                .then(buf => audioCtx.decodeAudioData(buf))
                .then(decoded => {
                    bgMusicGain = audioCtx.createGain();
                    bgMusicGain.gain.setValueAtTime(isAudioMuted ? 0 : gameVolumeConfig.master * gameVolumeConfig.music, audioCtx.currentTime);
                    bgMusicGain.connect(audioCtx.destination);
                    
                    const src = audioCtx.createBufferSource();
                    src.buffer = decoded;
                    src.loop = true;
                    src.connect(bgMusicGain);
                    src.start(0);
                })
                .catch(e => {
                    isMusicLoaded = false;
                    console.warn('Could not load space theme music:', e);
                });
        }

        function initEngineAudio() {
            if (!audioCtx) {
                try {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    audioCtx = new AudioContextClass({ sampleRate: 44100 });
                } catch (e) {
                    try {
                        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    } catch (err) {
                        console.error("Web Audio Engine Init Error:", err);
                        return;
                    }
                }
            }

            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            loadElevenLabsSFX();
            initBackgroundMusic();

            if (isAudioInitialized) return;

            try {
                const now = audioCtx.currentTime;

                // 1. Master Output Gain (+100% Volume Boost)
                engineMasterGain = audioCtx.createGain();
                const initVolMult = (typeof gameVolumeConfig !== 'undefined') ? (gameVolumeConfig.master * gameVolumeConfig.engine) : 0.56;
                engineMasterGain.gain.setValueAtTime(isAudioMuted ? 0 : 0.80 * initVolMult, now);

                // 2. Cockpit Muffling Filter (350 Hz -> 2,400 Hz)
                engineLowPassFilter = audioCtx.createBiquadFilter();
                engineLowPassFilter.type = 'lowpass';
                engineLowPassFilter.frequency.setValueAtTime(450, now);
                engineLowPassFilter.Q.setValueAtTime(1.2, now);

                // 3. Smooth Hull Vibration Filter
                hullResonanceFilter = audioCtx.createBiquadFilter();
                hullResonanceFilter.type = 'peaking';
                hullResonanceFilter.frequency.setValueAtTime(110, now);
                hullResonanceFilter.Q.setValueAtTime(2.0, now);
                hullResonanceFilter.gain.setValueAtTime(3.5, now);

                // --- LAYER 1: Minimal Background Sub-Bass Weight (Sine @ 36 Hz) ---
                engineSubOsc = audioCtx.createOscillator();
                engineSubOsc.type = 'sine';
                engineSubOsc.frequency.setValueAtTime(36, now);

                const subGain = audioCtx.createGain();
                subGain.gain.setValueAtTime(0.08, now);
                engineSubOsc.connect(subGain);
                subGain.connect(hullResonanceFilter);

                // --- LAYER 2: Minimal Detuned Secondary (Sine @ 38 Hz) ---
                engineDetuneOsc = audioCtx.createOscillator();
                engineDetuneOsc.type = 'sine';
                engineDetuneOsc.frequency.setValueAtTime(38, now);

                const detuneGain = audioCtx.createGain();
                detuneGain.gain.setValueAtTime(0.05, now);
                engineDetuneOsc.connect(detuneGain);
                detuneGain.connect(hullResonanceFilter);

                // --- LAYER 3: Mid Drive Tone (Triangle @ 74 Hz) ---
                engineMidOsc = audioCtx.createOscillator();
                engineMidOsc.type = 'triangle';
                engineMidOsc.frequency.setValueAtTime(74, now);

                const midGain = audioCtx.createGain();
                midGain.gain.setValueAtTime(0.05, now);
                engineMidOsc.connect(midGain);
                midGain.connect(hullResonanceFilter);

                // --- LAYER 4: Turbine Whine (Lower Pitch @ 140 Hz) ---
                engineTurbineOsc = audioCtx.createOscillator();
                engineTurbineOsc.type = 'sawtooth';
                engineTurbineOsc.frequency.setValueAtTime(140, now);

                engineTurbineFilter = audioCtx.createBiquadFilter();
                engineTurbineFilter.type = 'bandpass';
                engineTurbineFilter.frequency.setValueAtTime(240, now);
                engineTurbineFilter.Q.setValueAtTime(2.0, now);

                engineTurbineGain = audioCtx.createGain();
                engineTurbineGain.gain.setValueAtTime(0.025, now);

                engineTurbineOsc.connect(engineTurbineFilter);
                engineTurbineFilter.connect(engineTurbineGain);
                engineTurbineGain.connect(hullResonanceFilter);

                // --- LAYER 5: Ion Whine (Lower Pitch @ 220 Hz) ---
                engineWhineOsc = audioCtx.createOscillator();
                engineWhineOsc.type = 'sine';
                engineWhineOsc.frequency.setValueAtTime(220, now);

                engineWhineGain = audioCtx.createGain();
                engineWhineGain.gain.setValueAtTime(0.025, now);

                engineWhineOsc.connect(engineWhineGain);
                engineWhineGain.connect(hullResonanceFilter);

                // --- LAYER 6: Organic Heavy Gas Exhaust Rumble (Boosted thick roar) ---
                const bufferSize = audioCtx.sampleRate * 4;
                const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const output = noiseBuffer.getChannelData(0);
                let lastOut = 0.0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    output[i] = (lastOut + (0.02 * white)) / 1.02;
                    lastOut = output[i];
                    output[i] *= 3.5;
                }

                engineNoiseNode = audioCtx.createBufferSource();
                engineNoiseNode.buffer = noiseBuffer;
                engineNoiseNode.loop = true;

                engineNoiseGain = audioCtx.createGain();
                engineNoiseGain.gain.setValueAtTime(0.40, now);
                engineNoiseNode.connect(engineNoiseGain);
                engineNoiseGain.connect(hullResonanceFilter);

                // --- LAYER 7: CRISP PLASMA EXHAUST STATIC & JET CRACKLE ---
                const staticBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const staticOut = staticBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    staticOut[i] = (Math.random() * 2 - 1) * 0.30;
                }

                engineStaticNode = audioCtx.createBufferSource();
                engineStaticNode.buffer = staticBuffer;
                engineStaticNode.loop = true;

                const staticHighPass = audioCtx.createBiquadFilter();
                staticHighPass.type = 'highpass';
                staticHighPass.frequency.setValueAtTime(700, now);

                engineStaticGain = audioCtx.createGain();
                engineStaticGain.gain.setValueAtTime(0.30, now);

                engineStaticNode.connect(staticHighPass);
                staticHighPass.connect(engineStaticGain);
                engineStaticGain.connect(hullResonanceFilter);

                // --- LAYER 8: Stereo Panner Width ---
                let pannerNode = null;
                if (audioCtx.createStereoPanner) {
                    pannerNode = audioCtx.createStereoPanner();
                    pannerNode.pan.setValueAtTime(0, now);
                }

                // Connect Signal Chain
                hullResonanceFilter.connect(engineLowPassFilter);
                if (pannerNode) {
                    engineLowPassFilter.connect(pannerNode);
                    pannerNode.connect(engineMasterGain);
                } else {
                    engineLowPassFilter.connect(engineMasterGain);
                }
                engineMasterGain.connect(audioCtx.destination);

                // Start All Sound Layer Generators (100% Constant Smooth Rocket Thrust)
                engineSubOsc.start();
                engineDetuneOsc.start();
                engineMidOsc.start();
                engineTurbineOsc.start();
                engineWhineOsc.start();
                engineNoiseNode.start();
                engineStaticNode.start();

                // Power-On Sub Drop Chime
                const chimeOsc = audioCtx.createOscillator();
                const chimeGain = audioCtx.createGain();
                chimeOsc.type = 'sine';
                chimeOsc.frequency.setValueAtTime(450, now);
                chimeOsc.frequency.exponentialRampToValueAtTime(180, now + 0.4);
                chimeGain.gain.setValueAtTime(0.4, now);
                chimeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                chimeOsc.connect(chimeGain);
                chimeGain.connect(audioCtx.destination);
                chimeOsc.start();
                chimeOsc.stop(now + 0.4);

                isAudioInitialized = true;
                const btn = document.getElementById('btn-audio-toggle');
                if (btn) {
                    btn.innerText = '🔊 COCKPIT AUDIO: ACTIVE';
                    btn.style.borderColor = '#00f0ff';
                    btn.style.color = '#00f0ff';
                }
                showToast("🔊 HIGH-ENERGY PLASMA STATIC AUDIO ACTIVE!");
            } catch (e) {
                console.error("Web Audio Engine Setup Error:", e);
            }
        }

        function updateEngineAudio(throttleRatio, isCockpitView) {
            if (!isAudioInitialized || !audioCtx) return;
            if (isAudioMuted) {
                if (engineMasterGain) {
                    engineMasterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
                }
                return;
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const t = Math.min(Math.max(throttleRatio, 0), 1);
            const now = audioCtx.currentTime;

            // 1. Deeper Low-Frequency Sub (32 Hz -> 64 Hz)
            const subFreq = 32 + t * 32;
            const detuneFreq = 34 + t * 34;
            const midFreq = 74 + t * 60;

            if (engineSubOsc) engineSubOsc.frequency.setTargetAtTime(subFreq, now, 0.08);
            if (engineDetuneOsc) engineDetuneOsc.frequency.setTargetAtTime(detuneFreq, now, 0.08);
            if (engineMidOsc) engineMidOsc.frequency.setTargetAtTime(midFreq, now, 0.08);

            // 2. Deeper Turbine & Whine
            if (engineTurbineOsc && engineTurbineFilter && engineTurbineGain) {
                const turbinePitch = 140 + t * 110;
                const turbineCutoff = 240 + t * 180;
                const turbineGainVal = 0.025 + t * 0.05;

                engineTurbineOsc.frequency.setTargetAtTime(turbinePitch, now, 0.08);
                engineTurbineFilter.frequency.setTargetAtTime(turbineCutoff, now, 0.08);
                engineTurbineGain.gain.setTargetAtTime(turbineGainVal, now, 0.08);
            }

            if (engineWhineOsc && engineWhineGain) {
                const whinePitch = 220 + t * 160;
                const whineGainVal = 0.025 + t * 0.05;
                engineWhineOsc.frequency.setTargetAtTime(whinePitch, now, 0.08);
                engineWhineGain.gain.setTargetAtTime(whineGainVal, now, 0.08);
            }

            // 3. Heavy Brownian Exhaust Noise (+100% Boost: 0.40 Idle -> 0.85 Full Thrust)
            if (engineNoiseGain) {
                const noiseTarget = 0.40 + t * 0.45;
                engineNoiseGain.gain.setTargetAtTime(noiseTarget, now, 0.08);
            }

            // 4. Crisp High-Frequency Plasma Static Crackle (+100% Boost: 0.30 Idle -> 0.95 Full Thrust)
            if (engineStaticGain) {
                const staticTarget = 0.30 + t * 0.65;
                engineStaticGain.gain.setTargetAtTime(staticTarget, now, 0.08);
            }

            // 5. Cockpit Muffling Filter (350 Hz -> 2,400 Hz)
            if (engineLowPassFilter) {
                const cutoffBase = isCockpitView ? 350 : 750;
                const cutoffMax = isCockpitView ? 1600 : 3600;
                const targetCutoff = cutoffBase + t * (cutoffMax - cutoffBase);
                engineLowPassFilter.frequency.setTargetAtTime(targetCutoff, now, 0.1);
            }

            // 6. Master Volume Scaling (+100% Doubled: 0.06 Idle -> 0.80 Full Throttle)
            if (engineMasterGain) {
                const volMult = (typeof gameVolumeConfig !== 'undefined') ? (gameVolumeConfig.master * gameVolumeConfig.engine) : 0.56;
                const targetGain = (0.06 + t * 0.74) * volMult;
                engineMasterGain.gain.setTargetAtTime(targetGain, now, 0.08);
            }
        }

        function toggleEngineAudioMute() {
            if (!isAudioInitialized) {
                initEngineAudio();
                return;
            }
            isAudioMuted = !isAudioMuted;
            if (engineMasterGain && audioCtx) {
                const volMult = (typeof gameVolumeConfig !== 'undefined') ? (gameVolumeConfig.master * gameVolumeConfig.engine) : 0.56;
                const curRatio = (typeof currentSpeed !== 'undefined' && typeof maxSpeedCap !== 'undefined' && maxSpeedCap > 0) ? (currentSpeed / maxSpeedCap) : 0.5;
                const targetGain = (0.06 + curRatio * 0.74) * volMult;
                engineMasterGain.gain.setValueAtTime(isAudioMuted ? 0 : targetGain, audioCtx.currentTime);
            }
            if (bgMusicGain && audioCtx) {
                bgMusicGain.gain.setValueAtTime(isAudioMuted ? 0 : gameVolumeConfig.master * gameVolumeConfig.music, audioCtx.currentTime);
            }
            const btn = document.getElementById('btn-audio-toggle');
            if (btn) {
                btn.innerText = isAudioMuted ? '🔇 COCKPIT AUDIO: MUTED' : '🔊 COCKPIT AUDIO: ACTIVE';
                btn.style.borderColor = isAudioMuted ? 'rgba(239, 68, 68, 0.6)' : '#00f0ff';
                btn.style.color = isAudioMuted ? '#ef4444' : '#00f0ff';
            }
            showToast(isAudioMuted ? "🔇 COCKPIT ENGINE AUDIO MUTED" : "🔊 COCKPIT ENGINE AUDIO ACTIVE");
        }

