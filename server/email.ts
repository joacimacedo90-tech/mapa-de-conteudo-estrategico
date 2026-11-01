import nodemailer from 'nodemailer';
import { ClientDiagnostic, DemoAccessRequest } from '../src/types';

export interface EmailSendResult {
  success: boolean;
  configured: boolean;
  message: string;
  missingConfig?: string[];
  messageId?: string;
}

export function isEmailConfigured(): { configured: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!process.env.SMTP_HOST) missing.push('SMTP_HOST');
  if (!process.env.SMTP_USER) missing.push('SMTP_USER');
  if (!process.env.SMTP_PASS) missing.push('SMTP_PASS');

  return {
    configured: missing.length === 0,
    missing
  };
}

export async function sendClientDiagnosticEmail(
  diagnostic: ClientDiagnostic,
  appUrl: string
): Promise<EmailSendResult> {
  const check = isEmailConfigured();
  if (!check.configured) {
    return {
      success: false,
      configured: false,
      missingConfig: check.missing,
      message: `Configuração de envio de e-mail pendente. É necessário definir no arquivo de ambiente (.env): ${check.missing.join(', ')}.`
    };
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const fromAddress = process.env.SMTP_FROM || `"Mapa de Conteúdo" <${process.env.SMTP_USER}>`;
  const report = diagnostic.reportData;
  const growth = report.diagnosis?.growthProjection;

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #ee4957 0%, #ff6b78 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 6px; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 0; font-size: 13px; opacity: 0.95; font-weight: 500; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #09090b; }
    .summary-box { background: #fff5f5; border: 1px solid #fed7d7; border-radius: 14px; padding: 18px; margin: 20px 0; }
    .metric { display: inline-block; width: 48%; vertical-align: top; margin-bottom: 12px; }
    .metric-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #71717a; margin-bottom: 3px; }
    .metric-val { font-size: 17px; font-weight: 800; color: #ee4957; }
    .section-title { font-size: 14px; font-weight: 800; margin: 22px 0 10px; color: #09090b; text-transform: uppercase; letter-spacing: 0.5px; }
    .p-text { font-size: 13px; line-height: 1.6; color: #3f3f46; margin: 0 0 14px; }
    .footer { text-align: center; padding: 20px 28px; background: #fafafa; border-top: 1px solid #f4f4f5; font-size: 11px; color: #71717a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>MAPA DE CONTEÚDO ESTRATÉGICO</h1>
      <p>Diagnóstico Executivo do Instagram • 90 Dias de Estratégia</p>
    </div>
    <div class="content">
      <div class="greeting">Olá, ${diagnostic.clientName}!</div>
      <p class="p-text">
        Seu diagnóstico estratégico personalizado para o perfil <strong>@${diagnostic.instagramUsername}</strong> foi gerado com sucesso pela nossa equipe no <strong>Mapa de Conteúdo</strong>.
      </p>

      <div class="summary-box">
        <div class="metric">
          <div class="metric-label">Perfil Analisado</div>
          <div class="metric-val">@${diagnostic.instagramUsername}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Potência Algorítmica</div>
          <div class="metric-val">${report.diagnosis?.powerPreview?.currentPowerScore || report.diagnosis?.overallScore || 85}/100</div>
        </div>
        <div class="metric">
          <div class="metric-label">Projeção 90 Dias</div>
          <div class="metric-val" style="color: #16a34a;">${growth?.realistic?.projectedFollowersRange || '+3.500 a +7.500 novos seguidores'}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Alcance Estimado</div>
          <div class="metric-val" style="color: #0284c7;">${growth?.realistic?.estimatedReachRange || '80.000 a 180.000 contas'}</div>
        </div>
      </div>

      <div class="section-title">Diagnóstico de Posicionamento & Oportunidades</div>
      <p class="p-text">${report.diagnosis?.bioAnalysis?.currentStatus || 'Estratégia personalizada de posicionamento e autoridade.'}</p>

      <div class="section-title">Proposta de Valor Diferenciada</div>
      <p class="p-text">${report.diagnosis?.competitiveEdge || 'Clareza de mensagem com foco na transformação do cliente.'}</p>

      <div class="section-title">Conteúdos & Cronograma Incluídos</div>
      <p class="p-text">
        • <strong>30 Ideias Estratégicas</strong> com ganchos e CTAs<br>
        • <strong>10 Roteiros de Reels Prontos</strong> com retenção nos 3 primeiros segundos<br>
        • <strong>10 Carrosséis Estruturados</strong> slide a slide<br>
        • <strong>10 Sequências de Stories</strong> de alta conversão<br>
        • <strong>Calendário Trimestral Completo (90 Dias)</strong> dividido em 3 fases (Atração, Conexão e Venda)
      </p>
    </div>
    <div class="footer">
      Este diagnóstico foi preparado exclusivamente para <strong>${diagnostic.clientName}</strong> (${diagnostic.clientEmail}).<br>
      © ${new Date().getFullYear()} Mapa de Conteúdo Estratégico. Todos os direitos reservados.
    </div>
  </div>
</body>
</html>
  `;

  try {
    const calculatedScore = report.diagnosis?.powerPreview?.currentPowerScore || report.diagnosis?.overallScore || 85;
    const info = await transporter.sendMail({
      from: fromAddress,
      to: `"${diagnostic.clientName}" <${diagnostic.clientEmail}>`,
      subject: `Seu Diagnóstico Estratégico do Instagram (@${diagnostic.instagramUsername}) está pronto!`,
      text: `Olá ${diagnostic.clientName},\n\nSeu diagnóstico estratégico para @${diagnostic.instagramUsername} está pronto!\n\nPotência algorítmica: ${calculatedScore}/100.\nProjeção: ${growth?.realistic?.projectedFollowersRange || '+3.500 novos seguidores em 90 dias'}.\n\nMapa de Conteúdo Estratégico.`,
      html: htmlContent
    });

    return {
      success: true,
      configured: true,
      messageId: info.messageId,
      message: `Diagnóstico enviado com sucesso para ${diagnostic.clientEmail}!`
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Falha ao conectar ao servidor de e-mail.';
    return {
      success: false,
      configured: true,
      message: `Erro ao enviar e-mail: ${errorMsg}`
    };
  }
}

// 2. Notificação ao Administrador de nova solicitação de Demonstração do Plano Essencial
export async function sendAdminDemoRequestNotification(demoRequest: DemoAccessRequest, adminEmail?: string): Promise<EmailSendResult> {
  const check = isEmailConfigured();
  if (!check.configured) {
    return {
      success: false,
      configured: false,
      missingConfig: check.missing,
      message: 'SMTP não configurado. Notificação registrada no banco de dados e visível no painel administrativo.'
    };
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const fromAddress = process.env.SMTP_FROM || `"Mapa de Conteúdo" <${process.env.SMTP_USER}>`;
  const targetAdmin = adminEmail || process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER || '';

  if (!targetAdmin) {
    return {
      success: false,
      configured: true,
      message: 'E-mail do administrador não informado para notificação.'
    };
  }

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #09090b; color: #f4f4f5; margin: 0; padding: 24px; }
    .card { max-width: 540px; margin: 0 auto; background: #121216; border: 1px solid #27272a; border-radius: 16px; padding: 24px; }
    .badge { display: inline-block; background: rgba(238, 73, 87, 0.15); color: #ee4957; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; margin-bottom: 12px; }
    h2 { font-size: 18px; margin: 0 0 16px 0; color: #ffffff; }
    .item { margin-bottom: 12px; font-size: 13px; line-height: 1.5; color: #a1a1aa; }
    .item strong { color: #f4f4f5; }
    .footer { font-size: 11px; color: #71717a; margin-top: 24px; border-top: 1px solid #27272a; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Demonstração • Plano Essencial</div>
    <h2>Nova Solicitação de Demonstração Recebida</h2>
    <div class="item"><strong>Nome do Interessado:</strong> ${demoRequest.name}</div>
    <div class="item"><strong>E-mail:</strong> ${demoRequest.email}</div>
    <div class="item"><strong>Data da Solicitação:</strong> ${new Date(demoRequest.createdAt).toLocaleString('pt-BR')}</div>
    <div class="item"><strong>Status:</strong> Aguardando sua análise no painel administrativo.</div>
    <div class="footer">
      Acesse a aba <strong>"Testes do Plano Essencial"</strong> no seu Painel Administrativo para aprovar ou recusar este acesso.
    </div>
  </div>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: targetAdmin,
      subject: `🔔 Nova Solicitação de Demonstração: ${demoRequest.name} (${demoRequest.email})`,
      text: `Nova solicitação de teste do Plano Essencial recebida:\nNome: ${demoRequest.name}\nE-mail: ${demoRequest.email}\nAcesse o painel para aprovar.`,
      html
    });
    return { success: true, configured: true, messageId: info.messageId, message: 'Notificação enviada ao administrador.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Falha no envio';
    return { success: false, configured: true, message: `Erro ao notificar administrador: ${errorMsg}` };
  }
}

// 3. Envio de Convite Seguro com Link de Ativação de Uso Único para o Cliente
export async function sendDemoActivationEmail(demoRequest: DemoAccessRequest, activationUrl: string): Promise<EmailSendResult> {
  const check = isEmailConfigured();
  if (!check.configured) {
    return {
      success: false,
      configured: false,
      missingConfig: check.missing,
      message: 'SMTP não configurado. Você pode copiar o link de ativação manualmente no painel administrativo.'
    };
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const fromAddress = process.env.SMTP_FROM || `"Mapa de Conteúdo" <${process.env.SMTP_USER}>`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #09090b; color: #f4f4f5; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #121216; border: 1px solid #27272a; border-radius: 16px; padding: 28px; }
    .badge { display: inline-block; background: rgba(238, 73, 87, 0.15); color: #ee4957; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; margin-bottom: 12px; }
    h1 { font-size: 20px; margin: 0 0 16px 0; color: #ffffff; }
    p { font-size: 13px; line-height: 1.6; color: #d4d4d8; margin: 0 0 16px 0; }
    .btn { display: inline-block; background: #ee4957; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin: 12px 0; }
    .note { font-size: 11px; color: #a1a1aa; background: #18181b; padding: 12px; border-radius: 8px; border: 1px solid #27272a; margin-top: 20px; }
    .footer { font-size: 11px; color: #71717a; margin-top: 24px; border-top: 1px solid #27272a; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Demonstração • Plano Essencial</div>
    <h1>Seu Acesso de Teste foi Liberado!</h1>
    <p>Olá, <strong>${demoRequest.name}</strong>!</p>
    <p>Sua solicitação para testar o <strong>Plano Essencial</strong> do Mapa de Conteúdo Estratégico foi aprovada pelo nosso administrador.</p>
    <p>Clique no botão abaixo para definir sua senha de acesso e ativar sua conta imediatamente:</p>
    <div>
      <a href="${activationUrl}" class="btn" target="_blank">Ativar Minha Conta de Teste</a>
    </div>
    <div class="note">
      🔒 <strong>Informações Importantes:</strong><br>
      • Este link é individual, de uso único e expira em 48 horas.<br>
      • Não é necessário cartão de crédito e nenhuma cobrança será gerada.<br>
      • Se preferir, cole este endereço no navegador: ${activationUrl}
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Mapa de Conteúdo Estratégico. Todos os direitos reservados.
    </div>
  </div>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: `"${demoRequest.name}" <${demoRequest.email}>`,
      subject: 'Seu acesso de demonstração ao Plano Essencial foi liberado!',
      text: `Olá ${demoRequest.name}!\n\nSua demonstração gratuita do Plano Essencial foi aprovada.\nAtive sua conta e crie sua senha no link seguro:\n${activationUrl}\n\n(Válido por 48 horas).`,
      html
    });
    return { success: true, configured: true, messageId: info.messageId, message: `Convite de demonstração enviado com sucesso para ${demoRequest.email}!` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Falha no envio';
    return { success: false, configured: true, message: `Erro ao enviar convite: ${errorMsg}` };
  }
}

