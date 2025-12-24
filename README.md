# Trading Journal Assistant

A professional web-based trading journal application designed to help traders systematically record, analyze, and improve their trading performance through structured journaling and automated metrics.

## Features

### 📊 Comprehensive Trade Tracking
- **6-Section Question-Based Form**: Structured data entry covering all aspects of a trade
- **Auto-Calculations**: Automatic P&L and R-Multiple calculations
- **Smart Flagging**: Automatically highlights problematic trades (RR < 1.5, SL moved, rules not followed)
- **Sortable Journal Table**: View and sort trades by date, R-Multiple, setup, or outcome

### 📈 Performance Analytics
- **Real-Time Statistics**: Total trades, win rate, average R-Multiple
- **Setup Analysis**: Identify your best and worst performing setups
- **Visual Indicators**: Color-coded outcomes and flagged trades

### 🎯 Trader-Focused Design
- Clean, minimal interface
- Desktop-first responsive layout
- Dark theme optimized for extended use
- Fast, distraction-free experience

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite (local file-based)
- **HTTP Client**: Axios

## Deployment

This application is **Render-ready** and can be deployed with one click!

### Quick Deploy to Render

1. Push your code to GitHub
2. Connect to Render
3. Deploy using the included `render.yaml` configuration

**📖 Full deployment guide**: See [DEPLOY.md](./DEPLOY.md) for detailed step-by-step instructions.

### What's Included for Deployment

- ✅ `render.yaml` - Render configuration file
- ✅ Production build scripts in `backend/package.json`
- ✅ Static file serving in production mode
- ✅ Environment variable configuration
- ✅ `.gitignore` for clean repository

## Project Structure

```
trading-journal/
├── backend/
│   ├── server.js              # Express server
│   ├── database.js            # SQLite setup & schema
│   ├── routes/
│   │   └── trades.js          # API endpoints
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TradeForm.jsx
│   │   │   ├── JournalTable.jsx
│   │   │   └── StatsPanel.jsx
│   │   ├── utils/
│   │   │   └── calculations.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm run dev
```

The backend API will run on `http://localhost:5000`

### Frontend Setup

1. Open a new terminal and navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. **Start Both Servers**: Make sure both backend (port 5000) and frontend (port 5173) are running
2. **Open Browser**: Navigate to `http://localhost:5173`
3. **Add Trade**: Click "Add New Trade" button
4. **Fill Form**: Answer all questions across 6 sections:
   - Trade Identification (Symbol, Timeframe, Direction, Date/Time)
   - Risk & Execution (Entry, SL, TP, Risk, Position Size)
   - Logic/Edge (Setup, HTF Trend, Entry Reason, Confirmations)
   - Management (SL Moved, Manual Interference)
   - Result (Exit Price, P&L, R-Multiple - auto-calculated)
   - Discipline (Followed Rules, Mistakes, Would Take Again)
5. **Save Trade**: Submit the form to save to database
6. **View Journal**: See all trades in sortable table
7. **Analyze Stats**: Review performance metrics in stats panel

## Auto-Calculations

### R-Multiple
- **Long**: `R = (Exit - Entry) / (Entry - StopLoss)`
- **Short**: `R = (Entry - Exit) / (StopLoss - Entry)`

### P&L
- **Long**: `P&L = (Exit - Entry) × Position Size`
- **Short**: `P&L = (Entry - Exit) × Position Size`

### Risk-Reward Ratio
- **Long**: `RR = (TakeProfit - Entry) / (Entry - StopLoss)`
- **Short**: `RR = (Entry - TakeProfit) / (StopLoss - Entry)`

## Trade Flagging Rules

Trades are automatically flagged (highlighted in RED) if:
1. Risk-Reward Ratio < 1.5
2. Stop Loss was moved (Yes)
3. Trading rules were not followed (No)

## API Endpoints

- `GET /api/trades` - Get all trades (with optional sorting)
- `GET /api/trades/:id` - Get single trade
- `POST /api/trades` - Create new trade
- `PUT /api/trades/:id` - Update trade
- `DELETE /api/trades/:id` - Delete trade
- `GET /api/trades/api/stats` - Get statistics
- `GET /api/trades/api/setups` - Get setup names
- `POST /api/trades/api/setups` - Add new setup

## Database Schema

The SQLite database contains two tables:

### trades
- Trade identification (symbol, timeframe, direction, datetime)
- Risk & execution (entry, SL, TP, risk amount, position size)
- Strategy logic (setup name, HTF trend, entry reason, confirmations)
- Management (SL moved, manual interference)
- Results (exit price, P&L, R-Multiple, outcome)
- Discipline (followed rules, mistakes, would take again)
- Metadata (is_flagged, created_at)

### setups
- Setup names for dropdown selection

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

### Build for Production
```bash
cd frontend
npm run build  # Creates optimized production build
```

## Troubleshooting

### Port Already in Use
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change `server.port` in `frontend/vite.config.js`

### Database Issues
- Delete `backend/trading_journal.db` to reset database
- Restart backend server to recreate schema

### CORS Errors
- Ensure backend is running on port 5000
- Check Vite proxy configuration in `vite.config.js`

## Future Enhancements

- Google Sheets export/sync
- Trade screenshots upload
- Advanced filtering and search
- Chart integration
- Monthly/weekly reports
- Trade tags and categories
- Multi-user support with authentication

## License

MIT

## Author

Built for traders, by traders. Focus on process, not emotions.
