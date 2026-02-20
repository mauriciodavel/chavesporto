// ============================================
// RESERVATION CONTROLLER
// ============================================

const supabase = require("../config/supabase");
const emailService = require("../utils/emailService");

// ============================================
// 1. CREATE RESERVATION
// ============================================
exports.createReservation = async (req, res) => {
  try {
    console.log('🔍 [CREATE RESERVATION] Body recebido:', req.body);

    const {
      key_id,
      instructor_id,
      start_date,
      end_date,
      shift,
      turma,
      motivo_detalhado,
      created_by_admin,
    } = req.body;

    console.log('📋 [CREATE RESERVATION] Extraindo campos:');
    console.log('   key_id:', key_id, '✓' || '✗');
    console.log('   instructor_id:', instructor_id, '✓' || '✗');
    console.log('   start_date:', start_date, '✓' || '✗');
    console.log('   end_date:', end_date, '✓' || '✗');
    console.log('   shift:', shift, '✓' || '✗');
    console.log('   turma:', turma, '✓' || '✗');
    console.log('   motivo_detalhado:', motivo_detalhado, '✓' || '✗');
    console.log('   created_by_admin:', created_by_admin);

    // Validar se tentou criar como admin sem ser admin
    if (created_by_admin && req.user.role !== 'admin') {
      console.error('❌ [CREATE RESERVATION] Usuário não-admin tentou criar com created_by_admin=true');
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem criar reservas diretas (sem aprovação)'
      });
    }

    // Validação básica
    if (!key_id || !instructor_id || !start_date || !end_date || !shift) {
      const missingFields = [];
      if (!key_id) missingFields.push('key_id');
      if (!instructor_id) missingFields.push('instructor_id');
      if (!start_date) missingFields.push('start_date');
      if (!end_date) missingFields.push('end_date');
      if (!shift) missingFields.push('shift');
      
      console.error('❌ [CREATE RESERVATION] Campos faltando:', missingFields);
      return res
        .status(400)
        .json({
          success: false,
          message: "Campos obrigatórios faltando: " + missingFields.join(', '),
          missing: missingFields,
          received: { key_id, instructor_id, start_date, end_date, shift }
        });
    }

    // Status automático: admin auto-aprova, user fica pending
    const status = created_by_admin ? "approved" : "pending";

    console.log('✅ [CREATE RESERVATION] Validação passou, verificando disponibilidade...');

    // Lógica de conflito de turnos:
    // - INTEGRAL conflita com: matutino, vespertino e integral (NÃO com noturno)
    // - MATUTINO conflita com: integral e matutino (NÃO com outros)
    // - VESPERTINO conflita com: integral e vespertino (NÃO com outros)
    // - NOTURNO conflita com: noturno apenas
    let shiftsToCheck = [];
    
    switch(shift) {
      case 'integral':
        shiftsToCheck = ['integral', 'matutino', 'vespertino'];
        console.log('🔄 [CREATE RESERVATION] Shift INTEGRAL: verificando conflitos com', shiftsToCheck);
        break;
      case 'matutino':
        shiftsToCheck = ['integral', 'matutino'];
        console.log('🔄 [CREATE RESERVATION] Shift MATUTINO: verificando conflitos com', shiftsToCheck);
        break;
      case 'vespertino':
        shiftsToCheck = ['integral', 'vespertino'];
        console.log('🔄 [CREATE RESERVATION] Shift VESPERTINO: verificando conflitos com', shiftsToCheck);
        break;
      case 'noturno':
        shiftsToCheck = ['noturno'];
        console.log('🔄 [CREATE RESERVATION] Shift NOTURNO: verificando conflitos com', shiftsToCheck);
        break;
    }

    const { data: conflicts, error: conflictError } = await supabase
      .from("key_reservations")
      .select("id, shift, reservation_start_date, reservation_end_date")
      .eq("key_id", key_id)
      .in("shift", shiftsToCheck)
      .in("status", ["pending", "approved"])
      .lte("reservation_start_date", end_date)
      .gte("reservation_end_date", start_date);

    if (conflictError) {
      console.error('❌ [CREATE RESERVATION] Erro ao verificar conflitos:', conflictError);
      return res.status(400).json({
        success: false,
        message: "Erro ao verificar disponibilidade: " + conflictError.message
      });
    }

    if (conflicts && conflicts.length > 0) {
      const conflictDetails = conflicts.map(c => `${c.shift}`).join(', ');
      console.warn('⚠️ [CREATE RESERVATION] Conflitos encontrados:', conflictDetails);
      
      let conflictMessage = '';
      if (shift === 'integral') {
        conflictMessage = `A chave não está disponível para o turno INTEGRAL neste período. Existe(m) reserva(s) para: ${conflictDetails}. Escolha outra data.`;
      } else if (shift === 'matutino') {
        conflictMessage = `A chave não está disponível para o turno MATUTINO neste período. Existe(m) reserva(s) para: ${conflictDetails}. Escolha outra data.`;
      } else if (shift === 'vespertino') {
        conflictMessage = `A chave não está disponível para o turno VESPERTINO neste período. Existe(m) reserva(s) para: ${conflictDetails}. Escolha outra data.`;
      } else if (shift === 'noturno') {
        conflictMessage = `A chave não está disponível para o turno NOTURNO neste período. Existe(m) reserva(s) para: ${conflictDetails}. Escolha outra data.`;
      }
      
      return res.status(409).json({
        success: false,
        message: conflictMessage,
        conflict: true,
        conflicts: conflicts
      });
    }

    console.log('✅ [CREATE RESERVATION] Chave disponível, preparando inserción...');

    // ========== VERIFICAR BLOQUEIOS DE AMBIENTE ==========
    console.log('🔒 [CREATE RESERVATION] Verificando bloqueios de ambiente...');
    
    const { data: blockouts, error: blockoutError } = await supabase
      .from('key_reservations')
      .select('id, reservation_start_date, reservation_end_date, shift, turma')
      .eq('key_id', key_id)
      .eq('reservation_type', 'blockout')
      .eq('status', 'approved')
      .lte('reservation_start_date', end_date)
      .gte('reservation_end_date', start_date);

    if (blockoutError) {
      console.error('❌ [CREATE RESERVATION] Erro ao verificar bloqueios:', blockoutError);
      return res.status(400).json({
        success: false,
        message: 'Erro ao verificar bloqueios: ' + blockoutError.message
      });
    }

    if (blockouts && blockouts.length > 0) {
      console.warn('⚠️ [CREATE RESERVATION] Bloqueios encontrados:', blockouts.length);
      console.log('   Bloqueios:', blockouts.map(b => b.turma).join(', '));
      
      return res.status(409).json({
        success: false,
        message: 'Este ambiente está bloqueado neste período para manutenção ou evento',
        blockouts: blockouts
      });
    }

    console.log('✅ [CREATE RESERVATION] Nenhum bloqueio encontrado, prosseguindo...');

    // Se for ADMIN criando em BLOCO (múltiplos dias), expandir para um registro por dia
    // Se for INSTRUCTOR, sempre um registro (pois startDate == endDate)
    let reservationsToInsert = [];
    
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    
    if (created_by_admin && startDateObj.getTime() !== endDateObj.getTime()) {
      // Admin em bloco: criar um registro para cada dia
      console.log('📦 [CREATE RESERVATION] Admin criando em bloco:', start_date, 'a', end_date);
      
      let currentDay = new Date(startDateObj);
      while (currentDay <= endDateObj) {
        const dayStr = currentDay.toISOString().split('T')[0];
        
        reservationsToInsert.push({
          key_id,
          instructor_id,
          reservation_start_date: dayStr,
          reservation_end_date: dayStr,
          shift,
          turma,
          motivo_detalhado,
          status: 'approved',
          approved_by: req.user.id,
          approved_at: new Date().toISOString(),
        });
        
        currentDay.setDate(currentDay.getDate() + 1);
      }
      
      console.log(`✅ [CREATE RESERVATION] Expandido em ${reservationsToInsert.length} registros`);
    } else {
      // Instructor ou admin com um único dia: um registro
      console.log('📝 [CREATE RESERVATION] Criando um registro único');
      
      reservationsToInsert.push({
        key_id,
        instructor_id,
        reservation_start_date: start_date,
        reservation_end_date: end_date,
        shift,
        turma,
        motivo_detalhado,
        status,
        approved_by: created_by_admin ? req.user.id : null,
        approved_at: created_by_admin ? new Date().toISOString() : null,
      });
    }

    const { data, error } = await supabase
      .from("key_reservations")
      .insert(reservationsToInsert)
      .select();

    if (error) {
      console.error('❌ [CREATE RESERVATION] Erro no INSERT:', error);
      return res
        .status(400)
        .json({ 
          success: false, 
          message: "Erro ao criar reserva: " + error.message,
          details: error
        });
    }

    console.log('✅ [CREATE RESERVATION] Reserva criada com sucesso:', data?.length, 'registro(s)');
    
    const successMessage = data.length > 1 
      ? `Reserva em bloco criada com sucesso! ${data.length} entradas foram geradas (uma para cada dia).`
      : "Reserva criada com sucesso";
    
    return res.status(201).json({
      success: true,
      message: successMessage,
      data: data[0],
      count: data.length,
    });
  } catch (error) {
    console.error("❌ [CREATE RESERVATION] Erro CATCH:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao criar reserva",
      error: error.message,
    });
  }
};

// ============================================
// 2. LIST RESERVATIONS
// ============================================
exports.listReservations = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";
    const { key_id, shift } = req.query; // Parâmetros de filtro opcionais

    console.log('🔍 [LIST RESERVATIONS] userId:', userId, 'isAdmin:', isAdmin, 'key_id:', key_id, 'shift:', shift);

    // Passo 1: Pegar reservas com joins
    let query = supabase
      .from("key_reservations")
      .select("id, key_id, instructor_id, reservation_start_date, reservation_end_date, shift, turma, motivo_detalhado, status, rejection_reason, approved_by, approved_at, created_at, updated_at, keys(id, environment, location), instructor:instructor_id(id, name)");

    // Se não é admin E não está filtrando por key_id/shift, vê apenas suas próprias reservas
    // (key_id e shift são usados para ver dias BLOQUEADOS por outros instrutores)
    if (!isAdmin && (!key_id || !shift)) {
      query = query.eq("instructor_id", userId);
      console.log('   ➕ Filtro aplicado: instructor_id = userId (usuário não-admin sem filtros)');
    }

    // Adicionar filtros opcionais
    if (key_id) {
      query = query.eq("key_id", key_id);
      console.log('   ➕ Filtro aplicado: key_id =', key_id);
    }

    if (shift) {
      query = query.eq("shift", shift);
      console.log('   ➕ Filtro aplicado: shift =', shift);
    }

    const { data, error } = await query.order("reservation_start_date", {
      ascending: false,
    });

    if (error) {
      console.error("❌ [LIST RESERVATIONS] Erro ao listar reservas:", error);
      return res
        .status(400)
        .json({ success: false, message: "Erro ao buscar reservas: " + error.message, details: error });
    }

    console.log('✅ [LIST RESERVATIONS] Reservas encontradas:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('   📋 Primeira reserva (raw):', JSON.stringify(data[0], null, 2));
    }

    // Passo 2: Se os dados não vieram enriquecidos, buscar manualmente
    let enrichedData = (data || []).map(reservation => {
      let instructorName = 'Desconhecido';
      
      // Tentar vários padrões de acesso
      if (reservation.instructor?.name) {
        instructorName = reservation.instructor.name;
        console.log(`   ✅ instructor.name encontrado para ${reservation.id}: ${instructorName}`);
      } else if (reservation.instructor && typeof reservation.instructor === 'object' && Object.keys(reservation.instructor).length > 0) {
        console.log(`   ⚠️ instructor encontrado mas sem nome para ${reservation.id}:`, reservation.instructor);
      }

      return {
        ...reservation,
        key_name: reservation.keys?.environment || 'Chave desconhecida',
        key_location: reservation.keys?.location || '',
        instructor_name: instructorName
      };
    });

    // Passo 3: Se nenhum nome foi encontrado, fazer busca adicional dos instrutores
    const missingNames = enrichedData.filter(res => res.instructor_name === 'Desconhecido');
    if (missingNames.length > 0) {
      console.log(`⚠️ [LIST RESERVATIONS] ${missingNames.length} reservas sem nome de instrutor, buscando...`);
      
      const instructorIds = [...new Set(missingNames.map(res => res.instructor_id))];
      const { data: instructors } = await supabase
        .from("instructors")
        .select("id, name")
        .in("id", instructorIds);

      if (instructors && instructors.length > 0) {
        const instructorMap = {};
        instructors.forEach(inst => {
          instructorMap[inst.id] = inst.name;
        });
        
        enrichedData = enrichedData.map(res => ({
          ...res,
          instructor_name: res.instructor_name === 'Desconhecido' 
            ? (instructorMap[res.instructor_id] || 'Desconhecido')
            : res.instructor_name
        }));
        
        console.log('✅ Nomes de instrutores preenchidos');
      }
    }

    return res.status(200).json({
      success: true,
      message: "Reservas listadas com sucesso",
      data: enrichedData || [],
    });
  } catch (error) {
    console.error("❌ [LIST RESERVATIONS] Erro CATCH:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao listar reservas",
      error: error.message,
    });
  }
};

// ============================================
// 3. GET RESERVATION DETAIL
// ============================================
exports.getReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("key_reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: "Reserva não encontrada",
      });
    }

    // Verificar permissão: admin ve tudo, user ve apenas suas próprias
    if (req.user.role !== "admin" && data.instructor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Sem permissão para visualizar esta reserva",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Detalhe da reserva obtido",
      data,
    });
  } catch (error) {
    console.error("Erro ao obter detalhe:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao obter detalhe",
      error: error.message,
    });
  }
};

// ============================================
// 4. APPROVE RESERVATION (ADMIN ONLY)
// ============================================
exports.approveReservation = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar reserva
    const { data: reservation, error: fetchError } = await supabase
      .from("key_reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        message: "Reserva não encontrada",
      });
    }

    // Atualizar status
    const { data, error } = await supabase
      .from("key_reservations")
      .update({
        status: "approved",
        approved_by: req.user.id,
        approved_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.message });
    }

    // Enviar email de aprovação
    try {
      // Buscar dados do instrutor e chave para enviar email
      const { data: instructorData } = await supabase
        .from('instructors')
        .select('name, email')
        .eq('id', reservation.instructor_id)
        .single();
      
      const { data: keyData } = await supabase
        .from('keys')
        .select('environment')
        .eq('id', reservation.key_id)
        .single();
      
      if (instructorData && keyData) {
        await emailService.sendApprovalNotification(
          instructorData.email,
          instructorData.name,
          keyData.environment,
          reservation.key_id,
          reservation.reservation_start_date,
          reservation.reservation_end_date,
          reservation.shift,
          reservation.turma
        );
      }
    } catch (emailError) {
      console.error("Erro ao enviar email de aprovação:", emailError);
    }

    return res.status(200).json({
      success: true,
      message: "Reserva aprovada com sucesso",
      data,
    });
  } catch (error) {
    console.error("Erro ao aprovar reserva:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao aprovar reserva",
      error: error.message,
    });
  }
};

// ============================================
// 5. REJECT RESERVATION (ADMIN ONLY)
// ============================================
exports.rejectReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    // Buscar reserva
    const { data: reservation, error: fetchError } = await supabase
      .from("key_reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        message: "Reserva não encontrada",
      });
    }

    // Atualizar status
    const { data, error } = await supabase
      .from("key_reservations")
      .update({
        status: "rejected",
        rejection_reason,
        approved_by: req.user.id,
        approved_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.message });
    }

    // Enviar email de rejeição
    try {
      // Buscar dados do instrutor para enviar email
      const { data: instructorData } = await supabase
        .from('instructors')
        .select('name, email')
        .eq('id', reservation.instructor_id)
        .single();
      
      if (instructorData) {
        await emailService.sendRejectionNotification(
          instructorData.email,
          instructorData.name,
          rejection_reason
        );
      }
    } catch (emailError) {
      console.error("Erro ao enviar email de rejeição:", emailError);
    }

    return res.status(200).json({
      success: true,
      message: "Reserva rejeitada com sucesso",
      data,
    });
  } catch (error) {
    console.error("Erro ao rejeitar reserva:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao rejeitar reserva",
      error: error.message,
    });
  }
};

// ============================================
// 6. CHECK KEY AVAILABILITY
// ============================================
exports.checkAvailability = async (req, res) => {
  try {
    const { key_id } = req.params;
    const { start_date, end_date, shift } = req.query;

    if (!key_id || !start_date || !end_date || !shift) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Parâmetros obrigatórios faltando",
        });
    }

    // Chamar função helper do banco
    const { data, error } = await supabase.rpc("is_key_available", {
      p_key_id: key_id,
      p_start_date: start_date,
      p_end_date: end_date,
      p_shift: shift,
    });

    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.message });
    }

    return res.status(200).json({
      success: true,
      message: "Disponibilidade verificada",
      data: {
        is_available: data,
        key_id,
        period: `${start_date} até ${end_date}`,
        shift,
      },
    });
  } catch (error) {
    console.error("Erro ao verificar disponibilidade:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao verificar disponibilidade",
      error: error.message,
    });
  }
};

// ============================================
// 7. USER CANCEL RESERVATION (owner only)
// ============================================
exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('❌ [CANCEL RESERVATION] Cancelando reserva ID:', id, 'por usuário:', userId);

    // Buscar reserva
    const { data: reservation, error: fetchError } = await supabase
      .from("key_reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !reservation) {
      console.error('❌ [CANCEL RESERVATION] Reserva não encontrada:', fetchError);
      return res.status(404).json({
        success: false,
        message: "Reserva não encontrada",
      });
    }

    console.log('📋 [CANCEL RESERVATION] Reserva encontrada:', reservation.id, 'instructor_id:', reservation.instructor_id);

    // Verificar que é o dono (instructor_id do usuário)
    if (reservation.instructor_id !== userId) {
      console.error('❌ [CANCEL RESERVATION] Sem permissão - instructor_id:', reservation.instructor_id, 'userId:', userId);
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para cancelar esta reserva",
      });
    }

    // Deletar reserva (usando .eq para delete)
    const { error } = await supabase
      .from("key_reservations")
      .delete()
      .eq("id", id);

    console.log('🗑️ [CANCEL RESERVATION] Delete executado');
    console.log('   Error:', error);
    console.log('   Error code:', error?.code);
    console.log('   Error message:', error?.message);
    console.log('   Error status:', error?.status);
    console.log('   Error details:', JSON.stringify(error, null, 2));

    if (error) {
      console.error('❌ [CANCEL RESERVATION] Erro ao deletar:', error);
      return res.status(400).json({
        success: false,
        message: "Erro ao cancelar reserva: " + error.message,
        errorDetails: error
      });
    }

    console.log('✅ [CANCEL RESERVATION] Reserva cancelada com sucesso:', id);

    return res.status(200).json({
      success: true,
      message: "Reserva cancelada com sucesso",
    });
  } catch (error) {
    console.error("❌ [CANCEL RESERVATION] Erro CATCH:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao cancelar reserva",
      error: error.message,
    });
  }
};

// ============================================
// 8. CREATE PERMISSION (ADMIN ONLY)
// ============================================
exports.createPermission = async (req, res) => {
  try {
    const { key_id, instructor_id, permission_date, shift, reason } = req.body;

    if (!key_id || !instructor_id || !permission_date || !shift || !reason) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Campos obrigatórios faltando",
        });
    }

    const { data, error } = await supabase
      .from("key_permissions")
      .insert([
        {
          key_id,
          instructor_id,
          permission_date,
          shift,
          reason,
          authorized_by: req.user.id,
        },
      ])
      .select();

    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.message });
    }

    return res.status(201).json({
      success: true,
      message: "Permissão criada com sucesso",
      data: data[0],
    });
  } catch (error) {
    console.error("Erro ao criar permissão:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao criar permissão",
      error: error.message,
    });
  }
};

// ============================================
// 8. CREATE MAINTENANCE (ADMIN ONLY)
// ============================================
exports.createMaintenance = async (req, res) => {
  try {
    const { key_id, start_date, end_date, motivo, shift } = req.body;

    if (!key_id || !start_date || !end_date || !motivo) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Campos obrigatórios faltando",
        });
    }

    const { data, error } = await supabase
      .from("environment_maintenance")
      .insert([
        {
          key_id,
          maintenance_start_date: start_date,
          maintenance_end_date: end_date,
          motivo_resumido: motivo,
          shift: shift || null, // null = dia inteiro
          created_by: req.user.id,
        },
      ])
      .select();

    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.message });
    }

    return res.status(201).json({
      success: true,
      message: "Manutenção criada com sucesso",
      data: data[0],
    });
  } catch (error) {
    console.error("Erro ao criar manutenção:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao criar manutenção",
      error: error.message,
    });
  }
};

// ============================================
// 9. UPDATE RESERVATION (ADMIN ONLY)
// ============================================
exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { key_id, reservation_start_date, reservation_end_date, shift, turma, motivo_detalhado } = req.body;

    console.log('✏️ [UPDATE RESERVATION] Atualizando reserva:', id);
    console.log('   Dados:', { key_id, reservation_start_date, reservation_end_date, shift, turma, motivo_detalhado });

    // Buscar reserva
    const { data: reservation, error: fetchError } = await supabase
      .from("key_reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        message: "Reserva não encontrada",
      });
    }

    // Atualizar reserva
    const { data, error } = await supabase
      .from("key_reservations")
      .update({
        ...(key_id && { key_id }),
        ...(reservation_start_date && { reservation_start_date }),
        ...(reservation_end_date && { reservation_end_date }),
        ...(shift && { shift }),
        ...(turma && { turma }),
        ...(motivo_detalhado && { motivo_detalhado }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ [UPDATE RESERVATION] Erro ao atualizar:", error);
      return res.status(400).json({
        success: false,
        message: "Erro ao atualizar reserva: " + error.message,
      });
    }

    console.log("✅ [UPDATE RESERVATION] Reserva atualizada com sucesso");

    return res.status(200).json({
      success: true,
      message: "Reserva atualizada com sucesso",
      data,
    });
  } catch (error) {
    console.error("❌ [UPDATE RESERVATION] Erro CATCH:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao atualizar reserva",
      error: error.message,
    });
  }
};

// ============================================
// 10. DELETE RESERVATION (ADMIN ONLY)
// ============================================
exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    console.log('🗑️ [DELETE RESERVATION] Deletando reserva:', id, 'por admin:', adminId);

    // Buscar reserva antes de deletar (para log)
    const { data: reservation, error: fetchError } = await supabase
      .from("key_reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error('❌ [DELETE RESERVATION] Erro ao buscar reserva:', fetchError);
      return res.status(404).json({
        success: false,
        message: "Reserva não encontrada",
      });
    }

    console.log('📋 [DELETE RESERVATION] Reserva encontrada:', reservation.id);

    // Deletar reserva (usando .eq para delete)
    const { error } = await supabase
      .from("key_reservations")
      .delete()
      .eq("id", id);

    console.log('🗑️ [DELETE RESERVATION] Delete executado');
    console.log('   Error:', error);
    console.log('   Error code:', error?.code);
    console.log('   Error message:', error?.message);
    console.log('   Error status:', error?.status);
    console.log('   Error details:', JSON.stringify(error, null, 2));

    if (error) {
      console.error("❌ [DELETE RESERVATION] Erro ao deletar:", error);
      return res.status(400).json({
        success: false,
        message: "Erro ao deletar reserva: " + error.message,
        errorDetails: error
      });
    }

    console.log("✅ [DELETE RESERVATION] Reserva deletada com sucesso:", id);

    return res.status(200).json({
      success: true,
      message: "Reserva deletada com sucesso",
    });
  } catch (error) {
    console.error("❌ [DELETE RESERVATION] Erro CATCH:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao deletar reserva",
      error: error.message,
    });
  }
};

// ============================================
// CREATE ENVIRONMENT BLOCKOUT
// ============================================
// POST /api/reservations/blockout
// Criar bloqueio de ambiente (somente admin)
exports.createEnvironmentBlockout = async (req, res) => {
  try {
    console.log('🔒 [CREATE BLOCKOUT] Iniciando criação de bloqueio de ambiente');
    
    const {
      key_id,
      start_date,
      end_date,
      shift,
      blockout_type,  // 'maintenance' | 'internal_event' | 'external_event'
      motivo_detalhado
    } = req.body;

    // Validar permissão
    if (req.user.role !== 'admin') {
      console.error('❌ [CREATE BLOCKOUT] Usuário não é admin');
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem criar bloqueios de ambiente'
      });
    }

    // Validações básicas
    if (!key_id || !start_date || !end_date || !shift || !blockout_type) {
      const missing = [];
      if (!key_id) missing.push('key_id');
      if (!start_date) missing.push('start_date');
      if (!end_date) missing.push('end_date');
      if (!shift) missing.push('shift');
      if (!blockout_type) missing.push('blockout_type');
      
      console.error('❌ [CREATE BLOCKOUT] Campos obrigatórios faltando:', missing);
      return res.status(400).json({
        success: false,
        message: `Campos obrigatórios: ${missing.join(', ')}`
      });
    }

    // Validar datas
    if (new Date(start_date) > new Date(end_date)) {
      console.error('❌ [CREATE BLOCKOUT] Data inicial > data final');
      return res.status(400).json({
        success: false,
        message: 'Data inicial não pode ser posterior a data final'
      });
    }

    // Validar tipo de bloqueio
    const validTypes = ['maintenance', 'internal_event', 'external_event'];
    if (!validTypes.includes(blockout_type)) {
      console.error('❌ [CREATE BLOCKOUT] Tipo inválido:', blockout_type);
      return res.status(400).json({
        success: false,
        message: `Tipo de bloqueio deve ser: ${validTypes.join(', ')}`
      });
    }

    console.log('   Dados validados ✓');
    console.log('   key_id:', key_id);
    console.log('   Período:', start_date, 'a', end_date);
    console.log('   Tipo:', blockout_type);

    // Verificar se há conflito com outras reservas normais
    console.log('   Verificando conflitos com outras reservas...');
    
    const { data: conflicts, error: conflictError } = await supabase.admin
      .from('key_reservations')
      .select('id, reservation_start_date, reservation_end_date, turma')
      .eq('key_id', key_id)
      .eq('reservation_type', 'normal')
      .eq('status', 'approved')
      .lte('reservation_start_date', end_date)
      .gte('reservation_end_date', start_date);

    if (conflictError) throw conflictError;

    if (conflicts && conflicts.length > 0) {
      console.warn(`   ⚠️  ${conflicts.length} reserva(s) normal(is) em conflito`);
      return res.status(409).json({
        success: false,
        message: `Já existem ${conflicts.length} reserva(s) normal(is) neste período para este ambiente`,
        conflicts: conflicts
      });
    }

    console.log('   ✓ Nenhum conflito encontrado');

    // Criar bloqueio como reserva com reservation_type='blockout'
    const blockoutData = {
      key_id,
      instructor_id: req.user.id,  // Admin que criou
      reservation_start_date: start_date,
      reservation_end_date: end_date,
      shift,
      turma: `BLOQUEIO: ${blockout_type}`,  // Identificar que é bloqueio
      motivo_detalhado: motivo_detalhado || `Bloqueio: ${blockout_type}`,
      status: 'approved',  // Já aprovado pois é admin
      approved_by: req.user.id,
      approved_at: new Date().toISOString(),
      reservation_type: 'blockout',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('   Inserindo bloqueio no banco...');

    const { data, error } = await supabase.admin
      .from('key_reservations')
      .insert([blockoutData])
      .select();

    if (error) {
      console.error('❌ [CREATE BLOCKOUT] Erro ao inserir:', error);
      throw error;
    }

    console.log('✅ [CREATE BLOCKOUT] Bloqueio criado com sucesso:', data[0].id);

    return res.status(201).json({
      success: true,
      message: 'Bloqueio de ambiente criado com sucesso',
      data: data[0]
    });

  } catch (error) {
    console.error('❌ [CREATE BLOCKOUT] Erro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar bloqueio de ambiente',
      error: error.message
    });
  }
};
