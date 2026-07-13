EngineerVerse UI PRD

## Document Purpose

This document is the implementation-ready UI product requirements document for **EngineerVerse**, a gamified engineering learning platform where users solve short interactive challenges by building, simulating, debugging, and optimizing systems.

This file is written to be directly usable as:

- a design handoff
- a frontend implementation spec
- a prompt/spec for Codex or another coding agent

The scope of this PRD is the **seven finalized pages**:

1. Home Page
2. Profile Page
3. Challenge Listing Page
4. Challenge Description Page
5. Drag & Drop Builder Page
6. Simulation Page
7. After Challenge Scoring Page

This PRD assumes a premium, minimal, futuristic visual language with strong motion design and clean hierarchy.

---

## Product Summary

### One-line Pitch

**EngineerVerse** is an engineering arcade where players learn by building and running system design and AI challenges through polished, game-like interfaces.

### Core UX Principle

The product should feel like a **playable operating system for engineers**, not a typical dashboard or admin panel.

### Experience Goals

- Make judges instantly want to interact with it
- Keep the interface minimal, premium, and uncluttered
- Make progression feel game-like, not course-like
- Ensure the build-to-simulate-to-score loop is visually memorable
- Let the same UI system scale across all challenge types

---

## Primary User Flow

The main loop across the product is:

```text
Home
  -> Challenge Listing
  -> Challenge Description
  -> Drag & Drop Builder
  -> Simulation
  -> After Challenge Scoring
  -> Replay / Next Challenge / Home
```

The **Profile** page is secondary and can be entered from Home or global navigation without interrupting the main challenge flow.

---

## Information Architecture

### Core Routes

```text
/
/profile
/challenges
/challenge/:challengeId
/build/:challengeId
/simulate/:challengeId
/result/:challengeId
```

### Navigation Rules

- `Home` is the default landing route
- `Challenge Listing` is the discovery hub for all available challenges
- `Challenge Description` is a mission briefing screen before starting gameplay
- `Drag & Drop Builder` is the primary interactive construction screen
- `Simulation` is a full-screen payoff moment and should feel cinematic
- `After Challenge Scoring` is the evaluation and replay screen
- `Profile` is persistent but non-blocking

---

## Design System

## Brand Direction

EngineerVerse should feel:

- futuristic
- precise
- competitive
- immersive
- premium

Avoid:

- SaaS dashboard vibes
- overly bright neon overload
- cluttered card grids
- heavy gradients everywhere
- default Tailwind-looking layouts

---

## Color System

Use this palette as the only base color system:

- `#0B0C10` -> app background / deepest canvas / body backdrop
- `#1F2833` -> surface / cards / panels / elevated containers
- `#C5C6C7` -> primary text / muted light borders / secondary icon tint
- `#66FCF1` -> primary accent / active state / selected state / CTA emphasis
- `#45A29E` -> secondary accent / supportive glow / graphs / success-neutral feedback

### Semantic Mapping

```text
bg.base = #0B0C10
bg.surface = #1F2833
text.primary = #C5C6C7
accent.primary = #66FCF1
accent.secondary = #45A29E
```

### Recommended Extended Usage

To keep the UI implementation flexible without introducing new brand colors, use opacity variants of the palette:

- `#0B0C10` at 70%, 80%, 90% for overlays
- `#1F2833` at 40%, 60%, 80% for borders and secondary surfaces
- `#C5C6C7` at 50%, 70%, 100% for text hierarchy
- `#66FCF1` at 12%, 20%, 35%, 100% for hover fills, glows, active edges
- `#45A29E` at 15%, 25%, 100% for charts, supporting badges, graph trails

### Color Behavior Rules

- Background should remain predominantly `#0B0C10`
- Most surfaces should be `#1F2833`
- Large areas of `#66FCF1` should be avoided; use it as a focused highlight
- `#45A29E` should balance the interface and reduce overuse of the brighter cyan
- Text should mostly live in `#C5C6C7`

### Functional Color Guidance

- Primary CTA: `#66FCF1` fill with dark text or dark icon treatment
- Active tab or selected tile: border glow with `#66FCF1`
- Secondary actionable states: `#45A29E`
- Disabled: use `#C5C6C7` at low opacity over `#1F2833`
- Hover: raise surface plus low-opacity cyan tint

---

## Typography

### Typeface Recommendation

Use one type family across the app for consistency and polish:

- Preferred: `Geist`
- Fallback: `Inter`, `system-ui`, `sans-serif`

### Typographic Tone

- sharp
- modern
- technical
- minimal

### Type Scale

Use a restrained scale:

- Hero Display: 48-64px / semibold
- Page Title: 28-36px / semibold
- Section Title: 20-24px / semibold
- Card Title: 16-18px / medium or semibold
- Body: 14-16px / regular
- Meta / Labels: 12-13px / medium
- Tiny Status / Chips: 11-12px / medium

### Typography Rules

- Use tighter tracking for headings
- Keep line length controlled for description blocks
- Do not use too many font weights
- Prefer semibold for emphasis instead of bold
- Use uppercase sparingly for labels, chips, and status headers

---

## Spacing and Layout System

### Base Grid

Use an 8px spacing system:

- `4px` micro spacing
- `8px` xs
- `12px` small
- `16px` base
- `24px` medium
- `32px` large
- `40px` xl
- `48px` section gap
- `64px` hero or page framing

### Radius System

- Small interactive chips: `10px`
- Cards: `16px`
- Large panels: `20px`
- Modals / cinematic containers: `24px`
- Builder canvas containers: `24px`

### Border Style

Use soft, low-contrast borders:

- 1px solid using `#C5C6C7` at low opacity
- active borders may use `#66FCF1` glow or 1px accent

### Shadow / Glow Language

Use shadows sparingly:

- base card shadow: subtle dark ambient shadow
- hover shadow: slightly larger soft shadow
- active accent glow: thin cyan bloom, not large neon halo

---

## Motion System

### Motion Personality

Motion should feel:

- responsive
- confident
- elegant
- slightly cinematic

Avoid:

- bouncy toy-like motion everywhere
- long laggy transitions
- over-animated page loads

### Standard Timing

- quick hover: `120ms - 180ms`
- standard transition: `220ms - 280ms`
- page entrance: `350ms - 450ms`
- simulation transitions: `500ms - 900ms`

### Motion Use Cases

- page fade and slight upward reveal
- card hover lift
- sidebar expansion
- progress bar fill
- graph pulse
- node activation glow
- moving packet trail in simulation
- score counting animation

---

## Reusable Components

The UI should be built from reusable primitives and gameplay components.

### Core App Components

- `AppShell`
- `TopNav`
- `SideRail`
- `PageHeader`
- `SectionHeader`
- `PrimaryButton`
- `SecondaryButton`
- `GhostButton`
- `Badge`
- `Pill`
- `StatCard`
- `ProgressBar`
- `Modal`
- `Toast`

### Content Components

- `GameCard`
- `ChallengeCard`
- `ChallengeMetaRow`
- `DifficultyIndicator`
- `RewardChip`
- `AchievementCard`
- `JudgeCard`
- `FeedbackList`

### Builder Components

- `BuilderSidebar`
- `NodePaletteItem`
- `CanvasToolbar`
- `PropertyPanel`
- `GraphNode`
- `GraphEdge`
- `RunButton`
- `ResetButton`
- `HintButton`

### Simulation Components

- `SimulationStage`
- `PacketTrail`
- `SystemNodePulse`
- `LatencyMeter`
- `StatusConsole`
- `MiniPreviewFrame`

### Scoring Components

- `ScoreHero`
- `ScoreBreakdownCard`
- `RecommendationList`
- `ReplayActions`

---

## Responsive Strategy

This app should be desktop-first, but still usable on tablets and acceptable on modern phones.

### Breakpoints

- Mobile: `0-767px`
- Tablet: `768-1023px`
- Desktop: `1024px+`
- Large Desktop: `1440px+`

### Responsive Principles

- Desktop is the flagship experience
- Tablet must support browsing, reading, and simplified builder interaction
- Mobile should support Home, Listing, Description, Profile, and Result well
- Mobile builder can be simplified if necessary, but should not fully break

### Responsive Behavior Rules

- Side navigation collapses into compact rail or drawer on smaller screens
- Multi-column layouts become stacked
- Dense status panels become swipeable or collapsible
- Builder sidebar becomes bottom sheet or left overlay on mobile/tablet
- Simulation should prioritize the flow animation over auxiliary stats on mobile

---

## Page Specs

## 1. Home Page

### Purpose

The Home Page is the emotional entry point. It should immediately communicate:

- this is a polished game/product
- it is challenge-based
- it has progression
- it has multiple engineering tracks

### UX Goal

A first-time user should understand the product in under 10 seconds and feel pulled toward pressing `Play`.

### Layout Structure

Recommended desktop layout:

```text
Top Navigation
Main Hero Panel
Daily Challenge / Continue Journey
Mini Game Grid
Progress and Recent Badges
Leaderboard Preview
```

### Key Sections

#### Top Navigation

Contents:

- logo / wordmark
- Home
- Challenges
- Profile
- optional settings icon

Behavior:

- sticky or semi-sticky
- subtle blur background on scroll

#### Hero Section

Contents:

- product name: EngineerVerse
- one-line value prop
- primary CTA: `Play Now`
- secondary CTA: `Browse Challenges`

Visual treatment:

- large, cinematic panel
- subtle grid/pattern or particle backdrop
- light cyan accent glow around CTA or hero edge

#### Continue Journey Panel

Contents:

- currently active challenge
- progress percentage
- quick resume CTA

#### Daily Challenge Panel

Contents:

- featured challenge title
- reward XP
- category
- estimated time
- quick start button

#### Mini Game Grid

Games to surface:

- RAG Builder
- Agent Architect
- System Design
- Debug Challenge
- Optimizer

Each `GameCard` includes:

- icon
- title
- short description
- difficulty or category tag
- play CTA

#### Progress Area

Contents:

- level
- XP bar
- badges
- streak or total challenges completed

### Visual Notes

- Avoid a boring dashboard grid
- Use one strong hero panel and then structured supporting blocks
- Card layout should feel editorial, not like analytics software

### Interactions

- card hover raises and glows softly
- active CTA gets strong cyan emphasis
- page should stagger reveal hero then cards

### Responsive Notes

- hero stacks vertically on mobile
- mini game grid becomes single-column or two-column cards
- progress and leaderboard preview move below main challenge content

---

## 2. Profile Page

### Purpose

The Profile Page is the gamification identity hub. It should reward the player visually and show progress without overwhelming them.

### UX Goal

The player should feel ownership, progression, and motivation.

### Layout Structure

```text
Profile Header
XP / Level Summary
Badges and Achievements
Completed Challenges
Performance Stats
Recent Activity
```

### Sections

#### Profile Header

Contents:

- avatar or monogram
- player name
- rank title
- total XP

#### Progress Summary

Contents:

- level number
- current XP bar
- next milestone

#### Achievements

Grid of badges showing:

- unlocked badge name
- small icon
- acquisition condition

#### Stats

Show:

- total challenges completed
- best category
- average score
- replay count
- current streak

#### Recent Activity

Timeline-style or compact feed:

- completed challenge
- achieved score
- unlocked badge

### Visual Notes

- keep this cleaner than Home
- use more stat modules and less narrative content
- avoid making it look like a resume dashboard

### Interactions

- badge hover reveals unlock condition
- stat cards animate numbers on load
- XP bar should animate fill

### Responsive Notes

- stack profile summary above stats on smaller screens
- achievements can become horizontal scroll cards on mobile

---

## 3. Challenge Listing Page

### Purpose

This is the exploration hub for all available challenges. It should feel like browsing missions in a premium game launcher.

### UX Goal

Users should discover challenges quickly and feel excited by the variety.

### Layout Structure

```text
Page Header
Category Filters
Search / Sort Bar
Featured Challenge Strip
Challenge Card Grid
```

### Sections

#### Page Header

Contents:

- title: Challenges
- subtitle explaining the challenge library

#### Filters

Suggested categories:

- All
- RAG
- Agents
- System Design
- Debug
- Optimize

Use pill-style segmented controls.

#### Search / Sort

Allow:

- search by title
- sort by difficulty
- sort by XP reward
- sort by duration

#### Featured Strip

Optional but recommended:

- one large highlighted card for the daily or promoted challenge

#### Challenge Grid

Each `ChallengeCard` should include:

- title
- category
- difficulty
- estimated time
- XP reward
- short summary
- `Start` button

### Visual Notes

- mix one featured horizontal card with a consistent grid below
- cards should not all be identical sizes if an editorial layout helps
- do not overload with filters above the fold

### Interactions

- filter transitions should animate smoothly
- grid should reflow gracefully
- cards should preview reward and difficulty without opening

### Responsive Notes

- filters become horizontally scrollable pills
- search and sort stack
- cards collapse to one-column or two-column layouts

---

## 4. Challenge Description Page

### Purpose

This is the mission briefing page. It should create anticipation before the player starts building.

### UX Goal

The player should clearly understand the challenge, reward, and what success looks like.

### Layout Structure

```text
Back Navigation
Challenge Hero Block
Mission Details
Requirements
Hints / What You’ll Learn
Start Building CTA
```

### Sections

#### Challenge Hero

Contents:

- challenge title
- category
- difficulty
- reward XP
- estimated duration

#### Mission Overview

A short, punchy narrative description.

#### Requirements

List:

- expected objectives
- supported or required components
- optional improvement paths if relevant

#### Hints / Learnings

Show:

- what the user will learn
- one light hint

#### CTA

Primary button:

- `Start Building`

Secondary:

- `Back to Challenges`

### Visual Notes

- this page should feel like a mission terminal
- use a strong heading block with dense metadata chips
- keep long paragraphs out

### Interactions

- reveal requirements and rewards with subtle stagger
- CTA should be visually dominant

### Responsive Notes

- metadata chips wrap cleanly
- sections stack naturally with maintained spacing

---

## 5. Drag & Drop Builder Page

### Purpose

This is the primary interactive page and the heart of the product. It must feel crisp, intentional, and satisfying to use.

### UX Goal

The player should feel like they are constructing a real engineering graph, not filling out a form.

### High-Level Layout

Recommended desktop structure:

```text
Top Challenge Header
Left Builder Sidebar
Center Canvas
Right Properties / Status Panel
Bottom Action Toolbar
```

### Core Regions

#### Challenge Header

Show:

- challenge title
- category
- timer or estimated time
- difficulty
- current progress or draft state

#### Left Sidebar: Node Palette

Contains draggable building blocks.

Each item should show:

- icon
- label
- short role description

Examples:

- API Gateway
- Redis
- Queue
- Database
- Client
- Chat Service

#### Center Canvas

This is the main React Flow or graph area.

Requirements:

- large, uncluttered canvas
- visible drop zones
- subtle background pattern or engineering grid
- smooth panning and zooming

#### Right Panel: Properties / Guidance

Show context-sensitive details:

- selected node information
- role explanation
- validation hints
- connection requirements

This panel can also show:

- draft warnings
- challenge objectives

#### Bottom Toolbar

Actions:

- Run Simulation
- Reset
- Hint
- Save Draft

### Builder Interaction Rules

- dragging a node from the palette should feel tactile
- node placement should snap softly, not rigidly
- edges should be elegant, not default and plain
- selected nodes get accent border/glow
- invalid connections should show gentle visual rejection

### Visual Notes

- the canvas should be the visual hero
- surrounding panels must support, not overpower, the graph
- avoid overloading the right panel with dense text

### Required Microinteractions

- palette item lifts on drag
- node settles with a small bounce
- edges animate on creation
- selected node pulses subtly
- Run button has a strong high-contrast glow state

### Responsive Notes

- on tablet/mobile, properties panel can become drawer or bottom sheet
- node palette can collapse into icon dock or slide-out tray
- canvas must remain usable with touch gestures

### Implementation Notes

- use React Flow for graph interaction
- wrap graph state in a central store
- keep node config data-driven from challenge JSON
- support custom node and edge components

---

## 6. Simulation Page

### Purpose

This is the product’s biggest payoff moment. It should transform the built graph into a cinematic, easy-to-understand live execution story.

### UX Goal

The player should feel that their architecture has come alive.

### Experience Model

This page should not feel like a loading screen. It should feel like a visual run of the system.

### Layout Structure

```text
Simulation Header
Main Simulation Stage
Live Metrics Sidebar or Footer
Status / Log Stream
```

### Core Elements

#### Simulation Header

Show:

- challenge title
- run status
- elapsed time

#### Main Stage

This is the hero area.

For system design challenges, show:

- simplified real-world preview UI
- architecture map
- packet moving through the system

For example:

- message sent in a mini chat window
- packet zooms into architecture path
- nodes pulse as message passes
- result shows delivery or failure

#### Live Metrics

May include:

- latency
- reliability
- throughput
- success rate

Keep it elegant and minimal.

#### Status Feed

Optional compact sequence like:

- Request received
- Auth checked
- Queue processed
- Delivery completed

This should support the visual story, not replace it.

### Visual Notes

- use darkness and contrast to make the moving packet feel vivid
- nodes should light up in sequence
- include a soft camera-like shift if useful, but do not overcomplicate

### Motion Rules

- stage should transition in from builder smoothly
- packet movement should be clearly trackable
- activated nodes should pulse
- success should end with satisfying visual confirmation

### Responsive Notes

- prioritize the main stage on small screens
- compress metrics into bottom strip
- reduce secondary logs if space is limited

### Implementation Notes

- simulation should be driven by timeline data
- separate simulation renderer from builder logic
- allow challenge-specific simulation scripts later

---

## 7. After Challenge Scoring Page

### Purpose

This page closes the loop. It evaluates the player, rewards them, and directs the next action.

### UX Goal

The player should feel accomplished, informed, and eager to replay or continue.

### Layout Structure

```text
Score Hero
Breakdown Cards
AI Judge Feedback
Recommendations
Replay / Next / Home Actions
```

### Sections

#### Score Hero

Show prominently:

- overall score
- rank or badge earned
- completion status

The score should animate in.

#### Breakdown

Depending on challenge type, show scoring dimensions like:

- architecture
- correctness
- latency
- reliability
- cost
- optimization quality

Use cards or bars rather than dense tables.

#### AI Judge Feedback

This is a central narrative component.

Include:

- 1 strong positive observation
- 1 weakness
- 1 actionable suggestion

#### Recommendations

Optional list:

- add cache
- improve ordering
- include queue
- reduce complexity

#### Actions

Primary:

- Replay

Secondary:

- Next Challenge
- Back Home

### Visual Notes

- celebration should be tasteful, not childish
- confetti only for excellent performance or milestone completion
- feedback must remain readable and structured

### Motion Rules

- score count-up
- badge slide/fade in
- breakdown bars animate
- action buttons appear after scoring settles

### Responsive Notes

- stack breakdown cards vertically
- keep actions easy to tap
- AI Judge feedback should remain above the fold if possible

---

## Cross-Page Interaction Principles

### Hover Language

All interactive objects should respond with one or more of:

- slight elevation
- border emphasis
- low-opacity accent fill
- icon brightness increase

### Focus States

Keyboard accessibility matters. Focus should use:

- clean cyan outline or glow
- no default browser outline styling

### Transitions Between Pages

Prefer continuity:

- Home to Listing: clean slide/fade
- Listing to Description: content-focused reveal
- Description to Builder: stronger cinematic transition
- Builder to Simulation: most dramatic transformation
- Simulation to Result: calm, rewarding resolution

---

## Accessibility and Usability Notes

- Maintain strong contrast between text and background
- Do not rely on color alone for status meaning
- Keep tap targets large enough on mobile
- Use semantic headings and landmarks
- Ensure builder actions are keyboard reachable where practical
- Motion should not block comprehension

---

## Suggested CSS Token Model

```css
:root {
  --bg-base: #0B0C10;
  --bg-surface: #1F2833;
  --text-primary: #C5C6C7;
  --accent-primary: #66FCF1;
  --accent-secondary: #45A29E;

  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-xl: 24px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 40px;
  --space-8: 48px;
  --space-9: 64px;
}
```

---

## Recommended Frontend Architecture Notes

### Suggested Stack

- React
- TypeScript
- Tailwind CSS or CSS variables + utility layer
- Framer Motion
- React Flow
- Zustand or equivalent lightweight store

### UI Code Organization

```text
src/
  components/
    app/
    cards/
    builder/
    simulation/
    scoring/
    profile/
  pages/
    HomePage
    ProfilePage
    ChallengeListingPage
    ChallengeDescriptionPage
    BuilderPage
    SimulationPage
    ResultPage
  config/
    theme
    games
  store/
  types/
  utils/
```

### State Guidance

Keep these separated:

- app-level navigation state
- player/profile state
- challenge metadata state
- builder graph state
- simulation timeline state
- scoring state

---

## Implementation Priorities

If the team is building fast, prioritize pages in this order:

1. Home Page
2. Challenge Listing Page
3. Challenge Description Page
4. Drag & Drop Builder Page
5. Simulation Page
6. After Challenge Scoring Page
7. Profile Page

If implementation time is limited, spend the most polish budget on:

1. Home
2. Drag & Drop Builder
3. Simulation

These three pages define the product impression.

---

## Final Visual Direction Summary

EngineerVerse should look like:

- a premium engineering arcade
- a modern game launcher for technical minds
- a futuristic system design simulator

It should not look like:

- a course dashboard
- a plain React Flow demo
- a startup analytics panel
- a generic Tailwind template

The emotional sequence across the seven pages should be:

```text
Home -> curiosity
Listing -> discovery
Description -> anticipation
Builder -> control
Simulation -> wow
Result -> reward
Profile -> motivation
```

---

## Direct Build Prompt for Codex

Use this summary if implementing directly from this PRD:

> Build a polished React + TypeScript frontend for EngineerVerse using the seven-page structure described in this PRD. Use the exact design system and color palette defined here: `#0B0C10`, `#1F2833`, `#C5C6C7`, `#66FCF1`, `#45A29E`. The UI should feel like a premium, minimal, futuristic engineering arcade rather than a SaaS dashboard. Implement reusable components, strong motion design, a clean layout system, and responsive behavior. Prioritize the Home Page, Drag & Drop Builder, and Simulation pages as the most visually impressive screens. Use subtle glows, restrained shadows, sharp typography, and cinematic transitions. The Drag & Drop Builder should be designed for React Flow, and the Simulation page should feel like the user's architecture has come alive. The After Challenge Scoring page should feel rewarding and structured, with animated score reveal and AI judge feedback.

