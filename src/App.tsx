import { ChatProvider } from './contexts/chat/index.ts';
import AppShell from './components/AppShell.tsx';

/**
 * 앱 루트.
 * ChatProvider로 전역 상태를 제공하고 AppShell에 레이아웃을 위임.
 * 이 파일에는 비즈니스 로직이 없어야 한다.
 */
export default function App() {
  return (
    <ChatProvider>
      <AppShell />
    </ChatProvider>
  );
}
