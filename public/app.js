/**
 * SpeedMath Pro — Frontend Engine & Competitive Leaderboard Controller
 */

const content = document.getElementById('content');
let currentPage = 'arena';

// ================= AUTHENTICATION & PASSWORD CONTROLLER =================
let mathUser = JSON.parse(localStorage.getItem('speedmath_auth_user')) || null;

function initMathAuth() {
  const authScreen = document.getElementById('authScreen');
  if (mathUser) {
    authScreen.classList.add('hidden');
    document.getElementById('currentUserName').innerText = mathUser.name;
    document.getElementById('currentUserRole').innerText = mathUser.role || 'Speed Grandmaster';
    document.getElementById('currentUserAvatar').innerText = mathUser.name.split(' ').map(x => x[0]).join('');
  } else {
    authScreen.classList.remove('hidden');
  }
}

function toggleMathPasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerText = 'Hide';
  } else {
    input.type = 'password';
    btn.innerText = 'Show';
  }
}

function checkMathCapsLock(event, warningId) {
  const warning = document.getElementById(warningId);
  if (!warning) return;
  if (event.getModifierState && event.getModifierState('CapsLock')) {
    warning.style.display = 'block';
  } else {
    warning.style.display = 'none';
  }
}

function validateMathPasswordStrength(pw) {
  const fill = document.getElementById('mathPwStrengthFill');
  const critLen = document.getElementById('math-crit-len');
  const critNum = document.getElementById('math-crit-num');
  const critUpper = document.getElementById('math-crit-upper');

  const hasLen = pw.length >= 8;
  const hasNum = /\d/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);

  critLen.className = hasLen ? 'valid' : '';
  critLen.innerText = (hasLen ? 'Passed: ' : '') + 'Minimum 8 characters';

  critNum.className = hasNum ? 'valid' : '';
  critNum.innerText = (hasNum ? 'Passed: ' : '') + 'Contains at least 1 number';

  critUpper.className = hasUpper ? 'valid' : '';
  critUpper.innerText = (hasUpper ? 'Passed: ' : '') + 'Contains at least 1 uppercase letter';

  let score = 0;
  if (hasLen) score += 35;
  if (hasNum) score += 35;
  if (hasUpper) score += 30;

  fill.style.width = score + '%';
  if (score < 50) {
    fill.style.backgroundColor = 'var(--danger)';
  } else if (score < 100) {
    fill.style.backgroundColor = 'var(--warning)';
  } else {
    fill.style.backgroundColor = 'var(--success)';
  }

  checkMathPasswordMatch();
}

function checkMathPasswordMatch() {
  const pw = document.getElementById('suPassword')?.value || '';
  const confirm = document.getElementById('suConfirmPassword')?.value || '';
  const matchText = document.getElementById('mathPwMatchText');
  if (!matchText || !confirm) {
    if (matchText) matchText.innerText = '';
    return;
  }

  if (pw === confirm) {
    matchText.style.color = 'var(--success)';
    matchText.innerText = 'Passwords match';
  } else {
    matchText.style.color = 'var(--danger)';
    matchText.innerText = 'Passwords do not match';
  }
}

function setAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabSignup.classList.add('active');
  }
}

async function handleMathLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const pw = document.getElementById('loginPassword').value;
  if (pw.length < 4) return alert('Please enter a valid password.');

  try {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password: pw })
    });
    const name = username.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    mathUser = { name, username: res.user.username, email: res.user.email, role: 'Speed Grandmaster', token: res.token };
    localStorage.setItem('speedmath_auth_user', JSON.stringify(mathUser));
    initMathAuth();
    showToast(`Signed in as ${name}!`);
    loadPage('arena');
  } catch (e) {
    showToast(e.message);
  }
}

async function handleMathSignUp() {
  const username = document.getElementById('suUsername').value.trim();
  const email = document.getElementById('suEmail').value.trim();
  const pw = document.getElementById('suPassword').value;
  const confirm = document.getElementById('suConfirmPassword').value;

  if (!username || !email) return alert('Fill out all fields');
  if (pw.length < 8) return alert('Password must be at least 8 characters');
  if (pw !== confirm) return alert('Passwords do not match');

  try {
    const res = await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password: pw })
    });
    const name = username.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    mathUser = { name, username: res.user.username, email, role: 'Speed Contender', token: res.token };
    localStorage.setItem('speedmath_auth_user', JSON.stringify(mathUser));
    initMathAuth();
    showToast(`Account created for ${name}!`);
    loadPage('arena');
  } catch (e) {
    showToast(e.message);
  }
}

function quickMathLogin(name, username, role, bestScore) {
  mathUser = { name, username, email: `${username}@speedmath.io`, role, bestScore };
  localStorage.setItem('speedmath_auth_user', JSON.stringify(mathUser));
  initMathAuth();
  showToast(`Signed in as ${name} (${role})`);
  loadPage('arena');
}

function logoutMath() {
  mathUser = null;
  localStorage.removeItem('speedmath_auth_user');
  initMathAuth();
  showToast('Signed out of SpeedMath Pro');
}

function openForgotModal() {
  openModal('forgotPasswordModal');
}

function sendPasswordResetLink() {
  const email = document.getElementById('fpEmail').value.trim();
  if (!email) return alert('Enter email address');
  closeModal('forgotPasswordModal');
  showToast(`Reset link dispatched to ${email}`);
}

// ================= API CALLS & HELPERS =================
async function api(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (mathUser?.token) headers['Authorization'] = `Bearer ${mathUser.token}`;

  const res = await fetch(endpoint, {
    headers,
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'API Request failed');
  return data;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (t) {
    t.innerText = msg;
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 2200);
  }
}

// ================= THEME MODULATION MANAGER =================
function changeMathTheme(theme) {
  document.documentElement.setAttribute('data-math-theme', theme);
  localStorage.setItem('speedmath_theme_choice', theme);
  const sel = document.getElementById('paletteSelect');
  if (sel) sel.value = theme;
  showToast(`Applied ${sel ? sel.options[sel.selectedIndex].text : theme}`);
}

const savedMathTheme = localStorage.getItem('speedmath_theme_choice') || 'math-daylight';
document.documentElement.setAttribute('data-math-theme', savedMathTheme);

// ================= NAVIGATION & ROUTING =================
function loadPage(page) {
  currentPage = page;
  ['arena', 'leaderboard', 'profile', 'reference', 'settings'].forEach(p => {
    const btn = document.getElementById('nav-' + p);
    if (btn) btn.classList.remove('active');
  });

  const activeBtn = document.getElementById('nav-' + page);
  if (activeBtn) activeBtn.classList.add('active');

  const titles = {
    arena: 'Play Challenge Arena',
    leaderboard: 'Global Leaderboard & Rankings',
    profile: 'Player Profile & Stats History',
    reference: 'Mental Math Formula & Shortcuts',
    settings: 'Arena Settings & CSV Export'
  };
  document.getElementById('pageBreadcrumb').innerText = titles[page] || page;

  if (page === 'arena') renderArena();
  if (page === 'leaderboard') renderLeaderboard();
  if (page === 'profile') renderProfile();
  if (page === 'reference') renderReference();
  if (page === 'settings') renderSettings();
}

function refreshData() {
  loadPage(currentPage);
  showToast('Data refreshed');
}

// ================= NATIVE WEB AUDIO SYNTHESIZER =================
function playSound(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'correct') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (type === 'laugh' || type === 'win') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.28);
      });
    } else if (type === 'incorrect') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.2);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch (e) {
    // Audio optional fallback
  }
}

// ================= REAL-TIME VECTOR SVG ICONS FOR SPEEDMATH =================
const ICONS = {
  play: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  coin: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><circle cx="12" cy="12" r="8"/><path d="M12 8v8"/><path d="M9.5 12h5"/></svg>`,
  star: `<svg width="16" height="16" viewBox="0 0 24 24" fill="var(--warning)" stroke="var(--warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:0 2px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  starEmpty: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:0 2px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  riddle: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,
  lightbulb: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/></svg>`,
  reveal: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6z"/></svg>`
};

// ================= FUNNY KID QUESTIONS & SIMPLIFIED MATH SECRETS =================
const KID_MATH_JOKES = [
  {
    riddle: "Why was the math book always so sad?",
    punchline: "Because it had too many problems!",
    explanationTitle: "Super Simple Math Secret: Friendly Step-by-Step",
    explanationText: "Math problems feel easy when you break them into tiny bite-sized pieces! When adding numbers like 38 + 25, just split them: 30 + 20 = 50, and 8 + 5 = 13, so 50 + 13 = 63! Easy and quick!"
  },
  {
    riddle: "Why is the number 6 afraid of the number 7?",
    punchline: "Because 7 ate 9 (7, 8, 9)!",
    explanationTitle: "Super Simple Math Secret: The Plus-9 Fast Trick",
    explanationText: "To add 9 to any number in 1 second: just add 10 first and step backward by 1! Example: 45 + 9 ➔ 45 + 10 = 55, then 55 - 1 = 54! Try it with 67 + 9 (67 + 10 = 77 ➔ 76)!"
  },
  {
    riddle: "What did the number 0 say to the number 8?",
    punchline: "Nice belt!",
    explanationTitle: "Super Simple Math Secret: The Zero & One Superpowers",
    explanationText: "Any number multiplied by 0 always becomes 0 (0 baskets with 8 apples has 0 apples). But multiplying by 1 keeps the number completely unchanged (1 basket with 8 apples = 8 apples)!"
  },
  {
    riddle: "Why did the triangle feel left out at the math party?",
    punchline: "Because it was never right (right angle)!",
    explanationTitle: "Super Simple Math Secret: What is a Right Angle?",
    explanationText: "A right angle is the sharp, perfect corner of your notebook or classroom door (exactly 90 degrees). If you make an 'L' shape with your thumb and index finger, that is a right angle!"
  },
  {
    riddle: "What do you call an empty parrot cage?",
    punchline: "A polygon (poly-gone)!",
    explanationTitle: "Super Simple Math Secret: What is a Polygon?",
    explanationText: "'Poly' means many, and 'gon' means sides! Any flat shape with 3 or more straight closed sides is a polygon: Triangles (3 sides), Squares (4 sides), Pentagons (5 sides), and Hexagons (6 sides)!"
  },
  {
    riddle: "Why did the two 4s skip lunchtime?",
    punchline: "Because they already 8 (4 + 4 = 8)!",
    explanationTitle: "Super Simple Math Secret: The Double & Near-Double Trick",
    explanationText: "When you know your doubles (5+5=10, 6+6=12, 7+7=14), you can solve tricky questions like 6+7 instantly by doing (6+6) + 1 = 13! It makes addition super fast!"
  },
  {
    riddle: "How do you make the number SEVEN even?",
    punchline: "Just remove the letter 'S'! (S-EVEN ➔ EVEN)",
    explanationTitle: "Super Simple Math Secret: Even vs. Odd Numbers",
    explanationText: "Even numbers (0, 2, 4, 6, 8, 10...) can always be divided into two equal pairs with zero leftovers for 2 friends. Odd numbers (1, 3, 5, 7, 9...) always have exactly 1 left over!"
  },
  {
    riddle: "What is a math teacher’s favorite kind of tree?",
    punchline: "A Geome-tree!",
    explanationTitle: "Super Simple Math Secret: The Half-and-Double Trick",
    explanationText: "To multiply by 5 easily: cut the other number in half and add a 0 at the end! Example: 5 × 16 ➔ Half of 16 is 8, add a zero = 80! Fast mental math!"
  }
];

let currentActiveJoke = null;

function revealJokePunchline() {
  playSound('laugh');
  const box = document.getElementById('jokePunchlineBox');
  const btn = document.getElementById('jokeRevealBtn');
  if (box) box.style.display = 'block';
  if (btn) btn.style.display = 'none';
}

// ================= REAL-TIME MATH GAME ENGINE =================
let gameState = {
  active: false,
  timer: 30,
  timerInterval: null,
  score: 0,
  streak: 0,
  coins: 0,
  totalAnswered: 0,
  correctCount: 0,
  currentQuestion: null,
  gameMode: 'sprint',
  operation: 'mixed',
  difficulty: 'medium',
  duration: 30
};

function generateMathQuestion(op, diff, mode = 'sprint') {
  if (mode === 'puzzle') {
    const a = Math.floor(Math.random() * (diff === 'easy' ? 9 : diff === 'medium' ? 18 : 35)) + 2;
    const b = Math.floor(Math.random() * (diff === 'easy' ? 9 : diff === 'medium' ? 18 : 35)) + 2;
    const sum = a + b;
    if (Math.random() > 0.5) {
      return { text: `? + ${b} = ${sum}`, answer: a, hint: `What plus ${b} makes ${sum}?` };
    } else {
      return { text: `${a} + ? = ${sum}`, answer: b, hint: `What plus ${a} makes ${sum}?` };
    }
  }

  if (mode === 'safari') {
    const animals = ['monkeys', 'penguins', 'puppies', 'dolphins', 'koalas', 'tigers'];
    const items = ['bananas', 'fish', 'biscuits', 'balls', 'apples', 'watermelons'];
    const idx = Math.floor(Math.random() * animals.length);
    const count1 = Math.floor(Math.random() * (diff === 'easy' ? 4 : 7)) + 2;
    const count2 = Math.floor(Math.random() * (diff === 'easy' ? 4 : 6)) + 2;

    if (Math.random() > 0.5) {
      return {
        text: `If ${count1} ${animals[idx]} each have ${count2} ${items[idx]}, how many ${items[idx]} in total?`,
        answer: count1 * count2,
        hint: `${count1} × ${count2}`
      };
    } else {
      return {
        text: `${count1} ${animals[idx]} met ${count2} more ${animals[idx]}. How many ${animals[idx]} are there now?`,
        answer: count1 + count2,
        hint: `${count1} + ${count2}`
      };
    }
  }

  // Rocket Sprint
  let a, b, answer, operatorSymbol;
  const maxNum = diff === 'easy' ? 12 : diff === 'medium' ? 30 : diff === 'hard' ? 75 : 120;
  const chosenOp = op === 'mixed' ? ['add', 'sub', 'mul', 'div'][Math.floor(Math.random() * 4)] : op;

  if (chosenOp === 'add') {
    a = Math.floor(Math.random() * maxNum) + 2;
    b = Math.floor(Math.random() * maxNum) + 2;
    answer = a + b;
    operatorSymbol = '+';
  } else if (chosenOp === 'sub') {
    a = Math.floor(Math.random() * maxNum) + 5;
    b = Math.floor(Math.random() * a) + 1;
    answer = a - b;
    operatorSymbol = '−';
  } else if (chosenOp === 'mul') {
    const mulMax = diff === 'easy' ? 9 : diff === 'medium' ? 12 : diff === 'hard' ? 19 : 25;
    a = Math.floor(Math.random() * mulMax) + 2;
    b = Math.floor(Math.random() * mulMax) + 2;
    answer = a * b;
    operatorSymbol = '×';
  } else {
    const mulMax = diff === 'easy' ? 9 : diff === 'medium' ? 12 : 15;
    b = Math.floor(Math.random() * mulMax) + 2;
    answer = Math.floor(Math.random() * mulMax) + 1;
    a = b * answer;
    operatorSymbol = '÷';
  }

  return { text: `${a} ${operatorSymbol} ${b}`, answer };
}

function renderArena() {
  content.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <h2>SpeedMath Arena</h2>
        <p>Interactive arithmetic challenges, reward tracking, and bonus math brain-teasers.</p>
      </div>
    </div>

    <div class="arena-grid">
      <!-- Left: Game Mode & Match Setup -->
      <div class="card" style="margin-bottom:0;">
        <div class="card-header">
          <h3>Match Setup</h3>
        </div>
        <div class="form-group">
          <label>Challenge Mode</label>
          <select id="gameMode" class="form-control" ${gameState.active ? 'disabled' : ''}>
            <option value="sprint" ${gameState.gameMode === 'sprint' ? 'selected' : ''}>Rocket Sprint (Speed Arithmetic)</option>
            <option value="puzzle" ${gameState.gameMode === 'puzzle' ? 'selected' : ''}>Brain Quest (Missing Number Equations)</option>
            <option value="safari" ${gameState.gameMode === 'safari' ? 'selected' : ''}>Safari Math (Story Word Problems)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Operation Type</label>
          <select id="gameOp" class="form-control" ${gameState.active ? 'disabled' : ''}>
            <option value="mixed">Mixed Operations</option>
            <option value="add">Addition (+)</option>
            <option value="sub">Subtraction (−)</option>
            <option value="mul">Multiplication (×)</option>
            <option value="div">Division (÷)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Difficulty Tier</label>
          <select id="gameDiff" class="form-control" ${gameState.active ? 'disabled' : ''}>
            <option value="easy">Easy (Foundational)</option>
            <option value="medium" selected>Medium (Standard)</option>
            <option value="hard">Hard (Speed Masters)</option>
            <option value="expert">Expert (Grandmasters)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Round Duration</label>
          <select id="gameDur" class="form-control" ${gameState.active ? 'disabled' : ''}>
            <option value="15">15 Seconds (Quick Blitz)</option>
            <option value="30" selected>30 Seconds (Standard Quest)</option>
            <option value="60">60 Seconds (Endurance)</option>
          </select>
        </div>
        <div style="margin-top:16px;">
          ${gameState.active
            ? '<button onclick="abortMathRound()" class="btn btn-outline btn-danger btn-sm" style="width:100%; justify-content:center;">Abort Game</button>'
            : '<button onclick="startMathRound()" class="btn btn-primary btn-lg" style="width:100%; justify-content:center;">' + ICONS.play + 'Play Challenge</button>'
          }
        </div>
      </div>

      <!-- Center: Active Challenge Arena -->
      <div class="arena-box">
        <div class="arena-timer" id="arenaTimerDisplay">${formatTime(gameState.timer)}</div>
        <div style="font-size:12px; font-weight:700; color:var(--primary); text-transform:uppercase; letter-spacing:0.5px;">
          ${gameState.gameMode === 'safari' ? 'Story Problem' : gameState.gameMode === 'puzzle' ? 'Missing Number Quest' : 'Active Challenge'}
        </div>
        <div class="arena-question" id="arenaQuestionDisplay" style="font-size:${gameState.gameMode === 'safari' ? '22px' : '44px'}; line-height:1.3; max-width:440px; margin:14px auto;">
          ${gameState.currentQuestion ? gameState.currentQuestion.text : 'Press Play Challenge to Start'}
        </div>
        <form onsubmit="event.preventDefault(); submitMathAnswer();" style="display:flex; flex-direction:column; align-items:center; gap:10px;">
          <input id="arenaAnswerInput" type="number" step="any" class="arena-input" placeholder="Type Answer..." ${gameState.active ? '' : 'disabled'}>
          <button type="submit" class="btn btn-primary btn-sm" ${gameState.active ? '' : 'disabled'}>Submit Answer (Enter ↵)</button>
        </form>
        <div id="arenaFeedback" class="arena-feedback"></div>
      </div>

      <!-- Right: Live Game Rewards & Telemetry -->
      <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; gap:12px;">
        <div class="card-header">
          <h3>Telemetry</h3>
        </div>
        <div class="stat-card">
          <div class="stat-label">Game Points</div>
          <div class="stat-val" id="liveScoreVal" style="color:var(--primary);">${gameState.score}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label" style="display:flex; align-items:center;">
            ${ICONS.coin}
            Coins Earned
          </div>
          <div class="stat-val" id="liveCoinsVal" style="color:var(--warning);">${gameState.coins}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Streak Multiplier</div>
          <div class="stat-val" id="liveStreakVal">${gameState.streak}x</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Accuracy Rate</div>
          <div class="stat-val" id="liveAccVal">${gameState.totalAnswered ? Math.round((gameState.correctCount / gameState.totalAnswered) * 100) : 100}%</div>
        </div>
      </div>
    </div>
  `;

  if (gameState.active) {
    const input = document.getElementById('arenaAnswerInput');
    if (input) input.focus();
  }
}

function formatTime(s) {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startMathRound() {
  const mode = document.getElementById('gameMode')?.value || 'sprint';
  const op = document.getElementById('gameOp')?.value || 'mixed';
  const diff = document.getElementById('gameDiff')?.value || 'medium';
  const dur = Number(document.getElementById('gameDur')?.value) || 30;

  gameState = {
    active: true,
    timer: dur,
    timerInterval: null,
    score: 0,
    streak: 0,
    coins: 0,
    totalAnswered: 0,
    correctCount: 0,
    currentQuestion: generateMathQuestion(op, diff, mode),
    gameMode: mode,
    operation: op,
    difficulty: diff,
    duration: dur
  };

  renderArena();

  gameState.timerInterval = setInterval(() => {
    gameState.timer--;
    const display = document.getElementById('arenaTimerDisplay');
    if (display) display.innerText = formatTime(gameState.timer);

    if (gameState.timer <= 0) {
      clearInterval(gameState.timerInterval);
      completeMathRound();
    }
  }, 1000);
}

function abortMathRound() {
  if (gameState.timerInterval) clearInterval(gameState.timerInterval);
  gameState.active = false;
  renderArena();
  showToast('Game aborted');
}

function submitMathAnswer() {
  if (!gameState.active || !gameState.currentQuestion) return;
  const input = document.getElementById('arenaAnswerInput');
  const feedback = document.getElementById('arenaFeedback');
  const userAns = Number(input.value);

  gameState.totalAnswered++;
  if (userAns === gameState.currentQuestion.answer) {
    gameState.correctCount++;
    gameState.streak++;
    const pts = 1 + Math.floor(gameState.streak / 3);
    gameState.score += pts;
    gameState.coins += (1 + (gameState.streak >= 3 ? 1 : 0));
    playSound('correct');

    if (feedback) {
      feedback.className = 'arena-feedback correct';
      const cheers = ['Correct!', 'Excellent Calculation!', 'Accurate!', 'Fast Solution!'];
      const cheer = cheers[Math.floor(Math.random() * cheers.length)];
      feedback.innerText = `${cheer} +${pts} pts (+${gameState.streak >= 3 ? 2 : 1} coins)`;
    }
  } else {
    gameState.streak = 0;
    playSound('incorrect');
    if (feedback) {
      feedback.className = 'arena-feedback incorrect';
      feedback.innerText = `Incorrect (Answer was ${gameState.currentQuestion.answer})`;
    }
  }

  // Update live telemetry
  const scoreVal = document.getElementById('liveScoreVal');
  if (scoreVal) scoreVal.innerText = gameState.score;
  const coinsVal = document.getElementById('liveCoinsVal');
  if (coinsVal) coinsVal.innerText = gameState.coins;
  const streakVal = document.getElementById('liveStreakVal');
  if (streakVal) streakVal.innerText = `${gameState.streak}x`;
  const accVal = document.getElementById('liveAccVal');
  if (accVal) accVal.innerText = `${Math.round((gameState.correctCount / gameState.totalAnswered) * 100)}%`;

  // Next question
  gameState.currentQuestion = generateMathQuestion(gameState.operation, gameState.difficulty, gameState.gameMode);
  const qDisplay = document.getElementById('arenaQuestionDisplay');
  if (qDisplay) qDisplay.innerText = gameState.currentQuestion.text;

  input.value = '';
  input.focus();
}

async function completeMathRound() {
  gameState.active = false;
  playSound('win');
  const accuracy = gameState.totalAnswered ? Math.round((gameState.correctCount / gameState.totalAnswered) * 100) : 0;
  
  let starsHtml = '';
  if (accuracy >= 90) {
    starsHtml = ICONS.star + ICONS.star + ICONS.star;
  } else if (accuracy >= 70) {
    starsHtml = ICONS.star + ICONS.star + ICONS.starEmpty;
  } else {
    starsHtml = ICONS.star + ICONS.starEmpty + ICONS.starEmpty;
  }

  currentActiveJoke = KID_MATH_JOKES[Math.floor(Math.random() * KID_MATH_JOKES.length)];

  // Submit score to API
  try {
    await api('/api/scores', {
      method: 'POST',
      body: JSON.stringify({
        score: gameState.score,
        accuracy,
        duration: gameState.duration,
        difficulty: gameState.difficulty,
        operation: gameState.operation
      })
    });
  } catch (e) {
    console.error(e);
  }

  // Render Round Summary Modal with Vector SVG Icons and Pure Text
  document.getElementById('roundSummaryContent').innerHTML = `
    <div style="display:flex; justify-content:center; align-items:center; margin-bottom:8px;">${starsHtml}</div>
    <div style="font-size:32px; font-weight:800; color:var(--primary); margin-bottom:2px;">${gameState.score} Points</div>
    <div style="font-size:13px; font-weight:600; color:var(--warning); display:flex; align-items:center; justify-content:center; margin-bottom:14px;">
      ${ICONS.coin} +${gameState.coins} Coins Earned
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; text-align:left; background:var(--surface-sub); padding:12px; border-radius:6px; font-size:12px; margin-bottom:14px;">
      <div><span>Questions Solved:</span> <b style="float:right;">${gameState.totalAnswered}</b></div>
      <div><span>Correct Answers:</span> <b style="float:right;">${gameState.correctCount}</b></div>
      <div><span>Accuracy Rate:</span> <b style="float:right;">${accuracy}%</b></div>
      <div><span>Duration:</span> <b style="float:right;">${gameState.duration}s</b></div>
    </div>

    <!-- Funny Question & Simplified Explanation Card -->
    <div class="joke-card">
      <div class="joke-header">
        ${ICONS.riddle}
        <span>Bonus Question & Math Riddle</span>
      </div>
      <div class="joke-riddle">"${currentActiveJoke.riddle}"</div>
      
      <button id="jokeRevealBtn" onclick="revealJokePunchline()" class="btn btn-primary btn-sm" style="width:100%; justify-content:center; margin-bottom:6px;">
        ${ICONS.reveal}
        Tap to Reveal Answer & Shortcut
      </button>

      <div id="jokePunchlineBox" style="display:none;">
        <div class="joke-punchline">${currentActiveJoke.punchline}</div>
        <div class="joke-explanation-box">
          <div class="joke-explanation-title" style="display:flex; align-items:center;">
            ${ICONS.lightbulb}
            ${currentActiveJoke.explanationTitle}
          </div>
          <div style="color:var(--text); font-size:12px; line-height:1.5;">${currentActiveJoke.explanationText}</div>
        </div>
      </div>
    </div>
  `;
  openModal('roundSummaryModal');
  renderArena();
}

// ================= LEADERBOARD =================
let currentBoardPeriod = 'alltime';

async function renderLeaderboard() {
  let rows = [];
  try {
    rows = await api(`/api/leaderboard?period=${currentBoardPeriod}`);
  } catch (e) {
    showToast(e.message);
  }

  content.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <h2>Global Rankings & Leaderboard</h2>
        <p>Top speed arithmetic scores validated across all competition rounds.</p>
      </div>
      <button onclick="renderLeaderboard()" class="btn btn-outline btn-sm">Refresh Rankings</button>
    </div>

    <div style="display:flex; gap:8px; margin-bottom:16px;">
      <button onclick="switchBoardPeriod('alltime')" class="btn ${currentBoardPeriod === 'alltime' ? 'btn-primary' : 'btn-outline'} btn-sm">All-Time</button>
      <button onclick="switchBoardPeriod('daily')" class="btn ${currentBoardPeriod === 'daily' ? 'btn-primary' : 'btn-outline'} btn-sm">Today</button>
      <button onclick="switchBoardPeriod('weekly')" class="btn ${currentBoardPeriod === 'weekly' ? 'btn-primary' : 'btn-outline'} btn-sm">This Week</button>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width:60px;">Rank</th>
            <th>Player Username</th>
            <th>Validated Score</th>
            <th>Accuracy</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td><b style="color:var(--primary);">#${r.rank}</b></td>
              <td><b>${r.username}</b></td>
              <td><span class="tag tag-green">${r.score} pts</span></td>
              <td>${r.accuracy}%</td>
              <td>${new Date(r.playedAt).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function switchBoardPeriod(p) {
  currentBoardPeriod = p;
  renderLeaderboard();
}

// ================= PROFILE =================
async function renderProfile() {
  let data = { user: mathUser || {}, stats: {}, history: [] };
  try {
    data = await api('/api/profile/me');
  } catch (e) {
    // If guest
  }

  const { stats = {}, history = [] } = data;

  content.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <h2>Player Profile & Statistics</h2>
        <p>Historical competition logs, personal best records, and average accuracy.</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Personal Best Score</div>
        <div class="stat-val" style="color:var(--primary);">${stats.bestScore || mathUser?.bestScore || 0} pts</div>
        <div class="stat-sub">High water mark</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Rounds Played</div>
        <div class="stat-val">${stats.gamesPlayed || 0}</div>
        <div class="stat-sub">Completed games</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Average Score</div>
        <div class="stat-val">${stats.avgScore || 0} pts</div>
        <div class="stat-sub">Per round average</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Recent Match History</h3>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Match ID</th>
              <th>Operation</th>
              <th>Difficulty</th>
              <th>Score</th>
              <th>Accuracy</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${history.length ? history.map(h => `
              <tr>
                <td><b>${h.id}</b></td>
                <td><span class="tag tag-gray">${h.operation}</span></td>
                <td><span class="tag tag-green">${h.difficulty}</span></td>
                <td><b>${h.score} pts</b></td>
                <td>${h.accuracy}%</td>
                <td>${new Date(h.playedAt).toLocaleDateString()}</td>
              </tr>
            `).join('') : '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No matches recorded yet. Play a round in the arena!</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ================= REFERENCE =================
function renderReference() {
  content.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <h2>Mental Math Speed Shortcuts</h2>
        <p>Master these core mathematical principles to maximize calculation speed in the arena.</p>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
      <div class="card">
        <div class="card-header"><h3>1. Multiplying by 11</h3></div>
        <p style="font-size:13px; color:var(--text-sub); line-height:1.6;">
          To multiply any 2-digit number by 11, add the two digits and place the sum in the middle.<br><br>
          <b>Example: 43 × 11</b><br>
          • Step 1: 4 + 3 = 7<br>
          • Step 2: Place 7 between 4 and 3 ➔ <b>473</b>
        </p>
      </div>

      <div class="card">
        <div class="card-header"><h3>2. Squaring Numbers Ending in 5</h3></div>
        <p style="font-size:13px; color:var(--text-sub); line-height:1.6;">
          Multiply the first digit by (first digit + 1), then append 25 to the result.<br><br>
          <b>Example: 65²</b><br>
          • Step 1: 6 × (6 + 1) = 6 × 7 = 42<br>
          • Step 2: Append 25 ➔ <b>4,225</b>
        </p>
      </div>

      <div class="card">
        <div class="card-header"><h3>3. Divisibility by 4</h3></div>
        <p style="font-size:13px; color:var(--text-sub); line-height:1.6;">
          A number is divisible by 4 if its last two digits form a number divisible by 4.<br><br>
          <b>Example: 3,524</b><br>
          • Last two digits: 24 (24 ÷ 4 = 6) ➔ <b>Divisible by 4</b>
        </p>
      </div>

      <div class="card">
        <div class="card-header"><h3>4. Fast Percentage Calculation</h3></div>
        <p style="font-size:13px; color:var(--text-sub); line-height:1.6;">
          Percentages are reversible: <b>x% of y = y% of x</b>.<br><br>
          <b>Example: 16% of 50</b><br>
          • Equivalent to: 50% of 16 = <b>8</b>
        </p>
      </div>
    </div>
  `;
}

// ================= SETTINGS =================
function renderSettings() {
  content.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <h2>Arena Settings & Data Export</h2>
        <p>Manage player preferences, keyboard shortcuts, and export historical scores.</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>Player Preferences</h3></div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div class="form-group">
          <label>Player Username</label>
          <input type="text" value="${mathUser?.username || 'player_one'}" class="form-control" readonly>
        </div>
        <div class="form-group">
          <label>Registered Email</label>
          <input type="email" value="${mathUser?.email || 'player@domain.com'}" class="form-control" readonly>
        </div>
      </div>
      <div style="margin-top:12px;">
        <button onclick="showToast('Preferences updated')" class="btn btn-primary btn-sm">Save Preferences</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>Data Export</h3></div>
      <p style="font-size:13px; color:var(--text-muted); margin-bottom:12px;">Download all your completed match scores and accuracy logs in CSV format.</p>
      <button onclick="exportMathCSV()" class="btn btn-outline btn-sm">Download Scores CSV</button>
    </div>
  `;
}

// ================= CSV EXPORT =================
async function exportMathCSV() {
  try {
    const rows = await api('/api/leaderboard?period=alltime');
    let csv = 'Rank,Username,Score,Accuracy,Timestamp\n';
    rows.forEach(r => {
      csv += `${r.rank},"${r.username}",${r.score},${r.accuracy},"${r.playedAt}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'speedmath_rankings.csv';
    a.click();
    showToast('Exported leaderboard CSV');
  } catch (e) {
    showToast(e.message);
  }
}

// ================= MODAL CONTROLS =================
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

async function resetMathData() {
  if (confirm('Restore default sample leaderboards and player stats?')) {
    try {
      await api('/api/admin/reset', { method: 'POST' });
      showToast('Reset leaderboard rankings to defaults');
      loadPage(currentPage);
    } catch (e) {
      showToast('Data refreshed');
      loadPage(currentPage);
    }
  }
}

// Global Exports
window.initMathAuth = initMathAuth;
window.toggleMathPasswordVisibility = toggleMathPasswordVisibility;
window.checkMathCapsLock = checkMathCapsLock;
window.validateMathPasswordStrength = validateMathPasswordStrength;
window.checkMathPasswordMatch = checkMathPasswordMatch;
window.setAuthTab = setAuthTab;
window.handleMathLogin = handleMathLogin;
window.handleMathSignUp = handleMathSignUp;
window.quickMathLogin = quickMathLogin;
window.logoutMath = logoutMath;
window.openForgotModal = openForgotModal;
window.sendPasswordResetLink = sendPasswordResetLink;
window.changeMathTheme = changeMathTheme;
window.loadPage = loadPage;
window.refreshData = refreshData;
window.refreshMathData = refreshData;
window.startMathRound = startMathRound;
window.abortMathRound = abortMathRound;
window.submitMathAnswer = submitMathAnswer;
window.switchBoardPeriod = switchBoardPeriod;
window.exportMathCSV = exportMathCSV;
window.resetMathData = resetMathData;
window.revealJokePunchline = revealJokePunchline;
window.openModal = openModal;
window.closeModal = closeModal;

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  const sel = document.getElementById('paletteSelect');
  if (sel) sel.value = savedMathTheme;
  initMathAuth();
  loadPage('arena');
});
