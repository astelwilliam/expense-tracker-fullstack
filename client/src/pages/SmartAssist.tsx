import { Sparkles } from "lucide-react";
import MainLayout from "../layouts/MainLayout";

export default function SmartAssist() {
  return (
    <MainLayout>
      <div className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center text-white">
        <section className="fin-card w-full rounded-3xl p-7 text-center sm:p-10" aria-labelledby="smart-assist-title">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-200" aria-hidden="true">
            <Sparkles size={28} />
          </span>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[.18em] text-emerald-300">Coming Soon</p>
          <h1 id="smart-assist-title" className="mt-2 text-3xl font-bold md:text-4xl">Smart Assist — Coming Soon</h1>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">Your AI-powered financial assistant is on the way. We&apos;re preparing smarter insights to help you manage your finances.</p>
        </section>
      </div>
    </MainLayout>
  );
}
