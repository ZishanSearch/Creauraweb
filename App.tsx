import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { generateStyledImage, analyzeImageStyle } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { DownloadIcon, LoaderIcon, EyeIcon, XIcon } from './components/Icons';

type LoadingStatus = 'idle' | 'analyzing' | 'generating';

const App: React.FC = () => {
  const [targetImage, setTargetImage] = useState<File | null>(null);
  const [userImage, setUserImage] = useState<File | null>(null);
  const [targetPreview, setTargetPreview] = useState<string | null>(null);
  const [userPreview, setUserPreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [targetStyleDescription, setTargetStyleDescription] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const handleTargetImageUpload = useCallback(async (file: File) => {
    setTargetImage(file);
    setTargetPreview(URL.createObjectURL(file));
    setError(null);
    setTargetStyleDescription(null); 
    setGeneratedImage(null); 
    setLoadingStatus('analyzing');

    try {
      const targetImageBase64 = await fileToBase64(file);
      const description = await analyzeImageStyle(targetImageBase64, file.type);
      setTargetStyleDescription(description);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to analyze target image.');
    } finally {
      setLoadingStatus('idle');
    }
  }, []);

  const handleUserImageUpload = useCallback((file: File) => {
    setUserImage(file);
    setUserPreview(URL.createObjectURL(file));
    setGeneratedImage(null); 
  }, []);

  const handleGenerate = async () => {
    if (!targetStyleDescription || !userImage) {
      setError('Please upload both images and wait for the style analysis to complete.');
      return;
    }
    setError(null);
    setLoadingStatus('generating');
    setGeneratedImage(null);

    try {
      const userImageBase64 = await fileToBase64(userImage);

      const resultBase64 = await generateStyledImage(
        userImageBase64,
        userImage.type,
        targetStyleDescription
      );
      
      if(resultBase64){
        const imageUrl = `data:image/png;base64,${resultBase64}`;
        setGeneratedImage(imageUrl);
        setHistory(prevHistory => [imageUrl, ...prevHistory]);
      } else {
        throw new Error('The API did not return an image. Please try again.');
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoadingStatus('idle');
    }
  };
  
  const handleDownload = (imageUrl: string | null) => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `creaura-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getButtonMessage = () => {
    switch (loadingStatus) {
      case 'analyzing':
        return 'Analyzing Style...';
      case 'generating':
        return 'Generating Image...';
      default:
        return 'Generate Image';
    }
  };


  return (
    <div className="bg-slate-50 min-h-screen font-sans text-gray-800 flex flex-col items-center justify-center p-4 sm:p-6">
      <main className="w-full max-w-4xl mx-auto flex flex-col items-center text-center">
        <header className="mb-8 flex flex-col items-center">
          <h1 className="text-6xl sm:text-7xl font-bold tracking-tight text-gray-900">
            Creaura
          </h1>
          <a
            href="https://www.instagram.com/itss_zishan_001/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-sm text-gray-500 hover:text-gray-800 transition-colors duration-300"
          >
            created by Zishan
          </a>
        </header>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="relative">
             <ImageUploader label="Target Image" onImageUpload={handleTargetImageUpload} preview={targetPreview} />
             {loadingStatus === 'analyzing' && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl transition-opacity duration-300">
                 <LoaderIcon className="w-8 h-8 text-gray-600 animate-spin"/>
                 <p className="mt-2 text-sm font-medium text-gray-600">Analyzing style...</p>
              </div>
            )}
          </div>
          <ImageUploader label="Your Image" onImageUpload={handleUserImageUpload} preview={userPreview} />
        </div>
        
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={!targetStyleDescription || !userImage || loadingStatus !== 'idle'}
          className="w-full max-w-sm h-14 px-6 bg-gray-900 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          {loadingStatus !== 'idle' ? (
            <>
              <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              {getButtonMessage()}
            </>
          ) : (
            'Generate Image'
          )}
        </button>

        <section className="mt-12 w-full flex justify-center">
          {loadingStatus === 'generating' && (
             <div className="w-full max-w-lg aspect-square bg-gray-200 rounded-xl shadow-inner flex flex-col items-center justify-center animate-pulse">
                <LoaderIcon className="w-12 h-12 text-gray-400 animate-spin"/>
                <p className="mt-4 text-gray-500">Generating your masterpiece...</p>
             </div>
          )}

          {generatedImage && (
            <div className="w-full max-w-lg animate-fade-in">
              <img
                src={generatedImage}
                alt="Generated by Creaura"
                className="rounded-xl shadow-2xl object-contain w-full h-auto"
              />
               <button
                  onClick={() => handleDownload(generatedImage)}
                  className="mt-6 inline-flex items-center justify-center h-12 px-6 bg-white text-gray-800 font-semibold rounded-lg shadow-md border border-gray-200 hover:bg-gray-100 transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Download Image
                </button>
            </div>
          )}
        </section>

        {history.length > 0 && (
          <section className="mt-16 w-full max-w-4xl border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Creations</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {history.map((imgSrc, index) => (
                <div key={index} className="group relative aspect-square rounded-lg overflow-hidden shadow-md">
                  <img src={imgSrc} alt={`Generated image ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                    <button onClick={() => setViewingImage(imgSrc)} className="text-white p-2 rounded-full bg-black/30 hover:bg-black/60 transition-colors" aria-label="View Image">
                      <EyeIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => handleDownload(imgSrc)} className="text-white p-2 rounded-full bg-black/30 hover:bg-black/60 transition-colors" aria-label="Download Image">
                      <DownloadIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setViewingImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <button 
            onClick={() => setViewingImage(null)} 
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            aria-label="Close image viewer"
          >
            <XIcon className="w-8 h-8" />
          </button>
          <img 
            src={viewingImage} 
            alt="Full size generated" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
          />
        </div>
      )}

    </div>
  );
};

export default App;