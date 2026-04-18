/*
  ============================================================================
  THE COUNCIL OF JAH BASKETBALL ASSOCIATION - MAIN EDIT FILE
  ============================================================================

  Your roster, bios, videos, and base season stats live here.

  NEW GAME LOG SYSTEM:
  - The site can now save game logs in the browser and recalculate the stats page.
  - If you have no saved game logs yet, the site uses the base stats below.
  - Once you start saving game logs, the site combines those logs with these base stats.
  - If you want a season to be 100 percent game-log-driven, set player stats to 0 and
    enter every game through the Game Logs page.

  You do NOT need to edit app.js for normal updates.
  ============================================================================
*/

window.siteData = {
  league: {
    name: 'The Council of Jah Basketball Association',
    shortName: 'COJBA',
    brandMark: 'COJ',
    season: '2026 Founding Season',
    founded: '2026',
    location: 'Undisclosed concrete court somewhere in Arkansas',
    commissioner: 'The Council of Jah',
    motto: 'Banners fade. Receipts do not.',
    colors: {
      accent: '#2f7df6',
      accent2: '#f4eb3b',
      success: '#4fd6c2'
    },
    heroBlurb:
      'The official unofficial media home for the most overanalyzed fake basketball league alive.',
    description:
      'The Council of Jah Basketball Association is a fake basketball league for friends who wanted their runs to feel bigger than the box score. Every game adds to the mythology, every player gets a profile, and every stat becomes evidence the second somebody starts talking crazy.',
    format: [
      '12 current players on the council roster, with room to add more later.',
      'Whoever shows up can play, from 3v3s to 5v5s with subs.',
      'Player pages, stats, game logs, highlights, and full games all live in one clean site.',
      'Games to 24 always. Rest in Peace Bean.'
    ],
    values: [
      'Play hard, laugh harder',
      'Treat the mythology like a major sports property',
      'Every player deserves a ridiculous scouting report',
      'Stats matter, but aura still has a strong lobby'
    ],
    rules: [
      'Call fouls like adults and react to them like entertainers.',
      'If a game-winner makes the tape, it becomes official history.',
      'Bad takes are allowed. Unbacked takes are not.',
      'Every player is entitled to propaganda. Not every player is entitled to accuracy.'
    ]
  },
  teams: [
    { name: 'High Table', color: 'Gold' },
    { name: 'Blacktop Saints', color: 'Green' },
    { name: 'First Five', color: 'Black' },
    { name: 'Fast Break Ministry', color: 'White' }
  ],
  players: [
    {
      id: 'chris-gay',
      name: 'Chris Gay',
      nickname: 'The Owner',
      team: 'High Table',
      number: 3,
      position: 'SF',
      hometown: 'NLR',
      height: "6'2\"",
      archetype: 'Smooth Scoring Forward',
      favoriteMove: 'One-dribble pull-up',
      bio: 'Chris operates like the cameras are already rolling. Smooth handle, soft touch, and the confidence of a man who has never once believed a shot was bad.',
      strengths: ['Shot creation', 'Mid-range scoring', 'Late-game swagger'],
      stats: { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fg: 0, three: 0 }
    },
    {
      id: 'will-stafford',
      name: 'Will Stafford',
      nickname: 'The Stormtrooper',
      team: 'High Table',
      number: 14,
      position: 'G',
      hometown: 'NLR',
      height: "6'0\"",
      archetype: '3 Point Specialist',
      favoriteMove: 'Off-the-dribble Pull Up 3',
      bio: "Never seen a shot that was bad. It might miss, but damnit he'll keep shooting.",
      strengths: ['3-Point Shooting', 'Tempo control'],
      stats: { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fg: 0, three: 0 }
    },
    {
      id: 'dawson-teague',
      name: 'Dawson Teague',
      nickname: 'The Father',
      team: 'High Table',
      number: 12,
      position: 'G',
      hometown: 'NLR',
      height: "5'10\"",
      archetype: '3 Point Barrage',
      favoriteMove: 'Catch-and-shoot Corner 3',
      bio: 'Dawson treats open space like a personal invitation. If he sees daylight twice in a row, the gym starts feeling very small very fast.',
      strengths: ['3-Point Shooting', 'Off-ball movement', 'Transition scoring'],
      stats: { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fg: 0, three: 0 }
    },
    {
      id: 'cole-kimrey',
      name: 'Cole Kimrey',
      nickname: 'The Pandemic',
      team: 'Blacktop Saints',
      number: 21,
      position: 'F',
      hometown: 'NLR',
      height: "6'1\"",
      archetype: 'Power Forward Enforcer',
      favoriteMove: 'Screen, dive, and finish',
      bio: 'The possessions end when Cole says they end. He clears the glass, sets mean screens, and brings a strangely professional level of defense to an otherwise free flowing offensive game to 24.',
      strengths: ['Rebounding', 'Interior AND Exterior defense', 'Screen setting'],
      stats: { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fg: 0, three: 0 }
    },
    {
      id: 'david-kimrey',
      name: 'David Kimrey',
      nickname: 'The Mosquito',
      team: 'Blacktop Saints',
      number: 34,
      position: 'C',
      hometown: 'NLR',
      height: "5'10\"",
      archetype: 'The Silent Killer',
      favoriteMove: 'Drop-step finish',
      bio: 'Built like the league\'s final boss, Dave owns the paint, seals deep, and turns every miss into a second-chance board meeting.',
      strengths: ['Paint Finishing', 'Post scoring', 'Offensive rebounding'],
      stats: { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fg: 0, three: 0 }
    },
    {
      id: 'jackson-freer',
      name: 'Jackson Freer',
      nickname: 'The Microwave',
      team: 'Blacktop Saints',
      number: 5,
      position: 'PG/SG',
      hometown: 'NLR',
      height: "6'0\"",
      archetype: 'Chaos Guard',
      favoriteMove: 'Hesitation into a scoop layup',
      bio: 'Jickie is pace, nerves, and improvised problem-solving. The possession always looks difficult right up until it works.',
      strengths: ['Smooth Scoring', 'Change of speed', 'Playmaking on the fly'],
      stats: { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fg: 0, three: 0 }
    },
    {
      id: 'jonathan-akel',
      name: 'Jonathan Akel',
      nickname: 'Boardman Gets Paid',
      team: 'First Five',
      number: 7,
      position: 'SF',
      hometown: 'Sherwood',
      height: "6'1\"",
      archetype: 'Two-Way Wing',
      favoriteMove: 'Strong-side baseline fade',
      bio: 'Jonathan does the grown-man wing stuff: angles, patience, calm footwork, and strong takes. Rarely loud. Usually right.',
      strengths: ['Wing defense', 'Finishing through contact', 'Composure'],
      stats: { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fg: 0, three: 0 }
    },
    {
      id: 'adams-smith',
      name: 'Adams Smith',
      nickname: 'The Audit',
      team: 'First Five',
      number: 15,
      position: 'G',
      hometown: 'NLR',
      height: "6'0\"",
      archetype: 'Hotstreak Guard',
      favoriteMove: 'Short-roll dime',
      bio: 'Adams is the efficiency department. If he gets hot, the floor quickly flips, forcing defenses to adjust on the fly.',
      strengths: ['Decision making', 'Shooter', 'Glue-guy impact'],
      stats: { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fg: 0, three: 0 }
    },
    {
      id: 'campbell-loibner',
      name: 'Campbell Loibner',
      nickname: 'Camp',
      team: 'First Five',
      number: 10,
      position: 'PG',
      hometown: 'NLR',
      height: "6'0\"",
      archetype: 'Control Guard',
      favoriteMove: 'Snake dribble into floater',
      bio: 'Campbell plays like he is two beats ahead of the room. Patient, surgical, and always looking for the pass that makes everybody else late.',
      strengths: ['Ball control', 'Passing windows', 'Poise'],
      stats: { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fg: 0, three: 0 }
    },
    {
      id: 'kylon-williams',
      name: 'Kylon Williams',
      nickname: 'Jet',
      team: 'Fast Break Ministry',
      image: 'assets/images/Kylon-Williams.jpg',
      number: 12,
      position: 'G',
      hometown: 'Marvell',
      height: "5'6\"",
      archetype: 'Explosive Guard',
      favoriteMove: 'Baseline takeoff',
      bio: 'Kylon has permanent highlight-seeking energy. Explosive first step, fast-twitch finishing, and a real belief that every drive should shift the mood of the gym.',
      strengths: ['Rim pressure', 'Transition bursts', 'Athletic finishing'],
      stats: { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fg: 0, three: 0 }
    },
    {
      id: 'ryan-fleming',
      name: 'Ryan Fleming',
      nickname: 'The Producer',
      team: 'Fast Break Ministry',
      number: 44,
      position: 'PF/C',
      hometown: 'Chicago',
      height: "6'0\"",
      archetype: 'Bruiser Big',
      favoriteMove: 'Seal and power layup',
      bio: 'Ryan screens hard, rebounds angry, and turns paint touches into an issue. Opponents usually leave games feeling like they have been invoiced.',
      strengths: ['Physicality', 'Rebounding', 'Dirty-work buckets'],
      stats: { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fg: 0, three: 0 }
    },
    {
      id: 'jake-cooper',
      name: 'Jake Cooper',
      nickname: 'Swiss-Army Knife',
      team: 'Fast Break Ministry',
      number: 8,
      position: 'SG',
      hometown: 'NLR',
      height: "6'0\"",
      archetype: 'Balanced Combo Guard',
      favoriteMove: 'Side-step 3',
      bio: 'Jake is steady until the fourth quarter and loud once the shot falls. A balanced guard with a suspicious habit of getting better right when the talk starts.',
      strengths: ['Spot-up shooting', 'Secondary playmaking', 'Clutch calm'],
      stats: { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fg: 0, three: 0 }
    }
  ],
  videos: [
    {
      title: 'Replace This Sample Video First',
      type: 'Highlights',
      provider: 'youtube',
      embedId: 'M7lc1UVf-VE',
      date: '2026-04-14',
      description: 'This sample embed is only here so the page works immediately. Replace the embedId with your own highlight video first.'
    },
    {
      title: 'Opening Night Highlights',
      type: 'Highlights',
      provider: 'youtube',
      embedId: '',
      date: '2026-04-07',
      description: 'Paste your YouTube video ID here for the best plays, game-winners, blocks, and funny moments from opening night.'
    },
    {
      title: 'Full Game Archive - Week 1',
      type: 'Full Game',
      provider: 'youtube',
      embedId: '',
      date: '2026-04-09',
      description: 'Use this slot for a full game replay. Leave the type as Full Game so the filter buttons work.'
    },
    {
      title: 'Rivalry Tape',
      type: 'Highlights',
      provider: 'vimeo',
      embedId: '',
      date: '2026-04-12',
      description: 'This one shows Vimeo also works. Paste a Vimeo ID if some of your edits live there instead of YouTube.'
    }
  ],
  gameLogs: [],
  seasonNotes: [
    'This version is set up with the 12 player names you sent over.',
    'You can still edit player bios, videos, and league text in assets/data.js.',
    'The Game Logs page saves individual games on-site and recalculates season stats automatically.',
    'Drop player headshots into images/players using the player id format like will-stafford.jpeg.',
    'Export your game logs after big updates so you always have a backup.'
  ]
};

/*
  ============================================================================
  COPY-PASTE PLAYER TEMPLATE
  ============================================================================

  {
    id: 'new-player',
    name: 'New Player',
    nickname: 'Nickname',
    team: 'High Table',
    image: 'assets/images/new-player.jpg',
    number: 99,
    position: 'SG',
    hometown: 'Your City',
    height: "6'2\"",
    archetype: 'Two-Way Wing',
    favoriteMove: 'Pull-up 3',
    bio: 'One or two sentences about how this player plays.',
    strengths: ['Strength 1', 'Strength 2', 'Strength 3'],
    stats: { games: 0, pts: 0.0, reb: 0.0, ast: 0.0, stl: 0.0, blk: 0.0, fg: 0.0, three: 0.0 }
  }

  ============================================================================
  COPY-PASTE VIDEO TEMPLATE
  ============================================================================

  {
    title: 'Week X Highlights',
    type: 'Highlights',
    provider: 'youtube',
    embedId: 'PASTE_VIDEO_ID_HERE',
    date: '2026-04-14',
    description: 'Short description of the upload.'
  }

  ============================================================================
  OPTIONAL GAME LOG TEMPLATE (mainly for imports or seed data)
  ============================================================================

  {
    id: 'game-1',
    date: '2026-04-17',
    title: 'Week 1 Night Run',
    format: '5v5',
    location: 'The Main Court',
    teamA: 'High Table',
    teamB: 'Blacktop Saints',
    scoreA: 24,
    scoreB: 21,
    notes: 'Close game. Bad call with 3 possessions left. Naturally, still being discussed.',
    playerStats: [
      { playerId: 'chris-gay', played: true, pts: 8, reb: 4, ast: 2, stl: 1, blk: 0, fgm: 3, fga: 6, tpm: 1, tpa: 2 }
    ]
  }
*/
