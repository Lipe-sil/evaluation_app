import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    getStoredUser,
    logout,
    QUICK_LEADERS,
    switchLeader,
    type LeaderProfile,
} from "../../services/loginService";
import "./Home.css";

export function Home() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<LeaderProfile | null>(() => getStoredUser());

    const userName = currentUser?.name || "Usuário";
    const userId = currentUser?.id ?? 1;
    const userRole = currentUser?.position_name;

    async function handleLeaderChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const selectedId = Number(event.target.value);
        const found = QUICK_LEADERS.find((l) => l.id === selectedId);
        if (!found) return;

        const updated = await switchLeader(found);
        setCurrentUser(updated);
    }

    function handleLogout() {
        logout();
        navigate("/");
    }

    return (
        <div className="home-container">
            <div className="home-header">
                <div className="home-user-info">
                    <div className="home-title-row">
                        <h1 className="home-title">Olá, {userName}</h1>
                        <span className="home-user-badge">ID #{userId}</span>
                    </div>
                    {userRole && <span className="home-user-role">{userRole}</span>}
                </div>

                <div className="home-actions">
                    <div className="leader-switcher">
                        <label htmlFor="leader-select" className="leader-switcher-label">
                            Trocar líder:
                        </label>
                        <select
                            id="leader-select"
                            className="leader-switcher-select"
                            value={QUICK_LEADERS.some((l) => l.id === userId) ? userId : ""}
                            onChange={handleLeaderChange}
                        >
                            {!QUICK_LEADERS.some((l) => l.id === userId) && (
                                <option value="" disabled>
                                    #{userId} - {userName}
                                </option>
                            )}
                            {QUICK_LEADERS.map((leader) => (
                                <option key={leader.id} value={leader.id}>
                                    #{leader.id} - {leader.name} ({leader.position_name})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        className="logout-button"
                        onClick={handleLogout}
                        title="Voltar para a tela de identificação"
                    >
                        Sair
                    </button>
                </div>
            </div>
            <nav className="home-nav">
                <NavLink to="/home/evaluations" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>Avaliações</NavLink>
                <NavLink to="/home/employee" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>Funcionários</NavLink>
            </nav>
            <Outlet context={userId} />
        </div>
    );
}