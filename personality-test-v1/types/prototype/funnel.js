/* [Company] — воронка «Тип личности» v1, прототип на kit.
   Методика — ../scoring.md. Этот же файл грузит ../scoring_check.js (Node), поэтому
   ITEMS, TYPES и scoring() здесь — единственный источник правды. */
(function (root) {
  'use strict';

  /* ---------- шкалы ---------- */
  // plus — полюс, к которому ведёт ответ «Strongly agree» на прямом пункте.
  var SCALES = [
    { key: 'energy', label: 'Energy', plus: { code: 'S', word: 'Social' },     minus: { code: 'Q', word: 'Quiet' },    tieDefault: 'minus' },
    { key: 'mind',   label: 'Mind',   plus: { code: 'V', word: 'Visionary' },  minus: { code: 'G', word: 'Grounded' }, tieDefault: 'minus' },
    { key: 'heart',  label: 'Decisions', plus: { code: 'L', word: 'Logic' },   minus: { code: 'H', word: 'Heart' },    tieDefault: 'minus' },
    { key: 'life',   label: 'Lifestyle', plus: { code: 'P', word: 'Planner' }, minus: { code: 'F', word: 'Flexible' }, tieDefault: 'plus' }
  ];

  /* ---------- 24 пункта: 6 на шкалу, 3 прямых (+1) и 3 обратных (−1) ---------- */
  // Порядок показа — чередование шкал A B C D, прямые и обратные вперемешку.
  var ITEMS = [
    { id: 'q01', scale: 'energy', key: 1,  text: 'I feel energized after spending time with a group of people.' },
    { id: 'q02', scale: 'mind',   key: 1,  text: 'I often wonder “what if” and imagine how things could be different.' },
    { id: 'q03', scale: 'heart',  key: 1,  text: 'When I make a decision, facts matter more to me than feelings.' },
    { id: 'q04', scale: 'life',   key: 1,  text: 'I like to plan my day before it starts.' },
    { id: 'q05', scale: 'energy', key: -1, text: 'After a busy social day, I need quiet time to recharge.' },
    { id: 'q06', scale: 'mind',   key: -1, text: 'I trust experience and proven ways more than new theories.' },
    { id: 'q07', scale: 'heart',  key: -1, text: 'I often put other people’s needs ahead of my own.' },
    { id: 'q08', scale: 'life',   key: -1, text: 'I am happy to change plans at the last minute.' },
    { id: 'q09', scale: 'energy', key: 1,  text: 'I find it easy to start a conversation with someone new.' },
    { id: 'q10', scale: 'mind',   key: 1,  text: 'I enjoy questions and puzzles that have no easy answer.' },
    { id: 'q11', scale: 'heart',  key: 1,  text: 'I can stay calm and clear-headed when others get emotional.' },
    { id: 'q12', scale: 'life',   key: 1,  text: 'I feel uneasy when things are left unfinished.' },
    { id: 'q13', scale: 'energy', key: -1, text: 'I prefer one close friend to a big circle of friends.' },
    { id: 'q14', scale: 'mind',   key: -1, text: 'I notice practical details that other people miss.' },
    { id: 'q15', scale: 'heart',  key: -1, text: 'I feel other people’s pain almost as if it were my own.' },
    { id: 'q16', scale: 'life',   key: -1, text: 'I prefer to keep my options open rather than decide early.' },
    { id: 'q17', scale: 'energy', key: 1,  text: 'I enjoy being the one who tells the stories at the table.' },
    { id: 'q18', scale: 'mind',   key: 1,  text: 'I easily see connections between things that seem unrelated.' },
    { id: 'q19', scale: 'heart',  key: 1,  text: 'I would rather hear a hard truth than a kind half-truth.' },
    { id: 'q20', scale: 'life',   key: 1,  text: 'I keep my things in their place.' },
    { id: 'q21', scale: 'energy', key: -1, text: 'I think things through before I say them out loud.' },
    { id: 'q22', scale: 'mind',   key: -1, text: 'I prefer clear facts to big ideas.' },
    { id: 'q23', scale: 'heart',  key: -1, text: 'Keeping the peace matters more to me than winning an argument.' },
    { id: 'q24', scale: 'life',   key: -1, text: 'I often start things on a whim.' }
  ];

  /* ---------- зоны тренировки [Company] (реальные категории игр: Logic / Memorization / Math / Focus) ---------- */
  // Шкала Mind задаёт первую зону, Lifestyle — вторую. Третья неделя — зона из целей, четвёртая — смесь всех четырёх.
  var ZONE_BY_LETTER = {
    V: { strength: 'Big-picture thinking', zone: 'Memorization', why: 'Big-picture minds race ahead and let small details slip. Short memory games keep names, dates and lists close at hand.' },
    G: { strength: 'Memory for details', zone: 'Logic', why: 'Detail-minded people rely on proven routines. Logic puzzles train the mind to find new patterns when routines change.' },
    P: { strength: 'Focus', zone: 'Math', why: 'Planners think best on a set path. Quick mental math trains speed and working memory, so the mind adapts fast when plans change.' },
    F: { strength: 'Flexibility', zone: 'Focus', why: 'Flexible minds jump between ideas. Attention games help you stay with one task until it is done.' }
  };
  var ZONES = ['Logic', 'Memorization', 'Math', 'Focus'];
  var GOAL_ZONE = { memory: 'Memorization', words: 'Memorization', focus: 'Focus', calm: 'Focus', problems: 'Logic', speed: 'Math' };

  /* ---------- распространённость 16 типов в США, % ----------
     Оценки по национальной выборке MBTI Form M (n = 3 009): MBTI Manual, 3rd ed., Myers, McCaulley, Quenk, Hammer, 1998.
     Наши буквы → классические: S/Q = E/I, V/G = N/S, L/H = T/F, P/F = J/P. */
  var PREVALENCE = {
    QGHP: 13.8, SGHP: 12.3, QGLP: 11.6, QGHF: 8.8, SGLP: 8.7, SGHF: 8.5, SVHF: 8.1, QGLF: 5.4,
    QVHF: 4.4, SGLF: 4.3, QVLF: 3.3, SVLF: 3.2, SVHP: 2.5, QVLP: 2.1, SVLP: 1.8, QVHP: 1.5
  };
  var CLASSIC = { S: 'E', Q: 'I', V: 'N', G: 'S', L: 'T', H: 'F', P: 'J', F: 'P' };
  var FROM_CLASSIC = [{ E: 'S', I: 'Q' }, { N: 'V', S: 'G' }, { T: 'L', F: 'H' }, { J: 'P', P: 'F' }];

  /* ---------- тексты глав, которые зависят от пары шкал ---------- */
  // «How you make decisions»: Decisions (L/H) + Lifestyle (P/F)
  var DECIDE = {
    LP: 'You decide with your head and like to settle things early. You weigh the facts, make a plan and stick to it. Watch for: deciding before you have heard everyone out.',
    LF: 'You weigh the facts but keep your options open until the last moment. You are good at changing course when new information appears. Watch for: putting off a choice that is already clear.',
    HP: 'You decide with your heart and like to have things settled. You think about how a choice will affect the people you love, then you commit. Watch for: saying yes to keep the peace when you mean no.',
    HF: 'You follow your values and your gut, and you like room to change your mind. Watch for: letting a decision drift until someone else makes it for you.'
  };
  // «Relationships and communication»: Energy (S/Q) + Decisions (L/H)
  var RELATE = {
    SL: 'You are lively and direct. People always know where they stand with you, and you enjoy a good debate. Your loved ones may sometimes need more warmth than facts.',
    SH: 'You are warm and easy to talk to. You make friends quickly and remember what matters to them. Make sure your own needs get heard, too.',
    QL: 'You are calm, honest and say what you mean in few words. People trust your advice. Others may read your quiet as distance, so a small kind word goes a long way.',
    QH: 'You are a gentle, loyal listener with a few deep friendships. People open up to you. Share your own feelings more often — the people close to you want to hear them.'
  };

  /* ---------- 16 типов ---------- */
  // Код: Energy (S/Q) + Mind (V/G) + Decisions (L/H) + Lifestyle (P/F).
  var TYPES = {
    QVLP: { name: 'The Strategist', emoji: '♟️', tagline: 'Sees ten moves ahead.',
      desc: 'You think in long-term plans and quietly work out the best way to get there. People trust your judgment when the stakes are high.',
      strengths: ['Long-range thinking', 'Independent judgment', 'Calm under pressure'],
      blind: ['Can seem distant when focused on a plan', 'Finds it hard to let go of “the right way”'],
      mind: 'Your mind builds systems: it links ideas into a plan and then sticks to it. The risk is that a fixed plan makes the mind less nimble over time.' },
    QVLF: { name: 'The Inventor', emoji: '💡', tagline: 'Always asking “how does it work?”',
      desc: 'You love ideas for their own sake and enjoy taking problems apart. You often find a clever solution nobody else saw.',
      strengths: ['Original ideas', 'Logical analysis', 'Curiosity that never retires'],
      blind: ['Leaves many projects half-finished', 'Forgets everyday details while deep in thought'],
      mind: 'Your mind jumps from idea to idea and spots hidden patterns. The flip side: attention drifts, and unfinished thoughts pile up.' },
    SVLP: { name: 'The Captain', emoji: '🧭', tagline: 'Takes charge and gets it done.',
      desc: 'You see where things should go and bring people with you. Family and friends often look to you to make the call.',
      strengths: ['Clear decisions', 'Natural leadership', 'Turning ideas into action'],
      blind: ['Can push too hard and too fast', 'May not notice when others feel overruled'],
      mind: 'Your mind is fast and goal-driven: it sets a target and pushes toward it. Keeping it flexible helps you adapt when life changes the plan.' },
    SVLF: { name: 'The Innovator', emoji: '🚀', tagline: 'Full of ideas and quick comebacks.',
      desc: 'You enjoy a lively debate and new ways of doing things. Routine bores you, but a fresh challenge wakes you up.',
      strengths: ['Quick wit', 'Creative problem solving', 'Bold thinking'],
      blind: ['Gets bored with routine and loses focus', 'Can argue for fun and hurt feelings'],
      mind: 'Your mind loves novelty and speed. Without a challenge it gets restless — and focus is the first thing to slip.' },
    QVHP: { name: 'The Guide', emoji: '🕯️', tagline: 'Understands people deeply.',
      desc: 'You read people well and care about doing what is right. Others come to you for quiet, wise advice.',
      strengths: ['Deep insight', 'Strong values', 'Thoughtful planning'],
      blind: ['Takes on other people’s worries', 'Sets very high standards for yourself'],
      mind: 'Your mind connects feelings, meaning and long-term goals. It works best when it is rested and clear — and needs sharp recall to keep up.' },
    QVHF: { name: 'The Dreamer', emoji: '🌙', tagline: 'Guided by imagination and heart.',
      desc: 'You live by your values and see beauty and meaning others miss. Your inner world is rich and full of stories.',
      strengths: ['Imagination', 'Empathy', 'Loyalty to what matters'],
      blind: ['Gets lost in thought and loses track of time', 'Avoids conflict even when it matters'],
      mind: 'Your mind wanders to possibilities and memories. That is a gift for creativity — and a reason to train focus and short-term memory.' },
    SVHP: { name: 'The Mentor', emoji: '🌱', tagline: 'Brings out the best in others.',
      desc: 'You naturally encourage people and help them grow. You remember what matters to everyone around you.',
      strengths: ['Warmth and encouragement', 'Organizing people', 'Seeing potential'],
      blind: ['Puts everyone else first and gets tired', 'Takes criticism to heart'],
      mind: 'Your mind keeps track of many people and plans at once. Staying sharp means keeping names, details and plans at your fingertips.' },
    SVHF: { name: 'The Spark', emoji: '✨', tagline: 'Lights up every room.',
      desc: 'You are enthusiastic, curious and full of new plans. Your energy makes life more fun for everyone around you.',
      strengths: ['Enthusiasm', 'Creativity', 'Making friends easily'],
      blind: ['Starts more than you finish', 'Lets details and dates slip'],
      mind: 'Your mind jumps between ideas and people with ease. The challenge is finishing what you start and holding on to the details.' },
    QGLP: { name: 'The Anchor', emoji: '⚓', tagline: 'Steady, reliable, always prepared.',
      desc: 'You keep your word and do things properly. When others panic, you are the one who stays calm and has a plan.',
      strengths: ['Reliability', 'Attention to detail', 'Strong sense of duty'],
      blind: ['Can resist new ways of doing things', 'Keeps feelings to yourself'],
      mind: 'Your mind is precise and organized and trusts what has worked before. Fresh puzzles keep it from getting stuck in old tracks.' },
    QGHP: { name: 'The Keeper', emoji: '🏡', tagline: 'Quietly takes care of everyone.',
      desc: 'You remember birthdays, notice when someone is upset and keep the home running. People feel safe around you.',
      strengths: ['Care for others', 'Memory for what matters', 'Patience'],
      blind: ['Rarely asks for help', 'Worries when routines change'],
      mind: 'Your mind holds a map of people, routines and memories. Gentle variety keeps it flexible as routines change with age.' },
    SGLP: { name: 'The Organizer', emoji: '📋', tagline: 'Makes things run smoothly.',
      desc: 'You like order, clear rules and getting results. You are the one who gets the family trip or the club meeting organized.',
      strengths: ['Practical sense', 'Getting things done', 'Clear communication'],
      blind: ['Can be impatient with slower people', 'Likes control and finds surprises stressful'],
      mind: 'Your mind is quick with facts and plans. When the unexpected happens, a flexible mind helps you adjust without stress.' },
    SGHP: { name: 'The Host', emoji: '🍽️', tagline: 'Brings people together.',
      desc: 'You are warm, social and make everyone feel welcome. You keep traditions alive and people connected.',
      strengths: ['Hospitality', 'Loyalty', 'Remembering what people like'],
      blind: ['Needs approval more than you show', 'Finds it hard to say no'],
      mind: 'Your mind tracks people, names and plans all day long. Variety and new puzzles keep that busy mind quick and flexible.' },
    QGLF: { name: 'The Problem-Solver', emoji: '🔧', tagline: 'Calm hands, practical mind.',
      desc: 'You figure out how things work and fix them. You stay cool in a crisis and act when it counts.',
      strengths: ['Hands-on skill', 'Staying calm', 'Practical logic'],
      blind: ['Gets restless with long, slow tasks', 'Keeps people at arm’s length'],
      mind: 'Your mind learns by doing and reacts fast. Training focus helps with the tasks that need patience, not just quick action.' },
    QGHF: { name: 'The Artist', emoji: '🎨', tagline: 'Gentle, creative and present.',
      desc: 'You notice beauty in everyday life and live in the moment. You show care through actions more than words.',
      strengths: ['Creativity', 'Kindness', 'Living in the moment'],
      blind: ['Avoids planning ahead', 'Hides hurt feelings to keep the peace'],
      mind: 'Your mind is tuned to the senses and to the present. Gentle focus games help you hold a thought when life gets busy.' },
    SGLF: { name: 'The Go-Getter', emoji: '⚡', tagline: 'Acts first, thinks fast.',
      desc: 'You love action, real results and a bit of excitement. You are quick on your feet and great in a pinch.',
      strengths: ['Quick reactions', 'Energy', 'Practical thinking'],
      blind: ['Acts before thinking it through', 'Loses interest once the excitement fades'],
      mind: 'Your mind is fast and practical. Training focus and problem solving keeps that speed working for you, not against you.' },
    SGHF: { name: 'The Charmer', emoji: '🌞', tagline: 'Makes life feel like a celebration.',
      desc: 'You are fun, warm and spontaneous. You make people laugh and turn ordinary days into good memories.',
      strengths: ['Joy and humor', 'People skills', 'Living fully'],
      blind: ['Puts off serious matters', 'Gets distracted by the next fun thing'],
      mind: 'Your mind loves people and new experiences. Focus and memory games help it keep up with all the plans and names in your life.' }
  };

  /* ---------- блок «Who is …» на пейволле: 2 предложения + 1 строка «how your mind works»; сильные стороны — чипы из TYPES[].strengths ---------- */
  var WHO = {
    QVLP: { who: 'The Strategist is a quiet thinker who sees several steps ahead. When something important is at stake, family and friends come to you for a clear, steady answer.',
      mind: 'It builds a plan and holds to it. Fresh puzzles keep it nimble when plans have to change.' },
    QVLF: { who: 'The Inventor is curious about how everything works. You enjoy taking a problem apart in your head and often find the clever answer nobody else saw.',
      mind: 'It jumps from idea to idea and spots hidden patterns. Focus practice helps it finish one thought before the next.' },
    SVLP: { who: 'The Captain sees where things should go and brings people along. In a family or a group, you are often the one who makes the call and gets it done.',
      mind: 'It is fast and goal-driven. Keeping it flexible helps you adapt when life rewrites the plan.' },
    SVLF: { who: 'The Innovator loves new ideas, good conversation and a lively debate. A fresh challenge wakes you up, and you rarely run out of things to say.',
      mind: 'It loves novelty and speed. Without a challenge it gets restless, and focus is the first thing to slip.' },
    QVHP: { who: 'The Guide understands people deeply and cares about doing what is right. Others come to you for quiet, wise advice, and they leave feeling understood.',
      mind: 'It links feelings, meaning and long-term goals. It works best when it is rested, clear and quick to recall.' },
    QVHF: { who: 'The Dreamer lives by their values and notices beauty that others miss. Your inner world is rich with memories, stories and ideas.',
      mind: 'It wanders toward possibilities and memories. That is a gift for creativity and a reason to train focus.' },
    SVHP: { who: 'The Mentor brings out the best in people. You encourage, you remember what matters to everyone, and people grow when you are around.',
      mind: 'It keeps track of many people and plans at once. Sharp recall keeps names and details at your fingertips.' },
    SVHF: { who: 'The Spark lights up every room. You are curious, warm and full of plans, and life feels more fun for everyone around you.',
      mind: 'It jumps between ideas and people with ease. The challenge is holding on to the details and finishing what you start.' },
    QGLP: { who: 'The Anchor is steady, reliable and always prepared. You keep your word, do things properly, and stay calm when others start to worry.',
      mind: 'It is precise and organized and trusts what has worked before. New puzzles keep it from getting stuck in old tracks.' },
    QGHP: { who: 'The Keeper quietly takes care of everyone. You remember birthdays, notice when someone is upset and keep the home running, and people feel safe with you.',
      mind: 'It holds a map of people, routines and memories. Gentle variety keeps it flexible as routines change.' },
    SGLP: { who: 'The Organizer makes things run smoothly. You like clear plans and real results, and you are the one who gets the family trip or the club meeting organized.',
      mind: 'It is quick with facts and plans. A flexible mind helps you handle the unexpected without stress.' },
    SGHP: { who: 'The Host brings people together. You are warm and welcoming, you keep traditions alive, and you remember what everyone likes.',
      mind: 'It tracks people, names and plans all day long. Variety and new puzzles keep that busy mind quick.' },
    QGLF: { who: 'The Problem-Solver has calm hands and a practical mind. You figure out how things work, fix what is broken and stay cool in a crisis.',
      mind: 'It learns by doing and reacts fast. Focus practice helps with the tasks that need patience, not just quick action.' },
    QGHF: { who: 'The Artist is gentle, creative and fully present. You notice beauty in everyday life and show your care through what you do more than what you say.',
      mind: 'It is tuned to the senses and the present moment. Gentle focus games help you hold a thought when life gets busy.' },
    SGLF: { who: 'The Go-Getter loves action and real results. You are quick on your feet, great in a pinch and always ready for the next thing to do.',
      mind: 'It is fast and practical. Training focus keeps that speed working for you, not against you.' },
    SGHF: { who: 'The Charmer makes life feel like a celebration. You are warm, fun and spontaneous, and you turn ordinary days into good memories.',
      mind: 'It loves people and new experiences. Focus and memory games help it keep up with all the plans and names in your life.' }
  };

  var GOAL_LABELS = { memory: 'memory', focus: 'focus', words: 'finding the right words', speed: 'quick thinking', problems: 'problem solving', calm: 'staying calm' };
  var SCALE_ICON = { energy: '🔋', mind: '🔭', heart: '⚖️', life: '🗓' };

  /* ---------- редкость: доля типа × доля людей того же типа с такой же или большей выраженностью сильнейшей шкалы ---------- */
  // Кривая P(сильнейшая из 4 шкал ≥ s) снята с латентной модели ответов в scoring_check.js (N = 50 000).
  // Это модель до реальных данных: после ~1 000 прохождений заменить на эмпирическую долю.
  var TOP_CURVE = [[51, 1], [60, 0.993], [70, 0.941], [80, 0.688], [90, 0.408], [100, 0.124]];
  function strengthShare(pct) {
    for (var k = 1; k < TOP_CURVE.length; k++) {
      var a = TOP_CURVE[k - 1], b = TOP_CURVE[k];
      if (pct <= b[0]) return a[1] + (b[1] - a[1]) * (pct - a[0]) / (b[0] - a[0]);
    }
    return TOP_CURVE[TOP_CURVE.length - 1][1];
  }
  function rarityGridSvg(highlight, gender, seed) {
    // 100 человечков 10×10, подсвечено highlight штук (позиции псевдослучайные, но стабильные для типа)
    var picks = {}, x = seed;
    while (Object.keys(picks).length < highlight) { x = (x * 1103515245 + 12345) % 2147483648; picks[x % 100] = 1; }
    var out = '';
    for (var k = 0; k < 100; k++) {
      var cx = 30 + (k % 10) * 54, cy = 30 + Math.floor(k / 10) * 56, on = !!picks[k];
      var c = on ? '#2168ff' : '#d3d9e6', hair = on ? '#9db7f5' : '#c2c9d8';
      var g = '<g transform="translate(' + cx + ' ' + cy + ')">';
      if (gender === 'woman' && on) g += '<path d="M-12 -2 C-14 -22 14 -22 12 -2 L13 8 L-13 8Z" fill="' + hair + '"/>';
      g += '<circle cx="0" cy="-6" r="9" fill="' + c + '"/><path d="M-17 22 C-17 8 -9 4 0 4 C9 4 17 8 17 22Z" fill="' + c + '"/>';
      if (gender !== 'woman' && on) g += '<path d="M-9 -10 C-8 -18 8 -18 9 -10 C5 -13 -5 -13 -9 -10Z" fill="' + hair + '"/>';
      if (on) g += '<circle cx="0" cy="-6" r="15" fill="none" stroke="#ffc94d" stroke-width="3"/>';
      out += g + '</g>';
    }
    var svgStr = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 548 572">' + out + '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
  }
  function cap(n) { n = String(n || '').trim().split(/\s+/)[0] || ''; return n ? n.charAt(0).toUpperCase() + n.slice(1) : ''; }

  /* ---------- методика ---------- */
  function num(v) { return typeof v === 'number' && v >= 1 && v <= 5 ? v : 3; } // нет ответа = Neutral

  function scoring(answers) {
    answers = answers || {};
    var sc = {};
    SCALES.forEach(function (s) { sc[s.key] = { raw: 0, n: 0, extreme: null }; });
    ITEMS.forEach(function (it) {
      var v = num(answers[it.id]);
      var keyed = it.key === 1 ? v : 6 - v;         // 1..5 в сторону полюса plus
      var s = sc[it.scale];
      s.raw += keyed; s.n += 1;
      if (s.extreme === null && Math.abs(keyed - 3) === 2) s.extreme = keyed; // первый крайний ответ шкалы — для ничьей
    });
    var code = '', scales = {}, out = {};
    SCALES.forEach(function (s) {
      var r = sc[s.key];
      var min = r.n, max = r.n * 5, mid = r.n * 3;
      var pct = Math.round((r.raw - min) / (max - min) * 100); // 0..100, доля к полюсу plus
      var side;
      if (r.raw > mid) side = 'plus';
      else if (r.raw < mid) side = 'minus';
      else if (r.extreme !== null) side = r.extreme > 3 ? 'plus' : 'minus';
      else side = s.tieDefault;
      var pole = s[side];
      var strength = Math.max(51, side === 'plus' ? pct : 100 - pct); // выраженность выигравшего полюса, 51..100
      code += pole.code;
      scales[s.key] = { key: s.key, label: s.label, code: pole.code, word: pole.word, other: s[side === 'plus' ? 'minus' : 'plus'].word, pct: strength, raw: r.raw, tie: r.raw === mid };
      out[s.key + 'Word'] = pole.word;
      out[s.key + 'Pct'] = strength + '%';
      out[s.key + 'Line'] = strength + '% ' + pole.word;
    });
    var t = TYPES[code];
    var mindZ = ZONE_BY_LETTER[code.charAt(1)], lifeZ = ZONE_BY_LETTER[code.charAt(3)];
    var order = SCALES.map(function (s) { return scales[s.key]; }).slice().sort(function (a, b) { return b.pct - a.pct; });
    var top = order[0];
    order.forEach(function (sc2, k) {
      var n = k + 1;
      out['s' + n + 'Label'] = sc2.label; out['s' + n + 'Line'] = sc2.pct + '% ' + sc2.word; out['s' + n + 'Icon'] = SCALE_ICON[sc2.key];
      out['s' + n + 'Word'] = sc2.word;
    });

    // пол, имя, возраст
    var gender = answers.gender === 'man' ? 'man' : 'woman'; // картинки по умолчанию — женские (основная аудитория)
    var name = cap(answers.name);
    var ageMap = { '50-59': '50–59', '60-69': '60–69', '70-79': '70–79', '80+': '80+' };
    var ageLabel = ageMap[answers.age] || '';

    // цели и план на 4 недели
    var goals = (answers.goals || []).filter(function (g) { return GOAL_LABELS[g]; });
    var goalWords = goals.map(function (g) { return GOAL_LABELS[g]; });
    var z1 = mindZ.zone, z2 = lifeZ.zone;
    var goalZones = goals.map(function (g) { return GOAL_ZONE[g]; }).filter(function (z) { return z !== z1 && z !== z2; });
    var z3 = goalZones[0] || ZONES.filter(function (z) { return z !== z1 && z !== z2; })[0];
    var minutes = answers.daily_time || '10';

    // редкость
    var prev = PREVALENCE[code];
    var combo = prev * strengthShare(top.pct);              // % людей с тем же типом и такой же или большей выраженностью сильнейшей шкалы
    var oneIn = Math.max(2, Math.round(100 / combo));
    var in100 = Math.max(1, Math.round(prev));
    var seed = code.split('').reduce(function (a, ch) { return a * 31 + ch.charCodeAt(0); }, 7) % 100000;

    var classic = code.split('').map(function (ch) { return CLASSIC[ch]; }).join('');
    return Object.assign(out, {
      code: code, classic: classic,
      codeDots: code.split('').join(' · '),
      group: code.charAt(1) === 'V' ? 'V' + code.charAt(2) : 'G' + code.charAt(3),
      g: gender,
      typeName: t.name, typeEmoji: t.emoji, tagline: t.tagline, desc: t.desc, mind: t.mind,
      who: WHO[code].who, mindText: WHO[code].mind, // mindLine — «83% Grounded» из цикла шкал, не перезаписывать
      strengthChips: t.strengths.map(function (x) { return '<span>' + x + '</span>'; }).join(''),
      strengths: t.strengths, strength1: t.strengths[0], strength2: t.strengths[1], strength3: t.strengths[2],
      blind1: t.blind[0], blind2: t.blind[1],
      decide: DECIDE[code.charAt(2) + code.charAt(3)], relate: RELATE[code.charAt(0) + code.charAt(2)],
      topTrait: top.word, topLine: top.pct + '% ' + top.word, topPct: top.pct,
      scales: scales,
      naturalStrength1: mindZ.strength, naturalStrength2: lifeZ.strength,
      zone1: z1, zone2: z2, zone3: z3, zone1Why: mindZ.why, zone2Why: lifeZ.why,
      planLine: z1 + ' → ' + z2 + ' → ' + z3 + ' → all four',
      week1: 'Week 1 — ' + z1, week2: 'Week 2 — ' + z2, week3: 'Week 3 — ' + z3, week4: 'Week 4 — Logic, Memorization, Math and Focus together',
      goalsLine: goalWords.length ? 'You also asked to work on ' + goalWords.join(', ') + '.' : '',
      minutes: minutes,
      name: name, sampleName: gender === 'man' ? 'Robert' : 'Linda',
      nameOwn: name ? name + '’s' : 'Your', nameComma: name ? name + ', ' : '',
      ageLabel: ageLabel, peopleWord: gender === 'man' ? 'men' : 'women',
      peersLine: ageLabel ? (gender === 'man' ? 'men' : 'women') + ' aged ' + ageLabel : 'people your age',
      typePct: prev, typePctLabel: (prev < 10 ? prev.toFixed(1) : Math.round(prev)) + '%', typeIn100: in100,
      comboPct: combo < 1 ? combo.toFixed(2) + '%' : combo.toFixed(1) + '%', rarityOneIn: oneIn,
      // «only» — только для действительно редких профилей; «1 in 16» без пояснения читается как «один из 16 типов»
      rarityShort: (oneIn >= 20 ? 'only 1 in ' : 'about 1 in ') + oneIn + ' people share your exact profile',
      rarityImg: rarityGridSvg(in100, gender, seed),
      // редкий тип (< 5%) — крупно доля типа; частый — крупно «1 in N» по точному профилю, без натяжки «only»
      rarityStat: prev < 5 ? (prev < 10 ? prev.toFixed(1) : Math.round(prev)) + '%' : '1 in ' + oneIn,
      // подтекст «Add how strong your … side» убран (раунд 2): экран с кнопкой должен помещаться в 390×844
      rarityTitle: prev < 5
        ? (name ? name + ', only' : 'Only') + ' about <span>' + in100 + ' in 100</span> people share your personality type'
        : (name ? name + ', about' : 'About') + ' <span>' + in100 + ' in 100</span> people share your type. Your exact profile is much rarer'
    });
  }

  // Синтетические ответы под заданный тип (для предпросмотра ?type=): выраженность шкал 75–83%
  var PATTERNS = [[5, 4, 4, 5, 3, 4], [4, 4, 3, 4, 5, 4], [5, 5, 4, 4, 5, 3], [4, 3, 4, 4, 4, 5]];
  function answersFor(code) {
    code = String(code || '').toUpperCase();
    if (!TYPES[code] && code.length === 4) code = code.split('').map(function (ch, k) { return FROM_CLASSIC[k][ch] || '?'; }).join('');
    if (!TYPES[code]) return null;
    var a = {}, cnt = {};
    ITEMS.forEach(function (it) {
      var sIdx = SCALES.findIndex(function (s) { return s.key === it.scale; });
      var wantPlus = code.charAt(sIdx) === SCALES[sIdx].plus.code;
      var n = cnt[it.scale] = (cnt[it.scale] || 0); cnt[it.scale]++;
      var k = PATTERNS[(sIdx + code.charCodeAt(0)) % 4][n];   // keyed-ответ в сторону нужного полюса
      var keyed = wantPlus ? k : 6 - k;
      a[it.id] = it.key === 1 ? keyed : 6 - keyed;
    });
    return { code: code, answers: a };
  }

  root.TYPES_DATA = { SCALES: SCALES, ITEMS: ITEMS, TYPES: TYPES, WHO: WHO, ZONE_BY_LETTER: ZONE_BY_LETTER, PREVALENCE: PREVALENCE, scoring: scoring, answersFor: answersFor };

  if (typeof document === 'undefined') return; // Node: только методика, без экранов

  /* ---------- стили прототипа: обложка отчёта с именем ---------- */
  var st = document.createElement('style');
  st.textContent = '.pt-cover{position:relative;margin:0 0 14px}.pt-cover img{width:100%;display:block;border-radius:14px}' +
    '.pt-cover__t{position:absolute;left:26%;right:26%;top:47%;text-align:center;line-height:1.15;color:#17213a}' +
    '.pt-cover__t b{display:block;font-size:clamp(16px,5vw,22px);font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.pt-cover__t span{display:block;font-size:clamp(11px,3.4vw,15px);font-weight:600;color:#596179;margin-top:3px}' +
    '.pt-cover--sm{max-width:260px;margin:0 auto 18px}.pt-cover--sm .pt-cover__t{top:45%}.pt-cover--sm .pt-cover__t b{font-size:16px}.pt-cover--sm .pt-cover__t span{font-size:10.5px;margin-top:1px}' +
    '.kit-screen[data-id="rarity"] .kit-image{max-width:250px;margin:0 auto}.kit-screen[data-id="rarity"] .kit-stat-big{margin-top:0}' +
    '.kit-screen[data-id="rarity"] .kit-source{margin:10px 0 0;font-size:11px}' +
    '.pt-you{font-size:20px;font-weight:600;color:#17213a;text-align:center;margin:-4px 0 14px}.pt-you b{color:#2168ff}' +
    '.pt-who p{margin:0;text-align:left;font-size:17px;line-height:1.45;color:#17213a}' +
    '.pt-who__lbl{font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#596179;margin:18px 0 8px}' +
    '.pt-chips{display:flex;flex-wrap:wrap;gap:8px}.pt-chips span{background:#eff5ff;color:#1b4fc4;border-radius:999px;padding:8px 14px;font-size:15px;font-weight:600}' +
    '.pt-who .pt-who__mind{margin-top:18px;padding:12px 14px;background:#f6f8fc;border-radius:12px;font-size:16px}' +
    '.pt-paid{display:table;margin:0 auto 14px;background:#eef3ff;border-radius:10px;padding:8px 14px;font-weight:600;color:#1b4fc4}' +
    '.pt-step{text-align:center}.pt-step__n{font-size:22px;font-weight:700;color:#131a35;margin-bottom:2px}.pt-step .kit-image{width:100%;border-radius:14px;margin:12px 0}' +
    '.pt-step .kit-btn{display:flex;align-items:center;justify-content:center;text-decoration:none;margin-top:14px}' +
    '.pt-step__ic{width:64px;height:64px;border-radius:50%;background:#eef3ff;display:flex;align-items:center;justify-content:center;font-size:30px;margin:12px auto}';
  document.head.appendChild(st);
  function coverHtml(nameExpr, small) {
    return '<div class="pt-cover' + (small ? ' pt-cover--sm' : '') + '"><img src="img/cover-{{group}}-{{g}}.svg" alt=""><div class="pt-cover__t"><b>' + nameExpr + '</b><span>Personality Report</span></div></div>';
  }

  /* ---------- экраны ---------- */
  var K = '../../kit/';
  var params = {}; try { new URLSearchParams(location.search).forEach(function (v, k) { params[k] = v; }); } catch (e) { /* старые браузеры */ }
  // Форма шкалы: по умолчанию круги (layout 'circles'), ?scale=list — цветной список (запасной вариант, кандидат в A/B)
  var SCALE_FORM = params.scale === 'list' ? 'list' : 'circles';
  function likert(it) {
    return SCALE_FORM === 'list'
      ? { id: it.id, type: 'likert', title: it.text, subtitle: 'How much do you agree?', colored: true, autoAdvance: true, autoAdvanceDelay: 400 }
      : { id: it.id, type: 'likert', title: it.text, subtitle: 'How much do you agree?', layout: 'circles', leftLabel: 'Agree', rightLabel: 'Disagree', autoAdvance: true, autoAdvanceDelay: 550 };
  }
  var Q = ITEMS.map(likert);

  root.FUNNEL = {
    meta: {
      title: '[Company] — Personality Type Test',
      brand: '[Company]', headerTitle: '[Company]', logo: K + 'assets/logo.svg',
      counter: 'Question {n} of {total}',
      back: false, // вернуться к отвеченным вопросам нельзя
      disclaimer: 'For self-discovery and entertainment purposes only. This test is not a medical or psychological diagnosis.'
    },
    scoring: scoring,
    screens: [
      { id: 'gender', type: 'intro',
        title: 'Which of the <span>16 personalities</span> are you?', subtitle: 'Free 4-minute test. Choose one to start',
        image: 'img/hero.svg',
        // раунд 2: простые текстовые кнопки вместо обрезанных фото-карточек
        options: [
          { value: 'woman', label: 'Woman' },
          { value: 'man', label: 'Man' }
        ] },

      Q[0], Q[1], Q[2], Q[3], Q[4], Q[5], Q[6], Q[7],

      { id: 'age', type: 'single', autoAdvance: true,
        title: 'How old are you?', subtitle: 'So we can tailor your report and brain plan to your age',
        options: [
          { value: '50-59', label: '50–59' },
          { value: '60-69', label: '60–69' },
          { value: '70-79', label: '70–79' },
          { value: '80+',   label: '80 or older' }
        ],
        textAction: { label: 'I’m under 50', value: 'under-50' } },

      Q[8], Q[9], Q[10], Q[11],

      { id: 'halfway', type: 'interstitial',
        title: 'You’re halfway there! <span>Your type is taking shape</span>',
        text: 'Most people are surprised by at least one side of their personality. Keep answering with your first feeling.',
        image: 'img/halfway-{{g}}.svg', imagePosition: 'top', imageStyle: 'plain',
        cta: 'Keep going' },

      Q[12], Q[13], Q[14], Q[15], Q[16], Q[17],

      { id: 'fact_link', type: 'interstitial',
        title: 'Your personality and your <span>memory</span> are connected',
        text: 'Long-term studies show that traits like being organized and staying calm are linked to a lower risk of memory problems later in life. Knowing your type shows which parts of your mind need more practice.',
        source: 'Source: Journal of Personality and Social Psychology, 2022',
        image: 'img/fact-link-{{g}}.svg', imageStyle: 'plain' },

      { id: 'goals', type: 'multi', min: 1, cta: 'Continue',
        title: 'Which of these would you like to <span>keep sharp</span>?', subtitle: 'We’ll add them to your brain plan. Choose all that apply',
        options: [
          { value: 'memory', label: 'Remembering names and details', emoji: '🧠' },
          { value: 'focus', label: 'Staying focused on one thing', emoji: '🎯' },
          { value: 'problems', label: 'Solving everyday problems', emoji: '🧩' },
          { value: 'speed', label: 'Thinking quickly', emoji: '⚡' }
        ] },

      Q[18], Q[19], Q[20], Q[21], Q[22], Q[23],

      { id: 'daily_time', type: 'single', autoAdvance: true,
        title: 'Last one: how much time could you give your mind <span>each day</span>?',
        options: [
          { value: '5', label: '5 minutes — easy start', emoji: '☕' },
          { value: '10', label: '10 minutes — steady habit', emoji: '📰' },
          { value: '15', label: '15 minutes — serious', emoji: '📚' },
          { value: '20', label: '20 minutes — ambitious', emoji: '🏆' }
        ] },

      { id: 'social', type: 'interstitial', progress: false,
        title: 'Join <span>1m+</span> [Company] users',
        text: 'People from all over the world use [Company] to understand their mind and keep it sharp.',
        image: 'img/social-{{g}}.svg', imageStyle: 'plain',
        trust: [
          { icon: '👥', text: '<b>1,280 people</b> took this test today.' },
          { icon: '💬', text: 'Trusted by a community of over <b>5 million</b>.' }
        ] },

      { id: 'loader', type: 'loader',
        title: 'Finding your <span>personality type...</span>',
        stepDuration: 1600,
        steps: [
          { label: 'Scoring your energy style...' }, { label: 'Scoring how you take in information...' },
          { label: 'Scoring how you make decisions...' }, { label: 'Building your 4-week brain plan...' }
        ],
        popups: [
          { id: 'popup_know', atStep: 1, atPercent: 45, icon: '✦', text: 'Do you think you know yourself well?',
            buttons: [{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }] }
        ],
        review: { title: 'Spot on!', author: 'Margaret L., 67', stars: 5,
          text: 'I laughed out loud at how well it described me. And the brain plan actually made sense for the way I think.' } },

      { id: 'email', type: 'email',
        title: 'Where should we send <span>your personality report?</span>', subtitle: 'Your type and brain plan will be saved to this email',
        cta: 'Continue',
        privacy: 'We respect your privacy. Your answers stay private and are never shared.',
        stats: [
          { icon: '⏱', label: 'Statements', value: '24 of 24' },
          { icon: '🧭', label: 'Strongest trait', value: '{{topTrait}}' },
          { icon: '🔒', label: 'Your type', value: 'Ready' }
        ] },

      { id: 'name', type: 'email', inputType: 'text', autocomplete: 'given-name', maxLength: 30,
        title: 'What should we <span>call you?</span>', subtitle: 'Your personal report will be prepared in your name',
        placeholder: 'Your first name', cta: 'Show my result',
        preview: coverHtml('[[value]]’s', true), previewFallback: '{{sampleName}}',
        privacy: 'Only your first name is needed. It appears on your report and nowhere else.' },

      { id: 'rarity', type: 'interstitial', progress: false, imagePosition: 'top',
        stat: '{{rarityStat}}',
        title: '{{rarityTitle}}',
        image: '{{rarityImg}}', imageStyle: 'plain',
        source: 'Source: U.S. estimates, Myers et al., 1998',
        cta: 'See my report' },

      // раунд 2: экран-тизер удалён — после редкости сразу пейволл, тип раскрыт по имени
      { id: 'paywall', type: 'paywall',
        offerBar: { text: 'Get 85% off your program!', timerSeconds: 600 },
        // раунд 2: шапка → «Who is» → (что внутри + тарифы) → преимущества → отзывы → тарифы → гарантия → FAQ, без финальной кнопки
        // раунд 3: один блок тарифов с оплатой внутри; кнопки шапки и гарантии прокручивают к тарифам
        order: ['result', 'about', 'inside+plans', 'benefits', 'reviews', 'guarantee', 'faq'],
        ctaScroll: true,
        payAdvance: true, // после оплаты — экран «You're all set!»
        result: { title: '{{nameOwn}} Personality Report is ready',
          text: '<span class="pt-you" style="display:block">You are <b>{{typeName}}</b> {{typeEmoji}}</span>' + coverHtml('{{nameOwn}}') + 'Your full report and a 4-week brain plan for the way you think.' },
        blocks: {
          about: { title: 'Who is {{typeName}}', cls: 'pt-who',
            html: '<p>{{who}}</p><div class="pt-who__lbl">Your strengths</div><div class="pt-chips">{{strengthChips}}</div>' +
              '<p class="pt-who__mind"><b>How your mind works:</b> {{mindText}}</p>' }
        },
        inside: { pill: 'Over <b style="color:#2168ff">2,725</b> people found their type today', title: 'Get Your Report & Brain Plan',
          items: ['Your full <b>Personality Report</b> — a 15-page PDF to keep',
                  'Your personal <b>Personality Certificate</b> to download or print',
                  'Your <b>brain plan</b> in the [Company] app — 10 minutes a day'] },
        benefits: [
          { title: 'Your Personality Certificate', text: 'Download or print your certificate with your personality type.', image: 'img/certificate-blur.png' },
          { title: 'Just {{minutes}} minutes a day', text: '{{zone2Why}}', image: 'img/test1-i3.png' },
          { title: 'Stay sharp for the people you love', text: 'Remember names, follow conversations and keep your independence for years to come.', image: 'img/benefit-family-{{g}}.svg' }
        ],
        reviewsTitle: 'Thousands of {{peopleWord}} found their type here',
        rating: { source: 'Trustpilot', label: 'Rated 4.5 · Excellent' },
        reviews: [
          { name: 'Linda M., 64', stars: 5, title: 'It described me better than my husband can', text: 'I took it for fun and ended up reading every line. The daily games are short and I actually look forward to them.' },
          { name: 'Robert K., 71', stars: 5, title: 'Finally a plan that makes sense', text: 'It said my mind races ahead and misses details. That is exactly why I forget names. Ten minutes a day, and I notice the difference.' },
          { name: 'Susan P., 58', stars: 5, title: 'Fun and useful', text: 'My whole book club took the test. Now we compare our types and our game scores every week.' }
        ],
        promo: { text: 'Promo Code COMPANYTODAY Applied', sub: 'You save 85%' },
        // тарифная сетка раунда 2: триал по умолчанию, без бейджа; «Best value» только у 12 недель. Условия под тарифами меняются по выбранному плану
        plans: { title: '', default: 'trial', payMethods: ['paypal', 'apple', 'card'],
          items: [
            { id: 'trial', name: '3-Day Trial', note: 'then $20.99/week', price: '$0.99', per: '$3.00/day after trial',
              terms: 'By continuing, you agree to be charged $0.99 today. After 3 days, you will be automatically charged $20.99 every week until you cancel. Cancel anytime.' },
            { id: 'plan4w', name: '4-Week Plan', note: 'then $79.99 every 4 weeks', save: 'Save 44%', price: '$44.99', oldPrice: '$79.99', per: '$1.61/day',
              terms: 'By continuing, you agree to be charged $44.99 today. After 4 weeks, you will be automatically charged $79.99 every 4 weeks until you cancel. Cancel anytime.' },
            { id: 'plan12w', name: '12-Week Plan', note: 'then $199.99 every 12 weeks', save: 'Save 55%', price: '$89.99', oldPrice: '$199.99', per: '$1.07/day', badge: 'Best value',
              terms: 'By continuing, you agree to be charged $89.99 today. After 12 weeks, you will be automatically charged $199.99 every 12 weeks until you cancel. Cancel anytime.' }
          ] },
        guarantee: { title: '14-Day Money-Back Guarantee', text: 'If you are not completely satisfied, let us know within 14 days and we will provide a full refund.', cta: 'Get My Report & Plan' },
        faq: [
          { q: 'What exactly am I buying?', a: 'A [Company] subscription. It includes your full personality report and the [Company] app with a daily brain-training plan built for your type. You choose a plan: a 3-day trial for $0.99 (then $20.99 per week), 4 weeks for $44.99 (then $79.99 every 4 weeks) or 12 weeks for $89.99 (then $199.99 every 12 weeks). It renews until you cancel.' },
          { q: 'What’s in the PDF report?', a: 'A 15-page report about your type: how rare it is, your 4 sides, your strengths and blind spots, how you make decisions, relationships with family, friends, children and grandchildren, you at your best and under stress, how to talk to you, famous people who may share your type, pastimes you may enjoy, how your mind works, and your 4-week brain plan.' },
          { q: 'How can brain games help me?', a: 'Short daily games give your memory, focus, quick thinking and problem solving regular practice, and with practice most people get better at these tasks. The games are not a medical treatment.' },
          { q: 'Why a brain-training plan for a personality test?', a: 'Your type shows how you naturally think. Some skills you use every day, others get less practice. Your plan starts with the ones your type tends to skip, so your daily minutes go where they help most.' },
          { q: 'Is this a medical test?', a: 'No. The test is for entertainment and self-discovery purposes only and is not a substitute for professional evaluation. It does not diagnose anything and does not replace advice from a doctor.' },
          { q: 'Can I cancel anytime?', a: 'Yes. Cancel in your account settings or write to our support team, and you will not be charged again. Cancel before your trial or plan period ends to avoid the next charge.' },
          { q: 'How do I get my report?', a: 'Right after payment your report opens on screen, and we send a PDF copy to the email you gave us.' }
        ],
        cta: 'Get My Report & Plan',
        footerNote: 'The test is for entertainment and self-discovery purposes only and is not a substitute for professional evaluation.' },
      // после оплаты: success-страница со степами (сертификат → отчёт → тренировки → аккаунт), книг в этой воронке нет
      { id: 'success', type: 'paywall', back: false,
        order: ['done', 'st1', 'st2', 'st3', 'st4'],
        blocks: {
          done: { html: '<div class="pt-paid">✓ Payment successful</div><h2 class="kit-title kit-title--lg">You’re all set!</h2><p class="kit-subtitle" style="margin-top:6px">Here is everything you get. Follow these steps to start.</p>' },
          st1: { cls: 'pt-step', html: '<div class="pt-step__n">Step 1.</div><h3 class="kit-pw-h" style="margin-top:0">Get your certificate</h3><img class="kit-image" src="img/certificate.png" alt=""><p class="kit-text">Your personal certificate with your personality type.</p><a class="kit-btn" href="#" onclick="return false">Download My Certificate</a>' },
          st2: { cls: 'pt-step', html: '<div class="pt-step__n">Step 2.</div><h3 class="kit-pw-h" style="margin-top:0">Get your Personality Report</h3><img class="kit-image" src="img/report-cover.png" alt="" style="max-width:220px;margin:0 auto;display:block"><p class="kit-text">Your 15-page report: your type, strengths, blind spots, relationships and your 4-week brain plan.</p><a class="kit-btn" href="#" onclick="return false">Download My Report</a>' },
          st3: { cls: 'pt-step', html: '<div class="pt-step__n">Step 3.</div><h3 class="kit-pw-h" style="margin-top:0">Start your brain training</h3><img class="kit-image" src="img/test1-i3.png" alt=""><p class="kit-text">Your personal training plan and 25+ brain games are waiting in the [Company] app. Log in with the same email you used here.</p><a class="kit-btn" href="#" onclick="return false">Start the Journey</a>' },
          st4: { cls: 'pt-step', html: '<div class="pt-step__n">Step 4.</div><h3 class="kit-pw-h" style="margin-top:0">Your account is ready</h3><div class="pt-step__ic">👤</div><p class="kit-text">We’ve created an account with your email so you can manage your subscription anytime.</p><a class="kit-btn" href="#" onclick="return false">View My Account</a>' }
        } }
    ]
  };

  /* ---------- два варианта пейволла: ?pw=trial — только триал (вариант A), по умолчанию — три тарифа (вариант B) ---------- */
  if (params.pw === 'trial') {
    root.FUNNEL.screens.forEach(function (sc) {
      if (sc.id !== 'paywall') return;
      sc.plans.items = sc.plans.items.filter(function (it) { return it.id === 'trial'; });
      sc.plans.items[0].oldPrice = '$48.99';
      // как на пейволле test-1: один блок — плашка, заголовок, 5 пунктов, промокод, «Total due today», способы оплаты
      sc.order = ['result', 'about', 'plans', 'benefits', 'reviews', 'guarantee', 'faq'];
      sc.plans.layout = 'single';
      sc.plans.pill = 'Over <b style="color:#2168ff">2,725</b> people found their type today';
      sc.plans.title = 'Try Your Report & Brain Plan for 3 days';
      sc.plans.bullets = ['Your full <b>Personality Report</b> — a 15-page PDF to keep',
                  'Your personal <b>Personality Certificate</b> to download or print',
                  'Your <b>brain plan</b> in the [Company] app — 10 minutes a day',
        'Your 3-day trial will cost only $0.99. <b>Afterwards, it will be $20.99/week.</b>'];
      sc.plans.infoBoxes = [{ icon: '✓', title: 'No commitment.', text: 'Cancel anytime' },
        { icon: '✉', title: 'Money back', text: 'We will remind you 2 days before your trial ends' }];
      sc.faq[0].a = 'A [Company] subscription. It includes your full personality report and the [Company] app with a daily brain-training plan built for your type. You pay $0.99 today for a 3-day trial, then $20.99 per week. It renews until you cancel.';
    });
  }

  /* ---------- предпросмотр: ?type=ENFP|SVHF &gender=woman|man &name=Linda &screen=paywall|rarity ---------- */
  if (params.type) {
    window.addEventListener('DOMContentLoaded', function () {
      var r = answersFor(params.type);
      if (!r || !window.KIT) { console.warn('[types] unknown type', params.type); return; }
      var A = window.KIT.answers;
      Object.keys(r.answers).forEach(function (k) { A[k] = r.answers[k]; });
      A.gender = params.gender === 'man' ? 'man' : 'woman';
      A.name = params.name != null ? params.name : (A.gender === 'man' ? 'Robert' : 'Linda');
      A.age = params.age || '60-69'; A.goals = (params.goals || 'memory,focus').split(','); A.daily_time = params.minutes || '10';
      A.email = 'preview@example.com';
      window.KIT.go(params.screen || 'paywall');
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);

/* ---------- переключатель вариантов пейволла A / B (для просмотра прототипа; во встроенном предпросмотре types.html скрыт) ---------- */
(function () {
  if (typeof document === 'undefined' || !window.addEventListener || window.self !== window.top) return;
  window.addEventListener('DOMContentLoaded', function () {
    var q = {}; new URLSearchParams(location.search).forEach(function (v, k) { q[k] = v; });
    var isA = q.pw === 'trial';
    var box = document.createElement('div');
    box.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:9999;display:flex;gap:4px;align-items:center;background:rgba(19,26,53,.85);color:#fff;border-radius:12px;padding:6px 8px;font:600 13px Inter,sans-serif';
    box.innerHTML = '<span style="opacity:.8;margin-right:4px">Пейволл:</span>' +
      ['A', 'B'].map(function (v) { var on = (v === 'A') === isA;
        return '<button data-v="' + v + '" style="border:0;border-radius:8px;padding:5px 10px;font:inherit;cursor:pointer;' + (on ? 'background:#2168ff;color:#fff' : 'background:#fff;color:#131a35') + '">' + (v === 'A' ? 'A · триал' : 'B · 3 тарифа') + '</button>'; }).join('');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var A = (window.KIT && window.KIT.answers) || {}, code = q.type || 'QGHP';
      try { if (Object.keys(A).length > 3) code = window.FUNNEL.scoring(A).code || code; } catch (err) { /* остаётся тип из ссылки */ }
      var u = 'index.html?' + (b.dataset.v === 'A' ? 'pw=trial&' : '') + 'type=' + code + '&gender=' + (A.gender || q.gender || 'woman') +
        '&name=' + encodeURIComponent(A.name || q.name || 'Linda') + '&screen=' + (q.screen === 'success' ? 'success' : 'paywall');
      location.href = u;
    });
    document.body.appendChild(box);
  });
})();
