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
}
