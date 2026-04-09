import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { MovieApp } from './movie-app';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 } },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'top',
        }}
      >
        <MovieApp />
      </SnackbarProvider>
    </QueryClientProvider>
  </StrictMode>
);
