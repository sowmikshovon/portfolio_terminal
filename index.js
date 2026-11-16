let timer = null;
let userScrolledUp = false;
let lastScrollY = 0;
let lastTouchY = null;
let isHoveringLink = false;
let isFocusingLink = false;
let listenersBound = false;

const commandHistory = [];
let historyCursor = -1;

const SECTION_LINKS = [
  { file: 'about_Sowmik.txt', id: 'about' },
  { file: 'experience_and_education.txt', id: 'experience' },
  { file: 'about_Skills.txt', id: 'skills' },
  { file: 'about_Portfolio_and_CV.txt', id: 'portfolio' },
  { file: 'about_Projects.txt', id: 'projects' },
  { file: 'about_Contact.txt', id: 'contact' },
];

const COMMAND_LIST = [
  { name: 'about', desc: 'Profile summary, Finland location & 4 domain pillars' },
  { name: 'experience', desc: 'Experience & education timeline (LUT, PMSCS, A1QA, BRAC)' },
  { name: 'skills', desc: 'All 45 skills across 4 engineering categories' },
  { name: 'cv', desc: 'Google Drive CV, printable Web CV & Next.js portfolio links' },
  { name: 'projects', desc: 'Featured projects with GitHub & live demo links' },
  { name: 'contact', desc: 'Email, LinkedIn, GitHub, Facebook & phone' },
  { name: 'ls', desc: 'List portfolio files as clickable section jump links' },
  { name: 'clear', desc: 'Clear interactive command output history' },
  { name: 'replay', desc: 'Replay the terminal typing animation from the start' },
  { name: 'help', desc: 'Display available terminal commands' },
];

const FALLBACK_SECTIONS = {
  about:
    '<span id="a">Name:</span>     Sowmik Shovon Karmakar\n' +
    '<span id="a">Role:</span>     Cloud, DevSecOps &amp; QA Automation Engineer\n' +
    '<span id="a">Location:</span> Lahti / Helsinki, Finland\n' +
    '<span id="a">Status:</span>   MSc @ LUT University (Lahti Campus, Finland) &middot; Open to Finland &amp; EU Roles',
  experience:
    '<span id="b">[2026 - Present]</span> <span id="a">Looking for a fulltime Job</span> | Lahti / Helsinki, Finland &amp; Europe\n' +
    '<span id="b">[Aug 2026 - Jul 2028]</span> <span id="a">MSc in Software Product Management and Business</span> | LUT University\n' +
    '<span id="b">[2023-2025]</span> <span id="a">PMSCS</span> | Jahangirnagar University\n' +
    '<span id="b">[2023-2024]</span> <span id="a">QA Automation Intern</span> | A1QA\n' +
    '<span id="b">[2017-2022]</span> <span id="a">BSc</span> in Computer Science | BRAC University',
  skills:
    '<span id="b">Categories:</span> Cloud &amp; DevOps (17), QA &amp; Test Automation (10), Backend &amp; Databases (7), Frontend &amp; Product (11).',
  cv:
    'Google Drive CV: <a href="https://drive.google.com/file/d/10Eeuk0-Sefn8RYVn4oB3ggZg-BI24QRs/view?usp=drive_link" target="_blank" rel="noopener noreferrer">View / Download CV</a>\n' +
    'Web CV: <a href="https://sowmik-portfolio-nextjs.vercel.app/cv" target="_blank" rel="noopener noreferrer">sowmik-portfolio-nextjs.vercel.app/cv</a>',
  projects:
    '[1] Azure Cloud Platform IaC\n[2] DevOps CI/CD Pipeline\n[3] Acquisitions API &amp; CI/CD\n[4] Automated QA &amp; Test Suite\n[5] Spotify Full-Stack Clone\n[6] Advanced Portfolio\n[7] IoT Parking Manager\n[8] Anime Vault\n[9] Terminal Portfolio',
  contact:
    'Email: <a href="mailto:sowmikshovon@gmail.com">sowmikshovon@gmail.com</a> | GitHub: <a href="https://github.com/sowmikshovon" target="_blank" rel="noopener noreferrer">github.com/sowmikshovon</a>',
};

function getScrollY() {
  if (typeof window === 'undefined') {
    return 0;
  }
  if (typeof window.scrollY === 'number') {
    return window.scrollY;
  }
  if (typeof window.pageYOffset === 'number') {
    return window.pageYOffset;
  }
  if (
    document &&
    document.documentElement &&
    typeof document.documentElement.scrollTop === 'number'
  ) {
    return document.documentElement.scrollTop;
  }
  return 0;
}

function isNearBottom(currentY) {
  const innerH =
    typeof window !== 'undefined' && typeof window.innerHeight === 'number'
      ? window.innerHeight
      : 0;
  const docEl = document && document.documentElement;
  const scrollH =
    docEl && typeof docEl.scrollHeight === 'number' ? docEl.scrollHeight : 0;
  return scrollH > innerH && currentY + innerH >= scrollH - 12;
}

function getTargetHashId() {
  if (
    typeof window === 'undefined' ||
    !window.location ||
    typeof window.location.hash !== 'string'
  ) {
    return '';
  }
  const rawHash = window.location.hash.trim();
  if (rawHash.length <= 1 || rawHash.charAt(0) !== '#') {
    return '';
  }
  try {
    return decodeURIComponent(rawHash.slice(1));
  } catch {
    return rawHash.slice(1);
  }
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function formatTextToHtml(raw) {
  return String(raw).replace(/\n/g, '<br/>');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function announceStatus(message) {
  const statusEl = document.getElementById('terminal-status');
  if (statusEl) {
    statusEl.textContent = message;
  }
}

/**
 * Consume a complete HTML tag or comment starting at `idx`, returning the index
 * right after `>`, or -1 if `text[idx]` is not a valid complete tag.
 */
function consumeHtmlTag(text, idx) {
  if (text.charAt(idx) !== '<') {
    return -1;
  }
  if (text.startsWith('<!--', idx)) {
    const commentEnd = text.indexOf('-->', idx + 4);
    return commentEnd !== -1 ? commentEnd + 3 : -1;
  }
  const nextChar = text.charAt(idx + 1);
  if (!nextChar || !/[A-Za-z\/!]/.test(nextChar)) {
    return -1;
  }
  let quote = null;
  for (let j = idx + 1; j < text.length; j += 1) {
    const ch = text.charAt(j);
    if (quote) {
      if (ch === quote) {
        quote = null;
      }
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '>') {
      return j + 1;
    }
  }
  return -1;
}

/**
 * Consume a complete HTML character entity (`&nbsp;`, `&amp;`, `&#183;`, etc.)
 * starting at `idx`, returning the index right after `;`, or -1 if unmatched.
 */
function consumeHtmlEntity(text, idx) {
  if (text.charAt(idx) !== '&') {
    return -1;
  }
  const slice = text.slice(idx, idx + 40);
  const match =
    /^&(?:[A-Za-z][A-Za-z0-9]{0,31}|#[0-9]{1,7}|#x[0-9A-Fa-f]{1,6});/.exec(slice);
  return match ? idx + match[0].length : -1;
}

/**
 * Advance `startIndex` by `visibleSteps` visible characters while stepping over
 * complete HTML tags (0 visible width) and HTML entities (1 visible char) atomically.
 */
function advanceHtmlIndex(text, startIndex, visibleSteps) {
  let idx = Math.max(0, startIndex);
  let remaining = Math.max(1, visibleSteps);
  const len = text.length;

  while (idx < len && remaining > 0) {
    const tagEnd = consumeHtmlTag(text, idx);
    if (tagEnd !== -1) {
      idx = tagEnd;
      continue;
    }

    const entityEnd = consumeHtmlEntity(text, idx);
    if (entityEnd !== -1) {
      idx = entityEnd;
      remaining -= 1;
      continue;
    }

    const cp = text.codePointAt(idx);
    idx += cp !== undefined && cp > 0xffff ? 2 : 1;
    remaining -= 1;
  }

  // Close any immediately adjacent closing tags so open elements close cleanly.
  while (idx < len && text.charAt(idx) === '<' && text.charAt(idx + 1) === '/') {
    const closeEnd = consumeHtmlTag(text, idx);
    if (closeEnd === -1) {
      break;
    }
    idx = closeEnd;
  }

  return idx;
}

function stepBackSafeIndex(text, currentIndex, visibleSteps) {
  let visible = 0;
  let idx = 0;
  const stops = [0];

  while (idx < currentIndex) {
    const tagEnd = consumeHtmlTag(text, idx);
    if (tagEnd !== -1) {
      idx = tagEnd;
      continue;
    }
    const entityEnd = consumeHtmlEntity(text, idx);
    if (entityEnd !== -1) {
      idx = entityEnd;
    } else {
      const cp = text.codePointAt(idx);
      idx += cp !== undefined && cp > 0xffff ? 2 : 1;
    }
    visible += 1;
    stops.push(idx);
  }

  const targetVisible = Math.max(0, visible - Math.max(1, visibleSteps));
  return stops[targetVisible] ?? 0;
}

function buildDefaultLsHtml() {
  const links = SECTION_LINKS.map(
    (item) => `<a href="#${item.id}">${item.file}</a>`
  ).join('  ');
  return `<span id="op">${links}</span>`;
}

function parseSectionsFromPayload(rawText) {
  const sections = {};
  if (!rawText) {
    return sections;
  }

  const fileToKey = {
    'about_sowmik.txt': 'about',
    'experience_and_education.txt': 'experience',
    'about_skills.txt': 'skills',
    'about_portfolio_and_cv.txt': 'cv',
    'about_projects.txt': 'projects',
    'about_contact.txt': 'contact',
  };

  const catMatches = [];
  const catRegex = /cat\s+([A-Za-z0-9_.-]+\.txt)\b/gi;
  let match;
  while ((match = catRegex.exec(rawText)) !== null) {
    catMatches.push({
      file: match[1].toLowerCase(),
      index: match.index,
    });
  }

  if (catMatches.length > 0) {
    const preCat = rawText.slice(0, catMatches[0].index);
    const lsLineMatch = preCat.match(
      /^[^\n]*about_Sowmik\.txt[^\n]*$/m
    );
    if (lsLineMatch) {
      sections.ls = lsLineMatch[0].trim();
    }
  }

  for (let i = 0; i < catMatches.length; i += 1) {
    const curr = catMatches[i];
    const key = fileToKey[curr.file];
    if (!key) {
      continue;
    }

    const lineEnd = rawText.indexOf('\n', curr.index);
    if (lineEnd === -1) {
      continue;
    }

    const bodyStart = lineEnd + 1;
    let bodyEnd = rawText.length;

    if (i + 1 < catMatches.length) {
      const nextLineStart = rawText.lastIndexOf('\n', catMatches[i + 1].index);
      if (nextLineStart > bodyStart) {
        bodyEnd = nextLineStart;
      }
    } else {
      const exitMatch = /\n[^\n]*\bexit\b[^\n]*$/m.exec(
        rawText.slice(bodyStart)
      );
      if (exitMatch) {
        bodyEnd = bodyStart + exitMatch.index;
      }
    }

    let body = rawText.slice(bodyStart, bodyEnd).trim();
    body = body.replace(/^<p\b[^>]*>/i, '').replace(/<\/p>\s*$/i, '').trim();
    if (body) {
      sections[key] = body;
    }
  }

  return sections;
}

function buildHelpHtml() {
  const rows = COMMAND_LIST.map(
    (cmd) =>
      `  <span id="a">${cmd.name.padEnd(11, ' ')}</span> <span id="op">${escapeHtml(cmd.desc)}</span>`
  ).join('\n');
  return (
    '<span id="b">Available commands:</span>\n' +
    rows +
    '\n<span id="op">Tip: Click any filename in ls or press Esc anytime to jump cleanly.</span>'
  );
}

function executeTerminalCommand(rawCommand, historyEl, promptEl, inputEl) {
  const trimmed = String(rawCommand || '').trim();
  if (!trimmed) {
    return;
  }

  commandHistory.push(trimmed);
  historyCursor = commandHistory.length;

  const lower = trimmed.toLowerCase();
  const aliasMap = {
    '?': 'help',
    portfolio: 'cv',
    'cat about_sowmik.txt': 'about',
    'cat experience_and_education.txt': 'experience',
    'cat about_skills.txt': 'skills',
    'cat about_portfolio_and_cv.txt': 'cv',
    'cat about_projects.txt': 'projects',
    'cat about_contact.txt': 'contact',
  };
  const cmd = aliasMap[lower] || lower;

  if (cmd === 'clear') {
    if (historyEl) {
      historyEl.innerHTML = '';
    }
    if (inputEl && typeof inputEl.focus === 'function') {
      inputEl.focus();
    }
    return;
  }

  if (cmd === 'replay') {
    Typer.replay();
    return;
  }

  const parsed = parseSectionsFromPayload(Typer.text);
  let outputHtml = '';

  if (cmd === 'help') {
    outputHtml = formatTextToHtml(buildHelpHtml());
  } else if (cmd === 'ls') {
    outputHtml = parsed.ls || buildDefaultLsHtml();
  } else if (
    cmd === 'about' ||
    cmd === 'experience' ||
    cmd === 'skills' ||
    cmd === 'cv' ||
    cmd === 'projects' ||
    cmd === 'contact'
  ) {
    outputHtml = formatTextToHtml(parsed[cmd] || FALLBACK_SECTIONS[cmd]);
  } else {
    outputHtml =
      `<span id="r">bash: ${escapeHtml(trimmed)}: command not found.</span> ` +
      'Type <span id="a">help</span> to list available commands.';
  }

  if (historyEl && typeof historyEl.appendChild === 'function') {
    const entry = document.createElement('div');
    entry.className = 'terminal-output';

    const cmdRow = document.createElement('div');
    cmdRow.className = 'terminal-output-cmd';
    cmdRow.innerHTML =
      `<span id="a">sowmik@shovon</span>:<span id="b">~</span><span id="c">$</span> ${escapeHtml(trimmed)}`;

    const bodyRow = document.createElement('div');
    bodyRow.className = 'terminal-output-body';
    bodyRow.innerHTML = outputHtml;

    if (typeof entry.appendChild === 'function') {
      entry.appendChild(cmdRow);
      entry.appendChild(bodyRow);
    } else {
      entry.innerHTML = cmdRow.outerHTML + bodyRow.outerHTML;
    }

    historyEl.appendChild(entry);
  }

  if (promptEl && typeof promptEl.scrollIntoView === 'function') {
    promptEl.scrollIntoView({ block: 'nearest' });
  }
  if (inputEl && typeof inputEl.focus === 'function') {
    inputEl.focus();
  }
}

const Typer = {
  text: '',
  accessCountimer: null,
  index: 0,
  speed: 8,
  file: 'sowmikshovon.txt',
  skipped: false,
  completed: false,
  cursorVisible: false,

  init: function () {
    const hasHash = Boolean(getTargetHashId());
    if (prefersReducedMotion() || hasHash) {
      this.skipped = true;
    } else if (this.accessCountimer === null) {
      this.accessCountimer = setInterval(() => {
        this.updLstChr();
      }, 500);
    }

    fetch(this.file)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${this.file}: HTTP ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        this.text = data.trimEnd().replace(/\r\n/g, '\n');
        if (this.skipped) {
          this.fastForward();
          this.scrollToHashTarget();
        }
      })
      .catch((error) => {
        this.stopTimers();
        const message =
          '<span id="r">Error loading portfolio payload: ' +
          escapeHtml(error && error.message ? error.message : error) +
          '</span>';
        this.setHtml(message);
        announceStatus('Error loading portfolio payload.');
      });
  },

  getConsole: function () {
    return document.getElementById('console');
  },

  setHtml: function (html) {
    const consoleEl = this.getConsole();
    if (consoleEl) {
      consoleEl.innerHTML = html;
    }
  },

  renderPartial: function () {
    const partial = formatTextToHtml(this.text.substring(0, this.index));
    this.setHtml(this.cursorVisible ? partial + '|' : partial);
  },

  stopTimers: function () {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
    if (this.accessCountimer !== null) {
      clearInterval(this.accessCountimer);
      this.accessCountimer = null;
    }
  },

  markLoaded: function () {
    const skipButton = document.getElementById('skip-animation');
    if (skipButton) {
      skipButton.disabled = true;
      skipButton.textContent = 'Full portfolio loaded';
    }
  },

  scrollToHashTarget: function () {
    const hashId = getTargetHashId();
    if (!hashId) {
      return;
    }
    const target = document.getElementById(hashId);
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  },

  mountPrompt: function () {
    const consoleEl = this.getConsole();
    if (!consoleEl || typeof consoleEl.appendChild !== 'function') {
      return;
    }

    if (document.getElementById('terminal-prompt')) {
      return;
    }

    const historyEl = document.createElement('div');
    historyEl.id = 'terminal-history';
    if (typeof historyEl.setAttribute === 'function') {
      historyEl.setAttribute('aria-live', 'polite');
    }

    const promptEl = document.createElement('div');
    promptEl.id = 'terminal-prompt';

    const formEl = document.createElement('form');
    formEl.id = 'terminal-prompt-form';
    if (typeof formEl.setAttribute === 'function') {
      formEl.setAttribute('autocomplete', 'off');
    }

    const labelEl = document.createElement('label');
    labelEl.className = 'terminal-prompt-label';
    if (typeof labelEl.setAttribute === 'function') {
      labelEl.setAttribute('for', 'terminal-command-input');
    }
    labelEl.innerHTML =
      '<span id="a">sowmik@shovon</span>:<span id="b">~</span><span id="c">$</span>';

    const inputEl = document.createElement('input');
    inputEl.id = 'terminal-command-input';
    inputEl.type = 'text';
    inputEl.name = 'command';
    inputEl.placeholder = "Type 'help' and press Enter...";
    if (typeof inputEl.setAttribute === 'function') {
      inputEl.setAttribute('aria-label', 'Terminal command input');
      inputEl.setAttribute('spellcheck', 'false');
      inputEl.setAttribute('autocapitalize', 'off');
      inputEl.setAttribute('autocomplete', 'off');
    }

    if (typeof formEl.appendChild === 'function') {
      formEl.appendChild(labelEl);
      formEl.appendChild(inputEl);
    }
    if (typeof promptEl.appendChild === 'function') {
      promptEl.appendChild(formEl);
    }

    consoleEl.appendChild(historyEl);
    consoleEl.appendChild(promptEl);

    if (typeof formEl.addEventListener === 'function') {
      formEl.addEventListener('submit', function (e) {
        if (e && typeof e.preventDefault === 'function') {
          e.preventDefault();
        }
        const cmdText = inputEl.value;
        inputEl.value = '';
        executeTerminalCommand(cmdText, historyEl, promptEl, inputEl);
      });
    }

    if (typeof inputEl.addEventListener === 'function') {
      attachCommandHistoryNavigation(inputEl);
    }

    if (typeof promptEl.addEventListener === 'function') {
      promptEl.addEventListener('click', function (e) {
        if (
          e &&
          (e.target === promptEl || e.target === formEl) &&
          typeof inputEl.focus === 'function'
        ) {
          inputEl.focus();
        }
      });
    }
  },

  fastForward: function () {
    this.skipped = true;
    this.cursorVisible = false;
    isHoveringLink = false;
    isFocusingLink = false;
    this.stopTimers();

    if (this.text && !this.completed) {
      this.completed = true;
      this.index = this.text.length;
      this.setHtml(formatTextToHtml(this.text));
      this.markLoaded();
      announceStatus('Portfolio output loaded. Interactive prompt ready.');
      this.mountPrompt();
    }
  },

  replay: function () {
    this.stopTimers();
    this.index = 0;
    this.skipped = false;
    this.completed = false;
    this.cursorVisible = false;
    userScrolledUp = false;
    isHoveringLink = false;
    isFocusingLink = false;

    const existingPrompt = document.getElementById('terminal-prompt');
    if (existingPrompt && typeof existingPrompt.remove === 'function') {
      existingPrompt.remove();
    }
    const existingHistory = document.getElementById('terminal-history');
    if (existingHistory && typeof existingHistory.remove === 'function') {
      existingHistory.remove();
    }

    this.setHtml('');

    const skipButton = document.getElementById('skip-animation');
    if (skipButton) {
      skipButton.disabled = false;
      skipButton.textContent = 'Skip animation';
    }

    announceStatus('Replaying portfolio output.');

    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0);
    }
    lastScrollY = getScrollY();

    this.accessCountimer = setInterval(() => {
      this.updLstChr();
    }, 500);
    timer = setInterval(t, 30);
  },

  addText: function (key) {
    if (key && (key.key === 'Escape' || key.keyCode === 27)) {
      this.fastForward();
      return;
    }

    if (!this.text || this.completed) {
      return;
    }

    if (key && key.keyCode === 8) {
      this.index = stepBackSafeIndex(this.text, this.index, this.speed);
    } else {
      this.index = advanceHtmlIndex(this.text, this.index, this.speed);
    }

    if (this.index >= this.text.length) {
      this.fastForward();
      return;
    }

    this.renderPartial();
    if (
      !userScrolledUp &&
      typeof window !== 'undefined' &&
      typeof window.scrollBy === 'function'
    ) {
      window.scrollBy(0, 50);
      lastScrollY = getScrollY();
    }
  },

  updLstChr: function () {
    if (this.completed || this.skipped) {
      return;
    }
    this.cursorVisible = !this.cursorVisible;
    if (this.text) {
      this.renderPartial();
    } else {
      this.setHtml(this.cursorVisible ? '|' : '');
    }
  },
};

function t() {
  if (!Typer.text || Typer.completed || Typer.skipped) {
    return;
  }
  if (isHoveringLink || isFocusingLink) {
    return;
  }

  Typer.addText({ keyCode: 123748 });

  if (Typer.text && Typer.index >= Typer.text.length && !Typer.completed) {
    Typer.fastForward();
  }
}

function bindGlobalAndConsoleListeners(consoleEl) {
  if (listenersBound) {
    return;
  }
  listenersBound = true;

  const onWheel = function (e) {
    if (e && typeof e.deltaY === 'number' && e.deltaY < 0) {
      userScrolledUp = true;
    }
  };

  const onTouchStart = function (e) {
    if (e && e.touches && e.touches.length > 0) {
      lastTouchY = e.touches[0].clientY;
    }
  };

  const onTouchMove = function (e) {
    if (
      lastTouchY !== null &&
      e &&
      e.touches &&
      e.touches.length > 0
    ) {
      const currY = e.touches[0].clientY;
      if (currY - lastTouchY > 4) {
        userScrolledUp = true;
      }
      lastTouchY = currY;
    }
  };

  const onTouchEnd = function () {
    lastTouchY = null;
  };

  const onScroll = function () {
    const currentY = getScrollY();
    if (currentY < lastScrollY) {
      userScrolledUp = true;
    } else if (currentY > lastScrollY && isNearBottom(currentY)) {
      userScrolledUp = false;
    }
    lastScrollY = currentY;
  };

  const scrollTargets = [document];
  if (typeof window !== 'undefined') {
    scrollTargets.push(window);
  }

  for (const target of scrollTargets) {
    if (target && typeof target.addEventListener === 'function') {
      target.addEventListener('wheel', onWheel);
      target.addEventListener('touchstart', onTouchStart);
      target.addEventListener('touchmove', onTouchMove);
      target.addEventListener('touchend', onTouchEnd);
      target.addEventListener('scroll', onScroll);
    }
  }

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('hashchange', function () {
      if (getTargetHashId()) {
        Typer.fastForward();
        Typer.scrollToHashTarget();
      }
    });
  }

  if (consoleEl && typeof consoleEl.addEventListener === 'function') {
    consoleEl.addEventListener('mouseover', function (e) {
      const link =
        e && e.target && typeof e.target.closest === 'function'
          ? e.target.closest('a')
          : null;
      if (link) {
        isHoveringLink = true;
      }
    });

    consoleEl.addEventListener('mouseout', function (e) {
      const nextLink =
        e && e.relatedTarget && typeof e.relatedTarget.closest === 'function'
          ? e.relatedTarget.closest('a')
          : null;
      isHoveringLink = Boolean(
        nextLink &&
          typeof consoleEl.contains === 'function' &&
          consoleEl.contains(nextLink)
      );
    });

    consoleEl.addEventListener('mouseleave', function () {
      isHoveringLink = false;
    });

    consoleEl.addEventListener('focusin', function (e) {
      const link =
        e && e.target && typeof e.target.closest === 'function'
          ? e.target.closest('a')
          : null;
      isFocusingLink = Boolean(link);
    });

    consoleEl.addEventListener('focusout', function (e) {
      const nextLink =
        e && e.relatedTarget && typeof e.relatedTarget.closest === 'function'
          ? e.relatedTarget.closest('a')
          : null;
      isFocusingLink = Boolean(
        nextLink &&
          typeof consoleEl.contains === 'function' &&
          consoleEl.contains(nextLink)
      );
    });

    consoleEl.addEventListener('click', function (e) {
      const link =
        e && e.target && typeof e.target.closest === 'function'
          ? e.target.closest('a')
          : null;
      if (!link) {
        return;
      }
      const href =
        typeof link.getAttribute === 'function'
          ? link.getAttribute('href')
          : link.href;
      if (href && href.charAt(0) === '#' && !Typer.completed) {
        Typer.fastForward();
      }
    });
  }
}

function initTerminal() {
  const consoleEl = document.getElementById('console');
  if (!consoleEl) {
    return;
  }

  lastScrollY = getScrollY();
  bindGlobalAndConsoleListeners(consoleEl);

  Typer.speed = 8;
  Typer.file = 'sowmikshovon.txt';
  Typer.init();

  if (!Typer.skipped && timer === null) {
    timer = setInterval(t, 30);
  }

  const skipButton = document.getElementById('skip-animation');
  if (skipButton && typeof skipButton.addEventListener === 'function') {
    skipButton.addEventListener('click', function () {
      Typer.fastForward();
    });
  }
}

document.addEventListener('keydown', function (e) {
  if (e && (e.key === 'Escape' || e.keyCode === 27)) {
    if (typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    Typer.fastForward();
  }
});

function attachCommandHistoryNavigation(inputEl) {
  inputEl.addEventListener('keydown', function (e) {
    if (!e || commandHistory.length === 0) {
      return;
    }
    if (e.key === 'ArrowUp') {
      if (typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      historyCursor = Math.max(0, historyCursor - 1);
      inputEl.value = commandHistory[historyCursor] || '';
    } else if (e.key === 'ArrowDown') {
      if (typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      historyCursor = Math.min(commandHistory.length, historyCursor + 1);
      inputEl.value =
        historyCursor < commandHistory.length
          ? commandHistory[historyCursor]
          : '';
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTerminal);
} else {
  initTerminal();
}
