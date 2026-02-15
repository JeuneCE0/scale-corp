// Script to split components.jsx into chunks
import fs from 'fs';

const src = fs.readFileSync('src/components.jsx', 'utf8');
const lines = src.split('\n');

// Common imports header - each chunk file gets these
const REACT_IMPORT = `import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";`;
const RECHARTS_IMPORT = `import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";`;

// Get the shared imports (lines 3-12 in 0-indexed = lines 2-11)
const sharedImportLines = lines.slice(2, 12);
// Fix path for files in components/ subdirectory
const sharedImportChunk = sharedImportLines.join('\n').replace('./shared.jsx', '../shared.jsx');
const sharedImportRoot = sharedImportLines.join('\n');

// Define chunks with line ranges (1-indexed from grep output)
// Format: [startLine, endLine] inclusive
const chunks = {
  'UI': {
    file: 'src/components/UI.jsx',
    ranges: [[14, 44]], // Badge through ActionItem
    desc: 'UI primitives'
  },
  'AI': {
    file: 'src/components/AI.jsx',
    ranges: [[46, 82], [1538, 1578]], // AICoPilot + AIWeeklyCoach
    desc: 'AI components'
  },
  'PulseScreen': {
    file: 'src/components/PulseScreen.jsx',
    ranges: [[6018, 6422], [6423, 6460], [6526, 6585]], // PulseScreen + LiveFeed + PredictionsCard
    desc: 'Pulse fullscreen dashboard',
    internalImports: ['Card', 'KPI', 'PBar', 'Btn', 'Sect', 'Modal', 'Inp', 'Sel', 'CTip', 'Badge', 'GradeBadge', 'Toggle']
  },
  'Banking': {
    file: 'src/components/Banking.jsx',
    ranges: [[218, 341], [502, 591]], // categorizeTransaction, BankingPanel, BankingTransactions, SocBankWidget
    desc: 'Banking components'
  },
  'CRM': {
    file: 'src/components/CRM.jsx',
    ranges: [[342, 420]], // TabCRM
    desc: 'CRM components'
  },
  'Reports': {
    file: 'src/components/Reports.jsx',
    ranges: [[592, 746], [6461, 6525]], // RapportsPanel + ReplayMensuel
    desc: 'Reports'
  },
  'PorteurView': {
    file: 'src/components/PorteurView.jsx',
    ranges: [
      [2777, 2840], // genPorteurNotifications, NotificationCenter
      [2841, 3095], // PorteurAIChat
      [3096, 3132], // LeaderboardCard
      [3133, 3176], // PulseDashWidget
      [3177, 4089], // PorteurDashboard
      [4090, 4163], // InboxPanel
      [4164, 4210], // ConversationsPanel (AgendaPanel is 4129-4163)
      [4211, 4254], // TodoPanel
      [4255, 4282], // PipelineKanbanPanel
      [4283, 4321], // RessourcesPanel
      [4322, 4411], // ActivitePanel
      [4412, 4527], // ClientsUnifiedPanel, calcClientHealthScore, HealthBadge
      [4528, 4810], // SalesPanel
      [4811, 5070], // PublicitePanel
    ],
    desc: 'Porteur view'
  },
  'AdminDashboard': {
    file: 'src/components/AdminDashboard.jsx',
    ranges: [
      [5154, 5188], // ValRow
      [5685, 5713], // AdminClientsTab
      [184, 217], // DealFlow
      [117, 183], // MeetingMode
      [1101, 1153], // calcSmartAlerts, SmartAlertsPanel
      [1154, 1214], // CohortAnalysis
      [1061, 1100], // BenchmarkRadar
      [876, 929], // RiskMatrix
    ],
    desc: 'Admin dashboard'
  },
  'Misc': {
    file: 'src/components/Misc.jsx',
    ranges: [
      [83, 116], // PulseForm, PulseOverview
      [421, 501], // MilestonesWall, MilestonesCompact, MilestoneCount
      [747, 814], // SynergiesPanel
      [815, 875], // KnowledgeBase
      [930, 1000], // GamificationPanel
      [1001, 1060], // InboxUnifiee, ParcoursClientVisuel
      [1215, 1223], // CHALLENGE_TEMPLATES
      [1224, 1465], // SubsTeamPanel, SubsTeamBadge
      [1466, 1537], // ChallengesPanel
      [1579, 2429], // ClientsPanelSafe, ClientsPanelInner
      [2430, 2527], // genInsights, calcBenchmark, getPlaybooks, GoalEditor
      [2528, 2624], // CelebrationOverlay, MeetingPrepView, CollapsibleSection
      [2625, 2776], // SocSettingsPanel
      [5071, 5153], // SocieteView
      [5189, 5466], // TabSimulateur, Ob*, OnboardingWizard
      [5467, 5600], // TOUR_*, TutorialOverlay
      [5601, 5684], // SB_*, Sidebar
      [5714, 5961], // WarRoom, AutoPilotSection, SynergiesAutoPanel
      [5962, 6017], // Widget*
      [6586, 6688], // ClientPortal, InvestorBoard, WarRoomReadOnly
    ],
    desc: 'Remaining components'
  }
};

// Extract line ranges from source
function extractLines(ranges) {
  let result = [];
  for (const [start, end] of ranges) {
    // Convert from 1-indexed to 0-indexed
    result.push(lines.slice(start - 1, end).join('\n'));
  }
  return result.join('\n\n');
}

// Scan code to find which shared imports are actually used
function findUsedSharedImports(code, allSharedExports) {
  return allSharedExports.filter(name => {
    // Check if the name is used in the code (not just in import statement)
    const regex = new RegExp(`\\b${name}\\b`);
    return regex.test(code);
  });
}

// Parse all shared exports from the import statement
const sharedImportStr = sharedImportLines.join(' ');
const sharedExports = [...sharedImportStr.matchAll(/\b([A-Za-z_]\w*)\b/g)]
  .map(m => m[1])
  .filter(n => !['import', 'from', 'shared', 'jsx'].includes(n));

// Also need to know which UI components each chunk uses from UI.jsx
const uiExports = ['Badge', 'IncubBadge', 'GradeBadge', 'KPI', 'PBar', 'Btn', 'Inp', 'Sel', 'Sect', 'Card', 'Modal', 'CTip', 'Toggle', 'ActionItem'];

// Generate each chunk file
for (const [name, chunk] of Object.entries(chunks)) {
  const code = extractLines(chunk.ranges);
  
  // For UI.jsx, no internal component imports needed
  let header = REACT_IMPORT + '\n' + RECHARTS_IMPORT + '\n';
  
  if (name === 'UI') {
    header += sharedImportRoot + '\n\n';
  } else {
    header += sharedImportChunk + '\n';
    // Find which UI components this chunk uses
    const usedUI = uiExports.filter(ui => {
      // Check usage but not in export declarations of the same name
      const regex = new RegExp(`<${ui}[\\s/>]|\\b${ui}\\(`);
      return regex.test(code);
    });
    if (usedUI.length > 0) {
      header += `import { ${usedUI.join(', ')} } from "./UI.jsx";\n`;
    }
    header += '\n';
  }
  
  // For chunks that reference other chunk components, add cross-imports
  // PorteurView uses components from Misc (ClientsPanelSafe, etc.)
  if (name === 'PorteurView') {
    header += `import { ClientsPanelSafe, PulseForm, SubsTeamPanel, SubsTeamBadge, GamificationPanel, MilestonesCompact, CollapsibleSection, GoalEditor, CelebrationOverlay, MeetingPrepView, genInsights, calcBenchmark, getPlaybooks, SocSettingsPanel, OnboardingWizard, TutorialOverlay, Sidebar, SocieteView, WarRoom } from "./Misc.jsx";\n`;
    header += `import { SocBankWidget, BankingTransactions, categorizeTransaction } from "./Banking.jsx";\n`;
    header += `import { RapportsPanel } from "./Reports.jsx";\n`;
    header += `import { AIWeeklyCoach } from "./AI.jsx";\n`;
    header += `import { calcSmartAlerts, SmartAlertsPanel, BenchmarkRadar } from "./AdminDashboard.jsx";\n`;
    header += `import { SubsTeamPanel as _STP } from "./Misc.jsx";\n`;
  }
  
  const content = header + code + '\n';
  fs.writeFileSync(chunk.file, content);
  console.log(`Written ${chunk.file} (${content.split('\n').length} lines)`);
}

// Now find ALL exports from the original file
const allExports = [];
const exportRegex = /^export\s+(function|const)\s+(\w+)/gm;
let match;
while ((match = exportRegex.exec(src)) !== null) {
  allExports.push(match[2]);
}
console.log(`\nTotal exports: ${allExports.length}`);
console.log(allExports.join(', '));

// Generate barrel components.jsx
let barrel = `// Barrel file - re-exports all components from split files\n`;
for (const [name, chunk] of Object.entries(chunks)) {
  const chunkPath = chunk.file.replace('src/', './');
  barrel += `export * from "${chunkPath}";\n`;
}

fs.writeFileSync('src/components_barrel.jsx', barrel);
console.log('\nBarrel file written to src/components_barrel.jsx');
