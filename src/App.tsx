import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, isFirebaseConfigured, db } from './firebase';
import { Prospect } from './types';
import { useProspects } from './hooks/useProspects';
import { handleAudit as runAudit } from './services/aiService';
import { exportAuditPDF } from './services/exportService';
import { cn } from './lib/utils';

// Components
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProspectTable } from './components/ProspectTable';
import { Analytics } from './components/Analytics';
import { Map } from './components/Map';
import { Settings } from './components/Settings';
import { AuditPanel } from './components/AuditPanel';
import { Login } from './components/Login';
import { Preview } from './components/Preview';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Simple Router
  const path = window.location.pathname;
  const isPreview = path.startsWith('/preview/');
  const previewId = isPreview ? path.split('/preview/')[1] : null;

  const [activeView, setActiveView] = useState<'dashboard' | 'prospects' | 'analytics' | 'settings' | 'map'>(
    () => (localStorage.getItem('lastView') as any) || 'dashboard'
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    const hour = new Date().getHours();
    return hour < 6 || hour >= 18;
  });

  // Prospect State & Logic
  const { 
    prospects, loading, notifications, addNotification, 
    updateStatus, updateFollowUpDate, updateEmail, 
    updateTags, updateNotes, addActivity, deleteProspect 
  } = useProspects(user);

  const [scanning, setScanning] = useState(false);
  const [city, setCity] = useState(() => localStorage.getItem('lastCity') || '');
  const [category, setCategory] = useState(() => localStorage.getItem('lastCategory') || '');
  const [companyName, setCompanyName] = useState('');
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [auditingId, setAuditingId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  const selectedProspect = useMemo(() => 
    prospects.find(p => p.id === selectedProspectId) || null, 
    [prospects, selectedProspectId]
  );

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasGeminiKey(hasKey);
      } else {
        setHasGeminiKey(!!process.env.GEMINI_API_KEY || !!process.env.API_KEY);
      }
    };
    checkKey();
  }, []);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('searchTerm') || '');
  const [filterStatus, setFilterStatus] = useState(() => localStorage.getItem('filterStatus') || 'all');
  const [tagFilter, setTagFilter] = useState(() => localStorage.getItem('tagFilter') || 'all');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'urgent' | 'optimize' | 'good'>(
    () => (localStorage.getItem('scoreFilter') as any) || 'all'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(
    () => (localStorage.getItem('sortOrder') as any) || 'asc'
  );

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Ensure user document exists
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          // We use setDoc with merge: true to avoid overwriting existing data (like role)
          // but ensuring the document exists so rules can read it.
          await setDoc(userRef, {
            email: currentUser.email,
            last_login: new Date().toISOString(),
            // We don't set role here to avoid privilege escalation, 
            // but we could set a default if it doesn't exist.
          }, { merge: true });
        } catch (err) {
          console.error("Error ensuring user document:", err);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('lastView', activeView);
    localStorage.setItem('lastCity', city);
    localStorage.setItem('lastCategory', category);
    localStorage.setItem('searchTerm', searchTerm);
    localStorage.setItem('filterStatus', filterStatus);
    localStorage.setItem('tagFilter', tagFilter);
    localStorage.setItem('scoreFilter', scoreFilter);
    localStorage.setItem('sortOrder', sortOrder || 'asc');
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [activeView, city, category, searchTerm, filterStatus, tagFilter, scoreFilter, sortOrder, darkMode]);

  // Follow-up reminders
  useEffect(() => {
    if (!prospects.length) return;
    const today = new Date().toISOString().split('T')[0];
    const reminders = prospects.filter(p => p.follow_up_date === today && p.status !== 'Gagné' && p.status !== 'Perdu');
    
    reminders.forEach(p => {
      addNotification(`Rappel : Suivi nécessaire pour ${p.name} aujourd'hui !`, 'info');
    });
  }, [prospects.length]); // Only run when prospects are loaded or changed

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setScanning(true);
    setLastError(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, category, companyName }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        setLastError(`Erreur serveur: ${errorText.substring(0, 100)}`);
        return;
      }

      const data = await res.json();
      if (data.error) {
        setLastError(data.error);
      } else if (data.length > 0) {
        // Save to Firestore
        const savePromises = data.map((p: any) => {
          const prospectRef = doc(db, `users/${user.uid}/prospects`, p.id);
          return setDoc(prospectRef, {
            ...p,
            uid: user.uid,
            created_at: new Date().toISOString(),
            status: 'Nouveau',
            activity_log: [{
              id: Math.random().toString(36).substring(7),
              type: 'status_change',
              content: 'Prospect découvert via Radar',
              timestamp: new Date().toISOString()
            }]
          }, { merge: true });
        });

        await Promise.all(savePromises);
        addNotification(`${data.length} nouveau(x) prospect(s) trouvé(s) !`, 'success');
        setCompanyName('');
      } else {
        addNotification("Aucun nouveau prospect trouvé.", 'info');
      }
    } catch (err) {
      setLastError("Erreur de connexion au serveur.");
    } finally {
      setScanning(false);
    }
  };

  if (authLoading && !isPreview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Zap className="text-indigo-600" size={48} />
        </motion.div>
      </div>
    );
  }

  if (isPreview && previewId) {
    return <Preview id={previewId} />;
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        handleLogout={() => auth.signOut()}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="flex-1 lg:ml-72 p-6 lg:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeView === 'dashboard' && (
              <Dashboard 
                city={city} setCity={setCity}
                category={category} setCategory={setCategory}
                companyName={companyName} setCompanyName={setCompanyName}
                handleScan={handleScan} scanning={scanning}
                lastError={lastError} prospects={prospects}
                setSelectedProspect={setSelectedProspectId}
                setActiveView={setActiveView}
                setScoreFilter={setScoreFilter}
              />
            )}

            {activeView === 'prospects' && (
              <ProspectTable 
                prospects={prospects} loading={loading}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                tagFilter={tagFilter} setTagFilter={setTagFilter}
                scoreFilter={scoreFilter} setScoreFilter={setScoreFilter}
                sortOrder={sortOrder} setSortOrder={setSortOrder}
                selectedProspect={selectedProspect}
                setSelectedProspect={setSelectedProspectId}
                updateStatus={updateStatus}
                confirmDelete={(id) => deleteProspect(id)}
                updateTags={updateTags}
              />
            )}

            {activeView === 'analytics' && (
              <Analytics prospects={prospects} darkMode={darkMode} />
            )}

            {activeView === 'map' && (
              <Map prospects={prospects} darkMode={darkMode} />
            )}

            {activeView === 'settings' && (
              <Settings 
                darkMode={darkMode} setDarkMode={setDarkMode}
                hasGeminiKey={hasGeminiKey} setHasGeminiKey={setHasGeminiKey}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedProspect && (
          <AuditPanel 
            prospect={selectedProspect}
            onClose={() => setSelectedProspectId(null)}
            auditingId={auditingId}
            handleAudit={(id) => runAudit(id, prospects, user.uid, addNotification, setAuditingId, setActiveView)}
            updateStatus={updateStatus}
            updateFollowUpDate={updateFollowUpDate}
            updateEmail={updateEmail}
            updateTags={updateTags}
            updateNotes={updateNotes}
            addActivity={addActivity}
            exportAuditPDF={exportAuditPDF}
            confirmDelete={(id) => deleteProspect(id)}
            userUid={user.uid}
            addNotification={addNotification}
          />
        )}
      </AnimatePresence>

      {/* Notifications */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={cn(
                "px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto border",
                n.type === 'success' 
                  ? "bg-emerald-600 border-emerald-500 text-white" 
                  : "bg-slate-900 border-slate-800 text-white"
              )}
            >
              <Zap size={18} />
              <span className="font-bold text-sm">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { Zap } from 'lucide-react';
