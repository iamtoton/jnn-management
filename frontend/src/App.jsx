import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Admission from './pages/Admission'
import FeeCollection from './pages/FeeCollection'
import PaymentHistory from './pages/PaymentHistory'
import DueList from './pages/DueList'
import Students from './pages/Students'
import Settings from './pages/Settings'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="admission" element={<Admission />} />
          <Route path="fees" element={<FeeCollection />} />
          <Route path="history" element={<PaymentHistory />} />
          <Route path="dues" element={<DueList />} />
          <Route path="students" element={<Students />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
