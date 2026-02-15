import fs from 'fs';

const src = fs.readFileSync('src/components.jsx', 'utf8');
const lines = src.split('\n');

// Find export boundaries using the grep data (1-indexed line numbers)
const exports = [
  [14, 'Badge'], [15, 'IncubBadge'], [16, 'GradeBadge'], [17, 'KPI'],
  [24, 'PBar'], [25, 'Btn'], [29, 'Inp'], [38, 'Sel'], [39, 'Sect'],
  [40, 'Card'], [41, 'Modal'], [42, 'CTip'], [43, 'Toggle'], [44, 'ActionItem'],
  [46, 'AICoPilot'], [83, 'PulseForm'], [107, 'PulseOverview'],
  [117, 'MeetingMode'], [184, 'DealFlow'], [218, 'categorizeTransaction'],
  [234, 'BankingPanel'], [278, 'BankingTransactions'], [342, 'TabCRM'],
  [421, 'MilestonesWall'], [487, 'MilestonesCompact'], [496, 'MilestoneCount'],
  [502, 'SocBankWidget'], [592, 'RapportsPanel'], [747, 'SynergiesPanel'],
  [815, 'KnowledgeBase'], [876, 'RiskMatrix'], [930, 'GamificationPanel'],
  [1001, 'InboxUnifiee'], [1028, 'ParcoursClientVisuel'], [1061, 'BenchmarkRadar'],
  [1101, 'calcSmartAlerts'], [1131, 'SmartAlertsPanel'], [1154, 'CohortAnalysis'],
  [1215, 'CHALLENGE_TEMPLATES'], [1224, 'SubsTeamPanel'], [1456, 'SubsTeamBadge'],
  [1466, 'ChallengesPanel'], [1538, 'AIWeeklyCoach'], [1579, 'ClientsPanelSafe'],
  [1580, 'ClientsPanelInner'], [2430, 'genInsights'], [2455, 'calcBenchmark'],
  [2472, 'getPlaybooks'], [2491, 'GoalEditor'], [2528, 'CelebrationOverlay'],
  [2550, 'MeetingPrepView'], [2611, 'CollapsibleSection'], [2625, 'SocSettingsPanel'],
  [2777, 'genPorteurNotifications'], [2805, 'NotificationCenter'],
  [2841, 'PorteurAIChat'], [3096, 'LeaderboardCard'], [3133, 'PulseDashWidget'],
  [3177, 'PorteurDashboard'], [4090, 'InboxPanel'], [4129, 'AgendaPanel'],
  [4164, 'ConversationsPanel'], [4211, 'TodoPanel'], [4255, 'PipelineKanbanPanel'],
  [4283, 'RessourcesPanel'], [4322, 'ActivitePanel'], [4412, 'ClientsUnifiedPanel'],
  [4498, 'calcClientHealthScore'], [4517, 'HealthBadge'], [4528, 'SalesPanel'],
  [4811, 'PublicitePanel'], [5071, 'SocieteView'], [5154, 'ValRow'],
  [5189, 'TabSimulateur'], [5218, 'ObInp'], [5230, 'ObTextArea'],
  [5241, 'ObSelect'], [5253, 'ObCheck'], [5262, 'ObTag'],
  [5267, 'OnboardingWizard'], [5467, 'TOUR_ADMIN'], [5484, 'TOUR_PORTEUR'],
  [5495, 'TutorialOverlay'], [5601, 'SB_ADMIN'], [5614, 'SB_PORTEUR'],
  [5625, 'Sidebar'], [5685, 'AdminClientsTab'], [5714, 'WarRoom'],
  [5815, 'AutoPilotSection'], [5905, 'SynergiesAutoPanel'],
  [5962, 'WidgetEmbed'], [5988, 'WidgetCard'], [6008, 'WidgetRenderer'],
  [6018, 'PulseScreen'], [6423, 'LiveFeed'], [6461, 'ReplayMensuel'],
  [6526, 'PredictionsCard'], [6586, 'ClientPortal'], [6633, 'InvestorBoard'],
  [6682, 'WarRoomReadOnly'],
];

// Calculate end lines
for (let i = 0; i < exports.length; i++) {
  const nextStart = i < exports.length - 1 ? exports[i + 1][0] : lines.length + 1;
  exports[i].push(nextStart - 1); // end line
}

// Extract code for a set of export names
function extract(names) {
  const parts = [];
  for (const name of names) {
    const exp = exports.find(e => e[1] === name);
    if (!exp) { console.error(`NOT FOUND: ${name}`); continue; }
    const [start, , end] = exp;
    // Also grab any comments/blank lines before (up to 2 lines)
    let actualStart = start;
    for (let i = start - 2; i < start - 1; i++) {
      if (i >= 0 && lines[i] && (lines[i].startsWith('/*') || lines[i].startsWith('//'))) {
        actualStart = i + 1;
      }
    }
    parts.push(lines.slice(actualStart - 1, end).join('\n'));
  }
  return parts.join('\n');
}

// Chunk definitions
const CHUNKS = {
  PulseScreen: ['PulseScreen', 'LiveFeed', 'PredictionsCard'],
  Banking: ['categorizeTransaction', 'BankingPanel', 'BankingTransactions', 'SocBankWidget'],
  CRM: ['TabCRM'],
  AI: ['AICoPilot', 'AIWeeklyCoach'],
  Reports: ['RapportsPanel', 'ReplayMensuel'],
};

// All names that go into separate chunks
const splitNames = new Set(Object.values(CHUNKS).flat());

// Everything else stays in components.jsx
const remainingNames = exports.map(e => e[1]).filter(n => !splitNames.has(n));

// Shared imports block (lines 1-13)
const headerLines = lines.slice(0, 13);
const reactImport = headerLines[0];
const rechartsImport = headerLines[1];
const sharedBlock = headerLines.slice(2).join('\n');
const sharedBlockSub = sharedBlock.replace('"./shared.jsx"', '"../shared.jsx"');

// For each chunk, find which other components from remaining it uses as JSX
function findJSXDeps(code, available) {
  const used = new Set();
  for (const name of available) {
    // Check for <Name or <Name> or <Name/ usage
    const re = new RegExp(`<${name}[\\s/>]`);
    if (re.test(code)) used.add(name);
    // Also check function calls like name(
    const re2 = new RegExp(`\\b${name}\\(`);
    if (re2.test(code) && name[0] === name[0].toLowerCase()) used.add(name); // only for funcs like calcSmartAlerts
  }
  return [...used];
}

// Write chunk files
for (const [chunkName, names] of Object.entries(CHUNKS)) {
  const code = extract(names);
  const jsxDeps = findJSXDeps(code, remainingNames);
  
  let file = reactImport + '\n' + rechartsImport + '\n' + sharedBlockSub + '\n';
  if (jsxDeps.length > 0) {
    file += `import { ${jsxDeps.join(', ')} } from "../components.jsx";\n`;
  }
  file += '\n' + code + '\n';
  
  const path = `src/components/${chunkName}.jsx`;
  fs.writeFileSync(path, file);
  console.log(`${path}: ${names.join(', ')} (${code.split('\n').length} lines, deps: ${jsxDeps.join(', ') || 'none'})`);
}

// Write trimmed components.jsx (remaining components + re-exports from chunks)
let newComponents = headerLines.join('\n') + '\n\n';

// Re-export chunks
for (const chunkName of Object.keys(CHUNKS)) {
  newComponents += `export * from "./components/${chunkName}.jsx";\n`;
}
newComponents += '\n';

// Remaining components code
newComponents += extract(remainingNames) + '\n';

fs.writeFileSync('src/components.jsx.new', newComponents);
console.log(`\nsrc/components.jsx.new: ${remainingNames.length} exports (${newComponents.split('\n').length} lines)`);
console.log('Remaining:', remainingNames.join(', '));
