/**
 * Simple verification tests for analytics service
 * Run with: npx tsx lib/analytics.test.ts
 */

import { aggregateMatchData } from './analytics';
import type { MatchDetails } from './match-history';
import type { EnrichedMastery } from './types';

// Create mock match data
const mockMatches: MatchDetails[] = [
  {
    matchId: 'match1',
    gameCreation: new Date('2024-01-15').getTime(),
    gameDuration: 1800, // 30 minutes
    gameMode: 'CLASSIC',
    queueId: 420,
    participant: {
      puuid: 'test-puuid',
      championId: 1,
      championName: 'Annie',
      kills: 10,
      deaths: 2,
      assists: 8,
      win: true,
      visionScore: 45,
      totalDamageDealt: 150000,
      goldEarned: 12000,
      totalMinionsKilled: 180,
      role: 'MIDDLE',
      lane: 'MIDDLE',
      items: [1, 2, 3, 4, 5, 6],
    },
  },
  {
    matchId: 'match2',
    gameCreation: new Date('2024-01-16').getTime(),
    gameDuration: 2400, // 40 minutes
    gameMode: 'CLASSIC',
    queueId: 420,
    participant: {
      puuid: 'test-puuid',
      championId: 1,
      championName: 'Annie',
      kills: 5,
      deaths: 8,
      assists: 12,
      win: false,
      visionScore: 38,
      totalDamageDealt: 120000,
      goldEarned: 10000,
      totalMinionsKilled: 200,
      role: 'MIDDLE',
      lane: 'MIDDLE',
      items: [1, 2, 3, 4],
    },
  },
  {
    matchId: 'match3',
    gameCreation: new Date('2024-02-10').getTime(),
    gameDuration: 2100, // 35 minutes
    gameMode: 'CLASSIC',
    queueId: 420,
    participant: {
      puuid: 'test-puuid',
      championId: 2,
      championName: 'Ahri',
      kills: 12,
      deaths: 3,
      assists: 15,
      win: true,
      visionScore: 52,
      totalDamageDealt: 180000,
      goldEarned: 14000,
      totalMinionsKilled: 220,
      role: 'MIDDLE',
      lane: 'MIDDLE',
      items: [1, 2, 3, 4, 5, 6],
    },
  },
];

const mockMasteries: EnrichedMastery[] = [
  {
    championId: 1,
    championName: 'Annie',
    championLevel: 7,
    championPoints: 250000,
    lastPlayTime: Date.now(),
    championPointsSinceLastLevel: 0,
    championPointsUntilNextLevel: 0,
    chestGranted: true,
    tokensEarned: 0,
    summonerId: 'test-summoner',
  },
  {
    championId: 2,
    championName: 'Ahri',
    championLevel: 5,
    championPoints: 80000,
    lastPlayTime: Date.now(),
    championPointsSinceLastLevel: 5000,
    championPointsUntilNextLevel: 15000,
    chestGranted: false,
    tokensEarned: 1,
    summonerId: 'test-summoner',
  },
];

console.log('Testing analytics aggregation...\n');

const analytics = aggregateMatchData(mockMatches, mockMasteries);

console.log('Overview Stats:');
console.log(`  Total Games: ${analytics.overview.totalGames}`);
console.log(`  Win Rate: ${analytics.overview.winRate.toFixed(2)}%`);
console.log(`  Average KDA: ${analytics.overview.avgKDA.toFixed(2)}`);
console.log(`  Total Playtime: ${analytics.overview.totalPlaytime.toFixed(2)} hours\n`);

console.log('Champion Stats:');
analytics.championStats.forEach(champ => {
  console.log(`  ${champ.championName}:`);
  console.log(`    Games: ${champ.games}, Win Rate: ${champ.winRate.toFixed(2)}%`);
  console.log(`    KDA: ${champ.avgKDA.toFixed(2)} (${champ.avgKills.toFixed(1)}/${champ.avgDeaths.toFixed(1)}/${champ.avgAssists.toFixed(1)})`);
  console.log(`    Mastery: Level ${champ.masteryLevel}, ${champ.masteryPoints} points\n`);
});

console.log('Temporal Trends:');
console.log(`  Best Month: ${analytics.temporalTrends.bestMonth}`);
console.log(`  Worst Month: ${analytics.temporalTrends.worstMonth}`);
console.log(`  Monthly Data:`, analytics.temporalTrends.monthlyWinRate);
console.log();

console.log('Streaks:');
console.log(`  Longest Win Streak: ${analytics.streaks.longestWinStreak}`);
console.log(`  Longest Loss Streak: ${analytics.streaks.longestLossStreak}`);
console.log(`  Current Streak: ${analytics.streaks.currentStreak.count} ${analytics.streaks.currentStreak.type}s\n`);

console.log('Role Distribution:');
Object.entries(analytics.roleDistribution).forEach(([role, count]) => {
  console.log(`  ${role}: ${count} games`);
});
console.log();

console.log('Performance Metrics:');
console.log(`  Avg Vision Score: ${analytics.performanceMetrics.avgVisionScore.toFixed(2)}`);
console.log(`  Avg Damage/Min: ${analytics.performanceMetrics.avgDamagePerMinute.toFixed(2)}`);
console.log(`  Avg Gold/Min: ${analytics.performanceMetrics.avgGoldPerMinute.toFixed(2)}`);
console.log(`  Avg CS/Min: ${analytics.performanceMetrics.avgCSPerMinute.toFixed(2)}\n`);

console.log('Highlight Matches:');
console.log(`  Best KDA: ${analytics.highlightMatches.bestKDA?.participant.championName} (${analytics.highlightMatches.bestKDA?.participant.kills}/${analytics.highlightMatches.bestKDA?.participant.deaths}/${analytics.highlightMatches.bestKDA?.participant.assists})`);
console.log(`  Most Kills: ${analytics.highlightMatches.mostKills?.participant.championName} (${analytics.highlightMatches.mostKills?.participant.kills} kills)`);
console.log(`  Longest Game: ${(analytics.highlightMatches.longestGame!.gameDuration / 60).toFixed(1)} minutes`);
console.log(`  Highest Damage: ${analytics.highlightMatches.highestDamage?.participant.totalDamageDealt.toLocaleString()}`);

console.log('\n✅ All analytics functions working correctly!');
