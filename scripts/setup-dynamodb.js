/**
 * Script to create DynamoDB table for Rift Rewind
 * 
 * Run with: node scripts/setup-dynamodb.js
 */

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'rift-rewind-insights';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

async function setupDynamoDBTable() {
  const client = new DynamoDBClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    // Check if table already exists
    try {
      const describeCommand = new DescribeTableCommand({
        TableName: TABLE_NAME,
      });
      await client.send(describeCommand);
      console.log(`✓ Table '${TABLE_NAME}' already exists`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
      // Table doesn't exist, proceed to create it
    }

    // Create table with PK/SK schema
    const createCommand = new CreateTableCommand({
      TableName: TABLE_NAME,
      AttributeDefinitions: [
        {
          AttributeName: 'PK',
          AttributeType: 'S', // String
        },
        {
          AttributeName: 'SK',
          AttributeType: 'S', // String
        },
      ],
      KeySchema: [
        {
          AttributeName: 'PK',
          KeyType: 'HASH', // Partition key
        },
        {
          AttributeName: 'SK',
          KeyType: 'RANGE', // Sort key
        },
      ],
      BillingMode: 'PAY_PER_REQUEST', // On-demand pricing
      Tags: [
        {
          Key: 'rift-rewind-hackathon',
          Value: '2025',
        },
        {
          Key: 'project',
          Value: 'rift-rewind',
        },
      ],
      // Enable TTL for automatic expiration
      TimeToLiveSpecification: {
        Enabled: true,
        AttributeName: 'ttl',
      },
    });

    console.log(`Creating DynamoDB table '${TABLE_NAME}'...`);
    await client.send(createCommand);
    console.log(`✓ Table '${TABLE_NAME}' created successfully!`);
    console.log(`  Region: ${AWS_REGION}`);
    console.log(`  Billing: PAY_PER_REQUEST`);
    console.log(`  TTL: Enabled (attribute: ttl)`);
    console.log(`  Tags: rift-rewind-hackathon=2025`);
  } catch (error) {
    console.error('Failed to create DynamoDB table:', error);
    if (error.name === 'ResourceInUseException') {
      console.log(`Table '${TABLE_NAME}' already exists`);
    } else {
      throw error;
    }
  }
}

// Run the setup
setupDynamoDBTable()
  .then(() => {
    console.log('\n✓ DynamoDB setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ DynamoDB setup failed:', error.message);
    process.exit(1);
  });
