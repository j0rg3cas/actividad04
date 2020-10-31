// ************************ APP STATE ******************
//CONSTANTS
const TILE_LAYER = "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const URL = "http://localhost:3001";

const BOUNDS = new L.LatLngBounds(
  new L.LatLng(3.347563, -76.777372),
  new L.LatLng(3.520973, -76.436782)
);
const VISCOSITY = 1;
const MAX_ZOOM_MAP = 18;
const INITIAL_ZOOM = 12;
const MAP_OPTIONS = {
  zoom: INITIAL_ZOOM,
  center: BOUNDS.getCenter(),
  minZoom: INITIAL_ZOOM,
  maxZoom: MAX_ZOOM_MAP,
  maxBounds: BOUNDS,
  maxBoundsViscosity: VISCOSITY
};
//VARIABLES
let mMap = null;
let categories = {
  visible: [],
  priorities: {}
};
let overlaysObj = {};
let baseLayer = null;
let autoCompleteData = [];
let destinoLocation = null;
let userLocation = null;
let bufferRange = null;
let paradas = null;
let viajes = null;
let markerDestino = null;
let rutaParada = null;
let rutaDestino = null;
let destinoJson = null;
let mParadaId = null;
let mCalificacion = null;
let mObservaciones = null;
let currentUser = null;
let currentViaje = null;
// ************************ END APP STATE ******************

// ************************ MAIN ******************
$(document).ready(() => {
  loadMap();
  $("#range").on("change", handleOnRangeChange);
  $("#boton-ubicacion").on("click", handleOnMyLocation);
  $("#boton-destino").on("click", handleOnFindDestino);
  $("#paradas_cercanas").on("click", handleOnFindParadas);
  $("#boton-guarda-viaje").on("click", handleOnSaveViaje);
  $("#calificacion-input").on("change", handleOnChangeCalificacion);
  $("#boton-admin-viajes").on("click", handleOnGetViajes);
});
// ************************ END MAIN ******************

// ************************ COMMAND FUNCTIONS ******************

const loadMap = options => {
  if (mMap) mMap = null;
  mMap = L.map("mapid", MAP_OPTIONS);
  baseLayer = L.tileLayer(TILE_LAYER);

  baseLayer.addTo(mMap);
  fetch(`${URL}/currentUser`)
    .then(result => result.json())
    .then(user => {
      currentUser = user;
      console.log("user", user);
      if (user.rol === "administrador") {
        showAdminArea();
      } else {
        hideAdminArea();
      }
    });

  // loadMototripFeatures();
};

const loadMototripFeatures = async () => {
  let entities = [
    // "clientes",
    // "conductores",
    // "barrios",
    "vias"
    // "rutas_mio",
    // "rutas_petroncales",
    // "rutas_troncales"
  ];

  let features = await Promise.all(
    entities.map(entity =>
      fetch(`${URL}/${entity}`).then(result => result.json())
    )
  );

  features.forEach(f => new L.GeoJSON(f).addTo(mMap));
  // new L.GeoJSON(data, {
  //   pointToLayer,
  //   onEachFeature: handleOnEachFeature
  // });
  // loadSearchControl();
  // loadGroupedLayers();
};

const loadGroupedLayers = () => {
  overlaysObj.priority = {};
  overlaysObj.visible = L.layerGroup(categories.visible);
  mMap.addLayer(overlaysObj.visible);
  overlaysObj.visible.eachLayer(marker => marker.openPopup());
  //I will comment it, but it wiil help later with some debugging
  loadGroupedLayerControl();
};

//Initialize grouped layers control
const loadGroupedLayerControl = () => {
  let priority = {};
  let visible = overlaysObj.visible;
  for (let i in overlaysObj.priority) {
    for (let j in overlaysObj.priority[i]) {
      priority[j] = overlaysObj.priority[i][j];
    }
  }
  let groupedOverlays = {
    Visible: { "1": visible },
    Prioridades: priority
  };
  let mapabase = {
    "Capa base": baseLayer
  };
  L.control.groupedLayers(mapabase, groupedOverlays).addTo(mMap);
};

const showAdminArea = () => {
  $("#admin-area").removeClass("not-visible");
};

const hideAdminArea = () => {
  $("#admin-area").addClass("not-visible");
};

const handleOnSaveViaje = () => {
  if (!destinoJson) return;
  let precio = destinoJson.precio;
  let calificacion = $("#calificacion-input").val();
  let observacion = $("#observaciones-input").val();
  let cliente = currentUser.id;
  let parada = mParadaId;
  // let ruta = destinoJson.ruta;
  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      precio,
      calificacion,
      observacion,
      cliente,
      parada
    })
  };
  console.log("options", options);
  let url = `${URL}/viaje`;
  fetch(url, options)
    .then(res => console.log("res", res))
    .then(data => console.log("data", data));
};

const getViajes = () => {
  let url = `${URL}/viajes`;
  fetch(url)
    .then(res => res.json())
    .then(geojson => {
      $("#viajes-text").html("");
      // $("#boton-destino").removeClass("not-visible");

      geojson.forEach(f => {
        let {
          id,
          conductor,
          calificacion,
          observacion,
          usuario,
          parada,
          precio
        } = f;
        var radioBtn = $(`
        <label for="${id}-radio"> <strong>parada:${parada}</strong>
        <p>precio: ${precio}</p>
        <p>observacion: ${observacion}</p>
        <p>cliente: ${usuario}</p>
        <p>calificacion: ${calificacion}</p>
        <p>conductor: ${conductor}</p>
        
        </label>`);
        radioBtn.appendTo("#viajes-text");
      });
      // $("input[name='parada-radio']").on("change", handleOnChangeRadio);
    });
};

const getParadasFromRange = (location, range) => {
  if (!location || !range) return;
  console.log("PARADAS RANGE", { location, range });
  let [latitude, longitude] = location;
  let url = `${URL}/paradas_buffer?latitude=${latitude}&longitude=${longitude}&buffer=${range}`;
  fetch(url)
    .then(res => res.json())
    .then(geojson => {
      console.log("geojson", geojson);
      var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      };

      if (mMap.hasLayer(paradas)) {
        mMap.removeLayer(paradas);
      } else {
        paradas = L.geoJSON(geojson, {
          pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, geojsonMarkerOptions);
          }
        });
        paradas.addTo(mMap);
      }
      $("#paradas-text").html("");
      $("#boton-destino").removeClass("not-visible");

      geojson.features.forEach(f => {
        let { nombre, distancia, gid } = f.properties;
        var radioBtn = $(`<input type="radio" name="parada-radio" gid="${nombre}-radio" value="${gid}"/>
        <label for="${nombre}-radio"> <strong>${nombre}</strong> - ${parseFloat(
          distancia
        ).toFixed(2)} kms</label>`);
        radioBtn.appendTo("#paradas-text");
      });
      $("input[name='parada-radio']").on("change", handleOnChangeRadio);
    });
};

const updateTextInput = (element, value) => {
  if (!element || !value) return;
  document.getElementById(element).innerHTML = value;
};

// ************************ END COMMAND FUNCTIONS ******************

// ************************ EVENT HANDLERS ******************
const getRutaParada = (point, parada) => {
  if (!point || !parada) return;
  console.log("{point, parada}", { point, parada });
  let [latitude, longitude] = point;
  let url = `${URL}/ruta_parada?latitude=${latitude}&longitude=${longitude}&parada=${parada}`;
  fetch(url)
    .then(res => res.json())
    .then(geojson => {
      console.log("geojson", geojson);
      if (mMap.hasLayer(rutaParada)) {
        mMap.removeLayer(rutaParada);
        rutaParada = L.geoJSON(geojson);
        rutaParada.addTo(mMap);
      } else {
        rutaParada = L.geoJSON(geojson);
        rutaParada.addTo(mMap);
      }
    });
};

const getRutaDestino = (destino, parada) => {
  if (!destino || !parada) return;
  console.log("{destino, parada}", { destino, parada });
  let [latitude, longitude] = destino;
  let url = `${URL}/ruta_destino?latitude=${latitude}&longitude=${longitude}&parada=${parada}`;
  fetch(url)
    .then(res => res.json())
    .then(geojson => {
      console.log("geojson", geojson);
      destinoJson = geojson;
      updateTextInput(
        "text-precio",
        `Precio: ${parseFloat(geojson.precio).toFixed(2)}`
      );

      if (mMap.hasLayer(rutaDestino)) {
        mMap.removeLayer(rutaDestino);
        rutaDestino = L.geoJSON(geojson.ruta);
        rutaDestino.addTo(mMap);
      } else {
        rutaDestino = L.geoJSON(geojson.ruta);
        rutaDestino.addTo(mMap);
      }
    });
};

const handleOnChangeRadio = e => {
  mParadaId = e.target.value;
  console.log("mParadaId", mParadaId);
  if (mParadaId && userLocation) {
    getRutaParada(userLocation, mParadaId);
  }
};

const handleOnGetViajes = () => {
  getViajes();
};

const handleOnChangeCalificacion = e => {
  mCalificacion = e.target.value;
  console.log("mCalificacion", mCalificacion);
  updateTextInput("textCalificacion", mCalificacion);
};

const handleOnFindDestino = e => {
  $("#boton-destino").addClass("not-visible");

  const styles = markerHtmlStyles("#583470");
  const icon = L.divIcon({
    className: "my-custom-pin",
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${styles}" />`
  });
  markerDestino = L.marker([3.430117, -76.516013], {
    icon,
    draggable: true
  });

  markerDestino.on("dragend", event => {
    $("#boton-guarda-viaje").removeClass("not-visible");

    let marker = event.target;
    let location = marker.getLatLng();
    let lat = location.lat;
    let lon = location.lng;
    let coords = [lat, lon];
    destinoLocation = coords;
    let prettylocation = [
      parseFloat(lat).toFixed(4),
      parseFloat(lon).toFixed(2)
    ];
    updateTextInput("text-destino", `Ubicacion: ${prettylocation}`);

    if (mParadaId) {
      getRutaDestino(coords, mParadaId);
    }
  });
  markerDestino.addTo(mMap);
};

const handleOnMyLocation = () => {
  navigator.geolocation.getCurrentPosition(location => {
    userLocation = [location.coords.latitude, location.coords.longitude];
    let latlng = new L.LatLng(...userLocation);
    const styles = markerHtmlStyles("#fa111b");
    const icon = L.divIcon({
      className: "my-custom-pin",
      iconAnchor: [0, 24],
      labelAnchor: [-6, 0],
      popupAnchor: [0, -36],
      html: `<span style="${styles}" />`
    });
    let prettylocation = [
      parseFloat(location.coords.latitude).toFixed(4),
      parseFloat(location.coords.longitude).toFixed(4)
    ];
    let marker = L.marker(latlng, { icon }).addTo(mMap);
    let text = `Tu ubicación actúal es:\n ${prettylocation}`;
    updateTextInput("myLocation", text);
    $(".not-visible").removeClass("not-visible");
    $("#boton-ubicacion").addClass("not-visible");
    $("#boton-destino").addClass("not-visible");
    $("#boton-guarda-viaje").addClass("not-visible");
  });
};

const handleOnRangeChange = e => {
  const { target } = e;
  if (!target) return;
  bufferRange = target.value;
  updateTextInput("textInput", bufferRange);
};

const handleOnFindParadas = e => {
  if (userLocation && bufferRange) {
    getParadasFromRange(userLocation, bufferRange);
  }
};

const handleOnEachFeature = (feature, layer) => {
  let { prioridad, visible } = feature.properties;
  if (visible && visible === 1) {
    categories.visible.push(layer);
  } else {
    if (typeof categories.priorities[prioridad] === "undefined") {
      categories.priorities[prioridad] = [];
    }
    categories.priorities[prioridad].push(layer);
  }
};

// ************************ END EVENT HANDLERS ******************

const markerHtmlStyles = color => `
  background-color: ${color};
  width: 2rem;
  height: 2rem;
  display: block;
  left: -1rem;
  top: -1rem;
  position: relative;
  border-radius: 2rem 2rem 0;
  transform: rotate(45deg);
  border: 1px solid #FFFFFF`;
