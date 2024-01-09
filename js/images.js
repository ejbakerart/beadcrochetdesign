
// code from https://ourcodeworld.com/articles/read/1548/how-to-render-a-svg-string-file-onto-a-canvas-and-export-it-to-png-or-jpeg-with-a-custom-resolution-preserving-quality-in-javascript

/**
 * Helper function to generate a Blob image of a custom size from a SVGDataURL.
 * 
 * @param svgText 
 * @param newWidth 
 * @param mimeType 
 * @param quality 
 * @returns Promise
 */
export const generateImageBlobFromSVG = ( svgText, newWidth, mimeType, quality ) =>
{
  quality = quality || 1;

  let dataURL = "data:image/svg+xml;charset=utf-8," + encodeURIComponent( svgText );

  return new Promise( (resolve, reject) =>
  {
      // 1. Create an abstract canvas
      let canvas = document.createElement('canvas');
      let ctx = canvas.getContext("2d");

      // 2. Create an image element to load the SVG
      let img = new Image();

      // 3. Manipulate
      img.onload = function() {
          // Declare initial dimensions of the image
          let originalWidth = img.width;
          let originalHeight = img.height;

          // Declare the new width of the image
          // And calculate the new height to preserve the aspect ratio
          img.width = newWidth;
          img.height = (originalHeight / originalWidth) * newWidth;

          // Set the dimensions of the canvas to the new dimensions of the image
          canvas.width = img.width;
          canvas.height = img.height;

          // Render image in Canvas
          ctx.drawImage(img, 0, 0, img.width, img.height); 

          // Export the canvas to blob
          // You may modify this to export it as a base64 data URL
          canvas.toBlob(function(blob){
              resolve(blob);
          }, mimeType, quality);
      };

      // Load the DataURL of the SVG
      img.src = dataURL;
    });
  }
