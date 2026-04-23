(function () {
  const data = window.siteData || {};
  const supabase = window.supabase.createClient(
  "https://itfqgvpawnvhuvhplgtv.supabase.co",
  "sb_publishable_X9p5nBBfiuYHfv1Aea-RGA_Wy8JApGn"
);
  const page = document.body.dataset.page || '';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const STORAGE_KEY = `${String((data.league && data.league.shortName) || 'league').toLowerCase()}-game-logs-v1`;
  const COUNT_KEYS = ['pts', 'reb', 'ast', 'stl', 'blk'];
  const SHOOTING_KEYS = ['fgm', 'fga', 'tpm', 'tpa'];
  const ALL_LOG_KEYS = [...COUNT_KEYS, ...SHOOTING_KEYS];

  const statLabels = {
    pts: 'PPG',
    reb: 'RPG',
    ast: 'APG',
    stl: 'SPG',
    blk: 'BPG',
    fg: 'FG%',
    three: '3PT%',
    games: 'Games'
  };

  const pageTitles = {
    home: data.league && data.league.name,
    about: `About | ${data.league && data.league.name}`,
    players: `Meet the Players | ${data.league && data.league.name}`,
    stats: `Stats | ${data.league && data.league.name}`,
    videos: `Videos | ${data.league && data.league.name}`,
    'game-logs': `Game Logs | ${data.league && data.league.name}`
  };

  let runtimeGameLogs = null;
  let leagueState = null;

  const format = (value, digits = 1) => (Number.isFinite(value) ? value.toFixed(digits) : String(value || 0));
  const safeNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };
  const safeNullableNumber = (value) => {
    if (value === '' || value === null || typeof value === 'undefined') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };
  const round = (value, digits = 4) => {
    const factor = 10 ** digits;
    return Math.round((safeNumber(value) + Number.EPSILON) * factor) / factor;
  };
  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const uid = () => `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const todayString = () => new Date().toISOString().slice(0, 10);

  const getInitials = (name = '') =>
    String(name)
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const slugify = (value = '') =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const getTeamClass = (team = '') => `team-${slugify(team || 'no-team')}`;

  const formatDate = (dateString) => {
    if (!dateString) return 'Undated';
    const date = new Date(`${dateString}T12:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const storageAvailable = () => {
    try {
      const testKey = '__cojba_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  };

  const HAS_STORAGE = storageAvailable();

  const createDownload = (filename, text, mimeType = 'application/json') => {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const readFileText = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Unable to read file.'));
      reader.readAsText(file);
    });

  const lineCountsAsPlayed = (line) => Boolean(line.played) || ALL_LOG_KEYS.some((key) => safeNumber(line[key]) > 0);

  const emptyTotals = () => ({
    pts: 0,
    reb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0
  });

  const normalizePlayerLine = (line = {}) => ({
    playerId: String(line.playerId || ''),
    played: Boolean(line.played),
    pts: safeNumber(line.pts),
    reb: safeNumber(line.reb),
    ast: safeNumber(line.ast),
    stl: safeNumber(line.stl),
    blk: safeNumber(line.blk),
    fgm: safeNumber(line.fgm),
    fga: safeNumber(line.fga),
    tpm: safeNumber(line.tpm),
    tpa: safeNumber(line.tpa)
  });

  const normalizeGameLog = (log = {}) => ({
    id: String(log.id || uid()),
    date: String(log.date || todayString()),
    title: String(log.title || 'Untitled Game'),
    format: String(log.format || ''),
    location: String(log.location || ''),
    teamA: String(log.teamA || ''),
    teamB: String(log.teamB || ''),
    scoreA: safeNullableNumber(log.scoreA),
    scoreB: safeNullableNumber(log.scoreB),
    notes: String(log.notes || ''),
    playerStats: Array.isArray(log.playerStats)
      ? log.playerStats.map(normalizePlayerLine).filter((line) => line.playerId)
      : []
  });

  const sortLogsDesc = (logs) =>
    [...logs].sort((a, b) => {
      const aTime = new Date(`${a.date || '1970-01-01'}T12:00:00`).getTime() || 0;
      const bTime = new Date(`${b.date || '1970-01-01'}T12:00:00`).getTime() || 0;
      if (bTime !== aTime) return bTime - aTime;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });

  const normalizeGameLogs = (logs) => (Array.isArray(logs) ? sortLogsDesc(logs.map(normalizeGameLog)) : []);

  const loadGameLogs = async () => {
  try {
    const { data: logs } = await supabase.from("game_logs").select("*");
    const { data: stats } = await supabase.from("player_stats").select("*");

    const grouped = (logs || []).map(log => ({
      id: log.id,
      date: log.date,
      title: log.title,
      format: log.format,
      location: log.location,
      teamA: log.team_a,
      teamB: log.team_b,
      scoreA: log.score_a,
      scoreB: log.score_b,
      notes: log.notes,
      playerStats: (stats || [])
        .filter(s => s.game_log_id === log.id)
        .map(s => ({
          playerId: s.player_id,
          played: s.played,
          pts: safeNumber(s.pts),
          reb: safeNumber(s.reb),
          ast: safeNumber(s.ast),
          stl: safeNumber(s.stl),
          blk: safeNumber(s.blk),
          fgm: safeNumber(s.fgm),
          fga: safeNumber(s.fga),
          tpm: safeNumber(s.tpm),
          tpa: safeNumber(s.tpa)
        }))
    }));

    runtimeGameLogs = normalizeGameLogs(grouped);
    return runtimeGameLogs;

  } catch (err) {
    console.warn("Supabase load failed:", err);
  }

  return [];
};

  const persistGameLogs = (logs) => {
  runtimeGameLogs = normalizeGameLogs(logs);
  return runtimeGameLogs;
};

  const getBaseSnapshot = (player) => {
    const stats = player.stats || {};
    const games = safeNumber(stats.games);
    const totals = emptyTotals();

    COUNT_KEYS.forEach((key) => {
      totals[key] = round(safeNumber(stats[key]) * games);
    });

    const shootingSource =
      (player.shootingTotals && typeof player.shootingTotals === 'object' && player.shootingTotals) ||
      (stats.shootingTotals && typeof stats.shootingTotals === 'object' && stats.shootingTotals) ||
      stats;

    const fgm = safeNullableNumber(shootingSource.fgm);
    const fga = safeNullableNumber(shootingSource.fga);
    const tpm = safeNullableNumber(shootingSource.tpm);
    const tpa = safeNullableNumber(shootingSource.tpa);

    return {
      games,
      totals,
      fgPct: safeNumber(stats.fg),
      threePct: safeNumber(stats.three),
      exactFg: fgm !== null && fga !== null,
      exactThree: tpm !== null && tpa !== null,
      fgm: safeNumber(fgm),
      fga: safeNumber(fga),
      tpm: safeNumber(tpm),
      tpa: safeNumber(tpa)
    };
  };

  const buildLogAggregates = (players, logs) => {
    const aggregates = new Map(
      players.map((player) => [
        player.id,
        {
          games: 0,
          totals: emptyTotals(),
          appearances: 0
        }
      ])
    );

    logs.forEach((log) => {
      log.playerStats.forEach((line) => {
        const aggregate = aggregates.get(line.playerId);
        if (!aggregate) return;

        if (lineCountsAsPlayed(line)) {
          aggregate.games += 1;
          aggregate.appearances += 1;
        }

        COUNT_KEYS.forEach((key) => {
          aggregate.totals[key] += safeNumber(line[key]);
        });

        aggregate.totals.fgm += safeNumber(line.fgm);
        aggregate.totals.fga += safeNumber(line.fga);
        aggregate.totals.tpm += safeNumber(line.tpm);
        aggregate.totals.tpa += safeNumber(line.tpa);
      });
    });

    return aggregates;
  };

  const combinePercentages = ({ baseGames, basePct, baseMade, baseAtt, baseExact, logGames, logMade, logAtt }) => {
    if (baseExact || logAtt > 0) {
      const totalMade = (baseExact ? baseMade : 0) + logMade;
      const totalAtt = (baseExact ? baseAtt : 0) + logAtt;
      if (totalAtt > 0) return round((totalMade / totalAtt) * 100, 1);
    }

    if (baseGames > 0 && logGames > 0 && logAtt > 0) {
      const logPct = (logMade / logAtt) * 100;
      return round(((basePct * baseGames) + (logPct * logGames)) / (baseGames + logGames), 1);
    }

    if (baseGames > 0) return round(basePct, 1);
    if (logAtt > 0) return round((logMade / logAtt) * 100, 1);
    return 0;
  };

  const computePlayerStats = (player, logAggregate) => {
    const base = getBaseSnapshot(player);
    const logTotals = (logAggregate && logAggregate.totals) || emptyTotals();
    const logGames = (logAggregate && logAggregate.games) || 0;
    const games = base.games + logGames;

    const totals = {
      games,
      pts: round(base.totals.pts + logTotals.pts),
      reb: round(base.totals.reb + logTotals.reb),
      ast: round(base.totals.ast + logTotals.ast),
      stl: round(base.totals.stl + logTotals.stl),
      blk: round(base.totals.blk + logTotals.blk),
      fgm: round((base.exactFg ? base.fgm : 0) + logTotals.fgm),
      fga: round((base.exactFg ? base.fga : 0) + logTotals.fga),
      tpm: round((base.exactThree ? base.tpm : 0) + logTotals.tpm),
      tpa: round((base.exactThree ? base.tpa : 0) + logTotals.tpa)
    };

    const stats = {
      games,
      pts: games ? round(totals.pts / games, 1) : 0,
      reb: games ? round(totals.reb / games, 1) : 0,
      ast: games ? round(totals.ast / games, 1) : 0,
      stl: games ? round(totals.stl / games, 1) : 0,
      blk: games ? round(totals.blk / games, 1) : 0,
      fgm: games ? round(totals.fgm / games, 1) : 0,
      fga: games ? round(totals.fga / games, 1) : 0,
      tpm: games ? round(totals.tpm / games, 1) : 0,
      tpa: games ? round(totals.tpa / games, 1) : 0,
      fg: combinePercentages({
        baseGames: base.games,
        basePct: base.fgPct,
        baseMade: base.fgm,
        baseAtt: base.fga,
        baseExact: base.exactFg,
        logGames,
        logMade: logTotals.fgm,
        logAtt: logTotals.fga
      }),
      three: combinePercentages({
        baseGames: base.games,
        basePct: base.threePct,
        baseMade: base.tpm,
        baseAtt: base.tpa,
        baseExact: base.exactThree,
        logGames,
        logMade: logTotals.tpm,
        logAtt: logTotals.tpa
      })
    };

    return {
      ...player,
      stats,
      totals,
      baseGames: base.games,
      logGames,
      hasLoggedGames: logGames > 0
    };
  };

  const buildLeagueState = () => {
    const players = Array.isArray(data.players) ? data.players : [];
    const gameLogs = runtimeGameLogs || [];
    const logAggregates = buildLogAggregates(players, gameLogs);
    const computedPlayers = players.map((player) => computePlayerStats(player, logAggregates.get(player.id)));
    const playersById = new Map(computedPlayers.map((player) => [player.id, player]));

    const totalAppearances = gameLogs.reduce(
      (sum, log) => sum + log.playerStats.filter((line) => lineCountsAsPlayed(line)).length,
      0
    );

    return {
      gameLogs,
      players: computedPlayers,
      playersById,
      storageAvailable: HAS_STORAGE,
      totalAppearances,
      usesLoggedStats: gameLogs.length > 0,
      statSourceMessage: gameLogs.length
        ? `Season stats are currently being calculated from ${gameLogs.length} saved game log${gameLogs.length === 1 ? '' : 's'}.`
        : 'No saved game logs yet. Current season stats are coming from assets/data.js.'
    };
  };

  const uniqueValues = (items = []) => [...new Set(items.filter(Boolean))];

  const hexToRgbString = (value = '') => {
    const hex = String(value).trim().replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return '';
    const normalized = hex.toLowerCase();
    const red = parseInt(normalized.slice(0, 2), 16);
    const green = parseInt(normalized.slice(2, 4), 16);
    const blue = parseInt(normalized.slice(4, 6), 16);
    return `${red}, ${green}, ${blue}`;
  };

  const getPlayerImageCandidates = (player = {}) => {
    const explicit = player.image && String(player.image).trim();
    const slug = slugify(player.id || player.name || 'player');

    return uniqueValues([
      explicit,
      `images/players/${slug}.jpeg`,
      `images/players/${slug}.jpg`,
      `images/players/${slug}.png`,
      `images/players/${slug}.webp`,
      `assets/images/${slug}.jpeg`,
      `assets/images/${slug}.jpg`,
      `assets/images/${slug}.png`,
      `assets/images/${slug}.webp`
    ]);
  };

  const getPhotoClass = (size = 'card') =>
    size === 'large'
      ? 'player-photo player-photo--large'
      : size === 'small'
        ? 'player-photo player-photo--small'
        : 'player-photo';

  const getAvatarClass = (size = 'card') =>
    size === 'large'
      ? 'avatar-badge large'
      : size === 'small'
        ? 'avatar-badge tiny'
        : 'avatar-badge';

  const getPlayerMediaMarkup = (player, size = 'card') => {
    const sources = getPlayerImageCandidates(player);

    if (sources.length) {
      return `
        <div class="player-media">
          <img
            src="${escapeHtml(sources[0])}"
            alt="${escapeHtml(player.name)}"
            class="${getPhotoClass(size)}"
            loading="lazy"
            data-fallbacks="${escapeHtml(sources.slice(1).join('|'))}"
            data-initials="${escapeHtml(getInitials(player.name))}"
          />
        </div>
      `;
    }

    return `<div class="${getAvatarClass(size)}" aria-hidden="true">${getInitials(player.name)}</div>`;
  };

  const showImageFallbackBadge = (img) => {
    const badge = document.createElement('div');
    badge.className = getAvatarClass(
      img.classList.contains('player-photo--large')
        ? 'large'
        : img.classList.contains('player-photo--small')
          ? 'small'
          : 'card'
    );
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = img.dataset.initials || getInitials(img.alt || '');
    img.replaceWith(badge);
  };

  const hydratePlayerMedia = (root = document) => {
    $$('img[data-fallbacks]', root).forEach((img) => {
      if (img.dataset.mediaBound === 'true') return;
      img.dataset.mediaBound = 'true';

      img.addEventListener('error', () => {
        const fallbacks = (img.dataset.fallbacks || '').split('|').filter(Boolean);
        const next = fallbacks.shift();
        img.dataset.fallbacks = fallbacks.join('|');

        if (next) {
          img.setAttribute('src', next);
        } else {
          showImageFallbackBadge(img);
        }
      });

      if (img.complete && img.naturalWidth === 0) {
        img.dispatchEvent(new Event('error'));
      }
    });
  };

  const applyLeagueTheme = () => {
    const root = document.documentElement;
    const colors = (data.league && data.league.colors) || {};
    if (colors.accent) {
      root.style.setProperty('--accent', colors.accent);
      const accentRgb = hexToRgbString(colors.accent);
      if (accentRgb) root.style.setProperty('--accent-rgb', accentRgb);
    }
    if (colors.accent2) {
      root.style.setProperty('--accent-2', colors.accent2);
      const accent2Rgb = hexToRgbString(colors.accent2);
      if (accent2Rgb) root.style.setProperty('--accent-2-rgb', accent2Rgb);
    }
    if (colors.success) root.style.setProperty('--success', colors.success);
  };

  const ensureGameLogsNavLink = () => {
    $$('.nav').forEach((nav) => {
      if (nav.querySelector('a[href="game-logs.html"]')) return;

      const link = document.createElement('a');
      link.href = 'game-logs.html';
      link.textContent = 'Game Logs';
      if (page === 'game-logs') link.classList.add('active');

      const statsLink = nav.querySelector('a[href="stats.html"]');
      const videosLink = nav.querySelector('a[href="videos.html"]');

      if (videosLink) {
        nav.insertBefore(link, videosLink);
      } else if (statsLink && statsLink.nextSibling) {
        nav.insertBefore(link, statsLink.nextSibling);
      } else {
        nav.appendChild(link);
      }
    });
  };

  const setGlobalText = () => {
    $$('[data-league-name]').forEach((el) => {
      el.textContent = (data.league && data.league.name) || '';
    });

    $$('[data-league-short]').forEach((el) => {
      el.textContent = (data.league && data.league.shortName) || '';
    });

    $$('[data-league-mark]').forEach((el) => {
      el.textContent = (data.league && (data.league.brandMark || data.league.shortName)) || '';
    });

    $$('[data-current-year]').forEach((el) => {
      el.textContent = new Date().getFullYear();
    });

    $$('[data-stats-source-note]').forEach((el) => {
      el.textContent = leagueState.statSourceMessage;
    });

    $$('[data-storage-note]').forEach((el) => {
      el.textContent = leagueState.storageAvailable
        ? 'Game logs save in this browser automatically. Export a backup after big edits.'
        : 'Browser storage is blocked here. You can still use game logs this session, but export them before closing the page.';
    });

    if (pageTitles[page]) {
      document.title = pageTitles[page];
    }
  };

  const renderSeasonNotes = () => {
    const container = $('#season-notes');
    if (!container || !Array.isArray(data.seasonNotes)) return;
    container.innerHTML = data.seasonNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join('');
  };

  const getLeaders = () => {
    const categories = ['pts', 'reb', 'ast', 'stl', 'blk', 'fg', 'three'];
    return categories.map((key) => {
      const leader = [...leagueState.players].sort((a, b) => b.stats[key] - a.stats[key])[0];
      return { key, label: statLabels[key], leader };
    });
  };

  const buildPlayerCard = (player) => `
    <article
      class="player-card ${getTeamClass(player.team)}"
      data-player-id="${escapeHtml(player.id)}"
      data-team="${escapeHtml(player.team || '')}"
      tabindex="0"
      role="button"
      aria-label="Open ${escapeHtml(player.name)} profile"
    >
      <div class="player-card__top">
        <div class="player-card__media">
          ${getPlayerMediaMarkup(player, 'card')}
        </div>

        <div class="player-card__meta">
          <span class="eyebrow">#${escapeHtml(player.number)} • ${escapeHtml(player.position)}</span>
          <h3>${escapeHtml(player.name)}</h3>
          <p class="nickname">&quot;${escapeHtml(player.nickname)}&quot;</p>
        </div>
      </div>

      <div class="player-card__details">
        <span>${escapeHtml(player.team || 'Independent')}</span>
        <span>${escapeHtml(player.archetype || '')}</span>
      </div>

      <div class="stat-strip">
        <div><strong>${format(player.stats.pts)}</strong><span>PPG</span></div>
        <div><strong>${format(player.stats.reb)}</strong><span>RPG</span></div>
        <div><strong>${format(player.stats.ast)}</strong><span>APG</span></div>
      </div>
    </article>
  `;

  const renderHome = () => {
    const heroTitle = $('#hero-title');
    const heroBlurb = $('#hero-blurb');
    const quickStats = $('#quick-stats');
    const playerPreview = $('#player-preview');
    const videoPreview = $('#video-preview');

    if (heroTitle) heroTitle.textContent = (data.league && data.league.name) || '';
    if (heroBlurb) heroBlurb.textContent = (data.league && data.league.heroBlurb) || '';

    if (quickStats) {
      const leaders = getLeaders().slice(0, 3);
      quickStats.innerHTML = leaders
        .map(
          ({ key, label, leader }) => `
            <article class="mini-stat-card">
              <span class="eyebrow">League leader</span>
              <h3>${label}</h3>
              <p>${escapeHtml(leader.name)}</p>
              <strong>${key === 'fg' || key === 'three' ? `${format(leader.stats[key])}%` : format(leader.stats[key])}</strong>
            </article>
          `
        )
        .join('');
    }

    if (playerPreview) {
      const featured = [...leagueState.players].sort((a, b) => b.stats.pts - a.stats.pts).slice(0, 4);
      playerPreview.innerHTML = featured.map(buildPlayerCard).join('');
      wirePlayerModal(playerPreview);
      hydratePlayerMedia(playerPreview);
    }

    if (videoPreview) {
      const items = Array.isArray(data.videos) ? data.videos.slice(0, 3) : [];
      videoPreview.innerHTML = items
        .map(
          (video) => `
            <article class="video-card compact">
              <div class="video-card__type">${escapeHtml(video.type)}</div>
              <h3>${escapeHtml(video.title)}</h3>
              <p>${escapeHtml(video.description)}</p>
              <div class="video-card__footer">
                <span>${formatDate(video.date)}</span>
                <span>${video.provider === 'vimeo' ? 'Vimeo' : 'YouTube'}</span>
              </div>
            </article>
          `
        )
        .join('');
    }
  };

  const renderAbout = () => {
    const description = $('#about-description');
    const formatList = $('#format-list');
    const valuesList = $('#values-list');
    const rulesList = $('#rules-list');
    const details = $('#league-details');

    if (description) description.textContent = (data.league && data.league.description) || '';
    if (formatList && Array.isArray(data.league && data.league.format)) {
      formatList.innerHTML = data.league.format.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    }
    if (valuesList && Array.isArray(data.league && data.league.values)) {
      valuesList.innerHTML = data.league.values.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    }
    if (rulesList && Array.isArray(data.league && data.league.rules)) {
      rulesList.innerHTML = data.league.rules.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    }

    if (details) {
      details.innerHTML = `
        <div class="detail-row"><span>Season</span><strong>${escapeHtml((data.league && data.league.season) || '')}</strong></div>
        <div class="detail-row"><span>Founded</span><strong>${escapeHtml((data.league && data.league.founded) || '')}</strong></div>
        <div class="detail-row"><span>Roster</span><strong>${leagueState.players.length} listed players</strong></div>
        <div class="detail-row"><span>Recorded games</span><strong>${leagueState.gameLogs.length}</strong></div>
        <div class="detail-row"><span>Location</span><strong>${escapeHtml((data.league && data.league.location) || '')}</strong></div>
        <div class="detail-row"><span>Commissioner</span><strong>${escapeHtml((data.league && data.league.commissioner) || '')}</strong></div>
        <div class="detail-row"><span>Motto</span><strong>${escapeHtml((data.league && data.league.motto) || '')}</strong></div>
      `;
    }
  };

  const playerModalState = {
    modal: null,
    content: null
  };

  const closePlayerModal = () => {
    if (!playerModalState.modal) return;
    playerModalState.modal.classList.add('hidden');
    document.body.classList.remove('no-scroll');
  };

  const ensurePlayerModal = () => {
    if (playerModalState.modal) return playerModalState;

    const modal = document.createElement('div');
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal__overlay" data-close-modal></div>
      <div class="modal__panel" role="dialog" aria-modal="true" aria-label="Player profile">
        <button class="modal__close" type="button" aria-label="Close player profile" data-close-modal>×</button>
        <div class="modal__content"></div>
      </div>
    `;

    document.body.appendChild(modal);
    playerModalState.modal = modal;
    playerModalState.content = $('.modal__content', modal);

    $$('[data-close-modal]', modal).forEach((button) => {
      button.addEventListener('click', closePlayerModal);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closePlayerModal();
    });

    return playerModalState;
  };

  const openPlayerModal = (playerId) => {
    const player = leagueState.playersById.get(playerId);
    if (!player) return;

    const modalState = ensurePlayerModal();
    modalState.content.innerHTML = `
      <div class="player-modal ${getTeamClass(player.team)}">
        <div class="player-modal__head">
          <div class="player-modal__media">
            ${getPlayerMediaMarkup(player, 'large')}
          </div>
          <div>
            <span class="eyebrow">#${escapeHtml(player.number)} • ${escapeHtml(player.position)} • ${escapeHtml(player.team || 'Independent')}</span>
            <h2>${escapeHtml(player.name)}</h2>
            <p class="nickname">&quot;${escapeHtml(player.nickname)}&quot;</p>
          </div>
        </div>

        <p class="player-modal__bio">${escapeHtml(player.bio)}</p>

        <div class="player-modal__grid">
          <div class="info-card">
            <h3>Profile</h3>
            <ul class="clean-list">
              <li><span>Height</span><strong>${escapeHtml(player.height || '')}</strong></li>
              <li><span>Hometown</span><strong>${escapeHtml(player.hometown || '')}</strong></li>
              <li><span>Archetype</span><strong>${escapeHtml(player.archetype || '')}</strong></li>
              <li><span>Favorite move</span><strong>${escapeHtml(player.favoriteMove || '')}</strong></li>
            </ul>
          </div>

          <div class="info-card">
            <h3>Strengths</h3>
            <div class="pill-row">
              ${(player.strengths || []).map((strength) => `<span class="pill">${escapeHtml(strength)}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="info-card">
          <h3>Per-game averages</h3>
          <div class="stat-grid compact">
            <div><strong>${format(player.stats.games, 0)}</strong><span>Games</span></div>
            <div><strong>${format(player.stats.pts)}</strong><span>PPG</span></div>
            <div><strong>${format(player.stats.reb)}</strong><span>RPG</span></div>
            <div><strong>${format(player.stats.ast)}</strong><span>APG</span></div>
            <div><strong>${format(player.stats.stl)}</strong><span>SPG</span></div>
            <div><strong>${format(player.stats.blk)}</strong><span>BPG</span></div>
            <div><strong>${format(player.stats.fgm)}</strong><span>FGM</span></div>
            <div><strong>${format(player.stats.fga)}</strong><span>FGA</span></div>
            <div><strong>${format(player.stats.tpm)}</strong><span>3PM</span></div>
            <div><strong>${format(player.stats.tpa)}</strong><span>3PA</span></div>
            <div><strong>${format(player.stats.fg)}%</strong><span>FG%</span></div>
            <div><strong>${format(player.stats.three)}%</strong><span>3PT%</span></div>
          </div>
        </div>

        <div class="info-card">
          <h3>Season totals</h3>
          <div class="stat-grid compact">
            <div><strong>${format(player.totals.games, 0)}</strong><span>Games</span></div>
            <div><strong>${format(player.totals.pts, 0)}</strong><span>PTS</span></div>
            <div><strong>${format(player.totals.reb, 0)}</strong><span>REB</span></div>
            <div><strong>${format(player.totals.ast, 0)}</strong><span>AST</span></div>
            <div><strong>${format(player.totals.stl, 0)}</strong><span>STL</span></div>
            <div><strong>${format(player.totals.blk, 0)}</strong><span>BLK</span></div>
            <div><strong>${format(player.totals.fgm, 0)}</strong><span>FGM</span></div>
            <div><strong>${format(player.totals.fga, 0)}</strong><span>FGA</span></div>
            <div><strong>${format(player.totals.tpm, 0)}</strong><span>3PM</span></div>
            <div><strong>${format(player.totals.tpa, 0)}</strong><span>3PA</span></div>
            <div><strong>${format(player.stats.fg)}%</strong><span>FG%</span></div>
            <div><strong>${format(player.stats.three)}%</strong><span>3PT%</span></div>
          </div>
        </div>
      </div>
    `;

    hydratePlayerMedia(modalState.content);

    modalState.modal.classList.remove('hidden');
    document.body.classList.add('no-scroll');
  };

  const wirePlayerModal = (root = document) => {
    $$('.player-card', root).forEach((card) => {
      const open = () => openPlayerModal(card.dataset.playerId);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });
    });
  };

  const normalizePosition = (position = '') => {
    const pos = String(position).toUpperCase().trim();

    if (pos.includes('PG') || pos.includes('SG') || pos === 'G' || pos.includes('GUARD')) {
      return 'GUARDS';
    }

    if (pos.includes('PF') || pos === 'C' || pos.includes('CENTER') || pos.includes('BIG') || pos.includes('POWER')) {
      return 'BIGS';
    }

    if (pos.includes('SF') || pos.includes('WING') || pos.includes('SMALL FORWARD') || pos === 'F' || pos === 'FORWARD') {
      return 'WINGS';
    }

    return 'BIGS';
  };

  const renderPlayers = () => {
    const grid = $('#players-grid');
    const search = $('#player-search');
    const filters = $$('.filter-button[data-filter]');
    if (!grid) return;

    let activeFilter = 'ALL';
    let query = '';

    const render = () => {
      const filtered = leagueState.players.filter((player) => {
        const matchesQuery = [player.name, player.nickname, player.team, player.position]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesFilter = activeFilter === 'ALL' || normalizePosition(player.position) === activeFilter;
        return matchesQuery && matchesFilter;
      });

      if (filtered.length) {
        grid.innerHTML = filtered.map(buildPlayerCard).join('');
        wirePlayerModal(grid);
        hydratePlayerMedia(grid);
      } else {
        grid.innerHTML = '<div class="empty-state">No players matched that search. Try a different name, role, or position.</div>';
      }

      const count = $('#player-count');
      if (count) count.textContent = `${filtered.length} player${filtered.length === 1 ? '' : 's'}`;
    };

    render();

    if (search) {
      search.addEventListener('input', (event) => {
        query = event.target.value;
        render();
      });
    }

    filters.forEach((button) => {
      button.addEventListener('click', () => {
        activeFilter = button.dataset.filter;
        filters.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
        render();
      });
    });
  };

  const renderLeaderBars = () => {
    const container = $('#leaderboards');
    if (!container) return;

    const categories = [
      { label: 'Top Scorers', suffix: 'PPG', digits: 1, getValue: (player) => player.stats.pts },
      { label: 'Top Rebounders', suffix: 'RPG', digits: 1, getValue: (player) => player.stats.reb },
      { label: 'Top Playmakers', suffix: 'APG', digits: 1, getValue: (player) => player.stats.ast },
      { label: 'Best FG%', suffix: 'FG%', digits: 1, getValue: (player) => player.stats.fg },
      { label: 'Best 3PT%', suffix: '3PT%', digits: 1, getValue: (player) => player.stats.three },
      { label: 'Total Points', suffix: 'PTS', digits: 0, getValue: (player) => player.totals.pts }
    ];

    container.innerHTML = categories
      .map(({ label, suffix, digits, getValue }) => {
        const sorted = [...leagueState.players].sort((a, b) => getValue(b) - getValue(a)).slice(0, 5);
        const max = sorted[0] ? getValue(sorted[0]) || 1 : 1;

        return `
          <section class="leader-card">
            <div class="section-head small">
              <span class="eyebrow">Leaderboard</span>
              <h3>${label}</h3>
            </div>
            <div class="leader-bars">
              ${sorted
                .map((player) => {
                  const value = getValue(player);
                  return `
                    <div class="leader-row">
                      <div class="leader-row__text">
                        <span>${escapeHtml(player.name)}</span>
                        <strong>${format(value, digits)} ${suffix}</strong>
                      </div>
                      <div class="leader-bar-track">
                        <div class="leader-bar-fill" style="width: ${max ? (value / max) * 100 : 0}%"></div>
                      </div>
                    </div>
                  `;
                })
                .join('')}
            </div>
          </section>
        `;
      })
      .join('');
  };

  const getSortablePlayerValue = (player, path = '') => {
    const [scope, key] = String(path).split('.');

    if (scope === 'totals') return safeNumber(player.totals && player.totals[key]);
    if (scope === 'stats') return safeNumber(player.stats && player.stats[key]);

    return safeNumber(player[path]);
  };

  const renderPlayerStatsTable = ({ table, body, defaultSort, rowTemplate }) => {
    if (!table || !body) return;

    let sortKey = defaultSort;
    let sortDirection = 'desc';

    const render = () => {
      const sortedPlayers = [...leagueState.players].sort((a, b) => {
        const delta = getSortablePlayerValue(b, sortKey) - getSortablePlayerValue(a, sortKey);
        if (delta !== 0) return sortDirection === 'desc' ? delta : -delta;
        return a.name.localeCompare(b.name);
      });

      body.innerHTML = sortedPlayers.map((player) => rowTemplate(player)).join('');
      hydratePlayerMedia(body);

      $$('button[data-sort]', table).forEach((button) => {
        button.classList.toggle('active', button.dataset.sort === sortKey);
      });
    };

    $$('button[data-sort]', table).forEach((button) => {
      if (button.dataset.sortBound === 'true') return;
      button.dataset.sortBound = 'true';
      button.addEventListener('click', () => {
        const nextKey = button.dataset.sort;
        if (sortKey === nextKey) {
          sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
        } else {
          sortKey = nextKey;
          sortDirection = 'desc';
        }
        render();
      });
    });

    render();
  };

  const renderStatsTable = () => {
    const averagesTable = $('#stats-averages-table');
    const averagesBody = $('#stats-averages-table-body');
    const totalsTable = $('#stats-totals-table');
    const totalsBody = $('#stats-totals-table-body');

    renderPlayerStatsTable({
      table: averagesTable,
      body: averagesBody,
      defaultSort: 'stats.pts',
      rowTemplate: (player) => `
        <tr>
          <td>
            <div class="table-player">
              ${getPlayerMediaMarkup(player, 'small')}
              <div>
                <strong>${escapeHtml(player.name)}</strong>
                <span>${escapeHtml(player.team || 'Independent')}</span>
              </div>
            </div>
          </td>
          <td>${escapeHtml(player.position)}</td>
          <td>${format(player.stats.games, 0)}</td>
          <td>${format(player.stats.pts)}</td>
          <td>${format(player.stats.reb)}</td>
          <td>${format(player.stats.ast)}</td>
          <td>${format(player.stats.stl)}</td>
          <td>${format(player.stats.blk)}</td>
          <td>${format(player.stats.fgm)}</td>
          <td>${format(player.stats.fga)}</td>
          <td>${format(player.stats.tpm)}</td>
          <td>${format(player.stats.tpa)}</td>
          <td>${format(player.stats.fg)}%</td>
          <td>${format(player.stats.three)}%</td>
        </tr>
      `
    });

    renderPlayerStatsTable({
      table: totalsTable,
      body: totalsBody,
      defaultSort: 'totals.pts',
      rowTemplate: (player) => `
        <tr>
          <td>
            <div class="table-player">
              ${getPlayerMediaMarkup(player, 'small')}
              <div>
                <strong>${escapeHtml(player.name)}</strong>
                <span>${escapeHtml(player.team || 'Independent')}</span>
              </div>
            </div>
          </td>
          <td>${escapeHtml(player.position)}</td>
          <td>${format(player.totals.pts, 0)}</td>
          <td>${format(player.totals.reb, 0)}</td>
          <td>${format(player.totals.ast, 0)}</td>
          <td>${format(player.totals.stl, 0)}</td>
          <td>${format(player.totals.blk, 0)}</td>
          <td>${format(player.totals.fgm, 0)}</td>
          <td>${format(player.totals.fga, 0)}</td>
          <td>${format(player.totals.tpm, 0)}</td>
          <td>${format(player.totals.tpa, 0)}</td>
          <td>${format(player.totals.games, 0)}</td>
        </tr>
      `
    });
  };

  const renderStats = () => {
    renderLeaderBars();
    renderStatsTable();

    const summary = $('#stats-summary');
    if (summary) {
      const topScorer = [...leagueState.players].sort((a, b) => b.stats.pts - a.stats.pts)[0];
      const topRebounder = [...leagueState.players].sort((a, b) => b.stats.reb - a.stats.reb)[0];
      const topPlaymaker = [...leagueState.players].sort((a, b) => b.stats.ast - a.stats.ast)[0];

      summary.innerHTML = `
        <article class="summary-card">
          <span class="eyebrow">Scoring crown</span>
          <h3>${escapeHtml(topScorer.name)}</h3>
          <strong>${format(topScorer.stats.pts)} PPG</strong>
        </article>
        <article class="summary-card">
          <span class="eyebrow">Glass cleaner</span>
          <h3>${escapeHtml(topRebounder.name)}</h3>
          <strong>${format(topRebounder.stats.reb)} RPG</strong>
        </article>
        <article class="summary-card">
          <span class="eyebrow">Best playmaker</span>
          <h3>${escapeHtml(topPlaymaker.name)}</h3>
          <strong>${format(topPlaymaker.stats.ast)} APG</strong>
        </article>
      `;
    }
  };

  const createEmbedSrc = (video) => {
    if (!video.embedId) return '';
    if (video.provider === 'vimeo') return `https://player.vimeo.com/video/${video.embedId}`;
    return `https://www.youtube.com/embed/${video.embedId}?rel=0&modestbranding=1`;
  };

  const renderVideoPlayer = (video) => {
    const featured = $('#featured-video');
    const meta = $('#featured-video-meta');
    if (!featured || !meta) return;

    if (video.embedId) {
      featured.innerHTML = `
        <div class="video-frame-wrap">
          <iframe
            src="${createEmbedSrc(video)}"
            title="${escapeHtml(video.title)}"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
      `;
    } else {
      featured.innerHTML = `
        <div class="video-placeholder">
          <span class="eyebrow">No embed ID yet</span>
          <h3>${escapeHtml(video.title)}</h3>
          <p>Add a ${video.provider === 'vimeo' ? 'Vimeo' : 'YouTube'} video ID in <code>assets/data.js</code> to make this playable.</p>
        </div>
      `;
    }

    meta.innerHTML = `
      <span class="video-chip">${escapeHtml(video.type)}</span>
      <h2>${escapeHtml(video.title)}</h2>
      <p>${escapeHtml(video.description)}</p>
      <div class="video-meta-row">
        <span>${formatDate(video.date)}</span>
        <span>${video.provider === 'vimeo' ? 'Vimeo' : 'YouTube'}</span>
      </div>
    `;
  };

  const renderVideoList = (items) => {
    const list = $('#video-list');
    if (!list) return;

    if (!items.length) {
      list.innerHTML = '<div class="empty-state">No videos in this category yet. Add one in <code>assets/data.js</code>.</div>';
      return;
    }

    list.innerHTML = items
      .map(
        (video, index) => `
          <button class="video-card video-select ${index === 0 ? 'active' : ''}" data-video-index="${(data.videos || []).indexOf(video)}" type="button">
            <div class="video-card__type">${escapeHtml(video.type)}</div>
            <h3>${escapeHtml(video.title)}</h3>
            <p>${escapeHtml(video.description)}</p>
            <div class="video-card__footer">
              <span>${formatDate(video.date)}</span>
              <span>${video.provider === 'vimeo' ? 'Vimeo' : 'YouTube'}</span>
            </div>
          </button>
        `
      )
      .join('');

    $$('.video-select', list).forEach((button) => {
      button.addEventListener('click', () => {
        const video = (data.videos || [])[Number(button.dataset.videoIndex)];
        $$('.video-select', list).forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
        renderVideoPlayer(video);
      });
    });
  };

  const renderVideos = () => {
    const filters = $$('.filter-button[data-video-filter]');
    let activeType = 'ALL';

    const render = () => {
      const filtered = (data.videos || []).filter((video) => activeType === 'ALL' || video.type === activeType);
      renderVideoList(filtered);

      if (filtered[0]) {
        renderVideoPlayer(filtered[0]);
      } else if ((data.videos || [])[0]) {
        renderVideoPlayer(data.videos[0]);
      }

      const count = $('#video-count');
      if (count) count.textContent = `${filtered.length} video${filtered.length === 1 ? '' : 's'}`;
    };

    render();

    filters.forEach((button) => {
      button.addEventListener('click', () => {
        activeType = button.dataset.videoFilter;
        filters.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
        render();
      });
    });
  };

  const formatGameSummary = (log) => {
    const hasTeams = log.teamA || log.teamB;
    const hasScore = log.scoreA !== null || log.scoreB !== null;

    if (hasTeams && hasScore) {
      return `${log.teamA || 'Team A'} ${log.scoreA ?? '-'} • ${log.teamB || 'Team B'} ${log.scoreB ?? '-'}`;
    }

    if (hasTeams) {
      return `${log.teamA || 'Team A'} vs ${log.teamB || 'Team B'}`;
    }

    if (log.format || log.location) {
      return [log.format, log.location].filter(Boolean).join(' • ');
    }

    return 'Open run archived.';
  };

  const gameLogFormState = {
    editingId: null
  };

  const emptyGameLogDraft = () => ({
    id: '',
    date: todayString(),
    title: '',
    format: '',
    location: '',
    teamA: '',
    teamB: '',
    scoreA: '',
    scoreB: '',
    notes: '',
    playerStats: []
  });

  const setFormStatus = (message, type = 'info') => {
    const status = $('#game-log-form-status');
    if (!status) return;
    status.className = `form-status ${type}`;
    status.textContent = message;
  };

  const buildPlayerLineRow = (player, line) => `
    <tr data-player-id="${escapeHtml(player.id)}">
      <td>
        <label class="check-wrap">
          <input class="log-played" type="checkbox" ${line.played ? 'checked' : ''} />
          <span>Played</span>
        </label>
      </td>
      <td>
        <div class="table-player">
          ${getPlayerMediaMarkup(player, 'small')}
          <div>
            <strong>${escapeHtml(player.name)}</strong>
            <span>${escapeHtml(player.position)}</span>
          </div>
        </div>
      </td>
      <td><input class="log-input" data-stat="pts" type="number" min="0" step="1" value="${line.pts || ''}" /></td>
      <td><input class="log-input" data-stat="reb" type="number" min="0" step="1" value="${line.reb || ''}" /></td>
      <td><input class="log-input" data-stat="ast" type="number" min="0" step="1" value="${line.ast || ''}" /></td>
      <td><input class="log-input" data-stat="stl" type="number" min="0" step="1" value="${line.stl || ''}" /></td>
      <td><input class="log-input" data-stat="blk" type="number" min="0" step="1" value="${line.blk || ''}" /></td>
      <td><input class="log-input" data-stat="fgm" type="number" min="0" step="1" value="${line.fgm || ''}" /></td>
      <td><input class="log-input" data-stat="fga" type="number" min="0" step="1" value="${line.fga || ''}" /></td>
      <td><input class="log-input" data-stat="tpm" type="number" min="0" step="1" value="${line.tpm || ''}" /></td>
      <td><input class="log-input" data-stat="tpa" type="number" min="0" step="1" value="${line.tpa || ''}" /></td>
    </tr>
  `;

  const renderGameLogPlayerRows = (existingLines = []) => {
    const tbody = $('#game-log-player-rows');
    if (!tbody) return;

    const existingByPlayerId = new Map(existingLines.map((line) => [line.playerId, normalizePlayerLine(line)]));

    tbody.innerHTML = leagueState.players
      .map((player) => buildPlayerLineRow(player, existingByPlayerId.get(player.id) || normalizePlayerLine({ playerId: player.id })))
      .join('');

    hydratePlayerMedia(tbody);

    $$('.log-input', tbody).forEach((input) => {
      input.addEventListener('input', () => {
        const row = input.closest('tr');
        const checkbox = $('.log-played', row);
        const rowHasStats = $$('.log-input', row).some((field) => safeNumber(field.value) > 0);
        if (rowHasStats) checkbox.checked = true;
      });
    });
  };

  const populateGameLogForm = (log = emptyGameLogDraft()) => {
    const form = $('#game-log-form');
    if (!form) return;

    $('#log-id').value = log.id || '';
    $('#log-date').value = log.date || todayString();
    $('#log-title').value = log.title || '';
    $('#log-format').value = log.format || '';
    $('#log-location').value = log.location || '';
    $('#log-team-a').value = log.teamA || '';
    $('#log-team-b').value = log.teamB || '';
    $('#log-score-a').value = log.scoreA ?? '';
    $('#log-score-b').value = log.scoreB ?? '';
    $('#log-notes').value = log.notes || '';

    gameLogFormState.editingId = log.id || null;
    renderGameLogPlayerRows(log.playerStats || []);

    const saveButton = $('#save-log-button');
    if (saveButton) saveButton.textContent = log.id ? 'Update game log' : 'Save game log';

    setFormStatus(
      log.id ? `Editing “${log.title}”. Save when you are done.` : 'Enter a game, fill in the player lines, and save it to recalculate the site.',
      'info'
    );
  };

  const collectGameLogFromForm = () => {
    const form = $('#game-log-form');
    if (!form) return null;

    const raw = {
      id: $('#log-id').value || uid(),
      date: $('#log-date').value,
      title: $('#log-title').value.trim(),
      format: $('#log-format').value.trim(),
      location: $('#log-location').value.trim(),
      teamA: $('#log-team-a').value.trim(),
      teamB: $('#log-team-b').value.trim(),
      scoreA: $('#log-score-a').value,
      scoreB: $('#log-score-b').value,
      notes: $('#log-notes').value.trim(),
      playerStats: []
    };

    if (!raw.date || !raw.title) {
      setFormStatus('Every game log needs at least a date and a title.', 'error');
      return null;
    }

    raw.playerStats = $$('#game-log-player-rows tr').map((row) => {
      const playerId = row.dataset.playerId;
      const played = $('.log-played', row).checked;
      const line = { playerId, played };
      ALL_LOG_KEYS.forEach((key) => {
        line[key] = safeNumber($(`.log-input[data-stat="${key}"]`, row).value);
      });
      return normalizePlayerLine(line);
    }).filter((line) => lineCountsAsPlayed(line));

    return normalizeGameLog(raw);
  };

  const rerenderWithCurrentState = () => {
    leagueState = buildLeagueState();
    setGlobalText();
    if (page === 'game-logs') renderGameLogsPage();
  };

  const upsertGameLog = async (log) => {
  try {
    const { data: savedLog, error: logError } = await supabase
      .from("game_logs")
     .upsert({
  id: log.id, // <-- ADD THIS BACK
  date: log.date,
  title: log.title,
  format: log.format,
  location: log.location,
  team_a: log.teamA,
  team_b: log.teamB,
  score_a: log.scoreA,
  score_b: log.scoreB,
  notes: log.notes
})
      .select()
      .single();

console.log("SAVED LOG:", savedLog);
console.log("ERROR:", logError);

    if (logError) throw logError;

    await supabase
      .from("player_stats")
      .delete()
      .eq("game_log_id", savedLog.id);

    const statsToInsert = log.playerStats.map(line => ({
      game_log_id: savedLog.id,
      player_id: line.playerId,
      played: line.played,
      pts: line.pts,
      reb: line.reb,
      ast: line.ast,
      stl: line.stl,
      blk: line.blk,
      fgm: line.fgm,
      fga: line.fga,
      tpm: line.tpm,
      tpa: line.tpa
    }));

    if (statsToInsert.length) {
      const { error: statsError } = await supabase
        .from("player_stats")
        .insert(statsToInsert);

      if (statsError) throw statsError;
    }

    runtimeGameLogs = await loadGameLogs();
    leagueState = buildLeagueState();

    renderGameLogsPage();
    setGlobalText();

    populateGameLogForm(emptyGameLogDraft());

    setFormStatus(`Saved "${log.title}" to database.`, 'success');

  } catch (err) {
    console.error(err);
    setFormStatus("Failed to save to database.", "error");
  }
};

  const deleteGameLog = async (logId) => {
  const log = leagueState.gameLogs.find((entry) => entry.id === logId);
  if (!log) return;

  if (!window.confirm(`Delete "${log.title}"?`)) return;

  try {
    await supabase.from("player_stats").delete().eq("game_log_id", logId);
    await supabase.from("game_logs").delete().eq("id", logId);

    runtimeGameLogs = await loadGameLogs();
    leagueState = buildLeagueState();

    renderGameLogsPage();
    setGlobalText();

    setFormStatus(`Deleted "${log.title}"`, "success");

  } catch (err) {
    console.error(err);
    setFormStatus("Delete failed", "error");
  }
};

  const exportGameLogs = () => {
    const payload = {
      league: (data.league && data.league.name) || '',
      version: 1,
      exportedAt: new Date().toISOString(),
      gameLogs: leagueState.gameLogs
    };

    createDownload(
      `${slugify((data.league && data.league.shortName) || 'league')}-game-logs.json`,
      JSON.stringify(payload, null, 2)
    );
  };

  const importGameLogs = async (file) => {
    if (!file) return;
    try {
      const text = await readFileText(file);
      const parsed = JSON.parse(text);
      const imported = normalizeGameLogs(Array.isArray(parsed) ? parsed : parsed.gameLogs || []);
      if (!imported.length) {
        setFormStatus('That file did not contain any game logs to import.', 'error');
        return;
      }

      if (!window.confirm(`Import ${imported.length} game log${imported.length === 1 ? '' : 's'} and replace your current saved logs?`)) {
        return;
      }

      for (const log of imported) {
  await upsertGameLog(log);
}
      populateGameLogForm(emptyGameLogDraft());
      setFormStatus(`Imported ${imported.length} game log${imported.length === 1 ? '' : 's'}.`, 'success');
    } catch (error) {
      console.error(error);
      setFormStatus('Import failed. Use a JSON file exported from this page.', 'error');
    }
  };

  const renderGameLogOverview = () => {
    const container = $('#game-logs-overview');
    if (!container) return;

    const topPointsPlayer = [...leagueState.players].sort((a, b) => b.totals.pts - a.totals.pts)[0];
    const topAssistPlayer = [...leagueState.players].sort((a, b) => b.totals.ast - a.totals.ast)[0];

    container.innerHTML = `
      <div>
        <strong>${leagueState.gameLogs.length}</strong>
        <span>Saved games</span>
      </div>
      <div>
        <strong>${leagueState.totalAppearances}</strong>
        <span>Player lines</span>
      </div>
      <div>
        <strong>${escapeHtml(topPointsPlayer ? topPointsPlayer.name : '—')}</strong>
        <span>${topPointsPlayer ? `${format(topPointsPlayer.totals.pts, 0)} total points` : 'No totals yet'}</span>
      </div>
      <div>
        <strong>${escapeHtml(topAssistPlayer ? topAssistPlayer.name : '—')}</strong>
        <span>${topAssistPlayer ? `${format(topAssistPlayer.totals.ast, 0)} total assists` : 'No totals yet'}</span>
      </div>
    `;
  };

  const buildRenderedLogTable = (log) => {
    const lines = [...log.playerStats]
      .filter((line) => lineCountsAsPlayed(line))
      .sort((a, b) => safeNumber(b.pts) - safeNumber(a.pts));

    if (!lines.length) {
      return '<div class="empty-state">No player lines were recorded for this game yet.</div>';
    }

    return `
      <div class="table-wrap game-log-table-wrap">
        <table class="stats-table game-log-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>PTS</th>
              <th>REB</th>
              <th>AST</th>
              <th>STL</th>
              <th>BLK</th>
              <th>FGM-A</th>
              <th>3PM-A</th>
            </tr>
          </thead>
          <tbody>
            ${lines
              .map((line) => {
                const player = leagueState.playersById.get(line.playerId) || { name: line.playerId, team: '', position: '' };
                return `
                  <tr>
                    <td>
                      <div class="table-player">
                        ${getPlayerMediaMarkup(player, 'small')}
                        <div>
                          <strong>${escapeHtml(player.name)}</strong>
                          <span>${escapeHtml(player.position || '')}</span>
                        </div>
                      </div>
                    </td>
                    <td>${format(line.pts, 0)}</td>
                    <td>${format(line.reb, 0)}</td>
                    <td>${format(line.ast, 0)}</td>
                    <td>${format(line.stl, 0)}</td>
                    <td>${format(line.blk, 0)}</td>
                    <td>${format(line.fgm, 0)}-${format(line.fga, 0)}</td>
                    <td>${format(line.tpm, 0)}-${format(line.tpa, 0)}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const renderGameLogList = () => {
    const list = $('#game-log-list');
    const count = $('#game-log-count');
    if (!list) return;

    if (count) {
      count.textContent = `${leagueState.gameLogs.length} game log${leagueState.gameLogs.length === 1 ? '' : 's'}`;
    }

    if (!leagueState.gameLogs.length) {
      list.innerHTML = `
        <div class="empty-state">
          No saved game logs yet. Add your first one above and the whole site will recalculate from it.
        </div>
      `;
      return;
    }

    list.innerHTML = leagueState.gameLogs
      .map((log) => {
        const playerLinesCount = log.playerStats.filter((line) => lineCountsAsPlayed(line)).length;
        return `
          <article class="surface game-log-card">
            <div class="game-log-card__head">
              <div>
                <span class="eyebrow">${formatDate(log.date)}</span>
                <h2>${escapeHtml(log.title)}</h2>
                <p>${escapeHtml(formatGameSummary(log))}</p>
              </div>
              <div class="game-log-card__actions">
                <button class="ghost-button game-log-edit" type="button" data-log-id="${escapeHtml(log.id)}">Edit</button>
                <button class="ghost-button danger-button game-log-delete" type="button" data-log-id="${escapeHtml(log.id)}">Delete</button>
              </div>
            </div>

            <div class="pill-row game-log-meta-row">
              ${log.format ? `<span class="pill">${escapeHtml(log.format)}</span>` : ''}
              ${log.location ? `<span class="pill">${escapeHtml(log.location)}</span>` : ''}
              <span class="pill">${playerLinesCount} player line${playerLinesCount === 1 ? '' : 's'}</span>
            </div>

            ${log.notes ? `<p class="game-log-notes">${escapeHtml(log.notes)}</p>` : ''}
            ${buildRenderedLogTable(log)}
          </article>
        `;
      })
      .join('');

    hydratePlayerMedia(list);

    $$('.game-log-edit', list).forEach((button) => {
      button.addEventListener('click', () => {
        const log = leagueState.gameLogs.find((entry) => entry.id === button.dataset.logId);
        if (!log) return;
        populateGameLogForm(log);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    $$('.game-log-delete', list).forEach((button) => {
      button.addEventListener('click', () => deleteGameLog(button.dataset.logId));
    });
  };

  const wireGameLogPage = () => {
    const form = $('#game-log-form');
    if (!form || form.dataset.wired === 'true') return;

    form.dataset.wired = 'true';

    form.addEventListener('submit', (event) => {
  event.preventDefault();

  console.log("FORM SUBMITTED"); // 👈 ADD THIS

  const log = collectGameLogFromForm();
  console.log("COLLECTED LOG:", log); // 👈 ADD THIS

  if (!log) return;

  upsertGameLog(log);
});

    const resetFormButton = $('#reset-log-form');
    if (resetFormButton) {
      resetFormButton.addEventListener('click', () => populateGameLogForm(emptyGameLogDraft()));
    }

    const clearLinesButton = $('#clear-player-lines');
    if (clearLinesButton) {
      clearLinesButton.addEventListener('click', () => renderGameLogPlayerRows([]));
    }

    const exportButton = $('#export-game-logs');
    if (exportButton) {
      exportButton.addEventListener('click', exportGameLogs);
    }

    const importInput = $('#import-game-logs');
    if (importInput) {
      importInput.addEventListener('change', async (event) => {
        const file = event.target.files && event.target.files[0];
        await importGameLogs(file);
        event.target.value = '';
      });
    }

    const resetAllButton = $('#reset-all-game-logs');
    if (resetAllButton) {
      resetAllButton.addEventListener('click', async () => {
        if (!window.confirm('Reset every saved game log? This will roll the whole site back to the base stats in assets/data.js.')) return;
        await supabase.from("player_stats").delete().not("id", "is", null);
await supabase.from("game_logs").delete().not("id", "is", null);

runtimeGameLogs = [];
rerenderWithCurrentState();
        populateGameLogForm(emptyGameLogDraft());
        setFormStatus('All saved game logs were reset.', 'success');
      });
    }
  };

  const renderGameLogsPage = () => {
    renderGameLogOverview();
    renderGameLogList();
    wireGameLogPage();

    const source = $('#game-log-source-note');
    if (source) source.textContent = leagueState.statSourceMessage;

    const storage = $('#game-log-storage-note');
    if (storage) {
      storage.textContent = leagueState.storageAvailable
        ? 'Saved logs live in this browser automatically. Export a backup after adding a bunch of games.'
        : 'This browser is blocking storage. The editor will still work right now, but export your logs before closing the page.';
    }

    if (!gameLogFormState.editingId) {
      populateGameLogForm(emptyGameLogDraft());
    }
  };

  document.addEventListener("DOMContentLoaded", async () => {
  applyLeagueTheme();
  ensureGameLogsNavLink();

  runtimeGameLogs = await loadGameLogs();

  leagueState = buildLeagueState();

  setGlobalText();
  renderSeasonNotes();

  if (page === 'home') renderHome();
  if (page === 'about') renderAbout();
  if (page === 'players') renderPlayers();
  if (page === 'stats') renderStats();
  if (page === 'videos') renderVideos();
  if (page === 'game-logs') renderGameLogsPage();
});
