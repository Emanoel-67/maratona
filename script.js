"use strict";



const SP = [

  { id: "planta", n: "Plantas", e: "🌿", g: 0, prey: [], c: "#4caf50" },

  { id: "inseto", n: "Insetos polinizadores", e: "🐝", g: 1, prey: ["planta"], c: "#f5b301" },

  { id: "coelho", n: "Coelhos", e: "🐇", g: 1, prey: ["planta"], c: "#a1887f" },

  { id: "sapo", n: "Sapos", e: "🐸", g: 2, prey: ["inseto"], c: "#26a69a" },

  { id: "onca", n: "Onças", e: "🐆", g: 2, prey: ["coelho"], c: "#ef6c00" },

  { id: "cobra", n: "Cobras", e: "🐍", g: 3, prey: ["sapo"], c: "#7e57c2" },

  { id: "gaviao", n: "Gaviões", e: "🦅", g: 3, prey: ["cobra", "inseto"], c: "#42a5f5" },



  // Novos consumidores

  { id: "formiga", n: "Formigas", e: "🐜", g: 1, prey: ["planta"], c: "#d6a15d" },

  { id: "gafanhoto", n: "Gafanhotos", e: "🦗", g: 1, prey: ["planta"], c: "#9ccc65" },

  { id: "rato", n: "Ratos-do-campo", e: "🐁", g: 1, prey: ["planta"], c: "#bcaaa4" },

  { id: "lagarta", n: "Lagartas", e: "🐛", g: 1, prey: ["planta"], c: "#8bc34a" },



  // Novos predadores

  { id: "tamandua", n: "Tamanduás", e: "🦣", g: 2, prey: ["formiga"], c: "#d4a373" },

  { id: "lagarto", n: "Lagartos", e: "🦎", g: 2, prey: ["gafanhoto", "lagarta"], c: "#66bb6a" },

  { id: "raposa", n: "Raposas", e: "🦊", g: 3, prey: ["rato", "coelho"], c: "#ff8a65" },

  { id: "coruja", n: "Corujas", e: "🦉", g: 3, prey: ["rato", "inseto", "lagarto"], c: "#90a4ae" },

  { id: "lobo", n: "Lobos", e: "🐺", g: 3, prey: ["coelho", "rato", "lagarto"], c: "#78909c" }

];



const GROUPS = [

  "Produtores",

  "Consumidores primários",

  "Consumidores secundários e predadores",

  "Predadores de topo"

];



const byId = Object.fromEntries(SP.map(s => [s.id, s]));



SP.forEach(s => {

  s.preds = SP.filter(p => p.prey.includes(s.id)).map(p => p.id);

});



let X;

let dead;

let hist;

let paused = false;

let tick = 0;

let timer = null;

let stress = 0;

let pressure = {};




let selectedBiome = "base";

let selectedState = null;

let incidentCount = 0;



const INITIAL_BIOMASS = SP.length * 0.6;



const $ = id => document.getElementById(id);

const refs = {};



/* =========================================

   PAINÉIS DE APOIO, CONTATOS E ESTILOS DO MAPA

\========================================= */



function installSupportPanels() {



  const style = document.createElement("style");



  style.textContent = `

    .support-grid {

      display: grid;

      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));

      gap: 12px;

      margin: 16px 0;

    }



    .support-card {

      background: var(--card);

      border: 1px solid var(--bd);

      border-radius: 12px;

      padding: 14px;

      min-width: 0;

    }



    .support-card h2 {

      margin: 0 0 8px;

    }



    .support-card p {

      margin: 6px 0;

      color: var(--mut);

      font-size: .9rem;

    }



    .support-card a {

      color: #69b9ff;

      overflow-wrap: anywhere;

    }



    .contact-number {

      font-weight: 800;

      color: var(--tx) !important;

      font-size: 1.05rem !important;

    }



    .incident-card {

      border-color: #a92c38;

    }



    .incident-card h2 {

      color: #ff4b58;

    }



    #mapIncidents {

      list-style: none;

      padding: 0;

      margin: 8px 0 0;

      max-height: 230px;

      overflow: auto;

    }



    .map-incident {

      padding: 8px 10px;

      margin: 6px 0;

      border-left: 4px solid #ff3347;

      background: rgba(255, 51, 71, .1);

      border-radius: 6px;

      color: #ff6975;

      overflow-wrap: anywhere;

    }



    .map-incident span {

      display: block;

      color: var(--mut);

      font-size: .82rem;

      margin-top: 3px;

    }



    #log li.event-log {

      color: #ff4b58;

      font-weight: 650;

      border-left: 3px solid #ff3347;

      padding-left: 8px;

      background: rgba(255, 51, 71, .07);

    }



    .reg.event-red path {

      fill: #ff2438 !important;

      stroke: #ff7b86 !important;

      stroke-width: 3 !important;

      filter: drop-shadow(0 0 5px rgba(255, 36, 56, .9)) !important;

      animation: mapPulse 1.4s ease-in-out infinite alternate;

    }



    .reg.event-red text {

      fill: #fff;

      stroke: #9b0010;

      stroke-width: 3px;

    }



    @keyframes mapPulse {

      from {

        filter: drop-shadow(0 0 2px rgba(255, 36, 56, .55));

      }

      to {

        filter: drop-shadow(0 0 8px rgba(255, 36, 56, 1));

      }

    }



    @media (prefers-reduced-motion: reduce) {

      .reg.event-red path {

        animation: none;

      }

    }

  `;



  document.head.appendChild(style);



  const map = document.querySelector(".map");



  if (!map || $("mapIncidents")) return;



  const support = document.createElement("div");

  support.className = "support-grid";



  support.innerHTML = `

    <section class="support-card incident-card"

             aria-label="Ocorrências no mapa">



      <h2>🚨 Ocorrências no mapa</h2>



      <p>

        Os desastres serão destacados em vermelho

        no estado ou bioma selecionado.

      </p>



      <ul id="mapIncidents">

        <li class="map-incident">

          <b>Nenhuma ocorrência registrada</b>

          <span>

            Escolha um estado ou bioma e provoque um evento.

          </span>

        </li>

      </ul>

    </section>



    <section class="support-card"

             aria-label="Contatos ambientais e rurais">



      <h2>📞 Contatos úteis</h2>



      <p><b>IBAMA — Linha Verde</b></p>



      <p class="contact-number">

        <a href="tel:08000618080">0800 061 8080</a>

      </p>



      <p>

        Canal para denúncias e solicitações ambientais.

        Atendimento telefônico de segunda a sexta,

        das 7h às 19h.

      </p>



      <p>

        <a

          href="https\://www.gov.br/ibama/pt-br/canais_atendimento/fale-conosco"

          target="_blank"

          rel="noopener noreferrer"

        >

          Site oficial e atendimento do IBAMA

        </a>

      </p>



      <hr style="border:0;border-top:1px solid var(--bd);margin:12px 0">



      <p><b>Produtores rurais — Sistema CNA/Senar</b></p>



      <p class="contact-number">

        <a href="tel:+556121091400">

          (61) 2109-1400 — CNA

        </a>

      </p>



      <p class="contact-number">

        <a href="tel:+556121091300">

          (61) 2109-1300 — Senar

        </a>

      </p>



      <p>

        <a

          href="https\://cnabrasil.org.br/fale-conosco/sistema-cna"

          target="_blank"

          rel="noopener noreferrer"

        >

          Contato oficial para orientação rural

        </a>

      </p>



      <p>

        Para atendimento local, procure também o sindicato

        rural ou a secretaria de agricultura do estado.

        Estes são canais institucionais, não contatos

        pessoais de agricultores.

      </p>

    </section>

  `;



  map.insertAdjacentElement("afterend", support);

}



/* =========================================

   INICIALIZAÇÃO

\========================================= */



function init() {

  X = {};

  dead = {};

  hist = {};



  SP.forEach(s => {

    X[s.id] = 0.6;

    dead[s.id] = false;

    hist[s.id] = [];

  });



  $("log").innerHTML = "";



  tick = 0;

  stress = 0;



  pressure = Object.fromEntries(

    SP.map(s => [s.id, 0])

  );



  log("Ecossistema em equilíbrio. Faça sua intervenção!");



  frame();

}



/* =========================================

   DIÁRIO E REGISTRO DOS ACONTECIMENTOS

\========================================= */



function log(message, isEvent = false) {

  const li = document.createElement("li");



  li.textContent = message;



  if (isEvent) {

    li.classList.add("event-log");

  }



  $("log").prepend(li);

}



function chosenLocationLabel() {

  if (selectedState) {

    return `${selectedState.name} (${selectedState.uf})`;

  }



  if (selectedBiome !== "base" && REGIONS[selectedBiome]) {

    return REGIONS[selectedBiome].n;

  }



  return "Brasil / ecossistema padrão";

}



function markMapEvent(message) {

  incidentCount++;



  const where = chosenLocationLabel();

  const regions = [...document.querySelectorAll(".reg")];



  regions.forEach(region => {

    const shouldMark = selectedState

      ? region.dataset.uf === selectedState.uf

      : selectedBiome !== "base" &&

        region.dataset.r === selectedBiome;



    if (!shouldMark) return;



    region.classList.add("event-red");

    region.setAttribute("data-last-event", message);



    const title = region.querySelector("title");



    if (title) {

      title.textContent =

        `${STATES[region.dataset.uf] || region.dataset.uf} — ${message}`;

    }

  });



  const panel = $("mapIncidents");



  if (panel) {

    if (incidentCount === 1) {

      panel.innerHTML = "";

    }



    const item = document.createElement("li");

    item.className = "map-incident";



    const bold = document.createElement("b");

    bold.textContent = `⚠ ${message}`;



    const location = document.createElement("span");

    location.textContent = `Local: ${where}`;



    item.appendChild(bold);

    item.appendChild(location);



    panel.prepend(item);



    while (panel.children.length > 8) {

      panel.lastElementChild.remove();

    }

  }

}



/* =========================================

   EXTINÇÃO DE ESPÉCIES

\========================================= */



function kill(id, manual) {

  if (dead[id]) return;



  dead[id] = true;

  X[id] = 0;



  const s = byId[id];



  log(

    manual

      ? `${s.e} ${s.n} foram removidos do ecossistema.`

      : `💀 ${s.e} ${s.n} entraram em colapso (extintos).`

  );

}



/* =========================================

   SIMULAÇÃO DA CADEIA ALIMENTAR

\========================================= */



function step() {

const dt = 0.05;
const r = 1.0;
const m = 0.005;
const c = 0.02;

  const nx = {};



  SP.forEach(s => {

    if (dead[s.id]) {

      nx[s.id] = 0;

      return;

    }



    const x = X[s.id];



    let sup = 1;



    if (s.prey.length) {

      sup = Math.min(

        1,

        1.3 *

        s.prey.reduce(

          (sum, p) => sum + X[p],

          0

        ) /

        s.prey.length

      );

    }



    const pred = s.preds.reduce(

      (sum, p) => sum + X[p],

      0

    );



    const mort = s.prey.length ? m : 0;



    // Os desastres continuam afetando as populações

    // e podem causar efeitos em cascata na cadeia alimentar.

    const localPressure = pressure[s.id] || 0;



    const environmentalLoss =

      x * (stress * 0.08 + localPressure * 0.22);



    const v = x + dt * (

      r * x * (sup - x) -

      mort * x -

      c * x * pred -

      environmentalLoss

    );



    nx[s.id] = Math.max(0, Math.min(1, v));

  });



  SP.forEach(s => {

    X[s.id] = nx[s.id];



    if (!dead[s.id] && X[s.id] < 0.005) {

      kill(s.id, false);

    }

  });



  tick++;

}



/* =========================================

   MONTAGEM DA CADEIA ALIMENTAR NA TELA

\========================================= */



function build() {

  const web = $("web");



  web.innerHTML = "";



  SP.forEach(s => {

    delete refs[s.id];

  });



  GROUPS.forEach((group, i) => {

    const label = document.createElement("div");



    label.className = "lbl";

    label.textContent = group;



    web.appendChild(label);



    const row = document.createElement("div");

    row.className = "lvl";



    SP.filter(s => s.g === i).forEach(s => {

      const card = document.createElement("div");



      card.className = "sp";



      const eats = s.prey.length

        ? "Come: " + s.prey.map(

            p => byId[p].n.split(" ")[0]

          ).join(", ")

        : "Produz energia (sol)";



      card.innerHTML = `

        <div class="top">

          <b>${s.e} ${s.n}</b>

          <button type="button" class="danger">Remover</button>

        </div>



        <div class="eats">${eats}</div>



        <div class="meter">

          <i style="background:${s.c}"></i>

        </div>

      `;



      card.querySelector("button").addEventListener(

        "click",

        () => kill(s.id, true)

      );



      refs[s.id] = {

        card,

        bar: card.querySelector(".meter i")

      };



      row.appendChild(card);

    });



    web.appendChild(row);

  });



  $("legend").innerHTML = SP.map(s =>

    `<span style="--c:${s.c}">${s.n}</span>`

  ).join("");

}



/* =========================================

   GRÁFICO DE POPULAÇÕES

\========================================= */



function draw() {

  const canvas = $("chart");

  const dpr = window.devicePixelRatio || 1;

  const w = canvas.clientWidth;

  const h = canvas.clientHeight;



  if (!w || !h) return;



  if (

    canvas.width !== Math.round(w * dpr) ||

    canvas.height !== Math.round(h * dpr)

  ) {

    canvas.width = Math.round(w * dpr);

    canvas.height = Math.round(h * dpr);

  }



  const ctx = canvas.getContext("2d");



  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, w, h);



  const styles = getComputedStyle(

    document.documentElement

  );



  ctx.strokeStyle =

    styles.getPropertyValue("--bd").trim();



  ctx.lineWidth = 1;



  for (let i = 0; i <= 4; i++) {

    const y = 4 + (h - 8) * i / 4;



    ctx.beginPath();

    ctx.moveTo(0, y);

    ctx.lineTo(w, y);

    ctx.stroke();

  }



  SP.forEach(s => {

    const values = hist[s.id];



    if (values.length < 2) return;



    ctx.strokeStyle = s.c;

    ctx.lineWidth = 2;

    ctx.beginPath();



    values.forEach((value, i) => {

      const x = i / 299 * w;

      const y = h - 4 - value * (h - 8);



      if (i === 0) {

        ctx.moveTo(x, y);

      } else {

        ctx.lineTo(x, y);

      }

    });



    ctx.stroke();

  });

}



/* =========================================

   ATUALIZAÇÃO DA SIMULAÇÃO E ESTATÍSTICAS

\========================================= */



function frame() {

  if (!paused) {

    for (let i = 0; i < 2; i++) {

      step();

    }



    SP.forEach(s => {

      const values = hist[s.id];



      values.push(X[s.id]);



      if (values.length > 300) {

        values.shift();

      }

    });

  }



  let alive = 0;



  SP.forEach(s => {

    const ref = refs[s.id];



    if (!ref) return;



    ref.bar.style.width = (X[s.id] * 100) + "%";



    ref.card.classList.toggle(

      "dead",

      dead[s.id]

    );



    if (!dead[s.id]) {

      alive++;

    }

  });



  const stat = $("stat");



  stat.textContent =

    `Espécies vivas: ${alive}/${SP.length}`;



  const currentBiomass = SP.reduce(

    (sum, species) => sum + (X[species.id] || 0),

    0

  );



  const alivePct = Math.max(

    0,

    Math.min(100, currentBiomass / INITIAL_BIOMASS * 100)

  );



  const deadPct = 100 - alivePct;



  if ($("alivePercent")) {

    $("alivePercent").textContent =

      `${alivePct.toFixed(1).replace(".", ",")}%`;

  }



  if ($("deadPercent")) {

    $("deadPercent").textContent =

      `${deadPct.toFixed(1).replace(".", ",")}%`;

  }



  if ($("aliveMeter")) {

    $("aliveMeter").style.width = `${alivePct}%`;

  }



  if ($("deadMeter")) {

    $("deadMeter").style.width = `${deadPct}%`;

  }



  if ($("aliveCount")) {

    $("aliveCount").textContent =

      `Biomassa restante estimada: ${alivePct.toFixed(1).replace(".", ",")}%`;

  }



  if ($("extinctCount")) {

    $("extinctCount").textContent =

      `${SP.filter(species => dead[species.id]).length} / ${SP.length}`;

  }



  if ($("pressureLevel")) {

    const pressureScore =

      stress +

      Object.values(pressure).reduce(

        (sum, value) => sum + value,

        0

      ) / SP.length;



    $("pressureLevel").textContent =

      pressureScore < 0.5

        ? "Baixa"

        : pressureScore < 1.5

          ? "Moderada"

          : pressureScore < 3

            ? "Alta"

            : "Crítica";



    $("pressureLevel").style.color =

      pressureScore < 0.5

        ? "#5fe0a0"

        : pressureScore < 1.5

          ? "#f6d36b"

          : "#ff7a83";



    $("pressureDetail").textContent =

      `${pressureScore.toFixed(1).replace(".", ",")} pontos de pressão acumulada`;

  }



  stat.style.color =

    alive === SP.length

      ? "var(--ok)"

      : alive <= 3

        ? "var(--bad)"

        : "inherit";



  draw();

}



/* =========================================

   DESASTRES AMBIENTAIS

\========================================= */



$("drought").addEventListener("click", () => {

  if (!dead.planta) {

    X.planta *= 0.25;



    pressure.planta = Math.min(

      3,

      (pressure.planta || 0) + 1.2

    );



    pressure.inseto = Math.min(

      3,

      (pressure.inseto || 0) + 0.35

    );



    const message =

      "☀️ Seca severa: as plantas perderam 75% da população.";



    markMapEvent(message);

    log(`${message} Local: ${chosenLocationLabel()}.`, true);



    frame();

  }

});



$("poison").addEventListener("click", () => {

  if (!dead.inseto) {

    X.inseto *= 0.1;



    pressure.inseto = Math.min(

      3,

      (pressure.inseto || 0) + 1.3

    );



    pressure.sapo = Math.min(

      3,

      (pressure.sapo || 0) + 0.45

    );



    const message =

      "🧪 Agrotóxico: 90% dos insetos morreram.";



    markMapEvent(message);

    log(`${message} Local: ${chosenLocationLabel()}.`, true);



    frame();

  }

});



function impact(name, factor, message, targets = SP.map(s => s.id)) {

  stress = Math.min(

    3.5,

    stress + factor * 0.55

  );



  targets.forEach(id => {

    if (dead[id]) return;



    pressure[id] = Math.min(

      3,

      (pressure[id] || 0) + factor * 1.35

    );



    X[id] *= Math.max(

      0.08,

      1 - factor * 1.25

    );



    if (X[id] < 0.03) {

      kill(id, false);

    }

  });



  markMapEvent(message);



  log(

    `${message} Local: ${chosenLocationLabel()}. ` +

    `Impacto aplicado a ${targets.length} grupo(s); ` +

    "os efeitos continuam ao longo da simulação.",

    true

  );



  frame();

}



$("deforestation").addEventListener("click", () =>

  impact(

    "desmatamento",

    0.42,

    "🪓 Desmatamento: perda de árvores, abrigo e alimento; a erosão aumenta.",

    ["planta", "inseto", "coelho", "sapo"]

  )

);



$("airPollution").addEventListener("click", () =>

  impact(

    "poluição do ar",

    0.22,

    "🏭 Poluição do ar: fumaça e gases afetam a saúde dos seres vivos e a vegetação."

  )

);



$("waterPollution").addEventListener("click", () =>

  impact(

    "poluição da água",

    0.35,

    "🛢️ Poluição da água: esgoto, óleo e químicos contaminam rios e prejudicam a vida aquática.",

    ["planta", "inseto", "sapo", "cobra"]

  )

);



$("plasticPollution").addEventListener("click", () =>

  impact(

    "plástico e lixo",

    0.25,

    "🧴 Plásticos e resíduos: animais podem ingerir lixo ou ficar presos nele."

  )

);



$("soilPollution").addEventListener("click", () =>

  impact(

    "contaminação do solo",

    0.3,

    "☣️ Contaminação do solo: resíduos tóxicos reduzem a fertilidade e contaminam a cadeia alimentar.",

    ["planta", "inseto", "coelho"]

  )

);



$("fire").addEventListener("click", () =>

  impact(

    "queimada",

    0.48,

    "🔥 Queimada: destrói vegetação, ninhos e abrigos; a fumaça também polui o ar.",

    ["planta", "inseto", "coelho", "sapo"]

  )

);



$("climate").addEventListener("click", () =>

  impact(

    "aquecimento global",

    0.28,

    "🌡️ Aquecimento global: ondas de calor e mudanças nas chuvas desequilibram o ecossistema."

  )

);



$("overfishing").addEventListener("click", () =>

  impact(

    "caça e pesca excessivas",

    0.3,

    "🎣 Caça e pesca excessivas: a retirada de animais rompe relações alimentares.",

    ["coelho", "sapo", "cobra", "gaviao", "onca"]

  )

);



$("mining").addEventListener("click", () =>

  impact(

    "mineração",

    0.34,

    "⛏️ Mineração: desmatamento, sedimentos e metais contaminantes degradam habitats.",

    ["planta", "inseto", "sapo", "coelho"]

  )

);



$("invasive").addEventListener("click", () =>

  impact(

    "espécies invasoras",

    0.24,

    "🦎 Espécies invasoras: competem com espécies nativas e podem transmitir doenças."

  )

);



$("habitat").addEventListener("click", () =>

  impact(

    "fragmentação do habitat",

    0.27,

    "🏗️ Fragmentação do habitat: estradas e construções isolam populações e dificultam a reprodução.",

    ["onca", "gaviao", "cobra", "coelho"]

  )

);



/* =========================================

   AÇÕES DE RECUPERAÇÃO DA SIMULAÇÃO

   Mantidas internamente para evitar erros

   nos elementos existentes do HTML.

\========================================= */



/* =========================================

   PAUSAR E REINICIAR

\========================================= */



$("pause").addEventListener("click", event => {

  paused = !paused;



  event.currentTarget.textContent = paused

    ? "▶ Continuar"

    : "⏸ Pausar";

});



$("reset").addEventListener("click", () => {

  paused = false;
  $("pause").textContent = "⏸ Pausar";
  incidentCount = 0;



  document.querySelectorAll(".reg.event-red").forEach(region => {

    region.classList.remove("event-red");

    region.removeAttribute("data-last-event");



    const title = region.querySelector("title");



    if (title) {

      title.textContent =

        STATES[region.dataset.uf] || region.dataset.uf;

    }

  });



  const incidentPanel = $("mapIncidents");



  if (incidentPanel) {

    incidentPanel.innerHTML = `

      <li class="map-incident">

        <b>Nenhuma ocorrência registrada</b>

        <span>

          Escolha um estado ou bioma e provoque um evento.

        </span>

      </li>

    `;

  }



  init();

});



/* =========================================

   BIOMAS DO BRASIL

\========================================= */



const BASE = SP.map(s => [s.e, s.n]);



const REGIONS = {

  am: {

    n: "Amazônia",

    b: "floresta tropical",

    sp: [

      ["🌳", "Árvores"],

      ["🦋", "Borboletas"],

      ["🦥", "Preguiças"],

      ["🐸", "Sapos-flecha"],

      ["🐆", "Onças"],

      ["🐍", "Sucuris"],

      ["🦅", "Harpias"]

    ]

  },



  ce: {

    n: "Cerrado",

    b: "savana brasileira",

    sp: [

      ["🌾", "Gramíneas"],

      ["🐜", "Cupins"],

      ["🦌", "Veados"],

      ["🐦", "Seriemas"],

      ["🐺", "Lobos-guará"],

      ["🐈", "Jaguatiricas"],

      ["🦅", "Gaviões"]

    ]

  },



  ca: {

    n: "Caatinga",

    b: "semiárido",

    sp: [

      ["🌵", "Cactos"],

      ["🐝", "Abelhas"],

      ["🐁", "Preás"],

      ["🦎", "Lagartos"],

      ["🦊", "Raposas"],

      ["🐍", "Jiboias"],

      ["🦅", "Carcarás"]

    ]

  },



  ma: {

    n: "Mata Atlântica",

    b: "floresta costeira",

    sp: [

      ["🌳", "Jequitibás"],

      ["🦋", "Borboletas"],

      ["🐒", "Micos"],

      ["🐸", "Sapos"],

      ["🐆", "Onças"],

      ["🐍", "Jararacas"],

      ["🦅", "Gaviões"]

    ]

  },



  pt: {

    n: "Pantanal",

    b: "maior planície alagada do mundo",

    sp: [

      ["🌿", "Aguapés"],

      ["🦟", "Mosquitos"],

      ["🐹", "Capivaras"],

      ["🐸", "Pererecas"],

      ["🐆", "Onças-pintadas"],

      ["🐊", "Jacarés"],

      ["🦅", "Gaviões"]

    ]

  },



  pa: {

    n: "Pampa",

    b: "campos do sul",

    sp: [

      ["🌾", "Capim"],

      ["🐞", "Besouros"],

      ["🦌", "Veados"],

      ["🐦", "Quero-queros"],

      ["🐈", "Gatos-do-mato"],

      ["🐍", "Cobras"],

      ["🦅", "Gaviões"]

    ]

  }

};



const BIOME_COLORS = {

  am: "#25a66a",

  ce: "#e7a83e",

  ca: "#c8794b",

  ma: "#3b9fba",

  pt: "#6b75d6",

  pa: "#b8a85a",

  base: "#5d8c77"

};



function setRegion(key) {

  selectedBiome = key;

  selectedState = null;



  const data = key === "base" ? BASE : REGIONS[key].sp;

  // Restaura os nomes padrão antes de aplicar o bioma selecionado.
  SP.forEach((species, index) => {
    species.e = BASE[index][0];
    species.n = BASE[index][1];
  });

  data.forEach((species, index) => {
    if (SP[index]) {
      SP[index].e = species[0];
      SP[index].n = species[1];
    }
  });

  build();

  init();



  document.querySelectorAll(".reg").forEach(region => {

    region.style.setProperty(

      "--c",

      BIOME_COLORS[region.dataset.r] || BIOME_COLORS.base

    );



    region.classList.toggle(

      "on",

      region.dataset.r === key

    );

  });



  $("mapsvg").classList.toggle(

    "sel",

    key !== "base"

  );



  document.querySelectorAll(".chip").forEach(chip => {

    chip.classList.toggle(

      "on",

      chip.dataset.r === key

    );

  });



  const description = key === "base"

    ? "Ecossistema padrão"

    : REGIONS[key].n + " — " + REGIONS[key].b;



  $("biome").textContent = "📍 " + description;



  log("📍 Bioma: " + description);

}



const chips = [

  ["base", "🌐 Padrão"],

  ...Object.keys(REGIONS).map(key => [

    key,

    REGIONS[key].n

  ])

];



$("chips").innerHTML = chips.map(([key, name]) =>

  `<button type="button" class="chip" data-r="${key}">${name}</button>`

).join("");



document.querySelectorAll(".chip").forEach(chip => {

  chip.addEventListener("click", () => {

    setRegion(chip.dataset.r);

  });

});



/* =========================================

   ESTADOS DO MAPA

\========================================= */



const STATES = {

  AC: "Acre",

  AL: "Alagoas",

  AP: "Amapá",

  AM: "Amazonas",

  BA: "Bahia",

  CE: "Ceará",

  DF: "Distrito Federal",

  ES: "Espírito Santo",

  GO: "Goiás",

  MA: "Maranhão",

  MT: "Mato Grosso",

  MS: "Mato Grosso do Sul",

  MG: "Minas Gerais",

  PA: "Pará",

  PB: "Paraíba",

  PR: "Paraná",

  PE: "Pernambuco",

  PI: "Piauí",

  RJ: "Rio de Janeiro",

  RN: "Rio Grande do Norte",

  RS: "Rio Grande do Sul",

  RO: "Rondônia",

  RR: "Roraima",

  SC: "Santa Catarina",

  SP: "São Paulo",

  SE: "Sergipe",

  TO: "Tocantins"

};



function pick(region) {

  setRegion(region.dataset.r);



  selectedState = {

    uf: region.dataset.uf,

    name: STATES[region.dataset.uf] || region.dataset.uf

  };



  const biomeName = selectedBiome === "base"
    ? "Ecossistema padrão"
    : REGIONS[selectedBiome].n + " — " + REGIONS[selectedBiome].b;
  $("biome").textContent = "📍 " + biomeName + " · " + selectedState.name;

}



document.querySelectorAll(".reg").forEach(region => {

  region.addEventListener("click", () => {

    pick(region);

  });



  region.addEventListener("keydown", event => {

    if (event.key === "Enter" || event.key === " ") {

      event.preventDefault();

      pick(region);

    }

  });

});



/* =========================================

   INÍCIO DO JOGO

\========================================= */



installSupportPanels();

build();

init();

setRegion("base");



timer = window.setInterval(frame, 60);



window.addEventListener("resize", draw);



window.addEventListener("pagehide", () => {

  if (timer !== null) {

    window.clearInterval(timer);

    timer = null;

  }

});
