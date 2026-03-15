"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authService } from "@/services/auth.service";
import { useTranslation } from "@/i18n/context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await authService.login(form.email, form.password);
      authService.setStoredUser(user);
      router.push("/dashboard");
    } catch (err) {
      setError(t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 p-12 flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <span className="font-bold text-xl text-white">{t("app.name")}</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">
            {t("auth.welcomeBack")}
          </h2>
          <p className="text-slate-400 text-lg">
            {t("auth.manageMenuOrders")}
          </p>
        </div>
        <p className="text-slate-500 text-sm">{t("app.copyright")}</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 overflow-y-auto relative">
        <div className="absolute top-6 right-6">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-between gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-lg">{t("app.name")}</span>
            </div>
            <LanguageSwitcher />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t("auth.signInTitle")}
          </h1>
          <p className="text-slate-600 mb-8">{t("auth.signInSubtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}
            <Input
              label={t("auth.email")}
              type="email"
              placeholder="you@restaurant.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label={t("auth.password")}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>

          <p className="mt-6 text-center text-slate-600">
            {t("auth.noAccount")}{" "}
            <Link
              href="/register"
              className="font-medium text-orange-600 hover:text-orange-700"
            >
              {t("auth.createOne")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
