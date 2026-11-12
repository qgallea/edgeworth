/* Two consumers, positive supplies of two goods, and Cobb–Douglas weights in (0, 1).
   Box coordinates always describe consumer A's bundle. Prices are in units of Y. */
(function () {
  "use strict";

  function clampPoint(economy, point) {
    return {
      x: Math.max(0, Math.min(economy.totalX, point.x)),
      y: Math.max(0, Math.min(economy.totalY, point.y))
    };
  }

  function complement(economy, point) {
    return { x: economy.totalX - point.x, y: economy.totalY - point.y };
  }

  function bundles(economy, point) {
    return { a: { x: point.x, y: point.y }, b: complement(economy, point) };
  }

  function utility(bundle, alpha) {
    return bundle.x ** alpha * bundle.y ** (1 - alpha);
  }

  function utilities(economy, point) {
    const { a, b } = bundles(economy, point);
    return { a: utility(a, economy.alphaA), b: utility(b, economy.alphaB) };
  }

  function utilityChange(value, reference) {
    const tolerance = 1e-10 * Math.max(value, reference);
    if (Math.abs(value - reference) <= tolerance) return 0;
    return Math.sign(value - reference);
  }

  function compare(economy, point, baseline = economy.endowment) {
    const current = utilities(economy, point);
    const initial = utilities(economy, baseline);
    const a = utilityChange(current.a, initial.a);
    const b = utilityChange(current.b, initial.b);
    const individuallyRational = a >= 0 && b >= 0;
    return {
      a, b, individuallyRational,
      bothGain: a > 0 && b > 0,
      paretoImprovement: individuallyRational && (a > 0 || b > 0)
    };
  }

  function marginalRate(bundle, alpha) {
    if (bundle.x === 0 && bundle.y === 0) return null;
    return (alpha / (1 - alpha)) * (bundle.y / bundle.x);
  }

  function mrs(economy, point) {
    const { a, b } = bundles(economy, point);
    return { a: marginalRate(a, economy.alphaA), b: marginalRate(b, economy.alphaB) };
  }

  function contractY(economy, x) {
    // Solve MRS_A = MRS_B for y_A. Both origins belong to the curve.
    const left = economy.alphaB * (1 - economy.alphaA) * x;
    const right = economy.alphaA * (1 - economy.alphaB) * (economy.totalX - x);
    return economy.totalY * (left / (left + right));
  }

  function isEfficient(economy, point) {
    return Math.abs(point.y - contractY(economy, point.x)) <= 1e-9 * economy.totalY;
  }

  function indifferenceY(economy, point, person, x) {
    // This is the boundary of the weakly preferred set at x. With zero utility,
    // the contour also includes the vertical edge through the person's origin.
    const isB = person === "b";
    const anchor = isB ? complement(economy, point) : point;
    const ownX = isB ? economy.totalX - x : x;
    const alpha = isB ? economy.alphaB : economy.alphaA;
    let ownY = 0;
    if (anchor.x > 0 && anchor.y > 0) {
      ownY = ownX <= 0 ? Infinity : anchor.y * (anchor.x / ownX) ** (alpha / (1 - alpha));
    }
    return isB ? economy.totalY - ownY : ownY;
  }

  function lensSlice(economy, x, baseline = economy.endowment) {
    if (x < 0 || x > economy.totalX) return null;
    const low = Math.max(0, indifferenceY(economy, baseline, "a", x));
    const high = Math.min(economy.totalY, indifferenceY(economy, baseline, "b", x));
    if (low > high + 1e-10 * economy.totalY) return null;
    if (low > high) {
      const y = clampPoint(economy, { x, y: (low + high) / 2 }).y;
      return { low: y, high: y };
    }
    return { low, high };
  }

  function demand(endowment, alpha, price) {
    const income = price * endowment.x + endowment.y;
    return { x: alpha * income / price, y: (1 - alpha) * income };
  }

  function demands(economy, price) {
    if (!Number.isFinite(price) || price <= 0) {
      throw new RangeError("The price of X in units of Y must be finite and positive.");
    }
    const initial = bundles(economy, economy.endowment);
    const a = demand(initial.a, economy.alphaA, price);
    const b = demand(initial.b, economy.alphaB, price);
    return {
      a, b, bInBox: complement(economy, b),
      excess: { x: a.x + b.x - economy.totalX, y: a.y + b.y - economy.totalY }
    };
  }

  function equilibrium(economy) {
    const { a, b } = bundles(economy, economy.endowment);
    // Set the sum of individual X demands equal to the available supply of X.
    const numerator = economy.alphaA * a.y + economy.alphaB * b.y;
    const denominator = (1 - economy.alphaA) * a.x + (1 - economy.alphaB) * b.x;
    const price = numerator / denominator;
    const point = clampPoint(economy, demand(a, economy.alphaA, price));
    return { price, point };
  }

  const model = {
    clampPoint, bundles, utilities, compare, mrs, contractY, isEfficient,
    indifferenceY, lensSlice, demands, equilibrium
  };
  if (typeof window !== "undefined") window.EdgeworthModel = model;
  if (typeof module !== "undefined" && module.exports) module.exports = model;
})();
