package com.web.app.mapper;

import com.web.app.domain.entity.HdocDocumentList;

import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * ドキュメントリストデータアクセス層
 * DocumentTypeのDB照会を行う
 */
@Mapper
public interface HdocDocumentListMapper {

    /**
     * DocumentTypeリストを取得する
     *
     * @return List&lt;HdocDocumentList&gt; ドキュメントタイプリスト
     */
    List<HdocDocumentList> getDocumentType();
}
