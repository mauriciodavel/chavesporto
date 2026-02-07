const supabase = require('../config/supabase');
const { normalizeSupabaseRecords } = require('../utils/dateNormalizer');

exports.getHistory = async (req, res) => {
  try {
    const { keyId, instructorId, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('key_history')
      .select('*, keys(environment, description, location), instructors(name, matricula)')
      .order('withdrawn_at', { ascending: false });

    if (keyId) {
      query = query.eq('key_id', keyId);
    }

    if (instructorId) {
      query = query.eq('instructor_id', instructorId);
    }

    const { data: history, error } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Normalizar datas para garantir que sejam interpretadas como UTC no frontend
    const normalizedHistory = normalizeSupabaseRecords(history);

    res.json({
      success: true,
      data: normalizedHistory,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: normalizedHistory.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico',
      error: error.message
    });
  }
};

exports.getHistoryByKey = async (req, res) => {
  try {
    const { keyId } = req.params;

    const { data: history, error } = await supabase
      .from('key_history')
      .select('*, instructors(name, matricula)')
      .eq('key_id', keyId)
      .order('withdrawn_at', { ascending: false });

    if (error) throw error;

    // Normalizar datas
    const normalizedHistory = normalizeSupabaseRecords(history);

    res.json({
      success: true,
      data: normalizedHistory
    });
  } catch (error) {
    console.error('Erro ao buscar histórico da chave:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico',
      error: error.message
    });
  }
};

exports.getHistoryByInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const { data: history, error } = await supabase
      .from('key_history')
      .select('*, keys(environment, description, location)')
      .eq('instructor_id', instructorId)
      .order('withdrawn_at', { ascending: false });

    if (error) throw error;

    // Normalizar datas
    const normalizedHistory = normalizeSupabaseRecords(history);

    res.json({
      success: true,
      data: normalizedHistory
    });
  } catch (error) {
    console.error('Erro ao buscar histórico do instrutor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico',
      error: error.message
    });
  }
};

exports.getLateReturns = async (req, res) => {
  try {
    // Buscar devoluções em atraso (não devolvidas após fim do expediente)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(7, 0, 0, 0); // início do próximo dia útil

    const { data: lateReturns, error } = await supabase
      .from('key_history')
      .select('*, keys(environment, description), instructors(name, email)')
      .eq('status', 'active')
      .lt('withdrawn_at', tomorrow.toISOString());

    if (error) throw error;

    // Normalizar datas
    const normalizedReturns = normalizeSupabaseRecords(lateReturns);

    res.json({
      success: true,
      data: normalizedReturns,
      count: normalizedReturns.length
    });
  } catch (error) {
    console.error('Erro ao buscar devoluções em atraso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar devoluções em atraso',
      error: error.message
    });
  }
};
