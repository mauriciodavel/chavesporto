const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.loginInstructor = async (req, res) => {
  try {
    const { matricula, password } = req.body;

    if (!matricula || !password) {
      return res.status(400).json({
        success: false,
        message: 'Matrícula e senha são obrigatórios'
      });
    }

    // Buscar instrutor no banco
    const { data: instructor, error } = await supabase
      .from('instructors')
      .select('id, matricula, name, email, password, technical_area, role')
      .eq('matricula', matricula)
      .single();

    if (error || !instructor) {
      return res.status(401).json({
        success: false,
        message: 'Matrícula ou senha inválidas'
      });
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, instructor.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Matrícula ou senha inválidas'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: instructor.id,
        matricula: instructor.matricula,
        name: instructor.name,
        role: instructor.role || 'instructor',
        technical_area: instructor.technical_area
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: instructor.id,
        matricula: instructor.matricula,
        name: instructor.name,
        role: instructor.role || 'instructor',
        technical_area: instructor.technical_area
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao realizar login',
      error: error.message
    });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar admin
    const { data: admin, error } = await supabase
      .from('instructors')
      .select('id, matricula, name, email, password, technical_area, role')
      .eq('email', email)
      .eq('role', 'admin')
      .single();

    if (error || !admin) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      message: 'Login de administrador realizado com sucesso',
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Erro no login admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao realizar login',
      error: error.message
    });
  }
};

exports.logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
};
