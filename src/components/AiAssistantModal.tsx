import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  FileText, 
  ShieldAlert, 
  TrendingUp, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ShoppingCart, 
  ArrowRight,
  RefreshCw,
  Zap,
  Info,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  Trash2,
  Check,
  Radio
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { api } from '../services/api';

export const AiAssistantModal: React.FC = () => {
  const { 
    isAiModalOpen, 
    setIsAiModalOpen, 
    aiDefaultTab, 
    inventory, 
    currentTenant, 
    tenants, 
    addToCart, 
    addNotification 
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'prescription' | 'interactions' | 'reorder' | 'executive'>(aiDefaultTab);

  // Prescription parser state
  const [prescriptionText, setPrescriptionText] = useState(
    `Rx:\nPatient: Imran Farooq (Age 52)\nDiagnosis: Community-acquired pneumonia & Type 2 Diabetes\n1. Augmentin 625mg - 1 tab TID x 7 days\n2. Glucophage 500mg - 1 tab BD with meals\n3. Panadol 500mg - 1-2 tabs PRN for fever\nDr. M. Haris (FCPS)`
  );
  const [isParsingRx, setIsParsingRx] = useState(false);
  const [parsedRxResult, setParsedRxResult] = useState<any>(null);

  // Web Speech API Voice Dictation State
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechLanguage, setSpeechLanguage] = useState<'en-US' | 'en-GB' | 'ur-PK'>('en-US');
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [dictationMode, setDictationMode] = useState<'append' | 'replace'>('append');
  const [isSpeakingAdvice, setIsSpeakingAdvice] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextBeforeDictationRef = useRef<string>('');

  // Interaction check state
  const [selectedMedIds, setSelectedMedIds] = useState<string[]>(['med-1', 'med-3']);
  const [patientAge, setPatientAge] = useState<number>(55);
  const [isPregnant, setIsPregnant] = useState<boolean>(false);
  const [patientConditions, setPatientConditions] = useState<string>('Type 2 Diabetes, Mild Renal Impairment');
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [interactionResult, setInteractionResult] = useState<any>(null);

  // Smart reorder state
  const [isForecasting, setIsForecasting] = useState(false);
  const [reorderResult, setReorderResult] = useState<any>(null);

  // Executive summary state
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryResult, setSummaryResult] = useState<any>(null);

  // Check Web Speech API browser compatibility on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
    }
  }, []);

  // Cleanup speech recognition and synthesis on unmount or modal close
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop listening if modal closes or tab changes
  useEffect(() => {
    if (!isAiModalOpen || activeTab !== 'prescription') {
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
        setIsListening(false);
        setInterimTranscript('');
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeakingAdvice(false);
      }
    }
  }, [isAiModalOpen, activeTab, isListening]);

  // Voice Dictation Toggle Handler
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      addNotification('warning', 'Speech Recognition Not Supported', 'Your browser does not support the Web Speech API. Please use Chrome, Edge, or Safari.');
      setIsSpeechSupported(false);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsListening(false);
      setInterimTranscript('');
      addNotification('info', 'Dictation Stopped', 'Prescription text captured.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLanguage;
      recognitionRef.current = recognition;

      baseTextBeforeDictationRef.current = dictationMode === 'replace' ? '' : prescriptionText;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
        addNotification('info', 'Voice Dictation Active', `Listening in ${speechLanguage}. Speak prescription details clearly...`);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript + ' ';
          } else {
            currentInterim += transcript;
          }
        }

        setInterimTranscript(currentInterim);

        if (finalChunk) {
          setPrescriptionText((prev) => {
            const base = dictationMode === 'replace' && baseTextBeforeDictationRef.current === '' 
              ? '' 
              : prev.trim() ? prev.trim() + '\n' : '';
            return base + finalChunk.trim();
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech Recognition Error:', event.error);
        if (event.error === 'not-allowed') {
          addNotification('error', 'Microphone Access Denied', 'Please grant microphone permissions in your browser settings.');
        } else if (event.error !== 'no-speech') {
          addNotification('warning', 'Voice Dictation Error', `Speech error: ${event.error}`);
        }
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to initialize Speech Recognition:', err);
      addNotification('error', 'Dictation Error', err.message || 'Could not start voice recognition.');
      setIsListening(false);
    }
  };

  // Text to Speech Readout for Clinical Warnings / Guidance
  const handleSpeakAdvice = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) {
      addNotification('warning', 'TTS Not Supported', 'Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeakingAdvice) {
      window.speechSynthesis.cancel();
      setIsSpeakingAdvice(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeakingAdvice(false);
    utterance.onerror = () => setIsSpeakingAdvice(false);

    setIsSpeakingAdvice(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!isAiModalOpen) return null;

  // Handlers
  const handleParsePrescription = async () => {
    if (!prescriptionText.trim()) return;
    setIsParsingRx(true);
    try {
      const res = await api.analyzePrescription({
        text: prescriptionText,
        tenantId: currentTenant?.id,
      });
      setParsedRxResult(res);
      addNotification('success', 'Prescription Analyzed', 'Clinical medications and dosages parsed.');
    } catch (err: any) {
      addNotification('error', 'AI Analysis Failed', err.message);
    } finally {
      setIsParsingRx(false);
    }
  };

  const handleCheckInteractions = async () => {
    if (selectedMedIds.length < 2) {
      addNotification('warning', 'Select Medicines', 'Please select at least 2 medications to evaluate interactions.');
      return;
    }
    setIsCheckingInteractions(true);
    try {
      const conds = patientConditions.split(',').map((c) => c.trim()).filter(Boolean);
      const res = await api.checkDrugInteractions({
        medicineIds: selectedMedIds,
        patientAge,
        isPregnant,
        patientConditions: conds,
      });
      setInteractionResult(res);
      addNotification('success', 'Interaction Evaluation Complete', 'Pharmacological safety review generated.');
    } catch (err: any) {
      addNotification('error', 'Check Failed', err.message);
    } finally {
      setIsCheckingInteractions(false);
    }
  };

  const handleForecastReorder = async () => {
    setIsForecasting(true);
    try {
      const res = await api.forecastReorder({
        tenantId: currentTenant?.id || 'tenant-1',
      });
      setReorderResult(res);
      addNotification('success', 'Smart Reorder Generated', 'AI calculated stock replenishment forecasts.');
    } catch (err: any) {
      addNotification('error', 'Forecast Failed', err.message);
    } finally {
      setIsForecasting(false);
    }
  };

  const handleGenerateExecutiveSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const res = await api.getExecutiveSummary();
      setSummaryResult(res);
      addNotification('success', 'Executive Intelligence Ready', 'Consolidated network briefing generated.');
    } catch (err: any) {
      addNotification('error', 'Summary Failed', err.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleLoadPrescriptionToCart = () => {
    if (!parsedRxResult || !parsedRxResult.prescribedItems) return;
    let addedCount = 0;
    parsedRxResult.prescribedItems.forEach((m: any) => {
      const item = inventory.find((inv) => inv.id === m.matchedMedicineId);
      if (item && item.totalStock > 0) {
        addToCart(item, undefined, 1);
        addedCount++;
      }
    });

    addNotification('success', 'Loaded to Cart', `${addedCount} prescription medicines transferred to dispensing cart.`);
    setIsAiModalOpen(false);
  };

  const handleLoadSampleRx = () => {
    setPrescriptionText(
      `Rx:\nPatient: Imran Farooq (Age 52)\nDiagnosis: Community-acquired pneumonia & Type 2 Diabetes\n1. Augmentin 625mg - 1 tab TID x 7 days\n2. Glucophage 500mg - 1 tab BD with meals\n3. Panadol 500mg - 1-2 tabs PRN for fever\nDr. M. Haris (FCPS)`
    );
    addNotification('info', 'Sample Rx Loaded', 'Standard clinical prescription template populated.');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in">
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl max-w-4xl w-full border border-white/70 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-cyan-900/90 via-slate-900/90 to-teal-900/90 p-5 text-white flex items-center justify-between border-b border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 to-teal-300 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">AI Pharmacist Intelligence Hub</h2>
                <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
                  Powered by Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-xs text-cyan-100/70">
                Clinical decision support, voice-powered prescription dictation, pharmacological safety & forecasting
              </p>
            </div>
          </div>

          <button
            id="btn-close-ai-modal"
            onClick={() => setIsAiModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer border border-white/10"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 px-6 py-3 bg-white/50 border-b border-slate-200/50 text-xs overflow-x-auto">
          <button
            id="ai-tab-rx"
            onClick={() => setActiveTab('prescription')}
            className={`px-4 py-2 rounded-2xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'prescription'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Prescription Parser & Voice Dictation</span>
          </button>

          <button
            id="ai-tab-interactions"
            onClick={() => setActiveTab('interactions')}
            className={`px-4 py-2 rounded-2xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'interactions'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />
            <span>Drug Interactions & Safety</span>
          </button>

          <button
            id="ai-tab-reorder"
            onClick={() => setActiveTab('reorder')}
            className={`px-4 py-2 rounded-2xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'reorder'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Smart Reorder Forecast</span>
          </button>

          <button
            id="ai-tab-executive"
            onClick={() => setActiveTab('executive')}
            className={`px-4 py-2 rounded-2xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'executive'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>HQ Executive Briefing</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          
          {/* TAB 1: Prescription Parser & Web Speech Dictation */}
          {activeTab === 'prescription' && (
            <div className="space-y-4">
              <div className="bg-cyan-500/10 p-4 rounded-2xl border border-cyan-500/20 flex items-start gap-3 shadow-xs">
                <Info className="w-4 h-4 text-cyan-800 shrink-0 mt-0.5" />
                <div className="text-cyan-950 font-medium leading-relaxed">
                  <strong className="font-bold text-cyan-900">Clinical NLP & Voice Dictation Engine:</strong> Pharmacists can use their microphone to dictate doctor orders hands-free, or paste prescription text. The AI extracts medications, strengths, dosages, cross-references your branch inventory in real time, and enables 1-click dispensing.
                </div>
              </div>

              {/* Dictation Control & Toolbar */}
              <div className="bg-gradient-to-r from-slate-900/95 via-cyan-950/95 to-slate-900/95 p-3.5 rounded-2xl border border-cyan-500/30 text-white shadow-lg flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Big Voice Dictation Toggle Button */}
                  <button
                    id="btn-voice-dictate-rx"
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all cursor-pointer shadow-md ${
                      isListening
                        ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-rose-600/30 ring-2 ring-rose-400/50'
                        : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-cyan-500/20 font-extrabold'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4 text-white" />
                        <span>Stop Voice Dictation</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-slate-950" />
                        <span>Dictate Prescription (Microphone)</span>
                      </>
                    )}
                  </button>

                  {/* Active Audio Waveform & Status Indicator */}
                  {isListening ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                      </span>
                      <span className="font-bold text-[11px]">Recording Voice...</span>
                      <div className="flex items-end gap-0.5 h-3 ml-1">
                        <span className="w-0.5 h-2 bg-rose-400 animate-pulse"></span>
                        <span className="w-0.5 h-3 bg-rose-300 animate-pulse [animation-delay:150ms]"></span>
                        <span className="w-0.5 h-1.5 bg-rose-400 animate-pulse [animation-delay:300ms]"></span>
                        <span className="w-0.5 h-2.5 bg-rose-300 animate-pulse [animation-delay:450ms]"></span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-cyan-200/70 hidden sm:inline-flex items-center gap-1.5 font-medium">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      {isSpeechSupported ? 'Web Speech API Ready' : 'Browser Speech Unsupported'}
                    </span>
                  )}
                </div>

                {/* Dictation Settings & Helper Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Language Selector */}
                  <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-xl border border-white/15 text-[11px]">
                    <Languages className="w-3 h-3 text-cyan-300" />
                    <select
                      id="select-speech-language"
                      value={speechLanguage}
                      onChange={(e) => setSpeechLanguage(e.target.value as any)}
                      disabled={isListening}
                      className="bg-transparent text-cyan-100 font-semibold focus:outline-none cursor-pointer text-[11px]"
                    >
                      <option value="en-US" className="bg-slate-900 text-white">English (US)</option>
                      <option value="en-GB" className="bg-slate-900 text-white">English (UK)</option>
                      <option value="ur-PK" className="bg-slate-900 text-white">Urdu / Mixed (PK)</option>
                    </select>
                  </div>

                  {/* Mode: Append vs Replace */}
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-xl border border-white/15 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDictationMode(dictationMode === 'append' ? 'replace' : 'append')}
                      className="text-cyan-200 hover:text-white font-medium transition-colors cursor-pointer"
                      title="Toggle between appending dictated text or replacing current content"
                    >
                      Mode: <span className="font-bold text-cyan-300 uppercase">{dictationMode}</span>
                    </button>
                  </div>

                  {/* Clear Button */}
                  <button
                    type="button"
                    onClick={() => setPrescriptionText('')}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500/30 text-white/70 hover:text-white transition-colors cursor-pointer border border-white/15"
                    title="Clear Prescription Text"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Sample Rx Button */}
                  <button
                    type="button"
                    onClick={handleLoadSampleRx}
                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-200 hover:text-white font-semibold text-[11px] transition-colors cursor-pointer border border-white/15"
                  >
                    Load Sample Rx
                  </button>
                </div>
              </div>

              {/* Real-time Interim Voice Transcript Banner */}
              {isListening && interimTranscript && (
                <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-950 animate-in fade-in flex items-center gap-2">
                  <Mic className="w-4 h-4 text-cyan-700 animate-pulse shrink-0" />
                  <div className="text-xs">
                    <span className="text-cyan-800 font-bold mr-1">Hearing:</span>
                    <span className="italic font-medium text-slate-800">"{interimTranscript}"</span>
                  </div>
                </div>
              )}

              {/* Prescription Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 block">Doctor Prescription Text / Rx Notes</label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {prescriptionText.length} characters • {prescriptionText.split('\n').filter(Boolean).length} lines
                  </span>
                </div>
                <textarea
                  id="textarea-rx-input"
                  rows={5}
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  placeholder="Dictate using microphone or paste prescription text here..."
                  className={`w-full p-3.5 rounded-2xl border font-mono text-xs focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 bg-white/70 shadow-inner transition-all ${
                    isListening ? 'border-cyan-400/80 ring-2 ring-cyan-500/20' : 'border-white/80'
                  }`}
                />
              </div>

              {/* Voice Dictation Speech Guidance Tip */}
              <div className="bg-slate-100/80 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                <span>
                  💡 <strong>Voice Dictation Tip:</strong> Say <em className="text-cyan-950 font-semibold">"Patient Ali Khan, diagnosis hypertension, 1. Amlodipine 5mg once daily x 30 days"</em> for automatic clinical parsing.
                </span>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <button
                  id="btn-run-parse-rx"
                  onClick={handleParsePrescription}
                  disabled={isParsingRx || !prescriptionText.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/10 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isParsingRx ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <Sparkles className="w-4 h-4 text-cyan-400" />}
                  <span>{isParsingRx ? 'Analyzing Clinical Text...' : 'Analyze & Map Prescription'}</span>
                </button>

                {parsedRxResult && (
                  <button
                    id="btn-load-rx-cart"
                    onClick={handleLoadPrescriptionToCart}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Load Extracted Medicines into POS Cart</span>
                  </button>
                )}
              </div>

              {/* Parsed Result Display */}
              {parsedRxResult && (
                <div className="bg-white/60 rounded-3xl p-5 border border-white/70 shadow-sm space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-3 gap-3 bg-white/80 p-3.5 rounded-2xl border border-white/80 text-slate-700 shadow-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Patient</span>
                      <strong className="text-slate-900">{parsedRxResult.detectedPatientName || 'Not specified'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Prescribing Doctor</span>
                      <strong className="text-slate-900">{parsedRxResult.detectedDoctorName || 'Not specified'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Clinical Diagnosis</span>
                      <strong className="text-slate-900">{parsedRxResult.diagnosis || 'Clinical evaluation'}</strong>
                    </div>
                  </div>

                  {/* Medicines List */}
                  <div>
                    <h4 className="font-bold text-cyan-950 mb-2">Extracted Medications & Catalog Match</h4>
                    <div className="space-y-2">
                      {parsedRxResult.prescribedItems?.map((item: any, i: number) => {
                        const matched = item.matchedMedicineId
                          ? inventory.find((inv) => inv.id === item.matchedMedicineId)
                          : undefined;
                        const inStock = !!matched && matched.totalStock > 0;
                        return (
                          <div key={i} className="bg-white/90 p-3.5 rounded-2xl border border-white/80 shadow-xs flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{item.medicineName}</span>
                                {inStock ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 text-[10px] font-bold border border-emerald-500/30">
                                    In Stock
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-800 text-[10px] font-bold border border-rose-500/30">
                                    Catalog Match Needed
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                                {item.genericName ? <>Generic: <strong className="text-slate-800">{item.genericName}</strong> • </> : null}Dosage: <strong className="text-slate-800">{item.dosage}</strong>{item.quantity ? <> • Qty: <strong className="text-slate-800">{item.quantity}</strong></> : null}
                              </div>
                              {item.safetyNotes && (
                                <div className="text-[10px] text-cyan-900 mt-0.5 font-semibold">
                                  Notes: {item.safetyNotes}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clinical Warnings */}
                  {parsedRxResult.clinicalWarnings?.length > 0 && (
                    <div className="bg-rose-500/15 p-3.5 rounded-2xl border border-rose-500/30 text-rose-950 text-xs font-medium space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="font-bold text-rose-900 block">Clinical Warnings:</strong>
                        <button
                          type="button"
                          onClick={() => handleSpeakAdvice(parsedRxResult.clinicalWarnings.join('. '))}
                          className="px-2.5 py-1 rounded-lg bg-rose-900 text-white font-bold text-[10px] flex items-center gap-1 hover:bg-rose-800 transition-colors cursor-pointer"
                        >
                          {isSpeakingAdvice ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          <span>{isSpeakingAdvice ? 'Stop Reading' : 'Audio Readout'}</span>
                        </button>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {parsedRxResult.clinicalWarnings.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Pharmacist Guidance */}
                  {parsedRxResult.summaryAdvice && (
                    <div className="bg-amber-500/15 p-3.5 rounded-2xl border border-amber-500/30 text-amber-950 text-xs font-medium">
                      <strong className="font-bold text-amber-900">Pharmacist Dispensing Caution:</strong> {parsedRxResult.summaryAdvice}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Drug-Drug Interactions */}
          {activeTab === 'interactions' && (
            <div className="space-y-4">
              <div className="bg-teal-500/10 p-4 rounded-2xl border border-teal-500/20 flex items-start gap-3 shadow-xs">
                <ShieldAlert className="w-4 h-4 text-teal-800 shrink-0 mt-0.5" />
                <div className="text-teal-950 font-medium">
                  <strong className="font-bold text-teal-900">Clinical Pharmacology & Contraindication Engine:</strong> Select multiple formulations and enter patient physiology metrics. The AI cross-references cytochrome P450 pathways, QT prolongation, renal clearance, and contraindications.
                </div>
              </div>

              {/* Medicine Selectors */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Select Medications to Compare</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2.5 bg-white/60 rounded-2xl border border-white/70 shadow-xs">
                  {inventory.map((item) => {
                    const isSelected = selectedMedIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMedIds(selectedMedIds.filter((id) => id !== item.id));
                          } else {
                            setSelectedMedIds([...selectedMedIds, item.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl text-left text-[11px] font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                            : 'bg-white/80 text-slate-700 border-white/80 hover:bg-white'
                        }`}
                      >
                        <div className="truncate">{item.brandName}</div>
                        <div className="text-[9px] opacity-70 truncate">{item.genericName}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patient Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Patient Age</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Pregnancy Status</label>
                  <select
                    value={isPregnant ? 'yes' : 'no'}
                    onChange={(e) => setIsPregnant(e.target.value === 'yes')}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs"
                  >
                    <option value="no">Not Pregnant</option>
                    <option value="yes">Pregnant / Nursing</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Pre-existing Conditions</label>
                  <input
                    type="text"
                    value={patientConditions}
                    onChange={(e) => setPatientConditions(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs"
                  />
                </div>
              </div>

              <button
                id="btn-run-check-interactions"
                onClick={handleCheckInteractions}
                disabled={isCheckingInteractions}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {isCheckingInteractions ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <Sparkles className="w-4 h-4 text-cyan-400" />}
                <span>Evaluate Pharmacological Interactions</span>
              </button>

              {/* Interaction Results */}
              {interactionResult && (
                <div className="bg-white/60 rounded-3xl p-5 border border-white/70 space-y-4 animate-in fade-in shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Safety Verdict:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      interactionResult.overallRiskLevel === 'HIGH' || interactionResult.overallRiskLevel === 'CRITICAL' 
                        ? 'bg-rose-500/15 text-rose-800 border border-rose-500/30' 
                        : interactionResult.overallRiskLevel === 'MODERATE'
                        ? 'bg-amber-500/15 text-amber-800 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30'
                    }`}>
                      Risk Level: {interactionResult.overallRiskLevel}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {interactionResult.interactions?.map((inter: any, idx: number) => (
                      <div key={idx} className="bg-white/90 p-4 rounded-2xl border border-white/80 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 font-bold">{inter.drugA} + {inter.drugB}</strong>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            inter.severity === 'SEVERE' ? 'bg-rose-500/15 text-rose-800 border border-rose-500/30' : 'bg-amber-500/15 text-amber-800 border border-amber-500/30'
                          }`}>
                            {inter.severity}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs">{inter.mechanism}</p>
                        <div className="text-cyan-950 font-semibold text-[11px] bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20">
                          Clinical Action: {inter.clinicalRecommendation}
                        </div>
                      </div>
                    ))}
                  </div>

                  {interactionResult.pharmacistGuidance && (
                    <div className="text-cyan-950 font-semibold text-[11px] bg-teal-500/10 p-3 rounded-xl border border-teal-500/20">
                      <strong className="font-bold text-teal-900">Pharmacist Guidance:</strong> {interactionResult.pharmacistGuidance}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Smart Reorder Forecast */}
          {activeTab === 'reorder' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 flex items-start gap-3 shadow-xs">
                <Zap className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <div className="text-amber-950 font-medium">
                  <strong className="font-bold text-amber-900">Predictive Inventory Replenishment:</strong> AI reviews stock velocity, batch expiration dates, and branch lead times to suggest optimal Purchase Order quantities without tying up excess capital.
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-slate-800">Forecast for: {currentTenant ? currentTenant.name : 'Network Warehouses'}</h4>
                  <p className="text-slate-500">Includes safety buffer and seasonal demand weighting</p>
                </div>

                <button
                  id="btn-run-reorder-forecast"
                  onClick={handleForecastReorder}
                  disabled={isForecasting}
                  className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isForecasting ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <Sparkles className="w-4 h-4 text-cyan-400" />}
                  <span>Generate Reorder Plan</span>
                </button>
              </div>

              {reorderResult && (() => {
                const purchaseOrders = reorderResult.recommendedPurchaseOrders || [];
                const flatItems = purchaseOrders.flatMap((po: any) =>
                  (po.items || []).map((it: any) => ({
                    ...it,
                    supplierName: po.supplierName,
                    rationale: po.rationale,
                  }))
                );
                const budget = purchaseOrders.reduce(
                  (sum: number, po: any) =>
                    sum +
                    (po.estimatedTotalCost ||
                      (po.items || []).reduce(
                        (s: number, it: any) => s + (it.suggestedQuantity || 0) * (it.estimatedUnitCost || 0),
                        0
                      )),
                  0
                );
                return (
                <div className="bg-white/60 rounded-3xl p-5 border border-white/70 space-y-4 animate-in fade-in shadow-xs">
                  {reorderResult.executiveSummary && (
                    <div className="bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/20 text-amber-950 text-[11px] font-medium">
                      {reorderResult.executiveSummary}
                    </div>
                  )}
                  <div className="flex justify-between items-center bg-white/90 p-4 rounded-2xl border border-white/80 shadow-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Estimated Reorder Budget</span>
                      <strong className="text-base text-cyan-950 font-extrabold">
                        {currentTenant?.currency || 'PKR'} {budget.toLocaleString()}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block font-medium">Priority Recommendations</span>
                      <strong className="text-emerald-700 font-extrabold">{flatItems.length} Formulations</strong>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {flatItems.map((rec: any, idx: number) => {
                      const matched = rec.medicineId ? inventory.find((inv) => inv.id === rec.medicineId) : undefined;
                      const currentStock = matched ? matched.totalStock : 0;
                      const lineCost = (rec.suggestedQuantity || 0) * (rec.estimatedUnitCost || 0);
                      return (
                      <div key={idx} className="bg-white/90 p-4 rounded-2xl border border-white/80 shadow-xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{rec.medicineName}</div>
                          <div className="text-[11px] text-slate-500">
                            Current Stock: <strong className="text-rose-600">{currentStock} units</strong> • Reorder: <strong className="text-emerald-700 font-bold">+{rec.suggestedQuantity} units</strong>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Supplier: {rec.supplierName} • Reason: {rec.rationale}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">{currentTenant?.currency || 'PKR'} {lineCost.toLocaleString()}</div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            rec.priority === 'HIGH' ? 'bg-rose-500/15 text-rose-800 border border-rose-500/30' : 'bg-amber-500/15 text-amber-800 border border-amber-500/30'
                          }`}>
                            {rec.priority} Priority
                          </span>
                        </div>
                      </div>
                      );
                    })}
                  </div>

                  {reorderResult.stockOptimizationTips?.length > 0 && (
                    <div className="bg-cyan-500/10 p-3.5 rounded-2xl border border-cyan-500/20 text-cyan-950 text-[11px] font-medium space-y-1">
                      <strong className="font-bold text-cyan-900 block">Stock Optimization Tips:</strong>
                      <ul className="list-disc list-inside space-y-0.5">
                        {reorderResult.stockOptimizationTips.map((tip: string, i: number) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                );
              })()}
            </div>
          )}

          {/* TAB 4: HQ Executive Briefing */}
          {activeTab === 'executive' && (
            <div className="space-y-4">
              <div className="bg-sky-500/10 p-4 rounded-2xl border border-sky-500/20 flex items-start gap-3 shadow-xs">
                <Building2 className="w-4 h-4 text-sky-800 shrink-0 mt-0.5" />
                <div className="text-sky-950 font-medium">
                  <strong className="font-bold text-sky-900">Network HQ Executive Intelligence:</strong> AI reviews gross margins, fast-moving formulations, inter-branch stock imbalances, and provides strategic guidance for group pharmacy owners.
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  id="btn-run-exec-summary"
                  onClick={handleGenerateExecutiveSummary}
                  disabled={isGeneratingSummary}
                  className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isGeneratingSummary ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <Sparkles className="w-4 h-4 text-cyan-400" />}
                  <span>Generate Network Intelligence Briefing</span>
                </button>
              </div>

              {summaryResult && (
                <div className="bg-white/60 rounded-3xl p-5 border border-white/70 space-y-4 animate-in fade-in text-slate-700 shadow-xs">
                  <div className="bg-white/90 p-4 rounded-2xl border border-white/80 shadow-xs">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Executive Summary</h4>
                    <p className="text-slate-600 leading-relaxed">{summaryResult.headline}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white/90 p-4 rounded-2xl border border-white/80 shadow-xs space-y-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-600" /> Top Revenue Drivers
                      </h4>
                      <ul className="space-y-1 list-disc list-inside text-slate-600">
                        {summaryResult.keyHighlights?.map((h: string, i: number) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white/90 p-4 rounded-2xl border border-white/80 shadow-xs space-y-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" /> Operational Action Items
                      </h4>
                      <ul className="space-y-1 list-disc list-inside text-slate-600">
                        {summaryResult.strategicRecommendations?.map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

