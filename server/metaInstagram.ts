import { MetaProfileData, MetaDiscoveryResult } from '../src/types';
import { db } from './db';

// Short TTL memory cache (5 minutes) for successfully verified live queries only
const liveVerifiedCache = new Map<string, { timestamp: number; result: MetaDiscoveryResult }>();
const VERIFIED_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Consulta os dados do perfil do Instagram com estrita fidelidade aos dados reais.
 *
 * REGRAS CRÍTICAS DE FIDELIDADE:
 * 1. Nome do perfil: Exclusivamente o nome retornado pela fonte oficial ou endpoint do Instagram. NUNCA inventar.
 * 2. Foto do perfil: Exclusivamente a URL original retornada. NUNCA usar fotos ilustrativas de terceiros.
 * 3. Número de seguidores: Valor numérico exato inteiro da fonte. NUNCA arredondar ou estimar.
 * 4. Proibição de dados fictícios: Se não conseguir confirmar, informar explicitamente que o dado não foi obtido.
 * 5. Transparência: Registrar data/hora exata (ISO) e a fonte de obtenção.
 */
export async function fetchInstagramProfileData(
  targetUsername: string,
  options?: { forceLive?: boolean }
): Promise<MetaDiscoveryResult> {
  const cleanUsername = targetUsername.replace(/^@/, '').trim().toLowerCase();
  const queryTimestamp = new Date().toISOString();

  if (!cleanUsername) {
    return {
      status: 'error_account_private_or_invalid',
      message: 'Nome de usuário (@) não informado.',
      queriedAt: queryTimestamp,
      verifiedLive: false,
      source: 'Validação local',
      errorReason: 'Nome de usuário vazio'
    };
  }

  // 1. Checar se há resultado REAL verificado em cache recente (apenas se não forçado)
  if (!options?.forceLive) {
    const cached = liveVerifiedCache.get(cleanUsername);
    if (cached && Date.now() - cached.timestamp < VERIFIED_CACHE_TTL_MS) {
      return cached.result;
    }
  }

  // 2. Tentativa via Meta Instagram Business Discovery oficial (se configurada)
  const { token, accountId } = db.getMetaCredentials();

  if (token && accountId) {
    try {
      const fields = `business_discovery.username(${encodeURIComponent(cleanUsername)}){username,name,biography,followers_count,media_count,profile_picture_url,website,media.limit(6){caption,media_type,timestamp}}`;
      const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(accountId)}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3500)
      });

      const result = await response.json();

      if (response.ok && result.business_discovery) {
        const discovery = result.business_discovery;
        const recentCaptions: string[] = [];
        if (discovery.media?.data && Array.isArray(discovery.media.data)) {
          discovery.media.data.forEach((m: { caption?: string }) => {
            if (m.caption) recentCaptions.push(m.caption.slice(0, 300));
          });
        }

        const profileData: MetaProfileData = {
          username: discovery.username || cleanUsername,
          name: typeof discovery.name === 'string' && discovery.name.trim() ? discovery.name.trim() : undefined,
          biography: typeof discovery.biography === 'string' ? discovery.biography : undefined,
          followersCount: typeof discovery.followers_count === 'number' ? Math.floor(discovery.followers_count) : undefined,
          mediaCount: typeof discovery.media_count === 'number' ? Math.floor(discovery.media_count) : undefined,
          profilePictureUrl: discovery.profile_picture_url || undefined,
          website: discovery.website || undefined,
          recentCaptions,
          verifiedLive: true,
          queriedAt: queryTimestamp,
          source: 'Meta Business Discovery API (Oficial)'
        };

        const successResult: MetaDiscoveryResult = {
          status: 'connected',
          message: 'Dados oficiais obtidos diretamente via Meta Instagram Business Discovery.',
          data: profileData,
          queriedAt: queryTimestamp,
          source: 'Meta Business Discovery API (Oficial)',
          verifiedLive: true
        };

        liveVerifiedCache.set(cleanUsername, { timestamp: Date.now(), result: successResult });
        return successResult;
      }
    } catch (metaErr) {
      console.warn(`[META_API_FETCH_WARN] Falha na consulta Meta Graph API para @${cleanUsername}:`, metaErr instanceof Error ? metaErr.message : metaErr);
    }
  }

  // 3. Tentativa via endpoint público do Instagram com x-ig-app-id
  try {
    const publicUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(cleanUsername)}`;
    const publicRes = await fetch(publicUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'x-ig-app-id': '936619743392459',
        'Accept': '*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site'
      },
      signal: AbortSignal.timeout(3500)
    });

    if (publicRes.ok) {
      const json = await publicRes.json();
      const user = json?.data?.user;
      if (user) {
        const recentCaptions: string[] = [];
        if (user.edge_owner_to_timeline_media?.edges && Array.isArray(user.edge_owner_to_timeline_media.edges)) {
          user.edge_owner_to_timeline_media.edges.forEach((edge: { node?: { edge_media_to_caption?: { edges?: Array<{ node?: { text?: string } }> } } }) => {
            const txt = edge?.node?.edge_media_to_caption?.edges?.[0]?.node?.text;
            if (txt && typeof txt === 'string') {
              recentCaptions.push(txt.slice(0, 300));
            }
          });
        }

        const exactFollowers = typeof user.edge_followed_by?.count === 'number' ? Math.floor(user.edge_followed_by.count) : undefined;
        const exactFollowing = typeof user.edge_follow?.count === 'number' ? Math.floor(user.edge_follow.count) : undefined;
        const exactMedia = typeof user.edge_owner_to_timeline_media?.count === 'number' ? Math.floor(user.edge_owner_to_timeline_media.count) : undefined;
        const realName = typeof user.full_name === 'string' && user.full_name.trim() ? user.full_name.trim() : undefined;
        const realPhoto = user.profile_pic_url_hd || user.profile_pic_url || undefined;

        const profileData: MetaProfileData = {
          username: user.username || cleanUsername,
          name: realName,
          biography: typeof user.biography === 'string' ? user.biography : undefined,
          followersCount: exactFollowers,
          followingCount: exactFollowing,
          mediaCount: exactMedia,
          profilePictureUrl: realPhoto,
          website: user.external_url || undefined,
          recentCaptions,
          verifiedLive: true,
          queriedAt: queryTimestamp,
          source: 'Instagram Web API (Live)'
        };

        const successResult: MetaDiscoveryResult = {
          status: 'connected',
          message: 'Dados públicos do perfil extraídos ao vivo com sucesso diretamente do Instagram.',
          data: profileData,
          queriedAt: queryTimestamp,
          source: 'Instagram Web API (Live)',
          verifiedLive: true
        };

        liveVerifiedCache.set(cleanUsername, { timestamp: Date.now(), result: successResult });
        return successResult;
      }
    } else {
      console.warn(`[IG_PUBLIC_FETCH_STATUS] Instagram retornou HTTP ${publicRes.status} para @${cleanUsername}`);
    }
  } catch (publicErr) {
    console.warn(`[IG_PUBLIC_FETCH_WARN] Falha na requisição web_profile_info para @${cleanUsername}:`, publicErr instanceof Error ? publicErr.message : publicErr);
  }

  // 4. Se a consulta automatizada ao vivo não foi concluída (bloqueio 429 de WAF, perfil privado, etc.):
  // REGRA ABSOLUTA: NUNCA inventar nome, seguidores ou foto.
  const unverifiedData: MetaProfileData = {
    username: cleanUsername,
    name: undefined, // REGRA OBRIGATÓRIA: Não inventar nome
    biography: undefined,
    followersCount: undefined, // REGRA OBRIGATÓRIA: Não inventar seguidores
    followingCount: undefined,
    mediaCount: undefined,
    profilePictureUrl: undefined, // REGRA OBRIGATÓRIA: Não inventar foto
    verifiedLive: false,
    queriedAt: queryTimestamp,
    source: 'Consulta ao vivo não confirmada (Instagram bloqueou ou perfil privado)',
    errorReason: 'O Instagram limitou temporariamente consultas públicas diretas sem autenticação (Rate Limit HTTP 429) ou o perfil possui restrições de privacidade. A confirmação manual dos dados reais é requerida.'
  };

  return {
    status: 'not_configured',
    message: `Não foi possível confirmar os dados ao vivo do Instagram para @${cleanUsername} neste momento (restrição de consultas automatizadas da plataforma ou perfil privado). Por favor, confirme o número exato de seguidores e o nicho manualmente.`,
    data: unverifiedData,
    queriedAt: queryTimestamp,
    source: 'Consulta não confirmada',
    verifiedLive: false,
    errorReason: 'Instagram bloqueou a requisição pública automatizada (HTTP 429 / WAF) ou o perfil é privado.'
  };
}
