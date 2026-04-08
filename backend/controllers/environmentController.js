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

    // Helper function to format date as YYYY-MM-DD without timezone conversion
    const formatDateLocal = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Parse dates - IMPORTANTE: parse da string YYYY-MM-DD é interpretado como UTC
    // Então preenchemos com midnight local time
    const [year, month, day] = startDate.split('-');
    const start = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const startStr = formatDateLocal(start);
    const endStr = formatDateLocal(end);

    // Validar datas
    if (!startStr || !endStr || startStr === 'Invalid Date' || endStr === 'Invalid Date') {
      console.error('❌ Datas inválidas:', { startStr, endStr });
      return res.status(400).json({
        success: false,
        message: 'Data inválida',
        debug: { startDate, startStr, endStr }
      });
    }

    console.log('✅ Datas formatadas:', { startStr, endStr });

    // Get all keys
    const { data: keys, error: keysError } = await supabase
      .from('keys')
      .select('id, environment, location, description')
      .is('deleted_at', null)
      .order('environment', { ascending: true });

    if (keysError) throw keysError;

    // Get active reservations for the week
    console.log('📋 Buscando reservas...');
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
      .eq('status', 'approved');

    if (resError) {
      console.error('❌ Erro ao buscar reservas:', resError);
      throw resError;
    }

    // Filtrar em JavaScript em vez de Supabase
    const filteredReservations = (reservations || []).filter(r => {
      if (!r.reservation_start_date || !r.reservation_end_date) return false;
      const rStart = new Date(r.reservation_start_date);
      const rEnd = new Date(r.reservation_end_date);
      const weekStart = new Date(startStr);
      const weekEnd = new Date(endStr);
      return rStart <= weekEnd && rEnd >= weekStart;
    });

    console.log(`📋 Found ${reservations?.length} total reservations, ${filteredReservations.length} in this week`);

    // Get blockouts for the week (maintenance, etc)
    console.log('🔒 [BLOCKOUTS] Buscando bloqueios sem filtro original...');
    let blockouts = [];
    
    // Tentar buscar bloqueios de forma segura
    try {
      // IMPORTANTE: Usar mesma lógica que blockoutController.getBlockoutsForDateRange
      const { data: blockoutsData, error: blockoutsError } = await supabase
        .from('calendar_blockouts')
        .select('id, blockout_start_date, blockout_end_date, observation, blockout_type, shift')
        .lte('blockout_start_date', endStr)
        .gte('blockout_end_date', startStr);
      
      if (blockoutsError) {
        console.warn('⚠️  Aviso ao buscar bloqueios:', blockoutsError.message);
        blockouts = [];
      } else {
        console.log(`🔒 [BLOCKOUTS] Total de bloqueios na tabela (filtrados): ${blockoutsData?.length || 0}`);
        
        // Filtrar deletados em JavaScript
        blockouts = (blockoutsData || [])
          .map(b => ({
            id: b.id,
            start_date: b.blockout_start_date,
            end_date: b.blockout_end_date,
            reason: b.observation || b.blockout_type,
            shift: b.shift,
            type: b.blockout_type  // Adicionar tipo para exibição correta no frontend
          }));
        
        console.log(`✅ [BLOCKOUTS] Bloqueios após filtro: ${blockouts.length} encontrados para semana ${startStr} a ${endStr}`);
        if (blockouts.length > 0) {
          blockouts.forEach(b => {
            console.log(`   - ${b.start_date} a ${b.end_date}: ${b.reason}`);
          });
        }
      }
    } catch (err) {
      console.error('❌ Erro ao buscar bloqueios:', err.message);
      blockouts = [];
    }

    return res.status(200).json({
      success: true,
      data: {
        environments: keys || [],
        reservations: filteredReservations || [],
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
