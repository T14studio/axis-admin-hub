# Product Requirements Document (PRD) - Axis Admin Hub

## 1. Visão Geral do Produto
O **Axis Admin Hub** é uma plataforma de gestão administrativa centralizada, projetada para servir como a "Torre de Controle" para operações empresariais. O sistema oferece uma interface moderna e performática para gerenciar leads, clientes, inventário de propriedades e contratos, integrando visualização de dados analíticos com fluxos operacionais seguros.

## 2. Objetivos Estratégicos
- **Centralização Operacional**: Reunir gestão de leads, ativos e documentos em uma única interface.
- **UX Premium**: Proporcionar uma experiência de uso fluida com animações suaves e componentes de alta fidelidade.
- **Escalabilidade e Segurança**: Utilizar uma stack moderna (React + Supabase) com controle de acesso rigoroso (RBAC) e Row Level Security (RLS).
- **Tomada de Decisão Baseada em Dados**: Oferecer dashboards analíticos com métricas em tempo real.

## 3. Público-Alvo
- **Administradores de Sistema**: Responsáveis pela gestão de usuários, permissões e visão global do negócio.
- **Operadores/Agentes**: Responsáveis pela atualização de leads, cadastro de propriedades e acompanhamento de contratos.

## 4. Requisitos Funcionais

### 4.1. Dashboard Analítico
- Visualização de KPIs (Principais Indicadores de Desempenho) em tempo real.
- Gráficos interativos (Linha, Barra, Pizza) utilizando **Recharts** para monitorar conversão de leads e performance de vendas.

### 4.2. Gestão de Leads e Clientes
- Cadastro, edição e acompanhamento de status de leads.
- Conversão de leads em clientes após validação.
- Histórico de interações e centralização de dados de contato.

### 4.3. Inventário de Propriedades
- Cadastro detalhado de imóveis/ativos com formulários dinâmicos e validação via **Zod**.
- Filtros avançados por categoria (Residencial, Comercial, Rural, etc.).
- Controle de status de disponibilidade e documentação técnica vinculada.

### 4.4. Central de Contratos
- Repositório centralizado para documentos jurídicos.
- Acompanhamento do status de assinatura e arquivamento seguro no Supabase Storage.
- Integração com fluxos de assinatura digital.

### 4.5. Sistema de Permissões (RBAC)
- Níveis de acesso distintos (ex: Admin, Operador).
- Restrição de funcionalidades e visualização de dados sensíveis com base no perfil do usuário via Supabase Auth.

## 5. Requisitos Não Funcionais

### 5.1. Performance e UX
- **Vite** para build extremamente rápido.
- **TanStack Query** (React Query) para gerenciamento de estado assíncrono e cache eficiente.
- **Framer Motion** para micro-interações e transições de página premium.
- **Tailwind CSS** + **shadcn/ui** para uma interface consistente e responsiva.

### 5.2. Segurança
- Autenticação JWT via **Supabase Auth**.
- **Row Level Security (RLS)** habilitado no banco de dados para garantir que usuários acessem apenas dados autorizados.
- Validação rigorosa de inputs no frontend com **React Hook Form** e **Zod**.

## 6. Stack Tecnológica
- **Frontend**: React 18, TypeScript, Vite.
- **Estilização**: Tailwind CSS, Radix UI, shadcn/ui.
- **Banco de Dados & Auth**: Supabase (PostgreSQL).
- **Gerenciamento de Estado**: TanStack Query (React Query).
- **Animações**: Framer Motion.
- **Gráficos**: Recharts.
- **Testes**: Vitest, React Testing Library.

## 7. Estrutura de Pastas (Referência)
- `/src/components`: Componentes atômicos e biblioteca de UI.
- `/src/pages`: Telas da aplicação (Dashboard, Leads, Properties, etc).
- `/src/hooks`: Lógica de negócio reutilizável.
- `/src/integrations`: Conexão e tipos do Supabase.
- `/src/types`: Definições TypeScript globais.

## 8. Roadmap e Próximos Passos
- **Integração de Notificações Push**: Alertas em tempo real sobre novos leads ou vencimento de contratos.
- **Exportação de Relatórios**: Geração de relatórios em PDF/Excel diretamente da Dashboard.
- **Módulo de Auditoria**: Registro completo de logs de alterações para conformidade.
- **Expansão de Categorias**: Refinamento contínuo da taxonomia de propriedades e contratos.
