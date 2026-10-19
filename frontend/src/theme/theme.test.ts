import {
  DEFAULT_THEME,
  defaultVariantColorsResolver,
  mergeMantineTheme,
} from "@mantine/core";
import { describe, expect, it } from "vitest";

import { cssVariablesResolver, theme } from "./theme";

const resolved = mergeMantineTheme(DEFAULT_THEME, theme);

describe("screenshot theme", () => {
  it("uses black primary actions and pale lavender surfaces", () => {
    expect(resolved.primaryColor).toBe("gray");
    expect(resolved.colors.gray[9]).toBe("#000000");
    expect(resolved.colors.gray[0]).toBe("#f4f2fd");
    expect(resolved.defaultRadius).toBe("xs");
    expect(cssVariablesResolver(resolved).light).toMatchObject({
      "--mantine-color-body": "#fbfaff",
      "--mantine-color-text": "#1a1b22",
    });

    function luminance(hex: string): number {
      const channels = [1, 3, 5].map((start) => {
        const value = parseInt(hex.slice(start, start + 2), 16) / 255;
        return value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    }

    function contrast(first: string, second: string): number {
      const values = [luminance(first), luminance(second)].sort(
        (a, b) => b - a,
      );
      return (values[0] + 0.05) / (values[1] + 0.05);
    }

    describe("surface contrast", () => {
      it("keeps boundaries distinguishable against both cards and page backgrounds", () => {
        const body =
          cssVariablesResolver(resolved).light["--mantine-color-body"];
        expect(
          contrast(resolved.colors.gray[4], resolved.white),
        ).toBeGreaterThanOrEqual(3);
        expect(contrast(resolved.colors.gray[4], body)).toBeGreaterThanOrEqual(
          3,
        );
        expect(resolved.components.Card.defaultProps).toMatchObject({
          bg: "white",
          withBorder: true,
          shadow: "xs",
        });
      });

      it("maintains readable message and emergency text", () => {
        expect(
          contrast(resolved.white, resolved.colors.gray[8]),
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(resolved.colors.gray[8], resolved.white),
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(resolved.colors.red[8], resolved.colors.red[1]),
        ).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  it("keeps urgent actions red rather than inheriting the darkest primary shade", () => {
    const colors = resolved.variantColorResolver({
      theme: resolved,
      color: "red",
      variant: "filled",
    });
    expect(colors.background).toBe("#ba1a1a");
    expect(colors.color).toBe("#ffffff");
    expect(
      resolved.variantColorResolver({
        theme: resolved,
        color: "red",
        variant: "light",
      }).background,
    ).toBe("#ffdad6");
  });

  it("retains Mantine's variant resolution for neutral buttons", () => {
    expect(
      resolved.variantColorResolver({
        theme: resolved,
        color: "gray",
        variant: "filled",
      }).background,
    ).toBe(
      defaultVariantColorsResolver({
        theme: resolved,
        color: "gray",
        variant: "filled",
      }).background,
    );
  });
});
