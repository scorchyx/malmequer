# Deployment Guide - Malmequer E-commerce

Este guia explica como fazer deploy e gerir o projeto em produção.

## 📋 Índice

1. [Estrutura de Branches](#estrutura-de-branches)
2. [Setup Inicial no Vercel](#setup-inicial-no-vercel)
3. [Configuração de Ambientes](#configuração-de-ambientes)
4. [Workflow de Desenvolvimento](#workflow-de-desenvolvimento)
5. [Deploy para Produção](#deploy-para-produção)
6. [Rollback de Emergência](#rollback-de-emergência)
7. [Database Migrations](#database-migrations)
8. [Troubleshooting](#troubleshooting)

---

## 🌳 Estrutura de Branches

O projeto usa 3 branches principais:

```
main (produção)       → Site público (malmequer.com ou vercel domain)
  ↑
staging (testes)      → Testers internos (malmequer-staging.vercel.app)
  ↑
development (dev)     → Desenvolvimento ativo (malmequer-dev.vercel.app)
  ↑
feature/* branches    → Novas funcionalidades (preview deployments)
```

### Regras:

- ❌ **NUNCA** fazer commit direto na `main`
- ✅ Sempre desenvolver em `development` ou `feature/*` branches
- ✅ Testar em `staging` antes de produção
- ✅ Merge para `main` só depois de aprovação

---

## 🚀 Setup Inicial no Vercel

### 1. Instalar Vercel CLI

```bash
pnpm add -g vercel
```

### 2. Login

```bash
vercel login
```

### 3. Conectar Projeto

Na raiz do projeto:

```bash
vercel
```

Responde às perguntas:
- **Set up and deploy?** Yes
- **Which scope?** (tua conta pessoal)
- **Link to existing project?** No (primeira vez) / Yes (se já existe)
- **Project name:** malmequer
- **Directory:** ./
- **Override settings?** No

### 4. Configurar Branch Settings

No [Vercel Dashboard](https://vercel.com/dashboard):

1. Vai ao projeto **malmequer**
2. **Settings** → **Git**
3. **Production Branch:** `main`
4. **Deploy Previews:** Enable for all branches

---

## 🔧 Configuração de Ambientes

### 1. Environment Variables no Vercel

Vai a **Settings** → **Environment Variables** e adiciona:

#### Para TODOS os ambientes (Production + Preview + Development):

```bash
DATABASE_URL=postgresql://user:password@host:5432/malmequer_production
NEXTAUTH_SECRET=xxx  # openssl rand -base64 32
REDIS_URL=redis://xxx
RESEND_API_KEY=re_xxx
FROM_EMAIL=noreply@yourdomain.com
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

#### Apenas para Production (main branch):

```bash
NEXTAUTH_URL=https://malmequer.com  # ou teu domínio
STRIPE_SECRET_KEY=sk_live_xxx  # LIVE KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx  # LIVE KEY
STRIPE_WEBHOOK_SECRET=whsec_xxx  # webhook de produção
NODE_ENV=production
```

#### Apenas para Preview (staging e development):

```bash
NEXTAUTH_URL=https://malmequer-staging.vercel.app
STRIPE_SECRET_KEY=sk_test_xxx  # TEST KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # TEST KEY
STRIPE_WEBHOOK_SECRET=whsec_test_xxx  # webhook de teste
NODE_ENV=staging
```

### 2. Configurar Stripe Webhooks

#### Para Staging/Development:

1. Vai a [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. **Add endpoint**
3. URL: `https://malmequer-staging.vercel.app/api/payments/webhook`
4. Eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
5. Copia o **Signing secret** (whsec_xxx)
6. Adiciona como `STRIPE_WEBHOOK_SECRET` no Vercel (Preview)

#### Para Produção:

1. Vai a [Stripe Dashboard LIVE](https://dashboard.stripe.com/webhooks)
2. Repete os passos acima com URL de produção
3. Usa as **live keys** (sk_live_ e pk_live_)

### 3. Database Separadas (Recomendado)

Para evitar misturar dados de teste com produção:

- **Production:** `malmequer_production` database
- **Staging:** `malmequer_staging` database
- **Development:** `malmequer_dev` database local

---

## 💻 Workflow de Desenvolvimento

### Desenvolvimento Normal

```bash
# 1. Certifica-te que estás atualizado
git checkout development
git pull origin development

# 2. Cria feature branch (opcional mas recomendado)
git checkout -b feature/nova-funcionalidade

# 3. Desenvolve e testa localmente
pnpm dev

# 4. Commit e push
git add .
git commit -m "feat: adicionar nova funcionalidade"
git push origin feature/nova-funcionalidade
# → Vercel cria preview deployment automático

# 5. Testa o preview deployment
# URL será algo como: malmequer-git-feature-xxx.vercel.app

# 6. Merge para development
git checkout development
git merge feature/nova-funcionalidade
git push origin development
# → Deploy automático para malmequer-dev.vercel.app
```

### Passar para Testers (Staging)

```bash
# Quando development está estável
git checkout staging
git pull origin staging
git merge development
git push origin staging
# → Deploy automático para malmequer-staging.vercel.app

# Partilha URL com testers: https://malmequer-staging.vercel.app
```

---

## 🚢 Deploy para Produção

### ⚠️ IMPORTANTE: Checklist Pré-Deploy

Antes de fazer merge para `main`, verifica:

- [ ] Código testado em staging por múltiplos testers
- [ ] Sem bugs conhecidos críticos
- [ ] Database migrations aplicadas (se necessário)
- [ ] Variáveis de ambiente de produção configuradas
- [ ] Stripe webhooks de produção configurados
- [ ] Backup da database de produção feito

### Deploy

```bash
# 1. Certifica-te que staging está OK
# Testa tudo em: malmequer-staging.vercel.app

# 2. Merge para main
git checkout main
git pull origin main
git merge staging
git push origin main
# → Deploy automático para produção (1-2 minutos)

# 3. Verifica se deploy foi bem sucedido
# Vai a: https://vercel.com/scorchyx/malmequer/deployments
# Status deve estar "Ready"

# 4. Testa site de produção
# Verifica:
# - Homepage carrega
# - Login funciona
# - Checkout funciona
# - Admin panel funciona
```

### Monitorizar Deploy

```bash
# Vercel CLI
vercel logs --follow

# Ou no dashboard:
# https://vercel.com/scorchyx/malmequer/deployments
```

---

## 🔄 Rollback de Emergência

Se algo correr mal em produção:

### Método 1: Vercel Dashboard (Mais Rápido - 10 segundos)

1. Vai a [Deployments](https://vercel.com/scorchyx/malmequer/deployments)
2. Encontra o deployment anterior que estava a funcionar
3. Click nos 3 pontos → **"Promote to Production"**
4. ✅ Site volta ao estado anterior instantaneamente

### Método 2: Git Revert

```bash
# Reverter último commit
git checkout main
git revert HEAD
git push origin main
# → Deploy automático da versão anterior

# Ou reverter para commit específico
git log --oneline  # encontra hash do commit bom
git revert abc123
git push origin main
```

### Método 3: Hotfix Urgente

```bash
# Criar branch de hotfix direto da main
git checkout main
git checkout -b hotfix/bug-critico

# Fix o bug
# ... edita código ...

# Testa localmente
pnpm build
pnpm start

# Deploy direto para produção
git checkout main
git merge hotfix/bug-critico
git push origin main

# Merge de volta para outras branches
git checkout staging
git merge hotfix/bug-critico
git push

git checkout development
git merge hotfix/bug-critico
git push
```

---

## 🗄️ Database Migrations

### Development

```bash
# Criar migration
npx prisma migrate dev --name descricao_da_mudanca

# Gera Prisma Client automaticamente
```

### Staging

```bash
# Aplicar migrations em staging database
DATABASE_URL="postgresql://user:pass@host/malmequer_staging" npx prisma migrate deploy
```

### Production

⚠️ **MUITO CUIDADO** - Fazer backup primeiro!

```bash
# 1. Backup da database
pg_dump malmequer_production > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Aplicar migrations
DATABASE_URL="postgresql://user:pass@host/malmequer_production" npx prisma migrate deploy

# 3. Verificar se aplicou corretamente
DATABASE_URL="postgresql://user:pass@host/malmequer_production" npx prisma studio
```

### Ordem Correta para Mudanças de Schema:

1. ✅ Aplicar migration na database primeiro
2. ✅ Deploy código depois
3. ❌ NUNCA fazer ao contrário (código quebra se DB não tiver os campos)

---

## 🐛 Troubleshooting

### Deploy Falha

```bash
# Ver logs
vercel logs

# Build falha localmente?
pnpm build

# TypeScript errors?
pnpm type-check
```

### Database Connection Fails

- Verifica se `DATABASE_URL` está correta no Vercel
- Confirma que database aceita conexões externas
- Testa conexão: `psql $DATABASE_URL`

### Stripe Webhook Não Funciona

1. Verifica secret no Vercel: `STRIPE_WEBHOOK_SECRET`
2. Confirma URL no Stripe Dashboard: `/api/payments/webhook`
3. Testa webhook: [Stripe CLI](https://stripe.com/docs/stripe-cli)

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

### Redis Connection Issues

- Verifica `REDIS_URL` no Vercel
- Testa com: `redis-cli -u $REDIS_URL ping`

### Environment Variables Não Aplicadas

- Depois de mudar env vars no Vercel, é necessário **redeploy**
- Vai a Deployments → Latest → Redeploy

---

## 📊 Monitorização

### Logs em Tempo Real

```bash
vercel logs --follow
```

### Ver Métricas

Dashboard → Analytics:
- Page views
- Response times
- Error rates

### Alertas

Configura alertas em **Settings** → **Notifications** para:
- Deploy failures
- High error rates
- Performance degradation

---

## 🔐 Segurança

### Secrets Management

- ❌ NUNCA commitar ficheiros `.env`
- ✅ Usar Vercel Environment Variables
- ✅ Rodar secrets regularmente (NEXTAUTH_SECRET, API keys)

### Acessos

- Limitar acessos ao Vercel Dashboard
- Usar roles apropriados (Viewer, Developer, Owner)

---

## 📝 Checklist de Deploy Completo

### Antes do Primeiro Deploy:

- [ ] Repositório GitHub configurado
- [ ] Branches criadas (main, staging, development)
- [ ] Vercel projeto criado
- [ ] Environment variables configuradas
- [ ] Database de produção criada
- [ ] Redis/Valkey configurado
- [ ] Stripe webhooks configurados (test + live)
- [ ] Domínio configurado (opcional)

### Deploy Regular:

- [ ] Código testado localmente
- [ ] Testes passam (`pnpm test`)
- [ ] TypeScript sem erros (`pnpm type-check`)
- [ ] Build local funciona (`pnpm build`)
- [ ] Testado em staging
- [ ] Database migrations aplicadas
- [ ] Merge para main
- [ ] Verificar deployment no Vercel
- [ ] Testar site de produção

---

## 🆘 Contactos de Emergência

Em caso de problemas críticos em produção:

1. **Rollback imediato** (método 1 acima)
2. **Check Vercel Status**: https://vercel-status.com
3. **Check Stripe Status**: https://status.stripe.com
4. **Suporte Vercel**: https://vercel.com/support

---

## 📚 Recursos Úteis

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

**Última atualização:** 2026-01-13
