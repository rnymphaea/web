import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Brokers from './components/Brokers';
import Stocks from './components/Stocks';
import Settings from './components/Settings';

function App() {
  return (
    <Router>
      <div>
        <nav>
          <div className="container">
            <ul>
              <li><Link to="/brokers">Брокеры</Link></li>
              <li><Link to="/stocks">Акции</Link></li>
              <li><Link to="/settings">Настройки биржи</Link></li>
            </ul>
          </div>
        </nav>
        
        <div className="container">
          <Routes>
            <Route path="/brokers" element={<Brokers />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={<Brokers />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
