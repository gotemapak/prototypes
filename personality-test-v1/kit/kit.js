/* [Company] prototype kit — движок прототипа воронки. Без сборки и зависимостей.
   Использование: <link rel="stylesheet" href="kit.css"> ... <script>window.FUNNEL = {...}</script><script src="kit.js"></script>
   Схема FUNNEL — в STYLE.md. Публичный объект: window.KIT { answers, result, go(n|id), back(), restart() }. */
(function () {
  'use strict';
  var F = window.FUNNEL;
  if (!F || !Array.isArray(F.screens)) { document.body.innerHTML = '<p style="padding:20px;font-family:sans-serif">window.FUNNEL is not defined</p>'; return; }
  var meta = Object.assign({ brand: '[Company]', logo: 'assets/logo.svg', disclaimer: '', progress: true, devPanel: true, counter: false }, F.meta || {});
  var screens = F.screens;
  var QUESTION_TYPES = { single: 1, multi: 1, likert: 1, 'image-choice': 1 };
  var LIKERT_DEFAULT = [
    { value: 5, label: 'Strongly agree' }, { value: 4, label: 'Agree' }, { value: 3, label: 'Neutral' },
    { value: 2, label: 'Disagree' }, { value: 1, label: 'Strongly disagree' }
  ];
  // цвета шкалы согласия (likert colored / layout: 'circles'): по value 5..1, тон заливки + цвет текста на заливке
  var LIKERT_TONES = {
    5: { tone: '#1e9e57', soft: '#e3f5ea', ink: '#ffffff' },
    4: { tone: '#7fcf95', soft: '#eef9f1', ink: '#0f3a1f' },
    3: { tone: '#b4bccb', soft: '#f4f6f9', ink: '#17213a' },
    2: { tone: '#f59a3c', soft: '#fff2e4', ink: '#ffffff' },
    1: { tone: '#e5484d', soft: '#fdeaea', ink: '#ffffff' }
  };
  var state = { i: 0, history: [], answers: {}, result: {}, plan: null, timers: [] };

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function get(obj, path) { return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj); }
  function ctx() { return Object.assign({}, state.result, { answers: state.answers, plan: state.plan || {}, meta: meta }); }
  // {{key}} / {{a.b}} — подставляются из результата scoring(answers), answers и выбранного плана
  function tpl(s) {
    if (typeof s !== 'string') return s;
    var c = ctx();
    return s.replace(/\{\{\s*([\w.]+)\s*\}\}/g, function (m, k) { var v = get(c, k); return v == null ? '' : (Array.isArray(v) ? v.join(', ') : v); });
  }
  function deep(v) {
    if (typeof v === 'string') return tpl(v);
    if (Array.isArray(v)) return v.map(deep);
    if (v && typeof v === 'object' && typeof v !== 'function') { var o = {}; for (var k in v) o[k] = typeof v[k] === 'function' ? v[k] : deep(v[k]); return o; }
    return v;
  }
  function h(tag, attrs, html) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (attrs[k] == null || attrs[k] === false) continue; if (k === 'class') el.className = attrs[k]; else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), attrs[k]); else el.setAttribute(k, attrs[k]); }
    if (html != null) el.innerHTML = html;
    return el;
  }
  var CHECK_SVG = '<svg viewBox="0 0 12 10" fill="none"><path d="M1 5.2 4.3 8.5 11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function checkIcon() { return '<span class="kit-check">' + CHECK_SVG + '</span>'; }
  function runScoring() {
    var fn = F.scoring || window.FUNNEL_SCORING;
    if (typeof fn === 'function') { try { state.result = fn(state.answers) || {}; } catch (e) { console.warn('[kit] scoring error', e); state.result = {}; } }
  }
  // картинка: путь/URL → <img>, пусто → плейсхолдер с подписью (imageAlt)
  function img(src, cls, alt, phText) {
    if (src) return '<img class="' + cls + '" src="' + esc(src) + '" alt="' + esc(alt || '') + '">';
    if (phText) return '<div class="kit-image-ph">' + esc(phText) + '</div>';
    return '';
  }
  function titleEl(s, extra) { return s.title ? '<h2 class="kit-title ' + (extra || '') + (s.titleSize ? ' kit-title--' + s.titleSize : '') + '">' + s.title + '</h2>' : ''; }
  function subEl(s) { return s.subtitle ? '<p class="kit-subtitle">' + s.subtitle + '</p>' : ''; }
  function textEl(s) { return s.text ? '<p class="kit-text">' + s.text + '</p>' : ''; }
  function bulletsEl(list) { return list && list.length ? '<ul class="kit-bullets">' + list.map(function (b) { return '<li>' + checkIcon() + '<span>' + b + '</span></li>'; }).join('') + '</ul>' : ''; }
  function stars(n) { n = n == null ? 5 : n; return '<span class="kit-stars">' + '★★★★★'.slice(0, n) + '</span>'; }

  /* ---------- shell ---------- */
  var root = document.getElementById('kit-app') || document.body.appendChild(h('div', { id: 'kit-app' }));
  root.innerHTML = '';
  var header = h('header', { class: 'kit-header' });
  var hInner = h('div', { class: 'kit-header__inner' });
  var backBtn = h('button', { class: 'kit-header__back', 'aria-label': 'Back', onclick: function () { back(); } },
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  hInner.appendChild(backBtn);
  hInner.appendChild(h('div', { class: 'kit-header__brand' }, (meta.logo ? '<img src="' + esc(meta.logo) + '" width="34" height="34" alt="">' : '') + esc(meta.headerTitle || meta.brand)));
  header.appendChild(hInner);
  var progress = h('div', { class: 'kit-progress' }, '<div class="kit-progress__done"></div>');
  // meta.counter — строка «Question {n} of {total}» под прогресс-баром (по умолчанию выключено)
  var counterEl = h('div', { class: 'kit-counter' }); counterEl.hidden = true;
  var offerSlot = h('div');
  var main = h('main', { class: 'kit-main' });
  root.appendChild(header); root.appendChild(progress); root.appendChild(counterEl); root.appendChild(offerSlot); root.appendChild(main);
  if (meta.title) document.title = meta.title;

  var devPanel, devInput, devLabel;
  if (meta.devPanel !== false) {
    devPanel = h('div', { class: 'kit-dev' });
    devLabel = h('span', null, '');
    devInput = h('input', { type: 'number', min: 1, max: screens.length, 'aria-label': 'Screen number', onkeydown: function (e) { if (e.key === 'Enter') go(+devInput.value - 1); } });
    devPanel.appendChild(devLabel); devPanel.appendChild(devInput);
    devPanel.appendChild(h('button', { onclick: function () { go(+devInput.value - 1); } }, 'Go'));
    document.body.appendChild(devPanel);
  }

  /* ---------- navigation ---------- */
  function indexOf(idOrN) { if (typeof idOrN === 'number') return idOrN; for (var i = 0; i < screens.length; i++) if (screens[i].id === idOrN) return i; return -1; }
  function clearTimers() { state.timers.forEach(function (t) { clearTimeout(t); clearInterval(t); }); state.timers = []; var m = document.querySelector('.kit-modal'); if (m) m.remove(); }
  function nextIndex(from) {
    var s = screens[from], n;
    if (s && s.next) { n = typeof s.next === 'function' ? s.next(state.answers, state.result) : s.next; if (n != null) return indexOf(n); }
    n = from + 1;
    while (n < screens.length && typeof screens[n].skipIf === 'function' && screens[n].skipIf(state.answers, state.result)) n++;
    return n;
  }
  function advance() {
    var n = nextIndex(state.i);
    if (n < 0 || n >= screens.length) { console.info('[kit] end of funnel', state.answers); return; }
    state.history.push(state.i); show(n);
  }
  function back() { if (!state.history.length) return; show(state.history.pop()); }
  function go(target) {
    var n = indexOf(target);
    if (isNaN(n) || n < 0 || n >= screens.length) return;
    if (n !== state.i) state.history.push(state.i);
    show(n);
  }
  function restart() { state.answers = {}; state.history = []; state.plan = null; show(0); }
  function setAnswer(id, v) { state.answers[id] = v; }

  var qList = screens.map(function (s, i) { return { i: i, q: QUESTION_TYPES[s.type] && s.countInProgress !== false }; }).filter(function (x) { return x.q; }).map(function (x) { return x.i; });
  function updateProgress(s, i) {
    var hide = meta.progress === false || s.progress === false || !QUESTION_TYPES[s.type] && s.progress !== true;
    // прогресс видим на вопросах и на промежуточных экранах внутри квиза (как в test-1/test-8), не на intro/loader/email/result/paywall
    var inQuiz = { interstitial: 1 }[s.type] && s.progress !== false;
    progress.hidden = hide && !inQuiz;
    var done = qList.filter(function (q) { return q < i; }).length;
    var pct = qList.length ? Math.min(100, (done / qList.length) * 100) : 0;
    progress.firstChild.style.width = pct + '%';
    // счётчик: считает только экраны типов meta.counterTypes (по умолчанию likert) или с inCounter: true; inCounter: false — исключить
    var ci = cList.indexOf(i);
    counterEl.hidden = !meta.counter || ci < 0;
    if (!counterEl.hidden) {
      var lbl = typeof meta.counter === 'string' ? meta.counter : 'Question {n} of {total}';
      counterEl.innerHTML = '<span>' + lbl.replace('{n}', '<b>' + (ci + 1) + '</b>').replace('{total}', cList.length) + '</span>';
    }
  }
  var cTypes = meta.counterTypes || ['likert'];
  var cList = screens.map(function (s, i) { return { i: i, c: s.inCounter === true || (s.inCounter !== false && cTypes.indexOf(s.type) > -1) }; }).filter(function (x) { return x.c; }).map(function (x) { return x.i; });

  function show(i) {
    clearTimers();
    state.i = i;
    var raw = screens[i];
    runScoring(); // scoring(answers) вызывается на каждом экране — {{placeholders}} доступны везде
    var s = deep(raw);
    main.innerHTML = ''; offerSlot.innerHTML = '';
    backBtn.hidden = !state.history.length || s.back === false || (F.meta && F.meta.back === false); // meta.back: false — без возврата к отвеченным вопросам
    header.hidden = s.header === false;
    updateProgress(s, i);
    var R = RENDER[s.type];
    var wrap = h('div', { class: 'kit-screen kit-screen--' + s.type, 'data-id': s.id || '' });
    if (!R) wrap.innerHTML = '<div class="kit-card"><p class="kit-text">Unknown screen type: <b>' + esc(s.type) + '</b></p></div>';
    else R(s, wrap);
    main.appendChild(wrap);
    if (s.disclaimer !== false && (s.disclaimer || (s.type === 'intro' && meta.disclaimer))) main.appendChild(h('div', { class: 'kit-disclaimer' }, s.disclaimer || meta.disclaimer));
    window.scrollTo(0, 0);
    if (devLabel) devLabel.innerHTML = (i + 1) + '/' + screens.length + ' <span class="kit-dev__id">' + esc(s.id || s.type) + '</span>';
    if (devInput) devInput.value = i + 1;
    try { history.replaceState(null, '', '#' + encodeURIComponent(s.id || i + 1)); } catch (e) { /* file:// в некоторых браузерах */ }
  }

  /* ---------- option widgets ---------- */
  function optionList(s, multi, onPick) {
    var box = h('div', { class: 'kit-options' });
    var cur = state.answers[s.id];
    var sel = multi ? (Array.isArray(cur) ? cur.slice() : []) : cur;
    (s.options || []).forEach(function (o) {
      var on = multi ? sel.indexOf(o.value) > -1 : sel === o.value;
      var b = h('button', { type: 'button', class: 'kit-opt' + (on ? ' kit-opt--selected' : ''), 'data-value': o.value },
        (multi ? '<span class="kit-checkbox">' + CHECK_SVG + '</span>' : '<span class="kit-radio"></span>') +
        (o.emoji ? '<span class="kit-opt__emoji">' + o.emoji + '</span>' : '') + '<span>' + o.label + '</span>');
      b.addEventListener('click', function () {
        if (multi) {
          var k = sel.indexOf(o.value);
          if (k > -1) sel.splice(k, 1);
          else {
            if (o.exclusive) sel = [];
            else sel = sel.filter(function (v) { var oo = (s.options || []).filter(function (x) { return x.value === v; })[0]; return !(oo && oo.exclusive); });
            if (s.max && sel.length >= s.max) return;
            sel.push(o.value);
          }
          box.querySelectorAll('.kit-opt').forEach(function (el) { el.classList.toggle('kit-opt--selected', sel.indexOf(el.getAttribute('data-value')) > -1 || sel.indexOf(+el.getAttribute('data-value')) > -1); });
          onPick(sel.slice());
        } else {
          sel = o.value;
          box.querySelectorAll('.kit-opt').forEach(function (el) { el.classList.toggle('kit-opt--selected', el === b); });
          onPick(o.value);
        }
      });
      box.appendChild(b);
    });
    return box;
  }
  function ctaBtn(label, disabled, onClick, extraCls) {
    return h('button', { type: 'button', class: 'kit-btn' + (extraCls ? ' ' + extraCls : ''), disabled: disabled ? 'disabled' : null, onclick: onClick }, esc(label));
  }
  function textAction(s, card) {
    if (!s.textAction) return;
    card.appendChild(h('button', { type: 'button', class: 'kit-text-action', onclick: function () { if (s.textAction.value != null) setAnswer(s.id, s.textAction.value); advance(); } },
      '<span>' + s.textAction.label + '</span><span class="kit-text-action__arrow">→</span>'));
  }
  function imageChoiceGrid(s, multi, onPick) {
    var style = s.style || 'card';
    var cols = s.columns || (style === 'avatar' ? 3 : 2);
    var grid = h('div', { class: 'kit-grid' + (cols === 3 ? ' kit-grid--3' : '') + (style === 'tile' ? ' kit-grid--tiles' : '') });
    var cur = state.answers[s.id];
    var sel = multi ? (Array.isArray(cur) ? cur.slice() : []) : cur;
    var selCls = { card: 'kit-ic--selected', tile: 'kit-tile--selected', avatar: 'kit-avatar--selected' }[style];
    (s.options || []).forEach(function (o) {
      var on = multi ? sel.indexOf(o.value) > -1 : sel === o.value;
      var inner;
      if (style === 'tile') inner = o.image ? '<img src="' + esc(o.image) + '" alt="' + esc(o.label || '') + '">' : '<span class="kit-tile__label">' + (o.emoji ? o.emoji + ' ' : '') + esc(o.label || o.value) + '</span>';
      else if (style === 'avatar') inner = '<span class="kit-avatar__img">' + (o.image ? '<img src="' + esc(o.image) + '" alt="">' : (o.emoji || '🙂')) + '</span><span class="kit-avatar__label">' + o.label + '</span>';
      else inner = '<div class="kit-ic__media' + (s.tall ? ' kit-ic__media--tall' : '') + '">' + (o.image ? '<img src="' + esc(o.image) + '" alt="">' : '<span class="kit-ic__ph">' + (o.emoji || '🖼️') + '</span>') + '</div>' +
        '<div class="kit-ic__footer"><span>' + o.label + '</span><span class="kit-ic__arrow">→</span></div>';
      var b = h('button', { type: 'button', class: { card: 'kit-ic', tile: 'kit-tile', avatar: 'kit-avatar' }[style] + (on ? ' ' + selCls : '') }, inner);
      b.addEventListener('click', function () {
        if (multi) {
          var k = sel.indexOf(o.value); if (k > -1) sel.splice(k, 1); else sel.push(o.value);
          b.classList.toggle(selCls, sel.indexOf(o.value) > -1); onPick(sel.slice());
        } else {
          sel = o.value; grid.querySelectorAll('.' + selCls).forEach(function (el) { el.classList.remove(selCls); }); b.classList.add(selCls); onPick(o.value);
        }
      });
      grid.appendChild(b);
    });
    return grid;
  }
  function autoNext(s) { state.timers.push(setTimeout(advance, s.autoAdvanceDelay != null ? s.autoAdvanceDelay : 300)); }

  /* ---------- renderers ---------- */
  var RENDER = {};

  RENDER.intro = function (s, wrap) {
    var card = h('div', { class: 'kit-card' });
    card.innerHTML = (s.hero ? '<h1 class="kit-title kit-title--hero">' + s.hero + '</h1>' : '') + titleEl(s, s.options && s.options.some(function (o) { return o.image; }) ? 'kit-title--stat' : '') + subEl(s) +
      (s.image ? img(s.image, 'kit-image kit-image--plain', '') : (s.imagePlaceholder ? '<div class="kit-image-ph kit-image-ph--plain">' + esc(s.imagePlaceholder) + '</div>' : '')) + bulletsEl(s.bullets);
    if (s.options && s.options.length) {
      var withImg = s.options.some(function (o) { return o.image || o.emoji; });
      if (withImg) {
        card.appendChild(imageChoiceGrid({ id: s.id, options: s.options, style: 'card', tall: s.tall, columns: s.columns }, false, function (v) { setAnswer(s.id, v); autoNext(s); }));
      } else {
        var row = h('div', { class: 'kit-btn-row' });
        s.options.forEach(function (o) { row.appendChild(ctaBtn(o.label, false, function () { setAnswer(s.id, o.value); advance(); })); });
        card.appendChild(row);
      }
    } else card.appendChild(ctaBtn(s.cta || 'Start the Test', false, advance));
    textAction(s, card);
    if (s.note) card.appendChild(h('p', { class: 'kit-note' }, s.note));
    wrap.appendChild(card);
  };

  RENDER.single = function (s, wrap) {
    var card = h('div', { class: 'kit-card' });
    card.innerHTML = titleEl(s) + subEl(s) + (s.image ? img(s.image, 'kit-image kit-image--question', '') : '');
    var auto = s.autoAdvance !== false;
    var btn = auto ? null : ctaBtn(s.cta || 'Next', state.answers[s.id] == null, advance);
    card.appendChild(optionList(s, false, function (v) { setAnswer(s.id, v); if (auto) autoNext(s); else btn.disabled = false; }));
    if (btn) card.appendChild(btn);
    textAction(s, card);
    wrap.appendChild(card);
  };

  RENDER.multi = function (s, wrap) {
    var card = h('div', { class: 'kit-card' });
    card.innerHTML = titleEl(s) + subEl(s);
    var min = s.min == null ? 1 : s.min;
    var cur = state.answers[s.id] || [];
    var btn = ctaBtn(s.cta || 'Continue', cur.length < min, function () { if (!state.answers[s.id]) setAnswer(s.id, []); advance(); });
    card.appendChild(optionList(s, true, function (arr) { setAnswer(s.id, arr); btn.disabled = arr.length < min; }));
    card.appendChild(btn);
    wrap.appendChild(card);
  };

  RENDER.likert = function (s, wrap) {
    var card = h('div', { class: 'kit-card' });
    card.innerHTML = titleEl(s) + subEl(s);
    var opts = s.options || LIKERT_DEFAULT;
    var auto = s.autoAdvance !== false;
    var btn = auto ? null : ctaBtn(s.cta || 'Next', state.answers[s.id] == null, advance);
    var pick = function (v) { setAnswer(s.id, v); if (auto) autoNext(s); else btn.disabled = false; };
    var toneOf = function (o, k) {
      var t = LIKERT_TONES[o.value] && opts.length === 5 && typeof o.value === 'number' ? LIKERT_TONES[o.value] : LIKERT_TONES[[5, 4, 3, 2, 1][Math.round(k * 4 / Math.max(1, opts.length - 1))]];
      return o.color ? { tone: o.color, soft: o.colorSoft || t.soft, ink: o.colorInk || t.ink } : t;
    };
    var toneStyle = function (t) { return '--tone:' + t.tone + ';--tone-soft:' + t.soft + ';--tone-ink:' + t.ink; };
    if (s.layout === 'circles') {
      // 5 цветных кругов, крайние крупнее; подписи по краям; выбранный вариант текстом под кругами
      var row = h('div', { class: 'kit-likert-circles' });
      var chosen = h('div', { class: 'kit-likert-chosen' }, '&nbsp;');
      var sizes = s.circleSizes || [68, 56, 46, 56, 68];
      var showChosen = function (o, t) { chosen.innerHTML = o ? '<span style="color:' + (t.tone === LIKERT_TONES[3].tone ? '#596179' : t.tone) + '">' + o.label + '</span>' : '&nbsp;'; };
      opts.forEach(function (o, k) {
        var t = toneOf(o, k), on = state.answers[s.id] === o.value, sz = sizes[k] || 52;
        var d = h('button', { type: 'button', class: 'kit-likert-circle' + (on ? ' kit-likert-circle--selected' : ''), 'aria-label': o.label, 'data-value': o.value,
          style: toneStyle(t) + ';--size:' + sz + 'px' }, '<span class="kit-likert-circle__dot">' + CHECK_SVG + '</span>');
        if (on) showChosen(o, t);
        d.addEventListener('click', function () { row.querySelectorAll('.kit-likert-circle').forEach(function (e) { e.classList.remove('kit-likert-circle--selected'); }); d.classList.add('kit-likert-circle--selected'); showChosen(o, t); pick(o.value); });
        row.appendChild(d);
      });
      card.appendChild(row);
      var tl = toneOf(opts[0], 0), tr = toneOf(opts[opts.length - 1], opts.length - 1);
      card.appendChild(h('div', { class: 'kit-likert-ends kit-likert-ends--circles' }, '<span style="color:' + tl.tone + '">' + (s.leftLabel || opts[0].label) + '</span><span style="color:' + tr.tone + '">' + (s.rightLabel || opts[opts.length - 1].label) + '</span>'));
      card.appendChild(chosen);
    } else if (s.layout === 'scale') {
      var scale = h('div', { class: 'kit-likert-scale' });
      opts.forEach(function (o, k) {
        var d = h('button', { type: 'button', class: 'kit-likert-dot' + (state.answers[s.id] === o.value ? ' kit-likert-dot--selected' : ''), 'aria-label': o.label }, String(k + 1));
        d.addEventListener('click', function () { scale.querySelectorAll('.kit-likert-dot').forEach(function (e) { e.classList.remove('kit-likert-dot--selected'); }); d.classList.add('kit-likert-dot--selected'); pick(o.value); });
        scale.appendChild(d);
      });
      card.appendChild(scale);
      card.appendChild(h('div', { class: 'kit-likert-ends' }, '<span>' + opts[0].label + '</span><span>' + opts[opts.length - 1].label + '</span>'));
    } else {
      var list = optionList({ id: s.id, options: opts }, false, pick);
      if (s.colored) {
        // цветной список: кружок слева в цвете варианта, выбранная карточка залита этим цветом
        list.classList.add('kit-likert--colored');
        Array.prototype.forEach.call(list.children, function (el, k) { el.setAttribute('style', toneStyle(toneOf(opts[k], k))); });
      }
      card.appendChild(list);
    }
    if (btn) card.appendChild(btn);
    wrap.appendChild(card);
  };

  RENDER['image-choice'] = function (s, wrap) {
    var card = h('div', { class: 'kit-card' });
    card.innerHTML = titleEl(s) + subEl(s) + (s.image ? img(s.image, 'kit-image kit-image--question', '') : '');
    var multi = !!s.multiple;
    var auto = !multi && s.autoAdvance !== false;
    var btn = auto ? null : ctaBtn(s.cta || 'Continue', !multi && state.answers[s.id] == null || multi && !(state.answers[s.id] || []).length, advance);
    card.appendChild(imageChoiceGrid(s, multi, function (v) { setAnswer(s.id, v); if (auto) autoNext(s); else btn.disabled = multi ? !v.length : false; }));
    if (btn) card.appendChild(btn);
    textAction(s, card);
    wrap.appendChild(card);
  };

  RENDER.interstitial = function (s, wrap) {
    var card = h('div', { class: 'kit-card' });
    var pic = s.image ? img(s.image, 'kit-image' + (s.imageStyle === 'plain' ? ' kit-image--plain' : ''), '') : (s.imagePlaceholder ? '<div class="kit-image-ph' + (s.imageStyle === 'plain' ? ' kit-image-ph--plain' : '') + '">' + esc(s.imagePlaceholder) + '</div>' : '');
    var top = s.imagePosition === 'top';
    card.innerHTML = (top ? pic + '<div style="height:24px"></div>' : '') +
      (s.stat ? '<div class="kit-stat-big">' + s.stat + '</div>' : '') +
      (s.title ? '<h2 class="kit-title kit-title--stat" style="margin-top:' + (top ? '0' : '18px') + '">' + s.title + '</h2>' : '') +
      textEl(s) + (s.source ? '<p class="kit-source">' + s.source + '</p>' : '') + bulletsEl(s.bullets) + (top ? '' : pic) +
      (s.trust ? '<div class="kit-trust">' + s.trust.map(function (t) { return '<div class="kit-trust__item"><span class="kit-trust__icon">' + (t.icon || '👥') + '</span><span>' + t.text + '</span></div>'; }).join('') + '</div>' : '') +
      (s.review ? reviewHtml(s.review, true) : '');
    card.appendChild(ctaBtn(s.cta || 'Continue', false, advance));
    wrap.appendChild(card);
  };
  function reviewHtml(r, inline) {
    return '<div class="kit-review"' + (inline ? ' style="margin-top:20px"' : '') + '><p class="kit-review__title">' + esc(r.title || '') + '</p><div class="kit-review__author">' + stars(r.stars) + '<span>' + esc(r.author || '') + '</span></div><p class="kit-review__text">' + (r.text || '') + '</p></div>';
  }

  RENDER.loader = function (s, wrap) {
    var card = h('div', { class: 'kit-card kit-calc' });
    var steps = s.steps || [{ label: 'Exploring the received data...' }, { label: 'Analyzing your results...' }, { label: 'Sequential analysis...' }, { label: 'Preparing your report...' }];
    card.innerHTML = titleEl(s) + steps.map(function (st, k) {
      return '<div class="kit-calc-item"><div class="kit-calc-text"><span>' + st.label + '</span><span class="kit-calc-pct" data-k="' + k + '"><span class="kit-spin"></span></span></div><div class="kit-calc-line"><div class="kit-calc-line__progress" data-k="' + k + '"></div></div></div>';
    }).join('');
    wrap.appendChild(card);
    if (s.review) { var rc = h('div', { class: 'kit-card' }, reviewHtml(s.review)); wrap.appendChild(rc); }
    var popups = (s.popups || []).slice();
    var k = 0, pct = 0, paused = false;
    function tick() {
      if (paused) return;
      if (k >= steps.length) { clearInterval(iv); if (s.autoAdvance === false) card.appendChild(ctaBtn(s.cta || 'Continue', false, advance)); else state.timers.push(setTimeout(advance, 600)); return; }
      var pop = popups.filter(function (p) { return (p.atStep || 0) === k && (p.atPercent || 50) <= pct && !p._shown; })[0];
      if (pop) { pop._shown = true; paused = true; modal(pop, function () { paused = false; }); return; }
      pct += 100 / ((steps[k].duration || s.stepDuration || 2200) / 60);
      if (pct >= 100) pct = 100;
      card.querySelector('.kit-calc-line__progress[data-k="' + k + '"]').style.width = pct + '%';
      card.querySelector('.kit-calc-pct[data-k="' + k + '"]').textContent = Math.round(pct) + '%';
      if (pct >= 100) { card.querySelector('.kit-calc-pct[data-k="' + k + '"]').innerHTML = '<span class="kit-check" style="width:20px;height:20px;min-width:20px">' + CHECK_SVG + '</span>'; k++; pct = 0; }
    }
    var iv = setInterval(tick, 60); state.timers.push(iv);
    function modal(p, done) {
      var m = h('div', { class: 'kit-modal' });
      var c = h('div', { class: 'kit-modal__content' },
        (p.icon ? '<div class="kit-modal__icon">' + p.icon + '</div>' : '') + (p.title ? '<h3 class="kit-modal__title">' + p.title + '</h3>' : '') + (p.text ? '<p class="kit-modal__text">' + p.text + '</p>' : ''));
      var row = h('div', { class: 'kit-btn-row' });
      (p.buttons || [{ label: 'Continue' }]).forEach(function (b) {
        row.appendChild(ctaBtn(b.label, false, function () { if (p.id && b.value != null) setAnswer(p.id, b.value); m.remove(); done(); }));
      });
      c.appendChild(row); m.appendChild(c); document.body.appendChild(m);
    }
  };

  RENDER.email = function (s, wrap) {
    var card = h('div', { class: 'kit-card kit-email' });
    card.innerHTML = '<h2 class="kit-title">' + (s.title || 'Where Should We Send <span>Your Results?</span>') + '</h2>' +
      '<p class="kit-text" style="margin-bottom:12px">' + (s.subtitle || "We'll send the access to the email below") + '</p>';
    // inputType: 'text' — то же поле для имени и т. п.; preview — HTML-образец, где [[value]] заменяется на введённое (или previewFallback)
    var inp = h('input', { class: 'kit-input', type: s.inputType || 'email', placeholder: s.placeholder || 'Email', autocomplete: s.autocomplete || 'off', maxlength: s.maxLength || null });
    inp.value = state.answers[s.id || 'email'] || '';
    var prev = s.preview ? h('div', { class: 'kit-input-preview' }) : null;
    var renderPrev = function () { if (prev) prev.innerHTML = s.preview.replace(/\[\[value\]\]/g, esc(inp.value.trim() || s.previewFallback || '')); };
    renderPrev();
    var btn = ctaBtn(s.cta || 'Continue', !inp.value, function () { setAnswer(s.id || 'email', inp.value.trim()); advance(); });
    inp.addEventListener('input', function () { btn.disabled = !inp.value.trim(); renderPrev(); });
    if (prev) card.appendChild(prev);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && inp.value.trim()) btn.click(); });
    card.appendChild(inp); card.appendChild(btn);
    card.appendChild(h('p', { class: 'kit-privacy' }, s.privacy || s.disclaimer || 'We respect your privacy. Your email is used only to send your results and updates. Prototype: any value works.'));
    if (s.stats) card.appendChild(h('div', { class: 'kit-stats' }, s.stats.map(function (t) { return '<div class="kit-stats__item"><div class="kit-stats__icon">' + (t.icon || '✓') + '</div><div class="kit-stats__title">' + t.label + '</div><div class="kit-stats__value">' + t.value + '</div></div>'; }).join('')));
    wrap.appendChild(card);
  };

  function gaugeHtml(value, max, label) {
    var v = +value || 0, mx = +max || 10, segs = 28, out = '';
    for (var k = 0; k < segs; k++) {
      var a = Math.PI * (1 - k / (segs - 1)) * 1.2 - Math.PI * 0.1;
      var r1 = 92, r2 = 116, cx = 130, cy = 130;
      var x1 = cx + r1 * Math.cos(a), y1 = cy - r1 * Math.sin(a), x2 = cx + r2 * Math.cos(a), y2 = cy - r2 * Math.sin(a);
      var t = k / (segs - 1), active = t <= v / mx;
      var col = active ? 'hsl(' + Math.round(220 - t * 175) + ',85%,55%)' : '#dfe6f5';
      out += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + col + '" stroke-width="7" stroke-linecap="round"/>';
    }
    return '<div class="kit-gauge"><svg viewBox="0 0 260 175">' + out + '</svg><div class="kit-gauge__value">' + esc(value) + (max ? '/' + esc(max) : '') + '</div><div class="kit-gauge__label">' + esc(label || '') + '</div></div>';
  }
  function rowsHtml(rows) {
    return '<div class="kit-rows">' + rows.map(function (r) {
      return '<div class="kit-row"><span class="kit-row__icon">' + (r.icon || '🧠') + '</span><span class="kit-row__label">' + r.label + '</span>' +
        (r.blurred === false ? '<span class="kit-row__value" style="flex:1;text-align:right">' + esc(r.value) + '</span>' : '<span class="kit-row__bar"></span><span class="kit-row__value kit-blur">' + esc(r.value || '00%') + '</span>') + '</div>';
    }).join('') + '</div>';
  }
  function lockedText(txt, badge) {
    return '<div class="kit-locked"><p class="kit-text kit-blur" style="text-align:left">' + txt + '</p><div class="kit-locked__badge">🔒 ' + esc(badge || 'Unlock full report') + '</div></div>';
  }

  RENDER['result-teaser'] = function (s, wrap) {
    var card = h('div', { class: 'kit-card' });
    card.innerHTML = titleEl(s, 'kit-title--lg') + subEl(s) +
      (s.score ? gaugeHtml(s.score.value, s.score.max, s.score.label) : '') +
      (s.text ? '<p class="kit-text">' + s.text + '</p>' : '') +
      (s.rows ? rowsHtml(s.rows) : '') +
      (s.blurredText ? '<div style="margin-top:16px">' + lockedText(s.blurredText, s.lockLabel) + '</div>' : '');
    card.appendChild(ctaBtn(s.cta || 'See my full result', false, advance));
    wrap.appendChild(card);
  };

  RENDER.paywall = function (s, wrap) {
    var plans = (s.plans && s.plans.items) || [];
    if (!state.plan || !plans.some(function (p) { return p.id === state.plan.id; })) {
      var def = plans.filter(function (p) { return p.id === (s.plans && s.plans.default); })[0] || plans[0] || null;
      state.plan = def ? Object.assign({}, def) : null;
    }
    if (s.offerBar) {
      var bar = h('div', { class: 'kit-offerbar' }, '<span class="acc">' + (s.offerBar.text || 'Get 85% off your program!') + '</span> Offer ends in <span class="kit-tmr">--:--</span>');
      offerSlot.appendChild(bar);
      var left = s.offerBar.timerSeconds || 600;
      var upd = function () { var t = Math.max(0, left), m = String(Math.floor(t / 60)).padStart(2, '0'), sec = String(t % 60).padStart(2, '0'); document.querySelectorAll('.kit-tmr').forEach(function (e) { e.textContent = m + ':' + sec; }); left--; };
      upd(); state.timers.push(setInterval(upd, 1000));
    }
    // s.ctaScroll: кнопки пейволла не ведут дальше, а прокручивают к блоку тарифов (оплата — прямо в нём)
    var toPlans = function () { var el = document.querySelector('.kit-plans, .kit-total-row'); el = el && (el.closest('.kit-pw-section') || el); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    var cta = function (label) { return ctaBtn(label || s.cta || 'Get My Plan', false, s.ctaScroll ? toPlans : advance); };
    var PAY_LABELS = { paypal: 'PayPal', gpay: 'G Pay', card: '💳 Debit or Credit Card', apple: 'Apple Pay' };
    var planTerms = function () { return (state.plan && state.plan.terms) || (s.plans && s.plans.terms) || ''; };
    var sections = {
      result: function () {
        if (!s.result) return null;
        var r = s.result, c = h('div', { class: 'kit-card' });
        c.innerHTML = (r.title ? '<h2 class="kit-title kit-title--lg">' + r.title + '</h2>' : '') + (r.subtitle ? '<p class="kit-subtitle" style="margin-top:0">' + r.subtitle + '</p>' : '') +
          (r.score ? gaugeHtml(r.score.value, r.score.max, r.score.label) : '') + (r.text ? '<p class="kit-text">' + r.text + '</p>' : '') + (r.rows ? rowsHtml(r.rows) : '');
        c.appendChild(cta()); return c;
      },
      report: function () {
        if (!s.report) return null;
        var r = s.report, c = h('div', { class: 'kit-card' });
        c.innerHTML = (r.title ? '<h3 class="kit-pw-h">' + r.title + '</h3>' : '') + (r.rows ? rowsHtml(r.rows) : '') + (r.paragraphs || []).map(function (p) { return lockedText(p, r.lockLabel); }).join('');
        return c;
      },
      inside: function () {
        if (!s.inside) return null;
        var c = h('div', { class: 'kit-card' });
        c.innerHTML = (s.inside.pill ? '<div class="kit-pill-top">' + s.inside.pill + '</div>' : '') + '<h3 class="kit-pw-h">' + (s.inside.title || "What's inside") + '</h3><ul class="kit-list-check">' + s.inside.items.map(function (t) { return '<li>' + checkIcon() + '<span>' + t + '</span></li>'; }).join('') + '</ul>';
        return c;
      },
      benefits: function () {
        if (!s.benefits) return null;
        var c = h('div', { class: 'kit-card' });
        c.innerHTML = s.benefits.map(function (b, k) { return '<div class="kit-benefit"' + (k ? ' style="margin-top:28px"' : '') + '>' + (b.image ? img(b.image, 'kit-image', '') : (b.imagePlaceholder ? '<div class="kit-image-ph">' + esc(b.imagePlaceholder) + '</div>' : '')) + '<h3>' + b.title + '</h3>' + (b.text ? '<p>' + b.text + '</p>' : '') + '</div>'; }).join('');
        return c;
      },
      reviews: function () {
        if (!s.reviews && !s.rating) return null;
        var c = h('div', { class: 'kit-card' }), r = s.rating;
        c.innerHTML = (s.reviewsTitle ? '<h3 class="kit-pw-h">' + s.reviewsTitle + '</h3>' : '') +
          (r ? '<div class="kit-rating"><div class="kit-rating__src"><b>★</b> ' + esc(r.source || 'Trustpilot') + '</div><div class="kit-rating__score">' + esc(r.label || 'Rated 4.5 · Excellent') + '</div><div class="kit-rating__stars"><i>★</i><i>★</i><i>★</i><i>★</i><i>★</i></div></div>' : '') +
          (s.reviews || []).map(function (v) { return '<div class="kit-rev"><div class="kit-rev__head"><span class="kit-rev__ava">' + esc((v.name || '?')[0]) + '</span><div style="flex:1"><div class="kit-rev__name">' + esc(v.name) + '</div><div class="kit-rev__ver">✓ Verified review</div></div>' + stars(v.stars) + '</div>' + (v.title ? '<p class="kit-rev__title">' + v.title + '</p>' : '') + '<p class="kit-rev__text">' + v.text + '</p></div>'; }).join('');
        return c;
      },
      plans: function () {
        if (!plans.length) return null;
        var c = h('div', { class: 'kit-card' });
        // layout 'single' — один тариф, структура как на пейволле test-1: плашка, заголовок, пункты, промокод, «Total due today», способы оплаты, инфо-блоки
        if (s.plans.layout === 'single') {
          var sp = s.plans, pl = plans[0];
          state.plan = Object.assign({}, pl);
          c.innerHTML = (sp.pill ? '<div class="kit-pill-top">' + sp.pill + '</div>' : '') + (sp.title ? '<h3 class="kit-pw-h">' + sp.title + '</h3>' : '') +
            (sp.bullets ? '<ul class="kit-list-check">' + sp.bullets.map(function (t) { return '<li>' + checkIcon() + '<span>' + t + '</span></li>'; }).join('') + '</ul>' : '') +
            (s.promo ? '<div class="kit-promo" style="margin-top:20px"><span style="font-size:22px">🎁</span><div>' + (s.promo.text || '') + (s.promo.sub ? '<small>' + s.promo.sub + '</small>' : '') + '</div></div>' : '') +
            '<div class="kit-total-row"><b>Total due today:</b><span>' + (pl.oldPrice ? '<s>' + pl.oldPrice + '</s> ' : '') + '<b>' + pl.price + '</b></span></div>' +
            '<h4 class="kit-pay-h">Payment method</h4>';
          var pb = h('div', { class: 'kit-paybox' });
          (sp.payMethods || ['paypal', 'apple', 'card']).forEach(function (m) {
            pb.appendChild(h('button', { type: 'button', class: 'kit-pay kit-pay--' + m, onclick: function () { if (s.payAdvance) return advance();
              c.innerHTML = '<div class="kit-success"><div class="kit-success__icon">✅</div><h2 class="kit-title" style="margin-top:12px">Prototype: payment with ' + (PAY_LABELS[m] || m).replace(/^\W+/, '').trim() + '</h2><p class="kit-text">No real payment is made in this prototype.</p></div>'; } }, PAY_LABELS[m] || m));
          });
          c.appendChild(pb);
          (sp.infoBoxes || []).forEach(function (b) { c.appendChild(h('div', { class: 'kit-info-box' }, '<span class="kit-info-box__icon">' + (b.icon || '✓') + '</span><div><b>' + b.title + '</b>' + (b.text || '') + '</div>')); });
          return c;
        }
        c.innerHTML = (s.plans.title ? '<h3 class="kit-pw-h">' + s.plans.title + '</h3>' : '') +
          (s.promo ? '<div class="kit-promo"><span style="font-size:22px">🎁</span><div>' + (s.promo.text || 'Promo code applied') + (s.promo.sub ? '<small>' + s.promo.sub + '</small>' : '') + '</div></div>' : '') +
          (s.offerBar ? '<div class="kit-timer">⏱ This offer ends in <span class="kit-tmr">--:--</span> min</div>' : '');
        var list = h('div', { class: 'kit-plans' });
        plans.forEach(function (p) {
          var b = h('button', { type: 'button', 'data-plan': p.id, class: 'kit-plan' + (state.plan && state.plan.id === p.id ? ' kit-plan--selected' : '') },
            (p.badge ? '<span class="kit-plan__badge">' + p.badge + '</span>' : '') + '<span class="kit-radio"></span>' +
            '<div class="kit-plan__main"><div class="kit-plan__name">' + p.name + '</div>' + (p.note ? '<div class="kit-plan__note">' + p.note + '</div>' : '') + (p.save ? '<span class="kit-plan__save">' + p.save + '</span>' : '') + '</div>' +
            '<div class="kit-plan__price">' + (p.oldPrice ? '<div class="kit-plan__old">' + p.oldPrice + '</div>' : '') + '<div class="kit-plan__now">' + p.price + '</div>' + (p.per ? '<div class="kit-plan__per">' + p.per + '</div>' : '') + '</div>');
          // выбор синхронизируется во всех блоках тарифов на странице; условия (p.terms) меняются под выбранный план
          b.addEventListener('click', function () {
            state.plan = Object.assign({}, p);
            document.querySelectorAll('.kit-plan[data-plan]').forEach(function (e) { e.classList.toggle('kit-plan--selected', e.getAttribute('data-plan') === p.id); });
            document.querySelectorAll('.kit-plan-terms').forEach(function (e) { e.innerHTML = planTerms(); });
          });
          list.appendChild(b);
        });
        c.appendChild(list);
        if (s.plans.terms || plans.some(function (p) { return p.terms; })) c.appendChild(h('p', { class: 'kit-plan-terms' }, planTerms()));
        // s.plans.payMethods: способы оплаты прямо под тарифами вместо кнопки (порядок как в массиве)
        if (s.plans.payMethods) {
          var pay = h('div', { class: 'kit-paybox' });
          s.plans.payMethods.forEach(function (m) {
            pay.appendChild(h('button', { type: 'button', class: 'kit-pay kit-pay--' + m, onclick: function () { if (s.payAdvance) return advance();
              c.innerHTML = '<div class="kit-success"><div class="kit-success__icon">✅</div><h2 class="kit-title" style="margin-top:12px">Prototype: payment with ' + (PAY_LABELS[m] || m).replace(/^\W+/, '').trim() + '</h2><p class="kit-text">' + esc((state.plan && state.plan.name) || '') + ' · no real payment is made in this prototype.</p></div>';
            } }, PAY_LABELS[m] || m));
          });
          c.appendChild(pay);
        } else c.appendChild(cta());
        return c;
      },
      guarantee: function () {
        if (!s.guarantee) return null;
        var g = h('div', { class: 'kit-card kit-guarantee' }, '<div class="kit-guarantee__seal">🛡️</div><h3>' + (s.guarantee.title || '30-Day Money-Back Guarantee') + '</h3><div>' + (s.guarantee.text || '') + '</div>');
        if (s.guarantee.cta) g.appendChild(ctaBtn(s.guarantee.cta, false, s.ctaScroll ? toPlans : advance));
        return g;
      },
      faq: function () {
        if (!s.faq) return null;
        return h('div', { class: 'kit-card kit-faq' }, '<h3 class="kit-pw-h">' + (s.faqTitle || 'Frequently asked questions') + '</h3>' + s.faq.map(function (q) { return '<details><summary>' + q.q + '</summary><p>' + q.a + '</p></details>'; }).join(''));
      },
      cta: function () {
        var c = h('div'); c.appendChild(cta(s.finalCta)); if (s.footerNote) c.appendChild(h('p', { class: 'kit-footer-note' }, s.footerNote)); return c;
      }
    };
    // footerNote без финальной кнопки (если в order нет 'cta')
    sections.note = function () { return s.footerNote ? h('p', { class: 'kit-footer-note' }, s.footerNote) : null; };
    // свои блоки: blocks: { about: { title?, html } } → имя 'about' в order
    var make = function (name) {
      if (sections[name]) return sections[name]();
      var b = s.blocks && s.blocks[name];
      return b ? h('div', { class: 'kit-card' + (b.cls ? ' ' + b.cls : '') }, (b.title ? '<h3 class="kit-pw-h">' + b.title + '</h3>' : '') + (b.html || '')) : null;
    };
    var order = s.order || ['result', 'report', 'inside', 'benefits', 'reviews', 'plans', 'guarantee', 'faq', 'cta'];
    order.forEach(function (name) {
      // 'inside+plans' — несколько блоков в одной карточке
      var parts = String(name).split('+').map(make).filter(Boolean), el = parts[0];
      parts.slice(1).forEach(function (p) { var sep = h('div', { class: 'kit-pw-join' }); el.appendChild(sep); while (p.firstChild) el.appendChild(p.firstChild); });
      if (el) { el.classList.add('kit-pw-section'); wrap.appendChild(el); }
    });
  };

  RENDER['checkout-stub'] = function (s, wrap) {
    var p = state.plan || {};
    var card = h('div', { class: 'kit-card' });
    card.innerHTML = titleEl(s) + subEl(s) +
      '<div class="kit-total"><span class="kit-total__label">' + (s.totalLabel || 'Total due today:') + '</span><span class="kit-total__price">' + (p.oldPrice ? '<s>' + p.oldPrice + '</s>' : '') + '<b>' + esc(p.price || s.price || '') + '</b>' + (s.saveLabel ? '<br><span class="kit-save">' + s.saveLabel + '</span>' : '') + '</span></div>' +
      (s.terms || p.terms ? '<p class="kit-plan-terms">' + (s.terms || p.terms) + '</p>' : '') +
      '<h4 style="margin:18px 0 0;font-size:16px">Payment method</h4>';
    var methods = s.methods || ['paypal', 'gpay', 'card'];
    var labels = { paypal: 'PayPal', gpay: 'G Pay', card: '💳 Debit or Credit Card', apple: ' Pay' };
    var done = function () { card.innerHTML = '<div class="kit-success"><div class="kit-success__icon">✅</div><h2 class="kit-title" style="margin-top:12px">' + (s.successTitle || 'Prototype: payment step') + '</h2><p class="kit-text">' + (s.successText || 'No real payment is made in this prototype.') + '</p></div>'; card.appendChild(ctaBtn('Restart prototype', false, restart, 'kit-btn--outline')); };
    methods.forEach(function (m) { card.appendChild(h('button', { type: 'button', class: 'kit-pay kit-pay--' + m, onclick: done }, labels[m] || m)); });
    (s.infoBoxes || [{ icon: '✓', title: 'No commitment.', text: 'Cancel anytime' }]).forEach(function (b) {
      card.appendChild(h('div', { class: 'kit-info-box' }, '<span class="kit-info-box__icon">' + (b.icon || '✓') + '</span><div><b>' + b.title + '</b>' + (b.text || '') + '</div>'));
    });
    wrap.appendChild(card);
  };

  /* ---------- start ---------- */
  window.KIT = { get answers() { return state.answers; }, get result() { return state.result; }, get plan() { return state.plan; }, go: go, back: back, restart: restart, next: advance, screens: screens };
  var start = 0;
  try { var hsh = decodeURIComponent(location.hash.slice(1)); if (hsh) { var n = indexOf(hsh); if (n < 0 && /^\d+$/.test(hsh)) n = +hsh - 1; if (n >= 0 && n < screens.length) start = n; } } catch (e) { /* ignore */ }
  show(start);
})();
