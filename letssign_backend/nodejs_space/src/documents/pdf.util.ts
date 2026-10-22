import { BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PDFDocument } from 'pdf-lib';

export function sha256(buf: Buffer | Uint8Array): string {
  return createHash('sha256').update(buf).digest('hex');
}

export async function validatePdf(file?: Express.Multer.File): Promise<{ pages: number; sizes: { w: number; h: number }[] }> {
  if (!file || !file.buffer?.length) throw new BadRequestException('Selecione um arquivo PDF.');
  const head = file.buffer.subarray(0, 1024).toString('latin1');
  if (!head.includes('%PDF-')) throw new BadRequestException('O arquivo enviado não é um PDF válido.');
  try {
    const doc = await PDFDocument.load(file.buffer, { ignoreEncryption: false, updateMetadata: false });
    const pages = doc.getPageCount();
    if (pages < 1) throw new Error('sem páginas');
    return { pages, sizes: doc.getPages().map((p) => ({ w: p.getWidth(), h: p.getHeight() })) };
  } catch (e: any) {
    if (String(e?.message).toLowerCase().includes('encrypt')) {
      throw new BadRequestException('O PDF está protegido por senha e não pode ser processado.');
    }
    throw new BadRequestException('O PDF está corrompido ou não pôde ser processado.');
  }
}

export interface StampField { page: number; x: number; y: number; width: number; height: number; png: string; label: string }

/** Gera o PDF final com as imagens das assinaturas carimbadas nos campos (coordenadas normalizadas, origem no topo). */
export async function stampPdf(original: Buffer, fields: StampField[], footer: string): Promise<Buffer> {
  const doc = await PDFDocument.load(original);
  const cache = new Map<string, any>();
  const pages = doc.getPages();
  for (const f of fields) {
    const page = pages[f.page - 1];
    if (!page) continue;
    const W = page.getWidth();
    const H = page.getHeight();
    let img = cache.get(f.png);
    if (!img) {
      try {
        img = await doc.embedPng(Buffer.from(f.png, 'base64'));
        cache.set(f.png, img);
      } catch {
        continue;
      }
    }
    const w = f.width * W, h = f.height * H;
    const scale = Math.min(w / img.width, h / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    const x = f.x * W + (w - dw) / 2;
    const y = H - f.y * H - h + (h - dh) / 2;
    page.drawImage(img, { x, y, width: dw, height: dh });
    page.drawText(f.label, { x: f.x * W, y: Math.max(2, H - f.y * H - h - 8), size: 6 });
  }
  const last = pages[pages.length - 1];
  last.drawText(footer, { x: 20, y: 10, size: 6 });
  return Buffer.from(await doc.save());
}

export function cleanBase64(s: string): string {
  return s.replace(/^data:image\/[a-z]+;base64,/i, '').replace(/\s/g, '');
}
