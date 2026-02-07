const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

async function resetPassword() {
  try {
    const newPassword = 'senai123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { data, error } = await supabase
      .from('instructors')
      .update({ password: hashedPassword })
      .eq('matricula', '3-02919');

    if (error) throw error;

    console.log(`✅ Senha do instrutor 3-02919 (Mauricio Davel) redefinida para: ${newPassword}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

resetPassword();
