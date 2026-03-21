/**
 * Generate mock pixel data for testing without Skia.
 * Creates a Uint8Array of RGBA pixels with random drawing-like patterns.
 */
export function generateMockPixelData(width: number, height: number): Uint8Array {
  const data = new Uint8Array(width * height * 4);

  // Random dominant color
  const dominantR = Math.floor(Math.random() * 256);
  const dominantG = Math.floor(Math.random() * 256);
  const dominantB = Math.floor(Math.random() * 256);

  // Random coverage (30-80%)
  const coverage = 0.3 + Math.random() * 0.5;

  // Draw random blobs
  const centerX = width * (0.3 + Math.random() * 0.4);
  const centerY = height * (0.3 + Math.random() * 0.4);
  const radius = Math.min(width, height) * (0.2 + Math.random() * 0.3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius && Math.random() < coverage) {
        // Colored pixel with some variation
        data[i] = Math.min(255, dominantR + Math.floor(Math.random() * 40 - 20));
        data[i + 1] = Math.min(255, dominantG + Math.floor(Math.random() * 40 - 20));
        data[i + 2] = Math.min(255, dominantB + Math.floor(Math.random() * 40 - 20));
        data[i + 3] = 255; // Alpha
      } else {
        // Transparent pixel
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
      }
    }
  }

  return data;
}

/**
 * Convert a base64 image string to pixel data.
 * Placeholder - real implementation needs native module.
 */
export function base64ToPixelData(_base64: string): { data: Uint8Array; width: number; height: number } {
  // For MVP, return mock data
  const width = 200;
  const height = 200;
  return { data: generateMockPixelData(width, height), width, height };
}
