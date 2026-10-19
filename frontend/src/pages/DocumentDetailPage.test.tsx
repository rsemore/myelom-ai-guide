import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Citation } from "../types/chat";

import { demoDocument } from "../data/documents";
import {
  DocumentDetailPage,
  type DocumentDetailPageProps,
} from "./DocumentDetailPage";

const citation: Citation = {
  documentId: demoDocument.id,
  title: demoDocument.title,
  version: demoDocument.version,
  page: 4,
  quote: "Na konzultaci si připravte",
};

function renderPage(overrides: Partial<DocumentDetailPageProps> = {}) {
  const props: DocumentDetailPageProps = {
    document: demoDocument,
    citation,
    contacts: {
      clinic: { id: "clinic", label: "Ambulance", phone: "+420 555 010 020" },
    },
    supportContactId: "clinic",
    onBack: vi.fn(),
    ...overrides,
  };
  render(
    <MantineProvider env="test">
      <DocumentDetailPage {...props} />
    </MantineProvider>,
  );
  return props;
}

describe("document detail", () => {
  it("renders sample metadata, the cited passage and configured support contact", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: demoDocument.title }),
    ).toBeDefined();
    expect(screen.getByText(/DEMO-MM-01/)).toBeDefined();
    expect(screen.getByText(/Garant: Není přiřazen/)).toBeDefined();
    expect(screen.getByText("Citováno asistentem v odpovědi")).toBeDefined();
    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "tel:+420555010020",
    );
    expect(screen.getByText(/Nejde o ověřený nemocniční/)).toBeDefined();
  });

  it("does not invent unavailable pages or a PDF download", () => {
    renderPage();
    for (const name of ["Předchozí strana", "Další strana", "Stáhnout PDF"]) {
      expect(
        screen.getByRole("button", { name }).hasAttribute("disabled"),
      ).toBe(true);
    }
    expect(screen.getByText("PDF není připojeno")).toBeDefined();
    expect(screen.getByText(/Ostatní strany nejsou připojeny/)).toBeDefined();
  });

  it("searches case-insensitively, highlights matches and reports no results", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MantineProvider env="test">
        <DocumentDetailPage
          document={demoDocument}
          citation={citation}
          contacts={{}}
          supportContactId="clinic"
          onBack={vi.fn()}
        />
      </MantineProvider>,
    );
    const input = screen.getByRole("searchbox", {
      name: "Hledat na zobrazené straně",
    });
    await user.type(input, "SEZNAM");
    expect(screen.getByRole("status").textContent).toBe("Počet shod: 1");
    expect(container.querySelector("mark")?.textContent).toBe("seznam");
    await user.clear(input);
    await user.type(input, "nenalezeno");
    expect(screen.getByRole("status").textContent).toBe("Počet shod: 0");
    await user.clear(input);
    expect(screen.queryByRole("status")).toBeNull();
    expect(container.querySelector("mark")).toBeNull();
  });

  it("delegates both return actions", async () => {
    const user = userEvent.setup();
    const props = renderPage();
    await user.click(
      screen.getByRole("button", { name: "Zpět na konverzaci" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Zpět do chatu s dotazem" }),
    );
    expect(props.onBack).toHaveBeenCalledTimes(2);
  });

  it("navigates supplied adjacent pages and offers a real configured PDF link", async () => {
    const user = userEvent.setup();
    const page = demoDocument.pages[0];
    if (!page) throw new Error("Demo page is missing");
    renderPage({
      document: {
        ...demoDocument,
        pages: [
          { ...page, number: 3, title: "Předchozí kapitola" },
          page,
          { ...page, number: 5, title: "Další kapitola" },
        ],
        pdf: { url: "/documents/protocol.pdf", sizeLabel: "1.2 MB" },
      },
    });
    await user.click(screen.getByRole("button", { name: "Předchozí strana" }));
    expect(screen.getByText("Strana 3 z 8")).toBeDefined();
    expect(
      screen
        .getByRole("button", { name: "Předchozí strana" })
        .hasAttribute("disabled"),
    ).toBe(true);
    await user.click(screen.getByRole("button", { name: "Další strana" }));
    await user.click(screen.getByRole("button", { name: "Další strana" }));
    expect(screen.getByText("Strana 5 z 8")).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: "Stáhnout PDF (1.2 MB)" })
        .getAttribute("href"),
    ).toBe("/documents/protocol.pdf");
  });

  it("explicitly reports an unavailable cited page", () => {
    renderPage({ citation: { ...citation, page: 2 } });
    expect(
      screen.getByRole("alert", { name: "Strana není dostupná" }).textContent,
    ).toContain("Strana není dostupná");
    expect(screen.queryByRole("article")).toBeNull();
  });

  it("does not label a mismatched document version as the cited source", () => {
    renderPage({ citation: { ...citation, version: "0.1" } });
    expect(screen.getByText("Citace neodpovídá dokumentu")).toBeDefined();
    expect(screen.queryByText("Citováno asistentem v odpovědi")).toBeNull();
  });
});
