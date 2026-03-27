import React, { useState, useMemo } from 'react';
import { 
  X, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Zap, 
  Loader2, 
  Copy, 
  Check, 
  Trash2, 
  Tag, 
  Plus,
  FileText,
  MessageSquare,
  BarChart3,
  Calendar,
  Send,
  History,
  StickyNote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Prospect, AuditData, ActivityLogEntry } from '../types';
import { cn } from '../lib/utils';
import { findEmails } from '../services/aiService';

interface AuditPanelProps {
  prospect: Prospect;
  onClose: () => void;
  auditingId: string | null;
  handleAudit: (id: string) => void;
  updateStatus: (id: string, status: string) => void;
  updateFollowUpDate: (id: string, date: string) => void;
  updateEmail: (id: string, email: string) => void;
  updateTags: (id: string, tags: string[]) => void;
  updateNotes: (id: string, notes: string) => void;
  addActivity: (id: string, activity: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  exportAuditPDF: (prospect: Prospect) => void;
  confirmDelete: (id: string) => void;
  userUid: string;
  addNotification: (msg: string, type?: 'success' | 'info') => void;
}

export const AuditPanel: React.FC<AuditPanelProps> = ({
  prospect, onClose, auditingId, handleAudit, updateStatus, updateFollowUpDate,
  updateEmail, updateTags, updateNotes, addActivity, exportAuditPDF, confirmDelete,
  userUid, addNotification
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'crm' | 'mockup'>('audit');
  const [newTag, setNewTag] = useState('');
  const [noteText, setNoteText] = useState('');
  const [copied, setCopied] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const auditData: AuditData | null = useMemo(() => {
    try {
      return prospect.audit_json ? JSON.parse(prospect.audit_json) : null;
    } catch (e) {
      console.error("Error parsing audit_json", e);
      return null;
    }
  }, [prospect.audit_json]);

  const handleCopyEmail = () => {
    if (auditData?.email_draft) {
      navigator.clipboard.writeText(auditData.email_draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addActivity(prospect.id, {
      type: 'note',
      content: noteText
    });
    setNoteText('');
  };

  const handleEnrich = async () => {
    setEnriching(true);
    await findEmails(prospect, userUid, addNotification);
    setEnriching(false);
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white dark:bg-slate-950 shadow-2xl border-l border-slate-100 dark:border-slate-800 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200 dark:shadow-none">
            {prospect.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{prospect.name}</h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <MapPin size={12} /> {prospect.city}
              </div>
              <div className="h-4 w-px bg-slate-100 dark:bg-slate-800" />
              {prospect.website ? (
                <a 
                  href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <Globe size={14} /> Site Web
                </a>
              ) : (
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Sans Site</span>
              )}
              {prospect.phone && (
                <>
                  <div className="h-4 w-px bg-slate-100 dark:bg-slate-800" />
                  <a 
                    href={`tel:${prospect.phone}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    <Phone size={14} /> {prospect.phone}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
        >
          <X size={24} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-2 bg-slate-50 dark:bg-slate-900/50 mx-6 mt-6 rounded-2xl border border-slate-100 dark:border-slate-800">
        {[
          { id: 'audit', label: 'Audit IA', icon: Zap },
          { id: 'crm', label: 'CRM & Notes', icon: MessageSquare },
          { id: 'mockup', label: 'Maquette', icon: Globe },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab.id 
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {activeTab === 'audit' && (
          <div className="space-y-8">
            {!auditData?.digital_health_score && !auditData?.seo_score ? (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Zap className="mx-auto text-slate-300 mb-4" size={48} />
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">Aucun audit disponible</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">
                  Lancer l'IA pour analyser la présence digitale de ce prospect et générer une proposition.
                </p>
                <button 
                  onClick={() => handleAudit(prospect.id)}
                  disabled={auditingId === prospect.id}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 dark:shadow-none transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                  {auditingId === prospect.id ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                  {auditingId === prospect.id ? "Analyse en cours..." : "Lancer l'Audit IA"}
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Score Card */}
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
                  <BarChart3 className="absolute -bottom-10 -right-10 text-white/10" size={200} />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-1">Santé Digitale</div>
                        <div className="text-5xl font-black">{auditData.digital_health_score}%</div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <div className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-md",
                          auditData.digital_health_score <= 30 ? "bg-red-500/30 text-red-100" : 
                          auditData.digital_health_score <= 60 ? "bg-amber-500/30 text-amber-100" : 
                          "bg-emerald-500/30 text-emerald-100"
                        )}>
                          {auditData.digital_health_score <= 30 ? "Critique" : auditData.digital_health_score <= 60 ? "Moyenne" : "Bonne"}
                        </div>
                        <button 
                          onClick={() => handleAudit(prospect.id)}
                          disabled={auditingId === prospect.id}
                          className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md transition-all flex items-center gap-1"
                        >
                          {auditingId === prospect.id ? <Loader2 className="animate-spin" size={10} /> : <Zap size={10} />}
                          Relancer l'Audit
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                      <p className="text-sm font-medium italic">"{auditData.summary}"</p>
                    </div>
                  </div>
                </div>

                {/* Performance Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-3xl border border-red-100 dark:border-red-800">
                    <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Actuel</div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400 mb-1">{auditData.current_performance_score}/100</div>
                    <p className="text-xs text-red-500 font-medium">{auditData.performance_critique}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Après Refonte</div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{auditData.new_performance_score}/100</div>
                    <p className="text-xs text-emerald-500 font-medium">Optimisation SEO & Mobile native</p>
                  </div>
                </div>

                {/* ROI Section */}
                <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                      <AlertCircle size={24} />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">Manque à gagner</h4>
                  </div>
                  <div className="text-4xl font-black text-red-600 dark:text-red-400 mb-2">
                    -{auditData.annual_loss?.toLocaleString()}€ <span className="text-lg text-slate-400 font-bold">/ an</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    {auditData.loss_details}
                  </p>
                </div>

                {/* Email Draft Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">Email de Prospection</h4>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleEnrich}
                        disabled={enriching}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all disabled:opacity-50"
                      >
                        {enriching ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
                        Enrichir (Trouver l'email)
                      </button>
                      <button 
                        onClick={handleCopyEmail}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                        title="Copier l'email"
                      >
                        {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                      </button>
                      <a 
                        href={auditData.mailto_link}
                        className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 text-xs font-bold shadow-lg shadow-indigo-100 dark:shadow-none"
                        title="Envoyer l'email"
                      >
                        <Send size={16} /> Envoyer
                      </a>
                    </div>
                  </div>
                  
                  {prospect.email && (
                    <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                      <CheckCircle2 size={14} /> Email identifié : {prospect.email}
                    </div>
                  )}

                  <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed font-medium relative group">
                    {auditData.email_draft}
                  </div>
                </div>

                <button 
                  onClick={() => exportAuditPDF(prospect)}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                >
                  <FileText size={20} />
                  Exporter l'Audit en PDF
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'crm' && (
          <div className="space-y-8">
            {/* Status & Follow-up */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Statut</label>
                <select 
                  value={prospect.status}
                  onChange={(e) => updateStatus(prospect.id, e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                >
                  <option value="Nouveau">Nouveau</option>
                  <option value="À contacter">À contacter</option>
                  <option value="En cours">En cours</option>
                  <option value="Gagné">Gagné</option>
                  <option value="Perdu">Perdu</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rappel</label>
                <input 
                  type="date" 
                  value={prospect.follow_up_date || ''}
                  onChange={(e) => updateFollowUpDate(prospect.id, e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <StickyNote size={20} className="text-indigo-600" />
                Notes & Activités
              </h4>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ajouter une note ou un compte-rendu d'appel..." 
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
                <button 
                  onClick={handleAddNote}
                  className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all"
                >
                  <Plus size={24} />
                </button>
              </div>

              <div className="space-y-4 mt-6">
                {prospect.activity_log && prospect.activity_log.length > 0 ? (
                  prospect.activity_log.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((activity) => (
                    <div key={activity.id} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                        {activity.type === 'note' ? <StickyNote size={18} /> : 
                         activity.type === 'call' ? <Phone size={18} /> : 
                         activity.type === 'email' ? <Mail size={18} /> : 
                         <History size={18} />}
                      </div>
                      <div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{activity.content}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {new Date(activity.timestamp).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400 text-sm font-bold">
                    Aucune activité enregistrée.
                  </div>
                )}
              </div>
            </div>

            {/* Tags Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Tag size={20} className="text-indigo-600" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {prospect.tags?.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold">
                    {tag}
                    <button onClick={() => updateTags(prospect.id, prospect.tags!.filter(t => t !== tag))}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Ajouter un tag..." 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newTag) {
                        updateTags(prospect.id, [...(prospect.tags || []), newTag]);
                        setNewTag('');
                      }
                    }}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 w-32"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mockup' && (
          <div className="space-y-8">
            {!auditData?.mockup_html ? (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Globe className="mx-auto text-slate-300 mb-4" size={48} />
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">Aucune maquette</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">
                  Lancez l'audit IA pour générer une maquette visuelle personnalisée.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">Aperçu de la Maquette</h4>
                  <a 
                    href={`${window.location.origin}/preview/${prospect.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Voir en plein écran <ExternalLink size={16} />
                  </a>
                </div>
                <div className="aspect-video w-full bg-slate-100 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl">
                  <iframe 
                    srcDoc={auditData.mockup_html}
                    className="w-full h-full border-none"
                    title="Mockup Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                  />
                </div>
                <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                  <h5 className="font-black text-indigo-900 dark:text-indigo-100 mb-2">Pourquoi cette maquette ?</h5>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
                    L'IA a sélectionné le style <span className="font-bold">"{auditData.style_variant}"</span> pour correspondre à l'identité de {prospect.name}. 
                    Elle utilise les couleurs {auditData.primary_color} et {auditData.secondary_color} pour un rendu professionnel et moderne.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-white dark:bg-slate-950">
        <button 
          onClick={() => {
            if (confirm(`Voulez-vous vraiment supprimer ${prospect.name} ?`)) {
              confirmDelete(prospect.id);
              onClose();
            }
          }}
          className="p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
          title="Supprimer le prospect"
        >
          <Trash2 size={24} />
        </button>
        <div className="flex-1" />
        <button 
          onClick={onClose}
          className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          Fermer
        </button>
      </div>
    </motion.div>
  );
};
