import { useEffect } from "react";
import { MobilePlaygroundShell } from "@/features/playground/MobilePlaygroundShell";

const PlaygroundMobile = () => {
  useEffect(() => {
    document.title = "آزمایشگاه کامپوننت (موبایل) | Playground";
  }, []);
  return <MobilePlaygroundShell />;
};

export default PlaygroundMobile;
