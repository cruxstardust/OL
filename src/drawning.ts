import Draw from 'ol/interaction/Draw.js';
import { Feature, Overlay, Map } from 'ol';
import { Polygon } from 'ol/geom';
import {getArea, getLength} from 'ol/sphere.js';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style.js';
import {unByKey} from 'ol/Observable.js';
import VectorSource from 'ol/source/Vector';

export function addDrawInteraction(_map: Map, drawSource: VectorSource) {
  let draw: Draw;
  let sketch: Feature | null;
  let measureTooltipElement: HTMLElement | null;
  let measureTooltip: Overlay;

  const formatArea = function (polygon: Polygon) {
    const area = getArea(polygon);
    let output;
    if (area > 10000) {
      output = Math.round((area / 1000000) * 100) / 100 + ' ' + 'km<sup>2</sup>';
    } else {
      output = Math.round(area * 100) / 100 + ' ' + 'm<sup>2</sup>';
    }
    return output;
  };

  function addInteraction() {
    const type = 'Polygon';
    draw = new Draw({
      source: drawSource,
      type: type,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 0.5)',
          lineDash: [10, 10],
          width: 2,
        }),
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({
            color: 'rgba(0, 0, 0, 0.7)',
          }),
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)',
          }),
        }),
      }),
    });
    _map.addInteraction(draw);

    createMeasureTooltip();

    let listener: any;
    draw.on('drawstart', function (evt: any) {
      sketch = evt.feature;

      let tooltipCoord = evt.coordinate;

      listener = sketch?.getGeometry()?.on('change', function (evt) {
        const geom = evt.target;
        let output;
        output = formatArea(geom);
        tooltipCoord = geom.getInteriorPoint().getCoordinates();
        measureTooltipElement!.innerHTML = output;
        measureTooltip.setPosition(tooltipCoord);
      });
    });

    draw.on('drawend', function () {
      measureTooltipElement!.className = 'ol-tooltip ol-tooltip-static';
      measureTooltip.setOffset([0, -7]);
      // unset sketch
      sketch = null;
      // unset tooltip so that a new one can be created
      measureTooltipElement = null;
      createMeasureTooltip();
      unByKey(listener);
    });
  }

  function createMeasureTooltip() {
    if (measureTooltipElement) {
      measureTooltipElement.parentNode?.removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
    measureTooltip = new Overlay({
      element: measureTooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center',
      stopEvent: false,
      insertFirst: false,
    });
    _map.addOverlay(measureTooltip);
  }

  addInteraction();

  // _map.getViewport().addEventListener('contextmenu', on_mapRightClick);

  // function on_mapRightClick(event: any) {
  //   event.preventDefault();

  //   const clickedCoordinate = _map.getCoordinateFromPixel([event.clientX, event.clientY]);
  //   const featuresAtClick = drawSource.getFeaturesAtCoordinate(clickedCoordinate);

  //   console.log(featuresAtClick);

  //   if (featuresAtClick.length > 0) {
  //     const featureToRemove = featuresAtClick[0];
  //     drawSource.removeFeature(featureToRemove);
  //   }

  //   if (draw.getActive()) {
  //     draw.abortDrawing();
  //   }
  // }
}