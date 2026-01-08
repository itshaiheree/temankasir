'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import Content from './components/content';
import Header from './components/header';
import { invoke } from '@tauri-apps/api/core';
import { useRouter } from 'next/navigation';
import { refresh } from 'next/cache'


import { useCartStore } from '@/store/useCartSore';

import { openUrl } from '@tauri-apps/plugin-opener';

const MAX_MSG = 300;
const MAX_NAME = 25;
const MAX_NAME_TOKO = 15;
const MAX_ALAMAT_TOKO = 25;
const MAX_NOMER_TOKO = 12;

export default function Element() {
const [visible, setVisible] =  useState('');
  const [formData, setFormData] = useState({ name: '', msg: '' });
  const textareaRef = useRef(null);
  const currentRef = useRef(null);
  const [submit, setSubmit] = useState(false);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [openReset, setOpenReset] = useState(false);
  const addToko = useRef(null)
  

  const [toko, setToko] = useState({
  nama: "",
  alamat: "",
  telpon: ""
});


  useEffect(() => {
    async function mbuh() {
    const dataLol = await invoke("get_store_config");

        if (dataLol === null) {
          setOpen(true);
          setEdit(false);
        } else {
          setToko(dataLol)
        }
    }

  mbuh()
}, [])

useEffect(() => {
    const modal = addToko.current;
    if (!modal) return;

    const handleCancel = (e) => {
      e.preventDefault(); // BLOK ESC
    };

    modal.addEventListener("cancel", handleCancel);

    return () => {
      modal.removeEventListener("cancel", handleCancel);
    };
  }, []);

  
  const [refreshKey, setRefreshKey] = useState(0);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleChange = (e) => {
    if (submit) {
      setFormData({ name: '', msg: '' });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const clampTelpon = (v) => v.slice(0, MAX_NOMER_TOKO);

  const handleChangeToko = (e) => {
  const { name, value } = e.target;

  if (name === "telpon") {
    const numeric = value.replace(/\D/g, "");
    const clamped = clampTelpon(numeric);

    setToko(prev => ({
      ...prev,
      telpon: clamped
    }));
    return;
  }

  setToko(prev => ({
    ...prev,
    [name]: value
  }));
};

  const setProducts = useCartStore(s => s.setProducts);

  useEffect(() => {
    async function load() {
      const data = await invoke('get_all_products');
      setProducts(data);
    }
    load();
  }, []);
  
  const items = useCartStore(state => state.cart);

async function deleteAllConfig() {
  try {
              setOpenReset(false)
  await invoke('reset_config_and_products');
  alert("Konfigurasi dan data produk berhasil di reset!")
  setInterval(() => {
    window.location.reload()
  }, 1000)
              
} catch(err){
console.log(err)
}
}

  const cart = items.length === 0 ? null : items;
  const total = useCartStore(s => s.totalHarga());
  const remove = useCartStore(s => s.removeItem);

  const handleSubmitToko = async (e) => {
  e.preventDefault();

  if (!toko.nama) {
    alert("Nama toko harus diisi!");
    return;
  }

  // Ubah alamat/telpon kosong jadi None di Rust
  const config = {
    nama: toko.nama,
    alamat: toko.alamat || null,
    telpon: toko.telpon || null
  };

  try {
    await invoke("set_store_config", config);
    setOpen(false);
    
    setRefreshKey(prev => prev + 1);
  } catch (err) {
    console.error(err);
    alert("Gagal simpan config toko");
  }
};


console.log(items)

  return (
      <>
      <link rel="stylesheet" type="text/css" href="/print.css" media="print"></link>
      <Header key={refreshKey} />
        {/* ================= ISI ================= */}
        <section
          id="isiData"
          className="
    flex items-center justify-center
    text-center
    overflow-hidden w-full"
        >
          <Content>
            <div
              className="flex flex-col items-center justify-center gap-1 py-3 "
            >
              

{cart === null ? (
  <div className="py-20 text-center text-gray-400 text-lg">
    <p className="font-semibold">
      Aplikasi siap menerima input ID / Scan Barcode
    </p>
    <p className="text-sm mt-1">
      Masukkan ID produk atau scan barcode untuk memulai transaksi
    </p>
  </div>
) : (
  <>
              <div className="overflow-x-auto">
  <table className="table table-lg text-center">
    {/* head */}
    <thead>
      <tr>
        <th>Barang</th>
        <th>Qty</th>
        <th>Harga per item (Rp)</th>
        <th>Total (Rp)</th>
      </tr>
    </thead>
    <tbody>
      {cart.map(item => (
        <tr key={item.id}>
        <td>{item.nama}</td>
        <th>x{item.qty}</th>
        <td>{item.harga.toLocaleString('id-ID')}</td>
        <td>{(item.harga * item.qty).toLocaleString('id-ID')}</td>
      </tr>
      ))}

    </tbody>
  </table>
  </div>
  <div className="flex w-full text-lg mt-5">
    <p>Total Pembayaran: </p>
  <p className="ml-auto">
    <span className='font-bold ml-5'>{total.toLocaleString('id-ID')}</span>
  </p>
</div>



</>
      
)}
      </div>
      </Content>
        </section>

        {/* ==== FOOTER BUTTON ==== */}
         {/* BUTTON */}
      <div className="fixed bottom-0 inset-x-0 z-50">
        <div className="w-full mx-auto px-3 pt-5 pb-2">
          <div className="flex justify-center">
            <button className="btn btn-primary btn-lg btn-circle mr-3" onClick={async () => {await openUrl('https://kasir.mhai.my.id')}}><i className="text-lg fa-regular fa-circle-question"></i></button>
              <Link href="/print" className="btn btn-primary btn-lg w-45 rounded-2xl mb-2">Checkout</Link>
          <div className="dropdown dropdown-end dropdown-top">
  <div tabIndex={0} role="button" className="btn btn-primary btn-lg btn-circle ml-3 mb-2"><i className="fa-solid fa-bars"></i></div>
  <ul tabIndex="-1" className="dropdown-content menu bg-primary rounded-3xl z-1 w-75 p-2 shadow-sm mb-3">
    <li><Link href="/produk" className="btn btn-primary btn-lg rounded-2xl">List Produk</Link></li>
    <li><button className="btn btn-primary btn-lg rounded-2xl" onClick={() => {
      setOpen(true) 
      setEdit(true) 
      }}>Ganti Identitas Toko</button></li>
    <li><button className="btn btn-primary btn-lg rounded-2xl" onClick={() => { 
      setOpenReset(true)
      }}>Reset Semua Konfigurasi</button></li>
  </ul>
</div>
          </div>
        </div>
      </div>

      {/* MODAL CONFIRM RESET */}
      {openReset && (
      <div className='modal modal-open'>
        <div className="modal-box rounded-2xl">
          
          <h2 className="font-bold text-2xl text-red-600 text-center">
            ! PERHATIAN !
          </h2>
                <h3 className='text-lg mt-3 text-center'>Tindakan ini akan menghapus seluruh data kasir, meliputi nama, riwayat dan list produk.<br />Apakah anda ingin melanjutkannya?</h3>
            <button type="submit" onClick={() => {
              deleteAllConfig()
            }} className="w-full btn bg-red-500 text-white mt-5 rounded-xl">
              Ya, lanjutkan
            </button>

          <form method="dialog" className="mt-2">
            <button onClick={() => {setOpenReset(false)}} className="btn btn-outline w-full rounded-xl">
              Close
            </button>
          </form>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button className='cursor-default'>close</button>
        </form>
      </div>
      )}

      {/* MODAL TAMBAH NAMA TOKO */}
      {open && (
  <div className="modal modal-open">
    {/* BACKDROP */}
    <div
      className="modal-backdrop cursor-default backdrop-blur-lg bg-black/40"
      onClick={edit ? () => setOpen(false) : undefined}
    />

    {/* MODAL BOX */}
    <div className="modal-box rounded-2xl text-center">
      {!edit ? (
        <>
          <h3 className="font-bold text-lg text-center">Halo 👋</h3>
          <p>Selamat datang! Silahkan isi nama toko anda dibawah</p>
        </>
      ) : (
        <h3 className="font-bold text-lg text-center">
          Edit Identitas Toko
        </h3>
      )}

      <form
        onSubmit={handleSubmitToko}
        className="flex flex-col gap-1 mt-3"
      >
        {/* NAMA */}
              <legend className="fieldset-legend text-lg">
                Nama ({toko.nama.length}/{MAX_NAME_TOKO})<span className="text-red-500">*</span>
              </legend>

              <input
                type="text"
                name="nama"
                value={toko.nama}
                onChange={handleChangeToko}
                required
                maxLength={MAX_NAME_TOKO}
                className="input w-full"
                placeholder="Contoh: Toko Herman"
              />

              {/* Alamat */}
              <legend className="fieldset-legend text-lg">
                Alamat ({(toko.alamat ?? '').length}/{MAX_ALAMAT_TOKO})
              </legend>

              <input
                type="text"
                name="alamat"
                value={(toko.alamat ?? '')}
                onChange={handleChangeToko}
                maxLength={MAX_ALAMAT_TOKO}
                className="input w-full"
                placeholder="Contoh: Jl. Sesame No. 1"
              />

              {/* No. Telephone */}
              <legend className="fieldset-legend text-lg">
                Nomor Telephone ({(toko.telpon ?? '').length}/{MAX_NOMER_TOKO})
              </legend>

              <input
                name="telpon"
                value={(toko.telpon ?? '')}
                onChange={handleChangeToko}
                type="number" pattern="/^-?\d+\.?\d*$/"
                className="input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Contoh: 08123456789"
              />

        <button className="btn btn-primary mt-5 rounded-xl">
          Konfirmasi
        </button>
        {edit && (
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="btn btn-outline mt-1 rounded-xl">
            Batal
      </button>
    )}
      </form>
    </div>
  </div>
)}

      </>
  );
};
