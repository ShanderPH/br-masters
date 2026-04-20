"use client";

import { forwardRef } from "react";

export interface ShareCardData {
  userName: string;
  position: number;
  points: number;
  predictions: number;
  exactScores: number;
  accuracy: number;
  teamLogoDataUrl: string | null;
  filterLabel: string;
  roundLabel?: string | null;
  teamColors: { primary: string; secondary: string; accent: string };
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean.padEnd(6, "0").slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardData>(
  function ShareCard(
    { userName, position, points, predictions, exactScores, accuracy, filterLabel, roundLabel, teamLogoDataUrl, teamColors },
    ref
  ) {
    const primary = teamColors.primary;
    const secondary = teamColors.secondary;

    const positionColor =
      position === 1 ? "#FBBF24" :
      position === 2 ? "#E5E7EB" :
      position === 3 ? "#FB923C" :
      primary;

    const positionLabel =
      position === 1 ? "1º Lugar" :
      position === 2 ? "2º Lugar" :
      position === 3 ? "3º Lugar" :
      `${position}º Colocado`;

    const medalEmoji =
      position === 1 ? "🥇" :
      position === 2 ? "🥈" :
      position === 3 ? "🥉" :
      "🏅";

    return (
      <div
        ref={ref}
        style={{
          width: "800px",
          height: "450px",
          background: `linear-gradient(135deg, #0f0f23 0%, #1A1A2E 40%, #2C2C4E 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top team-color bar */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background: `linear-gradient(90deg, ${primary} 0%, ${secondary} 50%, ${primary} 100%)`,
        }} />

        {/* Decorative glows using team's primary color */}
        <div style={{
          position: "absolute",
          top: "-140px",
          right: "-140px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${hexToRgba(primary, 0.18)} 0%, transparent 70%)`,
        }} />
        <div style={{
          position: "absolute",
          bottom: "-100px",
          left: "-100px",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${hexToRgba(secondary, 0.12)} 0%, transparent 70%)`,
        }} />

        {/* Side vertical accent */}
        <div style={{
          position: "absolute",
          top: "30px",
          bottom: "30px",
          left: "30px",
          width: "3px",
          background: `linear-gradient(to bottom, transparent, ${primary}, transparent)`,
        }} />

        {/* Main content */}
        <div style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          width: "100%",
          padding: "0 70px",
        }}>
          {/* Brand */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <span style={{
              color: "#CCFF00",
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "5px",
              textTransform: "uppercase",
            }}>
              BR MASTERS
            </span>
            <span style={{
              color: "rgba(255,255,255,0.38)",
              fontSize: "10px",
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}>
              {filterLabel}{roundLabel ? ` · ${roundLabel}` : ""}
            </span>
          </div>

          {/* User info row */}
          <div style={{ display: "flex", alignItems: "center", gap: "34px" }}>
            {/* Team logo — ring colored with team primary */}
            <div style={{
              width: "108px",
              height: "108px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: hexToRgba(primary, 0.12),
              borderRadius: "50%",
              border: `3px solid ${primary}`,
              boxShadow: `0 0 30px ${hexToRgba(primary, 0.35)}`,
              flexShrink: 0,
            }}>
              {teamLogoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={teamLogoDataUrl}
                  alt=""
                  crossOrigin="anonymous"
                  style={{ width: "76px", height: "76px", objectFit: "contain" }}
                />
              ) : (
                <span style={{ fontSize: "48px" }}>⚽</span>
              )}
            </div>

            {/* Divider with team secondary color */}
            <div style={{
              width: "2px",
              height: "108px",
              background: `linear-gradient(to bottom, transparent, ${hexToRgba(secondary, 0.55)}, transparent)`,
            }} />

            {/* Name + position + points */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{
                color: "white",
                fontSize: "30px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "1px",
                lineHeight: 1.1,
                textShadow: `0 2px 8px ${hexToRgba(primary, 0.35)}`,
              }}>
                {userName}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "22px" }}>{medalEmoji}</span>
                <span style={{
                  color: positionColor,
                  fontSize: "16px",
                  fontWeight: "bold",
                  letterSpacing: "0.5px",
                }}>
                  {positionLabel}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "2px" }}>
                <span style={{
                  color: primary,
                  fontSize: "44px",
                  fontWeight: 900,
                  fontStyle: "italic",
                  lineHeight: 1,
                  textShadow: `0 2px 14px ${hexToRgba(primary, 0.45)}`,
                }}>
                  {points}
                </span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px", fontWeight: "bold" }}>
                  PONTOS
                </span>
              </div>
            </div>
          </div>

          {/* Stats bar — border uses team primary */}
          <div style={{
            display: "flex",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: `1px solid ${hexToRgba(primary, 0.35)}`,
            overflow: "hidden",
          }}>
            <div style={{ padding: "14px 34px", textAlign: "center" }}>
              <div style={{ color: "white", fontSize: "22px", fontWeight: 900 }}>{predictions}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "2px" }}>Palpites</div>
            </div>
            <div style={{ width: "1px", background: hexToRgba(primary, 0.25), margin: "10px 0" }} />
            <div style={{ padding: "14px 34px", textAlign: "center" }}>
              <div style={{ color: secondary === "#F5F5F5" ? "#CCFF00" : secondary, fontSize: "22px", fontWeight: 900 }}>{exactScores}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "2px" }}>Exatos</div>
            </div>
            <div style={{ width: "1px", background: hexToRgba(primary, 0.25), margin: "10px 0" }} />
            <div style={{ padding: "14px 34px", textAlign: "center" }}>
              <div style={{ color: primary, fontSize: "22px", fontWeight: 900 }}>{accuracy}%</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "2px" }}>Precisão</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            color: "rgba(255,255,255,0.22)",
            fontSize: "10px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            fontWeight: "bold",
          }}>
            brmasters.app
          </div>
        </div>

        {/* Bottom team-color bar */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "6px",
          background: `linear-gradient(90deg, ${primary} 0%, ${secondary} 50%, ${primary} 100%)`,
        }} />
      </div>
    );
  }
);
