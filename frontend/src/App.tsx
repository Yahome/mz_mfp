import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Entry from '@/pages/Entry';
// import Home from '@/pages/Home';
import RecordForm from '@/pages/RecordForm';
import PrintView from '@/pages/PrintView';
import MainLayout from '@/components/MainLayout';
import AuthGuard from '@/components/AuthGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* HIS Jump Landing Page */}
        <Route path="/app" element={<Entry />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <AuthGuard>
            <MainLayout>
              <RecordForm />
            </MainLayout>
          </AuthGuard>
        } />

        {/* Print View (No Layout) */}
        <Route path="/print/:patientNo" element={<PrintView />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
