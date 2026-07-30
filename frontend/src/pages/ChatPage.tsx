import React, { useEffect, useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ImageGenPanel from '../components/ImageGenPanel';
import MemoryPanel from '../components/MemoryPanel';
import TermsConsentModal from '../components/modals/TermsConsentModal';

const ChatPage: React.FC = () => {
  const { loadConversations, activeConversationId } = useChat();
  const [showImageGen, setShowImageGen] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <div className="app-layout">
      <TermsConsentModal />
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop visible"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenMemory={() => { setShowMemory(true); setSidebarOpen(false); }}
        onOpenImageGen={() => { setShowImageGen(true); setSidebarOpen(false); }}
      />

      {/* Main Chat Area */}
      <main className="chat-area">
        <ChatWindow
          conversationId={activeConversationId}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      </main>

      {/* Modals */}
      {showImageGen && <ImageGenPanel onClose={() => setShowImageGen(false)} />}
      {showMemory && <MemoryPanel onClose={() => setShowMemory(false)} />}
    </div>
  );
};

export default ChatPage;
