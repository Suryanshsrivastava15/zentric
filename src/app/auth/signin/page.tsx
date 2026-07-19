"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Brain,
  Target,
  Code2,
  Check,
  Fingerprint,
  UserRound,
} from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [identifier, setIdentifier] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError("Email is required");
      return;
    }
    if (authMode === "signup" && displayName.trim().length < 2) {
      setError("Enter your name so Zentric can personalize your dashboard.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: identifier.includes("@") ? identifier : `${identifier}@zentric.ai`,
      name: authMode === "signup" ? displayName.trim() : identifier.split("@")[0],
      password,
      mode: authMode,
      redirect: false,
    });

    if (result?.ok) {
      router.push("/dashboard");
    } else {
      setError(
        authMode === "signup"
          ? "Unable to create account. This email may already exist, or the details are invalid."
          : "Invalid credentials. Please verify your email and password.",
      );
      setLoading(false);
    }
  };

  const features = [
    { icon: Brain, text: "AI-powered task prioritization" },
    { icon: Code2, text: "DSA & LeetCode progress tracking" },
    { icon: Target, text: "Personalized study recommendations" },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden lg:bg-[#05070F]" style={{ background: "#05070F" }}>
      {/* ── LEFT SIDE: BRANDING & EXPERIENCE ──────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] -left-[10%] w-[700px] h-[700px] rounded-full bg-blue-600/10 blur-[140px]" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px]" />
        </div>

        <div className="absolute inset-0 pointer-events-none opacity-25">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-blue-400/20 animate-pulse"
              style={{
                width: `${2 + (i % 4)}px`,
                height: `${2 + (i % 4)}px`,
                left: `${(i * 17) % 100}%`,
                top: `${(i * 23) % 100}%`,
                animationDuration: `${3 + (i % 5)}s`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 group cursor-pointer transition-transform active:scale-95 w-fit">
            <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] transform group-hover:rotate-[5deg] transition-all duration-500 ring-1 ring-white/10">
              <Zap className="w-6 h-6 text-white fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white tracking-tighter leading-none">ZENTRIC</span>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />
                <span className="text-[9px] text-blue-400 font-black uppercase tracking-[0.3em] bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                  AI Productivity OS
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-xl mb-12">
          <h1 className="text-[68px] font-bold text-white leading-[1.05] mb-8 tracking-[-0.03em]">
            Your AI-powered <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
              productivity engine.
            </span>
          </h1>
          <p className="text-gray-400 text-xl leading-relaxed mb-12 max-w-[480px] font-medium opacity-90">
            Designed for high-achievers who want to stop guessing and start execution—leveraging AI that understands your long-term ambitions.
          </p>
          
          <div className="grid grid-cols-1 gap-6">
            {features.map(({ icon: Icon, text }) => (
              <div 
                key={text} 
                className="flex items-center gap-5 group transition-all"
              >
                <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-blue-500/40 group-hover:bg-blue-500/5 transition-all duration-300 ring-1 ring-transparent group-hover:ring-blue-500/10">
                  <Icon className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-200 text-base font-semibold group-hover:text-white transition-colors">
                    {text}
                  </span>
                  <div className="h-[2px] w-0 bg-blue-500/30 group-hover:w-full transition-all duration-700" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-8 text-[10px] text-gray-700 uppercase tracking-[0.3em] font-black">
          <span className="hover:text-gray-500 cursor-default transition-colors">© 2026 ZENTRICLABS</span>
          <div className="w-1 h-1 rounded-full bg-gray-800" />
          <span className="hover:text-gray-500 cursor-pointer transition-colors">Enterprise Cloud</span>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute inset-0 bg-[#05070F] lg:bg-transparent pointer-events-none" />
        
        <div className="w-full max-w-[440px] relative z-10">
          <div
            className="rounded-[32px] border border-white/5 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
            style={{ 
              background: "linear-gradient(135deg, rgba(15, 18, 28, 0.8) 100%, rgba(8, 10, 15, 0.9) 100%)", 
              backdropFilter: "blur(40px)",
            }}
          >
            <div className="flex flex-col items-center mb-12">
              <div className="mb-8 inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-blue-500/20 bg-blue-500/[0.03] backdrop-blur-xl">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                <span className="text-[10px] font-black text-blue-100 uppercase tracking-[0.25em]">Cloud Authentication</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-3 tracking-tight text-center">
                {authMode === "signup" ? "Create your Zentric account" : "Sign in to Zentric"}
              </h2>
              <p className="text-gray-500 text-[15px] font-semibold text-center opacity-80">
                {authMode === "signup" ? "Start your AI growth mission today" : "Track your goals, one focused day at a time."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              {authMode === "signup" && (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[12px] font-black text-gray-500 uppercase tracking-widest leading-none">Your Name</label>
                    <span className="text-[10px] text-blue-500/60 font-medium">Used for greetings</span>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center text-gray-600 group-focus-within:text-blue-500 transition-colors pointer-events-none duration-300">
                      <UserRound className="w-[18px] h-[18px]" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required={authMode === "signup"}
                      className="w-full bg-black/40 border border-white/5 rounded-[22px] pl-14 pr-6 py-4.5 text-white placeholder-gray-700 text-[15px] outline-none hover:border-white/10 focus:border-blue-500/40 focus:ring-8 focus:ring-blue-500/[0.03] transition-all duration-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                <div className="flex justify-between items-end px-1">
                  <label className="text-[12px] font-black text-gray-500 uppercase tracking-widest leading-none">Email</label>
                  <span className="text-[10px] text-blue-500/60 font-medium">Zentric account</span>
                </div>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center text-gray-600 group-focus-within:text-blue-500 transition-colors pointer-events-none duration-300">
                    <Fingerprint className="w-[18px] h-[18px]" />
                  </div>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/5 rounded-[22px] pl-14 pr-6 py-4.5 text-white placeholder-gray-700 text-[15px] outline-none hover:border-white/10 focus:border-blue-500/40 focus:ring-8 focus:ring-blue-500/[0.03] transition-all duration-500"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[12px] font-black text-gray-500 uppercase tracking-widest leading-none">Password</label>
                  <button
                    type="button"
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-bold uppercase tracking-wider"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center text-gray-600 group-focus-within:text-blue-500 transition-colors pointer-events-none duration-300">
                    <Lock className="w-[18px] h-[18px]" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-[22px] pl-14 pr-14 py-4.5 text-white placeholder-gray-700 text-[15px] outline-none hover:border-white/10 focus:border-blue-500/40 focus:ring-8 focus:ring-blue-500/[0.03] transition-all duration-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors duration-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 flex-shrink-0" /> : <Eye className="w-5 h-5 flex-shrink-0" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center pt-2">
                <label
                  className="flex items-center gap-4 cursor-pointer group"
                  onClick={() => setKeepSignedIn(!keepSignedIn)}
                >
                  <div
                    className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all duration-500 ${
                      keepSignedIn
                        ? "bg-blue-600 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                        : "bg-white/5 border-white/10 group-hover:border-blue-500/40"
                    }`}
                  >
                    {keepSignedIn && <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />}
                  </div>
                  <span className="text-[13px] text-gray-500 font-bold select-none group-hover:text-gray-300 transition-colors duration-300 tracking-tight">
                    Remember for 30 days
                  </span>
                </label>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-bold rounded-2xl px-5 py-4 animate-in fade-in slide-in-from-top-2 duration-500">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full group relative overflow-hidden mt-6 py-5 rounded-[24px] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-[15px] uppercase tracking-widest transition-all duration-500 shadow-[0_20px_40px_-10px_rgba(59,130,246,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(59,130,246,0.6)] hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:grayscale disabled:translate-y-0"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {authMode === "signup" ? "Create Account" : "Sign In"}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-500" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-white/5 text-center">
              <p className="text-[14px] text-gray-500 font-bold tracking-tight">
                {authMode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode((current) => (current === "signup" ? "signin" : "signup"));
                    setError("");
                    setLoading(false);
                  }}
                  className="text-white hover:text-blue-400 font-black transition-colors duration-300 underline underline-offset-[6px] decoration-blue-500/30"
                >
                  {authMode === "signup" ? "Sign in" : "Create one free"}
                </button>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mt-12 py-4 grayscale opacity-20 hover:grayscale-0 hover:opacity-100 transition-all duration-700 cursor-default">
            <Zap className="w-5 h-5 text-gray-400" />
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em]">System.Zentric</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-shimmer {
          background-size: 200% auto;
          animation: shimmer 8s linear infinite;
        }
        @font-face {
          font-family: 'Inter';
          font-display: swap;
          src: url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        }
        body {
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        input::placeholder {
          font-weight: 700;
          letter-spacing: -0.02em;
        }
      `}</style>
    </div>
  );
}
