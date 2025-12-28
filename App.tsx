import React, { useState, useEffect } from 'react';
import { HeartHandshake, MessageCircle, Image as ImageIcon, BookOpen, HelpCircle } from 'lucide-react';
import ChatTab from './components/ChatTab';
import ImageGenTab from './components/ImageGenTab';
import MaterialsTab from './components/MaterialsTab';
import TutorialModal from './components/TutorialModal';

enum Tab {
  CHAT = 'chat',
  IMAGE = 'image',
  MATERIALS = 'materials'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) setShowTutorial(true);
  }, []);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  return (
    <div className="min-h-screen font-sans selection:bg-yellow-200 selection:text-yellow-900 pb-12">
      {showTutorial && <TutorialModal onClose={closeTutorial} />}
      <header className="bg-white/80 backdrop-blur-md border-b-2 border-indigo-50 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform"><HeartHandshake className="w-6 h-6" /></div>
              <div className="flex flex-col"><h1 className="text-2xl font-black text-gray-800 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">HeartGuard</h1><span className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">乡村少年心理成长站</span></div>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={() => setShowTutorial(true)} className="p-2 rounded-full text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="使用帮助"><HelpCircle className="w-6 h-6" /></button>
               <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border-2 border-green-100 text-green-700 text-xs font-bold shadow-sm"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div><span>安全连接中</span></div>
               <div className="w-10 h-10 rounded-full bg-yellow-200 border-4 border-white shadow-md overflow-hidden cursor-pointer hover:scale-105 transition-transform"><img src="https://api.dicebear.com/7.x/notionists/svg?seed=Kiddo&backgroundColor=ffdfbf" alt="User" /></div>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-white p-2 rounded-[24px] shadow-lg border-2 border-indigo-50 gap-2">
            {[
              { id: Tab.CHAT, label: '找康康聊天', icon: MessageCircle, color: 'text-sky-500', activeBg: 'bg-sky-100' },
              { id: Tab.IMAGE, label: '小小画室', icon: ImageIcon, color: 'text-amber-500', activeBg: 'bg-amber-100' },
              { id: Tab.MATERIALS, label: '成长日记', icon: BookOpen, color: 'text-emerald-500', activeBg: 'bg-emerald-100' },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === tab.id ? `${tab.activeBg} ${tab.color} scale-105 shadow-sm` : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}><tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'fill-current' : ''}`} />{tab.label}</button>
            ))}
          </div>
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          {activeTab === Tab.CHAT && <ChatTab />}
          {activeTab === Tab.IMAGE && <ImageGenTab />}
          {activeTab === Tab.MATERIALS && <MaterialsTab />}
        </div>
      </main>
      <footer className="max-w-6xl mx-auto px-4 py-8 text-center">
        <div className="inline-block bg-white/60 backdrop-blur px-6 py-3 rounded-full border border-white shadow-sm"><p className="text-xs font-bold text-gray-400">🎈 用爱守护每一颗童心 · Powered by Google Gemini</p></div>
      </footer>
    </div>
  );
};

export default App;