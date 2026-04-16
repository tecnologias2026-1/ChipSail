  /* ═══════════════════════════════
     ESTADO DE SESIÓN
  ═══════════════════════════════ */
  let sesionIniciada = false;

  /* Toast de notificación */
  let toastTimer = null;
  function mostrarToast(msg) {
    const toast = document.getElementById('toast-notif');
    toast.textContent = msg || 'Primero debes iniciar sesión';
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.classList.remove('show'); }, 2800);
  }

  /* Interceptores para búsqueda desde la home (sin sesión) */
  function handleHomeSearch() {
    if (!sesionIniciada) {
      mostrarToast('Primero debes iniciar sesión');
      goTo('login');
    } else {
      goTo('resultados');
    }
  }

  function handleHomeImageSearch() {
    if (!sesionIniciada) {
      mostrarToast('Primero debes iniciar sesión');
      goTo('login');
    } else {
      abrirBusquedaImagen();
    }
  }

  /* ═══════════════════════════════
     CATÁLOGO — precios entre $10 y $100
  ═══════════════════════════════ */
  const catalog = {
    amazon: [
      { name:'Amazon Camiseta de playa',  desc:'Camiseta de alta calidad y durabilidad', stars:3, count:60,  price:25,  img:'23.jpg'  },
      { name:'Amazon Camiseta de playa',  desc:'Camiseta de alta calidad y durabilidad', stars:4, count:98,  price:40,  img:'8.jpg'   },
      { name:'Amazon Camiseta Hawaii',    desc:'Estampado hawaiano original',             stars:4, count:74,  price:35,  img:'15.jpg'  },
      { name:'Amazon Camiseta Tropical',  desc:'Diseño tropical de alta calidad',         stars:3, count:55,  price:20,  img:'29.jpg'  },
      { name:'Amazon Camiseta Sport',     desc:'Camiseta deportiva para playa',           stars:5, count:120, price:55,  img:'3.jpg'   },
      { name:'Amazon Camiseta Surf',      desc:'Ideal para los amantes del surf',         stars:4, count:88,  price:45,  img:'19.jpg'  },
    ],
    ebay: [
      { name:'eBay Camiseta de playa',    desc:'Camiseta de alta calidad y durabilidad', stars:4, count:72,  price:30,  img:'26.jpg'  },
      { name:'eBay Camiseta Tropical',    desc:'Diseño tropical vibrante',               stars:3, count:45,  price:15,  img:'11.jpg'  },
      { name:'eBay Camiseta Hawaii',      desc:'Estampado hawaiano original',             stars:5, count:103, price:60,  img:'21.jpg'  },
      { name:'eBay Camiseta Surf',        desc:'Para los amantes del surf',              stars:4, count:61,  price:50,  img:'6.jpeg'  },
      { name:'eBay Camiseta Sport',       desc:'Camiseta deportiva para playa',          stars:3, count:39,  price:22,  img:'30.jpg'  },
      { name:'eBay Camiseta Premium',     desc:'Calidad premium al mejor precio',        stars:5, count:90,  price:75,  img:'13.jpg'  },
    ],
    walmart: [
      { name:'Walmart Camiseta de playa', desc:'Camiseta de alta calidad y durabilidad', stars:4, count:80,  price:18,  img:'25.jpg'  },
      { name:'Walmart Camiseta Tropical', desc:'Diseño tropical de temporada',           stars:3, count:52,  price:12,  img:'4.jpg'   },
      { name:'Walmart Camiseta Hawaii',   desc:'Estampado hawaiano',                     stars:4, count:67,  price:28,  img:'17.jpg'  },
      { name:'Walmart Camiseta Sport',    desc:'Ligera y cómoda para el verano',         stars:5, count:111, price:38,  img:'9.jpg'   },
      { name:'Walmart Camiseta Surf',     desc:'Ideal para surf y playa',                stars:3, count:43,  price:22,  img:'28.jpg'  },
      { name:'Walmart Camiseta Básica',   desc:'Básica y de buena calidad',              stars:4, count:76,  price:10,  img:'1.jpg'   },
    ],
    target: [
      { name:'Target Camiseta de playa',  desc:'Camiseta de alta calidad y durabilidad', stars:4, count:85,  price:32,  img:'14.jpg'  },
      { name:'Target Camiseta Tropical',  desc:'Colores vivos para el verano',           stars:3, count:58,  price:20,  img:'22.jpg'  },
      { name:'Target Camiseta Hawaii',    desc:'Estilo hawaiano garantizado',             stars:5, count:95,  price:65,  img:'7.jpg'   },
      { name:'Target Camiseta Surf',      desc:'Para los días de olas grandes',          stars:4, count:69,  price:48,  img:'27.jpg'  },
      { name:'Target Camiseta Sport',     desc:'Tejido transpirable sport',              stars:3, count:41,  price:27,  img:'10.jpg'  },
      { name:'Target Camiseta Premium',   desc:'Calidad premium Target',                 stars:5, count:102, price:90,  img:'24.jpg'  },
    ],
    bestbuy: [
      { name:'BestBuy Camiseta de playa', desc:'Camiseta de alta calidad y durabilidad', stars:4, count:77,  price:42,  img:'16.jpg'  },
      { name:'BestBuy Camiseta Tropical', desc:'Estampado tropical de lujo',             stars:3, count:49,  price:33,  img:'5.jpg'   },
      { name:'BestBuy Camiseta Hawaii',   desc:'Auténtico diseño hawaiano',              stars:5, count:118, price:80,  img:'20.jpg'  },
      { name:'BestBuy Camiseta Surf',     desc:'Resistente al agua y al sol',            stars:4, count:63,  price:58,  img:'2.jpg'   },
      { name:'BestBuy Camiseta Sport',    desc:'Deporte y playa combinados',             stars:3, count:37,  price:25,  img:'12.jpg'  },
      { name:'BestBuy Camiseta Premium',  desc:'Lo mejor en camisetas de playa',         stars:5, count:130, price:100, img:'18.jpg'  },
    ],
  };

  const allVendors = ['amazon', 'ebay', 'walmart', 'target', 'bestbuy'];

  const flatProducts = [];
  allVendors.forEach(vendor => {
    catalog[vendor].forEach((p, idx) => {
      flatProducts.push({ vendor, idx, globalNum: flatProducts.length + 1, ...p });
    });
  });

  const state = {
    res:     { maxPrice: 100, minStars: 0 },
    carrito: { maxPrice: 100, minStars: 0 },
  };

  const cart = [];

  let imgSearchSelectedNum = null;
  let imgSearchResult = null;
  let imgSearchThumbNums = [];

  /* ═══════════════════════════════
     HELPERS HTML
  ═══════════════════════════════ */
  function starsHtml(n) {
    let h = '';
    for (let i = 1; i <= 5; i++) h += `<span class="${i <= n ? 'sf' : 'se'}">★</span>`;
    return h;
  }

  function productImg(imgFile) {
    return `<img tabindex="0" src="assets/${imgFile}" alt="producto" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;">`;
  }

  function cardResHtml(vendor, idx, globalNum) {
    const p = catalog[vendor][idx];
    const key = vendor + '_' + idx;
    const inCart = cart.some(c => c.key === key);
    return `<div class="product-card">
      <div class="product-number-badge">${globalNum}</div>
      ${productImg(p.img)}
      <div class="product-body">
        <div tabindex="0" class="product-name">${p.name}</div>
        <div tabindex="0" class="product-desc">${p.desc}</div>
        <div tabindex="0" class="product-price">$ ${p.price}</div>
        <div tabindex="0" class="product-rating"><div class="stars-row">${starsHtml(p.stars)}</div><span class="rating-count">(${p.count})</span></div>
      </div>
      <div class="product-actions">
        <button class="btn-cart" onclick="addToCart('${vendor}',${idx})" ${inCart ? 'style="opacity:.5;cursor:default;"' : ''}>
          ${inCart ? 'En carrito ✓' : 'Agregar a carro'}
        </button>
        <button class="btn-historial" onclick="abrirHistorial()">Historial</button>
      </div>
    </div>`;
  }

  const cartQty = {};

  function cardCartHtml(item) {
    const qty = cartQty[item.key] || 1;
    const totalItem = item.price * qty;
    return `<div class="product-card">
      <div class="product-number-badge">${item.globalNum}</div>
      ${productImg(item.img)}
      <div class="product-body">
        <div class="product-name">${item.name}</div>
        <div class="product-desc">${item.desc}</div>
        <div class="qty-control">
          <button class="qty-btn" onclick="changeQty('${item.key}',-1)">−</button>
          <span class="qty-num" id="qty-${item.key}">${qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.key}',1)">+</button>
        </div>
        <div class="product-price-total">$ ${totalItem}</div>
        <div class="product-rating"><div class="stars-row">${starsHtml(item.stars)}</div><span class="rating-count">(${item.count})</span></div>
      </div>
      <div class="product-actions">
        <button class="btn-pagar" onclick="pagarItem('${item.key}')">Pagar</button>
      </div>
    </div>`;
  }

  function getChecked(pageId) {
    return allVendors.filter(v => {
      const el = document.getElementById(pageId + '-chk-' + v);
      return el && el.checked;
    });
  }

  function renderResultados(filterToNum) {
    const grid = document.getElementById('grid-res');
    if (!grid) return;
    const { maxPrice, minStars } = state.res;
    const checked = getChecked('res');
    const vendors = checked.length > 0 ? checked : allVendors;
    let html = '';
    let gNum = 0;
    allVendors.forEach(vendor => {
      catalog[vendor].forEach((p, i) => {
        gNum++;
        if (!vendors.includes(vendor)) return;
        if (filterToNum !== undefined && gNum !== filterToNum) return;
        if (p.price <= maxPrice && (minStars === 0 || p.stars >= minStars)) {
          html += cardResHtml(vendor, i, gNum);
        }
      });
    });
    grid.innerHTML = html || `<div class="no-results">No hay productos que cumplan los filtros seleccionados.</div>`;
  }

  function renderCarrito() {
    const area = document.getElementById('carrito-area');
    if (!area) return;

    if (cart.length === 0) {
      area.innerHTML = `
        <div style="width:100%;display:flex;flex-direction:column;align-items:center;">
          <div style="align-self:flex-start;">
            <button class="btn-volver" onclick="goTo('resultados')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Volver a productos
            </button>
          </div>
          <div class="empty-cart">
            <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6L18 2z" stroke-linecap="round" stroke-linejoin="round"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <p>Tu carrito está vacío.<br>¡Agrega productos desde las tiendas!</p>
          </div>
        </div>`;
      return;
    }

    const { maxPrice, minStars } = state.carrito;
    const checked = getChecked('carrito');
    const visible = cart.filter(item => {
      const vendorOk = checked.length === 0 || checked.includes(item.vendor);
      const priceOk  = item.price <= maxPrice;
      const starsOk  = minStars === 0 || item.stars >= minStars;
      return vendorOk && priceOk && starsOk;
    });

    let html = '';
    if (visible.length === 0) {
      html = `<div class="no-results">No hay productos en el carrito que cumplan los filtros.</div>`;
    } else {
      html = visible.map(item => cardCartHtml(item)).join('');
    }

    const total = cart.reduce((s, i) => s + i.price * (cartQty[i.key] || 1), 0);
    const pagoEl = document.getElementById('pago-total');
    if (pagoEl) pagoEl.textContent = '$ ' + total;

    const visibleKeys = visible.map(i => i.key).join(',');
    const visibleTotal = visible.reduce((s, i) => s + i.price * (cartQty[i.key] || 1), 0);
    area.innerHTML = `
      <div style="width:100%;">
        <div class="cart-header">
          <button class="btn-volver" onclick="goTo('resultados')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver a productos
          </button>
          <div class="cart-title" style="margin-bottom:0">Carrito (${cart.length} producto${cart.length !== 1 ? 's' : ''}${visible.length < cart.length ? ', mostrando ' + visible.length : ''})</div>
        </div>
        <div class="products-grid">${html}</div>
        <button class="btn-pagar-todo" onclick="pagarTodo('${visibleKeys}')">Pagar todo ($ ${visibleTotal})</button>
      </div>`;
  }

  function onSliderPage(pageId, el) {
    const v = parseInt(el.value);
    state[pageId].maxPrice = v;
    document.getElementById('pv-' + pageId).textContent = '$ ' + v;
    if (pageId === 'res') renderResultados();
    else renderCarrito();
  }

  function onVendorPage(pageId) {
    if (pageId === 'res') renderResultados();
    else renderCarrito();
  }

  function onRatingClick(el, pageId) {
    const minVal = parseInt(el.dataset.min);
    if (el.classList.contains('active')) {
      el.classList.remove('active');
      state[pageId].minStars = 0;
      document.querySelector('#rating-list-' + pageId + ' .all-ratings-lbl').classList.add('active');
    } else {
      document.querySelectorAll('#rating-list-' + pageId + ' .rating-filter-item').forEach(li => li.classList.remove('active'));
      document.querySelectorAll('#rating-list-' + pageId + ' .all-ratings-lbl').forEach(lbl => lbl.classList.remove('active'));
      el.classList.add('active');
      state[pageId].minStars = minVal;
    }
    if (pageId === 'res') renderResultados();
    else renderCarrito();
  }

  function onRatingAll(pageId) {
    document.querySelectorAll('#rating-list-' + pageId + ' .rating-filter-item').forEach(li => li.classList.remove('active'));
    document.querySelectorAll('#rating-list-' + pageId + ' .all-ratings-lbl').forEach(lbl => lbl.classList.add('active'));
    state[pageId].minStars = 0;
    if (pageId === 'res') renderResultados();
    else renderCarrito();
  }

  function initPage(pageId) {
    state[pageId].maxPrice = 100;
    state[pageId].minStars = 0;
    const sl = document.getElementById('sl-' + pageId);
    const pv = document.getElementById('pv-' + pageId);
    if (sl) sl.value = 100;
    if (pv) pv.textContent = '$ 100';
    allVendors.forEach(v => {
      const el = document.getElementById(pageId + '-chk-' + v);
      if (el) el.checked = false;
    });
    document.querySelectorAll('#rating-list-' + pageId + ' .rating-filter-item').forEach(li => li.classList.remove('active'));
    document.querySelectorAll('#rating-list-' + pageId + ' .all-ratings-lbl').forEach(lbl => lbl.classList.add('active'));
  }

  let pendingPayKeys = [];

  function pagarItem(key) {
    pendingPayKeys = [key];
    goTo('pago');
  }

  function pagarTodo(keysStr) {
    pendingPayKeys = keysStr ? keysStr.split(',') : [];
    goTo('pago');
  }

  function finalizarPago() {
    pendingPayKeys.forEach(k => {
      const idx = cart.findIndex(c => c.key === k);
      if (idx !== -1) cart.splice(idx, 1);
      delete cartQty[k];
    });
    pendingPayKeys = [];
    goTo('exitosa');
  }

  function changeQty(key, delta) {
    const current = cartQty[key] || 1;
    const next = Math.max(1, current + delta);
    cartQty[key] = next;
    renderCarrito();
  }

  function addToCart(vendor, idx) {
    const key = vendor + '_' + idx;
    if (!cart.some(c => c.key === key)) {
      const p = catalog[vendor][idx];
      const fp = flatProducts.find(f => f.vendor === vendor && f.idx === idx);
      cart.push({ key, vendor, idx, globalNum: fp ? fp.globalNum : '?', ...p });
    }
    if (document.querySelector('.page.active')?.id === 'page-resultados') {
      renderResultados();
    }
  }

  /* ═══════════════════════════════
     BÚSQUEDA POR IMAGEN — MODAL
  ═══════════════════════════════ */
  function abrirBusquedaImagen() {
    if (imgSearchThumbNums.length === 0) {
      const nums = [];
      while (nums.length < 5) {
        const r = Math.floor(Math.random() * 30) + 1;
        if (!nums.includes(r)) nums.push(r);
      }
      imgSearchThumbNums = nums;
    }

    const thumbsContainer = document.getElementById('img-thumbnails');
    thumbsContainer.innerHTML = imgSearchThumbNums.map(num => {
      const fp = flatProducts[num - 1];
      const isSelected = imgSearchSelectedNum === num;
      return `<div class="img-thumb ${isSelected ? 'selected' : ''}" onclick="seleccionarMiniatura(${num})" title="Producto #${num}">
        <img src="assets/${fp.img}" alt="${fp.name}" onerror="this.style.display='none'">
        <div class="thumb-num">${num}</div>
      </div>`;
    }).join('');

    document.getElementById('img-search-error').classList.remove('show');
    document.getElementById('btn-limpiar-busqueda').style.display = imgSearchResult ? 'block' : 'none';
    document.getElementById('img-search-overlay').style.display = 'flex';
  }

  function cerrarBusquedaImagen() {
    document.getElementById('img-search-overlay').style.display = 'none';
  }

  function handleOverlayClick(e) {
    if (e.target === document.getElementById('img-search-overlay')) {
      cerrarBusquedaImagen();
    }
  }

  function seleccionarMiniatura(num) {
    imgSearchSelectedNum = num;
    document.getElementById('img-search-num').value = '';
    document.querySelectorAll('.img-thumb').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.img-thumb').forEach(el => {
      if (parseInt(el.getAttribute('onclick').match(/\d+/)[0]) === num) {
        el.classList.add('selected');
      }
    });
    document.getElementById('img-search-error').classList.remove('show');
  }

  function ejecutarBusquedaImagen() {
    const numInput = document.getElementById('img-search-num');
    const numVal = parseInt(numInput.value);
    const errorEl = document.getElementById('img-search-error');
    errorEl.classList.remove('show');

    let targetNum = null;

    if (numInput.value.trim() !== '') {
      if (isNaN(numVal) || numVal < 1 || numVal > 30) {
        errorEl.classList.add('show');
        return;
      }
      targetNum = numVal;
      imgSearchSelectedNum = null;
    } else if (imgSearchSelectedNum !== null) {
      targetNum = imgSearchSelectedNum;
    } else {
      errorEl.classList.add('show');
      return;
    }

    imgSearchResult = flatProducts[targetNum - 1];
    document.getElementById('btn-limpiar-busqueda').style.display = 'block';
    cerrarBusquedaImagen();
    goTo('resultados');
    renderResultados(targetNum);
  }

  function limpiarBusquedaImagen() {
    imgSearchSelectedNum = null;
    imgSearchResult = null;
    imgSearchThumbNums = [];
    document.getElementById('img-search-num').value = '';
    document.getElementById('img-search-error').classList.remove('show');
    document.getElementById('btn-limpiar-busqueda').style.display = 'none';

    cerrarBusquedaImagen();
    goTo('resultados');
    renderResultados();
  }

  /* ═══════════════════════════════
     HISTORIAL — MODAL CON GRÁFICA
  ═══════════════════════════════ */
  let historialChartInstance = null;

  function abrirHistorial() {
    document.getElementById('historial-overlay').style.display = 'flex';

    if (historialChartInstance) {
      historialChartInstance.destroy();
      historialChartInstance = null;
    }

    const labels = Array.from({length: 30}, (_, i) => i + 1);
    const data = [
      510, 200, 375, 225, 260, 340, 355, 410, 445, 340,
      310, 260, 240, 415, 430, 425, 500, 580, 235, 340,
      385, 360, 500, 250, 495, 510, 530, 560, 395, 500
    ];

    const ctx = document.getElementById('historial-chart').getContext('2d');
    historialChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Compras internacionales',
          data: data,
          backgroundColor: '#9d008b',
          borderRadius: 3,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false },
          title: { display: false }
        },
        scales: {
          x: {
            title: { display: true, text: 'Producto', font: { family: 'Nunito', weight: '700' } },
            grid: { display: false },
            ticks: { font: { family: 'Nunito', size: 10 } }
          },
          y: {
            title: { display: true, text: 'Compras internacionales', font: { family: 'Nunito', weight: '700' } },
            min: 0, max: 600,
            grid: { color: '#eee' },
            ticks: { font: { family: 'Nunito', size: 10 } }
          }
        }
      }
    });
  }

  function cerrarHistorial(e) {
    if (!e || e.target === document.getElementById('historial-overlay') || e.type === 'click') {
      document.getElementById('historial-overlay').style.display = 'none';
    }
  }

  /* ═══════════════════════════════
     headerEGACIÓN
  ═══════════════════════════════ */
  function goTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    closeDD();

    if (page === 'resultados') {
      initPage('res');
      if (imgSearchResult) {
        renderResultados(imgSearchResult.globalNum);
      } else {
        renderResultados();
      }
    }
    if (page === 'carrito') {
      initPage('carrito');
      renderCarrito();
    }
    if (page === 'pago') {
      const total = pendingPayKeys.length > 0
        ? cart.filter(i => pendingPayKeys.includes(i.key)).reduce((s, i) => s + i.price * (cartQty[i.key] || 1), 0)
        : cart.reduce((s, i) => s + i.price * (cartQty[i.key] || 1), 0);
      const pagoEl = document.getElementById('pago-total');
      if (pagoEl) pagoEl.textContent = '$ ' + total;
    }
  }

  /* ═══════════════════════════════
     DROPDOWN
  ═══════════════════════════════ */
  function toggleDD(id) {
    const dd = document.getElementById(id);
    const wasOpen = dd.classList.contains('open');
    closeDD();
    if (!wasOpen) dd.classList.add('open');
  }
  function closeDD() {
    document.querySelectorAll('.user-dropdown').forEach(d => d.classList.remove('open'));
  }
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.header-user-area')) closeDD();
  });

  /* ═══════════════════════════════
     VALIDACIÓN — helpers
  ═══════════════════════════════ */
  function showErr(id) { const el = document.getElementById(id); if (el) { el.classList.add('show'); } }
  function hideErr(id) { const el = document.getElementById(id); if (el) { el.classList.remove('show'); } }
  function setError(inputId, hasError) {
    const el = document.getElementById(inputId);
    if (!el) return;
    if (hasError) el.classList.add('input-error');
    else el.classList.remove('input-error');
  }

  /* ── LOGIN ── */
  function validarLogin() {
    let ok = true;
    const user = document.getElementById('login-user');
    const pass = document.getElementById('login-pass');
    hideErr('err-login-user'); hideErr('err-login-pass'); hideErr('err-login-pass-len');
    setError('login-user', false); setError('login-pass', false);
    if (!user.value.trim()) { showErr('err-login-user'); setError('login-user', true); ok = false; }
    if (!pass.value) { showErr('err-login-pass'); setError('login-pass', true); ok = false; }
    else if (pass.value.length < 8) { showErr('err-login-pass-len'); setError('login-pass', true); ok = false; }
    if (ok) {
      sesionIniciada = true;
      goTo('resultados');
    }
  }

  /* ── REGISTRO ── */
  function checkPwdStrength() {
    const pwd = document.getElementById('reg-pass').value;
    const toggle = (id, cond) => {
      const el = document.getElementById(id);
      if (el) cond ? el.classList.add('ok') : el.classList.remove('ok');
    };
    toggle('chk-len',     pwd.length >= 8);
    toggle('chk-upper',   /[A-Z]/.test(pwd));
    toggle('chk-lower',   /[a-z]/.test(pwd));
    toggle('chk-special', /[^A-Za-z0-9]/.test(pwd));
  }

  function validarRegistro() {
    let ok = true;
    const user  = document.getElementById('reg-user');
    const pass  = document.getElementById('reg-pass');
    const pass2 = document.getElementById('reg-pass2');
    ['err-reg-user','err-reg-pass','err-reg-pass2','err-reg-pass-match'].forEach(hideErr);
    ['reg-user','reg-pass','reg-pass2'].forEach(id => setError(id, false));
    if (!user.value.trim()) { showErr('err-reg-user'); setError('reg-user', true); ok = false; }
    const pwd = pass.value;
    if (!pwd) { showErr('err-reg-pass'); setError('reg-pass', true); ok = false; }
    else {
      const pwdOk = pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);
      if (!pwdOk) { setError('reg-pass', true); ok = false; }
    }
    if (!pass2.value) { showErr('err-reg-pass2'); setError('reg-pass2', true); ok = false; }
    else if (pass2.value !== pass.value) { showErr('err-reg-pass-match'); setError('reg-pass2', true); ok = false; }
    if (ok) {
      document.getElementById('modal-registro').style.display = 'flex';
    }
  }

  function cerrarModalRegistro() {
    document.getElementById('modal-registro').style.display = 'none';
    goTo('login');
  }

  /* ── PAGO ── */
  function validarPago() {
    let ok = true;
    const campos = [
      { id: 'pago-nombre', errEmpty: 'err-pago-nombre' },
      { id: 'pago-dir',    errEmpty: 'err-pago-dir'    },
      { id: 'pago-ciudad', errEmpty: 'err-pago-ciudad'  },
    ];
    ['err-pago-nombre','err-pago-email-empty','err-pago-email-at',
     'err-pago-dir','err-pago-ciudad',
     'err-pago-cp-empty','err-pago-cp-len',
     'err-pago-tel-empty','err-pago-tel-len','err-pago-medio'].forEach(hideErr);
    ['pago-nombre','pago-email','pago-dir','pago-ciudad','pago-cp','pago-tel'].forEach(id => setError(id, false));
    campos.forEach(c => {
      const el = document.getElementById(c.id);
      if (!el || !el.value.trim()) { showErr(c.errEmpty); setError(c.id, true); ok = false; }
    });
    const email = document.getElementById('pago-email');
    if (!email.value.trim()) { showErr('err-pago-email-empty'); setError('pago-email', true); ok = false; }
    else if (!email.value.includes('@')) { showErr('err-pago-email-at'); setError('pago-email', true); ok = false; }
    const cp = document.getElementById('pago-cp');
    if (!cp.value.trim()) { showErr('err-pago-cp-empty'); setError('pago-cp', true); ok = false; }
    else if (cp.value.replace(/\D/g,'').length !== 6) { showErr('err-pago-cp-len'); setError('pago-cp', true); ok = false; }
    const tel = document.getElementById('pago-tel');
    if (!tel.value.trim()) { showErr('err-pago-tel-empty'); setError('pago-tel', true); ok = false; }
    else if (tel.value.replace(/\D/g,'').length !== 10) { showErr('err-pago-tel-len'); setError('pago-tel', true); ok = false; }
    const medioSel = document.querySelector('input[name="medio"]:checked');
    if (!medioSel) { showErr('err-pago-medio'); ok = false; }
    if (ok) finalizarPago();
  }