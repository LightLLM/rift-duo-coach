# Implementation Plan

- [x] 1. Set up AWS infrastructure and champion data service

  - Create AWS Bedrock client configuration with Claude 3 Sonnet model
  - Set up environment variables for AWS credentials and Riot API key
  - Implement champion data service to fetch and cache Data Dragon champion mappings
  - Create static fallback mapping for top 50 champions
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 2. Implement Match History API integration

  - [x] 2.1 Create match history service with batch fetching

    - Implement `getMatchIds()` function to fetch match IDs by PUUID and date range

    - Implement `getMatchDetails()` function to fetch detailed match data
    - Implement `getFullYearMatches()` function with batching logic (20 matches per batch)
    - Add retry logic with exponential backoff for rate limit handling
    - Filter for ranked games only (queueId 420, 440)
    - _Requirements: 1.1, 1.2, 4.1, 4.2_

  - [x] 2.2 Add error handling for Match History API

    - Handle 404 errors (no matches found)
    - Handle 429 errors (rate limiting) with countdown timer
    - Handle network errors with retry mechanism
    - Log detailed errors for debugging
    - _Requirements: 1.3, 1.4, 1.5, 4.1, 4.3, 4.4_

- [x] 3. Build data aggregation and analytics service

  - [x] 3.1 Implement core analytics calculations

    - Create `aggregateMatchData()` function to process raw match data
    - Calculate overview stats (total games, win rate, KDA, playtime)
    - Generate champion-specific statistics with win rates and KDA
    - Identify highlight matches (best KDA, most kills, longest game, highest damage)
    - _Requirements: 2.1, 2.2, 5.1, 5.4_

  - [x] 3.2 Implement temporal trend analysis

    - Calculate monthly win rate trends
    - Calculate weekly performance metrics
    - Identify best and worst performing months
    - Generate time-series data for charts
    - _Requirements: 5.1, 5.2_

  - [x] 3.3 Implement streak detection and role analysis

    - Detect longest win and loss streaks
    - Calculate current streak status
    - Analyze role distribution across matches
    - Calculate performance metrics (vision score, damage/min, gold/min, CS/min)
    - _Requirements: 5.1, 5.5_

- [x] 4. Integrate AWS Bedrock for AI insights

  - [x] 4.1 Set up Bedrock client and prompt engineering

    - Initialize BedrockRuntimeClient with credentials
    - Create system prompt for League of Legends coaching context
    - Implement dynamic user prompt generation from analytics data
    - Configure Claude 3 Sonnet model parameters (temperature, max tokens)
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 4.2 Implement insight generation functions

    - Create `generateInsights()` function to call Bedrock API
    - Parse Bedrock response into structured AIInsights object
    - Extract strengths, weaknesses, coaching tips, roast, and boast
    - Generate shareable quote for social media
    - Handle Bedrock API errors gracefully (fallback to basic insights)
    - _Requirements: 5.1, 5.2, 5.3, 4.1_

- [x] 5. Update server action with full data pipeline

  - Modify `generateRecap()` server action to orchestrate full flow
  - Fetch account PUUID from Riot ID
  - Call match history service to get full year of matches
  - Call champion mastery API for mastery data
  - Enrich data with champion names from Data Dragon
  - Aggregate analytics from match data
  - Generate AI insights using Bedrock
  - Return combined RecapResponse with analytics and insights
  - Implement comprehensive error handling for each step
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Build UI components for recap display

  - [x] 6.1 Create RecapCard component

    - Display year-in-review summary from AI
    - Show key statistics (games, win rate, KDA, playtime)
    - Display top champions with mastery levels and win rates
    - Show strengths and weaknesses sections
    - Display coaching tips with categorization
    - Include roast and boast sections with styling
    - Add highlight matches section
    - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.2, 5.3_

  - [x] 6.2 Create MasteryCard component

    - Display champion name and icon
    - Show mastery level badge (1-7) with visual styling
    - Display mastery points with formatted numbers (e.g., "125.5k")
    - Show last played timestamp in relative format
    - Add chest status indicator (available/earned)
    - Include progress bar to next mastery level

    - _Requirements: 2.1, 2.2, 2.5, 3.1, 3.2, 3.3, 6.1, 6.2_

  - [x] 6.3 Create ChestBadge component

    - Implement available state (gold chest with glow)
    - Implement earned state (gray chest with checkmark)

    - Support size variants (sm, md, lg)
    - Add tooltip with chest status explanation
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 6.4 Create RegionSelector component

    - Build dropdown with all supported regions

    - Display region code and full name
    - Persist selection to localStorage
    - Default to 'na1' region
    - Add onChange handler for form integration
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 6.5 Create TemporalChart component

    - Implement monthly win rate line chart using Recharts
    - Create champion play rate pie chart
    - Build role distribution bar chart
    - Add KDA trend over time chart
    - Make charts responsive and accessible
    - _Requirements: 5.1, 5.2_

  - [x] 6.6 Create ShareableCard component

    - Design shareable social media card layout
    - Include player name, region, and key stats
    - Display AI-generated quote prominently
    - Add Rift Rewind branding
    - Implement PNG export using html-to-image library
    - Add copy-to-clipboard and download buttons
    - _Requirements: 5.3_

- [x] 7. Update RiftRewind main component

  - Add RegionSelector to form
  - Replace mock data with real recap data
  - Implement loading state with skeleton UI and progress indicator
  - Add error state display with user-friendly messages
  - Integrate RecapCard component
  - Add ShareableCard modal/section
  - Maintain existing UI animations and styling
  - Handle empty state (no matches found)
  - _Requirements: 1.3, 1.4, 1.5, 4.1, 4.2, 4.5, 7.1, 7.2, 7.3, 7.4_

- [x] 8. Implement DynamoDB caching (optional for MVP)


  - [x] 8.1 Set up DynamoDB table and client

    - Create DynamoDB table with PK/SK schema
    - Initialize DynamoDB client with credentials
    - Add resource tagging (rift-rewind-hackathon: 2025)
    - Configure TTL for automatic expiration (1 year)
    - _Requirements: 4.5_

  - [x] 8.2 Implement cache functions

    - Create `saveRecap()` function to store insights
    - Create `getRecap()` function to retrieve cached insights
    - Add cache invalidation logic
    - Handle DynamoDB errors gracefully (continue without cache)
    - _Requirements: 4.5_

- [ ] 9. Add comprehensive error handling and loading states

  - Implement error boundary component for React errors
  - Add toast notifications for user feedback
  - Create error message formatting utility
  - Implement retry logic for failed API calls
  - Add progress tracking for long operations (match fetching)
  - Display estimated time remaining during recap generation

  - _Requirements: 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 10. Optimize performance and add rate limiting

  - Implement parallel API calls for matches and masteries
  - Add request queue for batch match fetching
  - Implement client-side rate limit tracking
  - Add delays between batch requests (1 second)
  - Show progress indicator during long operations
  - Optimize champion data caching strategy
  - Implement SWR for client-side data caching
  - _Requirements: 1.5, 4.1, 4.2_

- [ ] 11. Add testing and validation

  - [ ] 11.1 Write unit tests for services

    - Test match history service batch fetching
    - Test analytics aggregation calculations
    - Test champion data mapping
    - Test error handling in all services
    - _Requirements: All_

  - [ ] 11.2 Write integration tests
    - Test end-to-end recap generation flow
    - Test component rendering with various data shapes
    - Test error propagation through the stack
    - _Requirements: All_

- [ ] 12. Update documentation and deployment
  - Update README with AWS setup instructions
  - Document environment variables required
  - Add AWS Bedrock access request instructions
  - Create deployment guide for Vercel/AWS Amplify
  - Document API rate limits and best practices
  - Add troubleshooting section for common errors
  - Include demo video recording instructions
  - _Requirements: All_
