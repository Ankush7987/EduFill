import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, ArrowLeft, UploadCloud, Crop as CropIcon, X, Check, RotateCw, 
  Download, Loader2, Sparkles, Image as ImageIcon, Type, Eye, User, 
  CreditCard, CalendarDays, ShieldCheck, Zap, Info, CheckCircle2, LayoutTemplate,
  HardDrive, FileText, Lock 
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; 
import SEO from '../components/SEO';

export default function PhotoDateTool() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Form States
  const [studentName, setStudentName] = useState('');
  const [photoDate, setPhotoDate] = useState(new Date().toISOString().split('T')[0]); 
  const [removeBg, setRemoveBg] = useState(false);
  const [fontSize, setFontSize] = useState(26);
  
  // Target File Size State (in KB)
  const [targetSizeKB, setTargetSizeKB] = useState(50);

  // Options State
  const [genOptions, setGenOptions] = useState({ passport: true, postcard: false, sheet: false });

  // Process & Preview States
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [generatedImages, setGeneratedImages] = useState(null);
  
  // View Modal State
  const [viewImage, setViewImage] = useState(null);
  
  // Crop & Upload States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const [currentRawFile, setCurrentRawFile] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);

  // Gemini Style Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);

  // 1. HANDLE FILE SELECTION & DRAG/DROP
  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert("Please upload a valid image file (JPG, PNG).");
      return;
    }
    setCurrentRawFile(file);
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImgSrc(reader.result);
      setCompletedCrop(null); 
      setCropModalOpen(true);
    });
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDragEnter = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault(); e.stopPropagation();
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

    // Passport and print-sheet need the old passport ratio.
    // When user is generating only NEET postcard, use 4x6 postcard ratio for a better crop.
    const isOnlyPostcardSelected = genOptions.postcard && !genOptions.passport && !genOptions.sheet;
    const aspect = isOnlyPostcardSelected ? 2 / 3 : 413 / 446;

    const newCrop = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height), width, height);
    setCrop(newCrop); 
    setCompletedCrop(newCrop); 
  };

  const handleRotate = () => {
    const image = imgRef.current;
    if (!image) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.naturalHeight;
    canvas.height = image.naturalWidth;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(90 * Math.PI / 180);
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    setImgSrc(canvas.toDataURL('image/jpeg', 1.0));
    setCompletedCrop(null); 
  };

  const handleCropSave = async () => {
    if (!completedCrop || !completedCrop.width || !completedCrop.height) {
      setCroppedBlob(currentRawFile);
      setCropModalOpen(false);
      return;
    }
    const image = imgRef.current;
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
    canvas.width = cropW * scaleX; canvas.height = cropH * scaleY;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, cropX * scaleX, cropY * scaleY, cropW * scaleX, cropH * scaleY, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      setCroppedBlob(blob);
      setCropModalOpen(false); 
      setImgSrc(''); 
    }, 'image/jpeg', 1.0);
  };

  const createPhotoCanvas = (imageBmp, isBgRemoved, targetWidth, targetHeight, textHeight) => {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth; 
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    const photoHeight = targetHeight - textHeight;

    ctx.fillStyle = '#ffffff'; 
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    
    ctx.save(); 
    ctx.beginPath(); 
    ctx.rect(0, 0, targetWidth, photoHeight); 
    ctx.clip(); 

    let scale, x, y;
    if (isBgRemoved) { 
      scale = targetWidth / imageBmp.width; x = 0; y = 20 * (targetWidth / 413); 
    } else { 
      scale = Math.max(targetWidth / imageBmp.width, photoHeight / imageBmp.height); 
      x = (targetWidth / 2) - (imageBmp.width / 2) * scale; 
      y = (photoHeight / 2) - (imageBmp.height / 2) * scale; 
    }
    
    ctx.filter = 'contrast(105%) brightness(102%) saturate(110%)';
    ctx.drawImage(imageBmp, x, y, imageBmp.width * scale, imageBmp.height * scale);
    ctx.restore(); 
    ctx.filter = 'none'; 

    ctx.fillStyle = '#ffffff'; 
    ctx.fillRect(0, photoHeight, targetWidth, textHeight);
    
    ctx.strokeStyle = '#000000'; 
    ctx.lineWidth = 4 * (targetWidth / 413); 
    ctx.strokeRect(2, 2, targetWidth - 4, targetHeight - 4); 

    ctx.fillStyle = '#000000'; 
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';
    
    const dateObj = new Date(photoDate);
    const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
    const safeName = studentName.toUpperCase().trim();
    
    let currentFontSize = fontSize * (targetWidth / 413); 
    
    ctx.font = `bold ${currentFontSize}px Arial`;
    
    while (ctx.measureText(safeName).width > (targetWidth - 40) && currentFontSize > 12) { 
      currentFontSize -= 1; ctx.font = `bold ${currentFontSize}px Arial`; 
    }
    
    const centerTextY = photoHeight + (textHeight / 2);
    const gap = currentFontSize * 0.75; 
    const dateFontSize = 20 * (targetWidth / 413);

    ctx.fillText(safeName, targetWidth / 2, centerTextY - gap / 2);
    
    ctx.font = `bold ${dateFontSize}px Arial`; 
    ctx.fillText(formattedDate, targetWidth / 2, centerTextY + gap / 2 + (dateFontSize * 0.15));

    return canvas;
  };



  const createNeetPostcardCanvas = (imageBmp, isBgRemoved) => {
    // NEET postcard preset: 4 x 6 inch portrait ratio.
    // Output is 1200 x 1800 px, with a compact name/date strip.
    const targetWidth = 1200;
    const targetHeight = 1800;
    const textHeight = 225;
    const photoHeight = targetHeight - textHeight;
    const borderWidth = 2;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Base white canvas/background.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Photo area: cover-fit, top-centered. This gives a formal NEET postcard look.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, targetWidth, photoHeight);
    ctx.clip();

    const coverScale = Math.max(targetWidth / imageBmp.width, photoHeight / imageBmp.height);
    const drawWidth = imageBmp.width * coverScale;
    const drawHeight = imageBmp.height * coverScale;
    const drawX = (targetWidth - drawWidth) / 2;

    // Slightly top-biased crop keeps face prominent and avoids extra empty space near the text strip.
    let drawY = (photoHeight - drawHeight) * 0.38;
    if (drawHeight <= photoHeight) drawY = 0;

    if (isBgRemoved) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, photoHeight);
    }

    ctx.filter = 'contrast(106%) brightness(103%) saturate(108%)';
    ctx.drawImage(imageBmp, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
    ctx.filter = 'none';

    // Compact text strip.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, photoHeight, targetWidth, textHeight);

    // Thin border like official photo print, not a heavy frame.
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, targetWidth - borderWidth, targetHeight - borderWidth);

    const dateObj = new Date(photoDate);
    const formattedDate = Number.isNaN(dateObj.getTime())
      ? photoDate
      : `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;

    const safeName = studentName.toUpperCase().trim().replace(/\s+/g, ' ');

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Name and date tuned for 1200x1800 postcard. Still responds lightly to slider.
    let nameFontSize = Math.min(88, Math.max(58, fontSize * 2.65));
    ctx.font = `900 ${nameFontSize}px Arial, Helvetica, sans-serif`;
    while (ctx.measureText(safeName).width > targetWidth - 110 && nameFontSize > 42) {
      nameFontSize -= 2;
      ctx.font = `900 ${nameFontSize}px Arial, Helvetica, sans-serif`;
    }

    const dateFontSize = Math.max(42, Math.min(58, nameFontSize * 0.68));
    const nameY = photoHeight + 78;
    const dateY = photoHeight + 148;

    ctx.fillText(safeName, targetWidth / 2, nameY);
    ctx.font = `900 ${dateFontSize}px Arial, Helvetica, sans-serif`;
    ctx.fillText(formattedDate, targetWidth / 2, dateY);

    return canvas;
  };

  const canvasToJpegBlob = (canvas, quality = 0.9) => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
    });
  };

  const padBlobToExactSize = async (blob, targetBytes) => {
    if (!blob || blob.size >= targetBytes) return blob;

    const paddingSize = targetBytes - blob.size;
    const padding = new Uint8Array(paddingSize);

    // Safe for JPG preview/download: keeps image data same, only final file size becomes exact.
    return new Blob([blob, padding], { type: blob.type || 'image/jpeg' });
  };

  const compressPassportCanvasToExactUrl = async (canvas, targetKB) => {
    const targetBytes = Math.max(1, Math.round(targetKB * 1024));

    let low = 0.08;
    let high = 0.98;
    let bestBlob = null;

    // Binary search quality: highest possible quality under selected KB.
    for (let i = 0; i < 18; i += 1) {
      const quality = (low + high) / 2;
      const blob = await canvasToJpegBlob(canvas, quality);

      if (!blob) break;

      if (blob.size <= targetBytes) {
        bestBlob = blob;
        low = quality;
      } else {
        high = quality;
      }
    }

    // Passport canvas is small, so this normally goes under even for low KB targets.
    if (!bestBlob) {
      bestBlob = await canvasToJpegBlob(canvas, 0.06);
    }

    const exactBlob = await padBlobToExactSize(bestBlob, targetBytes);
    return URL.createObjectURL(exactBlob);
  };

  const compressCanvasToUrl = async (canvas, maxSizeKB) => {
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(null);
        try {
          const file = new File([blob], "image.jpg", { type: "image/jpeg" });
          const options = {
            maxSizeMB: maxSizeKB / 1024,
            maxWidthOrHeight: Math.max(canvas.width, canvas.height),
            useWebWorker: true,
            initialQuality: 0.9,
          };
          const compressedFile = await imageCompression(file, options);
          resolve(URL.createObjectURL(compressedFile));
        } catch (err) {
          console.error("Compression error:", err);
          resolve(URL.createObjectURL(blob)); 
        }
      }, 'image/jpeg', 1.0);
    });
  };

  const generatePhotos = async () => {
    if (!croppedBlob) return alert("Please select and crop a photo first.");
    if (!studentName.trim()) return alert("Please enter your name.");
    if (!genOptions.passport && !genOptions.postcard && !genOptions.sheet) return alert("Please select at least one format to generate.");
    
    setIsProcessing(true);
    setGeneratedImages(null);
    let finalBlobToProcess = croppedBlob;
    let isBgRemoved = false; 

    try {
      if (removeBg) {
        setProgressText('Removing background...');
        const apiKey = "navkJvJVi2bg4G2bTWLJDWva"; 
        const smallBlob = await imageCompression(croppedBlob, { maxSizeMB: 2, maxWidthOrHeight: 1000 });
        const formData = new FormData();
        formData.append('image_file', smallBlob, 'photo.jpg');
        formData.append('size', 'auto');

        const response = await fetch('https://api.remove.bg/v1.0/removebg', { method: 'POST', headers: { 'X-Api-Key': apiKey }, body: formData });
        if (response.ok) { 
          finalBlobToProcess = await response.blob(); 
          isBgRemoved = true; 
        }
      }

      setProgressText('Applying Size Compression & Formats...');
      const imageBmp = await createImageBitmap(finalBlobToProcess);
      let newImages = {};

      let passportCanvasForSheet = null;
      
      if (genOptions.passport || genOptions.sheet) {
        const passportCanvas = createPhotoCanvas(imageBmp, isBgRemoved, 413, 531, 85);
        passportCanvasForSheet = passportCanvas; 
        if (genOptions.passport) {
          setProgressText(`Compressing Passport to exactly ${targetSizeKB}KB...`);
          newImages.passport = await compressPassportCanvasToExactUrl(passportCanvas, targetSizeKB);
        }
      }

      if (genOptions.postcard) {
        setProgressText(`Generating NEET Postcard Image...`);
        const postcardCanvas = createNeetPostcardCanvas(imageBmp, isBgRemoved);
        newImages.postcard = await compressCanvasToUrl(postcardCanvas, Math.min(200, Math.max(120, targetSizeKB * 3)));
      }

      if (genOptions.sheet) {
        setProgressText(`Assembling Print Sheet...`);
        const sheetCanvas = document.createElement('canvas');
        sheetCanvas.width = 1800; 
        sheetCanvas.height = 1200;
        const sCtx = sheetCanvas.getContext('2d');
        
        sCtx.fillStyle = '#ffffff';
        sCtx.fillRect(0, 0, 1800, 1200);

        const gapX = (1800 - (413 * 4)) / 5; 
        const gapY = (1200 - (531 * 2)) / 3; 
        
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 4; col++) {
            const px = gapX + col * (413 + gapX);
            const py = gapY + row * (531 + gapY);
            sCtx.drawImage(passportCanvasForSheet, px, py, 413, 531);
          }
        }
        newImages.sheet = await compressCanvasToUrl(sheetCanvas, Math.max(targetSizeKB * 5, 200));
      }

      setGeneratedImages(newImages);

      setTimeout(() => {
        document.getElementById('output-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);

    } catch (error) {
      console.error(error);
      alert("Generation failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getFirstName = () => {
    const parts = studentName.trim().split(' ');
    const first = parts[0] || 'photo';
    return first.toLowerCase();
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col font-sans selection:bg-emerald-200">
      <SEO title="Photo & Date Generator | EduFill Tools" description="Automatically add your name and date of photo." url="/tools/photo-date" />

      {/* FULL SCREEN VIEW MODAL */}
      {viewImage && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-8 bg-gray-900/95 backdrop-blur-md transition-all" onClick={() => setViewImage(null)}>
          <div className="relative w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
            <button className="absolute top-2 right-2 md:top-4 md:right-4 text-gray-300 hover:text-white bg-white/10 hover:bg-red-500 p-3 rounded-full transition-colors" onClick={() => setViewImage(null)}>
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
                <Camera className="text-emerald-400 w-8 h-8" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Photo & Date Generator</h1>
                <p className="text-emerald-100/80 text-sm font-medium mt-1">Smart formatting for SSC, Railway, NEET & exam forms.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-emerald-500/30 backdrop-blur-md text-emerald-50 text-sm font-bold px-5 py-3 rounded-full w-max shadow-lg">
            <ShieldCheck size={18} className="text-emerald-400"/> Secure Client-Side Processing
          </div>
        </div>
      </div>

      {/* 🌟 MAIN APP UI 🌟 */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] xl:grid-cols-[500px_1fr] gap-6 xl:gap-8">
          
          {/* LEFT: CONTROLS PANEL */}
          <div className="flex flex-col gap-6">
            
            {/* Box 1: Details & Settings */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-sm font-black border border-emerald-100">1</div>
                <h3 className="text-lg font-black text-gray-900">Photo Details</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-black text-gray-900 mb-2">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value.toUpperCase())} placeholder="e.g. Rahul Kumar" className="w-full text-sm font-bold pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:font-medium placeholder:text-gray-400" />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-black text-gray-900 mb-2">Date on Photo</label>
                  <div className="relative">
                    <CalendarDays size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="date" value={photoDate} onChange={(e) => setPhotoDate(e.target.value)} className="w-full text-sm font-bold pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-gray-700" />
                  </div>
                </div>
              </div>

              {/* SLIDERS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="flex justify-between items-center text-xs font-black text-gray-500 mb-2">
                    <span className="flex items-center gap-1.5"><Type size={14}/> Font Size</span>
                    <span className="text-emerald-600">{fontSize}px</span>
                  </label>
                  <input type="range" min="18" max="40" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-1.5">
                    <span>Small</span><span>Large</span>
                  </div>
                </div>
                
                <div>
                  <label className="flex justify-between items-center text-xs font-black text-gray-500 mb-2">
                    <span className="flex items-center gap-1.5"><FileText size={14}/> File Size (Target)</span>
                    <span className="text-emerald-600">&le; {targetSizeKB} KB</span>
                  </label>
                  <input type="range" min="20" max="200" step="5" value={targetSizeKB} onChange={(e) => setTargetSizeKB(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-1.5">
                    <span>Low</span><span>High</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full mb-6"></div>

              {/* AI BG Removal Custom Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100">
                    <Sparkles size={20}/>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 mb-0.5">Remove Background</h4>
                    <p className="text-[10px] font-bold text-gray-500">Get a clean, pure white background instantly.</p>
                  </div>
                </div>
                
                {/* Toggle Switch UI */}
                <div 
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${removeBg ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  onClick={() => setRemoveBg(!removeBg)}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${removeBg ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>

              <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-2 text-[10px] font-bold text-gray-500">
                <Lock size={14} className="text-emerald-500 shrink-0"/> All processing is done on your device. Your privacy is 100% protected.
              </div>
            </div>

            {/* Box 2: Formats & Upload */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-sm font-black border border-emerald-100">2</div>
                <h3 className="text-lg font-black text-gray-900">Select Output</h3>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div onClick={() => setGenOptions({...genOptions, passport: !genOptions.passport})} className={`flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer border transition-all text-center relative ${genOptions.passport ? 'bg-emerald-50/50 border-emerald-500 shadow-sm' : 'bg-white border-gray-200 hover:border-emerald-300'}`}>
                  {genOptions.passport && <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-0.5"><Check size={10} strokeWidth={4}/></div>}
                  <User size={24} className={genOptions.passport ? 'text-gray-900 mb-2' : 'text-gray-400 mb-2'} />
                  <span className={`text-[11px] font-black leading-tight ${genOptions.passport ? 'text-emerald-800' : 'text-gray-600'}`}>Passport Size<br/><span className="text-[9px] font-bold text-gray-400">3.5 x 4.5 cm</span></span>
                </div>
                
                <div onClick={() => setGenOptions({...genOptions, postcard: !genOptions.postcard})} className={`flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer border transition-all text-center relative ${genOptions.postcard ? 'bg-emerald-50/50 border-emerald-500 shadow-sm' : 'bg-white border-gray-200 hover:border-emerald-300'}`}>
                  {genOptions.postcard && <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-0.5"><Check size={10} strokeWidth={4}/></div>}
                  <CreditCard size={24} className={genOptions.postcard ? 'text-gray-900 mb-2' : 'text-gray-400 mb-2'} />
                  <span className={`text-[11px] font-black leading-tight ${genOptions.postcard ? 'text-emerald-800' : 'text-gray-600'}`}>Postcard NEET<br/><span className="text-[9px] font-bold text-gray-400">4 x 6 inch</span></span>
                </div>
                
                <div onClick={() => setGenOptions({...genOptions, sheet: !genOptions.sheet})} className={`flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer border transition-all text-center relative ${genOptions.sheet ? 'bg-emerald-50/50 border-emerald-500 shadow-sm' : 'bg-white border-gray-200 hover:border-emerald-300'}`}>
                  {genOptions.sheet && <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-0.5"><Check size={10} strokeWidth={4}/></div>}
                  <LayoutTemplate size={24} className={genOptions.sheet ? 'text-gray-900 mb-2' : 'text-gray-400 mb-2'} />
                  <span className={`text-[11px] font-black leading-tight ${genOptions.sheet ? 'text-emerald-800' : 'text-gray-600'}`}>8-Photo Sheet<br/><span className="text-[9px] font-bold text-gray-400">A4 (8 Photos)</span></span>
                </div>
              </div>

              {/* 🌟 GEMINI STYLE DRAG & DROP UPLOAD BOX 🌟 */}
              {!croppedBlob ? (
                <div 
                  className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-8 flex items-center justify-center gap-4 transition-all duration-300 ${
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
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  
                  <div className={`w-14 h-14 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-sm shrink-0 transition-transform duration-300 ${isDragging ? 'scale-110 rotate-12' : ''}`}>
                    <UploadCloud size={28} />
                  </div>
                  <div className="text-left relative z-0 pointer-events-none">
                    <span className={`font-black block transition-colors ${isDragging ? 'text-emerald-700 text-lg' : 'text-gray-900 text-base'}`}>
                      {isDragging ? 'Drop your photo here!' : 'Drag & drop your photo here'}
                    </span>
                    <span className="text-xs text-gray-500 font-bold mt-0.5 block">
                      {!isDragging && <>or <span className="text-emerald-600">browse</span> • JPG, PNG • Max 10 MB</>}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-sm border border-emerald-100"><Check size={20} strokeWidth={3}/></div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">Image Cropped Successfully</p>
                      <button onClick={() => setCroppedBlob(null)} className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-wider mt-0.5">Replace Photo</button>
                    </div>
                  </div>
                  <img src={URL.createObjectURL(croppedBlob)} className="w-10 h-12 object-cover rounded shadow-sm border border-emerald-200" alt="cropped blob" />
                </div>
              )}

              <button onClick={generatePhotos} disabled={!croppedBlob || !studentName.trim() || isProcessing || (!genOptions.passport && !genOptions.postcard && !genOptions.sheet)} className="w-full mt-6 bg-[#00a67e] hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none text-white font-black py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 transition-transform active:scale-[0.98] text-sm">
                {isProcessing ? <><Loader2 size={18} className="animate-spin"/> {progressText || 'Generating...'}</> : <><Sparkles size={18}/> Generate Output Photos</>}
              </button>
            </div>
          </div>

          {/* RIGHT: PREVIEW & DOWNLOADS PANEL */}
          <div id="output-section" className="flex flex-col h-full min-h-[600px]">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-100 shrink-0">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-3"><ImageIcon className="text-emerald-500" size={24}/> Generated Output</h3>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full flex items-center gap-1.5"><Zap size={12} fill="currentColor"/> Instant preview</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5"><CheckCircle2 size={12}/> Easy for exam forms</span>
                </div>
              </div>
              
              {/* SCROLLABLE AREA */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner border border-emerald-100">
                      <Loader2 size={32} className="text-emerald-600 animate-spin" />
                    </div>
                    <p className="font-black text-lg text-gray-900">Applying Formatting...</p>
                    <p className="text-xs text-gray-500 font-bold mt-1">{progressText}</p>
                  </div>
                ) : generatedImages ? (
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3 gap-6 w-full">
                    
                    {/* 1. SINGLE PASSPORT CARD */}
                    {generatedImages.passport && (
                      <div className="bg-white border border-gray-200 p-5 rounded-2xl flex flex-col shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-3 right-3 bg-white/60 backdrop-blur-sm p-1.5 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setViewImage(generatedImages.passport)} title="View Full">
                          <Eye size={16} className="text-gray-700"/>
                        </div>
                        <h4 className="font-black text-gray-900 text-sm flex items-center gap-1.5 mb-1">Passport Size <Info size={14} className="text-gray-400"/></h4>
                        <p className="text-[10px] font-bold text-gray-500 mb-4">3.5 x 4.5 cm</p>
                        <div className="w-full aspect-[3.5/4.5] bg-gray-50 rounded-xl mb-4 border border-gray-200 overflow-hidden relative group-hover:border-emerald-300 transition-colors flex items-center justify-center p-1.5 shadow-inner">
                          <img src={generatedImages.passport} alt="Passport" className="w-full h-full object-contain rounded-md" />
                        </div>
                        
                        <div className="flex gap-2 mt-auto w-full">
                          <button onClick={() => setViewImage(generatedImages.passport)} className="px-3.5 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 transition-colors shadow-sm"><Eye size={14}/> View</button>
                          <a href={generatedImages.passport} download={`${getFirstName()}_passport.jpg`} className="flex-1 bg-[#00a67e] hover:bg-emerald-700 text-white font-black py-2 rounded-xl text-xs flex justify-center items-center gap-1.5 transition-colors shadow-sm"><Download size={14}/> Download</a>
                        </div>
                      </div>
                    )}

                    {/* 2. POSTCARD CARD */}
                    {generatedImages.postcard && (
                      <div className="bg-white border border-gray-200 p-5 rounded-2xl flex flex-col shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-3 right-3 bg-white/60 backdrop-blur-sm p-1.5 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setViewImage(generatedImages.postcard)} title="View Full">
                          <Eye size={16} className="text-gray-700"/>
                        </div>
                        <h4 className="font-black text-gray-900 text-sm flex items-center gap-1.5 mb-1">Postcard NEET <Info size={14} className="text-gray-400"/></h4>
                        <p className="text-[10px] font-bold text-gray-500 mb-4">4 x 6 inch format</p>
                        <div className="w-full aspect-[4/6] bg-gray-50 rounded-xl mb-4 border border-gray-200 overflow-hidden relative group-hover:border-emerald-300 transition-colors flex items-center justify-center p-1.5 shadow-inner">
                          <img src={generatedImages.postcard} alt="Postcard" className="w-full h-full object-contain rounded-md" />
                        </div>

                        <div className="flex gap-2 mt-auto w-full">
                          <button onClick={() => setViewImage(generatedImages.postcard)} className="px-3.5 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 transition-colors shadow-sm"><Eye size={14}/> View</button>
                          <a href={generatedImages.postcard} download={`${getFirstName()}_postcard.jpg`} className="flex-1 bg-[#00a67e] hover:bg-emerald-700 text-white font-black py-2 rounded-xl text-xs flex justify-center items-center gap-1.5 transition-colors shadow-sm"><Download size={14}/> Download</a>
                        </div>
                      </div>
                    )}

                    {/* 3. 8-PASSPORT SHEET CARD */}
                    {generatedImages.sheet && (
                      <div className="bg-white border border-gray-200 p-5 rounded-2xl flex flex-col shadow-sm hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1 xl:col-span-1 relative overflow-hidden group">
                        <div className="absolute top-3 right-3 bg-white/60 backdrop-blur-sm p-1.5 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setViewImage(generatedImages.sheet)} title="View Full">
                          <Eye size={16} className="text-gray-700"/>
                        </div>
                        <h4 className="font-black text-gray-900 text-sm flex items-center gap-1.5 mb-1">8-Photo Sheet <Info size={14} className="text-gray-400"/></h4>
                        <p className="text-[10px] font-bold text-gray-500 mb-4">Print on 4x6 Photo Paper</p>
                        <div className="w-full aspect-[6/4] bg-gray-50 rounded-xl mb-4 border border-gray-200 overflow-hidden relative group-hover:border-emerald-300 transition-colors flex items-center justify-center p-1.5 shadow-inner">
                          <img src={generatedImages.sheet} alt="Sheet" className="w-full h-full object-contain rounded-md" />
                        </div>
                        
                        <div className="flex gap-2 mt-auto w-full">
                          <button onClick={() => setViewImage(generatedImages.sheet)} className="px-3.5 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 transition-colors shadow-sm"><Eye size={14}/> View</button>
                          <a href={generatedImages.sheet} download={`${getFirstName()}_sheet.jpg`} className="flex-1 bg-[#00a67e] hover:bg-emerald-700 text-white font-black py-2 rounded-xl text-xs flex justify-center items-center gap-1.5 transition-colors shadow-sm"><Download size={14}/> Download</a>
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400">
                    <div className="w-16 h-16 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-center mb-4 relative">
                      <Sparkles size={24} className="text-emerald-500" />
                    </div>
                    <p className="font-black text-base text-gray-900 mb-1">Your formatted photos will appear here</p>
                    <p className="text-xs font-semibold text-center text-gray-500">Upload a photo and generate professional prints in seconds.</p>
                  </div>
                )}
              </div>

              {/* FOOTER INFO WIDGETS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-gray-100 shrink-0 mt-auto">
                 <div className="flex items-start gap-2 text-left">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100"><ShieldCheck size={12}/></div>
                    <div><h5 className="text-[11px] font-black text-gray-900">Secure & Private</h5><p className="text-[9px] font-bold text-gray-500">100% client-side processing</p></div>
                 </div>
                 <div className="flex items-start gap-2 text-left">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100"><Zap size={12}/></div>
                    <div><h5 className="text-[11px] font-black text-gray-900">Instant Results</h5><p className="text-[9px] font-bold text-gray-500">Generate in seconds</p></div>
                 </div>
                 <div className="flex items-start gap-2 text-left">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100"><ImageIcon size={12}/></div>
                    <div><h5 className="text-[11px] font-black text-gray-900">High Quality</h5><p className="text-[9px] font-bold text-gray-500">Crisp, clear prints every time</p></div>
                 </div>
                 <div className="flex items-start gap-2 text-left">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100"><CheckCircle2 size={12}/></div>
                    <div><h5 className="text-[11px] font-black text-gray-900">Form Ready</h5><p className="text-[9px] font-bold text-gray-500">Perfect for SSC, Railway, NEET</p></div>
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
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2"><CropIcon size={20} className="text-emerald-600"/> Adjust Image</h3>
                <p className="text-xs font-bold text-gray-500 mt-1">Rotate or drag edges to fit</p>
              </div>
              <button onClick={() => setCropModalOpen(false)} className="bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-600 p-2.5 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center items-center">
              <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)}>
                <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="Crop preview" className="max-w-full h-auto shadow-md" style={{ maxHeight: '50vh', objectFit: 'contain' }}/>
              </ReactCrop>
            </div>

            <div className="p-5 md:p-6 border-t border-gray-100 bg-white z-10 shrink-0 flex flex-col sm:flex-row gap-3">
              <button onClick={handleRotate} className="flex-1 flex justify-center items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-800 font-black py-3.5 rounded-xl transition-colors border border-gray-200 text-sm">
                <RotateCw size={18}/> Rotate 90°
              </button>
              <button onClick={handleCropSave} className="flex-[1.5] flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl shadow-md transition-colors text-sm">
                <Check size={18}/> Save Crop
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