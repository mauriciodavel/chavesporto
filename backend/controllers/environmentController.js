// ============================================
// ENVIRONMENT CONTROLLER - Disponibilidade de Ambientes
// ============================================

const supabase = require('../config/supabase');

// Get all environments for availability calendar
exports.getEnvironments = async (req, res) => {
  try {
    console.log('📦 [ENVIRONMENTS] Obtendo ambientes para calendário de disponibilidade');

    const { data: keys, error } = await supabase
      .from('keys')
      .select(`
        id,
        environment,
        location,
        description,
        qr_code
      `)
      .eq('deleted_at', null)
      .order('environment', { ascending: true });

    if (error) {
      throw error;
    }

    console.log(`✅ ${keys?.length || 0} ambiente(s) encontrado(s)`);

    return res.status(200).json({
      success: true,
      message: `${keys?.length || 0} ambiente(s) encontrado(s)`,
      data: keys || []
    });
  } catch (error) {
    console.error('❌ Erro ao obter ambientes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter ambientes',
      error: error.message
    });
  }
};

// Get availability calendar for a specific week
exports.getWeeklyAvailability = async (req, res) => {
  try {
    const { startDate } = req.query;
    
    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate é obrigatório'
      });
    }

    console.log('📅 [ENVIRONMENTS] Obtendo disponibilidade semanal para:', startDate);

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    // Get all keys
    const { data: keys, error: keysError } = await supabase
      .from('keys')
      .select('id, environment, location, description')
      .eq('deleted_at', null)
      .order('environment', { ascending: true });

    if (keysError) throw keysError;

    // Get active reservations for the week
    const { data: reservations, error: resError } = await supabase
      .from('key_reservations')
      .select(`
        id,
        key_id,
        instructor_id,
        reservation_start_date,
        reservation_end_date,
        shift,
        turma,
        status,
        instructors!instructor_id (id, name)
      `)
      .eq('status', 'approved')
      .lte('reservation_start_date', endStr)
      .gte('reservation_end_date', startStr);

    if (resError) throw resError;

    // Get blockouts for the week (maintenance, etc)
    const { data: blockouts, error: blockoutsError } = await supabase
      .from('environment_maintenance')
      .select('id, environment_id, start_date, end_date, reason')
      .lte('start_date', endStr)
      .gte('end_date', startStr);

    if (blockoutsError) throw blockoutsError;

    console.log(`✅ Dados carregados: ${keys?.length} ambientes, ${reservations?.length} reservas, ${blockouts?.length} bloqueios`);

    return res.status(200).json({
      success: true,
      data: {
        environments: keys || [],
        reservations: reservations || [],
        blockouts: blockouts || [],
        weekStart: startStr,
        weekEnd: endStr
      }
    });
  } catch (error) {
    console.error('❌ Erro ao obter disponibilidade semanal:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter disponibilidade',
      error: error.message
    });
  }
};
