const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// ============================================
// GET - Listar todas as turmas com filtro
// ============================================
exports.getAllTurmas = async (req, res) => {
  try {
    const { status = 'ativas', sortBy = 'codigo_turma' } = req.query;

    let query = supabase.from('turmas').select('*');

    // Aplicar filtro de status
    if (status === 'ativas') {
      query = query.eq('ativo', true);
    } else if (status === 'inativas') {
      query = query.eq('ativo', false);
    }
    // Se status === 'todas', não aplicar filtro

    // Aplicar ordenação
    if (sortBy === 'codigo_turma') {
      query = query.order('codigo_turma', { ascending: true });
    } else if (sortBy === 'curso') {
      query = query.order('curso', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Excluir deleted
    query = query.is('deleted_at', null);

    const { data: turmas, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: turmas || [],
      count: turmas?.length || 0
    });
  } catch (error) {
    console.error('Erro ao listar turmas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar turmas',
      error: error.message
    });
  }
};

// ============================================
// GET - Buscar uma turma por ID
// ============================================
exports.getTurmaById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: turma, error } = await supabase
      .from('turmas')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Turma não encontrada'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: turma
    });
  } catch (error) {
    console.error('Erro ao buscar turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar turma',
      error: error.message
    });
  }
};

// ============================================
// POST - Criar nova turma
// ============================================
exports.createTurma = async (req, res) => {
  try {
    const { codigoTurma, curso, ativo = true, unidadesCurriculares } = req.body;

    // Validar campos obrigatórios
    if (!codigoTurma || !curso) {
      return res.status(400).json({
        success: false,
        message: 'Código da turma e curso são obrigatórios'
      });
    }

    // Validar comprimento do código
    if (codigoTurma.length > 15) {
      return res.status(400).json({
        success: false,
        message: 'Código da turma não pode ter mais de 15 caracteres'
      });
    }

    // Validar comprimento do curso
    if (curso.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Curso não pode ter mais de 255 caracteres'
      });
    }

    // Validar unidades curriculares (se fornecidas)
    if (unidadesCurriculares && unidadesCurriculares.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Unidades curriculares não podem ter mais de 150 caracteres'
      });
    }

    const turmaId = uuidv4();

    const { data: turma, error } = await supabase
      .from('turmas')
      .insert({
        id: turmaId,
        codigo_turma: codigoTurma.trim(),
        curso: curso.trim(),
        ativo: ativo,
        unidades_curriculares: unidadesCurriculares ? unidadesCurriculares.trim() : null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Este código de turma já está cadastrado'
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Turma criada com sucesso',
      data: turma
    });
  } catch (error) {
    console.error('Erro ao criar turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar turma',
      error: error.message
    });
  }
};

// ============================================
// PUT - Atualizar turma
// ============================================
exports.updateTurma = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigoTurma, curso, ativo, unidadesCurriculares } = req.body;

    // Validar comprimentos se fornecidos
    if (codigoTurma && codigoTurma.length > 15) {
      return res.status(400).json({
        success: false,
        message: 'Código da turma não pode ter mais de 15 caracteres'
      });
    }

    if (curso && curso.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Curso não pode ter mais de 255 caracteres'
      });
    }

    if (unidadesCurriculares && unidadesCurriculares.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Unidades curriculares não podem ter mais de 150 caracteres'
      });
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (codigoTurma) updateData.codigo_turma = codigoTurma.trim();
    if (curso) updateData.curso = curso.trim();
    if (ativo !== undefined) updateData.ativo = ativo;
    if (unidadesCurriculares !== undefined) {
      updateData.unidades_curriculares = unidadesCurriculares ? unidadesCurriculares.trim() : null;
    }

    const { data: turma, error } = await supabase.admin
      .from('turmas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Este código de turma já está cadastrado'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      message: 'Turma atualizada com sucesso',
      data: turma
    });
  } catch (error) {
    console.error('Erro ao atualizar turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar turma',
      error: error.message
    });
  }
};

// ============================================
// DELETE - Deletar turma (soft delete)
// ============================================
exports.deleteTurma = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: turma, error } = await supabase.admin
      .from('turmas')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Turma deletada com sucesso',
      data: turma
    });
  } catch (error) {
    console.error('Erro ao deletar turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar turma',
      error: error.message
    });
  }
};
