"use client";

import { Bell } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="flex items-center justify-between py-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && (
          <p className="text-slate-600 mt-0.5">{subtitle}</p>
        )}
      </div>
      <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
        <Bell className="w-6 h-6 text-slate-600" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
      </button>
    </header>
  );
}
