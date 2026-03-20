# Debug: Erro de Devolução

## Informações da Tentativa de Devolução

### 1. Mensagem de Erro (OBRIGATÓRIO)
Copie a mensagem EXATA que aparece na tela:
```
[COLE AQUI]
```

### 2. Estado da Chave
- **Quando foi retirada:** [hoje / ontem / há quantos dias?]
- **Horário da retirada:** [qual hora?]
- **Turno da chave:** [manhã / tarde / noite]
- **Qual filtro está usando:** [Chaves Disponíveis / Chaves em Atraso]

### 3. Quando aparece o erro?
- [ ] Ao clicar "Devolver"
- [ ] Após escanear QR Code
- [ ] Imediatamente
- [ ] Outro: _______________

### 4. ID da Chave (se possível)
```
Chave ID: [cole aqui]
```

### 5. Verificações
- [ ] A chave aparece em "Sua Reserva" com status "Em uso"?
- [ ] O botão "Devolver" está ativado (não disabled)?
- [ ] Consegue clicar sem erros?
- [ ] Consegue abrir a câmera?

---

## Como Obter Essas Informações

### Mensagem de Erro
Pressione `F12` → Abrir "Console" → Repita a ação → Procure por mensagens vermelhas

### ID da Chave
Inspecione a página com F12 → Element/Inspector → Procure por "550e8400" ou similar UUID

### Logs do Backend
Se tiver acesso ao servidor de produção, verifique os logs nos últimos minutos

---

Preenchido? Cole aqui seu comentário com essas informações!
