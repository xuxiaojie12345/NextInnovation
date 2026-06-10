package com.web.app.mapper;

import com.web.app.domain.UD04SelectGeneratedocumentResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * UD04 Generatedocument Mapper
 * 用于查询生成文档相关数据
 */
@Mapper
public interface HdocGeneratedocumentMapper {
    
    /**
     * 根据Chassis series和Chassis no查询生成文档数据
     * 
     * @param chassisSeries Chassis series (底盘系列号)
     * @param chassisNo Chassis no (底盘号码)
     * @return 生成的文档数据
     */
    UD04SelectGeneratedocumentResponse selectGeneratedocument(
            @Param("chassisSeries") String chassisSeries,
            @Param("chassisNo") String chassisNo
    );
}
