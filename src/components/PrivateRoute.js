import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  // Mengecek apakah ada token yang tersimpan di localStorage
  // Jika tidak ada, pengguna dianggap belum login
  const token = localStorage.getItem('token');

  // Jika token ada, render komponen anak (Outlet)
  // Jika tidak, arahkan kembali (redirect) ke halaman login
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
