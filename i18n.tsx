import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

const translations = {
  en: {
    plantIdentifier: 'Plant Identifier',
    identifyPlant: 'Identify My Plant',
    myPlants: 'My Plants',
    chat: 'Chat',
    uploadFromGallery: 'Upload from Gallery',
    takePicture: 'Take a Picture',
    identifying: 'Identifying...',
    chatWithBot: 'Chat About This Plant',
    savePlant: 'Save Plant',
    saved: 'Saved',
    deletePlant: 'Delete Plant',
    confirmDelete: 'Are you sure you want to delete this plant?',
    cancel: 'Cancel',
    delete: 'Delete',
    plantDetails: 'Plant Details',
    startNewId: 'Start New Identification',
    typeMessage: 'Type your message...',
    viewDetails: 'View Details',
    errorIdentifying: 'An error occurred while identifying the plant. Please try again.',
    errorNoApiKey: 'API Key not configured. Please set up your Gemini API key.',
    errorGeneral: 'An unexpected error occurred. Please try again later.',
    errorCamera: 'Could not access the camera. Please check permissions.',
    errorMicrophone: 'Microphone access was denied. Please allow microphone access in your browser settings.',
    savedPlantsTitle: "My Saved Plants",
    noSavedPlants: "You haven't saved any plants yet.",
    backToId: "Back to Identification",
    capture: 'Capture',
    retake: 'Retake',
    usePhoto: 'Use Photo',
    back: 'Back',
    name: 'Plant Name',
    intro: 'Introduction',
    care: 'Care Instructions',
    problems: 'Common Problems',
    light: 'Light',
    watering: 'Watering',
    soil: 'Soil',
    temp: 'Temperature & Humidity',
    fertilizing: 'Fertilizing',
    botWelcome: "I'm ready to help you with your plant. What would you like to know?",
    startRecording: 'Start Voice Input',
    stopRecording: 'Stop Voice Input',
    cameraTip1: 'Center a clear leaf or flower in the frame.',
    cameraTip2: 'Ensure the image is sharp and in focus.',
    cameraTip3: 'Use good, even lighting.',
    cameraTip4: 'Avoid busy or cluttered backgrounds.',
    offlineMessage: 'You are currently offline. Functionality is limited.',
    offlineIdentificationDisabled: 'Plant identification is unavailable while offline. You can still view your saved plants.',
    offlineChatDisabled: 'Chat is disabled while offline.',
    careProgress: 'Care Progress',
    tasksCompleted: '{count} of {total} tasks completed',
    backToMyPlants: 'Back to My Plants',
  },
  fa: {
    plantIdentifier: 'شناسایی گیاه',
    identifyPlant: 'گیاه من را شناسایی کن',
    myPlants: 'گیاهان من',
    chat: 'چت',
    uploadFromGallery: 'آپلود از گالری',
    takePicture: 'گرفتن عکس',
    identifying: 'در حال شناسایی...',
    chatWithBot: 'درباره این گیاه چت کنید',
    savePlant: 'ذخیره گیاه',
    saved: 'ذخیره شد',
    deletePlant: 'حذف گیاه',
    confirmDelete: 'آیا از حذف این گیاه مطمئن هستید؟',
    cancel: 'انصراف',
    delete: 'حذف',
    plantDetails: 'جزئیات گیاه',
    startNewId: 'شروع شناسایی جدید',
    typeMessage: 'پیام خود را تایپ کنید...',
    viewDetails: 'مشاهده جزئیات',
    errorIdentifying: 'خطایی در هنگام شناسایی گیاه رخ داد. لطفاً دوباره امتحان کنید.',
    errorNoApiKey: 'کلید API پیکربندی نشده است. لطفاً کلید Gemini API خود را تنظیم کنید.',
    errorGeneral: 'یک خطای غیرمنتظره رخ داد. لطفاً بعداً دوباره امتحان کنید.',
    errorCamera: 'دسترسی به دوربین امکان‌پذیر نیست. لطفاً دسترسی‌ها را بررسی کنید.',
    errorMicrophone: 'دسترسی به میکروفون رد شد. لطفاً دسترسی به میکروفون را در تنظیمات مرورگر خود مجاز کنید.',
    savedPlantsTitle: "گیاهان ذخیره شده من",
    noSavedPlants: "شما هنوز هیچ گیاهی را ذخیره نکرده اید.",
    backToId: "بازگشت به شناسایی",
    capture: 'گرفتن عکس',
    retake: 'گرفتن مجدد',
    usePhoto: 'استفاده از عکس',
    back: 'بازگشت',
    name: 'نام گیاه',
    intro: 'معرفی',
    care: 'دستورالعمل‌های مراقبت',
    problems: 'مشکلات رایج',
    light: 'نور',
    watering: 'آبیاری',
    soil: 'خاک',
    temp: 'دما و رطوبت',
    fertilizing: 'کوددهی',
    botWelcome: "من آماده ام تا در مورد گیاهتان به شما کمک کنم. مایلید چه چیزی بدانید؟",
    startRecording: 'شروع ورودی صوتی',
    stopRecording: 'توقف ورودی صوتی',
    cameraTip1: 'یک برگ یا گل واضح را در کادر وسط قرار دهید.',
    cameraTip2: 'اطمینان حاصل کنید که تصویر واضح و در فوکوس باشد.',
    cameraTip3: 'از نور خوب و یکنواخت استفاده کنید.',
    cameraTip4: 'از پس‌زمینه‌های شلوغ و درهم پرهیز کنید.',
    offlineMessage: 'شما در حال حاضر آفلاین هستید. عملکرد برنامه محدود است.',
    offlineIdentificationDisabled: 'شناسایی گیاه در حالت آفلاین در دسترس نیست. همچنان می‌توانید گیاهان ذخیره شده خود را مشاهده کنید.',
    offlineChatDisabled: 'چت در حالت آفلاین غیرفعال است.',
    careProgress: 'روند مراقبت',
    tasksCompleted: '{count} از {total} وظیفه انجام شده است',
    backToMyPlants: 'بازگشت به گیاهان من',
  }
};

type Language = 'en' | 'fa';
type TranslationKeys = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKeys, vars?: Record<string, string | number>) => string;
  direction: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback((key: TranslationKeys, vars: Record<string, string | number> = {}): string => {
    let translation = translations[language][key] || translations.en[key];
    Object.keys(vars).forEach(varKey => {
        const regex = new RegExp(`{${varKey}}`, 'g');
        translation = translation.replace(regex, String(vars[varKey]));
    });
    return translation;
  }, [language]);
  
  const direction = language === 'fa' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, direction }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
