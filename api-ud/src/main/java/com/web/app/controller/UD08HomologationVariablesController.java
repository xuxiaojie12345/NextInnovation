package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD08HomologationVariablesService;
import com.web.app.service.UD01AuthenticationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class UD08HomologationVariablesController {

    @Autowired
    private UD08HomologationVariablesService homologationVariablesService;

    @PostMapping("/ud08/selectproductclassmaster")
    public ResponseEntity<ApiResponse<List<PcListResponse>>> selectProductClassMaster() {
        List<PcListResponse> list = homologationVariablesService.selectProductClassMaster();
        return ResponseEntity.ok(ApiResponse.success("数据获取成功", list));
    }

    @PostMapping("/ud08/selectmarketmaster")
    public ResponseEntity<ApiResponse<List<MarketListResponse>>> selectMarketMaster() {
        List<MarketListResponse> list = homologationVariablesService.selectMarketMaster();
        return ResponseEntity.ok(ApiResponse.success("数据获取成功", list));
    }

    @PostMapping("/ud08/selecthdocvariables")
    public ResponseEntity<ApiResponse<HdocVariablesResponse>> selectHdocVariables(
        @RequestBody HdocVariablesResponse request) {
        HdocVariablesResponse response = homologationVariablesService.selectHdocVariables(request.getVariable());
        return ResponseEntity.ok(ApiResponse.success("数据获取成功", response));
    }

    @PostMapping("/ud08/update")
    public ResponseEntity<ApiResponse<Void>> update(@RequestBody Ud08UpdateRequest request) {
        homologationVariablesService.updateHdocUserDefinedRules(request);
        return ResponseEntity.ok(ApiResponse.success("数据更新成功", null));
    }

    @PostMapping("/ud08/add")
    public ResponseEntity<ApiResponse<Void>> add(@RequestBody Ud08AddRequest request) {
        homologationVariablesService.addHdocUserDefinedRules(request);
        return ResponseEntity.ok(ApiResponse.success("数据登录成功", null));
    }

    @PostMapping("/ud08/delete")
    public ResponseEntity<ApiResponse<Void>> delete(@RequestBody Ud08DeleteRequest request) {
        homologationVariablesService.deleteHdocUserDefinedRules(request);
        return ResponseEntity.ok(ApiResponse.success("数据删除成功", null));
    }
}
