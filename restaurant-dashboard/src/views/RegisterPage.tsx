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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

interface FormErrors {
  restaurantName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  password?: string;
  address?: string;
}

export function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    restaurantName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    address: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.restaurantName.trim()) {
      newErrors.restaurantName = t("validation.restaurantNameRequired");
    }

    if (!form.ownerName.trim()) {
      newErrors.ownerName = t("validation.ownerNameRequired");
    }

    if (!form.email.trim()) {
      newErrors.email = t("validation.emailRequired");
    } else if (!EMAIL_REGEX.test(form.email)) {
      newErrors.email = t("validation.emailInvalid");
    }

    if (!form.phone.trim()) {
      newErrors.phone = t("validation.phoneRequired");
    } else if (form.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = t("validation.phoneInvalid");
    }

    if (!form.password) {
      newErrors.password = t("validation.passwordRequired");
    } else if (form.password.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = t("validation.passwordMin", {
        count: String(PASSWORD_MIN_LENGTH),
      });
    }

    if (!form.address.trim()) {
      newErrors.address = t("validation.addressRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setErrors({});

    if (!validate()) return;

    setLoading(true);
    try {
      const user = await authService.register(form);
      authService.setStoredUser(user);
      router.push("/dashboard");
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : t("auth.registrationFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = (field: keyof FormErrors) => {
    let message: string | undefined = undefined;
    switch (field) {
      case "restaurantName":
        message = !form.restaurantName.trim()
          ? t("validation.restaurantNameRequired")
          : undefined;
        break;
      case "ownerName":
        message = !form.ownerName.trim()
          ? t("validation.ownerNameRequired")
          : undefined;
        break;
      case "email":
        if (!form.email.trim()) message = t("validation.emailRequired");
        else if (!EMAIL_REGEX.test(form.email))
          message = t("validation.emailInvalid");
        break;
      case "phone":
        if (!form.phone.trim()) message = t("validation.phoneRequired");
        else if (form.phone.replace(/\D/g, "").length < 10)
          message = t("validation.phoneInvalid");
        break;
      case "password":
        if (!form.password) message = t("validation.passwordRequired");
        else if (form.password.length < PASSWORD_MIN_LENGTH)
          message = t("validation.passwordMin", {
            count: String(PASSWORD_MIN_LENGTH),
          });
        break;
      case "address":
        message = !form.address.trim()
          ? t("validation.addressRequired")
          : undefined;
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: message }));
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
            {t("auth.growRestaurant")}
          </h2>
          <p className="text-slate-400 text-lg">{t("auth.joinThousands")}</p>
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
            {t("auth.registerTitle")}
          </h1>
          <p className="text-slate-600 mb-8">{t("auth.registerSubtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {submitError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {submitError}
              </div>
            )}

            <Input
              label={t("auth.restaurantName")}
              type="text"
              placeholder="The Golden Fork"
              value={form.restaurantName}
              onChange={(e) =>
                setForm({ ...form, restaurantName: e.target.value })
              }
              onBlur={() => handleBlur("restaurantName")}
              error={errors.restaurantName}
              required
            />

            <Input
              label={t("auth.ownerName")}
              type="text"
              placeholder="John Doe"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              onBlur={() => handleBlur("ownerName")}
              error={errors.ownerName}
              required
            />

            <Input
              label={t("auth.email")}
              type="email"
              placeholder="you@restaurant.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={() => handleBlur("email")}
              error={errors.email}
              required
            />

            <Input
              label={t("auth.phone")}
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              onBlur={() => handleBlur("phone")}
              error={errors.phone}
              required
            />

            <Input
              label={t("auth.password")}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onBlur={() => handleBlur("password")}
              error={errors.password}
              required
              minLength={PASSWORD_MIN_LENGTH}
            />
            <p className="text-xs text-slate-500 -mt-3">
              {t("validation.passwordMin", { count: String(PASSWORD_MIN_LENGTH) })}
            </p>

            <Input
              label={t("auth.address")}
              type="text"
              placeholder="123 Main Street, City, State"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              onBlur={() => handleBlur("address")}
              error={errors.address}
              required
            />

            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
            </Button>
          </form>

          <p className="mt-6 text-center text-slate-600">
            {t("auth.hasAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-orange-600 hover:text-orange-700"
            >
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
