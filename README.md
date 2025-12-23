# 🚇 MBTA Live Tracker

A real-time transit tracker for the Massachusetts Bay Transportation Authority (MBTA) system, featuring live vehicle positions, route filtering, and service alerts.

## ✨ Features

- **Real-Time Vehicle Tracking**: See live positions of trains, trams, and buses on an interactive map
- **Auto-Refresh**: Vehicle positions update every 10 seconds automatically
- **Route Filtering**: Toggle specific routes on/off to focus on what matters to you
- **Service Alerts**: Stay informed about delays and service changes
- **Interactive Map**: Click on vehicles to see detailed information including:
  - Current status
  - Direction/destination
  - Current stop
  - Speed
- **Beautiful Dark Theme**: Modern, premium design with MBTA brand colors
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for API access and map tiles)

### Running Locally

1. Clone this repository or download the files
2. Open `index.html` in your web browser, or
3. Use a local server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (with http-server)
npx http-server -p 8000
```

4. Navigate to `http://localhost:8000`

## 🗺️ How to Use

1. **Select Routes**: Click on route cards in the left sidebar to toggle them on/off
2. **View Vehicles**: Active vehicles appear as colored markers on the map
3. **Get Details**: Click any vehicle marker to see detailed information
4. **Refresh**: Click the "Refresh" button to manually update data
5. **Check Alerts**: Scroll down in the sidebar to see active service alerts

## 🔧 Configuration

The app uses the MBTA V3 API. The API key is configured in `app.js`:

```javascript
const MBTA_API_KEY = 'd5dbafa546244e839c05bc7e3d5955d4';
```

To use your own API key:
1. Register at [https://api-v3.mbta.com/register](https://api-v3.mbta.com/register)
2. Replace the API key in `app.js`

## 📊 Data Sources

- **MBTA V3 API**: Real-time vehicle positions, predictions, and alerts
- **OpenStreetMap**: Base map tiles via CartoDB Dark theme
- **Leaflet.js**: Interactive mapping library

## 🎨 Technologies Used

- **HTML5**: Semantic structure
- **CSS3**: Modern styling with animations and glassmorphism
- **JavaScript (ES6+)**: Application logic and API integration
- **Leaflet.js**: Interactive maps
- **MBTA V3 API**: Real-time transit data

## 📱 Responsive Design

The tracker is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🔄 Auto-Update

Vehicle positions automatically refresh every 10 seconds. Updates pause when the browser tab is hidden to save resources.

## 📝 License

This project uses public MBTA data. The MBTA logo and branding are property of the Massachusetts Bay Transportation Authority.

## 🤝 Contributing

Feel free to fork this project and submit pull requests for improvements!

## 📧 Support

For MBTA API issues, contact: developer@mbta.com

---

Built with ❤️ for Boston transit riders
