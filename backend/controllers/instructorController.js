const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

exports.getAllInstructors = async (req, res) => {
  try {
    const { data: instructors, error } = await supabase
      .from('instructors')
      .select('id, matricula, name, email, technical_area, role, deleted_at, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: instructors
    });
  } catch (error) {
    console.error('Erro ao buscar instrutores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar instrutores',
      error: error.message
    });
  }
};

exports.createInstructor = async (req, res) => {
  try {
    const { matricula, name, email, password, technicalArea, role } = req.body;

    if (!matricula || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios não preenchidos'
      });
    }

    // Verificar se matrícula já existe
    const { data: existingInstructor } = await supabase
      .from('instructors')
      .select('id')
      .eq('matricula', matricula)
      .single();

    if (existingInstructor) {
      return res.status(400).json({
        success: false,
        message: 'Matrícula já cadastrada'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: instructor, error } = await supabase
      .from('instructors')
      .insert({
        id: uuidv4(),
        matricula,
        name,
        email,
        password: hashedPassword,
        technical_area: technicalArea,
        role: role || 'instructor',
        deleted_at: null
      })
      .select('id, matricula, name, email, technical_area, role, deleted_at')
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Instrutor criado com sucesso',
      data: instructor
    });
  } catch (error) {
    console.error('Erro ao criar instrutor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar instrutor',
      error: error.message
    });
  }
};

exports.toggleInstructorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { shouldDeactivate } = req.body;

    const updateData = {
      deleted_at: shouldDeactivate ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    const { data: instructor, error } = await supabase
      .from('instructors')
      .insert({
        id: uuidv4(),
        matricula,
        name,
        email,
        password: hashedPassword,
        technical_area: technicalArea,
        role: role || 'instructor',
        deleted_at: null
      })
      .select('id, matricula, name, email, technical_area, role, deleted_at')
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Instrutor criado com sucesso',
      data: instructor
    });
  } catch (error) {
    console.error('Erro ao criar instrutor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar instrutor',
      error: error.message
    });
  }
};

exports.updateInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, technicalArea, password, role } = req.body;

    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(technicalArea && { technical_area: technicalArea }),
      ...(role && { role }),
      updated_at: new Date().toISOString()
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const { data: instructor, error } = await supabase
      .from('instructors')
      .update(updateData)
      .eq('id', id)
      .select('id, matricula, name, email, technical_area, role, deleted_at')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Instrutor atualizado com sucesso',
      data: instructor
    });
  } catch (error) {
    console.error('Erro ao atualizar instrutor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar instrutor',
      error: error.message
    });
  }
};

exports.toggleInstructorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { shouldDeactivate } = req.body;

    const updateData = {
      deleted_at: shouldDeactivate ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    const { data: instructor, error } = await supabase
      .from('instructors')
      .update(updateData)
      .eq('id', id)
      .select('id, matricula, name, email, technical_area, role, deleted_at')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: shouldDeactivate ? 'Instrutor desativado com sucesso' : 'Instrutor ativado com sucesso',
      data: instructor
    });
  } catch (error) {
    console.error('Erro ao alternar status do instrutor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao alternar status do instrutor',
      error: error.message
    });
  }
};

exports.deleteInstructor = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('instructors')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Instrutor deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar instrutor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar instrutor',
      error: error.message
    });
  }
};
