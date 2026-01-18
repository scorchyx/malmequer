# Setup Instructions - Push e Vercel

Instruções para fazer push dos commits e configurar o Vercel pela primeira vez.

## ✅ Status Atual

Tens 2 commits locais prontos para push:
1. `fix: center button text in hero banner`
2. `docs: add comprehensive deployment setup and documentation`

E 3 branches criadas:
- `main` (atual)
- `staging`
- `development`

---

## Passo 1: Autenticar com GitHub

Escolhe UMA das opções:

### Opção A: GitHub CLI (Recomendado)

```bash
# Instalar gh (GitHub CLI)
sudo dnf install gh -y

# Autenticar
gh auth login
# Escolhe: GitHub.com → HTTPS → Yes → Login via browser

# Testar
gh auth status
```

### Opção B: SSH Key (Se já tiveres configurado)

```bash
# Verificar se tens SSH key
ls -la ~/.ssh/id_*

# Se não tiveres, criar:
ssh-keygen -t ed25519 -C "teu-email@example.com"

# Adicionar ao ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copiar chave pública para clipboard
cat ~/.ssh/id_ed25519.pub
# Vai a: https://github.com/settings/keys
# Add SSH key → Cola a chave

# Mudar remote para SSH
git remote set-url origin git@github.com:scorchyx/malmequer.git
```

### Opção C: Personal Access Token

```bash
# 1. Criar token:
# https://github.com/settings/tokens/new
# Permissions: repo (full control)

# 2. Configurar credential helper
git config --global credential.helper store

# 3. No próximo push, usa:
# Username: scorchyx
# Password: [cola o token aqui, NÃO a tua password]
```

---

## Passo 2: Push das Branches e Commits

Depois de autenticar:

```bash
# Verificar em que branch estás
git branch

# Push da branch main (com os 2 commits)
git push -u origin main

# Push das outras branches
git push -u origin staging
git push -u origin development

# Verificar no GitHub
# https://github.com/scorchyx/malmequer
```

---

## Passo 3: Instalar Vercel CLI

```bash
# Instalar globalmente
pnpm add -g vercel

# Verificar instalação
vercel --version
```

---

## Passo 4: Login no Vercel

```bash
# Login
vercel login

# Vai abrir browser para autenticar
# Escolhe a tua conta
```

---

## Passo 5: Conectar Projeto ao Vercel

```bash
# Na raiz do projeto
cd /home/ruben/Documentos/malmequer

# Iniciar setup
vercel

# Responde às perguntas:
```

**Perguntas e Respostas:**

```
? Set up and deploy "~/Documentos/malmequer"?
→ Y (Yes)

? Which scope do you want to deploy to?
→ [escolhe a tua conta pessoal]

? Link to existing project?
→ N (No - é a primeira vez)

? What's your project's name?
→ malmequer (ou Enter para aceitar)

? In which directory is your code located?
→ ./ (Enter)

? Want to override the settings?
→ N (No - vai detetar Next.js automaticamente)
```

O Vercel vai:
1. Criar o projeto
2. Fazer deploy da branch atual (main)
3. Dar-te URLs:
   - Preview: `https://malmequer-xxx.vercel.app`
   - Production: `https://malmequer.vercel.app`

---

## Passo 6: Configurar Branch Settings no Vercel

1. Vai ao dashboard: https://vercel.com/dashboard
2. Seleciona o projeto **malmequer**
3. **Settings** → **Git**
4. **Production Branch:** muda para `main`
5. **Deploy Previews:**
   - ✅ Enable for all branches

---

## Passo 7: Adicionar Environment Variables

### No Vercel Dashboard:

1. **Settings** → **Environment Variables**
2. Adiciona as seguintes variáveis:

### Para TODOS os ambientes (Production + Preview + Development):

```bash
DATABASE_URL=postgresql://user:password@host:5432/malmequer_production
NEXTAUTH_SECRET=[gera com: openssl rand -base64 32]
REDIS_URL=redis://your-redis-url:6379
RESEND_API_KEY=re_xxx
FROM_EMAIL=noreply@yourdomain.com
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

### Apenas para Production (main branch):

```bash
NEXTAUTH_URL=https://malmequer.vercel.app
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NODE_ENV=production
```

### Apenas para Preview (staging/development):

```bash
NEXTAUTH_URL=https://malmequer-staging.vercel.app
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxx
NODE_ENV=staging
```

**IMPORTANTE:** Depois de adicionar env vars, faz **Redeploy** para aplicar!

---

## Passo 8: Configurar Stripe Webhooks

### Para Staging (Test Mode):

1. Vai a: https://dashboard.stripe.com/test/webhooks
2. **Add endpoint**
3. **Endpoint URL:** `https://malmequer-staging.vercel.app/api/payments/webhook`
4. **Events to send:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
5. **Add endpoint**
6. Copia o **Signing secret** (whsec_xxx)
7. Adiciona no Vercel como `STRIPE_WEBHOOK_SECRET` (Preview only)

### Para Production (Live Mode):

1. Vai a: https://dashboard.stripe.com/webhooks (LIVE mode)
2. Repete os mesmos passos
3. URL: `https://malmequer.vercel.app/api/payments/webhook`
4. Usa as **live keys** (sk_live_ e pk_live_)
5. Adiciona o signing secret no Vercel (Production only)

---

## Passo 9: Testar Deployments

### Testar Staging:

```bash
git checkout staging
git merge main  # Merge os commits recentes
git push origin staging

# Aguarda 1-2 minutos
# Verifica: https://malmequer-staging.vercel.app
```

### Testar Development:

```bash
git checkout development
git merge staging
git push origin development

# Aguarda 1-2 minutos
# Verifica: https://malmequer-git-development-xxx.vercel.app
```

---

## Passo 10: Verificar Tudo Funciona

### Checklist:

- [ ] Push dos commits foi bem sucedido
- [ ] 3 branches visíveis no GitHub
- [ ] Projeto criado no Vercel
- [ ] Environment variables configuradas
- [ ] Stripe webhooks configurados
- [ ] Deploy de main bem sucedido
- [ ] Deploy de staging bem sucedido
- [ ] Site acessível em staging
- [ ] Login funciona
- [ ] Checkout funciona (test mode)

---

## 🆘 Troubleshooting

### Push falha com "Authentication failed"

```bash
# Opção 1: Usa GitHub CLI
gh auth login

# Opção 2: Usa SSH
git remote set-url origin git@github.com:scorchyx/malmequer.git
```

### Vercel CLI não encontrado

```bash
# Reinstalar
pnpm add -g vercel

# Verificar PATH
echo $PATH

# Pode precisar de reload do shell
source ~/.bashrc
```

### Build falha no Vercel

1. Ver logs: https://vercel.com/scorchyx/malmequer/deployments
2. Verificar se todas as env vars estão configuradas
3. Testar build local: `pnpm build`

### Database connection error

- Verifica `DATABASE_URL` no Vercel
- Certifica-te que database aceita conexões externas
- Testa localmente primeiro

---

## 📚 Próximos Passos

Depois de tudo configurado:

1. Lê [DEPLOYMENT.md](DEPLOYMENT.md) para workflow completo
2. Usa [QUICK_REFERENCE.md](QUICK_REFERENCE.md) para comandos diários
3. Partilha URL de staging com testers
4. Quando pronto, faz deploy para produção

---

## 🎯 Comandos Quick Reference

```bash
# Status atual
git status
git branch

# Push
git push origin main
git push origin staging
git push origin development

# Vercel
vercel               # Deploy preview
vercel --prod        # Deploy production
vercel logs          # Ver logs
vercel ls            # Listar projects

# Deploy helper
./scripts/deploy.sh  # Menu interativo
```

---

**Boa sorte com o setup! 🚀**
