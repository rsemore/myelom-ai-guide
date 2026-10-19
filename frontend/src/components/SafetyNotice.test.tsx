import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SafetyNotice } from "./SafetyNotice";

describe("SafetyNotice", () => {
  it("renders configured emergency numbers as bold text without call buttons", () => {
    render(
      <MantineProvider env="test">
        <SafetyNotice
          contacts={{
            medical: { id: "medical", label: "Medical", phone: "155" },
            emergency: { id: "emergency", label: "Emergency", phone: "112" },
          }}
          emergencyContactIds={["medical", "emergency"]}
        />
      </MantineProvider>,
    );
    expect(screen.getByText(/V akutním ohrožení volejte/).textContent).toBe(
      "V akutním ohrožení volejte 155 nebo 112.",
    );
    expect(screen.getByText("155").tagName).toBe("STRONG");
    expect(screen.getByText("112").tagName).toBe("STRONG");
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("explicitly reports missing configuration", () => {
    render(
      <MantineProvider env="test">
        <SafetyNotice contacts={{}} emergencyContactIds={["missing"]} />
      </MantineProvider>,
    );
    expect(screen.getByText(/telefonní číslo není k dispozici/)).toBeDefined();
    expect(screen.queryByText(/V akutním ohrožení volejte/)).toBeNull();
  });
});
