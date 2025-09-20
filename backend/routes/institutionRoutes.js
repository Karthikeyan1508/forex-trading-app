const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { supabase } = require('../config/supabaseClient');
const router = express.Router();

// Get auto-trades for the institution
router.get('/auto-trades', verifyToken, roleMiddleware(['institution']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('auto_trades')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching auto-trades:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create/Update auto-trading settings
router.post('/auto-trade', verifyToken, roleMiddleware(['institution']), async (req, res) => {
  try {
    const {
      strategy,
      currency_pair,
      is_active = true,
      max_risk_per_trade = 10000,
      stop_loss_pct = 5.0,
      take_profit_pct = 10.0,
      trade_frequency_minutes = 60
    } = req.body;

    if (!strategy || !currency_pair) {
      return res.status(400).json({
        success: false,
        error: 'Strategy and currency pair are required'
      });
    }

    // Check if user already has an auto-trade setup for this pair
    const { data: existing } = await supabase
      .from('auto_trades')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('currency_pair', currency_pair)
      .single();

    let result;

    if (existing) {
      // Update existing auto-trade
      const { data, error } = await supabase
        .from('auto_trades')
        .update({
          strategy,
          is_active,
          max_risk_per_trade,
          stop_loss_pct,
          take_profit_pct,
          trade_frequency_minutes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      result = { data, error };
    } else {
      // Create new auto-trade
      const { data, error } = await supabase
        .from('auto_trades')
        .insert([{
          user_id: req.user.id,
          strategy,
          currency_pair,
          is_active,
          max_risk_per_trade,
          stop_loss_pct,
          take_profit_pct,
          trade_frequency_minutes
        }])
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error.message
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: existing ? 'Auto-trade settings updated' : 'Auto-trade created'
    });
  } catch (error) {
    console.error('Error creating/updating auto-trade:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Toggle auto-trading on/off
router.patch('/auto-trade/:id/toggle', verifyToken, roleMiddleware(['institution']), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const { data, error } = await supabase
      .from('auto_trades')
      .update({
        is_active: is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.user.id) // Ensure user can only modify their own auto-trades
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Auto-trade not found or access denied'
      });
    }

    res.json({
      success: true,
      data: data,
      message: `Auto-trading ${is_active ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    console.error('Error toggling auto-trade:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete auto-trading setup
router.delete('/auto-trade/:id', verifyToken, roleMiddleware(['institution']), async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('auto_trades')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Auto-trade not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Auto-trade deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting auto-trade:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get institution profile (only for institutions)
router.get('/institution/profile', verifyToken, roleMiddleware(['institution']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data || null
    });
  } catch (error) {
    console.error('Error fetching institution profile:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update institution profile
router.put('/institution/profile', verifyToken, roleMiddleware(['institution']), async (req, res) => {
  try {
    const { name, type, license_number, contact_person } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Institution name and type are required'
      });
    }

    // Check if institution profile exists
    const { data: existing } = await supabase
      .from('institutions')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    let result;

    if (existing) {
      // Update existing institution
      const { data, error } = await supabase
        .from('institutions')
        .update({
          name,
          type,
          license_number,
          contact_person,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      result = { data, error };
    } else {
      // Create new institution profile
      const { data, error } = await supabase
        .from('institutions')
        .insert([{
          user_id: req.user.id,
          name,
          type,
          license_number,
          contact_person
        }])
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error.message
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: existing ? 'Institution profile updated' : 'Institution profile created'
    });
  } catch (error) {
    console.error('Error updating institution profile:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
