# Configuração de Imagens Cloudinary para o Hero Banner

## Como alterar a imagem do Hero Banner

1. **Faz upload da tua imagem para o Cloudinary**
   - Acede à tua conta Cloudinary: https://cloudinary.com
   - Vai para "Media Library"
   - Faz upload da imagem que queres usar

2. **Copia o URL da imagem**
   - Clica na imagem que fizeste upload
   - Copia o "Secure URL" (começa com `https://res.cloudinary.com/...`)

3. **Atualiza o componente HeroBanner**
   - Abre o ficheiro: `app/page.tsx`
   - Encontra a linha com `imageUrl="https://res.cloudinary.com/demo/..."`
   - Substitui pelo URL da tua imagem

## Exemplo

```tsx
<HeroBanner
  imageUrl="https://res.cloudinary.com/SEU_CLOUD_NAME/image/upload/v1234567890/sua-imagem.jpg"
  title="Descobre a Nossa Nova Coleção"
  subtitle="Produtos de qualidade com entregas rápidas em todo o país"
  ctaText="Explorar Produtos"
  ctaLink="/products"
/>
```

## Otimizações Cloudinary (Opcional)

Podes adicionar transformações ao URL para otimizar a imagem:

```
https://res.cloudinary.com/SEU_CLOUD_NAME/image/upload/w_1920,h_1080,c_fill,q_auto,f_auto/v1234567890/sua-imagem.jpg
```

Parâmetros úteis:
- `w_1920,h_1080` - Redimensionar para 1920x1080px
- `c_fill` - Crop para preencher as dimensões
- `q_auto` - Qualidade automática baseada no dispositivo
- `f_auto` - Formato automático (WebP em browsers suportados)

## Outras customizações disponíveis

No componente `HeroBanner`, podes personalizar:
- `title` - Título principal
- `subtitle` - Subtítulo/descrição
- `ctaText` - Texto do botão principal
- `ctaLink` - Link do botão principal
