export interface Team {
  name: string
  initials: string
  color: string   // primary
  color2: string  // secondary
  iso: string
  group: string
  confederation: string
}

export const TEAMS: Team[] = [
  // Group A
  { name: 'Mexico',              initials: 'MEX', color: '#006847', color2: '#CE1126', iso: 'mx',     group: 'A', confederation: 'CONCACAF' },
  { name: 'South Africa',        initials: 'RSA', color: '#007A4D', color2: '#FFB81C', iso: 'za',     group: 'A', confederation: 'CAF' },
  { name: 'South Korea',         initials: 'KOR', color: '#C60C30', color2: '#003478', iso: 'kr',     group: 'A', confederation: 'AFC' },
  { name: 'Czechia',             initials: 'CZE', color: '#D7141A', color2: '#11457E', iso: 'cz',     group: 'A', confederation: 'UEFA' },

  // Group B
  { name: 'Canada',              initials: 'CAN', color: '#FF0000', color2: '#FFFFFF', iso: 'ca',     group: 'B', confederation: 'CONCACAF' },
  { name: 'Bosnia & Herz.',      initials: 'BIH', color: '#002395', color2: '#FCCA02', iso: 'ba',     group: 'B', confederation: 'UEFA' },
  { name: 'Qatar',               initials: 'QAT', color: '#8D1B3D', color2: '#FFFFFF', iso: 'qa',     group: 'B', confederation: 'AFC' },
  { name: 'Switzerland',         initials: 'SUI', color: '#FF0000', color2: '#FFFFFF', iso: 'ch',     group: 'B', confederation: 'UEFA' },

  // Group C
  { name: 'Brazil',              initials: 'BRA', color: '#009C3B', color2: '#FEDF00', iso: 'br',     group: 'C', confederation: 'CONMEBOL' },
  { name: 'Morocco',             initials: 'MAR', color: '#C1272D', color2: '#006233', iso: 'ma',     group: 'C', confederation: 'CAF' },
  { name: 'Haiti',               initials: 'HAI', color: '#00209F', color2: '#D21034', iso: 'ht',     group: 'C', confederation: 'CONCACAF' },
  { name: 'Scotland',            initials: 'SCO', color: '#003F87', color2: '#FFFFFF', iso: 'gb-sct', group: 'C', confederation: 'UEFA' },

  // Group D
  { name: 'USA',                 initials: 'USA', color: '#3C3B6E', color2: '#B22234', iso: 'us',     group: 'D', confederation: 'CONCACAF' },
  { name: 'Paraguay',            initials: 'PRY', color: '#D52B1E', color2: '#0038A8', iso: 'py',     group: 'D', confederation: 'CONMEBOL' },
  { name: 'Australia',           initials: 'AUS', color: '#00008B', color2: '#FF0000', iso: 'au',     group: 'D', confederation: 'AFC' },
  { name: 'Türkiye',             initials: 'TUR', color: '#E30A17', color2: '#FFFFFF', iso: 'tr',     group: 'D', confederation: 'UEFA' },

  // Group E
  { name: 'Germany',             initials: 'GER', color: '#000000', color2: '#DD0000', iso: 'de',     group: 'E', confederation: 'UEFA' },
  { name: 'Curaçao',             initials: 'CUW', color: '#002B7F', color2: '#F9E814', iso: 'cw',     group: 'E', confederation: 'CONCACAF' },
  { name: "Côte d'Ivoire",       initials: 'CIV', color: '#F77F00', color2: '#009A44', iso: 'ci',     group: 'E', confederation: 'CAF' },
  { name: 'Ecuador',             initials: 'ECU', color: '#FFD100', color2: '#003DA5', iso: 'ec',     group: 'E', confederation: 'CONMEBOL' },

  // Group F
  { name: 'Netherlands',         initials: 'NED', color: '#FF6600', color2: '#003DA5', iso: 'nl',     group: 'F', confederation: 'UEFA' },
  { name: 'Japan',               initials: 'JPN', color: '#BC002D', color2: '#FFFFFF', iso: 'jp',     group: 'F', confederation: 'AFC' },
  { name: 'Sweden',              initials: 'SWE', color: '#006AA7', color2: '#FECC02', iso: 'se',     group: 'F', confederation: 'UEFA' },
  { name: 'Tunisia',             initials: 'TUN', color: '#E70013', color2: '#FFFFFF', iso: 'tn',     group: 'F', confederation: 'CAF' },

  // Group G
  { name: 'Belgium',             initials: 'BEL', color: '#EF3340', color2: '#FFD700', iso: 'be',     group: 'G', confederation: 'UEFA' },
  { name: 'Egypt',               initials: 'EGY', color: '#CE1126', color2: '#000000', iso: 'eg',     group: 'G', confederation: 'CAF' },
  { name: 'IR Iran',             initials: 'IRN', color: '#239F40', color2: '#DA0000', iso: 'ir',     group: 'G', confederation: 'AFC' },
  { name: 'New Zealand',         initials: 'NZL', color: '#00247D', color2: '#CC142B', iso: 'nz',     group: 'G', confederation: 'OFC' },

  // Group H
  { name: 'Spain',               initials: 'ESP', color: '#AA151B', color2: '#F1BF00', iso: 'es',     group: 'H', confederation: 'UEFA' },
  { name: 'Cabo Verde',          initials: 'CPV', color: '#003893', color2: '#CF2027', iso: 'cv',     group: 'H', confederation: 'CAF' },
  { name: 'Saudi Arabia',        initials: 'KSA', color: '#006C35', color2: '#FFFFFF', iso: 'sa',     group: 'H', confederation: 'AFC' },
  { name: 'Uruguay',             initials: 'URU', color: '#5AAAE7', color2: '#FFFFFF', iso: 'uy',     group: 'H', confederation: 'CONMEBOL' },

  // Group I
  { name: 'France',              initials: 'FRA', color: '#002395', color2: '#ED2939', iso: 'fr',     group: 'I', confederation: 'UEFA' },
  { name: 'Senegal',             initials: 'SEN', color: '#00853F', color2: '#FDEF42', iso: 'sn',     group: 'I', confederation: 'CAF' },
  { name: 'Iraq',                initials: 'IRQ', color: '#CE1126', color2: '#007A3D', iso: 'iq',     group: 'I', confederation: 'AFC' },
  { name: 'Norway',              initials: 'NOR', color: '#EF2B2D', color2: '#003087', iso: 'no',     group: 'I', confederation: 'UEFA' },

  // Group J
  { name: 'Argentina',           initials: 'ARG', color: '#74ACDF', color2: '#FFFFFF', iso: 'ar',     group: 'J', confederation: 'CONMEBOL' },
  { name: 'Algeria',             initials: 'ALG', color: '#006233', color2: '#FFFFFF', iso: 'dz',     group: 'J', confederation: 'CAF' },
  { name: 'Austria',             initials: 'AUT', color: '#ED2939', color2: '#FFFFFF', iso: 'at',     group: 'J', confederation: 'UEFA' },
  { name: 'Jordan',              initials: 'JOR', color: '#007A3D', color2: '#CE1126', iso: 'jo',     group: 'J', confederation: 'AFC' },

  // Group K
  { name: 'Portugal',            initials: 'POR', color: '#006600', color2: '#FF0000', iso: 'pt',     group: 'K', confederation: 'UEFA' },
  { name: 'DR Congo',            initials: 'COD', color: '#007FFF', color2: '#F7D600', iso: 'cd',     group: 'K', confederation: 'CAF' },
  { name: 'Uzbekistan',          initials: 'UZB', color: '#1EB53A', color2: '#0099B5', iso: 'uz',     group: 'K', confederation: 'AFC' },
  { name: 'Colombia',            initials: 'COL', color: '#FCD116', color2: '#003087', iso: 'co',     group: 'K', confederation: 'CONMEBOL' },

  // Group L
  { name: 'England',             initials: 'ENG', color: '#CF081F', color2: '#FFFFFF', iso: 'gb-eng', group: 'L', confederation: 'UEFA' },
  { name: 'Croatia',             initials: 'CRO', color: '#FF0000', color2: '#0093DD', iso: 'hr',     group: 'L', confederation: 'UEFA' },
  { name: 'Ghana',               initials: 'GHA', color: '#006B3F', color2: '#FCD116', iso: 'gh',     group: 'L', confederation: 'CAF' },
  { name: 'Panama',              initials: 'PAN', color: '#DB0000', color2: '#FFFFFF', iso: 'pa',     group: 'L', confederation: 'CONCACAF' },
]

export const TEAMS_BY_GROUP: Record<string, Team[]> = TEAMS.reduce((acc, team) => {
  if (!acc[team.group]) acc[team.group] = []
  acc[team.group].push(team)
  return acc
}, {} as Record<string, Team[]>)

export const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
