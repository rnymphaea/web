import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStocks, updateStock } from '../store/stocksSlice';
import StockChart from './StockChart';

const Stocks = () => {
  const dispatch = useDispatch();
  const { items: stocks, status } = useSelector(state => state.stocks);
  const [selectedStock, setSelectedStock] = useState(null);

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
                <td>{stock.symbol}</td>
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
                    {selectedStock?.id === stock.id ? 'Скрыть график' : 'Показать график'}
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
          <StockChart stock={selectedStock} />
        </div>
      )}
    </div>
  );
};

export default Stocks;
