import { useState, useEffect, useContext } from 'react';
import { Trash2, Download, Clock, Loader2, X, Maximize2, Check } from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

interface Image {
  _id: string;
  processedImageUrl: string;
  fileName: string;
  createdAt: string;
  fileSize?: number;
}

const ImageHistory = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('transparent');

  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const appContext = useContext(AppContext);

  if (!appContext) throw new Error("AppContext not found");
  const { backendUrl } = appContext;

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

  useEffect(() => {
    if (isSignedIn) {
      loadHistory();
    }
  }, [isSignedIn]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const url = `${backendUrl.replace(/\/$/, '')}/api/image/history`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setImages(data.images);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      setDeleting(imageId);
      const token = await getToken();

      const url = `${backendUrl.replace(/\/$/, '')}/api/image/history/${imageId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setImages(images.filter(img => img._id !== imageId));
        toast.success('Image deleted successfully');
        setSelectedImage(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    } finally {
      setDeleting(null);
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

  const downloadImage = async (url: string, fileName: string) => {
    try {
      let downloadUrl = url;
      
      // Apply background color if not transparent
      if (backgroundColor !== 'transparent') {
        downloadUrl = await applyBackgroundColor(url, backgroundColor);
      }
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'processed-image.png';
      link.target = '_blank';
      link.click();
      
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

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

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2">Sign in Required</h2>
          <p className="text-slate-400">Please sign in to view your image history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto mt-20">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Image History</h1>
          <p className="text-slate-400">View and manage your processed images</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <div className="bg-white/3 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
            <svg className="w-20 h-20 mx-auto mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-2xl font-semibold text-white mb-2">No images yet</h3>
            <p className="text-slate-400 mb-6">Start by removing backgrounds from your images</p>
            <Link 
              to="/bg-remover"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Remove Background
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div
                key={image._id}
                className="bg-white/3 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all group"
              >
                <div 
                  className="relative aspect-video bg-slate-800/50 cursor-pointer"
                  onClick={() => {
                    setSelectedImage(image);
                    setBackgroundColor('transparent');
                  }}
                >
                  <img
                    src={image.processedImageUrl}
                    alt={image.fileName}
                    className="w-full h-full object-contain p-4"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="p-4 bg-white/10 rounded-full">
                      <Maximize2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-white font-semibold mb-2 truncate" title={image.fileName}>
                    {image.fileName}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(image.createdAt)}</span>
                      </div>
                      {image.fileSize && (
                        <div className="text-sm text-slate-500">
                          Size: {formatSize(image.fileSize)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(image.processedImageUrl, image.fileName);
                        }}
                        className="p-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteImage(image._id);
                        }}
                        disabled={deleting === image._id}
                        className="p-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deleting === image._id ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for full image view with color selector */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-6xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="relative">
                <div 
                  className="relative"
                  style={getPreviewBackground()}
                >
                  <img
                    src={selectedImage.processedImageUrl}
                    alt={selectedImage.fileName}
                    className="w-full h-auto max-h-[50vh] object-contain"
                  />
                </div>
                
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => downloadImage(selectedImage.processedImageUrl, selectedImage.fileName)}
                    className="p-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-lg"
                    title="Download"
                  >
                    <Download className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => deleteImage(selectedImage._id)}
                    disabled={deleting === selectedImage._id}
                    className="p-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg"
                    title="Delete"
                  >
                    {deleting === selectedImage._id ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-6 bg-white/5 space-y-4">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">{selectedImage.fileName}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(selectedImage.createdAt)}</span>
                    </div>
                    {selectedImage.fileSize && (
                      <div>Size: {formatSize(selectedImage.fileSize)}</div>
                    )}
                  </div>
                </div>

                {/* Color Selector */}
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageHistory;