# 🗺️ Guia de Navegação - Malmequer Ecommerce

## 📍 **MAPA COMPLETO DE PÁGINAS**

### **Frontend Público (Sem autenticação necessária)**

#### **Homepage & Produtos**
- 🏠 `/` - Homepage com Hero Banner
- 🛍️ `/ver-tudo` - Grid com todos os produtos
- 📦 `/produto/[slug]` - Página de detalhe do produto (com variantes, reviews)
- 🔍 `/pesquisa` - Pesquisa avançada com filtros

#### **Autenticação**
- 🔐 `/login` - Login (email/password + OAuth Google/GitHub)
- 📝 `/registar` - Criar nova conta
- 🔑 `/recuperar-password` - Recuperar password

---

### **Área de Cliente (Requer login)**

#### **Perfil & Conta**
- 👤 `/perfil` - Perfil do utilizador (tabs: Perfil, Segurança, Notificações, Moradas)
- ⚙️ `/definicoes` - Definições e preferências de email/notificações

#### **Shopping**
- 🛒 `/carrinho` - Carrinho de compras
- 💳 `/checkout` - Finalizar compra (2 steps: Envio + Pagamento)
- ✅ `/encomenda-sucesso` - Confirmação de encomenda

#### **Encomendas**
- 📋 `/encomendas` - Lista de todas as encomendas
- 🔎 `/encomendas/[orderNumber]` - Detalhe da encomenda com tracking

#### **Favoritos**
- ❤️ `/favoritos` - Lista de produtos favoritos (wishlist)

---

### **Painel Admin (Requer role ADMIN)**

#### **Dashboard & Gestão**
- 🎛️ `/admin` - Dashboard principal com estatísticas
- 📦 `/admin/produtos` - Gestão de produtos (listar, editar, eliminar)
- 📮 `/admin/encomendas` - Gestão de encomendas (filtros, atualizar estados)

---

### **Documentação API**
- 📚 `/docs` - Swagger UI interativo (OpenAPI)

---

## 🧭 **NAVEGAÇÃO DO HEADER**

### **Desktop Navigation Bar (Centro)**
- Ver tudo
- Pesquisa
- Favoritos
- Encomendas (só se autenticado)

### **Header Icons (Direita)**
- 🔍 **Search** → `/pesquisa`
- ❤️ **Wishlist** → `/favoritos`
- 👤 **User Menu** (dropdown):
  - **Se não autenticado:**
    - Entrar → `/login`
    - Criar Conta → `/registar`

  - **Se autenticado:**
    - Meu Perfil → `/perfil`
    - Minhas Encomendas → `/encomendas`
    - Favoritos → `/favoritos`
    - Definições → `/definicoes`
    - **Admin** → `/admin` (só se role ADMIN)
    - Sair (logout)

- 🛒 **Carrinho** → Abre CartDrawer

---

## 📱 **MOBILE MENU**

Menu hamburguer com:
- Ver tudo
- Pesquisa
- Favoritos
- **Se autenticado:**
  - Info do utilizador (nome, email)
  - Meu Perfil
  - Minhas Encomendas
  - Definições
  - Painel Admin (se ADMIN)
  - Sair
- **Se não autenticado:**
  - Entrar
  - Criar Conta

---

## 🦶 **FOOTER LINKS**

### **Links Rápidos**
- Ver todos os produtos → `/ver-tudo`
- Pesquisa → `/pesquisa`
- Favoritos → `/favoritos`
- Minhas Encomendas → `/encomendas`
- Minha Conta → `/perfil`

### **Apoio ao Cliente**
- Carrinho de Compras → `/carrinho`
- Finalizar Compra → `/checkout`
- Rastrear Encomenda → `/encomendas`
- Definições → `/definicoes`
- API Docs → `/docs`

### **Contactos**
- Email: info@malmequer.pt
- Telefone: +351 123 456 789

---

## 🔄 **FLUXOS DE NAVEGAÇÃO**

### **Fluxo de Compra (Guest/User)**
1. Homepage `/` ou `/ver-tudo`
2. Produto `/produto/[slug]`
3. Adicionar ao carrinho (CartDrawer)
4. Carrinho `/carrinho`
5. Checkout `/checkout`
6. Sucesso `/encomenda-sucesso`
7. Ver encomenda `/encomendas/[orderNumber]` (se autenticado)

### **Fluxo de Autenticação**
1. Click "Entrar" → `/login`
2. Ou "Criar Conta" → `/registar`
3. Após login → Redirect para página anterior ou `/`
4. Esqueceu password → `/recuperar-password`

### **Fluxo Admin**
1. Login como ADMIN
2. Dashboard `/admin`
3. Gestão:
   - Produtos → `/admin/produtos`
   - Encomendas → `/admin/encomendas`

---

## 🎨 **COMPONENTES DE NAVEGAÇÃO**

### **Criados:**
- ✅ `Header.tsx` - Navegação principal com dropdown de utilizador
- ✅ `Footer.tsx` - Links do footer
- ✅ `CartDrawer.tsx` - Carrinho lateral

### **Providers:**
- ✅ `SessionProvider` - NextAuth session management
- ✅ `ToastProvider` - Sistema de notificações

---

## 📊 **ROTAS PROTEGIDAS**

### **Requer Autenticação:**
- `/perfil`
- `/definicoes`
- `/encomendas`
- `/encomendas/[orderNumber]`
- `/favoritos`

### **Requer Role ADMIN:**
- `/admin`
- `/admin/produtos`
- `/admin/encomendas`

### **Redirects Automáticos:**
- Páginas autenticadas → `/login` (se não autenticado)
- Páginas admin → `/` (se não for ADMIN)

---

## 🚀 **COMO TESTAR A NAVEGAÇÃO**

1. **Iniciar servidor:** `pnpm dev`
2. **Homepage:** http://localhost:3000
3. **Testar sem login:**
   - Ver produtos
   - Pesquisar
   - Ver detalhe
   - Adicionar ao carrinho
   - Tentar aceder páginas protegidas (redirect para login)

4. **Criar conta:**
   - `/registar` → criar conta
   - Verificar email welcome
   - Login em `/login`

5. **Testar com login:**
   - Ver perfil
   - Ver encomendas
   - Adicionar favoritos
   - Fazer checkout

6. **Testar Admin (se role ADMIN):**
   - Dashboard `/admin`
   - Gestão de produtos
   - Gestão de encomendas

---

## 🎯 **RESUMO DE LINKS POR TIPO**

### **Produtos (3 páginas)**
- Lista: `/ver-tudo`
- Detalhe: `/produto/[slug]`
- Pesquisa: `/pesquisa`

### **Autenticação (3 páginas)**
- `/login`
- `/registar`
- `/recuperar-password`

### **Cliente (6 páginas)**
- `/perfil`
- `/definicoes`
- `/carrinho`
- `/checkout`
- `/encomendas`
- `/encomendas/[orderNumber]`

### **Favoritos (1 página)**
- `/favoritos`

### **Admin (3 páginas)**
- `/admin`
- `/admin/produtos`
- `/admin/encomendas`

### **Outras (2 páginas)**
- `/` (homepage)
- `/docs` (API)

**Total: 19 páginas funcionais!** 🎉
