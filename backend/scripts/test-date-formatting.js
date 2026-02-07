// Teste de formatação de data
const dateStr = "2026-02-07T04:43:57.599";

console.log('📅 Testando formatação de data:');
console.log(`Input: ${dateStr}`);

try {
  const date = new Date(dateStr);
  console.log(`Date object: ${date}`);
  console.log(`ISO: ${date.toISOString()}`);
  console.log(`Timezone: ${date.getTimezoneOffset()}`);
  console.log(`UTC: ${date.toUTCString()}`);
  
  // Tentar com Intl
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
  
  console.log(`Formatado (BR): ${formatter.format(date)}`);
} catch (error) {
  console.error(`❌ Erro: ${error.message}`);
}
