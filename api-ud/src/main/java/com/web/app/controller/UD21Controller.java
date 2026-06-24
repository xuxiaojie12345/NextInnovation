package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD21Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ud21")
public class UD21Controller {

    private static final Logger logger = LoggerFactory.getLogger(UD21Controller.class);

    @Autowired
    private UD21Service ud21Service;

    @GetMapping("/getmarket")
    public ApiResponse<List<Map<String, String>>> getMarket() {
        logger.info("UD21GetMarketApi called");
        try {
            return ApiResponse.success(ud21Service.getMarket());
        } catch (Exception e) {
            logger.error("UD21GetMarketApi error", e);
            return ApiResponse.serverError();
        }
    }
}
