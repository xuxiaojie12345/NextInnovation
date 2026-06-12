package com.web.app.mapper;

import org.springframework.stereotype.Repository;
import com.web.app.entity.HdocDocumentList;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Repository
public interface HdocDocumentListMapper {
    List<HdocDocumentList> selectAllDoctype();
    HdocDocumentList selectByDoctype(@Param("doctype") String doctype);
    int updateByDoctype(HdocDocumentList record);
}
