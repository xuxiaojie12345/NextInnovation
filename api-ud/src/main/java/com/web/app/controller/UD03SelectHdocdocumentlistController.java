package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD03SelectHdocdocumentlistResponse;
import com.web.app.service.UD03SelectHdocdocumentlistService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * UD03 Select Hdocdocumentlist Controller
 * 接收前端POST请求，调用业务层处理查询逻辑
 */
@Slf4j
@RestController
@RequestMapping("/api/UD03")
@CrossOrigin(origins = "*")
public class UD03SelectHdocdocumentlistController {
    
    @Autowired
    private UD03SelectHdocdocumentlistService ud03SelectHdocdocumentlistService;
    
    /**
     * 查询所有文档类型列表
     * 
     * @return API响应，包含文档类型列表
     */
    @PostMapping("/selectHdocdocumentlist")
    public ResponseEntity<ApiResponse<UD03SelectHdocdocumentlistResponse>> selectHdocdocumentlist() {
        
        // 4.3 调用Service层处理业务逻辑
        ApiResponse<UD03SelectHdocdocumentlistResponse> response = 
                ud03SelectHdocdocumentlistService.selectHdocdocumentlist();
        
        return ResponseEntity.ok(response);
    }
}
