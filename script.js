<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-omnivore@0.3.4/leaflet-omnivore.min.js"></script>

<script>
  const map = L.map('map').setView([15.9, 79.7], 7); // Andhra Pradesh center

  // Esri Satellite layer (Google-like)
  const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/' +
    'World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri'
  }).addTo(map);

  // APSAC Cadastral WMS Layer
  const cadastralLayer = L.tileLayer.wms("https://apsac.ap.gov.in/geoserver/ows?service=WMS&request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=forest%3Acadastral_boundary", {
    layers: 'ap_cadastral:cadastral',
    format: 'image/png',
    transparent: true,
    attribution: '© APSAC Cadastral Layer'
  });

  // Live tracking
  let userMarker;
  function trackLocation() {
    navigator.geolocation.watchPosition(pos => {
      const latlng = [pos.coords.latitude, pos.coords.longitude];
      map.setView(latlng, 17);
      if (!userMarker) {
        userMarker = L.marker(latlng).addTo(map).bindPopup("You are here").openPopup();
      } else {
        userMarker.setLatLng(latlng);
      }
      localStorage.setItem("lastLocation", JSON.stringify(latlng));
    }, err => {
      alert("Location error: " + err.message);
    }, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 5000
    });
  }

  // Load last location if available
  const lastLoc = localStorage.getItem("lastLocation");
  if (lastLoc) {
    const latlng = JSON.parse(lastLoc);
    L.marker(latlng).addTo(map).bindPopup("Last location").openPopup();
  }

  // KML Upload
  document.getElementById('kmlUpload').addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const kmlLayer = omnivore.kml.parse(e.target.result);
      kmlLayer.on('ready', function () {
        map.fitBounds(kmlLayer.getBounds());
      });
      kmlLayer.addTo(map);
      localStorage.setItem("lastKML", e.target.result);
    };
    reader.readAsText(file);
  });

  // Create a storage object for KML layers
const kmlLayers = {};

document.getElementById('kmlUpload').addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = function (e) {
        const layerName = file.name.replace('.kml', ''); // Name based on file
        const kmlLayer = omnivore.kml.parse(e.target.result);

        kmlLayer.on('ready', function () {
            map.fitBounds(kmlLayer.getBounds()); // Adjust view to layer bounds
        });

        kmlLayer.addTo(map);
        kmlLayers[layerName] = kmlLayer; // Store layer dynamically

        // Update control layers dynamically
        controlLayers.addOverlay(kmlLayer, layerName);
    };

    reader.readAsText(file);
});

// Initialize Layer Control
const baseMaps = { "Satellite": satellite };
const overlayMaps = { "AP Cadastral Layer": cadastralLayer };
const controlLayers = L.control.layers(baseMaps, overlayMaps).addTo(map);

// Custom Zoom to All Button
L.Control.ZoomToAll = L.Control.extend({
    onAdd: function(map) {
        const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom');
        btn.innerText = "🔍 Zoom All";
        btn.title = "Zoom to all features";
        btn.style.padding = "5px";
        btn.style.fontSize = "14px";
        btn.style.cursor = "pointer";
        btn.onclick = function () {
            let bounds = map.getBounds();
            Object.values(kmlLayers).forEach(layer => {
                bounds = bounds.extend(layer.getBounds());
            });
            map.fitBounds(bounds);
        };
        return btn;
    }
});
L.control.zoomToAll = function(opts) {
    return new L.Control.ZoomToAll(opts);
};
L.control.zoomToAll({ position: 'bottomright' }).addTo(map);

// Locate Me Button
L.Control.LocateMe = L.Control.extend({
    onAdd: function(map) {
        const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom');
        btn.innerText = "📍 Locate Me";
        btn.title = "Find your location";
        btn.style.padding = "5px";
        btn.style.fontSize = "14px";
        btn.style.cursor = "pointer";
        btn.onclick = function () {
            navigator.geolocation.getCurrentPosition(pos => {
                const latlng = [pos.coords.latitude, pos.coords.longitude];
                map.setView(latlng, 17);
                if (!userMarker) {
                    userMarker = L.marker(latlng).addTo(map).bindPopup("You are here").openPopup();
                } else {
                    userMarker.setLatLng(latlng);
                }
            }, err => {
                alert("Location error: " + err.message);
            }, { enableHighAccuracy: true, timeout: 5000 });
        };
        return btn;
    }
});
L.control.locateMe = function(opts) {
    return new L.Control.LocateMe(opts);
};
L.control.locateMe({ position: 'bottomright' }).addTo(map);

  // Start tracking
  trackLocation();
  
  // Ask for Location Permission on Page Load
window.onload = function() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const latlng = [pos.coords.latitude, pos.coords.longitude];
                map.setView(latlng, 17);
                userMarker = L.marker(latlng).addTo(map).bindPopup("You are here").openPopup();
            },
            err => {
                alert("Location permission denied or unavailable: " + err.message);
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
};


</script>
