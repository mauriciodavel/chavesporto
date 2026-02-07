// Dashboard Script
if (!checkAuth('instructor')) {
  // Será redirecionado automaticamente
}

const userData = AuthManager.getUserData();
let allKeys = [];
let userHistory = [];
let currentModal = null;

document.addEventListener('DOMContentLoaded', () => {
  initializeDashboard();
  setupEventListeners();
});

function initializeDashboard() {
  // Carregar dados do usuário
  if (userData) {
    document.getElementById('userName').textContent = userData.name;
    document.getElementById('userArea').textContent = userData.technical_area || 'Sem área definida';
  }

  // Carregar chaves e histórico
  loadKeys();
  loadUserHistory();

  // Auto-refresh a cada 15 segundos
  setInterval(() => {
    console.log('🔄 Atualizando dashboard...');
    loadKeys();
    loadUserHistory();
  }, 15000);
}

function setupEventListeners() {
  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  });

  // QR Modal
  document.getElementById('cancelQrBtn').addEventListener('click', () => {
    closeModal('qrModal');
    stopCamera();
  });

  document.getElementById('startCameraBtn').addEventListener('click', startCamera);
  document.getElementById('uploadQrBtn').addEventListener('click', () => {
    document.getElementById('qrFileInput').click();
  });

  document.getElementById('qrFileInput').addEventListener('change', handleQRImageUpload);
}

async function loadKeys() {
  try {
    const response = await ApiClient.get('/keys');
    if (response.success) {
      allKeys = response.data;
      displayKeys();
      updateStats();
    }
  } catch (error) {
    console.error('Erro ao carregar chaves:', error);
  }
}

async function loadUserHistory() {
  try {
    if (!userData?.id) return;

    const response = await ApiClient.get(`/history/instructors/${userData.id}`);
    if (response.success) {
      userHistory = response.data;
      displayHistory();
    }
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
  }
}

function displayKeys() {
  const container = document.getElementById('keysContainer');

  if (!allKeys || allKeys.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #999;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
        <p>Nenhuma chave cadastrada</p>
      </div>
    `;
    return;
  }

  container.innerHTML = allKeys.map(key => `
    <div class="key-card" onclick="selectKey('${key.id}', '${key.environment}')">
      <div class="key-card-icon">🔑</div>
      <div class="key-card-content">
        <div class="key-card-title">${key.environment}</div>
        <div class="key-card-info">
          <span>📍 ${key.location}</span>
        </div>
        <div class="key-card-info">
          <span>${key.description}</span>
        </div>
        ${key.lastActivity && key.status === 'in_use' ? `
        <div class="key-card-info" style="color: #ff9800; font-size: 0.875rem;">
          <span>👤 ${key.lastActivity.instructor}</span>
        </div>
        ` : ''}
        <div class="key-card-status">
          <div class="status-dot ${key.status === 'available' ? 'available' : 'in-use'}"></div>
          <span style="font-size: 0.75rem;">
            ${key.status === 'available' ? 'Disponível' : 'Em uso'}
          </span>
        </div>
        <button class="key-card-button" ${key.status !== 'available' ? 'disabled' : ''}>
          ${key.status === 'available' ? 'Retirar' : 'Indisponível'}
        </button>
      </div>
    </div>
  `).join('');
}

function selectKey(keyId, environment) {
  currentModal = {
    keyId,
    environment,
    action: null
  };

  const key = allKeys.find(k => k.id === keyId);

  if (key.status === 'available') {
    currentModal.action = 'withdraw';
    document.getElementById('qrModalTitle').textContent = `Retirar Chave - ${environment}`;
  } else {
    currentModal.action = 'check';
    document.getElementById('qrModalTitle').textContent = `Status da Chave - ${environment}`;
  }

  document.getElementById('qrModalSubtitle').textContent = `Leia o QR-Code da chave`;
  document.getElementById('qrResult').style.display = 'none';
  document.getElementById('qrStatus').textContent = '';

  openModal('qrModal');
}

let videoStream = null;

async function startCamera() {
  try {
    // Verificar se a API está disponível
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Câmera não disponível. Use um navegador moderno (Chrome, Firefox, Safari, Edge) em HTTPS ou localhost.');
    }

    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    const video = document.getElementById('qrVideo');
    video.srcObject = videoStream;
    video.style.display = 'block';

    document.getElementById('qrPlaceholder').style.display = 'none';
    document.getElementById('startCameraBtn').disabled = true;
    document.getElementById('uploadQrBtn').disabled = true;

    // Aguardar que o vídeo tenha dados antes de iniciar scan
    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      // Vídeo já pronto
      scanQRCode(video);
    } else {
      // Esperar carregamento
      video.onloadedmetadata = () => {
        video.play().catch(err => console.error('Erro ao reproduzir vídeo:', err));
        scanQRCode(video);
      };
    }
  } catch (error) {
    console.error('Erro ao acessar câmera:', error);
    document.getElementById('qrStatus').textContent = `Erro: ${error.message}`;
  }
}

function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }

  const video = document.getElementById('qrVideo');
  video.style.display = 'none';
  document.getElementById('qrPlaceholder').style.display = 'flex';
  document.getElementById('startCameraBtn').disabled = false;
  document.getElementById('uploadQrBtn').disabled = false;
}

async function scanQRCode(video) {
  const statusDiv = document.getElementById('qrStatus');
  
  // Mostrar mensagem de espera
  statusDiv.textContent = '⏳ Aponte a câmera para o QR-Code...';
  
  // Criar canvas fora do intervalo
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const scanInterval = setInterval(async () => {
    try {
      // Verificar se o vídeo está realmente com dados
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Definir dimensões do canvas baseado no vídeo
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        if (videoWidth && videoHeight) {
          canvas.width = videoWidth;
          canvas.height = videoHeight;
          
          // Desenhar frame do vídeo no canvas
          ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
          
          // Tentar decodificar QR code
          const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight);
          const code = jsQR(imageData.data, videoWidth, videoHeight);
          
          if (code) {
            clearInterval(scanInterval);
            stopCamera();
            await handleQRCodeScanned(code.data);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao escanear:', error);
      // Continuar tentando
    }
  }, 500);
}

async function handleQRImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const statusDiv = document.getElementById('qrStatus');
  statusDiv.textContent = 'Processando imagem...';

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const img = new Image();
      img.onload = async function() {
        // Criar canvas para ler a imagem
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Usar jsQR para decodificar
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);

        if (code) {
          // QR-Code encontrado!
          await handleQRCodeScanned(code.data);
        } else {
          statusDiv.textContent = '❌ Nenhum QR-Code encontrado na imagem. Tente outra foto.';
        }
      };
      img.src = event.target.result;
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      statusDiv.textContent = `❌ Erro ao processar imagem: ${error.message}`;
    }
  };
  reader.readAsDataURL(file);
}

async function handleQRCodeScanned(qrCode) {
  const statusDiv = document.getElementById('qrStatus');

  try {
    statusDiv.textContent = 'Verificando chave...';

    const response = await ApiClient.post('/keys/by-qr', { qrCode });

    if (!response.success) {
      statusDiv.textContent = 'Código QR não encontrado!';
      return;
    }

    const key = response.data;

    // Verificar se é a chave correta
    if (key.id !== currentModal.keyId) {
      statusDiv.textContent = 'Este não é o QR Code da chave selecionada!';
      return;
    }

    // Exibir resultado
    document.getElementById('qrResult').style.display = 'block';
    document.getElementById('qrResultText').textContent = `${key.environment} - ${key.location}`;

    stopCamera();

    if (currentModal.action === 'withdraw' && key.status === 'available') {
      // Botão de retirada
      document.getElementById('qrStatus').innerHTML = `
        <button class="btn btn-success btn-sm" onclick="confirmWithdraw('${key.id}')">
          ✓ Confirmar Retirada
        </button>
      `;
    } else if (currentModal.action === 'check') {
      // Mostrar status
      if (key.lastActivity) {
        const isAdmin = userData?.role === 'admin';
        let observationField = '';
        
        if (isAdmin) {
          observationField = `
            <div style="margin: 1rem 0;">
              <label for="returnObservation" style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem;">Observação (apenas admin):</label>
              <textarea id="returnObservation" placeholder="Digite uma observação..." style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid #555; background-color: #2a2a2a; color: #fff; font-size: 0.875rem;"></textarea>
            </div>
          `;
        }

        document.getElementById('qrStatus').innerHTML = `
          <p>🔴 <strong>Em uso por:</strong> ${key.lastActivity.instructor}</p>
          <p><strong>Desde:</strong> ${formatDateTime(key.lastActivity.withdrawnAt)}</p>
          ${observationField}
          <button class="btn btn-success btn-sm" onclick="confirmReturn('${key.id}')">
            ✓ Devolver Chave
          </button>
        `;
      } else {
        document.getElementById('qrStatus').textContent = 'Chave não possui registro de retirada ativa';
      }
    }
  } catch (error) {
    statusDiv.textContent = `Erro: ${error.message}`;
  }
}

async function confirmWithdraw(keyId) {
  if (!confirm('Confirmar retirada da chave?')) return;

  try {
    const response = await ApiClient.post(`/keys/${keyId}/withdraw`, {});

    if (response.success) {
      showAlert('instructorAlert', '✓ Chave retirada com sucesso!', 'success');
      closeModal('qrModal');
      loadKeys();
      loadUserHistory();

      setTimeout(() => {
        clearAlert('instructorAlert');
      }, 3000);
    }
  } catch (error) {
    showAlert('qrStatus', `Erro: ${error.message}`, 'danger');
  }
}

async function confirmReturn(keyId) {
  if (!confirm('Confirmar devolução da chave?')) return;

  try {
    console.log('🔄 Iniciando devolução de chave...', { keyId, userId: userData?.id, role: userData?.role });
    
    const body = {};
    
    // Se for admin, incluir observação se houver
    const observationField = document.getElementById('returnObservation');
    if (observationField && userData?.role === 'admin') {
      const observation = observationField.value.trim();
      if (observation) {
        body.observation = observation;
      }
    }

    console.log('📤 Enviando requisição POST para /keys/' + keyId + '/return', body);
    const response = await ApiClient.post(`/keys/${keyId}/return`, body);

    console.log('✅ Resposta recebida:', response);

    if (response.success) {
      showAlert('instructorAlert', '✓ Chave devolvida com sucesso!', 'success');
      closeModal('qrModal');
      loadKeys();
      loadUserHistory();

      setTimeout(() => {
        clearAlert('instructorAlert');
      }, 3000);
    } else {
      console.error('❌ API retornou sucesso=false:', response);
      showAlert('qrStatus', `Erro: ${response.message || 'Falha ao devolver chave'}`, 'danger');
    }
  } catch (error) {
    console.error('❌ Erro ao devolver chave:', error);
    console.error('   Tipo:', error.constructor.name);
    console.error('   Mensagem:', error.message);
    console.error('   Stack:', error.stack);
    
    let errorMsg = error.message;
    if (error.message && error.message.includes('success')) {
      try {
        const parsed = JSON.parse(error.message);
        errorMsg = parsed.message || error.message;
      } catch (e) {
        // Ignore parse error
      }
    }
    
    showAlert('qrStatus', `❌ Erro: ${errorMsg}`, 'danger');
  }
}

function displayHistory() {
  const container = document.getElementById('historyContainer');

  if (!userHistory || userHistory.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #999;">
        <div style="font-size: 2rem; margin-bottom: 1rem;">📭</div>
        <p>Nenhum registro encontrado</p>
      </div>
    `;
    return;
  }

  const table = `
    <table class="history-table">
      <thead>
        <tr>
          <th>Chave</th>
          <th>Retirada</th>
          <th>Devolução</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${userHistory.map(h => `
          <tr>
            <td>
              <strong>${h.keys?.environment}</strong><br>
              <small style="color: #999;">${h.keys?.location}</small>
            </td>
            <td>${formatDateTime(h.withdrawn_at)}</td>
            <td>${h.returned_at ? formatDateTime(h.returned_at) : '-'}</td>
            <td>
              <span class="badge ${h.status === 'returned' ? 'badge-success' : 'badge-warning'}">
                ${h.status === 'returned' ? 'Devolvida' : 'Em Uso'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = table;
}

function updateStats() {
  const available = allKeys.filter(k => k.status === 'available').length;
  const inUse = allKeys.filter(k => k.status === 'in_use').length;

  document.getElementById('availableCount').textContent = available;
  document.getElementById('inUseCount').textContent = inUse;
  document.getElementById('totalCount').textContent = allKeys.length;
}
