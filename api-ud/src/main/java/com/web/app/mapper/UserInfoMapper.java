package com.web.app.mapper;

import com.web.app.domain.entity.UserInfo;
import org.apache.ibatis.annotations.Param;

/**
 * 用户信息Mapper接口
 */
 /**

  * UserInfoMapper

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

    /**
     * 根据用户ID查询用户详细信息（UD25EduUserViewApi使用）
     * 对应SQL：SELECT Userid, Responsible, `User Position`, `E-mail`
     *         FROM HDOC_USER_INFOR WHERE Userid = #{userid}
     *
     * @param userid 用户ID
     * @return 用户信息,如果不存在返回null
     */
    UserInfo findByUserId(@Param("userid") String userid);
}
