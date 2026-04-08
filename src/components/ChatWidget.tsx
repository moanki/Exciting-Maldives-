import { useState, useEffect, useRef, useMemo } from 'react';
import { MessageCircle, X, Send, Phone } from 'lucide-react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';

// --- Hooks ---

function useChatSession() {
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const guestId = useMemo(() => {
    let id = localStorage.getItem('guest_chat_id');
    if (!id) {
      id = `guest_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guest_chat_id', id);
    }
    return id;
  }, []);

  const chatId = user?.id || guestId;

  return { user, chatId, isAuthReady };
}

function useChatMessages(chatId: string, isOpen: boolean) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !chatId) return;

    setLoading(true);
    
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) {
        console.error('Error fetching messages:', error);
      } else if (data) {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, chatId]);

  const sendMessage = async (text: string, user: any) => {
    if (!text.trim() || !chatId) return;

    const messageData = {
      chat_id: chatId,
      content: text.trim(),
      sender_id: user?.id || null,
      sender_type: user ? 'user' : 'guest',
      sender_name: user?.user_metadata?.full_name || 'Visitor',
    };

    const { error } = await supabase
      .from('messages')
      .insert(messageData);
    
    if (error) throw error;
  };

  return { messages, loading, sendMessage };
}

// --- Component ---

export default function ChatWidget({ settings }: { settings?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { user, chatId, isAuthReady } = useChatSession();
  const { messages, sendMessage } = useChatMessages(chatId, isOpen);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);
    try {
      await sendMessage(inputText, user);
      setInputText('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      setSendError(error.message || 'Failed to send message. Please try again.');
    }
  };

  const isOwnMessage = (msg: any) => {
    if (user) return msg.sender_id === user.id;
    return msg.sender_type === 'guest';
  };

  if (!isAuthReady) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-80 h-[450px] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            <div className="bg-brand-navy p-4 flex justify-between items-center text-white">
              <div>
                <h3 className="font-serif text-sm">Concierge Support</h3>
                <p className="text-[10px] opacity-70 uppercase tracking-widest font-sans">Always Available</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:opacity-70 transition-opacity">
                <X size={20} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-paper/30 scroll-smooth">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-12 h-12 bg-brand-teal/10 rounded-full flex items-center justify-center text-brand-teal">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-serif text-brand-navy">Welcome to Exciting Maldives</p>
                    <p className="text-xs text-brand-navy/50 font-sans mt-1">How can we assist your travel planning today?</p>
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm font-sans leading-relaxed ${
                      isOwnMessage(msg)
                        ? 'bg-brand-teal text-white rounded-tr-none shadow-sm'
                        : 'bg-white border border-gray-100 text-brand-navy rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.content}
                    <div className={`text-[9px] mt-1 opacity-50 ${isOwnMessage(msg) ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex flex-col gap-2">
              {sendError && (
                <div className="text-xs text-red-500 px-2">{sendError}</div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 text-sm border-none focus:ring-0 bg-gray-50 rounded-xl px-4 py-3 font-sans"
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim()}
                  className="bg-brand-navy text-white p-3 rounded-xl hover:bg-brand-teal transition-all disabled:opacity-30 disabled:hover:bg-brand-navy"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        {/* WhatsApp Floating Button */}
        {!isOpen && settings?.whatsapp?.enabled && settings?.whatsapp?.number && (
          <motion.a
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            href={`https://wa.me/${settings.whatsapp.number.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-[#128C7E] transition-colors self-end"
          >
            <Phone size={28} fill="currentColor" />
          </motion.a>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center self-end ${
            isOpen ? 'bg-brand-navy text-white' : 'bg-brand-teal text-white'
          }`}
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </button>
      </div>
    </div>
  );
}
