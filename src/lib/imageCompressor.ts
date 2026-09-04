/**
 * Mengompresi file gambar di sisi client menggunakan HTML Canvas
 * Mengutamakan format modern WebP dengan resolusi optimal 720px dan kualitas 0.55
 * Mampu memangkas ukuran foto dari ~450KB menjadi hanya ~30KB (penghematan kuota & egress hingga 90%)
 * 
 * @param file File gambar asli
 * @param maxDimension Dimensi terpanjang maksimal (default 720px)
 * @param quality Kualitas kompresi (0.1 - 1.0, default 0.55)
 */
export async function compressImage(
  file: File | Blob,
  maxDimension: number = 720,
  quality: number = 0.55
): Promise<{ blob: Blob; mimeType: string; extension: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Skala proporsional berbasis dimensi terpanjang
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback: kembalikan file asli jika canvas gagal
          resolve({
            blob: file,
            mimeType: file.type || 'image/jpeg',
            extension: file.type?.includes('png') ? 'png' : 'jpg'
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Prioritaskan WebP (sangat hemat bandwidth), fallback ke JPEG
        canvas.toBlob(
          (webpBlob) => {
            if (webpBlob && webpBlob.type === 'image/webp') {
              resolve({
                blob: webpBlob,
                mimeType: 'image/webp',
                extension: 'webp'
              });
            } else {
              // Fallback ke JPEG jika browser tidak mendukung toBlob webp
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    resolve({
                      blob: jpegBlob,
                      mimeType: 'image/jpeg',
                      extension: 'jpg'
                    });
                  } else {
                    resolve({
                      blob: file,
                      mimeType: file.type || 'image/jpeg',
                      extension: 'jpg'
                    });
                  }
                },
                'image/jpeg',
                quality
              );
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => {
        resolve({
          blob: file,
          mimeType: file.type || 'image/jpeg',
          extension: 'jpg'
        });
      };
    };

    reader.onerror = (error) => {
      reject(error);
    };
  });
}
