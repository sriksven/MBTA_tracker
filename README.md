# 🚇 MBTA Live Tracker

A production-grade real-time transit tracking application for the Massachusetts Bay Transportation Authority (MBTA) subway system. Built with React, Vite, and Leaflet.

![MBTA Live Tracker](https://img.shields.io/badge/React-18.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-5.0.8-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- 🚇 **Real-time Vehicle Tracking** - Live positions of all MBTA subway trains with directional arrows
- 🏃 **Smart Commute Assistant** - Calculates walking time to stops and tells you exactly when to leave (e.g., "Leave in 5 min" or "Run!")
- ⏱️ **Live Arrival Predictions** - Click any stop to see real-time countdowns for next arrivals
- 🎯 **Vehicle Auto-Follow** - Click any vehicle to "lock" the camera and track it as it moves
- 📍 **Smart Location** - Auto-zooms to your location and filters suggestions based on proximity
- 🗺️ **Interactive Map** - Dark-themed Leaflet map with route lines and improved 14px stop markers
- 🎨 **Premium Glassmorphic UI** - Modern translucent header, smooth animations, and polished interactions
- 🚨 **Service Alerts** - Real-time service alerts in a collapsible sidebar
- 🎨 **Modern UI** - Production-grade dark theme with smooth animations
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- ⚡ **Fast Performance** - Optimized builds with code splitting and lazy loading
- 🧪 **Fully Tested** - Unit tests, smoke tests, and automated CI/CD

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/sriksven/MBTA_tracker.git
cd MBTA_tracker

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env
# Add your MBTA API key to .env

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

## 📁 Project Structure

```
MBTA_tracker/
├── .github/
│   └── workflows/
│       └── ci-cd.yml              # CI/CD pipeline
├── src/
│   ├── __tests__/                 # Unit tests
│   │   ├── setup.js
│   │   └── mbta.service.test.js
│   ├── components/                # React components
│   │   ├── Header/
│   │   ├── Map/
│   │   └── AlertsSidebar/
│   ├── services/
│   │   └── mbta.service.js        # MBTA API service
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── tests/
│   └── smoke-test.js              # Smoke tests
├── .env.example                   # Environment template
├── package.json
├── vite.config.js
└── vitest.config.js
```

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run test` | Run unit tests |
| `npm run test:ui` | Run tests with interactive UI |
| `npm run test:smoke` | Run smoke tests |

## 🧪 Testing

### Unit Tests
```bash
npm run test              # Run all tests
npm run test:ui           # Interactive test UI
npm test -- --coverage    # Generate coverage report
```

### Smoke Tests
Validates environment setup, API connectivity, and critical endpoints:
```bash
npm run test:smoke
```

### CI/CD Pipeline
All tests run automatically on every push:
1. ✅ Lint & Format Check
2. ✅ Smoke Tests (API validation)
3. ✅ Unit Tests (Service logic)
4. ✅ Build
5. ✅ Deploy to GitHub Pages (main branch only)

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_MBTA_API_KEY=your_api_key_here
```

For GitHub Actions deployment, add `VITE_MBTA_API_KEY` as a repository secret.

## 🌐 Deployment

### GitHub Pages

1. **Add GitHub Secret:**
   - Go to Settings → Secrets and variables → Actions
   - Add `VITE_MBTA_API_KEY` with your API key

2. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Source: GitHub Actions

3. **Push to Main:**
   ```bash
   git push origin main
   ```

Your site will be live at: `https://[username].github.io/MBTA_tracker/`

### Custom Domain

Add a `CNAME` file to the `public/` folder with your domain name.

## 🎨 Tech Stack

### Core
- **React 18** - UI framework
- **Vite 5** - Build tool and dev server
- **Leaflet** - Interactive maps
- **React-Leaflet** - React bindings for Leaflet

### Development
- **Vitest** - Unit testing framework
- **React Testing Library** - Component testing
- **ESLint** - Code linting
- **Prettier** - Code formatting

### CI/CD
- **GitHub Actions** - Automated testing and deployment
- **GitHub Pages** - Static site hosting

## 🏗️ Architecture

### Components

**Header**
- Displays active vehicle count and last update time
- Control buttons for alerts, route lines, and refresh
- Responsive design with mobile menu

**Map**
- Interactive Leaflet map with dark theme
- Real-time vehicle markers with direction indicators
- Route polylines for all subway lines
- Stop markers for all stations
- Custom popups with vehicle/stop details

**Alerts Sidebar**
- Collapsible right sidebar
- Service alerts with severity levels
- Auto-updates with latest alerts
- Mobile-responsive with overlay

### Services

**MBTA Service** (`src/services/mbta.service.js`)
- Handles all API calls to MBTA V3 API
- Data transformation and normalization
- Polyline decoding for route shapes
- Error handling and fallbacks

## 📊 Performance Optimizations

- ✅ Code splitting (React vendor, Leaflet vendor)
- ✅ Tree shaking for smaller bundles
- ✅ Lazy loading of components
- ✅ Optimized re-renders with React.memo
- ✅ Debounced API calls
- ✅ Source maps for debugging
- ✅ Asset optimization

## 🎯 Code Quality

### ESLint Configuration
- React recommended rules
- React Hooks rules
- Custom rules for production code
- No unused variables warnings

### Prettier Configuration
- Single quotes
- No semicolons
- 100 character line width
- Trailing commas (ES5)

### Test Coverage Goals
- Services: 80%+
- Components: 70%+
- Overall: 75%+

## 🔄 Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make Changes**
   - Write code
   - Add tests
   - Update documentation

3. **Run Tests**
   ```bash
   npm run lint
   npm run format:check
   npm run test
   npm run test:smoke
   ```

4. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature
   ```

5. **Create Pull Request**
   - CI/CD pipeline runs automatically
   - All tests must pass
   - Code review required

6. **Merge to Main**
   - Automatic deployment to GitHub Pages

## 🐛 Troubleshooting

### "npm not found"
Install Node.js from https://nodejs.org/

### API Key Issues
- Check `.env` file exists
- Verify `VITE_MBTA_API_KEY` is set
- For GitHub Actions, check repository secrets

### Build Fails
```bash
npm run lint          # Check for linting errors
npm run test          # Run tests
rm -rf node_modules   # Clear dependencies
npm install           # Reinstall
```

### Tests Fail
```bash
npm run test -- --watch    # Watch mode for debugging
npm run test:ui            # Interactive test UI
```

### Map Not Loading
- Check browser console for errors
- Verify Leaflet CSS is loaded
- Check API key is valid

## 📚 API Documentation

This application uses the [MBTA V3 API](https://api-v3.mbta.com/docs/swagger/index.html).

### Endpoints Used
- `/routes` - Get all subway routes
- `/shapes` - Get route polylines
- `/vehicles` - Get real-time vehicle positions
- `/stops` - Get all subway stops
- `/predictions` - Get live arrival times and smart status
- `/alerts` - Get service alerts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning or production!

## 🙏 Acknowledgments

- MBTA for providing the public API
- OpenStreetMap contributors
- CARTO for map tiles
- React and Vite communities

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review the troubleshooting section

---

**Built with ❤️ for the MBTA community**

🚀 **Live Demo:** [https://sriksven.github.io/MBTA_tracker/](https://sriksven.github.io/MBTA_tracker/)
