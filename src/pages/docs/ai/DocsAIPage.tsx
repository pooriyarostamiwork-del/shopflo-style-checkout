import { useEffect } from "react";
import { DocsLayout } from "./components/DocsLayout";
import { DocsContent } from "./components/DocsContent";
import { docsParts } from "./content";

export default function DocsAIPage() {
  useEffect(() => {
    document.title = "AI Architecture · GPTCommerce Docs";
    // Smooth scroll to hash on initial load
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, []);
  return (
    <DocsLayout parts={docsParts}>
      <DocsContent parts={docsParts} />
    </DocsLayout>
  );
}
