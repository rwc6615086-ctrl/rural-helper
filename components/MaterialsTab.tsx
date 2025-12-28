
import React, { useState, useEffect, useRef } from 'react';
import { ClipboardCheck, History, X, Trash2, Calendar, Camera, Moon, Smartphone, Users, Loader2, Sparkles, AlertCircle, ChevronRight, BookOpen, Feather, Clock, Wand2, Star, Trophy, PenTool, ImageIcon, FileText } from 'lucide-react';
import { AssessmentData, StoryData, Resource } from '../types';
import { analyzeAssessment, generateStory } from '../services/geminiService';

const AssessmentSection = () => {
  const [data, setData] = useState<AssessmentData>({ childName: '', childAge: 7, childGender: '男', mood: '一般', social: '一般', study: '一般', sleep: '一般', electronics: '适中', peerRel: '一般', concerns: [], photo: '', notes: '', details: '' } as any);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('assessmentHistory');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    const initCamera = async () => {
      if (isCameraOpen) {
        try {
          currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
          if (videoRef.current) videoRef.current.srcObject = currentStream;
        } catch (err) {
          alert("无法启动摄像头，请检查权限。");
          setIsCameraOpen(false);
        }
      }
    };
    initCamera();
    return () => { if (currentStream) currentStream.getTracks().forEach(track => track.stop()); };
  }, [isCameraOpen]);

  const saveToHistory = (currentData: AssessmentData, currentAnalysis: string) => {
    const newItem = { id: Date.now(), timestamp: Date.now(), data: currentData, analysis: currentAnalysis };
    const updated = [newItem, ...history];
    setHistory(updated);
    localStorage.setItem('assessmentHistory', JSON.stringify(updated));
  };
  
  const deleteHistoryItem = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('assessmentHistory', JSON.stringify(updated));
  };

  const loadHistoryItem = (item: any) => {
    setData(item.data);
    setAnalysis(item.analysis);
    setShowHistory(false);
  };

  const handleSubmit = async () => {
    if (!data.childName) return alert("请至少输入孩子的名字哦~");
    setLoading(true);
    try {
      const result = await analyzeAssessment(data);
      setAnalysis(result);
      saveToHistory(data, result);
    } catch (e) { alert("分析失败，请检查网络"); } finally { setLoading(false); }
  };

  const toggleConcern = (concern: string) => {
    setData(prev => ({ ...prev, concerns: prev.concerns.includes(concern) ? prev.concerns.filter(c => c !== concern) : [...prev.concerns, concern] }));
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoData = canvas.toDataURL('image/png');
        setData(prev => ({ ...prev, photo: photoData }));
        setIsCameraOpen(false);
      }
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 relative">
      {showHistory && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setShowHistory(false)}></div>
          <div className="fixed top-0 left-0 h-full w-80 bg-white z-50 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col border-r-4 border-rose-100">
            <div className="p-5 bg-rose-50 border-b border-rose-100 flex justify-between items-center">
              <h3 className="font-black text-rose-800 flex items-center gap-2 text-lg"><History className="w-5 h-5" /> 体检记录</h3>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-rose-200 rounded-full text-rose-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/50">
              {history.length === 0 ? <div className="text-center py-10 text-gray-400"><ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-20" /><p className="text-sm font-bold">还没有体检记录哦</p></div> : history.map(item => (
                <div key={item.id} onClick={() => loadHistoryItem(item)} className="group bg-white border-2 border-rose-50 hover:border-rose-300 rounded-xl p-3 cursor-pointer shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={(e) => deleteHistoryItem(e, item.id)} className="p-1.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="删除记录"><Trash2 className="w-3 h-3" /></button>
                  </div>
                  <div className="flex gap-3 items-center mb-2">
                     {item.data.photo ? <img src={item.data.photo} alt="Student" className="w-10 h-10 rounded-full object-cover border border-gray-200" /> : <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-400 font-bold">{item.data.childName?.[0] || '?'}</div>}
                     <div><h4 className="font-bold text-gray-800 line-clamp-1">{item.data.childName || "未命名"}</h4><div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium"><Calendar className="w-3 h-3" />{new Date(item.timestamp).toLocaleDateString()}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <div className="bg-white rounded-[32px] shadow-xl border-4 border-rose-50 p-8 h-fit relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-[60px] -z-0"></div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-dashed border-gray-100 relative z-10">
          <div className="flex items-center gap-4"><div className="bg-rose-100 p-3 rounded-2xl text-rose-500 shadow-sm"><ClipboardCheck className="w-7 h-7" /></div><div><h3 className="text-2xl font-black text-gray-800">全面心理评估</h3><p className="text-sm text-gray-500 font-medium">深入了解心理健康状况</p></div></div>
          <button onClick={() => setShowHistory(true)} className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-colors active:scale-95" title="查看历史记录"><History className="w-5 h-5" /></button>
        </div>
        <div className="space-y-6 relative z-10 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-rose-50/50 p-4 rounded-2xl border-2 border-rose-100 flex flex-col items-center justify-center gap-3">
             {isCameraOpen ? (
               <div className="relative w-full max-w-xs aspect-video bg-black rounded-xl overflow-hidden shadow-inner">
                 <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                 <canvas ref={canvasRef} className="hidden"></canvas>
                 <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-4">
                    <button onClick={() => setIsCameraOpen(false)} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur"><X className="w-5 h-5" /></button>
                    <button onClick={capturePhoto} className="p-3 bg-white rounded-full text-rose-500 shadow-lg hover:scale-110 transition-transform"><div className="w-4 h-4 bg-rose-500 rounded-full"></div></button>
                 </div>
               </div>
             ) : (
               <div className="flex flex-col items-center gap-3">
                 {data.photo ? <div className="relative"><img src={data.photo} alt="Student" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" /><button onClick={() => setData(prev => ({...prev, photo: ''}))} className="absolute -top-1 -right-1 p-1 bg-red-400 text-white rounded-full hover:bg-red-500"><X className="w-3 h-3" /></button></div> : <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-rose-300"><ImageIcon className="w-8 h-8" /></div>}
                 <button onClick={() => setIsCameraOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-rose-200 text-rose-500 rounded-xl font-bold hover:bg-rose-50 transition-colors text-sm"><Camera className="w-4 h-4" />{data.photo ? "重拍照片" : "拍摄/上传照片"}</button>
               </div>
             )}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-sm font-bold text-gray-600">名字</label><input type="text" className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-rose-100 focus:border-rose-400 outline-none transition-all text-sm font-bold" value={data.childName} onChange={e => setData({...data, childName: e.target.value})} placeholder="输入姓名" /></div>
            <div className="space-y-2"><label className="text-sm font-bold text-gray-600">年龄</label><input type="number" className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-rose-100 focus:border-rose-400 outline-none transition-all text-sm font-bold" value={data.childAge} onChange={e => setData({...data, childAge: parseInt(e.target.value)})} /></div>
          </div>
          <div className="space-y-3"><label className="text-sm font-bold text-gray-600 flex items-center gap-2"><Moon className="w-4 h-4 text-indigo-400"/> 睡眠质量</label><select className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-medium text-sm" value={data.sleep} onChange={e => setData({...data, sleep: e.target.value})}><option>很好，一觉到天亮</option><option>一般，偶尔做梦</option><option>较差，入睡困难或易醒</option><option>很差，经常失眠/噩梦</option></select></div>
          <div className="space-y-3"><label className="text-sm font-bold text-gray-600 flex items-center gap-2"><Smartphone className="w-4 h-4 text-indigo-400"/> 电子产品使用</label><select className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-medium text-sm" value={data.electronics} onChange={e => setData({...data, electronics: e.target.value})}><option>很少使用</option><option>适中 (每天1小时内)</option><option>偏多 (每天1-3小时)</option><option>依赖 (机不离手)</option></select></div>
          <div className="space-y-3"><label className="text-sm font-bold text-gray-600 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400"/> 同伴关系</label><select className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-medium text-sm" value={data.peerRel} onChange={e => setData({...data, peerRel: e.target.value})}><option>很受欢迎，朋友很多</option><option>有几个知心朋友</option><option>比较孤单，朋友很少</option><option>经常与同学发生冲突</option></select></div>
          <div className="space-y-3"><label className="text-sm font-bold text-gray-600">最近存在的困扰 (多选)</label><div className="flex flex-wrap gap-2">{['想念父母', '自卑敏感', '情绪暴躁', '沉默寡言', '厌学情绪', '注意力差', '身体不适', '遭遇霸凌'].map(c => (<button key={c} onClick={() => toggleConcern(c)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${data.concerns.includes(c) ? 'bg-rose-400 text-white border-rose-400 shadow-md scale-105' : 'bg-white text-gray-400 border-gray-100 hover:border-rose-200 hover:text-rose-400'}`}>{c}</button>))}</div></div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-400"/> 详细情况描述</label>
            <textarea 
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-rose-100 focus:border-rose-400 outline-none transition-all text-sm font-medium h-32 resize-none" 
              value={data.details} 
              onChange={e => setData({...data, details: e.target.value})} 
              placeholder="请详细描述孩子的具体情况。例如：父母离家多久了？最近发生了什么具体的事情？在学校和家里的表现有什么反差？" 
            />
          </div>

          <button onClick={handleSubmit} disabled={loading} className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black hover:bg-rose-600 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-rose-200">{loading ? <Loader2 className="animate-spin w-5 h-5" /> : "生成报告并保存"}</button>
        </div>
      </div>
      <div className="bg-white rounded-[32px] shadow-xl border-4 border-indigo-50 p-8 h-full min-h-[500px] flex flex-col relative">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-dashed border-gray-100"><div className="bg-indigo-100 p-3 rounded-2xl text-indigo-500 shadow-sm"><Sparkles className="w-7 h-7" /></div><h4 className="text-2xl font-black text-gray-800">康康老师的建议</h4></div>
        {analysis ? <div className="prose prose-sm prose-indigo max-w-none text-gray-600 leading-loose overflow-y-auto pr-2 custom-scrollbar flex-1 font-medium bg-indigo-50/50 p-4 rounded-2xl border-2 border-indigo-50"><div className="whitespace-pre-wrap">{analysis}</div></div> : <div className="flex flex-col items-center justify-center flex-1 text-gray-400 bg-slate-50 rounded-3xl border-4 border-dashed border-gray-200 m-2"><div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm animate-bounce-soft"><AlertCircle className="w-10 h-10 text-gray-300" /></div><p className="font-bold text-lg text-gray-400">数据分析中枢就绪</p><p className="text-sm mt-2 text-center text-gray-400">完善左侧详细信息<br/>获取深度心理健康报告</p></div>}
      </div>
    </div>
  );
};

const ResourcesSection = () => {
  const [activeFilter, setActiveFilter] = useState('全部');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const resources: Resource[] = [
    { id: 1, title: "怎么知道我不开心？", tags: ["自我认知"], type: "guide", age: "all", content: "学会认识自己的小情绪，是快乐的第一步。" },
    { id: 2, title: "信任游戏：我们要团结", tags: ["班级活动"], type: "activity", age: "all", content: "和同学们一起玩游戏，变成好朋友。" },
    { id: 3, title: "深呼吸，我不生气", tags: ["情绪管理"], type: "technique", age: "all", content: "当我们想发火的时候，试着这样做..." },
    { id: 4, title: "给爸爸妈妈写封信", tags: ["沟通技巧"], type: "tool", age: "all", content: "虽然他们不在身边，但爱一直都在。" },
    { id: 5, title: "为什么我会害羞？", tags: ["自我认知"], type: "guide", age: "all", content: "其实每个人都会害羞，这很正常哦。" },
    { id: 6, title: "每天夸夸自己", tags: ["自信建立"], type: "technique", age: "all", content: "找找自己身上的闪光点，你很棒！" },
    { id: 7, title: "青春期身体的变化", tags: ["生理健康"], type: "guide", age: "teen", content: "了解身体成长的秘密，不害怕。" },
    { id: 8, title: "如何拒绝别人？", tags: ["社交技能"], type: "technique", age: "all", content: "学会说'不'，保护自己的边界。" },
    { id: 9, title: "对抗网瘾小妙招", tags: ["自律"], type: "tool", age: "teen", content: "放下手机，发现真实世界的美好。" },
    { id: 10, title: "考前焦虑怎么办？", tags: ["学习压力"], type: "guide", age: "teen", content: "掌握放松技巧，轻松应对考试挑战。" },
    { id: 11, title: "我的梦想清单", tags: ["未来规划"], type: "tool", age: "all", content: "画出你的梦想，一步步去实现它。" },
    { id: 12, title: "假如我是他/她", tags: ["同理心"], type: "activity", age: "all", content: "换位思考游戏，学会理解别人的感受。" },
  ];
  const allTags = ['全部', ...Array.from(new Set(resources.flatMap(r => r.tags)))];
  const filteredResources = activeFilter === '全部' ? resources : resources.filter(r => r.tags.includes(activeFilter));
  
  const getColor = (type: string) => {
    switch(type) {
      case 'guide': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'activity': return 'bg-green-100 text-green-600 border-green-200';
      case 'technique': return 'bg-purple-100 text-purple-600 border-purple-200';
      default: return 'bg-orange-100 text-orange-600 border-orange-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-center sticky top-24 z-20 bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-indigo-50">
        {allTags.map(tag => (
          <button key={tag} onClick={() => setActiveFilter(tag)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeFilter === tag ? 'bg-indigo-500 text-white shadow-md scale-105' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-indigo-500'}`}>{tag}</button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((r) => (
          <div key={r.id} onClick={() => setSelectedResource(r)} className="group bg-white p-6 rounded-[24px] border-4 border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity"><div className="bg-indigo-100 p-1.5 rounded-full"><ChevronRight className="w-5 h-5 text-indigo-500" /></div></div>
            <div className="flex gap-2 mb-4 flex-wrap relative z-10">
              {r.tags.map(t => (
                <span key={t} className={`inline-block px-3 py-1.5 rounded-lg text-xs font-black border-2 transition-all cursor-pointer ${getColor(r.type)}`}>{t}</span>
              ))}
            </div>
            <h4 className="text-xl font-black text-gray-800 mb-3 group-hover:text-indigo-600 transition-colors">{r.title}</h4>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-4 flex-grow">{r.content}</p>
            <div className="text-xs font-bold text-gray-400 mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
               <span>适合: {r.age === 'all' ? '全年龄' : r.age === 'teen' ? '青少年' : '儿童'}</span><span className="text-indigo-400 group-hover:underline">点击查看详情</span>
            </div>
          </div>
        ))}
      </div>
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedResource(null)}>
           <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl p-8 relative animate-in zoom-in-95 duration-200 border-4 border-white max-h-[85vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedResource(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"><X className="w-6 h-6 text-gray-500" /></button>
              <div className="mb-6"><div className="flex gap-2 mb-4">{selectedResource.tags.map(t => (<span key={t} className={`px-3 py-1 rounded-lg text-xs font-black border-2 ${getColor(selectedResource.type)}`}>{t}</span>))}</div><h2 className="text-3xl font-black text-gray-800 mb-2">{selectedResource.title}</h2><p className="text-gray-400 font-bold text-sm">适用年龄: {selectedResource.age === 'all' ? '所有年龄段' : selectedResource.age === 'teen' ? '青少年' : '儿童'}</p></div>
              <div className="prose prose-lg prose-indigo max-w-none text-gray-600 leading-loose"><p className="font-medium">{selectedResource.content}</p><hr className="my-6 border-gray-100" /><h4 className="font-bold text-indigo-900 mb-4">📖 详细阅读</h4><div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 text-base"><p>这里是资源的详细内容展示区。对于<strong>{selectedResource.title}</strong>这个主题，我们可以从以下几个方面展开：</p><ul className="list-disc pl-5 mt-2 space-y-2"><li>第一步：深呼吸，平静心情。</li><li>第二步：尝试用纸笔记录下现在的感受。</li><li>第三步：寻找身边可以信任的人倾诉。</li></ul></div></div>
              <div className="mt-8 flex justify-end gap-3"><button onClick={() => setSelectedResource(null)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">关闭</button><button className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-200">收藏资源</button></div>
           </div>
        </div>
      )}
    </div>
  );
};

const StoryGeneratorSection = () => {
  const [theme, setTheme] = useState('');
  const [story, setStory] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [storyLength, setStoryLength] = useState('medium');
  const [storyTone, setStoryTone] = useState('warm');
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const LENGTH_OPTIONS = [
    { id: 'short', label: '短篇 (300字)', icon: Feather },
    { id: 'medium', label: '中篇 (800字)', icon: BookOpen },
    { id: 'long', label: '长篇 (1500字)', icon: Clock },
  ];
  const TONE_OPTIONS = [
    { id: 'warm', label: '温馨治愈', color: 'bg-orange-100 text-orange-600 border-orange-200' },
    { id: 'adventure', label: '奇幻冒险', color: 'bg-blue-100 text-blue-600 border-blue-200' },
    { id: 'happy', label: '欢乐有趣', color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
    { id: 'brave', label: '勇敢励志', color: 'bg-red-100 text-red-600 border-red-200' },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('storyHistory');
    if (saved) try { setHistory(JSON.parse(saved)); } catch (e) {}
  }, []);

  const saveToHistory = (newStory: StoryData, inputs: any) => {
    const historyItem = { ...newStory, id: Date.now(), timestamp: Date.now(), theme: inputs.theme, length: inputs.length, tone: inputs.tone };
    const updatedHistory = [historyItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('storyHistory', JSON.stringify(updatedHistory));
  };

  const deleteFromHistory = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('storyHistory', JSON.stringify(updated));
  };

  const loadFromHistory = (item: any) => {
    setTheme(item.theme); setStoryLength(item.length); setStoryTone(item.tone);
    setStory({ title: item.title, content: item.content, moral: item.moral });
    setShowHistory(false);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleGenerate = async () => {
    if (!theme) return;
    setLoading(true);
    try {
      const result = await generateStory(theme, "7-12岁", storyLength, storyTone);
      setStory(result);
      saveToHistory(result, { theme, length: storyLength, tone: storyTone });
    } catch (e) { alert("生成失败，请重试"); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative">
      {showHistory && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setShowHistory(false)}></div>
          <div className="fixed top-0 left-0 h-full w-80 bg-white z-50 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col border-r-4 border-amber-100">
            <div className="p-5 bg-amber-50 border-b border-amber-100 flex justify-between items-center"><h3 className="font-black text-amber-800 flex items-center gap-2 text-lg"><History className="w-5 h-5" /> 故事书架</h3><button onClick={() => setShowHistory(false)} className="p-2 hover:bg-amber-200 rounded-full text-amber-600 transition-colors"><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/50">
              {history.length === 0 ? <div className="text-center py-10 text-gray-400"><BookOpen className="w-12 h-12 mx-auto mb-2 opacity-20" /><p className="text-sm font-bold">还没有生成过故事哦</p></div> : history.map(item => (
                <div key={item.id} onClick={() => loadFromHistory(item)} className="group bg-white border-2 border-amber-50 hover:border-amber-300 rounded-xl p-3 cursor-pointer shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"><button onClick={(e) => deleteFromHistory(e, item.id)} className="p-1.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="删除记录"><Trash2 className="w-3 h-3" /></button></div>
                  <h4 className="font-bold text-gray-800 line-clamp-1 pr-6 mb-1">{item.title}</h4><div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-2"><Calendar className="w-3 h-3" />{new Date(item.timestamp).toLocaleDateString()}</div>
                  <div className="flex flex-wrap gap-1"><span className="px-2 py-0.5 bg-gray-100 rounded-md text-[10px] text-gray-500 font-bold">{item.theme}</span><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${TONE_OPTIONS.find(t => t.id === item.tone)?.color || 'bg-gray-100 text-gray-500'}`}>{TONE_OPTIONS.find(t => t.id === item.tone)?.label}</span></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <button onClick={() => setShowHistory(true)} className="absolute top-6 right-6 p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full text-white transition-all shadow-sm active:scale-95 z-20" title="查看历史记录"><History className="w-6 h-6" /></button>
        <div className="relative z-10 text-center space-y-6">
          <div className="space-y-3"><h3 className="text-3xl font-black tracking-tight drop-shadow-sm flex items-center justify-center gap-2"><Wand2 className="w-8 h-8" /> 魔法故事屋</h3><p className="text-amber-100 text-base font-bold max-w-xl mx-auto">输入几个关键词，定制你的专属故事！</p></div>
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-[32px] shadow-lg text-gray-800 space-y-5">
            <div className="space-y-2 text-left"><label className="text-sm font-black text-gray-500 uppercase ml-2">1. 故事关键词</label><input type="text" value={theme} onChange={e => setTheme(e.target.value)} placeholder="例如：勇气 森林 小熊" className="w-full bg-gray-50 border-2 border-gray-200 text-gray-800 placeholder-gray-400 px-6 py-3 rounded-2xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 text-lg outline-none font-bold transition-all" /></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2 text-left"><label className="text-sm font-black text-gray-500 uppercase ml-2">2. 详细程度</label><div className="flex bg-gray-100 p-1.5 rounded-2xl">{LENGTH_OPTIONS.map((opt) => (<button key={opt.id} onClick={() => setStoryLength(opt.id)} className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl text-xs font-bold transition-all gap-1 ${storyLength === opt.id ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><opt.icon className="w-4 h-4" />{opt.label}</button>))}</div></div>
              <div className="space-y-2 text-left"><label className="text-sm font-black text-gray-500 uppercase ml-2">3. 情感基调</label><div className="grid grid-cols-2 gap-2">{TONE_OPTIONS.map((opt) => (<button key={opt.id} onClick={() => setStoryTone(opt.id)} className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition-all ${storyTone === opt.id ? `${opt.color} shadow-sm scale-105` : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}>{opt.label}</button>))}</div></div>
            </div>
            <button onClick={handleGenerate} disabled={loading || !theme} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-2xl font-black text-lg hover:shadow-lg hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all shadow-amber-200 mt-2">{loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> 正在施展魔法...</span> : "开始创作故事"}</button>
          </div>
        </div>
      </div>
      {story && (
        <div className="bg-white border-4 border-amber-100 rounded-[40px] p-10 shadow-2xl relative overflow-hidden ring-8 ring-amber-50/50 transform transition-all animate-in fade-in slide-in-from-bottom-8">
          <div className="absolute top-0 right-10 w-12 h-16 bg-red-400 rounded-b-lg shadow-md z-20"></div>
          <div className="relative z-10">
            <div className="flex justify-center mb-8 gap-2"><span className="px-4 py-1.5 bg-amber-100 text-amber-600 text-xs font-black rounded-full uppercase tracking-wider">AI 原创故事</span><span className="px-4 py-1.5 bg-orange-100 text-orange-600 text-xs font-black rounded-full uppercase tracking-wider">{TONE_OPTIONS.find(t => t.id === storyTone)?.label || '故事'}</span></div>
            <h2 className="text-3xl md:text-4xl font-black text-center text-gray-800 mb-10 leading-tight">{story.title}</h2>
            <div className="space-y-6 text-gray-700 text-lg md:text-xl leading-loose font-medium px-2 md:px-8 whitespace-pre-wrap text-justify">{story.content}</div>
            <div className="mt-12 bg-green-50 rounded-3xl p-8 border-2 border-green-100 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 text-green-100 transform rotate-12"><Star className="w-32 h-32 fill-current" /></div>
              <h4 className="font-black text-green-700 mb-6 flex items-center gap-3 text-xl relative z-10"><div className="bg-green-200 p-2 rounded-lg"><Star className="w-6 h-6 text-green-600" /></div>故事里的小道理</h4>
              <ul className="grid sm:grid-cols-2 gap-4 relative z-10">{story.moral?.map((m, i) => (<li key={i} className="flex items-start gap-3 text-green-800 font-bold bg-white/60 p-3 rounded-xl"><span className="w-6 h-6 bg-green-400 text-white rounded-full flex items-center justify-center shrink-0 text-xs shadow-sm">{i + 1}</span>{m}</li>))}</ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MaterialsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'assessment' | 'resources' | 'story'>('assessment');
  return (
    <div className="space-y-8">
      <div className="flex justify-center">
         <div className="bg-white/80 backdrop-blur rounded-full border-2 border-indigo-50 p-2 flex gap-2 shadow-lg overflow-x-auto max-w-full">
           {[
             { id: 'assessment', label: '心情体检单', icon: Trophy, color: 'bg-rose-400' },
             { id: 'resources', label: '宝藏书屋', icon: BookOpen, color: 'bg-emerald-400' },
             { id: 'story', label: '魔法故事', icon: PenTool, color: 'bg-amber-400' },
           ].map((tab) => (
             <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeSubTab === tab.id ? `${tab.color} text-white shadow-md scale-105` : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}><tab.icon className="w-4 h-4" />{tab.label}</button>
           ))}
         </div>
      </div>
      <div className="min-h-[600px] animate-in slide-in-from-bottom-4 fade-in duration-500">
        {activeSubTab === 'assessment' && <AssessmentSection />}
        {activeSubTab === 'resources' && <ResourcesSection />}
        {activeSubTab === 'story' && <StoryGeneratorSection />}
      </div>
    </div>
  );
};

export default MaterialsTab;
