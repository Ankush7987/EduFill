import React, { useState, useRef } from 'react';
// 🌟 NAYA: RotateCw icon import kiya 🌟
import { UploadCloud, CheckCircle, FileText, Image as ImageIcon, Loader2, Crop as CropIcon, X, Check, RefreshCw, RotateCw } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { jsPDF } from 'jspdf';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; 

const DocumentUploader = ({ studentId, collectionName, studentName, category, onComplete, existingDocs }) => {
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState('');
  
  const cloudName = "dvocl6wvq";
  const uploadPreset = "edufill_docs";

  const [files, setFiles] = useState({ profilePic: null, signature: null, tenthMarkSheet: null, domicile: null, casteCert: null });

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [cropDocType, setCropDocType] = useState('');
  const [currentRawFile, setCurrentRawFile] = useState(null); 
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  const handleFileChange = (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      setFiles({ ...files, [docType]: file }); 
      return;
    }

    setCurrentRawFile(file);
    setCropDocType(docType);
    
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImgSrc(reader.result);
      setCompletedCrop(null); 
      setCropModalOpen(true);
    });
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    let aspect = undefined;
    if (cropDocType === 'profilePic') aspect = 413 / 446; 
    if (cropDocType === 'signature') aspect = 3 / 1; 

    if (aspect) {
      const newCrop = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height), width, height);
      setCrop(newCrop); setCompletedCrop(newCrop); 
    } else {
      const fullCrop = { unit: '%', width: 100, height: 100, x: 0, y: 0 };
      setCrop(fullCrop); setCompletedCrop(fullCrop);
    }
  };

  // 🌟 NAYA: ROTATE IMAGE FUNCTION 🌟
  const handleRotate = () => {
    const image = imgRef.current;
    if (!image) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 90 degree ghumane ke liye width aur height ko palatna padta hai
    canvas.width = image.naturalHeight;
    canvas.height = image.naturalWidth;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(90 * Math.PI / 180);
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

    // Ghumi hui photo ko wapas image source me daal dein
    setImgSrc(canvas.toDataURL('image/jpeg', 1.0));
    setCompletedCrop(null); // Pura crop box reset karein
  };

  const handleUseOriginal = () => {
    setFiles(prev => ({ ...prev, [cropDocType]: currentRawFile }));
    setCropModalOpen(false); setImgSrc(''); setCurrentRawFile(null);
  };

  const handleCropSave = async () => {
    if (!completedCrop || !completedCrop.width || !completedCrop.height) {
      handleUseOriginal(); return;
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
      blob.name = `${cropDocType}.jpg`;
      setFiles(prev => ({ ...prev, [cropDocType]: blob }));
      setCropModalOpen(false); setImgSrc(''); setCurrentRawFile(null);
    }, 'image/jpeg', 1.0);
  };

  const processPassportPhoto = async (croppedBlob, name) => {
    let finalBlobToProcess = croppedBlob;
    let isBgRemoved = false; 

    try {
      const apiKey = "navkJvJVi2bg4G2bTWLJDWva"; 
      if (apiKey) {
        setProgressText('AI is framing the perfect photo...');
        const smallBlob = await imageCompression(croppedBlob, { maxSizeMB: 2, maxWidthOrHeight: 1000 });
        const formData = new FormData();
        formData.append('image_file', smallBlob, 'photo.jpg');
        formData.append('size', 'auto');

        const response = await fetch('https://api.remove.bg/v1.0/removebg', { method: 'POST', headers: { 'X-Api-Key': apiKey }, body: formData });

        if (response.ok) { finalBlobToProcess = await response.blob(); isBgRemoved = true; }
      }
    } catch (error) { console.warn("API Error:", error); }

    const imageBmp = await createImageBitmap(finalBlobToProcess);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const finalWidth = 413; const finalHeight = 531; const textAreaHeight = 85;
    const photoHeight = finalHeight - textAreaHeight; 
    canvas.width = finalWidth; canvas.height = finalHeight; 
    
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, finalWidth, photoHeight); ctx.clip(); 

    let scale, x, y;
    if (isBgRemoved) { scale = finalWidth / imageBmp.width; x = 0; y = 20; } 
    else { scale = Math.max(finalWidth / imageBmp.width, photoHeight / imageBmp.height); x = (finalWidth / 2) - (imageBmp.width / 2) * scale; y = (photoHeight / 2) - (imageBmp.height / 2) * scale; }
    
    ctx.filter = 'contrast(105%) brightness(102%) saturate(110%)';
    ctx.drawImage(imageBmp, x, y, imageBmp.width * scale, imageBmp.height * scale);
    ctx.restore(); ctx.filter = 'none'; 

    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, photoHeight, finalWidth, textAreaHeight);
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4); 
    ctx.beginPath(); ctx.moveTo(0, photoHeight); ctx.lineTo(finalWidth, photoHeight); ctx.stroke();

    ctx.fillStyle = '#000000'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const dateStr = new Date().toLocaleDateString('en-GB'); const safeName = name.toUpperCase().trim();
    let fontSize = 26; ctx.font = `bold ${fontSize}px Arial`;
    while (ctx.measureText(safeName).width > (finalWidth - 20) && fontSize > 12) { fontSize -= 1; ctx.font = `bold ${fontSize}px Arial`; }
    ctx.fillText(safeName, finalWidth / 2, photoHeight + 35);
    ctx.font = 'bold 20px Arial'; ctx.fillText(dateStr, finalWidth / 2, photoHeight + 65);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 1.0));
    return await imageCompression(new File([blob], 'profile.jpg', { type: 'image/jpeg' }), { maxSizeMB: 0.1, maxWidthOrHeight: 800, useWebWorker: true });
  };

  const processDocumentToPDF = async (file, docName) => {
    if (file.type === 'application/pdf') return file; 
    const imageBmp = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const MAX_WIDTH = 1200;
    let width = imageBmp.width; let height = imageBmp.height;
    if (width > MAX_WIDTH) { height = height * (MAX_WIDTH / width); width = MAX_WIDTH; }
    
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.filter = 'contrast(102%)'; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height); ctx.drawImage(imageBmp, 0, 0, width, height); ctx.filter = 'none';
    
    const imgData = canvas.toDataURL('image/jpeg', 0.8); 
    const pdf = new jsPDF({ orientation: width > height ? 'l' : 'p', unit: 'px', format: [width, height] });
    pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
    const pdfBlob = pdf.output('blob');
    return new File([pdfBlob], `${docName}.pdf`, { type: 'application/pdf' });
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file); formData.append("upload_preset", uploadPreset);
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    const response = await fetch(url, { method: "POST", body: formData });
    if (!response.ok) throw new Error("Cloudinary upload failed");
    const data = await response.json(); return data.secure_url; 
  };

  const handleUploadAll = async () => {
    if (!existingDocs) {
      if (!files.profilePic || !files.signature || !files.tenthMarkSheet || !files.domicile) { alert("Please select all required documents!"); return; }
      if (category !== 'General' && !files.casteCert) { alert(`Please upload ${category === 'General (EWS)' ? 'EWS Certificate' : 'Caste Certificate'}!`); return; }
    } else {
      if (!files.profilePic && !files.signature && !files.tenthMarkSheet && !files.domicile && !files.casteCert) { alert("Please select at least one new document to replace the old one."); return; }
    }

    setUploading(true);
    const finalDocsData = { ...(existingDocs || {}) }; 
    const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '_'); 

    try {
      if (files.profilePic) {
        setProgressText('Preparing Perfect Profile Photo...');
        const finalPhoto = await processPassportPhoto(files.profilePic, studentName);
        setProgressText('Uploading Profile Photo...');
        finalDocsData.profilePicUrl = await uploadToCloudinary(finalPhoto);
      }
      if (files.signature) {
        setProgressText('Compressing Signature...');
        const finalSign = await imageCompression(files.signature, { maxSizeMB: 0.1, maxWidthOrHeight: 800, useWebWorker: true });
        finalDocsData.signatureUrl = await uploadToCloudinary(finalSign);
      }
      if (files.tenthMarkSheet) {
        setProgressText('Converting 10th Marksheet...');
        const tenthDoc = await processDocumentToPDF(files.tenthMarkSheet, `${safeName}_10th`);
        finalDocsData.tenthUrl = await uploadToCloudinary(tenthDoc);
      }
      if (files.domicile) {
        setProgressText('Processing Niwash...');
        const domicileDoc = await processDocumentToPDF(files.domicile, `${safeName}_Domicile`);
        finalDocsData.domicileUrl = await uploadToCloudinary(domicileDoc);
      }
      if (files.casteCert) {
        setProgressText(`Processing ${category === 'General (EWS)' ? 'EWS' : 'Caste'} Certificate...`);
        const casteDoc = await processDocumentToPDF(files.casteCert, `${safeName}_Category_Cert`);
        finalDocsData.casteUrl = await uploadToCloudinary(casteDoc);
      }

      setProgressText('Saving to Database...');
      await updateDoc(doc(db, collectionName, studentId), { documents: finalDocsData });
      onComplete(); 
    } catch (error) {
      console.error("Upload error: ", error);
      alert("Failed to upload. Please check your internet connection.");
    } finally { setUploading(false); }
  };

  const renderFileStatus = (file, docType) => {
    if (file) return <CheckCircle size={16} className="text-emerald-500" />;
    if (existingDocs && existingDocs[docType]) return <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">Uploaded</span>;
    return null;
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      
      {cropModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh] shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white z-10 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><CropIcon size={20}/> Adjust Image</h3>
                <p className="text-xs text-gray-500 mt-1">Rotate or drag edges to crop perfectly.</p>
              </div>
              <button onClick={() => setCropModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center items-start">
              <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)}>
                <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="Crop preview" className="max-w-full h-auto shadow-md" style={{ maxHeight: '50vh', objectFit: 'contain' }}/>
              </ReactCrop>
            </div>

            {/* 🌟 NAYA: ROTATE BUTTON UI 🌟 */}
            <div className="p-4 border-t border-gray-100 bg-white z-10 shrink-0 flex flex-col sm:flex-row gap-3">
              <button onClick={handleRotate} className="flex-1 flex justify-center items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3.5 rounded-xl transition-colors border border-blue-200">
                <RotateCw size={18}/> Rotate 90°
              </button>
              <button onClick={handleUseOriginal} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition-colors border border-gray-200">
                Skip & Use Original
              </button>
              <button onClick={handleCropSave} className="flex-1 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg transition-colors">
                <Check size={18}/> Crop & Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`border rounded-xl p-4 mb-6 ${existingDocs ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-100'}`}>
        <h3 className={`font-bold mb-1 ${existingDocs ? 'text-amber-900' : 'text-indigo-900'}`}>
          {existingDocs ? 'Update / Replace Documents' : 'Smart Document Upload'}
        </h3>
        <p className={`text-xs ${existingDocs ? 'text-amber-700' : 'text-indigo-700'}`}>
          {existingDocs ? 'Select only the documents you want to replace. The rest will remain safe.' : 'Upload documents safely. System will enhance photo, remove background and generate PDF automatically.'}
        </p>
      </div>

      <div className="space-y-4">
        {[
          { id: 'profilePic', docKey: 'profilePicUrl', label: 'Passport Photo' + (!existingDocs ? ' *' : ''), sub: 'Auto-Enhanced & White Background', icon: <ImageIcon size={20}/>, accept: 'image/*' },
          { id: 'signature', docKey: 'signatureUrl', label: 'Signature' + (!existingDocs ? ' *' : ''), sub: 'Crop your sign. Auto compressed', icon: <FileText size={20}/>, accept: 'image/*' },
          { id: 'tenthMarkSheet', docKey: 'tenthUrl', label: '10th Marksheet' + (!existingDocs ? ' *' : ''), sub: 'Image/PDF (Auto converts to PDF)', icon: <FileText size={20}/>, accept: 'image/*,application/pdf' },
          { id: 'domicile', docKey: 'domicileUrl', label: 'Niwash Praman Patra' + (!existingDocs ? ' *' : ''), sub: 'Image/PDF', icon: <FileText size={20}/>, accept: 'image/*,application/pdf' },
        ].map(doc => (
          <div key={doc.id} className={`border p-3 rounded-xl transition-colors ${files[doc.id] ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white hover:border-indigo-300'}`}>
            <label className="flex items-center justify-between cursor-pointer w-full">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${files[doc.id] ? 'bg-emerald-100 text-emerald-600' : (existingDocs && existingDocs[doc.docKey] ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600')}`}>{doc.icon}</div>
                <div><p className="font-bold text-sm text-gray-800">{doc.label}</p><p className="text-[10px] text-gray-500">{existingDocs && existingDocs[doc.docKey] ? 'Select file to replace old doc' : doc.sub}</p></div>
              </div>
              <div className="flex items-center gap-3">
                {renderFileStatus(files[doc.id], doc.docKey)}
                <input type="file" accept={doc.accept} onChange={(e) => handleFileChange(e, doc.id)} className="text-xs w-20 text-gray-500" />
              </div>
            </label>
          </div>
        ))}
        
        {category !== 'General' && (
          <div className={`border p-3 rounded-xl transition-colors ${files.casteCert ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white hover:border-indigo-300'}`}>
            <label className="flex items-center justify-between cursor-pointer w-full">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${files.casteCert ? 'bg-emerald-100 text-emerald-600' : (existingDocs && existingDocs.casteUrl ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600')}`}><FileText size={20}/></div>
                <div>
                  <p className="font-bold text-sm text-gray-800">
                    {category === 'General (EWS)' ? 'EWS Certificate' : 'Caste Certificate'} {(!existingDocs ? ' *' : '')}
                  </p>
                  <p className="text-[10px] text-gray-500">{existingDocs && existingDocs.casteUrl ? 'Select file to replace old doc' : `Required for ${category}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {renderFileStatus(files.casteCert, 'casteUrl')}
                <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'casteCert')} className="text-xs w-20 text-gray-500" />
              </div>
            </label>
          </div>
        )}
      </div>

      <button onClick={handleUploadAll} disabled={uploading} className={`w-full mt-6 text-white font-extrabold py-4 rounded-xl text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${existingDocs ? 'bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300' : 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300'}`}>
        {uploading ? <><Loader2 size={20} className="animate-spin" /> {progressText}</> : existingDocs ? <><RefreshCw size={20}/> Update Documents</> : <><UploadCloud size={24} /> Upload & Complete Registration</>}
      </button>
    </div>
  );
};

export default DocumentUploader;