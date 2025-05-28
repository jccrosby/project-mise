# Project MISE by CrosbyHQ

[![License: GNU-GPLv3](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE.txt)

## Overview

Project MISE is a modern chat application that enables AI-powered conversations with context awareness. Built with a TypeScript-based full-stack architecture using React for the frontend and Express for the backend, it provides a flexible and interactive way to engage with AI models.

## Features

- 🌐 Real-time chat with WebSockets
- 🧠 Context-aware AI conversations
- 🔄 Streaming responses for a better user experience
- 📊 Context switching for different topics (coding, cooking, etc.)

## Tech Stack

### Frontend

- React 19
- React Router 7
- Tailwind CSS
- Vite
- TypeScript

### Backend

- Express
- WebSockets (ws)
- SQLite (better-sqlite3)
- TypeScript
- Node.js

### Development Tools

- Nx (Monorepo management)
- Jest (Unit testing)
- Playwright (E2E testing)
- ESLint & Prettier (Code quality)
- TypeScript

## Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/jccrosby/project-mise.git
cd project-mise

# Install dependencies
pnpm install
```

### Development

```bash
# Start the backend development server
nx serve mise-be

# Start the frontend development server
nx dev mise-fe
```

### Build

```bash
# Build the entire project
nx run-many -t build

# Build specific projects
nx build mise-be
nx build mise-fe
```

### Testing

```bash
# Run tests for all projects
nx run-many -t test

# Run E2E tests
nx e2e mise-fe-e2e
```

## Project Structure

```
.
├── backend/                  # Backend services
│   ├── mise-be/              # Main backend service
│   │   └── src/              # Source files
│   │       ├── services/     # Service implementations
│   │       └── types/        # TypeScript type definitions
│   └── mise-be-e2e/          # End-to-end tests for backend
├── frontend/                 # Frontend applications
│   ├── mise-fe/              # Main frontend application
│   │   ├── app/              # Application code
│   │   │   ├── components/   # Reusable React components
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   └── routes/       # Application routes
│   │   └── public/           # Static assets
│   └── mise-fe-e2e/          # End-to-end tests for frontend
├── nx.json                   # Nx configuration
└── package.json              # Project dependencies
```

## License

This project is licensed under the GNU GPLv3 License - see the [LICENSE file](./LICENSE.txt) for details.
