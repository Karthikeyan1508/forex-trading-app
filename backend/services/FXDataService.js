const axios = require('axios');
const supabase = require('../supabase');

class FXDataService {
    constructor() {
        this.API_URL = 'https://api.exchangerate-api.com/v4/latest';
        this.BACKUP_API_URL = 'https://api.fxapi.com/v1/latest'; // Backup API
        this.UPDATE_INTERVAL = 30000; // 30 seconds
        this.isRunning = false;
        this.intervalId = null;
        this.lastUpdateTime = null;
        this.errorCount = 0;
        this.maxErrors = 5;
        
        // Major currency pairs to track
        this.majorPairs = [
            'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD',
            'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'CHF/JPY', 'CAD/JPY',
            'AUD/JPY', 'EUR/CHF', 'GBP/CHF', 'AUD/CAD', 'EUR/CAD', 'GBP/CAD',
            'EUR/AUD', 'GBP/AUD'
        ];
    }

    // Start the live data feed
    start() {
        if (this.isRunning) {
            console.log('🟡 FX Data Service is already running');
            return;
        }

        console.log('🟢 Starting FX Data Service...');
        this.isRunning = true;
        this.errorCount = 0;
        
        // Initial fetch
        this.fetchAllRates().then(() => {
            console.log('✅ Initial FX data fetch completed');
        });

        // Set up periodic updates
        this.intervalId = setInterval(async () => {
            try {
                await this.fetchAllRates();
                this.errorCount = 0; // Reset error count on success
            } catch (error) {
                console.error('❌ Error in periodic FX data fetch:', error);
                this.errorCount++;
                
                if (this.errorCount >= this.maxErrors) {
                    console.error('🔴 Too many errors, stopping FX data service');
                    this.stop();
                }
            }
        }, this.UPDATE_INTERVAL);
    }

    // Stop the live data feed
    stop() {
        if (!this.isRunning) {
            console.log('🟡 FX Data Service is not running');
            return;
        }

        console.log('🔴 Stopping FX Data Service...');
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    // Fetch rates for all major pairs
    async fetchAllRates() {
        console.log('📊 Fetching FX rates for all major pairs...');
        
        try {
            // Get rates with USD as base
            const usdRates = await this.fetchRatesFromAPI('USD');
            
            // Get rates with EUR as base for cross pairs
            const eurRates = await this.fetchRatesFromAPI('EUR');
            
            // Process and store all pairs
            const promises = this.majorPairs.map(pair => this.processCurrencyPair(pair, usdRates, eurRates));
            await Promise.all(promises);
            
            this.lastUpdateTime = new Date();
            console.log(`✅ Updated ${this.majorPairs.length} currency pairs at ${this.lastUpdateTime.toISOString()}`);
            
        } catch (error) {
            console.error('❌ Failed to fetch all FX rates:', error);
            throw error;
        }
    }

    // Fetch rates from external API
    async fetchRatesFromAPI(baseCurrency) {
        try {
            const response = await axios.get(`${this.API_URL}/${baseCurrency}`, {
                timeout: 10000 // 10 second timeout
            });
            
            return response.data;
        } catch (error) {
            console.warn(`⚠️ Primary API failed for ${baseCurrency}, trying backup...`);
            
            // Try backup API (if available)
            // Note: You may need to sign up for a backup API service
            throw error;
        }
    }

    // Process individual currency pair
    async processCurrencyPair(symbol, usdRates, eurRates) {
        try {
            const [base, quote] = symbol.split('/');
            let rate = null;

            // Calculate rate based on available data
            if (base === 'USD' && usdRates.rates[quote]) {
                rate = usdRates.rates[quote];
            } else if (quote === 'USD' && usdRates.rates[base]) {
                rate = 1 / usdRates.rates[base];
            } else if (base === 'EUR' && eurRates.rates[quote]) {
                rate = eurRates.rates[quote];
            } else if (quote === 'EUR' && eurRates.rates[base]) {
                rate = 1 / eurRates.rates[base];
            } else {
                // Cross currency calculation
                const baseToUSD = base === 'USD' ? 1 : (usdRates.rates[base] ? 1 / usdRates.rates[base] : null);
                const quoteToUSD = quote === 'USD' ? 1 : (usdRates.rates[quote] ? 1 / usdRates.rates[quote] : null);
                
                if (baseToUSD && quoteToUSD) {
                    rate = baseToUSD / quoteToUSD;
                }
            }

            if (rate) {
                // Simulate bid/ask spread (typically 0.0001 to 0.001 for major pairs)
                const spread = this.calculateSpread(symbol, rate);
                const bidPrice = rate - (spread / 2);
                const askPrice = rate + (spread / 2);

                await this.storeLivePrice(symbol, bidPrice, askPrice);
                await this.storeHistoricalPrice(symbol, rate);
            } else {
                console.warn(`⚠️ Could not calculate rate for ${symbol}`);
            }
        } catch (error) {
            console.error(`❌ Error processing ${symbol}:`, error);
        }
    }

    // Calculate realistic spread for currency pair
    calculateSpread(symbol, rate) {
        const majorPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD'];
        const minorPairs = ['EUR/GBP', 'EUR/JPY', 'GBP/JPY'];
        
        let baseSpread;
        if (majorPairs.includes(symbol)) {
            baseSpread = rate * 0.00002; // 0.2 pips
        } else if (minorPairs.includes(symbol)) {
            baseSpread = rate * 0.00005; // 0.5 pips
        } else {
            baseSpread = rate * 0.0001; // 1 pip
        }

        // Add some random variation
        const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
        return baseSpread * (1 + variation);
    }

    // Store live price in database
    async storeLivePrice(symbol, bidPrice, askPrice) {
        try {
            const { data, error } = await supabase.rpc('update_live_price', {
                p_symbol: symbol,
                p_bid_price: bidPrice,
                p_ask_price: askPrice,
                p_data_source: 'ExchangeRate-API'
            });

            if (error) {
                console.error(`❌ Error storing live price for ${symbol}:`, error);
            }
        } catch (error) {
            console.error(`❌ Database error storing ${symbol}:`, error);
        }
    }

    // Store historical price data
    async storeHistoricalPrice(symbol, price) {
        try {
            // Get currency pair ID
            const { data: pairData, error: pairError } = await supabase
                .from('currency_pairs')
                .select('id')
                .eq('symbol', symbol)
                .single();

            if (pairError || !pairData) {
                console.error(`❌ Currency pair not found: ${symbol}`);
                return;
            }

            const now = new Date();
            const roundedTime = new Date(Math.floor(now.getTime() / 60000) * 60000); // Round to minute

            // Store 1-minute data
            const { error } = await supabase
                .from('fx_price_history')
                .upsert({
                    currency_pair_id: pairData.id,
                    symbol: symbol,
                    open_price: price,
                    high_price: price,
                    low_price: price,
                    close_price: price,
                    volume: 0,
                    timestamp: roundedTime.toISOString(),
                    interval_type: '1m',
                    data_source: 'ExchangeRate-API'
                }, {
                    onConflict: 'currency_pair_id,timestamp,interval_type',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error(`❌ Error storing historical price for ${symbol}:`, error);
            }
        } catch (error) {
            console.error(`❌ Error in storeHistoricalPrice for ${symbol}:`, error);
        }
    }

    // Get current status
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastUpdate: this.lastUpdateTime,
            errorCount: this.errorCount,
            updateInterval: this.UPDATE_INTERVAL,
            trackedPairs: this.majorPairs.length
        };
    }

    // Get specific currency pair data
    async getCurrencyPairData(symbol) {
        try {
            const { data, error } = await supabase
                .from('live_fx_prices')
                .select(`
                    *,
                    currency_pairs (
                        base_currency,
                        quote_currency,
                        display_name
                    )
                `)
                .eq('symbol', symbol)
                .single();

            if (error) {
                console.error(`Error fetching ${symbol}:`, error);
                return null;
            }

            return data;
        } catch (error) {
            console.error(`Error in getCurrencyPairData for ${symbol}:`, error);
            return null;
        }
    }

    // Get all live prices
    async getAllLivePrices() {
        try {
            const { data, error } = await supabase
                .from('live_fx_prices')
                .select(`
                    *,
                    currency_pairs (
                        base_currency,
                        quote_currency,
                        display_name
                    )
                `)
                .eq('is_active', true)
                .order('symbol');

            if (error) {
                console.error('Error fetching all live prices:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in getAllLivePrices:', error);
            return [];
        }
    }

    // Get historical data for charting
    async getHistoricalData(symbol, interval = '1h', limit = 100) {
        try {
            const { data, error } = await supabase
                .from('fx_price_history')
                .select('*')
                .eq('symbol', symbol)
                .eq('interval_type', interval)
                .order('timestamp', { ascending: false })
                .limit(limit);

            if (error) {
                console.error(`Error fetching historical data for ${symbol}:`, error);
                return [];
            }

            return data?.reverse() || [];
        } catch (error) {
            console.error(`Error in getHistoricalData for ${symbol}:`, error);
            return [];
        }
    }
}

module.exports = new FXDataService();
