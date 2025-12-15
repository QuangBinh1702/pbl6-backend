import React, { useState } from 'react';
import ChatInterface from '../components/ChatInterface';
import ChatHistory from '../components/ChatHistory';
import '../styles/ChatPage.css';

const ChatPage = () => {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="chat-page">
      <ChatInterface />
      
      <button
        className="btn-history-toggle"
        onClick={() => setShowHistory(true)}
        title="Xem lịch sử chat"
      >
        📜
      </button>

      <ChatHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
};

export default ChatPage;
