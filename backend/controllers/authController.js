const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const emailService = require('../utils/emailService');

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
      .select('id, matricula, name, email, password, technical_area, role, deleted_at')
      .eq('matricula', matricula)
      .single();

    if (error || !instructor) {
      return res.status(401).json({
        success: false,
        message: 'Matrícula ou senha inválidas'
      });
    }

    // Verificar se instrutor está ativo
    if (instructor.deleted_at) {
      return res.status(403).json({
        success: false,
        message: 'Instrutor inativado. Contate o administrador.'
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
      .select('id, matricula, name, email, password, technical_area, role, deleted_at')
      .eq('email', email)
      .eq('role', 'admin')
      .single();

    if (error || !admin) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    // Verificar se admin está ativo
    if (admin.deleted_at) {
      return res.status(403).json({
        success: false,
        message: 'Administrador inativado. Contate o proprietário do sistema.'
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

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Do middleware de autenticação

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A nova senha deve ter pelo menos 6 caracteres'
      });
    }

    // Buscar usuário (pode ser instrutor ou admin)
    let user;
    if (req.user.role === 'instructor') {
      const { data, error } = await supabase
        .from('instructors')
        .select('id, password, email')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        return res.status(404).json({
          success: false,
          message: 'Instrutor não encontrado'
        });
      }
      user = data;
    } else if (req.user.role === 'admin') {
      const { data, error } = await supabase
        .from('admins')
        .select('id, password, email')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        return res.status(404).json({
          success: false,
          message: 'Admin não encontrado'
        });
      }
      user = data;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Usuário com papel desconhecido'
      });
    }

    // Verificar senha atual
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual está incorreta'
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    const table = req.user.role === 'instructor' ? 'instructors' : 'admins';
    const { error: updateError } = await supabase
      .from(table)
      .update({ password: hashedPassword })
      .eq('id', userId);

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao alterar senha'
      });
    }

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar senha',
      error: error.message
    });
  }
};

exports.forgotPasswordInstructor = async (req, res) => {
  try {
    const { matricula } = req.body;

    if (!matricula) {
      return res.status(400).json({
        success: false,
        message: 'Matrícula é obrigatória'
      });
    }

    // Buscar instrutor pelo número de matrícula
    const { data: instructor, error } = await supabase
      .from('instructors')
      .select('id, matricula, name, email, deleted_at')
      .eq('matricula', matricula)
      .single();

    if (error || !instructor) {
      // Não revelar se o usuário existe ou não por segurança
      return res.json({
        success: true,
        message: 'Se a matrícula está registrada, você receberá um email com instruções para redefinir a senha'
      });
    }

    if (instructor.deleted_at) {
      return res.json({
        success: true,
        message: 'Se a matrícula está registrada, você receberá um email com instruções para redefinir a senha'
      });
    }

    // Se não tem email cadastrado, não fazer nada
    if (!instructor.email) {
      return res.json({
        success: true,
        message: 'Se a matrícula está registrada, você receberá um email com instruções para redefinir a senha'
      });
    }

    // Gerar token de reset com validade de 24 horas
    const resetToken = jwt.sign(
      { instructorId: instructor.id, type: 'password-reset' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Construir link de reset
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}&type=instructor`;

    // Enviar email
    await emailService.sendPasswordResetEmail(instructor.email, instructor.name, resetLink);

    res.json({
      success: true,
      message: 'Se a matrícula está registrada, você receberá um email com instruções para redefinir a senha'
    });
  } catch (error) {
    console.error('Erro ao processar solicitação de reset:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação',
      error: error.message
    });
  }
};

exports.forgotPasswordAdmin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
    }

    // Buscar admin pelo email
    const { data: admin, error } = await supabase
      .from('instructors')
      .select('id, name, email, role, deleted_at')
      .eq('email', email)
      .eq('role', 'admin')
      .single();

    if (error || !admin) {
      // Não revelar se o usuário existe ou não por segurança
      return res.json({
        success: true,
        message: 'Se o email está registrado como admin, você receberá um email com instruções para redefinir a senha'
      });
    }

    if (admin.deleted_at) {
      return res.json({
        success: true,
        message: 'Se o email está registrado como admin, você receberá um email com instruções para redefinir a senha'
      });
    }

    // Gerar token de reset com validade de 24 horas
    const resetToken = jwt.sign(
      { instructorId: admin.id, type: 'password-reset' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Construir link de reset
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}&type=admin`;

    // Enviar email
    await emailService.sendPasswordResetEmail(email, admin.name, resetLink);

    res.json({
      success: true,
      message: 'Se o email está registrado como admin, você receberá um email com instruções para redefinir a senha'
    });
  } catch (error) {
    console.error('Erro ao processar solicitação de reset para admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação',
      error: error.message
    });
  }
};

exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token é obrigatório'
      });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (decoded.type !== 'password-reset') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    res.json({
      success: true,
      message: 'Token válido',
      instructorId: decoded.instructorId
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(401).json({
      success: false,
      message: 'Token expirado ou inválido'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token e senha são obrigatórios'
      });
    }

    // Validar tamanho da senha
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Senha deve ter no mínimo 6 caracteres'
      });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (decoded.type !== 'password-reset') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha no banco
    const { data: updatedUser, error } = await supabase
      .from('instructors')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.instructorId)
      .select('id, name, email');

    if (error) throw error;

    if (!updatedUser || updatedUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao redefinir senha',
      error: error.message
    });
  }
};
