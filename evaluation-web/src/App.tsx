import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Login } from './pages/Login/Login';
import { Evaluations } from './pages/Evaluations/Evaluations';
import { PendingEvaluations } from './pages/Evaluations/PendingEvaluations';
import { HistoryEvaluations } from './pages/Evaluations/HistoryEvaluations';
import { AllEvaluations } from './pages/Evaluations/AllEvaluations';
import { Employee } from './pages/Employee/Employee';
import { Home } from './pages/Home/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />}>
          <Route path="evaluations" element={<Evaluations />}>
            <Route index element={<Navigate to="all" replace />} />
            <Route path="all" element={<AllEvaluations />} />
            <Route path="pending" element={<PendingEvaluations />} />
            <Route path="history" element={<HistoryEvaluations />} />
          </Route>
          <Route path="employee" element={<Employee />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
