import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Results from "./Components/Results/Results";
import About from "./Components/About/About";
import Updates from "./Components/Updates/Updates";
import FaqComponent from './Components/Faq/Faq';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}/>
      <Route path="/results" element={<Results/>}/>
      <Route path="/about" element={<About />}/>
      <Route path="/faq" element={<FaqComponent />}/>
      <Route path="/updates" element={<Updates/>}/>
    </Routes>
  </BrowserRouter>
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
