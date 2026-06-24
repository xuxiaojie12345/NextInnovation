package com.web.app.mapper;

import com.web.app.dto.GeneratedDocumentDto;
import com.web.app.dto.ReplacingParameterDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * Generated document 数据访问层
 *
 * @description 查询 UD04 画面所需的文档信息
 */
@Mapper
public interface GeneratedDocumentMapper {

    /**
     * 根据底盘系列和底盘编号查询生成文档数据
     *
     * @param chassisSeries 底盘系列
     * @param chassisNo     底盘编号
     * @return 生成文档 DTO
     */
    GeneratedDocumentDto selectGeneratedDocument(
            @Param("chassisSeries") String chassisSeries,
            @Param("chassisNo") String chassisNo);

    /**
     * 查询替换参数列表
     *
     * @param chassisSeries 底盘系列
     * @param chassisNo     底盘编号
     * @return 替换参数列表
     */
    List<ReplacingParameterDto> selectReplacingParameters(
            @Param("chassisSeries") String chassisSeries,
            @Param("chassisNo") String chassisNo);
}
