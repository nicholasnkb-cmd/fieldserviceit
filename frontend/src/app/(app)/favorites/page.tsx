'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/favorites')
      .then((items) => setFavorites(items || []))
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Favorites</h1>
      {loading ? (
        <p className="text-gray-500">Loading favorites...</p>
      ) : favorites.length === 0 ? (
        <p className="text-gray-500">Click the star in the top bar to save pages here.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((favorite) => (
            <Link key={favorite.id} href={favorite.path} className="rounded border border-gray-200 bg-white p-4 hover:border-primary/40 hover:bg-blue-50">
              <div className="text-sm font-semibold text-gray-950">{favorite.label}</div>
              <div className="mt-1 text-xs text-gray-500">{favorite.path}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
