import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import { Image as ImageLayer } from 'ol/layer.js';
import ImageWMS from 'ol/source/ImageWMS.js';
import View from 'ol/View';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import MousePosition from 'ol/control/MousePosition';
import {defaults as defaultControls} from 'ol/control';
import {format as formatCoords} from 'ol/coordinate';
import TileWMS from 'ol/source/TileWMS';
import WMTS from 'ol/source/WMTS';
import { resolutions, scales } from './_constants';
import { LayersControl } from './controls/layersControl';
import { PrintControl } from './controls/printControl';
import { Vector as VectorLayer } from 'ol/layer.js';
import Geometry from 'ol/geom/Geometry';
import VectorSource from 'ol/source/Vector';
import { addPopupOverlay } from './overlays/popupOverlay';
import { getSingleTileWMSOptions, getWFSSourceLayer, getWMSOptions, getWMTSOptions } from './layersUtils';
import { addDrawInteraction } from './drawning';

proj4.defs('EPSG:2180', '+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs');
register(proj4);


const wmtsOptions = await getWMTSOptions('https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMTS/StandardResolution');
const wmsOptions = await getWMSOptions('https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution');
const singleTileOptions = await getSingleTileWMSOptions('https://mapy.geoportal.gov.pl/wss/service/PZGIK/PRG/WMS/AdministrativeBoundaries');
const otherSingleTileOptions = await getSingleTileWMSOptions('https://mapy.geoportal.gov.pl/wss/ext/OkregiWyborcze');

const view = new View({
  center: [509847.9, 511024.24],
  projection: 'EPSG:2180',
  resolutions: resolutions,
  constrainResolution: true,
  zoom: 0,
});

const controls = defaultControls({
  rotate: false,
  attribution: false,
});

const map = new Map({
  controls: controls,
  target: 'map',
  view,
});

export type LayerDict = { 
  [key: string]: 
    TileLayer<TileWMS | WMTS> | 
    ImageLayer<ImageWMS> |
    VectorLayer<VectorSource<Geometry>>
};

const layers: LayerDict = {
  '(WMTS) Ortofotomapa': new TileLayer({
    source: new WMTS(wmtsOptions),
    visible: true,
  }),

  '(WMS) Ortofotomapa': new TileLayer({
    source: new TileWMS(wmsOptions),
    visible: false,
  }),
  '(WMS) Granice': new ImageLayer({
    source: new ImageWMS(singleTileOptions),
    visible: false,
  }),
  '(WMS) Wybory': new ImageLayer({
    source: new ImageWMS(otherSingleTileOptions),
    visible: false,
  }),
  '(WFS) Adresy': new VectorLayer({   
    source: getWFSSourceLayer(
      'https://mapy.geoportal.gov.pl/wss/ext/KrajowaIntegracjaNumeracjiAdresowej',
      'ms:prg-adresy',
      map
    ),
    visible: false,
    minZoom: 9,
  }),
  '(WFS) Nowe Budynki': new VectorLayer({   
    source: getWFSSourceLayer(
      'https://mapy.geoportal.gov.pl/wss/service/PZGIK/BDOT10k/WFS/NoweBudynki',
      'ms:bud_2022',
      map
    ),
    visible: false,
    minZoom: 7,
  }),
};

map.setLayers(Object.values(layers));

const layersControl = new LayersControl(layers);
const printControl = new PrintControl();

const template = 'x: {x}</br>y: {y}';
const mousePositionControl = new MousePosition({
  coordinateFormat: function(coord) {
    return formatCoords(coord || [], template, 4);
  },
  projection: 'EPSG:2180',
  target: document.getElementById('mouse-position') || undefined,
});

map.addControl(mousePositionControl);
map.addControl(layersControl);
map.addControl(printControl);

const scaleElement = document.getElementById('scale');
const handleScaleChange = () => {
  let res = map.getView().getResolution() || 0;

  let idx = resolutions.indexOf(res);
  if (idx !== -1 && scaleElement) {
    scaleElement.innerHTML = `Skala 1:${scales[idx].toLocaleString()}`;
  }
}

map.getView().on('change:resolution', handleScaleChange);
handleScaleChange();

addPopupOverlay(map);

const drawSource = new VectorSource({wrapX: false});
const drawVector = new VectorLayer({
  source: drawSource,
});

map.addLayer(drawVector);
addDrawInteraction(map, drawSource);