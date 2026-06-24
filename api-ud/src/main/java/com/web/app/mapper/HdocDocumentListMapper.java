package com.web.app.mapper;

import com.web.app.entity.HdocDocumentList;
import com.web.app.dto.SelectGenerateDocumentResponse;
import com.web.app.dto.VehicleSpecificationResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface HdocDocumentListMapper {
    List<HdocDocumentList> selectAllDocumentList();
    HdocDocumentList selectByDoctype(@Param("doctype") String doctype);
    int updateByDoctype(HdocDocumentList record);
}
