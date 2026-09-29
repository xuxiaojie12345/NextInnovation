package com.web.app.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;
import java.util.Date;

/**
 * 用户信息实体类
 * 对应数据库表：hdoc_user_infor（用户信息表）
 * 用于登录认证时查询用户信息
 *
 * @author GitHub Copilot
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HdocUserInfor implements Serializable {

  /** 序列化版本号 */
  private static final long serialVersionUID = 1L;

  /** 用户ID（主键，最大 10 位半角英数字） */
  private String userid;

  /** 密码（主键，最大 100 位） */
  private String password;

  /** 用户名（主键，最大 100 位） */
  private String username;

  /** 担当者姓名 */
  private String responsible;

  /** 职位 */
  private String userposition;

  /** 邮箱（数据库列名为 E-MMAIL，需要转义） */
  private String eMail;

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
