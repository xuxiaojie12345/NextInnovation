package com.web.app.mapper;

import com.web.app.domain.entity.HdocUserInfor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户Mapper接口
 */
@Mapper
public interface UserMapper {

    /**
     * 根据用户ID查询用户信息
     *
     * @param userId 用户ID
     * @return 用户实体
     */
    HdocUserInfor findByUserId(@Param("userId") String userId);
}
