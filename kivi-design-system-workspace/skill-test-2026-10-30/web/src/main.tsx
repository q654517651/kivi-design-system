import { createRoot } from 'react-dom/client';
import '@kivi'; // 带上变量和基础样式
import './app.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<App />);
