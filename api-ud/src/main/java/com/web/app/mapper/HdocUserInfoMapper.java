package com.web.app.mapper;

import com.web.app.entity.HdocUserInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * HDOC用户信息数据访问层
 * 对应SQL：5.1 - selectUserByLoginParam
 */
@Mapper
public interface HdocUserInfoMapper {
    
    /**
     * 根据登录参数查询用户信息
     * 对应SQL文件中的 5.1 - selectUserByLoginParam
     * 
     * @param userId 用户ID
     * @param username 用户名（其他画面调用时可能传递）
     * @param password 密码
     * @return 用户信息
     */
    HdocUserInfo selectUserByLoginParam(
        @Param("userId") String userId,
        @Param("username") String username,
        @Param("password") String password
    );
}
