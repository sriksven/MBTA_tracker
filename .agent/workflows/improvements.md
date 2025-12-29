---
description: MBTA Tracker Comprehensive Improvements Plan
---

# MBTA Live Tracker - Comprehensive Improvements

## ✅ Completed

### 1. Code Quality & Linting
- ✅ Fixed all 13 ESLint errors
- ✅ Fixed all 11 ESLint warnings
- ✅ Added ESLint ignore to legacy app.js file
- ✅ Removed unused parameters and variables
- ✅ Fixed unreachable code in Map.jsx
- ✅ All tests passing (5/5)

## 🚀 In Progress

### 2. UX Improvements
- [ ] Fix vehicle status display (STOPPED_AT → "Stopped at")
- [ ] Fix route categorization (Red/Orange/Blue as "Heavy Rail" not "Tram")
- [ ] Add alert filtering by transit mode
- [ ] Improve vehicle popup information
- [ ] Add human-readable status messages

### 3. Performance Optimizations
- [ ] Add React.memo to components
- [ ] Optimize re-renders
- [ ] Add loading states
- [ ] Implement error boundaries

### 4. Feature Enhancements
- [ ] Add vehicle speed visualization
- [ ] Improve arrival predictions
- [ ] Add route comparison feature
- [ ] Add favorites/bookmarks for stops

### 5. Testing & Deployment
- [ ] Add more unit tests
- [ ] Add integration tests
- [ ] Update CI/CD pipeline
- [ ] Performance testing

## 📝 Implementation Notes

### Vehicle Status Formatting
Current: `STOPPED_AT`, `IN_TRANSIT_TO`
Target: "Stopped at", "In transit to", "Incoming at"

### Route Categorization
- **Light Rail (Tram)**: Green Line (B, C, D, E), Mattapan Trolley
- **Heavy Rail (Subway)**: Red, Orange, Blue Lines
- **Commuter Rail**: CR-* routes
- **Bus**: Type 3 routes

### Alert Filtering Logic
Filter alerts based on:
1. Current transit mode (subway/bus/rail)
2. Selected routes
3. Severity level
