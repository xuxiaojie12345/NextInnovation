package com.web.app.mapper;

import com.web.app.entity.HdocUserInfor;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 登录数据访问层
 */
public interface LoginMapper {
    /**
     * 根据用户ID和密码查询用户信息
     * @param userId 用户ID
     * @param password 密码
     * @return 用户信息
     */
    HdocUserInfor findByUserIdAndPassword(@Param("userId") String userId, @Param("password") String password);
}