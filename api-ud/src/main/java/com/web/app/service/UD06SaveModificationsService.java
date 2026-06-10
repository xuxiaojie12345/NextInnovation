package com.web.app.service;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD06SaveModificationsRequest;
import com.web.app.domain.UD06SaveModificationsResponse;

/**
 * UD06 Save Modifications Service
 * 用于查询和返回最新的Modify情报
 */
public interface UD06SaveModificationsService {
    
    /**
     * 根据Chassis series和Chassis no查询最新的Modify情报
     * 
     * @param request 请求对象，包含chassisSerie和chassisNo
     * @return API响应，包含最新的Modify情报
     */
    ApiResponse<UD06SaveModificationsResponse> saveModifications(UD06SaveModificationsRequest request);
}
