import { Department, Personnel, Project } from '../WorkStatus/types';
import { buildProjectAbbr } from '../Project/projectAbbr';

/**
 * 部門マスタのモックデータ（部門管理画面で管理する。部門ID は画面には表示しない）
 * ※協力会社（kind='partner'）は部門と平級の単位。要員の「所属」・
 *   プロジェクトの「所属部門」としては選択できるが、稼働率統計の対象外。
 */
export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'dept-0001', name: '第一開発部' },
  { id: 'dept-0002', name: '第二開発部' },
  { id: 'dept-0003', name: '第三開発部' },
  // 協力会社（＝部門と平級の単位。稼働率統計には含めない）
  { id: 'dept-0004', name: '協力会社A', kind: 'partner' },
];

/**
 * 要員のモックデータ（バックエンド実装までの仮データ）
 * 要員が多いことを想定し、部門（第一〜第三開発部）ごとに複数名を用意する。
 */
export const MOCK_PERSONNEL: Personnel[] = [
  // 第一開発部
  { id: 'p01', employeeNo: '10001', name: '田中 太郎', department: '第一開発部', role: 'T11E03', projectKey: 'pj-0001' },
  { id: 'p02', employeeNo: '10002', name: '佐藤 花子', department: '第一開発部', role: 'T09E01', projectKey: 'pj-0001' },
  { id: 'p03', employeeNo: '10003', name: '鈴木 一郎', department: '第一開発部', role: 'T08E02', projectKey: 'pj-0002' },
  { id: 'p04', employeeNo: '10004', name: '高橋 美咲', department: '第一開発部', role: 'T10E04', projectKey: 'pj-0002' },
  { id: 'p05', employeeNo: '10005', name: '渡辺 大輝', department: '第一開発部', role: 'T09E02', projectKey: 'pj-0003' },
  { id: 'p06', employeeNo: '10006', name: '伊藤 健太', department: '第一開発部', role: 'T11E05', projectKey: 'pj-0001' },
  { id: 'p07', employeeNo: '10007', name: '山本 彩', department: '第一開発部', role: 'T09E03', projectKey: 'pj-0002' },
  { id: 'p08', employeeNo: '10008', name: '中村 拓也', department: '第一開発部', role: 'T08E01', projectKey: 'pj-0002' },
  { id: 'p09', employeeNo: '10009', name: '小林 沙耶', department: '第一開発部', role: 'T07E02', projectKey: 'pj-0003', leavePlan: '2026/10/31' },
  { id: 'p10', employeeNo: '10010', name: '加藤 亮', department: '第一開発部', role: 'T10E01', projectKey: 'pj-0003' },
  // 第二開発部
  { id: 'p11', employeeNo: '10011', name: '吉田 恵', department: '第二開発部', role: 'T12E01', projectKey: 'pj-0003' },
  { id: 'p12', employeeNo: '10012', name: '山田 剛', department: '第二開発部', role: 'T11E02', projectKey: 'pj-0004' },
  { id: 'p13', employeeNo: '10013', name: '松本 芽衣', department: '第二開発部', role: 'T10E03', projectKey: 'pj-0004' },
  { id: 'p14', employeeNo: '10014', name: '井上 翔', department: '第二開発部', role: 'T12E03', projectKey: 'pj-0005' },
  { id: 'p15', employeeNo: '10015', name: '木村 由美', department: '第二開発部', role: 'T11E01', projectKey: 'pj-0004' },
  { id: 'p16', employeeNo: '10016', name: '林 誠', department: '第二開発部', role: 'T09E04', projectKey: 'pj-0004' },
  { id: 'p17', employeeNo: '10017', name: '清水 あや', department: '第二開発部', role: 'T08E03', projectKey: 'pj-0005' },
  { id: 'p18', employeeNo: '10018', name: '森 修平', department: '第二開発部', role: 'T07E01', projectKey: 'pj-0005' },
  { id: 'p19', employeeNo: '10019', name: '山口 直子', department: '第二開発部', role: 'T11E06', projectKey: 'pj-0005' },
  { id: 'p20', employeeNo: '10020', name: '松田 大輔', department: '第二開発部', role: 'T09E05', projectKey: 'pj-0006' },
  // 第三開発部
  { id: 'p21', employeeNo: '10021', name: '斎藤 美穂', department: '第三開発部', role: 'T08E04', projectKey: 'pj-0006' },
  { id: 'p22', employeeNo: '10022', name: '石川 真', department: '第三開発部', role: 'T11E07', projectKey: 'pj-0001' },
  { id: 'p23', employeeNo: '10023', name: '前田 亜美', department: '第三開発部', role: 'T10E02', projectKey: 'pj-0002' },
  { id: 'p24', employeeNo: '10024', name: '藤田 浩', department: '第三開発部', role: 'T08E05', projectKey: 'pj-0003' },
  { id: 'p25', employeeNo: '10025', name: '岡本 千夏', department: '第三開発部', role: 'T07E03', projectKey: 'pj-0006', leavePlan: '2026/11/30' },
  { id: 'p26', employeeNo: '10026', name: '長谷川 舞', department: '第三開発部', role: 'T12E02', projectKey: 'pj-0005' },
  { id: 'p27', employeeNo: '10027', name: '後藤 秀', department: '第三開発部', role: 'T11E08', projectKey: 'pj-0006' },
  { id: 'p28', employeeNo: '10028', name: '小川 結衣', department: '第三開発部', role: 'T09E06', projectKey: 'pj-0006' },
  { id: 'p29', employeeNo: '10029', name: '三浦 陽介', department: '第三開発部', role: 'T08E06', projectKey: 'pj-0006' },
  // 協力会社A（部門と平級の単位。稼働率統計には含めない）
  { id: 'p30', employeeNo: '10030', name: '大塚 拓真', department: '協力会社A', role: 'T09E07', projectKey: 'pj-0007' },
];

/**
 * プロジェクトのモックデータ（バックエンド実装までの仮データ）
 * 略称 は自動生成（顧客の1文字目・案件・チーム・Subチーム）
 */
export const MOCK_PROJECTS: Project[] = [
  {
    key: 'pj-0001',
    id: 'PRJ-0001',
    customer: '桜井商事',
    caseName: '基幹刷新',
    team: '第一',
    subTeam: 'A',
    abbr: buildProjectAbbr('桜井商事', '基幹刷新', '第一', 'A'),
    department: '第一開発部',
    name: '基幹刷新',
  },
  {
    key: 'pj-0002',
    id: 'PRJ-0002',
    customer: '桜井商事',
    caseName: 'EC刷新',
    team: '第二',
    subTeam: 'B',
    abbr: buildProjectAbbr('桜井商事', 'EC刷新', '第二', 'B'),
    department: '第二開発部',
    name: 'EC刷新',
  },
  {
    key: 'pj-0003',
    id: 'PRJ-0003',
    customer: '北斗物流',
    caseName: '業務効率化',
    team: '基盤',
    subTeam: 'A',
    abbr: buildProjectAbbr('北斗物流', '業務効率化', '基盤', 'A'),
    department: '第三開発部',
    name: '業務効率化',
  },
  {
    key: 'pj-0004',
    id: 'PRJ-0004',
    customer: '北斗物流',
    caseName: '保守運用',
    team: '運用',
    subTeam: 'C',
    abbr: buildProjectAbbr('北斗物流', '保守運用', '運用', 'C'),
    department: '第三開発部',
    name: '保守・運用',
  },
  {
    key: 'pj-0005',
    id: 'PRJ-0005',
    customer: 'みなと銀行',
    caseName: '教育研修',
    team: '企画',
    subTeam: 'A',
    abbr: buildProjectAbbr('みなと銀行', '教育研修', '企画', 'A'),
    department: '第二開発部',
    name: '教育・研修',
  },
  {
    // 協力会社の案件（所属部門 = 部門マスタの協力会社）
    key: 'pj-0007',
    id: 'PRJ-0007',
    customer: '桜井商事',
    caseName: '基幹刷新支援',
    team: '協力',
    subTeam: 'A',
    abbr: buildProjectAbbr('桜井商事', '基幹刷新支援', '協力', 'A'),
    department: '協力会社A',
    name: '基幹刷新支援',
  },
  {
    // 内・退職（この項目の要員はグレー表示にする）
    key: 'pj-0006',
    id: '',
    customer: '内',
    caseName: '退職',
    team: '',
    subTeam: '',
    abbr: buildProjectAbbr('内', '退職', '', ''),
    department: '第三開発部',
    name: '内・退職',
  },
];

/**
 * デモ用: 要員ごとの主担当プロジェクト（＝案件所属）
 * （開始済みの週に自動セットする初期値として利用）
 */
export const PERSON_MAIN_PROJECT: Record<string, string> = {};
MOCK_PERSONNEL.forEach((p) => {
  PERSON_MAIN_PROJECT[p.id] = p.projectKey ?? MOCK_PROJECTS[0].key;
});
