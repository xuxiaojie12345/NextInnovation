import dayjs from "dayjs";
import {
  Holiday,
  HolidayImportRequest,
  HolidayKind,
  HolidayRequest,
  HolidayResponse,
} from "../Holiday/HolidaySettingMode";
import { httpRequest } from "../utils/http";

/**
 * 休日情報を初期化する
 * @param year
 * @returns
 */
export async function HolidayInitApi(year: number): Promise<Holiday[] | null> {
  const res = await httpRequest<HolidayResponse[]>(
    `/api/kadouholidays/${year}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );

  const resData: Holiday[] = res.map((item) => ({
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
export async function HolidayAddApi(
  year: number,
  currentUserId: string | null,
  addData: Holiday,
): Promise<Holiday[]> {
  const requestData: HolidayRequest = {
    kind: getKindNo(addData.kind),
    data: addData.date.replace(/-/g, ""),
    name: addData.name,
  };

  const res = await httpRequest<HolidayResponse[]>(
    `/api/kadouholidays/${year}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": currentUserId || "",
      },
      body: requestData,
    },
  );

  const resData: Holiday[] = res.map((item) => ({
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
export async function HolidayUpdateApi(
  year: number,
  currentUserId: string | null,
  addData: Holiday,
): Promise<Holiday[]> {
  const requestData: HolidayRequest = {
    kind: getKindNo(addData.kind),
    data: addData.date.replace(/-/g, ""),
    name: addData.name,
  };

  const res = await httpRequest<HolidayResponse[]>(
    `/api/kadouholidays/${year}/${addData.id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": currentUserId || "",
      },
      body: requestData,
    },
  );

  const resData: Holiday[] = res.map((item) => ({
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
export async function HolidayDeleteApi(
  year: number,
  id: string | null,
): Promise<Holiday[]> {
  const res = await httpRequest<HolidayResponse[]>(
    `/api/kadouholidays/${id}/${year}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    },
  );

  const resData: Holiday[] = res.map((item) => ({
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
export async function HolidayImportApi(
  year: number,
  currentUserId: string | null,
  addData: string[],
): Promise<Holiday[]> {
  const requestDatas: HolidayImportRequest = {
    data: addData.map((d) => dayjs(d).format("YYYYMMDD")),
  };

  const res = await httpRequest<HolidayResponse[]>(
    `/api/kadouholidays/export/${year}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": currentUserId || "",
      },
      body: requestDatas,
    },
  );

  const resData: Holiday[] = res.map((item) => ({
    id: item.id.toString(),
    date: ymd8ToLine(item.data),
    name: item.name,
    kind: getKindTxt(item.kind) as HolidayKind,
  }));

  return resData;
}

function getKindTxt(kind: String): string {
  switch (kind) {
    case "01":
      return "祝日";
    case "02":
      return "会社休日";
    case "03":
      return "振替休日";
    default:
      return "未指定";
  }
}

function getKindNo(kindTxt: String | null): string {
  switch (kindTxt) {
    case "祝日":
      return "01";
    case "会社休日":
      return "02";
    case "振替休日":
      return "03";
    default:
      return "";
  }
}

function ymd8ToLine(dateStr: string) {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}
