import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Globe, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Trash2,
  Tag,
  Plus,
  Filter,
  ChevronUp,
  ChevronDown,
  X,
  Check,
  Mail,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Prospect } from '../types';
import { cn } from '../lib/utils';

interface ProspectTableProps {
  prospects: Prospect[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  tagFilter: string;
  setTagFilter: (tag: string) => void;
  scoreFilter: 'all' | 'urgent' | 'optimize' | 'good';
  setScoreFilter: (filter: 'all' | 'urgent' | 'optimize' | 'good') => void;
  sortOrder: 'asc' | 'desc' | null;
  setSortOrder: (order: 'asc' | 'desc' | null) => void;
  selectedProspect: Prospect | null;
  setSelectedProspect: (id: string | null) => void;
  updateStatus: (id: string, status: string) => void;
  confirmDelete: (id: string, name: string) => void;
  updateTags: (id: string, tags: string[]) => void;
}

export const ProspectTable: React.FC<ProspectTableProps> = ({
  prospects, loading, searchTerm, setSearchTerm, filterStatus, setFilterStatus,
  tagFilter, setTagFilter, scoreFilter, setScoreFilter, sortOrder, setSortOrder,
  selectedProspect, setSelectedProspect, updateStatus, confirmDelete, updateTags
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [websiteFilter, setWebsiteFilter] = useState<'all' | 'has' | 'none'>('all');
  const [phoneFilter, setPhoneFilter] = useState<'all' | 'has' | 'none'>('all');

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    prospects.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [prospects]);

  const filteredProspects = useMemo(() => {
    return prospects
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             p.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        const matchesTag = tagFilter === 'all' || p.tags?.includes(tagFilter);
        
        let matchesScore = true;
        if (scoreFilter === 'urgent') matchesScore = p.opportunity_score <= 30;
        else if (scoreFilter === 'optimize') matchesScore = p.opportunity_score > 30 && p.opportunity_score <= 60;
        else if (scoreFilter === 'good') matchesScore = p.opportunity_score > 60;

        const matchesWebsite = websiteFilter === 'all' || 
                              (websiteFilter === 'has' && p.website) || 
                              (websiteFilter === 'none' && !p.website);
        
        const matchesPhone = phoneFilter === 'all' || 
                            (phoneFilter === 'has' && p.phone) || 
                            (phoneFilter === 'none' && !p.phone);

        return matchesSearch && matchesStatus && matchesTag && matchesScore && matchesWebsite && matchesPhone;
      })
      .sort((a, b) => {
        if (!sortOrder) return 0;
        const scoreA = a.opportunity_score;
        const scoreB = b.opportunity_score;
        return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      });
  }, [prospects, searchTerm, filterStatus, tagFilter, scoreFilter, sortOrder]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProspects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProspects.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchStatusUpdate = (status: string) => {
    selectedIds.forEach(id => updateStatus(id, status));
    setSelectedIds([]);
    setShowBatchActions(false);
  };

  const handleBatchDelete = () => {
    if (window.confirm(`Supprimer ${selectedIds.length} prospects ?`)) {
      selectedIds.forEach(id => {
        const p = prospects.find(prospect => prospect.id === id);
        if (p) confirmDelete(id, p.name);
      });
      setSelectedIds([]);
      setShowBatchActions(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher par nom, ville, catégorie..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
              showAdvancedFilters ? "bg-indigo-600 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            )}
          >
            <Filter size={18} />
            Filtres
          </button>
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            Score {sortOrder === 'asc' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Statut</label>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="Nouveau">Nouveau</option>
                  <option value="À contacter">À contacter</option>
                  <option value="En cours">En cours</option>
                  <option value="Gagné">Gagné</option>
                  <option value="Perdu">Perdu</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tag</label>
                <select 
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                >
                  <option value="all">Tous les tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Site Web</label>
                <select 
                  value={websiteFilter}
                  onChange={(e) => setWebsiteFilter(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                >
                  <option value="all">Tous</option>
                  <option value="has">Avec site</option>
                  <option value="none">Sans site</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Téléphone</label>
                <select 
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                >
                  <option value="all">Tous</option>
                  <option value="has">Avec téléphone</option>
                  <option value="none">Sans téléphone</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Priorité (Score)</label>
                <div className="flex gap-2">
                  {(['all', 'urgent', 'optimize', 'good'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setScoreFilter(f)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
                        scoreFilter === f 
                          ? "bg-indigo-600 text-white" 
                          : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      )}
                    >
                      {f === 'all' ? 'Tous' : f === 'urgent' ? 'Haute' : f === 'optimize' ? 'Moyenne' : 'Basse'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-8 border border-slate-800"
          >
            <div className="flex items-center gap-3">
              <span className="bg-indigo-600 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">
                {selectedIds.length}
              </span>
              <span className="font-bold">prospects sélectionnés</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowBatchActions(!showBatchActions)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  Changer Statut
                </button>
                {showBatchActions && (
                  <div className="absolute bottom-full mb-4 left-0 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl w-48 space-y-1">
                    {['Nouveau', 'À contacter', 'En cours', 'Gagné', 'Perdu'].map(s => (
                      <button 
                        key={s}
                        onClick={() => handleBatchStatusUpdate(s)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-800 rounded-xl text-sm transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button 
                onClick={handleBatchDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
              >
                <Trash2 size={16} />
                Supprimer
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="p-2 hover:bg-slate-800 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5 w-12">
                  <button 
                    onClick={toggleSelectAll}
                    className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      selectedIds.length === filteredProspects.length && filteredProspects.length > 0
                        ? "bg-indigo-600 border-indigo-600 text-white" 
                        : "border-slate-300 dark:border-slate-600"
                    )}
                  >
                    {selectedIds.length === filteredProspects.length && filteredProspects.length > 0 && <Check size={14} />}
                  </button>
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Entreprise</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Localisation</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Score</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Statut</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={32} />
                    <p className="text-slate-400 font-bold">Chargement des prospects...</p>
                  </td>
                </tr>
              ) : filteredProspects.length > 0 ? (
                filteredProspects.map((p) => (
                  <motion.tr 
                    key={p.id}
                    layout
                    className={cn(
                      "group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer",
                      selectedProspect?.id === p.id ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""
                    )}
                    onClick={() => setSelectedProspect(p.id)}
                  >
                    <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => toggleSelect(p.id)}
                        className={cn(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                          selectedIds.includes(p.id)
                            ? "bg-indigo-600 border-indigo-600 text-white" 
                            : "border-slate-300 dark:border-slate-600"
                        )}
                      >
                        {selectedIds.includes(p.id) && <Check size={14} />}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 dark:text-slate-100">{p.name}</div>
                          <div className="text-xs text-slate-400 font-bold">{p.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400" />
                        {p.city}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-xs font-black",
                        p.opportunity_score <= 30 ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                        p.opportunity_score <= 60 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                        "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                      )}>
                        {p.opportunity_score}%
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {p.website && (
                          <a 
                            href={p.website.startsWith('http') ? p.website : `https://${p.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                            title="Visiter le site"
                          >
                            <Globe size={18} />
                          </a>
                        )}
                        {p.phone && (
                          <a 
                            href={`tel:${p.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                            title="Appeler"
                          >
                            <Phone size={18} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-bold",
                        p.status === 'Gagné' ? "text-emerald-500" :
                        p.status === 'Perdu' ? "text-red-500" :
                        p.status === 'En cours' ? "text-amber-500" :
                        "text-slate-400"
                      )}>
                        {p.status === 'Gagné' ? <CheckCircle2 size={14} /> :
                         p.status === 'Perdu' ? <AlertCircle size={14} /> :
                         p.status === 'En cours' ? <Clock size={14} /> :
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />}
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProspect(p);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <p className="text-slate-400 font-bold">Aucun prospect trouvé.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Loader2 = ({ className, size }: { className?: string; size?: number }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
    className={className}
  >
    <Clock size={size} />
  </motion.div>
);
