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

    // Parse dates
    const start = new Date(startDate);
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
    console.log('🔒 Buscando bloqueios com filtros:', { startStr, endStr });
    let blockouts = [];
    
    // Tentar buscar bloqueios de forma segura
    try {
      const { data: blockoutsData, error: blockoutsError } = await supabase
        .from('calendar_blockouts')
        .select('id, blockout_start_date, blockout_end_date, blockout_reason, shift, deleted_at');
      
      if (blockoutsError) {
        console.warn('⚠️  Aviso ao buscar bloqueios:', blockoutsError.message);
        blockouts = [];
      } else {
        console.log(`🔒 Total de bloqueios na tabela calendar_blockouts: ${blockoutsData?.length || 0}`);
        
        // Log de todos os bloqueios para diagnóstico
        if (blockoutsData?.length > 0) {
          console.log('📋 TODOS OS BLOQUEIOS:', blockoutsData.map(b => ({
            id: b.id.substring(0, 8),
            start: b.blockout_start_date,
            end: b.blockout_end_date,
            reason: b.blockout_reason.substring(0, 30),
            shift: b.shift,
            deleted: b.deleted_at
          })));
        }
        
        // Filtrar em JavaScript - comparar como strings YYYY-MM-DD
        blockouts = (blockoutsData || [])
          .filter(b => {
            // Ignorar bloqueios deletados
            if (b.deleted_at) {
              console.log(`  ⏭️  Ignorando deletado: ${b.blockout_start_date}`);
              return false;
            }
            return true;
          })
          .filter(b => {
            // Comparar datas como strings
            const blockoutPasses = b.blockout_start_date <= endStr && b.blockout_end_date >= startStr;
            console.log(`  📅 ${b.blockout_start_date} a ${b.blockout_end_date}: ${blockoutPasses ? '✅ PASSA' : '❌ FORA DO PERÍODO'} (semana: ${startStr} a ${endStr})`);
            return blockoutPasses;
          })
          .map(b => ({
            id: b.id,
            start_date: b.blockout_start_date,
            end_date: b.blockout_end_date,
            reason: b.blockout_reason,
            shift: b.shift
          }));
        
        console.log(`✅ Bloqueios filtrados para semana de ${startStr} a ${endStr}: ${blockouts.length} encontrados`);
        if (blockouts.length > 0) {
          blockouts.forEach(b => {
            console.log(`   - ${b.start_date} a ${b.end_date}: ${b.reason} ${b.shift ? `(${b.shift})` : '(todos os turnos)'}`);
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
