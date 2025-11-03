import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from './i18n';
import { UploadIcon, SendIcon, SparklesIcon, BookOpenIcon, CameraIcon, MicrophoneIcon } from './components/icons';
import { identifyPlant, createChat } from './services/geminiService';
import PlantIdResult from './components/PlantIdResult';
import MyPlantsList from './components/MyPlantsList';
import { SavedPlant, Message, AppView } from './types';
import type { Chat } from '@google/genai';

const App: React.FC = () => {
    const { t, language, setLanguage, direction } = useLanguage();
    const [view, setView] = useState<AppView>('identification');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [plantIdResult, setPlantIdResult] = useState<string>('');
    
    const [savedPlants, setSavedPlants] = useState<SavedPlant[]>([]);
    const [viewingPlant, setViewingPlant] = useState<SavedPlant | null>(null);
    
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const [cameraViewActive, setCameraViewActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [tipIndex, setTipIndex] = useState(0);

    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recognitionRef = useRef<any | null>(null);
    const chatInputBeforeRecording = useRef<string>('');
    
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Load saved plants from local storage on mount
    useEffect(() => {
        try {
            const storedPlants = localStorage.getItem('savedPlants');
            if (storedPlants) {
                setSavedPlants(JSON.parse(storedPlants).map((p: any) => ({...p, savedAt: new Date(p.savedAt)})));
            }
        } catch (e) {
            console.error("Failed to load saved plants from local storage", e);
        }
    }, []);

    // Save plants to local storage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('savedPlants', JSON.stringify(savedPlants));
        } catch (e) {
            console.error("Failed to save plants to local storage", e);
        }
    }, [savedPlants]);

    // Effect to handle camera stream
    useEffect(() => {
        if (cameraViewActive) {
            setCapturedImage(null);
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        streamRef.current = stream;
                    }
                })
                .catch(err => {
                    console.error("Error accessing camera: ", err);
                    setError(t('errorCamera'));
                    setCameraViewActive(false);
                });
        } else {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        }

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraViewActive, t]);
    
    // Effect to cycle through camera tips
    useEffect(() => {
        let tipInterval: number | undefined;
        if (cameraViewActive && !capturedImage) {
            const tips = [t('cameraTip1'), t('cameraTip2'), t('cameraTip3'), t('cameraTip4')];
            tipInterval = window.setInterval(() => {
                setTipIndex(prevIndex => (prevIndex + 1) % tips.length);
            }, 4000); // Change tip every 4 seconds
        }

        return () => {
            if (tipInterval) {
                clearInterval(tipInterval);
            }
        };
    }, [cameraViewActive, capturedImage, t]);


    // Effect to handle speech recognition setup
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition not supported by this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            let final_transcript = '';
            let interim_transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            setChatInput(chatInputBeforeRecording.current + final_transcript + interim_transcript);
        };
        
        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setError(`Speech recognition error: ${event.error}`);
            setIsRecording(false);
        };
        
        recognitionRef.current = recognition;

        return () => {
            if(recognitionRef.current) {
               recognitionRef.current.stop();
            }
        };
    }, []);

    const handleIdentify = async (file: File) => {
        if (!isOnline) {
            setError(t('offlineMessage'));
            return;
        }
        if (!process.env.API_KEY) {
            setError(t('errorNoApiKey'));
            return;
        }
        setIsLoading(true);
        setError(null);
        
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const base64Data = (reader.result as string).split(',')[1];
                const resultText = await identifyPlant(base64Data, file.type, language);
                setPlantIdResult(resultText);
                setView('result');
            } catch (e: any) {
                setError(e.message || t('errorIdentifying'));
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleImageUpload = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                handleIdentify(file);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            handleImageUpload(event.target.files[0]);
        }
    };

    const handleStartChat = (plantDetails: string) => {
        const chat = createChat(plantDetails, language);
        setChatSession(chat);
        setMessages([
            { id: '1', text: t('botWelcome'), sender: 'bot', timestamp: new Date() }
        ]);
        setView('chat');
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !chatSession || isBotTyping || !isOnline) return;
        
        const userMessage: Message = { id: Date.now().toString(), text: chatInput, sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        const currentChatInput = chatInput;
        setChatInput('');
        setIsBotTyping(true);
        setError(null);

        try {
            const responseStream = await chatSession.sendMessageStream({ message: currentChatInput });
            let botResponseText = '';
            for await (const chunk of responseStream) {
                botResponseText += chunk.text;
            }
            const botMessage: Message = { id: (Date.now() + 1).toString(), text: botResponseText, sender: 'bot', timestamp: new Date() };
            setMessages(prev => [...prev, botMessage]);
        } catch (e) {
            setError(t('errorGeneral'));
        } finally {
            setIsBotTyping(false);
        }
    };

    const handleToggleRecording = () => {
        const recognition = recognitionRef.current;
        if (!recognition || !isOnline) return;

        if (isRecording) {
            recognition.stop();
        } else {
             navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
                if (recognitionRef.current) {
                    chatInputBeforeRecording.current = chatInput;
                    recognitionRef.current.lang = language === 'fa' ? 'fa-IR' : 'en-US';
                    recognitionRef.current.start();
                }
            }).catch(err => {
                console.error("Microphone access denied:", err);
                setError(t('errorMicrophone'));
            });
        }
    };
    
    const handleSavePlant = (plantName: string, plantDetails: string, image: string) => {
        const newPlant: SavedPlant = {
            id: Date.now().toString(),
            name: plantName,
            details: plantDetails,
            savedAt: new Date(),
            image: image,
            completedTasks: {},
        };
        setSavedPlants(prev => [...prev, newPlant]);
    };

    const handleDeletePlant = (plantId: string) => {
        if (window.confirm(t('confirmDelete'))) {
            setSavedPlants(prev => prev.filter(p => p.id !== plantId));
            if (viewingPlant?.id === plantId) {
                setViewingPlant(null);
                setView('my_plants');
            }
        }
    };

    const handleViewSavedPlant = (plant: SavedPlant) => {
        setViewingPlant(plant);
        setView('result');
    };
    
    const handleToggleCareTask = (plantId: string, taskTitle: string) => {
        setSavedPlants(prevPlants => {
            const newPlants = prevPlants.map(p => {
                if (p.id === plantId) {
                    const updatedTasks = { ...(p.completedTasks || {}) };
                    updatedTasks[taskTitle] = !updatedTasks[taskTitle];
                    const updatedPlant = { ...p, completedTasks: updatedTasks };
                    // also update viewing plant if it's the one being changed
                    if(viewingPlant?.id === plantId) {
                        setViewingPlant(updatedPlant);
                    }
                    return updatedPlant;
                }
                return p;
            });
            return newPlants;
        });
    };

    const handleOpenCamera = () => setCameraViewActive(true);
    const handleCloseCamera = () => {
        setCameraViewActive(false);
        setCapturedImage(null);
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if(context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                setCapturedImage(canvas.toDataURL('image/jpeg'));
            }
        }
    };

    const handleRetake = () => setCapturedImage(null);

    const dataURLtoFile = (dataurl: string, filename: string): File => {
        const arr = dataurl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) throw new Error('Invalid data URL');
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, {type:mime});
    }

    const handleUsePhoto = () => {
        if (capturedImage) {
            const file = dataURLtoFile(capturedImage, `capture-${Date.now()}.jpg`);
            handleImageUpload(file);
            handleCloseCamera();
        }
    };

    const resetState = () => {
        setView('identification');
        setSelectedImage(null);
        setError(null);
        setPlantIdResult('');
        setMessages([]);
        setChatSession(null);
        setCameraViewActive(false);
        setViewingPlant(null);
        if (isRecording) {
            recognitionRef.current?.stop();
        }
    };
    
    const renderOfflineBanner = () => {
        if (isOnline) return null;
        return (
            <div className="bg-yellow-500 text-white text-center p-2 fixed top-0 left-0 right-0 z-50 text-sm">
                {t('offlineMessage')}
            </div>
        );
    };

    const renderHeader = () => (
        <header className="w-full p-4 flex justify-between items-center bg-white dark:bg-gray-800 shadow-md">
            <button onClick={resetState} className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400 flex items-center">
                <SparklesIcon className="w-8 h-8 mr-2" />
                {t('plantIdentifier')}
            </button>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => { setViewingPlant(null); setView('my_plants'); }}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
                    aria-label={t('myPlants')}
                >
                    <BookOpenIcon className="w-6 h-6" />
                    <span className="hidden md:inline">{t('myPlants')}</span>
                </button>
                <select 
                    value={language} 
                    onChange={e => setLanguage(e.target.value as 'en' | 'fa')}
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm"
                >
                    <option value="en">English</option>
                    <option value="fa">فارسی</option>
                </select>
            </div>
        </header>
    );

    const renderIdentificationView = () => (
        <div className="w-full max-w-2xl mx-auto text-center p-4">
            <h2 className="text-3xl font-semibold text-gray-700 dark:text-gray-200 mb-6">{t('identifyPlant')}</h2>
            
             {!isOnline ? (
                <div className="mt-8 p-4 bg-yellow-100 dark:bg-yellow-800 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200" role="alert">
                    <p className="font-bold">{t('offlineIdentificationDisabled')}</p>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 cursor-pointer hover:border-green-500 dark:hover:border-green-400 transition"
                    >
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <UploadIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                        <span className="text-gray-500 dark:text-gray-400">{t('uploadFromGallery')}</span>
                    </button>

                    <button
                        onClick={handleOpenCamera}
                        className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 cursor-pointer hover:border-green-500 dark:hover:border-green-400 transition"
                    >
                        <CameraIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                        <span className="text-gray-500 dark:text-gray-400">{t('takePicture')}</span>
                    </button>
                </div>
            )}
        </div>
    );
    
    const renderChatView = () => (
        <div className="flex flex-col h-[75vh] w-full max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-xl font-semibold text-center">{t('chat')}</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                        <div dir="auto" className={`rounded-lg px-4 py-2 max-w-sm ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isBotTyping && (
                    <div className="flex justify-start mb-4">
                        <div dir="auto" className="rounded-lg px-4 py-2 max-w-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            <span className="animate-pulse">...</span>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 border-t dark:border-gray-700 flex items-center gap-2">
                <input
                    dir="auto"
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={!isOnline ? t('offlineChatDisabled') : t('typeMessage')}
                    className="flex-1 p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 dark:disabled:bg-gray-800"
                    disabled={isBotTyping || !isOnline}
                />
                 <button
                    onClick={handleToggleRecording}
                    className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label={isRecording ? t('stopRecording') : t('startRecording')}
                    disabled={!isOnline}
                >
                    <MicrophoneIcon className="w-6 h-6"/>
                </button>
                <button
                    onClick={handleSendMessage}
                    disabled={isBotTyping || !chatInput.trim() || !isOnline}
                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10 flex-shrink-0"
                >
                    <SendIcon className="w-6 h-6"/>
                </button>
            </div>
        </div>
    );

    const renderCameraView = () => {
        const tips = [t('cameraTip1'), t('cameraTip2'), t('cameraTip3'), t('cameraTip4')];
        
        return (
            <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
                <div className="relative w-full flex-1">
                    {!capturedImage ? (
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                    ) : (
                        <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
                    )}
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    
                    {!capturedImage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none">
                            <div className="w-full aspect-square max-w-md border-2 border-dashed border-white border-opacity-75 rounded-lg"></div>
                            <p className="mt-4 text-white text-center text-shadow-lg transition-opacity duration-500">
                                {tips[tipIndex]}
                            </p>
                        </div>
                    )}
                </div>
                <div className="bg-black bg-opacity-50 p-4 flex justify-center items-center gap-8 w-full">
                    {!capturedImage ? (
                        <>
                            <button onClick={handleCloseCamera} className="text-white font-semibold py-2 px-4">
                                {t('back')}
                            </button>
                            <button onClick={handleCapture} className="w-20 h-20 bg-white rounded-full border-4 border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white" aria-label={t('capture')}></button>
                            <div className="w-24"></div> {/* Spacer */}
                        </>
                    ) : (
                        <>
                            <button onClick={handleRetake} className="bg-gray-200 text-black font-bold py-3 px-6 rounded-full">{t('retake')}</button>
                            <button onClick={handleUsePhoto} className="bg-green-500 text-white font-bold py-3 px-6 rounded-full">{t('usePhoto')}</button>
                        </>
                    )}
                </div>
            </div>
        );
    };


    const renderContent = () => {
        if (cameraViewActive) {
            return renderCameraView();
        }

        if (isLoading) {
            return (
                <div className="text-center p-8">
                    <SparklesIcon className="w-16 h-16 mx-auto text-green-500 animate-spin mb-4" />
                    <p className="text-xl text-gray-600 dark:text-gray-300">{t('identifying')}</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="text-center p-8 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg">
                    <p>{error}</p>
                    <button onClick={resetState} className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                        {t('startNewId')}
                    </button>
                </div>
            );
        }

        switch (view) {
            case 'identification':
                return renderIdentificationView();
            case 'result':
                return viewingPlant ? (
                    <PlantIdResult
                        text={viewingPlant.details}
                        image={viewingPlant.image}
                        isOnline={isOnline}
                        onStartChat={() => handleStartChat(viewingPlant.details)}
                        isSavedView={true}
                        plant={viewingPlant}
                        onToggleTask={(taskTitle: string) => handleToggleCareTask(viewingPlant.id, taskTitle)}
                        onBackToPlants={() => {
                            setViewingPlant(null);
                            setView('my_plants');
                        }}
                    />
                ) : (
                    <PlantIdResult
                        text={plantIdResult}
                        image={selectedImage}
                        isOnline={isOnline}
                        onStartChat={() => handleStartChat(plantIdResult)}
                        onSavePlant={handleSavePlant}
                        savedPlants={savedPlants}
                    />
                );
            case 'chat':
                return renderChatView();
            case 'my_plants':
                return <MyPlantsList 
                    savedPlants={savedPlants} 
                    onViewPlant={handleViewSavedPlant} 
                    onDeletePlant={handleDeletePlant}
                    onBack={resetState}
                />;
            default:
                return renderIdentificationView();
        }
    };
    
    return (
        <div dir={direction} className={`bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 font-sans ${!isOnline ? 'pt-8' : ''}`}>
            {renderOfflineBanner()}
            {renderHeader()}
            <main className="container mx-auto p-4 flex justify-center items-start">
                 {renderContent()}
            </main>
            { (view === 'result' || view === 'chat') && !viewingPlant && (
                <div className="text-center p-4">
                    <button onClick={resetState} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        {t('startNewId')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default App;
