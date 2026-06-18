package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocAdcaChange;
import com.web.app.service.UD16Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * UD16 Controller
 * 提供AD Change的检查、添加、删除API接口
 */
@Slf4j
@RestController
@RequestMapping("/api/ud16")
@CrossOrigin(
    origins = "*",
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class UD16Controller {

    @Autowired
    private UD16Service ud16Service;

    /**
     * 检查AD Change记录
     * GET /api/ud16/check?serieChnr=xxx
     */
    @GetMapping("/check")
    public ResponseEntity<ApiResponse<?>> checkADChange(@RequestParam String serieChnr) {
        log.info("========== UD16 Controller: Check AD Change ==========");
        log.info("serieChnr: {}", serieChnr);

        HdocAdcaChange request = new HdocAdcaChange();
        request.setSerieChnr(serieChnr);

        ApiResponse<?> response = ud16Service.checkADChange(request);

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD16 Controller: Check completed ==========");

        return ResponseEntity.ok(response);
    }

    /**
     * 添加AD Change记录
     * POST /api/ud16/add
     */
    @PostMapping("/add")
    public ResponseEntity<ApiResponse<?>> addADChange(@RequestBody HdocAdcaChange request) {
        log.info("========== UD16 Controller: Add AD Change ==========");
        log.info("serieChnr: {}, desc: {}", request.getSerieChnr(), request.getDesc());

        ApiResponse<?> response = ud16Service.addADChange(request);

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD16 Controller: Add completed ==========");

        return ResponseEntity.ok(response);
    }

    /**
     * 删除AD Change记录
     * DELETE /api/ud16/delete
     */
    @DeleteMapping("/delete")
    public ResponseEntity<ApiResponse<?>> deleteADChange(@RequestBody HdocAdcaChange request) {
        log.info("========== UD16 Controller: Delete AD Change ==========");
        log.info("serieChnr: {}", request.getSerieChnr());

        ApiResponse<?> response = ud16Service.deleteADChange(request);

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD16 Controller: Delete completed ==========");

        return ResponseEntity.ok(response);
    }
}
