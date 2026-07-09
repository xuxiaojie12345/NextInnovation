package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface UD20Mapper {
    List<Map<String, Object>> selectHdocDocumentList(
        @Param("documentType") String documentType,
        @Param("documentTypeOp") String documentTypeOp,
        @Param("user") String user,
        @Param("userOp") String userOp,
        @Param("date") String date,
        @Param("dateOp") String dateOp
    );
}
