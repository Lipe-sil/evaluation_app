import './Grade.css';

interface GradeProps {
    lead_id?: number;
    leader_name: string;
    lead_name: string;
    date?: string;
    score?: string | number;
    badges?: { label: string; variant?: 'hierarchy' | 'recent' }[];
    onClick?: () => void;
}

export function Grade({
    lead_id,
    leader_name,
    lead_name,
    date,
    score,
    badges,
    onClick,
}: GradeProps) {
    return (
        <div
            className={`grade-container ${onClick ? 'clickable' : ''}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <div className="grade-left">
                <div className="grade-name-row">
                    {lead_id !== undefined && (
                        <span className="grade-id-badge">ID #{lead_id}</span>
                    )}
                    <p className="employee-name">{lead_name}</p>
                    {badges &&
                        badges.map((b, idx) => (
                            <span
                                key={idx}
                                className={`grade-tag ${
                                    b.variant === 'hierarchy'
                                        ? 'grade-tag-hierarchy'
                                        : 'grade-tag-recent'
                                }`}
                            >
                                {b.label}
                            </span>
                        ))}
                </div>
                {date && <span className="grade-date">Avaliado em: {date}</span>}
            </div>

            <div className="grade-right">
                <p className="leader-name">Líder: {leader_name}</p>
                {score !== undefined && (
                    <span className="grade-score-pill">Nota: {score}/100</span>
                )}
            </div>
        </div>
    );
}