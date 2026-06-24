package com.web.app.mapper;

import com.web.app.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户Mapper接口
 */
@Mapper
public interface UserMapper {

    /**
     * 根据用户ID查询用户
     */
    User selectByUserId(@Param("userId") String userId);

    /**
     * 动态条件查询用户
     * userId/password 有值时作为条件，无值时忽略
     */
    User selectByCondition(@Param("userId") String userId, @Param("password") String password);
}
