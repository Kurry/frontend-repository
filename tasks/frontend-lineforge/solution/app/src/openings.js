// Bundled opening library. All players, events, statistics and games are
// invented sample content created for this app.

export const OPENINGS = [
  // Open Games
  {
    id: 'italian',
    name: 'Italian Game',
    code: 'C50',
    family: 'Open Games',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6'],
    branches: [
      { name: 'Giuoco Piano', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'O-O'] },
      { name: 'Evans Gambit', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4'] }
    ],
    stats: { whiteWin: 38, draw: 32, blackWin: 30, games: 24500 },
    notableGames: [
      { white: 'A. Castellan', black: 'M. Okonkwo', event: 'Harborview Open', year: 2021, result: '1-0', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6', 'O-O', 'O-O', 'h3', 'Be6', 'Bxe6', 'fxe6'] },
      { white: 'L. Ferrand', black: 'S. Marlow', event: 'Stonebridge Masters', year: 2022, result: '1/2-1/2', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O', 'Nf6', 'd3', 'O-O', 'c3', 'd5'] },
      { white: 'K. Juneau', black: 'R. Whitcombe', event: 'Eastvale Invitational', year: 2023, result: '0-1', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4', 'Bxb4', 'c3', 'Ba5', 'd4', 'exd4'] }
    ]
  },
  {
    id: 'ruylopez',
    name: 'Ruy Lopez',
    code: 'C60',
    family: 'Open Games',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'],
    branches: [
      { name: 'Closed Main Line', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6'] },
      { name: 'Exchange Variation', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Bxc6', 'dxc6'] }
    ],
    stats: { whiteWin: 37, draw: 35, blackWin: 28, games: 31200 },
    notableGames: [
      { white: 'E. Rosseau', black: 'J. Fenwick', event: 'Clearwater Classic', year: 2019, result: '1-0', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O'] },
      { white: 'V. Grayling', black: 'P. Sandoval', event: 'Oakhaven Congress', year: 2020, result: '1/2-1/2', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Bxc6', 'dxc6', 'd3', 'f6', 'Be3', 'Be6'] },
      { white: 'A. Calloway', black: 'D. Ibarra', event: 'Silverlake Rapid', year: 2023, result: '1-0', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'] }
    ]
  },
  {
    id: 'scotch',
    name: 'Scotch Game',
    code: 'C45',
    family: 'Open Games',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Nf6', 'Nc3', 'Bb4'],
    branches: [
      { name: 'Classical', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Bc5', 'Be3', 'Qf6'] }
    ],
    stats: { whiteWin: 40, draw: 28, blackWin: 32, games: 12800 },
    notableGames: [
      { white: 'G. Thackeray', black: 'M. Duval', event: 'Redmoor Invitational', year: 2018, result: '1-0', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Nf6', 'Nc3', 'Bb4', 'Nxc6', 'bxc6'] },
      { white: 'F. Bellamy', black: 'I. Norwood', event: 'Windmere Classic', year: 2021, result: '1/2-1/2', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Bc5', 'Be3', 'Qf6', 'c3', 'Nge7'] },
      { white: 'H. Ostrander', black: 'W. Pellerin', event: 'Larkspur Open', year: 2022, result: '0-1', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Nf6', 'Nc3', 'Bb4'] }
    ]
  },
  {
    id: 'kingsgambit',
    name: "King's Gambit",
    code: 'C30',
    family: 'Open Games',
    moves: ['e4', 'e5', 'f4', 'exf4', 'Nf3', 'g5', 'Bc4', 'Bg7', 'O-O', 'd6'],
    branches: [
      { name: 'Falkbeer Counter', moves: ['e4', 'e5', 'f4', 'd5', 'exd5', 'e4'] }
    ],
    stats: { whiteWin: 42, draw: 22, blackWin: 36, games: 8900 },
    notableGames: [
      { white: 'B. Merrick', black: 'R. Eastwick', event: 'Thornfield Congress', year: 2017, result: '1-0', moves: ['e4', 'e5', 'f4', 'exf4', 'Nf3', 'g5', 'Bc4', 'Bg7', 'O-O', 'd6', 'd4', 'Nc6'] },
      { white: 'S. Vandermeer', black: 'D. Aldous', event: 'Foxglove Open', year: 2022, result: '1/2-1/2', moves: ['e4', 'e5', 'f4', 'd5', 'exd5', 'e4', 'd3', 'Nf6'] },
      { white: 'L. Quimby', black: 'Y. Halloway', event: 'Greyhaven Classic', year: 2023, result: '1-0', moves: ['e4', 'e5', 'f4', 'exf4', 'Nf3', 'g5', 'h4', 'g4', 'Ne5', 'Nc6'] }
    ]
  },
  // Semi-Open Games
  {
    id: 'sicilian',
    name: 'Sicilian Defense',
    code: 'B20',
    family: 'Semi-Open Games',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
    branches: [
      { name: 'Najdorf', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Bg5', 'e6'] },
      { name: 'Dragon', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'] }
    ],
    stats: { whiteWin: 36, draw: 30, blackWin: 34, games: 45600 },
    notableGames: [
      { white: 'M. Winslow', black: 'R. Fontaine', event: 'Ashwood Invitational', year: 2019, result: '1-0', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Bg5', 'e6', 'f4', 'Be7'] },
      { white: 'V. Keating', black: 'V. Yarrow', event: 'Bramblewood Masters', year: 2020, result: '0-1', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6', 'Be3', 'Bg7'] },
      { white: 'T. Lowell', black: 'L. Ashford', event: 'Ferndale Congress', year: 2023, result: '1/2-1/2', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'] }
    ]
  },
  {
    id: 'french',
    name: 'French Defense',
    code: 'C00',
    family: 'Semi-Open Games',
    moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e5', 'Nfd7'],
    branches: [
      { name: 'Winawer', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4', 'e5', 'c5'] },
      { name: 'Tarrasch', moves: ['e4', 'e6', 'd4', 'd5', 'Nd2', 'Nf6', 'e5', 'Nfd7'] }
    ],
    stats: { whiteWin: 35, draw: 33, blackWin: 32, games: 19400 },
    notableGames: [
      { white: 'A. Brenner', black: 'B. Crandall', event: 'Highvale Congress', year: 2020, result: '1/2-1/2', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e5', 'Nfd7', 'Bxe7', 'Qxe7'] },
      { white: 'N. Delacroix', black: 'J. Everhart', event: 'Marlowe Invitational', year: 2019, result: '1-0', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4', 'e5', 'c5', 'a3', 'Bxc3+', 'bxc3', 'Ne7'] },
      { white: 'P. Hollis', black: 'S. Kestrel', event: 'Amberfield Open', year: 2022, result: '0-1', moves: ['e4', 'e6', 'd4', 'd5', 'Nd2', 'Nf6', 'e5', 'Nfd7', 'Bd3', 'c5'] }
    ]
  },
  {
    id: 'carokann',
    name: 'Caro-Kann Defense',
    code: 'B10',
    family: 'Semi-Open Games',
    moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6'],
    branches: [
      { name: 'Advance', moves: ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nf3', 'e6'] }
    ],
    stats: { whiteWin: 34, draw: 36, blackWin: 30, games: 16700 },
    notableGames: [
      { white: 'V. Tremaine', black: 'A. Goulding', event: 'Ravenscroft Classic', year: 2021, result: '1/2-1/2', moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6', 'Nf3', 'Nd7'] },
      { white: 'M. Corbett', black: 'H. Ainsley', event: 'Northgate Masters', year: 2022, result: '1-0', moves: ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nf3', 'e6', 'Be2', 'Nd7'] },
      { white: 'D. Navarro', black: 'P. Ellsworth', event: 'Riverton Championship', year: 2023, result: '0-1', moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6'] }
    ]
  },
  // Closed Games
  {
    id: 'queensgambit',
    name: "Queen's Gambit",
    code: 'D06',
    family: 'Closed Games',
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O'],
    branches: [
      { name: 'Accepted', moves: ['d4', 'd5', 'c4', 'dxc4', 'Nf3', 'Nf6', 'e3', 'e6'] },
      { name: 'Declined Orthodox', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3', 'Nbd7'] }
    ],
    stats: { whiteWin: 37, draw: 38, blackWin: 25, games: 28300 },
    notableGames: [
      { white: 'J. Carrick', black: 'A. Ostrova', event: 'Lakeside Championship', year: 2018, result: '1-0', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3', 'Nbd7', 'Rc1', 'c6'] },
      { white: 'B. Wexford', black: 'M. Sablewood', event: 'Coastal Championship', year: 2022, result: '1/2-1/2', moves: ['d4', 'd5', 'c4', 'dxc4', 'Nf3', 'Nf6', 'e3', 'e6', 'Bxc4', 'c5'] },
      { white: 'R. Palgrave', black: 'S. Sherbrooke', event: 'Summit Swiss', year: 2023, result: '1-0', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O'] }
    ]
  },
  {
    id: 'kingsindian',
    name: "King's Indian Defense",
    code: 'E60',
    family: 'Closed Games',
    moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O'],
    branches: [
      { name: 'Classical', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5'] },
      { name: 'Sämisch', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'f3'] }
    ],
    stats: { whiteWin: 38, draw: 28, blackWin: 34, games: 22100 },
    notableGames: [
      { white: 'G. Thackeray', black: 'V. Keating', event: 'Wrenfield Open', year: 2019, result: '1-0', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5', 'O-O', 'Nc6'] },
      { white: 'D. Galbraith', black: 'A. Fairbanks', event: 'Elmhollow Masters', year: 2023, result: '0-1', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'f3', 'O-O', 'Be3', 'e5'] },
      { white: 'M. Vandermeer', black: 'M. Winslow', event: 'Copperfield Cup', year: 2022, result: '1/2-1/2', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O'] }
    ]
  },
  {
    id: 'nimsindian',
    name: 'Nimzo-Indian Defense',
    code: 'E20',
    family: 'Closed Games',
    moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3', 'O-O', 'Bd3', 'd5'],
    branches: [
      { name: 'Rubinstein', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3', 'O-O', 'Bd3', 'd5', 'Nf3', 'c5'] }
    ],
    stats: { whiteWin: 33, draw: 38, blackWin: 29, games: 17800 },
    notableGames: [
      { white: 'A. Renfield', black: 'J. Carrick', event: 'Birchmere Congress', year: 2018, result: '1/2-1/2', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3', 'O-O', 'Bd3', 'd5', 'Nf3', 'c5', 'O-O', 'Nc6'] },
      { white: 'L. Darlington', black: 'I. Norwood', event: 'Halloran Championship', year: 2023, result: '1-0', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3', 'O-O', 'Bd3', 'd5'] },
      { white: 'W. Pellerin', black: 'F. Bellamy', event: 'Silverlake Rapid', year: 2022, result: '0-1', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3', 'O-O', 'Bd3', 'd5'] }
    ]
  },
  // Flank Openings
  {
    id: 'english',
    name: 'English Opening',
    code: 'A10',
    family: 'Flank Openings',
    moves: ['c4', 'e5', 'Nc3', 'Nf6', 'g3', 'd5', 'cxd5', 'Nxd5', 'Bg2', 'Nb6'],
    branches: [
      { name: 'Reversed Sicilian', moves: ['c4', 'e5', 'Nc3', 'Nc6', 'g3', 'g6', 'Bg2', 'Bg7'] },
      { name: 'Symmetrical', moves: ['c4', 'c5', 'Nf3', 'Nf6', 'g3', 'g6', 'Bg2', 'Bg7'] }
    ],
    stats: { whiteWin: 36, draw: 34, blackWin: 30, games: 14200 },
    notableGames: [
      { white: 'V. Grayling', black: 'A. Kirkbride', event: 'Baywood Invitational', year: 2017, result: '1-0', moves: ['c4', 'e5', 'Nc3', 'Nf6', 'g3', 'd5', 'cxd5', 'Nxd5', 'Bg2', 'Nb6', 'Nf3', 'Nc6'] },
      { white: 'M. Duval', black: 'P. Sandoval', event: 'Hartwell Open', year: 2021, result: '1/2-1/2', moves: ['c4', 'e5', 'Nc3', 'Nc6', 'g3', 'g6', 'Bg2', 'Bg7', 'e3', 'Nge7'] },
      { white: 'A. Goulding', black: 'L. Darlington', event: 'Meridian Grand Open', year: 2023, result: '0-1', moves: ['c4', 'c5', 'Nf3', 'Nf6', 'g3', 'g6', 'Bg2', 'Bg7', 'O-O', 'O-O'] }
    ]
  },
  {
    id: 'reti',
    name: 'Réti Opening',
    code: 'A04',
    family: 'Flank Openings',
    moves: ['Nf3', 'd5', 'c4', 'e6', 'g3', 'Nf6', 'Bg2', 'Be7', 'O-O', 'O-O'],
    branches: [
      { name: 'Réti Gambit Accepted', moves: ['Nf3', 'd5', 'c4', 'dxc4', 'e3', 'Nf6', 'Bxc4', 'e6'] }
    ],
    stats: { whiteWin: 35, draw: 37, blackWin: 28, games: 11500 },
    notableGames: [
      { white: 'R. Eastwick', black: 'A. Ostrova', event: 'Kestrel Bay Open', year: 2018, result: '1-0', moves: ['Nf3', 'd5', 'c4', 'e6', 'g3', 'Nf6', 'Bg2', 'Be7', 'O-O', 'O-O', 'b3', 'c6'] },
      { white: 'V. Tremaine', black: 'B. Crandall', event: 'Oldebridge Congress', year: 2020, result: '1/2-1/2', moves: ['Nf3', 'd5', 'c4', 'dxc4', 'e3', 'Nf6', 'Bxc4', 'e6', 'O-O', 'a6'] },
      { white: 'P. Ellsworth', black: 'E. Rosseau', event: 'Oakhaven Congress', year: 2022, result: '0-1', moves: ['Nf3', 'd5', 'c4', 'e6', 'g3', 'Nf6', 'Bg2', 'Be7', 'O-O', 'O-O'] }
    ]
  },
  {
    id: 'catalan',
    name: 'Catalan Opening',
    code: 'E00',
    family: 'Flank Openings',
    moves: ['d4', 'Nf6', 'c4', 'e6', 'g3', 'd5', 'Bg2', 'Be7', 'Nf3', 'O-O'],
    branches: [
      { name: 'Open Catalan', moves: ['d4', 'Nf6', 'c4', 'e6', 'g3', 'd5', 'Bg2', 'dxc4', 'Nf3', 'a6'] }
    ],
    stats: { whiteWin: 36, draw: 36, blackWin: 28, games: 13900 },
    notableGames: [
      { white: 'S. Marlow', black: 'H. Ainsley', event: 'Brookmont Classic', year: 2019, result: '1-0', moves: ['d4', 'Nf6', 'c4', 'e6', 'g3', 'd5', 'Bg2', 'Be7', 'Nf3', 'O-O', 'O-O', 'dxc4'] },
      { white: 'A. Fairbanks', black: 'M. Corbett', event: 'Ashwood Invitational', year: 2022, result: '1/2-1/2', moves: ['d4', 'Nf6', 'c4', 'e6', 'g3', 'd5', 'Bg2', 'dxc4', 'Nf3', 'a6', 'O-O', 'Nc6'] },
      { white: 'I. Norwood', black: 'T. Lowell', event: 'Greyhaven Classic', year: 2023, result: '1/2-1/2', moves: ['d4', 'Nf6', 'c4', 'e6', 'g3', 'd5', 'Bg2', 'Be7', 'Nf3', 'O-O'] }
    ]
  },
  {
    id: 'birds',
    name: "Bird's Opening",
    code: 'A03',
    family: 'Flank Openings',
    moves: ['f4', 'd5', 'Nf3', 'g6', 'e3', 'Bg7', 'Be2', 'Nf6', 'O-O', 'O-O'],
    branches: [
      { name: 'Dutch Variation', moves: ['f4', 'd5', 'Nf3', 'c5', 'e3', 'Nc6', 'Be2', 'Nf6'] }
    ],
    stats: { whiteWin: 38, draw: 26, blackWin: 36, games: 5600 },
    notableGames: [
      { white: 'H. Ostrander', black: 'E. Lockhart', event: 'Fernbrook Open', year: 2018, result: '1-0', moves: ['f4', 'd5', 'Nf3', 'g6', 'e3', 'Bg7', 'Be2', 'Nf6', 'O-O', 'O-O', 'b3', 'c5'] },
      { white: 'B. Merrick', black: 'M. Sablewood', event: 'Hartwell Open', year: 2020, result: '0-1', moves: ['f4', 'd5', 'Nf3', 'c5', 'e3', 'Nc6', 'Be2', 'Nf6', 'O-O', 'e6'] },
      { white: 'T. Pemberton', black: 'M. Byrnwood', event: 'Winslow Memorial', year: 2022, result: '1/2-1/2', moves: ['f4', 'd5', 'Nf3', 'g6', 'e3', 'Bg7', 'Be2', 'Nf6', 'O-O', 'O-O'] }
    ]
  }
];

export const FAMILIES = [...new Set(OPENINGS.map(o => o.family))];
