/* =========================================================
   Kalvino Coffee – mintaoldal
   ========================================================= */

/* ---------- KÖNNYEN ÁTÍRHATÓ ADATOK ---------- */

/* ELLENŐRIZENDŐ: a nyitvatartás csak helyőrző, egyeztetni kell a tulajdonossal!
   Formátum: { nyit: 'ÓÓ:PP', zar: 'ÓÓ:PP' }, zárt nap: null */
const NYITVATARTAS = {
  hetfo:     { nyit: '07:00', zar: '18:00' },
  kedd:      { nyit: '07:00', zar: '18:00' },
  szerda:    { nyit: '07:00', zar: '18:00' },
  csutortok: { nyit: '07:00', zar: '18:00' },
  pentek:    { nyit: '07:00', zar: '18:00' },
  szombat:   { nyit: '08:00', zar: '14:00' },
  vasarnap:  { nyit: '08:00', zar: '14:00' }
};

/* „Ma a levesünk” krétatábla */
const MAI_LEVES = {
  nev: 'Toszkán paradicsomleves',
  leiras: 'mini mozzarellával és rukkolával. Forró, fűszeres, tökéletes.',
  jelzok: ['gluténmentes', 'mozzarella nélkül laktózmentes is']
};

/* ---------- innentől nem kell hozzányúlni ---------- */

const MOTION = document.documentElement.classList.contains('motion');

/* A JS getDay() sorrendje: vasárnap = 0 */
const NAPOK = [
  { kulcs: 'vasarnap',  rovid: 'V',   ragos: 'vasárnap' },
  { kulcs: 'hetfo',     rovid: 'H',   ragos: 'hétfőn' },
  { kulcs: 'kedd',      rovid: 'K',   ragos: 'kedden' },
  { kulcs: 'szerda',    rovid: 'Sze', ragos: 'szerdán' },
  { kulcs: 'csutortok', rovid: 'Cs',  ragos: 'csütörtökön' },
  { kulcs: 'pentek',    rovid: 'P',   ragos: 'pénteken' },
  { kulcs: 'szombat',   rovid: 'Szo', ragos: 'szombaton' }
];

const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const fmt = (t) => t.replace(/^0/, '');

/* Mindig a magyar idő számít, akárhol nézik az oldalt */
function budapestNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Budapest',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, min: Number(get('hour')) * 60 + Number(get('minute')) };
}

/* ---------- Most nyitva / Most zárva ---------- */
function updateStatus() {
  const el = document.querySelector('[data-status]');
  if (!el) return;
  const text = el.querySelector('.status__text');
  const { day, min } = budapestNow();
  const today = NYITVATARTAS[NAPOK[day].kulcs];
  const open = today && min >= toMin(today.nyit) && min < toMin(today.zar);

  let label;
  if (open) {
    label = `Most nyitva · ${fmt(today.zar)}-ig`;
  } else {
    label = 'Most zárva';
    for (let k = 0; k < 8; k++) {
      const d = (day + k) % 7;
      const h = NYITVATARTAS[NAPOK[d].kulcs];
      if (!h) continue;
      if (k === 0 && min >= toMin(h.nyit)) continue;
      const when = k === 0 ? 'ma' : k === 1 ? 'holnap' : NAPOK[d].ragos;
      label += ` · ${when} ${fmt(h.nyit)}-kor nyitunk`;
      break;
    }
  }
  text.textContent = label;
  el.classList.toggle('status--open', !!open);
  el.classList.toggle('status--closed', !open);
}

/* ---------- Nyitvatartás lista (azonos napok összevonva) ---------- */
function renderHours() {
  const list = document.querySelector('[data-hours]');
  if (!list) return;
  const order = [1, 2, 3, 4, 5, 6, 0];
  const groups = [];
  order.forEach((d) => {
    const h = NYITVATARTAS[NAPOK[d].kulcs];
    const val = h ? `${fmt(h.nyit)}–${fmt(h.zar)}` : 'zárva';
    const last = groups[groups.length - 1];
    if (last && last.val === val) last.days.push(d);
    else groups.push({ val, days: [d] });
  });
  list.innerHTML = '';
  groups.forEach((g) => {
    const first = NAPOK[g.days[0]].rovid;
    const lastDay = NAPOK[g.days[g.days.length - 1]].rovid;
    const li = document.createElement('li');
    const a = document.createElement('span');
    const b = document.createElement('span');
    a.textContent = g.days.length > 1 ? `${first}–${lastDay}` : first;
    b.textContent = g.val;
    li.append(a, ' ', b);
    list.append(li);
  });
}

/* ---------- Segéd: egyszer induló IntersectionObserver ---------- */
function onceVisible(els, cb, options = {}) {
  if (!('IntersectionObserver' in window)) {
    els.forEach(cb);
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        io.unobserve(e.target);
        cb(e.target);
      }
    });
  }, options);
  els.forEach((el) => io.observe(el));
}

/* ---------- 1. Kávéval telő logó ---------- */
function initLogo() {
  const logo = document.querySelector('.logo');
  if (!logo || !MOTION) return;
  const start = () => onceVisible([logo], (el) => el.classList.add('is-pouring'), { threshold: 0.4 });
  /* a betűk csak a betöltött betűtípussal szépek, ezért megvárjuk */
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(start);
  } else {
    start();
  }
}

/* ---------- 2. Előhívódó polaroid fotók ---------- */
function initPolaroids() {
  if (!MOTION) return;
  const items = [...document.querySelectorAll('.polaroid')];
  items.forEach((fig) => {
    fig.classList.add('is-waiting');
    const photo = fig.querySelector('.polaroid__photo');
    const pic = photo.querySelector('picture');
    if (pic) {
      const ghost = document.createElement('div');
      ghost.className = 'polaroid__ghost';
      ghost.setAttribute('aria-hidden', 'true');
      const clone = pic.cloneNode(true);
      const img = clone.querySelector('img');
      img.alt = '';
      img.removeAttribute('fetchpriority');
      ghost.append(clone);
      photo.append(ghost);
    }
    const milk = document.createElement('div');
    milk.className = 'polaroid__milk';
    milk.setAttribute('aria-hidden', 'true');
    photo.append(milk);
  });
  onceVisible(items, (fig) => {
    fig.classList.remove('is-waiting');
    fig.classList.add('is-developed');
  }, { threshold: 0.3 });
}

/* ---------- 3. Kutyamancs-nyomok ---------- */
function initPaws() {
  const strip = document.querySelector('.paws');
  if (!strip || !MOTION) return;
  onceVisible([strip], () => {
    const step = 44;
    const width = strip.clientWidth;
    const count = Math.max(4, Math.floor((width - 40) / step));
    const ns = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < count; i++) {
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('class', 'paw');
      const use = document.createElementNS(ns, 'use');
      use.setAttribute('href', '#i-paw');
      svg.append(use);
      const x = 12 + i * step;
      const y = i % 2 ? 40 : 12;
      const tilt = 90 + (i % 2 ? 8 : -8);
      svg.style.setProperty('--pos', `translate(${x}px, ${y}px) rotate(${tilt}deg)`);
      svg.style.animationDelay = `${i * 0.17}s`;
      strip.append(svg);
      svg.classList.add('is-step');
    }
    setTimeout(() => { strip.innerHTML = ''; }, count * 170 + 3000);
  }, { threshold: 1, rootMargin: '0px 0px -20% 0px' });
}

/* ---------- 4. Krétatábla ---------- */
function initBoard() {
  const board = document.querySelector('.board');
  if (!board) return;
  const nameEl = board.querySelector('[data-soup-name]');
  const descEl = board.querySelector('[data-soup-desc]');
  const dietEl = board.querySelector('[data-soup-diet]');

  dietEl.innerHTML = '';
  MAI_LEVES.jelzok.forEach((j) => {
    const li = document.createElement('li');
    li.textContent = j;
    dietEl.append(li);
  });

  if (!MOTION) {
    nameEl.textContent = MAI_LEVES.nev;
    descEl.textContent = MAI_LEVES.leiras;
    return;
  }

  let t = 0.2;
  const timeline = [];
  const split = (el, text) => {
    el.textContent = '';
    text.split(' ').forEach((word, i, arr) => {
      const span = document.createElement('span');
      span.className = 'chalk-word';
      span.textContent = word;
      const d = Math.max(0.2, word.length * 0.065);
      span.style.setProperty('--d', `${d}s`);
      span.style.setProperty('--delay', `${t}s`);
      timeline.push({ span, end: t + d });
      t += d + 0.07;
      el.append(span);
      if (i < arr.length - 1) el.append(' ');
    });
  };
  split(nameEl, MAI_LEVES.nev);
  t += 0.3;
  split(descEl, MAI_LEVES.leiras);
  [...dietEl.children].forEach((li, i) => li.style.setProperty('--delay', `${t + 0.2 + i * 0.25}s`));
  board.classList.add('is-ready');

  onceVisible([board], () => {
    board.classList.add('is-writing');
    timeline.forEach(({ span, end }) => setTimeout(() => dust(board, span), end * 1000));
  }, { threshold: 0.5 });
}

function dust(board, span) {
  const x = span.offsetLeft + span.offsetWidth;
  const y = span.offsetTop + span.offsetHeight * 0.75;
  for (let i = 0; i < 4; i++) {
    const p = document.createElement('span');
    p.className = 'dust';
    p.style.left = `${x - Math.random() * 10}px`;
    p.style.top = `${y}px`;
    p.style.setProperty('--dx', `${(Math.random() - 0.5) * 18}px`);
    p.style.setProperty('--dy', `${14 + Math.random() * 22}px`);
    p.style.animationDelay = `${Math.random() * 0.15}s`;
    board.append(p);
    p.addEventListener('animationend', () => p.remove());
  }
}

/* ---------- 5. Csészeszint görgetésjelző ---------- */
function initCup() {
  const btn = document.querySelector('.cup-top');
  if (!btn) return;
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    btn.style.setProperty('--level', `${(30 * (1 - p)).toFixed(2)}px`);
    btn.classList.toggle('is-full', p > 0.985);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: MOTION ? 'smooth' : 'auto' });
    const brand = document.querySelector('.brand');
    if (brand) brand.focus({ preventScroll: true });
  });
}

/* ---------- 6. Latte art érintésre is ---------- */
function initLatte() {
  const card = document.querySelector('.card--coffee');
  if (!card) return;
  card.addEventListener('click', () => card.classList.toggle('is-poured'));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.classList.toggle('is-poured');
    }
  });
}

/* ---------- Indítás ---------- */
renderHours();
updateStatus();
setInterval(updateStatus, 60 * 1000);
initLogo();
initPolaroids();
initPaws();
initBoard();
initCup();
initLatte();
