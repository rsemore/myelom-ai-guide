import {
  createTheme,
  type CSSVariablesResolver,
  defaultVariantColorsResolver,
} from "@mantine/core";

export const theme = createTheme({
  primaryColor: "gray",
  primaryShade: 9,
  variantColorResolver: (input) => {
    if (input.color === "red" && input.variant === "filled") {
      return {
        background: "#ba1a1a",
        hover: "#93000a",
        color: "#ffffff",
        border: "1px solid #93000a",
      };
    }
    if (input.color === "red" && input.variant === "light") {
      return {
        background: "#ffdad6",
        hover: "#ffb4ab",
        color: "#93000a",
        border: "1px solid #ba1a1a",
      };
    }
    return defaultVariantColorsResolver(input);
  },
  black: "#000000",
  white: "#ffffff",
  colors: {
    gray: [
      "#f4f2fd",
      "#eeedf7",
      "#e8e7f1",
      "#e3e1ec",
      "#858091",
      "#77767b",
      "#5e5e67",
      "#47464b",
      "#1a1b22",
      "#000000",
    ],
    red: [
      "#fff1f0",
      "#ffdad6",
      "#ffb4ab",
      "#ff897e",
      "#ef6358",
      "#d93830",
      "#ba1a1a",
      "#a61010",
      "#93000a",
      "#410002",
    ],
  },
  defaultRadius: "xs",
  radius: { xs: "2px", sm: "4px", md: "6px", lg: "8px", xl: "12px" },
  fontFamily:
    '"Public Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSizes: { xs: "12px", sm: "14px", md: "16px", lg: "18px", xl: "24px" },
  lineHeights: { xs: "1.4", sm: "1.5", md: "1.6", lg: "1.55", xl: "1.3" },
  headings: {
    fontWeight: "700",
    sizes: {
      h1: { fontSize: "28px", lineHeight: "1.3" },
      h2: { fontSize: "22px", lineHeight: "1.35" },
      h3: { fontSize: "18px", lineHeight: "1.4" },
    },
  },
  components: {
    Card: {
      defaultProps: {
        bg: "white",
        padding: "md",
        radius: "sm",
        withBorder: true,
      },
      styles: { root: { borderColor: "var(--mantine-color-gray-3)" } },
    },
    Button: {
      defaultProps: { size: "md", fw: 600 },
      styles: { root: { whiteSpace: "normal" } },
    },
    Badge: {
      defaultProps: { radius: "xs", tt: "none", fw: 500 },
      styles: {
        root: { height: "auto", minHeight: 24, whiteSpace: "normal" },
        label: { whiteSpace: "normal" },
      },
    },
    Alert: { defaultProps: { radius: "xs", variant: "light" } },
    Avatar: {
      defaultProps: { color: "gray", variant: "filled", radius: "md" },
    },
    Input: {
      styles: {
        input: { backgroundColor: "#ffffff" },
      },
    },
    InputWrapper: { styles: { label: { marginBottom: 6, fontWeight: 500 } } },
    SegmentedControl: {
      defaultProps: { radius: "xs" },
      styles: {
        root: { backgroundColor: "#eeedf7" },
        indicator: { boxShadow: "0 0 0 1px var(--mantine-color-gray-5)" },
      },
    },
    Tabs: {
      styles: {
        list: { backgroundColor: "#eeedf7", padding: 4, gap: 4 },
        tab: { minHeight: 44, fontWeight: 600 },
      },
    },
    Blockquote: {
      defaultProps: { color: "gray", bg: "gray.1" },
      styles: {
        root: { borderInlineStart: "4px solid var(--mantine-color-gray-6)" },
        cite: { fontWeight: 600 },
      },
    },
    Table: {
      defaultProps: { verticalSpacing: "md", horizontalSpacing: "sm" },
      styles: {
        thead: { backgroundColor: "#eeedf7" },
        th: { fontWeight: 700 },
        td: { verticalAlign: "top" },
      },
    },
    NavLink: {
      styles: { root: { minHeight: 48 }, label: { whiteSpace: "normal" } },
    },
    AppShell: {
      styles: {
        header: { backgroundColor: "#ffffff", borderColor: "#e3e1ec" },
        footer: { backgroundColor: "#ffffff", borderColor: "#e3e1ec" },
        navbar: { backgroundColor: "#ffffff", borderColor: "#e3e1ec" },
      },
    },
  },
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    "--mantine-color-body": "#fbfaff",
    "--mantine-color-text": "#1a1b22",
    "--mantine-color-dimmed": "#5e5e67",
    "--mantine-color-default": "#ffffff",
    "--mantine-color-default-hover": "#eeedf7",
    "--mantine-color-default-border": "#e3e1ec",
  },
  dark: {},
});
