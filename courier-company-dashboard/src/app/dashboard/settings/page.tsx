"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  courierCompanyService,
  type Company,
} from "@/services/courier-company.service";
import { useTranslation } from "@/i18n/context";

export default function SettingsPage() {
  const { t } = useTranslation();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    delivery_fee: 12,
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    courierCompanyService
      .getMe()
      .then((c) => {
        setCompany(c);
        setForm({
          name: c.name,
          delivery_fee: c.delivery_fee,
          phone: c.phone || "",
          address: c.address || "",
        });
      })
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    const fee = Math.min(20, Math.max(0, form.delivery_fee));
    const data = { ...form, delivery_fee: fee };
    setSaving(true);
    setMessage("");
    try {
      await courierCompanyService.updateMe({
        name: data.name,
        delivery_fee: data.delivery_fee,
        phone: data.phone || null,
        address: data.address || null,
      });
      setForm(data);
      setCompany((prev) =>
        prev ? { ...prev, ...data, phone: data.phone || null, address: data.address || null } : null
      );
      setMessage(t("settings.savedSuccess"));
    } catch {
      setMessage(t("settings.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-slate-500">{t("common.loading")}</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        {t("settings.loadFailed")}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">{t("settings.title")}</h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-6 p-6 border border-slate-200 rounded-xl bg-white shadow-sm"
      >
        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message === t("settings.saveFailed")
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {message}
          </div>
        )}

        <Input
          label={t("settings.companyName")}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <Input
          label={t("settings.deliveryFee")}
          type="text"
          inputMode="decimal"
          value={String(form.delivery_fee).replace(/^0+(?=\d)/, "")}
          onChange={(e) => {
            let raw = e.target.value.replace(/[^\d.]/g, "");
            const dotIdx = raw.indexOf(".");
            if (dotIdx >= 0) {
              raw = raw.slice(0, dotIdx + 1) + raw.slice(dotIdx + 1).replace(/\./g, "");
            }
            const noLeadingZero = raw.replace(/^0+(?=\d)/, "");
            const v = parseFloat(noLeadingZero) || 0;
            setForm({
              ...form,
              delivery_fee: Math.min(20, Math.max(0, v)),
            });
          }}
          onBlur={() => {
            const clamped = Math.min(20, Math.max(0, form.delivery_fee));
            setForm((f) => ({ ...f, delivery_fee: clamped }));
          }}
          required
        />
        <p className="text-sm text-slate-500 -mt-2">{t("settings.deliveryFeeHint")}</p>

        <Input
          label={t("settings.phone")}
          type="tel"
          placeholder="+992 90 123 4567"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <Input
          label={t("settings.address")}
          placeholder={t("settings.addressPlaceholder")}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />

        <Button type="submit" disabled={saving}>
          {saving ? t("settings.saving") : t("settings.saveChanges")}
        </Button>
      </form>
    </div>
  );
}
