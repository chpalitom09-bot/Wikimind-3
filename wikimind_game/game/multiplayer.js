import * as THREE from 'three';
import { db } from '../firebase.js';
import { doc, setDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

let localId = null;
const players = {}; 
const matchId = "wikimind_dust2";
let lastSyncTime = 0;

export function initMultiplayer(scene, playerId) {
    localId = playerId;

    // Écouter les ennemis
    const playersRef = collection(db, "matches", matchId, "players");
    onSnapshot(playersRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const id = change.doc.id;

            if (id === localId) return;

            if (change.type === "added") {
                // Modèle Ennemi (Un cube rouge pour l'instant, on mettra un vrai modèle 3D plus tard)
                const geo = new THREE.BoxGeometry(1, 2, 1);
                const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
                const mesh = new THREE.Mesh(geo, mat);
                scene.add(mesh);
                players[id] = { mesh, targetPos: new THREE.Vector3(data.x, data.y, data.z) };
            }
            if (change.type === "modified") {
                if (players[id]) {
                    players[id].targetPos.set(data.x, data.y, data.z);
                    players[id].mesh.rotation.y = data.ry; // Rotation du corps
                }
            }
            if (change.type === "removed") {
                scene.remove(players[id].mesh);
                delete players[id];
            }
        });
    });
}

export function updateFirebasePosition(pos, rotationY) {
    if (!localId) return;

    const now = Date.now();
    // Limite à 5 requêtes par seconde pour sauver le quota gratuit de Firebase (200ms)
    if (now - lastSyncTime > 200) { 
        lastSyncTime = now;
        const playerDoc = doc(db, "matches", matchId, "players", localId);
        setDoc(playerDoc, {
            x: pos.x,
            y: pos.y - 0.8, // Centrer le cube ennemi
            z: pos.z,
            ry: rotationY,
            timestamp: now
        }, { merge: true });
    }
}

export function updateMultiplayer() {
    // Interpolation linéaire (Lerp) pour fluidifier les mouvements des ennemis à l'écran
    for (let id in players) {
        players[id].mesh.position.lerp(players[id].targetPos, 0.15);
    }
}

export function getLocalPlayerId() {
    return localId;
}
