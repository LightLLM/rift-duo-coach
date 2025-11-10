/**
 * Match History Service
 * 
 * Fetches and processes match history data from Riot Games Match-V5 API
 * Documentation: https://developer.riotgames.com/apis#match-v5
 */

import type { RiotRegion } from './riot-api';

/**
 * Custom error types for better error handling
 */
export class MatchHistoryError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'MatchHistoryError';
  }
}

export class RateLimitError extends MatchHistoryError {
  constructor(retryAfter: number) {
    super(
      `Rate limit exceeded. Please wait ${retryAfter} seconds and try again.`,
      'RATE_LIMIT_EXCEEDED',
      429,
      retryAfter
    );
    this.name = 'RateLimitError';
  }
}

export class NotFoundError extends MatchHistoryError {
  constructor(message: string = 'No matches found for this player.') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class NetworkError extends MatchHistoryError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class InvalidApiKeyError extends MatchHistoryError {
  constructor() {
    super(
      'Invalid API key. Please check your RIOT_API_KEY in .env.local',
      'INVALID_API_KEY',
      403
    );
    this.name = 'InvalidApiKeyError';
  }
}

const AMERICAS_API_BASE = 'https://americas.api.riotgames.com';
const ASIA_API_BASE = 'https://asia.api.riotgames.com';
const EUROPE_API_BASE = 'https://europe.api.riotgames.com';
const SEA_API_BASE = 'https://sea.api.riotgames.com';

// Queue IDs for ranked games
const RANKED_SOLO_QUEUE_ID = 420;
const RANKED_FLEX_QUEUE_ID = 440;

/**
 * Match details interface based on Riot Match-V5 API
 */
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

/**
 * Get the regional routing value for Match-V5 API
 */
function getRegionalRouting(region: RiotRegion): string {
  const routingMap: Record<RiotRegion, string> = {
    'na1': AMERICAS_API_BASE,
    'br1': AMERICAS_API_BASE,
    'la1': AMERICAS_API_BASE,
    'la2': AMERICAS_API_BASE,
    'kr': ASIA_API_BASE,
    'jp1': ASIA_API_BASE,
    'euw1': EUROPE_API_BASE,
    'eun1': EUROPE_API_BASE,
    'tr1': EUROPE_API_BASE,
    'ru': EUROPE_API_BASE,
    'oc1': SEA_API_BASE,
  };
  return routingMap[region] || AMERICAS_API_BASE;
}

/**
 * Get Riot API key from environment variables
 */
function getApiKey(): string {
  const key = process.env.RIOT_API_KEY;
  if (!key) {
    throw new Error('RIOT_API_KEY environment variable is not set. Please add it to your .env.local file.');
  }
  return key;
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry logic with exponential backoff
 * Handles network errors and transient failures
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on specific error types
      if (error instanceof NotFoundError || 
          error instanceof InvalidApiKeyError ||
          error instanceof RateLimitError) {
        throw error;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        console.error(`Max retries (${maxRetries}) exceeded. Last error:`, error);
        throw error;
      }
      
      // Calculate exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms due to:`, 
                  error instanceof Error ? error.message : 'Unknown error');
      await sleep(delay);
    }
  }
  
  throw lastError || new NetworkError('Max retries exceeded');
}

/**
 * Fetch match IDs by PUUID and date range
 * 
 * @param puuid - Player's PUUID
 * @param region - Game region
 * @param startTime - Start time in epoch seconds (optional)
 * @param endTime - End time in epoch seconds (optional)
 * @param count - Number of match IDs to return (max 100, default 20)
 * @param start - Starting index (for pagination, default 0)
 * @param queue - Queue ID filter (optional, e.g., 420 for ranked solo)
 * @returns Array of match IDs
 */
export async function getMatchIds(
  puuid: string,
  region: RiotRegion,
  startTime?: number,
  endTime?: number,
  count: number = 20,
  start: number = 0,
  queue?: number
): Promise<string[]> {
  const regionalBase = getRegionalRouting(region);
  const apiKey = getApiKey();
  
  // Build query parameters
  const params = new URLSearchParams();
  if (startTime) params.append('startTime', startTime.toString());
  if (endTime) params.append('endTime', endTime.toString());
  params.append('count', Math.min(count, 100).toString());
  params.append('start', start.toString());
  if (queue) params.append('queue', queue.toString());
  
  const url = `${regionalBase}/lol/match/v5/matches/by-puuid/${puuid}/ids?${params.toString()}`;
  
  return retryWithBackoff(async () => {
    try {
      const response = await fetch(url, {
        headers: {
          'X-Riot-Token': apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new NotFoundError('No matches found for this player.');
        }
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) : 60;
          console.error(`Rate limit hit. Retry after ${waitTime} seconds.`);
          throw new RateLimitError(waitTime);
        }
        if (response.status === 403) {
          throw new InvalidApiKeyError();
        }
        throw new MatchHistoryError(
          `Match History API error: ${response.status} ${response.statusText}`,
          'API_ERROR',
          response.status
        );
      }

      return response.json();
    } catch (error) {
      // Handle network errors (fetch failures)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error while fetching match IDs:', error);
        throw new NetworkError('Network connection failed. Please check your internet connection.');
      }
      // Re-throw custom errors
      if (error instanceof MatchHistoryError) {
        throw error;
      }
      // Wrap unknown errors
      throw new NetworkError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

/**
 * Fetch detailed match data
 * 
 * @param matchId - Match ID
 * @param region - Game region
 * @returns Match details
 */
export async function getMatchDetails(
  matchId: string,
  region: RiotRegion
): Promise<MatchDetails | null> {
  const regionalBase = getRegionalRouting(region);
  const apiKey = getApiKey();
  
  const url = `${regionalBase}/lol/match/v5/matches/${matchId}`;
  
  return retryWithBackoff(async () => {
    try {
      const response = await fetch(url, {
        headers: {
          'X-Riot-Token': apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Match ${matchId} not found, skipping...`);
          return null;
        }
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) : 60;
          console.error(`Rate limit hit for match ${matchId}. Retry after ${waitTime} seconds.`);
          throw new RateLimitError(waitTime);
        }
        if (response.status === 403) {
          throw new InvalidApiKeyError();
        }
        throw new MatchHistoryError(
          `Match Details API error: ${response.status} ${response.statusText}`,
          'API_ERROR',
          response.status
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Handle network errors (fetch failures)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`Network error while fetching match ${matchId}:`, error);
        throw new NetworkError('Network connection failed. Please check your internet connection.');
      }
      // Re-throw custom errors
      if (error instanceof MatchHistoryError) {
        throw error;
      }
      // Wrap unknown errors
      throw new NetworkError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

/**
 * Format error message for user display
 */
export function formatMatchHistoryError(error: unknown): string {
  if (error instanceof RateLimitError) {
    return `Rate limit exceeded. Please wait ${error.retryAfter} seconds and try again.`;
  }
  if (error instanceof NotFoundError) {
    return error.message;
  }
  if (error instanceof InvalidApiKeyError) {
    return 'API configuration error. Please check your RIOT_API_KEY setup.';
  }
  if (error instanceof NetworkError) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }
  if (error instanceof MatchHistoryError) {
    return error.message;
  }
  if (error instanceof Error) {
    return `An unexpected error occurred: ${error.message}`;
  }
  return 'An unknown error occurred. Please try again.';
}

/**
 * Parse raw match data from Riot API into MatchDetails format
 */
function parseMatchData(rawMatch: any, puuid: string): MatchDetails | null {
  try {
    const { info, metadata } = rawMatch;
    
    // Find the participant data for this player
    const participant = info.participants.find((p: any) => p.puuid === puuid);
    
    if (!participant) {
      console.warn(`Player ${puuid} not found in match ${metadata.matchId}`);
      return null;
    }
    
    return {
      matchId: metadata.matchId,
      gameCreation: info.gameCreation,
      gameDuration: info.gameDuration,
      gameMode: info.gameMode,
      queueId: info.queueId,
      participant: {
        puuid: participant.puuid,
        championId: participant.championId,
        championName: participant.championName,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        win: participant.win,
        visionScore: participant.visionScore,
        totalDamageDealt: participant.totalDamageDealtToChampions,
        goldEarned: participant.goldEarned,
        totalMinionsKilled: participant.totalMinionsKilled + participant.neutralMinionsKilled,
        role: participant.teamPosition || participant.role || 'UNKNOWN',
        lane: participant.lane || 'UNKNOWN',
        items: [
          participant.item0,
          participant.item1,
          participant.item2,
          participant.item3,
          participant.item4,
          participant.item5,
          participant.item6,
        ].filter(item => item !== 0),
      },
    };
  } catch (error) {
    console.error('Error parsing match data:', error);
    return null;
  }
}

/**
 * Fetch full year of matches with batching logic
 * 
 * @param puuid - Player's PUUID
 * @param region - Game region
 * @returns Array of match details for ranked games in the last year
 */
export async function getFullYearMatches(
  puuid: string,
  region: RiotRegion
): Promise<MatchDetails[]> {
  const now = Math.floor(Date.now() / 1000); // Current time in epoch seconds
  const oneYearAgo = now - (365 * 24 * 60 * 60); // 365 days ago
  
  const allMatches: MatchDetails[] = [];
  const BATCH_SIZE = 20;
  let start = 0;
  let hasMoreMatches = true;
  let totalMatchIdsFetched = 0;
  let failedMatches = 0;
  
  console.log(`Fetching matches for the last year (since ${new Date(oneYearAgo * 1000).toISOString()})...`);
  
  while (hasMoreMatches) {
    try {
      // Fetch match IDs for ranked games only
      const matchIds = await getMatchIds(
        puuid,
        region,
        oneYearAgo,
        now,
        BATCH_SIZE,
        start
      );
      
      if (matchIds.length === 0) {
        console.log('No more match IDs to fetch.');
        hasMoreMatches = false;
        break;
      }
      
      totalMatchIdsFetched += matchIds.length;
      console.log(`Fetched ${matchIds.length} match IDs (batch starting at ${start}, total: ${totalMatchIdsFetched})...`);
      
      // Fetch details for each match
      for (const matchId of matchIds) {
        try {
          const rawMatch = await getMatchDetails(matchId, region);
          
          if (rawMatch) {
            const parsedMatch = parseMatchData(rawMatch, puuid);
            
            // Filter for ranked games only (queueId 420 or 440)
            if (parsedMatch && 
                (parsedMatch.queueId === RANKED_SOLO_QUEUE_ID || 
                 parsedMatch.queueId === RANKED_FLEX_QUEUE_ID)) {
              allMatches.push(parsedMatch);
            }
          }
          
          // Add a small delay between requests to avoid rate limiting
          await sleep(100);
        } catch (error) {
          failedMatches++;
          if (error instanceof RateLimitError) {
            console.error(`Rate limit hit while fetching match ${matchId}. Waiting ${error.retryAfter} seconds...`);
            await sleep(error.retryAfter * 1000);
            // Retry this match after waiting
            try {
              const rawMatch = await getMatchDetails(matchId, region);
              if (rawMatch) {
                const parsedMatch = parseMatchData(rawMatch, puuid);
                if (parsedMatch && 
                    (parsedMatch.queueId === RANKED_SOLO_QUEUE_ID || 
                     parsedMatch.queueId === RANKED_FLEX_QUEUE_ID)) {
                  allMatches.push(parsedMatch);
                  failedMatches--; // Successfully recovered
                }
              }
            } catch (retryError) {
              console.error(`Failed to fetch match ${matchId} after rate limit retry:`, retryError);
            }
          } else {
            console.error(`Error fetching match ${matchId}:`, error instanceof Error ? error.message : error);
          }
          // Continue with next match
        }
      }
      
      // If we got fewer matches than requested, we've reached the end
      if (matchIds.length < BATCH_SIZE) {
        hasMoreMatches = false;
      } else {
        start += BATCH_SIZE;
        // Add delay between batches
        console.log('Waiting 1 second before next batch...');
        await sleep(1000);
      }
    } catch (error) {
      console.error('Error fetching match batch:', error);
      
      // Handle specific error types
      if (error instanceof NotFoundError) {
        console.log('No matches found for this player in the specified time range.');
        break;
      }
      if (error instanceof RateLimitError) {
        console.error(`Rate limit exceeded. Waiting ${error.retryAfter} seconds before continuing...`);
        await sleep(error.retryAfter * 1000);
        // Continue to next batch after waiting
        continue;
      }
      if (error instanceof InvalidApiKeyError || error instanceof NetworkError) {
        // These are fatal errors, stop processing
        throw error;
      }
      
      // For other errors, log and continue
      console.error('Unexpected error, continuing with next batch...');
    }
  }
  
  console.log(`Fetch complete: ${allMatches.length} ranked matches retrieved (${failedMatches} failed).`);
  
  if (allMatches.length === 0) {
    throw new NotFoundError('No ranked matches found in the last year. Play some ranked games and try again!');
  }
  
  return allMatches;
}
