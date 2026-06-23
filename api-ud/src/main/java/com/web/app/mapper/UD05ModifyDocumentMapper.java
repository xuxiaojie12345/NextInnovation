package com.web.app.mapper;

import com.web.app.entity.UD05ModifyDocumentVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

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
     * @return 查询结果对象列表
     */
    List<UD05ModifyDocumentVO> selectVariableModification(@Param("chassisSerie") String chassisSerie,
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
     * 根据当前 NEWVAL 查询指定记录
     */
    UD05ModifyDocumentVO selectVariableModificationByCurrentValue(@Param("chassisSerie") String chassisSerie,
                                                                   @Param("chassisNo") String chassisNo,
                                                                   @Param("currentValue") String currentValue);

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

    /**
     * 更新指定变量的 NEWVAL 字段
     *
     * @param chassisSerie 底盘系列
     * @param chassisNo 底盘编号
     * @param variable 变量编码
     * @param currentValue 当前值
     * @param modifiedValue 修改后的新值
     * @return 更新记录数
     */
    int updateHdocAdcaModificationByVariable(@Param("chassisSerie") String chassisSerie,
                                             @Param("chassisNo") String chassisNo,
                                             @Param("variable") String variable,
                                             @Param("currentValue") String currentValue,
                                             @Param("modifiedValue") String modifiedValue);
}
