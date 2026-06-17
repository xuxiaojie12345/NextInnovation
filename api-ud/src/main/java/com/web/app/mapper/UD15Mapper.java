package com.web.app.mapper;

import com.web.app.domain.Entity.HdocSendDataVinPlate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * UD15 Mapper
 * 用于操作HDOC_SEND_DATA_VIN_PLATE表数据
 */
@Mapper
public interface UD15Mapper {

    /**
     * 根据SERIE和CHNR查询VIN Plate信息
     *
     * @param serie Serie
     * @param chnr  Chassis number
     * @return VIN Plate信息
     */
    HdocSendDataVinPlate selectByChnr(@Param("serie") String serie,
                                      @Param("chnr") String chnr);

    /**
     * 检查记录是否存在
     *
     * @param serie Serie
     * @param chnr  Chassis number
     * @return 记录数量
     */
    int countByChnr(@Param("serie") String serie,
                    @Param("chnr") String chnr);

    /**
     * 更新Status为指定值
     *
     * @param serie        Serie
     * @param chnr         Chassis number
     * @param status       状态值
     * @param updateUser   更新用户
     * @param updateProcess 更新进程
     * @return 影响行数
     */
    int updateStatus(@Param("serie") String serie,
                     @Param("chnr") String chnr,
                     @Param("status") String status,
                     @Param("updateUser") String updateUser,
                     @Param("updateProcess") String updateProcess);

    /**
     * 更新Status和Type
     *
     * @param serie        Serie
     * @param chnr         Chassis number
     * @param status       状态值
     * @param type         类型值
     * @param updateUser   更新用户
     * @param updateProcess 更新进程
     * @return 影响行数
     */
    int updateStatusAndType(@Param("serie") String serie,
                            @Param("chnr") String chnr,
                            @Param("status") String status,
                            @Param("type") String type,
                            @Param("updateUser") String updateUser,
                            @Param("updateProcess") String updateProcess);
}
