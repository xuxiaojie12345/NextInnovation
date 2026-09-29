package com.web.app.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;
import java.util.Date;

/**
 * 用户功能权限实体类
 * 对应数据库表：HDOC_FUNCTION_AUTH（用户功能权限表）
 *
 * @author GitHub Copilot
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HdocFunctionAuth implements Serializable {

  /** 序列化版本号 */
  private static final long serialVersionUID = 1L;

  /** 用户ID（主键） */
  private String userid;

  /** 功能权限（主键） */
  private String function;

  /** 注册时间 */
  private Date registerDatetime;

  /** 注册用户 */
  private String registerUser;

  /** 注册程序 */
  private String registerProcess;

  /** 更新时间 */
  private Date updateDatetime;

  /** 更新用户 */
  private String updateUser;

  /** 更新程序 */
  private String updateProcess;
}
