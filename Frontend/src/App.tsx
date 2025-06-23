import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './routes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {

  return (
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
  );
};

export default App;
