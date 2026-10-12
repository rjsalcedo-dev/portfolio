// src/lib/media.js
// Browser-side file prep for the admin: shrink photos before upload, and turn the first
// page of a certificate PDF into a preview image.
const MAX_SIDE = 1800;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });
}

const canvasToFile = (canvas, name, type = 'image/webp', quality = 0.86) =>
  new Promise((resolve) => canvas.toBlob((b) => resolve(new File([b], name, { type: b.type })), type, quality));

// Resizes large photos to ≤1800px and re-encodes as WebP. GIFs (animation) and small
// files are uploaded untouched.
export async function compressImage(file) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size < 250 * 1024) return file;
  try {
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = await canvasToFile(canvas, file.name.replace(/\.\w+$/, '.webp'));
    return out.size < file.size ? out : file;
  } catch {
    return file;
  }
}

let pdfjs;
async function loadPdfJs() {
  if (pdfjs) return pdfjs;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load the PDF previewer.'));
    document.head.appendChild(s);
  });
  pdfjs = window.pdfjsLib;
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  return pdfjs;
}

// Renders page 1 of a PDF (e.g. a NetAcad certificate) to a WebP preview image.
export async function pdfPreview(file) {
  const lib = await loadPdfJs();
  const doc = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  const page = await doc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: 1600 / Math.max(base.width, base.height) });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvasToFile(canvas, file.name.replace(/\.pdf$/i, '-preview.webp'));
}
