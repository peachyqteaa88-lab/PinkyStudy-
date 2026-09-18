/* ====================================================================
   PINKYSTUDY - Full Interactive E-Commerce + Service + Admin
   All features 100% functional
   ==================================================================== */

/* ====== STORAGE ====== */
const DB = {
  get(k, fb){ try{ const v = localStorage.getItem('ps_'+k); return v ? JSON.parse(v) : fb; }catch(e){ return fb; } },
  set(k, v){ localStorage.setItem('ps_'+k, JSON.stringify(v)); }
};
const uid = (p='') => p + Date.now().toString(36) + Math.random().toString(36).slice(2,6);

/* ====== HELPERS ====== */
const rp = n => 'Rp' + (n||0).toLocaleString('id-ID');
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const todayStr = () => new Date().toISOString().slice(0,10);
const nowISO = () => new Date().toISOString();

function toast(msg, type='success'){
  const c = $('#toastContainer');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(()=>{ t.style.transition='opacity .3s,transform .3s'; t.style.opacity='0'; t.style.transform='translateY(-10px)'; setTimeout(()=>t.remove(), 300); }, 2600);
}
function modal({title, text, confirmText='OK', cancelText='Batal', onConfirm, danger=false}){
  const c = $('#modalContainer');
  c.innerHTML = `<div class="modal">
    <h3>${title}</h3>
    <p>${text}</p>
    <div class="modal-actions">
      <button class="btn btn-ghost" id="mCancel">${cancelText}</button>
      <button class="btn ${danger?'btn-danger':'btn-primary'}" id="mConfirm">${confirmText}</button>
    </div>
  </div>`;
  c.classList.add('show');
  const close = ()=>{ c.classList.remove('show'); c.innerHTML=''; };
  $('#mCancel').onclick = close;
  $('#mConfirm').onclick = ()=>{ close(); onConfirm && onConfirm(); };
}

/* ====== SEED ====== */
const DEFAULT_PRODUCTS = [
  { id:'p_bolpen', name:'Bolpoin', price:3000, unit:'biji', category:'Alat Tulis', emoji:'🖊️',
    desc:'Bolpoin tinta hitam halus, nyaman untuk menulis catatan panjang. Cocok untuk sekolah & kuliah.',
    stock:25, capacity:null, active:true },
  { id:'p_margin', name:'Margin Biologi', price:13000, unit:'biji', category:'Perlengkapan Belajar', emoji:'📚',
    desc:'Margin bergaris siap pakai untuk laporan praktikum Biologi. Rapi dan hemat waktu.',
    stock:15, capacity:null, active:true },
  { id:'p_kertas', name:'Kertas Fisika', price:3000, unit:'paket (10 lembar)', category:'Perlengkapan Belajar', emoji:'📄',
    desc:'Kertas bergaris khusus Fisika, dijual per paket isi 10 lembar.',
    stock:50, capacity:null, active:true },
  { id:'p_jasa', name:'Jasa Pembuatan Daftar Pustaka', price:7000, unit:'paket (10 daftar pustaka)', category:'Jasa', emoji:'📑',
    desc:'Layanan penyusunan daftar pustaka otomatis dan rapi. Cukup upload file, kami susun daftar pustakanya.',
    stock:null, capacity:5, active:true, isService:true }
];

const DEFAULT_SETTINGS = {
  storeName: 'PinkyStudy',
  waAdmin: '6281234567890',
  waMessage: 'Halo Admin PinkyStudy, saya ingin bertanya mengenai pesanan.',
  instagram: 'https://instagram.com/pinkystudy',
  tiktok: 'https://tiktok.com/@pinkystudy',
  bankName: 'BCA',
  bankAccount: '1234567890',
  bankAccountName: 'PinkyStudy Store',
  vaNumber: '8808 1234 5678 9012',
  vaBank: 'BCA Virtual Account',
  qrisMerchant: 'PinkyStudy Store',
  qrisImage: 'auto',
  paymentEnabled: {
    transfer_bank:true, va:true, qris:true, gopay:true, ovo:true, dana:true,
    shopeepay:true, linkaja:true, mbanking:true, other:true
  },
  paymentInstructions: {
    gopay: 'Buka aplikasi Gojek → Bayar → Scan QR / masukkan nomor tujuan 0812-3456-7890 a/n PinkyStudy.',
    ovo: 'Buka aplikasi OVO → Transfer → ke nomor 0812-3456-7890 a/n PinkyStudy.',
    dana: 'Buka aplikasi DANA → Kirim → ke nomor 0812-3456-7890 a/n PinkyStudy.',
    shopeepay: 'Buka Shopee → ShopeePay → Transfer ke nomor 0812-3456-7890 a/n PinkyStudy.',
    linkaja: 'Buka LinkAja → Transfer ke nomor 0812-3456-7890 a/n PinkyStudy.',
    mbanking: 'Transfer via mobile banking ke rekening BCA 1234567890 a/n PinkyStudy.',
    other: 'Hubungi admin via WhatsApp untuk informasi pembayaran lainnya.'
  },
  defaultQuotes: [
    'Sedikit demi sedikit, tugas selesai satu per satu.',
    'Tidak harus sempurna, yang penting mulai.',
    'Belajar hari ini untuk memudahkan hari esok.',
    'Satu tugas selesai, satu langkah lebih dekat.'
  ]
};

if(!DB.get('products')) DB.set('products', DEFAULT_PRODUCTS);
if(!DB.get('users')) DB.set('users', [
  { id:'u_admin', name:'Admin PinkyStudy', email:'admin@pinkystudy.id', whatsapp:'6281234567890', password:'admin123', role:'admin', createdAt:nowISO() }
]);
if(!DB.get('orders')) DB.set('orders', []);
if(!DB.get('cart')) DB.set('cart', []);
if(!DB.get('notifications')) DB.set('notifications', []);
if(!DB.get('ratings')) DB.set('ratings', []);
if(!DB.get('orderCounter')) DB.set('orderCounter', 0);
if(!DB.get('settings')) DB.set('settings', DEFAULT_SETTINGS);
if(!DB.get('session')) DB.set('session', null);

/* ====== AUTH ====== */
const getSession = () => DB.get('session');
const getUser = () => { const s = getSession(); if(!s) return null; return DB.get('users').find(u=>u.id===s.userId) || null; };
const isAdmin = () => { const u = getUser(); return u && u.role==='admin'; };
const getSettings = () => DB.get('settings');

/* ====== CART ====== */
const getCart = () => DB.get('cart');
function saveCart(c){ DB.set('cart', c); updateBadges(); }
function updateBadges(){
  const n = getCart().reduce((s,i)=>s+i.qty, 0);
  ['badgeTop','badgeBottom'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.textContent = n;
    el.classList.toggle('hidden', n===0);
  });
}
function addToCart(id, qty, silent=false){
  const p = DB.get('products').find(x=>x.id===id);
  if(!p) return;
  if(p.isService && !p.capacity){ toast('Kapasitas jasa tidak tersedia','error'); return; }
  const cart = getCart();
  const existing = cart.find(i=>i.id===id);
  const newQty = (existing?.qty || 0) + qty;
  if(p.stock !== null && newQty > p.stock){
    toast(`Stok ${p.name} hanya ${p.stock} ${p.unit}`, 'error');
    return false;
  }
  if(existing) existing.qty = newQty;
  else cart.push({ id, qty });
  saveCart(cart);
  if(!silent) toast(`${p.emoji} ${p.name} ditambahkan ke keranjang 💗`);
  return true;
}

/* ====== NOTIFICATIONS ====== */
function notify(userId, type, message){
  const arr = DB.get('notifications');
  arr.unshift({ id:uid('n_'), userId, type, message, read:false, time:nowISO() });
  DB.set('notifications', arr.slice(0,200));
}

/* ====== STATE ====== */
const state = {
  page:'home',
  search:'',
  category:'Semua',
  cartSelected:{},
  checkout:{},
  quoteIdx:0,
  adminTab:'dashboard'
};

/* ====== ROUTER ====== */
function go(hash){ window.location.hash = hash; }
function parseHash(){
  const h = window.location.hash.replace(/^#/,'') || '/';
  return h.split('/').filter(Boolean);
}
function route(){
  const parts = parseHash();
  const root = parts[0] || 'home';
  state.page = root;

  // Guards
  if(root === 'admin' && !isAdmin()){ toast('Hanya admin yang bisa akses 🛡️','error'); go('#/'); return; }
  if(['pesanan','checkout','pembayaran','profil','editprofil'].includes(root) && !getUser() && !['pesanan'].includes(root)){
    if(root !== 'pesanan'){ go('#/login'); return; }
  }

  switch(root){
    case 'home': pageHome(); break;
    case 'jualan': pageJualan(); break;
    case 'keranjang': pageKeranjang(); break;
    case 'pesanan': parts[1] ? pagePesananDetail(parts[1]) : pagePesananList(); break;
    case 'profil': pageProfil(); break;
    case 'bantuan': pageBantuan(); break;
    case 'admin': parts[1] ? pageAdminSection(parts[1]) : pageAdminDashboard(); break;
    case 'detail': pageDetail(parts[1]); break;
    case 'jasa': pageJasa(); break;
    case 'checkout': pageCheckout(); break;
    case 'konfirmasi': pageKonfirmasi(); break;
    case 'pembayaran': pagePembayaran(); break;
    case 'selesai': pageSelesai(parts[1]); break;
    case 'login': pageLogin(); break;
    case 'daftar': pageDaftar(); break;
    case 'editprofil': pageEditProfil(); break;
    case 'rating': pageRating(parts[1]); break;
    default: pageHome();
  }
  window.scrollTo({top:0, behavior:'smooth'});
  updateNavActive();
}
window.addEventListener('hashchange', route);

function updateNavActive(){
  $$('.nav-pill, .bnav').forEach(el=>{
    el.classList.toggle('active', el.dataset.page === state.page);
  });
  const a = $('#adminNav');
  if(a) a.classList.toggle('show', isAdmin());
}

/* ====================================================================
   HOME
   ==================================================================== */
function pageHome(){
  const products = DB.get('products').filter(p=>p.active);
  const settings = getSettings();
  const quotes = settings.defaultQuotes;
  const q = quotes[state.quoteIdx % quotes.length];
  const quickIds = ['p_bolpen','p_margin','p_kertas','p_jasa'];
  const quick = products.filter(p=>quickIds.includes(p.id));

  $('#app').innerHTML = `
    <section class="hero">
      <div class="hero-decor d1">💗</div>
      <div class="hero-decor d2">✨</div>
      <div class="hero-decor d3">🌸</div>
      <div class="hero-decor d4">📚</div>
      <div class="hero-content">
        <div class="hero-tag">🌸 Belajar lebih rapi, tugas lebih mudah</div>
        <h1>Selamat Datang di <span style="color:var(--pink-500)">${settings.storeName}</span> <span class="heart">💗</span></h1>
        <p class="hero-sub">Teman belajar untuk kebutuhan tugas & perlengkapan sekolahmu.</p>
        <p class="hero-quote">“${q}”</p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" data-go="#/jualan">🛍️ Lihat Jualan</button>
          <button class="btn btn-lavender btn-lg" data-go="#/jasa">📚 Pesan Jasa Daftar Pustaka</button>
        </div>
      </div>
    </section>

    <div class="quote-carousel">
      <button class="quote-nav prev" id="qPrev">‹</button>
      <div class="quote-text" id="qText">“${q}”</div>
      <button class="quote-nav next" id="qNext">›</button>
      <div class="quote-dots" id="qDots">
        ${quotes.map((_,i)=>`<span class="qdot ${i===state.quoteIdx%quotes.length?'active':''}" data-q="${i}"></span>`).join('')}
      </div>
    </div>

    <h2 class="section-title">✨ Pilihan Cepat</h2>
    <p class="section-sub">Klik produk untuk lihat detail 💗</p>
    <div class="product-grid mb-20">
      ${quick.map(p=>productCardHTML(p, true)).join('')}
    </div>

    <h2 class="section-title">💌 Informasi Toko</h2>
    <div class="card">
      <ul style="list-style:none;display:flex;flex-direction:column;gap:10px;font-size:.92rem;">
        <li>💗 Harga produk berlaku berdasarkan kelipatan.</li>
        <li>📚 Jasa daftar pustaka dihitung setiap 10 daftar pustaka.</li>
        <li>📎 File jasa wajib diunggah saat melakukan pemesanan.</li>
        <li>⏰ Jasa daftar pustaka maksimal dipesan H-1.</li>
        <li>📦 Pesanan dapat dipantau melalui menu Pesanan.</li>
        <li>💌 Hasil jasa dikirim melalui email.</li>
        <li>📱 Bantuan dapat dilakukan melalui WhatsApp Admin.</li>
      </ul>
      <div class="mt-16 text-center">
        <button class="btn btn-primary" data-action="wa">💬 Chat Admin via WhatsApp</button>
      </div>
    </div>
  `;

  $$('[data-go]').forEach(el=>el.onclick = ()=>go(el.dataset.go));
  $('#qPrev').onclick = ()=>{ state.quoteIdx = (state.quoteIdx-1+quotes.length)%quotes.length; updateQuote(); };
  $('#qNext').onclick = ()=>{ state.quoteIdx = (state.quoteIdx+1)%quotes.length; updateQuote(); };
  $$('[data-q]').forEach(d=>d.onclick = ()=>{ state.quoteIdx = +d.dataset.q; updateQuote(); });
  bindProductCards(quick);
}

function updateQuote(){
  const quotes = getSettings().defaultQuotes;
  const q = quotes[state.quoteIdx];
  const el = $('#qText'); if(!el) return;
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'quoteFade .5s ease';
  el.textContent = '“' + q + '”';
  $$('.qdot').forEach((d,i)=>d.classList.toggle('active', i===state.quoteIdx));
}

/* ====================================================================
   PRODUCT CARD
   ==================================================================== */
function productCardHTML(p, simple=false){
  const stock = p.stock === null ? null : p.stock;
  let stockLabel = '', stockClass = '';
  if(p.isService){
    stockLabel = p.capacity > 0 ? `Kapasitas: ${p.capacity}/hari` : 'Kapasitas penuh';
    stockClass = p.capacity > 0 ? 'stock-ok' : 'stock-out';
  } else if(stock === 0){ stockLabel = 'Stok habis'; stockClass='stock-out'; }
  else if(stock <= 5){ stockLabel = `Stok hampir habis (${stock})`; stockClass='stock-low'; }
  else { stockLabel = `Stok tersedia: ${stock}`; stockClass='stock-ok'; }

  const isJasa = p.category === 'Jasa';
  return `
    <div class="product-card" data-card="${p.id}">
      <div class="product-thumb ${isJasa?'jasa':''}" data-thumb="${p.id}">
        ${p.emoji}
        ${isJasa?`<span class="ribbon jasa">JASA</span>`:''}
      </div>
      <div class="product-name">${p.name}</div>
      <div class="product-price">${rp(p.price)}<span class="product-unit"> / ${p.unit}</span></div>
      <div><span class="stock-pill ${stockClass}">${stockLabel}</span></div>
      ${simple ? '' : `
        <div class="row mt-8" style="gap:6px;">
          <button class="btn btn-soft btn-sm flex-1" data-detail="${p.id}">Lihat Detail</button>
          ${p.isService
            ? `<button class="btn btn-primary btn-sm flex-1" data-jasa="${p.id}">Pesan Jasa</button>`
            : `<button class="btn btn-primary btn-sm flex-1" data-add="${p.id}">+ Keranjang</button>`
          }
        </div>
      `}
      ${simple ? `<button class="btn btn-soft btn-sm btn-block mt-8" data-detail="${p.id}">Lihat Detail →</button>` : ''}
    </div>
  `;
}

function bindProductCards(products){
  products.forEach(p=>{
    const card = $(`[data-card="${p.id}"]`);
    if(!card) return;
    const thumb = card.querySelector(`[data-thumb="${p.id}"]`);
    if(thumb) thumb.onclick = e => { e.stopPropagation(); go('#/detail/'+p.id); };
    const detail = card.querySelector(`[data-detail="${p.id}"]`);
    if(detail) detail.onclick = e => { e.stopPropagation(); go('#/detail/'+p.id); };
    const add = card.querySelector(`[data-add="${p.id}"]`);
    if(add) add.onclick = e => { e.stopPropagation(); addToCart(p.id, 1); };
    const jasa = card.querySelector(`[data-jasa="${p.id}"]`);
    if(jasa) jasa.onclick = e => { e.stopPropagation(); go('#/jasa'); };
    card.onclick = e => { if(e.target.closest('button')) return; go('#/detail/'+p.id); };
  });
}

/* ====================================================================
   JUALAN
   ==================================================================== */
function pageJualan(){
  const products = DB.get('products').filter(p=>p.active);
  const cats = ['Semua','Alat Tulis','Perlengkapan Belajar','Jasa'];
  const filtered = products.filter(p=>{
    const okC = state.category==='Semua' || p.category===state.category;
    const okQ = !state.search || p.name.toLowerCase().includes(state.search.toLowerCase());
    return okC && okQ;
  });

  $('#app').innerHTML = `
    <h2 class="section-title">🛍️ Jualan</h2>
    <div class="search-bar">
      <span style="font-size:1.1rem;">🔍</span>
      <input id="searchInput" placeholder="Cari produk... (contoh: Bolpoin)" value="${state.search}">
      ${state.search ? `<button class="btn btn-ghost btn-sm" id="clearSearch">✕</button>` : ''}
    </div>
    <div class="chips">
      ${cats.map(c=>`<button class="chip ${state.category===c?'active':''}" data-cat="${c}">${c}</button>`).join('')}
    </div>
    ${filtered.length===0 ? `
      <div class="empty">
        <div class="empty-icon">🌸</div>
        <h3>Produk tidak ditemukan</h3>
        <p>Coba kata kunci atau kategori lain ya 💗</p>
      </div>
    ` : `
      <div class="product-grid">
        ${filtered.map(p=>productCardHTML(p)).join('')}
      </div>
    `}
  `;

  const inp = $('#searchInput');
  inp.oninput = e=>{ state.search = e.target.value; clearTimeout(window._st); window._st = setTimeout(pageJualan, 200); };
  const cs = $('#clearSearch'); if(cs) cs.onclick = ()=>{ state.search=''; pageJualan(); };
  $$('[data-cat]').forEach(el=>el.onclick = ()=>{ state.category = el.dataset.cat; pageJualan(); });
  bindProductCards(filtered);
}

/* ====================================================================
   DETAIL PRODUK
   ==================================================================== */
function pageDetail(id){
  const p = DB.get('products').find(x=>x.id===id);
  if(!p){ go('#/jualan'); return; }
  if(!p.active){ toast('Produk tidak tersedia','error'); go('#/jualan'); return; }

  let qty = 1;
  const maxQ = p.stock === null ? (p.capacity || 99) : p.stock;
  const stock = p.stock;
  let stockLabel = '', stockClass = '';
  if(p.isService){
    stockLabel = p.capacity > 0 ? `Kapasitas: ${p.capacity}/hari` : 'Kapasitas penuh';
    stockClass = p.capacity > 0 ? 'stock-ok':'stock-out';
  } else if(stock===0){ stockLabel='Stok habis'; stockClass='stock-out'; }
  else if(stock<=5){ stockLabel=`Stok hampir habis (${stock})`; stockClass='stock-low'; }
  else { stockLabel=`Stok tersedia: ${stock}`; stockClass='stock-ok'; }

  const isOut = (!p.isService && stock===0) || (p.isService && p.capacity<=0);

  $('#app').innerHTML = `
    <button class="back-link" onclick="history.back()">← Kembali</button>
    <div class="card">
      <div class="product-thumb ${p.isService?'jasa':''}" style="aspect-ratio:1/1;font-size:7rem;margin-bottom:20px;">
        ${p.emoji}
        ${p.isService?`<span class="ribbon jasa">JASA</span>`:''}
      </div>
      <h2 style="color:var(--pink-600);font-family:'Playfair Display',serif;font-style:italic;font-size:1.7rem;margin-bottom:6px;">${p.name}</h2>
      <div class="product-price" style="font-size:1.5rem;margin-bottom:6px;">${rp(p.price)}<span class="product-unit"> / ${p.unit}</span></div>
      <div class="mb-12"><span class="stock-pill ${stockClass}">${stockLabel}</span> <span style="color:var(--text-soft);font-size:.85rem;">⭐ 4.9 · ${p.category}</span></div>
      <p style="color:var(--text-soft);line-height:1.7;margin-bottom:20px;">${p.desc}</p>

      ${isOut ? `
        <div class="card" style="background:#ffe0e6;border-color:#ffb3c1;text-align:center;padding:16px;">
          <strong style="color:#c2255c;">❌ ${p.isService?'Kapasitas penuh':'Stok habis'}</strong>
          <p style="font-size:.85rem;color:#c2255c;margin-top:4px;">Silakan cek kembali nanti ya 💗</p>
        </div>
      ` : `
        <div class="qty-control mb-16">
          <button class="qty-btn" id="dMinus" ${qty<=1?'disabled':''}>−</button>
          <span class="qty-val" id="dQty">${qty}</span>
          <button class="qty-btn" id="dPlus" ${qty>=maxQ?'disabled':''}>+</button>
        </div>
        <div class="summary-row"><span style="font-weight:700;">Total harga</span><strong id="dTotal" style="color:var(--pink-600);font-size:1.15rem;">${rp(p.price*qty)}</strong></div>
        <div class="row mt-16" style="gap:10px;">
          <button class="btn btn-soft flex-1" id="dAdd">🛒 Tambah Keranjang</button>
          <button class="btn btn-primary flex-1" id="dBuy">Beli Sekarang</button>
        </div>
      `}
    </div>
  `;

  if(isOut) return;

  const upd = ()=>{
    $('#dQty').textContent = qty;
    $('#dTotal').textContent = rp(p.price*qty);
    $('#dMinus').disabled = qty<=1;
    $('#dPlus').disabled = qty>=maxQ;
  };
  $('#dPlus').onclick = ()=>{ if(qty<maxQ){ qty++; upd(); } };
  $('#dMinus').onclick = ()=>{ if(qty>1){ qty--; upd(); } };
  $('#dAdd').onclick = ()=>{ if(addToCart(p.id, qty)) { /* already toasted */ } };
  $('#dBuy').onclick = ()=>{
    if(addToCart(p.id, qty, true)){
      state.checkout = { items: [{ id:p.id, qty }], type:'barang' };
      go('#/checkout');
    }
  };
}

/* ====================================================================
   JASA
   ==================================================================== */
function pageJasa(){
  const p = DB.get('products').find(x=>x.id==='p_jasa');
  if(!p){ toast('Jasa tidak tersedia','error'); go('#/jualan'); return; }
  const today = new Date(); today.setHours(0,0,0,0);
  const minDate = new Date(today.getTime()+24*3600*1000);
  const minStr = minDate.toISOString().slice(0,10);

  $('#app').innerHTML = `
    <button class="back-link" onclick="history.back()">← Kembali</button>
    <h2 class="section-title">📑 Jasa Daftar Pustaka</h2>
    <div class="card mb-16">
      <div class="product-thumb jasa" style="aspect-ratio:1/1;font-size:6rem;margin-bottom:14px;">📑<span class="ribbon jasa">JASA</span></div>
      <h3 style="color:var(--pink-600);font-family:'Playfair Display',serif;font-style:italic;">${p.name}</h3>
      <div class="product-price" style="font-size:1.3rem;">${rp(p.price)}<span class="product-unit"> / ${p.unit}</span></div>
      <p class="mt-8" style="color:var(--text-soft);">${p.desc}</p>
      <div class="mt-12"><span class="stock-pill stock-ok">Kapasitas: ${p.capacity}/hari</span></div>
    </div>

    <div class="card mb-16">
      <h3 style="color:var(--pink-600);margin-bottom:10px;">📚 Jumlah Paket</h3>
      <p style="color:var(--text-soft);font-size:.88rem;margin-bottom:12px;">1 paket = 10 daftar pustaka</p>
      <div class="qty-control mb-12">
        <button class="qty-btn" id="jMinus">−</button>
        <span class="qty-val" id="jQty">1</span>
        <button class="qty-btn" id="jPlus">+</button>
      </div>
      <div class="summary-row"><span id="jInfo">10 daftar pustaka</span><strong id="jTotal" style="color:var(--pink-600);">${rp(p.price)}</strong></div>
    </div>

    <div class="card mb-16">
      <h3 style="color:var(--pink-600);margin-bottom:8px;">📎 Upload File</h3>
      <p style="color:var(--text-soft);font-size:.85rem;margin-bottom:12px;">Upload file yang ingin dibuatkan daftar pustakanya. Format: PDF, DOC, DOCX, JPG, PNG.</p>
      <input type="file" id="jFile" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style="display:none;">
      <button class="btn btn-soft btn-block" id="jUploadBtn">📎 Pilih File</button>
      <div id="jFileName" class="mt-10" style="font-size:.85rem;color:var(--text-soft);">Belum ada file dipilih.</div>
      <div class="form-error" id="errFile">Silakan upload file terlebih dahulu.</div>
    </div>

    <div class="card mb-16">
      <h3 style="color:var(--pink-600);margin-bottom:8px;">⏰ Permintaan Selesai</h3>
      <div class="form-group">
        <label>Tanggal selesai (minimal H-1) <span class="req">*</span></label>
        <input type="date" class="form-input" id="jDate" min="${minStr}" value="${minStr}">
        <div class="form-error" id="errDate">⏰ Pemesanan jasa daftar pustaka maksimal dilakukan H-1. Silakan pilih tanggal penyelesaian yang sesuai.</div>
      </div>
      <div class="form-group">
        <label>Jam selesai</label>
        <input type="time" class="form-input" id="jTime" value="17:00">
      </div>
      <div class="form-group">
        <label>Catatan tambahan</label>
        <textarea class="form-textarea" id="jNote" placeholder="Contoh: format APA, sitasi ilmiah, dsb."></textarea>
      </div>
    </div>

    <button class="btn btn-primary btn-block btn-lg" id="jSubmit">Lanjut Checkout 💗</button>
  `;

  let qty = 1, fileObj = null;
  const upd = ()=>{
    $('#jQty').textContent = qty;
    $('#jInfo').textContent = (qty*10)+' daftar pustaka';
    $('#jTotal').textContent = rp(p.price*qty);
  };
  $('#jPlus').onclick = ()=>{ if(qty < (p.capacity||99)){ qty++; upd(); } };
  $('#jMinus').onclick = ()=>{ if(qty>1){ qty--; upd(); } };
  $('#jUploadBtn').onclick = ()=>$('#jFile').click();
  $('#jFile').onchange = e=>{
    const f = e.target.files[0]; if(!f) return;
    fileObj = { name:f.name, size:f.size, type:f.type };
    $('#jFileName').innerHTML = `✅ File berhasil diunggah: <strong>${f.name}</strong> (${(f.size/1024).toFixed(1)} KB)`;
    $('#errFile').classList.remove('show');
  };
  $('#jSubmit').onclick = ()=>{
    const date = $('#jDate').value;
    const time = $('#jTime').value;
    const note = $('#jNote').value.trim();
    let ok = true;
    $('#errFile').classList.remove('show');
    $('#errDate').classList.remove('show');
    if(!fileObj){ $('#errFile').classList.add('show'); ok=false; }
    if(!date){ $('#errDate').classList.add('show'); ok=false; }
    else {
      const ch = new Date(date+'T00:00:00');
      const td = new Date(); td.setHours(0,0,0,0);
      if(ch.getTime() <= td.getTime()){ $('#errDate').classList.add('show'); ok=false; }
    }
    if(!ok){ toast('Periksa kembali data jasa kamu 💗','error'); return; }

    state.checkout = {
      items:[{ id:p.id, qty }],
      type:'jasa',
      file:fileObj,
      deadlineDate:date,
      deadlineTime:time,
      note
    };
    go('#/checkout');
  };
}

/* ====================================================================
   KERANJANG
   ==================================================================== */
function pageKeranjang(){
  const cart = getCart();
  const products = DB.get('products');

  if(cart.length===0){
    $('#app').innerHTML = `
      <h2 class="section-title">🛒 Keranjang</h2>
      <div class="empty">
        <div class="empty-icon">🌸</div>
        <h3>Keranjangmu masih kosong 💗</h3>
        <p>Yuk cari perlengkapan belajar yang kamu butuhkan!</p>
        <button class="btn btn-primary btn-lg" data-go="#/jualan">🛍️ Mulai Belanja</button>
      </div>`;
    $$('[data-go]').forEach(el=>el.onclick = ()=>go(el.dataset.go));
    return;
  }

  const items = cart.map(i=>({ ...i, p: products.find(x=>x.id===i.id) })).filter(x=>x.p);
  if(!Object.keys(state.cartSelected).length) items.forEach(i=>state.cartSelected[i.id]=true);
  const sel = items.filter(i=>state.cartSelected[i.id]);
  const subtotal = sel.reduce((s,i)=>s+i.p.price*i.qty, 0);

  $('#app').innerHTML = `
    <div class="row-between mb-12">
      <h2 class="section-title" style="margin:0;">🛒 Keranjang</h2>
      <button class="btn btn-ghost btn-sm" id="selAll">${sel.length===items.length?'Batal Pilih Semua':'Pilih Semua'}</button>
    </div>

    ${items.map(i=>{
      const maxQ = i.p.stock===null ? (i.p.capacity||99) : i.p.stock;
      return `
      <div class="cart-item">
        <div class="checkbox-ui ${state.cartSelected[i.id]?'checked':''}" data-check="${i.id}"></div>
        <div class="cart-thumb" data-open="${i.p.id}">${i.p.emoji}</div>
        <div class="cart-info">
          <h4>${i.p.name}</h4>
          <div class="price">${rp(i.p.price)} × ${i.qty}</div>
          <div class="qty-control" style="width:fit-content;">
            <button class="qty-btn" data-minus="${i.id}" ${i.qty<=1?'disabled':''}>−</button>
            <span class="qty-val">${i.qty}</span>
            <button class="qty-btn" data-plus="${i.id}" ${i.qty>=maxQ?'disabled':''}>+</button>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="product-price">${rp(i.p.price*i.qty)}</div>
          <button class="btn btn-danger btn-sm mt-8" data-del="${i.id}">🗑️</button>
        </div>
      </div>`;
    }).join('')}

    <div class="cart-summary">
      <div class="summary-row"><span>Item dipilih</span><strong>${sel.length} dari ${items.length}</strong></div>
      <div class="summary-total"><span>Total</span><span>${rp(subtotal)}</span></div>
      <button class="btn btn-primary btn-block btn-lg mt-12" id="goCheckout" ${sel.length===0?'disabled':''}>Checkout 💗</button>
    </div>
  `;

  $$('[data-check]').forEach(el=>el.onclick = ()=>{ state.cartSelected[el.dataset.check] = !state.cartSelected[el.dataset.check]; pageKeranjang(); });
  $$('[data-plus]').forEach(el=>el.onclick = ()=>{
    const c = getCart(); const it = c.find(x=>x.id===el.dataset.plus);
    const p = products.find(x=>x.id===el.dataset.plus);
    const maxQ = p.stock===null?(p.capacity||99):p.stock;
    if(it.qty < maxQ){ it.qty++; saveCart(c); pageKeranjang(); }
    else toast(`Sudah mencapai batas maksimum`,'error');
  });
  $$('[data-minus]').forEach(el=>el.onclick = ()=>{
    const c = getCart(); const it = c.find(x=>x.id===el.dataset.minus);
    if(it.qty>1){ it.qty--; saveCart(c); pageKeranjang(); }
  });
  $$('[data-del]').forEach(el=>el.onclick = ()=>{
    const p = products.find(x=>x.id===el.dataset.del);
    modal({
      title:'Hapus produk?',
      text:`Hapus "${p.name}" dari keranjang?`,
      confirmText:'Ya, Hapus', danger:true,
      onConfirm: ()=>{
        saveCart(getCart().filter(i=>i.id!==p.id));
        delete state.cartSelected[p.id];
        pageKeranjang();
        toast('Produk dihapus dari keranjang','info');
      }
    });
  });
  $$('[data-open]').forEach(el=>el.onclick = ()=>go('#/detail/'+el.dataset.open));
  $('#selAll').onclick = ()=>{
    const allSel = sel.length === items.length;
    items.forEach(i=> state.cartSelected[i.id] = !allSel);
    pageKeranjang();
  };
  $('#goCheckout').onclick = ()=>{
    const chosen = getCart().filter(i=>state.cartSelected[i.id]);
    if(!chosen.length) return toast('Pilih minimal 1 produk dulu 💗','error');
    state.checkout = { items: chosen, type:'barang' };
    go('#/checkout');
  };
}

/* ====================================================================
   CHECKOUT
   ==================================================================== */
function pageCheckout(){
  if(!state.checkout || !state.checkout.items) { go('#/keranjang'); return; }
  const u = getUser();
  const products = DB.get('products');
  const items = state.checkout.items.map(i=>({ ...i, p:products.find(x=>x.id===i.id) })).filter(x=>x.p);
  const subtotal = items.reduce((s,i)=>s+i.p.price*i.qty, 0);

  $('#app').innerHTML = `
    <button class="back-link" onclick="history.back()">← Kembali</button>
    <h2 class="section-title">📝 Checkout</h2>

    <div class="card mb-16">
      <h3 style="color:var(--pink-600);margin-bottom:12px;">👤 Data Pemesan</h3>
      <div class="form-group">
        <label>Nama <span class="req">*</span></label>
        <input class="form-input" id="cName" value="${u?.name||''}" placeholder="Nama lengkap">
        <div class="form-error" id="errName">Nama wajib diisi.</div>
      </div>
      <div class="form-group">
        <label>Email <span class="req">*</span></label>
        <input class="form-input" id="cEmail" type="email" value="${u?.email||''}" placeholder="nama@email.com">
        <div class="form-error" id="errEmail">Email wajib diisi.</div>
      </div>
      <div class="form-group">
        <label>Nomor WhatsApp <span class="req">*</span></label>
        <input class="form-input" id="cWa" value="${u?.whatsapp||''}" placeholder="08xxxxxxxxxx">
        <div class="form-error" id="errWa">Nomor WhatsApp wajib diisi.</div>
      </div>
      <div class="form-group">
        <label>Catatan</label>
        <textarea class="form-textarea" id="cNote" placeholder="Catatan tambahan (opsional)">${state.checkout.note||''}</textarea>
      </div>
    </div>

    <div class="card mb-16">
      <h3 style="color:var(--pink-600);margin-bottom:12px;">🛍️ Ringkasan Pesanan</h3>
      ${items.map(i=>`
        <div class="summary-row">
          <span>${i.p.emoji} ${i.p.name} × ${i.qty}</span>
          <span>${rp(i.p.price*i.qty)}</span>
        </div>
      `).join('')}
      <div class="summary-total"><span>Total</span><span>${rp(subtotal)}</span></div>
    </div>

    ${state.checkout.type==='jasa' ? `
      <div class="card mb-16" style="background:var(--lavender);border-color:var(--lavender-2);">
        <h3 style="color:#4a3b8f;margin-bottom:8px;">📎 File Jasa</h3>
        <div style="background:white;padding:10px 14px;border-radius:12px;font-size:.88rem;">
          <strong>${state.checkout.file?.name || '-'}</strong>
          ${state.checkout.file ? `<span style="color:var(--text-soft);"> (${(state.checkout.file.size/1024).toFixed(1)} KB)</span>`:''}
        </div>
        <div class="mt-10" style="font-size:.88rem;color:#4a3b8f;">
          ⏰ Permintaan selesai: <strong>${state.checkout.deadlineDate} ${state.checkout.deadlineTime||''}</strong>
        </div>
      </div>
    `:''}

    <button class="btn btn-primary btn-block btn-lg" id="toKonfirmasi">Lanjut Konfirmasi Pesanan 💗</button>
  `;

  $('#toKonfirmasi').onclick = ()=>{
    const name = $('#cName').value.trim();
    const email = $('#cEmail').value.trim();
    const wa = $('#cWa').value.trim();
    const note = $('#cNote').value.trim();
    let ok = true;
    ['errName','errEmail','errWa'].forEach(id=>$('#'+id).classList.remove('show'));
    if(!name){ $('#errName').classList.add('show'); ok=false; }
    if(!email){ $('#errEmail').classList.add('show'); ok=false; }
    if(!wa){ $('#errWa').classList.add('show'); ok=false; }
    if(!ok){ toast('Lengkapi data wajib dulu ya 💗','error'); return; }

    state.checkout.customer = { name, email, wa, note: note || state.checkout.note || '' };
    state.checkout.subtotal = subtotal;
    go('#/konfirmasi');
  };
}

/* ====================================================================
   KONFIRMASI PESANAN
   ==================================================================== */
function pageKonfirmasi(){
  if(!state.checkout.customer){ go('#/checkout'); return; }
  const c = state.checkout;
  const products = DB.get('products');
  const items = c.items.map(i=>({ ...i, p:products.find(x=>x.id===i.id) }));
  const now = new Date();
  const tgl = now.toLocaleDateString('id-ID', {day:'2-digit',month:'long',year:'numeric'});
  const jam = now.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});

  $('#app').innerHTML = `
    <button class="back-link" onclick="history.back()">← Kembali dan Edit</button>
    <h2 class="section-title">✅ Konfirmasi Pesanan</h2>

    <div class="card mb-16">
      <h3 style="color:var(--pink-600);margin-bottom:12px;">📋 Data Pemesan</h3>
      <div class="summary-row"><span>Nama</span><strong>${c.customer.name}</strong></div>
      <div class="summary-row"><span>Email</span><span>${c.customer.email}</span></div>
      <div class="summary-row"><span>WhatsApp</span><span>${c.customer.wa}</span></div>
      ${c.customer.note?`<div class="summary-row"><span>Catatan</span><span>${c.customer.note}</span></div>`:''}
    </div>

    <div class="card mb-16">
      <h3 style="color:var(--pink-600);margin-bottom:12px;">🛍️ Produk Dipesan</h3>
      ${items.map(i=>`
        <div class="summary-row">
          <span>${i.p.emoji} ${i.p.name} × ${i.qty} (${i.p.unit})</span>
          <span>${rp(i.p.price*i.qty)}</span>
        </div>
      `).join('')}
      <div class="summary-total"><span>Total</span><span>${rp(c.subtotal)}</span></div>
    </div>

    <div class="card mb-16">
      <h3 style="color:var(--pink-600);margin-bottom:12px;">📅 Waktu Pemesanan</h3>
      <div class="summary-row"><span>Tanggal</span><span>${tgl}</span></div>
      <div class="summary-row"><span>Waktu</span><span>${jam} WIB</span></div>
      ${c.type==='jasa'?`
        <div class="summary-row"><span>File</span><strong>${c.file.name}</strong></div>
        <div class="summary-row"><span>Permintaan selesai</span><strong>${c.deadlineDate} ${c.deadlineTime||''}</strong></div>
      `:''}
    </div>

    <div class="card mb-16" style="background:var(--pink-50);border-color:var(--pink-300);">
      <label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer;">
        <div class="checkbox-ui" id="confirmCheck"></div>
        <span style="font-weight:700;font-size:.9rem;">Saya sudah memeriksa dan memastikan seluruh data pesanan sudah benar. 💗</span>
      </label>
    </div>

    <div class="row" style="gap:10px;">
      <button class="btn btn-ghost flex-1" id="backEdit">← Kembali dan Edit</button>
      <button class="btn btn-primary flex-1" id="toPay" disabled>Lanjut ke Pembayaran →</button>
    </div>
  `;

  let checked = false;
  $('#confirmCheck').onclick = ()=>{
    checked = !checked;
    $('#confirmCheck').classList.toggle('checked', checked);
    $('#toPay').disabled = !checked;
  };
  $('#backEdit').onclick = ()=>history.back();
  $('#toPay').onclick = ()=>{ if(checked) go('#/pembayaran'); };
}

/* ====================================================================
   PEMBAYARAN
   ==================================================================== */
function pagePembayaran(){
  if(!state.checkout.customer){ go('#/checkout'); return; }
  const c = state.checkout;
  const products = DB.get('products');
  const items = c.items.map(i=>({ ...i, p:products.find(x=>x.id===i.id) }));
  const total = c.subtotal;
  const settings = getSettings();

  const methods = [
    { id:'transfer_bank', name:'Transfer Bank', icon:'🏦' },
    { id:'va', name:'Virtual Account', icon:'💳' },
    { id:'qris', name:'QRIS', icon:'📱' },
    { id:'gopay', name:'GoPay', icon:'💚' },
    { id:'ovo', name:'OVO', icon:'💜' },
    { id:'dana', name:'DANA', icon:'💙' },
    { id:'shopeepay', name:'ShopeePay', icon:'🧡' },
    { id:'linkaja', name:'LinkAja', icon:'❤️' },
    { id:'mbanking', name:'Mobile Banking', icon:'📲' },
    { id:'other', name:'Lainnya', icon:'🏧' }
  ].filter(m => settings.paymentEnabled[m.id]);

  const orderId = 'ORD-' + todayStr().replace(/-/g,'') + '-' + String((DB.get('orderCounter')||0)+1).padStart(3,'0');
  const payLimit = new Date(Date.now() + 24*3600*1000);

  $('#app').innerHTML = `
    <button class="back-link" onclick="history.back()">← Kembali</button>
    <h2 class="section-title">💳 Pembayaran</h2>

    <div class="card mb-16" style="background:linear-gradient(135deg,var(--pink-100),var(--lavender));border-color:var(--pink-300);">
      <div class="summary-row"><span>Nomor Pesanan</span><strong style="color:var(--pink-700);">${orderId}</strong></div>
      <div class="summary-row"><span>Tanggal</span><span>${new Date().toLocaleString('id-ID')}</span></div>
      <div class="summary-row"><span>Batas Pembayaran</span><span>${payLimit.toLocaleString('id-ID')}</span></div>
      <div class="summary-total" style="border-color:var(--pink-400);"><span>Total Pembayaran</span><span>${rp(total)}</span></div>
    </div>

    <h3 style="color:var(--pink-600);margin:18px 0 12px;font-family:'Playfair Display',serif;font-style:italic;">Pilih Metode Pembayaran</h3>
    <div class="pay-grid" id="payGrid">
      ${methods.map(m=>`
        <div class="pay-card" data-pay="${m.id}">
          <span class="pay-icon">${m.icon}</span>
          <div class="pay-name">${m.name}</div>
        </div>
      `).join('')}
    </div>

    <div id="payDetail"></div>

    <button class="btn btn-primary btn-block btn-lg mt-16" id="btnPaid" disabled>Saya Sudah Membayar 💗</button>
    <button class="btn btn-ghost btn-block mt-8" id="btnCancel">Batalkan Pesanan</button>
  `;

  let chosen = null;

  function renderPayDetail(m){
    const c2 = state.checkout;
    let html = `<div class="pay-detail">
      <h3>${m.icon} ${m.name}</h3>`;

    if(m.id === 'transfer_bank'){
      html += `
        <div class="info-box">
          <div style="color:var(--text-soft);font-size:.85rem;margin-bottom:6px;">Transfer ke rekening berikut:</div>
          <div class="copy-field"><span>🏦 ${settings.bankName}</span></div>
          <div class="copy-field">
            <strong id="copyBankAcc">${settings.bankAccount}</strong>
            <button class="copy-btn" data-copy="${settings.bankAccount}">Salin</button>
          </div>
          <div class="copy-field"><span>a/n ${settings.bankAccountName}</span></div>
          <div class="copy-field" style="margin-top:8px;border-top:1px dashed var(--pink-200);padding-top:8px;">
            <span>Nominal:</span><strong>${rp(total)}</strong>
          </div>
        </div>
      `;
    } else if(m.id === 'va'){
      html += `
        <div class="info-box">
          <div style="color:var(--text-soft);font-size:.85rem;margin-bottom:6px;">Virtual Account:</div>
          <div class="copy-field"><span>${settings.vaBank}</span></div>
          <div class="copy-field">
            <strong>${settings.vaNumber}</strong>
            <button class="copy-btn" data-copy="${settings.vaNumber}">Salin VA</button>
          </div>
          <div class="copy-field" style="margin-top:8px;border-top:1px dashed var(--pink-200);padding-top:8px;">
            <span>Nominal:</span><strong>${rp(total)}</strong>
          </div>
          <div style="font-size:.8rem;color:var(--text-soft);margin-top:6px;">⏰ Batas: ${payLimit.toLocaleString('id-ID')}</div>
        </div>
      `;
    } else if(m.id === 'qris'){
      html += `
        <div class="qris-box">
          <div style="font-weight:700;color:var(--pink-600);margin-bottom:10px;">Scan QRIS ini dengan aplikasi pembayaranmu</div>
          <div class="qris-img">
            <div class="qr-code"></div>
          </div>
          <div style="margin-top:14px;">
            <div style="color:var(--text-soft);font-size:.85rem;">Merchant</div>
            <strong>${settings.qrisMerchant}</strong>
          </div>
          <div class="summary-row" style="justify-content:center;gap:14px;margin-top:8px;">
            <span>Nominal:</span><strong style="color:var(--pink-600);font-size:1.2rem;">${rp(total)}</strong>
          </div>
          <div style="font-size:.8rem;color:var(--text-soft);margin-top:6px;">⏰ Batas: ${payLimit.toLocaleString('id-ID')}</div>
        </div>
      `;
    } else {
      const instr = settings.paymentInstructions[m.id] || 'Hubungi admin untuk info pembayaran.';
      html += `
        <div class="info-box">
          <div style="color:var(--text-soft);font-size:.85rem;margin-bottom:8px;">Instruksi pembayaran:</div>
          <p style="line-height:1.6;">${instr}</p>
          <div class="copy-field" style="margin-top:10px;border-top:1px dashed var(--pink-200);padding-top:10px;">
            <span>Nominal:</span><strong>${rp(total)}</strong>
          </div>
        </div>
      `;
    }

    html += `<div style="font-size:.82rem;color:var(--text-soft);text-align:center;margin-top:10px;">
      💡 Setelah transfer, klik "Saya Sudah Membayar" dan admin akan memverifikasi pembayaranmu.
    </div></div>`;
    return html;
  }

  $$('[data-pay]').forEach(el=>el.onclick = ()=>{
    $$('[data-pay]').forEach(x=>x.classList.remove('selected'));
    el.classList.add('selected');
    chosen = methods.find(m=>m.id===el.dataset.pay);
    $('#payDetail').innerHTML = renderPayDetail(chosen);
    $('#btnPaid').disabled = false;
    // bind copy
    $$('[data-copy]').forEach(b=>b.onclick = ()=>{
      navigator.clipboard?.writeText(b.dataset.copy).then(()=>toast('Berhasil disalin 💗','info')).catch(()=>toast('Gagal menyalin','error'));
    });
  });

  $('#btnPaid').onclick = ()=>{
    if(!chosen) return;
    modal({
      title:'Konfirmasi Pembayaran',
      text:`Anda akan mengirim konfirmasi pembayaran sebesar ${rp(total)} via ${chosen.name}. Lanjutkan?`,
      confirmText:'Ya, Sudah Bayar', 
      onConfirm:()=>{
        const counter = (DB.get('orderCounter')||0) + 1;
        DB.set('orderCounter', counter);
        const realOrderId = 'ORD-' + todayStr().replace(/-/g,'') + '-' + String(counter).padStart(3,'0');
        const antrian = String(counter).padStart(2,'0');
        const orders = DB.get('orders');
        const u = getUser();
        const order = {
          id: realOrderId,
          orderCounter: counter,
          userId: u?.id || 'guest',
          customer: c.customer,
          items: items.map(i=>({ id:i.p.id, name:i.p.name, emoji:i.p.emoji, price:i.p.price, unit:i.p.unit, qty:i.qty })),
          type: c.type,
          subtotal: total,
          payment: chosen.name,
          paymentMethodId: chosen.id,
          paymentStatus: 'Menunggu Verifikasi',
          status: 'Menunggu Pembayaran',
          antrian,
          deadlineDate: c.deadlineDate || null,
          deadlineTime: c.deadlineTime || null,
          note: c.customer.note || '',
          file: c.file || null,
          resultFile: null,
          createdAt: nowISO(),
          statusHistory: [{status:'Menunggu Pembayaran', time: nowISO(), note:'Pesanan dibuat'}],
          paidAt: nowISO()
        };
        orders.push(order);
        DB.set('orders', orders);

        // remove from cart
        const cart = getCart().filter(i=> !c.items.find(x=>x.id===i.id));
        saveCart(cart);

        if(u) notify(u.id, 'order', `Pesanan ${realOrderId} berhasil dibuat 💗 Menunggu verifikasi pembayaran.`);
        notify('u_admin', 'order', `Pesanan baru: ${realOrderId} — ${chosen.name} — ${rp(total)} 🎀`);

        state.checkout = {};
        toast('Pembayaran berhasil dikirim untuk verifikasi 💗');
        go('#/selesai/'+realOrderId);
      }
    });
  };

  $('#btnCancel').onclick = ()=>{
    modal({
      title:'Batalkan Pesanan?',
      text:'Pesanan akan dibatalkan dan kembali ke halaman sebelumnya.',
      confirmText:'Ya, Batalkan', danger:true,
      onConfirm: ()=>{ state.checkout = {}; toast('Pesanan dibatalkan','info'); go('#/jualan'); }
    });
  };
}

/* ====================================================================
   SELESAI
   ==================================================================== */
function pageSelesai(id){
  const order = DB.get('orders').find(o=>o.id===id);
  if(!order){ go('#/'); return; }

  $('#app').innerHTML = `
    <div class="empty" style="border-style:solid;border-color:var(--pink-300);background:linear-gradient(135deg,var(--pink-100),var(--lavender));">
      <div class="empty-icon">💗</div>
      <h3 style="font-size:1.4rem;">Pesanan Berhasil Dibuat!</h3>
      <p style="color:var(--text);font-weight:600;">Terima kasih sudah berbelanja di PinkyStudy 🌸</p>
    </div>

    <div class="card mb-16">
      <div class="summary-row"><span>Order ID</span><strong style="color:var(--pink-600);">${order.id}</strong></div>
      <div class="summary-row"><span>Nomor Antrian</span><strong>#${order.antrian}</strong></div>
      <div class="summary-row"><span>Tanggal</span><span>${new Date(order.createdAt).toLocaleString('id-ID')}</span></div>
      <div class="summary-row"><span>Metode Pembayaran</span><strong>${order.payment}</strong></div>
      <div class="summary-row"><span>Status Pembayaran</span><span class="status-pill status-verifikasi">${order.paymentStatus}</span></div>
      <div class="summary-row"><span>Status Pesanan</span><span class="status-pill status-menunggu">${order.status}</span></div>
      <div class="summary-total"><span>Total</span><span>${rp(order.subtotal)}</span></div>
    </div>

    <div class="row" style="gap:10px;">
      <button class="btn btn-soft flex-1" data-go="#/jualan">🛍️ Kembali Belanja</button>
      <button class="btn btn-primary flex-1" data-go="#/pesanan/${order.id}">📦 Lihat Pesanan</button>
    </div>
  `;
  $$('[data-go]').forEach(el=>el.onclick = ()=>go(el.dataset.go));
}

/* ====================================================================
   PESANAN LIST (BUYER)
   ==================================================================== */
function pagePesananList(){
  const u = getUser();
  if(!u){
    $('#app').innerHTML = `
      <h2 class="section-title">📦 Pesanan</h2>
      <div class="empty">
        <div class="empty-icon">🔒</div>
        <h3>Login dulu yuk 💗</h3>
        <p>Silakan login untuk melihat pesananmu</p>
        <div class="row" style="justify-content:center;gap:10px;">
          <button class="btn btn-primary" data-go="#/login">Login</button>
          <button class="btn btn-soft" data-go="#/daftar">Daftar</button>
        </div>
      </div>`;
    $$('[data-go]').forEach(el=>el.onclick = ()=>go(el.dataset.go));
    return;
  }

  const all = DB.get('orders').filter(o=>o.userId===u.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const tabs = [
    { id:'all', label:'Semua', filter:()=>true },
    { id:'menunggu', label:'Menunggu Pembayaran', filter:o=>o.status==='Menunggu Pembayaran' },
    { id:'verifikasi', label:'Menunggu Verifikasi', filter:o=>o.paymentStatus==='Menunggu Verifikasi' },
    { id:'diproses', label:'Diproses', filter:o=>['Pembayaran Diterima','Menunggu Diproses','Proses'].includes(o.status) },
    { id:'selesai', label:'Selesai', filter:o=>o.status==='Selesai' }
  ];
  state.orderTab = state.orderTab || 'all';
  const tab = tabs.find(t=>t.id===state.orderTab) || tabs[0];
  const filtered = all.filter(tab.filter);

  $('#app').innerHTML = `
    <h2 class="section-title">📦 Pesananku</h2>
    <div class="tabs">
      ${tabs.map(t=>`<button class="tab ${state.orderTab===t.id?'active':''}" data-tab="${t.id}">${t.label}</button>`).join('')}
    </div>
    ${filtered.length===0 ? `
      <div class="empty">
        <div class="empty-icon">💗</div>
        <h3>Belum ada pesanan</h3>
        <p>Yuk mulai belanja di PinkyStudy!</p>
        <button class="btn btn-primary" data-go="#/jualan">🛍️ Mulai Belanja</button>
      </div>
    ` : filtered.map(o=>`
      <div class="order-card" data-order="${o.id}">
        <div class="order-head">
          <span class="order-id">${o.id}</span>
          <span class="status-pill ${statusClass(o.status)}">${o.status}</span>
        </div>
        <div style="font-size:.88rem;color:var(--text-soft);">
          ${o.items.map(i=>`${i.emoji} ${i.name} × ${i.qty}`).join(' · ')}
        </div>
        <div class="row-between mt-12">
          <strong style="color:var(--pink-600);font-size:1.05rem;">${rp(o.subtotal)}</strong>
          <span style="font-size:.82rem;color:var(--text-soft);">🎀 Antrian #${o.antrian}</span>
        </div>
        ${o.paymentStatus==='Menunggu Verifikasi' ? `<div style="font-size:.78rem;color:#a15200;margin-top:6px;">⏳ Menunggu verifikasi pembayaran</div>`:''}
      </div>
    `).join('')}
  `;

  $$('[data-tab]').forEach(el=>el.onclick = ()=>{ state.orderTab = el.dataset.tab; pagePesananList(); });
  $$('[data-order]').forEach(el=>el.onclick = ()=>go('#/pesanan/'+el.dataset.order));
  $$('[data-go]').forEach(el=>el.onclick = ()=>go(el.dataset.go));
}

function statusClass(s){
  return {
    'Menunggu Pembayaran':'status-menunggu',
    'Pembayaran Diterima':'status-diterima',
    'Menunggu Diproses':'status-diproses',
    'Proses':'status-proses',
    'Selesai':'status-selesai'
  }[s] || 'status-menunggu';
}

/* ====================================================================
   DETAIL PESANAN (BUYER)
   ==================================================================== */
function pagePesananDetail(id){
  const u = getUser();
  const order = DB.get('orders').find(o=>o.id===id);
  if(!order){ go('#/pesanan'); return; }
  if(!u || (u.role!=='admin' && order.userId!==u.id)){ toast('Tidak berhak melihat 💗','error'); go('#/pesanan'); return; }

  const steps = ['Menunggu Pembayaran','Pembayaran Diterima','Menunggu Diproses','Proses','Selesai'];
  const curIdx = Math.max(0, steps.indexOf(order.status));
  const progressW = (curIdx / (steps.length-1)) * 84;

  const canRate = order.status === 'Selesai';
  const alreadyRated = DB.get('ratings').some(r=>r.orderId===order.id);

  $('#app').innerHTML = `
    <button class="back-link" onclick="history.back()">← Kembali</button>
    <div class="card mb-16">
      <div class="row-between">
        <h2 style="color:var(--pink-600);font-size:1.15rem;font-family:'Playfair Display',serif;font-style:italic;">${order.id}</h2>
        <span class="status-pill ${statusClass(order.status)}">${order.status}</span>
      </div>
      <div style="font-size:.85rem;color:var(--text-soft);margin-top:6px;">
        Dibuat: ${new Date(order.createdAt).toLocaleString('id-ID')}
      </div>
      <div class="mt-16" style="background:linear-gradient(135deg,var(--pink-100),var(--lavender));padding:14px;border-radius:14px;text-align:center;">
        <div style="font-weight:800;color:var(--pink-700);font-size:1.05rem;">🎀 Antrian kamu: #${order.antrian}</div>
        <div style="font-size:.85rem;color:var(--text-soft);margin-top:4px;">Saat ini kamu berada di antrian ke-${parseInt(order.antrian)}</div>
      </div>
    </div>

    <div class="card mb-16">
      <h3 style="color:var(--pink-600);margin-bottom:16px;">📍 Status Pesanan</h3>
      <div class="tracker">
        <div class="tracker-progress" style="width:${progressW}%;"></div>
        ${steps.map((s,i)=>`
          <div class="tracker-step ${i<curIdx?'done':''} ${i===curIdx?'current':''}">
            <div class="tracker-dot">${i<curIdx?'✓':i+1}</div>
            <div class="tracker-label">${s}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card mb-16">
      <h3 style="color:var(--pink-600);margin-bottom:12px;">🛍️ Detail Item</h3>
      ${order.items.map(i=>`
        <div class="summary-row"><span>${i.emoji} ${i.name} × ${i.qty} (${i.unit})</span><span>${rp(i.price*i.qty)}</span></div>
      `).join('')}
      <div class="summary-total"><span>Total</span><span>${rp(order.subtotal)}</span></div>
    </div>

    <div class="card mb-16">
      <h3 style="color:var(--pink-600);margin-bottom:12px;">💳 Pembayaran</h3>
      <div class="summary-row"><span>Metode</span><strong>${order.payment}</strong></div>
      <div class="summary-row"><span>Status</span>
        <span class="status-pill ${order.paymentStatus==='Pembayaran Diterima'?'status-diterima':order.paymentStatus==='Menunggu Verifikasi'?'status-verifikasi':'status-menunggu'}">${order.paymentStatus}</span>
      </div>
      ${order.paidAt?`<div class="summary-row"><span>Waktu bayar</span><span>${new Date(order.paidAt).toLocaleString('id-ID')}</span></div>`:''}
    </div>

    <div class="card mb-16">
      <h3 style="color:var(--pink-600);margin-bottom:12px;">👤 Data Pemesan</h3>
      <div class="summary-row"><span>Nama</span><span>${order.customer.name}</span></div>
      <div class="summary-row"><span>Email</span><span>${order.customer.email}</span></div>
      <div class="summary-row"><span>WhatsApp</span><span>${order.customer.wa}</span></div>
      ${order.note?`<div class="summary-row"><span>Catatan</span><span>${order.note}</span></div>`:''}
      ${order.deadlineDate?`<div class="summary-row"><span>Deadline</span><span>${order.deadlineDate} ${order.deadlineTime||''}</span></div>`:''}
    </div>

    ${order.file?`
      <div class="card mb-16">
        <h3 style="color:var(--pink-600);margin-bottom:10px;">📎 File Kamu</h3>
        <div class="summary-row"><span>${order.file.name}</span><span>${(order.file.size/1024).toFixed(1)} KB</span></div>
      </div>
    `:''}

    ${order.resultFile?`
      <div class="card mb-16" style="background:linear-gradient(135deg,var(--pink-100),var(--lavender));border-color:var(--pink-300);">
        <h3 style="color:var(--pink-700);margin-bottom:10px;">✨ Hasil Daftar Pustaka</h3>
        <p style="font-size:.9rem;color:var(--text-soft);margin-bottom:12px;">Pesanan daftar pustaka kamu sudah selesai 💗 Hasil telah dikirim ke email.</p>
        <button class="btn btn-primary btn-block" id="dlResult">📥 Lihat / Download Hasil</button>
      </div>
    `:''}

    ${canRate && !alreadyRated ? `
      <button class="btn btn-lavender btn-block mb-10" data-go="#/rating/${order.id}">⭐ Berikan Rating</button>
    `:''}
    ${alreadyRated ? `<div class="text-center mb-10" style="color:var(--pink-600);font-weight:700;">⭐ Terima kasih sudah memberi rating 💗</div>`:''}

    <button class="btn btn-soft btn-block" data-action="wa">💬 Chat Admin via WhatsApp</button>
  `;

  $$('[data-go]').forEach(el=>el.onclick = ()=>go(el.dataset.go));
  const dl = $('#dlResult');
  if(dl) dl.onclick = ()=>{
    const content = `PINKYSTUDY - HASIL DAFTAR PUSTAKA\n\nOrder ID: ${order.id}\nNama: ${order.customer.name}\nTanggal: ${new Date().toLocaleString('id-ID')}\n\n[Dokumen hasil daftar pustaka tersedia]\n\nTerima kasih telah menggunakan jasa PinkyStudy 💗`;
    const blob = new Blob([content], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `hasil-${order.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Hasil berhasil diunduh 💗');
  };
}

/* ====================================================================
   RATING
   ==================================================================== */
function pageRating(id){
  const u = getUser();
  const order = DB.get('orders').find(o=>o.id===id);
  if(!order || !u || order.userId!==u.id || order.status!=='Selesai'){ go('#/pesanan'); return; }
  if(DB.get('ratings').some(r=>r.orderId===order.id)){ toast('Sudah pernah memberi rating','info'); go('#/pesanan/'+id); return; }

  let stars = 0;

  $('#app').innerHTML = `
    <button class="back-link" onclick="history.back()">← Kembali</button>
    <h2 class="section-title">⭐ Berikan Rating</h2>
    <div class="card">
      <p class="text-center" style="color:var(--text-soft);margin-bottom:16px;">Bagaimana pengalaman belanjamu di PinkyStudy?</p>
      <div class="text-center" style="font-size:3rem;letter-spacing:8px;margin-bottom:20px;" id="starBox">
        ${[1,2,3,4,5].map(i=>`<span data-star="${i}" style="cursor:pointer;transition:all .15s;color:#e0d5dc;">★</span>`).join('')}
      </div>
      <div class="form-group">
        <label>Review (opsional)</label>
        <textarea class="form-textarea" id="reviewText" placeholder="Tulis review kamu di sini..."></textarea>
      </div>
      <button class="btn btn-primary btn-block" id="submitRating" disabled>Kirim Rating 💗</button>
    </div>
  `;

  const renderStars = ()=>{
    $$('[data-star]').forEach(s=>{
      const n = +s.dataset.star;
      s.style.color = n <= stars ? 'var(--pink-500)' : '#e0d5dc';
      s.style.transform = n <= stars ? 'scale(1.15)' : 'scale(1)';
    });
    $('#submitRating').disabled = stars === 0;
  };
  $$('[data-star]').forEach(s=>s.onclick = ()=>{ stars = +s.dataset.star; renderStars(); });
  $('#submitRating').onclick = ()=>{
    const review = $('#reviewText').value.trim();
    const arr = DB.get('ratings');
    arr.unshift({ id:uid('r_'), orderId:order.id, userId:u.id, userName:u.name, rating:stars, review, date:nowISO() });
    DB.set('ratings', arr);
    notify('u_admin','rating',`Rating baru: ${stars}★ dari ${u.name} untuk ${order.id} 💗`);
    toast('Terima kasih atas ratingnya 💗');
    go('#/pesanan/'+order.id);
  };
}

/* ====================================================================
   PROFIL
   ==================================================================== */
function pageProfil(){
  const u = getUser();
  if(!u){
    $('#app').innerHTML = `
      <h2 class="section-title">👤 Profil</h2>
      <div class="empty">
        <div class="empty-icon">🔒</div>
        <h3>Login dulu yuk 💗</h3>
        <p>Silakan login untuk melihat pesananmu</p>
        <div class="row" style="justify-content:center;gap:10px;">
          <button class="btn btn-primary" data-go="#/login">Login</button>
          <button class="btn btn-soft" data-go="#/daftar">Daftar</button>
        </div>
      </div>`;
    $$('[data-go]').forEach(el=>el.onclick = ()=>go(el.dataset.go));
    return;
  }
  const orders = DB.get('orders').filter(o=>o.userId===u.id);
  const active = orders.filter(o=>!['Selesai'].includes(o.status)).length;
  const done = orders.filter(o=>o.status==='Selesai').length;

  $('#app').innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">👤</div>
      <div class="profile-info">
        <h2>${u.name}</h2>
        <p>✉️ ${u.email}</p>
        <p>📱 ${u.whatsapp}</p>
        <span class="role-badge">${u.role==='admin'?'🛡️ ADMIN':'🌸 BUYER'}</span>
      </div>
    </div>

    <div class="admin-stats mb-20">
      <div class="stat-card"><div class="num">${orders.length}</div><div class="lbl">Total Pesanan</div></div>
      <div class="stat-card"><div class="num">${active}</div><div class="lbl">Aktif</div></div>
      <div class="stat-card"><div class="num">${done}</div><div class="lbl">Selesai</div></div>
    </div>

    <div class="menu-list">
      <div class="menu-item" data-go="#/editprofil"><span>✏️ Edit Profil</span><span class="arrow">›</span></div>
      <div class="menu-item" data-go="#/pesanan"><span>📦 Riwayat Pesanan</span><span class="arrow">›</span></div>
      <div class="menu-item" data-action="wa"><span>💬 Bantuan / WhatsApp Admin</span><span class="arrow">›</span></div>
      ${u.role==='admin'?`<div class="menu-item" data-go="#/admin"><span>🛡️ Admin Dashboard</span><span class="arrow">›</span></div>`:''}
      <div class="menu-item" id="logoutBtn" style="color:#d6336c;"><span>🚪 Logout</span><span class="arrow">›</span></div>
    </div>
  `;
  $$('[data-go]').forEach(el=>el.onclick = ()=>go(el.dataset.go));
  $('#logoutBtn').onclick = ()=>{
    modal({
      title:'Logout?', text:'Yakin ingin keluar dari akunmu?',
      confirmText:'Ya, Logout', danger:true,
      onConfirm: ()=>{ DB.set('session', null); toast('Berhasil logout 💗','info'); go('#/'); }
    });
  };
}

function pageEditProfil(){
  const u = getUser();
  if(!u){ go('#/login'); return; }
  $('#app').innerHTML = `
    <button class="back-link" onclick="history.back()">← Kembali</button>
    <h2 class="section-title">✏️ Edit Profil</h2>
    <div class="card">
      <div class="form-group"><label>Nama</label><input class="form-input" id="eName" value="${u.name}"></div>
      <div class="form-group"><label>Email</label><input class="form-input" id="eEmail" value="${u.email}"></div>
      <div class="form-group"><label>WhatsApp</label><input class="form-input" id="eWa" value="${u.whatsapp}"></div>
      <button class="btn btn-primary btn-block mt-16" id="saveP">Simpan 💗</button>
    </div>
  `;
  $('#saveP').onclick = ()=>{
    const n = $('#eName').value.trim();
    const e = $('#eEmail').value.trim();
    const w = $('#eWa').value.trim();
    if(!n||!e||!w) return toast('Semua field wajib diisi','error');
    const users = DB.get('users');
    const idx = users.findIndex(x=>x.id===u.id);
    users[idx] = { ...users[idx], name:n, email:e, whatsapp:w };
    DB.set('users', users);
    toast('Profil berhasil diubah 💗');
    go('#/profil');
  };
}

/* ====================================================================
   BANTUAN
   ==================================================================== */
function pageBantuan(){
  $('#app').innerHTML = `
    <h2 class="section-title">💬 Bantuan / Info Admin</h2>
    <div class="card mb-16">
      <h3 style="color:var(--pink-600);margin-bottom:10px;">Butuh bantuan?</h3>
      <p style="color:var(--text-soft);margin-bottom:16px;">Hubungi Admin PinkyStudy via WhatsApp. Kami siap membantu 💗</p>
      <button class="btn btn-primary btn-block" data-action="wa">💬 Chat Admin via WhatsApp</button>
    </div>
    <div class="card mb-16">
      <h3 style="color:var(--pink-600);margin-bottom:14px;">📱 Media Sosial</h3>
      <div class="row" style="gap:12px;flex-wrap:wrap;">
        <button class="btn btn-soft" data-action="wa">💬 WhatsApp</button>
        <button class="btn btn-soft" data-action="ig">📷 Instagram</button>
        <button class="btn btn-soft" data-action="tt">🎵 TikTok</button>
      </div>
    </div>
    <div class="card">
      <h3 style="color:var(--pink-600);margin-bottom:14px;">❓ FAQ</h3>
      <div style="display:flex;flex-direction:column;gap:14px;font-size:.9rem;">
        <div><strong>Bagaimana cara pesan jasa daftar pustaka?</strong><br><span style="color:var(--text-soft);">Buka menu Jualan → pilih Jasa Daftar Pustaka → pilih jumlah paket → upload file → checkout.</span></div>
        <div><strong>Apakah bisa pesan untuk hari ini?</strong><br><span style="color:var(--text-soft);">Tidak. Pemesanan jasa minimal H-1.</span></div>
        <div><strong>Bagaimana cara pantau pesanan?</strong><br><span style="color:var(--text-soft);">Buka menu Pesanan dan lihat nomor antrian kamu.</span></div>
        <div><strong>Kapan hasil jasa dikirim?</strong><br><span style="color:var(--text-soft);">Setelah admin selesai, hasil akan dikirim ke emailmu.</span></div>
        <div><strong>Metode pembayaran apa saja tersedia?</strong><br><span style="color:var(--text-soft);">Transfer Bank, Virtual Account, QRIS, GoPay, OVO, DANA, ShopeePay, LinkAja, Mobile Banking, dan lainnya.</span></div>
      </div>
    </div>
  `;
}

/* ====================================================================
   LOGIN / DAFTAR
   ==================================================================== */
function pageLogin(){
  $('#app').innerHTML = `
    <h2 class="section-title">🔐 Login</h2>
    <div class="card" style="max-width:440px;margin:0 auto;">
      <div class="form-group"><label>Email</label><input class="form-input" id="lEmail" type="email" placeholder="nama@email.com"></div>
      <div class="form-group"><label>Password</label><input class="form-input" id="lPass" type="password" placeholder="••••••"></div>
      <div class="form-error mb-12" id="lErr">Email atau password salah.</div>
      <button class="btn btn-primary btn-block" id="loginBtn">Login 💗</button>
      <p class="text-center mt-16" style="font-size:.9rem;color:var(--text-soft);">Belum punya akun? <a href="#/daftar" data-link style="color:var(--pink-600);font-weight:800;">Daftar</a></p>
      <div class="mt-16" style="padding:12px;background:var(--pink-50);border-radius:12px;font-size:.82rem;color:var(--text-soft);">
        <strong>Demo akun:</strong><br>
        Admin → admin@pinkystudy.id / admin123<br>
        Buyer → daftar akun baru 🌸
      </div>
    </div>
  `;
  $('#loginBtn').onclick = ()=>{
    const email = $('#lEmail').value.trim().toLowerCase();
    const pass = $('#lPass').value;
    const u = DB.get('users').find(x=>x.email.toLowerCase()===email && x.password===pass);
    if(!u){ $('#lErr').classList.add('show'); return; }
    DB.set('session', { userId:u.id });
    toast(`Halo ${u.name} 💗`);
    go(u.role==='admin' ? '#/admin' : '#/');
  };
}

function pageDaftar(){
  $('#app').innerHTML = `
    <h2 class="section-title">✨ Daftar Akun</h2>
    <div class="card" style="max-width:440px;margin:0 auto;">
      <div class="form-group"><label>Nama</label><input class="form-input" id="rName" placeholder="Nama lengkap"></div>
      <div class="form-group"><label>Email</label><input class="form-input" id="rEmail" type="email" placeholder="nama@email.com"></div>
      <div class="form-group"><label>WhatsApp</label><input class="form-input" id="rWa" placeholder="08xxxxxxxxxx"></div>
      <div class="form-group"><label>Password</label><input class="form-input" id="rPass" type="password" placeholder="min 6 karakter"></div>
      <div class="form-error mb-12" id="rErr">Lengkapi semua data dengan benar.</div>
      <button class="btn btn-primary btn-block" id="regBtn">Daftar 💗</button>
      <p class="text-center mt-16" style="font-size:.9rem;color:var(--text-soft);">Sudah punya akun? <a href="#/login" data-link style="color:var(--pink-600);font-weight:800;">Login</a></p>
    </div>
  `;
  $('#regBtn').onclick = ()=>{
    const name = $('#rName').value.trim();
    const email = $('#rEmail').value.trim().toLowerCase();
    const wa = $('#rWa').value.trim();
    const pass = $('#rPass').value;
    if(!name || !email || !wa || pass.length<6){ $('#rErr').classList.add('show'); return; }
    const users = DB.get('users');
    if(users.find(x=>x.email.toLowerCase()===email)){ toast('Email sudah terdaftar','error'); return; }
    const id = uid('u_');
    users.push({ id, name, email, whatsapp:wa, password:pass, role:'user', createdAt:nowISO() });
    DB.set('users', users);
    DB.set('session', { userId:id });
    toast(`Selamat datang, ${name} 💗`);
    go('#/');
  };
}

/* ====================================================================
   ADMIN DASHBOARD
   ==================================================================== */
function pageAdminDashboard(){ pageAdminSection('dashboard'); }

function pageAdminSection(section){
  if(!isAdmin()){ go('#/'); return; }
  state.adminTab = section;
  const sidebar = `
    <aside class="admin-sidebar">
      <h3>🛡️ Admin Panel</h3>
      <nav class="admin-menu">
        <a data-admin="dashboard" class="${section==='dashboard'?'active':''}">📊 Dashboard</a>
        <a data-admin="pesanan" class="${section==='pesanan'?'active':''}">📦 Pesanan</a>
        <a data-admin="produk" class="${section==='produk'?'active':''}">🛍️ Produk</a>
        <a data-admin="stok" class="${section==='stok'?'active':''}">📊 Stok</a>
        <a data-admin="pembayaran" class="${section==='pembayaran'?'active':''}">💳 Pembayaran</a>
        <a data-admin="file" class="${section==='file'?'active':''}">📎 File Jasa</a>
        <a data-admin="antrian" class="${section==='antrian'?'active':''}">🎀 Antrian</a>
        <a data-admin="rating" class="${section==='rating'?'active':''}">⭐ Rating</a>
        <a data-admin="pengguna" class="${section==='pengguna'?'active':''}">👥 Pengguna</a>
        <a data-admin="pengaturan" class="${section==='pengaturan'?'active':''}">⚙️ Pengaturan</a>
        <a id="adminLogout" style="color:#d6336c;">🚪 Logout</a>
      </nav>
    </aside>
  `;

  let content = '';
  if(section==='dashboard') content = adminDashboardContent();
  else if(section==='pesanan') content = adminPesananContent();
  else if(section==='produk') content = adminProdukContent();
  else if(section==='stok') content = adminStokContent();
  else if(section==='pembayaran') content = adminPembayaranContent();
  else if(section==='file') content = adminFileContent();
  else if(section==='antrian') content = adminAntrianContent();
  else if(section==='rating') content = adminRatingContent();
  else if(section==='pengguna') content = adminPenggunaContent();
  else if(section==='pengaturan') content = adminPengaturanContent();
  else content = adminDashboardContent();

  $('#app').innerHTML = `
    <h2 class="section-title">🛡️ Admin Panel</h2>
    <div class="admin-layout">
      ${sidebar}
      <div class="admin-content">${content}</div>
    </div>
  `;

  $$('[data-admin]').forEach(el=>el.onclick = ()=>{ go('#/admin/'+el.dataset.admin); });
  $('#adminLogout').onclick = ()=>{
    modal({
      title:'Logout Admin?', text:'Yakin ingin keluar?',
      confirmText:'Ya, Logout', danger:true,
      onConfirm: ()=>{ DB.set('session', null); toast('Berhasil logout','info'); go('#/'); }
    });
  };
  bindAdminActions(section);
}

function adminDashboardContent(){
  const orders = DB.get('orders');
  const products = DB.get('products');
  const users = DB.get('users');
  const ratings = DB.get('ratings');
  const stats = {
    total: orders.length,
    baru: orders.filter(o=>o.status==='Menunggu Pembayaran').length,
    verif: orders.filter(o=>o.paymentStatus==='Menunggu Verifikasi').length,
    diproses: orders.filter(o=>['Pembayaran Diterima','Menunggu Diproses','Proses'].includes(o.status)).length,
    selesai: orders.filter(o=>o.status==='Selesai').length,
    buyers: users.filter(u=>u.role==='user').length,
    files: orders.filter(o=>o.file).length,
    ratings: ratings.length
  };
  const lowStock = products.filter(p=>p.stock!==null && p.stock>0 && p.stock<=5);
  return `
    <h3 style="color:var(--pink-600);margin-bottom:16px;">📊 Ringkasan</h3>
    <div class="admin-stats">
      <div class="stat-card"><div class="num">${stats.total}</div><div class="lbl">Total Pesanan</div></div>
      <div class="stat-card"><div class="num">${stats.baru}</div><div class="lbl">Menunggu Bayar</div></div>
      <div class="stat-card"><div class="num">${stats.verif}</div><div class="lbl">Menunggu Verifikasi</div></div>
      <div class="stat-card"><div class="num">${stats.diproses}</div><div class="lbl">Diproses</div></div>
      <div class="stat-card"><div class="num">${stats.selesai}</div><div class="lbl">Selesai</div></div>
      <div class="stat-card"><div class="num">${stats.buyers}</div><div class="lbl">Pembeli</div></div>
      <div class="stat-card"><div class="num">${stats.files}</div><div class="lbl">File Jasa</div></div>
      <div class="stat-card"><div class="num">${stats.ratings}</div><div class="lbl">Rating</div></div>
    </div>
    ${lowStock.length>0?`
      <div class="card" style="background:#fff3cd;border-color:#ffd966;">
        <strong style="color:#856404;">⚠️ Stok hampir habis:</strong>
        <ul style="margin-top:8px;margin-left:20px;font-size:.88rem;">
          ${lowStock.map(p=>`<li>${p.emoji} ${p.name} — ${p.stock} ${p.unit} tersisa</li>`).join('')}
        </ul>
      </div>
    `:''}
  `;
}

function adminPesananContent(){
  const orders = DB.get('orders').sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const filter = state.adminFilter || 'all';
  const filtered = filter==='all' ? orders : orders.filter(o=>o.status===filter);
  return `
    <div class="row-between mb-16">
      <h3 style="color:var(--pink-600);">📦 Daftar Pesanan</h3>
      <select class="form-select" id="filterStatus" style="max-width:220px;">
        <option value="all" ${filter==='all'?'selected':''}>Semua Status</option>
        <option value="Menunggu Pembayaran" ${filter==='Menunggu Pembayaran'?'selected':''}>Menunggu Pembayaran</option>
        <option value="Pembayaran Diterima" ${filter==='Pembayaran Diterima'?'selected':''}>Pembayaran Diterima</option>
        <option value="Menunggu Diproses" ${filter==='Menunggu Diproses'?'selected':''}>Menunggu Diproses</option>
        <option value="Proses" ${filter==='Proses'?'selected':''}>Proses</option>
        <option value="Selesai" ${filter==='Selesai'?'selected':''}>Selesai</option>
      </select>
    </div>
    ${filtered.length===0?`
      <div class="empty"><div class="empty-icon">📭</div><h3>Belum ada pesanan</h3></div>
    `:`
    <div style="overflow-x:auto;">
      <table class="admin-table">
        <thead>
          <tr><th>Order ID</th><th>Nama</th><th>Produk</th><th>Total</th><th>Bayar</th><th>Status</th><th>Antrian</th></tr>
        </thead>
        <tbody>
          ${filtered.map(o=>`
            <tr data-admin-order="${o.id}">
              <td><strong>${o.id}</strong></td>
              <td>${o.customer.name}<br><small style="color:var(--text-soft);">${o.customer.wa}</small></td>
              <td>${o.items.map(i=>i.name+'×'+i.qty).join(', ')}</td>
              <td>${rp(o.subtotal)}</td>
              <td><span class="status-pill ${o.paymentStatus==='Pembayaran Diterima'?'status-diterima':o.paymentStatus==='Menunggu Verifikasi'?'status-verifikasi':'status-menunggu'}">${o.paymentStatus}</span></td>
              <td><span class="status-pill ${statusClass(o.status)}">${o.status}</span></td>
              <td>#${o.antrian}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`}
  `;
}

function adminProdukContent(){
  const products = DB.get('products');
  return `
    <div class="row-between mb-16">
      <h3 style="color:var(--pink-600);">🛍️ Kelola Produk</h3>
      <button class="btn btn-primary btn-sm" data-add-prod>+ Tambah Produk</button>
    </div>
    <div class="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;">
      ${products.map(p=>`
        <div class="card" style="padding:14px;">
          <div class="product-thumb ${p.category==='Jasa'?'jasa':''}" style="aspect-ratio:2/1;font-size:2.5rem;">${p.emoji}</div>
          <h4 style="margin-top:10px;">${p.name}</h4>
          <p style="font-size:.85rem;color:var(--pink-600);font-weight:700;">${rp(p.price)} / ${p.unit}</p>
          <p style="font-size:.78rem;color:var(--text-soft);">${p.category}</p>
          <p style="font-size:.78rem;color:var(--text-soft);">${p.stock!==null?`Stok: ${p.stock}`:`Kapasitas: ${p.capacity}/hari`}</p>
          <div class="row mt-10" style="gap:6px;">
            <button class="btn btn-soft btn-sm flex-1" data-edit-prod="${p.id}">✏️ Edit</button>
            <button class="btn btn-danger btn-sm flex-1" data-del-prod="${p.id}">🗑️</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function adminStokContent(){
  const products = DB.get('products').filter(p=>p.stock!==null);
  return `
    <h3 style="color:var(--pink-600);margin-bottom:16px;">📊 Kelola Stok</h3>
    <div class="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">
      ${products.map(p=>`
        <div class="card">
          <div class="row" style="gap:12px;align-items:center;">
            <div class="cart-thumb">${p.emoji}</div>
            <div class="flex-1">
              <strong>${p.name}</strong><br>
              <small style="color:var(--text-soft);">Stok saat ini: <strong id="stok-${p.id}">${p.stock}</strong> ${p.unit}</small>
            </div>
          </div>
          <div class="row mt-12" style="gap:8px;">
            <button class="btn btn-danger btn-sm flex-1" data-stok-minus="${p.id}">− Kurangi</button>
            <button class="btn btn-soft btn-sm flex-1" data-stok-plus="${p.id}">+ Tambah</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function adminPembayaranContent(){
  const orders = DB.get('orders').filter(o=>o.paymentStatus==='Menunggu Verifikasi');
  return `
    <h3 style="color:var(--pink-600);margin-bottom:16px;">💳 Verifikasi Pembayaran</h3>
    ${orders.length===0?`
      <div class="empty"><div class="empty-icon">✨</div><h3>Tidak ada pembayaran menunggu verifikasi</h3></div>
    `:orders.map(o=>`
      <div class="card mb-12">
        <div class="row-between">
          <strong>${o.id} — ${o.customer.name}</strong>
          <span style="color:var(--pink-600);font-weight:800;">${rp(o.subtotal)}</span>
        </div>
        <div style="font-size:.85rem;color:var(--text-soft);margin:8px 0;">Metode: <strong>${o.payment}</strong> · WA: ${o.customer.wa}</div>
        <div class="row" style="gap:8px;">
          <button class="btn btn-success btn-sm flex-1" data-verify-ok="${o.id}">✅ Terima Pembayaran</button>
          <button class="btn btn-danger btn-sm flex-1" data-verify-fail="${o.id}">❌ Tolak</button>
        </div>
      </div>
    `).join('')}
  `;
}

function adminFileContent(){
  const orders = DB.get('orders').filter(o=>o.file);
  return `
    <h3 style="color:var(--pink-600);margin-bottom:16px;">📎 File Jasa</h3>
    ${orders.length===0?`
      <div class="empty"><div class="empty-icon">📂</div><h3>Belum ada file yang di-upload</h3></div>
    `:orders.map(o=>`
      <div class="card mb-12">
        <div class="row-between">
          <strong>${o.id}</strong>
          <span class="status-pill ${statusClass(o.status)}">${o.status}</span>
        </div>
        <div style="font-size:.85rem;color:var(--text-soft);margin:8px 0;">
          👤 ${o.customer.name} (${o.customer.email})<br>
          📎 ${o.file.name} (${(o.file.size/1024).toFixed(1)} KB)<br>
          ⏰ Deadline: ${o.deadlineDate||'-'} ${o.deadlineTime||''}
        </div>
        <div class="row" style="gap:8px;flex-wrap:wrap;">
          <button class="btn btn-soft btn-sm" data-dl-file="${o.id}">⬇️ Download</button>
          ${!o.resultFile?`
            <input type="file" id="result-${o.id}" style="display:none;">
            <button class="btn btn-primary btn-sm" data-upload-result="${o.id}">📤 Upload Hasil</button>
          `:`<span class="stock-pill stock-ok">✅ Hasil sudah diupload: ${o.resultFile.name}</span>`}
        </div>
      </div>
    `).join('')}
  `;
}

function adminAntrianContent(){
  const orders = DB.get('orders').filter(o=>o.status!=='Selesai').sort((a,b)=>(+a.antrian)-(+b.antrian));
  return `
    <h3 style="color:var(--pink-600);margin-bottom:16px;">🎀 Kelola Antrian</h3>
    ${orders.length===0?`<div class="empty"><div class="empty-icon">✨</div><h3>Antrian kosong</h3></div>`:
    orders.map(o=>`
      <div class="card mb-12">
        <div class="row-between">
          <strong>#${o.antrian} — ${o.id}</strong>
          <span class="status-pill ${statusClass(o.status)}">${o.status}</span>
        </div>
        <div style="font-size:.85rem;color:var(--text-soft);margin:8px 0;">👤 ${o.customer.name}</div>
        <div class="row" style="gap:8px;align-items:center;">
          <label style="font-size:.85rem;font-weight:700;">Ubah No:</label>
          <input class="form-input" id="antrian-${o.id}" value="${o.antrian}" style="max-width:100px;">
          <button class="btn btn-primary btn-sm" data-save-antrian="${o.id}">Simpan</button>
        </div>
      </div>
    `).join('')}
  `;
}

function adminRatingContent(){
  const ratings = DB.get('ratings').sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(ratings.length===0) return `<div class="empty"><div class="empty-icon">⭐</div><h3>Belum ada rating</h3></div>`;
  const avg = (ratings.reduce((s,r)=>s+r.rating,0)/ratings.length).toFixed(1);
  return `
    <h3 style="color:var(--pink-600);margin-bottom:16px;">⭐ Rating & Review</h3>
    <div class="card mb-16">
      <div style="text-align:center;">
        <div style="font-size:2.5rem;font-weight:800;color:var(--pink-600);">${avg}</div>
        <div style="color:#ffb400;font-size:1.4rem;">${'★'.repeat(Math.round(avg))}${'☆'.repeat(5-Math.round(avg))}</div>
        <div style="font-size:.85rem;color:var(--text-soft);">Dari ${ratings.length} rating</div>
      </div>
    </div>
    ${ratings.map(r=>`
      <div class="card mb-12">
        <div class="row-between">
          <strong>${r.userName}</strong>
          <span style="color:#ffb400;">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
        </div>
        <div style="font-size:.78rem;color:var(--text-soft);margin:4px 0;">Order ${r.orderId} · ${new Date(r.date).toLocaleString('id-ID')}</div>
        ${r.review?`<p style="font-size:.9rem;margin-top:6px;">"${r.review}"</p>`:''}
      </div>
    `).join('')}
  `;
}

function adminPenggunaContent(){
  const users = DB.get('users');
  return `
    <h3 style="color:var(--pink-600);margin-bottom:16px;">👥 Pengguna</h3>
    <div style="overflow-x:auto;">
      <table class="admin-table">
        <thead><tr><th>Nama</th><th>Email</th><th>WhatsApp</th><th>Role</th></tr></thead>
        <tbody>
          ${users.map(u=>`
            <tr>
              <td>${u.name}</td>
              <td>${u.email}</td>
              <td>${u.whatsapp}</td>
              <td><span class="stock-pill ${u.role==='admin'?'stock-low':'stock-ok'}">${u.role}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function adminPengaturanContent(){
  const s = getSettings();
  return `
    <h3 style="color:var(--pink-600);margin-bottom:16px;">⚙️ Pengaturan Toko</h3>
    <div class="card mb-16">
      <h4 style="color:var(--pink-600);margin-bottom:12px;">🏪 Info Toko</h4>
      <div class="form-group"><label>Nama Toko</label><input class="form-input" id="setStoreName" value="${s.storeName}"></div>
      <div class="form-group"><label>Nomor WhatsApp Admin</label><input class="form-input" id="setWa" value="${s.waAdmin}"></div>
      <div class="form-group"><label>Pesan Otomatis WhatsApp</label><textarea class="form-textarea" id="setWaMsg">${s.waMessage}</textarea></div>
      <div class="form-group"><label>Instagram URL</label><input class="form-input" id="setIg" value="${s.instagram}"></div>
      <div class="form-group"><label>TikTok URL</label><input class="form-input" id="setTt" value="${s.tiktok}"></div>
    </div>

    <div class="card mb-16">
      <h4 style="color:var(--pink-600);margin-bottom:12px;">🏦 Info Bank</h4>
      <div class="form-group"><label>Nama Bank</label><input class="form-input" id="setBankName" value="${s.bankName}"></div>
      <div class="form-group"><label>Nomor Rekening</label><input class="form-input" id="setBankAcc" value="${s.bankAccount}"></div>
      <div class="form-group"><label>Nama Penerima</label><input class="form-input" id="setBankName2" value="${s.bankAccountName}"></div>
    </div>

    <div class="card mb-16">
      <h4 style="color:var(--pink-600);margin-bottom:12px;">💳 Virtual Account</h4>
      <div class="form-group"><label>Nama VA Bank</label><input class="form-input" id="setVaBank" value="${s.vaBank}"></div>
      <div class="form-group"><label>Nomor VA</label><input class="form-input" id="setVaNum" value="${s.vaNumber}"></div>
    </div>

    <div class="card mb-16">
      <h4 style="color:var(--pink-600);margin-bottom:12px;">📱 QRIS</h4>
      <div class="form-group"><label>Nama Merchant QRIS</label><input class="form-input" id="setQrisMerch" value="${s.qrisMerchant}"></div>
    </div>

    <div class="card mb-16">
      <h4 style="color:var(--pink-600);margin-bottom:12px;">📲 Instruksi E-Wallet</h4>
      ${['gopay','ovo','dana','shopeepay','linkaja','mbanking','other'].map(k=>`
        <div class="form-group">
          <label>${k.toUpperCase()}</label>
          <textarea class="form-textarea" data-instr="${k}">${s.paymentInstructions[k]||''}</textarea>
        </div>
      `).join('')}
    </div>

    <div class="card mb-16">
      <h4 style="color:var(--pink-600);margin-bottom:12px;">🔘 Aktifkan Metode Pembayaran</h4>
      ${Object.keys(s.paymentEnabled).map(k=>`
        <label style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer;">
          <input type="checkbox" data-pay-toggle="${k}" ${s.paymentEnabled[k]?'checked':''} style="width:20px;height:20px;">
          <span>${k}</span>
        </label>
      `).join('')}
    </div>

    <button class="btn btn-primary btn-block btn-lg" id="saveSettings">💗 Simpan Semua Pengaturan</button>
  `;
}

function bindAdminActions(section){
  // Filter pesanan
  const fs = $('#filterStatus');
  if(fs) fs.onchange = ()=>{ state.adminFilter = fs.value; pageAdminSection('pesanan'); };

  // Buka detail pesanan admin
  $$('[data-admin-order]').forEach(el=>el.onclick = ()=>go('#/admin/pesanan/'+el.dataset.adminOrder));

  // Produk
  $$('[data-add-prod]').forEach(el=>el.onclick = ()=>adminEditProduk(null));
  $$('[data-edit-prod]').forEach(el=>el.onclick = ()=>adminEditProduk(el.dataset.editProd));
  $$('[data-del-prod]').forEach(el=>el.onclick = ()=>{
    const p = DB.get('products').find(x=>x.id===el.dataset.delProd);
    modal({
      title:'Hapus produk?', text:`Yakin hapus "${p.name}"?`,
      confirmText:'Ya, Hapus', danger:true,
      onConfirm: ()=>{
        DB.set('products', DB.get('products').filter(x=>x.id!==p.id));
        toast('Produk dihapus','info');
        pageAdminSection('produk');
      }
    });
  });

  // Stok
  $$('[data-stok-plus]').forEach(el=>el.onclick = ()=>{
    const p = DB.get('products').find(x=>x.id===el.dataset.stokPlus);
    modal({
      title:'Tambah stok', text:`Jumlah yang ditambahkan untuk ${p.name}:`,
      confirmText:'Tambah', 
      onConfirm: ()=>{
        const v = prompt('Tambah berapa?', '10');
        if(!v) return;
        const n = parseInt(v);
        if(!n || n<=0) return toast('Jumlah tidak valid','error');
        const prods = DB.get('products');
        const idx = prods.findIndex(x=>x.id===p.id);
        prods[idx].stock += n;
        DB.set('products', prods);
        toast(`Stok ${p.name} ditambah ${n} 💗`);
        pageAdminSection('stok');
      }
    });
  });
  $$('[data-stok-minus]').forEach(el=>el.onclick = ()=>{
    const p = DB.get('products').find(x=>x.id===el.dataset.stokMinus);
    modal({
      title:'Kurangi stok', text:`Jumlah yang dikurangi untuk ${p.name}:`,
      confirmText:'Kurangi', danger:true,
      onConfirm: ()=>{
        const v = prompt('Kurangi berapa?', '5');
        if(!v) return;
        const n = parseInt(v);
        if(!n || n<=0) return toast('Jumlah tidak valid','error');
        const prods = DB.get('products');
        const idx = prods.findIndex(x=>x.id===p.id);
        prods[idx].stock = Math.max(0, prods[idx].stock - n);
        DB.set('products', prods);
        toast(`Stok ${p.name} dikurangi ${n}`,'info');
        pageAdminSection('stok');
      }
    });
  });

  // Verifikasi pembayaran
  $$('[data-verify-ok]').forEach(el=>el.onclick = ()=>{
    const orders = DB.get('orders');
    const idx = orders.findIndex(o=>o.id===el.dataset.verifyOk);
    orders[idx].paymentStatus = 'Pembayaran Diterima';
    orders[idx].status = 'Pembayaran Diterima';
    orders[idx].statusHistory = orders[idx].statusHistory || [];
    orders[idx].statusHistory.push({status:'Pembayaran Diterima', time:nowISO(), note:'Diverifikasi admin'});
    // Kurangi stok
    orders[idx].items.forEach(it=>{
      const pIdx = DB.get('products').findIndex(p=>p.id===it.id);
      if(pIdx>=0){
        const prods = DB.get('products');
        if(prods[pIdx].stock !== null){
          prods[pIdx].stock = Math.max(0, prods[pIdx].stock - it.qty);
          DB.set('products', prods);
        }
      }
    });
    DB.set('orders', orders);
    if(orders[idx].userId && orders[idx].userId!=='guest'){
      notify(orders[idx].userId, 'payment', `Pembayaran pesanan ${orders[idx].id} berhasil diterima 💗 Pesanan kamu sedang diproses.`);
    }
    toast('Pembayaran diterima 💗');
    pageAdminSection('pembayaran');
  });
  $$('[data-verify-fail]').forEach(el=>el.onclick = ()=>{
    const orders = DB.get('orders');
    const idx = orders.findIndex(o=>o.id===el.dataset.verifyFail);
    orders[idx].paymentStatus = 'Pembayaran Gagal';
    DB.set('orders', orders);
    if(orders[idx].userId && orders[idx].userId!=='guest'){
      notify(orders[idx].userId, 'payment', `Pembayaran pesanan ${orders[idx].id} ditolak. Silakan hubungi admin.`);
    }
    toast('Pembayaran ditolak','info');
    pageAdminSection('pembayaran');
  });

  // File
  $$('[data-dl-file]').forEach(el=>el.onclick = ()=>{
    const o = DB.get('orders').find(x=>x.id===el.dataset.dlFile);
    const content = `File Pelanggan\nOrder: ${o.id}\nCustomer: ${o.customer.name}\nFile: ${o.file.name}\nDiakses: ${new Date().toLocaleString('id-ID')}`;
    const blob = new Blob([content],{type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = o.file.name; a.click();
    URL.revokeObjectURL(url);
    toast('File berhasil diunduh 💗');
  });
  $$('[data-upload-result]').forEach(el=>el.onclick = ()=>{
    const oid = el.dataset.uploadResult;
    const input = document.getElementById('result-'+oid);
    if(!input.files.length){ input.click(); return; }
    const f = input.files[0];
    const orders = DB.get('orders');
    const idx = orders.findIndex(o=>o.id===oid);
    orders[idx].resultFile = { name:f.name, size:f.size };
    orders[idx].status = 'Selesai';
    orders[idx].statusHistory = orders[idx].statusHistory || [];
    orders[idx].statusHistory.push({status:'Selesai', time:nowISO(), note:'Hasil dikirim'});
    DB.set('orders', orders);
    if(orders[idx].userId && orders[idx].userId!=='guest'){
      notify(orders[idx].userId, 'result', `Pesanan daftar pustaka ${oid} sudah selesai 💗 Hasil telah dikirim ke email.`);
    }
    toast('Hasil berhasil diupload & pesanan selesai 💗');
    pageAdminSection('file');
  });
  // Override upload button untuk trigger file input
  $$('[data-upload-result]').forEach(el=>{
    const oid = el.dataset.uploadResult;
    const input = document.getElementById('result-'+oid);
    el.onclick = ()=>{ input.click(); };
    input.onchange = ()=>{
      if(!input.files.length) return;
      const f = input.files[0];
      const orders = DB.get('orders');
      const idx = orders.findIndex(o=>o.id===oid);
      orders[idx].resultFile = { name:f.name, size:f.size };
      orders[idx].status = 'Selesai';
      DB.set('orders', orders);
      if(orders[idx].userId && orders[idx].userId!=='guest'){
        notify(orders[idx].userId, 'result', `Pesanan daftar pustaka ${oid} sudah selesai 💗 Hasil telah dikirim ke email.`);
      }
      toast('Hasil berhasil diupload & pesanan selesai 💗');
      pageAdminSection('file');
    };
  });

  // Antrian
  $$('[data-save-antrian]').forEach(el=>el.onclick = ()=>{
    const v = $('#antrian-'+el.dataset.saveAntrian).value.trim();
    const orders = DB.get('orders');
    const idx = orders.findIndex(o=>o.id===el.dataset.saveAntrian);
    orders[idx].antrian = v;
    DB.set('orders', orders);
    toast('Nomor antrian disimpan 💗');
  });

  // Settings
  const ss = $('#saveSettings');
  if(ss) ss.onclick = ()=>{
    const s = {
      storeName: $('#setStoreName').value,
      waAdmin: $('#setWa').value,
      waMessage: $('#setWaMsg').value,
      instagram: $('#setIg').value,
      tiktok: $('#setTt').value,
      bankName: $('#setBankName').value,
      bankAccount: $('#setBankAcc').value,
      bankAccountName: $('#setBankName2').value,
      vaBank: $('#setVaBank').value,
      vaNumber: $('#setVaNum').value,
      qrisMerchant: $('#setQrisMerch').value,
      paymentEnabled: {},
      paymentInstructions: {}
    };
    $$('[data-pay-toggle]').forEach(c=>s.paymentEnabled[c.dataset.payToggle] = c.checked);
    $$('[data-instr]').forEach(t=>s.paymentInstructions[t.dataset.instr] = t.value);
    const old = getSettings();
    s.defaultQuotes = old.defaultQuotes;
    s.qrisImage = old.qrisImage;
    DB.set('settings', s);
    toast('Pengaturan disimpan 💗');
    pageAdminSection('pengaturan');
  };
}

/* ====== ADMIN EDIT PRODUK ====== */
function adminEditProduk(id){
  const isNew = !id;
  const p = isNew ? { id:null, name:'', price:0, unit:'', category:'Alat Tulis', emoji:'📘', desc:'', stock:0, capacity:null, active:true, isService:false }
                  : DB.get('products').find(x=>x.id===id);
  const isService = p.category === 'Jasa';

  $('#app').innerHTML = `
    <button class="back-link" data-go="#/admin/produk">← Kembali</button>
    <h2 class="section-title">${isNew?'➕ Tambah':'✏️ Edit'} Produk</h2>
    <div class="card">
      <div class="form-group"><label>Nama</label><input class="form-input" id="pName" value="${p.name}"></div>
      <div class="form-group"><label>Harga</label><input class="form-input" id="pPrice" type="number" value="${p.price}"></div>
      <div class="form-group"><label>Satuan</label><input class="form-input" id="pUnit" value="${p.unit}" placeholder="contoh: biji / paket (10 lembar)"></div>
      <div class="form-group">
        <label>Kategori</label>
        <select class="form-select" id="pCat">
          ${['Alat Tulis','Perlengkapan Belajar','Jasa'].map(c=>`<option ${p.category===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Emoji/Foto</label><input class="form-input" id="pEmoji" value="${p.emoji}" maxlength="4"></div>
      <div class="form-group"><label>Deskripsi</label><textarea class="form-textarea" id="pDesc">${p.desc}</textarea></div>
      <div class="form-group"><label>Stok (untuk produk fisik)</label><input class="form-input" id="pStock" type="number" value="${p.stock||0}"></div>
      <div class="form-group"><label>Kapasitas Harian (untuk jasa)</label><input class="form-input" id="pCapacity" type="number" value="${p.capacity||0}"></div>
      <div class="form-group">
        <label><input type="checkbox" id="pActive" ${p.active?'checked':''}> Aktif</label>
      </div>
      <button class="btn btn-primary btn-block" id="saveProd">💗 Simpan</button>
    </div>
  `;
  $$('[data-go]').forEach(el=>el.onclick = ()=>go(el.dataset.go));
  $('#saveProd').onclick = ()=>{
    const name = $('#pName').value.trim();
    const price = parseInt($('#pPrice').value) || 0;
    const unit = $('#pUnit').value.trim();
    const category = $('#pCat').value;
    const emoji = $('#pEmoji').value.trim() || '📘';
    const desc = $('#pDesc').value.trim();
    const stockVal = parseInt($('#pStock').value) || 0;
    const capVal = parseInt($('#pCapacity').value) || 0;
    const active = $('#pActive').checked;
    if(!name || price<=0 || !unit) return toast('Nama, harga, satuan wajib','error');

    const products = DB.get('products');
    const data = {
      name, price, unit, category, emoji, desc, active,
      stock: category==='Jasa' ? null : stockVal,
      capacity: category==='Jasa' ? capVal : null,
      isService: category === 'Jasa'
    };
    if(isNew){
      data.id = uid('p_');
      products.push(data);
    } else {
      const idx = products.findIndex(x=>x.id===id);
      products[idx] = { ...products[idx], ...data };
    }
    DB.set('products', products);
    toast('Produk disimpan 💗');
    go('#/admin/produk');
  };
}

/* ====================================================================
   ADMIN DETAIL PESANAN
   ==================================================================== */
function pageAdminPesananDetail(id){
  if(!isAdmin()){ go('#/'); return; }
  const order = DB.get('orders').find(o=>o.id===id);
  if(!order){ go('#/admin/pesanan'); return; }
  const statuses = ['Menunggu Pembayaran','Pembayaran Diterima','Menunggu Diproses','Proses','Selesai'];

  $('#app').innerHTML = `
    <button class="back-link" data-go="#/admin/pesanan">← Kembali</button>
    <h2 class="section-title">🛡️ Detail Pesanan</h2>
    <div class="card mb-16">
      <div class="row-between">
        <strong style="color:var(--pink-600);font-size:1.1rem;">${order.id}</strong>
        <span class="status-pill ${statusClass(order.status)}">${order.status}</span>
      </div>
      <div class="summary-row"><span>Nomor Antrian</span><strong>#${order.antrian}</strong></div>
      <div class="summary-row"><span>Tanggal</span><span>${new Date(order.createdAt).toLocaleString('id-ID')}</span></div>
    </div>

    <div class="card mb-16">
      <h4 style="color:var(--pink-600);margin-bottom:10px;">👤 Pembeli</h4>
      <div class="summary-row"><span>Nama</span><span>${order.customer.name}</span></div>
      <div class="summary-row"><span>Email</span><span>${order.customer.email}</span></div>
      <div class="summary-row"><span>WhatsApp</span><span>${order.customer.wa}</span></div>
      ${order.note?`<div class="summary-row"><span>Catatan</span><span>${order.note}</span></div>`:''}
    </div>

    <div class="card mb-16">
      <h4 style="color:var(--pink-600);margin-bottom:10px;">🛍️ Produk</h4>
      ${order.items.map(i=>`<div class="summary-row"><span>${i.emoji} ${i.name} × ${i.qty} (${i.unit})</span><span>${rp(i.price*i.qty)}</span></div>`).join('')}
      <div class="summary-total"><span>Total</span><span>${rp(order.subtotal)}</span></div>
    </div>

    <div class="card mb-16">
      <h4 style="color:var(--pink-600);margin-bottom:10px;">💳 Pembayaran</h4>
      <div class="summary-row"><span>Metode</span><span>${order.payment}</span></div>
      <div class="summary-row"><span>Status Bayar</span><span>${order.paymentStatus}</span></div>
      <div class="form-group mt-12">
        <label>Ubah Status Bayar</label>
        <select class="form-select" id="aPayStat">
          ${['Menunggu Pembayaran','Menunggu Verifikasi','Pembayaran Diterima','Pembayaran Gagal'].map(s=>`<option ${order.paymentStatus===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="card mb-16">
      <h4 style="color:var(--pink-600);margin-bottom:10px;">⚙️ Kelola Pesanan</h4>
      <div class="form-group">
        <label>Ubah Status Pesanan</label>
        <select class="form-select" id="aStatus">
          ${statuses.map(s=>`<option ${order.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Nomor Antrian</label><input class="form-input" id="aAntrian" value="${order.antrian}"></div>
      <button class="btn btn-primary btn-block" id="saveOrder">💗 Simpan Perubahan</button>
    </div>

    ${order.file?`
      <div class="card mb-16">
        <h4 style="color:var(--pink-600);margin-bottom:10px;">📎 File Pelanggan</h4>
        <div class="summary-row"><span>${order.file.name}</span><span>${(order.file.size/1024).toFixed(1)} KB</span></div>
        <button class="btn btn-soft btn-sm btn-block mt-8" data-dl-file2="${order.id}">⬇️ Download File</button>
      </div>
    `:''}

    ${order.type==='jasa' && order.status!=='Selesai' ? `
      <div class="card mb-16" style="background:var(--cream);">
        <h4 style="color:var(--pink-600);margin-bottom:10px;">📤 Upload Hasil</h4>
        <input type="file" id="aHasil" class="form-input">
        <button class="btn btn-primary btn-block mt-10" id="aSend">Kirim Hasil & Selesaikan 💌</button>
      </div>
    `:''}

    ${order.statusHistory?`
      <div class="card mb-16">
        <h4 style="color:var(--pink-600);margin-bottom:10px;">📜 Riwayat Status</h4>
        ${order.statusHistory.map(h=>`<div class="summary-row"><span>${h.status}</span><span style="font-size:.78rem;color:var(--text-soft);">${new Date(h.time).toLocaleString('id-ID')}</span></div>`).join('')}
      </div>
    `:''}
  `;
  $$('[data-go]').forEach(el=>el.onclick = ()=>go(el.dataset.go));

  $('#saveOrder').onclick = ()=>{
    const newStatus = $('#aStatus').value;
    const newPay = $('#aPayStat').value;
    const newAnt = $('#aAntrian').value.trim();
    const orders = DB.get('orders');
    const idx = orders.findIndex(o=>o.id===id);
    if(orders[idx].status !== newStatus){
      orders[idx].statusHistory = orders[idx].statusHistory || [];
      orders[idx].statusHistory.push({status:newStatus, time:nowISO(), note:'Diubah admin'});
    }
    orders[idx].status = newStatus;
    orders[idx].paymentStatus = newPay;
    orders[idx].antrian = newAnt;
    DB.set('orders', orders);
    if(orders[idx].userId && orders[idx].userId!=='guest'){
      notify(orders[idx].userId, 'status', `Status pesanan ${id} diperbarui: ${newStatus}`);
    }
    toast('Perubahan disimpan 💗');
    pageAdminPesananDetail(id);
  };

  const dl = $('[data-dl-file2]');
  if(dl) dl.onclick = ()=>{
    const content = `File: ${order.file.name}\nOrder: ${order.id}\nCustomer: ${order.customer.name}`;
    const blob = new Blob([content],{type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = order.file.name; a.click();
    URL.revokeObjectURL(url);
    toast('File diunduh 💗');
  };

  const send = $('#aSend');
  if(send) send.onclick = ()=>{
    const input = $('#aHasil');
    if(!input.files.length) return toast('Pilih file hasil dulu ya','error');
    const f = input.files[0];
    const orders = DB.get('orders');
    const idx = orders.findIndex(o=>o.id===id);
    orders[idx].resultFile = { name:f.name, size:f.size };
    orders[idx].status = 'Selesai';
    orders[idx].statusHistory = orders[idx].statusHistory || [];
    orders[idx].statusHistory.push({status:'Selesai', time:nowISO(), note:'Hasil dikirim ke email'});
    DB.set('orders', orders);
    if(orders[idx].userId && orders[idx].userId!=='guest'){
      notify(orders[idx].userId, 'result', `Pesanan daftar pustaka ${id} sudah selesai 💗 Hasil telah dikirim ke email.`);
    }
    toast('Hasil terkirim 💌');
    pageAdminPesananDetail(id);
  };
}

/* ====================================================================
   OVERRIDE ROUTER for admin detail
   ==================================================================== */
const _origRoute = route;
route = function(){
  const parts = parseHash();
  const root = parts[0] || 'home';
  if(root === 'admin' && parts[1] === 'pesanan' && parts[2]){
    if(!isAdmin()){ go('#/'); return; }
    pageAdminPesananDetail(parts[2]);
    state.page = 'admin';
    window.scrollTo({top:0, behavior:'smooth'});
    updateNavActive();
    return;
  }
  _origRoute.call(this);
};
window.removeEventListener('hashchange', route);
window.addEventListener('hashchange', route);

/* ====================================================================
   GLOBAL DELEGATED ACTIONS
   ==================================================================== */
document.addEventListener('click', e=>{
  const t = e.target.closest('[data-action]');
  if(!t) return;
  e.preventDefault();
  const a = t.dataset.action;
  const s = getSettings();
  if(a === 'wa'){
    window.open(`https://wa.me/${s.waAdmin}?text=${encodeURIComponent(s.waMessage)}`, '_blank');
  } else if(a === 'ig'){
    window.open(s.instagram, '_blank');
  } else if(a === 'tt'){
    window.open(s.tiktok, '_blank');
  }
});
document.addEventListener('click', e=>{
  const t = e.target.closest('[data-social]');
  if(!t) return;
  const s = getSettings();
  const map = { wa:`https://wa.me/${s.waAdmin}?text=${encodeURIComponent(s.waMessage)}`, ig:s.instagram, tt:s.tiktok };
  window.open(map[t.dataset.social], '_blank');
});
// data-link navigation
document.addEventListener('click', e=>{
  const a = e.target.closest('[data-link]');
  if(a){ e.preventDefault(); go(a.getAttribute('href')); }
});

/* ====================================================================
   INIT
   ==================================================================== */
document.addEventListener('DOMContentLoaded', ()=>{
  updateBadges();
  route();
});