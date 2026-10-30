import { Personnel } from '../WorkStatus/types';

const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '');

interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

interface PersonnelRecord {
  employeeNo: string;
  departmentId: string | null;
  name: string | null;
  role: string | null;
  leavePlan: string | null;
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail =
      typeof body?.detail === 'string'
        ? body.detail
        : `HTTP ${response.status}`;
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
};

const toPersonnel = (record: PersonnelRecord): Personnel => ({
  employeeNo: record.employeeNo,
  name: record.name ?? '',
  departmentId: record.departmentId ?? '',
  role: record.role ?? '',
  leavePlan: record.leavePlan ?? undefined,
});

export const loadPersonnel = async (year: number): Promise<Personnel[]> => {
  const response = await request<ApiResponse<PersonnelRecord[]>>(
    `/api/personnel/list?year=${year}`,
  );
  return response.data.map(toPersonnel);
};

export const savePersonnel = async (
  year: number,
  person: Personnel,
): Promise<void> => {
  await request(`/api/personnel/save?year=${year}`, {
    method: 'POST',
    body: JSON.stringify({
      employeeNo: person.employeeNo,
      departmentId: person.departmentId,
      name: person.name,
      role: person.role,
      leavePlan: person.leavePlan ?? '',
    }),
  });
};

export const importPersonnel = async (
  year: number,
  people: Personnel[],
): Promise<void> => {
  await request(`/api/personnel/import?year=${year}`, {
    method: 'POST',
    body: JSON.stringify(
      people.map((person) => ({
        employeeNo: person.employeeNo,
        departmentId: person.departmentId,
        name: person.name,
        role: person.role,
        leavePlan: person.leavePlan ?? '',
      })),
    ),
  });
};

export const deletePersonnel = async (
  year: number,
  employeeNo: string,
): Promise<void> => {
  await request(
    `/api/personnel/delete?year=${year}&employeeNo=${encodeURIComponent(
      employeeNo,
    )}`,
    { method: 'DELETE' },
  );
};

/**
 * 获取单个社员信息（通过社员番号检索）
 */
export const getPersonnelInfo = async (
  year: number,
  employeeNo: string,
): Promise<{ person: PersonnelRecord; department: { department_name: string } | null }> => {
  const response = await request<ApiResponse<{ person: PersonnelRecord; department: { department_name: string } | null }>>(
    `/api/personnel/info?year=${year}&employeeNo=${encodeURIComponent(employeeNo)}`,
  );
  return response.data;
};
