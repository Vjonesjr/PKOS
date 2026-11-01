# Smart PKOS Pass 5 — Visible page-position scrollbar

User requests a visible scrollbar along the side of long pages so they can tell where they are within the page.

## Acceptance criteria
- Show a slim, high-contrast vertical scroll track and thumb on scrollable long-page screens.
- Thumb position reflects the current scroll position; thumb length reflects the proportion of the page visible.
- Thumb stays discoverable while scrolling; avoid a permanently intrusive overlay on short screens with no overflow.
- Position inside the content area, clear of the fixed four-tab bottom navigation, floating scroll-to-top button, and Android safe areas.
- Support both OLED dark/neon green and light themes with accessible contrast; don't obscure text or interactive controls.
- Respect reduced-motion preferences; no distracting animation.
- Verify actual scroll container (window versus nested scrollable region) before implementation. Do not add a fake scrollbar that doesn't track real scrolling.
- Test at Samsung S23 Ultra mobile width on Tasks, Projects, and Settings, including expanded/collapsed task groups.

## Status
Requested feature documented for Pass 5; implementation and device testing pending. Preserve Pass 4 APK and user data.
