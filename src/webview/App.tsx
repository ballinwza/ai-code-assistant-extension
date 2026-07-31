import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ดึง VS Code API สำหรับส่งข้อความออกจาก Webview
const vscode = acquireVsCodeApi();

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const App = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedCode, setAttachedCode] = useState<{code: string, file: string} | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // รับข้อความตอบกลับจาก Extension Host (Node.js)
    const handleMessage = (event: MessageEvent) => {
    const message = event.data;
      if (message.type === 'bot-response') {
        setMessages((prev) => [...prev, { role: 'assistant', content: message.text }]);
        setLoading(false);
      } 
      // 💡 รับแจ้งเตือนเมื่อมีการ Select โค้ด
      else if (message.type === 'selection-updated') {
        setAttachedCode({ code: message.code, file: message.file });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSend = () => {
    if (!input.trim() || loading) return;

    // 💡 2. สร้าง AbortController ใหม่ทุกครั้งที่ส่ง Request
    abortControllerRef.current = new AbortController();

    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // ส่งข้อความไปหา extension.ts
    vscode.postMessage({
      type: 'ask-assistant',
      text: input,
      history: messages
    });

    setInput('');
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // สั่งยกเลิก Request
      abortControllerRef.current = null;
    }

    // แจ้ง Extension Host ให้ยกเลิกการรอ API ด้วย
    vscode.postMessage({ type: 'cancel-assistant' });

    setLoading(false);
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '🛑 Question Cancelled' },
    ]);
  };

  return (
    <div className="flex flex-col h-screen bg-vscode-sideBar-background text-vscode-sideBar-foreground p-3">
      {/* Header */}
      <div className="text-sm font-bold pb-2 mb-2 border-b border-gray-700">
        🤖 AI Code Assistant
      </div>

      <hr/>
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2.5 rounded-lg text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white self-end ml-6'
                : 'bg-gray-800 text-gray-200 mr-6 border border-gray-700'
            }`}
          >
            <div className="font-semibold text-[10px] opacity-70 mb-1">
              {msg.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div className="whitespace-pre-wrap">
              <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <div className="bg-gray-700 my-2 rounded overflow-hidden text-[11px]">
                          <div className="bg-gray-700 text-gray-400 px-2 py-0.5 text-[9px] uppercase font-mono">
                            {match[1]}
                          </div>
                          <SyntaxHighlighter
                            style={vscDarkPlus as any}
                            language={match[1]}
                            PreTag="div"
                            codeTagProps={{
                              style: {
                                background: 'transparent',
                              },
                            }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code className="bg-gray-700 text-pink-400 px-1 py-0.5 rounded font-mono text-[11px]" {...props}>
                          {children}
                        </code>
                      );
                    },
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && <div>
          <div className="text-xs text-gray-400 animate-pulse">Assistant thinking...</div>
          <button
            onClick={handleCancel}
            className="absolute right-2 bottom-2.5 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] rounded font-medium transition flex items-center gap-1 shadow-sm"
            title="Cancel Request"
          >
            <span className="w-2 h-2 bg-white rounded-sm animate-pulse" />
            <span>Cancel</span>
          </button>
        </div>}
      </div>

      {messages.length > 0 || loading ? <hr/> : <></>}

      {/* Input Box */}
      <div className="mt-2 pt-2 border-t border-gray-700">
        {/* 💡 แสดง Badge ถ้ามีโค้ดถูก Select อยู่ */}
        {attachedCode && (
          <div className="flex items-center justify-between bg-gray-800 text-[10px] text-blue-400 p-1.5 mb-1.5 rounded border border-blue-500/30">
            <button 
              onClick={() => setAttachedCode(null)} 
              className="text-gray-400 hover:text-red-400 ml-1 font-bold"
            >
              ✕
            </button>
            <span className="truncate max-w-[200px]">📎AttachedCode: {attachedCode.file.split('/').pop()}</span>
          </div>
        )}
        {attachedCode && <hr/>}
        
        <textarea
          className="w-full bg-gray-900 text-xs text-white p-2 border border-gray-700 rounded focus:outline-none focus:border-blue-500 resize-none"
          rows={3}
          placeholder="Question from repository or codebase..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <hr/>
        <div className='w-full flex gap-2'>
          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full mt-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 rounded transition font-medium disabled:opacity-50"
          >
            Send
          </button>

          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-[10px] text-gray-400 hover:text-red-400 transition"
              title="Clear Chat"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
    </div>
  );
};