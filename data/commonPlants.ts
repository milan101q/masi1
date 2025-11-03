// In a real app, these images would be hosted and served from a CDN or public folder.
// For this example, we are using Base64 data URLs to make the app self-contained.
import {
  monsteraImage,
  fiddleLeafFigImage,
  snakePlantImage,
  pothosImage,
  zzPlantImage,
  succulentImage,
  spiderPlantImage,
  peaceLilyImage,
  rubberPlantImage,
  aloeVeraImage
} from './plantImages';


export const commonPlants = [
  { name: 'Monstera Deliciosa', image: monsteraImage },
  { name: 'Fiddle Leaf Fig', image: fiddleLeafFigImage },
  { name: 'Snake Plant', image: snakePlantImage },
  { name: 'Pothos', image: pothosImage },
  { name: 'ZZ Plant', image: zzPlantImage },
  { name: 'Succulent', image: succulentImage },
  { name: 'Spider Plant', image: spiderPlantImage },
  { name: 'Peace Lily', image: peaceLilyImage },
  { name: 'Rubber Plant', image: rubberPlantImage },
  { name: 'Aloe Vera', image: aloeVeraImage },
];