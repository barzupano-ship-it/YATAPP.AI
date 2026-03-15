"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import {
  courierCompanyService,
  type Courier,
  type CourierProfile,
} from "@/services/courier-company.service";
import { useTranslation } from "@/i18n/context";

const EMPTY_PROFILE: CourierProfile = {
  firstName: "",
  lastName: "",
  phone: "",
  profilePhotoUrl: "",
  passportPhotoUrl: "",
  inn: "",
  passportNumber: "",
};

function toNullIfEmpty(s: string): string | null {
  const t = s.trim();
  return t ? t : null;
}

export default function CourierProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const courierId = params.id ? parseInt(String(params.id), 10) : null;

  const [courier, setCourier] = useState<Courier | null>(null);
  const [profileForm, setProfileForm] = useState<CourierProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courierId || isNaN(courierId)) {
      setLoading(false);
      return;
    }
    Promise.all([
      courierCompanyService.getCouriers(),
      courierCompanyService.getCourierProfile(courierId),
    ])
      .then(([couriers, profile]) => {
        const c = couriers.find((x) => x.id === courierId);
        setCourier(c ?? null);
        setProfileForm(profile);
      })
      .catch(() => {
        setCourier(null);
        setProfileForm(EMPTY_PROFILE);
      })
      .finally(() => setLoading(false));
  }, [courierId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courier || !courierId) return;
    setSaving(true);
    setError("");
    try {
      const result = await courierCompanyService.updateCourierProfile(courierId, {
        firstName: toNullIfEmpty(profileForm.firstName),
        lastName: toNullIfEmpty(profileForm.lastName),
        phone: toNullIfEmpty(profileForm.phone),
        inn: toNullIfEmpty(profileForm.inn),
        passportNumber: toNullIfEmpty(profileForm.passportNumber),
        profilePhoto: toNullIfEmpty(profileForm.profilePhotoUrl),
        passportPhoto: toNullIfEmpty(profileForm.passportPhotoUrl),
      });
      setProfileForm(result.profile);
      setCourier(result.courier);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.saveFailed"));
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

  if (!courier || !courierId) {
    return (
      <div>
        <Link
          href="/dashboard/couriers"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back")}
        </Link>
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {t("couriers.profileNotFound")}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/couriers"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("common.back")}
      </Link>

      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">
            {t("couriers.profileTitle")} — {courier.name}
          </h1>
          <p className="text-sm text-slate-600 mt-1">{courier.email}</p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t("couriers.firstName")}
              value={profileForm.firstName}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))
              }
            />
            <Input
              label={t("couriers.lastName")}
              value={profileForm.lastName}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))
              }
            />
            <Input
              label={t("auth.phone")}
              value={profileForm.phone}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder={t("couriers.phonePlaceholder")}
            />
            <Input
              label={t("couriers.inn")}
              value={profileForm.inn}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, inn: e.target.value }))
              }
            />
            <Input
              label={t("couriers.passportNumber")}
              value={profileForm.passportNumber}
              onChange={(e) =>
                setProfileForm((prev) => ({
                  ...prev,
                  passportNumber: e.target.value,
                }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUpload
              label={t("couriers.photo34")}
              value={profileForm.profilePhotoUrl}
              onChange={(value) =>
                setProfileForm((prev) => ({ ...prev, profilePhotoUrl: value }))
              }
              aspectRatio="portrait"
            />
            <ImageUpload
              label={t("couriers.passportPhoto")}
              value={profileForm.passportPhotoUrl}
              onChange={(value) =>
                setProfileForm((prev) => ({ ...prev, passportPhotoUrl: value }))
              }
              aspectRatio="wide"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? t("couriers.savingProfile") : t("couriers.saveProfile")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/couriers")}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
