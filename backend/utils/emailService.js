// Email Service - utils/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendLateReturnAlert(keyInfo, instructorInfo) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.ALERT_EMAIL,
        subject: `⚠️ ALERTA: Devolução em Atraso - ${keyInfo.environment}`,
        html: this.getHtmlTemplate(keyInfo, instructorInfo)
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email enviado para ${process.env.ALERT_EMAIL}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  getHtmlTemplate(keyInfo, instructorInfo) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background-color: #FF8C00; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f5f5f5; }
            .alert { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .info { background-color: white; padding: 15px; border-left: 4px solid #FF8C00; margin: 10px 0; }
            .footer { text-align: center; padding: 10px; color: #666; font-size: 12px; }
            strong { color: #FF8C00; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ ALERTA DE DEVOLUÇÃO EM ATRASO</h1>
            </div>
            
            <div class="content">
              <p>Prezado Administrador,</p>
              
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
                ${new Date(instructorInfo.withdrawnAt).toLocaleString('pt-BR')}
              </div>
              
              <p style="color: #d9534f;">
                <strong>Ação Recomendada:</strong> Entre em contato com o instrutor para confirmar se a chave foi devolvida ou está extraviada.
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
}

module.exports = new EmailService();
