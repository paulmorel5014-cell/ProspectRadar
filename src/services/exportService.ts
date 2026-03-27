import { jsPDF } from 'jspdf';
import { Prospect, AuditData } from '../types';

export const exportAuditPDF = (prospect: Prospect) => {
  const doc = new jsPDF();
  const auditData: AuditData = prospect.audit_json ? JSON.parse(prospect.audit_json) : {};
  
  // Page 1: Cover
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, 210, 297, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(40);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT D\'AUDIT', 20, 80);
  doc.text('DIGITAL STRATÉGIQUE', 20, 100);
  
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2);
  doc.line(20, 115, 100, 115);
  
  doc.setFontSize(24);
  doc.text(prospect.name, 20, 140);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Préparé pour : ${prospect.name}`, 20, 240);
  doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 20, 248);
  doc.text('Par : ProspectRadar AI Intelligence', 20, 256);

  // Page 2: Executive Summary
  doc.addPage();
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 210, 297, 'F');
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Résumé Exécutif', 20, 30);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const introText = `Cet audit présente une analyse détaillée de la présence numérique de ${prospect.name}. Notre intelligence artificielle a scanné vos actifs digitaux pour identifier les opportunités de croissance et les risques de perte de revenus.`;
  doc.text(doc.splitTextToSize(introText, 170), 20, 45);

  // Score Box
  const score = auditData.digital_health_score || 0;
  const scoreColor = score <= 30 ? [239, 68, 68] : score <= 60 ? [245, 158, 11] : [16, 185, 129];
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(20, 70, 170, 60, 5, 5, 'FD');
  
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INDICE DE SANTÉ DIGITALE', 35, 85);
  doc.setFontSize(48);
  doc.text(`${score}%`, 35, 110);
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'italic');
  const summaryText = auditData.summary || "L'analyse montre que votre présence en ligne nécessite une attention immédiate pour rester compétitif sur votre marché local.";
  doc.text(doc.splitTextToSize(summaryText, 90), 90, 90);

  // Page 3: Performance & SEO
  doc.addPage();
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Performance & SEO', 20, 30);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Une présence web efficace repose sur deux piliers : la visibilité et la vitesse.', 20, 45);

  // Performance Table
  doc.setFillColor(241, 245, 249);
  doc.rect(20, 60, 170, 40, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Métrique', 30, 75);
  doc.text('Actuel', 100, 75);
  doc.text('Cible', 150, 75);
  
  doc.setFont('helvetica', 'normal');
  doc.line(20, 80, 190, 80);
  doc.text('Vitesse de chargement', 30, 90);
  doc.setTextColor(239, 68, 68);
  doc.text(`${auditData.current_performance_score || 35}/100`, 100, 90);
  doc.setTextColor(16, 185, 129);
  doc.text(`${auditData.new_performance_score || 100}/100`, 150, 90);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Critique Technique', 20, 120);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const critiqueText = auditData.performance_critique || "Votre site actuel souffre de temps de réponse serveurs élevés et d'images non optimisées, ce qui pénalise votre référencement Google et fait fuir 40% de vos visiteurs mobiles.";
  doc.text(doc.splitTextToSize(critiqueText, 170), 20, 130);

  // Page 4: Impact Financier & Roadmap
  doc.addPage();
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Impact Financier & Roadmap', 20, 30);
  
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(20, 50, 170, 80, 5, 5, 'F');
  
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(16);
  doc.text('MANQUE À GAGNER ANNUEL ESTIMÉ', 35, 70);
  doc.setFontSize(56);
  doc.text(`-${auditData.annual_loss?.toLocaleString() || '0'} €`, 35, 105);
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Détails de l\'analyse financière :', 20, 150);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const lossDetails = auditData.loss_details || "Ce montant est calculé en fonction du volume de recherche local pour votre activité et du taux de conversion moyen que vous perdez au profit de vos concurrents mieux positionnés.";
  doc.text(doc.splitTextToSize(lossDetails, 170), 20, 160);

  // Roadmap
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Plan d\'Action Stratégique (90 jours)', 20, 200);
  
  const roadmap = [
    { phase: "Phase 1 (Jours 1-15)", action: "Refonte technique et optimisation de la vitesse (LCP/FID)." },
    { phase: "Phase 2 (Jours 16-45)", action: "Déploiement de la stratégie SEO locale et contenu sémantique." },
    { phase: "Phase 3 (Jours 46-90)", action: "Optimisation du taux de conversion (CRO) et tracking analytics." }
  ];
  
  roadmap.forEach((item, i) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(item.phase, 25, 215 + (i * 15));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(item.action, 25, 222 + (i * 15));
  });

  // Page 5: Conclusion
  doc.addPage();
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.text('PRÊT À TRANSFORMER', 20, 100);
  doc.text('VOTRE BUSINESS ?', 20, 120);
  
  doc.setFontSize(14);
  doc.text('Contactez-nous pour lancer la mise en œuvre.', 20, 150);
  doc.text('ProspectRadar AI - L\'intelligence au service de votre croissance.', 20, 250);

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`ProspectRadar AI - Rapport Confidentiel - Page ${i} sur ${pageCount}`, 105, 285, { align: 'center' });
  }
  
  doc.save(`Audit_Strategique_${prospect.name.replace(/\s+/g, '_')}.pdf`);
};
