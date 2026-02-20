#!/usr/bin/env node

// Teste para verificar qual dia da semana é cada data

const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

console.log('🗓️  Testando datas de Janeiro/Fevereiro de 2026:\n');

// Verificar alguns dias conhecidos
const testDates = [
  '2026-01-05',
  '2026-01-06',
  '2026-01-12',
  '2026-02-15',
  '2026-02-16',
  '2026-02-17'
];

testDates.forEach(dateStr => {
  const date = new Date(dateStr + 'T00:00:00Z');
  const dayNum = date.getUTCDay();
  const dayName = dayNames[dayNum];
  console.log(`${dateStr}: ${dayName} (getDay=${dayNum})`);
});

console.log('\n🔍 Números esperados:');
console.log('   Domingo = 0');
console.log('   Segunda = 1');
console.log('   Terça = 2');
console.log('   etc...\n');
