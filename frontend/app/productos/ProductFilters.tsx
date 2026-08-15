"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Facet } from "../lib/api";

const CERTIFICATIONS = ["FDA", "CE", "ISO"];

export default function ProductFilters({
  categories,
  brands,
  currentQuery,
}: {
  categories: Facet[];
  brands: Facet[];
  currentQuery: string;
}) {
  const router = useRouter();
  const current = new URLSearchParams(currentQuery);
  const [q, setQ] = useState(current.get("q") ?? "");
  const [category, setCategory] = useState(current.get("category") ?? "");
  const [brand, setBrand] = useState(current.get("brand") ?? "");
  const [certification, setCertification] = useState(current.get("certification") ?? "");
  const [priceMin, setPriceMin] = useState(current.get("price_min") ?? "");
  const [priceMax, setPriceMax] = useState(current.get("price_max") ?? "");
  const [sort, setSort] = useState(current.get("sort") ?? "newest");

  function apply() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (certification) params.set("certification", certification);
    if (priceMin) params.set("price_min", priceMin);
    if (priceMax) params.set("price_max", priceMax);
    params.set("sort", sort);
    router.push(`/productos?${params.toString()}`);
  }

  const selectClass =
    "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700";

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Buscar
        <input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Nombre o descripción"
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Categoría
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className={selectClass}
        >
          <option value="">Todas</option>
          {categories.map((facet) => (
            <option key={facet.slug} value={facet.slug}>
              {facet.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Marca
        <select
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
          className={selectClass}
        >
          <option value="">Todas</option>
          {brands.map((facet) => (
            <option key={facet.slug} value={facet.slug}>
              {facet.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Certificación
        <select
          value={certification}
          onChange={(event) => setCertification(event.target.value)}
          className={selectClass}
        >
          <option value="">Cualquiera</option>
          {CERTIFICATIONS.map((cert) => (
            <option key={cert} value={cert}>
              {cert}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Precio mín. (Gs)
        <input
          type="number"
          min="0"
          value={priceMin}
          onChange={(event) => setPriceMin(event.target.value)}
          className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Precio máx. (Gs)
        <input
          type="number"
          min="0"
          value={priceMax}
          onChange={(event) => setPriceMax(event.target.value)}
          className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Ordenar
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className={selectClass}
        >
          <option value="newest">Más recientes</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
        </select>
      </label>
      <button
        type="submit"
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
      >
        Aplicar
      </button>
    </form>
  );
}
