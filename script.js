const STORAGE_KEY = 'bingo-cartela';
let palavras = [];
let selections = Array(24).fill('');
let wordsChanged = false;

function gridToSelIndex(i) {
  return i < 12 ? i : i - 1;
}

async function loadWords() {
  const res = await fetch('words.json');
  const jsonText = await res.text();
  let parsed = [];
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.error('words.json parse error', e);
    parsed = [];
  }
  // Compare with stored words JSON if available, otherwise compare hashes
  try {
    const prevJson = localStorage.getItem('bingo-words-json');
    const newHash = hashString(jsonText);
    const prevHash = localStorage.getItem('bingo-words-hash');
    if ((prevJson && prevJson !== jsonText) || (!prevJson && prevHash && prevHash !== newHash)) {
      // words changed -> remove saved cartela and mark changed
      localStorage.removeItem(STORAGE_KEY);
      selections = Array(24).fill('');
      saveState();
      wordsChanged = true;
    }
    // store current words content and hash for future comparisons
    localStorage.setItem('bingo-words-json', jsonText);
    localStorage.setItem('bingo-words-hash', newHash);
  } catch (e) {
    console.warn('Could not compare/store words.json', e);
  }

  palavras = parsed;
}

function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
    h = h & 0xffffffff;
  }
  return (h >>> 0).toString(36);
}

function allCellsFilled() {
  return selections.every(s => typeof s === 'string' && s.trim() !== '');
}

function updatePlayTabVisibility() {
  const playBtn = document.getElementById('tab-play-btn');
  const playActions = document.getElementById('play-actions');
  const statusEl = document.getElementById('config-status');
  const filledCount = selections.reduce((acc, s) => acc + (typeof s === 'string' && s.trim() !== '' ? 1 : 0), 0);
  if (statusEl) statusEl.textContent = `Células preenchidas: ${filledCount} / ${selections.length}`;
  if (!playBtn) return;
  if (filledCount === selections.length) {
    playBtn.style.display = '';
    if (playActions) playActions.style.display = '';
  } else {
    playBtn.style.display = 'none';
    if (playActions) playActions.style.display = 'none';
    // if currently viewing play, switch back to config
    const playContent = document.getElementById('play');
    if (playContent && playContent.classList.contains('active')) {
      document.getElementById('tab-config-btn').click();
    }
  }
}

function saveState() {
  const toSave = selections.slice(0, 24).map(s => (typeof s === 'string' ? s : ''));
  selections = toSave;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) selections = parsed;
    } catch (e) {
      selections = Array(24).fill('');
    }
  }
  normalizeSelections();
  // persist normalized state
  saveState();
}

function normalizeSelections() {
  if (!Array.isArray(selections)) selections = Array(24).fill('');
  if (selections.length > 24) selections = selections.slice(0, 24);
  if (selections.length < 24) selections = selections.concat(Array(24 - selections.length).fill(''));
}

function getAvailableWords(index) {
  const sIdx = gridToSelIndex(index);
  return palavras.filter(p => !selections.includes(p) || selections[sIdx] === p);
}

function renderConfig() {
  const container = document.getElementById('bingo-config');
  container.innerHTML = '';
  const table = document.createElement('table');
  // add column headers B I N G O
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['B','I','N','G','O'].forEach(letter => {
    const th = document.createElement('th');
    th.textContent = letter;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  let i = 0;

  for (let r = 0; r < 5; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < 5; c++) {
      if (i === 12) {
        const td = document.createElement('td');
        const line1 = document.createElement('div');
        line1.textContent = 'Geek';
        const line2 = document.createElement('div');
        line2.textContent = 'Girls';
        td.appendChild(line1);
        td.appendChild(line2);
        tr.appendChild(td);
        i++;
        continue;
      }
      const td = document.createElement('td');

      const sIdx = gridToSelIndex(i);

      if (selections[sIdx]) {
        const span = document.createElement('div');
        span.textContent = selections[sIdx];
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Limpar';
        clearBtn.style.marginLeft = '6px';
        clearBtn.onclick = () => {
          selections[sIdx] = '';
          saveState();
          renderConfig();
          renderPlay();
        };

        td.appendChild(span);
        td.appendChild(clearBtn);
      } else {
        const select = document.createElement('select');
        const empty = document.createElement('option');
        empty.value = '';
        empty.textContent = '-- escolha --';
        select.appendChild(empty);


        getAvailableWords(i).forEach(word => {
          const opt = document.createElement('option');
          opt.value = word;
          opt.textContent = word;
          if (selections[sIdx] === word) opt.selected = true;
          select.appendChild(opt);
        });

        select.onchange = e => {
          selections[sIdx] = e.target.value;
          saveState();
          renderConfig();
          renderPlay();
        };

        td.appendChild(select);
      }

      tr.appendChild(td);
      i++;
    }
    table.appendChild(tr);
  }
  container.appendChild(table);
  updatePlayTabVisibility();
}

function renderPlay() {
  const container = document.getElementById('bingo-play');
  container.innerHTML = '';
  const table = document.createElement('table');
  // add column headers B I N G O
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['B','I','N','G','O'].forEach(letter => {
    const th = document.createElement('th');
    th.textContent = letter;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  let i = 0;

  for (let r = 0; r < 5; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < 5; c++) {
      const td = document.createElement('td');
      if (i === 12) {const td = document.createElement('td');
        const line1 = document.createElement('div');
        line1.textContent = 'Geek';
        const line2 = document.createElement('div');
        line2.textContent = 'Girls';
        td.appendChild(line1);
        td.appendChild(line2);
        tr.appendChild(td);
        td.classList.add('marked');
        i++;
        continue;
      }
      const sIdx = gridToSelIndex(i);
      td.textContent = selections[sIdx] || '';
      td.tabIndex = 0;
      // clicking the cell toggles the marked state
      td.onclick = () => {
        td.classList.toggle('marked');
      };
      // support keyboard (Enter / Space)
      td.onkeydown = e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          td.classList.toggle('marked');
        }
      };
      tr.appendChild(td);
      i++;
    }
    table.appendChild(tr);
  }
  container.appendChild(table);
}

function exportImage() {
  // pick the visible bingo container in the active tab (play or config)
  const activeContainer = document.querySelector('.tab-content.active .bingo-container');
  const element = activeContainer || document.getElementById('bingo-play') || document.getElementById('bingo-config');
  if (!element) {
    console.error('Elemento para exportar não encontrado');
    return;
  }
  html2canvas(element).then(canvas => {
    try {
      const link = document.createElement('a');
      link.download = 'cartela-bingo.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
    }
  }).catch(err => console.error('html2canvas falhou:', err));
}

// Tabs
document.querySelectorAll('.tabs button').forEach(btn => {
  btn.onclick = () => {
    // prevent opening play tab if it's hidden
    if (btn.dataset.tab === 'play' && btn.style.display === 'none') return;
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  };
});

(async function init() {
  // first load words.json and clear saved cartela if words changed
  await loadWords();
  // then load state (may be cleared by loadWords)
  loadState();
  renderConfig();
  renderPlay();
  // ensure play tab visibility reflects current state
  updatePlayTabVisibility();
  // wire export button click to exportImage
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) exportBtn.onclick = exportImage;
  // if words changed, show temporary notice
  if (wordsChanged) {
    const statusEl = document.getElementById('config-status');
    if (statusEl) {
      const prev = statusEl.textContent;
      statusEl.textContent = 'Lista de palavras atualizada — cartela reiniciada';
      setTimeout(() => { statusEl.textContent = prev; }, 4000);
    }
  }
})();
