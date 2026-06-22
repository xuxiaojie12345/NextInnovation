package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD19SearchResultListService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD19_SearchResultList 控制器
 * 提供用户搜索和市场权限查询接口
 */
@RestController
@RequestMapping("/api/searchresultlist")
@Api(tags = "UD19-搜索结果列表（用户）")
public class UD19SearchResultListController {

    private static final Logger logger = LogManager.getLogger(UD19SearchResultListController.class);

    @Autowired
    private UD19SearchResultListService ud19SearchResultListService;

    /**
     * 搜索用户
     *
     * @param userid   用户ID
     * @param user     用户名
     * @param market   市场
     * @param notSet   未配置标志
     * @param rule     规则权限标志
     * @param template 模板权限标志
     * @return 统一响应对象
     */
    @GetMapping("/search")
    @ApiOperation(value = "搜索用户", notes = "根据用户ID、用户名、市场等条件搜索用户及其权限信息")
    public ApiResponse<Map<String, Object>> search(
            @RequestParam(required = false) String userid,
            @RequestParam(required = false) String user,
            @RequestParam(required = false) String market,
            @RequestParam(required = false) String notSet,
            @RequestParam(required = false) String rule,
            @RequestParam(required = false) String template) {

        logger.info("接收到搜索用户请求");

        try {
            Map<String, Object> params = new HashMap<>();
            params.put("userid", userid);
            params.put("username", user);
            params.put("market", market);
            params.put("notSet", notSet);
            params.put("rule", rule);
            params.put("template", template);

            List<Map<String, Object>> users = ud19SearchResultListService.search(params);

            Map<String, Object> data = new HashMap<>();
            data.put("users", users);
            data.put("count", users.size());

            logger.info("搜索用户完成，共{}条记录", users.size());
            return ApiResponse.success("查询成功", data);
        } catch (Exception e) {
            logger.error("搜索用户失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
