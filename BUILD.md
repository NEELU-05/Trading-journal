# Trading Journal Desktop App

## 🚀 Building the Executable

### Prerequisites
- Node.js installed
- All dependencies installed

### Steps to Build

1. **Install all dependencies:**
```bash
npm run install-all
```

2. **Build the frontend:**
```bash
npm run build
```

3. **Create the executable:**
```bash
npm run dist
```

The executable will be created in the `dist-electron` folder.

### Available Scripts

- `npm run electron` - Run the app in development mode
- `npm run electron-dev` - Run with hot reload
- `npm run pack` - Create unpacked build (for testing)
- `npm run dist` - Create installer (.exe)

## 📦 What Gets Packaged

- Electron wrapper
- Backend server (Node.js + Express)
- Frontend (React build)
- SQLite database (empty, created on first run)

## 🎯 Features

- **Standalone Desktop App** - No browser needed
- **CSV & Excel Import** - Supports .csv, .xlsx, .xls files
- **Psychological Tags** - Track FOMO, REVENGE trades, etc.
- **Local Database** - All data stored locally in SQLite
- **Auto-calculations** - P&L, R-Multiple, Win Rate

## 📝 Notes

- The app runs a local server on port 5000
- Database file is created in the app's data directory
- First launch may take a few seconds to initialize
