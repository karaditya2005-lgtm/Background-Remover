import { useState, useRef, useContext } from 'react';
import { Upload, Download, Loader2, X, Check, LogIn } from 'lucide-react';
import { useAuth, useUser, useClerk } from '@clerk/clerk-react';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

const BackgroundRemover = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const { getToken } = useAuth();
  const { isSignedIn, user } = useUser(); // ⭐ Get user object
  const { openSignIn } = useClerk();
  const appContext = useContext(AppContext);
  
  // ⭐ Debug: Log user data
  console.log('Clerk User:', user);
  console.log('User ID:', user?.id);

  if (!appContext) throw new Error("AppContext not found");
  const { credit, loadCreditData, backendUrl } = appContext;

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target?.result);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeBackground = async () => {
    if (!isSignedIn) {
      toast.error('Please login to remove background');
      openSignIn({});
      return;
    }

    if (!originalImage) {
      toast.error('Please upload an image first');
      return;
    }

    if (credit < 1) {
      toast.error('Insufficient credits. Please purchase more credits.');
      return;
    }

    setIsProcessing(true);

    try {
      const token = await getToken();

      // Convert base64 to blob
      const base64Response = await fetch(originalImage);
      const blob = await base64Response.blob();

      // Create form data
      const formData = new FormData();
      formData.append('image', blob, 'image.png');

      const url = `${backendUrl.replace(/\/$/, '')}/api/image/remove-bg`;
      console.log('API URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (data.success) {
        setProcessedImage(data.data.processedImageUrl); // ⭐ Use Cloudinary URL
        await loadCreditData();
        toast.success('Background removed successfully!');
      } else {
        toast.error(data.message || 'Failed to remove background');
      }
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to remove background');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'background-removed.png';
    link.click();
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-5xl">
        <div className="bg-white/3 mt-16 sm:mt-20 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12 border border-white/10 shadow-2xl">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">AI Background Remover</h1>
            </div>
            <p className="text-slate-300 text-sm sm:text-base lg:text-lg px-2">Upload your image and remove the background instantly</p>
            
            {isSignedIn && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
                <span className="text-white text-sm font-medium">Credits: {credit}</span>
              </div>
            )}
          </div>

          {!originalImage ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-8 sm:p-12 lg:p-16 text-center transition-all ${
                isDragging
                  ? 'border-blue-400 bg-blue-500/10 scale-105'
                  : 'border-white/30 hover:border-white/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                <Upload className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
              </div>
              
              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mb-2 sm:mb-3 px-2">
                {isDragging ? 'Drop your image here' : 'Drag & Drop your image'}
              </h3>
              <p className="text-slate-400 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg px-2">or click the button below to browse</p>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 sm:px-8 sm:py-4 lg:px-10 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base lg:text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105"
              >
                Choose Image
              </button>
              
              <p className="text-slate-500 mt-4 sm:mt-6 text-xs sm:text-sm">Supports: JPG, PNG, WEBP</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Original Image
                  </h3>
                  <div className="relative rounded-lg sm:rounded-xl overflow-hidden bg-slate-800/50 border border-white/10">
                    <img
                      src={originalImage}
                      alt="Original"
                      className="w-full h-48 sm:h-64 lg:h-80 object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${processedImage ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                    Background Removed
                  </h3>
                  <div className="relative rounded-lg sm:rounded-xl overflow-hidden bg-slate-800/50 border border-white/10">
                    {processedImage ? (
                      <>
                        <div className="absolute inset-0" style={{
                          backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                          backgroundSize: '20px 20px',
                          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                        }}></div>
                        <img
                          src={processedImage}
                          alt="Processed"
                          className="relative w-full h-48 sm:h-64 lg:h-80 object-contain"
                        />
                        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-green-500 text-white px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                          Ready
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-48 sm:h-64 lg:h-80 flex items-center justify-center">
                        {isProcessing ? (
                          <div className="text-center px-4">
                            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400 animate-spin mx-auto mb-2 sm:mb-3" />
                            <p className="text-slate-400 text-sm sm:text-base">Processing image...</p>
                          </div>
                        ) : (
                          <p className="text-slate-500 text-sm sm:text-base px-4 text-center">Click "Remove Background" to process</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center pt-2 sm:pt-4">
                {!processedImage && !isProcessing && (
                  <button
                    onClick={removeBackground}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base lg:text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                    Remove Background
                  </button>
                )}
                
                {processedImage && (
                  <button
                    onClick={downloadImage}
                    className="bg-green-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base lg:text-lg hover:shadow-lg hover:shadow-green-500/50 transition-all hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    Download Image
                  </button>
                )}
                
                <button
                  onClick={reset}
                  className="bg-slate-700 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base lg:text-lg hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  Upload New
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackgroundRemover;