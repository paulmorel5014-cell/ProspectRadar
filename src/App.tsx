import React, { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { cn } from './lib/utils';
import { 
  Search, 
  MapPin, 
  Globe, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  LayoutDashboard, 
  Users, 
  Settings,
  ChevronRight,
  ExternalLink,
  Zap,
  MessageSquare,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Trash2,
  Moon,
  Sun,
  Map as MapIcon,
  Bell,
  Mail,
  Copy,
  Check,
  Menu,
  FileText,
  Link,
  Tag,
  Plus
} from 'lucide-react';
import * as d3 from 'd3';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { Prospect, AuditData } from './types';
import { auth, isFirebaseConfigured, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  getDoc,
  getDocFromServer,
  Timestamp
} from 'firebase/firestore';
import { LogOut, LogIn, UserPlus } from 'lucide-react';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

function FranceMap({ prospects, darkMode }: { prospects: Prospect[], darkMode: boolean }) {
  const svgRef = React.useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 600;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Projection for France
    const projection = d3.geoConicConformal()
      .center([2.454071, 46.279229])
      .scale(2600)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Load GeoJSON for France departments
    fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson')
      .then(res => res.json())
      .then(data => {
        svg.append("g")
          .selectAll("path")
          .data(data.features)
          .enter()
          .append("path")
          .attr("d", path as any)
          .attr("fill", darkMode ? "#1e293b" : "#f1f5f9")
          .attr("stroke", darkMode ? "#334155" : "#cbd5e1")
          .attr("stroke-width", 0.5);

        // Group prospects by city to show bubbles
        const cityGroups = d3.groups(prospects, d => d.city);
        
        // We need coordinates for cities. Since we don't have them in the DB, 
        // we'll use a simple mock mapping for common French cities or just use the first prospect's address if we could geocode it.
        // For this demo, let's try to extract some known cities or just show a few points if we had coords.
        // REAL implementation would use a geocoding service.
        // MOCK: Mapping some cities to coordinates
        const cityCoords: Record<string, [number, number]> = {
          'Paris': [2.3522, 48.8566],
          'Lyon': [4.8357, 45.7640],
          'Marseille': [5.3698, 43.2965],
          'Lille': [3.0573, 50.6292],
          'Bordeaux': [-0.5792, 44.8378],
          'Nantes': [-1.5536, 47.2184],
          'Strasbourg': [7.7521, 48.5734],
          'Montpellier': [3.8767, 43.6108],
          'Toulouse': [1.4442, 43.6047],
          'Nice': [7.2620, 43.7102],
          'Rennes': [-1.6778, 48.1173],
          'Reims': [4.0331, 49.2583],
          'Saint-Étienne': [4.3873, 45.4397],
          'Toulon': [5.9278, 43.1242],
          'Le Havre': [0.1077, 49.4944],
          'Grenoble': [5.7245, 45.1885],
          'Dijon': [5.0415, 47.3220],
          'Angers': [-0.5508, 47.4784],
          'Villeurbanne': [4.8814, 45.7719],
          'Le Mans': [0.1996, 48.0061]
        };

        const points = cityGroups.map(([city, items]) => {
          const coords = cityCoords[city] || [2.3522 + (Math.random() - 0.5) * 5, 48.8566 + (Math.random() - 0.5) * 5]; // Fallback to random near Paris
          return {
            city,
            count: items.length,
            coords
          };
        });

        const radiusScale = d3.scaleSqrt()
          .domain([0, d3.max(points, d => d.count) || 10])
          .range([5, 20]);

        const bubbles = svg.append("g")
          .selectAll("circle")
          .data(points)
          .enter()
          .append("circle")
          .attr("cx", d => projection(d.coords as [number, number])![0])
          .attr("cy", d => projection(d.coords as [number, number])![1])
          .attr("r", d => radiusScale(d.count))
          .attr("fill", "#6366f1")
          .attr("fill-opacity", 0.6)
          .attr("stroke", "#4f46e5")
          .attr("stroke-width", 1);

        bubbles.append("title")
          .text(d => `${d.city}: ${d.count} prospects`);
          
        // Add labels for larger points
        svg.append("g")
          .selectAll("text")
          .data(points.filter(d => d.count > 0))
          .enter()
          .append("text")
          .attr("x", d => projection(d.coords as [number, number])![0])
          .attr("y", d => projection(d.coords as [number, number])![1] - radiusScale(d.count) - 5)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("font-weight", "bold")
          .attr("fill", darkMode ? "#94a3b8" : "#475569")
          .text(d => d.city);
      });
  }, [prospects, darkMode]);

  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).selectAll("path")
      .transition().duration(300)
      .attr("fill", darkMode ? "#1e293b" : "#f1f5f9")
      .attr("stroke", darkMode ? "#334155" : "#cbd5e1");
    
    d3.select(svgRef.current).selectAll("text")
      .transition().duration(300)
      .attr("fill", darkMode ? "#94a3b8" : "#475569");
  }, [darkMode]);

  return (
    <svg 
      ref={svgRef} 
      width="100%" 
      height="100%" 
      viewBox="0 0 600 600" 
      preserveAspectRatio="xMidYMid meet"
      className="max-w-full max-h-full"
    />
  );
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        onLogin(userCredential.user);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLogin(userCredential.user);
      }
    } catch (err: any) {
      if (err.code === 'auth/configuration-not-found') {
        setError("La méthode de connexion Email/Mot de passe n'est pas activée dans votre console Firebase (Authentication > Sign-in method).");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Identifiants incorrects ou compte inexistant. Si c'est votre première visite, cliquez sur 'S'inscrire' ci-dessous.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none mb-4">
            <Zap className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">ProspectRadar AI</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {isSignUp ? "Créez votre compte pour commencer" : "Connectez-vous à votre tableau de bord"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 transition-all"
              placeholder="votre@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mot de passe</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />)}
            {isSignUp ? "S'inscrire" : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {isSignUp ? "Déjà un compte ? Connectez-vous" : "Pas encore de compte ? Inscrivez-vous"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [city, setCity] = useState(() => localStorage.getItem('lastCity') || '');
  const [category, setCategory] = useState(() => localStorage.getItem('lastCategory') || '');
  const [companyName, setCompanyName] = useState('');
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [auditingId, setAuditingId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      addNotification('Déconnecté avec succès', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const [activeView, setActiveView] = useState<'dashboard' | 'prospects' | 'analytics' | 'settings' | 'map'>(() => (localStorage.getItem('lastView') as any) || 'dashboard');
  const [showNavDropdown, setShowNavDropdown] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>(() => localStorage.getItem('filterStatus') || 'all');
  const [tagFilter, setTagFilter] = useState<string>(() => localStorage.getItem('tagFilter') || 'all');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'urgent' | 'optimize' | 'good'>(() => (localStorage.getItem('scoreFilter') as any) || 'all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(() => (localStorage.getItem('sortOrder') as any) || 'asc');
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('searchTerm') || '');
  const [hasGeminiKey, setHasGeminiKey] = useState(true);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'info' }[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });
  const [newTag, setNewTag] = useState('');
  const [detailTab, setDetailTab] = useState<'audit' | 'mockup' | 'roi'>('audit');
  const [isPreviewMode] = useState(window.location.pathname.startsWith('/preview/'));
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return saved === 'true';
      
      // Automatic based on time if no preference
      const hour = new Date().getHours();
      return hour < 6 || hour >= 18; // Night between 18:00 and 06:00
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('lastCity', city);
  }, [city]);

  useEffect(() => {
    localStorage.setItem('lastCategory', category);
  }, [category]);

  useEffect(() => {
    localStorage.setItem('lastView', activeView);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem('filterStatus', filterStatus);
  }, [filterStatus]);

  useEffect(() => {
    localStorage.setItem('tagFilter', tagFilter);
  }, [tagFilter]);

  useEffect(() => {
    localStorage.setItem('scoreFilter', scoreFilter);
  }, [scoreFilter]);

  useEffect(() => {
    localStorage.setItem('sortOrder', sortOrder || 'asc');
  }, [sortOrder]);

  useEffect(() => {
    localStorage.setItem('searchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasGeminiKey(hasKey);
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    if (isPreviewMode) {
      const id = window.location.pathname.split('/preview/')[1];
      const fetchPreview = async () => {
        setPreviewLoading(true);
        try {
          const previewDoc = await getDoc(doc(db, 'public_previews', id));
          if (previewDoc.exists()) {
            setPreviewData(previewDoc.data());
          }
        } catch (err) {
          console.error(err);
        } finally {
          setPreviewLoading(false);
        }
      };
      fetchPreview();
    }
  }, [isPreviewMode]);

  useEffect(() => {
    if (!user) {
      setProspects([]);
      return;
    }

    // Test connection to Firestore
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    setLoading(true);
    const q = query(
      collection(db, `users/${user.uid}/prospects`),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Prospect[];
      setProspects(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error: ", error);
      addNotification("Erreur de synchronisation Firestore", "info");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addNotification = (message: string, type: 'success' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addNotification("Veuillez vous connecter pour scanner des prospects.", "info");
      return;
    }
    if (!companyName && (!city || !category)) return;
    setScanning(true);
    setLastError(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, category, companyName }),
      });
      const data = await res.json();
      if (data.error) {
        setLastError(data.error);
      } else {
        const newCount = data.length;
        if (newCount > 0) {
          addNotification(`${newCount} nouveau(x) prospect(s) trouvé(s) !`, 'success');
          // Save to Firestore
          for (const p of data) {
            const prospectRef = doc(db, `users/${user.uid}/prospects`, p.id);
            await setDoc(prospectRef, {
              ...p,
              uid: user.uid,
              created_at: new Date().toISOString()
            }, { merge: true });
          }
        } else {
          addNotification("Aucun nouveau prospect trouvé pour cette recherche.", 'info');
        }
        setCompanyName(''); // Reset search
      }
    } catch (err) {
      setLastError("Erreur de connexion au serveur.");
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const handleAudit = async (id: string) => {
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
        RÔLE : Ingénieur de Croissance & Lead Développeur UI/UX.
        Ton objectif est de générer une proposition commerciale "Clé en main" comprenant : un audit de performance, une maquette web haut de gamme et un e-mail de prospection prêt à l'envoi.

        INFOS COMMERCE :
        Nom: ${prospect.name}
        Ville: ${prospect.city}
        Catégorie: ${prospect.category}
        Email: ${prospect.email || "Non fourni (Laisse le destinataire vide dans le mailto)"}
        Site Web: ${prospect.website || "AUCUN (C'est ton angle d'attaque principal)"}
        Téléphone: ${prospect.phone || "Non fourni"}
        Adresse: ${prospect.address || "Non fournie"}
        Tags: ${Array.isArray(prospect.tags) ? prospect.tags.join(', ') : "Aucun"}

        IMPORTANT : Prends en compte les "Tags" fournis pour affiner ton audit. 
        Si des tags indiquent des besoins spécifiques (ex: "SEO urgent", "Design obsolète", "Besoin e-commerce"), ajuste le "digital_health_score" et le "opportunity_score" en conséquence. 
        Un tag comme "Priorité Haute" devrait augmenter l'urgence de l'opportunité.

        1. COMPOSANT "PERFORMANCE SHOCK"
        - Simule un test Google PageSpeed Insights.
        - Site Actuel : Score Rouge (env. 35/100). Critique : "Lenteur mobile", "Images non compressées".
        - Nouvelle Maquette : Score Vert (100/100). Mentionne : "Optimisation SEO native", "Chargement < 1s".

        2. MOTEUR DE DESIGN ADAPTATIF & MICRO-INTERACTIONS (STRATÉGIE "FULL-PREVIEW")
        Selon la catégorie (${prospect.category}), sélectionne UN style visuel spécifique :
        - STYLE "ELÉGANCE & SERIF" (Luxe, Beauté, Bien-être) : Playfair Display / Lato, larges espaces, bordures arrondies, ombres douces.
        - STYLE "INDUSTRIAL BOLD" (Artisans, Garage, BTP) : Montserrat Black / Inter, angles droits, sections asymétriques (skew-y), contrastes forts.
        - STYLE "AUTHENTIC ORGANIC" (Restauration, Boulangerie, Bio) : Fraunces / Quicksand, bordures irrégulières, arrière-plans texturés, cartes flottantes.
        
        INSTRUCTIONS TECHNIQUES POUR "mockup_html" :
        - Génère un bloc HTML/Tailwind UNIQUE et AUTO-CONTENU (incluant <html>, <head> avec CDN Tailwind/Google Fonts, et <body>).
        - Utilise exclusivement des CDN externes (Tailwind CSS, Google Fonts, Lucide Icons via script ou SVG).
        - OPTIMISATION CAPTURE (Fold) : Conçois le haut de la page (Hero section) pour qu'il soit percutant en format 1200x630px.
        - BADGE PERFORMANCE : Intègre en haut à droite un élément UI simulant le score "PageSpeed : 100/100" bien visible pour les captures d'écran.
        - Ajoute des animations hover:shadow-xl et un module de réservation/contact interactif.

        3. CALCUL DE ROI & MANQUE À GAGNER (STRICT)
        Calcule le préjudice financier annuel selon le secteur :
        - Restauration : Panier 25€ | Perte : 20 clients/mois.
        - Coiffure/Beauté : Panier 45€ | Perte : 12 clients/mois.
        - Artisanat : Panier 150€ | Perte : 5 clients/mois.
        - Boutique/Services : Panier 35€ | Perte : 15 clients/mois.
        - FORMULE : (Perte mensuelle * 12) * Panier Moyen = CA ANNUEL PERDU.

        4. GÉNÉRATION DU MAIL DE PROSPECTION "CONVERSION"
        Rédige un e-mail ultra-personnalisé :
        - Objet : Question sur l'optimisation de ${prospect.name} à ${prospect.city} (Important)
        - Corps : 
          1. Mentionne le CA perdu calculé. 
          2. Compare les scores de performance (35/100 vs 100/100). 
          3. INCLURE CETTE PHRASE EXACTE : "Ne vous contentez pas de me croire sur parole, j'ai mis en ligne une version interactive de votre futur site ici : ${window.location.origin}/preview/${prospect.id}"
          4. Propose un appel de 5 min.

        5. RÉSEAUX SOCIAUX & RÉPUTATION (NOUVEAU)
        - Évalue la présence sur Facebook, Instagram et LinkedIn.
        - Analyse la qualité et la quantité des avis clients (Google, etc.).
        - Vérifie la visibilité des infos de contact (téléphone, email) sur le site.
        - AJUSTEMENT DU SCORE : Ces facteurs doivent influencer le "digital_health_score" et le "opportunity_score". Un manque de présence sociale ou de mauvais avis augmentent l'opportunité de tes services.

        Réponds EXCLUSIVEMENT en JSON avec cette structure :
        {
          "mobile_friendly": boolean,
          "mobile_details": string,
          "design_quality": "Pauvre" | "Moyen" | "Excellent",
          "design_details": string,
          "seo_score": number (0-100),
          "seo_details": string,
          "summary": string (max 200 chars),
          "digital_health_score": number (0-100),
          "sales_message": string (pitch court axé sur la perte financière),
          "email_draft": string (email complet),
          "annual_loss": number (le CA annuel perdu calculé),
          "loss_details": string (explication du calcul ROI en 2 lignes),
          "mockup_html": string (le code HTML/Tailwind complet de la maquette),
          "primary_color": string (HEX),
          "secondary_color": string (HEX),
          "accent_color": string (HEX),
          "super_powers": string[],
          "style_variant": "elegance" | "industrial" | "organic",
          "current_performance_score": number (env 35),
          "new_performance_score": number (100),
          "performance_critique": string (ex: "Lenteur mobile, images non compressées"),
          "mailto_link": string (URL mailto: encodée avec destinataire=${prospect.email || ""}, subject et body basés sur l'email_draft),
          "gmail_link": string (URL directe Gmail web: https://mail.google.com/mail/?view=cm&fs=1&to=...&su=...&body=...),
          "social_media_details": string (analyse Facebook/Instagram/LinkedIn),
          "social_media_score": number (0-100),
          "reviews_details": string (analyse des avis clients),
          "reviews_score": number (0-100),
          "contact_visibility_details": string (analyse de la visibilité téléphone/email),
          "contact_visibility_score": number (0-100)
        }
      `;

      // 1. Generate audit via Netlify Function (Server-side)
      const auditRes = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: "gemini-3.1-pro-preview" }),
      });
      const auditResult = await auditRes.json();
      if (auditResult.error) throw new Error(auditResult.error);

      const auditData = JSON.parse(auditResult.text || "{}");
      const finalScore = auditData.digital_health_score !== undefined ? auditData.digital_health_score : prospect.opportunity_score;

      // 2. Save the result to Firestore
      const prospectRef = doc(db, `users/${user.uid}/prospects`, id);
      await updateDoc(prospectRef, {
        audit_json: JSON.stringify(auditData),
        opportunity_score: finalScore
      });

      // 3. Create public preview
      if (auditData.mockup_html) {
        try {
          const previewUrl = `${window.location.origin}/preview/${id}`;
          // Update the email draft to include the preview link
          auditData.email_draft = `${auditData.email_draft}\n\nVoir la maquette interactive : ${previewUrl}`;
          
          // Re-generate mailto and gmail links with the new draft
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
          
          // Update the prospect again with the enriched audit_json
          await updateDoc(prospectRef, {
            audit_json: JSON.stringify(auditData)
          });
        } catch (previewErr) {
          console.error("Error creating public preview:", previewErr);
        }
      }
      
      addNotification('Audit IA terminé avec succès !', 'success');
      if (selectedProspect?.id === id) {
        setSelectedProspect(prev => prev ? { ...prev, audit_json: JSON.stringify(auditData), opportunity_score: finalScore } : null);
      }
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

  const updateStatus = async (id: string, status: string) => {
    if (!user) return;
    try {
      const prospectRef = doc(db, `users/${user.uid}/prospects`, id);
      await updateDoc(prospectRef, { status });
      addNotification(`Statut mis à jour : ${status}`, 'success');
    } catch (err) {
      console.error(err);
      addNotification("Erreur lors de la mise à jour du statut", 'info');
    }
  };

  const updateFollowUpDate = async (id: string, date: string) => {
    if (!user) return;
    try {
      const prospectRef = doc(db, `users/${user.uid}/prospects`, id);
      await updateDoc(prospectRef, { follow_up_date: date });
      if (selectedProspect?.id === id) {
        setSelectedProspect(prev => prev ? { ...prev, follow_up_date: date } : null);
      }
      if (date) {
        addNotification(`Rappel défini pour le ${new Date(date).toLocaleDateString()}`, 'success');
      } else {
        addNotification(`Rappel supprimé`, 'info');
      }
    } catch (err) {
      console.error(err);
      addNotification("Erreur lors de la définition du rappel", 'info');
    }
  };

  const updateEmail = async (id: string, email: string) => {
    if (!user) return;
    try {
      const prospectRef = doc(db, `users/${user.uid}/prospects`, id);
      await updateDoc(prospectRef, { email });
      if (selectedProspect?.id === id) {
        setSelectedProspect(prev => prev ? { ...prev, email } : null);
      }
      addNotification('Email mis à jour !', 'success');
    } catch (err) {
      console.error(err);
      addNotification("Erreur lors de la mise à jour de l'email", 'info');
    }
  };

  const updateTags = async (id: string, tags: string[]) => {
    if (!user) return;
    try {
      const prospectRef = doc(db, `users/${user.uid}/prospects`, id);
      await updateDoc(prospectRef, { tags });
      if (selectedProspect?.id === id) {
        setSelectedProspect(prev => prev ? { ...prev, tags } : null);
      }
      addNotification("Tags mis à jour", 'success');
    } catch (err) {
      console.error(err);
      addNotification("Erreur lors de la mise à jour des tags", 'info');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setDeleteConfirm({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    const { id, name } = deleteConfirm;
    if (!user) return;
    try {
      const prospectRef = doc(db, `users/${user.uid}/prospects`, id);
      await deleteDoc(prospectRef);
      if (selectedProspect?.id === id) setSelectedProspect(null);
      addNotification(`Prospect "${name}" supprimé avec succès`, 'success');
    } catch (err) {
      console.error(err);
      addNotification("Erreur lors de la suppression", 'info');
    } finally {
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
    }
  };

  const exportAuditPDF = (prospect: Prospect) => {
    const audit: AuditData = JSON.parse(prospect.audit_json || '{}');
    if (!audit.summary) {
      addNotification('Veuillez d\'abord générer un audit IA.', 'info');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(99, 102, 241); // Indigo 500
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Rapport d\'Audit ProspectRadar', 20, 25);
    
    // Content
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.setFontSize(16);
    doc.text(prospect.name, 20, 55);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Adresse: ${prospect.address}`, 20, 62);
    doc.text(`Site Web: ${prospect.website || 'N/A'}`, 20, 67);
    doc.text(`Score d'opportunité: ${prospect.opportunity_score}/100`, 20, 72);
    
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.line(20, 80, pageWidth - 20, 80);
    
    // AI Summary
    doc.setFontSize(14);
    doc.setTextColor(99, 102, 241);
    doc.text('Résumé de l\'Audit IA', 20, 95);
    
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85); // Slate 700
    const summaryLines = doc.splitTextToSize(audit.summary, pageWidth - 40);
    doc.text(summaryLines, 20, 105);
    
    let currentY = 105 + (summaryLines.length * 7);
    
    // Details
    const addSection = (title: string, content: string, y: number) => {
      doc.setFontSize(12);
      doc.setTextColor(99, 102, 241);
      doc.text(title, 20, y);
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(content || 'Non analysé', pageWidth - 40);
      doc.text(lines, 20, y + 7);
      return y + 15 + (lines.length * 5);
    };
    
    currentY = addSection('Adapté Mobile', audit.mobile_details || (audit.mobile_friendly ? 'Oui' : 'Non'), currentY);
    currentY = addSection('Qualité du Design', audit.design_details || audit.design_quality || 'N/A', currentY);
    currentY = addSection('Score SEO Estimé', `${audit.seo_score}/100 - ${audit.seo_details || ''}`, currentY);
    
    if (audit.current_performance_score !== undefined) {
      currentY = addSection('Performance PageSpeed', `Site Actuel: ${audit.current_performance_score}/100 | Nouvelle Maquette: ${audit.new_performance_score}/100\nCritique: ${audit.performance_critique || 'N/A'}`, currentY);
    }

    if (audit.annual_loss) {
      currentY = addSection('Impact Financier Estimé', `Perte Annuelle: -${audit.annual_loss}€ / an\nDétails: ${audit.loss_details || 'N/A'}`, currentY);
    }
    
    // Email Draft
    if (audit.email_draft) {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.text('Email de Prospection Suggéré', 20, currentY);
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const emailLines = doc.splitTextToSize(audit.email_draft, pageWidth - 40);
      doc.text(emailLines, 20, currentY + 10);
    }
    
    doc.save(`Audit_${prospect.name.replace(/\s+/g, '_')}.pdf`);
    addNotification('Audit exporté en PDF !', 'success');
  };

  const exportToCSV = () => {
    if (prospects.length === 0) return;
    
    const headers = ['Nom', 'Adresse', 'Téléphone', 'Site Web', 'Ville', 'Catégorie', 'Score Opportunité', 'Statut'];
    const rows = prospects.map(p => [
      p.name,
      p.address,
      p.phone,
      p.website,
      p.city,
      p.category,
      p.opportunity_score,
      p.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `prospects_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    prospects.forEach(p => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [prospects]);

  const filteredProspects = useMemo(() => {
    let result = prospects.filter(p => {
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchesTag = tagFilter === 'all' || (Array.isArray(p.tags) && p.tags.includes(tagFilter));
      
      let matchesScore = true;
      if (scoreFilter === 'urgent') matchesScore = p.opportunity_score < 30;
      else if (scoreFilter === 'optimize') matchesScore = p.opportunity_score >= 30 && p.opportunity_score < 70;
      else if (scoreFilter === 'good') matchesScore = p.opportunity_score >= 70;

      const name = p.name || '';
      const city = p.city || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
      return matchesStatus && matchesSearch && matchesScore && matchesTag;
    });

    if (sortOrder) {
      result = [...result].sort((a, b) => {
        if (sortOrder === 'asc') return a.opportunity_score - b.opportunity_score;
        return b.opportunity_score - a.opportunity_score;
      });
    }

    return result;
  }, [prospects, filterStatus, tagFilter, searchTerm, scoreFilter, sortOrder]);

  const stats = useMemo(() => {
    const total = prospects.length;
    if (total === 0) return { urgent: 0, optimize: 0, good: 0, topCities: [], trends: [], cityDistribution: [] };
    
    const urgent = prospects.filter(p => p.opportunity_score < 30).length;
    const optimize = prospects.filter(p => p.opportunity_score >= 30 && p.opportunity_score < 70).length;
    const good = total - urgent - optimize;

    // City distribution
    const cityCounts = prospects.reduce((acc, p) => {
      acc[p.city] = (acc[p.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const cityDistribution = Object.entries(cityCounts)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value);

    const topCities = cityDistribution.slice(0, 5).map(c => [c.name, c.value]);

    // Trends over time (by day)
    const trendCounts = prospects.reduce((acc, p) => {
      const date = new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const trends = Object.entries(trendCounts)
      .map(([date, count]) => ({ date, count: Number(count) }))
      .sort((a, b) => {
        const partsA = a.date.split('/');
        const partsB = b.date.split('/');
        const da = Number(partsA[0]) || 0;
        const ma = Number(partsA[1]) || 0;
        const db = Number(partsB[0]) || 0;
        const mb = Number(partsB[1]) || 0;
        return ma !== mb ? ma - mb : da - db;
      });

    return { urgent, optimize, good, topCities, trends, cityDistribution };
  }, [prospects]);

  const chartData = [
    { name: 'Urgent (<30)', value: stats.urgent, color: '#ef4444' },
    { name: 'À optimiser (30-70)', value: stats.optimize, color: '#f59e0b' },
    { name: 'Correct (>70)', value: stats.good, color: '#10b981' },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl mb-6">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-4">Configuration Requise</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Firebase n'est pas encore configuré. Veuillez ajouter les clés API nécessaires dans le panneau <strong>Secrets</strong> d'AI Studio pour activer l'authentification.
          </p>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-left mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Variables manquantes :</p>
            <code className="text-[10px] text-indigo-600 dark:text-indigo-400 break-all">
              VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, ...
            </code>
          </div>
          <p className="text-xs text-slate-400">
            Consultez le fichier <code>.env.example</code> pour la liste complète.
          </p>
        </motion.div>
      </div>
    );
  }

  if (isPreviewMode) {
    if (previewLoading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 font-medium">Chargement de la maquette...</p>
          </div>
        </div>
      );
    }

    if (!previewData) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Maquette non trouvée</h1>
            <p className="text-slate-600 mb-8">
              L'aperçu demandé n'existe pas ou a expiré. Veuillez contacter votre conseiller.
            </p>
            <a 
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Retour à l'accueil
            </a>
          </div>
        </div>
      );
    }

    let html = previewData.mockup_html;
    if (html.includes("```html")) {
      html = html.split("```html")[1].split("```")[0];
    } else if (html.includes("```")) {
      const parts = html.split("```");
      if (parts.length >= 3) {
        html = parts[1];
      }
    }

    return (
      <div className="min-h-screen bg-white">
        <iframe 
          srcDoc={html} 
          className="w-full h-screen border-none"
          title={`Aperçu pour ${previewData.name}`}
        />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-bottom border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
            <Zap className="fill-indigo-600 dark:fill-indigo-400" size={24} />
            <span>ProspectRadar</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors",
              activeView === 'dashboard' ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveView('prospects')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors",
              activeView === 'prospects' ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Users size={20} />
            Mes Prospects
          </button>
          <button 
            onClick={() => setActiveView('analytics')}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2 rounded-lg font-medium transition-colors",
              activeView === 'analytics' ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <div className="flex items-center gap-3">
              <BarChart3 size={20} />
              Analyses
            </div>
          </button>
          <button 
            onClick={() => setActiveView('map')}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2 rounded-lg font-medium transition-colors",
              activeView === 'map' ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <div className="flex items-center gap-3">
              <MapIcon size={20} />
              Cartographie
            </div>
            <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase">Nouveau</span>
          </button>
          <button 
            onClick={() => setActiveView('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors",
              activeView === 'settings' ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Settings size={20} />
            Configuration
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user.email}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Utilisateur</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={20} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative md:hidden">
              <button 
                onClick={() => setShowNavDropdown(!showNavDropdown)}
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              >
                <Menu size={20} />
              </button>
              
              <AnimatePresence>
                {showNavDropdown && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowNavDropdown(false)}
                      className="fixed inset-0 z-40"
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-2"
                    >
                      {[
                        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'prospects', label: 'Mes Prospects', icon: Users },
                        { id: 'analytics', label: 'Analyses', icon: BarChart3 },
                        { id: 'map', label: 'Cartographie', icon: MapIcon },
                        { id: 'settings', label: 'Configuration', icon: Settings },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveView(item.id as any);
                            setShowNavDropdown(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                            activeView === item.id 
                              ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold" 
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                        >
                          <item.icon size={18} />
                          {item.label}
                        </button>
                      ))}
                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut size={18} />
                        Déconnexion
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Tableau de Bord de Prospection</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
              title={darkMode ? "Mode clair" : "Mode sombre"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="relative">
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              <Clock className="text-slate-400" size={20} />
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {activeView === 'dashboard' && (
            <>
              {/* Search Section */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                <form onSubmit={handleScan} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Zap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Nom d'entreprise (optionnel)" 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Ville (ex: Paris, Lyon...)" 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        required={!companyName}
                      />
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Secteur (ex: Coiffeur, Restaurant...)" 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        required={!companyName}
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={scanning}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {scanning ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                    {companyName ? "Analyser l'entreprise" : "Scanner le marché"}
                  </button>
                </form>
                
                {lastError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700"
                  >
                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                    <div className="text-sm">
                      <p className="font-bold">Erreur lors du scan :</p>
                      <p>{lastError}</p>
                    </div>
                  </motion.div>
                )}
                
                {/* Warning if API Key might be missing (based on a failed scan or check) */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                  <div className="text-xs text-blue-700 dark:text-blue-400">
                    <p className="font-bold mb-1">Configuration de la clé API :</p>
                    <p>Si le scan ne renvoie rien, assurez-vous d'avoir ajouté votre clé dans l'onglet <b>"Secrets"</b> (icône clé à gauche) sous le nom <code>GOOGLE_MAPS_API_KEY</code>.</p>
                  </div>
                </div>
              </section>

              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div 
                  onClick={() => setScoreFilter('urgent')} 
                  className={cn(
                    "p-6 rounded-2xl border cursor-pointer transition-all shadow-sm", 
                    scoreFilter === 'urgent' ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 ring-2 ring-red-100 dark:ring-red-900/30" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Urgent (Santé &lt; 30)</p>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.urgent}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Établissements avec présence critique</p>
                </div>
                <div 
                  onClick={() => setScoreFilter('optimize')} 
                  className={cn(
                    "p-6 rounded-2xl border cursor-pointer transition-all shadow-sm", 
                    scoreFilter === 'optimize' ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800 ring-2 ring-amber-100 dark:ring-amber-900/30" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">À optimiser (30-70)</p>
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.optimize}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Besoin d'amélioration SEO/Design</p>
                </div>
                <div 
                  onClick={() => setScoreFilter('good')} 
                  className={cn(
                    "p-6 rounded-2xl border cursor-pointer transition-all shadow-sm", 
                    scoreFilter === 'good' ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-100 dark:ring-emerald-900/30" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Correct (&gt; 70)</p>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.good}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Bonne présence numérique</p>
                </div>
              </div>

              {/* Reminders Section */}
              {prospects.some(p => p.follow_up_date) && (
                <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Bell size={18} className="text-indigo-500" />
                    Rappels de suivi à venir
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prospects
                      .filter(p => p.follow_up_date)
                      .sort((a, b) => new Date(a.follow_up_date!).getTime() - new Date(b.follow_up_date!).getTime())
                      .slice(0, 6)
                      .map(prospect => {
                        const isOverdue = new Date(prospect.follow_up_date!) < new Date();
                        return (
                          <div 
                            key={prospect.id}
                            onClick={() => setSelectedProspect(prospect)}
                            className={cn(
                              "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md flex items-start gap-3",
                              isOverdue 
                                ? "bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800/50" 
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700"
                            )}
                          >
                            <div className={cn(
                              "p-2 rounded-lg shrink-0",
                              isOverdue ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                            )}>
                              <Clock size={16} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{prospect.name}</h4>
                              <p className={cn(
                                "text-[10px] font-bold uppercase mt-1",
                                isOverdue ? "text-red-500" : "text-indigo-500"
                              )}>
                                {isOverdue ? "En retard depuis le" : "Prévu le"} {new Date(prospect.follow_up_date!).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                </section>
              )}

              {/* Stats & Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">Répartition de la Présence Numérique</h3>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                        <Tooltip 
                          cursor={{fill: darkMode ? '#1e293b' : '#f8fafc'}}
                          contentStyle={{
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            backgroundColor: darkMode ? '#0f172a' : '#fff',
                            color: darkMode ? '#fff' : '#000'
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          radius={[6, 6, 0, 0]}
                          onClick={(data) => {
                            if (data.name.includes('Urgent')) setScoreFilter('urgent');
                            else if (data.name.includes('optimiser')) setScoreFilter('optimize');
                            else setScoreFilter('good');
                          }}
                          className="cursor-pointer"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">Top Villes</h3>
                  <div className="flex-1 space-y-4">
                    {stats.topCities.length > 0 ? (
                      stats.topCities.map(([city, count]) => (
                        <div key={city} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-600">{city}</span>
                            <span className="text-slate-400">{count} prospects</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(Number(count) / prospects.length) * 100}%` }}
                              className="h-full bg-emerald-500"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                        Aucune donnée géographique
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setActiveView('analytics')}
                    className="mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1"
                  >
                    Voir toutes les analyses <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}

          {(activeView === 'dashboard' || activeView === 'prospects') && (
            /* List Section */
            <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                  {activeView === 'dashboard' ? 'Derniers Prospects Identifiés' : 'Tous mes Prospects'}
                </h3>
                  <div className="flex flex-wrap gap-2">
                    {scoreFilter !== 'all' && (
                      <button 
                        onClick={() => setScoreFilter('all')}
                        className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                      >
                        Filtre Score: {scoreFilter} <X size={12} />
                      </button>
                    )}
                    <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Rechercher..." 
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 w-40 text-slate-900 dark:text-slate-100"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select 
                    className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700 outline-none"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="Nouveau">Nouveau</option>
                    <option value="À contacter">À contacter</option>
                    <option value="En cours">En cours</option>
                    <option value="Gagné">Gagné</option>
                    <option value="Perdu">Perdu</option>
                  </select>
                  {allTags.length > 0 && (
                    <select 
                      className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700 outline-none"
                      value={tagFilter}
                      onChange={e => setTagFilter(e.target.value)}
                    >
                      <option value="all">Tous les tags</option>
                      {allTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  )}
                  <button 
                    onClick={exportToCSV}
                    className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Exporter CSV
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Établissement</th>
                      <th className="px-6 py-4 font-semibold">Présence Web</th>
                      <th 
                        className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                        onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      >
                        <div className="flex items-center gap-1">
                          Santé Numérique
                          <div className="flex flex-col opacity-30 group-hover:opacity-100">
                            <ChevronUp size={10} className={cn(sortOrder === 'asc' && "text-indigo-600 opacity-100")} />
                            <ChevronDown size={10} className={cn(sortOrder === 'desc' && "text-indigo-600 opacity-100")} />
                          </div>
                        </div>
                      </th>
                      <th className="px-6 py-4 font-semibold">Statut</th>
                      <th className="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <Loader2 className="animate-spin mx-auto text-indigo-500" size={32} />
                          <p className="mt-2 text-slate-400 text-sm">Chargement des prospects...</p>
                        </td>
                      </tr>
                    ) : filteredProspects.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <p className="text-slate-400 text-sm">Aucun prospect trouvé correspondant à vos critères.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredProspects.map(prospect => (
                        <motion.tr 
                          key={prospect.id} 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ 
                            scale: 1.005, 
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                            zIndex: 10
                          }}
                          whileTap={{ scale: 0.995 }}
                          className={cn(
                            "transition-all cursor-pointer border-l-4 relative",
                            selectedProspect?.id === prospect.id 
                              ? "bg-indigo-50/50 dark:bg-indigo-900/20 border-l-indigo-500 z-10" 
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-transparent"
                          )}
                          onClick={() => setSelectedProspect(prospect)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-slate-900 dark:text-slate-100">{prospect.name}</div>
                              {prospect.follow_up_date && (
                                <div className={cn(
                                  "p-1 rounded-full",
                                  new Date(prospect.follow_up_date) < new Date() ? "bg-red-100 dark:bg-red-900/30 text-red-500" : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500"
                                )} title={`Rappel: ${new Date(prospect.follow_up_date).toLocaleDateString()}`}>
                                  <Bell size={10} />
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin size={12} /> {prospect.city}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {prospect.website ? (
                              <div className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                prospect.website.startsWith('https') ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                              )}>
                                <Globe size={12} />
                                {prospect.website.replace('https://', '').replace('http://', '').split('/')[0]}
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                                <AlertCircle size={12} />
                                Aucun site web
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full rounded-full",
                                    prospect.opportunity_score < 30 ? "bg-red-500" : prospect.opportunity_score < 70 ? "bg-amber-500" : "bg-emerald-500"
                                  )}
                                  style={{ width: `${prospect.opportunity_score}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{prospect.opportunity_score}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select 
                              value={prospect.status}
                              onClick={e => e.stopPropagation()}
                              onChange={e => updateStatus(prospect.id, e.target.value)}
                              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                            >
                              <option value="Nouveau">Nouveau</option>
                              <option value="À contacter">À contacter</option>
                              <option value="En cours">En cours</option>
                              <option value="Gagné">Gagné</option>
                              <option value="Perdu">Perdu</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(prospect.id, prospect.name);
                                }}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all">
                                <ChevronRight size={18} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeView === 'analytics' && (
            <div className="space-y-8 pb-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Total Prospects</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{prospects.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Taux de Conversion</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {prospects.length > 0 ? Math.round((prospects.filter(p => p.status === 'Gagné').length / prospects.length) * 100) : 0}%
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Score Moyen</p>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {prospects.length > 0 ? Math.round(prospects.reduce((acc, p) => acc + p.opportunity_score, 0) / prospects.length) : 0}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Audits IA</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {prospects.filter(p => p.audit_json && JSON.parse(p.audit_json).summary).length}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <Clock size={20} className="text-indigo-500" />
                    Évolution des Acquisitions
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.trends}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <MapPin size={20} className="text-emerald-500" />
                    Distribution Géographique
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.cityDistribution} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={100} />
                        <Tooltip 
                          cursor={{ fill: darkMode ? '#1e293b' : '#f8fafc' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000' }}
                        />
                        <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {stats.topCities.map(([city, count]) => (
                      <div key={city} className="flex items-center justify-between text-[10px] bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400 font-medium truncate mr-2">{city}</span>
                        <span className="text-slate-900 dark:text-slate-100 font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <BarChart3 size={20} className="text-indigo-500" />
                    Répartition par Statut
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'À contacter', value: prospects.filter(p => p.status === 'À contacter').length },
                            { name: 'En cours', value: prospects.filter(p => p.status === 'En cours').length },
                            { name: 'Gagné', value: prospects.filter(p => p.status === 'Gagné').length },
                            { name: 'Perdu', value: prospects.filter(p => p.status === 'Perdu').length },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          <Cell fill="#6366f1" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#10b981" />
                          <Cell fill="#94a3b8" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            backgroundColor: darkMode ? '#0f172a' : '#fff',
                            color: darkMode ? '#fff' : '#000'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    {[
                      { label: 'À contacter', color: 'bg-[#6366f1]' },
                      { label: 'En cours', color: 'bg-[#f59e0b]' },
                      { label: 'Gagné', color: 'bg-[#10b981]' },
                      { label: 'Perdu', color: 'bg-[#94a3b8]' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", item.color)}></div>
                        <span className="text-xs text-slate-500 font-medium">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <Zap size={20} className="text-amber-500" />
                    Potentiel d'Opportunité
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <Tooltip 
                          cursor={{ fill: darkMode ? '#1e293b' : '#f8fafc' }}
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            backgroundColor: darkMode ? '#0f172a' : '#fff',
                            color: darkMode ? '#fff' : '#000'
                          }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'map' && (
            <div className="h-full flex flex-col space-y-6 pb-12">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <MapIcon className="text-indigo-600" />
                      Couverture Géographique
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Visualisation des zones prospectées en France</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Zones actives</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 relative bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                  <FranceMap prospects={prospects} darkMode={darkMode} />
                </div>
              </div>
            </div>
          )}

          {activeView === 'settings' && (
            <section className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                  <Settings className="text-indigo-600 dark:text-indigo-400" />
                  Configuration des Services
                </h2>
                
                <div className="space-y-8">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Google Maps API</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Utilisé pour scanner les établissements locaux.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Actif</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 italic">
                      Configuré via la variable d'environnement <code>GOOGLE_MAPS_API_KEY</code> dans les Secrets.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                          <Zap size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Gemini AI API</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Utilisé pour l'audit automatique et les messages de vente.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", hasGeminiKey ? "bg-emerald-500" : "bg-red-500")}></span>
                        <span className={cn("text-xs font-medium", hasGeminiKey ? "text-emerald-600" : "text-red-600")}>
                          {hasGeminiKey ? "Configuré" : "Non configuré"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        L'audit nécessite une clé API Gemini valide. Vous pouvez soit l'ajouter dans les <b>Secrets</b> (GEMINI_API_KEY), 
                        soit utiliser le sélecteur de clé ci-dessous.
                      </p>
                      
                      <button 
                        onClick={async () => {
                          if (window.aistudio?.openSelectKey) {
                            await window.aistudio.openSelectKey();
                            const hasKey = await window.aistudio.hasSelectedApiKey();
                            setHasGeminiKey(hasKey);
                          }
                        }}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Zap size={18} />
                        {hasGeminiKey ? "Changer la clé Gemini" : "Configurer la clé Gemini"}
                      </button>
                      
                      <p className="text-[10px] text-slate-400 text-center">
                        Note: Utilisez une clé d'un projet Google Cloud avec facturation activée pour les modèles Pro.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedProspect && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProspect(null)}
              className="fixed inset-0 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">Détail du Prospect</h2>
                <button onClick={() => setSelectedProspect(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Header Info */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedProspect.name}</h3>
                      <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin size={16} /> {selectedProspect.address}
                      </p>
                    </div>
                    <div className={cn(
                      "px-4 py-2 rounded-2xl text-white font-bold text-center",
                      selectedProspect.opportunity_score < 30 ? "bg-red-500" : selectedProspect.opportunity_score < 70 ? "bg-amber-500" : "bg-emerald-500"
                    )}>
                      <div className="text-xs opacity-80 uppercase tracking-tighter">Score</div>
                      <div className="text-2xl">{selectedProspect.opportunity_score}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl">
                      <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Téléphone</div>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                        <Phone size={14} className="text-indigo-500" />
                        {selectedProspect.phone || "Non renseigné"}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl">
                      <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Site Web</div>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium truncate">
                        <Globe size={14} className="text-indigo-500" />
                        {selectedProspect.website ? (
                          <a href={selectedProspect.website} target="_blank" rel="noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1">
                            Visiter <ExternalLink size={12} />
                          </a>
                        ) : "Aucun"}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl col-span-2">
                      <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Email</div>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                        <Mail size={14} className="text-indigo-500" />
                        <div className="flex-1 flex items-center gap-2">
                          <input 
                            type="email"
                            value={selectedProspect.email || ''}
                            onChange={(e) => updateEmail(selectedProspect.id, e.target.value)}
                            placeholder="Ajouter un email"
                            className="bg-transparent border-none p-0 focus:ring-0 text-sm w-full placeholder:text-slate-400"
                          />
                          {selectedProspect.email && (
                            <button 
                              onClick={() => {
                                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedProspect.email || '')}`;
                                window.open(gmailUrl, '_blank');
                              }}
                              className="p-1.5 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-sm"
                              title="Ouvrir dans Gmail"
                            >
                              <Globe size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Follow-up Reminder */}
                  <div className="p-4 bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/50 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-indigo-600 dark:text-indigo-400 uppercase font-bold flex items-center gap-1.5">
                        <Bell size={14} />
                        Rappel de suivi
                      </div>
                      {selectedProspect.follow_up_date && (
                        <button 
                          onClick={() => updateFollowUpDate(selectedProspect.id, '')}
                          className="text-[10px] text-red-500 hover:text-red-600 font-bold uppercase"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="date" 
                        value={selectedProspect.follow_up_date || ''}
                        onChange={(e) => updateFollowUpDate(selectedProspect.id, e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                      />
                      {selectedProspect.follow_up_date && (
                        <div className={cn(
                          "px-3 py-2 rounded-xl text-xs font-bold",
                          new Date(selectedProspect.follow_up_date) < new Date() 
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        )}>
                          {new Date(selectedProspect.follow_up_date) < new Date() ? "En retard" : "Prévu"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl">
                    <div className="text-xs text-slate-400 uppercase font-semibold mb-2 flex items-center gap-1.5">
                      <Tag size={14} className="text-indigo-500" />
                      Tags personnalisés
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Array.isArray(selectedProspect.tags) && selectedProspect.tags.length > 0 ? (
                        selectedProspect.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold rounded-lg flex items-center gap-1 group"
                          >
                            {tag}
                            <button 
                              onClick={() => {
                                const updatedTags = Array.isArray(selectedProspect.tags) ? selectedProspect.tags.filter(t => t !== tag) : [];
                                updateTags(selectedProspect.id, updatedTags);
                              }}
                              className="hover:text-red-500 transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Aucun tag défini</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Ajouter un tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTag.trim()) {
                            const currentTags = Array.isArray(selectedProspect.tags) ? selectedProspect.tags : [];
                            const updatedTags = [...currentTags, newTag.trim()];
                            updateTags(selectedProspect.id, Array.from(new Set(updatedTags)));
                            setNewTag('');
                          }
                        }}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                      />
                      <button 
                        onClick={() => {
                          if (newTag.trim()) {
                            const currentTags = Array.isArray(selectedProspect.tags) ? selectedProspect.tags : [];
                            const updatedTags = [...currentTags, newTag.trim()];
                            updateTags(selectedProspect.id, Array.from(new Set(updatedTags)));
                            setNewTag('');
                          }
                        }}
                        className="p-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => setDetailTab('audit')}
                    className={cn(
                      "flex-1 py-3 text-sm font-bold border-b-2 transition-all",
                      detailTab === 'audit' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Audit IA
                  </button>
                  <button 
                    onClick={() => setDetailTab('mockup')}
                    className={cn(
                      "flex-1 py-3 text-sm font-bold border-b-2 transition-all",
                      detailTab === 'mockup' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Maquette
                  </button>
                  <button 
                    onClick={() => setDetailTab('roi')}
                    className={cn(
                      "flex-1 py-3 text-sm font-bold border-b-2 transition-all",
                      detailTab === 'roi' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                  >
                    ROI & Vente
                  </button>
                </div>

                {/* Tab Content */}
                <div className="space-y-8">
                  {detailTab === 'audit' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <Zap size={18} className="text-indigo-500 fill-indigo-500" />
                          Audit IA ProspectRadar
                        </h4>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => exportAuditPDF(selectedProspect)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                            title="Exporter en PDF"
                          >
                            <FileText size={18} />
                          </button>
                          <button 
                            onClick={() => handleAudit(selectedProspect.id)}
                            disabled={auditingId === selectedProspect.id}
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50"
                          >
                            {auditingId === selectedProspect.id ? <Loader2 className="animate-spin" size={12} /> : <Clock size={12} />}
                            Relancer l'audit
                          </button>
                        </div>
                      </div>

                      {(() => {
                        const audit: AuditData = JSON.parse(selectedProspect.audit_json || '{}');
                        if (!audit.summary && auditingId !== selectedProspect.id) {
                          return (
                            <div className="p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-center">
                              <p className="text-indigo-700 dark:text-indigo-400 text-sm font-medium mb-4">L'audit IA n'a pas encore été effectué pour ce prospect.</p>
                              <button 
                                onClick={() => handleAudit(selectedProspect.id)}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50"
                              >
                                Lancer l'audit maintenant
                              </button>
                            </div>
                          );
                        }

                        if (auditingId === selectedProspect.id) {
                          return (
                            <div className="p-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                              <Loader2 className="animate-spin mx-auto text-indigo-500 mb-4" size={32} />
                              <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">Gemini analyse la présence numérique...</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-6">
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed italic">
                                "{audit.summary}"
                              </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                              <div className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl space-y-2">
                                <div className="flex items-center gap-3">
                                  {audit.mobile_friendly ? <CheckCircle2 className="text-emerald-500" size={20} /> : <AlertCircle className="text-red-500" size={20} />}
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Adapté Mobile</span>
                                </div>
                                {audit.mobile_details && <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{audit.mobile_details}</p>}
                              </div>

                              <div className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl space-y-2">
                                <div className="flex items-center gap-3">
                                  <div className={cn("w-3 h-3 rounded-full", audit.design_quality === 'Excellent' ? "bg-emerald-500" : audit.design_quality === 'Moyen' ? "bg-amber-500" : "bg-red-500")}></div>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Design: {audit.design_quality || 'Pauvre'}</span>
                                </div>
                                {audit.design_details && <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{audit.design_details}</p>}
                              </div>

                              <div className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl space-y-3">
                                <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                                  <span>Score SEO Estimé</span>
                                  <span>{audit.seo_score}/100</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div 
                                    className={cn("h-full", (audit.seo_score || 0) > 70 ? "bg-emerald-500" : (audit.seo_score || 0) > 40 ? "bg-amber-500" : "bg-red-500")} 
                                    style={{ width: `${audit.seo_score || 0}%` }}
                                  ></div>
                                </div>
                                {audit.seo_details && <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{audit.seo_details}</p>}
                              </div>

                              {audit.current_performance_score !== undefined && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl space-y-4">
                                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                                    <Zap size={14} className="text-amber-500" />
                                    Performance Shock (PageSpeed)
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 text-center space-y-1">
                                      <div className="text-2xl font-black text-red-500">{audit.current_performance_score}/100</div>
                                      <div className="text-[10px] text-slate-500 uppercase font-bold">Site Actuel</div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <ChevronRight className="text-slate-300" size={20} />
                                    </div>
                                    <div className="flex-1 text-center space-y-1">
                                      <div className="text-2xl font-black text-emerald-500">{audit.new_performance_score}/100</div>
                                      <div className="text-[10px] text-slate-500 uppercase font-bold">Maquette</div>
                                    </div>
                                  </div>
                                  {audit.performance_critique && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic text-center border-t border-slate-100 dark:border-slate-700 pt-2">
                                      "{audit.performance_critique}"
                                    </p>
                                  )}
                                </div>
                              )}

                              {audit.social_media_details && (
                                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl space-y-3">
                                  <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                                    <span className="flex items-center gap-2">
                                      <Users size={14} className="text-blue-500" />
                                      Réseaux Sociaux
                                    </span>
                                    <span>{audit.social_media_score}/100</span>
                                  </div>
                                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                      className={cn("h-full", (audit.social_media_score || 0) > 70 ? "bg-emerald-500" : (audit.social_media_score || 0) > 40 ? "bg-amber-500" : "bg-red-500")} 
                                      style={{ width: `${audit.social_media_score || 0}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{audit.social_media_details}</p>
                                </div>
                              )}

                              {audit.reviews_details && (
                                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl space-y-3">
                                  <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                                    <span className="flex items-center gap-2">
                                      <MessageSquare size={14} className="text-amber-500" />
                                      Avis Clients
                                    </span>
                                    <span>{audit.reviews_score}/100</span>
                                  </div>
                                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                      className={cn("h-full", (audit.reviews_score || 0) > 70 ? "bg-emerald-500" : (audit.reviews_score || 0) > 40 ? "bg-amber-500" : "bg-red-500")} 
                                      style={{ width: `${audit.reviews_score || 0}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{audit.reviews_details}</p>
                                </div>
                              )}

                              {audit.contact_visibility_details && (
                                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl space-y-3">
                                  <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                                    <span className="flex items-center gap-2">
                                      <Phone size={14} className="text-indigo-500" />
                                      Visibilité Contact
                                    </span>
                                    <span>{audit.contact_visibility_score}/100</span>
                                  </div>
                                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                      className={cn("h-full", (audit.contact_visibility_score || 0) > 70 ? "bg-emerald-500" : (audit.contact_visibility_score || 0) > 40 ? "bg-amber-500" : "bg-red-500")} 
                                      style={{ width: `${audit.contact_visibility_score || 0}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{audit.contact_visibility_details}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {detailTab === 'mockup' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <LayoutDashboard size={18} className="text-indigo-500" />
                          Maquette de Site Prédictive
                        </h4>
                        {(() => {
                          const audit: AuditData = JSON.parse(selectedProspect.audit_json || '{}');
                          if (audit.mockup_html) {
                            const previewUrl = `${window.location.origin}/preview/${selectedProspect.id}`;
                            return (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(previewUrl);
                                    addNotification('Lien de prévisualisation copié !', 'success');
                                  }}
                                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800 transition-all"
                                  title="Copier le lien pour l'envoyer par email"
                                >
                                  <Link size={14} />
                                  Copier le lien
                                </button>
                                <a 
                                  href={previewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-all"
                                  title="Ouvrir la maquette dans un nouvel onglet (peut être bloqué en mode dev)"
                                >
                                  <ExternalLink size={14} />
                                  Voir
                                </a>
                                <button 
                                  onClick={() => {
                                    const blob = new Blob([audit.mockup_html || ''], { type: 'text/html' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `maquette-${selectedProspect.name.toLowerCase().replace(/\s+/g, '-')}.html`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                    addNotification('Téléchargement lancé !', 'success');
                                  }}
                                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-100 dark:border-emerald-800 transition-all"
                                  title="Télécharger le fichier HTML pour l'envoyer au prospect"
                                >
                                  <FileText size={14} />
                                  Télécharger .html
                                </button>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      {(() => {
                        const audit: AuditData = JSON.parse(selectedProspect.audit_json || '{}');
                        if (!audit.mockup_html) {
                          return (
                            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                              <p className="text-slate-500 text-sm">Lancez l'audit pour générer une maquette.</p>
                            </div>
                          );
                        }
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: audit.primary_color }}></div>
                                  <span className="text-[10px] font-mono font-bold uppercase">{audit.primary_color}</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: audit.secondary_color }}></div>
                                  <span className="text-[10px] font-mono font-bold uppercase">{audit.secondary_color}</span>
                                </div>
                              </div>
                              {audit.style_variant && (
                                <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
                                  Style: {audit.style_variant}
                                </div>
                              )}
                            </div>
                            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner bg-white h-[500px]">
                              <iframe 
                                title="Mockup"
                                srcDoc={`
                                  <html>
                                    <head>
                                      <script src="https://cdn.tailwindcss.com"></script>
                                      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
                                      <style>
                                        body { font-family: 'Inter', sans-serif; }
                                        ${audit.mockup_html.match(/<style>([\s\S]*?)<\/style>/)?.[1] || ''}
                                      </style>
                                    </head>
                                    <body>
                                      ${audit.mockup_html.replace(/<style>[\s\S]*?<\/style>/, '')}
                                    </body>
                                  </html>
                                `}
                                className="w-full h-full border-none"
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {detailTab === 'roi' && (
                    <div className="space-y-6">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <BarChart3 size={18} className="text-emerald-500" />
                        Analyse de Rentabilité (ROI)
                      </h4>
                      {(() => {
                        const audit: AuditData = JSON.parse(selectedProspect.audit_json || '{}');
                        if (!audit.annual_loss) {
                          return (
                            <div className="space-y-6">
                              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                                <p className="text-slate-500 text-sm mb-4">L'audit IA n'a pas encore été effectué pour calculer le ROI et générer un email personnalisé.</p>
                                <button 
                                  onClick={() => handleAudit(selectedProspect.id)}
                                  disabled={auditingId === selectedProspect.id}
                                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 flex items-center gap-2 mx-auto"
                                >
                                  {auditingId === selectedProspect.id ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                                  Lancer l'audit IA
                                </button>
                              </div>

                              {selectedProspect.email && (
                                <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                                  <h5 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                                    <Mail size={18} className="text-indigo-500" />
                                    Contact Rapide
                                  </h5>
                                  <div className="flex gap-3">
                                    <button 
                                      onClick={() => {
                                        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedProspect.email || '')}`;
                                        window.open(gmailUrl, '_blank');
                                      }}
                                      className="flex-1 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                                    >
                                      <Globe size={18} />
                                      Ouvrir Gmail
                                    </button>
                                    <button 
                                      onClick={() => window.location.href = `mailto:${selectedProspect.email}`}
                                      className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
                                    >
                                      <Mail size={18} />
                                      App Mail
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div className="space-y-6">
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-6 rounded-2xl text-center">
                              <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-2">Bilan de l'Opportunité Manquée à {selectedProspect.city}</p>
                              <p className="text-4xl font-black text-red-600 dark:text-red-500">-{audit.annual_loss.toLocaleString()}€ / an</p>
                              <p className="text-xs text-red-500 mt-2 italic">{audit.loss_details}</p>
                            </div>

                            <div className="space-y-4">
                              <h5 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Mail size={18} className="text-indigo-500" />
                                Email de Prospection ROI-Centric
                              </h5>
                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 relative group">
                                <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                  {audit.email_draft}
                                </div>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(audit.email_draft || '');
                                    addNotification('Email copié !', 'success');
                                  }}
                                  className="absolute top-4 right-4 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Copy size={14} className="text-indigo-600 dark:text-indigo-400" />
                                </button>
                              </div>

                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(audit.email_draft || '');
                                    addNotification('Email copié !', 'success');
                                  }}
                                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                                >
                                  <Copy size={18} />
                                  Copier
                                </button>
                                {audit.mailto_link && (
                                  <div className="flex-[2] flex gap-2">
                                    <button 
                                      onClick={() => {
                                        window.location.href = audit.mailto_link || '';
                                      }}
                                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
                                      title="Ouvrir dans votre application de messagerie par défaut (Outlook, Mail.app...)"
                                    >
                                      <Mail size={18} />
                                      App Mail
                                    </button>
                                    {audit.gmail_link && (
                                      <button 
                                        onClick={() => window.open(audit.gmail_link, '_blank')}
                                        className="px-4 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                                        title="Ouvrir dans Gmail (Navigateur)"
                                      >
                                        <Globe size={18} />
                                        Gmail
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h5 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <MessageSquare size={18} className="text-indigo-500" />
                                Message Court (SMS/LinkedIn)
                              </h5>
                              <div className="bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800 relative group">
                                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                  {audit.sales_message}
                                </p>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(audit.sales_message || '');
                                    addNotification('Message copié !', 'success');
                                  }}
                                  className="absolute top-4 right-4 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Zap size={14} className="text-indigo-600 dark:text-indigo-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button 
                  onClick={() => window.open(`tel:${selectedProspect.phone}`)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 dark:shadow-indigo-900/50 transition-all flex items-center justify-center gap-3"
                >
                  <Phone size={20} />
                  Contacter maintenant
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-3">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 min-w-[240px]",
                n.type === 'success' 
                  ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                  : "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400"
              )}
            >
              {n.type === 'success' ? <CheckCircle2 size={18} /> : <Bell size={18} />}
              <span className="text-sm font-medium">{n.message}</span>
              <button 
                onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))}
                className="ml-auto p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="text-red-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Confirmer la suppression</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                  Êtes-vous sûr de vouloir supprimer <span className="font-bold text-slate-700 dark:text-slate-200">"{deleteConfirm.name}"</span> ? Cette action est irréversible.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
                    className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 dark:shadow-red-900/30 transition-all"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
