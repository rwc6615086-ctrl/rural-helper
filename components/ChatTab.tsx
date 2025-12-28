
import React, { useState, useEffect, useRef } from 'react';
import { History, Save, Trash2, SmilePlus, Send, X, Mic, MicOff } from 'lucide-react';
import { Message, ChatSession } from '../types';
import { streamChatResponse } from '../services/geminiService';

const ChatTab: React.FC = () => {
  const QUESTIONS_KIDS = [
    "🎈 爸爸妈妈什么时候回来？",
    "🤐 我不敢和同学说话...",
    "💪 别人都说我笨，我是吗？",
    "😡 我好生气，想摔东西！",
    "🌙 晚上黑黑的，我好害怕",
    "🏫 我不想去上学...",
  ];

  const QUESTIONS_TEENS = [
    "📱 总是想玩手机停不下来",
    "💔 感觉没人理解我，很孤独",
    "📚 学习压力好大，想放弃",
    "👫 怎么处理和同学的矛盾？",
    "👵 爷爷奶奶太啰嗦了，很烦",
    "🎯 我对未来很迷茫...",
  ];

  const QUESTIONS_LEFTBEHIND = [
    "☎️ 爸爸妈妈是不是不爱我了？",
    "🏠 为什么别人都有爸妈接送？",
    "👵 和爷爷奶奶有代沟怎么办？",
    "🎒 想要新书包不敢跟爸妈说",
    "🤕 生病了好想妈妈...",
    "🍰 只能在电话里过生日吗？",
  ];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: '小朋友/同学你好呀！我是**康康老师**。🌻\n\n不论是开心还是难过的事情，你都可以悄悄告诉我。我会像大树洞一样守护你的秘密，也会像好朋友一样陪着你哦！',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeQuestionTab, setActiveQuestionTab] = useState<'kids' | 'teens' | 'leftbehind'>('kids');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Voice Input Refs
  const [isListening, setIsListening] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        // Fix dates from JSON
        const hydrated = parsed.map((s: any) => ({
          ...s,
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
        setSessions(hydrated);
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleVoiceInput = () => {
    // 1. Check for Protocol Restriction (Security)
    if (window.location.protocol === 'file:') {
      alert(
        "⚠️ 浏览器安全限制：\n\n" +
        "出于安全原因，现代浏览器禁止在本地文件 (file://) 中访问麦克风。\n\n" +
        "解决方法：\n" +
        "请使用本地服务器运行 (如 `npm start`, `python -m http.server`) 或部署到 HTTPS 网站。"
      );
      return;
    }

    // 2. Check for Browser Support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("抱歉，您的浏览器不支持语音输入功能。建议使用最新版 Chrome、Edge 或 Safari 浏览器。");
      return;
    }

    // 3. Lazy Initialization (Must be triggered by user gesture)
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Stop after one sentence
      recognition.lang = 'zh-CN';
      recognition.interimResults = true; // Show results while speaking

      recognition.onstart = () => {
        setIsListening(true);
        showToast("🎙️ 语音输入已开启");
      };

      recognition.onend = () => {
        setIsListening(false);
        showToast("✅ 语音输入已结束");
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        // Loop through results to differentiate interim vs final
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInput(prev => prev + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          alert("需要麦克风权限才能使用语音输入。\n\n请检查浏览器设置（通常在地址栏左侧），并允许本网站访问麦克风。");
        } else if (event.error === 'network') {
          showToast("❌ 网络错误，请检查连接");
        } else if (event.error === 'no-speech') {
          showToast("🔕 未检测到声音");
        }
      };

      recognitionRef.current = recognition;
    }

    // 4. Toggle Logic
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start recognition:", e);
        // If it was already started but state was out of sync
        recognitionRef.current.stop();
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveCurrentSession = () => {
    if (messages.length <= 1) return;
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: messages[1]?.content.slice(0, 20) + (messages[1]?.content.length > 20 ? '...' : '') || '新对话',
      messages: messages,
      date: new Date().toLocaleDateString()
    };
    const updatedSessions = [newSession, ...sessions].slice(0, 20);
    setSessions(updatedSessions);
    localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
    alert("对话已保存到历史记录！");
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setShowHistory(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('chatSessions', JSON.stringify(updated));
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'model', content: '', timestamp: new Date() }]);

    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }));
      let fullResponse = "";
      await streamChatResponse(history, text, (chunk) => {
        fullResponse += chunk;
        setMessages(prev => prev.map(msg => msg.id === aiMsgId ? { ...msg, content: fullResponse } : msg));
      });
    } catch (error) {
      setMessages(prev => prev.map(msg => msg.id === aiMsgId ? { ...msg, content: "哎呀，信号好像迷路了，请稍后再试一试哦。" } : msg));
    } finally {
      setIsLoading(false);
    }
  };

  const getQuestions = () => {
    switch (activeQuestionTab) {
      case 'teens': return QUESTIONS_TEENS;
      case 'leftbehind': return QUESTIONS_LEFTBEHIND;
      default: return QUESTIONS_KIDS;
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-white rounded-[32px] shadow-xl border-4 border-indigo-50 overflow-hidden relative">
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] pointer-events-none"></div>
      
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gray-800/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm shadow-lg z-50 animate-bounce-soft flex items-center gap-2">
          {toast}
        </div>
      )}

      {showHistory && (
        <div className="absolute inset-y-0 left-0 w-72 bg-white z-40 shadow-2xl border-r border-indigo-100 flex flex-col animate-in slide-in-from-left duration-300">
          <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
            <h3 className="font-bold text-indigo-900 flex items-center gap-2"><History className="w-5 h-5" /> 历史记录</h3>
            <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-indigo-200 rounded-full transition-colors"><X className="w-5 h-5 text-indigo-600" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sessions.length === 0 ? <p className="text-gray-400 text-sm text-center mt-10">暂无保存的对话</p> : sessions.map(s => (
              <div key={s.id} onClick={() => loadSession(s)} className="p-3 bg-white border border-gray-100 rounded-xl hover:border-indigo-300 hover:shadow-md cursor-pointer group transition-all">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs text-indigo-400 font-bold">{s.date}</span>
                  <button onClick={(e) => deleteSession(e, s.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-400 rounded-full"><Trash2 className="w-3 h-3" /></button>
                </div>
                <p className="text-sm text-gray-700 font-medium line-clamp-2">{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-gradient-to-r from-sky-400 to-indigo-500 px-6 py-4 flex justify-between items-center z-10 shadow-md">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl border-2 border-white/50 shadow-lg">🐻</div>
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse"></span>
          </div>
          <div className="text-white">
            <h3 className="font-black text-lg tracking-wide">康康老师</h3>
            <p className="text-indigo-100 text-xs font-medium opacity-90">你的知心好朋友</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={saveCurrentSession} className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all backdrop-blur-sm active:scale-95" title="保存当前对话"><Save className="w-5 h-5" /></button>
          <button onClick={() => setShowHistory(!showHistory)} className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all backdrop-blur-sm active:scale-95 relative" title="历史记录"><History className="w-5 h-5" />{sessions.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full"></span>}</button>
          <button onClick={() => setMessages([messages[0]])} className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all backdrop-blur-sm active:scale-95" title="清空记录"><Trash2 className="w-5 h-5" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative custom-scrollbar bg-slate-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-2 shadow-sm border-2 ${msg.role === 'model' ? 'bg-indigo-100 border-indigo-200 text-xl' : 'bg-amber-100 border-amber-200'}`}>
                {msg.role === 'model' ? '🐻' : <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=ffdfbf" alt="Me" className="w-8 h-8 rounded-full" />}
              </div>
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-6 py-4 text-[15px] shadow-sm font-medium ${msg.role === 'user' ? 'bg-amber-400 text-amber-950 rounded-[24px] rounded-tr-md' : 'bg-white border-2 border-indigo-50 text-slate-700 rounded-[24px] rounded-tl-md'}`}>
                  {msg.content ? <div className="whitespace-pre-wrap leading-loose tracking-wide prose-p:my-2">{msg.content}</div> : <div className="flex space-x-1.5 h-6 items-center px-2"><div className="w-2.5 h-2.5 bg-indigo-300 rounded-full animate-bounce"></div><div className="w-2.5 h-2.5 bg-indigo-300 rounded-full animate-bounce delay-100"></div><div className="w-2.5 h-2.5 bg-indigo-300 rounded-full animate-bounce delay-200"></div></div>}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="bg-white p-4 z-20 border-t-2 border-indigo-50 relative">
        {messages.length < 5 && (
          <div className="mb-4 w-full">
            <div className="flex gap-2 mb-2 px-1 overflow-x-auto pb-1 scrollbar-hide">
               <button onClick={() => setActiveQuestionTab('kids')} className={`flex-shrink-0 text-xs font-bold px-3 py-1 rounded-full transition-all ${activeQuestionTab === 'kids' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>👶 儿童话题</button>
               <button onClick={() => setActiveQuestionTab('teens')} className={`flex-shrink-0 text-xs font-bold px-3 py-1 rounded-full transition-all ${activeQuestionTab === 'teens' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>🧑 青少年话题</button>
               <button onClick={() => setActiveQuestionTab('leftbehind')} className={`flex-shrink-0 text-xs font-bold px-3 py-1 rounded-full transition-all ${activeQuestionTab === 'leftbehind' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>🏠 留守儿童专区</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-2 px-1">
               {getQuestions().map((q, i) => (
                  <button key={i} onClick={() => handleSend(q)} className="text-xs font-bold bg-white border-2 border-indigo-100 text-indigo-600 px-3 py-2.5 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm hover:-translate-y-0.5 text-left leading-tight">{q}</button>
                ))}
            </div>
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-end gap-2 bg-gray-50 p-2.5 rounded-[24px] border-2 border-indigo-100 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
          <button 
            type="button" 
            onClick={toggleVoiceInput}
            className={`p-2 rounded-full transition-all shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-indigo-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
            title="语音输入"
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder={isListening ? "正在聆听..." : "在这里输入你想说的话..."} 
            className="flex-1 bg-transparent border-none text-gray-800 placeholder-gray-400 px-2 py-3 focus:ring-0 max-h-32 focus:outline-none text-base font-medium min-w-0" 
            disabled={isLoading} 
            autoFocus 
          />
          <button type="submit" disabled={!input.trim() || isLoading} className="mb-0.5 p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:shadow-lg disabled:opacity-50 disabled:shadow-none btn-bouncy transition-all shrink-0"><Send className="w-5 h-5" /></button>
        </form>
      </div>
    </div>
  );
};

export default ChatTab;
