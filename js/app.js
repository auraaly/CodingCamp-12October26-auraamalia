/**
 * Life Dashboard
 * js/app.js — Single-file vanilla JS, no build step required.
 */
(function () {
  'use strict';

  /* ============================================================
     Constants
     ============================================================ */

  var SortMode = {
    INSERTION: 'insertion',
    NAME:      'name',
    STATUS:    'status',
  };

  // Ring circumference for r=85: 2 * Math.PI * 85 ≈ 534
  var RING_CIRCUMFERENCE = 534;

  /* ============================================================
     In-Memory State
     ============================================================ */

  var state = {
    tasks:           [],
    links:           [],
    theme:           'dark',
    username:        null,
    sortMode:        SortMode.INSERTION,
    timerDuration:   1500,   // seconds (default 25 min)
    timer: {
      remaining:   1500,
      running:     false,
      intervalId:  null,
    },
  };

  /* ============================================================
     Helpers
     ============================================================ */

  function formatTime(date) {
    return String(date.getHours()).padStart(2, '0') + ':' +
           String(date.getMinutes()).padStart(2, '0') + ':' +
           String(date.getSeconds()).padStart(2, '0');
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month:   'long',
      day:     'numeric',
      year:    'numeric',
    });
  }

  function getGreetingPhrase(hour) {
    if (hour >= 5 && hour <= 11)  return 'Good morning';
    if (hour >= 12 && hour <= 17) return 'Good afternoon';
    if (hour >= 18 && hour <= 20) return 'Good evening';
    return 'Good night';
  }

  function formatTimer(seconds) {
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' +
           String(seconds % 60).padStart(2, '0');
  }

  function sortTasks(tasks, mode) {
    var copy = tasks.slice();
    if (mode === SortMode.NAME) {
      copy.sort(function (a, b) {
        return a.description.toLowerCase().localeCompare(b.description.toLowerCase());
      });
    } else if (mode === SortMode.STATUS) {
      copy.sort(function (a, b) {
        return a.completed === b.completed ? 0 : a.completed ? 1 : -1;
      });
    } else {
      copy.sort(function (a, b) { return a.createdAt - b.createdAt; });
    }
    return copy;
  }

  /* ============================================================
     Storage Module
     ============================================================ */

  var StorageModule = (function () {
    var KEYS = {
      TASKS:    'tasks',
      LINKS:    'links',
      THEME:    'theme',
      USERNAME: 'username',
      DURATION: 'timerDuration',
    };

    function load(key) {
      var raw;
      try { raw = localStorage.getItem(key); } catch (e) { return null; }
      if (raw === null) return null;
      try { return JSON.parse(raw); } catch (e) { return null; }
    }

    function save(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    }

    return { KEYS: KEYS, load: load, save: save };
  })();

  /* ============================================================
     Renderer
     ============================================================ */

  var Renderer = (function () {

    function renderGreeting(phrase, time, date, username) {
      var textEl = document.getElementById('greeting-text');
      var timeEl = document.getElementById('greeting-time');
      var dateEl = document.getElementById('greeting-date');
      if (textEl) textEl.textContent = phrase + (username ? ', ' + username + '!' : '!');
      if (timeEl) timeEl.textContent = time;
      if (dateEl) dateEl.textContent = date;
    }

    function renderTimer(remaining, duration) {
      var displayEl  = document.getElementById('timer-display');
      var progressEl = document.getElementById('timer-ring-progress');

      if (displayEl) displayEl.textContent = formatTimer(remaining);

      if (progressEl && duration > 0) {
        var ratio  = remaining / duration;
        var offset = RING_CIRCUMFERENCE * (1 - ratio);
        progressEl.style.strokeDashoffset = offset;
      }
    }

    function renderTaskList(tasks, sortMode, container) {
      container.innerHTML = '';
      var sorted = sortTasks(tasks, sortMode);

      if (sorted.length === 0) {
        var empty = document.createElement('li');
        empty.style.cssText = 'text-align:center;padding:1.5rem;color:var(--text-subtle);font-size:0.85rem;';
        empty.textContent = 'No tasks yet — add one above!';
        container.appendChild(empty);
        return;
      }

      sorted.forEach(function (task) {
        var li = document.createElement('li');
        li.className = 'task-item' + (task.completed ? ' completed' : '');

        // Checkbox
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-item__checkbox';
        checkbox.checked = task.completed;
        checkbox.setAttribute('data-id', task.id);
        checkbox.setAttribute('aria-label', 'Mark "' + task.description + '" as ' + (task.completed ? 'incomplete' : 'complete'));

        // Text
        var span = document.createElement('span');
        span.className = 'task-item__text';
        span.textContent = task.description;

        // Actions
        var actions = document.createElement('div');
        actions.className = 'task-item__actions';

        var editBtn = document.createElement('button');
        editBtn.className = 'btn btn--ghost btn--sm';
        editBtn.setAttribute('data-id', task.id);
        editBtn.setAttribute('aria-label', 'Edit task');
        editBtn.textContent = '✏';

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn--danger btn--sm';
        deleteBtn.setAttribute('data-id', task.id);
        deleteBtn.setAttribute('aria-label', 'Delete task');
        deleteBtn.textContent = '✕';

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(actions);
        container.appendChild(li);
      });
    }

    function renderLinkList(links, container) {
      container.innerHTML = '';
      if (!links || links.length === 0) {
        var empty = document.createElement('p');
        empty.style.cssText = 'color:var(--text-subtle);font-size:0.82rem;';
        empty.textContent = 'No links yet — add your favourites above!';
        container.appendChild(empty);
        return;
      }
      links.forEach(function (link) {
        var div = document.createElement('div');
        div.className = 'link-item';

        var btn = document.createElement('button');
        btn.className = 'link-item__btn';
        btn.setAttribute('data-url', link.url);
        btn.setAttribute('aria-label', 'Open ' + link.label);
        btn.textContent = '🔗 ' + link.label;
        btn.addEventListener('click', function () { window.open(link.url, '_blank', 'noopener'); });

        var del = document.createElement('button');
        del.className = 'link-item__delete';
        del.setAttribute('data-id', link.id);
        del.setAttribute('aria-label', 'Remove ' + link.label);
        del.textContent = '✕';

        div.appendChild(btn);
        div.appendChild(del);
        container.appendChild(div);
      });
    }

    return {
      renderGreeting:  renderGreeting,
      renderTimer:     renderTimer,
      renderTaskList:  renderTaskList,
      renderLinkList:  renderLinkList,
    };
  })();

  /* ============================================================
     Greeting Controller
     ============================================================ */

  var GreetingController = (function () {
    var _intervalId = null;

    function init() {
      render();
      _intervalId = setInterval(render, 1000);
    }

    function render() {
      var now = new Date();
      Renderer.renderGreeting(
        getGreetingPhrase(now.getHours()),
        formatTime(now),
        formatDate(now),
        state.username
      );
    }

    return { init: init, render: render };
  })();

  /* ============================================================
     Timer Controller
     ============================================================ */

  var TimerController = (function () {

    // States: 'idle' | 'running' | 'paused'
    var _timerState = 'idle';

    function init() {
      render();
      _updateButtons();
    }

    function start() {
      if (_timerState === 'running') return;
      if (state.timer.remaining === 0) {
        state.timer.remaining = state.timerDuration;
      }
      _timerState = 'running';
      _hideNotification();

      var id = setInterval(function () {
        if (state.timer.remaining > 0) {
          state.timer.remaining -= 1;
          render();
        } else {
          clearInterval(state.timer.intervalId);
          state.timer.intervalId = null;
          _timerState = 'idle';
          render();
          _updateButtons();
          _showNotification("⏰ Time's up! Great work — take a break.");
        }
      }, 1000);

      state.timer.running    = true;
      state.timer.intervalId = id;
      _updateButtons();
    }

    function pause() {
      if (_timerState !== 'running') return;
      if (state.timer.intervalId) clearInterval(state.timer.intervalId);
      state.timer.intervalId = null;
      state.timer.running    = false;
      _timerState = 'paused';
      _updateButtons();
    }

    function stop() {
      if (state.timer.intervalId) clearInterval(state.timer.intervalId);
      state.timer.intervalId = null;
      state.timer.running    = false;
      _timerState = 'idle';
      state.timer.remaining  = state.timerDuration;
      _hideNotification();
      render();
      _updateButtons();
    }

    function reset() {
      stop();
    }

    /* Challenge 3 — Change Pomodoro time */
    function setDuration(minutes) {
      var mins    = parseInt(minutes, 10);
      var errorEl = document.getElementById('timer-duration-error');

      if (isNaN(mins) || mins < 1 || mins > 120) {
        if (errorEl) { errorEl.textContent = 'Please enter a number between 1 and 120.'; errorEl.hidden = false; }
        return;
      }
      if (errorEl) errorEl.hidden = true;

      stop();
      state.timerDuration       = mins * 60;
      state.timer.remaining     = mins * 60;
      StorageModule.save(StorageModule.KEYS.DURATION, state.timerDuration);

      var details = document.getElementById('timer-settings-details');
      if (details) details.open = false;

      render();
      _updateButtons();
    }

    function render() {
      Renderer.renderTimer(state.timer.remaining, state.timerDuration);
    }

    function _updateButtons() {
      var btnStart = document.getElementById('timer-start');
      var btnPause = document.getElementById('timer-pause');
      var btnStop  = document.getElementById('timer-stop');
      var btnReset = document.getElementById('timer-reset');

      // Clear all glow classes first
      [btnStart, btnPause, btnStop, btnReset].forEach(function (btn) {
        if (btn) btn.classList.remove('is-active');
      });

      if (_timerState === 'idle') {
        if (btnStart) { btnStart.disabled = false; btnStart.textContent = '▶ Start';  }
        if (btnPause) { btnPause.disabled = true;  btnPause.textContent = '⏸ Pause';  }
        if (btnStop)  { btnStop.disabled  = true;  btnStop.textContent  = '⏹ Stop';   }
        if (btnReset) { btnReset.disabled = false; btnReset.textContent = '↺ Reset';  }

      } else if (_timerState === 'running') {
        if (btnStart) { btnStart.disabled = true;  btnStart.textContent = '▶ Start';  btnStart.classList.add('is-active'); }
        if (btnPause) { btnPause.disabled = false; btnPause.textContent = '⏸ Pause';  }
        if (btnStop)  { btnStop.disabled  = false; btnStop.textContent  = '⏹ Stop';   }
        if (btnReset) { btnReset.disabled = false; btnReset.textContent = '↺ Reset';  }

      } else if (_timerState === 'paused') {
        if (btnStart) { btnStart.disabled = false; btnStart.textContent = '▶ Resume'; }
        if (btnPause) { btnPause.disabled = true;  btnPause.textContent = '⏸ Paused'; btnPause.classList.add('is-active'); }
        if (btnStop)  { btnStop.disabled  = false; btnStop.textContent  = '⏹ Stop';   }
        if (btnReset) { btnReset.disabled = false; btnReset.textContent = '↺ Reset';  }
      }
    }

    function _showNotification(msg) {
      var el = document.getElementById('timer-notification');
      if (el) { el.textContent = msg; el.hidden = false; }
    }

    function _hideNotification() {
      var el = document.getElementById('timer-notification');
      if (el) el.hidden = true;
    }

    return { init: init, start: start, pause: pause, stop: stop, reset: reset, setDuration: setDuration, render: render };
  })();


  /* ============================================================
     Task Controller
     ============================================================ */

  var TaskController = (function () {

    function init() {
      var saved = StorageModule.load(StorageModule.KEYS.TASKS);
      if (Array.isArray(saved)) state.tasks = saved;
      render();
    }

    /* Challenge 4 — Prevent duplicate tasks */
    function _isDuplicate(description) {
      var lower = description.toLowerCase();
      return state.tasks.some(function (t) {
        return t.description.toLowerCase() === lower;
      });
    }

    function addTask(description) {
      var trimmed = description.trim();
      var errorEl = document.getElementById('task-error');

      if (trimmed.length === 0) {
        _showError(errorEl, 'Task cannot be empty.');
        return;
      }

      if (_isDuplicate(trimmed)) {
        _showError(errorEl, '⚠ "' + trimmed + '" already exists in your list.');
        return;
      }

      _hideError(errorEl);

      var task = {
        id:          Date.now().toString(),
        description: trimmed,
        completed:   false,
        createdAt:   Date.now(),
      };

      state.tasks.push(task);
      StorageModule.save(StorageModule.KEYS.TASKS, state.tasks);
      render();
    }

    function deleteTask(id) {
      state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
      StorageModule.save(StorageModule.KEYS.TASKS, state.tasks);
      render();
    }

    function editTask(id, newDescription) {
      var trimmed = newDescription.trim();
      if (trimmed.length === 0) return;
      state.tasks.forEach(function (t) {
        if (t.id === id) t.description = trimmed;
      });
      StorageModule.save(StorageModule.KEYS.TASKS, state.tasks);
      render();
    }

    function toggleComplete(id) {
      state.tasks.forEach(function (t) {
        if (t.id === id) t.completed = !t.completed;
      });
      StorageModule.save(StorageModule.KEYS.TASKS, state.tasks);
      render();
    }

    function setSort(mode) {
      state.sortMode = mode;
      var btn = document.getElementById('task-sort');
      if (btn) {
        var labels = {};
        labels[SortMode.INSERTION] = '↕ Default';
        labels[SortMode.NAME]      = '↕ A–Z';
        labels[SortMode.STATUS]    = '↕ Status';
        btn.textContent = labels[mode] || '↕ Default';
      }
      render();
    }

    function render() {
      var container = document.getElementById('task-list');
      if (container) Renderer.renderTaskList(state.tasks, state.sortMode, container);
    }

    function _activateEditMode(id) {
      var container = document.getElementById('task-list');
      if (!container) return;
      var checkbox = container.querySelector('input[data-id="' + id + '"]');
      if (!checkbox) return;
      var li   = checkbox.parentElement;
      var span = li && li.querySelector('.task-item__text');
      var task = state.tasks.filter(function (t) { return t.id === id; })[0];
      if (!span || !task) return;

      var input = document.createElement('input');
      input.className = 'task-item__edit-input';
      input.value = task.description;
      li.replaceChild(input, span);
      input.focus();

      var actions = li.querySelector('.task-item__actions');
      if (actions) {
        var editBtn = actions.querySelector('.btn--ghost[data-id="' + id + '"]');
        if (editBtn) {
          var saveBtn = document.createElement('button');
          saveBtn.className = 'btn btn--primary btn--sm save-edit';
          saveBtn.setAttribute('data-id', id);
          saveBtn.setAttribute('aria-label', 'Save edit');
          saveBtn.textContent = '✓';
          actions.replaceChild(saveBtn, editBtn);
        }
      }
    }

    function _showError(el, msg) {
      if (el) { el.textContent = msg; el.hidden = false; }
    }

    function _hideError(el) {
      if (el) el.hidden = true;
    }

    return {
      init:              init,
      addTask:           addTask,
      deleteTask:        deleteTask,
      editTask:          editTask,
      toggleComplete:    toggleComplete,
      setSort:           setSort,
      render:            render,
      _activateEditMode: _activateEditMode,
    };
  })();

  /* ============================================================
     Links Controller
     ============================================================ */

  var LinksController = (function () {

    function init() {
      var saved = StorageModule.load(StorageModule.KEYS.LINKS);
      if (Array.isArray(saved)) state.links = saved;
      render();
    }

    function addLink(label, url) {
      var trimmedLabel = label.trim();
      var trimmedUrl   = url.trim();
      var errorEl = document.getElementById('link-error');

      if (trimmedLabel.length === 0) {
        if (errorEl) { errorEl.textContent = 'Label is required.'; errorEl.hidden = false; }
        return;
      }

      try { new URL(trimmedUrl); } catch (e) {
        if (errorEl) { errorEl.textContent = 'Please enter a valid URL (e.g. https://example.com)'; errorEl.hidden = false; }
        return;
      }

      if (errorEl) errorEl.hidden = true;

      state.links.push({ id: Date.now().toString(), label: trimmedLabel, url: trimmedUrl });
      StorageModule.save(StorageModule.KEYS.LINKS, state.links);
      render();
    }

    function deleteLink(id) {
      state.links = state.links.filter(function (l) { return l.id !== id; });
      StorageModule.save(StorageModule.KEYS.LINKS, state.links);
      render();
    }

    function render() {
      var container = document.getElementById('links-list');
      if (container) Renderer.renderLinkList(state.links, container);
    }

    return { init: init, addLink: addLink, deleteLink: deleteLink, render: render };
  })();

  /* ============================================================
     Theme Controller — Challenge 1
     ============================================================ */

  var ThemeController = (function () {

    function init() {
      var saved = StorageModule.load(StorageModule.KEYS.THEME);
      if (saved === 'light' || saved === 'dark') {
        state.theme = saved;
      } else {
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        state.theme = prefersDark ? 'dark' : 'light';
      }
      _apply();
    }

    function toggle() {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      StorageModule.save(StorageModule.KEYS.THEME, state.theme);
      _apply();
    }

    function _apply() {
      document.documentElement.setAttribute('data-theme', state.theme);
      var icon  = document.getElementById('theme-icon');
      var label = document.getElementById('theme-label');
      if (icon)  icon.textContent  = state.theme === 'dark' ? '☀️' : '🌙';
      if (label) label.textContent = state.theme === 'dark' ? 'Light' : 'Dark';
    }

    return { init: init, toggle: toggle };
  })();

  /* ============================================================
     Username Controller — Challenge 2
     ============================================================ */

  var UsernameController = (function () {

    function init() {
      var saved = StorageModule.load(StorageModule.KEYS.USERNAME);
      if (typeof saved === 'string' && saved.length > 0) {
        state.username = saved;
        var input = document.getElementById('username-input');
        if (input) input.value = saved;
      }
    }

    function save(name) {
      var trimmed = name.trim();
      if (trimmed.length > 0) {
        state.username = trimmed;
        StorageModule.save(StorageModule.KEYS.USERNAME, trimmed);
      } else {
        state.username = null;
        try { localStorage.removeItem(StorageModule.KEYS.USERNAME); } catch (e) {}
      }
      GreetingController.render();
    }

    return { init: init, save: save };
  })();

  /* ============================================================
     Event Bindings
     ============================================================ */

  function _bindEvents() {

    // Theme toggle
    var themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', function () { ThemeController.toggle(); });
    }

    // Username form (Challenge 2)
    var usernameForm = document.getElementById('username-form');
    if (usernameForm) {
      usernameForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = document.getElementById('username-input');
        UsernameController.save(input ? input.value : '');
      });
    }

    // Timer controls
    var timerStart = document.getElementById('timer-start');
    var timerPause = document.getElementById('timer-pause');
    var timerStop  = document.getElementById('timer-stop');
    var timerReset = document.getElementById('timer-reset');
    if (timerStart) timerStart.addEventListener('click', function () { TimerController.start(); });
    if (timerPause) timerPause.addEventListener('click', function () { TimerController.pause(); });
    if (timerStop)  timerStop.addEventListener('click',  function () { TimerController.stop();  });
    if (timerReset) timerReset.addEventListener('click', function () { TimerController.reset(); });

    // Custom Pomodoro duration (Challenge 3)
    var durationForm = document.getElementById('timer-duration-form');
    if (durationForm) {
      durationForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = document.getElementById('timer-duration-input');
        var val   = input ? input.value : '';
        TimerController.setDuration(val);
        if (input) input.value = '';
      });
    }

    // Task form
    var taskForm  = document.getElementById('task-form');
    var taskInput = document.getElementById('task-input');
    if (taskForm) {
      taskForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var prev = state.tasks.length;
        TaskController.addTask(taskInput ? taskInput.value : '');
        var errorEl = document.getElementById('task-error');
        if (taskInput && errorEl && errorEl.hidden && state.tasks.length > prev) {
          taskInput.value = '';
        }
      });
    }

    // Task list — event delegation
    var taskList = document.getElementById('task-list');
    if (taskList) {
      taskList.addEventListener('click', function (e) {
        var target = e.target;
        var id = target.getAttribute('data-id');

        if (target.classList.contains('save-edit')) {
          var li = target.closest ? target.closest('.task-item') : target.parentElement.parentElement;
          var editInput = li ? li.querySelector('.task-item__edit-input') : null;
          if (editInput && id) TaskController.editTask(id, editInput.value);
        } else if (target.classList.contains('btn--ghost') && id) {
          TaskController._activateEditMode(id);
        } else if (target.classList.contains('btn--danger') && id) {
          TaskController.deleteTask(id);
        }
      });

      taskList.addEventListener('change', function (e) {
        if (e.target.classList.contains('task-item__checkbox')) {
          TaskController.toggleComplete(e.target.getAttribute('data-id'));
        }
      });

      // Allow pressing Enter to save inline edit
      taskList.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.classList.contains('task-item__edit-input')) {
          e.preventDefault();
          var id = e.target.closest('.task-item').querySelector('.save-edit');
          if (id) id.click();
        }
      });
    }

    // Sort button — Challenge 5
    var sortBtn = document.getElementById('task-sort');
    if (sortBtn) {
      sortBtn.addEventListener('click', function () {
        var modes = [SortMode.INSERTION, SortMode.NAME, SortMode.STATUS];
        var idx   = modes.indexOf(state.sortMode);
        TaskController.setSort(modes[(idx + 1) % modes.length]);
      });
    }

    // Quick links form
    var linksForm      = document.getElementById('links-form');
    var linkLabelInput = document.getElementById('link-label-input');
    var linkUrlInput   = document.getElementById('link-url-input');
    if (linksForm) {
      linksForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var prevLen = state.links.length;
        LinksController.addLink(
          linkLabelInput ? linkLabelInput.value : '',
          linkUrlInput   ? linkUrlInput.value   : ''
        );
        // Clear inputs only when a link was actually added
        if (state.links.length > prevLen) {
          if (linkLabelInput) linkLabelInput.value = '';
          if (linkUrlInput)   linkUrlInput.value   = '';
        }
      });
    }

    // Quick links — delete via delegation
    var linksList = document.getElementById('links-list');
    if (linksList) {
      linksList.addEventListener('click', function (e) {
        if (e.target.classList.contains('link-item__delete')) {
          LinksController.deleteLink(e.target.getAttribute('data-id'));
        }
      });
    }
  }

  /* ============================================================
     App Init
     ============================================================ */

  function init() {
    // Check localStorage availability
    try {
      localStorage.setItem('__ls_test__', '1');
      localStorage.removeItem('__ls_test__');
    } catch (e) {
      var warn = document.getElementById('storage-warning');
      if (warn) warn.hidden = false;
    }

    // Load saved timer duration (Challenge 3)
    var savedDuration = StorageModule.load(StorageModule.KEYS.DURATION);
    if (typeof savedDuration === 'number' && savedDuration >= 60 && savedDuration <= 7200) {
      state.timerDuration        = savedDuration;
      state.timer.remaining      = savedDuration;
    }

    ThemeController.init();
    UsernameController.init();
    GreetingController.init();
    TimerController.init();
    TaskController.init();
    LinksController.init();
    _bindEvents();
  }

  document.addEventListener('DOMContentLoaded', init);

})();
