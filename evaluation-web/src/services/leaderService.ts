import { API_BASE_URL } from '../config/api';

export interface LeaderTreeNode {
    id: number;
    name: string;
    leads: LeaderTreeNode[];
}

export async function getLeaderLeads(leaderId: number = 1): Promise<LeaderTreeNode> {
    const response = await fetch(`${API_BASE_URL}/leader/${leaderId}/leads`);
    if (!response.ok) {
        throw new Error(`Failed to fetch leader leads: ${response.statusText}`);
    }
    return await response.json();
}

export async function getEmployees(): Promise<{ employees: string[] }> {
    const response = await fetch(`${API_BASE_URL}/employees/`);
    if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.statusText}`);
    }
    return await response.json();
}

export async function checkHealth(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
    }
    return await response.json();
}
