package com.web.app.mapper;

import com.web.app.entity.UD06SaveModificationsVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * UD06 保存修改内容数据访问层
 *
 * 功能说明：查询 HDOC_ADCA_MODIFICATION 表中的保存修改内容数据
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-22
 */
@Mapper
public interface UD06SaveModificationsMapper {

    /**
     * 查询保存修改内容的核心数据
     *
     * @param chassisSerie 底盘系列
     * @param chassisNo    底盘编号
     * @param variables    变量名列表（可选，用于精确匹配修改项）
     * @return 保存修改内容视图对象列表
     */
    List<UD06SaveModificationsVO> selectHdocAdcaModification(
            @Param("chassisSerie") String chassisSerie,
            @Param("chassisNo") String chassisNo,
            @Param("variables") List<String> variables);
}
