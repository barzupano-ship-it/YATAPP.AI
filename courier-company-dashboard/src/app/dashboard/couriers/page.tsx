"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Plus, Trash2, User } from "lucide-react";
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

export default function CouriersPage() {
  const { t } = useTranslation();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedCourierId, setSelectedCourierId] = useState<number | null>(null);
  const [profileForm, setProfileForm] = useState<CourierProfile>(EMPTY_PROFILE);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const profilePanelRef = useRef<HTMLDivElement>(null);

  const load = () => {
    courierCompanyService
      .getCouriers()
      .then((list) => {
        setCouriers(list);
        if (list.length > 0 && !selectedCourierId) {
          setSelectedCourierId(list[0].id);
        }
        if (list.length === 0) {
          setSelectedCourierId(null);
          setProfileForm(EMPTY_PROFILE);
        }
      })
      .catch(() => setCouriers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const selectedCourier = useMemo(
    () => couriers.find((c) => c.id === selectedCourierId) ?? null,
    [couriers, selectedCourierId]
  );

  useEffect(() => {
    if (!selectedCourierId || couriers.length === 0) return;
    if (!couriers.some((c) => c.id === selectedCourierId)) {
      setSelectedCourierId(couriers[0]?.id ?? null);
      setProfileForm(EMPTY_PROFILE);
      return;
    }
    setProfileLoading(true);
    courierCompanyService
      .getCourierProfile(selectedCourierId)
      .then(setProfileForm)
      .catch(() => setProfileForm(EMPTY_PROFILE))
      .finally(() => setProfileLoading(false));
  }, [selectedCourierId, couriers]);

  useEffect(() => {
    if (selectedCourierId && profilePanelRef.current) {
      profilePanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedCourierId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const courier = await courierCompanyService.createCourier({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });
      setForm({ name: "", email: "", phone: "", password: "" });
      setShowForm(false);
      load();
      setSelectedCourierId(courier.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("couriers.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm(t("couriers.removeConfirm"))) return;
    try {
      await courierCompanyService.removeCourier(id);
      if (selectedCourierId === id) {
        setSelectedCourierId(null);
        setProfileForm(EMPTY_PROFILE);
      }
      load();
    } catch {
      // ignore
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourier) return;
    setProfileSaving(true);
    try {
      const result = await courierCompanyService.updateCourierProfile(
        selectedCourier.id,
        {
          firstName: toNullIfEmpty(profileForm.firstName),
          lastName: toNullIfEmpty(profileForm.lastName),
          phone: toNullIfEmpty(profileForm.phone),
          inn: toNullIfEmpty(profileForm.inn),
          passportNumber: toNullIfEmpty(profileForm.passportNumber),
          profilePhoto: toNullIfEmpty(profileForm.profilePhotoUrl),
          passportPhoto: toNullIfEmpty(profileForm.passportPhotoUrl),
        }
      );
      setProfileForm(result.profile);
      setCouriers((prev) =>
        prev.map((c) => (c.id === selectedCourier.id ? result.courier : c))
      );
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-slate-500">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t("couriers.title")}</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("couriers.addCourier")}
        </Button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 border border-slate-200 rounded-xl bg-white shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {t("couriers.createTitle")}
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            {t("couriers.createDesc")}
          </p>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}
            <Input
              label={t("couriers.name")}
              placeholder={t("couriers.namePlaceholder")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label={t("couriers.email")}
              type="email"
              placeholder={t("couriers.emailPlaceholder")}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label={t("auth.phoneOptional")}
              placeholder={t("couriers.phonePlaceholder")}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label={t("auth.password")}
              type="password"
              placeholder={t("couriers.passwordPlaceholder")}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? t("couriers.creating") : t("common.create")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </div>
      )}

      {couriers.length === 0 ? (
        <div className="border border-slate-200 rounded-xl bg-white shadow-sm p-12 text-center text-slate-500">
          <User className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="font-medium">{t("couriers.emptyTitle")}</p>
          <p className="text-sm mt-1">{t("couriers.emptyDesc")}</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            {t("couriers.addFirst")}
          </Button>
        </div>
      ) : (
        <>
          <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-700">
                {t("couriers.listTitle")}
              </h2>
            </div>
            <div className="divide-y divide-slate-200">
              {couriers.map((c) => {
                const isSelected = selectedCourierId === c.id;
                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedCourierId(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedCourierId(c.id);
                      }
                    }}
                    className={`px-6 py-4 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-orange-50 border-l-4 border-l-orange-500"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {c.name}
                        {!c.is_active && (
                          <span className="ml-2 text-xs font-normal text-amber-600">
                            {t("couriers.pendingApproval")}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-600">{c.email}</p>
                      {c.phone && (
                        <p className="text-sm text-slate-500">{c.phone}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(c.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title={t("couriers.removeTitle")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            ref={profilePanelRef}
            className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden"
          >
            {!selectedCourier ? (
              <div className="p-6">
                <p className="text-sm text-slate-500">
                  {t("couriers.selectPrompt")}
                </p>
              </div>
            ) : profileLoading ? (
              <div className="p-6">
                <p className="text-sm text-slate-500">{t("couriers.loadingProfile")}</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {t("couriers.profileTitle")}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">{selectedCourier.email}</p>
                </div>
                <form onSubmit={handleProfileSave} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={t("couriers.firstName")}
                      value={profileForm.firstName}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                    />
                    <Input
                      label={t("couriers.lastName")}
                      value={profileForm.lastName}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                    />
                    <Input
                      label={t("auth.phone")}
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder={t("couriers.phonePlaceholder")}
                    />
                    <Input
                      label={t("couriers.inn")}
                      value={profileForm.inn}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          inn: e.target.value,
                        }))
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
                        setProfileForm((prev) => ({
                          ...prev,
                          profilePhotoUrl: value,
                        }))
                      }
                      aspectRatio="portrait"
                    />
                    <ImageUpload
                      label={t("couriers.passportPhoto")}
                      value={profileForm.passportPhotoUrl}
                      onChange={(value) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          passportPhotoUrl: value,
                        }))
                      }
                      aspectRatio="wide"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={profileSaving}>
                      {profileSaving ? t("couriers.savingProfile") : t("couriers.saveProfile")}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
