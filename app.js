(() => {
  "use strict";

  const model = window.EdgeworthModel;
  const byId = id => document.getElementById(id);
  const query = new URLSearchParams(location.search);
  let lang = query.get("lang") === "fr" ? "fr" : "en";
  let stage = "trade";
  let pane = "endowments";
  let economy, point, price, preset, customized;
  let resourcesOpen = false;
  let followCurve = false;
  let layers = {};
  const word = (en, fr) => lang === "fr" ? fr : en;
  const number = (n, digits = 2) => n.toLocaleString(lang === "fr" ? "fr-FR" : "en-US", {maximumFractionDigits: digits});
  const signed = (n, digits = 2) => (n > 0 ? "+" : n < 0 ? "−" : "") + number(Math.abs(n), digits);
  const icon = name => '<svg class="icon" aria-hidden="true"><use href="#' + name + '"/></svg>';
  const text = {
    title: ["The Edgeworth box", "La boîte d’Edgeworth"],
    guide: ["Learning guide", "Guide du cours"],
    lead: ["Two people share two goods. Which trades would they both accept?", "Deux personnes se partagent deux biens. Quels échanges accepteraient-elles ?"],
    scenario: ["Scenario", "Scénario"],
    trade: ["Gains from trade", "Gains à l’échange"],
    efficiency: ["Pareto efficiency", "Efficience de Pareto"],
    prices: ["Market prices", "Prix de marché"],
    diagram: ["Allocation diagram", "Diagramme des allocations"],
    settings: ["Economy settings", "Paramètres"],
    reset: ["Reset", "Réinitialiser"],
    endowments: ["Endowments", "Dotations"],
    preferences: ["Preferences", "Préférences"],
    modelNote: ["Model and assumptions", "Modèle et hypothèses"]
  };

  const scenarios = {
    course: { label: ["Course example", "Exemple du cours"], end: [20, 30], weights: [.5, .4], test: [40, 20] },
    tastes: { label: ["Opposite tastes", "Goûts opposés"], end: [40, 25], weights: [.8, .2], test: [55, 18] },
    efficient: { label: ["No gains from trade", "Aucun gain à l’échange"], end: [40, 25], weights: [.5, .5], test: [40, 25] },
    unequal: { label: ["Unequal ownership", "Dotations inégales"], end: [72, 45], weights: [.5, .5], test: [72, 45] },
    transfer: { label: ["Redistribute 10 X", "Redistribuer 10 X"], end: [30, 30], weights: [.5, .4], test: [40, 20] }
  };

  function loadScenario(key) {
    const s = scenarios[key];
    preset = key;
    customized = false;
    economy = { totalX: 80, totalY: 50, alphaA: s.weights[0], alphaB: s.weights[1], endowment: {x: s.end[0], y: s.end[1]} };
    point = { x: s.test[0], y: s.test[1] };
    price = 1;
  }

  function defaultLayers() {
    followCurve = false;
    layers = { curves: true, lens: stage !== "efficiency", contract: stage === "efficiency" };
  }

  function scenarioOptions() {
    byId("scenario").innerHTML = Object.entries(scenarios).map(([key, s]) =>
      '<option value="' + key + '">' + word(...s.label) + '</option>').join("") +
      (customized ? '<option disabled value="custom">' + word("Custom economy", "Économie personnalisée") + '</option>' : "");
    byId("scenario").value = customized ? "custom" : preset;
  }

  function updateStatic() {
    document.documentElement.lang = lang;
    document.title = word(...text.title) + " · Exchange Lab";
    document.querySelectorAll("[data-i]").forEach(el => { el.textContent = word(...text[el.dataset.i]); });
    for (const language of ["en", "fr"]) byId(language).setAttribute("aria-pressed", String(language === lang));
    updateClassroomButton();
    byId("mode-nav").setAttribute("aria-label", word("Topics", "Thèmes"));
    byId("settings-nav").setAttribute("aria-label", word("Economy settings", "Paramètres de l’économie"));
    byId("reset").title = word("Restore this scenario’s starting values", "Rétablir les valeurs de départ de ce scénario");
    byId("model-content").innerHTML = word(
      "<p>One period, two consumers and fixed supplies of X and Y. Each consumer ranks bundles by <i>U</i> = X<sup>α</sup>Y<sup>1−α</sup>. Compare a person’s utility across their own bundles. Utility levels do not measure differences in well-being between people.</p><p>The course example uses Samuel’s and Romane’s endowments from Économie I. The weights α = 0.5 and 0.4 give a numerical version of the diagram. In the price experiment, both can trade at the same prices, take those prices as given and spend only the value of their endowment. Production, externalities and transaction costs are excluded.</p>",
      "<p>Deux consommateurs disposent de quantités fixes de X et de Y pour une période. Chacun classe ses paniers selon <i>U</i> = X<sup>α</sup>Y<sup>1−α</sup>. On peut comparer l’utilité d’une personne entre deux paniers. Les niveaux d’utilité ne mesurent pas les écarts de bien-être entre personnes.</p><p>L’exemple reprend les dotations de Samuel et de Romane du cours Économie I. Les poids α = 0,5 et 0,4 donnent une version numérique du graphique. Les deux consommateurs prennent les prix comme donnés et disposent d’un budget égal à la valeur de leur dotation. Le modèle exclut la production, les externalités et les coûts de transaction.</p>"
    );
    scenarioOptions();
  }

  function rangeRow(id, label, min, max, step) {
    return '<div class="range-control"><div class="range-head"><label for="' + id + '">' + label +
      '</label><input class="numeric" type="number" aria-label="' + label + '" id="' + id + '-value" min="' + min + '" max="' + max + '" step="' + step + '"></div>' +
      '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '">' +
      '<div class="range-ends" aria-hidden="true"><span>' + number(min) + '</span><span>' + number(max) + '</span></div></div>';
  }

  function resourceRow(axis) {
    return '<div class="resource-row"><label for="total' + axis + '">' + word("Total good ", "Quantité de ") + axis +
      '</label><input class="numeric" id="total' + axis + '" type="number" min="10" max="200" step="1"></div>';
  }

  function showParameters() {
    document.querySelectorAll("[data-pane]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.pane === pane)));
    let rows;
    if (pane === "endowments") {
      rows = '<div class="param-intro"><strong>' + word("Samuel’s initial bundle", "Dotation initiale de Samuel") + '</strong><p>' +
        word("Romane receives the remaining units.", "Romane reçoit les quantités restantes.") + '</p></div>' +
        rangeRow("startX", word("Good X", "Bien X"), 0, economy.totalX, 1) + rangeRow("startY", word("Good Y", "Bien Y"), 0, economy.totalY, 1);
    } else {
      rows = '<div class="param-intro"><strong>' + word("Preference for good X", "Préférence pour le bien X") + '</strong><p>' +
        word("A higher weight means a larger share of the budget goes to X.", "Plus le poids est élevé, plus la part du budget consacrée à X est grande.") + '</p></div>' +
        rangeRow("alphaA", "Samuel (α)", .1, .9, .01) + rangeRow("alphaB", "Romane (α)", .1, .9, .01);
    }
    byId("parameters").innerHTML = rows + '<details class="resource-details" id="resources"' + (resourcesOpen ? " open" : "") + '><summary>' +
      word("Total resources", "Ressources totales") + '<span class="amount">' + economy.totalX + ' X · ' + economy.totalY + ' Y</span>' + icon("down") +
      '</summary><div class="resource-edit">' + resourceRow("X") + resourceRow("Y") + '</div></details>';
    byId("resources").addEventListener("toggle", event => { resourcesOpen = event.currentTarget.open; });
    byId("totalX").value = economy.totalX;
    byId("totalY").value = economy.totalY;
    syncRanges();
  }

  function setRange(range, value) {
    range.value = value;
    const percent = 100 * (parseFloat(range.value) - Number(range.min)) / (Number(range.max) - Number(range.min));
    range.style.setProperty("--fill", percent + "%");
  }

  function syncRanges() {
    const values = pane === "endowments"
      ? {startX: economy.endowment.x, startY: economy.endowment.y}
      : {alphaA: economy.alphaA, alphaB: economy.alphaB};
    Object.entries(values).forEach(([id, value]) => {
      setRange(byId(id), value);
      byId(id + "-value").value = value;
    });
    if (pane === "preferences") byId("alphaB").style.setProperty("--range-color", "#ad5636");
  }

  function setParameter(id, raw) {
    const input = byId(id);
    if (raw === "" || !Number.isFinite(Number(raw))) { showParameters(); return; }
    const clamped = Math.max(Number(input.min), Math.min(Number(input.max), Number(raw)));
    const value = id.startsWith("alpha") ? Math.round(clamped * 100) / 100 : Math.round(clamped);
    if (id === "startX") economy.endowment.x = value;
    if (id === "startY") economy.endowment.y = value;
    if (id.startsWith("alpha")) economy[id] = value;
    if (id.startsWith("total")) {
      economy[id] = value;
      economy.endowment = model.clampPoint(economy, economy.endowment);
      point = model.clampPoint(economy, point);
    }
    if (!customized) { customized = true; scenarioOptions(); }
    if (id.startsWith("total")) showParameters(); else syncRanges();
    renderEconomy();
  }

  function makeKey(kind, label) { return '<span><i class="glyph ' + kind + '"></i>' + label + '</span>'; }

  function updateMode() {
    document.querySelectorAll("[data-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === stage)));
    const market = stage === "prices";
    byId("chart-instruction").textContent = market
      ? word("Change the price to compare the two desired bundles.", "Faites varier le prix pour comparer les deux paniers demandés.")
      : stage === "efficiency"
        ? word("Move T to see where the two indifference curves touch.", "Déplacez T pour trouver où les courbes d’indifférence sont tangentes.")
        : word("Drag T to test a trade, or use the arrow keys.", "Déplacez T pour tester un échange, à la souris ou au clavier.");
    byId("layers").setAttribute("aria-label", word("Diagram layers", "Éléments du diagramme"));
    const choices = [["curves", word("Indifference curves", "Courbes d’indifférence")]];
    if (stage === "trade") choices.push(["lens", word("Trade lens", "Lentille d’échange")]);
    if (market) choices.push(["lens", word("Endowment lens", "Lentille de dotation")]);
    choices.push(["contract", word("Contract curve", "Courbe des contrats")]);
    byId("layers").innerHTML = choices.map(([key, label]) => '<label class="layer' + (market && key === "lens" ? ' grey-lens' : '') + '"><input type="checkbox" data-layer="' +
      key + '"' + (layers[key] ? ' checked' : '') + '>' + label + '</label>').join("");
    const experiment = byId("experiment");
    experiment.hidden = stage === "trade";
    if (stage === "efficiency") {
      experiment.innerHTML = '<p>' + word("Keep Samuel’s X fixed and find the efficient amount of Y.", "Gardez X fixe pour Samuel et trouvez la quantité efficiente de Y.") +
        '</p><button class="exp-action" id="tangent" aria-pressed="false">' + icon("target") + word("Trace the curve", "Suivre la courbe") + '</button>';
    } else if (market) {
      experiment.innerHTML = '<div class="price-control"><div class="price-label"><label for="trial-price">' +
        word("Price of X in units of Y", "Prix de X en unités de Y") + '</label><output id="price-out" for="trial-price"></output></div>' +
        '<input type="range" id="trial-price" step="0.001"></div><button class="exp-action" id="clear-markets">' + icon("target") +
        word("Find clearing price", "Trouver le prix d’équilibre") + '</button>';
    } else experiment.innerHTML = "";
  }

  function syncPrice() {
    if (stage !== "prices") return;
    const slider = byId("trial-price");
    const equilibrium = model.equilibrium(economy).price;
    // Log spacing keeps a factor-of-two price change equally easy in either direction.
    slider.min = Math.min(-2, Math.floor(Math.log2(equilibrium)) - 2, Math.floor(Math.log2(price)));
    slider.max = Math.max(2, Math.ceil(Math.log2(equilibrium)) + 2, Math.ceil(Math.log2(price)));
    setRange(slider, Math.log2(price));
    const label = number(price, 4);
    byId("price-out").textContent = label;
    slider.setAttribute("aria-valuetext", label + " Y / X");
  }

  function col(label, body) { return '<th scope="col"' + (label ? ' aria-label="' + label + '"' : "") + '>' + body + '</th>'; }
  function readout() {
    const market = stage === "prices";
    const b = market ? model.demands(economy, price) : model.bundles(economy, point);
    const initial = model.utilities(economy, economy.endowment);
    const current = model.utilities(economy, point);
    const marginal = model.mrs(economy, point);
    const startingBundles = model.bundles(economy, economy.endowment);
    const rate = n => n === null ? "—" : n === Infinity ? "∞" : number(n);
    const quantity = (person, axis) => (stage === "trade" ? '<span class="from-amount">' +
      number(startingBundles[person][axis]) + ' → </span>' : "") + number(b[person][axis]);
    const row = (key, name) => {
      let extra = "";
      if (stage === "trade") {
        const change = current[key] - initial[key];
        const sign = model.compare(economy, point)[key];
        extra = '<td class="change ' + (sign > 0 ? "up" : sign < 0 ? "down" : "same") + '">' +
          (sign === 0 ? "0" : Math.abs(change) < .005 ? (sign > 0 ? "↑" : "↓") + " &lt;" + number(.01) : signed(change)) + '</td>';
      } else if (!market) extra = '<td>' + rate(marginal[key]) + '</td>';
      return '<tr><th scope="row"><span class="person ' + key + '">' + name + '</span></th><td>' + quantity(key, "x") +
        '</td><td>' + quantity(key, "y") + '</td>' + extra + '</tr>';
    };
    byId("table-title").textContent = market ? word("Desired bundles", "Paniers demandés") : word("Test allocation", "Allocation proposée");
    byId("table-symbol").textContent = market ? "S, R" : "T";
    let caption = word("Initial → proposed bundle. ΔU is the change in each person’s utility.", "Panier initial → panier proposé. ΔU mesure la variation d’utilité de chacun.");
    let last = col(word("Utility change", "Variation d’utilité"), "ΔU");
    if (stage === "efficiency") {
      last = col(word("Marginal rate of substitution", "Taux marginal de substitution"), word("MRS", "TMS"));
      caption = word("MRS is the amount of Y a person would give up for one more X at the margin.", "Le TMS est la quantité de Y qu’une personne céderait pour un X de plus, à la marge.");
    }
    if (market) {
      last = "";
      caption = word("Available in total", "Quantités disponibles") + " · " + economy.totalX + " X, " + economy.totalY + " Y.";
      if (b.a.x > economy.totalX || b.a.y > economy.totalY || b.b.x > economy.totalX || b.b.y > economy.totalY) {
        caption += word(" An arrow at the edge marks a demand outside the box.", " Une flèche sur le bord indique une demande hors de la boîte.");
      }
    }
    byId("table-wrap").innerHTML = '<table aria-labelledby="table-title"><thead><tr>' + col("", word("Consumer", "Personne")) + col("", "X") + col("", "Y") +
      last + '</tr></thead><tbody>' + row("a", "Samuel") + row("b", "Romane") +
      '</tbody></table><p class="caption">' + caption + '</p>';
  }

  function tradeFinding() {
    const c = model.compare(economy, point);
    if (point.x === economy.endowment.x && point.y === economy.endowment.y) {
      if (model.isEfficient(economy, point)) return [
        word("The starting allocation is efficient", "La dotation initiale est efficiente"),
        word("The two consumers already hold an efficient split. Any trade that benefits one makes the other worse off.", "La répartition initiale est déjà efficiente. Tout échange qui profite à l’un détériore la situation de l’autre.")
      ];
      return [word("T is at the initial endowment", "T coïncide avec la dotation initiale"),
        word("Both keep their original bundles. Move T into the lens to find a trade they both prefer.", "Chacun garde son panier. Déplacez T dans la lentille pour trouver un échange avantageux pour les deux.")];
    }
    if (c.bothGain) return [
      word("Both gain from this trade", "Les deux gagnent à cet échange"),
      word("T lies inside the lens. Samuel and Romane each prefer their bundle at T to their initial bundle at ω.", "T se trouve dans la lentille. Samuel et Romane préfèrent chacun leur panier en T à leur panier initial en ω.")
    ];
    if (c.paretoImprovement) {
      const winner = c.a > 0 ? "Samuel" : "Romane";
      const other = c.a > 0 ? "Romane" : "Samuel";
      return [word("A Pareto improvement", "Une amélioration au sens de Pareto"),
        word(winner + " gains and " + other + " is indifferent between T and ω.", winner + " y gagne et " + other + " est indifférent" + (other === "Romane" ? "e" : "") + " entre T et ω.")];
    }
    if (c.a === 0 && c.b === 0) return [word("Both are indifferent", "Les deux sont indifférents"),
      word("Each person ranks their bundle at T the same as their endowment at ω.", "Pour chacun, le panier en T procure la même utilité que la dotation en ω.")];
    const who = c.a < 0 && c.b < 0 ? word("Both prefer", "Les deux préfèrent") : c.a < 0 ? word("Samuel prefers", "Samuel préfère") : word("Romane prefers", "Romane préfère");
    const subject = c.a < 0 && c.b < 0 ? word(" their original bundles", " leurs paniers initiaux") : word(" the original bundle", " son panier initial");
    return [word("This trade would be rejected", "Cet échange serait refusé"), who + subject + word(" at ω. Compare T with the area where both would accept a trade.", " en ω. Comparez T à la zone où les deux accepteraient l’échange.")];
  }

  function efficientFinding() {
    const efficient = model.isEfficient(economy, point);
    if (efficient) {
      const corner = point.x === 0 || point.x === economy.totalX;
      return [word("T is Pareto efficient", "T est efficient au sens de Pareto"), corner
        ? word("One person owns all the goods. Giving the other person a better bundle would cost the owner utility.", "Une personne possède tous les biens. Améliorer la situation de l’autre réduirait son utilité.")
        : word("The curves touch at T. Both value an extra X at the same amount of Y. Moving along the contract curve changes who gets the goods.", "Les courbes sont tangentes en T. Les deux valorisent un X supplémentaire au même taux. Le long de la courbe des contrats, la répartition des biens change.")];
    }
    const rates = model.mrs(economy, point);
    if (Number.isFinite(rates.a) && Number.isFinite(rates.b)) {
      const buyer = rates.a > rates.b ? "Samuel" : "Romane";
      const seller = rates.a > rates.b ? "Romane" : "Samuel";
      const low = number(Math.min(rates.a, rates.b), 4);
      const high = number(Math.max(rates.a, rates.b), 4);
      if (low !== high) return [word("There are still gains from trade", "Il reste des gains à l’échange"),
        word(buyer + " values an extra X more than " + seller + ". For a small trade, a price between " + low + " and " + high + " Y per X benefits both.",
          buyer + " valorise un X de plus davantage que " + seller + ". Pour un petit échange, un prix entre " + low + " et " + high + " Y par X avantage les deux.")];
    }
    return [word("There are still gains from trade", "Il reste des gains à l’échange"),
      word("T is off the contract curve. A different split can make at least one person better off while preserving the other’s utility or raising it.", "T est en dehors de la courbe des contrats. Une autre répartition peut améliorer la situation de l’un tout en préservant ou en augmentant l’utilité de l’autre.")];
  }

  function marketClears() {
    const clearing = model.equilibrium(economy).price;
    return Math.abs(price - clearing) < 1e-8 * clearing;
  }

  function priceFinding() {
    const d = model.demands(economy, price);
    if (preset === "transfer" && !customized && marketClears()) return [
      word("Both markets clear", "Les deux marchés sont à l’équilibre"),
      word("After the transfer of 10 X, Samuel’s equilibrium bundle changes from (40 X, 20 Y) to ",
        "Après le transfert de 10 X, le panier d’équilibre de Samuel passe de (40 X, 20 Y) à ") +
        "(" + number(d.a.x) + " X, " + number(d.a.y) + word(" Y). Both outcomes are Pareto efficient.", " Y). Les deux répartitions sont efficientes au sens de Pareto.")
    ];
    if (marketClears()) return [
      word("Both markets clear", "Les deux marchés sont à l’équilibre"),
      word("At ", "Au prix de ") + number(price, 4) + word(" Y per X, desired bundles use exactly ", " Y par X, les paniers demandés utilisent exactement ") +
        economy.totalX + " X " + word("and ", "et ") + economy.totalY + word(" Y. The two demand points meet at an efficient allocation.", " Y. Les deux points de demande coïncident en une allocation efficiente.")
    ];
    const shortage = d.excess.x > 0;
    const gap = n => Math.abs(n) < .01 ? word("less than 0.01", "moins de 0,01") : number(Math.abs(n));
    return [shortage ? word("Demand for X exceeds supply", "La demande de X dépasse l’offre") : word("Some X would remain unsold", "Une partie de X resterait invendue"),
      word("At this price, ", "À ce prix, ") + (shortage
        ? word("buyers want " + gap(d.excess.x) + " more X than exists, leaving " + gap(d.excess.y) + " Y unsold. Try raising the price of X.",
          "il manque " + gap(d.excess.x) + " de X et il resterait " + gap(d.excess.y) + " de Y. Essayez d’augmenter le prix de X.")
        : word(gap(d.excess.x) + " X would be left over and buyers want " + gap(d.excess.y) + " more Y than exists. Try lowering the price of X.",
          "il resterait " + gap(d.excess.x) + " de X et il manque " + gap(d.excess.y) + " de Y. Essayez de baisser le prix de X."))];
  }

  function renderEconomy() {
    if (followCurve) point.y = model.contractY(economy, point.x);
    window.ExchangeChart.render(byId("chart"), {economy, point, stage, layers, price, lang, followCurve}, next => {
      point = next;
      renderEconomy();
    });
    const market = stage === "prices";
    const wKey = makeKey("w", word("Initial endowment", "Dotation initiale") + " (ω)");
    byId("plot-key").innerHTML = market ? wKey + makeKey("budget", word("Budget line", "Droite de budget")) +
      (marketClears() ? makeKey("equilibrium", word("Equilibrium", "Équilibre") + " (E)") :
        makeKey("demand-a", word("Samuel’s demand", "Demande de Samuel")) + makeKey("demand-b", word("Romane’s demand", "Demande de Romane")))
      : wKey + makeKey("t", word("Test allocation", "Allocation proposée") + " (T)");
    const finding = market ? priceFinding() : stage === "efficiency" ? efficientFinding() : tradeFinding();
    byId("finding").textContent = finding[0];
    byId("explanation").textContent = finding[1];
    if (stage === "efficiency") {
      const trace = byId("tangent");
      trace.setAttribute("aria-pressed", String(followCurve));
      trace.innerHTML = icon("target") + (followCurve ? word("Stop tracing", "Déplacement libre") : word("Trace the curve", "Suivre la courbe"));
      byId("experiment").querySelector("p").textContent = followCurve
        ? word("Move T left or right to compare efficient allocations.", "Déplacez T vers la gauche ou la droite pour comparer les allocations efficientes.")
        : word("Hold Samuel’s X fixed and move T to the contract curve.", "Gardez X fixe pour Samuel et placez T sur la courbe des contrats.");
    }
    syncPrice();
    readout();
  }

  function renderAll() {
    updateStatic();
    updateMode();
    showParameters();
    renderEconomy();
  }

  function updateClassroomButton() {
    const active = document.body.classList.contains("classroom");
    const button = byId("classroom");
    const label = active ? word("Exit classroom view", "Quitter le mode cours") : word("Classroom view", "Mode cours");
    button.querySelector("span").textContent = label;
    button.title = label;
    button.setAttribute("aria-pressed", String(active));
  }

  function tryChapter(chapter) {
    loadScenario(chapter === "redistribution" ? "transfer" : "course");
    stage = ["redistribution", "prices"].includes(chapter) ? "prices" : chapter === "contract" ? "efficiency" : "trade";
    defaultLayers();
    pane = "endowments";
    if (chapter === "origins") point = {...economy.endowment};
    if (chapter === "lens") point = {x: 30, y: 25};
    if (chapter === "redistribution") {
      price = model.equilibrium(economy).price;
      layers.contract = true;
    }
    renderAll();
    byId("mode-nav").scrollIntoView({block: "start"});
  }

  byId("guide-open").addEventListener("click", () => window.ExchangeGuide.open(lang, tryChapter));
  byId("classroom").addEventListener("click", () => {
    document.body.classList.toggle("classroom");
    updateClassroomButton();
    renderEconomy();
    window.scrollTo(0, 0);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !document.querySelector("dialog[open]") && document.body.classList.contains("classroom")) {
      document.body.classList.remove("classroom");
      updateClassroomButton();
      renderEconomy();
    }
  });
  for (const code of ["en", "fr"]) byId(code).addEventListener("click", () => { lang = code; renderAll(); });
  byId("scenario").addEventListener("change", event => {
    loadScenario(event.target.value);
    defaultLayers();
    renderAll();
  });
  byId("reset").addEventListener("click", () => { loadScenario(preset); defaultLayers(); renderAll(); });
  byId("mode-nav").addEventListener("click", event => {
    const mode = event.target.closest("[data-mode]");
    if (!mode || stage === mode.dataset.mode) return;
    stage = mode.dataset.mode;
    defaultLayers();
    updateMode();
    renderEconomy();
  });
  byId("settings-nav").addEventListener("click", event => {
    const tab = event.target.closest("[data-pane]");
    if (tab) { pane = tab.dataset.pane; showParameters(); }
  });
  byId("parameters").addEventListener("input", event => {
    if (event.target.type === "range") setParameter(event.target.id, event.target.value);
  });
  byId("parameters").addEventListener("change", event => {
    if (event.target.type === "number") setParameter(event.target.id.replace("-value", ""), event.target.value);
  });
  byId("layers").addEventListener("change", event => {
    layers[event.target.dataset.layer] = event.target.checked;
    if (event.target.dataset.layer === "contract" && !event.target.checked) followCurve = false;
    renderEconomy();
  });
  byId("experiment").addEventListener("input", event => {
    if (event.target.id === "trial-price") { price = 2 ** Number(event.target.value); renderEconomy(); }
  });
  byId("experiment").addEventListener("click", event => {
    if (event.target.closest("#clear-markets")) price = model.equilibrium(economy).price;
    else if (event.target.closest("#tangent")) {
      followCurve = !followCurve;
      if (followCurve) {
        layers.curves = layers.contract = true;
        byId("layers").querySelectorAll("input").forEach(input => { input.checked = true; });
      }
    } else return;
    renderEconomy();
  });

  stage = ["trade", "efficiency", "prices"].includes(query.get("topic")) ? query.get("topic") : "trade";
  loadScenario(Object.hasOwn(scenarios, query.get("scenario")) ? query.get("scenario") : "course");
  defaultLayers();
  renderAll();
})();
