// Closed enums + named eras are the source of truth for the TimelineEvent contract.
export const CATEGORIES = [
  { id: "Print", color: "#1b6b4a" },
  { id: "Broadcast", color: "#c26a00" },
  { id: "Photography", color: "#5c6b7a" },
  { id: "Cinema", color: "#a33b4a" },
  { id: "Computing", color: "#1a508b" },
  { id: "Networks", color: "#0e7490" },
  { id: "Audio", color: "#0d7377" },
  { id: "Typography", color: "#b45309" },
  { id: "Publishing", color: "#7a4ea3" },
  { id: "Telecom", color: "#2f5d8c" },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
export const CATEGORY_COLOR = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.color]));

export const TYPES = ["Milestone", "Invention", "Release", "Publication", "Broadcast"];

// Exactly five named era bands, washing the stage behind the axis.
export const ERAS = [
  { name: "Oral Tradition", fromYear: -4000, toYear: 500 },
  { name: "Manuscript Age", fromYear: 501, toYear: 1449 },
  { name: "Print Revolution", fromYear: 1450, toYear: 1876 },
  { name: "Broadcast Era", fromYear: 1877, toYear: 1990 },
  { name: "Network Age", fromYear: 1991, toYear: 2100 },
];

// Horizontal swimlanes echoing the reference composition (category groups).
export const LANES = [
  { id: "write", label: "Writing & Design", cats: ["Typography", "Publishing", "Print"], from: "#f4c430", to: "#f6b27a" },
  { id: "media", label: "Everyday Media", cats: ["Photography", "Cinema", "Broadcast", "Audio"], from: "#b51717", to: "#f5871f" },
  { id: "mile", label: "Media Milestones", cats: ["Computing", "Networks", "Telecom"], from: "#7b3f86", to: "#5b8def" },
];

export function laneForEvent(ev) {
  const primary = ev.categories[0];
  const lane = LANES.find((l) => l.cats.includes(primary));
  return lane ? lane.id : "mile";
}

export const YEAR_MIN = -4000;
export const YEAR_MAX = 2100;
export const DEFAULT_FROM = 1450;
export const DEFAULT_TO = 1920;

function pad(n) {
  return String(n).padStart(2, "0");
}

// Cross-field rule: BCE (year < 1) => timestamp is exactly 0001-01-01T00:00:00.000Z;
// CE (year >= 1) => the UTC calendar year of timestamp equals year.
function timestampFor(year, m = 6, d = 15) {
  if (year < 1) return "0001-01-01T00:00:00.000Z";
  return `${String(year).padStart(4, "0")}-${pad(m)}-${pad(d)}T12:00:00.000Z`;
}

// compact spec rows: [id, title, year, place, type, [cats], [mediaRefs], summary, month?, day?]
const SPEC = [
  // --- Oral Tradition (-4000..500) ---
  ["e01", "Cuneiform on Clay Tablets", -3200, "Sumer", "Invention", ["Typography"], ["cuneiform-clay", "tablet-impressions"], "Administrative marks on wet clay harden into a durable writing system for trade, law, and myth."],
  ["e02", "Egyptian Hieroglyphic Script", -3100, "Egypt", "Milestone", ["Typography", "Publishing"], ["hieroglyph-corpus", "papyrus-rolls"], "Monumental and administrative scripts encode language for sacred and civic memory."],
  ["e03", "Phoenician Consonant Alphabet", -1050, "Levant", "Invention", ["Typography"], ["phonetic-alphabet"], "A compact consonant alphabet travels trade routes and seeds later Mediterranean scripts."],
  ["e04", "Greek Alphabet Adds Vowels", -800, "Greece", "Milestone", ["Typography", "Publishing"], ["greek-vowels"], "Explicit vowel signs clarify spoken language and template later European scripts."],
  ["e05", "Library of Alexandria", -283, "Alexandria", "Milestone", ["Publishing"], ["scroll-catalogue", "mouseion-archives"], "A great collection organizes copied scrolls into a shared scholarly memory."],
  ["e06", "Roman Acta Diurna Notices", -59, "Rome", "Publication", ["Publishing", "Print"], ["acta-diurna", "public-notices"], "Daily public notices post official acts and births, an early mass information sheet."],
  ["e07", "Cursus Publicus Postal Relay", 14, "Rome", "Invention", ["Telecom"], ["cursus-publicus", "relay-stations"], "An imperial relay of horses and stations carries state messages across provinces."],
  ["e08", "Chinese Paper Making", 105, "Han China", "Invention", ["Print", "Publishing"], ["cai-lun-paper", "rag-pulp"], "Bark and rag pulp yield a cheap writing surface that reshapes record-keeping."],
  ["e09", "Codex Replaces the Scroll", 300, "Mediterranean", "Release", ["Publishing"], ["bound-codex", "leaf-folio"], "Bound leaves let readers flip and reference, foreshadowing the modern book."],
  ["e10", "Woodblock Printing in Tang China", 700, "Tang China", "Invention", ["Print", "Typography"], ["woodblock-press", "ink-rubbing"], "Carved blocks print repeated text and image, scaling reproduction beyond scribes."],

  // --- Manuscript Age (501..1449) ---
  ["e11", "Book of Kells Illumination", 800, "Iona", "Publication", ["Typography", "Publishing"], ["illuminated-manuscript", "insular-script"], "Lavish insular illumination fuses text and ornament into a devotional object."],
  ["e12", "House of Wisdom Translation Bureau", 830, "Baghdad", "Milestone", ["Publishing"], ["translation-bureau", "paper-mills"], "Scholars translate and copy Greek, Persian, and Indian works onto paper."],
  ["e13", "Movable Type in Song China", 1040, "Song China", "Invention", ["Print", "Typography"], ["bi-sheng-type", "clay-sort"], "Reusable clay sorts compose pages, anticipating metal movable type."],
  ["e14", "University Scriptoria Spread", 1150, "Bologna", "Milestone", ["Publishing"], ["pecia-system", "glossed-texts"], "Copied quires circulate among students, standardizing scholarly texts."],
  ["e15", "Mechanical Clock Tower Signals", 1283, "England", "Invention", ["Computing"], ["verge-escapement", "tower-clock"], "Weight-driven escapements measure and broadcast equal hours to a town."],
  ["e16", "Movable Metal Type in Korea", 1377, "Goryeo", "Invention", ["Print", "Typography"], ["jikji-metal-type", "bronze-cast"], "Cast metal sorts print the Jikji, the earliest surviving movable-metal-type book."],
  ["e17", "Paper Mills Reach Europe", 1276, "Fabriano", "Milestone", ["Print", "Publishing"], ["waterwheel-mill", "sized-paper"], "Water-powered mills make abundant paper, priming Europe for the press."],

  // --- Print Revolution (1450..1876) ---
  ["e18", "Gutenberg Movable-Type Press", 1455, "Mainz", "Invention", ["Print", "Typography"], ["forty-two-line-bible", "hand-mould"], "A screw press and cast type industrialize the page and fix the printed book."],
  ["e19", "Aldine Italic and Pocket Books", 1501, "Venice", "Release", ["Typography", "Publishing"], ["aldine-italic", "octavo-format"], "Compact italics and small formats make books portable and affordable."],
  ["e20", "Weekly Printed News Sheets", 1605, "Strasbourg", "Publication", ["Publishing", "Print"], ["relation-newsbook", "weekly-sheet"], "Regular printed newsbooks begin a rhythm of public current affairs."],
  ["e21", "First Daily Newspaper", 1702, "London", "Publication", ["Publishing", "Print"], ["daily-courant", "two-column"], "A daily paper turns news into a habit of the reading public."],
  ["e22", "Copperplate Engraving Plates", 1520, "Antwerp", "Invention", ["Print", "Photography"], ["intaglio-plate", "burin-lines"], "Engraved metal plates reproduce fine image and map detail at scale."],
  ["e23", "Lithography from Stone", 1796, "Munich", "Invention", ["Print", "Photography"], ["senefelder-stone", "greasy-crayon"], "Drawing on stone with grease lets image and text print cheaply together."],
  ["e24", "Steam-Powered Printing Press", 1814, "London", "Invention", ["Print", "Computing"], ["koenig-steam", "times-press"], "Steam drives the press, multiplying pages per hour for mass readership."],
  ["e25", "Rotary Press and Paper Reels", 1843, "United States", "Invention", ["Print", "Computing"], ["rotary-cylinder", "continuous-reel"], "Curved plates on a cylinder print from endless paper at speed."],
  ["e26", "Penny Press Mass Dailies", 1833, "New York", "Release", ["Publishing", "Print"], ["penny-sun", "street-vendors"], "A one-cent paper sells on the street and courts a vast new audience."],
  ["e27", "Electric Telegraph Lines", 1844, "United States", "Invention", ["Telecom", "Networks"], ["morse-key", "what-hath-god"], "Pulsed current carries coded words across continents in minutes."],
  ["e28", "Associated Press Wire Service", 1846, "New York", "Milestone", ["Publishing", "Telecom"], ["press-news-pool", "shared-wire"], "Papers pool telegraph costs, birthing the wire service and shared copy."],
  ["e29", "Daguerreotype Photograph", 1839, "Paris", "Invention", ["Photography"], ["daguerre-plate", "silvered-copper"], "Light fixes a mirror-like image on silver, inaugurating practical photography."],
  ["e30", "Collodion Wet-Plate Process", 1851, "England", "Invention", ["Photography"], ["wet-plate", "glass-negative"], "A glass negative allows many prints and sharp field photographs."],
  ["e31", "Phonograph Records Sound", 1877, "United States", "Invention", ["Audio"], ["tinfoil-cylinder", "etched-groove"], "A stylus etches and replays sound, capturing the voice for the first time."],
  ["e32", "Halftone Photo Reproduction", 1880, "New York", "Invention", ["Print", "Photography"], ["halftone-screen", "dot-pattern"], "Photographs print alongside text through screened dots of ink."],

  // --- Broadcast Era (1877..1990) ---
  ["e33", "Telephone Voice Network", 1876, "United States", "Invention", ["Telecom", "Networks"], ["bell-patent", "liquid-transmitter"], "Speech travels over wire, weaving a switched voice network."],
  ["e34", "Cinema Projected Motion Pictures", 1895, "Paris", "Release", ["Cinema", "Photography"], ["cinematographe", "lumiere-reels"], "Projected film turns sequential frames into a shared moving image."],
  ["e35", "Marconi Radio Telegraphy", 1901, "Atlantic", "Milestone", ["Telecom", "Broadcast"], ["transatlantic-signal", "spark-gap"], "Wireless signals leap the ocean, freeing messages from the wire."],
  ["e36", "Audion Vacuum Tube Amplifier", 1906, "United States", "Invention", ["Audio", "Broadcast"], ["de-forest-audion", "triode"], "The triode amplifies weak signals, enabling broadcast and long-distance voice."],
  ["e37", "First Scheduled Radio Broadcast", 1920, "Pittsburgh", "Broadcast", ["Broadcast", "Audio"], ["kdk-news-bulletin", "scheduled-program"], "A licensed station airs scheduled programs to a listening public."],
  ["e38", "Vitaphone Sound Film", 1927, "Hollywood", "Release", ["Cinema", "Audio"], ["jazz-singer", "sound-on-disc"], "Synchronized sound joins the moving image in popular cinema."],
  ["e39", "Television Broadcast Service", 1936, "London", "Broadcast", ["Broadcast", "Cinema"], ["bbc-alexandra", "mechanical-scan"], "Regular high-definition television broadcasts begin for the public."],
  ["e40", "Magnetic Tape Recording", 1935, "Germany", "Invention", ["Audio"], ["magnetophon", "oxide-tape"], "Magnetic tape records and edits sound, reshaping the studio."],
  ["e41", "Transistor Radio Sets", 1954, "United States", "Release", ["Audio", "Computing"], ["regency-tr1", "pocket-radio"], "Cheap transistors make radio personal and portable."],
  ["e42", "Color Television Standard", 1953, "United States", "Release", ["Broadcast", "Cinema"], ["ntsc-color", "compatible-signal"], "A compatible color standard brings color to the broadcast screen."],
  ["e43", "Communication Satellites", 1962, "Orbit", "Milestone", ["Telecom", "Networks"], ["telstar", "microwave-relay"], "Orbiting relays carry live television and calls across hemispheres."],
  ["e44", "Videocassette Home Recording", 1976, "Japan", "Release", ["Cinema", "Broadcast"], ["vhs-deck", "time-shift"], "Home cassettes let audiences record and replay the broadcast flow."],
  ["e45", "Cable and Satellite Networks", 1980, "United States", "Milestone", ["Broadcast", "Networks"], ["cnn-feed", "narrowcast-channels"], "Narrowcast channels multiply, fragmenting the mass audience."],

  // --- Network Age (1991..2100) ---
  ["e46", "World Wide Web over the Internet", 1991, "Geneva", "Milestone", ["Networks", "Computing"], ["http-protocol", "first-website"], "Hypertext over the internet opens a global, linked publishing medium."],
  ["e47", "Mosaic Graphical Browser", 1993, "Illinois", "Release", ["Networks", "Publishing"], ["inline-images", "point-and-click"], "Inline images and a graphical interface bring the web to millions."],
  ["e48", "MP3 Compressed Audio", 1993, "Europe", "Invention", ["Audio", "Networks"], ["mpeg-layer3", "perceptual-coding"], "Perceptual coding shrinks audio files, priming network music."],
  ["e49", "Digital Cameras Go Consumer", 1994, "Japan", "Release", ["Photography", "Computing"], ["ccd-sensor", "memory-card"], "Solid-state sensors and cards move photography off film."],
  ["e50", "SMS Text Messaging", 1992, "Europe", "Invention", ["Telecom", "Networks"], ["first-sms", "160-chars"], "Short text rides the signaling channel, birthing mobile messaging."],
  ["e51", "Streaming Media over the Web", 1995, "United States", "Release", ["Broadcast", "Networks"], ["realplayer", "progressive-stream"], "Buffered streams deliver audio and video without full downloads."],
  ["e52", "Blogging and Self-Publishing", 1999, "Global", "Milestone", ["Publishing", "Networks"], ["blogger-platform", "rss-feeds"], "Cheap publishing tools let anyone broadcast to a feed."],
  ["e53", "Wikipedia Collaborative Publishing", 2001, "Global", "Milestone", ["Publishing", "Networks"], ["wiki-engine", "open-edit"], "A free encyclopedia anyone can edit scales shared knowledge."],
  ["e54", "Social News Feeds", 2004, "United States", "Release", ["Networks", "Publishing"], ["news-feed", "social-graph"], "Algorithmic feeds reorder media around the social graph."],
  ["e55", "Video Sharing Platforms", 2005, "United States", "Release", ["Cinema", "Networks"], ["user-uploads", "embed-player"], "Easy upload and embed make amateur video a public medium."],
  ["e56", "Smartphone Touch Computing", 2007, "United States", "Release", ["Computing", "Telecom"], ["multitouch-screen", "app-store"], "A pocket computer with a touch screen folds every medium into one device."],
  ["e57", "Streaming Replaces Broadcast Slot", 2013, "Global", "Milestone", ["Broadcast", "Networks"], ["binge-release", "on-demand"], "On-demand seasons shift viewing from the schedule to the queue."],
  ["e58", "Podcasting Goes Mainstream", 2014, "Global", "Release", ["Audio", "Networks"], ["serial-podcast", "rss-audio"], "Serial narrative podcasts revive long-form audio for the network."],
  ["e59", "Live Mobile Video", 2015, "Global", "Release", ["Broadcast", "Telecom"], ["periscope-live", "phone-broadcast"], "Anyone with a phone can broadcast live to a global audience."],
  ["e60", "Generative Media Tools", 2022, "Global", "Invention", ["Computing", "Typography"], ["diffusion-models", "text-to-image"], "Generative models synthesize text and image from prompts."],
  ["e61", "Spatial and Immersive Media", 2024, "Global", "Release", ["Cinema", "Computing"], ["volumetric-capture", "headset-display"], "Volumetric capture and headsets push media into three dimensions."],
  ["e62", "Open Federated Networks", 2023, "Global", "Milestone", ["Networks", "Publishing"], ["activitypub", "fediverse"], "Open protocols let independent servers exchange posts and media."],
];

export const SEED_EVENTS = SPEC.map(
  ([id, title, year, place, type, categories, mediaRefs, summary, m, d]) => ({
    id,
    title,
    year,
    place,
    type,
    categories,
    mediaRefs,
    summary,
    timestamp: timestampFor(year, m, d),
    source: "corpus",
  }),
);
