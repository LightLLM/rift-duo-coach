/**
 * AWS Bedrock Integration for AI-Powered Insights
 * 
 * Uses Claude 3 Sonnet to generate personalized League of Legends coaching insights
 */

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

// Initialize Bedrock client
let bedrockClient: BedrockRuntimeClient | null = null;

/**
 * Get or create Bedrock client instance
 */
function getBedrockClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env.local file.'
      );
    }

    bedrockClient = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return bedrockClient;
}

// Claude 3 Sonnet model ID
const MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';

/**
 * AI-generated insights structure
 */
export interface AIInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvementAreas: string[];
  coachingTips: string[];
  roast: string;
  boast: string;
  hiddenGems: string[];
  yearInReview: string;
  shareableQuote: string;
}

// Import PlayerAnalytics from analytics module to ensure consistency
import type { PlayerAnalytics } from './analytics';

/**
 * Generate AI-powered insights using AWS Bedrock (Claude 3 Sonnet)
 */
export async function generateInsights(
  analytics: PlayerAnalytics
): Promise<AIInsights> {
  try {
    const client = getBedrockClient();

    // System prompt for League of Legends coaching context
    const systemPrompt = `You are an expert League of Legends coach analyzing a player's full year of ranked matches. 
Your goal is to provide personalized, actionable insights that help them improve while being engaging and fun.

Focus on:
- Identifying persistent patterns (good and bad)
- Highlighting growth over time
- Suggesting specific, actionable improvements
- Celebrating achievements
- Being honest but encouraging

Avoid:
- Generic advice that applies to everyone
- Overly technical jargon
- Negativity without constructive feedback`;

    // Build user prompt with analytics data
    const championStatsText = analytics.championStats && analytics.championStats.length > 0
      ? analytics.championStats.slice(0, 5).map(c => 
          `- ${c.championName}: ${c.games} games, ${c.winRate.toFixed(1)}% WR, ${c.avgKDA.toFixed(2)} KDA`
        ).join('\n')
      : 'No champion data available';

    const userPrompt = `Analyze this player's year in League of Legends:

Total Games: ${analytics.overview.totalGames}
Win Rate: ${analytics.overview.winRate.toFixed(1)}%
Average KDA: ${analytics.overview.avgKDA.toFixed(2)}
Average K/D/A: ${analytics.overview.avgKills.toFixed(1)}/${analytics.overview.avgDeaths.toFixed(1)}/${analytics.overview.avgAssists.toFixed(1)}
Total Playtime: ${analytics.overview.totalPlaytime.toFixed(1)} hours

Top Champions:
${championStatsText}

Temporal Trends:
- Best Month: ${analytics.temporalTrends.bestMonth || 'N/A'}
- Worst Month: ${analytics.temporalTrends.worstMonth || 'N/A'}

Performance Metrics:
- Vision Score: ${analytics.performanceMetrics.avgVisionScore.toFixed(1)}
- Damage/Min: ${analytics.performanceMetrics.avgDamagePerMinute.toFixed(0)}
- CS/Min: ${analytics.performanceMetrics.avgCSPerMinute.toFixed(1)}
- Gold/Min: ${analytics.performanceMetrics.avgGoldPerMinute.toFixed(0)}

Streaks:
- Longest Win Streak: ${analytics.streaks.longestWinStreak}
- Longest Loss Streak: ${analytics.streaks.longestLossStreak}
- Current Streak: ${analytics.streaks.currentStreak.count} ${analytics.streaks.currentStreak.type}${analytics.streaks.currentStreak.count !== 1 ? 's' : ''}

Role Distribution:
${Object.entries(analytics.roleDistribution)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 3)
  .map(([role, count]) => `- ${role}: ${count} games`)
  .join('\n')}

Generate a JSON response with the following structure:
{
  "yearInReview": "A compelling 2-3 sentence summary of their year",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "improvementAreas": ["area1", "area2", "area3"],
  "coachingTips": ["tip1", "tip2", "tip3", "tip4", "tip5"],
  "roast": "A playful roast (1-2 sentences)",
  "boast": "An encouraging boast (1-2 sentences)",
  "hiddenGems": ["champion1", "champion2"],
  "shareableQuote": "A memorable quote for social media"
}

Respond ONLY with valid JSON, no additional text.`;

    // Prepare request payload with system prompt and user prompt
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt
        }
      ]
    };

    // Invoke Bedrock model
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    
    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Extract content from Claude's response
    if (!responseBody.content || !Array.isArray(responseBody.content) || responseBody.content.length === 0) {
      console.error('Invalid Bedrock response structure:', responseBody);
      throw new Error('Invalid response from AWS Bedrock');
    }
    
    const content = responseBody.content[0].text;
    
    // Parse JSON from Claude's response
    // Claude sometimes wraps JSON in markdown code blocks, so we need to extract it
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const insights = JSON.parse(jsonContent);

    // Validate and structure the response
    return {
      summary: insights.yearInReview || insights.summary || '',
      strengths: Array.isArray(insights.strengths) ? insights.strengths : [],
      weaknesses: Array.isArray(insights.weaknesses) ? insights.weaknesses : [],
      improvementAreas: Array.isArray(insights.improvementAreas) ? insights.improvementAreas : [],
      coachingTips: Array.isArray(insights.coachingTips) ? insights.coachingTips : [],
      roast: insights.roast || '',
      boast: insights.boast || '',
      hiddenGems: Array.isArray(insights.hiddenGems) ? insights.hiddenGems : [],
      yearInReview: insights.yearInReview || insights.summary || '',
      shareableQuote: insights.shareableQuote || '',
    };

  } catch (error) {
    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error('AWS Bedrock error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error('AWS Bedrock error (unknown type):', error);
    }
    
    // Return fallback insights if Bedrock fails
    console.log('Falling back to basic insights generation...');
    return generateFallbackInsights(analytics);
  }
}

/**
 * Generate basic insights without AI (fallback)
 */
function generateFallbackInsights(analytics: PlayerAnalytics): AIInsights {
  const { overview, championStats, temporalTrends, performanceMetrics, streaks } = analytics;
  const winRate = overview.winRate;
  const kda = overview.avgKDA;
  const topChamp = championStats[0]?.championName || 'your favorite champion';
  const topChampGames = championStats[0]?.games || 0;
  const totalHours = overview.totalPlaytime;

  // Generate strengths based on actual performance
  const strengths: string[] = [];
  if (winRate > 52) strengths.push(`Strong ${winRate.toFixed(1)}% win rate shows consistent performance`);
  if (kda > 3) strengths.push(`Excellent ${kda.toFixed(2)} KDA demonstrates good decision-making`);
  if (streaks.longestWinStreak >= 5) strengths.push(`Impressive ${streaks.longestWinStreak}-game win streak shows momentum`);
  if (performanceMetrics.avgVisionScore > 40) strengths.push('Good vision control with strong ward placement');
  if (championStats[0]?.winRate > 55) strengths.push(`Dominant on ${topChamp} with ${championStats[0].winRate.toFixed(1)}% win rate`);
  
  // Ensure at least 3 strengths
  while (strengths.length < 3) {
    if (strengths.length === 0) strengths.push('Consistent gameplay throughout the season');
    else if (strengths.length === 1) strengths.push('Team-oriented playstyle');
    else strengths.push(`Dedicated ${topChamp} player with ${topChampGames} games`);
  }

  // Generate weaknesses based on actual performance
  const weaknesses: string[] = [];
  if (winRate < 48) weaknesses.push('Win rate below 50% indicates room for improvement');
  if (overview.avgDeaths > 6) weaknesses.push(`High death average (${overview.avgDeaths.toFixed(1)}) suggests positioning issues`);
  if (performanceMetrics.avgVisionScore < 30) weaknesses.push('Low vision score - need more ward placement');
  if (performanceMetrics.avgCSPerMinute < 5) weaknesses.push(`CS/min of ${performanceMetrics.avgCSPerMinute.toFixed(1)} needs improvement`);
  if (streaks.longestLossStreak >= 5) weaknesses.push(`${streaks.longestLossStreak}-game loss streak shows tilt issues`);
  
  // Ensure at least 3 weaknesses
  while (weaknesses.length < 3) {
    if (weaknesses.length === 0) weaknesses.push('Champion pool could be more diverse');
    else if (weaknesses.length === 1) weaknesses.push('Objective control needs attention');
    else weaknesses.push('Map awareness could be improved');
  }

  // Generate improvement areas
  const improvementAreas: string[] = [
    overview.avgDeaths > 5 ? 'Reduce deaths by improving positioning and map awareness' : 'Optimize champion pool for current meta',
    performanceMetrics.avgVisionScore < 35 ? 'Increase vision score through consistent warding' : 'Improve CS efficiency in lane',
    winRate < 50 ? 'Focus on win conditions and objective control' : 'Expand champion pool for flexibility'
  ];

  // Generate coaching tips
  const coachingTips: string[] = [
    `Focus on your best champions - ${topChamp} has been your most successful`,
    performanceMetrics.avgVisionScore < 35 
      ? 'Buy control wards every back and place them in high-traffic areas'
      : 'Maintain your strong vision control to enable team plays',
    overview.avgDeaths > 5
      ? 'Review deaths in replays to identify positioning mistakes'
      : 'Continue your disciplined playstyle with low deaths',
    performanceMetrics.avgCSPerMinute < 6
      ? 'Practice last-hitting in practice tool to improve CS/min'
      : 'Your CS is solid - focus on translating farm leads into objectives',
    streaks.longestLossStreak >= 4
      ? 'Take breaks after 2 losses to avoid tilt and maintain mental'
      : 'Keep your mental strong and focus on improvement over wins'
  ];

  // Generate roast
  let roast = '';
  if (overview.avgDeaths > 7) {
    roast = `${overview.avgDeaths.toFixed(1)} deaths per game? The enemy team should send you a thank-you card for all that gold.`;
  } else if (streaks.longestLossStreak >= 7) {
    roast = `A ${streaks.longestLossStreak}-game loss streak? Even your keyboard wanted to uninstall.`;
  } else if (winRate < 45) {
    roast = `With a ${winRate.toFixed(0)}% win rate, you're giving the enemy team more LP than your own team.`;
  } else if (performanceMetrics.avgCSPerMinute < 4) {
    roast = `${performanceMetrics.avgCSPerMinute.toFixed(1)} CS/min? The minions are farming you at this point.`;
  } else {
    roast = 'Your performance is decent, but we both know you can do better. Time to step it up!';
  }

  // Generate boast
  let boast = '';
  if (winRate > 55) {
    boast = `${winRate.toFixed(0)}% win rate? You're not just climbing, you're taking the elevator!`;
  } else if (streaks.longestWinStreak >= 7) {
    boast = `A ${streaks.longestWinStreak}-game win streak! You were absolutely unstoppable during that run.`;
  } else if (kda > 4) {
    boast = `${kda.toFixed(2)} KDA is seriously impressive. You're playing like a pro!`;
  } else if (championStats[0]?.winRate > 60) {
    boast = `${championStats[0].winRate.toFixed(0)}% win rate on ${topChamp}? You've mastered that champion!`;
  } else {
    boast = `${overview.totalGames} games shows real dedication. Keep grinding and the results will come!`;
  }

  // Identify hidden gems (champions with good win rate but fewer games)
  const hiddenGems = championStats
    .filter(c => c.games >= 5 && c.games <= 20 && c.winRate > 55)
    .slice(0, 2)
    .map(c => c.championName);

  // Generate year in review
  const yearInReview = `This year you played ${overview.totalGames} ranked games over ${totalHours.toFixed(0)} hours, with ${topChamp} as your most-played champion (${topChampGames} games). Your ${winRate.toFixed(1)}% win rate and ${kda.toFixed(2)} KDA demonstrate ${winRate > 50 ? 'solid climbing potential' : 'room for growth'}. ${temporalTrends.bestMonth ? `Your best month was ${temporalTrends.bestMonth}, where you really hit your stride.` : ''} ${streaks.longestWinStreak >= 5 ? `Your ${streaks.longestWinStreak}-game win streak was a highlight of the season!` : ''}`;

  // Generate shareable quote
  const shareableQuote = `${overview.totalGames} ranked games, ${winRate.toFixed(0)}% WR, ${kda.toFixed(1)} KDA on ${topChamp}. My Rift Rewind 2025! 🎮⚔️`;

  return {
    summary: yearInReview,
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    improvementAreas,
    coachingTips,
    roast,
    boast,
    hiddenGems,
    yearInReview,
    shareableQuote,
  };
}

/**
 * Generate focused coaching tips for specific areas
 */
export async function generateCoachingTips(
  analytics: PlayerAnalytics,
  focusArea: 'macro' | 'micro' | 'champion-pool' | 'mental'
): Promise<string[]> {
  // For now, return basic tips based on focus area
  // This can be enhanced with Bedrock in future iterations
  const tips: Record<string, string[]> = {
    macro: [
      'Focus on objective control - prioritize dragons and barons',
      'Improve your map awareness by checking minimap every 3-5 seconds',
      'Learn wave management to create pressure across the map',
      'Coordinate with your team for vision control around objectives'
    ],
    micro: [
      'Practice last-hitting in custom games to improve CS',
      'Work on trading stance in lane to win more trades',
      'Improve your ability usage timing and combos',
      'Focus on positioning in team fights'
    ],
    'champion-pool': [
      'Focus on 2-3 champions to master them deeply',
      'Learn meta champions for your role',
      'Have backup picks for different team compositions',
      'Practice champions that complement your playstyle'
    ],
    mental: [
      'Take breaks between games to reset mentally',
      'Focus on your own gameplay, not your teammates',
      'Review wins as well as losses to reinforce good habits',
      'Set small, achievable goals for each game'
    ]
  };

  return tips[focusArea] || tips.macro;
}
