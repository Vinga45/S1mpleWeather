document.addEventListener("DOMContentLoaded", function () {
 
  /* ---------- decorative barcode ---------- */
  const barcode = document.getElementById('barcode');
  for (let i = 0; i < 70; i++) {
    const s = document.createElement('span');
    barcode.appendChild(s);
  }
 
  /* ---------- config ---------- */
  const API_KEY = '6b15728b04f54f78acf114140261508'.trim();
  let weatherState = null; // holds { day1: {...}, day2: {...} }
 
  /* ---------- icon set (inline SVG, line-art, matches navy/ink palette) ---------- */
  function iconFor(conditionText, size) {
    const t = (conditionText || '').toLowerCase();
    const stroke = 'var(--navy)';
    const common = `fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"`;
 
    // Rain / shower / drizzle / thunder
    if (/дощ|злив|мря|гроз|шторм/.test(t)) {
      return `<svg viewBox="0 0 64 64" ${common}>
        <path d="M20 30a11 11 0 0 1 21-4 9 9 0 0 1-2 18H20a9 9 0 0 1 0-18Z"/>
        <line x1="24" y1="46" x2="21" y2="54"/>
        <line x1="33" y1="46" x2="30" y2="54"/>
        <line x1="42" y1="46" x2="39" y2="54"/>
      </svg>`;
    }
    // Sunny / clear
    if (/сонячно|ясно|сонце/.test(t)) {
      return `<svg viewBox="0 0 64 64" ${common}>
        <circle cx="32" cy="32" r="10"/>
        <line x1="32" y1="8" x2="32" y2="15"/>
        <line x1="32" y1="49" x2="32" y2="56"/>
        <line x1="8" y1="32" x2="15" y2="32"/>
        <line x1="49" y1="32" x2="56" y2="32"/>
        <line x1="14" y1="14" x2="19" y2="19"/>
        <line x1="45" y1="45" x2="50" y2="50"/>
        <line x1="50" y1="14" x2="45" y2="19"/>
        <line x1="19" y1="45" x2="14" y2="50"/>
      </svg>`;
    }
    // Snow
    if (/сніг/.test(t)) {
      return `<svg viewBox="0 0 64 64" ${common}>
        <path d="M20 28a11 11 0 0 1 21-4 9 9 0 0 1-2 18H20a9 9 0 0 1 0-18Z"/>
        <line x1="24" y1="47" x2="24" y2="53"/>
        <line x1="32" y1="47" x2="32" y2="53"/>
        <line x1="40" y1="47" x2="40" y2="53"/>
        <line x1="21" y1="50" x2="27" y2="50"/>
        <line x1="29" y1="50" x2="35" y2="50"/>
        <line x1="37" y1="50" x2="43" y2="50"/>
      </svg>`;
    }
    // Partly cloudy
    if (/хмарно з прояснен|мінлив/.test(t)) {
      return `<svg viewBox="0 0 64 64" ${common}>
        <circle cx="22" cy="24" r="8"/>
        <path d="M26 40a10 10 0 0 1 19-3 8 8 0 0 1-2 16H26a8 8 0 0 1 0-13Z"/>
      </svg>`;
    }
    // Cloudy / overcast (default)
    return `<svg viewBox="0 0 64 64" ${common}>
      <path d="M18 34a12 12 0 0 1 23-4.5A10 10 0 0 1 44 49H20a10 10 0 0 1-2-15Z"/>
    </svg>`;
  }
 
  function rainIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="var(--tag-red)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3c3 4 6 7.2 6 10.5A6 6 0 0 1 6 13.5C6 10.2 9 7 12 3Z"/>
    </svg>`;
  }
 
  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
 
  function weekdayShort(iso, offsetLabel) {
    if (!iso) return offsetLabel;
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
  }
 
  /* ---------- background weather fx (sun rays / clouds / snow / rain) ---------- */
  function fxCategory(conditionText) {
    const t = (conditionText || '').toLowerCase();
    if (/дощ|злив|мря|гроз|шторм/.test(t)) return 'rain';
    if (/сніг/.test(t)) return 'snow';
    if (/сонячно|ясно|сонце/.test(t)) return 'sun';
    if (/хмарно з прояснен|мінлив/.test(t)) return 'partly';
    return 'cloudy';
  }
 
  function rand(min, max) { return Math.random() * (max - min) + min; }
 
  function buildSun(container) {
    const wrap = document.createElement('div');
    wrap.className = 'fx-sun-wrap';
    const core = document.createElement('div');
    core.className = 'fx-sun-core';
    const rays = document.createElement('div');
    rays.className = 'fx-sun-rays';
    for (let i = 0; i < 10; i++) {
      const ray = document.createElement('span');
      ray.style.transform = `rotate(${i * 36}deg)`;
      rays.appendChild(ray);
    }
    wrap.appendChild(rays);
    wrap.appendChild(core);
    container.appendChild(wrap);
  }
 
  function buildClouds(container, count) {
    for (let i = 0; i < count; i++) {
      const cloud = document.createElement('div');
      cloud.className = 'fx-cloud';
      const w = rand(100, 190);
      const h = w * 0.42;
      cloud.style.width = w + 'px';
      cloud.style.height = h + 'px';
      cloud.style.top = rand(4, 55) + '%';
      cloud.style.left = '-160px';
      cloud.style.opacity = rand(.45, .75).toFixed(2);
      const dur = rand(28, 50);
      cloud.style.animationDuration = dur + 's';
      cloud.style.animationDelay = (-rand(0, dur)) + 's';
      container.appendChild(cloud);
    }
  }
 
  function buildSnow(container, count) {
    for (let i = 0; i < count; i++) {
      const flake = document.createElement('div');
      flake.className = 'fx-snow';
      const size = rand(4, 10);
      flake.style.width = size + 'px';
      flake.style.height = size + 'px';
      flake.style.left = rand(0, 100) + '%';
      flake.style.opacity = rand(.55, 1).toFixed(2);
      const dur = rand(6, 12);
      flake.style.animationDuration = dur + 's';
      flake.style.animationDelay = (-rand(0, dur)) + 's';
      container.appendChild(flake);
    }
  }
 
  function buildRain(container, count) {
    for (let i = 0; i < count; i++) {
      const drop = document.createElement('div');
      drop.className = 'fx-rain';
      drop.style.height = rand(18, 34) + 'px';
      drop.style.left = rand(0, 100) + '%';
      drop.style.opacity = rand(.45, .85).toFixed(2);
      const dur = rand(.5, 1.1);
      drop.style.animationDuration = dur + 's';
      drop.style.animationDelay = (-rand(0, dur)) + 's';
      container.appendChild(drop);
    }
  }
 
  function renderWeatherFX(containerId, conditionText) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const cat = fxCategory(conditionText);
 
    if (cat === 'sun') {
      buildSun(container);
    } else if (cat === 'cloudy') {
      buildClouds(container, 5);
    } else if (cat === 'partly') {
      buildSun(container);
      buildClouds(container, 3);
    } else if (cat === 'snow') {
      buildSnow(container, 34);
    } else if (cat === 'rain') {
      buildRain(container, 36);
    }
  }
 
  /* ---------- render a day's card body ---------- */
  function renderDay(container, dayData) {
    container.innerHTML = `
      <div class="weather-row">
        <div class="weather-icon">${iconFor(dayData.condition)}</div>
        <p class="condition-text">${dayData.condition}</p>
      </div>
      <div class="stat-row">
        <div>
          <p class="stat-label">MAX °C</p>
          <p class="stat-value">${Math.round(dayData.temp_max)}<sup>°</sup></p>
        </div>
        <div style="text-align:right;">
          <p class="stat-label">MIN °C</p>
          <p class="stat-value">${Math.round(dayData.temp_min)}<sup>°</sup></p>
        </div>
      </div>
      <div class="rain-stamp">
        <div class="rain-icon">${rainIcon()}</div>
        <div class="rain-copy">
          <p class="rain-label">ШАНС ДОЩУ</p>
          <p class="rain-value">${dayData.chance_of_rain}%</p>
        </div>
      </div>
    `;
  }
 
  /* ---------- Ukrainian Cyrillic -> Latin transliteration ---------- */
  /* Follows the official Ukrainian transliteration system (KMU 2010),   */
  /* e.g. Київ -> Kyiv, Львів -> Lviv, Одеса -> Odesa, Харків -> Kharkiv */
  const UA_MAP = {
    'а':'a','б':'b','в':'v','г':'h','ґ':'g','д':'d','е':'e','ж':'zh','з':'z',
    'и':'y','і':'i','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh',
    'щ':'shch','ь':'','ю':'iu','я':'ia','є':'ie','ї':'i','й':'i',"'":''
  };
  const UA_MAP_START = { 'є':'ye','ї':'yi','й':'y','ю':'yu','я':'ya' };
 
  function transliterate(text) {
    return text
      .split(/(\s+)/)
      .map(word => {
        if (/^\s+$/.test(word) || word === '') return word;
        let out = '';
        for (let i = 0; i < word.length; i++) {
          const ch = word[i];
          const lower = ch.toLowerCase();
          const isStart = i === 0;
          let mapped = isStart && UA_MAP_START[lower] !== undefined
            ? UA_MAP_START[lower]
            : (UA_MAP[lower] !== undefined ? UA_MAP[lower] : lower);
          if (ch === ch.toUpperCase() && ch !== ch.toLowerCase() && mapped) {
            mapped = mapped.charAt(0).toUpperCase() + mapped.slice(1);
          }
          out += mapped;
        }
        return out;
      })
      .join('');
  }
 
  function hasCyrillic(str) {
    return /[а-яіїєґ]/i.test(str);
  }
 
  /* ---------- API call ---------- */
  async function fetchForecast(query) {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(query)}&days=2&lang=uk`;
    const response = await fetch(url);
    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      const msg = errBody?.error?.message || 'Місто не знайдено';
      const err = new Error(msg);
      err.status = response.status;
      throw err;
    }
    return response.json();
  }
 
  async function getWeatherArray(cityNameRaw) {
    const cityName = cityNameRaw.trim();
    let data;
    try {
      data = await fetchForecast(cityName);
    } catch (firstErr) {
      // If the input has Cyrillic letters, retry with a transliterated
      // version, since WeatherAPI's city database is Latin-script only.
      if (hasCyrillic(cityName)) {
        const translit = transliterate(cityName);
        try {
          data = await fetchForecast(translit);
        } catch (secondErr) {
          throw new Error(`Місто не знайдено (спробували «${cityName}» і «${translit}»)`);
        }
      } else {
        throw firstErr;
      }
    }
 
    const days = data.forecast.forecastday;
 
    return {
      city: cityName,
      apiCity: data.location.name,
      day1: {
        date: days[0].date,
        temp_min: days[0].day.mintemp_c,
        temp_max: days[0].day.maxtemp_c,
        condition: days[0].day.condition.text,
        chance_of_rain: days[0].day.daily_chance_of_rain
      },
      day2: {
        date: days[1].date,
        temp_min: days[1].day.mintemp_c,
        temp_max: days[1].day.maxtemp_c,
        condition: days[1].day.condition.text,
        chance_of_rain: days[1].day.daily_chance_of_rain
      }
    };
  }
 
  /* ---------- navigation ---------- */
  const pages = {
    search: document.getElementById('page-search'),
    today: document.getElementById('page-today'),
    tomorrow: document.getElementById('page-tomorrow')
  };
 
  function showPage(id) {
    Object.values(pages).forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }
 
  function syncTabs(activeId) {
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.target === activeId);
    });
  }
 
  /* ---------- safe DOM helper: never throws if element is missing ---------- */
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
  function setHTML(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
  }
 
  function populatePages() {
    if (!weatherState) return;
 
    setText('dateLabelToday', formatDate(weatherState.day1.date));
    setText('dateLabelTomorrow', formatDate(weatherState.day2.date));
    setText('cityLabelToday', weatherState.city);
    setText('cityLabelTomorrow', weatherState.city);
 
    const bodyToday = document.getElementById('bodyToday');
    const bodyTomorrow = document.getElementById('bodyTomorrow');
    if (bodyToday) renderDay(bodyToday, weatherState.day1);
    if (bodyTomorrow) renderDay(bodyTomorrow, weatherState.day2);
 
    renderWeatherFX('fxToday', weatherState.day1.condition);
    renderWeatherFX('fxTomorrow', weatherState.day2.condition);
 
    const d1 = weekdayShort(weatherState.day1.date, 'СЬОГОДНІ');
    const d2 = weekdayShort(weatherState.day2.date, 'ЗАВТРА');
 
    setHTML('tabToday', `СЬОГОДНІ<span class="tab-date">${d1}</span>`);
    setHTML('tabToday2', `СЬОГОДНІ<span class="tab-date">${d1}</span>`);
    setHTML('tabTomorrow', `ЗАВТРА<span class="tab-date">${d2}</span>`);
    setHTML('tabTomorrow2', `ЗАВТРА<span class="tab-date">${d2}</span>`);
  }
 
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      showPage(target);
      syncTabs(target);
    });
  });
 
  document.getElementById('backLink1').addEventListener('click', () => showPage('page-search'));
  document.getElementById('backLink2').addEventListener('click', () => showPage('page-search'));
 
  /* ---------- search flow ---------- */
  const goBtn = document.getElementById('goBtn');
  const cityField = document.getElementById('cityField');
  const statusLine = document.getElementById('statusLine');
 
  async function runSearch() {
    const city = cityField.value.trim();
    if (!city) {
      statusLine.textContent = 'Введіть назву міста';
      statusLine.classList.add('error');
      return;
    }
    statusLine.classList.remove('error');
    statusLine.textContent = 'Завантаження прогнозу…';
    goBtn.disabled = true;
 
    try {
      weatherState = await getWeatherArray(city);
      populatePages();
      statusLine.textContent = '';
      goBtn.disabled = false;
      showPage('page-today');
      syncTabs('page-today');
    } catch (err) {
      statusLine.textContent = err.message || 'Не вдалося отримати дані';
      statusLine.classList.add('error');
      goBtn.disabled = false;
    }
  }
 
  goBtn.addEventListener('click', runSearch);
  cityField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSearch();
  });
 
  populatePages(); // no-op until first fetch
});