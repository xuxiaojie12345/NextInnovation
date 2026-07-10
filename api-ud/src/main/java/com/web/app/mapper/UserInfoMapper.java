package com.web.app.mapper;

import com.web.app.entity.UserInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserInfoMapper {

  UserInfo findByUseridAndPassword(
      @Param("userid") String userid, @Param("password") String password);
}
