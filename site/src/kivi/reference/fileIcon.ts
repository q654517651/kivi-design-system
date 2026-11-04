import type { IconName } from '../icons';

/** 扩展名（不分大小写，带不带点都行）对应的文件图标；认不出的用通用的 File。参考格、悬停预览共用这一份 */
const BY_EXT: Record<string, IconName> = {
  pdf: 'FilePdf',
  doc: 'FileDoc',
  docx: 'FileDoc',
  ppt: 'FilePpt',
  pptx: 'FilePpt',
  key: 'FilePpt',
  txt: 'FileTxt',
  md: 'FileTxt',
  rtf: 'FileTxt',
  xls: 'FileXls',
  xlsx: 'FileXls',
  numbers: 'FileXls',
  csv: 'FileCsv',
  tsv: 'FileCsv',
  zip: 'FileZip',
  rar: 'FileZip',
  '7z': 'FileZip',
  tar: 'FileZip',
  gz: 'FileZip',
  json: 'FileJson',
};

export function fileIcon(ext: unknown): IconName {
  if (typeof ext !== 'string') return 'File';
  return BY_EXT[ext.trim().replace(/^\./, '').toLowerCase()] ?? 'File';
}
