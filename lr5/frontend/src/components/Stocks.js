import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStocks, updateStock } from '../store/stocksSlice';
import StockChart from './StockChart';

const Stocks = () => {
  const dispatch = useDispatch();
  const { items: stocks, status } = useSelector(state => state.stocks);
  const [selectedStock, setSelectedStock] = useState(null);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' или 'table'

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
          
          <div style={{ marginBottom: '1rem' }}>
            <button 
              onClick={() => setViewMode('chart')}
              style={{ 
                backgroundColor: viewMode === 'chart' ? '#3498db' : '#f8f9fa',
                color: viewMode === 'chart' ? 'white' : '#333',
                marginRight: '0.5rem'
              }}
            >
              График
            </button>
            <button 
              onClick={() => setViewMode('table')}
              style={{ 
                backgroundColor: viewMode === 'table' ? '#3498db' : '#f8f9fa',
                color: viewMode === 'table' ? 'white' : '#333'
              }}
            >
              Таблица
            </button>
          </div>

          {viewMode === 'chart' ? (
            <StockChart stock={selectedStock} />
          ) : (
            <HistoricalDataTable stock={selectedStock} />
          )}
        </div>
      )}
    </div>
  );
};

// Компонент для табличного представления исторических данных
const HistoricalDataTable = ({ stock }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  if (!stock.historicalData || stock.historicalData.length === 0) {
    return <div>Нет исторических данных</div>;
  }

  // Сортируем данные по дате (от новых к старым)
  const sortedData = [...stock.historicalData].sort((a, b) => {
    const dateA = new Date(a.date.split('.').reverse().join('-'));
    const dateB = new Date(b.date.split('.').reverse().join('-'));
    return dateB - dateA;
  });

  // Вычисляем пагинацию
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div>
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
              <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6' }}>Цена открытия ($)</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6' }}>Год</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((data, index) => {
              const year = data.date.split('.')[2];
              const isCurrentYear = year === new Date().getFullYear().toString();
              
              return (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                    {data.date}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6', textAlign: 'right' }}>
                    <strong>${data.open.toFixed(2)}</strong>
                  </td>
                  <td style={{ 
                    padding: '10px', 
                    borderBottom: '1px solid #dee2e6',
                    color: isCurrentYear ? '#28a745' : '#dc3545',
                    fontWeight: 'bold'
                  }}>
                    {year}
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
