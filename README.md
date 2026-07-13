# 🏛️ Axis Admin Hub - Sistema de Gestão Administrativa

![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3EC988?style=for-the-badge&logo=supabase&logoColor=white)

## 📖 Sobre o Projeto

O **Axis Admin Hub** é uma central administrativa robusta e moderna, desenvolvida para gerenciar o ecossistema de operações da empresa. Ele oferece uma interface intuitiva e performática para a gestão completa de leads, propriedades, contratos e clientes.

Construído com foco em **UX Premium** e **Segurança**, o sistema utiliza as tecnologias mais recentes do mercado para garantir uma experiência de uso rápida e confiável, servindo como a "Torre de Controle" para os administradores.

---

## ✨ Funcionalidades Principais

### 📊 Dashboard Analítico
- Visão geral de métricas críticas em tempo real.
- Gráficos interativos (Recharts) para acompanhamento de performance e conversão.

### 👥 Gestão de Leads e Clientes
- Fluxo completo de monitoramento de potenciais clientes.
- Cadastro detalhado e centralização de informações de beneficiários e parceiros.

### 🏢 Inventário de Propriedades
- Gerenciamento de ativos com formulários dinâmicos.
- Controle rigoroso de disponibilidade, status e documentação vinculada.

### 📄 Central de Contratos
- Gestão centralizada de documentos jurídicos gerados.
- Integração com o fluxo de assinatura digital e arquivamento seguro.

### ⚙️ Configurações e RBAC
- Controle de acesso baseado em níveis (Admin, Operador, etc.) via Supabase Auth.
- Gestão de usuários e permissões de sistema.

---

## 🛠️ Stack Tecnológica

O projeto utiliza uma arquitetura de ponta para garantir escalabilidade:

- **Frontend:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/).
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) (Base para componentes [shadcn/ui](https://ui.shadcn.com/)).
- **Animações:** [Framer Motion](https://www.framer.com/motion/) para transições suaves.
- **Gerenciamento de Estado & Cache:** [TanStack Query](https://tanstack.com/query/latest) (React Query) v5.
- **Banco de Dados & Autenticação:** [Supabase](https://supabase.com/).
- **Formulários:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) (Validação de dados em tempo de execução).
- **Gráficos:** [Recharts](https://recharts.org/) para visualização de dados.

---

## 🏗️ Estrutura do Projeto

```bash
src/
├── components/          # Componentes reutilizáveis e biblioteca de UI (shadcn)
├── hooks/              # Custom hooks (useAuth, useToast, etc.)
├── integrations/       # Configuração e tipos do cliente Supabase
├── lib/               # Utilitários globais e helpers
├── pages/             # Páginas da aplicação organizadas por domínio
│   └── admin/        # Telas exclusivas do painel administrativo
└── types/             # Definições globais de interfaces TypeScript
```

---

## 🚀 Como Iniciar

### Pré-requisitos
- Node.js instalado (v18+)
- Gerenciador de pacotes (NPM ou Bun)

### Instalação
1. Clone o repositório e acesse a pasta.
2. Instale as dependências:
   ```bash
   npm install
   ```

### Configuração de Ambiente
Crie um arquivo `.env` na raiz do projeto com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=seu_projeto_url
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

### Execução
```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Gerar build de produção
npm run build
```

---
*Este projeto é parte integrante do ecossistema de gestão da Rede Total, focado em alta performance e excelência operacional.*
