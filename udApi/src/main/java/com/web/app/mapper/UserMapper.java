package com.web.app.mapper;

import com.web.app.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户Mapper接口
 */
@Mapper
public interface UserMapper {

    /**
     * 根据用户名查询用户
     * @param username 用户名
     * @return 用户信息
     */
    User findByUsername(@Param("username") String username);

    /**
     * 根据用户ID查询用户
     * @param id 用户ID
     * @return 用户信息
     */
    User findById(@Param("id") Long id);

    /**
     * 插入用户
     * @param user 用户信息
     * @return 影响行数
     */
    int insert(User user);
}
