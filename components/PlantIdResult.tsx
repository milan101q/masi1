import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../i18n';
import { SparklesIcon, SunIcon, WaterDropIcon, LeafIcon, ThermometerIcon, PlusCircleIcon, BookmarkIcon } from './icons';
import { SavedPlant } from '../types';

interface PlantIdResultProps {
  text: string;
  image: string | null;
  isOnline: boolean;
  onStartChat: () => void;
  isSavedView?: boolean;
  onSavePlant?: (plantName: string, plantDetails: string, image: string) => void;
  savedPlants?: SavedPlant[];
  plant?: SavedPlant;
  onToggleTask?: (taskTitle: string) => void;
  onBackToPlants?: () => void;
}

interface ParsedInfo {
  commonName?: string;
  scientificName?: string;
  introduction?: string;
  careInstructions?: { title: string; description: string }[];
  commonProblems?: string;
  [key: string]: any; // Allow other keys
}

// Helper to check against both English and Farsi headers, case-insensitively
const isHeader = (header: string, enHeader: string, faHeader: string): boolean => {
  const lowerHeader = header.trim().toLowerCase();
  return lowerHeader === enHeader.trim().toLowerCase() || lowerHeader === faHeader.trim().toLowerCase();
};


const PlantIdResult: React.FC<PlantIdResultProps> = ({ 
  text, 
  onStartChat, 
  onSavePlant, 
  savedPlants, 
  isOnline, 
  image,
  isSavedView = false,
  plant,
  onToggleTask,
  onBackToPlants
}) => {
  const { t } = useLanguage();

  const parsedInfo: ParsedInfo = useMemo(() => {
    const info: ParsedInfo = {};
    
    // Hardcoded headers for robust, bilingual parsing
    const headers = {
      en: { name: 'Plant Name', intro: 'Introduction', care: 'Care Instructions', problems: 'Common Problems' },
      fa: { name: 'نام گیاه', intro: 'معرفی', care: 'دستورالعمل‌های مراقبت', problems: 'مشکلات رایج' }
    };
    
    const parts = text.split(/\n\s*(?=\*\*)/).filter(p => p.trim());

    parts.forEach(part => {
      const match = part.match(/^\*\*(.*?):\*\*\s*([\s\S]*)/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        
        if (isHeader(key, headers.en.name, headers.fa.name)) {
          const commonNameMatch = value.match(/\*\*\s*(?:Common Name|نام رایج)\s*:\*\*\s*(.*)/i);
          const scientificNameMatch = value.match(/\*\*\s*(?:Scientific Name|نام علمی)\s*:\*\*\s*(.*)/i);
          
          info.commonName = commonNameMatch ? commonNameMatch[1].trim().replace(/\*$/, '').trim() : value.split('\n')[0].trim();
          info.scientificName = scientificNameMatch ? scientificNameMatch[1].trim().replace(/\*$/, '').trim() : '';

        }
        else if (isHeader(key, headers.en.intro, headers.fa.intro)) info.introduction = value;
        else if (isHeader(key, headers.en.problems, headers.fa.problems)) info.commonProblems = value;
        else if (isHeader(key, headers.en.care, headers.fa.care)) {
            const careItems = value.split(/\n\s*(?=\*)/).map(item => item.trim()).filter(Boolean);
            info.careInstructions = careItems.map(item => {
                const cleanItem = item.replace(/^\*/, '').trim();
                const instructionMatch = cleanItem.match(/^\*\*(.*?):\*\*\s*([\s\S]*)/);
                if (instructionMatch) {
                    return { title: instructionMatch[1].trim(), description: instructionMatch[2].trim() };
                }
                return null;
            }).filter((item): item is { title: string; description: string } => item !== null);
        }
      }
    });

    return info;
  }, [text]);

  const getCareIcon = (title: string) => {
    const careHeaders = {
        en: { light: 'Light', watering: 'Watering', soil: 'Soil', temp: 'Temperature & Humidity', fertilizing: 'Fertilizing' },
        fa: { light: 'نور', watering: 'آبیاری', soil: 'خاک', temp: 'دما و رطوبت', fertilizing: 'کوددهی' }
    };
    const classNames = "w-8 h-8 text-green-500";
    if (isHeader(title, careHeaders.en.light, careHeaders.fa.light)) return <SunIcon className={classNames} />;
    if (isHeader(title, careHeaders.en.watering, careHeaders.fa.watering)) return <WaterDropIcon className={classNames} />;
    if (isHeader(title, careHeaders.en.soil, careHeaders.fa.soil)) return <LeafIcon className={classNames} />;
    if (isHeader(title, careHeaders.en.temp, careHeaders.fa.temp)) return <ThermometerIcon className={classNames} />;
    if (isHeader(title, careHeaders.en.fertilizing, careHeaders.fa.fertilizing)) return <PlusCircleIcon className={classNames} />;
    return null;
  };
  
  const isSaved = useMemo(() => {
    if (!savedPlants) return false;
    return savedPlants.some(p => p.details === text);
  }, [savedPlants, text]);

  const totalTasks = parsedInfo.careInstructions?.length || 0;
  const completedTasksCount = totalTasks > 0 ? Object.values(plant?.completedTasks || {}).filter(Boolean).length : 0;
  const progressPercentage = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 w-full max-w-4xl animate-fade-in">
      {parsedInfo.commonName && (
        <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">
                {parsedInfo.commonName}
            </h1>
            {parsedInfo.scientificName && (
                <p className="text-lg text-gray-500 dark:text-gray-400 italic mt-1">
                    {parsedInfo.scientificName}
                </p>
            )}
        </div>
      )}
      
      {parsedInfo.introduction && (
        <div className="prose dark:prose-invert max-w-none text-lg text-gray-600 dark:text-gray-300 mb-8 text-center">
            <ReactMarkdown>{parsedInfo.introduction}</ReactMarkdown>
        </div>
      )}

      {isSavedView && plant && parsedInfo.careInstructions && totalTasks > 0 && (
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-3">{t('careProgress')}</h2>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 mb-2">
                  <div className="bg-green-500 h-4 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 text-right mb-4">
                  {t('tasksCompleted', { count: completedTasksCount, total: totalTasks })}
              </p>
              <ul className="space-y-2">
                  {parsedInfo.careInstructions.map((item, index) => {
                      const isCompleted = plant?.completedTasks?.[item.title] || false;
                      return (
                          <li key={index} onClick={() => onToggleTask?.(item.title)} className="flex items-center p-3 rounded-lg cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900 shadow-sm transition">
                              <div className="flex-shrink-0">
                                  {isCompleted ? <LeafIcon className="w-6 h-6 text-green-500" /> : <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-500 rounded-full"></div>}
                              </div>
                              <span className={`mx-3 text-gray-700 dark:text-gray-200 ${isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>{item.title}</span>
                          </li>
                      );
                  })}
              </ul>
          </div>
      )}

      {parsedInfo.careInstructions && parsedInfo.careInstructions.length > 0 && (
          <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('care')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {parsedInfo.careInstructions.map((item, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex items-start space-x-4 rtl:space-x-reverse">
                          <div className="flex-shrink-0">{getCareIcon(item.title)}</div>
                          <div>
                              <h3 className="font-bold text-gray-800 dark:text-gray-100">{item.title}</h3>
                              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                                <ReactMarkdown>{item.description}</ReactMarkdown>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {parsedInfo.commonProblems && (
         <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('problems')}</h2>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                <ReactMarkdown>{parsedInfo.commonProblems}</ReactMarkdown>
            </div>
         </div>
      )}
      
      <div className="text-center mt-8 flex flex-wrap justify-center gap-4">
        {isSavedView ? (
           <>
              <button
                  onClick={onBackToPlants}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full inline-flex items-center transition-transform transform hover:scale-105"
              >
                  {t('backToMyPlants')}
              </button>
              <button
                  onClick={onStartChat}
                  disabled={!isOnline}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full inline-flex items-center transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                  <SparklesIcon className="w-6 h-6 mr-2" />
                  {t('chatWithBot')}
              </button>
           </>
        ) : (
          <>
            <button
                onClick={onStartChat}
                disabled={!isOnline}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full inline-flex items-center transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                <SparklesIcon className="w-6 h-6 mr-2" />
                {t('chatWithBot')}
            </button>
            <button
                onClick={() => {
                    if (parsedInfo.commonName && image && onSavePlant) {
                        onSavePlant(parsedInfo.commonName, text, image);
                    }
                }}
                disabled={isSaved || !parsedInfo.commonName || !image}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full inline-flex items-center transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                <BookmarkIcon className="w-6 h-6 mr-2" />
                {isSaved ? t('saved') : t('savePlant')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PlantIdResult;