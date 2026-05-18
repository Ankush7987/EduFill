import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
// 🚀 FIXED: ALL missing icons imported successfully to prevent crashes
import { 
  Maximize, ArrowLeft, UploadCloud, Crop as CropIcon, X, Check, RotateCw, 
  Download, Loader2, Sparkles, Image as ImageIcon, ShieldCheck, HardDrive, 
  Settings2, FileImage, Eye, PenTool, RefreshCcw, Lock, Zap, FileText, CheckCircle2 
} from 'lucide-react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; 
import SEO from '../components/SEO';


const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://edufills.com').replace(/\/$/, '');

const resizerSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'EduFill Photo & Signature Resizer',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web Browser',
  url: `${SITE_URL}/tools/resizer`,
  description: 'Resize and compress passport photos and signatures to exact KB sizes directly in the browser.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
};
const SUPPORTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_CANVAS_SIDE = 4096;
const MIN_CANVAS_SCALE = 0.01;
const MAX_JPEG_QUALITY = 0.96;
const MIN_JPEG_QUALITY = 0.03;

const getOutputMimeType = (format) => (format === 'PNG' ? 'image/png' : 'image/jpeg');
const getOutputExtension = (format) => (format === 'PNG' ? 'png' : 'jpg');

const safeBaseName = (name = 'edufill-resized') => name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');

const blobToFile = (blob, originalName, format) => {
  const ext = getOutputExtension(format);
  return new File([blob], `${safeBaseName(originalName)}_${Date.now()}.${ext}`, {
    type: getOutputMimeType(format),
  });
};

const canvasToBlob = (canvas, mimeType, quality = 0.92) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (!blob) reject(new Error('Could not create image output.'));
    else resolve(blob);
  }, mimeType, quality);
});

// Browser image decoders ignore safe trailing bytes after JPG EOI / PNG IEND.
// This lets the downloaded file match the selected KB exactly after compression
// has produced a valid image under the target size.
const makeExactSizeBlob = async (blob, targetBytes, mimeType) => {
  if (blob.size === targetBytes) return blob;

  if (blob.size > targetBytes) {
    throw new Error(`Could not reach ${Math.round(targetBytes / 1024)} KB. Try a higher target size or crop the image smaller.`);
  }

  const padding = new Uint8Array(targetBytes - blob.size);
  return new Blob([blob, padding], { type: mimeType });
};

const fileToImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('Could not read this image. Please try another file.'));
  };
  image.src = url;
});

const createCanvasFromImage = (image, scale = 1, mimeType = 'image/jpeg') => {
  const maxNaturalSide = Math.max(image.naturalWidth, image.naturalHeight);
  const safetyScale = maxNaturalSide > MAX_CANVAS_SIDE ? MAX_CANVAS_SIDE / maxNaturalSide : 1;
  const finalScale = Math.max(0.05, Math.min(1, scale * safetyScale));
  const width = Math.max(1, Math.round(image.naturalWidth * finalScale));
  const height = Math.max(1, Math.round(image.naturalHeight * finalScale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: mimeType === 'image/png' });

  if (!ctx) {
    throw new Error('Canvas is not supported in this browser.');
  }

  if (mimeType === 'image/png') {
    ctx.clearRect(0, 0, width, height);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
};

const compressJpegToTarget = async (image, targetBytes) => {
  let bestUnder = null;
  let bestMeta = null;
  let smallestTried = null;
  let smallestMeta = null;

  for (let scale = 1; scale >= MIN_CANVAS_SCALE; scale *= 0.86) {
    const canvas = createCanvasFromImage(image, scale, 'image/jpeg');
    let low = MIN_JPEG_QUALITY;
    let high = MAX_JPEG_QUALITY;

    for (let i = 0; i < 24; i += 1) {
      const quality = (low + high) / 2;
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality);

      if (!smallestTried || blob.size < smallestTried.size) {
        smallestTried = blob;
        smallestMeta = { width: canvas.width, height: canvas.height, quality, resized: scale < 0.995 };
      }

      if (blob.size <= targetBytes) {
        if (!bestUnder || blob.size > bestUnder.size) {
          bestUnder = blob;
          bestMeta = { width: canvas.width, height: canvas.height, quality, resized: scale < 0.995 };
        }
        low = quality;
      } else {
        high = quality;
      }
    }

    // If we are already very close, stop early. Padding will make it exact.
    if (bestUnder && targetBytes - bestUnder.size <= 512) break;
  }

  if (!bestUnder) {
    const fallbackScale = MIN_CANVAS_SCALE;
    const fallbackCanvas = createCanvasFromImage(image, fallbackScale, 'image/jpeg');
    const fallbackBlob = await canvasToBlob(fallbackCanvas, 'image/jpeg', MIN_JPEG_QUALITY);

    if (fallbackBlob.size <= targetBytes) {
      return {
        blob: fallbackBlob,
        meta: { width: fallbackCanvas.width, height: fallbackCanvas.height, quality: MIN_JPEG_QUALITY, resized: true },
      };
    }

    throw new Error(`Target ${Math.round(targetBytes / 1024)} KB is too low for this image. Please select a higher KB value.`);
  }

  return {
    blob: bestUnder,
    meta: bestMeta || smallestMeta,
  };
};

const compressPngToTarget = async (image, targetBytes) => {
  let bestUnder = null;
  let bestMeta = null;
  let smallestTried = null;
  let smallestMeta = null;

  // PNG does not support quality compression like JPG. For PNG, the reliable way
  // is to preserve PNG format and reduce dimensions until it goes under target,
  // then pad to exact KB.
  let low = MIN_CANVAS_SCALE;
  let high = 1;

  for (let i = 0; i < 28; i += 1) {
    const scale = (low + high) / 2;
    const canvas = createCanvasFromImage(image, scale, 'image/png');
    const blob = await canvasToBlob(canvas, 'image/png');

    if (!smallestTried || blob.size < smallestTried.size) {
      smallestTried = blob;
      smallestMeta = { width: canvas.width, height: canvas.height, resized: scale < 0.995 };
    }

    if (blob.size <= targetBytes) {
      if (!bestUnder || blob.size > bestUnder.size) {
        bestUnder = blob;
        bestMeta = { width: canvas.width, height: canvas.height, resized: scale < 0.995 };
      }
      low = scale;
    } else {
      high = scale;
    }
  }

  if (!bestUnder) {
    const fallbackCanvas = createCanvasFromImage(image, MIN_CANVAS_SCALE, 'image/png');
    const fallbackBlob = await canvasToBlob(fallbackCanvas, 'image/png');

    if (fallbackBlob.size <= targetBytes) {
      return {
        blob: fallbackBlob,
        meta: { width: fallbackCanvas.width, height: fallbackCanvas.height, resized: true },
      };
    }

    throw new Error(`Target ${Math.round(targetBytes / 1024)} KB is too low for PNG. Please choose JPG or increase target size.`);
  }

  return {
    blob: bestUnder,
    meta: bestMeta || smallestMeta,
  };
};

export default function PhotoSignResizer() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Upload & File States
  const [currentRawFile, setCurrentRawFile] = useState(null);
  const [croppedFile, setCroppedFile] = useState(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState('');
  const [uploadType, setUploadType] = useState('photo'); // 'photo' or 'signature'
  
  // Compression States
  const [targetSizeKB, setTargetSizeKB] = useState(50);
  const [outputFormat, setOutputFormat] = useState('JPG');
  const [isCompressing, setIsProcessing] = useState(false);
  const [compressedFile, setCompressedFile] = useState(null);
  const [compressedUrl, setCompressedUrl] = useState(null);
  const [resultInfo, setResultInfo] = useState(null);

  useEffect(() => {
    return () => {
      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    };
  }, [compressedUrl]);

  useEffect(() => {
    if (!croppedFile) {
      setCroppedPreviewUrl('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(croppedFile);
    setCroppedPreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [croppedFile]);

  const resetOutput = () => {
    if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    setCompressedFile(null);
    setCompressedUrl(null);
    setResultInfo(null);
  };

  const resetAll = () => {
    resetOutput();
    setCurrentRawFile(null);
    setCroppedFile(null);
    setImgSrc('');
    setCompletedCrop(null);
    setCrop(undefined);
    setCropModalOpen(false);
  };

  // View Modal State
  const [viewImage, setViewImage] = useState(null);
  
  // Crop Modal States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  // Gemini Style Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);

  // 1. HANDLE FILE SELECTION
  const processFile = (file) => {
    if (!file || !SUPPORTED_TYPES.includes(file.type)) {
      alert("Please upload a valid image file (JPG, JPEG, PNG or WEBP).");
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      alert("Please upload an image under 10 MB.");
      return;
    }

    setCurrentRawFile(file);
    // Reset previous outputs
    resetOutput();
    setCroppedFile(null);

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImgSrc(String(reader.result || ''));
      setCompletedCrop(null);
      setCrop(undefined);
      setCropModalOpen(true);
    });
    reader.addEventListener('error', () => {
      alert('Could not read this image. Please try another file.');
      setCurrentRawFile(null);
    });
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    processFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDragEnter = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    // Default square-ish crop, user can adjust
    const initialCrop = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 1, width, height), width, height);
    setCrop(initialCrop); 
    setCompletedCrop(initialCrop); 
  };

  const handleRotate = () => {
    const image = imgRef.current;
    if (!image) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      alert('Canvas is not supported in this browser.');
      return;
    }

    canvas.width = image.naturalHeight;
    canvas.height = image.naturalWidth;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(90 * Math.PI / 180);
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    setImgSrc(canvas.toDataURL('image/jpeg', 1.0));
    setCompletedCrop(null); 
  };

  const saveOriginalWithoutCrop = () => {
    setCroppedFile(currentRawFile);
    setCompressedFile(null);
    setCompressedUrl(null);
    setResultInfo(null);
    setCropModalOpen(false);
  };

  const handleCropSave = async () => {
    if (!completedCrop || !completedCrop.width || !completedCrop.height) {
      saveOriginalWithoutCrop();
      return;
    }
    const image = imgRef.current;

    if (!image) {
      saveOriginalWithoutCrop();
      return;
    }

    let cropX, cropY, cropW, cropH;
    
    if (completedCrop.unit === '%') {
      cropX = (completedCrop.x / 100) * image.width; cropY = (completedCrop.y / 100) * image.height;
      cropW = (completedCrop.width / 100) * image.width; cropH = (completedCrop.height / 100) * image.height;
    } else {
      cropX = completedCrop.x; cropY = completedCrop.y; cropW = completedCrop.width; cropH = completedCrop.height;
    }

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = Math.max(1, Math.round(cropW * scaleX));
    canvas.height = Math.max(1, Math.round(cropH * scaleY));
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      alert('Canvas is not supported in this browser.');
      return;
    }

    ctx.drawImage(image, cropX * scaleX, cropY * scaleY, cropW * scaleX, cropH * scaleY, 0, 0, canvas.width, canvas.height);
    const cropMimeType = currentRawFile?.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const cropExt = cropMimeType === 'image/png' ? 'png' : 'jpg';

    canvas.toBlob((blob) => {
      if (!blob) {
        alert('Could not create cropped image. Please try again.');
        return;
      }

      const cleanName = safeBaseName(currentRawFile?.name || `cropped.${cropExt}`);
      const newFile = new File([blob], `${cleanName}_cropped.${cropExt}`, { type: cropMimeType });
      setCroppedFile(newFile);
      resetOutput();
      setCropModalOpen(false);
      setImgSrc('');
    }, cropMimeType, 1.0);
  };

  // 2. MAIN LOGIC: COMPRESS IMAGE TO TARGET KB + SELECTED FORMAT
  const compressImage = async () => {
    if (!croppedFile) return alert("Please select an image first.");

    const targetBytes = targetSizeKB * 1024;
    const mimeType = getOutputMimeType(outputFormat);

    setIsProcessing(true);
    resetOutput();

    try {
      const image = await fileToImage(croppedFile);
      const startedAt = performance.now();

      const result = outputFormat === 'PNG'
        ? await compressPngToTarget(image, targetBytes)
        : await compressJpegToTarget(image, targetBytes);

      const exactBlob = await makeExactSizeBlob(result.blob, targetBytes, mimeType);
      const finalFile = blobToFile(exactBlob, croppedFile.name, outputFormat);
      const finalUrl = URL.createObjectURL(finalFile);

      if (compressedUrl) URL.revokeObjectURL(compressedUrl);

      setCompressedFile(finalFile);
      setCompressedUrl(finalUrl);
      setResultInfo({
        format: outputFormat,
        mimeType,
        targetKB: targetSizeKB,
        width: result.meta.width,
        height: result.meta.height,
        resized: Boolean(result.meta.resized),
        quality: result.meta.quality ? Math.round(result.meta.quality * 100) : null,
        processingMs: Math.round(performance.now() - startedAt),
        hitTarget: finalFile.size === targetBytes,
        compressedBeforePaddingKB: +(result.blob.size / 1024).toFixed(2),
      });

      setTimeout(() => {
        document.getElementById('output-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);

    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Image compression failed:', error);
      }
      alert(error.message || "Compression failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to format bytes to KB
  const formatKB = (bytes) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    return `${kb < 100 ? kb.toFixed(1) : kb.toFixed(0)} KB`;
  };

  // Helper to calculate reduction percentage
  const getReductionPercentage = () => {
    if (!croppedFile || !compressedFile) return 0;
    const reduction = ((croppedFile.size - compressedFile.size) / croppedFile.size) * 100;
    return Math.max(0, reduction.toFixed(0)); // Don't show negative reduction
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col font-sans selection:bg-emerald-200">
      <SEO
        title="Photo & Signature Resizer | EduFill Tools"
        description="Resize and compress passport photos and signatures to exact KB sizes for government exam forms, admission forms and document uploads."
        keywords="photo resizer, signature resizer, compress photo to 50KB, passport photo resizer, exam form photo resize, EduFill tools"
        url="/tools/resizer"
        canonical={`${SITE_URL}/tools/resizer`}
        schema={resizerSchema}
        schemaMarkup={resizerSchema}
      />

      {/* FULL SCREEN VIEW MODAL */}
      {viewImage && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-8 bg-gray-900/95 backdrop-blur-md transition-all" onClick={() => setViewImage(null)}>
          <div className="relative w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
            <button type="button" className="absolute top-2 right-2 md:top-4 md:right-4 text-gray-300 hover:text-white bg-white/10 hover:bg-red-500 p-3 rounded-full transition-colors" onClick={() => setViewImage(null)}>
              <X size={28}/>
            </button>
            <img src={viewImage} alt="Preview" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}

      {/* 🌟 PREMIUM HEADER MATCHING DESIGN 🌟 */}
      <div className="bg-gradient-to-r from-[#042F2E] via-[#064E3B] to-[#042F2E] text-white pt-6 pb-16 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Link to="/tools" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-black text-xs uppercase tracking-widest mb-6 transition-colors">
              <ArrowLeft size={16} strokeWidth={3} /> Back to Tools
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 backdrop-blur-sm shadow-inner">
                <Maximize className="text-emerald-400 w-8 h-8" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Photo & Sign Resizer</h1>
                <p className="text-emerald-100/80 text-sm font-medium mt-1">Compress photos and signatures to exact KB size without losing dimensions.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-emerald-500/30 backdrop-blur-md text-emerald-50 text-sm font-bold px-5 py-3 rounded-full w-max shadow-lg">
            <ShieldCheck size={18} className="text-emerald-400"/> 100% Client-Side Processing
          </div>
        </div>
      </div>

      {/* 🌟 MAIN APP UI 🌟 */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] xl:grid-cols-[500px_1fr] gap-6 xl:gap-8">
          
          {/* LEFT: CONTROLS PANEL */}
          <div className="flex flex-col gap-6">
            
            {/* Box 1: Upload */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-sm font-black border border-emerald-100">1</div>
                <h3 className="text-lg font-black text-gray-900">Upload Image</h3>
              </div>

              {/* Toggle Photo/Sign Type */}
              <div className="flex bg-gray-50 border border-gray-200 rounded-xl p-1 mb-6">
                 <button 
                   type="button"
                   onClick={() => setUploadType('photo')}
                   className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${uploadType === 'photo' ? 'bg-white shadow-sm text-emerald-600 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   <ImageIcon size={16}/> Photo
                 </button>
                 <button 
                   type="button"
                   onClick={() => setUploadType('signature')}
                   className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${uploadType === 'signature' ? 'bg-white shadow-sm text-emerald-600 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   <PenTool size={16}/> Signature
                 </button>
              </div>
              
              {/* 🌟 GEMINI STYLE DRAG & DROP UPLOAD BOX 🌟 */}
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.currentTarget.querySelector('input[type="file"]')?.click();
                  }
                }}
                className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                  isDragging 
                    ? 'bg-gradient-to-br from-emerald-50 via-teal-100 to-blue-50 border-emerald-500 scale-[1.02] shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
                    : 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/80 hover:border-emerald-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {/* Floating sparkles when dragging */}
                {isDragging && (
                  <>
                    <Sparkles className="absolute top-4 left-6 text-emerald-400 animate-bounce opacity-70" size={20}/>
                    <Sparkles className="absolute bottom-4 right-8 text-blue-400 animate-bounce opacity-70" size={24} style={{animationDelay: '0.2s'}}/>
                  </>
                )}

                <label className="absolute inset-0 w-full h-full cursor-pointer z-10">
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
                </label>
                
                <div className={`w-14 h-14 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-sm shrink-0 transition-transform duration-300 ${isDragging ? 'scale-110 rotate-12' : ''}`}>
                  <UploadCloud size={28} />
                </div>
                <div className="text-center relative z-0 pointer-events-none">
                  <span className={`font-black block transition-colors ${isDragging ? 'text-emerald-700 text-lg' : 'text-gray-900 text-base'}`}>
                    {isDragging ? 'Drop your file here!' : 'Drag & drop your file here'}
                  </span>
                  <span className="text-xs text-gray-500 font-bold mt-0.5 block">
                    {!isDragging && <>or <span className="text-emerald-600">browse from device</span><br/><span className="text-[10px] uppercase tracking-wider mt-1 block">JPG, JPEG, PNG, WEBP • Max 10 MB</span></>}
                  </span>
                </div>
              </div>

              {/* Recent Upload State (Small Preview) */}
              <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Recent Upload</p>
                {croppedFile ? (
                   <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-3">
                     <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                       <img src={croppedPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-bold text-gray-900 text-sm truncate">{croppedFile.name || 'image.jpg'}</p>
                       <p className="text-[10px] font-bold text-gray-500 uppercase">{formatKB(croppedFile.size)} • Ready to compress</p>
                     </div>
                     <button onClick={() => setCroppedFile(null)} className="text-gray-400 hover:text-red-500 p-2"><X size={16}/></button>
                   </div>
                ) : (
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 border border-gray-200 border-dashed">
                       <ImageIcon size={20} className="text-gray-300" />
                     </div>
                     <div>
                       <p className="font-bold text-gray-500 text-sm">No file selected yet</p>
                       <p className="text-[10px] font-bold text-gray-400">Upload an image to get started</p>
                     </div>
                   </div>
                )}
              </div>
            </div>

            {/* Box 2: Target Size & Options */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-sm font-black border border-emerald-100">2</div>
                <h3 className="text-lg font-black text-gray-900">Target Size & Options</h3>
              </div>

              <div>
                <label className="flex justify-between items-center text-xs font-black text-gray-500 mb-3">
                  <span className="flex items-center gap-1.5">Target Size</span>
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">Target {targetSizeKB} KB</span>
                </label>
                <input type="range" min="10" max="500" step="5" value={targetSizeKB} onChange={(e) => setTargetSizeKB(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2">
                  <span>10 KB</span>
                  <span>500 KB</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-6 mb-6">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <Maximize size={16} className="text-indigo-500 mb-1"/>
                  <span className="text-[10px] font-black text-gray-700">Keep dimensions</span>
                  <span className="text-[8px] font-bold text-gray-400">Don't resize</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <Check size={16} className="text-emerald-500 mb-1"/>
                  <span className="text-[10px] font-black text-emerald-800">Maintain quality</span>
                  <span className="text-[8px] font-bold text-emerald-600/70">Balanced output</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <Settings2 size={16} className="text-amber-500 mb-1"/>
                  <span className="text-[10px] font-black text-gray-700">Smart compression</span>
                  <span className="text-[8px] font-bold text-gray-400">Best for forms</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs font-black text-gray-700">Output Format</span>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => { setOutputFormat('JPG'); resetOutput(); }} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${outputFormat === 'JPG' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}>JPG</button>
                  <button onClick={() => { setOutputFormat('PNG'); resetOutput(); }} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${outputFormat === 'PNG' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}>PNG</button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={compressImage} disabled={!croppedFile || isCompressing} className="flex-1 bg-[#00a67e] hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none text-white font-black py-3.5 rounded-xl shadow-lg flex justify-center items-center gap-2 transition-transform active:scale-[0.98] text-sm">
                  {isCompressing ? <><Loader2 size={18} className="animate-spin"/> Compressing...</> : <><Sparkles size={18}/> Compress Image</>}
                </button>
                <button type="button" onClick={resetAll} className="px-5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-black rounded-xl flex flex-col items-center justify-center text-[10px] uppercase gap-1 transition-colors">
                  <RefreshCcw size={16}/> Reset
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: PREVIEW & DOWNLOADS PANEL */}
          <div id="output-section" className="flex flex-col h-full min-h-[600px]">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-100 shrink-0">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-sm font-black border border-emerald-100">3</div>
                  Final Result
                </h3>
              </div>
              
              {/* SCROLLABLE AREA */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col justify-center pb-4">
                
                {isCompressing ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner border border-emerald-100">
                      <Loader2 size={32} className="text-emerald-600 animate-spin" />
                    </div>
                    <p className="font-black text-lg text-gray-900">Compressing Image...</p>
                    <p className="text-xs text-gray-500 font-bold mt-1">Optimizing size and selected output format</p>
                  </div>
                ) : compressedUrl ? (
                  
                  <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
                    
                    {/* Visual Comparison Area */}
                    <div>
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Sparkles size={14} className="text-emerald-500"/> Example Preview</h4>
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col lg:flex-row items-center gap-6">
                        
                        {/* Image Box */}
                        <div className="w-full lg:w-1/3 aspect-[4/3] bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex items-center justify-center p-2 relative group cursor-pointer" onClick={() => setViewImage(compressedUrl)}>
                           <div className="absolute inset-0 bg-gray-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                             <Eye className="text-white" size={24}/>
                           </div>
                           <img src={compressedUrl} alt="Result" className="w-full h-full object-contain" />
                        </div>

                        {/* Stats Cards */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                           {/* Original */}
                           <div className="bg-white border border-gray-100 rounded-xl p-4 text-center flex flex-col justify-center shadow-sm">
                             <span className="text-xs font-bold text-gray-500 mb-1">Original</span>
                             <span className="text-xl font-black text-gray-800">{formatKB(croppedFile.size)}</span>
                             <span className="text-[10px] text-gray-400 font-medium mt-1">Original • {croppedFile.type?.split('/')[1]?.toUpperCase() || 'IMAGE'}</span>
                           </div>

                           {/* Final */}
                           <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-center flex flex-col justify-center shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 bg-emerald-500 text-white rounded-bl-lg w-5 h-5 flex items-center justify-center"><Check size={12} strokeWidth={4}/></div>
                             <span className="text-xs font-bold text-gray-500 mb-1">Final</span>
                             <span className="text-xl font-black text-emerald-600">{formatKB(compressedFile.size)}</span>
                             <span className="text-[10px] text-gray-400 font-medium mt-1">
                               {resultInfo?.format || outputFormat} • {resultInfo?.width || 'Auto'}×{resultInfo?.height || 'Auto'}
                             </span>
                           </div>

                           {/* Reduction */}
                           <div className="bg-white border border-gray-100 rounded-xl p-4 text-center flex flex-col justify-center shadow-sm">
                             <span className="text-xs font-bold text-gray-500 mb-1">Reduction</span>
                             <span className="text-xl font-black text-gray-800">{getReductionPercentage()}%</span>
                             <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block mx-auto">Saved {formatKB(croppedFile.size - compressedFile.size)}</span>
                           </div>
                        </div>

                      </div>
                      
                      <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-start gap-2 text-[10px] font-bold text-gray-500">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0"/> The compressed image is ready in {resultInfo?.format || outputFormat} format. Exact target: {targetSizeKB} KB, Final: {formatKB(compressedFile.size)}.
                      </div>
                    </div>

                    {/* PROFESSIONAL IMAGE PREVIEW BOX */}
                    <div className="w-full bg-white border border-gray-200 rounded-[1.5rem] p-4 flex flex-col items-center justify-center gap-4 shadow-sm group">
                       <div 
                        className="relative w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center cursor-pointer" 
                        style={{ minHeight: '200px' }}
                        onClick={() => setViewImage(compressedUrl)}
                       >
                          <img src={compressedUrl} alt="Compressed" className="max-h-[250px] object-contain group-hover:scale-105 transition-transform duration-500 p-2" />
                          
                          {/* Professional Sleek Hover Overlay */}
                          <div className="absolute inset-0 bg-gray-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                             <div className="bg-white text-gray-800 font-bold text-sm px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                               <Eye size={18} className="text-emerald-600" /> Click to View
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 w-full mt-auto">
                      <button type="button" onClick={() => setViewImage(compressedUrl)} className="px-6 py-3.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-sm flex justify-center items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
                        <Eye size={18}/> Preview Full
                      </button>
                      <a href={compressedUrl} download={`EduFill_Resized_${(compressedFile.size / 1024).toFixed(0)}KB.${getOutputExtension(outputFormat)}`} className="flex-1 bg-[#00a67e] hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl text-sm flex justify-center items-center gap-2 transition-colors shadow-sm">
                        <Download size={18}/> Download File
                      </a>
                      <button type="button" onClick={resetAll} className="px-6 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-sm flex justify-center items-center gap-2 transition-colors border border-emerald-100">
                        <RefreshCcw size={18}/> Compress Another
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400">
                    <div className="w-24 h-24 relative mb-6">
                       <div className="absolute inset-0 bg-emerald-50 rounded-2xl rotate-6 transform"></div>
                       <div className="absolute inset-0 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                         <FileImage size={32} className="text-gray-300"/>
                       </div>
                       <Sparkles className="absolute -top-2 -right-2 text-emerald-400" size={20}/>
                    </div>
                    <p className="font-black text-xl text-gray-900 mb-1">Ready to compress</p>
                    <p className="text-sm font-semibold text-center text-gray-500">Upload a photo or signature and choose your target size.<br/>We'll compress it to the exact KB you need.</p>
                  </div>
                )}
              </div>

              {/* FOOTER INFO WIDGETS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-gray-100 shrink-0 mt-auto">
                 <div className="flex items-start gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-50">
                    <div className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-sm"><Maximize size={14}/></div>
                    <div><h5 className="text-[11px] font-black text-gray-900">Exact KB Output</h5><p className="text-[9px] font-bold text-gray-500 mt-0.5">Get the exact file size you need.</p></div>
                 </div>
                 <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-sm"><Zap size={14}/></div>
                    <div><h5 className="text-[11px] font-black text-gray-900">Fast Compression</h5><p className="text-[9px] font-bold text-gray-500 mt-0.5">Lightning fast processing in browser.</p></div>
                 </div>
                 <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-sm"><FileText size={14}/></div>
                    <div><h5 className="text-[11px] font-black text-gray-900">Exam Form Ready</h5><p className="text-[9px] font-bold text-gray-500 mt-0.5">Perfect for exams & submissions.</p></div>
                 </div>
                 <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-sm"><Lock size={14}/></div>
                    <div><h5 className="text-[11px] font-black text-gray-900">Private & Secure</h5><p className="text-[9px] font-bold text-gray-500 mt-0.5">Your files stay on your device.</p></div>
                 </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* CROP MODAL (Mobile Optimized) */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-xl flex flex-col overflow-hidden max-h-[90vh] shadow-2xl">
            <div className="flex justify-between items-center p-5 md:p-6 border-b border-gray-100 bg-white z-10 shrink-0">
              <div>
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2"><CropIcon size={20} className="text-emerald-600"/> Crop Image (Optional)</h3>
                <p className="text-xs font-bold text-gray-500 mt-1">Perfect for signatures or unaligned photos</p>
              </div>
              <button onClick={() => saveOriginalWithoutCrop()} className="bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-600 p-2.5 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center items-center">
              <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)}>
                <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="Crop preview" className="max-w-full h-auto shadow-md" style={{ maxHeight: '50vh', objectFit: 'contain' }}/>
              </ReactCrop>
            </div>

            <div className="p-5 md:p-6 border-t border-gray-100 bg-white z-10 shrink-0 flex flex-col sm:flex-row gap-3">
              <button onClick={handleRotate} className="flex-1 flex justify-center items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-800 font-black py-3.5 rounded-xl transition-colors border border-gray-200 text-sm md:text-base">
                <RotateCw size={18}/> Rotate 90°
              </button>
              <button onClick={saveOriginalWithoutCrop} className="flex-1 flex justify-center items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black py-3.5 rounded-xl transition-colors border border-blue-200 text-sm md:text-base">
                Skip Crop
              </button>
              <button onClick={handleCropSave} className="flex-[1.5] flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl shadow-md transition-colors text-sm md:text-base">
                <Check size={18}/> Crop & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Style for thin scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}