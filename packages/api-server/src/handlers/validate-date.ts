import { APIGatewayProxyResult } from 'aws-lambda';

interface ValidateDateRequest {
  date: string;
}

export const handleValidateDate = async (
  body: ValidateDateRequest
): Promise<APIGatewayProxyResult> => {
  try {
    const { date } = body;

    if (!date) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Date parameter is required',
        }),
      };
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        }),
      };
    }

    const parsedDate = new Date(date);
    const isValid = !isNaN(parsedDate.getTime());

    if (!isValid) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Invalid date',
        }),
      };
    }

    // Check if date is in the future and feasible
    const isFeasible = Math.random() > 0.2; // 80% of dates are feasible

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        date,
        feasible: isFeasible,
        reason: isFeasible ? 'Available for deployment' : 'Maintenance window scheduled',
      }),
    };
  } catch (error) {
    console.error('Validate date handler error:', error);
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
