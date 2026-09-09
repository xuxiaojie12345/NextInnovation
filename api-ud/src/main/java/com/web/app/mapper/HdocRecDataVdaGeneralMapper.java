package com.web.app.mapper;

import com.web.app.dto.UD04SelectGeneratedocumentData;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * VDA 一般データアクセス層
 * Chassis 関連データのDB照会を行う
 */
@Mapper
public interface HdocRecDataVdaGeneralMapper {

    /**
     * Chassis 関連データを取得する
     *
     * @param series    シャーシシリーズ
     * @param chassisNo シャーシNo
     * @return UD04SelectGeneratedocumentData Chassis 関連データ（存在しない場合null）
     */
    UD04SelectGeneratedocumentData getChassisData(@Param("series") String series,
                                                  @Param("chassisNo") String chassisNo);
}
