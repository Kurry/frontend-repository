#!/usr/bin/env python3
"""Package frontend-repository authoring folders into Harbor Reward Kit tasks."""

from __future__ import annotations

import json
import re
import shutil
import sys
import textwrap
from pathlib import Path

import importlib.util

from . import webmcp_h3
from .repo import canonical_dir, find_repo_root, schemas_dir

ROOT = find_repo_root()
TASKS = ROOT / "tasks"

# Builder-tooling pins stay task-adjacent (baked into every environment/
# Dockerfile build context); load them from the repository, not the package.
_pins_spec = importlib.util.spec_from_file_location("corpuscheck_task_pins", TASKS / "_pins.py")
assert _pins_spec is not None and _pins_spec.loader is not None
_pins = importlib.util.module_from_spec(_pins_spec)
_pins_spec.loader.exec_module(_pins)
HARBOR_REWARDKIT_PACKAGE = _pins.HARBOR_REWARDKIT_PACKAGE

# slug -> (source relative path, description, webmcp assignment)
TASK_SPECS: dict[str, dict] = {
    "frontend-workflow-daisyui-admin-dashboard": {
        "source": "DaisyUI",
        "description": "DaisyUI admin user-management dashboard good-app eval.",
        "modules": ["browse-query-v1", "entity-collection-v1", "form-workflow-v1"],
        "bindings": {
            "Browsable entity": "Users collection and Operations Overview",
            "Destinations": "Operations Overview; All Users; Add User; Roles; Permissions; User Logs; User Stats; User Payments; User Products",
            "Entity operations": "create, select, update, delete, bulk status/role change, filter, sort",
            "Workflow completion": "Create user form validates and commits a new user row",
            "Entity fields": "name, email, role, status (Active|Invited|Suspended), payments, products, last-active",
        },
        "mechanics_exclusions": [
            "Chart hover/tooltip mechanics stay Playwright-only",
            "Drawer overlay slide on small viewports stays Playwright-observed",
        ],
    },
    "frontend-creative-tools-daisyui-theme-generator": {
        "source": "DaisyUI/theme-generator",
        "description": "daisyUI theme generator good-app eval.",
        "modules": ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
        "bindings": {
            "Browsable entity": "Theme presets and CSS variables",
            "Destinations": "Themes list; Theme editor; Live preview",
            "Entity operations": "create/select/update/delete theme; update declared CSS variable properties",
            "Editor objects": "theme document with declared color/radius/font tokens",
            "Artifact operations": "export theme CSS / copy serialized theme; import declared theme mode",
        },
        "mechanics_exclusions": [
            "Raw file path / base64 blobs must not appear in WebMCP args",
            "Color-picker drag gestures stay Playwright when mechanism matters",
        ],
    },
    "frontend-creative-tools-camera-exposure": {
        "source": "CameraExposure",
        "description": "Camera exposure simulator good-app eval.",
        "modules": ["command-session-v1", "structured-editor-v1"],
        "bindings": {
            "Session operations": "adjust exposure stops; reset; toggle help panel",
            "Editor objects": "exposure stop state mapped to preview image/brightness",
            "Destinations": "Main simulator canvas; Help panel",
        },
        "mechanics_exclusions": [
            "Continuous hold-to-repeat on edge buttons stays Playwright-observed",
        ],
    },
    "frontend-creative-tools-design-portfolio": {
        "source": "DesignPortfolio",
        "description": "CLI terminal product designer portfolio good-app eval.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Portfolio projects / case studies",
            "Destinations": "Terminal home; Project detail; About/contact views",
            "Entity operations": "select project; update portfolio entries; create/delete case notes when offered",
        },
        "mechanics_exclusions": ["Terminal typing animation timing stays Playwright-observed"],
    },
    "frontend-data-tracking-finance-reports": {
        "source": "FinanceReports",
        "description": "Personal finance reports page good-app eval.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Expense / report records",
            "Destinations": "Reports overview; Category breakdown; Transaction list",
            "Entity operations": "create, update, delete expenses; apply/clear filters; sort",
        },
        "mechanics_exclusions": ["Chart geometry / pie segment hover stays Playwright-observed"],
    },
    "frontend-creative-tools-material-ui-theme-creator": {
        "source": "MaterialUI",
        "description": "Material UI theme creator good-app eval.",
        "modules": ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
        "bindings": {
            "Editor objects": "Material theme with declared palette/typography/shape properties",
            "Destinations": "Theme editor; Component preview; Saved themes",
            "Entity operations": "create/select/update/delete theme presets; update declared properties",
            "Artifact operations": "export theme JSON/CSS; copy; declared import mode",
        },
        "mechanics_exclusions": [
            "Raw file paths/blobs forbidden in WebMCP args",
            "Color picker drag stays Playwright when mechanism matters",
        ],
    },
    "frontend-data-tracking-media-timeline": {
        "source": "MediaTimeline",
        "description": "Media history timeline explorer good-app eval.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Timeline media events",
            "Destinations": "Timeline view; Event detail; Filter panel",
            "Entity operations": "create/update/delete events; filter by era/type; select event",
        },
        "mechanics_exclusions": ["Scroll-linked parallax / scrub timing stays Playwright-observed"],
    },
    "frontend-creative-tools-palette-library": {
        "source": "PaletteLibrary",
        "description": "Fine-art color palette library good-app eval.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Color palettes",
            "Destinations": "Library grid; Palette detail; Search/filter",
            "Entity operations": "create/update/delete palettes; toggle favorites; search/filter",
        },
        "mechanics_exclusions": ["Scroll reveal / hover wash timing stays Playwright-observed"],
    },
    "frontend-creative-tools-shapeshift-grid": {
        "source": "Shapeshift",
        "description": "SHAPESHIFT QR color grid painter good-app eval.",
        "modules": ["structured-editor-v1", "command-session-v1"],
        "bindings": {
            "Editor objects": "QR color grid cells with declared color enum",
            "Editor operations": "select cell; set color; clear; switch tool/mode; refresh preview",
            "Session operations": "start/reset painting session; trigger demo fill when offered",
        },
        "mechanics_exclusions": [
            "Drag-paint / brush stroke geometry stays Playwright (gesture mechanics)",
        ],
    },
    "frontend-creative-tools-story-docs": {
        "source": "StoryDocs",
        "description": "Storyboard getting-started tutorial good-app eval.",
        "modules": ["browse-query-v1", "form-workflow-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Tutorial scenes / storyboard frames",
            "Destinations": "Scene list; Scene detail; Getting-started steps",
            "Entity operations": "create/update/delete scenes; reorder when offered",
            "Workflow completion": "Advance/return tutorial steps; validate scene form fields",
        },
        "mechanics_exclusions": [],
    },
    "frontend-planning-trip-itinerary": {
        "source": "TripItinerary",
        "description": "French Riviera trip itinerary planner good-app eval.",
        "modules": [
            "browse-query-v1",
            "entity-collection-v1",
            "form-workflow-v1",
            "artifact-transfer-v1",
        ],
        "bindings": {
            "Browsable entity": "activities",
            "Destinations": "overview; day-detail; activity-form; budget-ledger; export-canvas",
            "Filters": "day; type; category",
            "Themes": "light; dark",
            "Entity": "activity",
            "Entity operations": "create; select; update; delete; reorder",
            "Entity fields": "title; day; location; notes; startTime; endTime; category",
            "Form fields": "title; day; location; notes; startTime; endTime; category",
            "Form operations": "validate; submit; cancel",
            "Artifact operations": "export; import; copy",
            "Export formats": "ics; json; markdown",
            "Import modes": "trip-json",
            "Value bounds": {
                "day": [
                    "2025-07-05",
                    "2025-07-06",
                    "2025-07-07",
                    "2025-07-08",
                    "2025-07-09",
                    "2025-07-10",
                    "2025-07-11",
                ],
                "category": [
                    "sightseeing",
                    "dining",
                    "lodging",
                    "transport",
                    "other",
                ],
            },
        },
        "mechanics_exclusions": [
            "Map pan/zoom / marker drag stays Playwright",
            "Raw file paths/blobs forbidden in WebMCP args",
            "Chart hover tooling stays Playwright-observed",
            "Ledger grid inline FX edits, CSV wizard cell fixes, and spreadsheet keyboard navigation stay Playwright-observed; WebMCP entity and artifact tools prove state parity only",
        ],
    },
    "frontend-data-tracking-admin-analytics-dashboard": {
        "source": "variants/AdminAnalyticsDashboard",
        "description": "Commerce ops admin analytics dashboard variant.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Users",
            "Destinations": "Operations Overview; All Users; Add User; Roles; Permissions; User Logs; User Stats; User Payments; User Products",
            "Filters": "role; status",
            "Sorts": "last-active; newest; highest-spend; name-az",
            "Entity operations": "create; select; update; delete",
            "Entity fields": "name; email; role; status; payments; products; last-active",
        },
        "mechanics_exclusions": ["Chart hover tooling stays Playwright-observed"],
    },
    "frontend-creative-tools-color-palette-archive": {
        "source": "variants/ColorPaletteArchive",
        "description": "Fine-art color palette archive variant.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Archived palettes",
            "Destinations": "Archive grid; Palette detail; Filters",
            "Entity operations": "create/update/delete palettes; search; filter; toggle",
        },
        "mechanics_exclusions": [],
    },
    "frontend-creative-tools-css-theme-builder": {
        "source": "variants/CssThemeBuilder",
        "description": "CSS theme builder variant.",
        "modules": ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
        "bindings": {
            "Editor objects": "CSS theme tokens",
            "Destinations": "Token editor; Preview; Saved themes",
            "Entity operations": "create/select/update/delete themes; update declared properties",
            "Artifact operations": "export CSS; copy; declared import",
        },
        "mechanics_exclusions": ["Raw file paths/blobs forbidden in WebMCP args"],
    },
    "frontend-data-tracking-expense-breakdown-reports": {
        "source": "variants/ExpenseBreakdownReports",
        "description": "Personal finance expense breakdown reports variant.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Expenses",
            "Destinations": "Breakdown overview; Expense list; Category filter",
            "Entity operations": "create/update/delete expenses; filter; sort",
        },
        "mechanics_exclusions": ["Chart hover stays Playwright-observed"],
    },
    "frontend-creative-tools-exposure-control-lab": {
        "source": "variants/ExposureControlLab",
        "description": "Camera exposure control lab variant.",
        "modules": ["command-session-v1", "structured-editor-v1"],
        "bindings": {
            "Session operations": "adjust exposure; reset; toggle help",
            "Editor objects": "exposure controls mapped to preview",
            "Destinations": "Lab canvas; Help panel",
        },
        "mechanics_exclusions": ["Hold-to-repeat control timing stays Playwright-observed"],
    },
    "frontend-creative-tools-grid-paint-studio": {
        "source": "variants/GridPaintStudio",
        "description": "QR color grid paint studio variant.",
        "modules": ["structured-editor-v1", "command-session-v1"],
        "bindings": {
            "Editor objects": "Grid cells with declared colors",
            "Editor operations": "select cell; set color; clear; switch mode; refresh preview",
            "Session operations": "start/reset painting session",
        },
        "mechanics_exclusions": ["Drag-paint gestures stay Playwright"],
    },
    "frontend-landing-l1-network-marketing": {
        "source": "variants/L1NetworkMarketing",
        "description": "Layer-1 blockchain network marketing site good-app eval.",
        "modules": ["browse-query-v1", "form-workflow-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Network features / waitlist entries",
            "Destinations": "Marketing sections; Feature detail; Waitlist/signup form",
            "Entity operations": "create/update/delete feature cards or waitlist rows when offered",
            "Workflow completion": "Waitlist/contact form validate/submit/cancel",
        },
        "mechanics_exclusions": ["Outbound marketing CTAs must remain in-app (no origin navigation)"],
    },
    "frontend-creative-tools-material-theme-studio": {
        "source": "variants/MaterialThemeStudio",
        "description": "Material theme design studio variant.",
        "modules": ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
        "bindings": {
            "Editor objects": "Material theme tokens",
            "Destinations": "Studio editor; Preview; Saved themes",
            "Entity operations": "create/select/update/delete themes; update properties",
            "Artifact operations": "export/copy/import declared theme formats",
        },
        "mechanics_exclusions": ["Raw file paths/blobs forbidden in WebMCP args"],
    },
    "frontend-data-tracking-media-history-timeline": {
        "source": "variants/MediaHistoryTimeline",
        "description": "Media history timeline explorer variant.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Timeline events",
            "Destinations": "Timeline; Event detail; Filters",
            "Entity operations": "create/update/delete events; filter; select",
        },
        "mechanics_exclusions": ["Scroll/scrub timing stays Playwright-observed"],
    },
    "frontend-creative-tools-storyboard-tutorial": {
        "source": "variants/StoryboardTutorial",
        "description": "Storyboard getting-started tutorial variant.",
        "modules": ["browse-query-v1", "form-workflow-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Tutorial scenes",
            "Destinations": "Scene list; Scene editor; Tutorial steps",
            "Entity operations": "create/update/delete scenes",
            "Workflow completion": "Advance/return steps; validate scene form",
        },
        "mechanics_exclusions": [],
    },
    "frontend-creative-tools-terminal-portfolio": {
        "source": "variants/TerminalPortfolio",
        "description": "CLI terminal product designer portfolio variant.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "Portfolio projects",
            "Destinations": "Terminal home; Project detail; About",
            "Entity operations": "select/update projects; create/delete notes when offered",
        },
        "mechanics_exclusions": ["Terminal typing animation timing stays Playwright-observed"],
    },
    "frontend-planning-travel-itinerary-planner": {
        "source": "variants/TravelItineraryPlanner",
        "description": "French Riviera trip itinerary planner variant.",
        "modules": ["browse-query-v1", "entity-collection-v1", "form-workflow-v1"],
        "bindings": {
            "Browsable entity": "Itinerary activities",
            "Destinations": "Overview; Day detail; Activity form",
            "Entity operations": "create/update/delete/move activities; filter",
            "Workflow completion": "Activity form validate/submit/cancel",
        },
        "mechanics_exclusions": ["Map pan/zoom / marker drag stays Playwright"],
    },
    "frontend-planning-daily-planner-board": {
        "source": "DailyPlannerBoard",
        "description": "Cadence multi-day daily planner board good-app eval.",
        "modules": ["browse-query-v1", "entity-collection-v1"],
        "bindings": {
            "Browsable entity": "tasks",
            "Destinations": "board; calendar-day-panel",
            "Entity": "task",
            "Entity operations": "create; select; update; delete; toggle",
            "Entity fields": "title; done; channel; planned-time; day; start-time",
        },
        "mechanics_exclusions": [
            "Calendar panel day-scroll / hour-grid gestures stay Playwright-observed",
        ],
    },
}

# Website-fidelity tasks converted from website-prds (pixel-perfect genre).
TASK_SPECS.update({
    "frontend-creative-tools-session-compression-loom": {
        "source": "Session Compression Loom",
        "description": "Session compression editor with capsule summaries, preview, and artifact export.",
        "modules": ["structured-editor-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Text selection, range highlighting, preview layout, and download bytes stay Playwright-observed"],
    },
    "frontend-landing-avax-network": {
        "source": "AvaxNetwork",
        "description": "Avalanche network marketing homepage fidelity eval.",
        "modules": [
            "browse-query-v1",
            "form-workflow-v1"
        ],
        "bindings": {
            "destinations": [
                "hero",
                "solutions-insights",
                "links",
                "companies",
                "developers-hub",
                "numbers",
                "blog",
                "solutions",
                "community",
                "event",
                "questions",
                "newsletter",
                "contact-us",
                "footer"
            ],
            "themes": [
                "light",
                "dark"
            ],
            "form_fields": [
                "firstname",
                "lastname",
                "email",
                "socialhandle",
                "country",
                "vertical",
                "project_type",
                "astra_contact_message",
                "gdpr",
                "marketing_consent",
                "newsletter"
            ],
            "form_operations": [
                "validate",
                "submit",
                "cancel",
                "reset",
                "advance",
                "return"
            ],
            "workflow_steps": [
                "step-1",
                "step-2",
                "step-3",
                "step-4",
                "step-5"
            ]
        },
        "mechanics_exclusions": [
            "Hero clipped-panel entrance + layered alpha video sequence + HUD reveal stay Playwright-observed",
            "Scroll-reveal line reveals and split-heading character flash stay Playwright-observed (real scroll path only)",
            "Blog Swiper drag/arrow paging and reset-to-slide-0 on upward exit stay Playwright-observed",
            "Logo marquee (31.5s) and footer wordmark marquee (5s) pause-on-hover stay Playwright-observed",
            "Theme cross-fade timing (~0.3s) stays Playwright-observed",
            "Desktop links card scrub / companies rise stays Playwright-observed"
        ]
    },
    "frontend-landing-hildenkaira": {
        "source": "Hildenkaira",
        "description": "Hilden & Kaira social-media agency homepage fidelity eval.",
        "modules": [
            "browse-query-v1",
            "form-workflow-v1",
            "command-session-v1"
        ],
        "bindings": {
            "browsable_entity": "clients",
            "destinations": [
                "hero",
                "statement",
                "client",
                "services",
                "testimonials",
                "cta",
                "footer"
            ],
            "locales": [
                "en",
                "fi"
            ],
            "form_fields": [
                "email",
                "phone",
                "terms"
            ],
            "form_operations": [
                "validate",
                "submit",
                "reset"
            ],
            "session_operations": [
                "start",
                "pause",
                "resume",
                "stop"
            ]
        },
        "mechanics_exclusions": [
            "Flick-card elastic reshuffle coordinate transforms stay Playwright-only",
            "Swiper client/testimonial scale (1 / 0.94) and paging stay Playwright-observed",
            "Hero floating letterform/thumbnail loops stay Playwright-only",
            "Nav-theme scroll-sync class swap stays Playwright-observed",
            "Bunny player timeline drag/scrub and interface hide-show stay Playwright-only",
            "Momentum/inertia hover stays Playwright-only",
            "Dynamic counter ticking stays Playwright-observed",
            "Mobile lime menu open animation stays Playwright-only",
            "SplitText line-mask reveals stay Playwright-only"
        ]
    },
    "frontend-landing-landonorris": {
        "source": "LandoNorris",
        "description": "Lando Norris F1 driver homepage fidelity eval.",
        "modules": [
            "browse-query-v1",
            "command-session-v1"
        ],
        "bindings": {
            "destinations": [
                "hero",
                "horizontal-media",
                "helmet-grid",
                "collabs",
                "social-stream",
                "footer",
                "menu"
            ],
            "session_operations": [
                "start",
                "pause",
                "restart"
            ]
        },
        "mechanics_exclusions": [
            "Menu overlay open/close slide stays Playwright-observed",
            "Horizontal-track and helmet-grid scroll-linked motion stays Playwright-observed",
            "Social hover-to-play and placeholder fade stays Playwright-observed",
            "WebGL / Rive rendering stays Playwright-observed"
        ]
    },
    "frontend-mosbyfiles": {
        "source": "MosbyFiles",
        "description": "Mosby's Files American Modernist architecture editorial archive fidelity eval.",
        "modules": [
            "browse-query-v1",
            "command-session-v1"
        ],
        "bindings": {
            "destinations": [
                "home",
                "about",
                "ada-mercer",
                "elias-north",
                "mara-voss",
                "julian-kade",
                "imani-vale",
                "pavel-rowan",
                "lucian-shore",
                "mae-calder"
            ],
            "session_operations": [
                "play-video",
                "pause-video",
                "play-audio",
                "pause-audio",
                "open-popup",
                "close-popup",
                "advance-case"
            ]
        },
        "mechanics_exclusions": [
            "Folder-open/close Flip transition stays Playwright-observed",
            "Scrapbook Draggable stays Playwright-observed",
            "Stack hover/unfold and tag hover lift stay Playwright-observed",
            "Gallery crossfade and hero SplitText reveal stay Playwright-observed",
            "Overscroll scroll-linked motion stays Playwright-observed"
        ]
    },
    "frontend-landing-razorpay-sprint-26": {
        "source": "RazorpaySprint26",
        "description": "Razorpay Sprint 2026 marketing microsite fidelity eval.",
        "modules": [
            "browse-query-v1",
            "command-session-v1"
        ],
        "bindings": {
            "destinations": [
                "hero",
                "agentic-stack",
                "international",
                "payment-gateway",
                "d2c",
                "marketing",
                "business-banking"
            ],
            "session_operations": [
                "start",
                "stop",
                "trigger_demo"
            ],
            "demos": [
                "mobile-menu"
            ]
        },
        "mechanics_exclusions": [
            "Preloader translateY exit stays Playwright-observed",
            "Three.js scroll-hero camera scrub / desktop mouse parallax stays Playwright-observed",
            "GSAP section pinning + parallax reveal stays Playwright-observed",
            "Rive lazy hydration + hover scale(1.03) stays Playwright-observed",
            "Word-reveal heading sequencing stays Playwright-observed",
            "Video-modal scroll lock stays Playwright-observed"
        ]
    },
    "frontend-landing-readymag": {
        "source": "Readymag",
        "description": "Readymag design-tool marketing homepage fidelity eval.",
        "modules": [
            "browse-query-v1",
            "command-session-v1"
        ],
        "bindings": {
            "destinations": [
                "hero",
                "workflow",
                "teams",
                "support",
                "closing"
            ],
            "session_operations": [
                "advance"
            ],
            "demos": [
                "solutions-menu"
            ]
        },
        "mechanics_exclusions": [
            "Offset-path gallery marquees stay Playwright-observed",
            "Tilt accents (hero card / Ready / question mark) stay Playwright-observed",
            "Support orb path travel stays Playwright-observed",
            "Slideshow 2200ms timing stays Playwright-observed",
            "Reveal-on-scroll (feature cards) stays Playwright-observed",
            "Custom cursor follow / hover-swap stays Playwright-observed"
        ]
    },
    "frontend-landing-units-gr": {
        "source": "UnitsGr",
        "description": "units.gr all-inclusive student-housing marketing homepage fidelity eval.",
        "modules": [
            "browse-query-v1"
        ],
        "bindings": {
            "browsable_entity": "sections",
            "destinations": [
                "home-hero",
                "locations",
                "living",
                "typical-studio",
                "community",
                "what-we-stand-for",
                "social-feed",
                "book-cta",
                "menu"
            ]
        },
        "mechanics_exclusions": [
            "Custom cursor press/scale gesture stays Playwright-observed",
            "Shape-overlay path morph on hover stays Playwright-observed",
            "Home skeleton intro timeline stays Playwright-observed",
            "Marquee infinite horizontal loop stays Playwright-observed",
            "Swiper drag/slide transition stays Playwright-observed"
        ]
    },
    "frontend-landing-wolverineworldwide": {
        "source": "WolverineWorldwide",
        "description": "Wolverine Worldwide corporate marketing homepage fidelity eval.",
        "modules": [
            "browse-query-v1"
        ],
        "bindings": {
            "browsable_entity": "homepage-section",
            "destinations": [
                "hero",
                "brand-portfolio",
                "annual-report",
                "culture-statement",
                "market-snapshot",
                "latest-news",
                "culture-stats",
                "awards",
                "careers-cta",
                "mobile-menu",
                "responsibility-dropdown"
            ]
        },
        "mechanics_exclusions": [
            "Header scroll-morph timing stays Playwright-observed",
            "Particles rAF parallax stays Playwright-observed",
            "Hero-home GSAP intro timing stays Playwright-observed",
            "Carousel drag geometry stays Playwright-observed",
            "Mobile-menu clip-path stagger stays Playwright-observed",
            "Cookie-consent modal transition stays Playwright-observed"
        ]
    }
})


# Hard browser_* and framework-rebuild conversions (2026-07-19 wave).
TASK_SPECS.update({
    "frontend-productivity-focuspath": {
        "source": "Focuspath",
        "description": "FocusPath goal decomposition and roadmap tool good-app eval.",
        "modules": [
            "entity-collection-v1",
            "browse-query-v1",
            "command-session-v1"
        ],
        "bindings": {
            "entity": [
                "goal",
                "milestone",
                "step"
            ],
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete",
                "toggle",
                "reorder"
            ],
            "destinations": [
                "goals-overview",
                "goal-detail",
                "completed-goals"
            ],
            "session_operations": [
                "start",
                "pause",
                "resume",
                "connect",
                "disconnect"
            ],
            "demos": [
                "deliver-out-of-order"
            ]
        },
        "mechanics_exclusions": [
            "Milestone-complete node fill-in animation stays Playwright-observed",
            "Overview-detail view transition stays Playwright-observed",
            "Narrow-viewport horizontal-vertical path reflow stays Playwright-observed",
            "Hover/focus washes on nodes, rows, and toggles stay Playwright-observed"
        ]
    },
    "frontend-game-mineclash": {
        "source": "Mineclash",
        "description": "Dueling minefield puzzle game good-app eval.",
        "modules": [
            "command-session-v1",
            "browse-query-v1"
        ],
        "bindings": {
            "session_operations": [
                "start",
                "pause",
                "resume",
                "restart",
                "stop"
            ],
            "destinations": [
                "game-board",
                "stats"
            ],
            "filters": [
                "difficulty"
            ]
        },
        "mechanics_exclusions": [
            "Tile reveal click + adjacency/ore reveal stays Playwright-observed",
            "Flag Mode toggle + flagged-tile behavior stays Playwright-observed",
            "Rival AI thinking-delay animation + heuristic timing stays Playwright-observed",
            "Hint reveal, Strike-icon fill animation, and Web Audio tones stay Playwright-observed",
            "Narrow-viewport grid scaling stays Playwright-observed"
        ]
    },
    "frontend-game-letterdrop": {
        "source": "Letterdrop",
        "description": "LetterDrop falling-tile canvas word game good-app eval.",
        "modules": [
            "command-session-v1",
            "browse-query-v1"
        ],
        "bindings": {
            "session_operations": [
                "start",
                "pause",
                "resume",
                "restart"
            ],
            "destinations": [
                "game-board",
                "match-history",
                "achievements"
            ]
        },
        "mechanics_exclusions": [
            "Falling-tile canvas physics/timing and gradual acceleration stay Playwright-observed",
            "Tile tap selection and word-tray build stay Playwright-observed",
            "Danger-line crossing to Game Over stays Playwright-observed",
            "Combo streak meter animation, power-tile toasts, invalid-word tray shake stay Playwright-observed",
            "Undo Last Tile and narrow-viewport canvas scaling stay Playwright-observed"
        ]
    },
    "frontend-creative-tools-frameflick": {
        "source": "Frameflick",
        "description": "FrameFlick screenshot-dressing canvas compositor good-app eval.",
        "modules": [
            "structured-editor-v1",
            "entity-collection-v1"
        ],
        "bindings": {
            "editor_operations": [
                "update_property",
                "switch_mode",
                "set_content",
                "preview"
            ],
            "editor_properties": [
                "background",
                "custom-background",
                "padding",
                "corner-radius",
                "shadow",
                "frame-style",
                "caption-text",
                "caption-position",
                "caption-size",
                "caption-color",
                "watermark",
                "watermark-text",
                "watermark-opacity",
                "watermark-corner",
                "zoom"
            ],
            "editor_modes": [
                "square",
                "widescreen",
                "story",
                "original"
            ],
            "value_bounds": [
                "padding 0-25",
                "corner-radius 0-48",
                "shadow 0-10",
                "caption-size 12-64",
                "watermark-opacity 5-100",
                "zoom 20-200"
            ],
            "entity": "preset",
            "entity_operations": [
                "create",
                "select",
                "delete"
            ],
            "entity_fields": [
                "name",
                "settings"
            ]
        },
        "mechanics_exclusions": [
            "Drag-to-reposition and the Zoom slider gesture stay Playwright-only",
            "Drag-and-drop upload stays Playwright-observed",
            "Live canvas render fidelity, Download PNG 2x rasterization, and Copy Image clipboard stay Playwright-only",
            "Collaboration Scenario merge convergence stays Playwright-only"
        ]
    },
    "frontend-game-dare-night": {
        "source": "DareNight",
        "description": "Dare Night pass-the-device party card game good-app eval.",
        "modules": [
            "command-session-v1",
            "entity-collection-v1",
            "form-workflow-v1"
        ],
        "bindings": {
            "session_operations": [
                "start",
                "pause",
                "resume",
                "stop",
                "restart",
                "advance",
                "trigger_demo",
                "connect",
                "disconnect"
            ],
            "demos": [
                "deliver-out-of-order"
            ],
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete",
                "toggle"
            ],
            "entity_fields": [
                "prompt",
                "category",
                "intensity",
                "name",
                "outcome"
            ],
            "form_operations": [
                "validate",
                "submit",
                "cancel",
                "reset"
            ],
            "form_fields": [
                "player-name",
                "card-prompt",
                "card-category",
                "card-intensity"
            ],
            "workflow_steps": [
                "player-setup",
                "start-game",
                "add-custom-card"
            ]
        },
        "mechanics_exclusions": [
            "Card-flip / toast / timer-pulse animation timing stays Playwright-observed",
            "Live-stream tick timing stays Playwright-observed"
        ]
    },
    "frontend-productivity-lineforge": {
        "source": "Lineforge",
        "description": "LineForge chess opening study app good-app eval.",
        "modules": [
            "browse-query-v1",
            "entity-collection-v1",
            "command-session-v1"
        ],
        "bindings": {
            "browsable_entity": "openings",
            "destinations": [
                "library",
                "explorer",
                "practice",
                "notable-games",
                "saved-lines"
            ],
            "filters": [
                "favorites",
                "family"
            ],
            "themes": [
                "classic",
                "forest",
                "slate"
            ],
            "entity": "saved-line",
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete",
                "toggle"
            ],
            "entity_fields": [
                "name"
            ],
            "session_operations": [
                "start",
                "pause",
                "resume",
                "disconnect",
                "restart",
                "advance",
                "trigger_demo"
            ],
            "demos": [
                "deliver-out-of-order"
            ]
        },
        "mechanics_exclusions": [
            "Board move animation, piece-lift, and practice green/red flash timing stay Playwright-observed (gesture/transient mechanics)"
        ]
    },
    "frontend-productivity-notenest": {
        "source": "Notenest",
        "description": "Nested-folder note-taking app good-app eval.",
        "modules": [
            "entity-collection-v1",
            "browse-query-v1",
            "structured-editor-v1"
        ],
        "bindings": {
            "browsable_entity": "notes",
            "destinations": [
                "all-notes",
                "trash"
            ],
            "entity": "note",
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete",
                "toggle"
            ],
            "entity_fields": [
                "title",
                "body",
                "folder",
                "pinned",
                "color",
                "checklist-item"
            ],
            "editor_object_types": [
                "checklist-block"
            ],
            "editor_operations": [
                "set_content",
                "add"
            ]
        },
        "mechanics_exclusions": [
            "Bold/Italic/Bulleted-List formatting stays Playwright-driven (selection-dependent, mechanism matters)",
            "Load 10,000 Items virtualized scroll/overscan geometry stays Playwright-observed",
            "Raw image blobs / file paths must not appear in WebMCP args"
        ]
    },
    "frontend-game-feltrun": {
        "source": "Feltrun",
        "description": "Single-player Texas hold'em poker table good-app eval.",
        "modules": [
            "command-session-v1",
            "browse-query-v1",
            "structured-editor-v1"
        ],
        "bindings": {
            "session_operations": [
                "start",
                "advance",
                "restart",
                "trigger_demo",
                "connect",
                "disconnect"
            ],
            "destinations": [
                "table",
                "stats",
                "hand-history",
                "badges",
                "collaboration"
            ],
            "editor_operations": [
                "add",
                "update_property"
            ],
            "editor_object_types": [
                "shared-note"
            ]
        },
        "mechanics_exclusions": [
            "Hand-equity meter transition on each new street stays Playwright-observed",
            "Badge-unlock toast and showdown reveal stay Playwright-observed",
            "Concurrent-merge delivery ordering and same-note conflict resolution stay Playwright-driven"
        ]
    },
    "frontend-productivity-cipherlog": {
        "source": "Cipherlog",
        "description": "CipherLog covert-transmissions memo log good-app eval.",
        "modules": [
            "entity-collection-v1",
            "browse-query-v1"
        ],
        "bindings": {
            "entity": "memo",
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete"
            ],
            "entity_fields": [
                "title",
                "body",
                "priority",
                "channel"
            ],
            "value_bounds": {
                "priority": [
                    "high",
                    "standard",
                    "low"
                ]
            },
            "browsable_entity": "memos",
            "destinations": [
                "transmissions",
                "decommissioned"
            ],
            "filters": [
                "channel"
            ],
            "themes": [
                "default",
                "matrix-green",
                "neon-cyan",
                "blood-red",
                "ghost-white",
                "amber-terminal"
            ]
        },
        "mechanics_exclusions": [
            "Channel drag-and-drop reorder stays Playwright-observed",
            "Text-selection marking toolbar (Mark Classified / Mark Priority) stays Playwright-observed",
            "Cipher-lock passcode set/reveal gesture stays Playwright-observed"
        ]
    },
    "frontend-productivity-tagnote": {
        "source": "Tagnote",
        "description": "TagNote inline-tag note timeline good-app eval.",
        "modules": [
            "entity-collection-v1",
            "browse-query-v1"
        ],
        "bindings": {
            "browsable_entity": "notes",
            "destinations": [
                "timeline",
                "calendar",
                "archived"
            ],
            "filters": [
                "tag"
            ],
            "entity": "note",
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete",
                "toggle"
            ],
            "entity_fields": [
                "text",
                "tags"
            ]
        },
        "mechanics_exclusions": [
            "Attach File native OS file picker stays Playwright-observed",
            "Make-TODO tag-rail toggle and Open/Done split stays Playwright-observed",
            "Calendar day-marker selection and month navigation stays Playwright-observed",
            "Toast auto-dismiss and blank-submit shake animation timing stays Playwright-observed",
            "Undo/Redo branch traversal in the History panel stays Playwright-observed"
        ]
    },
    "frontend-creative-tools-markupflow": {
        "source": "Markupflow",
        "description": "Solid.js image annotation and markup studio good-app eval.",
        "modules": [
            "structured-editor-v1",
            "entity-collection-v1"
        ],
        "bindings": {
            "editor_object_types": [
                "rectangle",
                "oval",
                "line",
                "arrow",
                "text",
                "blur",
                "pixelate",
                "spotlight",
                "loupe",
                "highlighter"
            ],
            "editor_properties": [
                "color",
                "stroke-width",
                "text-style",
                "font-size"
            ],
            "editor_operations": [
                "select",
                "add",
                "delete",
                "update_property",
                "switch_mode",
                "preview"
            ],
            "editor_modes": [
                "edit",
                "preview"
            ],
            "value_bounds": {
                "font-size": [
                    10,
                    72
                ],
                "stroke-width": [
                    "thin",
                    "medium",
                    "thick"
                ],
                "text-style": [
                    "plain",
                    "bold-caption",
                    "outline",
                    "highlight-box",
                    "shadow"
                ]
            },
            "entity": "project",
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete"
            ],
            "entity_fields": [
                "name"
            ]
        },
        "mechanics_exclusions": [
            "Shape/effect click-drag drawing and Loupe click placement stay Playwright-observed",
            "Layer-reorder drag-and-drop gesture stays Playwright-observed"
        ]
    },
    "frontend-productivity-swiftnote": {
        "source": "Swiftnote",
        "description": "Keyboard-first SwiftNote note app good-app eval.",
        "modules": [
            "entity-collection-v1",
            "browse-query-v1"
        ],
        "bindings": {
            "entity": "note",
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete",
                "toggle"
            ],
            "entity_fields": [
                "title",
                "body"
            ],
            "browsable_entity": "notes",
            "destinations": [
                "editor",
                "quick-switcher",
                "shortcuts",
                "focus-mode"
            ]
        },
        "mechanics_exclusions": [
            "Quick Switcher arrow-key navigation, wrap, and re-clamp stay Playwright-driven",
            "Focus Mode / mobile drawer slide and sidebar collapse stay Playwright-observed",
            "Toast and Saved-indicator appearance/timing stay Playwright-observed",
            "Drag-and-drop image embedding stays Playwright-observed",
            "10,000-item virtualization scroll windowing stays Playwright-observed"
        ]
    },
    "frontend-productivity-sidedock": {
        "source": "Sidedock",
        "description": "SideDock color-coded workspace bookmark manager good-app eval.",
        "modules": [
            "browse-query-v1",
            "entity-collection-v1",
            "artifact-transfer-v1"
        ],
        "bindings": {
            "browsable_entity": "bookmarks",
            "destinations": [
                "default-view",
                "sidebar-view"
            ],
            "filters": [
                "search-scope"
            ],
            "entity": "bookmark",
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete",
                "toggle",
                "reorder"
            ],
            "entity_fields": [
                "url",
                "title",
                "note",
                "pinned",
                "folder"
            ],
            "artifact_operations": [
                "import",
                "export"
            ],
            "import_modes": [
                "netscape-html"
            ],
            "export_formats": [
                "netscape-html"
            ]
        },
        "mechanics_exclusions": [
            "Drag-move/reorder gestures stay Playwright-observed",
            "Inline-rename keystrokes stay Playwright-driven",
            "Virtualized scroll windowing stays Playwright-observed"
        ]
    },
    "frontend-productivity-mindthread": {
        "source": "Mindthread",
        "description": "MindThread thought-capture and idea-threading good-app eval.",
        "modules": [
            "browse-query-v1",
            "entity-collection-v1",
            "form-workflow-v1"
        ],
        "bindings": {
            "browsable_entity": "sparks",
            "destinations": [
                "home",
                "today",
                "archived",
                "thread-detail"
            ],
            "filters": [
                "tag"
            ],
            "entity": "spark",
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete",
                "toggle"
            ],
            "entity_fields": [
                "text",
                "tags",
                "thread",
                "status",
                "pinned",
                "archived"
            ],
            "form_fields": [
                "spark-text",
                "thread-title"
            ],
            "form_operations": [
                "validate",
                "submit",
                "cancel"
            ]
        },
        "mechanics_exclusions": [
            "Merge-confirm and toast animation stay Playwright-observed",
            "Virtualized scroll stays Playwright-observed",
            "Badge-color and reflection-tint treatments stay Playwright-observed"
        ]
    },
    "frontend-productivity-scribblespace": {
        "source": "Scribblespace",
        "description": "ScribbleSpace freeform infinite-canvas notes board good-app eval.",
        "modules": [
            "structured-editor-v1",
            "entity-collection-v1",
            "command-session-v1"
        ],
        "bindings": {
            "editor_object_types": [
                "note",
                "flashcard",
                "shape"
            ],
            "editor_operations": [
                "add",
                "select",
                "delete",
                "update_property",
                "set_content",
                "switch_mode",
                "preview"
            ],
            "editor_properties": [
                "color",
                "text",
                "front",
                "back",
                "z-order"
            ],
            "editor_modes": [
                "select",
                "connect"
            ],
            "entity": "board",
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete"
            ],
            "session_operations": [
                "start",
                "pause",
                "connect",
                "disconnect",
                "advance"
            ],
            "demos": [
                "deliver-out-of-order",
                "reconnect"
            ]
        },
        "mechanics_exclusions": [
            "Canvas pan/zoom and object drag/resize stay Playwright-driven",
            "Connect click-sequence stays Playwright-driven",
            "Mini-map click and search pan stay Playwright-observed",
            "Live-tick timing stays Playwright-observed"
        ]
    },
    "frontend-creative-tools-panecraft": {
        "source": "Panecraft",
        "description": "PaneCraft mock-data dashboard builder good-app eval.",
        "modules": [
            "entity-collection-v1",
            "form-workflow-v1",
            "command-session-v1"
        ],
        "bindings": {
            "entity": "pane",
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete",
                "reorder"
            ],
            "entity_fields": [
                "source",
                "type",
                "metric",
                "dimension",
                "size",
                "refresh-interval"
            ],
            "value_bounds": {
                "size": [
                    "small",
                    "medium",
                    "large"
                ],
                "refresh-interval": [
                    "off",
                    "30s",
                    "5m"
                ],
                "type": [
                    "line",
                    "bar",
                    "donut",
                    "table",
                    "counter"
                ]
            },
            "form_fields": [
                "data-source",
                "pane-type",
                "metric-column",
                "dimension-column"
            ],
            "form_operations": [
                "validate",
                "submit",
                "cancel",
                "advance",
                "return"
            ],
            "workflow_steps": [
                "choose-source",
                "choose-type",
                "configure"
            ],
            "session_operations": [
                "start",
                "pause",
                "stop",
                "connect",
                "disconnect",
                "advance"
            ],
            "demos": [
                "refresh-tick",
                "collaboration-scenario",
                "go-offline",
                "go-online"
            ]
        },
        "mechanics_exclusions": [
            "Date-range recompute and chart hover stay Playwright-observed",
            "Refresh-tick timing stays Playwright-observed",
            "Merge convergence visuals stay Playwright-observed",
            "Page-tab reorder/scroll stays Playwright-driven"
        ]
    },
    "frontend-game-repquest": {
        "source": "Repquest",
        "description": "RepQuest fitness-quest canvas game-sim good-app eval.",
        "modules": [
            "browse-query-v1",
            "entity-collection-v1",
            "command-session-v1"
        ],
        "bindings": {
            "destinations": [
                "quest",
                "history",
                "gear",
                "settings"
            ],
            "entity": "rep-set",
            "entity_operations": [
                "create",
                "delete",
                "select",
                "toggle"
            ],
            "entity_fields": [
                "reps",
                "setId",
                "gearId"
            ],
            "value_bounds": {
                "reps": {
                    "min": 1,
                    "max": 9999
                }
            },
            "session_operations": [
                "start",
                "pause",
                "resume",
                "stop",
                "restart",
                "trigger_demo"
            ]
        },
        "mechanics_exclusions": [
            "Undo/Redo branch restoration and History-state panel stay Playwright-observed",
            "Character glide animation stays Playwright-observed",
            "Zone-unlock palette and boss-defeated marker stay Playwright-observed"
        ]
    },
    "frontend-productivity-loopdaily": {
        "source": "Loopdaily",
        "description": "LoopDaily habit tracker with malformed-data recovery good-app eval.",
        "modules": [
            "browse-query-v1",
            "entity-collection-v1",
            "form-workflow-v1",
            "artifact-transfer-v1"
        ],
        "bindings": {
            "destinations": [
                "habits",
                "stats",
                "import",
                "heatmap"
            ],
            "filters": [
                "category"
            ],
            "entity": "habit",
            "entity_operations": [
                "update",
                "delete",
                "toggle",
                "quantity"
            ],
            "entity_fields": [
                "name",
                "reminder",
                "paused"
            ],
            "secondary_entity": "category",
            "secondary_entity_operations": [
                "create",
                "delete"
            ],
            "form_fields": [
                "name",
                "icon",
                "target-type",
                "target-count",
                "category",
                "reminder"
            ],
            "form_operations": [
                "validate",
                "submit",
                "cancel"
            ],
            "artifact_operations": [
                "import",
                "export"
            ],
            "import_modes": [
                "file",
                "malformed-sample"
            ],
            "export_formats": [
                "json"
            ]
        },
        "mechanics_exclusions": [
            "Habit drag-handle reorder stays Playwright-observed (no reorder tool exposed)",
            "File-picker Import stays Playwright-only per artifact-transfer no-raw-file-contents restriction; webmcp only drives Load Malformed Sample and its confirm dialog",
            "Toast/hover/focus timing stays Playwright-observed"
        ]
    },
    "frontend-productivity-taskgrove": {
        "source": "Taskgrove",
        "description": "TaskGrove hierarchical task-tree planner good-app eval.",
        "modules": [
            "entity-collection-v1",
            "browse-query-v1"
        ],
        "bindings": {
            "entity": "task",
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete",
                "toggle"
            ],
            "entity_fields": [
                "title",
                "parentId",
                "completed",
                "collapsed",
                "tags"
            ],
            "browsable_entity": "task branch",
            "destinations": [
                "root",
                "node"
            ],
            "filters": [
                "tag"
            ],
            "themes": [
                "light",
                "dark",
                "forest"
            ]
        },
        "mechanics_exclusions": [
            "Chevron rotate/collapse animation stays Playwright-observed",
            "Progress ring fill animation stays Playwright-observed",
            "Search dimming/highlight treatment stays Playwright-observed",
            "Move Up/Down sibling reorder stays Playwright-only (not exposed as a tool)"
        ]
    },
    "frontend-productivity-clockcraft": {
        "source": "Clockcraft",
        "description": "Personal time-tracking productivity app with branching edit history good-app eval.",
        "modules": [
            "entity-collection-v1",
            "browse-query-v1",
            "command-session-v1"
        ],
        "bindings": {
            "entity": "entry",
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete"
            ],
            "entity_fields": [
                "name",
                "category",
                "tag",
                "duration",
                "start-time"
            ],
            "browsable_entity": "entries",
            "destinations": [
                "timeline",
                "weekly-chart",
                "tag-manager"
            ],
            "filters": [
                "category"
            ],
            "session_operations": [
                "start",
                "stop",
                "restart"
            ]
        },
        "mechanics_exclusions": [
            "Undo/Redo/branch selection and the History panel stay Playwright-driven via the real controls",
            "Live per-second timer tick stays Playwright-observed",
            "Duration-proportional timeline block sizing stays Playwright-observed"
        ]
    },
    "frontend-game-fandangofury": {
        "source": "Fandangofury",
        "description": "FandangoFury side-scrolling hack-and-slash festival combat game good-app eval.",
        "modules": [
            "command-session-v1",
            "browse-query-v1",
            "entity-collection-v1"
        ],
        "bindings": {
            "session_operations": [
                "start",
                "restart",
                "advance",
                "stop"
            ],
            "destinations": [
                "stage-map",
                "masks",
                "cantina"
            ],
            "entity": "mask",
            "entity_operations": [
                "select",
                "toggle"
            ],
            "entity_fields": [
                "name",
                "bonus",
                "equipped"
            ]
        },
        "mechanics_exclusions": [
            "All combat (light/heavy attacks, Fiesta Combo chain, block/dodge cooldown, Fury meter fill, Fiesta Fury, boss telegraph, health depletion) stays Playwright-driven",
            "Undo/Redo/branch selection and the History panel stay Playwright-driven via the real controls",
            "Cantina upgrade purchase (escalating cost) stays Playwright-driven via the real Buy control",
            "Reset Progress (confirmation-guarded) stays Playwright-driven"
        ]
    },
    "frontend-creative-tools-portfolioframe": {
        "source": "Portfolioframe",
        "description": "Resume-and-portfolio builder good-app eval.",
        "modules": [
            "structured-editor-v1",
            "entity-collection-v1"
        ],
        "bindings": {
            "editor_object_types": [
                "header",
                "projects",
                "skills",
                "testimonials",
                "contact"
            ],
            "editor_operations": [
                "select",
                "update_property",
                "switch_mode",
                "preview"
            ],
            "editor_properties": [
                "name",
                "title",
                "bio",
                "email",
                "location",
                "theme",
                "density",
                "visibility",
                "order"
            ],
            "editor_modes": [
                "compact",
                "spacious"
            ],
            "entity": "portfolio-item",
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete"
            ],
            "entity_fields": [
                "project",
                "testimonial",
                "skill",
                "draft"
            ]
        },
        "mechanics_exclusions": [
            "Undo/Redo/branch selection and History panel stay Playwright-driven via real controls",
            "Download PDF (window.print) stays Playwright-observed",
            "Horizontal testimonials scroll stays Playwright-observed",
            "Section reorder animation stays Playwright-observed when gesture matters"
        ]
    },
    "frontend-creative-tools-euroscope": {
        "source": "Euroscope",
        "description": "Custom EuroScope air-traffic-client theme and icon patcher good-app eval.",
        "modules": [
            "form-workflow-v1",
            "structured-editor-v1",
            "artifact-transfer-v1"
        ],
        "bindings": {
            "workflow_steps": [
                "upload-euroscope-executable",
                "update-theme-colours",
                "update-embedded-bitmaps",
                "download-new-executable"
            ],
            "form_operations": [
                "advance",
                "return"
            ],
            "editor_object_types": [
                "base-theme",
                "base-icon-set"
            ],
            "editor_operations": [
                "select",
                "update_property",
                "switch_mode",
                "preview"
            ],
            "editor_properties": [
                "backdrop-darkest",
                "backdrop-darker",
                "backdrop-main",
                "backdrop-lighter",
                "backdrop-lightest",
                "foreground-secondary"
            ],
            "editor_modes": [
                "theme-colours",
                "embedded-bitmaps"
            ],
            "artifact_operations": [
                "export"
            ],
            "export_formats": [
                "patched-executable"
            ]
        },
        "mechanics_exclusions": [
            "Native file-picker / download interaction stays Playwright-driven"
        ]
    },
    "frontend-workflow-docuseal": {
        "source": "Docuseal",
        "description": "Docuseal PDF form builder and document signing workspace good-app eval.",
        "modules": [
            "structured-editor-v1",
            "entity-collection-v1",
            "form-workflow-v1"
        ],
        "bindings": {
            "editor_object_types": [
                "text",
                "signature",
                "initials",
                "date",
                "number",
                "checkbox",
                "radio",
                "select",
                "image",
                "file",
                "phone",
                "cells",
                "stamp"
            ],
            "editor_properties": [
                "name",
                "required",
                "submitter"
            ],
            "editor_operations": [
                "add",
                "select",
                "delete",
                "update_property",
                "preview",
                "switch_mode"
            ],
            "entity": "submitter",
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete"
            ],
            "entity_fields": [
                "name",
                "color"
            ],
            "form_operations": [
                "validate",
                "submit",
                "advance"
            ]
        },
        "mechanics_exclusions": [
            "Field drag-to-reposition gesture on the canvas stays Playwright when mechanism matters",
            "Hover halo / press feedback and toast fade timing stay Playwright-observed"
        ]
    },
    "frontend-creative-tools-mermaid-live-editor": {
        "source": "MermaidLiveEditor",
        "description": "Mermaid live diagram source editor with preview good-app eval.",
        "modules": [
            "structured-editor-v1",
            "browse-query-v1",
            "artifact-transfer-v1"
        ],
        "bindings": {
            "editor_object_types": [
                "diagram"
            ],
            "editor_operations": [
                "set_content",
                "switch_mode",
                "preview"
            ],
            "editor_modes": [
                "code",
                "config"
            ],
            "destinations": [
                "flowchart",
                "class",
                "sequence",
                "entity-relationship",
                "state",
                "mindmap",
                "pie",
                "gantt"
            ],
            "themes": [
                "light",
                "dark"
            ],
            "artifact_operations": [
                "export",
                "copy"
            ],
            "export_formats": [
                "svg",
                "png"
            ]
        },
        "mechanics_exclusions": [
            "Preview pan/zoom and rendered-diagram hover stay Playwright-observed"
        ]
    },
    "frontend-productivity-md-uy": {
        "source": "MdUy",
        "description": "md.uy collaborative markdown editor good-app eval.",
        "modules": [
            "structured-editor-v1",
            "artifact-transfer-v1"
        ],
        "bindings": {
            "editor_object_types": [
                "markdown-document"
            ],
            "editor_operations": [
                "set_content",
                "switch_mode",
                "preview"
            ],
            "editor_modes": [
                "edit",
                "preview",
                "presentation"
            ],
            "artifact_operations": [
                "export",
                "copy"
            ],
            "export_formats": [
                "markdown"
            ]
        },
        "mechanics_exclusions": [
            "Live-sync/peer collaboration stays chrome-only and Playwright-observed; Present-mode slide gestures stay Playwright-driven"
        ]
    },
    "frontend-data-tracking-ghostfolio": {
        "source": "Ghostfolio",
        "description": "Ghostfolio wealth portfolio dashboard good-app eval.",
        "modules": [
            "browse-query-v1",
            "entity-collection-v1"
        ],
        "bindings": {
            "destinations": [
                "portfolio-overview"
            ],
            "filters": [
                "asset-class"
            ],
            "entity": "holding",
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete"
            ],
            "entity_fields": [
                "name",
                "symbol",
                "asset-class",
                "quantity",
                "unit-price"
            ]
        },
        "mechanics_exclusions": [
            "Allocation bars and hover feedback stay Playwright-observed"
        ]
    },
    "frontend-data-tracking-plausible-analytics": {
        "source": "PlausibleAnalytics",
        "description": "Plausible privacy web-analytics dashboard good-app eval.",
        "modules": [
            "browse-query-v1"
        ],
        "bindings": {
            "destinations": [
                "example.com",
                "blog.example.com",
                "shop.example.com"
            ],
            "browsable_entity": "visitor-sessions",
            "filters": [
                "source",
                "page",
                "country",
                "period"
            ],
            "sorts": [
                "most-visitors",
                "fewest-visitors",
                "name-az"
            ],
            "themes": [
                "light",
                "dark"
            ]
        },
        "mechanics_exclusions": [
            "Chart bar hover/tooltip stays Playwright-observed"
        ]
    },
    "frontend-creative-tools-ghostty-config": {
        "source": "GhosttyConfig",
        "description": "Ghostty terminal configuration generator with live preview good-app eval.",
        "modules": [
            "structured-editor-v1",
            "artifact-transfer-v1",
            "browse-query-v1"
        ],
        "bindings": {
            "editor_operations": [
                "select",
                "update_property",
                "delete",
                "preview"
            ],
            "editor_object_types": [
                "application",
                "terminal",
                "clipboard",
                "window",
                "colors",
                "fonts",
                "keybinds",
                "mouse",
                "gtk",
                "linux",
                "macos"
            ],
            "editor_properties": [
                "font-family",
                "font-size",
                "font-thicken",
                "cursor-style",
                "cursor-color",
                "cursor-opacity",
                "cursor-style-blink",
                "background",
                "foreground",
                "background-opacity",
                "theme",
                "window-padding-x",
                "window-padding-y",
                "window-decoration",
                "scrollback-limit",
                "mouse-scroll-multiplier",
                "clipboard-read",
                "clipboard-write",
                "copy-on-select"
            ],
            "artifact_operations": [
                "export",
                "copy"
            ],
            "destinations": [
                "application",
                "terminal",
                "clipboard",
                "window",
                "colors",
                "fonts",
                "keybinds",
                "mouse",
                "gtk",
                "linux",
                "macos"
            ],
            "themes": [
                "Dracula",
                "Nord",
                "Gruvbox Dark",
                "Catppuccin Mocha",
                "Solarized Dark - Patched",
                "Builtin Dark"
            ]
        },
        "mechanics_exclusions": [
            "Terminal-preview cursor blink stays Playwright-observed",
            "Dock open/close stays Playwright-observed",
            "Color-picker/slider drag stays Playwright-driven"
        ]
    },
    "frontend-creative-tools-vert": {
        "source": "Vert",
        "description": "VERT private local file converter good-app eval.",
        "modules": [
            "artifact-transfer-v1",
            "entity-collection-v1",
            "command-session-v1"
        ],
        "bindings": {
            "artifact_operations": [
                "import",
                "convert",
                "export"
            ],
            "conversion_modes": [
                "png-to-jpeg",
                "png-to-webp",
                "jpeg-to-png",
                "jpeg-to-webp",
                "webp-to-png",
                "webp-to-jpeg",
                "gif-to-png",
                "bmp-to-png",
                "svg-to-png"
            ],
            "export_formats": [
                "png",
                "jpeg",
                "jpg",
                "webp"
            ],
            "entity": "file",
            "entity_operations": [
                "create",
                "select",
                "update",
                "delete"
            ],
            "entity_fields": [
                "name",
                "from",
                "to",
                "status"
            ],
            "session_operations": [
                "start",
                "stop"
            ]
        },
        "mechanics_exclusions": [
            "Drag-drop drop-zone and native file-picker stay Playwright-observed",
            "Theme recolor stays Playwright-observed",
            "Queue reorder is not offered"
        ]
    },
    "frontend-productivity-nostrpass": {
        "source": "Nostrpass",
        "description": "Native local Nostr identity and key manager good-app eval.",
        "modules": [
            "browse-query-v1",
            "entity-collection-v1"
        ],
        "bindings": {
            "destinations": [
                "dashboard",
                "identities",
                "permissions",
                "audit-log",
                "settings"
            ],
            "themes": [
                "light",
                "dark"
            ],
            "entity": "identity",
            "entity_operations": [
                "create",
                "select",
                "toggle"
            ],
            "entity_fields": [
                "label",
                "npub"
            ],
            "apps": [
                "damus",
                "snort",
                "coracle",
                "iris"
            ]
        },
        "mechanics_exclusions": [
            "Reveal-key and theme-toggle animation stay Playwright-observed"
        ]
    },
    "frontend-productivity-weblink": {
        "source": "Weblink",
        "description": "Weblink peer-to-peer WebRTC chat and file-transfer client good-app eval.",
        "modules": [
            "command-session-v1",
            "artifact-transfer-v1"
        ],
        "bindings": {
            "session_operations": [
                "connect",
                "disconnect"
            ],
            "artifact_operations": [
                "import"
            ]
        },
        "mechanics_exclusions": [
            "Real peer connection and file-picker interaction stay Playwright-observed",
            "Tool output cannot prove a peer connected"
        ]
    },
    "frontend-data-tracking-budget-angular": {
        "source": "BudgetAngular",
        "description": "Native personal expense and budget tracker good-app eval.",
        "modules": [
            "entity-collection-v1",
            "form-workflow-v1",
            "browse-query-v1"
        ],
        "bindings": {
            "entity": "expense",
            "entity_operations": [
                "create",
                "update",
                "delete"
            ],
            "entity_fields": [
                "value",
                "datetime",
                "categoryId",
                "counterparty"
            ],
            "form_fields": [
                "amount",
                "date",
                "category"
            ],
            "form_operations": [
                "validate",
                "submit",
                "cancel",
                "reset"
            ],
            "destinations": [
                "dashboard",
                "expenses",
                "settings"
            ],
            "filters": [
                "reporting-period"
            ]
        },
        "mechanics_exclusions": [
            "Material dialog + snackbar + progress-bar fill + expansion-panel transitions stay Playwright-observed"
        ]
    }
})


CRITERION_MAP = {
    "Core Features": "core_features",
    "Visual Design": "visual_design",
    "Motion": "motion",
    "Technical Implementation": "technical",
}

SKIP_NAMES = {
    "instruction.md",
    "NATIVE_REWRITE.md",
    "OFFLINE_STUBS.md",
    "PRICING-AMOUNTS.txt",
    "rubric.json",
    "verifier_checklist.json",
    "README.md",
    "INVENTORY.md",
    "rubric.md",
    "build_capture.py",
    "generate_scenes.py",
    ".DS_Store",
}
SKIP_PREFIXES = ("_source-capture", "cdn-")
SKIP_DIRS = {
    "__pycache__",
    "node_modules",
    "environment",
    "screenshots",
    "form-submissions",
    "theme-generator",  # nested task; only when packaging DaisyUI parent
    ".git",
    ".cursor",
}


_LEGACY_WEBMCP_MD_RE = re.compile(
    r"(?:## Product Requirements\n\n)?"
    r"### WebMCP Action Contract\n[\s\S]*?"
    r"(?=\n## |\n</|\Z)"
)
_XML_WEBMCP_RE = re.compile(
    r"(?:"
    r"## Delivery and integrity\n[\s\S]*?\n"
    r"|"
    r"<integrity>\n[\s\S]*?</integrity>\n+"
    r"<delivery>\n[\s\S]*?</delivery>\n+"
    r")?"
    r"<webmcp_action_contract>\n?[\s\S]*?</webmcp_action_contract>\n?"
)


def _strip_webmcp_from_readme(text: str) -> str:
    """Packaged README must not duplicate the agent-facing WebMCP contract."""
    text = _LEGACY_WEBMCP_MD_RE.sub("", text)
    text = re.sub(r"\n*## Product Requirements\n+", "\n", text)
    text = _XML_WEBMCP_RE.sub("", text)
    text = re.sub(r"\n*## Delivery and integrity\n[\s\S]*?(?=\n## |\Z)", "\n", text)
    text = re.sub(
        r"\n*<integrity>\n[\s\S]*?</integrity>\n*<delivery>\n[\s\S]*?</delivery>\n*",
        "\n",
        text,
    )
    return re.sub(r"\n{3,}", "\n\n", text).rstrip() + "\n"


def attach_webmcp(
    readme_text: str | None, instruction_text: str, section: str
) -> tuple[str | None, str]:
    """Return (readme_or_none, instruction) with preamble+contract on instruction only.

    Harbor agents receive instruction.md as the sole product/WebMCP source of truth.
    Packaged READMEs must not duplicate the contract.
    """
    instruction_text = webmcp_h3.upsert_contract(instruction_text, section)
    if readme_text is not None:
        readme_text = _strip_webmcp_from_readme(readme_text)
    return readme_text, instruction_text


def assignment_for_slug(slug: str) -> dict:
    """Authoring assignment (modules/bindings) for a packaged task slug."""
    for entry in webmcp_h3.load_assignments():
        if entry["task"] == slug:
            return entry
    # Fall back to TASK_SPECS when schemas are absent (dev-only).
    spec = TASK_SPECS[slug]
    return {
        "task": slug,
        "modules": spec["modules"],
        "bindings": spec["bindings"],
        "mechanics_exclusions": spec.get("mechanics_exclusions") or [],
    }


def judge_mcp_servers_block() -> str:
    """Inline webmcp bridge + Playwright CDP from canonical fragment."""
    path = canonical_dir() / "mcp" / "reward_mcp_servers.toml"
    text = path.read_text()
    idx = text.find("[[judge.mcp_servers]]")
    if idx < 0:
        raise ValueError("canonical reward_mcp_servers.toml missing [[judge.mcp_servers]]")
    return text[idx:].rstrip() + "\n"


def toml_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


CHECKLIST_AGGREGATE_TITLE = (
    "Every checklist-* criterion in this Core Features dimension passes "
    "during the agent verifier run"
)


def is_checklist_aggregate(item: dict) -> bool:
    """True for the obsolete meta rollup HLI (must not be emitted)."""
    return item.get("title") == CHECKLIST_AGGREGATE_TITLE


def numbered_criterion_id(major: int, minor: int) -> str:
    return f"{major}.{minor}"


def numbered_criterion_name(major: int, minor: int) -> str:
    """Criterion.name must match ^[a-zA-Z0-9_-]{1,64}$."""
    return f"{major}_{minor}"


def emit_criterion_lines(
    lines: list[str],
    *,
    cid: str,
    name: str,
    description: str,
    weight: float = 1.0,
    negate: bool = False,
    optional: bool = False,
) -> None:
    lines.append("[[criterion]]")
    lines.append(f'id = "{toml_escape(cid)}"')
    lines.append(f'name = "{toml_escape(name)}"')
    lines.append(f'description = "{toml_escape(description)}"')
    lines.append('type = "binary"')
    lines.append(f"weight = {weight}")
    if negate:
        lines.append("negate = true")
    if optional:
        lines.append("optional = true")
    lines.append("")


def append_checklist_criteria(
    lines: list[str], checklist: list[dict], *, start_minor: int = 1
) -> list[str]:
    """Append one positive [[criterion]] per checklist item as 1.{n} IDs."""
    emitted: list[str] = []
    minor = start_minor
    for item in checklist:
        if "id" not in item or "title" not in item:
            raise ValueError(f"checklist item missing id/title: {item!r}")
        cid = numbered_criterion_id(1, minor)
        emit_criterion_lines(
            lines,
            cid=cid,
            name=numbered_criterion_name(1, minor),
            description=item["title"],
            weight=1.0,
        )
        emitted.append(cid)
        minor += 1
    return emitted


def emit_rubric_hli(
    lines: list[str],
    item: dict,
    *,
    cid: str | None = None,
) -> str:
    """Emit one rubric HLI criterion; return the criterion id used."""
    ann = item["annotations"]
    is_neg = "negative" in ann["type"].lower()
    optional = "nice" in ann.get("importance", "").lower()
    weight = 0.5 if optional else 1.0
    resolved = cid if cid is not None else item["id"]
    emit_criterion_lines(
        lines,
        cid=resolved,
        name=resolved.replace(".", "_"),
        description=item["title"],
        weight=weight,
        negate=is_neg,
        optional=optional,
    )
    return resolved


def expected_criterion_ids(rubric: list[dict], checklist: list[dict] | None = None) -> set[str]:
    """Criterion ids that packaging must emit (checklist as 1.x; no meta rollup)."""
    checklist = checklist or []
    by_dim: dict[str, list[dict]] = {v: [] for v in CRITERION_MAP.values()}
    for item in rubric:
        if is_checklist_aggregate(item):
            continue
        crit = item["annotations"]["criterion"]
        if crit not in CRITERION_MAP:
            raise ValueError(f"unknown rubric criterion {crit!r} for id={item.get('id')!r}")
        by_dim[CRITERION_MAP[crit]].append(item)

    ids: set[str] = set()
    for dim, items in by_dim.items():
        if dim == "core_features" and checklist:
            for minor in range(1, len(checklist) + 1):
                ids.add(numbered_criterion_id(1, minor))
            for offset, _ in enumerate(items):
                ids.add(numbered_criterion_id(1, len(checklist) + 1 + offset))
        else:
            for item in items:
                ids.add(item["id"])
    return ids


def rubric_to_tomls(
    rubric: list[dict], checklist: list[dict] | None = None
) -> dict[str, str]:
    """Emit judge-only dimension TOMLs covering every rubric HLI (no programmatic checks).

    Core Features expands authoring verifier_checklist.json into numbered 1.x
    [[criterion]] rows (1.1..1.N), then emits remaining Core Features HLIs as
    1.(N+1)+. The obsolete checklist-aggregate meta row is never emitted.
    """
    by_dim: dict[str, list[dict]] = {v: [] for v in CRITERION_MAP.values()}
    for item in rubric:
        if is_checklist_aggregate(item):
            continue
        crit = item["annotations"]["criterion"]
        if crit not in CRITERION_MAP:
            raise ValueError(f"unknown rubric criterion {crit!r} for id={item.get('id')!r}")
        dim = CRITERION_MAP[crit]
        by_dim[dim].append(item)

    checklist = checklist or []
    mcp_block = judge_mcp_servers_block().rstrip()
    out: dict[str, str] = {}
    checklist_ids: list[str] = []
    for dim, items in by_dim.items():
        lines = [
            "[judge]",
            'judge = "codex"',
            'model = "gpt-5.6-sol"',
            'prompt_template = "../system_prompt.md"',
            'cwd = "/logs/verifier"',
            'mode = "batched"',
            "timeout = 3000",
            "",
            mcp_block,
            "",
            "[scoring]",
            'aggregation = "weighted_mean"',
            "",
        ]
        if dim == "core_features" and checklist:
            # Checklist items occupy 1.1..1.N; remaining HLIs shift to 1.(N+1)+.
            checklist_ids = append_checklist_criteria(lines, checklist, start_minor=1)
            next_minor = len(checklist) + 1
            for item in items:
                emit_rubric_hli(
                    lines,
                    item,
                    cid=numbered_criterion_id(1, next_minor),
                )
                next_minor += 1
        else:
            for item in items:
                emit_rubric_hli(lines, item)
        out[dim] = "\n".join(lines)

    emitted_ids: list[str] = []
    for body in out.values():
        emitted_ids.extend(re.findall(r'^id\s*=\s*"([^"]+)"', body, re.M))
    expected_ids = expected_criterion_ids(rubric, checklist)
    if len(emitted_ids) != len(expected_ids) or set(emitted_ids) != expected_ids:
        missing = sorted(expected_ids - set(emitted_ids))
        extra = sorted(set(emitted_ids) - expected_ids)
        raise ValueError(
            f"rubric/checklist→TOML criterion mismatch: "
            f"checklist={len(checklist_ids)} toml={len(emitted_ids)} "
            f"missing={missing} extra={extra}"
        )
    if checklist and not checklist_ids:
        raise ValueError("verifier_checklist.json provided but no checklist criteria emitted")
    return out


def verify_polarity(rubric: list[dict]) -> list[str]:
    errors: list[str] = []
    for label, dim in CRITERION_MAP.items():
        items = [i for i in rubric if i["annotations"]["criterion"] == label]
        pos = sum(1 for i in items if "negative" not in i["annotations"]["type"].lower())
        neg = sum(1 for i in items if "negative" in i["annotations"]["type"].lower())
        if pos < 1 or neg < 1:
            errors.append(f"{dim}: pos={pos} neg={neg}")
    return errors


def write_dimension_tomls(
    task_dir: Path, rubric: list[dict], checklist: list[dict] | None = None
) -> None:
    """Write judge [[criterion]] TOMLs for every rubric HLI (+ checklist) into task_dir/tests/."""
    for dim in CRITERION_MAP.values():
        (task_dir / "tests" / dim).mkdir(parents=True, exist_ok=True)
    for dim, body in rubric_to_tomls(rubric, checklist=checklist).items():
        (task_dir / "tests" / dim / f"{dim}.toml").write_text(body)


def authoring_source_dir(slug: str) -> Path:
    """Resolve authoring-folder path for a packaged task slug."""
    sources_path = schemas_dir() / "webmcp-task-sources.json"
    if sources_path.is_file():
        sources = json.loads(sources_path.read_text())
        entry = sources.get(slug)
        if entry and entry.get("source"):
            return ROOT / entry["source"]
    return ROOT / TASK_SPECS[slug]["source"]


def authoring_rubric_path(slug: str) -> Path:
    """Resolve authoring-folder rubric.json for a packaged task slug.

    Prefer corpuscheck schemas/webmcp-task-sources.json source paths; fall back to TASK_SPECS.
    Packaged tasks/frontend-* trees do not keep a copy of rubric.json.
    """
    return authoring_source_dir(slug) / "rubric.json"


def authoring_checklist_path(slug: str) -> Path:
    """Resolve authoring-folder verifier_checklist.json for a packaged task slug."""
    return authoring_source_dir(slug) / "verifier_checklist.json"


def load_authoring_checklist(slug: str) -> list[dict]:
    """Load authoring-folder verifier_checklist.json; empty list only when absent.

    Packaged tasks/frontend-* trees do not keep a copy — checklist items are
    emitted into tests/core_features/core_features.toml as numbered 1.x criteria.
    """
    path = authoring_checklist_path(slug)
    if not path.is_file():
        return []
    data = json.loads(path.read_text())
    if not isinstance(data, list):
        raise ValueError(f"{path}: expected JSON array of checklist items")
    return data


def sync_criteria_from_task_rubrics() -> dict[str, list[str]]:
    """Rewrite dimension TOMLs from authoring rubric.json + verifier_checklist.json."""
    errors: dict[str, list[str]] = {}
    for slug in sorted(TASK_SPECS):
        task_dir = TASKS / slug
        rubric_path = authoring_rubric_path(slug)
        if not rubric_path.is_file():
            errors[slug] = [f"missing authoring rubric {rubric_path}"]
            continue
        rubric = json.loads(rubric_path.read_text())
        # Meta aggregate must not affect polarity / packaging.
        rubric_for_pack = [i for i in rubric if not is_checklist_aggregate(i)]
        pol = verify_polarity(rubric_for_pack)
        if pol:
            errors[slug] = [f"polarity fail: {pol}"]
            continue
        try:
            checklist = load_authoring_checklist(slug)
            if not checklist:
                errors[slug] = [f"missing authoring checklist {authoring_checklist_path(slug)}"]
                continue
            write_dimension_tomls(task_dir, rubric_for_pack, checklist=checklist)
        except ValueError as exc:
            errors[slug] = [str(exc)]
    return errors


def verify_task_criteria_coverage(task_dir: Path, *, slug: str | None = None) -> list[str]:
    """Assert rubric HLIs + checklist items match tests/*/[[criterion]]."""
    errors: list[str] = []
    task_slug = slug or task_dir.name
    if task_slug not in TASK_SPECS:
        return [f"unknown task slug {task_slug}"]
    rubric_path = authoring_rubric_path(task_slug)
    if not rubric_path.is_file():
        return [f"missing authoring rubric {rubric_path}"]
    rubric = json.loads(rubric_path.read_text())
    try:
        checklist = load_authoring_checklist(task_slug)
    except ValueError as exc:
        return [str(exc)]
    if not checklist:
        return [f"missing authoring checklist {authoring_checklist_path(task_slug)}"]
    expected_ids = expected_criterion_ids(rubric, checklist)
    toml_ids: set[str] = set()
    for dim in CRITERION_MAP.values():
        toml_path = task_dir / "tests" / dim / f"{dim}.toml"
        if not toml_path.is_file():
            errors.append(f"missing {toml_path.relative_to(task_dir)}")
            continue
        text = toml_path.read_text()
        blocks = text.split("[[criterion]]")[1:]
        pos = neg = 0
        for block in blocks:
            mid = re.search(r'^id\s*=\s*"([^"]+)"', block, re.M)
            if mid:
                cid = mid.group(1)
                toml_ids.add(cid)
                if cid.startswith("checklist-") or cid.startswith("checklist_"):
                    errors.append(f"{dim} still uses obsolete checklist id {cid}")
            if re.search(r"^\s*negate\s*=\s*true", block, re.M):
                neg += 1
            else:
                pos += 1
        if pos < 1 or neg < 1:
            errors.append(f"{dim} polarity +{pos} -{neg}")
    cf_text = (task_dir / "tests" / "core_features" / "core_features.toml").read_text()
    if CHECKLIST_AGGREGATE_TITLE in cf_text:
        errors.append("core_features still contains checklist-aggregate meta criterion")
    for idx, item in enumerate(checklist, start=1):
        cid = numbered_criterion_id(1, idx)
        if f'id = "{cid}"' not in cf_text:
            errors.append(f"core_features missing checklist criterion {cid}")
        elif toml_escape(item["title"]) not in cf_text:
            errors.append(f"core_features checklist {cid} title mismatch")
    if len(toml_ids) != len(expected_ids) or toml_ids != expected_ids:
        errors.append(
            f"criterion coverage expected={len(expected_ids)} toml={len(toml_ids)} "
            f"missing={sorted(expected_ids - toml_ids)} extra={sorted(toml_ids - expected_ids)}"
        )
    return errors


JUDGE_SYSTEM_PROMPT = textwrap.dedent(
    """\
    A web app is running at http://localhost:3000. Grade it ONLY by what you observe in a real
    browser via the Playwright MCP browser (already present) — do NOT read or rely on the
    source code.

    What you are grading: the app under test was rebuilt from scratch by an agent that could
    only observe an opaque reference application through its browser UI. That reference
    application is NOT available during grading — do not look for it, and do not treat its
    absence as missing evidence. Each criterion below encodes behavior that was observed in
    the reference; the criterion text is the full specification. Grade the rebuilt app
    against the criterion text alone.

    Behavioral equivalence (implementation-agnostic grading): judge only externally
    observable behavior in the browser. Never penalize internal structure, code
    organization, or chosen component patterns; never penalize divergence from any imagined
    "original" beyond what the criterion states; and never demand pixel-perfection a
    criterion does not ask for. Do not penalize harmless differences in decorative copy,
    placeholder imagery, icon glyphs, minor spacing, or debranded names/logos unless the
    criterion makes those exact details material.

    PASS rule (applies to every criterion, so individual criteria need not repeat it): Score a
    criterion "yes" ONLY if you directly observe it fully satisfied in the browser; when unsure
    or unable to observe it, score "no".

    Negated criteria (phrased as a bad condition to detect): "satisfied" means the described
    bad condition IS present. Answer "yes" only if you directly observed that condition;
    answer "no" if you did not find it. Before finalizing a negated criterion's answer,
    re-read the reasoning you just wrote and confirm the yes/no matches that reasoning —
    if your reasoning concludes the app is clean of the described condition, the answer is
    "no", never "yes".

    Render gate: if the app fails to serve, renders a blank or error page, or is so broken
    that NO meaningful UI can be reached at all, score EVERY criterion "no". A crash confined
    to one workflow does not zero unrelated criteria you already observed working.

    How to grade reliably:
    1. `browser_navigate` to http://localhost:3000, wait for load, then `browser_snapshot`.
    2. Interact with `browser_click` / `browser_type`; take a fresh snapshot after changes.
    3. Prefer `browser_evaluate` for objective DOM/style checks.
    4. Screenshot decisive end states per criterion.
    5. Reset shared session state when a criterion needs a fresh start.

    WebMCP tools (webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool): may accelerate actions
    declared in the instruction's <webmcp_action_contract>, but NEVER replace visible
    Playwright browser evidence and NEVER affect scoring — there is no WebMCP criterion.
    If WebMCP is missing or fails, fall back to Playwright; that is not a scoring failure.

    {criteria}
    """
)

DOCKERFILE = textwrap.dedent(
    """\
    FROM mcr.microsoft.com/playwright:v1.61.0-noble
    ENV DEBIAN_FRONTEND=noninteractive

    COPY --from=ghcr.io/astral-sh/uv:0.11.15 /uv /uvx /bin/

    RUN apt-get update && apt-get install -y --no-install-recommends build-essential \\
     && rm -rf /var/lib/apt/lists/*

    # Real-world agent tooling (pins: tasks/_pins.py). Browsers ship with the
    # base image; the cache symlink lets tools that ignore
    # PLAYWRIGHT_BROWSERS_PATH resolve them.
    RUN PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install -g \\
          playwright@1.61.0 \\
          @playwright/mcp@0.0.76 \\
          start-server-and-test@3.0.11 \\
     && mkdir -p /root/.cache && ln -sfn /ms-playwright /root/.cache/ms-playwright

    # The judge-only rewardkit harness is deliberately NOT baked in: tests/test.sh
    # installs it at verify time, after the builder's turn, so the agent never has
    # the judge harness in its container to inspect or tamper with (reward-hacking
    # surface). Pin: tasks/_pins.py HARBOR_REWARDKIT_GIT_SHA — bumping regenerates
    # test.sh copies, no image rebuild.

    # WebMCP CDP bridge (same canonical source as the judge copy in
    # tests/webmcp_stdio_server.mjs). Baked in so the builder can smoke-test
    # its own window.webmcp_* surface: node /opt/webmcp/webmcp_stdio_server.mjs
    # against the shared CDP Chrome the entrypoint starts on 127.0.0.1:9222.
    COPY webmcp_stdio_server.mjs /opt/webmcp/webmcp_stdio_server.mjs

    # Entrypoint starts the shared headless CDP Chrome (9222) plus the
    # forced-reduced-motion Chrome (9223, playwright_reduced_motion server);
    # HEALTHCHECK goes green only when both answer CDP, so
    # `harbor run --install-only` exposes a broken judge env
    # before any agent trial burns 45 minutes.
    COPY entrypoint.sh /opt/verifier/entrypoint.sh
    RUN chmod 0755 /opt/verifier/entrypoint.sh
    ENTRYPOINT ["/opt/verifier/entrypoint.sh"]
    HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \\
      CMD curl -fsS http://127.0.0.1:9222/json/version > /dev/null \\
       && curl -fsS http://127.0.0.1:9223/json/version > /dev/null || exit 1

    WORKDIR /app
    EXPOSE 3000
    """
)

TEST_SH = textwrap.dedent(
    f"""\
    #!/usr/bin/env bash
    set -u
    mkdir -p /logs/verifier

    # App-caused failure: write a zero reward.json (same aggregate keys as the
    # tests/reward.toml [[reward]] specs) and exit 0 so harbor records the score.
    # No up-front seed: rewardkit deletes pre-existing outputs at startup
    # (_clear_outputs), so a seed protects nothing — infra failures exit non-zero
    # with no reward.json instead.
    record_zero() {{
      echo "[test] $1 — recording 0.0" >&2
      echo '{{"reward": 0.0, "pass": 0.0}}' > /logs/verifier/reward.json
      exit 0
    }}

    # Judge-only rewardkit harness, installed at verify time — deliberately NOT
    # baked into the image, so the builder agent never has the judge harness in its
    # container to inspect or tamper with (pin: tasks/_pins.py
    # HARBOR_REWARDKIT_GIT_SHA; bumping regenerates test.sh copies, no image
    # rebuild). Install failure is an infra error (exit 1), never a 0.0 for the app.
    uv tool install "{HARBOR_REWARDKIT_PACKAGE}" \\
     && ln -sf /root/.local/bin/rewardkit /usr/local/bin/rewardkit \\
     || {{ echo "[test] rewardkit install failed (infra)" >&2; exit 1; }}

    # The shared CDP Chrome is started by /opt/verifier/entrypoint.sh (Dockerfile
    # HEALTHCHECK mirrors this gate). rewardkit expands $WEBMCP_CDP_* with
    # os.path.expandvars, so they must be exported here.
    export WEBMCP_CDP_PORT=9222
    export WEBMCP_CDP_ENDPOINT="http://127.0.0.1:$WEBMCP_CDP_PORT"
    for _ in $(seq 1 30); do
      curl -fsS "$WEBMCP_CDP_ENDPOINT/json/version" > /dev/null 2>&1 && break
      sleep 1
    done
    curl -fsS "$WEBMCP_CDP_ENDPOINT/json/version" > /dev/null 2>&1 \\
      || {{ echo "[test] judge Chrome unreachable (infra); see /logs/verifier/chrome.log" >&2; exit 1; }}

    # Reduced-motion Chrome (entrypoint's second instance, --force-prefers-reduced-motion):
    # backs the playwright_reduced_motion judge MCP server so reduced-motion criteria
    # are verifiable. Same infra gate: unreachable = infra error, never a 0.0.
    export WEBMCP_RM_CDP_PORT=9223
    export WEBMCP_RM_CDP_ENDPOINT="http://127.0.0.1:$WEBMCP_RM_CDP_PORT"
    for _ in $(seq 1 30); do
      curl -fsS "$WEBMCP_RM_CDP_ENDPOINT/json/version" > /dev/null 2>&1 && break
      sleep 1
    done
    curl -fsS "$WEBMCP_RM_CDP_ENDPOINT/json/version" > /dev/null 2>&1 \\
      || {{ echo "[test] reduced-motion judge Chrome unreachable (infra); see /logs/verifier/chrome-rm.log" >&2; exit 1; }}

    # Requires /app/package.json scripts named exactly: verify:build (exit 0), start (port 3000).
    # When grading restored artifacts (harbor score), node_modules is excluded — reinstall.
    if [ -f /app/package.json ] && [ ! -d /app/node_modules ]; then
      (cd /app && npm install --no-audit --no-fund) || record_zero "npm install failed — app did not build"
    fi
    npm run verify:build || record_zero "verify:build failed — app did not build"
    # rewardkit defaults are --workspace /app --output /logs/verifier/reward.json.
    exec start-server-and-test 'npm start' tcp:localhost:3000 'rewardkit /tests'
    """
)

TASK_README_TMPL = textwrap.dedent(
    """\
    # {title}

    {description}

    A frontend-only Harbor eval task. A builder agent recreates the
    app in `instruction.md`, delivering a self-contained SPA in `/app`
    with `start` (port 3000) and `verify:build` scripts plus the
    WebMCP tool surface from the action contract.

    ## Judging

    The verifier serves the built app and grades it in a real browser
    across 13 weighted dimensions; `pass` at reward >= 0.7. The judge
    observes via Playwright MCP and drives state-changing setup through
    the app's registered WebMCP tools (a task-local CDP bridge in
    `tests/webmcp_stdio_server.mjs`). Criteria live in
    `tests/<dimension>/<dimension>.toml`.

    ## Running

        harbor run -p tasks/{slug} -a claude-code -m sonnet
    """
)

# Genre prefixes stripped from the slug when deriving the README title
# (e.g. frontend-creative-tools-css-theme-builder -> "Css Theme Builder").
README_TITLE_GENRE_PREFIXES = (
    "creative-tools-",
    "data-tracking-",
    "game-",
    "landing-",
    "planning-",
    "productivity-",
    "workflow-",
)


def readme_title(slug: str) -> str:
    """Deterministic README title from the task slug: drop the `frontend-`
    namespace and the genre prefix, then title-case the remaining words."""
    rest = slug.removeprefix("frontend-")
    for prefix in README_TITLE_GENRE_PREFIXES:
        if rest.startswith(prefix):
            rest = rest.removeprefix(prefix)
            break
    return rest.replace("-", " ").title()


def render_task_readme(slug: str, description: str) -> str:
    """Canonical packaged-task README: registry/maintainer-facing, and must not
    leak authoring provenance (original brands, capture sources, inspiration
    URLs), oracle implementation details, or judge criteria text. Title and
    one-line description derive from corpuscheck schemas/webmcp-task-sources.json — the
    same source task.toml descriptions come from."""
    return TASK_README_TMPL.format(
        title=readme_title(slug), description=description, slug=slug
    )


ORACLE_README_TMPL = textwrap.dedent(
    """\
    # {title} — Oracle

    Reference solution (oracle) for the `{slug}` task. Serves the app
    described in `../../instruction.md`; used by `solve.sh`, the reference
    screenshot capture harness, and oracle validation runs. Must serve with
    zero console/page errors.

    ## Run

        npm install
        npm run verify:build
        npm start          # serves on port 3000

    ## WebMCP

    Registers the task's contract modules: {modules}. Tools are exposed via
    window.webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool.
    """
)


def render_oracle_readme(slug: str, modules: list[str]) -> str:
    """Canonical solution/app README: title/slug derive exactly like the task
    README; the module list comes from the task's entry in
    corpuscheck schemas/webmcp-assignments.json."""
    return ORACLE_README_TMPL.format(
        title=readme_title(slug), slug=slug, modules=", ".join(modules)
    )


SOLVE_SH = textwrap.dedent(
    """\
    #!/usr/bin/env bash
    set -euo pipefail
    shopt -s dotglob nullglob
    for path in /app/* /app/.[!.]* /app/..?*; do
      rm -rf -- "$path"
    done
    cp -a /solution/app/. /app/
    if [[ ! -f /app/package.json ]]; then
      cat > /app/package.json <<'EOF'
    {
      "name": "oracle-static",
      "private": true,
      "scripts": {
        "verify:build": "node -e \\"require('fs').accessSync(require('fs').existsSync('Dashboard.html')?'Dashboard.html':'index.html')\\"",
        "start": "npx --yes serve -l 3000 -n"
      }
    }
    EOF
    fi
    if [[ -f /app/Dashboard.html && ! -f /app/index.html ]]; then
      printf '%s\\n' '<!DOCTYPE html><meta http-equiv="refresh" content="0; url=Dashboard.html">' > /app/index.html
    fi
    """
)

REWARD_TOML = textwrap.dedent(
    """\
    # Aggregate scores. WebMCP is never a scoring dimension.
    [[reward]]
    name = "reward"
    aggregation = "weighted_mean"

    [[reward]]
    name = "pass"
    aggregation = "threshold"
    threshold = 0.7
    """
)

# Canonical artifact excludes: build outputs, dependency trees, caches, and
# tooling byproducts that must never be collected into trial artifacts.
# tar --exclude semantics: each pattern matches path components at ANY depth.
# test_webmcp_h3 asserts every tasks/*/task.toml carries this exact set.
ARTIFACT_EXCLUDES: list[str] = [
    "node_modules",
    ".git",
    ".DS_Store",
    # build outputs
    "dist",
    "build",
    "out",
    ".next",
    ".nuxt",
    ".svelte-kit",
    "storybook-static",
    # caches / tool state
    ".cache",
    ".vite",
    ".turbo",
    ".parcel-cache",
    ".pnpm-store",
    ".yarn",
    ".npm",
    # test/report byproducts
    "coverage",
    "playwright-report",
    "test-results",
]

TASK_TOML_TMPL = textwrap.dedent(
    """\
    schema_version = "1.3"

    [task]
    name = "mercor-intelligence/{slug}"
    description = "{description}"

    [agent]
    timeout_sec = 3600.0

    [verifier]
    timeout_sec = 14400.0

    [environment]
    workdir = "/app"
    build_timeout_sec = 1200.0
    memory_mb = 8192
    cpus = 4

    [[artifacts]]
    source = "/app"
    destination = "app"
    exclude = [
    {artifact_excludes}
    ]
    """
)


def render_task_toml(slug: str, description: str) -> str:
    """Render task.toml from the template with the canonical artifact excludes."""
    excludes = "\n".join(f'    "{e}",' for e in ARTIFACT_EXCLUDES)
    return TASK_TOML_TMPL.format(
        slug=slug,
        description=toml_escape(description),
        artifact_excludes=excludes,
    )


def should_skip(name: str, *, is_daisy_parent: bool) -> bool:
    if name in SKIP_NAMES:
        return True
    if any(name.startswith(p) for p in SKIP_PREFIXES):
        return True
    if name in SKIP_DIRS:
        if name == "theme-generator" and is_daisy_parent:
            return True
        if name != "theme-generator":
            return True
    return False


def copy_solution_app(src: Path, dest: Path, *, is_daisy_parent: bool) -> None:
    dest.mkdir(parents=True, exist_ok=True)
    for entry in src.iterdir():
        if should_skip(entry.name, is_daisy_parent=is_daisy_parent):
            continue
        target = dest / entry.name
        if entry.is_dir():
            shutil.copytree(entry, target, dirs_exist_ok=True, ignore=shutil.ignore_patterns(
                "__pycache__", "*.pyc", ".DS_Store"
            ))
        else:
            shutil.copy2(entry, target)

    # Ensure package.json for static oracle serve
    pkg = dest / "package.json"
    if not pkg.exists():
        entry = "Dashboard.html" if (dest / "Dashboard.html").exists() else "index.html"
        pkg.write_text(
            json.dumps(
                {
                    "name": "oracle-static",
                    "private": True,
                    "scripts": {
                        "verify:build": f"node -e \"require('fs').accessSync('{entry}')\"",
                        "start": "npx --yes serve -l 3000 -n",
                    },
                },
                indent=2,
            )
            + "\n"
        )
    if (dest / "Dashboard.html").exists() and not (dest / "index.html").exists():
        (dest / "index.html").write_text(
            '<!DOCTYPE html><meta http-equiv="refresh" content="0; url=Dashboard.html">\n'
        )


def package_task(slug: str, spec: dict) -> list[str]:
    src = ROOT / spec["source"]
    errors: list[str] = []
    if not (src / "instruction.md").exists():
        return [f"missing instruction.md in {src}"]
    if not (src / "rubric.json").exists():
        return [f"missing rubric.json in {src}"]

    rubric = [
        i
        for i in json.loads((src / "rubric.json").read_text())
        if not is_checklist_aggregate(i)
    ]
    pol = verify_polarity(rubric)
    if pol:
        errors.append(f"polarity fail: {pol}")
        return errors

    out = TASKS / slug
    if out.exists():
        shutil.rmtree(out)
    (out / "environment").mkdir(parents=True)
    (out / "solution" / "app").mkdir(parents=True)
    (out / "tests").mkdir(parents=True)
    for dim in CRITERION_MAP.values():
        (out / "tests" / dim).mkdir()

    instruction = (src / "instruction.md").read_text()
    readme = render_task_readme(slug, spec["description"])
    section = webmcp_h3.render_instruction_webmcp_section(assignment_for_slug(slug))
    if "Baseline Quality Bar" in section or "/opt/webmcp-contracts" in section:
        raise ValueError("instruction WebMCP section must not include Baseline or /opt path")
    _, instruction = attach_webmcp(None, instruction, section)
    if "Baseline Quality Bar" in instruction:
        raise ValueError(f"{slug}: instruction must not include Baseline Quality Bar")
    if "/opt/webmcp-contracts" in instruction:
        raise ValueError(f"{slug}: instruction must not reference /opt/webmcp-contracts")

    (out / "instruction.md").write_text(instruction)
    (out / "README.md").write_text(readme)

    # Authoring verifier_checklist.json is the source for core_features
    # numbered 1.x criteria; it is NOT copied into tasks/frontend-*.
    # rubric.json likewise stays in the authoring folder only — both are
    # emitted into tests/**/*.toml at package/sync time.
    checklist_path = src / "verifier_checklist.json"
    if not checklist_path.is_file():
        errors.append(f"missing authoring verifier_checklist.json in {src}")
        return errors
    checklist = json.loads(checklist_path.read_text())
    if not isinstance(checklist, list) or not checklist:
        errors.append("authoring verifier_checklist.json must be a non-empty JSON array")
        return errors

    (out / "task.toml").write_text(render_task_toml(slug, spec["description"]))

    is_daisy_parent = spec["source"] == "DaisyUI"
    copy_solution_app(src, out / "solution" / "app", is_daisy_parent=is_daisy_parent)

    dockerfile_path = out / "environment" / "Dockerfile"
    dockerfile_path.write_text(DOCKERFILE)
    if "/opt/webmcp-contracts" in DOCKERFILE or "webmcp-contracts" in DOCKERFILE:
        raise ValueError("Dockerfile must not vendor /opt/webmcp-contracts")
    # Build-context copy of the bridge for the Dockerfile COPY above; the judge
    # copy in tests/ comes from the same canonical file (zero-skew by construction).
    shutil.copy2(
        canonical_dir() / "mcp" / "webmcp_stdio_server.mjs",
        out / "environment" / "webmcp_stdio_server.mjs",
    )
    # Entrypoint baked as /opt/verifier/entrypoint.sh (starts the shared CDP
    # Chrome; paired with the Dockerfile HEALTHCHECK).
    shutil.copy2(
        canonical_dir() / "entrypoint.sh",
        out / "environment" / "entrypoint.sh",
    )

    solve = out / "solution" / "solve.sh"
    solve.write_text(SOLVE_SH)
    solve.chmod(0o755)

    # Reference screenshots are opt-in builder input: when captures exist under
    # reference-screenshots/<slug>/ (see capture_reference_screenshots.mjs),
    # re-install them after the rebuild wiped the task dir.
    from .screenshots import install as install_ref_screenshots

    install_ref_screenshots(slug)

    # Website-fidelity builder kits: curated brand assets and reference-site
    # screenshots from the authoring folder ride in the environment image.
    env_dir = out / "environment"
    copy_pairs = []
    if (src / "environment").is_dir():
        for sub in (src / "environment").iterdir():
            if sub.name == "Dockerfile" or sub.name.startswith("."):
                continue
            copy_pairs.append((sub, env_dir / sub.name, f"/{sub.name}"))
    if (src / "screenshots").is_dir():
        copy_pairs.append((src / "screenshots", env_dir / "site-screenshots", "/site-screenshots"))
    if (src / "assets").is_dir() and not (src / "environment" / "assets").is_dir():
        copy_pairs.append((src / "assets", env_dir / "assets", "/assets"))
    if copy_pairs:
        docker_lines = []
        for source, target, mount in copy_pairs:
            if target.exists():
                shutil.rmtree(target) if target.is_dir() else target.unlink()
            if source.is_dir():
                shutil.copytree(source, target, ignore=shutil.ignore_patterns("node_modules", ".DS_Store"))
            else:
                shutil.copy2(source, target)
            docker_lines.append(f"COPY {target.name}/ {mount}/")
        dtext = dockerfile_path.read_text()
        for line in docker_lines:
            if line not in dtext:
                dtext += ("\n" if dtext.endswith("\n") else "\n\n") + line + "\n"
        dockerfile_path.write_text(dtext)

    test_sh = out / "tests" / "test.sh"
    test_sh.write_text(TEST_SH)
    test_sh.chmod(0o755)

    (out / "tests" / "reward.toml").write_text(REWARD_TOML)
    judge_prompt = _read_canonical_prompt("system_prompt.md", JUDGE_SYSTEM_PROMPT)
    if "Baseline Quality Bar" in judge_prompt:
        raise ValueError("judge system_prompt must not include Baseline Quality Bar")
    (out / "tests" / "system_prompt.md").write_text(judge_prompt)

    # MCP servers are inlined into dimension TOMLs via judge_mcp_servers_block()
    # from corpuscheck canonical/mcp/reward_mcp_servers.toml. The webmcp entry runs the
    # task-local CDP bridge below (vendored per task; playwright-core only).
    shutil.copy2(
        canonical_dir() / "mcp" / "webmcp_stdio_server.mjs",
        out / "tests" / "webmcp_stdio_server.mjs",
    )

    try:
        write_dimension_tomls(out, rubric, checklist=checklist)
    except ValueError as exc:
        errors.append(str(exc))
        return errors

    coverage = verify_task_criteria_coverage(out, slug=slug)
    if coverage:
        errors.extend(coverage)
    return errors


def write_assignment_map() -> None:
    """Refresh legacy map; prefer corpuscheck schemas/webmcp-assignments.json when present."""
    schema_map = schemas_dir() / "webmcp-assignment-map.json"
    if schema_map.is_file():
        entries = json.loads(schema_map.read_text())
        if len(entries) != 23:
            raise ValueError(f"expected 23 assignment entries, got {len(entries)}")
    else:
        entries = []
        for slug, spec in TASK_SPECS.items():
            entries.append(
                {
                    "task": slug,
                    "modules": spec["modules"],
                    "bindings": spec["bindings"],
                    "mechanics_exclusions": spec.get("mechanics_exclusions") or [],
                }
            )
    path = canonical_dir() / "webmcp-assignment-map.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(entries, indent=2) + "\n")


def _read_canonical_prompt(name: str, fallback: str) -> str:
    """Prefer authored canonical judge prompt from corpuscheck package data."""
    path = canonical_dir() / name
    if path.is_file():
        return path.read_text()
    return fallback


def write_canonical_prompts() -> None:
    canon = canonical_dir()
    canon.mkdir(parents=True, exist_ok=True)
    # Judge prompt only — builder agent system prompt retired; policy lives in instruction.md.
    judge_path = canon / "system_prompt.md"
    if not judge_path.exists():
        judge_path.write_text(JUDGE_SYSTEM_PROMPT)
    builder_path = canon / "agent_system_prompt.md"
    if builder_path.exists():
        builder_path.unlink()
    (canon / "reward.toml").write_text(REWARD_TOML)
    (canon / "test.sh").write_text(TEST_SH)
    env_dir = canon / "environment"
    env_dir.mkdir(parents=True, exist_ok=True)
    (env_dir / "Dockerfile").write_text(DOCKERFILE)
    bridge = canon / "mcp" / "webmcp_stdio_server.mjs"
    if bridge.is_file():
        shutil.copy2(bridge, env_dir / "webmcp_stdio_server.mjs")
    entrypoint = canon / "entrypoint.sh"
    if entrypoint.is_file():
        shutil.copy2(entrypoint, env_dir / "entrypoint.sh")
    vendored = env_dir / "webmcp-contracts"
    if vendored.exists():
        shutil.rmtree(vendored)
    # Ensure ephemeral MCP templates exist (authored by m5; copy stubs only if missing).
    mcp_dir = canon / "mcp"
    mcp_dir.mkdir(parents=True, exist_ok=True)
    for name in (
        "builder.mcp.json",
        "judge.mcp.json",
        "allowed_tools.json",
        "reward_mcp_servers.toml",
    ):
        if not (mcp_dir / name).exists():
            raise FileNotFoundError(
                f"missing corpuscheck canonical/mcp/{name} — restore m5 MCP templates"
            )


def _verify_all_tasks(order: list[str], *, check_webmcp: bool) -> dict[str, list[str]]:
    all_errors: dict[str, list[str]] = {}
    print("\n=== polarity + criterion coverage ===")
    for slug in order:
        task_dir = TASKS / slug
        if not task_dir.exists():
            all_errors[slug] = ["task dir missing"]
            continue
        for dim in CRITERION_MAP.values():
            toml_path = task_dir / "tests" / dim / f"{dim}.toml"
            if not toml_path.is_file():
                all_errors.setdefault(slug, []).append(f"missing {dim}.toml")
                print(f"{slug}/{dim}: MISSING [FAIL]")
                continue
            text = toml_path.read_text()
            blocks = text.split("[[criterion]]")[1:]
            pos = neg = 0
            for b in blocks:
                if re.search(r"^\s*negate\s*=\s*true", b, re.M):
                    neg += 1
                else:
                    pos += 1
            status = "PASS" if pos >= 1 and neg >= 1 else "FAIL"
            print(f"{slug}/{dim}: +{pos} -{neg} [{status}]")
            if status == "FAIL":
                all_errors.setdefault(slug, []).append(f"{dim} polarity")
        for err in verify_task_criteria_coverage(task_dir, slug=slug):
            # polarity already printed above; keep coverage / missing-id errors
            if "polarity" in err and slug in all_errors and err in all_errors[slug]:
                continue
            if "polarity" in err:
                continue
            all_errors.setdefault(slug, []).append(err)
            print(f"{slug}/coverage: FAIL ({err})")
        if check_webmcp:
            instr = task_dir / "instruction.md"
            text = instr.read_text() if instr.exists() else ""
            xml_ok = (
                "<webmcp_action_contract>" in text
                and "</webmcp_action_contract>" in text
                and "<module_spec" in text
                and "Implementation:" in text
                and "<integrity>" in text
                and "<delivery>" in text
                and "## Delivery and integrity" not in text
                and "### WebMCP Action Contract" not in text
                and "## Product Requirements" not in text
                and "Baseline Quality Bar" not in text
                and "/opt/webmcp-contracts" not in text
            )
            print(f"{slug}/webmcp_action_contract: {'PASS' if xml_ok else 'FAIL'}")
            if not xml_ok:
                all_errors.setdefault(slug, []).append(
                    "missing/stale inlined WebMCP contract on instruction.md"
                )
            df_path = task_dir / "environment" / "Dockerfile"
            df_text = df_path.read_text() if df_path.exists() else ""
            df_ok = (
                df_path.exists()
                and "/opt/webmcp-contracts" not in df_text
                and "webmcp-contracts" not in df_text
            )
            print(f"{slug}/dockerfile_no_webmcp_pkg: {'PASS' if df_ok else 'FAIL'}")
            if not df_ok:
                all_errors.setdefault(slug, []).append(
                    "Dockerfile still references webmcp-contracts /opt path"
                )
            if (task_dir / "environment" / "webmcp-contracts").exists():
                all_errors.setdefault(slug, []).append(
                    "environment/webmcp-contracts tree still present"
                )
                print(f"{slug}/no_vendored_webmcp: FAIL")
            else:
                print(f"{slug}/no_vendored_webmcp: PASS")
            judge_prompt = (task_dir / "tests" / "system_prompt.md").read_text()
            if "Baseline Quality Bar" in judge_prompt:
                all_errors.setdefault(slug, []).append(
                    "judge system_prompt must not include Baseline Quality Bar"
                )
            for dim in CRITERION_MAP.values():
                toml_text = (task_dir / "tests" / dim / f"{dim}.toml").read_text()
                has_sh = 'name = "webmcp"' in toml_text
                has_pw = 'name = "playwright"' in toml_text
                mcp_ok = has_sh and has_pw
                print(f"{slug}/{dim}/mcp: {'PASS' if mcp_ok else 'FAIL'}")
                if not mcp_ok:
                    all_errors.setdefault(slug, []).append(f"{dim} missing webmcp/playwright MCP")
    return all_errors


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    sync_only = "--sync-criteria" in args

    order = ["frontend-workflow-daisyui-admin-dashboard"] + [
        s for s in TASK_SPECS if s != "frontend-workflow-daisyui-admin-dashboard"
    ]
    all_errors: dict[str, list[str]] = {}
    polarity_ok: list[str] = []

    if sync_only:
        # Non-destructive: rewrite judge TOMLs from authoring rubric + checklist.
        print("syncing criteria TOMLs from authoring */rubric.json + verifier_checklist.json ...")
        sync_errors = sync_criteria_from_task_rubrics()
        all_errors.update(sync_errors)
        for slug in order:
            if slug in sync_errors:
                print(f"  {slug}: ERROR {sync_errors[slug]}")
            else:
                polarity_ok.append(slug)
                print(f"  {slug}: ok")
        coverage_errors = _verify_all_tasks(order, check_webmcp=False)
        for slug, errs in coverage_errors.items():
            all_errors.setdefault(slug, []).extend(errs)
        print(f"\nsynced: {len(polarity_ok)}/{len(TASK_SPECS)}")
    else:
        write_canonical_prompts()
        write_assignment_map()
        TASKS.mkdir(exist_ok=True)

        for slug in order:
            print(f"packaging {slug} ...")
            errs = package_task(slug, TASK_SPECS[slug])
            if errs:
                all_errors[slug] = errs
                print(f"  ERROR: {errs}")
            else:
                polarity_ok.append(slug)
                print("  ok")

        coverage_errors = _verify_all_tasks(order, check_webmcp=True)
        for slug, errs in coverage_errors.items():
            all_errors.setdefault(slug, []).extend(errs)
        print(f"\npackaged: {len(polarity_ok)}/{len(TASK_SPECS)}")

    if all_errors:
        print("errors:", json.dumps(all_errors, indent=2))
        return 1
    print("all 23 tasks OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


# Batch 3: authored 2026-07-19 — AI-platform suite, viewer/lab, mercor/programbench-derived,
# factory/queue/pipeline consoles. Bindings live in corpuscheck schemas/webmcp-assignments.json (SoT);
# entries here mirror modules + provenance for packaging.
TASK_SPECS.update({
    "frontend-creative-tools-prompt-workbench": {
        "source": "feature-editor-prompt-workbench PRD",
        "description": "Prompt workbench editor with streaming runs, variants, and library.",
        "modules": ["structured-editor-v1", "command-session-v1", "entity-collection-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Run and streaming response: incremental text streaming, blinking cursor, and auto-follow/jump-to-latest scroll mechanics stay Playwright-observed", "Reasoning disclosure: expand/collapse gesture, chevron rotation, and active-indicator visuals stay Playwright-observed"],
    },
    "frontend-creative-tools-rubric-studio": {
        "source": "mercor-constellation rubric surfaces (debranded)",
        "description": "Rubric authoring studio with version gates, tuning, and preview.",
        "modules": ["structured-editor-v1", "browse-query-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Accordion / Grading-notes height transition and chevron rotation timing stay Playwright-observed", "Tune bar width-easing and aggregate count-up animations stay Playwright-observed"],
    },
    "frontend-data-tracking-calibration-matrix": {
        "source": "mercor-constellation calibration surfaces (debranded)",
        "description": "Model-harness calibration heatmap with variance and fairness triage.",
        "modules": ["browse-query-v1", "entity-collection-v1", "command-session-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Heatmap cell hover tooltips and red-amber-green ramp color reads stay Playwright-observed", "Chart bar hover tooltips, legend toggle grow/shrink animations stay Playwright-observed"],
    },
    "frontend-data-tracking-command-center": {
        "source": "feature-dashboard-command-center PRD",
        "description": "Ops command center with KPIs, agent panel, and live activity feed.",
        "modules": ["browse-query-v1", "entity-collection-v1", "command-session-v1", "form-workflow-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["KPI metrics strip: sparkline point hover tooltip and count-up animation stay Playwright-observed", "Activity feed: auto-follow scroll behavior and jump-to-latest scroll mechanics stay Playwright-observed"],
    },
    "frontend-data-tracking-eval-dashboard": {
        "source": "feature-analytics-eval-dashboard PRD",
        "description": "Prompt-eval suite dashboard with durable runs and score analytics.",
        "modules": ["entity-collection-v1", "command-session-v1", "browse-query-v1", "form-workflow-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Score charts: bar/line hover tooltip and bar-grow animation stay Playwright-observed", "Run execution with visible steps: streaming run log incremental appearance, retry backoff countdown ticking, and step-status fade animations stay Playwright-observed"],
    },
    "frontend-data-tracking-judge-ab-lab": {
        "source": "harbor-score judge A/B workflow (debranded)",
        "description": "Judge-config A/B lab with labeled rescores, flips, and cost analytics.",
        "modules": ["browse-query-v1", "entity-collection-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Scatter/dumbbell chart mark hover and tooltip reads stay Playwright-observed", "Rescore step running/retry animation timing and progress-fill smoothness stay Playwright-observed"],
    },
    "frontend-data-tracking-model-monitor": {
        "source": "feature-monitor-openrouter-monitor PRD (debranded)",
        "description": "Model marketplace monitor with catalog, alerts, and cost tracking.",
        "modules": ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "command-session-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Pie-chart slice hover tooltip stays Playwright-only (computed while hovering)", "Toast slide-in/auto-dismiss timing and event-feed slide-in animations stay Playwright-observed"],
    },
    "frontend-data-tracking-release-diff": {
        "source": "mercor-constellation dataset surfaces (debranded)",
        "description": "Dataset release manager with version diffs, cuts, and rotation.",
        "modules": ["browse-query-v1", "form-workflow-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Cut-step badge crossfade and correlation count-up animation stay Playwright-observed", "Unchanged-disclosure height animation and chevron rotation stay Playwright-observed"],
    },
    "frontend-data-tracking-sourcing-console": {
        "source": "programbench sourcing-engine spec (debranded)",
        "description": "Repository sourcing console with quotas, guards, and build queue.",
        "modules": ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "command-session-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Commit-hash copy control and its clipboard confirmation stay Playwright (clipboard contents are a Playwright responsibility)", "Drag-reorder gesture and the sliding reorder animation are graded via the real drag/keyboard move controls; WebMCP reorder is for setup only"],
    },
    "frontend-planning-execution-kanban": {
        "source": "feature-task-manager-execution-kanban PRD",
        "description": "Execution kanban with drag/keyboard moves and durable card runs.",
        "modules": ["entity-collection-v1", "browse-query-v1", "form-workflow-v1", "command-session-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Card moves ARE state changes and go through entity update(column)/reorder, but drag gesture fidelity \u2014 raised shadow, ghost placeholder, exact drop-position insertion, settle animation \u2014 is graded via real Playwright drags only", "Keyboard move-control operability is graded via real Playwright keyboard interaction; WebMCP entity update only proves state parity"],
    },
    "frontend-productivity-prompt-library": {
        "source": "feature-content-manager-prompt-library PRD",
        "description": "Prompt library manager with versions, sources, and attachments.",
        "modules": ["entity-collection-v1", "browse-query-v1", "form-workflow-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Attachments: attachment badge hover preview and hover-revealed Remove control visibility stay Playwright-observed", "Prompt body as code: clipboard contents verification and copy-confirmation icon swap/toast animation stay Playwright responsibilities"],
    },
    "frontend-productivity-repository-scanner": {
        "source": "feature-document-scanner-repository-scanner PRD",
        "description": "Repository document scanner with durable scan runs and doc index.",
        "modules": ["entity-collection-v1", "command-session-v1", "browse-query-v1", "form-workflow-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Scan runs as durable workflows: progress-bar fill animation and per-second backoff countdown ticking stay Playwright-observed", "Document index: document-row hover preview and findings-disclosure chevron animation stay Playwright-observed"],
    },
    "frontend-workflow-agent-management": {
        "source": "feature-orchestration-agent-management PRD",
        "description": "Agent registry with durable work runs, timelines, and status filters.",
        "modules": ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "command-session-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Backoff countdown ticking and retrying pulse are timed visuals \u2014 Playwright-observed live, never asserted from tool output", "Step-status tick animation, badge color transitions, panel slide-in, and chevron rotation stay Playwright-observed"],
    },
    "frontend-workflow-eval-job-queue": {
        "source": "oddish concept (debranded)",
        "description": "Cloud eval job queue monitor with provider lanes and retries.",
        "modules": ["browse-query-v1", "form-workflow-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Backoff countdown ticking and the failed-to-running flip animation stay Playwright-observed (timing mechanics)", "Live simulation progress advancement of running jobs is timing behavior observed via Playwright"],
    },
    "frontend-workflow-flake-triage": {
        "source": "programbench flake-filter spec (debranded)",
        "description": "Test-determinism triage queue with run matrices and quarantine map.",
        "modules": ["browse-query-v1", "entity-collection-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Re-run form validation mechanics (run-count select required, disabled submit, inline error naming the field) are graded through the real form via Playwright", "Per-run tick-in entrance transitions and progress-indicator smoothness stay Playwright-observed"],
    },
    "frontend-workflow-gate-console": {
        "source": "programbench gate-engine spec (debranded)",
        "description": "Stage-gate acceptance console with certificates and what-if mode.",
        "modules": ["browse-query-v1", "structured-editor-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Gate row evidence height-plus-opacity expand animation and chevron rotation stay Playwright-observed", "What-if/rejection banner slide-in and toast fade timing stay Playwright-observed"],
    },
    "frontend-workflow-leak-review": {
        "source": "programbench decontamination spec (debranded)",
        "description": "Leak review console with similarity evidence, canaries, mutations.",
        "modules": ["browse-query-v1", "form-workflow-v1", "entity-collection-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Threshold slider stays Playwright-driven: the graded behavior is live re-banding and rollup updates during the drag (and arrow-key adjustment); a WebMCP setter would snap state past the graded derivation", "Matched-pair Previous/Next stepping with synced two-pane scrolling is scroll-mechanics, graded via the real controls"],
    },
    "frontend-workflow-research-pipeline-console": {
        "source": "OpenThoughts-Agent concept (debranded)",
        "description": "Research pipeline console chaining datagen, training, and eval.",
        "modules": ["browse-query-v1", "form-workflow-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Live phase progress (tasks-generated counter, loss-curve points, trial-by-trial mean) is simulation timing observed via Playwright", "Backoff countdown ticking and the automatic Pending-to-Running chain flip are timing behaviors observed via Playwright after real setup"],
    },
    "frontend-workflow-submission-qc-queue": {
        "source": "mercor-constellation QC surfaces (debranded)",
        "description": "Submission QC triage queue with gates, tiers, and review actions.",
        "modules": ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "command-session-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Contributor drawer slide-in/out easing stays Playwright-observed", "Gate banner cross-fade and struck-through override animate-in stay Playwright-observed"],
    },
    "frontend-workflow-task-factory": {
        "source": "SWE-gen concept (debranded)",
        "description": "PR-to-eval-task factory dashboard with validation and trial analysis.",
        "modules": ["browse-query-v1", "form-workflow-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Simulated stage advancement, failure-and-retry attempt counts, and resume-from-stage timing are run output observed via Playwright; no session controls exist beyond starting the run through the create form", "Check-card and log-excerpt disclosure expand/collapse mechanics stay Playwright-observed"],
    },
    "frontend-workflow-template-forms": {
        "source": "feature-form-builder-template-forms PRD",
        "description": "Schema-driven prompt technique forms with preview and library.",
        "modules": ["form-workflow-v1", "browse-query-v1", "entity-collection-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Technique selector: sidebar status-chip transition animation and form cross-fade stay Playwright-observed", "Schema-driven forms: attachment badge hover preview/remove reveal and dynamic-row height animations stay Playwright-observed"],
    },
    "frontend-workflow-trajectory-viewer": {
        "source": "ATIF-style viewer concept (debranded)",
        "description": "Agent-trial trajectory viewer with timeline scrub and annotations.",
        "modules": ["browse-query-v1", "command-session-v1", "entity-collection-v1", "form-workflow-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Scrubber continuous-drag updating is a gesture-fidelity criterion \u2014 Playwright-only; session advance covers discrete step state", "Terminal progressive streaming, auto-follow, and jump-to-latest visuals are streaming mechanics observed live via Playwright"],
    },
    "frontend-workflow-verifier-trajectory-viewer": {
        "source": "ATIF-style viewer concept, verifier review (debranded)",
        "description": "Verifier review workbench with verdicts, labels, and adjudication.",
        "modules": ["browse-query-v1", "command-session-v1", "entity-collection-v1", "form-workflow-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Terminal progressive streaming and its streaming-vs-complete affordance are observed live via Playwright", "Linked-highlight easing, smooth scroll-to-step, rollup-bar segment animation, and flips-filter row enter/exit animations are motion criteria \u2014 Playwright-observed; the underlying selection state changes via the bound tools"],
    },
    "frontend-workflow-workflow-builder": {
        "source": "feature-workflow-builder-workflow-builder PRD",
        "description": "Node-graph workflow builder with durable executions and timelines.",
        "modules": ["structured-editor-v1", "command-session-v1", "entity-collection-v1", "browse-query-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
        "mechanics_exclusions": ["Node drag positioning, canvas pan/zoom, and palette drag-to-drop coordinates stay Playwright-driven; editor add creates nodes but drop-position mechanics are gesture-graded", "Edge-handle drag drawing and incompatible-connection toast visuals stay Playwright; editor add(edge) only proves the state command"],
    },
})


# Batch 4: authored 2026-07-19 — advanced platform suite, atlas pipeline, live console.
# Bindings SoT: corpuscheck schemas/webmcp-assignments.json.
TASK_SPECS.update({
    "frontend-creative-tools-annotation-studio": {
        "source": "feature-labeling-annotation-studio PRD",
        "description": "Annotation studio with taxonomy builder, regions, agreement review.",
        "modules": ["entity-collection-v1", "structured-editor-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
    },
    "frontend-creative-tools-prompt-diff": {
        "source": "feature-version-control-prompt-diff PRD",
        "description": "Prompt version control with diffs, three-way merge, blame, and graph.",
        "modules": ["structured-editor-v1", "browse-query-v1", "entity-collection-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
    },
    "frontend-creative-tools-schema-builder": {
        "source": "feature-schema-builder-output-schema PRD",
        "description": "Output schema builder with tree editor, playground, and versions.",
        "modules": ["structured-editor-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
    },
    "frontend-data-tracking-cost-analytics": {
        "source": "feature-analytics-cost-analytics PRD",
        "description": "Cost analytics with budgets, anomalies, what-if repricing, reports.",
        "modules": ["browse-query-v1", "entity-collection-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
    },
    "frontend-data-tracking-dataset-manager": {
        "source": "feature-data-manager-dataset-manager PRD",
        "description": "Dataset manager with import wizard, pivot, splits, and snapshots.",
        "modules": ["entity-collection-v1", "form-workflow-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
    },
    "frontend-productivity-persona-library": {
        "source": "feature-content-manager-persona-library PRD",
        "description": "Persona library with trait matrix, blending, test bench, and packs.",
        "modules": ["browse-query-v1", "entity-collection-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
    },
    "frontend-productivity-semantic-search": {
        "source": "feature-search-semantic-search PRD",
        "description": "Semantic search with feedback re-ranking, clusters, and re-indexing.",
        "modules": ["browse-query-v1", "entity-collection-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
    },
    "frontend-workflow-ab-experiments": {
        "source": "feature-experimentation-ab-testing PRD",
        "description": "A/B experiment studio with variants, stats gating, and decisions.",
        "modules": ["form-workflow-v1", "command-session-v1", "entity-collection-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
    },
    "frontend-workflow-automation-studio": {
        "source": "feature-automation-browser-studio PRD",
        "description": "Browser automation studio with step builder, runs, and versioning.",
        "modules": ["browse-query-v1", "structured-editor-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
    },
    "frontend-workflow-batch-runner": {
        "source": "feature-batch-processor-batch-runner PRD",
        "description": "Durable batch runner with retries, checkpoints, scheduling, reports.",
        "modules": ["browse-query-v1", "form-workflow-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
    },
    "frontend-workflow-live-task-factory": {
        "source": "SWE-gen pipeline, live dual-mode (debranded)",
        "description": "Live PR-to-task factory console with real GitHub/AI integration.",
        "modules": ["entity-collection-v1", "form-workflow-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
    },
    "frontend-workflow-quality-audit-desk": {
        "source": "codebase-atlas quality audit (debranded)",
        "description": "Quality audit desk with checks, rubric verdicts, and audit reports.",
        "modules": ["browse-query-v1", "form-workflow-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
    },
    "frontend-workflow-review-workbench": {
        "source": "codebase-atlas review app (debranded)",
        "description": "Gated bundle review with verdicts, trial audit, and summary export.",
        "modules": ["browse-query-v1", "form-workflow-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
    },
    "frontend-workflow-seed-dataset-studio": {
        "source": "codebase-atlas seed pipeline (debranded)",
        "description": "Dataset factory studio: triage, authoring workbench, gates, exports.",
        "modules": ["structured-editor-v1", "form-workflow-v1", "command-session-v1", "artifact-transfer-v1"],
        "bindings": "see corpuscheck schemas/webmcp-assignments.json",
    },
})
