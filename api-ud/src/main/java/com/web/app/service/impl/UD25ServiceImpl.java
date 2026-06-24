package com.web.app.service.impl;

import com.web.app.domain.UD25UserInfoResponse;
import com.web.app.domain.entity.UserInfo;
import com.web.app.mapper.UserInfoMapper;
import com.web.app.service.UD25Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * UD25EduUserViewApi 服务实现类
 * 对应详细设计：详细设计/詳細設計UD25.md
 *
 * 功能：根据Userid从HDOC_USER_INFOR表检索用户详细信息
 */
@Service
public class UD25ServiceImpl implements UD25Service {

    @Autowired
    private UserInfoMapper userInfoMapper;

    /**
     * 根据用户ID查询用户详细信息
     * SQL：SELECT Userid, Responsible, `User Position`, `E-mail`
     *      FROM HDOC_USER_INFOR WHERE Userid = #{userid}
     *
     * @param userId 用户ID
     * @return 用户详细信息，不存在时返回null
     */
    @Override
    public UD25UserInfoResponse getUserInfo(String userId) {
        // 调用Mapper层根据用户ID查询
        UserInfo userInfo = userInfoMapper.findByUserId(userId);

        if (userInfo == null) {
            return null;
        }

        // 将实体数据映射为前端需要的响应格式
        UD25UserInfoResponse response = new UD25UserInfoResponse();
        response.setUserid(userInfo.getUserid());
        response.setResponsible(userInfo.getResponsible());
        response.setUserPosition(userInfo.getUserposition());
        response.setEmail(userInfo.getEmail());

        return response;
    }
}
