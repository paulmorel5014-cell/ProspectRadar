# ProspectRadar AI 🚀

ProspectRadar AI est une plateforme intelligente de prospection commerciale. Elle permet de scanner des entreprises locales, d'analyser leur présence digitale via l'IA (Gemini) et de générer des audits de performance avec calcul de ROI.

## 🌟 Fonctionnalités

- **Scan Localisé** : Recherche d'entreprises par ville et catégorie (API Google Maps).
- **Audit IA** : Analyse automatique du site web, SEO, design et performance mobile.
- **Calculateur de ROI** : Estimation des pertes annuelles dues à une mauvaise présence digitale.
- **Génération de Mockups** : Aperçu visuel d'un site web modernisé.
- **Suivi Commercial** : Gestion du pipeline (À contacter, En cours, Gagné, Perdu).
- **Export PDF** : Rapports d'audit professionnels prêts à envoyer.

## 🛠️ Installation Locale

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd prospectradar-ai
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   Créez un fichier `.env` à la racine (voir section Variables d'Environnement).

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

## 📁 Structure du Projet

```text
src/
  components/         # Composants UI réutilisables (Button, Card, Modal)
  config/             # Configuration centralisée (Firebase, API)
  features/           # Logique métier découpée par domaine
    auth/             # Authentification Firebase
    dashboard/        # Vue d'ensemble et statistiques
    prospects/        # Gestion des prospects et audits
    analytics/        # Graphiques et rapports
    map/              # Visualisation géographique (D3.js)
  hooks/              # Hooks React personnalisés
  services/           # Couche d'abstraction des appels API
  utils/              # Fonctions d'aide (formatage, calculs)
  types/              # Définitions TypeScript
```

## 🔑 Variables d'Environnement (.env)

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Clé API Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domaine d'authentification Firebase |
| `VITE_FIREBASE_PROJECT_ID` | ID du projet Firebase |
| `GEMINI_API_KEY` | Clé API Google Gemini (IA) |
| `GOOGLE_MAPS_API_KEY` | Clé API Google Maps (Places) |

## 🚀 Scalabilité

L'architecture est pensée pour supporter une montée en charge progressive :
- **Feature-based structure** pour faciliter le travail en équipe.
- **Lazy loading** des composants lourds (Map, Charts).
- **Centralized Config** pour une maintenance simplifiée.
