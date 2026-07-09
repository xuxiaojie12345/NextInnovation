package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocSendDataVinPlate;
import com.web.app.service.UD15Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * UD15 Controller
 * 提供VIN Plate信息的查看、重新生成、设置OK、切换类型API接口
 */
@Slf4j
@RestController
@RequestMapping("/api/ud15")
@CrossOrigin(
    origins = "*",
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class UD15Controller {

    @Autowired
    private UD15Service ud15Service;

    /**
     * 查看VIN Plate信息
     * POST /api/ud15/viewinfo
     *
     * @param request 请求参数（chassisNumber）
     * @return API响应
     */
    @PostMapping("/viewinfo")
    public ResponseEntity<ApiResponse<?>> viewInfo(@RequestBody HdocSendDataVinPlate request) {

        ApiResponse<?> response = ud15Service.viewInfo(request);

        return ResponseEntity.ok(response);
    }

    /**
     * 设置重新生成
     * PUT /api/ud15/setregenerate
     *
     * @param request 请求参数（chassisNumber）
     * @return API响应
     */
    @PostMapping("/setregenerate")
    public ResponseEntity<ApiResponse<?>> setRegenerate(@RequestBody HdocSendDataVinPlate request) {

        ApiResponse<?> response = ud15Service.setRegenerate(request);

        return ResponseEntity.ok(response);
    }

    /**
     * 设置OK
     * PUT /api/ud15/setok
     *
     * @param request 请求参数（chassisNumber）
     * @return API响应
     */
    @PostMapping("/setok")
    public ResponseEntity<ApiResponse<?>> setOk(@RequestBody HdocSendDataVinPlate request) {

        ApiResponse<?> response = ud15Service.setOk(request);

        return ResponseEntity.ok(response);
    }

    /**
     * 切换到基础信息
     * PUT /api/ud15/changetobasicinfo
     *
     * @param request 请求参数（chassisNumber）
     * @return API响应
     */
    @PostMapping("/changetobasicinfo")
    public ResponseEntity<ApiResponse<?>> changeToBasicInfo(@RequestBody HdocSendDataVinPlate request) {

        ApiResponse<?> response = ud15Service.changeToBasicInfo(request);

        return ResponseEntity.ok(response);
    }

    /**
     * 切换到高级信息
     * PUT /api/ud15/changetoadvancedinfo
     *
     * @param request 请求参数（chassisNumber）
     * @return API响应
     */
    @PostMapping("/changetoadvancedinfo")
    public ResponseEntity<ApiResponse<?>> changeToAdvancedInfo(@RequestBody HdocSendDataVinPlate request) {

        ApiResponse<?> response = ud15Service.changeToAdvancedInfo(request);

        return ResponseEntity.ok(response);
    }
}
