"use client";

import { useEffect, useState } from "react";
import { Truck, Users, DollarSign } from "lucide-react";
import { courierCompanyService, type Company } from "@/services/courier-company.service";
import { useTranslation } from "@/i18n/context";

export default function DashboardPage() {
  const { t } = useTranslation();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courierCompanyService
      .getMe()
      .then(setCompany)
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, []);

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
        {t("dashboard.loadFailed")}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">
        {t("dashboard.title")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-semibold text-slate-900">{t("dashboard.company")}</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{company.name}</p>
        </div>

        <div className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-semibold text-slate-900">{t("dashboard.deliveryFee")}</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {company.delivery_fee} с.
          </p>
          <p className="text-sm text-slate-500 mt-1">{t("dashboard.perOrder")}</p>
        </div>

        <div className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <span className="font-semibold text-slate-900">{t("dashboard.couriers")}</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {company.courier_count}
          </p>
          <p className="text-sm text-slate-500 mt-1">{t("dashboard.inYourCompany")}</p>
        </div>
      </div>

      <div className="mt-8 p-6 border border-slate-200 rounded-xl bg-white shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          {t("dashboard.quickStart")}
        </h2>
        <p className="text-slate-600 mb-4">{t("dashboard.quickStartDesc")}</p>
        <a
          href="/dashboard/couriers"
          className="inline-flex items-center gap-2 font-medium text-emerald-600 hover:text-emerald-700"
        >
          {t("dashboard.goToCouriers")}
        </a>
      </div>
    </div>
  );
}
