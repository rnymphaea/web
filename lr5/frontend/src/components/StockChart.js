import React from 'react';
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

const StockChart = ({ stock }) => {
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  
  const currentYearData = stock.historicalData.filter(data => 
    new Date(data.date).getFullYear() === currentYear
  );
  
  const lastYearData = stock.historicalData.filter(data => 
    new Date(data.date).getFullYear() === lastYear
  );

  const chartData = {
    labels: currentYearData.map(data => data.date),
    datasets: [
      {
        label: `${currentYear}`,
        data: currentYearData.map(data => data.open),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
      {
        label: `${lastYear}`,
        data: lastYearData.slice(-currentYearData.length).map(data => data.open),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `История цен ${stock.symbol}`,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Дата'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Цена ($)'
        }
      },
    },
  };

  return (
    <div style={{ height: '400px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default StockChart;
