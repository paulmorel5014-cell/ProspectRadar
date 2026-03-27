import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Zap } from 'lucide-react';

export const Preview: React.FC<{ id: string }> = ({ id }) => {
  const [mockupHtml, setMockupHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const docRef = doc(db, 'public_previews', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMockupHtml(docSnap.data().mockup_html);
        } else {
          setError("Maquette non trouvée.");
        }
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement de la maquette.");
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Zap className="text-indigo-500 mb-4" size={48} />
        </motion.div>
        <p className="text-slate-400 font-bold animate-pulse">Chargement de votre proposition...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
        <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center text-red-500 mb-6">
          <Zap size={40} />
        </div>
        <h1 className="text-2xl font-black mb-2">{error}</h1>
        <p className="text-slate-400">Le lien est peut-être expiré ou invalide.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <iframe 
        srcDoc={mockupHtml || ''} 
        className="w-full h-screen border-none"
        title="Proposition Interactive"
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
      />
    </div>
  );
};

import { motion } from 'motion/react';
