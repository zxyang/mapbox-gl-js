var style = {
  "version": "1",
  "buckets": {
    "country_label": {
      "filter": {"source": "outdoors", "layer": "country_label", "feature_type": "point"},
      "text": true,
      "min-zoom": 3,
      "text-field": "name",
      "text-max-size": 13,
      "text-path": "horizontal"
    },
    "marine_label_point": {
      "filter": {"source": "outdoors", "layer": "marine_label", "feature_type": "point"},
      "text": true,
      "text-field": "name",
      "text-max-size": 16,
      "text-path": "curve"
    },
    "marine_label_line": {
      "filter": {"source": "outdoors", "layer": "marine_label", "feature_type": "line"},
      "text": true,
      "text-field": "name",
      "text-max-size": 16,
      "text-path": "curve"
    },
    "state_label": {
      "filter": {"source": "outdoors", "layer": "state_label", "feature_type": "point"},
      "text": true,
      "min-zoom": 4,
      "text-field": "name",
      "text-max-size": 16,
      "text-path": "horizontal"
    },
    "place_label_city_point": {
      "filter": {"source": "outdoors", "layer": "place_label", "type": "city"},
      "point": true
    },
    "place_label_city": {
      "filter": {"source": "outdoors", "layer": "place_label", "type": "city", "feature_type": "point"},
      "text": true,
      "text-field": "name",
      "text-max-size": 20,
      "text-path": "horizontal"
    },
    "place_label_town": {
      "filter": {"source": "outdoors", "layer": "place_label", "type": "town", "feature_type": "point"},
      "text": true,
      "text-field": "name",
      "text-max-size": 24,
      "text-path": "horizontal"
    },
    "place_label_village": {
      "filter": {
        "source": "outdoors",
        "layer": "place_label",
        "type": "village",
        "feature_type": "point"
      },
      "text": true,
      "text-field": "name",
      "text-max-size": 22,
      "text-path": "horizontal"
    },
    "place_label_other": {
      "filter": {
        "source": "outdoors",
        "layer": "place_label",
        "type": ["hamlet", "suburb", "neighbourhood"],
        "feature_type": "point"
      },
      "text": true,
      "text-field": "name",
      "text-max-size": 14,
      "text-path": "horizontal"
    },
    "poi_label_1": {
      "filter": {
        "source": "outdoors",
        "layer": "poi_label",
        "scalerank": [1, 2],
        "feature_type": "point"
      },
      "text": true,
      "text-field": "name",
      "text-max-size": 12,
      "text-path": "horizontal",
      "text-padding": 2,
      "text-always-visible": true
    },
    "road_label": {
      "filter": {"source": "outdoors", "layer": "road_label", "feature_type": "line"},
      "text": true,
      "text-field": "name",
      "text-max-size": 13,
      "text-path": "curve",
      "text-padding": 2,
      "text-max-angle": 0.5
    },
    "contour_label": {
      "filter": {"source": "outdoors", "layer": "contour", "index": 10, "feature_type": "line"},
      "text": true,
      "text-field": "ele",
      "text-max-size": 10,
      "text-path": "curve"
    },
    "water_label": {
      "filter": {"source": "outdoors", "layer": "water_label", "feature_type": "point"},
      "text": true,
      "text-field": "name",
      "text-max-size": 12,
      "text-path": "horizontal"
    },
    "waterway_label": {
      "filter": {"source": "outdoors", "layer": "waterway_label", "feature_type": "line"},
      "text": true,
      "text-field": "name",
      "text-max-size": 12,
      "text-path": "curve",
      "text-min-dist": 10
    },
    "poi_airport": {
      "filter": {"source": "outdoors", "layer": "poi_label", "maki": "airport"},
      "point": true,
      "point-size": [12, 12]
    },
    "poi_rail": {
      "filter": {"source": "outdoors", "layer": "poi_label", "maki": "rail"},
      "point": true,
      "point-size": [12, 12]
    },
    "poi_golf": {
      "filter": {"source": "outdoors", "layer": "poi_label", "maki": "golf"},
      "point": true,
      "point-size": [12, 12],
      "text": true,
      "text-always-visible": true
    },
    "poi_park": {
      "filter": {"source": "outdoors", "layer": "poi_label", "maki": "park"},
      "point": true,
      "point-size": [12, 12],
      "text": true,
      "text-always-visible": true
    },
    "poi_hospital": {
      "filter": {"source": "outdoors", "layer": "poi_label", "maki": "hospital"},
      "point": true,
      "point-size": [12, 12],
      "text": true,
      "text-always-visible": true
    },
    "poi_college": {
      "filter": {"source": "outdoors", "layer": "poi_label", "maki": "college"},
      "point": true,
      "point-size": [12, 12],
      "text": true,
      "text-always-visible": true
    }
  }
}
