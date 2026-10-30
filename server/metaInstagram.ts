import { MetaProfileData } from '../src/types';
import { db } from './db';

export interface MetaDiscoveryResult {
  status: 'connected' | 'not_configured' | 'error_account_private_or_invalid';
  message: string;
  data?: MetaProfileData;
}

export async function fetchInstagramProfileData(targetUsername: string): Promise<MetaDiscoveryResult> {
  const cleanUsername = targetUsername.replace(/^@/, '').trim().toLowerCase();
  const { token, accountId } = db.getMetaCredentials();

  if (!token || !accountId) {
    return {
      status: 'not_configured',
      message: 'A integração oficial da Meta Instagram Business Discovery não está configurada no servidor (tokens de acesso ausentes). Por transparência e ética, não realizamos scraping não autorizado nem inventamos métricas de seguidores.'
    };
  }

  try {
    const fields = 'business_discovery.username(' + cleanUsername + '){username,name,biography,followers_count,media_count,profile_picture_url,website,media.limit(6){caption,media_type,timestamp}}';
    const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(accountId)}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      const errMsg = result.error?.message || 'Erro ao consultar Meta API';
      const isNotFoundOrPrivate = errMsg.includes('not found') || errMsg.includes('OAuth') || errMsg.includes('business');
      return {
        status: 'error_account_private_or_invalid',
        message: isNotFoundOrPrivate
          ? `Não foi possível acessar os dados públicos de @${cleanUsername} via Meta Business Discovery. Isso ocorre quando o perfil é pessoal, privado ou a permissão da Meta expirou.`
          : `Erro retornado pela API oficial da Meta: ${errMsg}`
      };
    }

    const discovery = result.business_discovery;
    if (!discovery) {
      return {
        status: 'error_account_private_or_invalid',
        message: `Perfil @${cleanUsername} não encontrado na rede comercial do Instagram ou é uma conta pessoal/privada.`
      };
    }

    const recentCaptions: string[] = [];
    if (discovery.media?.data && Array.isArray(discovery.media.data)) {
      discovery.media.data.forEach((m: { caption?: string }) => {
        if (m.caption) recentCaptions.push(m.caption);
      });
    }

    const profileData: MetaProfileData = {
      username: discovery.username || cleanUsername,
      name: discovery.name || '',
      biography: discovery.biography || '',
      followersCount: discovery.followers_count || 0,
      mediaCount: discovery.media_count || 0,
      profilePictureUrl: discovery.profile_picture_url,
      website: discovery.website,
      recentCaptions
    };

    return {
      status: 'connected',
      message: 'Dados oficiais obtidos com sucesso diretamente via Meta Instagram Business Discovery.',
      data: profileData
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha na conexão com os servidores da Meta.';
    return {
      status: 'error_account_private_or_invalid',
      message: `Falha na requisição à Meta API: ${message}`
    };
  }
}
