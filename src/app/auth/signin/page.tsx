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
  CalendarCheck,
  Target,
  Code2,
  Check,
  Fingerprint,
  LineChart,
  Sparkles,
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

  const missionStats = [
    { label: "Readiness", value: "74%" },
    { label: "Focus time", value: "2h 15m" },
    { label: "Next lift", value: "+3%" },
  ];

  const missionSteps = ["Revise Graphs", "Solve 5 questions", "Update career proof"];

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#EEF4FF]">
      {/* ── LEFT SIDE: BRANDING & EXPERIENCE ──────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 xl:p-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.86))]" />
          <div className="absolute -left-28 top-24 h-80 w-80 rounded-full bg-blue-300/25 blur-3xl" />
          <div className="absolute bottom-16 right-10 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(29,78,216,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(29,78,216,0.055)_1px,transparent_1px)] bg-[size:42px_42px] opacity-70" />
        </div>

        <div className="absolute inset-0 pointer-events-none opacity-10">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-blue-200/60"
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
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#D6E4F5] bg-[#172033] shadow-sm transition-colors duration-200 group-hover:border-blue-200">
              <Zap className="w-6 h-6 text-sky-300 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-[#172033] tracking-tighter leading-none">ZENTRIC</span>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-1 h-1 rounded-full bg-blue-600" />
                <span className="text-[9px] text-[#667085] font-black uppercase tracking-[0.3em] bg-[#F8FBFF] px-2 py-0.5 rounded border border-[#D6E4F5]">
                  AI Productivity OS
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-xl mb-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D6E4F5] bg-[#F8FBFF]/90 px-4 py-2 text-xs font-bold text-[#344054] shadow-sm shadow-blue-100/60">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Personal AI command center
          </div>
          <h1 className="text-[58px] font-bold text-[#172033] leading-[1.05] mb-6 tracking-[-0.04em] xl:text-[64px]">
            Your AI-powered <br />
            <span className="bg-gradient-to-r from-blue-600 to-slate-950 bg-clip-text text-transparent">
              productivity engine.
            </span>
          </h1>
          <p className="text-[#667085] text-lg leading-relaxed mb-8 max-w-[520px] font-medium xl:text-xl">
            Built for students, developers, and job seekers who want fewer distractions and a clearer path toward their dream career.
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            {features.map(({ icon: Icon, text }) => (
              <div 
                key={text} 
                className="flex items-center gap-5 group transition-all"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#F8FBFF] border border-[#D6E4F5] flex items-center justify-center shadow-sm shadow-blue-100/50 group-hover:border-blue-200 transition-colors duration-200">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[#344054] text-base font-semibold group-hover:text-[#172033] transition-colors">
                    {text}
                  </span>
                  <div className="h-px w-0 bg-blue-200 group-hover:w-full transition-all duration-300" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-[30px] border border-[#D6E4F5] bg-[#F8FBFF]/90 p-5 shadow-2xl shadow-blue-200/30 backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">
                  Today&apos;s mission
                </p>
                <h3 className="mt-1 text-lg font-bold text-[#172033]">Google SDE readiness sprint</h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#172033] text-white">
                <LineChart className="h-5 w-5" />
              </div>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-3">
              {missionStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[#D6E4F5] bg-white/70 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#667085]">{stat.label}</p>
                  <p className="mt-1 text-lg font-black text-[#172033]">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2.5">
              {missionSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl bg-[#EEF4FF] px-3.5 py-3 text-sm font-semibold text-[#344054]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-black text-blue-600 shadow-sm">
                    {index + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-8 text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black">
          <span className="hover:text-slate-600 cursor-default transition-colors">© 2026 ZENTRICLABS</span>
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="hover:text-slate-600 cursor-pointer transition-colors">Focused learning</span>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute inset-0 bg-[#EEF4FF] lg:bg-transparent pointer-events-none" />
        <div className="pointer-events-none absolute right-8 top-10 hidden rounded-[24px] border border-[#D6E4F5] bg-[#F8FBFF]/80 px-5 py-4 shadow-xl shadow-blue-200/30 backdrop-blur lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#667085]">Plan ready</p>
              <p className="text-sm font-black text-[#172033]">2h 15m focus block</p>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-12 left-8 hidden rounded-[24px] border border-[#D6E4F5] bg-white/75 px-5 py-4 shadow-xl shadow-blue-200/30 backdrop-blur xl:block">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#667085]">Growth signal</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 w-28 overflow-hidden rounded-full bg-[#D6E4F5]">
              <div className="h-full w-[72%] rounded-full bg-blue-600" />
            </div>
            <span className="text-sm font-black text-[#172033]">72%</span>
          </div>
        </div>
        
        <div className="w-full max-w-[440px] relative z-10">
          <div className="absolute -inset-3 rounded-[34px] bg-gradient-to-br from-white/80 via-blue-100/50 to-transparent blur-xl" />
          <div
            className="relative rounded-[32px] border border-[#D6E4F5] p-8 shadow-2xl shadow-blue-200/50 sm:p-10"
            style={{ 
              background: "linear-gradient(180deg, rgba(248,251,255,0.96), rgba(255,255,255,0.9))", 
              backdropFilter: "blur(22px)",
            }}
          >
            <div className="mb-8 grid grid-cols-3 gap-2 rounded-[22px] border border-[#D6E4F5] bg-[#EEF4FF]/70 p-2">
              {["Focus", "Practice", "Grow"].map((item) => (
                <div key={item} className="rounded-2xl bg-[#F8FBFF] px-3 py-2 text-center shadow-sm shadow-blue-100/40">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#667085]">{item}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center mb-10">
              <div className="mb-8 inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-[#D6E4F5] bg-[#EEF4FF]">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-black text-[#667085] uppercase tracking-[0.25em]">{authMode === "signup" ? "Create account" : "Sign in"}</span>
              </div>
              <h2 className="text-4xl font-bold text-[#172033] mb-3 tracking-tight text-center">
                {authMode === "signup" ? "Create your Zentric account" : "Sign in to Zentric"}
              </h2>
              <p className="text-[#667085] text-[15px] font-semibold text-center">
                {authMode === "signup" ? "Start your AI growth mission today" : "Track your goals, one focused day at a time."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              {authMode === "signup" && (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest leading-none">Your Name</label>
                    <span className="text-[10px] text-slate-500 font-medium">Used for greetings</span>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none duration-200">
                      <UserRound className="w-[18px] h-[18px]" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required={authMode === "signup"}
                      className="w-full bg-[#F8FBFF] border border-[#D6E4F5] rounded-[18px] pl-14 pr-6 py-4.5 text-[#172033] placeholder-slate-400 text-[15px] outline-none hover:border-blue-200 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-100 transition-colors duration-200"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                <div className="flex justify-between items-end px-1">
                  <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest leading-none">Email</label>
                  <span className="text-[10px] text-slate-500 font-medium">Zentric account</span>
                </div>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none duration-200">
                    <Fingerprint className="w-[18px] h-[18px]" />
                  </div>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="w-full bg-[#F8FBFF] border border-[#D6E4F5] rounded-[18px] pl-14 pr-6 py-4.5 text-[#172033] placeholder-slate-400 text-[15px] outline-none hover:border-blue-200 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-100 transition-colors duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest leading-none">Password</label>
                  <button
                    type="button"
                    className="text-[11px] text-blue-600 hover:text-blue-700 transition-colors font-bold uppercase tracking-wider"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none duration-200">
                    <Lock className="w-[18px] h-[18px]" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#F8FBFF] border border-[#D6E4F5] rounded-[18px] pl-14 pr-14 py-4.5 text-[#172033] placeholder-slate-400 text-[15px] outline-none hover:border-blue-200 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-100 transition-colors duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#172033] transition-colors duration-300"
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
                        ? "bg-blue-600 border-blue-600"
                        : "bg-[#F8FBFF] border-[#D6E4F5] group-hover:border-blue-300"
                    }`}
                  >
                    {keepSignedIn && <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />}
                  </div>
                  <span className="text-[13px] text-slate-500 font-bold select-none group-hover:text-slate-700 transition-colors duration-300 tracking-tight">
                    Remember for 30 days
                  </span>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] font-bold rounded-2xl px-5 py-4 animate-in fade-in slide-in-from-top-2 duration-500">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full group relative overflow-hidden mt-6 py-5 rounded-[20px] bg-[#172033] text-white font-black text-[15px] uppercase tracking-widest transition-colors duration-200 hover:bg-[#24324A] active:bg-[#172033] disabled:opacity-70 disabled:grayscale"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
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

            <div className="mt-12 pt-8 border-t border-[#D6E4F5] text-center">
              <p className="text-[14px] text-slate-500 font-bold tracking-tight">
                {authMode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode((current) => (current === "signup" ? "signin" : "signup"));
                    setError("");
                    setLoading(false);
                  }}
                  className="text-[#172033] hover:text-blue-600 font-black transition-colors duration-200 underline underline-offset-[6px] decoration-blue-200"
                >
                  {authMode === "signup" ? "Sign in" : "Create one free"}
                </button>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mt-12 py-4 opacity-60 transition-all duration-300 cursor-default">
            <Zap className="w-5 h-5 text-slate-400" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">System.Zentric</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
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
