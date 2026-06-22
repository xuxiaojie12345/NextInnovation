package com.web.app.mapper;

import com.web.app.entity.UD05ModifyDocumentVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * UD05 修改文档变量数据访问层
 *
 * 功能说明：查询 HDOC_ADCA_MODIFICATION 与 HDOC_VARIABLES，并更新 NEWVAL 字段
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Mapper
public interface UD05ModifyDocumentMapper {

    /**
     * 查询修改文档变量数据
     *
     * @param chassisSerie 底盘系列
     * @param chassisNo 底盘编号
     * @return 查询结果对象
     */
    UD05ModifyDocumentVO selectVariableModification(@Param("chassisSerie") String chassisSerie,
                                                    @Param("chassisNo") String chassisNo);

    /**
     * 查询指定描述的修改文档变量记录
     *
     * @param chassisSerie 底盘系列
     * @param chassisNo 底盘编号
     * @param description 变量描述
     * @return 查询结果对象
     */
    UD05ModifyDocumentVO selectVariableModificationByDescription(@Param("chassisSerie") String chassisSerie,
                                                                  @Param("chassisNo") String chassisNo,
                                                                  @Param("description") String description);

    /**
     * 更新 HDOC_ADCA_MODIFICATION 表中的 NEWVAL 字段
     *
     * @param chassisSerie 底盘系列
     * @param chassisNo 底盘编号
     * @param currentValue 当前值
     * @param modifiedValue 修改后的新值

     * @return 更新记录数
     */
    int updateHdocAdcaModification(@Param("chassisSerie") String chassisSerie,
                                   @Param("chassisNo") String chassisNo,
                                   @Param("currentValue") String currentValue,
                                   @Param("modifiedValue") String modifiedValue);
}
