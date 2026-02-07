const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { normalizeSupabaseRecords, normalizeSupabaseRecord, normalizeSupabaseDate } = require('../utils/dateNormalizer');

exports.getAllKeys = async (req, res) => {
  try {
    const { data: keys, error } = await supabase
      .from('keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enriquecer cada chave com informações da última atividade
    const keysWithActivity = await Promise.all(keys.map(async (key) => {
      try {
        const { data: history, error: historyError } = await supabase
          .from('key_history')
          .select('*, instructors(name)')
          .eq('key_id', key.id)
          .eq('status', 'active')
          .order('withdrawn_at', { ascending: false })
          .limit(1);

        // Se há histórico, pega o primeiro (não usar .single())
        const activeHistory = !historyError && history && history.length > 0 ? history[0] : null;

        return {
          ...key,
          lastActivity: activeHistory ? {
            instructor: activeHistory.instructors?.name,
            withdrawnAt: normalizeSupabaseDate(activeHistory.withdrawn_at)
          } : null
        };
      } catch (err) {
        console.error(`Erro ao buscar histórico para chave ${key.id}:`, err);
        // Retornar a chave sem histórico em caso de erro
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
    console.error('Erro ao buscar chaves:', error);
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
      const { data: history, error: historyError } = await supabase
        .from('key_history')
        .select('*, instructors(name)')
        .eq('key_id', key.id)
        .eq('status', 'active')
        .order('withdrawn_at', { ascending: false })
        .limit(1);

      // Se há histórico, pega o primeiro
      if (!historyError && history && history.length > 0) {
        lastActivity = {
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

    const { data: key, error } = await supabase
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

    const { error } = await supabase
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

    // Atualizar status da chave
    await supabase
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
    const { data: history } = await supabase
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

    // Atualizar registro no banco
    const { error: updateError } = await supabase
      .from('key_history')
      .update(updateData)
      .eq('id', history.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar histórico:', updateError);
      throw updateError;
    }

    console.log('✅ Histórico atualizado com sucesso');

    // Atualizar status da chave
    const { error: keyError } = await supabase
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
