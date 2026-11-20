import { toast } from '@kivi';

/*
  下载、复制：真的做（11-20 用户定，演示站下载的就是占位素材本身）。照线上 utils/image.ts：
  - 一个文件：直接存，文件名 KIVI-时间戳；多个：打成一个 ZIP（KIVI-Media-时间戳.zip），有几个没取到就说「部分下载失败」。
  - 提示：先「下载中」，做完换「下载成功」/「下载失败，请稍后再试」。
  - 复制：图片写进剪贴板（剪贴板只认 PNG，别的格式先转）；文字直接写。浏览器不让写就报失败，不假装成功。视频、音频不提供复制。
  页面只调 downloadMedia / copyImage / copyText，不自己拼 <a download>。
*/

export interface DownloadItem {
  /** 素材地址；文字节点不传，传 text */
  src?: string;
  /** 文字内容：存成 .txt */
  text?: string;
  /** 不带扩展名的文件名；不传用 KIVI-时间戳 */
  name?: string;
}

const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
};

/** 扩展名：先看返回的类型，认不出再看地址 */
function extOf(blob: Blob, src: string) {
  const byType = EXT[blob.type.split(';')[0]];
  if (byType) return byType;
  const m = /\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(src);
  return m ? m[1].toLowerCase() : 'bin';
}

async function blobOf(i: DownloadItem) {
  return i.text !== undefined ? new Blob([i.text], { type: 'text/plain;charset=utf-8' }) : fetchBlob(i.src!);
}

const extFor = (blob: Blob, i: DownloadItem) => (i.text !== undefined ? 'txt' : extOf(blob, i.src!));

async function fetchBlob(src: string) {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return res.blob();
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** 下载一个或几个素材。zipName：一定打包、用这个名字（压缩包节点）。返回是否至少下成了一个 */
export async function downloadMedia(items: DownloadItem[], opts: { zipName?: string } = {}): Promise<boolean> {
  const list = items.filter((i) => !!i.src || i.text !== undefined);
  if (!list.length) return false;
  const id = toast.loading('下载中');
  const stamp = Date.now();
  try {
    if (list.length === 1 && !opts.zipName) {
      const blob = await blobOf(list[0]);
      save(blob, `${list[0].name ?? `KIVI-${stamp}`}.${extFor(blob, list[0])}`);
      toast.update(id, { type: 'success', text: '下载成功' });
      return true;
    }
    const results = await Promise.allSettled(list.map(blobOf));
    const files = results.flatMap((r, i) =>
      r.status === 'fulfilled' ? [{ name: `media/${i + 1}-${list[i].name ?? `KIVI-${stamp}`}.${extFor(r.value, list[i])}`, blob: r.value }] : [],
    );
    if (!files.length) throw new Error('all failed');
    save(await zip(files), `${opts.zipName ?? `KIVI-Media-${stamp}`}.zip`);
    const partial = files.length < list.length;
    toast.update(id, partial ? { type: 'warning', text: '部分下载失败，请稍后再试' } : { type: 'success', text: '下载成功' });
    return true;
  } catch {
    toast.update(id, { type: 'error', text: '下载失败，请稍后再试' });
    return false;
  }
}

/** 图片转 PNG（剪贴板只认 PNG） */
async function toPng(blob: Blob): Promise<Blob> {
  if (blob.type === 'image/png') return blob;
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0);
  bmp.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png'))), 'image/png'));
}

/** 复制图片到剪贴板。成功、失败都出提示，返回是否成功 */
export async function copyImage(src: string, success = '已复制'): Promise<boolean> {
  try {
    // 先把 Promise 交给剪贴板，Safari 要求在点击的同一拍里调 write
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': fetchBlob(src).then(toPng) })]);
    toast.success(success);
    return true;
  } catch {
    toast.error('复制失败，请稍后再试');
    return false;
  }
}

/** 复制文字。成功、失败都出提示，返回是否成功 */
export async function copyText(text: string, success = '已复制'): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(success);
    return true;
  } catch {
    toast.error('复制失败，请稍后再试');
    return false;
  }
}

// ---------- 打 ZIP：只存不压（图片视频本来就压过），够演示用，不引库 ----------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function zip(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const enc = new TextEncoder();
  const parts: BlobPart[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const data = new Uint8Array(await f.blob.arrayBuffer());
    const name = enc.encode(f.name);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // 文件名是 UTF-8
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    parts.push(local.buffer, name, data);

    const dir = new DataView(new ArrayBuffer(46));
    dir.setUint32(0, 0x02014b50, true);
    dir.setUint16(4, 20, true);
    dir.setUint16(6, 20, true);
    dir.setUint16(8, 0x0800, true);
    dir.setUint32(16, crc, true);
    dir.setUint32(20, data.length, true);
    dir.setUint32(24, data.length, true);
    dir.setUint16(28, name.length, true);
    dir.setUint32(42, offset, true);
    central.push(new Uint8Array(dir.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const size = central.reduce((s, c) => s + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, size, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
}
