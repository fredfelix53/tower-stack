/* ===== Tower Stack — Shop & Upgrades ===== */
(function() {
  'use strict';

  let shopContainer = null;
  let activeTab = 'coins';

  function createShopPanel() {
    if (shopContainer) { shopContainer.style.display = 'block'; showTab(activeTab); return; }
    shopContainer = document.createElement('div');
    shopContainer.id = 'shop-panel';
    shopContainer.innerHTML = `
      <div class="shop-overlay"></div>
      <div class="shop-window">
        <button class="shop-close">&times;</button>
        <h2 class="shop-title">🛒 Shop</h2>
        <div class="shop-balance-bar">
          <span class="balance-item">🪙 <span id="shop-coins">0</span></span>
          <span class="balance-item">💎 <span id="shop-gems">0</span></span>
        </div>
        <div class="shop-tabs">
          <button class="shop-tab" data-tab="coins">🪙 Shop</button>
          <button class="shop-tab" data-tab="upgrades">⚡ Upgrades</button>
          <button class="shop-tab" data-tab="blocks">🧱 Blocks</button>
        </div>
        <div class="shop-content" id="shop-content"></div>
      </div>`;
    document.body.appendChild(shopContainer);
    shopContainer.querySelector('.shop-close').addEventListener('click', closeShop);
    shopContainer.querySelector('.shop-overlay').addEventListener('click', closeShop);
    shopContainer.querySelectorAll('.shop-tab').forEach(tab => tab.addEventListener('click', () => showTab(tab.dataset.tab)));
    showTab('upgrades');
    updateBalances();
  }

  function closeShop() { if (shopContainer) shopContainer.style.display = 'none'; }

  function showTab(tabId) {
    activeTab = tabId; if (!shopContainer) return;
    shopContainer.querySelectorAll('.shop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    const content = shopContainer.querySelector('#shop-content');
    if (tabId === 'coins') renderThemeShop(content);
    else if (tabId === 'upgrades') renderUpgrades(content);
    else if (tabId === 'blocks') renderBlockShop(content);
    updateBalances();
  }

  function updateBalances() {
    const c = shopContainer?.querySelector('#shop-coins');
    const g = shopContainer?.querySelector('#shop-gems');
    const st = window.TowerProgression?.getState();
    if (c && st) c.textContent = st.coins;
    if (g && st) g.textContent = st.gems;
  }

  function renderThemeShop(container) {
    const P = window.TowerProgression; const state = P.getState();
    let html = '<div class="shop-section"><h3>🎨 Background Themes</h3><div class="shop-grid">';
    for (const t of P.SHOP_CATALOG.themes) {
      const owned = state.ownedThemes.includes(t.id);
      const active = state.activeTheme === t.id;
      html += `<div class="shop-item ${owned ? 'owned' : ''} ${active ? 'active' : ''}" data-id="${t.id}" data-price="${t.price}">
        <div class="item-preview theme-preview" style="background:linear-gradient(135deg,${t.bg},${t.accent})"></div>
        <div class="item-name">${t.name}</div>
        ${owned ? (active ? '<span class="item-status">✓ Active</span>' : '<button class="btn-equip">Equip</button>') : `<button class="btn-buy">🪙 ${t.price}</button>`}
      </div>`;
    }
    html += '</div></div><div class="shop-section"><h3>✨ Particle Effects</h3><div class="shop-grid">';
    for (const p of P.SHOP_CATALOG.particles) {
      const owned = state.ownedParticleEffects.includes(p.id);
      const active = state.activeParticleEffect === p.id;
      html += `<div class="shop-item ${owned ? 'owned' : ''} ${active ? 'active' : ''}" data-type="particle" data-id="${p.id}" data-price="${p.price}">
        <div class="item-name">${p.name}</div>
        ${owned ? (active ? '<span class="item-status">✓ Active</span>' : '<button class="btn-equip">Equip</button>') : `<button class="btn-buy">🪙 ${p.price}</button>`}
      </div>`;
    }
    html += '</div></div>';
    container.innerHTML = html;
    container.querySelectorAll('.btn-buy').forEach(btn => {
      btn.addEventListener('click', e => {
        const item = e.target.closest('.shop-item');
        const id = item.dataset.id; const price = parseInt(item.dataset.price);
        const type = item.dataset.type;
        if (!type && state.ownedThemes.includes(id)) { equipTheme(id); return; }
        if (!P.spendCoins(price)) { showNotification('Not enough coins!'); return; }
        if (type === 'particle') { state.ownedParticleEffects.push(id); state.activeParticleEffect = id; }
        else { state.ownedThemes.push(id); state.activeTheme = id; }
        P.save(); showNotification('Purchased! ✨'); showTab('coins');
      });
    });
    container.querySelectorAll('.btn-equip').forEach(btn => {
      btn.addEventListener('click', e => {
        const item = e.target.closest('.shop-item');
        const id = item.dataset.id; const type = item.dataset.type;
        if (type === 'particle') { state.activeParticleEffect = id; }
        else { if (!state.ownedThemes.includes(id)) return; state.activeTheme = id; }
        P.save(); showNotification('Applied! ✅'); showTab('coins');
      });
    });
  }

  function equipTheme(id) {
    const P = window.TowerProgression; const state = P.getState();
    if (!state.ownedThemes.includes(id)) return;
    state.activeTheme = id; P.save();
  }

  function renderBlockShop(container) {
    const P = window.TowerProgression; const state = P.getState();
    let html = '<div class="shop-section"><h3>🧱 Block Styles</h3><div class="shop-grid">';
    for (const s of P.SHOP_CATALOG.blockStyles) {
      const owned = state.ownedBlockStyles.includes(s.id);
      const active = state.activeBlockStyle === s.id;
      html += `<div class="shop-item ${owned ? 'owned' : ''} ${active ? 'active' : ''}" data-id="${s.id}" data-price="${s.price}">
        <div class="block-preview" style="height:36px;border-radius:6px;margin-bottom:8px;background:linear-gradient(135deg,${s.colors[0]},${s.colors[1]})"></div>
        <div class="item-name">${s.name}</div>
        ${owned ? (active ? '<span class="item-status">✓ Active</span>' : '<button class="btn-equip">Equip</button>') : `<button class="btn-buy">🪙 ${s.price}</button>`}
      </div>`;
    }
    html += '</div></div>';
    container.innerHTML = html;
    container.querySelectorAll('.btn-buy').forEach(btn => {
      btn.addEventListener('click', e => {
        const item = e.target.closest('.shop-item');
        const id = item.dataset.id; const price = parseInt(item.dataset.price);
        if (state.ownedBlockStyles.includes(id)) return;
        if (!P.spendCoins(price)) { showNotification('Not enough coins!'); return; }
        state.ownedBlockStyles.push(id); state.activeBlockStyle = id; P.save();
        showNotification('Block style purchased! ✨'); showTab('blocks');
      });
    });
    container.querySelectorAll('.btn-equip').forEach(btn => {
      btn.addEventListener('click', e => {
        state.activeBlockStyle = e.target.closest('.shop-item').dataset.id; P.save();
        showNotification('Equipped! ✅'); showTab('blocks');
      });
    });
  }

  function renderUpgrades(container) {
    const P = window.TowerProgression; const state = P.getState();
    const bonuses = P.getActiveBonuses();
    let html = '<div class="shop-section"><h3>⚡ Upgrade Station</h3>';
    html += `<div class="bonus-summary">
      <span>🧱 Width: <strong>+${bonuses.widthBonus}</strong></span>
      <span>🏛️ Stability: <strong>${bonuses.stability}%</strong></span>
      <span>👑 Combo: <strong>${bonuses.comboMult.toFixed(2)}x</strong></span>
      <span>💯 Perfect: <strong>${bonuses.perfectPct}%</strong></span>
    </div>`;
    html += `<div class="upgrade-balance">🪙 ${state.coins.toLocaleString()} | 💎 ${state.gems}</div>`;
    for (const [cat, tier] of Object.entries(P.UPGRADE_TIERS)) {
      const cur = state.upgrades[cat] || 0;
      const next = tier.levels[cur + 1];
      const maxed = cur >= tier.maxLevel;
      html += `<div class="upgrade-card" data-cat="${cat}">
        <div class="upgrade-header"><span class="upgrade-icon">${tier.icon}</span><span class="upgrade-name">${tier.name}</span><span class="upgrade-level">Lv.${cur}</span></div>
        <div class="upgrade-visual"><div class="upgrade-bar"><div class="upgrade-fill" style="width:${(cur / tier.maxLevel) * 100}%"></div></div><div class="upgrade-dots">`;
      for (let i = 0; i <= tier.maxLevel; i++) html += `<span class="upgrade-dot ${i <= cur ? 'filled' : ''}">${i}</span>`;
      html += `</div></div>`;
      if (tier.levels[cur]) html += `<div class="upgrade-current">${tier.levels[cur].name}</div>`;
      if (next) { html += `<div class="upgrade-next">Next: ${next.name}</div>`; html += `<button class="btn-upgrade" data-cat="${cat}">🪙 ${next.coinsReq.toLocaleString()}</button>`; }
      if (maxed) html += `<div class="upgrade-maxed">⭐ MAX LEVEL ⭐</div>`;
      html += `</div>`;
    }
    html += '</div>';
    container.innerHTML = html;
    container.querySelectorAll('.btn-upgrade').forEach(btn => {
      btn.addEventListener('click', e => {
        const cat = e.target.closest('.upgrade-card').dataset.cat;
        const result = P.upgradeItem(cat);
        if (result.success) { showNotification(`⬆️ ${cat} Lv.${result.newLevel}!`); renderUpgrades(container); updateBalances(); }
        else showNotification('Not enough coins!');
      });
    });
  }

  function showNotification(msg) {
    const el = document.getElementById('notification') || (() => { const n = document.createElement('div'); n.id = 'notification'; document.body.appendChild(n); return n; })();
    el.textContent = msg; el.className = 'show';
    clearTimeout(el._timeout); el._timeout = setTimeout(() => el.className = '', 2500);
  }

  window.TowerShop = { open: createShopPanel, close: closeShop, showTab, updateBalances };
})();
