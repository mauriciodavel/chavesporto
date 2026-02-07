#!/usr/bin/env node
// Reproduzir o problema de timezone

console.log('🔍 SIMULANDO O FLUXO DE TIMEZONE\n');

// Cenário: Usuário retira chave às 01:58 hora de Brasília
const localTime = new Date('2026-02-07T01:58:00'); // Hora local esperada (sem Z = sem timezone)
console.log('1️⃣  HORA LOCAL ESPERADA (que o usuário vê relógio):');
console.log(`   ${localTime.toLocaleString('pt-BR')}`);
console.log();

// O que o backend faz (em UTC)
const utcTime = new Date();
console.log('2️⃣  O QUE O BACKEND SALVA COM new Date().toISOString():');
console.log(`   ${utcTime.toISOString()}`);
console.log(`   ⚠️  Isto é armazenado no banco (sem conversão de timezone)`);
console.log();

// Simular: usuário está em Brasília, horário local é 01:58
// Hora UTC seria 01:58 + 03:00 = 04:58 (porque Brasília é UTC-3)
const brasilia = new Date('2026-02-07T01:58:00');
const brasiliaUTC = brasilia.getTime() + (3 * 60 * 60 * 1000); // Adiciona 3 horas
const brasiliaAsUTC = new Date(brasiliaUTC);

console.log('3️⃣  SE O USUÁRIO ESTÁ EM BRASÍLIA ÀS 01:58:');
console.log(`   Hora local de Brasília: 01:58`);
console.log(`   Hora UTC correspondente: ${brasiliaAsUTC.toISOString().substring(0, 16)}`);
console.log(`   (Brasília é UTC-3, então 01:58 BRT = 04:58 UTC)`);
console.log();

// O problema: o backend deveria estar salvando a hora em Brasília, não em UTC
console.log('4️⃣  O PROBLEMA:');
console.log(`   Backend salva: new Date().toISOString()`);
console.log(`   Isto retorna: ${new Date().toISOString().substring(0, 19)}`);
console.log(`   ⚠️  Isto é UTC, não hora de Brasília!`);
console.log();

// O frontend recebe a data UTC e tenta exibir
const receivedFromDB = '2026-02-07T04:58:00.000Z'; // Isto veio do banco
const dateObj = new Date(receivedFromDB);

console.log('5️⃣  FRONTEND RECEBE DO BANCO:');
console.log(`   Raw: "${receivedFromDB}"`);
console.log(`   JavaScript interpreta como UTC: ${dateObj.toISOString()}`);
console.log();

// Se o timezone.js converter corretamente para Brasília
const brahsiliaTime = dateObj.toLocaleString('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

console.log('6️⃣  SE O FRONTEND CONVERTER CORRETAMENTE:');
console.log(`   Resultado: ${brahsiliaTime}`);
console.log(`   ✅ 04:58 UTC → 01:58 Brasília (correto!)`);
console.log();

console.log('=' .repeat(60));
console.log('🔧 SOLUÇÃO NECESSÁRIA:');
console.log('=' .repeat(60));
console.log();
console.log('O backend deve enviar as datas JÁ EM BRASÍLIA, não em UTC.');
console.log('OU');
console.log('O backend deve enviar um indicador de timezone junto com a data.');
console.log();
console.log('OPÇÃO 1 - Backend guarda em Brasília (RECOMENDADO):');
console.log('  const brasiliaDate = new Date().toLocaleString("pt-BR", {');
console.log('    timeZone: "America/Sao_Paulo"');
console.log('  });');
console.log('  Depois converte para ISO: converted_date.toISOString()');
console.log();
console.log('OPÇÃO 2 - Backend indica timezone:');
console.log('  Returna { withdrawn_at: "...", timezone: "America/Sao_Paulo" }');
console.log();
console.log('OPÇÃO 3 - Frontend assume que é UTC e converte corretamente:');
console.log('  date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })');
console.log('  ← JÁ ESTÁ SENDO FEITO NO TIMEZONE.JS!');
console.log();
console.log('=' .repeat(60));
