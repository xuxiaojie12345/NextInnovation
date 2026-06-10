package com.web.app.mapper;

import com.web.app.domain.UD06SaveModificationsResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD06 Save Modifications Mapper
 * 用于查询HDOC_ADCA_MODIFICATION表的Modify情报
 */
@Mapper
public interface HdocModificationsMapper {
    
    /**
     * 根据Chassis series和Chassis no查询最新的Modify情报
     * 
     * @param chassisSerie Chassis series (底盘系列号)
     * @param chassisNo Chassis no (底盘号码)
     * @return Modify情报列表（按UPDATE_DATETIME降序排列，取第一条）
     */
    List<UD06SaveModificationsResponse.ModificationItem> selectLatestModification(
            @Param("chassisSerie") String chassisSerie,
            @Param("chassisNo") String chassisNo
    );
}
