(function () {
  'use strict';

  const LEVELS = {
    easy:   { name: '简单', pairs: 6,  cols: 4 },
    normal: { name: '普通', pairs: 8,  cols: 4 },
    hard:   { name: '困难', pairs: 12, cols: 6 }
  };
  const EMOJIS = ['🍎','🍇','🍉','🍋','🍓','🥑','🍍','🥝','🌽','🍄','🌶️','🥕','🍔','🍕','🍩','🍪','🍫','🍿'];
  const FLIP_BACK_DELAY = 750;

  const board   = document.getElementById('board');
  const movesEl = document.getElementById('moves');
  const pairsEl = document.getElementById('pairs');
  const timeEl  = document.getElementById('time');
  const bestEl  = document.getElementById('best');
  const winEl   = document.getElementById('win');

  let levelKey = 'normal';
  let cfg, first, second, lock, moves, matched, seconds, timerId, started;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function fmt(sec) {
    return String(Math.floor(sec / 60)).padStart(2, '0') + ':' +
           String(sec % 60).padStart(2, '0');
  }

  function getBest(level) {
    try {
      const v = localStorage.getItem('memory-best-' + level);
      return v === null ? null : parseInt(v, 10);
    } catch (e) { return null; }
  }

  function setBest(level, value) {
    try { localStorage.setItem('memory-best-' + level, String(value)); } catch (e) {}
  }

  function updateHud() {
    movesEl.textContent = moves;
    pairsEl.textContent = matched + '/' + cfg.pairs;
    timeEl.textContent = fmt(seconds);
    const b = getBest(levelKey);
    bestEl.textContent = (b === null) ? '—' : b;
  }

  function init(key) {
    if (key) levelKey = key;
    cfg = LEVELS[levelKey];

    clearInterval(timerId);
    timerId = null;
    first = second = null;
    lock = false;
    moves = 0;
    matched = 0;
    seconds = 0;
    started = false;

    document.documentElement.style.setProperty('--cols', cfg.cols);

    const picked = shuffle(EMOJIS.slice()).slice(0, cfg.pairs);
    const deck = shuffle(picked.concat(picked));

    board.innerHTML = '';
    const frag = document.createDocumentFragment();

    deck.forEach(function (emoji) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'card';
      card.dataset.emoji = emoji;
      card.setAttribute('aria-label', '未翻开的卡片');
      card.innerHTML =
        '<div class="card-inner">' +
          '<div class="card-face card-back">?</div>' +
          '<div class="card-face card-front">' + emoji + '</div>' +
        '</div>';
      card.addEventListener('click', function () { onFlip(card); });
      frag.appendChild(card);
    });

    board.appendChild(frag);
    winEl.classList.add('hidden');
    updateHud();
  }

  function startTimer() {
    started = true;
    timerId = setInterval(function () {
      seconds++;
      timeEl.textContent = fmt(seconds);
    }, 1000);
  }

  function onFlip(card) {
    if (lock) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    if (!started) startTimer();

    card.classList.add('flipped');
    card.setAttribute('aria-label', '已翻开');

    if (!first) {
      first = card;
      return;
    }

    second = card;
    moves++;
    updateHud();

    if (first.dataset.emoji === second.dataset.emoji) {
      const a = first, b = second;
      first = second = null;

      a.classList.add('matched');
      b.classList.add('matched');
      a.disabled = true;
      b.disabled = true;

      matched++;
      updateHud();

      if (matched === cfg.pairs) win();
    } else {
      const a = first, b = second;
      first = second = null;
      lock = true;

      setTimeout(function () {
        a.classList.remove('flipped');
        b.classList.remove('flipped');
        a.setAttribute('aria-label', '未翻开的卡片');
        b.setAttribute('aria-label', '未翻开的卡片');
        lock = false;
      }, FLIP_BACK_DELAY);
    }
  }

  function win() {
    clearInterval(timerId);
    timerId = null;
    started = false;

    const ratio = moves / cfg.pairs;
    const stars = ratio <= 1.5 ? 3 : (ratio <= 2.5 ? 2 : 1);

    const prev = getBest(levelKey);
    const isNew = (prev === null || moves < prev);
    if (isNew) setBest(levelKey, moves);

    document.getElementById('winStars').textContent =
      '★'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('winDetail').innerHTML =
      '难度 <b>' + cfg.name + '</b> ｜ 用时 <b>' + fmt(seconds) +
      '</b> ｜ 步数 <b>' + moves + '</b>';
    document.getElementById('winBest').textContent =
      isNew ? '🏆 新纪录！' : ('本难度最佳：' + prev + ' 步');

    updateHud();
    winEl.classList.remove('hidden');
  }

  document.getElementById('levels').addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-level]');
    if (!btn) return;
    Array.prototype.forEach.call(btn.parentElement.children, function (b) {
      b.classList.toggle('active', b === btn);
    });
    init(btn.dataset.level);
  });

  document.getElementById('restart').addEventListener('click', function () { init(); });
  document.getElementById('playAgain').addEventListener('click', function () { init(); });

  init(levelKey);
})();