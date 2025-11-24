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

const getYearFromDate = (dateString) => {
  try {
    const date = parseDate(dateString);
    return date.getFullYear();
  } catch (error) {
    return new Date().getFullYear();
  }
};

const StockChart = ({ stock }) => {
  const [selectedYear, setSelectedYear] = useState(null);

  if (!stock || !stock.historicalData || stock.historicalData.length === 0) {
    return <div>Нет данных для отображения графика</div>;
  }

  const sortedData = [...stock.historicalData].sort((a, b) => 
    parseDate(a.date) - parseDate(b.date)
  );

  const availableYears = [...new Set(sortedData.map(data => getYearFromDate(data.date)))].sort();

  if (!selectedYear && availableYears.length > 0) {
    setSelectedYear(availableYears[availableYears.length - 1]);
  }

  const getColorForYear = (year) => {
    const colors = {
      2025: 'rgb(75, 192, 192)',
      2024: 'rgb(255, 99, 132)',
      2023: 'rgb(153, 102, 255)',
      2022: 'rgb(255, 159, 64)',
      2021: 'rgb(54, 162, 235)',
    };
    
    return colors[year] || `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`;
  };

  const createChartData = () => {
    if (!selectedYear) return null;

    const yearData = sortedData.filter(data => getYearFromDate(data.date) === selectedYear);
    const labels = yearData.map(data => formatDateWithoutYear(data.date));
    
    return {
      labels: labels,
      datasets: [
        {
          label: `${selectedYear} год`,
          data: yearData.map(data => data.open),
          borderColor: getColorForYear(selectedYear),
          backgroundColor: `${getColorForYear(selectedYear)}20`,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 6,
          fill: true,
        },
      ],
    };
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
        text: `${stock.symbol} - ${stock.name} (${selectedYear} год)`,
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
            const yearData = sortedData.filter(data => getYearFromDate(data.date) === selectedYear);
            return yearData[tooltipItems[0].dataIndex]?.date || '';
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

  const getYearStatistics = () => {
    if (!selectedYear) return null;

    const yearData = sortedData.filter(data => getYearFromDate(data.date) === selectedYear);
    const prices = yearData.map(data => data.open);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    return {
      minPrice,
      maxPrice,
      avgPrice,
      dataPoints: yearData.length
    };
  };

  const chartData = createChartData();
  const statistics = getYearStatistics();

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <strong>Выберите год для просмотра:</strong>
        </div>
        <select 
          value={selectedYear || ''}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          style={{ 
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
            minWidth: '120px'
          }}
        >
          {availableYears.map(year => (
            <option key={year} value={year}>
              {year} год
            </option>
          ))}
        </select>
      </div>

      {statistics && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          border: `2px solid ${getColorForYear(selectedYear)}`
        }}>
          <h4 style={{ marginBottom: '0.5rem', color: getColorForYear(selectedYear) }}>
            Статистика за {selectedYear} год:
          </h4>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <strong>Количество записей:</strong> {statistics.dataPoints}
            </div>
            <div>
              <strong>Минимальная цена:</strong> ${statistics.minPrice.toFixed(2)}
            </div>
            <div>
              <strong>Максимальная цена:</strong> ${statistics.maxPrice.toFixed(2)}
            </div>
            <div>
              <strong>Средняя цена:</strong> ${statistics.avgPrice.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {chartData ? (
        <Line data={chartData} options={chartOptions} />
      ) : (
        <div style={{ 
          height: '400px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          Выберите год для отображения графика
        </div>
      )}

      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <strong>Доступные годы для {stock.symbol}:</strong>
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {availableYears.map(year => (
            <span 
              key={year}
              onClick={() => setSelectedYear(year)}
              style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: selectedYear === year ? getColorForYear(year) : '#fff',
                color: selectedYear === year ? 'white' : '#333',
                border: `1px solid ${getColorForYear(year)}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {year}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockChart;
