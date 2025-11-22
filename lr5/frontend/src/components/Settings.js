import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, updateSettings, startSimulation, stopSimulation } from '../store/simulationSlice';
import { setCurrentStocks } from '../store/simulationSlice';
import { updateStockPrice } from '../store/stocksSlice';
import io from 'socket.io-client';

const Settings = () => {
  const dispatch = useDispatch();
  const { settings, currentStocks } = useSelector(state => state.simulation);
  const { items: stocks } = useSelector(state => state.stocks);
  const [localSettings, setLocalSettings] = useState({});
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    dispatch(fetchSettings());
    
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('stockUpdate', (data) => {
      dispatch(setCurrentStocks(data));
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

  // Функция для преобразования даты в формат для input[type="date"]
  const formatDateForInput = (dateString) => {
    if (!dateString) {
      // Если даты нет, устанавливаем первую доступную дату из данных
      if (stocks.length > 0 && stocks[0].historicalData.length > 0) {
        const firstDate = stocks[0].historicalData[0].date;
        return convertToInputFormat(firstDate);
      }
      return new Date().toISOString().split('T')[0];
    }
    
    return convertToInputFormat(dateString);
  };

  // Конвертирует дату из "dd.mm.yyyy" в "yyyy-mm-dd"
  const convertToInputFormat = (dateString) => {
    if (dateString.includes('.')) {
      const parts = dateString.split('.');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    return dateString;
  };

  // Конвертирует дату из "yyyy-mm-dd" в "dd.mm.yyyy"
  const convertToDisplayFormat = (dateString) => {
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
    }
    return dateString;
  };

  const handleSettingsUpdate = (e) => {
    e.preventDefault();
    const settingsToUpdate = {
      ...localSettings,
      startDate: convertToDisplayFormat(localSettings.startDate)
    };
    dispatch(updateSettings(settingsToUpdate));
    alert('Настройки сохранены!');
  };

  const handleStartSimulation = () => {
    if (!localSettings.startDate) {
      alert('Пожалуйста, установите дату начала торгов');
      return;
    }

    // Преобразуем дату в правильный формат для бэкенда
    const startDateForBackend = convertToDisplayFormat(localSettings.startDate);
    
    // Проверяем, что дата существует в исторических данных
    const firstStock = stocks[0];
    if (firstStock && firstStock.historicalData) {
      const dateExists = firstStock.historicalData.some(
        data => data.date === startDateForBackend
      );
      
      if (!dateExists) {
        alert(`Дата ${startDateForBackend} не найдена в исторических данных. Доступные даты: ${firstStock.historicalData[0].date} - ${firstStock.historicalData[firstStock.historicalData.length - 1].date}`);
        return;
      }
    }

    // Сохраняем настройки с правильной датой
    const settingsToUpdate = {
      ...localSettings,
      startDate: startDateForBackend
    };
    
    dispatch(updateSettings(settingsToUpdate)).then(() => {
      // Запускаем симуляцию после сохранения настроек
      setTimeout(() => {
        dispatch(startSimulation());
      }, 100);
    });
  };

  const handleStopSimulation = () => {
    dispatch(stopSimulation());
  };

  const handleDateChange = (e) => {
    setLocalSettings({
      ...localSettings,
      startDate: e.target.value
    });
  };

  // Получаем доступные даты для подсказки
  const getAvailableDatesRange = () => {
    if (stocks.length === 0 || !stocks[0].historicalData.length) return '';
    
    const firstDate = stocks[0].historicalData[0].date;
    const lastDate = stocks[0].historicalData[stocks[0].historicalData.length - 1].date;
    return `Доступные даты: ${firstDate} - ${lastDate}`;
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
              value={formatDateForInput(localSettings.startDate)}
              onChange={handleDateChange}
              required
            />
            <small style={{ color: '#666', display: 'block', marginTop: '0.5rem' }}>
              {getAvailableDatesRange()}
            </small>
          </div>
          <div className="form-group">
            <label>Скорость смены дат (секунды):</label>
            <input
              type="number"
              value={localSettings.speed || 1}
              onChange={(e) => setLocalSettings({ ...localSettings, speed: Number(e.target.value) })}
              min="1"
              max="60"
              required
            />
            <small style={{ color: '#666' }}>
              Интервал между обновлениями цен (в секундах)
            </small>
          </div>
          <button type="submit">Сохранить настройки</button>
        </form>
      </div>

      <div className="card">
        <h2>Управление симуляцией</h2>
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={handleStartSimulation} 
            disabled={settings.isRunning}
            style={{ 
              backgroundColor: settings.isRunning ? '#ccc' : '#28a745',
              marginRight: '1rem'
            }}
          >
            {settings.isRunning ? 'Симуляция запущена' : 'Начало торгов'}
          </button>
          <button 
            onClick={handleStopSimulation} 
            disabled={!settings.isRunning}
            style={{ backgroundColor: !settings.isRunning ? '#ccc' : '#dc3545' }}
          >
            Остановить торги
          </button>
        </div>
        
        <div style={{ 
          padding: '1rem', 
          backgroundColor: settings.isRunning ? '#d4edda' : '#f8d7da',
          color: settings.isRunning ? '#155724' : '#721c24',
          borderRadius: '4px',
          border: `1px solid ${settings.isRunning ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          <strong>Статус: </strong>
          {settings.isRunning ? 'Симуляция активна' : 'Симуляция остановлена'}
          {settings.isRunning && currentStocks[0] && (
            <span> | Текущая дата: {currentStocks[0].date}</span>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Текущие данные торгов</h2>
        {currentStocks.length > 0 ? (
          <div>
            <p><strong>Текущая дата: </strong>{currentStocks[0]?.date || 'Нет данных'}</p>
            <table>
              <thead>
                <tr>
                  <th>Акция</th>
                  <th>Компания</th>
                  <th>Текущая цена</th>
                </tr>
              </thead>
              <tbody>
                {currentStocks.map(stock => (
                  <tr key={stock.id}>
                    <td><strong>{stock.symbol}</strong></td>
                    <td>{stock.name}</td>
                    <td>${stock.currentPrice?.toFixed(2) || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Нет данных о текущих торгах. Запустите симуляцию для начала торгов.</p>
        )}
      </div>
    </div>
  );
};

export default Settings;
