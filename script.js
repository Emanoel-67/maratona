const $ = id => document.getElementById(id);

/* ===== Estado ===== */
let S = { r: [], h: [0, 0, 0], min: 50, max: 100 };
try { const x = JSON.parse(localStorage.getItem("hw") || "null"); if (x && x.r) S = x; } catch (e) {}
const save = () => { try { localStorage.setItem("hw", JSON.stringify(S)); } catch (e) {} };
const faixa = a => a === "repouso" ? [S.min, S.max] : a === "caminhada" ? [90, 125] : [120, 185];
const cl = (v, a, b) => Math.max(a, Math.min(b, v));

/* ===== Explicação educativa ===== */
function dicas(r, st) {
  const l = [
    "Cafeína, energéticos e nicotina podem elevar os batimentos.",
    "Dormir pouco e estresse costumam aumentar a frequência cardíaca.",
    "Calor e pouca hidratação fazem o coração trabalhar mais."
  ];
  const t = r.a === "repouso"
    ? "Em repouso, é comum ver valores mais baixos, e o seu corpo muda isso ao longo do dia."
    : r.a === "caminhada"
    ? "Durante a caminhada, é esperado que os batimentos subam um pouco."
    : "Na corrida, o coração acelera para levar mais oxigênio aos músculos.";
  const e = t + (st === "alto"
    ? " Seu valor ficou acima da faixa definida: pode ter relação com esforço recente, ansiedade, calor ou cafeína."
    : st === "baixo"
    ? " Seu valor ficou abaixo da faixa definida: pessoas bem condicionadas costumam ter batimentos mais baixos em repouso."
    : " Seu valor está dentro da faixa que você definiu.");
  return e + "<ul>" + l.map(x => "<li>" + x + "</li>").join("") + "</ul>" +
    (st !== "ok" ? "<div style='margin-top:8px'>Se sentir tontura, dor no peito ou falta de ar, procure atendimento médico.</div>" : "");
}

/* ===== Tela ===== */
function render() {
  $("faixas").textContent = "repouso " + S.min + "–" + S.max + ", caminhada 90–125, corrida 120–185";
  const L = S.r[S.r.length - 1];
  if (L) {
    $("cur").textContent = L.v;
    $("act").textContent = L.a + " · " + new Date(L.t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    $("hs").style.animationDuration = (60 / cl(L.v, 40, 200)).toFixed(2) + "s";
    const [f0, f1] = faixa(L.a);
    const st = L.v > f1 ? "alto" : L.v < f0 ? "baixo" : "ok";
    $("alerta").innerHTML = st === "ok"
      ? '<div class="alert ok">Dentro da faixa definida para ' + L.a + " (" + f0 + "–" + f1 + " bpm).</div>"
      : '<div class="alert wa">Valor ' + (st === "alto" ? "acima" : "abaixo") + " da faixa definida para " + L.a + " (" + f0 + "–" + f1 + " bpm). Alerta educativo, não é diagnóstico.</div>";
    $("ia").innerHTML = dicas(L, st);
  }

  const d = S.r.slice(-20), W = 600, H = 180;
  if (d.length) {
    const lo = Math.min(...d.map(x => x.v), 50) - 5;
    const hi = Math.max(...d.map(x => x.v), 100) + 5;
    const X = i => (d.length > 1 ? 20 + (i * (W - 40)) / (d.length - 1) : W / 2);
    const Y = v => H - 15 - ((v - lo) / (hi - lo)) * (H - 30);
    const pts = d.map((x, i) => X(i) + "," + Y(x.v)).join(" ");
    $("ch").innerHTML =
      '<line x1="0" y1="' + Y(S.max) + '" x2="' + W + '" y2="' + Y(S.max) + '" stroke="var(--bd)" stroke-dasharray="4"/>' +
      '<polyline fill="none" stroke="var(--ac)" stroke-width="3" points="' + pts + '"/>' +
      d.map((x, i) => '<circle cx="' + X(i) + '" cy="' + Y(x.v) + '" r="4" fill="var(--ac)"><title>' + x.v + " bpm · " + x.a + "</title></circle>").join("");
  } else $("ch").innerHTML = "";

  const av = a => a.reduce((s, x) => s + x.v, 0) / a.length;
  if (S.r.length >= 4) {
    const n = Math.min(5, Math.floor(S.r.length / 2));
    const u = av(S.r.slice(-n)), p = av(S.r.slice(-2 * n, -n)), df = Math.round(u - p);
    $("evo").textContent = "Evolução: média recente " + Math.round(u) + " bpm (" + (df >= 0 ? "+" : "") + df + " em relação ao período anterior).";
  } else $("evo").textContent = "Registre ao menos 4 medições para ver a evolução.";

  const [a, s, w] = S.h;
  const p = Math.round(cl(a / 30, 0, 1) * 40 + cl(s / 8, 0, 1) * 30 + cl(w / 2, 0, 1) * 30);
  $("pts").textContent = p;
  $("pb").style.width = p + "%";
}

/* ===== Registro ===== */
function add(v, a) {
  v = Math.round(+v);
  if (!(v >= 30 && v <= 220)) { alert("Informe um valor entre 30 e 220 bpm."); return; }
  S.r.push({ v, a, t: Date.now() });
  S.r = S.r.slice(-200);
  save(); render();
}
$("add").onclick = () => { add($("bpm").value, $("atv").value); $("bpm").value = ""; };
$("sim").onclick = () => { const a = $("atv").value, [f0, f1] = faixa(a); add(f0 - 8 + Math.random() * (f1 - f0 + 16), a); };
["rmin", "rmax"].forEach(i => {
  $(i).onchange = () => { S.min = +$("rmin").value || 50; S.max = +$("rmax").value || 100; save(); render(); };
});
["h1", "h2", "h3"].forEach((id, i) => {
  $(id).value = S.h[i];
  $(id).oninput = () => { S.h[i] = +$(id).value || 0; save(); render(); };
});
$("rmin").value = S.min;
$("rmax").value = S.max;
render();

/* ===== Medição pela câmera (PPG) ===== */

// Calcula o bpm a partir do brilho vermelho (s) e dos tempos em ms (t)
function calcBpm(s, t) {
  if (s.length < 60) return null;
  // 1) reamostra em 30 Hz (a câmera entrega frames em tempos irregulares)
  const fs = 30, T = t[t.length - 1] - t[0], N = Math.floor((T / 1000) * fs);
  if (N < 150) return null;
  const u = []; let k = 0;
  for (let i = 0; i < N; i++) {
    const ti = t[0] + (i * 1000) / fs;
    while (k < t.length - 2 && t[k + 1] < ti) k++;
    const f = (ti - t[k]) / ((t[k + 1] - t[k]) || 1);
    u.push(s[k] + (s[k + 1] - s[k]) * cl(f, 0, 1));
  }
  // 2) remove variação lenta (~3 s) e suaviza ruído rápido
  const mm = (x, w) => x.map((_, i) => {
    let a = 0, c = 0;
    for (let j = Math.max(0, i - w); j <= Math.min(x.length - 1, i + w); j++) { a += x[j]; c++; }
    return a / c;
  });
  const tend = mm(u, 45);
  const g = mm(u.map((x, i) => x - tend[i]), 2);
  const sd = Math.sqrt(g.reduce((a, x) => a + x * x, 0) / g.length);
  if (sd < 0.05) return null; // quase sem pulso
  // 3) autocorrelação: o período do pulso é o atraso em que o sinal "se repete"
  const n = g.length, ac = [];
  for (let lag = 0; lag <= 46; lag++) {
    let a = 0;
    for (let i = 0; i + lag < n; i++) a += g[i] * g[i + lag];
    ac.push(a / (n - lag));
  }
  const nac = ac.map(x => x / ac[0]);
  const lmin = 10, lmax = 45; // 40 a 180 bpm
  let melhor = 0;
  for (let l = lmin; l <= lmax; l++) if (nac[l] > nac[l - 1] && nac[l] >= nac[l + 1] && nac[l] > melhor) melhor = nac[l];
  if (melhor < 0.35) return null; // sinal sem ritmo claro
  // pega o primeiro pico forte (evita confundir com o dobro do período)
  let lag = 0;
  for (let l = lmin; l <= lmax; l++) {
    if (nac[l] > nac[l - 1] && nac[l] >= nac[l + 1] && nac[l] >= 0.85 * melhor) { lag = l; break; }
  }
  if (!lag) return null;
  // refinamento sub-amostra (interpolação parabólica)
  const a = nac[lag - 1], b = nac[lag], c2 = nac[lag + 1];
  const den = a - 2 * b + c2;
  const frac = den ? (0.5 * (a - c2)) / den : 0;
  return Math.round((60 * fs) / (lag + frac));
}

// Onda do pulso ao vivo
function desenhaOnda(sig) {
  const cv = $("wave"), c = cv.getContext("2d"), W = cv.width, H = cv.height;
  c.clearRect(0, 0, W, H);
  const d = sig.slice(-120);
  if (d.length < 2) return;
  const mn = Math.min(...d), mx = Math.max(...d), r = mx - mn || 1;
  c.beginPath(); c.strokeStyle = "#e63950"; c.lineWidth = 2;
  d.forEach((v, i) => {
    const x = (i * W) / (d.length - 1), y = H - 6 - ((v - mn) / r) * (H - 12);
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  });
  c.stroke();
}

let medindo = false, cancelar = false;

async function medir() {
  // segundo toque durante a medição = cancelar
  if (medindo) { cancelar = true; return; }
  const box = $("camBox"), msg = $("camMsg"), btn = $("cam");
  box.hidden = false;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    msg.textContent = "Câmera indisponível. Abra o app por um link HTTPS (ou localhost).";
    return;
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 160 }, height: { ideal: 120 } },
      audio: false
    });
  } catch (e) {
    msg.textContent = "Não consegui acessar a câmera. Permita o acesso e use um link HTTPS.";
    return;
  }

  medindo = true; cancelar = false;
  btn.textContent = "⏹ Cancelar medição";

  const v = $("vid");
  v.srcObject = stream;
  try { await v.play(); } catch (e) {}

  // liga o flash automaticamente (Chrome no Android)
  let flash = false;
  try {
    await stream.getVideoTracks()[0].applyConstraints({ advanced: [{ torch: true }] });
    flash = true;
  } catch (e) {}

  const c = $("cv").getContext("2d", { willReadFrequently: true });
  const sig = [], tm = [], dur = 20000, limite = 60000;
  const ini = performance.now();
  let t0 = ini;

  await new Promise(res => {
    (function loop() {
      const agora = performance.now();
      if (cancelar || agora - ini > limite) return res();
      const t = agora - t0;
      c.drawImage(v, 0, 0, 40, 40);
      const d = c.getImageData(0, 0, 40, 40).data;
      let r = 0, gr = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; gr += d[i + 1]; }
      const n = d.length / 4; r /= n; gr /= n;

      // dedo cobrindo a câmera: bastante vermelho e pouco verde
      if (r < 80 || gr > r * 0.6) {
        sig.length = 0; tm.length = 0; t0 = agora;
        msg.textContent = flash
          ? "Cubra a câmera e o flash com a ponta do dedo, sem apertar."
          : "Flash indisponível. Cubra a câmera com o dedo em um local bem iluminado.";
      } else {
        sig.push(r); tm.push(t);
        msg.textContent = "Medindo... " + Math.max(0, Math.ceil((dur - t) / 1000)) + "s. Fique parado.";
      }
      desenhaOnda(sig);
      t < dur ? requestAnimationFrame(loop) : res();
    })();
  });

  stream.getTracks().forEach(tr => tr.stop());
  medindo = false;
  btn.textContent = "📷 Medir pela câmera";
  $("wave").getContext("2d").clearRect(0, 0, 300, 60);

  if (cancelar) { msg.textContent = "Medição cancelada."; return; }
  const bpm = calcBpm(sig, tm);
  if (bpm && bpm >= 40 && bpm <= 200) {
    msg.textContent = "Resultado: " + bpm + " bpm";
    add(bpm, $("atv").value);
  } else {
    msg.textContent = "Leitura ruim. Tente de novo com o dedo parado e bem posicionado.";
  }
}
$("cam").onclick = medir;
