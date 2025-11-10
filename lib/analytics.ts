/**
 * Analytics Service
 * 
 * Aggregates and analyzes match history data to generate player statistics,
 * trends, and insights.
 */

import type { MatchDetails } from './match-history';
import type { EnrichedMastery } from './types';

/**
 * Champion-specific statistics
 */
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
  totalPlaytime: number; // in hours
  masteryLevel?: number;
  masteryPoints?: number;
}

/**
 * Monthly performance data
 */
export interface MonthlyData {
  month: string; // Format: "2024-01"
  games: number;
  wins: number;
  losses: number;
  winRate: number;
}

/**
 * Weekly performance data
 */
export interface WeeklyData {
  week: string; // Format: "2024-W01"
  games: number;
  wins: number;
  losses: number;
  winRate: number;
}

/**
 * Complete player analytics
 */
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
    bestKDA: MatchDetails | null;
    mostKills: MatchDetails | null;
    longestGame: MatchDetails | null;
    highestDamage: MatchDetails | null;
  };
}

/**
 * Calculate KDA ratio
 */
function calculateKDA(kills: number, deaths: number, assists: number): number {
  if (deaths === 0) {
    return kills + assists;
  }
  return (kills + assists) / deaths;
}

/**
 * Get month string from timestamp
 */
function getMonthString(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get week string from timestamp (ISO week)
 */
function getWeekString(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  
  // Calculate ISO week number
  const firstDayOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Aggregate match data into player analytics
 * 
 * @param matches - Array of match details
 * @param masteries - Array of enriched champion masteries (optional)
 * @returns Complete player analytics
 */
export function aggregateMatchData(
  matches: MatchDetails[],
  masteries: EnrichedMastery[] = []
): PlayerAnalytics {
  if (matches.length === 0) {
    // Return empty analytics for no matches
    return {
      overview: {
        totalGames: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        avgKDA: 0,
        avgKills: 0,
        avgDeaths: 0,
        avgAssists: 0,
        totalPlaytime: 0,
      },
      championStats: [],
      temporalTrends: {
        monthlyWinRate: [],
        weeklyPerformance: [],
        bestMonth: '',
        worstMonth: '',
      },
      performanceMetrics: {
        avgVisionScore: 0,
        avgDamagePerMinute: 0,
        avgGoldPerMinute: 0,
        avgCSPerMinute: 0,
      },
      streaks: {
        longestWinStreak: 0,
        longestLossStreak: 0,
        currentStreak: { type: 'win', count: 0 },
      },
      roleDistribution: {},
      highlightMatches: {
        bestKDA: null,
        mostKills: null,
        longestGame: null,
        highestDamage: null,
      },
    };
  }

  // Create mastery lookup map
  const masteryMap = new Map<number, EnrichedMastery>();
  masteries.forEach(mastery => {
    masteryMap.set(mastery.championId, mastery);
  });

  // Calculate overview statistics
  const totalGames = matches.length;
  const totalWins = matches.filter(m => m.participant.win).length;
  const totalLosses = totalGames - totalWins;
  const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
  
  const totalKills = matches.reduce((sum, m) => sum + m.participant.kills, 0);
  const totalDeaths = matches.reduce((sum, m) => sum + m.participant.deaths, 0);
  const totalAssists = matches.reduce((sum, m) => sum + m.participant.assists, 0);
  
  const avgKills = totalKills / totalGames;
  const avgDeaths = totalDeaths / totalGames;
  const avgAssists = totalAssists / totalGames;
  const avgKDA = calculateKDA(totalKills, totalDeaths, totalAssists);
  
  const totalPlaytime = matches.reduce((sum, m) => sum + m.gameDuration, 0) / 3600; // Convert to hours

  // Calculate champion-specific statistics
  const championMap = new Map<number, {
    championId: number;
    championName: string;
    games: number;
    wins: number;
    kills: number;
    deaths: number;
    assists: number;
    playtime: number;
  }>();

  matches.forEach(match => {
    const { championId, championName, kills, deaths, assists, win } = match.participant;
    
    if (!championMap.has(championId)) {
      championMap.set(championId, {
        championId,
        championName,
        games: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        playtime: 0,
      });
    }
    
    const stats = championMap.get(championId)!;
    stats.games++;
    if (win) stats.wins++;
    stats.kills += kills;
    stats.deaths += deaths;
    stats.assists += assists;
    stats.playtime += match.gameDuration;
  });

  const championStats: ChampionStat[] = Array.from(championMap.values())
    .map(stats => {
      const mastery = masteryMap.get(stats.championId);
      return {
        championId: stats.championId,
        championName: stats.championName,
        games: stats.games,
        wins: stats.wins,
        losses: stats.games - stats.wins,
        winRate: (stats.wins / stats.games) * 100,
        avgKDA: calculateKDA(stats.kills, stats.deaths, stats.assists),
        avgKills: stats.kills / stats.games,
        avgDeaths: stats.deaths / stats.games,
        avgAssists: stats.assists / stats.games,
        totalPlaytime: stats.playtime / 3600, // Convert to hours
        masteryLevel: mastery?.championLevel,
        masteryPoints: mastery?.championPoints,
      };
    })
    .sort((a, b) => b.games - a.games); // Sort by games played

  // Calculate performance metrics
  const totalVisionScore = matches.reduce((sum, m) => sum + m.participant.visionScore, 0);
  const totalDamage = matches.reduce((sum, m) => sum + m.participant.totalDamageDealt, 0);
  const totalGold = matches.reduce((sum, m) => sum + m.participant.goldEarned, 0);
  const totalCS = matches.reduce((sum, m) => sum + m.participant.totalMinionsKilled, 0);
  const totalGameTimeMinutes = matches.reduce((sum, m) => sum + m.gameDuration, 0) / 60;

  const performanceMetrics = {
    avgVisionScore: totalVisionScore / totalGames,
    avgDamagePerMinute: totalDamage / totalGameTimeMinutes,
    avgGoldPerMinute: totalGold / totalGameTimeMinutes,
    avgCSPerMinute: totalCS / totalGameTimeMinutes,
  };

  // Identify highlight matches
  let bestKDA: MatchDetails | null = null;
  let bestKDAValue = -1;
  let mostKills: MatchDetails | null = null;
  let mostKillsValue = -1;
  let longestGame: MatchDetails | null = null;
  let longestGameDuration = -1;
  let highestDamage: MatchDetails | null = null;
  let highestDamageValue = -1;

  matches.forEach(match => {
    const { kills, deaths, assists, totalDamageDealt } = match.participant;
    const kda = calculateKDA(kills, deaths, assists);
    
    if (kda > bestKDAValue) {
      bestKDAValue = kda;
      bestKDA = match;
    }
    
    if (kills > mostKillsValue) {
      mostKillsValue = kills;
      mostKills = match;
    }
    
    if (match.gameDuration > longestGameDuration) {
      longestGameDuration = match.gameDuration;
      longestGame = match;
    }
    
    if (totalDamageDealt > highestDamageValue) {
      highestDamageValue = totalDamageDealt;
      highestDamage = match;
    }
  });

  const highlightMatches = {
    bestKDA,
    mostKills,
    longestGame,
    highestDamage,
  };

  // Calculate temporal trends (will be implemented in sub-task 3.2)
  const temporalTrends = calculateTemporalTrends(matches);

  // Calculate streaks and role distribution (will be implemented in sub-task 3.3)
  const streaks = calculateStreaks(matches);
  const roleDistribution = calculateRoleDistribution(matches);

  return {
    overview: {
      totalGames,
      totalWins,
      totalLosses,
      winRate,
      avgKDA,
      avgKills,
      avgDeaths,
      avgAssists,
      totalPlaytime,
    },
    championStats,
    temporalTrends,
    performanceMetrics,
    streaks,
    roleDistribution,
    highlightMatches,
  };
}

/**
 * Calculate temporal trends (monthly and weekly performance)
 * 
 * @param matches - Array of match details
 * @returns Temporal trend data
 */
function calculateTemporalTrends(matches: MatchDetails[]): PlayerAnalytics['temporalTrends'] {
  if (matches.length === 0) {
    return {
      monthlyWinRate: [],
      weeklyPerformance: [],
      bestMonth: '',
      worstMonth: '',
    };
  }

  // Group matches by month
  const monthlyMap = new Map<string, { games: number; wins: number }>();
  
  matches.forEach(match => {
    const month = getMonthString(match.gameCreation);
    
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { games: 0, wins: 0 });
    }
    
    const stats = monthlyMap.get(month)!;
    stats.games++;
    if (match.participant.win) stats.wins++;
  });

  // Convert to array and calculate win rates
  const monthlyWinRate: MonthlyData[] = Array.from(monthlyMap.entries())
    .map(([month, stats]) => ({
      month,
      games: stats.games,
      wins: stats.wins,
      losses: stats.games - stats.wins,
      winRate: (stats.wins / stats.games) * 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Find best and worst months (with at least 5 games)
  const significantMonths = monthlyWinRate.filter(m => m.games >= 5);
  let bestMonth = '';
  let worstMonth = '';
  
  if (significantMonths.length > 0) {
    const sortedByWinRate = [...significantMonths].sort((a, b) => b.winRate - a.winRate);
    bestMonth = sortedByWinRate[0].month;
    worstMonth = sortedByWinRate[sortedByWinRate.length - 1].month;
  }

  // Group matches by week
  const weeklyMap = new Map<string, { games: number; wins: number }>();
  
  matches.forEach(match => {
    const week = getWeekString(match.gameCreation);
    
    if (!weeklyMap.has(week)) {
      weeklyMap.set(week, { games: 0, wins: 0 });
    }
    
    const stats = weeklyMap.get(week)!;
    stats.games++;
    if (match.participant.win) stats.wins++;
  });

  // Convert to array and calculate win rates
  const weeklyPerformance: WeeklyData[] = Array.from(weeklyMap.entries())
    .map(([week, stats]) => ({
      week,
      games: stats.games,
      wins: stats.wins,
      losses: stats.games - stats.wins,
      winRate: (stats.wins / stats.games) * 100,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  return {
    monthlyWinRate,
    weeklyPerformance,
    bestMonth,
    worstMonth,
  };
}

/**
 * Calculate win/loss streaks
 * 
 * @param matches - Array of match details (should be sorted by time)
 * @returns Streak statistics
 */
function calculateStreaks(matches: MatchDetails[]): PlayerAnalytics['streaks'] {
  if (matches.length === 0) {
    return {
      longestWinStreak: 0,
      longestLossStreak: 0,
      currentStreak: { type: 'win', count: 0 },
    };
  }

  // Sort matches by game creation time (oldest first)
  const sortedMatches = [...matches].sort((a, b) => a.gameCreation - b.gameCreation);

  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  sortedMatches.forEach(match => {
    if (match.participant.win) {
      currentWinStreak++;
      currentLossStreak = 0;
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    } else {
      currentLossStreak++;
      currentWinStreak = 0;
      longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
    }
  });

  // Current streak is based on the most recent match
  const currentStreak = currentWinStreak > 0
    ? { type: 'win' as const, count: currentWinStreak }
    : { type: 'loss' as const, count: currentLossStreak };

  return {
    longestWinStreak,
    longestLossStreak,
    currentStreak,
  };
}

/**
 * Calculate role distribution across matches
 * 
 * @param matches - Array of match details
 * @returns Role distribution map (role -> count)
 */
function calculateRoleDistribution(matches: MatchDetails[]): Record<string, number> {
  const roleMap: Record<string, number> = {};

  matches.forEach(match => {
    const role = match.participant.role || 'UNKNOWN';
    roleMap[role] = (roleMap[role] || 0) + 1;
  });

  return roleMap;
}
