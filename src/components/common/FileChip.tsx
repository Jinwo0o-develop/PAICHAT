import { FileText, X } from 'lucide-react';
import type { AttachedFile } from '../../types/index.ts';
import { formatBytes } from '../../lib/format.ts';

interface Props {
  file: AttachedFile;
  onRemove: (id: string) => void;
}

/** 첨부 파일 미리보기 칩. 이미지는 썸네일, 일반 파일은 아이콘으로 표시. */
export default function FileChip({ file, onRemove }: Props) {
  return (
    <div className="group relative flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-sm max-w-[180px]">
      {file.preview ? (
        <img src={file.preview} alt={file.name} className="w-8 h-8 rounded object-cover shrink-0" />
      ) : (
        <FileText className="w-5 h-5 text-slate-400 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{file.name}</p>
        <p className="text-[10px] text-slate-400">{formatBytes(file.size)}</p>
      </div>
      <button
        onClick={() => onRemove(file.id)}
        aria-label="파일 제거"
        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-500 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}
