package com.web.app.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * UD03 Select Hdocdocumentlist Response Data
 * 封装文档类型列表数据
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UD03SelectHdocdocumentlistResponse {
    
    /**
     * 文档类型列表
     */
    private List<String> doctypeList;
}
