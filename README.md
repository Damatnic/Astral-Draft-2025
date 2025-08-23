# Astral Draft - Fantasy Football Platform 2025

Next-generation fantasy football platform with AI-powered insights and real-time analytics.

## Live Demo

[https://astraldraft.netlify.app](https://astraldraft.netlify.app)

## Features

- **AI-Powered Oracle**: Get predictions and insights powered by Gemini AI
- **Real-Time Draft Room**: Live multiplayer drafting with analytics
- **Advanced Analytics**: Deep stats, projections, and performance tracking
- **Trade Analyzer**: AI-powered trade recommendations
- **Waiver Wire Management**: FAAB bidding system
- **Mobile-First PWA**: Install as app on any device
- **Live Scoring**: Real-time game updates and scoring

## Test Accounts

For testing, use these pre-configured accounts:

- Email: `player1@astral.com` to `player10@astral.com`
- Password: `test123`

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **State**: React Context API
- **PWA**: Service Workers, Web App Manifest
- **AI**: Google Gemini API, OpenAI API
- **Deployment**: Netlify

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/Damatnic/Astral-Draft-2025.git
cd Astral-Draft-2025
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file with your API keys:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

4. Run development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Deployment

### Netlify Deployment

1. Fork this repository
2. Connect to Netlify
3. Add environment variables in Netlify dashboard:
   - `VITE_GEMINI_API_KEY`
   - `VITE_OPENAI_API_KEY`
4. Deploy

The project includes a `netlify.toml` configuration file with all necessary settings.

## Project Structure

```
astral-draft/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── data/           # Player and team data
│   └── types.ts        # TypeScript definitions
├── public/             # Static assets
├── netlify/           # Netlify functions
└── dist/              # Production build
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## Environment Variables

Required environment variables for production:

- `VITE_GEMINI_API_KEY` - Google Gemini API key for AI features
- `VITE_OPENAI_API_KEY` - OpenAI API key for advanced analytics

## License

MIT

## Author

Astral Draft Team

---

Built with React, TypeScript, and AI-powered insights for the ultimate fantasy football experience.