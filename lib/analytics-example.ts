/**
 * Example usage of the analytics service
 * 
 * This demonstrates how to integrate the analytics service with
 * the match history and champion mastery APIs.
 */

import { getFullYearMatches } from './match-history';
import { getAllChampionMasteriesByPuuid, enrichMasteries } from './riot-api';
import { aggregateMatchData } from './analytics';
import type { RiotRegion } from './riot-api';

/**
 * Generate complete player analytics
 * 
 * @param puuid - Player's PUUID
 * @param region - Game region
 * @returns Complete analytics data
 */
export async function generatePlayerAnalytics(puuid: string, region: RiotRegion) {
  try {
    console.log('Fetching match history...');
    const matches = await getFullYearMatches(puuid, region);
    
    console.log('Fetching champion masteries...');
    const masteries = await getAllChampionMasteriesByPuuid(puuid, region);
    const enrichedMasteries = await enrichMasteries(masteries);
    
    console.log('Aggregating analytics...');
    const analytics = aggregateMatchData(matches, enrichedMasteries);
    
    return {
      success: true,
      data: analytics,
      error: null,
    };
  } catch (error) {
    console.error('Error generating analytics:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Example: Get analytics summary for display
 */
export function getAnalyticsSummary(analytics: ReturnType<typeof aggregateMatchData>) {
  const { overview, championStats, streaks, temporalTrends } = analytics;
  
  return {
    // Key stats for display
    totalGames: overview.totalGames,
    winRate: `${overview.winRate.toFixed(1)}%`,
    kda: overview.avgKDA.toFixed(2),
    playtime: `${overview.totalPlaytime.toFixed(1)} hours`,
    
    // Top 3 champions
    topChampions: championStats.slice(0, 3).map(champ => ({
      name: champ.championName,
      games: champ.games,
      winRate: `${champ.winRate.toFixed(1)}%`,
      kda: champ.avgKDA.toFixed(2),
      masteryLevel: champ.masteryLevel,
    })),
    
    // Streak info
    bestStreak: `${streaks.longestWinStreak} wins`,
    worstStreak: `${streaks.longestLossStreak} losses`,
    currentStreak: `${streaks.currentStreak.count} ${streaks.currentStreak.type}${streaks.currentStreak.count !== 1 ? 's' : ''}`,
    
    // Temporal info
    bestMonth: temporalTrends.bestMonth,
    worstMonth: temporalTrends.worstMonth,
  };
}
