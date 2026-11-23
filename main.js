// Kambu landing page — demo data and interactions. All data is fictional.
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
// Angolan style: dot as thousands separator (1.050 Kz).
const num = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const kz = (n) => num(n) + " Kz";
const HOUR = 3600e3, DAY = 24 * HOUR;
const now = Date.now();

// Example reference rate (not live).
const REFERENCE = { USD: 925, EUR: 1000 };

const CARTS = [
  { id: "shein-dez", store: "shein", storeName: "Shein", letter: "S", title: "Carrinho Shein · Dezembro", seller: "Loja da Nayara", rating: "4,9", rates: { USD: 1050, EUR: 1140 }, feeKg: 9500, closesAt: now + 2 * DAY + 14 * HOUR + 36 * 60e3, eta: "~3 sem.", status: "open" },
  { id: "zara-natal", store: "zara", storeName: "Zara", letter: "Z", title: "Zara · Especial Natal", seller: "Kianda Imports", rating: "4,8", rates: { USD: 1080, EUR: 1170 }, feeKg: 11000, closesAt: now + 9 * HOUR + 12 * 60e3, eta: "~2 sem.", status: "closing" },
  { id: "ali-tech", store: "aliexpress", storeName: "AliExpress", letter: "A", title: "AliExpress · Acessórios e tech", seller: "Mwangolé Store", rating: "4,7", rates: { USD: 1030, EUR: 1120 }, feeKg: 8000, closesAt: now + 5 * DAY + 3 * HOUR, eta: "~5 sem.", status: "open" },
  { id: "amazon-livros", store: "amazon", storeName: "Amazon", letter: "a", title: "Amazon · Livros e beleza", seller: "Benguela Box", rating: "4,9", rates: { USD: 1065, EUR: 1155 }, feeKg: 10500, closesAt: now + 3 * DAY + 20 * HOUR, eta: "~4 sem.", status: "open" },
  { id: "shein-kids", store: "shein", storeName: "Shein", letter: "S", title: "Shein Kids · Regresso às aulas", seller: "Mamã Compras", rating: "5,0", rates: { USD: 1045, EUR: 1135 }, feeKg: 9000, closesAt: now - 2 * DAY, eta: "~3 sem.", status: "closed" },
];

const STATUS_LABEL = { open: "Aberto", closing: "Fecha hoje", closed: "Fechado" };

function timeLeft(ms) {
  if (ms <= 0) return "Fechou";
  const d = Math.floor(ms / DAY), h = Math.floor((ms % DAY) / HOUR), m = Math.floor((ms % HOUR) / 60e3);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${String(m).padStart(2, "0")}m`;
}

// ---- Open carts list ----
const cartsEl = $("[data-carts]");
function renderCarts(filter = "all") {
  const items = CARTS.filter((c) => filter === "all" || c.store === filter);
  cartsEl.replaceChildren(...items.map((c) => {
    const li = document.createElement("li");
    li.className = "cart-row";
    li.innerHTML = `
      <div class="cart-row__head">
        <span class="store-logo store-logo--${c.store}">${c.letter}</span>
        <div><strong>${c.title}</strong><span class="muted">${c.seller} · ★ ${c.rating}</span></div>
        <span class="status status--${c.status}">${STATUS_LABEL[c.status]}</span>
      </div>
      <div class="cart-row__facts">
        <div><small>1 USD</small><b>${num(c.rates.USD)} Kz</b></div>
        <div><small>Fecha em</small><b data-left="${c.closesAt}">${timeLeft(c.closesAt - Date.now())}</b></div>
        <div><small>Chega</small><b>${c.eta}</b></div>
      </div>`;
    return li;
  }));
}
$$(".chip-btn").forEach((b) => b.addEventListener("click", () => {
  $$(".chip-btn").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
  renderCarts(b.dataset.filter);
}));
renderCarts();

// ---- Hero countdown + list countdowns ----
const heroClose = CARTS[0].closesAt;
function tick() {
  const ms = Math.max(0, heroClose - Date.now());
  const parts = { d: Math.floor(ms / DAY), h: Math.floor((ms % DAY) / HOUR), m: Math.floor((ms % HOUR) / 60e3), s: Math.floor((ms % 60e3) / 1e3) };
  for (const k in parts) $(`[data-cd="${k}"]`).textContent = String(parts[k]).padStart(2, "0");
  $$("[data-left]").forEach((el) => { el.textContent = timeLeft(Number(el.dataset.left) - Date.now()); });
}
tick();
setInterval(tick, 1000);

// ---- Calculator ----
const calc = {
  price: $("#calc-price"), currency: $("#calc-currency"), cart: $("#calc-cart"), weight: $("#calc-weight"),
};
const openCarts = CARTS.filter((c) => c.status !== "closed");
calc.cart.replaceChildren(...openCarts.map((c) => new Option(`${c.title} — ${c.seller}`, c.id)));
function updateCalc() {
  const c = CARTS.find((x) => x.id === calc.cart.value);
  const cur = calc.currency.value;
  const price = Math.max(0, parseFloat(calc.price.value) || 0);
  const weight = Math.max(0, parseFloat(calc.weight.value) || 0);
  const rate = c.rates[cur];
  const item = price * rate, ship = weight * c.feeKg;
  $("[data-fee-label]").textContent = `(envio ${num(c.feeKg)} Kz/kg)`;
  $('[data-out="item"]').textContent = kz(item);
  $('[data-out="ship"]').textContent = kz(ship);
  $('[data-out="total"]').textContent = kz(item + ship);
  const diff = ((rate / REFERENCE[cur]) - 1) * 100;
  $('[data-out="compare"]').innerHTML =
    `Câmbio deste carrinho: <b>1 ${cur} = ${num(rate)} Kz</b>. Referência de exemplo: ${num(REFERENCE[cur])} Kz (${diff >= 0 ? "+" : ""}${diff.toFixed(1).replace(".", ",")}%).`;
}
Object.values(calc).forEach((el) => el.addEventListener("input", updateCalc));
updateCalc();

// ---- Tracking timeline ----
const STEPS = [
  { key: "aberto", title: "Aberto", text: "O carrinho aceita peças. Adicionas os teus links e vês o total em kwanzas.", when: "1 dez" },
  { key: "fechado", title: "Fechado", text: "O prazo terminou e o câmbio ficou fixo. Já não entram peças novas; confirmas o pagamento.", when: "4 dez" },
  { key: "encomendado", title: "Encomendado", text: "O revendedor fez a encomenda na loja. Peças esgotadas são assinaladas e reembolsadas.", when: "5 dez" },
  { key: "transito", title: "Em trânsito", text: "A encomenda saiu do armazém da loja e está a caminho de Angola.", when: "9 dez" },
  { key: "luanda", title: "Em Luanda", text: "Chegou a Luanda e está a passar pela alfândega. Normalmente demora alguns dias.", when: "previsto 20 dez" },
  { key: "pronto", title: "Pronto para levantar", text: "O revendedor separou as peças. Recebes o ponto e o horário de levantamento.", when: "previsto 22 dez" },
  { key: "entregue", title: "Entregue", text: "Levantaste as tuas compras. Agora podes avaliar o revendedor.", when: "—" },
];
const CURRENT = 3; // "Em trânsito"
const tl = $("[data-timeline]");
function selectStep(i) {
  const s = STEPS[i];
  const st = $("[data-track-status]");
  st.className = "status " + (i < CURRENT ? "status--closed" : i === CURRENT ? "status--closing" : "status--open");
  st.textContent = i < CURRENT ? "Concluído" : i === CURRENT ? "Estado atual" : "Próximo";
  $("[data-track-title]").textContent = s.title;
  $("[data-track-text]").textContent = s.text;
  $("[data-track-when]").textContent = `Carrinho Shein · Dezembro — ${s.when}`;
  $$("button", tl).forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
}
tl.replaceChildren(...STEPS.map((s, i) => {
  const li = document.createElement("li");
  li.className = i < CURRENT ? "is-done" : i === CURRENT ? "is-current" : "";
  li.innerHTML = `<button type="button" aria-pressed="false">
    <span class="dot">${i < CURRENT ? '<svg class="icon icon--xs"><use href="#i-check"/></svg>' : ""}</span>
    <span>${s.title}</span><span class="when">${s.when}</span></button>`;
  $("button", li).addEventListener("click", () => selectStep(i));
  return li;
}));
selectStep(CURRENT);

// ---- Footer year ----
$("[data-year]").textContent = new Date().getFullYear();

// ---- Theme toggle: light <-> dark, remembered per visitor ----
const root = document.documentElement;
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : darkQuery.matches);
const themeBtn = $(".theme-toggle");
const syncThemeLabel = () =>
  themeBtn.setAttribute("aria-label", isDark() ? "Mudar para tema claro" : "Mudar para tema escuro");
themeBtn.addEventListener("click", () => {
  const next = isDark() ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("kambu-theme", next); } catch (e) {}
  syncThemeLabel();
});
darkQuery.addEventListener("change", syncThemeLabel);
syncThemeLabel();
