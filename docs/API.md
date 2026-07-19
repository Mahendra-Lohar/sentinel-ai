# Sentinel AI REST API

Base URL: `/api`

## Authentication

### `POST /auth/register`
Create a new user account.
- **Body**: `{ name, email, password }`
- **Response**: `{ user, token, refreshToken }`

### `POST /auth/login`
Authenticate an existing user.
- **Body**: `{ email, password }`
- **Response**: `{ user, token, refreshToken }`

### `POST /auth/refresh`
Refresh a JWT using a refresh token.
- **Body**: `{ refreshToken }`
- **Response**: `{ user, token, refreshToken }`

### `POST /auth/logout`
Revoke a refresh token.
- **Body**: `{ refreshToken }`

## Investigations

### `GET /investigations`
List all investigations. Supports pagination and filtering.
- **Query Params**: `status`, `severity`, `search`
- **Response**: `{ investigations: [...] }`

### `POST /investigations`
Create a new investigation.
- **Body**: `{ title, description, severity, scenarioId }`
- **Response**: `{ investigation }`

### `POST /investigations/:id/launch`
Launch the AEGIS multi-agent engine on this investigation.
- **Response**: `{ message: 'Started', status: 'investigating' }`

### `GET /investigations/:id/results`
Get the final synthesis results and agent outputs.
- **Response**: `{ results: { evidence, agents, timeline, recommendations, report } }`

## Evidence

### `POST /investigations/:id/evidence`
Upload new log/metric files to an investigation.
- **Form Data**: `files` (array of files)
- **Response**: `{ uploadedCount }`

## Settings

### `GET /settings`
Get system-wide settings for integrations (Slack, Jira).
- **Response**: `{ settings: { slack_webhook_url, ... } }`

### `POST /settings`
Update system settings.
- **Body**: `{ slack_webhook_url, jira_host, ... }`
- **Response**: `{ settings }`
