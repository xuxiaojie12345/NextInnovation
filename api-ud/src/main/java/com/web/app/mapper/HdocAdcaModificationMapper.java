package com.web.app.mapper;

import com.web.app.domain.VariableModificationItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * HDOC_ADCA_MODIFICATION Mapper接口
 */
@Mapper
public interface HdocAdcaModificationMapper {

    /**
     * 根据系列编号和底盘号查询变量修改信息
     * SQL: SELECT variables.DESCRIPTION, modification.VARIABLE, modification.NEWVAL
     *      FROM HDOC_VARIABLES variables LEFT JOIN HDOC_ADCA_MODIFICATION modification
     *      ON variables.VARIABLE = modification.VARIABLE
     *      WHERE modification.SERIE = #{serie} AND modification.CHNO = #{chno}
     *
     * @param serie 系列编号
     * @param chno  底盘号
     * @return 变量修改信息列表
     */
    List<VariableModificationItem> selectBySerieAndChno(@Param("serie") String serie, @Param("chno") String chno);

    /**
     * 更新指定变量的NEWVAL值，同时记录更新时间、更新用户和更新程序
     *
     * @param serie       系列编号
     * @param chno        底盘号
     * @param variable    变量名
     * @param newValue    新值
     * @param updateUser  更新用户
     * @return 更新记录数
     */
    int updateNewVal(@Param("serie") String serie, @Param("chno") String chno,
                     @Param("variable") String variable, @Param("newValue") String newValue,
                     @Param("updateUser") String updateUser);

    /**
     * UD06 - 查询修改详情
     * SELECT DOCTYPE, VERS, CONCAT(VARIABLE, ' ', NEWVAL) AS Storing
     * FROM HDOC_ADCA_MODIFICATION WHERE SERIE = #{serie} AND CHNO = #{chno}
     *
     * @param serie 系列编号
     * @param chno  底盘号
     * @return 修改详情列表
     */
    List<java.util.LinkedHashMap<String, Object>> selectModificationDetails(@Param("serie") String serie, @Param("chno") String chno);
}
