package com.web.app.mapper;

import com.web.app.domain.ModifyDocumentQueryResponse.VariableInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD05数据访问层
 * 对应详细设计：DES-ModifyDocument-001
 *
 * 根据serie和chno关联查询
 * HDOC_ADCA_MODIFICATION（左连接）HDOC_VARIABLES，获取变量信息。
 * 若HDOC_ADCA_MODIFICATION中不存在对应变量，则Current value和Modified value均为空。
 */
@Mapper
/**

 * UD05Mapper

 */

public interface UD05Mapper {

    /**
     * UD05SelectVariableModification
     * 根据serie和chno查询变量修改信息
     *
     * @param serie 底盘系列号
     * @param chno  底盘编号
     * @return 变量信息列表
     */
    List<VariableInfo> selectVariableModification(
            @Param("serie") String serie,
            @Param("chno") String chno);

    /**
     * UD05UpdateHdocAdcaModification
     * 更新HDOC_ADCA_MODIFICATION表的NEWVAL字段
     *
     * @param serie         底盘系列号
     * @param chno          底盘编号
     * @param variable      变量名
     * @param modifiedValue 修改后的值
     * @return 更新记录数
     */
    int updateHdocAdcaModification(
            @Param("serie") String serie,
            @Param("chno") String chno,
            @Param("variable") String variable,
            @Param("modifiedValue") String modifiedValue,
            @Param("updateUser") String updateUser);
}
