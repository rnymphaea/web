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
  const [simulationStatus, setSimulationStatus] = useState('loading'); // loading, running, stopped

  useEffect(() => {
    // Загружаем настройки сразу при монтировании компонента
    dispatch(fetchSettings()).then((action) => {
      if (action.payload) {
        setLocalSettings(action.payload);
        setSimulationStatus(action.payload.isRunning ? 'running' : 'stopped');
      }
    });
    
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('stockUpdate', (data) => {
      dispatch(setCurrentStocks(data));
      data.forEach(stock => {
        dispatch(updateStockPrice({ id: stock.id, currentPrice: stock.currentPrice }));
      });
    });

    // Слушаем события от сервера для обновления статуса
    newSocket.on('simulationStarted', () => {
      setSimulationStatus('running');
      // Обновляем настройки чтобы получить актуальные данные
      dispatch(fetchSettings());
    });

    newSocket.on('simulationStopped', () => {
      setSimulationStatus('stopped');
      // Обновляем настройки чтобы получить актуальные данные
      dispatch(fetchSettings());
    });

    return () => newSocket.close();
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
      // Обновляем статус симуляции из настроек
      setSimulationStatus(settings.isRunning ? 'running' : 'stopped');
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
    dispatch(updateSettings(settingsToUpdate)).then(() => {
      alert('Настройки сохранены!');
    });
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

    // Устанавливаем статус "загрузка" для лучшего UX
    setSimulationStatus('loading');

    // Сохраняем настройки с правильной датой
    const settingsToUpdate = {
      ...localSettings,
      startDate: startDateForBackend
    };
    
    dispatch(updateSettings(settingsToUpdate)).then(() => {
      // Запускаем симуляцию после сохранения настроек
      dispatch(startSimulation()).then((action) => {
        if (action.payload && action.payload.success) {
          setSimulationStatus('running');
          // Обновляем настройки чтобы получить актуальные данные
          dispatch(fetchSettings());
        } else {
          setSimulationStatus('stopped');
        }
      }).catch(() => {
        setSimulationStatus('stopped');
      });
    });
  };

  const handleStopSimulation = () => {
    // Устанавливаем статус "загрузка" для лучшего UX
    setSimulationStatus('loading');
    
    dispatch(stopSimulation()).then((action) => {
      if (action.payload && action.payload.success) {
        setSimulationStatus('stopped');
        // Обновляем настройки чтобы получить актуальные данные
        dispatch(fetchSettings());
      }
    }).catch(() => {
      setSimulationStatus('running');
    });
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

  // Функция для получения текста статуса
  const getStatusText = () => {
    switch (simulationStatus) {
      case 'loading':
        return 'Загрузка...';
      case 'running':
        return 'Симуляция активна';
      case 'stopped':
        return 'Симуляция остановлена';
      default:
        return 'Статус неизвестен';
    }
  };

  // Функция для получения цвета статуса
  const getStatusColor = () => {
    switch (simulationStatus) {
      case 'loading':
        return { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' };
      case 'running':
        return { bg: '#d4edda', border: '#c3e6cb', text: '#155724' };
      case 'stopped':
        return { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' };
      default:
        return { bg: '#e2e3e5', border: '#d6d8db', text: '#383d41' };
    }
  };

  const statusColors = getStatusColor();

  if (!settings && simulationStatus === 'loading') {
    return (
      <div>
        <h1>Настройки биржи</h1>
        <div className="card">
          <p>Загрузка настроек...</p>
        </div>
      </div>
    );
  }

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
          <button 
            type="submit"
            disabled={simulationStatus === 'loading'}
          >
            {simulationStatus === 'loading' ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </form>
      </div>

      {/* Блок управления симуляцией - оставляем на прежнем месте */}
      <div className="card">
        <h2>Управление симуляцией</h2>
        
        {/* Статус симуляции - теперь загружается сразу */}
        <div style={{ 
          padding: '1rem', 
          backgroundColor: statusColors.bg,
          color: statusColors.text,
          borderRadius: '4px',
          border: `1px solid ${statusColors.border}`,
          marginBottom: '1rem',
          fontWeight: 'bold',
          fontSize: '1.1rem'
        }}>
          <strong>Статус: </strong>
          {getStatusText()}
          {simulationStatus === 'running' && currentStocks[0] && (
            <span> | Текущая дата: {currentStocks[0].date}</span>
          )}
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={handleStartSimulation} 
            disabled={simulationStatus === 'running' || simulationStatus === 'loading'}
            style={{ 
              backgroundColor: (simulationStatus === 'running' || simulationStatus === 'loading') ? '#ccc' : '#28a745',
              marginRight: '1rem'
            }}
          >
            {simulationStatus === 'loading' ? 'Запуск...' : 
             simulationStatus === 'running' ? 'Симуляция запущена' : 'Начало торгов'}
          </button>
          <button 
            onClick={handleStopSimulation} 
            disabled={simulationStatus !== 'running' || simulationStatus === 'loading'}
            style={{ 
              backgroundColor: (simulationStatus !== 'running' || simulationStatus === 'loading') ? '#ccc' : '#dc3545' 
            }}
          >
            {simulationStatus === 'loading' ? 'Остановка...' : 'Остановить торги'}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Текущие данные торгов</h2>
        {currentStocks.length > 0 ? (
          <div>
            <p><strong>Текущая дата: </strong>{currentStocks[0]?.date || 'Нет данных'}</p>
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
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
          </div>
        ) : (
          <p>Нет данных о текущих торгах. Запустите симуляцию для начала торгов.</p>
        )}
      </div>
    </div>
  );
};

export default Settings;
