import React, { useState, useRef, useEffect } from 'react';
import { Youtube, Upload, Play, Pause, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import { parseSRT, SubtitleItem } from '../utils/srtParser';
import { analyzeSentenceService } from '../services/geminiService';
import { AnalysisResult } from '../types';
import { ResultDisplay } from './ResultDisplay';

// Extend Window interface for YouTube API
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export const YoutubeStudyPage: React.FC = () => {
  // --- State ---
  // Column 1: Video
  const [videoUrl, setVideoUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Column 2: Subtitles
  const [srtContent, setSrtContent] = useState('');
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [activeSubtitleId, setActiveSubtitleId] = useState<number | null>(null);

  // Column 3: Analysis
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- Effects ---

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        // API Loaded
      };
    }
  }, []);

  // Initialize Player when videoId changes
  useEffect(() => {
    if (videoId && window.YT) {
      if (playerRef.current) {
        playerRef.current.loadVideoById(videoId);
      } else {
        new window.YT.Player('youtube-player', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            'playsinline': 1,
            'modestbranding': 1,
            'rel': 0
          },
          events: {
            'onReady': (event: any) => {
              playerRef.current = event.target;
              setIsPlayerReady(true);
            },
            'onStateChange': (event: any) => {
              // Optional: Track state changes
            }
          }
        });
      }
    }
  }, [videoId]);

  // Sync active subtitle with video time (Optional polling)
  useEffect(() => {
    let interval: any;
    if (isPlayerReady && subtitles.length > 0) {
      interval = setInterval(() => {
        const currentTime = playerRef.current?.getCurrentTime?.();
        if (currentTime) {
          const currentSub = subtitles.find(sub => currentTime >= sub.startTime && currentTime <= sub.endTime);
          if (currentSub && currentSub.id !== activeSubtitleId) {
            setActiveSubtitleId(currentSub.id);
            // Optional: Auto-scroll to active subtitle
          }
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlayerReady, subtitles, activeSubtitleId]);


  // --- Handlers ---

  const handleVideoUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Extract ID from URL
    // Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = videoUrl.match(regExp);
    if (match && match[2].length === 11) {
      setVideoId(match[2]);
    } else {
      alert('无效的 YouTube URL');
    }
  };

  const handleSrtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSrtContent(content);
        const parsed = parseSRT(content);
        setSubtitles(parsed);
      };
      reader.readAsText(file);
    }
  };

  const handleSrtPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setSrtContent(content);
    const parsed = parseSRT(content);
    setSubtitles(parsed);
  };

  const handleJumpToTime = (startTime: number) => {
    if (playerRef.current && isPlayerReady) {
      playerRef.current.seekTo(startTime, true);
      playerRef.current.playVideo();
    }
  };

  const handleAnalyze = async (sub: SubtitleItem) => {
    if (isAnalyzing) return;
    
    setAnalyzingId(sub.id);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null); // Clear previous result to show loading state effectively

    try {
      // Use the cleaned text for analysis (no timestamps etc)
      const result = await analyzeSentenceService(sub.text.replace(/\n/g, ' '));
      setAnalysisResult(result);
    } catch (err: any) {
      setAnalysisError(err.message || "分析失败");
    } finally {
      setIsAnalyzing(false);
      setAnalyzingId(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 overflow-hidden">
      
      {/* Column 1: Video Player (Flex 2) */}
      <div className="flex-[2] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
           <Youtube className="w-5 h-5 text-red-600" />
           <h2 className="font-semibold text-slate-800 dark:text-white">视频播放</h2>
        </div>
        
        <div className="flex-1 bg-black relative">
          {!videoId ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-100 dark:bg-slate-900">
                <div className="w-full max-w-md">
                   <form onSubmit={handleVideoUrlSubmit} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="输入 YouTube 视频地址..."
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                      />
                      <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                        加载
                      </button>
                   </form>
                   <p className="mt-4 text-sm text-slate-500">示例: https://www.youtube.com/watch?v=...</p>
                </div>
             </div>
          ) : (
            <div id="youtube-player" className="w-full h-full"></div>
          )}
        </div>
      </div>

      {/* Column 2: Subtitles (Flex 1) */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Upload className="w-5 h-5 text-blue-500" />
             <h2 className="font-semibold text-slate-800 dark:text-white">字幕内容</h2>
           </div>
           {!subtitles.length && (
            <label className="cursor-pointer px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors">
              导入 .srt
              <input type="file" accept=".srt" className="hidden" onChange={handleSrtUpload} />
            </label>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {!subtitles.length ? (
            <div className="h-full flex flex-col p-4">
              <textarea
                className="flex-1 w-full p-4 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                placeholder="在此粘贴 SRT 字幕内容，或点击右上角导入文件..."
                value={srtContent}
                onChange={handleSrtPaste}
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {subtitles.map((sub) => (
                <div 
                  key={sub.id} 
                  className={`group relative p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${activeSubtitleId === sub.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 pl-2' : 'pl-3'}`}
                >
                  <div className="flex gap-3 items-start">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJumpToTime(sub.startTime);
                      }}
                      className="flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-all group-hover:shadow-sm border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                      title="点击跳转播放"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span className="font-mono font-bold text-base">
                        {new Date(sub.startTime * 1000).toISOString().substr(14, 5)}
                      </span>
                    </button>
                    <p 
                      className="text-base text-slate-700 dark:text-slate-200 leading-relaxed flex-1 pt-1.5 select-text"
                    >
                      {sub.text}
                    </p>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAnalyze(sub); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 bg-white dark:bg-slate-700 shadow-sm rounded-full text-pink-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-slate-600 transition-all z-10"
                    title="句法分析"
                  >
                     <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Column 3: Analysis (Flex 1) */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
           <Sparkles className="w-5 h-5 text-pink-500" />
           <h2 className="font-semibold text-slate-800 dark:text-white">句法解析</h2>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 p-4">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
               <p className="text-sm text-slate-500">正在分析句子结构...</p>
            </div>
          ) : analysisError ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg text-red-600 dark:text-red-400 text-sm flex gap-2">
               <AlertCircle className="w-5 h-5 flex-shrink-0" />
               <p>{analysisError}</p>
            </div>
          ) : analysisResult ? (
            <ResultDisplay result={analysisResult} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600 p-8 text-center">
              <Sparkles className="w-12 h-12 mb-4 opacity-50" />
              <p>点击字幕右侧的 <Sparkles className="w-3 h-3 inline mx-1" /> 按钮开始分析</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
