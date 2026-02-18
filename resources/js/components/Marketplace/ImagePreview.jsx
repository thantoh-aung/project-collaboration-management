import { useState } from 'react';
import { X } from 'lucide-react';

export default function ImagePreview({ src, fileName }) {
    const [showModal, setShowModal] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleImageClick = () => {
        setShowModal(true);
    };

    const handleImageLoad = () => {
        setImageLoaded(true);
        setImageError(false);
    };

    const handleImageError = () => {
        setImageError(true);
        setImageLoaded(false);
    };

    return (
        <>
            <div className="relative inline-block group cursor-pointer" onClick={handleImageClick}>
                {!imageLoaded && !imageError && (
                    <div className="w-[280px] h-[180px] bg-gray-100 rounded-xl flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                )}
                
                {imageError ? (
                    <div className="w-[280px] h-[180px] bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                        <div className="text-center p-4">
                            <div className="text-gray-400 text-sm">Failed to load</div>
                            <div className="text-gray-500 text-xs mt-1">{fileName}</div>
                        </div>
                    </div>
                ) : (
                    <img
                        src={src}
                        alt={fileName}
                        className={`max-w-[280px] w-full h-auto max-h-[300px] rounded-xl object-cover transition-opacity duration-200 ${
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                        } group-hover:opacity-90`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                    />
                )}
                
                {/* Hover overlay */}
                {imageLoaded && (
                    <div className="absolute inset-0 bg-black/25 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <div className="text-white text-center">
                            <div className="text-xs font-medium">Click to view</div>
                            <div className="text-xs opacity-75 mt-1">{fileName}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for full-size view */}
            {showModal && (
                <div 
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div 
                        className="relative max-w-full max-h-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={src}
                            alt={fileName}
                            className="max-w-full max-h-full rounded-lg"
                        />
                        
                        {/* Close button */}
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        
                    </div>
                </div>
            )}
        </>
    );
}
