import * as THREE from 'three';
import { updatePlayer } from './player.js';
import { updateMultiplayer } from './multiplayer.js';

export let scene, camera, renderer;

export function initEngine() {
    const container = document.getElementById('game-container');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Ciel
    scene.fog = new THREE.Fog(0x87CEEB, 10, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Lumière
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    // Map: Sol
    const textureLoader = new THREE.TextureLoader();
    // Plus tard on mettra une vraie texture de sable
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Map: Obstacles (Caisses)
    const boxGeo = new THREE.BoxGeometry(2, 2, 2);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    for(let i=0; i<20; i++) {
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set((Math.random()-0.5)*50, 1, (Math.random()-0.5)*50);
        scene.add(box);
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return { scene, camera, renderer };
}

export function startRenderLoop() {
    requestAnimationFrame(startRenderLoop);
    
    updatePlayer(); // Physique locale
    updateMultiplayer(); // Interpolation des ennemis
    
    renderer.render(scene, camera);
}