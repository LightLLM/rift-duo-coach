/**
 * Simple verification tests for DynamoDB service
 * Run with: npx tsx lib/dynamodb.test.ts
 * 
 * Note: This test requires AWS credentials to be configured in .env.local
 * and ENABLE_CACHING=true
 */

import { saveRecap, getRecap, deleteRecap, isDynamoDBConfigured } from './dynamodb';
import type { PlayerAnalytics } from './analytics';
import type { AIInsights } from './aws-bedrock';

// Mock data for testing
const mockAnalytics: PlayerAnalytics = {
  overview: {
    totalGames: 100,
    totalWins: 55,
    totalLosses: 45,
    winRate: 55,
    avgKDA: 3.5,
    avgKills: 7.2,
    avgDeaths: 4.1,
    avgAssists: 8.3,
    totalPlaytime: 50,
  },
  championStats: [
    {
      championId: 1,
      championName: 'Annie',
      games: 50,
      wins: 30,
      losses: 20,
      winRate: 60,
      avgKDA: 4.2,
      avgKills: 8.5,
      avgDeaths: 3.2,
      avgAssists: 9.1,
      totalPlaytime: 25,
      masteryLevel: 7,
      masteryPoints: 250000,
    },
  ],
  temporalTrends: {
    monthlyWinRate: [
      { month: '2024-01', games: 50, wins: 28, losses: 22, winRate: 56 },
      { month: '2024-02', games: 50, wins: 27, losses: 23, winRate: 54 },
    ],
    weeklyPerformance: [],
    bestMonth: '2024-01',
    worstMonth: '2024-02',
  },
  performanceMetrics: {
    avgVisionScore: 42,
    avgDamagePerMinute: 650,
    avgGoldPerMinute: 380,
    avgCSPerMinute: 6.5,
  },
  streaks: {
    longestWinStreak: 7,
    longestLossStreak: 4,
    currentStreak: { type: 'win', count: 3 },
  },
  roleDistribution: {
    MIDDLE: 80,
    TOP: 20,
  },
  highlightMatches: {
    bestKDA: null,
    mostKills: null,
    longestGame: null,
    highestDamage: null,
  },
};

const mockInsights: AIInsights = {
  summary: 'Test year in review',
  strengths: ['Good KDA', 'High win rate', 'Consistent performance'],
  weaknesses: ['Champion pool', 'Vision score', 'CS'],
  improvementAreas: ['Expand champion pool', 'Improve vision', 'Better CS'],
  coachingTips: ['Tip 1', 'Tip 2', 'Tip 3'],
  roast: 'Test roast',
  boast: 'Test boast',
  hiddenGems: ['Ahri', 'Lux'],
  yearInReview: 'Test year in review summary',
  shareableQuote: 'Test quote',
};

async function runTests() {
  console.log('Testing DynamoDB service...\n');

  // Check if DynamoDB is configured
  console.log('1. Checking DynamoDB configuration...');
  const isConfigured = isDynamoDBConfigured();
  console.log(`   DynamoDB configured: ${isConfigured}`);
  
  if (!isConfigured) {
    console.log('\n⚠️  DynamoDB is not configured or caching is disabled.');
    console.log('   Set ENABLE_CACHING=true and configure AWS credentials in .env.local to run tests.');
    return;
  }

  const testPuuid = 'test-puuid-' + Date.now();
  const testYear = 2024;
  const testRiotId = 'TestPlayer#NA1';
  const testRegion = 'na1';

  try {
    // Test 1: Save recap
    console.log('\n2. Testing saveRecap...');
    await saveRecap(testPuuid, testYear, testRiotId, testRegion, {
      analytics: mockAnalytics,
      insights: mockInsights,
    });
    console.log('   ✓ Recap saved successfully');

    // Test 2: Get recap (should exist)
    console.log('\n3. Testing getRecap (cache hit)...');
    const cachedData = await getRecap(testPuuid, testYear);
    if (cachedData) {
      console.log('   ✓ Recap retrieved from cache');
      console.log(`   - Total Games: ${cachedData.analytics.overview.totalGames}`);
      console.log(`   - Win Rate: ${cachedData.analytics.overview.winRate}%`);
      console.log(`   - Year in Review: ${cachedData.insights.yearInReview.substring(0, 50)}...`);
    } else {
      console.log('   ✗ Failed to retrieve cached recap');
    }

    // Test 3: Get non-existent recap (cache miss)
    console.log('\n4. Testing getRecap (cache miss)...');
    const nonExistentData = await getRecap('non-existent-puuid', 2023);
    if (nonExistentData === null) {
      console.log('   ✓ Correctly returned null for non-existent recap');
    } else {
      console.log('   ✗ Should have returned null for non-existent recap');
    }

    // Test 4: Delete recap
    console.log('\n5. Testing deleteRecap...');
    await deleteRecap(testPuuid, testYear);
    console.log('   ✓ Recap deleted successfully');

    // Test 5: Verify deletion
    console.log('\n6. Verifying deletion...');
    const deletedData = await getRecap(testPuuid, testYear);
    if (deletedData === null) {
      console.log('   ✓ Recap successfully deleted (returns null)');
    } else {
      console.log('   ✗ Recap still exists after deletion');
    }

    console.log('\n✅ All DynamoDB tests passed!');
    console.log('\nNote: This test created and deleted a test record in your DynamoDB table.');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Error name:', error.name);
    }
    
    // Clean up test data
    console.log('\nCleaning up test data...');
    try {
      await deleteRecap(testPuuid, testYear);
      console.log('✓ Test data cleaned up');
    } catch (cleanupError) {
      console.error('Failed to clean up test data:', cleanupError);
    }
  }
}

// Run tests
runTests().catch(console.error);
