import { GoogleGenAI } from "@google/genai";
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Prospect } from '../types';

export const handleAudit = async (
  id: string, 
  prospects: Prospect[], 
  userUid: string,
  addNotification: (msg: string, type?: 'success' | 'info') => void,
  setAuditingId: (id: string | null) => void,
  setActiveView: (view: any) => void
) => {
  const prospect = prospects.find(p => p.id === id);
  if (!prospect) return;

  if (window.aistudio?.hasSelectedApiKey) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      alert("Veuillez configurer votre clé API Gemini dans l'onglet Configuration avant de lancer un audit.");
      setActiveView('settings');
      return;
    }
  }

  setAuditingId(id);
  try {
    const prompt = `
      RÔLE : Expert en Croissance Digitale & Lead UI/UX.
      Ton objectif est de générer une proposition commerciale "Clé en main" ultra-convaincante.
      
      INFOS PROSPECT :
      Nom: ${prospect.name}
      Ville: ${prospect.city}
      Catégorie: ${prospect.category}
      Site Web: ${prospect.website || "AUCUN (Priorité maximale : Création de site)"}
      
      CONSIGNES D'AUDIT :
      1. ANALYSE DE SANTÉ DIGITALE (digital_health_score) :
         - Si AUCUN site : Score entre 5 et 15.
         - Si site HTTP (non sécurisé) : Score entre 30 et 45.
         - Si site HTTPS mais design daté : Score entre 50 et 70.
         - Si site moderne et rapide : Score > 80.
      
      2. PERFORMANCE & SEO :
         - Simule des scores PageSpeed réels (Mobile/Desktop).
         - Identifie 3 erreurs critiques (ex: LCP trop long, absence de balises Alt, pas de Sitemap).
      
      3. MAQUETTE (mockup_html) :
         - Génère un document HTML COMPLET et VALIDE (incluant <!DOCTYPE html>, <html>, <head>, <body>).
         - Utilise EXCLUSIVEMENT Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>).
         - Le design doit être ultra-moderne, "Apple-like", avec des dégradés subtils, du flou (backdrop-blur), et une typographie soignée (Inter/sans-serif).
         - Inclus une barre de navigation fixe, une section Hero percutante avec un bouton d'appel à l'action (CTA) brillant, une section "Nos Services" avec des icônes Lucide (simulées en SVG ou texte), et un pied de page élégant.
         - Assure-toi que le code est auto-suffisant, responsive, et prêt à être affiché dans une iframe.
      
      4. EMAIL DE PROSPECTION :
         - Doit être court, percutant, et centré sur le ROI.
         - Utilise le lien de preview : ${window.location.origin}/preview/${prospect.id}

      Réponds EXCLUSIVEMENT en JSON valide :
      {
        "digital_health_score": number (0-100),
        "summary": "string (max 200 chars)",
        "seo_score": number,
        "seo_details": "string",
        "performance_critique": "string",
        "current_performance_score": number,
        "new_performance_score": number,
        "annual_loss": number,
        "loss_details": "string",
        "email_draft": "string",
        "mockup_html": "string",
        "style_variant": "string",
        "primary_color": "string",
        "secondary_color": "string",
        "mailto_link": "string",
        "gmail_link": "string",
        "suggested_emails": ["string"]
      }
    `;

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    if (!apiKey) {
      alert("Clé API Gemini manquante. Veuillez la configurer dans l'onglet Configuration.");
      setActiveView('settings');
      return;
    }
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    if (!response.text) {
      throw new Error("L'IA n'a pas renvoyé de réponse valide.");
    }

    let jsonStr = response.text.trim();
    if (jsonStr.includes("```json")) {
      jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
    } else if (jsonStr.includes("```")) {
      jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
    }

    const auditData = JSON.parse(jsonStr || "{}");
    // Map digital_health_score to opportunity_score for the dashboard
    const finalScore = auditData.digital_health_score !== undefined ? auditData.digital_health_score : 50;

    const prospectRef = doc(db, `users/${userUid}/prospects`, id);
    await updateDoc(prospectRef, {
      audit_json: JSON.stringify(auditData),
      opportunity_score: finalScore
    });

    if (auditData.mockup_html) {
      const previewUrl = `${window.location.origin}/preview/${id}`;
      auditData.email_draft = `${auditData.email_draft}\n\nVoir la maquette interactive : ${previewUrl}`;
      
      const subject = `Proposition de refonte digitale pour ${prospect.name}`;
      const body = auditData.email_draft;
      auditData.mailto_link = `mailto:${prospect.email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      auditData.gmail_link = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(prospect.email || "")}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      await setDoc(doc(db, 'public_previews', id), {
        prospectId: id,
        name: prospect.name,
        mockup_html: auditData.mockup_html,
        created_at: new Date().toISOString()
      });
      
      await updateDoc(prospectRef, {
        audit_json: JSON.stringify(auditData)
      });
    }
    
    addNotification('Audit IA terminé avec succès !', 'success');
  } catch (err: any) {
    console.error(err);
    if (err.message?.includes('API key not valid')) {
      alert("Clé API Gemini invalide. Veuillez la reconfigurer dans l'onglet Configuration.");
      setActiveView('settings');
    } else {
      alert("L'audit IA a échoué. Vérifiez votre connexion ou votre clé API.");
    }
  } finally {
    setAuditingId(null);
  }
};

export const findEmails = async (
  prospect: Prospect,
  userUid: string,
  addNotification: (msg: string, type?: 'success' | 'info') => void
) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  if (!apiKey) return;

  const ai = new GoogleGenAI({ apiKey });
  try {
    const prompt = `Trouve des adresses email de contact ou de décideurs pour l'entreprise "${prospect.name}" située à "${prospect.city}". 
    Domaine possible : ${prospect.website || "Inconnu"}.
    Réponds uniquement avec une liste d'emails séparés par des virgules, ou "Aucun" si tu ne trouves rien.
    Utilise tes outils de recherche si nécessaire.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const emails = response.text.trim();
    if (emails && emails !== "Aucun") {
      const emailList = emails.split(',').map(e => e.trim()).filter(e => e.includes('@'));
      if (emailList.length > 0) {
        const prospectRef = doc(db, `users/${userUid}/prospects`, prospect.id);
        await updateDoc(prospectRef, {
          email: emailList[0]
        });
        addNotification(`Email trouvé : ${emailList[0]}`, 'success');
        return emailList;
      }
    }
    addNotification("Aucun email trouvé via l'enrichissement.", 'info');
  } catch (err) {
    console.error("Email enrichment error:", err);
  }
};
