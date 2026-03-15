"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { authService } from "@/services/auth.service";
import { useTranslation } from "@/i18n/context";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    company_name: "",
    owner_name: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.register({
        company_name: form.company_name,
        owner_name: form.owner_name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("auth.registerFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-lg">{t("app.name")}</span>
          </div>
          <LanguageSwitcher />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {t("auth.registerTitle")}
        </h1>
        <p className="text-slate-600 mb-8">{t("auth.registerSubtitle")}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
          <Input
            label={t("auth.companyName")}
            placeholder="Express Delivery Co."
            value={form.company_name}
            onChange={(e) =>
              setForm({ ...form, company_name: e.target.value })
            }
            required
          />
          <Input
            label={t("auth.ownerName")}
            placeholder="John Doe"
            value={form.owner_name}
            onChange={(e) =>
              setForm({ ...form, owner_name: e.target.value })
            }
            required
          />
          <Input
            label={t("auth.email")}
            type="email"
            placeholder="company@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label={t("auth.phoneOptional")}
            type="tel"
            placeholder="+992 90 123 4567"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label={t("auth.password")}
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            required
            minLength={6}
          />
          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? t("auth.registering") : t("auth.register")}
          </Button>
        </form>

        <p className="mt-6 text-center text-slate-600">
          {t("auth.hasAccount")}{" "}
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:text-emerald-700"
          >
            {t("auth.signInLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
