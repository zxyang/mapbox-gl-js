
var map = new llmr.Map({
    container: document.getElementById('map'),
    sources: {
        "mapbox streets": {
            type: 'vector',
            id: 'mapbox streets',
            urls: ['http://a.gl-api-us-east-1.tilestream.net/v3/mapbox.mapbox-streets-v4/{z}/{x}/{y}.gl.pbf'],
            // urls: ['http://api.tiles.mapbox.com/v3/mapbox.mapbox-streets-v4/{z}/{x}/{y}.vector.pbf'],
            zooms: [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 13, 14],
        },
        "satellite": {
            type: 'raster',
            id: 'satellite',
            urls: ['http://api.tiles.mapbox.com/v3/aibram.map-vlob92uz/{z}/{x}/{y}.png'],
            zooms: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],
        }
    },
    maxZoom: 20,
    zoom: 15,
    lat: 38.912753,
    lon: -77.032194,
    rotation: 0,
    style: style_json,
    hash: true
});

    var current = {};
document.body.onmousemove = function(e) {

    map.featuresAt(e.clientX, e.clientY, {
        geometry: true,
        radius: 1
    }, function(err, features) {
        features = features.filter(function(f) {
            return f._bucket === 'building';
        });
        var newf = {};
        features.forEach(function(f) {
            if (!current[f.id]) {
                map.sources['mapbox streets'].removeFeature(f, 'building');
                map.sources['mapbox streets'].addFeature(f, 'building_highlight');
            }
            current[f.id] = f;
            newf[f.id] = true;
        });
        for (var f in current) {
            if (!newf[f]) {
                map.sources['mapbox streets'].removeFeature(current[f], 'building_highlight');
                map.sources['mapbox streets'].addFeature(current[f], current[f]._bucket);
                delete current[f];
            }
        }
        map.update();
    });

};

// add geojson overlay
var geojson = new llmr.GeoJSONSource({ type: 'Feature', properties: {}, geometry: route.routes[0].geometry});
map.addSource('geojson', geojson);
