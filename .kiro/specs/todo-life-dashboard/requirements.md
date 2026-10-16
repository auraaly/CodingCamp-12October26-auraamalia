# Requirements Document

## Introduction

The To-Do List Life Dashboard is a client-side web application built with HTML, CSS, and vanilla JavaScript. It helps users organize their day through four core widgets: a time/date greeting, a Pomodoro-style focus timer, a to-do list, and a quick-links panel. All data is persisted in the browser's Local Storage — no backend or build step is required. The app also supports three optional enhancements: a light/dark theme toggle, a custom greeting name, and task sorting.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI section that displays the current time, date, and a personalized greeting message.
- **Timer**: The Pomodoro-style countdown component of the Dashboard.
- **Task_List**: The to-do list component of the Dashboard.
- **Task**: A single to-do item managed by the Task_List.
- **Quick_Links**: The panel that displays user-defined shortcut buttons to external URLs.
- **Link**: A single shortcut entry in the Quick_Links panel.
- **Storage**: The browser's `localStorage` API used to persist all user data.
- **Theme**: The visual color scheme of the Dashboard, either light or dark.
- **User_Name**: An optional name entered by the user to personalise the greeting.

---

## Requirements

### Requirement 1: Time and Date Greeting

**User Story:** As a user, I want to see the current time, date, and a context-aware greeting when I open the Dashboard, so that I am immediately oriented to the current moment of my day.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM format, updating every minute.
2. THE Greeting_Widget SHALL display the current date in a human-readable format (e.g. "Monday, 14 July 2025").
3. WHEN the current hour is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good morning".
4. WHEN the current hour is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good afternoon".
5. WHEN the current hour is between 18:00 and 20:59, THE Greeting_Widget SHALL display the greeting "Good evening".
6. WHEN the current hour is between 21:00 and 04:59, THE Greeting_Widget SHALL display the greeting "Good night".
7. WHERE a User_Name has been saved, THE Greeting_Widget SHALL append the User_Name to the greeting (e.g. "Good morning, Alex").

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a countdown timer I can start, stop, and reset, so that I can work in focused intervals.

#### Acceptance Criteria

1. THE Timer SHALL initialise with a default duration of 25 minutes (1500 seconds).
2. WHEN the user activates the Start control, THE Timer SHALL begin counting down in one-second intervals.
3. WHILE the Timer is counting down, THE Timer SHALL update the displayed minutes and seconds each second.
4. WHEN the user activates the Stop control, THE Timer SHALL pause the countdown at the current remaining time.
5. WHEN the user activates the Reset control, THE Timer SHALL return the displayed time to the initial duration and stop counting down.
6. WHEN the countdown reaches 00:00, THE Timer SHALL stop automatically and display a visual or textual notification to the user.
7. THE Timer SHALL display the remaining time in MM:SS format at all times.

---

### Requirement 3: To-Do List — Add and Display Tasks

**User Story:** As a user, I want to add tasks to a list and see them displayed, so that I can keep track of what I need to do.

#### Acceptance Criteria

1. THE Task_List SHALL provide an input field and an Add control for creating new Tasks.
2. WHEN the user submits a non-empty value through the Add control, THE Task_List SHALL append a new Task with that value to the list.
3. IF the user attempts to submit an empty or whitespace-only value, THEN THE Task_List SHALL reject the input and display an inline validation message.
4. THE Task_List SHALL persist all Tasks to Storage so that Tasks survive a page reload.
5. WHEN the Dashboard loads, THE Task_List SHALL restore all previously saved Tasks from Storage.

---

### Requirement 4: To-Do List — Edit and Delete Tasks

**User Story:** As a user, I want to edit the text of existing tasks and remove tasks I no longer need, so that my list stays accurate.

#### Acceptance Criteria

1. WHEN the user activates the Edit control on a Task, THE Task_List SHALL replace the Task's display text with an editable input field pre-filled with the current task text.
2. WHEN the user confirms an edit, THE Task_List SHALL save the updated text, restore the display view, and persist the change to Storage.
3. WHEN the user activates the Delete control on a Task, THE Task_List SHALL remove that Task from the list and from Storage.

---

### Requirement 5: To-Do List — Mark Tasks Complete

**User Story:** As a user, I want to mark tasks as done, so that I can track my progress through the day.

#### Acceptance Criteria

1. WHEN the user activates the completion control on a Task, THE Task_List SHALL toggle the Task's completion state.
2. WHILE a Task is in the completed state, THE Task_List SHALL apply a visual distinction (e.g. strikethrough text) to that Task.
3. THE Task_List SHALL persist each Task's completion state to Storage so that the state survives a page reload.

---

### Requirement 6: To-Do List — Sort Tasks

**User Story:** As a user, I want to sort my task list, so that I can view tasks in a preferred order.

#### Acceptance Criteria

1. THE Task_List SHALL provide a Sort control that cycles through at least two sort modes: by name (A–Z) and by completion status (incomplete first).
2. WHEN the user activates the Sort control, THE Task_List SHALL reorder the displayed Tasks according to the selected sort mode without altering the persisted order in Storage.
3. WHEN the Dashboard loads, THE Task_List SHALL display Tasks in the order they were last added (insertion order) by default.

---

### Requirement 7: Quick Links — Add and Display Links

**User Story:** As a user, I want to save shortcut buttons to my favourite websites, so that I can navigate to them quickly from the Dashboard.

#### Acceptance Criteria

1. THE Quick_Links panel SHALL provide input fields for a Link label and a URL, and an Add control.
2. WHEN the user submits a non-empty label and a valid URL through the Add control, THE Quick_Links panel SHALL display a new shortcut button for that Link.
3. IF the user submits a missing label or an invalid URL format, THEN THE Quick_Links panel SHALL reject the input and display an inline validation message.
4. WHEN the user activates a Link button, THE Quick_Links panel SHALL open the corresponding URL in a new browser tab.
5. THE Quick_Links panel SHALL persist all Links to Storage so that Links survive a page reload.
6. WHEN the Dashboard loads, THE Quick_Links panel SHALL restore all previously saved Links from Storage.

---

### Requirement 8: Quick Links — Delete Links

**User Story:** As a user, I want to remove quick links I no longer need, so that the panel stays relevant.

#### Acceptance Criteria

1. WHEN the user activates the Delete control on a Link, THE Quick_Links panel SHALL remove that Link from the panel and from Storage.

---

### Requirement 9: Light / Dark Theme Toggle

**User Story:** As a user, I want to switch between a light and dark color scheme, so that I can use the Dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Theme toggle control visible at all times.
2. WHEN the user activates the Theme toggle, THE Dashboard SHALL switch the active Theme between light and dark.
3. THE Dashboard SHALL persist the user's Theme preference to Storage so that the preference survives a page reload.
4. WHEN the Dashboard loads, THE Dashboard SHALL apply the Theme stored in Storage, or default to the system's preferred color scheme if no preference has been stored.

---

### Requirement 10: Custom Greeting Name

**User Story:** As a user, I want to enter my name so that the greeting feels personal.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a control that allows the user to enter or update the User_Name.
2. WHEN the user saves a non-empty User_Name, THE Dashboard SHALL persist the User_Name to Storage and update the Greeting_Widget immediately.
3. IF the user saves an empty value, THEN THE Dashboard SHALL remove the User_Name from Storage and display the greeting without a name.
4. THE Dashboard SHALL restore the User_Name from Storage on load so that the personalised greeting is shown immediately.

---

### Requirement 11: Data Persistence Integrity

**User Story:** As a user, I want my data to be reliably saved and restored, so that I never lose my tasks or links between sessions.

#### Acceptance Criteria

1. THE Storage SHALL serialise all Task and Link data as JSON before writing to localStorage.
2. THE Storage SHALL deserialise JSON data from localStorage on Dashboard load before rendering any Tasks or Links.
3. IF localStorage is unavailable or returns malformed data, THEN THE Dashboard SHALL initialise with an empty Task_List and an empty Quick_Links panel, and display a non-blocking warning message.

---

### Requirement 12: Single-File Structure and Browser Compatibility

**User Story:** As a developer, I want the codebase to follow the defined folder rules and work across modern browsers, so that the app is easy to maintain and deploy.

#### Acceptance Criteria

1. THE Dashboard SHALL use exactly one CSS file located at `css/style.css`.
2. THE Dashboard SHALL use exactly one JavaScript file located at `js/app.js`.
3. THE Dashboard SHALL function correctly in the latest stable releases of Chrome, Firefox, Edge, and Safari without requiring a build step or external dependencies.
