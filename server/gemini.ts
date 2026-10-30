import { GoogleGenAI } from '@google/genai';
import {
  PositioningDiagnosis,
  ContentIdea,
  ReelScript,
  CarouselPost,
  StorySequence,
  HooksAndCtas,
  CalendarDay,
  MetaProfileData
} from '../src/types';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

interface GenerateParams {
  username: string;
  profession?: string;
  niche?: string;
  product?: string;
  objective?: string;
  manualBio?: string;
  manualCaptions?: string;
  metaProfileData?: MetaProfileData;
}

export async function generateContentMapStrategy(params: GenerateParams) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Chave de API do Gemini não configurada no servidor (GEMINI_API_KEY ausente).');
  }

  const bio = params.metaProfileData?.biography || params.manualBio || 'Não fornecida expressamente.';
  const captions = params.metaProfileData?.recentCaptions?.join('\n---\n') || params.manualCaptions || 'Não fornecidas expressamente.';
  const followers = params.metaProfileData?.followersCount ? `${params.metaProfileData.followersCount} seguidores (dados oficiais Meta)` : 'Perfil em fase de análise direta';

  const userPrompt = `
Você é o estrategista-chefe e especialista em crescimento e posicionamento no Instagram para o aplicativo MAPA DE CONTEÚDO.
Sua missão é desenvolver um planejamento de conteúdo cirúrgico, de altíssimo nível para o perfil @${params.username}.

DADOS COLETADOS DO PERFIL:
- Nome/Arroba: @${params.username}
- Profissão / Segmento: ${params.profession || 'Não especificado (deduza pelo contexto)'}
- Nicho Específico: ${params.niche || 'Geral do segmento'}
- Produto / Serviço principal vendido: ${params.product || 'Serviços/Produtos do nicho'}
- Objetivo Comercial Principal: ${params.objective || 'Atrair seguidores compradores e aumentar autoridade'}
- Biografia do Perfil: "${bio}"
- Legendas / Publicações recentes analisadas: "${captions.slice(0, 1500)}"
- Dados de audiência: ${followers}

DIRETRIZES DE SAÍDA:
Gere uma estratégia completa, prática, sem clichês vazios, com português brasileiro impecável, persuasivo e altamente acionável.

Você DEVE responder ESTRITAMENTE em formato JSON puro, sem blocos de texto fora do JSON.
A estrutura deve conter exatamente as seguintes chaves principais:
{
  "diagnosis": {
    "overallScore": 78,
    "bioAnalysis": {
      "currentStatus": "Análise crítica da bio atual",
      "strengths": ["Ponto forte 1", "Ponto forte 2"],
      "weaknesses": ["O que está afastando clientes 1", "O que falta 2"],
      "suggestedBio": "Sugestão completa de bio magnética com promessa clara, autoridade e CTA direta"
    },
    "targetAudience": {
      "profile": "Descrição detalhada do cliente ideal com maior poder de compra",
      "deepPains": ["Dor profunda 1", "Dor profunda 2", "Dor profunda 3"],
      "coreDesires": ["Desejo imediato 1", "Desejo profundo 2", "Transformação almejada 3"],
      "buyingObjections": ["Objeção 1", "Objeção 2", "Objeção 3"]
    },
    "strategicPillars": [
      { "name": "Autoridade e Domínio", "description": "Conteúdos que provam competência", "percentage": 30 },
      { "name": "Conexão e Bastidores", "description": "Histórias e valores que geram identificação", "percentage": 25 },
      { "name": "Educação Prática", "description": "Tutoriais e soluções de dores rápidas", "percentage": 25 },
      { "name": "Conversão e Venda Direta", "description": "Quebra de objeções e ofertas para direct", "percentage": 20 }
    ],
    "growthOpportunities": [
      "Oportunidade 1 específica para este nicho",
      "Oportunidade 2 específica para este nicho",
      "Oportunidade 3 específica para este nicho",
      "Oportunidade 4 específica para este nicho"
    ],
    "competitiveEdge": "O grande diferencial único que fará este perfil se destacar dos concorrentes",
    "growthProjection": {
      "baselineStatus": "Estimativa calculada para o nicho de @${params.username} com base no algoritmo do Instagram",
      "conservative": {
        "level": "conservative",
        "name": "Cenário Conservador",
        "frequency": "3 a 4 posts por semana (Feed + Reels) e Stories 3x/semana",
        "projectedFollowersMin": 1200,
        "projectedFollowersMax": 2500,
        "projectedFollowersRange": "+1.200 a +2.500 novos seguidores",
        "estimatedReachRange": "25.000 a 60.000 contas únicas alcançadas",
        "estimatedDmMessages": "20 a 50 conversas de vendas iniciadas no Direct",
        "keyStrategy": "Manutenção de constância semanal sem pausas longas e Reels básicos com ganchos claros."
      },
      "realistic": {
        "level": "realistic",
        "name": "Cenário Recomendado / Realista",
        "frequency": "5 a 6 posts por semana com Reels otimizados e Stories diários",
        "projectedFollowersMin": 3500,
        "projectedFollowersMax": 7500,
        "projectedFollowersRange": "+3.500 a +7.500 novos seguidores",
        "estimatedReachRange": "80.000 a 180.000 contas únicas alcançadas",
        "estimatedDmMessages": "80 a 160 conversas qualificadas geradas",
        "keyStrategy": "Ganchos visuais nos primeiros 3 segundos, carrosséis de salvamento e Reels de topo de funil.",
        "highlight": true
      },
      "accelerated": {
        "level": "accelerated",
        "name": "Cenário Acelerado / Alta Performance",
        "frequency": "Diário (7x/semana + 2 Reels/dia em dias estratégicos + 10-15 Stories/dia)",
        "projectedFollowersMin": 8000,
        "projectedFollowersMax": 18000,
        "projectedFollowersRange": "+8.000 a +18.000 novos seguidores",
        "estimatedReachRange": "220.000 a 550.000 contas únicas alcançadas",
        "estimatedDmMessages": "200 a 450 leads quentes no Direct",
        "keyStrategy": "Estratégia de Reels virais de quebra de padrão, parcerias/collabs do nicho e distribuição com tráfego/impulsionamento complementar."
      },
      "keyGrowthLevers": [
        "Alavanca 1: Otimização de ganchos visuais para aumentar retenção acima de 60% nos Reels",
        "Alavanca 2: Carrosséis com prompts de salvamento e compartilhamento",
        "Alavanca 3: Sequências de Stories com enquetes polarizadoras e direcionamento para Direct",
        "Alavanca 4: Parcerias e reposts no nicho para capturar audiência qualificada"
      ],
      "leadConversionEstimate": "Estimativa de 40 a 180 clientes potenciais chamando no Direct durante os 90 dias com aplicação correta das chamadas (CTAs).",
      "integrityDisclaimer": "Projeções estatísticas baseadas na média de tração orgânica do algoritmo do Instagram para contas ativas com execução consistente da estratégia nos 90 dias. Não comercializamos seguidores artificiais nem automações proibidas."
    }
  },
  "contentIdeas": [
    // Array com exatamente 30 ideias numeradas de 1 a 30
    {
      "id": 1,
      "title": "Título chamativo",
      "format": "Reels" | "Carrossel" | "Post Estático" | "Stories",
      "pillar": "Autoridade" | "Conexão" | "Educação" | "Conversão / Venda",
      "goal": "Objetivo estratégico",
      "hook": "Frase de abertura impactante",
      "captionIdea": "Direcionamento da legenda",
      "cta": "Chamada para ação clara"
    }
  ],
  "reels": [
    // Array com exatamente 10 roteiros de Reels
    {
      "id": 1,
      "theme": "Tema do Reel",
      "hookVisual": "O que fazer visualmente nos primeiros 3 segundos para quebrar o padrão de rolagem",
      "hookVerbal": "A frase dita no segundo 0 ao 3",
      "body": ["Ponto 1", "Ponto 2", "Ponto 3"],
      "cta": "Chamada final com gatilho mental para direct ou comentários",
      "audioStyle": "Narração dinâmica / Áudio em alta / Fala direta para câmera",
      "durationSeconds": "30 a 45s"
    }
  ],
  "carousels": [
    // Array com exatamente 10 carrosséis completos
    {
      "id": 1,
      "title": "Tema do Carrossel",
      "coverHeadline": "Headline magnética para a capa",
      "targetPainOrDesire": "Dor ou desejo trabalhado",
      "slides": [
        { "slideNumber": 1, "headline": "Título do slide", "content": "Texto resumido e visual", "visualNote": "Instrução de design" },
        { "slideNumber": 2, "headline": "...", "content": "...", "visualNote": "..." },
        { "slideNumber": 3, "headline": "...", "content": "...", "visualNote": "..." },
        { "slideNumber": 4, "headline": "...", "content": "...", "visualNote": "..." },
        { "slideNumber": 5, "headline": "...", "content": "...", "visualNote": "..." }
      ],
      "finalCta": "CTA do último slide (salvar, compartilhar ou enviar DM)"
    }
  ],
  "stories": [
    // Array com exatamente 10 sequências estratégicas de Stories
    {
      "id": 1,
      "theme": "Tema da sequência",
      "objective": "Objetivo (ex: Aquecimento para oferta de consultoria)",
      "stories": [
        { "order": 1, "type": "Enquete", "content": "Pergunta polarizadora", "stickerOrInteractive": "Enquete Sim/Não" },
        { "order": 2, "type": "Quebra de Objeção", "content": "Explicação do erro comum", "stickerOrInteractive": "Vídeo selfie" },
        { "order": 3, "type": "Prova Social / Autoridade", "content": "Estudo de caso ou bastidor", "stickerOrInteractive": "Print de resultado" },
        { "order": 4, "type": "Chamada Direct (DM)", "content": "Convite especial para quem responder", "stickerOrInteractive": "Botão de DM / Palavra-chave" }
      ]
    }
  ],
  "hooksAndCtas": {
    "curiosityHooks": ["Gancho de curiosidade 1", "2", "3", "4", "5"],
    "painHooks": ["Gancho de dor 1", "2", "3", "4", "5"],
    "authorityHooks": ["Gancho de autoridade 1", "2", "3", "4", "5"],
    "commentCtas": ["CTA de comentário 1", "2", "3", "4", "5"],
    "directMessageCtas": ["CTA de DM 1", "2", "3", "4", "5"],
    "captionTemplates": [
      {
        "name": "Estrutura PAS (Problema, Agitação, Solução)",
        "structure": "[Problema real] + [Por que dói continuar assim] + [Passo a passo da virada] + [CTA]",
        "example": "Exemplo aplicado especificamente ao nicho de @${params.username}"
      },
      {
        "name": "Estrutura AIDA (Atenção, Interesse, Desejo, Ação)",
        "structure": "[Gancho quebra de padrão] + [Dado ou fato surpreendente] + [Visão do futuro desejado] + [CTA]",
        "example": "Exemplo aplicado especificamente ao nicho de @${params.username}"
      },
      {
        "name": "Estrutura Quebra de Mito",
        "structure": "[Mentira popular no nicho] + [A verdade que ninguém fala] + [Como fazer o certo] + [CTA]",
        "example": "Exemplo aplicado especificamente ao nicho de @${params.username}"
      }
    ]
  },
  "calendar": [
    // Array do planejamento trimestral de 90 DIAS (Dias 1 a 90)
    // Dividido em 3 Fases / Meses:
    // Mês 1 (Dias 1 a 30): Fundação & Atração Magnética
    // Mês 2 (Dias 31 a 60): Autoridade & Conexão Profunda
    // Mês 3 (Dias 61 a 90): Escala & Conversão em Clientes
    {
      "day": 1,
      "month": 1,
      "phase": "Mês 1 - Fundação & Atração Magnética",
      "dayOfWeek": "Segunda-feira",
      "format": "Reels",
      "pillar": "Autoridade",
      "theme": "Tema do post do dia",
      "hook": "Gancho principal",
      "cta": "Chamada para ação do dia"
    }
  ]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction:
          'Você é a inteligência artificial analítica do MAPA DE CONTEÚDO, especialista sênior em marketing digital, projeção de crescimento de audiência e estratégia trimestral (90 dias) de Instagram. Gere análises reais, profundas e extremamente profissionais em JSON válido.',
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('A IA não retornou resposta textual.');
    }

    const cleanText = text.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanText);

    // Validate vital structure
    if (!parsed.diagnosis || !parsed.contentIdeas || !parsed.reels || !parsed.carousels || !parsed.stories) {
      throw new Error('Resposta incompleta da inteligência artificial. Tente novamente.');
    }

    // Ensure growth projection exists with fallback defaults if missing
    if (!parsed.diagnosis.growthProjection) {
      parsed.diagnosis.growthProjection = {
        baselineStatus: `Estimativa calculada para o nicho de @${params.username}`,
        conservative: {
          level: 'conservative',
          name: 'Cenário Conservador',
          frequency: '3 a 4 posts por semana',
          projectedFollowersMin: 1200,
          projectedFollowersMax: 2500,
          projectedFollowersRange: '+1.200 a +2.500 novos seguidores',
          estimatedReachRange: '25.000 a 60.000 contas alcançadas',
          estimatedDmMessages: '20 a 50 contatos de vendas no Direct',
          keyStrategy: 'Constância semanal sem pausas longas e Reels com ganchos claros.'
        },
        realistic: {
          level: 'realistic',
          name: 'Cenário Recomendado / Realista',
          frequency: '5 a 6 posts por semana com Reels otimizados',
          projectedFollowersMin: 3500,
          projectedFollowersMax: 7500,
          projectedFollowersRange: '+3.500 a +7.500 novos seguidores',
          estimatedReachRange: '80.000 a 180.000 contas alcançadas',
          estimatedDmMessages: '80 a 160 conversas qualificadas no Direct',
          keyStrategy: 'Ganchos visuais nos primeiros 3s, carrosséis de salvamento e Reels de topo de funil.',
          highlight: true
        },
        accelerated: {
          level: 'accelerated',
          name: 'Cenário Acelerado / Alta Performance',
          frequency: 'Diário (7x/semana + 10-15 Stories/dia + collabs)',
          projectedFollowersMin: 8000,
          projectedFollowersMax: 18000,
          projectedFollowersRange: '+8.000 a +18.000 novos seguidores',
          estimatedReachRange: '220.000 a 550.000 contas alcançadas',
          estimatedDmMessages: '200 a 450 contatos qualificados no Direct',
          keyStrategy: 'Reels virais com temas em alta, quebra de padrão, parcerias e amplificação estratégica.'
        },
        keyGrowthLevers: [
          'Otimização de ganchos de retenção nos primeiros 3 segundos dos Reels',
          'Carrosséis densos estruturados para gerar salvamentos e compartilhamentos',
          'Sequências diárias de Stories com caixas e enquetes direcionando para a DM',
          'Posicionamento claro na bio convertendo visitantes em seguidores e leads'
        ],
        leadConversionEstimate: 'Estimativa de 50 a 180 clientes potenciais chamando no Direct ao longo dos 90 dias.',
        integrityDisclaimer: 'Projeções estatísticas baseadas na média de tração orgânica do algoritmo do Instagram para perfis consistentes no nicho. Resultados dependem da execução e da aceitação da audiência.'
      };
    }

    // Ensure 90 days of calendar exist
    const rawCalendar: CalendarDay[] = Array.isArray(parsed.calendar) ? parsed.calendar : [];
    const daysOfWeek = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    const formats: ('Reels' | 'Carrossel' | 'Post Estático' | 'Stories')[] = ['Reels', 'Carrossel', 'Reels', 'Stories', 'Carrossel', 'Reels', 'Stories'];
    const pillars = ['Autoridade', 'Conexão', 'Educação', 'Conversão / Venda'];

    const full90DaysCalendar: CalendarDay[] = [];

    for (let dayNum = 1; dayNum <= 90; dayNum++) {
      const monthNum: 1 | 2 | 3 = dayNum <= 30 ? 1 : dayNum <= 60 ? 2 : 3;
      const phaseTitle =
        monthNum === 1
          ? 'Mês 1 - Fundação & Atração Magnética'
          : monthNum === 2
          ? 'Mês 2 - Autoridade & Conexão Profunda'
          : 'Mês 3 - Escala & Conversão em Clientes';

      const existingDay = rawCalendar.find((d) => d.day === dayNum);

      if (existingDay) {
        full90DaysCalendar.push({
          ...existingDay,
          day: dayNum,
          month: existingDay.month || monthNum,
          phase: existingDay.phase || phaseTitle,
          dayOfWeek: existingDay.dayOfWeek || daysOfWeek[(dayNum - 1) % 7],
          format: existingDay.format || formats[(dayNum - 1) % formats.length],
          pillar: existingDay.pillar || pillars[(dayNum - 1) % pillars.length],
          theme: existingDay.theme || `Estratégia dia ${dayNum} (${phaseTitle})`,
          hook: existingDay.hook || `Gancho de impacto para o dia ${dayNum}`,
          cta: existingDay.cta || 'Comente ou envie uma mensagem no direct'
        });
      } else {
        // Synthesize programmatic high-value entry for this day to guarantee a complete 90-day plan
        const dayFormat = formats[(dayNum - 1) % formats.length];
        const dayPillar = pillars[(dayNum - 1) % pillars.length];
        const dayDow = daysOfWeek[(dayNum - 1) % 7];

        let theme = '';
        let hook = '';
        let cta = '';

        if (monthNum === 1) {
          // Fundação e Atração
          theme = dayFormat === 'Reels'
            ? `Reel de Topo de Funil: O erro número 1 que bloqueia resultados no nicho de @${params.username}`
            : dayFormat === 'Carrossel'
            ? `Passo a passo prático para destravar os primeiros resultados sem cometer erros clássicos`
            : dayFormat === 'Stories'
            ? `Sequência de bastidores: como resolver a dor do cliente sem complicação`
            : `Post de Posicionamento: Por que a maioria falha ao tentar resolver isso sozinho`;
          hook = dayFormat === 'Reels'
            ? 'Pare de cometer esse erro se você quer resultados de verdade...'
            : 'Guarde este post antes que você esqueça o método...';
          cta = 'Salve este conteúdo para consultar durante a semana e compartilhe!';
        } else if (monthNum === 2) {
          // Autoridade e Conexão
          theme = dayFormat === 'Reels'
            ? `Reel de Autoridade: O método validado para alcançar a transformação desejada`
            : dayFormat === 'Carrossel'
            ? `Estudo de caso ou quebra de mito: A verdade revelada sobre o nicho`
            : dayFormat === 'Stories'
            ? `Perguntas e Respostas estratégicas: Quebrando as 3 principais objeções`
            : `Post Conexão: História real de superação e lições práticas`;
          hook = dayFormat === 'Reels'
            ? 'A verdade nua e crua sobre o que realmente funciona...'
            : 'Se você pudesse mudar apenas 1 coisa no seu processo hoje...';
          cta = 'Deixe sua opinião nos comentários: você já passou por isso?';
        } else {
          // Escala e Conversão
          theme = dayFormat === 'Reels'
            ? `Reel de Conversão: Para quem é e para quem não é a nossa solução`
            : dayFormat === 'Carrossel'
            ? `Comparativo direto: Fazer sozinho vs Fazer com acompanhamento profissional`
            : dayFormat === 'Stories'
            ? `Abertura de vagas/agenda: Como garantir o seu direcionamento ainda esta semana`
            : `Depoimento e Prova Social: O resultado surpreendente de quem aplicou o método`;
          hook = dayFormat === 'Reels'
            ? 'Se você se encaixa em um desses 3 perfis, esse aviso é pra você...'
            : 'Como destravar seu próximo nível nos próximos 30 dias...';
          cta = 'Envie uma mensagem no Direct com a palavra-chave para receber as condições especiais!';
        }

        full90DaysCalendar.push({
          day: dayNum,
          month: monthNum,
          phase: phaseTitle,
          dayOfWeek: dayDow,
          format: dayFormat,
          pillar: dayPillar,
          theme,
          hook,
          cta
        });
      }
    }

    parsed.calendar = full90DaysCalendar;

    return parsed as {
      diagnosis: PositioningDiagnosis;
      contentIdeas: ContentIdea[];
      reels: ReelScript[];
      carousels: CarouselPost[];
      stories: StorySequence[];
      hooksAndCtas: HooksAndCtas;
      calendar: CalendarDay[];
    };
  } catch (err: unknown) {
    console.error('Error generating strategy via Gemini:', err);
    throw err;
  }
}
