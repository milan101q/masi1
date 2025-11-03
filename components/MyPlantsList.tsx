import React from 'react';
import { SavedPlant } from '../types';
import { useLanguage } from '../i18n';
import { BookOpenIcon, TrashIcon, LeafIcon } from './icons';

interface MyPlantsListProps {
  savedPlants: SavedPlant[];
  onViewPlant: (plant: SavedPlant) => void;
  onDeletePlant: (plantId: string) => void;
  onBack: () => void;
}

const MyPlantsList: React.FC<MyPlantsListProps> = ({ savedPlants, onViewPlant, onDeletePlant, onBack }) => {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-4xl mx-auto p-4 animate-fade-in">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 text-center mb-8">{t('savedPlantsTitle')}</h1>
      
      {savedPlants.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
          <p className="text-lg">{t('noSavedPlants')}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {savedPlants.sort((a,b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()).map((plant) => (
            <li key={plant.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between transition-transform transform hover:scale-105">
              <div className="flex items-center gap-4">
                {plant.image ? (
                    <img src={plant.image} alt={plant.name} className="w-16 h-16 object-cover rounded-md" />
                ) : (
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                        <LeafIcon className="w-8 h-8 text-gray-400" />
                    </div>
                )}
                <span className="text-lg font-medium text-gray-700 dark:text-gray-200">{plant.name}</span>
              </div>

              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => onViewPlant(plant)}
                  className="p-2 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  aria-label={t('viewDetails')}
                >
                  <BookOpenIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={() => onDeletePlant(plant.id)}
                  className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  aria-label={t('deletePlant')}
                >
                  <TrashIcon className="w-6 h-6" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="text-center mt-8">
        <button
          onClick={onBack}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full transition"
        >
          {t('backToId')}
        </button>
      </div>
    </div>
  );
};

export default MyPlantsList;