#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, 'src/App.jsx');
let src = fs.readFileSync(APP, 'utf8');
const lines = src.split('\n');

// We need to:
// 1. Remove extracted code blocks from App.jsx
// 2. Add imports at the top
// 3. Write extracted files

// Phase 1: Identify line ranges to extract
// Strategy: mark lines for removal and track what goes where

// Helper: find line index (0-based) containing exact text
function findIdx(text, after=0) {
  for (let i = after; i < lines.length; i++) {
    if (lines[i].includes(text)) return i;
  }
  return -1;
}

// Find end of function/block by brace matching
function findBlockEnd(startIdx) {
  let depth = 0, started = false;
  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') { depth++; started = true; }
      if (ch === '}') depth--;
      if (started && depth === 0) return i;
    }
  }
  return startIdx;
}

// Mark lines for removal
const remove = new Set();

function markRange(start, end) {
  for (let i = start; i <= end; i++) remove.add(i);
}

function markLine(idx) { remove.add(idx); }

// Extract a single-line const/let/function
function markSingleLine(text) {
  const idx = findIdx(text);
  if (idx >= 0) markLine(idx);
  return idx;
}

// Extract a multi-line function
function markFunc(text) {
  const idx = findIdx(text);
  if (idx < 0) return [-1, -1];
  const end = findBlockEnd(idx);
  markRange(idx, end);
  return [idx, end];
}

// === THEME ===
markSingleLine('const C_DARK=');
markSingleLine('const C_LIGHT=');
markSingleLine('let C=C_DARK');
markFunc('function getTheme()');
markFunc('function applyTheme(');
markSingleLine('applyTheme(getTheme())');

// === HELPERS ===
markSingleLine("const MN=[");
markSingleLine("const curM=");
markSingleLine("const ml=");
markSingleLine("const fmt=");
markSingleLine("const fK=");
markSingleLine("const pct=");
markSingleLine("const clamp=");
markSingleLine("const prevM=");
markSingleLine("const nextM=");
markSingleLine("const pf=");
markSingleLine("const curW=");
markSingleLine("const sinceLbl=");
markSingleLine("const sinceMonths=");
markSingleLine("const uid=");
markSingleLine("const ago=");
markSingleLine("const deadline=");
markSingleLine("const qOf=");
markSingleLine("const qMonths=");
markSingleLine("const qLabel=");
markFunc("function normalizeStr(");
markFunc("function fuzzyMatch(");
markFunc("function qCA(");
markFunc("function getAlerts(");
markFunc("function buildFeed(");
markSingleLine("function project(");
markSingleLine("function runway(");
markFunc("function calcLeaderboard(");
markFunc("function buildAIContext(");
markFunc("function calcSmartAlerts(");
markSingleLine("const curQ=");

// === CONSTANTS (already have theme.js and will move to constants.js) ===
markSingleLine("const FONT=");
markSingleLine("const FONT_TITLE=");
markSingleLine("const BF=");
markSingleLine("const MOODS=");
markSingleLine("const DEAL_STAGES=");
markSingleLine("const DEMO_JOURNAL=");
markSingleLine("const DEMO_ACTIONS=");
markSingleLine("const DEMO_PULSES=");
markSingleLine("const DEMO_DEALS=");
markSingleLine("const DEMO_OKRS=");
markSingleLine("const DEMO_SYNERGIES=");
markSingleLine("const DEMO_SUBS=");
markSingleLine("const DEMO_TEAM=");
markSingleLine("const DEMO_CLIENTS=");
markSingleLine("const GHL_STAGES_COLORS=");
markSingleLine("const GHL_BASE=");
markSingleLine("const STRIPE_PROXY=");
markSingleLine("const REV_ENVS=");
markSingleLine("const CURR_SYMBOLS=");
markSingleLine("const STORE_URL=");
markSingleLine("const SYN_TYPES=");
markSingleLine("const SYN_STATUS=");
markSingleLine("const CLIENT_STATUS=");
markSingleLine("const BILL_TYPES={");  // multi-line
{
  const idx = findIdx("const BILL_TYPES={");
  if (idx >= 0) { const end = findBlockEnd(idx); markRange(idx, end); }
}
markSingleLine("const INV_STATUS={");
{
  const idx = findIdx("const INV_STATUS={");
  if (idx >= 0) { const end = findBlockEnd(idx); markRange(idx, end); }
}
markSingleLine("const KB_CATS=");
markSingleLine("const MILESTONE_CATS=");
markSingleLine("const TIER_COLORS=");
markSingleLine("const TIER_BG=");
markSingleLine("const SLACK_MODES={");
{
  const idx = findIdx("const SLACK_MODES={");
  if (idx >= 0) { const end = findBlockEnd(idx); markRange(idx, end); }
}

// SUB_CATS line
markSingleLine("const SUB_CATS={crm:");
// AUTO_CAT_MAP
{
  const idx = findIdx("const AUTO_CAT_MAP=[");
  if (idx >= 0) {
    let end = idx;
    for (let i = idx; i < lines.length; i++) {
      if (lines[i].includes('];')) { end = i; break; }
    }
    markRange(idx, end);
  }
}

// DS array
{
  const idx = findIdx("const DS=[");
  if (idx >= 0) {
    let end = idx;
    for (let i = idx; i < lines.length; i++) {
      if (lines[i].trimStart().startsWith('];')) { end = i; break; }
    }
    markRange(idx, end);
  }
}

// DH
markSingleLine("const DH={logiciels:");

// DEMO_KB
{
  const idx = findIdx("const DEMO_KB=[");
  if (idx >= 0) {
    let end = idx;
    for (let i = idx; i < lines.length; i++) {
      if (lines[i].trimStart().startsWith('];')) { end = i; break; }
    }
    markRange(idx, end);
  }
}

// EXCLUDED_ACCOUNTS
{
  const idx = findIdx("const EXCLUDED_ACCOUNTS={");
  if (idx >= 0) { const end = findBlockEnd(idx); markRange(idx, end); }
}

// === FINANCE ===
markFunc("function revFinancials(");
markFunc("function clientMonthlyRevenue(");
markFunc("function clientTotalValue(");
markFunc("function commitmentEnd(");
markFunc("function commitmentRemaining(");
markFunc("function subMonthly(");
markFunc("function teamMonthly(");
markFunc("function autoDetectSubscriptions(");
markFunc("function autoCategorize(");
markFunc("function matchSubsToRevolut(");
markFunc("function deduplicatedCharges(");

// === REPORTS ===
markFunc("function autoGenerateReport(");
markFunc("function mkPrefill(");

// === INVOICES ===
markFunc("function generateInvoices(");
markFunc("function refreshInvoiceStatuses(");
markFunc("function mkDemoInvoices(");
markFunc("function ghlCreateInvoice(");
markFunc("function ghlSendInvoice(");

// === SCORING ===
markFunc("function healthScore(");
markFunc("function leadScore(");
markSingleLine("function leadScoreColor(");
markSingleLine("function leadScoreLabel(");
markFunc("function calcH(");
markFunc("function simH(");
markFunc("function calcMilestoneData(");
markFunc("function calcMilestones(");
// MILESTONE_DEFS
{
  const idx = findIdx("const MILESTONE_DEFS=[");
  if (idx >= 0) {
    let end = idx;
    for (let i = idx; i < lines.length; i++) {
      if (lines[i].trimStart().startsWith('];')) { end = i; break; }
    }
    markRange(idx, end);
  }
}

// === API ===
markFunc("function mkGHLDemo(");
markFunc("async function ghlUpdateContact(");
markFunc("async function ghlCreateContact(");
markFunc("async function fetchGHL(");
markFunc("async function syncGHLForSoc(");
markFunc("async function fetchRevolut(");
markFunc("async function syncRevolut(");
markFunc("function mkRevolutDemo(");
markFunc("function mkSocRevDemo(");
markFunc("async function syncSocRevolut(");
markFunc("async function fetchStripe(");
markFunc("async function syncStripeData(");
markFunc("function getStripeChargesForClient(");
markFunc("function getStripeTotal(");
// Store/Supabase
let storeTokenLine = markSingleLine("let _storeToken=");
let currentSocLine = markSingleLine("let _currentSocId=");
markFunc("async function storeCall(");
markFunc("function sbAuthHeaders(");
markFunc("function sbUpsert(");
markFunc("async function sbGet(");
markFunc("async function sbList(");
markFunc("async function sGet(");
markFunc("async function sSet(");
markFunc("async function syncFromSupabase(");
markFunc("async function fetchHoldingFromSB(");
markFunc("async function fetchSocietiesFromSB(");
// Session timeout IIFE
{
  const idx = findIdx("// Session timeout: auto-logout");
  if (idx >= 0) {
    // Find the end of the IIFE - it's `)();`
    for (let i = idx; i < lines.length; i++) {
      if (lines[i].includes('})();')) { markRange(idx, i); break; }
    }
  }
}

// === SLACK ===
markFunc("async function slackWebhookSend(");
markFunc("async function slackBotSend(");
markFunc("async function slackSend(");
markFunc("function slackMention(");
markFunc("function buildPulseSlackMsg(");
markFunc("function buildReportSlackMsg(");
markFunc("function buildReminderSlackMsg(");
markFunc("function buildValidationSlackMsg(");
markFunc("async function checkAndSendReminders(");

// === CSS ===
// The CSS const is a big template literal
{
  const idx = findIdx("const CSS=`");
  if (idx >= 0) {
    let end = idx;
    for (let i = idx; i < lines.length; i++) {
      if (i > idx && lines[i].includes('`;')) { end = i; break; }
      // single line CSS
      if (lines[i].endsWith("`;")) { end = i; break; }
    }
    markRange(idx, end);
  }
}

// ErrorBoundary class
{
  const idx = findIdx("class ErrorBoundary");
  if (idx >= 0) {
    const end = findBlockEnd(idx);
    markRange(idx, end);
  }
}

// === CHALLENGE_TEMPLATES ===
{
  const idx = findIdx("const CHALLENGE_TEMPLATES=[");
  if (idx >= 0) {
    let end = idx;
    for (let i = idx; i < lines.length; i++) {
      if (lines[i].trimStart().startsWith('];')) { end = i; break; }
    }
    markRange(idx, end);
  }
}

// === TOUR constants ===
{
  const idx = findIdx("const TOUR_ADMIN=[");
  if (idx >= 0) {
    let end = idx;
    for (let i = idx; i < lines.length; i++) {
      if (lines[i].trimStart().startsWith('];')) { end = i; break; }
    }
    markRange(idx, end);
  }
}
{
  const idx = findIdx("const TOUR_PORTEUR=[");
  if (idx >= 0) {
    let end = idx;
    for (let i = idx; i < lines.length; i++) {
      if (lines[i].trimStart().startsWith('];')) { end = i; break; }
    }
    markRange(idx, end);
  }
}

// SB_ADMIN, SB_PORTEUR
{
  const idx = findIdx("const SB_ADMIN=[");
  if (idx >= 0) {
    let end = idx;
    for (let i = idx; i < lines.length; i++) {
      if (lines[i].trimStart().startsWith('];')) { end = i; break; }
    }
    markRange(idx, end);
  }
}
{
  const idx = findIdx("const SB_PORTEUR=[");
  if (idx >= 0) {
    let end = idx;
    for (let i = idx; i < lines.length; i++) {
      if (lines[i].trimStart().startsWith('];')) { end = i; break; }
    }
    markRange(idx, end);
  }
}

// Now remove marked lines and add imports
console.log(`Marked ${remove.size} lines for removal out of ${lines.length}`);

// Build new App.jsx
const imports = `import { C_DARK, C_LIGHT, C, getTheme, applyTheme } from './utils/theme.js';
import { FONT, FONT_TITLE, BF, MN, MOODS, DEAL_STAGES, DEMO_JOURNAL, DEMO_ACTIONS, DEMO_PULSES, DEMO_DEALS, DEMO_OKRS, DEMO_SYNERGIES, DEMO_SUBS, DEMO_TEAM, DEMO_CLIENTS, DEMO_KB, GHL_STAGES_COLORS, GHL_BASE, STRIPE_PROXY, REV_ENVS, CURR_SYMBOLS, STORE_URL, EXCLUDED_ACCOUNTS, SLACK_MODES, DS, DH, SYN_TYPES, SYN_STATUS, SUB_CATS, AUTO_CAT_MAP, CLIENT_STATUS, INV_STATUS, KB_CATS, BILL_TYPES, MILESTONE_CATS, TIER_COLORS, TIER_BG, CHALLENGE_TEMPLATES, TOUR_ADMIN, TOUR_PORTEUR, SB_ADMIN, SB_PORTEUR } from './utils/constants.js';
import { fmt, fK, pf, pct, clamp, uid, curM, prevM, nextM, ml, sinceLbl, sinceMonths, curW, curQ, ago, deadline, qOf, qMonths, qLabel, gr, normalizeStr, fuzzyMatch, qCA, getAlerts, buildFeed, project, runway, calcLeaderboard, buildAIContext, calcSmartAlerts, CSS, ErrorBoundary } from './utils/helpers.js';
import { revFinancials, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, subMonthly, teamMonthly, autoDetectSubscriptions, autoCategorize, matchSubsToRevolut, deduplicatedCharges } from './utils/finance.js';
import { autoGenerateReport, mkPrefill } from './utils/reports.js';
import { generateInvoices, refreshInvoiceStatuses, mkDemoInvoices, ghlCreateInvoice, ghlSendInvoice } from './utils/invoices.js';
import { healthScore, leadScore, leadScoreColor, leadScoreLabel, calcH, simH, calcMilestoneData, calcMilestones, MILESTONE_DEFS } from './utils/scoring.js';
import { fetchGHL, syncGHLForSoc, mkGHLDemo, ghlUpdateContact, ghlCreateContact, fetchRevolut, syncRevolut, mkRevolutDemo, mkSocRevDemo, syncSocRevolut, fetchStripe, syncStripeData, getStripeChargesForClient, getStripeTotal, sbAuthHeaders, sbUpsert, sbGet, sbList, fetchHoldingFromSB, fetchSocietiesFromSB, sGet, sSet, syncFromSupabase, storeCall, _storeToken, _currentSocId, setStoreToken, setCurrentSocId } from './utils/api.js';
import { slackMention, buildPulseSlackMsg, buildReportSlackMsg, buildReminderSlackMsg, buildValidationSlackMsg, slackWebhookSend, slackBotSend, slackSend, checkAndSendReminders } from './utils/slack.js';
`;

const newLines = [];
let addedImports = false;

for (let i = 0; i < lines.length; i++) {
  if (remove.has(i)) continue;
  
  // After the React import line, add our imports
  if (!addedImports && lines[i].startsWith('import React,')) {
    newLines.push(lines[i]);
    newLines.push(lines[i+1]); // recharts import
    newLines.push(imports);
    addedImports = true;
    remove.add(i+1); // skip recharts on next iteration
    continue;
  }
  
  // Replace _storeToken and _currentSocId assignments
  let line = lines[i];
  line = line.replace(/_storeToken=/g, 'setStoreToken(').replace(/;(\s*)\/\//g, ');$1//');
  // Actually this is too fragile, let's not do regex replacements
  
  newLines.push(lines[i]);
}

fs.writeFileSync(APP, newLines.join('\n'));
console.log(`New App.jsx: ${newLines.length} lines (removed ${lines.length - newLines.length})`);
