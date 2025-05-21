# Banani Challenge - Dynamic Table Generation Client

A Next.js application for generating and manipulating tables from natural language prompts.

## Table of Contents
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Components Architecture](#components-architecture)
- [Dynamic Action Handlers System](#dynamic-action-handlers-system)
- [Deployment](#deployment)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

The project follows a clean, modular structure:

```
client/
├── public/         # Static files
├── src/
│   ├── app/        # Next.js app router pages
│   ├── components/ # UI components
│   ├── hooks/      # Custom React hooks
│   ├── lib/        # Utilities and libraries
│   │   ├── actions/  # Action handlers
│   │   └── storage/  # Storage utilities
│   ├── types/      # TypeScript type definitions
│   └── constants/  # Global constants
```

## Components Architecture

This project follows a modular component architecture designed for maintainability, reusability, and consistency.

### Directory Structure

- **ui/**: Base UI components (primitive building blocks)
  - Simple, reusable UI elements
  - Based on shadcn-style patterns
  - Uses Tailwind directly for styling

- **forms/**: Form-related components
  - Each component is in its own directory with styles
  - Uses CSS modules for styling

- **views/**: Display and view components
  - Components focused on data display
  - Uses CSS modules for styling

- **modals/**: Dialog and modal components
  - Overlay components that appear above the main content
  - Uses CSS modules for styling

- **core/**: Complex reusable components
  - Key application-specific components (Table, PromptBox, etc.)
  - Uses CSS modules for styling

- **layout/**: Layout components
  - Components for organizing page structure
  - Uses CSS modules for styling

- **icons/**: Icon components
  - SVG icons used throughout the application

### Styling Approach

1. **Base UI Components** (ui/): Use Tailwind CSS directly for styling
2. **Complex Components**: Use CSS modules for better encapsulation and organization

### Importing Components

Import components from the top-level exports:

```tsx
// Importing from component categories
import { Button, Input } from '@/components/ui';
import { ItemEditForm } from '@/components/forms';
import { ItemDetailView } from '@/components/views';
import { ConfirmDialog } from '@/components/modals';

// Or directly from the main components index
import { Button, ItemEditForm, ItemDetailView, ConfirmDialog } from '@/components';
```

## Dynamic Action Handlers System

A flexible system for handling actions on table data with dynamic, context-aware handlers that can be configured from the backend.

### Key Features

- **Dynamic Handler Registry**: Central registry for managing action handlers
- **Backend Configuration**: Handlers can be created or configured from backend API
- **Context-Aware Logic**: Handlers intelligently interpret actions based on data context
- **Periodic Sync**: Configuration is periodically synchronized from backend

### Architecture

This system implements a pattern that consists of the following core components:

#### 1. Action Registry (`ActionRegistry`)

- Singleton service that stores all action handlers
- Provides methods to register, retrieve, and manage handlers
- Organizes handlers with associated metadata

#### 2. Action Handlers (`SaveHandler`, etc.)

- Implements the `ActionHandler` interface
- Executes actions on row data
- Context-aware logic to adapt behavior based on data

#### 3. Sync Service (`ActionSyncService`)

- Fetches handler configurations from backend API
- Dynamically creates or updates handlers based on configuration
- Maintains periodic sync to keep handlers up-to-date

#### 4. Backend API (`/api/action-handlers`)

- Provides configurations for handlers
- Can define custom endpoints for handling specific actions
- Allows dynamic updates without frontend code changes

### Example: SaveHandler

The SaveHandler demonstrates the context-aware approach:

- For expense data, "save" means approve the expense
- For document data, "save" means add to favorites
- For task data, "save" means mark as completed

This intelligence is achieved by:
1. Analyzing row data keys to infer context
2. Using context-specific messages
3. Dynamically updating properties based on context

### Usage

```tsx
// 1. Initialize the registry
const registry = ActionRegistry.getInstance();

// 2. Register default handlers
registry.registerHandler('save', new SaveHandler());

// 3. Start the sync service
const syncService = ActionSyncService.getInstance();
syncService.startSync();

// 4. Use handlers in components
const handler = registry.getHandler('save');
const result = await handler.execute(rowData);
```

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial
- [Vercel Platform](https://vercel.com/new) - the easiest way to deploy Next.js apps
- [Next.js GitHub repository](https://github.com/vercel/next.js) - provide feedback and contribute
