        // --- USER PROFILE & SERVER PERSISTENCE ---
        let currentUsername = 'pilot_1';
        let currentProfile = { username: 'pilot_1', boxPositions: {}, settings: {}, progress: {} };

        async function loadProfileFromServer(username) {
            currentUsername = username || 'pilot_1';
            try {
                const res = await fetch(`/api/profile?user=${encodeURIComponent(currentUsername)}`);
                if (res.ok) {
                    currentProfile = await res.json();
                    if (currentProfile.settings) {
                        const set = currentProfile.settings;
                        if (set.masterVol !== undefined) document.getElementById('slider-vol-master').value = set.masterVol;
                        if (set.engineVol !== undefined) document.getElementById('slider-vol-engine').value = set.engineVol;
                        if (set.firingVol !== undefined) document.getElementById('slider-vol-firing').value = set.firingVol;
                        if (set.musicVol !== undefined) document.getElementById('slider-vol-music').value = set.musicVol;
                        updateAudioVolumes();
                        if (set.rollSpeed !== undefined) document.getElementById('slider-set-roll').value = set.rollSpeed;
                        if (set.turnSpeed !== undefined) document.getElementById('slider-set-turn').value = set.turnSpeed;
                        if (set.cameraLag !== undefined) document.getElementById('slider-set-cam').value = set.cameraLag;
                        if (set.throttleAccel !== undefined) document.getElementById('slider-set-throttle').value = set.throttleAccel;
                        if (set.toastDuration !== undefined) document.getElementById('slider-set-toast').value = set.toastDuration;
                        if (set.shieldRegenMult !== undefined) document.getElementById('slider-set-shield-regen').value = set.shieldRegenMult;
                        if (set.hullRegenMult !== undefined) document.getElementById('slider-set-hull-regen').value = set.hullRegenMult;
                        if (set.enemyDamageMult !== undefined) document.getElementById('slider-set-enemy-dmg').value = set.enemyDamageMult;
                        if (set.playerDamageMult !== undefined) document.getElementById('slider-set-player-dmg').value = set.playerDamageMult;
                        if (set.flashOnHit !== undefined) {
                            const chk = document.getElementById('chk-flash-on-hit');
                            if (chk) chk.checked = set.flashOnHit;
                        }
                        updateGameSettings();
                        updateGameSettings();
                    }

                    // Auto-detect and set platform optimization if not set
                    if (!currentProfile.settings) currentProfile.settings = {};
                    if (!currentProfile.settings.platform) {
                        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
                        currentProfile.settings.platform = isMac ? 'mac' : 'windows';
                        saveProfileToServerSilent();
                    }

                    const defaultKeyBindings = { 
                        KeyW: 'KeyW', KeyS: 'KeyS', KeyA: 'KeyA', KeyD: 'KeyD', 
                        PitchUp: 'ArrowUp', PitchDown: 'ArrowDown', YawLeft: 'ArrowLeft', YawRight: 'ArrowRight',
                        Space: 'Space', KeyM: 'KeyM', KeyL: 'KeyL', KeyC: 'KeyC', Escape: 'Escape' 
                    };
                    if (currentProfile.keyBindings) {
                        keyBindings = Object.assign({}, defaultKeyBindings, currentProfile.keyBindings);
                        for (const action in keyBindings) {
                            const code = keyBindings[action];
                            let display = code.replace(/^Key/, '').toUpperCase();
                            if (code === 'Space') display = 'SPACE';
                            if (code === 'Escape') display = 'ESC';
                            if (code === 'ArrowUp') display = '▲ UP';
                            if (code === 'ArrowDown') display = '▼ DOWN';
                            if (code === 'ArrowLeft') display = '◄ LEFT';
                            if (code === 'ArrowRight') display = '► RIGHT';
                            
                            // fallback for defaults if they match
                            if (action === 'Space' && code === 'Space') display = 'Space / Mouse 1';
                            
                            const el = document.getElementById('key-' + action);
                            if (el) el.innerText = display;
                        }
                    } else {
                        keyBindings = { ...defaultKeyBindings };
                        currentProfile.keyBindings = keyBindings;
                    }
                }
            } catch (e) {
                console.warn("Could not fetch profile from server:", e);
            }
            initDraggableBoxes();
        }

        async function saveProfileToServerSilent() {
            if (!currentProfile) currentProfile = { username: currentUsername, boxPositions: {} };
            currentProfile.username = currentUsername;

            try {
                await fetch('/api/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currentProfile)
                });
            } catch (e) {
                console.error("Silent server save failed:", e);
            }
        }

        async function switchUserProfile(newUsername) {
            await loadProfileFromServer(newUsername);
            showToast(`Loaded User Profile: ${newUsername}`);
        }

        function resetAllBoxPositions() {
            if (currentProfile) currentProfile.boxPositions = {};
            document.querySelectorAll('.draggable-box').forEach(box => {
                box.style.transform = 'none';
                delete box.dataset.dragX;
                delete box.dataset.dragY;
            });
            setTimeout(() => clampAllWindowPositions(), 50);
            saveProfileToServerSilent();
            showToast("✨ Box layout reset & aligned!");
        }

        function toggleMinimizeBox(btn) {
            const box = btn.closest('.draggable-box');
            if (!box) return;
            box.classList.toggle('is-minimized');
            const isMin = box.classList.contains('is-minimized');
            btn.innerHTML = isMin ? '&#43;' : '&ndash;';
            btn.title = isMin ? 'Maximize window' : 'Minimize window';

            // Save minimize state to currentProfile
            const dragId = box.dataset.dragId || box.id;
            if (dragId && currentProfile) {
                if (!currentProfile.minimizedBoxes) currentProfile.minimizedBoxes = {};
                currentProfile.minimizedBoxes[dragId] = isMin;
                saveProfileToServerSilent();
            }
        }

        function getBriefCardLabel(id, text) {
            if (id === 'hud-controls-card') return '🕹️ CONTROLS';
            if (id === 'hud-shield-card') return '🛡️ SHIELD & THROTTLE';
            if (id === 'hud-radar-card') return 'RADAR';
            if (id === 'hud-top-target-card') return '🎯 TARGET DAMAGE';
            if (id === 'hud-target-card') return '🎯 TARGET LOCK';
            if (id === 'hud-camera-card') return '🎥 CAMERA VIEW';
            if (id === 'cinematic-comms-overlay') return '📻 COMMS';

            if (!text) return 'WINDOW';
            const clean = text.replace(/[\n\r]+/g, ' ').trim();
            const firstWords = clean.split(' ').slice(0, 2).join(' ');
            return firstWords.length > 14 ? firstWords.substring(0, 14) + '..' : firstWords;
        }

                function clampAllWindowPositions() {
            const headerBoundary = 0; // Top of screen
            let didCorrection = false;
            document.querySelectorAll('.draggable-box').forEach(box => {
                const rect = box.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) return; // Skip hidden or unrendered boxes

                let currentY = parseFloat(box.dataset.dragY) || 0;
                let currentX = parseFloat(box.dataset.dragX) || 0;
                
                const initialTop = rect.top - currentY;
                const initialLeft = rect.left - currentX;
                
                const minAllowedY = headerBoundary - initialTop;
                // More lenient bottom clamp on load: just ensure the top 30px (drag handle) remains visible on screen.
                // This prevents windows from being artificially pushed up if their height slightly fluctuates during page load (e.g., before web fonts finish rendering).
                const maxAllowedY = window.innerHeight - initialTop - 30;
                const minAllowedX = -initialLeft;
                const maxAllowedX = window.innerWidth - initialLeft - 30; // Keep at least 30px of the left side visible

                let changed = false;

                if (currentY < minAllowedY) { currentY = minAllowedY; changed = true; }
                if (currentY > maxAllowedY) { currentY = maxAllowedY; changed = true; }
                if (currentX < minAllowedX) { currentX = minAllowedX; changed = true; }
                if (currentX > maxAllowedX) { currentX = maxAllowedX; changed = true; }

                if (changed) {
                    box.dataset.dragY = currentY;
                    box.dataset.dragX = currentX;
                    box.style.transform = `translate(${currentX}px, ${currentY}px)`;

                    const dragId = box.dataset.dragId || box.id;
                    if (dragId && currentProfile) {
                        if (!currentProfile.boxPositions) currentProfile.boxPositions = {};
                        currentProfile.boxPositions[dragId] = { x: Math.round(currentX), y: Math.round(currentY) };
                        didCorrection = true;
                    }
                }
            });
            if (didCorrection) {
                saveProfileToServerSilent();
            }
        }

        function initDraggableBoxes() {
            const selector = '.hud-card, .card, .ship-card, .act-node';
            const boxes = document.querySelectorAll(selector);

            boxes.forEach((box, index) => {
                if (!box.dataset.dragId) {
                    const heading = box.querySelector('.hud-title, .title-name, .act-title, h3')?.innerText || '';
                    const cleanTitle = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    box.dataset.dragId = box.id || (cleanTitle ? `drag-${cleanTitle}` : `box-${index}`);
                }
                const dragId = box.dataset.dragId;

                box.classList.add('draggable-box');

                // Insert drag handle bar, title label & minimize button if missing
                if (!box.querySelector('.drag-handle')) {
                    const headingText = box.querySelector('.hud-title, .title-name, .act-title, h1, h2, h3')?.innerText || '';
                    const briefLabel = getBriefCardLabel(box.id || dragId, headingText);

                    const handle = document.createElement('div');
                    handle.className = 'drag-handle';
                    handle.title = 'Drag to reposition window';
                    handle.innerHTML = `
                        <span class="drag-handle-label">${briefLabel}</span>
                        <div class="drag-handle-bar"></div>
                        <button class="btn-minimize" title="Minimize window" onclick="event.stopPropagation(); toggleMinimizeBox(this)">&ndash;</button>
                    `;
                    box.insertBefore(handle, box.firstChild);
                }

                // Restore saved position & minimize state for current profile
                if (currentProfile) {
                    if (currentProfile.boxPositions && currentProfile.boxPositions[dragId]) {
                        const { x, y } = currentProfile.boxPositions[dragId];
                        box.dataset.dragX = x;
                        box.dataset.dragY = y;
                        box.style.transform = `translate(${x}px, ${y}px)`;
                    } else {
                        box.style.transform = 'none';
                        delete box.dataset.dragX;
                        delete box.dataset.dragY;
                    }

                    if (currentProfile.minimizedBoxes && currentProfile.minimizedBoxes[dragId]) {
                        box.classList.add('is-minimized');
                        const minBtn = box.querySelector('.btn-minimize');
                        if (minBtn) {
                            minBtn.innerHTML = '&#43;';
                            minBtn.title = 'Maximize window';
                        }
                    }
                }

                setupDragEvents(box, dragId);
            });

            // Auto-clamp any window that is currently above top menu bar boundary, wait for fonts to avoid height pop-in
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(() => setTimeout(() => clampAllWindowPositions(), 100));
            } else {
                window.addEventListener('load', () => setTimeout(() => clampAllWindowPositions(), 100));
            }
        }

        function setupDragEvents(element, dragId) {
            if (element.dataset.dragInitialized) return;
            element.dataset.dragInitialized = "true";

            let isDragging = false;
            let startX = 0, startY = 0;
            let currentX = parseFloat(element.dataset.dragX) || 0;
            let currentY = parseFloat(element.dataset.dragY) || 0;
            let initialTop = 0;
            let initialLeft = 0;
            const headerBoundary = 0; // Top of screen

            const dragStart = (e) => {
                if (e.target.closest('button, input, select, a, kbd, .btn-vote, .sim-btn, .btn-minimize')) return;

                isDragging = true;
                element.classList.add('is-dragging');

                currentX = parseFloat(element.dataset.dragX) || 0;
                currentY = parseFloat(element.dataset.dragY) || 0;

                const rect = element.getBoundingClientRect();
                initialTop = rect.top - currentY;
                initialLeft = rect.left - currentX;

                const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
                const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

                startX = clientX - currentX;
                startY = clientY - currentY;

                const onMove = (moveEv) => {
                    if (!isDragging) return;
                    if (moveEv.cancelable) moveEv.preventDefault();

                    const moveX = moveEv.type.startsWith('touch') ? moveEv.touches[0].clientX : moveEv.clientX;
                    const moveY = moveEv.type.startsWith('touch') ? moveEv.touches[0].clientY : moveEv.clientY;

                    currentX = moveX - startX;
                    currentY = moveY - startY;

                                        // Enforce top and bottom boundaries
                    const minAllowedY = headerBoundary - initialTop;
                    const maxAllowedY = window.innerHeight - initialTop - rect.height;
                    if (currentY < minAllowedY) {
                        currentY = minAllowedY;
                    } else if (currentY > maxAllowedY) {
                        currentY = maxAllowedY;
                    }

                    // Enforce left and right screen boundaries
                    const minAllowedX = -initialLeft;
                    const maxAllowedX = window.innerWidth - initialLeft - rect.width;
                    if (currentX < minAllowedX) {
                        currentX = minAllowedX;
                    } else if (currentX > maxAllowedX) {
                        currentX = maxAllowedX;
                    }

                    element.dataset.dragX = currentX;
                    element.dataset.dragY = currentY;
                    element.style.transform = `translate(${currentX}px, ${currentY}px)`;
                };

                const onEnd = () => {
                    if (!isDragging) return;
                    isDragging = false;
                    element.classList.remove('is-dragging');

                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onEnd);
                    window.removeEventListener('touchmove', onMove);
                    window.removeEventListener('touchend', onEnd);

                    if (!currentProfile.boxPositions) currentProfile.boxPositions = {};
                    currentProfile.boxPositions[dragId] = { x: Math.round(currentX), y: Math.round(currentY) };
                    
                    // Silent save to server without notice
                    saveProfileToServerSilent();
                };

                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onEnd);
                window.addEventListener('touchmove', onMove, { passive: false });
                window.addEventListener('touchend', onEnd);
            };

            const handle = element.querySelector('.drag-handle') || element;
            handle.addEventListener('mousedown', dragStart);
            handle.addEventListener('touchstart', dragStart, { passive: true });
        }

        function renderTitles() {
            const container = document.getElementById('titles-container');
            container.innerHTML = gameTitles.map((t, idx) => `
                <div class="card" data-drag-id="title-card-${idx}">
                    <div class="card-header">
                        <div class="title-name">${t.title}</div>
                        <span class="badge ${t.badgeClass}">${t.badge}</span>
                    </div>
                    <p class="card-desc">${t.desc}</p>
                    <div class="vote-row">
                        <div class="like-count">⭐ <span id="likes-${idx}">${t.likes}</span> Votes</div>
                        <button class="btn-vote" onclick="voteTitle(${idx})">Vote Title</button>
                    </div>
                </div>
            `).join('');

            initDraggableBoxes();
        }

        function voteTitle(idx) {
            gameTitles[idx].likes++;
            document.getElementById(`likes-${idx}`).innerText = gameTitles[idx].likes;
            showToast(`Voted for "${gameTitles[idx].title}"!`);
        }

        function switchTab(tabId) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
            
            event.currentTarget.classList.add('active');
            document.getElementById(`${tabId}-section`).classList.add('active');

            if (tabId === 'sim') {
                onWindowResize();
            }
        }

        function showToast(msg) {
            const toast = document.getElementById('toast');
            toast.innerText = msg;
            toast.classList.add('show');
            const duration = (typeof gameMechanicsConfig !== 'undefined' && gameMechanicsConfig.toastDuration !== undefined) ? gameMechanicsConfig.toastDuration * 1000 : 5000;
            setTimeout(() => toast.classList.remove('show'), duration);
        }

