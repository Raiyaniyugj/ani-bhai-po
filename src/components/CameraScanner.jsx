import React, { useRef, useState } from 'react';
import { useZxing } from 'react-zxing';
import { BarcodeFormat, DecodeHintType, BrowserMultiFormatReader } from '@zxing/library';
import { ScanLine, X, Upload, AlertCircle } from 'lucide-react';

const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.CODABAR,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.ITF,
  BarcodeFormat.QR_CODE,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.PDF_417,
  BarcodeFormat.AZTEC
]);

const CameraScanner = ({ onResult, onClose }) => {
  const fileInputRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { ref } = useZxing({
    hints,
    timeBetweenDecodingAttempts: 150,
    constraints: {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    },
    onDecodeResult(result) {
      onResult(result.rawValue || (result.getText && result.getText()) || result.text);
    },
    onError(error) {
      // Ignore normal scanning errors when barcode is just not in frame
      if (
        error.name === 'NotFoundException' || 
        error.name === 'ChecksumException' || 
        error.name === 'FormatException'
      ) {
        return;
      }
      console.error("Camera Error:", error);
      setErrorMsg("Camera error: " + (error.message || "Permission denied or no camera found."));
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new BrowserMultiFormatReader(hints);
    const imageUrl = URL.createObjectURL(file);
    
    try {
      const result = await reader.decodeFromImageUrl(imageUrl);
      onResult(result.getText());
    } catch (err) {
      alert("Could not find a barcode in this image.");
    } finally {
      URL.revokeObjectURL(imageUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2"><ScanLine size={18} /> Scanner</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded transition-colors"><X size={20} /></button>
        </div>
        
        <div className="aspect-square relative bg-black flex flex-col items-center justify-center">
          {errorMsg ? (
            <div className="text-rose-500 flex flex-col items-center gap-2 p-4 text-center">
              <AlertCircle size={32} />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          ) : (
            <>
              <video ref={ref} className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-indigo-500/50 m-12 rounded-2xl pointer-events-none animate-pulse"></div>
            </>
          )}
        </div>

        <div className="p-4 flex flex-col gap-3 text-center text-sm text-slate-500">
          <p>Point your camera at a barcode to scan it automatically.</p>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400 uppercase font-semibold">Or</span>
            </div>
          </div>

          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl font-medium transition-colors"
          >
            <Upload size={16} /> Scan from Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraScanner;
