package com.web.app.service;

import com.web.app.dto.UD16ADChangeRequest;
import com.web.app.dto.UD16ADChangeResponse;

/**
 * UD16 - AD Change操作服务接口
 */
public interface UD16ADChangeService {

    /**
     * 检查ADCA Change
     */
    UD16ADChangeResponse selectHdocAdcaChange(UD16ADChangeRequest request);

    /**
     * 追加ADCA Change
     */
    UD16ADChangeResponse insertHdocAdcaChange(UD16ADChangeRequest request);

    /**
     * 删除ADCA Change（逻辑删除）
     */
    UD16ADChangeResponse updateHdocAdcaChange(UD16ADChangeRequest request);
}
