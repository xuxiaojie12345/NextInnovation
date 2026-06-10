-- 创建用户信息表
CREATE TABLE IF NOT EXISTS `user_info` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `USERID` VARCHAR(50) NOT NULL COMMENT '用户ID',
  `PASSWORD` VARCHAR(100) NOT NULL COMMENT '密码',
  `USERNAME` VARCHAR(100) DEFAULT NULL COMMENT '用户名',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `status` TINYINT(1) DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_userid` (`USERID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信息表';

-- 插入测试数据
INSERT INTO `user_info` (`USERID`, `PASSWORD`, `USERNAME`, `email`, `status`) VALUES
('admin', 'admin123', '管理员', 'admin@example.com', 1),
('test001', 'test123', '测试用户', 'test@example.com', 1);
