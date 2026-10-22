/**
 * プロジェクトの「略称」を組み立てる。
 * 顧客の1番目の文字 ＋「・」＋ 案件 ＋「・」＋ チーム ＋「・」＋ Subチーム
 * ※自動生成のみ（画面からは編集不可）
 * ※チーム / Subチーム は任意入力のため、未入力の項目は連結しない
 */
export const buildProjectAbbr = (
  customer: string,
  caseName: string,
  team: string,
  subTeam: string,
): string =>
  [customer.trim().charAt(0), caseName.trim(), team.trim(), subTeam.trim()]
    .filter((part) => part !== '')
    .join('・');
