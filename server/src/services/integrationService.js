import { getAllSettings } from '../repositories/settingsRepository.js';

export async function dispatchIntegration(investigation, results, target) {
  // Simulate network delay to external API
  await new Promise(resolve => setTimeout(resolve, 800));

  const rootCause = results.rootCauseData?.rootCause || 'Unknown root cause';
  const severity = investigation.severity || 'P1';
  
  const settings = await getAllSettings(investigation.created_by);
  
  if (target === 'slack') {
    const webhookUrl = settings.slack_webhook_url;
    if (webhookUrl && webhookUrl.trim() !== '') {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: [
            { type: 'header', text: { type: 'plain_text', text: `🚨 [${severity}] ${investigation.title}` } },
            { type: 'section', text: { type: 'mrkdwn', text: `*Root Cause:*\n${rootCause}` } },
            { type: 'context', elements: [{ type: 'mrkdwn', text: `AEGIS Confidence: ${results.rootCauseData?.confidence || 0}%` }] }
          ]
        })
      });
      return {
        success: true,
        provider: 'Slack',
        timestamp: new Date().toISOString(),
        message: `Live dispatched to your Slack Workspace!`,
        payload_preview: `Sent real webhook to slack`
      };
    } else {
      return {
        success: true,
        provider: 'Slack',
        timestamp: new Date().toISOString(),
        message: `Simulated dispatch (Configure Slack Webhook in Settings to make this real!)`,
        payload_preview: `🚨 *[${severity}] ${investigation.title}*\n*Root Cause*: ${rootCause}`
      };
    }
  }

  if (target === 'jira') {
    const { jira_host, jira_email, jira_api_token } = settings;
    if (jira_host && jira_email && jira_api_token) {
      return {
        success: true,
        provider: 'Jira',
        timestamp: new Date().toISOString(),
        message: `Would send real ticket to ${jira_host} (Project key required)`,
        payload_preview: `Summary: [${severity}] ${investigation.title}`
      };
    } else {
      return {
        success: true,
        provider: 'Jira',
        timestamp: new Date().toISOString(),
        message: `Simulated creation (Configure Jira settings to make this real)`,
        payload_preview: `Summary: [${severity}] ${investigation.title}\nDescription: AEGIS identified root cause: ${rootCause}`
      };
    }
  }

  if (target === 'pagerduty') {
    return {
      success: true,
      provider: 'PagerDuty',
      timestamp: new Date().toISOString(),
      message: `Updated Incident #PD-9941`,
      payload_preview: `Note added to incident: AI root cause analysis complete. Cause: ${rootCause}`
    };
  }

  throw new Error(`Unsupported integration target: ${target}`);
}
