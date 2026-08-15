"use client";

import { useRef, useState } from "react";
import type { Dictionary } from "../../lib/i18n";
import type { AdminBrand, AdminCategory, AdminProduct, Specification } from "../../lib/api";
import { saveProduct, uploadImage } from "../../lib/admin-actions";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none";

const labelClass = "mb-1 block text-sm font-medium text-slate-700";

type AdminStrings = Dictionary["admin"];

export default function ProductForm({
  t,
  product,
  categories,
  brands,
  productId,
}: {
  t: AdminStrings;
  product?: AdminProduct | null;
  categories: AdminCategory[];
  brands: AdminBrand[];
  productId: number | null;
}) {
  const [specifications, setSpecifications] = useState<Specification[]>(
    product?.specifications ?? [],
  );
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    const file = fileInput.current?.files?.[0];
    if (!file) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { url } = await uploadImage(formData);
      setImages((current) => [...current, url]);
    } catch {
      setError(t.errorUpload);
    } finally {
      setUploading(false);
      if (fileInput.current) {
        fileInput.current.value = "";
      }
    }
  }

  async function submit(formData: FormData) {
    setError(null);
    // The controlled lists are serialized into the otherwise uncontrolled form.
    formData.set("specifications", JSON.stringify(specifications));
    images.forEach((url) => formData.append("image", url));
    try {
      await saveProduct(formData, productId);
    } catch {
      setError(t.errorGeneric);
    }
  }

  return (
    <form action={submit} data-testid="admin-product-form" className="space-y-6">
      {error && (
        <p
          data-testid="admin-form-error"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div>
        <label htmlFor="name" className={labelClass}>
          {t.productName}
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={product?.name ?? ""}
          placeholder={t.productNamePlaceholder}
          data-testid="admin-product-name"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          {t.description}
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description ?? ""}
          placeholder={t.descriptionPlaceholder}
          data-testid="admin-product-description"
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="price_gs" className={labelClass}>
            {t.priceGs}
          </label>
          <input
            id="price_gs"
            name="price_gs"
            type="number"
            min={0}
            required
            defaultValue={product?.price_gs ?? ""}
            data-testid="admin-product-price-gs"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="price_usd" className={labelClass}>
            {t.priceUsd}
          </label>
          <input
            id="price_usd"
            name="price_usd"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={product ? Number(product.price_usd) : ""}
            data-testid="admin-product-price-usd"
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="available"
            defaultChecked={product?.available ?? true}
            data-testid="admin-product-available"
            className="h-4 w-4 rounded border-slate-300"
          />
          {t.available}
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="orderable"
            defaultChecked={product?.orderable ?? true}
            data-testid="admin-product-orderable"
            className="h-4 w-4 rounded border-slate-300"
          />
          {t.buyable}
          <span className="text-xs text-slate-400">{t.buyableHint}</span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="certifications" className={labelClass}>
            {t.certifications}
          </label>
          <input
            id="certifications"
            name="certifications"
            defaultValue={product?.certifications.join(", ") ?? ""}
            placeholder={t.certificationsPlaceholder}
            data-testid="admin-product-certifications"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="category_id" className={labelClass}>
            {t.category}
          </label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={product?.category_id ?? ""}
            data-testid="admin-product-category"
            className={inputClass}
          >
            <option value="">{t.noCategory}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="brand_id" className={labelClass}>
            {t.brand}
          </label>
          <select
            id="brand_id"
            name="brand_id"
            defaultValue={product?.brand_id ?? ""}
            data-testid="admin-product-brand"
            className={inputClass}
          >
            <option value="">{t.noBrand}</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className={labelClass}>{t.specifications}</span>
        <ul data-testid="admin-spec-list" className="space-y-2">
          {specifications.map((specification, index) => (
            <li key={index} className="flex items-center gap-2">
              <input
                aria-label={t.specKey}
                value={specification.key}
                onChange={(event) =>
                  setSpecifications((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, key: event.target.value } : item,
                    ),
                  )
                }
                data-testid="admin-spec-key"
                className={inputClass}
              />
              <input
                aria-label={t.specValue}
                value={specification.value}
                onChange={(event) =>
                  setSpecifications((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, value: event.target.value } : item,
                    ),
                  )
                }
                data-testid="admin-spec-value"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() =>
                  setSpecifications((current) => current.filter((_, itemIndex) => itemIndex !== index))
                }
                data-testid="admin-spec-remove"
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                {t.removeSpecification}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setSpecifications((current) => [...current, { key: "", value: "" }])}
          data-testid="admin-spec-add"
          className="mt-2 text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          {t.addSpecification}
        </button>
      </div>

      <div>
        <span className={labelClass}>{t.images}</span>
        <p className="mb-2 text-xs text-slate-400">{t.uploadHint}</p>
        {images.length > 0 && (
          <ul data-testid="admin-image-list" className="mb-3 flex flex-wrap gap-3">
            {images.map((url) => (
              <li key={url} className="flex flex-col items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={t.images}
                  className="h-20 w-28 rounded-md border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImages((current) => current.filter((item) => item !== url))}
                  data-testid="admin-image-remove"
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  {t.removeImage}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-3">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            data-testid="admin-image-file"
            className="text-sm text-slate-600"
          />
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            data-testid="admin-image-upload"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {uploading ? t.imageUploading : t.uploadImage}
          </button>
        </div>
      </div>

      <button
        type="submit"
        data-testid="admin-product-save"
        className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
      >
        {t.save}
      </button>
    </form>
  );
}
