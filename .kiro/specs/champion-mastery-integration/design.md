# Design Document

## Overview

This design document outlines the integration of Riot Games Match History API and Champion Mastery API data into the Rift Rewind application, enhanced with **AWS AI services** to generate personalized insights and coaching recommendations. The solution fetches full-year match data, uses **AWS Bedrock** for AI-powered analysis, stores insights in **DynamoDB**, and creates shareable year-end recaps. This aligns with the **Rift Rewind Hackathon 2025** requirements to build an AI-powered coaching agent that goes beyond op.gg capabilities.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   User Browser  │
│  (RiftRewind)   │
└────────┬────────┘
         │ Submit Riot ID + Region
         ▼
┌─────────────────────────────────────────┐
│         Next.js Server Action           │
│  (Fetch Match History + Mastery Data)   │
└────────┬────────────────────────────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Riot Match   │ │ Riot Mastery │ │ Riot Account │ │ Data Dragon  │
│ History API  │ │ API          │ │ API          │ │ (Champions)  │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │                │
       └────────────────┴────────────────┴────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────┐
│      Data Aggregation & Transform       │
│  • Match stats by champion              │
│  • Temporal trends (monthly/weekly)     │
│  • Performance metrics (KDA, vision)    │
│  • Win streaks, loss streaks            │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         AWS Bedrock (Claude 3)          │
│  • Analyze patterns and trends          │
│  • Generate personalized insights       │
│  • Create coaching recommendations      │
│  • Generate roasts and boasts           │
│  • Identify improvement areas           │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         AWS DynamoDB (Optional)         │
│  • Cache generated insights             │
│  • Store historical recaps              │
│  • Track user preferences               │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         Response to Client              │
│  • Match statistics                     │
│  • AI-generated insights                │
│  • Shareable recap card                 │
│  • Coaching recommendations             │
└─────────────────────────────────────────┘
```

### AWS Services Integration

1. **AWS Bedrock (Claude 3 Sonnet)**
   - Analyze full-year match history
   - Generate personalized insights
   - Create natural language coaching tips
   - Identify patterns and trends

2. **AWS DynamoDB** (Optional for MVP)
   - Cache AI-generated insights
   - Store user recap history
   - Enable social comparison features

3. **AWS Lambda** (Future Enhancement)
   - Scheduled recap generation
   - Batch processing for multiple users
   - Background insight generation

## Components and Interfaces

### 1. Match History Service (`lib/match-history.ts`)

**Purpose**: Fetch and aggregate full-year match history from Riot API

**Interface**:
```typescript
export interface MatchDetails {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  gameMode: string;
  queueId: number;
  participant: {
    puuid: string;
    championId: number;
    championName: string;
    kills: number;
    deaths: number;
    assists: number;
    win: boolean;
    visionScore: number;
    totalDamageDealt: number;
    goldEarned: number;
    totalMinionsKilled: number;
    role: string;
    lane: string;
    items: number[];
  };
}

// Fetch match IDs for a time period
export async function getMatchIds(
  puuid: string,
  region: string,
  startTime?: number,
  endTime?: number,
  count?: number
): Promise<string[]>

// Fetch detailed match data
export async function getMatchDetails(
  matchId: string,
  region: string
): Promise<MatchDetails>

// Fetch full year of matches (batched)
export async function getFullYearMatches(
  puuid: string,
  region: string
): Promise<MatchDetails[]>
```

**Implementation Details**:
- Use Match-V5 API endpoint: `/lol/match/v5/matches/by-puuid/{puuid}/ids`
- Batch requests to avoid rate limits (100 matches per request)
- Filter for ranked games (queueId: 420, 440)
- Fetch matches from last 365 days
- Implement retry logic with exponential backoff

### 2. Data Aggregation Service (`lib/analytics.ts`)

**Purpose**: Transform raw match data into structured analytics

**Interface**:
```typescript
export interface PlayerAnalytics {
  overview: {
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
    avgKDA: number;
    avgKills: number;
    avgDeaths: number;
    avgAssists: number;
    totalPlaytime: number; // in hours
  };
  
  championStats: ChampionStat[];
  
  temporalTrends: {
    monthlyWinRate: MonthlyData[];
    weeklyPerformance: WeeklyData[];
    bestMonth: string;
    worstMonth: string;
  };
  
  performanceMetrics: {
    avgVisionScore: number;
    avgDamagePerMinute: number;
    avgGoldPerMinute: number;
    avgCSPerMinute: number;
  };
  
  streaks: {
    longestWinStreak: number;
    longestLossStreak: number;
    currentStreak: { type: 'win' | 'loss'; count: number };
  };
  
  roleDistribution: Record<string, number>;
  
  highlightMatches: {
    bestKDA: MatchDetails;
    mostKills: MatchDetails;
    longestGame: MatchDetails;
    highestDamage: MatchDetails;
  };
}

export interface ChampionStat {
  championId: number;
  championName: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKDA: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  totalPlaytime: number;
  masteryLevel?: number;
  masteryPoints?: number;
}

export function aggregateMatchData(
  matches: MatchDetails[],
  masteries: EnrichedMastery[]
): PlayerAnalytics
```

### 3. AWS Bedrock Integration (`lib/aws-bedrock.ts`)

**Purpose**: Generate AI-powered insights using Claude 3

**Interface**:
```typescript
export interface AIInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvementAreas: string[];
  coachingTips: string[];
  roast: string;
  boast: string;
  hiddenGems: string[];
  yearInReview: string;
  shareableQuote: string;
}

export async function generateInsights(
  analytics: PlayerAnalytics
): Promise<AIInsights>

export async function generateCoachingTips(
  analytics: PlayerAnalytics,
  focusArea: 'macro' | 'micro' | 'champion-pool' | 'mental'
): Promise<string[]>
```

**AWS Bedrock Configuration**:
```typescript
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const modelId = "anthropic.claude-3-sonnet-20240229-v1:0";
```

**Prompt Engineering**:
```typescript
const systemPrompt = `You are an expert League of Legends coach analyzing a player's full year of ranked matches. 
Your goal is to provide personalized, actionable insights that help them improve while being engaging and fun.

Focus on:
- Identifying persistent patterns (good and bad)
- Highlighting growth over time
- Suggesting specific, actionable improvements
- Celebrating achievements
- Being honest but encouraging

Avoid:
- Generic advice that applies to everyone
- Overly technical jargon
- Negativity without constructive feedback`;

const userPrompt = `Analyze this player's year in League of Legends:

Total Games: ${analytics.overview.totalGames}
Win Rate: ${analytics.overview.winRate}%
Average KDA: ${analytics.overview.avgKDA}

Top Champions:
${analytics.championStats.slice(0, 5).map(c => 
  `- ${c.championName}: ${c.games} games, ${c.winRate}% WR, ${c.avgKDA} KDA`
).join('\n')}

Temporal Trends:
- Best Month: ${analytics.temporalTrends.bestMonth}
- Worst Month: ${analytics.temporalTrends.worstMonth}

Performance Metrics:
- Vision Score: ${analytics.performanceMetrics.avgVisionScore}
- Damage/Min: ${analytics.performanceMetrics.avgDamagePerMinute}
- CS/Min: ${analytics.performanceMetrics.avgCSPerMinute}

Streaks:
- Longest Win Streak: ${analytics.streaks.longestWinStreak}
- Longest Loss Streak: ${analytics.streaks.longestLossStreak}

Generate:
1. A compelling year-in-review summary (2-3 sentences)
2. Top 3 strengths
3. Top 3 areas for improvement
4. 5 specific coaching tips
5. A playful roast (1-2 sentences)
6. An encouraging boast (1-2 sentences)
7. Hidden gem champions they should play more
8. A shareable quote for social media`;
```

### 4. Champion Data Service (`lib/champion-data.ts`)

**Purpose**: Map champion IDs to names using Data Dragon

**Interface**:
```typescript
export interface ChampionInfo {
  id: string;
  key: string;
  name: string;
  title: string;
  image: {
    full: string;
    sprite: string;
  };
}

export async function getChampionData(): Promise<Record<string, ChampionInfo>>
export function getChampionName(championId: number): string
export function getChampionImageUrl(championId: number): string
```

**Data Source**:
- Riot Data Dragon: `https://ddragon.leagueoflegends.com/cdn/14.1.1/data/en_US/champion.json`
- Cache in memory for application lifetime
- Fallback to static mapping for top 50 champions

### 5. DynamoDB Service (`lib/dynamodb.ts`) - Optional

**Purpose**: Cache insights and enable historical tracking

**Schema**:
```typescript
// Table: rift-rewind-insights
{
  PK: "USER#{puuid}",
  SK: "RECAP#{year}",
  riotId: string,
  region: string,
  generatedAt: number,
  analytics: PlayerAnalytics,
  insights: AIInsights,
  ttl: number, // 1 year expiration
}
```

**Interface**:
```typescript
export async function saveRecap(
  puuid: string,
  year: number,
  data: { analytics: PlayerAnalytics; insights: AIInsights }
): Promise<void>

export async function getRecap(
  puuid: string,
  year: number
): Promise<{ analytics: PlayerAnalytics; insights: AIInsights } | null>
```

### 6. Updated Server Action (`app/page.tsx`)

**Modified Function**:
```typescript
async function generateRecap(formData: FormData): Promise<RecapResponse> {
  'use server';
  
  const riotId = formData.get('riotId') as string;
  const region = (formData.get('region') as RiotRegion) || 'na1';
  
  try {
    // 1. Get account PUUID
    const parsed = parseRiotId(riotId);
    if (!parsed) throw new Error('Invalid Riot ID format');
    
    const account = await getAccountByRiotId(parsed.gameName, parsed.tagLine, region);
    
    // 2. Fetch match history (full year)
    const matches = await getFullYearMatches(account.puuid, region);
    
    // 3. Fetch champion masteries
    const masteries = await getAllChampionMasteriesByPuuid(account.puuid, region);
    
    // 4. Enrich with champion names
    const enrichedMasteries = await enrichMasteries(masteries);
    
    // 5. Aggregate analytics
    const analytics = aggregateMatchData(matches, enrichedMasteries);
    
    // 6. Generate AI insights using AWS Bedrock
    const insights = await generateInsights(analytics);
    
    // 7. (Optional) Save to DynamoDB
    await saveRecap(account.puuid, new Date().getFullYear(), { analytics, insights });
    
    return {
      success: true,
      data: {
        account: {
          riotId,
          region,
          puuid: account.puuid,
        },
        analytics,
        insights,
      },
      error: null,
    };
  } catch (error) {
    console.error('Recap generation error:', error);
    return {
      success: false,
      data: null,
      error: formatErrorMessage(error),
    };
  }
}
```

### 7. New UI Components

#### RecapCard Component (`components/RecapCard.tsx`)

**Purpose**: Main recap display with AI insights

**Sections**:
- Year in Review summary (AI-generated)
- Key statistics (games, win rate, KDA)
- Top champions with mastery badges
- Temporal trends chart (monthly win rate)
- Strengths and weaknesses
- Coaching tips
- Roast & Boast
- Highlight matches
- Share button (generates image)

#### ShareableCard Component (`components/ShareableCard.tsx`)

**Purpose**: Generate shareable social media image

**Features**:
- Player name and region
- Key stats (win rate, top champion, total games)
- AI-generated quote
- Rift Rewind branding
- Export as PNG using html-to-image library

#### TemporalChart Component (`components/TemporalChart.tsx`)

**Purpose**: Visualize performance over time

**Chart Types**:
- Monthly win rate line chart
- Champion play rate pie chart
- Role distribution bar chart
- KDA trend over time

**Library**: Recharts or Chart.js

#### CoachingTips Component (`components/CoachingTips.tsx`)

**Purpose**: Display AI-generated coaching recommendations

**Features**:
- Categorized tips (macro, micro, champion pool, mental)
- Expandable details
- Priority indicators
- Action items

## Data Models

### RecapResponse Type

```typescript
export type RecapResponse = {
  success: boolean;
  data: {
    account: {
      riotId: string;
      region: RiotRegion;
      puuid: string;
    };
    analytics: PlayerAnalytics;
    insights: AIInsights;
  } | null;
  error: string | null;
};
```

## Error Handling

### Error Types and Recovery

| Error Type | User Message | Recovery Action |
|------------|--------------|-----------------|
| Invalid Riot ID | "Invalid format. Use: Name#TAG" | Show example |
| Account Not Found | "Account not found. Check ID and region." | Suggest region change |
| No Matches Found | "No ranked matches found in the last year." | Suggest playing ranked |
| Rate Limit (Riot) | "Too many requests. Wait 60 seconds." | Show countdown timer |
| Rate Limit (AWS) | "High demand. Please try again shortly." | Retry after 30s |
| AWS Bedrock Error | "AI analysis unavailable. Showing stats only." | Display analytics without AI |
| Network Error | "Connection failed. Check internet." | Retry button |

## Testing Strategy

### Unit Tests

1. **Match History Service**
   - Test batch fetching logic
   - Test date range filtering
   - Test error handling

2. **Analytics Aggregation**
   - Test champion stats calculation
   - Test temporal trend generation
   - Test streak detection
   - Test edge cases (0 games, 1 game)

3. **AWS Bedrock Integration**
   - Mock Bedrock responses
   - Test prompt generation
   - Test response parsing
   - Test error handling

### Integration Tests

1. **End-to-End Recap Generation**
   - Test full flow from Riot ID to insights
   - Test with various account types (new, veteran, one-trick)
   - Test error propagation

2. **Component Rendering**
   - Test RecapCard with real data
   - Test ShareableCard image generation
   - Test chart rendering with various data shapes

### Manual Testing

- [ ] Generate recap for account with 100+ games
- [ ] Generate recap for account with <10 games
- [ ] Test with different regions
- [ ] Verify AI insights are relevant and accurate
- [ ] Test shareable card generation
- [ ] Verify all charts render correctly
- [ ] Test error states (invalid ID, no matches, API down)
- [ ] Test loading states and transitions

## Performance Considerations

### Optimization Strategies

1. **Parallel API Calls**
   - Fetch matches and masteries concurrently
   - Batch match detail requests (20 at a time)

2. **Caching**
   - Cache champion data in memory
   - Cache DynamoDB results for 24 hours
   - Use SWR for client-side caching

3. **Progressive Loading**
   - Show basic stats immediately
   - Load AI insights asynchronously
   - Stream insights as they generate

4. **Rate Limit Management**
   - Implement request queue
   - Add delays between batch requests
   - Show progress indicator during long operations

### Expected Performance

- **Match History Fetch**: 10-30 seconds (100 matches)
- **AI Insight Generation**: 5-15 seconds
- **Total Recap Generation**: 20-45 seconds
- **Cached Recap Load**: <1 second

## Security Considerations

1. **API Keys**
   - Store Riot API key in environment variables
   - Store AWS credentials in environment variables
   - Never expose keys to client

2. **AWS IAM Permissions**
   - Minimum required permissions for Bedrock
   - Minimum required permissions for DynamoDB
   - Use IAM roles in production (not access keys)

3. **Input Validation**
   - Sanitize Riot ID input
   - Validate region against allowed list
   - Rate limit requests per IP address

4. **Data Privacy**
   - Don't store sensitive player data
   - Implement data retention policy (1 year)
   - Allow users to delete their recaps

## AWS Resource Tagging

All AWS resources should be tagged with:
```
Key: rift-rewind-hackathon
Value: 2025
```

**Resources to Tag**:
- DynamoDB tables
- IAM roles
- CloudWatch log groups
- Lambda functions (if used)

## Deployment

### Environment Variables

```bash
# Riot API
RIOT_API_KEY=your_riot_api_key

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Optional
DYNAMODB_TABLE_NAME=rift-rewind-insights
ENABLE_CACHING=true
```

### AWS Setup

1. **Enable AWS Bedrock**
   - Request access to Claude 3 Sonnet model
   - Note: May require approval (1-2 business days)

2. **Create DynamoDB Table** (Optional)
   ```bash
   aws dynamodb create-table \
     --table-name rift-rewind-insights \
     --attribute-definitions \
       AttributeName=PK,AttributeType=S \
       AttributeName=SK,AttributeType=S \
     --key-schema \
       AttributeName=PK,KeyType=HASH \
       AttributeName=SK,KeyType=RANGE \
     --billing-mode PAY_PER_REQUEST \
     --tags Key=rift-rewind-hackathon,Value=2025
   ```

3. **Create IAM User/Role**
   - Attach policies: `AmazonBedrockFullAccess`, `AmazonDynamoDBFullAccess`
   - Generate access keys

### Deployment Options

1. **Vercel** (Recommended)
   - Deploy Next.js app to Vercel
   - Add environment variables in Vercel dashboard
   - Enable Edge Functions for faster response

2. **AWS Amplify**
   - Deploy to AWS Amplify for full AWS integration
   - Automatic IAM role management
   - Built-in CI/CD

## Future Enhancements

1. **Social Comparison**
   - Compare stats with friends
   - Leaderboards by region
   - Duo compatibility analysis

2. **Historical Tracking**
   - Track progress year-over-year
   - Show improvement trends
   - Milestone celebrations

3. **Advanced AI Features**
   - Personalized champion recommendations
   - Match prediction
   - Draft phase coaching

4. **Shareable Content**
   - Animated recap videos
   - Instagram story templates
   - Twitter card optimization

5. **Multi-Language Support**
   - Translate insights to multiple languages
   - Region-specific coaching styles
