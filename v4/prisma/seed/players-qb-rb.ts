// Seed data for quarterbacks and running backs
export const quarterbacks: any[] = [
  // Elite Tier QBs
  {
    name: 'Patrick Mahomes',
    team: 'KC',
    position: 'QB',
    age: 28,
    height: '6-3',
    weight: 225,
    experience: 7,
    stats2023: {
      passingYards: 5250,
      passingTDs: 41,
      interceptions: 12,
      rushingYards: 389,
      rushingTDs: 5,
      completionPct: 67.2,
      gamesPlayed: 17
    },
    projections2024: {
      passingYards: 5100,
      passingTDs: 39,
      interceptions: 11,
      rushingYards: 350,
      rushingTDs: 4,
      fantasyPoints: 385
    },
    adp: 2.5,
    byeWeek: 6
  },
  {
    name: 'Josh Allen',
    team: 'BUF',
    position: 'QB',
    age: 28,
    height: '6-5',
    weight: 237,
    experience: 6,
    stats2023: {
      passingYards: 4306,
      passingTDs: 29,
      interceptions: 18,
      rushingYards: 524,
      rushingTDs: 9,
      completionPct: 66.7,
      gamesPlayed: 17
    },
    projections2024: {
      passingYards: 4400,
      passingTDs: 35,
      interceptions: 14,
      rushingYards: 550,
      rushingTDs: 8,
      fantasyPoints: 395
    },
    adp: 1.8,
    byeWeek: 13
  },
  {
    name: 'Jalen Hurts',
    team: 'PHI',
    position: 'QB',
    age: 26,
    height: '6-1',
    weight: 223,
    experience: 4,
    stats2023: {
      passingYards: 3858,
      passingTDs: 23,
      interceptions: 15,
      rushingYards: 605,
      rushingTDs: 15,
      completionPct: 65.4,
      gamesPlayed: 17
    },
    projections2024: {
      passingYards: 3900,
      passingTDs: 28,
      interceptions: 12,
      rushingYards: 650,
      rushingTDs: 13,
      fantasyPoints: 390
    },
    adp: 2.2,
    byeWeek: 5
  },
  {
    name: 'Lamar Jackson',
    team: 'BAL',
    position: 'QB',
    age: 27,
    height: '6-2',
    weight: 212,
    experience: 6,
    stats2023: {
      passingYards: 3678,
      passingTDs: 40,
      interceptions: 7,
      rushingYards: 821,
      rushingTDs: 5,
      completionPct: 67.2,
      gamesPlayed: 17
    },
    projections2024: {
      passingYards: 3750,
      passingTDs: 35,
      interceptions: 9,
      rushingYards: 750,
      rushingTDs: 6,
      fantasyPoints: 380
    },
    adp: 3.1,
    byeWeek: 14
  },
  {
    name: 'Dak Prescott',
    team: 'DAL',
    position: 'QB',
    age: 31,
    height: '6-2',
    weight: 238,
    experience: 8,
    stats2023: {
      passingYards: 4516,
      passingTDs: 36,
      interceptions: 9,
      rushingYards: 242,
      rushingTDs: 2,
      completionPct: 69.5,
      gamesPlayed: 17
    },
    projections2024: {
      passingYards: 4400,
      passingTDs: 34,
      interceptions: 10,
      rushingYards: 200,
      rushingTDs: 3,
      fantasyPoints: 345
    },
    adp: 4.8,
    byeWeek: 7
  },
  
  // Tier 2 QBs
  {
    name: 'Joe Burrow',
    team: 'CIN',
    position: 'QB',
    age: 27,
    height: '6-4',
    weight: 221,
    experience: 4,
    stats2023: {
      passingYards: 2309,
      passingTDs: 15,
      interceptions: 6,
      rushingYards: 75,
      rushingTDs: 2,
      completionPct: 66.8,
      gamesPlayed: 10
    },
    projections2024: {
      passingYards: 4450,
      passingTDs: 33,
      interceptions: 11,
      rushingYards: 150,
      rushingTDs: 3,
      fantasyPoints: 335
    },
    adp: 5.2,
    byeWeek: 12
  },
  {
    name: 'Justin Herbert',
    team: 'LAC',
    position: 'QB',
    age: 26,
    height: '6-6',
    weight: 236,
    experience: 4,
    stats2023: {
      passingYards: 3134,
      passingTDs: 20,
      interceptions: 7,
      rushingYards: 62,
      rushingTDs: 0,
      completionPct: 65.0,
      gamesPlayed: 13
    },
    projections2024: {
      passingYards: 4300,
      passingTDs: 30,
      interceptions: 10,
      rushingYards: 150,
      rushingTDs: 2,
      fantasyPoints: 320
    },
    adp: 6.5,
    byeWeek: 5
  },
  {
    name: 'Tua Tagovailoa',
    team: 'MIA',
    position: 'QB',
    age: 26,
    height: '6-1',
    weight: 225,
    experience: 4,
    stats2023: {
      passingYards: 4624,
      passingTDs: 29,
      interceptions: 14,
      rushingYards: 74,
      rushingTDs: 0,
      completionPct: 69.3,
      gamesPlayed: 17
    },
    projections2024: {
      passingYards: 4200,
      passingTDs: 28,
      interceptions: 12,
      rushingYards: 80,
      rushingTDs: 1,
      fantasyPoints: 305
    },
    adp: 7.8,
    byeWeek: 6
  },
  {
    name: 'Trevor Lawrence',
    team: 'JAX',
    position: 'QB',
    age: 25,
    height: '6-6',
    weight: 220,
    experience: 3,
    stats2023: {
      passingYards: 4016,
      passingTDs: 21,
      interceptions: 14,
      rushingYards: 339,
      rushingTDs: 4,
      completionPct: 65.1,
      gamesPlayed: 17
    },
    projections2024: {
      passingYards: 4100,
      passingTDs: 26,
      interceptions: 12,
      rushingYards: 300,
      rushingTDs: 4,
      fantasyPoints: 315
    },
    adp: 8.3,
    byeWeek: 12
  },
  {
    name: 'Jared Goff',
    team: 'DET',
    position: 'QB',
    age: 30,
    height: '6-4',
    weight: 222,
    experience: 8,
    stats2023: {
      passingYards: 4575,
      passingTDs: 30,
      interceptions: 12,
      rushingYards: 40,
      rushingTDs: 1,
      completionPct: 67.3,
      gamesPlayed: 17
    },
    projections2024: {
      passingYards: 4300,
      passingTDs: 29,
      interceptions: 11,
      rushingYards: 50,
      rushingTDs: 1,
      fantasyPoints: 310
    },
    adp: 9.1,
    byeWeek: 5
  },
  
  // Tier 3 QBs
  {
    name: 'C.J. Stroud',
    team: 'HOU',
    position: 'QB',
    age: 23,
    height: '6-3',
    weight: 218,
    experience: 2,
    stats2023: {
      passingYards: 4108,
      passingTDs: 23,
      interceptions: 5,
      rushingYards: 167,
      rushingTDs: 3,
      completionPct: 63.9,
      gamesPlayed: 15
    },
    projections2024: {
      passingYards: 4250,
      passingTDs: 28,
      interceptions: 9,
      rushingYards: 200,
      rushingTDs: 3,
      fantasyPoints: 320
    },
    adp: 7.5,
    byeWeek: 14
  },
  {
    name: 'Jordan Love',
    team: 'GB',
    position: 'QB',
    age: 26,
    height: '6-4',
    weight: 219,
    experience: 2,
    stats2023: {
      passingYards: 4159,
      passingTDs: 32,
      interceptions: 11,
      rushingYards: 247,
      rushingTDs: 4,
      completionPct: 64.2,
      gamesPlayed: 17
    },
    projections2024: {
      passingYards: 4000,
      passingTDs: 29,
      interceptions: 12,
      rushingYards: 225,
      rushingTDs: 3,
      fantasyPoints: 315
    },
    adp: 8.8,
    byeWeek: 10
  },
  {
    name: 'Kyler Murray',
    team: 'ARI',
    position: 'QB',
    age: 27,
    height: '5-10',
    weight: 207,
    experience: 5,
    stats2023: {
      passingYards: 1799,
      passingTDs: 10,
      interceptions: 5,
      rushingYards: 244,
      rushingTDs: 3,
      completionPct: 65.7,
      gamesPlayed: 8
    },
    projections2024: {
      passingYards: 3800,
      passingTDs: 24,
      interceptions: 10,
      rushingYards: 550,
      rushingTDs: 6,
      fantasyPoints: 325
    },
    adp: 9.5,
    byeWeek: 11
  },
  {
    name: 'Caleb Williams',
    team: 'CHI',
    position: 'QB',
    age: 22,
    height: '6-1',
    weight: 214,
    experience: 1,
    stats2023: {
      passingYards: 0,
      passingTDs: 0,
      interceptions: 0,
      rushingYards: 0,
      rushingTDs: 0,
      completionPct: 0,
      gamesPlayed: 0
    },
    projections2024: {
      passingYards: 3600,
      passingTDs: 22,
      interceptions: 14,
      rushingYards: 400,
      rushingTDs: 4,
      fantasyPoints: 285
    },
    adp: 11.2,
    byeWeek: 7
  },
  {
    name: 'Anthony Richardson',
    team: 'IND',
    position: 'QB',
    age: 22,
    height: '6-4',
    weight: 244,
    experience: 2,
    stats2023: {
      passingYards: 577,
      passingTDs: 3,
      interceptions: 1,
      rushingYards: 136,
      rushingTDs: 4,
      completionPct: 59.5,
      gamesPlayed: 4
    },
    projections2024: {
      passingYards: 3500,
      passingTDs: 20,
      interceptions: 12,
      rushingYards: 650,
      rushingTDs: 8,
      fantasyPoints: 310
    },
    adp: 10.3,
    byeWeek: 14
  },
  {
    name: 'Jayden Daniels',
    team: 'WAS',
    position: 'QB',
    age: 23,
    height: '6-4',
    weight: 210,
    experience: 1,
    stats2023: {
      passingYards: 0,
      passingTDs: 0,
      interceptions: 0,
      rushingYards: 0,
      rushingTDs: 0,
      completionPct: 0,
      gamesPlayed: 0
    },
    projections2024: {
      passingYards: 3400,
      passingTDs: 19,
      interceptions: 13,
      rushingYards: 500,
      rushingTDs: 5,
      fantasyPoints: 275
    },
    adp: 12.5,
    byeWeek: 14
  },
  {
    name: 'Brock Purdy',
    team: 'SF',
    position: 'QB',
    age: 24,
    height: '6-1',
    weight: 220,
    experience: 2,
    stats2023: {
      passingYards: 4280,
      passingTDs: 31,
      interceptions: 11,
      rushingYards: 144,
      rushingTDs: 2,
      completionPct: 69.4,
      gamesPlayed: 16
    },
    projections2024: {
      passingYards: 3900,
      passingTDs: 27,
      interceptions: 10,
      rushingYards: 125,
      rushingTDs: 2,
      fantasyPoints: 295
    },
    adp: 10.8,
    byeWeek: 9
  },
  {
    name: 'Kirk Cousins',
    team: 'ATL',
    position: 'QB',
    age: 36,
    height: '6-3',
    weight: 214,
    experience: 12,
    stats2023: {
      passingYards: 2331,
      passingTDs: 18,
      interceptions: 5,
      rushingYards: 16,
      rushingTDs: 0,
      completionPct: 69.5,
      gamesPlayed: 8
    },
    projections2024: {
      passingYards: 4100,
      passingTDs: 26,
      interceptions: 11,
      rushingYards: 50,
      rushingTDs: 1,
      fantasyPoints: 285
    },
    adp: 13.2,
    byeWeek: 12
  },
  {
    name: 'Matthew Stafford',
    team: 'LAR',
    position: 'QB',
    age: 36,
    height: '6-3',
    weight: 220,
    experience: 15,
    stats2023: {
      passingYards: 3965,
      passingTDs: 24,
      interceptions: 11,
      rushingYards: 63,
      rushingTDs: 1,
      completionPct: 62.6,
      gamesPlayed: 15
    },
    projections2024: {
      passingYards: 3800,
      passingTDs: 25,
      interceptions: 12,
      rushingYards: 50,
      rushingTDs: 1,
      fantasyPoints: 275
    },
    adp: 14.5,
    byeWeek: 6
  },
  {
    name: 'Deshaun Watson',
    team: 'CLE',
    position: 'QB',
    age: 29,
    height: '6-2',
    weight: 215,
    experience: 7,
    stats2023: {
      passingYards: 1115,
      passingTDs: 7,
      interceptions: 4,
      rushingYards: 134,
      rushingTDs: 1,
      completionPct: 61.4,
      gamesPlayed: 6
    },
    projections2024: {
      passingYards: 3700,
      passingTDs: 23,
      interceptions: 10,
      rushingYards: 350,
      rushingTDs: 4,
      fantasyPoints: 290
    },
    adp: 13.8,
    byeWeek: 10
  },
  
  // Tier 4 QBs
  {
    name: 'Aaron Rodgers',
    team: 'NYJ',
    position: 'QB',
    age: 40,
    height: '6-2',
    weight: 225,
    experience: 19,
    stats2023: {
      passingYards: 10,
      passingTDs: 0,
      interceptions: 1,
      rushingYards: 0,
      rushingTDs: 0,
      completionPct: 33.3,
      gamesPlayed: 1
    },
    projections2024: {
      passingYards: 3800,
      passingTDs: 26,
      interceptions: 9,
      rushingYards: 100,
      rushingTDs: 2,
      fantasyPoints: 280
    },
    adp: 12.8,
    byeWeek: 12
  },
  {
    name: 'Geno Smith',
    team: 'SEA',
    position: 'QB',
    age: 33,
    height: '6-3',
    weight: 221,
    experience: 11,
    stats2023: {
      passingYards: 3624,
      passingTDs: 20,
      interceptions: 9,
      rushingYards: 178,
      rushingTDs: 1,
      completionPct: 64.7,
      gamesPlayed: 15
    },
    projections2024: {
      passingYards: 3700,
      passingTDs: 22,
      interceptions: 10,
      rushingYards: 150,
      rushingTDs: 2,
      fantasyPoints: 270
    },
    adp: 15.2,
    byeWeek: 10
  },
  {
    name: 'Will Levis',
    team: 'TEN',
    position: 'QB',
    age: 25,
    height: '6-4',
    weight: 229,
    experience: 2,
    stats2023: {
      passingYards: 1808,
      passingTDs: 8,
      interceptions: 4,
      rushingYards: 175,
      rushingTDs: 1,
      completionPct: 58.4,
      gamesPlayed: 9
    },
    projections2024: {
      passingYards: 3500,
      passingTDs: 20,
      interceptions: 13,
      rushingYards: 250,
      rushingTDs: 3,
      fantasyPoints: 265
    },
    adp: 16.5,
    byeWeek: 5
  },
  {
    name: 'Baker Mayfield',
    team: 'TB',
    position: 'QB',
    age: 29,
    height: '6-1',
    weight: 215,
    experience: 6,
    stats2023: {
      passingYards: 4044,
      passingTDs: 28,
      interceptions: 10,
      rushingYards: 163,
      rushingTDs: 1,
      completionPct: 64.3,
      gamesPlayed: 17
    },
    projections2024: {
      passingYards: 3800,
      passingTDs: 24,
      interceptions: 12,
      rushingYards: 150,
      rushingTDs: 2,
      fantasyPoints: 275
    },
    adp: 14.8,
    byeWeek: 11
  },
  {
    name: 'Derek Carr',
    team: 'NO',
    position: 'QB',
    age: 33,
    height: '6-3',
    weight: 215,
    experience: 10,
    stats2023: {
      passingYards: 3878,
      passingTDs: 25,
      interceptions: 8,
      rushingYards: 40,
      rushingTDs: 1,
      completionPct: 68.4,
      gamesPlayed: 17
    },
    projections2024: {
      passingYards: 3700,
      passingTDs: 23,
      interceptions: 9,
      rushingYards: 50,
      rushingTDs: 1,
      fantasyPoints: 265
    },
    adp: 15.8,
    byeWeek: 12
  },
  
  // Backup/Streaming QBs
  {
    name: 'Russell Wilson',
    team: 'PIT',
    position: 'QB',
    age: 35,
    height: '5-11',
    weight: 215,
    experience: 12,
    stats2023: {
      passingYards: 3070,
      passingTDs: 26,
      interceptions: 8,
      rushingYards: 341,
      rushingTDs: 3,
      completionPct: 66.4,
      gamesPlayed: 15
    },
    projections2024: {
      passingYards: 3200,
      passingTDs: 20,
      interceptions: 10,
      rushingYards: 250,
      rushingTDs: 3,
      fantasyPoints: 255
    },
    adp: 17.2,
    byeWeek: 9
  },
  {
    name: 'Justin Fields',
    team: 'PIT',
    position: 'QB',
    age: 25,
    height: '6-3',
    weight: 227,
    experience: 3,
    stats2023: {
      passingYards: 2562,
      passingTDs: 16,
      interceptions: 9,
      rushingYards: 657,
      rushingTDs: 4,
      completionPct: 61.4,
      gamesPlayed: 13
    },
    projections2024: {
      passingYards: 2800,
      passingTDs: 18,
      interceptions: 10,
      rushingYards: 500,
      rushingTDs: 5,
      fantasyPoints: 265
    },
    adp: 16.8,
    byeWeek: 9
  },
  {
    name: 'Sam Darnold',
    team: 'MIN',
    position: 'QB',
    age: 27,
    height: '6-3',
    weight: 225,
    experience: 6,
    stats2023: {
      passingYards: 297,
      passingTDs: 2,
      interceptions: 1,
      rushingYards: 13,
      rushingTDs: 0,
      completionPct: 60.8,
      gamesPlayed: 2
    },
    projections2024: {
      passingYards: 3200,
      passingTDs: 18,
      interceptions: 12,
      rushingYards: 150,
      rushingTDs: 2,
      fantasyPoints: 240
    },
    adp: 19.5,
    byeWeek: 6
  },
  {
    name: 'Gardner Minshew',
    team: 'LV',
    position: 'QB',
    age: 28,
    height: '6-1',
    weight: 225,
    experience: 5,
    stats2023: {
      passingYards: 3305,
      passingTDs: 15,
      interceptions: 9,
      rushingYards: 185,
      rushingTDs: 0,
      completionPct: 62.2,
      gamesPlayed: 13
    },
    projections2024: {
      passingYards: 3000,
      passingTDs: 17,
      interceptions: 11,
      rushingYards: 150,
      rushingTDs: 1,
      fantasyPoints: 235
    },
    adp: 20.2,
    byeWeek: 10
  },
  {
    name: 'Bryce Young',
    team: 'CAR',
    position: 'QB',
    age: 23,
    height: '5-10',
    weight: 204,
    experience: 2,
    stats2023: {
      passingYards: 2877,
      passingTDs: 11,
      interceptions: 10,
      rushingYards: 253,
      rushingTDs: 0,
      completionPct: 59.8,
      gamesPlayed: 16
    },
    projections2024: {
      passingYards: 3300,
      passingTDs: 17,
      interceptions: 12,
      rushingYards: 300,
      rushingTDs: 3,
      fantasyPoints: 250
    },
    adp: 18.5,
    byeWeek: 11
  },
  {
    name: 'Daniel Jones',
    team: 'NYG',
    position: 'QB',
    age: 27,
    height: '6-5',
    weight: 221,
    experience: 5,
    stats2023: {
      passingYards: 909,
      passingTDs: 2,
      interceptions: 6,
      rushingYards: 166,
      rushingTDs: 1,
      completionPct: 67.5,
      gamesPlayed: 6
    },
    projections2024: {
      passingYards: 3100,
      passingTDs: 16,
      interceptions: 10,
      rushingYards: 400,
      rushingTDs: 4,
      fantasyPoints: 255
    },
    adp: 19.8,
    byeWeek: 11
  },
  {
    name: 'Mac Jones',
    team: 'JAX',
    position: 'QB',
    age: 26,
    height: '6-3',
    weight: 214,
    experience: 3,
    stats2023: {
      passingYards: 2120,
      passingTDs: 10,
      interceptions: 12,
      rushingYards: 113,
      rushingTDs: 1,
      completionPct: 64.9,
      gamesPlayed: 11
    },
    projections2024: {
      passingYards: 2800,
      passingTDs: 14,
      interceptions: 10,
      rushingYards: 100,
      rushingTDs: 1,
      fantasyPoints: 220
    },
    adp: 22.5,
    byeWeek: 12
  },
  {
    name: 'Kenny Pickett',
    team: 'PHI',
    position: 'QB',
    age: 26,
    height: '6-3',
    weight: 220,
    experience: 2,
    stats2023: {
      passingYards: 2070,
      passingTDs: 6,
      interceptions: 4,
      rushingYards: 152,
      rushingTDs: 2,
      completionPct: 62.0,
      gamesPlayed: 12
    },
    projections2024: {
      passingYards: 2500,
      passingTDs: 12,
      interceptions: 8,
      rushingYards: 150,
      rushingTDs: 2,
      fantasyPoints: 210
    },
    adp: 23.8,
    byeWeek: 5
  },
  {
    name: 'Jacoby Brissett',
    team: 'NE',
    position: 'QB',
    age: 31,
    height: '6-4',
    weight: 235,
    experience: 8,
    stats2023: {
      passingYards: 224,
      passingTDs: 0,
      interceptions: 1,
      rushingYards: 5,
      rushingTDs: 0,
      completionPct: 54.3,
      gamesPlayed: 2
    },
    projections2024: {
      passingYards: 2600,
      passingTDs: 14,
      interceptions: 9,
      rushingYards: 120,
      rushingTDs: 2,
      fantasyPoints: 215
    },
    adp: 24.2,
    byeWeek: 14
  },
  {
    name: 'Bo Nix',
    team: 'DEN',
    position: 'QB',
    age: 24,
    height: '6-2',
    weight: 214,
    experience: 1,
    stats2023: {
      passingYards: 0,
      passingTDs: 0,
      interceptions: 0,
      rushingYards: 0,
      rushingTDs: 0,
      completionPct: 0,
      gamesPlayed: 0
    },
    projections2024: {
      passingYards: 2800,
      passingTDs: 15,
      interceptions: 12,
      rushingYards: 300,
      rushingTDs: 3,
      fantasyPoints: 235
    },
    adp: 21.5,
    byeWeek: 14
  },
  {
    name: 'Drake Maye',
    team: 'NE',
    position: 'QB',
    age: 22,
    height: '6-4',
    weight: 223,
    experience: 1,
    stats2023: {
      passingYards: 0,
      passingTDs: 0,
      interceptions: 0,
      rushingYards: 0,
      rushingTDs: 0,
      completionPct: 0,
      gamesPlayed: 0
    },
    projections2024: {
      passingYards: 2400,
      passingTDs: 13,
      interceptions: 10,
      rushingYards: 250,
      rushingTDs: 3,
      fantasyPoints: 220
    },
    adp: 23.2,
    byeWeek: 14
  },
  {
    name: 'J.J. McCarthy',
    team: 'MIN',
    position: 'QB',
    age: 21,
    height: '6-3',
    weight: 219,
    experience: 1,
    stats2023: {
      passingYards: 0,
      passingTDs: 0,
      interceptions: 0,
      rushingYards: 0,
      rushingTDs: 0,
      completionPct: 0,
      gamesPlayed: 0
    },
    projections2024: {
      passingYards: 2200,
      passingTDs: 12,
      interceptions: 9,
      rushingYards: 200,
      rushingTDs: 2,
      fantasyPoints: 205
    },
    adp: 24.8,
    byeWeek: 6
  },
  {
    name: 'Michael Penix Jr.',
    team: 'ATL',
    position: 'QB',
    age: 24,
    height: '6-2',
    weight: 218,
    experience: 1,
    stats2023: {
      passingYards: 0,
      passingTDs: 0,
      interceptions: 0,
      rushingYards: 0,
      rushingTDs: 0,
      completionPct: 0,
      gamesPlayed: 0
    },
    projections2024: {
      passingYards: 2000,
      passingTDs: 11,
      interceptions: 8,
      rushingYards: 100,
      rushingTDs: 1,
      fantasyPoints: 190
    },
    adp: 25.5,
    byeWeek: 12
  }
];

export const runningBacks: any[] = [
  // Elite Tier RBs
  {
    name: 'Christian McCaffrey',
    team: 'SF',
    position: 'RB',
    age: 28,
    height: '5-11',
    weight: 205,
    experience: 7,
    stats2023: {
      rushingYards: 1459,
      rushingTDs: 14,
      receptions: 67,
      receivingYards: 564,
      receivingTDs: 7,
      gamesPlayed: 17
    },
    projections2024: {
      rushingYards: 1350,
      rushingTDs: 12,
      receptions: 70,
      receivingYards: 550,
      receivingTDs: 5,
      fantasyPoints: 330
    },
    adp: 1.1,
    byeWeek: 9
  },
  {
    name: 'Breece Hall',
    team: 'NYJ',
    position: 'RB',
    age: 23,
    height: '5-11',
    weight: 217,
    experience: 3,
    stats2023: {
      rushingYards: 994,
      rushingTDs: 5,
      receptions: 76,
      receivingYards: 591,
      receivingTDs: 4,
      gamesPlayed: 17
    },
    projections2024: {
      rushingYards: 1200,
      rushingTDs: 10,
      receptions: 75,
      receivingYards: 600,
      receivingTDs: 4,
      fantasyPoints: 310
    },
    adp: 1.5,
    byeWeek: 12
  },
  {
    name: 'Bijan Robinson',
    team: 'ATL',
    position: 'RB',
    age: 22,
    height: '5-11',
    weight: 215,
    experience: 2,
    stats2023: {
      rushingYards: 976,
      rushingTDs: 4,
      receptions: 58,
      receivingYards: 487,
      receivingTDs: 4,
      gamesPlayed: 17
    },
    projections2024: {
      rushingYards: 1250,
      rushingTDs: 10,
      receptions: 65,
      receivingYards: 500,
      receivingTDs: 4,
      fantasyPoints: 305
    },
    adp: 1.7,
    byeWeek: 12
  },
  {
    name: 'Jonathan Taylor',
    team: 'IND',
    position: 'RB',
    age: 25,
    height: '5-10',
    weight: 226,
    experience: 4,
    stats2023: {
      rushingYards: 741,
      rushingTDs: 7,
      receptions: 29,
      receivingYards: 198,
      receivingTDs: 1,
      gamesPlayed: 10
    },
    projections2024: {
      rushingYards: 1300,
      rushingTDs: 11,
      receptions: 40,
      receivingYards: 300,
      receivingTDs: 2,
      fantasyPoints: 285
    },
    adp: 2.8,
    byeWeek: 14
  },
  {
    name: 'Saquon Barkley',
    team: 'PHI',
    position: 'RB',
    age: 27,
    height: '6-0',
    weight: 233,
    experience: 6,
    stats2023: {
      rushingYards: 962,
      rushingTDs: 6,
      receptions: 41,
      receivingYards: 280,
      receivingTDs: 4,
      gamesPlayed: 14
    },
    projections2024: {
      rushingYards: 1150,
      rushingTDs: 9,
      receptions: 50,
      receivingYards: 400,
      receivingTDs: 3,
      fantasyPoints: 275
    },
    adp: 3.2,
    byeWeek: 5
  },
  
  // Tier 2 RBs
  {
    name: 'Jahmyr Gibbs',
    team: 'DET',
    position: 'RB',
    age: 22,
    height: '5-9',
    weight: 199,
    experience: 2,
    stats2023: {
      rushingYards: 945,
      rushingTDs: 10,
      receptions: 52,
      receivingYards: 316,
      receivingTDs: 1,
      gamesPlayed: 15
    },
    projections2024: {
      rushingYards: 1100,
      rushingTDs: 11,
      receptions: 60,
      receivingYards: 450,
      receivingTDs: 3,
      fantasyPoints: 290
    },
    adp: 2.5,
    byeWeek: 5
  },
  {
    name: 'Travis Etienne Jr.',
    team: 'JAX',
    position: 'RB',
    age: 25,
    height: '5-10',
    weight: 215,
    experience: 3,
    stats2023: {
      rushingYards: 1008,
      rushingTDs: 11,
      receptions: 58,
      receivingYards: 316,
      receivingTDs: 1,
      gamesPlayed: 17
    },
    projections2024: {
      rushingYards: 1050,
      rushingTDs: 9,
      receptions: 55,
      receivingYards: 400,
      receivingTDs: 2,
      fantasyPoints: 265
    },
    adp: 4.2,
    byeWeek: 12
  },
  {
    name: 'De\'Von Achane',
    team: 'MIA',
    position: 'RB',
    age: 23,
    height: '5-9',
    weight: 188,
    experience: 2,
    stats2023: {
      rushingYards: 800,
      rushingTDs: 8,
      receptions: 27,
      receivingYards: 197,
      receivingTDs: 3,
      gamesPlayed: 11
    },
    projections2024: {
      rushingYards: 1000,
      rushingTDs: 9,
      receptions: 45,
      receivingYards: 350,
      receivingTDs: 3,
      fantasyPoints: 260
    },
    adp: 4.5,
    byeWeek: 6
  },
  {
    name: 'Kyren Williams',
    team: 'LAR',
    position: 'RB',
    age: 24,
    height: '5-9',
    weight: 194,
    experience: 2,
    stats2023: {
      rushingYards: 1144,
      rushingTDs: 12,
      receptions: 32,
      receivingYards: 206,
      receivingTDs: 3,
      gamesPlayed: 12
    },
    projections2024: {
      rushingYards: 1100,
      rushingTDs: 10,
      receptions: 40,
      receivingYards: 300,
      receivingTDs: 2,
      fantasyPoints: 265
    },
    adp: 4.8,
    byeWeek: 6
  },
  {
    name: 'Isiah Pacheco',
    team: 'KC',
    position: 'RB',
    age: 25,
    height: '5-10',
    weight: 216,
    experience: 3,
    stats2023: {
      rushingYards: 935,
      rushingTDs: 7,
      receptions: 44,
      receivingYards: 244,
      receivingTDs: 2,
      gamesPlayed: 14
    },
    projections2024: {
      rushingYards: 1050,
      rushingTDs: 9,
      receptions: 45,
      receivingYards: 300,
      receivingTDs: 2,
      fantasyPoints: 255
    },
    adp: 5.2,
    byeWeek: 6
  },
  {
    name: 'Josh Jacobs',
    team: 'GB',
    position: 'RB',
    age: 26,
    height: '5-10',
    weight: 223,
    experience: 5,
    stats2023: {
      rushingYards: 805,
      rushingTDs: 6,
      receptions: 40,
      receivingYards: 290,
      receivingTDs: 2,
      gamesPlayed: 13
    },
    projections2024: {
      rushingYards: 1100,
      rushingTDs: 10,
      receptions: 45,
      receivingYards: 350,
      receivingTDs: 2,
      fantasyPoints: 270
    },
    adp: 5.5,
    byeWeek: 10
  },
  {
    name: 'Kenneth Walker III',
    team: 'SEA',
    position: 'RB',
    age: 24,
    height: '5-9',
    weight: 211,
    experience: 3,
    stats2023: {
      rushingYards: 905,
      rushingTDs: 8,
      receptions: 29,
      receivingYards: 259,
      receivingTDs: 0,
      gamesPlayed: 15
    },
    projections2024: {
      rushingYards: 1000,
      rushingTDs: 9,
      receptions: 35,
      receivingYards: 275,
      receivingTDs: 1,
      fantasyPoints: 250
    },
    adp: 5.8,
    byeWeek: 10
  },
  {
    name: 'Derrick Henry',
    team: 'BAL',
    position: 'RB',
    age: 30,
    height: '6-3',
    weight: 247,
    experience: 8,
    stats2023: {
      rushingYards: 1167,
      rushingTDs: 12,
      receptions: 28,
      receivingYards: 214,
      receivingTDs: 0,
      gamesPlayed: 17
    },
    projections2024: {
      rushingYards: 1050,
      rushingTDs: 10,
      receptions: 25,
      receivingYards: 180,
      receivingTDs: 1,
      fantasyPoints: 245
    },
    adp: 6.2,
    byeWeek: 14
  },
  {
    name: 'James Cook',
    team: 'BUF',
    position: 'RB',
    age: 25,
    height: '5-11',
    weight: 190,
    experience: 3,
    stats2023: {
      rushingYards: 1122,
      rushingTDs: 2,
      receptions: 44,
      receivingYards: 445,
      receivingTDs: 4,
      gamesPlayed: 17
    },
    projections2024: {
      rushingYards: 1000,
      rushingTDs: 8,
      receptions: 50,
      receivingYards: 400,
      receivingTDs: 3,
      fantasyPoints: 260
    },
    adp: 6.5,
    byeWeek: 13
  },
  {
    name: 'Rachaad White',
    team: 'TB',
    position: 'RB',
    age: 25,
    height: '6-0',
    weight: 214,
    experience: 3,
    stats2023: {
      rushingYards: 990,
      rushingTDs: 6,
      receptions: 70,
      receivingYards: 549,
      receivingTDs: 3,
      gamesPlayed: 17
    },
    projections2024: {
      rushingYards: 950,
      rushingTDs: 7,
      receptions: 65,
      receivingYards: 500,
      receivingTDs: 3,
      fantasyPoints: 265
    },
    adp: 6.8,
    byeWeek: 11
  },
  
  // Tier 3 RBs
  {
    name: 'Joe Mixon',
    team: 'HOU',
    position: 'RB',
    age: 28,
    height: '6-1',
    weight: 220,
    experience: 7,
    stats2023: {
      rushingYards: 1034,
      rushingTDs: 9,
      receptions: 51,
      receivingYards: 376,
      receivingTDs: 3,
      gamesPlayed: 17
    },
    projections2024: {
      rushingYards: 950,
      rushingTDs: 8,
      receptions: 45,
      receivingYards: 350,
      receivingTDs: 2,
      fantasyPoints: 245
    },
    adp: 7.2,
    byeWeek: 14
  },
  {
    name: 'Alvin Kamara',
    team: 'NO',
    position: 'RB',
    age: 29,
    height: '5-10',
    weight: 215,
    experience: 7,
    stats2023: {
      rushingYards: 694,
      rushingTDs: 5,
      receptions: 75,
      receivingYards: 466,
      receivingTDs: 1,
      gamesPlayed: 13
    },
    projections2024: {
      rushingYards: 850,
      rushingTDs: 7,
      receptions: 70,
      receivingYards: 550,
      receivingTDs: 3,
      fantasyPoints: 255
    },
    adp: 7.5,
    byeWeek: 12
  },
  {
    name: 'Aaron Jones',
    team: 'MIN',
    position: 'RB',
    age: 30,
    height: '5-9',
    weight: 208,
    experience: 7,
    stats2023: {
      rushingYards: 656,
      rushingTDs: 2,
      receptions: 46,
      receivingYards: 421,
      receivingTDs: 2,
      gamesPlayed: 11
    },
    projections2024: {
      rushingYards: 900,
      rushingTDs: 7,
      receptions: 50,
      receivingYards: 400,
      receivingTDs: 2,
      fantasyPoints: 240
    },
    adp: 8.2,
    byeWeek: 6
  },
  {
    name: 'David Montgomery',
    team: 'DET',
    position: 'RB',
    age: 27,
    height: '5-10',
    weight: 224,
    experience: 5,
    stats2023: {
      rushingYards: 1015,
      rushingTDs: 13,
      receptions: 33,
      receivingYards: 219,
      receivingTDs: 0,
      gamesPlayed: 14
    },
    projections2024: {
      rushingYards: 900,
      rushingTDs: 10,
      receptions: 35,
      receivingYards: 250,
      receivingTDs: 1,
      fantasyPoints: 235
    },
    adp: 8.5,
    byeWeek: 5
  },
  {
    name: 'James Conner',
    team: 'ARI',
    position: 'RB',
    age: 29,
    height: '6-1',
    weight: 233,
    experience: 7,
    stats2023: {
      rushingYards: 1040,
      rushingTDs: 7,
      receptions: 28,
      receivingYards: 151,
      receivingTDs: 0,
      gamesPlayed: 13
    },
    projections2024: {
      rushingYards: 950,
      rushingTDs: 8,
      receptions: 35,
      receivingYards: 250,
      receivingTDs: 1,
      fantasyPoints: 230
    },
    adp: 8.8,
    byeWeek: 11
  },
  {
    name: 'Tony Pollard',
    team: 'TEN',
    position: 'RB',
    age: 27,
    height: '6-0',
    weight: 209,
    experience: 5,
    stats2023: {
      rushingYards: 1005,
      rushingTDs: 6,
      receptions: 55,
      receivingYards: 311,
      receivingTDs: 0,
      gamesPlayed: 17
    },
    projections2024: {
      rushingYards: 950,
      rushingTDs: 7,
      receptions: 50,
      receivingYards: 350,
      receivingTDs: 2,
      fantasyPoints: 240
    },
    adp: 9.2,
    byeWeek: 5
  },
  {
    name: 'Najee Harris',
    team: 'PIT',
    position: 'RB',
    age: 26,
    height: '6-1',
    weight: 242,
    experience: 3,
    stats2023: {
      rushingYards: 1035,
      rushingTDs: 8,
      receptions: 29,
      receivingYards: 170,
      receivingTDs: 0,
      gamesPlayed: 17
    },
    projections2024: {
      rushingYards: 950,
      rushingTDs: 7,
      receptions: 35,
      receivingYards: 250,
      receivingTDs: 1,
      fantasyPoints: 225
    },
    adp: 9.5,
    byeWeek: 9
  },
  {
    name: 'Rhamondre Stevenson',
    team: 'NE',
    position: 'RB',
    age: 26,
    height: '6-0',
    weight: 227,
    experience: 3,
    stats2023: {
      rushingYards: 619,
      rushingTDs: 4,
      receptions: 38,
      receivingYards: 238,
      receivingTDs: 0,
      gamesPlayed: 12
    },
    projections2024: {
      rushingYards: 900,
      rushingTDs: 7,
      receptions: 45,
      receivingYards: 350,
      receivingTDs: 2,
      fantasyPoints: 235
    },
    adp: 9.8,
    byeWeek: 14
  },
  {
    name: 'Brian Robinson Jr.',
    team: 'WAS',
    position: 'RB',
    age: 25,
    height: '6-0',
    weight: 228,
    experience: 3,
    stats2023: {
      rushingYards: 733,
      rushingTDs: 5,
      receptions: 30,
      receivingYards: 163,
      receivingTDs: 0,
      gamesPlayed: 15
    },
    projections2024: {
      rushingYards: 850,
      rushingTDs: 7,
      receptions: 35,
      receivingYards: 250,
      receivingTDs: 1,
      fantasyPoints: 215
    },
    adp: 10.5,
    byeWeek: 14
  },
  {
    name: 'Trey Benson',
    team: 'ARI',
    position: 'RB',
    age: 22,
    height: '6-0',
    weight: 216,
    experience: 1,
    stats2023: {
      rushingYards: 0,
      rushingTDs: 0,
      receptions: 0,
      receivingYards: 0,
      receivingTDs: 0,
      gamesPlayed: 0
    },
    projections2024: {
      rushingYards: 750,
      rushingTDs: 6,
      receptions: 30,
      receivingYards: 225,
      receivingTDs: 1,
      fantasyPoints: 195
    },
    adp: 11.2,
    byeWeek: 11
  },
  
  // Tier 4 RBs
  {
    name: 'Jaylen Warren',
    team: 'PIT',
    position: 'RB',
    age: 26,
    height: '5-8',
    weight: 215,
    experience: 3,
    stats2023: {
      rushingYards: 784,
      rushingTDs: 4,
      receptions: 61,
      receivingYards: 370,
      receivingTDs: 0,
      gamesPlayed: 15
    },
    projections2024: {
      rushingYards: 700,
      rushingTDs: 5,
      receptions: 55,
      receivingYards: 400,
      receivingTDs: 2,
      fantasyPoints: 220
    },
    adp: 10.8,
    byeWeek: 9
  },
  {
    name: 'Zack Moss',
    team: 'CIN',
    position: 'RB',
    age: 27,
    height: '5-9',
    weight: 223,
    experience: 4,
    stats2023: {
      rushingYards: 794,
      rushingTDs: 5,
      receptions: 27,
      receivingYards: 183,
      receivingTDs: 1,
      gamesPlayed: 15
    },
    projections2024: {
      rushingYards: 800,
      rushingTDs: 6,
      receptions: 35,
      receivingYards: 250,
      receivingTDs: 1,
      fantasyPoints: 210
    },
    adp: 11.5,
    byeWeek: 12
  },
  {
    name: 'Jonathon Brooks',
    team: 'CAR',
    position: 'RB',
    age: 21,
    height: '6-0',
    weight: 216,
    experience: 1,
    stats2023: {
      rushingYards: 0,
      rushingTDs: 0,
      receptions: 0,
      receivingYards: 0,
      receivingTDs: 0,
      gamesPlayed: 0
    },
    projections2024: {
      rushingYards: 700,
      rushingTDs: 5,
      receptions: 35,
      receivingYards: 275,
      receivingTDs: 2,
      fantasyPoints: 200
    },
    adp: 12.2,
    byeWeek: 11
  },
  {
    name: 'Devin Singletary',
    team: 'NYG',
    position: 'RB',
    age: 27,
    height: '5-7',
    weight: 203,
    experience: 5,
    stats2023: {
      rushingYards: 898,
      rushingTDs: 4,
      receptions: 30,
      receivingYards: 193,
      receivingTDs: 1,
      gamesPlayed: 17
    },
    projections2024: {
      rushingYards: 750,
      rushingTDs: 5,
      receptions: 35,
      receivingYards: 250,
      receivingTDs: 1,
      fantasyPoints: 195
    },
    adp: 12.5,
    byeWeek: 11
  },
  {
    name: 'Javonte Williams',
    team: 'DEN',
    position: 'RB',
    age: 24,
    height: '5-10',
    weight: 220,
    experience: 3,
    stats2023: {
      rushingYards: 774,
      rushingTDs: 3,
      receptions: 21,
      receivingYards: 156,
      receivingTDs: 2,
      gamesPlayed: 16
    },
    projections2024: {
      rushingYards: 750,
      rushingTDs: 6,
      receptions: 30,
      receivingYards: 225,
      receivingTDs: 1,
      fantasyPoints: 195
    },
    adp: 12.8,
    byeWeek: 14
  },
  {
    name: 'Nick Chubb',
    team: 'CLE',
    position: 'RB',
    age: 29,
    height: '5-11',
    weight: 227,
    experience: 6,
    stats2023: {
      rushingYards: 170,
      rushingTDs: 0,
      receptions: 2,
      receivingYards: 11,
      receivingTDs: 0,
      gamesPlayed: 2
    },
    projections2024: {
      rushingYards: 700,
      rushingTDs: 7,
      receptions: 20,
      receivingYards: 150,
      receivingTDs: 0,
      fantasyPoints: 180
    },
    adp: 13.5,
    byeWeek: 10
  },
  {
    name: 'Raheem Mostert',
    team: 'MIA',
    position: 'RB',
    age: 32,
    height: '5-10',
    weight: 205,
    experience: 9,
    stats2023: {
      rushingYards: 1012,
      rushingTDs: 18,
      receptions: 21,
      receivingYards: 152,
      receivingTDs: 3,
      gamesPlayed: 15
    },
    projections2024: {
      rushingYards: 650,
      rushingTDs: 8,
      receptions: 20,
      receivingYards: 150,
      receivingTDs: 1,
      fantasyPoints: 190
    },
    adp: 13.2,
    byeWeek: 6
  },
  {
    name: 'Austin Ekeler',
    team: 'WAS',
    position: 'RB',
    age: 29,
    height: '5-10',
    weight: 200,
    experience: 7,
    stats2023: {
      rushingYards: 628,
      rushingTDs: 5,
      receptions: 51,
      receivingYards: 436,
      receivingTDs: 1,
      gamesPlayed: 14
    },
    projections2024: {
      rushingYards: 600,
      rushingTDs: 5,
      receptions: 55,
      receivingYards: 450,
      receivingTDs: 3,
      fantasyPoints: 215
    },
    adp: 11.8,
    byeWeek: 14
  },
  {
    name: 'Chase Brown',
    team: 'CIN',
    position: 'RB',
    age: 24,
    height: '5-9',
    weight: 209,
    experience: 2,
    stats2023: {
      rushingYards: 179,
      rushingTDs: 0,
      receptions: 14,
      receivingYards: 157,
      receivingTDs: 1,
      gamesPlayed: 12
    },
    projections2024: {
      rushingYards: 600,
      rushingTDs: 4,
      receptions: 35,
      receivingYards: 275,
      receivingTDs: 2,
      fantasyPoints: 185
    },
    adp: 14.2,
    byeWeek: 12
  },
  {
    name: 'Jerome Ford',
    team: 'CLE',
    position: 'RB',
    age: 25,
    height: '5-10',
    weight: 210,
    experience: 3,
    stats2023: {
      rushingYards: 813,
      rushingTDs: 4,
      receptions: 44,
      receivingYards: 319,
      receivingTDs: 1,
      gamesPlayed: 16
    },
    projections2024: {
      rushingYards: 700,
      rushingTDs: 5,
      receptions: 40,
      receivingYards: 300,
      receivingTDs: 1,
      fantasyPoints: 195
    },
    adp: 13.8,
    byeWeek: 10
  },
  
  // Backup/Handcuff RBs
  {
    name: 'Tyjae Spears',
    team: 'TEN',
    position: 'RB',
    age: 23,
    height: '5-10',
    weight: 201,
    experience: 2,
    stats2023: {
      rushingYards: 453,
      rushingTDs: 2,
      receptions: 52,
      receivingYards: 385,
      receivingTDs: 1,
      gamesPlayed: 14
    },
    projections2024: {
      rushingYards: 500,
      rushingTDs: 4,
      receptions: 45,
      receivingYards: 350,
      receivingTDs: 2,
      fantasyPoints: 185
    },
    adp: 14.5,
    byeWeek: 5
  },
  {
    name: 'Gus Edwards',
    team: 'LAC',
    position: 'RB',
    age: 29,
    height: '6-1',
    weight: 238,
    experience: 6,
    stats2023: {
      rushingYards: 810,
      rushingTDs: 13,
      receptions: 5,
      receivingYards: 23,
      receivingTDs: 0,
      gamesPlayed: 17
    },
    projections2024: {
      rushingYards: 650,
      rushingTDs: 8,
      receptions: 10,
      receivingYards: 75,
      receivingTDs: 0,
      fantasyPoints: 175
    },
    adp: 15.2,
    byeWeek: 5
  },
  {
    name: 'Ezekiel Elliott',
    team: 'DAL',
    position: 'RB',
    age: 29,
    height: '6-0',
    weight: 228,
    experience: 8,
    stats2023: {
      rushingYards: 642,
      rushingTDs: 3,
      receptions: 51,
      receivingYards: 313,
      receivingTDs: 2,
      gamesPlayed: 17
    },
    projections2024: {
      rushingYards: 550,
      rushingTDs: 5,
      receptions: 35,
      receivingYards: 250,
      receivingTDs: 1,
      fantasyPoints: 170
    },
    adp: 15.8,
    byeWeek: 7
  },
  {
    name: 'Zach Charbonnet',
    team: 'SEA',
    position: 'RB',
    age: 23,
    height: '6-1',
    weight: 214,
    experience: 2,
    stats2023: {
      rushingYards: 462,
      rushingTDs: 1,
      receptions: 33,
      receivingYards: 264,
      receivingTDs: 2,
      gamesPlayed: 15
    },
    projections2024: {
      rushingYards: 500,
      rushingTDs: 4,
      receptions: 35,
      receivingYards: 275,
      receivingTDs: 2,
      fantasyPoints: 175
    },
    adp: 16.2,
    byeWeek: 10
  },
  {
    name: 'Rico Dowdle',
    team: 'DAL',
    position: 'RB',
    age: 26,
    height: '6-0',
    weight: 215,
    experience: 4,
    stats2023: {
      rushingYards: 361,
      rushingTDs: 2,
      receptions: 17,
      receivingYards: 144,
      receivingTDs: 0,
      gamesPlayed: 16
    },
    projections2024: {
      rushingYards: 450,
      rushingTDs: 4,
      receptions: 25,
      receivingYards: 200,
      receivingTDs: 1,
      fantasyPoints: 155
    },
    adp: 17.5,
    byeWeek: 7
  },
  {
    name: 'MarShawn Lloyd',
    team: 'GB',
    position: 'RB',
    age: 23,
    height: '5-9',
    weight: 220,
    experience: 1,
    stats2023: {
      rushingYards: 0,
      rushingTDs: 0,
      receptions: 0,
      receivingYards: 0,
      receivingTDs: 0,
      gamesPlayed: 0
    },
    projections2024: {
      rushingYards: 400,
      rushingTDs: 3,
      receptions: 20,
      receivingYards: 150,
      receivingTDs: 1,
      fantasyPoints: 135
    },
    adp: 18.2,
    byeWeek: 10
  },
  {
    name: 'Kendre Miller',
    team: 'NO',
    position: 'RB',
    age: 22,
    height: '5-11',
    weight: 215,
    experience: 2,
    stats2023: {
      rushingYards: 156,
      rushingTDs: 1,
      receptions: 7,
      receivingYards: 28,
      receivingTDs: 0,
      gamesPlayed: 8
    },
    projections2024: {
      rushingYards: 450,
      rushingTDs: 4,
      receptions: 20,
      receivingYards: 150,
      receivingTDs: 1,
      fantasyPoints: 145
    },
    adp: 18.5,
    byeWeek: 12
  },
  {
    name: 'Blake Corum',
    team: 'LAR',
    position: 'RB',
    age: 23,
    height: '5-8',
    weight: 210,
    experience: 1,
    stats2023: {
      rushingYards: 0,
      rushingTDs: 0,
      receptions: 0,
      receivingYards: 0,
      receivingTDs: 0,
      gamesPlayed: 0
    },
    projections2024: {
      rushingYards: 400,
      rushingTDs: 4,
      receptions: 15,
      receivingYards: 100,
      receivingTDs: 0,
      fantasyPoints: 130
    },
    adp: 19.2,
    byeWeek: 6
  },
  {
    name: 'Khalil Herbert',
    team: 'CHI',
    position: 'RB',
    age: 26,
    height: '5-9',
    weight: 212,
    experience: 3,
    stats2023: {
      rushingYards: 272,
      rushingTDs: 2,
      receptions: 7,
      receivingYards: 50,
      receivingTDs: 0,
      gamesPlayed: 10
    },
    projections2024: {
      rushingYards: 450,
      rushingTDs: 4,
      receptions: 20,
      receivingYards: 150,
      receivingTDs: 0,
      fantasyPoints: 140
    },
    adp: 19.5,
    byeWeek: 7
  },
  {
    name: 'Roschon Johnson',
    team: 'CHI',
    position: 'RB',
    age: 23,
    height: '6-0',
    weight: 223,
    experience: 2,
    stats2023: {
      rushingYards: 352,
      rushingTDs: 2,
      receptions: 13,
      receivingYards: 84,
      receivingTDs: 0,
      gamesPlayed: 14
    },
    projections2024: {
      rushingYards: 400,
      rushingTDs: 4,
      receptions: 20,
      receivingYards: 150,
      receivingTDs: 1,
      fantasyPoints: 145
    },
    adp: 19.8,
    byeWeek: 7
  },
  {
    name: 'Antonio Gibson',
    team: 'NE',
    position: 'RB',
    age: 26,
    height: '6-0',
    weight: 228,
    experience: 4,
    stats2023: {
      rushingYards: 503,
      rushingTDs: 3,
      receptions: 41,
      receivingYards: 389,
      receivingTDs: 0,
      gamesPlayed: 17
    },
    projections2024: {
      rushingYards: 400,
      rushingTDs: 3,
      receptions: 35,
      receivingYards: 300,
      receivingTDs: 1,
      fantasyPoints: 155
    },
    adp: 18.8,
    byeWeek: 14
  },
  {
    name: 'Ray Davis',
    team: 'BUF',
    position: 'RB',
    age: 24,
    height: '5-8',
    weight: 211,
    experience: 1,
    stats2023: {
      rushingYards: 0,
      rushingTDs: 0,
      receptions: 0,
      receivingYards: 0,
      receivingTDs: 0,
      gamesPlayed: 0
    },
    projections2024: {
      rushingYards: 350,
      rushingTDs: 3,
      receptions: 20,
      receivingYards: 150,
      receivingTDs: 1,
      fantasyPoints: 130
    },
    adp: 20.5,
    byeWeek: 13
  },
  {
    name: 'Ty Chandler',
    team: 'MIN',
    position: 'RB',
    age: 26,
    height: '5-11',
    weight: 204,
    experience: 2,
    stats2023: {
      rushingYards: 461,
      rushingTDs: 0,
      receptions: 15,
      receivingYards: 95,
      receivingTDs: 1,
      gamesPlayed: 15
    },
    projections2024: {
      rushingYards: 400,
      rushingTDs: 3,
      receptions: 20,
      receivingYards: 150,
      receivingTDs: 1,
      fantasyPoints: 135
    },
    adp: 20.8,
    byeWeek: 6
  },
  {
    name: 'Chuba Hubbard',
    team: 'CAR',
    position: 'RB',
    age: 25,
    height: '6-0',
    weight: 210,
    experience: 3,
    stats2023: {
      rushingYards: 902,
      rushingTDs: 5,
      receptions: 39,
      receivingYards: 154,
      receivingTDs: 0,
      gamesPlayed: 17
    },
    projections2024: {
      rushingYards: 500,
      rushingTDs: 4,
      receptions: 25,
      receivingYards: 175,
      receivingTDs: 0,
      fantasyPoints: 145
    },
    adp: 17.8,
    byeWeek: 11
  },
  {
    name: 'Tyler Allgeier',
    team: 'ATL',
    position: 'RB',
    age: 24,
    height: '5-11',
    weight: 224,
    experience: 3,
    stats2023: {
      rushingYards: 664,
      rushingTDs: 3,
      receptions: 17,
      receivingYards: 132,
      receivingTDs: 0,
      gamesPlayed: 17
    },
    projections2024: {
      rushingYards: 450,
      rushingTDs: 4,
      receptions: 15,
      receivingYards: 100,
      receivingTDs: 0,
      fantasyPoints: 135
    },
    adp: 20.2,
    byeWeek: 12
  },
  {
    name: 'J.K. Dobbins',
    team: 'LAC',
    position: 'RB',
    age: 25,
    height: '5-10',
    weight: 212,
    experience: 4,
    stats2023: {
      rushingYards: 223,
      rushingTDs: 1,
      receptions: 4,
      receivingYards: 37,
      receivingTDs: 0,
      gamesPlayed: 1
    },
    projections2024: {
      rushingYards: 600,
      rushingTDs: 5,
      receptions: 25,
      receivingYards: 200,
      receivingTDs: 1,
      fantasyPoints: 170
    },
    adp: 16.8,
    byeWeek: 5
  },
  {
    name: 'Audric Estime',
    team: 'DEN',
    position: 'RB',
    age: 21,
    height: '5-11',
    weight: 221,
    experience: 1,
    stats2023: {
      rushingYards: 0,
      rushingTDs: 0,
      receptions: 0,
      receivingYards: 0,
      receivingTDs: 0,
      gamesPlayed: 0
    },
    projections2024: {
      rushingYards: 350,
      rushingTDs: 3,
      receptions: 15,
      receivingYards: 100,
      receivingTDs: 0,
      fantasyPoints: 120
    },
    adp: 21.5,
    byeWeek: 14
  },
  {
    name: 'Bucky Irving',
    team: 'TB',
    position: 'RB',
    age: 22,
    height: '5-9',
    weight: 192,
    experience: 1,
    stats2023: {
      rushingYards: 0,
      rushingTDs: 0,
      receptions: 0,
      receivingYards: 0,
      receivingTDs: 0,
      gamesPlayed: 0
    },
    projections2024: {
      rushingYards: 300,
      rushingTDs: 2,
      receptions: 20,
      receivingYards: 150,
      receivingTDs: 1,
      fantasyPoints: 115
    },
    adp: 22.2,
    byeWeek: 11
  }
];