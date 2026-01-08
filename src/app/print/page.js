'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { invoke } from '@tauri-apps/api/core';

import { useCartStore } from '@/store/useCartSore';

export default function PrintPage() {
  const router = useRouter();
  const printedRef = useRef(false);
  const clearCart = useCartStore(state => state.clearCart);

 const [toko, setToko] = useState({
    nama: "",
    alamat: "",
    telpon: ""
  });
  
useEffect(() => {
    async function how(){
      const config = await invoke("get_store_config");
      if(!config){
        return
      } else{
      setToko({
    nama: config.nama,
    alamat: config.alamat,
    telpon: config.telpon
  })
      }
    }
    
    how()
}, [])


  const items = useCartStore.getState().cart;
  const total = useCartStore.getState().totalHarga();




  if (items.length === 0) {
      if (printedRef.current) return;
      printedRef.current = true;
      if (typeof window !== "undefined") {
      alert("Harap masukkan minimal 1 produk kedalam keranjang/cart");
}

      
      router.replace('/');
  } else {
    useEffect(() => {
    setTimeout(() => {
    if (printedRef.current) return;
    printedRef.current = true;

    const handleAfterPrint = () => {
      clearCart()
      router.replace('/');
    };

    window.addEventListener('afterprint', handleAfterPrint);

    window.print();

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, 500)
  }, [router]);
  }
  
  return (
    <div className="receipt">
      <h1 className="title">{toko.nama}</h1>
      <p className="center">{toko.alamat}</p>
      {toko.telpon !== null && (
      <p className="center">Telp: {toko.telpon}</p>
      )}

      <hr />

      <div className="info">
        <span>Tanggal:</span>
        <span>{new Date().toLocaleString('id-ID')}</span>
      </div>

      <hr />

      {items.map((item, i) => (
        <div key={i} className="item">
          <div>{item.nama}</div>
          <div className="row">
            <span>{item.qty} x {item.harga.toLocaleString('id-ID')}</span>
            <span>{(item.qty * item.harga).toLocaleString('id-ID')}</span>
          </div>
        </div>
      ))}

      <hr />

      <div className="total">
        <span>TOTAL</span>
        <span>{total.toLocaleString('id-ID')}</span>
      </div>

      <hr />

      <p className="center">Terima Kasih!</p>
      <hr />
      <p className="center mt-1">Barang yang sudah dibeli</p>
      <p className="center">tidak dapat dikembalikan</p>
      {/* STYLE THERMAL */}
      <style jsx>{`
        @page {
          size: 58mm auto; /* ganti 80mm jika printer 80mm */
          margin: 0;
        }

        body {
          margin: 0;
        }

        .receipt {
          width: 58mm;
          padding: 5mm;
          font-family: monospace;
          font-size: 12px;
        }

        .title {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
        }

        .center {
          text-align: center;
        }

        hr {
          border: none;
          border-top: 1px dashed #000;
          margin: 6px 0;
        }

        .info {
          display: flex;
          justify-content: space-between;
        }

        .item {
          margin-bottom: 4px;
        }

        .row {
          display: flex;
          justify-content: space-between;
        }

        .total {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}