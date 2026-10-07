export interface LeaderProfile {
    id: number;
    name: string;
    email: string;
    position_name: string;
}

export const QUICK_LEADERS: LeaderProfile[] = [
    { id: 1, name: 'Alice Hartman', email: 'alice.hartman@company.com', position_name: 'CEO' },
    { id: 2, name: 'Bob Sinclair', email: 'bob.sinclair@company.com', position_name: 'CTO' },
    { id: 3, name: 'Carol Nguyen', email: 'carol.nguyen@company.com', position_name: 'CFO' },
    { id: 4, name: 'David Okafor', email: 'david.okafor@company.com', position_name: 'Engineering Manager' },
    { id: 5, name: 'Eva Müller', email: 'eva.muller@company.com', position_name: 'Engineering Manager' },
    { id: 6, name: 'Frank Rossi', email: 'frank.rossi@company.com', position_name: 'Product Manager' },
    { id: 8, name: 'Henry Patel', email: 'henry.patel@company.com', position_name: 'Senior Software Engineer' },
];

export async function switchLeader(leader: LeaderProfile): Promise<LeaderProfile> {
    localStorage.setItem('user', JSON.stringify(leader));
    return leader;
}

export function logout(): void {
    localStorage.removeItem('user');
}

export function getStoredUser(): LeaderProfile | null {
    try {
        const item = localStorage.getItem('user');
        if (!item || item === 'undefined' || item === 'null') return null;
        return JSON.parse(item);
    } catch {
        return null;
    }
}