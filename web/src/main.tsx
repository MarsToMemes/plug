// Global styles first, so page styles can override them.
import './styles/fonts';
import './styles/base.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LangProvider } from './i18n';
import { initMedia } from './media/catalog';

initMedia().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <LangProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LangProvider>
    </StrictMode>
  );
});
