import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route} from 'react-router-dom';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClientInstance} from '../../src/lib/query-client';
import Layout from '../../src/components/Layout';
import ScrollToTop from '../../src/components/ScrollToTop';
import Home from '../../src/pages/Home';
import Tasks from '../../src/pages/Tasks';
import Projects from '../../src/pages/Projects';
import Capture from '../../src/pages/Capture';
import Settings from '../../src/pages/Settings';
import {PreferencesProvider} from '../../src/lib/mvp/PreferencesContext';
import '../../src/index.css';
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClientInstance}>
      <PreferencesProvider>
        <ScrollToTop/>
        <Routes>
          <Route element={<Layout/>}>
            <Route path="/" element={<Home/>}/>
            <Route path="/tasks" element={<Tasks/>}/>
            <Route path="/projects" element={<Projects/>}/>
            <Route path="/capture" element={<Capture/>}/>
            <Route path="/settings" element={<Settings/>}/>
          </Route>
        </Routes>
      </PreferencesProvider>
    </QueryClientProvider>
  </BrowserRouter>
);