import { Links, LiveReload, Meta, Scripts, ScrollRestoration, useCatch, useLocation } from '@remix-run/react';
import { Provider, useSelector } from 'react-redux';

// ✅ Import the whole module so we can support either named OR default export
import * as AuthContextModule from './context/AuthContext';

// project imports
import { store } from 'store';
import theme from 'themes';
import NavigationScroll from 'layout/NavigationScroll';
import MainLayout from 'layout/MainLayout';
import MinimalLayout from 'layout/MinimalLayout';
import Error from 'error';

// material-ui
import { CssBaseline, StyledEngineProvider } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

// assets
import globalStyles from 'styles/style.css';
import scrollBarStyle from 'react-perfect-scrollbar/dist/css/styles.css';
import favicon from '../public/favicon.svg';

// ✅ Support either:
// - export const AuthProvider = ...
// - export default AuthProvider
const AuthProvider = AuthContextModule.AuthProvider || AuthContextModule.default;

// export links
export const links = () => [
  {
    rel: 'icon',
    href: favicon,
    type: 'image/svg'
  },
  {
    rel: 'stylesheet',
    href: globalStyles
  },
  {
    rel: 'stylesheet',
    href: scrollBarStyle
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com'
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap'
  }
];

// export meta
export const meta = () => ({
  charset: 'utf-8',
  title: 'Complaint Management System Application',
  viewport: 'width=device-width,initial-scale=1',
  description:
    'Sam T Complaint Management System Application built using React, Material-UI, and Remix Run framework.'
});

// ================================|| APP ||================================ //

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <meta name="theme-color" content="#2296f3" />
        <meta
          name="keywords"
          content="Complaint Management System"
        />
        <meta name="author" content="CodedThemes" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="Complaint Management System" />
        <meta property="og:site_name" content="berrydashboard.com" />
        <meta property="article:publisher" content="Complaint Management System" />
        <meta property="og:title" content="Complaint Management System Application" />
        <meta
          property="og:description"
          content="Sam T Complaint Management System Application built using React, Material-UI, and Remix Run framework."
        />
        <meta property="og:image" content="Complaint Management System" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="Complaint Management System" />
        <meta property="twitter:title" content="Complaint Management System" />
        <meta
          property="twitter:description"
          content="Sam T Complaint Management System Application built using React, Material-UI, and Remix Run framework."
        />
        <meta property="twitter:image" content="Complaint Management System" />
        <meta name="twitter:creator" content="Complaint Management System" />
        <Links /> {typeof document === 'undefined' ? '__STYLES__' : null}
      </head>

      <body>
        <Provider store={store}>
          {/* ✅ Only render AuthProvider if it exists (prevents “undefined component” crash) */}
          {AuthProvider ? (
            <AuthProvider>
              <Free />
            </AuthProvider>
          ) : (
            <Free />
          )}

          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </Provider>
      </body>
    </html>
  );
}

export function CatchBoundary() {
  useCatch(); // kept for template compatibility

  return (
    <html>
      <head>
        <title>Oops!</title>
        <Meta />
        <Links />
        {typeof document === 'undefined' ? '__STYLES__' : null}
      </head>
      <body>
        <Provider store={store}>
          <Error />
          <Scripts />
        </Provider>
      </body>
    </html>
  );
}

export const Free = () => {
  const location = useLocation();
  const customization = useSelector((state) => state.customization);

  return (
    // ✅ FIX: correct prop name is injectFirst (capital F)
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme(customization)}>
        <CssBaseline />
        <NavigationScroll>
          {location.pathname.startsWith('/pages') ? <MinimalLayout /> : <MainLayout />}
        </NavigationScroll>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
