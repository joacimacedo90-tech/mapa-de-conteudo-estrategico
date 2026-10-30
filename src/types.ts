export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
  activePlanId?: string;
  customerAccess?: CustomerAccess;
}

export interface MetaProfileData {
  username: string;
  name?: string;
  biography?: string;
  followersCount?: number;
  mediaCount?: number;
  profilePictureUrl?: string;
  website?: string;
  recentCaptions?: string[];
}

export interface MetaDiscoveryResult {
  status: 'connected' | 'not_configured' | 'error_account_private_or_invalid';
  message: string;
  data?: MetaProfileData;
}

export interface ContentIdea {
  id: number;
  title: string;
  format: 'Reels' | 'Carrossel' | 'Post Estático' | 'Stories' | 'Live';
  pillar: 'Autoridade' | 'Conexão' | 'Educação' | 'Conversão / Venda';
  goal: string;
  hook: string;
  captionIdea: string;
  cta: string;
}

export interface ReelScript {
  id: number;
  theme: string;
  hookVisual: string;
  hookVerbal: string;
  body: string[];
  cta: string;
  audioStyle: string;
  durationSeconds: string;
}

export interface CarouselSlide {
  slideNumber: number;
  headline: string;
  content: string;
  visualNote: string;
}

export interface CarouselPost {
  id: number;
  title: string;
  coverHeadline: string;
  targetPainOrDesire: string;
  slides: CarouselSlide[];
  finalCta: string;
}

export interface StorySequence {
  id: number;
  theme: string;
  objective: string;
  stories: {
    order: number;
    type: 'Enquete' | 'Caixa de Perguntas' | 'Opinião / Quebra' | 'Bastidor' | 'Chamada Direct (DM)';
    content: string;
    stickerOrInteractive: string;
  }[];
}

export interface CalendarDay {
  day: number;
  month: 1 | 2 | 3;
  phase: string;
  dayOfWeek: string;
  format: 'Reels' | 'Carrossel' | 'Post Estático' | 'Stories';
  pillar: string;
  theme: string;
  hook: string;
  cta: string;
}

export interface GrowthScenario {
  level: 'conservative' | 'realistic' | 'accelerated';
  name: string;
  frequency: string;
  projectedFollowersMin: number;
  projectedFollowersMax: number;
  projectedFollowersRange: string;
  estimatedReachRange: string;
  estimatedDmMessages: string;
  keyStrategy: string;
  highlight?: boolean;
}

export interface GrowthProjection {
  baselineStatus: string;
  conservative: GrowthScenario;
  realistic: GrowthScenario;
  accelerated: GrowthScenario;
  keyGrowthLevers: string[];
  leadConversionEstimate: string;
  integrityDisclaimer: string;
}

export interface HooksAndCtas {
  curiosityHooks: string[];
  painHooks: string[];
  authorityHooks: string[];
  commentCtas: string[];
  directMessageCtas: string[];
  captionTemplates: {
    name: string;
    structure: string;
    example: string;
  }[];
}

export interface PositioningDiagnosis {
  overallScore: number;
  bioAnalysis: {
    currentStatus: string;
    strengths: string[];
    weaknesses: string[];
    suggestedBio: string;
  };
  targetAudience: {
    profile: string;
    deepPains: string[];
    coreDesires: string[];
    buyingObjections: string[];
  };
  strategicPillars: {
    name: string;
    description: string;
    percentage: number;
  }[];
  growthOpportunities: string[];
  competitiveEdge: string;
  growthProjection?: GrowthProjection;
}

export interface Report {
  id: string;
  userId?: string | null;
  userEmail?: string | null;
  username: string;
  profession?: string;
  niche?: string;
  product?: string;
  objective?: string;
  metaApiStatus: 'connected' | 'not_configured' | 'manual_input';
  manualData?: {
    bio?: string;
    recentCaptions?: string;
  };
  metaProfileData?: MetaProfileData;
  diagnosis: PositioningDiagnosis;
  contentIdeas: ContentIdea[];
  reels: ReelScript[];
  carousels: CarouselPost[];
  stories: StorySequence[];
  hooksAndCtas: HooksAndCtas;
  calendar: CalendarDay[];
  isPaid: boolean;
  paidAt?: string;
  paidPlanId?: string;
  hotmartTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanResourceLimits {
  calendarDays: number;
  hasDiagnosis: boolean;
  hasGrowthProjection: boolean;
  hasContentIdeas: boolean;
  hasReels: boolean;
  hasCarousels: boolean;
  hasStories: boolean;
  hasHooks: boolean;
  hasExportMarkdown: boolean;
  hasVipBadge?: boolean;
}

export interface PricingPlan {
  id: 'essencial' | 'pro' | 'premium' | string;
  name: string;
  badge?: string;
  price: number;
  originalPrice: number;
  installments?: string;
  description: string;
  features: string[];
  hotmartCheckoutUrl: string;
  hotmartProductId?: string;
  hotmartOfferCode?: string;
  limits: PlanResourceLimits;
  isPopular?: boolean;
}

export interface CustomerAccess {
  id: string;
  email: string;
  name?: string;
  planId: 'essencial' | 'pro' | 'premium' | string;
  status: 'active' | 'pending' | 'canceled' | 'refunded' | 'chargeback';
  transactionId: string;
  productName?: string;
  offerCode?: string;
  reportId?: string;
  purchasedAt: string;
  updatedAt: string;
  notes?: string;
}

export interface AdminSettings {
  adminPasswordConfigured: boolean;
  hotmartWebhookToken: string;
  metaConfigured: boolean;
  metaAccountId: string;
  plans: PricingPlan[];
  headlineBanner: string;
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  event: string;
  status: 'PROCESSED' | 'IGNORED' | 'ERROR';
  reportId?: string;
  buyerEmail?: string;
  transactionId?: string;
  planId?: string;
  rawPayloadSummary: string;
}
