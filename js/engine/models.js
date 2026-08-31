        // --- THE CREST ORBITAL DEFENSE PLATFORM (STATION) GLB LOADER ---
        function createTheCrestStation() {
            theCrestStation = new THREE.Group();
            // Positioned in expanded perimeter orbit around Titan overlooking Saturn
            theCrestStation.position.set(80160, -886, -46080);
            scene.add(theCrestStation);

            // Local station accent lighting
            const crestLight = new THREE.PointLight(0x38bdf8, 3.5, 3000);
            crestLight.position.set(0, 50, 0);
            theCrestStation.add(crestLight);

            const warmLight = new THREE.PointLight(0xffa200, 2.0, 2500);
            warmLight.position.set(0, -50, 0);
            theCrestStation.add(warmLight);

            // Initialize explosion and debris group immediately so it's always ready
            createTheCrestDebrisAndExplosions();

            // Load The Crest GLB Model
            const gltfLoader = new THREE.GLTFLoader();
            gltfLoader.load('fbx/the_crest.glb?v=' + Date.now(), function(gltf) {
                const model = gltf.scene;
                const maxAniso = (typeof renderer !== 'undefined' && renderer.capabilities) ? renderer.capabilities.getMaxAnisotropy() : 16;

                // Enforce solid double-sided opaque materials
                model.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        const mats = Array.isArray(child.material) ? child.material : [child.material];
                        mats.forEach(mat => {
                            mat.transparent = false;
                            mat.opacity = 1.0;
                            mat.depthWrite = true;
                            mat.depthTest = true;
                            mat.side = THREE.DoubleSide;
                            mat.metalnessMap = null;
                            mat.roughnessMap = null;
                            mat.metalness = 0.01; // 1% reflectivity
                            mat.roughness = 0.99; // 99% roughness (1% shiny)
                            mat.envMapIntensity = 0.01; // 1% env map intensity
                            if (mat.map) {
                                mat.map.anisotropy = maxAniso;
                                mat.map.generateMipmaps = true;
                                mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                                mat.map.magFilter = THREE.LinearFilter;
                                mat.map.needsUpdate = true;
                            }
                            mat.needsUpdate = true;
                        });
                    }
                });

                // Compute Bounding Box & Scale to ~1,600 units diameter
                const box = new THREE.Box3().setFromObject(model);
                const size = new THREE.Vector3();
                box.getSize(size);
                const center = new THREE.Vector3();
                box.getCenter(center);

                const maxDim = Math.max(size.x, size.z);
                const targetScale = 1600 / (maxDim || 1);
                model.scale.set(targetScale, targetScale, targetScale);

                // Center model: In the_crest.glb, +Y is UP (communications antennas & command bridge), X-Z is the horizontal ring plane.
                // Default rotation (0, 0, 0) is already right side up!
                model.position.set(-center.x * targetScale, -center.y * targetScale, -center.z * targetScale);

                theCrestModelOriginal = model;
                theCrestStation.add(model);
                console.log("[THE CREST] GLB Model Loaded & Oriented Successfully in Titan Orbit!");

                // Load Crest Hanger and attach it to the crest model so it inherits the scale and centering
                gltfLoader.load('fbx/crest_hanger.glb?v=' + Date.now(), function(hangerGltf) {
                    const hangerModel = hangerGltf.scene;
                    hangerModel.traverse(function(child) {
                        if (child.isMesh && child.material) {
                            const mats = Array.isArray(child.material) ? child.material : [child.material];
                            mats.forEach(mat => {
                                mat.transparent = false;
                                mat.opacity = 1.0;
                                mat.depthWrite = true;
                                mat.depthTest = true;
                                mat.side = THREE.DoubleSide;
                                mat.metalnessMap = null;
                                mat.roughnessMap = null;
                                mat.metalness = 0.01; // 1% reflectivity
                                mat.roughness = 0.99; // 99% roughness (1% shiny)
                                mat.envMapIntensity = 0.01; // 1% env map intensity
                                if (mat.map) {
                                    mat.map.anisotropy = maxAniso;
                                    mat.map.generateMipmaps = true;
                                    mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                                    mat.map.magFilter = THREE.LinearFilter;
                                    mat.map.needsUpdate = true;
                                }
                                mat.needsUpdate = true;
                            });
                        }
                    });

                    // Use hanger ceiling texture as the base for both the crest and the hanger bay
                    const texLoaderBase = new THREE.TextureLoader();
                    const newBaseTex = texLoaderBase.load('data/textures/hangar_ceiling.jpg');
                    newBaseTex.colorSpace = THREE.SRGBColorSpace;
                    newBaseTex.flipY = false; // Required for GLTF UV maps
                    newBaseTex.wrapS = THREE.RepeatWrapping;
                    newBaseTex.wrapT = THREE.RepeatWrapping;
                    if (typeof maxAniso !== 'undefined') newBaseTex.anisotropy = maxAniso;

                    // Apply to hanger base
                    hangerModel.traverse(function(child) {
                        if (child.isMesh && child.material) {
                            const mats = Array.isArray(child.material) ? child.material : [child.material];
                            mats.forEach(mat => {
                                mat.map = newBaseTex;
                                mat.color.setHex(0x151515); // Match hangar ceiling intensity
                                mat.needsUpdate = true;
                            });
                        }
                    });

                    // Apply to crest station
                    model.traverse(function(child) {
                        if (child.isMesh && child.material) {
                            const mats = Array.isArray(child.material) ? child.material : [child.material];
                            mats.forEach(mat => {
                                mat.map = newBaseTex;
                                mat.color.setHex(0x151515); // Match hangar ceiling intensity
                                mat.needsUpdate = true;
                            });
                        }
                    });

                    // Reduce Y height by 40% (0.25 * 0.6 = 0.15)
                    hangerModel.scale.set(0.035, 0.025, 0.10);
                    // Move it closer to center (X=0.20) and raise it up to touch bottom of ring (Y=0)
                    hangerModel.position.set(0.65, 0.13, 0);
                    // Rotate the hanger so its opening faces outward from the center
                    hangerModel.rotation.y = Math.PI / 2;

                    // --- 🛡️ ATMOSPHERIC CONTAINMENT FORCE FIELD SHIELD & DOCKING BAY ENTRANCE GLOW ---
                    // Docking bay entrance aperture dimensions snapped 1:1 to the main front opening rim face:
                    const rectW = 1.71; // Exact width of the large main opening rim
                    const rectH = 0.76; // Exact height of the large main opening rim
                    const centerY = 0.0; // Vertical center aligned with hanger entrance
                    const entranceZ = 0.94; // Snapped tightly inside the FRONT main entrance opening face

                    // 1. Dark Blue Force Field Shield Plane (exact 1:1 fit over opening)
                    const shieldGeo = new THREE.PlaneGeometry(rectW, rectH, 4, 4);
                    const shieldMat = new THREE.MeshBasicMaterial({
                        color: 0x0044ff, // Deep Cobalt Blue
                        transparent: true,
                        opacity: 0.08, // Subtle dark blue force field keeping atmosphere inside!
                        side: THREE.DoubleSide,
                        depthWrite: false,
                        blending: THREE.AdditiveBlending
                    });
                    const forceFieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
                    forceFieldMesh.position.set(0, centerY, entranceZ);
                    forceFieldMesh.userData.isForceField = true;
                    hangerModel.add(forceFieldMesh);
                    hangerModel.userData.forceFieldMesh = forceFieldMesh;

                    // 2. Glowing Dark Blue Edge Frame (4 thin border bars fitting the entrance rim perfectly)
                    const borderGroup = new THREE.Group();
                    const edgeThickness = 0.026; // Thin subtle glowing blue border edge

                    const borderMat = new THREE.MeshBasicMaterial({
                        color: 0x0055ff, // Deep Electric Cobalt Blue
                        transparent: true,
                        opacity: 0.95,
                        side: THREE.DoubleSide,
                        blending: THREE.AdditiveBlending
                    });

                    // Top Edge Bar
                    const topBar = new THREE.Mesh(new THREE.PlaneGeometry(rectW + edgeThickness * 2, edgeThickness, 4, 4), borderMat);
                    topBar.position.set(0, centerY + (rectH + edgeThickness) * 0.5, entranceZ);
                    borderGroup.add(topBar);

                    // Bottom Edge Bar
                    const bottomBar = new THREE.Mesh(new THREE.PlaneGeometry(rectW + edgeThickness * 2, edgeThickness, 4, 4), borderMat);
                    bottomBar.position.set(0, centerY - (rectH + edgeThickness) * 0.5, entranceZ);
                    borderGroup.add(bottomBar);

                    // Left Edge Bar
                    const leftBar = new THREE.Mesh(new THREE.PlaneGeometry(edgeThickness, rectH, 4, 4), borderMat);
                    leftBar.position.set(-(rectW + edgeThickness) * 0.5, centerY, entranceZ);
                    borderGroup.add(leftBar);

                    // Right Edge Bar
                    const rightBar = new THREE.Mesh(new THREE.PlaneGeometry(edgeThickness, rectH, 4, 4), borderMat);
                    rightBar.position.set((rectW + edgeThickness) * 0.5, centerY, entranceZ);
                    borderGroup.add(rightBar);

                    hangerModel.add(borderGroup);

                    // The blue force field light has been removed per user request.

                    // Add 6 dim point lights to the ceiling
                    const lightPositions = [
                        {x: -0.2, z: 0.5}, {x: 0.2, z: 0.5},
                        {x: -0.2, z: 0.0}, {x: 0.2, z: 0.0},
                        {x: -0.2, z: -0.5}, {x: 0.2, z: -0.5}
                    ];
                    lightPositions.forEach(pos => {
                        const pLight = new THREE.PointLight(0xffffff, 0.4, 2.0); // Pure white light from the ceiling
                        pLight.position.set(pos.x, 0.35, pos.z);
                        pLight.layers.enable(1);
                        hangerModel.add(pLight);
                    });

                    // Add an isolated ambient light for the hangar interior (only affects layer 1)
                    const hangarAmbient = new THREE.AmbientLight(0xffffff, 0.5);
                    hangarAmbient.layers.set(1);
                    hangerModel.add(hangarAmbient);

                    // --- 🛠️ AI GENERATED HANGAR INTERIOR TEXTURES 🛠️ ---
                    const texLoader = new THREE.TextureLoader();
                    
                    // Helper to create tiled repeating textures
                    function setupTiledTex(tex, repeatX, repeatY) {
                        tex.colorSpace = THREE.SRGBColorSpace;
                        tex.wrapS = THREE.RepeatWrapping;
                        tex.wrapT = THREE.RepeatWrapping;
                        tex.repeat.set(repeatX, repeatY);
                    }

                    // 1. Back Blast Doors
                    const doorTex = texLoader.load('data/textures/hangar_doors.jpg');
                    setupTiledTex(doorTex, 2, 1);
                    const doorMat = new THREE.MeshStandardMaterial({ map: doorTex, color: 0x1a1a1a, side: THREE.DoubleSide, metalness: 0.1, roughness: 0.9 });
                    const doorGeo = new THREE.PlaneGeometry(1.78, 0.80, 4, 4); 
                    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
                    doorMesh.position.set(0, 0, -0.84); 
                    doorMesh.layers.set(1); // Isolate from global sunLight and station lights
                    hangerModel.add(doorMesh);
                    
                    // 2. Generic Left and Right Walls
                    const wallTex = texLoader.load('data/textures/hangar_wall.jpg');
                    setupTiledTex(wallTex, 4, 2);
                    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, color: 0x1a1a1a, side: THREE.DoubleSide, metalness: 0.1, roughness: 0.9 });
                    
                    // 1.5 Front Blast Doors (Dynamic)
                    const frontDoorWallTex = texLoader.load('data/textures/hangar_wall.jpg');
                    setupTiledTex(frontDoorWallTex, 2, 1);
                    const frontDoorWallMat = new THREE.MeshStandardMaterial({ map: frontDoorWallTex, color: 0x1a1a1a, side: THREE.DoubleSide, metalness: 0.1, roughness: 0.9 });

                    const doorWidth = 2.7; // Wider to fully cover the hexagonal bulging walls
                    const frontDoorGeo = new THREE.PlaneGeometry(doorWidth / 2, rectH, 2, 2);
                    
                    const leftFrontDoor = new THREE.Mesh(frontDoorGeo, frontDoorWallMat);
                    leftFrontDoor.position.set(-doorWidth / 4, centerY, entranceZ - 0.03);
                    leftFrontDoor.layers.set(1);
                    leftFrontDoor.userData.noDeform = true;
                    
                    const rightFrontDoor = new THREE.Mesh(frontDoorGeo, frontDoorWallMat);
                    rightFrontDoor.position.set(doorWidth / 4, centerY, entranceZ - 0.03);
                    rightFrontDoor.layers.set(1);
                    rightFrontDoor.userData.noDeform = true;
                    
                    hangerModel.add(leftFrontDoor);
                    hangerModel.add(rightFrontDoor);
                    
                    hangerModel.userData.leftFrontDoor = leftFrontDoor;
                    hangerModel.userData.rightFrontDoor = rightFrontDoor;
                    hangerModel.userData.doorClosedX = doorWidth / 4;
                    hangerModel.userData.doorOpenX = doorWidth / 4 + doorWidth / 2;

                    // 2. Generic Left and Right Walls
                    const leftWallMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.88, 0.80, 4, 4), wallMat);
                    leftWallMesh.position.set(-0.87, 0, 0); 
                    leftWallMesh.rotation.y = Math.PI / 2;
                    leftWallMesh.layers.set(1);
                    hangerModel.add(leftWallMesh);

                    const rightWallMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.88, 0.80, 4, 4), wallMat);
                    rightWallMesh.position.set(0.87, 0, 0); 
                    rightWallMesh.rotation.y = -Math.PI / 2;
                    rightWallMesh.layers.set(1);
                    hangerModel.add(rightWallMesh);

                    // 3. Tool Area Decal (Small)
                    const toolsTex = texLoader.load('data/textures/hangar_tools.jpg');
                    toolsTex.colorSpace = THREE.SRGBColorSpace;
                    const toolsMat = new THREE.MeshStandardMaterial({ map: toolsTex, color: 0x2a2a2a, side: THREE.DoubleSide, metalness: 0.1, roughness: 0.9 });
                    const toolsGeo = new THREE.PlaneGeometry(0.3, 0.15, 4, 4); // Much smaller
                    const toolsMesh = new THREE.Mesh(toolsGeo, toolsMat);
                    toolsMesh.position.set(-0.86, -0.39 + 0.075, -0.5); // Resting on floor, pushed slightly in front of left wall
                    toolsMesh.rotation.y = Math.PI / 2;
                    toolsMesh.layers.set(1);
                    hangerModel.add(toolsMesh);

                    // 4. Barrels Decal (Small)
                    const barrelsTex = texLoader.load('data/textures/hangar_barrels.jpg');
                    barrelsTex.colorSpace = THREE.SRGBColorSpace;
                    const barrelsMat = new THREE.MeshStandardMaterial({ map: barrelsTex, color: 0x2a2a2a, side: THREE.DoubleSide, metalness: 0.1, roughness: 0.9 });
                    const barrelsGeo = new THREE.PlaneGeometry(0.3, 0.15, 4, 4); // Much smaller
                    const barrelsMesh = new THREE.Mesh(barrelsGeo, barrelsMat);
                    barrelsMesh.position.set(0.86, -0.39 + 0.075, -0.5); // Resting on floor, pushed slightly in front of right wall
                    barrelsMesh.rotation.y = -Math.PI / 2;
                    barrelsMesh.layers.set(1);
                    hangerModel.add(barrelsMesh);

                    // 5. Floor
                    const floorTex = texLoader.load('data/textures/hangar_floor.jpg');
                    setupTiledTex(floorTex, 3, 3);
                    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, color: 0x151515, side: THREE.DoubleSide, metalness: 0.1, roughness: 0.9 });
                    const floorGeo = new THREE.PlaneGeometry(1.78, 1.88, 4, 4); 
                    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
                    floorMesh.position.set(0, -0.39, 0); 
                    floorMesh.rotation.x = -Math.PI / 2;
                    floorMesh.layers.set(1);
                    hangerModel.add(floorMesh);

                    // 6. Ceiling
                    const ceilingTex = texLoader.load('data/textures/hangar_ceiling.jpg');
                    setupTiledTex(ceilingTex, 3, 3);
                    const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTex, color: 0x151515, side: THREE.DoubleSide, metalness: 0.1, roughness: 0.9 });
                    const ceilingGeo = new THREE.PlaneGeometry(1.78, 1.88, 4, 4); 
                    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
                    ceilingMesh.position.set(0, 0.39, 0); 
                    ceilingMesh.rotation.x = Math.PI / 2;
                    ceilingMesh.layers.set(1);
                    hangerModel.add(ceilingMesh);


                    // Apply hexagon deformation to all programmatically added planes in the hanger
                    const stretchAmount = 0.4;
                    const mid_y = 0;
                    const half_y = 0.465;
                    
                    hangerModel.updateMatrixWorld(true);
                    const hangerInv = hangerModel.matrixWorld.clone().invert();
                    
                    hangerModel.children.forEach(child => {
                        // Skip the main GLTF mesh, only deform our programmatically added items
                        if (child.name === "GLTF" || child.type === "PointLight" || child.type === "AmbientLight") return;
                        
                        child.traverse(obj => {
                            if (obj.isMesh && obj.geometry.type === 'PlaneGeometry' && !obj.userData.noDeform) {
                                // Important: make sure world matrices are perfectly updated
                                obj.updateMatrixWorld(true);
                                const objInv = obj.matrixWorld.clone().invert();
                                
                                const pos = obj.geometry.attributes.position;
                                for (let j = 0; j < pos.count; j++) {
                                    const v = new THREE.Vector3().fromBufferAttribute(pos, j);
                                    
                                    // 1. Local -> World -> Hanger-Local
                                    v.applyMatrix4(obj.matrixWorld);
                                    v.applyMatrix4(hangerInv);
                                    
                                    // 2. Deform X based on Y
                                    let y_factor = 1.0 - Math.abs(v.y - mid_y) / half_y;
                                    if (y_factor < 0) y_factor = 0;
                                    v.x *= (1.0 + y_factor * stretchAmount);
                                    
                                    // 3. Hanger-Local -> World -> Local
                                    v.applyMatrix4(hangerModel.matrixWorld);
                                    v.applyMatrix4(objInv);
                                    
                                    pos.setXYZ(j, v.x, v.y, v.z);
                                }
                                obj.geometry.computeVertexNormals();
                                pos.needsUpdate = true;
                            }
                        });
                    });
                    // Gather station meshes BEFORE adding the hangar so we don't accidentally clip the hangar itself
                    const stationMeshes = [];
                    model.traverse(function(child) {
                        if (child.isMesh && child.material) {
                            stationMeshes.push(child);
                        }
                    });

                    model.add(hangerModel);
                    
                    // --- HEXAGONAL CLIPPING PLANES FOR STATION ---
                    // Carve out a perfect convex hexagonal hole in the Crest Station geometry matching the hangar
                    const clipPlanesLocal = [];
                    const eps = 0.02; // Small buffer to ensure we completely cut out walls without z-fighting
                    
                    // 1. Front Plane (Z+)
                    clipPlanesLocal.push(new THREE.Plane(new THREE.Vector3(0, 0, 1), -(2.0 + eps)));
                    // 2. Back Plane (Z-) - Extend to -2.0 to tunnel through the local station wall but avoid shredding the far side of the ring
                    clipPlanesLocal.push(new THREE.Plane(new THREE.Vector3(0, 0, -1), -(2.0 + eps)));
                    // 3. Top Plane (Y+)
                    clipPlanesLocal.push(new THREE.Plane(new THREE.Vector3(0, 1, 0), -(0.39 + eps)));
                    // 4. Bottom Plane (Y-) - Correct negative sign
                    clipPlanesLocal.push(new THREE.Plane(new THREE.Vector3(0, -1, 0), -(0.39 + eps)));
                    
                    // 5. Top-Right: Normal (0.39, 0.292), Point (1.218, 0)
                    const nTR = new THREE.Vector3(0.39, 0.292, 0).normalize();
                    const dTR = nTR.dot(new THREE.Vector3(1.218 + eps, eps, 0));
                    clipPlanesLocal.push(new THREE.Plane(nTR, -dTR));
                    
                    // 6. Bottom-Right: Normal (0.39, -0.292), Point (1.218, 0)
                    const nBR = new THREE.Vector3(0.39, -0.292, 0).normalize();
                    const dBR = nBR.dot(new THREE.Vector3(1.218 + eps, -eps, 0));
                    clipPlanesLocal.push(new THREE.Plane(nBR, -dBR));
                    
                    // 7. Top-Left: Normal (-0.39, 0.292), Point (-1.218, 0)
                    const nTL = new THREE.Vector3(-0.39, 0.292, 0).normalize();
                    const dTL = nTL.dot(new THREE.Vector3(-1.218 - eps, eps, 0));
                    clipPlanesLocal.push(new THREE.Plane(nTL, -dTL));
                    
                    // 8. Bottom-Left: Normal (-0.39, -0.292), Point (-1.218, 0)
                    const nBL = new THREE.Vector3(-0.39, -0.292, 0).normalize();
                    const dBL = nBL.dot(new THREE.Vector3(-1.218 - eps, -eps, 0));
                    clipPlanesLocal.push(new THREE.Plane(nBL, -dBL));
                    
                    // Convert Hangar-Local planes to World Space
                    hangerModel.updateMatrixWorld(true);
                    const stationClipPlanes = clipPlanesLocal.map(p => p.clone().applyMatrix4(hangerModel.matrixWorld));
                    
                    theCrestStation.userData.hangerModel = hangerModel;
                    
                    // Attach an update function to the station so it can update the planes as it rotates
                    theCrestStation.userData.updateClippingPlanes = function() {
                        hangerModel.updateMatrixWorld(true);
                        for (let i = 0; i < clipPlanesLocal.length; i++) {
                            stationClipPlanes[i].copy(clipPlanesLocal[i]).applyMatrix4(hangerModel.matrixWorld);
                        }
                    };
                    
                    // Apply clipping planes ONLY to the station materials
                    stationMeshes.forEach(function(child) {
                        const mats = Array.isArray(child.material) ? child.material : [child.material];
                        mats.forEach(mat => {
                            // Assign the 8 clipping planes
                            mat.clippingPlanes = stationClipPlanes;
                            // Only discard a pixel if it's clipped by ALL 8 planes (meaning it's INSIDE the hexagon)
                            mat.clipIntersection = true;
                            mat.needsUpdate = true;
                        });
                    });

                    console.log("[THE CREST HANGER] GLB Model & Atmospheric Force Field Loaded!");
                    
                    // Add 3 parked Void Interceptors inside the hanger bay!
                    // Wait for the voidInterceptorTemplate to load, then spawn them.
                    const checkInterval = setInterval(() => {
                        if (typeof voidInterceptorTemplate !== 'undefined' && voidInterceptorTemplate) {
                            clearInterval(checkInterval);
                            
                            // 1 / (targetScale * hangerScale)
                            const sx = 1 / (targetScale * 0.22);
                            const sy = 1 / (targetScale * 0.15);
                            const sz = 1 / (targetScale * 0.39);

                            const positions = [];
                            // 4 fighters on the left wall (leaving 5th spot open for player)
                            for (let i = 0; i < 5; i++) {
                                if (i === 4) continue; // Leave the spot closest to entrance open
                                const zPos = -0.75 + (i / 4) * 1.5; // Spread from Z=-0.75 to Z=0.75
                                positions.push({ x: -0.55, y: -0.38, z: zPos }); // Y=-0.38 for textured floor
                            }
                            // 5 fighters on the right wall
                            for (let i = 0; i < 5; i++) {
                                const zPos = -0.75 + (i / 4) * 1.5; // Same spread
                                positions.push({ x: 0.55, y: -0.38, z: zPos }); // Y=-0.38 for textured floor
                            }
                            
                            positions.forEach(pos => {
                                const shipGroup = new THREE.Group();
                                shipGroup.scale.set(sx * 4, sy * 4, sz * 4);
                                shipGroup.position.set(pos.x, pos.y, pos.z);
                                shipGroup.rotation.set(0, Math.PI, 0); // Facing out towards +Z

                                const ship = voidInterceptorTemplate.clone(true);
                                
                                // Ensure the ship rests perfectly on the floor at y=-0.38
                                const bbox = new THREE.Box3().setFromObject(ship);
                                ship.position.y -= bbox.min.y;
                                
                                shipGroup.add(ship);
                                
                                hangerModel.add(shipGroup);
                            });
                            
                            // --- BLUE GLOW STRIPS (RUNWAY) ---
                            const runwayMat = new THREE.MeshBasicMaterial({
                                color: 0x00f0ff,
                                transparent: true,
                                opacity: 0.7,
                                blending: THREE.AdditiveBlending,
                                side: THREE.DoubleSide
                            });
                            
                            // We can use a PlaneGeometry for the strips
                            const stripGeo = new THREE.PlaneGeometry(0.02, 1.7); // width, length
                            stripGeo.rotateX(-Math.PI / 2); // Lay flat on the floor
                            
                            // Left runway strip
                            const leftStrip = new THREE.Mesh(stripGeo, runwayMat);
                            leftStrip.position.set(-0.25, -0.385, 0);
                            hangerModel.add(leftStrip);
                            
                            // Right runway strip
                            const rightStrip = new THREE.Mesh(stripGeo, runwayMat);
                            rightStrip.position.set(0.25, -0.385, 0);
                            hangerModel.add(rightStrip);

                            console.log("[THE CREST HANGER] Spawned 9 parked Void Interceptors and Runway Lights.");
                        }
                    }, 500);

                }, undefined, function(err) {
                    console.error("[THE CREST HANGER GLB ERROR]", err);
                });

            }, undefined, function(err) {
                console.error("[THE CREST GLB ERROR]", err);
            });
        }

        function createTheCrestDebrisAndExplosions() {
            if (theCrestExplosionGroup || !theCrestStation) return;
            theCrestExplosionGroup = new THREE.Group();
            theCrestStation.add(theCrestExplosionGroup);

            // 1. Blinding Flash Light (Illuminates entire Saturn/Titan orbital sector)
            theCrestExplosionLight = new THREE.PointLight(0xff6600, 0, 75000);
            theCrestExplosionLight.position.set(0, 0, 0);
            theCrestExplosionGroup.add(theCrestExplosionLight);

            // 2. Colossal Multi-Stage Supernova Fireball Meshes (24 Massive Fireballs)
            theCrestFireballs = [];
            const fireballColors = [0xffffff, 0xffbb00, 0xf97316, 0xff4400, 0xef4444, 0xd946ef, 0x38bdf8];
            for (let f = 0; f < 24; f++) {
                const fbGeo = new THREE.SphereGeometry(220, 20, 20);
                const fbMat = new THREE.MeshBasicMaterial({
                    color: fireballColors[f % fireballColors.length],
                    transparent: true,
                    opacity: 0.90,
                    blending: THREE.AdditiveBlending
                });
                const fbMesh = new THREE.Mesh(fbGeo, fbMat);
                fbMesh.visible = false;
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 850,
                    (Math.random() - 0.5) * 350,
                    (Math.random() - 0.5) * 850
                );
                const vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 80,
                    (Math.random() - 0.5) * 80,
                    (Math.random() - 0.5) * 80
                );
                fbMesh.userData = {
                    initPos: offset.clone(),
                    offset: offset.clone(),
                    vel: vel,
                    scale: 1.0 + Math.random() * 1.5,
                    delay: f * 0.10,
                    maxScale: 4.5 + Math.random() * 5.0 // Expands up to 3,500+ units across!
                };
                theCrestExplosionGroup.add(fbMesh);
                theCrestFireballs.push(fbMesh);
            }

            // 3. Expanding Planetary Supernova Shockwave Rings (6 Massive Rings)
            theCrestShockwaves = [];
            for (let s = 0; s < 6; s++) {
                const swGeo = new THREE.RingGeometry(250, 420, 64);
                swGeo.rotateX(Math.PI / 2);
                const swMat = new THREE.MeshBasicMaterial({
                    color: s % 2 === 0 ? 0xf97316 : 0xd946ef,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.90,
                    blending: THREE.AdditiveBlending
                });
                const swMesh = new THREE.Mesh(swGeo, swMat);
                swMesh.visible = false;
                swMesh.userData = {
                    delay: 0.05 + s * 0.28,
                    radius: 250,
                    maxRadius: 6500, // Expands up to 6,500 units radius!
                    speed: 1200 + s * 350
                };
                theCrestExplosionGroup.add(swMesh);
                theCrestShockwaves.push(swMesh);
            }

            // 4. Shattered Station Debris Chunks (Detached Habitation Rings, Reactor Core, Command Spire, Truss Sections)
            theCrestDebrisChunks = [];
            const debrisMats = [
                new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.35, side: THREE.DoubleSide }),
                new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.4, side: THREE.DoubleSide }),
                new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.92, roughness: 0.25, side: THREE.DoubleSide })
            ];

            // 4A. Detached Shattered Habitation Ring Arcs (4 quadrants)
            for (let q = 0; q < 4; q++) {
                const arcGeo = new THREE.TorusGeometry(720, 36, 12, 24, Math.PI / 2);
                arcGeo.rotateX(Math.PI / 2);
                const arcMesh = new THREE.Mesh(arcGeo, debrisMats[q % debrisMats.length]);
                arcMesh.rotation.y = (q * Math.PI) / 2;
                arcMesh.visible = false;
                const basePos = new THREE.Vector3(0, 0, 0);
                const vel = new THREE.Vector3(Math.cos(q * Math.PI / 2 + 0.3) * 65, (Math.random() - 0.5) * 35, Math.sin(q * Math.PI / 2 + 0.3) * 65);
                const rotVel = new THREE.Vector3((Math.random() - 0.5) * 0.015, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.015);
                arcMesh.userData = {
                    initPos: basePos.clone(),
                    basePos: basePos.clone(),
                    vel: vel,
                    rotSpeed: rotVel.clone(),
                    rotVel: rotVel.clone()
                };
                theCrestExplosionGroup.add(arcMesh);
                theCrestDebrisChunks.push(arcMesh);
            }

            // 4B. Shattered Command Tower Spire
            const spireGeo = new THREE.CylinderGeometry(25, 60, 320, 8);
            const spireMesh = new THREE.Mesh(spireGeo, debrisMats[0]);
            spireMesh.visible = false;
            const spireBasePos = new THREE.Vector3(0, 180, 0);
            const spireVel = new THREE.Vector3((Math.random() - 0.5) * 40, 75, (Math.random() - 0.5) * 40);
            const spireRotVel = new THREE.Vector3(0.018, 0.012, -0.015);
            spireMesh.userData = {
                initPos: spireBasePos.clone(),
                basePos: spireBasePos.clone(),
                vel: spireVel,
                rotSpeed: spireRotVel.clone(),
                rotVel: spireRotVel.clone()
            };
            theCrestExplosionGroup.add(spireMesh);
            theCrestDebrisChunks.push(spireMesh);

            // 4C. Ruptured Reactor Core Hub
            const hubGeo = new THREE.CylinderGeometry(140, 160, 180, 12);
            const hubMesh = new THREE.Mesh(hubGeo, debrisMats[1]);
            hubMesh.visible = false;
            const hubBasePos = new THREE.Vector3(0, -50, 0);
            const hubVel = new THREE.Vector3((Math.random() - 0.5) * 30, -45, (Math.random() - 0.5) * 30);
            const hubRotVel = new THREE.Vector3(-0.01, 0.008, 0.014);
            hubMesh.userData = {
                initPos: hubBasePos.clone(),
                basePos: hubBasePos.clone(),
                vel: hubVel,
                rotSpeed: hubRotVel.clone(),
                rotVel: hubRotVel.clone()
            };
            theCrestExplosionGroup.add(hubMesh);
            theCrestDebrisChunks.push(hubMesh);

            // 4D. Shattered Solar Truss Girders (6 sections)
            for (let g = 0; g < 6; g++) {
                const angle = (g / 6) * Math.PI * 2;
                const girderGeo = new THREE.BoxGeometry(35, 20, 240);
                const girderMesh = new THREE.Mesh(girderGeo, debrisMats[2]);
                girderMesh.visible = false;
                const girderBasePos = new THREE.Vector3(Math.cos(angle) * 380, 0, Math.sin(angle) * 380);
                const girderVel = new THREE.Vector3(Math.cos(angle) * (50 + Math.random() * 30), (Math.random() - 0.5) * 40, Math.sin(angle) * (50 + Math.random() * 30));
                const girderRotVel = new THREE.Vector3(Math.random() * 0.03, Math.random() * 0.03, Math.random() * 0.03);
                girderMesh.userData = {
                    initPos: girderBasePos.clone(),
                    basePos: girderBasePos.clone(),
                    vel: girderVel,
                    rotSpeed: girderRotVel.clone(),
                    rotVel: girderRotVel.clone()
                };
                theCrestExplosionGroup.add(girderMesh);
                theCrestDebrisChunks.push(girderMesh);
            }
        }

        function playTheCrestExplosionAudio(distToPlayer) {
            if (!audioCtx || audioCtx.state !== 'running' || isAudioMuted) return;
            const masterVol = (typeof gameVolumeConfig !== 'undefined') ? (gameVolumeConfig.master * gameVolumeConfig.firing) : 0.60;
            const distFactor = Math.max(0.2, 1.0 - (distToPlayer / 65000));
            const vol = masterVol * distFactor * 2.8;
            const now = audioCtx.currentTime;

            try {
                // Layer 1: Severe Hull Fracture / Armor Rupture Crack
                const crackOsc = audioCtx.createOscillator();
                const crackGain = audioCtx.createGain();
                crackOsc.type = 'sawtooth';
                crackOsc.frequency.setValueAtTime(650, now);
                crackOsc.frequency.exponentialRampToValueAtTime(45, now + 0.6);
                crackGain.gain.setValueAtTime(0.95 * vol, now);
                crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                crackOsc.connect(crackGain);
                crackGain.connect(audioCtx.destination);
                crackOsc.start(now);
                crackOsc.stop(now + 0.6);

                // Layer 2: Massive Cataclysmic Fusion Reactor Infrasound Boom
                const subOsc = audioCtx.createOscillator();
                const subGain = audioCtx.createGain();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(140, now);
                subOsc.frequency.exponentialRampToValueAtTime(24, now + 5.5);
                subGain.gain.setValueAtTime(2.2 * vol, now);
                subGain.gain.linearRampToValueAtTime(0.001, now + 5.5);
                subOsc.connect(subGain);
                subGain.connect(audioCtx.destination);
                subOsc.start(now);
                subOsc.stop(now + 5.5);

                // Layer 3: Roaring Plasma Fireball & Atmosphere Decompression Roar
                if (cachedExplosionNoiseBuffer) {
                    const nSource = audioCtx.createBufferSource();
                    nSource.buffer = cachedExplosionNoiseBuffer;
                    const nFilter = audioCtx.createBiquadFilter();
                    nFilter.type = 'lowpass';
                    nFilter.frequency.setValueAtTime(1800, now);
                    nFilter.frequency.exponentialRampToValueAtTime(80, now + 4.5);
                    const nGain = audioCtx.createGain();
                    nGain.gain.setValueAtTime(1.8 * vol, now);
                    nGain.gain.linearRampToValueAtTime(0.001, now + 4.5);
                    nSource.connect(nFilter);
                    nFilter.connect(nGain);
                    nGain.connect(audioCtx.destination);
                    nSource.start(now);
                    nSource.stop(now + 4.5);
                }
            } catch (e) {}
        }

        // --- VOID INTERCEPTOR GLB MODEL & MATERIAL MANAGEMENT ---
        let voidInterceptorTemplate = null;
        const pendingVoidInterceptorShips = [];

        function loadVoidInterceptorModel() {
            const gltfLoader = new THREE.GLTFLoader();
            gltfLoader.load('fbx/void_interceptor.glb?v=' + Date.now(), function(gltf) {
                const model = gltf.scene;
                const maxAniso = (typeof renderer !== 'undefined' && renderer.capabilities) ? renderer.capabilities.getMaxAnisotropy() : 16;

                // Enforce solid double-sided opaque materials with sleek PBR metallic sheen & anisotropic filtering
                model.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        const mats = Array.isArray(child.material) ? child.material : [child.material];
                        mats.forEach(mat => {
                            mat.transparent = false;
                            mat.opacity = 1.0;
                            mat.depthWrite = true;
                            mat.depthTest = true;
                            mat.side = THREE.DoubleSide;

                            // Sleek titanium-alloy specular reflections & vibrant contrast
                            mat.metalness = 0.72;
                            mat.roughness = 0.32;
                            mat.envMapIntensity = 1.8;
                            mat.color.setHex(0xffffff);

                            if (mat.map) {
                                mat.map.anisotropy = maxAniso;
                                mat.map.generateMipmaps = true;
                                mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                                mat.map.magFilter = THREE.LinearFilter;
                                mat.map.needsUpdate = true;
                            }
                            mat.needsUpdate = true;
                        });
                    }
                });

                const box = new THREE.Box3().setFromObject(model);
                const size = new THREE.Vector3();
                box.getSize(size);
                const center = new THREE.Vector3();
                box.getCenter(center);

                const targetScale = 7.2 / (size.x || 1);
                model.scale.set(targetScale, targetScale, targetScale);
                model.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
                model.position.set(-center.y * targetScale, -center.z * targetScale, -center.x * targetScale);

                voidInterceptorTemplate = model;

                pendingVoidInterceptorShips.forEach(item => {
                    attachVoidInterceptorModel(item.group, item.isEvil);
                });
                pendingVoidInterceptorShips.length = 0;

                if (upgradeHangarShip && playerShip) {
                    if (typeof populateHangarShips === 'function') {
                        populateHangarShips();
                    }
                }

                console.log("[VOID INTERCEPTOR] GLB Model and Texture Loaded Successfully!");
            }, undefined, function(err) {
                console.error("[VOID INTERCEPTOR GLB ERROR]", err);
            });
        }

        function attachVoidInterceptorModel(shipGroup) {
            if (!voidInterceptorTemplate || !shipGroup.userData || !shipGroup.userData.meshContainer) return;
            // Remove any fallback mesh
            while (shipGroup.userData.meshContainer.children.length > 0) {
                shipGroup.userData.meshContainer.remove(shipGroup.userData.meshContainer.children[0]);
            }
            const cloned = voidInterceptorTemplate.clone(true);
            shipGroup.userData.meshContainer.add(cloned);
        }

        // --- SKULL RAIDER GLB MODEL & MATERIAL MANAGEMENT ---
        let skullRaiderTemplate = null;
        const pendingSkullRaiderShips = [];

        function createSkullRaiderTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');

            // 1. Dark weathered gunmetal & carbon iron hull plating
            const baseGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
            baseGrad.addColorStop(0.0, '#1c1a19');
            baseGrad.addColorStop(0.3, '#2a2725');
            baseGrad.addColorStop(0.7, '#201e1d');
            baseGrad.addColorStop(1.0, '#161514');
            ctx.fillStyle = baseGrad;
            ctx.fillRect(0, 0, 1024, 1024);

            // 2. Heavy industrial panel plating grid with bevels
            const panels = [
                { x: 30, y: 30, w: 450, h: 280, color: '#252220' },
                { x: 520, y: 30, w: 470, h: 280, color: '#2e2b28' },
                { x: 30, y: 340, w: 280, h: 360, color: '#23201e' },
                { x: 340, y: 340, w: 340, h: 360, color: '#322e2a' },
                { x: 710, y: 340, w: 280, h: 360, color: '#282522' },
                { x: 30, y: 730, w: 450, h: 260, color: '#2b2825' },
                { x: 520, y: 730, w: 470, h: 260, color: '#22201d' }
            ];

            panels.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.w, p.h);

                // Panel seam highlight & shadow border
                ctx.strokeStyle = 'rgba(70, 65, 60, 0.7)';
                ctx.lineWidth = 3;
                ctx.strokeRect(p.x, p.y, p.w, p.h);

                ctx.strokeStyle = 'rgba(10, 9, 8, 0.9)';
                ctx.lineWidth = 2;
                ctx.strokeRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4);

                // Rivets along borders
                ctx.fillStyle = '#4a4540';
                for (let rx = p.x + 15; rx < p.x + p.w; rx += 35) {
                    ctx.beginPath(); ctx.arc(rx, p.y + 8, 2, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(rx, p.y + p.h - 8, 2, 0, Math.PI * 2); ctx.fill();
                }
                for (let ry = p.y + 15; ry < p.y + p.h; ry += 35) {
                    ctx.beginPath(); ctx.arc(p.x + 8, ry, 2, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(p.x + p.w - 8, ry, 2, 0, Math.PI * 2); ctx.fill();
                }
            });

            // 3. Noise, Scratches & Rust Oxidation Patches
            const imgData = ctx.getImageData(0, 0, 1024, 1024);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                const noise = (Math.random() - 0.5) * 28;
                data[i] = Math.min(255, Math.max(0, data[i] + noise));
                data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise * 0.8));
                data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise * 0.6));
            }
            ctx.putImageData(imgData, 0, 0);

            // 4. Rust & Scratched Weathering
            for (let r = 0; r < 24; r++) {
                const rx = Math.random() * 1024;
                const ry = Math.random() * 1024;
                const rw = 40 + Math.random() * 120;
                const rh = 15 + Math.random() * 60;
                const rustGrad = ctx.createRadialGradient(rx, ry, 5, rx, ry, rw);
                rustGrad.addColorStop(0, 'rgba(120, 55, 20, 0.45)');
                rustGrad.addColorStop(0.6, 'rgba(80, 35, 15, 0.25)');
                rustGrad.addColorStop(1, 'rgba(40, 20, 10, 0)');
                ctx.fillStyle = rustGrad;
                ctx.beginPath();
                ctx.ellipse(rx, ry, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
                ctx.fill();
            }

            // Scratch marks
            ctx.strokeStyle = 'rgba(180, 175, 170, 0.35)';
            ctx.lineWidth = 1.2;
            for (let s = 0; s < 45; s++) {
                const sx = Math.random() * 1024;
                const sy = Math.random() * 1024;
                const len = 15 + Math.random() * 45;
                const ang = Math.random() * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
                ctx.stroke();
            }

            // 5. Aggressive Pirate War Stripes & Decals (Crimson & Hazard Orange)
            ctx.save();
            ctx.fillStyle = '#b91c1c'; // Crimson war stripe
            ctx.beginPath();
            ctx.moveTo(180, 80); ctx.lineTo(320, 80); ctx.lineTo(260, 300); ctx.lineTo(120, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ea580c'; // Vibrant orange hazard accent
            ctx.beginPath();
            ctx.moveTo(330, 80); ctx.lineTo(370, 80); ctx.lineTo(310, 300); ctx.lineTo(270, 300);
            ctx.closePath();
            ctx.fill();

            // Symmetric right wing stripes
            ctx.fillStyle = '#b91c1c';
            ctx.beginPath();
            ctx.moveTo(844, 80); ctx.lineTo(704, 80); ctx.lineTo(764, 300); ctx.lineTo(904, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.moveTo(694, 80); ctx.lineTo(654, 80); ctx.lineTo(714, 300); ctx.lineTo(754, 300);
            ctx.closePath();
            ctx.fill();

            // Stylized Pirate Skull Insignia on center plate
            ctx.fillStyle = '#cbd5e1';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            // Cranium
            ctx.beginPath();
            ctx.arc(512, 480, 48, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Jaw
            ctx.fillRect(490, 520, 44, 28);
            ctx.strokeRect(490, 520, 44, 28);
            // Eye sockets
            ctx.fillStyle = '#0f172a';
            ctx.beginPath(); ctx.ellipse(494, 485, 14, 18, 0.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(530, 485, 14, 18, -0.2, 0, Math.PI * 2); ctx.fill();
            // Nose cavity
            ctx.beginPath();
            ctx.moveTo(512, 502); ctx.lineTo(506, 516); ctx.lineTo(518, 516);
            ctx.closePath();
            ctx.fill();
            // Teeth slits
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(500, 524); ctx.lineTo(500, 544);
            ctx.moveTo(512, 524); ctx.lineTo(512, 544);
            ctx.moveTo(524, 524); ctx.lineTo(524, 544);
            ctx.stroke();

            // Crossbones behind skull
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(430, 410); ctx.lineTo(594, 574);
            ctx.moveTo(594, 410); ctx.lineTo(430, 574);
            ctx.stroke();

            ctx.restore();

            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            return tex;
        }

        function createSkullRaiderBumpTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#808080';
            ctx.fillRect(0, 0, 512, 512);

            // Panel seams as deep lines
            ctx.strokeStyle = '#202020';
            ctx.lineWidth = 4;
            ctx.strokeRect(15, 15, 230, 140);
            ctx.strokeRect(260, 15, 235, 140);
            ctx.strokeRect(15, 170, 140, 180);
            ctx.strokeRect(170, 170, 170, 180);
            ctx.strokeRect(355, 170, 140, 180);
            ctx.strokeRect(15, 365, 230, 130);
            ctx.strokeRect(260, 365, 235, 130);

            // Rivets as raised dots
            ctx.fillStyle = '#ffffff';
            for (let x = 20; x < 500; x += 30) {
                ctx.beginPath(); ctx.arc(x, 20, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(x, 490, 2, 0, Math.PI * 2); ctx.fill();
            }

            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            return tex;
        }

        function loadSkullRaiderModel() {
            const pirateTexture = createSkullRaiderTexture();
            const pirateBump = createSkullRaiderBumpTexture();

            const gltfLoader = new THREE.GLTFLoader();
            gltfLoader.load('fbx/Meshy_AI_Skull_Raider_Starship_0831032805_texture.glb?v=' + Date.now(), function(gltf) {
                const model = gltf.scene;

                // Enforce solid double-sided opaque materials with dark weathered pirate hull
                const maxAniso = (typeof renderer !== 'undefined' && renderer.capabilities) ? renderer.capabilities.getMaxAnisotropy() : 16;
                pirateTexture.anisotropy = maxAniso;
                pirateTexture.generateMipmaps = true;

                model.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        const mats = Array.isArray(child.material) ? child.material : [child.material];
                        mats.forEach(mat => {
                            mat.transparent = false;
                            mat.opacity = 1.0;
                            mat.depthWrite = true;
                            mat.depthTest = true;
                            mat.side = THREE.DoubleSide;

                            // Dark weathered steel with rust & war paint
                            mat.color.setHex(0xffffff);
                            mat.map = mat.map || pirateTexture;
                            mat.bumpMap = pirateBump;
                            mat.bumpScale = 0.08;
                            mat.metalness = 0.75;
                            mat.roughness = 0.42;
                            mat.envMapIntensity = 1.4;

                            if (mat.map) {
                                mat.map.anisotropy = maxAniso;
                                mat.map.generateMipmaps = true;
                                mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                                mat.map.magFilter = THREE.LinearFilter;
                                mat.map.needsUpdate = true;
                            }
                            mat.needsUpdate = true;
                        });
                    }
                });

                const box = new THREE.Box3().setFromObject(model);
                const size = new THREE.Vector3();
                box.getSize(size);
                const center = new THREE.Vector3();
                box.getCenter(center);

                // Rotate and scale model
                const targetScale = 12.0 / (size.x || 1);
                model.scale.set(targetScale, targetScale, targetScale);
                model.rotation.set(0, -Math.PI / 2, 0);
                model.position.set(center.z * targetScale, -center.y * targetScale, -center.x * targetScale);

                skullRaiderTemplate = model;

                pendingSkullRaiderShips.forEach(shipGroup => {
                    attachSkullRaiderModel(shipGroup);
                });
                pendingSkullRaiderShips.length = 0;

                console.log("[SKULL RAIDER] GLB Model & Textures Loaded Successfully for Pirate Swarms!");
            }, undefined, function(err) {
                console.error("[SKULL RAIDER GLB ERROR]", err);
            });
        }

        function attachSkullRaiderModel(shipGroup) {
            if (!skullRaiderTemplate || !shipGroup.userData || !shipGroup.userData.meshContainer) return;
            while (shipGroup.userData.meshContainer.children.length > 0) {
                shipGroup.userData.meshContainer.remove(shipGroup.userData.meshContainer.children[0]);
            }
            const cloned = skullRaiderTemplate.clone(true);
            shipGroup.userData.meshContainer.add(cloned);
        }

        // --- DOMINION FIGHTER GLB MODEL & MATERIAL MANAGEMENT ---
        let dominionFighterTemplate = null;
        const pendingDominionFighterShips = [];

        function loadDominionFighterModel() {
            const gltfLoader = new THREE.GLTFLoader();
            gltfLoader.load('fbx/dominion_fighter.glb?v=' + Date.now(), function(gltf) {
                const model = gltf.scene;

                // Enforce solid double-sided opaque materials
                const maxAniso = (typeof renderer !== 'undefined' && renderer.capabilities) ? renderer.capabilities.getMaxAnisotropy() : 16;
                model.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        const mats = Array.isArray(child.material) ? child.material : [child.material];
                        mats.forEach(mat => {
                            mat.transparent = false;
                            mat.opacity = 1.0;
                            mat.depthWrite = true;
                            mat.depthTest = true;
                            mat.side = THREE.DoubleSide;
                            mat.metalness = THREE.MathUtils.clamp(mat.metalness || 0.7, 0.5, 0.9);
                            mat.roughness = THREE.MathUtils.clamp(mat.roughness || 0.35, 0.25, 0.55);
                            mat.envMapIntensity = 1.6;
                            if (mat.map) {
                                mat.map.anisotropy = maxAniso;
                                mat.map.generateMipmaps = true;
                                mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                                mat.map.magFilter = THREE.LinearFilter;
                                mat.map.needsUpdate = true;
                            }
                            mat.needsUpdate = true;
                        });
                    }
                });

                const box = new THREE.Box3().setFromObject(model);
                const size = new THREE.Vector3();
                box.getSize(size);
                const center = new THREE.Vector3();
                box.getCenter(center);

                // Raw model: -X is nose, +X is rear, +Y is up, +/-Z are wingtips
                // Rotate Y by -Math.PI / 2 so -Z is forward, +Z is rear, +/-X are wings, +Y is up
                const targetScale = 12.0 / (size.x || 1);
                model.scale.set(targetScale, targetScale, targetScale);
                model.rotation.set(0, -Math.PI / 2, 0);
                model.position.set(center.z * targetScale, -center.y * targetScale, -center.x * targetScale);

                dominionFighterTemplate = model;

                pendingDominionFighterShips.forEach(shipGroup => {
                    attachDominionFighterModel(shipGroup);
                });
                pendingDominionFighterShips.length = 0;

                console.log("[DOMINION FIGHTER] GLB Model & Textures Loaded Successfully for Enemy Interceptor Swarms!");
            }, undefined, function(err) {
                console.error("[DOMINION FIGHTER GLB ERROR]", err);
            });
        }

        function attachDominionFighterModel(shipGroup) {
            if (!dominionFighterTemplate || !shipGroup.userData || !shipGroup.userData.meshContainer) return;
            while (shipGroup.userData.meshContainer.children.length > 0) {
                shipGroup.userData.meshContainer.remove(shipGroup.userData.meshContainer.children[0]);
            }
            const cloned = dominionFighterTemplate.clone(true);
            shipGroup.userData.meshContainer.add(cloned);
        }

        function buildDetailedShipMesh() {
            const shipGroup = new THREE.Group();
            const meshContainer = new THREE.Group();
            shipGroup.add(meshContainer);

            // Procedural Placeholder Hull (Immediate Zero-Latency Rendering while GLB loads)
            const fallbackGeo = new THREE.ConeGeometry(1.2, 4.2, 5);
            fallbackGeo.rotateX(Math.PI / 2);
            const fallbackMat = new THREE.MeshStandardMaterial({
                color: 0x1e293b,
                roughness: 0.5,
                metalness: 0.8
            });
            const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
            fallbackMesh.name = "fallbackHull";
            meshContainer.add(fallbackMesh);

            shipGroup.userData = {
                isEvil: false,
                engineLights: [],
                meshContainer: meshContainer
            };

            const glowColor = 0x00f0ff;

            // --- TWIN REAR ENGINE GLOW & THRUSTER ARRAYS ---
            const engineGlowMat = new THREE.MeshBasicMaterial({
                color: glowColor,
                transparent: true,
                opacity: 0.95
            });
            const engineCoreMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.98
            });
            const engineHaloMat = new THREE.MeshBasicMaterial({
                color: 0x38bdf8,
                transparent: true,
                opacity: 0.35,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });

            // Twin Engine Nozzles (Port [-0.788, -0.032, 3.50] & Starboard [+0.788, -0.032, 3.50], Radius 0.43)
            const enginePositions = [
                { x: -0.788, y: -0.032, z: 3.50, r: 0.43 },
                { x:  0.788, y: -0.032, z: 3.50, r: 0.43 }
            ];

            enginePositions.forEach(eng => {
                const engGroup = new THREE.Group();
                engGroup.position.set(eng.x, eng.y, eng.z);

                // 1. Deep Engine Interior Cavity Glow
                const cavityGeo = new THREE.CylinderGeometry(eng.r * 0.85, eng.r * 0.95, 0.45, 16, 1, true);
                const cavityMat = new THREE.MeshBasicMaterial({
                    color: 0x0284c7,
                    side: THREE.BackSide,
                    transparent: true,
                    opacity: 0.8
                });
                const cavity = new THREE.Mesh(cavityGeo, cavityMat);
                cavity.rotation.x = Math.PI / 2;
                cavity.position.z = -0.22;
                engGroup.add(cavity);

                // 2. Main Plasma Thruster Disc
                const diskGeo = new THREE.CircleGeometry(eng.r * 0.90, 24);
                const disk = new THREE.Mesh(diskGeo, engineGlowMat);
                disk.position.z = 0.02;
                engGroup.add(disk);

                // 3. Superheated White Core Disc
                const coreGeo = new THREE.CircleGeometry(eng.r * 0.45, 24);
                const core = new THREE.Mesh(coreGeo, engineCoreMat);
                core.position.z = 0.03;
                engGroup.add(core);

                // 4. Subtle Outer Plasma Halo Ring (Additive Blending)
                const haloGeo = new THREE.RingGeometry(eng.r * 0.85, eng.r * 1.15, 24);
                const halo = new THREE.Mesh(haloGeo, engineHaloMat);
                halo.position.z = 0.04;
                engGroup.add(halo);

                // 5. Dynamic Engine Exhaust Point Light
                const engineLight = new THREE.PointLight(glowColor, 2.8, 18);
                engineLight.position.set(0, 0, 0.3);
                engGroup.add(engineLight);
                shipGroup.userData.engineLights.push(engineLight);

                shipGroup.add(engGroup);
            });

            // If GLB is ready, attach immediately, else queue
            if (voidInterceptorTemplate) {
                attachVoidInterceptorModel(shipGroup);
            } else {
                pendingVoidInterceptorShips.push({ group: shipGroup });
            }

            return shipGroup;
        }

        function createHexagonalShieldTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, 1024, 1024);

            // Draw seamless hexagonal honeycomb lattice
            const hexRadius = 40;
            const w = hexRadius * Math.sqrt(3);
            const h = hexRadius * 1.5;

            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2.0;
            ctx.fillStyle = 'rgba(0, 240, 255, 0.03)';

            function drawHex(cx, cy, r) {
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i - Math.PI / 6;
                    const x = cx + r * Math.cos(angle);
                    const y = cy + r * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }

            for (let row = -2; row < (1024 / h) + 2; row++) {
                for (let col = -2; col < (1024 / w) + 2; col++) {
                    const x = col * w + ((row % 2 === 0) ? 0 : w / 2);
                    const y = row * h;
                    drawHex(x, y, hexRadius - 2.0);
                }
            }

            // High-intensity energy nodes at hexagon vertices
            ctx.fillStyle = '#ffffff';
            for (let row = -2; row < (1024 / h) + 2; row++) {
                for (let col = -2; col < (1024 / w) + 2; col++) {
                    const cx = col * w + ((row % 2 === 0) ? 0 : w / 2);
                    const cy = row * h;
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI / 3) * i - Math.PI / 6;
                        const vx = cx + (hexRadius - 2.0) * Math.cos(angle);
                        const vy = cy + (hexRadius - 2.0) * Math.sin(angle);
                        ctx.beginPath();
                        ctx.arc(vx, vy, 2.2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(6, 4);
            return texture;
        }

        function createHexagonalShieldMesh() {
            const shieldGroup = new THREE.Group();
            shieldGroup.userData.isShield = true;
            shieldGroup.userData.shieldActiveTimer = 0;

            const hexTex = createHexagonalShieldTexture();
            shieldGroup.userData.hexTex = hexTex;

            // Form-fitting aerodynamic shield ellipsoid geometry
            const baseGeo = new THREE.SphereGeometry(1, 32, 24);

            // Layer 1: Outer Hexagonal Barrier
            const outerMat = new THREE.MeshBasicMaterial({
                map: hexTex,
                color: 0x00f0ff,
                transparent: true,
                opacity: 0.0,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const outerMesh = new THREE.Mesh(baseGeo, outerMat);
            outerMesh.scale.set(7.55, 1.68, 5.15);
            outerMesh.userData.isShield = true;
            shieldGroup.add(outerMesh);
            shieldGroup.userData.outerMat = outerMat;

            // Layer 2: Inner Translucent Energy Plasma Membrane
            const innerMat = new THREE.MeshBasicMaterial({
                color: 0x0284c7,
                transparent: true,
                opacity: 0.0,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                depthWrite: false
            });
            const innerMesh = new THREE.Mesh(baseGeo, innerMat);
            innerMesh.scale.set(7.45, 1.60, 5.05);
            innerMesh.userData.isShield = true;
            shieldGroup.add(innerMesh);
            shieldGroup.userData.innerMat = innerMat;

            // Layer 3: Geodesic Hexagonal Facet Accent Wireframe
            const wireGeo = new THREE.IcosahedronGeometry(1, 3);
            const wireMat = new THREE.MeshBasicMaterial({
                color: 0x38bdf8,
                transparent: true,
                opacity: 0.0,
                wireframe: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const wireMesh = new THREE.Mesh(wireGeo, wireMat);
            wireMesh.scale.set(7.58, 1.70, 5.18);
            wireMesh.userData.isShield = true;
            shieldGroup.add(wireMesh);
            shieldGroup.userData.wireMat = wireMat;

            return shieldGroup;
        }

        function triggerPlayerShieldHit() {
            if (!playerShieldBubble) return;
            playerShieldBubble.visible = true;
            playerShieldBubble.userData.shieldActiveTimer = 5.0; // Stays active for 5 full seconds
        }

        function createPlayerShip() {
            playerShip = buildDetailedShipMesh(false);

            // Add form-fitting hexagonal deflector shield mesh
            playerShieldBubble = createHexagonalShieldMesh();
            playerShieldBubble.visible = false;
            playerShip.add(playerShieldBubble);

            // Position Void Interceptor just outside the Crest Hanger, looking at the hanger
            playerShip.position.set(theCrestStation.position.x + 800, theCrestStation.position.y, theCrestStation.position.z);
            playerShip.rotation.set(0, 0, 0);
            playerShip.quaternion.set(0, 0, 0, 1);
            playerShip.lookAt(theCrestStation.position);
            playerShip.rotateY(Math.PI); // 180-degree rotation so cockpit faces the hanger!
            scene.add(playerShip);

            if (camera) {
                const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(playerShip.quaternion);
                camera.up.copy(localUp);
                const initCamOffset = new THREE.Vector3(0, 6.0, 22.0).applyQuaternion(playerShip.quaternion);
                camera.position.copy(playerShip.position).add(initCamOffset);
                const targetLookAt = playerShip.position.clone().add(new THREE.Vector3(0, 0, -50).applyQuaternion(playerShip.quaternion));
                camera.lookAt(targetLookAt);
            }
        }

        // --- DOMINION CAPITAL FLEET & HYPERSPACE EMERGENCE SYSTEM ---
        let dominionCapitalShipTemplate = null;

        const DOMINION_FLEET_CONFIG = [
            {
                id: "dread_3",
                name: "Dominion Siege Cruiser 'Shadow of Aythelgard'",
                targetPos: new THREE.Vector3(70400, -600, -43500),
                jumpDelay: 7.0,
                scale: 1180
            },
            {
                id: "dread_1",
                name: "Dominion Dreadnought 'Titan's Bane'",
                targetPos: new THREE.Vector3(72800, -600, -43500),
                jumpDelay: 8.2,
                scale: 1220
            },
            {
                id: "flagship",
                name: "Dominion Flagship 'Iron Sovereign'",
                targetPos: new THREE.Vector3(75200, -600, -43500),
                jumpDelay: 9.4,
                scale: 1350
            },
            {
                id: "dread_2",
                name: "Dominion Dreadnought 'Void Reaver'",
                targetPos: new THREE.Vector3(77600, -600, -43500),
                jumpDelay: 10.6,
                scale: 1220
            },
            {
                id: "dread_4",
                name: "Dominion Siege Cruiser 'Blood Eclipse'",
                targetPos: new THREE.Vector3(80000, -600, -43500),
                jumpDelay: 11.8,
                scale: 1180
            }
        ];

        function playHyperspaceCrackAudio(distToPlayer) {
            if (!audioCtx || audioCtx.state !== 'running' || isAudioMuted) return;
            const masterVol = (typeof gameVolumeConfig !== 'undefined') ? (gameVolumeConfig.master * gameVolumeConfig.firing) : 0.60;
            const distFactor = Math.max(0.20, 1.0 - (distToPlayer / 48000));
            const vol = masterVol * distFactor * 2.4;
            const now = audioCtx.currentTime;

            try {
                // Layer 1: Spacetime Tear (High-Frequency Resonance Whine & Shred)
                const tearOsc = audioCtx.createOscillator();
                const tearGain = audioCtx.createGain();
                const tearFilter = audioCtx.createBiquadFilter();
                tearOsc.type = 'sawtooth';
                tearOsc.frequency.setValueAtTime(3400, now);
                tearOsc.frequency.exponentialRampToValueAtTime(140, now + 0.35);
                tearFilter.type = 'bandpass';
                tearFilter.frequency.setValueAtTime(4500, now);
                tearFilter.frequency.exponentialRampToValueAtTime(300, now + 0.35);
                tearFilter.Q.setValueAtTime(4.2, now);
                tearGain.gain.setValueAtTime(0.95 * vol, now);
                tearGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                tearOsc.connect(tearFilter);
                tearFilter.connect(tearGain);
                tearGain.connect(audioCtx.destination);
                tearOsc.start(now);
                tearOsc.stop(now + 0.35);

                // Layer 2: Gravitational Thunder Infrasound Boom
                const subOsc = audioCtx.createOscillator();
                const subGain = audioCtx.createGain();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(200, now);
                subOsc.frequency.exponentialRampToValueAtTime(22, now + 4.2);
                subGain.gain.setValueAtTime(1.9 * vol, now);
                subGain.gain.linearRampToValueAtTime(0.001, now + 4.2);
                subOsc.connect(subGain);
                subGain.connect(audioCtx.destination);
                subOsc.start(now);
                subOsc.stop(now + 4.2);

                // Layer 3: Shockwave Plasma Noise Detonation
                const nBuf = getExplosionNoiseBuffer();
                if (nBuf) {
                    const nNode = audioCtx.createBufferSource();
                    nNode.buffer = nBuf;
                    const nFilter = audioCtx.createBiquadFilter();
                    nFilter.type = 'lowpass';
                    nFilter.frequency.setValueAtTime(2000, now);
                    nFilter.frequency.exponentialRampToValueAtTime(60, now + 3.0);
                    const nGain = audioCtx.createGain();
                    nGain.gain.setValueAtTime(1.5 * vol, now);
                    nGain.gain.linearRampToValueAtTime(0.001, now + 3.0);
                    nNode.connect(nFilter);
                    nFilter.connect(nGain);
                    nGain.connect(audioCtx.destination);
                    nNode.start(now);
                    nNode.stop(now + 3.0);
                }

                // Layer 4: Relativistic Deceleration Harmonic Whine
                const deaccelOsc = audioCtx.createOscillator();
                const deaccelGain = audioCtx.createGain();
                deaccelOsc.type = 'triangle';
                deaccelOsc.frequency.setValueAtTime(880, now + 0.1);
                deaccelOsc.frequency.exponentialRampToValueAtTime(45, now + 1.8);
                deaccelGain.gain.setValueAtTime(0.7 * vol, now + 0.1);
                deaccelGain.gain.linearRampToValueAtTime(0.001, now + 1.8);
                deaccelOsc.connect(deaccelGain);
                deaccelGain.connect(audioCtx.destination);
                deaccelOsc.start(now + 0.1);
                deaccelOsc.stop(now + 1.8);
            } catch (e) {}
        }

        // --- OPTIMIZED SHARED MATERIALS & GEOMETRIES FOR ZERO-ALLOCATION FLEET PERFORMANCE ---
        const sharedCapitalParticleGeo = new THREE.SphereGeometry(2.0, 6, 6);
        const sharedCapitalParticleMat = new THREE.MeshBasicMaterial({ color: 0xff2244, transparent: true, opacity: 0.42, depthWrite: false });

        const sharedBeaconGeo = new THREE.SphereGeometry(4.0, 8, 8);
        const sharedBeaconMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
        const sharedBeaconHaloGeo = new THREE.RingGeometry(2.0, 9.0, 16);
        const sharedBeaconHaloMat = new THREE.MeshBasicMaterial({ color: 0xff1e40, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });

        const sharedRedEngineGlowMat = new THREE.MeshBasicMaterial({ color: 0xff0033, transparent: true, opacity: 0.96 });
        const sharedRedEngineCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.98 });
        const sharedRedEngineHaloMat = new THREE.MeshBasicMaterial({ color: 0xff1e40, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
        const sharedCavityMat = new THREE.MeshBasicMaterial({ color: 0x990022, side: THREE.BackSide, transparent: true, opacity: 0.85 });

        const sharedWeaponCoreGeo = new THREE.SphereGeometry(22, 32, 32);
        const sharedWeaponCoreMat = new THREE.MeshBasicMaterial({ color: 0xff0033, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
        const sharedWeaponInnerGeo = new THREE.SphereGeometry(10, 24, 24);
        const sharedWeaponInnerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.98 });
        const sharedWeaponRingMat = new THREE.MeshBasicMaterial({ color: 0xff1e38, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
        const sharedWeaponBeamGeo = new THREE.CylinderGeometry(8, 16, 95, 16, 1, true);
        sharedWeaponBeamGeo.rotateX(Math.PI / 2);
        const sharedWeaponBeamMat = new THREE.MeshBasicMaterial({ color: 0xff0044, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });

        function initCapitalParticlePool() {
            if (capitalParticlePool.length > 0) return;
            for (let i = 0; i < MAX_CAPITAL_PARTICLES; i++) {
                const p = new THREE.Mesh(sharedCapitalParticleGeo, sharedCapitalParticleMat);
                p.visible = false;
                p.userData = { life: 0, vel: new THREE.Vector3() };
                scene.add(p);
                capitalParticlePool.push(p);
            }
        }

        function createHyperspaceRiftMesh(pos, fwdDir, ship) {
            const riftGroup = new THREE.Group();
            riftGroup.position.copy(pos);
            riftGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), fwdDir);

            // Ensure single global pooled hyperspace flash light
            if (!globalHyperspaceFlashLight) {
                globalHyperspaceFlashLight = new THREE.PointLight(0xa855f7, 0, 5500);
                scene.add(globalHyperspaceFlashLight);
            }

            // 1. Jagged Vertical Spacetime Tear Mesh
            const tearHeight = 700;
            const numNodes = 14;
            const posArr = [];
            const colArr = [];

            const nodes = [];
            for (let i = 0; i < numNodes; i++) {
                const t = i / (numNodes - 1);
                const y = (t - 0.5) * tearHeight;
                const width = Math.sin(t * Math.PI) * 110;
                const xJitter = (Math.random() - 0.5) * 45;
                const zJitter = (Math.random() - 0.5) * 45;
                nodes.push({ y, width, xJitter, zJitter });
            }

            for (let i = 0; i < numNodes - 1; i++) {
                const n0 = nodes[i];
                const n1 = nodes[i + 1];

                posArr.push(
                    n0.xJitter - n0.width, n0.y, n0.zJitter,
                    0, (n0.y + n1.y) * 0.5, 10,
                    n0.xJitter + n0.width, n0.y, n0.zJitter
                );
                colArr.push(0.66, 0.33, 0.97,  1.0, 1.0, 1.0,  0.66, 0.33, 0.97);

                posArr.push(
                    n0.xJitter - n0.width, n0.y, n0.zJitter,
                    n1.xJitter + n1.width, n1.y, n1.zJitter,
                    n1.xJitter - n1.width, n1.y, n1.zJitter
                );
                colArr.push(0.66, 0.33, 0.97,  0.0, 0.94, 1.0,  0.66, 0.33, 0.97);
            }

            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
            geom.setAttribute('color', new THREE.Float32BufferAttribute(colArr, 3));
            geom.computeVertexNormals();

            const tearMat = new THREE.MeshBasicMaterial({
                vertexColors: true,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.95,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const tearMesh = new THREE.Mesh(geom, tearMat);
            riftGroup.add(tearMesh);

            // 2. Gravitational Distortion Shockwave Ring
            const ringGeo = new THREE.RingGeometry(10, 45, 64);
            ringGeo.rotateX(Math.PI / 2);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xa855f7,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.0,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const shockwaveMesh = new THREE.Mesh(ringGeo, ringMat);
            riftGroup.add(shockwaveMesh);

            // 3. Relativistic Tachyon Spark Particles (Single Points Draw Call)
            const sparkCount = 45;
            const sparkPositions = new Float32Array(sparkCount * 3);
            const sparkVelocities = [];
            for (let s = 0; s < sparkCount; s++) {
                sparkPositions[s * 3] = 0;
                sparkPositions[s * 3 + 1] = 0;
                sparkPositions[s * 3 + 2] = 0;
                sparkVelocities.push(new THREE.Vector3(
                    (Math.random() - 0.5) * 160,
                    (Math.random() - 0.5) * 160,
                    (Math.random() - 0.5) * 160
                ));
            }
            const sparkGeo = new THREE.BufferGeometry();
            sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
            const sparkMat = new THREE.PointsMaterial({
                color: 0x00f0ff,
                size: 8.0,
                transparent: true,
                opacity: 0.95,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
            riftGroup.add(sparkPoints);

            scene.add(riftGroup);

            const riftObj = {
                group: riftGroup,
                tearMesh: tearMesh,
                shockwaveMesh: shockwaveMesh,
                sparkPoints: sparkPoints,
                sparkVelocities: sparkVelocities,
                startTime: performance.now(),
                pos: pos.clone ? pos.clone() : pos,
                ship: ship
            };
            activeHyperspaceRifts.push(riftObj);
            return riftObj;
        }

        function buildSingleCapitalShip(cfg) {
            const shipGroup = new THREE.Group();
            shipGroup.visible = false; // Immediately hide
            const meshContainer = new THREE.Group();
            shipGroup.add(meshContainer);

            shipGroup.userData = {
                id: cfg.id,
                name: cfg.name,
                targetPos: cfg.targetPos.clone(),
                entryPos: cfg.targetPos.clone(),
                jumpDelay: cfg.jumpDelay,
                scale: cfg.scale || 1200,
                jumpPhase: 'WAITING',
                beacons: [],
                engineEmitters: [],
                weaponLights: [],
                weaponGlows: [],
                meshContainer: meshContainer,
                lastFighterLaunchTime: Date.now() + 5000 + Math.random() * 8000,
                fighterLaunchInterval: 11000 + Math.random() * 6000,
                hp: 4500,
                maxHp: 4500,
                isDead: false
            };

            // 1. Red Emissive Navigation Beacons (Zero dynamic lights, high visibility)
            const beaconConfigs = [
                { x: -180, y: 25, z: 50 },
                { x: 180, y: 25, z: 50 },
                { x: 0, y: 180, z: 200 }
            ];

            beaconConfigs.forEach(bPos => {
                const bGroup = new THREE.Group();
                bGroup.position.set(bPos.x, bPos.y, bPos.z);
                const bMesh = new THREE.Mesh(sharedBeaconGeo, sharedBeaconMat);
                bGroup.add(bMesh);
                const bHalo = new THREE.Mesh(sharedBeaconHaloGeo, sharedBeaconHaloMat);
                bGroup.add(bHalo);
                shipGroup.add(bGroup);
                shipGroup.userData.beacons.push(bGroup);
            });

            // 2. Red Glowing Rear Engine Thruster Arrays (Shared materials & recessed inside rear housing)
            const engineClusters = [
                { x: 0, y: -12, z: 535, r: 36.0 },
                { x: -52, y: 15, z: 525, r: 24.0 },
                { x: 52, y: 15, z: 525, r: 24.0 },
                { x: -44, y: -38, z: 525, r: 20.0 },
                { x: 44, y: -38, z: 525, r: 20.0 }
            ];

            engineClusters.forEach(eng => {
                const engGroup = new THREE.Group();
                engGroup.position.set(eng.x, eng.y, eng.z);

                const cavityGeo = new THREE.CylinderGeometry(eng.r * 0.85, eng.r * 0.95, 28, 24, 1, true);
                const cavity = new THREE.Mesh(cavityGeo, sharedCavityMat);
                cavity.rotation.x = Math.PI / 2;
                cavity.position.z = -14;
                engGroup.add(cavity);

                const diskGeo = new THREE.CircleGeometry(eng.r * 0.92, 24);
                const disk = new THREE.Mesh(diskGeo, sharedRedEngineGlowMat);
                disk.position.z = 1.0;
                engGroup.add(disk);

                const coreGeo = new THREE.CircleGeometry(eng.r * 0.42, 24);
                const core = new THREE.Mesh(coreGeo, sharedRedEngineCoreMat);
                core.position.z = 1.6;
                engGroup.add(core);

                const haloGeo = new THREE.RingGeometry(eng.r * 0.8, eng.r * 1.35, 24);
                const halo = new THREE.Mesh(haloGeo, sharedRedEngineHaloMat);
                halo.position.z = 2.2;
                engGroup.add(halo);

                shipGroup.add(engGroup);

                shipGroup.userData.engineEmitters.push({
                    x: eng.x / 3,
                    y: eng.y / 3,
                    z: eng.z / 3,
                    r: eng.r / 3
                });
            });

            // Single subtle flagship engine illumination
            if (cfg.id === "flagship") {
                const engLight = new THREE.PointLight(0xff0022, 3.5, 450);
                engLight.position.set(0, -12, 545);
                shipGroup.add(engLight);
            }

            // 3. Red Glow Inside Front Spinal Weapon Area (Recessed inside prow cavity)
            const weaponAreaGroup = new THREE.Group();
            weaponAreaGroup.position.set(0, 18, -475);

            const weaponCoreMesh = new THREE.Mesh(sharedWeaponCoreGeo, sharedWeaponCoreMat);
            weaponAreaGroup.add(weaponCoreMesh);
            shipGroup.userData.weaponGlows.push(weaponCoreMesh);

            const weaponInnerMesh = new THREE.Mesh(sharedWeaponInnerGeo, sharedWeaponInnerMat);
            weaponAreaGroup.add(weaponInnerMesh);

            [ -35, 0, 35 ].forEach((zOff, idx) => {
                const ringR = 26 - idx * 4;
                const ringGeo = new THREE.TorusGeometry(ringR, 2.2, 16, 32);
                const ringMesh = new THREE.Mesh(ringGeo, sharedWeaponRingMat);
                ringMesh.position.z = zOff;
                weaponAreaGroup.add(ringMesh);
                shipGroup.userData.weaponGlows.push(ringMesh);
            });

            const beamMesh = new THREE.Mesh(sharedWeaponBeamGeo, sharedWeaponBeamMat);
            beamMesh.position.z = -25;
            weaponAreaGroup.add(beamMesh);
            shipGroup.userData.weaponGlows.push(beamMesh);

            // Single subtle flagship weapon illumination
            if (cfg.id === "flagship") {
                const weaponLight = new THREE.PointLight(0xff0033, 4.5, 500);
                weaponLight.position.set(0, 0, 0);
                weaponAreaGroup.add(weaponLight);
                shipGroup.userData.weaponLights.push(weaponLight);
            }

            shipGroup.add(weaponAreaGroup);

            // Attach cloned GLB template if available
            if (dominionCapitalShipTemplate) {
                const cloned = dominionCapitalShipTemplate.clone(true);
                meshContainer.add(cloned);
            }

            // Hide the ship initially so it doesn't appear until fleet hyperspace emergence
            shipGroup.visible = false;
            
            scene.add(shipGroup);
            return shipGroup;
        }

        function createCapitalShip() {
            // Load Dominion Capital Ship GLB Model template once (ships will be instantiated upon hyperspace emergence)
            const gltfLoader = new THREE.GLTFLoader();
            gltfLoader.load('fbx/dominion_capital_ship.glb?v=' + Date.now(), function(gltf) {
                const model = gltf.scene;

                const maxAniso = (typeof renderer !== 'undefined' && renderer.capabilities) ? renderer.capabilities.getMaxAnisotropy() : 16;
                model.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        const mats = Array.isArray(child.material) ? child.material : [child.material];
                        mats.forEach(mat => {
                            mat.transparent = false;
                            mat.opacity = 1.0;
                            mat.depthWrite = true;
                            mat.depthTest = true;
                            mat.side = THREE.DoubleSide;
                            mat.metalness = THREE.MathUtils.clamp(mat.metalness || 0.75, 0.5, 0.95);
                            mat.roughness = THREE.MathUtils.clamp(mat.roughness || 0.35, 0.25, 0.55);
                            mat.envMapIntensity = 1.6;
                            if (mat.map) {
                                mat.map.anisotropy = maxAniso;
                                mat.map.generateMipmaps = true;
                                mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                                mat.map.magFilter = THREE.LinearFilter;
                                mat.map.needsUpdate = true;
                            }
                            mat.needsUpdate = true;
                        });
                    }
                });

                const box = new THREE.Box3().setFromObject(model);
                const size = new THREE.Vector3();
                box.getSize(size);
                const center = new THREE.Vector3();
                box.getCenter(center);

                const maxDim = Math.max(size.x, size.y, size.z);
                const targetScale = 1200 / (maxDim || 1);
                model.scale.set(targetScale, targetScale, targetScale);
                model.rotation.set(0, Math.PI / 2, 0);
                model.position.set(-center.z * targetScale, -center.y * targetScale, center.x * targetScale);

                dominionCapitalShipTemplate = model;

                // Populate template for any active fleet capital ships if already spawned
                if (capitalShips && capitalShips.length > 0) {
                    capitalShips.forEach(ship => {
                        if (ship.userData && ship.userData.meshContainer && ship.userData.meshContainer.children.length === 0) {
                            const cloned = dominionCapitalShipTemplate.clone(true);
                            const s = (ship.userData.scale || 1200) / 1200;
                            cloned.scale.multiplyScalar(s);
                            ship.userData.meshContainer.add(cloned);
                        }
                    });
                }

                console.log("[DOMINION FLEET] Capital Dreadnought GLB Model Templated Successfully!");
            }, undefined, function(err) {
                console.error("[DOMINION CAPITAL SHIP GLB ERROR]", err);
            });
        }

        function spawnDominionCapitalFleet() {
            if (capitalShips && capitalShips.length > 0) return;

            capitalShips = DOMINION_FLEET_CONFIG.map(cfg => buildSingleCapitalShip(cfg));
            capitalShip = capitalShips[2]; // Lead Flagship 'Iron Sovereign' (center)

            if (dominionCapitalShipTemplate) {
                capitalShips.forEach(ship => {
                    if (ship.userData && ship.userData.meshContainer && ship.userData.meshContainer.children.length === 0) {
                        const cloned = dominionCapitalShipTemplate.clone(true);
                        const s = (ship.userData.scale || 1200) / 1200;
                        cloned.scale.multiplyScalar(s);
                        ship.userData.meshContainer.add(cloned);
                    }
                });
            }

            initCapitalShipSpinalBeams();
        }

        function launchFightersFromCapitalShip(ship, count = 3) {
            if (!ship || !ship.userData) return;
            for (let f = 0; f < count; f++) {
                const newFighter = createEnemyInterceptorMesh();
                const tubeX = (f === 0) ? 0 : (f % 2 === 1 ? -48 : 48);
                const tubeZ = -80 - f * 35;
                const ventralOffset = new THREE.Vector3(
                    tubeX,
                    -40,
                    tubeZ
                ).applyQuaternion(ship.quaternion);

                newFighter.position.copy(ship.position).add(ventralOffset);
                newFighter.quaternion.copy(ship.quaternion);
                newFighter.userData.hp = 100;
                newFighter.userData.maxHp = 100;

                scene.add(newFighter);
                enemyShips.push(newFighter);
                spawnLaserImpactSparks(newFighter.position);
            }
        }

        function triggerDominionFleetHyperspaceEmergence() {
            window.mission3Active = true;
            window.isMission3Active = true;

            // Instantiate the 5 Dominion Capital Ships if not yet spawned
            if (!capitalShips || capitalShips.length === 0) {
                spawnDominionCapitalFleet();
            }

            fleetEmergenceStartTime = performance.now();
            fleetEmergenceActive = true;

            const fleetFacing = new THREE.Vector3(0, 0, 1); // Maintain current correct facing direction towards player
            const flightDirection = new THREE.Vector3(0, 0, -1); // Restored original flight path

            capitalShips.forEach(ship => {
                ship.visible = false;
                ship.userData.jumpPhase = 'WAITING';
                ship.userData.hasInitialLaunched = false;

                ship.userData.fwdDir = flightDirection.clone();
                ship.userData.entryPos = ship.userData.targetPos.clone().sub(flightDirection.clone().multiplyScalar(4500));
                ship.position.copy(ship.userData.entryPos);
                
                const lookTarget = ship.position.clone().add(fleetFacing.clone().multiplyScalar(1000));
                ship.lookAt(lookTarget);
            });

            // removed toast line
        }

        function createWormholeGate() {
            createTitanExcavationAndGoldenGate();
        }

        function createTitanExcavationAndGoldenGate() {
            // 1. Excavation Impact Crater on Titan's Methane Lake Surface (Kraken Mare)
            titanExcavationSite = new THREE.Group();
            titanExcavationSite.position.copy(titanExtractionCraterLocalPos);

            // Orient tangent to Titan's sphere surface
            const localNormal = titanExtractionCraterLocalPos.clone().normalize();
            titanExcavationSite.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), localNormal);

            if (spaceTitanSphere) {
                spaceTitanSphere.add(titanExcavationSite);
            } else if (spaceTitan) {
                spaceTitan.add(titanExcavationSite);
            } else {
                scene.add(titanExcavationSite);
            }

            // A. Superheated Molten Lava Magma Floor
            const lavaCoreGeo = new THREE.CircleGeometry(260, 48);
            lavaCoreGeo.rotateX(-Math.PI / 2);
            const lavaCoreMat = new THREE.MeshBasicMaterial({
                color: 0xc026d3,
                transparent: true,
                opacity: 0.88,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });
            const lavaMesh = new THREE.Mesh(lavaCoreGeo, lavaCoreMat);
            lavaMesh.position.y = 2;
            titanExcavationSite.add(lavaMesh);
            titanExcavationCraterMesh = lavaMesh;

            // Inner hot white-violet thermal blast core
            const hotCoreGeo = new THREE.CircleGeometry(140, 32);
            hotCoreGeo.rotateX(-Math.PI / 2);
            const hotCoreMat = new THREE.MeshBasicMaterial({
                color: 0xfdf4ff,
                transparent: true,
                opacity: 0.95,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });
            const hotCoreMesh = new THREE.Mesh(hotCoreGeo, hotCoreMat);
            hotCoreMesh.position.y = 4;
            titanExcavationSite.add(hotCoreMesh);

            // B. Fractured Frozen Methane-Ice Crust Rim
            const rimGeo = new THREE.RingGeometry(240, 420, 48);
            rimGeo.rotateX(-Math.PI / 2);
            const rimMat = new THREE.MeshStandardMaterial({
                color: 0x090d16,
                roughness: 0.85,
                metalness: 0.25,
                side: THREE.DoubleSide
            });
            const rimMesh = new THREE.Mesh(rimGeo, rimMat);
            rimMesh.position.y = 1;
            titanExcavationSite.add(rimMesh);

            // B2. Solid Methane-Ice Crust Sheet (Covers and conceals the Ancient Gate until melted)
            const iceGeo = new THREE.CircleGeometry(265, 48);
            iceGeo.rotateX(-Math.PI / 2);
            const iceMat = new THREE.MeshStandardMaterial({
                color: 0x93c5fd,
                roughness: 0.35,
                metalness: 0.15,
                transparent: true,
                opacity: 0.95,
                side: THREE.DoubleSide
            });
            titanIceCrustMesh = new THREE.Mesh(iceGeo, iceMat);
            titanIceCrustMesh.position.y = 8;
            titanExcavationSite.add(titanIceCrustMesh);

            // C. Excavation Thermal Point Light
            titanExcavationLight = new THREE.PointLight(0xa855f7, 14.0, 7500);
            titanExcavationLight.position.set(0, 50, 0);
            titanExcavationSite.add(titanExcavationLight);

            // D. Concentric Planetary Shockwave Waves
            titanShockwaves = [];
            for (let s = 0; s < 3; s++) {
                const swGeo = new THREE.RingGeometry(60, 85, 32);
                swGeo.rotateX(-Math.PI / 2);
                const swMat = new THREE.MeshBasicMaterial({
                    color: 0xd946ef,
                    transparent: true,
                    opacity: 0.75,
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending
                });
                const swMesh = new THREE.Mesh(swGeo, swMat);
                swMesh.position.y = 6 + s * 2;
                swMesh.userData = { radius: 60 + s * 90, maxRadius: 360, speed: 85 + s * 20 };
                titanExcavationSite.add(swMesh);
                titanShockwaves.push(swMesh);
            }

            // E. Boiling Methane Vapor Geysers (Zero-Allocation Pool)
            titanVaporPool = [];
            titanActiveVapor = [];
            const vaporGeo = new THREE.SphereGeometry(22, 8, 8);
            const vaporMat = new THREE.MeshBasicMaterial({
                color: 0x67e8f9,
                transparent: true,
                opacity: 0.40,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            for (let v = 0; v < 60; v++) {
                const vaporMesh = new THREE.Mesh(vaporGeo, vaporMat.clone());
                vaporMesh.visible = false;
                vaporMesh.userData = {
                    r: Math.random() * 200,
                    theta: Math.random() * Math.PI * 2,
                    y: Math.random() * 80,
                    vy: 20 + Math.random() * 45,
                    life: Math.random(),
                    maxLife: 1.0,
                    scale: 1.0 + Math.random() * 1.5
                };
                titanExcavationSite.add(vaporMesh);
                titanVaporPool.push(vaporMesh);
            }

            // F. Ionization Dark-Energy Lightning Arcs
            titanLightningBolts = [];
            for (let l = 0; l < 5; l++) {
                const points = [];
                for (let pt = 0; pt < 10; pt++) {
                    points.push(new THREE.Vector3(0, 0, 0));
                }
                const lGeo = new THREE.BufferGeometry().setFromPoints(points);
                const lMat = new THREE.LineBasicMaterial({
                    color: 0xe879f9,
                    linewidth: 2,
                    blending: THREE.AdditiveBlending,
                    transparent: true,
                    opacity: 0.9
                });
                const lLine = new THREE.Line(lGeo, lMat);
                titanExcavationSite.add(lLine);
                titanLightningBolts.push(lLine);
            }

            // 2. Colossal Moon-Sized Ancient Precursor Golden Gate Ring
            ancientGoldenGate = new THREE.Group();
            ancientGoldenGate.name = "AncientPrecursorGoldenGate";

            // A. Colossal Golden Torus Ring (Outer Precursor Monolith Hull)
            const ringGeo = new THREE.TorusGeometry(320, 24, 24, 96);
            ringGeo.rotateX(Math.PI / 2);
            const ringMat = new THREE.MeshStandardMaterial({
                color: 0xf59e0b,
                metalness: 0.96,
                roughness: 0.20,
                envMapIntensity: 2.0
            });
            goldenRingMesh = new THREE.Mesh(ringGeo, ringMat);
            ancientGoldenGate.add(goldenRingMesh);

            // B. Concentric Etched Golden Runic Inscription Bands
            const glyphGeo = new THREE.TorusGeometry(265, 8, 16, 64);
            glyphGeo.rotateX(Math.PI / 2);
            const glyphMat = new THREE.MeshBasicMaterial({
                color: 0xfde047,
                wireframe: true,
                transparent: true,
                opacity: 0.88,
                blending: THREE.AdditiveBlending
            });
            goldenGlyphRingMesh = new THREE.Mesh(glyphGeo, glyphMat);
            ancientGoldenGate.add(goldenGlyphRingMesh);

            // C. 12 Massive Golden Pylon Conduits / Anchor Obelisks with Luminous Violet Crystals
            goldenGatePylons = [];
            for (let i = 0; i < 12; i++) {
                const pylonGroup = new THREE.Group();
                const angle = (i / 12) * Math.PI * 2;

                // Tapered golden precursor obelisk
                const obeliskGeo = new THREE.CylinderGeometry(5, 14, 90, 6);
                const obeliskMat = new THREE.MeshStandardMaterial({
                    color: 0xd97706,
                    metalness: 0.94,
                    roughness: 0.22
                });
                const obeliskMesh = new THREE.Mesh(obeliskGeo, obeliskMat);
                obeliskMesh.position.y = 45;
                pylonGroup.add(obeliskMesh);

                // Luminous Violet Focus Crystal Tip (Anchor Receptor for Tractor Beams)
                const crystalGeo = new THREE.OctahedronGeometry(12, 1);
                const crystalMat = new THREE.MeshBasicMaterial({
                    color: 0xd946ef,
                    blending: THREE.AdditiveBlending
                });
                const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
                crystalMesh.position.y = 96;
                pylonGroup.add(crystalMesh);

                pylonGroup.position.set(Math.cos(angle) * 320, 0, Math.sin(angle) * 320);
                pylonGroup.rotation.y = -angle;
                pylonGroup.rotation.z = 0.15; // Slightly outward canted

                ancientGoldenGate.add(pylonGroup);
                goldenGatePylons.push({ group: pylonGroup, crystal: crystalMesh, angle: angle });
            }

            // D. Dense 2D Planar Circular Cosmic Particle Wormhole & Dual Counter-Rotating Swirls (No 3D Funnel)
            goldenGateVortexGroup = new THREE.Group();

            function createWormholeParticleTexture() {
                const canvas = document.createElement('canvas');
                canvas.width = 64;
                canvas.height = 64;
                const ctx = canvas.getContext('2d');
                const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
                grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
                grad.addColorStop(0.22, 'rgba(217, 70, 239, 0.95)');
                grad.addColorStop(0.55, 'rgba(126, 34, 206, 0.45)');
                grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 64, 64);
                const tex = new THREE.CanvasTexture(canvas);
                tex.generateMipmaps = true;
                return tex;
            }

            const pTex = createWormholeParticleTexture();

            // 1. Primary Clockwise Circular Particle Swirl (18,000 Dense Cosmic Particles in 2D Circular Aperture)
            const spiralCount = 18000;
            const spiralGeo = new THREE.BufferGeometry();
            const spiralPositions = new Float32Array(spiralCount * 3);
            const spiralColors = new Float32Array(spiralCount * 3);
            const spiralData = [];

            const spiralColorPalette1 = [
                new THREE.Color(0xa855f7), // Radiant Violet
                new THREE.Color(0x00f0ff), // Electric Cyan
                new THREE.Color(0xd946ef), // Intense Magenta
                new THREE.Color(0xffffff), // White Tachyon Core
                new THREE.Color(0x38bdf8), // Subspace Sky Blue
                new THREE.Color(0xc084fc)  // Slipspace Violet
            ];

            for (let p = 0; p < spiralCount; p++) {
                const arm = p % 6; // 6 logarithmic spiral arms
                const rNorm = Math.pow(Math.random(), 0.65); // Strong density bias toward core
                const r = 6 + rNorm * 260; // Radius from 6 to 266 units
                const baseTheta = (arm * (Math.PI / 3)) + (r * 0.032) + (Math.random() - 0.5) * 0.35;
                const y = (Math.random() - 0.5) * 1.5; // Strictly in 2D planar space
                
                spiralPositions[p * 3] = Math.cos(baseTheta) * r;
                spiralPositions[p * 3 + 1] = y;
                spiralPositions[p * 3 + 2] = Math.sin(baseTheta) * r;

                const col = spiralColorPalette1[p % spiralColorPalette1.length];
                const finalCol = col.clone().lerp(new THREE.Color(0xffffff), Math.max(0, 1.0 - r / 100));
                spiralColors[p * 3] = finalCol.r;
                spiralColors[p * 3 + 1] = finalCol.g;
                spiralColors[p * 3 + 2] = finalCol.b;

                spiralData.push({
                    r: r,
                    rMin: 6,
                    rMax: 266,
                    theta: baseTheta,
                    speed: 0.65 + (1.0 - rNorm) * 2.2, // Clockwise rotation speed
                    rSpeed: (0.6 + Math.random() * 1.4) * 14
                });
            }

            spiralGeo.setAttribute('position', new THREE.BufferAttribute(spiralPositions, 3));
            spiralGeo.setAttribute('color', new THREE.BufferAttribute(spiralColors, 3));

            const spiralMat = new THREE.PointsMaterial({
                size: 16,
                map: pTex,
                vertexColors: true,
                transparent: true,
                opacity: 0.95,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            goldenGateSpiralPoints = new THREE.Points(spiralGeo, spiralMat);
            goldenGateSpiralPoints.userData = { pData: spiralData };
            goldenGateVortexGroup.add(goldenGateSpiralPoints);

            // 2. Secondary Counter-Clockwise (Opposite Direction) Circular Particle Swirl (18,000 Dense Particles in 2D Disc)
            const counterCount = 18000;
            const counterGeo = new THREE.BufferGeometry();
            const counterPositions = new Float32Array(counterCount * 3);
            const counterColors = new Float32Array(counterCount * 3);
            const counterData = [];

            const spiralColorPalette2 = [
                new THREE.Color(0xfbbf24), // Precursor Gold
                new THREE.Color(0xfde047), // Solar Gold
                new THREE.Color(0xf59e0b), // Deep Amber Gold
                new THREE.Color(0x00f0ff), // Electric Cyan
                new THREE.Color(0xffffff), // Pure White
                new THREE.Color(0xd946ef)  // Intense Magenta
            ];

            for (let c = 0; c < counterCount; c++) {
                const arm = c % 6; // 6 opposing logarithmic spiral arms
                const rNorm = Math.pow(Math.random(), 0.65);
                const r = 6 + rNorm * 260;
                // Negative spiral winding angle for opposite swirl shape
                const baseTheta = -(arm * (Math.PI / 3)) - (r * 0.032) + (Math.random() - 0.5) * 0.35;
                const y = (Math.random() - 0.5) * 1.5; // Strictly in 2D planar space

                counterPositions[c * 3] = Math.cos(baseTheta) * r;
                counterPositions[c * 3 + 1] = y;
                counterPositions[c * 3 + 2] = Math.sin(baseTheta) * r;

                const col = spiralColorPalette2[c % spiralColorPalette2.length];
                const finalCol = col.clone().lerp(new THREE.Color(0xffffff), Math.max(0, 1.0 - r / 100));
                counterColors[c * 3] = finalCol.r;
                counterColors[c * 3 + 1] = finalCol.g;
                counterColors[c * 3 + 2] = finalCol.b;

                counterData.push({
                    r: r,
                    rMin: 6,
                    rMax: 266,
                    theta: baseTheta,
                    speed: 0.65 + (1.0 - rNorm) * 2.2, // Counter-clockwise rotation speed
                    rSpeed: (0.6 + Math.random() * 1.4) * 14
                });
            }

            counterGeo.setAttribute('position', new THREE.BufferAttribute(counterPositions, 3));
            counterGeo.setAttribute('color', new THREE.BufferAttribute(counterColors, 3));

            const counterMat = new THREE.PointsMaterial({
                size: 16,
                map: pTex,
                vertexColors: true,
                transparent: true,
                opacity: 0.92,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            goldenGateTunnelPoints = new THREE.Points(counterGeo, counterMat);
            goldenGateTunnelPoints.userData = { pData: counterData };
            goldenGateVortexGroup.add(goldenGateTunnelPoints);

            // 3. Peripheral Precursor Boundary Corona (6,000 Dense Particles in 2D Ring Plane)
            const borderCount = 6000;
            const borderGeo = new THREE.BufferGeometry();
            const borderPositions = new Float32Array(borderCount * 3);
            const borderColors = new Float32Array(borderCount * 3);
            const borderData = [];

            for (let b = 0; b < borderCount; b++) {
                const theta = Math.random() * Math.PI * 2;
                const r = 250 + Math.random() * 25;
                const y = (Math.random() - 0.5) * 1.5;

                borderPositions[b * 3] = Math.cos(theta) * r;
                borderPositions[b * 3 + 1] = y;
                borderPositions[b * 3 + 2] = Math.sin(theta) * r;

                const bCol = Math.random() > 0.45 ? new THREE.Color(0xfbbf24) : new THREE.Color(0xd946ef);
                borderColors[b * 3] = bCol.r;
                borderColors[b * 3 + 1] = bCol.g;
                borderColors[b * 3 + 2] = bCol.b;

                borderData.push({
                    theta: theta,
                    rotSpeed: (Math.random() - 0.5) * 1.2,
                    r: r
                });
            }

            borderGeo.setAttribute('position', new THREE.BufferAttribute(borderPositions, 3));
            borderGeo.setAttribute('color', new THREE.BufferAttribute(borderColors, 3));

            const borderMat = new THREE.PointsMaterial({
                size: 16,
                map: pTex,
                vertexColors: true,
                transparent: true,
                opacity: 0.88,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            goldenGateBorderPoints = new THREE.Points(borderGeo, borderMat);
            goldenGateBorderPoints.userData = { pData: borderData };
            goldenGateVortexGroup.add(goldenGateBorderPoints);

            ancientGoldenGate.add(goldenGateVortexGroup);

            // E. Radiant Golden & Violet Ambient Lights
            goldenGateLight = new THREE.PointLight(0xfbbf24, 16.0, 6500);
            goldenGateLight.position.set(0, 20, 0);
            ancientGoldenGate.add(goldenGateLight);

            const gateVioletLight = new THREE.PointLight(0xa855f7, 14.0, 5500);
            gateVioletLight.position.set(0, -20, 0);
            ancientGoldenGate.add(gateVioletLight);

            // F. Gravitational Space-Time Lensing Ripples
            goldenGateRipples = [];
            for (let r = 0; r < 2; r++) {
                const ripGeo = new THREE.RingGeometry(260, 310, 48);
                ripGeo.rotateX(Math.PI / 2);
                const ripMat = new THREE.MeshBasicMaterial({
                    color: 0xc084fc,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.65,
                    blending: THREE.AdditiveBlending
                });
                const ripMesh = new THREE.Mesh(ripGeo, ripMat);
                ripMesh.userData = { radius: 260 + r * 140, maxRadius: 580, speed: 75 };
                ancientGoldenGate.add(ripMesh);
                goldenGateRipples.push(ripMesh);
            }

            // Initial Placement: In World Space at the Titan Crater (100% Hidden under ice initially)
            ancientGoldenGate.visible = false;
            titanExcavationSite.visible = false; // Crater and molten floor initially hidden
            scene.add(ancientGoldenGate);
            wormholeGate = ancientGoldenGate; // Point all radar & map references to Golden Gate

            // Initialize position at Titan excavation surface
            const craterWorld = titanExcavationSite.getWorldPosition(new THREE.Vector3());
            ancientGoldenGate.position.copy(craterWorld);
            ancientGoldenGate.quaternion.copy(titanExcavationSite.getWorldQuaternion(new THREE.Quaternion()));

            console.log("[TITAN EXCAVATION] Huge Golden Precursor Gate (Buried Under Ice) & Excavation Crater Initialized on Titan!");
            initCapitalShipSpinalBeams();
        }

        function initCapitalShipSpinalBeams() {
            if (capitalSpinalBeams.length > 0) return;
            if (!capitalShips || capitalShips.length === 0) return;

            capitalShips.forEach((ship, idx) => {
                const beamGroup = new THREE.Group();
                beamGroup.visible = false;
                scene.add(beamGroup);

                // Standard untranslated CylinderGeometry (height = 1, natively centered from y = -0.5 to y = +0.5)
                // 1. Inner Intense Core Cylinder (Tapering from ship radius 16 to ring radius 10)
                const coreGeo = new THREE.CylinderGeometry(10, 16, 1, 16);
                const coreMat = new THREE.MeshBasicMaterial({
                    color: 0xfdf4ff,
                    blending: THREE.AdditiveBlending
                });
                const coreMesh = new THREE.Mesh(coreGeo, coreMat);
                beamGroup.add(coreMesh);

                // 2. Graviton Plasma Sheath Column (Tapering from ship radius 52 to ring radius 28)
                const plasmaGeo = new THREE.CylinderGeometry(28, 52, 1, 16);
                const plasmaMat = new THREE.MeshBasicMaterial({
                    color: 0x9333ea,
                    transparent: true,
                    opacity: 0.85,
                    blending: THREE.AdditiveBlending
                });
                const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
                beamGroup.add(plasmaMesh);

                // 3. Helical Magnetic Confinement Cage (Tapering from ship radius 92 to ring radius 52)
                const cageGeo = new THREE.CylinderGeometry(52, 92, 1, 16);
                const cageMat = new THREE.MeshBasicMaterial({
                    color: 0xd946ef,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.45,
                    blending: THREE.AdditiveBlending
                });
                const cageMesh = new THREE.Mesh(cageGeo, cageMat);
                beamGroup.add(cageMesh);

                // 4. Traveling Tractor Rings (Stream along Shaft between Gate and Ship)
                const tractorRings = [];
                for (let r = 0; r < 5; r++) {
                    const tRingGeo = new THREE.TorusGeometry(36, 4.5, 8, 24);
                    tRingGeo.rotateX(Math.PI / 2);
                    const tRingMat = new THREE.MeshBasicMaterial({
                        color: 0xfbbf24,
                        transparent: true,
                        opacity: 0.75,
                        blending: THREE.AdditiveBlending
                    });
                    const tRingMesh = new THREE.Mesh(tRingGeo, tRingMat);
                    tRingMesh.userData = { offset: r * 0.20 };
                    tRingMesh.visible = false;
                    beamGroup.add(tRingMesh);
                    tractorRings.push(tRingMesh);
                }

                // 5. Ventral Core Flare at Ship Center
                const flareGeo = new THREE.SphereGeometry(38, 16, 16);
                const flareMat = new THREE.MeshBasicMaterial({
                    color: 0xd946ef,
                    transparent: true,
                    opacity: 0.85,
                    blending: THREE.AdditiveBlending
                });
                const flareMesh = new THREE.Mesh(flareGeo, flareMat);
                flareMesh.visible = false;
                scene.add(flareMesh);

                const beamData = {
                    ship: ship,
                    shipIndex: idx,
                    group: beamGroup,
                    core: coreMesh,
                    plasma: plasmaMesh,
                    cage: cageMesh,
                    rings: tractorRings,
                    flare: flareMesh,
                    pylonTargetIndex: [7, 5, 3, 1, 11][idx % 5]
                };
                capitalSpinalBeams.push(beamData);
                ship.userData.spinalBeam = beamData;
            });
            console.log(`[DOMINION CAPITAL BEAMS] Initialized ${capitalSpinalBeams.length} Spinal Tractor/Bombardment Beams!`);
        }

        function toggleTractorExtraction() {
            if (titanExcavationPhase === 'WAITING_FOR_FLEET' || titanExcavationPhase === 'BOMBARDMENT') {
                titanExcavationPhase = 'TRACTOR_EXTRACTION';
                isTitanExcavationStarted = true;
                titanExcavationStartTime = performance.now() - 13000; // Jump immediately to tractor phase
                if (ancientGoldenGate) ancientGoldenGate.visible = true;
                if (titanIceCrustMesh) titanIceCrustMesh.visible = false;
                // removed toast line
            } else if (titanExcavationPhase === 'TRACTOR_EXTRACTION') {
                titanExcavationPhase = 'GATE_ACTIVE';
                isTitanExcavationStarted = true;
                titanExcavationStartTime = performance.now() - 35000; // Jump to gate in space
                goldenRingLiftProgress = 1.0;
                if (ancientGoldenGate) ancientGoldenGate.visible = true;
                if (titanIceCrustMesh) titanIceCrustMesh.visible = false;
                showToast("🌀 GOLDEN PRECURSOR GATE IN SPACE — TRACTOR BEAMS DISENGAGED — SLIPSPACE VORTEX OPEN!");
            } else {
                titanExcavationPhase = 'BOMBARDMENT';
                isTitanExcavationStarted = true;
                titanExcavationStartTime = performance.now();
                goldenRingLiftProgress = 0.0;
                theCrestState = 'INTACT';
                hasTitanCinematicPlayed = false;
                if (theCrestModelOriginal) theCrestModelOriginal.visible = true;
                if (theCrestDebrisChunks) theCrestDebrisChunks.forEach(c => c.visible = false);
                if (theCrestFireballs) theCrestFireballs.forEach(f => f.visible = false);
                if (theCrestShockwaves) theCrestShockwaves.forEach(s => s.visible = false);
                if (theCrestExplosionLight) theCrestExplosionLight.intensity = 0;
                if (ancientGoldenGate) ancientGoldenGate.visible = false;
                if (titanIceCrustMesh) {
                    titanIceCrustMesh.visible = true;
                    titanIceCrustMesh.scale.set(1, 1, 1);
                    titanIceCrustMesh.material.opacity = 0.95;
                }
                showToast("⚡ INITIATING TITAN DARK-ENERGY BOMBARDMENT & METHANE CRUST MELT!");
            }
        }

        const _spinalShipCenterWorld = new THREE.Vector3();
        const _spinalTargetWorld = new THREE.Vector3();
        const _spinalBeamVec = new THREE.Vector3();
        const _spinalBeamDir = new THREE.Vector3();
        const _spinalMidPoint = new THREE.Vector3();
        const _spinalUnitY = new THREE.Vector3(0, 1, 0);

        function updateTitanExcavationAndTractorBeams(timeSec, timeDelta) {
            if (!titanExcavationSite || !ancientGoldenGate) return;

            // If fleet has not arrived yet, keep the gate hidden and beams off
            if (!isTitanExcavationStarted || titanExcavationPhase === 'WAITING_FOR_FLEET') {
                if (ancientGoldenGate) ancientGoldenGate.visible = false;
                if (titanIceCrustMesh) {
                    titanIceCrustMesh.visible = true;
                    titanIceCrustMesh.scale.set(1, 1, 1);
                    titanIceCrustMesh.material.opacity = 0.95;
                }
                if (titanExcavationLight) titanExcavationLight.intensity = 0;
                if (titanShockwaves) titanShockwaves.forEach(sw => sw.visible = false);
                if (titanLightningBolts) titanLightningBolts.forEach(l => l.visible = false);
                if (capitalSpinalBeams && capitalSpinalBeams.length > 0) {
                    capitalSpinalBeams.forEach(bData => {
                        if (bData.group) bData.group.visible = false;
                        if (bData.flare) bData.flare.visible = false;
                    });
                }
                return;
            }

            const nowMs = performance.now();
            const elapsedExcavation = (nowMs - titanExcavationStartTime) / 1000.0;

            // --- PHASE TIMELINE ---
            // 0 - 10s: BOMBARDMENT (Dark-energy purple beams melt Titan methane ice crust; gate is hidden beneath ice)
            // 10 - 12s: GATE_REVEALED (Ice melted away, huge golden gate exposed on surface, purple bombardment beams SHUT OFF)
            // 12 - 34s: TRACTOR_EXTRACTION (Gold tractor beams pull gate off Titan into space; The Crest hit & explodes)
            // 34s+: GATE_ACTIVE (Gate in space, gold tractor beams SHUT OFF, slipspace event horizon vortex active)

            let isBombardmentFiring = false;
            let isTractorFiring = false;

            if (elapsedExcavation < 10.0) {
                titanExcavationPhase = 'BOMBARDMENT';
                isBombardmentFiring = true;
                isTractorFiring = false;
                if (ancientGoldenGate) ancientGoldenGate.visible = false; // GATE IS NOT INITIALLY VISIBLE ON TITAN
                if (titanIceCrustMesh) {
                    titanIceCrustMesh.visible = true;
                    const meltT = Math.min(1.0, elapsedExcavation / 10.0);
                    titanIceCrustMesh.scale.set(1.0 - meltT * 0.9, 1.0, 1.0 - meltT * 0.9);
                    titanIceCrustMesh.material.opacity = Math.max(0.05, 0.95 * (1.0 - meltT * 0.85));
                }

                // Line 2: "They're attacking Titan! Actually... it looks like they're looking for something..."
                if (elapsedExcavation >= 1.5 && !playedArrivalStages.stage2) {
                    playedArrivalStages.stage2 = true;
                    playArrivalCommsLine({
                        speaker: "KAYLEN VANCE",
                        subspeaker: "VOID INTERCEPTOR COCKPIT / SENSOR TELEMETRY",
                        badge: "SCAN",
                        text: "They're attacking Titan! Actually... it looks like they're looking for something...",
                        audioSrc: "audio/cinematics/titan_gate/titan_arrival_02_kaylen.mp3"
                    });
                }
            } else if (elapsedExcavation >= 10.0 && elapsedExcavation < 12.0) {
                if (titanExcavationPhase !== 'GATE_REVEALED') {
                    titanExcavationPhase = 'GATE_REVEALED';
                    showToast("❄️ ICE CRUST MELTED! BOMBARDMENT CEASED — HUGE GOLDEN PRECURSOR GATE REVEALED!");
                }
                isBombardmentFiring = false; // SHUT OFF GOLD BEAMS
                isTractorFiring = false;     // TRACTOR NOT ACTIVE YET
                if (ancientGoldenGate) ancientGoldenGate.visible = true; // GATE IS NOW VISIBLE ON TITAN SURFACE
                if (titanIceCrustMesh) titanIceCrustMesh.visible = false;

                // Line 3: "There is some kind of giant circle down on Titan.  They are pulling up out of the ice.  I think they may be creating a wormhole."
                if (!playedArrivalStages.stage3) {
                    playedArrivalStages.stage3 = true;
                    playArrivalCommsLine({
                        speaker: "KAYLEN VANCE",
                        subspeaker: "VOID INTERCEPTOR COCKPIT / OPTICAL SCAN",
                        badge: "DISCOVERY",
                        text: "There is some kind of giant circle down on Titan.  They are pulling up out of the ice.  I think they may be creating a wormhole.",
                        audioSrc: "audio/cinematics/titan_gate/titan_arrival_03_kaylen.mp3"
                    });
                }
            } else if (elapsedExcavation >= 12.0 && elapsedExcavation < 34.0) {
                if (titanExcavationPhase !== 'TRACTOR_EXTRACTION') {
                    titanExcavationPhase = 'TRACTOR_EXTRACTION';
                    // removed toast line
                }
                isBombardmentFiring = false; // GOLD BEAMS REMAIN OFF
                isTractorFiring = true;      // TRACTOR BEAMS ACTIVE
                if (ancientGoldenGate) ancientGoldenGate.visible = true;
                if (titanIceCrustMesh) titanIceCrustMesh.visible = false;

                // Ensure Line 3 plays if arriving during tractor phase
                if (!playedArrivalStages.stage3) {
                    playedArrivalStages.stage3 = true;
                    playArrivalCommsLine({
                        speaker: "KAYLEN VANCE",
                        subspeaker: "VOID INTERCEPTOR COCKPIT / OPTICAL SCAN",
                        badge: "DISCOVERY",
                        text: "There is some kind of giant circle down on Titan.  They are pulling up out of the ice.  I think they may be creating a wormhole.",
                        audioSrc: "audio/cinematics/titan_gate/titan_arrival_03_kaylen.mp3"
                    });
                }
            } else {
                if (titanExcavationPhase !== 'GATE_ACTIVE') {
                    titanExcavationPhase = 'GATE_ACTIVE';
                    showToast("🌀 GOLDEN GATE IN SPACE — TRACTOR BEAMS DISENGAGED — SLIPSPACE VORTEX OPEN!");
                }
                isBombardmentFiring = false;
                isTractorFiring = false;     // TRACTOR BEAMS SHUT OFF IN SPACE
                if (ancientGoldenGate) ancientGoldenGate.visible = true;
                if (titanIceCrustMesh) titanIceCrustMesh.visible = false;
            }

            // Calculate current Golden Ring World Position, Orientation (Turned on side in space), and Scale (2x in space)
            // As Titan rotates, craterWorldPos & craterWorldQuat update dynamically!
            const craterWorldPos = titanExcavationSite.getWorldPosition(new THREE.Vector3());
            const craterWorldQuat = titanExcavationSite.getWorldQuaternion(new THREE.Quaternion());
            // In space: Turned 90 degrees on its side (standing upright as a vertical gate portal) facing the fleet corridor
            const orbitTargetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI * 0.5, 0.15, 0));

            if (elapsedExcavation < 12.0) {
                goldenRingLiftProgress = 0.0;
                ancientGoldenGate.position.copy(craterWorldPos);
                ancientGoldenGate.quaternion.copy(craterWorldQuat);
                ancientGoldenGate.scale.set(1.0, 1.0, 1.0);
            } else if (elapsedExcavation >= 12.0 && elapsedExcavation < 34.0) {
                const progress = Math.min(1.0, (elapsedExcavation - 12.0) / 22.0);
                goldenRingLiftProgress = progress;
                // Smooth sinusoidal ease-in-out for colossal artifact ascent
                const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                ancientGoldenGate.position.lerpVectors(craterWorldPos, titanExtractionOrbitWorldPos, ease);
                ancientGoldenGate.quaternion.slerpQuaternions(craterWorldQuat, orbitTargetQuat, ease);
                // Expand scale smoothly from 1.0x to 2.0x as it is pulled into space!
                const curScale = 1.0 + ease * 1.0;
                ancientGoldenGate.scale.set(curScale, curScale, curScale);
            } else {
                goldenRingLiftProgress = 1.0;
                ancientGoldenGate.position.copy(titanExtractionOrbitWorldPos);
                ancientGoldenGate.quaternion.copy(orbitTargetQuat);
                ancientGoldenGate.scale.set(2.0, 2.0, 2.0); // 2X BIGGER IN SPACE!
            }
            ancientGoldenGate.updateMatrixWorld(true);

            // --- THE CREST DESTRUCTION & MULTI-STEP BREAKUP LOGIC ---
            // Triggered during the extraction sequence:
            // At 14.5s: Struck by Dominion barrage
            // At 16.5s: Catastrophic multi-step fireball explosions (Lasts strictly 2.0s!)
            if (elapsedExcavation < 14.5) {
                theCrestState = 'INTACT';
                if (theCrestModelOriginal) theCrestModelOriginal.visible = true;
                if (theCrestExplosionLight) theCrestExplosionLight.intensity = 0;
                if (theCrestDebrisChunks) theCrestDebrisChunks.forEach(c => c.visible = false);
                if (theCrestFireballs) theCrestFireballs.forEach(f => f.visible = false);
                if (theCrestShockwaves) theCrestShockwaves.forEach(s => s.visible = false);
            } else if (elapsedExcavation >= 14.5 && elapsedExcavation < 16.5) {
                if (theCrestState !== 'STRUCK') {
                    theCrestState = 'STRUCK';
                    // removed toast line
                }
                if (theCrestExplosionLight) theCrestExplosionLight.intensity = 8.0 + Math.sin(timeSec * 20.0) * 6.0;
            } else if (elapsedExcavation >= 16.5 && elapsedExcavation < 18.5) {
                // MASSIVE FIREBALL EXPLOSION (2.0 SECONDS DURATION)
                if (theCrestState !== 'EXPLODING') {
                    theCrestState = 'EXPLODING';
                    theCrestExplosionStartTime = nowMs;
                    if (theCrestStation && playerShip) {
                        playTheCrestExplosionAudio(playerShip.position.distanceTo(theCrestStation.position));
                    }
                    showToast("🚨 MAYDAY! THE CREST REACTOR BREACH — MASSIVE FIREBALL EXPLOSION!");

                    // Line 4: "Oh no... The Crest!! NOOO!!"
                    if (!playedArrivalStages.stage4) {
                        playedArrivalStages.stage4 = true;
                        playArrivalCommsLine({
                            speaker: "KAYLEN VANCE",
                            subspeaker: "VOID INTERCEPTOR COCKPIT / EMERGENCY DISTRESS",
                            badge: "MAYDAY",
                            text: "Oh no... The Crest!! NOOO!!",
                            audioSrc: "audio/cinematics/titan_gate/titan_arrival_04_kaylen.mp3"
                        });
                    }
                }
                const expElapsed = (nowMs - theCrestExplosionStartTime) / 1000.0;
                if (expElapsed < 2.0) {
                    if (theCrestExplosionLight) {
                        theCrestExplosionLight.intensity = Math.max(0, 380.0 * (1.0 - expElapsed / 2.0));
                    }
                    if (theCrestFireballs) {
                        theCrestFireballs.forEach(fb => {
                            const ud = fb.userData || {};
                            const initPos = ud.initPos || ud.offset || new THREE.Vector3();
                            const vel = ud.vel || new THREE.Vector3();
                            const baseScale = ud.scale || 1.0;
                            const t = expElapsed / 2.0;
                            fb.visible = true;
                            fb.position.copy(initPos).addScaledVector(vel, expElapsed);
                            const scale = baseScale * (1.0 + t * 4.2);
                            fb.scale.set(scale, scale, scale);
                            if (fb.material) {
                                fb.material.opacity = Math.max(0, 0.95 * Math.pow(1.0 - t, 1.4));
                            }
                        });
                    }
                    if (theCrestShockwaves) {
                        theCrestShockwaves.forEach(sw => {
                            sw.visible = true;
                            const t = expElapsed / 2.0;
                            const r = 120 + t * 2400;
                            sw.scale.set(r / 100, r / 100, r / 100);
                            if (sw.material) {
                                sw.material.opacity = Math.max(0, 0.90 * (1.0 - t));
                            }
                        });
                    }
                } else {
                    if (theCrestExplosionLight) theCrestExplosionLight.intensity = 0;
                    if (theCrestFireballs) theCrestFireballs.forEach(fb => fb.visible = false);
                    if (theCrestShockwaves) theCrestShockwaves.forEach(sw => sw.visible = false);
                }
                if (theCrestModelOriginal) theCrestModelOriginal.visible = false;
            } else {
                // 18.5s+: EXPLOSION TOTALLY GONE — STATION SHATTERED AND DESTROYED
                if (theCrestState !== 'DESTROYED') {
                    theCrestState = 'DESTROYED';
                    showToast("💥 THE CREST DESTROYED — PRECURSOR GATE EXTRACTION REACHING CRITICAL SLIPSPACE VELOCITY!");
                }
                if (theCrestModelOriginal) theCrestModelOriginal.visible = false;
                if (theCrestExplosionLight) theCrestExplosionLight.intensity = 0;
                if (theCrestFireballs) theCrestFireballs.forEach(fb => fb.visible = false);
                if (theCrestShockwaves) theCrestShockwaves.forEach(sw => sw.visible = false);

                // Scatter shattered station wreckage slowly through vacuum
                const scatterElapsed = (theCrestExplosionStartTime > 0) ? ((nowMs - (theCrestExplosionStartTime + 2000)) / 1000.0) : Math.max(0, elapsedExcavation - 18.5);
                if (theCrestDebrisChunks) {
                    theCrestDebrisChunks.forEach(c => {
                        if (!c.userData) return;
                        const initPos = c.userData.initPos || c.userData.basePos || new THREE.Vector3();
                        const vel = c.userData.vel || new THREE.Vector3();
                        const rotSpeed = c.userData.rotSpeed || c.userData.rotVel || new THREE.Vector3();
                        c.visible = true;
                        c.position.copy(initPos).addScaledVector(vel, Math.max(0, scatterElapsed));
                        c.rotation.x += rotSpeed.x || 0;
                        c.rotation.y += rotSpeed.y || 0;
                        c.rotation.z += rotSpeed.z || 0;
                    });
                }
            }

            // Trigger Titan Precursor Wormhole Gate Cinematic at 33.5s (when gate reaches space)
            if (elapsedExcavation >= 33.5 && !isTitanCinematicActive && !hasTitanCinematicPlayed) {
                hasTitanCinematicPlayed = true;
                startTitanGateCinematic();
            }

            // 1. Animate Boiling Methane Geysers (Vapor Plumes from Superheated Crater)
            if (titanVaporPool && titanVaporPool.length > 0) {
                titanVaporPool.forEach(vp => {
                    const ud = vp.userData;
                    ud.life += timeDelta * 0.45;
                    if (ud.life >= ud.maxLife) {
                        ud.life = 0;
                        ud.r = Math.random() * 210;
                        ud.theta = Math.random() * Math.PI * 2;
                        ud.y = Math.random() * 40;
                        ud.vy = 25 + Math.random() * 50;
                        ud.scale = 1.0 + Math.random() * 2.0;
                    }
                    vp.position.x = Math.cos(ud.theta) * ud.r;
                    vp.position.z = Math.sin(ud.theta) * ud.r;
                    vp.position.y = ud.y + ud.life * ud.vy;
                    const s = ud.scale * (1.0 + ud.life * 3.5);
                    vp.scale.set(s, s, s);
                    if (vp.material) {
                        vp.material.opacity = Math.max(0, 0.45 * Math.sin(ud.life * Math.PI));
                    }
                    vp.visible = isBombardmentFiring;
                });
            }

            // 2. Animate Planetary Magma Floor Shockwaves
            if (titanShockwaves && titanShockwaves.length > 0) {
                titanShockwaves.forEach(sw => {
                    if (isBombardmentFiring) {
                        sw.visible = true;
                        sw.userData.radius += sw.userData.speed * timeDelta;
                        if (sw.userData.radius > sw.userData.maxRadius) {
                            sw.userData.radius = 60;
                        }
                        const s = sw.userData.radius / 60;
                        sw.scale.set(s, s, s);
                        if (sw.material) {
                            sw.material.opacity = Math.max(0, 0.75 * (1.0 - (sw.userData.radius / sw.userData.maxRadius)));
                        }
                    } else {
                        sw.visible = false;
                    }
                });
            }

            // 3. Animate Dark-Energy Lightning Arcs Striking Titan Crust
            if (titanLightningBolts && titanLightningBolts.length > 0) {
                titanLightningBolts.forEach(l => {
                    if (isBombardmentFiring) {
                        l.visible = Math.random() > 0.35;
                        if (l.visible) {
                            const posAttr = l.geometry.attributes.position;
                            const startAngle = Math.random() * Math.PI * 2;
                            const startR = 40 + Math.random() * 180;
                            const startPt = new THREE.Vector3(Math.cos(startAngle) * startR, 10 + Math.random() * 20, Math.sin(startAngle) * startR);
                            for (let p = 0; p < 10; p++) {
                                const frac = p / 9.0;
                                const jitter = (p === 0 || p === 9) ? 0 : (Math.random() - 0.5) * 35;
                                posAttr.setXYZ(p, startPt.x + jitter, startPt.y + frac * 220 + jitter, startPt.z + jitter);
                            }
                            posAttr.needsUpdate = true;
                        }
                    } else {
                        l.visible = false;
                    }
                });
            }

            // 4. Animate Golden Ring Inscription Bands and Pylons
            if (goldenGlyphRingMesh) {
                goldenGlyphRingMesh.rotation.y += 0.008; // Runic glyph ring counter-rotation
            }
            if (goldenRingMesh) {
                goldenRingMesh.rotation.y -= 0.003;
            }
            if (goldenGatePylons && goldenGatePylons.length > 0) {
                goldenGatePylons.forEach((p, idx) => {
                    if (p.crystal) {
                        const pulse = Math.sin(timeSec * 6.0 + idx * 0.5);
                        p.crystal.scale.setScalar(1.0 + pulse * 0.25);
                    }
                });
            }

            // 5. Animate Slipspace Wormhole Event Horizon Particles & Dual 2D Counter-Rotating Swirls
            if (goldenGateVortexGroup) {
                // Vortex is visible during gate reveal and tractor/active phases
                goldenGateVortexGroup.visible = (titanExcavationPhase !== 'WAITING_FOR_FLEET');

                // Primary Clockwise 2D Circular Swirl
                if (goldenGateSpiralPoints && goldenGateSpiralPoints.geometry) {
                    const posAttr = goldenGateSpiralPoints.geometry.attributes.position;
                    const arr = posAttr.array;
                    const pData = goldenGateSpiralPoints.userData.pData;
                    if (pData) {
                        for (let i = 0; i < pData.length; i++) {
                            const d = pData[i];
                            d.theta += d.speed * timeDelta;
                            d.r -= d.rSpeed * timeDelta;
                            if (d.r < d.rMin) {
                                d.r = d.rMax;
                            }
                            const idx = i * 3;
                            arr[idx] = Math.cos(d.theta) * d.r;
                            arr[idx + 1] = 0; // Pure 2D circular planar space
                            arr[idx + 2] = Math.sin(d.theta) * d.r;
                        }
                        posAttr.needsUpdate = true;
                    }
                }

                // Secondary Counter-Clockwise (Opposite Direction) 2D Circular Swirl
                if (goldenGateTunnelPoints && goldenGateTunnelPoints.geometry) {
                    const posAttr = goldenGateTunnelPoints.geometry.attributes.position;
                    const arr = posAttr.array;
                    const pData = goldenGateTunnelPoints.userData.pData;
                    if (pData) {
                        for (let i = 0; i < pData.length; i++) {
                            const d = pData[i];
                            d.theta -= d.speed * timeDelta; // Swirling in the opposite direction
                            d.r -= d.rSpeed * timeDelta;
                            if (d.r < d.rMin) {
                                d.r = d.rMax;
                            }
                            const idx = i * 3;
                            arr[idx] = Math.cos(d.theta) * d.r;
                            arr[idx + 1] = 0; // Pure 2D circular planar space
                            arr[idx + 2] = Math.sin(d.theta) * d.r;
                        }
                        posAttr.needsUpdate = true;
                    }
                }

                // Peripheral 2D Circular Rim Corona
                if (goldenGateBorderPoints && goldenGateBorderPoints.geometry) {
                    const posAttr = goldenGateBorderPoints.geometry.attributes.position;
                    const arr = posAttr.array;
                    const pData = goldenGateBorderPoints.userData.pData;
                    if (pData) {
                        for (let i = 0; i < pData.length; i++) {
                            const d = pData[i];
                            d.theta += d.rotSpeed * timeDelta;
                            const idx = i * 3;
                            arr[idx] = Math.cos(d.theta) * d.r;
                            arr[idx + 1] = 0; // Pure 2D circular planar space
                            arr[idx + 2] = Math.sin(d.theta) * d.r;
                        }
                        posAttr.needsUpdate = true;
                    }
                }

                if (goldenGateRipples && goldenGateRipples.length > 0) {
                    goldenGateRipples.forEach(rip => {
                        rip.userData.radius += rip.userData.speed * timeDelta;
                        if (rip.userData.radius > rip.userData.maxRadius) {
                            rip.userData.radius = 260;
                        }
                        const s = rip.userData.radius / 260;
                        rip.scale.set(s, s, s);
                        if (rip.material) {
                            rip.material.opacity = Math.max(0, 0.65 * (1.0 - (rip.userData.radius / rip.userData.maxRadius)));
                        }
                    });
                }
            }

            // 6. Animate Dreadnought Spinal Beams (Zero-Allocation Optimized)
            if (capitalSpinalBeams && capitalSpinalBeams.length > 0) {
                capitalSpinalBeams.forEach(bData => {
                    const ship = bData.ship;
                    if (!ship || !ship.visible) {
                        bData.group.visible = false;
                        bData.flare.visible = false;
                        return;
                    }

                    // If neither bombardment nor tractor is firing (e.g. gate revealed ceasefire OR gate in space), beams are OFF!
                    if (!isBombardmentFiring && !isTractorFiring) {
                        bData.group.visible = false;
                        bData.flare.visible = false;
                        return;
                    }

                    bData.group.visible = true;
                    bData.flare.visible = true;

                    // Origin: Exact center of each capital ship (zero-allocation)
                    ship.getWorldPosition(_spinalShipCenterWorld);
                    bData.flare.position.copy(_spinalShipCenterWorld);
                    bData.flare.scale.setScalar(1.0 + Math.sin(timeSec * 8.0 + bData.shipIndex) * 0.2);

                    // Target point:
                    // Both Bombardment & Tractor Beams connect directly from ship center to the ring on Titan (pylons / crystals)
                    const pylon = (goldenGatePylons && goldenGatePylons.length > 0) ? goldenGatePylons[bData.pylonTargetIndex] : null;
                    if (pylon && pylon.crystal) {
                        pylon.crystal.getWorldPosition(_spinalTargetWorld);
                    } else if (pylon && pylon.group) {
                        pylon.group.getWorldPosition(_spinalTargetWorld);
                    } else if (ancientGoldenGate) {
                        ancientGoldenGate.getWorldPosition(_spinalTargetWorld);
                    } else {
                        _spinalTargetWorld.copy(craterWorldPos);
                    }

                    // Vector from middle of capital ship to target on Titan
                    _spinalBeamVec.subVectors(_spinalTargetWorld, _spinalShipCenterWorld);
                    const beamDist = _spinalBeamVec.length();
                    _spinalBeamDir.copy(_spinalBeamVec).normalize();

                    // Midpoint between ship center and ring on Titan
                    _spinalMidPoint.addVectors(_spinalShipCenterWorld, _spinalTargetWorld).multiplyScalar(0.5);

                    // Position beam group EXACTLY at the midpoint
                    bData.group.position.copy(_spinalMidPoint);
                    // Direct +Y axis along the beam vector towards target
                    bData.group.quaternion.setFromUnitVectors(_spinalUnitY, _spinalBeamDir);
                    // Scale along Y to reach target distance (local y = -0.5 is ship center, local y = +0.5 is ring on Titan)
                    bData.group.scale.set(1, beamDist, 1);

                    // Pulse core & plasma thickness
                    const pulse = 1.0 + Math.sin(timeSec * 10.0 + bData.shipIndex * 1.5) * 0.15;
                    bData.core.scale.set(pulse, 1, pulse);
                    bData.plasma.scale.set(pulse * 1.1, 1, pulse * 1.1);
                    bData.cage.rotation.y += 0.02;

                    // Animate Traveling Energy Rings strictly along the shaft between ship center (y = -0.5) and ring on Titan (y = +0.5)
                    if (bData.rings) {
                        const invBeamDist = 1.0 / Math.max(1, beamDist);
                        bData.rings.forEach(ring => {
                            ring.visible = true;
                            if (isBombardmentFiring) {
                                // Purple bombardment energy streaming downward from ship to Titan
                                ring.userData.offset += timeDelta * 0.35;
                                if (ring.userData.offset > 1.0) ring.userData.offset -= 1.0;
                                ring.position.y = -0.5 + ring.userData.offset;
                                ring.material.color.setHex(0xd946ef); // Radiant Purple-Magenta Rings
                            } else if (isTractorFiring) {
                                // Gold tractor graviton rings streaming upward from Titan ring to ship
                                ring.userData.offset -= timeDelta * 0.35;
                                if (ring.userData.offset < 0.0) ring.userData.offset += 1.0;
                                ring.position.y = -0.5 + ring.userData.offset;
                                ring.material.color.setHex(0xfbbf24); // Radiant Gold Tractor Rings
                            }
                            const ringScale = 1.0 + Math.sin(timeSec * 6.0 + ring.userData.offset * Math.PI) * 0.25;
                            // Counteract parent beamGroup.scale.y (beamDist) so rings remain flat toruses rather than stretching thousands of units past both ends!
                            ring.scale.set(ringScale, invBeamDist, ringScale);
                        });
                    }

                    // Beam Color Configuration:
                    // First Beams (Bombardment): Intense Radiant Purple Dark-Energy Beams
                    // Second Beams (Tractor): Identical Beam Structure in Brilliant Radiant Gold
                    if (isBombardmentFiring) {
                        bData.core.material.color.setHex(0xfdf4ff);   // White-Violet Superheated Core
                        bData.plasma.material.color.setHex(0xa855f7); // Deep Radiant Imperial Purple
                        bData.cage.material.color.setHex(0xd946ef);   // Magenta/Violet Magnetic Confinement Cage
                        bData.flare.material.color.setHex(0x9333ea);  // Deep Purple Ventral Flare
                    } else if (isTractorFiring) {
                        bData.core.material.color.setHex(0xffffff);   // Brilliant White Core
                        bData.plasma.material.color.setHex(0xfbbf24); // Radiant Amber Precursor Gold
                        bData.cage.material.color.setHex(0xfef08a);   // Luminous Solar Gold Cage
                        bData.flare.material.color.setHex(0xf59e0b);  // Amber Gold Ventral Flare
                    }
                });
            }

            // 7. Update Audio Synthesizer
            updatePlanetaryExcavationAndTractorAudio(playerShip.position, timeSec);
        }

        let lastExcavationAudioTime = 0;
        function updatePlanetaryExcavationAndTractorAudio(playerPos, timeSec) {
            if (!audioCtx || audioCtx.state !== 'running' || isAudioMuted) return;
            if (!ancientGoldenGate || !isTitanExcavationStarted || titanExcavationPhase === 'WAITING_FOR_FLEET') return;

            const dist = playerPos.distanceTo(ancientGoldenGate.position);
            if (dist > 55000) return; // Audio distance falloff

            const now = audioCtx.currentTime;
            if (now - lastExcavationAudioTime < 0.25) return;
            lastExcavationAudioTime = now;

            const masterVol = (typeof gameVolumeConfig !== 'undefined') ? (gameVolumeConfig.master * gameVolumeConfig.firing) : 0.60;
            const distFactor = Math.max(0.1, 1.0 - (dist / 55000));
            const vol = masterVol * distFactor * 0.75;

            try {
                // Layer 1: Sub-bass Planetary Graviton Tractor Drone
                const subOsc = audioCtx.createOscillator();
                const subGain = audioCtx.createGain();
                subOsc.type = 'sine';
                const baseFreq = titanExcavationPhase === 'BOMBARDMENT' ? 38 : (titanExcavationPhase === 'TRACTOR_EXTRACTION' ? 52 : 44);
                subOsc.frequency.setValueAtTime(baseFreq, now);
                subOsc.frequency.linearRampToValueAtTime(baseFreq + 6, now + 0.25);
                subGain.gain.setValueAtTime(0.35 * vol, now);
                subGain.gain.linearRampToValueAtTime(0.01, now + 0.25);
                subOsc.connect(subGain);
                subGain.connect(audioCtx.destination);
                subOsc.start(now);
                subOsc.stop(now + 0.25);

                // Layer 2: Ethereal Ancient Golden Ring Resonant Chime (Pentatonic Overtones)
                if (Math.random() < 0.08 && titanExcavationPhase !== 'BOMBARDMENT') {
                    const chimeOsc = audioCtx.createOscillator();
                    const chimeGain = audioCtx.createGain();
                    chimeOsc.type = 'triangle';
                    const freqs = [587.33, 659.25, 880.00, 1046.50, 1174.66]; // D5, E5, A5, C6, D6
                    const f = freqs[Math.floor(Math.random() * freqs.length)];
                    chimeOsc.frequency.setValueAtTime(f, now);
                    chimeGain.gain.setValueAtTime(0.20 * vol, now);
                    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
                    chimeOsc.connect(chimeGain);
                    chimeGain.connect(audioCtx.destination);
                    chimeOsc.start(now);
                    chimeOsc.stop(now + 3.0);
                }
            } catch (e) {}
        }

        // Zero-Allocation Global Helper Vectors (Prevents Garbage Collection Stuttering & Hangs)
