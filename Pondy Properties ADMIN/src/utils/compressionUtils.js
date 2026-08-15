import imageCompression from 'browser-image-compression';
import { FFmpeg } from '@ffmpeg/ffmpeg';

const ffmpeg = new FFmpeg({ log: false });

export async function compressImage(file, maxSizeKB = 100, onProgress = null) {
  try {
    // Simulate progress: 0% start
    if (onProgress) onProgress(10);

    const options = {
      maxSizeMB: maxSizeKB / 1024,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.8,
    };

    // Progress: 40% during first compression
    const compressedBlob = await imageCompression(file, options);
    if (onProgress) onProgress(40);

    const compressedFile = new File([compressedBlob], file.name, { type: file.type });

    // If still larger, try one more pass with lower quality
    if (compressedFile.size > maxSizeKB * 1024) {
      if (onProgress) onProgress(60);
      const options2 = { ...options, initialQuality: 0.6 };
      const compressedBlob2 = await imageCompression(file, options2);
      if (onProgress) onProgress(90);
      return new File([compressedBlob2], file.name, { type: file.type });
    }

    if (onProgress) onProgress(100);
    return compressedFile;
  } catch (err) {
    console.warn('Image compression failed, returning original', err);
    if (onProgress) onProgress(100);
    return file;
  }
}

export async function compressVideo(file, maxSizeKB = 200, onProgress = null) {
  // If file already small enough, return as-is
  if (file.size <= maxSizeKB * 1024) {
    if (onProgress) onProgress(100);
    return file;
  }

  try {
    if (onProgress) onProgress(10);
    try {
      if (typeof ffmpeg.isLoaded === 'function') {
        if (!ffmpeg.isLoaded()) await ffmpeg.load();
      } else if (!ffmpeg.isLoaded) {
        await ffmpeg.load();
      }
    } catch (e) {
      // attempt to load anyway
      await ffmpeg.load();
    }

    if (onProgress) onProgress(20);
    const inName = 'input.' + (file.type.split('/')[1] || 'mp4');
    const outName = 'output.mp4';

    const arrayBuffer = await file.arrayBuffer();
    ffmpeg.FS('writeFile', inName, new Uint8Array(arrayBuffer));

    if (onProgress) onProgress(40);
    // Try a low-bitrate transcode aiming to reduce size
    await ffmpeg.run('-i', inName, '-b:v', '200k', '-bufsize', '200k', outName);

    if (onProgress) onProgress(80);
    const data = ffmpeg.FS('readFile', outName);
    const compressedBlob = new Blob([data.buffer], { type: 'video/mp4' });
    if (compressedBlob.size <= maxSizeKB * 1024) {
      if (onProgress) onProgress(100);
      return new File([compressedBlob], file.name.replace(/\.[^.]+$/, '.mp4'), { type: 'video/mp4' });
    }

    if (onProgress) onProgress(100);
    // If still too big, return the produced file anyway (best effort)
    return new File([compressedBlob], file.name.replace(/\.[^.]+$/, '.mp4'), { type: 'video/mp4' });
  } catch (err) {
    console.warn('Video compression failed or FFmpeg not available.', err);
    if (onProgress) onProgress(100);
    return file;
  }
}
