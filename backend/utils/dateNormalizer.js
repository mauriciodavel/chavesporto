/**
 * Utilitário para normalizar datas do Supabase
 * O Supabase retorna timestamps sem o 'Z' (sem informação de timezone explícita)
 * Isso causa o frontend interpretar como horário local em vez de UTC
 */

/**
 * Garante que a data seja um ISO string com 'Z' no final (UTC)
 * Se vier sem 'Z', adiciona manualmente
 */
function normalizeSupabaseDate(dateString) {
  if (!dateString) return null;
  
  // Se já tem 'Z' no final, retorna como está (é UTC)
  if (typeof dateString === 'string' && dateString.endsWith('Z')) {
    return dateString;
  }
  
  // Se tem +/- com hora (como +03:00), retorna como está
  if (typeof dateString === 'string' && /[+-]\d{2}:\d{2}/.test(dateString)) {
    return dateString;
  }
  
  // Se é uma string ISO (tem T e é data válida) mas sem timezone, adiciona Z
  if (typeof dateString === 'string' && dateString.includes('T') && !dateString.endsWith('Z')) {
    return dateString + 'Z';
  }
  
  return dateString;
}

/**
 * Normaliza um objeto com datas do Supabase
 * Procura por campos que parecem datas (withdrawn_at, returned_at, created_at, updated_at)
 */
function normalizeSupabaseRecord(record) {
  if (!record || typeof record !== 'object') return record;
  
  const normalized = { ...record };
  
  // Campos de data conhecidos
  const dateFields = ['withdrawn_at', 'returned_at', 'created_at', 'updated_at', 'deleted_at'];
  
  dateFields.forEach(field => {
    if (field in normalized && normalized[field]) {
      normalized[field] = normalizeSupabaseDate(normalized[field]);
    }
  });
  
  // Se tem relacionamentos (nested objects), normaliza também
  if ('keys' in normalized && typeof normalized.keys === 'object') {
    normalized.keys = normalizeSupabaseRecord(normalized.keys);
  }
  
  if ('instructors' in normalized && typeof normalized.instructors === 'object') {
    normalized.instructors = normalizeSupabaseRecord(normalized.instructors);
  }
  
  return normalized;
}

/**
 * Normaliza um array de registros Supabase
 */
function normalizeSupabaseRecords(records) {
  if (!Array.isArray(records)) return records;
  return records.map(normalizeSupabaseRecord);
}

module.exports = {
  normalizeSupabaseDate,
  normalizeSupabaseRecord,
  normalizeSupabaseRecords
};
