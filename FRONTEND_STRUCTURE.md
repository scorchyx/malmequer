# Estrutura do Frontend - Malmequer

## 📁 Estrutura de Componentes

```
app/
├── components/
│   ├── layout/
│   │   ├── Header.tsx       # Cabeçalho com navegação e carrinho
│   │   └── Footer.tsx       # Rodapé com links e newsletter
│   └── home/
│       └── HeroBanner.tsx   # Banner principal da homepage
├── page.tsx                 # Homepage principal
└── ... (outras páginas)
```

## 🎨 Componentes Criados

### Header
- **Localização**: `app/components/layout/Header.tsx`
- **Funcionalidades**:
  - Navegação principal (Produtos, Categorias, Sobre Nós, Blog)
  - Barra de pesquisa (desktop)
  - Ícones: Wishlist, Conta, Carrinho
  - Menu mobile responsivo
  - Top bar com mensagem promocional

### Footer
- **Localização**: `app/components/layout/Footer.tsx`
- **Funcionalidades**:
  - Links organizados em colunas
  - Informações de contacto
  - Redes sociais
  - Newsletter subscription
  - Copyright e links legais

### Hero Banner
- **Localização**: `app/components/home/HeroBanner.tsx`
- **Funcionalidades**:
  - Imagem de fundo do Cloudinary
  - Overlay gradient para melhor legibilidade
  - Título e subtítulo personalizáveis
  - 2 CTAs (Call-to-Actions)
  - Scroll indicator animado
  - Totalmente responsivo

## 🎯 Próximos Passos Sugeridos

### Secções para adicionar à Homepage:
1. **Featured Products** - Produtos em destaque
2. **Categories Grid** - Grelha de categorias
3. **Benefits/Features** - Vantagens (envio grátis, devoluções, etc)
4. **Testimonials** - Depoimentos de clientes
5. **Newsletter** - Call-to-action para subscrição
6. **Instagram Feed** - Integração com Instagram

### Páginas a criar:
- `/products` - Listagem de produtos com filtros
- `/products/[slug]` - Página de detalhes do produto
- `/categories` - Listagem de categorias
- `/categories/[slug]` - Produtos por categoria
- `/cart` - Carrinho de compras
- `/checkout` - Processo de checkout
- `/account` - Área de cliente
- `/about` - Sobre a empresa
- `/contact` - Contactos

## 🛠️ Tecnologias Utilizadas

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Estilização utility-first
- **Lucide React** - Ícones modernos
- **Next/Image** - Otimização de imagens

## 📝 Notas de Desenvolvimento

### Responsividade
Todos os componentes foram desenvolvidos com mobile-first approach:
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

### Acessibilidade
- Links semânticos com `<Link>` do Next.js
- Ícones com labels apropriados
- Estrutura HTML semântica

### Performance
- Componentes do tipo 'use client' apenas quando necessário (Header)
- Server Components por defeito (Footer, HeroBanner)
- Imagens otimizadas com Next/Image
- Lazy loading nativo

## 🎨 Personalização de Cores

Atualmente usando a paleta padrão do Tailwind. Para personalizar:

1. Edita `tailwind.config.js`
2. Define cores customizadas no `theme.extend.colors`
3. Exemplo:
```js
theme: {
  extend: {
    colors: {
      primary: {
        50: '#...',
        100: '#...',
        // ...
        900: '#...'
      }
    }
  }
}
```

## 📱 Como testar

```bash
# Inicia o servidor de desenvolvimento
pnpm dev

# Abre o browser em
http://localhost:3000
```
