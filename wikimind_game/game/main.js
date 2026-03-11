import { signInAnonymously } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { auth } from '../firebase.js';
import { initEngine, startRenderLoop } from './engine.js';
import { initControls } from './controls.js';
import { initPlayer } from './player.js';
import { initMultiplayer } from './multiplayer.js';

document.getElementById('btn-play').addEventListener('click', () => {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';

    // 1. Initialiser la 3D
    const { scene, camera, renderer } = initEngine();
    
    // 2. Initialiser le joueur local (physique)
    initPlayer(camera, scene);
    
    // 3. Initialiser les contrôles (PC/Mobile)
    initControls(camera, renderer);

    // 4. Authentification et Multijoueur Firebase
    signInAnonymously(auth).then((userCredential) => {
        const playerId = userCredential.user.uid;
        initMultiplayer(scene, playerId);
    }).catch(err => console.error("Erreur Firebase:", err));

    // 5. Lancer la boucle de jeu
    startRenderLoop();
});