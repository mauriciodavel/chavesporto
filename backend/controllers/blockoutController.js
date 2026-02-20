// controllers/blockoutController.js
const supabase = require('../config/supabase');

class BlockoutController {
  /**
   * GET /api/blockouts
   * Listar todos os bloqueios de calendário
   */
  async getAllBlockouts(req, res) {
    try {
      const { data, error } = await supabase
        .from('calendar_blockouts')
        .select(`
          *,
          created_by:instructors(id, name, matricula)
        `)
        .order('blockout_start_date', { ascending: true });

      if (error) throw error;

      return res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('❌ Erro ao listar bloqueios:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar bloqueios',
        error: error.message
      });
    }
  }

  /**
   * GET /api/blockouts/date/:date
   * Verificar bloqueios para uma data específica
   * Query params: ?shift=matutino (opcional)
   */
  async getBlockoutsForDate(req, res) {
    try {
      const { date } = req.params;
      const { shift } = req.query;

      // Validar formato da data
      if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Data inválida. Use o formato YYYY-MM-DD'
        });
      }

      // Query base
      let query = supabase
        .from('calendar_blockouts')
        .select('*')
        .lte('blockout_start_date', date)
        .gte('blockout_end_date', date);

      // Adicionar filtro de turno se fornecido
      if (shift) {
        query = query.or(`shift.is.null,shift.eq.${shift}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return res.json({
        success: true,
        data,
        blocked: data.length > 0
      });
    } catch (error) {
      console.error('❌ Erro ao verificar bloqueios:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar bloqueios',
        error: error.message
      });
    }
  }

  /**
   * GET /api/blockouts/date-range
   * Obter bloqueios para um período
   * Query params: ?start=2026-02-01&end=2026-02-28
   */
  async getBlockoutsForDateRange(req, res) {
    try {
      const { start, end } = req.query;

      // Validar datas
      if (!start || !end || !start.match(/^\d{4}-\d{2}-\d{2}$/) || !end.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Datas inválidas. Use o formato YYYY-MM-DD'
        });
      }

      const { data, error } = await supabase
        .from('calendar_blockouts')
        .select('*')
        .lte('blockout_start_date', end)
        .gte('blockout_end_date', start)
        .order('blockout_start_date', { ascending: true });

      if (error) throw error;

      return res.json({
        success: true,
        data,
        count: data.length
      });
    } catch (error) {
      console.error('❌ Erro ao buscar período:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar bloqueios do período',
        error: error.message
      });
    }
  }

  /**
   * POST /api/blockouts
   * Criar novo bloqueio
   * Body: {
   *   blockout_date: "2026-02-17",         // Se single-day
   *   blockout_start_date: "2026-02-17",   // Se período
   *   blockout_end_date: "2026-02-20",     // Se período
   *   shift: "matutino" ou null,
   *   blockout_type: "maintenance|external_event|internal_event|national_holiday|state_holiday|municipal_holiday",
   *   observation: "Descrição",
   *   color: "#FF5733" (opcional)
   * }
   */
  async createBlockout(req, res) {
    try {
      console.log('📝 [createBlockout] Iniciando criação de bloqueio');
      console.log('   Usuário:', req.user);
      
      const instructorId = req.user?.id;
      if (!instructorId) {
        console.error('❌ [createBlockout] ID do usuário não encontrado');
        return res.status(401).json({
          success: false,
          message: 'Usuário não identificado'
        });
      }

      const { blockout_date, blockout_start_date, blockout_end_date, shift, blockout_type, observation, color } = req.body;

      console.log('   Dados recebidos:', {
        blockout_date,
        blockout_start_date,
        blockout_end_date,
        shift,
        blockout_type,
        observation: observation ? observation.substring(0, 50) : 'vazio',
        color
      });

      // Validações
      if (!observation || !blockout_type) {
        return res.status(400).json({
          success: false,
          message: 'observation e blockout_type são obrigatórios'
        });
      }

      // Validar tipo de bloqueio
      const validTypes = ['maintenance', 'external_event', 'internal_event', 'national_holiday', 'state_holiday', 'municipal_holiday'];
      if (!validTypes.includes(blockout_type)) {
        return res.status(400).json({
          success: false,
          message: `blockout_type inválido. Opções: ${validTypes.join(', ')}`
        });
      }

      // Determinar datas
      const startDate = blockout_start_date || blockout_date;
      const endDate = blockout_end_date || blockout_date;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Defina blockout_date ou blockout_start_date/blockout_end_date'
        });
      }

      // Validar range de datas
      if (startDate > endDate) {
        return res.status(400).json({
          success: false,
          message: 'Data inicial não pode ser posterior à data final'
        });
      }

      // Preparar dados
      const blockoutData = {
        blockout_date: startDate,
        blockout_start_date: startDate,
        blockout_end_date: endDate,
        shift: shift && shift !== '' ? shift : null,
        blockout_type,
        observation,
        color: color && color !== '' ? color : null,
        created_by: instructorId
      };

      console.log('   Inserindo dados:', blockoutData);

      const { data, error } = await supabase.admin
        .from('calendar_blockouts')
        .insert([blockoutData])
        .select();

      if (error) {
        console.error('❌ [createBlockout] Erro Supabase:', error);
        throw error;
      }

      console.log('✅ [createBlockout] Bloqueio criado:', data);

      return res.status(201).json({
        success: true,
        message: 'Bloqueio criado com sucesso',
        data: data[0]
      });
    } catch (error) {
      console.error('❌ Erro ao criar bloqueio:', error.message);
      console.error('   Stack:', error.stack);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar bloqueio',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/blockouts/:id
   * Atualizar bloqueio existente
   */
  async updateBlockout(req, res) {
    try {
      const { id } = req.params;
      const { blockout_start_date, blockout_end_date, shift, blockout_type, observation, color } = req.body;

      // Validar ID
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID do bloqueio é obrigatório'
        });
      }

      // Preparar dados de atualização (apenas campos fornecidos)
      const updateData = {};
      if (blockout_start_date) updateData.blockout_start_date = blockout_start_date;
      if (blockout_end_date) updateData.blockout_end_date = blockout_end_date;
      if (shift !== undefined) updateData.shift = shift;
      if (blockout_type) updateData.blockout_type = blockout_type;
      if (observation) updateData.observation = observation;
      if (color !== undefined) updateData.color = color;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum campo para atualizar'
        });
      }

      // Atualizar a data de bloqueio também
      if (blockout_start_date) {
        updateData.blockout_date = blockout_start_date;
      }

      const { data, error } = await supabase.admin
        .from('calendar_blockouts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Bloqueio não encontrado'
        });
      }

      return res.json({
        success: true,
        message: 'Bloqueio atualizado com sucesso',
        data
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar bloqueio:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar bloqueio',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/blockouts/:id
   * Deletar bloqueio
   */
  async deleteBlockout(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID do bloqueio é obrigatório'
        });
      }

      const { error } = await supabase.admin
        .from('calendar_blockouts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.json({
        success: true,
        message: 'Bloqueio deletado com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao deletar bloqueio:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar bloqueio',
        error: error.message
      });
    }
  }

  /**
   * GET /api/blockouts/color-map
   * Obter mapa de cores padrão para cada tipo
   */
  async getColorMap(req, res) {
    const colorMap = {
      maintenance: {
        label: 'Manutenção',
        color: '#FFC107',
        icon: '🔧'
      },
      external_event: {
        label: 'Evento Externo',
        color: '#17A2B8',
        icon: '🏢'
      },
      internal_event: {
        label: 'Evento Interno',
        color: '#6C63FF',
        icon: '📢'
      },
      national_holiday: {
        label: 'Feriado Nacional',
        color: '#DC3545',
        icon: '🇧🇷'
      },
      state_holiday: {
        label: 'Feriado Estadual',
        color: '#FD7E14',
        icon: '🏴'
      },
      municipal_holiday: {
        label: 'Feriado Municipal',
        color: '#6F42C1',
        icon: '🏙️'
      }
    };

    return res.json({
      success: true,
      colorMap
    });
  }
}

module.exports = new BlockoutController();
