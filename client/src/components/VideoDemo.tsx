import React, { useState } from 'react';
import { Play } from 'lucide-react';
import SoftBackdrop from './SoftBackdrop';

export default function VideoDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = 'acNVDwnMKMM';

  return (
    <>
    <SoftBackdrop/>
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-5xl w-full space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-4 md:space-y-6 mt-24">
          <h1 className="text-2xl md:text-5xl font-bold text-white leading-tight">
           ✨ AI-Powered Background Remover
          </h1>
          <h2 className="text-xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            See How It Works
          </h2>
          <p className="text-l md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Watch how our intelligent AI removes backgrounds from your images instantly. 
            Upload any photo and get professional results in seconds - perfect for product photos, 
            portraits, and social media content.
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
        </div>

        {/* Video Container */}
        <div className="relative group">
          {/* Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition duration-500" />
          
          {/* Video Player */}
          <div className="relative bg-slate-800/50 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl">
            <div className="aspect-video rounded-xl overflow-hidden bg-slate-900">
              {isPlaying ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Demo Video"
                />
              ) : (
                <div 
                  onClick={() => setIsPlaying(true)}
                  className="w-full h-full bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center cursor-pointer group/play"
                  style={{
                    backgroundImage: `url(https://img.youtube.com/vi/${videoId}/maxresdefault.jpg)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-black/40 group-hover/play:bg-black/20 transition" />
                  <div className="relative bg-white/95 group-hover/play:bg-white text-purple-600 rounded-full p-8 transition-all duration-300 group-hover/play:scale-110 shadow-2xl">
                    <Play size={48} fill="currentColor" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Description */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Fast. Simple. Professional.
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            No complex editing software needed. Just upload, remove, and download - 
            all with pixel-perfect precision and clean edges.
          </p>
        </div>

      </div>
    </div>
    </>
  );
}