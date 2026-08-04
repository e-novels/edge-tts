# Theme Token Reference

Edit `index.ts` and add only the tokens your theme needs. Every key is passed to Novel-Electron without the CSS `--` prefix. Values must be valid CSS strings, usually hex colors or `rgba(...)` values.

Start with background, text, border, and brand colors. Install the extension and inspect the app after each small group of changes. This keeps contrast problems easy to trace.

## Backgrounds

| Name | Description |
| --- | --- |
| `color-bg-base` | Main application page background. |
| `color-bg-primary` | Main content and reading area background. |
| `color-bg-secondary` | Sidebar, secondary panel, and navigation background. |
| `color-bg-tertiary` | Card, input, and lower-level surface background. |
| `color-bg-elevated` | Dropdown, popover, and modal background above content. |
| `color-bg-overlay` | Backdrop behind a modal or dialog. |

## Text And Borders

| Name | Description |
| --- | --- |
| `color-text-primary` | Headings and primary body text. |
| `color-text-secondary` | Labels, metadata, supporting copy, and captions. |
| `color-text-tertiary` | Placeholders, hints, and lower-priority information. |
| `color-text-disabled` | Disabled text and icons. |
| `color-border-subtle` | Very light divider between nearby areas. |
| `color-border-default` | Standard card, input, panel, and control border. |
| `color-border-strong` | Emphasized, focus, or clearly separated border. |

## Brand And Accent

| Name | Description |
| --- | --- |
| `color-brand` | Base brand color. |
| `color-brand-default` | Primary buttons, links, selected controls, and primary emphasis. |
| `color-brand-hover` | Hover state for primary actions. |
| `color-brand-active` | Pressed or active state for primary actions. |
| `color-brand-subtle` | Light background for badges, selections, and branded emphasis. |
| `color-brand-text` | Text and icons displayed on `color-brand-default`. |
| `color-accent-default` | Secondary emphasis, charts, and non-primary action elements. |
| `color-accent-hover` | Hover state for accent elements. |
| `color-accent-subtle` | Light accent background. |

## Status Colors

| Name | Description |
| --- | --- |
| `color-success-bg` | Success notification or badge background. |
| `color-success-fg` | Success text, icons, and metrics. |
| `color-success-border` | Success notification border. |
| `color-warning-bg` | Warning notification or badge background. |
| `color-warning-fg` | Warning text and icons. |
| `color-warning-border` | Warning notification border. |
| `color-danger-bg` | Error, destructive warning, or danger badge background. |
| `color-danger-fg` | Error text, icons, and destructive actions. |
| `color-danger-border` | Error notification border. |
| `color-info-bg` | Informational notification background. |
| `color-info-fg` | Informational text and icons. |
| `color-info-border` | Informational notification border. |

## Activity Bar And Loading

| Name | Description |
| --- | --- |
| `color-activity-bar-bg` | Activity bar background. |
| `color-activity-bar-border` | Activity bar border. |
| `color-activity-bar-icon` | Default activity bar icon. |
| `color-activity-bar-icon-hover-bg` | Activity bar icon background on hover. |
| `color-activity-bar-icon-hover` | Activity bar icon on hover. |
| `color-activity-bar-icon-active` | Selected activity bar icon. |
| `color-scrollbar-track` | Scrollbar track background. |
| `color-scrollbar-thumb` | Scrollbar thumb. |
| `color-row-stripe` | Alternating row background in a table or list. |
| `color-skeleton-highlight` | Skeleton loading highlight. |
| `color-skeleton-base` | Skeleton loading base. |

## Toast And Error Page

| Name | Description |
| --- | --- |
| `color-toast-success` | Success toast color. |
| `color-toast-error` | Error toast color. |
| `color-toast-warning` | Warning toast color. |
| `color-toast-text` | Primary toast text. |
| `color-toast-text-secondary` | Secondary toast text. |
| `color-toast-shadow` | Toast shadow. |
| `color-error-page-bg` | Error page background. |
| `color-error-page-subtitle` | Error page subtitle. |
| `color-error-page-box-bg` | Error box background. |
| `color-error-page-box-border` | Error box border. |
| `color-error-page-message` | Error message content. |
| `color-error-page-stack` | Stack trace or technical details on the error page. |
| `color-error-page-btn-border` | Error page button border. |
| `color-error-page-btn-bg` | Error page button background. |

## Hero

| Name | Description |
| --- | --- |
| `color-hero-bg` | Hero area background. |
| `color-hero-blur-filter` | CSS filter for the blurred hero background image. |
| `color-hero-blur-opacity` | Opacity of the blurred hero image layer. |
| `color-hero-overlay-from` | Starting color of the hero overlay. |
| `color-hero-overlay-mid` | Middle color of the hero overlay. |
| `color-hero-overlay-to` | Ending color of the hero overlay. |
| `color-hero-title` | Hero title. |
| `color-hero-meta` | Hero metadata. |
| `color-hero-highlight` | Emphasized text or statistic in the hero. |
| `color-hero-genre-bg` | Hero genre tag background. |
| `color-hero-genre-text` | Hero genre tag text. |
| `color-hero-genre-border` | Hero genre tag border. |
| `color-hero-desc-bg` | Hero description block background. |
| `color-hero-desc-border` | Hero description block border. |
| `color-hero-desc-text` | Hero description text. |
| `color-hero-btn-bg` | Hero button background. |
| `color-hero-btn-text` | Hero button text. |
| `color-hero-btn-border` | Hero button border. |
| `color-hero-btn-hover` | Hero button background on hover. |
| `color-hero-nav-bg` | Hero navigation control background. |
| `color-hero-nav-text` | Hero navigation icon or text. |
| `color-hero-nav-hover` | Hero navigation color on hover. |
| `color-hero-dot-active` | Active hero page indicator dot. |
| `color-hero-dot-inactive` | Inactive hero page indicator dot. |
| `color-hero-border` | Hero area border. |

## Hero Rank And Reader Note

| Name | Description |
| --- | --- |
| `color-hero-rank-{gold,silver,bronze,indigo,teal,gray}-bg` | Hero rank badge background for each color tier. |
| `color-hero-rank-{gold,silver,bronze,indigo,teal,gray}-text` | Hero rank badge text and icon for each color tier. |
| `color-hero-rank-{gold,silver,bronze,indigo,teal,gray}-border` | Hero rank badge border for each color tier. |
| `color-reader-note-bar` | Left emphasis bar of a reader note. |
| `color-reader-note-bg` | Reader note background. |
| `color-reader-note-border` | Reader note border. |
| `color-reader-note-label` | Reader note label. |

## Contrast Checklist

| Name | Description |
| --- | --- |
| Background and text | Check `color-text-primary` on `color-bg-primary`, then `color-text-secondary` on `color-bg-secondary`. |
| Primary button | Check `color-brand-text` on `color-brand-default`; hover and active must be more distinct than the default state. |
| Status | Success, warning, danger, and info must be visually distinct and not confused with the brand color. |
| Modal and toast | Check that text remains readable on `color-bg-overlay` and toast backgrounds. |

## Programmatic Theme Workflow

The theme profile calls `novel.ui.applyTheme` during activation in both Electron and web deployments. Start with a small palette in `index.ts`, install the package, and inspect backgrounds, text, controls, status colors, overlays, and reader pages before overriding less common tokens.

1. Set `starter.kind` to `theme` in `extension.json`.
2. Keep only the `ui.theme` permission; remove scraper, `network`, and `reader` fields.
3. Edit `TEMPLATE_THEME`; values must be valid CSS strings and keys must be tokens in this reference.
4. Run `npm test` and `npm run test:package`.
5. Install the generated ZIP through **Extensions** > **Install Extension from ZIP**, then activate it from the extension detail page.

Tokens omitted from `TEMPLATE_THEME` retain the host application value. Deactivate or uninstall the extension to roll back its programmatic variables.

## Declarative Theme Metadata

`contributes.themes` can describe a packaged theme asset. Each entry needs an `id`, `label`, `uiTheme` (`light` or `dark`), and safe relative `path`; never combine it with a scraper contribution. The tested starter flow is programmatic `novel.ui.applyTheme`, so declarative metadata alone must not be expected to apply variables.

## Test And Review

`test/theme/run-tests.js` checks activation and baseline tokens in both bundles. Update its assertions whenever the visual identity changes. After installation, manually verify primary text on page/sidebar backgrounds, button text on default/hover/active states, and all status treatments.