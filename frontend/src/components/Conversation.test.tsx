import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChatMessage } from "../types/chat";
import type { ConversationProps } from "./Conversation";

import { Conversation } from "./Conversation";

const scrollIntoView = vi.fn();
const originalScroll = Object.getOwnPropertyDescriptor(
  Element.prototype,
  "scrollIntoView",
);
const createdAt = "2026-10-16T10:00:00.000Z";
const question: ChatMessage = {
  id: "question",
  createdAt,
  sender: "user",
  text: "Question",
};
const answer: ChatMessage = {
  id: "answer",
  createdAt,
  sender: "assistant",
  kind: "answer",
  text: "Answer",
  citations: [],
};

beforeEach(() => {
  scrollIntoView.mockReset();
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });
  vi.spyOn(Element.prototype, "getClientRects").mockImplementation(() => {
    const rect = new DOMRect();
    return Object.assign([rect], { item: () => rect });
  });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalScroll)
    Object.defineProperty(Element.prototype, "scrollIntoView", originalScroll);
  else Reflect.deleteProperty(Element.prototype, "scrollIntoView");
});

function conversation(props: Partial<ConversationProps> = {}) {
  return (
    <MantineProvider env="test">
      <Conversation
        messages={[]}
        pending={false}
        contacts={{}}
        emergencyContactId="emergency"
        onFeedback={vi.fn()}
        {...props}
      />
    </MantineProvider>
  );
}

describe("conversation scrolling", () => {
  it("does not scroll when initially loading or browsing existing history", () => {
    const { rerender } = render(conversation({ messages: [question, answer] }));
    rerender(conversation({ messages: [question, answer], pending: true }));
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("scrolls to the loading indicator bottom, then the first new answer top exactly once", () => {
    const messagesBeforeSend = new Set<string>();
    const { rerender } = render(conversation({ messagesBeforeSend }));
    rerender(
      conversation({
        messagesBeforeSend,
        messages: [question],
        pending: true,
        composerHeight: 80,
      }),
    );
    expect(scrollIntoView).toHaveBeenLastCalledWith({
      block: "end",
      behavior: "smooth",
    });
    expect(scrollIntoView.mock.instances.at(-1)).toBe(
      screen.getByRole("status"),
    );
    expect(screen.getByRole("status").style.scrollMarginBottom).toContain(
      "80px",
    );

    const secondAnswer: ChatMessage = {
      ...answer,
      id: "second-answer",
      text: "More details",
    };
    rerender(
      conversation({
        messagesBeforeSend,
        messages: [question, answer, secondAnswer],
      }),
    );
    expect(scrollIntoView).toHaveBeenLastCalledWith({
      block: "start",
      behavior: "smooth",
    });
    expect(scrollIntoView.mock.instances.at(-1)).toBe(
      screen.getByText("Answer").closest("[style*='scroll-margin-top']"),
    );
    const callCount = scrollIntoView.mock.calls.length;
    rerender(
      conversation({
        messagesBeforeSend,
        messages: [question, answer, secondAnswer],
      }),
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(callCount);
  });

  it("does not scroll to an old answer while waiting for the optimistic question", () => {
    render(
      conversation({
        messagesBeforeSend: new Set([question.id, answer.id]),
        messages: [question, answer],
        pending: true,
      }),
    );
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("does not move the page while chat is hidden behind another view", () => {
    vi.spyOn(Element.prototype, "getClientRects").mockReturnValue(
      Object.assign([], { item: () => null }),
    );
    render(
      conversation({
        messagesBeforeSend: new Set(),
        messages: [question],
        pending: true,
      }),
    );
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
