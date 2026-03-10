import { useState, useCallback } from "react";

const NIBBLE_COUNT = 8;
const BITS_PER_NIBBLE = 4;

function Bit({ on, onClick, color, size = 28 }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: size, height: size,
        border: `1.5px solid ${on ? color : "#3a3a4a"}`,
        borderRadius: 4,
        backgroundColor: on ? color : "#1a1a2e",
        color: on ? "#fff" : "#555",
        fontSize: size < 28 ? 11 : 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontWeight: 700,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: on ? `0 0 8px ${color}44` : "none",
      }}
    >{on ? "1" : "0"}</button>
  );
}

function NibbleGroup({ bits, onToggle, color, label, opLabel, result }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 10, color: "#666", fontFamily: "monospace", letterSpacing: 1 }}>{label}</span>
      <div style={{ display: "flex", gap: 3 }}>
        {bits.map((b, i) => (
          <Bit key={i} on={b} onClick={() => onToggle(i)} color={color} />
        ))}
      </div>
      <div style={{ fontSize: 10, color: "#888", fontFamily: "monospace", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
        <span style={{ color: "#666" }}>{opLabel}</span>
        <span style={{ color: result ? "#fff" : "#444", fontWeight: 700, fontSize: 14, width: 16, textAlign: "center" }}>
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
      <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid #444" }} />
    </div>
  );
}

function ResultByte({ bits, label, color }) {
  const value = bits.reduce((acc, b, i) => acc | (b ? (1 << (7 - i)) : 0), 0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", backgroundColor: "#0d0d1a", borderRadius: 8, border: `1px solid ${color}33` }}>
      <span style={{ color, fontWeight: 700, fontSize: 14, fontFamily: "monospace", minWidth: 40 }}>{label}</span>
      <span style={{ color: "#888", fontSize: 11, fontFamily: "monospace" }}>=</span>
      <div style={{ display: "flex", gap: 2 }}>
        {bits.map((b, i) => (
          <span key={i} style={{ color: b ? color : "#333", fontWeight: 700, fontSize: 16, fontFamily: "monospace", width: 14, textAlign: "center" }}>
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

function SectionCard({ children, borderColor = "#1e1e35", style = {} }) {
  return (
    <div style={{
      backgroundColor: "#161625", borderRadius: 12, border: `1px solid ${borderColor}`,
      padding: "20px 24px", marginBottom: 16, ...style,
    }}>{children}</div>
  );
}

function LevelBadge({ level, color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{
        backgroundColor: `${color}22`, color, padding: "3px 10px", borderRadius: 4,
        fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
      }}>Level {level}</span>
      <span style={{ color: "#888", fontSize: 12 }}>{label}</span>
    </div>
  );
}

export default function BSECLifecycle() {
  const [word1, setWord1] = useState(Array(32).fill(false));
  const [word2, setWord2] = useState(Array(32).fill(false));
  const [secureBoot, setSecureBoot] = useState([false, false, false, false]);
  const [debugLock, setDebugLock] = useState([false, false, false, false]);
  const [showBsecDetail, setShowBsecDetail] = useState(false);

  const toggleBit = useCallback((word, setter, nibbleIdx, bitIdx) => {
    setter(prev => {
      const next = [...prev];
      const globalIdx = nibbleIdx * BITS_PER_NIBBLE + bitIdx;
      next[globalIdx] = !next[globalIdx];
      return next;
    });
  }, []);

  const toggleSimpleBit = useCallback((setter, idx) => {
    setter(prev => { const n = [...prev]; n[idx] = !n[idx]; return n; });
  }, []);

  const getNibble = (word, idx) => word.slice(idx * BITS_PER_NIBBLE, (idx + 1) * BITS_PER_NIBBLE);
  const orNibble = (nibble) => nibble.some(Boolean);
  const andNibble = (nibble) => nibble.every(Boolean);

  const sBits = Array.from({ length: NIBBLE_COUNT }, (_, i) => orNibble(getNibble(word1, i)));
  const rBits = Array.from({ length: NIBBLE_COUNT }, (_, i) => andNibble(getNibble(word2, i)));
  const sValue = sBits.reduce((acc, b, i) => acc | (b ? (1 << (7 - i)) : 0), 0);
  const rValue = rBits.reduce((acc, b, i) => acc | (b ? (1 << (7 - i)) : 0), 0);
  const bsecClosed = sBits[0] || sValue > rValue;
  const bsecState = bsecClosed ? "BSEC-closed" : "BSEC-open";
  const bsecColor = bsecClosed ? "#a78bfa" : "#666";

  const secureBootVal = secureBoot.reduce((acc, b, i) => acc | (b ? (1 << i) : 0), 0);
  const debugLockVal = debugLock.reduce((acc, b, i) => acc | (b ? (1 << i) : 0), 0);
  const isLocked = secureBootVal > 0;
  const isDebugLocked = debugLockVal > 0;
  const bootState = isLocked ? "CLOSED_LOCKED" : "CLOSED_UNLOCKED";
  const bootColor = isLocked ? "#f59e0b" : "#22c55e";

  const presets = [
    {
      label: "Discovery Kit (factory)",
      w1: Array(32).fill(false).map((_, i) => i >= 24),
      w2: (() => { const a = Array(32).fill(false); for (let i = 28; i < 32; i++) a[i] = true; return a; })(),
      sb: [false, false, false, false],
      dl: [false, false, false, false],
    },
    {
      label: "Secure boot enabled",
      w1: Array(32).fill(false).map((_, i) => i >= 24),
      w2: (() => { const a = Array(32).fill(false); for (let i = 28; i < 32; i++) a[i] = true; return a; })(),
      sb: [true, false, false, false],
      dl: [false, false, false, false],
    },
    {
      label: "Fully locked (production)",
      w1: Array(32).fill(false).map((_, i) => i >= 24),
      w2: (() => { const a = Array(32).fill(false); for (let i = 28; i < 32; i++) a[i] = true; return a; })(),
      sb: [true, false, false, false],
      dl: [true, false, false, false],
    },
    {
      label: "Virgin (theoretical)",
      w1: Array(32).fill(false),
      w2: Array(32).fill(false),
      sb: [false, false, false, false],
      dl: [false, false, false, false],
    },
  ];

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#0f0f1a", color: "#e0e0e0",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{ maxWidth: 720, width: "100%" }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: -0.5 }}>
            STM32MP25x Lifecycle State
          </h1>
          <p style={{ color: "#666", fontSize: 12, margin: "6px 0 0", letterSpacing: 0.5 }}>
            Two-level model — BSEC hardware + ROM code boot chain
          </p>
        </div>

        {/* Presets */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
          {presets.map((p, idx) => (
            <button key={idx}
              onClick={() => { setWord1([...p.w1]); setWord2([...p.w2]); setSecureBoot([...p.sb]); setDebugLock([...p.dl]); }}
              style={{
                padding: "6px 14px", backgroundColor: "#1a1a2e", border: "1px solid #2a2a3a",
                borderRadius: 6, color: "#aaa", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.target.style.borderColor = "#4dabf7"; e.target.style.color = "#fff"; }}
              onMouseLeave={e => { e.target.style.borderColor = "#2a2a3a"; e.target.style.color = "#aaa"; }}
            >{p.label}</button>
          ))}
        </div>

        {/* ═══════ LEVEL 2: Boot Chain (PRIMARY) ═══════ */}
        <SectionCard borderColor={`${bootColor}33`}>
          <LevelBadge level={2} color={bootColor} label="ROM Code / Boot Chain — OTP18 (BOOTROM_CONFIG_9)" />

          <div style={{ fontSize: 11, color: "#888", marginBottom: 14, lineHeight: 1.5 }}>
            This is the practical lifecycle. Controls whether secure boot is enforced.
            <br/>Click bits to experiment.
          </div>

          {/* secure_boot field */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ color: "#888", fontSize: 11, fontFamily: "monospace" }}>bits [3:0]</span>
              <span style={{ color: bootColor, fontSize: 12, fontWeight: 700 }}>secure_boot</span>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {secureBoot.map((b, i) => (
                <Bit key={i} on={b} onClick={() => toggleSimpleBit(setSecureBoot, i)} color={bootColor} size={32} />
              ))}
              <span style={{ color: "#555", fontSize: 12, marginLeft: 8 }}>=</span>
              <span style={{ color: bootColor, fontWeight: 700, fontSize: 16, marginLeft: 4 }}>
                0x{secureBootVal.toString(16).toUpperCase()}
              </span>
              <span style={{ color: "#555", fontSize: 12, marginLeft: 8 }}>→</span>
              <span style={{ color: secureBootVal === 0 ? "#22c55e" : "#f59e0b", fontSize: 12, fontWeight: 700, marginLeft: 4 }}>
                {secureBootVal === 0 ? "not enforced" : "ENFORCED"}
              </span>
            </div>
          </div>

          {/* debug_lock field */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ color: "#888", fontSize: 11, fontFamily: "monospace" }}>bits [11:8]</span>
              <span style={{ color: "#f7764d", fontSize: 12, fontWeight: 700 }}>debug_lock</span>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {debugLock.map((b, i) => (
                <Bit key={i} on={b} onClick={() => toggleSimpleBit(setDebugLock, i)} color="#f7764d" size={32} />
              ))}
              <span style={{ color: "#555", fontSize: 12, marginLeft: 8 }}>=</span>
              <span style={{ color: "#f7764d", fontWeight: 700, fontSize: 16, marginLeft: 4 }}>
                0x{debugLockVal.toString(16).toUpperCase()}
              </span>
              <span style={{ color: "#555", fontSize: 12, marginLeft: 8 }}>→</span>
              <span style={{ color: debugLockVal === 0 ? "#22c55e" : "#f7764d", fontSize: 12, fontWeight: 700, marginLeft: 4 }}>
                {debugLockVal === 0 ? "debug available" : "debug LOCKED"}
              </span>
            </div>
          </div>

          <Arrow />

          {/* Boot chain result */}
          <div style={{
            textAlign: "center", padding: "12px 20px", borderRadius: 8,
            backgroundColor: "#0d0d1a", border: `1.5px solid ${bootColor}33`,
          }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
              Boot chain state (what matters to you)
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: bootColor, textShadow: `0 0 24px ${bootColor}33` }}>
              {bootState}
            </div>
            {isLocked && isDebugLocked && (
              <div style={{ fontSize: 11, color: "#f7764d", marginTop: 6 }}>
                + debug locked — full production lockdown
              </div>
            )}
            {isLocked && !isDebugLocked && (
              <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 6 }}>
                secure boot enforced, but debug still available (unusual in production)
              </div>
            )}
          </div>
        </SectionCard>

        {/* ═══════ LEVEL 1: BSEC Hardware ═══════ */}
        <button
          onClick={() => setShowBsecDetail(!showBsecDetail)}
          style={{
            width: "100%", padding: "10px", backgroundColor: "#161625",
            border: "1px solid #2a2a3a", borderRadius: 8, color: "#888",
            fontSize: 12, cursor: "pointer", marginBottom: 16, fontFamily: "inherit",
          }}
        >
          {showBsecDetail ? "▼" : "▶"} Level 1: BSEC Hardware — OTP1/OTP2 (factory, click to expand)
        </button>

        {showBsecDetail && (
          <>
            <SectionCard borderColor={`${bsecColor}33`}>
              <LevelBadge level={1} color="#a78bfa" label="BSEC Hardware IP — OTP1 (close) / OTP2 (RMA)" />
              <div style={{ fontSize: 11, color: "#666", marginBottom: 14, lineHeight: 1.5 }}>
                Managed by ST at the factory. Uses OR/AND nibble logic from RM0457 §7.3.7.
                On production devices, OTP1 is pre-programmed by ST — so BSEC is always "closed"
                at this level. This enables upper OTP access and RHUK for SAES.
              </div>

              {/* Word 1 - OR */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ backgroundColor: "#4dabf722", color: "#4dabf7", padding: "2px 10px", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                    OTP1
                  </span>
                  <span style={{ color: "#666", fontSize: 11 }}>closing — OR per nibble</span>
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  {Array.from({ length: NIBBLE_COUNT }, (_, ni) => (
                    <NibbleGroup key={ni}
                      bits={getNibble(word1, ni)}
                      onToggle={(bi) => toggleBit(word1, setWord1, ni, bi)}
                      color="#4dabf7"
                      label={`[${31 - ni * 4}:${28 - ni * 4}]`}
                      opLabel="OR→" result={sBits[ni]}
                    />
                  ))}
                </div>
              </div>

              {/* Word 2 - AND */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ backgroundColor: "#f7764d22", color: "#f7764d", padding: "2px 10px", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                    OTP2
                  </span>
                  <span style={{ color: "#666", fontSize: 11 }}>RMA / opening — AND per nibble</span>
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  {Array.from({ length: NIBBLE_COUNT }, (_, ni) => (
                    <NibbleGroup key={ni}
                      bits={getNibble(word2, ni)}
                      onToggle={(bi) => toggleBit(word2, setWord2, ni, bi)}
                      color="#f7764d"
                      label={`[${31 - ni * 4}:${28 - ni * 4}]`}
                      opLabel="AND→" result={rBits[ni]}
                    />
                  ))}
                </div>
              </div>

              <Arrow />

              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", marginBottom: 12 }}>
                <ResultByte bits={sBits} label="s" color="#4dabf7" />
                <ResultByte bits={rBits} label="r" color="#f7764d" />
              </div>

              <Arrow />

              <div style={{
                textAlign: "center", padding: "12px 20px", borderRadius: 8,
                backgroundColor: "#0d0d1a", border: `1.5px solid ${bsecColor}33`,
              }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
                  {sBits[0]
                    ? "s[7] = 1 → permanently closed"
                    : sValue > rValue
                      ? `s (0x${sValue.toString(16).toUpperCase().padStart(2, "0")}) > r (0x${rValue.toString(16).toUpperCase().padStart(2, "0")})`
                      : sValue === rValue && sValue === 0
                        ? "s = r = 0x00 (virgin / theoretical)"
                        : `s (0x${sValue.toString(16).toUpperCase().padStart(2, "0")}) ≤ r (0x${rValue.toString(16).toUpperCase().padStart(2, "0")}) → opened after RMA`
                  }
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: bsecColor }}>
                  {bsecState}
                </div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 6 }}>
                  Factory-managed. All production devices ship as BSEC-closed.
                </div>
              </div>
            </SectionCard>

            {/* Legend */}
            <div style={{
              padding: "14px 18px", backgroundColor: "#0d0d1a", borderRadius: 8,
              border: "1px solid #1a1a2e", fontSize: 11, color: "#555", lineHeight: 1.7,
              marginBottom: 16,
            }}>
              <div><span style={{ color: "#4dabf7" }}>OR</span> — just <strong style={{ color: "#888" }}>1 bit</strong> in a nibble is enough to close (easy)</div>
              <div><span style={{ color: "#f7764d" }}>AND</span> — need <strong style={{ color: "#888" }}>all 4 bits</strong> in a nibble to open (hard)</div>
              <div style={{ marginTop: 6 }}>Closed when: <code style={{ color: "#aaa" }}>s[7] = 1</code> or <code style={{ color: "#aaa" }}>s &gt; r</code></div>
              <div>Max 4 RMA cycles — then OTP2 runs out of nibbles</div>
            </div>
          </>
        )}

        {/* ═══════ How to check from Linux ═══════ */}
        <SectionCard borderColor="#333">
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
            How to check from Linux
          </div>
          <div style={{
            fontFamily: "monospace", fontSize: 12, color: "#aaa", backgroundColor: "#0d0d1a",
            padding: "12px 16px", borderRadius: 6, lineHeight: 1.8,
          }}>
            <div style={{ color: "#555" }}># Read OTP18 secure_boot field (bits [3:0])</div>
            <div>hexdump -s 72 -n 4 -e '4/1 "%02x" "\n"' \</div>
            <div style={{ paddingLeft: 16 }}>/sys/bus/nvmem/devices/stm32-romem0/nvmem</div>
            <div style={{ marginTop: 8, color: "#555" }}># Last nibble = 0 → CLOSED_UNLOCKED</div>
            <div style={{ color: "#555" }}># Last nibble ≠ 0 → CLOSED_LOCKED</div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
