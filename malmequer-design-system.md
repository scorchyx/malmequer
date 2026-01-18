# Malmequer Design System

## Visão Geral

Este design system define a identidade visual e os componentes da Malmequer, uma marca de vestuário feminino que combina acessibilidade com elegância. O sistema foi desenhado para transmitir confiança, juventude e sofisticação.

---

## 1. Marca

### Personalidade

| Atributo | Descrição |
|----------|-----------|
| **Jovem** | Linguagem atual, tendências contemporâneas, energia fresca |
| **Confiante** | Afirmativa sem arrogância, empoderadora, decisiva |
| **Elegante** | Refinada mas acessível, clean, atemporal com toque moderno |

### Tom de Voz

- **Site:** Profissional mas acolhedor, sem emojis, tuteia a cliente
- **Redes sociais:** Informal e próximo, usa emojis com moderação
- **Exemplos de copy:**
  - ✓ "Encontra o teu próximo look favorito"
  - ✓ "Feito para quem sabe o que quer"
  - ✗ "PROMOÇÃO IMPERDÍVEL!!!"
  - ✗ "Peças lindíssimas para todas"

---

## 2. Cores

### Paleta Principal

```css
:root {
  /* Primárias */
  --malmequer-gold: #E8A83E;      /* Amarelo malmequer — cor principal da marca */
  --malmequer-amber: #D4882A;     /* Âmbar — para hovers e acentos */
  
  /* Neutras */
  --ink: #1A1A1A;                 /* Texto principal */
  --stone: #4A4A4A;               /* Texto secundário */
  --mist: #8A8A8A;                /* Texto terciário, placeholders */
  --cloud: #F5F5F3;               /* Fundos, cards */
  --snow: #FAFAF9;                /* Fundo principal */
  --white: #FFFFFF;               /* Componentes, modais */
  
  /* Feedback */
  --success: #2D854C;             /* Confirmações, stock disponível */
  --warning: #C4841D;             /* Alertas, stock baixo */
  --error: #B83232;               /* Erros, esgotado */
}
```

### Uso das Cores

| Contexto | Cor | Variável |
|----------|-----|----------|
| Texto principal | Ink | `--ink` |
| Texto secundário | Stone | `--stone` |
| Links e CTAs principais | Malmequer Gold | `--malmequer-gold` |
| Hover em links/botões | Amber | `--malmequer-amber` |
| Fundo da página | Snow | `--snow` |
| Cards de produto | White | `--white` |
| Bordas subtis | Cloud | `--cloud` |
| Preço original (riscado) | Mist | `--mist` |
| Preço com desconto | Error | `--error` |
| "Em stock" | Success | `--success` |
| "Últimas unidades" | Warning | `--warning` |
| "Esgotado" | Error | `--error` |

### Contraste e Acessibilidade

- Texto `--ink` sobre `--snow`: ratio 15.2:1 ✓
- Texto `--stone` sobre `--snow`: ratio 7.8:1 ✓
- `--malmequer-gold` sobre `--ink` (botões invertidos): ratio 8.1:1 ✓
- Todos os pares passam WCAG AA para texto normal

---

## 3. Tipografia

### Famílias Tipográficas

```css
:root {
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

**Cormorant Garamond** — Títulos e destaques. Serifada elegante com personalidade, legível em tamanhos grandes. Transmite sofisticação sem ser demasiado formal.

**Inter** — Corpo de texto e UI. Sans-serif moderna, excelente legibilidade em ecrã, neutra mas com carácter. Disponível no Google Fonts com suporte variável.

### Escala Tipográfica

Base: 16px (1rem)

| Nome | Tamanho | Peso | Linha | Uso |
|------|---------|------|-------|-----|
| `display-xl` | 3rem (48px) | 500 | 1.1 | Hero headlines |
| `display-lg` | 2.25rem (36px) | 500 | 1.2 | Títulos de página |
| `display-md` | 1.75rem (28px) | 500 | 1.25 | Títulos de secção |
| `heading-lg` | 1.5rem (24px) | 600 | 1.3 | Subtítulos |
| `heading-md` | 1.25rem (20px) | 600 | 1.4 | Cards, módulos |
| `heading-sm` | 1.125rem (18px) | 600 | 1.4 | Labels destacados |
| `body-lg` | 1.125rem (18px) | 400 | 1.6 | Texto de destaque |
| `body-md` | 1rem (16px) | 400 | 1.6 | Texto principal |
| `body-sm` | 0.875rem (14px) | 400 | 1.5 | Texto secundário |
| `caption` | 0.75rem (12px) | 400 | 1.4 | Notas, metadata |

### Aplicação

```css
/* Títulos — Cormorant Garamond */
h1 { font: 500 3rem/1.1 var(--font-display); }
h2 { font: 500 2.25rem/1.2 var(--font-display); }
h3 { font: 500 1.75rem/1.25 var(--font-display); }

/* Corpo e UI — Inter */
body { font: 400 1rem/1.6 var(--font-body); }
.price { font: 600 1.25rem/1.4 var(--font-body); }
button { font: 500 0.875rem/1 var(--font-body); }
```

---

## 4. Espaçamento

### Escala de Espaçamento

Base: 4px

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.5rem;    /* 24px */
  --space-6: 2rem;      /* 32px */
  --space-7: 2.5rem;    /* 40px */
  --space-8: 3rem;      /* 48px */
  --space-9: 4rem;      /* 64px */
  --space-10: 5rem;     /* 80px */
  --space-11: 6rem;     /* 96px */
  --space-12: 8rem;     /* 128px */
}
```

### Uso Recomendado

| Contexto | Espaçamento |
|----------|-------------|
| Entre ícone e texto | `--space-2` |
| Padding interno de botões | `--space-3` vertical, `--space-5` horizontal |
| Entre elementos de formulário | `--space-4` |
| Entre cards de produto | `--space-5` |
| Entre secções de página | `--space-9` a `--space-11` |
| Margens laterais mobile | `--space-4` |
| Margens laterais desktop | `--space-6` a `--space-8` |

---

## 5. Layout

### Breakpoints

```css
:root {
  --breakpoint-sm: 640px;   /* Mobile landscape */
  --breakpoint-md: 768px;   /* Tablet */
  --breakpoint-lg: 1024px;  /* Desktop pequeno */
  --breakpoint-xl: 1280px;  /* Desktop */
  --breakpoint-2xl: 1536px; /* Desktop grande */
}
```

### Container

```css
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (min-width: 768px) {
  .container { padding: 0 var(--space-6); }
}

@media (min-width: 1280px) {
  .container { padding: 0 var(--space-8); }
}
```

### Grid de Produtos

| Breakpoint | Colunas | Gap |
|------------|---------|-----|
| < 640px | 2 | 12px |
| 640px+ | 2 | 16px |
| 768px+ | 3 | 20px |
| 1024px+ | 4 | 24px |
| 1280px+ | 4 | 32px |

---

## 6. Componentes

### Botões

#### Primário (CTA principal)

```css
.btn-primary {
  background: var(--ink);
  color: var(--white);
  font: 500 0.875rem/1 var(--font-body);
  padding: var(--space-3) var(--space-6);
  border: none;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  transition: background 200ms ease;
}

.btn-primary:hover {
  background: var(--stone);
}
```

#### Secundário

```css
.btn-secondary {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--ink);
  /* resto igual ao primário */
}

.btn-secondary:hover {
  background: var(--ink);
  color: var(--white);
}
```

#### Accent (destaque especial)

```css
.btn-accent {
  background: var(--malmequer-gold);
  color: var(--ink);
  border: none;
  /* resto igual ao primário */
}

.btn-accent:hover {
  background: var(--malmequer-amber);
}
```

### Cards de Produto

```css
.product-card {
  background: var(--white);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.product-card__image {
  aspect-ratio: 3/4;
  object-fit: cover;
  width: 100%;
}

.product-card__brand {
  font: 400 0.75rem/1.4 var(--font-body);
  color: var(--mist);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.product-card__name {
  font: 400 0.875rem/1.5 var(--font-body);
  color: var(--ink);
}

.product-card__price {
  font: 600 1rem/1 var(--font-body);
  color: var(--ink);
}

.product-card__price--sale {
  color: var(--error);
}

.product-card__price--original {
  font-weight: 400;
  color: var(--mist);
  text-decoration: line-through;
  margin-left: var(--space-2);
}
```

### Inputs

```css
.input {
  font: 400 1rem/1.5 var(--font-body);
  color: var(--ink);
  background: var(--white);
  border: 1px solid var(--cloud);
  padding: var(--space-3) var(--space-4);
  width: 100%;
  transition: border-color 200ms ease;
}

.input:focus {
  outline: none;
  border-color: var(--ink);
}

.input::placeholder {
  color: var(--mist);
}

.input--error {
  border-color: var(--error);
}

.input-label {
  font: 500 0.875rem/1 var(--font-body);
  color: var(--stone);
  margin-bottom: var(--space-2);
  display: block;
}

.input-error {
  font: 400 0.75rem/1.4 var(--font-body);
  color: var(--error);
  margin-top: var(--space-1);
}
```

### Tags e Badges

```css
.tag {
  font: 500 0.625rem/1 var(--font-body);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: var(--space-1) var(--space-2);
}

.tag--new {
  background: var(--malmequer-gold);
  color: var(--ink);
}

.tag--sale {
  background: var(--error);
  color: var(--white);
}

.tag--sold-out {
  background: var(--mist);
  color: var(--white);
}
```

---

## 7. Iconografia

### Estilo

- Linha fina (stroke: 1.5px)
- Cantos arredondados subtis
- Tamanho base: 24px
- Cores: herdam a cor do texto ou usam `--ink`

### Ícones Essenciais

| Ícone | Uso |
|-------|-----|
| Search | Pesquisa |
| User | Conta |
| Heart | Favoritos |
| ShoppingBag | Carrinho |
| Menu | Menu mobile |
| X | Fechar |
| ChevronDown | Dropdowns |
| ChevronRight | Navegação, breadcrumbs |
| Filter | Filtros |
| Plus/Minus | Quantidade |
| Check | Confirmação |
| Truck | Envio |
| RefreshCw | Devoluções |

### Recomendação

Usar [Lucide Icons](https://lucide.dev/) — open source, consistente, leve, e com pacote React.

```bash
npm install lucide-react
```

---

## 8. Imagens

### Fotografias de Produto

| Tipo | Aspect Ratio | Uso |
|------|--------------|-----|
| Listagem | 3:4 | Cards de produto, grelhas |
| Destaque | 4:5 | Homepage, hero |
| Detalhe | 1:1 | Galeria de produto |
| Lookbook | 2:3 | Editorial, campanha |

### Tratamento

- Fundo neutro (branco ou creme claro)
- Iluminação natural, sombras suaves
- Sem filtros pesados ou saturação excessiva
- Consistência de enquadramento entre produtos

### Otimização

```jsx
// Next.js Image component
<Image
  src="/produto.jpg"
  alt="Vestido midi floral"
  width={600}
  height={800}
  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
  quality={85}
  placeholder="blur"
/>
```

---

## 9. Animações

### Princípios

- Subtis e funcionais, nunca decorativas em excesso
- Duração curta (150-300ms)
- Easing natural

### Tokens

```css
:root {
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-slow: 300ms;
  
  --ease-out: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
}
```

### Transições Comuns

```css
/* Hover em botões e links */
transition: all var(--duration-base) var(--ease-out);

/* Abertura de modais e drawers */
transition: transform var(--duration-slow) var(--ease-out),
            opacity var(--duration-slow) var(--ease-out);

/* Feedback de formulários */
transition: border-color var(--duration-fast) var(--ease-out);
```

---

## 10. Logótipo

### Direção Recomendada

Dado o posicionamento (elegante mas acessível), sugiro explorar uma de duas direções:

**Opção A — Tipográfico Puro**
Wordmark em Cormorant Garamond, peso medium, com kerning ajustado. Simples, elegante, versátil. O "M" pode ter um tratamento subtil (ligadura ou detalhe).

**Opção B — Símbolo Abstracto**
Malmequer estilizado de forma geométrica/minimalista (não literal), acompanhado de wordmark. Funciona bem como favicon e ícone de app.

### Especificações (a definir após aprovação)

- Versões: completo, símbolo, wordmark
- Variantes: positivo (sobre claro), negativo (sobre escuro)
- Área de proteção: mínimo de 1x altura do símbolo
- Tamanho mínimo: 24px de altura (digital)

---

## 11. Aplicações

### Favicon e Touch Icons

```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

### Open Graph

```html
<meta property="og:image" content="/og-image.jpg">
<!-- Tamanho recomendado: 1200x630px -->
```

### Email

- Usar cores web-safe equivalentes
- Font fallback: Georgia (display), Arial (body)
- Botões como imagens com alt text

---

## 12. Checklist de Implementação

### Fase 1 — Fundação
- [ ] Configurar variáveis CSS (cores, tipografia, espaçamento)
- [ ] Importar fontes (Google Fonts)
- [ ] Instalar Lucide Icons
- [ ] Criar componentes base (Button, Input, Card)

### Fase 2 — Componentes
- [ ] Header e navegação
- [ ] Footer
- [ ] Product Card
- [ ] Product Grid
- [ ] Filtros e ordenação
- [ ] Carrinho (drawer)
- [ ] Formulários (checkout, conta)

### Fase 3 — Páginas
- [ ] Homepage
- [ ] Listagem de produtos
- [ ] Página de produto
- [ ] Carrinho
- [ ] Checkout
- [ ] Conta de utilizador

### Fase 4 — Refinamento
- [ ] Testes de acessibilidade
- [ ] Otimização de performance
- [ ] Animações e micro-interações
- [ ] Testes em dispositivos reais

---

## Recursos

- [Inter Font](https://fonts.google.com/specimen/Inter)
- [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond)
- [Lucide Icons](https://lucide.dev/)
- [Next.js Image Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing/images)

---

*Design System v1.0 — Malmequer*
*Última atualização: Janeiro 2026*
