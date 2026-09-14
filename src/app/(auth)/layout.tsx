import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Brand } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-4 py-6 sm:px-6">
        <Link href="/"><Brand /></Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        {children}
      </main>
      <footer className="px-4 py-6 text-center sm:px-6">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-soft">
          Dakar, Sénégal
        </p>
      </footer>
    </div>
  );
}
