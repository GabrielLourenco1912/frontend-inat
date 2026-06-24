"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";

const contactTypes = [
  "Jovem interessado",
  "Empresa",
  "Família/responsável",
  "Outro",
];

export function ContactTypeSelect() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(contactTypes[0]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = contactTypes.indexOf(selectedType);

    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen((current) => !current);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex =
        (currentIndex + direction + contactTypes.length) % contactTypes.length;
      setSelectedType(contactTypes[nextIndex]);
    }
  }

  return (
    <div ref={wrapperRef} className="relative mt-2">
      <input type="hidden" name="contactType" value={selectedType} />
      <button
        id="contactType"
        type="button"
        className="field flex w-full items-center justify-between bg-white px-4 text-left"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="contactTypeList"
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        <span>{selectedType}</span>
        <span
          className={`text-[var(--inat-muted)] transition ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {isOpen ? (
        <ul
          id="contactTypeList"
          role="listbox"
          aria-labelledby="contactTypeLabel"
          className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-20 overflow-hidden rounded-lg bg-white py-1 shadow-[0_18px_45px_-26px_rgba(32,52,54,0.75)] ring-1 ring-[rgba(32,52,54,0.12)]"
        >
          {contactTypes.map((type) => {
            const isSelected = type === selectedType;

            return (
              <li key={type} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={`w-full px-4 py-3 text-left text-sm font-semibold transition ${
                    isSelected
                      ? "bg-[var(--inat-cta)] text-white"
                      : "text-[var(--inat-primary)] hover:bg-[rgba(209,107,54,0.12)] hover:text-[var(--inat-primary)]"
                  }`}
                  onClick={() => {
                    setSelectedType(type);
                    setIsOpen(false);
                  }}
                >
                  {type}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
