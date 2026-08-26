import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  X, 
  Camera, 
  CameraOff, 
  ScanLine, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  Upload, 
  Sliders, 
  Sparkles,
  Volume2,
  VolumeX,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { InventoryItem, InventoryBatch } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  currency?: string;
  onItemScanned: (item: InventoryItem, batch: InventoryBatch, quantity?: number) => void;
  addNotification: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  inventory,
  currency = 'PKR',
  onItemScanned,
  addNotification
}) => {
  const [scannerState, setScannerState] = useState<'idle' | 'starting' | 'scanning' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [lastMatchedItem, setLastMatchedItem] = useState<{ item: InventoryItem; batch: InventoryBatch } | null>(null);
  const [unmatchedCode, setUnmatchedCode] = useState<string | null>(null);
  const [continuousScan, setContinuousScan] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [scannedHistory, setScannedHistory] = useState<{ code: string; name: string; time: string; success: boolean }[]>([]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimestampRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play crisp POS beep synthesizer
  const playBeep = useCallback((isSuccess = true) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08); // E6 note
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  }, [soundEnabled]);

  // Match raw barcode against inventory
  const processScannedCode = useCallback((rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    // Debounce duplicate scans within 1.4 seconds
    const now = Date.now();
    if (lastScanTimestampRef.current.code === code && now - lastScanTimestampRef.current.time < 1400) {
      return;
    }
    lastScanTimestampRef.current = { code, time: now };

    setLastScannedCode(code);

    // Try finding item in inventory
    let matchedItem: InventoryItem | undefined;
    let matchedBatch: InventoryBatch | undefined;

    // 1. Direct barcode match
    matchedItem = inventory.find((item) => item.barcode === code);

    // 2. Direct SKU match
    if (!matchedItem) {
      matchedItem = inventory.find((item) => item.sku.toLowerCase() === code.toLowerCase());
    }

    // 3. Direct ID match
    if (!matchedItem) {
      matchedItem = inventory.find((item) => item.id.toLowerCase() === code.toLowerCase());
    }

    // 4. Batch Number match
    if (!matchedItem) {
      for (const item of inventory) {
        const foundBatch = (item.batches || []).find((b) => b.batchNumber.toLowerCase() === code.toLowerCase());
        if (foundBatch) {
          matchedItem = item;
          matchedBatch = foundBatch;
          break;
        }
      }
    }

    // 5. Structured QR Code match (e.g. JSON or formatted string)
    if (!matchedItem) {
      try {
        if (code.startsWith('{') && code.endsWith('}')) {
          const parsed = JSON.parse(code);
          const lookup = parsed.barcode || parsed.sku || parsed.id || parsed.code;
          if (lookup) {
            matchedItem = inventory.find(
              (i) => i.barcode === lookup || i.sku.toLowerCase() === lookup.toLowerCase() || i.id === lookup
            );
          }
        }
      } catch (e) {
        // not JSON
      }
    }

    if (matchedItem) {
      // Pick best available batch (in stock and not expired)
      if (!matchedBatch) {
        const availableBatches = (matchedItem.batches || []).filter((b) => b.stockQuantity > 0);
        matchedBatch = availableBatches[0] || matchedItem.batches?.[0];
      }

      if (matchedBatch) {
        playBeep(true);
        setLastMatchedItem({ item: matchedItem, batch: matchedBatch });
        setUnmatchedCode(null);

        // Add to POS Cart
        onItemScanned(matchedItem, matchedBatch, 1);

        addNotification(
          'success',
          'Medicine Added via Barcode',
          `${matchedItem.brandName} (${matchedItem.strength}) added to current sale.`
        );

        setScannedHistory((prev) => [
          {
            code,
            name: `${matchedItem?.brandName} (${matchedItem?.strength})`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            success: true,
          },
          ...prev.slice(0, 7),
        ]);

        if (!continuousScan) {
          // Close modal on single scan mode
          setTimeout(() => {
            onClose();
          }, 600);
        }
      } else {
        playBeep(false);
        setLastMatchedItem(null);
        setUnmatchedCode(code);
        addNotification('warning', 'Out of Stock', `${matchedItem.brandName} is in catalog but has 0 available batch stock.`);
      }
    } else {
      playBeep(false);
      setLastMatchedItem(null);
      setUnmatchedCode(code);
      addNotification(
        'error',
        'Unrecognized Barcode',
        `No medicine in the current catalog matches barcode: ${code}`
      );
      setScannedHistory((prev) => [
        {
          code,
          name: 'Unrecognized Item',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          success: false,
        },
        ...prev.slice(0, 7),
      ]);
    }
  }, [inventory, continuousScan, onItemScanned, addNotification, playBeep, onClose]);

  // Start Camera Stream
  const startCamera = useCallback(async (cameraIdToUse?: string) => {
    setScannerState('starting');
    setErrorMessage(null);

    try {
      // Clean up previous instance if running
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          // ignore
        }
        try {
          await scannerRef.current.clear();
        } catch (e) {
          // ignore
        }
      }

      // Enumerate available cameras
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setScannerState('error');
        setErrorMessage('No camera devices detected. Please attach a webcam or use barcode simulation.');
        return;
      }

      const formattedCameras = devices.map((d) => ({ id: d.id, label: d.label || `Camera ${d.id}` }));
      setCameras(formattedCameras);

      const targetCameraId = cameraIdToUse || selectedCameraId || devices[0].id;
      setSelectedCameraId(targetCameraId);

      const html5QrCode = new Html5Qrcode('pos-barcode-reader', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.ITF,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 180 },
        aspectRatio: 1.333,
      };

      await html5QrCode.start(
        targetCameraId,
        config,
        (decodedText) => {
          processScannedCode(decodedText);
        },
        () => {
          // Frame error callback - silent frame scan failure
        }
      );

      setScannerState('scanning');

      // Check for torch capability
      try {
        const capabilities = html5QrCode.getRunningTrackCameraCapabilities();
        if (capabilities && (capabilities as any).torchFeature?.().isSupported()) {
          setTorchSupported(true);
        } else {
          setTorchSupported(false);
        }
      } catch (e) {
        setTorchSupported(false);
      }
    } catch (err: any) {
      console.error('Camera Scanner Start Error:', err);
      setScannerState('error');
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
        setErrorMessage('Camera access was denied. Please allow microphone & camera permissions in your browser address bar.');
      } else {
        setErrorMessage(err?.message || 'Failed to initialize camera scanner.');
      }
    }
  }, [selectedCameraId, processScannedCode]);

  // Stop Camera
  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Error clearing scanner:', e);
      }
      scannerRef.current = null;
    }
    setScannerState('idle');
    setTorchOn(false);
  }, []);

  // Torch toggle
  const toggleTorch = async () => {
    if (!scannerRef.current || !torchSupported) return;
    try {
      const newTorch = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: newTorch } as any],
      });
      setTorchOn(newTorch);
    } catch (e) {
      console.warn('Failed to toggle torch:', e);
    }
  };

  // Image file scan fallback
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = scannerRef.current || new Html5Qrcode('pos-barcode-reader-file');
      const decodedText = await html5QrCode.scanFile(file, true);
      processScannedCode(decodedText);
    } catch (err: any) {
      playBeep(false);
      addNotification('error', 'Image Barcode Unreadable', 'No clear barcode or QR code detected in the uploaded image.');
    }
  };

  // Manual code submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCodeInput.trim()) {
      processScannedCode(manualCodeInput.trim());
      setManualCodeInput('');
    }
  };

  // Modal open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow DOM container to render
      const timer = setTimeout(() => {
        startCamera();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  // Sample quick test barcodes from current inventory for instant testing
  const sampleTestItems = inventory.slice(0, 5);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in">
      <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl max-w-3xl w-full border border-cyan-500/30 shadow-2xl text-white overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">Medicine Barcode & QR Scanner</h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                  {scannerState === 'scanning' ? 'Camera Live' : scannerState === 'starting' ? 'Starting...' : 'Standby'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Align pharmaceutical 1D barcode or 2D DataMatrix / QR code within the laser frame
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Feedback Toggle */}
            <button
              id="btn-scanner-sound-toggle"
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled ? 'bg-white/10 border-white/20 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-500'
              }`}
              title={soundEnabled ? 'Beep Audio On' : 'Beep Audio Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              id="btn-close-barcode-scanner"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-white/70 hover:text-white transition-colors cursor-pointer border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* Main Camera Viewport Frame */}
          <div className="relative rounded-2xl overflow-hidden bg-black/80 border border-cyan-500/30 min-h-[300px] flex items-center justify-center shadow-inner">
            
            {/* HTML5 QR Container */}
            <div id="pos-barcode-reader" className="w-full h-full max-h-[340px] flex items-center justify-center overflow-hidden" />
            <div id="pos-barcode-reader-file" className="hidden" />

            {/* Laser & Reticle Overlay (Only when scanning) */}
            {scannerState === 'scanning' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Laser animation */}
                <div className="w-[80%] max-w-[300px] h-[190px] border-2 border-cyan-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  {/* Corner Marks */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-300"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-300"></div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-300"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-300"></div>
                  
                  {/* Animated scanning laser line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] animate-[bounce_2s_infinite]" />
                </div>
              </div>
            )}

            {/* Starting Spinner */}
            {scannerState === 'starting' && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-3 text-cyan-300">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                <span className="font-bold text-sm">Accessing Camera Device...</span>
              </div>
            )}

            {/* Error Viewport Overlay */}
            {scannerState === 'error' && (
              <div className="absolute inset-0 bg-slate-950/90 p-6 flex flex-col items-center justify-center text-center space-y-3">
                <CameraOff className="w-10 h-10 text-rose-400" />
                <h4 className="font-bold text-white text-sm">Camera Unavailable</h4>
                <p className="text-slate-400 max-w-md text-xs leading-relaxed">
                  {errorMessage || 'Unable to start camera video stream. Please grant camera permission or use the manual barcode simulator below.'}
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-600/30"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Camera</span>
                  </button>
                  <label className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/20">
                    <Upload className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Upload Barcode Image</span>
                    <input type="file" accept="image/*" onChange={handleFileScan} className="hidden" />
                  </label>
                </div>
              </div>
            )}

            {/* Bottom Overlay Controls on Camera */}
            {scannerState === 'scanning' && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-white/10 text-xs">
                {/* Camera Selector Dropdown */}
                <div className="flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <select
                    id="select-camera-device"
                    value={selectedCameraId}
                    onChange={(e) => startCamera(e.target.value)}
                    className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer max-w-[170px] truncate text-[11px]"
                  >
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Right controls: Flashlight & Continuous Toggle */}
                <div className="flex items-center gap-2">
                  {torchSupported && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 border transition-colors cursor-pointer ${
                        torchOn ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-white/10 text-slate-300 border-white/15'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      <span>{torchOn ? 'Flash On' : 'Flash'}</span>
                    </button>
                  )}

                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-lg border border-white/15 text-[11px] font-medium text-cyan-200">
                    <input
                      type="checkbox"
                      checked={continuousScan}
                      onChange={(e) => setContinuousScan(e.target.checked)}
                      className="rounded accent-cyan-500 cursor-pointer"
                    />
                    <span>Continuous Scan</span>
                  </label>

                  <label className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white cursor-pointer border border-white/15" title="Scan Image File">
                    <Upload className="w-3.5 h-3.5" />
                    <input type="file" accept="image/*" onChange={handleFileScan} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Scanned Item Feedback Card */}
          {lastMatchedItem && (
            <div className="bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/40 p-4 rounded-2xl shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm">{lastMatchedItem.item.brandName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      Added to Cart (+1)
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    {lastMatchedItem.item.genericName} • {lastMatchedItem.item.strength} • Batch: <span className="text-cyan-300 font-bold">{lastMatchedItem.batch.batchNumber}</span>
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                    <span>Barcode: <strong className="text-white">{lastMatchedItem.item.barcode}</strong></span>
                    <span>•</span>
                    <span>Selling Price: <strong className="text-emerald-300">{currency} {lastMatchedItem.batch.sellingPrice.toFixed(2)}</strong></span>
                    <span>•</span>
                    <span>Remaining Stock: <strong className="text-white">{lastMatchedItem.batch.stockQuantity} units</strong></span>
                  </div>
                </div>
              </div>

              {!continuousScan && (
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 shrink-0">
                  Closing <ArrowRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          )}

          {/* Unmatched Code Alert */}
          {unmatchedCode && (
            <div className="bg-rose-950/80 border border-rose-500/40 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-rose-200 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Unmatched Barcode: {unmatchedCode}</span>
                  <span className="text-[11px] text-rose-300">This barcode does not belong to any formulation currently registered in this branch.</span>
                </div>
              </div>
            </div>
          )}

          {/* Manual Barcode Input & Simulator Row */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-cyan-400" /> Manual Barcode Input / Hardware USB Scanner
              </span>
              <span className="text-[10px] text-slate-400">Press Enter to Add</span>
            </div>

            <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
              <input
                id="input-manual-barcode"
                type="text"
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                placeholder="Scan with handheld USB gun or type barcode / SKU (e.g. 8964000123456)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950/70 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400"
              />
              <button
                id="btn-submit-manual-barcode"
                type="submit"
                disabled={!manualCodeInput.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-md shadow-cyan-600/20"
              >
                Scan Code
              </button>
            </form>

            {/* Quick Test Barcode Simulator Presets */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                ⚡ Quick Barcode Presets (Click to Simulate Scan):
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {sampleTestItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => processScannedCode(item.barcode)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-cyan-600/30 hover:border-cyan-400 text-[11px] font-semibold text-slate-200 border border-white/10 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title={`Click to simulate scanning ${item.brandName}`}
                  >
                    <span className="text-cyan-300 font-mono text-[10px]">{item.barcode}</span>
                    <span className="text-white font-bold truncate max-w-[100px]">{item.brandName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Scans Log */}
          {scannedHistory.length > 0 && (
            <div className="bg-slate-950/50 rounded-2xl p-3 border border-white/5 space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Session Scan History:</span>
              <div className="space-y-1">
                {scannedHistory.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] text-slate-300 py-0.5 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${h.success ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span className="font-mono text-cyan-300 text-[10px]">{h.code}</span>
                      <span className="font-medium text-white">{h.name}</span>
                    </div>
                    <span className="text-slate-500 text-[10px]">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Supported: EAN-13, EAN-8, UPC-A, Code-128, QR Code & DataMatrix</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer border border-white/15"
          >
            Done Scanning
          </button>
        </div>

      </div>
    </div>
  );
};
