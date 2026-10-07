import { NavLink, Outlet, useOutletContext } from 'react-router-dom';
import './Evaluations.css';

export function Evaluations() {
  const userId = useOutletContext<number | undefined>();

  return (
    <div className="evaluations-container">
      <div className="evaluations-header">
        <h1 className="evaluations-title">Avaliações</h1>
      </div>

      <nav className="evaluations-nav">
        <NavLink
          to="/home/evaluations/all"
          className={({ isActive }) => `evaluations-nav-tab ${isActive ? 'active' : ''}`}
        >
          Todas
        </NavLink>

        <NavLink
          to="/home/evaluations/pending"
          className={({ isActive }) => `evaluations-nav-tab pending ${isActive ? 'active' : ''}`}
        >
          Pendentes
        </NavLink>

        <NavLink
          to="/home/evaluations/history"
          className={({ isActive }) => `evaluations-nav-tab ${isActive ? 'active' : ''}`}
        >
          Concluídas
        </NavLink>
      </nav>

      <div className="evaluations-content">
        <Outlet context={userId} />
      </div>
    </div>
  );
}