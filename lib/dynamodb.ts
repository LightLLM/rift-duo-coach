/**
 * DynamoDB Service for Caching Recap Insights
 * 
 * Stores and retrieves AI-generated insights to reduce API calls and improve performance
 */

import { 
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException
} from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand,
  DeleteCommand 
} from "@aws-sdk/lib-dynamodb";
import type { PlayerAnalytics } from './analytics';
import type { AIInsights } from './aws-bedrock';

// DynamoDB client instance
let dynamoClient: DynamoDBDocumentClient | null = null;
let baseClient: DynamoDBClient | null = null;

/**
 * Get or create DynamoDB client instance
 */
function getDynamoClient(): DynamoDBDocumentClient {
  if (!dynamoClient) {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env.local file.'
      );
    }

    baseClient = new DynamoDBClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Create document client for easier data handling
    dynamoClient = DynamoDBDocumentClient.from(baseClient);
  }

  return dynamoClient;
}

/**
 * Get base DynamoDB client for table operations
 */
function getBaseClient(): DynamoDBClient {
  if (!baseClient) {
    // Initialize both clients
    getDynamoClient();
  }
  return baseClient!;
}

// Table name from environment or default
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'rift-rewind-insights';

// TTL: 1 year in seconds
const TTL_DURATION = 365 * 24 * 60 * 60;

/**
 * Ensure DynamoDB table exists, create if it doesn't
 */
async function ensureTableExists(): Promise<void> {
  const client = getBaseClient();

  try {
    // Check if table exists
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`DynamoDB table ${TABLE_NAME} already exists`);
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      // Table doesn't exist, create it
      console.log(`Creating DynamoDB table ${TABLE_NAME}...`);
      
      await client.send(new CreateTableCommand({
        TableName: TABLE_NAME,
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },  // Partition key
          { AttributeName: 'SK', KeyType: 'RANGE' }  // Sort key
        ],
        AttributeDefinitions: [
          { AttributeName: 'PK', AttributeType: 'S' },
          { AttributeName: 'SK', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST', // On-demand pricing
        Tags: [
          {
            Key: 'rift-rewind-hackathon',
            Value: '2025'
          },
          {
            Key: 'Project',
            Value: 'RiftRewind'
          },
          {
            Key: 'Environment',
            Value: process.env.NODE_ENV || 'development'
          }
        ],
        TimeToLiveSpecification: {
          Enabled: true,
          AttributeName: 'ttl'
        }
      }));

      console.log(`DynamoDB table ${TABLE_NAME} created successfully with tags and TTL`);
    } else {
      throw error;
    }
  }
}

/**
 * Cached recap data structure
 */
export interface CachedRecap {
  PK: string;           // USER#{puuid}
  SK: string;           // RECAP#{year}
  riotId: string;
  region: string;
  generatedAt: number;  // Unix timestamp
  analytics: PlayerAnalytics;
  insights: AIInsights;
  ttl: number;          // Unix timestamp for automatic expiration
}

/**
 * Save recap data to DynamoDB
 * 
 * @param puuid - Player PUUID
 * @param year - Year of the recap
 * @param riotId - Player's Riot ID
 * @param region - Player's region
 * @param data - Analytics and insights data
 */
export async function saveRecap(
  puuid: string,
  year: number,
  riotId: string,
  region: string,
  data: { analytics: PlayerAnalytics; insights: AIInsights }
): Promise<void> {
  try {
    // Ensure table exists before attempting to write
    await ensureTableExists();

    const client = getDynamoClient();
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

    const item: CachedRecap = {
      PK: `USER#${puuid}`,
      SK: `RECAP#${year}`,
      riotId,
      region,
      generatedAt: now,
      analytics: data.analytics,
      insights: data.insights,
      ttl: now + TTL_DURATION, // Expire after 1 year
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    });

    await client.send(command);
    console.log(`Recap saved to DynamoDB for ${riotId} (${year})`);
  } catch (error) {
    // Log error but don't throw - caching is optional
    console.error('Failed to save recap to DynamoDB:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
      });
    }
  }
}

/**
 * Retrieve cached recap data from DynamoDB
 * 
 * @param puuid - Player PUUID
 * @param year - Year of the recap
 * @returns Cached recap data or null if not found
 */
export async function getRecap(
  puuid: string,
  year: number
): Promise<{ analytics: PlayerAnalytics; insights: AIInsights } | null> {
  try {
    // Ensure table exists before attempting to read
    await ensureTableExists();

    const client = getDynamoClient();

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${puuid}`,
        SK: `RECAP#${year}`,
      },
    });

    const response = await client.send(command);

    if (!response.Item) {
      console.log(`No cached recap found for PUUID ${puuid} (${year})`);
      return null;
    }

    const item = response.Item as CachedRecap;

    // Check if cache is still valid (not expired)
    const now = Math.floor(Date.now() / 1000);
    if (item.ttl && item.ttl < now) {
      console.log(`Cached recap expired for PUUID ${puuid} (${year})`);
      return null;
    }

    console.log(`Retrieved cached recap for ${item.riotId} (${year})`);
    return {
      analytics: item.analytics,
      insights: item.insights,
    };
  } catch (error) {
    // Log error but don't throw - caching is optional
    console.error('Failed to retrieve recap from DynamoDB:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
      });
    }
    return null;
  }
}

/**
 * Delete cached recap data from DynamoDB
 * 
 * @param puuid - Player PUUID
 * @param year - Year of the recap
 */
export async function deleteRecap(
  puuid: string,
  year: number
): Promise<void> {
  try {
    const client = getDynamoClient();

    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${puuid}`,
        SK: `RECAP#${year}`,
      },
    });

    await client.send(command);
    console.log(`Deleted cached recap for PUUID ${puuid} (${year})`);
  } catch (error) {
    // Log error but don't throw - caching is optional
    console.error('Failed to delete recap from DynamoDB:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
      });
    }
  }
}

/**
 * Check if DynamoDB is configured and available
 * 
 * @returns true if DynamoDB is configured, false otherwise
 */
export function isDynamoDBConfigured(): boolean {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const enableCaching = process.env.ENABLE_CACHING !== 'false'; // Default to true

  return !!(accessKeyId && secretAccessKey && enableCaching);
}
