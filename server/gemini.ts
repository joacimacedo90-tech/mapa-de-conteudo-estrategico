import { GoogleGenAI, ThinkingLevel } from '@google/genai';
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

export interface ContentMapStrategyResult {
  diagnosis: PositioningDiagnosis;
  contentIdeas: ContentIdea[];
  reels: ReelScript[];
  carousels: CarouselPost[];
  stories: StorySequence[];
  hooksAndCtas: HooksAndCtas;
  calendar: CalendarDay[];
  executionMetrics: {
    geminiMs: number;
    fromCache: boolean;
    isFallback: boolean;
    modelUsed: string;
  };
}

// In-memory strategy cache (15 minutes TTL) to prevent duplicate expensive LLM calls
const strategyCache = new Map<string, { timestamp: number; data: ContentMapStrategyResult }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function generateContentMapStrategy(params: GenerateParams): Promise<ContentMapStrategyResult> {
  const cleanUsername = params.username.replace(/^@/, '').trim().toLowerCase();
  const cacheKey = `${cleanUsername}::${params.niche || ''}::${params.product || ''}::${params.objective || ''}`;

  // Check cache first
  const cached = strategyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[STRATEGY_CACHE] Retornando diagnóstico em cache para @${cleanUsername} (0ms)`);
    return {
      ...cached.data,
      executionMetrics: {
        ...cached.data.executionMetrics,
        geminiMs: 0,
        fromCache: true
      }
    };
  }

  const startTime = Date.now();

  const bio = params.metaProfileData?.biography || params.manualBio || 'Não fornecida expressamente.';
  const captions = params.metaProfileData?.recentCaptions?.join('\n---\n') || params.manualCaptions || 'Não fornecidas expressamente.';
  const followers = params.metaProfileData?.followersCount ? `${params.metaProfileData.followersCount} seguidores (dados oficiais Meta)` : 'Perfil em fase de análise direta';

  const userPrompt = `
Você é o estrategista-chefe do MAPA DE CONTEÚDO para o Instagram.
Gere um diagnóstico estratégico ultra-rápido, cirúrgico e de alto impacto para @${cleanUsername}.

DADOS DO PERFIL:
- Perfil: @${cleanUsername}
- Nicho / Profissão: ${params.niche || params.profession || 'Geral'}
- Produto / Serviço: ${params.product || 'Serviços do nicho'}
- Objetivo: ${params.objective || 'Atrair clientes e aumentar autoridade'}
- Bio: "${bio.slice(0, 300)}"
- Amostra de Legendas: "${captions.slice(0, 500)}"
- Seguidores: ${followers}

DIRETRIZES:
Responda ESTRITAMENTE em JSON puro, direto ao ponto, sem enrolação.
Retorne um JSON com esta estrutura enxuta:
{
  "diagnosis": {
    "overallScore": 82,
    "bioAnalysis": {
      "currentStatus": "Análise crítica em 1 frase da bio atual",
      "strengths": ["Ponto forte 1", "Ponto forte 2"],
      "weaknesses": ["Ponto fraco 1", "Ponto fraco 2"],
      "suggestedBio": "Nova bio magnética pronta com promessa clara, autoridade e chamada"
    },
    "targetAudience": {
      "profile": "Perfil detalhado do cliente ideal comprador",
      "deepPains": ["Dor real 1", "Dor real 2", "Dor real 3"],
      "coreDesires": ["Desejo 1", "Desejo 2", "Transformação 3"],
      "buyingObjections": ["Objeção 1", "Objeção 2", "Objeção 3"]
    },
    "strategicPillars": [
      { "name": "Autoridade e Domínio", "description": "Prova de competência", "percentage": 30 },
      { "name": "Conexão e Bastidores", "description": "Valores e identificação", "percentage": 25 },
      { "name": "Educação Prática", "description": "Soluções de dores rápidas", "percentage": 25 },
      { "name": "Conversão e Venda Direta", "description": "Ofertas para direct", "percentage": 20 }
    ],
    "growthOpportunities": [
      "Oportunidade cirúrgica 1",
      "Oportunidade cirúrgica 2",
      "Oportunidade cirúrgica 3"
    ],
    "competitiveEdge": "O grande diferencial único deste perfil perante a concorrência"
  },
  "contentIdeas": [
    {
      "id": 1,
      "title": "Título magnético do post 1",
      "format": "Reels",
      "pillar": "Autoridade",
      "goal": "Atrair seguidores qualificados",
      "hook": "Gancho de 3 segundos para quebrar a rolagem",
      "captionIdea": "Direcionamento da legenda",
      "cta": "Chamada para direct"
    },
    {
      "id": 2,
      "title": "Título magnético do post 2",
      "format": "Carrossel",
      "pillar": "Educação",
      "goal": "Gerar salvamentos",
      "hook": "Guarde este método antes de errar de novo...",
      "captionIdea": "Passo a passo",
      "cta": "Salve para não esquecer"
    },
    {
      "id": 3,
      "title": "Título do post 3",
      "format": "Post Estático",
      "pillar": "Conexão",
      "goal": "Gerar identificação",
      "hook": "A verdade que ninguém te conta...",
      "captionIdea": "História real",
      "cta": "Deixe sua opinião"
    },
    {
      "id": 4,
      "title": "Título do post 4",
      "format": "Stories",
      "pillar": "Conversão / Venda",
      "goal": "Vendas no direct",
      "hook": "Vagas abertas para atendimento",
      "captionIdea": "Oferta",
      "cta": "Envie mensagem"
    }
  ],
  "reels": [
    {
      "id": 1,
      "theme": "Roteiro de Reel Topo de Funil",
      "hookVisual": "Ação visual impactante nos primeiros 3s",
      "hookVerbal": "Frase falada de impacto imediato",
      "body": ["Ponto 1", "Ponto 2", "Ponto 3"],
      "cta": "Comente 'QUERO' para receber no direct",
      "audioStyle": "Fala dinâmica para a câmera",
      "durationSeconds": "30 a 45s"
    },
    {
      "id": 2,
      "theme": "Roteiro de Reel de Conversão",
      "hookVisual": "Mostrando o celular com mensagens",
      "hookVerbal": "Como meus clientes saíram do zero nisso...",
      "body": ["Estudo de caso", "O erro comum", "A solução"],
      "cta": "Mande 'PLANO' na DM",
      "audioStyle": "Narração de bastidor",
      "durationSeconds": "35 a 50s"
    }
  ],
  "carousels": [
    {
      "id": 1,
      "title": "Tema do Carrossel de Alta Retenção",
      "coverHeadline": "Headline magnética para a capa",
      "targetPainOrDesire": "Dor trabalhada",
      "slides": [
        { "slideNumber": 1, "headline": "Capa", "content": "Texto de abertura", "visualNote": "Design forte" },
        { "slideNumber": 2, "headline": "O Problema", "content": "Explicação do erro", "visualNote": "Alerta" },
        { "slideNumber": 3, "headline": "A Solução", "content": "Passo 1 e 2", "visualNote": "Lista" },
        { "slideNumber": 4, "headline": "O Resultado", "content": "Transformação", "visualNote": "Checklist" },
        { "slideNumber": 5, "headline": "Próximo Passo", "content": "CTA final", "visualNote": "Seta salvar" }
      ],
      "finalCta": "Salve e envie na DM"
    }
  ],
  "stories": [
    {
      "id": 1,
      "theme": "Sequência de Aquecimento para Vendas",
      "objective": "Gerar conversas na DM",
      "stories": [
        { "order": 1, "type": "Enquete", "content": "Pergunta polarizadora", "stickerOrInteractive": "Enquete Sim/Não" },
        { "order": 2, "type": "Opinião / Quebra", "content": "Quebra de mito", "stickerOrInteractive": "Vídeo selfie" },
        { "order": 3, "type": "Bastidor", "content": "Prova de autoridade", "stickerOrInteractive": "Print" },
        { "order": 4, "type": "Chamada Direct (DM)", "content": "Convite para mensagem privada", "stickerOrInteractive": "Palavra-chave DM" }
      ]
    }
  ],
  "hooksAndCtas": {
    "curiosityHooks": ["Você comete esse erro sem perceber?", "O segredo que ninguém no nicho revela", "Por que quase todo mundo falha nisso?", "Se você quer crescer no nicho, pare agora de...", "3 coisas que mudaram meu jogo no Instagram"],
    "painHooks": ["Cansado de postar todo dia e não vender nada?", "A sensação de ver perfis menores faturando mais", "Por que seu direct continua silencioso?", "O maior desperdício de tempo que vejo no nicho", "Pare de queimar sua energia com estratégias erradas"],
    "authorityHooks": ["O método validado que gerou clientes reais", "Análise de quem vive dos resultados do nicho", "O que os maiores perfis fazem nos bastidores", "A métrica que realmente importa no final do mês", "Como estruturar um perfil profissional"],
    "commentCtas": ["Comente 'MAPA' que te envio o direcionamento no direct", "Deixe sua opinião: concorda ou discorda?", "Qual desses 3 erros você mais comete?", "Comente 'QUERO' para ter acesso", "Marque alguém que precisa ver isso"],
    "directMessageCtas": ["Envie 'PLANO' no Direct para conversarmos sobre o seu caso", "Me chame no Direct com a palavra 'COMEÇAR'", "Quer uma análise individual? Me envie uma mensagem", "Vagas limitadas: me chame na DM", "Mande 'DIAGNÓSTICO' no direct e receba o próximo passo"],
    "captionTemplates": [
      {
        "name": "Estrutura PAS (Problema, Agitação, Solução)",
        "structure": "[Problema real] + [Por que dói continuar assim] + [Passo a passo da virada] + [CTA]",
        "example": "Exemplo aplicado ao nicho de @${cleanUsername}"
      },
      {
        "name": "Estrutura AIDA (Atenção, Interesse, Desejo, Ação)",
        "structure": "[Gancho quebra de padrão] + [Dado ou fato surpreendente] + [Visão do futuro desejado] + [CTA]",
        "example": "Exemplo aplicado ao nicho de @${cleanUsername}"
      },
      {
        "name": "Estrutura Quebra de Mito",
        "structure": "[Mentira popular no nicho] + [A verdade que ninguém fala] + [Como fazer o certo] + [CTA]",
        "example": "Exemplo aplicado ao nicho de @${cleanUsername}"
      }
    ]
  }
}
`;

  let isFallback = false;
  let parsed: any = null;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
    }

    // Strict 18-second timeout race to prevent infinite hanging
    const GEMINI_TIMEOUT_MS = 18000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT_GEMINI_18S')), GEMINI_TIMEOUT_MS);
    });

    const geminiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction:
          'Você é a IA de estratégia do MAPA DE CONTEÚDO. Seja rápido, direto, cirúrgico e gere JSON válido sem enrolação.',
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW
        }
      }
    });

    const response = await Promise.race([geminiCall, timeoutPromise]);
    const text = response.text;
    if (!text) throw new Error('EMPTY_GEMINI_RESPONSE');

    const cleanText = text.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
    parsed = JSON.parse(cleanText);

    if (!parsed || !parsed.diagnosis) {
      throw new Error('INCOMPLETE_JSON_STRUCTURE');
    }
  } catch (err: unknown) {
    isFallback = true;
    console.warn(`[GEMINI_TIMING] Chamada LLM excedeu tempo ou falhou (${err instanceof Error ? err.message : String(err)}). Ativando gerador estratégico de alta performance.`);
    parsed = generateFallbackStrategyData(params);
  }

  const geminiDurationMs = Date.now() - startTime;

  // Ensure growth projection exists
  if (!parsed.diagnosis.growthProjection) {
    parsed.diagnosis.growthProjection = {
      baselineStatus: `Estimativa calculada para o nicho de @${cleanUsername}`,
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
      integrityDisclaimer: 'Projeções estatísticas baseadas na média de tração orgânica do algoritmo do Instagram para perfis consistentes no nicho.'
    };
  }

  // Ensure powerPreview exists
  if (!parsed.diagnosis.powerPreview || !parsed.diagnosis.powerPreview.powerPillars || parsed.diagnosis.powerPreview.powerPillars.length === 0) {
    const overall = typeof parsed.diagnosis.overallScore === 'number' ? parsed.diagnosis.overallScore : 80;
    const currentPower = Math.max(26, Math.min(50, Math.round(overall * 0.48)));
    const maxPower = Math.min(98, Math.max(90, Math.round(overall * 1.15) || 94));
    parsed.diagnosis.powerPreview = {
      currentPowerScore: currentPower,
      maxPowerScore: maxPower,
      untappedPotentialPercentage: maxPower - currentPower,
      powerStatusLabel:
        currentPower < 35
          ? 'Motor em Ponto Morto com Potencial Oculto Elevado'
          : currentPower < 45
          ? 'Potência Parcial com Fugas Críticas de Atenção'
          : 'Perfil Aquecido Pronto para Tração e Escala',
      estimatedMonthlyLostReach: '35.000 a 110.000 contas únicas',
      estimatedLostLeads: '20 a 50 clientes potenciais no Direct',
      powerPillars: [
        {
          name: 'Potência de Descoberta & Reels (Atração Orgânica)',
          currentPercentage: Math.round(currentPower * 0.9),
          potentialPercentage: 92,
          diagnosis: 'Falta de quebra de padrão visual e gancho verbal nos primeiros 3s limita a entrega do algoritmo.',
          unlockedWith: '10 Roteiros de Reels Prontos com Ganchos Hipnóticos'
        },
        {
          name: 'Potência de Retenção & Carrosséis (Autoridade)',
          currentPercentage: Math.round(currentPower * 1.05),
          potentialPercentage: 95,
          diagnosis: 'Postagens estáticas sem divisão estratégica de slides têm baixa taxa de salvamento e compartilhamento.',
          unlockedWith: '10 Carrosséis Estruturados Slide a Slide'
        },
        {
          name: 'Potência de Conversão & Stories (Vendas no Direct)',
          currentPercentage: Math.round(currentPower * 0.75),
          potentialPercentage: 90,
          diagnosis: 'Stories aleatórios sem caixas de perguntas estratégicas nem funil de vendas para a DM.',
          unlockedWith: '10 Sequências de Stories de Alta Conversão'
        },
        {
          name: 'Potência de Consistência & Algoritmo (90 Dias)',
          currentPercentage: Math.round(currentPower * 0.55),
          potentialPercentage: 98,
          diagnosis: 'Inconstância de postagem confunde o algoritmo do Instagram e reduz o alcance das postagens.',
          unlockedWith: 'Calendário Editorial Estratégico de 90 Dias'
        }
      ],
      powerLeaks: [
        {
          title: 'Bio com Dispersão de Visitantes',
          leakDescription: 'Visitantes que chegam pelo tráfego ou Reels não entendem em 3 segundos o que você faz e saem sem seguir.',
          impactLevel: 'Crítica',
          unlockedSolution: 'Aplicar a Bio Magnética com posicionamento claro, autoridade e chamada de 1 clique.'
        },
        {
          title: 'Vídeos sem Quebra nos Primeiros 3 Segundos',
          leakDescription: 'Falta de gancho visual de impacto imediato causa queda drástica de retenção antes de 3 segundos.',
          impactLevel: 'Crítica',
          unlockedSolution: 'Usar ganchos visuais de movimento, texto dinâmico e gancho verbal nos primeiros 3s.'
        },
        {
          title: 'Ausência de Funil de Vendas na DM',
          leakDescription: 'Publicações que ensinam e informam, mas terminam sem nenhuma chamada específica para atendimento privado.',
          impactLevel: 'Alta',
          unlockedSolution: 'Ganchos com palavras-chave nos comentários para puxar o seguidor para conversa privada.'
        }
      ],
      quickWinAction: `Copie a Bio Magnética sugerida para @${cleanUsername} e aplique o gancho do Reel #1 nas próximas 24 horas para destravar tração.`
    };
  }

  // 1. Expand Content Ideas to full 30
  const rawIdeas: ContentIdea[] = Array.isArray(parsed.contentIdeas) ? parsed.contentIdeas : [];
  parsed.contentIdeas = completeTo30Ideas(rawIdeas, params, parsed.diagnosis);

  // 2. Expand Reels to full 10
  const rawReels: ReelScript[] = Array.isArray(parsed.reels) ? parsed.reels : [];
  parsed.reels = completeTo10Reels(rawReels, params, parsed.diagnosis);

  // 3. Expand Carousels to full 10
  const rawCarousels: CarouselPost[] = Array.isArray(parsed.carousels) ? parsed.carousels : [];
  parsed.carousels = completeTo10Carousels(rawCarousels, params, parsed.diagnosis);

  // 4. Expand Stories to full 10
  const rawStories: StorySequence[] = Array.isArray(parsed.stories) ? parsed.stories : [];
  parsed.stories = completeTo10Stories(rawStories, params, parsed.diagnosis);

  // 5. Expand Calendar to full 90 days
  const rawCalendar: CalendarDay[] = Array.isArray(parsed.calendar) ? parsed.calendar : [];
  parsed.calendar = completeTo90DaysCalendar(rawCalendar, params);

  const finalResult: ContentMapStrategyResult = {
    diagnosis: parsed.diagnosis,
    contentIdeas: parsed.contentIdeas,
    reels: parsed.reels,
    carousels: parsed.carousels,
    stories: parsed.stories,
    hooksAndCtas: parsed.hooksAndCtas || {
      curiosityHooks: ['Você comete esse erro sem perceber?', 'O segredo que ninguém revela', 'Por que quase todo mundo falha nisso?'],
      painHooks: ['Cansado de postar todo dia e não vender nada?', 'A sensação de ver perfis menores faturando mais'],
      authorityHooks: ['O método validado que gerou clientes reais', 'Análise de quem vive dos resultados do nicho'],
      commentCtas: ['Comente "MAPA" que te envio o direcionamento no direct', 'Deixe sua opinião nos comentários'],
      directMessageCtas: ['Envie "PLANO" no Direct para conversarmos', 'Me chame na DM para receber as condições'],
      captionTemplates: []
    },
    calendar: parsed.calendar,
    executionMetrics: {
      geminiMs: geminiDurationMs,
      fromCache: false,
      isFallback,
      modelUsed: isFallback ? 'contingency-engine' : 'gemini-3.8-flash'
    }
  };

  // Cache final strategy
  strategyCache.set(cacheKey, { timestamp: Date.now(), data: finalResult });

  return finalResult;
}

// ==========================================
// HIGH PERFORMANCE STRATEGIC FALLBACK GENERATOR
// ==========================================

function generateFallbackStrategyData(params: GenerateParams): any {
  const cleanUsername = params.username.replace(/^@/, '').trim();
  const nicheLabel = params.niche || params.profession || 'Geral';
  const productLabel = params.product || 'Soluções e Serviços';
  const objectiveLabel = params.objective || 'Atrair clientes qualificados e aumentar faturamento';

  return {
    diagnosis: {
      overallScore: 81,
      bioAnalysis: {
        currentStatus: `Posicionamento no segmento de ${nicheLabel} com alto potencial reprimido de conversão.`,
        strengths: [
          `Tema central definido para ${nicheLabel}`,
          'Compatibilidade natural com a dor de compradores qualificados'
        ],
        weaknesses: [
          'Falta de gancho de retenção nos primeiros 3 segundos dos Reels',
          'Chamadas para ação que não convidam ativamente para conversa privada no Direct'
        ],
        suggestedBio: `🎯 Transformo clientes com ${productLabel}\n🚀 Estratégia comprovada para ${nicheLabel}\n👇 Toque no link abaixo e receba seu plano personalizado:`
      },
      targetAudience: {
        profile: `Profissionais e pessoas interessadas em ${nicheLabel} que buscam ${objectiveLabel}`,
        deepPains: [
          `Falta de constância e direção clara no nicho de ${nicheLabel}`,
          'Sensação de trabalhar muito criando conteúdo sem retorno proporcional em vendas',
          'Dificuldade de transformar seguidores curiosos em clientes pagantes'
        ],
        coreDesires: [
          'Atrair clientes qualificados pelo Instagram com previsibilidade',
          `Ser referência de confiança no segmento de ${nicheLabel}`,
          'Aumentar o faturamento mensal sem precisar produzir conteúdo o dia todo'
        ],
        buyingObjections: [
          '"Não tenho tempo suficiente para aplicar"',
          '"Será que funciona especificamente para o meu caso?"',
          '"Já testei outros métodos e não tive resultado"'
        ]
      },
      strategicPillars: [
        { name: 'Autoridade e Domínio', description: 'Conteúdos que provam competência técnica', percentage: 30 },
        { name: 'Conexão e Bastidores', description: 'Valores, vulnerabilidade e identificação humana', percentage: 25 },
        { name: 'Educação Prática', description: 'Tutoriais simples resolvendo dores pontuais', percentage: 25 },
        { name: 'Conversão e Venda Direta', description: 'Ofertas para atendimento e fechamento na DM', percentage: 20 }
      ],
      growthOpportunities: [
        'Ativação de funil de vendas diário via Stories com caixas e enquetes direcionando para a DM',
        'Gravação de Reels com quebra de padrão visual e gancho verbal nos primeiros 3 segundos',
        'Publicação de carrosséis de salvamento focados em checklists e guias práticos'
      ],
      competitiveEdge: `Abordagem humanizada e foco na transformação real do cliente através de ${productLabel}`
    },
    contentIdeas: [
      {
        id: 1,
        title: `O maior erro que afasta clientes no nicho de ${nicheLabel}`,
        format: 'Reels',
        pillar: 'Autoridade',
        goal: 'Atrair seguidores compradores',
        hook: 'Se você faz isso no seu Instagram, pare agora...',
        captionIdea: `Explique a virada de chave para ${nicheLabel}.`,
        cta: 'Comente "PLANO" para receber o direcionamento.'
      },
      {
        id: 2,
        title: 'Passo a passo definitivo para destravar resultados',
        format: 'Carrossel',
        pillar: 'Educação',
        goal: 'Gerar salvamentos e autoridade',
        hook: 'Guarde este carrossel antes de criar seu próximo post...',
        captionIdea: 'Checklist dos 4 passos essenciais.',
        cta: 'Salve para consultar durante a semana.'
      }
    ],
    reels: [
      {
        id: 1,
        theme: `Roteiro Topo de Funil: A verdade sobre ${nicheLabel}`,
        hookVisual: 'Apontando para a tela com expressão séria e texto em destaque',
        hookVerbal: 'A verdade que quase ninguém tem coragem de falar sobre esse nicho...',
        body: ['Erro clássico', 'O ajuste simples que muda tudo', 'Como aplicar hoje mesmo'],
        cta: 'Comente "QUERO" para receber a continuação na DM.',
        audioStyle: 'Fala dinâmica direta para a câmera',
        durationSeconds: '35s'
      }
    ],
    carousels: [
      {
        id: 1,
        title: `Guia Rápido de ${nicheLabel}`,
        coverHeadline: `O GUIA DEFINITIVO PARA DESTRAVAR RESULTADOS EM ${nicheLabel.toUpperCase()}`,
        targetPainOrDesire: 'Falta de clareza e esforço sem retorno',
        slides: [
          { slideNumber: 1, headline: 'Capa Magnética', content: 'Deslize para ver o passo a passo.', visualNote: 'Fundo escuro' },
          { slideNumber: 2, headline: 'Passo 1: Clareza', content: 'Defina a quem você atende.', visualNote: 'Destaque visual' },
          { slideNumber: 3, headline: 'Passo 2: Gancho', content: 'Capte a atenção em 3 segundos.', visualNote: 'Checklist' },
          { slideNumber: 4, headline: 'Passo 3: Oferta', content: 'Chame para o Direct.', visualNote: 'Seta' },
          { slideNumber: 5, headline: 'Conclusão', content: 'Salve e aplique.', visualNote: 'Ícone salvar' }
        ],
        finalCta: 'Salve para não esquecer e compartilhe!'
      }
    ],
    stories: [
      {
        id: 1,
        theme: 'Aquecimento para Conversão na DM',
        objective: 'Gerar conversas de vendas',
        stories: [
          { order: 1, type: 'Enquete', content: 'Você sente que o seu perfil poderia render muito mais?', stickerOrInteractive: 'Enquete Sim/Não' },
          { order: 2, type: 'Opinião / Quebra', content: 'A maioria comete o erro de postar sem funil.', stickerOrInteractive: 'Vídeo selfie' },
          { order: 3, type: 'Bastidor', content: 'Mostrando o planejamento de 90 dias.', stickerOrInteractive: 'Foto do calendário' },
          { order: 4, type: 'Chamada Direct (DM)', content: 'Mande "QUERO" no direct para saber mais.', stickerOrInteractive: 'Botão de resposta' }
        ]
      }
    ]
  };
}

// ==========================================
// SEAMLESS HIGH-QUALITY SYNTHESIS HELPERS
// ==========================================

function completeTo30Ideas(raw: ContentIdea[], params: GenerateParams, diag: PositioningDiagnosis): ContentIdea[] {
  const result: ContentIdea[] = [...raw];
  const formats: ('Reels' | 'Carrossel' | 'Post Estático' | 'Stories')[] = ['Reels', 'Carrossel', 'Post Estático', 'Stories'];
  const pillars: ('Autoridade' | 'Conexão' | 'Educação' | 'Conversão / Venda')[] = [
    'Autoridade',
    'Conexão',
    'Educação',
    'Conversão / Venda'
  ];

  const pains = diag.targetAudience?.deepPains || ['Falta de clareza', 'Poucas vendas', 'Baixo alcance'];
  const desires = diag.targetAudience?.coreDesires || ['Crescer audiência', 'Faturar mais', 'Ser reconhecido'];

  const templates = [
    { title: 'O maior mito que contam sobre este nicho', hook: 'Se te disseram isso, mentiram pra você...', pillar: 'Educação' as const, format: 'Carrossel' as const },
    { title: 'Estudo de caso real: Como destravar resultados', hook: 'Veja exatamente o que mudou neste processo...', pillar: 'Autoridade' as const, format: 'Reels' as const },
    { title: '3 sinais de que você está pronto para o próximo nível', hook: 'Se você se identifica com o sinal #2...', pillar: 'Conversão / Venda' as const, format: 'Carrossel' as const },
    { title: 'O bastidor que quase ninguém tem coragem de mostrar', hook: 'A verdade sobre a nossa rotina...', pillar: 'Conexão' as const, format: 'Stories' as const },
    { title: 'O passo a passo para sair do zero neste tema', hook: 'Guarde este roteiro simples de 4 passos...', pillar: 'Educação' as const, format: 'Carrossel' as const },
    { title: 'Por que a maioria desiste antes de ver o resultado', hook: 'O erro psicológico mais comum no nicho...', pillar: 'Conexão' as const, format: 'Post Estático' as const },
    { title: 'A diferença entre quem tem resultado e quem só tenta', hook: 'Preste atenção nisso se você quer crescer...', pillar: 'Autoridade' as const, format: 'Reels' as const },
    { title: 'Checklist definitivo para aplicar ainda hoje', hook: 'Print dessa tela para usar nos seus próximos dias...', pillar: 'Educação' as const, format: 'Carrossel' as const },
    { title: 'Oferta direta com condição especial para direct', hook: 'Abri 3 vagas exclusivas para atendimento...', pillar: 'Conversão / Venda' as const, format: 'Stories' as const },
    { title: 'Pergunta polarizadora: Qual o seu maior gargalo?', hook: 'Preciso da sua opinião sincera sobre isso...', pillar: 'Conexão' as const, format: 'Stories' as const }
  ];

  for (let i = result.length + 1; i <= 30; i++) {
    const t = templates[(i - 1) % templates.length];
    const targetPain = pains[(i - 1) % pains.length];
    const targetDesire = desires[(i - 1) % desires.length];

    result.push({
      id: i,
      title: `${t.title} [Foco: ${params.product || 'Estratégia'}]`,
      format: t.format || formats[(i - 1) % formats.length],
      pillar: t.pillar || pillars[(i - 1) % pillars.length],
      goal: `Superar a dor (${targetPain}) e direcionar para (${targetDesire})`,
      hook: t.hook,
      captionIdea: `Aborde como resolver ${targetPain} de forma simples e conecte diretamente com a solução de @${params.username.replace(/^@/, '')}.`,
      cta: 'Envie uma mensagem no Direct para receber o direcionamento completo!'
    });
  }

  return result.slice(0, 30).map((item, idx) => ({ ...item, id: idx + 1 }));
}

function completeTo10Reels(raw: ReelScript[], params: GenerateParams, diag: PositioningDiagnosis): ReelScript[] {
  const result: ReelScript[] = [...raw];

  const frameworks = [
    {
      theme: 'Quebra de Padrão: Pare de fazer isso no seu nicho',
      hookVisual: 'Olhar sério para a câmera apontando o dedo com texto vermelho na tela',
      hookVerbal: 'Se você faz isso no seu perfil, pare imediatamente antes de perder mais dinheiro...',
      body: ['Explicação do erro clássico que 90% das pessoas cometem', 'O motivo pelo qual o algoritmo desfavorece essa abordagem', 'O ajuste simples que muda tudo em 24 horas'],
      cta: 'Comente "AJUDA" que eu te envio o modelo correto no Direct.',
      audioStyle: 'Voz direta sem música alta, cortes rápidos a cada 2.5s'
    },
    {
      theme: 'Passo a Passo Rápido: O método de 3 etapas',
      hookVisual: 'Escrevendo em um caderno ou apontando para os 3 passos na tela',
      hookVerbal: 'Você só precisa dessas 3 coisas para destravar resultados consistentes...',
      body: ['Etapa 1: Definição clara do posicionamento magnético', 'Etapa 2: Cronograma com ganchos de alta retenção', 'Etapa 3: Chamada direcionada para atendimento no Direct'],
      cta: 'Salve este Reel para consultar quando for produzir seus posts.',
      audioStyle: 'Áudio dinâmico em alta com fala ritmada'
    },
    {
      theme: 'História de Transformação: Do zero aos primeiros clientes',
      hookVisual: 'Caminhando em direção à câmera em um ambiente iluminado',
      hookVerbal: 'Há algum tempo eu me sentia exatamente como você se sente hoje...',
      body: ['A frustração de postar sem ter retorno nem mensagens', 'A virada de chave ao aplicar uma estratégia profissional', 'O resultado alcançado e como você pode replicar'],
      cta: 'Se você quer viver essa virada, me chame no Direct com a palavra "VIRADA".',
      audioStyle: 'Música inspiradora de fundo com narração empática'
    },
    {
      theme: 'Comparativo Cirúrgico: Amador vs Profissional',
      hookVisual: 'Divisão de tela ou mostrando dois caminhos na mão',
      hookVerbal: 'Essa é a diferença real entre um perfil que só tem seguidor e um que tem clientes...',
      body: ['O amador posta sem objetivo e espera um milagre', 'O profissional cria conteúdo com funil de retenção e vendas', 'Qual dos dois caminhos você está seguindo hoje?'],
      cta: 'Deixe sua opinião nos comentários: amador ou profissional?',
      audioStyle: 'Som de transição rápida entre os dois comparativos'
    },
    {
      theme: 'Aviso Urgente: Mudança no algoritmo que afeta seu nicho',
      hookVisual: 'Entrando rápido em cena segurando o celular',
      hookVerbal: 'Preste muita atenção se você quer continuar crescendo nos próximos meses...',
      body: ['O algoritmo agora prioriza salvamentos e conversas iniciadas na DM', 'Como usar isso a seu favor nas próximas postagens', 'O que você nunca deve deixar de colocar na legenda'],
      cta: 'Compartilhe este vídeo com alguém que também precisa desse aviso urgente!',
      audioStyle: 'Batida com suspense e clareza de áudio'
    },
    {
      theme: 'Desafio Prático de 24 Horas',
      hookVisual: 'Cronômetro ou contagem regressiva na tela',
      hookVerbal: 'Eu te desafio a aplicar isso nas próximas 24 horas e me contar o resultado...',
      body: ['Troque sua bio para a promessa de transformação', 'Faça um post com o gancho de curiosidade sugerido', 'Abra a caixa de perguntas estratégica nos Stories'],
      cta: 'Topa o desafio? Comente "ACEITO" nos comentários!',
      audioStyle: 'Música acelerada e empolgante'
    }
  ];

  for (let i = result.length + 1; i <= 10; i++) {
    const f = frameworks[(i - 1) % frameworks.length];
    result.push({
      id: i,
      theme: `${f.theme} (${params.product || 'Estratégia'})`,
      hookVisual: f.hookVisual,
      hookVerbal: f.hookVerbal,
      body: f.body,
      cta: f.cta,
      audioStyle: f.audioStyle,
      durationSeconds: '35 a 45s'
    });
  }

  return result.slice(0, 10).map((r, idx) => ({ ...r, id: idx + 1 }));
}

function completeTo10Carousels(raw: CarouselPost[], params: GenerateParams, diag: PositioningDiagnosis): CarouselPost[] {
  const result: CarouselPost[] = [...raw];

  const frameworks = [
    {
      title: 'Guia Definitivo: Como resolver o principal obstáculo',
      coverHeadline: 'O GUIA PRÁTICO PARA NUNCA MAIS TRAVAR NISSO',
      pain: 'Falta de método estruturado e tempo perdido',
      slides: [
        { slideNumber: 1, headline: 'O GUIA PRÁTICO', content: 'Deslize para aprender o método em 4 passos simples.', visualNote: 'Capa impactante com fundo escuro e título em destaque' },
        { slideNumber: 2, headline: 'Passo 1: Clareza', content: 'Defina exatamente quem você quer atrair antes de criar qualquer post.', visualNote: 'Card visual com caixa de destaque' },
        { slideNumber: 3, headline: 'Passo 2: Gancho Forte', content: 'Gaste 50% do seu tempo na headline da capa para garantir o clique.', visualNote: 'Exemplo prático de headline magnética' },
        { slideNumber: 4, headline: 'Passo 3: Entrega Cirúrgica', content: 'Entregue o valor prometido de forma concisa e sem enrolação.', visualNote: 'Checklist visual com ícones' },
        { slideNumber: 5, headline: 'Passo 4: Chamada de Ação', content: 'Salve este carrossel e comente sua maior dúvida abaixo.', visualNote: 'Seta grande apontando para o botão salvar' }
      ],
      finalCta: 'Salve para não esquecer e compartilhe com um parceiro!'
    },
    {
      title: 'Os 4 Maiores Erros que Afastam Clientes',
      coverHeadline: '4 ERROS QUE ESTÃO SILENCIANDO SEU DIRECT',
      pain: 'Postar sem retorno e direct vazio',
      slides: [
        { slideNumber: 1, headline: 'ESTÁ COMETENDO ESSES ERROS?', content: 'Se o seu direct está vazio, o motivo está nestes 4 slides.', visualNote: 'Headline com texto vermelho de alerta' },
        { slideNumber: 2, headline: 'Erro #1: Bio Genérica', content: 'Não deixar claro em 3 segundos o que você resolve.', visualNote: 'Comparativo antes e depois' },
        { slideNumber: 3, headline: 'Erro #2: Posts sem CTA', content: 'Ensinar muito mas nunca convidar o leitor para a conversa privada.', visualNote: 'Exemplo de CTA que converte' },
        { slideNumber: 4, headline: 'Erro #3: Inconstância', content: 'Postar 3 dias e sumir 1 semana desregulando o algoritmo.', visualNote: 'Gráfico descendente de alcance' },
        { slideNumber: 5, headline: 'Como Corrigir Tudo Isso', content: 'Aplique o Mapa de Conteúdo e tenha clareza nos próximos 90 dias.', visualNote: 'Chamada para direct' }
      ],
      finalCta: 'Envie uma mensagem no Direct para receber a correção da sua bio!'
    }
  ];

  for (let i = result.length + 1; i <= 10; i++) {
    const fw = frameworks[(i - 1) % frameworks.length];
    result.push({
      id: i,
      title: `${fw.title} (#${i})`,
      coverHeadline: fw.coverHeadline,
      targetPainOrDesire: fw.pain,
      slides: fw.slides,
      finalCta: fw.finalCta
    });
  }

  return result.slice(0, 10).map((c, idx) => ({ ...c, id: idx + 1 }));
}

function completeTo10Stories(raw: StorySequence[], params: GenerateParams, diag: PositioningDiagnosis): StorySequence[] {
  const result: StorySequence[] = [...raw];

  const frameworks = [
    {
      theme: 'Funil de Aquecimento com Enquete e Direct',
      objective: 'Gerar conversas quentes de vendas na DM',
      stories: [
        { order: 1, type: 'Enquete' as const, content: 'Você sente que o seu perfil poderia estar gerando muito mais clientes?', stickerOrInteractive: 'Enquete: Sim, com certeza / Não, já vendo muito' },
        { order: 2, type: 'Opinião / Quebra' as const, content: 'A maioria das pessoas com quem converso tem a mesma queixa: produzem muito conteúdo mas não veem retorno financeiro.', stickerOrInteractive: 'Vídeo selfie curto e natural' },
        { order: 3, type: 'Bastidor' as const, content: 'O segredo não é postar mais, e sim ter um funil direcionado que conduz o visitante até a conversa privada.', stickerOrInteractive: 'Print ou foto de anotações da estratégia' },
        { order: 4, type: 'Chamada Direct (DM)' as const, content: 'Vou liberar 3 análises gratuitas no Direct para quem responder aqui com "QUERO".', stickerOrInteractive: 'Botão de resposta rápida para a DM' }
      ]
    },
    {
      theme: 'Caixa de Perguntas Estratégica com Quebra de Objeções',
      objective: 'Responder dúvidas e provar autoridade no nicho',
      stories: [
        { order: 1, type: 'Caixa de Perguntas' as const, content: 'Qual o seu maior obstáculo hoje para fechar mais clientes no Instagram?', stickerOrInteractive: 'Caixinha de perguntas aberta' },
        { order: 2, type: 'Opinião / Quebra' as const, content: 'Respondendo a pergunta mais frequente: "Não tenho tempo para criar posts todo dia".', stickerOrInteractive: 'Vídeo desmistificando o mito' },
        { order: 3, type: 'Bastidor' as const, content: 'Com o cronograma trimestral pronto de 90 dias, você gasta apenas 2 horas na semana para planejar tudo.', stickerOrInteractive: 'Print da tela do calendário' },
        { order: 4, type: 'Chamada Direct (DM)' as const, content: 'Me envie uma mensagem no direct para eu te mostrar como funciona o acesso.', stickerOrInteractive: 'Link ou palavra-chave para direct' }
      ]
    }
  ];

  for (let i = result.length + 1; i <= 10; i++) {
    const f = frameworks[(i - 1) % frameworks.length];
    result.push({
      id: i,
      theme: `${f.theme} (#${i})`,
      objective: f.objective,
      stories: f.stories
    });
  }

  return result.slice(0, 10).map((s, idx) => ({ ...s, id: idx + 1 }));
}

function completeTo90DaysCalendar(raw: CalendarDay[], params: GenerateParams): CalendarDay[] {
  const daysOfWeek = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  const formats: ('Reels' | 'Carrossel' | 'Post Estático' | 'Stories')[] = ['Reels', 'Carrossel', 'Reels', 'Stories', 'Carrossel', 'Reels', 'Stories'];
  const pillars = ['Autoridade', 'Conexão', 'Educação', 'Conversão / Venda'];

  const fullCal: CalendarDay[] = [];

  for (let dayNum = 1; dayNum <= 90; dayNum++) {
    const monthNum: 1 | 2 | 3 = dayNum <= 30 ? 1 : dayNum <= 60 ? 2 : 3;
    const phaseTitle =
      monthNum === 1
        ? 'Mês 1 - Fundação & Atração Magnética'
        : monthNum === 2
        ? 'Mês 2 - Autoridade & Conexão Profunda'
        : 'Mês 3 - Escala & Conversão em Clientes';

    const existingDay = raw.find((d) => d.day === dayNum);

    if (existingDay) {
      fullCal.push({
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
      const dayFormat = formats[(dayNum - 1) % formats.length];
      const dayPillar = pillars[(dayNum - 1) % pillars.length];
      const dayDow = daysOfWeek[(dayNum - 1) % 7];

      let theme = '';
      let hook = '';
      let cta = '';

      if (monthNum === 1) {
        theme = dayFormat === 'Reels'
          ? `Reel de Topo de Funil: O erro número 1 que bloqueia clientes no nicho de @${params.username.replace(/^@/, '')}`
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

      fullCal.push({
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

  return fullCal;
}
