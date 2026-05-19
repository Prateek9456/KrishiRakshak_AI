"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Loader2, Satellite, MapPin, Shield } from "lucide-react";
import IcarLogo from "@/components/IcarLogo";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";

const demoEnabled = process.env.NEXT_PUBLIC_AUTH_MODE === "demo";

const AUTH_ERRORS: Record<string, string> = {
  Configuration:
    "Server auth is misconfigured. On Render, set NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET.",
  AccessDenied: "Access was denied. Try a different Google account.",
  Verification: "Sign-in link expired. Please try again.",
  OAuthSignin: "Could not start Google sign-in. Check OAuth client settings.",
  OAuthCallback:
    "Google callback failed. Add https://krishi-rakshak-web.onrender.com/api/auth/callback/google in Google Console.",
  OAuthAccountNotLinked:
    "This email is linked to another sign-in method. Use the same provider you used before.",
  Callback: "Sign-in callback failed. Check Render logs and DATABASE_URL (must not be localhost).",
  Default: "Sign-in failed. Check Render environment variables and redeploy.",
};

function LoginErrorBanner({ code }: { code: string | null }) {
  if (!code) return null;
  const message = AUTH_ERRORS[code] || AUTH_ERRORS.Default;
  return (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <strong className="block font-bold mb-1">Sign-in error ({code})</strong>
      {message}
    </div>
  );
}

function LoginContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");
  const [demoName, setDemoName] = useState("Demo User");
  const [demoEmail, setDemoEmail] = useState("demo@example.com");
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn("demo", {
      callbackUrl: "/",
      email: demoEmail,
      name: demoName,
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden font-sans">
      {/* Full-screen Background Image */}
      <Image
        src="/images/login_bg_india.png"
        alt="Indian agricultural landscape"
        fill
        className="object-cover transition-transform duration-[20000ms] hover:scale-105"
        priority
        sizes="100vw"
      />
      
      {/* Overlays for readability and aesthetics */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#001a0e]/90 via-[#003e21]/60 to-[#001a0e]/40 mix-blend-multiply" />
      <div className="absolute inset-0 bg-black/20" />

      {/* Language Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageToggle />
      </div>

      <div className="relative z-10 w-full max-w-5xl px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
        
        {/* Left Side: Text and Branding */}
        <div className="flex-1 text-white text-center lg:text-left pt-12 lg:pt-0">
          <div className="inline-flex items-center gap-3 mb-6 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <div className="bg-white px-2 py-1 rounded-lg shadow-sm">
              <IcarLogo size="xs" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-green-100 border-l border-white/20 pl-3">
              {t.login.heroKicker}
            </p>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white mb-6 tracking-tight drop-shadow-lg">
            {t.login.heroTitle}
          </h2>
          <p className="text-lg sm:text-xl text-green-50 font-medium max-w-xl mx-auto lg:mx-0 drop-shadow-md">
            {t.login.description}
          </p>
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl shadow-[0_12px_40px_rgb(0,0,0,0.3)] border border-white/60">
            <div className="flex justify-center mb-8">
              <IcarLogo size="lg" priority className="drop-shadow-sm" />
            </div>

            <LoginErrorBanner code={authError} />

            <div className="text-center mb-8">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#2e7d32] mb-2">
                {t.login.kicker}
              </p>
              <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
                {t.login.title}
              </h1>
            </div>

            <div className="space-y-6">
              {!demoEnabled && (
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/" })}
                  className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-white border border-stone-300 px-4 py-3.5 text-sm font-bold text-stone-800 shadow-sm hover:shadow-md hover:border-[#2e7d32]/40 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2e7d32]/5 to-transparent opacity-0 group-hover:opacity-100 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000" />
                  <svg className="h-5 w-5 relative z-10" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="relative z-10">{t.login.continueWithGoogle}</span>
                </button>
              )}

              {demoEnabled && (
                <form onSubmit={handleDemoLogin} className="space-y-4">
                  <p className="text-xs font-semibold text-amber-800 bg-amber-50/80 backdrop-blur border border-amber-200/50 rounded-xl px-4 py-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    {t.login.demoModeNotice}
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={demoName}
                      onChange={(e) => setDemoName(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:ring-2 focus:ring-[#005a32]/20 focus:border-[#005a32] outline-none transition-all bg-white/80 font-medium"
                      placeholder={t.login.namePlaceholder}
                    />
                    <input
                      type="email"
                      value={demoEmail}
                      onChange={(e) => setDemoEmail(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:ring-2 focus:ring-[#005a32]/20 focus:border-[#005a32] outline-none transition-all bg-white/80 font-medium"
                      placeholder={t.login.emailPlaceholder}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative overflow-hidden w-full rounded-xl bg-gradient-to-r from-[#1b5e20] to-[#005a32] text-white py-3.5 text-sm font-bold hover:shadow-lg hover:shadow-[#005a32]/30 disabled:opacity-70 flex justify-center gap-2 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-white/20 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700" />
                    {loading && <Loader2 className="h-4 w-4 animate-spin relative z-10" />}
                    <span className="relative z-10">{t.login.continueAsDemo}</span>
                  </button>
                </form>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100">
              <ul className="space-y-3 text-xs text-stone-600 font-medium">
                <li className="flex items-center gap-2">
                  <Satellite className="h-3.5 w-3.5 text-[#2e7d32]" />
                  {t.login.feature1}
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#2e7d32]" />
                  {t.login.feature2}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f4f7f4]">
          <Loader2 className="h-8 w-8 animate-spin text-[#1b5e20]" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

