import { Anchor, Box, Button, TypographyStylesProvider } from "@mantine/core";
import { IconFileText } from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownAnswer({
  children,
  resolveLink,
}: {
  children: string;
  resolveLink?: (
    href: string,
  ) => { href: string; onOpen: () => void } | undefined;
}) {
  return (
    <TypographyStylesProvider
      p={0}
      miw={0}
      style={{ overflowWrap: "anywhere" }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        disallowedElements={["img"]}
        components={{
          a: ({ href, children, title }) => {
            const internal = href ? resolveLink?.(href) : undefined;
            if (internal) {
              return (
                <Button
                  component="a"
                  href={internal.href}
                  title={title}
                  variant="default"
                  h="auto"
                  mih={40}
                  py="xs"
                  my={4}
                  maw="100%"
                  leftSection={<IconFileText aria-hidden="true" size={18} />}
                  styles={{
                    root: {
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    inner: {
                      height: "auto",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    label: {
                      height: "auto",
                      whiteSpace: "normal",
                      overflowWrap: "anywhere",
                      textAlign: "center",
                    },
                  }}
                  onClick={(event) => {
                    if (
                      event.button === 0 &&
                      !event.ctrlKey &&
                      !event.metaKey &&
                      !event.shiftKey &&
                      !event.altKey
                    ) {
                      event.preventDefault();
                      internal.onOpen();
                    }
                  }}
                >
                  {children}
                </Button>
              );
            }
            return href ? (
              <Anchor
                href={href}
                title={title}
                target="_blank"
                rel="noopener noreferrer"
                underline="always"
              >
                {children}
              </Anchor>
            ) : (
              <span>{children}</span>
            );
          },
          table: ({ children }) => (
            <Box style={{ overflowX: "auto" }}>
              <table>{children}</table>
            </Box>
          ),
          pre: ({ children }) => (
            <Box
              component="pre"
              p="md"
              bg="gray.0"
              style={{ overflowX: "auto", maxWidth: "100%" }}
            >
              {children}
            </Box>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </TypographyStylesProvider>
  );
}
