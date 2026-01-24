import { useState, useRef, useContext } from 'react';
import { Upload, Download, Loader2, X, Check, Wand2 } from 'lucide-react';
import { useAuth, useUser, useClerk } from '@clerk/clerk-react';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

const BackgroundRemover = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('transparent');
  const [isGeneratingAIBg, setIsGeneratingAIBg] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { getToken } = useAuth();
  const { isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();
  const appContext = useContext(AppContext);
  
  console.log('Clerk User:', user);
  console.log('User ID:', user?.id);

  if (!appContext) throw new Error("AppContext not found");
  const { credit, loadCreditData, backendUrl } = appContext;

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      // Check file size
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File is too large (${fileSizeMB}MB). Maximum size allowed is 50MB. Please compress your image and try again.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string);
        setProcessedImage(null);
        setSelectedFile(file);
        setBackgroundColor('transparent');
        setShowAIPrompt(false);
        setAiPrompt('');
      };
      reader.readAsDataURL(file);
    } else {
      toast.error('Please select a valid image file (JPEG, PNG, or WEBP)');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
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

    if (!originalImage || !selectedFile) {
      toast.error('Please upload an image first');
      return;
    }

    if (credit < 1) {
      toast.error('Insufficient credits. Please purchase more credits.');
      return;
    }

    if (!user?.id) {
      toast.error('User authentication failed');
      return;
    }

    // Double check file size before sending
    const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
    console.log('File size:', fileSizeMB, 'MB');
    
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(`Your image is ${fileSizeMB}MB. Maximum allowed is 50MB. Please compress and try again.`);
      return;
    }

    setIsProcessing(true);

    try {
      const token = await getToken();

      // Create form data with the original file and clerkId
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('clerkId', user.id);

      const url = `${backendUrl.replace(/\/$/, '')}/api/image/remove-bg`;
      console.log('API URL:', url);
      console.log('Uploading file:', selectedFile.name, `(${fileSizeMB}MB)`);
      console.log('ClerkId:', user.id);

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
        setProcessedImage(data.data.processedImageUrl);
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

  const generateAIBackground = async () => {
    if (!isSignedIn) {
      toast.error('Please login to generate AI background');
      openSignIn({});
      return;
    }

    if (!processedImage || !selectedFile) {
      toast.error('Please remove background first');
      return;
    }

    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt for the AI background');
      return;
    }

    if (credit < 1) {
      toast.error('Insufficient credits. Please purchase more credits.');
      return;
    }

    if (!user?.id) {
      toast.error('User authentication failed');
      return;
    }

    setIsGeneratingAIBg(true);

    try {
      const token = await getToken();

      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('prompt', aiPrompt.trim());
      formData.append('clerkId', user.id);

      const url = `${backendUrl.replace(/\/$/, '')}/api/image/generate-bg`;
      console.log('Generating AI background with prompt:', aiPrompt);
      console.log('ClerkId:', user.id);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      console.log('AI Background Response:', data);

      if (data.success) {
        setProcessedImage(data.data.processedImageUrl);
        setBackgroundColor('transparent'); // Reset to show AI bg properly
        await loadCreditData();
        toast.success('AI background generated successfully!');
        setShowAIPrompt(false);
      } else {
        toast.error(data.message || 'Failed to generate AI background');
      }
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate AI background');
    } finally {
      setIsGeneratingAIBg(false);
    }
  };

  const applyBackgroundColor = (imageUrl: string, bgColor: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Fill background color (if not transparent)
        if (bgColor !== 'transparent') {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw the image on top
        ctx.drawImage(img, 0, 0);

        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => {
        resolve(imageUrl);
      };

      img.src = imageUrl;
    });
  };

  const downloadImage = async () => {
    if (!processedImage) return;
    
    try {
      let downloadUrl = processedImage;
      
      // Apply background color if not transparent
      if (backgroundColor !== 'transparent') {
        downloadUrl = await applyBackgroundColor(processedImage, backgroundColor);
      }
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `background-removed-${backgroundColor === 'transparent' ? 'transparent' : 'colored'}.png`;
      link.click();
      
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setIsProcessing(false);
    setSelectedFile(null);
    setBackgroundColor('transparent');
    setShowAIPrompt(false);
    setAiPrompt('');
    setIsGeneratingAIBg(false);
  };

  const colorPresets = [
    { name: 'Transparent', value: 'transparent' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Black', value: '#000000' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#A855F7' },
  ];

  const getPreviewBackground = () => {
    if (backgroundColor === 'transparent') {
      return {
        backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
      };
    }
    return { backgroundColor };
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
              
              <p className="text-slate-500 mt-4 sm:mt-6 text-xs sm:text-sm">Supports: JPG, PNG, WEBP (Max 50MB)</p>
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
                        <div className="absolute inset-0" style={getPreviewBackground()}></div>
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

              {processedImage && (
                <>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <h4 className="text-xs font-semibold text-white mb-2">Background Color</h4>
                    
                    {/* Color Presets */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {colorPresets.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setBackgroundColor(color.value)}
                          className={`relative w-8 h-8 rounded-md overflow-hidden transition-all hover:scale-110 ${
                            backgroundColor === color.value ? 'ring-2 ring-blue-500' : 'ring-1 ring-white/20'
                          }`}
                          title={color.name}
                        >
                          <div
                            className="w-full h-full"
                            style={
                              color.value === 'transparent'
                                ? {
                                    backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                                    backgroundSize: '8px 8px',
                                    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                                  }
                                : { backgroundColor: color.value }
                            }
                          />
                          {backgroundColor === color.value && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white drop-shadow-lg" />
                            </div>
                          )}
                        </button>
                      ))}
                      
                      {/* Custom Color Picker */}
                      <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/20">
                        <input
                          type="color"
                          value={backgroundColor === 'transparent' ? '#FFFFFF' : backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-8 h-8 rounded-md cursor-pointer border border-white/20"
                          title="Custom color"
                        />
                        <span className="text-[10px] font-mono text-slate-400">{backgroundColor === 'transparent' ? 'None' : backgroundColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Background Generator */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Wand2 className="w-5 h-5 text-purple-400" />
                      <h4 className="text-sm font-semibold text-white">AI Background Generator</h4>
                    </div>
                    
                    {!showAIPrompt ? (
                      <button
                        onClick={() => setShowAIPrompt(true)}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <Wand2 className="w-4 h-4" />
                        Generate AI Background
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <input
                            type="text"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="E.g., professional office, sunset beach, modern studio..."
                            className="w-full bg-white/10 text-white placeholder-slate-400 px-4 py-2.5 rounded-lg border border-white/20 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                            disabled={isGeneratingAIBg}
                          />
                          <p className="text-xs text-slate-400 mt-1.5">Describe the background you want to generate</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={generateAIBackground}
                            disabled={isGeneratingAIBg || !aiPrompt.trim()}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          >
                            {isGeneratingAIBg ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-4 h-4" />
                                Generate
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => {
                              setShowAIPrompt(false);
                              setAiPrompt('');
                            }}
                            disabled={isGeneratingAIBg}
                            className="px-4 py-2.5 rounded-lg font-medium text-sm bg-slate-700 text-white hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

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
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default BackgroundRemover;