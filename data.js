/*
  Beebe Dad's Golf Outing editable data

  To update the site later, change the values below and refresh the page.
  Keep each golfer's id unique and lowercase with hyphens.
*/

window.OUTING_DATA = {
  event: {
    name: "Beebe Dad's Golf Outing",
    draftDate: "July 23, 2026",
    teamWhite: "Team White",
    teamBlue: "Team Blue",
    formatName: "Net Better Ball Stroke Play",
    golfers: 24,
    matches: 6
  },

  players: [
    { id: "ethan-pressly", name: "Ethan Pressly", index: 2, courseHcp: -2 },
    { id: "james-cooper", name: "James Cooper", index: 3, courseHcp: -1 },
    { id: "kelly-briscoe", name: "Kelly Briscoe", index: 8.5, courseHcp: 5 },
    { id: "ryan-murtaugh", name: "Ryan Murtaugh", index: 9, courseHcp: 6 },
    { id: "raymond-kouba", name: "Raymond Kouba", index: 9.5, courseHcp: 6 },
    { id: "frank-torres", name: "Frank Torres", index: 14, courseHcp: 11 },
    { id: "eric-crane", name: "Eric Crane", index: 14.6, courseHcp: 11 },
    { id: "ryan-caulfield", name: "Ryan Caulfield", index: 16.5, courseHcp: 13 },
    { id: "tom-stanton", name: "Tom Stanton", index: 20, courseHcp: 17 },
    { id: "andreas-damianides", name: "Andreas Damianides", index: 20, courseHcp: 17 },
    { id: "jon-fleishman", name: "Jon Fleishman", index: 22, courseHcp: 19 },
    { id: "gage-nordlof", name: "Gage Nordlof", index: 25, courseHcp: 22 },
    { id: "mike-carbonara", name: "Mike Carbonara", index: 25, courseHcp: 22 },
    { id: "jeff-voyt", name: "Jeff Voyt", index: 25, courseHcp: 22 },
    { id: "sean-nightingale", name: "Sean Nightingale", index: 25, courseHcp: 22 },
    { id: "keith-howell", name: "Keith Howell", index: 25, courseHcp: 22 },
    { id: "brandon-rusboldt", name: "Brandon Rusboldt", index: 25, courseHcp: 22 },
    { id: "john-fiorelli", name: "John Fiorelli", index: 28, courseHcp: 26 },
    { id: "haider-istanbouli", name: "Haider Istanbouli", index: 30, courseHcp: 28 },
    { id: "mahir-dossaji", name: "Mahir Dossaji", index: 30, courseHcp: 28 },
    { id: "raj-rawalji", name: "Raj Rawalji", index: 30, courseHcp: 28 },
    { id: "brandon-bieber", name: "Brandon Bieber", index: 30, courseHcp: 28 },
    { id: "ajay-bhatia", name: "Ajay Bhatia", index: 30, courseHcp: 28 },
    { id: "jim-gentile", name: "Jim Gentile", index: 30, courseHcp: 28 }
  ],

  prizePool: {
    buyIn: 75,
    golfers: 24,
    payouts: [
      { label: "Winning Team", amount: 300, detail: "Split across 12 golfers", perPlayer: 25 },
      { label: "Low Gross", amount: 100, detail: "Individual prize" },
      { label: "Low Net", amount: 100, detail: "Individual prize" },
      { label: "Closest to Pin", amount: 50, detail: "Bonus prize" },
      { label: "Longest Drive", amount: 50, detail: "Bonus prize" }
    ]
  }
};
