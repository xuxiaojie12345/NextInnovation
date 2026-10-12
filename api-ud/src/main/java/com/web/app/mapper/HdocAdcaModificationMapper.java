package com.web.app.mapper;

import com.web.app.dto.UD05SelectVariableModificationItem;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * ADCA Modification データアクセス層
 * ModifyDocument の一覧取得・修正値更新のDBアクセスを行う
 */
@Mapper
public interface HdocAdcaModificationMapper {

    /**
     * ModifyDocument 一覧を取得する
     *
     * @param chassisSeries シャーシシリーズ
     * @param chassisNo     シャーシNo
     * @return List&lt;UD05SelectVariableModificationItem&gt; ModifyDocument 一覧（存在しない場合null）
     */
    List<UD05SelectVariableModificationItem> getModifyDocument(@Param("chassisSeries") String chassisSeries,
                                                               @Param("chassisNo") String chassisNo);

    /**
     * ModifyDocument の修正値を更新する
     *
     * @param userId        更新ユーザーID
     * @param chassisSeries シャーシシリーズ
     * @param chassisNo     シャーシNo
     * @param modifiedValue 修正値
     * @return int 更新件数
     */
    int updateModifyDocument(@Param("userId") String userId,
                             @Param("chassisSeries") String chassisSeries,
                             @Param("chassisNo") String chassisNo,
                             @Param("modifiedValue") String modifiedValue);
}
