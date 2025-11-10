# Rift Rewind

A personalized League of Legends recap generator built with Next.js, TypeScript, and TailwindCSS.

## Features

- 📊 Personalized match statistics and analytics
- 🏆 Champion performance summaries
- 💎 Hidden gem champion recommendations
- 🎯 Actionable tips for improvement
- 🔥 Roast & Boast personalized feedback
- 🤖 AI-powered insights using AWS Bedrock (Claude 3 Sonnet)
- ⚡ Optional DynamoDB caching for instant recap loading
- 📈 Full year match history analysis

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Riot Games API Key (required)
RIOT_API_KEY=your_riot_api_key_here

# AWS Configuration (required for AI insights)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# DynamoDB Caching (optional)
DYNAMODB_TABLE_NAME=rift-rewind-insights
ENABLE_CACHING=true
```

See `.env.example` for a complete template.

### DynamoDB Setup (Optional)

To enable caching for faster recap loading:

1. Configure AWS credentials in `.env.local`
2. Run the setup script:

```bash
npm run setup-dynamodb
```

For detailed setup instructions, see [docs/DYNAMODB_SETUP.md](docs/DYNAMODB_SETUP.md).

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

### Testing

```bash
# Test DynamoDB caching
npm run test:dynamodb

# Test analytics aggregation
npm run test:analytics
```

## Tech Stack

- **Next.js 14** - App Router with Server Actions
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **AWS Bedrock** - AI-powered insights (Claude 3 Sonnet)
- **AWS DynamoDB** - Optional caching layer
- **Riot Games API** - Match history and champion mastery data

## Project Structure

```
/app
  /actions.ts        # Server actions for recap generation
  /page.tsx          # Main page component
  /layout.tsx        # Root layout
  /globals.css       # Global styles
/components
  /RiftRewind.tsx    # Main client component
  /RecapCard.tsx     # Recap display component
  /MasteryCard.tsx   # Champion mastery card
  /ChestBadge.tsx    # Chest status indicator
  /TemporalChart.tsx # Performance charts
  /ShareableCard.tsx # Social media card generator
/lib
  /riot-api.ts       # Riot Games API integration
  /match-history.ts  # Match history fetching
  /analytics.ts      # Data aggregation and analysis
  /aws-bedrock.ts    # AI insights generation
  /dynamodb.ts       # DynamoDB caching service
  /champion-data.ts  # Champion data mapping
  /types.ts          # TypeScript types
/scripts
  /setup-dynamodb.js # DynamoDB table setup script
/docs
  /DYNAMODB_SETUP.md # DynamoDB setup guide
```

## Documentation

- [DynamoDB Setup Guide](docs/DYNAMODB_SETUP.md) - Complete guide for setting up caching
- [DynamoDB Implementation](docs/DYNAMODB_IMPLEMENTATION.md) - Technical implementation details

## License

MIT

