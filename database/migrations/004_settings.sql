CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-populate some keys if desired, or let the app handle it
INSERT INTO system_settings (key, value) VALUES 
('slack_webhook_url', ''),
('jira_host', ''),
('jira_email', ''),
('jira_api_token', '')
ON CONFLICT (key) DO NOTHING;
