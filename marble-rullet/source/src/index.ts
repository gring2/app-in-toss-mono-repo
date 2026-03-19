import './localization';
import { bootstrapApp } from './app';
import options from './options';
import { Roulette } from './roulette';

const roulette = new Roulette();
options.autoRecording = false;
options.useSkills = false;
bootstrapApp(roulette);

(window as any).roulette = roulette;
(window as any).options = options;
