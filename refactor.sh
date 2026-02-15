#!/bin/bash
# Refactoring script - creates utility and component files from App.jsx
# Phase 1: Just add exports to utility files and add imports to App.jsx
# The safest approach: keep App.jsx mostly intact but extract pure functions

echo "Refactoring App.jsx..."
echo "Phase 1: Extracting utils..."

cd /home/rudy/scale-corp

# Verify build works before we start
npm run build 2>&1 | tail -3
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed before refactoring. Aborting."
    exit 1
fi

echo "Initial build OK. Starting refactoring..."
echo "Done with script setup."
