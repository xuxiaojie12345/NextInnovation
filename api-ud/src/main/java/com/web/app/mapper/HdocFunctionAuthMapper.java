package com.web.app.mapper;

import com.web.app.entity.HdocFunctionAuth;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface HdocFunctionAuthMapper {
    HdocFunctionAuth selectByUserId(@Param("userId") String userId);
    int insertFunctionAuth(HdocFunctionAuth record);
}
