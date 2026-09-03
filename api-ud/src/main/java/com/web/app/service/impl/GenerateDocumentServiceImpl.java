package com.web.app.service.impl;

import com.web.app.domain.entity.HdocDocumentList;
import com.web.app.dto.UD03SelectHdocdocumentlistData;
import com.web.app.dto.UD03SelectHdocdocumentlistResponse;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.GenerateDocumentService;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * ドキュメント生成サービス実装クラス（GenerateDocument モジュール）
 * DocumentType取得の業務ロジックを実装する
 */
@Service
public class GenerateDocumentServiceImpl implements GenerateDocumentService {

    private static final Logger logger = LogManager.getLogger(GenerateDocumentServiceImpl.class);

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    /**
     * DocumentType取得処理
     *
     * @return UD03SelectHdocdocumentlistResponse DocumentType取得結果レスポンス
     */
    @Override
    public UD03SelectHdocdocumentlistResponse uD03SelectHdocdocumentlist() {
        UD03SelectHdocdocumentlistResponse response = new UD03SelectHdocdocumentlistResponse();

        logger.info("Calling HdocDocumentListMapper.getDocumentType");

        // HdocDocumentListMapperのgetDocumentTypeメソッドを呼び出し、DB照会を行う
        List<HdocDocumentList> documentList = hdocDocumentListMapper.getDocumentType();

        // ドキュメントタイプリストを構築
        UD03SelectHdocdocumentlistData data = new UD03SelectHdocdocumentlistData();
        List<String> documentTypeList = new ArrayList<>();
        if (documentList != null) {
            for (HdocDocumentList document : documentList) {
                documentTypeList.add(document.getDoctype());
            }
        }
        data.setDocumentTypeList(documentTypeList);

        response.setCode(200);
        response.setMessage("查询成功");
        response.setData(data);

        return response;
    }
}
