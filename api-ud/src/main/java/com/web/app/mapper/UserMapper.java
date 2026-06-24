package com.web.app.mapper;

import com.web.app.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户数据访问层
 * 
 * @description 提供用户相关的数据库操作
 */
@Mapper
public interface UserMapper {
    
    /**
     * 根据用户名查询用户
     * 
     * @param username 用户名
     * @return 用户实体对象
     */
    User selectByUsername(@Param("username") String username);
    
    /**
     * 根据用户ID查询用户
     * 
     * @param userId 用户ID
     * @return 用户实体对象
     */
    User selectByUserId(@Param("userId") String userId);
    
    /**
     * 插入用户
     * 
     * @param user 用户实体对象
     * @return 影响行数
     */
    int insert(User user);
    
    /**
     * 更新用户信息
     * 
     * @param user 用户实体对象
     * @return 影响行数
     */
    int update(User user);
    
    /**
     * 删除用户
     * 
     * @param userId 用户ID
     * @return 影响行数
     */
    int deleteByUserId(@Param("userId") String userId);
}
