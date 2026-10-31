import jsPDF from 'jspdf';
import { ClientDiagnostic, Report } from '../types';

export function exportDiagnosticToPdf(diagnostic: ClientDiagnostic) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  const report = diagnostic.reportData;
  const growth = report.diagnosis?.growthProjection;

  // Helper for adding new pages
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      y = 18;
      // Add subtle header on continuation pages
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 145);
      doc.text(`Mapa de Conteúdo • Diagnóstico Estratégico para @${diagnostic.instagramUsername}`, margin, 10);
      doc.setDrawColor(230, 230, 235);
      doc.setLineWidth(0.2);
      doc.line(margin, 12, pageWidth - margin, 12);
    }
  };

  // 1. Cover / Top Header Banner (Coral Gradient effect)
  doc.setFillColor(238, 73, 87); // #ee4957
  doc.roundedRect(margin, y, contentWidth, 34, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('MAPA DE CONTEÚDO ESTRATÉGICO', margin + 8, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Diagnóstico Executivo do Instagram • Planejamento Trimestral de 90 Dias', margin + 8, y + 21);

  doc.setFontSize(8.5);
  doc.setTextColor(255, 235, 235);
  doc.text(`Gerado em: ${new Date(diagnostic.createdAt).toLocaleDateString('pt-BR')} • Relatório Oficial Confidencial`, margin + 8, y + 28);

  y += 42;

  // 2. Client & Account Meta Card
  doc.setFillColor(248, 248, 250);
  doc.setDrawColor(228, 228, 233);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 26, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 110);
  doc.text('DADOS DO CLIENTE & AUDIÊNCIA', margin + 6, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text(diagnostic.clientName, margin + 6, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 90);
  doc.text(`E-mail: ${diagnostic.clientEmail}`, margin + 6, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(238, 73, 87);
  doc.text(`@${diagnostic.instagramUsername}`, pageWidth / 2 + 10, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 90);
  const nicheText = diagnostic.niche || diagnostic.profession || 'Posicionamento Profissional';
  doc.text(`Nicho / Área: ${nicheText.slice(0, 35)}`, pageWidth / 2 + 10, y + 21);

  y += 33;

  // 3. Potency & Score Metrics Section
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text('1. TERMÔMETRO DE POTÊNCIA & METAS EM 90 DIAS', margin, y);
  y += 5;

  const colWidth = (contentWidth - 6) / 3;
  const score = report.diagnosis?.powerPreview?.currentPowerScore || report.diagnosis?.overallScore || 85;

  // Metric 1: Score
  doc.setFillColor(255, 245, 245);
  doc.setDrawColor(254, 215, 215);
  doc.roundedRect(margin, y, colWidth, 22, 2.5, 2.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(238, 73, 87);
  doc.text('POTÊNCIA ALGORÍTMICA', margin + 4, y + 6);
  doc.setFontSize(14);
  doc.text(`${score} / 100`, margin + 4, y + 15);

  // Metric 2: Followers Realistic
  const folRange = growth?.realistic?.projectedFollowersRange || '+3.500 a +7.500 seguidores';
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin + colWidth + 3, y, colWidth, 22, 2.5, 2.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text('PROJEÇÃO DE SEGUIDORES (90D)', margin + colWidth + 7, y + 6);
  doc.setFontSize(10);
  doc.text(folRange, margin + colWidth + 7, y + 15);

  // Metric 3: Reach
  const reachRange = growth?.realistic?.estimatedReachRange || '80k a 180k contas';
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(margin + colWidth * 2 + 6, y, colWidth, 22, 2.5, 2.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(3, 105, 161);
  doc.text('ALCANCE ESTIMADO (90D)', margin + colWidth * 2 + 10, y + 6);
  doc.setFontSize(10);
  doc.text(reachRange, margin + colWidth * 2 + 10, y + 15);

  y += 28;

  // 4. Strategic Diagnosis & Positioning
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text('2. ANÁLISE CIRÚRGICA DE POSICIONAMENTO', margin, y);
  y += 5;

  const currentPos = report.diagnosis?.bioAnalysis?.currentStatus || 'Posicionamento em fase de estruturação estratégica.';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 55);
  const posLines = doc.splitTextToSize(currentPos, contentWidth);
  doc.text(posLines, margin, y);
  y += posLines.length * 4.5 + 4;

  // Unique Value Proposition
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(238, 73, 87);
  doc.text('PROPOSTA ÚNICA DE VALOR (DIFERENCIAL COMPETITIVO):', margin, y);
  y += 4.5;
  const uvp = report.diagnosis?.competitiveEdge || 'Comunicação direta com o cliente ideal.';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 55);
  const uvpLines = doc.splitTextToSize(uvp, contentWidth);
  doc.text(uvpLines, margin, y);
  y += uvpLines.length * 4.5 + 6;

  // 5. Target Audience & Transformation
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text('3. PÚBLICO-ALVO & TRANSFORMAÇÃO VENDIDA', margin, y);
  y += 5;

  const audProfile = report.diagnosis?.targetAudience?.profile || 'Seguidores que buscam soluções qualificadas.';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 55);
  const audLines = doc.splitTextToSize(`Perfil do Comprador: ${audProfile}`, contentWidth);
  doc.text(audLines, margin, y);
  y += audLines.length * 4.5 + 4;

  if (report.diagnosis?.growthOpportunities && report.diagnosis.growthOpportunities.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(24, 24, 27);
    doc.text('Oportunidades Imediatas de Alavancagem:', margin, y);
    y += 4.5;

    report.diagnosis.growthOpportunities.slice(0, 4).forEach((op: string) => {
      checkPageBreak(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(238, 73, 87);
      doc.text('•', margin + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 55);
      const opLines = doc.splitTextToSize(op, contentWidth - 8);
      doc.text(opLines, margin + 6, y);
      y += opLines.length * 4 + 2;
    });
  }

  y += 4;

  // 6. Content Blueprint & 90 Days Roadmap
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text('4. ESTRUTURA EDITORIAL & CRONOGRAMA DE 90 DIAS', margin, y);
  y += 5;

  // Phases Table Box
  const phases = [
    { title: 'Fase 1 (Dias 1 a 30) - Fundação & Atração', desc: 'Ajuste de bio, Reels de topo de funil com ganchos visuais para atração orgânica.' },
    { title: 'Fase 2 (Dias 31 a 60) - Autoridade & Conexão', desc: 'Carrosséis profundos com retenção, quebra de objeções e sequências de Stories.' },
    { title: 'Fase 3 (Dias 61 a 90) - Escala & Conversão', desc: 'CTAs diretos para mensagem no WhatsApp/Direct, campanhas e fechamento de vendas.' }
  ];

  phases.forEach((phase) => {
    checkPageBreak(18);
    doc.setFillColor(250, 250, 252);
    doc.setDrawColor(230, 230, 235);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(238, 73, 87);
    doc.text(phase.title, margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 65);
    doc.text(phase.desc, margin + 4, y + 10);
    y += 17;
  });

  // 7. Highlight Content Ideas Sample
  if (report.contentIdeas && report.contentIdeas.length > 0) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(24, 24, 27);
    doc.text('5. EXEMPLOS DE POSTAGENS ESTRATÉGICAS COM GANCHOS', margin, y);
    y += 5;

    report.contentIdeas.slice(0, 4).forEach((idea, idx) => {
      checkPageBreak(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(24, 24, 27);
      doc.text(`${idx + 1}. [${idea.format}] ${idea.title}`, margin, y);
      y += 4;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(238, 73, 87);
      const hookLines = doc.splitTextToSize(`Gancho: "${idea.hook}"`, contentWidth);
      doc.text(hookLines, margin + 4, y);
      y += hookLines.length * 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 85);
      const ctaLines = doc.splitTextToSize(`CTA Recomendada: ${idea.cta}`, contentWidth);
      doc.text(ctaLines, margin + 4, y);
      y += ctaLines.length * 4 + 3;
    });
  }

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 155);
    doc.text(
      'Mapa de Conteúdo Estratégico • Todos os direitos reservados • Documento emitido para uso profissional do cliente.',
      margin,
      pageHeight - 8
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 8);
  }

  // Download PDF
  const sanitizedName = diagnostic.clientName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `diagnostico_estrategico_${sanitizedName}_${diagnostic.instagramUsername}.pdf`;
  doc.save(filename);
}
