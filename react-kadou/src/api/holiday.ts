import Item from 'antd/es/list/Item';
import { Holiday, HolidayKind } from '../data/yearStore';
import dayjs from 'dayjs';

export interface HolidayResponse {
    id: number;
    year: string;
    kind: string;
    data: string;
    name: string; 
}

export interface HolidayRequest {    
    kind: string;
    data: string;
    name: string; 
}

export interface HolidayImportRequest {
    data: string[];
}

/**
 * 休日情報を初期化する
 * @param year 
 * @returns 
 */
export async function HolidayInitApi(
year: number
): Promise<Holiday[] | null> {

  const res = await fetch(`/api/kadouholidays/${year}`, {
    method: 'get',
    headers: { 'Content-Type': 'application/json' },    
  });

    if (!res.ok) {
    let message = '休日情報の取得に失敗しました。';
    try {
      const data = await res.json();
      if (data && typeof data.detail === 'string') message = data.detail;
    } catch {
      // JSON でないレスポンスは既定メッセージを使う
    }
    throw new Error(message);
  }

const data = (await res.json()) as HolidayResponse[];

const resData:Holiday[] = data.map((item) => ({
    id: item.id.toString(),
    date: ymd8ToLine(item.data),
    name: item.name,
    kind: getKindTxt(item.kind) as HolidayKind,
  }));
    
  return resData;
}

/**
 * 休日情報を追加する
 * @param year 
 * @returns 
 */
export async function HolidayAddApi(year: number,currentUserId: string | null,addData: Holiday): Promise<Holiday[]> {

  const requestData: HolidayRequest = {
    kind: getKindNo(addData.kind),
    data: addData.date.replace(/-/g, ''),
    name: addData.name,
  };

  const res = await fetch(`/api/kadouholidays/${year}`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId || '' },
    body: JSON.stringify(requestData),
  });

  const data = (await res.json()) as HolidayResponse[];

  const resData:Holiday[] = data.map((item) => ({
      id: item.id.toString(),
      date: ymd8ToLine(item.data),
      name: item.name,
      kind: getKindTxt(item.kind) as HolidayKind,
    }));
   
  return resData;
}

/**
 * 休日情報を更新する
 * @param year 
 * @returns 
 */
export async function HolidayUpdateApi(year: number,currentUserId: string | null,addData: Holiday): Promise<Holiday[]> {

  const requestData: HolidayRequest = {
    kind: getKindNo(addData.kind),
    data: addData.date.replace(/-/g, ''),
    name: addData.name,
  };

  const res = await fetch(`/api/kadouholidays/${year}/${addData.id}`, {
    method: 'put',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId || '' },
    body: JSON.stringify(requestData),
  });

  const data = (await res.json()) as HolidayResponse[];

  const resData:Holiday[] = data.map((item) => ({
      id: item.id.toString(),
      date: ymd8ToLine(item.data),
      name: item.name,
      kind: getKindTxt(item.kind) as HolidayKind,
    }));
   
  return resData;
}

/**
 * 休日情報を削除する
 * @param year 
 * @returns 
 */
export async function HolidayDeleteApi(year: number,id: string | null): Promise<Holiday[]> {

  const res = await fetch(`/api/kadouholidays/${id}/${year}`, {
    method: 'delete',
    headers: { 'Content-Type': 'application/json'}
  });

  if (!res.ok) {
    let message = '休日情報の削除に失敗しました。';  
  }

  const data = (await res.json()) as HolidayResponse[];

  const resData:Holiday[] = data.map((item) => ({
      id: item.id.toString(),
      date: ymd8ToLine(item.data),
      name: item.name,
      kind: getKindTxt(item.kind) as HolidayKind,
    }));
   
  return resData;  
}

/**
 * 休日情報を一括追加する
 * @param year 
 * @returns 
 */
export async function HolidayImportApi(year: number,currentUserId: string | null,addData: string[]): Promise<Holiday[]> {

  const requestDatas: HolidayImportRequest = {data: addData.map(d => dayjs(d).format('YYYYMMDD'))}

  const res = await fetch(`/api/kadouholidays/export/${year}`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId || '' },
    body: JSON.stringify(requestDatas),
  });

  const data = (await res.json()) as HolidayResponse[];

  const resData:Holiday[] = data.map((item) => ({
      id: item.id.toString(),
      date: ymd8ToLine(item.data),
      name: item.name,
      kind: getKindTxt(item.kind) as HolidayKind,
    }));
   
  return resData;
}

function getKindTxt(kind: String): string {
  switch (kind) {
    case '01':
      return '祝日';
    case '02':
      return '会社休日';
    case '03':
      return '振替休日';
    default:
      return '';
  }
}

function getKindNo(kindTxt: String): string {
  switch (kindTxt) {
    case '祝日':
      return '01';
    case '会社休日':
      return '02';
    case '振替休日':
      return '03';
    default:
      return '';
  }
}

function ymd8ToLine(dateStr: string) {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  return `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
}