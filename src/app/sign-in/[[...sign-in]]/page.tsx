import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { ChefHat } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4 py-12">
      <SignIn />

      <Link
        href="/demo"
        className="group w-full max-w-[400px] rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 transition-colors group-hover:bg-zinc-200">
            <ChefHat size={20} className="text-zinc-700" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">Browse my recipes</p>
            <p className="text-xs text-zinc-500">View-only · no account needed</p>
          </div>
          <span className="ml-auto text-zinc-400 transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </div>
      </Link>
    </div>
  );
}
