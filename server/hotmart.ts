import { Request, Response } from 'express';
import { db } from './db';

/**
 * Hotmart Webhook Handler (Hotmart Webhook v2.0)
 * Official Event Spec:
 * - PURCHASE_APPROVED / PURCHASE_COMPLETE: Payment confirmed. Unlocks only the specific plan resources.
 * - WAITING_PAYMENT / PRINTED_BILLET / PURCHASE_DELAYED: Pending payment. Strictly does NOT release access.
 * - PURCHASE_REFUNDED / PURCHASE_CHARGEBACK / PURCHASE_CANCELED: Revokes access.
 */
export async function handleHotmartWebhook(req: Request, res: Response) {
  try {
    const settings = db.getSettings();
    const configuredToken = settings.hotmartWebhookToken;

    // 1. Authenticity validation via Hottok
    // Hotmart sends the hottok in headers (X-Hotmart-Hottok or hottok) or in the payload body/query
    const incomingToken =
      req.headers['x-hotmart-hottok'] ||
      req.headers['hottok'] ||
      req.body?.hottok ||
      req.query?.hottok;

    const payload = req.body || {};
    const event = String(payload.event || payload.status || 'UNKNOWN_EVENT').toUpperCase();

    // Verify token if configured
    if (configuredToken && configuredToken.trim()) {
      if (incomingToken !== configuredToken) {
        db.logWebhook({
          event,
          status: 'ERROR',
          rawPayloadSummary: `Autenticação falhou: Hottok recebido "${incomingToken || 'vazio'}" não confere com o token configurado no painel.`,
          transactionId: payload.data?.purchase?.transaction || payload.transaction
        });
        return res.status(401).json({
          error: 'Token de verificação da Hotmart inválido (Hottok não confere). Acesso negado por segurança.'
        });
      }
    }

    // 2. Extract transaction details
    const purchaseData = payload.data?.purchase || {};
    const productData = payload.data?.product || {};
    const buyerData = payload.data?.buyer || {};

    const transactionId: string =
      purchaseData.transaction ||
      payload.transaction ||
      `HOTMART_${Date.now()}`;

    const buyerEmail: string = (
      buyerData.email ||
      payload.email ||
      payload.buyer_email ||
      ''
    ).toLowerCase().trim();

    const buyerName: string =
      buyerData.name ||
      payload.name ||
      payload.buyer_name ||
      'Cliente Hotmart';

    const offerCode: string =
      purchaseData.offer?.code ||
      payload.offer ||
      payload.offer_code ||
      '';

    const productId: string =
      productData.id ? String(productData.id) :
      payload.product_id ? String(payload.product_id) :
      '';

    const productName: string =
      productData.name ||
      payload.prod_name ||
      'Mapa de Conteúdo';

    // 3. Identify report ID from sck or custom_data
    let reportId: string | undefined =
      purchaseData.sck ||
      purchaseData.custom_data ||
      payload.sck ||
      payload.custom_data ||
      payload.data?.custom_data;

    if (!reportId && req.query.reportId) {
      reportId = String(req.query.reportId);
    }

    // 4. Resolve Plan (ESSENCIAL, PRO, or PREMIUM)
    // Matches by offer code, product ID, or plan name / ID
    let resolvedPlanId: 'essencial' | 'pro' | 'premium' = 'pro';

    const allPlans = settings.plans;
    // Check offer code match first
    const matchByOffer = allPlans.find(
      (p) => p.hotmartOfferCode && offerCode && p.hotmartOfferCode.trim().toLowerCase() === offerCode.trim().toLowerCase()
    );
    // Check product ID match
    const matchByProduct = allPlans.find(
      (p) => p.hotmartProductId && productId && p.hotmartProductId.trim().toLowerCase() === productId.trim().toLowerCase()
    );

    if (matchByOffer) {
      resolvedPlanId = matchByOffer.id as 'essencial' | 'pro' | 'premium';
    } else if (matchByProduct) {
      resolvedPlanId = matchByProduct.id as 'essencial' | 'pro' | 'premium';
    } else {
      // Fallback heuristics: check if string contains plan keyword, offer code or price
      const combinedInfo = `${offerCode} ${productId} ${productName}`.toLowerCase();
      if (
        combinedInfo.includes('essencial') ||
        combinedInfo.includes('a42sa4ug') ||
        combinedInfo.includes('47') ||
        combinedInfo.includes('29')
      ) {
        resolvedPlanId = 'essencial';
      } else if (
        combinedInfo.includes('premium') ||
        combinedInfo.includes('vip') ||
        combinedInfo.includes('4bce8my0') ||
        combinedInfo.includes('197') ||
        combinedInfo.includes('79')
      ) {
        resolvedPlanId = 'premium';
      } else {
        resolvedPlanId = 'pro';
      }
    }

    // Check if buyer has any reports in database if reportId was not passed in sck
    if (!reportId && buyerEmail) {
      const user = db.getUserByEmail(buyerEmail);
      if (user) {
        const userReports = db.getReportsByUser(user.id);
        if (userReports.length > 0) {
          reportId = userReports[0].id;
        }
      }
      if (!reportId) {
        const allReports = db.getAllReports();
        const found = allReports.find((r) => r.userEmail?.toLowerCase() === buyerEmail);
        if (found) reportId = found.id;
      }
    }

    // 5. Evaluate Event & Access Rules
    const isApproved =
      event === 'PURCHASE_APPROVED' ||
      event === 'PURCHASE_COMPLETE' ||
      event === 'APPROVED' ||
      event === 'COMPLETE' ||
      purchaseData.status === 'APPROVED' ||
      purchaseData.status === 'COMPLETE';

    const isPending =
      event === 'WAITING_PAYMENT' ||
      event === 'PRINTED_BILLET' ||
      event === 'PURCHASE_DELAYED' ||
      event === 'PURCHASE_PROTEST' ||
      purchaseData.status === 'WAITING_PAYMENT' ||
      purchaseData.status === 'PRINTED_BILLET' ||
      purchaseData.status === 'UNDER_ANALYSIS';

    const isRevocation =
      event === 'PURCHASE_REFUNDED' ||
      event === 'REFUNDED' ||
      event === 'PURCHASE_CHARGEBACK' ||
      event === 'CHARGEBACK' ||
      event === 'PURCHASE_CANCELED' ||
      event === 'CANCELED' ||
      purchaseData.status === 'REFUNDED' ||
      purchaseData.status === 'CHARGEBACK' ||
      purchaseData.status === 'CANCELED';

    // A) APPROVED: Grant access to specific plan resources
    if (isApproved) {
      const accessRecord = db.registerOrUpdateAccess({
        email: buyerEmail || 'comprador@hotmart.com',
        name: buyerName,
        planId: resolvedPlanId,
        status: 'active',
        transactionId,
        productName,
        offerCode,
        reportId,
        purchasedAt: purchaseData.order_date || new Date().toISOString(),
        notes: `Pagamento aprovado na Hotmart. Plano liberado: ${resolvedPlanId.toUpperCase()}`
      });

      if (reportId) {
        db.unlockReport(reportId, resolvedPlanId, transactionId);
      }

      db.logWebhook({
        event,
        status: 'PROCESSED',
        reportId,
        buyerEmail,
        transactionId,
        planId: resolvedPlanId,
        rawPayloadSummary: `Pagamento APROVADO. Plano liberado: ${resolvedPlanId.toUpperCase()} (R$ ${db.getPlanById(resolvedPlanId)?.price.toFixed(2)}). Comprador: ${buyerEmail || 'não informado'}. Transação: ${transactionId}. Relatório: ${reportId || 'sem ID direto'}`
      });

      return res.status(200).json({
        status: 'success',
        message: `Pagamento confirmado. Recursos do plano ${resolvedPlanId.toUpperCase()} liberados com sucesso.`,
        transactionId,
        planId: resolvedPlanId,
        reportId: reportId || null,
        customerAccess: accessRecord
      });
    }

    // B) PENDING: Do NOT release access!
    if (isPending) {
      db.registerOrUpdateAccess({
        email: buyerEmail || 'pendente@hotmart.com',
        name: buyerName,
        planId: resolvedPlanId,
        status: 'pending',
        transactionId,
        productName,
        offerCode,
        reportId,
        purchasedAt: purchaseData.order_date || new Date().toISOString(),
        notes: `Compra pendente (Boleto/Pix aguardando compensação). Acesso mantido bloqueado.`
      });

      // Ensure report is NOT paid
      if (reportId) {
        db.revokeReportAccess(reportId);
      }

      db.logWebhook({
        event,
        status: 'IGNORED',
        reportId,
        buyerEmail,
        transactionId,
        planId: resolvedPlanId,
        rawPayloadSummary: `Notificação de pagamento PENDENTE (${event}). O acesso permanece estritamente bloqueado até a compensação financeira bancária. Comprador: ${buyerEmail}.`
      });

      return res.status(200).json({
        status: 'pending',
        message: 'Notificação de pagamento pendente recebida. O acesso ao plano permanece bloqueado até a confirmação de compensação da Hotmart.',
        transactionId,
        reportId: reportId || null
      });
    }

    // C) REFUND / CHARGEBACK / CANCELLATION: Revoke access
    if (isRevocation) {
      db.revokeAccessByTransaction(transactionId, event);

      if (reportId) {
        db.revokeReportAccess(reportId);
      }

      db.logWebhook({
        event,
        status: 'PROCESSED',
        reportId,
        buyerEmail,
        transactionId,
        planId: resolvedPlanId,
        rawPayloadSummary: `Notificação de ${event}. Acesso do cliente ${buyerEmail} revogado e relatório bloqueado.`
      });

      return res.status(200).json({
        status: 'revoked',
        message: `Acesso do cliente revogado devido a ${event}.`,
        transactionId,
        reportId: reportId || null
      });
    }

    // D) OTHER EVENTS: Log audit acknowledgement
    db.logWebhook({
      event,
      status: 'IGNORED',
      reportId,
      buyerEmail,
      transactionId,
      planId: resolvedPlanId,
      rawPayloadSummary: `Evento ${event} registrado para auditoria. Nenhuma alteração de acesso necessária.`
    });

    return res.status(200).json({
      status: 'acknowledged',
      message: `Evento ${event} recebido e arquivado para auditoria.`,
      transactionId
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro interno';
    console.error('Erro no processamento do webhook Hotmart:', err);
    db.logWebhook({
      event: 'EXCEPTION',
      status: 'ERROR',
      rawPayloadSummary: `Falha na execução do webhook: ${errorMsg}`
    });
    return res.status(500).json({ error: errorMsg });
  }
}
