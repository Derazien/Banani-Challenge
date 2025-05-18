# Dynamic Action Handlers System

A flexible system for handling actions on table data with dynamic, context-aware handlers that can be configured from the backend.

## Key Features

- **Dynamic Handler Registry**: Central registry for managing action handlers
- **Backend Configuration**: Handlers can be created or configured from backend API
- **Context-Aware Logic**: Handlers intelligently interpret actions based on data context
- **Periodic Sync**: Configuration is periodically synchronized from backend

## Architecture

This system implements a pattern that consists of the following core components:

### 1. Action Registry (`ActionRegistry`)

- Singleton service that stores all action handlers
- Provides methods to register, retrieve, and manage handlers
- Organizes handlers with associated metadata

### 2. Action Handlers (`SaveHandler`, etc.)

- Implements the `ActionHandler` interface
- Executes actions on row data
- Context-aware logic to adapt behavior based on data

### 3. Sync Service (`ActionSyncService`)

- Fetches handler configurations from backend API
- Dynamically creates or updates handlers based on configuration
- Maintains periodic sync to keep handlers up-to-date

### 4. Backend API (`/api/action-handlers`)

- Provides configurations for handlers
- Can define custom endpoints for handling specific actions
- Allows dynamic updates without frontend code changes

## Flow Diagram

```
┌─────────────┐     ┌───────────────┐     ┌───────────────┐
│  Frontend   │     │ Sync Service  │     │ Backend API   │
│  Component  │     │               │     │               │
└──────┬──────┘     └───────┬───────┘     └───────┬───────┘
       │                    │                     │
       │ 1. Initialize      │                     │
       │─────────────────>  │                     │
       │                    │ 2. Fetch Configs    │
       │                    │────────────────────>│
       │                    │                     │
       │                    │ 3. Return Configs   │
       │                    │<────────────────────│
       │                    │                     │
       │                    │ 4. Create/Update    │
       │                    │    Handlers         │
       │ 5. Use Handlers    │                     │
       │<─────────────────  │                     │
       │                    │                     │
       │ 6. Execute         │                     │
       │    Actions         │                     │
       │─────────────────────────────────────────>│
       │                    │                     │
       │ 7. Return Results  │                     │
       │<─────────────────────────────────────────│
       │                    │                     │
```

## Example: SaveHandler

The SaveHandler demonstrates the context-aware approach:

- For expense data, "save" means approve the expense
- For document data, "save" means add to favorites
- For task data, "save" means mark as completed

This intelligence is achieved by:
1. Analyzing row data keys to infer context
2. Using context-specific messages
3. Dynamically updating properties based on context

## Usage

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

## Benefits

- **Decoupled Architecture**: Actions are separated from UI components
- **Dynamic Configuration**: Behavior can be changed without code updates
- **Context Awareness**: Actions intelligently adapt to different data types
- **Extensibility**: New handlers can be added easily from frontend or backend

## Implementation Details

See the following files for implementation details:

- `/client/src/actions/registry.ts`: Action registry implementation
- `/client/src/actions/types.ts`: Core type definitions
- `/client/src/actions/handlers/saveHandler.ts`: Context-aware save handler
- `/client/src/actions/sync/syncService.ts`: Backend sync service
- `/server/src/api/action-handlers.ts`: Backend API for configurations
- `/client/src/examples/DynamicHandlersExample.tsx`: Usage example 