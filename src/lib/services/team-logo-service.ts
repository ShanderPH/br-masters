const teamLogoMap: Record<string, string> = {
  "Atlético Mineiro": "atletico-mg",
  "Atlético-MG": "atletico-mg",
  "Atletico Mineiro": "atletico-mg",
  "Athletico Paranaense": "athletico",
  "Athletico-PR": "athletico",
  "Bahia": "bahia",
  "Botafogo": "botafogo",
  "Ceará": "ceara",
  "Ceara": "ceara",
  "Chapecoense": "chapecoense",
  "Corinthians": "corinthians",
  "Coritiba": "coritiba",
  "Cruzeiro": "cruzeiro",
  "Flamengo": "flamengo",
  "Fluminense": "fluminense",
  "Fortaleza": "fortaleza",
  "Grêmio": "gremio",
  "Gremio": "gremio",
  "Internacional": "internacional",
  "Juventude": "juventude",
  "Mirassol": "mirassol",
  "Palmeiras": "palmeiras",
  "Red Bull Bragantino": "bragantino",
  "Bragantino": "bragantino",
  "Santos": "santos",
  "São Paulo": "saopaulo",
  "Sao Paulo": "saopaulo",
  "Sport Recife": "sport",
  "Sport": "sport",
  "Vasco da Gama": "vasco",
  "Vasco": "vasco",
  "Vitória": "vitoria",
  "Vitoria": "vitoria",
};

export function getTeamLogoPath(teamName: string): string {
  if (!teamName) return "/images/logo/waiting.svg";

  const mapped = teamLogoMap[teamName];
  if (mapped) return `/images/logo/${mapped}.svg`;

  const slug = teamName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
  return `/images/logo/${slug}.svg`;
}

export function getTeamLogoById(teamId: number | string): string {
  return `/api/team-logo/${teamId}`;
}
