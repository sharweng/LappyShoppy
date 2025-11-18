import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from './AdminLayout';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Package,
  Download
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LabelList
} from 'recharts';
import axios from 'axios';
import html2canvas from 'html2canvas';
import {
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

// Format large numbers with K/M notation
const formatNumber = (value) => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value;
};

const downloadChart = async (chartRef, filename) => {
  if (!chartRef.current) return;
  
  // Hide control elements temporarily
  const controls = chartRef.current.querySelectorAll('.chart-controls');
  controls.forEach(el => el.style.display = 'none');
  
  try {
    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: false
    });
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Error downloading chart:', error);
  } finally {
    // Show controls again
    controls.forEach(el => el.style.display = '');
  }
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const monthlyChartRef = useRef();
  const salesOverviewChartRef = useRef();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesData, setSalesData] = useState([]);
  const [monthlySalesData, setMonthlySalesData] = useState([]);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [monthlyTab, setMonthlyTab] = useState('money'); // 'money' or 'products'
  const [saleOverviewTab, setSaleOverviewTab] = useState('money'); // 'money' or 'products'
  const [monthlyProductsData, setMonthlyProductsData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthlyLabels, setShowMonthlyLabels] = useState(true);
  const [showOverviewLabels, setShowOverviewLabels] = useState(true);

  // Generate year options (current year and past 5 years)
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 6; i++) {
    yearOptions.push(currentYear - i);
  }

  const fetchStats = useCallback(async () => {
    try {
      // Get token from Firebase
      const token = await currentUser?.getIdToken();
      
      if (!token) {
        console.error('No authentication token available');
        return;
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      // Fetch all stats in parallel
      const [usersRes, ordersRes, salesRes, productsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/users`, config).catch(() => ({ data: { users: [] } })),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/total-orders`, config).catch(() => ({ data: { totalOrders: [] } })),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/total-sales`, config).catch(() => ({ data: { totalSales: [] } })),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/products`, config).catch(() => ({ data: { productsCount: 0 } }))
      ]);
      
      const totalOrders = ordersRes.data.totalOrders?.[0]?.count || 0;
      const totalSales = salesRes.data.totalSales?.[0]?.totalSales || 0;
      const totalProducts = productsRes.data.productsCount || 0;
      
      setStats({
        totalUsers: usersRes.data.users?.length || 0,
        totalProducts: totalProducts,
        totalOrders: totalOrders,
        totalRevenue: totalSales
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [currentUser]);

  const fetchMonthlySalesData = useCallback(async () => {
    try {
      const token = await currentUser?.getIdToken();
      if (!token) return;

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/sales-per-month`, {
        ...config,
        params: {
          year: selectedYear
        }
      });
      
      if (data.salesPerMonth && data.salesPerMonth.length > 0) {
        setMonthlySalesData(data.salesPerMonth);
      }
    } catch (error) {
      console.error('Error fetching monthly sales:', error);
    }
  }, [currentUser, selectedYear]);

  const fetchMonthlyProductsData = useCallback(async () => {
    try {
      const token = await currentUser?.getIdToken();
      if (!token) return;

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/products-sold-per-month`, {
        ...config,
        params: {
          year: selectedYear
        }
      });
      
      if (data.productsSoldPerMonth && data.productsSoldPerMonth.length > 0) {
        setMonthlyProductsData(data.productsSoldPerMonth);
      }
    } catch (error) {
      console.error('Error fetching monthly products:', error);
    }
  }, [currentUser, selectedYear]);

  const fetchSalesByDateRange = useCallback(async (start = startDate, end = endDate) => {
    try {
      setLoadingCharts(true);
      const token = await currentUser?.getIdToken();
      if (!token) return;

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const [salesRes, productsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/sales-by-date-range`, {
          ...config,
          params: {
            startDate: start,
            endDate: end
          }
        }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/products-sold-by-date-range`, {
          ...config,
          params: {
            startDate: start,
            endDate: end
          }
        })
      ]);
      
      if (salesRes.data.salesByDate) {
        // Format dates for display (e.g., "Nov 15" or "11/15")
        const formattedData = salesRes.data.salesByDate.map(item => ({
          ...item,
          displayDate: new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));
        setSalesData(formattedData);
      }

      if (productsRes.data.productsByDate) {
        // Format dates for display
        const formattedProductData = productsRes.data.productsByDate.map(item => ({
          ...item,
          displayDate: new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));
        setProductsData(formattedProductData);
      }
    } catch (error) {
      console.error('Error fetching sales by date range:', error);
    } finally {
      setLoadingCharts(false);
    }
  }, [currentUser, startDate, endDate]);

  useEffect(() => {
    fetchStats();
    fetchMonthlySalesData();
    fetchMonthlyProductsData();
    fetchSalesByDateRange();
  }, [fetchStats, fetchMonthlySalesData, fetchMonthlyProductsData, fetchSalesByDateRange]);

  useEffect(() => {
    fetchMonthlySalesData();
    fetchMonthlyProductsData();
  }, [fetchMonthlySalesData, fetchMonthlyProductsData, selectedYear]);

  const handleDateRangeChange = () => {
    fetchSalesByDateRange(startDate, endDate);
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-green-500'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500'
    }
  ];

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back, {currentUser?.displayName || 'Admin'}
          </p>
        </div>

        {/* Stats Grid - More Compact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">{stat.title}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Sales Chart */}
        <div ref={monthlyChartRef} className="bg-white rounded-lg shadow p-6 mb-6">
          <div style={{ padding: '20px' }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h2 className="text-xl font-bold text-gray-900">Monthly Sales ({selectedYear})</h2>
              <div className="flex gap-2 chart-controls">
                <FormControl size="small" style={{ minWidth: 100 }}>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={selectedYear}
                    label="Year"
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  >
                    {yearOptions.map(year => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <ButtonGroup variant="outlined" size="small">
                  <Button 
                    variant={monthlyTab === 'money' ? 'contained' : 'outlined'}
                    onClick={() => setMonthlyTab('money')}
                  >
                    Money
                  </Button>
                  <Button 
                    variant={monthlyTab === 'products' ? 'contained' : 'outlined'}
                    onClick={() => setMonthlyTab('products')}
                  >
                    Products
                  </Button>
                </ButtonGroup>
                <Button
                  variant={showMonthlyLabels ? 'contained' : 'outlined'}
                  size="small"
                  color={showMonthlyLabels ? 'success' : 'inherit'}
                  onClick={() => setShowMonthlyLabels(!showMonthlyLabels)}
                  title={showMonthlyLabels ? 'Hide labels' : 'Show labels'}
                  sx={{ minWidth: '103px' }}
                >
                  {showMonthlyLabels ? 'Labels On' : 'Labels Off'}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  onClick={() => downloadChart(monthlyChartRef, `monthly-sales-${monthlyTab}-${selectedYear}.png`)}
                >
                  <DownloadIcon />
                </Button>
              </div>
            </div>
            {monthlySalesData.length > 0 || monthlyProductsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTab === 'money' ? monthlySalesData : monthlyProductsData} margin={{ top: 40, right: 30, bottom: 5, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip 
                    formatter={(value) => monthlyTab === 'money' ? `$${value.toLocaleString()}` : `${value} units`} 
                  />
                  <Legend />
                  <Line 
                    type="linear" 
                    dataKey={monthlyTab === 'money' ? 'total' : 'totalQuantity'} 
                    stroke={monthlyTab === 'money' ? '#8b5cf6' : '#10b981'}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name={monthlyTab === 'money' ? 'Sales' : 'Products'}
                  >
                    {showMonthlyLabels && (
                      <LabelList 
                        dataKey={monthlyTab === 'money' ? 'total' : 'totalQuantity'} 
                        position="top" 
                        offset={10}
                        formatter={(value) => value === 0 ? '' : (monthlyTab === 'money' ? `$${value.toLocaleString()}` : `${value}`)}
                        style={{ fontSize: '12px', fill: '#333' }}
                      />
                    )}
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No monthly data available
              </div>
            )}
          </div>
        </div>

        {/* Sales Chart with Custom Date Range Filter */}
        <div ref={salesOverviewChartRef} className="bg-white rounded-lg shadow p-6">
          <div style={{ padding: '20px' }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h2 className="text-xl font-bold text-gray-900">Sales Overview</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                
                <div className="flex gap-1 chart-controls">
                  <TextField
                    label="From"
                    type="date"
                    size="small"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      fetchSalesByDateRange(e.target.value, endDate);
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </div>
                <div className="flex gap-1 chart-controls">
                  <TextField
                    label="To"
                    type="date"
                    size="small"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      fetchSalesByDateRange(startDate, e.target.value);
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </div>
                <div className="flex gap-2 chart-controls">
                  <ButtonGroup variant="outlined" size="small">
                    <Button 
                      variant={saleOverviewTab === 'money' ? 'contained' : 'outlined'}
                      onClick={() => setSaleOverviewTab('money')}
                    >
                      Money
                    </Button>
                    <Button 
                      variant={saleOverviewTab === 'products' ? 'contained' : 'outlined'}
                      onClick={() => setSaleOverviewTab('products')}
                    >
                      Products
                    </Button>
                  </ButtonGroup>
                  <Button
                    variant={showOverviewLabels ? 'contained' : 'outlined'}
                    size="small"
                    color={showOverviewLabels ? 'success' : 'inherit'}
                    onClick={() => setShowOverviewLabels(!showOverviewLabels)}
                    title={showOverviewLabels ? 'Hide labels' : 'Show labels'}
                    sx={{ minWidth: '103px' }}
                  >
                    {showOverviewLabels ? 'Labels On' : 'Labels Off'}
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    color="success"
                    onClick={() => downloadChart(salesOverviewChartRef, `sales-overview-${saleOverviewTab}-${startDate}-to-${endDate}.png`)}
                  >
                    <DownloadIcon />
                  </Button>
                </div>
              </div>
            </div>
            {loadingCharts ? (
              <div className="h-96 flex items-center justify-center text-gray-500">
                Loading chart data...
              </div>
            ) : (saleOverviewTab === 'money' ? salesData.length > 0 : productsData.length > 0) ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={saleOverviewTab === 'money' ? salesData : productsData} margin={{ top: 40, right: 30, bottom: 5, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="displayDate" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip 
                    formatter={(value) => saleOverviewTab === 'money' ? `$${value.toLocaleString()}` : `${value} units`} 
                  />
                  <Legend />
                  <Line 
                    type="linear" 
                    dataKey={saleOverviewTab === 'money' ? 'sales' : 'totalQuantity'} 
                    stroke={saleOverviewTab === 'money' ? '#3b82f6' : '#10b981'}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    name={saleOverviewTab === 'money' ? 'Sales' : 'Products'}
                  >
                    {showOverviewLabels && (
                      <LabelList 
                        dataKey={saleOverviewTab === 'money' ? 'sales' : 'totalQuantity'} 
                        position="top" 
                        offset={10}
                        formatter={(value) => value === 0 ? '' : (saleOverviewTab === 'money' ? `$${value.toLocaleString()}` : `${value}`)}
                        style={{ fontSize: '10px', fill: '#333' }}
                      />
                    )}
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                No sales data available for this date range
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
