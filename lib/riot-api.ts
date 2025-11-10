/**
 * Riot Games API Service
 * 
 * Documentation: https://developer.riotgames.com/apis
 */

const RIOT_API_BASE = 'https://{region}.api.riotgames.com';
const AMERICAS_API_BASE = 'https://americas.api.riotgames.com';

export type RiotRegion = 'na1' | 'euw1' | 'eun1' | 'kr' | 'br1' | 'la1' | 'la2' | 'oc1' | 'ru' | 'tr1' | 'jp1';

export interface RiotSummoner {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface RiotChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  tokensEarned: number;
  summonerId: string;
}

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
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
 * Make a request to the Riot API
 */
async function riotApiRequest<T>(
  url: string,
  region: RiotRegion = 'na1'
): Promise<T> {
  const apiKey = getApiKey();
  const fullUrl = url.replace('{region}', region);
  
  const response = await fetch(fullUrl, {
    headers: {
      'X-Riot-Token': apiKey,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Summoner not found. Please check the Riot ID and region.');
    }
    if (response.status === 403) {
      throw new Error('Invalid API key. Please check your RIOT_API_KEY in .env.local');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    throw new Error(`Riot API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get account information by Riot ID (gameName#tagLine)
 * Uses the Account API (RSO)
 */
export async function getAccountByRiotId(
  gameName: string,
  tagLine: string,
  region: RiotRegion = 'na1'
): Promise<RiotAccount> {
  const url = `${AMERICAS_API_BASE}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  
  const response = await fetch(url, {
    headers: {
      'X-Riot-Token': getApiKey(),
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Account not found: ${gameName}#${tagLine}`);
    }
    if (response.status === 403) {
      throw new Error('Invalid API key. Please check your RIOT_API_KEY in .env.local');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    throw new Error(`Riot API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get summoner information by summoner name
 */
export async function getSummonerByName(
  summonerName: string,
  region: RiotRegion = 'na1'
): Promise<RiotSummoner> {
  const url = `${RIOT_API_BASE}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;
  return riotApiRequest<RiotSummoner>(url, region);
}

/**
 * Get summoner information by PUUID
 */
export async function getSummonerByPuuid(
  puuid: string,
  region: RiotRegion = 'na1'
): Promise<RiotSummoner> {
  const url = `${RIOT_API_BASE}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  return riotApiRequest<RiotSummoner>(url, region);
}

/**
 * Get all champion masteries for a player by PUUID
 * 
 * @param puuid - Player's PUUID
 * @param region - Game region (default: 'na1')
 * @returns Array of champion mastery objects
 * 
 * Documentation: https://developer.riotgames.com/apis#champion-mastery-v4/GET_getAllChampionMasteriesByPUUID
 */
export async function getAllChampionMasteriesByPuuid(
  puuid: string,
  region: RiotRegion = 'na1'
): Promise<RiotChampionMastery[]> {
  const url = `${RIOT_API_BASE}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`;
  return riotApiRequest<RiotChampionMastery[]>(url, region);
}

/**
 * Get champion mastery for a specific champion
 */
export async function getChampionMastery(
  puuid: string,
  championId: number,
  region: RiotRegion = 'na1'
): Promise<RiotChampionMastery> {
  const url = `${RIOT_API_BASE}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`;
  return riotApiRequest<RiotChampionMastery>(url, region);
}

/**
 * Helper function to parse Riot ID (gameName#tagLine)
 */
export function parseRiotId(riotId: string): { gameName: string; tagLine: string } | null {
  const parts = riotId.split('#');
  if (parts.length !== 2) {
    return null;
  }
  return {
    gameName: parts[0].trim(),
    tagLine: parts[1].trim(),
  };
}

/**
 * Get champion masteries by Riot ID
 * This is a convenience function that combines account lookup and mastery fetch
 */
export async function getChampionMasteriesByRiotId(
  riotId: string,
  region: RiotRegion = 'na1'
): Promise<{ account: RiotAccount; masteries: RiotChampionMastery[]; summoner: RiotSummoner }> {
  const parsed = parseRiotId(riotId);
  if (!parsed) {
    throw new Error('Invalid Riot ID format. Expected format: gameName#tagLine (e.g., "PlayerName#NA1")');
  }

  // Get account to get PUUID
  const account = await getAccountByRiotId(parsed.gameName, parsed.tagLine, region);
  
  // Get summoner info
  const summoner = await getSummonerByPuuid(account.puuid, region);
  
  // Get champion masteries
  const masteries = await getAllChampionMasteriesByPuuid(account.puuid, region);

  return {
    account,
    masteries,
    summoner,
  };
}

/**
 * Enrich champion masteries with champion names
 */
export async function enrichMasteries(
  masteries: RiotChampionMastery[]
): Promise<import('./types').EnrichedMastery[]> {
  const { getChampionName } = await import('./champion-data');
  
  return masteries.map(mastery => ({
    ...mastery,
    championName: getChampionName(mastery.championId),
  }));
}


