import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React, { Suspense } from 'react';

// ---------------------------------------------------------------------------
// Mock localStorage via store.js
// ---------------------------------------------------------------------------
const mockStoreData = {};

vi.mock('../src/lib/store.js', () => ({
  load: vi.fn((key) => mockStoreData[key] ?? null),
  store: vi.fn((key, val) => { mockStoreData[key] = val; }),
  storeDebounced: vi.fn((key, val) => { mockStoreData[key] = val; }),
  remove: vi.fn((key) => { delete mockStoreData[key]; }),
}));

// ---------------------------------------------------------------------------
// Mock sync.js (BroadcastChannel)
// ---------------------------------------------------------------------------
vi.mock('../src/lib/sync.js', () => ({
  broadcast: vi.fn(),
  subscribe: vi.fn(() => () => {}),
}));

// ---------------------------------------------------------------------------
// Mock plan.js (subscription checks)
// ---------------------------------------------------------------------------
vi.mock('../src/lib/plan.js', () => ({
  isPaid: vi.fn(() => true),
  canAccessPro: vi.fn(() => true),
  getTrialInfo: vi.fn(() => ({ active: false, daysLeft: 0 })),
}));

// ---------------------------------------------------------------------------
// Mock recharts (lazy-loaded in pages)
// ---------------------------------------------------------------------------
vi.mock('recharts', () => {
  const FakeChart = ({ children, ...props }) => <div data-testid="mock-chart">{children}</div>;
  const FakeElement = () => <div />;
  return {
    AreaChart: FakeChart,
    BarChart: FakeChart,
    PieChart: FakeChart,
    LineChart: FakeChart,
    ComposedChart: FakeChart,
    Area: FakeElement,
    Bar: FakeElement,
    Line: FakeElement,
    Pie: FakeElement,
    Cell: FakeElement,
    XAxis: FakeElement,
    YAxis: FakeElement,
    Tooltip: FakeElement,
    Legend: FakeElement,
    CartesianGrid: FakeElement,
    ReferenceLine: FakeElement,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  };
});

// ---------------------------------------------------------------------------
// Import pages (mocks apply before these resolve)
// ---------------------------------------------------------------------------
import Dashboard from '../src/pages/Dashboard.jsx';
import CRM from '../src/pages/CRM.jsx';
import Data from '../src/pages/Data.jsx';
import Documents from '../src/pages/Documents.jsx';
import Tasks from '../src/pages/Tasks.jsx';
import HelpCenter from '../src/pages/HelpCenter.jsx';
import Reports from '../src/pages/Reports.jsx';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seedTestData() {
  mockStoreData.contacts = [
    { id: '1', name: 'Alice Dupont', email: 'alice@test.fr', status: 'client', createdAt: '2025-01-01', commentaires: [] },
    { id: '2', name: 'Bob Martin', email: 'bob@test.fr', status: 'prospect', createdAt: '2025-06-01', commentaires: [] },
    { id: '3', name: 'Charlie Duval', email: 'charlie@test.fr', status: 'lead', createdAt: '2025-08-01', commentaires: [] },
  ];
  mockStoreData.events = [
    { id: 'e1', title: 'Reunion equipe', date: '2026-03-05', type: 'reunion' },
  ];
  mockStoreData.finHistory = [
    { key: '2026-01', ca: 15000, charges: 8000, result: 7000, treso: 20000 },
    { key: '2026-02', ca: 18000, charges: 9000, result: 9000, treso: 29000 },
  ];
  mockStoreData.integrations = { Stripe: true, Revolut: true };
  mockStoreData.caGoal = 25000;
  mockStoreData.companyInfo = { name: 'TestCorp', sector: 'tech' };
  mockStoreData.invoices = [];
  mockStoreData.automations = {};
}

function clearTestData() {
  Object.keys(mockStoreData).forEach((k) => delete mockStoreData[k]);
}

function renderPage(Component, props = {}) {
  return render(
    <Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </Suspense>
  );
}

// =========================================================================
//  Dashboard Page Tests
// =========================================================================
describe('Dashboard page', () => {
  beforeEach(() => { clearTestData(); });

  it('renders without crashing when no data', () => {
    const { container } = renderPage(Dashboard, { onNavigate: vi.fn() });
    expect(container).toBeTruthy();
  });

  it('renders KPIs with financial data', () => {
    seedTestData();
    const { container } = renderPage(Dashboard, { onNavigate: vi.fn() });
    // fmt(18000) produces "18 000" with locale-dependent space — check container text
    expect(container.textContent).toMatch(/18.000/);
  });

  it('shows pipeline stages', () => {
    seedTestData();
    renderPage(Dashboard, { onNavigate: vi.fn() });
    expect(screen.getAllByText('Prospect').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Client').length).toBeGreaterThan(0);
  });

  it('renders without error when onNavigate is provided', () => {
    seedTestData();
    const onNavigate = vi.fn();
    const { container } = renderPage(Dashboard, { onNavigate });
    expect(container.querySelector('div')).toBeTruthy();
    expect(onNavigate).not.toHaveBeenCalled();
  });
});

// =========================================================================
//  CRM Page Tests
// =========================================================================
describe('CRM page', () => {
  beforeEach(() => { clearTestData(); });

  it('renders without crashing when no contacts', () => {
    const { container } = renderPage(CRM);
    expect(container).toBeTruthy();
  });

  it('displays contact names', () => {
    seedTestData();
    renderPage(CRM);
    expect(screen.getByText('Alice Dupont')).toBeTruthy();
    expect(screen.getByText('Bob Martin')).toBeTruthy();
    expect(screen.getByText('Charlie Duval')).toBeTruthy();
  });

  it('renders filter tabs', () => {
    seedTestData();
    renderPage(CRM);
    // Tabs show "Tous (N)" with count
    expect(screen.getByText(/Tous/)).toBeTruthy();
  });

  it('shows contact count in tabs', () => {
    seedTestData();
    const { container } = renderPage(CRM);
    // "Tous (3)" shows the total count
    expect(container.textContent).toMatch(/Tous.*3/);
  });
});

// =========================================================================
//  Data Page Tests
// =========================================================================
describe('Data page', () => {
  beforeEach(() => { clearTestData(); });

  it('renders without crashing when no financial data', () => {
    const { container } = renderPage(Data);
    expect(container).toBeTruthy();
  });

  it('renders financial KPIs with data', () => {
    seedTestData();
    renderPage(Data);
    expect(screen.getByText(/18[\s\u202f]000/)).toBeTruthy();
  });

  it('has interactive buttons', () => {
    seedTestData();
    renderPage(Data);
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders page content structure', () => {
    seedTestData();
    const { container } = renderPage(Data);
    expect(container.querySelector('div')).toBeTruthy();
  });
});

// =========================================================================
//  Documents Page Tests
// =========================================================================
describe('Documents page', () => {
  beforeEach(() => { clearTestData(); });

  it('renders without crashing when no documents', () => {
    const { container } = renderPage(Documents);
    expect(container).toBeTruthy();
  });

  it('shows empty state when no documents', () => {
    renderPage(Documents);
    expect(screen.getByText(/Aucun document/)).toBeTruthy();
  });

  it('displays document stats', () => {
    mockStoreData.documents = [
      { id: 'd1', type: 'invoice', status: 'paid', number: 'F-202603-001', clientName: 'Alice', items: [{ id: 'i1', description: 'Service', qty: 1, unitPrice: 1000, tva: 20 }], createdAt: '2026-03-01' },
      { id: 'd2', type: 'quote', status: 'sent', number: 'D-202603-001', clientName: 'Bob', items: [{ id: 'i2', description: 'Conseil', qty: 2, unitPrice: 500, tva: 20 }], createdAt: '2026-03-02', dueDate: '2026-04-01' },
    ];
    const { container } = renderPage(Documents);
    expect(container.textContent).toMatch(/Documents/);
    expect(container.textContent).toMatch(/Payés/);
  });

  it('renders filter tabs', () => {
    renderPage(Documents);
    expect(screen.getByText('Tous')).toBeTruthy();
    expect(screen.getByText('Factures')).toBeTruthy();
    expect(screen.getByText('Devis')).toBeTruthy();
  });
});

// =========================================================================
//  Tasks Page Tests
// =========================================================================
describe('Tasks page', () => {
  beforeEach(() => { clearTestData(); });

  it('renders without crashing when no tasks', () => {
    const { container } = renderPage(Tasks);
    expect(container).toBeTruthy();
  });

  it('shows kanban columns', () => {
    renderPage(Tasks);
    expect(screen.getByText('Backlog')).toBeTruthy();
    expect(screen.getByText('À faire')).toBeTruthy();
    expect(screen.getAllByText('En cours').length).toBeGreaterThan(0);
    expect(screen.getByText('En revue')).toBeTruthy();
    expect(screen.getByText('Terminé')).toBeTruthy();
  });

  it('displays task stats', () => {
    mockStoreData.tasks = [
      { id: 't1', title: 'Tâche 1', status: 'todo', priority: 'high', subtasks: [], createdAt: '2026-03-01' },
      { id: 't2', title: 'Tâche 2', status: 'done', priority: 'medium', subtasks: [], createdAt: '2026-03-01', completedAt: '2026-03-02' },
    ];
    const { container } = renderPage(Tasks);
    expect(container.textContent).toMatch(/Total/);
    expect(container.textContent).toMatch(/Terminées/);
  });

  it('renders view tabs', () => {
    renderPage(Tasks);
    expect(screen.getByText('Kanban')).toBeTruthy();
    expect(screen.getByText('Liste')).toBeTruthy();
    expect(screen.getByText('Calendrier')).toBeTruthy();
  });
});

// =========================================================================
//  HelpCenter Page Tests
// =========================================================================
describe('HelpCenter page', () => {
  beforeEach(() => { clearTestData(); });

  it('renders without crashing', () => {
    const { container } = renderPage(HelpCenter);
    expect(container).toBeTruthy();
  });

  it('shows help center title', () => {
    renderPage(HelpCenter);
    expect(screen.getByText("Centre d'aide")).toBeTruthy();
  });

  it('renders navigation tabs', () => {
    renderPage(HelpCenter);
    expect(screen.getByText('FAQ')).toBeTruthy();
    expect(screen.getByText('Tickets')).toBeTruthy();
    expect(screen.getByText('Base de connaissances')).toBeTruthy();
  });

  it('shows FAQ questions', () => {
    renderPage(HelpCenter);
    expect(screen.getByText(/Comment connecter mon compte Stripe/)).toBeTruthy();
  });
});

// =========================================================================
//  Reports Page Tests
// =========================================================================
describe('Reports page', () => {
  beforeEach(() => { clearTestData(); });

  it('renders without crashing when no data', () => {
    const { container } = renderPage(Reports);
    expect(container).toBeTruthy();
  });

  it('shows report type buttons', () => {
    renderPage(Reports);
    expect(screen.getByText(/Rapport financier/)).toBeTruthy();
    expect(screen.getByText(/Rapport CRM/)).toBeTruthy();
    expect(screen.getByText(/Performance globale/)).toBeTruthy();
  });

  it('renders financial KPIs with data', () => {
    seedTestData();
    const { container } = renderPage(Reports);
    expect(container.textContent).toMatch(/CA total/);
    expect(container.textContent).toMatch(/Marge nette/);
  });

  it('shows export button', () => {
    renderPage(Reports);
    expect(screen.getByText(/Exporter PDF/)).toBeTruthy();
  });
});
