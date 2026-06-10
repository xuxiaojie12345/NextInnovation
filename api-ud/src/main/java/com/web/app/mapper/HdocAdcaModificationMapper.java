package com.web.app.mapper;

import com.web.app.domain.UD05ModifyDocumentResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD05 Modify Document Mapper
 * 用于查询和更新修改文档相关数据
 */
@Mapper
public interface HdocAdcaModificationMapper {
    
    /**
     * 根据Chassis series和Chassis no查询Variant信息
     * 
     * @param chassisSeries Chassis series (底盘系列号)
     * @param chassisNo Chassis no (底盘号码)
     * @return Variant信息列表
     */
    List<UD05ModifyDocumentResponse.VariableItem> selectVariantInfo(
            @Param("chassisSeries") String chassisSeries,
            @Param("chassisNo") String chassisNo
    );
    
    /**
     * 更新HDOC_ADCA_MODIFICATION表的NEWVAL字段
     * 
     * @param chassisSeries Chassis series (底盘系列号)
     * @param chassisNo Chassis no (底盘号码)
     * @param variable 变量名
     * @param newval 新值
     * @param updateUser 更新用户
     * @return 更新的记录数
     */
    int updateNewval(
            @Param("chassisSeries") String chassisSeries,
            @Param("chassisNo") String chassisNo,
            @Param("variable") String variable,
            @Param("newval") String newval,
            @Param("updateUser") String updateUser
    );
}
