'use strict';
const STORAGE_KEY = 'studysprint-tasks-v1';
let tasks = [];
try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); if (Array.isArray(saved)) tasks = saved.filter(t => t && typeof t.id === 'string' && typeof t.title === 'string'); } catch { tasks = []; }
let filter = 'all';
const taskForm = document.querySelector('#task-form');
const taskList = document.querySelector('#task-list');
const emptyState = document.querySelector('#empty-state');
const taskMessage = document.querySelector('#task-message');
const dateField = document.querySelector('#task-date');
function localISODate(d = new Date()) { const offset = d.getTimezoneOffset() * 60000; return new Date(d.getTime() - offset).toISOString().slice(0, 10); }
dateField.value = localISODate();
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch { taskMessage.textContent = 'Storage unavailable: changes may not be saved.'; } }
function makeEl(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; }
function render() {
  taskList.replaceChildren();
  const visible = tasks.filter(task => filter === 'all' || (filter === 'done' ? task.done : !task.done));
  visible.forEach(task => {
    const li = makeEl('li', 'task-row' + (task.done ? ' done' : ''));
    const checkbox = makeEl('input'); checkbox.type = 'checkbox'; checkbox.checked = !!task.done; checkbox.setAttribute('aria-label', 'Mark ' + task.title + ' completed');
    checkbox.addEventListener('change', () => { task.done = checkbox.checked; save(); render(); });
    const body = makeEl('div', 'task-body'); body.append(makeEl('div', 'task-title', task.title), makeEl('div', 'task-meta', task.subject + ' · ' + task.date));
    const del = makeEl('button', 'delete-button', '×'); del.type = 'button'; del.setAttribute('aria-label', 'Delete ' + task.title);
    del.addEventListener('click', () => { tasks = tasks.filter(t => t.id !== task.id); save(); render(); });
    li.append(checkbox, body, del); taskList.append(li);
  });
  emptyState.hidden = visible.length !== 0;
  const done = tasks.filter(t => t.done).length, total = tasks.length, rate = total ? Math.round((done / total) * 100) : 0;
  document.querySelector('#task-subtitle').textContent = `${total} task${total === 1 ? '' : 's'} in your plan`;
  document.querySelector('#total-count').textContent = total;
  document.querySelector('#done-count').textContent = done;
  document.querySelector('#remaining-count').textContent = total - done;
  document.querySelector('#completion-rate').textContent = rate + '%';
  document.querySelector('#completion-bar').style.width = rate + '%';
}
taskForm.addEventListener('submit', e => {
  e.preventDefault(); const title = document.querySelector('#task-name').value.trim();
  if (!title) { taskMessage.textContent = 'Enter a task name.'; return; }
  tasks.unshift({id: (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`), title: title.slice(0,100), subject: document.querySelector('#task-subject').value, date: dateField.value || localISODate(), done:false});
  save(); taskForm.reset(); dateField.value = localISODate(); taskMessage.textContent = 'Task added! You’ve got this ✨'; render();
});
document.querySelector('#clear-completed').addEventListener('click', () => { if (!tasks.some(t => t.done)) { taskMessage.textContent = 'No completed tasks to clear.'; return; } tasks = tasks.filter(t => !t.done); save(); render(); });
document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', () => { filter = btn.dataset.filter; document.querySelectorAll('.filter').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); }); render(); }));
render();
let durationSeconds = 25 * 60, remainingSeconds = durationSeconds, running = false, endAt = 0, timerInterval = null;
const timerDisplay = document.querySelector('#timer-display'), timerStatus = document.querySelector('#timer-status'), startButton = document.querySelector('#timer-start');
function showTime() { const m = String(Math.floor(remainingSeconds/60)).padStart(2,'0'); const s = String(remainingSeconds%60).padStart(2,'0'); timerDisplay.textContent = `${m}:${s}`; document.title = running ? `${m}:${s} • StudySprint` : 'StudySprint | Free Study Planner, Pomodoro Timer & Task Tracker'; }
function stopTimer() { running = false; if (timerInterval !== null) clearInterval(timerInterval); timerInterval = null; startButton.textContent = 'Start focus'; showTime(); }
function tick() { remainingSeconds = Math.max(0, Math.ceil((endAt - Date.now())/1000)); showTime(); if (remainingSeconds === 0) { stopTimer(); timerStatus.textContent = 'Session complete! Great job 🎉'; } }
startButton.addEventListener('click', () => { if (running) { tick(); stopTimer(); timerStatus.textContent = 'Paused. Resume when ready.'; } else { if (remainingSeconds === 0) remainingSeconds = durationSeconds; endAt = Date.now() + remainingSeconds*1000; running = true; startButton.textContent = 'Pause'; timerStatus.textContent = 'One step at a time. You’ve got this!'; timerInterval = setInterval(tick, 250); showTime(); } });
document.querySelector('#timer-reset').addEventListener('click', () => { stopTimer(); remainingSeconds = durationSeconds; timerStatus.textContent = 'Ready when you are.'; showTime(); });
document.querySelectorAll('.timer-tab').forEach(tab => tab.addEventListener('click', () => { stopTimer(); durationSeconds = Number(tab.dataset.minutes)*60; remainingSeconds = durationSeconds; document.querySelectorAll('.timer-tab').forEach(b => { b.classList.toggle('selected', b === tab); b.setAttribute('aria-pressed', b === tab ? 'true' : 'false'); }); timerStatus.textContent = durationSeconds === 300 ? 'Time for a well-earned break.' : 'Ready when you are.'; showTime(); }));
document.querySelector('#year').textContent = new Date().getFullYear();
