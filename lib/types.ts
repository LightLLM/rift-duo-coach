export type Match = {
  matchId: string;
  gameEndTimestamp: number;
  champion: string;
  role?: string;
  lane?: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  visionScore?: number;
  dpm?: number;
  goldPerMin?: number;
  laneGoldDiff15?: number;
};

export type PlayerSeason = {
  puuid: string;
  summonerName: string;
  matches: Match[];
};

/**
 * Enriched champion mastery with champion name
 */
export interface EnrichedMastery {
  championId: number;
  championName: string;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  tokensEarned: number;
  summonerId: string;
}

/**
 * Recap response type for the full data pipeline
 */
export type RecapResponse = {
  success: boolean;
  data: {
    account: {
      riotId: string;
      region: string;
      puuid: string;
    };
    analytics: import('./analytics').PlayerAnalytics;
    insights: import('./aws-bedrock').AIInsights;
  } | null;
  error: string | null;
};

