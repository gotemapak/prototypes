/* Воронка «Деменция» v4 — подсчёт риска и тексты отчёта. Общий файл для квиза (funnel.js) и PDF (../report/report.html).
   Логика — ../logic.md, раздел 2. */
(function (root) {
  // Правильные ответы. q7 (припоминание слова) весит 2 балла, остальные по 1. Максимум 12.
  var KEY = {
    q2: '79', q3: 'Eating', q4: 'square', q5: 'some-mammals', q6: '45', q7: 'Train',
    q8: '7294', q9: 'Scarce', q10: '3:00', q11: '2', q12: '45+8'
  };
  var WEIGHT = { q7: 2 };
  var AREAS = [
    { id: 'memory', name: 'Memory', icon: '🧠', items: ['q7', 'q8'] },
    { id: 'focus', name: 'Focus', icon: '🎯', items: ['q2', 'q12'] },
    { id: 'logic', name: 'Logic', icon: '🧩', items: ['q4', 'q5', 'q6', 'q10', 'q11'] },
    { id: 'language', name: 'Language', icon: '💬', items: ['q3', 'q9'] }
  ];
  var TOP_ORDER = ['logic', 'language', 'focus', 'memory'];     // при равенстве для сильной стороны
  var FOCUS_ORDER = ['memory', 'focus', 'language', 'logic'];   // при равенстве для зон роста
  var HABITS = [
    { id: 'q13', key: 'sleep' }, { id: 'q14', key: 'social' }, { id: 'q15', key: 'movement' }
  ];

  var LEVELS = {
    low:      { id: 'low', label: 'Low risk', color: '#1e9e6a', soft: '#e6f6ee', ink: '#0f6b45' },
    mild:     { id: 'mild', label: 'Mild risk', color: '#8bbf2a', soft: '#f1f8e2', ink: '#4f7310' },
    moderate: { id: 'moderate', label: 'Moderate risk', color: '#f0a020', soft: '#fff4e0', ink: '#8a5600' },
    elevated: { id: 'elevated', label: 'Elevated risk', color: '#e8603c', soft: '#fdece6', ink: '#a33a1b' }
  };
  function levelFor(risk) { return risk <= 3 ? 'low' : risk <= 5 ? 'mild' : risk <= 7 ? 'moderate' : 'elevated'; }

  function weight(id) { return WEIGHT[id] || 1; }
  function correct(answers, id) { return answers[id] != null && String(answers[id]) === KEY[id]; }
  function habitPoints(v) { v = +v; return !v ? 1 : v >= 4 ? 0 : v === 3 ? 1 : 2; } // skip/нет ответа = Neutral

  function scoring(answers) {
    answers = answers || {};
    var points = 0;
    Object.keys(KEY).forEach(function (id) { if (correct(answers, id)) points += weight(id); });

    var areas = AREAS.map(function (a) {
      var max = 0, got = 0;
      a.items.forEach(function (id) { max += weight(id); if (correct(answers, id)) got += weight(id); });
      return { id: a.id, name: a.name, icon: a.icon, got: got, max: max, pct: Math.round(got / max * 100) };
    });
    var byId = {}; areas.forEach(function (a) { byId[a.id] = a; });
    var top = TOP_ORDER.slice().sort(function (x, y) { return byId[y].pct - byId[x].pct || TOP_ORDER.indexOf(x) - TOP_ORDER.indexOf(y); })[0];
    var allPerfect = areas.every(function (a) { return a.pct === 100; });
    var focus = allPerfect ? ['memory', 'focus'] : FOCUS_ORDER.filter(function (id) { return id !== top; })
      .sort(function (x, y) { return byId[x].pct - byId[y].pct || FOCUS_ORDER.indexOf(x) - FOCUS_ORDER.indexOf(y); }).slice(0, 2);

    var lifestyle = 0, weakHabits = [];
    HABITS.forEach(function (hb) { var p = habitPoints(answers[hb.id]); lifestyle += p; if (p === 2) weakHabits.push(hb.key); });

    var cognitive = 1 + Math.round(7 * (12 - points) / 12);
    var risk = Math.min(10, cognitive + Math.round(lifestyle / 3));
    var level = levelFor(risk);

    var g = answers.gender === 'male' ? 'male' : 'female';
    var age = answers.age || '70-79';
    var ageLabel = age === '80+' ? '80+' : age === '18-49' ? '18–49' : age.replace('-', '–');
    return {
      points: points, maxPoints: 12, cognitive: cognitive, lifestyle: lifestyle, risk: risk,
      level: level, levelLabel: LEVELS[level].label, levelColor: LEVELS[level].color, levelSoft: LEVELS[level].soft, levelInk: LEVELS[level].ink,
      areas: areas, topId: top, topArea: byId[top].name, focusIds: focus,
      focusAreas: focus.map(function (id) { return byId[id].name; }).join(' and '),
      focusShort: focus.map(function (id) { return byId[id].name; }).join(' · '),
      weakHabits: weakHabits, good: level === 'low' || level === 'mild',
      g: g, genderPlural: g === 'male' ? 'men' : 'women', genderNoun: g === 'male' ? 'Man' : 'Woman',
      ageBracket: ageLabel, name: (answers.name || '').trim(),
      habits: habitCards(answers)
    };
  }

  // Синтетические ответы для предпросмотра каждого уровня (проверено: low 2, mild 4, moderate 6, elevated 8)
  var MISS = { low: ['q12'], mild: ['q7', 'q2'], moderate: ['q7', 'q8', 'q2', 'q11'], elevated: ['q7', 'q8', 'q2', 'q12', 'q3', 'q5', 'q11'] };
  var HAB = { low: [4, 4, 3], mild: [2, 4, 3], moderate: [2, 3, 2], elevated: [1, 1, 1] };
  var HOBBY_SAMPLE = { low: ['reading', 'gardening'], mild: ['music'], moderate: ['none'], elevated: ['none'] };
  var ROUTINE_SAMPLE = { low: ['puzzles', 'reading'], mild: ['reading'], moderate: ['supplements'], elevated: ['nothing'] };
  function answersForLevel(level, gender, age) {
    var a = { gender: gender || 'female', age: age || '70-79' };
    Object.keys(KEY).forEach(function (id) { a[id] = (MISS[level] || []).indexOf(id) > -1 ? 'wrong' : KEY[id]; });
    HABITS.forEach(function (hb, k) { a[hb.id] = (HAB[level] || HAB.low)[k]; });
    a.q16 = HOBBY_SAMPLE[level] || []; a.q17 = ROUTINE_SAMPLE[level] || [];
    a.name = a.gender === 'male' ? 'Robert' : 'Linda';
    return a;
  }

  /* ---------- тексты отчёта (английский, 55+) ---------- */
  // Шаги одинаковые для всех: приложение → повтор через 4 недели → третий шаг по уровню
  var STEP_APP = 'Start training your memory with the [Company] app — 5 minutes of brain games a day, with extra focus on {focus}.';
  var STEP_RETAKE = 'Retake this check-in in 4 weeks and compare your result.';
  var REPORT = {
    low: {
      title: 'Your memory and thinking look sharp.',
      intro: 'Your answers show strong memory, focus, and reasoning for a quick check-in like this. There are no signs of concern in the areas we checked. Your strongest area is {top}.',
      steps: [STEP_APP, STEP_RETAKE, 'Keep your mind busy with something new each week: a game, a recipe, a new route for your walk.']
    },
    mild: {
      title: 'Your result is in the healthy range, with room to grow.',
      intro: 'Most of your answers were strong. A few slips in {focus} are common and often come from tiredness, stress, or rushing. Small daily practice is the easiest way to keep these areas sharp.',
      steps: [STEP_APP, STEP_RETAKE, 'Notice your everyday moments: names, keys, following a conversation. Write down anything that feels harder than usual.']
    },
    moderate: {
      title: 'Some areas need more attention.',
      intro: 'Your answers show that some areas — especially {focus} — were harder for you today. A single check-in can be affected by sleep, stress, or simply a busy day, so this is a signal to keep an eye on, not a conclusion.',
      steps: [STEP_APP, STEP_RETAKE, 'If you or your family have noticed changes in memory or everyday tasks, it’s a good idea to mention it at your next doctor’s visit.']
    },
    elevated: {
      title: 'This check-in was harder for you today.',
      intro: 'Many of today’s questions were difficult, especially in {focus}. This can happen for many reasons — poor sleep, stress, medication, or not feeling well. This check-in is not a diagnosis, but your result is worth taking seriously.',
      steps: [STEP_APP, STEP_RETAKE, 'We recommend talking to your doctor about your memory and thinking, and sharing this report with them.']
    }
  };
  var AREA_TEXT = {
    memory: { strong: 'You remember new information well, even after a delay.', grow: 'Short memory games help you hold on to names, lists, and details.' },
    focus: { strong: 'You keep track of numbers and steps without losing your place.', grow: 'Focus training helps you follow conversations and finish tasks without distractions.' },
    logic: { strong: 'You spot patterns and solve problems quickly.', grow: 'Pattern puzzles keep your reasoning quick and flexible.' },
    language: { strong: 'You find the right words easily.', grow: 'Word games help you find the right word faster.' }
  };
  // Вопросы 16–17: хобби и как человек сейчас держит мозг в тонусе (варианты — как в funnel.js)
  var HOBBIES = { reading: 'reading', gardening: 'gardening or crafts', music: 'music', dancing: 'walking or dancing' };
  var ACTIVE_ROUTINE = ['puzzles', 'apps'];
  var ROUTINE = { reading: 'reading', puzzles: 'puzzles', apps: 'brain games', supplements: 'taking vitamins' };
  function list(arr) { return arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]; }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function arr(v) { return Array.isArray(v) ? v : v ? [v] : []; }
  var HABIT_CARDS = {
    sleep: { icon: '😴', title: 'Sleep',
      keep: 'You sleep well most nights. Keep a steady bedtime — sleep helps your brain store memories from the day.',
      tryIt: 'Aim for 7–8 hours. Go to bed at the same time each night, and keep screens away for the last 30 minutes.' },
    social: { icon: '👥', title: 'Time with people',
      keep: 'You stay close to friends and family. Keep it up — conversation is one of the best workouts for memory.',
      tryIt: 'Plan one call or visit with friends or family each week. Conversation is one of the best workouts for memory.' },
    movement: { icon: '🚶', title: 'Movement',
      keep: 'You stay active most weeks. Keep moving — activity supports blood flow to the brain.',
      tryIt: 'A 20-minute walk most days supports blood flow to the brain. Start with what feels easy.' }
  };
  function habitCards(a) {
    var cards = HABITS.map(function (hb) {
      var c = HABIT_CARDS[hb.key], ok = habitPoints(a[hb.id]) === 0;
      return { icon: c.icon, title: c.title, status: ok ? 'Keep it up' : 'Try this', ok: ok, text: ok ? c.keep : c.tryIt };
    });
    var routine = arr(a.q17).filter(function (v) { return ROUTINE[v]; });
    var hobbies = arr(a.q16).filter(function (v) { return HOBBIES[v]; });
    var active = routine.some(function (v) { return ACTIVE_ROUTINE.indexOf(v) > -1; });
    var hobbyLine = hobbies.length ? (hobbies.length > 1 ? ' Your hobbies — ' : ' Your hobby — ') + list(hobbies.slice(0, 2).map(function (v) { return HOBBIES[v]; })) + (hobbies.length > 1 ? ' — also keep' : ' — also keeps') + ' your mind engaged.' : '';
    var text = active
      ? 'You already train your brain with ' + list(routine.map(function (v) { return ROUTINE[v]; })) + '. Add variety — new kinds of tasks work your brain harder than the same puzzle every day.' + hobbyLine
      : routine.length
        ? cap(list(routine.map(function (v) { return ROUTINE[v]; }))) + (routine.length > 1 ? ' are' : ' is') + ' a good start. Add 5 minutes a day of active practice — games that make you remember, count, and plan.' + hobbyLine
        : 'Start with 5 minutes a day of something new for your brain — a memory game, a word quiz, or a few words of a new language.' + hobbyLine;
    cards.push({ icon: '🧩', title: 'Your brain routine', status: active ? 'Keep it up' : 'Try this', ok: active, text: text });
    return cards;
  }

  var HABIT_TEXT = {
    sleep: { title: 'Sleep', text: 'Aim for 7–8 hours. Good sleep helps your brain store memories from the day.' },
    social: { title: 'Time with people', text: 'Plan one call or visit with friends or family each week. Conversation is one of the best workouts for memory.' },
    movement: { title: 'Movement', text: 'A 20-minute walk most days supports blood flow to the brain. Start with what feels easy.' },
    allGood: 'Your sleep, social life, and activity all support a healthy brain. Keep it up.'
  };
  // Игры приложения (BP-989): One Line, Memo, Fast Math, Dots, Water Sort, Cross Math, Pair Tiles, Numbers, Tower of Hanoi, QuizLab
  var GAMES = {
    memory: [{ name: 'Memo', what: 'remember and recall' }, { name: 'Pair Tiles', what: 'find matching pairs' }],
    focus: [{ name: 'Dots', what: 'keep your attention steady' }, { name: 'Fast Math', what: 'quick counting' }, { name: 'Numbers', what: 'track numbers in order' }],
    logic: [{ name: 'One Line', what: 'plan your path' }, { name: 'Water Sort', what: 'think a few steps ahead' }, { name: 'Tower of Hanoi', what: 'solve step by step' }],
    language: [{ name: 'QuizLab', what: 'word and general-knowledge quizzes' }]
  };
  var PLAN = {
    low: { title: 'Keep your edge', minutes: '5 minutes a day', intro: 'Your plan keeps all 4 areas busy, with a little extra for {focus}.',
      days: ['f1', 'f2', 'top', 'lang', 'f1', 'mix', { task: 'Rest day', text: 'Take a walk and call a friend.' }] },
    mild: { title: 'Build up your weaker areas', minutes: '5 minutes a day', intro: 'Most days go to {focus}, the areas with the most room to grow.',
      days: ['f1', 'f2', 'f1', 'f2', 'mix', 'f1', { task: 'Look back', text: 'Write down 3 moments this week when your memory worked well.' }] },
    moderate: { title: 'Steady daily practice', minutes: '10 minutes a day — two short sessions', intro: 'Short, regular practice for {focus}. Two 5-minute sessions are easier than one long one.',
      days: ['f1', 'f2', 'f1', 'f2', 'f1', 'mix', { task: 'Look back together', text: 'Ask someone close: has anything felt easier or harder this week?' }] },
    elevated: { title: 'Gentle daily practice', minutes: '5 minutes a day', intro: 'Start gently with {focus}, and take care of the most important step first.',
      days: [{ task: 'Talk to your doctor', text: 'Book a visit and bring this report with you.' }, 'f1', 'f2', 'f1', 'f2', 'mix', { task: 'Share your report', text: 'Show this report to someone you trust.' }] }
  };
  function planDays(r) {
    var used = {};
    function game(area) { var g = GAMES[area], k = used[area] || 0; used[area] = k + 1; return g[k % g.length]; }
    var nameOf = {}; r.areas.forEach(function (a) { nameOf[a.id] = a.name; });
    return PLAN[r.level].days.map(function (d, i) {
      if (typeof d === 'object') return { day: i + 1, area: '', title: d.task, text: d.text };
      if (d === 'mix') return { day: i + 1, area: 'All areas', title: 'Daily Training', text: '4 short games, one for each area' };
      var area = d === 'f1' ? r.focusIds[0] : d === 'f2' ? r.focusIds[1] : d === 'top' ? r.topId : 'language';
      var g = game(area);
      return { day: i + 1, area: nameOf[area], title: g.name, text: g.what };
    });
  }
  var DISCLAIMER = 'This check-in is for general information and personal wellness only. It is not a medical test and does not diagnose any condition. If you are worried about your memory, please talk to a healthcare professional.';

  // Зоны роста всегда помечены как «to strengthen» (или «keep sharp», если там 80%+), остальные — по проценту
  function areaStatus(pct, isFocus) { return isFocus ? (pct >= 80 ? 'keep sharp' : 'to strengthen') : pct >= 80 ? 'strength' : 'solid'; }

  root.DEM = { KEY: KEY, AREAS: AREAS, LEVELS: LEVELS, scoring: scoring, answersForLevel: answersForLevel,
    REPORT: REPORT, AREA_TEXT: AREA_TEXT, HABIT_TEXT: HABIT_TEXT, GAMES: GAMES, PLAN: PLAN, planDays: planDays, DISCLAIMER: DISCLAIMER, areaStatus: areaStatus };
})(typeof window !== 'undefined' ? window : globalThis);
