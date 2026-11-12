(() => {
  "use strict";

  const chapters = ["origins", "lens", "contract", "prices", "redistribution"];
  const copy = {
    en: {
      title: "Learning guide", close: "Close guide", previous: "Previous",
      next: "Next", finish: "Finish", try: "Try in the lab", example: "Course example",
      pages: [
        {
          title: "Read the same point twice",
          text: "The box contains 80 units of X and 50 of Y. Read Samuel’s bundle from the bottom left, moving right and up. Read Romane’s from the top right, moving left and down.",
          example: "Samuel starts with 20 X and 30 Y. Romane gets the remaining 60 X and 20 Y. Move the point to the right. Who gives up X?"
        },
        {
          title: "Find a trade both would accept",
          text: "Each person is equally satisfied anywhere on their indifference curve. Draw one curve per person through the starting endowment. Inside the lens between them, both prefer the new bundle. Along its edges, one can gain while the other is indifferent.",
          example: "Try giving Samuel 10 X from Romane in exchange for 5 Y. Samuel now has (30, 25), and Romane has (50, 25). Check each person’s gain against their own starting bundle."
        },
        {
          title: "When do the gains run out?",
          text: "At an interior point on the contract curve, the indifference curves touch. Both people would give up Y for one more X at the same marginal rate. Any further gain for one requires a loss for the other. This is Pareto efficiency.",
          example: "At Samuel’s bundle (40, 20), both marginal rates are 0.5 Y per X. Follow the contract curve toward a corner. How much can one person own while the allocation is still efficient?"
        },
        {
          title: "Find the price that clears both markets",
          text: "The price of X in units of Y determines the slope of the budget line. The line passes through the endowment because each person can keep what they own. With the Cobb–Douglas preferences used here, Samuel spends 50% of his budget on X and Romane spends 40%.",
          example: "At 1 Y per X, Samuel wants 25 X and Romane wants 32 X. That leaves 23 X unsold. At 0.5 Y per X, each wants 40 X, and their Y demands sum to 50. This competitive equilibrium is Pareto efficient, as the first welfare theorem predicts."
        },
        {
          title: "Change who owns the goods",
          text: "Redistributing endowments changes purchasing power. With preferences and supplies fixed, the contract curve stays in place. The second welfare theorem says that, under the model’s assumptions, a suitable redistribution and prices can support any interior efficient allocation.",
          example: "Transfer 10 X from Romane to Samuel before trade. Compare their equilibrium bundles with the original ones. The model covers one period of exchange between two price-taking consumers, with fixed supplies and no production."
        }
      ]
    },
    fr: {
      title: "Guide", close: "Fermer le guide", previous: "Précédent",
      next: "Suivant", finish: "Terminer", try: "Essayer dans le labo", example: "Exemple du cours",
      pages: [
        {
          title: "Lire un même point deux fois",
          text: "La boîte contient 80 unités de X et 50 de Y. Pour lire le panier de Samuel, partez du coin inférieur gauche et allez vers la droite et le haut. Pour Romane, partez du coin supérieur droit et allez vers la gauche et le bas.",
          example: "Samuel possède au départ 20 X et 30 Y. Il reste à Romane 60 X et 20 Y. Déplacez le point vers la droite. Qui cède du bien X ?"
        },
        {
          title: "Trouver un échange qui convient aux deux",
          text: "Une personne est aussi satisfaite de tous les paniers sur sa courbe d’indifférence. Tracez les deux courbes passant par la dotation initiale. À l’intérieur de la lentille qu’elles délimitent, les deux personnes gagnent à échanger. Sur les bords, l’une peut gagner tandis que l’autre reste indifférente.",
          example: "Samuel reçoit 10 X de Romane et lui cède 5 Y. Il obtient (30, 25) et Romane (50, 25). Comparez le nouveau panier de chacun à son panier initial."
        },
        {
          title: "Quand les gains d’échange s’épuisent-ils ?",
          text: "En un point intérieur de la courbe des contrats, les courbes d’indifférence sont tangentes. À la marge, les deux personnes sont prêtes à céder la même quantité de Y pour une unité de X. Tout gain supplémentaire pour l’une impose une perte à l’autre. L’allocation est efficiente au sens de Pareto.",
          example: "Quand Samuel détient (40, 20), les deux taux marginaux de substitution valent 0,5 Y par X. Suivez la courbe des contrats vers un coin. Quelle part des biens une seule personne peut-elle détenir si l’allocation est efficiente ?"
        },
        {
          title: "Trouver le prix qui équilibre les deux marchés",
          text: "Le prix de X en unités de Y détermine la pente de la droite de budget. Celle-ci passe par la dotation initiale, puisque chacun peut garder ce qu’il possède. Avec les préférences de Cobb-Douglas utilisées ici, Samuel consacre 50 % de son budget à X et Romane y consacre 40 %.",
          example: "Au prix de 1 Y par X, Samuel demande 25 X et Romane 32 X. Il reste 23 X invendus. À 0,5 Y par X, chacun demande 40 X et leurs demandes de Y totalisent 50. Cet équilibre concurrentiel est efficient au sens de Pareto, comme le prédit le premier théorème du bien-être."
        },
        {
          title: "Redistribuer les dotations initiales",
          text: "Redistribuer les dotations change le pouvoir d’achat. À préférences et quantités totales fixes, la courbe des contrats reste la même. Selon le deuxième théorème du bien-être, sous les hypothèses du modèle, une redistribution et des prix appropriés permettent d’atteindre toute allocation intérieure efficiente.",
          example: "Avant l’échange, transférez 10 X de Romane à Samuel. Comparez leurs paniers d’équilibre aux paniers obtenus auparavant. Le modèle décrit une période d’échange entre deux consommateurs qui prennent les prix comme donnés, avec des quantités fixes et sans production."
        }
      ]
    }
  };

  let dialog, chapter, language, onExperiment, opener;

  function createDialog() {
    const style = document.createElement("style");
    style.textContent = `
      #exchange-guide {
        --guide-ink: #202e2c;
        --guide-teal: #256c65;
        box-sizing: border-box;
        width: min(39rem, calc(100% - 2rem));
        max-height: calc(100vh - 2rem);
        max-height: calc(100dvh - 2rem);
        overflow: auto;
        overscroll-behavior: contain;
        margin: auto;
        padding: 0;
        color: var(--guide-ink);
        background: #fffdf7;
        border: 1px solid #bdbeb3;
        border-radius: 12px;
        box-shadow: 0 18px 80px #19292338;
        font: 400 1rem/1.5 system-ui, sans-serif;
        text-align: left;
      }
      #exchange-guide::backdrop { background: #14242180; }
      #exchange-guide * { box-sizing: border-box; }
      #exchange-guide [data-panel] { padding: clamp(1.15rem, 4vw, 2.1rem); }
      #exchange-guide [data-head],
      #exchange-guide [data-actions],
      #exchange-guide [data-turn] { display: flex; align-items: center; }
      #exchange-guide [data-head] { justify-content: space-between; gap: .6rem; }
      #exchange-guide [data-title] { font-size: .85rem; font-weight: 650; color: var(--guide-teal); }
      #exchange-guide [data-count] { color: #595e55; margin-left: .7rem; font-variant-numeric: tabular-nums; }
      #exchange-guide h2 {
        font: 500 clamp(1.75rem, 5vw, 2.45rem)/1.08 Georgia, serif;
        letter-spacing: -.025em; margin: .7rem 0 1rem; color: var(--guide-ink);
        overflow-wrap: break-word;
      }
      #exchange-guide p { margin: 0; color: var(--guide-ink); font: inherit; }
      #exchange-guide [data-example] {
        margin: 1.25rem 0 1.55rem; padding: .9rem 1.05rem;
        border-left: 3px solid #a75333; background: #f6f1e5;
      }
      #exchange-guide [data-example] strong {
        display: block; margin: 0 0 .35rem; color: #80422a; font-size: .85rem;
      }
      #exchange-guide [data-actions] { gap: .6rem; justify-content: space-between; flex-wrap: wrap; }
      #exchange-guide [data-turn] { gap: .35rem; }
      #exchange-guide button {
        appearance: none; margin: 0; min-height: 42px; width: auto;
        padding: .45rem .8rem; border: 1px solid #cbcfc4; border-radius: 5px;
        background: transparent; color: var(--guide-ink); font: 600 .88rem/1.25 system-ui, sans-serif;
        cursor: pointer; letter-spacing: normal; text-transform: none;
      }
      #exchange-guide button:hover:enabled { background: #ecede2; }
      #exchange-guide button:disabled { opacity: .45; cursor: default; }
      #exchange-guide [data-try] { background: var(--guide-teal); border-color: var(--guide-teal); color: white; }
      #exchange-guide [data-try]:hover { background: #164e48; }
      #exchange-guide [data-close] { width: 42px; padding: 0; font-size: 1.45rem; font-weight: 400; border: 0; }
      #exchange-guide button:focus-visible { outline: 3px solid var(--guide-teal); outline-offset: 2px; }
      #exchange-guide h2:focus { outline: none; }
      @media (max-width: 450px) {
        #exchange-guide [data-actions] { align-items: stretch; }
        #exchange-guide [data-try] { flex: 1 1 100%; }
        #exchange-guide [data-turn] { justify-content: space-between; width: 100%; margin-top: .15rem; }
      }
    `;
    document.head.append(style);
    dialog = document.createElement("dialog");
    dialog.id = "exchange-guide";
    dialog.setAttribute("aria-labelledby", "exchange-guide-heading");
    dialog.innerHTML = `
      <div data-panel>
        <div data-head>
          <div><span data-title></span><span data-count></span></div>
          <button type="button" data-close>×</button>
        </div>
        <h2 id="exchange-guide-heading" tabindex="-1" data-heading></h2>
        <p data-text></p>
        <div data-example><strong data-example-label></strong><p data-example-text></p></div>
        <div data-actions>
          <button type="button" data-try></button>
          <div data-turn>
            <button type="button" data-prev></button>
            <button type="button" data-next></button>
          </div>
        </div>
      </div>
    `;
    document.body.append(dialog);
    element("close").addEventListener("click", () => dialog.close());
    element("prev").addEventListener("click", () => showChapter(chapter - 1));
    element("next").addEventListener("click", () => {
      if (chapter === chapters.length - 1) dialog.close();
      else showChapter(chapter + 1);
    });
    element("try").addEventListener("click", () => {
      dialog.close();
      onExperiment?.(chapters[chapter]);
    });
    dialog.addEventListener("close", () => {
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right ||
            event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
      }
    });
  }

  function element(name) {
    return dialog.querySelector(`[data-${name}]`);
  }

  function showChapter(index) {
    chapter = index;
    const labels = copy[language];
    const page = labels.pages[index];
    dialog.lang = language;
    element("title").textContent = labels.title;
    element("count").textContent = `${index + 1} / ${chapters.length}`;
    element("heading").textContent = page.title;
    element("text").textContent = page.text;
    element("example-label").textContent = labels.example;
    element("example-text").textContent = page.example;
    element("close").setAttribute("aria-label", labels.close);
    element("try").textContent = labels.try;
    element("prev").textContent = labels.previous;
    element("prev").disabled = index === 0;
    element("next").textContent = index === chapters.length - 1 ? labels.finish : labels.next;
    if (dialog.open) {
      dialog.scrollTop = 0;
      element("heading").focus({ preventScroll: true });
    }
  }

  window.ExchangeGuide = {
    open(lang, onTry) {
      if (!dialog) createDialog();
      language = String(lang).toLowerCase().startsWith("fr") ? "fr" : "en";
      onExperiment = onTry;
      if (!dialog.open) opener = document.activeElement;
      showChapter(0);
      if (!dialog.open) {
        dialog.showModal();
        element("heading").focus({ preventScroll: true });
      }
    }
  };
})();
