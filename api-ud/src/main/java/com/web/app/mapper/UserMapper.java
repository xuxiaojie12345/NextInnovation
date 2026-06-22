package com.web.app.mapper;

import com.web.app.domain.UserInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 用户信息Mapper接口
 */
@Mapper
public interface UserMapper {

    /**
     * 根据用户ID和密码查询用户信息
     * 
     * @param userId 用户ID
     * @param password 密码
     * @return 用户信息
     */
    UserInfo selectByUserIdAndPassword(@Param("userId") String userId, @Param("password") String password);

    /**
     * 根据用户ID查询用户信息
     *
     * @param userid 用户ID
     * @return 用户信息Map
     */
    @Select("SELECT USERID, USERNAME FROM hdoc_user_infor WHERE USERID = #{userid}")
    Map<String, Object> selectByUserid(@Param("userid") String userid);

    /**
     * 搜索用户（关联市场权限）
     *
     * @param params 搜索条件
     * @return 用户列表
     */
    List<Map<String, Object>> searchUsers(Map<String, Object> params);
}
