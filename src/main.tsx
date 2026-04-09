import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { FLAGS } from './mock/handlers';
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
        <div className="fixed bottom-0 right-2 flex gap-2 p-1 shadow-xl">
          <button
            onClick={() => {
              FLAGS.slowResponse = true;
            }}
            type="button"
            className="px-3 py-1 shadow hover:bg-gray-100 relative active:top-px"
          >
            Slow
          </button>
          <button
            onClick={() => {
              FLAGS.forceError = true;
            }}
            type="button"
            className="px-3 py-1 shadow hover:bg-gray-100 relative active:top-px"
          >
            Error
          </button>
        </div>
      </SnackbarProvider>
    </QueryClientProvider>
  </StrictMode>
);
