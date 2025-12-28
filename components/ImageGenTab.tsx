import React, { useState, useEffect, useRef } from 'react';
import { Palette, Sparkles, PenTool, History, Loader2, Wand2, RefreshCw, Image as ImageIcon, Download } from 'lucide-react';
import { generateImage, generateImageFromSketch } from '../services/geminiService';

const ImageGenTab: React.FC = () => {
  const STYLES = [
    { value: 'cartoon', label: '🌈 温馨卡通', color: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200' },
    { value: 'watercolor', label: '🎨 淡雅水彩', color: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200' },
    { value: 'illustration', label: '📚 绘本插画', color: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200' },
    { value: 'realistic', label: '📸 真实照片', color: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200' },
  ];
  const [activeMode, setActiveMode] = useState<'text' | 'sketch'>('text');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('cartoon');
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('promptHistory');
    if (saved) setPromptHistory(JSON.parse(saved));
    if (activeMode === 'sketch') {
      setTimeout(initCanvas, 100);
    }
  }, [activeMode]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
  };

  const savePrompt = (newPrompt: string) => {
    const updated = [newPrompt, ...promptHistory.filter(p => p !== newPrompt)].slice(0, 8);
    setPromptHistory(updated);
    localStorage.setItem('promptHistory', JSON.stringify(updated));
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && activeMode === 'text') return;
    setIsGenerating(true);
    setError('');
    const enhancedPrompt = `${prompt}, ${style} style, bright colors, happy atmosphere, highly detailed, kid friendly, cute, 8k resolution`;
    try {
      let base64Image;
      if (activeMode === 'text') {
         savePrompt(prompt);
         base64Image = await generateImage(enhancedPrompt);
      } else {
         const canvas = canvasRef.current;
         if (canvas) {
           const sketchBase64 = canvas.toDataURL('image/png');
           base64Image = await generateImageFromSketch(enhancedPrompt || "Colorful, artistic interpretation of this sketch", sketchBase64);
         }
      }
      if (base64Image) setGeneratedImg(base64Image);
    } catch (err) {
      setError("哎呀，画笔断水了，请检查网络或稍后再试。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImg) return;
    const link = document.createElement('a');
    link.href = generatedImg;
    link.download = `my-drawing-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);
  const clearCanvas = () => initCanvas();
  const generateRandomLines = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    for(let i=0; i<5; i++) {
       const x = Math.random() * canvas.width;
       const y = Math.random() * canvas.height;
       if (i===0) ctx.moveTo(x,y);
       else ctx.bezierCurveTo(Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*canvas.width, Math.random()*canvas.height, x, y);
    }
    ctx.stroke();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-auto lg:h-[700px]">
      <div className="lg:w-1/3 bg-white rounded-[32px] shadow-xl border-4 border-yellow-100 p-8 flex flex-col h-full relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-bl-full -z-0"></div>
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-3 bg-yellow-400 rounded-2xl text-white shadow-md transform -rotate-6"><Palette className="w-6 h-6" /></div>
          <h3 className="text-2xl font-black text-gray-800 tracking-tight">创意小画板</h3>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6 relative z-10">
          <button onClick={() => setActiveMode('text')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeMode === 'text' ? 'bg-white shadow-sm text-yellow-600' : 'text-gray-400'}`}><Sparkles className="w-4 h-4" /> 文生图</button>
          <button onClick={() => setActiveMode('sketch')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeMode === 'sketch' ? 'bg-white shadow-sm text-yellow-600' : 'text-gray-400'}`}><PenTool className="w-4 h-4" /> 魔法涂鸦</button>
        </div>
        <div className="flex-1 space-y-6 relative z-10 overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">风格选择</label>
            <div className="grid grid-cols-2 gap-3">
              {STYLES.map((s) => (
                <button key={s.value} onClick={() => setStyle(s.value)} className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border-2 ${style === s.value ? `${s.color} ring-2 ring-offset-2 ring-gray-200 shadow-md scale-105` : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}>{s.label}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">{activeMode === 'text' ? '画面描述' : '补充描述 (可选)'}</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={activeMode === 'text' ? "试着描述：一只戴着草帽的小猫在向日葵田里..." : "例如：把这个线条变成一座美丽的山峰..."} className="w-full h-32 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-yellow-100 focus:border-yellow-400 focus:bg-white transition-all resize-none text-sm placeholder-gray-400 font-medium" />
          </div>
          {activeMode === 'text' && promptHistory.length > 0 && (
             <div className="space-y-2">
               <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2"><History className="w-4 h-4" /> 灵感记录</label>
               <div className="flex flex-wrap gap-2">
                 {promptHistory.map((p, i) => (
                   <button key={i} onClick={() => setPrompt(p)} className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 truncate max-w-[150px] hover:bg-yellow-50 hover:border-yellow-200 hover:text-yellow-600 transition-colors">{p}</button>
                 ))}
               </div>
             </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-100 relative z-10">
          <button onClick={handleGenerate} disabled={isGenerating || (activeMode === 'text' && !prompt.trim())} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-4 rounded-2xl font-black text-lg hover:shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-orange-200">
            {isGenerating ? <><Loader2 className="w-6 h-6 animate-spin" /><span>AI 正在挥舞画笔...</span></> : <><Wand2 className="w-6 h-6" /><span>变身画家！</span></>}
          </button>
          {error && <div className="mt-2 text-red-500 text-xs font-bold text-center">{error}</div>}
        </div>
      </div>
      <div className="flex-1 bg-white rounded-[32px] border-4 border-gray-200 flex flex-col relative overflow-hidden group min-h-[500px] shadow-xl">
        <div className="absolute top-0 left-0 w-full h-8 bg-gray-100 border-b border-gray-200 flex gap-2 items-center px-4 z-20">
             <div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-yellow-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        {activeMode === 'sketch' && !generatedImg && (
          <div className="flex-1 relative bg-slate-50 flex items-center justify-center pt-8">
             <div className="relative">
               <canvas ref={canvasRef} width={512} height={512} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} className="bg-white border-2 border-dashed border-gray-300 rounded-lg shadow-sm cursor-crosshair touch-none" />
               <div className="absolute top-4 right-4 flex flex-col gap-2">
                 <button onClick={clearCanvas} className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:text-red-500" title="清空"><History className="w-5 h-5"/></button>
                 <button onClick={generateRandomLines} className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:text-blue-500" title="随机线条"><RefreshCw className="w-5 h-5"/></button>
               </div>
               <p className="text-center mt-2 text-gray-400 text-sm font-bold">在这里画几笔，或点击"随机线条" -> AI来美化</p>
             </div>
          </div>
        )}
        {activeMode === 'text' && !generatedImg && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 bg-slate-50">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-dashed border-gray-200 animate-float"><ImageIcon className="w-12 h-12 text-gray-300" /></div>
            <p className="text-xl font-black text-gray-400">画布是空的哦</p>
            <p className="text-sm mt-3 max-w-xs text-center text-gray-400 font-medium">快在左边告诉我你想画什么，我会帮你变出魔法！</p>
          </div>
        )}
        {generatedImg && (
          <>
            <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] pt-16">
               <div className="relative p-4 bg-white shadow-2xl rotate-1 transition-transform hover:rotate-0 duration-500 rounded-lg">
                  <img src={generatedImg} alt="Generated result" className="max-w-full max-h-[500px] rounded-sm object-contain border border-gray-100" />
               </div>
            </div>
            <div className="absolute bottom-6 right-6 flex gap-2">
              <button onClick={() => setGeneratedImg(null)} className="bg-white text-gray-600 hover:text-red-500 px-4 py-3 rounded-xl font-bold text-sm shadow-lg border-2 border-gray-100">清除</button>
              <button onClick={handleDownload} className="bg-white text-gray-800 hover:text-indigo-600 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg border-2 border-gray-100 transition-all hover:-translate-y-1"><Download className="w-5 h-5" /> 保存作品</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageGenTab;