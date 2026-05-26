import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

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
  id: string; // UUID or local session id
  title: string;
  date: string;
  preview: string;
  messages: Message[];
  avatars?: AvatarItem[];
  created_at?: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
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

// --- Mock responses for fallback ---
const MOCK_RESPONSES = [
  "Take a deep breath. In moments of frustration, patience is often the quietest yet strongest response.",
  "Consider looking at the situation through the eyes of compassion. What might they be going through?",
  "Let your words be seasoned with grace. Sometimes silence is better than words spoken in anger.",
  "Remember that every challenge is an opportunity to practice love and understanding.",
  "Seek peace and pursue it. How can you be a peacemaker in this specific situation?",
  "Trust that you are guided. Take a step back and pray for clarity before making a decision."
];

// --- Menu Options configuration ---
const MENU_OPTIONS = [
  { label: "Start New Conversation", icon: ChatPlusIcon },
  { label: "Create Affirmation", icon: HeartIcon },
  { label: "Create Verse Card", icon: BookIcon },
  { label: "Save Reflection", icon: BookmarkIcon },
  { label: "Prayer Prompt", icon: SparkleIcon },
  { label: "Invite Someone", icon: ShareIcon },
];

// --- Scripture Verse database for dynamic card selection ---
const SCRIPTURE_VERSES = [
  { keywords: ['fear', 'anxious', 'scared', 'worry', 'stress', 'doubt', 'afraid'], reference: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand." },
  { keywords: ['fear', 'anxious', 'scared', 'worry', 'stress', 'doubt', 'afraid'], reference: "Philippians 4:6-7", text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus." },
  { keywords: ['work', 'job', 'boss', 'career', 'tired', 'weary', 'office'], reference: "Colossians 3:23", text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters." },
  { keywords: ['work', 'job', 'boss', 'career', 'tired', 'weary', 'exhausted'], reference: "Matthew 11:28", text: "Come to me, all you who are weary and burdened, and I will give you rest." },
  { keywords: ['anger', 'angry', 'frustrated', 'temper', 'mad', 'hate'], reference: "James 1:19-20", text: "My dear brothers and sisters, take note of this: Everyone should be quick to listen, slow to speak and slow to become angry, because human anger does not produce the righteousness that God desires." },
  { keywords: ['love', 'friend', 'relationship', 'marriage', 'lonely', 'people'], reference: "1 Corinthians 13:4-7", text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs." },
  { keywords: ['sad', 'grief', 'depressed', 'hurt', 'pain', 'heavy', 'crying'], reference: "Psalm 34:18", text: "The Lord is close to the brokenhearted and saves those who are crushed in spirit." }
];

const DEFAULT_VERSE = { reference: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight." };

const AFFIRMATIONS = [
  "I am anchored in divine peace, and I choose to trust His plan over my understanding.",
  "I cast all my cares and anxieties upon Him, knowing that He loves and sustains me.",
  "My worth is not defined by my production, but by His grace and everlasting love.",
  "I will respond with patience and kindness, even when my circumstances tempt me to frustration.",
  "I am strong and courageous, for the Lord my God is with me wherever I go."
];

const PRAYERS = [
  "Lord, in this quiet moment, I lay my worries and my heavy heart before You. Refresh my spirit, fill me with Your peace, and give me the wisdom to handle whatever is ahead. Amen.",
  "Father, thank You for Your grace that meets me right where I am. Strengthen my resolve, season my speech with love, and keep me mindful of Your presence. Amen.",
  "God, when I am tired and overwhelmed, remind me that You are my strength. Guide my decisions and open my eyes to the blessings in this day. Amen."
];

// Seed chat helper
const getWelcomeChat = (): PastChat => ({
  id: 'c-welcome',
  title: "Welcome Conversation",
  date: "Today",
  preview: "Welcome to this quiet space. What troubles your spirit?",
  messages: [
    {
      id: 1,
      sender: 'ai',
      text: "Welcome to this quiet space. As we seek His guidance, trust that the Lord's gentle whispers can find us anywhere—even reaching through the intricate threads of the quantum network to touch your heart today. What troubles your spirit?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ],
  created_at: new Date().toISOString()
});

export default function App() {
  // Navigation & Sidebars
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Chats Data State
  const [chats, setChats] = useState<PastChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isChatsLoading, setIsChatsLoading] = useState(false);

  // Spiritual Feature Modals State
  const [activeModal, setActiveModal] = useState<'affirmation' | 'verse' | 'prayer' | 'invite' | null>(null);
  const [cardVerse, setCardVerse] = useState<{ reference: string; text: string } | null>(null);
  const [cardAffirmation, setCardAffirmation] = useState<string | null>(null);
  const [cardPrayer, setCardPrayer] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chat input and audio states
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Utility Date Formatter
  const formatChatDate = (dateStr?: string) => {
    if (!dateStr) return 'Today';
    const d = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (d.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Toast notifier helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Retrieve Active Chat object
  const getActiveChat = (): PastChat => {
    const active = chats.find(c => c.id === currentChatId);
    if (active) return active;
    
    // Fallback/Seeding if chats are empty
    if (chats.length > 0) {
      return chats[0];
    }
    return getWelcomeChat();
  };

  const activeChat = getActiveChat();
  const messages = activeChat.messages;

  // Sync Local / Session Chats to DB on Sign-in
  const syncLocalChatsToDb = async (userId: string) => {
    const localRaw = localStorage.getItem('wwjd_local_chats');
    console.log("[Auth Debug] syncLocalChatsToDb: localRaw exists =", !!localRaw);
    if (!localRaw) return;

    try {
      const localChats: PastChat[] = JSON.parse(localRaw);
      console.log("[Auth Debug] syncLocalChatsToDb: found local chats =", localChats.length);
      if (localChats.length === 0) return;

      console.log('[Auth Debug] Migrating local chats to Supabase...');
      for (const chat of localChats) {
        // Skip the default welcome message if it has no user messages in it to keep DB clean
        const hasUserMessage = chat.messages.some(m => m.sender === 'user');
        if (!hasUserMessage) continue;

        console.log('[Auth Debug] migrating chat:', chat.title);
        const { error } = await supabase.from('chats').insert({
          user_id: userId,
          title: chat.title,
          preview: chat.preview,
          messages: chat.messages,
          created_at: chat.created_at || new Date().toISOString()
        });
        if (error) {
          console.error('[Auth Debug] Migration error for chat:', chat.title, error.message);
        }
      }

      // Cleanup local storage
      localStorage.removeItem('wwjd_local_chats');
      showToast("Your offline reflections have been synced!");
    } catch (e) {
      console.error('[Auth Debug] Failed to migrate local chats:', e);
    }
  };

  // Load Chats based on Auth State
  const loadChats = async (currUser: User | null) => {
    console.log("[Auth Debug] loadChats: currUser exists =", !!currUser);
    setIsChatsLoading(true);
    try {
      if (currUser) {
        // Load user chats from DB
        console.log("[Auth Debug] loadChats: Querying DB for user chats...");
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', currUser.id)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error("[Auth Debug] loadChats DB query error:", error.message);
        }

        if (!error && data && data.length > 0) {
          console.log("[Auth Debug] loadChats: found", data.length, "chats in DB");
          const dbChatsList: PastChat[] = data.map(item => ({
            id: item.id,
            title: item.title,
            preview: item.preview,
            messages: item.messages,
            date: formatChatDate(item.updated_at || item.created_at),
            created_at: item.created_at
          }));
          setChats(dbChatsList);
          // Set active chat to the most recent one
          setCurrentChatId(dbChatsList[0].id);
        } else {
          console.log("[Auth Debug] loadChats: no chats found in DB (or error), seeding welcome chat");
          // No chats in DB yet. Create welcome chat
          const defaultChat = getWelcomeChat();
          setChats([defaultChat]);
          setCurrentChatId(defaultChat.id);
        }
      } else {
        // Load local guest chats
        console.log("[Auth Debug] loadChats: Querying localStorage for guest chats...");
        const localRaw = localStorage.getItem('wwjd_local_chats');
        if (localRaw) {
          try {
            const localChats: PastChat[] = JSON.parse(localRaw);
            if (localChats.length > 0) {
              console.log("[Auth Debug] loadChats: found", localChats.length, "guest chats in localStorage");
              setChats(localChats);
              setCurrentChatId(localChats[0].id);
              return;
            }
          } catch (e) {
            console.error("[Auth Debug] loadChats localStorage parse error:", e);
          }
        }
        console.log("[Auth Debug] loadChats: no guest chats in localStorage, seeding welcome chat");
        // If none exist, seed welcome chat
        const defaultChat = getWelcomeChat();
        setChats([defaultChat]);
        setCurrentChatId(defaultChat.id);
      }
    } catch (e) {
      console.error("[Auth Debug] loadChats exception caught:", e);
    } finally {
      setIsChatsLoading(false);
      console.log("[Auth Debug] loadChats: completed loading state");
    }
  };

  // Fetch Public Profile from database
  const fetchProfile = async (userId: string) => {
    console.log("[Auth Debug] fetchProfile: Querying profile for:", userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);
      if (error) {
        console.error("[Auth Debug] fetchProfile DB error:", error.message);
      } else if (data && data.length > 0) {
        console.log("[Auth Debug] fetchProfile found profile:", data[0]);
        setProfile(data[0] as UserProfile);
      } else {
        console.log("[Auth Debug] fetchProfile: no profile row found in DB");
      }
    } catch (err) {
      console.error("[Auth Debug] fetchProfile exception caught:", err);
    }
  };

  // Initialize Supabase Auth state listener
  useEffect(() => {
    console.log("[Auth Debug] useEffect run. Registering auth observer...");
    setIsAuthLoading(true);

    // Listen to Auth Changes
    // Note: Supabase's onAuthStateChange automatically resolves the initial session
    // and fires the INITIAL_SESSION event immediately, making getSession redundant.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Auth Debug] onAuthStateChange event received:", event, "hasSession =", !!session);
      
      const u = session?.user ?? null;
      setUser(u);
      
      try {
        if (u) {
          console.log("[Auth Debug] User is authenticated. Fetching database records in background...");
          // Run these asynchronously without awaiting them, so the loading splash screen is released immediately
          fetchProfile(u.id).catch(err => {
            console.error("[Auth Debug] fetchProfile background task error:", err);
          });
          syncLocalChatsToDb(u.id).catch(err => {
            console.error("[Auth Debug] syncLocalChatsToDb background task error:", err);
          });
          loadChats(u).catch(err => {
            console.error("[Auth Debug] loadChats background task error:", err);
          });
        } else {
          console.log("[Auth Debug] User is guest. Cleaning up profile and loading guest chats...");
          setProfile(null);
          loadChats(null).catch(err => {
            console.error("[Auth Debug] loadChats background task error (guest):", err);
          });
        }
      } catch (e) {
        console.error("[Auth Debug] onAuthStateChange callback exception caught:", e);
        // Fallback to guest configuration to avoid freezing UI
        loadChats(null).catch(err => console.error(err));
      } finally {
        console.log("[Auth Debug] onAuthStateChange: releasing initial auth load screen");
        setIsAuthLoading(false);
      }
    });

    return () => {
      console.log("[Auth Debug] useEffect cleanup: unsubscribing...");
      subscription.unsubscribe();
    };
  }, []);

  // Update specific chat content locally or in the DB
  const updateChatContent = async (chatId: string, updatedMessages: Message[]) => {
    const lastMsg = updatedMessages[updatedMessages.length - 1];
    const previewText = lastMsg ? lastMsg.text : 'Empty reflection';
    
    // Auto-generate title from the first user message if title is default
    let updatedTitle = chats.find(c => c.id === chatId)?.title || 'New Reflection';
    if (updatedTitle === "Welcome Conversation" || updatedTitle === "New Conversation") {
      const firstUserMsg = updatedMessages.find(m => m.sender === 'user');
      if (firstUserMsg) {
        updatedTitle = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
      }
    }

    // Always update local state first so UI is immediately responsive
    setChats(prev => prev.map(c => c.id === chatId ? {
      ...c,
      title: updatedTitle,
      preview: previewText,
      messages: updatedMessages,
      date: 'Today'
    } : c));

    if (user) {
      try {
        // If the chat is the temporary local welcome chat ('c-welcome'), we need to insert it instead!
        if (chatId === 'c-welcome') {
          const { data, error } = await supabase
            .from('chats')
            .insert({
              user_id: user.id,
              title: updatedTitle,
              preview: previewText,
              messages: updatedMessages
            })
            .select()
            .single();
          if (!error && data) {
            // Replace local welcome chat with database row
            setChats(prev => prev.map(c => c.id === 'c-welcome' ? {
              id: data.id,
              title: data.title,
              preview: data.preview,
              messages: data.messages,
              date: 'Today',
              created_at: data.created_at
            } : c));
            setCurrentChatId(data.id);
          } else if (error) {
            console.error("Error creating chat in DB:", error);
          }
        } else {
          // Standard update
          const { error } = await supabase
            .from('chats')
            .update({
              title: updatedTitle,
              preview: previewText,
              messages: updatedMessages,
              updated_at: new Date().toISOString()
            })
            .eq('id', chatId);
          if (error) {
            console.error("Error updating chat in DB:", error);
          }
        }
      } catch (err) {
        console.error("Failed to sync chat to DB:", err);
      }
    } else {
      // Update in Local Storage for guest
      const updatedChatsList = chats.map(c => c.id === chatId ? {
        ...c,
        title: updatedTitle,
        preview: previewText,
        messages: updatedMessages,
        date: 'Today'
      } : c);
      localStorage.setItem('wwjd_local_chats', JSON.stringify(updatedChatsList));
    }
  };

  // Helper to extract keywords and select spiritual contents
  const getSpiritualContent = (messagesList: Message[]) => {
    const allText = messagesList.map(m => m.text.toLowerCase()).join(' ');
    
    // Find matching verse card
    let selectedVerse = DEFAULT_VERSE;
    for (const item of SCRIPTURE_VERSES) {
      if (item.keywords.some(kw => allText.includes(kw))) {
        selectedVerse = { reference: item.reference, text: item.text };
        break;
      }
    }
    
    // Select reflection affirmation
    let selectedAffirmation = AFFIRMATIONS[0];
    if (allText.includes('work') || allText.includes('career') || allText.includes('tired') || allText.includes('job')) {
      selectedAffirmation = AFFIRMATIONS[2];
    } else if (allText.includes('anxious') || allText.includes('worry') || allText.includes('fear') || allText.includes('afraid')) {
      selectedAffirmation = AFFIRMATIONS[1];
    } else if (allText.includes('angry') || allText.includes('frustrat') || allText.includes('mad')) {
      selectedAffirmation = AFFIRMATIONS[3];
    }
    
    // Select guided prayer prompt
    let selectedPrayer = PRAYERS[0];
    if (allText.includes('tired') || allText.includes('weary') || allText.includes('overwhelm') || allText.includes('exhausted')) {
      selectedPrayer = PRAYERS[2];
    } else if (allText.includes('angry') || allText.includes('work') || allText.includes('job') || allText.includes('boss')) {
      selectedPrayer = PRAYERS[1];
    }
    
    return { verse: selectedVerse, affirmation: selectedAffirmation, prayer: selectedPrayer };
  };

  // Triggered after a user successfully logs in to run any actions they clicked on as a guest
  const runPendingAction = (_userId: string, targetChats: PastChat[], chatId: string | null) => {
    if (!pendingAction) return;

    // Retrieve active messages
    const targetChat = targetChats.find(c => c.id === chatId) || targetChats[0];
    const currentMessages = targetChat ? targetChat.messages : [];

    const content = getSpiritualContent(currentMessages);

    if (pendingAction === "Create Affirmation") {
      setCardAffirmation(content.affirmation);
      setActiveModal('affirmation');
    } else if (pendingAction === "Create Verse Card") {
      setCardVerse(content.verse);
      setActiveModal('verse');
    } else if (pendingAction === "Save Reflection") {
      showToast("Reflection successfully saved to your profile!");
    } else if (pendingAction === "Prayer Prompt") {
      setCardPrayer(content.prayer);
      setActiveModal('prayer');
    } else if (pendingAction === "Invite Someone") {
      setActiveModal('invite');
    }

    setPendingAction(null);
  };

  // Handle Authentication submit: Email + Password (Sign-in / Sign-up)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        // Sign Up Flow
        if (!authUsername.trim()) {
          throw new Error("Username is required.");
        }
        
        // Check if username is already taken in our profiles table
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', authUsername.trim())
          .maybeSingle();
        
        if (existingUser) {
          throw new Error("Username is already taken.");
        }

        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              username: authUsername.trim()
            }
          }
        });

        if (error) throw error;
        
        if (data.user) {
          showToast("Account created successfully!");
          setShowAuthOverlay(false);
          
          // Re-load auth states
          setUser(data.user);
          await fetchProfile(data.user.id);
          await syncLocalChatsToDb(data.user.id);
          
          // Read updated chats from DB to locate the active one
          const { data: updatedChats } = await supabase.from('chats').select('*').eq('user_id', data.user.id).order('updated_at', { ascending: false });
          const mapped: PastChat[] = (updatedChats || []).map(item => ({
            id: item.id,
            title: item.title,
            preview: item.preview,
            messages: item.messages,
            date: formatChatDate(item.updated_at || item.created_at)
          }));
          setChats(mapped);
          
          if (mapped.length > 0) {
            setCurrentChatId(mapped[0].id);
            runPendingAction(data.user.id, mapped, mapped[0].id);
          } else {
            runPendingAction(data.user.id, [], null);
          }
        }
      } else {
        // Sign In Flow
        let finalEmail = authEmail;

        // If the email field doesn't look like an email, assume it is a username and resolve it
        if (!authEmail.includes('@')) {
          const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', authEmail.trim())
            .maybeSingle();
          
          if (error || !data) {
            throw new Error("Username not found. Please register or enter your email address.");
          }
          finalEmail = data.email;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: finalEmail,
          password: authPassword
        });

        if (error) throw error;

        if (data.user) {
          showToast("Welcome back!");
          setShowAuthOverlay(false);
          setUser(data.user);
          await fetchProfile(data.user.id);
          await syncLocalChatsToDb(data.user.id);

          // Get latest synced database chats
          const { data: updatedChats } = await supabase.from('chats').select('*').eq('user_id', data.user.id).order('updated_at', { ascending: false });
          const mapped: PastChat[] = (updatedChats || []).map(item => ({
            id: item.id,
            title: item.title,
            preview: item.preview,
            messages: item.messages,
            date: formatChatDate(item.updated_at || item.created_at)
          }));
          setChats(mapped);
          
          if (mapped.length > 0) {
            setCurrentChatId(mapped[0].id);
            runPendingAction(data.user.id, mapped, mapped[0].id);
          } else {
            runPendingAction(data.user.id, [], null);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "An authentication error occurred.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message || "Could not launch Google Sign In.");
    }
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsProfileOpen(false);
    showToast("Signed out successfully.");
    
    // Clear state and reload guest welcome
    setChats([]);
    loadChats(null);
  };

  // Dynamic textarea height adjustment
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 192;
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  // Audio Recording Handlers
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
        
        setIsTranscribing(true);
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
            setShouldPulse(true);
            setTimeout(() => {
              setShouldPulse(false);
            }, 1500);
          }
        } catch (err) {
          console.error("Transcription error:", err);
          alert("Could not transcribe audio. Please type your situation manually.");
        } finally {
          setIsTyping(false);
          setIsTranscribing(false);
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

  // Auto-scroll messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle Send action
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const currentChat = activeChat;
    const userMessageText = inputText.trim();

    const newUserMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: userMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...currentChat.messages, newUserMessage];
    setInputText("");
    setIsTyping(true);

    // Update in memory & DB / local storage
    await updateChatContent(currentChat.id, updatedMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
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
        await updateChatContent(currentChat.id, [...updatedMessages, newAiMessage]);
      } else {
        throw new Error('Missing text in API response');
      }
    } catch (err) {
      console.warn("API request failed, falling back to mock response:", err);
      setTimeout(async () => {
        const randomResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
        const newAiMessage: Message = {
          id: Date.now() + 1,
          sender: 'ai',
          text: randomResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        await updateChatContent(currentChat.id, [...updatedMessages, newAiMessage]);
        setIsTyping(false);
      }, 1200 + Math.random() * 1000);
      return;
    }

    setIsTyping(false);
  };

  // Route protection checker & menu operations
  const handleMenuClick = (label: string) => {
    setIsMenuOpen(false);

    if (label === "Start New Conversation") {
      const defaultChat: PastChat = {
        id: user ? crypto.randomUUID() : 'c-' + Date.now(),
        title: "New Conversation",
        date: "Today",
        preview: "Welcome to this quiet space. What troubles your spirit?",
        messages: [
          {
            id: Date.now(),
            sender: 'ai',
            text: "Welcome to this quiet space. As we seek His guidance, trust that the Lord's gentle whispers can find us anywhere—even reaching through the intricate threads of the quantum network to touch your heart today. What troubles your spirit?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ],
        created_at: new Date().toISOString()
      };

      setChats(prev => [defaultChat, ...prev]);
      setCurrentChatId(defaultChat.id);
      
      if (user) {
        // Save to Supabase immediately
        supabase.from('chats').insert({
          id: defaultChat.id,
          user_id: user.id,
          title: defaultChat.title,
          preview: defaultChat.preview,
          messages: defaultChat.messages
        }).then(({ error }) => {
          if (error) console.error("Error creating chat in DB:", error);
        });
      } else {
        // Save to guest storage
        localStorage.setItem('wwjd_local_chats', JSON.stringify([defaultChat, ...chats]));
      }
      return;
    }

    // Protection logic for other menu features
    if (!user) {
      setPendingAction(label);
      setAuthMode('signin');
      setAuthError(null);
      setShowAuthOverlay(true);
      return;
    }

    // Executing protected features when logged in
    const content = getSpiritualContent(messages);

    if (label === "Create Affirmation") {
      setCardAffirmation(content.affirmation);
      setActiveModal('affirmation');
    } else if (label === "Create Verse Card") {
      setCardVerse(content.verse);
      setActiveModal('verse');
    } else if (label === "Save Reflection") {
      showToast("Reflection successfully saved to your profile!");
    } else if (label === "Prayer Prompt") {
      setCardPrayer(content.prayer);
      setActiveModal('prayer');
    } else if (label === "Invite Someone") {
      setActiveModal('invite');
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center w-full h-[100dvh] bg-[#EFECE6] font-sans text-[#4A4036] p-0 sm:p-4 md:p-8 overflow-hidden">
        <div className="flex flex-col items-center justify-center w-full h-full max-w-md bg-[#FAF8F5] sm:h-[800px] sm:max-h-[90dvh] sm:rounded-[40px] shadow-2xl overflow-hidden border border-[#E5E0D8] space-y-4">
          <CrossIcon className="w-16 h-16 text-[#8B7D6B] animate-pulse" />
          <p className="text-[13px] font-semibold text-[#8B7D6B] uppercase tracking-wider animate-pulse">Entering the Sanctuary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full h-[100dvh] bg-[#EFECE6] font-sans text-[#4A4036] p-0 sm:p-4 md:p-8 overflow-hidden">
      
      {/* Dynamic Visual Toast Notification */}
      {toastMessage && (
        <div className="fixed top-8 z-[60] bg-[#8B7D6B] text-white font-medium text-xs tracking-wide px-5 py-3 rounded-full shadow-lg border border-white/20 animate-slide-up select-none">
          {toastMessage}
        </div>
      )}

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
            <p className="text-xs text-[#8B7D6B] mt-1 font-medium">
              {user ? "Your journey of seeking Him" : "Current guest session"}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-[#FAF8F5] to-[#EFECE6]/30">
            {isChatsLoading && (
              <div className="flex items-center justify-center space-x-2 py-3 text-[#8B7D6B] animate-pulse">
                <div className="w-3.5 h-3.5 border-2 border-[#8B7D6B] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[11px] font-semibold uppercase tracking-wider">Syncing reflections...</span>
              </div>
            )}
            {chats.map((chat) => (
              <button 
                key={chat.id}
                onClick={() => {
                  setCurrentChatId(chat.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left p-4 rounded-[24px] rounded-bl-[8px] border transition-all duration-300 group ${
                  chat.id === activeChat.id
                    ? 'bg-[#EFECE6]/60 border-[#DED7CD] shadow-sm font-medium'
                    : 'bg-white border-transparent hover:border-[#E5E0D8] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-baseline mb-1.5">
                  <h3 className="font-semibold text-[#4A4036] text-[13.5px] truncate pr-3">{chat.title}</h3>
                  <span className="text-[10px] text-[#A69C8E] flex-shrink-0 font-medium tracking-wide">{chat.date}</span>
                </div>
                <div className="flex justify-between items-end gap-3">
                  <p className="text-[12px] text-[#8B7D6B] line-clamp-2 leading-relaxed group-hover:text-[#6D6253] transition-colors">{chat.preview}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Sidebar Footer - User Profile or Auth Trigger */}
          <div className="p-4 border-t border-[#F0EBE1] bg-white">
            {user ? (
              <button 
                onClick={() => {
                  setIsProfileOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-[20px] hover:bg-[#F0EBE1]/50 text-left transition-all duration-300 group"
              >
                <img 
                  src={profile?.avatar_url || "https://i.pravatar.cc/150?img=60"} 
                  alt="user avatar" 
                  className="w-10 h-10 rounded-full object-cover border border-[#E5E0D8] group-hover:scale-105 transition-transform" 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#4A4036] truncate">{profile?.username || "Seeker"}</p>
                  <p className="text-[11px] text-[#A69C8E] truncate">{profile?.email || ""}</p>
                </div>
                <svg className="w-5 h-5 text-[#A69C8E] group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button 
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError(null);
                  setShowAuthOverlay(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full py-3 bg-[#8B7D6B] hover:bg-[#6D6253] text-white font-semibold text-[13.5px] rounded-[20px] shadow transition-all active:scale-[0.98]"
              >
                Sign In to Save Reflections
              </button>
            )}
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
                    p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0" {...props} />,
                    ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                    ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                    li: ({ node, ...props }: any) => <li className="text-[14.5px]" {...props} />,
                    strong: ({ node, ...props }: any) => <strong className="font-bold" {...props} />,
                    em: ({ node, ...props }: any) => <em className="italic" {...props} />,
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
            className={`
              flex items-end bg-white border rounded-[32px] p-2 shadow-sm focus-within:ring-2 focus-within:ring-[#DED7CD] focus-within:border-transparent transition-all
              ${shouldPulse 
                ? 'animate-heavenly-burst' 
                : 'border-[#E5E0D8]'
              }
            `}
          >
            <button
              type="button"
              disabled={isTranscribing}
              onClick={handleMicClick}
              className={`p-3 rounded-full flex-shrink-0 transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse shadow-md scale-105' 
                  : isTranscribing
                    ? 'bg-[#FAF8F5] text-[#8B7D6B] cursor-not-allowed'
                    : 'bg-transparent text-[#8B7D6B] hover:bg-[#F0EBE1]'
              }`}
              title={isRecording ? "Stop recording" : isTranscribing ? "Transcribing speech..." : "Whisper with voice"}
            >
              <MicIcon className={`w-5 h-5 ${isTranscribing ? 'animate-spin' : ''}`} />
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
            ) : isTranscribing ? (
              <div className="flex-1 flex flex-col justify-center space-y-1.5 px-4 h-[44px]">
                <div className="h-2 bg-[#F0EBE1] rounded-full w-3/4 animate-pulse"></div>
                <div className="h-2 bg-[#F0EBE1] rounded-full w-1/2 animate-pulse" style={{ animationDelay: '150ms' }}></div>
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
              disabled={!inputText.trim() || isTyping || isRecording || isTranscribing}
              className={`
                p-3 rounded-full ml-2 mb-0.5 flex-shrink-0 transition-all duration-300
                ${inputText.trim() && !isTyping && !isRecording && !isTranscribing
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
                    src={profile?.avatar_url || "https://i.pravatar.cc/150?img=60"} 
                    alt={profile?.username || "Seeker"} 
                    className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md"
                  />
                </div>
                <h3 className="text-xl font-bold text-[#4A4036] mt-4">{profile?.username || "Seeker"}</h3>
                <p className="text-xs text-[#8B7D6B] font-medium mt-1">
                  Member since {profile ? new Date(profile.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' }) : "Today"}
                </p>
              </div>

              {/* Spiritual Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-[20px] border border-[#F0EBE1] text-center shadow-sm">
                  <p className="text-2xl font-bold text-[#8B7D6B]">{chats.filter(c => c.messages.some(m => m.sender === 'user')).length}</p>
                  <p className="text-[11px] text-[#A69C8E] uppercase tracking-wider font-semibold mt-1">Reflections</p>
                </div>
                <div className="bg-white p-4 rounded-[20px] border border-[#F0EBE1] text-center shadow-sm">
                  <p className="text-2xl font-bold text-[#8B7D6B]">
                    {chats.reduce((acc, c) => acc + c.messages.filter(m => m.sender === 'user').length, 0)}
                  </p>
                  <p className="text-[11px] text-[#A69C8E] uppercase tracking-wider font-semibold mt-1">Whispered Prayers</p>
                </div>
              </div>

              {/* Profile Info Details */}
              <div className="bg-white rounded-[24px] border border-[#F0EBE1] p-5 space-y-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                <div>
                  <label className="text-[11px] text-[#A69C8E] uppercase tracking-wider font-bold">Display Name</label>
                  <p className="text-[15px] font-medium text-[#4A4036] mt-1 border-b border-[#F0EBE1]/60 pb-2">{profile?.username || "Seeker"}</p>
                </div>
                <div>
                  <label className="text-[11px] text-[#A69C8E] uppercase tracking-wider font-bold">Email Address</label>
                  <p className="text-[15px] font-medium text-[#4A4036] mt-1 border-b border-[#F0EBE1]/60 pb-2">{profile?.email || "Guest Session"}</p>
                </div>
              </div>

              {/* Sign Out Action Button */}
              <div className="pt-4">
                <button 
                  onClick={handleSignOut}
                  className="w-full py-4 bg-[#F0EBE1] hover:bg-[#E5E0D8] text-[#8B7D6B] font-semibold text-[14.5px] rounded-[24px] transition-all duration-300"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auth Page Overlay */}
        {showAuthOverlay && (
          <div className="absolute inset-0 bg-[#FAF8F5] z-50 flex flex-col animate-slide-up">
            <header className="flex items-center px-6 py-5 border-b border-[#F0EBE1] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-10">
              <button 
                onClick={() => {
                  setShowAuthOverlay(false);
                  setPendingAction(null);
                  setAuthError(null);
                }}
                className="p-2 -ml-2 text-[#8B7D6B] hover:text-[#4A4036] transition-colors rounded-full hover:bg-[#F0EBE1]"
                aria-label="Go back"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-[#4A4036] ml-2">
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </h2>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-center bg-gradient-to-b from-[#FAF8F5] to-[#EFECE6]/30">
              <div className="flex flex-col items-center text-center space-y-2 mb-4">
                <CrossIcon className="w-12 h-12 text-[#8B7D6B] animate-pulse" />
                <h3 className="text-2xl font-bold text-[#4A4036]">Join the Sanctuary</h3>
                <p className="text-xs text-[#8B7D6B] max-w-xs leading-relaxed">
                  Sign in to save your reflection journey and access premium spiritual toolcards.
                </p>
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-[16px] animate-fade-in flex items-center space-x-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="text-[10px] text-[#A69C8E] uppercase tracking-wider font-bold block mb-1">Username</label>
                    <input 
                      type="text"
                      required
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      placeholder="e.g. grace_seeker"
                      className="w-full px-4 py-3 rounded-[16px] border border-[#E5E0D8] bg-white outline-none focus:ring-2 focus:ring-[#DED7CD] focus:border-transparent text-[#4A4036] text-[14.5px] transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-[#A69C8E] uppercase tracking-wider font-bold block mb-1">
                    {authMode === 'signin' ? 'Email or Username' : 'Email Address'}
                  </label>
                  <input 
                    type="text"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder={authMode === 'signin' ? "seeker@example.com or grace_seeker" : "seeker@example.com"}
                    className="w-full px-4 py-3 rounded-[16px] border border-[#E5E0D8] bg-white outline-none focus:ring-2 focus:ring-[#DED7CD] focus:border-transparent text-[#4A4036] text-[14.5px] transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#A69C8E] uppercase tracking-wider font-bold block mb-1">Password</label>
                  <input 
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-[16px] border border-[#E5E0D8] bg-white outline-none focus:ring-2 focus:ring-[#DED7CD] focus:border-transparent text-[#4A4036] text-[14.5px] transition-all"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 mt-2 bg-[#8B7D6B] hover:bg-[#6D6253] text-white font-semibold text-[14.5px] rounded-[24px] shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex justify-center items-center"
                >
                  {authLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    authMode === 'signin' ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[#F0EBE1]"></div>
                <span className="flex-shrink mx-4 text-[#A69C8E] text-[10px] uppercase font-bold tracking-wider">or</span>
                <div className="flex-grow border-t border-[#F0EBE1]"></div>
              </div>

              {/* Google OAuth Button */}
              <button 
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-3.5 bg-white border border-[#E5E0D8] hover:bg-[#FAF8F5] text-[#4A4036] font-semibold text-[14.5px] rounded-[24px] shadow-sm hover:shadow active:scale-[0.99] transition-all flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Sign In with Google</span>
              </button>

              <div className="text-center pt-2">
                <button 
                  onClick={() => {
                    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                    setAuthError(null);
                  }}
                  className="text-xs text-[#8B7D6B] hover:text-[#4A4036] font-semibold underline underline-offset-4 transition-colors"
                >
                  {authMode === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
              </div>

              <div className="text-center pt-4 border-t border-[#F0EBE1]/60">
                <button 
                  onClick={() => {
                    setShowAuthOverlay(false);
                    setPendingAction(null);
                    setAuthError(null);
                  }}
                  className="text-[11px] text-[#A69C8E] uppercase tracking-wider font-bold hover:text-[#8B7D6B] transition-colors"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Extra Spiritual Features Overlay Modals */}
        {activeModal && (
          <div className="absolute inset-0 bg-[#4A4036]/40 backdrop-blur-sm z-[55] flex items-center justify-center p-6 animate-slide-up">
            <div className="w-full max-w-sm bg-gradient-to-tr from-[#FAF5EF] via-[#FDFBF7] to-[#F5EFE6] rounded-[32px] border border-[#E5E0D8] shadow-2xl p-6 relative flex flex-col items-center text-center">
              
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-2 text-[#A69C8E] hover:text-[#4A4036] transition-colors rounded-full hover:bg-[#F0EBE1]"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {activeModal === 'affirmation' && (
                <div className="space-y-5 py-4 w-full">
                  <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center border border-amber-200/50 shadow-sm mx-auto">
                    <HeartIcon className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-[#4A4036] tracking-tight">Heavenly Affirmation</h3>
                  <div className="bg-white/80 backdrop-blur-sm border border-[#F0EBE1] rounded-[24px] p-6 shadow-inner relative">
                    <span className="absolute -top-3 left-4 px-2 py-0.5 bg-[#8B7D6B] text-white text-[9px] font-bold tracking-wider rounded uppercase">I am guided</span>
                    <p className="text-[15px] italic text-[#6D6253] leading-relaxed font-serif pt-1">
                      "{cardAffirmation}"
                    </p>
                  </div>
                  <p className="text-[10px] text-[#A69C8E] uppercase tracking-wider font-semibold">
                    Let this truth sink into your spirit today.
                  </p>
                  <div className="flex space-x-3 pt-2">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(cardAffirmation || '');
                        showToast("Affirmation copied!");
                        setActiveModal(null);
                      }}
                      className="flex-1 py-3 bg-[#8B7D6B] hover:bg-[#6D6253] text-white text-[13px] font-semibold rounded-[20px] shadow transition-all active:scale-95"
                    >
                      Copy Affirmation
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'verse' && (
                <div className="space-y-5 py-4 w-full">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center border border-blue-200/50 shadow-sm mx-auto">
                    <BookIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-[#4A4036] tracking-tight">Scripture Verse</h3>
                  <div className="bg-white/80 backdrop-blur-sm border border-[#F0EBE1] rounded-[24px] p-6 shadow-inner relative">
                    <span className="absolute -top-3 left-4 px-2 py-0.5 bg-[#8B7D6B] text-white text-[9px] font-bold tracking-wider rounded uppercase">{cardVerse?.reference}</span>
                    <p className="text-[15px] text-[#6D6253] leading-relaxed font-serif pt-1">
                      "{cardVerse?.text}"
                    </p>
                  </div>
                  <p className="text-[10px] text-[#A69C8E] uppercase tracking-wider font-semibold">
                    A lamp unto your feet and a light unto your path.
                  </p>
                  <div className="flex space-x-3 pt-2">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`"${cardVerse?.text}" - ${cardVerse?.reference}`);
                        showToast("Verse card copied!");
                        setActiveModal(null);
                      }}
                      className="flex-1 py-3 bg-[#8B7D6B] hover:bg-[#6D6253] text-white text-[13px] font-semibold rounded-[20px] shadow transition-all active:scale-95"
                    >
                      Copy Verse Card
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'prayer' && (
                <div className="space-y-5 py-4 w-full">
                  <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center border border-purple-200/50 shadow-sm mx-auto">
                    <SparkleIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-[#4A4036] tracking-tight">Guided Prayer Prompt</h3>
                  <div className="bg-white/80 backdrop-blur-sm border border-[#F0EBE1] rounded-[24px] p-6 shadow-inner max-h-[180px] overflow-y-auto relative text-left">
                    <span className="absolute -top-3 left-4 px-2 py-0.5 bg-[#8B7D6B] text-white text-[9px] font-bold tracking-wider rounded uppercase">Spoken Prayer</span>
                    <p className="text-[14px] text-[#6D6253] leading-relaxed whitespace-pre-line pt-1">
                      {cardPrayer}
                    </p>
                  </div>
                  <p className="text-[10px] text-[#A69C8E] uppercase tracking-wider font-semibold text-center">
                    Read these words in quiet contemplation, or speak them aloud.
                  </p>
                  <div className="flex space-x-3 pt-2">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(cardPrayer || '');
                        showToast("Prayer copied!");
                        setActiveModal(null);
                      }}
                      className="flex-1 py-3 bg-[#8B7D6B] hover:bg-[#6D6253] text-white text-[13px] font-semibold rounded-[20px] shadow transition-all active:scale-95"
                    >
                      Copy Prayer
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'invite' && (
                <div className="space-y-5 py-4 w-full">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center border border-green-200/50 shadow-sm mx-auto">
                    <ShareIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-[#4A4036] tracking-tight">Invite Someone</h3>
                  <p className="text-[13.5px] text-[#8B7D6B] leading-relaxed">
                    Share this sanctuary of quiet reflection and biblical guidance with family, friends, or coworkers.
                  </p>
                  <div className="bg-white border border-[#E5E0D8] rounded-[16px] p-3 text-[12.5px] font-mono text-[#6D6253] break-all select-all">
                    {window.location.origin}
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin);
                        showToast("Invitation link copied!");
                        setActiveModal(null);
                      }}
                      className="flex-1 py-3 bg-[#8B7D6B] hover:bg-[#6D6253] text-white text-[13px] font-semibold rounded-[20px] shadow transition-all active:scale-95"
                    >
                      Copy Invitation Link
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
