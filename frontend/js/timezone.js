// Utility para formatar datas em horário de Brasília

class TimezoneFormatter {
  /**
   * Formata uma data/hora para o timezone de Brasília
   * @param {Date|string} date - Data para formatar
   * @param {string} format - Formato desejado ('datetime', 'date', 'time')
   * @returns {string} Data formatada
   */
  static format(date, format = 'datetime') {
    if (typeof date === 'string') {
      date = new Date(date);
    }

    const options = {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };

    const formatter = new Intl.DateTimeFormat('pt-BR', options);
    const parts = formatter.formatToParts(date);

    const values = {};
    parts.forEach(part => {
      if (part.type !== 'literal') {
        values[part.type] = part.value;
      }
    });

    switch (format) {
      case 'time':
        return `${values.hour}:${values.minute}:${values.second}`;
      case 'date':
        return `${values.day}/${values.month}/${values.year}`;
      case 'datetime':
      default:
        return `${values.day}/${values.month}/${values.year} ${values.hour}:${values.minute}`;
    }
  }

  /**
   * Formata apenas a data (DD/MM/YYYY)
   */
  static formatDate(date) {
    return this.format(date, 'date');
  }

  /**
   * Formata apenas a hora (HH:MM:SS)
   */
  static formatTime(date) {
    return this.format(date, 'time');
  }

  /**
   * Formata data e hora (DD/MM/YYYY HH:MM)
   */
  static formatDateTime(date) {
    return this.format(date, 'datetime');
  }

  /**
   * Retorna a diferença de horário em minutos do timezone para Brasília
   */
  static getTimezoneOffset(date = new Date()) {
    const brasilia = new Date(date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    const local = new Date(date.toLocaleString('pt-BR'));
    return (local - brasilia) / (1000 * 60); // Diferença em minutos
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.TimezoneFormatter = TimezoneFormatter;
}
