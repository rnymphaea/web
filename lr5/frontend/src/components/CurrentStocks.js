import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStocks } from '../store/stocksSlice';
import { setCurrentStocks } from '../store/simulationSlice';
import { updateStockPrice } from '../store/stocksSlice';
import io from 'socket.io-client';

const CurrentStocks = () => {
  const dispatch = useDispatch();
  const { items: stocks } = useSelector(state => state.stocks);
  const { currentStocks } = useSelector(state => state.simulation);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    dispatch(fetchStocks());
    
    // Initialize WebSocket connection for real-time updates
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

  // Объединяем данные из stocks и currentStocks
  const getStockWithCurrentPrice = (stock) => {
    const currentStock = currentStocks.find(cs => cs.id === stock.id);
    return {
      ...stock,
      currentPrice: currentStock?.currentPrice,
      currentDate: currentStock?.date
    };
  };

  const stocksWithPrices = stocks.map(getStockWithCurrentPrice);

  return (
    <div>
      <h1>Текущее состояние акций</h1>
      
      <div className="card">
        <h2>Акции в реальном времени</h2>
        {stocksWithPrices.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Символ</th>
                <th>Компания</th>
                <th>Текущая цена</th>
                <th>Дата</th>
                <th>Участвует в торгах</th>
                <th>Изменение</th>
              </tr>
            </thead>
            <tbody>
              {stocksWithPrices.map(stock => (
                <tr key={stock.id}>
                  <td><strong>{stock.symbol}</strong></td>
                  <td>{stock.name}</td>
                  <td>
                    {stock.currentPrice ? (
                      <strong>${stock.currentPrice.toFixed(2)}</strong>
                    ) : (
                      <span style={{ color: '#999' }}>Нет данных</span>
                    )}
                  </td>
                  <td>{stock.currentDate || 'Нет данных'}</td>
                  <td>
                    <span style={{ 
                      color: stock.isTrading ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}>
                      {stock.isTrading ? 'Да' : 'Нет'}
                    </span>
                  </td>
                  <td>
                    {stock.currentPrice && stock.historicalData?.length > 0 && (
                      <span style={{
                        color: stock.currentPrice >= stock.historicalData[0].open ? 'green' : 'red'
                      }}>
                        {stock.currentPrice >= stock.historicalData[0].open ? '↑' : '↓'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Загрузка данных об акциях...</p>
        )}
      </div>

      <div className="card">
        <h2>Статистика</h2>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <h3>Всего акций</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stocks.length}</p>
          </div>
          <div>
            <h3>В торгах</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'green' }}>
              {stocks.filter(s => s.isTrading).length}
            </p>
          </div>
          <div>
            <h3>Не в торгах</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'red' }}>
              {stocks.filter(s => !s.isTrading).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentStocks;
