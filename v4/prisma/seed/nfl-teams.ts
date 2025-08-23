export interface NFLTeam {
  name: string;
  abbreviation: string;
  city: string;
  conference: 'AFC' | 'NFC';
  division: 'East' | 'North' | 'South' | 'West';
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor?: string;
  logo: string; // Placeholder URL for logo
}

export const NFL_TEAMS: NFLTeam[] = [
  // AFC East
  {
    name: 'Bills',
    abbreviation: 'BUF',
    city: 'Buffalo',
    conference: 'AFC',
    division: 'East',
    primaryColor: '#00338D',
    secondaryColor: '#C60C30',
    logo: '/logos/buf.svg'
  },
  {
    name: 'Dolphins',
    abbreviation: 'MIA',
    city: 'Miami',
    conference: 'AFC',
    division: 'East',
    primaryColor: '#008E97',
    secondaryColor: '#FC4C02',
    tertiaryColor: '#005778',
    logo: '/logos/mia.svg'
  },
  {
    name: 'Patriots',
    abbreviation: 'NE',
    city: 'New England',
    conference: 'AFC',
    division: 'East',
    primaryColor: '#002244',
    secondaryColor: '#C60C30',
    tertiaryColor: '#B0B7BC',
    logo: '/logos/ne.svg'
  },
  {
    name: 'Jets',
    abbreviation: 'NYJ',
    city: 'New York',
    conference: 'AFC',
    division: 'East',
    primaryColor: '#125740',
    secondaryColor: '#FFFFFF',
    logo: '/logos/nyj.svg'
  },

  // AFC North
  {
    name: 'Ravens',
    abbreviation: 'BAL',
    city: 'Baltimore',
    conference: 'AFC',
    division: 'North',
    primaryColor: '#241773',
    secondaryColor: '#000000',
    tertiaryColor: '#9E7C0C',
    logo: '/logos/bal.svg'
  },
  {
    name: 'Bengals',
    abbreviation: 'CIN',
    city: 'Cincinnati',
    conference: 'AFC',
    division: 'North',
    primaryColor: '#FB4F14',
    secondaryColor: '#000000',
    logo: '/logos/cin.svg'
  },
  {
    name: 'Browns',
    abbreviation: 'CLE',
    city: 'Cleveland',
    conference: 'AFC',
    division: 'North',
    primaryColor: '#311D00',
    secondaryColor: '#FF3C00',
    logo: '/logos/cle.svg'
  },
  {
    name: 'Steelers',
    abbreviation: 'PIT',
    city: 'Pittsburgh',
    conference: 'AFC',
    division: 'North',
    primaryColor: '#FFB612',
    secondaryColor: '#101820',
    logo: '/logos/pit.svg'
  },

  // AFC South
  {
    name: 'Texans',
    abbreviation: 'HOU',
    city: 'Houston',
    conference: 'AFC',
    division: 'South',
    primaryColor: '#03202F',
    secondaryColor: '#A71930',
    logo: '/logos/hou.svg'
  },
  {
    name: 'Colts',
    abbreviation: 'IND',
    city: 'Indianapolis',
    conference: 'AFC',
    division: 'South',
    primaryColor: '#002C5F',
    secondaryColor: '#A2AAAD',
    logo: '/logos/ind.svg'
  },
  {
    name: 'Jaguars',
    abbreviation: 'JAX',
    city: 'Jacksonville',
    conference: 'AFC',
    division: 'South',
    primaryColor: '#101820',
    secondaryColor: '#D7A22A',
    tertiaryColor: '#006778',
    logo: '/logos/jax.svg'
  },
  {
    name: 'Titans',
    abbreviation: 'TEN',
    city: 'Tennessee',
    conference: 'AFC',
    division: 'South',
    primaryColor: '#0C2340',
    secondaryColor: '#4B92DB',
    tertiaryColor: '#C8102E',
    logo: '/logos/ten.svg'
  },

  // AFC West
  {
    name: 'Broncos',
    abbreviation: 'DEN',
    city: 'Denver',
    conference: 'AFC',
    division: 'West',
    primaryColor: '#FB4F14',
    secondaryColor: '#002244',
    logo: '/logos/den.svg'
  },
  {
    name: 'Chiefs',
    abbreviation: 'KC',
    city: 'Kansas City',
    conference: 'AFC',
    division: 'West',
    primaryColor: '#E31837',
    secondaryColor: '#FFB81C',
    logo: '/logos/kc.svg'
  },
  {
    name: 'Raiders',
    abbreviation: 'LV',
    city: 'Las Vegas',
    conference: 'AFC',
    division: 'West',
    primaryColor: '#000000',
    secondaryColor: '#A5ACAF',
    logo: '/logos/lv.svg'
  },
  {
    name: 'Chargers',
    abbreviation: 'LAC',
    city: 'Los Angeles',
    conference: 'AFC',
    division: 'West',
    primaryColor: '#0080C6',
    secondaryColor: '#FFC20E',
    tertiaryColor: '#FFFFFF',
    logo: '/logos/lac.svg'
  },

  // NFC East
  {
    name: 'Cowboys',
    abbreviation: 'DAL',
    city: 'Dallas',
    conference: 'NFC',
    division: 'East',
    primaryColor: '#041E42',
    secondaryColor: '#869397',
    tertiaryColor: '#FFFFFF',
    logo: '/logos/dal.svg'
  },
  {
    name: 'Giants',
    abbreviation: 'NYG',
    city: 'New York',
    conference: 'NFC',
    division: 'East',
    primaryColor: '#0B2265',
    secondaryColor: '#A71930',
    tertiaryColor: '#A5ACAF',
    logo: '/logos/nyg.svg'
  },
  {
    name: 'Eagles',
    abbreviation: 'PHI',
    city: 'Philadelphia',
    conference: 'NFC',
    division: 'East',
    primaryColor: '#004C54',
    secondaryColor: '#A5ACAF',
    tertiaryColor: '#000000',
    logo: '/logos/phi.svg'
  },
  {
    name: 'Commanders',
    abbreviation: 'WAS',
    city: 'Washington',
    conference: 'NFC',
    division: 'East',
    primaryColor: '#5A1414',
    secondaryColor: '#FFB612',
    logo: '/logos/was.svg'
  },

  // NFC North
  {
    name: 'Bears',
    abbreviation: 'CHI',
    city: 'Chicago',
    conference: 'NFC',
    division: 'North',
    primaryColor: '#0B162A',
    secondaryColor: '#C83803',
    logo: '/logos/chi.svg'
  },
  {
    name: 'Lions',
    abbreviation: 'DET',
    city: 'Detroit',
    conference: 'NFC',
    division: 'North',
    primaryColor: '#0076B6',
    secondaryColor: '#B0B7BC',
    tertiaryColor: '#000000',
    logo: '/logos/det.svg'
  },
  {
    name: 'Packers',
    abbreviation: 'GB',
    city: 'Green Bay',
    conference: 'NFC',
    division: 'North',
    primaryColor: '#203731',
    secondaryColor: '#FFB612',
    logo: '/logos/gb.svg'
  },
  {
    name: 'Vikings',
    abbreviation: 'MIN',
    city: 'Minnesota',
    conference: 'NFC',
    division: 'North',
    primaryColor: '#4F2683',
    secondaryColor: '#FFC62F',
    logo: '/logos/min.svg'
  },

  // NFC South
  {
    name: 'Falcons',
    abbreviation: 'ATL',
    city: 'Atlanta',
    conference: 'NFC',
    division: 'South',
    primaryColor: '#A71930',
    secondaryColor: '#000000',
    tertiaryColor: '#A5ACAF',
    logo: '/logos/atl.svg'
  },
  {
    name: 'Panthers',
    abbreviation: 'CAR',
    city: 'Carolina',
    conference: 'NFC',
    division: 'South',
    primaryColor: '#0085CA',
    secondaryColor: '#101820',
    tertiaryColor: '#BFC0BF',
    logo: '/logos/car.svg'
  },
  {
    name: 'Saints',
    abbreviation: 'NO',
    city: 'New Orleans',
    conference: 'NFC',
    division: 'South',
    primaryColor: '#D3BC8D',
    secondaryColor: '#101820',
    logo: '/logos/no.svg'
  },
  {
    name: 'Buccaneers',
    abbreviation: 'TB',
    city: 'Tampa Bay',
    conference: 'NFC',
    division: 'South',
    primaryColor: '#D50A0A',
    secondaryColor: '#34302B',
    tertiaryColor: '#FF7900',
    logo: '/logos/tb.svg'
  },

  // NFC West
  {
    name: 'Cardinals',
    abbreviation: 'ARI',
    city: 'Arizona',
    conference: 'NFC',
    division: 'West',
    primaryColor: '#97233F',
    secondaryColor: '#000000',
    tertiaryColor: '#FFB612',
    logo: '/logos/ari.svg'
  },
  {
    name: 'Rams',
    abbreviation: 'LAR',
    city: 'Los Angeles',
    conference: 'NFC',
    division: 'West',
    primaryColor: '#003594',
    secondaryColor: '#FFA300',
    tertiaryColor: '#FFD100',
    logo: '/logos/lar.svg'
  },
  {
    name: '49ers',
    abbreviation: 'SF',
    city: 'San Francisco',
    conference: 'NFC',
    division: 'West',
    primaryColor: '#AA0000',
    secondaryColor: '#B3995D',
    logo: '/logos/sf.svg'
  },
  {
    name: 'Seahawks',
    abbreviation: 'SEA',
    city: 'Seattle',
    conference: 'NFC',
    division: 'West',
    primaryColor: '#002244',
    secondaryColor: '#69BE28',
    tertiaryColor: '#A5ACAF',
    logo: '/logos/sea.svg'
  }
];

// Helper function to get teams by conference
export function getTeamsByConference(conference: 'AFC' | 'NFC'): NFLTeam[] {
  return NFL_TEAMS.filter(team => team.conference === conference);
}

// Helper function to get teams by division
export function getTeamsByDivision(conference: 'AFC' | 'NFC', division: 'East' | 'North' | 'South' | 'West'): NFLTeam[] {
  return NFL_TEAMS.filter(team => 
    team.conference === conference && team.division === division
  );
}

// Helper function to get team by abbreviation
export function getTeamByAbbreviation(abbreviation: string): NFLTeam | undefined {
  return NFL_TEAMS.find(team => 
    team.abbreviation === abbreviation.toUpperCase()
  );
}

// Helper function to get all divisions
export function getDivisions(): { conference: 'AFC' | 'NFC'; division: 'East' | 'North' | 'South' | 'West' }[] {
  const divisions: { conference: 'AFC' | 'NFC'; division: 'East' | 'North' | 'South' | 'West' }[] = [];
  const conferences: ('AFC' | 'NFC')[] = ['AFC', 'NFC'];
  const divisionNames: ('East' | 'North' | 'South' | 'West')[] = ['East', 'North', 'South', 'West'];
  
  for (const conference of conferences) {
    for (const division of divisionNames) {
      divisions.push({ conference, division });
    }
  }
  
  return divisions;
}

// Export grouped structure for easier iteration
export const NFL_DIVISIONS = {
  AFC: {
    East: getTeamsByDivision('AFC', 'East'),
    North: getTeamsByDivision('AFC', 'North'),
    South: getTeamsByDivision('AFC', 'South'),
    West: getTeamsByDivision('AFC', 'West')
  },
  NFC: {
    East: getTeamsByDivision('NFC', 'East'),
    North: getTeamsByDivision('NFC', 'North'),
    South: getTeamsByDivision('NFC', 'South'),
    West: getTeamsByDivision('NFC', 'West')
  }
};

// Team name mappings for common variations
export const TEAM_NAME_MAPPINGS: Record<string, string> = {
  // Full names to abbreviations
  'buffalo bills': 'BUF',
  'miami dolphins': 'MIA',
  'new england patriots': 'NE',
  'new york jets': 'NYJ',
  'baltimore ravens': 'BAL',
  'cincinnati bengals': 'CIN',
  'cleveland browns': 'CLE',
  'pittsburgh steelers': 'PIT',
  'houston texans': 'HOU',
  'indianapolis colts': 'IND',
  'jacksonville jaguars': 'JAX',
  'tennessee titans': 'TEN',
  'denver broncos': 'DEN',
  'kansas city chiefs': 'KC',
  'las vegas raiders': 'LV',
  'los angeles chargers': 'LAC',
  'dallas cowboys': 'DAL',
  'new york giants': 'NYG',
  'philadelphia eagles': 'PHI',
  'washington commanders': 'WAS',
  'chicago bears': 'CHI',
  'detroit lions': 'DET',
  'green bay packers': 'GB',
  'minnesota vikings': 'MIN',
  'atlanta falcons': 'ATL',
  'carolina panthers': 'CAR',
  'new orleans saints': 'NO',
  'tampa bay buccaneers': 'TB',
  'arizona cardinals': 'ARI',
  'los angeles rams': 'LAR',
  'san francisco 49ers': 'SF',
  'seattle seahawks': 'SEA',
  // Common variations
  'patriots': 'NE',
  'pats': 'NE',
  'bills': 'BUF',
  'dolphins': 'MIA',
  'fins': 'MIA',
  'jets': 'NYJ',
  'ravens': 'BAL',
  'bengals': 'CIN',
  'browns': 'CLE',
  'steelers': 'PIT',
  'texans': 'HOU',
  'colts': 'IND',
  'jaguars': 'JAX',
  'jags': 'JAX',
  'titans': 'TEN',
  'broncos': 'DEN',
  'chiefs': 'KC',
  'raiders': 'LV',
  'chargers': 'LAC',
  'bolts': 'LAC',
  'cowboys': 'DAL',
  'giants': 'NYG',
  'eagles': 'PHI',
  'commanders': 'WAS',
  'commies': 'WAS',
  'bears': 'CHI',
  'lions': 'DET',
  'packers': 'GB',
  'pack': 'GB',
  'vikings': 'MIN',
  'vikes': 'MIN',
  'falcons': 'ATL',
  'panthers': 'CAR',
  'saints': 'NO',
  'buccaneers': 'TB',
  'bucs': 'TB',
  'cardinals': 'ARI',
  'cards': 'ARI',
  'rams': 'LAR',
  '49ers': 'SF',
  'niners': 'SF',
  'seahawks': 'SEA',
  'hawks': 'SEA'
};

// Get team by any name variation
export function getTeamByName(name: string): NFLTeam | undefined {
  const normalizedName = name.toLowerCase().trim();
  
  // First check if it's already an abbreviation
  const directMatch = getTeamByAbbreviation(normalizedName);
  if (directMatch) return directMatch;
  
  // Check name mappings
  const abbreviation = TEAM_NAME_MAPPINGS[normalizedName];
  if (abbreviation) {
    return getTeamByAbbreviation(abbreviation);
  }
  
  // Check if it matches any team name or city
  return NFL_TEAMS.find(team => 
    team.name.toLowerCase() === normalizedName ||
    team.city.toLowerCase() === normalizedName ||
    `${team.city.toLowerCase()} ${team.name.toLowerCase()}` === normalizedName
  );
}