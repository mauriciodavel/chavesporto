#!/usr/bin/env pwsh
# Teste simples das APIs de Reserva

$baseUrl = "http://localhost:3000"
$matricula = "admin"
$senha = "admin123"

Write-Host "`n=== TESTE DE APIs ===`n" -ForegroundColor Cyan

# 1. Login
Write-Host "1. Testando LOGIN..." -ForegroundColor Yellow
try {
    #$loginBody = '{"matricula":"admin","password":"admin123"}'
    #$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $loginBody = '{"email":"admin@senai.com.br","password":"admin123"}'
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/admin-login" -Method POST -ContentType "application/json" -Body $loginBody
    
    if ($loginResponse.success) {
        $token = $loginResponse.token
        Write-Host "OK - Token obtido" -ForegroundColor Green
    }
    else {
        Write-Host "ERRO - Login falhou" -ForegroundColor Red
        exit
    }
}
catch {
    Write-Host "ERRO - $_" -ForegroundColor Red
    exit
}

$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

# 2. Listar Reservas
Write-Host "`n2. Listando RESERVAS..." -ForegroundColor Yellow
try {
    $listResponse = Invoke-RestMethod -Uri "$baseUrl/api/reservations" -Method GET -Headers $headers
    if ($listResponse.success) {
        Write-Host ("OK - " + $listResponse.data.Count + " reservas encontradas") -ForegroundColor Green
        if ($listResponse.data.Count -gt 0) {
            $firstKeyId = $listResponse.data[0].key_id
            $firstReservationId = $listResponse.data[0].id
        }
    }
}
catch {
    Write-Host "ERRO - $_" -ForegroundColor Red
}

# 3. Criar Reserva
Write-Host "`n3. Criando RESERVA..." -ForegroundColor Yellow
try {
    $hoje = Get-Date -Format "yyyy-MM-dd"
    $futuro = (Get-Date).AddDays(5).ToString("yyyy-MM-dd")
    
    $createBody = @{
        key_id = $firstKeyId
        instructor_id = $loginResponse.user.id
        start_date = $hoje
        end_date = $futuro
        shift = "matutino"
        turma = "TESTE"
        motivo_detalhado = "Teste"
        created_by_admin = $false
    } | ConvertTo-Json

    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/reservations" -Method POST -Headers $headers -Body $createBody
    if ($createResponse.success) {
        Write-Host "OK - Reserva criada" -ForegroundColor Green
        $newReservationId = $createResponse.data.id
    }
}
catch {
    Write-Host "ERRO - $_" -ForegroundColor Red
}

# 4. Obter Detalhe
if ($newReservationId) {
    Write-Host "`n4. Obtendo DETALHE..." -ForegroundColor Yellow
    try {
        $detailResponse = Invoke-RestMethod -Uri "$baseUrl/api/reservations/$newReservationId" -Method GET -Headers $headers
        if ($detailResponse.success) {
            Write-Host "OK - Detalhe obtido" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "ERRO - $_" -ForegroundColor Red
    }
}

# 5. Verificar Disponibilidade
Write-Host "`n5. Verificando DISPONIBILIDADE..." -ForegroundColor Yellow
try {
    $url = "$baseUrl/api/reservations/keys/availability/$firstKeyId`?start_date=$hoje&end_date=$futuro&shift=matutino"
    $availResponse = Invoke-RestMethod -Uri $url -Method GET -Headers $headers
    if ($availResponse.success) {
        Write-Host "OK - Disponibilidade: $($availResponse.data.is_available)" -ForegroundColor Green
    }
}
catch {
    Write-Host "ERRO - $_" -ForegroundColor Red
}

# 6. Criar Permissão
Write-Host "`n6. Criando PERMISSÃO..." -ForegroundColor Yellow
try {
    $permBody = @{
        key_id = $firstKeyId
        instructor_id = $loginResponse.user.id
        permission_date = $hoje
        shift = "vespertino"
        reason = "Teste"
    } | ConvertTo-Json

    $permResponse = Invoke-RestMethod -Uri "$baseUrl/api/reservations/permissions" -Method POST -Headers $headers -Body $permBody
    if ($permResponse.success) {
        Write-Host "OK - Permissão criada" -ForegroundColor Green
    }
}
catch {
    Write-Host "AVISO - Requer admin ou erro de dados" -ForegroundColor Yellow
}

# 7. Criar Manutenção
Write-Host "`n7. Criando MANUTENÇÃO..." -ForegroundColor Yellow
try {
    $amanha = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    $maintBody = @{
        key_id = $firstKeyId
        start_date = $hoje
        end_date = $amanha
        motivo = "Limpeza"
        shift = $null
    } | ConvertTo-Json

    $maintResponse = Invoke-RestMethod -Uri "$baseUrl/api/reservations/maintenance" -Method POST -Headers $headers -Body $maintBody
    if ($maintResponse.success) {
        Write-Host "OK - Manutenção criada" -ForegroundColor Green
    }
}
catch {
    Write-Host "AVISO - Requer admin ou erro de dados" -ForegroundColor Yellow
}

# 8. Aprovar Reserva
if ($newReservationId) {
    Write-Host "`n8. Aprovando RESERVA..." -ForegroundColor Yellow
    try {
        $approveResponse = Invoke-RestMethod -Uri "$baseUrl/api/reservations/$newReservationId/approve" -Method PATCH -Headers $headers
        if ($approveResponse.success) {
            Write-Host "OK - Reserva aprovada" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "AVISO - Requer admin ou erro" -ForegroundColor Yellow
    }
}

# 9. Rejeitar (cria nova primeiro)
Write-Host "`n9. Rejeitando RESERVA..." -ForegroundColor Yellow
try {
    $futuro20 = (Get-Date).AddDays(20).ToString("yyyy-MM-dd")
    $futuro25 = (Get-Date).AddDays(25).ToString("yyyy-MM-dd")
    
    $createBody2 = @{
        key_id = $firstKeyId
        instructor_id = $loginResponse.user.id
        start_date = $futuro20
        end_date = $futuro25
        shift = "vespertino"
        turma = "TEST-REJECT"
        motivo_detalhado = "Para rejeitar"
        created_by_admin = $false
    } | ConvertTo-Json

    $createResponse2 = Invoke-RestMethod -Uri "$baseUrl/api/reservations" -Method POST -Headers $headers -Body $createBody2
    if ($createResponse2.success) {
        $rejectId = $createResponse2.data.id
        
        $rejectBody = @{ rejection_reason = "Teste de rejeição" } | ConvertTo-Json
        $rejectResponse = Invoke-RestMethod -Uri "$baseUrl/api/reservations/$rejectId/reject" -Method PATCH -Headers $headers -Body $rejectBody
        if ($rejectResponse.success) {
            Write-Host "OK - Reserva rejeitada" -ForegroundColor Green
        }
    }
}
catch {
    Write-Host "AVISO - Requer admin ou erro" -ForegroundColor Yellow
}

Write-Host "`n=== TESTES FINALIZADOS ===`n" -ForegroundColor Cyan
