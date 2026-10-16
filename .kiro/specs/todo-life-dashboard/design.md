# Design Document

## Overview

The To-Do List Life Dashboard is a zero-dependency, single-page web application (SPA) built with plain HTML, CSS, and vanilla JavaScript. It runs entirely in the browser with no backend, no build toolchain, and no external libraries. All user data is persisted via the browser's `localStorage` API.

The application is delivered as a single `index.html` entry point that references exactly one stylesheet (`css/style.css`) and one JavaScript module (`js/app.js`). This constraint keeps the codebase shallow and easy to deploy: drop the three files on any static host (or open `index.html` directly in a browser) and it works.

The four core features are:
1. **Greeting Widget** — live clock/date display with a time-aware greeting.
2. **Focus Timer** — Pomodoro-style 25-minute countdown with start/stop/reset.
3. **Task List** — full CRUD task manager with completion toggling and optional sorting.
4. **Quick Links** — bookmark panel that opens links in new tabs.

Three optional enhancements layer on top: a light/dark theme toggle, a custom greeting name, and two task-sort modes. None of these features requires a page reload or server round-trip.

---

## Architecture

The application follows a **Model-View-Controller (MVC)** pattern implemented entirely in `js/app.js`. Because there is no build step, modules are not ES modules in the strict `<script type="module">` sense; instead the file is organized into clearly-separated sections using IIFEs and plain function namespacing to avoid polluting the global scope.

```
┌──────────────────────────────────────────────────────────────────┐
│                         index.html                               │
│  ┌───────────────┐  ┌──────────────────┐  ┌────────────────────┐│
│  │ css/style.css │  │   js/app.js      │  │ localStorage API   ││
│  │               │  │  ┌────────────┐  │  │                    ││
│  │  - CSS vars   │  │  │  Storage   │  │◄─┤  tasks (JSON)      ││
│  │    (themes)   │  │  │  Module    │  │  │  links (JSON)      ││
│  │  - Layout     │  │  └────────────┘  │  │  theme (string)    ││
│  │  - Widgets    │  │  ┌────────────┐  │  │  username (string) ││
│  └───────────────┘  │  │   State    │  │  └────────────────────┘│
│                     │  │  (in-mem)  │  │                        │
│                     │  └────────────┘  │                        │
│                     │  ┌────────────┐  │                        │
│                     │  │Controllers │  │                        │
│                     │  │ (widgets)  │  │                        │
│                     │  └────────────┘  │                        │
│                     │  ┌────────────┐  │                        │
│                     │  │  Renderer  │  │                        │
│                     │  │ (DOM ops)  │  │                        │
│                     │  └────────────┘  │                        │
│                     └──────────────────┘                        │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. On page load, the **Storage Module** reads `localStorage` and populates the **in-memory State**.
2. Each **Widget Controller** reads from State to perform its initial render via the **Renderer**.
3. User interactions (button clicks, form submits) trigger controller handlers, which mutate State and synchronise Storage.
4. After any state mutation, the affected Renderer function is called to update the DOM.

This unidirectional flow keeps state changes predictable: DOM → Controller → State → Storage → Renderer → DOM.

---

## Components and Interfaces

### Storage Module

Responsible for reading and writing all persisted data. Provides a thin wrapper around `localStorage` with JSON serialization/deserialization and graceful error handling.

```
StorageModule
  ├── load(key: string): any | null
  ├── save(key: string, value: any): void
  └── KEYS: { TASKS, LINKS, THEME, USERNAME }
```

- `load` returns `null` on missing key, parse error, or `localStorage` unavailability.
- `save` silently swallows `QuotaExceededError` and other write failures (the application is still functional for the current session).

### Greeting Widget Controller

Manages the clock interval and renders the greeting, date, and time.

```
GreetingController
  ├── init(): void          — starts the 1-minute interval, renders immediately
  ├── render(): void        — updates #greeting-time, #greeting-date, #greeting-text
  └── getGreetingPhrase(hour: number): string
```

### Focus Timer Controller

Manages the Pomodoro countdown.

```
TimerController
  ├── init(): void          — renders initial state (25:00)
  ├── start(): void         — begins 1-second interval
  ├── stop(): void          — clears interval
  ├── reset(): void         — clears interval, resets to DEFAULT_DURATION
  └── render(): void        — updates #timer-display
```

State: `{ remaining: number, running: boolean }` (in-memory only; timer is not persisted).

### Task List Controller

Manages task CRUD, completion toggling, and sorting.

```
TaskController
  ├── init(): void
  ├── addTask(description: string): void
  ├── deleteTask(id: string): void
  ├── editTask(id: string, newDescription: string): void
  ├── toggleComplete(id: string): void
  ├── setSort(mode: SortMode): void
  └── render(): void        — rebuilds the task list DOM
```

### Quick Links Controller

Manages link CRUD and navigation.

```
LinksController
  ├── init(): void
  ├── addLink(label: string, url: string): void
  ├── deleteLink(id: string): void
  └── render(): void
```

### Theme Controller

Manages the `data-theme` attribute on `<html>` and the preference in Storage.

```
ThemeController
  ├── init(): void          — loads saved theme or falls back to prefers-color-scheme
  └── toggle(): void        — flips between "light" and "dark"
```

### Username Controller

Manages the custom greeting name.

```
UsernameController
  ├── init(): void
  ├── save(name: string): void
  └── clear(): void
```

### Renderer (DOM Utilities)

A set of pure, re-usable DOM helper functions that each controller calls. Keeping rendering logic separate from mutation logic makes individual functions testable.

```
Renderer
  ├── renderTaskList(tasks: Task[], sortMode: SortMode, container: Element): void
  ├── renderLinkList(links: Link[], container: Element): void
  ├── renderGreeting(phrase: string, time: string, date: string, username: string | null, container: Element): void
  └── renderTimer(remaining: number, container: Element): void
```

---

## Data Models

### Task

```typescript
interface Task {
  id: string;           // crypto.randomUUID() or Date.now().toString()
  description: string;  // trimmed, non-empty
  completed: boolean;
  createdAt: number;    // Date.now() timestamp — used for insertion-order sort
}
```

Tasks are stored in `localStorage` under the key `"tasks"` as a JSON array.

### Link

```typescript
interface Link {
  id: string;    // crypto.randomUUID() or Date.now().toString()
  label: string; // non-empty display name
  url: string;   // validated with the URL constructor
}
```

Links are stored in `localStorage` under the key `"links"` as a JSON array.

### Theme

Stored as a plain string (`"light"` or `"dark"`) under the key `"theme"`.

### Username

Stored as a plain string under the key `"username"`. Absence of the key means no name is set.

### SortMode (enum-like)

```javascript
const SortMode = {
  INSERTION: 'insertion', // default — ordered by createdAt ascending
  NAME: 'name',           // A–Z by description
  STATUS: 'status',       // incomplete tasks first
};
```

Sort mode is **not** persisted; the list returns to insertion order on each page load.

### AppState (in-memory)

```javascript
const state = {
  tasks: Task[],
  links: Link[],
  theme: 'light' | 'dark',
  username: string | null,
  timer: {
    remaining: number,  // seconds
    running: boolean,
    intervalId: number | null,
  },
  sortMode: SortMode,
};
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Greeting phrase covers all hours

*For any* integer hour in the range [0, 23], `getGreetingPhrase(hour)` shall return exactly one of "Good morning" (hours 5–11), "Good afternoon" (hours 12–17), "Good evening" (hours 18–20), or "Good night" (hours 21–23, 0–4). No hour shall produce an undefined or unexpected phrase.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

### Property 2: Time format is always HH:MM

*For any* `Date` object, `formatTime(date)` shall produce a string that matches the regular expression `^\d{2}:\d{2}$` (zero-padded hours and minutes).

**Validates: Requirements 1.1**

### Property 3: Date format contains all human-readable components

*For any* `Date` object, `formatDate(date)` shall produce a string that contains the full weekday name, the numeric day, the full month name, and the four-digit year.

**Validates: Requirements 1.2**

### Property 4: Greeting with username contains both phrase and name

*For any* greeting phrase string and any non-empty username string, `renderGreeting` shall produce output that contains both the phrase and the username as substrings.

**Validates: Requirements 1.7**

### Property 5: Timer format is always MM:SS

*For any* integer remaining seconds value in the range [0, 1500], `formatTimer(seconds)` shall produce a string matching `^\d{2}:\d{2}$` (zero-padded minutes and seconds).

**Validates: Requirements 2.7**

### Property 6: Reset always returns to default duration

*For any* timer state where `remaining` is between 0 and 1500 seconds (inclusive), calling `reset()` shall set `remaining` to exactly 1500 and set `running` to `false`.

**Validates: Requirements 2.5**

### Property 7: Adding a valid task grows the task list by one

*For any* task array of length N and any non-empty, non-whitespace-only description string, calling `addTask(description)` shall produce a task array of length N + 1 where the last element's `description` equals the trimmed input.

**Validates: Requirements 3.2**

### Property 8: Whitespace-only input is rejected

*For any* string composed entirely of whitespace characters (including the empty string), calling `addTask(input)` shall leave the task array unchanged and shall not produce a new task.

**Validates: Requirements 3.3**

### Property 9: Data storage round-trip preserves objects

*For any* array of `Task` objects or `Link` objects, calling `StorageModule.save(key, array)` followed by `StorageModule.load(key)` shall return an array deeply equal to the original, with all fields (including `id`, `description`, `completed`, `createdAt` for tasks, and `id`, `label`, `url` for links) preserved.

**Validates: Requirements 3.4, 3.5, 7.5, 7.6, 5.3, 11.1, 11.2**

### Property 10: Editing a task updates description in state and storage

*For any* task in the task array and any valid (non-empty) new description string, calling `editTask(id, newDescription)` shall update that task's `description` to the new value both in the in-memory state array and in the value written to Storage.

**Validates: Requirements 4.2**

### Property 11: Deleting an item removes it from state and storage

*For any* non-empty array of tasks (or links) and any item id present in that array, calling `deleteTask(id)` (or `deleteLink(id)`) shall produce an array of length N − 1 that contains no element with the deleted id, and the updated array written to Storage shall also contain no element with the deleted id.

**Validates: Requirements 4.3, 8.1**

### Property 12: Completion toggle is its own inverse

*For any* task, calling `toggleComplete(id)` shall flip `completed` from `false` to `true` or from `true` to `false`. Calling `toggleComplete(id)` twice in succession shall restore `completed` to its original value.

**Validates: Requirements 5.1**

### Property 13: Completed tasks render with a visual-distinction class

*For any* task where `completed` is `true`, the DOM element produced by `renderTaskList` for that task shall contain the CSS class (or `data-` attribute) used to indicate completion (e.g. `completed`).

**Validates: Requirements 5.2**

### Property 14: Sort does not mutate the source array

*For any* task array and any `SortMode`, calling `sortTasks(tasks, mode)` shall return a new array and the original array passed in shall remain unmodified (same length, same element order, same references).

**Validates: Requirements 6.2**

### Property 15: Insertion-order sort preserves createdAt ordering

*For any* array of tasks with distinct `createdAt` timestamps, `sortTasks(tasks, SortMode.INSERTION)` shall return them ordered by `createdAt` ascending (oldest first).

**Validates: Requirements 6.3**

### Property 16: Adding a valid link grows the links array by one

*For any* links array of length N, any non-empty label string, and any URL string parseable by the `URL` constructor, calling `addLink(label, url)` shall produce a links array of length N + 1 where the new element has the correct `label` and `url`.

**Validates: Requirements 7.2**

### Property 17: Invalid link input is rejected

*For any* combination of an empty label string OR a string not parseable as a URL by the `URL` constructor, calling `addLink(label, url)` shall leave the links array unchanged.

**Validates: Requirements 7.3**

### Property 18: Theme toggle is its own inverse

*For any* active theme value (`"light"` or `"dark"`), calling `ThemeController.toggle()` shall set the theme to the opposite value. Calling `toggle()` twice shall restore the original theme.

**Validates: Requirements 9.2**

### Property 19: Saving a username makes it appear in the rendered greeting

*For any* non-empty username string, calling `UsernameController.save(name)` shall cause the subsequent `renderGreeting` output to contain the username as a substring.

**Validates: Requirements 10.2**

---

## Error Handling

### localStorage Unavailability

If `localStorage` throws on access (e.g. in private-browsing mode with storage blocked, or in some embedded contexts), the Storage Module catches the exception and returns `null` from `load` / silently no-ops on `save`. The app renders with an empty task list and empty links panel. A non-blocking banner or inline message informs the user that persistence is unavailable.

### Malformed JSON in localStorage

If `JSON.parse` throws when reading a stored key, the Storage Module catches the `SyntaxError`, logs it to `console.error`, and returns `null`. The calling controller treats `null` as an empty initial dataset.

### Invalid URL Validation

Before accepting a new link, the Links Controller attempts `new URL(rawInput)`. If the constructor throws, the input is rejected and an inline error message is shown beneath the URL field.

### Empty / Whitespace Task Input

The Task Controller trims the input value and checks `trimmed.length === 0`. If true, an inline validation message ("Task cannot be empty") is shown and no task is created.

### Timer Underflow Guard

The timer's countdown interval checks `remaining > 0` before decrementing. When `remaining` reaches 0 the interval is cleared, preventing the displayed value from going negative.

---

## Testing Strategy

### Approach

This project uses **two complementary testing layers**:

1. **Unit / example-based tests** — verify concrete behaviors, UI structure, and edge cases.
2. **Property-based tests** — verify universal correctness properties (see §Correctness Properties) across many randomly generated inputs.

Because all application logic lives in pure (or easily mockable) JavaScript functions with no build step, both test layers can be run directly with a JavaScript test runner such as **Vitest** (or Jest). For property-based testing, **fast-check** is the recommended library for JavaScript/TypeScript.

### Property-Based Testing Setup

- Library: **fast-check** (npm package `fast-check`)
- Each property test must run a **minimum of 100 iterations** (fast-check default is 100; increase via `numRuns` if coverage gaps are found).
- Each property test must include a comment referencing its design property in the format:
  `// Feature: todo-life-dashboard, Property N: <property title>`

### Unit Tests

Unit tests cover:

- **Structural checks** (Requirements 3.1, 7.1, 9.1, 10.1, 12.1, 12.2): verify DOM elements exist and the correct files are present.
- **Timer initialization** (Requirement 2.1): assert initial state is 1500 seconds.
- **Timer start/stop/countdown** (Requirements 2.2, 2.3, 2.4): use fake timers (`vi.useFakeTimers`) to advance time and verify state.
- **Timer expiry notification** (Requirement 2.6): advance timer to 0 and verify notification is rendered.
- **Edit mode activation** (Requirement 4.1): simulate edit click, verify input field appears pre-filled.
- **Sort control cycling** (Requirement 6.1): simulate sort button clicks, verify mode cycles.
- **Link opens new tab** (Requirement 7.4): mock `window.open`, verify called with correct URL and `'_blank'`.
- **Theme default loading** (Requirement 9.4): test both paths — stored preference and `prefers-color-scheme` fallback.
- **Username empty clears storage** (Requirement 10.3): save empty string, verify key absent.
- **localStorage unavailable / malformed data** (Requirement 11.3): mock `localStorage` to throw or return bad JSON, verify empty state + warning.

### Property Tests

Each Correctness Property listed above maps to exactly **one** property test:

| Property | fast-check Arbitraries |
|---|---|
| P1 — Greeting phrase | `fc.integer({ min: 0, max: 23 })` |
| P2 — Time format | `fc.date()` |
| P3 — Date format | `fc.date()` |
| P4 — Greeting with username | `fc.string()` (phrase) × `fc.string({ minLength: 1 })` (name) |
| P5 — Timer format | `fc.integer({ min: 0, max: 1500 })` |
| P6 — Reset restores duration | `fc.integer({ min: 0, max: 1500 })` |
| P7 — Add valid task | `fc.array(taskArbitrary)` × `fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)` |
| P8 — Whitespace input rejected | `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` |
| P9 — Storage round-trip | `fc.array(taskArbitrary)` and `fc.array(linkArbitrary)` |
| P10 — Edit updates task | `taskArbitrary` × `fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)` |
| P11 — Delete removes item | `fc.array(taskArbitrary, { minLength: 1 })` |
| P12 — Toggle is inverse | `taskArbitrary` |
| P13 — Completed class rendered | `taskArbitrary.map(t => ({ ...t, completed: true }))` |
| P14 — Sort no mutation | `fc.array(taskArbitrary)` × `fc.constantFrom(...Object.values(SortMode))` |
| P15 — Insertion order | `fc.array(taskArbitrary)` with distinct `createdAt` |
| P16 — Add valid link | `fc.array(linkArbitrary)` × `fc.string({ minLength: 1 })` × valid URL arbitrary |
| P17 — Invalid link rejected | empty label OR invalid URL string |
| P18 — Theme toggle inverse | `fc.constantFrom('light', 'dark')` |
| P19 — Username in greeting | `fc.string({ minLength: 1 })` |

### Cross-Browser Compatibility

Manual smoke testing in the latest stable versions of Chrome, Firefox, Edge, and Safari is required before each release. No automated cross-browser suite is prescribed (Requirement 12.3).
