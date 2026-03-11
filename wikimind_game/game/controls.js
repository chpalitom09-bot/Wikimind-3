import * as THREE from 'three';

export const input = { forward: false, backward: false, left: false, right: false, jump: false };
export const look = { yaw: 0, pitch: 0 }; // Rotation caméra

export function initControls(camera, renderer) {
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

    if (isMobile) {
        setupMobileControls();
    } else {
        setupPCControls(renderer);
    }
}

function setupPCControls(renderer) {
    // Verrouillage de la souris (PointerLock)
    document.body.addEventListener('click', () => {
        document.body.requestPointerLock();
    });

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            look.yaw -= e.movementX * 0.002;
            look.pitch -= e.movementY * 0.002;
            look.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, look.pitch));
        }
    });

    // ZQSD / WASD
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyW') input.forward = true;
        if (e.code === 'KeyS') input.backward = true;
        if (e.code === 'KeyA') input.left = true;
        if (e.code === 'KeyD') input.right = true;
        if (e.code === 'Space') input.jump = true;
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW') input.forward = false;
        if (e.code === 'KeyS') input.backward = false;
        if (e.code === 'KeyA') input.left = false;
        if (e.code === 'KeyD') input.right = false;
        if (e.code === 'Space') input.jump = false;
    });
}

function setupMobileControls() {
    // Afficher l'UI mobile
    document.getElementById('joystick-base').style.display = 'block';
    document.getElementById('btn-shoot').style.display = 'block';
    document.getElementById('btn-jump').style.display = 'block';

    // Logique du joystick (très basique pour l'instant) à améliorer plus tard
    // Note : on implémentera le vrai calcul vectoriel du joystick au prochain chapitre
}