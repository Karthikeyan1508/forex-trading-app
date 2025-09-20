import React from 'react';
import LivePricePanel from './components/LivePricePanel';
import CandlestickChart from './components/CandlestickChart';
import TradeBlotter from './components/TradeBlotter';
import StrategyMetrics from './components/StrategyMetrics';

const ComponentTest = () => {
  console.log('LivePricePanel:', LivePricePanel);
  console.log('CandlestickChart:', CandlestickChart);
  console.log('TradeBlotter:', TradeBlotter);
  console.log('StrategyMetrics:', StrategyMetrics);
  
  return (
    <div>
      <p>All components imported successfully:</p>
      <ul>
        <li>LivePricePanel: {typeof LivePricePanel}</li>
        <li>CandlestickChart: {typeof CandlestickChart}</li>
        <li>TradeBlotter: {typeof TradeBlotter}</li>
        <li>StrategyMetrics: {typeof StrategyMetrics}</li>
      </ul>
    </div>
  );
};

export default ComponentTest;
