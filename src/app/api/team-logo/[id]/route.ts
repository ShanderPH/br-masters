import fs from "fs";
import path from "path";

import { NextRequest, NextResponse } from "next/server";

const logoCache = new Map<string, { data: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const teamIdToFileName: Record<string, string> = {
  // Brasileirão Serie A 2025 teams
  "1954": "cruzeiro",
  "1955": "bahia",
  "1977": "atletico-mg",
  "1957": "corinthians",
  "1958": "botafogo",
  "1959": "sport",
  "5981": "flamengo",
  "1961": "fluminense",
  "1962": "vitoria",
  "1963": "palmeiras",
  "2001": "ceara",
  "1968": "santos",
  "1974": "vasco",
  "2020": "fortaleza",
  "21982": "mirassol",
  "5926": "gremio",
  "1966": "internacional",
  "1980": "juventude",
  "1999": "bragantino",
  "1981": "saopaulo",
  // Additional teams
  "21845": "mirassol",
  // International teams
  "1644": "psg",
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
  }

  const cached = logoCache.get(id);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return new NextResponse(cached.data, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const fileName = teamIdToFileName[id];

    if (!fileName) {
      return await tryReadLogoFile(id, id);
    }

    return await tryReadLogoFile(id, fileName);
  } catch {
    const placeholderSvg = `<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
      <circle cx="25" cy="25" r="20" fill="#6b7280"/>
      <text x="25" y="25" text-anchor="middle" dy=".3em" fill="white" font-size="8">ERR</text>
    </svg>`;

    return new NextResponse(placeholderSvg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300",
        "X-Error": "true",
      },
    });
  }
}

async function tryReadLogoFile(
  id: string,
  fileName: string,
): Promise<NextResponse> {
  let logoPath = path.join(
    process.cwd(),
    "public",
    "images",
    "logo",
    `${fileName}.svg`,
  );

  if (!fs.existsSync(logoPath)) {
    const variations = [
      fileName.toLowerCase(),
      fileName.replace(/\s+/g, "-"),
      fileName.replace(/\s+/g, "_"),
    ];

    let foundPath = null;

    for (const variation of variations) {
      const varPath = path.join(
        process.cwd(),
        "public",
        "images",
        "logo",
        `${variation}.svg`,
      );

      if (fs.existsSync(varPath)) {
        foundPath = varPath;
        break;
      }
    }

    if (!foundPath) {
      const placeholderSvg = `<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="20" fill="#3b82f6"/>
        <text x="25" y="25" text-anchor="middle" dy=".3em" fill="white" font-size="10">${id.slice(0, 4)}</text>
      </svg>`;

      return new NextResponse(placeholderSvg, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=300",
          "X-Placeholder": "true",
        },
      });
    }

    logoPath = foundPath;
  }

  const svgContent = fs.readFileSync(logoPath, "utf-8");

  logoCache.set(id, {
    data: svgContent,
    timestamp: Date.now(),
  });

  return new NextResponse(svgContent, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
      "X-Cache": "MISS",
    },
  });
}
