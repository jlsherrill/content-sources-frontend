import { getBaseName } from '@redhat-cloud-services/insights-common-typescript';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import * as Redux from 'redux';

import App from './App';
import { createStore, resetStore } from './store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // TODO: Have a conversation about this
    },
  },
});

interface AppEntryProps {
  logger?: Redux.Middleware;
}

const AppEntry: React.FunctionComponent<AppEntryProps> = ({ logger }) => {
  const store = React.useMemo(() => {
    resetStore();
    if (logger) {
      return createStore(logger).store;
    } else {
      return createStore().store;
    }
  }, [logger]);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router basename={getBaseName(window.location.pathname)}>
          <App />
        </Router>
      </QueryClientProvider>
    </Provider>
  );
};

export default AppEntry;
