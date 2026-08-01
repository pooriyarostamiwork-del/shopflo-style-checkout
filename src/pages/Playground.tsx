import { useEffect } from "react";
import { PlaygroundShell } from "@/features/playground/PlaygroundShell";

const Playground = () => {
  useEffect(() => {
    document.title = "آزمایشگاه کامپوننت | Playground";
  }, []);
  return <PlaygroundShell />;
};

export default Playground;
