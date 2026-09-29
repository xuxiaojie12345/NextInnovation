package com.web.app.mapper;

import com.web.app.entity.HdocFunctionAuth;
import com.web.app.entity.HdocUserInfor;
import com.web.app.entity.HdocMarketAuth;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 登录认证数据访问接口
 * 对应详细设计 5.1 AuthenticationApi 的数据库访问层。
 *
 * @author GitHub Copilot
 */
public interface AuthenticationMapper {

  /**
   * 根据用户ID查询用户信息
   * SQL：SELECT ... FROM hdoc_user_infor WHERE USERID = #{userid}
   * 使用参数化查询防止 SQL 注入（详细设计 7.2）。
   *
   * @param userid 用户ID（已 trim）
   * @return 用户信息实体；不存在时返回 null
   */
  HdocUserInfor selectUserByUserid(@Param("userid") String userid);

  /**
   * 查询指定用户的功能权限列表
   *
   * @param userid 用户ID
   * @return 功能权限列表；无数据时返回空列表
   */
  List<HdocFunctionAuth> selectFunctionAuthByUserid(@Param("userid") String userid);

  /**
   * 查询指定用户的市场权限列表
   *
   * @param userid 用户ID
   * @return 市场权限列表；无数据时返回空列表
   */
  List<HdocMarketAuth> selectMarketAuthByUserid(@Param("userid") String userid);
}
