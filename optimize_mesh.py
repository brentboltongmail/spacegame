with open('index.html', 'r') as f:
    content = f.read()

target = """        function buildDetailedShipMesh(isEvil) {
            const shipGroup = new THREE.Group();

            const hullMap = createVoidHullTexture();
            const bumpMap = createVoidBumpMap();
            const goldMap = createGoldHullTexture();
            const goldBump = createGoldBumpMap();

            const darkArmorColor = isEvil ? 0x110000 : 0x1e293b;
            const silverPlateColor = isEvil ? 0x330011 : 0x64748b;
            const goldTrimColor = isEvil ? 0xff0044 : 0xf59e0b;
            const glowColor = isEvil ? 0xff0044 : 0x00f0ff;

            const darkArmorMat = new THREE.MeshStandardMaterial({ 
                color: darkArmorColor, metalness: 0.88, roughness: 0.25, 
                map: hullMap, bumpMap: bumpMap, bumpScale: 0.08 
            });
            const silverPlateMat = new THREE.MeshStandardMaterial({ 
                color: silverPlateColor, metalness: 0.85, roughness: 0.30, 
                map: hullMap, bumpMap: bumpMap, bumpScale: 0.05 
            });
            const goldTrimMat = new THREE.MeshStandardMaterial({ 
                color: goldTrimColor, metalness: 0.96, roughness: 0.18,
                map: goldMap, bumpMap: goldBump, bumpScale: 0.05,
                emissive: isEvil ? 0x440011 : 0x3b1a03, emissiveIntensity: 0.4
            });
            const cyanGlowMat = new THREE.MeshBasicMaterial({ color: glowColor });
            const canopyGlassMat = new THREE.MeshPhysicalMaterial({ 
                color: glowColor, roughness: 0.08, metalness: 0.90, 
                transmission: 0.85, opacity: 0.88, transparent: true, clearcoat: 1.0 
            });"""

replacement = """
        let _sharedShipMats = { evil: null, good: null };

        function buildDetailedShipMesh(isEvil) {
            const shipGroup = new THREE.Group();
            
            if (!_sharedShipMats.evil) {
                const hullMap = createVoidHullTexture();
                const bumpMap = createVoidBumpMap();
                const goldMap = createGoldHullTexture();
                const goldBump = createGoldBumpMap();
                
                const createTheme = (evil) => {
                    const glow = evil ? 0xff0044 : 0x00f0ff;
                    return {
                        dark: new THREE.MeshStandardMaterial({ color: evil ? 0x110000 : 0x1e293b, metalness: 0.88, roughness: 0.25, map: hullMap, bumpMap: bumpMap, bumpScale: 0.08 }),
                        silver: new THREE.MeshStandardMaterial({ color: evil ? 0x330011 : 0x64748b, metalness: 0.85, roughness: 0.30, map: hullMap, bumpMap: bumpMap, bumpScale: 0.05 }),
                        gold: new THREE.MeshStandardMaterial({ color: evil ? 0xff0044 : 0xf59e0b, metalness: 0.96, roughness: 0.18, map: goldMap, bumpMap: goldBump, bumpScale: 0.05, emissive: evil ? 0x440011 : 0x3b1a03, emissiveIntensity: 0.4 }),
                        glow: new THREE.MeshBasicMaterial({ color: glow }),
                        glass: new THREE.MeshPhysicalMaterial({ color: glow, roughness: 0.08, metalness: 0.90, transmission: 0.85, opacity: 0.88, transparent: true, clearcoat: 1.0 })
                    };
                };
                _sharedShipMats.evil = createTheme(true);
                _sharedShipMats.good = createTheme(false);
            }
            
            const theme = isEvil ? _sharedShipMats.evil : _sharedShipMats.good;
            const darkArmorMat = theme.dark;
            const silverPlateMat = theme.silver;
            const goldTrimMat = theme.gold;
            const cyanGlowMat = theme.glow;
            const canopyGlassMat = theme.glass;
            const glowColor = isEvil ? 0xff0044 : 0x00f0ff;
"""

content = content.replace(target, replacement)

# Now fix the point lights
light_target = """                const engineLight = new THREE.PointLight(glowColor, 2.8, 18);
                engineLight.position.set(eng.x, eng.y, eng.z + 0.7);
                shipGroup.add(engineLight);
                shipGroup.userData.engineLights.push(engineLight);"""

light_replacement = """                if (!isEvil) {
                    const engineLight = new THREE.PointLight(glowColor, 2.8, 18);
                    engineLight.position.set(eng.x, eng.y, eng.z + 0.7);
                    shipGroup.add(engineLight);
                    shipGroup.userData.engineLights.push(engineLight);
                }"""

content = content.replace(light_target, light_replacement)

# Remove the inner wing fins and tiny probes for enemies to save poly count
fin_target = """            shipGroup.add(createSweptWing(false)); // Right Wing
            shipGroup.add(createSweptWing(true));  // Left Wing

            // Forward Swept Canards (Inner Wings)
            const canardGeo = new THREE.BoxGeometry(2.4, 0.08, 1.2);
            canardGeo.rotateY(0.4);
            const canardR = new THREE.Mesh(canardGeo, silverPlateMat);
            canardR.position.set(-1.4, -0.15, -0.5);
            shipGroup.add(canardR);

            const canardGold = new THREE.BoxGeometry(2.6, 0.1, 0.2);
            canardGold.rotateY(0.4);
            const canardGoldR = new THREE.Mesh(canardGold, goldTrimMat);
            canardGoldR.position.set(-1.5, -0.15, -1.0);
            shipGroup.add(canardGoldR);

            const canardGeoL = new THREE.BoxGeometry(2.4, 0.08, 1.2);
            canardGeoL.rotateY(-0.4);
            const canardL = new THREE.Mesh(canardGeoL, silverPlateMat);
            canardL.position.set(1.4, -0.15, -0.5);
            shipGroup.add(canardL);

            const canardGoldL = new THREE.BoxGeometry(2.6, 0.1, 0.2);
            canardGoldL.rotateY(-0.4);
            const canardGoldLMesh = new THREE.Mesh(canardGoldL, goldTrimMat);
            canardGoldLMesh.position.set(1.5, -0.15, -1.0);
            shipGroup.add(canardGoldLMesh);"""

fin_replacement = """            shipGroup.add(createSweptWing(false)); // Right Wing
            shipGroup.add(createSweptWing(true));  // Left Wing

            if (!isEvil) {
                // Forward Swept Canards (Inner Wings)
                const canardGeo = new THREE.BoxGeometry(2.4, 0.08, 1.2);
                canardGeo.rotateY(0.4);
                const canardR = new THREE.Mesh(canardGeo, silverPlateMat);
                canardR.position.set(-1.4, -0.15, -0.5);
                shipGroup.add(canardR);

                const canardGold = new THREE.BoxGeometry(2.6, 0.1, 0.2);
                canardGold.rotateY(0.4);
                const canardGoldR = new THREE.Mesh(canardGold, goldTrimMat);
                canardGoldR.position.set(-1.5, -0.15, -1.0);
                shipGroup.add(canardGoldR);

                const canardGeoL = new THREE.BoxGeometry(2.4, 0.08, 1.2);
                canardGeoL.rotateY(-0.4);
                const canardL = new THREE.Mesh(canardGeoL, silverPlateMat);
                canardL.position.set(1.4, -0.15, -0.5);
                shipGroup.add(canardL);

                const canardGoldL = new THREE.BoxGeometry(2.6, 0.1, 0.2);
                canardGoldL.rotateY(-0.4);
                const canardGoldLMesh = new THREE.Mesh(canardGoldL, goldTrimMat);
                canardGoldLMesh.position.set(1.5, -0.15, -1.0);
                shipGroup.add(canardGoldLMesh);
            }"""

content = content.replace(fin_target, fin_replacement)

with open('index.html', 'w') as f:
    f.write(content)
