import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBrokers, addBroker, updateBroker, deleteBroker } from '../store/brokersSlice';

const Brokers = () => {
  const dispatch = useDispatch();
  const { items: brokers, status } = useSelector(state => state.brokers);
  const [newBroker, setNewBroker] = useState({ name: '', initialFunds: 0 });

  useEffect(() => {
    dispatch(fetchBrokers());
  }, [dispatch]);

  const handleAddBroker = (e) => {
    e.preventDefault();
    if (newBroker.name && newBroker.initialFunds > 0) {
      dispatch(addBroker(newBroker));
      setNewBroker({ name: '', initialFunds: 0 });
    }
  };

  const handleUpdateFunds = (id, initialFunds) => {
    dispatch(updateBroker({ id, initialFunds: Number(initialFunds) }));
  };

  const handleDeleteBroker = (id) => {
    dispatch(deleteBroker(id));
  };

  if (status === 'loading') return <div className="card">Loading...</div>;

  return (
    <div>
      <h1>Управление брокерами</h1>
      
      <div className="card">
        <h2>Добавить брокера</h2>
        <form onSubmit={handleAddBroker}>
          <div className="form-group">
            <label>Имя брокера:</label>
            <input
              type="text"
              value={newBroker.name}
              onChange={(e) => setNewBroker({ ...newBroker, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Начальный капитал:</label>
            <input
              type="number"
              value={newBroker.initialFunds}
              onChange={(e) => setNewBroker({ ...newBroker, initialFunds: Number(e.target.value) })}
              required
              min="0"
            />
          </div>
          <button type="submit">Добавить</button>
        </form>
      </div>

      <div className="card">
        <h2>Список брокеров</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Начальный капитал</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {brokers.map(broker => (
              <tr key={broker.id}>
                <td>{broker.id}</td>
                <td>{broker.name}</td>
                <td>
                  <input
                    type="number"
                    value={broker.initialFunds}
                    onChange={(e) => handleUpdateFunds(broker.id, e.target.value)}
                    min="0"
                  />
                </td>
                <td>
                  <button 
                    className="danger" 
                    onClick={() => handleDeleteBroker(broker.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Brokers;
