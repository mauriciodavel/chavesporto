// Definição de horários dos turnos
// Todos os horários em formato HH:MM (24h)

const SHIFT_TIMES = {
  matutino: {
    start: '07:30',
    end: '11:30',
    withdrawStart: '07:00',   // 30 min antes
    withdrawEnd: '12:00'      // 30 min depois
  },
  vespertino: {
    start: '13:30',
    end: '17:30',
    withdrawStart: '13:00',   // 30 min antes
    withdrawEnd: '18:00'      // 30 min depois
  },
  noturno: {
    start: '18:30',
    end: '22:00',
    withdrawStart: '18:00',   // 30 min antes
    withdrawEnd: '22:30'      // 30 min depois
  },
  integral: {
    start: '08:00',
    end: '17:00',
    withdrawStart: '07:30',   // 30 min antes
    withdrawEnd: '17:30'      // 30 min depois
  }
};

/**
 * Converte uma string HH:MM em minutos desde 00:00
 * @param {string} timeString - Formato "HH:MM"
 * @returns {number} Minutos desde 00:00
 */
function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte minutos desde 00:00 em string HH:MM
 * @param {number} minutes - Minutos desde 00:00
 * @returns {string} Formato "HH:MM"
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Obtém a hora atual em minutos (América/São Paulo)
 * @returns {number} Minutos desde 00:00
 */
function getCurrentTimeInMinutes() {
  try {
    const now = new Date();
    
    // Usar Intl.DateTimeFormat para obter hora em Brasília
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Sao_Paulo'
    });
    
    const timeParts = formatter.formatToParts(now);
    const hourPart = timeParts.find(p => p.type === 'hour');
    const minutePart = timeParts.find(p => p.type === 'minute');
    
    if (!hourPart || !minutePart) {
      console.warn('⚠️ Não foi possível obter partes da hora: hourPart=', hourPart, 'minutePart=', minutePart);
      console.debug('   timeParts completo:', timeParts);
      return 0;
    }
    
    const hour = parseInt(hourPart.value, 10);
    const minute = parseInt(minutePart.value, 10);
    
    console.debug(`🕐 Hora em Brasília parsed: ${hour}h${String(minute).padStart(2, '0')} (${hour}*60 + ${minute} = ${hour * 60 + minute} minutos)`);
    
    if (isNaN(hour) || isNaN(minute)) {
      console.warn('⚠️ Erro ao fazer parse da hora: hour=', hour, 'minute=', minute);
      return 0;
    }
    
    return hour * 60 + minute;
  } catch (error) {
    console.error('❌ Erro em getCurrentTimeInMinutes():', error);
    return 0;
  }
}

/**
 * Verifica se a hora atual está dentro da janela de retirada de um turno específico
 * @param {string} shift - Nome do turno ('matutino', 'vespertino', 'noturno', 'integral')
 * @returns {boolean} true se está na janela de retirada, false caso contrário
 */
function isWithinWithdrawWindow(shift) {
  const shiftConfig = SHIFT_TIMES[shift.toLowerCase()];
  
  if (!shiftConfig) {
    console.warn(`⚠️ Turno desconhecido: ${shift}`);
    return false;
  }

  const currentTime = getCurrentTimeInMinutes();
  const withdrawStart = timeToMinutes(shiftConfig.withdrawStart);
  const withdrawEnd = timeToMinutes(shiftConfig.withdrawEnd);
  
  console.debug(`🔍 Verificando turno "${shift}": atual=${currentTime} min, janela=${withdrawStart}-${withdrawEnd}`);

  // Lidar com turnos que passam por midnight (noturno)
  if (withdrawStart > withdrawEnd) {
    const isAvailable = currentTime >= withdrawStart || currentTime < withdrawEnd;
    console.debug(`   (passando por midnight) ${isAvailable ? '✅ DENTRO' : '❌ FORA'} da janela`);
    return isAvailable;
  }

  const isAvailable = currentTime >= withdrawStart && currentTime < withdrawEnd;
  console.debug(`   ${isAvailable ? '✅ DENTRO' : '❌ FORA'} da janela`);
  return isAvailable;
}

/**
 * Verifica se a hora atual está dentro da janela de retirada de ALGUM turno
 * @returns {boolean} true se está na janela de retirada de qualquer turno, false caso contrário
 */
function isWithinAnyWithdrawWindow() {
  return Object.keys(SHIFT_TIMES).some(shift => isWithinWithdrawWindow(shift));
}

/**
 * Retorna os turnos que estão disponíveis para retirada agora
 * @returns {array} Array contendo os nomes dos turnos disponíveis
 */
function getAvailableShiftsNow() {
  return Object.keys(SHIFT_TIMES).filter(shift => isWithinWithdrawWindow(shift));
}

/**
 * Verifica se a hora atual está DEPOIS do fim da janela de retirada de um turno
 * (ou seja, se uma chave desse turno não devolvida está em atraso)
 * @param {string} shift - Nome do turno ('matutino', 'vespertino', 'noturno', 'integral')
 * @returns {boolean} true se passou do fim da janela, false caso contrário
 */
function isAfterWithdrawWindow(shift) {
  const shiftConfig = SHIFT_TIMES[shift.toLowerCase()];
  
  if (!shiftConfig) {
    console.warn(`⚠️ Turno desconhecido: ${shift}`);
    return false;
  }

  const currentTime = getCurrentTimeInMinutes();
  const withdrawEnd = timeToMinutes(shiftConfig.withdrawEnd);
  
  console.debug(`🔍 Verificando se passou do fim da janela do turno "${shift}": atual=${currentTime} min, fim da janela=${withdrawEnd}`);

  // Lidar com turnos que passam por midnight (noturno)
  // O noturno tem withdrawEnd > withdrawStart (18:00-22:30)
  // Então precisamos verificar se PASSOU
  
  if (shiftConfig.withdrawStart > shiftConfig.withdrawEnd) {
    // Para turnos que passam por midnight, passou do fim se:
    // currentTime >= withdrawEnd E currentTime < withdrawStart
    // NA (esse shift não tem isso, mas mantemos a lógica por completude)
    const hasPassed = currentTime >= withdrawEnd && currentTime < shiftConfig.withdrawStart;
    console.debug(`   (passando por midnight) ${hasPassed ? '⏰ PASSOU' : '⏳ NÃO PASSOU'} do fim da janela`);
    return hasPassed;
  }

  // Para turnos normais, passou se currentTime >= withdrawEnd
  const hasPassed = currentTime >= withdrawEnd;
  console.debug(`   ${hasPassed ? '⏰ PASSOU' : '⏳ NÃO PASSOU'} do fim da janela`);
  return hasPassed;
}

/**
 * Retorna informações formatadas sobre a próxima janela de retirada
 * @returns {object} Objeto com informações sobre turnos e janelas
 */
function getWithdrawWindowInfo() {
  const availableShifts = getAvailableShiftsNow();
  const currentTime = getCurrentTimeInMinutes();
  
  if (isNaN(currentTime)) {
    console.error('❌ Erro: getCurrentTimeInMinutes() retornou NaN');
    return {
      currentTime: '00:00',
      availableShifts: [],
      shiftDetails: [],
      error: 'Erro ao obter hora atual'
    };
  }
  
  const now = minutesToTime(currentTime);

  return {
    currentTime: now,
    availableShifts,
    shiftDetails: availableShifts.map(shift => ({
      shift,
      start: SHIFT_TIMES[shift].withdrawStart,
      end: SHIFT_TIMES[shift].withdrawEnd
    }))
  };
}

/**
 * Retorna informações formatadas sobre a próxima janela de retirada
 * @returns {object} Objeto com informações sobre turnos e janelas
 */
function getWithdrawWindowInfo() {
  const availableShifts = getAvailableShiftsNow();
  const currentTime = getCurrentTimeInMinutes();
  
  if (isNaN(currentTime)) {
    console.error('❌ Erro: getCurrentTimeInMinutes() retornou NaN');
    return {
      currentTime: '00:00',
      availableShifts: [],
      shiftDetails: [],
      error: 'Erro ao obter hora atual'
    };
  }
  
  const now = minutesToTime(currentTime);

  return {
    currentTime: now,
    availableShifts,
    shiftDetails: availableShifts.map(shift => ({
      shift,
      start: SHIFT_TIMES[shift].withdrawStart,
      end: SHIFT_TIMES[shift].withdrawEnd
    }))
  };
}

module.exports = {
  SHIFT_TIMES,
  timeToMinutes,
  minutesToTime,
  getCurrentTimeInMinutes,
  isWithinWithdrawWindow,
  isWithinAnyWithdrawWindow,
  isAfterWithdrawWindow,
  getAvailableShiftsNow,
  getWithdrawWindowInfo
};
