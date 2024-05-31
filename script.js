// Inicializa el mapa y establece su vista inicial
var map = L.map('map').setView([51.505, -0.09], 13);

// Capas de Mapas
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var esriLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// Añadir la capa de OpenStreetMap por defecto
osmLayer.addTo(map);

// Añadir control de geocodificación
L.Control.geocoder().addTo(map);

// Añadir leyenda dinámica
var legend = document.getElementById('legend');

function updateLegend(content) {
    legend.innerHTML = content;
}

// Cargar y visualizar GeoJSON de calidad del aire
var geojsonLayer;
fetch('air_quality_data.geojson')
    .then(response => response.json())
    .then(data => {
        geojsonLayer = L.geoJSON(data, {
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.name) {
                    layer.bindPopup(`
                        <b>${feature.properties.name}</b><br>
                        AQI: ${feature.properties.aqi}<br>
                        PM10: ${feature.properties.pm10} µg/m³<br>
                        PM2.5: ${feature.properties.pm2_5} µg/m³<br>
                        O3: ${feature.properties.o3} µg/m³<br>
                        <canvas id="chart-${feature.properties.name}" width="200" height="200"></canvas>
                    `);
                    layer.on('popupopen', function () {
                        var ctx = document.getElementById(`chart-${feature.properties.name}`).getContext('2d');
                        new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: ['PM10', 'PM2.5', 'O3'],
                                datasets: [{
                                    label: 'µg/m³',
                                    data: [feature.properties.pm10, feature.properties.pm2_5, feature.properties.o3],
                                    backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(75, 192, 192, 0.2)'],
                                    borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)'],
                                    borderWidth: 1
                                }]
                            },
                            options: {
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                },
                                animation: {
                                    duration: 2000,
                                    easing: 'easeInOutBounce'
                                }
                            }
                        });
                    });
                }
            }
        }).addTo(map);
    });

// Filtrar datos por fecha
document.getElementById('filter-btn').addEventListener('click', function() {
    var startDate = new Date(document.getElementById('start-date').value);
    var endDate = new Date(document.getElementById('end-date').value);

    geojsonLayer.clearLayers();

    fetch('air_quality_data.geojson')
        .then(response => response.json())
        .then(data => {
            var filteredFeatures = data.features.filter(function(feature) {
                var featureDate = new Date(feature.properties.date);
                return featureDate >= startDate && featureDate <= endDate;
            });

            geojsonLayer.addData(filteredFeatures);
        });
});

// Ejemplo de datos para heatmap
var heatData = [
    [51.505, -0.09, 0.2],
    [51.515, -0.1, 0.5],
    [51.52, -0.12, 0.8]
];

// Añadir la capa de calor
var heat = L.heatLayer(heatData, {radius: 25}).addTo(map);

// Cambiar Capas
document.getElementById('map-layer').addEventListener('change', function(e) {
    var layer = e.target.value;
    if (layer === 'osm') {
        map.removeLayer(esriLayer);
        map.addLayer(osmLayer);
    } else if (layer === 'esri') {
        map.removeLayer(osmLayer);
        map.addLayer(esriLayer);
    }
});
