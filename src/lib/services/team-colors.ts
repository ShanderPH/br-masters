export interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

export const DEFAULT_TEAM_COLORS: TeamColors = {
  primary: "#25B8B8",
  secondary: "#CCFF00",
  accent: "#CCFF00",
};

// Canonical palette for major Brazilian clubs. Keys are normalized slugs.
const TEAM_COLORS_MAP: Record<string, TeamColors> = {
  flamengo: { primary: "#E20E2A", secondary: "#1A1A1A", accent: "#E20E2A" },
  fluminense: { primary: "#970B17", secondary: "#00573F", accent: "#970B17" },
  corinthians: { primary: "#F5F5F5", secondary: "#1A1A1A", accent: "#F5F5F5" },
  cruzeiro: { primary: "#003DA5", secondary: "#F5F5F5", accent: "#003DA5" },
  palmeiras: { primary: "#006437", secondary: "#F5F5F5", accent: "#006437" },
  "sao-paulo": { primary: "#E20E2A", secondary: "#1A1A1A", accent: "#E20E2A" },
  santos: { primary: "#F5F5F5", secondary: "#1A1A1A", accent: "#F5F5F5" },
  botafogo: { primary: "#F5F5F5", secondary: "#1A1A1A", accent: "#F5F5F5" },
  vasco: { primary: "#1A1A1A", secondary: "#F5F5F5", accent: "#F5F5F5" },
  "vasco-da-gama": { primary: "#1A1A1A", secondary: "#F5F5F5", accent: "#F5F5F5" },
  gremio: { primary: "#0099CC", secondary: "#1A1A1A", accent: "#0099CC" },
  internacional: { primary: "#E5050C", secondary: "#F5F5F5", accent: "#E5050C" },
  "atletico-mineiro": { primary: "#F5F5F5", secondary: "#1A1A1A", accent: "#F5F5F5" },
  "atletico-mg": { primary: "#F5F5F5", secondary: "#1A1A1A", accent: "#F5F5F5" },
  bahia: { primary: "#005CA9", secondary: "#E20E2A", accent: "#005CA9" },
  fortaleza: { primary: "#003DA5", secondary: "#E20E2A", accent: "#003DA5" },
  ceara: { primary: "#E5050C", secondary: "#1A1A1A", accent: "#E5050C" },
  vitoria: { primary: "#E30613", secondary: "#1A1A1A", accent: "#E30613" },
  coritiba: { primary: "#006437", secondary: "#F5F5F5", accent: "#006437" },
  "athletico-paranaense": { primary: "#E30613", secondary: "#1A1A1A", accent: "#E30613" },
  "athletico-pr": { primary: "#E30613", secondary: "#1A1A1A", accent: "#E30613" },
  juventude: { primary: "#008631", secondary: "#F5F5F5", accent: "#008631" },
  criciuma: { primary: "#E30613", secondary: "#1A1A1A", accent: "#E30613" },
  "red-bull-bragantino": { primary: "#E30613", secondary: "#F5F5F5", accent: "#E30613" },
  bragantino: { primary: "#E30613", secondary: "#F5F5F5", accent: "#E30613" },
  cuiaba: { primary: "#006437", secondary: "#FFD700", accent: "#FFD700" },
  goias: { primary: "#008631", secondary: "#F5F5F5", accent: "#008631" },
  sport: { primary: "#E30613", secondary: "#1A1A1A", accent: "#E30613" },
  nautico: { primary: "#E30613", secondary: "#1A1A1A", accent: "#E30613" },
  chapecoense: { primary: "#006437", secondary: "#F5F5F5", accent: "#006437" },
  avai: { primary: "#003DA5", secondary: "#F5F5F5", accent: "#003DA5" },
  figueirense: { primary: "#1A1A1A", secondary: "#F5F5F5", accent: "#F5F5F5" },
  ponte: { primary: "#1A1A1A", secondary: "#F5F5F5", accent: "#F5F5F5" },
  "ponte-preta": { primary: "#1A1A1A", secondary: "#F5F5F5", accent: "#F5F5F5" },
};

function normalizeKey(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTeamColors(
  teamName?: string | null,
  teamSlug?: string | null,
  dbPrimary?: string | null,
  dbSecondary?: string | null
): TeamColors {
  const primaryIsValid = dbPrimary && /^#?[0-9a-fA-F]{3,8}$/.test(dbPrimary);
  const secondaryIsValid = dbSecondary && /^#?[0-9a-fA-F]{3,8}$/.test(dbSecondary);

  if (primaryIsValid && secondaryIsValid) {
    const p = dbPrimary.startsWith("#") ? dbPrimary : `#${dbPrimary}`;
    const s = dbSecondary.startsWith("#") ? dbSecondary : `#${dbSecondary}`;
    return { primary: p, secondary: s, accent: p };
  }

  const keys = [teamSlug, teamName]
    .filter((v): v is string => !!v)
    .map(normalizeKey);

  for (const key of keys) {
    if (key in TEAM_COLORS_MAP) return TEAM_COLORS_MAP[key];
  }

  for (const key of keys) {
    for (const mapKey of Object.keys(TEAM_COLORS_MAP)) {
      if (key.includes(mapKey) || mapKey.includes(key)) {
        return TEAM_COLORS_MAP[mapKey];
      }
    }
  }

  return DEFAULT_TEAM_COLORS;
}
