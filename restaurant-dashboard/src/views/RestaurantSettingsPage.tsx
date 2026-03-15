"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { restaurantService, Restaurant } from "@/services/restaurant.service";
import { authService } from "@/services/auth.service";
import { useTranslation } from "@/i18n/context";
import { useRestaurantId } from "@/hooks/useRestaurant";
import { CITIES_TAJIKISTAN } from "@/data/cities";

function getDeliveryMinutes(value?: string | number): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const match = value.match(/\d+/);
  if (!match) return undefined;
  const minutes = Number(match[0]);
  return Number.isFinite(minutes) ? minutes : undefined;
}

function parseCoordinatesFromGoogleMapsInput(value: string): {
  latitude: number;
  longitude: number;
} | null {
  const input = value.trim();
  if (!input) return null;

  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]destination=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (!match) continue;

    const latitude = Number(match[1]);
    const longitude = Number(match[2]);

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      return { latitude, longitude };
    }
  }

  return null;
}

function parseCoordinateInput(value: string): number | undefined {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function RestaurantSettingsPage() {
  const { t } = useTranslation();
  const restaurantId = useRestaurantId();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<Partial<Restaurant>>({});
  const [googleMapsValue, setGoogleMapsValue] = useState("");
  const [locationMessage, setLocationMessage] = useState("");

  const loadRestaurant = useCallback(() => {
    setError("");
    setSuccess("");
    if (!restaurantId) {
      setRestaurant(null);
      setForm({});
      setLoading(false);
      return;
    }
    setLoading(true);
    restaurantService
      .getRestaurant(restaurantId)
      .then((data) => {
        setRestaurant(data);
        setForm(data);
        setGoogleMapsValue(data.googleMapsUrl ?? "");
        setLocationMessage("");
        setLoading(false);
      })
      .catch(() => {
        setError(t("settings.loadFailed"));
        setLoading(false);
      });
  }, [restaurantId, t]);

  useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);

  const applyGoogleMapsLocation = () => {
    const coords = parseCoordinatesFromGoogleMapsInput(googleMapsValue);
    if (!coords) {
      setLocationMessage("Could not detect coordinates from the Google Maps link.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      latitude: coords.latitude,
      longitude: coords.longitude,
      googleMapsUrl: googleMapsValue.trim() || undefined,
    }));
    setLocationMessage(
      `Location saved: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const payload: Partial<Restaurant> = {
        ...form,
        delivery_time: getDeliveryMinutes(form.deliveryTime),
        googleMapsUrl: googleMapsValue.trim() || undefined,
      };

      if (restaurant) {
        const updated = await restaurantService.updateRestaurant(
          restaurant.id,
          payload
        );
        setRestaurant(updated);
        setForm(updated);
        setGoogleMapsValue(updated.googleMapsUrl ?? "");
        setSuccess(t("settings.savedSuccess"));
      } else {
        const created = await restaurantService.createRestaurant(payload);
        const user = authService.getStoredUser();
        if (user) {
          authService.setStoredUser({
            ...user,
            restaurantId: created.id,
          });
        }
        setRestaurant(created);
        setForm(created);
        setGoogleMapsValue(created.googleMapsUrl ?? "");
        setSuccess(t("settings.createdSuccess"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Header
        title={t("settings.title")}
        subtitle={t("common.loading")}
      />
    );
  }

  return (
    <>
      <Header
        title={t("settings.title")}
        subtitle={
          restaurant
            ? t("settings.subtitle")
            : t("settings.createSubtitle")
        }
      />

      <form onSubmit={handleSubmit}>
        {(error || success) && (
          <Card className="mb-6">
            {error ? (
              <p className="text-sm text-red-700">{error}</p>
            ) : (
              <p className="text-sm text-emerald-700">{success}</p>
            )}
          </Card>
        )}

        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            {t("settings.basicInfo")}
          </h3>
          <div className="space-y-6">
            <Input
              label={t("auth.restaurantName")}
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="The Golden Fork"
              required
            />
            <Textarea
              label={t("settings.description")}
              value={form.description ?? ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder={t("settings.descriptionPlaceholder")}
              rows={4}
            />
          </div>
        </Card>

        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            {t("settings.images")}
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <ImageUpload
              label={t("settings.logo")}
              value={form.logoUrl}
              onChange={(url) => setForm({ ...form, logoUrl: url })}
              aspectRatio="square"
            />
            <ImageUpload
              label={t("settings.coverImage")}
              value={form.coverImageUrl}
              onChange={(url) => setForm({ ...form, coverImageUrl: url })}
              aspectRatio="wide"
            />
          </div>
        </Card>

        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            {t("settings.locationDelivery")}
          </h3>
          <div className="space-y-6">
            <Input
              label={t("auth.address")}
              value={form.address ?? ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main Street, City, State"
              required
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                {t("settings.city")}
              </label>
              <select
                value={form.city ?? ""}
                onChange={(e) =>
                  setForm({ ...form, city: e.target.value || undefined })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">{t("settings.selectCity")}</option>
                {CITIES_TAJIKISTAN.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={t("settings.deliveryTime")}
              value={form.deliveryTime ?? ""}
              onChange={(e) =>
                setForm({ ...form, deliveryTime: e.target.value })
              }
              placeholder={t("settings.deliveryTimePlaceholder")}
            />
            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <Input
                label="Google Maps location"
                value={googleMapsValue}
                onChange={(e) => {
                  setGoogleMapsValue(e.target.value);
                  setLocationMessage("");
                }}
                placeholder="Paste a Google Maps link or lat,lng"
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyGoogleMapsLocation}
                >
                  Use Google Maps location
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setGoogleMapsValue("");
                    setLocationMessage("");
                    setForm((prev) => ({
                      ...prev,
                      latitude: undefined,
                      longitude: undefined,
                      googleMapsUrl: undefined,
                    }));
                  }}
                >
                  Clear location
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Latitude"
                  value={
                    typeof form.latitude === "number" ? String(form.latitude) : ""
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      latitude: parseCoordinateInput(e.target.value),
                    })
                  }
                  placeholder="38.559800"
                />
                <Input
                  label="Longitude"
                  value={
                    typeof form.longitude === "number" ? String(form.longitude) : ""
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      longitude: parseCoordinateInput(e.target.value),
                    })
                  }
                  placeholder="68.787000"
                />
              </div>
              <p className="text-sm text-slate-500">
                Add the restaurant point from Google Maps so couriers can open the
                route to the restaurant using exact coordinates.
              </p>
              {locationMessage && (
                <p className="text-sm text-slate-600">{locationMessage}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            {t("settings.bankDetails")}
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            {t("settings.bankDetailsHint")}
          </p>
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 p-4 space-y-4">
              <h4 className="font-medium text-slate-800">
                {t("settings.alifBank")}
              </h4>
              <Input
                label={t("settings.cardNumber")}
                value={form.alifBankCardNumber ?? ""}
                onChange={(e) =>
                  setForm({ ...form, alifBankCardNumber: e.target.value || undefined })
                }
                placeholder="8600 1234 5678 9012"
              />
              <Input
                label={t("settings.walletNumber")}
                value={form.alifBankWalletNumber ?? ""}
                onChange={(e) =>
                  setForm({ ...form, alifBankWalletNumber: e.target.value || undefined })
                }
                placeholder="+992 90 123 4567"
              />
            </div>
            <div className="rounded-lg border border-slate-200 p-4 space-y-4">
              <h4 className="font-medium text-slate-800">
                {t("settings.dcBank")}
              </h4>
              <Input
                label={t("settings.cardNumber")}
                value={form.dcBankCardNumber ?? ""}
                onChange={(e) =>
                  setForm({ ...form, dcBankCardNumber: e.target.value || undefined })
                }
                placeholder="8600 1234 5678 9012"
              />
              <Input
                label={t("settings.walletNumber")}
                value={form.dcBankWalletNumber ?? ""}
                onChange={(e) =>
                  setForm({ ...form, dcBankWalletNumber: e.target.value || undefined })
                }
                placeholder="+992 90 123 4567"
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving
                ? t("settings.saving")
                : restaurant
                ? t("settings.saveChanges")
                : t("settings.createRestaurant")}
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
}
