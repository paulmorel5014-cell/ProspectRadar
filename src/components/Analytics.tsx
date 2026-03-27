import React from 'react';
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
import { Prospect } from '../types';
import { cn } from '../lib/utils';

interface AnalyticsProps {
  prospects: Prospect[];
  darkMode: boolean;
}

export const Analytics: React.FC<AnalyticsProps> = ({ prospects, darkMode }) => {
  const stats = {
    total: prospects.length,
    contacted: prospects.filter(p => p.status !== 'Nouveau' && p.status !== 'À contacter').length,
    won: prospects.filter(p => p.status === 'Gagné').length,
    lost: prospects.filter(p => p.status === 'Perdu').length,
    avgScore: prospects.length > 0 ? Math.round(prospects.reduce((acc, p) => acc + p.opportunity_score, 0) / prospects.length) : 0,
    withAudit: prospects.filter(p => p.audit_json).length
  };

  const statusData = [
    { name: 'Nouveau', value: prospects.filter(p => p.status === 'Nouveau').length, color: '#94a3b8' },
    { name: 'À contacter', value: prospects.filter(p => p.status === 'À contacter').length, color: '#6366f1' },
    { name: 'En cours', value: prospects.filter(p => p.status === 'En cours').length, color: '#f59e0b' },
    { name: 'Gagné', value: prospects.filter(p => p.status === 'Gagné').length, color: '#10b981' },
    { name: 'Perdu', value: prospects.filter(p => p.status === 'Perdu').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const cityData = Array.from(d3.groups(prospects, (p: Prospect) => p.city))
    .map(([city, items]: [string, Prospect[]]) => ({ name: city, count: items.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const scoreData = [
    { name: '0-20', count: prospects.filter(p => p.opportunity_score <= 20).length },
    { name: '21-40', count: prospects.filter(p => p.opportunity_score > 20 && p.opportunity_score <= 40).length },
    { name: '41-60', count: prospects.filter(p => p.opportunity_score > 40 && p.opportunity_score <= 60).length },
    { name: '61-80', count: prospects.filter(p => p.opportunity_score > 60 && p.opportunity_score <= 80).length },
    { name: '81-100', count: prospects.filter(p => p.opportunity_score > 80).length },
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Prospects', value: stats.total, sub: 'Scannés au total' },
          { label: 'Taux Conversion', value: `${Math.round((stats.won / (stats.total || 1)) * 100)}%`, sub: 'Gagnés / Total' },
          { label: 'Score Moyen', value: `${stats.avgScore}%`, sub: 'Opportunité moyenne' },
          { label: 'Audits IA', value: stats.withAudit, sub: 'Analyses générées' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</div>
            <div className="text-4xl font-black text-slate-900 dark:text-slate-100 mb-1">{stat.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-10 tracking-tight">Répartition par Statut</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                    borderColor: darkMode ? '#1e293b' : '#f1f5f9',
                    borderRadius: '16px',
                    color: darkMode ? '#f1f5f9' : '#0f172a'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
            {statusData.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-10 tracking-tight">Top 5 Villes</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 'bold' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                    borderColor: darkMode ? '#1e293b' : '#f1f5f9',
                    borderRadius: '16px'
                  }} 
                />
                <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={30}>
                  {cityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#6366f1" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm lg:col-span-2">
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-10 tracking-tight">Distribution des Scores d'Opportunité</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 'bold' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 'bold' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                    borderColor: darkMode ? '#1e293b' : '#f1f5f9',
                    borderRadius: '16px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
