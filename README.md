# 🏦 Forex Trading App

A full-stack forex trading application with real-time exchange rates, algorithmic trading strategies, and machine learning predictions.

## 🚀 Features

- **Real-time Exchange Rates** - Live forex data from ExchangeRate API
- **Beautiful Dashboard** - Modern React UI with gradient design
- **Multiple Currency Support** - USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, and more
- **Responsive Design** - Works on desktop and mobile
- **RESTful API** - Express.js backend with CORS support
- **Test Mode** - Mock data for development and testing

## 🛠️ Tech Stack

### Frontend
- **React** - User interface
- **CSS3** - Modern styling with gradients and animations
- **Fetch API** - HTTP requests to backend

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Axios** - HTTP client for external APIs
- **CORS** - Cross-origin resource sharing
- **Nodemon** - Development server auto-restart

### APIs
- **ExchangeRate API** - Free forex data (no API key required)

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Karthikeyan1508/forex-trading-app.git
   cd forex-trading-app
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the Backend Server**
   ```bash
   cd ../backend
   npm run dev
   ```
   Server runs on: http://localhost:5002

5. **Start the Frontend**
   ```bash
   cd ../frontend
   npm start
   ```
   App runs on: http://localhost:3000

## 🔗 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/forex/test` | GET | Test endpoint with mock data |
| `/api/forex/latest/:base` | GET | Get all rates for base currency |
| `/api/forex/pair/:from/:to` | GET | Get specific currency pair rate |
| `/api/forex/currencies` | GET | Get supported currencies |

### Example Requests

```bash
# Health check
curl http://localhost:5002/api/health

# Test data
curl http://localhost:5002/api/forex/test

# Get USD rates
curl http://localhost:5002/api/forex/latest/USD

# Get EUR/USD pair
curl http://localhost:5002/api/forex/pair/EUR/USD
```

## 🎯 Usage

1. **Open the app** at http://localhost:3000
2. **Select currencies** from the dropdown menus
3. **Click "🧪 Test Connection"** to verify backend connectivity
4. **Click "Get All Rates"** to fetch real-time exchange rates
5. **Click "Get Pair Rate"** to get specific currency pair data

## 🔧 Configuration

The backend uses port 5002 by default. You can change this in:
- `backend/.env` file: `PORT=5002`
- Or via environment variable: `PORT=3001 npm start`

## 📁 Project Structure

```
forex-trading-app/
├── backend/
│   ├── server.js          # Express server
│   ├── package.json       # Backend dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── App.css       # Styles
│   │   └── index.js      # React entry point
│   └── package.json      # Frontend dependencies
├── .gitignore            # Git ignore rules
├── README.md             # This file
└── SETUP.md              # Setup instructions
```

## 🌟 Future Enhancements

- **Bollinger Bands Algorithm** - Mean reversion trading strategy
- **Machine Learning Strategy** - Logistic regression for trade signals
- **Historical Data** - Charts and backtesting
- **User Authentication** - Secure login system
- **Trade Execution** - Paper trading simulation
- **Performance Analytics** - P/L tracking and metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Contact

**Karthikeyan** - [GitHub](https://github.com/Karthikeyan1508)

---

⭐ **Star this repository** if you found it helpful!

---

## 🔹 **Project Scope Now**

* **Frontend:** React dashboard (candlestick charts, indicators, trade blotter, comparison panel).
* **Backend:** Express + Supabase APIs.
* **Algo:** Bollinger Bands (main), **ML-based strategy** (Logistic Regression as example).
* **Database:** Supabase (stores historical data, trades, strategy outputs).
* **Optional:** Compare Bollinger vs ML strategy performance.

---

## ⏳ **Phased Timeline (Total: 20 hours)**

### **Phase 1 – Setup & Planning (2 hrs)**

* Define MVP including ML strategy:

  * Dashboard for Bollinger trades and ML-based trades.
  * Display comparison metrics: P/L, win rate, Sharpe ratio.
* Setup project skeleton:

  * React frontend, Express backend, Supabase database.
* Plan Supabase tables for:

  * `forex_data` → OHLC + indicators
  * `trades` → executed trades for each strategy
  * `ml_signals` → ML predicted Buy/Sell signals

✅ Deliverable: Repo setup + DB schema.

---

### **Phase 2 – Backend APIs & Bollinger Algo (4 hrs)**

* API to fetch historical forex data.
* Implement **Bollinger Bands algo** (Buy/Sell logic).
* API endpoints:

  * `/api/forex` → fetch data
  * `/api/bollinger-signals` → Bollinger trades
  * `/api/ml-signals` → ML trades (initial placeholder for Phase 3)

✅ Deliverable: Backend serving Bollinger data + stub for ML signals.

---

### **Phase 3 – ML Strategy Implementation (5 hrs)**

* Pick **Logistic Regression** (simple, interpretable).
* Steps:

  1. Feature engineering:

     * SMA10, SMA50, EMA20, RSI14, ATR14, BBand deviation, Volatility20, etc.
  2. Label generation:

     * Buy = next period price ↑ threshold
     * Sell = next period price ↓ threshold
  3. Train-test split (e.g., 80/20 historical data).
  4. Train Logistic Regression model to predict Buy/Sell signals.
  5. Store ML predicted signals in Supabase table.

✅ Deliverable: ML model generates Buy/Sell signals on historical data.

---

### **Phase 4 – Frontend Dashboard & Trade Visualization (4 hrs)**

* Candlestick chart with **Bollinger Bands overlay**.
* ML strategy markers (different color arrows/icons).
* Trade blotter table showing:

  * Strategy (Bollinger / ML)
  * Buy/Sell
  * Price executed
  * Profit/Loss
* Live updating panels if streaming API used.

✅ Deliverable: Full visualization of both strategies.

---

### **Phase 5 – Strategy Comparison & Metrics (3 hrs)**

* Calculate & display metrics for each strategy:

  * Total Profit/Loss
  * Win rate (%)
  * Max Drawdown
  * Sharpe ratio (optional)
* Show side-by-side chart or bar chart for comparison.
* Optional: color-coded performance heatmap per currency pair.

✅ Deliverable: Compare Bollinger vs ML strategy visually + metrics.

---

### **Phase 6 – Polish, Deployment, Documentation (2 hrs)**

* Add **Info / Reference Panel**:

  * Explain Bollinger and ML strategy logic.
  * Reference dataset/API.
* Style frontend with Tailwind or shadcn.
* Deploy backend (Railway/Render) + frontend (Vercel/Netlify).
* Add **user authentication** (Supabase Auth).

