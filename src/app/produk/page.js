'use client';

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useRouter } from 'next/navigation';
import { openUrl } from '@tauri-apps/plugin-opener';

export default function ProductsPage() {
  const router = useRouter();

  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  
  const [errorId, setErrorId] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    internal_id: null,
    id: '',
    nama: '',
    harga: '',
    stock: '',
  });

  // ======================
  // LOAD DATA
  // ======================
  const loadProducts = async () => {
    setLoading(true);
    const data = await invoke('get_all_products');
    setProducts(data.sort((a, b) => a.id.localeCompare(b.id)));
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ======================
  // FORM HANDLER
  // ======================
  const openAdd = () => {
    setEditing(null);
    setForm({ internal_id: null, id: '', nama: '', harga: '', stock: '' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      internal_id: p.internal_id,
      id: p.id,
      nama: p.nama,
      harga: p.harga,
      stock: p.stock,
    });
    setShowModal(true);
  };

const submit = async () => {
  const existingProduct = products.find(p => p.id === form.id);

  // TAMBAH DATA
  if (!editing) {
    if (existingProduct) {
      setErrorId(true);
      return;
    }
  }

  // EDIT DATA
  if (editing) {
    // kalau ID dipakai produk lain
    if (
      existingProduct &&
      existingProduct.internal_id !== form.internal_id
    ) {
      setErrorId(true);
      return;
    }
  }

  // SIMPAN (ADD / UPDATE)
  await invoke('product', {
    internalId: form.internal_id,
    id: form.id,
    nama: form.nama,
    harga: Number(form.harga),
    stock: 0,
  });

  setShowModal(false);
  loadProducts();
  setErrorId(false);
};


  const remove = async (internalId) => {
    if (!confirm('Hapus produk ini?')) return;
    await invoke('delete_product', { internalId });
    loadProducts();
  };

  // ======================
  // RENDER
  // ======================
  return (
    <div className="p-6 pb-24">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-outline" onClick={() => router.push('/')}>
          ⬅ Back
        </button>
        <h1 className="text-2xl font-bold">Manajemen Produk</h1>
      </div>

      {/* TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
        {products.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-lg">
    <p className="font-semibold">
      Belum ada produk
    </p>
    <p className="text-sm mt-1">
      Tambahkan minimal 1 produk untuk dapat menggunakan aplikasi
    </p>
  </div>
  ) : (
          <>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>Harga</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.internal_id}>
                  <td>{p.id}</td>
                  <td>{p.nama}</td>
                  <td>Rp {p.harga.toLocaleString('id-ID')}</td>
                  <td className="flex gap-2 justify-center">
                    <button
                      className="btn btn-circle btn-sm btn-warning"
                      onClick={() => openEdit(p)}
                    >
                      <i className="fa-solid fa-pencil"></i>
                    </button>
                    <button
                      className="btn btn-circle btn-sm btn-error"
                      onClick={() => remove(p.internal_id)}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
        )}
        </>
            
      )}

      {/* FIXED ADD BUTTON */}
      <div className='fixed bottom-6 right-6'>
      <button className="btn btn-primary btn-lg btn-circle mr-3" onClick={async () => {await openUrl('https://kasir.mhai.my.id')}}><i className="text-lg fa-regular fa-circle-question"></i></button>
      <button
        className="btn btn-primary btn-lg rounded-2xl"
        onClick={openAdd}
      >
        <i className="fa-regular fa-square-plus text-xl mr-1"></i> Tambah Produk
      </button>
      </div>

      {/* MODAL */}
      {/* MODAL */}
{showModal && (
  <div className="modal modal-open">
    <div className="modal-box">
      <h3 className="font-bold text-lg mb-2">
        {editing ? 'Edit Produk' : 'Tambah Produk'}
      </h3>
      {errorId && (<p className='text-red-500'>ID sudah ada, pilih ID yang lain!</p>)}
      <form
      className='mt-4'
        onSubmit={async (e) => {
          e.preventDefault(); // cegah reload / tutup modal
          await submit();     // panggil fungsi submit manual
        }}
      >
        <div className="space-y-3">
          <input
            className="input input-bordered w-full"
            placeholder="ID Produk"
            value={form.id}
            onChange={(e) =>
              setForm({ ...form, id: e.target.value })
            }
            required
            autoFocus
          />
          <input
            className="input input-bordered w-full"
            placeholder="Nama Produk"
            value={form.nama}
            onChange={(e) =>
              setForm({ ...form, nama: e.target.value })
            }
            required
          />
          <input
            type="number"
            className="input input-bordered w-full"
            placeholder="Harga"
            value={form.harga}
            onChange={(e) =>
              setForm({ ...form, harga: e.target.value })
            }
            required
          />
        </div>

        <div className="modal-action">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setShowModal(false)
              setErrorId(false)
            }
            }
          >
            Batal
          </button>
          <button type="submit" className="btn btn-primary">
            Simpan
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}
