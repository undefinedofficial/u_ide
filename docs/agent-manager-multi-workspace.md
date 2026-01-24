# Multi-Workspace Agent Manager Design

## Current State

The Agent Manager (`AgentManager.tsx`) currently operates as a single auxiliary window tied to one workspace. It has:
- Dashboard view with stats
- Chats view (shows threads from current workspace only)
- Workspaces view (shows current workspace folders)
- Code preview pane

**Limitation:** Each A-Coder window opens its own isolated Agent Manager instance. Users must switch between windows to see progress on different projects.

## Vision

A centralized Agent Manager that aggregates all active A-Coder workspaces, allowing users to:
- Monitor all running agents across multiple projects from one window
- Switch between workspaces and their chat threads
- See real-time status of operations across all projects
- Manage and control agents in any workspace

## Architecture

### 1. Workspace Registry Service

Create a new service that acts as a central registry for all A-Coder workspaces.

```typescript
// workspaceRegistry.service.ts
export interface WorkspaceConnection {
  id: string;                    // Unique identifier (UUID)
  name: string;                  // Display name (folder name)
  path: string;                  // Full path to workspace
  status: 'connected' | 'disconnected' | 'inactive';
  lastSeen: number;              // Timestamp
  threads: WorkspaceThreadSummary[];
  activeOperations: number;
}

export interface WorkspaceThreadSummary {
  id: string;
  title: string;
  status: 'idle' | 'streaming' | 'error';
  lastMessage: string;
  timestamp: number;
}

export interface IWorkspaceRegistryService {
  _serviceBrand: undefined;

  // Register this workspace with the central registry
  registerWorkspace(workspaceInfo: WorkspaceConnection): Promise<void>;

  // Unregister when closing
  unregisterWorkspace(workspaceId: string): Promise<void>;

  // Heartbeat to keep connection alive
  heartbeat(workspaceId: string): Promise<void>;

  // Get all registered workspaces
  getAllWorkspaces(): WorkspaceConnection[];

  // Subscribe to workspace updates
  onWorkspaceUpdated: Event<WorkspaceConnection>;
  onWorkspaceConnected: Event<WorkspaceConnection>;
  onWorkspaceDisconnected: Event<string>;

  // Sync thread state to registry
  updateWorkspaceThreads(workspaceId: string, threads: WorkspaceThreadSummary[]): void;
}
```

### 2. Communication Layer

Use a local WebSocket server or named pipes for inter-process communication:

```typescript
// workspaceComm.service.ts
export interface IWorkspaceCommService {
  // Start the central hub (runs once on first Agent Manager open)
  startHub(): Promise<void>;

  // Connect a workspace to the hub
  connectToHub(): Promise<void>;

  // Send messages to hub
  sendToHub(message: WorkspaceMessage): void;

  // Receive messages from hub
  onMessage: Event<WorkspaceMessage>;

  // Broadcast to all connected workspaces
  broadcast(message: WorkspaceMessage): void;
}

export interface WorkspaceMessage {
  type: 'register' | 'heartbeat' | 'thread-update' | 'operation-start' | 'operation-complete' | 'sync-threads';
  workspaceId: string;
  payload: any;
  timestamp: number;
}
```

### 3. Enhanced Agent Manager UI

#### New Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  A-Coder CONTROL CENTER                                      🔍  ⚙️  📊    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───┐                                                                    │
│  │🏠 │  Dashboard  │💬│ Chats      │📁│ Workspaces  │🔗│ Multi-View       │
│  └───┘                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌────────────────────────────────────────────────┐   │
│  │  Workspaces     │  │  Selected Workspace Content                   │   │
│  │                 │  │                                                │   │
│  │ 🟢 Project A    │  │  ┌─────────────────────────────────────────┐   │   │
│  │    2 threads    │  │  │ Thread 1: Fix authentication bug        │   │   │
│  │    🟡 1 active  │  │  │ ────────────────────────────────────────│   │   │
│  │                 │  │  │ Agent: Working on fix...                │   │   │
│  │ 🟢 Project B    │  │  │ [Streaming indicator]                   │   │   │   │
│  │    5 threads    │  │  │                                         │   │   │
│  │    🟢 0 active  │  │  │ Recent messages...                      │   │   │
│  │                 │  │  └─────────────────────────────────────────┘   │   │
│  │ ⚪ Project C    │  │                                                │   │
│  │    Offline      │  │  ┌─────────────────────────────────────────┐   │   │
│  │                 │  │  │ Thread 2: Add user settings             │   │   │
│  │ ➕ Add New      │  │  │ ────────────────────────────────────────│   │   │
│  │                 │  │  │ [Idle] Last: 2m ago                    │   │   │
│  └─────────────────┘  │  └─────────────────────────────────────────┘   │   │
│                      │                                                │   │
│                      │  ┌─────────────────────────────────────────┐   │   │
│                      │  │ Thread 3: API integration                │   │   │
│                      │  │ ────────────────────────────────────────│   │   │
│                      │  │ [Error] Failed to connect                │   │   │
│                      │  └─────────────────────────────────────────┘   │   │
│                      │                                                │   │
│                      └────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Tactical Preview (File/Walkthrough)                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Key UI Components

**WorkspaceList Component**
```tsx
interface WorkspaceListItem {
  id: string;
  name: string;
  path: string;
  status: 'connected' | 'disconnected' | 'inactive';
  threadCount: number;
  activeOperations: number;
  lastSeen: number;
}

const WorkspaceList: React.FC<{ onSelect: (ws: WorkspaceListItem) => void }> = ({ onSelect }) => {
  const workspaces = useAllWorkspaces(); // From registry service
  // Render list with status indicators, thread counts
};
```

**MultiWorkspaceThreadSelector Component**
```tsx
const MultiWorkspaceThreadSelector: React.FC = () => {
  const selectedWorkspace = useSelectedWorkspace();
  const threads = useWorkspaceThreads(selectedWorkspace?.id);

  // Show threads grouped by workspace
  // Each thread item shows workspace badge
};
```

**UnifiedDashboard Component**
```tsx
const UnifiedDashboard: React.FC = () => {
  const allWorkspaces = useAllWorkspaces();
  const totalThreads = allWorkspaces.reduce((sum, ws) => sum + ws.threadCount, 0);
  const activeOperations = allWorkspaces.reduce((sum, ws) => sum + ws.activeOperations, 0);

  // Show aggregated stats across all workspaces
  // Activity feed from all workspaces
};
```

### 4. Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           A-Coder Hub (Optional)                         │
│                     (Central registry service)                           │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │ WebSocket / IPC
          ┌─────────────────┼─────────────────┐
          │                 │                 │
    ┌─────▼─────┐     ┌────▼────┐      ┌─────▼─────┐
    │ Project A │     │Project B │      │ Project C │
    │           │     │         │      │           │
    │ Workspace │     │Workspace │      │Workspace │
    │ Service   │     │Service  │      │ Service   │
    └─────┬─────┘     └────┬────┘      └─────┬─────┘
          │                │                  │
          │ Heartbeat +    │ Heartbeat +      │ Heartbeat +
          │ Thread Updates │ Thread Updates   │ Thread Updates
          └────────────────┴──────────────────┘
                           │
                  ┌────────▼────────┐
                  │ Agent Manager   │
                  │ (Central View)  │
                  └─────────────────┘
```

### 5. Implementation Steps

#### Phase 1: Foundation (Workspace Registry)
1. Create `WorkspaceRegistryService` with local storage fallback
2. Implement heartbeat mechanism for workspace liveness
3. Create `WorkspaceCommService` using WebSocket for local communication
4. Add workspace registration on A-Coder startup

#### Phase 2: UI Enhancements
1. Add new "Multi-View" tab to Agent Manager
2. Implement `WorkspaceList` component
3. Implement `UnifiedDashboard` with aggregated stats
4. Add workspace selector to thread view

#### Phase 3: Thread Synchronization
1. Sync thread summaries to registry on changes
2. Implement real-time updates via WebSocket
3. Add workspace context to thread messages
4. Show workspace badge in thread list

#### Phase 4: Remote Control (Advanced)
1. Allow starting/stopping agents from Agent Manager
2. Send messages to specific workspace threads
3. Open files in specific workspaces
4. Broadcast commands to all workspaces

### 6. New Tool Integration

Add tools for multi-workspace management:

```typescript
// In prompts.ts - new tools for student/learn mode
list_workspaces: {
  name: 'list_workspaces',
  description: 'Lists all connected A-Coder workspaces',
  params: {}
},

switch_workspace: {
  name: 'switch_workspace',
  description: 'Switch context to a specific workspace',
  params: {
    workspace_id: { description: 'The workspace ID to switch to' }
  }
},

broadcast_message: {
  name: 'broadcast_message',
  description: 'Send a message to all workspaces',
  params: {
    message: { description: 'The message to broadcast' }
  }
},
```

### 7. UX Considerations

**Workspace States:**
- 🟢 Connected: Active, sending heartbeats
- 🟡 Warning: Missed recent heartbeat
- ⚪ Offline: No recent connection

**Thread Indicators:**
- Thread card shows workspace name/badge
- Color coding per workspace (consistent across UI)
- Filtering by workspace

**Visual Hierarchy:**
- Primary navigation: Workspaces > Threads
- Always-visible active operations counter
- Compact thread list with expandable details

**Privacy/Security:**
- Workspace registration is opt-in (user choice)
- Communication only via localhost
- No data leaves the local machine
- Each workspace can disconnect anytime

### 8. Technical Details

**WebSocket Hub:**
- Runs on `ws://localhost:{random_port}`
- Port stored in local storage for discovery
- First A-Coder instance becomes the "hub"
- Hub fails over to next instance on disconnect

**Message Protocol:**
```typescript
type WorkspaceMessage =
  | { type: 'register', workspaceId: string, info: WorkspaceConnection }
  | { type: 'heartbeat', workspaceId: string }
  | { type: 'thread-update', workspaceId: string, threads: WorkspaceThreadSummary[] }
  | { type: 'operation-start', workspaceId: string, threadId: string, operation: string }
  | { type: 'operation-complete', workspaceId: string, threadId: string }
  | { type: 'sync-request', workspaceId: string }
```

**State Management:**
- Each workspace maintains its own `ChatThreadService`
- Registry stores aggregated summaries
- Agent Manager queries registry for workspace list
- Individual thread data fetched on-demand from source workspace

### 9. Future Enhancements

- **Workspace Groups:** Organize workspaces into logical groups
- **Cross-Workspace Search:** Search across all workspaces
- **Unified Settings:** Apply settings across all workspaces
- **Workspace Templates:** Clone workspace configurations
- **Analytics Dashboard:** Usage statistics per workspace
- **Thread Sharing:** Share threads between workspaces

---

## Summary

The multi-workspace Agent Manager transforms A-Coder from a per-window tool into a unified development control center. Users can monitor all their projects, track agent progress, and manage operations across multiple codebases from a single, beautifully designed interface.