import nodemailer from 'nodemailer';
import { ClientDiagnostic } from '../src/types';

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
