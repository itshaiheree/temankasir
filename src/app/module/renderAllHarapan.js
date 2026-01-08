'use server';

import { getAllHarapan } from "@/app/services/harapanService";


export default async function RenderAllHarapan() {
    const res = await getAllHarapan();

  if (!res.success) {
    return (
      <div className="p-6 text-red-500">
        Gagal memuat data harapan
      </div>
    );

  }

  return res
}