import { WFS, WMSCapabilities, WMTSCapabilities } from "ol/format";
import Vector from 'ol/source/Vector';
import { optionsFromCapabilities } from "ol/source/WMTS";
import { ServerType } from "ol/source/wms";
import GML32 from 'ol/format/GML32';
import { bbox as bboxStrategy } from 'ol/loadingstrategy.js';
import { Feature, Map } from "ol";
import { Geometry } from "ol/geom";

export async function getWMTSOptions(url: string, useProxy: boolean = true) {
  let urlBuilder = new URL(url);
  urlBuilder.searchParams.set('SERVICE', 'WMTS');
  urlBuilder.searchParams.set('REQUEST', 'GetCapabilities');

  url = urlBuilder.toString();

  if (useProxy) url = 'https://corsproxy.io/?' + url;

  const result = await fetch(url, { cache: 'force-cache' });
  const text = await result.text();

  const parser = new WMTSCapabilities();
  const capabilities = parser.read(text);

  const layer = capabilities['Contents']['Layer'][0]['Title'] || 'RASTER';
  const options = optionsFromCapabilities(capabilities, {
    layer: layer,
    matrixSet: 'EPSG:2180',
  })!;

  // @ts-ignore
  options.tileGrid.origins_ = options.tileGrid.origins_.map((origin: number[]) => [origin[1], origin[0]]);
  options.crossOrigin = 'Anonymous';

  return options;
}

export async function getWMSOptions(url: string, useProxy: boolean = true, tileSize: number = 256, opacity: number = 1.0) {
  let urlBuilder = new URL(url);
  urlBuilder.searchParams.set('SERVICE', 'WMS');
  urlBuilder.searchParams.set('REQUEST', 'GetCapabilities');

  url = urlBuilder.toString();
  if (useProxy) url = 'https://corsproxy.io/?' + url;

  const result = await fetch(url, { cache: 'force-cache' });
  const text = await result.text();

  const parser = new WMSCapabilities();
  const capabilities = parser.read(text);

  let version = capabilities['version'] || '1.3.0';

  let layers = capabilities['Capability']['Layer']['Layer'] || [];
  let layersStr = layers.map((x: any) => x.Name).join(',') || 'RASTER';

  let formats: string[] = capabilities['Capability']['Request']['GetMap']['Format'] || [];
  let format: string = '';

  if (formats.includes('image/png')) { format = 'image/png'; }
  else if (formats.includes('image/jpeg')) { format = 'image/jpeg'; }
  else if (formats.includes('image/jpg')) { format = 'image/jpg'; }

  return {
    url: url,
    params: {
      LAYERS: layersStr,
      SRS: 'EPSG:2180',
      FORMAT: format,
      TRANSPARENT: true,
      TILESIZE: tileSize,
      OPACITY: opacity,
      VERSION: '1.1.1',
    },
    projection: 'EPSG:2180',
    crossOrigin: 'Anonymous',
  }
};

export async function getSingleTileWMSOptions(_url: string, useProxy: boolean = true, tileSize: number = 256, opacity: number = 1.0) {
  return {
    ...await getWMSOptions(_url, useProxy, tileSize, opacity),
    ratio: 1,
    serverType: 'geoserver' as ServerType,
  }
}

export function getWFSSourceLayer(url: string, namespace: string, _map: Map) {
  const vectorSource = new Vector({
    format: new WFS({
      version: '2.0.0',
      gmlFormat: new GML32()
    }),
    strategy: bboxStrategy,
    loader: function(extent) {
      const urlBuilder = new URL(url);
  
      const options = {
        SERVICE: 'WFS',
        REQUEST: 'GetFeature',
        COUNT: 1000,
        VERSION: '2.0.0',
        STARTINDEX: 0,
        TYPENAMES: namespace,
        TYPENAME: namespace,
        SRSNAME: 'urn:ogc:def:crs:EPSG::2180',
      };
  
      for (const [key, value] of Object.entries(options)) {
        urlBuilder.searchParams.set(key, String(value));
      }
      
      extent = [
        extent[1],
        extent[0],
        extent[3],
        extent[2],
      ];
  
      const bb = extent.join(',') + ',urn:ogc:def:crs:EPSG::2180';
      urlBuilder.searchParams.set('BBOX', bb);
  
      const f_url = 'https://corsproxy.io/?' + urlBuilder.toString();
  
      
      fetch(f_url)
        .then(res => res.text())
        .then(gml => {
          const features = vectorSource.getFormat()!.readFeatures(gml, {
            dataProjection: 'EPSG:2180',
            featureProjection: _map.getView().getProjection(),
          }) as Feature<Geometry>[];
  
          features.forEach(feature => {
            feature.getGeometry()?.applyTransform(function (input, opt_output, opt_dimension) {
              const length = input.length;
              const dimension = opt_dimension !== undefined ? opt_dimension : 2;
              const output = opt_output !== undefined ? opt_output : new Array(length);
              for (let i = 0; i < length; i += dimension) {
                  const x = input[i];
                  const y = input[i + 1];
                  output[i] = y;
                  output[i + 1] = x;
              }
              return output;
            });
          });
  
          vectorSource.addFeatures(features);
        })
        .catch((err) => {
          vectorSource.removeLoadedExtent(extent);
          console.log('Error occured while fetching wfs features.', err)
        });
    },
  });

  // _map.on('moveend', function () {
  //   vectorSource.refresh();
  // });


  return vectorSource;
}
