# Tarefas Pendentes para Lançamento - Malmequer

Última atualização: Janeiro 2025

## Pendente

### Alta Prioridade

- [ ] **Ícones PWA** - Criar ícones em `public/icons/` nos tamanhos: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512 (PNG)
- [ ] **Favicon** - Adicionar favicon.ico em `public/`
- [ ] **Verificar variáveis de ambiente de produção** - Confirmar que `.env` de produção tem todas as chaves

### Média Prioridade

- [ ] **Testar fluxo de pagamento Stripe** - Fazer compra teste em modo sandbox
- [ ] **Testar envio de emails** - Verificar que Resend envia emails corretamente

### Baixa Prioridade

(Todas as tarefas de baixa prioridade foram concluídas)

---

## Concluído

- [x] Política de Privacidade (`/privacidade`)
- [x] Termos e Condições (`/termos`)
- [x] Política de Cookies (`/cookies`)
- [x] Página Sobre Nós (`/sobre`)
- [x] Página de Contacto (`/contacto`)
- [x] Informação de Envios (`/envios`)
- [x] Política de Devoluções (`/devolucoes`)
- [x] robots.txt
- [x] Sitemap dinâmico (`/sitemap.xml`)
- [x] Página de erro global (`error.tsx`)
- [x] Footer atualizado com novos links
- [x] Banner de consentimento de cookies (RGPD)
- [x] Metadados dinâmicos nos produtos (Open Graph + Twitter Cards)
- [x] manifest.json para PWA (estrutura)
- [x] Google Analytics 4 (requer `NEXT_PUBLIC_GA_MEASUREMENT_ID`)
- [x] Schema.org / Dados estruturados (JSON-LD para Product e BreadcrumbList)
- [x] Página de FAQ (`/faq`)
- [x] Otimização de imagens (sizes, formats AVIF/WebP, deviceSizes)

---

## Notas

- O manifest.json está criado mas os ícones ainda não existem - a app funciona sem eles, mas não será instalável como PWA
- Os emails e pagamentos precisam de ser testados em ambiente real antes do lançamento
