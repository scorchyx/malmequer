# Quick Reference Guide

Referência rápida para tarefas comuns no projeto Malmequer.

## 🚀 Deploy Rápido

### Para Staging (Testers)
```bash
git checkout staging
git merge development
git push origin staging
# → Deploy automático em 1-2 minutos
# URL: https://malmequer-staging.vercel.app
```

### Para Produção
```bash
git checkout main
git merge staging
git push origin main
# → Deploy automático em 1-2 minutos
# URL: https://malmequer.vercel.app
```

### Script Helper
```bash
./scripts/deploy.sh
# Menu interativo com todas as opções
```

---

## 🔄 Workflow Diário

```bash
# 1. Atualizar branch de desenvolvimento
git checkout development
git pull origin development

# 2. Desenvolver
pnpm dev

# 3. Testar localmente
pnpm test
pnpm type-check
pnpm build

# 4. Commit e push
git add .
git commit -m "feat: descrição da mudança"
git push origin development
```

---

## 🐛 Rollback de Emergência

### Método 1: Vercel Dashboard (10 segundos)
1. https://vercel.com/scorchyx/malmequer/deployments
2. Encontra deployment anterior
3. Click → "Promote to Production"

### Método 2: Git Revert
```bash
git revert HEAD
git push origin main
```

---

## 🗄️ Database

### Criar Migration
```bash
npx prisma migrate dev --name descricao
```

### Aplicar em Staging/Produção
```bash
# Staging
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Produção (FAZER BACKUP PRIMEIRO!)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### Abrir Prisma Studio
```bash
npx prisma studio
```

---

## 🔍 Debug e Logs

### Ver logs do Vercel
```bash
vercel logs --follow
```

### Testar API localmente
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ready
```

### Ver métricas (requer login admin)
```bash
curl http://localhost:3000/api/metrics
```

---

## 🧪 Testes

```bash
# Todos os testes
pnpm test

# Específico
pnpm test -- __tests__/api/cart.test.ts

# Watch mode
pnpm test:watch

# Cobertura
pnpm test:coverage
```

---

## 🔐 Variáveis de Ambiente

### Adicionar no Vercel
1. Dashboard → Settings → Environment Variables
2. Adicionar variável
3. Escolher ambiente (Production/Preview/Development)
4. **Redeploy** para aplicar

### Localmente
```bash
cp .env.example .env
# Editar .env com credenciais
```

---

## 📦 Stripe

### Test Mode (Development/Staging)
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Live Mode (Production)
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Configurar Webhook
1. https://dashboard.stripe.com/test/webhooks
2. Add endpoint: `https://teu-dominio.com/api/payments/webhook`
3. Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.succeeded`
4. Copiar signing secret → `STRIPE_WEBHOOK_SECRET`

---

## 🌐 URLs Importantes

### Development
- Local: http://localhost:3000
- Admin: http://localhost:3000/admin
- API Docs: http://localhost:3000/docs

### Staging
- Site: https://malmequer-staging.vercel.app
- Admin: https://malmequer-staging.vercel.app/admin

### Production
- Site: https://malmequer.vercel.app (ou teu domínio)
- Admin: https://malmequer.vercel.app/admin

### Dashboards
- Vercel: https://vercel.com/scorchyx/malmequer
- Stripe: https://dashboard.stripe.com
- GitHub Actions: https://github.com/scorchyx/malmequer/actions

---

## ⚡ Comandos Rápidos

```bash
# Desenvolvimento
pnpm dev              # Dev server
pnpm build            # Build produção
pnpm start            # Servidor produção
pnpm lint             # Linter
pnpm type-check       # TypeScript

# Database
npx prisma studio     # UI database
npx prisma generate   # Gerar client
npx prisma migrate dev --name xyz  # Nova migration

# Git
git checkout development           # Mudar para dev
git merge feature/xyz             # Merge feature
git push origin development       # Push para remote

# Vercel
vercel                # Deploy preview
vercel --prod         # Deploy produção
vercel logs           # Ver logs

# Deploy helper
./scripts/deploy.sh   # Menu interativo
```

---

## 🆘 Problemas Comuns

### Build falha
```bash
pnpm build
# Se falhar, verificar:
pnpm type-check  # Erros TypeScript?
pnpm lint        # Erros ESLint?
```

### Database connection error
```bash
# Verificar DATABASE_URL no .env
# Testar conexão:
psql $DATABASE_URL
```

### Prisma não sincronizado
```bash
npx prisma generate
npx prisma migrate dev
```

### Vercel deployment falha
1. Ver logs: `vercel logs`
2. Verificar env vars no dashboard
3. Verificar build logs no Vercel

### Stripe webhook não funciona
1. Verificar `STRIPE_WEBHOOK_SECRET`
2. Verificar URL no Stripe Dashboard
3. Testar com Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

---

## 📚 Documentação Completa

- [DEPLOYMENT.md](DEPLOYMENT.md) - Guia completo de deployment
- [CLAUDE.md](CLAUDE.md) - Instruções para Claude Code
- [README.md](README.md) - Visão geral do projeto
- [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md) - Setup de webhooks

---

**Última atualização:** 2026-01-13
