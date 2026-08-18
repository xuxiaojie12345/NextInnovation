package com.web.app.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.web.app.dto.SearchUserRequest;
import com.web.app.dto.SearchUserResponse.UserSearchResult;
import com.web.app.entity.HdocUserInfor;

/**
 * SearchUser 数据访问层
 * 对应后端提示词 5. 数据库设计（SQL 5.2 / 5.3）
 */
public interface SearchUserMapper {

    /**
     * 根据用户ID查询用户信息（用户名校验来源，等价于 AuthenticationApi 数据源）
     * 来源表：hdoc_user_infor
     *
     * @param userid 用户ID
     * @return 用户信息，不存在时返回 null
     */
    HdocUserInfor selectUserByUserid(@Param("userid") String userid);

    /**
     * 根据用户名模糊查询用户列表（User 检索时先取得 Userid）
     * 来源表：hdoc_user_infor
     *
     * @param username 用户名
     * @return 用户信息列表
     */
    List<HdocUserInfor> selectUsersByUsername(@Param("username") String username);

    /**
     * 根据用户ID查询用户 Market 列表
     * 对应 SQL 5.2：SELECT MARKET FROM HDOC_MARKET_AUTH WHERE USERID = #{userId}
     *
     * @param userid 用户ID
     * @return Market 列表
     */
    List<String> selectMarketsByUserid(@Param("userid") String userid);

    /**
     * 按条件检索用户（Market / 权限类型条件动态加载）
     * 对应 SQL 5.3：hdoc_user_infor INNER JOIN HDOC_MARKET_AUTH / HDOC_FUNCTION_AUTH
     * 条件规则：market 为空时取消 market 条件；function=NOT_SET 或为空时取消 function 条件
     *
     * @param request 检索条件
     * @return 检索结果用户列表
     */
    List<UserSearchResult> selectUsersByCondition(SearchUserRequest request);
}
