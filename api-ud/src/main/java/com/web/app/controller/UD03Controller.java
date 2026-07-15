package com.web.app.controller;

import com.web.app.domain.entity.DocumentType;
import com.web.app.service.UD03Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * UD03控制器
 * 提供UD03SelectHdocdocumentlistApi接口 - 查询HDOC_DOCUMENT_LIST表全检索
 */
@RestController
@RequestMapping("/api")
/**

 * UD03Controller

 */

public class UD03Controller {

    @Autowired
    /** ud03Service */

    private UD03Service ud03Service;

    /**
     * 查询HDOC_DOCUMENT_LIST表 - 全检索API
     * UD03SelectHdocdocumentlistApi的主要功能
     *
     * @return 文档类型列表
     */
    @GetMapping("/documenttypes")
    /**

     * selectHdocDocumentList

     */

    public ResponseEntity<List<DocumentType>> selectHdocDocumentList() {
        try {
            List<DocumentType> documentTypes = ud03Service.getAllDocumentTypes();
            return ResponseEntity.ok(documentTypes);
        } catch (Exception e) {
            // 发生异常时返回空列表
            return ResponseEntity.ok(null);
        }
    }
}
