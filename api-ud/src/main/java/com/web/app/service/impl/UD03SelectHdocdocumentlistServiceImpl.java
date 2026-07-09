package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD03SelectHdocdocumentlistResponse;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.UD03SelectHdocdocumentlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * UD03 Select Hdocdocumentlist Service Implementation
 * 实现查询文档类型列表的核心业务逻辑
 */
@Service
public class UD03SelectHdocdocumentlistServiceImpl implements UD03SelectHdocdocumentlistService {
    
    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;
    
    /**
     * 查询所有文档类型列表
     * 
     * @return API响应，包含文档类型列表
     */
    @Override
    public ApiResponse<UD03SelectHdocdocumentlistResponse> selectHdocdocumentlist() {
        
        try {
            // 4.5 调用Mapper执行数据库查询
            List<String> doctypeList = hdocDocumentListMapper.selectDoctypeList();
            
            // 4.6 判断查询结果
            if (doctypeList == null || doctypeList.isEmpty()) {
                // 返回空列表而不是错误，因为表可能确实没有数据
                UD03SelectHdocdocumentlistResponse response = UD03SelectHdocdocumentlistResponse.builder()
                        .doctypeList(doctypeList)
                        .build();
                return ApiResponse.success(response);
            }

            // 4.8 封装响应对象
            UD03SelectHdocdocumentlistResponse response = UD03SelectHdocdocumentlistResponse.builder()
                    .doctypeList(doctypeList)
                    .build();
            
            // 返回成功响应
            return ApiResponse.success(response);
            
        } catch (Exception e) {
            return ApiResponse.error(500, "System error. Please contact administrator.");
        }
    }
}
