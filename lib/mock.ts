import type { Match, PlayerSeason } from './types';

// Mock dataset
export const MOCK_SEASON: PlayerSeason = {
  puuid: 'demo-puuid-123',
  summonerName: 'DemoPlayer',
  matches: [
    {
      matchId: 'match-1',
      gameEndTimestamp: Date.now() - 86400000 * 2,
      champion: 'Jinx',
      role: 'ADC',
      lane: 'BOTTOM',
      win: true,
      kills: 12,
      deaths: 3,
      assists: 8,
      visionScore: 45,
      dpm: 650,
      goldPerMin: 420,
      laneGoldDiff15: 500,
    },
    {
      matchId: 'match-2',
      gameEndTimestamp: Date.now() - 86400000 * 1,
      champion: 'Yasuo',
      role: 'MIDDLE',
      lane: 'MIDDLE',
      win: false,
      kills: 8,
      deaths: 7,
      assists: 4,
      visionScore: 32,
      dpm: 580,
      goldPerMin: 380,
      laneGoldDiff15: -200,
    },
    {
      matchId: 'match-3',
      gameEndTimestamp: Date.now() - 86400000 * 3,
      champion: 'Thresh',
      role: 'SUPPORT',
      lane: 'BOTTOM',
      win: true,
      kills: 2,
      deaths: 4,
      assists: 18,
      visionScore: 85,
      dpm: 280,
      goldPerMin: 250,
      laneGoldDiff15: 300,
    },
    {
      matchId: 'match-4',
      gameEndTimestamp: Date.now() - 86400000 * 4,
      champion: 'Jinx',
      role: 'ADC',
      lane: 'BOTTOM',
      win: true,
      kills: 15,
      deaths: 2,
      assists: 6,
      visionScore: 38,
      dpm: 720,
      goldPerMin: 450,
      laneGoldDiff15: 800,
    },
    {
      matchId: 'match-5',
      gameEndTimestamp: Date.now() - 86400000 * 5,
      champion: 'Zed',
      role: 'MIDDLE',
      lane: 'MIDDLE',
      win: false,
      kills: 6,
      deaths: 9,
      assists: 2,
      visionScore: 28,
      dpm: 520,
      goldPerMin: 350,
      laneGoldDiff15: -400,
    },
    {
      matchId: 'match-6',
      gameEndTimestamp: Date.now() - 86400000 * 6,
      champion: 'Jinx',
      role: 'ADC',
      lane: 'BOTTOM',
      win: true,
      kills: 10,
      deaths: 4,
      assists: 7,
      visionScore: 42,
      dpm: 680,
      goldPerMin: 430,
      laneGoldDiff15: 600,
    },
    {
      matchId: 'match-7',
      gameEndTimestamp: Date.now() - 86400000 * 7,
      champion: 'Ashe',
      role: 'ADC',
      lane: 'BOTTOM',
      win: true,
      kills: 7,
      deaths: 3,
      assists: 12,
      visionScore: 55,
      dpm: 590,
      goldPerMin: 400,
      laneGoldDiff15: 400,
    },
    {
      matchId: 'match-8',
      gameEndTimestamp: Date.now() - 86400000 * 8,
      champion: 'Yasuo',
      role: 'MIDDLE',
      lane: 'MIDDLE',
      win: true,
      kills: 11,
      deaths: 5,
      assists: 6,
      visionScore: 35,
      dpm: 640,
      goldPerMin: 410,
      laneGoldDiff15: 200,
    },
    {
      matchId: 'match-9',
      gameEndTimestamp: Date.now() - 86400000 * 9,
      champion: 'Thresh',
      role: 'SUPPORT',
      lane: 'BOTTOM',
      win: false,
      kills: 1,
      deaths: 6,
      assists: 14,
      visionScore: 78,
      dpm: 240,
      goldPerMin: 220,
      laneGoldDiff15: -300,
    },
    {
      matchId: 'match-10',
      gameEndTimestamp: Date.now() - 86400000 * 10,
      champion: 'Jinx',
      role: 'ADC',
      lane: 'BOTTOM',
      win: true,
      kills: 13,
      deaths: 1,
      assists: 9,
      visionScore: 40,
      dpm: 710,
      goldPerMin: 460,
      laneGoldDiff15: 900,
    },
  ],
};

// Helper functions
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function kda(kills: number, deaths: number, assists: number): number {
  if (deaths === 0) return kills + assists;
  return (kills + assists) / deaths;
}

export function calcConsistencyIndex(matches: Match[]): number {
  if (matches.length === 0) return 0;
  const kdas = matches.map((m) => kda(m.kills, m.deaths, m.assists));
  const avg = mean(kdas);
  const variance = mean(kdas.map((k) => Math.pow(k - avg, 2)));
  const stdDev = Math.sqrt(variance);
  // Consistency: higher = more consistent (lower std dev relative to mean)
  return avg > 0 ? Math.max(0, 100 - (stdDev / avg) * 100) : 0;
}

export function summarizeByChampion(matches: Match[]) {
  const byChamp: Record<string, Match[]> = {};
  matches.forEach((m) => {
    if (!byChamp[m.champion]) byChamp[m.champion] = [];
    byChamp[m.champion].push(m);
  });

  return Object.entries(byChamp).map(([champion, champMatches]) => {
    const wins = champMatches.filter((m) => m.win).length;
    const totalKda = champMatches.reduce(
      (sum, m) => sum + kda(m.kills, m.deaths, m.assists),
      0
    );
    return {
      champion,
      games: champMatches.length,
      winRate: (wins / champMatches.length) * 100,
      avgKda: totalKda / champMatches.length,
      playRate: (champMatches.length / matches.length) * 100,
    };
  });
}

export function hiddenGems(matches: Match[]): Array<{
  champion: string;
  winRate: number;
  games: number;
  playRate: number;
}> {
  const summary = summarizeByChampion(matches);
  return summary.filter(
    (s) => s.playRate < 8 && s.winRate >= 54 && s.games >= 1
  );
}

export function clutchScore(matches: Match[]): number {
  if (matches.length === 0) return 0;
  // Calculate based on close wins (high KDA in wins)
  const wins = matches.filter((m) => m.win);
  if (wins.length === 0) return 0;
  const winKdas = wins.map((m) => kda(m.kills, m.deaths, m.assists));
  const avgWinKda = mean(winKdas);
  // Normalize to 0-100 scale (assuming KDA 3+ is excellent)
  return Math.min(100, (avgWinKda / 3) * 100);
}

export function tiltRecovery(matches: Match[]): number {
  if (matches.length < 2) return 0;
  // Check if player bounces back after losses
  let recoveryCount = 0;
  for (let i = 1; i < matches.length; i++) {
    if (!matches[i - 1].win && matches[i].win) {
      recoveryCount++;
    }
  }
  const losses = matches.filter((m) => !m.win).length;
  return losses > 0 ? (recoveryCount / losses) * 100 : 100;
}

export function makeRoast(matches: Match[]): string {
  const losses = matches.filter((m) => !m.win).length;
  const winRate = (matches.filter((m) => m.win).length / matches.length) * 100;
  const avgDeaths = mean(matches.map((m) => m.deaths));

  if (winRate < 40) {
    return "Your win rate is lower than a support's CS. Maybe try playing with your monitor on?";
  }
  if (avgDeaths > 8) {
    return `You're dying ${avgDeaths.toFixed(1)} times per game. The enemy team thanks you for the free gold.`;
  }
  if (losses > matches.length * 0.6) {
    return "You've been feeding harder than a support in a solo lane. Time to review your positioning.";
  }
  return "Your performance is... adequate. But we both know you can do better.";
}

export function makeBoast(matches: Match[]): string {
  const wins = matches.filter((m) => m.win).length;
  const winRate = (wins / matches.length) * 100;
  const avgKda = mean(
    matches.map((m) => kda(m.kills, m.deaths, m.assists))
  );

  if (winRate > 70 && avgKda > 3) {
    return "You're absolutely dominating! Your KDA and win rate are both elite. Keep this momentum going!";
  }
  if (avgKda > 4) {
    return `With a ${avgKda.toFixed(1)} KDA, you're carrying games like a pro. The Rift is your playground!`;
  }
  if (winRate > 60) {
    return `A ${winRate.toFixed(0)}% win rate shows you're making the right calls. Well played!`;
  }
  return "You're showing steady improvement. Keep grinding and you'll climb in no time!";
}

// Async functions
export async function getMockSeason(riotId: string): Promise<PlayerSeason> {
  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 10));
  return {
    ...MOCK_SEASON,
    summonerName: riotId || 'DemoPlayer',
  };
}

export async function shuffleSeason(
  season: PlayerSeason
): Promise<PlayerSeason> {
  // Simulate async operation and shuffle matches
  await new Promise((resolve) => setTimeout(resolve, 10));
  const shuffled = [...season.matches].sort(() => Math.random() - 0.5);
  return {
    ...season,
    matches: shuffled,
  };
}

// Dev test assertions (non-fatal)
if (typeof window === 'undefined') {
  // Server-side only
  const testKda = kda(9, 1, 3);
  if (Math.abs(testKda - 12) > 0.01) {
    console.warn('[DEV TEST] kda(9,1,3) expected 12, got', testKda);
  }

  const testMatches = MOCK_SEASON.matches;
  const testConsistency = calcConsistencyIndex(testMatches);
  if (testConsistency < 0 || testConsistency > 100) {
    console.warn(
      '[DEV TEST] Consistency index out of bounds:',
      testConsistency
    );
  }

  const testClutch = clutchScore(testMatches);
  if (testClutch < 0 || testClutch > 100) {
    console.warn('[DEV TEST] Clutch score out of bounds:', testClutch);
  }

  const testRecovery = tiltRecovery(testMatches);
  if (testRecovery < 0 || testRecovery > 100) {
    console.warn('[DEV TEST] Recovery score out of bounds:', testRecovery);
  }
}

// Export dev helpers
export const __dev__ = {
  mean,
  kda,
  calcConsistencyIndex,
  summarizeByChampion,
  hiddenGems,
  clutchScore,
  tiltRecovery,
  makeRoast,
  makeBoast,
};

