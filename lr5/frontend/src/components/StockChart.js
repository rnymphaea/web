import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Функция для парсинга даты в формате "dd.mm.yyyy"
const parseDate = (dateString) => {
  if (!dateString) return new Date();
  
  if (dateString.includes('.')) {
    const parts = dateString.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
  }
  
  return new Date(dateString);
};

// Функция для форматирования даты без года
const formatDateWithoutYear = (dateString) => {
  try {
    const date = parseDate(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
  } catch (error) {
    return dateString;
  }
};

// Функция для получения года из даты
const getYearFromDate = (dateString) => {
  try {
    const date = parseDate(dateString);
    return date.getFullYear();
  } catch (error) {
    return new Date().getFullYear();
  }
};

const StockChart = ({ stock }) => {
  const [viewMode, setViewMode] = useState('separate'); // 'separate' или 'combined'

  if (!stock || !stock.historicalData || stock.historicalData.length === 0) {
    return <div>Нет данных для отображения графика</div>;
  }

  // Сортируем данные по дате
  const sortedData = [...stock.historicalData].sort((a, b) => 
    parseDate(a.date) - parseDate(b.date)
  );

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  // Разделяем данные по годам
  const currentYearData = sortedData.filter(data => 
    getYearFromDate(data.date) === currentYear
  );

  const lastYearData = sortedData.filter(data => 
    getYearFromDate(data.date) === lastYear
  );

  // Получаем уникальные годы из данных
  const availableYears = [...new Set(sortedData.map(data => getYearFromDate(data.date)))].sort();

  // Функция для создания данных графика по отдельному году
  const createYearChartData = (yearData, year) => {
    const labels = yearData.map(data => formatDateWithoutYear(data.date));
    
    return {
      labels: labels,
      datasets: [
        {
          label: `${year} год`,
          data: yearData.map(data => data.open),
          borderColor: getColorForYear(year),
          backgroundColor: `${getColorForYear(year)}20`,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 6,
          fill: true,
        },
      ],
    };
  };

  // Функция для создания комбинированного графика
  const createCombinedChartData = () => {
    const labels = currentYearData.map(data => formatDateWithoutYear(data.date));

    return {
      labels: labels,
      datasets: [
        {
          label: `${currentYear} год`,
          data: currentYearData.map(data => data.open),
          borderColor: getColorForYear(currentYear),
          backgroundColor: `${getColorForYear(currentYear)}20`,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
        {
          label: `${lastYear} год`,
          data: lastYearData.slice(-currentYearData.length).map(data => data.open),
          borderColor: getColorForYear(lastYear),
          backgroundColor: `${getColorForYear(lastYear)}20`,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
      ],
    };
  };

  // Функция для получения цвета по году
  const getColorForYear = (year) => {
    const colors = {
      [currentYear]: 'rgb(75, 192, 192)',
      [lastYear]: 'rgb(255, 99, 132)',
      [currentYear - 2]: 'rgb(153, 102, 255)',
      [currentYear - 3]: 'rgb(255, 159, 64)',
      [currentYear - 4]: 'rgb(54, 162, 235)',
    };
    
    return colors[year] || `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      title: {
        display: true,
        text: viewMode === 'combined' 
          ? `Сравнение цен ${stock.symbol} - ${stock.name}`
          : `Цены ${stock.symbol} - ${stock.name}`,
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `$${context.parsed.y.toFixed(2)}`;
            }
            return label;
          },
          title: function(tooltipItems) {
            if (viewMode === 'combined') {
              return currentYearData[tooltipItems[0].dataIndex]?.date || '';
            } else {
              const yearData = getYearDataForView();
              return yearData[tooltipItems[0].dataIndex]?.date || '';
            }
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Дата (день.месяц)'
        },
        grid: {
          display: false
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Цена открытия ($)'
        },
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
    },
  };

  // Получаем данные для отображения в зависимости от режима
  const getChartData = () => {
    if (viewMode === 'combined') {
      return createCombinedChartData();
    } else {
      return createYearChartData(getYearDataForView(), getSelectedYear());
    }
  };

  // Получаем данные для выбранного года
  const getYearDataForView = () => {
    const selectedYear = getSelectedYear();
    return sortedData.filter(data => getYearFromDate(data.date) === selectedYear);
  };

  // Получаем выбранный год (для отдельного режима)
  const getSelectedYear = () => {
    return availableYears[availableYears.length - 1]; // По умолчанию самый новый год
  };

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <strong>Режим отображения:</strong>
        </div>
        <button 
          onClick={() => setViewMode('separate')}
          style={{ 
            backgroundColor: viewMode === 'separate' ? '#3498db' : '#f8f9fa',
            color: viewMode === 'separate' ? 'white' : '#333',
            border: '1px solid #ddd',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          По годам отдельно
        </button>
        <button 
          onClick={() => setViewMode('combined')}
          style={{ 
            backgroundColor: viewMode === 'combined' ? '#3498db' : '#f8f9fa',
            color: viewMode === 'combined' ? 'white' : '#333',
            border: '1px solid #ddd',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Сравнение годов
        </button>

        {viewMode === 'separate' && availableYears.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <strong>Год:</strong>
            <select 
              onChange={(e) => {
                // Здесь можно добавить логику для смены года
                console.log('Selected year:', e.target.value);
              }}
              style={{ 
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year} год
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {viewMode === 'separate' ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            {availableYears.map(year => {
              const yearData = sortedData.filter(data => getYearFromDate(data.date) === year);
              const yearChartData = createYearChartData(yearData, year);
              
              return (
                <div key={year} style={{ height: '300px' }}>
                  <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: getColorForYear(year) }}>
                    {stock.symbol} - {year} год
                  </h4>
                  <Line 
                    data={yearChartData} 
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          display: false
                        },
                        legend: {
                          display: false
                        }
                      }
                    }} 
                  />
                </div>
              );
            })}
          </div>
          
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <strong>Статистика по годам:</strong>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {availableYears.map(year => {
                const yearData = sortedData.filter(data => getYearFromDate(data.date) === year);
                const prices = yearData.map(data => data.open);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
                
                return (
                  <div key={year} style={{ 
                    padding: '0.5rem 1rem', 
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    border: `2px solid ${getColorForYear(year)}`
                  }}>
                    <div style={{ color: getColorForYear(year), fontWeight: 'bold' }}>{year} год</div>
                    <div>Записей: {yearData.length}</div>
                    <div>Мин: ${minPrice.toFixed(2)}</div>
                    <div>Макс: ${maxPrice.toFixed(2)}</div>
                    <div>Средн: ${avgPrice.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <Line data={getChartData()} options={chartOptions} />
      )}
    </div>
  );
};

export default StockChart;
