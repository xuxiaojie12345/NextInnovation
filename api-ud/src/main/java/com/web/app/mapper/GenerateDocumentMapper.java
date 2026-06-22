package com.web.app.mapper;

import com.web.app.domain.GenerateDocumentData;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 生成文档数据Mapper接口
 */
@Mapper
public interface GenerateDocumentMapper {

    /**
     * 根据底盘系列和底盘号查询生成文档数据
     * 
     * @param series 底盘系列
     * @param no 底盘号
     * @return 生成文档数据
     */
    GenerateDocumentData selectGenerateDocumentData(@Param("series") String series, @Param("no") String no);
}
