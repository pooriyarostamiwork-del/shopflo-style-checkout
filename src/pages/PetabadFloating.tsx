import { FloatingAgentShell } from "@/features/petabad/floating/FloatingAgentShell";
import petabadLogoFull from "@/assets/petabad-logo-full.svg";
import slide1 from "@/assets/petabad-slide-1.jpg";
import slide2 from "@/assets/petabad-slide-2.jpg";

/** Host-site backdrop: shows the assistant as it would appear embedded in a store. */
const PetabadFloating = () => (
  <div dir="rtl" lang="fa" className="min-h-screen bg-[#FAFAFA]">
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <img src={petabadLogoFull} alt="پت آباد" className="h-9" />
        <nav className="hidden gap-6 text-sm text-neutral-600 md:flex">
          <span>سگ</span><span>گربه</span><span>پرندگان</span><span>آبزیان</span><span>جوندگان</span>
        </nav>
      </div>
    </header>

    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-xl font-bold text-neutral-900">فروشگاه پت آباد</h1>
      <p className="mt-1 text-sm text-neutral-500">
        دستیار خرید هوشمند پایین صفحه در دسترسه؛ بگو دنبال چی هستی.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <img src={slide1} alt="پیشنهاد ویژه پت آباد" className="h-56 w-full rounded-2xl object-cover" />
        <img src={slide2} alt="محصولات پرفروش پت آباد" className="h-56 w-full rounded-2xl object-cover" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["غذای خشک", "کنسرو و پوچ", "اسباب‌بازی", "بهداشت و مراقبت"].map((c) => (
          <div key={c} className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-700">
            {c}
          </div>
        ))}
      </div>
    </main>

    <FloatingAgentShell />
  </div>
);

export default PetabadFloating;
