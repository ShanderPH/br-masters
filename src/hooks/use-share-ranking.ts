"use client";

import { useState, useCallback } from "react";

async function waitForImagesLoaded(element: HTMLElement, timeoutMs = 4000): Promise<void> {
  const imgs = Array.from(element.querySelectorAll("img"));
  if (imgs.length === 0) return;

  const tasks = imgs.map((img) => {
    if (img.complete && img.naturalHeight > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const done = () => {
        img.removeEventListener("load", done);
        img.removeEventListener("error", done);
        resolve();
      };
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
  });

  await Promise.race([
    Promise.all(tasks).then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

export function useShareRanking() {
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchLogoAsDataUrl = useCallback(async (url: string): Promise<string | null> => {
    // Try direct fetch first (works for same-origin and CORS-enabled endpoints).
    try {
      const res = await fetch(url, { mode: "cors" });
      if (res.ok) {
        const blob = await res.blob();
        return await new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // swallow and try the image-drawing fallback
    }

    // Fallback: load via <img crossOrigin="anonymous"> and paint to canvas.
    return await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || 200;
          canvas.height = img.naturalHeight || 200;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }, []);

  const captureAndShare = useCallback(async (element: HTMLElement) => {
    setIsGenerating(true);
    try {
      // Let the browser paint + decode the data-URL <img> tags inside the card
      // before html-to-image serializes the DOM to an SVG foreignObject.
      await waitForImagesLoaded(element);
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        cacheBust: true,
        skipAutoScale: false,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const file = new File([blob], "meu-ranking-br-masters.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Meu Ranking — BR Masters",
          text: "Veja minha posição no ranking do BR Masters!",
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "meu-ranking-br-masters.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { captureAndShare, fetchLogoAsDataUrl, isGenerating };
}
