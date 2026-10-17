'use strict';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const taskContent = {
  drawer: {
    name: 'Drawer manipulation', category: 'SEQUENTIAL MANIPULATION', success: 18,
    description: 'Open the drawer, transfer the red block inside, and close it. The handle faces away from the camera, making contact localization important.',
    challenge: 'Visually occluded handle and multi-stage interaction.',
    camera: ['drawer-02', 'drawer-01', 'drawer-03'],
    tactile: ['drawer-contact-01', 'drawer-contact-02', 'drawer-contact-03']
  },
  pouring: {
    name: 'Glass-to-glass pouring', category: 'FRAGILE OBJECT INTERACTION', success: 21,
    description: 'Grasp a glass and pour its contents into a second glass. Transparent surfaces impair depth sensing, while fragile glass demands careful contact force.',
    challenge: 'Unreliable depth observations and force-sensitive grasping.',
    camera: ['pouring-02', 'pouring-01'], tactile: ['pouring-contact-01']
  },
  plug: {
    name: 'Plug insertion', category: 'PRECISE CONTACT ALIGNMENT', success: 9,
    description: 'Insert a plug into a socket with small openings. Vision supplies coarse localization; distributed touch helps guide contact alignment and insertion.',
    challenge: 'Small contact interfaces and tight insertion alignment.',
    camera: ['plug-01'], tactile: ['plug-contact-02', 'plug-contact-01']
  },
  pick: {
    name: 'Pick-and-place', category: 'MANIPULATION UNDER OCCLUSION', success: 15,
    description: 'Grasp the small red block and place it inside a box. The dexterous hand can occlude the block during grasping, limiting visual feedback.',
    challenge: 'Object occlusion during grasping and transfer.',
    camera: ['pick-place-01'], tactile: ['pick-place-contact-01']
  }
};
let activeTask = 'drawer';
let heroPaused = reducedMotion.matches;
let simPaused = reducedMotion.matches;
const inView = new WeakSet();

function loadVideo(video) {
  if (video.dataset.src && !video.getAttribute('src')) {
    video.src = video.dataset.src;
    video.load();
  }
}
function playQuietly(video) {
  loadVideo(video);
  video.play()?.catch(() => {});
}
function isPausedGroup(video) {
  return video.closest('.hero-mosaic') ? heroPaused : simPaused;
}
const motionObserver = new IntersectionObserver((entries) => {
  entries.forEach(({ target: video, isIntersecting }) => {
    if (isIntersecting) {
      inView.add(video);
      if (!isPausedGroup(video) && !document.hidden) playQuietly(video);
    } else {
      inView.delete(video);
      video.pause();
    }
  });
}, { threshold: 0.18 });

$$('.hero-mosaic video').forEach(v => { v.autoplay = false; motionObserver.observe(v); });
for (let i = 1; i <= 8; i++) {
  const number = String(i).padStart(2, '0');
  const cell = document.createElement('div');
  cell.className = 'sim-cell';
  const video = document.createElement('video');
  video.muted = true; video.loop = true; video.playsInline = true;
  video.preload = 'none';
  video.poster = `assets/posters/simulation-${number}.jpg`;
  video.dataset.src = `assets/videos/simulation-${number}.mp4`;
  video.setAttribute('aria-label', `Simulation recording ${i}`);
  const index = document.createElement('span'); index.className = 'sim-index'; index.textContent = number;
  const expand = document.createElement('button'); expand.type = 'button'; expand.className = 'sim-expand';
  expand.textContent = '↗'; expand.setAttribute('aria-label', `Expand simulation recording ${i}`);
  expand.addEventListener('click', () => {
    const modal = $('#simulation-dialog'); const player = modal.querySelector('video');
    player.src = video.dataset.src; player.poster = video.poster;
    modal.showModal();
    updateMotionGroup('.sim-cell video', true);
    player.play()?.catch(() => {});
  });
  cell.append(video, index, expand); $('#simulation-gallery').append(cell);
  motionObserver.observe(video);
}
$('#close-simulation').addEventListener('click', () => $('#simulation-dialog').close());
$('#simulation-dialog').addEventListener('click', event => {
  if (event.target === $('#simulation-dialog')) {
    const box = event.target.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) event.target.close();
  }
});
$('#simulation-dialog').addEventListener('close', () => {
  $('#simulation-dialog video').pause();
  updateMotionGroup('.sim-cell video', simPaused);
});
function motionButton(button, paused, noun) {
  button.setAttribute('aria-pressed', String(paused));
  button.textContent = `${paused ? 'Play' : 'Pause'} ${noun} ${paused ? '▷' : 'Ⅱ'}`;
}
function updateMotionGroup(selector, paused) {
  $$(selector).forEach(video => {
    if (paused) video.pause();
    else if (inView.has(video)) playQuietly(video);
  });
}
motionButton($('#hero-motion'), heroPaused, 'previews');
motionButton($('#sim-motion'), simPaused, 'all');
$('#hero-motion').addEventListener('click', () => {
  heroPaused = !heroPaused; motionButton($('#hero-motion'), heroPaused, 'previews');
  updateMotionGroup('.hero-mosaic video', heroPaused);
});
$('#sim-motion').addEventListener('click', () => {
  simPaused = !simPaused; motionButton($('#sim-motion'), simPaused, 'all');
  updateMotionGroup('.sim-cell video', simPaused);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) $$('video').forEach(v => v.pause());
  else {
    updateMotionGroup('.hero-mosaic video', heroPaused);
    updateMotionGroup('.sim-cell video', simPaused);
  }
});
reducedMotion.addEventListener('change', ({matches}) => {
  if (matches) {
    heroPaused = simPaused = true;
    motionButton($('#hero-motion'), true, 'previews'); motionButton($('#sim-motion'), true, 'all');
    updateMotionGroup('.hero-mosaic video', true); updateMotionGroup('.sim-cell video', true);
  }
});

const recordingObserver = new IntersectionObserver(entries => {
  entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) { loadVideo(target); recordingObserver.unobserve(target); }
  });
}, {rootMargin: '250px'});
function setRecording(video, name, label) {
  video.pause();
  video.removeAttribute('src');
  video.dataset.src = `assets/videos/${name}.mp4`;
  video.poster = `assets/posters/${name}.jpg`;
  video.setAttribute('aria-label', label);
  video.load();
  recordingObserver.unobserve(video); recordingObserver.observe(video);
}
function fillTakes(select, takes) {
  select.replaceChildren(...takes.map((name, i) => new Option(`Take ${i+1} of ${takes.length}`, name)));
}
function chooseTask(key, focus = false) {
  activeTask = key;
  const task = taskContent[key];
  $$('[role="tab"]').forEach(tab => {
    const selected = tab.dataset.task === key;
    tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  $('#task-panel').setAttribute('aria-labelledby', `tab-${key}`);
  $('#task-category').textContent = task.category;
  $('#task-name').textContent = task.name;
  $('#task-description').textContent = task.description;
  $('#task-challenge').textContent = task.challenge;
  $('#task-success').replaceChildren(document.createTextNode(task.success), Object.assign(document.createElement('span'), {textContent: '/30'}));
  fillTakes($('#camera-take'), task.camera); fillTakes($('#tactile-take'), task.tactile);
  setRecording($('#camera-video'), task.camera[0], `${task.name} camera recording`);
  setRecording($('#tactile-video'), task.tactile[0], `${task.name} vision and tactile observation recording`);
}
$$('[role="tab"]').forEach((tab, i, tabs) => {
  tab.addEventListener('click', () => chooseTask(tab.dataset.task));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); chooseTask(tabs[next].dataset.task, true); }
  });
});
$$('[data-task-link]').forEach(link => link.addEventListener('click', () => chooseTask(link.dataset.taskLink)));
$('#camera-take').addEventListener('change', event => setRecording($('#camera-video'), event.target.value, `${taskContent[activeTask].name} camera recording`));
$('#tactile-take').addEventListener('change', event => setRecording($('#tactile-video'), event.target.value, `${taskContent[activeTask].name} vision and tactile observation recording`));
chooseTask('drawer');

let results;
let expanded = false;
const escapeText = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function drawChart() {
  const group = Number($('#chart-group').value);
  const pairs = results.models.map(model => [model, ...results.aggregate[model][group]]);
  $('#benchmark-chart').innerHTML = pairs.map(([model, mean, sd]) => `<div class="bar-row ${model === 'Ours' ? 'ours' : ''}"><span class="bar-name">${escapeText(model)}</span><div class="bar-track"><div class="bar-fill" style="width:${mean}%"></div><span class="bar-error" style="left:${Math.max(0,mean-sd)}%;width:${Math.min(100,mean+sd)-Math.max(0,mean-sd)}%"></span></div><span class="bar-value">${mean.toFixed(1)} <span>± ${sd.toFixed(1)}</span></span></div>`).join('');
  $('#benchmark-chart').setAttribute('aria-label', `${$('#chart-group').selectedOptions[0].text}, SR5 percent mean plus or minus population standard deviation: ${pairs.map(([m,a,b]) => `${m} ${a.toFixed(1)} plus or minus ${b.toFixed(1)}`).join('; ')}.`);
}
function renderTable() {
  const search = $('#task-search').value.trim().toLowerCase();
  const group = $('#task-filter').value;
  let rows = results.tasks.filter(r => (group === 'all' || r.group === group) && `${r.task} ${r.group}`.toLowerCase().includes(search));
  const sort = $('#task-sort').value;
  if (sort === 'name') rows.sort((a,b) => a.task.localeCompare(b.task) || a.group.localeCompare(b.group));
  if (sort === 'gain') rows.sort((a,b) => (b.values.Ours[0] - b.values.AdapTac[0]) - (a.values.Ours[0] - a.values.AdapTac[0]));
  const total = rows.length;
  const visible = expanded ? rows : rows.slice(0, 8);
  $('#task-rows').innerHTML = visible.map(row => {
    const best = Math.max(...results.models.map(m => row.values[m][0]));
    return `<tr><th scope="row"><small>${escapeText(row.group)}</small>${escapeText(row.task)}</th>${results.models.map(model => {
      const [mean,sd] = row.values[model];
      return `<td class="${mean === best ? 'best' : ''}"${mean === best ? ' aria-label="'+mean.toFixed(1)+' plus or minus '+sd.toFixed(1)+', best mean"' : ''}>${mean.toFixed(1)} <span class="sd">± ${sd.toFixed(1)}</span></td>`;
    }).join('')}</tr>`;
  }).join('') || '<tr class="empty-row"><td colspan="6">No tasks match your search.</td></tr>';
  $('#table-count').textContent = `Showing ${visible.length} of ${total} tasks · SR5 (%)`;
  $('#show-tasks').hidden = total <= 8;
  $('#show-tasks').textContent = expanded ? 'Show fewer tasks ↑' : `Show all ${total} tasks ↓`;
  $('#show-tasks').setAttribute('aria-expanded', String(expanded));
}
$('#chart-group').addEventListener('change', () => { if (results) drawChart(); });
['#task-search', '#task-filter', '#task-sort'].forEach(selector => $(selector).addEventListener(selector === '#task-search' ? 'input' : 'change', () => { expanded = false; if (results) renderTable(); }));
$('#show-tasks').addEventListener('click', () => { expanded = !expanded; renderTable(); });
fetch('assets/results.json').then(response => {
  if (!response.ok) throw new Error('Result request failed');
  return response.json();
}).then(data => {
  results = data; drawChart(); renderTable();
}).catch(() => {
  $('#results-error').hidden = false;
  $('#show-tasks').hidden = true;
  $('#table-count').textContent = 'Results unavailable';
});
