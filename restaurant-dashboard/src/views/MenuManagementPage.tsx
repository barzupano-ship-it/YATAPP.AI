"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, UtensilsCrossed, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  menuService,
  MenuCategory,
} from "@/services/menu.service";
import { useTranslation } from "@/i18n/context";
import { useRestaurantId } from "@/hooks/useRestaurant";

export function MenuManagementPage() {
  const { t } = useTranslation();
  const restaurantId = useRestaurantId();
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(
    null
  );
  const [categoryName, setCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadMenu = useCallback(() => {
    setError("");
    if (!restaurantId) {
      setMenu([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    menuService
      .getMenu(restaurantId)
      .then((data) => {
        setMenu(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t("menu.loadFailed"));
        setLoading(false);
      });
  }, [restaurantId, t]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || !restaurantId) return;
    setSaving(true);
    try {
      await menuService.addCategory(restaurantId, categoryName.trim());
      setCategoryName("");
      setShowAddModal(false);
      loadMenu();
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !categoryName.trim() || !restaurantId) return;
    setSaving(true);
    try {
      await menuService.updateCategory(
        restaurantId,
        editingCategory.id,
        categoryName.trim()
      );
      setEditingCategory(null);
      setCategoryName("");
      loadMenu();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (category: MenuCategory) => {
    const msg =
      t("menu.deleteCategoryConfirm", { name: category.name }) +
      (category.items.length > 0
        ? " " + t("menu.deleteCategoryItems", { count: String(category.items.length) })
        : "");
    if (!confirm(msg)) return;
    if (restaurantId) await menuService.deleteCategory(restaurantId, category.id);
    loadMenu();
  };

  const openEditModal = (category: MenuCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setEditingCategory(null);
    setCategoryName("");
  };

  if (loading) {
    return (
      <Header title={t("menu.title")} subtitle={t("common.loading")} />
    );
  }

  if (!restaurantId) {
    return (
      <>
        <Header
          title={t("menu.title")}
          subtitle={t("menu.createRestaurantFirst")}
        />
        <Card className="max-w-2xl">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {t("menu.createRestaurantTitle")}
          </h3>
          <p className="text-slate-600 mb-6">
            {t("menu.createRestaurantDescription")}
          </p>
          <Link href="/dashboard/settings">
            <Button>{t("menu.goToRestaurantSettings")}</Button>
          </Link>
        </Card>
      </>
    );
  }

  return (
    <>
      <Header
        title={t("menu.title")}
        subtitle={t("menu.subtitle")}
      />

      {error && (
        <Card className="mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-600">
          {menu.length === 1
            ? t("menu.categoriesCountOne")
            : t("menu.categoriesCount", { count: String(menu.length) })}
        </p>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t("menu.addCategory")}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {menu.map((category) => (
          <Card key={category.id}>
            <div className="flex items-start justify-between">
              <Link
                href={`/dashboard/menu/${category.id}`}
                className="flex-1 min-w-0 group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate group-hover:text-orange-600">
                      {category.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {category.items.length === 1
                        ? t("menu.itemsCountOne")
                        : t("menu.itemsCount", { count: String(category.items.length) })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-orange-600 shrink-0" />
                </div>
              </Link>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    openEditModal(category);
                  }}
                  title="Edit category"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteCategory(category);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {t("menu.addCategory")}
            </h3>
            <form onSubmit={handleAddCategory}>
              <Input
                label={t("menu.categoryName")}
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder={t("menu.categoryPlaceholder")}
                required
                autoFocus
              />
              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModals}
                  className="flex-1"
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? t("menu.adding") : t("menu.addCategory")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {t("menu.editCategory")}
            </h3>
            <form onSubmit={handleEditCategory}>
              <Input
                label={t("menu.categoryName")}
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder={t("menu.categoryPlaceholder")}
                required
                autoFocus
              />
              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModals}
                  className="flex-1"
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? t("settings.saving") : t("common.save")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
