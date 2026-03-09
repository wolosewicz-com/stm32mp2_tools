import { useState, useCallback } from "react";

const NIBBLE_COUNT = 8;
const BITS_PER_NIBBLE = 4;

function Bit({ on, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        border: `1.5px solid ${on ? color : "#3a3a4a"}`,
        borderRadius: 4,
        backgroundColor: on ? color : "#1a1a2e",
        color: on ? "#fff" : "#555",
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.15s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: on ? `0 0 8px ${color}44` : "none",
      }}
    >
      {on ? "1" : "0"}
    </button>
  );
}

function NibbleGroup({ bits, onToggle, color, label, opLabel, result }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 10, color: "#666", fontFamily: "monospace", letterSpacing: 1 }}>
        {label}
      </span>
      <div style={{ display: "flex", gap: 3 }}>
        {bits.map((b, i) => (
          <Bit key={i} on={b} onClick={() => onToggle(i)} color={color} />
        ))}
      </div>
      <div style={{
        fontSize: 10,
        color: "#888",
        fontFamily: "monospace",
        display: "flex",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
      }}>
        <span style={{ color: "#666" }}>{opLabel}</span>
        <span style={{
          color: result ? "#fff" : "#444",
          fontWeight: 700,
          fontSize: 14,
          width: 16,
          textAlign: "center",
        }}>
          {result ? "1" : "0"}
        </span>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "8px 0" }}>
      <div style={{ width: 2, height: 16, backgroundColor: "#444" }} />
      <div style={{
        width: 0, height: 0,
        borderLeft: "6px solid transparent",
        borderRight: "6px solid transparent",
        borderTop: "8px solid #444",
      }} />
    </div>
  );
}

function ResultByte({ bits, label, color }) {
  const value = bits.reduce((acc, b, i) => acc | (b ? (1 << (7 - i)) : 0), 0);
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "8px 16px",
      backgroundColor: "#0d0d1a",
      borderRadius: 8,
      border: `1px solid ${color}33`,
    }}>
      <span style={{ color, fontWeight: 700, fontSize: 14, fontFamily: "monospace", minWidth: 40 }}>
        {label}
      </span>
      <span style={{ color: "#888", fontSize: 11, fontFamily: "monospace" }}>=</span>
      <div style={{ display: "flex", gap: 2 }}>
        {bits.map((b, i) => (
          <span key={i} style={{
            color: b ? color : "#333",
            fontWeight: 700,
            fontSize: 16,
            fontFamily: "monospace",
            width: 14,
            textAlign: "center",
          }}>
            {b ? "1" : "0"}
          </span>
        ))}
      </div>
      <span style={{ color: "#888", fontSize: 11, fontFamily: "monospace" }}>=</span>
      <span style={{ color, fontWeight: 700, fontSize: 16, fontFamily: "monospace" }}>
        0x{value.toString(16).toUpperCase().padStart(2, "0")}
      </span>
    </div>
  );
}

export default function BSECLifecycle() {
  const [word1, setWord1] = useState(Array(32).fill(false));
  const [word2, setWord2] = useState(Array(32).fill(false));
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleBit = useCallback((word, setter, nibbleIdx, bitIdx) => {
    setter(prev => {
      const next = [...prev];
      const globalIdx = nibbleIdx * BITS_PER_NIBBLE + bitIdx;
      next[globalIdx] = !next[globalIdx];
      return next;
    });
  }, []);

  const getNibble = (word, idx) =>
    word.slice(idx * BITS_PER_NIBBLE, (idx + 1) * BITS_PER_NIBBLE);

  const orNibble = (nibble) => nibble.some(Boolean);
  const andNibble = (nibble) => nibble.every(Boolean);

  const sBits = Array.from({ length: NIBBLE_COUNT }, (_, i) => orNibble(getNibble(word1, i)));
  const rBits = Array.from({ length: NIBBLE_COUNT }, (_, i) => andNibble(getNibble(word2, i)));

  const sValue = sBits.reduce((acc, b, i) => acc | (b ? (1 << (7 - i)) : 0), 0);
  const rValue = rBits.reduce((acc, b, i) => acc | (b ? (1 << (7 - i)) : 0), 0);

  const w1Hex = "0x" + word1.reduce((acc, b, i) => {
    const byteIdx = Math.floor(i / 8);
    const bitIdx = 7 - (i % 8);
    if (b) acc[byteIdx] |= (1 << bitIdx);
    return acc;
  }, [0, 0, 0, 0]).map(b => b.toString(16).toUpperCase().padStart(2, "0")).join("");

  const isAllZeroW1 = word1.every(b => !b);
  const isClosed = sBits[0] || sValue > rValue;

  const state = isClosed ? "BSEC-closed" : "BSEC-open";
  const stateColor = isClosed ? "#f59e0b" : "#22c55e";

  const presets = [
    { label: "Virgin device", w1: Array(32).fill(false), w2: Array(32).fill(false) },
    {
      label: "Closed (1 bit)",
      w1: Array(32).fill(false).map((_, i) => i === 31),
      w2: Array(32).fill(false),
    },
    {
      label: "After 1× RMA",
      w1: (() => { const a = Array(32).fill(false); a[31] = true; return a; })(),
      w2: (() => { const a = Array(32).fill(false); a[28] = true; a[29] = true; a[30] = true; a[31] = true; return a; })(),
    },
    {
      label: "Permanently closed",
      w1: (() => { const a = Array(32).fill(false); a[0] = true; return a; })(),
      w2: Array(32).fill(false),
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0f0f1a",
      color: "#e0e0e0",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      padding: "32px 24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <div style={{ maxWidth: 720, width: "100%" }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <h1 style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#fff",
            margin: 0,
            letterSpacing: -0.5,
          }}>
            STM32MP25x Lifecycle State
          </h1>
          <p style={{ color: "#666", fontSize: 12, margin: "6px 0 0", letterSpacing: 0.5 }}>
            BSEC NVSTATE — decoded from OTP Word 1 & Word 2
          </p>
        </div>

        {/* Quick Check */}
        <div style={{
          backgroundColor: "#161625",
          borderRadius: 12,
          border: `1.5px solid ${stateColor}22`,
          padding: "20px 24px",
          marginBottom: 24,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 2 }}>
              Quick check
            </span>
            <span style={{
              fontSize: 14,
              fontWeight: 800,
              color: stateColor,
              padding: "4px 12px",
              borderRadius: 6,
              backgroundColor: `${stateColor}15`,
              border: `1px solid ${stateColor}33`,
            }}>
              {state}
            </span>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            backgroundColor: "#0d0d1a",
            borderRadius: 8,
          }}>
            <span style={{ color: "#4dabf7", fontSize: 13 }}>OTP Word 1</span>
            <span style={{ color: "#555" }}>=</span>
            <span style={{ color: isAllZeroW1 ? "#22c55e" : "#f59e0b", fontSize: 15, fontWeight: 700 }}>
              {w1Hex}
            </span>
            <span style={{ color: "#555", fontSize: 12, marginLeft: 8 }}>→</span>
            <span style={{ color: isAllZeroW1 ? "#22c55e" : "#f59e0b", fontSize: 12, marginLeft: 4 }}>
              {isAllZeroW1 ? "== 0 → OPEN" : "≠ 0 → CLOSED"}
            </span>
          </div>
          <p style={{ color: "#555", fontSize: 11, margin: "10px 0 0", lineHeight: 1.5 }}>
            For a typical device (never went through RMA) — just check if Word 1 ≠ 0.
          </p>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#161625",
            border: "1px solid #2a2a3a",
            borderRadius: 8,
            color: "#888",
            fontSize: 12,
            cursor: "pointer",
            marginBottom: 24,
            fontFamily: "inherit",
            transition: "all 0.2s",
          }}
        >
          {showAdvanced ? "▼" : "▶"} Full s/r logic (click bits to experiment)
        </button>

        {showAdvanced && (
          <>
            {/* Presets */}
            <div style={{
              display: "flex",
              gap: 8,
              marginBottom: 24,
              flexWrap: "wrap",
              justifyContent: "center",
            }}>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => { setWord1([...p.w1]); setWord2([...p.w2]); }}
                  style={{
                    padding: "6px 14px",
                    backgroundColor: "#1a1a2e",
                    border: "1px solid #2a2a3a",
                    borderRadius: 6,
                    color: "#aaa",
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.target.style.borderColor = "#4dabf7"; e.target.style.color = "#fff"; }}
                  onMouseLeave={e => { e.target.style.borderColor = "#2a2a3a"; e.target.style.color = "#aaa"; }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Word 1 - OR */}
            <div style={{
              backgroundColor: "#161625",
              borderRadius: 12,
              border: "1px solid #1e1e35",
              padding: "20px 16px",
              marginBottom: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{
                  backgroundColor: "#4dabf722",
                  color: "#4dabf7",
                  padding: "2px 10px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  Word 1
                </span>
                <span style={{ color: "#666", fontSize: 11 }}>BSEC_FVR1 — closing</span>
                <span style={{
                  marginLeft: "auto",
                  color: "#4dabf7",
                  fontSize: 11,
                  backgroundColor: "#4dabf711",
                  padding: "2px 8px",
                  borderRadius: 4,
                }}>
                  OR per nibble
                </span>
              </div>
              <div style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}>
                {Array.from({ length: NIBBLE_COUNT }, (_, ni) => (
                  <NibbleGroup
                    key={ni}
                    bits={getNibble(word1, ni)}
                    onToggle={(bi) => toggleBit(word1, setWord1, ni, bi)}
                    color="#4dabf7"
                    label={`[${31 - ni * 4}:${28 - ni * 4}]`}
                    opLabel="OR→"
                    result={sBits[ni]}
                  />
                ))}
              </div>
            </div>

            {/* Word 2 - AND */}
            <div style={{
              backgroundColor: "#161625",
              borderRadius: 12,
              border: "1px solid #1e1e35",
              padding: "20px 16px",
              marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{
                  backgroundColor: "#f7764d22",
                  color: "#f7764d",
                  padding: "2px 10px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  Word 2
                </span>
                <span style={{ color: "#666", fontSize: 11 }}>BSEC_FVR2 — RMA / opening</span>
                <span style={{
                  marginLeft: "auto",
                  color: "#f7764d",
                  fontSize: 11,
                  backgroundColor: "#f7764d11",
                  padding: "2px 8px",
                  borderRadius: 4,
                }}>
                  AND per nibble
                </span>
              </div>
              <div style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}>
                {Array.from({ length: NIBBLE_COUNT }, (_, ni) => (
                  <NibbleGroup
                    key={ni}
                    bits={getNibble(word2, ni)}
                    onToggle={(bi) => toggleBit(word2, setWord2, ni, bi)}
                    color="#f7764d"
                    label={`[${31 - ni * 4}:${28 - ni * 4}]`}
                    opLabel="AND→"
                    result={rBits[ni]}
                  />
                ))}
              </div>
            </div>

            {/* Results */}
            <Arrow />

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "center",
              marginBottom: 16,
            }}>
              <ResultByte bits={sBits} label="s" color="#4dabf7" />
              <ResultByte bits={rBits} label="r" color="#f7764d" />
            </div>

            <Arrow />

            {/* Decision */}
            <div style={{
              backgroundColor: "#161625",
              borderRadius: 12,
              border: `1.5px solid ${stateColor}33`,
              padding: "16px 20px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                {sBits[0]
                  ? <span>s[7] = 1 → <span style={{ color: "#f59e0b" }}>permanently closed</span></span>
                  : sValue > rValue
                    ? <span>s (0x{sValue.toString(16).toUpperCase().padStart(2, "0")}) &gt; r (0x{rValue.toString(16).toUpperCase().padStart(2, "0")})</span>
                    : sValue === rValue && sValue === 0
                      ? <span>s = r = 0x00 (virgin)</span>
                      : <span>s (0x{sValue.toString(16).toUpperCase().padStart(2, "0")}) ≤ r (0x{rValue.toString(16).toUpperCase().padStart(2, "0")}) → opened after RMA</span>
                }
              </div>
              <div style={{
                fontSize: 28,
                fontWeight: 800,
                color: stateColor,
                textShadow: `0 0 24px ${stateColor}33`,
              }}>
                {state}
              </div>
            </div>

            {/* Legend */}
            <div style={{
              marginTop: 24,
              padding: "14px 18px",
              backgroundColor: "#0d0d1a",
              borderRadius: 8,
              border: "1px solid #1a1a2e",
              fontSize: 11,
              color: "#555",
              lineHeight: 1.7,
            }}>
              <div><span style={{ color: "#4dabf7" }}>OR</span> — just <strong style={{ color: "#888" }}>1 bit</strong> in a nibble is enough to close (easy)</div>
              <div><span style={{ color: "#f7764d" }}>AND</span> — need <strong style={{ color: "#888" }}>all 4 bits</strong> in a nibble to open (hard)</div>
              <div style={{ marginTop: 6 }}>Closed when: <code style={{ color: "#aaa" }}>s[7] = 1</code> or <code style={{ color: "#aaa" }}>s &gt; r</code></div>
              <div>Max 4 RMA cycles — then Word 2 runs out of nibbles</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
