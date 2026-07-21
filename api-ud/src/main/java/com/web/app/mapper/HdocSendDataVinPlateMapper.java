package com.web.app.mapper;

import com.web.app.entity.HdocSendDataVinPlate;
import org.apache.ibatis.annotations.Param;

public interface HdocSendDataVinPlateMapper {
    HdocSendDataVinPlate selectByChassisNo(@Param("chassisNo") String chassisNo);
    int updateStatus(@Param("chassisNo") String chassisNo, @Param("status") String status);
    int updateStatusAndType(@Param("chassisNo") String chassisNo, @Param("status") String status, @Param("type") String type);
}
