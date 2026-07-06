import mysql from 'mysql2/promise';

// 数据库配置 - application-dev.yml
const DB_CONFIG = {
  host: process.env.DB_HOST || '172.17.0.63',
  port: 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'react_ud',
};

/** 获取数据库连接 */
export async function getConnection() {
  return await mysql.createConnection(DB_CONFIG);
}

/** 执行 SQL 并返回结果行 */
export async function query(sql: string, params: any[] = []) {
  const conn = await getConnection();
  try {
    const [rows] = await conn.execute(sql, params);
    return rows as any[];
  } finally {
    await conn.end();
  }
}

/** 查询单行记录 */
export async function queryOne(sql: string, params: any[] = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/** 执行 SQL（INSERT/UPDATE/DELETE），返回影响行数 */
export async function execute(sql: string, params: any[] = []) {
  const conn = await getConnection();
  try {
    const [result] = await conn.execute(sql, params);
    return (result as mysql.ResultSetHeader).affectedRows;
  } finally {
    await conn.end();
  }
}
