import type { Sherd, Edge, Candidate } from "./types";

export const FIXTURE_SHERDS: Record<string, Sherd> = {
  "SH-01": {
    "id": "SH-01",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-01a",
      "E-01b",
      "E-01c",
      "E-01d"
    ],
    "zones": [
      "zone-1"
    ],
    "transform": {
      "txMm": 100,
      "tyMm": 0,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-01"
  },
  "SH-02": {
    "id": "SH-02",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-02a",
      "E-02b",
      "E-02c",
      "E-02d"
    ],
    "zones": [
      "zone-2"
    ],
    "transform": {
      "txMm": 200,
      "tyMm": 0,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-02"
  },
  "SH-03": {
    "id": "SH-03",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-03a",
      "E-03b",
      "E-03c",
      "E-03d"
    ],
    "zones": [
      "zone-3"
    ],
    "transform": {
      "txMm": 300,
      "tyMm": 0,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-03"
  },
  "SH-04": {
    "id": "SH-04",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-04a",
      "E-04b",
      "E-04c",
      "E-04d"
    ],
    "zones": [
      "zone-4"
    ],
    "transform": {
      "txMm": 400,
      "tyMm": 0,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-04"
  },
  "SH-05": {
    "id": "SH-05",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-05a",
      "E-05b",
      "E-05c",
      "E-05d"
    ],
    "zones": [
      "zone-5"
    ],
    "transform": {
      "txMm": 500,
      "tyMm": 0,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-05"
  },
  "SH-06": {
    "id": "SH-06",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-06a",
      "E-06b",
      "E-06c",
      "E-06d"
    ],
    "zones": [
      "zone-6"
    ],
    "transform": {
      "txMm": 600,
      "tyMm": 0,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-06"
  },
  "SH-07": {
    "id": "SH-07",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-07a",
      "E-07b",
      "E-07c",
      "E-07d"
    ],
    "zones": [
      "zone-7"
    ],
    "transform": {
      "txMm": 0,
      "tyMm": 100,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-07"
  },
  "SH-08": {
    "id": "SH-08",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-08a",
      "E-08b",
      "E-08c",
      "E-08d"
    ],
    "zones": [
      "zone-8"
    ],
    "transform": {
      "txMm": 100,
      "tyMm": 100,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-08"
  },
  "SH-09": {
    "id": "SH-09",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-09a",
      "E-09b",
      "E-09c",
      "E-09d"
    ],
    "zones": [
      "zone-9"
    ],
    "transform": {
      "txMm": 200,
      "tyMm": 100,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-09"
  },
  "SH-10": {
    "id": "SH-10",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-10a",
      "E-10b",
      "E-10c",
      "E-10d"
    ],
    "zones": [
      "zone-10"
    ],
    "transform": {
      "txMm": 300,
      "tyMm": 100,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-10"
  },
  "SH-11": {
    "id": "SH-11",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-11a",
      "E-11b",
      "E-11c",
      "E-11d"
    ],
    "zones": [
      "zone-11"
    ],
    "transform": {
      "txMm": 400,
      "tyMm": 100,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-11"
  },
  "SH-12": {
    "id": "SH-12",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-12a",
      "E-12b",
      "E-12c",
      "E-12d"
    ],
    "zones": [
      "zone-12"
    ],
    "transform": {
      "txMm": 500,
      "tyMm": 100,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-12"
  },
  "SH-13": {
    "id": "SH-13",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-13a",
      "E-13b",
      "E-13c",
      "E-13d"
    ],
    "zones": [
      "zone-13"
    ],
    "transform": {
      "txMm": 600,
      "tyMm": 100,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-13"
  },
  "SH-14": {
    "id": "SH-14",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-14a",
      "E-14b",
      "E-14c",
      "E-14d"
    ],
    "zones": [
      "zone-14"
    ],
    "transform": {
      "txMm": 0,
      "tyMm": 200,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-14"
  },
  "SH-15": {
    "id": "SH-15",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-15a",
      "E-15b",
      "E-15c",
      "E-15d"
    ],
    "zones": [
      "zone-15"
    ],
    "transform": {
      "txMm": 100,
      "tyMm": 200,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-15"
  },
  "SH-16": {
    "id": "SH-16",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-16a",
      "E-16b",
      "E-16c",
      "E-16d"
    ],
    "zones": [
      "zone-16"
    ],
    "transform": {
      "txMm": 200,
      "tyMm": 200,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-16"
  },
  "SH-17": {
    "id": "SH-17",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-17a",
      "E-17b",
      "E-17c",
      "E-17d"
    ],
    "zones": [
      "zone-17"
    ],
    "transform": {
      "txMm": 300,
      "tyMm": 200,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-17"
  },
  "SH-18": {
    "id": "SH-18",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-18a",
      "E-18b",
      "E-18c",
      "E-18d"
    ],
    "zones": [
      "zone-18"
    ],
    "transform": {
      "txMm": 400,
      "tyMm": 200,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-18"
  },
  "SH-19": {
    "id": "SH-19",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-19a",
      "E-19b",
      "E-19c",
      "E-19d"
    ],
    "zones": [
      "zone-19"
    ],
    "transform": {
      "txMm": 500,
      "tyMm": 200,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-19"
  },
  "SH-20": {
    "id": "SH-20",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-20a",
      "E-20b",
      "E-20c",
      "E-20d"
    ],
    "zones": [
      "zone-20"
    ],
    "transform": {
      "txMm": 600,
      "tyMm": 200,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-20"
  },
  "SH-21": {
    "id": "SH-21",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-21a",
      "E-21b",
      "E-21c",
      "E-21d"
    ],
    "zones": [
      "zone-21"
    ],
    "transform": {
      "txMm": 0,
      "tyMm": 300,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-21"
  },
  "SH-22": {
    "id": "SH-22",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-22a",
      "E-22b",
      "E-22c",
      "E-22d"
    ],
    "zones": [
      "zone-22"
    ],
    "transform": {
      "txMm": 100,
      "tyMm": 300,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-22"
  },
  "SH-23": {
    "id": "SH-23",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-23a",
      "E-23b",
      "E-23c",
      "E-23d"
    ],
    "zones": [
      "zone-23"
    ],
    "transform": {
      "txMm": 200,
      "tyMm": 300,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-23"
  },
  "SH-24": {
    "id": "SH-24",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-24a",
      "E-24b",
      "E-24c",
      "E-24d"
    ],
    "zones": [
      "zone-24"
    ],
    "transform": {
      "txMm": 300,
      "tyMm": 300,
      "rotationDeg": 0
    },
    "rimClass": "none",
    "scanHash": "hash-24"
  },
  "SH-25": {
    "id": "SH-25",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-25a",
      "E-25b",
      "E-25c",
      "E-25d"
    ],
    "zones": [
      "zone-25"
    ],
    "transform": {
      "txMm": 400,
      "tyMm": 300,
      "rotationDeg": 0
    },
    "rimClass": "rim",
    "scanHash": "hash-25"
  },
  "SH-26": {
    "id": "SH-26",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-26a",
      "E-26b",
      "E-26c",
      "E-26d"
    ],
    "zones": [
      "zone-26"
    ],
    "transform": {
      "txMm": 500,
      "tyMm": 300,
      "rotationDeg": 0
    },
    "rimClass": "rim",
    "scanHash": "hash-26"
  },
  "SH-27": {
    "id": "SH-27",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-27a",
      "E-27b",
      "E-27c",
      "E-27d"
    ],
    "zones": [
      "zone-27"
    ],
    "transform": {
      "txMm": 600,
      "tyMm": 300,
      "rotationDeg": 0
    },
    "rimClass": "rim",
    "scanHash": "hash-27"
  },
  "SH-28": {
    "id": "SH-28",
    "localPolygon": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "edges": [
      "E-28a",
      "E-28b",
      "E-28c",
      "E-28d"
    ],
    "zones": [
      "zone-28"
    ],
    "transform": {
      "txMm": 0,
      "tyMm": 400,
      "rotationDeg": 0
    },
    "rimClass": "rim",
    "scanHash": "hash-28"
  }
};
export const FIXTURE_EDGES: Record<string, Edge> = {
  "E-01a": {
    "id": "E-01a",
    "sherdId": "SH-01",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-01b": {
    "id": "E-01b",
    "sherdId": "SH-01",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-01c": {
    "id": "E-01c",
    "sherdId": "SH-01",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-01d": {
    "id": "E-01d",
    "sherdId": "SH-01",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-02a": {
    "id": "E-02a",
    "sherdId": "SH-02",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-02b": {
    "id": "E-02b",
    "sherdId": "SH-02",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-02c": {
    "id": "E-02c",
    "sherdId": "SH-02",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-02d": {
    "id": "E-02d",
    "sherdId": "SH-02",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-03a": {
    "id": "E-03a",
    "sherdId": "SH-03",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-03b": {
    "id": "E-03b",
    "sherdId": "SH-03",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-03c": {
    "id": "E-03c",
    "sherdId": "SH-03",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-03d": {
    "id": "E-03d",
    "sherdId": "SH-03",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-04a": {
    "id": "E-04a",
    "sherdId": "SH-04",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-04b": {
    "id": "E-04b",
    "sherdId": "SH-04",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-04c": {
    "id": "E-04c",
    "sherdId": "SH-04",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-04d": {
    "id": "E-04d",
    "sherdId": "SH-04",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-05a": {
    "id": "E-05a",
    "sherdId": "SH-05",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-05b": {
    "id": "E-05b",
    "sherdId": "SH-05",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-05c": {
    "id": "E-05c",
    "sherdId": "SH-05",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-05d": {
    "id": "E-05d",
    "sherdId": "SH-05",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-06a": {
    "id": "E-06a",
    "sherdId": "SH-06",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-06b": {
    "id": "E-06b",
    "sherdId": "SH-06",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-06c": {
    "id": "E-06c",
    "sherdId": "SH-06",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-06d": {
    "id": "E-06d",
    "sherdId": "SH-06",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-07a": {
    "id": "E-07a",
    "sherdId": "SH-07",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-07b": {
    "id": "E-07b",
    "sherdId": "SH-07",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-07c": {
    "id": "E-07c",
    "sherdId": "SH-07",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-07d": {
    "id": "E-07d",
    "sherdId": "SH-07",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-08a": {
    "id": "E-08a",
    "sherdId": "SH-08",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-08b": {
    "id": "E-08b",
    "sherdId": "SH-08",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-08c": {
    "id": "E-08c",
    "sherdId": "SH-08",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-08d": {
    "id": "E-08d",
    "sherdId": "SH-08",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-09a": {
    "id": "E-09a",
    "sherdId": "SH-09",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-09b": {
    "id": "E-09b",
    "sherdId": "SH-09",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-09c": {
    "id": "E-09c",
    "sherdId": "SH-09",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-09d": {
    "id": "E-09d",
    "sherdId": "SH-09",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-10a": {
    "id": "E-10a",
    "sherdId": "SH-10",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-10b": {
    "id": "E-10b",
    "sherdId": "SH-10",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-10c": {
    "id": "E-10c",
    "sherdId": "SH-10",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-10d": {
    "id": "E-10d",
    "sherdId": "SH-10",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-11a": {
    "id": "E-11a",
    "sherdId": "SH-11",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-11b": {
    "id": "E-11b",
    "sherdId": "SH-11",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-11c": {
    "id": "E-11c",
    "sherdId": "SH-11",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-11d": {
    "id": "E-11d",
    "sherdId": "SH-11",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-12a": {
    "id": "E-12a",
    "sherdId": "SH-12",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-12b": {
    "id": "E-12b",
    "sherdId": "SH-12",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-12c": {
    "id": "E-12c",
    "sherdId": "SH-12",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-12d": {
    "id": "E-12d",
    "sherdId": "SH-12",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-13a": {
    "id": "E-13a",
    "sherdId": "SH-13",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-13b": {
    "id": "E-13b",
    "sherdId": "SH-13",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-13c": {
    "id": "E-13c",
    "sherdId": "SH-13",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-13d": {
    "id": "E-13d",
    "sherdId": "SH-13",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-14a": {
    "id": "E-14a",
    "sherdId": "SH-14",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-14b": {
    "id": "E-14b",
    "sherdId": "SH-14",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-14c": {
    "id": "E-14c",
    "sherdId": "SH-14",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-14d": {
    "id": "E-14d",
    "sherdId": "SH-14",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-15a": {
    "id": "E-15a",
    "sherdId": "SH-15",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-15b": {
    "id": "E-15b",
    "sherdId": "SH-15",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-15c": {
    "id": "E-15c",
    "sherdId": "SH-15",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-15d": {
    "id": "E-15d",
    "sherdId": "SH-15",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-16a": {
    "id": "E-16a",
    "sherdId": "SH-16",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-16b": {
    "id": "E-16b",
    "sherdId": "SH-16",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-16c": {
    "id": "E-16c",
    "sherdId": "SH-16",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-16d": {
    "id": "E-16d",
    "sherdId": "SH-16",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-17a": {
    "id": "E-17a",
    "sherdId": "SH-17",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-17b": {
    "id": "E-17b",
    "sherdId": "SH-17",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-17c": {
    "id": "E-17c",
    "sherdId": "SH-17",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-17d": {
    "id": "E-17d",
    "sherdId": "SH-17",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-18a": {
    "id": "E-18a",
    "sherdId": "SH-18",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-18b": {
    "id": "E-18b",
    "sherdId": "SH-18",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-18c": {
    "id": "E-18c",
    "sherdId": "SH-18",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-18d": {
    "id": "E-18d",
    "sherdId": "SH-18",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-19a": {
    "id": "E-19a",
    "sherdId": "SH-19",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-19b": {
    "id": "E-19b",
    "sherdId": "SH-19",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-19c": {
    "id": "E-19c",
    "sherdId": "SH-19",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-19d": {
    "id": "E-19d",
    "sherdId": "SH-19",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-20a": {
    "id": "E-20a",
    "sherdId": "SH-20",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-20b": {
    "id": "E-20b",
    "sherdId": "SH-20",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-20c": {
    "id": "E-20c",
    "sherdId": "SH-20",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-20d": {
    "id": "E-20d",
    "sherdId": "SH-20",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-21a": {
    "id": "E-21a",
    "sherdId": "SH-21",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-21b": {
    "id": "E-21b",
    "sherdId": "SH-21",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-21c": {
    "id": "E-21c",
    "sherdId": "SH-21",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-21d": {
    "id": "E-21d",
    "sherdId": "SH-21",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-22a": {
    "id": "E-22a",
    "sherdId": "SH-22",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-22b": {
    "id": "E-22b",
    "sherdId": "SH-22",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-22c": {
    "id": "E-22c",
    "sherdId": "SH-22",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-22d": {
    "id": "E-22d",
    "sherdId": "SH-22",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-23a": {
    "id": "E-23a",
    "sherdId": "SH-23",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-23b": {
    "id": "E-23b",
    "sherdId": "SH-23",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-23c": {
    "id": "E-23c",
    "sherdId": "SH-23",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-23d": {
    "id": "E-23d",
    "sherdId": "SH-23",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-24a": {
    "id": "E-24a",
    "sherdId": "SH-24",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-24b": {
    "id": "E-24b",
    "sherdId": "SH-24",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-24c": {
    "id": "E-24c",
    "sherdId": "SH-24",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-24d": {
    "id": "E-24d",
    "sherdId": "SH-24",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-25a": {
    "id": "E-25a",
    "sherdId": "SH-25",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-25b": {
    "id": "E-25b",
    "sherdId": "SH-25",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-25c": {
    "id": "E-25c",
    "sherdId": "SH-25",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-25d": {
    "id": "E-25d",
    "sherdId": "SH-25",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-26a": {
    "id": "E-26a",
    "sherdId": "SH-26",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-26b": {
    "id": "E-26b",
    "sherdId": "SH-26",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-26c": {
    "id": "E-26c",
    "sherdId": "SH-26",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-26d": {
    "id": "E-26d",
    "sherdId": "SH-26",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-27a": {
    "id": "E-27a",
    "sherdId": "SH-27",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-27b": {
    "id": "E-27b",
    "sherdId": "SH-27",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-27c": {
    "id": "E-27c",
    "sherdId": "SH-27",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-27d": {
    "id": "E-27d",
    "sherdId": "SH-27",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  },
  "E-28a": {
    "id": "E-28a",
    "sherdId": "SH-28",
    "localPolyline": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 50,
        "y": 0
      }
    ],
    "startIndex": 0,
    "endIndex": 1,
    "edgeClass": "fracture"
  },
  "E-28b": {
    "id": "E-28b",
    "sherdId": "SH-28",
    "localPolyline": [
      {
        "x": 50,
        "y": 0
      },
      {
        "x": 50,
        "y": 50
      }
    ],
    "startIndex": 1,
    "endIndex": 2,
    "edgeClass": "fracture"
  },
  "E-28c": {
    "id": "E-28c",
    "sherdId": "SH-28",
    "localPolyline": [
      {
        "x": 50,
        "y": 50
      },
      {
        "x": 0,
        "y": 50
      }
    ],
    "startIndex": 2,
    "endIndex": 3,
    "edgeClass": "fracture"
  },
  "E-28d": {
    "id": "E-28d",
    "sherdId": "SH-28",
    "localPolyline": [
      {
        "x": 0,
        "y": 50
      },
      {
        "x": 0,
        "y": 0
      }
    ],
    "startIndex": 3,
    "endIndex": 0,
    "edgeClass": "fracture"
  }
};
export const FIXTURE_CANDIDATES: Record<string, Candidate> = {
  "C-01": {
    "id": "C-01",
    "edgeAId": "E-01b",
    "edgeBId": "E-02d",
    "status": "unreviewed",
    "confidence": "tentative",
    "metrics": {
      "endpointResidualMm": 0,
      "meanResidualMm": 0,
      "tangentMismatchDeg": 0,
      "lengthRatio": 1
    },
    "rationale": "",
    "noteIds": [],
    "revisionId": "rev-initial"
  },
  "C-02": {
    "id": "C-02",
    "edgeAId": "E-02b",
    "edgeBId": "E-03d",
    "status": "unreviewed",
    "confidence": "tentative",
    "metrics": {
      "endpointResidualMm": 0,
      "meanResidualMm": 0,
      "tangentMismatchDeg": 0,
      "lengthRatio": 1
    },
    "rationale": "",
    "noteIds": [],
    "revisionId": "rev-initial"
  },
  "C-03": {
    "id": "C-03",
    "edgeAId": "E-03b",
    "edgeBId": "E-04d",
    "status": "unreviewed",
    "confidence": "tentative",
    "metrics": {
      "endpointResidualMm": 0,
      "meanResidualMm": 0,
      "tangentMismatchDeg": 0,
      "lengthRatio": 1
    },
    "rationale": "",
    "noteIds": [],
    "revisionId": "rev-initial"
  },
  "C-04": {
    "id": "C-04",
    "edgeAId": "E-04b",
    "edgeBId": "E-05d",
    "status": "unreviewed",
    "confidence": "tentative",
    "metrics": {
      "endpointResidualMm": 0,
      "meanResidualMm": 0,
      "tangentMismatchDeg": 0,
      "lengthRatio": 1
    },
    "rationale": "",
    "noteIds": [],
    "revisionId": "rev-initial"
  },
  "C-05": {
    "id": "C-05",
    "edgeAId": "E-05b",
    "edgeBId": "E-06d",
    "status": "unreviewed",
    "confidence": "tentative",
    "metrics": {
      "endpointResidualMm": 0,
      "meanResidualMm": 0,
      "tangentMismatchDeg": 0,
      "lengthRatio": 1
    },
    "rationale": "",
    "noteIds": [],
    "revisionId": "rev-initial"
  },
  "C-06": {
    "id": "C-06",
    "edgeAId": "E-06b",
    "edgeBId": "E-07d",
    "status": "unreviewed",
    "confidence": "tentative",
    "metrics": {
      "endpointResidualMm": 0,
      "meanResidualMm": 0,
      "tangentMismatchDeg": 0,
      "lengthRatio": 1
    },
    "rationale": "",
    "noteIds": [],
    "revisionId": "rev-initial"
  },
  "C-07": {
    "id": "C-07",
    "edgeAId": "E-07b",
    "edgeBId": "E-08d",
    "status": "unreviewed",
    "confidence": "tentative",
    "metrics": {
      "endpointResidualMm": 0,
      "meanResidualMm": 0,
      "tangentMismatchDeg": 0,
      "lengthRatio": 1
    },
    "rationale": "",
    "noteIds": [],
    "revisionId": "rev-initial"
  },
  "C-08": {
    "id": "C-08",
    "edgeAId": "E-08b",
    "edgeBId": "E-09d",
    "status": "unreviewed",
    "confidence": "tentative",
    "metrics": {
      "endpointResidualMm": 0,
      "meanResidualMm": 0,
      "tangentMismatchDeg": 0,
      "lengthRatio": 1
    },
    "rationale": "",
    "noteIds": [],
    "revisionId": "rev-initial"
  }
};
