# Analytics Service Documentation

## Overview

The analytics service (`lib/analytics.ts`) provides comprehensive data aggregation and analysis for League of Legends match history. It processes raw match data and champion mastery information to generate detailed player statistics, trends, and insights.

## Features Implemented

### ✅ Task 3.1: Core Analytics Calculations

- **`aggregateMatchData()`** - Main function that processes raw match data
- **Overview Statistics**:
  - Total games, wins, losses
  - Win rate percentage
  - Average KDA (Kills/Deaths/Assists)
  - Total playtime in hours
  
- **Champion-Specific Statistics**:
  - Games played per champion
  - Win rates per champion
  - Average KDA per champion
  - Integration with mastery data (level and points)
  - Sorted by games played
  
- **Highlight Matches**:
  - Best KDA match
  - Most kills in a single game
  - Longest game duration
  - Highest damage dealt

### ✅ Task 3.2: Temporal Trend Analysis

- **Monthly Win Rate Trends**:
  - Groups matches by month
  - Calculates win rate for each month
  - Identifies best and worst performing months (minimum 5 games)
  
- **Weekly Performance Metrics**:
  - Groups matches by ISO week
  - Tracks weekly win rates
  - Provides time-series data for charts

### ✅ Task 3.3: Streak Detection and Role Analysis

- **Streak Detection**:
  - Longest win streak
  - Longest loss streak
  - Current streak (win or loss)
  - Chronologically sorted analysis
  
- **Role Distribution**:
  - Counts games played per role
  - Supports all League of Legends roles
  
- **Performance Metrics**:
  - Average vision score
  - Average damage per minute
  - Average gold per minute
  - Average CS (creep score) per minute

## Data Structures

### PlayerAnalytics

Complete analytics object containing:
- `overview` - Overall statistics
- `championStats` - Per-champion breakdown
- `temporalTrends` - Monthly and weekly data
- `performanceMetrics` - Vision, damage, gold, CS metrics
- `streaks` - Win/loss streak information
- `roleDistribution` - Games per role
- `highlightMatches` - Best performance matches

### ChampionStat

Per-champion statistics including:
- Games, wins, losses, win rate
- Average KDA and individual K/D/A
- Total playtime
- Mastery level and points (if available)

## Usage Example

```typescript
import { aggregateMatchData } from './analytics';
import { getFullYearMatches } from './match-history';
import { getAllChampionMasteriesByPuuid, enrichMasteries } from './riot-api';

// Fetch data
const matches = await getFullYearMatches(puuid, region);
const masteries = await getAllChampionMasteriesByPuuid(puuid, region);
const enrichedMasteries = await enrichMasteries(masteries);

// Generate analytics
const analytics = aggregateMatchData(matches, enrichedMasteries);

// Access results
console.log(`Win Rate: ${analytics.overview.winRate.toFixed(1)}%`);
console.log(`Top Champion: ${analytics.championStats[0].championName}`);
console.log(`Best Month: ${analytics.temporalTrends.bestMonth}`);
```

## Integration Points

### With Match History Service
- Consumes `MatchDetails[]` from `getFullYearMatches()`
- Processes participant data for statistics

### With Champion Mastery API
- Accepts `EnrichedMastery[]` for champion context
- Enriches champion stats with mastery levels

### With AWS Bedrock (Future)
- `PlayerAnalytics` object will be passed to AI for insights
- Structured data enables intelligent coaching recommendations

## Testing

Run the verification script:
```bash
npx tsx lib/analytics.test.ts
```

This validates:
- Overview calculations
- Champion statistics
- Temporal trends
- Streak detection
- Role distribution
- Performance metrics
- Highlight match identification

## Requirements Satisfied

- ✅ Requirement 2.1: Display champion data sorted by mastery points
- ✅ Requirement 2.2: Display champion name, mastery level, and points
- ✅ Requirement 5.1: Identify improvement opportunities and mastered champions
- ✅ Requirement 5.2: Calculate temporal trends
- ✅ Requirement 5.4: Calculate total mastery points and level distribution
- ✅ Requirement 5.5: Detect streaks and analyze performance

## Next Steps

The analytics service is ready for integration with:
1. **Task 4**: AWS Bedrock for AI-powered insights
2. **Task 5**: Server action updates for full data pipeline
3. **Task 6**: UI components for data visualization
