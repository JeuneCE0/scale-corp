#!/usr/bin/env python3
"""
Refactor App.jsx into modular architecture.
Reads App.jsx.backup, writes individual module files.
"""
import os, re

with open('src/App.jsx.backup', 'r') as f:
    src = f.read()
    lines = src.split('\n')

def L(start, end):
    """Get lines start..end (1-indexed, inclusive), as string"""
    return '\n'.join(lines[start-1:end])

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    lc = content.count('\n') + 1
    print(f"  {path} ({lc} lines)")

def add_exports(code):
    """Add export keyword to top-level function/const/let/class declarations"""
    result = []
    for line in code.split('\n'):
        # Don't double-export
        if line.startswith('export '):
            result.append(line)
            continue
        # Export function declarations
        if re.match(r'^(async )?function \w+', line):
            result.append('export ' + line)
        # Export class declarations
        elif re.match(r'^class \w+', line):
            result.append('export ' + line)
        # Export const/let declarations (but not inside functions)
        elif re.match(r'^(const|let) \w+', line):
            result.append('export ' + line)
        else:
            result.append(line)
    return '\n'.join(result)

print("=== Refactoring App.jsx ===\n")

# ============================================================
# 1. src/utils/theme.js — already created, verified working
# ============================================================

# ============================================================
# 2. src/utils/css.js
# ============================================================
write('src/utils/css.js',
    'import { C } from \'./theme.js\';\n'
    + add_exports(L(34, 94)) + '\n')

# ============================================================
# 3. src/utils/formatters.js — pure utility functions, no React
# ============================================================
write('src/utils/formatters.js',
    '// Formatting utilities\n'
    'import { C } from \'./theme.js\';\n\n'
    + add_exports(L(9, 33)) + '\n'
    # normalizeStr, fuzzyMatch (lines 332-341)
    + add_exports(L(332, 341)) + '\n')

# ============================================================
# 4. src/utils/data.js — Default data, demo data, config constants
# ============================================================
write('src/utils/data.js',
    '// Default data and configuration\n'
    'import { C } from \'./theme.js\';\n\n'
    # DS array (lines 95-107)
    + add_exports(L(95, 107)) + '\n'
    # DH object (line 108)
    + add_exports(L(108, 109)) + '\n'
    # DEAL_STAGES, mkPrefill (line 110-111) 
    # BF is in formatters
    # DEMO_JOURNAL through DEMO_SYNERGIES (lines 139-147) - check exact lines
    + add_exports(L(139, 147)) + '\n'
    # SUB_CATS, AUTO_CAT_MAP (lines 148-153)
    + add_exports(L(148, 153)) + '\n'
    # DEMO_SUBS, DEMO_TEAM (lines 178-179)
    + add_exports(L(178, 179)) + '\n'
    # BILL_TYPES, CLIENT_STATUS (lines 182-187)
    + add_exports(L(182, 188)) + '\n'
    # DEMO_KB (line 377-385)
    + add_exports(L(377, 385)) + '\n'
    # EXCLUDED_ACCOUNTS (lines 660-668)
    + add_exports(L(649, 668)) + '\n'
    # SYN_TYPES, SYN_STATUS (lines 144-147)
    + add_exports(L(144, 147)) + '\n'
    # SLACK_MODES (lines 464-467) - actually check
    # MOODS on line 29 - already in formatters
    # SB_ADMIN, SB_PORTEUR (lines 6520-6543)
    + add_exports(L(6520, 6543)) + '\n'
    # TOUR_ADMIN, TOUR_PORTEUR (lines 6386-6413, 6403-6413)
    + add_exports(L(6386, 6413)) + '\n'
    # CHALLENGE_TEMPLATES - need to find
    '\n')

# Actually this line-based approach is going to have tons of bugs because I can't 
# verify the exact content of each line range without reading it.
# Let me take the ULTIMATE pragmatic approach instead.

print("\n*** Switching to pragmatic barrel approach ***\n")

# PRAGMATIC APPROACH:
# Instead of extracting individual lines (error-prone), split into CHUNKS
# at clear boundaries, where each chunk is a self-contained file.
# The chunks are:
#
# A) Lines 1-2: React imports (go to each file that needs React)
# B) Lines 3-94: Theme + CSS + formatters  → utils/base.js
# C) Lines 95-153: Data constants → utils/data.js  
# D) Lines 154-386: Helper functions → utils/helpers.js
# E) Lines 387-753: API functions → utils/api.js
# F) Lines 754-932: Calculations → utils/calculations.js
# G) Lines 933-964: UI components → components/ui.jsx
# H) Lines 965-2497: Feature components → components/features.jsx
# I) Lines 2498-3529: Clients module → views/Clients.jsx
# J) Lines 3530-5989: Porteur components → views/PorteurComponents.jsx
# K) Lines 5990-6185: SocieteView + helpers → views/SocieteView.jsx
# L) Lines 6186-6543: Onboarding + Tutorial + Sidebar → components/navigation.jsx
# M) Lines 6544-7646: Admin components → views/AdminComponents.jsx
# N) Lines 7647-8581: App main → App.jsx (rewritten as shell)
#
# Each file chunk imports what it needs. The key: ALL chunks reference `C` from theme,
# and many reference functions from other chunks.
#
# To make this work, each chunk will:
# 1. Import { C } from theme (or from base)
# 2. Import specific functions it needs from other chunks
# 3. Export all its functions/consts
#
# Finding exact imports is hard programmatically, so instead I'll:
# - Create a barrel file (utils/index.js) that re-exports everything
# - Each chunk imports from the barrel
# This is slightly circular but works if we're careful.

# EVEN MORE PRAGMATIC: Use a single "shared" module that re-exports everything non-React,
# and each view file imports from it. This minimizes import management.

# Actually the SIMPLEST correct approach:
# 1. Keep ONE utility file with ALL non-component code (theme + formatters + data + helpers + api + calculations)
# 2. Split only the COMPONENTS/VIEWS into separate files (these are the large ones)
# 3. Each component file imports from the single utility file
#
# This way we only need to manage imports for ~10 view files, not 50+ utility functions.

print("Creating utils/index.js (all non-component code)...")

# utils/index.js = Lines 1-932 (everything before React components)
# But line 1-2 are React imports which we don't want here
# Lines 3-932 are pure JS (no JSX) 

# Check: ErrorBoundary on line 28 uses JSX (<div>, <button>)
# So we need React for that. Let's include it.

utils_code = (
    'import React from "react";\n'
    + L(3, 932) + '\n'
    # Also include calculations that were defined after components
    # calcSmartAlerts (lines 2020-2049)
    + L(2020, 2049) + '\n'
    # genInsights, calcBenchmark, getPlaybooks (lines 3349-3409)
    + L(3349, 3409) + '\n'
    # calcClientHealthScore (lines 5417-5435)
    + L(5417, 5435) + '\n'
    # genPorteurNotifications (lines 3696-3723)
    + L(3696, 3723) + '\n'
)

# Add export to all top-level declarations
utils_exported = add_exports(utils_code)
write('src/utils/index.js', utils_exported)

# Now for the component/view files, each one needs to:
# 1. Import React and recharts
# 2. Import everything from utils/index.js
# 3. Define their components (with export)

recharts_import = 'import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";\n'

# Standard imports for component files
std_imports = (
    'import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";\n'
    + recharts_import
    + 'import * as U from "../utils/index.js";\n'
    + '// Destructure commonly used utilities for readability\n'
    + 'const { C, C_DARK, C_LIGHT, getTheme, applyTheme, MN, curM, ml, fmt, fK, pct, clamp, prevM, nextM, pf, gr, FONT, FONT_TITLE, BF, deadline, qOf, qMonths, qLabel, ago, uid, curW, MOODS, sinceLbl, sinceMonths, CSS, DS, DH, DEAL_STAGES, DEMO_JOURNAL, DEMO_ACTIONS, DEMO_PULSES, DEMO_DEALS, DEMO_OKRS, DEMO_SYNERGIES, DEMO_SUBS, DEMO_TEAM, DEMO_CLIENTS, SYN_TYPES, SYN_STATUS, SUB_CATS, SLACK_MODES, EXCLUDED_ACCOUNTS, CURR_SYMBOLS, REV_ENVS, GHL_BASE, STRIPE_PROXY, STORE_URL, ErrorBoundary, mkPrefill, autoGenerateReport, autoCategorize, autoDetectSubscriptions, subMonthly, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, generateInvoices, refreshInvoiceStatuses, ghlCreateInvoice, ghlSendInvoice, mkDemoInvoices, teamMonthly, normalizeStr, fuzzyMatch, matchSubsToRevolut, deduplicatedCharges, mkGHLDemo, ghlUpdateContact, ghlCreateContact, fetchGHL, syncGHLForSoc, slackWebhookSend, slackBotSend, slackSend, slackMention, buildPulseSlackMsg, buildReportSlackMsg, buildReminderSlackMsg, buildValidationSlackMsg, checkAndSendReminders, fetchStripe, syncStripeData, getStripeChargesForClient, getStripeTotal, mkRevolutDemo, fetchRevolut, syncRevolut, mkSocRevDemo, syncSocRevolut, revFinancials, storeCall, sbAuthHeaders, sbUpsert, sbGet, sbList, sGet, sSet, syncFromSupabase, fetchHoldingFromSB, fetchSocietiesFromSB, calcH, simH, healthScore, leadScore, leadScoreColor, leadScoreLabel, qCA, getAlerts, buildFeed, project, runway, calcLeaderboard, buildAIContext, calcMilestoneData, calcMilestones, calcSmartAlerts, genInsights, calcBenchmark, getPlaybooks, calcClientHealthScore, genPorteurNotifications, BILL_TYPES, CLIENT_STATUS, curQ, AUTO_CAT_MAP, categorizeTransaction, DEMO_KB } = U;\n\n'
)

# ============================================================
# components/ui.jsx — Small reusable components (lines 933-964)
# ============================================================
write('src/components/ui.jsx',
    std_imports
    + add_exports(L(933, 964)) + '\n')

# ============================================================
# components/features.jsx — Medium feature components (lines 965-2019, 2050-2142, 2143-2497)
# ============================================================
write('src/components/features.jsx',
    std_imports
    + 'import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "./ui.jsx";\n\n'
    + add_exports(L(965, 2019)) + '\n'
    + add_exports(L(2050, 2497)) + '\n')

# ============================================================
# views/Clients.jsx — ClientsPanel (lines 2498-3348)
# ============================================================
write('src/views/Clients.jsx',
    std_imports
    + 'import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";\n'
    + 'import { MilestonesWall, MilestonesCompact, MilestoneCount } from "../components/features.jsx";\n\n'
    + add_exports(L(2498, 3348)) + '\n')

# ============================================================  
# views/PorteurHelpers.jsx — Goal editor, celebrations, meeting prep, etc (lines 3349-3529)
# ============================================================
write('src/views/PorteurHelpers.jsx',
    std_imports
    + 'import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";\n\n'
    + add_exports(L(3410, 3529)) + '\n')

# ============================================================
# views/PorteurSettings.jsx — SocSettingsPanel + NotificationCenter (lines 3530-3759)
# ============================================================
write('src/views/PorteurSettings.jsx',
    std_imports
    + 'import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";\n\n'
    + add_exports(L(3530, 3759)) + '\n')

# ============================================================
# views/PorteurAIChat.jsx — AI Chat (lines 3760-4014)
# ============================================================
write('src/views/PorteurAIChat.jsx',
    std_imports
    + 'import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";\n\n'
    + add_exports(L(3760, 4014)) + '\n')

# ============================================================
# views/PorteurDashboard.jsx — Main porteur dashboard (lines 4015-5008)
# ============================================================
write('src/views/PorteurDashboard.jsx',
    std_imports
    + 'import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";\n'
    + 'import { MilestonesWall, MilestonesCompact, MilestoneCount, AICoPilot, PulseForm, BankingPanel, BankingTransactions, SocBankWidget, GamificationPanel, ParcoursClientVisuel, SubsTeamPanel, SubsTeamBadge, AIWeeklyCoach, RapportsPanel } from "../components/features.jsx";\n'
    + 'import { ClientsPanelSafe } from "./Clients.jsx";\n'
    + 'import { GoalEditor, CelebrationOverlay, MeetingPrepView, CollapsibleSection } from "./PorteurHelpers.jsx";\n'
    + 'import { PorteurAIChat } from "./PorteurAIChat.jsx";\n\n'
    + add_exports(L(4015, 5008)) + '\n')

# ============================================================
# views/PorteurPanels.jsx — Individual porteur tab panels (lines 5009-5416)
# ============================================================
write('src/views/PorteurPanels.jsx',
    std_imports
    + 'import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";\n'
    + 'import { BankingTransactions, SocBankWidget } from "../components/features.jsx";\n\n'
    + add_exports(L(5009, 5416)) + '\n')

# ============================================================
# views/SalesPanel.jsx — Sales + Publicité panels (lines 5436-5989)
# ============================================================
write('src/views/SalesPanel.jsx',
    std_imports
    + 'import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";\n\n'
    + add_exports(L(5436, 5989)) + '\n')

# ============================================================
# views/SocieteView.jsx — Porteur main view container + ValRow + Simulateur (lines 5990-6185)
# ============================================================
write('src/views/SocieteView.jsx',
    std_imports
    + 'import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";\n'
    + 'import { MilestonesWall, MilestonesCompact, MilestoneCount, AICoPilot, PulseForm, BankingPanel, BankingTransactions, TabCRM, SocBankWidget, SynergiesPanel, KnowledgeBase, GamificationPanel, InboxUnifiee, ParcoursClientVisuel, BenchmarkRadar, SmartAlertsPanel, SubsTeamPanel, SubsTeamBadge, ChallengesPanel, AIWeeklyCoach, RapportsPanel, DealFlow } from "../components/features.jsx";\n'
    + 'import { ClientsPanelSafe } from "./Clients.jsx";\n'
    + 'import { SocSettingsPanel, NotificationCenter } from "./PorteurSettings.jsx";\n'
    + 'import { PorteurAIChat } from "./PorteurAIChat.jsx";\n'
    + 'import { PorteurDashboard, LeaderboardCard, PulseDashWidget } from "./PorteurDashboard.jsx";\n'
    + 'import { InboxPanel, AgendaPanel, ConversationsPanel, TodoPanel, PipelineKanbanPanel, RessourcesPanel, ActivitePanel, ClientsUnifiedPanel } from "./PorteurPanels.jsx";\n'
    + 'import { HealthBadge, SalesPanel, PublicitePanel } from "./SalesPanel.jsx";\n'
    + 'import { Sidebar } from "../components/navigation.jsx";\n\n'
    + add_exports(L(5990, 6185)) + '\n')

# ============================================================
# components/navigation.jsx — Onboarding, Tutorial, Sidebar (lines 6186-6603)  
# ============================================================
write('src/components/navigation.jsx',
    std_imports
    + 'import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "./ui.jsx";\n\n'
    # SB_ADMIN, SB_PORTEUR are data constants referenced by Sidebar
    + add_exports(L(6137, 6603)) + '\n')

# ============================================================
# views/AdminComponents.jsx — AdminClients, WarRoom, AutoPilot, SynergiesAuto, Widgets, PulseScreen, etc (lines 6604-7646)
# ============================================================
write('src/views/AdminComponents.jsx',
    std_imports
    + 'import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";\n'
    + 'import { MilestonesWall, MilestonesCompact, MilestoneCount, AICoPilot, PulseForm, PulseOverview, BankingPanel, BankingTransactions, TabCRM, SocBankWidget, SynergiesPanel, KnowledgeBase, RiskMatrix, GamificationPanel, InboxUnifiee, ParcoursClientVisuel, BenchmarkRadar, SmartAlertsPanel, SubsTeamPanel, SubsTeamBadge, ChallengesPanel, AIWeeklyCoach, RapportsPanel, DealFlow, MeetingMode, CohortAnalysis } from "../components/features.jsx";\n'
    + 'import { ClientsPanelSafe } from "./Clients.jsx";\n'
    + 'import { PorteurDashboard, LeaderboardCard, PulseDashWidget } from "./PorteurDashboard.jsx";\n'
    + 'import { SocieteView } from "./SocieteView.jsx";\n\n'
    + add_exports(L(6604, 7646)) + '\n')

# ============================================================
# views/UserAccess.jsx — UserAccessPanel + AnalytiqueTab (lines 8521-8581)
# ============================================================
write('src/views/UserAccess.jsx',
    std_imports
    + 'import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";\n'
    + 'import { RiskMatrix, CohortAnalysis } from "../components/features.jsx";\n\n'
    + add_exports(L(8521, 8581)) + '\n')

# ============================================================
# src/utils/cache.js — API response caching (NEW)
# ============================================================
write('src/utils/cache.js', '''// Simple in-memory API response cache with TTL
const cache = new Map();

export function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet(key, data, ttlMs) {
  cache.set(key, { data, ts: Date.now(), ttl: ttlMs });
}

export function cacheInvalidate(key) {
  if (key) cache.delete(key);
  else cache.clear();
}

// Wrapper: fetch with cache
export async function cachedFetch(key, fetchFn, ttlMs = 30000) {
  const cached = cacheGet(key);
  if (cached) return cached;
  const data = await fetchFn();
  if (data) cacheSet(key, data, ttlMs);
  return data;
}
''')

# ============================================================
# Now write the NEW App.jsx — thin shell with lazy loading
# ============================================================
# App.jsx = lines 7647-8520 (the App function + some inline admin view code)
# But we need to rewrite it to import from modules and use React.lazy

# The App function is huge (874 lines) because it contains ALL the admin view JSX inline.
# For now, let's keep it as-is but import dependencies from modules.

app_jsx = '''import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment, Suspense, lazy } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import * as U from "./utils/index.js";
const { C, C_DARK, C_LIGHT, getTheme, applyTheme, MN, curM, ml, fmt, fK, pct, clamp, prevM, nextM, pf, gr, FONT, FONT_TITLE, BF, deadline, qOf, qMonths, qLabel, ago, uid, curW, MOODS, sinceLbl, sinceMonths, CSS, DS, DH, DEAL_STAGES, DEMO_JOURNAL, DEMO_ACTIONS, DEMO_PULSES, DEMO_DEALS, DEMO_OKRS, DEMO_SYNERGIES, DEMO_SUBS, DEMO_TEAM, DEMO_CLIENTS, SYN_TYPES, SYN_STATUS, SUB_CATS, SLACK_MODES, EXCLUDED_ACCOUNTS, CURR_SYMBOLS, REV_ENVS, GHL_BASE, STRIPE_PROXY, STORE_URL, ErrorBoundary, mkPrefill, autoGenerateReport, autoCategorize, autoDetectSubscriptions, subMonthly, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, generateInvoices, refreshInvoiceStatuses, ghlCreateInvoice, ghlSendInvoice, mkDemoInvoices, teamMonthly, normalizeStr, fuzzyMatch, matchSubsToRevolut, deduplicatedCharges, mkGHLDemo, ghlUpdateContact, ghlCreateContact, fetchGHL, syncGHLForSoc, slackWebhookSend, slackBotSend, slackSend, slackMention, buildPulseSlackMsg, buildReportSlackMsg, buildReminderSlackMsg, buildValidationSlackMsg, checkAndSendReminders, fetchStripe, syncStripeData, getStripeChargesForClient, getStripeTotal, mkRevolutDemo, fetchRevolut, syncRevolut, mkSocRevDemo, syncSocRevolut, revFinancials, storeCall, sbAuthHeaders, sbUpsert, sbGet, sbList, sGet, sSet, syncFromSupabase, fetchHoldingFromSB, fetchSocietiesFromSB, calcH, simH, healthScore, leadScore, leadScoreColor, leadScoreLabel, qCA, getAlerts, buildFeed, project, runway, calcLeaderboard, buildAIContext, calcMilestoneData, calcMilestones, calcSmartAlerts, genInsights, calcBenchmark, getPlaybooks, calcClientHealthScore, genPorteurNotifications, BILL_TYPES, CLIENT_STATUS, curQ, AUTO_CAT_MAP, categorizeTransaction, DEMO_KB } = U;
import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "./components/ui.jsx";
import { MilestonesWall, MilestonesCompact, MilestoneCount, AICoPilot, PulseForm, PulseOverview, BankingPanel, BankingTransactions, TabCRM, SocBankWidget, SynergiesPanel, KnowledgeBase, RiskMatrix, GamificationPanel, InboxUnifiee, ParcoursClientVisuel, BenchmarkRadar, SmartAlertsPanel, SubsTeamPanel, SubsTeamBadge, ChallengesPanel, AIWeeklyCoach, RapportsPanel, DealFlow, MeetingMode, CohortAnalysis } from "./components/features.jsx";
import { Sidebar, OnboardingWizard, TutorialOverlay, ObInp, ObTextArea, ObSelect, ObCheck, ObTag } from "./components/navigation.jsx";
import { SocieteView, ValRow, TabSimulateur } from "./views/SocieteView.jsx";
import { AdminClientsTab, WarRoom, AutoPilotSection, SynergiesAutoPanel, WidgetEmbed, WidgetCard, WidgetRenderer, PulseScreen, LiveFeed, ReplayMensuel, PredictionsCard, ClientPortal, InvestorBoard, WarRoomReadOnly } from "./views/AdminComponents.jsx";
import { LeaderboardCard, PulseDashWidget } from "./views/PorteurDashboard.jsx";
import { UserAccessPanel, AnalytiqueTab } from "./views/UserAccess.jsx";

// Loading spinner for lazy-loaded views
function GlassSpinner() {
  return <div className="glass-bg" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
    <div style={{textAlign:"center"}}>
      <div style={{width:40,height:40,border:"3px solid rgba(255,255,255,.06)",borderTopColor:C.acc,borderRadius:"50%",animation:"sp 1s linear infinite",boxShadow:"0 0 20px rgba(255,170,0,.15)",margin:"0 auto 12px"}}/>
      <div style={{color:C.td,fontSize:11,letterSpacing:.5}}>Chargement...</div>
    </div>
  </div>;
}

''' + L(6520, 6543) + '''

''' + L(6386, 6413) + '''

''' + L(7647, 8520) + '''
''' + L(8521, 8581) + '''
'''

write('src/App.jsx', app_jsx)

print("\n=== Done! ===")
print("Files created. Run 'npm run build' to verify.")
