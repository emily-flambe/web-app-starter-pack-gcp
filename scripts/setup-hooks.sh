#!/bin/bash

# Setup git hooks for the project
# Run this script after cloning: ./scripts/setup-hooks.sh

echo "Setting up git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "Running pre-commit checks..."

# Run type checking
echo "Type checking..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ Type checking failed. Please fix TypeScript errors."
  exit 1
fi

# Run linting
echo "Linting..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting failed. Please fix ESLint errors."
  exit 1
fi

# Run tests
echo "Running tests..."
npm run test -- --passWithNoTests
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Please fix failing tests."
  exit 1
fi

echo "✅ Pre-commit checks passed!"
EOF

chmod +x .git/hooks/pre-commit

echo "✅ Git hooks setup complete!"
echo "To skip hooks temporarily, use: git commit --no-verify"