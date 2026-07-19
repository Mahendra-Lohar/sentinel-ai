# Real-Time WebSocket Streaming

Sentinel AI uses **Socket.io** to stream the live thought processes of the AI agents to the frontend in real-time.

## Connection
Clients should connect to the root namespace with their JWT token.
```javascript
const socket = io(API_URL, {
  withCredentials: true,
  extraHeaders: {
    Authorization: `Bearer ${token}`
  }
});
```

## Client -> Server Events

### `join_investigation`
Subscribe to updates for a specific investigation.
- **Payload**: `investigationId` (string)

### `leave_investigation`
Unsubscribe from updates.
- **Payload**: `investigationId` (string)

## Server -> Client Events

### `investigation:update`
Fired when the overarching status of an investigation changes (e.g. `pending` -> `investigating`).
- **Payload**: `{ status, rootCause, confidence, businessImpact }`

### `agent:start`
Fired when a specialist agent begins processing evidence.
- **Payload**: `{ investigationId, agentName, timestamp }`

### `agent:progress`
Streams the live reasoning and thought process of the agent.
- **Payload**: `{ investigationId, agentName, output, step }`

### `agent:complete`
Fired when an agent finishes processing and returns its structured JSON findings.
- **Payload**: `{ investigationId, agentName, output, confidence }`

### `chat:message`
Fired when the AI responds to a user chat query in the investigation dashboard.
- **Payload**: `{ messageId, role, content, timestamp }`
