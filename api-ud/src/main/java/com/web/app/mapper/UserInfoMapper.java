package com.web.app.mapper;

import com.web.app.domain.entity.UserInfo;
import org.apache.ibatis.annotations.Param;

/**
 * 用户信息Mapper接口
 */
public interface UserInfoMapper {
    
    /**
     * 根据用户ID和密码查询用户信息
     * 
     * @param userid 用户ID(大写)
     * @param password 密码
     * @return 用户信息,如果不存在返回null
     */
    UserInfo findByUserIdAndPassword(@Param("userid") String userid, @Param("password") String password);
}
