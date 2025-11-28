# 📡 Setup - Sistema de Rastreadores AgroTrack

Este guia explica como configurar o sistema de adição de rastreadores com ícones personalizados.

## 🎯 Funcionalidades Implementadas

✅ Página completa para adicionar rastreadores
✅ Seletor visual de ícones com 40+ opções
✅ Seletor de cores personalizado
✅ Formulário com 3 seções (Básico, Aparência, Detalhes)
✅ Validação de IMEI (15 dígitos)
✅ Validação de placa brasileira
✅ Campos específicos por tipo (veículo, animal, equipamento)
✅ Integração com Traccar
✅ Armazenamento de metadados no Supabase
✅ Listagem com ícones e cores personalizadas
✅ Preview em tempo real do dispositivo
✅ Botão "Novo Rastreador" no header e dashboard

## 📋 Pré-requisitos

- Node.js instalado
- Conta no Supabase configurada
- Servidor Traccar rodando
- Variáveis de ambiente configuradas

## 🔧 Passo 1: Criar a Tabela no Supabase

1. Acesse o Supabase Dashboard (https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `supabase-schema.sql`
6. Clique em **Run** para executar o script

### Verificar se a tabela foi criada:

```sql
SELECT * FROM device_metadata;
```

Se não retornar erro, a tabela foi criada com sucesso! ✅

## 🚀 Passo 2: Verificar Variáveis de Ambiente

Certifique-se de que o arquivo `.env.local` contém:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

## 📦 Passo 3: Instalar Dependências

```bash
npm install
```

## 🏃 Passo 4: Executar o Projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🎨 Como Usar

### Adicionar um Novo Rastreador

1. Clique no botão **"+ Novo"** no header, ou
2. Clique no botão **"Novo Rastreador"** na seção de máquinas
3. Preencha as informações básicas:
   - Nome (obrigatório)
   - IMEI com 15 dígitos (obrigatório)
   - Descrição (opcional)
   - Telefone do chip (opcional)

4. Escolha a aparência:
   - Selecione um ícone visual
   - Escolha uma cor
   - Adicione uma foto (URL)

5. Adicione detalhes específicos:
   - **Veículo**: placa, marca, modelo, ano
   - **Animal**: raça, idade, peso
   - **Equipamento**: número de série, fornecedor

6. Clique em **"Salvar Rastreador"**

### Resultado

- O dispositivo é criado no Traccar
- Os metadados são salvos no Supabase
- A listagem é atualizada automaticamente
- O ícone e cor aparecem no dashboard

## 🎯 Ícones Disponíveis

### 🚜 Agrícolas
🚜 🌾 🌿 🌱 🧑‍🌾 🚛 🏗️

### 🚗 Veículos
🚗 🚙 🚚 🚌 🚐 🏍️ 🛻

### 🚤 Aquáticos
🚤 ⛵ 🛥️ 🏊 🚣 🛶

### 🐄 Animais
🐄 🐴 🐕 🐱 🐑 🐖 🐓 🐐

### 📦 Outros
📦 🔧 ⚙️ 🎒 🔋 📍 ⭐ 🔶

## 🔍 Validações Implementadas

- **IMEI**: Exatamente 15 dígitos numéricos
- **Nome**: Mínimo 3 caracteres
- **Placa**: Formato brasileiro (ABC-1234 ou ABC1D23)
- **Ícone**: Obrigatório selecionar um
- **Cor**: Formato hexadecimal válido

## 🗂️ Estrutura de Arquivos Criados

```
app/
├── maquinas/
│   └── nova/
│       └── page.tsx          # Página de adicionar rastreador
├── api/
│   └── devices/
│       └── create/
│           └── route.ts      # API para criar dispositivo
└── traccar/
    └── devices/
        └── route.ts          # API atualizada com metadados

components/
└── header.tsx                # Header atualizado com botão Novo

supabase-schema.sql           # Script SQL da tabela
SETUP-RASTREADORES.md         # Este arquivo
```

## 🎨 Personalização

### Adicionar Novos Ícones

Edite o arquivo `app/maquinas/nova/page.tsx`:

```typescript
const ICON_CATEGORIES = {
  // ... categorias existentes
  nova_categoria: {
    label: 'Minha Categoria',
    icons: ['🎉', '🎊', '🎈']
  }
}
```

### Adicionar Novas Cores

Edite a paleta de cores no mesmo arquivo:

```typescript
{['#10b981', '#3b82f6', '#sua_cor_aqui'].map((color) => (
  // ...
))}
```

## 🐛 Troubleshooting

### Erro: "device_metadata não existe"
- Execute o script SQL no Supabase

### Erro: "Unauthorized" ao criar dispositivo
- Verifique as credenciais do Traccar em `app/api/devices/create/route.ts`

### Metadados não aparecem na listagem
- Verifique se o Supabase está configurado corretamente
- Verifique as políticas RLS (Row Level Security) no Supabase

### Página em branco
- Execute `npm run dev` novamente
- Verifique o console do navegador para erros

## 📊 Exemplo de Uso

**Cenário**: Adicionar trator John Deere

1. Nome: "Trator John Deere 01"
2. IMEI: "123456789012345"
3. Ícone: 🚜
4. Cor: #10b981 (verde)
5. Tipo: Veículo
6. Placa: "ABC-1234"
7. Marca: "John Deere"
8. Modelo: "5075E"
9. Ano: "2024"

**Resultado**: Trator aparece na listagem com ícone 🚜 verde e todas as informações.

## 🎉 Pronto!

Agora você pode adicionar rastreadores com ícones personalizados no AgroTrack!

Se tiver dúvidas, verifique os logs do console ou entre em contato com o suporte.

---

**Desenvolvido com ❤️ para o AgroTrack**
