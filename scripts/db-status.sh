#!/bin/bash

# Simple script to show what's in local vs remote databases
echo "📊 Database Status"
echo "=================="
echo ""

echo "LOCAL Database:"
echo "---------------"
npx wrangler d1 execute starter-pack --local --command="SELECT COUNT(*) as count FROM todos"

echo ""
echo "REMOTE Database:"
echo "----------------"
npx wrangler d1 execute starter-pack --remote --command="SELECT COUNT(*) as count FROM todos"

echo ""