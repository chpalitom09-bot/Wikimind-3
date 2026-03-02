// Fonction principale d'initialisation
const initWikiMind = () => {
    // Vérifier si déjà injecté pour éviter les doublons
    if (document.getElementById('wikimind-float-btn')) return;

    // 1. Création du bouton "W"
    const btn = document.createElement('div');
    btn.id = 'wikimind-float-btn';
    btn.innerHTML = '<span>W</span>'; // La lettre W
    btn.title = "Ouvrir WikiMind AI";
    document.body.appendChild(btn);

    // 2. Création de la fenêtre
    const chat = document.createElement('div');
    chat.id = 'wikimind-chat-window';
    chat.innerHTML = `
        <div class="wm-header">
            <span class="wm-title">WikiMind AI</span>
            <span class="wm-status">● Ready</span>
        </div>
        <div class="wm-messages" id="wm-messages">
            <div class="wm-msg wm-bot">
                <strong>Bonjour.</strong><br>
                Je suis prêt à analyser cette page. Cliquez sur "Analyser" ou posez une question.
            </div>
        </div>
        <div class="wm-input-area">
            <input type="text" id="wm-input" placeholder="Posez une question sur la page..." autocomplete="off">
            <button id="wm-send">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"></path></svg>
            </button>
        </div>
    `;
    document.body.appendChild(chat);

    // Éléments DOM
    const messagesBox = document.getElementById('wm-messages');
    const input = document.getElementById('wm-input');
    const sendBtn = document.getElementById('wm-send');
    let pageContext = "";

    // Fonction pour récupérer le texte proprement
    const getPageContent = () => {
        // Essayer de prendre le texte principal selon le site
        let text = document.body.innerText || document.body.textContent;
        
        // Nettoyage basique (supprimer les trop gros espaces)
        text = text.replace(/\s+/g, ' ').trim();
        
        // Limite pour Mistral (environ 15 000 caractères pour être sûr)
        return text.substring(0, 15000);
    };

    // Ouvrir / Fermer
    btn.addEventListener('click', () => {
        const isOpen = chat.classList.contains('open');
        if (!isOpen) {
            chat.classList.add('open');
            input.focus();
            
            // Capture du contenu actuel
            pageContext = getPageContent();
            console.log("WikiMind: Contenu capturé (" + pageContext.length + " caractères)");
        } else {
            chat.classList.remove('open');
        }
    });

    // Envoyer
    const sendMessage = () => {
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        input.value = '';
        const loadingId = addSystemMessage("Analyse en cours...");

        // Envoi au background script
        chrome.runtime.sendMessage({
            action: "askMistral",
            context: pageContext,
            query: text,
            url: window.location.href // On envoie aussi l'URL au cas où
        }, (response) => {
            const loader = document.getElementById(loadingId);
            if(loader) loader.remove();

            if (chrome.runtime.lastError) {
                 addMessage("Erreur extension : Rechargez la page.", 'bot');
            } else if (response && response.success) {
                addMessage(response.data, 'bot');
            } else {
                addMessage("Erreur : " + (response ? response.error : "Inconnue"), 'bot');
            }
            scrollToBottom();
        });
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    function scrollToBottom() {
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }
};

function addMessage(text, type) {
    const div = document.createElement('div');
    div.className = `wm-msg wm-${type}`;
    // Si c'est le bot, on autorise un peu de HTML (pour le gras/italique)
    if(type === 'bot') div.innerHTML = text.replace(/\n/g, '<br>');
    else div.innerText = text;
    
    document.getElementById('wm-messages').appendChild(div);
    const box = document.getElementById('wm-messages');
    box.scrollTop = box.scrollHeight;
}

function addSystemMessage(text) {
    const id = "sys-" + Math.random().toString(36).substr(2, 9);
    const div = document.createElement('div');
    div.id = id;
    div.style.textAlign = "center";
    div.style.fontSize = "12px";
    div.style.color = "#888";
    div.style.margin = "10px 0";
    div.innerText = text;
    document.getElementById('wm-messages').appendChild(div);
    return id;
}

// Lancement au chargement complet
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWikiMind);
} else {
    initWikiMind();
}