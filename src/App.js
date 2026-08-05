import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DataKelas from './pages/DataKelas';
import ManajemenAkun from './pages/ManajemenAkun';
import Login from './pages/Login';
import Register from './pages/Register';
import InventarisBarang from './pages/InventarisBarang';
import PrivateRoute from './components/PrivateRoute';
import UbahPassword from './pages/UbahPassword';
import Laporan from './pages/Laporan';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute Publik */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rute yang diproteksi */}
        <Route element={<PrivateRoute />}>
          <Route path="/*" element={
            <div className="app-container">
              <Sidebar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/datakelas" element={<DataKelas />} />
                  <Route path="/manajemen-akun" element={<ManajemenAkun />} />
                  <Route path="/inventaris-barang" element={<InventarisBarang />} />
                  <Route path="/ubah-password" element={<UbahPassword />} />
                  <Route path="/laporan" element={<Laporan />} />
                </Routes>
              </main>
            </div>
          } />
        </Route>
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Router>
  );
}

export default App;
