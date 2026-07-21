package com.web.app.mapper;

import com.web.app.entity.UserInfo;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface UserInfoMapper {
    UserInfo selectByUserId(@Param("userId") String userId);
    UserInfo selectByUserIdAndPassword(@Param("userId") String userId, @Param("password") String password);
    List<UserInfo> selectByCondition(@Param("userId") String userId, @Param("userName") String userName,
        @Param("market") String market);
}
