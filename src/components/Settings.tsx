import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  MapPin, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Moon,
  Sun,
  Bell
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  hasGeminiKey: boolean;
  setHasGeminiKey: (has: boolean) => void;
  customGeminiKey: string;
  setCustomGeminiKey: (key: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  darkMode, setDarkMode, hasGeminiKey, setHasGeminiKey,
  customGeminiKey, setCustomGeminiKey
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState(customGeminiKey);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("Ce navigateur ne supporte pas les notifications de bureau.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
    
    if (permission === "granted") {
      new Notification("ProspectRadar AI", {
        body: "Les notifications sont maintenant activées !",
        icon: "/favicon.ico"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Configuration Générale</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Personnalisez votre expérience et vos alertes.</p>
            </div>
          </div>
        </div>
        
        <div className="p-10 space-y-10">
          {/* Appearance */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-1">Apparence</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Basculez entre le mode clair et le mode sombre.</p>
            </div>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-bold"
            >
              {darkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-600" />}
              {darkMode ? "Mode Clair" : "Mode Sombre"}
            </button>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-1">Notifications Push</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Recevez des alertes pour vos rappels de suivi.</p>
            </div>
            <button 
              onClick={requestNotificationPermission}
              disabled={notificationsEnabled}
              className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all font-bold",
                notificationsEnabled 
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" 
                  : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <Bell size={20} />
              {notificationsEnabled ? "Activées" : "Activer les notifications"}
            </button>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* API Keys */}
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-1">Services Connectés</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Vérifiez l'état de vos connexions API.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                      <Zap size={20} />
                    </div>
                    <span className="font-black text-slate-900 dark:text-slate-100">Gemini AI</span>
                  </div>
                  {hasGeminiKey ? (
                    <CheckCircle2 className="text-emerald-500" size={20} />
                  ) : (
                    <AlertCircle className="text-red-500" size={20} />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  Utilisé pour l'audit automatique, la génération de maquettes et les emails de prospection.
                </p>
                {!hasGeminiKey && (
                  <div className="space-y-3">
                    {window.aistudio?.openSelectKey ? (
                      <button 
                        onClick={async () => {
                          if (window.aistudio?.openSelectKey) {
                            await window.aistudio.openSelectKey();
                            setHasGeminiKey(true);
                          }
                        }}
                        className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                      >
                        Configurer la clé
                      </button>
                    ) : (
                      <div className="space-y-3">
                        {!showKeyInput ? (
                          <button 
                            onClick={() => setShowKeyInput(true)}
                            className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                          >
                            Entrer une clé API
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <input 
                              type="password"
                              placeholder="Clé API Gemini"
                              value={tempKey}
                              onChange={(e) => setTempKey(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setCustomGeminiKey(tempKey);
                                  setShowKeyInput(false);
                                }}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-700 transition-all"
                              >
                                Sauvegarder
                              </button>
                              <button 
                                onClick={() => setShowKeyInput(false)}
                                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        )}
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold leading-tight">
                          Clé API manquante. Obtenez-en une sur <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">AI Studio</a>.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {hasGeminiKey && !window.aistudio?.openSelectKey && customGeminiKey && (
                  <button 
                    onClick={() => {
                      setCustomGeminiKey('');
                      setTempKey('');
                    }}
                    className="w-full py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                  >
                    Supprimer la clé
                  </button>
                )}
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                      <MapPin size={20} />
                    </div>
                    <span className="font-black text-slate-900 dark:text-slate-100">Google Places</span>
                  </div>
                  <CheckCircle2 className="text-emerald-500" size={20} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  Utilisé pour scanner les entreprises locales et récupérer les coordonnées réelles.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  <CheckCircle2 size={12} /> Connecté via le serveur
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
        <Zap className="absolute -bottom-10 -right-10 text-white/10" size={200} />
        <div className="relative z-10">
          <h3 className="text-2xl font-black mb-4">Besoin d'aide ?</h3>
          <p className="text-indigo-100 mb-8 max-w-xl">
            Consultez notre documentation pour apprendre à optimiser vos scans et augmenter votre taux de conversion avec l'IA.
          </p>
          <a 
            href="#" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black hover:bg-indigo-50 transition-all"
          >
            Voir la documentation <ExternalLink size={20} />
          </a>
        </div>
      </section>
    </div>
  );
};
