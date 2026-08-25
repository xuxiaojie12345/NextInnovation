package com.web.app.mapper;

import com.web.app.entity.HdocUserInfo;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface HdocUserInfoMapper {
    HdocUserInfo selectByUserId(@Param("userId") String userId);
    HdocUserInfo selectByUserIdAndPassword(@Param("userId") String userId, @Param("password") String password);
    List<HdocUserInfo> selectByCondition(@Param("userId") String userId, @Param("userName") String userName,
        @Param("market") String market, @Param("roleType") String roleType);
}
