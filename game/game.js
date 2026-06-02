function showToast(msg) {
  var el = document.getElementById('system-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'system-toast';
    el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);color:#fff;padding:12px 24px;border-radius:14px;font-size:15px;z-index:9999;text-align:center;opacity:0;transition:opacity 0.3s;pointer-events:none;max-width:80%;border:1px solid rgba(255,255,255,0.1);';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  setTimeout(function() { el.style.opacity = '0'; }, 3000);
}

/* ===== Tower Stack — Game Engine ===== */
(function() {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  let W, H;
  let gameRunning = false;
  let gameOver = false;
  let score = 0;
  let height = 0;
  let combo = 0;
  let bestCombo = 0;
  let perfectCount = 0;
  let frame = 0;

  // Tower state
  let blocks = [];
  let currentBlock = {};
  let targetX = 0;
  let blockWidth = 0;
  let blockHeight = 30;
  let baseY = 0;

  // Colors for active block style
  let blockColors = ['#4facfe', '#a18cd1', '#ff6b6b', '#ffe259'];
  let colorIndex = 0;

  let particles = [];
  let floatingTexts = [];

  function getActiveBlockColors() {
    try {
      const state = window.TowerProgression?.getState();
      if (state?.activeBlockStyle && window.TowerProgression?.SHOP_CATALOG?.blockStyles) {
        const style = window.TowerProgression.SHOP_CATALOG.blockStyles.find(s => s.id === state.activeBlockStyle);
        if (style) return style.colors;
      }
    } catch(e) {}
    return ['#4facfe', '#a18cd1', '#ff6b6b', '#ffe259'];
  }

  function getThemeBg() {
    try {
      const state = window.TowerProgression?.getState();
      if (state?.activeTheme && window.TowerProgression?.SHOP_CATALOG?.themes) {
        const t = window.TowerProgression.SHOP_CATALOG.themes.find(th => th.id === state.activeTheme);
        if (t) return t;
      }
    } catch(e) {}
    return { bg: '#0a0a1a', accent: '#1a1a3a' };
  }

  function getActiveParticleType() {
    try {
      const state = window.TowerProgression?.getState();
      return state?.activeParticleEffect || 'sparkle';
    } catch(e) { return 'sparkle'; }
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight - 48;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
    baseY = H * 0.75;
  }

  function resetGame() {
    score = 0;
    height = 0;
    combo = 0;
    bestCombo = 0;
    perfectCount = 0;
    gameOver = false;
    colorIndex = 0;
    blocks = [];
    particles = [];
    floatingTexts = [];

    blockColors = getActiveBlockColors();
    blockWidth = Math.min(W * 0.35, 120);
    const bonuses = window.TowerProgression?.getActiveBonuses() || {};

    // Add bonuses to width
    blockWidth += bonuses.widthBonus || 0;

    targetX = (W - blockWidth) / 2;
    currentBlock = {
      x: 0,
      y: baseY,
      w: blockWidth,
      h: blockHeight,
      speed: 2,
      dir: 1,
      color: blockColors[colorIndex % blockColors.length],
    };

    blocks.push({
      x: targetX,
      y: baseY + blockHeight,
      w: blockWidth,
      h: blockHeight,
      color: blockColors[(colorIndex - 1 + blockColors.length) % blockColors.length],
    });

    updateHUD();
  }

  // ─── Controls ─────────────────────────────
  function setupControls() {
    const dropBlock = () => {
      if (!gameRunning || gameOver) return;

      const bonuses = window.TowerProgression?.getActiveBonuses() || {};
      const stability = bonuses.stability || 0;
      const perfectPct = bonuses.perfectPct || 0;
      const comboMult = bonuses.comboMult || 1;
      const perfectBonus = bonuses.perfectBonus || 0;

      const lastBlock = blocks[blocks.length - 1];
      const diff = currentBlock.x - lastBlock.x;

      // Check perfect
      const isPerfect = Math.abs(diff) < 3 + perfectPct * 0.2;

      if (isPerfect) {
        // Perfect drop - block stays same size
        combo++;
        if (combo > bestCombo) bestCombo = combo;
        perfectCount++;

        const pts = Math.floor((10 + combo * 2 + perfectBonus) * comboMult);
        score += pts;

        blocks.push({
          x: currentBlock.x,
          y: currentBlock.y,
          w: currentBlock.w,
          h: currentBlock.h,
          color: currentBlock.color,
          perfect: true,
        });

        floatingTexts.push({
          x: currentBlock.x + currentBlock.w / 2,
          y: currentBlock.y - 10,
          text: `💯 PERFECT! +${pts}`,
          color: '#ffd700',
          life: 1,
          vy: -1.5,
        });

        if (window.TowerVisuals) {
          window.TowerVisuals.ParticleSystem.prototype.emitPerfect.call(
            { particles },
            currentBlock.x + currentBlock.w / 2,
            currentBlock.y
          );
        }

        if (combo >= 5 && combo % 5 === 0) {
          floatingTexts.push({
            x: W / 2,
            y: H / 2 - 40,
            text: `🔥 ${combo}x Perfect Streak! 🔥`,
            color: '#ff6b9d',
            life: 1,
            vy: -0.8,
          });
        }

      } else {
        // Trim block
        const overhang = Math.abs(diff);
        combo = 0;

        let newX, newW;
        if (diff > 0) {
          // Block too far right
          newX = currentBlock.x + overhang;
          newW = currentBlock.w - overhang;
        } else {
          // Block too far left
          newX = currentBlock.x;
          newW = currentBlock.w + diff; // diff is negative
        }

        if (newW <= 3) {
          // Too small — game over
          endGame();
          return;
        }

        blocks.push({
          x: newX,
          y: currentBlock.y,
          w: newW,
          h: currentBlock.h,
          color: currentBlock.color,
          trimmed: currentBlock.w - newW,
        });

        const pts = Math.floor(newW / 3 + stability * 0.5 + 1);
        score += pts;

        // Drop particles
        if (window.TowerVisuals) {
          window.TowerVisuals.ParticleSystem.prototype.emitDrop.call(
            { particles },
            diff > 0 ? currentBlock.x + currentBlock.w : currentBlock.x,
            currentBlock.y,
            '#ff6b6b'
          );
        }
      }

      height = blocks.length;

      // Move stack down
      for (const b of blocks) {
        b.y -= blockHeight;
      }
      currentBlock.y -= blockHeight;

      // Next block
      colorIndex++;
      const nextWidth = isPerfect ? currentBlock.w : Math.abs(currentBlock.w - Math.abs(diff));
      currentBlock = {
        x: Math.random() * (W - nextWidth),
        y: currentBlock.y,
        w: nextWidth,
        h: blockHeight,
        speed: 2 + height * 0.05,
        dir: currentBlock.x > W / 2 ? -1 : 1,
        color: blockColors[colorIndex % blockColors.length],
      };

      // Shake camera effect — just slide the canvas
      updateHUD();
    };

    canvas.addEventListener('click', dropBlock);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); dropBlock(); });
    document.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') dropBlock(); });
  }

  // ─── Update ───────────────────────────────
  function update() {
    if (!gameRunning || gameOver) return;
    frame++;

    // Move current block
    currentBlock.x += currentBlock.speed * currentBlock.dir;
    if (currentBlock.x + currentBlock.w > W - 5) {
      currentBlock.dir = -1;
    } else if (currentBlock.x < 5) {
      currentBlock.dir = 1;
    }

    // Update particles
    particles = particles.filter(p => p.update());

    // Update floating texts
    floatingTexts = floatingTexts.filter(t => { t.y += t.vy; t.vy *= 0.97; t.life -= 0.02; return t.life > 0; });

    updateHUD();
  }

  // ─── Draw ─────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, W, H);

    const theme = getThemeBg();
    const partType = getActiveParticleType();

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, theme.bg);
    bgGrad.addColorStop(0.5, theme.accent);
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Ground line
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, baseY + blockHeight);
    ctx.lineTo(W, baseY + blockHeight);
    ctx.stroke();

    // Draw tower blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      if (b.y < -60 || b.y > H + 60) continue;

      if (window.TowerVisuals) {
        window.TowerVisuals.drawBlock(ctx, b.x, b.y, b.w, b.h, b.color, 1, true);
      } else {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
      }

      // Perfect indicator
      if (b.perfect) {
        ctx.fillStyle = 'rgba(255,215,0,0.3)';
        ctx.fillRect(b.x, b.y, b.w, 2);
      }
    }

    // Draw current sliding block
    if (currentBlock && currentBlock.w > 0) {
      if (window.TowerVisuals) {
        // Add glow effect for current block
        ctx.save();
        ctx.shadowColor = currentBlock.color;
        ctx.shadowBlur = 15;
        window.TowerVisuals.drawBlock(ctx, currentBlock.x, currentBlock.y, currentBlock.w, currentBlock.h, currentBlock.color, 1, true);
        ctx.restore();
      } else {
        ctx.save();
        ctx.shadowColor = currentBlock.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = currentBlock.color;
        ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.w, currentBlock.h);
        ctx.restore();
      }

      // Direction arrow hint
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      const arrowX = currentBlock.dir > 0 ? currentBlock.x + currentBlock.w + 8 : currentBlock.x - 8;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(currentBlock.dir > 0 ? '→' : '←', arrowX, currentBlock.y + blockHeight / 2 + 5);
    }

    // Draw particles
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      if (p.type === 'star' || partType === 'stars') {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
          ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * p.size, Math.sin(a) * p.size);
        }
        ctx.closePath(); ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw floating texts
    for (const t of floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.life);
      ctx.fillStyle = t.color || '#fff';
      ctx.font = `bold ${t.size || 18}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 6;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }

  function updateHUD() {
    const scoreEl = document.getElementById('score-value');
    if (scoreEl) scoreEl.textContent = Math.floor(score);
    const heightEl = document.getElementById('height-display');
    if (heightEl) heightEl.textContent = height;
    const comboEl = document.getElementById('combo-display');
    if (comboEl) comboEl.textContent = `💯 ${combo}`;

    try {
      const state = window.TowerProgression?.getState();
      if (state) {
        const coinsEl = document.getElementById('hud-coins');
        const gemsEl = document.getElementById('hud-gems');
        const lvlEl = document.getElementById('hud-level');
        if (coinsEl) coinsEl.textContent = state.coins;
        if (gemsEl) gemsEl.textContent = state.gems;
        if (lvlEl) lvlEl.textContent = state.level;
      }
    } catch(e) {}
  }

  function endGame() {
    gameOver = true;
    gameRunning = false;

    if (currentBlock && window.TowerVisuals) {
      window.TowerVisuals.ParticleSystem.prototype.emitGameOver.call(
        { particles },
        currentBlock.x + currentBlock.w / 2,
        currentBlock.y
      );
    }

    try {
      window.TowerProgression?.endOfGame({
        height,
        combo: bestCombo,
        perfects: perfectCount,
      });
      const unlocked = window.TowerProgression?.checkAchievements() || [];

  // ─── Framework Module Hooks ───────────────────
  if (window.RetentionSystem) {
    RetentionSystem.onGameEnd(score);
    RetentionSystem.submitScore('Player', score);
  }
  if (window.ChallengesSystem) {
    ChallengesSystem.reportProgress('score', score);
    ChallengesSystem.reportProgress('games', 1);
  }
  if (window.CollectiblesSystem) {
    CollectiblesSystem.incrementTracker('totalGames');
    CollectiblesSystem.setTracker('highestScore', score);
    CollectiblesSystem.checkUnlocks();
  }
  if (window.AdsManager) {
    setTimeout(function() { AdsManager.tryShowInterstitial(); }, 2000);
  }
  // ─── End Framework Hooks ─────────────────────
      if (unlocked.length > 0) setTimeout(() => showAchievements(unlocked), 500);
    } catch(e) {}

    // Framework game-over hooks
    window.RetentionSystem?.onGameEnd(Math.floor(score));
    window.ChallengesSystem?.reportProgress('score', Math.floor(height));
    window.ChallengesSystem?.reportProgress('games', 1);
    window.CollectiblesSystem?.incrementTracker('totalGames', 1);
    window.CollectiblesSystem?.setTracker('highestScore', Math.floor(height));
    window.CollectiblesSystem?.incrementTracker('wins', 1);
    window.AdsManager?.tryShowInterstitial();

    document.getElementById('final-score').textContent = Math.floor(score);
    document.getElementById('go-height').textContent = height;
    document.getElementById('go-combo').textContent = bestCombo;
    document.getElementById('go-perfect').textContent = perfectCount;
    document.getElementById('game-over-overlay').classList.add('show');
  }

  function showAchievements(achievements) {
    let msg = '🏆 Achievements!\n';
    for (const a of achievements) msg += `\n${a.icon} ${a.name}: ${a.reward.coins} coins${a.reward.gems ? ` + ${a.reward.gems}💎` : ''}`;
    const el = document.getElementById('notification');
    if (el) { el.textContent = msg; el.className = 'show'; clearTimeout(el._timeout); el._timeout = setTimeout(() => el.className = '', 4000); }
  }

  function gameLoop() {
    if (gameRunning && !gameOver) {
      update();
      draw();
    } else {
      // Draw idle
      ctx.clearRect(0, 0, W, H);
      const theme = getThemeBg();
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, theme.bg);
      grad.addColorStop(1, '#000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, baseY + blockHeight);
      ctx.lineTo(W, baseY + blockHeight);
      ctx.stroke();
      // Draw idle block
      if (blockWidth > 0) {
        ctx.fillStyle = '#4facfe';
        ctx.shadowColor = '#4facfe';
        ctx.shadowBlur = 10;
        ctx.fillRect((W - blockWidth) / 2, baseY, blockWidth, blockHeight);
      }
    }
    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    document.getElementById('game-over-overlay').classList.remove('show');
    resetGame();
    gameRunning = true;
  }

  function init() {
    const P = window.TowerProgression;


  // ─── Framework Modules Init ───────────────────
  if (window.StoreRotator) StoreRotator.init();
  if (window.RetentionSystem) RetentionSystem.init();
  if (window.AdsManager) AdsManager.init();
  if (window.ChallengesSystem) ChallengesSystem.init();
  if (window.CollectiblesSystem) CollectiblesSystem.init();
  if (window.TutorialSystem) {
    TutorialSystem.init({ gameTitle: 'Game' });
    if (TutorialSystem.shouldShow()) {
      setTimeout(() => TutorialSystem.start(function() {
        if (window.showToast) showToast('Tutorial complete! Good luck!');
      }), 500);
    }
  }
  // ─── End Framework Init ───────────────────────
    if (P) P.load();

    // Init framework modules
    window.AdsManager?.init({});
    window.ChallengesSystem?.init({});
    window.StoreRotator?.init({});
    window.RetentionSystem?.init({});
    window.CollectiblesSystem?.init({});
    window.TutorialSystem?.init({});

    resize();
    window.addEventListener('resize', resize);
    setupControls();

    document.getElementById('restart-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn2').addEventListener('click', startGame);
    document.getElementById('button-shop').addEventListener('click', () => {
      if (window.TowerShop) window.TowerShop.open();
    });

    resetGame();
    setInterval(updateHUD, 1000);
    gameLoop();
  }

  document.addEventListener('DOMContentLoaded', init);
  window.startGame = startGame;
})();
