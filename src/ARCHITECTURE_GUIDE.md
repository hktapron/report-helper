# VTSP Workstation: Architectural & Design Guide (v25)

## 🏗️ Core Architecture (Modular Pattern)
The application has been refactored from a monolithic `App.jsx` into a modular system based on the **Separation of Concerns** principle.

### 1. Layers & Directories
- **`/src/constants/`**: Raw data and app settings.
  - `templates.js`: Contains hardcoded report bodies and template metadata.
- **`/src/utils/`**: Deterministic business logic.
  - `parser.js`: Formats time (e.g., 1430 -> 14:30), hydrates HTML templates with form data, and handles Regex parsing.
- **`/src/services/`**: Infrastructure and Third-party integrations.
  - `supabase.js`: Manages authentication flows, user normalization, and database sessions.
- **`/src/hooks/`**: Reusable React logic.
  - `useHtmlPreview.js`: Manages the dynamic HTML rendering lifecycle.
  - `useUserTemplates.js`: Handles template CRUD operations.
- **`/src/components/`**: Modular UI components.
  - `ReportForm.jsx`: The unified data entry area.
  - `PreviewArea.jsx`: The live HTML preview and action bar.
  - `MobileHeader.jsx` & `DemoWarning.jsx`: Responsive layout utilities.

## 🎨 Ultra-High Density Design System
The UI is optimized for heavy-duty data entry on desktop using a **Mobile-First with PC Overrides** strategy in `index.css`.

### PC Standards (>768px)
| Element | Value | Rationale |
| :--- | :--- | :--- |
| **Input Height** | `34px` | Minimizes vertical space to fit more fields. |
| **Font Size (Labels)** | `0.7rem` | High legibility for technical users. |
| **Font Size (Values)** | `0.85rem`| Crisp and condensed. |
| **Grid Gap** | `0.5rem 1rem` | Tight spacing between data points. |
| **Card Padding** | `1rem` | Reduces bezel waste. |

### Mobile Standards (Default)
| Element | Value | Rationale |
| :--- | :--- | :--- |
| **Input Height** | `56px` | Touch-friendly target for field staff. |
| **Font Size** | `1.0rem` | Standard readability for small screens. |

## ⚠️ Critical Development Rules
1. **Explicit Hook Imports**: Every new `.js` or `.jsx` file under `utils` or `hooks` that uses React must explicitly `import { useState, useEffect, ... } from 'react';` to prevent "Black Screen" runtime crashes.
2. **CSS Overrides**: Always use `.fields-grid` and `.form-input` classes instead of inline styles to ensure the global High-Density system applies correctly to new components.
3. **Template Hydration**: Never hardcode narrative generation. Always use the centralized `hydrateHtmlTemplate` utility in `parser.js`.

---
**Last Updated**: 2026-04-14 (v25 Ultra-Density Stable)
