import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import type { Part } from "../content/types";
import { DocsSidebar } from "./DocsSidebar";

export function DocsLayout({
  parts,
  children,
  chatbot,
}: {
  parts: Part[];
  children: React.ReactNode;
  chatbot?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div id="top" dir="ltr" className="min-h-screen bg-[#0b1120] text-slate-200 font-sans">
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-slate-800 bg-[#0b1120]/95 backdrop-blur">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-2 -ml-2 text-slate-300 hover:text-indigo-300">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 bg-[#0b1120] border-slate-800">
            <DocsSidebar parts={parts} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold text-slate-100">AI Docs</span>
        <div className="w-7" />
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-72 lg:w-80 shrink-0 sticky top-0 h-screen border-r border-slate-800 bg-[#0a0f1c]">
          <DocsSidebar parts={parts} />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-5 md:px-10 py-10">
            {children}
            <footer className="mt-20 pt-8 border-t border-slate-800 text-xs text-slate-500">
              GPTCommerce — Internal AI Architecture Reference. Generated from the live codebase.
            </footer>
          </div>
        </main>
      </div>
      {chatbot}
    </div>
  );
}
