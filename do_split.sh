#!/bin/bash
# Split App.jsx into modules
# Uses sed to extract line ranges from the backup

SRC="src/App.jsx.backup"
mkdir -p src/{utils,components,views,hooks,context}

echo "=== Splitting App.jsx ==="

# 1. utils/constants.js — Theme, formatters, constants (lines 3-33, 95-153)
cat > src/utils/constants.js << 'HEADER'
// Theme, formatting utilities, and constants
// Extracted from App.jsx
import React from "react";
HEADER
sed -n '3,33p' "$SRC" >> src/utils/constants.js
# Add CSS (lines 34-94) 
sed -n '34,94p' "$SRC" >> src/utils/constants.js
# Add DS, DH, and other data constants (lines 95-153)
sed -n '95,153p' "$SRC" >> src/utils/constants.js
# Make everything that needs to be shared into exports
# We'll do this with a separate step

# 2. utils/helpers.js — Business logic helpers (lines 154-386)
cat > src/utils/helpers.js << 'HEADER'
// Business logic helper functions
// Extracted from App.jsx
import { C, pf, gr, curM, prevM, fmt, EXCLUDED_ACCOUNTS, SUB_CATS, FONT, normalizeStr } from './constants.js';
HEADER
sed -n '154,386p' "$SRC" >> src/utils/helpers.js

# 3. utils/api.js — API calls (lines 387-753)
cat > src/utils/api.js << 'HEADER'
// API layer: GHL, Revolut, Stripe, Slack, Supabase, Storage
// Extracted from App.jsx
import { C, GHL_BASE, STRIPE_PROXY, STORE_URL, EXCLUDED_ACCOUNTS, curM, prevM, pf } from './constants.js';
HEADER
sed -n '387,753p' "$SRC" >> src/utils/api.js

# 4. utils/calculations.js — Score/health/alert calculations (lines 754-932)
cat > src/utils/calculations.js << 'HEADER'
// Calculations: health scores, alerts, milestones, leaderboard
// Extracted from App.jsx
import { C, pf, gr, curM, prevM, nextM, fmt, pct, clamp, ml, ago, curW, qMonths, qCA, uid, sinceLbl, sinceMonths, MOODS } from './constants.js';
HEADER
sed -n '754,932p' "$SRC" >> src/utils/calculations.js

# 5. components/ui.jsx — Shared UI components (lines 28, 933-964)
cat > src/components/ui.jsx << 'HEADER'
// Shared UI components
// Extracted from App.jsx
import React from "react";
import { C, FONT, FONT_TITLE, pct, clamp, fmt, ml, curM, sinceLbl, ago, uid } from '../utils/constants.js';
HEADER
# ErrorBoundary (line 28)
sed -n '28,28p' "$SRC" >> src/components/ui.jsx
# UI components (lines 933-964)
sed -n '933,964p' "$SRC" >> src/components/ui.jsx

echo "Created base files. Line counts:"
wc -l src/utils/constants.js src/utils/helpers.js src/utils/api.js src/utils/calculations.js src/components/ui.jsx
