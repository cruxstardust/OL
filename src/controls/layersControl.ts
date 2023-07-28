import {Control} from 'ol/control';
import { LayerDict } from '../main';

export class LayersControl extends Control {
  _layers: LayerDict;
  
  constructor(layers: LayerDict) {
    const container = document.createElement('div');
    container.classList.add('layers-control-container');

    super({
      element: container,
    });
    this._layers = layers;

    const interval = setInterval(() => {
      if (this.getMap()) {
        clearInterval(interval);
        container.addEventListener('mouseenter', this.handleMouseEnter);
        container.addEventListener('mouseleave', this.handleMouseLeave);
        this.initLayers(container);
      }
    }, 100);
  }

  private initLayers(container: HTMLDivElement) {
    const containerIcon = document.createElement('div');
    containerIcon.classList.add('layers-control', 'layers-icon');

    const layers = document.createElement('div');
    layers.classList.add('layers-control', 'hidden');

    container.appendChild(layers);
    container.appendChild(containerIcon);
    
    for (const layerName of Object.keys(this._layers)) {
      const layer = this._layers[layerName];

      const element = document.createElement('div');
      element.classList.add('layers-control-item');
      
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      
      if (layer.isVisible())
        checkbox.setAttribute('checked', 'checked');

      label.appendChild(checkbox);
      label.innerHTML += layerName;
      element.appendChild(label);
      layers.appendChild(element);

      element.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        layer.setVisible(!layer.isVisible());
        target.checked = layer.isVisible();
      });
    }
  }

  private handleMouseEnter(e: MouseEvent) {
    const control = document.querySelector('.layers-control');
    const icon = document.querySelector('.layers-icon')
    if (control) control.classList.remove('hidden');
    if (icon) icon.classList.add('hidden');
  }

  private handleMouseLeave(e: MouseEvent) {
    const control = document.querySelector('.layers-control');
    const icon = document.querySelector('.layers-icon')
    if (control) control.classList.add('hidden');
    if (icon) icon.classList.remove('hidden');
  }
}
