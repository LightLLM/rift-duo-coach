# DynamoDB Setup Guide

This guide explains how to set up DynamoDB caching for Rift Rewind to improve performance and reduce API costs.

## Overview

DynamoDB caching stores AI-generated insights for each player's year-end recap. This provides several benefits:

- **Faster Load Times**: Cached recaps load instantly instead of taking 20-45 seconds
- **Reduced API Costs**: Fewer calls to AWS Bedrock and Riot API
- **Better User Experience**: Players can view their recap multiple times without regeneration
- **Automatic Expiration**: Cached data expires after 1 year using DynamoDB TTL

## Prerequisites

1. AWS Account with access to DynamoDB
2. AWS credentials (Access Key ID and Secret Access Key)
3. Node.js and npm installed

## Setup Instructions

### 1. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# DynamoDB Configuration
DYNAMODB_TABLE_NAME=rift-rewind-insights
ENABLE_CACHING=true
```

**Note**: For production deployments, use IAM roles instead of access keys for better security.

### 2. Install Dependencies

The required AWS SDK packages should already be installed. If not, run:

```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

### 3. Create DynamoDB Table

Run the setup script to create the table:

```bash
node scripts/setup-dynamodb.js
```

This script will:
- Create a table named `rift-rewind-insights` (or your custom name)
- Configure PK/SK schema for efficient queries
- Enable TTL for automatic data expiration (1 year)
- Add resource tags: `rift-rewind-hackathon: 2025`
- Use PAY_PER_REQUEST billing mode (no upfront costs)

### 4. Verify Table Creation

You can verify the table was created using the AWS CLI:

```bash
aws dynamodb describe-table --table-name rift-rewind-insights
```

Or check in the AWS Console:
1. Go to [DynamoDB Console](https://console.aws.amazon.com/dynamodb)
2. Select your region (e.g., us-east-1)
3. Look for the `rift-rewind-insights` table

## Table Schema

The DynamoDB table uses the following schema:

| Attribute | Type | Description |
|-----------|------|-------------|
| `PK` | String (Hash Key) | Partition key: `USER#{puuid}` |
| `SK` | String (Range Key) | Sort key: `RECAP#{year}` |
| `riotId` | String | Player's Riot ID (e.g., "PlayerName#NA1") |
| `region` | String | Player's region (e.g., "na1") |
| `generatedAt` | Number | Unix timestamp when recap was generated |
| `analytics` | Object | Player analytics data |
| `insights` | Object | AI-generated insights |
| `ttl` | Number | Unix timestamp for automatic expiration |

## How Caching Works

### Cache Flow

1. **User submits Riot ID**: Server action receives the request
2. **Check cache**: Query DynamoDB for existing recap
3. **Cache hit**: Return cached data immediately (< 1 second)
4. **Cache miss**: Generate fresh recap from Riot API + AWS Bedrock
5. **Save to cache**: Store the generated recap in DynamoDB
6. **Return data**: Send recap to user

### Cache Invalidation

Cached recaps automatically expire after 1 year using DynamoDB's TTL feature. You can also manually invalidate cache by:

```typescript
import { deleteRecap } from '@/lib/dynamodb';

// Delete cached recap for a specific player and year
await deleteRecap(puuid, 2025);
```

## Disabling Caching

To disable DynamoDB caching, set in your `.env.local`:

```bash
ENABLE_CACHING=false
```

The application will continue to work normally, generating fresh recaps on each request.

## Cost Estimation

DynamoDB costs for Rift Rewind are minimal:

### PAY_PER_REQUEST Pricing (us-east-1)

- **Write requests**: $1.25 per million requests
- **Read requests**: $0.25 per million requests
- **Storage**: $0.25 per GB-month

### Example Cost Calculation

For 1,000 users generating recaps:
- 1,000 writes (save recap): $0.00125
- 5,000 reads (users viewing recap 5x): $0.00125
- Storage (1,000 recaps × ~50KB): ~$0.0125/month

**Total monthly cost**: ~$0.015 (less than 2 cents)

## Troubleshooting

### Error: "AWS credentials not configured"

Make sure you have set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in your `.env.local` file.

### Error: "ResourceNotFoundException"

The DynamoDB table doesn't exist. Run the setup script:

```bash
node scripts/setup-dynamodb.js
```

### Error: "AccessDeniedException"

Your AWS credentials don't have permission to access DynamoDB. Ensure your IAM user/role has the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:DeleteItem",
        "dynamodb:DescribeTable"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/rift-rewind-insights"
    }
  ]
}
```

### Cache not working

Check the console logs for DynamoDB-related messages:
- `[Recap] Checking DynamoDB cache...`
- `[Recap] Using cached recap data` (cache hit)
- `[Recap] No cached data found, generating fresh recap...` (cache miss)

If you see errors, check:
1. AWS credentials are correct
2. DynamoDB table exists
3. `ENABLE_CACHING=true` in `.env.local`
4. Your AWS region matches the table region

## Production Deployment

### Using IAM Roles (Recommended)

For production deployments on AWS (EC2, ECS, Lambda, Amplify), use IAM roles instead of access keys:

1. Create an IAM role with DynamoDB permissions
2. Attach the role to your compute resource
3. Remove `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from environment variables
4. The AWS SDK will automatically use the IAM role credentials

### Vercel Deployment

For Vercel deployments:

1. Add environment variables in Vercel dashboard
2. Use the same AWS credentials as local development
3. Ensure the AWS region is set correctly

### Monitoring

Monitor DynamoDB usage in the AWS Console:
- Go to DynamoDB → Tables → rift-rewind-insights
- Check the "Metrics" tab for read/write capacity
- Set up CloudWatch alarms for high usage

## Additional Resources

- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
