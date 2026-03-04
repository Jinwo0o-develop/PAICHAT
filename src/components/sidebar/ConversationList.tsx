import { useState, useCallback, Fragment } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { History, Trash2, AlertTriangle, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { Conversation } from '../../types/index.ts';
import ConversationItem from './ConversationItem.tsx';
import ConversationMenu, { type MenuPosition } from './ConversationMenu.tsx';
import { useChat } from '../../hooks/useChat.ts';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
}

// ─── 기간 옵션 ────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { label: '1일 이전',  ms: 86_400_000 },
  { label: '1주 이전',  ms: 7 * 86_400_000 },
  { label: '1달 이전',  ms: 30 * 86_400_000 },
  { label: '2달 이상',  ms: 60 * 86_400_000 },
] as const;

// ─── 공통 Confirm Dialog (portal) ────────────────────────────────────────────

interface ConfirmDialogProps {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({ title, description, onCancel, onConfirm }: ConfirmDialogProps) {
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-80 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm"
          >
            삭제
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── 기간 선택 Dialog (portal) ────────────────────────────────────────────────

interface PeriodPickerProps {
  conversations: Conversation[];
  onSelect: (cutoffMs: number, label: string, count: number) => void;
  onClose: () => void;
}

function PeriodPicker({ conversations, onSelect, onClose }: PeriodPickerProps) {
  const countBefore = (ms: number) => {
    const cutoff = Date.now() - ms;
    return conversations.filter((c) => (c.createdAt ?? 0) < cutoff).length;
  };

  const allCount = conversations.length;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-80 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">기간별 대화 삭제</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          삭제할 기간을 선택하세요.
        </p>

        <div className="space-y-2">
          {PERIOD_OPTIONS.map(({ label, ms }) => {
            const count = countBefore(ms);
            const cutoff = Date.now() - ms;
            return (
              <button
                key={label}
                disabled={count === 0}
                onClick={() => onSelect(cutoff, label, count)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm
                  bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700
                  disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
                <span className="text-xs text-slate-400 bg-slate-200 dark:bg-slate-600 rounded-full px-2 py-0.5">
                  {count}개
                </span>
              </button>
            );
          })}

          <div className="border-t border-slate-100 dark:border-slate-700 pt-2">
            <button
              disabled={allCount === 0}
              onClick={() => onSelect(Date.now() + 1, '전체', allCount)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm
                bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30
                text-red-600 dark:text-red-400
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span className="font-medium flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> 전체 삭제
              </span>
              <span className="text-xs bg-red-200 dark:bg-red-800 rounded-full px-2 py-0.5">
                {allCount}개
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── ConversationList ─────────────────────────────────────────────────────────

/** 고정·일반 대화 목록 + 컨텍스트 메뉴 + 삭제 확인 + 기간별 삭제 */
export default function ConversationList({ conversations, activeId }: Props) {
  const {
    selectConversation,
    deleteConversation,
    deleteConversationsBefore,
    pinConversation,
    renameConversation,
  } = useChat();

  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // 삭제 확인 상태 (단건)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  // 기간 선택 모달
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  // 기간 삭제 확인 상태
  const [periodConfirm, setPeriodConfirm] = useState<{
    cutoffMs: number;
    label: string;
    count: number;
  } | null>(null);

  const openMenu = useCallback((e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ id, x: rect.left, y: rect.bottom + 4 });
  }, []);

  const startRename = useCallback((id: string, currentTitle: string) => {
    setMenuPos(null);
    setRenamingId(id);
    setRenameValue(currentTitle);
  }, []);

  const commitRename = useCallback(
    (id: string) => {
      const trimmed = renameValue.trim();
      if (trimmed) renameConversation(id, trimmed);
      setRenamingId(null);
    },
    [renameValue, renameConversation],
  );

  const handleRenameKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, id: string) => {
      if (e.key === 'Enter') commitRename(id);
      if (e.key === 'Escape') setRenamingId(null);
    },
    [commitRename],
  );

  // 삭제 버튼 클릭 → 확인 모달 표시
  const handleDeleteRequest = useCallback(
    (id: string) => {
      const conv = conversations.find((c) => c.id === id);
      if (conv) setDeleteConfirm({ id, title: conv.title });
    },
    [conversations],
  );

  const confirmSingleDelete = useCallback(() => {
    if (deleteConfirm) {
      deleteConversation(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, deleteConversation]);

  // 기간 선택 → 확인 단계
  const handlePeriodSelect = useCallback(
    (cutoffMs: number, label: string, count: number) => {
      setShowPeriodPicker(false);
      setPeriodConfirm({ cutoffMs, label, count });
    },
    [],
  );

  const confirmPeriodDelete = useCallback(() => {
    if (periodConfirm) {
      deleteConversationsBefore(periodConfirm.cutoffMs);
      setPeriodConfirm(null);
    }
  }, [periodConfirm, deleteConversationsBefore]);

  const openInNewWindow = useCallback((id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('conv', id);
    window.open(url.toString(), '_blank');
  }, []);

  const pinnedList = conversations.filter((c) => c.pinned);
  const unpinnedList = conversations.filter((c) => !c.pinned);

  const handleRenameStart = useCallback(
    (id: string) => {
      const conv = conversations.find((c) => c.id === id);
      if (conv) startRename(id, conv.title);
    },
    [conversations, startRename],
  );

  const renderItem = (conv: Conversation) => (
    <Fragment key={conv.id}>
      <ConversationItem
        conversation={conv}
        isActive={conv.id === activeId}
        isMenuOpen={menuPos?.id === conv.id}
        isRenaming={renamingId === conv.id}
        renameValue={renameValue}
        onSelect={selectConversation}
        onRenameStart={handleRenameStart}
        onRenameChange={setRenameValue}
        onRenameCommit={commitRename}
        onRenameKeyDown={handleRenameKeyDown}
        onMenuOpen={openMenu}
        onOpenNewWindow={openInNewWindow}
      />
    </Fragment>
  );

  return (
    <div className="px-6 pb-6 pt-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">최근 대화내역</h3>
        <button
          onClick={() => setShowPeriodPicker(true)}
          aria-label="기간별 삭제"
          title="기간별 삭제"
          className="text-slate-400 hover:text-red-400 transition-colors"
        >
          <History className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-1">
        {pinnedList.length > 0 && (
          <>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-1">
              고정됨
            </p>
            {pinnedList.map(renderItem)}
            {unpinnedList.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800 my-2" />
            )}
          </>
        )}
        {unpinnedList.map(renderItem)}
      </div>

      {/* 컨텍스트 메뉴 */}
      {menuPos && (
        <ConversationMenu
          menuPos={menuPos}
          conversation={conversations.find((c) => c.id === menuPos.id)}
          onClose={() => setMenuPos(null)}
          onPin={pinConversation}
          onRename={startRename}
          onDelete={handleDeleteRequest}
        />
      )}

      {/* 단건 삭제 확인 모달 */}
      {deleteConfirm && (
        <ConfirmDialog
          title="정말 삭제하시겠습니까?"
          description={`"${deleteConfirm.title}" 대화가 영구적으로 삭제됩니다.`}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={confirmSingleDelete}
        />
      )}

      {/* 기간 선택 모달 */}
      {showPeriodPicker && (
        <PeriodPicker
          conversations={conversations}
          onSelect={handlePeriodSelect}
          onClose={() => setShowPeriodPicker(false)}
        />
      )}

      {/* 기간 삭제 확인 모달 */}
      {periodConfirm && (
        <ConfirmDialog
          title="정말 삭제하시겠습니까?"
          description={`${periodConfirm.label} 이전 대화 ${periodConfirm.count}개가 영구적으로 삭제됩니다.`}
          onCancel={() => setPeriodConfirm(null)}
          onConfirm={confirmPeriodDelete}
        />
      )}
    </div>
  );
}
