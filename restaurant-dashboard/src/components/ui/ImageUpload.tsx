"use client";

import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { useTranslation } from "@/i18n/context";

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  aspectRatio?: "square" | "wide" | "portrait";
}

export function ImageUpload({
  label,
  value,
  onChange,
  aspectRatio = "square",
}: ImageUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const aspectRatioClass =
    aspectRatio === "wide"
      ? "aspect-video"
      : aspectRatio === "portrait"
        ? "aspect-[3/4]"
        : "aspect-square";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {value ? (
        <div className="relative group">
          <div
            className={`rounded-lg border border-slate-200 overflow-hidden bg-slate-100 ${aspectRatioClass}`}
          >
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-100"
            >
              {t("imageUpload.change")}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-orange-400 hover:bg-orange-50/30 transition-colors flex flex-col items-center justify-center gap-2 py-8 ${aspectRatioClass}`}
        >
          <Upload className="w-10 h-10 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">
            {t("imageUpload.clickToUpload")}
          </span>
          <span className="text-xs text-slate-500">
            {t("imageUpload.pngJpg")}
          </span>
        </button>
      )}
    </div>
  );
}
