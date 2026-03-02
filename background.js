// --- CONFIGURATION ---
const API_KEY = "RmL56FeSccbbNpOC1KIDrYozHSFmY5eD"; // ⚠️ METS TA CLÉ ICI (Pas l'ancienne)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "askMistral") {
        
        // Prompt système optimisé
        const systemPrompt = `Tu es WikiMind, une IA intégrée au navigateur.
        L'utilisateur est sur cette URL : ${request.url}
        Voici le contenu textuel brut de la page :
        ---
        ${request.context}
        ---
        Réponds à la question de l'utilisateur.
        Si la question porte sur la page, utilise le contenu ci-dessus.
        Si le contenu est vide ou illisible, dis-le poliment.
        Sois concis, direct et utile. Utilise du gras <b> pour les mots clés si besoin.`;

        // Appel API
        fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "mistral-tiny", // Ou "mistral-small" si tu veux plus intelligent
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: request.query }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.choices && data.choices.length > 0) {
                sendResponse({ success: true, data: data.choices[0].message.content });
            } else {
                console.error("Erreur API:", data);
                sendResponse({ success: false, error: "L'IA n'a pas répondu (Quota ou Erreur)." });
            }
        })
        .catch(error => {
            console.error("Erreur Fetch:", error);
            sendResponse({ success: false, error: "Erreur connexion internet." });
        });

        return true; // Indispensable pour l'asynchrone
    }
});