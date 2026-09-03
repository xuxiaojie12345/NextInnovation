package com.web.app.mapper;

import com.web.app.domain.entity.HdocUserInfor;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * ユーザーデータアクセス層
 * ユーザー情報のDB照会を行う
 */
@Mapper
public interface HdocUserInforMapper {

    /**
     * ログイン認証：ユーザーIDとパスワードでユーザー情報を照会する
     *
     * @param userId   ユーザーID
     * @param password パスワード
     * @return HdocUserInfor ユーザー情報（存在しない場合null）
     */
    HdocUserInfor login(@Param("userId") String userId, @Param("password") String password);
}
