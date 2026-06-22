# Assets Directory

Please place your images and icons in this directory.

## Recommended Structure

- `public/assets/images/` - For general images (hero backgrounds, event photos, etc.)
- `public/assets/icons/`  - For custom icons (if not using Lucide React)
- `public/assets/partners/` - For partner logos

## How to use in code

If you place an image at `public/assets/images/hero.jpg`, you can use it in your components like this:

```tsx
<img src="/assets/images/hero.jpg" alt="Hero Background" />
```

or using Next.js Image component:

```tsx
import Image from 'next/image';

<Image src="/assets/images/hero.jpg" width={1920} height={1080} alt="Hero Background" />
```
