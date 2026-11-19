<script>
'use strict';
/* ============ فازِ ۳ — روایتِ امپراتوری + تیمِ انسانی ============ */
/* داده و موتورِ داستان: ۱۰ فصل با دیالوگِ انشعابی؛ کارمندانِ فردی با خستگی/روحیه */

const STAFF_ROLES = {
  tech:  { t: 'تکنسین' },
  clean: { t: 'نظافتچی' },
  mgr:   { t: 'مدیرِ دفتر' },
  net:   { t: 'کارشناسِ شبکه' },
  emgr:  { t: 'مدیرِ ای‌اسپورتس' },
};
const STAFF_NAMES = ['مریم','رضا','سینا','الهام','بهرام','پوپک','کامران','شبنم','آرمان','لیلا','فرهاد','مینا','یاسر','ندا'];

function crewFor(role){
  if(!Save.d.crew) Save.d.crew = [];
  if(lvl(role) < 1) return null;
  let m = Save.d.crew.find(c => c.role === role);
  if(!m){
    const used = Save.d.crew.map(c => c.name);
    const pool = STAFF_NAMES.filter(n => !used.includes(n));
    m = {
      role,
      name: pool.length ? pick(pool) : 'کارمندِ تازه',
      skin: pick(SKINS), hair: pick(HAIRS), hairStyle: pick(HAIRSTYLES),
      shirt: pick(CLOTHES), fatigue: 8, happy: 75,
    };
    Save.d.crew.push(m);
    if(STAFF_ROLES[role]) toast('👥 ' + m.name + ' به‌عنوانِ ' + STAFF_ROLES[role].t + ' استخدام شد', 'cyan');
  }
  return m;
}
function crewMul(role){
  const m = Save.d.crew && Save.d.crew.find(c => c.role === role);
  if(!m) return 1;
  return clamp(1 - m.fatigue / 160 - (m.happy < 40 ? 0.15 : 0), 0.45, 1);
}

/* ---------- پرتره‌های رویه‌ای (هم‌سبک با صحنه) ---------- */
function rrG(g, x, y, w, h, r){ /* rrِ مستقل از بافتِ بازی */
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function drawBust(g, ch, S){
  const cx = S / 2, cy = S / 2;
  const bgG = g.createRadialGradient(cx, cy, S * 0.1, cx, cy, S * 0.62);
  bgG.addColorStop(0, ch.bg || '#1e2833');
  bgG.addColorStop(1, '#0a0e14');
  g.fillStyle = bgG;
  g.beginPath(); g.arc(cx, cy, S * 0.48, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1;
  g.beginPath(); g.arc(cx, cy, S * 0.48, 0, TAU); g.stroke();
  /* شانه‌ها */
  const sc = S * 0.16;
  g.fillStyle = ch.shirt;
  rrG(g, cx - sc * 1.35, cy + S * 0.18, sc * 2.7, S * 0.34, S * 0.09); g.fill();
  g.fillStyle = 'rgba(0,0,0,.25)';
  rrG(g, cx - sc * 1.35, cy + S * 0.36, sc * 2.7, S * 0.16, S * 0.06); g.fill();
  /* سر */
  const hr = S * 0.17, hy = cy - S * 0.02;
  g.fillStyle = ch.skin;
  g.beginPath(); g.arc(cx, hy, hr, 0, TAU); g.fill();
  /* مو */
  g.fillStyle = ch.hair || '#1a1a1a';
  const st = ch.style || 'buzz';
  if(st === 'buzz'){
    g.beginPath(); g.arc(cx, hy - hr * 0.14, hr * 1.06, Math.PI * 0.92, Math.PI * 2.08); g.fill();
  } else if(st === 'spiky'){
    g.beginPath(); g.arc(cx, hy - hr * 0.14, hr * 1.06, Math.PI * 0.92, Math.PI * 2.08); g.fill();
    for(let i = 0; i < 4; i++){
      const sx = cx - hr * 0.66 + i * hr * 0.44;
      g.beginPath(); g.moveTo(sx - hr * 0.16, hy - hr * 0.9); g.lineTo(sx, hy - hr * 1.45); g.lineTo(sx + hr * 0.16, hy - hr * 0.9); g.closePath(); g.fill();
    }
  } else if(st === 'bun'){
    g.beginPath(); g.arc(cx, hy - hr * 0.14, hr * 1.06, Math.PI * 0.9, Math.PI * 2.1); g.fill();
    g.beginPath(); g.arc(cx, hy - hr * 1.25, hr * 0.42, 0, TAU); g.fill();
  } else if(st === 'long'){
    g.beginPath(); g.arc(cx, hy - hr * 0.14, hr * 1.06, Math.PI * 0.9, Math.PI * 2.1); g.fill();
    g.fillRect(cx - hr * 1.16, hy - hr * 0.3, hr * 0.34, hr * 1.7);
    g.fillRect(cx + hr * 0.82, hy - hr * 0.3, hr * 0.34, hr * 1.7);
  } else if(st === 'curly'){
    for(let i = 0; i < 4; i++){
      g.beginPath(); g.arc(cx - hr * 0.72 + i * hr * 0.48, hy - hr * 0.86, hr * 0.4, 0, TAU); g.fill();
    }
  } else if(st === 'cap'){
    g.beginPath(); g.arc(cx, hy - hr * 0.14, hr * 1.02, Math.PI * 1.08, Math.PI * 1.92); g.fill();
    g.fillStyle = ch.shirt;
    g.beginPath(); g.arc(cx, hy - hr * 0.4, hr * 1.04, Math.PI, 0); g.fill();
    g.fillRect(cx, hy - hr * 0.52, hr * 1.7, hr * 0.18);
  }
  if(ch.acc === 'glasses'){
    g.strokeStyle = 'rgba(226,232,238,.85)'; g.lineWidth = Math.max(1, S * 0.018);
    g.beginPath(); g.arc(cx - hr * 0.38, hy + hr * 0.08, hr * 0.3, 0, TAU); g.stroke();
    g.beginPath(); g.arc(cx + hr * 0.38, hy + hr * 0.08, hr * 0.3, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(cx - hr * 0.08, hy + hr * 0.08); g.lineTo(cx + hr * 0.08, hy + hr * 0.08); g.stroke();
  }
}

/* ---------- شخصیت‌های داستان ---------- */
const CHARS = {
  rahim: { name: 'عمو رحیم', role: 'مالکِ قبلیِ کافه', skin: '#e2c9a8', hair: '#c8ccd4', style: 'buzz', shirt: '#5a6480', acc: 'glasses', bg: '#2a3542' },
  arash: { name: 'آرش ملکی', role: 'رقیب — گیم‌لندِ پارک', skin: '#f2d4b4', hair: '#3a2a1a', style: 'long', shirt: '#c0304a', bg: '#3a2230' },
  sara:  { name: 'سارا', role: 'تأمین‌کننده‌ی سخت‌افزار', skin: '#c08a58', hair: '#1a2a1a', style: 'bun', shirt: '#3e8a5c', acc: 'glasses', bg: '#1e3a2a' },
  karam: { name: 'بابا کرم', role: 'مشتریِ قدیمیِ محل', skin: '#8a5a3a', hair: '#4a4a4a', style: 'cap', shirt: '#f2c14e', bg: '#3a3220' },
  naz:   { name: 'نازنین', role: 'استریمرِ محبوبِ شهر', skin: '#e0b080', hair: '#6b2a3a', style: 'long', shirt: '#ff5fa2', bg: '#3a2030' },
  self:  { name: 'پارسا', role: 'تو — صاحبِ کافه', skin: '#e0b080', hair: '#1a1a1a', style: 'spiky', shirt: '#2a5ac0', bg: '#1e2a44' },
};

/* ---------- فصل‌ها: when شرطِ آغاز، beats دیالوگ، choice انشعاب ---------- */
const STORY = [
  { t: 'کافه‌ی قدیمی', when: { k: 'start' },
    beats: [
      { who: 'rahim', t: 'پارسا… کلیدِ کافه سنگینه، نه به‌خاطرِ آهن — به‌خاطرِ خاطره‌ها. بیست سال همین‌جا نشستم؛ حالا زانوها دیگر اجازه نمی‌دهند.' },
      { who: 'rahim', t: 'راستش را بخواه، بدهی‌اش هم با خودت. سه ماه اجارهِ عقب‌افتاده، و کامپیوترهایی که از جنگِ اسناد هم پیرترند. ولی این محل، قلبِ محله است.' },
    ],
    choice: { q: 'پاسخِ تو به عمو رحیم چیست؟', opts: [
      { t: '«قرض بده تا از نو بسازیمش» — دو نفرِ یک تیم', fx: { m: 400000, flag: 'debtRahim' }, note: '+۴۰۰ هزار قرضِ بی‌سود' },
      { t: '«تنهایی از پسش برمی‌آیم» — غرورِ یک بنیان‌گذار', fx: { f: 3 }, note: '+۳ اعتبار' },
    ] } },
  { t: 'اولین مشتری‌ها', when: { k: 'serve', n: 5 },
    beats: [
      { who: 'karam', t: 'سلامِ علیکم! من بابا کرمم — از وقتی کافهِ عمو رحیم باز شد، هر روز این‌جا چای می‌خورم. دستگاه‌های نو را هم که دیدم گفتم حتماً بیایم.' },
      { who: 'karam', t: 'پسر جان، آدم‌های این محله حافظه‌ی بلندی دارند. خوبی را می‌شود دو برابر پس گرفت.' },
    ],
    choice: { q: 'با مشتری‌های ثابت چه می‌کنی؟', opts: [
      { t: 'چایِ مشتری‌های وفادار مهمانِ من', fx: { m: -30000, lg: 2 }, note: 'وفاداری +۲ · هزینه ۳۰ هزار' },
      { t: 'کدِ تخفیفِ ۱۰٪ بدهم — حساب‌مان تمیز و شفاف', fx: { f: 2 }, note: '+۲ اعتبار' },
    ] } },
  { t: 'ساختنِ اعتبار', when: { k: 'day', n: 3 },
    beats: [
      { who: 'naz', t: 'سلام! نازنینم — استریمرم. دنبال جایی می‌گردم با نور و حال‌وهوا برای پخشِ زنده. کافه‌ت بوی «تازه» می‌دهد؛ همین را دوست دارم.' },
      { who: 'naz', t: 'یک شبِ پخشِ زنده می‌تواند اسمِ کافه‌ات را به گوشِ نصفِ شهر برساند… یا اگر خراب شود، به سخره بکشد. ریسک با تو.' },
    ],
    choice: { q: 'پخشِ زنده در کافه‌ات؟', opts: [
      { t: 'میزبانِ پخش باش — نورپردازی هم بگیر', fx: { m: -40000, f: 8 }, note: '+۸ شهرت · هزینه ۴۰ هزار' },
      { t: 'فعلاً نه؛ اول باید محکم شوم', fx: { flag: 'streamLater' }, note: 'داستانِ بعدی را تحت‌تأثیر می‌گذارد' },
    ] } },
  { t: 'اولین رقیب', when: { k: 'day', n: 5 },
    beats: [
      { who: 'arash', t: 'پس تو همان پارسایی که همه از «کافه‌ی نو» می‌گویند؟ آرش ملکی‌ام — گیم‌لندِ پارک، مالِ من است. پنج سال است در این شهر پادشاهِ بی‌رقیبم.' },
      { who: 'arash', t: 'قول می‌دهم تا آخرِ فصل، کافه‌ت همان‌قدر خالی باشد که حالا صاحبش هست. یا… بیا رقابت را جشن بگیریم. انتخاب با توست.' },
    ],
    choice: { q: 'در برابرِ آرش چه می‌گویی؟', opts: [
      { t: '«رقابت سالم؛ شهر برای همه‌ی ماست»', fx: { ally: 1 }, note: 'رابطه با آرش بهبود' },
      { t: '«پادشاهی‌ات تمام شده، آرش»', fx: { f: 3, ally: -1 }, note: '+۳ شهرت · رابطه تیره' },
    ] } },
  { t: 'انقلابِ گیمینگ', when: { k: 'level', n: 3 },
    beats: [
      { who: 'sara', t: 'سارا هستم، از پخشِ «تِک‌پارت». کارتِ گرافیک‌های جدید همین هفته رسیده و من دنبال کافی هستم که ارزشِ نصبِ درست را بداند.' },
      { who: 'sara', t: 'بسته‌ی عمده با نصبِ رایگان — ولی فقط برای کسی که همین حالا تصمیم بگیرد. بعد از امشب، قیمتِ کامل.' },
    ],
    choice: { q: 'پیشنهادِ سارا؟', opts: [
      { t: 'خریدِ عمده — همین امشب', fx: { m: -600000, sup: true }, note: 'تخفیفِ تأمین‌کننده (۲۰٪ خریدِ بعدی)' },
      { t: 'صبر — پولِ نقد الان مقدس است', fx: { flag: 'waitSara' }, note: 'شاید بعداً برگردد' },
    ] } },
  { t: 'اولین تورنمنت', when: { k: 'tour', n: 1 },
    beats: [
      { who: 'naz', t: 'دیدم تورنمنتِ اولت را! اتاق پر بود و بچه‌ها هورا می‌کشیدند. پخشِ بعدی‌ام را همین‌جا برگزار می‌کنم — بدونِ چانه.' },
      { who: 'self', t: 'امضای اولین رویدادِ رسمیِ کافه. حالا سؤال این است: انحصاری، یا باز برای همه؟' },
    ],
    choice: { q: 'فرمتِ رویدادهای بعدی؟', opts: [
      { t: 'تیمِ آرش را هم دعوت کن — شهر یک‌صدا', fx: { ally: 1, f: 3 }, note: '+۳ شهرت · رابطه بهتر' },
      { t: 'انحصاری — برندِ خودم را بسازم', fx: { m: 150000 }, note: '+۱۵۰ هزار اسپانسرِ محلی' },
    ] } },
  { t: 'گسترشِ VIP', when: { k: 'vip' },
    beats: [
      { who: 'sara', t: 'یک سرمایه‌گذار از شمالِ شهر پرسید «کافه‌ای که VIPِ واقعی دارد کجاست؟» — اسمِ تو را برد. می‌خواهد سهمِ کوچکی بخرد تا شاخه‌ی دوم باز کنی.' },
      { who: 'self', t: 'پولِ تازه یعنی سرعت… و سهمِ دادن یعنی از دست دادنِ بخشی از روحِ کافه.' },
    ],
    choice: { q: 'پیشنهادِ شراکت؟', opts: [
      { t: 'بپذیر — شاخه‌ی دوم نزدیک است', fx: { m: 800000, flag: 'investor' }, note: '+۸۰۰ هزار سرمایه' },
      { t: 'استقلالِ کامل — امپراتوریِ خودم', fx: { f: 4 }, note: '+۴ اعتبار' },
    ] } },
  { t: 'بحرانِ کسب‌وکار', when: { k: 'day', n: 12 },
    beats: [
      { who: 'rahim', t: 'پارسا، صاحبِ ملک همه‌ی اجاره‌های این خیابان را بالا برده. شنیدم برای کافه‌ی تو بدترین سهم را خواسته — می‌دانم چرا: کسی از قدرتِ تازه می‌ترسد.' },
      { who: 'rahim', t: 'پولِ پس‌اندازِ من همیشه برای تو هست. یا می‌توانی کمرنگ شو تا طوفان رد شود؛ هر دو راه عزت دارد.' },
    ],
    choice: { q: 'در بحرانِ اجاره؟', opts: [
      { t: 'قرضِ بی‌بهره از عمو رحیم', fx: { m: 500000, flag: 'rahim2' }, note: '+۵۰۰ هزار، بی‌سود' },
      { t: 'کاهشِ هزینه‌ها و کمرنگ‌شدنِ موقت', fx: { m: 100000, f: -2 }, note: '+۱۰۰ هزار · −۲ اعتبار' },
    ] } },
  { t: 'قهرمانیِ شهر', when: { k: 'stage', n: 2 },
    beats: [
      { who: 'arash', t: 'انجمنِ بازی‌های رایانه‌ایِ شهر برگزارِ «قهرمانیِ بزرگ» را به من پیشنهاد داد. گفتم فقط یک جا ظرفیتش را دارد: کافه‌ی پارسا. تعجب نکن؛ من فقط رقیبم، دشمن نیستم.' },
      { who: 'self', t: 'میزبانِ قهرمانیِ شهر — بزرگ‌ترین شبِ عمرِ این کافه. هزینه‌اش سنگین است، اما جواهرِ رزومه همین‌جاست.' },
    ],
    choice: { q: 'پذیرشِ قهرمانیِ شهر؟', opts: [
      { t: 'قبول — با تمامِ توان', fx: { m: -250000, f: 6 }, note: '−۲۵۰ هزار · +۶ شهرت' },
      { t: 'امسال نه — تمرینِ بیشتر', fx: { flag: 'skipChamp' }, note: 'شاید سالِ بعد' },
    ] } },
  { t: 'امپراتوریِ گیمینگ', when: { k: 'stage', n: 3 },
    beats: [],
    dyn: () => {
      const S = Save.d.story, beats = [];
      if(S.ally.rival >= 2){
        beats.push({ who: 'arash', t: 'امروز دیوارِ بینِ دو کافه را برداشتم — نیمکتِ وسط، برندِ مشترک: «پارکِ نت». رقابتِ ما شهر را بزرگ کرد؛ اتحادِ ما بی‌اندازه‌اش می‌کند.' });
        beats.push({ who: 'rahim', t: 'پارسا… یادت هست گفتم این کافه قلبِ محله است؟ حالا قلبِ شهر شده. زانوهای من درد می‌کنند، ولی دلم یا توست.' });
      } else if(S.flags.investor){
        beats.push({ who: 'sara', t: 'شاخه‌ی دوم باز شد و سومی در راه است. تو دیگر صاحبِ یک کافه نیستی؛ صاحبِ یک شبکه‌ای.' });
        beats.push({ who: 'naz', t: 'هر استریمم از یکی از شاخه‌های تو پخش می‌شود. «امپراتوریِ گیمینگ» فقط یک عنوانِ قشنگ نیست — آمارِ بینندگانم ثابتش می‌کند.' });
      } else {
        beats.push({ who: 'karam', t: 'از روزی که چایِ مهمانِ من بودی تا امشب که تمامِ شهر اسمِ کافه‌ات را می‌داند… من هیچ‌جا نرفته‌ام، پسر. این صندلی، مالِ من و تو.' });
        beats.push({ who: 'rahim', t: 'کافه را نساختی؛ از نو زنده‌اش کردی. عمو رحیم حالا می‌تواند آرام برود — کافه‌نت، امپراتوریِ توست.' });
      }
      return beats;
    },
  },
];

/* ---------- موتورِ دیالوگ ---------- */
let stIdx = 0, stBeats = [], stBeatI = 0, stTyping = null, stRO = false, stChoiceDone = false;

function storyWhen(w){
  if(w.k === 'start') return Save.d.day === 1 && (G.runStats.served || 0) === 0 && !('seenHow' in Save.d && Save.d.seenHow === 2);
  if(w.k === 'day') return Save.d.day >= w.n;
  if(w.k === 'serve') return (G.runStats.served || 0) >= w.n;
  if(w.k === 'level') return (G.level || 1) >= w.n;
  if(w.k === 'tour') return (G.runStats.tourneys || 0) >= w.n;
  if(w.k === 'vip') return lvl('vip') >= 1;
  if(w.k === 'stage'){
    const si = stageInfo();
    return STAGES.indexOf(si) >= w.n;
  }
  return false;
}
function checkStory(){
  if(Save.d.story.ch >= STORY.length) return;
  if(!$('storyOv').hidden) return;
  const c = STORY[Save.d.story.ch];
  if(c && storyWhen(c.when)) openStory(Save.d.story.ch, false);
}
function openStory(idx, ro){
  const c = STORY[idx];
  if(!c) return;
  stIdx = idx; stRO = !!ro; stBeatI = 0; stChoiceDone = false;
  stBeats = c.dyn ? c.dyn() : c.beats.slice();
  const ov = $('storyOv');
  ov.hidden = false;
  stShowBeat();
}
function stShowBeat(){
  const c = STORY[stIdx];
  const last = stBeatI >= stBeats.length - 1;
  const isChoiceBeat = last && c.choice && !stRO && !stChoiceDone;
  /* آخرین بیتِ فصلِ بی‌انتخاب یا انتخاب‌شده = پایانی */
  if(stBeatI >= stBeats.length){ stEndChapter(); return; }
  const b = stBeats[stBeatI];
  const ch = CHARS[b.who] || CHARS.self;
  $('stName').textContent = ch.name;
  $('stRole').textContent = ch.role;
  const pc = $('stPortrait');
  const g = pc.getContext('2d');
  g.clearRect(0, 0, pc.width, pc.height);
  drawBust(g, ch, pc.width);
  const btns = $('stBtns');
  btns.innerHTML = '';
  const textEl = $('stText');
  /* ماشینِ تایپ */
  if(stTyping){ clearInterval(stTyping); stTyping = null; }
  const full = b.t;
  let i = 0;
  textEl.textContent = '';
  stTyping = setInterval(() => {
    i += 2;
    textEl.textContent = full.slice(0, i);
    if(i >= full.length){ clearInterval(stTyping); stTyping = null; }
  }, 16);
  if(isChoiceBeat){
    const q = document.createElement('div');
    q.className = 'stq';
    q.textContent = c.choice.q;
    btns.appendChild(q);
    for(const o of c.choice.opts){
      const bt = document.createElement('button');
      bt.className = 'nbtn stopt';
      bt.innerHTML = o.t + '<span class="note">' + (o.note || '') + '</span>';
      bt.onclick = () => { Sfx.tickS(); stPick(o); };
      btns.appendChild(bt);
    }
  } else {
    const bt = document.createElement('button');
    bt.className = 'nbtn ghost';
    bt.textContent = stRO ? 'بستن' : (last ? 'پایانِ فصل ✓' : 'بعدی ▶');
    bt.onclick = () => { Sfx.tickS(); stAdvance(); };
    btns.appendChild(bt);
  }
}
function stAdvance(){
  if(stTyping){ clearInterval(stTyping); stTyping = null; $('stText').textContent = stBeats[stBeatI] ? stBeats[stBeatI].t : ''; return; }
  stBeatI++;
  if(stBeatI >= stBeats.length && !(stBeats.length === 0)){ stEndChapter(); return; }
  stShowBeat();
}
function stPick(o){
  stChoiceDone = true;
  stApply(o.fx || {});
  const S = Save.d.story;
  const rec = { i: stIdx, pick: o.t.split('—')[0].trim() };
  if(!S.seen.some(s => s.i === stIdx)) S.seen.push(rec);
  else S.seen = S.seen.map(s => s.i === stIdx ? rec : s);
  S.ch = stIdx + 1;
  persist();
  const c = STORY[stIdx];
  if(stBeatI < stBeats.length - 1){ stBeatI = stBeats.length - 1; stShowBeat(); return; } // ادامه‌ی بیت‌ها با اثرِ انتخاب
  closeStory();
  toast('📖 فصلِ «' + c.t + '» تمام شد', 'cyan');
  Sfx.mission();
}
function stApply(fx){
  if(fx.m){ G.money = Math.max(0, G.money + fx.m); floater(G.cam.x + 240, 130, (fx.m > 0 ? '+' : '') + fmtK(fx.m), fx.m > 0 ? '#4cff9e' : '#ff4d5e'); }
  if(fx.f) G.fame = clamp(G.fame + fx.f, 0, 100);
  if(fx.ally) Save.d.story.ally.rival = clamp(Save.d.story.ally.rival + fx.ally, -3, 3);
  if(fx.flag) Save.d.story.flags[fx.flag] = true;
  if(fx.sup) Save.d.supplier = true;
  if(fx.lg) Save.d.loyal.good = (Save.d.loyal.good || 0) + fx.lg;
  if(fx.m || fx.f) toast('📖 پیامدِ داستان اعمال شد', 'cyan');
  persist();
}
function stEndChapter(){
  const S = Save.d.story, c = STORY[stIdx];
  if(stRO){ closeStory(); return; }
  if(!S.seen.some(s => s.i === stIdx)) S.seen.push({ i: stIdx, pick: null });
  S.ch = stIdx + 1;
  persist();
  closeStory();
  toast('📖 فصلِ «' + c.t + '» تمام شد', 'cyan');
  Sfx.mission();
}
function closeStory(){
  if(stTyping){ clearInterval(stTyping); stTyping = null; }
  $('storyOv').hidden = true;
}
function stAdvanceKey(){ /* ESC روی دیالوگ */
  if(!$('storyOv').hidden) stAdvance();
}

/* ---------- دفترچه‌ی داستان ---------- */
function openStoryLog(){
  const list = $('stLogList');
  list.innerHTML = '';
  const seen = Save.d.story.seen || [];
  if(!seen.length){
    const d = document.createElement('div');
    d.className = 'ps';
    d.textContent = 'هنوز فصلی باز نشده — روزهای کافه را پیش ببر تا داستان آغاز شود.';
    list.appendChild(d);
  }
  for(const s of seen.slice().sort((a, b) => a.i - b.i)){
    const c = STORY[s.i];
    if(!c) continue;
    const row = document.createElement('button');
    row.className = 'nbtn ghost logrow';
    row.innerHTML = '<b>فصلِ ' + faNum(s.i + 1) + ' — ' + c.t + '</b><span class="note">' + (s.pick ? 'انتخابِ تو: ' + s.pick : 'بدونِ انتخاب') + '</span>';
    row.onclick = () => { Sfx.tickS(); hideFade('storyLog'); setTimeout(() => openStory(s.i, true), 240); };
    list.appendChild(row);
  }
  $('storyLog').hidden = false;
}

/* ---------- پنلِ تیم ---------- */
function openCrew(){
  const list = $('crewList');
  list.innerHTML = '';
  let any = false;
  for(const role of Object.keys(STAFF_ROLES)){
    if(lvl(role) < 1) continue;
    const m = crewFor(role);
    if(!m) continue;
    any = true;
    const row = document.createElement('div');
    row.className = 'crewRow';
    const cv = document.createElement('canvas');
    cv.width = 44; cv.height = 44;
    drawBust(cv.getContext('2d'), { name: m.name, skin: m.skin, hair: m.hair, style: m.hairStyle, shirt: m.shirt, bg: '#1e2833' }, 44);
    row.appendChild(cv);
    const info = document.createElement('div');
    info.className = 'crewInfo';
    const fatC = m.fatigue < 40 ? '#4cff9e' : m.fatigue < 70 ? '#f2c14e' : '#ff4d5e';
    const hapC = m.happy < 40 ? '#ff4d5e' : m.happy < 60 ? '#f2c14e' : '#4cff9e';
    info.innerHTML = '<b>' + m.name + '</b><span class="note">' + STAFF_ROLES[role].t + '</span>'
      + '<div class="fbarL">خستگی<div class="fbar"><i style="width:' + m.fatigue + '%;background:' + fatC + '"></i></div></div>'
      + '<div class="fbarL">روحیه<div class="fbar"><i style="width:' + m.happy + '%;background:' + hapC + '"></i></div></div>';
    row.appendChild(info);
    if(m.fatigue > 15){
      const bt = document.createElement('button');
      bt.className = 'nbtn ghost rest';
      bt.textContent = '☕ استراحتِ امروز';
      bt.onclick = () => {
        Sfx.tickS();
        if(G.money < 25000){ toast('پولِ استراحتِ پرسنل نیست (۲۵ هزار)', 'red'); return; }
        G.money -= 25000;
        m.fatigue = Math.max(0, m.fatigue - 35);
        m.happy = clamp(m.happy + 5, 10, 100);
        toast('☕ ' + m.name + ' استراحت کرد — خستگی کم شد', 'cyan');
        persist(); openCrew();
      };
      row.appendChild(bt);
    }
    list.appendChild(row);
  }
  if(!any){
    const d = document.createElement('div');
    d.className = 'ps';
    d.textContent = 'هنوز کسی استخدام نشده — ارتقای «تکنسین» یا «نظافت» در بندیِ ارتقا، اولین هم‌تیمی‌ات را می‌آورد.';
    list.appendChild(d);
  }
  $('crewOv').hidden = false;
}
</script>
