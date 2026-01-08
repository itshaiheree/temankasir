'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MIN_CHARS = 3;

export default function InputField({
  data = [],
  placeholder = 'Cari...',
  onSelect,
  autoClear = true,      // 🔥 NEW
  autoFocusAfter = true // 🔥 NEW
}) {
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const itemRefs = useRef([]);
  const submittedRef = useRef(false);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  /* ===================== FILTER ===================== */
  const filtered = data.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  /* ===================== POSITION ===================== */
  const calculatePosition = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  };

  /* ===================== OPEN / CLOSE ===================== */
  const openDropdown = () => {
    if (query.length < MIN_CHARS) return;
    calculatePosition();
    setOpen(true);
    requestAnimationFrame(() => setVisible(true));
  };

  const closeDropdown = () => {
    setVisible(false);
    setActiveIndex(-1);
    setTimeout(() => setOpen(false), 150);
  };

  /* ===================== CLEAR AFTER SUBMIT ===================== */
  const handleSubmit = item => {
    if (submittedRef.current) return;

    submittedRef.current = true;
    closeDropdown();
    onSelect?.(item);

    if (autoClear) {
      setQuery('');
    }

    if (autoFocusAfter) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  /* ===================== CLICK OUTSIDE ===================== */
  useEffect(() => {
    inputRef.current?.focus();

    const handlePointerDown = e => {
      if (
        inputRef.current?.contains(e.target) ||
        dropdownRef.current?.contains(e.target)
      )
        return;

      closeDropdown();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, []);

  /* ===================== KEYBOARD ===================== */
  const handleKeyDown = e => {
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filtered[activeIndex];
      if (selected) {
        setQuery(selected.name);
        handleSubmit(selected);
      }
    }

    if (e.key === 'Escape') {
      closeDropdown();
    }
  };

  /* ===================== AUTO SUBMIT EXACT MATCH ===================== */
  useEffect(() => {
    if (!query) return;

    const exactMatch = data.find(
      item => item.name.toLowerCase() === query.toLowerCase()
    );

    if (exactMatch && !submittedRef.current) {
      handleSubmit(exactMatch);
    }

    if (!exactMatch) {
      submittedRef.current = false;
    }
  }, [query, data]);

  return (
    <>
      <input
        ref={inputRef}
        value={query}
        onFocus={() => {
          if (query.length >= MIN_CHARS) openDropdown();
        }}
        onChange={e => {
          const value = e.target.value;
          setQuery(value);
          submittedRef.current = false;

          if (value.length >= MIN_CHARS) {
            openDropdown();
          } else {
            closeDropdown();
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="input rounded-xl ml-2"
      />

      {open && pos &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`
              fixed z-[9999] mt-1 bg-base-100 border rounded-2xl shadow
              transition-all duration-150 ease-out
              ${visible
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 -translate-y-1 scale-95 pointer-events-none'}
            `}
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
            }}
          >
            <ul className="max-h-56 overflow-auto">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-gray-400">
                  Tidak ditemukan
                </li>
              )}

              {filtered.map((item, index) => (
                <li
                  key={item.id}
                  ref={el => (itemRefs.current[index] = el)}
                  className={`
                    px-3 py-2 cursor-pointer rounded-2xl
                    ${index === activeIndex
                      ? 'bg-base-300'
                      : 'hover:bg-base-200'}
                  `}
                  onMouseDown={() => {
                    setQuery(item.name);
                    handleSubmit(item);
                  }}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </>
  );
}
