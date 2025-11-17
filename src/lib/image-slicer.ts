
export function sliceGridImage(
  imageSrc: string,
  rows: number,
  cols: number
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      const tileWidth = image.width / cols;
      const tileHeight = image.height / rows;
      const slicedImages: string[] = [];

      canvas.width = tileWidth;
      canvas.height = tileHeight;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.clearRect(0, 0, tileWidth, tileHeight);
          ctx.drawImage(
            image,
            c * tileWidth,
            r * tileHeight,
            tileWidth,
            tileHeight,
            0,
            0,
            tileWidth,
            tileHeight
          );
          slicedImages.push(canvas.toDataURL());
        }
      }
      resolve(slicedImages);
    };

    image.onerror = () => {
      reject(new Error('Failed to load image for slicing.'));
    };
  });
}
