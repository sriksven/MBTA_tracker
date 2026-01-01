# 🚇 MBTA Live Tracker

Real-time transit tracking application for the Massachusetts Bay Transportation Authority (MBTA). Track subway trains, buses, and commuter rail with live vehicle positions, arrival predictions, and smart commute assistance.

![React](https://img.shields.io/badge/React-18.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-5.0.8-purple)
![License](https://img.shields.io/badge/license-MIT-green)

🚀 **[Live Demo](https://sriksven.github.io/MBTA_tracker/)**

## ✨ Features

### 🚇 Multi-Modal Transit Tracking
- **Subway** - Red, Orange, Blue, Green lines with real-time train positions
- **Bus** - All MBTA bus routes with live vehicle tracking
- **Commuter Rail** - All commuter rail lines with real-time updates

### 🎯 Smart Features
- **Real-time Vehicle Tracking** - Live positions with directional arrows and smooth animations
- **Smart Commute Assistant** - Calculates walking time and tells you when to leave
- **Live Arrival Predictions** - Real-time countdowns for next arrivals at any stop
- **Browse Mode** - Explore routes and stops by line and direction
- **Nearby Mode** - Find closest stops based on your location or map click
- **Vehicle Follow** - Click any vehicle to track it as it moves
- **Route Search** - Plan routes with walking, biking, or driving directions

### 🎨 Premium UI/UX
- Modern glassmorphic design with dark theme
- Smooth animations and transitions
- Responsive design for desktop, tablet, and mobile
- Interactive map with custom markers and route lines
- Real-time service alerts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MBTA API Key ([Get one here](https://api-v3.mbta.com/))

### Installation

```bash
# Clone repository
git clone https://github.com/sriksven/MBTA_tracker.git
cd MBTA_tracker

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your MBTA API key to .env

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
MBTA_tracker/
├── src/
│   ├── components/          # React components
│   │   ├── Header/
│   │   ├── Map/
│   │   ├── RouteSelector/
│   │   ├── AlertsSidebar/
│   │   ├── BrowsePanel/
│   │   ├── NearbyPanel/
│   │   └── TransportModeSelector/
│   ├── services/
│   │   └── mbta.service.js  # MBTA API integration
│   ├── utils/
│   │   └── formatters.js    # Data formatting utilities
│   ├── App.jsx
│   └── main.jsx
├── public/
│   └── data/                # Preloaded stop data
├── tests/                   # Test files
├── .github/workflows/       # CI/CD pipeline
└── package.json
```

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:smoke` | Run smoke tests |

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm test -- --coverage

# Smoke tests (validates API connectivity)
npm run test:smoke
```

## 🌐 Deployment

### GitHub Pages

1. Add `VITE_MBTA_API_KEY` to repository secrets
2. Enable GitHub Pages (Settings → Pages → Source: GitHub Actions)
3. Push to main branch

```bash
git push origin main
```

Your site will be live at: `https://[username].github.io/MBTA_tracker/`

## 🎨 Tech Stack

- **React 18** - UI framework
- **Vite 5** - Build tool
- **Leaflet** - Interactive maps
- **MBTA V3 API** - Real-time transit data
- **Vitest** - Testing framework
- **GitHub Actions** - CI/CD

## 🔐 Environment Variables

```env
VITE_MBTA_API_KEY=your_api_key_here
```

## 📊 API Endpoints Used

- `/routes` - All transit routes
- `/shapes` - Route polylines
- `/vehicles` - Real-time vehicle positions
- `/stops` - All stops/stations
- `/predictions` - Live arrival times
- `/alerts` - Service alerts

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- MBTA for providing the public API
- OpenStreetMap contributors
- CARTO for map tiles

---

**Built with ❤️ for the MBTA community**
