import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { AppRouter } from './routes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import i18n from './i18n';

const App = () => {

  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <AppRouter />
        </div>
        
        <ToastContainer 
          position="top-right" 
          autoClose={4000} 
          hideProgressBar={false} 
          newestOnTop 
          closeOnClick 
          pauseOnFocusLoss 
          draggable 
          pauseOnHover 
        />
      </BrowserRouter>
    </I18nextProvider>
  );
};

export default App;
