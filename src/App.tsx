import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

// --- Types & Interfaces ---
interface IconProps {
  className?: string;
}

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface AvatarItem {
  type: 'image' | 'text';
  src?: string;
  text?: string;
}

interface PastChat {
  id: string;
  title: string;
  date: string;
  preview: string;
  avatars?: AvatarItem[];
}

interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  joinedDate: string;
  reflectionsCount: number;
  prayersCount: number;
}

// --- Custom Icons matching the sketch and theme ---
const CrossIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
    <path d="M12 7v10" strokeWidth="2" />
    <path d="M8 11h8" strokeWidth="2" />
  </svg>
);

const SendIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
);

// --- Menu Icons ---
const ChatPlusIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="9" y1="10" x2="15" y2="10" />
    <line x1="12" y1="7" x2="12" y2="13" />
  </svg>
);

const HeartIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const BookIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const BookmarkIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const SparkleIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3L14.5 9.5L21 12L14.5 14.5L12 21L9.5 14.5L3 12L9.5 9.5L12 3Z" />
  </svg>
);

const ShareIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const MenuIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="18" x2="14" y2="18" />
  </svg>
);

const MicIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

// --- Mock responses for the prototype ---
const MOCK_RESPONSES = [
  "Take a deep breath. In moments of frustration, patience is often the quietest yet strongest response.",
  "Consider looking at the situation through the eyes of compassion. What might they be going through?",
  "Let your words be seasoned with grace. Sometimes silence is better than words spoken in anger.",
  "Remember that every challenge is an opportunity to practice love and understanding.",
  "Seek peace and pursue it. How can you be a peacemaker in this specific situation?",
  "Trust that you are guided. Take a step back and pray for clarity before making a decision."
];

const MENU_OPTIONS = [
  { label: "Start New Conversation", icon: ChatPlusIcon },
  { label: "Create Affirmation", icon: HeartIcon },
  { label: "Create Verse Card", icon: BookIcon },
  { label: "Save Reflection", icon: BookmarkIcon },
  { label: "Prayer Prompt", icon: SparkleIcon },
  { label: "Invite Someone", icon: ShareIcon },
];

const PAST_CHATS: PastChat[] = [
  { 
    id: 'c1', 
    title: "Seeking patience at work", 
    date: "Today", 
    preview: "In moments of frustration, patience is often...",
    avatars: [{ type: 'image', src: 'https://i.pravatar.cc/100?img=47' }, { type: 'text', text: 'K' }]
  },
  { 
    id: 'c2', 
    title: "Worrying about the future", 
    date: "Yesterday", 
    preview: "Trust that you are guided. Take a step back...", 
    avatars: [{ type: 'text', text: 'M' }, { type: 'image', src: 'https://i.pravatar.cc/100?img=12' }, { type: 'text', text: 'J' }] 
  },
  { 
    id: 'c3', 
    title: "A heavy heart", 
    date: "May 20", 
    preview: "Consider looking at the situation through the eyes..." 
  },
  { 
    id: 'c4', 
    title: "Gratitude reflection", 
    date: "May 18", 
    preview: "Let your words be seasoned with grace...",
    avatars: [{ type: 'image', src: 'https://i.pravatar.cc/100?img=32' }, { type: 'image', src: 'https://i.pravatar.cc/100?img=33' }]
  },
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userProfile] = useState<UserProfile>({
    name: "Sarah Jenkins",
    email: "sarah.jenkins@quantumfaith.net",
    avatarUrl: "https://i.pravatar.cc/150?img=49",
    joinedDate: "Member since May 2025",
    reflectionsCount: 12,
    prayersCount: 24
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: "Welcome to this quiet space. As we seek His guidance, trust that the Lord's gentle whispers can find us anywhere—even reaching through the intricate threads of the quantum network to touch your heart today. What troubles your spirit?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Dynamic textarea height adjustment up to 8 lines (roughly 192px)
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 192; // 8 lines * 24px line height
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        
        setIsTyping(true);
        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'audio/webm',
            },
            body: audioBlob,
          });

          if (!response.ok) {
            throw new Error(`Transcription API status ${response.status}`);
          }

          const data = await response.json();
          if (data.text) {
            setInputText(prev => prev ? `${prev} ${data.text}` : data.text);
          }
        } catch (err) {
          console.error("Transcription error:", err);
          alert("Could not transcribe audio. Please type your situation manually.");
        } finally {
          setIsTyping(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone permission is required to record a whisper.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newUserMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      // Attempt to connect to our Vercel serverless API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage].map(m => ({
            sender: m.sender,
            text: m.text
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`API response status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.text) {
        const newAiMessage: Message = {
          id: Date.now() + 1,
          sender: 'ai',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, newAiMessage]);
      } else {
        throw new Error('Missing text in API response');
      }
    } catch (err) {
      console.warn("API request failed, falling back to mock response:", err);
      // Graceful fallback to local mock response simulation
      setTimeout(() => {
        const randomResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
        const newAiMessage: Message = {
          id: Date.now() + 1,
          sender: 'ai',
          text: randomResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, newAiMessage]);
        setIsTyping(false);
      }, 1500 + Math.random() * 1500);
      return;
    }

    setIsTyping(false);
  };

  const handleMenuClick = (label: string) => {
    setIsMenuOpen(false);
    if (label === "Start New Conversation") {
      setMessages([
        {
          id: Date.now(),
          sender: 'ai',
          text: "Welcome to this quiet space. As we seek His guidance, trust that the Lord's gentle whispers can find us anywhere—even reaching through the intricate threads of the quantum network to touch your heart today. What troubles your spirit?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    // Main container - using a very warm, soft off-white background (#FAF8F5)
    <div className="flex justify-center items-center w-full h-[100dvh] bg-[#EFECE6] font-sans text-[#4A4036] p-0 sm:p-4 md:p-8 overflow-hidden">
      {/* Mobile App Frame constraint */}
      <div className="flex flex-col w-full h-full max-w-md bg-[#FAF8F5] sm:h-[800px] sm:max-h-[90dvh] sm:rounded-[40px] shadow-2xl overflow-hidden relative border border-[#E5E0D8]">
        
        {/* Global Overlay to close menu when clicking outside */}
        <div 
          className={`absolute inset-0 z-20 bg-[#4A4036]/5 backdrop-blur-[2px] transition-all duration-500 ${(isMenuOpen || isSidebarOpen) ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
          onClick={() => { setIsMenuOpen(false); setIsSidebarOpen(false); }}
        />

        {/* Sidebar - Past Chats */}
        <div 
          className={`
            absolute left-0 top-0 bottom-0 w-[280px] bg-[#FAF8F5] z-40 border-r border-[#E5E0D8] shadow-[12px_0_40px_rgba(0,0,0,0.05)]
            flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-tr-[32px] overflow-hidden
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="px-6 py-8 border-b border-[#F0EBE1] bg-[#FAF8F5] relative z-10">
            <h2 className="text-lg font-semibold tracking-tight text-[#4A4036]">Past Reflections</h2>
            <p className="text-xs text-[#8B7D6B] mt-1 font-medium">Your journey of seeking Him</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-[#FAF8F5] to-[#EFECE6]/30">
            {PAST_CHATS.map((chat) => (
              <button 
                key={chat.id}
                className="w-full text-left p-4 rounded-[24px] rounded-bl-[8px] bg-white border border-transparent hover:border-[#E5E0D8] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:shadow-sm transition-all duration-300 group"
              >
                <div className="flex justify-between items-baseline mb-1.5">
                  <h3 className="font-semibold text-[#4A4036] text-[13.5px] truncate pr-3">{chat.title}</h3>
                  <span className="text-[10px] text-[#A69C8E] flex-shrink-0 font-medium tracking-wide">{chat.date}</span>
                </div>
                <div className="flex justify-between items-end gap-3">
                  <p className="text-[12px] text-[#8B7D6B] line-clamp-2 leading-relaxed group-hover:text-[#6D6253] transition-colors">{chat.preview}</p>
                  {chat.avatars && (
                    <div className="flex -space-x-1.5 flex-shrink-0 pb-0.5">
                      {chat.avatars.map((avatar, i) => (
                        <div key={i} className="w-[22px] h-[22px] rounded-full bg-[#E5E0D8] border-[1.5px] border-white flex items-center justify-center text-[9px] font-bold text-[#6D6253] shadow-sm relative z-10 hover:z-20 transition-all overflow-hidden">
                          {avatar.type === 'image' ? (
                            <img src={avatar.src} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            avatar.text
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Sidebar Footer - User Profile */}
          <div className="p-4 border-t border-[#F0EBE1] bg-white">
            <button 
              onClick={() => {
                setIsProfileOpen(true);
                setIsSidebarOpen(false);
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-[20px] hover:bg-[#F0EBE1]/50 text-left transition-all duration-300 group"
            >
              <img 
                src={userProfile.avatarUrl} 
                alt="user avatar" 
                className="w-10 h-10 rounded-full object-cover border border-[#E5E0D8] group-hover:scale-105 transition-transform" 
              />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#4A4036] truncate">{userProfile.name}</p>
                <p className="text-[11px] text-[#A69C8E] truncate">{userProfile.email}</p>
              </div>
              <svg className="w-5 h-5 text-[#A69C8E] group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Header - Soft, inviting, with the cross icon from the sketch */}
        <header className="flex justify-between items-center px-6 py-5 bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-30 border-b border-[#F0EBE1]">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-[#8B7D6B] hover:text-[#4A4036] transition-colors rounded-full hover:bg-[#F0EBE1]"
              aria-label="Open past reflections"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-[#4A4036]">
                What Would Jesus Do?
              </h1>
              <p className="text-xs text-[#8B7D6B] mt-0.5 font-medium">
                Guided Reflection
              </p>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 -mr-2 text-[#8B7D6B] hover:text-[#4A4036] transition-colors rounded-full hover:bg-[#F0EBE1]"
            >
              <CrossIcon className={`w-8 h-8 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMenuOpen ? 'rotate-[135deg] scale-90' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <div 
              className={`
                absolute right-0 top-full mt-2 w-60 bg-[#FAF8F5] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-[#E5E0D8] overflow-hidden z-50
                origin-top-right transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${isMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'}
              `}
            >
              <div className="py-2.5">
                {MENU_OPTIONS.map((option, index) => {
                  const IconComponent = option.icon;
                  return (
                    <button 
                      key={option.label}
                      onClick={() => handleMenuClick(option.label)}
                      className="w-full text-left px-5 py-3.5 flex items-center space-x-3 hover:bg-[#F0EBE1]/70 text-[#4A4036] group transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{
                        transitionDelay: isMenuOpen ? `${index * 45}ms` : '0ms',
                        opacity: isMenuOpen ? 1 : 0,
                        transform: isMenuOpen ? 'translateY(0)' : 'translateY(12px)',
                      }}
                    >
                      <IconComponent className="w-[18px] h-[18px] text-[#A69C8E] group-hover:text-[#8B7D6B] transition-colors duration-300" />
                      <span className="text-[14.5px] font-medium tracking-wide">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Chat Area - Spacious and calming */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`
                  relative max-w-[85%] px-5 py-3.5 text-[15px] leading-relaxed shadow-sm
                  ${msg.sender === 'user' 
                    ? 'bg-[#DED7CD] text-[#3A3229] rounded-[24px] rounded-br-[8px]' 
                    : 'bg-white text-[#4A4036] rounded-[24px] rounded-bl-[8px] border border-[#F0EBE1] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]'
                  }
                `}
              >
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                    li: ({ node, ...props }) => <li className="text-[14.5px]" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                    em: ({ node, ...props }) => <em className="italic" {...props} />,
                    code: ({ node, className, children, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const inline = !match;
                      return inline ? (
                        <code className="bg-[#F0EBE1] text-[#6D6253] px-1 py-0.5 rounded text-[13px] font-mono border border-[#E5E0D8]/40" {...props}>
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-[#F0EBE1]/40 p-3 rounded-lg overflow-x-auto text-[13px] font-mono my-2 border border-[#F0EBE1] max-w-full">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      );
                    }
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
              <span className="text-[11px] text-[#A69C8E] mt-1.5 px-2">
                {msg.timestamp}
              </span>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex flex-col items-start animate-pulse">
              <div className="bg-white rounded-[24px] rounded-bl-[8px] border border-[#F0EBE1] px-5 py-4 shadow-sm flex items-center space-x-1.5">
                <div className="w-2 h-2 bg-[#DED7CD] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#DED7CD] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#DED7CD] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Pill shaped, soft edges, matching the sketch's bottom section */}
        <div className="p-4 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5] to-transparent pt-6">
          <form 
            onSubmit={handleSend}
            className="flex items-end bg-white border border-[#E5E0D8] rounded-[32px] p-2 shadow-sm focus-within:ring-2 focus-within:ring-[#DED7CD] focus-within:border-transparent transition-all"
          >
            <button
              type="button"
              onClick={handleMicClick}
              className={`p-3 rounded-full flex-shrink-0 transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse shadow-md scale-105' 
                  : 'bg-transparent text-[#8B7D6B] hover:bg-[#F0EBE1]'
              }`}
              title={isRecording ? "Stop recording" : "Whisper with voice"}
            >
              <MicIcon className="w-5 h-5" />
            </button>

            {isRecording ? (
              <div className="flex-1 flex items-center justify-start space-x-1.5 px-4 h-[44px] text-[#8B7D6B] font-semibold text-[13px]">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></div>
                <span className="animate-pulse">Recording whisper...</span>
                <div className="flex items-end space-x-0.5 h-4 ml-3">
                  <div className="w-0.5 bg-[#8B7D6B] rounded-full animate-bounce h-3" style={{ animationDelay: '0ms', animationDuration: '0.6s' }}></div>
                  <div className="w-0.5 bg-[#8B7D6B] rounded-full animate-bounce h-4" style={{ animationDelay: '150ms', animationDuration: '0.5s' }}></div>
                  <div className="w-0.5 bg-[#8B7D6B] rounded-full animate-bounce h-2" style={{ animationDelay: '300ms', animationDuration: '0.7s' }}></div>
                  <div className="w-0.5 bg-[#8B7D6B] rounded-full animate-bounce h-3" style={{ animationDelay: '450ms', animationDuration: '0.6s' }}></div>
                </div>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Share your situation..."
                className="flex-1 max-h-[192px] min-h-[44px] bg-transparent resize-none outline-none py-3 px-4 text-[#4A4036] placeholder-[#A69C8E]"
                rows={1}
                style={{ height: 'auto' }}
              />
            )}

            <button 
              type="submit"
              disabled={!inputText.trim() || isTyping || isRecording}
              className={`
                p-3 rounded-full ml-2 mb-0.5 flex-shrink-0 transition-all duration-300
                ${inputText.trim() && !isTyping && !isRecording
                  ? 'bg-[#8B7D6B] text-white hover:bg-[#6D6253] shadow-md transform hover:scale-105' 
                  : 'bg-[#F0EBE1] text-[#C2B8AA] cursor-not-allowed'
                }
              `}
            >
              <SendIcon className="w-5 h-5 ml-0.5" />
            </button>
          </form>
          
          <div className="text-center mt-3 mb-1">
            <p className="text-[10px] text-[#A69C8E] uppercase tracking-wider font-semibold">
              Take a moment to whisper a quick prayer before you send.
            </p>
          </div>
        </div>

        {/* Profile Page Overlay */}
        {isProfileOpen && (
          <div className="absolute inset-0 bg-[#FAF8F5] z-50 flex flex-col animate-slide-up">
          {/* Profile Header */}
          <header className="flex items-center px-6 py-5 border-b border-[#F0EBE1] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-10">
            <button 
              onClick={() => setIsProfileOpen(false)}
              className="p-2 -ml-2 text-[#8B7D6B] hover:text-[#4A4036] transition-colors rounded-full hover:bg-[#F0EBE1]"
              aria-label="Go back to chat"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-[#4A4036] ml-2">Spiritual Profile</h2>
          </header>

          {/* Profile Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-[#FAF8F5] to-[#EFECE6]/30">
            {/* Avatar Section */}
            <div className="flex flex-col items-center py-4">
              <div className="relative">
                <img 
                  src={userProfile.avatarUrl} 
                  alt={userProfile.name} 
                  className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md"
                />
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-[#8B7D6B] text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm cursor-pointer hover:bg-[#6D6253] transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#4A4036] mt-4">{userProfile.name}</h3>
              <p className="text-xs text-[#8B7D6B] font-medium mt-1">{userProfile.joinedDate}</p>
            </div>

            {/* Spiritual Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-[20px] border border-[#F0EBE1] text-center shadow-sm">
                <p className="text-2xl font-bold text-[#8B7D6B]">{userProfile.reflectionsCount}</p>
                <p className="text-[11px] text-[#A69C8E] uppercase tracking-wider font-semibold mt-1">Reflections</p>
              </div>
              <div className="bg-white p-4 rounded-[20px] border border-[#F0EBE1] text-center shadow-sm">
                <p className="text-2xl font-bold text-[#8B7D6B]">{userProfile.prayersCount}</p>
                <p className="text-[11px] text-[#A69C8E] uppercase tracking-wider font-semibold mt-1">Whispered Prayers</p>
              </div>
            </div>

            {/* Profile Info Details */}
            <div className="bg-white rounded-[24px] border border-[#F0EBE1] p-5 space-y-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
              <div>
                <label className="text-[11px] text-[#A69C8E] uppercase tracking-wider font-bold">Display Name</label>
                <p className="text-[15px] font-medium text-[#4A4036] mt-1 border-b border-[#F0EBE1]/60 pb-2">{userProfile.name}</p>
              </div>
              <div>
                <label className="text-[11px] text-[#A69C8E] uppercase tracking-wider font-bold">Email Address</label>
                <p className="text-[15px] font-medium text-[#4A4036] mt-1 border-b border-[#F0EBE1]/60 pb-2">{userProfile.email}</p>
              </div>
            </div>

            {/* Logout/Dummy Action Button */}
            <div className="pt-4">
              <button 
                onClick={() => {
                  alert("Sign-out functionality will be enabled once your database is connected.");
                }}
                className="w-full py-4 bg-[#F0EBE1] hover:bg-[#E5E0D8] text-[#8B7D6B] font-semibold text-[14.5px] rounded-[24px] transition-all duration-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
        
      </div>
    </div>
  );
}
