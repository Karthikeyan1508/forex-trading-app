import React, { useEffect, useState } from "react";


const LivePricePanel = ({ baseCurrency = "USD" }) => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAllPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/forex/all?base=${baseCurrency}`);
      if (!response.ok) {
        throw new Error('Failed to fetch from backend');
      }
      const data = await response.json();
      if (data.rates) {
        setRates(data.rates);
        setLastUpdate(data.lastUpdate);
      } else {
        throw new Error(data.error || 'API error');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch live data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPrices();
    const interval = setInterval(fetchAllPrices, 10000); // refresh every 10 sec
    return () => clearInterval(interval);
  }, [baseCurrency]);

  return (
    <div style={styles.panel}>
      <h2>Live Forex Prices ({baseCurrency} base)</h2>
      {loading && <p>⏳ Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {rates.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={styles.th}>Pair</th>
              <th style={styles.th}>Rate</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((r) => (
              <tr key={r.pair}>
                <td style={styles.td}>{r.pair}</td>
                <td style={styles.td}>{r.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {lastUpdate && (
        <p style={{ fontSize: '0.9em', color: '#666', marginTop: 8 }}>
          Last Update (API): {lastUpdate}
        </p>
      )}
    </div>
  );
};

// simple inline styling
const styles = {
  panel: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "16px",
    maxWidth: "600px",
    background: "#f9f9f9",
    margin: "20px auto",
    fontFamily: "Arial, sans-serif",
  },
  th: {
    borderBottom: "1px solid #ccc",
    padding: "8px",
    textAlign: "left",
    background: "#f1f1f1",
  },
  td: {
    borderBottom: "1px solid #eee",
    padding: "8px",
  },
};

export default LivePricePanel;
