import { APIGatewayProxyResult } from 'aws-lambda';
import * as fs from 'fs';
import * as path from 'path';

export const handleCalendar = async (): Promise<APIGatewayProxyResult> => {
  try {
    // Try to read calendar data from the Lambda layer or embedded data
    const calendarData = {
      year: 2026,
      entries: generateMockCalendarData(),
      generated_at: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: calendarData,
        count: calendarData.entries.length,
      }),
    };
  } catch (error) {
    console.error('Calendar handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to fetch calendar data',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

function generateMockCalendarData() {
  const entries = [];
  
  // Generate mock calendar entries for 2026
  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= 28; day++) {
      entries.push({
        date: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        feasible: Math.random() > 0.3, // 70% feasible
        reason: Math.random() > 0.3 ? null : 'Holiday or maintenance window',
      });
    }
  }
  
  return entries;
}
