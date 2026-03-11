import * as THREE from 'three';
import { input, look } from './controls.js';
import { getLocalPlayerId, updateFirebasePosition } from './multiplayer.js';

let camera, scene;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const speed = 10.0;
let canJump = true;

export function initPlayer(cam, scn) {
    camera = cam;
    scene = scn;
    camera.position.set(0, 1.6, 5); // Hauteur des yeux
}

export function updatePlayer() {
    if (!camera) return;

    // Appliquer la rotation de la caméra
    camera.rotation.order = 'YXZ';
    camera.rotation.y = look.yaw;
    camera.rotation.x = look.pitch;

    // Calcul de la direction (Basé sur le clavier pour l'instant)
    direction.z = Number(input.forward) - Number(input.backward);
    direction.x = Number(input.right) - Number(input.left);
    direction.normalize();

    // Application du mouvement par rapport à la vue de la caméra
    if (input.forward || input.backward) velocity.z -= direction.z * speed * 0.016;
    if (input.left || input.right) velocity.x -= direction.x * speed * 0.016;

    // Friction
    velocity.x -= velocity.x * 10.0 * 0.016;
    velocity.z -= velocity.z * 10.0 * 0.016;

    // Appliquer vélocité (Mouvement Local)
    camera.translateX(velocity.x);
    camera.translateZ(velocity.z);

    // Gravité simple
    if (camera.position.y > 1.6) {
        camera.position.y -= 0.1;
    } else {
        camera.position.y = 1.6;
        canJump = true;
    }

    if (input.jump && canJump) {
        camera.position.y += 2;
        canJump = false;
    }

    // Envoi de la position à Firebase
    updateFirebasePosition(camera.position, camera.rotation.y);
}