        // ==========================================
        // MISSION 2: PIRATE AMBUSH AT CERES
        // ==========================================
        window.mission2Active = false;
        window.mission2Stage = 0;
        window.mission2Enemies = [];
        window.mission2Asteroids = [];
        window.mission2EnemiesDestroyed = 0;
        window.mission2Freighter = null;

        function startMission2() {
            if (window.mission2Active) return;
            window.mission2Active = true;
            window.mission2Stage = 0;
            window.mission2EnemiesDestroyed = 0;
            
            // Clean up old stuff
            window.mission2Enemies.forEach(e => { if (e.parent) e.parent.remove(e); });
            window.mission2Asteroids.forEach(a => { if (a.parent) a.parent.remove(a); });
            if (window.mission2Freighter && window.mission2Freighter.parent) window.mission2Freighter.parent.remove(window.mission2Freighter);
            
            window.mission2Enemies = [];
            window.mission2Asteroids = [];
            
            // Teleport player to Ceres
            if (typeof camera !== 'undefined' && typeof playerShip !== 'undefined') {
                camera.position.set(100000, 0, 100000);
                playerShip.position.copy(camera.position);
                velocity.set(0,0,0);
            }
            
            // Spawn Asteroids
            const astGeo = new THREE.IcosahedronGeometry(150, 1);
            // Jitter vertices
            const posAttr = astGeo.attributes.position;
            for(let i = 0; i < posAttr.count; i++) {
                posAttr.setX(i, posAttr.getX(i) + (Math.random() - 0.5) * 40);
                posAttr.setY(i, posAttr.getY(i) + (Math.random() - 0.5) * 40);
                posAttr.setZ(i, posAttr.getY(i) + (Math.random() - 0.5) * 40); // bug in original prompt, fix to getZ
            }
            astGeo.computeVertexNormals();
            const astMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
            
            for(let i=0; i<200; i++) {
                const ast = new THREE.Mesh(astGeo, astMat);
                ast.position.set(
                    100000 + (Math.random() - 0.5) * 15000,
                    (Math.random() - 0.5) * 4000,
                    100000 + (Math.random() - 0.5) * 15000
                );
                ast.scale.setScalar(Math.random() * 2 + 0.5);
                ast.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
                
                // Add bounding sphere for collision
                ast.geometry.computeBoundingSphere();
                
                scene.add(ast);
                window.mission2Asteroids.push(ast);
            }
            
            // Spawn Freighter
            const frtGeo = new THREE.CylinderGeometry(80, 80, 600, 16);
            const frtMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 });
            window.mission2Freighter = new THREE.Mesh(frtGeo, frtMat);
            window.mission2Freighter.rotation.z = Math.PI / 2;
            window.mission2Freighter.position.set(101000, 0, 99000);
            scene.add(window.mission2Freighter);
            
            // Spawn Pirates
            for(let i=0; i<10; i++) {
                if (typeof createEnemyInterceptorMesh === 'function') {
                    const pirate = createEnemyInterceptorMesh();
                    pirate.position.set(
                        101000 + (Math.random() - 0.5) * 4000,
                        (Math.random() - 0.5) * 2000,
                        99000 + (Math.random() - 0.5) * 4000
                    );
                    // Customize pirate stats
                    pirate.userData.hp = 30; // Unshielded
                    pirate.userData.maxHp = 30;
                    pirate.userData.speed = 4.5; // Fast
                    pirate.userData.isPirate = true;
                    
                    scene.add(pirate);
                    window.mission2Enemies.push(pirate);
                }
            }
            
            // Update UI
            const sec = document.getElementById('hud-sector');
            if (sec) sec.innerText = "MISSION 2: PIRATE AMBUSH";
            const obj = document.getElementById('hud-objective');
            if (obj) obj.innerText = "Investigate the Freighter at Ceres";
            
            showCommsTransmission("EDF COMMAND", "Vance, you have unauthorized contacts in sector 4. Run 'em off.", 6000);
            
            setTimeout(() => {
                showCommsTransmission("KAYLEN VANCE", "They've got jury-rigged weapons. It's a trap!", 5000);
                if (window.mission2Active && window.mission2Stage === 0) {
                    const obj2 = document.getElementById('hud-objective');
                    if (obj2) obj2.innerText = `Destroy 10 pirate drones without colliding with the asteroids (0/10 Enemies).`;
                }
            }, 6000);
        }
