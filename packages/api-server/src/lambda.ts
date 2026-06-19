import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handleCalendar } from './handlers/calendar';
import { handleValidateDate } from './handlers/validate-date';
import { handleSubmitRequest } from './handlers/submit-request';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const path = event.path || event.requestContext?.resourcePath || '';
  const method = event.httpMethod || event.requestContext?.httpMethod || '';

  try {
    // Health check endpoint
    if (path === '/' && method === 'GET') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
      };
    }

    // Calendar endpoint
    if (path === '/api/calendar' && method === 'GET') {
      return await handleCalendar();
    }

    // Validate date endpoint
    if (path === '/api/validate-date' && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      return await handleValidateDate(body);
    }

    // Submit request endpoint (Jira integration)
    if (path === '/api/submit-request' && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      return await handleSubmitRequest(body);
    }

    // 404 for unknown routes
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Route not found', path, method }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
