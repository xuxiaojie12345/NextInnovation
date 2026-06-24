package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD22Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ud22")
public class UD22Controller {

    private static final Logger logger = LoggerFactory.getLogger(UD22Controller.class);

    @Autowired
    private UD22Service ud22Service;

    @GetMapping("/getdocumenttypes")
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
