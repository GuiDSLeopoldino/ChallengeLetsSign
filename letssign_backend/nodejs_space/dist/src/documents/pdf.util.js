"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256 = sha256;
exports.validatePdf = validatePdf;
exports.stampPdf = stampPdf;
exports.cleanBase64 = cleanBase64;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const pdf_lib_1 = require("pdf-lib");
function sha256(buf) {
    return (0, crypto_1.createHash)('sha256').update(buf).digest('hex');
}
async function validatePdf(file) {
    if (!file || !file.buffer?.length)
        throw new common_1.BadRequestException('Selecione um arquivo PDF.');
    const head = file.buffer.subarray(0, 1024).toString('latin1');
    if (!head.includes('%PDF-'))
        throw new common_1.BadRequestException('O arquivo enviado não é um PDF válido.');
    try {
        const doc = await pdf_lib_1.PDFDocument.load(file.buffer, { ignoreEncryption: false, updateMetadata: false });
        const pages = doc.getPageCount();
        if (pages < 1)
            throw new Error('sem páginas');
        return { pages, sizes: doc.getPages().map((p) => ({ w: p.getWidth(), h: p.getHeight() })) };
    }
    catch (e) {
        if (String(e?.message).toLowerCase().includes('encrypt')) {
            throw new common_1.BadRequestException('O PDF está protegido por senha e não pode ser processado.');
        }
        throw new common_1.BadRequestException('O PDF está corrompido ou não pôde ser processado.');
    }
}
async function stampPdf(original, fields, footer) {
    const doc = await pdf_lib_1.PDFDocument.load(original);
    const cache = new Map();
    const pages = doc.getPages();
    for (const f of fields) {
        const page = pages[f.page - 1];
        if (!page)
            continue;
        const W = page.getWidth();
        const H = page.getHeight();
        let img = cache.get(f.png);
        if (!img) {
            try {
                img = await doc.embedPng(Buffer.from(f.png, 'base64'));
                cache.set(f.png, img);
            }
            catch {
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
function cleanBase64(s) {
    return s.replace(/^data:image\/[a-z]+;base64,/i, '').replace(/\s/g, '');
}
//# sourceMappingURL=pdf.util.js.map