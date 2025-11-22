import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, updateSettings, startSimulation, stopSimulation } from '../store/simulationSlice';
import { setCurrentStocks } from '../store/simulationSlice';
import { updateStockPrice } from '../store/stocksSlice';
import io from 'socket.io-client';

const Settings = () => {
  const dispatch = useDispatch();
  const { settings, currentStocks } = useSelector(state => state.simulation);
  const [localSettings, setLocalSettings] = useState({});
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    dispatch(fetchSettings());
    
    // Initialize WebSocket connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('stockUpdate', (data) => {
      dispatch(setCurrentStocks(data));
      // Update stock prices in stocks slice as well
      data.forEach(stock => {
        dispatch(updateStockPrice({ id: stock.id, currentPrice: stock.currentPrice }));
      });
    });

    return () => newSocket.close();
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSettingsUpdate = (e) => {
    e.preventDefault();
    dispatch(updateSettings(localSettings));
  };

  const handleStartSimulation = () => {
    dispatch(startSimulation());
  };

  const handleStopSimulation = () => {
    dispatch(stopSimulation());
  };

  if (!settings) return <div className="card">Loading...</div>;

  return (
    <div>
      <h1>Настройки биржи</h1>
      
      <div className="card">
        <h2>Параметры симуляции</h2>
        <form onSubmit={handleSettingsUpdate}>
          <div className="form-group">
            <label>Дата начала торгов:</label>
            <input
              type="date"
              value={localSettings.startDate ? new Date(localSettings.startDate).toISOString().split('T')[0] : ''}
              onChange={(e) => setLocalSettings({ ...localSettings, startDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Скорость смены дат (секунды):</label>
            <input
              type="number"
              value={localSettings.speed || 1}
              onChange={(e) => setLocalSettings({ ...localSettings, speed: Number(e.target.value) })}
              min="1"
              max="60"
            />
          </div>
          <button type="submit">Сохранить настройки</button>
        </form>
      </div>

      <div className="card">
        <h2>Управление симуляцией</h2>
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={handleStartSimulation} disabled={settings.isRunning}>
            Начало торгов
          </button>
          <button onClick={handleStopSimulation} disabled={!settings.isRunning}>
            Остановить торги
          </button>
        </div>
        
        {settings.isRunning && (
          <div style={{ color: 'green', fontWeight: 'bold' }}>
            Симуляция запущена
          </div>
        )}
      </div>

      <div className="card">
        <h2>Текущие данные торгов</h2>
        {currentStocks.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Акция</th>
                <th>Компания</th>
                <th>Текущая цена</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {currentStocks.map(stock => (
                <tr key={stock.id}>
                  <td>{stock.symbol}</td>
                  <td>{stock.name}</td>
                  <td>${stock.currentPrice?.toFixed(2) || 'N/A'}</td>
                  <td>{stock.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Нет данных о текущих торгах</p>
        )}
      </div>
    </div>
  );
};

export default Settings;
