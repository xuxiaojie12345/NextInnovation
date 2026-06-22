package com.web.app.service;

import com.web.app.dto.UD06SaveModificationsRequest;
import com.web.app.dto.UD06SaveModificationsResponse;

/**
 * UD06 - Save Modifications查询服务接口
 */
public interface UD06SaveModificationsService {

    /**
     * 查询HDoc ADCA Modification信息
     */
    UD06SaveModificationsResponse selectHdocAdcaModification(UD06SaveModificationsRequest request);
}
