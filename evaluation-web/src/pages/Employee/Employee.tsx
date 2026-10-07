import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { EmployeeGrade } from "../../types/EmployeeGrade.type";
import { getLeaderEmployees } from "../../services/employeeService";
import { getStoredUser } from "../../services/loginService";
import { Grade } from "../../components/Employee/Grade";
import { GradesModal } from "../../components/Modal/GradesModal/GradesModal";
import "./Employee.css";

export function Employee() {
    const [employees, setEmployees] = useState<EmployeeGrade[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeGrade | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const contextUserId = useOutletContext<number | undefined>();
    const user = getStoredUser();
    const employeeCode = contextUserId ?? user?.id ?? 1;

    useEffect(() => {
        let isMounted = true;

        async function loadEmployees() {
            try {
                setIsLoading(true);
                const data = await getLeaderEmployees(employeeCode);
                if (!isMounted) return;

                // Strictly forbid showing the logged-in user's own profile/evaluations:
                // Only direct and indirect subordinates are visible.
                const subordinatesOnly = (Array.isArray(data) ? data : []).filter(
                    (emp) => (emp.lead_id ?? emp.id) !== employeeCode
                );
                setEmployees(subordinatesOnly);
            } catch (error) {
                console.error("Failed to load employees:", error);
                if (isMounted) {
                    setEmployees([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadEmployees();

        return () => {
            isMounted = false;
        };
    }, [employeeCode]);

    const filteredEmployees = employees.filter((item) => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return true;
        const empId = String(item.lead_id ?? item.id);
        return (
            empId.includes(query) ||
            item.lead_name?.toLowerCase().includes(query) ||
            item.leader_name?.toLowerCase().includes(query)
        );
    });

    const hierarchyLeaderIds = [
        employeeCode,
        ...employees.map((e) => e.lead_id ?? e.id),
    ];

    return (
        <div className="employee-page-container">
            <div className="employee-page-header">
                <div className="employee-page-title-area">
                    <h1 className="employee-page-title">
                        Funcionários Subordinados
                        {!isLoading && employees.length > 0 && (
                            <span className="employee-count-badge">
                                {employees.length} {employees.length === 1 ? "subordinado" : "subordinados"}
                            </span>
                        )}
                    </h1>
                    <p className="employee-page-subtitle">
                        Selecione um subordinado direto ou indireto para ver sua avaliação mais recente, respostas da maior hierarquia e histórico
                    </p>
                </div>
            </div>

            {employees.length > 2 && (
                <div className="employee-search-container">
                    <input
                        type="text"
                        className="employee-search-input"
                        placeholder="Buscar subordinado por ID, nome ou líder..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            <div className="employee-page-content">
                {isLoading ? (
                    <div className="employee-loading">
                        <div className="employee-loading-spinner" />
                        <p>Carregando subordinados...</p>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="employee-empty">
                        <p>
                            {searchTerm
                                ? `Nenhum subordinado encontrado para "${searchTerm}".`
                                : "Você não possui subordinados na sua hierarquia. Conforme as regras de acesso, é vedado visualizar a própria avaliação, a de pares ou de superiores."}
                        </p>
                    </div>
                ) : (
                    <div className="employee-list">
                        {filteredEmployees.map((item) => (
                            <Grade
                                key={item.id}
                                lead_id={item.lead_id ?? item.id}
                                leader_name={item.leader_name}
                                lead_name={item.lead_name}
                                onClick={() => setSelectedEmployee(item)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedEmployee && (
                <GradesModal
                    leadId={selectedEmployee.lead_id ?? selectedEmployee.id}
                    leadName={selectedEmployee.lead_name}
                    viewerId={employeeCode}
                    hierarchyLeaderIds={hierarchyLeaderIds}
                    onClose={() => setSelectedEmployee(null)}
                />
            )}
        </div>
    );
}