'use client';

import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useCartStore } from "@/store/useCartSore";

export default function Header() {
  const [query, setQuery] = useState("");
  const [queryIya, setQueryIya] = useState("");
  const inputRef = useRef(null);
  const inputRefNama = useRef(null);
  const [namaToko, setNamaToko] = useState("");

  const addToCartById = useCartStore(s => s.addToCartById);
  const addToCartByName = useCartStore(s => s.addToCartByName);
  // Gunakan useEffect untuk detect perubahan state
 const [isToggleActive, setIsToggleActive] = useState(() => {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem("autoSubmit");
  return saved ? JSON.parse(saved) : false;
});

  useEffect(() => {
    localStorage.setItem('autoSubmit', JSON.stringify(isToggleActive));
  }, [isToggleActive]);
  
  // Ambil nama toko dari config
  useEffect(() => {
    async function fetchConfig() {
      try {
        const config = await invoke("get_store_config");
        if (!config) {
          setNamaToko("");
        } else {
          setNamaToko(config.nama);
        }
      } catch (err) {
        console.error("Gagal load config:", err);
      }
    }
    fetchConfig();
  }, []);

  // Fokus input ID saat mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handler otomatis ketika user mengetik ID
const handleInputChange = async (e) => {
  const value = e.target.value;
  const valueSend = e.target.value.trim();
  setQuery(value);

  if (!value) return;

 if (isToggleActive) {
  try {
    const result = await addToCartById(valueSend);
    if (result === "yes") {
      setQuery(""); // Clear input after successful submit
      inputRef.current?.focus(); // Refocus for next input
    }
  } catch (err) {
    console.warn("Produk tidak ditemukan:", err);
  }
}
};

const handleInputNamaChange = async (e) => {
  const value = e.target.value;
  const valueSend = e.target.value.trim();
  setQueryIya(value);
  if (!value) return;

  
  if (isToggleActive) {
  try {
    const result = await addToCartByName(valueSend);
    if (result === "yes") {
      setQueryIya(""); // Clear input after successful submit
      inputRefNama.current?.focus(); // Refocus for next input
    }
  } catch (err) {
    console.warn("Produk tidak ditemukan:", err);
  }
}
};

  return (
    <div className="sticky top-0 z-20 shadow-md backdrop-blur-sm bg-base-300/90">
      <header className="navbar py-3">
        {/* Desktop */}
        <div className="navbar-start ml-5 hidden md:flex">
          <a className="font-bold">ID: </a>
        <input
  ref={inputRef}
  type="text"
  placeholder="Input ID Disini"
  className="input rounded-xl ml-2"
  value={query}
  onChange={handleInputChange}
  onKeyDown={async (e) => {
    if (e.key !== "Enter") return;

    e.preventDefault();

    const id = e.currentTarget.value.trim();
    if (!id) return;

    try {
      await addToCartById(id);
      setQuery("");
    } catch (err) {
      alert("Produk tidak ditemukan");
      console.error(err);
    }
  }}
/>


          <a className="font-bold ml-5">Nama: </a>
          <input
  ref={inputRefNama}
  type="text"
  placeholder="Input By Nama Disini"
  className="input rounded-xl ml-2"
  value={queryIya}
  onChange={handleInputNamaChange}
  onKeyDown={async (e) => {
    if (e.key !== "Enter") return;

    e.preventDefault();

    const nama = e.currentTarget.value.trim();
    if (!nama) return;

    try {
      await addToCartByName(nama);
      setQueryIya("");
    } catch (err) {
      alert("Produk tidak ditemukan");
      console.error(err);
    }
  }}
/>

        </div>


        {/* Mobile */}
        <div className="navbar-start ml-5 md:hidden inline">
          <h1 className="text-xl font-bold">{namaToko}</h1>
        </div>

        <div className="navbar-center ml-5">
<input
          type="checkbox"
           checked={isToggleActive}
          onChange={() => setIsToggleActive(!isToggleActive)}
          className="toggle toggle-sm toggle-primary"
        />
        <a className="ml-2 text-md">Auto Submit</a>

<div className="relative inline-block">
  <button className="peer ml-2 flex items-center">
    <i className="text-xs fa-regular fa-circle-question"></i>
  </button>

  <div
    className="
      absolute
      top-full
      left-1/2
      -translate-x-1/2
      mt-2

      z-[99999]

      min-w-[420px]
      max-w-[95vw]
      sm:max-w-xl
      lg:max-w-2xl

      bg-base-300
      border
      rounded-xl
      shadow-xl

      opacity-0
      scale-95
      invisible

      transition-all
      duration-150

      peer-hover:opacity-100
      peer-hover:scale-100
      peer-hover:visible

      hover:opacity-100
      hover:scale-100
      hover:visible
    "
  >
    <div className="p-3 text-xs text-center leading-relaxed whitespace-normal break-words space-y-2">
      <p>
        Fungsi ini memungkinkan kamu men-submit barang ke keranjang
        hanya dengan mengetikkan ID/Nama barang di kolom yang tersedia
      </p>

      <p>
        Pelajari lebih lanjut{" "}
        <a
          className="link link-primary font-semibold"
          onClick={async () =>
            await openUrl("https://kasir.mhai.my.id/autosubmit")
          }
        >
          di sini
        </a>
      </p>
    </div>
  </div>
</div>

        </div>

        <div className="navbar-end">
          <div className="mr-30 text-3xl font-bold hidden md:inline">
            <h1>{namaToko}</h1>
          </div>
          <div className="flex flex-col items-end text-right gap-0 mr-5">
            <a className="text-[10px]">Powered by:</a>
            <h1
              className="font-bold cursor-pointer hover:underline text-2xl"
              onClick={async () => await openUrl("https://kasir.mhai.my.id")}
            >
              TemanKasir
            </h1>
            <h2 className="text-sm font-light">
              By{" "}
              <a
                className="cursor-pointer link-hover font-semibold"
                onClick={async () => await openUrl("https://mhai.my.id")}
              >
                mhai.my.id
              </a>
            </h2>
          </div>
        </div>
      </header>
    </div>
  );
}
