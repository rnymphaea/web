import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStocks, updateStock } from '../store/stocksSlice';
import StockChart from './StockChart';

const Stocks = () => {
  const dispatch = useDispatch();
  const { items: stocks, status } = useSelector(state => state.stocks);
  const [selectedStock, setSelectedStock] = useState(null);
  const [dataView, setDataView] = useState('chart'); // 'chart' или 'table'

  useEffect(() => {
    dispatch(fetchStocks());
  }, [dispatch]);

  const handleToggleTrading = (stock) => {
    dispatch(updateStock({ id: stock.id, isTrading: !stock.isTrading }));
  };

  if (status === 'loading') return <div className="card">Loading...</div>;

  return (
    <div>
      <h1>Управление акциями</h1>
      
      <div className="card">
        <h2>Список акций</h2>
        <table>
          <thead>
            <tr>
              <th>Обозначение</th>
              <th>Название компании</th>
              <th>Участвует в торгах</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map(stock => (
              <tr key={stock.id}>
                <td><strong>{stock.symbol}</strong></td>
                <td>{stock.name}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={stock.isTrading}
                    onChange={() => handleToggleTrading(stock)}
                  />
                </td>
                <td>
                  <button onClick={() => setSelectedStock(selectedStock?.id === stock.id ? null : stock)}>
                    {selectedStock?.id === stock.id ? 'Скрыть данные' : 'Показать данные'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedStock && (
        <div className="card">
          <h2>Исторические данные: {selectedStock.symbol} - {selectedStock.name}</h2>
          
          {/* Переключатель между графиком и таблицей */}
          <div style={{ marginBottom: '1rem' }}>
            <button 
              onClick={() => setDataView('chart')}
              style={{ 
                backgroundColor: dataView === 'chart' ? '#3498db' : '#f8f9fa',
                color: dataView === 'chart' ? 'white' : '#333',
                marginRight: '0.5rem'
              }}
            >
              График
            </button>
            <button 
              onClick={() => setDataView('table')}
              style={{ 
                backgroundColor: dataView === 'table' ? '#3498db' : '#f8f9fa',
                color: dataView === 'table' ? 'white' : '#333'
              }}
            >
              Таблица
            </button>
          </div>

          {dataView === 'chart' ? (
            <StockChart stock={selectedStock} />
          ) : (
            <HistoricalDataTable stock={selectedStock} />
          )}
        </div>
      )}
    </div>
  );
};

const HistoricalDataTable = ({ stock }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  if (!stock.historicalData || stock.historicalData.length === 0) {
    return <div>Нет исторических данных</div>;
  }

  const sortedData = [...stock.historicalData].sort((a, b) => {
    const dateA = new Date(a.date.split('.').reverse().join('-'));
    const dateB = new Date(b.date.split('.').reverse().join('-'));
    return dateB - dateA;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const getChangeFromPreviousDay = (currentIndex) => {
    const globalIndex = startIndex + currentIndex;
    if (globalIndex >= sortedData.length - 1) return null; // Нет предыдущего дня
    
    const currentPrice = sortedData[globalIndex].open;
    const previousPrice = sortedData[globalIndex + 1].open;
    return currentPrice - previousPrice;
  };

  const prices = sortedData.map(data => data.open);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  return (
    <div>
      <div style={{ 
        marginBottom: '1rem', 
        padding: '1rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        display: 'flex',
        gap: '2rem',
        flexWrap: 'wrap'
      }}>
        <div>
          <strong>Всего записей:</strong> {sortedData.length}
        </div>
        <div>
          <strong>Минимальная цена:</strong> {minPrice.toFixed(2)}
        </div>
        <div>
          <strong>Максимальная цена:</strong> {maxPrice.toFixed(2)}
        </div>
        <div>
          <strong>Средняя цена:</strong> {avgPrice.toFixed(2)}
        </div>
        <div>
          <strong>Период:</strong> {sortedData[sortedData.length - 1]?.date} - {sortedData[0]?.date}
        </div>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>Всего записей:</strong> {sortedData.length}
        </div>
        <div>
          <button onClick={handlePreviousPage} disabled={currentPage === 1}>
            Назад
          </button>
          <span style={{ margin: '0 1rem' }}>
            Страница {currentPage} из {totalPages}
          </span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages}>
            Вперед
          </button>
        </div>
      </div>

      <div style={{ maxHeight: '500px', overflow: 'auto' }}>
        <table style={{ width: '100%' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6' }}>Дата</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6', textAlign: 'center' }}>Цена открытия</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6', textAlign: 'center' }}>Изменение</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((data, index) => {
              const change = getChangeFromPreviousDay(index);
              
              return (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                    {data.date}
                  </td>
                  <td style={{ 
                    padding: '10px', 
                    borderBottom: '1px solid #dee2e6', 
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    {data.open.toFixed(2)}
                  </td>
                  <td style={{ 
                    padding: '10px', 
                    borderBottom: '1px solid #dee2e6',
                    color: change > 0 ? '#28a745' : change < 0 ? '#dc3545' : '#666',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    {change !== null ? (
                      <>
                        {change > 0 ? '↑' : change < 0 ? '↓' : '→'} 
                        {Math.abs(change).toFixed(2)}
                      </>
                    ) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        Показано {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} из {sortedData.length} записей
      </div>
    </div>
  );
};

export default Stocks;
