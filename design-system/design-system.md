# MirCity — Дизайн-система

> Источник: Figma-файл «Дизайн», апрель 2026  
> CSS-переменные: `design-system/tokens.css` — подключать в каждый прототип

---

## Цвета

### Основные
| Токен | HEX | Применение |
|-------|-----|------------|
| `--color-primary` | `#1F3A60` | Кнопки, активные фильтры, ссылки |
| `--color-accent` | `#FF7E8A` | Акцентные бейджи, иллюстрации |

### Текст
| Токен | HEX | Применение |
|-------|-----|------------|
| `--color-text-primary` | `#232321` | Основной текст, заголовки |
| `--color-text-black` | `#000000` | Цены, жирный текст |
| `--color-text-secondary` | `#AFAFAF` | Подписи, метаданные, плейсхолдеры |
| `--color-text-contrast` | `#FFFFFF` | Текст на синем фоне |
| `--color-text-dark` | `#333333` | Промежуточный тёмный |

### Фон
| Токен | HEX | Применение |
|-------|-----|------------|
| `--color-bg-white` | `#FFFFFF` | Карточки, модалки, bottom sheet |
| `--color-bg-grey` | `#F5F5F5` | Фон экранов |
| `--color-bg-divider` | `#E8E8E8` | Разделители, бордеры |
| `--color-bg-black` | `#232321` | Тёмные поверхности, баннеры |
| `--color-bg-blue-tint` | `#F2F8FF` | Активное состояние (светлый синий) |
| `--color-bg-pink-tint` | `#FFF5F6` | Акцентный блок (светло-розовый) |

---

## Типографика

**Шрифт:** Roboto

| Роль | Размер | Вес | Токены |
|------|--------|-----|--------|
| Заголовок страницы | 18px | SemiBold (600) | `--text-lg` + `--font-semibold` |
| Body | 16px | Regular (400) | `--text-base` + `--font-regular` |
| Подписи, кнопки | 14px | Regular / Medium | `--text-sm` |
| Метки, бейджи | 12px | Regular | `--text-xs` |

---

## Скругления

| Токен | Значение | Применение |
|-------|----------|------------|
| `--radius-xs` | 2px | — |
| `--radius-sm` | 4px | — |
| `--radius-md` | 8px | Небольшие блоки |
| `--radius-lg` | 12px | Карточки магазинов |
| `--radius-xl` | 16px | Карточки ресторанов |
| `--radius-2xl` | 24px | Кнопки |
| `--radius-full` | 999px | Pill-кнопки, аватары, чипы |

---

## Отступы

Система построена на **4px-модуле** (Tailwind-совместимая).  
Основной боковой отступ экрана: **16px**.

```
4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 56 · 64 · 80
```

---

## Компоненты

### Кнопка (Primary)
- Высота: 49px (большая) / 40px (маленькая)
- Скругление: 24px
- Фон: `#1F3A60`
- Цвет текста: `#FFFFFF`
- Padding horizontal: 16px
- Gap (иконка + текст): 8px

### Поиск
- Высота: 48px
- Скругление: 999px (pill)
- Фон: `#F5F5F5`

### Фильтр-чип
- Высота: 32px
- Скругление: 999px
- Активный: фон `#1F3A60`, текст `#FFFFFF`
- Неактивный: фон `#F5F5F5`, текст `#232321`

### Карточка ресторана (большая)
- Размер: 343 × 228px
- Скругление: 16px
- Фон: `#FFFFFF`

### Карточка магазина
- Размер: 111 × 82px
- Скругление: 12px

### Карточка ЛП (половинная)
- Размер: 167 × 102px
- Скругление: 12px

### Строка категории
- Высота: 60px
- Скругление: 12px

---

## Лейаут (мобильный, iOS)

| Параметр | Значение |
|----------|----------|
| Ширина экрана | 375px |
| Контентная зона | 343px |
| Боковые поля | 16px |
| Status bar | 44px |
| Tab bar | 80px |
| Home indicator | 21px |

---

## Как использовать в прототипах

```html
<!-- В head каждого прототипа -->
<link rel="stylesheet" href="../design-system/tokens.css">

<style>
  body {
    font-family: var(--font-family);
    background: var(--color-bg-grey);
    color: var(--color-text-primary);
    max-width: var(--screen-width);
    margin: 0 auto;
  }

  .btn-primary {
    height: var(--btn-height-lg);
    background: var(--color-primary);
    color: var(--color-text-contrast);
    border-radius: var(--btn-radius);
    padding: 0 var(--btn-padding-x);
    font-size: var(--btn-font-size);
    font-weight: var(--btn-font-weight);
    border: none;
  }

  .card {
    background: var(--color-bg-white);
    border-radius: var(--radius-xl);
    padding: var(--space-4);
  }
</style>
```
