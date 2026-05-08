import { describe, it, expect } from "vitest";
import { sumMacros } from "./index";

// Fixtures mirror useDietStore.logFood / logRecipe output: `entry.macros`
// is already pre-multiplied by `entry.servings` at write time. The Cloud
// Function MUST sum macros directly without re-multiplying — see C-2 in
// docs/AUDIT_2026-05-08.md.

describe("sumMacros", () => {
  it("returns zeros for an empty log", () => {
    expect(sumMacros([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it("sums a single 1-serving entry", () => {
    const entry = {
      servings: 1,
      macros: { calories: 200, protein: 20, carbs: 25, fat: 5 },
    };
    expect(sumMacros([entry])).toEqual({ calories: 200, protein: 20, carbs: 25, fat: 5 });
  });

  it("sums a multi-serving entry without re-multiplying (regression: C-2 double-count)", () => {
    // logFood writes macros = food.macros * servings, so a 3-serving food at
    // 200 cal/serving lands as { servings: 3, macros: { calories: 600, ... } }.
    // The expected sum is 600, not 1800.
    const entry = {
      servings: 3,
      macros: { calories: 600, protein: 60, carbs: 75, fat: 15 },
    };
    expect(sumMacros([entry])).toEqual({ calories: 600, protein: 60, carbs: 75, fat: 15 });
  });

  it("sums multiple entries with mixed servings", () => {
    const entries = [
      { servings: 1, macros: { calories: 200, protein: 20, carbs: 25, fat: 5 } },
      { servings: 2, macros: { calories: 400, protein: 40, carbs: 50, fat: 10 } },
      { servings: 0.5, macros: { calories: 100, protein: 10, carbs: 12, fat: 3 } },
    ];
    expect(sumMacros(entries)).toEqual({ calories: 700, protein: 70, carbs: 87, fat: 18 });
  });

  it("skips entries with no macros field", () => {
    const entries = [
      { servings: 1, macros: { calories: 200, protein: 20, carbs: 25, fat: 5 } },
      { servings: 1 }, // no macros
      { servings: 1, macros: undefined },
    ];
    expect(sumMacros(entries)).toEqual({ calories: 200, protein: 20, carbs: 25, fat: 5 });
  });

  it("treats missing individual macro fields as 0", () => {
    const entry = { servings: 1, macros: { calories: 200 } };
    expect(sumMacros([entry])).toEqual({ calories: 200, protein: 0, carbs: 0, fat: 0 });
  });

  it("ignores servings entirely (the bug was multiplying by it)", () => {
    // Same macros, different servings values must produce identical totals.
    const a = { servings: 1, macros: { calories: 500, protein: 30, carbs: 60, fat: 10 } };
    const b = { servings: 5, macros: { calories: 500, protein: 30, carbs: 60, fat: 10 } };
    expect(sumMacros([a])).toEqual(sumMacros([b]));
  });

  it("survives corrupted entries (null, undefined, wrong shape)", () => {
    const entries = [
      null,
      undefined,
      "not an object",
      { servings: 1, macros: { calories: 100, protein: 10, carbs: 12, fat: 3 } },
    ];
    expect(sumMacros(entries)).toEqual({ calories: 100, protein: 10, carbs: 12, fat: 3 });
  });
});
