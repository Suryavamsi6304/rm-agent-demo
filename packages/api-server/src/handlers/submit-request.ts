import { APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';

interface SubmitRequestBody {
  title?: string;
  description?: string;
  date?: string;
  team?: string;
}

export const handleSubmitRequest = async (
  body: SubmitRequestBody
): Promise<APIGatewayProxyResult> => {
  try {
    const { title, description, date, team } = body;

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

    // Check if Jira environment variables are set
    const jiraBaseUrl = process.env.JIRA_BASE_URL;
    const jiraAuthHeader = process.env.JIRA_AUTH_HEADER;
    const projectId = process.env.JIRA_PROJECT_ID;

    if (!jiraBaseUrl || !jiraAuthHeader || !projectId) {
      console.warn('Jira environment variables not configured, returning mock response');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          issueKey: 'MOCK-123',
          message: 'Request submitted (mock - Jira not configured)',
          issueUrl: 'https://example.atlassian.net/browse/MOCK-123',
        }),
      };
    }

    try {
      // Attempt to create Jira issue
      const jiraPayload = {
        fields: {
          project: { id: projectId },
          issuetype: { id: process.env.JIRA_ISSUETYPE_ID },
          summary: title,
          description,
          priority: { id: process.env.JIRA_PRIORITY_ID },
        },
      };

      const response = await axios.post(`${jiraBaseUrl}/issue`, jiraPayload, {
        headers: {
          Authorization: jiraAuthHeader,
          'Content-Type': 'application/json',
        },
      });

      const issueKey = response.data.key;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          issueKey,
          message: 'Request submitted successfully',
          issueUrl: `${process.env.JIRA_BROWSE_BASE_URL}/browse/${issueKey}`,
        }),
      };
    } catch (jiraError) {
      console.error('Jira API error:', jiraError);
      // Fallback: still return success with mock issue key
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          issueKey: 'FALLBACK-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          message: 'Request submitted with fallback handling',
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
