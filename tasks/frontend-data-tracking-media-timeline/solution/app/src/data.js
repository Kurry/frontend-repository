export const MT_DATA = {
  productName: "MediaTimeline",
  tagline: "History of Media & Communication",
  description:
    "An interactive timeline exploring how humans record, transmit, and share meaning — from early writing systems to networked media.",
  yearMin: -3200,
  yearMax: 2024,
  defaultFrom: 1450,
  defaultTo: 1920,
  categories: [
    { id: "writing", label: "Writing & Script", color: "#00838f" },
    { id: "print", label: "Print & Publishing", color: "#1b6b4a" },
    { id: "postal", label: "Postal & Courier", color: "#8b6239" },
    { id: "telecom", label: "Telecom", color: "#2f5d8c" },
    { id: "broadcast", label: "Broadcast", color: "#c26a00" },
    { id: "photo", label: "Photography & Film", color: "#5c6b7a" },
    { id: "audio", label: "Sound & Music Tech", color: "#0d7377" },
    { id: "compute", label: "Computing", color: "#1a508b" },
    { id: "network", label: "Networks & Internet", color: "#a33b4a" },
    { id: "design", label: "Design & Typography", color: "#556070" },
    { id: "journalism", label: "Journalism", color: "#b45309" },
    { id: "social", label: "Social & Platforms", color: "#0e7490" },
  ],
  eras: [
    { id: "origins", label: "Origins of Record", from: -3200, to: -500, tint: "#00838f" },
    { id: "classical", label: "Classical Transmission", from: -499, to: 500, tint: "#2f5d8c" },
    { id: "manuscript", label: "Manuscript Age", from: 501, to: 1440, tint: "#8b6239" },
    { id: "print", label: "Print Revolution", from: 1441, to: 1830, tint: "#1b6b4a" },
    { id: "electric", label: "Electric Media", from: 1831, to: 1945, tint: "#c26a00" },
    { id: "mass", label: "Mass Media Century", from: 1946, to: 1990, tint: "#a33b4a" },
    { id: "networked", label: "Networked Era", from: 1991, to: 2024, tint: "#0e7490" },
  ],
  events: [
    {
      id: "e01",
      title: "Cuneiform on Clay",
      year: -3200,
      place: "Sumer",
      categories: ["writing"],
      summary:
        "Administrative marks on clay tablets become a durable writing system for trade, law, and myth.",
      detail:
        "Early cuneiform begins as pictographic accountancy and evolves into a flexible script pressed into wet clay — one of the first scalable media for institutional memory.",
    },
    {
      id: "e02",
      title: "Egyptian Hieroglyphs",
      year: -3100,
      place: "Egypt",
      categories: ["writing"],
      summary:
        "Monumental and administrative writing systems encode language in sacred and civic contexts.",
      detail:
        "Hieroglyphic, hieratic, and later demotic scripts show how medium (stone, papyrus) shapes formality, speed, and audience.",
    },
    {
      id: "e03",
      title: "Phoenician Alphabet",
      year: -1050,
      place: "Levant",
      categories: ["writing"],
      summary:
        "A compact consonant alphabet spreads along trade routes and seeds later Mediterranean scripts.",
      detail:
        "Fewer signs lower the barrier to literacy compared with logo-syllabic systems, accelerating cross-cultural exchange.",
    },
    {
      id: "e04",
      title: "Greek Vowels Added",
      year: -800,
      place: "Greece",
      categories: ["writing"],
      summary:
        "Adaptation of Phoenician letters adds explicit vowels, clarifying spoken language in text.",
      detail:
        "The Greek alphabet becomes a template for Etruscan and Latin scripts that later dominate European media.",
    },
    {
      id: "e05",
      title: "Library of Alexandria",
      year: -280,
      place: "Egypt",
      categories: ["writing", "journalism"],
      summary:
        "A vast collection and research center models knowledge as curated, copyable archive.",
      detail:
        "Scroll acquisition, cataloging, and scholarly commentary foreshadow later libraries, encyclopedias, and research networks.",
    },
    {
      id: "e06",
      title: "Roman Road Posts & Cursus",
      year: 50,
      place: "Roman Empire",
      categories: ["postal"],
      summary:
        "Imperial courier systems move official messages across a continent-scale network.",
      detail:
        "Relay stations and road infrastructure turn distance into a managed latency problem — proto-telecom logistics.",
    },
    {
      id: "e07",
      title: "Codex Replaces Scroll",
      year: 300,
      place: "Mediterranean",
      categories: ["writing", "design"],
      summary:
        "Bound pages enable random access, marginalia, and portable libraries.",
      detail:
        "The codex form factor reshapes reading habits and later becomes the default metaphor for books and documents.",
    },
    {
      id: "e08",
      title: "Paper Travels West",
      year: 750,
      place: "Central Asia / Iberia",
      categories: ["print", "writing"],
      summary:
        "Papermaking techniques move along trade routes, lowering the cost of writing surfaces.",
      detail:
        "Cheaper substrates expand who can produce and store documents beyond elite parchment economies.",
    },
    {
      id: "e09",
      title: "Woodblock Printing",
      year: 868,
      place: "China",
      categories: ["print"],
      summary:
        "The Diamond Sutra and related prints demonstrate large-scale text reproduction.",
      detail:
        "Block printing separates authorship from scribal labor and prefigures industrial publishing.",
    },
    {
      id: "e10",
      title: "Movable Type in East Asia",
      year: 1040,
      place: "China / Korea",
      categories: ["print"],
      summary:
        "Ceramic and later metal type experiments show recomposable text production.",
      detail:
        "Independent inventions of movable type highlight how media breakthroughs can emerge in parallel cultures.",
    },
    {
      id: "e11",
      title: "Gutenberg Press",
      year: 1455,
      place: "Mainz",
      categories: ["print", "design"],
      summary:
        "European movable-type printing scales book production and standardizes page design.",
      detail:
        "Press economics transform religion, science, and politics by collapsing the cost of identical copies.",
    },
    {
      id: "e12",
      title: "First Newspapers",
      year: 1605,
      place: "Strasbourg",
      categories: ["journalism", "print"],
      summary:
        "Periodic printed news sheets establish a cadence for public information.",
      detail:
        "Regular issues create expectation loops — audiences return for the next edition, a pattern later media inherit.",
    },
    {
      id: "e13",
      title: "Penny Post Concepts",
      year: 1680,
      place: "London",
      categories: ["postal"],
      summary:
        "Urban postal experiments make personal correspondence more frequent and affordable.",
      detail:
        "Cheap letters densify social graphs long before electronic messaging.",
    },
    {
      id: "e14",
      title: "Encyclopédie",
      year: 1751,
      place: "Paris",
      categories: ["print", "design"],
      summary:
        "A multi-volume reference project organizes technical knowledge for a reading public.",
      detail:
        "Cross-references and plates model information architecture as a civic project.",
    },
    {
      id: "e15",
      title: "Optical Telegraph",
      year: 1792,
      place: "France",
      categories: ["telecom"],
      summary:
        "Semaphore towers relay coded messages line-of-sight across long distances.",
      detail:
        "Latency drops from days to hours for state messaging — a dress rehearsal for electric networks.",
    },
    {
      id: "e16",
      title: "Lithography",
      year: 1796,
      place: "Munich",
      categories: ["print", "design"],
      summary:
        "Stone-based printing expands illustration, posters, and commercial graphics.",
      detail:
        "Artists and advertisers gain a flexible reproduction medium that fuels visual mass culture.",
    },
    {
      id: "e17",
      title: "Daguerreotype",
      year: 1839,
      place: "Paris",
      categories: ["photo"],
      summary:
        "A practical photographic process freezes appearances with chemical fidelity.",
      detail:
        "Photography challenges drawing as the default evidence medium and invents new genres of portrait and reportage.",
    },
    {
      id: "e18",
      title: "Electric Telegraph",
      year: 1844,
      place: "United States",
      categories: ["telecom"],
      summary:
        "Morse’s line demonstrates near-instant text over wire.",
      detail:
        "Time zones, news wires, and finance sync to telegraph rhythm — distance becomes less decisive than bandwidth.",
    },
    {
      id: "e19",
      title: "Atlantic Cable",
      year: 1866,
      place: "Atlantic",
      categories: ["telecom", "network"],
      summary:
        "A durable undersea cable links continents for message traffic.",
      detail:
        "Global news and markets begin to share a common clock, foreshadowing internet backbone geopolitics.",
    },
    {
      id: "e20",
      title: "Typewriter Standardizes",
      year: 1874,
      place: "United States",
      categories: ["writing", "design"],
      summary:
        "Commercial typewriters normalize office text production and QWERTY layouts.",
      detail:
        "Mechanical keyboards reshape literacy labor and later influence computer input design.",
    },
    {
      id: "e21",
      title: "Telephone Patent Era",
      year: 1876,
      place: "United States",
      categories: ["telecom", "audio"],
      summary:
        "Voice carried electrically opens conversational distance-collapse.",
      detail:
        "Switchboards and directories invent real-time interpersonal media as infrastructure.",
    },
    {
      id: "e22",
      title: "Phonograph",
      year: 1877,
      place: "United States",
      categories: ["audio"],
      summary:
        "Recorded sound becomes storable and replayable outside live performance.",
      detail:
        "Music, speech, and later radio content gain a durable medium independent of performers.",
    },
    {
      id: "e23",
      title: "Kodak Snapshot Culture",
      year: 1888,
      place: "United States",
      categories: ["photo", "social"],
      summary:
        "Simple cameras and processing services democratize personal image-making.",
      detail:
        "Everyday photography shifts from specialist craft to household habit.",
    },
    {
      id: "e24",
      title: "Cinema Projection",
      year: 1895,
      place: "Paris",
      categories: ["photo", "broadcast"],
      summary:
        "Public film screenings establish moving images as shared spectacle.",
      detail:
        "Theaters become ritual spaces for collective attention — a template for later screening cultures.",
    },
    {
      id: "e25",
      title: "Marconi Wireless",
      year: 1901,
      place: "Atlantic",
      categories: ["telecom", "broadcast"],
      summary:
        "Transatlantic wireless signals prove radio as a message medium.",
      detail:
        "Untethered transmission enables maritime safety, news flashes, and eventually entertainment broadcasting.",
    },
    {
      id: "e26",
      title: "Halftone Newspapers",
      year: 1905,
      place: "Global press",
      categories: ["journalism", "print", "photo"],
      summary:
        "Photographic halftones become routine in mass newspapers.",
      detail:
        "Visual evidence enters daily news cycles, changing what counts as a story.",
    },
    {
      id: "e27",
      title: "Commercial Radio Boom",
      year: 1920,
      place: "United States",
      categories: ["broadcast", "audio"],
      summary:
        "Scheduled radio programming builds national audiences in real time.",
      detail:
        "Advertising-supported broadcasting invents appointment listening and shared sonic culture.",
    },
    {
      id: "e28",
      title: "Talking Pictures",
      year: 1927,
      place: "United States",
      categories: ["photo", "audio"],
      summary:
        "Synchronized sound transforms cinema storytelling and industry structure.",
      detail:
        "Studios retool for dialogue, music scoring, and new star systems built on voice.",
    },
    {
      id: "e29",
      title: "Television Experiments to Sets",
      year: 1936,
      place: "United Kingdom",
      categories: ["broadcast"],
      summary:
        "Regular television service begins to move images into the home.",
      detail:
        "Living-room screens relocate public spectacle into domestic schedules.",
    },
    {
      id: "e30",
      title: "Magnetic Tape Recording",
      year: 1940,
      place: "Germany / US",
      categories: ["audio", "broadcast"],
      summary:
        "High-quality tape enables editing, delay, and studio production workflows.",
      detail:
        "Broadcast and music industries gain non-linear control over recorded time.",
    },
    {
      id: "e31",
      title: "ENIAC & Stored Programs",
      year: 1945,
      place: "United States",
      categories: ["compute"],
      summary:
        "Electronic computation accelerates and soon stores instructions as data.",
      detail:
        "Programmable machines become a new medium for symbols — not only calculation tools.",
    },
    {
      id: "e32",
      title: "Transistor Radio",
      year: 1954,
      place: "United States",
      categories: ["broadcast", "audio"],
      summary:
        "Portable radios detach listening from furniture and family rooms.",
      detail:
        "Youth culture and mobile attention patterns intensify with pocket receivers.",
    },
    {
      id: "e33",
      title: "TV News as Ritual",
      year: 1960,
      place: "United States",
      categories: ["broadcast", "journalism"],
      summary:
        "Televised debates and evening news consolidate visual politics.",
      detail:
        "Image performance becomes inseparable from electoral and wartime narration.",
    },
    {
      id: "e34",
      title: "Packet Switching Ideas",
      year: 1964,
      place: "UK / US",
      categories: ["network", "compute"],
      summary:
        "Researchers propose breaking messages into routed packets.",
      detail:
        "Resilient data networks replace circuit assumptions and enable the internet stack.",
    },
    {
      id: "e35",
      title: "ARPANET First Link",
      year: 1969,
      place: "United States",
      categories: ["network"],
      summary:
        "Host-to-host networking begins among research institutions.",
      detail:
        "Email and file transfer soon show that networks are social media before the brand exists.",
    },
    {
      id: "e36",
      title: "Color TV Saturation",
      year: 1972,
      place: "Global",
      categories: ["broadcast"],
      summary:
        "Color broadcasting becomes mainstream in many markets.",
      detail:
        "Chromatic realism raises production values and advertising spectacle.",
    },
    {
      id: "e37",
      title: "Personal Computing Arrives",
      year: 1977,
      place: "United States",
      categories: ["compute", "design"],
      summary:
        "Home computers put interactive screens in non-institutional spaces.",
      detail:
        "Hobbyists, schools, and offices invent new literacies around software as medium.",
    },
    {
      id: "e38",
      title: "Walkman & Private Soundtrack",
      year: 1979,
      place: "Japan",
      categories: ["audio", "social"],
      summary:
        "Personal cassette players privatize public space with headphones.",
      detail:
        "Mobile listening cultures redefine urban attention and later earbud norms.",
    },
    {
      id: "e39",
      title: "GUI & Desktop Metaphor",
      year: 1984,
      place: "United States",
      categories: ["compute", "design"],
      summary:
        "Graphical interfaces popularize windows, icons, and direct manipulation.",
      detail:
        "Visual computing becomes the default language for personal media tools.",
    },
    {
      id: "e40",
      title: "CD Digital Audio",
      year: 1982,
      place: "Japan / Netherlands",
      categories: ["audio"],
      summary:
        "Optical discs standardize consumer digital sound distribution.",
      detail:
        "Perfect-copy audio shifts industry economics and listener expectations of fidelity.",
    },
    {
      id: "e41",
      title: "World Wide Web",
      year: 1991,
      place: "CERN",
      categories: ["network", "journalism"],
      summary:
        "Hypertext over internet protocols makes linked documents universal.",
      detail:
        "Browsers turn the network into a publishable medium anyone can address by URL.",
    },
    {
      id: "e42",
      title: "SMS Texting Culture",
      year: 1993,
      place: "Europe",
      categories: ["telecom", "social"],
      summary:
        "Short messages become a mass interpersonal channel on mobiles.",
      detail:
        "Character limits invent new slang, timing norms, and always-on social presence.",
    },
    {
      id: "e43",
      title: "Search Engines Scale",
      year: 1998,
      place: "United States",
      categories: ["network", "journalism"],
      summary:
        "Algorithmic ranking becomes the front door to the web’s archive.",
      detail:
        "Discoverability — not just publishing — becomes the scarce media resource.",
    },
    {
      id: "e44",
      title: "Blogging Platforms",
      year: 1999,
      place: "Global",
      categories: ["social", "journalism"],
      summary:
        "Easy publishing tools expand who can maintain a public chronicle.",
      detail:
        "Reverse-chronological feeds prefigure later social streams and creator economies.",
    },
    {
      id: "e45",
      title: "Wikipedia",
      year: 2001,
      place: "Global",
      categories: ["network", "writing"],
      summary:
        "Collaborative encyclopedias show peer production at planetary scale.",
      detail:
        "Version history and citation norms become visible infrastructure for contested facts.",
    },
    {
      id: "e46",
      title: "Social Networks Mainstream",
      year: 2004,
      place: "United States",
      categories: ["social", "network"],
      summary:
        "Profile-based networks organize identity, friendship, and attention graphs.",
      detail:
        "The feed becomes a primary interface to news, culture, and personal performance.",
    },
    {
      id: "e47",
      title: "YouTube & Video Upload",
      year: 2005,
      place: "United States",
      categories: ["broadcast", "social", "photo"],
      summary:
        "Amateur video distribution scales without broadcast gatekeepers.",
      detail:
        "On-demand clips invent new genres, virality mechanics, and creator livelihoods.",
    },
    {
      id: "e48",
      title: "Smartphone Convergence",
      year: 2007,
      place: "United States",
      categories: ["telecom", "compute", "photo"],
      summary:
        "Phones absorb camera, browser, music player, and messaging into one slab.",
      detail:
        "Always-carried computers make media capture and consumption continuous.",
    },
    {
      id: "e49",
      title: "App Stores & Push Feeds",
      year: 2008,
      place: "Global",
      categories: ["network", "social"],
      summary:
        "Curated software marketplaces and notifications reorganize attention.",
      detail:
        "Distribution shifts from open web surfing to gated, interrupt-driven apps.",
    },
    {
      id: "e50",
      title: "Streaming Music Norm",
      year: 2011,
      place: "Global",
      categories: ["audio", "network"],
      summary:
        "Subscription catalogs replace ownership as the default listening model.",
      detail:
        "Recommendation systems become co-authors of taste and chart dynamics.",
    },
    {
      id: "e51",
      title: "Mobile-First News",
      year: 2013,
      place: "Global",
      categories: ["journalism", "social"],
      summary:
        "Cards, snaps, and vertical video reshape how stories are packaged.",
      detail:
        "Newsrooms redesign for thumb-stopping formats and platform referral traffic.",
    },
    {
      id: "e52",
      title: "Live Streaming Everywhere",
      year: 2016,
      place: "Global",
      categories: ["broadcast", "social"],
      summary:
        "Anyone can broadcast live from a pocket camera to global audiences.",
      detail:
        "Liveness returns as a participatory format spanning games, protests, and performance.",
    },
    {
      id: "e53",
      title: "Podcast Renaissance",
      year: 2018,
      place: "Global",
      categories: ["audio", "journalism"],
      summary:
        "On-demand spoken audio becomes a major narrative and news medium.",
      detail:
        "Long-form listening thrives alongside short video, showing format diversity in networked eras.",
    },
    {
      id: "e54",
      title: "Short-Form Video Dominance",
      year: 2020,
      place: "Global",
      categories: ["social", "photo", "broadcast"],
      summary:
        "Vertical looping clips capture massive share of youth attention.",
      detail:
        "Algorithmic For You feeds intensify discovery without follower graphs.",
    },
    {
      id: "e55",
      title: "Generative Media Tools",
      year: 2023,
      place: "Global",
      categories: ["compute", "design", "writing"],
      summary:
        "Widely available models draft text, images, and audio on demand.",
      detail:
        "Authorship, authenticity, and provenance become central design problems for communication systems.",
    },
    {
      id: "e56",
      title: "Postal Uniform Penny Rate",
      year: 1840,
      place: "United Kingdom",
      categories: ["postal", "social"],
      summary:
        "Rowland Hill’s reforms make distance-independent letter rates a mass service.",
      detail:
        "Stamps and prepaid postage industrialize personal and commercial correspondence.",
    },
    {
      id: "e57",
      title: "Offset Printing Industrializes",
      year: 1904,
      place: "United States",
      categories: ["print", "design"],
      summary:
        "Offset lithography accelerates high-volume commercial print.",
      detail:
        "Magazines, packaging, and advertising gain cheaper, sharper color reproduction.",
    },
    {
      id: "e58",
      title: "Helvetica & Modernist UI Roots",
      year: 1957,
      place: "Switzerland",
      categories: ["design"],
      summary:
        "Neutral sans-serif type becomes a global interface for clarity.",
      detail:
        "Corporate identity and later screen UI borrow modernist typographic neutrality.",
    },
    {
      id: "e59",
      title: "Satellite TV & Global Feeds",
      year: 1962,
      place: "Orbit / Atlantic",
      categories: ["broadcast", "telecom"],
      summary:
        "Telstar and successors relay live television across oceans.",
      detail:
        "Audiences experience simultaneous planetary events — a new scale of shared media time.",
    },
    {
      id: "e60",
      title: "Fiber Optic Backbones",
      year: 1988,
      place: "Global",
      categories: ["telecom", "network"],
      summary:
        "Glass fibers carry enormous bandwidth for voice and data.",
      detail:
        "Undersea and terrestrial fiber become the quiet substrate of modern platforms.",
    },
    {
      id: "e61",
      title: "Open Source Collaboration",
      year: 1991,
      place: "Global",
      categories: ["compute", "network"],
      summary:
        "Publicly shared codebases coordinate distributed development.",
      detail:
        "Version control and mailing lists invent durable patterns for remote creative work.",
    },
    {
      id: "e62",
      title: "Digital Cameras Consumerize",
      year: 1995,
      place: "Japan / Global",
      categories: ["photo"],
      summary:
        "Filmless cameras make instant review and deletion normal.",
      detail:
        "Zero marginal cost per shot changes photographic selectivity and volume.",
    },
    {
      id: "e63",
      title: "RSS & Syndicated Feeds",
      year: 2002,
      place: "Web",
      categories: ["journalism", "network"],
      summary:
        "Machine-readable feeds let readers pull updates from many publishers.",
      detail:
        "Syndication decouples publishing from a single homepage destination.",
    },
    {
      id: "e64",
      title: "Cloud Media Libraries",
      year: 2010,
      place: "Global",
      categories: ["network", "photo", "audio"],
      summary:
        "Personal archives migrate to remote storage synced across devices.",
      detail:
        "Access replaces possession as the everyday metaphor for media collections.",
    },
  ],
};