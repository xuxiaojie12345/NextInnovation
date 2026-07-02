import mysql from 'mysql2/promise';

// 数据库配置 - 优先读环境变量，没有则用默认值
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '你的密码',
  database: process.env.DB_NAME || '你的库名',
};

/**
 * 获取数据库连接
 */
export async function getConnection() {
  return await mysql.createConnection(DB_CONFIG);
}

/**
 * 执行查询并返回结果行
 */
export async function query(sql: string, params: any[] = []) {
  const conn = await getConnection();
  try {
    const [rows] = await conn.execute(sql, params);
    return rows as any[];
  } finally {
    await conn.end();
  }
}

/**
 * 查询单行记录（无结果返回 null）
 */
export async function queryOne(sql: string, params: any[] = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}
