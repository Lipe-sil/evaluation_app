import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser, QUICK_LEADERS, switchLeader, type LeaderProfile } from '../../services/loginService';
import './Login.css';

export function Login() {
  const navigate = useNavigate();
  const storedUser = getStoredUser();

  const [selectedLeaderId, setSelectedLeaderId] = useState<number>(
    storedUser && QUICK_LEADERS.some((l) => l.id === storedUser.id)
      ? storedUser.id
      : QUICK_LEADERS[0].id
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const leader = QUICK_LEADERS.find((l) => l.id === selectedLeaderId) ?? QUICK_LEADERS[0];
    await switchLeader(leader);
    navigate('/home/evaluations');
  }

  async function handleQuickSelect(leader: LeaderProfile) {
    setSelectedLeaderId(leader.id);
    await switchLeader(leader);
    navigate('/home/evaluations');
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Selecionar liderança</h1>
        <p className="login-subtitle">
          Selecione um líder para acessar o portal de avaliações.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="leaderSelect">Líder</label>
            <select
              id="leaderSelect"
              className="leader-select-input"
              value={selectedLeaderId}
              onChange={(event) => setSelectedLeaderId(Number(event.target.value))}
            >
              {QUICK_LEADERS.map((leader) => (
                <option key={leader.id} value={leader.id}>
                  {leader.name} - {leader.position_name}
                </option>
              ))}
            </select>
          </div>

          <button type="submit">Acessar avaliações</button>
        </form>

        <div className="quick-leaders-section">
          <span className="quick-leaders-label">Acesso rápido</span>
          <div className="quick-leaders-grid">
            {QUICK_LEADERS.map((leader) => (
              <button
                key={leader.id}
                type="button"
                className="quick-leader-btn"
                onClick={() => handleQuickSelect(leader)}
                title={`${leader.name} - ${leader.position_name}`}
              >
                <span className="quick-leader-name">
                  #{leader.id} {leader.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}