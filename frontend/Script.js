  /* ═══════════════════════════════
     CONFIGURACIÓN API
  ═══════════════════════════════ */
  // En producción cambia esta URL por la de tu servidor desplegado
  // Ej: 'https://nombre-app-node.onrender.com'
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://chipsail.onrender.com'; // ← Pon aquí la URL de Render

  /* ═══════════════════════════════
     RAPIDAPI — Búsqueda real de productos
  ═══════════════════════════════ */
  const RAPIDAPI_KEY = '8663f4f0e4mshdaea7cd21829339p10ddb7jsn4e4a3678c3e9';
  const RAPIDAPI_HOST = 'real-time-product-search.p.rapidapi.com';

  // Tiendas que queremos mostrar (se filtra del resultado de Google Shopping)
  const STORES_FILTER = ['aliexpress', 'ebay', 'temu', 'shein'];

  // Busca productos reales en la API
  async function fetchProductos(query) {
    const url = `https://real-time-product-search.p.rapidapi.com/search?q=${encodeURIComponent(query)}&country=us&language=es&limit=40&sort_by=BEST_MATCH`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      }
    });
    if (!res.ok) throw new Error('Error API: ' + res.status);
    const data = await res.json();
    console.log('RAW API:', JSON.stringify(data).slice(0, 800));
    if (Array.isArray(data))            return data;
    if (Array.isArray(data.data?.products)) return data.data.products;
    if (Array.isArray(data.data))           return data.data;
    if (Array.isArray(data.products))   return data.products;
    if (Array.isArray(data.results))    return data.results;
    if (Array.isArray(data.items))      return data.items;
    console.warn('Estructura desconocida:', Object.keys(data));
    return [];
  }

  // Convierte resultado de API al formato interno de ChipSail
  function apiProductToCard(item, idx) {
    // Detectar tienda desde la URL o nombre de tienda
    const storeName = (item.store_name || item.offer?.store_name || '').toLowerCase();
    const storeUrl  = (item.product_page_url || '').toLowerCase();

    let vendor = 'otros';
    if (storeName.includes('aliexpress') || storeUrl.includes('aliexpress')) vendor = 'aliexpress';
    else if (storeName.includes('ebay')  || storeUrl.includes('ebay'))       vendor = 'ebay';
    else if (storeName.includes('temu')  || storeUrl.includes('temu'))       vendor = 'temu';
    else if (storeName.includes('shein') || storeUrl.includes('shein'))      vendor = 'shein';

    const price = parseFloat(
      (item.typical_price_range?.[0] || item.offer?.price || item.price || '0')
        .toString().replace(/[^0-9.]/g, '')
    ) || 0;

    return {
      vendor,
      idx,
      globalNum: idx + 1,
      name     : item.product_title || item.title || 'Producto',
      desc     : item.product_description?.slice(0, 80) || item.description?.slice(0, 80) || '',
      price    : price,
      stars    : Math.round(parseFloat(item.product_rating || item.rating || 4)),
      count    : parseInt(item.product_num_reviews || item.reviews || 0),
      img      : item.product_photos?.[0] || item.thumbnail || '',
      url      : item.product_page_url || item.url || '#',
      realData : true,
    };
  }

  // Estado de resultados reales
  let liveProducts = [];
  let isLoadingProducts = false;

  // Registro temporal de productos para onclick seguro (evita JSON en atributos HTML)
  const _prodRegistry = new Map();
  let _prodRegistryIdx = 0;
  function _regProd(p) {
    const key = 'p' + (_prodRegistryIdx++);
    _prodRegistry.set(key, p);
    return key;
  }

  /* ═══════════════════════════════
     COOKIES — helpers para persistir sesión
  ═══════════════════════════════ */
  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }
  function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }

  /* ═══════════════════════════════
     ESTADO DE SESIÓN
  ═══════════════════════════════ */
  // Restaurar sesión desde cookie al cargar
  let sesionIniciada = false;

  function restaurarSesion() {
    const token = getCookie('cs_token');
    const user  = getCookie('cs_user');
    if (token && user) {
      sesionIniciada = true;
      _favCache = null;
      try {
        const u = JSON.parse(user);
        document.querySelectorAll('[id="header-username"]').forEach(el => {
          el.textContent = u.username || u.email || 'Usuario';
        });
      } catch(e) {}
      // Redirigir directo a resultados si hay sesión activa
      goTo('resultados');
    }
  }

  // Ejecutar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', restaurarSesion);

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
      // Copiar texto del buscador home al buscador de resultados
      const homeInput = document.querySelector('#page-home .search-bar input');
      const resInput  = document.getElementById('search-input-res');
      if (homeInput && resInput && homeInput.value.trim()) {
        resInput.value = homeInput.value.trim();
      }
      liveProducts = []; // forzar nueva búsqueda
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
     CATÁLOGO — ropa, precios entre $10 y $100
  ═══════════════════════════════ */
  const catalog = {
    ebay: [
      { name:'eBay Vestido Floral',        desc:'Vestido ligero con estampado floral de verano',   stars:4, count:72,  price:30,  img:'26.jpg'  },
      { name:'eBay Jeans Skinny',          desc:'Jeans ajustados de alta durabilidad',              stars:3, count:45,  price:28,  img:'11.jpg'  },
      { name:'eBay Blusa Casual',          desc:'Blusa manga corta, tela suave y cómoda',           stars:5, count:103, price:18,  img:'21.jpg'  },
      { name:'eBay Chaqueta Denim',        desc:'Chaqueta de mezclilla estilo retro',               stars:4, count:61,  price:50,  img:'6.jpeg'  },
      { name:'eBay Falda Mini',            desc:'Falda corta moderna para el verano',               stars:3, count:39,  price:22,  img:'30.jpg'  },
      { name:'eBay Suéter Premium',        desc:'Suéter tejido de calidad premium',                 stars:5, count:90,  price:75,  img:'13.jpg'  },
    ],
    temu: [
      { name:'Temu Conjunto Deportivo',    desc:'Set top + leggins para entrenamiento',             stars:4, count:80,  price:18,  img:'25.jpg'  },
      { name:'Temu Camiseta Oversize',     desc:'Camiseta holgada estilo urbano',                   stars:3, count:52,  price:12,  img:'4.jpg'   },
      { name:'Temu Pantalón Cargo',        desc:'Pantalón cargo con múltiples bolsillos',           stars:4, count:67,  price:28,  img:'17.jpg'  },
      { name:'Temu Vestido Midi',          desc:'Vestido midi elegante para cualquier ocasión',     stars:5, count:111, price:38,  img:'9.jpg'   },
      { name:'Temu Top Crop',             desc:'Top corto ideal para el verano',                   stars:3, count:43,  price:14,  img:'28.jpg'  },
      { name:'Temu Shorts Casual',         desc:'Shorts cómodos para el día a día',                 stars:4, count:76,  price:10,  img:'1.jpg'   },
    ],
    aliexpress: [
      { name:'AliExpress Hoodie Unisex',   desc:'Sudadera con capucha cálida y suave',              stars:4, count:85,  price:32,  img:'14.jpg'  },
      { name:'AliExpress Vestido Boho',    desc:'Vestido estilo bohemio con bordados',              stars:3, count:58,  price:20,  img:'22.jpg'  },
      { name:'AliExpress Camisa Lino',     desc:'Camisa de lino transpirable para verano',          stars:5, count:95,  price:35,  img:'7.jpg'   },
      { name:'AliExpress Leggings Sport',  desc:'Leggings de compresión para deporte',              stars:4, count:69,  price:22,  img:'27.jpg'  },
      { name:'AliExpress Cardigan',        desc:'Cardigan largo de punto suave',                    stars:3, count:41,  price:27,  img:'10.jpg'  },
      { name:'AliExpress Blazer',          desc:'Blazer slim fit para ocasiones formales',          stars:5, count:102, price:60,  img:'24.jpg'  },
    ],
    shein: [
      { name:'Shein Vestido Fiesta',       desc:'Vestido elegante con lentejuelas para noche',      stars:4, count:77,  price:42,  img:'16.jpg'  },
      { name:'Shein Conjunto Loungewear',  desc:'Set cómodo para estar en casa o salir',            stars:3, count:49,  price:25,  img:'5.jpg'   },
      { name:'Shein Crop Top Estampado',   desc:'Top corto con estampado de moda',                  stars:5, count:118, price:15,  img:'20.jpg'  },
      { name:'Shein Jeans Mom',            desc:'Jeans estilo mom de tiro alto',                    stars:4, count:63,  price:35,  img:'2.jpg'   },
      { name:'Shein Minifalda Plisada',    desc:'Falda plisada trendy de temporada',                stars:3, count:37,  price:18,  img:'12.jpg'  },
      { name:'Shein Abrigo Oversize',      desc:'Abrigo largo oversized muy cálido',                stars:5, count:130, price:65,  img:'18.jpg'  },
    ],
  };

  const allVendors = ['ebay', 'temu', 'aliexpress', 'shein'];

  const flatProducts = [];
  allVendors.forEach(vendor => {
    catalog[vendor].forEach((p, idx) => {
      flatProducts.push({ vendor, idx, globalNum: flatProducts.length + 1, ...p });
    });
  });

  const state = {
    res: { maxPrice: 100, minStars: 0 },
  };

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
        <button class="btn-cart" onclick="abrirAnalisis({vendor:'${vendor}',idx:${idx},name:p.name,desc:p.desc,price:p.price,stars:p.stars,count:p.count,img:p.img,url:'#'})">
          🔍 Analizar producto
        </button>
        <button class="btn-historial" onclick="abrirHistorial()">Historial</button>
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

    // Si hay productos reales de la API, usarlos
    const source = liveProducts.length > 0 ? liveProducts : flatProducts;

    let html = '';
    source.forEach((p, i) => {
      const gNum = i + 1;
      if (filterToNum !== undefined && gNum !== filterToNum) return;
      const vendorOk = checked.length === 0 || checked.includes(p.vendor);
      if (!vendorOk) return;
      if (p.price > 0 && p.price > maxPrice) return;
      if (minStars > 0 && p.stars < minStars) return;
      html += p.realData ? cardApiHtml(p) : cardResHtml(p.vendor, p.idx, gNum);
    });

    grid.innerHTML = html || `<div class="no-results">No hay productos que cumplan los filtros seleccionados.</div>`;
  }

  // Tarjeta para productos reales de la API
  function cardApiHtml(p) {
    const imgHtml = p.img
      ? `<img src="${p.img}" alt="producto" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;" onerror="this.style.display='none'">`
      : `<div style="width:100%;aspect-ratio:1/1;background:#eee;display:flex;align-items:center;justify-content:center;font-size:2rem;">🛍️</div>`;
    const vendorBadge = { aliexpress:'🟠 AliExpress', ebay:'🔵 eBay', temu:'🟣 Temu', shein:'🩷 Shein', otros:'🛒 Tienda' };
    return `<div class="product-card">
      <div class="product-number-badge">${p.globalNum}</div>
      ${imgHtml}
      <div class="product-body">
        <div style="font-size:0.7rem;font-weight:600;opacity:0.7;margin-bottom:2px;">${vendorBadge[p.vendor] || p.vendor}</div>
        <div tabindex="0" class="product-name">${p.name.slice(0,60)}${p.name.length>60?'…':''}</div>
        <div tabindex="0" class="product-desc">${p.desc}</div>
        <div tabindex="0" class="product-price">${p.price > 0 ? '$ ' + p.price.toFixed(2) : 'Ver precio'}</div>
        <div tabindex="0" class="product-rating"><div class="stars-row">${starsHtml(p.stars)}</div><span class="rating-count">(${p.count})</span></div>
      </div>
      <div class="product-actions">
        <button class="btn-cart" onclick="abrirAnalisis(liveProducts[${p.idx}])">🔍 Analizar</button>
        <a href="${p.url}" target="_blank" class="btn-historial" style="text-decoration:none;text-align:center;">Ver tienda ↗</a>
      </div>
    </div>`;
  }

  // addToCartApi eliminado

  function onSliderPage(pageId, el) {
    const v = parseInt(el.value);
    state[pageId].maxPrice = v;
    document.getElementById('pv-' + pageId).textContent = '$ ' + v;
    renderResultados();
  }

  function onVendorPage(pageId) {
    renderResultados();
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
    renderResultados();
  }

  function onRatingAll(pageId) {
    document.querySelectorAll('#rating-list-' + pageId + ' .rating-filter-item').forEach(li => li.classList.remove('active'));
    document.querySelectorAll('#rating-list-' + pageId + ' .all-ratings-lbl').forEach(lbl => lbl.classList.add('active'));
    state[pageId].minStars = 0;
    renderResultados();
  }

  function initPage(pageId) {
    if (!state[pageId]) return;
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

  // pago/carrito eliminados — reemplazados por análisis

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
     ANÁLISIS DE PRODUCTO
  ═══════════════════════════════ */
  let productoAnalizado = null;
  let analisisResults   = [];
  let isLoadingAnalisis = false;

  async function abrirAnalisis(producto) {
    productoAnalizado = producto;
    setCookie('cs_analisis', JSON.stringify({
      name  : producto.name   || '',
      desc  : producto.desc   || '',
      price : producto.price  || 0,
      img   : producto.img    || '',
      vendor: producto.vendor || '',
      url   : producto.url    || '#',
      stars : producto.stars  || 0,
      count : producto.count  || 0,
    }), 1);
    analisisResults = [];
    goTo('analisis');
  }

  function buscarDesdeAnalisis() {
    const q = document.getElementById('search-input-analisis')?.value.trim();
    if (q) {
      document.getElementById('search-input-res').value = q;
      liveProducts = [];
      goTo('resultados');
    }
  }

  async function renderAnalisis() {
    const grid    = document.getElementById('grid-analisis');
    const header  = document.getElementById('analisis-header');
    const refEl   = document.getElementById('analisis-producto-ref');
    const resumen = document.getElementById('analisis-resumen');
    if (!grid) return;

    if (!productoAnalizado) {
      try {
        const saved = getCookie('cs_analisis');
        if (saved) productoAnalizado = JSON.parse(saved);
      } catch(e) {}
    }

    if (!productoAnalizado) {
      grid.innerHTML = `<div class="no-results" style="padding:60px;text-align:center;">
        Selecciona un producto desde los resultados para ver su análisis comparativo.
      </div>`;
      return;
    }

    const p = productoAnalizado;
    const vendorBadge = { aliexpress:'🟠 AliExpress', ebay:'🔵 eBay', temu:'🟣 Temu', shein:'🩷 Shein', otros:'🛒 Tienda' };

    if (refEl) refEl.innerHTML = `
      <div style="font-weight:800;font-size:0.9rem;color:var(--text-dark);margin-bottom:4px;">${(p.name||'').slice(0,50)}${(p.name||'').length>50?'…':''}</div>
      <div style="margin-bottom:4px;">${vendorBadge[p.vendor]||p.vendor||''}</div>
      <div style="color:var(--pink);font-weight:800;">$ ${p.price>0?p.price:'—'}</div>
      <div style="margin-top:4px;">${starsHtml(p.stars||0)} <span style="font-size:0.75rem;">(${p.count||0})</span></div>`;

    const imgHtmlRef = p.img
      ? (p.img.startsWith('http')
          ? `<img src="${p.img}" onerror="this.style.display='none'" style="width:90px;height:90px;object-fit:cover;border-radius:10px;flex-shrink:0;">`
          : `<img src="assets/${p.img}" style="width:90px;height:90px;object-fit:cover;border-radius:10px;flex-shrink:0;">`)
      : `<div style="width:90px;height:90px;background:#f0e0f8;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:2rem;">🛍️</div>`;

    if (header) header.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;background:var(--pink-card);border-radius:14px;padding:16px 20px;margin-bottom:6px;">
        ${imgHtmlRef}
        <div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--pink);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Analizando</div>
          <div style="font-size:1.05rem;font-weight:800;color:var(--text-dark);line-height:1.3;">${(p.name||'—').slice(0,70)}</div>
          <div style="font-size:0.82rem;color:var(--text-mid);margin-top:4px;">${(p.desc||'').slice(0,80)}</div>
        </div>
        <button class="btn-volver" style="margin-left:auto;flex-shrink:0;" onclick="goTo('resultados')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver
        </button>
      </div>
      <div style="font-size:0.78rem;color:var(--text-mid);margin-bottom:14px;padding-left:4px;">Comparando este producto en eBay, Temu, AliExpress y Shein…</div>`;

    if (analisisResults.length === 0 && !isLoadingAnalisis) {
      grid.innerHTML = `<div class="no-results" style="text-align:center;padding:40px;">⏳ Buscando comparativos en las 4 tiendas…</div>`;
      isLoadingAnalisis = true;
      const query = (p.name||'').split(' ').slice(0,4).join(' ');
      try {
        const items = await fetchProductos(query);
        analisisResults = items.map((item,i) => apiProductToCard(item,i));
      } catch(e) { analisisResults = []; }
      isLoadingAnalisis = false;
    }

    // Cache results for fast re-open from favoritos
    if (analisisResults.length > 0 && productoAnalizado) {
      try {
        const cacheKey = 'cs_analisis_cache_' + btoa(encodeURIComponent((productoAnalizado.name||''). slice(0,40))).slice(0,20);
        localStorage.setItem(cacheKey, JSON.stringify({ results: analisisResults, ts: Date.now() }));
      } catch(e) {}
    }
    const stores = ['ebay','temu','aliexpress','shein'];
    let htmlOut = '';

    if (analisisResults.length === 0) {
      stores.forEach(store => {
        flatProducts.filter(fp => fp.vendor===store).slice(0,2).forEach(fp => {
          htmlOut += cardAnalisisHtml({ vendor:store, name:fp.name, desc:fp.desc,
            price:fp.price, stars:fp.stars, count:fp.count, img:fp.img, url:'#' }, p.price);
        });
      });
    } else {
      stores.forEach(store => {
        const storeItems = analisisResults.filter(r => r.vendor===store).slice(0,3);
        if (storeItems.length === 0) {
          flatProducts.filter(fp => fp.vendor===store).slice(0,1).forEach(fp => {
            htmlOut += cardAnalisisHtml({ vendor:store, name:fp.name, desc:fp.desc,
              price:fp.price, stars:fp.stars, count:fp.count, img:fp.img, url:'#' }, p.price);
          });
        } else {
          storeItems.forEach(r => htmlOut += cardAnalisisHtml(r, p.price));
        }
      });
    }

    grid.innerHTML = htmlOut || `<div class="no-results">No se encontraron resultados comparativos.</div>`;

    const allPrices = (analisisResults.length>0 ? analisisResults : flatProducts).filter(r=>r.price>0).map(r=>r.price);
    if (allPrices.length>0 && resumen) {
      const minP = Math.min(...allPrices).toFixed(2);
      const maxP = Math.max(...allPrices).toFixed(2);
      const avgP = (allPrices.reduce((a,b)=>a+b,0)/allPrices.length).toFixed(2);
      const cheapest = (analisisResults.length>0?analisisResults:flatProducts).filter(r=>r.price>0).sort((a,b)=>a.price-b.price)[0];
      const storeL = { ebay:'eBay', temu:'Temu', aliexpress:'AliExpress', shein:'Shein', otros:'Otros' };
      resumen.innerHTML = `
        <div>💰 Precio mín: <b>$ ${minP}</b></div>
        <div>📈 Precio máx: <b>$ ${maxP}</b></div>
        <div>📊 Promedio: <b>$ ${avgP}</b></div>
        <div style="margin-top:8px;">🏆 Más barato:<br><b>${storeL[cheapest?.vendor]||'—'}</b></div>
        <div style="margin-top:4px;font-size:0.78rem;color:var(--text-mid);">${analisisResults.length} resultados encontrados</div>`;
    }
  }

  function cardAnalisisHtml(r, refPrice) {
    const vendorBadge = { aliexpress:'🟠 AliExpress', ebay:'🔵 eBay', temu:'🟣 Temu', shein:'🩷 Shein', otros:'🛒 Tienda' };
    const imgHtml = r.img
      ? (r.img.startsWith('http')
          ? `<img src="${r.img}" alt="producto" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;" onerror="this.style.display='none'">`
          : `<img src="assets/${r.img}" alt="producto" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;">`)
      : `<div style="width:100%;aspect-ratio:1/1;background:#f0e0f8;display:flex;align-items:center;justify-content:center;font-size:2.5rem;">🛍️</div>`;

    let priceDiff = '';
    if (refPrice>0 && r.price>0) {
      const diff = r.price - refPrice;
      const pct  = ((diff/refPrice)*100).toFixed(0);
      if (diff<0)      priceDiff = `<span style="background:#d4edda;color:#155724;border-radius:6px;padding:2px 7px;font-size:0.72rem;font-weight:800;">▼ ${Math.abs(pct)}% más barato</span>`;
      else if (diff>0) priceDiff = `<span style="background:#f8d7da;color:#721c24;border-radius:6px;padding:2px 7px;font-size:0.72rem;font-weight:800;">▲ ${pct}% más caro</span>`;
      else             priceDiff = `<span style="background:#e2e3e5;color:#383d41;border-radius:6px;padding:2px 7px;font-size:0.72rem;font-weight:800;">≈ Mismo precio</span>`;
    }

    const url = r.url && r.url!=='#' ? r.url : null;
    return `<div class="product-card">
      ${imgHtml}
      <div class="product-body">
        <div style="font-size:0.7rem;font-weight:700;opacity:0.75;margin-bottom:3px;">${vendorBadge[r.vendor]||r.vendor}</div>
        <div class="product-name" tabindex="0">${(r.name||'').slice(0,60)}${(r.name||'').length>60?'…':''}</div>
        <div class="product-desc" tabindex="0">${(r.desc||'').slice(0,70)}</div>
        <div class="product-price" tabindex="0">${r.price>0?'$ '+r.price.toFixed(2):'Ver precio'}</div>
        ${priceDiff ? `<div style="margin:4px 0;">${priceDiff}</div>` : ''}
        <div class="product-rating" tabindex="0"><div class="stars-row">${starsHtml(r.stars||0)}</div><span class="rating-count">(${r.count||0})</span></div>
      </div>
      <div class="product-actions">
        <button class="btn-fav ${esFavorito(r)?'btn-fav-active':''}" data-pkey="${_regProd(r)}" onclick="toggleFavoritoKey(this.dataset.pkey, this)">${esFavorito(r)?'♥ En favoritos':'♡ Guardar'}</button>
        ${url ? `<a href="${url}" target="_blank" class="btn-historial" style="text-decoration:none;text-align:center;display:block;">Ver en tienda ↗</a>` : ''}
      </div>
    </div>`;
  }


  /* ═══════════════════════════════
     FAVORITOS — por usuario vía API
  ═══════════════════════════════ */

  // Helper: devuelve el token JWT del usuario activo
  function getAuthToken() {
    return getCookie('cs_token') || '';
  }

  // Helper: cabeceras con JWT
  function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getAuthToken() };
  }

  // ID único del favorito (igual que antes, para compatibilidad)
  function productoFavId(p) {
    return (p.url && p.url !== '#') ? p.url : (p.name + '|' + p.vendor);
  }

  // Caché en memoria de los favoritos del usuario activo (para esFavorito() síncrono)
  let _favCache = null;   // null = no cargado aún; [] = cargado y vacío

  async function cargarFavoritosAPI() {
    try {
      const res = await fetch(`${API_URL}/api/favoritos`, { headers: authHeaders() });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      _favCache = data.favoritos || [];
    } catch(e) {
      console.warn('No se pudieron cargar favoritos:', e.message);
      _favCache = [];
    }
    return _favCache;
  }

  function esFavorito(p) {
    if (!_favCache) return false;
    const id = productoFavId(p);
    return _favCache.some(f => f._favId === id);
  }

  async function toggleFavorito(p, btn) {
    const id = productoFavId(p);
    const yaFav = esFavorito(p);

    // Optimistic UI
    if (yaFav) {
      _favCache = (_favCache || []).filter(f => f._favId !== id);
      if (btn) { btn.textContent = '♡ Guardar'; btn.classList.remove('btn-fav-active'); }
      mostrarToast('Eliminado de favoritos');
    } else {
      const nuevo = { ...p, _favId: id, _favDate: Date.now() };
      _favCache = [nuevo, ...(_favCache || [])];
      if (btn) { btn.textContent = '♥ En favoritos'; btn.classList.add('btn-fav-active'); }
      mostrarToast('¡Guardado en favoritos! ♥');
    }

    // Llamada a la API
    try {
      if (yaFav) {
        await fetch(`${API_URL}/api/favoritos/${encodeURIComponent(id)}`, {
          method: 'DELETE', headers: authHeaders()
        });
      } else {
        await fetch(`${API_URL}/api/favoritos`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ _favId: id, vendor: p.vendor||'', name: p.name||'',
            desc: p.desc||'', price: p.price||0, stars: p.stars||0,
            count: p.count||0, img: p.img||'', url: p.url||'' })
        });
      }
    } catch(e) {
      console.warn('Error al sincronizar favorito:', e.message);
    }
  }

  function toggleFavoritoKey(key, btn) {
    const p = _prodRegistry.get(key);
    if (!p) { console.warn('Producto no encontrado en registro:', key); return; }
    toggleFavorito(p, btn);
  }

  async function limpiarFavoritos() {
    if (!confirm('¿Borrar todos tus favoritos?')) return;
    const favs = _favCache || [];
    _favCache = [];
    // Borrar uno a uno en la API
    await Promise.allSettled(favs.map(f =>
      fetch(`${API_URL}/api/favoritos/${encodeURIComponent(f._favId)}`, {
        method: 'DELETE', headers: authHeaders()
      })
    ));
    renderFavoritos();
    mostrarToast('Favoritos borrados');
  }

  let favSort = 'date';
  function setFavSort(s) {
    favSort = s;
    document.querySelectorAll('.fav-sort-btn').forEach(b => b.classList.remove('active'));
    const el = document.getElementById('fav-sort-' + s);
    if (el) el.classList.add('active');
    renderFavoritos();
  }

    function buscarDesdeFavoritos() {
    const q = document.getElementById('search-input-favoritos')?.value.trim();
    if (q) {
      document.getElementById('search-input-res').value = q;
      liveProducts = [];
      goTo('resultados');
    }
  }

  function renderFavoritos() {
    const grid   = document.getElementById('grid-favoritos');
    const header = document.getElementById('fav-header');
    const count  = document.getElementById('fav-sidebar-count');
    if (!grid) return;

    let favs = _favCache || [];

    if (count) count.textContent = `${favs.length} producto${favs.length!==1?'s':''} guardado${favs.length!==1?'s':''}`;

    if (favs.length === 0) {
      if (header) header.innerHTML = '';
      grid.innerHTML = `
        <div class="empty-fav">
          <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M40 65 L12 37 A16 16 0 0 1 35 14 L40 19 L45 14 A16 16 0 0 1 68 37 Z"/>
          </svg>
          <p>Aún no tienes favoritos</p>
          <span>Analiza un producto y guárdalo con ♡ Guardar</span>
          <button class="btn-cart" style="max-width:200px;margin-top:12px;" onclick="goTo('resultados')">Ir a buscar</button>
        </div>`;
      return;
    }

    // Ordenar
    if (favSort === 'price') favs = [...favs].sort((a,b) => (a.price||999)-(b.price||999));
    else if (favSort === 'stars') favs = [...favs].sort((a,b) => (b.stars||0)-(a.stars||0));
    else favs = [...favs].sort((a,b) => (b._favDate||0)-(a._favDate||0));

    // Agrupar por producto base (nombre similar) para la comparativa entre tiendas
    // Mostrar cada favorito como tarjeta expandida con su información de análisis
    if (header) header.innerHTML = `
      <div style="background:var(--pink-card);border-radius:14px;padding:14px 18px;margin-bottom:6px;display:flex;align-items:center;gap:12px;">
        <svg style="width:28px;height:28px;flex-shrink:0;" viewBox="0 0 24 24" fill="var(--pink)" stroke="var(--pink)" stroke-width="1">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
        <div>
          <div style="font-size:1rem;font-weight:800;color:var(--text-dark);">Mis Favoritos</div>
          <div style="font-size:0.8rem;color:var(--text-mid);">${favs.length} producto${favs.length!==1?'s':''} comparables entre tiendas</div>
        </div>
      </div>`;

    const vendorBadge = { aliexpress:'🟠 AliExpress', ebay:'🔵 eBay', temu:'🟣 Temu', shein:'🩷 Shein', otros:'🛒 Tienda' };
    let html = '';
    favs.forEach((p, i) => {
      const id = p._favId;
      const imgHtml = p.img
        ? (p.img.startsWith('http')
            ? `<img src="${p.img}" alt="producto" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;" onerror="this.style.display='none'">`
            : `<img src="assets/${p.img}" alt="producto" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;">`)
        : `<div style="width:100%;aspect-ratio:1/1;background:#f0e0f8;display:flex;align-items:center;justify-content:center;font-size:2.5rem;">🛍️</div>`;
      const url = p.url && p.url !== '#' ? p.url : null;
      const savedAt = p._favDate ? new Date(p._favDate).toLocaleDateString('es-CO', {day:'2-digit',month:'short'}) : '';
      html += `<div class="product-card fav-card">
        ${imgHtml}
        <div class="product-body">
          <div style="font-size:0.7rem;font-weight:700;opacity:0.75;margin-bottom:3px;">${vendorBadge[p.vendor]||p.vendor||'Tienda'}</div>
          <div class="product-name" tabindex="0">${(p.name||'').slice(0,60)}${(p.name||'').length>60?'…':''}</div>
          <div class="product-desc" tabindex="0">${(p.desc||'').slice(0,70)}</div>
          <div class="product-price" tabindex="0">${p.price>0?'$ '+parseFloat(p.price).toFixed(2):'Ver precio'}</div>
          <div class="product-rating" tabindex="0"><div class="stars-row">${starsHtml(p.stars||0)}</div><span class="rating-count">(${p.count||0})</span></div>
          ${savedAt ? `<div style="font-size:0.7rem;color:var(--text-mid);margin-top:4px;">Guardado el ${savedAt}</div>` : ''}
        </div>
        <div class="product-actions">
          <button class="btn-cart" onclick="verComparativaFav(${i})">🔍 Ver comparativa</button>
          <button class="btn-fav btn-fav-active" onclick="quitarFavoritoIdx(${i}, this)">♥ Quitar</button>
          ${url ? `<a href="${url}" target="_blank" class="btn-historial" style="text-decoration:none;text-align:center;display:block;">Ver en tienda ↗</a>` : ''}
        </div>
      </div>`;
    });
    grid.innerHTML = html;
  }

  function quitarFavoritoIdx(i, btn) {
    let sorted = [...(_favCache || [])];
    if (favSort === 'price') sorted.sort((a,b)=>(a.price||999)-(b.price||999));
    else if (favSort === 'stars') sorted.sort((a,b)=>(b.stars||0)-(a.stars||0));
    else sorted.sort((a,b)=>(b._favDate||0)-(a._favDate||0));
    const toRemove = sorted[i];
    if (!toRemove) return;
    toggleFavorito(toRemove, null).then(() => renderFavoritos());
  }

  function verComparativaFav(i) {
    let favs = [...(_favCache || [])];
    if (favSort === 'price') favs.sort((a,b)=>(a.price||999)-(b.price||999));
    else if (favSort === 'stars') favs.sort((a,b)=>(b.stars||0)-(a.stars||0));
    else favs.sort((a,b)=>(b._favDate||0)-(a._favDate||0));
    const p = favs[i];
    if (!p) return;
    // Check if we have cached analysis data
    const cacheKey = 'cs_analisis_cache_' + btoa(encodeURIComponent((p.name||'').slice(0,40))).slice(0,20);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        productoAnalizado = p;
        analisisResults = data.results || [];
        goTo('analisis');
        return;
      } catch(e) {}
    }
    // No cache — go to analysis page (will fetch)
    productoAnalizado = p;
    analisisResults = [];
    goTo('analisis');
  }

  /* ═══════════════════════════════
     NAVEGACIÓN
  ═══════════════════════════════ */
  function goTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    closeDD();

    if (page === 'resultados') {
      initPage('res');
      // Leer el texto del buscador
      const inputEl = document.getElementById('search-input-res');
      const query = inputEl ? inputEl.value.trim() : '';

      if (query && !isLoadingProducts) {
        const grid = document.getElementById('grid-res');
        if (grid) grid.innerHTML = `<div class="no-results" style="text-align:center;padding:40px;">🔍 Buscando "${query}" en AliExpress, eBay, Temu, Shein...</div>`;
        isLoadingProducts = true;
        fetchProductos(query)
          .then(items => {
            liveProducts = items.map((item, i) => apiProductToCard(item, i));
            isLoadingProducts = false;
            renderResultados();
          })
          .catch(err => {
            console.error('API Error:', err);
            isLoadingProducts = false;
            liveProducts = [];
            renderResultados(); // fallback al catálogo estático
          });
      } else if (imgSearchResult) {
        renderResultados(imgSearchResult.globalNum);
      } else {
        renderResultados();
      }
    }
    if (page === 'analisis') {
      analisisResults = [];
      // Precargar caché de favoritos para que los botones ♥ sean correctos
      if (_favCache === null) {
        cargarFavoritosAPI().then(() => renderAnalisis());
      } else {
        renderAnalisis();
      }
    }
    if (page === 'favoritos') {
      const grid = document.getElementById('grid-favoritos');
      if (grid) grid.innerHTML = '<div class="no-results" style="text-align:center;padding:60px;">⏳ Cargando favoritos…</div>';
      cargarFavoritosAPI().then(() => renderFavoritos());
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

  // Buscar al presionar Enter en el input de resultados
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.activeElement?.id === 'search-input-res') {
      liveProducts = [];
      goTo('resultados');
    }
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
  async function validarLogin() {
    let ok = true;
    const userEl = document.getElementById('login-user');
    const passEl = document.getElementById('login-pass');
    hideErr('err-login-user'); hideErr('err-login-pass'); hideErr('err-login-pass-len');
    setError('login-user', false); setError('login-pass', false);
    if (!userEl.value.trim()) { showErr('err-login-user'); setError('login-user', true); ok = false; }
    if (!passEl.value) { showErr('err-login-pass'); setError('login-pass', true); ok = false; }
    else if (passEl.value.length < 8) { showErr('err-login-pass-len'); setError('login-pass', true); ok = false; }
    if (!ok) return;

    // Llamada al backend
    const btn = document.querySelector('#page-login .btn-auth');
    if (btn) { btn.disabled = true; btn.textContent = 'Verificando...'; }
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ username: userEl.value.trim(), password: passEl.value }),
      });
      const data = await res.json();
      if (res.ok) {
        setCookie('cs_token', data.token, 30);
        setCookie('cs_user',  JSON.stringify(data.user), 30);
        sesionIniciada = true;
        _favCache = null; // forzar recarga de favoritos al iniciar sesión
        try {
          const nameEl = document.getElementById('header-username');
          if (nameEl) nameEl.textContent = data.user?.username || data.user?.email || 'Usuario';
        } catch(e) {}
        goTo('resultados');
      } else {
        // Mostrar error del servidor en el campo de usuario
        const errEl = document.getElementById('err-login-user');
        if (errEl) { errEl.textContent = data.error || 'Credenciales incorrectas'; showErr('err-login-user'); }
        setError('login-user', true);
      }
    } catch {
      const errEl = document.getElementById('err-login-user');
      if (errEl) { errEl.textContent = 'No se pudo conectar al servidor'; showErr('err-login-user'); }
      setError('login-user', true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
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

  async function validarRegistro() {
    let ok = true;
    const user    = document.getElementById('reg-user');
    const emailEl = document.getElementById('reg-email');
    const pass    = document.getElementById('reg-pass');
    const pass2   = document.getElementById('reg-pass2');
    ['err-reg-user','err-reg-email','err-reg-pass','err-reg-pass2','err-reg-pass-match'].forEach(hideErr);
    ['reg-user','reg-email','reg-pass','reg-pass2'].forEach(id => setError(id, false));
    if (!user.value.trim()) { showErr('err-reg-user'); setError('reg-user', true); ok = false; }
    if (!emailEl || !emailEl.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
      showErr('err-reg-email'); setError('reg-email', true); ok = false;
    }
    const pwd = pass.value;
    if (!pwd) { showErr('err-reg-pass'); setError('reg-pass', true); ok = false; }
    else {
      const pwdOk = pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);
      if (!pwdOk) { setError('reg-pass', true); ok = false; }
    }
    if (!pass2.value) { showErr('err-reg-pass2'); setError('reg-pass2', true); ok = false; }
    else if (pass2.value !== pass.value) { showErr('err-reg-pass-match'); setError('reg-pass2', true); ok = false; }
    if (!ok) return;

    // Llamada al backend
    const btn = document.querySelector('#page-registro .btn-auth');
    if (btn) { btn.disabled = true; btn.textContent = 'Registrando...'; }
    try {
      const emailVal = emailEl ? emailEl.value.trim() : `${user.value.trim()}@chipsail.com`;
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ username: user.value.trim(), email: emailVal, password: pwd }),
      });
      const data = await res.json();
      if (res.ok) {
        setCookie('cs_token', data.token, 30);
        setCookie('cs_user',  JSON.stringify(data.user), 30);
        document.getElementById('modal-registro').style.display = 'flex';
      } else {
        const errEl = document.getElementById('err-reg-user');
        if (errEl) { errEl.textContent = data.error || 'Error al registrar'; showErr('err-reg-user'); }
        setError('reg-user', true);
      }
    } catch {
      const errEl = document.getElementById('err-reg-user');
      if (errEl) { errEl.textContent = 'No se pudo conectar al servidor'; showErr('err-reg-user'); }
      setError('reg-user', true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Register'; }
    }
  }

  function cerrarModalRegistro() {
    document.getElementById('modal-registro').style.display = 'none';
    goTo('login');
  }

  // validarPago eliminado
