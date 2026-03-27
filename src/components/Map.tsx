import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Prospect } from '../types';

interface MapProps {
  prospects: Prospect[];
  darkMode: boolean;
}

export const Map: React.FC<MapProps> = ({ prospects, darkMode }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 800;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Projection for France
    const projection = d3.geoConicConformal()
      .center([2.454071, 46.279229])
      .scale(3500)
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
          .attr("fill", darkMode ? "#1e293b" : "#f8fafc")
          .attr("stroke", darkMode ? "#334155" : "#e2e8f0")
          .attr("stroke-width", 0.8);

        // Group prospects by city or use exact coordinates
        const cityGroups = d3.groups(prospects, (d: Prospect) => d.city);
        
        // MOCK mapping for fallback if no lat/lng
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

        const points = cityGroups.map(([city, items]: [string, Prospect[]]) => {
          // Try to get coords from the first prospect in the group that has them
          const prospectWithCoords = items.find(p => p.lat && p.lng);
          const coords: [number, number] = prospectWithCoords 
            ? [prospectWithCoords.lng!, prospectWithCoords.lat!] 
            : (cityCoords[city] || [2.3522 + (Math.random() - 0.5) * 4, 48.8566 + (Math.random() - 0.5) * 4]);
            
          return {
            city,
            count: items.length,
            coords,
            avgScore: Math.round(items.reduce((acc: number, p: Prospect) => acc + p.opportunity_score, 0) / items.length)
          };
        });

        const radiusScale = d3.scaleSqrt()
          .domain([0, d3.max(points, d => d.count) || 10])
          .range([6, 30]);

        const bubbles = svg.append("g")
          .selectAll("circle")
          .data(points)
          .enter()
          .append("circle")
          .attr("cx", d => projection(d.coords as [number, number])![0])
          .attr("cy", d => projection(d.coords as [number, number])![1])
          .attr("r", d => radiusScale(d.count))
          .attr("fill", d => d.avgScore > 70 ? "#ef4444" : d.avgScore > 40 ? "#f59e0b" : "#6366f1")
          .attr("fill-opacity", 0.6)
          .attr("stroke", d => d.avgScore > 70 ? "#b91c1c" : d.avgScore > 40 ? "#b45309" : "#4f46e5")
          .attr("stroke-width", 1.5)
          .style("cursor", "pointer")
          .on("mouseover", function(event, d) {
            d3.select(this).attr("fill-opacity", 0.9);
          })
          .on("mouseout", function(event, d) {
            d3.select(this).attr("fill-opacity", 0.6);
          });

        bubbles.append("title")
          .text(d => `${d.city}: ${d.count} prospects (Score moyen: ${d.avgScore}%)`);
          
        // Add labels for larger points
        svg.append("g")
          .selectAll("text")
          .data(points.filter(d => d.count > 0))
          .enter()
          .append("text")
          .attr("x", d => projection(d.coords as [number, number])![0])
          .attr("y", d => projection(d.coords as [number, number])![1] - radiusScale(d.count) - 8)
          .attr("text-anchor", "middle")
          .attr("font-size", "11px")
          .attr("font-weight", "black")
          .attr("fill", darkMode ? "#94a3b8" : "#475569")
          .text(d => d.city);
      });
  }, [prospects, darkMode]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10 flex flex-col items-center justify-center min-h-[800px]">
      <div className="w-full max-w-4xl aspect-square relative">
        <svg 
          ref={svgRef} 
          width="100%" 
          height="100%" 
          viewBox="0 0 800 800" 
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
        />
      </div>
      <div className="mt-10 flex gap-8">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 opacity-60" />
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Priorité Haute</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-500 opacity-60" />
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Priorité Moyenne</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-indigo-500 opacity-60" />
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Priorité Basse</span>
        </div>
      </div>
    </div>
  );
};
