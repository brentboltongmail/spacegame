with open('index.html', 'r') as f:
    content = f.read()

target = "function createEpicPlayerDeathExplosion(pos) {"

restoration = """
        let explosionParticles = [];

        function spawnLaserImpactSparks(pos) {
            for (let i = 0; i < 14; i++) {
                const pGeo = new THREE.SphereGeometry(0.25, 8, 8);
                const pMat = new THREE.MeshBasicMaterial({ color: (i % 2 === 0) ? 0x00f0ff : 0xffffff });
                const p = new THREE.Mesh(pGeo, pMat);
                p.position.copy(pos);
                p.userData.vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 8
                );
                p.userData.life = 1.0;
                scene.add(p);
                explosionParticles.push(p);
            }
        }

        // Shared Geometries & Materials for Zero-Allocation Explosion FX
        const sharedExpParticleGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const sharedExpColors = [
            new THREE.MeshBasicMaterial({ color: 0xfbbf24 }),
            new THREE.MeshBasicMaterial({ color: 0xf97316 }),
            new THREE.MeshBasicMaterial({ color: 0xef4444 }),
            new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        ];

        const sharedRingGeo = new THREE.RingGeometry(1, 4, 128);
        sharedRingGeo.rotateX(Math.PI / 2);
        const sharedRingMat = new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide, transparent: true, opacity: 1.0 });

"""

content = content.replace(target, restoration + target)

with open('index.html', 'w') as f:
    f.write(content)
