/**
 * Simple verification test for AWS Bedrock integration
 * Run with: npx tsx lib/aws-bedrock.test.ts
 * 
 * Note: This test will use fallback insights if AWS credentials are not configured
 */

import { generateInsights, generateCoachingTips } from './aws-bedrock';
import type { PlayerAnalytics } from './analytics';

// Create mock analytics data
const mockAnalytics: PlayerAnalytics = {
  overview: {
    totalGames: 150,
    totalWins: 82,
    totalLosses: 68,
    winRate: 54.67,
    avgKDA: 3.45,
    avgKills: 8.2,
    avgDeaths: 5.1,
    avgAssists: 9.4,
    totalPlaytime: 75.5,
  },
  championStats: [
    {
      championId: 1,
      championName: 'Annie',
      games: 45,
      wins: 28,
      losses: 17,
      winRate: 62.22,
      avgKDA: 4.2,
      avgKills: 9.1,
      avgDeaths: 4.2,
      avgAssists: 8.5,
      totalPlaytime: 22.5,
      masteryLevel: 7,
      masteryPoints: 250000,
    },
    {
      championId: 2,
      championName: 'Ahri',
      games: 35,
      wins: 19,
      losses: 16,
      winRate: 54.29,
      avgKDA: 3.8,
      avgKills: 7.8,
      avgDeaths: 5.2,
      avgAssists: 11.9,
      totalPlaytime: 17.5,
      masteryLevel: 5,
      masteryPoints: 80000,
    },
    {
      championId: 3,
      championName: 'Lux',
      games: 28,
      wins: 15,
      losses: 13,
      winRate: 53.57,
      avgKDA: 3.1,
      avgKills: 6.5,
      avgDeaths: 5.8,
      avgAssists: 11.5,
      totalPlaytime: 14.0,
      masteryLevel: 6,
      masteryPoints: 120000,
    },
  ],
  temporalTrends: {
    monthlyWinRate: [
      { month: '2024-01', games: 45, wins: 25, losses: 20, winRate: 55.56 },
      { month: '2024-02', games: 52, wins: 31, losses: 21, winRate: 59.62 },
      { month: '2024-03', games: 53, wins: 26, losses: 27, winRate: 49.06 },
    ],
    weeklyPerformance: [],
    bestMonth: '2024-02',
    worstMonth: '2024-03',
  },
  performanceMetrics: {
    avgVisionScore: 42.5,
    avgDamagePerMinute: 650.2,
    avgGoldPerMinute: 385.7,
    avgCSPerMinute: 6.8,
  },
  streaks: {
    longestWinStreak: 8,
    longestLossStreak: 5,
    currentStreak: { type: 'win', count: 3 },
  },
  roleDistribution: {
    MIDDLE: 120,
    SUPPORT: 20,
    BOTTOM: 10,
  },
  highlightMatches: {
    bestKDA: null,
    mostKills: null,
    longestGame: null,
    highestDamage: null,
  },
};

async function testBedrockIntegration() {
  console.log('Testing AWS Bedrock Integration...\n');
  console.log('Mock Analytics Data:');
  console.log(`  Total Games: ${mockAnalytics.overview.totalGames}`);
  console.log(`  Win Rate: ${mockAnalytics.overview.winRate.toFixed(2)}%`);
  console.log(`  Average KDA: ${mockAnalytics.overview.avgKDA.toFixed(2)}`);
  console.log(`  Top Champion: ${mockAnalytics.championStats[0].championName}\n`);

  try {
    console.log('Generating AI insights...');
    const insights = await generateInsights(mockAnalytics);

    console.log('\n✅ Insights Generated Successfully!\n');
    console.log('Year in Review:');
    console.log(`  ${insights.yearInReview}\n`);

    console.log('Strengths:');
    insights.strengths.forEach((strength, i) => {
      console.log(`  ${i + 1}. ${strength}`);
    });
    console.log();

    console.log('Weaknesses:');
    insights.weaknesses.forEach((weakness, i) => {
      console.log(`  ${i + 1}. ${weakness}`);
    });
    console.log();

    console.log('Improvement Areas:');
    insights.improvementAreas.forEach((area, i) => {
      console.log(`  ${i + 1}. ${area}`);
    });
    console.log();

    console.log('Coaching Tips:');
    insights.coachingTips.forEach((tip, i) => {
      console.log(`  ${i + 1}. ${tip}`);
    });
    console.log();

    console.log('Roast:');
    console.log(`  "${insights.roast}"\n`);

    console.log('Boast:');
    console.log(`  "${insights.boast}"\n`);

    if (insights.hiddenGems.length > 0) {
      console.log('Hidden Gems:');
      insights.hiddenGems.forEach(champ => {
        console.log(`  - ${champ}`);
      });
      console.log();
    }

    console.log('Shareable Quote:');
    console.log(`  "${insights.shareableQuote}"\n`);

    // Test coaching tips generation
    console.log('Testing focused coaching tips...');
    const macroTips = await generateCoachingTips(mockAnalytics, 'macro');
    console.log('\nMacro Tips:');
    macroTips.forEach((tip, i) => {
      console.log(`  ${i + 1}. ${tip}`);
    });

    console.log('\n✅ All Bedrock integration tests passed!');
    console.log('\nNote: If AWS credentials are not configured, fallback insights were used.');
    console.log('To test with real AWS Bedrock, set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local');

  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    process.exit(1);
  }
}

// Run the test
testBedrockIntegration();
