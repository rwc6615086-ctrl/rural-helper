import React, { useState } from 'react';
import { HeartHandshake, MessageCircle, Image as ImageIcon, BookOpen, ChevronLeft, ChevronRight, X, Star } from 'lucide-react';

interface TutorialModalProps {
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: "欢迎来到 HeartGuard! 👋",
      desc: "我是你的 AI 心理辅导伙伴。在这里，你可以找人倾诉、发挥创意、探索内心。让我们开始一段温暖的旅程吧！",
      icon: HeartHandshake,
      color: "bg-indigo-500",
      bg: "bg-indigo-50"
    },
    {
      title: "找康康聊天 🐻",
      desc: "无论开心还是难过，康康老师都在这里陪着你。你可以问我任何问题，我会为你保守秘密，做你最忠实的听众。",
      icon: MessageCircle,
      color: "bg-sky-500",
      bg: "bg-sky-50"
    },
    {
      title: "小小画室 🎨",
      desc: "发挥你的想象力！告诉我你想画什么，或者随手画几笔线条，我会用魔法把它们变成精美的画作。",
      icon: ImageIcon,
      color: "bg-amber-500",
      bg: "bg-amber-50"
    },
    {
      title: "成长日记 📘",
      desc: "在这里做心理体检，阅读有趣的魔法故事，还能在宝藏书屋里发现许多有用的小知识。",
      icon: BookOpen,
      color: "bg-emerald-500",
      bg: "bg-emerald-50"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onClose();
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const CurrentIcon = steps[step].icon;

  return (
    <div className="fixed inset-0 bg-indigo-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border-4 border-white relative animate-in zoom-in-95 duration-300">
        <div className={`absolute top-0 left-0 w-full h-48 transition-colors duration-500 ${steps[step].color}`}>
          <div className="absolute top-[-50%] left-[-20%] w-64 h-64 bg-white/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        </div>
        <div className="relative pt-12 pb-8 px-8 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 relative z-10 ring-4 ring-white/30">
            <CurrentIcon className={`w-10 h-10 transition-colors duration-500 ${steps[step].color.replace('bg-', 'text-')}`} />
            {step === 0 && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1.5 rounded-full animate-bounce">
                <Star className="w-4 h-4 fill-current" />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-3 transition-all duration-300">{steps[step].title}</h2>
          <p className="text-gray-500 font-medium leading-relaxed mb-8 h-20 transition-all duration-300">{steps[step].desc}</p>
          <div className="flex gap-2 mb-8">
            {steps.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? `w-8 ${steps[step].color}` : 'w-2 bg-gray-200'}`}></div>
            ))}
          </div>
          <div className="flex w-full gap-3">
             {step > 0 ? (
               <button onClick={handlePrev} className="flex-1 py-3.5 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"><ChevronLeft className="w-5 h-5" /> 上一步</button>
             ) : (
               <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">跳过介绍</button>
             )}
             <button onClick={handleNext} className={`flex-[2] py-3.5 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-95 ${steps[step].color}`}>
               {step === steps.length - 1 ? '开始体验' : '下一步'}
               {step !== steps.length - 1 && <ChevronRight className="w-5 h-5" />}
             </button>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors z-20"><X className="w-6 h-6" /></button>
      </div>
    </div>
  );
};

export default TutorialModal;