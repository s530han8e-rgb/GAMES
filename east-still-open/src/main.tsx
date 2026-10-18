import React from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './App';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/600.css';
import '@fontsource/noto-serif-sc/400.css';
import '@fontsource/noto-serif-sc/600.css';
const routePath=location.pathname.slice(import.meta.env.BASE_URL.length-1);
const root=createRoot(document.getElementById('root')!);
if(import.meta.env.DEV && routePath.startsWith('/review/')){
 import('./review/Review').then(({Review})=>root.render(<Review/>));
}else if(routePath.startsWith('/review')){
 root.render(<main className="unavailable"><h1>页面不可用</h1><a href={import.meta.env.BASE_URL}>返回游戏</a></main>);
}else root.render(<App/>);

import "./ui/inference.css";

import "./ui/archive-fit.css";

import "./ui/record-card.css";

import "./ui/english-option.css";

import './ui/art-integration.css';

import './ui/oldhouse.css';

import './ui/dialogue-overlay.css';
import './ui/scene-objects.css';
