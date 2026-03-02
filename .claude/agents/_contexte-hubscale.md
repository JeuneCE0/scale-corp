# Contexte Projet HubScale

> Ce fichier est reference par chaque persona de l'equipe.
> Il contient le contexte technique partage necessaire pour travailler sur HubScale.

---

## Vue d'ensemble

**HubScale** est une plateforme SaaS B2B de pilotage d'entreprise destinee aux entrepreneurs et dirigeants de PME. Elle permet de centraliser le suivi financier, la gestion CRM, l'agenda, les analytics et les integrations tierces dans un seul dashboard.

**Tagline** : "Pilotez votre groupe de societes"

---

## Stack technique

| Couche | Technologies | Versions |
|--------|-------------|----------|
| Frontend | React + Vite | React 18.3.1, Vite 5.4.21 |
| Backend | Vercel Serverless Functions | Node.js ESM |
| Base de donnees | Supabase (PostgreSQL) | @supabase/supabase-js 2.97.0 |
| Paiements | Stripe | @stripe/stripe-js 8.8.0 |
| Graphiques | Recharts | 2.15.4 |
| Tests unitaires | Vitest + Testing Library | Vitest 4.0.18, @testing-library/react 16.3.2 |
| Tests E2E | Playwright | Configure dans playwright.config.js |
| Emails | Resend API | Via api/email.js |

---

## Structure du projet

```
hubscale/
  src/
    main.jsx                    # Point d'entree (PWA, monitoring, ErrorBoundary)
    App.jsx                     # Routeur principal, notifications, navigation (~1573 lignes)
    components/
      ui.jsx                    # Composants UI : Spinner, ErrorBoundary, Btn, Badge,
                                # NotificationDot, KPI, HelpTip, Sparkline, useToast, etc.
    pages/
      Dashboard.jsx             # Dashboard principal avec KPIs et overview (~1573L)
      CRM.jsx                   # Gestion contacts, pipeline, lead scoring (~1357L)
      Data.jsx                  # Donnees financieres, factures, depenses (~1851L)
      Agenda.jsx                # Calendrier mois/semaine, evenements (~771L)
      Analytics.jsx             # Rapports avances, previsions, simulateur pub (~786L)
      Settings.jsx              # Profil, societe, integrations, automations (~1578L)
      Landing.jsx               # Page d'accueil publique
      Login.jsx                 # Authentification (~287L)
      Checkout.jsx              # Paiement Stripe (~632L)
      Onboarding.jsx            # Assistant de demarrage (~297L)
      Admin.jsx                 # Panel super-admin (~642L)
      Legal.jsx                 # Mentions legales, CGV, confidentialite
      ResetPassword.jsx         # Reinitialisation mot de passe
    hooks/
      useConfirmDialog.js       # Dialog de confirmation avec callback
      useUndoStack.js           # Undo/redo pour operations critiques
    lib/
      api.js                    # Client API (appels aux serverless functions)
      adminApi.js               # Client API admin (super_admin)
      auth.js                   # Auth dual mode (Supabase ou localStorage)
      db.js                     # Couche abstraction base de donnees
      store.js                  # localStorage versione avec debounce (prefix hs_)
      supabase.js               # Singleton Supabase client
      utils.js                  # 250+ fonctions utilitaires (fmt, fK, pct, uid, etc.)
      constants.js              # Constantes metier (CRM_STATUSES, PLANS, INTEGRATIONS, etc.)
      theme.js                  # Tokens design DARK/LIGHT, font Inter
      css.js                    # CSS global injecte
      i18n.js                   # Internationalisation FR/EN avec t('key')
      sync.js                   # Synchronisation cross-tab via BroadcastChannel
      realtime.js               # Supabase Realtime subscriptions
      monitoring.js             # Sentry, web vitals, error tracking
      plan.js                   # Logique abonnements (isPaid, canAccessPro, getTrialInfo)
      sanitize.js               # Prevention XSS
      integrationData.js        # Donnees de seeding pour les integrations
  api/
    _middleware.js              # Rate limiting Edge (60 req/min, 10 auth)
    admin.js                    # Stats plateforme, gestion orgs
    billing.js                  # Stripe Checkout, webhooks, portal
    email.js                    # Emails transactionnels via Resend
    gdpr.js                     # Export donnees, suppression compte
    integrations/
      oauth.js                  # Flux OAuth pour services tiers
  tests/
    setup.js                    # Config Vitest (jest-dom)
    utils.test.js               # Tests des fonctions utilitaires
    store.test.js               # Tests localStorage
    hooks.test.js               # Tests hooks React
    components.test.jsx         # Tests composants UI
    integrationData.test.js     # Tests donnees integrations
    sync.test.js                # Tests sync cross-tab
    e2e/
      app.spec.js               # Tests E2E Playwright
```

---

## Fonctionnalites principales

1. **Dashboard** : KPIs temps reel, score sante business (0-100), meteo business, streak, previsions
2. **CRM** : Contacts avec statuts (prospect/lead/client/perdu/partenaire), lead scoring, pipeline, relances
3. **Data** : Historique financier mensuel (CA, charges, resultat, tresorerie), factures, categories de depenses
4. **Agenda** : Vue mois/semaine, types d'evenements (reunion, deadline, appel, event)
5. **Analytics** : Rapports avances, previsions IA (regression lineaire), simulateur publicitaire
6. **Settings** : Profil, societe, integrations (60+), automations (8 regles)
7. **Billing** : 3 plans (Essentiel 49EUR, Business 149EUR, Scale 349EUR) via Stripe

---

## Design system

### Theme
- **Dark-first** : theme sombre par defaut, toggle clair disponible
- **Tokens** : Objet mutable `T` importe de `theme.js`
  - `T.bg`, `T.surface`, `T.surface2` : fonds
  - `T.text`, `T.textSecondary`, `T.textMuted` : textes
  - `T.accent` (#6366f1 Indigo) : action principale
  - `T.green`, `T.red`, `T.orange`, `T.blue`, `T.purple` : semantiques
  - `T.greenBg`, `T.redBg`, etc. : fonds semi-transparents
- **Font** : Inter via `FONT` constant

### Regles de style
- **Inline styles uniquement** (pas de CSS modules, pas de Tailwind)
- Couleurs toujours via `T.*`, jamais de hex en dur
- Classes CSS pour animations : `fade-up`, `glass-static`
- Recharts toujours dans `<ResponsiveContainer>`

---

## Conventions de code

### General
- ES Modules partout (`"type": "module"`)
- Pas de TypeScript, tout en `.jsx` / `.js`
- Style compact : fonctions courtes, nommage abrege (`fmt`, `fK`, `pct`, `uid`)
- Labels UI en francais, identifiants code en anglais
- Commits : `feat:` / `fix:` / `chore:` / `perf:` suivi d'une description

### Frontend
- Lazy loading : `React.lazy(() => import('./pages/X.jsx'))` + `<Suspense>`
- Composants fonctionnels (pas de classes sauf ErrorBoundary)
- State local : `useState` / `useEffect` / `useMemo` / `useCallback` (pas de Redux)
- Persistence : `load()` / `store()` depuis `store.js` (prefix `hs_`)

### Backend (API Vercel)
- Un fichier = un endpoint
- Middleware Edge pour rate limiting (`_middleware.js`)
- Pattern de reponse : JSON avec `{ error }` ou `{ data }`
- Auth via Bearer token (Supabase JWT)
- Variables d'env : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, etc.

### Tests
- Vitest : `npm run test` (vitest run)
- Tests unitaires dans `tests/*.test.js`
- E2E dans `tests/e2e/*.spec.js`
- Setup : `tests/setup.js` charge `@testing-library/jest-dom`

---

## Scripts npm

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run"
}
```

---

## Interactions entre personas

| Tache | Primaire | Secondaire | Reviewer |
|-------|----------|-----------|----------|
| Nouvel endpoint API | Backend | Senior | Lead |
| Nouveau composant React | Frontend | Senior | Lead |
| Integration OAuth | Backend | Frontend | Senior |
| Bug complexe | Maintenance | [owner du domaine] | Lead |
| Optimisation performance | Senior | Frontend ou Backend | Lead |
| Migration schema | Backend | Lead | Maintenance |
| Patch securite | Maintenance | Backend | Lead |
| Coverage tests | Maintenance | [owner du domaine] | Senior |
