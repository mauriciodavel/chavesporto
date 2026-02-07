#!/usr/bin/env node
// Teste se a normalização de datas está funcionando

const { normalizeSupabaseDate } = require('./backend/utils/dateNormalizer');

console.log('🧪 TESTE DE NORMALIZAÇÃO DE DATAS\n');

// Teste 1: Adicionar Z a uma data sem Z
const dateWithoutZ = '2026-02-07T04:58:21.618';
const normalized = normalizeSupabaseDate(dateWithoutZ);

console.log('1️⃣  Data do Supabase (sem Z):');
console.log(`   Input:  "${dateWithoutZ}"`);
console.log(`   Output: "${normalized}"`);
console.log(`   ✓ Tem Z? ${normalized.endsWith('Z') ? 'SIM' : 'NÃO'}`);
console.log();

// Teste 2: Data que já tem Z
const dateWithZ = '2026-02-07T04:58:21.618Z';
const normalizedZ = normalizeSupabaseDate(dateWithZ);

console.log('2️⃣  Data com Z (já correta):');
console.log(`   Input:  "${dateWithZ}"`);
console.log(`   Output: "${normalizedZ}"`);
console.log();

// Teste 3: Como JavaScript interpreta
const dateObj1 = new Date(dateWithoutZ);
const dateObj2 = new Date(normalized);

console.log('3️⃣  Como JavaScript interpreta:');
console.log(`   Sem Z: new Date("${dateWithoutZ}")`);
console.log(`          → Offset: ${dateObj1.getTimezoneOffset() / 60}h`);
console.log(`          → UTC: ${dateObj1.toISOString()}`);
console.log();
console.log(`   Com Z: new Date("${normalized}")`);
console.log(`          → Offset: ${dateObj2.getTimezoneOffset() / 60}h`);
console.log(`          → UTC: ${dateObj2.toISOString()}`);
console.log();

// Teste 4: Conversão para Brasília
const brasilia1 = dateObj1.toLocaleString('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit', 
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

const brasilia2 = dateObj2.toLocaleString('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

console.log('4️⃣ Conversão para Brasília:');
console.log(`   Sem Z → Brasília: ${brasilia1}`);
console.log(`   Com Z → Brasília: ${brasilia2}`);
console.log();

if (brasilia1 === brasilia2) {
  console.log('✓ SUCESSO: Ambas retornam a mesma hora em Brasília');
} else {
  console.log(`❌ FALHA: Horas diferentes!`);
  console.log(`   Sem Z resultou em: ${brasilia1}`);
  console.log(`   Com Z resultou em: ${brasilia2}`);
}
