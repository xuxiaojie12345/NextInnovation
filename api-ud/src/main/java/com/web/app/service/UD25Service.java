package com.web.app.service;

import com.web.app.domain.UD25UserInfoResponse;

/**
 * UD25EduUserViewApi 服务接口
 * 对应详细设计：详细设计/詳細設計UD25.md
 *
 * 功能：获取用户详细信息
 */
 /**

  * UD25Service

  */

public interface UD25Service {

    /**
     * 根据用户ID查询用户详细信息
     *
     * @param userId 用户ID
     * @return 用户详细信息（userid、responsible、userPosition、email）
     */
    UD25UserInfoResponse getUserInfo(String userId);
}
