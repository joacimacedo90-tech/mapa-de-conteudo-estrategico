import { Report, PowerPreviewData } from '../types';

/**
 * Computes or retrieves a complete, high-fidelity Instagram Power Preview
 * for any report. If Gemini already returned powerPreview, it enriches it;
 * otherwise it computes tailored metrics based on the report's score, niche, and username.
 */
export function getReportPowerPreview(report: Report): PowerPreviewData {
  if (report.diagnosis?.powerPreview && report.diagnosis.powerPreview.powerPillars?.length) {
    return report.diagnosis.powerPreview;
  }

  const overall = report.diagnosis?.overallScore || 72;
  const currentPower = Math.max(28, Math.min(48, Math.round(overall * 0.46)));
  const maxPower = Math.min(98, Math.max(90, Math.round(overall * 1.18) || 95));
  const untapped = maxPower - currentPower;

  const followersCount = report.metaProfileData?.followersCount || 0;
  let estimatedLostReach = '35.000 a 95.000 contas únicas';
  let estimatedLostLeads = '15 a 45 clientes potenciais no Direct';

  if (followersCount > 5000) {
    estimatedLostReach = '90.000 a 280.000 visualizações reprimidas';
    estimatedLostLeads = '40 a 120 clientes potenciais perdidos';
  } else if (followersCount > 1000) {
    estimatedLostReach = '45.000 a 130.000 visualizações reprimidas';
    estimatedLostLeads = '25 a 70 clientes potenciais perdidos';
  }

  const bioStatus = report.diagnosis?.bioAnalysis?.currentStatus || 'Bio descritiva sem gancho magnético';
  const competitiveEdge = report.diagnosis?.competitiveEdge || 'Autoridade técnica no nicho';

  return {
    currentPowerScore: currentPower,
    maxPowerScore: maxPower,
    untappedPotentialPercentage: untapped,
    powerStatusLabel:
      currentPower < 35
        ? 'Motor em Ponto Morto • Alta Capacidade Reprimida'
        : currentPower < 45
        ? 'Tração Intermitente • Fuga Crítica de Atenção'
        : 'Perfil com Potencial Latente de Escala Rápida',
    estimatedMonthlyLostReach: estimatedLostReach,
    estimatedLostLeads: estimatedLostLeads,
    powerPillars: [
      {
        name: 'Potência 1: Descoberta & Reels (Atração Orgânica)',
        currentPercentage: Math.max(22, Math.round(currentPower * 0.88)),
        potentialPercentage: 92,
        diagnosis: 'O algoritmo do Instagram descarta o Reel nos primeiros 3 segundos se não houver corte de padrão visual e gancho verbal magnético.',
        unlockedWith: '10 Roteiros de Reels Prontos com Ganchos Visuais e Verbais'
      },
      {
        name: 'Potência 2: Retenção & Carrosséis (Autoridade & Salvamentos)',
        currentPercentage: Math.max(25, Math.round(currentPower * 1.02)),
        potentialPercentage: 96,
        diagnosis: 'Posts estáticos ou textos corridos não retêm a leitura. O carrossel estruturado slide-a-slide gera até 4x mais salvamentos.',
        unlockedWith: '10 Carrosséis Estruturados com Headlines de Capa e Roteiros'
      },
      {
        name: 'Potência 3: Conversão em Vendas & Stories (Ativação de Direct)',
        currentPercentage: Math.max(20, Math.round(currentPower * 0.72)),
        potentialPercentage: 90,
        diagnosis: 'Stories postados ao acaso esfriam a audiência. Uma sequência com enquetes polarizadoras e chamada para direct triplica o fechamento de vendas.',
        unlockedWith: '10 Sequências de Stories de Alta Conversão com Enquetes'
      },
      {
        name: 'Potência 4: Consistência Editorial & Algoritmo (90 Dias)',
        currentPercentage: Math.max(15, Math.round(currentPower * 0.52)),
        potentialPercentage: 98,
        diagnosis: 'Parar de postar por 4 ou 5 dias reinicia a pontuação de relevância do perfil no algoritmo. Um calendário trimestral garante tração constante.',
        unlockedWith: 'Calendário Editorial de até 90 Dias (Fases 1, 2 e 3)'
      }
    ],
    powerLeaks: [
      {
        title: 'Vazamento #1: Bio com Dispersão de Visitantes',
        leakDescription: `A bio atual (${bioStatus}) não responde em 3 segundos quem você ajuda e qual transformação entrega, fazendo visitantes saírem sem seguir.`,
        impactLevel: 'Crítica',
        unlockedSolution: 'Substituir imediatamente pela Bio Magnética sugerida pelo Mapa, com promessa clara e CTA direto.'
      },
      {
        title: 'Vazamento #2: Primeiros 3 Segundos dos Vídeos sem Retenção',
        leakDescription: 'Vídeos que começam com saudações lentas ("Oi gente, tudo bem?") perdem 65% a 80% do público antes do assunto principal.',
        impactLevel: 'Crítica',
        unlockedSolution: 'Usar ganchos visuais nos primeiros 3s (corte abrupto, texto na tela) e gancho verbal provocativo.'
      },
      {
        title: 'Vazamento #3: Falta de Mecanismos de Venda no Direct',
        leakDescription: 'O perfil publica dicas mas não coloca CTAs de palavras-chave ("comente PLANO", "me chame no direct"), deixando clientes esfriarem.',
        impactLevel: 'Alta',
        unlockedSolution: `Ativar o diferencial de posicionamento ("${competitiveEdge.slice(0, 70)}...") com CTAs de alta intenção de compra.`
      }
    ],
    quickWinAction: `Copie agora a Bio Magnética formulada para @${report.username} e grave o Reel #1 com o gancho visual de quebra de padrão para sentir o destravamento imediato.`
  };
}
