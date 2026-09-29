# Cross-platform translation

> Hand-written companion to `SKILL.md`. Load it when the app is not built with SwiftUI, UIKit,
> or AppKit.

The references use Apple's names. Speak the user's framework. For web targets, apply the
guidelines as design principles and translate them to HTML/CSS; do not force native iOS chrome
into the browser.

## Vocabulary

| Reference says | Flutter / React Native | Tauri / Electron / Web | Design meaning |
| --- | --- | --- | --- |
| iOS, iPadOS | Mobile, tablet | Mobile viewport | Touch first, one-handed reach, compact width |
| macOS | | Desktop, pointer-and-keyboard | Pointer and keyboard, multi-window, menu bar |
| SwiftUI, UIKit, AppKit | Widget tree, components | Web components, JSX components | The framework layer |
| System colors, semantic colors | ThemeData, design tokens | CSS custom properties, design tokens | Colors named by role that adapt to light and dark |
| SF Pro, SF Compact, New York | Platform font, Roboto, custom | System UI font stack (`-apple-system`, `Segoe UI`) | A legible system typeface with optical sizes |
| Dynamic Type | textScaler, font scaling | Zoom, `rem`-based type, `text-size-adjust` | Text scales with the person's setting |
| SF Symbols | Material Icons, Lucide, custom set | Icon set (Lucide, Heroicons) | One consistent, weight-matched icon system |
| Tab bar | BottomNavigationBar, NavigationBar, tab navigator | Top nav, route segment | Top-level sections, always visible |
| Sidebar, split view | NavigationRail plus detail | Sidebar, off-canvas drawer, or two-pane grid | Two- or three-column hierarchy |
| Toolbar, navigation bar | AppBar, header | Sticky header | Actions on the current view |
| Sheet, popover | Bottom sheet, modal, dialog | Dialog, `<dialog>`, drawer, bottom sheet | A temporary, focused task |
| Liquid Glass | BackdropFilter blur | `backdrop-filter`, system vibrancy | Translucent functional layer over content |
| VoiceOver | TalkBack, Semantics, accessibilityLabel | ARIA, `aria-*`, screen reader | Screen reader support |
| Safe area | SafeArea, insets | Title bar and window chrome, `env(safe-area-inset-*)`, `100svh` | Content never hides under system UI |
| Size classes (compact, regular) | Width and height breakpoints: LayoutBuilder, MediaQuery.sizeOf, useWindowDimensions | CSS media and container queries | Layout keyed to the space available, not to the device |
| Menu bar, Dock menu | | Native app menu, tray menu | Every command reachable from a menu |

## Conventions to check

Mobile (Flutter, React Native):

- Bottom tab navigation, 44 pt targets (48 dp on Material), size-class layouts, safe areas,
  system text scaling, keyboard avoidance, and swipe gestures where the platform expects them.
- When one codebase targets iOS and Android, decide per component whether to follow each
  platform's convention or one shared design, and say which. Tab bars, sheets, and back
  navigation are where people notice.

Desktop (Tauri, Electron):

- A native menu bar with every command, standard shortcuts, standard window controls, resizable
  and multi-window layouts, right-click context menus, hover and pointer feedback, and settings
  under the app menu.
- Prefer the platform's real materials and window chrome over a web imitation.

Web (Next.js, React, Remix, Vue, plain HTML/CSS):

- Apply HIG as design principles, not as native chrome. No fake iOS tab bar, no forced SF Pro
  webfont, no iOS-only sheet physics. Translate vocabulary from the table above.
- 44 pt hit targets, 17 pt body, 15 pt small, 11 pt minimum for anything meaningful. `rem`-based
  sizes so browser text-size settings scale the whole page; test at 200% zoom.
- Responsive by width breakpoint, not by device sniffing. A fluid `clamp()` type scale is a
  legitimate answer to Apple's size-class guidance.
- Keyboard reachability: visible focus, logical tab order, skip link, Escape closes dialogs, and
  a focus trap inside modals. 44 pt is a pointer-and-touch floor, not a touch-only rule.
- Keep `backdrop-filter` for functional layers only (sticky header, nav, floating controls),
  never for content cards, and always with an opaque-enough fallback behind it.
- Respect `prefers-reduced-motion`, and check `env(safe-area-inset-*)` plus `100svh` on mobile
  so sticky bars and bottom controls clear the home indicator.

