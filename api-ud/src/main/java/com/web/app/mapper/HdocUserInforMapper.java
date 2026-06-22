package com.web.app.mapper;

import com.web.app.entity.HdocUserInfor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户信息Mapper接口
 */
@Mapper
public interface HdocUserInforMapper {
    
    /**
     * 根据用户ID查询用户信息
     * @param userId 用户ID
     * @param password 密码（可选）
     * @return 用户信息
     */
    HdocUserInfor selectByUserId(@Param("userId") String userId, 
                                  @Param("password") String password);
}
