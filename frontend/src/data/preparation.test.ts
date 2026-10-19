import { describe, expect, it } from "vitest";

import {
  createDemoPreparationPlan,
  initialPreparationProfile,
} from "./preparation";

describe("myeloma consultation checklist", () => {
  it("includes eight organizational steps without medication or fasting schedules", () => {
    const phases = createDemoPreparationPlan(initialPreparationProfile);
    expect(phases).toHaveLength(3);
    const steps = phases.flatMap((phase) => phase.steps);
    expect(steps).toHaveLength(8);
    expect(steps.filter((step) => step.scheduledAt)).toEqual([
      expect.objectContaining({
        id: "arrival",
        scheduledAt: new Date(
          initialPreparationProfile.scheduledAt,
        ).toISOString(),
      }),
    ]);
    expect(JSON.stringify(phases)).not.toMatch(/projímad|lačnost|dávku/i);
  });

  it("uses calendar dates across month boundaries", () => {
    const phases = createDemoPreparationPlan({
      ...initialPreparationProfile,
      scheduledAt: "2024-06-01T02:15",
    });
    const first = phases[0];
    if (!first) throw new Error("Missing first phase");
    expect(new Date(first.date).getMonth()).toBe(4);
    expect(new Date(first.date).getDate()).toBe(29);
  });

  it.each(["treatment-visit", "follow-up"])(
    "does not invent a clinical plan for %s",
    (procedureId) => {
      expect(
        createDemoPreparationPlan({
          ...initialPreparationProfile,
          procedureId,
        }),
      ).toEqual([]);
    },
  );

  it("rejects invalid dates and unknown visit types explicitly", () => {
    expect(() =>
      createDemoPreparationPlan({
        ...initialPreparationProfile,
        scheduledAt: "",
      }),
    ).toThrow("Datum a čas návštěvy nejsou platné.");
    expect(() =>
      createDemoPreparationPlan({
        ...initialPreparationProfile,
        procedureId: "unknown",
      }),
    ).toThrow("Neznámý typ návštěvy.");
  });
});
