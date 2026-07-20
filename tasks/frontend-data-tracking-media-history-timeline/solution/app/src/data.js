/* MediaHistoryTimeline — History of Media & Communication event corpus */
export const EVENT_TYPES = [
  "First Appearance",
  "Mass Adoption",
  "Standardization",
  "Obsoletion",
  "Commemoration",
];

export const MT_DATA = {
  productName: "MediaHistoryTimeline",
  tagline: "History of Media & Communication",
  description:
    "An interactive timeline exploring how humans record, transmit, and share meaning — from early writing systems to networked media.",
  yearMin: -3200,
  yearMax: 2024,
  defaultFrom: 1450,
  defaultTo: 1920,
  categories: [
    { id: "Oral Culture", label: "Oral Culture", color: "#8b6239" },
    { id: "Manuscript", label: "Manuscript", color: "#00838f" },
    { id: "Print Press", label: "Print Press", color: "#1b6b4a" },
    { id: "Telegraph", label: "Telegraph", color: "#2f5d8c" },
    { id: "Telephone", label: "Telephone", color: "#4b6f9c" },
    { id: "Radio", label: "Radio", color: "#c26a00" },
    { id: "Television", label: "Television", color: "#5c6b7a" },
    { id: "Recording", label: "Recording", color: "#0d7377" },
    { id: "Computing", label: "Computing", color: "#1a508b" },
    { id: "Networks", label: "Networks", color: "#a33b4a" },
    { id: "Mobile", label: "Mobile", color: "#6a4a82" },
    { id: "Social Media", label: "Social Media", color: "#9c27b0" },
  ],
  events: [
    {
      id: "e01",
      title: "Cuneiform Script",
      year: -3200,
      place: "Mesopotamia",
      categories: ["writing"],
      summary:
        "Sumerians develop wedge-shaped marks on clay tablets, primarily for accounting.",
      detail:
        "This shift from tokens to abstract signs is widely considered the birth of writing, enabling complex states and bureaucracy.",
    },
    {
      id: "e02",
      title: "Egyptian Hieroglyphs",
      year: -3000,
      place: "Egypt",
      categories: ["writing"],
      summary:
        "A formal writing system combining logographic, syllabic, and alphabetic elements.",
      detail:
        "Used extensively on monuments and papyrus, it tied state power to sacred communication and record-keeping.",
    },
    {
      id: "e03",
      title: "Phoenician Alphabet",
      year: -1050,
      place: "Levant",
      categories: ["writing"],
      summary:
        "An early consonantal alphabet that simplified writing and spread via maritime trade.",
      detail:
        "Its abstraction from pictograms allowed adaptation into Greek, Aramaic, and later most modern alphabets.",
    },
    {
      id: "e04",
      title: "Library of Alexandria",
      year: -285,
      place: "Ptolemaic Egypt",
      categories: ["writing", "print"],
      summary:
        "A vast ancient attempt to collect all the world's knowledge in one institution.",
      detail:
        "It formalized practices of translation, cataloging, and textual scholarship, acting as an early knowledge hub.",
    },
    {
      id: "e05",
      title: "Invention of Paper",
      year: 105,
      place: "Han Dynasty, China",
      categories: ["writing", "print"],
      summary:
        "Cai Lun traditionally credited with standardizing a paper-making process from rags and bark.",
      detail:
        "Paper provided a cheaper, lighter alternative to bamboo or silk, eventually revolutionizing global communication.",
    },
    {
      id: "e06",
      title: "Diamond Sutra",
      year: 868,
      place: "Tang Dynasty, China",
      categories: ["print"],
      summary:
        "The earliest known dated, printed book using woodblock technology.",
      detail:
        "Demonstrates advanced mass reproduction of text and image centuries before European print.",
    },
    {
      id: "e07",
      title: "Movable Type (Bi Sheng)",
      year: 1040,
      place: "Song Dynasty, China",
      categories: ["print"],
      summary:
        "First known movable type system, using baked clay characters.",
      detail:
        "While woodblock remained dominant in East Asia due to character volume, this laid the conceptual groundwork for typography.",
    },
    {
      id: "e08",
      title: "Gutenberg Press",
      year: 1455,
      place: "Mainz, Holy Roman Empire",
      categories: ["print"],
      summary:
        "Johannes Gutenberg prints the 42-line Bible using a metal movable type press.",
      detail:
        "Mechanized printing dramatically lowered the cost of books, fueling the Renaissance, Reformation, and Scientific Revolution.",
    },
    {
      id: "e09",
      title: "Venetian Printing Boom",
      year: 1490,
      place: "Venice",
      categories: ["print", "design"],
      summary:
        "Aldus Manutius and others establish Venice as Europe's publishing capital.",
      detail:
        "Introduced italic type and the octavo format, creating the first truly portable personal books.",
    },
    {
      id: "e10",
      title: "First Printed Newspaper",
      year: 1605,
      place: "Strasbourg",
      categories: ["print", "social"],
      summary:
        "Johann Carolus publishes 'Relation', considered the first weekly newspaper.",
      detail:
        "Regularly published news shifted public awareness toward current, secular events across borders.",
    },
    {
      id: "e11",
      title: "Optical Telegraph",
      year: 1792,
      place: "France",
      categories: ["telecom"],
      summary:
        "Claude Chappe deploys a semaphore line network across Revolutionary France.",
      detail:
        "The first practical telecommunications network, capable of sending messages faster than a horse.",
    },
    {
      id: "e12",
      title: "Photography (Daguerreotype)",
      year: 1839,
      place: "France",
      categories: ["photo"],
      summary:
        "Louis Daguerre introduces a practical photographic process to the public.",
      detail:
        "Captured light chemically for the first time, altering human relationships with memory, evidence, and art.",
    },
    {
      id: "e13",
      title: "Electrical Telegraph",
      year: 1844,
      place: "United States",
      categories: ["telecom"],
      summary:
        "Morse sends 'What hath God wrought' from Washington to Baltimore.",
      detail:
        "Decoupled communication from physical transportation entirely, creating a near-instantaneous continental network.",
    },
    {
      id: "e14",
      title: "Transatlantic Telegraph Cable",
      year: 1858,
      place: "Atlantic Ocean",
      categories: ["telecom", "network"],
      summary:
        "First, brief success in laying a telegraph cable between North America and Europe.",
      detail:
        "Though it failed quickly, it proved intercontinental electronic networking was possible.",
    },
    {
      id: "e15",
      title: "Typewriter Mass Production",
      year: 1874,
      place: "United States",
      categories: ["writing", "compute"],
      summary:
        "The Sholes and Glidden typewriter introduces the QWERTY keyboard layout.",
      detail:
        "Mechanized personal writing and transformed office labor, heavily integrating women into clerical work.",
    },
    {
      id: "e16",
      title: "Telephone",
      year: 1876,
      place: "United States",
      categories: ["telecom", "audio"],
      summary:
        "Alexander Graham Bell patents a device transmitting vocal sounds electrically.",
      detail:
        "Shifted telecom from skilled telegraph operators to direct, synchronous human conversation.",
    },
    {
      id: "e17",
      title: "Phonograph",
      year: 1877,
      place: "United States",
      categories: ["audio"],
      summary:
        "Thomas Edison invents a machine to record and reproduce sound.",
      detail:
        "Audio became a fixed, commodified object rather than a strictly live, ephemeral event.",
    },
    {
      id: "e18",
      title: "Motion Pictures",
      year: 1895,
      place: "France",
      categories: ["photo", "broadcast"],
      summary:
        "The Lumière brothers hold the first commercial public screening of cinematograph films.",
      detail:
        "Created a mass communal medium of moving images, forming the basis of 20th-century entertainment.",
    },
    {
      id: "e19",
      title: "Wireless Telegraphy",
      year: 1901,
      place: "Atlantic Ocean",
      categories: ["telecom", "broadcast"],
      summary:
        "Marconi successfully transmits a radio signal across the Atlantic.",
      detail:
        "Proved radio waves could follow the earth's curvature, enabling ship-to-shore and mobile communication.",
    },
    {
      id: "e20",
      title: "Commercial Radio Broadcasting",
      year: 1920,
      place: "United States",
      categories: ["broadcast", "audio"],
      summary:
        "KDKA Pittsburgh begins regular scheduled radio broadcasts to the public.",
      detail:
        "Transformed radio from point-to-point utility into a domestic mass medium, inventing the audience.",
    },
    {
      id: "e21",
      title: "Talking Pictures",
      year: 1927,
      place: "United States",
      categories: ["photo", "audio"],
      summary:
        "Release of 'The Jazz Singer' marks the commercial arrival of synchronized sound in film.",
      detail:
        "Overturned the silent film industry and established new narrative norms for global cinema.",
    },
    {
      id: "e22",
      title: "Television Broadcasting",
      year: 1936,
      place: "United Kingdom",
      categories: ["broadcast"],
      summary:
        "BBC begins the first regular high-definition public television service.",
      detail:
        "Combined the domestic reach of radio with the visual power of cinema.",
    },
    {
      id: "e23",
      title: "ENIAC",
      year: 1945,
      place: "United States",
      categories: ["compute"],
      summary:
        "The first general-purpose electronic digital computer.",
      detail:
        "Demonstrated that machines could process symbolic logic at electronic speeds, birthing the digital age.",
    },
    {
      id: "e24",
      title: "Information Theory",
      year: 1948,
      place: "United States",
      categories: ["network", "compute"],
      summary:
        "Claude Shannon publishes 'A Mathematical Theory of Communication'.",
      detail:
        "Quantified information as 'bits', abstracting meaning from the medium and enabling digital compression/transmission.",
    },
    {
      id: "e25",
      title: "Transistor",
      year: 1947,
      place: "United States",
      categories: ["compute", "telecom"],
      summary:
        "Bell Labs invents the solid-state semiconductor.",
      detail:
        "Replaced vacuum tubes, allowing electronics to become radically smaller, cheaper, and more reliable.",
    },
    {
      id: "e26",
      title: "Phototypesetting",
      year: 1950,
      place: "Global",
      categories: ["print", "design"],
      summary:
        "Optical/photographic processes begin replacing cast metal type.",
      detail:
        "Freed layout from the physical constraints of lead, accelerating graphic design and paste-up culture.",
    },
    {
      id: "e27",
      title: "Audio Cassette",
      year: 1963,
      place: "Netherlands",
      categories: ["audio"],
      summary:
        "Philips introduces the Compact Cassette format.",
      detail:
        "Democratized audio recording, enabling mixtapes, bootlegs, and portable personal listening.",
    },
    {
      id: "e28",
      title: "ARPANET",
      year: 1969,
      place: "United States",
      categories: ["network", "compute"],
      summary:
        "First packet-switching network and predecessor to the Internet connects 4 nodes.",
      detail:
        "Established decentralized, fault-tolerant network architectures.",
    },
    {
      id: "e29",
      title: "Microprocessor",
      year: 1971,
      place: "United States",
      categories: ["compute"],
      summary:
        "Intel releases the 4004, putting a CPU on a single chip.",
      detail:
        "Drove exponential drops in computing costs, paving the way for personal computers.",
    },
    {
      id: "e30",
      title: "Email",
      year: 1971,
      place: "ARPANET",
      categories: ["network", "writing"],
      summary:
        "Ray Tomlinson sends the first network email using the @ symbol.",
      detail:
        "Shifted early networks from strict resource-sharing to interpersonal communication.",
    },
    {
      id: "e31",
      title: "Personal Computing Arrives",
      year: 1977,
      place: "United States",
      categories: ["compute"],
      summary:
        "The '1977 Trinity' (Apple II, PET, TRS-80) makes computers accessible to consumers.",
      detail:
        "Transformed computers from institutional mainframes into personal creative and administrative tools.",
    },
    {
      id: "e32",
      title: "Walkman",
      year: 1979,
      place: "Japan",
      categories: ["audio", "mobile"],
      summary:
        "Sony introduces the portable cassette player.",
      detail:
        "Privatized public space through personal soundtracks, altering urban listening norms.",
    },
    {
      id: "e33",
      title: "CD Digital Audio",
      year: 1982,
      place: "Japan / Europe",
      categories: ["audio"],
      summary:
        "Commercial release of the Compact Disc format.",
      detail:
        "Pushed the music industry from analog to digital, introducing perfect copies and random access.",
    },
    {
      id: "e34",
      title: "Macintosh & GUI",
      year: 1984,
      place: "United States",
      categories: ["compute", "design"],
      summary:
        "Apple popularizes the graphical user interface and mouse.",
      detail:
        "Made computing spatial and visual rather than command-line, catalyzing desktop publishing.",
    },
    {
      id: "e35",
      title: "World Wide Web",
      year: 1991,
      place: "CERN",
      categories: ["network"],
      summary:
        "Tim Berners-Lee releases the first web browser and server software.",
      detail:
        "Created a universal, hyperlinked document space over the Internet.",
    },
    {
      id: "e36",
      title: "SMS Texting",
      year: 1992,
      place: "United Kingdom",
      categories: ["telecom", "mobile"],
      summary:
        "The first Short Message Service text is sent over the GSM network.",
      detail:
        "Inadvertently created a massive new written culture constrained by character limits.",
    },
    {
      id: "e37",
      title: "Google Search",
      year: 1998,
      place: "United States",
      categories: ["network"],
      summary:
        "Google launches with the PageRank algorithm.",
      detail:
        "Algorithmic discoverability became the primary interface for navigating the exploding web.",
    },
    {
      id: "e38",
      title: "Blogging",
      year: 1999,
      place: "Web",
      categories: ["social", "writing"],
      summary:
        "Tools like Blogger simplify publishing reverse-chronological content.",
      detail:
        "Lowered the barrier to web publishing, fostering participatory journalism and personal feeds.",
    },
    {
      id: "e39",
      title: "Wikipedia",
      year: 2001,
      place: "Web",
      categories: ["network", "writing"],
      summary:
        "Launch of the free, collaboratively edited encyclopedia.",
      detail:
        "Proved that mass open peer production could create generally reliable reference works at scale.",
    },
    {
      id: "e40",
      title: "Social Networking (Facebook)",
      year: 2004,
      place: "United States",
      categories: ["social", "network"],
      summary:
        "Facebook launches, scaling the real-name social graph model.",
      detail:
        "Centralized attention and personal publishing around algorithmic feeds and social connections.",
    },
    {
      id: "e41",
      title: "YouTube",
      year: 2005,
      place: "United States",
      categories: ["broadcast", "social", "photo"],
      summary:
        "A platform for amateur and professional video sharing over Flash video.",
      detail:
        "Broke broadcast television monopolies on moving images, birthing the creator economy.",
    },
    {
      id: "e42",
      title: "Twitter",
      year: 2006,
      place: "United States",
      categories: ["social", "mobile"],
      summary:
        "Launch of the 140-character microblogging service.",
      detail:
        "Accelerated real-time news dissemination, ambient awareness, and global public discourse.",
    },
    {
      id: "e43",
      title: "iPhone",
      year: 2007,
      place: "United States",
      categories: ["mobile", "compute", "telecom"],
      summary:
        "Apple releases a multitouch smartphone integrating ipod, phone, and internet.",
      detail:
        "Shifted primary computing from desktops to always-connected pocket devices.",
    },
    {
      id: "e44",
      title: "App Store",
      year: 2008,
      place: "Global",
      categories: ["mobile", "network"],
      summary:
        "Launch of centralized marketplaces for mobile software.",
      detail:
        "Re-gated the open web into discrete applications, altering software distribution economics.",
    },
    {
      id: "e45",
      title: "Instagram",
      year: 2010,
      place: "United States",
      categories: ["social", "photo", "mobile"],
      summary:
        "Mobile-first, filter-heavy photo sharing network launches.",
      detail:
        "Visual communication surpassed text as the primary currency of mobile social networks.",
    },
    {
      id: "e46",
      title: "Streaming Music Mainstream",
      year: 2011,
      place: "Global",
      categories: ["audio", "network"],
      summary:
        "Spotify launches in the US, cementing the shift to access over ownership.",
      detail:
        "Algorithmic playlists began replacing radio programming as the dominant music discovery vector.",
    },
    {
      id: "e47",
      title: "TikTok (Douyin)",
      year: 2016,
      place: "China / Global",
      categories: ["social", "broadcast", "photo"],
      summary:
        "Short-form video app launches, driven entirely by an algorithmic discovery feed.",
      detail:
        "Shifted social media from follower-graph feeds to pure algorithmic interest graphs.",
    },
    {
      id: "e48",
      title: "Generative AI Mainstream",
      year: 2022,
      place: "Global",
      categories: ["compute", "writing", "design"],
      summary:
        "Release of ChatGPT and Midjourney brings LLMs and diffusion models to the public.",
      detail:
        "Raises profound questions about authorship, truth, and the cost of content creation in media.",
    },
    {
      id: "e49",
      title: "Epic of Gilgamesh Tablets",
      year: -2100,
      place: "Mesopotamia",
      categories: ["Oral Culture", "writing"],
      summary: "Oral epic traditions are preserved across a series of cuneiform tablets.",
      detail: "The surviving versions show how spoken narrative could be stabilized, copied, and transmitted between generations.",
    },
    {
      id: "e50",
      title: "Oracle Bone Script",
      year: -1200,
      place: "Shang Dynasty, China",
      categories: ["writing"],
      summary: "Inscribed bones preserve one of the earliest mature forms of Chinese writing.",
      detail: "The records connect ritual communication with durable administrative and historical evidence.",
    },
    {
      id: "e51",
      title: "Greek Alphabet",
      year: -750,
      place: "Ancient Greece",
      categories: ["writing"],
      summary: "Greek scribes adapt Phoenician characters and add dedicated vowel symbols.",
      detail: "The resulting alphabet supports detailed literary, civic, and scientific writing across the Mediterranean.",
    },
    {
      id: "e52",
      title: "Acta Diurna",
      year: -59,
      place: "Roman Republic",
      categories: ["writing", "print"],
      summary: "Public notices report official proceedings and notable events in Rome.",
      detail: "Posted in shared civic spaces, the notices are an early example of regularly distributed public information.",
    },
    {
      id: "e53",
      title: "Codex Format Spreads",
      year: 300,
      place: "Roman Empire",
      categories: ["writing"],
      summary: "Bound pages increasingly replace scrolls for lengthy written works.",
      detail: "The codex makes texts easier to navigate, annotate, carry, and protect, shaping the modern book form.",
    },
    {
      id: "e54",
      title: "Penny Press",
      year: 1833,
      place: "New York City",
      categories: ["print"],
      summary: "Low-cost daily newspapers reach a broad urban readership.",
      detail: "Advertising-supported mass circulation changes reporting, distribution, and the economics of public news.",
    },
    {
      id: "e55",
      title: "Transatlantic Telegraph Cable",
      year: 1866,
      place: "North Atlantic",
      categories: ["telecom"],
      summary: "A durable undersea cable connects telegraph networks in Europe and North America.",
      detail: "Messages that once crossed the ocean by ship can now arrive in minutes, compressing global news cycles.",
    },
    {
      id: "e58",
      title: "Color Television Standard",
      year: 1953,
      place: "United States",
      categories: ["broadcast"],
      summary: "A compatible color television standard is approved for nationwide broadcasting.",
      detail: "Existing monochrome receivers remain usable while broadcasters and manufacturers adopt color transmission.",
    },
    {
      id: "e59",
      title: "TCP/IP Network Standard",
      year: 1983,
      place: "United States",
      categories: ["network", "compute"],
      summary: "ARPANET transitions to the TCP/IP protocol suite.",
      detail: "A shared internetworking standard lets independently operated networks exchange packets as one internet.",
    },
    {
      id: "e60",
      title: "SMS Text Messaging",
      year: 1992,
      place: "Europe",
      categories: ["telecom", "mobile"],
      summary: "The first person-to-person SMS message demonstrates short mobile text communication.",
      detail: "Text messaging becomes a compact, asynchronous layer of everyday communication across mobile networks.",
    },
  ],
};

const mapLegacyCategory = (category, event) => {
  if (category === "writing") return "Manuscript";
  if (category === "print" || category === "design") return "Print Press";
  if (category === "postal") return "Oral Culture";
  if (category === "telecom") {
    return /telephone|sms|iphone/i.test(event.title) ? "Telephone" : "Telegraph";
  }
  if (category === "broadcast") {
    return /television|motion picture|youtube|tiktok/i.test(event.title) ? "Television" : "Radio";
  }
  if (category === "photo") return "Television";
  if (category === "audio") return "Recording";
  if (category === "compute") return "Computing";
  if (category === "network") return "Networks";
  if (category === "mobile") return "Mobile";
  if (category === "social") return "Social Media";
  return category;
};

MT_DATA.events = MT_DATA.events.map((event) => {
  const categories = [...new Set(event.categories.map((category) => mapLegacyCategory(category, event)))];
  if (event.id === "e01") categories.unshift("Oral Culture");

  return {
    ...event,
    type: "First Appearance",
    timestamp: event.year < 1
      ? "0001-01-01T00:00:00.000Z"
      : `${String(event.year).padStart(4, "0")}-01-01T00:00:00.000Z`,
    mediaRefs: [`history-event-${event.id}`],
    categories: [...new Set(categories)],
  };
});
