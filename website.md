# A-Coder Landing Page Design Plan

## Brand Identity

### Tagline
**"What VOID should've been"**

### Description
A-Coder is an open source, completely free to use and own AI coding editor designed to be with you wherever you go.

---

## Color Palette

### Primary Colors
| Color | Hex | Usage |
|-------|-----|-------|
| **Smokey Black** | `#1a1a1a` | Primary background, headers |
| **Crisp White** | `#ffffff` | Primary text, CTAs |
| **Muted Gray** | `#6b7280` | Secondary text, borders |

### Extended Palette
| Color | Hex | Usage |
|-------|-----|-------|
| **Deep Black** | `#0d0d0d` | Hero section background |
| **Charcoal** | `#2d2d2d` | Card backgrounds, sections |
| **Silver Gray** | `#9ca3af` | Subtle accents, icons |
| **Off White** | `#f5f5f5` | Hover states, highlights |
| **Accent** | `#3b82f6` | Links, buttons (subtle blue) |

---

## Page Structure

### 1. Hero Section
**Background:** Deep black (`#0d0d0d`) with subtle gradient to smokey black

**Content:**
```
[A-Coder Logo - Clean, minimal cube icon]

A-CODER

"What VOID should've been"

An open source, completely free to use and own
AI coding editor designed to be with you wherever you go.

[Download for Mac]  [Download for Linux]  [View on GitHub]
```

**Design Notes:**
- Logo centered, large and bold
- Tagline in muted gray, italicized
- Description in crisp white, clean sans-serif
- CTA buttons: White outline on hover fills white with black text
- Subtle particle/grid animation in background (optional)

---

### 2. Features Section
**Background:** Smokey black (`#1a1a1a`)

**Layout:** 3-column grid on desktop, stacked on mobile

**Features to Highlight:**

#### Row 1: Core AI Features
| Feature | Icon | Description |
|---------|------|-------------|
| **AI Agent Mode** | 🤖 | Let AI take the wheel. Edit files, run commands, and execute complex tasks autonomously. |
| **Plan Before Code** | 📋 | Research and plan with read-only tools before making any changes. Review and approve before execution. |
| **Checkpoint System** | ⏱️ | Visualize and revert changes at any point. Never lose your work. |

#### Row 2: Developer Experience
| Feature | Icon | Description |
|---------|------|-------------|
| **Any Model, Anywhere** | 🌐 | OpenAI, Anthropic, Ollama, local models - bring your own or host locally. |
| **Context Aware** | 🧠 | Intelligent token management. Auto-compression keeps conversations flowing. |
| **Mobile Ready** | 📱 | REST API for mobile companion apps. Control A-Coder from anywhere. |

**Design Notes:**
- Cards with charcoal background (`#2d2d2d`)
- White headings, muted gray descriptions
- Icons in silver gray or subtle accent color
- Hover: subtle lift with shadow

---

### 3. Code Demo Section
**Background:** Charcoal (`#2d2d2d`)

**Content:**
- Animated GIF or video showing A-Coder in action
- Split view: User prompt → AI response → Code changes
- Terminal-style aesthetic with syntax highlighting

**Caption:** "Watch A-Coder transform your ideas into code"

---

### 4. Comparison Section (Optional)
**Background:** Smokey black (`#1a1a1a`)

**Title:** "Why A-Coder?"

| Feature | A-Coder | Others |
|---------|---------|--------|
| Completely Free | ✅ | ❌ Subscription |
| Open Source | ✅ | ❌ Closed |
| Self-Hostable | ✅ | ❌ Cloud only |
| Any LLM Provider | ✅ | ❌ Locked in |
| Local Models | ✅ | ❌ API only |
| Mobile API | ✅ | ❌ Desktop only |

**Design Notes:**
- Minimal table design
- Checkmarks in accent color
- X marks in muted gray

---

### 5. Getting Started Section
**Background:** Deep black (`#0d0d0d`)

**Title:** "Get Started in Seconds"

```
1. Download A-Coder
2. Add your API key (or connect Ollama)
3. Start coding with AI
```

**CTA:** Large download buttons for Mac and Linux
- Windows: "Coming soon" badge

---

### 6. Community Section
**Background:** Smokey black (`#1a1a1a`)

**Content:**
- GitHub stars badge
- Discord/community link
- "Built by developers, for developers"

---

### 7. Footer
**Background:** Deep black (`#0d0d0d`)

**Content:**
- Logo (small)
- Links: GitHub | Documentation | Discord
- "Open source under MIT License"
- Copyright

---

## Typography

### Font Stack
- **Headings:** Inter, SF Pro Display, or similar clean sans-serif
- **Body:** Inter, system-ui
- **Code:** JetBrains Mono, Fira Code, monospace

### Sizes
| Element | Size | Weight |
|---------|------|--------|
| Hero Title | 64px | 700 (Bold) |
| Tagline | 24px | 400 (Regular, italic) |
| Section Headings | 36px | 600 (Semi-bold) |
| Feature Titles | 20px | 600 |
| Body Text | 16px | 400 |
| Small Text | 14px | 400 |

---

## Interactions & Animations

### Hover States
- Buttons: Fill transition (0.2s ease)
- Cards: Subtle lift with shadow
- Links: Underline slide-in

### Scroll Animations
- Fade-in-up for sections
- Stagger animation for feature cards
- Parallax on hero background (subtle)

### Loading
- Shimmer effect matching the "A-Coder is thinking" animation
- Smokey black base with silver shine sweep

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, stacked |
| Tablet | 640-1024px | 2-column grid |
| Desktop | > 1024px | 3-column grid, full layout |

---

## Assets Needed

### Images
- [ ] A-Coder logo (SVG, multiple sizes)
- [ ] Hero background (subtle grid/particles)
- [ ] Feature icons (SVG)
- [ ] Demo video/GIF
- [ ] Platform icons (macOS, Linux)

### Downloads
- [ ] macOS DMG (Intel + Apple Silicon)
- [ ] Linux AppImage
- [ ] Windows: Coming soon
