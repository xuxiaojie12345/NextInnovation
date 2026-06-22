package com.web.app.mapper;

import com.web.app.entity.GeneratedocumentQueryResult;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * UD04 - Generate document查询Mapper接口
 */
@Mapper
public interface UD04GeneratedocumentMapper {

    /**
     * 5.3: 根据Chassis no、Ordernumber、Market联合查询全量信息
     *
     * @param chassisSeries   底盘编号
     * @param chassisNo 订单号
     * @param documentType      市场
     * @return 联合查询结果列表（可能多行，每行对应一个ADCA Modification）
     */
    List<GeneratedocumentQueryResult> selectGeneratedocument(
            @Param("chassisSeries") String chassisSeries,
            @Param("chassisNo") String chassisNo,
            @Param("documentType") String documentType);
}
