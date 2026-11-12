/* The SVG uses Samuel's bundle as its coordinate system throughout. */
(function () {
  "use strict";

  const teal = "#21615b";
  const rust = "#ad5636";
  const ink = "#273b38";
  const paper = "#fbfaf5";
  const charts = new WeakMap();
  let nextId = 0;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const round = n => Number(n.toFixed(3));

  function graphSize(svg) {
    const width = svg.getBoundingClientRect().width;
    const w = clamp(Math.round(width) || 700, 310, 850);
    const side = w < 450 ? 42 : 59;
    const naturalHeight = clamp((w - 2 * side) * 0.55, 197, 350);
    const maxHeight = getComputedStyle(svg).maxHeight;
    const heightLimit = maxHeight.endsWith("px") && width > 0 ? parseFloat(maxHeight) * w / width : Infinity;
    const plotHeight = Math.max(40, Math.min(naturalHeight, heightLimit - 104));
    return { w, h: plotHeight + 104, left: side, right: w - side, top: 50, bottom: 50 + plotHeight };
  }

  function ticks(total, targetCount) {
    const ideal = total / targetCount;
    const magnitude = 10 ** Math.floor(Math.log10(ideal));
    const step = [1, 2, 2.5, 5, 10].map(v => v * magnitude).find(v => v >= ideal - 1e-9);
    const result = [0];
    for (let val = step; val < total - step * 0.35; val += step) result.push(round(val));
    result.push(total);
    return result;
  }

  function line(x1, y1, x2, y2, attrs) {
    return '<line x1="' + round(x1) + '" y1="' + round(y1) + '" x2="' + round(x2) +
      '" y2="' + round(y2) + '" ' + attrs + '/>';
  }

  function textAt(x, y, label, attrs = "") {
    return '<text x="' + round(x) + '" y="' + round(y) + '" ' + attrs + '>' + label + '</text>';
  }

  function pathData(points) {
    return points.map(([x,y], i) => (i ? "L" : "M") + round(x) + " " + round(y)).join("");
  }

  function curve(e, anchor, person, px, py) {
    const b = person === "b";
    const own = window.EdgeworthModel.bundles(e, anchor)[person];
    const alpha = b ? e.alphaB : e.alphaA;
    const project = (x, y) => [px(b ? e.totalX - x : x), py(b ? e.totalY - y : y)];
    const topRight = project(e.totalX, e.totalY);

    if (own.x <= 0 || own.y <= 0) {
      const bottomLeft = project(0, 0);
      const bottomRight = project(e.totalX, 0);
      const topLeft = project(0, e.totalY);
      return {
        contour: pathData([topLeft, bottomLeft, bottomRight]),
        preferred: pathData([topLeft, bottomLeft, bottomRight, topRight]) + "Z"
      };
    }

    // Intersect the contour with the rectangle before sampling. This also
    // handles a market demand that lies beyond the economy's total resources.
    const firstX = own.x * (own.y / e.totalY) ** ((1 - alpha) / alpha);
    if (firstX > e.totalX) return { contour: "", preferred: "" };
    const points = [project(firstX, e.totalY)];
    for (let i = 1; i <= 160; i++) {
      const x = firstX + (e.totalX - firstX) * (i / 160) ** 2;
      const boxX = b ? e.totalX - x : x;
      const y = window.EdgeworthModel.indifferenceY(e, anchor, person, boxX);
      points.push([px(boxX), py(clamp(y, 0, e.totalY))]);
    }
    return {
      contour: pathData(points),
      preferred: pathData(points.concat([topRight])) + "Z"
    };
  }

  function draw(svg, instance) {
    const { economy: e, stage, layers, point, price, lang } = instance.state;
    const model = window.EdgeworthModel;
    const fr = lang === "fr";
    const market = stage === "prices";
    const size = graphSize(svg);
    const { w, h, left, right, top, bottom } = size;
    instance.size = size;
    const width = right - left;
    const height = bottom - top;
    const px = x => left + width * x / e.totalX;
    const py = y => bottom - height * y / e.totalY;
    const format = n => n.toLocaleString(fr ? "fr-FR" : "en-US", { maximumFractionDigits: 2 });
    const pair = p => "(" + format(p.x) + (fr ? " ; " : ", ") + format(p.y) + ")";
    const id = instance.id;
    const plot = 'x="' + left + '" y="' + top + '" width="' + width + '" height="' + height + '"';
    const chunks = [];
    const demand = market ? model.demands(e, price) : null;
    const base = stage === "efficiency" ? point : e.endowment;
    const a = curve(e, market ? demand.a : base, "a", px, py);
    const b = curve(e, market ? demand.bInBox : base, "b", px, py);
    svg.setAttribute("viewBox", [0, 0, w, h].join(" "));
    svg.setAttribute("role", market ? "img" : "application");
    svg.setAttribute("aria-labelledby", id + "-title " + id + "-desc");
    if (market) svg.removeAttribute("tabindex");
    else svg.setAttribute("tabindex", "0");
    svg.style.touchAction = market ? "auto" : "none";
    svg.style.cursor = market ? "default" : "crosshair";
    const title = fr ? "Boîte d’Edgeworth" : "Edgeworth box";
    const help = market
      ? (fr ? "Les points S et R indiquent les demandes au prix choisi." : "S and R mark demand at the chosen price.")
      : (fr ? "Déplacez T avec la souris ou les flèches du clavier." : "Move allocation T with the pointer or arrow keys.");
    const current = market ? "" : " T = " + pair(point) + ".";
    chunks.push('<title id="' + id + '-title">' + title + '</title><desc id="' + id + '-desc">' + help + current + '</desc>');
    chunks.push('<defs><clipPath id="' + id + '-box"><rect ' + plot + '/></clipPath></defs>');
    chunks.push('<rect ' + plot + ' fill="' + paper + '"/>');

    // Each axis receives its own increasing scale, including when the total
    // supply is not a multiple of the standard tick interval.
    const xTicks = ticks(e.totalX, width < 400 ? 5 : 8);
    const yTicks = ticks(e.totalY, height < 230 ? 4 : 6);
    const grid = 'stroke="#d4d8cb" stroke-opacity=".72" stroke-width=".8"';
    for (const x of xTicks.slice(1, -1)) chunks.push(line(px(x), top, px(x), bottom, grid));
    for (const y of yTicks.slice(1, -1)) chunks.push(line(left, py(y), right, py(y), grid));

    chunks.push('<g clip-path="url(#' + id + '-box)">');
    if (layers.lens && (stage === "trade" || market) && !model.isEfficient(e, e.endowment)) {
      // The lens compares both consumers with ω, even when the displayed curves pass through their demands.
      const initialA = market ? curve(e, e.endowment, "a", px, py) : a;
      const initialB = market ? curve(e, e.endowment, "b", px, py) : b;
      const fill = market ? "#bebebe" : "#c4d8b5";
      const hatch = market ? "#686868" : "#688d70";
      chunks.push('<defs><clipPath id="' + id + '-romane"><path d="' + initialB.preferred + '"/></clipPath>' +
        '<pattern id="' + id + '-hatch" width="7" height="7" patternUnits="userSpaceOnUse">' +
        '<path d="M-1 1L1 -1M0 7L7 0M6 8L8 6" fill="none" stroke="' + hatch + '" stroke-opacity=".24" stroke-width=".85"/></pattern></defs>');
      chunks.push('<g clip-path="url(#' + id + '-romane)"><title>' +
        (fr ? "Allocations que chacun juge au moins aussi bonnes que sa dotation initiale" : "Allocations both consumers like at least as much as their initial endowments") +
        '</title><path d="' + initialA.preferred + '" fill="' + fill + '" fill-opacity=".75"/>' +
        '<path d="' + initialA.preferred + '" fill="url(#' + id + '-hatch)"/></g>');
    }
    if (!market) {
      const projection = 'stroke="#586d68" stroke-opacity=".6" stroke-width="1.15" stroke-dasharray="2 4"';
      chunks.push(line(left, py(point.y), px(point.x), py(point.y), projection),
        line(px(point.x), py(point.y), px(point.x), bottom, projection));
    }
    if (layers.contract) {
      const cc = [];
      for (let i = 0; i <= 180; i++) {
        const x = e.totalX * i / 180;
        cc.push([px(x), py(model.contractY(e, x))]);
      }
      chunks.push('<path d="' + pathData(cc) + '" fill="none" stroke="#59765c" stroke-width="2.1" stroke-dasharray="6 5"/>');
    }
    if (layers.curves) {
      chunks.push('<path d="' + a.contour + '" fill="none" stroke="' + teal + '" stroke-width="2.45" stroke-linejoin="round"/>');
      chunks.push('<path d="' + b.contour + '" fill="none" stroke="' + rust + '" stroke-width="2.45" stroke-linejoin="round"/>');
    }
    if (market) {
      const x1 = clamp(e.endowment.x + (e.endowment.y - e.totalY) / price, 0, e.totalX);
      const x2 = clamp(e.endowment.x + e.endowment.y / price, 0, e.totalX);
      const by = x => py(e.endowment.y - price * (x - e.endowment.x));
      chunks.push(line(px(x1), by(x1), px(x2), by(x2), 'stroke="#645076" stroke-width="2.2"'));
    }
    chunks.push('</g>');
    const sa = 'stroke="' + teal + '" stroke-width="1.35"';
    const ra = 'stroke="' + rust + '" stroke-width="1.35"';
    chunks.push(line(left, top, left, bottom, sa), line(left, bottom, right, bottom, sa),
      line(left, top, right, top, ra), line(right, top, right, bottom, ra));
    chunks.push('<g font-family="IBM Plex Mono, Consolas, monospace" font-size="11">');
    for (const x of xTicks) {
      const sx = px(x), rx = px(e.totalX - x);
      chunks.push(line(sx, bottom, sx, bottom + 4, sa), line(rx, top, rx, top - 4, ra),
        textAt(sx, bottom + 17, format(x), 'fill="' + teal + '" text-anchor="middle"'),
        textAt(rx, top - 9, format(x), 'fill="' + rust + '" text-anchor="middle"'));
    }
    for (const y of yTicks) {
      const sy = py(y), ry = py(e.totalY - y);
      chunks.push(line(left - 4, sy, left, sy, sa), line(right, ry, right + 4, ry, ra),
        textAt(left - 8, sy + 3.5, format(y), 'fill="' + teal + '" text-anchor="end"'),
        textAt(right + 8, ry + 3.5, format(y), 'fill="' + rust + '" text-anchor="start"'));
    }
    chunks.push('</g>');
    const midX = (left + right) / 2, midY = (top + bottom) / 2;
    const axisFont = 'font-family="Inter, Segoe UI, sans-serif" font-size="12"';
    const good = fr ? "Bien " : "Good ";
    const axisA = 'fill="' + teal + '" text-anchor="middle"';
    const axisB = 'fill="' + rust + '" text-anchor="middle"';
    chunks.push('<g ' + axisFont + '>',
      textAt(midX, bottom + 39, good + "X →", axisA),
      textAt(midX, top - 30, "← " + good + "X", axisB),
      textAt(0, 0, good + "Y →", axisA + ' transform="translate(' + (left - 33) + ' ' + midY + ') rotate(-90)"'),
      textAt(0, 0, good + "Y →", axisB + ' transform="translate(' + (right + 34) + ' ' + midY + ') rotate(90)"'),
      textAt(left, bottom + 39, "Samuel", 'fill="' + teal + '" font-weight="650"'),
      textAt(right, top - 30, "Romane", 'fill="' + rust + '" font-weight="650" text-anchor="end"'),
      '</g>');
    chunks.push('<circle cx="' + left + '" cy="' + bottom + '" r="3" fill="' + teal + '"/>' +
      '<circle cx="' + right + '" cy="' + top + '" r="3" fill="' + rust + '"/>');

    const marks = [];
    const push = (kind, location, name, title, color, bundle = location) => {
      marks.push({ kind, x: px(location.x), y: py(location.y), name, title, color, bundle });
    };
    const same = (p, q) => Math.abs(p.x - q.x) <= e.totalX * 1e-8 && Math.abs(p.y - q.y) <= e.totalY * 1e-8;
    const endName = fr ? "Dotation initiale" : "Initial endowment";
    const end = e.endowment;
    const together = !market && same(point, end);
    push("end", end, together ? "ω = T" : "ω", endName, ink);
    if (!market && !together) push("test", point, "T", fr ? "Allocation proposée" : "Test allocation", ink);
    if (together) marks[0].kind = "both";

    if (market) {
      if (same(demand.a, demand.bInBox)) {
        if (same(end, demand.a)) {
          marks[0].kind = "clearingEnd";
          marks[0].name = "ω = E";
          marks[0].title = fr ? "Équilibre à la dotation initiale" : "Equilibrium at the initial endowment";
        } else push("clearing", demand.a, "E", fr ? "Équilibre" : "Market equilibrium", ink);
      } else {
        for (const [person, bundle, color] of [["S", demand.a, teal], ["R", demand.bInBox, rust]]) {
          const dx = bundle.x - end.x, dy = bundle.y - end.y;
          let t = 1;
          if (bundle.x < 0) t = Math.min(t, -end.x / dx);
          if (bundle.x > e.totalX) t = Math.min(t, (e.totalX - end.x) / dx);
          if (bundle.y < 0) t = Math.min(t, -end.y / dy);
          if (bundle.y > e.totalY) t = Math.min(t, (e.totalY - end.y) / dy);
          const title = person === "S" ? (fr ? "Demande de Samuel" : "Samuel’s demand") : (fr ? "Demande de Romane" : "Romane’s demand");
          const outside = t < 1 - 1e-8;
          push(person, {x: end.x + t * dx, y: end.y + t * dy}, person, title +
            (outside ? (fr ? " (hors de la boîte)" : " (outside the box)") : ""), color,
            person === "S" ? demand.a : demand.b);
          if (outside) {
            const angle = Math.atan2(-dy * height / e.totalY, dx * width / e.totalX);
            marks[marks.length - 1].angle = angle;
          }
        }
      }
    }

    const occupied = marks.map(m => [m.x - 10, m.y - 10, m.x + 10, m.y + 10]);
    for (const m of marks) {
      const bundleText = (m.kind === "R" ? "Romane " : "Samuel ") + pair(m.bundle);
      chunks.push('<g transform="translate(' + round(m.x) + ' ' + round(m.y) + ')"><title>' + m.title + ' · ' + bundleText + '</title>');
      const circle = (r, fill, stroke, sw) => '<circle r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '"/>';
      const diamond = '<path d="M0 -5.9L5.9 0L0 5.9L-5.9 0Z" fill="' + ink + '" stroke="' + paper + '" stroke-width="1.5"/>';
      if (m.kind === "end") chunks.push(diamond);
      if (m.kind === "test" || m.kind === "both") {
        chunks.push(circle(11, "none", "#54786a", 0.85), circle(7.6, paper, ink, 2.2));
        chunks.push(m.kind === "both" ? diamond : circle(3.7, ink, ink, 0));
      }
      if (m.kind === "clearing" || m.kind === "clearingEnd") {
        chunks.push('<rect x="-7" y="-7" width="14" height="14" rx="1" fill="' + paper + '" stroke="' + rust + '" stroke-width="2"/>',
          circle(4.3, teal, paper, 0.8));
      }
      if (m.angle !== undefined) {
        chunks.push('<path transform="rotate(' + round(m.angle * 180 / Math.PI) +
          ')" d="M2 0L-9 -5L-7 0L-9 5Z" fill="' + m.color + '" stroke="' + paper + '" stroke-width="1.2"/>');
      } else if (m.kind === "S") chunks.push(circle(5.4, teal, paper, 1.7));
      else if (m.kind === "R") chunks.push('<rect x="-5" y="-5" width="10" height="10" fill="' + rust + '" stroke="' + paper + '" stroke-width="1.5"/>');
      chunks.push('</g>');
    }
    for (const m of marks) {
      const coords = w >= 535 && m.kind !== "R" && m.kind !== "S" ? pair(m.bundle) : "";
      const symbolWidth = m.name.length === 1 ? 14 : 41;
      const labelWidth = coords ? 10 + symbolWidth + 6.7 * coords.length : symbolWidth;
      const labelHeight = coords ? 22 : 17;
      const leftOffset = -labelWidth - 11;
      const above = -labelHeight - 7;
      const spots = [[11,above], [leftOffset,above], [11,8], [leftOffset,8],
        [16,-labelHeight / 2], [-labelWidth-16,-labelHeight / 2],
        [11,above-labelHeight-5], [leftOffset,above-labelHeight-5],
        [11,labelHeight+13], [leftOffset,labelHeight+13]];
      const candidates = spots.map(([dx,dy]) => {
        const x = clamp(m.x + dx, left + 3, right - labelWidth - 3);
        const y = clamp(m.y + dy, top + 3, bottom - labelHeight - 3);
        const score = occupied.reduce((s, [x1,y1,x2,y2]) => s +
          Math.max(0, Math.min(x2,x+labelWidth+2) - Math.max(x1,x-2)) *
          Math.max(0, Math.min(y2,y+labelHeight+2) - Math.max(y1,y-2)), 0);
        return {x, y, score};
      });
      const label = candidates.reduce((best, c) => c.score < best.score ? c : best);
      occupied.push([label.x, label.y, label.x + labelWidth, label.y + labelHeight]);
      if (coords) {
        chunks.push('<rect x="' + round(label.x) + '" y="' + round(label.y) + '" width="' + round(labelWidth) +
          '" height="' + labelHeight + '" rx="4" fill="' + paper + '" fill-opacity=".96" stroke="#bfcbc1" stroke-width=".8"/>',
          textAt(label.x + 5 + symbolWidth / 2, label.y + 15, m.name,
            'text-anchor="middle" font-family="Georgia, serif" font-size="15" font-style="italic" fill="' + m.color + '"'),
          textAt(label.x + 5 + symbolWidth, label.y + 15, coords,
            'font-family="IBM Plex Mono, Consolas, monospace" font-size="11" fill="' + m.color + '"'));
      } else chunks.push(textAt(label.x + labelWidth / 2, label.y + 13, m.name,
        'text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="16" fill="' + m.color +
        '" stroke="' + paper + '" stroke-width="4" stroke-linejoin="round" paint-order="stroke"'));
    }
    svg.innerHTML = chunks.join("");
  }

  function connect(svg) {
    const instance = { id: "exchange-chart-" + (++nextId), pointer: null };
    charts.set(svg, instance);
    function place(x, y) {
      const { economy, stage, followCurve } = instance.state;
      const p = window.EdgeworthModel.clampPoint(economy, { x: round(x), y: round(y) });
      if (stage === "efficiency" && followCurve) p.y = window.EdgeworthModel.contractY(economy, p.x);
      instance.onMove(p);
    }
    function move(event, start) {
      const { economy, stage } = instance.state;
      if (stage === "prices") return;
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      const position = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      const { left, right, top, bottom } = instance.size;
      if (start && (position.x < left - 3 || position.x > right + 3 || position.y < top - 3 || position.y > bottom + 3)) return;
      if (start) {
        svg.setPointerCapture(event.pointerId);
        instance.pointer = event.pointerId;
        svg.focus({preventScroll: true});
      }
      const x = clamp((position.x - left) / (right - left), 0, 1) * economy.totalX;
      const y = clamp((bottom - position.y) / (bottom - top), 0, 1) * economy.totalY;
      place(x, y);
    }
    svg.addEventListener("pointerdown", e => {
      if (e.button === 0 && instance.pointer === null) move(e, true);
    });
    svg.addEventListener("pointermove", e => { if (e.pointerId === instance.pointer) move(e, false); });
    svg.addEventListener("lostpointercapture", () => { instance.pointer = null; });
    svg.addEventListener("keydown", event => {
      const { point, stage, followCurve } = instance.state;
      if (stage === "prices") return;
      const direction = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,1], ArrowDown: [0,-1] }[event.key];
      if (!direction) return;
      event.preventDefault();
      const step = event.shiftKey ? 5 : 1;
      const dx = stage === "efficiency" && followCurve ? direction[0] + direction[1] : direction[0];
      place(point.x + step * dx, point.y + step * direction[1]);
    });
    if (typeof ResizeObserver !== "undefined") {
      instance.resize = new ResizeObserver(() => {
        if (!instance.state) return;
        const size = graphSize(svg);
        if (size.w !== instance.size.w || size.h !== instance.size.h) draw(svg, instance);
      });
      instance.resize.observe(svg);
    }
    return instance;
  }

  window.ExchangeChart = {
    render(svg, state, onMove) {
      const instance = charts.get(svg) || connect(svg);
      instance.state = state;
      instance.onMove = onMove;
      draw(svg, instance);
    }
  };
})();
