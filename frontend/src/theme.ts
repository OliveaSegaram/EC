import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
       main: '#4b0081', //#ffffff
      light: '#000000',
      dark: '#f7f3ff',
    },
    secondary: {
      main: '#4580a3',
    },
    background: {
      default: '#edf2f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#344050',
      secondary: '#494848',
      disabled: '#c1c1c1',
      // hint: '#4b0081',
    },
    error: {
      main: '#fe6347',
    },
    warning: {
      main: '#fe6347',
    },
    info: {
      main: '#4b0081',
    },
  },
  typography: {
    fontFamily: 'Ubuntu, Arial, sans-serif',
    
  },
});

export default theme;
