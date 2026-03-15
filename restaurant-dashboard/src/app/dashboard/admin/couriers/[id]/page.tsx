"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import {
  adminService,
  type AdminUser,
  type CourierProfile,
} from "@/services/admin.service";
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

function toNullIfEmpty(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

export default function CourierProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const courierId = params.id ? String(params.id) : null;

  const [courier, setCourier] = useState<AdminUser | null>(null);
  const [profileForm, setProfileForm] = useState<CourierProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!courierId) {
      setLoading(false);
      return;
    }
    Promise.all([
      adminService.getUsers(),
      adminService.getCourierProfile(courierId),
    ])
      .then(([users, profile]) => {
        const c = users.find((x) => x.id === courierId);
        if (c && c.role === "courier") {
          setCourier(c);
          setProfileForm(profile);
        } else {
          setCourier(null);
        }
      })
      .catch(() => setCourier(null))
      .finally(() => setLoading(false));
  }, [courierId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courier || !courierId) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const result = await adminService.updateCourierProfile(courierId, {
        firstName: toNullIfEmpty(profileForm.firstName),
        lastName: toNullIfEmpty(profileForm.lastName),
        phone: toNullIfEmpty(profileForm.phone),
        profilePhoto: toNullIfEmpty(profileForm.profilePhotoUrl),
        passportPhoto: toNullIfEmpty(profileForm.passportPhotoUrl),
        inn: toNullIfEmpty(profileForm.inn),
        passportNumber: toNullIfEmpty(profileForm.passportNumber),
      });
      setProfileForm(result.profile);
      setCourier({ ...courier, ...result.user });
      setSuccess(t("admin.courierProfileSaved", { name: result.user.name }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!courier || !confirm(t("admin.deleteUserConfirm", { name: courier.name, email: courier.email }))) return;
    try {
      await adminService.deleteUser(courierId!);
      router.push("/dashboard/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.actionFailed"));
    }
  };

  if (loading) {
    return (
      <Header title={t("admin.courierProfile")} subtitle={t("common.loading")} />
    );
  }

  if (!courier || !courierId) {
    return (
      <>
        <Header title={t("admin.courierProfile")} />
        <Card className="mt-6">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back")}
          </Link>
          <p className="text-sm text-slate-500">{t("admin.courierSelectPrompt")}</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <Header title={t("admin.courierProfile")} subtitle={courier.name} />

      <Link
        href="/dashboard/admin"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("common.back")}
      </Link>

      {(error || success) && (
        <Card className="mb-6">
          {error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : (
            <p className="text-sm text-emerald-700">{success}</p>
          )}
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-2 mb-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{courier.name}</h2>
            <p className="text-sm text-slate-600 mt-1">{courier.email}</p>
          </div>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            {t("admin.deleteUser")}
          </Button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t("admin.courierFirstName")}
              value={profileForm.firstName}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))
              }
            />
            <Input
              label={t("admin.courierLastName")}
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
              placeholder={t("auth.phone")}
            />
            <Input
              label={t("admin.courierInn")}
              value={profileForm.inn}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, inn: e.target.value }))
              }
              placeholder={t("admin.courierInn")}
            />
            <Input
              label={t("admin.courierPassportNumber")}
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
              label={t("admin.courierPhoto34")}
              value={profileForm.profilePhotoUrl}
              onChange={(value) =>
                setProfileForm((prev) => ({ ...prev, profilePhotoUrl: value }))
              }
              aspectRatio="portrait"
            />
            <ImageUpload
              label={t("admin.courierPassportPhoto")}
              value={profileForm.passportPhotoUrl}
              onChange={(value) =>
                setProfileForm((prev) => ({ ...prev, passportPhotoUrl: value }))
              }
              aspectRatio="wide"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? t("admin.courierProfileSaving") : t("admin.courierProfileSave")}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/admin")}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
