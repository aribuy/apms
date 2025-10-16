// Project Management Types
export interface Project {
  id: string;
  projectNumber: string;
  name: string;
  description?: string;
  executionType: 'internal' | 'subcontractor';
  organizationId: string;
  workgroupId?: string;
  customerRef?: string;
  poNumber?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFormData {
  projectNumber: string;
  name: string;
  description?: string;
  executionType: 'internal' | 'subcontractor';
  organizationId: string;
  workgroupId?: string;
  customerRef?: string;
  poNumber?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
