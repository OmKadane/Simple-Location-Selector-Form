import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Country, State, City } from "country-state-city";

/* ── Tiny flag helper ── */
function isoToFlag(iso) {
  return iso.toUpperCase().replace(/./g, c => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)));
}

function ChevronIcon({ open }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", display: "block" }}
      aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SearchField({ label, value, onChange, onFocus, placeholder, disabled, items, onSelect, open, dropRef }) {
  return (
    <div style={{ marginBottom: "1.5rem", position: "relative" }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#888", marginBottom: 8 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type="text" value={value} autoComplete="off"
          onChange={e => onChange(e.target.value)}
          onFocus={onFocus}
          placeholder={placeholder} disabled={disabled}
          style={{
            width: "100%", height: 48, padding: "0 48px 0 16px", fontSize: 15,
            borderRadius: 10, outline: "none", boxSizing: "border-box",
            border: "1.5px solid #d1d5db", background: disabled ? "#f9fafb" : "#fff",
            color: disabled ? "#9ca3af" : "#111", cursor: disabled ? "not-allowed" : "text",
            transition: "border-color 0.15s",
          }}
        />
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af", display: "flex", alignItems: "center" }}>
          <ChevronIcon open={open} />
        </span>
        {open && (
          <ul
            ref={dropRef}
            className="custom-scrollbar"
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
              background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10,
              maxHeight: 240, overflowY: "auto", listStyle: "none", padding: 0, margin: 0,
              boxShadow: "0 6px 24px rgba(0,0,0,0.1)",
            }}
          >
            {items.length === 0
              ? <li style={{ padding: "12px 16px", fontSize: 14, color: "#9ca3af", textAlign: "center" }}>No results found</li>
              : items.map((item, i) => (
                <li key={item.key}
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onSelect(item); }}
                  style={{
                    padding: "11px 16px", fontSize: 14.5, display: "flex", alignItems: "center",
                    gap: 10, borderBottom: i < items.length - 1 ? "1px solid #f3f4f6" : "none",
                    color: "#111", cursor: "pointer", transition: "background 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f3f4ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {item.flag && <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{item.flag}</span>}
                  {item.label}
                </li>
              ))
            }
          </ul>
        )}
      </div>
    </div>
  );
}

export default function LocationSelector({ onConfirm }) {
  const [countryQ, setCountryQ] = useState("");
  const [stateQ, setStateQ] = useState("");
  const [cityQ, setCityQ] = useState("");
  const [selCountry, setSelCountry] = useState(null); // isoCode
  const [selState, setSelState] = useState(null);      // isoCode
  const [selCity, setSelCity] = useState(null);         // name
  const [selCountryName, setSelCountryName] = useState("");
  const [selStateName, setSelStateName] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const wrapRef = useRef(null);

  // All countries from the package
  const allCountries = useMemo(() => Country.getAllCountries().map(c => ({
    key: c.isoCode, label: c.name, flag: isoToFlag(c.isoCode), iso: c.isoCode,
  })), []);

  const countryItems = useMemo(() =>
    allCountries.filter(c => c.label.toLowerCase().includes(countryQ.toLowerCase())),
  [allCountries, countryQ]);

  const stateItems = useMemo(() => {
    if (!selCountry) return [];
    return State.getStatesOfCountry(selCountry)
      .map(s => ({ key: s.isoCode, label: s.name, iso: s.isoCode }))
      .filter(s => s.label.toLowerCase().includes(stateQ.toLowerCase()));
  }, [selCountry, stateQ]);

  const cityItems = useMemo(() => {
    if (!selCountry) return [];
    const cities = selState
      ? City.getCitiesOfState(selCountry, selState)
      : City.getCitiesOfCountry(selCountry);
    return (cities || [])
      .map(c => ({ key: c.name + c.latitude, label: c.name }))
      .filter(c => c.label.toLowerCase().includes(cityQ.toLowerCase()));
  }, [selCountry, selState, cityQ]);

  function pickCountry(item) {
    setSelCountry(item.iso); setSelCountryName(item.label);
    setSelState(null); setSelStateName(""); setSelCity(null);
    setCountryQ(item.label); setStateQ(""); setCityQ("");
    setCountryOpen(false);
  }
  function pickState(item) {
    setSelState(item.iso); setSelStateName(item.label);
    setSelCity(null);
    setStateQ(item.label); setCityQ("");
    setStateOpen(false);
  }
  function pickCity(item) {
    setSelCity(item.label); setCityQ(item.label); setCityOpen(false);
  }

  const closeAll = useCallback(() => {
    setCountryOpen(false); setStateOpen(false); setCityOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", closeAll);
    return () => document.removeEventListener("mousedown", closeAll);
  }, [closeAll]);

  return (
    <div ref={wrapRef} style={{ maxWidth: 560, width: "100%", margin: "0 auto", padding: "2.5rem 1.25rem" }}>
      <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 16, padding: "2.25rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        <p style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: "0 0 6px", letterSpacing: "-0.01em" }}>Where are you located?</p>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "2rem", lineHeight: 1.5 }}>Choose your country, state, and city to continue</p>

        <SearchField label="Country" value={countryQ}
          onChange={q => { setCountryQ(q); setCountryOpen(true); if (!q) { setSelCountry(null); setSelCountryName(""); setSelState(null); setSelStateName(""); setSelCity(null); setStateQ(""); setCityQ(""); } }}
          onFocus={() => { setStateOpen(false); setCityOpen(false); setCountryOpen(true); }}
          placeholder="Search for your country…" disabled={false} items={countryItems} onSelect={pickCountry} open={countryOpen} />

        <SearchField label="State / Province" value={stateQ}
          onChange={q => { setStateQ(q); setStateOpen(true); }}
          onFocus={() => { setCountryOpen(false); setCityOpen(false); if (selCountry) setStateOpen(true); }}
          placeholder={selCountry ? "Search for your state…" : "Pick a country first…"} disabled={!selCountry}
          items={stateItems} onSelect={pickState} open={stateOpen} />

        <SearchField label="City" value={cityQ}
          onChange={q => { setCityQ(q); setCityOpen(true); }}
          onFocus={() => { setCountryOpen(false); setStateOpen(false); if (selCountry) setCityOpen(true); }}
          placeholder={selCountry ? "Search for your city…" : "Pick a country first…"} disabled={!selCountry}
          items={cityItems} onSelect={pickCity} open={cityOpen} />

        {selCountry && selCity && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#6b7280", flexWrap: "wrap", marginBottom: "1rem" }}>
              <span style={{ background: "#f3f4f6", borderRadius: 99, padding: "4px 13px", fontSize: 13, fontWeight: 600, color: "#111" }}>{selCountryName}</span>
              {selStateName && (
                <>
                  <span style={{ color: "#d1d5db" }}>→</span>
                  <span style={{ background: "#f3f4f6", borderRadius: 99, padding: "4px 13px", fontSize: 13, fontWeight: 600, color: "#111" }}>{selStateName}</span>
                </>
              )}
              <span style={{ color: "#d1d5db" }}>→</span>
              <span style={{ background: "#f3f4f6", borderRadius: 99, padding: "4px 13px", fontSize: 13, fontWeight: 600, color: "#111" }}>{selCity}</span>
            </div>
            <button onClick={() => onConfirm?.({ country: selCountryName, state: selStateName, city: selCity })}
              style={{
                width: "100%", height: 46, border: "1.5px solid #d1d5db", borderRadius: 10,
                background: "#111", color: "#fff", fontSize: 15, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", fontWeight: 600, transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#333"}
              onMouseLeave={e => e.currentTarget.style.background = "#111"}>
              Confirm location
            </button>
          </>
        )}
      </div>
    </div>
  );
}
