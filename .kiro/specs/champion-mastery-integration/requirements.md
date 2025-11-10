# Requirements Document

## Introduction

This feature integrates real Riot Games Champion Mastery API data into the Rift Rewind application. Currently, the application has the API integration code in place but uses mock match data for display. This feature will fetch and display actual champion mastery information including mastery levels, points, and champion-specific statistics to provide users with authentic insights about their League of Legends performance.

## Glossary

- **Rift Rewind Application**: The Next.js web application that generates personalized League of Legends recaps
- **Champion Mastery API**: Riot Games API endpoint that returns champion mastery data for a player
- **PUUID**: Player Universally Unique Identifier used by Riot Games to identify players across regions
- **Mastery Level**: A numeric level (1-7) indicating player proficiency with a specific champion
- **Mastery Points**: Cumulative points earned by playing a specific champion
- **Riot ID**: Player identifier in the format gameName#tagLine (e.g., "PlayerName#NA1")
- **Server Action**: Next.js server-side function that handles form submissions and data fetching
- **Champion Summary Component**: UI component displaying aggregated champion statistics
- **Data Transformation Layer**: Service layer that converts API responses to application data models

## Requirements

### Requirement 1

**User Story:** As a League of Legends player, I want to enter my Riot ID and see my actual champion mastery data, so that I can view authentic statistics about my champion performance.

#### Acceptance Criteria

1. WHEN THE User submits a valid Riot ID in the format gameName#tagLine, THE Rift Rewind Application SHALL fetch the player's PUUID using the Account API
2. WHEN THE Rift Rewind Application receives a valid PUUID, THE Rift Rewind Application SHALL fetch all champion mastery data using the Champion Mastery API
3. IF THE Riot ID format is invalid, THEN THE Rift Rewind Application SHALL display an error message stating "Invalid Riot ID format. Expected format: gameName#tagLine"
4. IF THE API request fails with a 404 status, THEN THE Rift Rewind Application SHALL display an error message stating "Account not found. Please check your Riot ID and region"
5. IF THE API request fails with a 429 status, THEN THE Rift Rewind Application SHALL display an error message stating "Rate limit exceeded. Please wait a moment and try again"

### Requirement 2

**User Story:** As a user, I want to see my top champions by mastery points displayed in the UI, so that I can quickly identify which champions I play most.

#### Acceptance Criteria

1. THE Rift Rewind Application SHALL display champion mastery data sorted by mastery points in descending order
2. WHEN THE Champion Summary Component renders, THE Rift Rewind Application SHALL display the champion name, mastery level, and mastery points for each champion
3. THE Rift Rewind Application SHALL display at least the top 10 champions by mastery points
4. WHEN THE champion mastery data contains more than 10 champions, THE Rift Rewind Application SHALL provide a mechanism to view additional champions
5. THE Champion Summary Component SHALL display mastery level as a visual indicator (e.g., badge or icon)

### Requirement 3

**User Story:** As a user, I want to see which champions I have mastery chests available for, so that I can plan which champions to play to earn rewards.

#### Acceptance Criteria

1. WHEN THE Champion Summary Component displays a champion, THE Rift Rewind Application SHALL indicate whether a mastery chest has been granted for that champion
2. THE Rift Rewind Application SHALL visually distinguish champions with available chests from those without available chests
3. WHEN THE user views champion details, THE Rift Rewind Application SHALL display the chest status with clear labeling (e.g., "Chest Available" or "Chest Earned")

### Requirement 4

**User Story:** As a user, I want the application to handle API errors gracefully, so that I receive clear feedback when something goes wrong.

#### Acceptance Criteria

1. WHEN THE Champion Mastery API returns an error response, THE Rift Rewind Application SHALL display a user-friendly error message
2. WHEN THE API request is in progress, THE Rift Rewind Application SHALL display a loading indicator
3. IF THE API key is missing or invalid, THEN THE Rift Rewind Application SHALL display an error message stating "API configuration error. Please check your setup"
4. THE Rift Rewind Application SHALL log detailed error information to the console for debugging purposes
5. WHEN THE API request fails, THE Rift Rewind Application SHALL maintain the previous data state if available

### Requirement 5

**User Story:** As a user, I want to see mastery-based insights and recommendations, so that I can discover which champions I should focus on improving.

#### Acceptance Criteria

1. THE Rift Rewind Application SHALL identify champions with high mastery points but low mastery level as "improvement opportunities"
2. THE Rift Rewind Application SHALL identify champions with mastery level 6 or 7 as "mastered champions"
3. WHEN THE Rift Rewind Application displays actionable tips, THE Rift Rewind Application SHALL include at least one tip based on champion mastery data
4. THE Rift Rewind Application SHALL calculate and display the total mastery points across all champions
5. THE Rift Rewind Application SHALL display the count of champions at each mastery level (1-7)

### Requirement 6

**User Story:** As a user, I want to see when I last played each champion, so that I can identify champions I haven't played recently.

#### Acceptance Criteria

1. WHEN THE Champion Summary Component displays a champion, THE Rift Rewind Application SHALL display the last play time in a human-readable format (e.g., "2 days ago", "1 week ago")
2. THE Rift Rewind Application SHALL sort champions by last play time when the user selects a "Recently Played" filter
3. THE Rift Rewind Application SHALL highlight champions not played in the last 30 days with a visual indicator

### Requirement 7

**User Story:** As a user, I want to select my region before fetching data, so that the application retrieves data from the correct regional server.

#### Acceptance Criteria

1. THE Rift Rewind Application SHALL provide a region selector with all supported Riot API regions (na1, euw1, eun1, kr, br1, la1, la2, oc1, ru, tr1, jp1)
2. WHEN THE User submits a Riot ID, THE Rift Rewind Application SHALL use the selected region for all API requests
3. THE Rift Rewind Application SHALL default to the "na1" region if no region is selected
4. THE Rift Rewind Application SHALL persist the selected region in browser storage for subsequent visits

### Requirement 8

**User Story:** As a developer, I want champion IDs to be mapped to champion names, so that the UI displays readable champion names instead of numeric IDs.

#### Acceptance Criteria

1. THE Data Transformation Layer SHALL maintain a mapping of champion IDs to champion names
2. WHEN THE Champion Mastery API returns champion data with numeric IDs, THE Data Transformation Layer SHALL convert the IDs to champion names
3. IF THE champion ID is not found in the mapping, THEN THE Data Transformation Layer SHALL display "Unknown Champion (ID: {championId})"
4. THE Data Transformation Layer SHALL use the latest champion data from Riot Games Data Dragon API or a static mapping file
