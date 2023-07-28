import jsPDF from 'jspdf';
import {Control} from 'ol/control';
import Map from 'ol/Map'

export class PrintControl extends Control {
  
  constructor() {
    const container = document.createElement('div');
    container.classList.add('print-control-container');

    const control = document.createElement('div');
    container.classList.add('print-control');

    const pdfIcon = document.createElement('button');
    pdfIcon.classList.add('print-icon-pdf');
    pdfIcon.title = 'Zapisz mapę jako PDF';

    const pngIcon = document.createElement('button');
    pngIcon.classList.add('print-icon-png');
    pngIcon.title = 'Zapisz mapę jako PNG';

    control.appendChild(pdfIcon);
    control.appendChild(pngIcon);
    container.appendChild(control);

    super({
      element: container,
    });

    pdfIcon.addEventListener('click', () => {
      if (!this.getMap()) return;

      let dataUrl = this.mapToPng(this.getMap()!);

      const doc = new jsPDF();
      const img = new Image();
      img.src = dataUrl;
  
      img.onload = function() {
        const width = Math.floor(doc.internal.pageSize.getWidth());
        const height = Math.floor((img.height * width) / img.width);
    
        doc.addImage(img, 'PNG', 0, 0, width, height);
        doc.save('map.pdf')
      }
    });

    pngIcon.addEventListener('click', () => {
      if (!this.getMap()) return;

      let dataUrl = this.mapToPng(this.getMap()!);

      const link = document.createElement('a');
      document.body.appendChild(link);
      link.download = 'map.png';
      link.href = dataUrl;
      link.target = '_blank';
      link.click();
      link.remove();
    });
  }

  private mapToPng(map: Map) {
    const mapCanvas = document.createElement('canvas');
    const size = map.getSize()!;
    mapCanvas.width = size[0];
    mapCanvas.height = size[1];
    const mapContext = mapCanvas.getContext('2d')!;
    Array.prototype.forEach.call(
      map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'),
      function (canvas) {
        if (canvas.width > 0) {
          const opacity =
            canvas.parentNode.style.opacity || canvas.style.opacity;
          mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
          let matrix;
          const transform = canvas.style.transform;
          if (transform) {
            // Get the transform parameters from the style's transform matrix
            matrix = transform
              .match(/^matrix\(([^\(]*)\)$/)[1]
              .split(',')
              .map(Number);
          } else {
            matrix = [parseFloat(canvas.style.width) / canvas.width, 0, 0, parseFloat(canvas.style.height) / canvas.height, 0, 0];
          }
          // Apply the transform to the export map context
          CanvasRenderingContext2D.prototype.setTransform.apply(
            mapContext,
            matrix
          );
          const backgroundColor = canvas.parentNode.style.backgroundColor;
          if (backgroundColor) {
            mapContext.fillStyle = backgroundColor;
            mapContext.fillRect(0, 0, canvas.width, canvas.height);
          }
          mapContext.drawImage(canvas, 0, 0);
        }
      }
    );
    mapContext.globalAlpha = 1;
    mapContext.setTransform(1, 0, 0, 1, 0, 0);

    return mapCanvas.toDataURL('image/png');
  }
}
