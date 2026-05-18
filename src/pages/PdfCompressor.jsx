import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Download,
  Eye,
  FileArchive,
  FileText,
  HardDrive,
  Loader2,
  Lock,
  RefreshCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import SEO from '../components/SEO';

const PDF_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDF_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const MAX_FILE_SIZE_MB = 200;
const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://edufills.com').replace(/\/$/, '');

const compressorSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'EduFill PDF Compressor',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web Browser',
  url: `${SITE_URL}/tools/pdf-compressor`,
  description: 'Compress PDF files to target KB sizes directly in the browser for exam form uploads.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
};

export default function PdfCompressor() {
  const [pdfFile, setPdfFile] = useState(null);
  const [targetSizeKB, setTargetSizeKB] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [compressedPdf, setCompressedPdf] = useState(null);
  const [pdfLibLoaded, setPdfLibLoaded] = useState(() => typeof window !== 'undefined' && Boolean(window.pdfjsLib));
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    let isMounted = true;

    const markPdfLibReady = () => {
      if (!isMounted || !window.pdfjsLib) return;
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
      setPdfLibLoaded(true);
    };

    const markPdfLibFailed = () => {
      if (!isMounted) return;
      setErrorMessage('PDF library load nahi ho paayi. Please internet connection check karke reload karo.');
    };

    if (window.pdfjsLib) {
      markPdfLibReady();
      return () => {
        isMounted = false;
      };
    }

    const existingScript = document.querySelector(`script[src="${PDF_JS_URL}"]`);

    if (existingScript) {
      existingScript.addEventListener('load', markPdfLibReady);
      existingScript.addEventListener('error', markPdfLibFailed);

      return () => {
        isMounted = false;
        existingScript.removeEventListener('load', markPdfLibReady);
        existingScript.removeEventListener('error', markPdfLibFailed);
      };
    }

    const script = document.createElement('script');
    script.src = PDF_JS_URL;
    script.async = true;
    script.onload = markPdfLibReady;
    script.onerror = markPdfLibFailed;
    document.body.appendChild(script);

    return () => {
      isMounted = false;
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (compressedPdf?.url) URL.revokeObjectURL(compressedPdf.url);
    };
  }, [compressedPdf?.url]);

  const targetBytes = useMemo(() => Math.max(1, Math.round(targetSizeKB * 1024)), [targetSizeKB]);

  const resetOutput = () => {
    if (compressedPdf?.url) URL.revokeObjectURL(compressedPdf.url);
    setCompressedPdf(null);
    setErrorMessage('');
  };

  const resetAll = () => {
    resetOutput();
    setPdfFile(null);
    setProgressText('');
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatKB = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`;
    return `${kb.toFixed(2)} KB`;
  };

  const exactKBLabel = (bytes) => {
    if (!bytes) return '0 KB';
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const validateAndSetFile = (file) => {
    setErrorMessage('');

    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setErrorMessage('Please sirf valid PDF file upload karo.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`PDF file ${MAX_FILE_SIZE_MB} MB se kam honi chahiye.`);
      return;
    }

    resetOutput();
    setPdfFile(file);
  };

  const handleFileChange = (event) => {
    validateAndSetFile(event.target.files?.[0]);
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
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    validateAndSetFile(event.dataTransfer.files?.[0]);
  };

  const readFileAsArrayBuffer = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(new Error('PDF file read nahi ho paayi.'));
    reader.readAsArrayBuffer(file);
  });

  const padPdfBlobToExactSize = async (blob, desiredBytes) => {
    if (!blob || blob.size >= desiredBytes) return blob;

    const paddingBytes = desiredBytes - blob.size;
    const padding = new Uint8Array(paddingBytes);
    padding.fill(0x20); // trailing spaces after EOF; PDF readers safely ignore this.

    return new Blob([blob, padding], { type: 'application/pdf' });
  };

  const getAttemptProfile = (targetKB, pages) => {
    const kbPerPage = targetKB / Math.max(1, pages);

    if (kbPerPage <= 7) {
      return [
        { scale: 0.30, quality: 0.14 },
        { scale: 0.24, quality: 0.11 },
        { scale: 0.18, quality: 0.09 },
        { scale: 0.14, quality: 0.07 },
      ];
    }

    if (kbPerPage <= 15) {
      return [
        { scale: 0.52, quality: 0.28 },
        { scale: 0.42, quality: 0.22 },
        { scale: 0.34, quality: 0.17 },
        { scale: 0.26, quality: 0.12 },
        { scale: 0.18, quality: 0.09 },
      ];
    }

    if (kbPerPage <= 35) {
      return [
        { scale: 0.85, quality: 0.44 },
        { scale: 0.70, quality: 0.36 },
        { scale: 0.55, quality: 0.28 },
        { scale: 0.42, quality: 0.20 },
        { scale: 0.30, quality: 0.14 },
      ];
    }

    if (kbPerPage <= 80) {
      return [
        { scale: 1.15, quality: 0.58 },
        { scale: 0.95, quality: 0.50 },
        { scale: 0.78, quality: 0.42 },
        { scale: 0.62, quality: 0.34 },
        { scale: 0.48, quality: 0.24 },
      ];
    }

    return [
      { scale: 1.55, quality: 0.78 },
      { scale: 1.35, quality: 0.70 },
      { scale: 1.15, quality: 0.60 },
      { scale: 0.95, quality: 0.50 },
      { scale: 0.75, quality: 0.40 },
    ];
  };

  const buildCompressedPdfBlob = async (pdfDocument, numPages, scale, quality) => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true,
      putOnlyUsedFonts: true,
      precision: 2,
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 0;

    for (let pageNumber = 1; pageNumber <= numPages; pageNumber += 1) {
      setProgressText(`Compressing page ${pageNumber} of ${numPages}...`);

      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        throw new Error('Canvas is not supported in this browser.');
      }

      canvas.width = Math.max(80, Math.floor(viewport.width));
      canvas.height = Math.max(80, Math.floor(viewport.height));

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport }).promise;

      const imageData = canvas.toDataURL('image/jpeg', quality);

      if (pageNumber > 1) doc.addPage('a4', 'p');

      const imageRatio = canvas.width / canvas.height;
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;
      const pageRatio = printableWidth / printableHeight;

      let finalWidth;
      let finalHeight;

      if (imageRatio > pageRatio) {
        finalWidth = printableWidth;
        finalHeight = finalWidth / imageRatio;
      } else {
        finalHeight = printableHeight;
        finalWidth = finalHeight * imageRatio;
      }

      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;

      doc.addImage(imageData, 'JPEG', x, y, finalWidth, finalHeight, undefined, 'FAST');

      canvas.width = 1;
      canvas.height = 1;
    }

    return doc.output('blob');
  };

  const compressPdf = async () => {
    if (!pdfFile) {
      setErrorMessage('Please pehle PDF upload karo.');
      return;
    }

    if (!window.pdfjsLib || !pdfLibLoaded) {
      setErrorMessage('PDF library load ho rahi hai. 1-2 second wait karke dobara try karo.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    resetOutput();
    setProgressText('Reading PDF...');

    let pdfDocument = null;

    try {
      const arrayBuffer = await readFileAsArrayBuffer(pdfFile);
      pdfDocument = await window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const numPages = pdfDocument.numPages;
      const attempts = getAttemptProfile(targetSizeKB, numPages);

      let bestUnderTarget = null;
      let smallestBlob = null;
      let smallestAttempt = null;

      for (let attemptIndex = 0; attemptIndex < attempts.length; attemptIndex += 1) {
        const attempt = attempts[attemptIndex];
        setProgressText(`Trying exact ${targetSizeKB} KB output (${attemptIndex + 1}/${attempts.length})...`);

        const blob = await buildCompressedPdfBlob(pdfDocument, numPages, attempt.scale, attempt.quality);

        if (!smallestBlob || blob.size < smallestBlob.size) {
          smallestBlob = blob;
          smallestAttempt = attempt;
        }

        if (blob.size <= targetBytes) {
          bestUnderTarget = { blob, attempt };
          break;
        }
      }

      let finalBlob;
      let exactMatch = false;
      let warning = '';
      let usedAttempt = bestUnderTarget?.attempt || smallestAttempt;

      if (bestUnderTarget?.blob) {
        finalBlob = await padPdfBlobToExactSize(bestUnderTarget.blob, targetBytes);
        exactMatch = finalBlob.size === targetBytes;
      } else {
        finalBlob = smallestBlob;
        warning = `Selected ${targetSizeKB} KB target is too low for this ${numPages}-page PDF. Minimum possible output is ${formatKB(finalBlob.size)}.`;
      }

      const pdfUrl = URL.createObjectURL(finalBlob);

      setCompressedPdf({
        url: pdfUrl,
        size: finalBlob.size,
        pages: numPages,
        originalSize: pdfFile.size,
        targetSize: targetBytes,
        exactMatch,
        warning,
        scale: usedAttempt?.scale,
        quality: usedAttempt?.quality,
      });

      if (warning) setErrorMessage(warning);

      setTimeout(() => {
        document.getElementById('compressor-output')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('PDF compression error:', error);
      }
      setErrorMessage('PDF process nahi ho paayi. File protected/corrupted ho sakti hai.');
    } finally {
      try {
        await pdfDocument?.destroy?.();
      } catch {
        // Ignore cleanup errors from pdf.js.
      }
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const reductionPercent = useMemo(() => {
    if (!compressedPdf?.originalSize || !compressedPdf?.size) return 0;
    return Math.max(0, ((compressedPdf.originalSize - compressedPdf.size) / compressedPdf.originalSize) * 100).toFixed(1);
  }, [compressedPdf]);

  const qualityLabel = useMemo(() => {
    if (targetSizeKB <= 50) return 'Very Compact';
    if (targetSizeKB <= 100) return 'Good';
    if (targetSizeKB <= 250) return 'High';
    return 'Best';
  }, [targetSizeKB]);

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col font-sans selection:bg-emerald-200">
      <SEO
        title="PDF Resizer & Compressor | EduFill Tools"
        description="Compress PDF files to target KB sizes directly in your browser for exam forms, government forms, scholarship forms and document uploads."
        keywords="PDF compressor, PDF resizer, compress PDF to 100KB, PDF size reducer, exam form PDF compressor, EduFill tools"
        url="/tools/pdf-compressor"
        canonical={`${SITE_URL}/tools/pdf-compressor`}
        schema={compressorSchema}
        schemaMarkup={compressorSchema}
      />

      <header className="relative overflow-hidden bg-gradient-to-br from-[#061426] via-[#062b2d] to-[#063f36] text-white">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_90%,rgba(20,184,166,0.35),transparent_28%),radial-gradient(circle_at_85%_45%,rgba(16,185,129,0.35),transparent_30%)]" />
        <div className="absolute right-0 bottom-0 w-[520px] h-[260px] bg-emerald-500/10 blur-3xl rounded-full" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-6 pb-10 md:pb-12 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <Link to="/tools" className="inline-flex items-center gap-2 text-emerald-300 hover:text-white font-black text-sm transition-colors">
              <ArrowLeft size={18} strokeWidth={3} /> Back to Tools
            </Link>
            <div className="hidden sm:flex items-center gap-2 bg-white/8 border border-white/10 backdrop-blur-xl px-4 py-2 rounded-full text-sm font-black text-emerald-50">
              <ShieldCheck size={18} className="text-emerald-300" /> 100% Client-Side Processing
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-7">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shadow-2xl shadow-emerald-950/30">
                <FileArchive className="text-emerald-300 w-9 h-9" strokeWidth={2.3} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">PDF Compressor</h1>
                <p className="text-emerald-50/75 text-sm md:text-base font-semibold mt-2 max-w-xl">
                  Compress large PDFs to exact KB limits required for uploads.
                </p>
              </div>
            </div>

            <div className="sm:hidden flex items-center gap-2 bg-white/8 border border-white/10 backdrop-blur-xl px-4 py-2 rounded-full text-xs font-black text-emerald-50 w-max">
              <ShieldCheck size={16} className="text-emerald-300" /> 100% Client-Side
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8 -mt-4 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-6 xl:gap-8">
          <section className="flex flex-col gap-6">
            <div className="bg-white rounded-[1.75rem] p-5 md:p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center text-sm font-black">1</span>
                  <h2 className="text-xl font-black text-slate-950">Upload PDF</h2>
                </div>
                {pdfFile && <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">Selected</span>}
              </div>

              <div
                role="button"
                tabIndex={0}
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
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[185px] ${
                  isDragging
                    ? 'bg-emerald-50 border-emerald-500 scale-[1.01] shadow-[0_0_30px_rgba(16,185,129,0.25)]'
                    : 'bg-emerald-50/30 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400'
                }`}
              >
                {isDragging && (
                  <>
                    <Sparkles className="absolute top-4 left-6 text-emerald-400 animate-bounce" size={20} />
                    <Sparkles className="absolute bottom-5 right-8 text-teal-400 animate-bounce" size={22} />
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={handleFileChange} className="hidden" />
                <div className="w-16 h-16 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-sm mb-4">
                  <UploadCloud size={32} />
                </div>
                <p className="text-lg font-black text-slate-900">{isDragging ? 'Drop your PDF here' : 'Drag & drop your PDF here'}</p>
                <p className="text-sm font-bold text-slate-500 mt-1">or click to browse • PDF only • Max {MAX_FILE_SIZE_MB} MB</p>
              </div>

              {pdfFile && (
                <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                    <FileText size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900 text-sm truncate">{pdfFile.name}</p>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">Original size • {formatKB(pdfFile.size)}</p>
                  </div>
                  <button type="button" onClick={resetAll} className="w-9 h-9 rounded-full bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 flex items-center justify-center transition-colors" aria-label="Remove PDF">
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[1.75rem] p-5 md:p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                <span className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center text-sm font-black">2</span>
                <h2 className="text-xl font-black text-slate-950">Set Compression Target</h2>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 shadow-inner">
                <label className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                  <span className="flex items-center gap-2"><Target size={16} /> Target Size</span>
                  <span className="text-emerald-700 bg-white border border-emerald-100 px-3 py-1.5 rounded-full shadow-sm">Target: {targetSizeKB} KB</span>
                </label>

                <input
                  type="range"
                  min="30"
                  max="500"
                  step="10"
                  value={targetSizeKB}
                  onChange={(event) => {
                    setTargetSizeKB(Number(event.target.value));
                    resetOutput();
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-600 bg-slate-200"
                />

                <div className="flex justify-between mt-3 text-[11px] font-black text-slate-400">
                  <span>30 KB</span>
                  <span>500 KB</span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-sm">
                    <Settings2 size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Estimated Output Quality</p>
                    <p className="text-xs font-bold text-slate-500">Best for government forms, portals and exam uploads.</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-black text-emerald-700 bg-white border border-emerald-100 px-3 py-1 rounded-full">{qualityLabel}</span>
              </div>

              {errorMessage && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 text-amber-800">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-bold leading-relaxed">{errorMessage}</p>
                </div>
              )}

              <button
                type="button"
                onClick={compressPdf}
                disabled={!pdfFile || isProcessing || !pdfLibLoaded}
                className="w-full mt-5 bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 disabled:bg-none disabled:bg-slate-300 disabled:text-white text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-700/20 flex justify-center items-center gap-3 transition-all active:scale-[0.98] text-base"
              >
                {isProcessing ? <Loader2 size={22} className="animate-spin" /> : <Zap size={22} />}
                {isProcessing ? (progressText || 'Compressing...') : 'Compress PDF'}
              </button>
            </div>
          </section>

          <section id="compressor-output" className="bg-white rounded-[1.75rem] p-5 md:p-7 shadow-sm border border-slate-200 min-h-[620px] flex flex-col">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-950 flex items-center gap-3">
                <FileArchive className="text-emerald-600" size={24} /> Compressed File
              </h2>
              {compressedPdf?.exactMatch && (
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">Exact size matched</span>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center text-center min-h-[420px]">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 border border-emerald-100">
                    <Loader2 size={40} className="animate-spin" />
                  </div>
                  <h3 className="font-black text-2xl text-slate-950">Shrinking PDF Size...</h3>
                  <p className="text-sm font-semibold text-slate-500 mt-2">{progressText || 'Please wait while we optimize your PDF.'}</p>
                </div>
              ) : compressedPdf && pdfFile ? (
                <div className="w-full max-w-3xl mx-auto text-center">
                  <div className="relative w-28 h-28 mx-auto mb-5">
                    <div className="absolute inset-0 bg-emerald-50 rounded-[2rem] rotate-6" />
                    <div className="absolute inset-0 bg-white border border-emerald-100 rounded-[2rem] flex items-center justify-center shadow-sm">
                      <FileText size={48} className="text-red-500" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                      <Check size={24} strokeWidth={4} />
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-950">Compression Successful!</h3>
                  <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-black">
                    <Check size={16} /> {compressedPdf.exactMatch ? `Target size of ${targetSizeKB} KB achieved` : 'Best possible output ready'}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-7">
                    <StatCard label="Original Size" value={formatKB(compressedPdf.originalSize)} />
                    <StatCard label="Compressed Size" value={exactKBLabel(compressedPdf.size)} highlight />
                    <StatCard label="Reduction" value={`${reductionPercent}%`} />
                    <StatCard label="Pages" value={compressedPdf.pages} />
                  </div>

                  {compressedPdf.warning ? (
                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left flex items-start gap-3 text-amber-800">
                      <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                      <p className="text-xs font-bold leading-relaxed">{compressedPdf.warning}</p>
                    </div>
                  ) : (
                    <div className="mt-5 text-sm font-black text-emerald-700 flex items-center justify-center gap-2">
                      <Check size={18} /> Final PDF is exactly {targetSizeKB} KB.
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3 mt-7 max-w-xl mx-auto">
                    <a href={compressedPdf.url} download={`EduFill_Compressed_${targetSizeKB}KB.pdf`} className="bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20">
                      <Download size={20} /> Download PDF
                    </a>
                    <a href={compressedPdf.url} target="_blank" rel="noreferrer" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-black py-4 rounded-xl flex items-center justify-center gap-2">
                      <Eye size={20} /> Preview
                    </a>
                  </div>

                  <div className="mt-7 rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-3 text-left">
                    <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">Quality Preserved</h4>
                      <p className="text-xs font-semibold text-slate-500 mt-1">Text and images remain clear as much as possible within your selected KB target.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center min-h-[420px] text-slate-400">
                  <div className="w-24 h-24 relative mb-6">
                    <div className="absolute inset-0 bg-emerald-50 rounded-3xl rotate-6" />
                    <div className="absolute inset-0 bg-white border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center">
                      <HardDrive size={38} className="text-slate-300" />
                    </div>
                    <Sparkles className="absolute -top-2 -right-2 text-emerald-400" size={22} />
                  </div>
                  <h3 className="font-black text-2xl text-slate-950">Awaiting PDF</h3>
                  <p className="text-sm font-semibold text-slate-500 mt-2 max-w-sm">Upload a PDF and choose your target KB. EduFill will generate a compressed PDF for upload.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <MiniFeature icon={<Lock size={18} />} title="100% Private" desc="Files processed locally in your browser." />
          <MiniFeature icon={<Zap size={18} />} title="No Uploads" desc="Your files never leave your device." />
          <MiniFeature icon={<ShieldCheck size={18} />} title="Secure & Safe" desc="No data stored on any server." />
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, highlight = false }) {
  return (
    <div className={`rounded-2xl border p-4 text-center ${highlight ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200'}`}>
      <p className="text-xs font-bold text-slate-500 mb-2">{label}</p>
      <p className={`text-xl font-black ${highlight ? 'text-emerald-700' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function MiniFeature({ icon, title, desc }) {
  return (
    <div className="bg-white/80 border border-slate-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
      <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
        {icon}
      </div>
      <div>
        <h4 className="font-black text-slate-900 text-sm">{title}</h4>
        <p className="text-xs font-semibold text-slate-500 mt-1">{desc}</p>
      </div>
    </div>
  );
}
