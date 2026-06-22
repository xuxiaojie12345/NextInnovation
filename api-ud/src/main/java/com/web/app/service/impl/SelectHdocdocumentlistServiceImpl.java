package com.web.app.service.impl;

import com.web.app.dto.CommonResponse;
import com.web.app.entity.HdocDocumentList;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.SelectHdocdocumentlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD03 - 文档类型查询服务实现类
 */
@Service
public class SelectHdocdocumentlistServiceImpl implements SelectHdocdocumentlistService {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    public CommonResponse selectHdocdocumentlist() {
        List<HdocDocumentList> documentTypes = hdocDocumentListMapper.selectAllDocumentTypes();
        System.out.print("-----------------------"+documentTypes+"-----------------------");

        if (documentTypes == null || documentTypes.isEmpty()) {
            return CommonResponse.error("Chassis no is not exists");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("documentTypes", documentTypes);

        return CommonResponse.success("查询成功", data);
    }
}
