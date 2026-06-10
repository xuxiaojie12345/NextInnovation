package com.web.app.mapper;
import com.web.app.domain.Entity.UserInfo;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserInfoMapper {
    UserInfo selectUserById(String userId);
}