import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Lock,
  Minus,
  MoveDown,
  MoveUp,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import SEO from '../components/SEO';

const MAX_FILE_SIZE_MB = 10;
const MAX_IMAGE_COUNT = 30;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://edufills.com').replace(/\/$/, '');

const PAGE_SIZES = {
  a4: { label: 'A4', format: 'a4' },
  letter: { label: 'Letter', format: 'letter' },
  legal: { label: 'Legal', format: 'legal' },
};

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};


const formatKB = (bytes = 0) => {
  if (!bytes) return '0 KB';
  return `${(bytes / 1024).toFixed(bytes < 1024 * 10 ? 1 : 0)} KB`;
};

const formatMB = (bytes = 0) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const qualityLabel = (targetSizeKB) => {
  if (targetSizeKB <= 300) return 'Compact';
  if (targetSizeKB <= 900) return 'Medium';
  if (targetSizeKB <= 2000) return 'High';
  return 'Best Quality';
};

const loadImageFromUrl = (url) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error('Invalid image dimensions'));
        return;
      }

      resolve(image);
    };
    image.onerror = () => reject(new Error('Image load failed'));
    image.src = url;
  });
};

const blobToExactSize = async (blob, targetBytes) => {
  if (!blob || blob.size >= targetBytes) return blob;

  // PDF readers safely ignore trailing whitespace after %%EOF.
  // This is used only to make the final upload size exactly match the selected KB.
  const padding = new Uint8Array(targetBytes - blob.size);
  padding.fill(0x20);

  return new Blob([blob, padding], { type: 'application/pdf' });
};

export default function ImageToPdfMaker() {
  const fileInputRef = useRef(null);
  const imagesRef = useRef([]);
  const pdfResultUrlRef = useRef('');

  const [images, setImages] = useState([]);
  const [targetSizeKB, setTargetSizeKB] = useState(800);
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  const [addMargins, setAddMargins] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [pdfResult, setPdfResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);

    return () => {
      imagesRef.current.forEach((item) => {
        if (item?.url) URL.revokeObjectURL(item.url);
      });

      if (pdfResultUrlRef.current) {
        URL.revokeObjectURL(pdfResultUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    pdfResultUrlRef.current = pdfResult?.url || '';
  }, [pdfResult]);

  const totalInputSize = useMemo(() => {
    return images.reduce((sum, item) => sum + item.file.size, 0);
  }, [images]);

  const resetPdfResult = () => {
    if (pdfResultUrlRef.current) {
      URL.revokeObjectURL(pdfResultUrlRef.current);
      pdfResultUrlRef.current = '';
    }

    setPdfResult(null);
  };

  const validateFile = (file) => {
    if (!file) return 'Invalid file.';
    if (!ALLOWED_TYPES.includes(file.type)) return `${file.name} is not supported. Use JPG, PNG, JPEG or WEBP.`;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `${file.name} is larger than ${MAX_FILE_SIZE_MB} MB.`;
    return '';
  };

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setErrorMsg('');
    resetPdfResult();

    const currentCount = images.length;
    const remainingSlots = MAX_IMAGE_COUNT - currentCount;
    const selected = files.slice(0, Math.max(0, remainingSlots));

    if (!remainingSlots) {
      setErrorMsg(`Maximum ${MAX_IMAGE_COUNT} images allowed.`);
      return;
    }

    const errors = [];
    const validImages = [];

    for (const file of selected) {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
        continue;
      }

      const url = URL.createObjectURL(file);
      validImages.push({
        id: createId(),
        file,
        url,
        name: file.name,
        size: file.size,
      });
    }

    if (files.length > remainingSlots) {
      errors.push(`Only ${remainingSlots} more images were added. Maximum limit is ${MAX_IMAGE_COUNT}.`);
    }

    if (errors.length) setErrorMsg(errors[0]);
    if (validImages.length) setImages((prev) => [...prev, ...validImages]);
  };

  const handleFileChange = (event) => {
    addFiles(event.target.files);
    event.target.value = '';
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const removeImage = (id) => {
    resetPdfResult();
    setImages((prev) => {
      const item = prev.find((image) => image.id === id);
      if (item?.url) URL.revokeObjectURL(item.url);
      return prev.filter((image) => image.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach((item) => URL.revokeObjectURL(item.url));
    setImages([]);
    resetPdfResult();
    setErrorMsg('');
  };

  const moveImage = (index, direction) => {
    resetPdfResult();
    setImages((prev) => {
      const next = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= next.length) return prev;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
  };

  const createPageDataUrl = (image, pdfPageWidth, pdfPageHeight, scaleFactor, jpegQuality) => {
    const pixelRatio = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(420, Math.round(pdfPageWidth * pixelRatio * scaleFactor));
    canvas.height = Math.max(580, Math.round(pdfPageHeight * pixelRatio * scaleFactor));

    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) {
      throw new Error('Canvas is not supported in this browser.');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const marginPx = addMargins ? Math.round(Math.min(canvas.width, canvas.height) * 0.055) : 0;
    const availableWidth = canvas.width - marginPx * 2;
    const availableHeight = canvas.height - marginPx * 2;

    const imageRatio = image.naturalWidth / image.naturalHeight;
    const boxRatio = availableWidth / availableHeight;

    let drawWidth;
    let drawHeight;

    if (imageRatio > boxRatio) {
      drawWidth = availableWidth;
      drawHeight = availableWidth / imageRatio;
    } else {
      drawHeight = availableHeight;
      drawWidth = availableHeight * imageRatio;
    }

    const drawX = marginPx + (availableWidth - drawWidth) / 2;
    const drawY = marginPx + (availableHeight - drawHeight) / 2;

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

    return canvas.toDataURL('image/jpeg', jpegQuality);
  };

  const buildPdfBlob = async (loadedImages, jpegQuality, scaleFactor) => {
    const pdf = new jsPDF({
      orientation,
      unit: 'pt',
      format: PAGE_SIZES[pageSize].format,
      compress: true,
      putOnlyUsedFonts: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    loadedImages.forEach((image, index) => {
      if (index > 0) pdf.addPage(PAGE_SIZES[pageSize].format, orientation);
      const dataUrl = createPageDataUrl(image, pageWidth, pageHeight, scaleFactor, jpegQuality);
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    });

    const arrayBuffer = pdf.output('arraybuffer');
    return new Blob([arrayBuffer], { type: 'application/pdf' });
  };

  const generateExactSizePdf = async () => {
    if (!images.length) {
      setErrorMsg('Please upload at least one image first.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg('');
    resetPdfResult();

    const targetBytes = Math.round(targetSizeKB * 1024);

    try {
      setProgressText('Loading images...');
      const loadedImages = await Promise.all(images.map((item) => loadImageFromUrl(item.url)));

      const scaleSteps = [1, 0.86, 0.72, 0.58, 0.46, 0.36, 0.28, 0.22, 0.17, 0.13];
      let bestUnder = null;
      let smallest = null;

      for (const scale of scaleSteps) {
        let low = 0.1;
        let high = 0.92;

        for (let i = 0; i < 9; i += 1) {
          const quality = (low + high) / 2;
          setProgressText(`Optimizing PDF... ${Math.round(scale * 100)}% / q${Math.round(quality * 100)}`);

          const blob = await buildPdfBlob(loadedImages, quality, scale);

          if (!smallest || blob.size < smallest.blob.size) {
            smallest = { blob, quality, scale };
          }

          if (blob.size <= targetBytes) {
            bestUnder = { blob, quality, scale };
            low = quality;
          } else {
            high = quality;
          }
        }

        if (bestUnder) break;
      }

      if (!bestUnder) {
        const minimumSize = smallest?.blob?.size || 0;
        const minimumUrl = smallest ? URL.createObjectURL(smallest.blob) : '';

        setPdfResult({
          url: minimumUrl,
          blob: smallest?.blob || null,
          size: minimumSize,
          exact: false,
          targetBytes,
          quality: smallest?.quality || 0,
          scale: smallest?.scale || 0,
          pages: images.length,
        });

        setErrorMsg(`Selected target ${targetSizeKB} KB is too low for ${images.length} image(s). Minimum possible is about ${formatKB(minimumSize)}. Increase target size and generate again.`);
        return;
      }

      setProgressText('Finalizing exact file size...');
      const exactBlob = await blobToExactSize(bestUnder.blob, targetBytes);
      const exactUrl = URL.createObjectURL(exactBlob);

      setPdfResult({
        url: exactUrl,
        blob: exactBlob,
        size: exactBlob.size,
        exact: exactBlob.size === targetBytes,
        targetBytes,
        quality: bestUnder.quality,
        scale: bestUnder.scale,
        pages: images.length,
      });

      setTimeout(() => {
        document.getElementById('pdf-output-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('PDF generation failed:', error);
      }

      setErrorMsg('PDF generation failed. Please try again with fewer images or a larger target size.');
    } finally {
      setIsGenerating(false);
      setProgressText('');
    }
  };

  const downloadFileName = `EduFill_${images.length || 1}_pages_${targetSizeKB}KB.pdf`;

  const toolSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'EduFill Image to PDF Maker',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    url: `${SITE_URL}/tools/pdf-maker`,
    description: 'Convert JPG, PNG and WEBP images into one optimized PDF directly in the browser.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    publisher: {
      '@type': 'Organization',
      name: 'EduFill',
      url: SITE_URL,
    },
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col font-sans selection:bg-rose-200">
      <SEO
        title="Image to PDF Maker | Convert JPG/PNG/WEBP to PDF | EduFill"
        description="Convert JPG, PNG and WEBP images into one optimized PDF directly in your browser. Choose page size, margins and target KB for exam form uploads."
        keywords="image to pdf, jpg to pdf, png to pdf, webp to pdf, image to pdf maker, exam form pdf maker, EduFill tools"
        url="/tools/pdf-maker"
        canonical={`${SITE_URL}/tools/pdf-maker`}
        schema={toolSchema}
        schemaMarkup={toolSchema}
      />

      <div className="bg-gradient-to-r from-[#0F172A] via-[#111827] to-[#2A1839] text-white pt-6 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[520px] h-[520px] bg-rose-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[320px] h-[320px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Link to="/tools" className="inline-flex items-center gap-2 text-rose-300 hover:text-rose-200 font-black text-xs uppercase tracking-widest mb-6 transition-colors">
              <ArrowLeft size={16} strokeWidth={3} /> Back to Tools
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-500/20 rounded-2xl flex items-center justify-center border border-rose-400/30 backdrop-blur-sm shadow-inner">
                <FileText className="text-rose-300 w-8 h-8" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Image to PDF Maker</h1>
                <p className="text-white/70 text-sm font-medium mt-1">Convert marksheets and documents into a single professional PDF.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/15 backdrop-blur-md text-white text-sm font-bold px-5 py-3 rounded-full w-max shadow-lg">
            <ShieldCheck size={18} className="text-rose-300" /> 100% Client-Side Processing
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-[560px_1fr] gap-6 xl:gap-8">
          <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 md:p-7">
            <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-sm font-black border border-rose-100">1</div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Add Documents</h2>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">JPG, PNG, JPEG, WEBP • Multi-select</p>
                </div>
              </div>
              <span className="text-xs font-black bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl">{images.length} Added</span>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative overflow-hidden cursor-pointer border-2 border-dashed rounded-3xl p-8 min-h-[170px] flex flex-col items-center justify-center text-center transition-all duration-300 ${
                isDragging
                  ? 'bg-gradient-to-br from-rose-50 via-white to-emerald-50 border-rose-500 scale-[1.01] shadow-[0_0_30px_rgba(244,63,94,0.22)]'
                  : 'border-rose-200 bg-rose-50/30 hover:bg-rose-50/70 hover:border-rose-400'
              }`}
            >
              {isDragging && (
                <>
                  <Sparkles className="absolute top-5 left-8 text-rose-400 animate-bounce opacity-70" size={20} />
                  <Sparkles className="absolute bottom-5 right-8 text-emerald-400 animate-bounce opacity-70" size={22} />
                </>
              )}
              <div className={`w-16 h-16 bg-white text-rose-600 rounded-full flex items-center justify-center shadow-sm mb-4 transition-transform ${isDragging ? 'scale-110 rotate-6' : ''}`}>
                <UploadCloud size={32} />
              </div>
              <p className="font-black text-gray-950 text-lg">{isDragging ? 'Drop images here' : 'Drag & drop images here'}</p>
              <p className="text-sm font-bold text-gray-500 mt-1">or <span className="text-rose-600">click to browse files</span></p>
              <p className="text-[11px] uppercase tracking-wider font-black text-gray-400 mt-2">Max {MAX_FILE_SIZE_MB} MB each • {MAX_IMAGE_COUNT} images max</p>
              <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
            </div>

            {errorMsg && (
              <div className="mt-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-4 py-3 text-xs font-black">
                {errorMsg}
              </div>
            )}

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Selected Images ({images.length})</h3>
                {images.length > 0 && (
                  <button type="button" onClick={clearAll} className="text-xs font-black text-red-500 hover:text-red-700 flex items-center gap-1">
                    Clear all <Trash2 size={13} />
                  </button>
                )}
              </div>

              {images.length > 0 ? (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                  {images.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-3 hover:bg-white transition-colors">
                      <GripVertical size={17} className="text-gray-300 shrink-0" />
                      <div className="w-12 h-14 rounded-xl bg-white border border-gray-100 overflow-hidden shrink-0">
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-gray-900 truncate">{item.name}</p>
                        <p className="text-[10px] font-bold text-gray-500">{formatKB(item.size)} • Page {index + 1}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveImage(index, 'up')} disabled={index === 0} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30" aria-label="Move up">
                          <MoveUp size={16} />
                        </button>
                        <button type="button" onClick={() => moveImage(index, 'down')} disabled={index === images.length - 1} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30" aria-label="Move down">
                          <MoveDown size={16} />
                        </button>
                        <button type="button" onClick={() => removeImage(item.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" aria-label="Remove image">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 h-32 flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon size={32} className="mb-2 text-gray-300" />
                  <p className="font-black text-sm">No images selected yet.</p>
                </div>
              )}
            </div>

            {images.length > 0 && (
              <div className="mt-5 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 flex items-start gap-2 text-xs font-bold text-emerald-700">
                <Lock size={15} className="shrink-0 mt-0.5" /> Total input size: {formatMB(totalInputSize)}. Files process in your browser.
              </div>
            )}
          </section>

          <div className="space-y-6">
            <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 md:p-7">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-sm font-black border border-rose-100">2</div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">PDF Settings</h2>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">Select exact final PDF size and page layout.</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">Output Quality + File Size</p>
                    <p className="text-[11px] font-bold text-gray-400 mt-1">Final PDF will be exactly this size when possible.</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex bg-white border border-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider">
                      {qualityLabel(targetSizeKB)}
                    </span>
                    <p className="text-sm font-black text-gray-900 mt-2">Target: {targetSizeKB} KB</p>
                  </div>
                </div>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="50"
                  value={targetSizeKB}
                  onChange={(event) => setTargetSizeKB(Number(event.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] font-black text-gray-400 mt-2">
                  <span>50 KB</span>
                  <span>5 MB</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <div className="border border-gray-200 rounded-2xl p-4">
                  <p className="text-xs font-black text-gray-700 mb-3 flex items-center gap-2"><FileText size={15} /> Page Size</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(PAGE_SIZES).map(([key, item]) => (
                      <button type="button"
                        key={key}
                        onClick={() => { setPageSize(key); resetPdfResult(); }}
                        className={`py-2.5 rounded-xl text-xs font-black border transition-colors ${pageSize === key ? 'bg-rose-50 border-rose-400 text-rose-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border border-gray-200 rounded-2xl p-4">
                  <p className="text-xs font-black text-gray-700 mb-3 flex items-center gap-2"><Minus size={15} /> Orientation</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['portrait', 'landscape'].map((item) => (
                      <button type="button"
                        key={item}
                        onClick={() => { setOrientation(item); resetPdfResult(); }}
                        className={`py-2.5 rounded-xl text-xs font-black border capitalize transition-colors ${orientation === item ? 'bg-rose-50 border-rose-400 text-rose-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border border-gray-200 rounded-2xl p-4 mb-5">
                <div>
                  <p className="text-sm font-black text-gray-900">Add Margins</p>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">White margins around every PDF page.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setAddMargins((prev) => !prev); resetPdfResult(); }}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${addMargins ? 'bg-rose-500' : 'bg-gray-300'}`}
                  aria-label="Toggle margins"
                >
                  <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform ${addMargins ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <button type="button"
                onClick={generateExactSizePdf}
                disabled={!images.length || isGenerating}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black py-4 rounded-2xl shadow-lg shadow-rose-600/20 flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
              >
                {isGenerating ? <><Loader2 size={20} className="animate-spin" /> {progressText || 'Generating PDF...'}</> : <><Sparkles size={20} /> Generate PDF Document</>}
              </button>
            </section>

            <section id="pdf-output-section" className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 md:p-7 min-h-[360px]">
              <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-sm font-black border border-rose-100">3</div>
                  <h2 className="text-lg font-black text-gray-900">Final Document</h2>
                </div>
                {pdfResult && (
                  <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border ${pdfResult.exact ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                    {pdfResult.exact ? 'Exact Size Ready' : 'Minimum Size Ready'}
                  </span>
                )}
              </div>

              {pdfResult?.url ? (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <div className="relative w-24 h-24 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-5">
                    <FileText size={42} className="text-rose-600" />
                    <span className="absolute -right-2 -bottom-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                      <Check size={18} strokeWidth={4} />
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-950">Your PDF is ready!</h3>
                  <p className="text-sm font-bold text-gray-500 mt-2">
                    {pdfResult.pages} page{pdfResult.pages > 1 ? 's' : ''} • Final size: <span className="text-gray-900">{formatKB(pdfResult.size)}</span> • Target: {targetSizeKB} KB
                  </p>
                  <p className="text-xs font-bold text-gray-400 mt-1">
                    Quality {Math.round(pdfResult.quality * 100)}% • Scale {Math.round(pdfResult.scale * 100)}%
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7 w-full max-w-md">
                    <a
                      href={pdfResult.url}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-700 font-black flex items-center justify-center gap-2 hover:bg-gray-50"
                    >
                      <Eye size={18} /> Preview PDF
                    </a>
                    <a
                      href={pdfResult.url}
                      download={downloadFileName}
                      className="py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
                    >
                      <Download size={18} /> Download PDF
                    </a>
                  </div>

                  {!pdfResult.exact && (
                    <div className="mt-5 max-w-xl bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-xs font-bold text-amber-700">
                      Your selected target is too low for these images. Increase target size for exact output.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 text-gray-400">
                  <div className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center mb-5 relative">
                    <FileText size={34} className="text-gray-300" />
                    <Sparkles className="absolute -top-2 -right-2 text-rose-300" size={20} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">Awaiting Generation</h3>
                  <p className="text-sm font-semibold text-gray-500 mt-2 max-w-sm">
                    Upload images, select exact file size, and generate your merged PDF.
                  </p>
                </div>
              )}
            </section>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['Exact KB Output', 'Selected KB size support', CheckCircle2],
                ['Multi Image PDF', 'Merge many images', ImageIcon],
                ['Private & Secure', 'Browser processing', Lock],
                ['Form Ready', 'Perfect for uploads', ShieldCheck],
              ].map(([title, text, Icon]) => (
                <div key={title} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <Icon size={15} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-gray-900">{title}</p>
                    <p className="text-[9px] font-bold text-gray-500 mt-1">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}