/* Воронка «Деменция» v4 — прототип на kit (../../DRAFT-personality/kit).
   Квиз — веб-тест «Check In On Dementia Risk» (MAR-3933), пейволл — структура живого v3 (WEB-305/306) со шкалой из v2.
   Предпросмотр: index.html?level=low|mild|moderate|elevated&gender=female|male&age=70-79&screen=paywall */
(function (root) {
  var D = root.DEM;
  var K = '../kit/';
  var params = {}; try { new URLSearchParams(location.search).forEach(function (v, k) { params[k] = v; }); } catch (e) { /* ignore */ }

  function reportUrl(a) {
    var keep = {}; Object.keys(a || {}).forEach(function (k) { if (/^q\d+$|^gender$|^age$|^name$/.test(k)) keep[k] = a[k]; });
    return '../report/report.html?a=' + encodeURIComponent(JSON.stringify(keep));
  }
  function scoring(a) {
    var r = D.scoring(a);
    r.reportUrl = reportUrl(a);
    r.bubble = (r.good ? 'Good news — your' : 'Your') + ' strongest area is <b>' + r.topArea + '</b>.';
    r.levelPill = '<span class="dm-level" style="background:' + r.levelSoft + ';color:' + r.levelInk + '"><i style="background:' + r.levelColor + '"></i>' + r.levelLabel + '</span>';
    return r;
  }

  /* ---------- стили своих блоков ---------- */
  var st = document.createElement('style');
  st.textContent =
    '.dm-level{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:7px 14px;font-weight:700;font-size:16px;margin:0 auto 4px}' +
    '.dm-level i{width:10px;height:10px;border-radius:50%}' +
    '.dm-center{text-align:center}' +
    '.dm-bubble{background:#e6f6ee;color:#0f6b45;border-radius:14px;padding:12px 14px;font-weight:600;font-size:16px;text-align:center;margin:14px 0 10px}' +
    '.dm-bubble--neutral{background:#eff5ff;color:#17213a}' +
    '.dm-areas{background:#eff5ff;border-radius:14px;padding:12px 14px;font-size:16px;margin:10px 0 0}' +
    '.dm-areas b{display:block;margin-bottom:2px}' +
    '.dm-private{font-size:13px;color:#596179;text-align:center;margin:12px 0 0}' +
    '.dm-eyebrow{color:#1968ff;font-weight:600;font-size:14px;margin:0 0 4px;text-align:center}' +
    '.dm-chart svg{width:100%;height:auto;display:block}.dm-chart p{font-size:12px;color:#858585;text-align:center;margin:6px 0 0}' +
    '.dm-badges{display:flex;gap:8px;margin:14px 0 4px}.dm-badges div{flex:1;background:#eff5ff;border-radius:12px;padding:10px 4px;text-align:center;font-size:13px;font-weight:600;line-height:1.25}.dm-badges span{display:block;font-size:22px;margin-bottom:4px}' +
    '.dm-priv{list-style:none;padding:0;margin:0 0 14px;display:grid;gap:8px;font-size:15px;color:#26314b;text-align:left}' +
    '.dm-namecard{border:2px solid #d8c27a;border-radius:14px;padding:16px;text-align:center;margin:0 0 14px;background:#fffdf5}.dm-namecard i{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#1e9e6a;color:#fff;font-style:normal;font-weight:800;font-size:18px;margin-bottom:6px}.dm-namecard small{display:block;letter-spacing:.1em;text-transform:uppercase;color:#9a7b1e;font-weight:700;font-size:11px}.dm-namecard b{display:block;font-size:26px;margin:6px 0 2px;color:#17213a}.dm-namecard span{font-size:13px;color:#596179}' +
    '.dm-how{display:grid;gap:26px}.dm-how h4{font-size:18px;margin:12px 0 4px;text-align:center}.dm-how p{font-size:15px;color:#26314b;margin:0;text-align:center;line-height:1.35}' +
    '.dm-cover{background:linear-gradient(160deg,#1968ff,#5a9bff);border-radius:14px;padding:18px;color:#fff;display:flex;gap:14px;align-items:center}' +
    '.dm-cover__page{background:#fff;color:#17213a;border-radius:8px;padding:10px;width:120px;flex:none;box-shadow:0 6px 20px #00126f40;font-size:9px;line-height:1.3}' +
    '.dm-cover__page b{display:block;font-size:11px;margin-bottom:6px}.dm-cover__page .bar{height:5px;border-radius:3px;background:#dfe6f5;margin:4px 0}.dm-cover__page .bar i{display:block;height:100%;border-radius:3px;background:#1968ff}' +
    '.dm-cover__t{font-size:17px;font-weight:700;line-height:1.25}.dm-cover__t span{display:block;font-size:13px;font-weight:500;opacity:.9;margin-top:4px}' +
    '.dm-latest{display:grid;gap:8px}.dm-latest div{display:flex;align-items:center;gap:12px;background:#f6f8fc;border-radius:12px;padding:10px 12px;font-size:15px}' +
    '.dm-latest b{display:block;font-size:15px}.dm-latest small{color:#596179;font-size:12px}.dm-latest em{margin-left:auto;font-style:normal;font-weight:700;text-align:right;font-size:14px}' +
    '.dm-latest em small{display:block;font-weight:500}' +
    /* подсветка изменений относительно v3 */
    'body.dm-hl .chg{outline:2px dashed #e8603c;outline-offset:4px;border-radius:6px;position:relative}' +
    'body.dm-hl .chg::after{content:attr(data-chg);position:absolute;right:0;top:-12px;background:#e8603c;color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;z-index:2;max-width:70%;line-height:1.2}' +
    '.dm-tools{position:fixed;right:8px;top:12px;display:flex;flex-direction:row;gap:4px;z-index:50}' +
    '.dm-tools a,.dm-tools button{font:600 11px Inter,sans-serif;background:#17213acc;color:#fff;border:0;border-radius:8px;padding:6px 9px;text-decoration:none;cursor:pointer;text-align:center}' +
    '.dm-tools button.on{background:#e8603c}' +
    '.dm-mail{text-align:center;font-size:15px;color:#596179;margin:10px 0 0}.dm-mail b{color:#17213a}' +
    '.dm-paid{display:table;margin:0 auto 14px;background:#eef3ff;border-radius:10px;padding:8px 14px;font-weight:600;color:#1b4fc4}' +
    '.dm-step{text-align:center}.dm-step__n{font-size:22px;font-weight:700;color:#131a35;margin-bottom:2px}.dm-step .kit-image{width:100%;border-radius:14px;margin:12px 0}' +
    '.dm-step .kit-btn{display:flex;align-items:center;justify-content:center;text-decoration:none;margin-top:14px}' +
    '.dm-step__ic{width:64px;height:64px;border-radius:50%;background:#eef3ff;display:flex;align-items:center;justify-content:center;font-size:30px;margin:12px auto}' +
    '.kit-opt[data-value=circle] span,.kit-opt[data-value=square] span,.kit-opt[data-value=triangle] span,.kit-opt[data-value=diamond] span{font-size:30px;line-height:1}';
  document.head.appendChild(st);

  function chg(note) { return ' class="chg" data-chg="' + note + '"'; }

  var chart =
    '<div class="dm-chart"><svg viewBox="0 0 320 170">' +
    '<line x1="30" y1="140" x2="310" y2="140" stroke="#cdd5e3"/><line x1="30" y1="10" x2="30" y2="140" stroke="#cdd5e3"/>' +
    '<text x="12" y="80" font-size="10" fill="#596179" transform="rotate(-90 12 80)">Results</text>' +
    '<text x="250" y="158" font-size="10" fill="#596179">Training time</text>' +
    '<path d="M30 128 C 110 120, 170 70, 300 30" fill="none" stroke="#1968ff" stroke-width="3"/>' +
    '<path d="M30 132 C 120 128, 190 100, 300 80" fill="none" stroke="#9aa3bd" stroke-width="3"/>' +
    '<rect x="252" y="14" width="46" height="20" rx="10" fill="#1968ff"/><text x="275" y="28" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">You</text>' +
    '<rect x="222" y="86" width="86" height="28" rx="10" fill="#9aa3bd"/><text x="265" y="98" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">{{genderPlural}}</text><text x="265" y="110" font-size="10" fill="#fff" text-anchor="middle">({{ageBracket}})</text>' +
    '</svg><p>Based on the data of users who log their progress in [Company]</p></div>';

  var latestRows = [
    ['🇺🇸', 'Mary K.', 'a min ago', '2/10', 'Low risk'], ['🇬🇧', 'John P.', '2 min ago', '3/10', 'Low risk'],
    ['🇨🇦', 'Linda S.', '3 min ago', '4/10', 'Mild risk'], ['🇺🇸', 'Robert H.', '4 min ago', '2/10', 'Low risk'],
    ['🇦🇺', 'Susan M.', '6 min ago', '5/10', 'Mild risk'], ['🇺🇸', 'James T.', '7 min ago', '1/10', 'Low risk']
  ];
  var latest = '<div class="dm-latest"' + chg('v4: вместо Memory 93% — риск и уровень') + '>' + latestRows.map(function (r) {
    return '<div><span style="font-size:22px">' + r[0] + '</span><span><b>' + r[1] + '</b><small>' + r[2] + '</small></span><em>' + r[3] + '<small>' + r[4] + '</small></em></div>';
  }).join('') + '</div>';

  var how =
    '<div class="dm-how">' +
    '<div' + chg('v4: обложка PDF-отчёта вместо «Your IQ Score»') + '><div class="dm-cover"><div class="dm-cover__page"><b>Dementia Risk Report</b>Risk score {{risk}}/10<div class="bar"><i style="width:80%"></i></div><div class="bar"><i style="width:55%"></i></div><div class="bar"><i style="width:70%"></i></div><div class="bar"><i style="width:40%"></i></div></div>' +
    '<div class="dm-cover__t">Your Dementia Risk Report<span>4 areas · habits · your next steps · PDF</span></div></div>' +
    '<h4>Know Where Your Memory Stands</h4><p>See your risk score, your 4 areas, and how you compare with {{genderPlural}} {{ageBracket}}.</p></div>' +
    '<div' + chg('v4: сертификат memory check-in') + '><img class="kit-image" src="img/certificate.png" alt="" style="width:100%;border-radius:14px"><h4>Your Memory Certificate</h4><p>Download, print, or share it with your family.</p></div>' +
    '<div><img class="kit-image" src="img/app-training.png" alt="" style="width:100%;border-radius:14px"><h4>Your 5-Minute Daily Memory Plan</h4><p>Familiar games like crosswords and sudoku, picked for your {{focusAreas}}. Large and clear, with no rushing.</p></div>' +
    '</div>';

  function q(id, title, options, extra) {
    var s = { id: id, type: 'single', autoAdvance: false, cta: 'Continue', title: title,
      options: options.map(function (o) { return typeof o === 'string' ? { value: o, label: o } : o; }) };
    return Object.assign(s, extra || {});
  }
  function habit(id, title) {
    return { id: id, type: 'likert', autoAdvance: false, cta: 'Continue', title: title, inCounter: true };
  }

  root.FUNNEL = {
    meta: {
      title: '[Company] — Check In On Dementia Risk (v4 prototype)',
      brand: '[Company]', headerTitle: '[Company]', logo: '',
      counter: 'Question {n} of {total}', counterTypes: ['single', 'likert', 'multi'],
      disclaimer: 'Private. Not a medical test or diagnosis.'
    },
    scoring: scoring,
    screens: [
      { id: 'gender', type: 'intro', title: 'Check In On <span>Dementia Risk</span>',
        subtitle: 'A quick way to check in on memory, focus, and thinking speed.',
        image: 'img/intro.svg',
        bullets: ['17 quick questions about memory, attention, language & everyday habits', 'Takes about 5 minutes', 'Your answers stay private'],
        options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }],
        note: 'Who is this check-in for?' },

      { id: 'q1', type: 'interstitial', title: 'Remember these 3 words — we’ll ask again later:', inCounter: true,
        text: '<b style="font-size:24px;letter-spacing:.04em;color:#1968ff">APPLE • TRAIN • RIVER</b><br><br>Tap Continue when ready.', cta: 'Continue' },
      q('q2', 'Starting at 100, subtract 7 each time: 100, 93, 86... What’s the 4th number?', ['65', '72', '79', '58']),
      q('q3', 'Book is to reading as fork is to: ___', ['Knife', 'Eating', 'Kitchen', 'Spoon']),
      q('q4', 'Which shape completes the sequence?<br><span style="font-size:30px;letter-spacing:6px">△ ○ □ △ ○ ?</span>',
        [{ value: 'circle', label: '<span style="font-size:28px">○</span>' }, { value: 'square', label: '<span style="font-size:28px">□</span>' },
         { value: 'triangle', label: '<span style="font-size:28px">△</span>' }, { value: 'diamond', label: '<span style="font-size:28px">◇</span>' }]),
      q('q5', 'If all cats are mammals, and some mammals are pets, which statement must be true?',
        [{ value: 'all-cats-pets', label: 'All cats are pets' }, { value: 'some-pets-cats', label: 'Some pets are cats' },
         { value: 'no-cats-pets', label: 'No cats are pets' }, { value: 'some-mammals', label: 'Some mammals are pets' }]),
      { id: 'age', type: 'single', autoAdvance: false, cta: 'Continue', inCounter: false,
        title: 'How old are you?', subtitle: 'So you can compare your results with people your age.',
        options: [{ value: '18-49', label: 'Under 50' }, { value: '50-59', label: '50–59' }, { value: '60-69', label: '60–69' }, { value: '70-79', label: '70–79' }, { value: '80+', label: '80 or older' }] },
      q('q6', 'Which number is the odd one out: 8, 24, 36, 45, 60?', ['8', '24', '45', '60']),
      q('q7', 'Earlier we showed you 3 words. What was the second word?', ['Apple', 'Train', 'River', 'Cloud']),
      q('q8', 'Read this number, then answer it backward: 4-9-2-7', ['7294', '7924', '2749', '4927']),
      q('q9', 'Which word means the opposite of “abundant”?', ['Plentiful', 'Scarce', 'Generous', 'Broad']),
      q('q10', 'What time does a clock show if the short hand is on 3 and the long hand is on 12?', ['12:03', '3:12', '3:00', '12:15']),
      { id: 'fact', type: 'interstitial', progress: true, stat: '25%',
        title: 'Brain training is linked to a <span>lower risk of dementia</span>',
        text: 'In a 20-year NIH-funded study, people who did targeted brain training had a 25% lower risk of dementia. Just a few minutes a day makes a difference.',
        source: 'Source: Johns Hopkins Medicine, ACTIVE study', imagePlaceholder: 'Иллюстрация: человек 70+ с телефоном, график вверх', imageStyle: 'plain', imagePosition: 'top',
        cta: 'Continue' },
      q('q11', 'A porter has 3 boxes: 20kg, 40kg, 60kg. The lift limit per trip is 70kg. Minimum trips to move all boxes?', ['1', '2', '3', 'Impossible']),
      q('q12', 'Which is larger, 17 × 3 or 45 + 8?', [{ value: '17x3', label: '17 × 3' }, { value: '45+8', label: '45 + 8' }, { value: 'equal', label: 'Equal' }, { value: 'cant', label: 'Can’t tell' }]),
      habit('q13', 'I get 7+ hours of sleep on most nights.'),
      habit('q14', 'I regularly spend time with friends or family.'),
      habit('q15', 'I do some form of physical activity most weeks.'),
      { id: 'q16', type: 'multi', inCounter: true, subtitle: 'Choose all that apply', title: 'Which of these do you enjoy regularly?',
        options: [
          { value: 'reading', label: 'Reading', emoji: '📚' }, { value: 'gardening', label: 'Gardening or crafts', emoji: '🌱' },
          { value: 'music', label: 'Music or singing', emoji: '🎵' }, { value: 'dancing', label: 'Walking or dancing', emoji: '💃' },
          { value: 'none', label: 'None of these', emoji: '🚫', exclusive: true }] },
      { id: 'q17', type: 'multi', inCounter: true, subtitle: 'Choose all that apply', title: 'How do you keep your brain in shape right now?', cta: 'Get My Results',
        options: [
          { value: 'reading', label: 'Reading books or newspapers', emoji: '📰' }, { value: 'puzzles', label: 'Puzzles, crosswords, or sudoku', emoji: '🧩' },
          { value: 'apps', label: 'Brain-training apps or games', emoji: '📱' }, { value: 'supplements', label: 'Vitamins or supplements', emoji: '💊' },
          { value: 'nothing', label: 'Nothing specific right now', emoji: '🤷', exclusive: true }] },

      { id: 'name', type: 'email', inputType: 'text', autocomplete: 'given-name', maxLength: 30,
        title: 'What’s your <span>first name?</span>', subtitle: 'We’ll put it on your certificate.',
        placeholder: 'Your first name', cta: 'Continue',
        preview: '<div class="dm-namecard"><i>✓</i><small>Check-in complete</small><b>[[value]]</b><span>You’ve successfully finished<br>the Dementia Check-in</span></div>' +
          '<ul class="dm-priv"><li>🔒 Your report is private — only you receive it</li><li>📜 Your name appears only on your certificate</li><li>🙅 We never share your answers with anyone</li></ul>',
        previewFallback: 'Well done!',
        privacy: 'Next, you’ll choose where we send your report.' },

      { id: 'social', type: 'interstitial', title: '<span>5+ Million People</span> Have Discovered Their Dementia Risk with [Company]',
        imagePlaceholder: 'Коллаж аватаров — как в макете', imageStyle: 'plain',
        trust: [{ icon: '👥', text: '<b>125 Users</b> Took Their Test Today.' }, { icon: '⭐', text: 'Trusted by a Community of Over <b>5 Million</b>' }] },

      { id: 'loader', type: 'loader', title: 'Calculating your <span>Dementia Risk...</span>', stepDuration: 1500,
        steps: [{ label: 'Exploring the received data...' }, { label: 'Analyzing your results...' }, { label: 'Sequential analysis...' }, { label: 'Preparing your score report...' }],
        popups: [
          { id: 'popup_sharper', atStep: 1, atPercent: 40, icon: '✦', text: 'Do you think your memory is sharper or weaker than average?', buttons: [{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }] },
          { id: 'popup_first', atStep: 2, atPercent: 50, icon: '✦', text: 'Is this your first dementia check-in?', buttons: [{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }] }
        ],
        review: { title: 'Highly recommend!', author: 'Sarah Thompson', stars: 5, text: 'Simple questions, a clear report, and a daily plan that is easy to stick with.' } },

      { id: 'email', type: 'email', title: 'Where Should We Send Your <span>Dementia Risk Report?</span>',
        subtitle: 'Enter your email to unlock your report and personal brain plan.', cta: 'Continue',
        privacy: 'We respect your privacy. Your answers stay private and are never shared.',
        stats: [{ icon: '⏱', label: 'Questions', value: '17 of 17' }, { icon: '🧩', label: 'Strongest area', value: '{{topArea}}' }, { icon: '🔒', label: 'Your report', value: 'Ready' }] },

      { id: 'paywall', type: 'paywall', ctaScroll: true,
        offerBar: { text: 'Get 85% off your program!', timerSeconds: 600 },
        order: ['top', 'compare', 'inside+badges+plans', 'how', 'latest', 'faq', 'note'],
        cta: 'Get my report and plan',
        blocks: {
          top: { html:
            '<h2 class="kit-title kit-title--lg">Your results are ready</h2>' +
            '<div' + chg('v4: шкала из v2 вместо круга 72%') + '>' +
              '{{gaugeHtml}}<div class="dm-center">{{levelPill}}</div></div>' +
            '<p class="dm-bubble {{bubbleCls}}"' + chg('v4: текст по уровню') + '>{{bubble}}</p>' +
            '<div' + chg('v4: 4 области, проценты заблюрены') + '>{{rowsHtml}}</div>' +
            '<div class="dm-areas"><b>2 areas to strengthen</b>{{focusShort}}</div>' +
            '{{ctaHtml}}' +
            '<p class="dm-private">Private. Not a medical diagnosis.</p>' },
          compare: { html: '<p class="dm-eyebrow">🔒 Inside your full report</p><h3 class="kit-pw-h" style="text-align:center">Compare your results with <span style="color:#1968ff">{{genderPlural}}</span> your age</h3>' + chart },
          badges: { html: '<div class="dm-badges"' + chg('v4: + Full report') + '><div><span>🛡</span>14-day money-back</div><div><span>📜</span>Certificate</div><div><span>📄</span>Full report</div></div>' },
          how: { title: 'How <span style="color:#1968ff">Training Your Memory</span> Can Change Your Everyday Life', html: how },
          latest: { title: 'Latest Memory Checks', html: latest }
        },
        inside: { title: 'Your full report, certificate and 5-minute daily plan',
          items: ['Your Dementia Risk Report — compare your results with {{genderPlural}} {{ageBracket}}', 'Share your certificate with family', '5-minute {{focusAreas}} training in the mobile app'] },
        promo: { text: 'Promo Code [PROMOCODE] Applied', sub: 'You save 85%' },
        payAdvance: true, // после оплаты — success-страница
        plans: { default: 'trial', payMethods: ['paypal', 'gpay', 'card'],
          terms: '$0.99 today, then $20.99 every week. Cancel anytime.',
          items: [{ id: 'trial', name: 'Total due today', note: '3-day trial', price: '$0.99', oldPrice: '$6.99' }] },
        faqTitle: 'Frequently asked questions',
        faq: [
          { q: 'What exactly am I buying?', a: 'A [Company] subscription. It includes your Dementia Risk Report, your certificate, and the [Company] app with a daily brain-training plan. It costs $0.99 for a 3-day trial, then $20.99 per week, and renews until you cancel.' },
          { q: 'What’s in the PDF report?', a: 'A 6-page report: your result, your 4 areas — memory, focus, logic, and language — your everyday habits, how common memory changes are at your age, what’s normal with age and what’s worth a doctor’s visit, 14 things linked to dementia, simple everyday tricks, and your first-week plan.' },
          { q: 'How can brain games help me?', a: 'Short daily games give your memory, focus, quick thinking, and problem solving regular practice, and with practice most people get better at these tasks. The games are not a medical treatment.' },
          { q: 'Is this a medical test?', a: 'No. This check-in is for general information and entertainment purposes only. It is not a medical test, does not diagnose any condition, and does not replace advice from a doctor. If you are worried about your memory, please talk to a healthcare professional.' },
          { q: 'Can I cancel anytime?', a: 'Yes. Cancel in your account settings or write to our support team, and you will not be charged again. Cancel before your trial ends to avoid the next charge.' },
          { q: 'How do I get my report and certificate?', a: 'Right after payment you can download both on screen, and we send them to the email you gave us.' }
        ],
        footerNote: 'Disclaimer: this check-in is for general information and entertainment purposes only and is not a substitute for professional evaluation.' },

      // после оплаты: шаги как в «Типе личности» и новом test-1 — сертификат → отчёт → тренировки → аккаунт, книг нет
      { id: 'success', type: 'paywall', back: false,
        order: ['done', 'st1', 'st2', 'st3', 'st4'],
        blocks: {
          done: { html: '<div class="dm-paid">✓ Payment successful</div><h2 class="kit-title kit-title--lg">You’re all set!</h2><p class="kit-subtitle" style="margin-top:6px">Here is everything you get. Follow these steps to start.</p><p class="dm-mail">We’ve also sent it all to <b>{{answers.email}}</b></p>' },
          st1: { cls: 'dm-step', html: '<div class="dm-step__n">Step 1.</div><h3 class="kit-pw-h" style="margin-top:0">Get your certificate</h3><img class="kit-image" src="img/certificate.png" alt=""><p class="kit-text">Your personal certificate for completing the dementia check-in.</p><a class="kit-btn" href="../certificate/certificate.html?email={{answers.email}}" target="_blank">Download My Certificate</a>' },
          st2: { cls: 'dm-step', html: '<div class="dm-step__n">Step 2.</div><h3 class="kit-pw-h" style="margin-top:0">Get your Dementia Risk Report</h3><img class="kit-image" src="img/report-cover.png" alt="" style="max-width:220px;margin:12px auto;display:block;box-shadow:0 4px 20px #00126f22"><p class="kit-text">Your 6-page report: your result, your 4 areas, everyday habits, what’s normal with age, and your first-week plan.</p><a class="kit-btn" href="{{reportUrl}}" target="_blank">Download My Report</a>' },
          st3: { cls: 'dm-step', html: '<div class="dm-step__n">Step 3.</div><h3 class="kit-pw-h" style="margin-top:0">Start your brain training</h3><img class="kit-image" src="img/app-training.png" alt=""><p class="kit-text">Your daily plan for {{focusAreas}} and 25+ brain games are waiting in the [Company] app. Log in with the same email you used here.</p><a class="kit-btn" href="#" onclick="return false">Start the Journey</a>' },
          st4: { cls: 'dm-step', html: '<div class="dm-step__n">Step 4.</div><h3 class="kit-pw-h" style="margin-top:0">Your account is ready</h3><div class="dm-step__ic">👤</div><p class="kit-text">We’ve created an account with your email so you can manage your subscription anytime.</p><a class="kit-btn" href="#" onclick="return false">View My Account</a>' }
        } }
    ]
  };

  // К ответу нельзя вернуться: кнопка «назад» скрыта везде
  root.FUNNEL.screens.forEach(function (sc) { sc.back = false; });

  /* ---------- шкала и полосы — генерируем тем же видом, что в kit (дуга v2) ---------- */
  function gauge(v, max, label) {
    var segs = 28, out = '';
    for (var k = 0; k < segs; k++) {
      var a = Math.PI * (1 - k / (segs - 1)) * 1.2 - Math.PI * 0.1, cx = 130, cy = 130;
      var x1 = cx + 92 * Math.cos(a), y1 = cy - 92 * Math.sin(a), x2 = cx + 116 * Math.cos(a), y2 = cy - 116 * Math.sin(a);
      var t = k / (segs - 1), col = t <= v / max ? 'hsl(' + Math.round(220 - t * 175) + ',85%,55%)' : '#dfe6f5';
      out += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + col + '" stroke-width="7" stroke-linecap="round"/>';
    }
    return '<div class="kit-gauge"><svg viewBox="0 0 260 175">' + out + '</svg><div class="kit-gauge__value">' + v + '/' + max + '</div><div class="kit-gauge__label">' + label + '</div></div>';
  }
  var baseScoring = scoring;
  root.FUNNEL.scoring = function (a) {
    var r = baseScoring(a);
    r.gaugeHtml = gauge(r.risk, 10, 'Dementia Risk Score');
    r.bubbleCls = r.good ? '' : 'dm-bubble--neutral';
    r.rowsHtml = '<div class="kit-rows">' + r.areas.map(function (x) {
      return '<div class="kit-row"><span class="kit-row__icon">' + x.icon + '</span><span class="kit-row__label">' + x.name + ':</span><span class="kit-row__bar"></span><span class="kit-row__value kit-blur">' + x.pct + '%</span></div>';
    }).join('') + '</div>';
    r.ctaHtml = '<button type="button" class="kit-btn" style="margin-top:16px" onclick="var e=document.querySelector(\'.kit-plans\');if(e)e.scrollIntoView({behavior:\'smooth\',block:\'center\'})">Get my report and plan</button>';
    return r;
  };

  /* ---------- служебные кнопки: подсветка изменений и PDF ---------- */
  window.addEventListener('DOMContentLoaded', function () {
    var box = document.createElement('div'); box.className = 'dm-tools';
    var hl = document.createElement('button'); hl.textContent = 'Изменения';
    hl.onclick = function () { document.body.classList.toggle('dm-hl'); hl.classList.toggle('on'); };
    var pdf = document.createElement('a'); pdf.textContent = 'PDF ↗'; pdf.target = '_blank';
    pdf.onmouseenter = pdf.onfocus = function () { pdf.href = reportUrl(window.KIT ? window.KIT.answers : {}); };
    pdf.href = '../report/report.html';
    box.appendChild(hl); box.appendChild(pdf); document.body.appendChild(box);

    if (params.level) {
      var A = window.KIT.answers, src = D.answersForLevel(params.level, params.gender, params.age);
      Object.keys(src).forEach(function (k) { A[k] = src[k]; });
      A.email = 'preview@example.com';
      window.KIT.go(params.screen || 'paywall');
    }
  });
})(window);
