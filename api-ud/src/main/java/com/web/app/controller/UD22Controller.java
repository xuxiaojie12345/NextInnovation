package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD22Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ud22")
/**

 * UD22Controller

 */

public class UD22Controller extends BaseController {@Autowired
    /** ud22Service */

    private UD22Service ud22Service;

    @GetMapping("/getdocumenttypes")
    /**

     * getDocumentTypes

     */

    public ApiResponse<List<Map<String, String>>> getDocumentTypes() {
        logger.info("UD22GetDocumentTypesApi called");
        try {
            return ApiResponse.success(ud22Service.getDocumentTypes());
        } catch (Exception e) {
            logger.error("UD22GetDocumentTypesApi error", e);
            return ApiResponse.serverError();
        }
    }
}
