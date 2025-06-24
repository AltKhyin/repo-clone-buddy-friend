# **\[DOC\_8\] Mobile Adaptation & Experience**

**Version:** 2.1  
 **Date:** June 14 2025

**Purpose**  
 This document defines the canonical guidelines for translating the EVIDENS desktop experience into a world‑class, mobile‑first interface. It is non‑negotiable: every mobile screen **must** adhere to the ergonomic, focus, and performance principles described here.

---

## **1.0 Core Principles (The Mobile Manifesto)**

| Thesis | Directive |
| ----- | ----- |
| **I – Ergonomics / Rule of Thumb** | All primary interactions must sit within the thumb‑reachable zone on modern 6" – 6.7" devices. |
| **II – Sanctity of Focus** | Each view has a single job. Use strong typography, generous white‑space, and progressive disclosure. |
| **III – Performance \= Feature** | Perceived speed is critical. Lazy‑load heavy modules, pre‑fetch on Wi‑Fi, and minimise over‑the‑wire bytes. |

---

## **2.0 Global Application Shell & Navigation**

### **2.1 Desktop Paradigm (For Reference)**

A persistent two‑column layout with a collapsible navigation sidebar.

### **2.2 Mobile Adaptation**

**RULE 1 (Layout)**  
 The two‑column layout is **abandoned**. Mobile uses a single, full‑width column.

**RULE 2 (Navigation)**  
 Primary navigation **must** move to a persistent **Bottom Tab Bar** (always visible, 4‑5 items). Top‑left hamburger menus are **forbidden**.

**BottomTabBar canonical items**

1. Início (Home)

2. Acervo (Archive)

3. Comunidade (Community)

4. Perfil (Profile)

5. (Optional) Notificações – bell icon only if space permits

**HEADER**  
 Mobile header shows the word‑mark *Reviews.* centred, plus icon buttons (notifications, search) on the right.

---

## **3.0 Homepage (`/`)**

### **3.1 Desktop Paradigm**

Dashboard with multiple horizontal carousels.

### **3.2 Mobile Adaptation**

**RULE 3 (Stacking)**  
 Modules stack vertically; no side‑by‑side content.

**RULE 4 (Carousels)**  
 `ReviewCarousel` becomes a swipeable list showing \~1.5 cards to hint scrolling.

**RULE 5 (Progressive Disclosure)**  
 Long modules (e.g. *Próxima Edição* poll) show only top 3‑5 items \+ **Ver todas** link to full page.

---

## **4.0 Acervo (`/acervo`)**

### **4.1 Desktop Paradigm**

Masonry grid \+ persistent tag panel.

### **4.2 Mobile Adaptation**

**RULE 6 (Grid)**  
 Grid re‑flows to **two columns**. Card min‑tap‑area ≥ 160 × 160 px.

**RULE 7 (Tag Interaction)**  
 Persistent tag panel is replaced by a **Filter** button that opens a **Bottom Sheet Modal**.

*Interaction specifcation*: BottomSheet uses 90 % viewport height, drag‑to‑dismiss, lists parent tags first, subtags indented.

---

## **5.0 Review Detail (`/reviews/[id]`)**

### **5.1 Desktop Paradigm**

Full‑width article rendered by **LayoutAwareRenderer**.

### **5.2 Mobile Adaptation**

**RULE 8 (Typography)**  
 Body text min 16 px, line‑height ≈ 1.7, side‑padding ≥ 16 px.

**RULE 9 (Performance)**  
 Comments thread is **lazy‑loaded** only when nearing viewport.

**RULE 10 (Adaptive Rendering)**  
 `LayoutAwareRenderer` **must** detect viewport and use `structured_content.layouts.mobile`. This is non‑negotiable.

---

## **6.0 Community (`/community`, `/community/[postId]`)**

### **6.1 Desktop Paradigm**

Feed \+ right sidebar.

### **6.2 Mobile Adaptation**

**RULE 11 (Layout)**  
 Collapse to single feed column.

**RULE 12 (Sidebar Content)**  
 Critical widgets (e.g. *Enquete da Semana*) appear as **pinned cards** at top of feed; low‑priority static content moves to an **Info** screen reachable from header.

**RULE 13 (Card Actions)**  
 Vote / comment / save buttons are icon‑only, 44 × 44 px, bottom‑aligned on each card.

---

## **7.0 Profile & Social**

### **7.1 Desktop Paradigm**

Profile header \+ tabbed activity, hover‑cards.

### **7.2 Mobile Adaptation**

**RULE 14 (Hover → Long‑Press)**  
 `ProfileHoverCard` replaced with **long‑press** on avatar.

**RULE 15 (Tab Navigation)**  
 Tabs become a horizontally swipeable pager.

---

## **8.0 Implementation Requirements**

1. **Viewport Detection**  
    `useIsMobile()` util returns boolean based on CSS MQ `(max‑width: 768px)`; drives shell selection.

2. **Image Optimisation**  
    Use Next.js `<Image>` with `sizes` prop:  
    `sizes="(max-width: 768px) 100vw, 50vw"`.

3. **Performance Budgets**  
    CLS \< 0.1, TTI \< 4 s on mid‑range 4G. Any screen exceeding budget must ship skeleton loaders.

4. **Touch Targets**  
    All actionable elements ≥ 44 × 44 px.

5. **Testing Matrix**  
    iPhone SE (375 px), iPhone 12 (390 px), Pixel 7 Pro (412 px), iPad Mini (768 px) portrait & landscape.

---

*End of \[DOC\_8\] Mobile Adaptation & Experience*

