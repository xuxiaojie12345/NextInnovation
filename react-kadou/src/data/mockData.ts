import { Department, Personnel, Project } from '../WorkStatus/types';
import { buildProjectAbbr } from '../Project/projectAbbr';

/**
 * 部門マスタのモックデータ（部門管理画面で管理する。部門ID は画面には表示しない）
 * ※協力会社（kind='partner'）は部門と平級の単位。要員の「所属」・
 *   プロジェクトの「所属部門」としては選択できるが、稼働率統計の対象外。
 */
export const MOCK_DEPARTMENTS: Department[] = [
  { departmentId: 'dept-0001', name: '第一開発部', location: 'JN' },
  { departmentId: 'dept-0002', name: '第二開発部', location: 'JN' },
  { departmentId: 'dept-0003', name: '第三開発部', location: 'JN' },
  // 協力会社（＝部門と平級の単位。稼働率統計には含めない）
  { departmentId: 'dept-0004', name: '協力会社A', location: 'JN', kind: 'partner' },
];

/**
 * 要員のモックデータ（バックエンド実装までの仮データ）
 * 要員が多いことを想定し、部門（第一〜第三開発部）ごとに複数名を用意する。
 */
export const MOCK_PERSONNEL: Personnel[] = [
  // 第一開発部
  { employeeNo: '10001', name: '田中 太郎', departmentId: 'dept-0001', role: 'T11E03' },
  { employeeNo: '10002', name: '佐藤 花子', departmentId: 'dept-0001', role: 'T09E01' },
  { employeeNo: '10003', name: '鈴木 一郎', departmentId: 'dept-0001', role: 'T08E02' },
  { employeeNo: '10004', name: '高橋 美咲', departmentId: 'dept-0001', role: 'T10E04' },
  { employeeNo: '10005', name: '渡辺 大輝', departmentId: 'dept-0001', role: 'T09E02' },
  { employeeNo: '10006', name: '伊藤 健太', departmentId: 'dept-0001', role: 'T11E05' },
  { employeeNo: '10007', name: '山本 彩', departmentId: 'dept-0001', role: 'T09E03' },
  { employeeNo: '10008', name: '中村 拓也', departmentId: 'dept-0001', role: 'T08E01' },
  { employeeNo: '10009', name: '小林 沙耶', departmentId: 'dept-0001', role: 'T07E02', leavePlan: '2026/10/31' },
  { employeeNo: '10010', name: '加藤 亮', departmentId: 'dept-0001', role: 'T10E01' },
  // 第二開発部
  { employeeNo: '10011', name: '吉田 恵', departmentId: 'dept-0002', role: 'T12E01' },
  { employeeNo: '10012', name: '山田 剛', departmentId: 'dept-0002', role: 'T11E02' },
  { employeeNo: '10013', name: '松本 芽衣', departmentId: 'dept-0002', role: 'T10E03' },
  { employeeNo: '10014', name: '井上 翔', departmentId: 'dept-0002', role: 'T12E03' },
  { employeeNo: '10015', name: '木村 由美', departmentId: 'dept-0002', role: 'T11E01' },
  { employeeNo: '10016', name: '林 誠', departmentId: 'dept-0002', role: 'T09E04' },
  { employeeNo: '10017', name: '清水 あや', departmentId: 'dept-0002', role: 'T08E03' },
  { employeeNo: '10018', name: '森 修平', departmentId: 'dept-0002', role: 'T07E01' },
  { employeeNo: '10019', name: '山口 直子', departmentId: 'dept-0002', role: 'T11E06' },
  { employeeNo: '10020', name: '松田 大輔', departmentId: 'dept-0002', role: 'T09E05' },
  // 第三開発部
  { employeeNo: '10021', name: '斎藤 美穂', departmentId: 'dept-0003', role: 'T08E04' },
  { employeeNo: '10022', name: '石川 真', departmentId: 'dept-0003', role: 'T11E07' },
  { employeeNo: '10023', name: '前田 亜美', departmentId: 'dept-0003', role: 'T10E02' },
  { employeeNo: '10024', name: '藤田 浩', departmentId: 'dept-0003', role: 'T08E05' },
  { employeeNo: '10025', name: '岡本 千夏', departmentId: 'dept-0003', role: 'T07E03', leavePlan: '2026/11/30' },
  { employeeNo: '10026', name: '長谷川 舞', departmentId: 'dept-0003', role: 'T12E02' },
  { employeeNo: '10027', name: '後藤 秀', departmentId: 'dept-0003', role: 'T11E08' },
  { employeeNo: '10028', name: '小川 結衣', departmentId: 'dept-0003', role: 'T09E06' },
  { employeeNo: '10029', name: '三浦 陽介', departmentId: 'dept-0003', role: 'T08E06' },
  // 協力会社A（部門と平級の単位。稼働率統計には含めない）
  { employeeNo: '10030', name: '大塚 拓真', departmentId: 'dept-0004', role: 'T09E07' },
];

/**
 * プロジェクトのモックデータ（バックエンド実装までの仮データ）
 * 略称 は自動生成（顧客の1文字目・案件・チーム・Subチーム）
 */
export const MOCK_PROJECTS: Project[] = [
  {
    projectId: 'pj-0001',
    projectCode: 'PRJ-0001',
    customer: '桜井商事',
    caseName: '基幹刷新',
    team: '第一',
    subTeam: 'A',
    abbr: buildProjectAbbr('桜井商事', '基幹刷新', '第一', 'A'),
    departmentId: 'dept-0001',
    name: '基幹刷新',
  },
  {
    projectId: 'pj-0002',
    projectCode: 'PRJ-0002',
    customer: '桜井商事',
    caseName: 'EC刷新',
    team: '第二',
    subTeam: 'B',
    abbr: buildProjectAbbr('桜井商事', 'EC刷新', '第二', 'B'),
    departmentId: 'dept-0002',
    name: 'EC刷新',
  },
  {
    projectId: 'pj-0003',
    projectCode: 'PRJ-0003',
    customer: '北斗物流',
    caseName: '業務効率化',
    team: '基盤',
    subTeam: 'A',
    abbr: buildProjectAbbr('北斗物流', '業務効率化', '基盤', 'A'),
    departmentId: 'dept-0003',
    name: '業務効率化',
  },
  {
    projectId: 'pj-0004',
    projectCode: 'PRJ-0004',
    customer: '北斗物流',
    caseName: '保守運用',
    team: '運用',
    subTeam: 'C',
    abbr: buildProjectAbbr('北斗物流', '保守運用', '運用', 'C'),
    departmentId: 'dept-0003',
    name: '保守・運用',
  },
  {
    projectId: 'pj-0005',
    projectCode: 'PRJ-0005',
    customer: 'みなと銀行',
    caseName: '教育研修',
    team: '企画',
    subTeam: 'A',
    abbr: buildProjectAbbr('みなと銀行', '教育研修', '企画', 'A'),
    departmentId: 'dept-0002',
    name: '教育・研修',
  },
  {
    // 協力会社の案件（所属部門 = 部門マスタの協力会社）
    projectId: 'pj-0007',
    projectCode: 'PRJ-0007',
    customer: '桜井商事',
    caseName: '基幹刷新支援',
    team: '協力',
    subTeam: 'A',
    abbr: buildProjectAbbr('桜井商事', '基幹刷新支援', '協力', 'A'),
    departmentId: 'dept-0004',
    name: '基幹刷新支援',
  },
  {
    // 内・退職（この項目の要員はグレー表示にする）
    projectId: 'pj-0006',
    projectCode: '',
    customer: '内',
    caseName: '退職',
    team: '',
    subTeam: '',
    abbr: buildProjectAbbr('内', '退職', '', ''),
    departmentId: 'dept-0003',
    name: '内・退職',
  },
];

