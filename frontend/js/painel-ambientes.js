/* ============================================
   PAINEL DE AMBIENTES - SCRIPT
   ============================================ */

// ============================================
// CONFIGURAÇÕES
// ============================================

const API_BASE = '/api';
const MEDIA_STORAGE_KEY = 'painel_media_storage';
const ADMIN_TOKEN_KEY = 'painel_admin_token';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

let isAdminMode = false;
let adminToken = null;
let currentUploadType = 1; // 1, 2, or 3
let ambientesData = [];
let filteredData = [];

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Inicializando Painel de Ambientes');
  
  // Atualizar hora e data
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // Carregamento inicial de dados
  await loadAmbientes();

  // Auto-atualizar dados a cada 30 segundos
  setInterval(loadAmbientes, 30000);

  // Re-filtrar a cada minuto para acompanhar mudanças de turno
  setInterval(filterAndSort, 60000);

  // Carregar mídia do servidor
  await loadMediaFromServer();

  // Verificar token admin no localStorage
  checkAdminToken();

  // Event listeners
  setupEventListeners();

  console.log('✅ Painel de Ambientes inicializado');
});

// ============================================
// ATUALIZAR HORA E DATA
// ============================================

function updateDateTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR');
  const dateStr = now.toLocaleDateString('pt-BR');
  
  document.getElementById('currentTime').textContent = timeStr;
  document.getElementById('currentDate').textContent = dateStr;
  
  // Atualizar indicador de turno ativo
  updateActiveTurnIndicator();
}

function updateActiveTurnIndicator() {
  const now = new Date();
  const hours = now.getHours();
  const indicator = document.getElementById('activeTurnIndicator');
  
  let turnText = '';
  let turnEmoji = '';
  
  if (hours >= 6 && hours < 12) {
    turnText = '📅 Turno: Matutino/Integral';
    turnEmoji = '';
  } else if (hours >= 12 && hours < 17.5) {
    turnText = '📅 Turno: Vespertino/Integral';
    turnEmoji = '';
  } else if (hours >= 17.5 && hours < 22) {
    turnText = '📅 Turno: Noturno';
    turnEmoji = '';
  } else {
    turnText = '📅 Fora do horário';
    turnEmoji = '';
  }
  
  indicator.textContent = turnText;
}

// ============================================
// CARREGAR AMBIENTES COM RESERVAS ATIVAS
// ============================================

async function loadAmbientes() {
  try {
    const response = await fetch(`${API_BASE}/painel`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      ambientesData = data.data || [];
      console.log(`✅ ${ambientesData.length} ambiente(s) com reserva ativa carregado(s)`);
      
      // Aplicar filtros e ordenação
      filterAndSort();
    } else {
      console.error('❌ Erro ao carregar ambientes:', data.message);
      showNoData();
    }
  } catch (error) {
    console.error('❌ Erro ao buscar ambientes:', error);
    showNoData();
  }
}

// ============================================
// DETERMINAR TURNO ATIVO BASEADO NA HORA ATUAL
// ============================================

function getActiveTurns() {
  const now = new Date();
  const hours = now.getHours();
  const activeTurns = [];

  // A) Entre 06:00 e 12:00: matutino ou integral
  if (hours >= 6 && hours < 12) {
    activeTurns.push('matutino', 'integral');
  }
  // B) Entre 12:00 e 17:30: vespertino ou integral
  else if (hours >= 12 && hours < 17.5) {
    activeTurns.push('vespertino', 'integral');
  }
  // C) Entre 17:30 e 22:00: noturno
  else if (hours >= 17.5 && hours < 22) {
    activeTurns.push('noturno');
  }
  // Fora do horário: mostrar tudo
  else {
    activeTurns.push('matutino', 'vespertino', 'noturno', 'integral');
  }

  return activeTurns;
}

// ============================================
// FILTRAR E ORDENAR DADOS
// ============================================

function filterAndSort() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const sortBy = document.getElementById('sortSelect').value;
  const activeTurns = getActiveTurns();

  // Filtrar por turno ativo e termo de busca
  filteredData = ambientesData.filter(item => {
    // Verificar se o turno está ativo
    if (!activeTurns.includes(item.shift)) {
      return false;
    }

    // Aplicar filtro de busca
    const searchFields = [
      item.turma || '',
      item.instructor_name || '',
      item.environment || '',
      item.location || '',
      item.shift || ''
    ].join(' ').toLowerCase();

    return searchFields.includes(searchTerm);
  });

  // Ordenar
  sortData(sortBy);

  // Renderizar
  renderTable();
}

function sortData(sortBy) {
  switch(sortBy) {
    case 'turma':
      filteredData.sort((a, b) => (a.turma || '').localeCompare(b.turma || ''));
      break;
    case 'instructor':
      filteredData.sort((a, b) => (a.instructor_name || '').localeCompare(b.instructor_name || ''));
      break;
    case 'environment':
      filteredData.sort((a, b) => (a.environment || '').localeCompare(b.environment || ''));
      break;
    case 'time':
      filteredData.sort((a, b) => {
        const timeA = parseTimeToMinutes(a.start_time || '');
        const timeB = parseTimeToMinutes(b.start_time || '');
        return timeA - timeB;
      });
      break;
  }
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

// ============================================
// RENDERIZAR TABELA
// ============================================

function renderTable() {
  const tbody = document.getElementById('ambientesTableBody');
  const noDataMsg = document.getElementById('noDataMessage');

  if (filteredData.length === 0) {
    tbody.innerHTML = '';
    noDataMsg.style.display = 'block';
    return;
  }

  noDataMsg.style.display = 'none';

  tbody.innerHTML = filteredData.map(item => `
    <tr class="ambiente-row" onclick="showDetails('${item.id}')">
      <td>
        <span class="status-badge ${getStatusClass(item.key_status)}">
          <span class="status-dot"></span>
          ${getStatusLabel(item.key_status)}
        </span>
      </td>
      <td><strong>${item.turma || '-'}</strong></td>
      <td>${item.instructor_name || '-'}</td>
      <td>${item.environment || '-'}</td>
      <td>${item.description || '-'}</td>
      <td>
        ${item.start_time && item.end_time 
          ? `<time>${item.start_time} - ${item.end_time}</time>` 
          : '-'}
      </td>
      <td>${getShiftLabel(item.shift)}</td>
    </tr>
  `).join('');
}

function getStatusClass(keyStatus) {
  const statusMap = {
    'reservado': 'status-reserved',
    'withdrawn': 'status-withdrawn',
    'returned': 'status-returned'
  };
  return statusMap[keyStatus] || 'status-inactive';
}

function getStatusLabel(keyStatus) {
  const statusMap = {
    'reservado': '📦 Reservado',
    'withdrawn': '🔑 Em uso',
    'returned': '✅ Devolvido'
  };
  return statusMap[keyStatus] || 'Desconhecido';
}

function getShiftLabel(shift) {
  const shiftMap = {
    'matutino': '🌅 Matutino',
    'vespertino': '🌤️ Vespertino',
    'noturno': '🌙 Noturno',
    'integral': '☀️ Integral'
  };
  return shiftMap[shift] || shift;
}

function showNoData() {
  const tbody = document.getElementById('ambientesTableBody');
  const noDataMsg = document.getElementById('noDataMessage');
  tbody.innerHTML = '';
  noDataMsg.style.display = 'block';
}

// ============================================
// MOSTRAR DETALHES
// ============================================

function showDetails(ambienteId) {
  const ambiente = ambientesData.find(a => a.id === ambienteId);
  if (!ambiente) return;

  const modal = document.getElementById('detailsModal');
  const title = document.getElementById('detailsTitle');
  const body = document.getElementById('detailsModalBody');

  title.textContent = `${ambiente.environment} - ${ambiente.turma}`;

  body.innerHTML = `
    <div class="details-grid">
      <div class="detail-item">
        <label>Código da Turma</label>
        <p>${ambiente.turma || '-'}</p>
      </div>
      <div class="detail-item">
        <label>Nome do Instrutor</label>
        <p>${ambiente.instructor_name || '-'}</p>
      </div>
      <div class="detail-item">
        <label>Unidade Curricular</label>
        <p>${ambiente.environment || '-'}</p>
      </div>
      <div class="detail-item">
        <label>Lotação</label>
        <p>${ambiente.location || '-'}</p>
      </div>
      <div class="detail-item">
        <label>Horário</label>
        <p>${ambiente.start_time && ambiente.end_time 
          ? `${ambiente.start_time} às ${ambiente.end_time}` 
          : '-'}</p>
      </div>
      <div class="detail-item">
        <label>Turno</label>
        <p>${getShiftLabel(ambiente.shift)}</p>
      </div>
      <div class="detail-item">
        <label>Status da Chave</label>
        <p class="status-badge ${getStatusClass(ambiente.key_status)}">
          <span class="status-dot"></span>
          ${getStatusLabel(ambiente.key_status)}
        </p>
      </div>
      <div class="detail-item">
        <label>Período de Reserva</label>
        <p>${formatDate(ambiente.start_date)} até ${formatDate(ambiente.end_date)}</p>
      </div>
      ${ambiente.motivo_detalhado ? `
        <div class="detail-item full-width">
          <label>Motivo da Reserva</label>
          <p>${ambiente.motivo_detalhado}</p>
        </div>
      ` : ''}
    </div>
  `;

  openModal('detailsModal');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  // Parsear a data manualmente para evitar problemas com timezone
  // "2026-04-04" → [2026, 04, 04]
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day); // Month é zero-indexed
  return date.toLocaleDateString('pt-BR');
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Search
  document.getElementById('searchInput').addEventListener('input', filterAndSort);

  // Sort
  document.getElementById('sortSelect').addEventListener('change', filterAndSort);

  // Media upload input
  document.getElementById('mediaUploadInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndPreviewFile(file);
    }
  });
}

// ============================================
// ADMIN LOGIN
// ============================================

async function handleAdminLogin(event) {
  event.preventDefault();

  const matricula = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matricula, password })
    });

    const data = await response.json();

    if (data.success && data.user && data.user.role === 'admin') {
      adminToken = data.token;
      localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
      isAdminMode = true;

      enableAdminMode();
      closeModal('adminLoginModal');
      showUploadStatus('✅ Login como admin realizado com sucesso!', 'success');

      console.log('✅ Admin mode ativado');
    } else {
      showUploadStatus('❌ Apenas administradores podem acessar', 'error');
    }
  } catch (error) {
    console.error('❌ Erro no login:', error);
    showUploadStatus('❌ Erro ao fazer login', 'error');
  }
}

function checkAdminToken() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    adminToken = token;
    isAdminMode = true;
    enableAdminMode();
  }
}

function enableAdminMode() {
  isAdminMode = true;
  
  // Esconder botão de login
  const loginBtn = document.getElementById('adminLoginBtnSidebar');
  if (loginBtn) loginBtn.style.display = 'none';
  
  // Mostrar botão de atualizar mídia
  document.getElementById('updateMediaBtn').style.display = 'block';
  
  // Mostrar seção de informações
  document.getElementById('mediaInfoSection').style.display = 'block';
  
  // Mostrar indicador de admin
  document.getElementById('adminModeIndicator').style.display = 'block';

  console.log('✅ Modo admin ativado');
}

function logoutAdmin() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  adminToken = null;
  isAdminMode = false;

  // Mostrar botão de login
  const loginBtn = document.getElementById('adminLoginBtnSidebar');
  if (loginBtn) loginBtn.style.display = 'block';
  
  // Esconder botão de atualizar mídia
  document.getElementById('updateMediaBtn').style.display = 'none';
  
  // Esconder seção de informações
  document.getElementById('mediaInfoSection').style.display = 'none';
  
  // Fechar modal se estiver aberto
  closeUpdateMediaModal();
  
  document.getElementById('adminModeIndicator').style.display = 'none';

  showUploadStatus('✅ Desconectado', 'success');
  console.log('✅ Modo admin desativado');
}

// ============================================
// MODAL DE ATUALIZAR MÍDIA
// ============================================

function openUpdateMediaModal() {
  document.getElementById('updateMediaModal').style.display = 'flex';
  console.log('📤 Modal de atualizar mídia aberto');
}

function closeUpdateMediaModal() {
  document.getElementById('updateMediaModal').style.display = 'none';
  document.getElementById('uploadStatus').textContent = '';
  document.getElementById('mediaUploadInput').value = '';
  console.log('📤 Modal de atualizar mídia fechado');
}

// ============================================
// UPLOAD DE MÍDIA
// ============================================

function switchUploadTab(type) {
  currentUploadType = type;

  // Atualizar tabs
  document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx + 1 === type);
  });

  // Atualizar input
  const input = document.getElementById('mediaUploadInput');
  if (type === 3) {
    input.accept = 'video/mp4,video/webm';
  } else {
    input.accept = 'image/jpeg,image/png,image/gif,image/webp';
  }

  input.value = ''; // Limpar seleção anterior
}

function validateAndPreviewFile(file) {
  const isVideo = currentUploadType === 3;
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  const fileType = isVideo ? 'vídeo' : 'imagem';

  if (file.size > maxSize) {
    showUploadStatus(`❌ ${fileType} muito grande. Máximo: ${maxSize / 1024 / 1024}MB`, 'error');
    return false;
  }

  // Validar tipo de arquivo
  if (isVideo && !file.type.startsWith('video/')) {
    showUploadStatus('❌ Apenas vídeos MP4/WebM são permitidos', 'error');
    return false;
  }

  if (!isVideo && !file.type.startsWith('image/')) {
    showUploadStatus('❌ Apenas imagens JPG/PNG/GIF/WebP são permitidas', 'error');
    return false;
  }

  showUploadStatus(`✅ Arquivo selecionado: ${file.name}`, 'success');
  return true;
}

async function uploadMedia() {
  if (!isAdminMode || !adminToken) {
    showUploadStatus('❌ Você precisa estar logado como admin', 'error');
    return;
  }

  const input = document.getElementById('mediaUploadInput');
  const file = input.files[0];

  if (!file) {
    showUploadStatus('❌ Selecione um arquivo', 'error');
    return;
  }

  // Validar arquivo
  if (!validateAndPreviewFile(file)) {
    return;
  }

  try {
    showUploadStatus('🔄 Enviando arquivo...', 'info');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', currentUploadType);

    console.log('📤 Enviando para:', `${API_BASE}/painel/media/upload`);
    console.log('   Arquivo:', file.name, '|', file.type, '|', file.size, 'bytes');
    console.log('   Tipo de mídia:', currentUploadType);

    // Passo 1: Preparar upload (backend deleta antigos e retorna info)
    console.log('📝 Passo 1: Preparando upload no servidor...');
    const filename = `media_${currentUploadType}_${Date.now()}${getFileExtension(file.name)}`;
    
    console.log('   Enviando para /media/prepare-upload');
    console.log('   Body:', { type: currentUploadType, filename: filename, filesize: file.size });
    
    const prepareResponse = await fetch(`${API_BASE}/painel/media/prepare-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: currentUploadType,
        filename: filename,
        filesize: file.size
      })
    });

    console.log('   ✅ Resposta de prepare-upload recebida');
    console.log('   Status:', prepareResponse.status, prepareResponse.statusText);

    if (!prepareResponse.ok) {
      const errorText = await prepareResponse.text();
      console.error('❌❌❌ ERRO NA FASE 1 (Prepare):', prepareResponse.status);
      console.error('   Erro:', errorText.substring(0, 300));
      showUploadStatus(`❌ Erro ao preparar upload (HTTP ${prepareResponse.status})`, 'error');
      return;
    }

    let prepareData;
    try {
      prepareData = await prepareResponse.json();
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse de JSON:', parseError.message);
      showUploadStatus('❌ Erro ao processar resposta do servidor', 'error');
      return;
    }

    console.log('✅ Prepare data recebido:', prepareData);

    if (!prepareData.success) {
      console.error('❌ Prepare não foi bem-sucedido:', prepareData.message);
      showUploadStatus(`❌ ${prepareData.message}`, 'error');
      return;
    }

    // Passo 2: Fazer upload direto para Supabase (sem passar pelo backend)
    console.log('\n📤 Passo 2: Fazendo upload direto para Supabase...');
    console.log('   URL:', prepareData.uploadUrl);
    console.log('   Tamanho do arquivo:', file.size, 'bytes');
    console.log('   Tipo de arquivo:', file.type);

    const uploadResponse = await fetch(prepareData.uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${prepareData.supabaseKey}`,
        'Content-Type': file.type
      },
      body: file
    });

    console.log('   ✅ Resposta do upload Supabase recebida');
    console.log('   Status:', uploadResponse.status, uploadResponse.statusText);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌❌❌ ERRO NA FASE 2 (Upload Supabase):', uploadResponse.status);
      console.error('   Erro:', errorText.substring(0, 300));
      showUploadStatus(`❌ Erro ao fazer upload para Supabase (HTTP ${uploadResponse.status})`, 'error');
      return;
    }

    // Passo 3: Gerar URL pública
    console.log('\n🔗 Passo 3: Gerando URL pública...');
    const publicUrl = `${process.env.SUPABASE_URL || 'https://gxkmcqcgorkscabzuhks.supabase.co'}/storage/v1/object/public/${prepareData.bucket}/${prepareData.uploadPath}`;
    console.log('   URL pública:', publicUrl);

    // Criar objeto de mídia
    const media = {
      type: currentUploadType,
      filename: filename,
      url: publicUrl,
      timestamp: new Date().toISOString()
    };

    // Salvar no localStorage
    saveMediaToStorage(media);
    
    // Atualizar exibição
    displayMedia(currentUploadType, media);

    showUploadStatus('✅ Arquivo enviado com sucesso!', 'success');
    input.value = '';
    console.log('✅✅✅ UPLOAD COMPLETO!');
    console.log('📤 Mídia enviada:', media);
  } catch (error) {
    console.error('❌ Erro ao enviar arquivo:', error);
    console.error('   Stack:', error.stack);
    showUploadStatus('❌ Erro ao enviar arquivo: ' + error.message, 'error');
  }
}

// Helper para extrair extensão do arquivo
function getFileExtension(filename) {
  const match = filename.match(/\.[^.]*$/);
  return match ? match[0] : '';
}
}

// ============================================
// GERENCIAMENTO DE MÍDIA (LOCAL STORAGE)
// ============================================

function saveMediaToStorage(media) {
  const storage = JSON.parse(localStorage.getItem(MEDIA_STORAGE_KEY) || '{}');
  storage[`media_${media.type}`] = media;
  localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(storage));
  console.log('💾 Media salva no localStorage');
}

async function loadMediaFromServer() {
  try {
    console.log('📥 Carregando mídias do servidor...');
    
    const response = await fetch(`${API_BASE}/painel/media`);
    if (!response.ok) {
      console.warn('⚠️ Erro ao carregar mídias do servidor');
      return;
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      [1, 2, 3].forEach(type => {
        const media = result.data[String(type)];
        if (media && media.url) {
          console.log(`✅ Mídia ${type} encontrada: ${media.url}`);
          displayMedia(type, media);
        }
      });
    }
  } catch (error) {
    console.error('❌ Erro ao carregar mídias do servidor:', error);
  }
}

function loadMediaFromStorage() {
  const storage = JSON.parse(localStorage.getItem(MEDIA_STORAGE_KEY) || '{}');

  [1, 2, 3].forEach(type => {
    const media = storage[`media_${type}`];
    if (media) {
      displayMedia(type, media);
    }
  });
}

function displayMedia(type, media) {
  const mediaItem = document.getElementById(`mediaItem${type}`);
  const placeholder = document.getElementById(`mediaPlaceholder${type}`);
  const display = document.getElementById(`media${type === 3 ? 'Video' : 'Image'}${type}`);
  const controls = document.getElementById(`mediaControls${type}`);

  if (type === 3) {
    // Vídeo
    display.src = media.url || createObjectURL(media);
  } else {
    // Imagem
    display.src = media.url || createObjectURL(media);
  }

  // Mostrar o media-item
  mediaItem.style.display = 'flex';
  placeholder.style.display = 'none';
  display.style.display = 'block';
  controls.style.display = 'block';
}

function createObjectURL(media) {
  // Se temos um blob ou arquivo local, criar URL
  if (media.blob) {
    return URL.createObjectURL(media.blob);
  }
  return media.url || '';
}

function removeMedia(type) {
  const mediaItem = document.getElementById(`mediaItem${type}`);
  const placeholder = document.getElementById(`mediaPlaceholder${type}`);
  const display = document.getElementById(`media${type === 3 ? 'Video' : 'Image'}${type}`);
  const controls = document.getElementById(`mediaControls${type}`);

  // Esconder o media-item inteiro
  mediaItem.style.display = 'none';
  placeholder.style.display = 'flex';
  display.style.display = 'none';
  controls.style.display = 'none';
  display.src = '';

  // Remover do localStorage
  const storage = JSON.parse(localStorage.getItem(MEDIA_STORAGE_KEY) || '{}');
  delete storage[`media_${type}`];
  localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(storage));

  // Remover do servidor
  deleteMediaFromServer(type);

  console.log('🗑️ Mídia removida:', type);
}

async function deleteMediaFromServer(type) {
  if (!adminToken) return;

  try {
    await fetch(`${API_BASE}/painel/media/${type}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
  } catch (error) {
    console.error('❌ Erro ao deletar mídia do servidor:', error);
  }
}

// ============================================
// UI HELPERS
// ============================================

function showUploadStatus(message, type) {
  const statusDiv = document.getElementById('uploadStatus');
  statusDiv.textContent = message;
  statusDiv.className = `upload-status ${type}`;

  if (type !== 'info') {
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'upload-status';
    }, 4000);
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});

// ============================================
// AUTO-REFRESH
// ============================================

setInterval(() => {
  console.log('🔄 Recarregando dados de ambientes...');
  loadAmbientes();
}, 60000); // A cada 1 minuto

console.log('✅ Painel de Ambientes carregado');
