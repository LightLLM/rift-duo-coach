'use server';

import type { RecapResponse } from '@/lib/types';
import type { RiotRegion } from '@/lib/riot-api';
import { revalidatePath } from 'next/cache';
import { 
  getAccountByRiotId, 
  parseRiotId, 
  getAllChampionMasteriesByPuuid,
  enrichMasteries 
} from '@/lib/riot-api';
import { getFullYearMatches, formatMatchHistoryError } from '@/lib/match-history';
import { aggregateMatchData } from '@/lib/analytics';
import { generateInsights } from '@/lib/aws-bedrock';
import { initializeChampionData } from '@/lib/champion-data';
import { saveRecap, getRecap, isDynamoDBConfigured } from '@/lib/dynamodb';

/**
 * Format error message for user display
 */
function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Generate a comprehensive year-end recap with AI insights
 * 
 * This server action orchestrates the full data pipeline:
 * 1. Fetch account PUUID from Riot ID
 * 2. Fetch full year of match history
 * 3. Fetch champion mastery data
 * 4. Enrich data with champion names
 * 5. Aggregate analytics from match data
 * 6. Generate AI insights using AWS Bedrock
 * 7. Return combined response
 */
export async function generateRecap(formData: FormData): Promise<RecapResponse> {
  const riotId = formData.get('riotId') as string;
  const region = (formData.get('region') as RiotRegion) || 'na1';
  
  // Validate inputs
  if (!riotId || riotId.trim() === '') {
    return {
      success: false,
      data: null,
      error: 'Please enter a valid Riot ID (e.g., PlayerName#NA1)',
    };
  }
  
  try {
    console.log(`[Recap] Starting recap generation for ${riotId} in ${region}...`);
    
    // Step 1: Parse and validate Riot ID format
    const parsed = parseRiotId(riotId);
    if (!parsed) {
      return {
        success: false,
        data: null,
        error: 'Invalid Riot ID format. Expected format: gameName#tagLine (e.g., "PlayerName#NA1")',
      };
    }
    
    // Step 2: Get account PUUID
    console.log(`[Recap] Fetching account for ${parsed.gameName}#${parsed.tagLine}...`);
    let account;
    try {
      account = await getAccountByRiotId(parsed.gameName, parsed.tagLine, region);
      console.log(`[Recap] Account found: ${account.puuid}`);
    } catch (error) {
      console.error('[Recap] Error fetching account:', error);
      return {
        success: false,
        data: null,
        error: formatErrorMessage(error),
      };
    }
    
    // Step 2.5: Check for cached recap (if DynamoDB is configured)
    const currentYear = new Date().getFullYear();
    if (isDynamoDBConfigured()) {
      console.log('[Recap] Checking DynamoDB cache...');
      try {
        const cachedData = await getRecap(account.puuid, currentYear);
        if (cachedData) {
          console.log('[Recap] Using cached recap data');
          return {
            success: true,
            data: {
              account: {
                riotId,
                region,
                puuid: account.puuid,
              },
              analytics: cachedData.analytics,
              insights: cachedData.insights,
            },
            error: null,
          };
        }
        console.log('[Recap] No cached data found, generating fresh recap...');
      } catch (error) {
        console.warn('[Recap] Cache check failed, continuing without cache:', error);
        // Continue with fresh generation if cache fails
      }
    } else {
      console.log('[Recap] DynamoDB caching is disabled');
    }
    
    // Step 3: Initialize champion data (for name mapping)
    console.log('[Recap] Initializing champion data...');
    try {
      await initializeChampionData();
    } catch (error) {
      console.warn('[Recap] Failed to initialize champion data, using fallback:', error);
      // Non-fatal error, continue with static mapping
    }
    
    // Step 4: Fetch match history (full year) and champion masteries in parallel
    console.log('[Recap] Fetching match history and champion masteries...');
    let matches, masteries;
    try {
      [matches, masteries] = await Promise.all([
        getFullYearMatches(account.puuid, region),
        getAllChampionMasteriesByPuuid(account.puuid, region),
      ]);
      console.log(`[Recap] Fetched ${matches.length} matches and ${masteries.length} champion masteries`);
    } catch (error) {
      console.error('[Recap] Error fetching match history or masteries:', error);
      // Use match history error formatter for better error messages
      return {
        success: false,
        data: null,
        error: formatMatchHistoryError(error),
      };
    }
    
    // Step 5: Enrich masteries with champion names
    console.log('[Recap] Enriching mastery data with champion names...');
    let enrichedMasteries: Awaited<ReturnType<typeof enrichMasteries>> = [];
    try {
      enrichedMasteries = await enrichMasteries(masteries);
    } catch (error) {
      console.error('[Recap] Error enriching masteries:', error);
      // Non-fatal error, continue with empty masteries
      enrichedMasteries = [];
    }
    
    // Step 6: Aggregate analytics from match data
    console.log('[Recap] Aggregating match analytics...');
    let analytics;
    try {
      analytics = aggregateMatchData(matches, enrichedMasteries);
      console.log(`[Recap] Analytics generated: ${analytics.overview.totalGames} games, ${analytics.overview.winRate.toFixed(1)}% WR`);
    } catch (error) {
      console.error('[Recap] Error aggregating analytics:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to process match data. Please try again.',
      };
    }
    
    // Step 7: Generate AI insights using AWS Bedrock
    console.log('[Recap] Generating AI insights with AWS Bedrock...');
    let insights;
    try {
      insights = await generateInsights(analytics);
      console.log('[Recap] AI insights generated successfully');
    } catch (error) {
      console.error('[Recap] Error generating AI insights:', error);
      // Non-fatal error - insights generation has fallback
      // The generateInsights function already handles fallback internally
      return {
        success: false,
        data: null,
        error: 'Failed to generate AI insights. Please check your AWS configuration.',
      };
    }
    
    // Step 8: Save to DynamoDB cache (if configured)
    if (isDynamoDBConfigured()) {
      console.log('[Recap] Saving recap to DynamoDB cache...');
      try {
        await saveRecap(account.puuid, currentYear, riotId, region, { analytics, insights });
        console.log('[Recap] Recap cached successfully');
      } catch (error) {
        console.warn('[Recap] Failed to cache recap, continuing anyway:', error);
        // Non-fatal error, continue without caching
      }
    }
    
    // Step 9: Revalidate path for fresh data
    revalidatePath('/');
    
    console.log('[Recap] Recap generation complete!');
    
    // Step 10: Return combined response
    return {
      success: true,
      data: {
        account: {
          riotId,
          region,
          puuid: account.puuid,
        },
        analytics,
        insights,
      },
      error: null,
    };
    
  } catch (error) {
    // Catch-all for unexpected errors
    console.error('[Recap] Unexpected error during recap generation:', error);
    return {
      success: false,
      data: null,
      error: formatErrorMessage(error),
    };
  }
}
