const supabase = require('../config/supabase');
const { normalizeSupabaseRecords, normalizeSupabaseDate } = require('../utils/dateNormalizer');
const { isAfterWithdrawWindow } = require('../utils/shiftTimes');

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
    // Obter data de hoje em formato YYYY-MM-DD (Brasília)
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
    const todayString = formatter.format(new Date());

    console.log(`\n📅 Verificando atrasos para ${todayString}`);

    // 1. Buscar TODAS as chaves não devolvidas (status = 'active')
    const { data: activeKeys, error } = await supabase
      .from('key_history')
      .select(`
        *,
        keys(id, environment, description, location),
        instructors(id, name, matricula, email)
      `)
      .eq('status', 'active');

    if (error) throw error;

    if (!activeKeys || activeKeys.length === 0) {
      console.log('✓ Nenhuma chave ativa encontrada');
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }

    console.log(`📦 Encontradas ${activeKeys.length} chave(s) ativa(s)`);

    // 2. Para cada chave ativa, buscar sua reserva e verificar se está em atraso
    const lateReturns = [];

    for (const keyHistory of activeKeys) {
      try {
        // Buscar a reserva correspondente que já terminou (a chave deveria ter sido devolvida)
        const { data: reservation, error: resError } = await supabase
          .from('key_reservations')
          .select('*')
          .eq('key_id', keyHistory.key_id)
          .eq('instructor_id', keyHistory.instructor_id)
          .eq('status', 'approved')
          .lte('reservation_end_date', todayString)  // Reserva já terminou
          .order('reservation_end_date', { ascending: false })  // Pega a mais recente
          .limit(1)
          .single();

        if (resError && resError.code !== 'PGRST116') {
          // PGRST116 = no rows found, é esperado
          console.warn(`⚠️ Erro ao buscar reserva para chave ${keyHistory.key_id}:`, resError);
          continue;
        }

        // Se não encontrou reserva, pular (chave órfã)
        if (!reservation) {
          console.log(`   Chave ${keyHistory.keys.environment}: sem reserva finalizada anterior`);
          continue;
        }

        // 3. Verificar se PASSOU do fim da janela de retirada
        let hasPassedWindow = false;
        
        // Se a data de fim da reserva é ONTEM ou antes, definitivamente passou do horário
        if (reservation.reservation_end_date < todayString) {
          hasPassedWindow = true;
          console.log(`   ⏰ Reserva era para ${reservation.reservation_end_date}, já passou (hoje é ${todayString})`);
        } else if (reservation.reservation_end_date === todayString) {
          // Se a reserva é de HOJE, verifica a hora atual
          hasPassedWindow = isAfterWithdrawWindow(reservation.shift);
          console.log(`   ⏰ Reserva é para hoje, verificando horário...`);
        }

        if (hasPassedWindow) {
          console.log(`   ⏰ Chave ${keyHistory.keys.environment} (${reservation.shift}): EM ATRASO!`);
          lateReturns.push({
            ...keyHistory,
            reservation_shift: reservation.shift,
            reservation_start_date: reservation.reservation_start_date,
            reservation_end_date: reservation.reservation_end_date
          });
        } else {
          console.log(`   ✅ Chave ${keyHistory.keys.environment} (${reservation.shift}): ainda dentro da janela`);
        }
      } catch (err) {
        console.error(`   ❌ Erro ao processar chave ${keyHistory.key_id}:`, err);
      }
    }

    // Normalizar datas
    const normalizedReturns = normalizeSupabaseRecords(lateReturns);

    console.log(`\n✓ Verificação concluída. Chaves em atraso: ${normalizedReturns.length}`);

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

/**
 * Retorna chaves em atraso do instrutor logado
 * para que ele possa devolvê-las
 */
exports.getMyLateReturns = async (req, res) => {
  try {
    const instructorId = req.user?.id;
    
    if (!instructorId) {
      return res.status(401).json({
        success: false,
        message: 'Instrutor não autenticado'
      });
    }

    // Obter data de hoje em formato YYYY-MM-DD (Brasília)
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
    const todayString = formatter.format(new Date());

    console.log(`\n👤 Verificando atrasos do instrutor ${instructorId} para ${todayString}`);

    // 1. Buscar chaves não devolvidas DESTE instrutor (status = 'active')
    const { data: activeKeys, error } = await supabase
      .from('key_history')
      .select(`
        *,
        keys(id, environment, description, location),
        instructors(id, name)
      `)
      .eq('status', 'active')
      .eq('instructor_id', instructorId);

    if (error) throw error;

    if (!activeKeys || activeKeys.length === 0) {
      console.log('✓ Nenhuma chave ativa deste instrutor');
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }

    console.log(`📦 Encontradas ${activeKeys.length} chave(s) ativa(s) deste instrutor`);

    // 2. Para cada chave ativa, buscar sua reserva e verificar se está em atraso
    const lateReturns = [];

    for (const keyHistory of activeKeys) {
      try {
        // Buscar a reserva correspondente que já terminou (a chave deveria ter sido devolvida)
        const { data: reservation, error: resError } = await supabase
          .from('key_reservations')
          .select('*')
          .eq('key_id', keyHistory.key_id)
          .eq('instructor_id', instructorId)
          .eq('status', 'approved')
          .lte('reservation_end_date', todayString)  // Reserva já terminou
          .order('reservation_end_date', { ascending: false })  // Pega a mais recente
          .limit(1)
          .single();

        if (resError && resError.code !== 'PGRST116') {
          console.warn(`⚠️ Erro ao buscar reserva:`, resError.message);
          continue;
        }

        if (!reservation) {
          console.log(`   Chave ${keyHistory.keys.environment}: sem reserva finalizada anterior`);
          continue;
        }

        // 3. Verificar se PASSOU do fim da janela de retirada
        let hasPassedWindow = false;
        
        // Se a data de fim da reserva é ONTEM ou antes, definitivamente passou do horário
        if (reservation.reservation_end_date < todayString) {
          hasPassedWindow = true;
          console.log(`   ⏰ Reserva era para ${reservation.reservation_end_date}, já passou (hoje é ${todayString})`);
        } else if (reservation.reservation_end_date === todayString) {
          // Se a reserva é de HOJE, verifica a hora atual
          hasPassedWindow = isAfterWithdrawWindow(reservation.shift);
          console.log(`   ⏰ Reserva é para hoje, verificando horário...`);
        }

        if (hasPassedWindow) {
          console.log(`   ⏰ Chave ${keyHistory.keys.environment} (${reservation.shift}): EM ATRASO!`);
          
          // Determinar status do alerta
          let alertStatus = 'first_alert';
          if (keyHistory.email_reminder_sent_at) {
            alertStatus = 'reminder_sent';
          } else if (!keyHistory.email_first_alert_sent_at) {
            alertStatus = 'not_sent';
          }
          
          lateReturns.push({
            ...keyHistory,
            reservation_shift: reservation.shift,
            isLate: true,
            alert_status: alertStatus
          });
        }
      } catch (err) {
        console.error(`   ❌ Erro ao processar chave:`, err.message);
      }
    }

    // Normalizar datas
    const normalizedReturns = normalizeSupabaseRecords(lateReturns);

    console.log(`✓ Instrutor tem ${normalizedReturns.length} chave(s) em atraso`);

    res.json({
      success: true,
      data: normalizedReturns,
      count: normalizedReturns.length
    });
  } catch (error) {
    console.error('Erro ao buscar minhas devoluções em atraso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar devoluções em atraso',
      error: error.message
    });
  }
};
