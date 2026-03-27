import React from 'react';
import { 
  Search, 
  MapPin, 
  Globe, 
  Phone,
  Zap, 
  Loader2, 
  AlertCircle, 
  ChevronRight,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { Prospect } from '../types';
import { cn } from '../lib/utils';

interface DashboardProps {
  city: string;
  setCity: (city: string) => void;
  category: string;
  setCategory: (category: string) => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  handleScan: (e: React.FormEvent) => void;
  scanning: boolean;
  lastError: string | null;
  prospects: Prospect[];
  setSelectedProspect: (id: string) => void;
  setActiveView: (view: any) => void;
  setScoreFilter: (filter: 'all' | 'urgent' | 'optimize' | 'good') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  city, setCity, category, setCategory, companyName, setCompanyName,
  handleScan, scanning, lastError, prospects, setSelectedProspect, setActiveView,
  setScoreFilter
}) => {
  const [localFilter, setLocalFilter] = React.useState<'all' | 'urgent' | 'optimize' | 'good'>('all');

  // Prioritize prospects to call: lowest score first (High Priority)
  const recentProspects = [...prospects]
    .filter(p => {
      if (localFilter === 'all') return true;
      if (localFilter === 'urgent') return p.opportunity_score <= 30;
      if (localFilter === 'optimize') return p.opportunity_score > 30 && p.opportunity_score <= 60;
      if (localFilter === 'good') return p.opportunity_score > 60;
      return true;
    })
    .sort((a, b) => {
      // First priority: lowest score (High Priority)
      if (a.opportunity_score !== b.opportunity_score) {
        return a.opportunity_score - b.opportunity_score;
      }
      // Second priority: most recent
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 5);

  const stats = {
    urgent: prospects.filter(p => p.opportunity_score <= 30).length,
    optimize: prospects.filter(p => p.opportunity_score > 30 && p.opportunity_score <= 60).length,
    good: prospects.filter(p => p.opportunity_score > 60).length,
    total: prospects.length || 1
  };

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ scale: 1.02, translateY: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setLocalFilter(localFilter === 'urgent' ? 'all' : 'urgent');
          }}
          className={cn(
            "bg-white dark:bg-slate-900 p-6 rounded-3xl border shadow-sm cursor-pointer transition-all hover:shadow-xl",
            localFilter === 'urgent' ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-100 dark:border-slate-800"
          )}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-black text-red-500 uppercase tracking-widest">Priorité Haute</span>
            <span className="text-lg font-black text-red-500">{stats.urgent}</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(stats.urgent / stats.total) * 100}%` }}
              className="h-full bg-red-500"
            />
          </div>
          <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-tight">Cliquer pour filtrer</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, translateY: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setLocalFilter(localFilter === 'optimize' ? 'all' : 'optimize');
          }}
          className={cn(
            "bg-white dark:bg-slate-900 p-6 rounded-3xl border shadow-sm cursor-pointer transition-all hover:shadow-xl",
            localFilter === 'optimize' ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-100 dark:border-slate-800"
          )}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Optimisation</span>
            <span className="text-lg font-black text-amber-500">{stats.optimize}</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(stats.optimize / stats.total) * 100}%` }}
              className="h-full bg-amber-500"
            />
          </div>
          <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-tight">Cliquer pour filtrer</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, translateY: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setLocalFilter(localFilter === 'good' ? 'all' : 'good');
          }}
          className={cn(
            "bg-white dark:bg-slate-900 p-6 rounded-3xl border shadow-sm cursor-pointer transition-all hover:shadow-xl",
            localFilter === 'good' ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-100 dark:border-slate-800"
          )}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Bonne Santé</span>
            <span className="text-lg font-black text-emerald-500">{stats.good}</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(stats.good / stats.total) * 100}%` }}
              className="h-full bg-emerald-500"
            />
          </div>
          <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-tight">Cliquer pour filtrer</p>
        </motion.div>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
            Scanner de <span className="text-indigo-600">Prospects</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 max-w-2xl">
            Trouvez instantanément des entreprises locales qui ont besoin de vos services digitaux.
          </p>

          <form onSubmit={handleScan} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative group">
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={22} />
              <input 
                type="text" 
                placeholder="Ville (ex: Paris)" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl pl-14 pr-6 py-5 text-lg outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 dark:text-slate-100 transition-all"
              />
            </div>
            <div className="relative group">
              <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={22} />
              <input 
                type="text" 
                placeholder="Secteur (ex: Restaurant)" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl pl-14 pr-6 py-5 text-lg outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 dark:text-slate-100 transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={scanning || (!companyName && (!city || !category))}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-xl shadow-2xl shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-50 h-[72px]"
            >
              {scanning ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
              {scanning ? "Scan en cours..." : "Lancer le Radar"}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ou chercher une entreprise spécifique</span>
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
          </div>

          <div className="mt-8">
            <div className="relative group max-w-2xl mx-auto">
              <Plus className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={22} />
              <input 
                type="text" 
                placeholder="Nom de l'entreprise (ex: Boulangerie Dupont)" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl pl-14 pr-6 py-5 text-lg outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 dark:text-slate-100 transition-all"
              />
            </div>
          </div>

          {lastError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-3xl flex items-center gap-4 text-red-600 dark:text-red-400"
            >
              <AlertCircle size={24} />
              <p className="font-bold">{lastError}</p>
            </motion.div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Priorités d'Appel</h3>
            <button 
              onClick={() => setActiveView('prospects')}
              className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
            >
              Voir tout <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {recentProspects.length > 0 ? (
              recentProspects.map((p) => (
                <motion.div 
                  key={p.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => {
                    setSelectedProspect(p.id);
                  }}
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-colors",
                      p.opportunity_score <= 30 ? "bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white" : 
                      p.opportunity_score <= 60 ? "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white" : 
                      "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                    )}>
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-slate-100 text-lg">{p.name}</h4>
                      <div className="flex items-center gap-3">
                        <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1">
                          <MapPin size={14} /> {p.city}
                        </p>
                        {!p.website && (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black uppercase rounded-md">Sans Site</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      {p.website && (
                        <a 
                          href={p.website.startsWith('http') ? p.website : `https://${p.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all"
                          title="Visiter le site"
                        >
                          <Globe size={18} />
                        </a>
                      )}
                      {p.phone && (
                        <a 
                          href={`tel:${p.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all"
                          title="Appeler"
                        >
                          <Phone size={18} />
                        </a>
                      )}
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Opportunité</div>
                      <div className={cn(
                        "text-xl font-black",
                        p.opportunity_score <= 30 ? "text-red-500" : p.opportunity_score <= 60 ? "text-amber-500" : "text-emerald-500"
                      )}>
                        {p.opportunity_score}%
                      </div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-400 font-bold">Aucun prospect pour le moment. Lancez un scan !</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight px-4">Dernier Prospect</h3>
          {prospects.length > 0 ? (
            <div 
              onClick={() => setSelectedProspect(prospects[0])}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
                  {prospects[0].name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-xl">{prospects[0].name}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-bold flex items-center gap-1">
                    <MapPin size={14} /> {prospects[0].city}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Opportunité</div>
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-2xl font-black",
                      prospects[0].opportunity_score <= 30 ? "text-red-500" : prospects[0].opportunity_score <= 60 ? "text-amber-500" : "text-emerald-500"
                    )}>
                      {prospects[0].opportunity_score}%
                    </span>
                    {!prospects[0].website && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black uppercase rounded-md">Sans Site</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {prospects[0].website && (
                    <a 
                      href={prospects[0].website.startsWith('http') ? prospects[0].website : `https://${prospects[0].website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-center text-xs font-black hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Globe size={14} /> Site
                    </a>
                  )}
                  {prospects[0].phone && (
                    <a 
                      href={`tel:${prospects[0].phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-center text-xs font-black hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Phone size={14} /> Appel
                    </a>
                  )}
                </div>

                <button 
                  onClick={() => setSelectedProspect(prospects[0])}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm hover:opacity-90 transition-all"
                >
                  Ouvrir l'Audit IA
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
              <p className="text-slate-400 font-bold">Aucun prospect récent.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
