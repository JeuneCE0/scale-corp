// Vercel Serverless Function - Revolut Business API Proxy
import { applyHeaders, verifyAuth, getAllowedRevolutCompany, rateLimit, getClientIP, apiLog, tooManyRequests, badRequest } from './_middleware.js';

const COMPANY_TOKEN_MAP = {
  eco: "REVOLUT_ECO_TOKEN",
  leadx: "REVOLUT_LEADX_TOKEN",
  bcs: "REVOLUT_BCS_TOKEN",
};

const REV_BASE = "https://b2b.revolut.com/api/1.0";
const VALID_ACTIONS = ['accounts', 'transactions'];

export default async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = getClientIP(req);
  if (!rateLimit('revolut', ip)) return tooManyRequests(res);

  const { action, company } = req.body || {};

  // Auth check
  const auth = await verifyAuth(req);
  if (!auth) {
    apiLog('warn', { api: 'revolut', action, reason: 'unauthed', ip });
  } else if (company && !getAllowedRevolutCompany(auth, company)) {
    return res.status(403).json({ error: "Access denied to this company" });
  }

  if (!action || !company) return badRequest(res, "Missing action or company");
  if (!VALID_ACTIONS.includes(action)) return badRequest(res, "Invalid action");

  const envVar = COMPANY_TOKEN_MAP[company];
  if (!envVar) return res.status(403).json({ error: "Invalid company" });

  const token = process.env[envVar];
  if (!token) return res.status(500).json({ error: "Token not configured" });

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let url;
  try {
    switch (action) {
      case "accounts":
        url = `${REV_BASE}/accounts`;
        break;
      case "transactions": {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
        url = `${REV_BASE}/transactions?from=${from}&count=100`;
        break;
      }
      default:
        return badRequest(res, `Unknown action: ${action}`);
    }

    const revRes = await fetch(url, { headers });
    if (!revRes.ok) {
      const text = await revRes.text();
      apiLog('error', { api: 'revolut', action }, { status: revRes.status });
      return res.status(revRes.status).json({ error: `Revolut API error: ${revRes.status}` });
    }

    return res.status(200).json(await revRes.json());
  } catch (e) {
    apiLog('error', { api: 'revolut', action }, { error: e.message });
    return res.status(500).json({ error: "Internal proxy error" });
  }
}
