import './Leads.css';

interface LeadsProps {
    leadId?: number | null;
    name: string;
    leaderName?: string;
    status?: 'pending' | 'completed';
    date?: string;
    onClick?: () => void;
}

export function Leads({ leadId, name, leaderName, status, date, onClick }: LeadsProps) {
    return (
        <li className="lead" onClick={onClick}>
            <div className="lead-main">
                <div className="lead-name-row">
                    {leadId !== undefined && leadId !== null && (
                        <span className="lead-id-badge">ID #{leadId}</span>
                    )}
                    <p className="lead-name">{name}</p>
                </div>
                <div className="lead-meta-row">
                    {leaderName && (
                        <span className="lead-leader-info">Avaliador: {leaderName}</span>
                    )}
                    {date && <span className="lead-date">Data: {date}</span>}
                </div>
            </div>

            <div className="lead-actions">
                <span className={status === 'pending' ? 'lead-status-badge lead-pending' : 'lead-status-badge lead-completed'}>
                    {status === 'pending'
                        ? 'Avaliar agora'
                        : 'Avaliação concluída'}
                </span>

                <span className="lead-details">
                    Status: {status === 'completed' ? 'Concluída' : status === 'pending' ? 'Pendente' : (status || 'Não especificado')}
                </span>
            </div>
        </li>
    );
}