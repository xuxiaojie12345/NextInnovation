package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD10SearchRequest;
import com.web.app.domain.entity.HdocVariable;
import com.web.app.service.UD11Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * UD11控制器
 * 提供UD11HdocvariablesApi接口 - HDOC变量列表检索
 * 对应全体APIのプロンプト.txt 【UD11HdocvariablesApi】
 * POST /api/ud11/search
 */
@RestController
@RequestMapping("/api/ud11")
public class UD11Controller {

    private static final Logger logger = LoggerFactory.getLogger(UD11Controller.class);

    @Autowired
    private UD11Service ud11Service;

    /**
     * UD11Search - 根据搜索条件查询HDOC_VARIABLES变量定义列表
     * 支持Variable、Type、Description、Created by user、Date字段的动态条件查询
     * 每个字段配合运算符（= / != / LIKE / NOT LIKE）动态生成条件
     * POST /api/ud11/search
     */
    @PostMapping("/search")
    public ApiResponse<List<HdocVariable>> search(@RequestBody UD10SearchRequest request) {
        logger.info("UD11Search called - variable: {}, type: {}, description: {}, userid: {}",
                request.getVariable(), request.getType(), request.getDescription(), request.getUserid());

        try {
            List<HdocVariable> list = ud11Service.search(request);
            return ApiResponse.success(list);
        } catch (Exception e) {
            logger.error("UD11Search error", e);
            return ApiResponse.serverError();
        }
    }
}
