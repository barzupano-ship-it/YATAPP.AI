"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, ArrowLeft, UtensilsCrossed } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useTranslation } from "@/i18n/context";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ImageUpload } from "@/components/ui/ImageUpload";
import {
  menuService,
  MenuCategory,
  MenuItem,
} from "@/services/menu.service";
import { useRestaurantId } from "@/hooks/useRestaurant";

type ItemFormProps = {
  form: { name: string; description: string; price: number; category: string; imageUrl?: string };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; description: string; price: number; category: string; imageUrl?: string }>>;
  error: string | null;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
};

function ItemForm({ form, setForm, error, saving, onSubmit, onCancel, submitLabel }: ItemFormProps) {
  const { t } = useTranslation();
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
      <Input
        label={t("menu.name")}
        value={form.name}
        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        placeholder={t("menu.namePlaceholder")}
        required
      />
      <Textarea
        label={t("settings.description")}
        value={form.description}
        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        placeholder={t("menu.descriptionPlaceholder")}
        rows={3}
      />
      <Input
        label={t("menu.price")}
        type="number"
        step="0.01"
        min="0"
        value={form.price === 0 ? "" : form.price}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
        }
        placeholder={t("menu.pricePlaceholder")}
        required
      />
      <ImageUpload
        label={t("menu.image")}
        value={form.imageUrl}
        onChange={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
        aspectRatio="square"
      />
      <Input
        label={t("menu.category")}
        value={form.category}
        onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
        placeholder={t("menu.categoryPlaceholderShort")}
        required
      />
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? t("settings.saving") : submitLabel}
        </Button>
      </div>
    </form>
  );
}

const emptyItem = {
  name: "",
  description: "",
  price: 0,
  category: "",
  available: true,
};

export function CategoryDetailPage() {
  const params = useParams();
  const { t } = useTranslation();
  const restaurantId = useRestaurantId();
  const categoryId = params.categoryId as string;

  const [category, setCategory] = useState<MenuCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({
    ...emptyItem,
    imageUrl: "" as string | undefined,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategory = useCallback(() => {
    if (!restaurantId) {
      setCategory(null);
      setLoading(false);
      return;
    }
    menuService.getCategory(restaurantId, categoryId).then((data) => {
      setCategory(data);
      setLoading(false);
    });
  }, [categoryId, restaurantId]);

  useEffect(() => {
    loadCategory();
  }, [loadCategory]);

  const resetForm = () => {
    setForm({
      ...emptyItem,
      category: category?.name ?? "",
      imageUrl: undefined,
    });
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!category || !form.name.trim() || !restaurantId) return;
    const price = Number(form.price);
    if (isNaN(price) || price < 0) return;
    setSaving(true);
    try {
      await menuService.addItem(restaurantId, {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        category: category.name,
        categoryId,
        imageUrl: form.imageUrl || undefined,
        available: true,
      });
      resetForm();
      loadCategory();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.registrationFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !form.name.trim() || !restaurantId) return;
    setSaving(true);
    try {
      await menuService.updateItem(restaurantId, editingItem.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        imageUrl: form.imageUrl || undefined,
      });
      resetForm();
      loadCategory();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(t("menu.deleteItemConfirm", { name: item.name }))) return;
    if (!restaurantId) return;
    await menuService.deleteItem(restaurantId, item.id);
    loadCategory();
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available ?? true,
      imageUrl: item.imageUrl ?? "",
    });
  };

  const openAddModal = () => {
    setForm({
      ...emptyItem,
      category: category?.name ?? "",
      imageUrl: undefined,
    });
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <Header title={t("menu.title")} subtitle={t("common.loading")} />
    );
  }

  if (!restaurantId) {
    return (
      <>
        <Header title={t("menu.title")} subtitle={t("menu.createRestaurantFirst")} />
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("menu.goToRestaurantSettings")}
        </Link>
      </>
    );
  }

  if (!category) {
    return (
      <>
        <Header title="" subtitle={t("menu.notFound")} />
        <Link
          href="/dashboard/menu"
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("menu.backToMenu")}
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/menu"
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Header
          title={category.name}
          subtitle={
            category.items.length === 1
              ? t("menu.itemsCountOne")
              : t("menu.itemsCount", { count: String(category.items.length) })
          }
        />
      </div>

      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-600">{t("menu.foodItemsInCategory")}</p>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          {t("menu.addFood")}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {category.items.map((item) => (
          <Card key={item.id} padding="none" className="overflow-hidden">
            <div className="aspect-square bg-slate-100 relative">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UtensilsCrossed className="w-16 h-16 text-slate-300" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(item)}
                  className="bg-white/90 hover:bg-white shadow-sm"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteItem(item)}
                  className="bg-white/90 hover:bg-white shadow-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-900 truncate">{item.name}</h3>
              <p className="text-lg font-bold text-orange-600 mt-2">
                {item.price.toFixed(0)} с.
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <Card className="w-full max-w-md my-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {t("menu.addFoodItem")}
            </h3>
            <ItemForm
              form={form}
              setForm={setForm}
              error={error}
              saving={saving}
              onSubmit={handleAddItem}
              onCancel={resetForm}
              submitLabel={t("menu.addFood")}
            />
          </Card>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <Card className="w-full max-w-md my-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {t("menu.editFood")}
            </h3>
            <ItemForm
              form={form}
              setForm={setForm}
              error={error}
              saving={saving}
              onSubmit={handleEditItem}
              onCancel={resetForm}
              submitLabel={t("common.save")}
            />
          </Card>
        </div>
      )}
    </>
  );
}
