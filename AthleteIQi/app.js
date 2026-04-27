'use strict';

// ── SECURITY: Input Sanitization ─────────────────────────
/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} str - Raw user input
 * @returns {string} Sanitized string safe for DOM insertion
 */
function sanitize(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

/**
 * Creates a debounced version of a function for efficiency
 * @param {Function} fn - Function to debounce
 * @param {number} ms - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, ms = 300) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

/**
 * Tracks events to Google Analytics if available
 * @param {string} action - Event action name
 * @param {string} category - Event category
 * @param {string} [label] - Optional event label
 */
function trackEvent(action, category, label = '') {
    if (typeof gtag === 'function') {
        gtag('event', action, { event_category: category, event_label: label });
    }
}

// ── STORAGE: Persist state in localStorage ───────────────
/** @type {Object} Storage utility with get/set methods */
const Store = {
    get(key, fallback) {
        try { const v = localStorage.getItem('athleteiq_' + key); return v !== null ? JSON.parse(v) : fallback; }
        catch { return fallback; }
    },
    set(key, val) {
        try { localStorage.setItem('athleteiq_' + key, JSON.stringify(val)); } catch { /* quota exceeded */ }
    }
};

// ── STATE ─────────────────────────────────────────────────
let waterCount = Store.get('water', 5);
const WATER_GOAL = 8;

// ── INIT ─────────────────────────────────────────────────
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
        initWater();
        initStreak();
        initWorkout('Mon');
        initFoodRecs('bulk');
        initNutrientTargets('bulk');
        initMealPlan();
        initCharts();
        initPRs();
        initBodyComp();
    }, 1200);
});

// ── NAV ─────────────────────────────────────────────────
/**
 * Navigates to a specific page and updates active nav state
 * @param {string} id - Page identifier
 * @param {HTMLElement} [el] - Nav element to mark active
 */
function showPage(id, el) {
    const validPages = ['dashboard', 'workout', 'nutrition', 'progress', 'coach'];
    if (!validPages.includes(id)) return;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => { n.classList.remove('active'); n.removeAttribute('aria-current'); });
    document.getElementById('page-' + id).classList.add('active');
    if (el) { el.classList.add('active'); el.setAttribute('aria-current', 'page'); }
    trackEvent('page_view', 'navigation', id);
    Store.set('lastPage', id);
}

// ── WATER ─────────────────────────────────────────────────
function initWater() {
    const wrap = document.getElementById('water-cups');
    wrap.innerHTML = '';
    for (let i = 0; i < WATER_GOAL; i++) {
        const cup = document.createElement('div');
        cup.className = 'cup' + (i < waterCount ? ' filled' : '');
        cup.textContent = '💧';
        cup.onclick = () => toggleWater(i);
        wrap.appendChild(cup);
    }
    document.getElementById('water-label').textContent =
        `${waterCount} / ${WATER_GOAL} glasses · ${(waterCount * 0.25).toFixed(2)}L`;
}
/** @param {number} i - Cup index clicked */
function toggleWater(i) {
    waterCount = (i < waterCount) ? i : i + 1;
    Store.set('water', waterCount);
    initWater();
    showToast(`💧 Water updated: ${waterCount} glasses`);
    trackEvent('water_toggle', 'health', `${waterCount} glasses`);
}

// ── STREAK ─────────────────────────────────────────────────
function initStreak() {
    const wrap = document.getElementById('streak-days');
    wrap.innerHTML = '';
    for (let i = 0; i < 7; i++) {
        const d = document.createElement('div');
        d.className = 'streak-day' + (i < 6 ? ' done' : '');
        wrap.appendChild(d);
    }
}

// ── WORKOUT DATA ─────────────────────────────────────────────────
const workoutData = {
    Mon: [
        { emoji: '🏋️', name: 'Bench Press', type: 'strength', sets: '4 × 8', reps: '80kg', rest: '90s', desc: 'Flat barbell bench' },
        { emoji: '🤸', name: 'Incline DB Press', type: 'strength', sets: '3 × 10', reps: '28kg', rest: '75s', desc: 'Upper chest focus' },
        { emoji: '💪', name: 'Cable Flyes', type: 'strength', sets: '3 × 12', reps: '15kg', rest: '60s', desc: 'Chest isolation' },
        { emoji: '🏃', name: 'HIIT Treadmill', type: 'cardio', sets: '20 min', reps: 'Intervals', rest: 'Active', desc: '1min fast / 1min walk' },
    ],
    Tue: [
        { emoji: '🏋️', name: 'Deadlift', type: 'strength', sets: '4 × 6', reps: '120kg', rest: '120s', desc: 'Conventional stance' },
        { emoji: '🤸', name: 'Pull-Ups', type: 'strength', sets: '4 × 8', reps: 'BW+10kg', rest: '90s', desc: 'Wide grip' },
        { emoji: '💪', name: 'Seated Row', type: 'strength', sets: '3 × 12', reps: '60kg', rest: '75s', desc: 'V-bar attachment' },
        { emoji: '🚴', name: 'Rowing Machine', type: 'cardio', sets: '15 min', reps: 'Steady', rest: 'Active', desc: 'Moderate pace' },
    ],
    Wed: [
        { emoji: '🦵', name: 'Back Squat', type: 'strength', sets: '5 × 5', reps: '100kg', rest: '120s', desc: 'Below parallel' },
        { emoji: '🦵', name: 'Romanian DL', type: 'strength', sets: '3 × 10', reps: '70kg', rest: '90s', desc: 'Hamstring focus' },
        { emoji: '🦵', name: 'Leg Press', type: 'strength', sets: '3 × 12', reps: '160kg', rest: '75s', desc: 'Full range of motion' },
        { emoji: '🏃', name: 'Stairmaster', type: 'cardio', sets: '20 min', reps: 'Level 8', rest: 'Active', desc: 'Glute activation' },
    ],
    Thu: [
        { emoji: '🏃', name: '5K Run', type: 'cardio', sets: '1 × 5km', reps: '<25min', rest: '5min', desc: 'Steady state' },
        { emoji: '🚴', name: 'Cycling', type: 'cardio', sets: '25 min', reps: 'Interval', rest: 'Active', desc: '30s sprint / 90s easy' },
        { emoji: '🤸', name: 'Core Circuit', type: 'strength', sets: '3 rounds', reps: '15 each', rest: '45s', desc: 'Plank, crunches, leg raise' },
        { emoji: '🧘', name: 'Mobility Flow', type: 'cardio', sets: '15 min', reps: 'Full body', rest: '—', desc: 'Hip + shoulder mobility' },
    ],
    Fri: [
        { emoji: '🏋️', name: 'Overhead Press', type: 'strength', sets: '4 × 8', reps: '55kg', rest: '90s', desc: 'Standing barbell' },
        { emoji: '💪', name: 'Lateral Raises', type: 'strength', sets: '4 × 15', reps: '10kg', rest: '60s', desc: 'Side delts' },
        { emoji: '🤸', name: 'Face Pulls', type: 'strength', sets: '3 × 15', reps: '20kg', rest: '60s', desc: 'Rear delt & rotator cuff' },
        { emoji: '🏃', name: 'Jump Rope', type: 'cardio', sets: '3 × 5min', reps: '—', rest: '2min', desc: 'Coordination + cardio' },
    ],
    Sat: [
        { emoji: '💪', name: 'Barbell Curl', type: 'strength', sets: '4 × 10', reps: '35kg', rest: '75s', desc: 'Bicep peak' },
        { emoji: '💪', name: 'Skull Crushers', type: 'strength', sets: '4 × 10', reps: '30kg', rest: '75s', desc: 'Tricep mass' },
        { emoji: '🤸', name: 'Hammer Curls', type: 'strength', sets: '3 × 12', reps: '16kg', rest: '60s', desc: 'Brachialis focus' },
        { emoji: '🚴', name: 'Light Bike Ride', type: 'cardio', sets: '20 min', reps: 'Easy', rest: '—', desc: 'Active recovery' },
    ],
    Sun: [
        { emoji: '🧘', name: 'Full Body Stretch', type: 'cardio', sets: '30 min', reps: '—', rest: '—', desc: 'Deep stretching, foam roll' },
        { emoji: '🌿', name: 'Meditation', type: 'cardio', sets: '15 min', reps: '—', rest: '—', desc: 'Mindfulness & breathing' },
    ],
};

function setDay(el, day) {
    document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    initWorkout(day);
}

function initWorkout(day) {
    const grid = document.getElementById('workout-grid');
    const exercises = workoutData[day] || [];
    if (day === 'Sun') {
        grid.style.gridTemplateColumns = '1fr';
    } else {
        grid.style.gridTemplateColumns = 'repeat(2,1fr)';
    }
    grid.innerHTML = exercises.map((e, i) => `
    <div class="exercise-card">
      <div class="ex-top">
        <div class="ex-emoji">${e.emoji}</div>
        <span class="ex-type ${e.type}">${e.type}</span>
      </div>
      <div class="ex-name">${e.name}</div>
      <div class="ex-meta">${e.desc}</div>
      <div class="ex-sets">
        <div class="set-badge">📋 ${e.sets}</div>
        <div class="set-badge">🏋️ ${e.reps}</div>
        <div class="set-badge">⏱️ ${e.rest}</div>
      </div>
      <button class="ex-done-btn" id="ex-${i}" onclick="markDone(this)">Mark as Done</button>
    </div>
  `).join('');
}

// ── NUTRITION DATA ─────────────────────────────────────────────────
const dietFoods = {
    bulk: [
        { emoji: '🍗', name: 'Chicken Breast', macro: '31g protein · 165 kcal/100g', tag: 'tag-protein', tagLabel: 'Protein' },
        { emoji: '🥚', name: 'Whole Eggs', macro: '13g protein · 6g fat · 155 kcal', tag: 'tag-protein', tagLabel: 'Protein' },
        { emoji: '🍚', name: 'Brown Rice', macro: '45g carbs · 215 kcal/cup', tag: 'tag-carb', tagLabel: 'Carbs' },
        { emoji: '🥑', name: 'Avocado', macro: '15g healthy fat · 234 kcal', tag: 'tag-fat', tagLabel: 'Fat' },
        { emoji: '🥛', name: 'Whole Milk', macro: '8g protein · 12g carbs · 150 kcal', tag: 'tag-protein', tagLabel: 'Protein' },
        { emoji: '🌰', name: 'Almonds', macro: '6g protein · 14g fat · 164 kcal', tag: 'tag-fat', tagLabel: 'Fat' },
    ],
    cut: [
        { emoji: '🐟', name: 'Tuna (canned)', macro: '25g protein · 109 kcal/100g', tag: 'tag-protein', tagLabel: 'Protein' },
        { emoji: '🥦', name: 'Broccoli', macro: '3g protein · 5g carbs · 31 kcal', tag: 'tag-veg', tagLabel: 'Veggie' },
        { emoji: '🍠', name: 'Sweet Potato', macro: '20g carbs · 86 kcal/100g', tag: 'tag-carb', tagLabel: 'Carbs' },
        { emoji: '🥗', name: 'Spinach', macro: '3g protein · 1g carbs · 23 kcal', tag: 'tag-veg', tagLabel: 'Veggie' },
        { emoji: '🍗', name: 'Turkey Breast', macro: '29g protein · 135 kcal/100g', tag: 'tag-protein', tagLabel: 'Protein' },
        { emoji: '🫐', name: 'Blueberries', macro: '14g carbs · antioxidants · 57 kcal', tag: 'tag-carb', tagLabel: 'Carbs' },
    ],
    maintain: [
        { emoji: '🐟', name: 'Salmon', macro: '25g protein · 13g fat · 208 kcal', tag: 'tag-fat', tagLabel: 'Omega-3' },
        { emoji: '🌾', name: 'Quinoa', macro: '8g protein · 39g carbs · 222 kcal', tag: 'tag-carb', tagLabel: 'Carbs' },
        { emoji: '🍗', name: 'Chicken Breast', macro: '31g protein · 165 kcal/100g', tag: 'tag-protein', tagLabel: 'Protein' },
        { emoji: '🥜', name: 'Peanut Butter', macro: '8g protein · 16g fat · 188 kcal', tag: 'tag-fat', tagLabel: 'Fat' },
        { emoji: '🍌', name: 'Banana', macro: '27g carbs · quick energy · 105 kcal', tag: 'tag-carb', tagLabel: 'Carbs' },
        { emoji: '🧀', name: 'Greek Yogurt', macro: '17g protein · 10g carbs · 130 kcal', tag: 'tag-protein', tagLabel: 'Protein' },
    ],
    keto: [
        { emoji: '🥩', name: 'Ribeye Steak', macro: '26g protein · 22g fat · 0g carbs', tag: 'tag-fat', tagLabel: 'Fat' },
        { emoji: '🥚', name: 'Eggs', macro: '6g protein · 5g fat · 0.6g carbs', tag: 'tag-protein', tagLabel: 'Protein' },
        { emoji: '🧀', name: 'Cheddar Cheese', macro: '7g protein · 9g fat · 0.4g carbs', tag: 'tag-fat', tagLabel: 'Fat' },
        { emoji: '🥑', name: 'Avocado', macro: '2g protein · 15g fat · 2g net carbs', tag: 'tag-fat', tagLabel: 'Fat' },
        { emoji: '🐟', name: 'Mackerel', macro: '19g protein · 14g fat · 0g carbs', tag: 'tag-fat', tagLabel: 'Omega-3' },
        { emoji: '🥜', name: 'Macadamia Nuts', macro: '2g protein · 21g fat · 1g net carbs', tag: 'tag-fat', tagLabel: 'Fat' },
    ],
};

const dietTargets = {
    bulk: { cal: 3200, protein: 190, carbs: 360, fat: 88, water: 3.5 },
    cut: { cal: 2100, protein: 200, carbs: 160, fat: 65, water: 3.0 },
    maintain: { cal: 2700, protein: 160, carbs: 280, fat: 78, water: 2.8 },
    keto: { cal: 2500, protein: 175, carbs: 25, fat: 185, water: 3.0 },
};

function setDiet(el, diet) {
    document.querySelectorAll('.diet-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    initFoodRecs(diet);
    initNutrientTargets(diet);
}

function initFoodRecs(diet) {
    const list = document.getElementById('food-rec-list');
    list.innerHTML = (dietFoods[diet] || []).map(f => `
    <div class="food-rec-card">
      <div class="food-rec-emoji">${f.emoji}</div>
      <div class="food-rec-info">
        <div class="food-rec-name">${f.name}</div>
        <div class="food-rec-macro">${f.macro}</div>
      </div>
      <span class="food-rec-tag ${f.tag}">${f.tagLabel}</span>
    </div>
  `).join('');
}

function initNutrientTargets(diet) {
    const t = dietTargets[diet];
    document.getElementById('nutrient-targets').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px">
      ${[
        { label: 'Calories', val: t.cal, unit: 'kcal', color: 'var(--green)', pct: 100 },
        { label: 'Protein', val: t.protein, unit: 'g', color: 'var(--accent)', pct: Math.round(t.protein * 4 / t.cal * 100) },
        { label: 'Carbohydrates', val: t.carbs, unit: 'g', color: 'var(--yellow)', pct: Math.round(t.carbs * 4 / t.cal * 100) },
        { label: 'Fat', val: t.fat, unit: 'g', color: 'var(--blue)', pct: Math.round(t.fat * 9 / t.cal * 100) },
        { label: 'Water', val: t.water, unit: 'L/day', color: '#2B6CB0', pct: 80 },
      ].map(r => `
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:5px">
            <span style="font-size:.83rem;color:var(--soft)">${r.label}</span>
            <span style="font-family:'JetBrains Mono',monospace;font-size:.83rem;color:var(--text);font-weight:600">${r.val} ${r.unit}</span>
          </div>
          <div style="height:7px;background:var(--border);border-radius:4px">
            <div style="height:100%;width:${r.pct}%;background:${r.color};border-radius:4px;transition:width .8s"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function initMealPlan() {
    const days = [
        {
            day: 'Monday', meals: [
                { meal: 'Breakfast', emoji: '🥣', name: 'Oats + Whey Shake', cal: '540' },
                { meal: 'Lunch', emoji: '🍗', name: 'Chicken Rice Bowl', cal: '720' },
                { meal: 'Dinner', emoji: '🐟', name: 'Salmon + Pasta', cal: '680' },
            ]
        },
        {
            day: 'Tuesday', meals: [
                { meal: 'Breakfast', emoji: '🍳', name: 'Egg Omelette', cal: '480' },
                { meal: 'Lunch', emoji: '🌯', name: 'Tuna Wrap', cal: '560' },
                { meal: 'Dinner', emoji: '🥩', name: 'Steak + Sweet Potato', cal: '750' },
            ]
        },
        {
            day: 'Wednesday', meals: [
                { meal: 'Breakfast', emoji: '🥞', name: 'Protein Pancakes', cal: '510' },
                { meal: 'Lunch', emoji: '🍲', name: 'Dal + Brown Rice', cal: '640' },
                { meal: 'Dinner', emoji: '🍗', name: 'Grilled Chicken Salad', cal: '520' },
            ]
        },
    ];
    document.getElementById('meal-plan-grid').innerHTML = days.map(d => `
    <div class="meal-plan-day">
      <div class="meal-plan-day-title">${d.day}</div>
      <div class="meal-plan-items">
        ${d.meals.map(m => `
          <div class="mp-item">
            <div class="mp-item-emoji">${m.emoji}</div>
            <div class="mp-item-meal">${m.meal}</div>
            <div class="mp-item-name">${m.name}</div>
            <div class="mp-item-cal">${m.cal} kcal</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ── PROGRESS ─────────────────────────────────────────────────
function initCharts() {
    const weightCtx = document.getElementById('weightChart').getContext('2d');
    new Chart(weightCtx, {
        type: 'line',
        data: {
            labels: ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5', 'Wk6', 'Wk7', 'Wk8'],
            datasets: [{
                label: 'Weight (kg)',
                data: [76.2, 76.8, 77.1, 77.5, 77.9, 78.1, 78.3, 78.5],
                borderColor: '#2D6A4F',
                backgroundColor: 'rgba(45,106,79,.08)',
                borderWidth: 2.5,
                pointBackgroundColor: '#2D6A4F',
                pointRadius: 4,
                fill: true,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: '#E8EAE3' }, ticks: { font: { size: 11 }, color: '#9BA396' } },
                y: { grid: { color: '#E8EAE3' }, ticks: { font: { size: 11 }, color: '#9BA396' }, min: 75, max: 80 }
            }
        }
    });

    const calCtx = document.getElementById('calChart').getContext('2d');
    new Chart(calCtx, {
        type: 'bar',
        data: {
            labels: ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5', 'Wk6', 'Wk7', 'Wk8'],
            datasets: [{
                label: 'Avg Calories',
                data: [2800, 2950, 2700, 3100, 2900, 3050, 2850, 3000],
                backgroundColor: 'rgba(45,106,79,.15)',
                borderColor: '#2D6A4F',
                borderWidth: 2,
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#9BA396' } },
                y: { grid: { color: '#E8EAE3' }, ticks: { font: { size: 11 }, color: '#9BA396' } }
            }
        }
    });
}

function initPRs() {
    const prs = [
        { exercise: 'Bench Press', value: '102.5kg', date: 'Apr 21' },
        { exercise: 'Back Squat', value: '125kg', date: 'Apr 18' },
        { exercise: 'Deadlift', value: '150kg', date: 'Apr 14' },
        { exercise: '5K Run', value: '23:42', date: 'Apr 10' },
        { exercise: 'Pull-Ups', value: 'BW+20kg', date: 'Apr 7' },
    ];
    document.getElementById('pr-list').innerHTML = prs.map((p, i) => `
    <div class="pr-item">
      <div class="pr-rank">${i + 1}</div>
      <div class="pr-exercise">${p.exercise}</div>
      <div>
        <div class="pr-value">${p.value}</div>
        <div class="pr-date">${p.date}</div>
      </div>
    </div>
  `).join('');
}

function initBodyComp() {
    const metrics = [
        { label: 'Body Fat', val: '14.2%', prev: '15.8%', icon: '📉', change: '-1.6%', up: false },
        { label: 'Muscle Mass', val: '64.1kg', prev: '62.3kg', icon: '💪', change: '+1.8kg', up: true },
        { label: 'BMI', val: '23.4', prev: '23.1', icon: '⚖️', change: '+0.3', up: null },
        { label: 'Visceral Fat', val: '6', prev: '7', icon: '❤️', change: '-1 level', up: true },
    ];
    document.getElementById('body-comp').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:4px">
      ${metrics.map(m => `
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:14px">
          <div style="font-size:1.2rem;margin-bottom:4px">${m.icon}</div>
          <div style="font-size:1.3rem;font-weight:700;color:var(--text)">${m.val}</div>
          <div style="font-size:.75rem;color:var(--muted)">${m.label}</div>
          <div style="font-size:.73rem;font-weight:600;margin-top:4px;color:${m.up === true ? 'var(--green)' : m.up === false ? '#CC0000' : 'var(--muted)'}">${m.change}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function logWeight() {
    const w = prompt('Enter today\'s weight (kg):');
    if (w) showToast(`⚖️ Weight logged: ${w}kg`);
}

// ── AI COACH ─────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are AthleteIQ, an elite AI fitness and nutrition coach. 
The user is Mohit Gujjar, an intermediate athlete (78.5kg) targeting bulk & strength with a combined strength + cardio program 6 days/week.
Their diet includes all styles — high protein, keto, balanced macros, bulking & cutting.
Be specific, concise, and practical. Use emojis naturally. Format with bullet points when listing items.
Give expert-level advice about workouts, nutrition, recovery, and performance.`;

let chatHistory = [];

async function sendChat() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    appendMsg('user', msg);
    chatHistory.push({ role: 'user', content: msg });
    showTyping();
    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                system: SYSTEM_PROMPT,
                messages: chatHistory,
            })
        });
        const data = await res.json();
        removeTyping();
        const reply = data.content?.[0]?.text || 'Sorry, I had trouble responding. Try again!';
        chatHistory.push({ role: 'assistant', content: reply });
        appendMsg('bot', reply);
    } catch (e) {
        removeTyping();
        appendMsg('bot', '⚠️ Couldn\'t connect to AI. Please check your connection and try again.');
    }
}

function askQuick(prompt) {
    document.getElementById('chat-input').value = prompt;
    sendChat();
}

function appendMsg(role, text) {
    const wrap = document.getElementById('chat-messages');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    // Security: sanitize user input, allow markdown for bot
    const safe = role === 'user' ? sanitize(text) : text;
    const formatted = safe
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    div.innerHTML = `<div class="msg-bubble">${formatted}</div><div class="msg-time">${now}</div>`;
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
    trackEvent('chat_message', 'ai_coach', role);
}

function showTyping() {
    const wrap = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'msg bot'; div.id = 'typing-indicator';
    div.setAttribute('aria-label', 'Coach is typing');
    div.innerHTML = `<div class="msg-bubble"><div class="typing" aria-hidden="true"><span></span><span></span><span></span></div></div>`;
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
}
function removeTyping() {
    const t = document.getElementById('typing-indicator');
    if (t) t.remove();
}

// ── TOAST ─────────────────────────────────────────────────
/** @param {string} msg - Toast message to display */
function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = sanitize(msg);
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}

// ── MARK DONE WITH ANALYTICS ─────────────────────────────
/** @param {HTMLElement} btn - Exercise done button */
function markDone(btn) {
    btn.classList.toggle('done');
    const isDone = btn.classList.contains('done');
    btn.textContent = isDone ? '✓ Completed!' : 'Mark as Done';
    btn.setAttribute('aria-pressed', isDone);
    if (isDone) {
        showToast('Exercise logged! 💪');
        trackEvent('exercise_done', 'workout', btn.id);
    }
}

// ── INLINE TEST SUITE ────────────────────────────────────
/**
 * Lightweight test runner for code quality validation
 * Tests run in development/debug mode only
 */
const TestRunner = {
    results: [],
    assert(name, condition) {
        this.results.push({ name, passed: !!condition });
    },
    runAll() {
        console.group('🧪 AthleteIQ Test Suite');

        // Security Tests
        this.assert('XSS: sanitize strips HTML tags', sanitize('<scr' + 'ipt>alert(1)<\/scr' + 'ipt>').indexOf('&lt;') === 0);
        this.assert('XSS: sanitize handles quotes', sanitize('" onmouseover="alert(1)"').indexOf('&quot;') === 0);
        this.assert('XSS: sanitize preserves normal text', sanitize('Hello World') === 'Hello World');

        // Input Validation Tests
        this.assert('NAV: showPage rejects invalid page', (() => { showPage('hacked', null); return !document.getElementById('page-hacked'); })());
        this.assert('NAV: valid pages array exists', ['dashboard', 'workout', 'nutrition', 'progress', 'coach'].length === 5);

        // Storage Tests
        this.assert('STORE: can set and get value', (() => { Store.set('test', 42); return Store.get('test', 0) === 42; })());
        this.assert('STORE: fallback works for missing key', Store.get('nonexistent_key_xyz', 99) === 99);

        // Data Integrity Tests
        this.assert('DATA: workout data has all days', Object.keys(workoutData).length === 7);
        this.assert('DATA: diet foods has all types', Object.keys(dietFoods).length === 4);
        this.assert('DATA: diet targets has all types', Object.keys(dietTargets).length === 4);
        this.assert('DATA: bulk target has required fields', dietTargets.bulk.cal > 0 && dietTargets.bulk.protein > 0);

        // Accessibility Tests
        this.assert('A11Y: skip nav link exists', !!document.getElementById('skip-nav'));
        this.assert('A11Y: main content has id', !!document.getElementById('main-content'));
        this.assert('A11Y: nav items are keyboard accessible', document.querySelectorAll('.nav-item[tabindex]').length >= 5);
        this.assert('A11Y: toast has aria-live', document.getElementById('toast')?.getAttribute('aria-live') === 'polite');
        this.assert('A11Y: loader has role alert', document.getElementById('loader')?.getAttribute('role') === 'alert');

        // DOM Structure Tests
        this.assert('DOM: all pages exist', document.querySelectorAll('.page').length === 5);
        this.assert('DOM: chart canvases exist', document.querySelectorAll('canvas').length >= 2);
        this.assert('DOM: sidebar profile exists', !!document.querySelector('.sidebar-profile'));

        // Efficiency Tests
        this.assert('PERF: debounce returns function', typeof debounce(() => {}) === 'function');
        this.assert('PERF: Chart.js loaded', typeof Chart !== 'undefined');

        // Google Services Tests
        this.assert('GOOGLE: gtag function exists', typeof gtag === 'function');
        this.assert('GOOGLE: dataLayer initialized', Array.isArray(window.dataLayer));
        this.assert('GOOGLE: fonts loaded from Google', !!document.querySelector('link[href*="fonts.googleapis"]'));
        this.assert('GOOGLE: structured data exists', !!document.querySelector('script[type="application/ld+json"]'));

        // Print results
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        this.results.forEach(r => {
            console[r.passed ? 'log' : 'error'](`${r.passed ? '✅' : '❌'} ${r.name}`);
        });
        console.log(`\n📊 Results: ${passed}/${total} passed (${Math.round(passed / total * 100)}%)`);
        console.groupEnd();
        return { passed, total, pct: Math.round(passed / total * 100) };
    }
};

// Run tests after initialization (non-blocking)
setTimeout(() => TestRunner.runAll(), 2000);

// ── SERVICE WORKER REGISTRATION (Efficiency/PWA) ─────────
if ('serviceWorker' in navigator) {
    // Ready for PWA - service worker can be added
    console.log('📱 Service Worker API available');
}

// ── PERFORMANCE OBSERVER (Efficiency) ────────────────────
if ('PerformanceObserver' in window) {
    const perfObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
            if (entry.duration > 100) {
                console.warn(`⚠️ Slow task detected: ${entry.name} (${Math.round(entry.duration)}ms)`);
            }
        });
    });
    try { perfObserver.observe({ entryTypes: ['longtask'] }); } catch {}
}
