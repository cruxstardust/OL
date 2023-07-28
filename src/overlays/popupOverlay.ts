import { Overlay, Map, Feature } from "ol";
import { Geometry } from "ol/geom";

export function addPopupOverlay(_map: Map) {
  const popup = new Overlay({
    element: document.getElementById('popup') ?? undefined,
    autoPan: {
      animation: {
        duration: 100
      }
    },
  });

  let selected: Feature<Geometry> | null = null;
  _map.on('pointermove', function (e) {
    const content = document.getElementById('popup-content');
    if (!content) return;

    content.innerHTML = '';
  
    if (selected !== null) {
      selected.setStyle(undefined);
      selected = null as Feature<Geometry> | null;
    }
  
    _map.forEachFeatureAtPixel(e.pixel, function (f, _) {
      selected = f as Feature<Geometry> | null;
    });

    if (selected && selected?.getProperties()['boundedBy']) {
      const coords = e.coordinate;
      const props = selected.getProperties();
        
      delete props['boundedBy'];
      delete props['msGeometry'];
  
      let html = '<ul>';
      for (const key in props) {
        if (props.hasOwnProperty(key)) {
          html += '<li><strong>' + key + ':</strong> ' + props[key] + '</li>';
        }
      }
      html += '</ul>';
      content.innerHTML = html;
  
      popup.setPosition(coords);
    } else {
      popup.setPosition(undefined);
    }
  });

  _map.addOverlay(popup);
}
