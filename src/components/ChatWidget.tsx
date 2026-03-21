import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [user, setUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const guestId = localStorage.getItem('guest_chat_id') || `guest_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('guest_chat_id', guestId);

    if (isOpen) {
      const chatId = user?.id || guestId;
      
      // Fetch initial messages
      const fetchMessages = async () => {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true })
          .limit(50);
        
        if (data) setMessages(data);
      };

      fetchMessages();

      // Subscribe to new messages
      const channel = supabase
        .channel(`chat:${chatId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const guestId = localStorage.getItem('guest_chat_id');
    const chatId = user?.id || guestId;
    const messageData = {
      chat_id: chatId,
      text: inputText,
      sender_id: user?.id || null, // UUID or null for guest
      sender_name: user?.user_metadata?.full_name || 'Visitor',
    };

    try {
      const { error } = await supabase
        .from('messages')
        .insert(messageData);
      
      if (error) throw error;
      setInputText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-80 h-96 rounded-2xl shadow-2xl border border-gray-200 flex flex-col mb-4 overflow-hidden"
          >
            <div className="bg-[#1a1a1a] p-4 flex justify-between items-center text-white">
              <div>
                <h3 className="font-medium text-sm">Sales Support</h3>
                <p className="text-[10px] opacity-70 uppercase tracking-widest">Online</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:opacity-70">
                <X size={20} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f9f9f9]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.sender_id === user?.id
                        ? 'bg-[#5A5A40] text-white rounded-tr-none'
                        : 'bg-white border border-gray-200 text-[#1a1a1a] rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 text-sm border-none focus:ring-0 bg-gray-50 rounded-full px-4 py-2"
              />
              <button type="submit" className="bg-[#1a1a1a] text-white p-2 rounded-full hover:bg-[#5A5A40] transition-colors">
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#1a1a1a] text-white p-4 rounded-full shadow-xl hover:bg-[#5A5A40] transition-all transform hover:scale-110"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
