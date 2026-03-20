const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { normalizeSupabaseRecords, normalizeSupabaseRecord, normalizeSupabaseDate } = require('../utils/dateNormalizer');
const { isWithinAnyWithdrawWindow, isWithinWithdrawWindow, getWithdrawWindowInfo } = require('../utils/shiftTimes');

exports.getAllKeys = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const instructorId = req.user?.id;

    // Se for admin, retorna TODAS as chaves sem filtro de horário
    if (userRole === 'admin') {
      return await fetchAllKeys(res);
    }

    // Se for usuário comum, retorna apenas chaves dentro da janela de retirada
    return await fetchAvailableKeysForUser(res, instructorId);
  } catch (error) {
    console.error('Erro ao buscar chaves:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar chaves',
      error: error.message
    });
  }
};

/**
 * Busca todas as chaves (sem filtro de horário) - para admin
 */
const fetchAllKeys = async (res) => {
  try {
    const { data: keys, error } = await supabase
      .from('keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enriquecer cada chave com informações da última atividade
    const keysWithActivity = await Promise.all(keys.map(async (key) => {
      try {
        const { data: history, error: historyError } = await supabase.admin
          .from('key_history')
          .select('*, instructors(name)')
          .eq('key_id', key.id)
          .eq('status', 'active')
          .order('withdrawn_at', { ascending: false })
          .limit(1);

        const activeHistory = !historyError && history && history.length > 0 ? history[0] : null;

        return {
          ...key,
          lastActivity: activeHistory ? {
            instructor: activeHistory.instructors?.name,
            instructor_id: activeHistory.instructor_id,
            withdrawnAt: normalizeSupabaseDate(activeHistory.withdrawn_at)
          } : null
        };
      } catch (err) {
        console.error(`Erro ao buscar histórico para chave ${key.id}:`, err);
        return {
          ...key,
          lastActivity: null
        };
      }
    }));

    res.json({
      success: true,
      data: keysWithActivity,
      admin: true
    });
  } catch (error) {
    console.error('Erro ao buscar todas as chaves:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar chaves',
      error: error.message
    });
  }
};

/**
 * Busca chaves disponíveis para o usuário (com filtro de horário)
 * Inclui chaves disponíveis E chaves com reserva aprovada
 */
const fetchAvailableKeysForUser = async (res, instructorId) => {
  try {
    // Verificar se está dentro de alguma janela de retirada
    const isAvailableNow = isWithinAnyWithdrawWindow();
    const windowInfo = getWithdrawWindowInfo();

    // Obter data de hoje em formato YYYY-MM-DD (Brasília)
    // Usando Intl.DateTimeFormat com locale en-CA que retorna em formato ISO
    const today = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
    const todayString = formatter.format(today);

    console.log('📅 Data de hoje (Brasília):', todayString, 'Hora atual:', windowInfo.currentTime);

    // 1. Buscar APENAS reservas aprovadas para este instrutor que incluam hoje
    const { data: reservations, error: reservError } = await supabase
      .from('key_reservations')
      .select('*, keys(*)')
      .eq('instructor_id', instructorId)
      .eq('status', 'approved')
      .lte('reservation_start_date', todayString)
      .gte('reservation_end_date', todayString);

    if (reservError) throw reservError;

    console.log(`📋 Reservas encontradas para ${instructorId} em ${todayString}:`, reservations?.length || 0);
    
    // 2. Filtrar apenas as reservas que estão dentro da janela de retirada do turno
    const keysToDisplay = [];

    if (reservations && reservations.length > 0) {
      for (const reservation of reservations) {
        // Verificar se o horário atual está dentro da janela de retirada do turno da reserva
        console.log(`   📍 Verificando turno "${reservation.shift}" para chave "${reservation.keys?.environment}"...`);
        if (isWithinWithdrawWindow(reservation.shift)) {
          console.log(`   ✅ Turno "${reservation.shift}" está dentro da janela - ADICIONANDO chave`);

          if (reservation.keys) {
            keysToDisplay.push({
              ...reservation.keys,
              reservedUntil: `${todayString} ${reservation.shift}`,
              hasReservation: true
            });
          }
        } else {
          console.log(`   ❌ Turno "${reservation.shift}" está FORA da janela de retirada - NÃO adicionando`);
        }
      }
    }

    console.log(`📦 Total de chaves a exibir: ${keysToDisplay.length} (só com reserva aprovada dentro da janela)`);

    // Se não há reservas válidas no horário
    if (keysToDisplay.length === 0) {
      return res.json({
        success: true,
        data: [],
        withdrawalStatus: {
          available: false,
          currentTime: windowInfo.currentTime,
          reservedToday: reservations && reservations.length > 0,
          message: reservations && reservations.length > 0
            ? 'Chaves reservadas fora do horário permitido agora'
            : 'Fora do horário permitido para retirada de chaves'
        }
      });
    }

    // Enriquecer cada chave com informações da última atividade
    const keysWithActivity = await Promise.all(keysToDisplay.map(async (key) => {
      try {
        const { data: history, error: historyError } = await supabase.admin
          .from('key_history')
          .select('*, instructors(name)')
          .eq('key_id', key.id)
          .eq('status', 'active')
          .order('withdrawn_at', { ascending: false })
          .limit(1);

        const activeHistory = !historyError && history && history.length > 0 ? history[0] : null;

        return {
          ...key,
          lastActivity: activeHistory ? {
            instructor: activeHistory.instructors?.name,
            instructor_id: activeHistory.instructor_id,
            withdrawnAt: normalizeSupabaseDate(activeHistory.withdrawn_at)
          } : null
        };
      } catch (err) {
        console.error(`Erro ao buscar histórico para chave ${key.id}:`, err);
        return {
          ...key,
          lastActivity: null
        };
      }
    }));

    res.json({
      success: true,
      data: keysWithActivity,
      admin: false,
      withdrawalStatus: {
        available: true,
        currentTime: windowInfo.currentTime,
        availableShifts: windowInfo.availableShifts,
        message: 'Chaves disponíveis para retirada'
      }
    });
  } catch (error) {
    console.error('Erro ao buscar chaves disponíveis:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar chaves',
      error: error.message
    });
  }
};

exports.getAllKeysUnfiltered = async (req, res) => {
  try {
    // Retorna TODAS as chaves independente de status ou horário
    // Usado para página de reservas onde usuário precisa ver todas as chaves
    const { data: keys, error } = await supabase
      .from('keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enriquecer cada chave com informações da última atividade
    const keysWithActivity = await Promise.all(keys.map(async (key) => {
      try {
        const { data: history, error: historyError } = await supabase.admin
          .from('key_history')
          .select('*, instructors(name)')
          .eq('key_id', key.id)
          .eq('status', 'active')
          .order('withdrawn_at', { ascending: false })
          .limit(1);

        const activeHistory = !historyError && history && history.length > 0 ? history[0] : null;

        return {
          ...key,
          lastActivity: activeHistory ? {
            instructor_id: activeHistory.instructor_id,
            instructor: activeHistory.instructors?.name,
            withdrawnAt: normalizeSupabaseDate(activeHistory.withdrawn_at)
          } : null
        };
      } catch (err) {
        console.error(`Erro ao buscar histórico para chave ${key.id}:`, err);
        return {
          ...key,
          lastActivity: null
        };
      }
    }));

    res.json({
      success: true,
      data: keysWithActivity
    });
  } catch (error) {
    console.error('Erro ao buscar todas as chaves:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar chaves',
      error: error.message
    });
  }
};

exports.getKeyById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: key, error } = await supabase
      .from('keys')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !key) {
      return res.status(404).json({
        success: false,
        message: 'Chave não encontrada'
      });
    }

    res.json({
      success: true,
      data: key
    });
  } catch (error) {
    console.error('Erro ao buscar chave:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar chave',
      error: error.message
    });
  }
};

exports.getKeyByQRCode = async (req, res) => {
  try {
    const { qrCode } = req.body;

    const { data: key, error } = await supabase
      .from('keys')
      .select('*')
      .eq('qr_code', qrCode)
      .single();

    if (error || !key) {
      return res.status(404).json({
        success: false,
        message: 'Chave não encontrada'
      });
    }

    // Buscar última atividade se chave estiver em uso
    let lastActivity = null;
    if (key.status === 'in_use') {
      const { data: history, error: historyError } = await supabase.admin
        .from('key_history')
        .select('*, instructors(name)')
        .eq('key_id', key.id)
        .eq('status', 'active')
        .order('withdrawn_at', { ascending: false })
        .limit(1);

      // Se há histórico, pega o primeiro
      if (!historyError && history && history.length > 0) {
        lastActivity = {
          instructor_id: history[0].instructor_id,
          instructor: history[0].instructors?.name,
          withdrawnAt: normalizeSupabaseDate(history[0].withdrawn_at)
        };
      }
    }

    res.json({
      success: true,
      data: {
        ...key,
        lastActivity
      }
    });
  } catch (error) {
    console.error('Erro ao buscar chave por QR:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar chave',
      error: error.message
    });
  }
};

exports.createKey = async (req, res) => {
  try {
    const { environment, description, location, technicalArea } = req.body;

    if (!environment || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios não preenchidos'
      });
    }

    const keyId = uuidv4();
    const qrCode = `KEY-${keyId}`;

    // Gerar QR Code
    const qrCodeImage = await QRCode.toDataURL(qrCode);

    const { data: key, error } = await supabase
      .from('keys')
      .insert({
        id: keyId,
        qr_code: qrCode,
        environment,
        description,
        location,
        technical_area: technicalArea,
        status: 'available',
        qr_code_image: qrCodeImage
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Chave criada com sucesso',
      data: key
    });
  } catch (error) {
    console.error('Erro ao criar chave:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar chave',
      error: error.message
    });
  }
};

exports.updateKey = async (req, res) => {
  try {
    const { id } = req.params;
    const { environment, description, location, technicalArea, status } = req.body;

    const { data: key, error } = await supabase.admin
      .from('keys')
      .update({
        environment: environment || undefined,
        description: description || undefined,
        location: location || undefined,
        technical_area: technicalArea || undefined,
        status: status || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Chave atualizada com sucesso',
      data: key
    });
  } catch (error) {
    console.error('Erro ao atualizar chave:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar chave',
      error: error.message
    });
  }
};

exports.deleteKey = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.admin
      .from('keys')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Chave deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar chave:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar chave',
      error: error.message
    });
  }
};

exports.withdrawKey = async (req, res) => {
  try {
    const { id } = req.params;
    const instructorId = req.user.id;
    const userRole = req.user.role;

    // Buscar chave
    const { data: key } = await supabase
      .from('keys')
      .select('*')
      .eq('id', id)
      .single();

    if (!key) {
      return res.status(404).json({
        success: false,
        message: 'Chave não encontrada'
      });
    }

    if (key.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Chave não está disponível para retirada'
      });
    }

    // Validar horário para admins - PERMITIR sempre
    // Para usuários comuns - VALIDAR se está dentro da janela de retirada
    if (userRole !== 'admin') {
      const isAvailableNow = isWithinAnyWithdrawWindow();
      if (!isAvailableNow) {
        const windowInfo = getWithdrawWindowInfo();
        return res.status(403).json({
          success: false,
          message: 'Fora do horário permitido para retirada de chaves',
          details: windowInfo
        });
      }
    }

    // Atualizar status da chave (usar admin para bypass de RLS/policies)
    await supabase.admin
      .from('keys')
      .update({ status: 'in_use', updated_at: new Date().toISOString() })
      .eq('id', id);

    // Criar registro de retirada
    const { data: history, error } = await supabase
      .from('key_history')
      .insert({
        id: uuidv4(),
        key_id: id,
        instructor_id: instructorId,
        withdrawn_at: new Date().toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    // Normalizar datas para resposta
    const normalizedHistory = normalizeSupabaseRecord(history);

    res.json({
      success: true,
      message: 'Chave retirada com sucesso',
      data: normalizedHistory
    });
  } catch (error) {
    console.error('Erro ao retirar chave:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao retirar chave',
      error: error.message
    });
  }
};

exports.returnKey = async (req, res) => {
  try {
    const { id } = req.params;
    const { observation } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Buscar registro ativo de retirada
    // Usar supabase.admin para bypassar RLS (auth.uid() não funciona com JWT customizado)
    // Backend valida autorização na linha 566
    const { data: history } = await supabase.admin
      .from('key_history')
      .select('*')
      .eq('key_id', id)
      .eq('status', 'active')
      .order('withdrawn_at', { ascending: false })
      .limit(1)
      .single();

    if (!history) {
      return res.status(400).json({
        success: false,
        message: 'Chave não possui registro de retirada ativa'
      });
    }

    // Verificar autorização: apenas o instructor que retirou OU admin podem devolver
    if (history.instructor_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas o usuário que retirou a chave ou um administrador pode devolvê-la'
      });
    }

    // Apenas admin pode adicionar observação
    if (observation && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem adicionar observações'
      });
    }

    const returnedAt = new Date().toISOString();

    // Preparar dados para atualização
    const updateData = {
      returned_at: returnedAt,
      status: 'returned'
    };

    // Adicionar observation se foi fornecida pelo usuário (apenas admin)
    if (observation) {
      updateData.observation = observation;
      console.log('📝 Observation adicionada:', observation.substring(0, 50) + '...');
    }

    console.log('🔄 Atualizando histórico:', {
      historyId: history.id,
      keyId: id,
      status: updateData.status,
      returned_at: returnedAt,
      observation: observation ? '(preenchida)' : '(vazia)'
    });

    // Atualizar registro no banco (usar admin para bypass de RLS/policies)
    const { error: updateError } = await supabase.admin
      .from('key_history')
      .update(updateData)
      .eq('id', history.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar histórico:', updateError);
      throw updateError;
    }

    console.log('✅ Histórico atualizado com sucesso');

    // Atualizar status da chave (usar admin para bypass de RLS/policies)
    const { error: keyError } = await supabase.admin
      .from('keys')
      .update({ status: 'available', updated_at: returnedAt })
      .eq('id', id);

    if (keyError) {
      console.error('❌ Erro ao atualizar chave:', keyError);
      throw keyError;
    }

    console.log('✅ Chave marcada como disponível');

    res.json({
      success: true,
      message: 'Chave devolvida com sucesso',
      returnedAt
    });
  } catch (error) {
    console.error('Erro ao devolver chave:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao devolver chave',
      error: error.message
    });
  }
};
