import { Link } from "wouter";
import { Phone } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen premium-shell flex items-center justify-center px-4 text-white">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-amber-400/10 border border-amber-300/20 flex items-center justify-center">
          <Phone className="h-8 w-8 text-amber-400/60" />
        </div>
        <h1 className="text-5xl font-black mb-3 text-white">Oops</h1>
        <p className="text-slate-400 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer">
            ← Back to Home
          </span>
        </Link>
      </div>
    </div>
  );
}
