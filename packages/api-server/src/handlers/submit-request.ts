import { APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';

interface SubmitRequestBody {
  title?: string;
  description?: string;
  date?: string;
  team?: string;
  market?: string;
}

interface JiraIssueResponse {
  id: string;
  key: string;
  self: string;
}

/**
 * Creates a Jira ticket using the credentials provided via Jenkins pipeline
 * Environment variables set by pipeline:
 * - JIRA_BASE_URL: Jira instance URL
 * - JIRA_AUTH_HEADER: Base64 encoded email:apitoken for authentication
 * - JIRA_PROJECT_ID: Jira project ID
 * - JIRA_ISSUETYPE_ID: Issue type ID (default: Task)
 * - JIRA_PRIORITY_ID: Priority ID (default: Medium)
 * - JIRA_MARKET_FIELD_ID: Custom field ID for market
 * - JIRA_MARKET_OPTION_ID: Custom field option ID for market
 * - JIRA_BROWSE_BASE_URL: Base URL for browsing issues
 */
export const handleSubmitRequest = async (
  body: SubmitRequestBody
): Promise<APIGatewayProxyResult> => {
  try {
    const { title, description, date, team, market } = body;

    // Validate required fields
    if (!title || !description) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Title and description are required',
        }),
      };
    }

    // Get Jira configuration from environment variables (set by pipeline)
    const jiraBaseUrl = process.env.JIRA_BASE_URL;
    const jiraAuthHeader = process.env.JIRA_AUTH_HEADER;
    const projectId = process.env.JIRA_PROJECT_ID;
    const issueTypeId = process.env.JIRA_ISSUETYPE_ID || '10001';
    const priorityId = process.env.JIRA_PRIORITY_ID || '1';
    const marketFieldId = process.env.JIRA_MARKET_FIELD_ID;
    const marketOptionId = process.env.JIRA_MARKET_OPTION_ID;
    const browseBaseUrl = process.env.JIRA_BROWSE_BASE_URL;

    // If Jira not configured, return mock response (useful for local testing)
    if (!jiraBaseUrl || !jiraAuthHeader || !projectId) {
      console.warn('Jira environment variables not configured, returning mock response');
      const mockIssueKey = 'MOCK-' + Math.random().toString(36).substr(2, 5).toUpperCase();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          issueKey: mockIssueKey,
          message: 'Request submitted (mock - Jira not configured)',
          issueUrl: 'https://example.atlassian.net/browse/' + mockIssueKey,
        }),
      };
    }

    try {
      // Build Jira issue payload
      const jiraPayload: any = {
        fields: {
          project: { id: projectId },
          issuetype: { id: issueTypeId },
          summary: title,
          description: description || 'Release request submission',
          priority: { id: priorityId },
        },
      };

      // Add optional custom fields if configured
      if (date) {
        jiraPayload.fields.labels = ['release-' + date.replace(/-/g, '')];
      }

      if (team) {
        jiraPayload.fields.customfield_10001 = team; // Adjust field ID as needed
      }

      if (market && marketFieldId && marketOptionId) {
        jiraPayload.fields[marketFieldId] = { id: marketOptionId };
      }

      console.log('Creating Jira issue with payload:', JSON.stringify(jiraPayload));

      // Create Jira issue via API
      const jiraApiUrl = `${jiraBaseUrl}/rest/api/3/issue`;
      const response = await axios.post<JiraIssueResponse>(jiraApiUrl, jiraPayload, {
        headers: {
          Authorization: `Bearer ${jiraAuthHeader}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      const issueKey = response.data.key;
      const issueUrl = browseBaseUrl
        ? `${browseBaseUrl}/browse/${issueKey}`
        : `${jiraBaseUrl}/browse/${issueKey}`;

      console.log('Jira issue created successfully:', issueKey);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          issueKey,
          issueId: response.data.id,
          message: 'Request submitted successfully - Jira ticket created',
          issueUrl,
          timestamp: new Date().toISOString(),
        }),
      };
    } catch (jiraError: any) {
      console.error('Jira API error:', {
        status: jiraError.response?.status,
        statusText: jiraError.response?.statusText,
        data: jiraError.response?.data,
        message: jiraError.message,
      });

      // Return error with details
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Failed to create Jira ticket',
          details: {
            status: jiraError.response?.status,
            message: jiraError.response?.data?.errorMessages?.[0] || jiraError.message,
          },
        }),
      };
    }
  } catch (error) {
    console.error('Submit request handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
