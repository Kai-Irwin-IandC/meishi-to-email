import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon, TextIcon, SparklesIcon, CopyIcon, CheckIcon, CameraIcon, PlusIcon, XIcon } from './components/Icons';
import { LoadingOverlay } from './components/LoadingOverlay';
import { extractBusinessCardInfo } from './services/openrouterService';
import { generateEmailContent, INITIAL_EVENT_NAME, INITIAL_SENDER_NAME } from './constants';
import { InputMode, GeneratedEmail } from './types';

const App: React.FC = () => {
  // State
  const [employees, setEmployees] = useState<string[]>(['田中康太郎', 'アーウィン海']);
  const [senderName, setSenderName] = useState(INITIAL_SENDER_NAME);
  const [eventName, setEventName] = useState(INITIAL_EVENT_NAME);
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.IMAGE);
  
  // Add Employee State
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedEmail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("画像サイズは5MB以下にしてください。");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setError(null);
        setResult(null); // Reset previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEmployee = () => {
    if (newEmployeeName.trim()) {
      setEmployees(prev => [...prev, newEmployeeName.trim()]);
      setSenderName(newEmployeeName.trim());
      setNewEmployeeName('');
      setIsAddingEmployee(false);
    }
  };

  const handleGenerate = async () => {
    if (inputMode === InputMode.IMAGE && !selectedImage) {
      setError("名刺の画像をアップロードしてください。");
      return;
    }
    if (inputMode === InputMode.TEXT && !textInput.trim()) {
      setError("名刺のテキスト情報を入力してください。");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Extract Info using OpenRouter
      const extractedInfo = await extractBusinessCardInfo(
        inputMode === InputMode.IMAGE ? selectedImage : null,
        inputMode === InputMode.TEXT ? textInput : null
      );

      // 2. Generate Email locally to ensure strict template adherence
      const generatedEmail = generateEmailContent({
        senderName,
        eventName,
        extractedInfo
      });

      setResult(generatedEmail);
    } catch (err: any) {
      setError(err.message || "予期せぬエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, isSubject: boolean) => {
    navigator.clipboard.writeText(text);
    if (isSubject) {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl flex justify-center items-center gap-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Secretary AI</span>
            <span className="text-2xl">✨</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            名刺をスキャンして、完璧な御礼メールを瞬時に作成します。
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          
          {/* Configuration Section */}
          <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">設定（あなたの情報）</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Sender Name Selector */}
              <div>
                <label htmlFor="senderName" className="block text-sm font-medium text-slate-700 mb-1">差出人名</label>
                {isAddingEmployee ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newEmployeeName}
                      onChange={(e) => setNewEmployeeName(e.target.value)}
                      placeholder="新しい社員名"
                      className="block w-full rounded-lg border-slate-300 bg-white py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleAddEmployee()}
                    />
                    <button
                      onClick={handleAddEmployee}
                      disabled={!newEmployeeName.trim()}
                      className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      title="追加"
                    >
                      <CheckIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingEmployee(false);
                        setNewEmployeeName('');
                      }}
                      className="p-2.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                      title="キャンセル"
                    >
                      <XIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative w-full">
                       <select
                        id="senderName"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="block w-full rounded-lg border-slate-300 bg-white py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 appearance-none"
                      >
                        {employees.map((name, index) => (
                          <option key={index} value={name}>{name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAddingEmployee(true)}
                      className="flex-shrink-0 p-2.5 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-200 hover:text-indigo-600 transition-colors"
                      title="社員を追加"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="eventName" className="block text-sm font-medium text-slate-700 mb-1">イベント名</label>
                <input
                  type="text"
                  id="eventName"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="block w-full rounded-lg border-slate-300 bg-white py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all"
                  placeholder="例: 異業種交流会"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row">
            
            {/* Input Section */}
            <div className="flex-1 p-6 sm:p-8 relative">
              <LoadingOverlay isVisible={isLoading} />
              
              <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 mb-6">
                <button
                  onClick={() => setInputMode(InputMode.IMAGE)}
                  className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200 flex items-center justify-center gap-2
                    ${inputMode === InputMode.IMAGE 
                      ? 'bg-white text-indigo-700 shadow ring-1 ring-black/5' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'}`}
                >
                  <CameraIcon className="w-4 h-4" />
                  名刺画像
                </button>
                <button
                  onClick={() => setInputMode(InputMode.TEXT)}
                  className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200 flex items-center justify-center gap-2
                    ${inputMode === InputMode.TEXT 
                      ? 'bg-white text-indigo-700 shadow ring-1 ring-black/5' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'}`}
                >
                  <TextIcon className="w-4 h-4" />
                  テキスト入力
                </button>
              </div>

              <div className="min-h-[300px] flex flex-col justify-center">
                {inputMode === InputMode.IMAGE ? (
                  <div className="space-y-4">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 group
                        ${selectedImage ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      {selectedImage ? (
                        <div className="relative h-48 w-full">
                           <img src={selectedImage} alt="Selected Business Card" className="h-full w-full object-contain rounded-md" />
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-md flex items-center justify-center">
                              <p className="text-white opacity-0 group-hover:opacity-100 font-medium drop-shadow-md">画像を変更</p>
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-3 py-8">
                          <UploadIcon className="mx-auto h-12 w-12 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                          <div className="text-sm text-slate-600">
                            <span className="font-semibold text-indigo-600">クリックしてアップロード</span>
                            <br />またはドラッグ＆ドロップ
                          </div>
                          <p className="text-xs text-slate-400">PNG, JPG, GIF (最大 5MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="名刺に記載されているテキストを貼り付けてください..."
                    className="w-full h-64 p-4 rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50 resize-none text-sm leading-relaxed"
                  />
                )}

                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading || (inputMode === InputMode.IMAGE && !selectedImage) || (inputMode === InputMode.TEXT && !textInput)}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg hover:from-indigo-500 hover:to-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  {isLoading ? '解析中...' : (
                    <>
                      <SparklesIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      メールを作成する
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Output Section */}
            <div className="md:w-[45%] bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col">
              <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
                 <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                   作成結果
                 </h3>
                 
                 {!result ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 min-h-[300px]">
                     <div className="w-16 h-16 rounded-2xl bg-slate-200/50 flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                       </svg>
                     </div>
                     <p className="text-sm">左側のパネルから名刺を解析してください</p>
                   </div>
                 ) : (
                   <div className="space-y-6 animate-fade-in">
                     {/* Subject */}
                     <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="bg-indigo-50/50 px-4 py-2 border-b border-indigo-100 flex justify-between items-center">
                          <span className="text-xs font-semibold text-indigo-700">件名</span>
                          <button 
                            onClick={() => copyToClipboard(result.subject, true)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                            title="コピー"
                          >
                            {copiedSubject ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="p-4 text-sm font-medium text-slate-800 break-words leading-relaxed">
                          {result.subject}
                        </div>
                     </div>

                     {/* Body */}
                     <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="bg-indigo-50/50 px-4 py-2 border-b border-indigo-100 flex justify-between items-center">
                          <span className="text-xs font-semibold text-indigo-700">本文</span>
                          <button 
                             onClick={() => copyToClipboard(result.body, false)}
                             className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                             title="コピー"
                          >
                             {copiedBody ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-mono text-[13px]">
                          {result.body}
                        </div>
                     </div>

                     <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex gap-3">
                       <div className="flex-shrink-0 mt-0.5">
                         <SparklesIcon className="w-5 h-5 text-green-600" />
                       </div>
                       <p className="text-xs text-green-800 leading-5">
                         <strong>解析完了:</strong> 名刺から会社名と氏名を自動抽出し、テンプレートに適用しました。内容を確認してご利用ください。
                       </p>
                     </div>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400">
           Powered by OpenRouter AI
        </div>
      </div>
    </div>
  );
};

export default App;
