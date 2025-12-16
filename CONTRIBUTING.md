# Contributing to Koinonia

Thank you for your interest in contributing to Koinonia! This guide will help you get started.

## Code of Conduct

Be respectful, no politics, EVERYONE is welcome. We're all here to build something useful together.

## Development Setup

### Prerequisites

- Node.js >= 18.x (managed via nvm)
- npm

```bash
# Verify Node.js is managed via nvm
nvm --version
node --version
```

### Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/koinonia.git
cd koinonia

# Install dependencies
npm install

# Start development server
npm start
```

### Running with Signaling Server (Required for P2P)

For P2P sync to work locally, you need a signaling server:

```bash
# Terminal 1: Start signaling server
npm run signaling

# Terminal 2: Start the app
npm start
```

Test with multiple browser tabs at http://localhost:5173

See [docs/SIGNALING.md](docs/SIGNALING.md) for production deployment options.

### Mobile Development

```bash
# Build the web app
npm run build

# Sync with native platforms
npx cap sync

# Run on iOS
npx cap run ios

# Run on Android
npx cap run android

# Open native IDEs
npx cap open ios
npx cap open android
```

## Code Style Guidelines

### SOLID Principles

This codebase follows SOLID principles:

- **S - Single Responsibility**: Each class/service has one reason to change
- **O - Open/Closed**: Extend behavior without modifying existing code
- **L - Liskov Substitution**: Implementations can replace interfaces
- **I - Interface Segregation**: Small, focused interfaces
- **D - Dependency Inversion**: Depend on abstractions, not implementations

### Architecture

```
src/
├── interfaces/     # Service contracts (ISyncService, IStorageService, etc.)
├── services/       # Implementations (WebRTCSyncService, YjsStorageService)
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── pages/          # Ionic page components
└── components/     # Reusable UI components
```

### TypeScript

- Use strict TypeScript (avoid `any` without justification)
- Define interfaces for all service contracts
- Use proper type annotations

### Memory Management

- All observers/listeners must have cleanup functions
- Unsubscribe in React useEffect return functions
- Prevent memory leaks in long-running services

## Running Tests

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Pull Request Process

1. **Fork the repository** and create a feature branch
2. **Write code** following the style guidelines above
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Create a PR** with a clear description of changes

### Branch Naming

```
feature/description    # New features
fix/description        # Bug fixes
docs/description       # Documentation
refactor/description   # Code refactoring
```

### Commit Messages

Follow conventional commits:

```
feat: add visual indicator for parallel shoppers
fix: resolve sync issue when offline
docs: update installation instructions
chore: update dependencies
refactor: extract validation logic
test: add unit tests for storage service
```

## Reporting Bugs

Open an issue with:

1. **Description** of the bug
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Environment** (OS, browser, device)

## Feature Requests

Open an issue describing:

1. **The problem** you want to solve
2. **Proposed solution**
3. **Alternative solutions** considered
4. **Additional context**

## Additional Documentation

The `docs/` folder contains additional technical documentation:

- [docs/SIGNALING.md](docs/SIGNALING.md) - Signaling server local development
- [docs/KOINONIA_SERVER.md](docs/KOINONIA_SERVER.md) - Production server deployment (Docker + SSL)
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) - Original implementation plan (historical reference)

## Questions?

Open a discussion or issue if you need help getting started.

---

Thank you for contributing!
