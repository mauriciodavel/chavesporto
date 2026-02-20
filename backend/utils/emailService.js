// Email Service - utils/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    const port = parseInt(process.env.SMTP_PORT || '587');
    
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465, // true for 465, false for other ports (587 needs TLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // Adicionar opções de TLS para porta 587
      tls: {
        rejectUnauthorized: false // Permite certificados auto-assinados
      }
    });
  }

  /**
   * Formata uma data para o format DD/MM/YYYY HH:MM:SS em Brasília
   * @param {string|Date} dateString - Data ISO ou objeto Date
   * @returns {string} Data formatada em Brasília
   */
  formatDateBrasilia(dateString) {
    try {
      if (!dateString) {
        console.warn('⚠️  [formatDateBrasilia] dateString vazio/null');
        return 'Data indisponível';
      }
      
      // Converter para Date, tratando diferentes formatos
      let date;
      if (typeof dateString === 'string') {
        // Se não tiver Z (UTC), assume UTC mesmo assim
        const cleanString = dateString.includes('Z') ? dateString : `${dateString}Z`;
        date = new Date(cleanString);
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        console.warn(`⚠️  [formatDateBrasilia] Data inválida: ${dateString}`);
        return 'Data inválida';
      }
      
      console.log(`🔍 [formatDateBrasilia] Input: ${dateString}`);
      console.log(`   UTC ISO: ${date.toISOString()}`);
      
      // Usar Intl.DateTimeFormat com timezone de Brasília
      const formatter = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Sao_Paulo',
        hour12: false
      });
      
      const formatted = formatter.format(date);
      console.log(`   Brasília: ${formatted}`);
      return formatted;
    } catch (error) {
      console.error('❌ Erro ao formatar data:', error.message);
      return dateString;
    }
  }

  async sendLateReturnAlert(keyInfo, instructorInfo, isReminder = false) {
    try {
      // Enviar para o admin
      const adminMailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.ALERT_EMAIL,
        subject: `${isReminder ? '🔴 RECOBRANÇA' : '⚠️ ALERTA'}: Devolução em Atraso - ${keyInfo.environment}`,
        html: this.getHtmlTemplate(keyInfo, instructorInfo, isReminder)
      };

      const adminInfo = await this.transporter.sendMail(adminMailOptions);
      console.log(`✅ Email enviado para ADMIN ${process.env.ALERT_EMAIL}`);
      console.log(`   Resposta do servidor: ${adminInfo.response}`);

      // Enviar também para o instrutor (se houver email)
      if (instructorInfo.email) {
        const instructorMailOptions = {
          from: process.env.SMTP_USER,
          to: instructorInfo.email,
          subject: `${isReminder ? '🔴 RECOBRANÇA' : '⚠️ AVISO'}: Sua Chave Está em Atraso - ${keyInfo.environment}`,
          html: this.getHtmlTemplateForInstructor(keyInfo, instructorInfo, isReminder)
        };

        const instructorMailInfo = await this.transporter.sendMail(instructorMailOptions);
        console.log(`✅ Email enviado para INSTRUTOR ${instructorInfo.email}`);
        console.log(`   Resposta do servidor: ${instructorMailInfo.response}`);
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error.message);
      return false;
    }
  }

  getHtmlTemplate(keyInfo, instructorInfo, isReminder = false) {
    console.log(`📧 [getHtmlTemplate] withdrawnAt recebido:`, instructorInfo.withdrawnAt);
    
    const headerBgColor = isReminder ? '#d9534f' : '#FF8C00';
    const headerTitle = isReminder ? '🔴 RECOBRANÇA: DEVOLUÇÃO EM ATRASO' : '⚠️ ALERTA: DEVOLUÇÃO EM ATRASO';
    
    // Formatar data ANTES de colocá-la no template
    const formattedDate = this.formatDateBrasilia(instructorInfo.withdrawnAt);
    console.log(`📧 [getHtmlTemplate] Data formatada:`, formattedDate);
    
    const reminderNote = isReminder ? `
      <div class="alert" style="background-color: #f8d7da; border-color: #d9534f; color: #721c24;">
        <strong style="color: #721c24;">⚠️ ESTE É UM AVISO DE RECOBRANÇA</strong><br>
        Este é o segundo aviso. A chave continua em atraso há mais de 24 horas.
        Contacte imediatamente o instrutor responsável.
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background-color: ${headerBgColor}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f5f5f5; }
            .alert { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .info { background-color: white; padding: 15px; border-left: 4px solid ${headerBgColor}; margin: 10px 0; }
            .footer { text-align: center; padding: 10px; color: #666; font-size: 12px; }
            strong { color: ${headerBgColor}; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${headerTitle}</h1>
            </div>
            
            <div class="content">
              <p>Prezado Administrador,</p>
              
              ${reminderNote}
              
              <p>Uma chave não foi devolvida dentro do horário de expediente.</p>
              
              <div class="alert">
                <strong>Chave:</strong> ${keyInfo.environment}<br>
                <strong>Descrição:</strong> ${keyInfo.description}<br>
                <strong>Localização:</strong> ${keyInfo.location}<br>
                <strong>QR Code:</strong> ${keyInfo.qr_code}
              </div>
              
              <div class="info">
                <strong>Instrutor Responsável:</strong><br>
                Nome: ${instructorInfo.name}<br>
                Matrícula: ${instructorInfo.matricula}<br>
                Email: ${instructorInfo.email}
              </div>
              
              <div class="info">
                <strong>Data/Hora da Retirada:</strong><br>
                ${formattedDate}
              </div>
              
              <p style="color: #d9534f;">
                <strong>Ação Recomendada:</strong> ${isReminder ? 'URGENTE - Entre em contato com o instrutor para resgatar a chave ou identificar se foi extraviada.' : 'Entre em contato com o instrutor para confirmar se a chave foi devolvida ou está extraviada.'}
              </p>
            </div>
            
            <div class="footer">
              <p>Este é um email automático do Sistema de Controle de Chaves</p>
              <p>SENAI - Gestão de Ambientes © 2026</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Template de email para notificar o instrutor sobre chave em atraso
   */
  getHtmlTemplateForInstructor(keyInfo, instructorInfo, isReminder = false) {
    console.log(`📧 [getHtmlTemplateForInstructor] withdrawnAt recebido:`, instructorInfo.withdrawnAt);
    
    const formattedDate = this.formatDateBrasilia(instructorInfo.withdrawnAt);
    console.log(`📧 [getHtmlTemplateForInstructor] Data formatada:`, formattedDate);
    
    const headerBgColor = isReminder ? '#d9534f' : '#FF8C00';
    const headerTitle = isReminder ? '🔴 RECOBRANÇA: SUA CHAVE ESTÁ EM ATRASO' : '⚠️ AVISO: SUA CHAVE ESTÁ EM ATRASO';
    const reminderNote = isReminder ? `
      <div class="alert" style="background-color: #f8d7da; border-color: #d9534f; color: #721c24;">
        <strong style="color: #721c24;">⚠️ AVISO FINAL - RECOBRANÇA</strong><br>
        Esta é uma recobrança. A chave está em atraso há mais de 24 horas.
        Dirija-se imediatamente ao coordenador para devolver a chave.
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background-color: ${headerBgColor}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f5f5f5; }
            .alert { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .info { background-color: white; padding: 15px; border-left: 4px solid ${headerBgColor}; margin: 10px 0; }
            .footer { text-align: center; padding: 10px; color: #666; font-size: 12px; }
            strong { color: ${headerBgColor}; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${headerTitle}</h1>
            </div>
            
            <div class="content">
              <p>Prezado(a) ${instructorInfo.name},</p>
              
              ${reminderNote}
              
              <p>Registramos que você não devolveu a seguinte chave dentro do horário de expediente:</p>
              
              <div class="alert">
                <strong>Chave:</strong> ${keyInfo.environment}<br>
                <strong>Descrição:</strong> ${keyInfo.description}<br>
                <strong>Localização:</strong> ${keyInfo.location}
              </div>
              
              <div class="info">
                <strong>Seus Dados:</strong><br>
                Nome: ${instructorInfo.name}<br>
                Matrícula: ${instructorInfo.matricula}
              </div>
              
              <div class="info">
                <strong>Data/Hora da Retirada:</strong><br>
                ${formattedDate}
              </div>
              
              <p style="color: #d9534f; font-weight: bold;">
                ${isReminder ? 'AÇÃO IMEDIATA NECESSÁRIA: Dirija-se ao coordenador ou à administração para devolver a chave urgentemente.' : 'Por favor, dirija-se ao coordenador para devolver a chave assim que possível.'}
              </p>
              
              <p style="background-color: #e8f4f8; padding: 15px; border-left: 4px solid #17a2b8; margin: 15px 0;">
                <strong>Informação Importante:</strong><br>
                Todas as chaves precisam ser devolvidas dentro do horário de expediente. 
                Atrasos podem resultar em procedimentos disciplinares conforme a política institucional.
              </p>
            </div>
            
            <div class="footer">
              <p>Este é um email automático do Sistema de Controle de Chaves</p>
              <p>SENAI - Gestão de Ambientes © 2026</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // ============================================
  // NOTIFICAÇÃO DE RESERVA APROVADA
  // ============================================
  async sendApprovalNotification(instructorEmail, instructorName, environment, keyCode, startDate, endDate, shift, turma) {
    try {
      // Formatar datas
      const formatter = new Intl.DateTimeFormat('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
      
      const start = formatter.format(new Date(startDate));
      const end = formatter.format(new Date(endDate));

      const shiftTexts = {
        matutino: 'Matutino (7:30 - 11:30)',
        vespertino: 'Vespertino (13:30 - 17:30)',
        noturno: 'Noturno (18:30 - 22:00)',
        integral: 'Integral (08:00 - 17:00)'
      };

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: instructorEmail,
        subject: `✅ Reservation Approved - ${environment}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f5f5f5; }
                .info { background-color: white; padding: 15px; border-left: 4px solid #28a745; margin: 10px 0; }
                .footer { text-align: center; padding: 10px; color: #666; font-size: 12px; }
                strong { color: #28a745; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ RESERVA APROVADA</h1>
                </div>
                
                <div class="content">
                  <p>Olá ${instructorName},</p>
                  
                  <p>Sua reserva foi <strong>aprovada</strong>! Você pode retirar a chave durante o período reservado.</p>
                  
                  <div class="info">
                    <strong>Ambiente/Chave:</strong> ${environment}<br>
                    <strong>Código da Chave:</strong> ${keyCode}<br>
                    <strong>Turma/Grupo:</strong> ${turma}<br>
                    <strong>Turno:</strong> ${shiftTexts[shift] || shift}<br>
                    <strong>Período:</strong> ${start} até ${end}
                  </div>
                  
                  <p style="color: #28a745;">
                    <strong>⏰ Importante:</strong> A retirada pode ser realizada 30 minutos antes do horário inicial do turno até o término do período.
                  </p>
                  
                  <p>Se tiver dúvidas, entre em contato com a administração.</p>
                </div>
                
                <div class="footer">
                  <p>Este é um email automático do Sistema de Controle de Chaves</p>
                  <p>SENAI - Gestão de Ambientes © 2026</p>
                </div>
              </div>
            </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de aprovação enviado para ${instructorEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de aprovação:', error.message);
      return false;
    }
  }

  // ============================================
  // NOTIFICAÇÃO DE RESERVA REJEITADA
  // ============================================
  async sendRejectionNotification(instructorEmail, instructorName, rejectionReason) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: instructorEmail,
        subject: `❌ Reservation Rejected`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f5f5f5; }
                .info { background-color: white; padding: 15px; border-left: 4px solid #dc3545; margin: 10px 0; }
                .footer { text-align: center; padding: 10px; color: #666; font-size: 12px; }
                strong { color: #dc3545; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>❌ RESERVA REJEITADA</h1>
                </div>
                
                <div class="content">
                  <p>Olá ${instructorName},</p>
                  
                  <p>Sua reserva foi <strong>rejeitada</strong>.</p>
                  
                  <div class="info">
                    <strong>Motivo:</strong><br>
                    ${rejectionReason}
                  </div>
                  
                  <p>Você pode criar uma nova reserva com outras datas ou entrar em contato com a administração.</p>
                </div>
                
                <div class="footer">
                  <p>Este é um email automático do Sistema de Controle de Chaves</p>
                  <p>SENAI - Gestão de Ambientes © 2026</p>
                </div>
              </div>
            </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de rejeição enviado para ${instructorEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de rejeição:', error.message);
      return false;
    }
  }

  async sendPasswordResetEmail(email, userName, resetLink) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || `"Chavesporto" <${process.env.SMTP_USER}>`,
        to: email,
        subject: '🔐 Redefinir Senha - Chavesporto',
        html: `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f5f5;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #FF8C00 0%, #FF7700 100%);
                color: white;
                padding: 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
              }
              .content {
                padding: 30px;
              }
              .button {
                display: inline-block;
                background-color: #FF8C00;
                color: white;
                padding: 12px 30px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 600;
                margin: 20px 0;
                transition: background-color 0.3s ease;
              }
              .button:hover {
                background-color: #FF7700;
              }
              .info-box {
                background-color: #f9f9f9;
                border-left: 4px solid #FF8C00;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer {
                text-align: center;
                padding: 20px;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #999;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Redefinição de Senha</h1>
              </div>
              
              <div class="content">
                <p>Olá <strong>${userName}</strong>,</p>
                
                <p>Recebemos uma solicitação para redefinir sua senha no sistema <strong>Chavesporto</strong>.</p>
                
                <p>Clique no botão abaixo para criar uma nova senha:</p>
                
                <center>
                  <a href="${resetLink}" class="button">Redefinir Senha</a>
                </center>
                
                <div class="info-box">
                  <p><strong>⏱️ Validade:</strong> Este link expira em 24 horas</p>
                  <p><strong>🔒 Segurança:</strong> Nunca compartilhe este link com ninguém</p>
                </div>
                
                <p>Se você não solicitou essa redefinição, ignore este email e nenhuma alteração será feita em sua conta.</p>
                
                <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
                <p style="word-break: break-all; background-color: #f9f9f9; padding: 10px; border-radius: 4px; font-size: 12px; color: #666;">
                  ${resetLink}
                </p>
              </div>
              
              <div class="footer">
                <p>Este é um email automático do Sistema de Controle de Chaves</p>
                <p>SENAI - Gestão de Ambientes © 2026</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de redefinição de senha enviado para ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de redefinição:', error.message);
      return false;
    }
  }
}

const emailService = new EmailService();

// Exportar a instância e funções específicas
module.exports = emailService;
module.exports.sendApprovalNotification = emailService.sendApprovalNotification.bind(emailService);
module.exports.sendRejectionNotification = emailService.sendRejectionNotification.bind(emailService);
module.exports.sendPasswordResetEmail = emailService.sendPasswordResetEmail.bind(emailService);
