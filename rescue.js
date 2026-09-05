(() => {
  'use strict';
  const R = window.RescueRules;
  const $ = id => document.getElementById(id);
  const names = ['sheep', 'pigs', 'hens', 'cows'];
  const singular = ['Sheep', 'Pig', 'Hen', 'Cow'];
  const chapterWords = ['ONE', 'TWO', 'THREE'];
  const eyes = '<circle cx="25" cy="32" r="2.3" fill="#293c37"/><circle cx="39" cy="32" r="2.3" fill="#293c37"/>';
  function icon(type) {
    const faces = [
      '<g fill="#f9f5e6" stroke="#c8c6ac" stroke-width="1.2"><circle cx="20" cy="18" r="9"/><circle cx="32" cy="15" r="10"/><circle cx="44" cy="18" r="9"/><circle cx="15" cy="29" r="9"/><circle cx="49" cy="29" r="9"/><circle cx="20" cy="43" r="10"/><circle cx="33" cy="46" r="10"/><circle cx="45" cy="43" r="10"/></g><path d="M17 25Q7 18 10 33L21 36M47 25Q57 18 54 33L43 36" fill="#59665c"/><rect x="20" y="21" width="24" height="29" rx="11" fill="#59665c"/><circle cx="26" cy="32" r="2" fill="#fff5db"/><circle cx="38" cy="32" r="2" fill="#fff5db"/><path d="M29 41h6l-3 3z" fill="#e3c9ad"/>',
      '<path d="M13 26L9 7Q24 8 26 20M38 20Q40 8 55 7L51 28" fill="#b56e68" stroke="#87584f" stroke-width="1.2"/><ellipse cx="32" cy="33" rx="23" ry="23" fill="#f1beb0"/>' + eyes + '<ellipse cx="32" cy="42" rx="12" ry="8" fill="#cb827d"/><ellipse cx="28" cy="42" rx="2" ry="3" fill="#82554e"/><ellipse cx="36" cy="42" rx="2" ry="3" fill="#82554e"/><path d="M17 35h4M43 35h4" stroke="#db978a" stroke-width="3" stroke-linecap="round"/>',
      '<path d="M24 17Q17 1 27 6Q32 -3 37 7Q49 2 40 20" fill="#b95739"/><path d="M12 29Q4 23 6 36L16 45M50 29Q60 23 58 36L48 45" fill="#dbaa50"/><ellipse cx="32" cy="34" rx="22" ry="22" fill="#fff0b5"/>' + eyes + '<path d="M25 39L32 47L39 39L32 35Z" fill="#d68a37"/><path d="M29 46Q25 57 32 55Q40 55 35 46" fill="#b95739"/>',
      '<path d="M17 21Q7 18 7 29L19 33M47 21Q57 18 57 29L45 33" fill="#6c8079"/><path d="M19 19L16 7L26 16M45 19L48 7L38 16" fill="#f1d9a5"/><rect x="16" y="13" width="32" height="42" rx="14" fill="#f0eee0"/><path d="M18 19Q34 12 32 31L19 34Z" fill="#50665f"/><circle cx="25" cy="30" r="2.3" fill="#fff8e0"/><circle cx="39" cy="30" r="2.3" fill="#293c37"/><rect x="18" y="39" width="28" height="16" rx="8" fill="#caa49a"/><circle cx="26" cy="46" r="2" fill="#775e59"/><circle cx="38" cy="46" r="2" fill="#775e59"/>',
      '<path d="M10 26L7 3L26 17L38 17L57 3L54 29L48 46L32 59L16 46Z" fill="#536967"/><path d="M13 13L16 28L24 21M51 13L48 28L40 21" fill="#a5aaa0"/><path d="M12 30L27 35L32 48L37 35L52 30L47 46L32 58L17 46Z" fill="#d5d8ca"/><path d="M19 28L27 30M37 30L45 28" stroke="#243b37" stroke-width="3" stroke-linecap="round"/><path d="M27 45L37 45L32 50Z" fill="#243b37"/>'
    ];
    return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">${faces[type]}</svg>`;
  }
  let state = R.create(), selected = [], busy = false, total = 0, bankedScore = 0;
  let soundOn = false, audio = null, best = 0, dialogAction = null, dialogSecondary = null;
  let lastFocus = null, generation = 0, ready = false;
  try { soundOn = localStorage.getItem('aw-rescue-sound') === '1'; best = Number(localStorage.getItem('aw-rescue-best')) || 0; } catch {}
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelector('.brand-wolf').innerHTML = icon(4);
  function tone(kind = 'select') {
    if (!soundOn) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const notes = kind === 'win' ? [523, 659, 784, 1047] : kind === 'bark' ? [180, 140] : kind === 'rescue' ? [660, 880] : [480];
      notes.forEach((frequency, i) => {
        const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + i * .09;
        o.type = kind === 'bark' ? 'triangle' : 'sine'; o.frequency.setValueAtTime(frequency, t);
        o.frequency.exponentialRampToValueAtTime(frequency * (kind === 'bark' ? .65 : 1.07), t + .13);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07, t + .015); g.gain.exponentialRampToValueAtTime(.001, t + .18);
        o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + .2);
      });
    } catch { /* Audio is optional, including on silent or unsupported devices. */ }
  }
  function soundLabel() {
    $('sound').setAttribute('aria-pressed', String(soundOn));
    $('sound').setAttribute('aria-label', `Turn sound ${soundOn ? 'off' : 'on'}`);
    $('sound').innerHTML = `♪<span>Sound ${soundOn ? 'on' : 'off'}</span>`;
  }
  function say(message) { $('feedback').textContent = message; }
  function openDialog({ eyebrow, title, copy, details = '', action, run, secondary = '', secondaryRun }) {
    lastFocus = document.activeElement;
    $('dialog-eyebrow').textContent = eyebrow;
    $('dialog-title').textContent = title;
    $('dialog-copy').textContent = copy;
    $('dialog-details').innerHTML = details;
    document.querySelector('.dialog-art').innerHTML = title === 'Everyone is home.' ? icon(0) + icon(1) + icon(2) + icon(3) : icon(0) + icon(4);
    $('dialog-action').textContent = action;
    $('dialog-secondary').textContent = secondary;
    $('dialog-secondary').hidden = !secondary;
    dialogAction = run;
    dialogSecondary = secondaryRun;
    if (!$('story-dialog').open) $('story-dialog').showModal();
    $('dialog-action').focus();
  }
  function closeDialog() {
    $('story-dialog').close();
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  }
  function intro() {
    ready = false;
    openDialog({ eyebrow: 'A SMALL ADVENTURE IN THREE CHAPTERS', title: 'The gate was left open.',
      copy: 'The animals wandered out. The wolves noticed. Bring the herds home with a whistle, and a little help from Pip the sheepdog.',
      details: '<div class="instruction"><b>1.</b> Tap 3+ matching animals touching side to side.</div><div class="instruction"><b>2.</b> Whistle them home. Bigger herds hold off the wolves.</div><div class="instruction"><b>3.</b> Fill the animal goals to reach the next field.</div><p style="margin-top:12px">No clock. The wolves wait for your move.</p>',
      action: 'Let’s bring them home', run: () => { ready = true; closeDialog(); select(30); } });
  }
  function render() {
    const c = R.CHAPTERS[state.chapter];
    document.body.className = `chapter-${state.chapter}`;
    $('chapter-label').textContent = `CHAPTER ${chapterWords[state.chapter]} · ${c.time.toUpperCase()}`;
    $('field-title').textContent = c.name;
    $('story-title').textContent = ['The gate was left open.', 'Follow the little footprints.', 'Leave no herd behind.'][state.chapter];
    $('story-text').textContent = c.story;
    $('total-home').textContent = total + state.saved.reduce((a, b) => a + b, 0);
    document.querySelectorAll('[data-stop]').forEach((el, i) => { el.className = i === state.chapter ? 'current' : i < state.chapter ? 'complete' : ''; if (i === state.chapter) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current'); });
    $('goals').innerHTML = c.goal.map((n, i) => n ? `<div class="goal ${state.saved[i] >= n ? 'done' : ''}" aria-label="${Math.min(n, state.saved[i])} of ${n} ${names[i]} home">${icon(i)}<div class="goal-copy"><strong>${state.saved[i] >= n ? `${n} ✓` : `${state.saved[i]} / ${n}`}</strong><span>${names[i]}${state.chapter === 2 ? '' : ' home'}</span></div><div class="goal-progress" style="width:${Math.min(100, state.saved[i] / n * 100)}%"></div></div>` : '').join('');
    $('wolf-label').textContent = state.distance > 0 ? `Wolves are ${state.distance} ${state.distance === 1 ? 'step' : 'steps'} away` : 'The wolves reached the field';
    $('wolf-effect').textContent = state.distance <= 2 ? 'Small herd? Use Pip or find 5+.' : '3–4: closer · 5–7: hold · 8+: back';
    document.querySelector('.wolf-trail').classList.toggle('danger', state.distance <= 2);
    $('trail-steps').innerHTML = Array.from({ length: 11 }, (_, i) => `<span class="trail-step ${i === state.distance ? 'active' : ''}">${i === state.distance ? icon(4) : ''}</span>`).join('');
    const allGroups = R.groups(state.board), playable = new Set(allGroups.flat());
    $('board').innerHTML = state.board.map((t, i) => `<button class="animal ${playable.has(i) ? 'hint' : ''}" data-cell="${i}" data-type="${t}" aria-label="${singular[t]}, row ${Math.floor(i / 6) + 1}, column ${i % 6 + 1}" aria-pressed="false" tabindex="${i === 30 ? 0 : -1}">${icon(t)}</button>`).join('');
    $('bark').disabled = !state.bark || busy || state.status !== 'playing';
    $('bark').innerHTML = `<span aria-hidden="true">🐕</span><span>${state.bark ? 'Pip, bark!' : 'Good dog, Pip.'}<small>${state.bark ? '+3 steps · regroup · once' : 'Bark used this field'}</small></span>`;
    renderSelection();
  }
  function renderSelection() {
    const chosen = new Set(selected);
    $('board').setAttribute('aria-busy', String(busy));
    $('board').classList.toggle('has-selection', selected.length > 0);
    [...$('board').children].forEach((el, i) => { el.classList.toggle('selected', chosen.has(i)); el.setAttribute('aria-pressed', String(chosen.has(i))); el.disabled = busy || state.status !== 'playing'; });
    $('whistle').disabled = !selected.length || busy || state.status !== 'playing';
    $('whistle-label').textContent = selected.length ? `Whistle ${selected.length} home` : 'Choose a herd';
  }
  function select(i) {
    if (!ready || busy || state.status !== 'playing' || $('story-dialog').open) return;
    const g = R.group(state.board, i);
    if (g.length < 3) { selected = []; renderSelection(); say(`Only ${g.length} here. Find 3+ matching animals touching side to side.`); return; }
    if (selected.includes(i)) { commit(); return; }
    selected = g;
    tone();
    renderSelection();
    const effect = g.length >= 8 ? 'Wolves step back!' : g.length >= 5 ? 'Wolves stay put.' : `Wolves step closer${state.distance === 1 ? ' — this must finish the field!' : '.'}`;
    say(`${g.length} ${names[state.board[i]]} ready. ${effect}`);
  }
  function commit() {
    if (!ready || busy || !selected.length || state.status !== 'playing' || $('story-dialog').open) return;
    busy = true;
    const start = selected[0], ticket = generation;
    const activeCell = document.activeElement?.dataset?.cell;
    selected.forEach(i => $('board').children[i].classList.add('rescuing'));
    renderSelection();
    $('bark').disabled = true;
    tone('rescue');
    setTimeout(() => {
      if (ticket !== generation) return;
      const result = R.rescue(state, start);
      selected = []; busy = false; render();
      if (!result.ok) return;
      result.cleared.forEach(i => $('board').children[i].classList.add('new-arrival'));
      if (activeCell !== undefined) {
        [...$('board').children].forEach(el => { el.tabIndex = -1; });
        const cell = $('board').children[Number(activeCell)];
        if (cell) { cell.tabIndex = 0; cell.focus(); }
      }
      say(`${result.count} ${names[result.type]} home! ${result.push === 2 ? 'The pack backs away.' : result.push === 1 ? 'The pack holds back.' : 'The pack steps closer.'}${result.regrouped ? ' A new herd has gathered.' : ''}`);
      if (state.status !== 'playing') finishField();
    }, reducedMotion.matches ? 0 : 230);
  }
  function startField(chapter) {
    generation++; busy = false; selected = []; ready = true;
    state = R.create(chapter); render(); window.scrollTo(0, 0);
    say('Tap a herd of 3+ matching animals that touch.');
  }
  function finishField() {
    if (state.status === 'lost') {
      openDialog({ eyebrow: 'PIP GUIDED THE HERDS TO COVER', title: 'A little too close.', copy: 'The wolves reached the field. The animals are sheltering with Pip. Try this field again: herds of 5+ buy you time, and his bark gives you three extra steps.',
        action: 'Try this field again', run: () => { closeDialog(); startField(state.chapter); } });
      return;
    }
    tone('win');
    const final = state.chapter === 2;
    const saved = total + state.saved.reduce((a, b) => a + b, 0), score = bankedScore + state.score;
    if (final && score > best) { best = score; try { localStorage.setItem('aw-rescue-best', String(best)); } catch {} }
    openDialog({ eyebrow: final ? 'THREE FIELDS. ONE SAFE BARN.' : `CHAPTER ${chapterWords[state.chapter]} COMPLETE`, title: final ? 'Everyone is home.' : ['The sheep are safe.', 'Out of the orchard.'][state.chapter],
      copy: R.CHAPTERS[state.chapter].ending,
      details: `<div class="stat-line"><span><strong>${saved}</strong>animals home</span><span><strong>${score}</strong>herding points</span></div>${final ? `<p style="margin-top:12px">Personal best: ${best} · Bigger herds earn more points.</p>` : ''}`,
      action: final ? 'One more adventure' : `On to ${state.chapter === 0 ? 'the orchard' : 'the last gate'} →`,
      run: () => {
        closeDialog();
        if (final) { total = 0; bankedScore = 0; startField(0); }
        else {
          total = saved; bankedScore = score; startField(state.chapter + 1);
          const c = R.CHAPTERS[state.chapter];
          openDialog({ eyebrow: `CHAPTER ${chapterWords[state.chapter]} · ${c.time.toUpperCase()}`, title: c.name, copy: c.story,
            details: '<p>Pip has his bark back. The wolves start closer this time.</p>', action: 'Open the field gate', run: closeDialog });
        }
      } });
  }
  $('board').addEventListener('click', e => { const cell = e.target.closest('[data-cell]'); if (cell) select(Number(cell.dataset.cell)); });
  $('board').addEventListener('keydown', e => {
    const cell = e.target.closest('[data-cell]'); if (!cell) return;
    let i = Number(cell.dataset.cell), next = i;
    if (e.key === 'ArrowLeft') next = Math.max(i - i % 6, i - 1);
    else if (e.key === 'ArrowRight') next = Math.min(i - i % 6 + 5, i + 1);
    else if (e.key === 'ArrowUp') next = Math.max(0, i - 6);
    else if (e.key === 'ArrowDown') next = Math.min(35, i + 6);
    else return;
    e.preventDefault(); cell.tabIndex = -1; $('board').children[next].tabIndex = 0; $('board').children[next].focus();
  });
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !$('story-dialog').open && !e.repeat && (e.target === document.body || e.target.closest('#board') || e.target.closest('#whistle'))) {
      e.preventDefault(); commit();
    }
    if (e.key === 'Escape' && !$('story-dialog').open) { selected = []; renderSelection(); say('Choose a different herd when you are ready.'); }
  });
  $('whistle').addEventListener('click', commit);
  $('bark').addEventListener('click', () => {
    if (!ready || busy || $('story-dialog').open || !R.bark(state)) return;
    selected = []; tone('bark'); render(); say('Good dog! Wolves back 3 steps. The animals regrouped.');
  });
  $('retry').addEventListener('click', () => {
    if (busy) return;
    openDialog({ eyebrow: 'A FRESH START', title: 'Try this field again?', copy: 'Your earlier fields stay complete. This field’s animals, wolves, and Pip’s bark will reset.', action: 'Restart this field', run: () => { closeDialog(); startField(state.chapter); }, secondary: 'Keep playing', secondaryRun: closeDialog });
  });
  $('guide').addEventListener('click', () => {
    if (busy) return;
    openDialog({ eyebrow: 'YOU ARE THE SHEPHERD', title: 'Think first. Then whistle.', copy: 'Select a herd, see what will happen, then whistle it home. Fill the animal goals above the field to continue the story.',
      details: '<div class="instruction"><b>Find a herd.</b> 3+ matching animals must touch horizontally or vertically. Diagonals do not count.</div><div class="instruction"><b>Whistle.</b> Tap the button or tap your selected herd again. The spaces refill from above.</div><div class="instruction"><b>Watch the pack.</b> 3–4 animals: wolves step closer. 5–7: wolves stay put. 8+: wolves step back.</div><div class="instruction"><b>Call Pip once per field.</b> His bark pushes wolves back 3 steps and shuffles the animals. It costs no move.</div><div class="instruction"><b>Keyboard.</b> Tab into the field, use arrow keys to move, Enter to select, Space to whistle. Escape clears a selection.</div><div class="instruction"><b>Points.</b> 10 per animal, plus a bonus for herds larger than 3. Your best completed adventure stays on this device.</div>',
      action: 'Back to the field', run: closeDialog });
  });
  $('sound').addEventListener('click', () => { soundOn = !soundOn; soundLabel(); try { localStorage.setItem('aw-rescue-sound', soundOn ? '1' : '0'); } catch {} tone(); });
  $('dialog-action').addEventListener('click', () => dialogAction?.());
  $('dialog-secondary').addEventListener('click', () => dialogSecondary?.());
  $('story-dialog').addEventListener('cancel', e => { e.preventDefault(); if (ready && state.status === 'playing') closeDialog(); });
  soundLabel(); render(); intro();
})();
