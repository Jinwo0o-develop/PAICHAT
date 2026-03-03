import { useState, useRef, useCallback } from 'react';
import type { ChangeEvent, ClipboardEvent, DragEvent } from 'react';
import type { AttachedFile } from '../types/index.ts';
import { generateRandomId } from '../lib/id.ts';

async function fileToAttached(file: File): Promise<AttachedFile> {
  const base: AttachedFile = {
    id: generateRandomId(),
    name: file.name,
    size: file.size,
    type: file.type,
  };
  if (file.type.startsWith('image/')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ ...base, preview: e.target?.result as string });
      reader.readAsDataURL(file);
    });
  }
  return base;
}

export function useFileAttachment() {
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    const converted = await Promise.all(arr.map(fileToAttached));
    setFiles((prev) => [...prev, ...converted]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearFiles = useCallback(() => setFiles([]), []);

  const openPicker = useCallback(() => fileInputRef.current?.click(), []);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files);
      e.target.value = '';
    },
    [addFiles],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: DragEvent) => e.preventDefault(), []);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const fileItems = Array.from(e.clipboardData.items as DataTransferItemList)
        .filter((item: DataTransferItem) => item.kind === 'file')
        .map((item: DataTransferItem) => item.getAsFile())
        .filter((f): f is File => f !== null);
      if (fileItems.length) addFiles(fileItems);
    },
    [addFiles],
  );

  return {
    files,
    fileInputRef,
    removeFile,
    clearFiles,
    openPicker,
    handleInputChange,
    handleDrop,
    handleDragOver,
    handlePaste,
  };
}
