# Contributing to Adrishya

Thank you for your interest in contributing to **Adrishya**! We welcome bug reports, feature suggestions, and pull requests to help make this the best private desktop AI overlay.

## Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Git**: Installed and configured

### Setup Steps
1. **Fork the Repository:** Fork and clone the codebase:
   ```bash
   git clone https://github.com/YourUsername/adrishya.git
   cd adrishya
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Run in Development:**
   ```bash
   npm run dev
   ```
   This will launch the Vite development server and the Electron application window.
4. **Lint and Typecheck:**
   ```bash
   npm run lint
   ```

## Development Guidelines
- **TypeScript:** Write all main and renderer code using TypeScript with proper type safety.
- **Tailwind CSS v4:** Keep styles unified by utilizing Tailwind CSS classes. Ensure the glassmorphism aesthetic (translucent card widgets, frosted blur, AMOLED themes) is preserved.
- **Frameless Windows:** The app is frameless. Make sure drag regions are defined using the `-webkit-app-region: drag` class on headers, and `-webkit-app-region: no-drag` is used on interactive components (buttons, text inputs, etc.).

## Submitting Pull Requests
1. Create a new branch: `git checkout -b feature/amazing-feature`.
2. Commit your changes: `git commit -m 'Add amazing feature'`.
3. Push to your fork: `git push origin feature/amazing-feature`.
4. Open a Pull Request on the main repository, explaining your changes and verification tests.
