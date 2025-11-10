# Rift Rewind UI Components

This directory contains all the UI components for displaying League of Legends recap data.

## Components

### RecapCard
Main component that displays the complete year-in-review recap with AI insights.

**Props:**
- `analytics: PlayerAnalytics` - Player statistics and performance data
- `insights: AIInsights` - AI-generated insights from AWS Bedrock
- `riotId: string` - Player's Riot ID
- `region: string` - Player's region

**Features:**
- Year-in-review summary
- Key statistics (games, win rate, KDA, playtime)
- Top champions with mastery levels
- Strengths and weaknesses sections
- Coaching tips
- Roast and boast sections
- Highlight matches

### MasteryCard
Displays individual champion mastery information.

**Props:**
- `mastery: EnrichedMastery` - Champion mastery data
- `index?: number` - Optional index for animation delay

**Features:**
- Champion name display
- Mastery level badge (1-7) with color coding
- Formatted mastery points (e.g., "125.5k")
- Last played timestamp in relative format
- Chest status indicator
- Progress bar to next mastery level

### ChestBadge
Small badge component showing chest availability status.

**Props:**
- `available: boolean` - Whether chest is available
- `size?: 'sm' | 'md' | 'lg'` - Badge size variant

**Features:**
- Gold chest with glow for available state
- Gray chest with checkmark for earned state
- Hover tooltip with explanation
- Size variants

### RegionSelector
Dropdown selector for choosing League of Legends region.

**Props:**
- `value?: RiotRegion` - Current selected region
- `onChange?: (region: RiotRegion) => void` - Change handler
- `name?: string` - Form input name

**Features:**
- All supported Riot API regions
- Region code and full name display
- localStorage persistence
- Defaults to 'na1'

**Supported Regions:**
- na1 (North America)
- euw1 (Europe West)
- eun1 (Europe Nordic & East)
- kr (Korea)
- br1 (Brazil)
- la1 (Latin America North)
- la2 (Latin America South)
- oc1 (Oceania)
- ru (Russia)
- tr1 (Turkey)
- jp1 (Japan)

### TemporalChart
Displays performance trends over time using Recharts.

**Props:**
- `analytics: PlayerAnalytics` - Player analytics data

**Features:**
- Monthly win rate line chart
- Champion play rate pie chart
- Role distribution bar chart
- KDA trend over time
- Responsive and accessible charts

### ShareableCard
Generates a shareable social media card with player stats.

**Props:**
- `analytics: PlayerAnalytics` - Player statistics
- `insights: AIInsights` - AI insights
- `riotId: string` - Player's Riot ID
- `region: string` - Player's region

**Features:**
- Social media optimized layout
- Player name, region, and key stats
- AI-generated quote display
- Rift Rewind branding
- PNG export using html-to-image
- Copy quote to clipboard
- Download button

## Usage Example

```tsx
import {
  RecapCard,
  MasteryCard,
  RegionSelector,
  TemporalChart,
  ShareableCard,
} from '@/components';

function RecapPage({ data }) {
  return (
    <div>
      <RegionSelector onChange={(region) => console.log(region)} />
      
      <RecapCard
        analytics={data.analytics}
        insights={data.insights}
        riotId={data.riotId}
        region={data.region}
      />
      
      <TemporalChart analytics={data.analytics} />
      
      <div className="grid grid-cols-3 gap-4">
        {data.masteries.map((mastery, idx) => (
          <MasteryCard key={mastery.championId} mastery={mastery} index={idx} />
        ))}
      </div>
      
      <ShareableCard
        analytics={data.analytics}
        insights={data.insights}
        riotId={data.riotId}
        region={data.region}
      />
    </div>
  );
}
```

## Dependencies

- `framer-motion` - Animations
- `lucide-react` - Icons
- `recharts` - Charts
- `html-to-image` - Image export
- `react` & `next` - Framework

## Styling

All components use Tailwind CSS with a dark theme color scheme:
- Primary: Purple/Pink gradient
- Background: Slate shades
- Accents: Various colors for different stats

Components are fully responsive and include hover effects and animations.
