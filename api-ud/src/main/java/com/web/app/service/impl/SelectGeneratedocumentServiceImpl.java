package com.web.app.service.impl;

import com.web.app.dto.SelectGeneratedocumentRequest;
import com.web.app.dto.SelectGeneratedocumentResponse;
import com.web.app.entity.GeneratedocumentQueryResult;
import com.web.app.mapper.UD04GeneratedocumentMapper;
import com.web.app.service.SelectGeneratedocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * UD04 - Generate document查询服务实现类
 */
@Service
public class SelectGeneratedocumentServiceImpl implements SelectGeneratedocumentService {

    @Autowired
    private UD04GeneratedocumentMapper ud04Mapper;

    @Override
    public SelectGeneratedocumentResponse selectGeneratedocument(SelectGeneratedocumentRequest request) {
        SelectGeneratedocumentResponse response = new SelectGeneratedocumentResponse();

        // 4.4 参数校验
        if (request.getChassisNo() == null || request.getChassisNo().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("底盘编号不能为空");
            return response;
        }

        System.out.println("------UD04-1--------------"+request+"-------------");

        // 5.3: 联合查询（OM + VDA_GENERAL + TIRE_MASTER + ADCA_CHANGE + ADCA_MODIFICATION）
        List<GeneratedocumentQueryResult> queryResults = null;
        try {
            queryResults = ud04Mapper.selectGeneratedocument(
                    request.getChassisSeries() != null ? request.getChassisSeries() : "",
                    request.getChassisNo() != null ? request.getChassisNo() : "",
                    request.getDocumentType() != null ? request.getDocumentType() : "");
        } catch (Exception e) {
            queryResults = null;
        }
        System.out.println("------UD04-2--------------"+queryResults+"-------------");

        // 4.6 判断数据是否存在
        if (queryResults == null || queryResults.isEmpty()) {
            response.setCode(404);
            response.setMsg("Chassis no is not exists");
            return response;
        }

        // 取第一行获取单值字段（ORDERNUMBER, BUILD, SPEC, CUSTOMER_ADAP, MARKET, LOAD_INDEX, ACT）
        GeneratedocumentQueryResult firstRow = queryResults.get(0);

        // 4.7 构建响应数据
        SelectGeneratedocumentResponse.SelectGeneratedocumentData data =
                new SelectGeneratedocumentResponse.SelectGeneratedocumentData();

        // 基本信息
        data.setChassisNo(request.getChassisSeries()+"_"+request.getChassisNo());
        data.setOrdernumber(nullToEmpty(firstRow.getOrdernumber()));
        data.setBuildWeek(nullToEmpty(firstRow.getBuild()));
        data.setSpecWeek(nullToEmpty(firstRow.getSpec()));
        data.setMarket(nullToEmpty(firstRow.getMarket()));
        data.setMasterMarket(""); // masterMarket由业务逻辑补充

        // S-Notes（从OM.CUSTOMER_ADAP解析，可能包含多个S-Note用空格分隔）
        List<String> sNotes = new ArrayList<>();
        String sNoteNO = firstRow.getSNoteNO();
        if (sNoteNO != null && !sNoteNO.trim().isEmpty()) {
            String[] parts = sNoteNO.split("\\s+");
            for (String part : parts) {
                if (!part.trim().isEmpty()) {
                    sNotes.add(part.trim());
                }
            }
        }
        data.setSNotes(sNotes);
        data.setSNoteMessage("The S-Notes above can affect homologation documents.");

        // 轮胎指数（SQL中只有LOAD_INDEX一个字段，映射到frontLoadIndex）
        String loadIndex = nullToEmpty(firstRow.getLoadIndex());
        data.setFrontLoadIndex(loadIndex);
        data.setFrontSpeedIndex("");
        data.setDriveLoadIndex("");
        data.setDriveSpeedIndex("");

        // AD Change状态（根据CHANGE.ACT判断）
        boolean hasAdChange = "Y".equals(firstRow.getAct());
        data.setAdChangeEnabled(hasAdChange);
        if (hasAdChange) {
            data.setAdChangeMessage("After def change detected. Document need to be modified.");
        } else {
            data.setAdChangeMessage("");
        }

        // 模板信息（模板文件路径由业务逻辑生成）
        data.setTemplateName("");

        // AD Change替换参数（从查询结果中收集所有VARIABLE，去重）
        List<String> replacedParams = new ArrayList<>();
        for (GeneratedocumentQueryResult row : queryResults) {
            if (row.getVariable() != null && !row.getVariable().isEmpty()
                    && !replacedParams.contains(row.getVariable())) {
                replacedParams.add(row.getVariable());
            }
        }
        data.setReplacedParams(replacedParams);

        // 生成的文件下载链接
        data.setGeneratedFileUrl("/download/vinplate/" + request.getChassisSeries()+"_"+request.getChassisNo() + ".rtf");

        // 系统信息
        data.setDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        data.setHdocVersion("4.2.1");

        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        System.out.println("------UD04-3--------------"+response+"-------------");

        return response;
        
    }

    /**
     * null安全转为空字符串
     */
    private String nullToEmpty(String value) {
        return value != null ? value : "";
    }
}
