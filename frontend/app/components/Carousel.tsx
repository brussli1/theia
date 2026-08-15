"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ProductCard } from "../lib/api";
import type { Dictionary } from "../lib/i18n";

export default function Carousel({
  products,
  t,
}: {
  products: ProductCard[];
  t: Dictionary["home"];
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % products.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [products.length]);

  if (products.length === 0) {
    return null;
  }

  const slide = products[index];
  const navigate = (delta: number) => {
    setIndex((current) => (current + delta + products.length) % products.length);
  };

  return (
    <div data-testid="carousel" className="relative overflow-hidden rounded-2xl bg-slate-900">
      <Link
        data-testid="carousel-slide"
        href={`/productos/${slide.slug}`}
        className="block h-72 w-full"
      >
        {slide.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.image}
            alt={slide.name}
            className="h-full w-full object-cover opacity-80"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white">
            {slide.name}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900 to-transparent p-6 pt-16">
          <h2 className="text-xl font-semibold text-white">{slide.name}</h2>
        </div>
      </Link>
      {products.length > 1 && (
        <>
          <button
            type="button"
            aria-label={t.previous}
            onClick={() => navigate(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur hover:bg-white/40"
          >
            ←
          </button>
          <button
            type="button"
            aria-label={t.next}
            onClick={() => navigate(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur hover:bg-white/40"
          >
            →
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {products.map((product, i) => (
              <button
                key={product.slug}
                type="button"
                aria-label={`${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full ${
                  i === index ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
