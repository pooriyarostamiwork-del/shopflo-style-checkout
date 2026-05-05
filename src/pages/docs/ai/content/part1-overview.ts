import type { Part } from "./types";

export const part1Overview: Part = {
  id: "part-1",
  number: "I",
  title: "Overview & System Architecture",
  intro: "How the GPTCommerce AI stack is composed, and how a single Persian message travels from the chat input to the database and back.",
  sections: [
    {
      id: "p1-tldr",
      title: "TL;DR",
      blocks: [
        {
          kind: "prose",
          html: `<p>This document is a complete, line-grounded reference of every AI and agentic surface in <code>/gptcommerce</code> and <code>/m/gptcommerce</code>. The full content lands in subsequent sections; this Part I establishes the architectural baseline.</p>`,
        },
      ],
    },
  ],
};
