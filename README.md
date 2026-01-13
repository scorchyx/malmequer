# Malmequer E-commerce

Uma plataforma completa de e-commerce construída com Next.js 15, Prisma ORM, e Stripe para pagamentos.

## 📋 Funcionalidades

- 🛍️ Catálogo de produtos com variantes
- 🛒 Carrinho de compras
- 💳 Pagamentos com Stripe (cartão, Multibanco, MB Way)
- 👤 Sistema de autenticação com NextAuth
- 📧 Notificações por email (Resend)
- 📦 Gestão de encomendas
- 👨‍💼 Painel de administração
- 🎨 UI responsiva com Tailwind CSS v4
- ⚡ Performance otimizada com Turbopack

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20+
- PostgreSQL 15+
- Redis (Valkey)
- pnpm 8+

### Instalação

```bash
# Clonar repositório
git clone https://github.com/scorchyx/malmequer.git
cd malmequer

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edita .env com as tuas credenciais

# Setup da database
npx prisma migrate dev
npx prisma db seed  # (se existir seed)

# Gerar Prisma Client
npx prisma generate

# Iniciar servidor de desenvolvimento
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) no browser.

## 📚 Documentação

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guia completo de deployment e gestão em produção
- **[CLAUDE.md](CLAUDE.md)** - Instruções para Claude Code (desenvolvimento assistido por IA)
- **[WEBHOOK_SETUP.md](WEBHOOK_SETUP.md)** - Configuração de webhooks do Stripe

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Iniciar dev server com Turbopack
pnpm build            # Build para produção
pnpm start            # Iniciar servidor de produção
pnpm lint             # Executar ESLint
pnpm type-check       # Verificar tipos TypeScript

# Testes
pnpm test             # Executar testes
pnpm test:watch       # Testes em modo watch
pnpm test:coverage    # Cobertura de testes

# Database
npx prisma studio     # Abrir Prisma Studio (UI da database)
npx prisma migrate dev --name description  # Criar migration
npx prisma migrate deploy                  # Aplicar migrations
npx prisma generate   # Gerar Prisma Client

# Deploy (helper script)
./scripts/deploy.sh   # Menu interativo de deploy
```

## 🌳 Estrutura de Branches

```
main          → Produção (site público)
  ↑
staging       → Testes (testers internos)
  ↑
development   → Desenvolvimento ativo
  ↑
feature/*     → Novas funcionalidades
```

## 🚀 Deploy

### Deploy para Staging (Testers)

```bash
git checkout development
# ... faz alterações ...
git push origin development

# Quando pronto para testers:
./scripts/deploy.sh  # Opção 1: Deploy para STAGING
```

### Deploy para Produção

```bash
# Testa primeiro em staging!
# Depois:
./scripts/deploy.sh  # Opção 2: Deploy para PRODUÇÃO
```

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para instruções completas.

## 🔐 Environment Variables

Ver `.env.example` para lista completa. Principais variáveis:

```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
RESEND_API_KEY=...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📦 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL + Prisma ORM
- **Cache:** Redis (Valkey)
- **Auth:** NextAuth.js
- **Payments:** Stripe
- **Email:** Resend + React Email
- **Styling:** Tailwind CSS v4
- **Testing:** Jest
- **CI/CD:** GitHub Actions + Vercel

## 🏗️ Estrutura do Projeto

```
malmequer/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin panel
│   ├── components/        # React components
│   └── ...                # Páginas públicas
├── lib/                   # Utilities e helpers
├── prisma/                # Database schema e migrations
├── scripts/               # Scripts de utilidade
├── __tests__/             # Testes
└── public/                # Assets estáticos
```

## 🧪 Testes

```bash
# Executar todos os testes
pnpm test

# Cobertura (mínimo 70%)
pnpm test:coverage

# Teste específico
pnpm test -- __tests__/api/cart.test.ts
```

## 📈 Monitorização

- **Logs:** `vercel logs --follow`
- **Health checks:** `/api/health` e `/api/ready`
- **Metrics:** `/api/metrics` (admin only)
- **API Docs:** `/docs` (Swagger UI)

## 🤝 Contribuir

1. Fork o projeto
2. Cria branch de feature (`git checkout -b feature/AmazingFeature`)
3. Commit mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para branch (`git push origin feature/AmazingFeature`)
5. Abre Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 🆘 Suporte

- **Issues:** [GitHub Issues](https://github.com/scorchyx/malmequer/issues)
- **Documentação:** Ver ficheiros .md na raiz do projeto
- **CI/CD:** Ver `.github/workflows/ci.yml`

---

**Desenvolvido com ❤️ em Portugal**
